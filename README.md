# Jev’s Pirate Sorting Dock

[Live demo](https://jev-pirate-sorter.vercel.app) · [Jev on Venice](https://venice.ai/lp/jev)

An interactive, independent Jev demonstration with official Pirate Nation metadata and illustrated/voxel portraits. Jev evaluates a batch of choice questions; two articulated sorting arms pick up individual cards and carry them to their returned destinations.

## Try it

- **Trait Sort:** classify by Character Type.
- **Captain’s Orders:** write a brief and define 2–6 named piles with your own criteria, or start with a preset.
- **Start sorting:** requests one batch of actual `jev-latest` answers through Venice. No simulated answers substitute for failures.
- **Pause / Resume:** freezes and resumes the current carried card. Speed changes apply to the current movement. Reset aborts pending requests and invalidates old responses.
- **Inspect:** select any portrait, open a pile to browse all its cards, or follow the current arm. The inspector shows the real choice, confidence, and probability distribution.
- **Inside the decision:** inspect the submitted brief, metadata, criteria, returned batch, and server-measured Venice round-trip time. Animation duration is separate.

The current confidence threshold remains 85%. Review decisions and low-confidence choices are physically delivered to the review pile. This is a conservative routing policy, not an accuracy benchmark. Portraits visualize results; Jev evaluates supplied metadata, not image pixels.

## Run locally

```sh
npm install
cp .env.example .env.local
# Enter VENICE_API_KEY in .env.local; never commit it.
npm run dev
```

Without a server key the interface reports that live Jev is not configured and does not move cards. In Vercel, configure the server-only `VENICE_API_KEY` and redeploy. Never use a NEXT_PUBLIC prefix for this key.

```sh
npm test
npm run typecheck
npm run build
```

## Collection expansion

This release uses 18 records. Metadata snapshots are stored in `data/pirates.json`, fetched from `https://api.proofofplay.gg/api/metadata/pirate/{id}`. Some archive portraits have unavailable metadata; never invent traits for them.

To load all 9,999 portraits:
1. Run a resumable, concurrency-limited ingestion task that enumerates portrait IDs and fetches official metadata, recording missing/error states and source timestamps.
2. Publish a versioned, compressed manifest and pre-sized image thumbnails to CDN storage. Keep full portraits for the inspector and reference both illustrated and voxel variants.
3. Load the manifest in pages and virtualize the central heap and completed pile galleries; do not render 9,999 SVG images or download all full-size files on first load.
4. Send bounded Jev batches from a server-managed run queue, store decisions, and feed a separate animation queue. Persist progress for reconnect/resume. The current endpoint caps a request at 32 records.
5. Reconcile total counts: unsorted + in transit + placed + review must equal the manifest count.

An initial resumable 1,000-ID metadata collection is stored separately in [`data/collection`](data/collection/README.md), with exact IDs, request records and timing measurements. It does not change the live 18-pirate sample. Full-collection UI integration, quality/threshold evaluation, public-load hardening and comparative benchmarks remain separate work.

Artwork is from the public [Pirate Nation Art archive](https://github.com/proofofplay/piratenation-art), released under CC0. This project does not claim endorsement by Proof of Play, TypeSafe AI, or Venice.
