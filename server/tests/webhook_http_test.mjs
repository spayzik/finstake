import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
test('HTTP webhook persists synthetic start and three callbacks exactly once',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fs-webhook-')); const db=join(dir,'test.sqlite');
 const php=resolve('../.local-tools/php/php.exe'), ext=resolve('../.local-tools/php/ext');
 const args=['-d',`extension_dir=${ext}`,'-d','extension=pdo_sqlite'];
 execFileSync(php,[...args,'server/tests/webhook_fixture.php',db]);
 const proc=spawn(php,[...args,'-S','127.0.0.1:47941','server/webhook.php'],{env:{...process.env,FINSTAKE_WEBHOOK_TEST_DB:db,FINSTAKE_WEBHOOK_TEST_SECRET:'synthetic-secret'},stdio:'ignore'});
 const send=(update,secret='synthetic-secret')=>fetch('http://127.0.0.1:47941/',{method:'POST',headers:{'content-type':'application/json','x-telegram-bot-api-secret-token':secret},body:JSON.stringify(update)});
 try{
 let result; for(let i=0;i<40;i++){try{result=await send({update_id:1,message:{chat:{id:42,type:'private'},from:{id:42},text:'/start test_token_123456789012345678901234567890'}});break;}catch{await new Promise(r=>setTimeout(r,100));}}
 assert.equal(result.status,200); assert.equal((await send({update_id:2},'bad')).status,403);
 assert.equal((await send({update_id:3,callback_query:{id:'bad',from:{id:99},message:{chat:{id:99,type:'private'}},data:'q:0:urgent'}})).status,200);
 for(const [i,v] of ['urgent','business','ready'].entries()){
  const update={update_id:10+i,callback_query:{id:`cb${i}`,from:{id:42},message:{chat:{id:42,type:'private'}},data:`q:${i}:${v}`}};
  assert.equal((await send(update)).status,200); assert.equal((await send(update)).status,200);
 }
 const state=JSON.parse(execFileSync(php,[...args,'server/tests/webhook_fixture.php',db,'read'],{encoding:'utf8'}));
 assert.equal(state.step,3); assert.deepEqual(JSON.parse(state.answers),['urgent','business','ready']);
 assert.equal(state.messages,4); assert.equal(state.updates,5); assert.equal(state.token_hash,null);
 assert.equal(state.first.method,'sendMessage'); assert.equal(state.first.reply_markup.inline_keyboard.length,3);
 } finally {proc.kill(); await new Promise(r=>proc.once('exit',r)); await rm(dir,{recursive:true,force:true});}
});
