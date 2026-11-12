<?php
declare(strict_types=1);
if (PHP_SAPI!=='cli') exit(1);
require __DIR__.'/../src/bootstrap.php';
require __DIR__.'/../src/telegram.php';
try {
 $c=appConfiguration();
 $url=$c['webhook_url']??'';
 if (!is_string($url) || !filter_var($url,FILTER_VALIDATE_URL) || parse_url($url,PHP_URL_SCHEME)!=='https' || parse_url($url,PHP_URL_PATH)!=='/api/telegram/webhook' || parse_url($url,PHP_URL_QUERY)!==null || parse_url($url,PHP_URL_USER)!==null) throw new RuntimeException('Invalid webhook URL');
 $api=new HttpsTelegramTransport($c['telegram_token']??'');
 $api->call('setWebhook',['url'=>$url,'secret_token'=>$c['webhook_secret'],'allowed_updates'=>['message','callback_query'],'drop_pending_updates'=>false]);
 $info=$api->call('getWebhookInfo',[]);
 if (($info['url']??null)!==$url) throw new RuntimeException('Webhook not verified');
 echo "Webhook URL confirmed; delivery requires a separate synthetic E2E.\n";
} catch (Throwable $e) {fwrite(STDERR,"Webhook configuration not confirmed\n");exit(1);}
