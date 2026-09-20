export type CardStatus = 'unsorted' | 'decided' | 'reserved' | 'placed' | 'review';
export type Card = { tokenId: string; status: CardStatus; destination?: string; confidence?: number; armId?: string };
export type Run = { revision: number; cards: Record<string, Card>; counts: { total: number; decided: number; placed: number; review: number } };
export type RunEvent =
  | { type: 'accepted'; revision: number; tokenId: string; destination: string; confidence: number }
  | { type: 'reserved'; revision: number; tokenId: string; armId: string }
  | { type: 'placed'; revision: number; tokenId: string }
  | { type: 'review'; revision: number; tokenId: string };

export function createRun(tokenIds: string[]): Run {
  return {
    revision: 1,
    cards: Object.fromEntries(tokenIds.map((tokenId) => [tokenId, { tokenId, status: 'unsorted' }])),
    counts: { total: tokenIds.length, decided: 0, placed: 0, review: 0 },
  };
}

export function reduceRun(run: Run, event: RunEvent): Run {
  if (event.revision !== run.revision) return run;
  const card = run.cards[event.tokenId];
  if (!card) return run;
  const cards = { ...run.cards };
  if (event.type === 'accepted' && card.status === 'unsorted') {
    cards[event.tokenId] = { ...card, status: 'decided', destination: event.destination, confidence: event.confidence };
    return { ...run, cards, counts: { ...run.counts, decided: run.counts.decided + 1 } };
  }
  if (event.type === 'review' && card.status === 'unsorted') {
    cards[event.tokenId] = { ...card, status: 'review' };
    return { ...run, cards, counts: { ...run.counts, review: run.counts.review + 1 } };
  }
  if (event.type === 'reserved' && card.status === 'decided') {
    cards[event.tokenId] = { ...card, status: 'reserved', armId: event.armId };
    return { ...run, cards };
  }
  if (event.type === 'placed' && card.status === 'reserved') {
    cards[event.tokenId] = { ...card, status: 'placed' };
    return { ...run, cards, counts: { ...run.counts, placed: run.counts.placed + 1 } };
  }
  return run;
}
