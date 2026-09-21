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

test('sends a visitor’s captain brief and exact named pile criteria to Jev', async () => {
  let received: any;
  const response = await decide(new Request('https://example.test', { method: 'POST', body: JSON.stringify({
    brief: 'Assemble a royal delegation and a ghost crew.', records: [{ tokenId: 1, traits: { 'Character Type': 'Zombie Male' } }],
    bins: [{ id: 'royal', label: 'Royal delegation', description: 'Crowns or formal officer attire.' }, { id: 'ghosts', label: 'Ghost crew', description: 'Undead or supernatural pirates.' }],
  }) }), 'test-key', async (_url, init) => {
    received = JSON.parse(init!.body as string);
    return Response.json({ answers: { pirate_1: { choice: 'ghosts', confidence: 0.95, probabilities: { royal: 0, ghosts: 0.98, review: 0.02 } } } });
  });
  assert.equal(response.status, 200);
  assert.equal(received.state.captainBrief, 'Assemble a royal delegation and a ghost crew.');
  assert.equal(received.questions.pirate_1.criteria.royal, 'Royal delegation: Crowns or formal officer attire.');
});

test('rejects duplicate or reserved pile identifiers before spending a model request', async () => {
  const response = await decide(new Request('https://example.test', { method: 'POST', body: JSON.stringify({records:[{tokenId:1,traits:{}}], bins:[{id:'review',description:'A'},{id:'review',description:'B'}]}) }), 'test-key', async () => { throw new Error('must not call Venice'); });
  assert.equal(response.status, 400);
});

test('rejects unknown choices and duplicate pirate IDs', async () => {
 const invalid = await decide(request(), 'test-key', async () => Response.json({answers:{pirate_1:{choice:'invented',confidence:.99}}}));
 assert.equal(invalid.status,502);
 const body=await request().json();body.records.push(body.records[0]);
 const duplicate=await decide(new Request('https://example.test',{method:'POST',body:JSON.stringify(body)}),'test-key',async()=>{throw Error('must not call');});
 assert.equal(duplicate.status,400);
});
