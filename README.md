# Jev’s Pirate Sorting Dock

[Live demo](https://jev-pirate-sorter.vercel.app) · [Jev on Venice](https://venice.ai/lp/jev)

Sort all **9,999 Pirate Nation PFPs** with actual `jev-latest` decisions through Venice. Official metadata is authoritative on the server. No deterministic sorter or simulated answers replace Jev.

## Showcase flow

1. Leave **All 9,999 pirates** selected and press **Sort 9,999 with Jev**. Rehearsal sizes of 100 and 1,000 are also available.
2. Watch completed decisions, active processing time, measured throughput and recent batch round trips. Each batch contains up to 128 independent questions (32 for long custom criteria); four requests run concurrently.
3. Watch the counters and dock together in the first screen. Every returned decision emits one tile in its actual response burst; the arms follow active tiles. Fixed 320 ms visual travel is labeled separately from measured processing time. Scroll below for decision inspection.
4. Open any pile to browse all its pirates in pages of 48. Inspect any pirate by ID, check its actual choice, confidence and probabilities, or switch illustrated/voxel art.
5. Try Captain’s Orders: write a brief and define 2–6 named destination piles. This demonstrates changing the classification task without changing application code.
6. Export the run JSON for every answer, exact criteria, batch IDs/timings, provider-reported usage and aggregate measurements. A full on-page JSON snapshot is available as a download fallback.

## Reliability and measurements

- Completed batches are checkpointed in **IndexedDB in this browser**, with a versioned collection ID. Pause drains active requests; reopening the page restores the checkpoint and Resume sends only unanswered IDs. Keep the tab open to process; this is not a background cloud worker. Interrupted in-flight requests may be repeated and their unreturned usage is unknown.
- One live run per browser origin via Web Locks where supported. Starting a new run replaces the local checkpoint; export important results first.
- HTTP 429 responses trigger a provider-aware wait (60 seconds when no retry interval is supplied), shown as a countdown. Other transient failures retry with bounded backoff; completed work survives a failed batch.
- Timing is browser-observed active processing, including networking, retries, provider cooldown and orchestration. User-paused time is excluded. Batch latency is server-to-Venice round trip, not pure inference time. Arm animation is separate.
- Token usage is summed only when the provider reports it for every successful batch; missing usage is shown as unknown. A link documents Venice’s promotional pricing; the page does not claim to measure account billing.
- Trait agreement audits raw Jev choices against known metadata. Choices below 85% confidence go to review. Custom crew criteria are subjective and have no automatic ground-truth accuracy claim.
- Only a bounded number of portraits are rendered. The page downloads a compact static metadata manifest, not 9,999 portrait images on load.

## Architecture

`public/collection-v1.json` holds official token IDs and traits. `/api/decisions` accepts IDs and pile criteria, resolves traits server-side and invokes Venice with the server-only key. `lib/run-queue.ts` schedules bounded requests; `lib/run-storage.ts` persists checkpoints. The full original metadata and collection benchmarks remain in [`data/collection`](data/collection/README.md).

Jev evaluates metadata, **not image pixels**. Portraits are the visualization. Public demo access shares the configured Venice account limits; provider availability and promotional pricing can change.

## Run locally

```sh
npm install
cp .env.example .env.local
# Set VENICE_API_KEY privately in .env.local.
npm run dev
npm test
npm run typecheck
npm run build
```

In Vercel, set `VENICE_API_KEY` as a server-only environment variable and redeploy. Never prefix it with `NEXT_PUBLIC` or commit it. Missing model access produces a visible error, never fake results.

Artwork: [Pirate Nation Art archive](https://github.com/proofofplay/piratenation-art), CC0. Independent demonstration; no endorsement by Proof of Play, TypeSafe AI or Venice is claimed.

### Live visual timing
The first viewport contains controls, measured counters, and the sorting dock. Each newly returned answer emits exactly one colored card tile to its actual destination (including review). Tiles follow real batch arrival bursts, with a fixed 320 ms display travel time; this is not inference latency. The two arms track active decisions, while concurrent tiles show the full batch volume. There is no playback-speed control, sampled decision stream, or animation backlog. Saved results restore as settled. Reduced-motion preferences suppress travel while retaining actual counts. Inspection and export are below the dock.
