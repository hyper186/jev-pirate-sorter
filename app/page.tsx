'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Anchor, ChevronDown, ExternalLink, Gauge, Info, Pause, Play, RotateCcw, Sparkles, Zap } from 'lucide-react';
import { normalizeCategory } from '../lib/sorter';
import { pirates } from '../lib/pirates';
import type { PirateRecord } from '../lib/types';

type Mode = 'traits' | 'orders';
type ArtStyle = 'illustrated' | 'voxel';
type Status = 'unsorted' | 'deciding' | 'moving' | 'placed' | 'review';
type Card = PirateRecord & { category: string; status: Status; destination?: string; confidence?: number; x: number; y: number; rotation: number };

const traitBins = ['Human', 'Zombie', 'Vampire', 'Rainbow', 'Golden', 'Shark', 'Special'];
const orderPresets = [
  { label: 'Midnight watch', bins: [{ id: 'spooky', label: 'Night Watch', description: 'Undead, supernatural, ghostly or vampire themes.' }, { id: 'bright', label: 'Festival Crew', description: 'Colorful, rainbow, golden or celebratory traits.' }, { id: 'crew', label: 'Deck Crew', description: 'Ordinary human sailors and practical shipboard outfits.' }] },
  { label: 'Fleet casting', bins: [{ id: 'captain', label: 'Captains', description: 'Formal, naval, commanding or officer-like outfits.' }, { id: 'oddity', label: 'Oddities', description: 'Robots, mages, ghosts, sharks or unusual mascots.' }, { id: 'shore', label: 'Shore Party', description: 'Bright, festive or relaxed seaside personalities.' }] },
];

function makeCards(): Card[] {
  return pirates.map((pirate, index) => ({ ...pirate, category: normalizeCategory(pirate.characterType, true), status: 'unsorted', x: 50 + ((index * 29) % 260), y: 35 + ((index * 47) % 210), rotation: -12 + ((index * 17) % 25) }));
}

function previewDestination(card: Card, mode: Mode, bins: typeof orderPresets[number]['bins']): string {
  if (mode === 'traits') return card.category === 'Special' ? 'Special' : card.category;
  const type = (card.characterType || '').toLowerCase();
  if (bins[0].id === 'spooky') return type.includes('zombie') || type.includes('vampire') || type.includes('ghost') ? 'spooky' : type.includes('rainbow') || type.includes('golden') ? 'bright' : 'crew';
  if (bins[0].id === 'captain') return type.includes('human') ? 'captain' : type.includes('rainbow') || type.includes('golden') ? 'shore' : 'oddity';
  return type.includes('human') ? 'shore' : 'oddity';
}

export default function Home() {
  const [mode, setMode] = useState<Mode>('traits');
  const [artStyle, setArtStyle] = useState<ArtStyle>('illustrated');
  const [cards, setCards] = useState<Card[]>(makeCards);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState('');
  const [latency, setLatency] = useState<number | null>(null);
  const inFlight = useRef<number | null>(null);
  const decisionBatch = useRef<{ mode: string; elapsedMs?: number; answers?: Record<string, { choice: string; confidence: number }> } | null>(null);
  const [selectedId, setSelectedId] = useState(1);
  const [placedCount, setPlacedCount] = useState(0);
  const [decisionCount, setDecisionCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [liveMode, setLiveMode] = useState<'preview' | 'live' | 'ready'>('ready');
  const [preset, setPreset] = useState(0);
  const runEpoch = useRef(0);
  const bins = useMemo(() => mode === 'traits' ? traitBins.map((label) => ({ id: label, label, description: label === 'Special' ? 'A supplied Character Type outside Human, Zombie, Vampire, Rainbow, Golden and Shark.' : `Character Type contains ${label}.` })) : orderPresets[preset].bins, [mode, preset]);
  const selected = cards.find((card) => card.tokenId === selectedId) || cards[0];
  const visibleCards = useMemo(() => cards.filter((card) => card.status !== 'placed'), [cards]);

  useEffect(() => {
    if (!running || paused || inFlight.current === runEpoch.current) return;
    const next = cards.find((card) => card.status === 'unsorted');
    if (!next) { setRunning(false); return; }
    const epoch = runEpoch.current;
    const timer = window.setTimeout(async () => {
      inFlight.current = epoch;
      let destination = mode === 'traits' ? next.category : previewDestination(next, mode, bins);
      let confidence: number | undefined;
      try {
        let data = decisionBatch.current;
        if (!data) {
          const response = await fetch('/api/decisions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ records: pirates.map(({tokenId, traits}) => ({tokenId, traits})), bins }) });
          const result = await response.json();
          if (runEpoch.current !== epoch) return;
          if (!response.ok) throw new Error(result.error || 'The decision request failed. Please retry.');
          data = result;
          decisionBatch.current = data;
        }
        if (!data) throw new Error('No decision batch was returned.');
        const answer = data.answers?.[`pirate_${next.tokenId}`];
        if (data.mode === 'live' && answer?.choice && Number.isFinite(answer.confidence)) {
          destination = answer.choice; confidence = answer.confidence; setLiveMode('live'); setLatency(data.elapsedMs ?? null);
        } else if (data.mode === 'preview') {
          setLiveMode('preview');
        } else throw new Error('No valid Jev decision was returned. Sorting stopped.');
      } catch (cause) {
        if (runEpoch.current === epoch) { setError(cause instanceof Error ? cause.message : 'Decision failed.'); setRunning(false); }
        return;
      } finally { if (inFlight.current === epoch) inFlight.current = null; }
      if (runEpoch.current !== epoch) return;
      const accepted = (confidence === undefined || confidence >= 0.85) && bins.some((bin) => bin.id === destination);
      setDecisionCount((count) => count + 1);
      if (!accepted) setReviewCount((count) => count + 1);
      setCards((current) => current.map((card) => card.tokenId === next.tokenId ? { ...card, status: accepted ? 'moving' : 'review', destination, confidence } : card));
      window.setTimeout(() => {
        if (!accepted) return;
        if (runEpoch.current !== epoch) return;
        setCards((current) => current.map((card) => card.tokenId === next.tokenId ? { ...card, status: 'placed' } : card));
        setPlacedCount((count) => count + 1);
      }, Math.max(120, 720 / speed));
    }, Math.max(110, 860 / speed));
    return () => window.clearTimeout(timer);
  }, [running, paused, cards, mode, bins, speed]);

  const reset = () => { runEpoch.current += 1; setRunning(false); setPaused(false); setCards(makeCards()); setPlacedCount(0); setDecisionCount(0); setReviewCount(0); setLiveMode('ready'); decisionBatch.current = null; setError(''); setLatency(null); };
  const start = () => { setError(''); if (placedCount === pirates.length) reset(); setRunning(true); setPaused(false); };

  return <main className="dock-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><Anchor size={17} /></span><div><p className="eyebrow">TYPESAFE × VENICE</p><h1>Jev&apos;s Pirate Sorting Dock</h1></div></div>
      <div className="top-actions"><span className={`mode-pill ${liveMode}`}><span className="pulse-dot" />{error ? 'Decision error' : liveMode === 'live' ? 'Live Jev' : liveMode === 'ready' ? 'Ready to test Jev' : 'Preview mode'}</span><a className="text-link" href="https://venice.ai/lp/jev" target="_blank" rel="noreferrer">How Jev works <ExternalLink size={13} /></a></div>
    </header>
    <section className="hero-row"><div><p className="kicker"><Sparkles size={14} /> MACHINE-NATIVE INTELLIGENCE</p><h2>Give a pile of pirates<br /><em>a captain&apos;s orders.</em></h2><p className="lede">Jev makes the decision. The dock does the work. Watch a fast, type-safe model turn Pirate Nation traits into a living sorting system.</p></div><div className="hero-stat"><span>COLLECTION INDEX</span><strong>9,999</strong><small>archived Founder PFPs</small></div></section>
    <section className="control-panel"><div className="segmented"><button className={mode === 'traits' ? 'active' : ''} onClick={() => { setMode('traits'); reset(); }}>Trait sort</button><button className={mode === 'orders' ? 'active' : ''} onClick={() => { setMode('orders'); reset(); }}>Captain&apos;s Orders</button></div><div className="control-group"><label>Portraits</label><button className="select-btn" onClick={() => setArtStyle(artStyle === 'illustrated' ? 'voxel' : 'illustrated')}>{artStyle === 'illustrated' ? 'Illustrated PFPs' : 'Voxel portraits'} <ChevronDown size={14} /></button></div>{mode === 'orders' && <div className="control-group"><label>Brief</label><button className="select-btn" onClick={() => { setPreset((preset + 1) % orderPresets.length); reset(); }}>{orderPresets[preset].label} <ChevronDown size={14} /></button></div>}<div className="control-spacer" /><div className="speed-control"><Gauge size={14} /><input aria-label="Animation speed" type="range" min="0.5" max="2.5" step="0.5" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} /><span>{speed}×</span></div><button className="reset-btn" onClick={reset}><RotateCcw size={15} /> Reset</button><button className="start-btn" onClick={running && !paused ? () => setPaused(true) : start}>{running && !paused ? <><Pause size={16} /> Pause</> : <><Play size={16} /> {running ? 'Resume' : 'Start sorting'}</>}</button></section>
    {error && <p className="error-banner" role="alert">{error} No simulated decisions were substituted.</p>}<section className="stats-row"><div><span>DECIDED</span><strong>{decisionCount}</strong><small>/ {pirates.length}</small></div><div><span>PLACED</span><strong className="teal">{placedCount}</strong><small>cards</small></div><div><span>IN REVIEW</span><strong className="amber">{reviewCount}</strong><small>uncertain</small></div><div className="stats-note"><Zap size={15} /> One shared state. Many typed decisions. <b>{mode === 'traits' ? 'Official metadata' : 'Human-written criteria'}</b></div></section>
    <section className="sorting-layout"><div className="stage-wrap"><div className="stage-head"><div><span className="section-label">LIVE SORTING FLOOR</span><p>{running ? (paused ? 'Dock paused — decisions are held safely.' : 'Arms are reading the pile…') : '18 real portraits. One shared pile.'}</p></div><div className="arm-status"><i className="arm-light" /> 2 sorting arms</div></div><div className={`stage ${running && !paused ? 'working' : ''}`}><div className="stage-grid" /><div className="glow" /><div className="arm arm-left"><span className="joint one" /><span className="joint two" /><span className="gripper" /></div><div className="arm arm-right"><span className="joint one" /><span className="joint two" /><span className="gripper" /></div><div className="pile-label">ON THE DOCK <b>{visibleCards.length}</b></div><div className="card-pile">{visibleCards.map((card, index) => <button key={card.tokenId} className={`pirate-card ${card.status} ${selectedId === card.tokenId ? 'selected' : ''}`} onClick={() => setSelectedId(card.tokenId)} style={{ left: `${card.x}px`, top: `${card.y}px`, zIndex: index, transform: `rotate(${card.rotation}deg) ${card.status === 'moving' ? 'translate(90px, -40px) scale(1.04)' : ''}` }}><img src={artStyle === 'illustrated' ? card.images.illustrated : card.images.voxel} alt={card.name} /><span>#{card.tokenId}</span></button>)}</div><div className="dock-floor" /></div><div className="pile-grid">{bins.map((bin) => <div className="destination-pile" key={bin.id}><div className="pile-crest">{bin.id === 'spooky' ? '☾' : bin.id === 'bright' ? '✦' : bin.id === 'captain' ? '⚓' : '◇'}</div><div><span>{bin.label}</span><strong>{cards.filter((card) => card.status === 'placed' && card.destination === bin.id).length}</strong></div><small>{bin.description}</small><div className="sorted-cards">{cards.filter((card) => card.status === 'placed' && card.destination === bin.id).map((card) => <button key={card.tokenId} onClick={() => setSelectedId(card.tokenId)} aria-label={`Inspect sorted pirate ${card.tokenId}`}><img src={card.images[artStyle]} alt={card.name} /></button>)}</div></div>)}</div></div><aside className="inspector"><div className="inspector-head"><div><span className="section-label">DECISION INSPECTOR</span><h3>Pirate #{selected?.tokenId}</h3></div><Info size={17} /></div>{selected && <><div className="inspector-image"><img src={artStyle === 'illustrated' ? selected.images.illustrated : selected.images.voxel} alt={selected.name} /><span className="id-badge">#{selected.tokenId}</span></div><div className="pirate-name">{selected.name}<a href={selected.source} target="_blank" rel="noreferrer"><ExternalLink size={13} /></a></div><div className="trait-list">{Object.entries(selected.traits).map(([key, value]) => <div key={key}><span>{key}</span><b>{value}</b></div>)}{!selected.characterType && <div><span>Category</span><b className="fallback">Rare fallback</b></div>}</div><div className="decision-box"><div className="decision-line"><span>JEV DESTINATION</span><b>{selected.status === 'unsorted' ? 'Waiting…' : selected.destination || 'Review'}</b></div><div className="confidence"><span>CONFIDENCE</span><strong>{selected.confidence !== undefined ? `${Math.round(selected.confidence * 100)}%` : '—'}</strong></div><div className="confidence-bar"><i style={{ width: `${(selected.confidence || 0) * 100}%` }} /></div><small>{liveMode === 'live' ? `Live answer from Venice · jev-latest${latency ? ` · batch ${latency} ms` : ''}` : liveMode === 'ready' ? 'Start sorting to request live decisions.' : 'Simulated preview · no model confidence reported'}</small></div></>}</aside></section>
    <section className="how-it-works"><h3>One batch. Many decisions.</h3><p>We send the 18 pirates’ official traits to <b>jev-latest</b> through Venice AI in one shared context. Jev evaluates a choice question for each pirate in parallel. The dock places answers with confidence of at least 85%; uncertain answers stay for review.</p><p>Try Captain’s Orders to sort by a crew’s purpose instead of a species. Jev reads metadata, not the portrait images. This prototype samples 18 of the 9,999 archived portraits.</p>{latency !== null && <p className="teal">Last live batch: {pirates.length} pirate decisions in {latency} ms, including the server’s Venice request. Animation plays afterward.</p>}</section><footer><a className="venice-credit" href="https://venice.ai/lp/jev" target="_blank" rel="noreferrer">Powered by Venice AI ↗</a><span>Artwork from <a href="https://github.com/proofofplay/piratenation-art" target="_blank" rel="noreferrer">Pirate Nation Art</a> · CC0</span><span>Jev returns decisions, not prose. <a href="https://typesafe.ai" target="_blank" rel="noreferrer">TypeSafe AI ↗</a></span></footer>
  </main>;
}
