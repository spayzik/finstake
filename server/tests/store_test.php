<?php
declare(strict_types=1);
require __DIR__.'/../src/store.php';
$db = new PDO('sqlite::memory:');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$db->exec('CREATE TABLE leads (id TEXT PRIMARY KEY, idem_key TEXT NOT NULL UNIQUE, fingerprint TEXT NOT NULL, payload TEXT NOT NULL, consent_version TEXT NOT NULL, release_id TEXT NOT NULL, marketing_version TEXT, marketing_choice TEXT, created_at TEXT NOT NULL)');
$payload = ['source'=>'finstake-web','amountRub'=>10];
$meta = ['lead_consent_version'=>'test-consent','release_id'=>'test-release'];
$a = storeLead($db, 'abc', $payload, $meta);
$b = storeLead($db, 'abc', $payload, $meta);
assert($a['id'] === $b['id']);
assert($db->query('SELECT COUNT(*) FROM leads')->fetchColumn() === 1);
try { storeLead($db, 'abc', ['source'=>'finstake-web','amountRub'=>11], $meta); assert(false); }
catch (DomainException $e) { assert($e->getMessage() === 'conflict'); }
echo "store ok\n";
