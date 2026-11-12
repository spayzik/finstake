<?php
declare(strict_types=1);
require __DIR__.'/../src/repositories.php';
$db=new PDO('sqlite::memory:',null,null,[PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION]);
$db->exec("CREATE TABLE leads(id TEXT PRIMARY KEY, idem_key TEXT UNIQUE, fingerprint TEXT, payload TEXT, status TEXT, created_at TEXT); CREATE TABLE consents(lead_id TEXT PRIMARY KEY, policy_version TEXT, consent_version TEXT, release_id TEXT, marketing_version TEXT, marketing_choice TEXT, accepted_at TEXT); CREATE TABLE lead_status_history(id INTEGER PRIMARY KEY, lead_id TEXT, old_status TEXT, new_status TEXT, actor_id INTEGER, changed_at TEXT); CREATE TABLE outbox(id INTEGER PRIMARY KEY, lead_id TEXT, event_type TEXT, payload TEXT, status TEXT, attempts INTEGER, available_at TEXT, created_at TEXT)");
$id=str_repeat('a',32); $now='2026-01-01 00:00:00';
$lead=new LeadRepository($db); $consent=new ConsentRepository($db); $statuses=new LeadStatusRepository($db); $outbox=new OutboxRepository($db);
$db->beginTransaction(); $lead->create($id,'test-key',str_repeat('b',64),['source'=>'synthetic'],$now); $consent->create($id,['lead_consent_version'=>'test','release_id'=>'test'],'test',$now); $outbox->enqueue($id,'NEW',['id'=>$id],$now); $db->commit();
if (($lead->byKey('test-key')['id']??null)!==$id) throw new RuntimeException('lead missing');
$db->beginTransaction(); if (!$statuses->change($id,'NEW','IN_PROGRESS',123,$now)) throw new RuntimeException('status missing'); if ($statuses->change($id,'NEW','CLOSED',123,$now)) throw new RuntimeException('stale state accepted'); $db->commit();
if ((int)$db->query('SELECT COUNT(*) FROM lead_status_history')->fetchColumn()!==1) throw new RuntimeException('history mismatch');
echo "repository sqlite smoke passed; mysql integration not tested\n";
