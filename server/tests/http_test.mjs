import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

test('HTTP accept, duplicate, conflict and invalid consent', async () => {
 const dir=await mkdtemp(join(tmpdir(),'finstake-e2e-'));
 const php=resolve('.local-tools/php/php.exe'); const ext=resolve('.local-tools/php/ext');
 const server=spawn(php,['-d',`extension_dir=${ext}`,'-d','extension=pdo_sqlite','-d','extension=mbstring','-S','127.0.0.1:47839','server/local-router.php'],{env:{...process.env,FINSTAKE_TEST_DB:join(dir,'test.sqlite')},stdio:'ignore'});
 const headers={'content-type':'application/json','x-lead-consent-version':'test-consent','x-lead-release-id':'test-release','idempotency-key':'00000000-0000-4000-8000-000000000001'};
 const body={schemaVersion:1,source:'finstake-web',service:'personal',amountRub:500000,termMonths:60,comment:'',contact:{name:'Тест Тестов',phone:'+447700900123',preferredChannel:'phone'},consent:{accepted:true,policyVersion:'test-policy'}};
 const send=(data,h=headers)=>fetch('http://127.0.0.1:47839/api/leads',{method:'POST',headers:h,body:JSON.stringify(data)});
 try {
   let first;
   for(let n=0;n<40;n++){ try {first=await send(body);break;} catch {await new Promise(r=>setTimeout(r,100));} }
   assert.ok(first,'server did not start'); assert.equal(first.status,201); const one=await first.json();
   const records=JSON.parse(execFileSync(php,['-d',`extension_dir=${ext}`,'-d','extension=pdo_sqlite','server/tests/read_test_db.php',join(dir,'test.sqlite')],{encoding:'utf8'}));
   assert.deepEqual(records,[{id:one.requestId,consent_version:'test-consent',release_id:'test-release'}]);
   const second=await send(body); assert.equal(second.status,201); assert.equal((await second.json()).requestId,one.requestId);
   assert.equal((await send({...body,amountRub:2})).status,409);
   assert.equal((await send({...body,consent:{accepted:false,policyVersion:'test-policy'}})).status,422);
   assert.equal((await send({...body,consent:{accepted:true,policyVersion:'wrong-version'}})).status,422);
   assert.equal((await send(body,{...headers,'x-lead-consent-version':'wrong-version'})).status,422);
   const after=JSON.parse(execFileSync(php,['-d',`extension_dir=${ext}`,'-d','extension=pdo_sqlite','server/tests/read_test_db.php',join(dir,'test.sqlite')],{encoding:'utf8'}));
   assert.equal(after.length,1);
 } finally {server.kill(); await new Promise(r=>server.once('exit',r)); await rm(dir,{recursive:true,force:true});}
});
