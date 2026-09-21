import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFlow, ingestFlow, advanceFlow, TRAVEL_MS} from '../lib/decision-flow.ts';
const answers=Object.fromEntries(Array.from({length:9999},(_,i)=>[`pirate_${i+1}`,{choice:'Human',confidence:.99}]));
const bins=[{id:'Human',label:'Human',description:'human'},{id:'Zombie',label:'Zombie',description:'zombie'}];
test('each of 9999 returned answers creates exactly one visual event with its true destination',()=>{
 const flow=createFlow();
 for(let offset=0;offset<9999;offset+=128)ingestFlow(flow,Array.from({length:Math.min(128,9999-offset)},(_,i)=>i+offset+1),answers,bins,offset);
 assert.equal(flow.emitted,9999);assert.equal(new Set(flow.active.map(e=>e.id)).size,9999);assert.ok(flow.active.every(e=>e.destination==='Human'));
});
test('duplicate receipt updates cannot replay or double count any pirate',()=>{
 const flow=createFlow();ingestFlow(flow,[1,2,3],answers,bins,100);ingestFlow(flow,[1,2,3,4],answers,bins,110);
 assert.equal(flow.emitted,4);assert.deepEqual(flow.active.map(e=>e.started),[100,100,100,110]);
});
test('visible transit is bounded and never invents activity while Jev is waiting',()=>{
 const flow=createFlow();ingestFlow(flow,[1,2],answers,bins,100);advanceFlow(flow,100+TRAVEL_MS-1);assert.equal(flow.active.length,2);advanceFlow(flow,100+TRAVEL_MS);assert.equal(flow.active.length,0);assert.equal(flow.arrived,2);advanceFlow(flow,10000);assert.equal(flow.arrived,2);
});
test('restored results are seeded as already sorted instead of replayed at fake live speed',()=>{
 const flow=createFlow([1,2]);ingestFlow(flow,[1,2,3],answers,bins,100);assert.equal(flow.emitted,3);assert.equal(flow.arrived,2);assert.deepEqual(flow.active.map(e=>e.id),[3]);
});
test('low confidence uses the actual review policy and absent answers emit nothing',()=>{
 const flow=createFlow();ingestFlow(flow,[1,2],{pirate_1:{choice:'Human',confidence:.5}},bins,0);assert.equal(flow.active[0].destination,'review');assert.equal(flow.emitted,1);
});
