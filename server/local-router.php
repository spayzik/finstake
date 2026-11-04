<?php
declare(strict_types=1);
// Isolated development harness only. Never deploy or use real personal data.
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function respond(int $status, array $data): never { http_response_code($status); echo json_encode($data); exit; }
if (PHP_SAPI !== 'cli-server' || ($_SERVER['REMOTE_ADDR'] ?? '') !== '127.0.0.1') respond(404, ['status'=>'unavailable']);
if (($_SERVER['REQUEST_URI'] ?? '') !== '/api/leads' || ($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') respond(404, ['status'=>'unavailable']);
if (!getenv('FINSTAKE_TEST_DB') || (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 8192) respond(400, ['status'=>'invalid']);
require __DIR__.'/src/validation.php'; require __DIR__.'/src/store.php';
$data=json_decode(file_get_contents('php://input'), true);
$meta=['lead_consent_version'=>$_SERVER['HTTP_X_LEAD_CONSENT_VERSION'] ?? '', 'release_id'=>$_SERVER['HTTP_X_LEAD_RELEASE_ID'] ?? ''];
if (isset($_SERVER['HTTP_X_LEAD_MARKETING_VERSION'])) $meta['marketing_version']=$_SERVER['HTTP_X_LEAD_MARKETING_VERSION'];
if (isset($_SERVER['HTTP_X_LEAD_MARKETING_CONSENT'])) $meta['marketing_consent']=$_SERVER['HTTP_X_LEAD_MARKETING_CONSENT'];
$versions=['policy'=>'test-policy','consent'=>'test-consent','release'=>'test-release','marketing'=>'test-marketing'];
$key=$_SERVER['HTTP_IDEMPOTENCY_KEY'] ?? '';
if (!preg_match('/^[0-9a-f-]{36}$/D', $key) || !validateLead($data, $meta, $versions) || ($data['contact']['name'] ?? '') !== 'Тест Тестов' || ($data['contact']['phone'] ?? '') !== '+447700900123' || ($data['comment'] ?? null) !== '') respond(422, ['status'=>'invalid']);
try {
 $db=new PDO('sqlite:'.getenv('FINSTAKE_TEST_DB'), null, null, [PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
 $db->exec('CREATE TABLE IF NOT EXISTS leads (id TEXT PRIMARY KEY, idem_key TEXT NOT NULL UNIQUE, fingerprint TEXT NOT NULL, payload TEXT NOT NULL, consent_version TEXT NOT NULL, release_id TEXT NOT NULL, marketing_version TEXT, marketing_choice TEXT, created_at TEXT NOT NULL)');
 $result=storeLead($db, $key, $data, $meta);
 respond(201, ['status'=>'accepted','requestId'=>$result['id']]);
} catch (DomainException $e) { respond(409, ['status'=>'conflict']); }
catch (Throwable $e) { respond(503, ['status'=>'unavailable']); }
