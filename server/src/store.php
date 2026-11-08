<?php
declare(strict_types=1);

function storeLead(PDO $db, string $key, array $payload, array $meta): array
{
    $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    $fingerprint = hash('sha256', json_encode([$payload, $meta], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
    $select = static function () use ($db, $key, $fingerprint): ?array {
        $query = $db->prepare('SELECT id, fingerprint FROM leads WHERE idem_key = ?');
        $query->execute([$key]);
        $row = $query->fetch(PDO::FETCH_ASSOC);
        if (!$row) return null;
        if (!hash_equals($row['fingerprint'], $fingerprint)) throw new DomainException('conflict');
        return ['id'=>$row['id']];
    };
    $old = $select();
    if ($old) return $old;
    $id = bin2hex(random_bytes(16));
    try {
        $db->beginTransaction();
        $stmt = $db->prepare('INSERT INTO leads (id, idem_key, fingerprint, payload, consent_version, release_id, marketing_version, marketing_choice, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$id, $key, $fingerprint, $body, $meta['lead_consent_version'], $meta['release_id'], $meta['marketing_version'] ?? null, $meta['marketing_consent'] ?? null, gmdate('Y-m-d\TH:i:s\Z')]);
        $db->commit();
        return ['id'=>$id];
    } catch (PDOException $e) {
        if ($db->inTransaction()) $db->rollBack();
        $old = $select();
        if ($old) return $old;
        throw $e;
    }
}
