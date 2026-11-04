<?php
declare(strict_types=1);

/** Preliminary validation only. Not an endpoint or legal authorization. */
function validateLead(mixed $payload, array $headers, array $versions): bool
{
    foreach (['policy', 'consent', 'release'] as $key) {
        if (!is_string($versions[$key] ?? null) || !preg_match('/^[A-Za-z0-9_-]{1,100}$/D', $versions[$key])) return false;
    }
    if (!is_array($payload) || ($payload['schemaVersion'] ?? null) !== 1 || ($payload['source'] ?? null) !== 'finstake-web') return false;
    if (!in_array($payload['service'] ?? null, ['personal','business','secured','refinancing'], true)) return false;
    if (!is_int($payload['amountRub'] ?? null) || $payload['amountRub'] < 1 || $payload['amountRub'] > 1000000000) return false;
    if (!array_key_exists('termMonths', $payload) || !in_array($payload['termMonths'], [null,12,24,36,60,84,120,180,240,300,360], true)) return false;
    if (!is_string($payload['comment'] ?? null) || mb_strlen($payload['comment']) > 1000) return false;
    $contact = $payload['contact'] ?? null;
    if (!is_array($contact) || !is_string($contact['name'] ?? null) || mb_strlen(trim($contact['name'])) < 2 || mb_strlen($contact['name']) > 80) return false;
    if (!preg_match('/^[\p{L}\p{M} \'\x{2019}-]+$/u', $contact['name']) || preg_match_all('/\p{L}/u', $contact['name']) < 2) return false;
    if (!is_string($contact['phone'] ?? null) || !preg_match('/^\+[1-9][0-9]{9,14}$/D', $contact['phone'])) return false;
    if (!in_array($contact['preferredChannel'] ?? null, ['phone','telegram','whatsapp'], true)) return false;
    if (($payload['consent']['accepted'] ?? null) !== true || !is_string($versions['policy'] ?? null) || ($payload['consent']['policyVersion'] ?? null) !== $versions['policy']) return false;
    if (!is_string($versions['consent'] ?? null) || ($headers['lead_consent_version'] ?? null) !== $versions['consent']) return false;
    if (!is_string($versions['release'] ?? null) || ($headers['release_id'] ?? null) !== $versions['release']) return false;
    $marketing = $headers['marketing_consent'] ?? null;
    if ($marketing !== null && (!in_array($marketing, ['granted','not-granted'], true) || !is_string($versions['marketing'] ?? null) || !preg_match('/^[A-Za-z0-9_-]{1,100}$/D', $versions['marketing']) || ($headers['marketing_version'] ?? null) !== $versions['marketing'])) return false;
    if ($marketing === null && array_key_exists('marketing_version', $headers)) return false;
    return true;
}
