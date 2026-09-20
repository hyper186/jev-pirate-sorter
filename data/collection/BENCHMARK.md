# Initial 1,000-pirate metadata collection

Collected September 20, 2026, using the official Proof of Play metadata endpoint.

| Measurement | Result |
| --- | --- |
| Pirate IDs | 1–1,000 inclusive |
| Valid records saved | 1,000 |
| Missing / failed IDs | 0 / 0 |
| Wall-clock collection time | 200.199 seconds (3 minutes 20 seconds) |
| HTTP requests in measured run | 1,000 |
| Response bodies downloaded | 1,849,586 bytes (1.85 MB) |
| Combined compact manifest | 1,359,803 bytes (1.36 MB) |
| Manifest compressed with gzip (measured in memory) | 66,992 bytes |
| Median individual request time | 0.136623 seconds |
| Rate limit configured | 5 request starts/second; 4 concurrent maximum |
| Venice / Jev calls | 0 |
| Model tokens / model cost | 0 / $0 |

Original run: `run-20260920T221212Z.json`. A second run verified resume behavior: all 1,000 IDs skipped, zero HTTP requests, 0.047 seconds. See `run-20260920T221557Z.json`.

Validation checked the exact ID set, metadata schema, all successful ledger entries, and equality between each saved raw response and its manifest record. A separate preliminary connectivity probe is disclosed in README.md and excluded from measured totals.

This measures metadata ingestion only. It does not measure portrait downloads, Jev classification latency/tokens, or full-collection browser performance. The live demo remains on its existing 18-pirate sample.

Next uncollected contiguous range starts at **1,001**. Extend the collector's end ID to reuse all completed records.
