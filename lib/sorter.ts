export const FALLBACK_CATEGORIES = ['Human', 'Zombie', 'Vampire', 'Rainbow', 'Golden', 'Shark', 'Rare'] as const;

export type Destination = string;

export function normalizeCategory(characterType: string | undefined, fallback = false): string {
  if (!characterType) return fallback ? 'Rare' : 'Review';
  const value = characterType.toLowerCase();
  if (value.includes('rainbow')) return 'Rainbow';
  if (value.includes('zombie')) return 'Zombie';
  if (value.includes('vampire')) return 'Vampire';
  if (value.includes('golden')) return 'Golden';
  if (value.includes('shark')) return 'Shark';
  if (value.includes('human')) return 'Human';
  return 'Special';
}

export function routeDecision(
  answer: { choice: string; confidence: number } | null,
  allowed: string[],
  threshold = 0.85,
): string {
  if (!answer || answer.confidence < threshold || !allowed.includes(answer.choice)) return 'Review';
  return answer.choice;
}
