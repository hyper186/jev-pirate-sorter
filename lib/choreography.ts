export type Point = { x: number; y: number };
export const CARRY_DURATION = 2300;
export function advanceProgress(progress: number, elapsed: number, speed: number, paused: boolean) {
  return paused ? progress : Math.min(1, progress + Math.min(elapsed, 100) * speed / CARRY_DURATION);
}
export function sourcePosition(index: number): Point {
  return { x: 428 + (index * 53 % 145), y: 265 + (index * 37 % 125) };
}
export function pilePosition(index: number, count: number): Point {
  const rows = Math.ceil(count / 2);
  return { x: index % 2 === 0 ? 112 : 888, y: rows === 1 ? 350 : 148 + Math.floor(index / 2) * (450 / (rows - 1)) };
}
const mix = (a: Point, b: Point, t: number): Point => {
  const v = Math.max(0, Math.min(1, t));
  const eased = v * v * (3 - 2 * v);
  return { x: a.x + (b.x - a.x) * eased, y: a.y + (b.y - a.y) * eased };
};
export function flightPose(source: Point, destination: Point, progress: number) {
  const arm = destination.x < 500 ? 0 : 1;
  const idle = { x: arm === 0 ? 380 : 620, y: 185 };
  let card = source;
  if (progress > 0.22 && progress <= 0.38) card = mix(source, { x: source.x, y: source.y - 65 }, (progress - 0.22) / 0.16);
  else if (progress > 0.38 && progress < 0.84) card = mix({ x: source.x, y: source.y - 65 }, { x: destination.x, y: destination.y - 50 }, (progress - 0.38) / 0.46);
  else if (progress >= 0.84) card = mix({ x: destination.x, y: destination.y - 50 }, destination, (progress - 0.84) / 0.16);
  const wrist = progress < 0.22 ? mix(idle, { x: source.x, y: source.y - 34 }, progress / 0.22) : { x: card.x, y: card.y - 34 };
  return { card, wrist, arm, held: progress >= 0.22, phase: progress < 0.22 ? 'Reaching' : progress < 0.38 ? 'Picking up' : progress < 0.84 ? 'Carrying' : 'Placing' };
}
