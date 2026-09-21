'use client';
import { useEffect, useRef, useState } from 'react';
import { createFlow, ingestFlow, advanceFlow, TRAVEL_MS } from '../lib/decision-flow';
import { REVIEW_BIN, type Bin } from '../lib/dock-types';
import type { LiveRun } from '../lib/run-queue';
import type { PirateRecord } from '../lib/types';
const colors=['#7ce8c2','#aed478','#c7a6f6','#ff99cc','#ffcf75','#77c9f2','#e9ece4','#ffac75'];
type Props={run:LiveRun|null;pirates:PirateRecord[];groups:PirateRecord[][];bins:Bin[];art:'illustrated'|'voxel';onSelect:(id:number)=>void;onFollow:(id:number)=>void};
export default function LiveFloor(props:Props){
 const canvas=useRef<HTMLCanvasElement>(null),current=useRef(props),flow=useRef(createFlow()),identity=useRef<string|null>(null);
 const [visual,setVisual]=useState({emitted:0,arrived:0,active:0}),[open,setOpen]=useState<number|null>(null),[page,setPage]=useState(0);
 current.current=props;
 useEffect(()=>{
  const {run,bins,onFollow}=props;
  if(identity.current!== (run?.id??null)){
   identity.current=run?.id??null;
   // A restored run starts settled. Only newly returned answers animate.
   flow.current=createFlow(run?.status!=='running'?Object.keys(run?.answers??{}).map(k=>Number(k.slice(7))):[]);
  }
  if(!run){flow.current=createFlow();return;}
  const ids=run.receipts.flatMap(r=>r.ids);
  const before=flow.current.emitted;
  ingestFlow(flow.current,ids,run.answers,bins,performance.now());
  if(flow.current.emitted>before && ids.length)onFollow(ids.at(-1)!);
 },[props.run,props.bins,props.onFollow]);
 useEffect(()=>{
  const element=canvas.current;if(!element)return;
  const ctx=element.getContext('2d');if(!ctx)return;
  let frame=0,lastStats=0,width=0,height=0;
  const observer=new ResizeObserver(([entry])=>{width=entry.contentRect.width;height=entry.contentRect.height;const dpr=Math.min(devicePixelRatio,2);element.width=width*dpr;element.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);});observer.observe(element);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  function draw(now:number){
   const context=ctx!;advanceFlow(flow.current,now);
   const w=width,h=height,cx=w/2,cy=h*.53,all=[...current.current.bins,REVIEW_BIN];
   context.clearRect(0,0,w,h);
   context.strokeStyle='#75b4a50c';context.lineWidth=1;
   for(let x=0;x<w;x+=32){context.beginPath();context.moveTo(x,0);context.lineTo(x,h);context.stroke();}
   for(let y=0;y<h;y+=32){context.beginPath();context.moveTo(0,y);context.lineTo(w,y);context.stroke();}
   const target=(destination:string)=>{const index=Math.max(0,all.findIndex(b=>b.id===destination));const rows=Math.ceil(all.length/2);return{x:index<rows?w*.12:w*.88,y:(index%rows+.5)/rows*h,index};};
   const pose=(flight:typeof flow.current.active[number])=>{const end=target(flight.destination),p=Math.min(1,(now-flight.started)/TRAVEL_MS);const spread=((flight.id*37)%101-50);return{x:cx+(end.x-cx)*p+Math.sin(p*Math.PI)*spread*.65,y:cy+(end.y-cy)*p+Math.sin(p*Math.PI)*((flight.id*23)%83-41),index:end.index};};
   // Every returned decision is drawn. Parallel decisions travel together, without a playback queue.
   if(!reduced.matches)for(const flight of flow.current.active){const p=pose(flight);context.fillStyle=colors[p.index%colors.length];context.globalAlpha=.85;context.fillRect(p.x-3,p.y-4,6,8);context.fillStyle='#0a191c';context.fillRect(p.x-1,p.y-2,2,2);}
   context.globalAlpha=1;
   for(let side=0;side<2;side++){
    const flight=flow.current.active.findLast(f=>f.id%2===side);
    const wrist=flight&&!reduced.matches?pose(flight):{x:cx+(side?42:-42),y:cy-65};
    const base={x:cx+(side?1:-1)*Math.min(w*.15,110),y:28};
    const elbow={x:(base.x+wrist.x)/2+(side?35:-35),y:(base.y+wrist.y)/2-15};
    context.beginPath();context.moveTo(base.x,base.y);context.lineTo(elbow.x,elbow.y);context.lineTo(wrist.x,wrist.y);context.lineJoin='round';context.lineCap='round';context.strokeStyle='#081216';context.lineWidth=16;context.stroke();context.strokeStyle='#b49b6b';context.lineWidth=9;context.stroke();context.strokeStyle='#e7cf9b';context.lineWidth=2;context.stroke();
    for(const joint of [base,elbow]){context.beginPath();context.arc(joint.x,joint.y,8,0,Math.PI*2);context.fillStyle='#172c2c';context.fill();context.strokeStyle=flight?'#89fbd3':'#998663';context.lineWidth=3;context.stroke();}
    context.strokeStyle=flight?'#a2ffe1':'#c4ad7d';context.lineWidth=3;context.strokeRect(wrist.x-8,wrist.y-5,16,13);
   }
   if(now-lastStats>80){setVisual({emitted:flow.current.emitted,arrived:flow.current.arrived,active:flow.current.active.length});lastStats=now;}
   frame=requestAnimationFrame(draw);
  }
  frame=requestAnimationFrame(draw);return()=>{cancelAnimationFrame(frame);observer.disconnect();};
 },[]);
 const all=[...props.bins,REVIEW_BIN],rows=Math.ceil(all.length/2),decided=Object.keys(props.run?.answers??{}).length;
 return <div className="live-floor">
  <div className="flow-heading"><span>THE LIVE DOCK <b>{visual.active?`${visual.active.toLocaleString()} in transit`:props.run?.status==='complete'?'All decisions settled':props.run?.status==='paused'?'Paused · completed decisions retained':'Waiting for the next Jev response'}</b></span><a href="#decision-inspector">Inspect decisions ↓</a></div>
  <div className="flow-stage">
   <div className="source-manifest"><div className="source-cards" title="Collection portrait preview; the number below counts remaining decisions">{props.pirates.slice(0,decided<(props.run?.total??props.pirates.length)?12:0).map((p,i)=><img key={p.tokenId} src={p.images[props.art]} alt="" style={{transform:`translate(${(i%4-1.5)*19}px,${(Math.floor(i/4)-1)*16}px) rotate(${i*17%29-14}deg)`}}/>)}</div><span>AWAITING JEV</span><strong>{((props.run?.total??props.pirates.length)-decided).toLocaleString()}</strong></div>
   <canvas ref={canvas} aria-label="Two sorting arms with one moving tile for every new Jev decision"/>
   {all.map((bin,i)=><button className="flow-pile" key={bin.id} style={{left:i<rows?'1%':'auto',right:i<rows?'auto':'1%',top:`${(i%rows+.5)/rows*100}%`,borderColor:colors[i%colors.length]+'70'}} onClick={()=>{setOpen(i);setPage(0);}} aria-label={`Open ${bin.label} pile, ${props.groups[i]?.length??0} pirates`}><span>{bin.label}</span><div className="pile-thumbnails">{props.groups[i]?.slice(0,3).map(p=><img key={p.tokenId} src={p.images[props.art]} alt=""/>)}</div><strong style={{color:colors[i%colors.length]}}>{(props.groups[i]?.length??0).toLocaleString()}</strong></button>)}
  </div>
  <div className="flow-legend"><span>1 tile = 1 returned decision · {TRAVEL_MS} ms visual travel · real response bursts</span><span data-testid="visual-counts">{visual.emitted.toLocaleString()} received · {visual.arrived.toLocaleString()} settled · {visual.active} moving</span></div>
  {open!==null&&<div className="gallery-overlay" role="dialog" aria-modal="true" aria-label={`${all[open]?.label} pile`}><section className="pile-browser"><div><h3>{all[open]?.label} · {props.groups[open]?.length} pirates</h3><button autoFocus onClick={()=>setOpen(null)}>Close pile browser</button></div><div className="pile-gallery">{props.groups[open]?.slice(page*48,(page+1)*48).map(p=><button key={p.tokenId} onClick={()=>{props.onSelect(p.tokenId);setOpen(null);document.getElementById('decision-inspector')?.scrollIntoView({behavior:'smooth'});}}><img src={p.images[props.art]} alt={p.name} loading="lazy"/><span>#{p.tokenId}</span></button>)}</div><div className="gallery-pages"><button disabled={!page} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page+1} of {Math.max(1,Math.ceil((props.groups[open]?.length??0)/48))}</span><button disabled={(page+1)*48>=(props.groups[open]?.length??0)} onClick={()=>setPage(page+1)}>Next</button></div></section></div>}
 </div>;
}
