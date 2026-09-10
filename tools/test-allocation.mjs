import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { transact, claim, counts, finish, validateRows } from '../netlify/lib/allocation-core.mjs';
import { createHandler } from '../netlify/lib/allocation-handler.mjs';

export const design = JSON.parse(readFileSync(fileURLToPath(new URL('../netlify/lib/allocation-design.json', import.meta.url)), 'utf8'));
export class MemoryStore {
  map = new Map();
  version = 0;
  async get(key) { return structuredClone(this.map.get(key)?.data ?? null); }
  async getWithMetadata(key) { return structuredClone(this.map.get(key) ?? null); }
  async setJSON(key, data, options = {}) {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 3));
    const current = this.map.get(key);
    if ((options.onlyIfNew && current) || (options.onlyIfMatch && current?.etag !== options.onlyIfMatch)) return { modified: false };
    const etag = '"' + ++this.version + '"';
    this.map.set(key, { data: structuredClone(data), etag });
    return { modified: true, etag };
  }
}

export function fixture(entry, outcome = 'complete') {
  const block = design.blocks.find(b => b.id === entry.blockId);
  const intro = [{ screen:'welcome' },{ screen:'consent', choice_index:0 },
    { screen:'residence_screening', residence_eligible:outcome !== 'screened_out', residence_category:outcome === 'screened_out' ? 'elsewhere_spain' : 'barcelona_city' }];
  const rows = outcome === 'screened_out' ? intro : [ ...intro,
    {screen:'instructions'}, {screen:'comprehension_check',correct:true}, {screen:'pad_instructions'},
    ...block.padIds.map(image_id=>({task:'pad_likert', image_id, pleasure_likert:0, arousal_likert:0, dominance_likert:0,
      pleasure_norm:0,arousal_norm:0,dominance_norm:0,judgeability:'yes',image_load_status:'ready'})),
    {screen:'attention_check_1',correct:true}, {screen:'pairwise_instructions'},
    ...block.pairs.map(([pair_id,image_A_id,image_B_id])=>({task:'pairwise_preference',pair_id,image_A_id,image_B_id,preference_choice:0,judgeability:'yes',image_load_status:'ready'})),
    {screen:'attention_check_2',correct:true},{screen:'demographics'},{screen:'pre_finish'}];
  rows.at(-1).record_type = 'session_summary'; rows.at(-1).outcome = outcome;
  return rows.map((r,i)=>({...r, study_trial_id:'T'+i, participant_id:entry.participantId,pair_set_id:entry.blockId,
    recruitment_source:'local',prolific_pid:'',study_mode:'production',test_submission:false,
    manifest_fingerprint:design.fingerprint,survey_version:design.surveyVersion}));
}

test('150 simultaneous claims never exceed 100 occupied places or four per block', async () => {
  const store = new MemoryStore();
  const result = await Promise.allSettled(Array.from({length:150},(_,i)=>transact(store,'quotas',state=>claim(state,'person'+i,design,1000),100)));
  assert.equal(result.filter(r=>r.status==='fulfilled').length,100);
  assert(result.filter(r=>r.status==='rejected').every(r=>r.reason.code==='full'));
  const state = await store.get('quotas');
  assert(counts(state,design,1000).every(c=>c.occupied===4));
  assert.equal(new Set(Object.values(state.entries).map(e=>e.participantId)).size,100);
});

test('concurrent retries from one cookie have one ID and one reservation',async()=>{
  const store=new MemoryStore();
  const results=await Promise.all(Array.from({length:30},()=>transact(store,'q',s=>claim(s,'same',design,1000),100)));
  assert.equal(new Set(results.map(r=>r.participantId)).size,1);
  assert.equal(Object.keys((await store.get('q')).entries).length,1);
});

test('expiration, renewal, withdrawal, terminal idempotency and late review',()=>{
  const state={entries:{}};
  const entry=claim(state,'one',design,1000);
  const renewed=claim(state,'one',design,2000);
  assert.equal(entry.participantId,renewed.participantId);
  assert.equal(renewed.expiresAt,2000+design.leaseMs);
  assert.equal(counts(state,design,renewed.expiresAt+1).reduce((a,b)=>a+b.reserved,0),0);
  const receipt={hash:'one',result:'complete'};
  assert.equal(finish(state,'one',receipt,renewed.expiresAt+1).status,'late_review');
  assert.equal(finish(state,'one',receipt,renewed.expiresAt+2).status,'late_review');
  assert.throws(()=>finish(state,'one',{hash:'different',result:'complete'},3000));
  assert.equal(claim(state,'one',design,3000).status,'late_review');
});

test('server evaluates completeness, scene schedule, missingness and attention independently',()=>{
  const state={entries:{}}, entry=claim(state,'one',design,1000);
  const rows=fixture(entry);
  assert.equal(validateRows(rows,entry,design),'complete');
  assert.equal(validateRows(fixture(entry,'screened_out'),entry,design),'screened_out');
  const bad=structuredClone(rows); bad[6].image_id='not-in-this-block';
  assert.throws(()=>validateRows(bad,entry,design));
  const flagged=structuredClone(rows); flagged.filter(r=>r.screen?.startsWith('attention_check')).forEach(r=>r.correct=false);
  assert.equal(validateRows(flagged,entry,design),'quality_review');
  const missing=structuredClone(rows); missing[6].judgeability='no'; missing[6].pleasure_likert=null; missing[6].pleasure_norm=null;
  assert.equal(validateRows(missing,entry,design),'quality_review');
  assert.throws(()=>validateRows(rows.slice(1),entry,design));
});

test('HTTP: no lease on GET; save first; retry-safe completion; authenticated own backup only',async()=>{
  const store=new MemoryStore(),responses=new MemoryStore(); let now=1000,mirrors=0;
  const handler=createHandler({store,responses,design,clock:()=>now,mirror:async()=>{mirrors++;throw Error('mock Forms failure');}});
  const url='https://'+design.host+'/.netlify/functions/local-allocation';
  const first=await handler(new Request(url));
  const cookie=first.headers.get('set-cookie').split(';')[0];
  assert.deepEqual(await first.json(),{status:'new'}); assert.equal(store.map.size,0);
  const post=(action,body='{}',cookieValue=cookie)=>handler(new Request(url+'?action='+action,{method:'POST',headers:{cookie:cookieValue,origin:'https://'+design.host},body}));
  const entry=await (await post('claim')).json();
  const rows=fixture(entry);
  const body=new URLSearchParams({'form-name':'facade_pairwise_data',participant_id:entry.participantId,pair_set_id:entry.blockId,
    recruitment_source:'local',test_submission:'false',study_mode:'production',outcome:'complete',payload_json:JSON.stringify(rows),payload_csv:''}).toString();
  const submitted=await (await post('submit',body)).json();
  assert.equal(submitted.saved,true); assert.equal(submitted.status,'complete'); assert.equal(submitted.formsCopyHttpAccepted,false);
  assert.equal((await (await post('submit',body)).json()).saved,true); assert.equal(mirrors,1);
  assert.equal(responses.map.size,1);
  const backup=await handler(new Request(url+'?action=response',{headers:{cookie}}));
  assert.deepEqual((await backup.json()).rows,rows);
  assert.equal((await handler(new Request(url+'?action=claim',{method:'POST',headers:{cookie},body:'{}'}))).status,403);
  assert.equal((await post('submit',body,'__Host-facade-local='+'f'.repeat(64))).status,403);
  const token=cookie.split('=')[1],key=createHash('sha256').update(token).digest('hex');
  assert.equal((await store.get(design.campaign+'/quotas')).entries[key].status,'complete');
});

test('storage failure never consumes a completed place',async()=>{
  const store=new MemoryStore(),responses=new MemoryStore();
  const handler=createHandler({store,responses,design,clock:()=>1000});
  const url='https://'+design.host+'/.netlify/functions/local-allocation';
  const cookie=(await handler(new Request(url))).headers.get('set-cookie').split(';')[0];
  const post=(action,body)=>handler(new Request(url+'?action='+action,{method:'POST',headers:{cookie,origin:'https://'+design.host},body}));
  const entry=await (await post('claim','{}')).json();
  responses.setJSON=async()=>{throw Error('disk unavailable');};
  const payload=new URLSearchParams({'form-name':'facade_pairwise_data',participant_id:entry.participantId,pair_set_id:entry.blockId,
    recruitment_source:'local',test_submission:'false',study_mode:'production',outcome:'complete',payload_json:JSON.stringify(fixture(entry))}).toString();
  assert.equal((await post('submit',payload)).status,503);
  assert.equal(counts(await store.get(design.campaign+'/quotas'),design,1000).reduce((sum,c)=>sum+c.complete,0),0);
});

test('a saved response survives quota-write failure and retry completes exactly once',async()=>{
  const store=new MemoryStore(),responses=new MemoryStore();
  const handler=createHandler({store,responses,design,clock:()=>1000,mirror:async()=>new Response('mock')});
  const url='https://'+design.host+'/.netlify/functions/local-allocation';
  const cookie=(await handler(new Request(url))).headers.get('set-cookie').split(';')[0];
  const post=(action,body)=>handler(new Request(url+'?action='+action,{method:'POST',headers:{cookie,origin:'https://'+design.host},body}));
  const entry=await (await post('claim','{}')).json();
  const original=store.setJSON.bind(store);let fail=true;
  store.setJSON=async(...args)=>{if(fail&&Object.values(args[1].entries).some(e=>e.responseHash)){fail=false;throw Error('simulated interruption');}return original(...args);};
  const payload=new URLSearchParams({'form-name':'facade_pairwise_data',participant_id:entry.participantId,pair_set_id:entry.blockId,
    recruitment_source:'local',test_submission:'false',study_mode:'production',outcome:'complete',payload_json:JSON.stringify(fixture(entry))}).toString();
  assert.equal((await post('submit',payload)).status,503);
  assert.equal(responses.map.size,1);
  assert.equal((await (await post('submit',payload)).json()).saved,true);
  assert.equal(responses.map.size,1);
  assert.equal(counts(await store.get(design.campaign+'/quotas'),design,1000).reduce((sum,c)=>sum+c.complete,0),1);
});

test('expired return never silently switches block or steals an occupied place',()=>{
  const localDesign={...design,blocks:[design.blocks[0]],targetPerBlock:1};
  const state={entries:{}};
  const first=claim(state,'first',localDesign,1000);
  const next=claim(state,'next',localDesign,first.expiresAt+1);
  const old=claim(state,'first',localDesign,first.expiresAt+2);
  assert.equal(old.status,'expired');assert.equal(old.participantId,first.participantId);assert.equal(old.blockId,first.blockId);
  assert.equal(finish(state,'first',{hash:'late',result:'complete'},first.expiresAt+3).status,'late_review');
  assert.equal(counts(state,localDesign,first.expiresAt+3)[0].occupied,1);
  assert.equal(next.status,'reserved');
});
