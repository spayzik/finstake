<?php
declare(strict_types=1);
require_once __DIR__.'/../src/bootstrap.php';
require_once __DIR__.'/../src/application.php';
require_once __DIR__.'/../src/validation.php';
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store'); header('X-Content-Type-Options: nosniff');
function reply(int $status,array $data): never {http_response_code($status); echo json_encode($data,JSON_UNESCAPED_UNICODE); exit;}
try {
 $c=appConfiguration();
 if (PHP_SAPI!=='cli-server' && (($_SERVER['HTTPS']??'')!=='on')) reply(503,['status'=>'unavailable']);
 if (($_SERVER['REQUEST_METHOD']??'')!=='POST') reply(405,['status'=>'invalid']);
 $path=parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH);
 if (!in_array($path,['/api/leads','/api/telegram/webhook'],true)) reply(404,['status'=>'unavailable']);
 if ($path==='/api/telegram/webhook' && !hash_equals($c['webhook_secret'],$_SERVER['HTTP_X_TELEGRAM_BOT_API_SECRET_TOKEN']??'')) reply(403,['status'=>'unavailable']);
 if ($path==='/api/leads') {
    if (isset($_SERVER['HTTP_ORIGIN']) && $_SERVER['HTTP_ORIGIN']!==($c['origin']??null)) reply(403,['status'=>'unavailable']);
    if (PHP_SAPI!=='cli-server' && !hash_equals($c['test_key']??'',$_SERVER['HTTP_X_FINSTAKE_TEST_KEY']??'__missing__')) {
        require_once __DIR__.'/../src/test_session.php'; startTestSession();
        $authorised=validTestSession($c); session_write_close();
        if (!$authorised) reply(403,['status'=>'unavailable']);
    }
 }
 if ((int)($_SERVER['CONTENT_LENGTH']??0)>16384) reply(413,['status'=>'invalid']);
 if (!str_starts_with(strtolower($_SERVER['CONTENT_TYPE']??''),'application/json')) reply(415,['status'=>'invalid']);
 $body=file_get_contents('php://input',false,null,0,16385);
 if ($body===false || strlen($body)>16384) reply(413,['status'=>'invalid']);
 $data=json_decode($body,true,32,JSON_THROW_ON_ERROR); if (!is_array($data)) reply(422,['status'=>'invalid']);
 $db=appDatabase($c);
 if ($path==='/api/telegram/webhook') {
    persistTelegramUpdate($db,$data,$c);
    if (PHP_SAPI!=='cli-server' && !empty($c['telegram_token'])) {
        require_once __DIR__.'/../src/outbox.php';
        deliverOutbox($db,new HttpsTelegramTransport($c['telegram_token']),3);
    }
    reply(200,['status'=>'ok']);
 }
 $meta=['lead_consent_version'=>$_SERVER['HTTP_X_LEAD_CONSENT_VERSION']??'','release_id'=>$_SERVER['HTTP_X_LEAD_RELEASE_ID']??''];
 if (isset($_SERVER['HTTP_X_LEAD_MARKETING_VERSION'])) $meta['marketing_version']=$_SERVER['HTTP_X_LEAD_MARKETING_VERSION'];
 if (isset($_SERVER['HTTP_X_LEAD_MARKETING_CONSENT'])) $meta['marketing_consent']=$_SERVER['HTTP_X_LEAD_MARKETING_CONSENT'];
 $key=$_SERVER['HTTP_IDEMPOTENCY_KEY']??'';
 if (!preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/D',$key) || !validateLead($data,$meta,$c['versions']) || ($data['contact']['name']??'')!=='Тест Тестов' || ($data['contact']['phone']??'')!=='+447700900123' || ($data['comment']??null)!=='') reply(422,['status'=>'invalid']);
 // A hashed, time-bounded rate bucket; raw addresses are never logged by this code.
 $bucket=hash_hmac('sha256',($_SERVER['REMOTE_ADDR']??'unknown').':'.gmdate('YmdHi'),$c['link_secret']);
 $db->beginTransaction();
 $driver=$db->getAttribute(PDO::ATTR_DRIVER_NAME);
 sql($db,$driver==='mysql'?'INSERT INTO request_limits (bucket,hits,expires_at) VALUES (?,1,?) ON DUPLICATE KEY UPDATE hits=hits+1':'INSERT INTO request_limits (bucket,hits,expires_at) VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1',[$bucket,gmdate('Y-m-d H:i:s',time()+120)]);
 $hits=sql($db,'SELECT hits FROM request_limits WHERE bucket=?',[$bucket])->fetchColumn();
 sql($db,'DELETE FROM request_limits WHERE expires_at<?',[utcNow()]); $db->commit();
 if ((int)$hits>30) reply(429,['status'=>'rate_limited']);
 reply(201,acceptLead($db,$data,$meta,$key,$c));
} catch (DomainException $e) {reply(409,['status'=>'conflict']);}
catch (JsonException|InvalidArgumentException $e) {reply(422,['status'=>'invalid']);}
catch (Throwable $e) {if (isset($db) && $db->inTransaction()) $db->rollBack(); reply(503,['status'=>'unavailable']);}
