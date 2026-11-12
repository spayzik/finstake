<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') exit(1);
require __DIR__.'/../src/bootstrap.php';
require __DIR__.'/../src/outbox.php';
try {
 $c=appConfiguration(); $db=appDatabase($c);
 $lock=fopen(dirname(getenv('FINSTAKE_CONFIG')).'/poll.lock','c');
 if (!$lock || !flock($lock,LOCK_EX|LOCK_NB)) exit(0);
 $api=new HttpsTelegramTransport($c['telegram_token']);
 $cursor=dirname(getenv('FINSTAKE_CONFIG')).'/poll-offset';
 $offset=is_file($cursor)?(int)file_get_contents($cursor):0;
 $updates=$api->call('getUpdates',['offset'=>$offset,'timeout'=>0,'limit'=>50,'allowed_updates'=>['message','callback_query']]);
 foreach ($updates as $u) {
   // Isolated synthetic pilot: only the configured Owner/manager test accounts.
   $actor=$u['message']['from']['id']??$u['callback_query']['from']['id']??null;
   if (is_int($actor) && in_array($actor,$c['manager_ids'],true)) persistTelegramUpdate($db,$u,$c);
   $offset=max($offset,(int)$u['update_id']+1);
   file_put_contents($cursor,(string)$offset,LOCK_EX); chmod($cursor,0600);
 }
 echo json_encode(deliverOutbox($db,$api,25)).PHP_EOL;
} catch (Throwable $e) {fwrite(STDERR,"Polling unavailable\n");exit(1);}
