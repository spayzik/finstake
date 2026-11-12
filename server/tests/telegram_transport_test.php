<?php
declare(strict_types=1);
require __DIR__.'/../src/telegram.php';
$m=new MockTelegramTransport(); $r=$m->call('sendMessage',['chat_id'=>-123,'message_thread_id'=>2,'text'=>'Synthetic lead']);
if ($r['message_id']!==1 || $m->calls[0]['payload']['message_thread_id']!==2) throw new RuntimeException('Mock mismatch');
try {new HttpsTelegramTransport('invalid');throw new LogicException('invalid token accepted');}catch(InvalidArgumentException $e){}
echo "transport unit passed\n";
