import type { PirateRecord } from './types';

export const PFP_BASE = "https://media.githubusercontent.com/media/proofofplay/piratenation-art/main/Founder's%20Pirate%20NFT";

const raw = [
  [1, 'Zombie Male', 'Zombie Green', 'Admiral Adornments', 'Sea View'],
  [42, 'Human Female', 'Light Brown', 'Bravado Jacket', 'Open Sea'],
  [100, 'Rainbow Yawn Male', 'Medium White', 'Admiral Adornments', 'Disco'],
  [2750, 'Human Male', 'Pale White', 'Privateer Plumage', 'Sea View'],
  [9999, undefined, undefined, undefined, undefined],
  [7, 'Vampire Female', 'Pale White', 'Midnight Regalia', 'Moonlit Cove'],
  [18, 'Golden Male', 'Gold', 'Crowncoat', 'Golden Hour'],
  [31, 'Right Shark', 'Extra Dark Blue', 'Deckhand Duds', 'Open Sea'],
  [58, 'Zombie Female', 'Zombie Green', 'Harbor Mantle', 'Fog Bank'],
  [88, 'Human Male', 'Medium Brown', 'Privateer Plumage', 'Sunset Sea'],
  [119, 'Rainbow Yawn Female', 'Pale Pink', 'Festival Finery', 'Disco'],
  [203, 'Vampire Male', 'Frozen', 'Night Watch Coat', 'Moonlit Cove'],
  [412, 'Human Female', 'Superwhite', 'Sailmaker Smock', 'Open Sea'],
  [711, 'Golden Female', 'Gold', 'Admiral Adornments', 'Golden Hour'],
  [1337, 'Left Shark', 'Pale Blue', 'Deckhand Duds', 'Open Sea'],
  [2048, 'Piratetron', 'Silver', 'Clockwork Coat', 'Machine Bay'],
  [4096, 'Mage Female', 'Pale Green', 'Arcane Attire', 'Storm Front'],
  [8192, 'Ghost Male', 'Albino', 'Spectral Sails', 'Haunted Sea'],
] as const;

export const pirates: PirateRecord[] = raw.map(([tokenId, characterType, skin, outfit, background]) => ({
  tokenId,
  name: `Founder's Pirate #${tokenId}`,
  characterType,
  traits: Object.fromEntries([
    characterType && ['Character Type', characterType],
    skin && ['Skin', skin],
    outfit && ['Outfit', outfit],
    background && ['Background', background],
  ].filter(Boolean) as [string, string][]),
  images: {
    illustrated: `${PFP_BASE}/illustrated/${tokenId}.svg`,
    voxel: `${PFP_BASE}/voxel/${tokenId}.png`,
  },
  source: `https://api.proofofplay.gg/api/metadata/pirate/${tokenId}`,
}));
