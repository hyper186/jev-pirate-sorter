# Jev's Pirate Sorting Dock

An interactive demo of Jev's typed decisions using Pirate Nation Founder PFP metadata. A central heap of pirate portraits is sorted by animated brass arms into labeled piles. Trait Sort uses official metadata families; Captain's Orders lets visitors define thematic bins and sends the bounded choice to Venice when a server-side key is configured.

The first run uses a curated 18-pirate visual sample, drawn from the 9,999-pirate archive. The product specification and research evidence are maintained alongside this project in the workspace until the remote repository is created.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. Without `VENICE_API_KEY`, the dock clearly shows Preview mode and uses deterministic local decisions so the experience remains explorable. With a key in a local `.env.local`, each placement calls `POST /api/v1/decisions` with `model: jev-latest`; the key never reaches the browser.

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
