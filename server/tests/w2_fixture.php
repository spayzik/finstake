<?php
declare(strict_types=1);
if (getenv('FINSTAKE_MYSQL_TEST')) {
 require_once __DIR__.'/../src/mysql.php';
 $db=mysqlConnection(json_decode(getenv('FINSTAKE_MYSQL_TEST'),true,32,JSON_THROW_ON_ERROR));
} else $db=new PDO('sqlite:'.$argv[1],null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
if (($argv[2]??'')==='read') {
 $state=[];foreach(['leads','consents','telegram_sessions','telegram_updates','telegram_callbacks','lead_status_history','outbox'] as $table) $state[$table]=$db->query('SELECT * FROM '.$table)->fetchAll(PDO::FETCH_ASSOC);
 echo json_encode($state);exit;
}
$db->exec("PRAGMA foreign_keys=ON;
CREATE TABLE leads(id TEXT PRIMARY KEY,idem_key TEXT NOT NULL UNIQUE,fingerprint TEXT NOT NULL,payload TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'NEW',created_at TEXT NOT NULL,revision INTEGER NOT NULL DEFAULT 0);
CREATE TABLE consents(lead_id TEXT PRIMARY KEY,policy_version TEXT,consent_version TEXT,release_id TEXT,marketing_version TEXT,marketing_choice TEXT,accepted_at TEXT,FOREIGN KEY(lead_id) REFERENCES leads(id));
CREATE TABLE telegram_sessions(lead_id TEXT PRIMARY KEY,token_hash TEXT UNIQUE,token_expires_at TEXT,chat_id INTEGER,step INTEGER NOT NULL DEFAULT 0,answers TEXT,cancelled INTEGER NOT NULL DEFAULT 0,FOREIGN KEY(lead_id) REFERENCES leads(id));
CREATE TABLE telegram_updates(update_id INTEGER PRIMARY KEY,received_at TEXT NOT NULL);
CREATE TABLE telegram_callbacks(callback_id TEXT PRIMARY KEY,received_at TEXT NOT NULL);
CREATE TABLE lead_status_history(id INTEGER PRIMARY KEY AUTOINCREMENT,lead_id TEXT,old_status TEXT,new_status TEXT,actor_id INTEGER,changed_at TEXT);
CREATE TABLE outbox(id INTEGER PRIMARY KEY AUTOINCREMENT,lead_id TEXT,event_type TEXT,payload TEXT,status TEXT NOT NULL DEFAULT 'PENDING',attempts INTEGER NOT NULL DEFAULT 0,available_at TEXT,created_at TEXT,dedupe_key TEXT UNIQUE,method TEXT NOT NULL DEFAULT 'sendMessage',lease_id TEXT,lease_until TEXT);
CREATE TABLE request_limits(bucket TEXT PRIMARY KEY,hits INTEGER,expires_at TEXT);");
