<?php
declare(strict_types=1);
require __DIR__.'/../src/bootstrap.php'; require __DIR__.'/../src/test_session.php';
header('Cache-Control: no-store'); header('X-Robots-Tag: noindex, nofollow');
if (($_SERVER['HTTPS']??'')!=='on') {http_response_code(404);exit;}
try {$c=appConfiguration();startTestSession();
 $_SESSION['csrf']??=bin2hex(random_bytes(24));
 if (($_SERVER['REQUEST_METHOD']??'')==='POST' && hash_equals($_SESSION['csrf'],$_POST['csrf']??'') && hash_equals($c['test_key'],$_POST['key']??'')) {
   session_regenerate_id(true); $_SESSION['expires']=time()+900; $_SESSION['key_hash']=hash('sha256',$c['test_key']); header('Location: /w2-test/');exit;
 }
 if(validTestSession($c)) {session_write_close();readfile(dirname(getenv('FINSTAKE_CONFIG')).'/test-dist/index.html');exit;}
}catch(Throwable $e){http_response_code(503);exit;}
?><!doctype html><meta charset="utf-8"><title>Закрытая проверка FinStake</title><h1>Тестовая форма FinStake</h1><p>Только контрольные данные. Это не приём реальных обращений.</p><form method="post" autocomplete="off"><input type="hidden" name="csrf" value="<?=htmlspecialchars($_SESSION['csrf'])?>"><label>Ключ тестового доступа <input name="key" type="password" required></label><button>Открыть тест</button></form>
