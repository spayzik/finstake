<?php
declare(strict_types=1);
interface TelegramTransport { public function call(string $method,array $payload): array; }
final class HttpsTelegramTransport implements TelegramTransport {
 public function __construct(private string $token) { if (!preg_match('/^[0-9]+:[A-Za-z0-9_-]+$/D',$token)) throw new InvalidArgumentException('Invalid bot configuration'); }
 public function call(string $method,array $payload): array {
  if (!in_array($method,['sendMessage','editMessageText','answerCallbackQuery','setWebhook','getWebhookInfo','getUpdates','deleteWebhook'],true)) throw new InvalidArgumentException('Unsupported method');
  $ch=curl_init('https://api.telegram.org/bot'.$this->token.'/'.$method);
  curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>json_encode($payload,JSON_THROW_ON_ERROR),CURLOPT_HTTPHEADER=>['Content-Type: application/json'],CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>15,CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2]);
  try { $body=curl_exec($ch); $status=curl_getinfo($ch,CURLINFO_RESPONSE_CODE); if ($body===false || $status!==200) throw new RuntimeException('Telegram delivery failed'); $data=json_decode($body,true,32,JSON_THROW_ON_ERROR); if (($data['ok']??false)!==true) throw new RuntimeException('Telegram rejected delivery'); return is_array($data['result']??null) ? $data['result'] : ['ok'=>true]; }
  finally {curl_close($ch);}
 }
}
final class MockTelegramTransport implements TelegramTransport {
 public array $calls=[];
 public function call(string $method,array $payload): array {$this->calls[]=['method'=>$method,'payload'=>$payload];return ['message_id'=>count($this->calls)];}
}

