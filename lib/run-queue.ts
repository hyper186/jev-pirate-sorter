import type { Answer, Batch, Bin } from './dock-types.ts';
export const COLLECTION_VERSION = 'pirates-9999-2026-09-20-v1';
export const BATCH_SIZE = 128;
export const CONCURRENCY = 4;
export function batchSizeFor(bins:Bin[]){return bins.reduce((n,b)=>n+b.description.length+b.label.length,0)>1400?32:BATCH_SIZE;}
export type Receipt = { ids: number[]; elapsedMs: number; receivedAt: string; usage?: Batch['usage'] };
export type LiveRun = {
  version: string; id: string; total: number; mode: 'traits'|'orders'; bins: Bin[]; brief: string;
  answers: Record<string, Answer>; receipts: Receipt[]; attempts: number; retries: number;
  activeMs: number; status: 'running'|'paused'|'complete'|'error'; cooldownUntil?: number; error?: string; startedAt: string;
};
export function newRun(total: number, mode: LiveRun['mode'], bins: Bin[], brief: string): LiveRun {
  return {version:COLLECTION_VERSION,id:crypto.randomUUID(),total,mode,bins,brief,answers:{},receipts:[],attempts:0,retries:0,activeMs:0,status:'paused',startedAt:new Date().toISOString()};
}
export function metrics(run: LiveRun) {
  const decided=Object.keys(run.answers).length;
  const latencies=run.receipts.map(r=>r.elapsedMs).sort((a,b)=>a-b);
  const allUsage=run.receipts.length>0 && run.receipts.every(r=>Number.isFinite(r.usage?.input_tokens) && Number.isFinite(r.usage?.output_tokens));
  return {decided,perSecond:run.activeMs>0?decided/(run.activeMs/1000):0,medianMs:latencies.length?latencies[Math.floor(latencies.length/2)]:0,p95Ms:latencies.length?latencies[Math.min(latencies.length-1,Math.ceil(latencies.length*.95)-1)]:0,inputTokens:allUsage?run.receipts.reduce((sum,r)=>sum+r.usage!.input_tokens!,0):null,outputTokens:allUsage?run.receipts.reduce((sum,r)=>sum+r.usage!.output_tokens!,0):null};
}
export class RateLimitError extends Error {
 retryAfterMs: number;
 constructor(retryAfterMs:number){super('Venice rate limit. Waiting before retrying.');this.retryAfterMs=retryAfterMs;}
}
export async function runQueue(run: LiveRun, options: {
  signal: AbortSignal; fetchBatch: (ids: number[])=>Promise<Batch>; onUpdate: (run: LiveRun)=>void;
  shouldPause?: ()=>boolean; retryDelayMs?: number;
}) {
  const {signal}=options;
  const pending=Array.from({length:run.total},(_,i)=>i+1).filter(id=>!run.answers[`pirate_${id}`]);
  const batchSize=batchSizeFor(run.bins);
  const chunks:number[][]=[];for(let i=0;i<pending.length;i+=batchSize)chunks.push(pending.slice(i,i+batchSize));
  let cursor=0,failed=false;const baseMs=run.activeMs,started=performance.now();
  run.status='running';run.error=undefined;
  const update=()=>{run.activeMs=baseMs+performance.now()-started;if(!signal.aborted)options.onUpdate(run);};
  const allowed=new Set([...run.bins.map(b=>b.id),'review']);
  async function worker() {
    while(!signal.aborted && !failed && !options.shouldPause?.()) {
      const ids=chunks[cursor++];if(!ids)return;
      for(let attempt=0;attempt<3;attempt++) {
        while((run.cooldownUntil??0)>Date.now() && !signal.aborted && !options.shouldPause?.()) await new Promise(r=>setTimeout(r,Math.min(200,(run.cooldownUntil??0)-Date.now())));
        if(signal.aborted || options.shouldPause?.())return;
        run.attempts++;if(attempt)run.retries++;
        try {
          const batch=await options.fetchBatch(ids);
          if(signal.aborted)return;
          if(batch.mode!=='live' || ids.some(id=>{const a=batch.answers?.[`pirate_${id}`];return !a || !allowed.has(a.choice) || !Number.isFinite(a.confidence) || a.confidence<0 || a.confidence>1;}))throw Error('Incomplete or invalid Jev batch. Resume to retry this batch.');
          for(const id of ids)run.answers[`pirate_${id}`]=batch.answers[`pirate_${id}`];
          run.receipts.push({ids,elapsedMs:batch.elapsedMs,receivedAt:new Date().toISOString(),usage:batch.usage});
          update();break;
        } catch(error) {
          if(signal.aborted)return;
          if(error instanceof RateLimitError){run.cooldownUntil=Math.max(run.cooldownUntil??0,Date.now()+error.retryAfterMs);update();}
          if(attempt===2){failed=true;run.error=error instanceof Error?error.message:'Batch failed. Resume to retry.';break;}
          if(error instanceof RateLimitError)continue;
          await new Promise<void>(resolve=>{const done=()=>{clearTimeout(timer);signal.removeEventListener('abort',done);resolve();};const timer=setTimeout(done,(options.retryDelayMs??1000)*2**attempt);signal.addEventListener('abort',done,{once:true});});
        }
      }
    }
  }
  await Promise.all(Array.from({length:CONCURRENCY},()=>worker()));
  if(signal.aborted)return;
  run.status=Object.keys(run.answers).length===run.total?'complete':failed?'error':'paused';update();
}
