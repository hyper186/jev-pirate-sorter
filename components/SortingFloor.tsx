'use client';
import { useState } from 'react';
import { flightPose, pilePosition, sourcePosition, type Point } from '../lib/choreography';
import { destinationFor, REVIEW_BIN, type Bin, type DockRun } from '../lib/dock-types';
import type { PirateRecord } from '../lib/types';

type Props = { pirates: PirateRecord[]; bins: Bin[]; run: DockRun | null; delivered: number; progress: number; selected: number; art: 'illustrated' | 'voxel'; onSelect: (id: number) => void; paused: boolean; groups?: PirateRecord[][]; total?: number; decided?: number };
function Portrait({ pirate, art, point, angle = 0, active = false, onSelect }: { pirate: PirateRecord; art: Props['art']; point: Point; angle?: number; active?: boolean; onSelect: Props['onSelect'] }) {
  const [failed, setFailed] = useState(false);
  return <g role="button" tabIndex={0} aria-label={`Inspect pirate ${pirate.tokenId}`} onClick={() => onSelect(pirate.tokenId)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(pirate.tokenId); } }} className="svg-card" transform={`translate(${point.x} ${point.y}) rotate(${angle})`}>
    <rect x="-29" y="-36" width="58" height="76" rx="6" fill="#223a40" stroke={active ? '#ffc875' : '#789991'} strokeWidth={active ? 3 : 1.3} />
    {!failed ? <image key={art} href={pirate.images[art]} x="-26" y="-33" width="52" height="64" preserveAspectRatio="xMidYMid slice" onError={() => setFailed(true)} /> : <text textAnchor="middle" y="0" fill="#b7dad1" fontSize="14">⚓</text>}
    <rect x="-26" y="23" width="52" height="13" rx="2" fill="#0a151ce6" /><text textAnchor="middle" y="33" fill="#e9f5f0" fontSize="9">#{pirate.tokenId}</text>
  </g>;
}
function Arm({ base, wrist, side, active }: { base: Point; wrist: Point; side: number; active: boolean }) {
  const elbow = { x: (base.x + wrist.x) / 2 + (side === 0 ? -105 : 105), y: (base.y + wrist.y) / 2 - 18 };
  const points = `${base.x},${base.y} ${elbow.x},${elbow.y} ${wrist.x},${wrist.y}`;
  return <g className="mechanical-arm" pointerEvents="none">
    <polyline points={points} fill="none" stroke="#061116" strokeWidth="22" strokeLinejoin="round" strokeLinecap="round" transform="translate(4 7)" />
    <polyline points={points} fill="none" stroke="url(#brass)" strokeWidth="13" strokeLinejoin="round" strokeLinecap="round" />
    <polyline points={points} fill="none" stroke="#e1c386" strokeWidth="2" opacity=".7" />
    {[base, elbow].map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r={i ? 12 : 21} fill="#172a2e" stroke="#a98b56" strokeWidth="4" /><circle cx={p.x} cy={p.y} r={i ? 4 : 8} fill={active ? '#72e4c9' : '#aa9868'} /></g>)}
    <circle cx={wrist.x} cy={wrist.y - 9} r="6" fill="#c6a56c" />
    <path d={`M ${wrist.x - 19} ${wrist.y - 5} v 12 l 9 7 M ${wrist.x + 19} ${wrist.y - 5} v 12 l -9 7`} stroke={active ? '#a4ffe0' : '#c6a56c'} strokeWidth="4" fill="none" strokeLinecap="round" />
  </g>;
}
export default function SortingFloor({ pirates, bins, run, delivered, progress, selected, art, onSelect, paused, groups, total, decided }: Props) {
  const [page, setPage] = useState(0);
  const [openPile, setOpenPile] = useState<string | null>(null);
  const allBins = [...bins, REVIEW_BIN];
  const current = run && delivered < pirates.length ? pirates[delivered] : null;
  const answer = current && run?.batch.answers[`pirate_${current.tokenId}`];
  const target = answer ? destinationFor(answer, bins) : 'review';
  const targetIndex = allBins.findIndex(bin => bin.id === target);
  const pose = current ? flightPose(sourcePosition(delivered), pilePosition(targetIndex, allBins.length), progress) : null;
  const grouped = groups || allBins.map(bin => pirates.slice(0, delivered).filter(p => run && destinationFor(run.batch.answers[`pirate_${p.tokenId}`], bins) === bin.id));
  const openIndex = allBins.findIndex(b => b.id === openPile);
  return <div className="sorting-surface">
    <div className="stage-head"><div><span className="section-label">THE SORTING DOCK</span><p aria-live="polite">{pose ? `${paused ? 'Paused · ' : ''}${pose.phase} pirate #${current?.tokenId} → ${allBins[targetIndex]?.label}` : delivered === pirates.length ? 'Manifest complete. Inspect any pile.' : 'One shared pile. Waiting for your orders.'}</p></div><span className="sample-tag">{(total ?? pirates.length).toLocaleString()} pirates</span></div>
    <div className="floor-scroll"><svg className="sorting-svg" viewBox="0 0 1000 700" aria-label="Pirate sorting dock with two articulated arms and destination piles">
      <defs><linearGradient id="brass"><stop stopColor="#65543c" /><stop offset=".5" stopColor="#e2c58a" /><stop offset="1" stopColor="#958054" /></linearGradient><pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 H 0 V 32" fill="none" stroke="#619a91" strokeOpacity=".07" /></pattern><radialGradient id="floorGlow"><stop stopColor="#1a4b46" stopOpacity=".4" /><stop offset="1" stopColor="#102026" stopOpacity="0" /></radialGradient></defs>
      <rect width="1000" height="700" fill="#101e24" /><rect width="1000" height="700" fill="url(#grid)" /><ellipse cx="500" cy="345" rx="315" ry="235" fill="url(#floorGlow)" />
      <ellipse cx="500" cy="400" rx="195" ry="78" fill="#0a171c" stroke="#345d58" strokeDasharray="4 6" />
      <text x="500" y="495" textAnchor="middle" className="svg-label">UNSORTED MANIFEST</text><text x="500" y="527" textAnchor="middle" fill="#90e9d2" fontSize="27">{((total ?? pirates.length) - (decided ?? delivered)).toLocaleString()}</text>
      {allBins.map((bin, index) => { const point = pilePosition(index, allBins.length); const active = !!current && bin.id === target; return <g key={bin.id}>
        <g role="button" tabIndex={0} aria-label={`Open ${bin.label} pile, ${grouped[index].length} pirates`} onClick={() => {setOpenPile(openPile === bin.id ? null : bin.id);setPage(0);}} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpenPile(bin.id);setPage(0); } }} className="pile-hit">
          <rect x={point.x - 93} y={point.y - 69} width="186" height="134" rx="13" fill={active ? '#203b38' : '#14282c'} stroke={bin.id === 'review' ? '#95784a' : active ? '#7cf5d0' : '#2a4548'} strokeWidth={active ? 2 : 1} />
          <text x={point.x - 80} y={point.y - 47} fill="#b8d5ce" fontSize="13">{bin.label.length > 21 ? `${bin.label.slice(0, 20)}…` : bin.label}</text>
          <text x={point.x + 79} y={point.y + 53} textAnchor="end" fill={bin.id === 'review' ? '#ffc875' : '#78d8bd'} fontSize="16">{grouped[index].length}</text>
          {grouped[index].length === 0 && <text x={point.x} y={point.y + 15} textAnchor="middle" fill="#4e7472" fontSize="11">{active ? 'Incoming pirate…' : 'Awaiting crew'}</text>}
        </g>
        {grouped[index].slice(0,4).map((pirate, i) => <Portrait key={pirate.tokenId} pirate={pirate} art={art} point={{x:point.x - 32 + i * 19,y:point.y + 4}} angle={-9 + i * 6} active={selected === pirate.tokenId} onSelect={id=>{onSelect(id);setOpenPile(bin.id);setPage(0);}} />)}
      </g>; })}
      {pirates.slice(delivered, delivered + 24).map((pirate, i) => { const index = delivered + i; if (i === 0 && pose) return null; return <Portrait key={pirate.tokenId} pirate={pirate} art={art} point={sourcePosition(index)} angle={-14 + index * 7 % 28} active={selected === pirate.tokenId} onSelect={onSelect} />; })}
      {current && pose && <Portrait pirate={current} art={art} point={pose.card} active onSelect={onSelect} />}
      {[0, 1].map(side => <Arm key={side} base={{x:side === 0 ? 340 : 660,y:48}} wrist={pose?.arm === side ? pose.wrist : {x:side === 0 ? 380 : 620,y:185}} side={side} active={!!pose && pose.arm === side} />)}
      <text x="500" y="36" textAnchor="middle" className="svg-label">JEV DECIDES · THE DOCK DELIVERS</text>
    </svg></div>
    <p className="floor-hint">Arms illustrate selected real decisions. Pile counts include every Jev answer. Select a pile to browse all its pirates; swipe the dock on small screens.</p>
    {openIndex >= 0 && <section className="pile-browser"><div><h3>{allBins[openIndex].label} · {grouped[openIndex].length} pirates</h3><button onClick={() => setOpenPile(null)} aria-label="Close pile browser">Close</button></div><p>{allBins[openIndex].description}</p><div className="pile-gallery">{grouped[openIndex].slice(page*48,(page+1)*48).map(p => <button key={p.tokenId} onClick={() => onSelect(p.tokenId)}><img src={p.images[art]} alt={p.name} loading="lazy" /><span>#{p.tokenId}</span></button>)}{!grouped[openIndex].length && <p>This pile is empty so far.</p>}</div><div className="gallery-pages"><button disabled={page===0} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page+1} of {Math.max(1,Math.ceil(grouped[openIndex].length/48))}</span><button disabled={(page+1)*48>=grouped[openIndex].length} onClick={()=>setPage(page+1)}>Next</button></div></section>}
  </div>;
}
