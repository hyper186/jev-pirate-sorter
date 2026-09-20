import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceProgress, flightPose, pilePosition, sourcePosition } from '../lib/choreography.ts';
test('pause freezes a carried card, speed scales progress, and delivery clamps to completion', () => {
  assert.equal(advanceProgress(0.5, 500, 2, true), 0.5);
  assert.ok(advanceProgress(0.2, 100, 2, false) > advanceProgress(0.2, 100, 1, false));
  assert.equal(advanceProgress(0.99, 5000, 1, false), 1);
});
test('gripper meets the card before lifting and delivers it to the exact selected pile', () => {
  const source = sourcePosition(4), destination = pilePosition(2, 4);
  const pickup = flightPose(source, destination, 0.22);
  assert.deepEqual(pickup.card, source);
  assert.deepEqual(pickup.wrist, { x: source.x, y: source.y - 34 });
  const drop = flightPose(source, destination, 1);
  assert.deepEqual(drop.card, destination);
  assert.deepEqual(drop.wrist, { x: destination.x, y: destination.y - 34 });
});
test('every destination including review has a distinct location on the dock', () => {
  const points = Array.from({length:8}, (_, i) => pilePosition(i,8));
  assert.equal(new Set(points.map(p => `${p.x},${p.y}`)).size, 8);
  assert.ok(points.every(p => p.x >= 80 && p.x <= 920 && p.y >= 100 && p.y <= 630));
});
