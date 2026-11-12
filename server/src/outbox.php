<?php
declare(strict_types=1);
require_once __DIR__.'/application.php';
require_once __DIR__.'/telegram.php';
/** Lease is longer than the transport timeout. Telegram delivery is at least once. */
function deliverOutbox(PDO $db,TelegramTransport $transport,int $limit=25): array {
    $sent=0; $failed=0;
    for ($i=0;$i<min(100,$limit);$i++) {
        $now=utcNow();
        sql($db,"UPDATE outbox SET status=CASE WHEN attempts>=5 THEN 'FAILED' ELSE 'PENDING' END,lease_id=NULL,lease_until=NULL WHERE status='SENDING' AND lease_until<?",[$now]);
        $item=sql($db,"SELECT * FROM outbox WHERE status='PENDING' AND attempts<5 AND available_at<=? ORDER BY CASE WHEN method='answerCallbackQuery' THEN 0 ELSE 1 END,id LIMIT 1",[$now])->fetch(PDO::FETCH_ASSOC);
        if (!$item) break;
        $lease=bin2hex(random_bytes(16));
        $claim=sql($db,"UPDATE outbox SET status='SENDING',lease_id=?,lease_until=?,attempts=attempts+1 WHERE id=? AND status='PENDING'",[$lease,gmdate('Y-m-d H:i:s',time()+120),$item['id']]);
        if ($claim->rowCount()!==1) continue;
        try {
            $transport->call($item['method'],json_decode($item['payload'],true,32,JSON_THROW_ON_ERROR));
            sql($db,"UPDATE outbox SET status='SENT',lease_id=NULL,lease_until=NULL WHERE id=? AND lease_id=?",[$item['id'],$lease]); $sent++;
        } catch (Throwable $e) {
            $attempt=(int)$item['attempts']+1;
            sql($db,'UPDATE outbox SET status=?,available_at=?,lease_id=NULL,lease_until=NULL WHERE id=? AND lease_id=?',[$attempt>=5?'FAILED':'PENDING',gmdate('Y-m-d H:i:s',time()+min(60,2**$attempt)),$item['id'],$lease]); $failed++;
        }
    }
    return ['sent'=>$sent,'failed'=>$failed];
}
