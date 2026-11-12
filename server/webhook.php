<?php
declare(strict_types=1);
// Local synthetic harness only. Never deploy: it uses SQLite and a mock Telegram adapter.
header('Content-Type: application/json'); header('Cache-Control: no-store');
function answer(int $code): never { http_response_code($code); echo '{"status":"'.($code===200?'ok':'unavailable').'"}'; exit; }
if (PHP_SAPI!=='cli-server' || ($_SERVER['REMOTE_ADDR']??'')!=='127.0.0.1') answer(503);
if (($_SERVER['REQUEST_METHOD']??'')!=='POST') answer(405);
$secret=getenv('FINSTAKE_WEBHOOK_TEST_SECRET'); $path=getenv('FINSTAKE_WEBHOOK_TEST_DB');
if (!$secret || !$path) answer(503);
if (!hash_equals($secret,$_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN']??'')) answer(403);
if ((int)($_SERVER['CONTENT_LENGTH']??0)>16384) answer(413);
try {
    $body=file_get_contents('php://input',false,null,0,16385); if ($body===false || strlen($body)>16384) answer(413);
    $update=json_decode($body,true,32,JSON_THROW_ON_ERROR); if (!is_array($update)) answer(400);
    require __DIR__.'/src/telegram_flow_integration.php';
    $db=new PDO('sqlite:'.$path,null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
    processTelegramUpdate($db,$update); answer(200);
} catch (JsonException|InvalidArgumentException $e) { answer(400); } catch (Throwable $e) { answer(503); }
