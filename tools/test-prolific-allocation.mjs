import test from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStore, fixture } from './test-allocation.mjs';
import { createHandler } from '../netlify/lib/allocation-handler.mjs';
import { transact, claim, counts } from '../netlify/lib/allocation-core.mjs';
import design from '../netlify/lib/prolific-design.mjs';

const origin = 'https://' + design.host;
const pid = 'a'.repeat(24);
const cookie = '__Host-facade-prolific=' + 'b'.repeat(64);
const ids = new URLSearchParams({PROLIFIC_PID:pid,STUDY_ID:'study',SESSION_ID:'session'});
function request(action, body='{}', extra={}) {
  return new Request(origin + '/.netlify/functions/prolific-allocation?' + ids + (action ? '&action='+action : ''), {
    method: action ? 'POST' : 'GET', headers:{origin,cookie,...extra}, ...(action ? {body} : {})
  });
}
function responseRows(entry,outcome='complete') {
  const rows = fixture(entry,outcome).map(r=>({...r,recruitment_source:'prolific',prolific_pid:pid,
    study_id:'study',session_id:'session',recruitment_batch:'main',allocation_campaign:design.campaign}));
  rows.splice(2,0,{...rows[0],screen:'prolific_id_entry',response:pid,study_trial_id:'pid-entry'});
  return rows;
}
function form(entry, rows) {
  return new URLSearchParams({'form-name':'facade_pairwise_data',participant_id:pid,prolific_pid:pid,
    study_id:'study',session_id:'session',recruitment_source:'prolific',pair_set_id:entry.blockId,
    test_submission:'false',study_mode:'production',outcome:rows.at(-1).outcome,payload_json:JSON.stringify(rows)}).toString();
}
test('150 concurrent claims allocate exactly 95 places, never B01, B25 has three',async()=>{
  const store=new MemoryStore();
  const results=await Promise.allSettled(Array.from({length:150},(_,i)=>transact(store,'q',s=>claim(s,'p'+i,design,100),100)));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,95);
  const c=counts(await store.get('q'),design,100);
  assert(c.every(b=>b.occupied===design.blockTargets[b.blockId]));
});
test('identity binding, durable submit, retries, own download and quality flagged completion',async()=>{
  const store=new MemoryStore(),responses=new MemoryStore();
  const handler=createHandler({store,responses,design,clock:()=>1000,mirror:async()=>{throw Error('offline');}});
  const entry=await (await handler(request('claim'))).json();
  assert.equal(entry.participantId,pid);
  assert.equal((await (await handler(request('claim'))).json()).blockId,entry.blockId);
  assert.equal((await handler(request('',undefined,{cookie:'__Host-facade-prolific='+'c'.repeat(64)}))).status,403);
  const rows=responseRows(entry);
  rows.filter(r=>r.screen?.startsWith('attention_check')).forEach(r=>r.correct=false);
  const body=form(entry,rows);
  const result=await (await handler(request('submit',body))).json();
  assert.equal(result.saved,true); assert.equal(result.status,'complete'); assert.equal(result.formsCopyHttpAccepted,false);
  assert.equal((await (await handler(request('submit',body))).json()).saved,true);
  const response=await handler(new Request(origin+'/?'+ids+'&action=response',{headers:{cookie}}));
  assert.deepEqual((await response.json()).rows,rows);
  assert.equal(responses.map.size,1);
  assert.equal([...responses.map.values()][0].data.preliminaryResult,'quality_review');
});
test('screen-out and withdrawal release occupied places; invalid rows cannot consume completion',async()=>{
  for(const action of ['submit','abandon']) {
    const store=new MemoryStore(),responses=new MemoryStore();
    const handler=createHandler({store,responses,design,clock:()=>1000,mirror:async()=>new Response('ok')});
    const entry=await (await handler(request('claim'))).json();
    const bad=responseRows(entry); bad[5].participant_id='wrong';
    assert.equal((await handler(request('submit',form(entry,bad)))).status,400);
    const result=await handler(request(action,action==='submit'?form(entry,responseRows(entry,'screened_out')):'{}'));
    assert.equal(result.status,200);
    const state=await store.get(design.campaign+'/quotas');
    assert.equal(counts(state,design,1000).reduce((s,c)=>s+c.occupied,0),0);
  }
});
test('storage failure cannot report saved or finish quota',async()=>{
  const store=new MemoryStore(),responses=new MemoryStore();
  const handler=createHandler({store,responses,design,clock:()=>1000});
  const entry=await (await handler(request('claim'))).json();
  responses.setJSON=async()=>{throw Error('storage failed');};
  assert.equal((await handler(request('submit',form(entry,responseRows(entry))))).status,503);
  assert.equal(counts(await store.get(design.campaign+'/quotas'),design,1000).reduce((s,c)=>s+c.complete,0),0);
});
