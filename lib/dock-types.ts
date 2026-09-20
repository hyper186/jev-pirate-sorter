export type Bin = { id: string; label: string; description: string };
export type Answer = { choice: string; confidence: number; probabilities?: Record<string, number> };
export type Batch = { mode: 'live'; model: string; elapsedMs: number; answers: Record<string, Answer>; usage?: { input_tokens?: number; output_tokens?: number } };
export type DockRun = { batch: Batch; bins: Bin[]; brief: string; mode: 'traits' | 'orders'; request: unknown };
export const REVIEW_BIN: Bin = { id: 'review', label: 'Needs review', description: 'Below 85% confidence, missing metadata, or no matching pile.' };
export function destinationFor(answer: Answer, bins: Bin[]) {
  return answer.confidence >= 0.85 && bins.some(bin => bin.id === answer.choice) ? answer.choice : 'review';
}
