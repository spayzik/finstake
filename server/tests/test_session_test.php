<?php
declare(strict_types=1);
require __DIR__.'/../src/test_session.php';
$config=['test_key'=>'synthetic-key-for-session-regression'];
$_SESSION=[];
if(validTestSession($config)) throw new RuntimeException('Anonymous session accepted');
$_SESSION=['expires'=>time()+60,'key_hash'=>hash('sha256',$config['test_key'])];
if(!validTestSession($config)) throw new RuntimeException('Valid session rejected');
if(validTestSession(['test_key'=>'rotated-synthetic-key'])) throw new RuntimeException('Old session survived key rotation');
$_SESSION['expires']=time()-1;
if(validTestSession($config)) throw new RuntimeException('Expired session accepted');
echo "test session gates PASS\n";
