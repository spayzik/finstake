<?php
declare(strict_types=1);
require_once __DIR__.'/private_config.php';
require_once __DIR__.'/mysql.php';
function appConfiguration(): array {
    $file=getenv('FINSTAKE_CONFIG');
    if (!$file) throw new RuntimeException('Configuration unavailable');
    $c=loadPrivateConfiguration($file,$_SERVER['DOCUMENT_ROOT']??dirname(__DIR__).'/public');
    // This release only permits the fixed synthetic fixture; live intake requires a separate release.
    if (($c['mode']??null)!=='synthetic' || strlen($c['webhook_secret']??'')<24 || strlen($c['link_secret']??'')<32 || !is_int($c['crm_chat_id']??null) || !is_int($c['leads_topic_id']??null) || !is_array($c['manager_ids']??null)) throw new RuntimeException('Configuration incomplete');
    if (strlen($c['test_key']??'')<24) throw new RuntimeException('Test access key required');
    foreach ($c['manager_ids'] as $id) if (!is_int($id) || $id<=0) throw new RuntimeException('Manager configuration invalid');
    if (($c['versions']??null)!==['policy'=>'test-policy','consent'=>'test-consent','release'=>'test-release','marketing'=>'test-marketing']) throw new RuntimeException('Synthetic versions required');
    return $c;
}
function appDatabase(array $c): PDO {
    if (($c['database']['driver']??'')==='sqlite') {
        if (PHP_SAPI!=='cli' && (PHP_SAPI!=='cli-server'||($_SERVER['REMOTE_ADDR']??'')!=='127.0.0.1')) throw new RuntimeException('SQLite is local test only');
        return new PDO('sqlite:'.$c['database']['path'],null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_TIMEOUT=>5]);
    }
    return mysqlConnection($c['database']);
}
