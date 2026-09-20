import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCategory, routeDecision } from '../lib/sorter.ts';
import { createRun, reduceRun } from '../lib/run.ts';

test('normalizes official character families and preserves special records', () => {
  assert.equal(normalizeCategory('Zombie Male', false), 'Zombie');
  assert.equal(normalizeCategory('Rainbow Yawn Female', false), 'Rainbow');
  assert.equal(normalizeCategory('POP Team PFP', false), 'Special');
  assert.equal(normalizeCategory(undefined, true), 'Rare');
});

test('routes only confident, allowed choices and sends uncertainty to review', () => {
  assert.equal(routeDecision({ choice: 'Zombie', confidence: 0.91 }, ['Zombie', 'Human']), 'Zombie');
  assert.equal(routeDecision({ choice: 'Zombie', confidence: 0.64 }, ['Zombie', 'Human']), 'Review');
  assert.equal(routeDecision({ choice: 'Vampire', confidence: 0.99 }, ['Zombie', 'Human']), 'Review');
  assert.equal(routeDecision(null, ['Zombie', 'Human']), 'Review');
});

test('run reducer is idempotent and rejects stale revisions', () => {
  const initial = createRun(['1', '42']);
  const accepted = reduceRun(initial, { type: 'accepted', revision: 1, tokenId: '1', destination: 'Zombie', confidence: 0.95 });
  const reserved = reduceRun(accepted, { type: 'reserved', revision: 1, tokenId: '1', armId: 'arm-1' });
  const placed = reduceRun(reserved, { type: 'placed', revision: 1, tokenId: '1' });
  const duplicate = reduceRun(placed, { type: 'placed', revision: 1, tokenId: '1' });
  const stale = reduceRun(duplicate, { type: 'accepted', revision: 0, tokenId: '42', destination: 'Human', confidence: 0.99 });
  assert.equal(duplicate.counts.placed, 1);
  assert.equal(stale.cards['42'].status, 'unsorted');
  assert.equal(stale.cards['1'].status, 'placed');
});
