# Jev's Pirate Sorting Dock

An interactive demo of Jev's typed decisions using Pirate Nation Founder PFP metadata. A central heap of pirate portraits is sorted by animated brass arms into labeled piles. Trait Sort uses official metadata families; Captain's Orders offers thematic bins and sends the bounded choice to Venice when a server-side key is configured.

**Live demo:** https://jev-pirate-sorter.vercel.app

The first run uses a curated 18-pirate visual sample, drawn from the 9,999-pirate archive. It is intentionally small enough to watch while preserving the same typed-decision pattern used for larger batches.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Without `VENICE_API_KEY`, the dock clearly shows Preview mode and uses deterministic local decisions so the experience remains explorable. With a key in a local `.env.local`, each sorting run batches all sample records into one call to `POST /api/v1/decisions` with `model: jev-latest`; the key never reaches the browser.

```bash
cp .env.example .env.local
# Set VENICE_API_KEY in .env.local
```

## Checks

```bash
npm test
npm run typecheck
npm run build
```

Artwork is from the public [Pirate Nation Art archive](https://github.com/proofofplay/piratenation-art), released under CC0. The project is an independent demonstration and does not claim endorsement by Proof of Play, TypeSafe AI, or Venice.

## Testing status

This is an 18-record prototype, not the full 9,999-record installation. Official metadata snapshots are in `data/pirates.json`; unavailable traits route to review. Live runs send a single shared-state batch to Venice, then animate the returned decisions. Failures stop the run rather than substituting simulated answers. Confidence is a model signal, not a measured accuracy rate.

Before a public showcase: expand and diversify the verified collection, finish arms that track each card to its exact pile, add user-authored criteria, and measure throughput and accuracy over larger runs.
