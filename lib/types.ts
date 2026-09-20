export type PirateRecord = {
  tokenId: number;
  name: string;
  characterType?: string;
  traits: Record<string, string>;
  images: { illustrated: string; voxel: string };
  source: string;
};
