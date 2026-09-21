import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runQueue, newRun, metrics, RateLimitError } from '../lib/run-queue.ts';
const bins=[{id:'Human',label:'Human',description:'Human'} ,{id:'Zombie',label:'Zombie',description:'Zombie'}];
const batch=(ids:number[])=>({mode:'live' as const,model:'jev-latest',elapsedMs:25,answers:Object.fromEntries(ids.map(id=>[`pirate_${id}`,{choice:'Human',confidence:.99}]))});
test('queues all records with bounded concurrency and preserves every answer',async()=>{
 const run=newRun(401,'traits',bins,'sort');let active=0,max=0;
 await runQueue(run,{signal:new AbortController().signal,fetchBatch:async ids=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,3));active--;return batch(ids);},onUpdate:()=>{}});
 assert.equal(Object.keys(run.answers).length,401);assert.equal(run.receipts.length,4);assert.ok(max<=4);assert.equal(run.status,'complete');assert.equal(metrics(run).inputTokens,null);
});
test('resumes only unanswered IDs and never double-counts a completed batch',async()=>{
 const run=newRun(136,'traits',bins,'sort');run.answers=batch(Array.from({length:128},(_,i)=>i+1)).answers;
 const sent:number[]=[];await runQueue(run,{signal:new AbortController().signal,fetchBatch:async ids=>{sent.push(...ids);return batch(ids);},onUpdate:()=>{}});
 assert.deepEqual(sent,[129,130,131,132,133,134,135,136]);assert.equal(Object.keys(run.answers).length,136);
});
test('invalid batches stop without inventing or partially committing answers',async()=>{
 const run=newRun(10,'traits',bins,'sort');await runQueue(run,{signal:new AbortController().signal,fetchBatch:async()=>batch([1]),onUpdate:()=>{},retryDelayMs:0});
 assert.equal(Object.keys(run.answers).length,0);assert.equal(run.status,'error');assert.equal(run.attempts,3);
});
test('pause drains in-flight batches and dispatches no additional work',async()=>{
 const run=newRun(200,'traits',bins,'sort');let paused=false;
 await runQueue(run,{signal:new AbortController().signal,shouldPause:()=>paused,fetchBatch:async ids=>{paused=true;return batch(ids);},onUpdate:()=>{}});
 assert.equal(run.status,'paused');assert.ok(Object.keys(run.answers).length<=512);assert.ok(Object.keys(run.answers).length>0);
});
test('cancellation ignores late results and provider usage is counted only when reported',async()=>{
 const run=newRun(4,'traits',bins,'sort');const abort=new AbortController();
 await runQueue(run,{signal:abort.signal,fetchBatch:async ids=>{abort.abort();return batch(ids);},onUpdate:()=>{}});
 assert.equal(Object.keys(run.answers).length,0);
 const next=newRun(4,'traits',bins,'sort');await runQueue(next,{signal:new AbortController().signal,fetchBatch:async ids=>({...batch(ids),usage:{input_tokens:100,output_tokens:20}}),onUpdate:()=>{}});
 assert.equal(metrics(next).inputTokens,100);assert.equal(metrics(next).outputTokens,20);
});
test('full collection completes exactly once across all 79 batches',async()=>{
 const run=newRun(9999,'traits',bins,'sort');const ids:number[]=[];
 await runQueue(run,{signal:new AbortController().signal,fetchBatch:async batchIds=>{ids.push(...batchIds);return batch(batchIds);},onUpdate:()=>{}});
 assert.equal(run.receipts.length,79);assert.equal(new Set(ids).size,9999);assert.equal(ids.length,9999);assert.equal(run.status,'complete');assert.equal(metrics(run).decided,9999);
});

test('honors rate-limit cooldown and automatically resumes the missing batch',async()=>{
 const run=newRun(2,'traits',bins,'sort');let calls=0;const start=performance.now();await runQueue(run,{signal:new AbortController().signal,fetchBatch:async ids=>{if(!calls++)throw new RateLimitError(40);return batch(ids);},onUpdate:()=>{}});assert.equal(run.status,'complete');assert.equal(run.retries,1);assert.ok(performance.now()-start>=35);
});
test('long custom criteria use smaller batches to bound shared prompt size',async()=>{
 const run=newRun(128,'orders',Array.from({length:6},(_,i)=>({id:`pile${i}`,label:`Pile ${i}`,description:'x'.repeat(600)})),'custom');const sizes:number[]=[];
 await runQueue(run,{signal:new AbortController().signal,fetchBatch:async ids=>{sizes.push(ids.length);return {...batch(ids),answers:Object.fromEntries(ids.map(id=>[`pirate_${id}`,{choice:'pile0',confidence:.99}]))};},onUpdate:()=>{}});
 assert.ok(sizes.every(size=>size<=32));assert.equal(run.status,'complete');
});
