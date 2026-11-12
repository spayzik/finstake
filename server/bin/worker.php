<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') { http_response_code(404); exit; }
require __DIR__.'/../src/bootstrap.php'; require __DIR__.'/../src/outbox.php';
try {
 $c=appConfiguration(); $db=appDatabase($c);
 if (in_array('--mock',$argv,true)) {
   if ($db->getAttribute(PDO::ATTR_DRIVER_NAME)!=='sqlite' && ($c['database']['host']??'')!=='127.0.0.1') throw new RuntimeException('Local mock only');
   require __DIR__.'/../src/mock_telegram.php'; $transport=new LocalMockTelegramTransport($c['mock_api_url']??'');
 } else {$transport=new HttpsTelegramTransport($c['telegram_token']??'');}
 echo json_encode(deliverOutbox($db,$transport)).PHP_EOL;
} catch (Throwable $e) {fwrite(STDERR,"Worker unavailable\n");exit(1);}
