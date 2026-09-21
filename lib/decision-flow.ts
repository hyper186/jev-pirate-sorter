import { destinationFor, type Answer, type Bin } from './dock-types.ts';
export const TRAVEL_MS = 320;
export type Flight = { id: number; destination: string; started: number };
export function createFlow(restoredIds: number[] = []) {
 const seen = new Set(restoredIds);
 return { seen, active: [] as Flight[], emitted: seen.size, arrived: seen.size };
}
export function ingestFlow(flow: ReturnType<typeof createFlow>, ids: number[], answers: Record<string, Answer>, bins: Bin[], now: number) {
 for (const id of ids) {
  const answer = answers[`pirate_${id}`];
  if (flow.seen.has(id) || !answer) continue;
  flow.seen.add(id); flow.emitted++;
  flow.active.push({ id, destination: destinationFor(answer, bins), started: now });
 }
}
export function advanceFlow(flow: ReturnType<typeof createFlow>, now: number) {
 const remaining = flow.active.filter(flight => now - flight.started < TRAVEL_MS);
 flow.arrived += flow.active.length - remaining.length;
 flow.active = remaining;
}
