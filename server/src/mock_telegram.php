<?php
declare(strict_types=1);
// Test-only adapter to a synthetic loopback HTTP API. No bot credential is used.
final class LocalMockTelegramTransport implements TelegramTransport {
 public function __construct(private string $url) {
   $u=parse_url($url);
   if (($u['scheme']??'')!=='http' || ($u['host']??'')!=='127.0.0.1' || isset($u['user']) || isset($u['query']) || isset($u['fragment'])) throw new InvalidArgumentException('Loopback mock required');
 }
 public function call(string $method,array $payload): array {
   $ctx=stream_context_create(['http'=>['method'=>'POST','header'=>"Content-Type: application/json\r\n",'content'=>json_encode(['method'=>$method,'payload'=>$payload],JSON_THROW_ON_ERROR),'timeout'=>5,'ignore_errors'=>false,'follow_location'=>0]]);
   $raw=@file_get_contents($this->url,false,$ctx); if ($raw===false) throw new RuntimeException('Mock unavailable');
   $result=json_decode($raw,true,32,JSON_THROW_ON_ERROR); if (($result['ok']??false)!==true) throw new RuntimeException('Mock rejected'); return $result['result']??[];
 }
}
