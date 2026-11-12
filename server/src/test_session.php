<?php
declare(strict_types=1);
function startTestSession(): void {
 if (session_status()===PHP_SESSION_ACTIVE) return;
 ini_set('session.use_strict_mode','1'); session_name('FINSTAKE_TEST');
 session_set_cookie_params(['path'=>'/','secure'=>true,'httponly'=>true,'samesite'=>'Strict']);
 session_start();
}
function validTestSession(array $config): bool {
 return ($_SESSION['expires']??0)>time() && hash_equals(hash('sha256',$config['test_key']),$_SESSION['key_hash']??'');
}
