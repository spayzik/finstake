<?php
declare(strict_types=1);
/** Storage primitives. Transaction boundaries are owned by the caller. */
final class LeadRepository {
    public function __construct(private PDO $db) {}
    public function byKey(string $key): ?array {
        $s=$this->db->prepare('SELECT id, fingerprint FROM leads WHERE idem_key=?'); $s->execute([$key]);
        $row=$s->fetch(PDO::FETCH_ASSOC); return $row === false ? null : $row;
    }
    public function create(string $id,string $key,string $fingerprint,array $payload,string $now): void {
        $s=$this->db->prepare('INSERT INTO leads (id,idem_key,fingerprint,payload,status,created_at) VALUES (?,?,?,?,?,?)');
        $s->execute([$id,$key,$fingerprint,json_encode($payload,JSON_UNESCAPED_UNICODE|JSON_THROW_ON_ERROR),'NEW',$now]);
    }
}
final class ConsentRepository {
    public function __construct(private PDO $db) {}
    public function create(string $id,array $meta,string $policy,string $now): void {
        $s=$this->db->prepare('INSERT INTO consents (lead_id,policy_version,consent_version,release_id,marketing_version,marketing_choice,accepted_at) VALUES (?,?,?,?,?,?,?)');
        $s->execute([$id,$policy,$meta['lead_consent_version'],$meta['release_id'],$meta['marketing_version']??null,$meta['marketing_consent']??null,$now]);
    }
}
final class TelegramSessionRepository {
    public function __construct(private PDO $db) {}
    public function create(string $id,string $hash,string $expires): void {
        $s=$this->db->prepare('INSERT INTO telegram_sessions (lead_id,token_hash,token_expires_at,step) VALUES (?,?,?,0)'); $s->execute([$id,$hash,$expires]);
    }
    public function consume(string $hash,int $chatId,string $now): ?string {
        $s=$this->db->prepare('SELECT lead_id FROM telegram_sessions WHERE token_hash=? AND token_expires_at>? AND chat_id IS NULL FOR UPDATE'); $s->execute([$hash,$now]); $id=$s->fetchColumn();
        if ($id===false) return null;
        $s=$this->db->prepare('UPDATE telegram_sessions SET token_hash=NULL,chat_id=? WHERE lead_id=? AND chat_id IS NULL'); $s->execute([$chatId,$id]);
        return $s->rowCount()===1 ? (string)$id : null;
    }
}
final class TelegramUpdateRepository {
    public function __construct(private PDO $db) {}
    public function exists(int $id): bool { $s=$this->db->prepare('SELECT 1 FROM telegram_updates WHERE update_id=?'); $s->execute([$id]); return $s->fetchColumn()!==false; }
    public function record(int $id,string $now): void { $s=$this->db->prepare('INSERT INTO telegram_updates (update_id,received_at) VALUES (?,?)'); $s->execute([$id,$now]); }
}
final class LeadStatusRepository {
    public function __construct(private PDO $db) {}
    public function change(string $id,string $old,string $new,int $actor,string $now): bool {
        if (!in_array($new,['IN_PROGRESS','COMPLETED','CLOSED'],true)) return false;
        $s=$this->db->prepare('UPDATE leads SET status=? WHERE id=? AND status=?'); $s->execute([$new,$id,$old]);
        if ($s->rowCount()!==1) return false;
        $s=$this->db->prepare('INSERT INTO lead_status_history (lead_id,old_status,new_status,actor_id,changed_at) VALUES (?,?,?,?,?)'); $s->execute([$id,$old,$new,$actor,$now]); return true;
    }
}
final class OutboxRepository {
    public function __construct(private PDO $db) {}
    public function enqueue(string $leadId,string $type,array $payload,string $now): void {
        $s=$this->db->prepare('INSERT INTO outbox (lead_id,event_type,payload,status,attempts,available_at,created_at) VALUES (?,?,?,?,0,?,?)');
        $s->execute([$leadId,$type,json_encode($payload,JSON_THROW_ON_ERROR),'PENDING',$now,$now]);
    }
}
