import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { getStore } from '@netlify/blobs';
import { counts, transact } from '../netlify/lib/allocation-core.mjs';
import design from '../netlify/lib/prolific-design.mjs';

const { values } = parseArgs({ options: {
  out: { type:'string' }, 'release-id': { type:'string' }, reason: {type:'string'},
  'confirm-release': {type:'boolean',default:false}, help: {type:'boolean',default:false}
} });
if (values.help) {
  console.log('Private Prolific export tool. Set NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN in the process environment.\nExport: node tools/manage-prolific-allocation.mjs --out <PRIVATE_DIRECTORY_OUTSIDE_REPO>\nRelease a returned or reviewed participant place: --release-id <PROLIFIC_PID> --reason "..." --confirm-release. Never release an active Prolific participant. No payment decisions are made.');
  process.exit(0);
}
if (!values.out) throw Error('Specify --out outside the public questionnaire repository');
const repo=fs.realpathSync(path.resolve(import.meta.dirname,'..'));
const output=path.resolve(values.out);
let ancestor=output;
while(!fs.existsSync(ancestor)) ancestor=path.dirname(ancestor);
const resolvedOutput=path.resolve(fs.realpathSync(ancestor),path.relative(ancestor,output));
if(resolvedOutput===repo||resolvedOutput.startsWith(repo+path.sep)) throw Error('Never export participant records into the public repository');
if(!process.env.NETLIFY_SITE_ID||!process.env.NETLIFY_AUTH_TOKEN) throw Error('NETLIFY_SITE_ID and NETLIFY_AUTH_TOKEN are required; never place them in frontend files');
const options={siteID:process.env.NETLIFY_SITE_ID,token:process.env.NETLIFY_AUTH_TOKEN,consistency:'strong',
  fetch:async(input,options)=>{const r=await fetch(input,options);if(!r.ok&&![304,404,412].includes(r.status))throw Error('Netlify private storage request failed');return r;}};
const store=getStore({name:'facade-prolific-allocation',...options});
const responses=getStore({name:'facade-prolific-responses',...options});
const key=design.campaign+'/quotas';
if(values['release-id']) {
  if(!/^[a-f0-9]{24}$/i.test(values['release-id'])||!values.reason?.trim()||!values['confirm-release']) throw Error('Release requires a valid participant ID, a reason, and --confirm-release');
  await transact(store,key,state=>{
    const entry=Object.values(state.entries).find(e=>e.participantId===values['release-id']);
    if(!entry)throw Error('Participant not found in this campaign');
    if(entry.status==='excluded_after_review')return;
    if(!['complete','reserved'].includes(entry.status))throw Error('Only a complete or explicitly returned reservation can be reopened');
    entry.status='excluded_after_review';entry.reviewReason=values.reason.trim();entry.reviewedAt=new Date().toISOString();
  });
}
const state=await store.get(key,{type:'json',consistency:'strong'});
if(!state)throw Error('No allocation state exists yet; check the deployed site and campaign');
const exportDir=path.join(resolvedOutput,new Date().toISOString().replaceAll(':','-'));
fs.mkdirSync(path.join(exportDir,'all_responses'),{recursive:true});
fs.mkdirSync(path.join(exportDir,'preliminary_usable'),{recursive:true});
const byId=new Map(Object.values(state.entries).map(e=>[e.participantId,e]));
const entries=[];
for await(const page of responses.list({prefix:design.campaign+'/responses/',paginate:true})) {
  for(const blob of page.blobs) {
    const record=await responses.get(blob.key,{type:'json',consistency:'strong'});
    if(!record||!/^[a-f0-9]{24}$/i.test(record.participantId)||!Array.isArray(record.rows))throw Error('Unexpected private response record');
    const entry=byId.get(record.participantId);
    const status=entry?.responseHash===record.responseHash?entry.status:'pending_reconciliation';
    const rows=record.rows.map(r=>({...r,allocation_final_status:status}));
    const json=JSON.stringify(rows,null,2);
    fs.writeFileSync(path.join(exportDir,'all_responses',record.participantId+'.json'),json);
    if(status==='complete' && record.preliminaryResult==='complete')fs.writeFileSync(path.join(exportDir,'preliminary_usable',record.participantId+'.json'),json);
    entries.push({participantId:record.participantId,blockId:record.blockId,status,quality:record.preliminaryResult,receivedAt:record.receivedAt,reviewReason:entry?.reviewReason||''});
  }
}
const report={campaign:design.campaign,exportedAt:new Date().toISOString(),targetPerBlock:design.targetPerBlock,
  quotas:counts(state,design,Date.now()).map(c=>({...c,target:design.blockTargets[c.blockId]})),responses:entries,
  reservations:Object.values(state.entries).filter(e=>e.status==='reserved').map(e=>({participantId:e.participantId,blockId:e.blockId,expiresAt:e.expiresAt})),
  note:'This campaign counts 95 new Prolific completions, not quality-approved responses. The five initial B01 responses and all self-recruited responses must be exported separately. Expired, late and quality-review responses remain available in all_responses.'};
fs.writeFileSync(path.join(exportDir,'allocation-report.json'),JSON.stringify(report,null,2));
console.log(`Exported ${entries.length} responses to ${exportDir}.`);
