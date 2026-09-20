import type { PirateRecord } from './types';

export const PFP_BASE = "https://media.githubusercontent.com/media/proofofplay/piratenation-art/main/Founder's%20Pirate%20NFT";

import metadata from '../data/pirates.json';

export const pirates: PirateRecord[] = Object.entries(metadata).map(([id, data]) => {
  const tokenId = Number(id);
  const attributes = 'attributes' in data ? data.attributes : [];
  const traits = Object.fromEntries((attributes || []).map((a: { trait_type: string; value: unknown }) => [a.trait_type, String(a.value)]));
  return {
    tokenId, name: `Founder's Pirate #${tokenId}`, characterType: traits['Character Type'], traits,
    images: { illustrated: `${PFP_BASE}/illustrated/${tokenId}.svg`, voxel: `${PFP_BASE}/voxel/${tokenId}.png` },
    source: `https://api.proofofplay.gg/api/metadata/pirate/${tokenId}`,
  };
});
