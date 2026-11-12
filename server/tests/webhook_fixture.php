<?php
declare(strict_types=1);
$db=new PDO('sqlite:'.$argv[1],null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
if (($argv[2]??'')==='read') { $row=$db->query('SELECT step,answers,token_hash FROM telegram_sessions')->fetch(PDO::FETCH_ASSOC); $row['messages']=(int)$db->query('SELECT COUNT(*) FROM mock_messages')->fetchColumn(); $row['updates']=(int)$db->query('SELECT COUNT(*) FROM telegram_updates')->fetchColumn(); $row['first']=json_decode($db->query('SELECT payload FROM mock_messages ORDER BY id LIMIT 1')->fetchColumn(),true); echo json_encode($row); exit; }
$db->exec('CREATE TABLE telegram_sessions (lead_id TEXT PRIMARY KEY, token_hash TEXT UNIQUE, token_expires_at TEXT, chat_id INTEGER UNIQUE, step INTEGER NOT NULL, answers TEXT); CREATE TABLE telegram_updates (update_id INTEGER PRIMARY KEY, received_at TEXT); CREATE TABLE mock_messages (id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER, payload TEXT)');
$s=$db->prepare('INSERT INTO telegram_sessions VALUES (?,?,?,?,?,?)'); $s->execute(['synthetic',hash('sha256','test_token_123456789012345678901234567890'),'2099-01-01 00:00:00',null,0,'[]']);
