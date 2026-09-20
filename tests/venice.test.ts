import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanApiKey, decide } from '../lib/venice.ts';
const request = () => new Request('https://example.test', { method: 'POST', body: JSON.stringify({ records: [{ tokenId: 1, traits: { 'Character Type': 'Zombie Male' } }], bins: [{ id: 'Zombie', description: 'Zombies' }, { id: 'Human', description: 'Humans' }] }) });
test('trims pasted key whitespace and rejects embedded control characters', () => {
  assert.equal(cleanApiKey('  test-key\n'), 'test-key');
  assert.throws(() => cleanApiKey('test\nkey'));
});
test('network failures never expose credentials or become preview decisions', async () => {
  const response = await decide(request(), 'test-secret', async () => { throw new Error('Bearer test-secret'); });
  assert.equal(response.status, 502);
  assert.equal((await response.text()).includes('test-secret'), false);
});
test('uses shared metadata and validates live typed answers', async () => {
  const response = await decide(request(), ' test-key\n', async (_url, init) => {
    const payload = JSON.parse(init!.body as string);
    assert.equal(payload.state.records[0].traits['Character Type'], 'Zombie Male');
    assert.equal((init!.headers as any).Authorization, 'Bearer test-key');
    return Response.json({ answers: { pirate_1: { choice: 'Zombie', confidence: 0.99 } } });
  });
  assert.equal((await response.json()).mode, 'live');
  const invalid = await decide(request(), 'test-key', async () => Response.json({ answers: {} }));
  assert.equal(invalid.status, 502);
});
