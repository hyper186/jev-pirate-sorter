'use client';
import { useEffect, useRef, useState } from 'react';
import { Anchor, ExternalLink, Gauge, Pause, Play, RotateCcw, Sparkles } from 'lucide-react';
import { pirates } from '../lib/pirates';
import { advanceProgress } from '../lib/choreography';
import { destinationFor, REVIEW_BIN, type Bin, type DockRun } from '../lib/dock-types';
import SortingFloor from '../components/SortingFloor';
import OrdersEditor, { presets } from '../components/OrdersEditor';

const traitBins: Bin[] = ['Human','Zombie','Vampire','Rainbow','Golden','Shark','Special'].map(label=>({id:label,label,description:label==='Special'?'A supplied Character Type outside Human, Zombie, Vampire, Rainbow, Golden and Shark.':`Character Type contains ${label}.`}));
export default function Home() {
  const [mode,setMode]=useState<'traits'|'orders'>('traits');
  const [art,setArt]=useState<'illustrated'|'voxel'>('illustrated');
  const [brief,setBrief]=useState(presets[0].brief);
  const [customBins,setCustomBins]=useState<Bin[]>(presets[0].bins.map(b=>({...b})));
  const [run,setRun]=useState<DockRun|null>(null);
  const [requesting,setRequesting]=useState(false);
  const [delivered,setDelivered]=useState(0);
  const [progress,setProgress]=useState(0);
  const [paused,setPaused]=useState(false);
  const [speed,setSpeed]=useState(1);
  const [error,setError]=useState('');
  const [selectedId,setSelectedId]=useState(1);
  const [follow,setFollow]=useState(true);
  const epoch=useRef(0);
  const abort=useRef<AbortController|null>(null);
  const pausedRef=useRef(false), speedRef=useRef(1);
  const bins=run?.bins || (mode==='traits'?traitBins:customBins);
  const selected=pirates.find(p=>p.tokenId===selectedId) || pirates[0];
  const selectedIndex=pirates.findIndex(p=>p.tokenId===selectedId);
  const answer=run?.batch.answers[`pirate_${selectedId}`];
  const allBins=[...bins,REVIEW_BIN];
  const complete=!!run && delivered===pirates.length;
  const locked=!!run || requesting;
  const placed=run?pirates.slice(0,delivered).filter(p=>destinationFor(run.batch.answers[`pirate_${p.tokenId}`],bins)!=='review').length:0;
  const valid=mode==='traits' || (brief.trim().length>0 && customBins.every(b=>b.label.trim() && b.description.trim()) && new Set(customBins.map(b=>b.label.trim().toLowerCase())).size===customBins.length);

  useEffect(()=>{
    if (!run || delivered>=pirates.length) return;
    const currentEpoch=epoch.current;
    let frame:number, previous=0, value=0;
    function tick(now:number) {
      if(currentEpoch!==epoch.current) return;
      if(previous) value=advanceProgress(value,now-previous,speedRef.current,pausedRef.current);
      previous=now;
      setProgress(value);
      if(value>=1) { setProgress(0); setDelivered(count=>count+1); return; }
      frame=requestAnimationFrame(tick);
    }
    frame=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(frame);
  },[run,delivered]);
  useEffect(()=>{ if(run && follow && delivered<pirates.length) setSelectedId(pirates[delivered].tokenId); },[run,delivered,follow]);
  useEffect(()=>()=>{epoch.current+=1;abort.current?.abort();},[]);
  const reset=()=>{epoch.current+=1;abort.current?.abort();abort.current=null;setRun(null);setRequesting(false);setDelivered(0);setProgress(0);setPaused(false);pausedRef.current=false;setError('');};
  const select=(id:number)=>{setSelectedId(id);setFollow(false);};
  const togglePause=()=>{pausedRef.current=!pausedRef.current;setPaused(pausedRef.current);};
  async function start() {
    if(run && !complete){togglePause();return;}
    if(!valid || requesting)return;
    reset();
    const currentEpoch=epoch.current;
    const submittedBins=(mode==='traits'?traitBins:customBins).map(b=>({...b,label:b.label.trim(),description:b.description.trim()}));
    const submittedBrief=mode==='traits'?'Sort by official Character Type. Missing traits must go to review.':brief.trim();
    const request={records:pirates.map(({tokenId,traits})=>({tokenId,traits})),bins:submittedBins,brief:submittedBrief};
    const controller=new AbortController();abort.current=controller;setRequesting(true);setFollow(true);
    try {
      const response=await fetch('/api/decisions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(request),signal:controller.signal});
      const data=await response.json();
      if(epoch.current!==currentEpoch)return;
      if(!response.ok)throw new Error(data.error || 'Venice could not complete this run. Please retry.');
      if(data.mode!=='live')throw new Error('Live Jev is not configured. Add the Venice key to the server and redeploy.');
      if(pirates.some(p=>{const a=data.answers?.[`pirate_${p.tokenId}`];return !a || typeof a.choice!=='string' || !Number.isFinite(a.confidence);}))throw new Error('The batch was incomplete. No pirates were moved. Please retry.');
      setRun({batch:data,bins:submittedBins,brief:submittedBrief,mode,request});
    } catch(cause){if(epoch.current===currentEpoch)setError(cause instanceof Error?cause.message:'The request failed. Please retry.');}
    finally{if(epoch.current===currentEpoch)setRequesting(false);}
  }
  return <main className="dock-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark"><Anchor size={19}/></span><div><p className="eyebrow">A JEV DECISION EXPERIMENT</p><h1>The Pirate Sorting Dock</h1></div></div><div className="top-actions"><span className={`mode-pill ${run?'live':''}`}><span className="pulse-dot"/>{error?'Request failed':requesting?'Asking Jev…':run?'Live Jev · Venice':'Ready for your orders'}</span><a href="https://venice.ai/lp/jev" className="text-link" target="_blank" rel="noreferrer">Powered by Venice AI <ExternalLink size={13}/></a></div></header>
    <section className="hero-row"><div><p className="kicker"><Sparkles size={14}/> SMALL DECISIONS. A LIVING DOCK.</p><h2>A crew for<br/><em>every captain.</em></h2><p className="lede">Write the orders. Jev decides where each pirate belongs. Watch the arms pick, carry, and place every portrait into its crew.</p></div><div className="hero-stat"><span>ON THIS DOCK</span><strong>{pirates.length}</strong><small>real portraits · 9,999 in the archive</small></div></section>
    <section className="control-panel"><div className="segmented"><button className={mode==='traits'?'active':''} onClick={()=>{reset();setMode('traits');}}>Trait sort</button><button className={mode==='orders'?'active':''} onClick={()=>{reset();setMode('orders');}}>Captain’s Orders</button></div><label className="art-control">Portraits<select aria-label="Portrait style" value={art} onChange={e=>setArt(e.target.value as typeof art)}><option value="illustrated">Illustrated PFPs</option><option value="voxel">Voxel portraits</option></select></label><div className="control-spacer"/><div className="speed-control"><Gauge size={15}/><input aria-label="Animation speed" type="range" min="0.5" max="4" step="0.5" value={speed} onChange={e=>{const v=Number(e.target.value);speedRef.current=v;setSpeed(v);}}/><span>{speed}×</span></div><button className="reset-btn" onClick={reset}><RotateCcw size={15}/>Reset</button><button className="start-btn" disabled={requesting || !valid} onClick={start}>{requesting?'Asking Jev…':run&&!complete&&!paused?<><Pause size={16}/>Pause</>:<><Play size={16}/>{complete?'Run again':paused?'Resume':'Start sorting'}</>}</button></section>
    {mode==='orders' && <OrdersEditor brief={brief} bins={customBins} locked={locked} onBrief={setBrief} onBins={setCustomBins} onPreset={i=>{setBrief(presets[i].brief);setCustomBins(presets[i].bins.map(b=>({...b})));}}/>}
    {!valid && <p className="validation-note">Give each pile a unique name and criteria, and add a captain’s brief.</p>}
    {error && <p className="error-banner" role="alert">{error} No simulated answers were substituted.</p>}
    <section className="stats-row"><div><span>DECIDED</span><strong>{run?pirates.length:0}</strong><small>/{pirates.length}</small></div><div><span>PLACED</span><strong className="teal">{placed}</strong><small>pirates</small></div><div><span>IN REVIEW</span><strong className="amber">{delivered-placed}</strong></div><div className="stats-note">{run?`${run.batch.elapsedMs} ms · one live batch`:'One shared state · parallel decisions'}</div></section>
    <section className="sorting-layout"><SortingFloor pirates={pirates} bins={bins} run={run} delivered={delivered} progress={progress} selected={selectedId} art={art} onSelect={select} paused={paused}/>
      <aside className="inspector"><div className="inspector-head"><div><span className="section-label">DECISION INSPECTOR</span><h3>Pirate #{selectedId}</h3></div></div><label className="follow-toggle"><input type="checkbox" checked={follow} onChange={e=>setFollow(e.target.checked)}/>Follow the sorting arm</label><div className="inspector-image"><img src={selected.images[art]} alt={selected.name}/><span className="id-badge">#{selectedId}</span></div><div className="pirate-name">{selected.name}<a href={selected.source} aria-label="Open official pirate metadata" target="_blank" rel="noreferrer"><ExternalLink size={14}/></a></div><div className="trait-list">{Object.entries(selected.traits).map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}{!Object.keys(selected.traits).length&&<p>Official traits unavailable. Jev must send this pirate to review.</p>}</div>
        <div className="decision-box"><div className="decision-line"><span>JEV’S CHOICE</span><b>{answer?allBins.find(b=>b.id===answer.choice)?.label || answer.choice:'Awaiting a run'}</b></div><div className="confidence"><span>CONFIDENCE</span><strong>{answer?`${Math.round(answer.confidence*100)}%`:'—'}</strong></div><div className="confidence-bar"><i style={{width:`${answer?answer.confidence*100:0}%`}}/></div>{answer&&<p className="routing-note">{selectedIndex<delivered?'Delivered to':selectedIndex===delivered&&!complete?'Traveling to':'Queued for'} <b>{allBins.find(b=>b.id===destinationFor(answer,bins))?.label}</b>{destinationFor(answer,bins)==='review'?' · Review rule applied.':''}</p>}
          {answer?.probabilities&&<div className="probabilities"><span className="section-label">OPTION PROBABILITIES</span>{Object.entries(answer.probabilities).sort((a,b)=>b[1]-a[1]).map(([id,value])=><div key={id}><div><span>{allBins.find(b=>b.id===id)?.label || id}</span><b>{Math.round(value*100)}%</b></div><meter min={0} max={1} value={value} aria-label={`${id} probability`}/></div>)}</div>}
          <small>{run?`Actual ${run.batch.model} answer via Venice. Confidence is not a guarantee of correctness.`:'Live decisions only. Jev reads the supplied metadata, not the portrait pixels.'}</small></div>
      </aside>
    </section>
    <section className="run-receipt"><div><p className="section-label">INSIDE THE DECISION</p><h3>{run?'These orders produced this run.':'One batch. Many decisions.'}</h3><p>{run?run.brief:'Jev evaluates a separate choice question for each pirate against one shared set of metadata. The arms visualize the answers after the batch returns.'}</p></div>{run&&<div className="batch-receipt"><strong>{run.batch.elapsedMs}<small>ms</small></strong><span>{pirates.length} decisions · server-to-Venice round trip</span><span>Animation time is separate.</span></div>}
      <div className="receipt-criteria">{bins.map(bin=><div key={bin.id}><b>{bin.label}</b><p>{bin.description}</p></div>)}</div>
      {run&&<details><summary>Inspect the submitted request and model response</summary><p>The app sends this request to its server; the server calls Venice with the private API key. No key is included here.</p><h4>Submitted brief, metadata, and piles</h4><pre>{JSON.stringify(run.request,null,2)}</pre><h4>Live Jev response</h4><pre>{JSON.stringify(run.batch,null,2)}</pre></details>}
      <p className="scope-note">18 verified sample records from the 9,999-portrait archive. Answers below 85% confidence go to review. Collection expansion and quality benchmarks are separate next steps.</p>
    </section>
    <footer><a className="venice-credit" href="https://venice.ai/lp/jev" target="_blank" rel="noreferrer">Powered by Venice AI ↗</a><span>Artwork: <a href="https://github.com/proofofplay/piratenation-art" target="_blank" rel="noreferrer">Pirate Nation · CC0</a></span><a href="https://typesafe.ai" target="_blank" rel="noreferrer">Jev by TypeSafe AI ↗</a></footer>
  </main>;
}
