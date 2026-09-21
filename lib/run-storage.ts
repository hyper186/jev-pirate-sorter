import { COLLECTION_VERSION, type LiveRun } from './run-queue';
const db=()=>new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('jev-pirate-dock',1);request.onupgradeneeded=()=>request.result.createObjectStore('runs');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
export async function saveRun(run: LiveRun | null) {
 const database=await db();return new Promise<void>((resolve,reject)=>{const tx=database.transaction('runs','readwrite');if(run)tx.objectStore('runs').put(run,'latest');else tx.objectStore('runs').delete('latest');tx.oncomplete=()=>{database.close();resolve();};tx.onerror=()=>{database.close();reject(tx.error);};});
}
export async function loadRun(): Promise<LiveRun|null> {
 const database=await db();return new Promise((resolve,reject)=>{const request=database.transaction('runs').objectStore('runs').get('latest');request.onsuccess=()=>{database.close();const run=request.result as LiveRun|undefined;resolve(run?.version===COLLECTION_VERSION?{...run,status:run.status==='complete'?'complete':'paused'}:null);};request.onerror=()=>{database.close();reject(request.error);};});
}
