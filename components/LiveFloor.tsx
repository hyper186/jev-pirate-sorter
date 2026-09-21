'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import SortingFloor from './SortingFloor';
import type { LiveRun } from '../lib/run-queue';
import type { PirateRecord } from '../lib/types';
import type { Bin, DockRun } from '../lib/dock-types';
export default function LiveFloor({run,pirates,groups,bins,selected,art,onSelect,onFollow,paused,speed}:{run:LiveRun|null;pirates:PirateRecord[];groups:PirateRecord[][];bins:Bin[];selected:number;art:'illustrated'|'voxel';onSelect:(id:number)=>void;onFollow:(id:number)=>void;paused:boolean;speed:number}) {
 const [index,setIndex]=useState(0),[progress,setProgress]=useState(0);
 const samples=useMemo(()=>run?run.receipts.flatMap(r=>r.ids.slice(0,2)).map(id=>pirates[id-1]).filter(Boolean):[],[run,pirates]);
 const count=useRef(0), pausedRef=useRef(paused),speedRef=useRef(speed);count.current=samples.length;pausedRef.current=paused;speedRef.current=speed;
 useEffect(()=>{setIndex(0);setProgress(0);},[run?.id]);
 useEffect(()=>{
  let frame:number,previous=0,value=0;
  function tick(now:number){if(previous && !pausedRef.current && index<count.current)value=Math.min(1,value+Math.min(now-previous,100)*speedRef.current/1250);previous=now;setProgress(value);if(value>=1){setProgress(0);setIndex(i=>Math.max(i+1,count.current-8));return;}frame=requestAnimationFrame(tick);}
  frame=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frame);
 },[index,run?.id]);
 const current=samples[index]?.tokenId;
 useEffect(()=>{if(current)onFollow(current);},[current,onFollow]);
 const dockRun:DockRun|null=run?{batch:{mode:'live',model:'jev-latest',elapsedMs:run.receipts.at(-1)?.elapsedMs||0,answers:run.answers},bins:run.bins,brief:run.brief,mode:run.mode,request:null}:null;
 return <SortingFloor key={run?.id??'idle'} pirates={samples.length?samples:pirates.slice(0,24)} bins={bins} run={samples.length?dockRun:null} delivered={samples.length?Math.min(index,samples.length):0} progress={progress} selected={selected} art={art} onSelect={onSelect} paused={paused} groups={groups} total={run?.total??pirates.length} decided={run?Object.keys(run.answers).length:0}/>;
}
