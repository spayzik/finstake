import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {createServer} from 'node:http';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
const exec=promisify(execFile);
test('W2 HTTP → durable lead → screening → mock HTTP delivery → authorised status',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'finstake-w2-')),db=join(dir,'test.sqlite'),configPath=join(dir,'config.json');
 const php=resolve('../.local-tools/php/php.exe'),ext=resolve('../.local-tools/php/ext');
 const args=['-d',`extension_dir=${ext}`,'-d','extension=pdo_sqlite','-d','extension=pdo_mysql','-d','extension=mbstring'];
 if (!process.env.FINSTAKE_MYSQL_TEST) await exec(php,[...args,'server/tests/w2_fixture.php',db]);
 const calls=[]; let fail=false;
 const mock=createServer((req,res)=>{let data='';req.on('data',chunk=>data+=chunk);req.on('end',()=>{if(fail){res.writeHead(503);res.end('{}');return;} calls.push(JSON.parse(data));res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true,result:{message_id:calls.length}}));});});
 await new Promise(r=>mock.listen(0,'127.0.0.1',r));
 const settings={mode:'synthetic',test_key:'synthetic-test-access-123456789',database:process.env.FINSTAKE_MYSQL_TEST ? JSON.parse(process.env.FINSTAKE_MYSQL_TEST) : {driver:'sqlite',path:db},versions:{policy:'test-policy',consent:'test-consent',release:'test-release',marketing:'test-marketing'},webhook_secret:'synthetic-webhook-secret-123456',link_secret:'synthetic-link-secret-12345678901234567890',crm_chat_id:-1004377105178,leads_topic_id:2,manager_ids:[9001],origin:'http://127.0.0.1:4187',mock_api_url:`http://127.0.0.1:${mock.address().port}/api`};
 await writeFile(configPath,JSON.stringify(settings));
 const env={...process.env,FINSTAKE_CONFIG:configPath};let logs='';
 if (process.env.FINSTAKE_MYSQL_TEST) await exec(php,[...args,'server/bin/migrate.php'],{env});
 const proc=spawn(php,[...args,'-S','127.0.0.1:47941','server/public/index.php'],{env,stdio:['ignore','pipe','pipe']});
 proc.stdout.on('data',d=>logs+=d);proc.stderr.on('data',d=>logs+=d);
 const post=(path,data,headers={})=>fetch('http://127.0.0.1:47941'+path,{method:'POST',headers:{'content-type':'application/json',...headers},body:JSON.stringify(data)});
 const hook=(data,secret=settings.webhook_secret)=>post('/api/telegram/webhook',data,{'x-telegram-bot-api-secret-token':secret});
 const body={schemaVersion:1,source:'finstake-web',service:'personal',amountRub:500000,termMonths:60,comment:'',contact:{name:'Тест Тестов',phone:'+447700900123',preferredChannel:'phone'},consent:{accepted:true,policyVersion:'test-policy'}};
 const headers={'idempotency-key':'00000000-0000-4000-8000-000000000001','x-lead-consent-version':'test-consent','x-lead-release-id':'test-release'};
 const state=async()=>JSON.parse((await exec(php,[...args,'server/tests/w2_fixture.php',db,'read'])).stdout);
 const worker=async()=>JSON.parse((await exec(php,[...args,'server/bin/worker.php','--mock'],{env})).stdout);
 const start=(uid,text,actor=42)=>({update_id:uid,message:{chat:{id:actor,type:'private'},from:{id:actor},text}});
 const cb=(uid,data,actor=42,chat={id:42,type:'private'})=>({update_id:uid,callback_query:{id:`cb${uid}`,from:{id:actor},message:{chat,message_thread_id:2},data}});
 try {
  let first;for(let i=0;i<40;i++){try{first=await post('/api/leads',body,headers);break;}catch{await new Promise(r=>setTimeout(r,100));}}
  assert.equal(first?.status,201);const receipt=await first.json();assert.match(receipt.requestId,/^[a-f0-9]{32}$/);assert.match(receipt.telegramUrl,/^https:\/\/t.me\/finstake_helperbot\?start=/);
  assert.equal((await post('/api/leads',body,headers)).status,201);assert.equal((await state()).leads.length,1);
  assert.equal((await post('/api/leads',{...body,amountRub:7},headers)).status,409);
  assert.equal((await post('/api/leads',{...body,consent:{accepted:false,policyVersion:'test-policy'}},headers)).status,422);
  assert.equal((await hook({update_id:1},'wrong')).status,403);
  assert.equal((await hook(start(2,'/start',44))).status,200);
  const token=new URL(receipt.telegramUrl).searchParams.get('start');
  assert.equal((await hook(start(10,'/start '+token))).status,200);
  assert.equal((await hook(start(11,'/start '+token,43))).status,200);
  assert.equal((await state()).telegram_sessions[0].chat_id,42);
  for(const [i,value] of ['urgent','business','ready'].entries()) {
    const update=cb(20+i,`q:${receipt.requestId}:${i}:${value}`);
    assert.equal((await hook(update)).status,200);assert.equal((await hook(update)).status,200);
  }
  let rows=await state();assert.equal(rows.telegram_sessions[0].step,3);assert.deepEqual(JSON.parse(rows.telegram_sessions[0].answers),['urgent','business','ready']);
  const delivered=await worker();assert.ok(delivered.sent>=6);assert.equal(delivered.failed,0);
  assert.ok(calls.some(c=>c.payload.chat_id===44 && c.payload.text.includes('помощник FinStake')));
  const notifications=calls.filter(c=>c.payload.chat_id===settings.crm_chat_id);assert.equal(notifications.length,2);
  const message=notifications.at(-1).payload;assert.equal(message.message_thread_id,2);assert.ok(message.text.includes('завершён'));
  const action=message.reply_markup.inline_keyboard[0][0].callback_data;
  assert.equal((await hook(cb(30,action,999,{id:settings.crm_chat_id,type:'supergroup'}))).status,200);
  assert.equal((await state()).leads[0].status,'NEW');
  const manager=cb(31,action,9001,{id:settings.crm_chat_id,type:'supergroup'});
  assert.equal((await hook(manager)).status,200);assert.equal((await hook(manager)).status,200);
  assert.equal((await hook(cb(32,action,9001,{id:settings.crm_chat_id,type:'supergroup'}))).status,200);
  rows=await state();assert.equal(rows.leads[0].status,'IN_PROGRESS');assert.equal(rows.lead_status_history.length,1);
  fail=true;const failure=await worker();assert.ok(failure.failed>0);assert.equal((await state()).outbox.filter(o=>o.status==='PENDING').length,2);
  fail=false;
  assert.equal((await hook(start(40,'/cancel'))).status,200);assert.equal((await state()).telegram_sessions[0].cancelled,1);
  assert.equal((await hook(start(41,'/start'))).status,200);assert.equal((await state()).telegram_sessions[0].cancelled,0);
  for(const term of [body.contact.name,body.contact.phone,settings.webhook_secret,token])assert.ok(!logs.includes(term),'sensitive fixture leaked to process log');
  for(const c of calls.filter(c=>c.payload.chat_id===settings.crm_chat_id))for(const term of [body.contact.name,body.contact.phone]) assert.ok(!JSON.stringify(c).includes(term));
 } finally {proc.kill();if(proc.exitCode===null)await new Promise(r=>proc.once('exit',r));await new Promise(r=>mock.close(r));await rm(dir,{recursive:true,force:true});}
});
