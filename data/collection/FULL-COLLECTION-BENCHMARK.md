# Complete Pirate Nation metadata collection

Completed September 20, 2026. Official metadata is saved for **all 9,999 pirate IDs**, from 1 through 9,999 inclusive.

| Measurement | Result |
| --- | --- |
| Valid records | 9,999 |
| Missing / failed records | 0 / 0 |
| Previously saved records reused | 1,000 |
| New records fetched in completion run | 8,999 |
| Completion run elapsed time | 1,801.574 seconds (30 minutes 2 seconds) |
| Completion run response bodies | 16,661,741 bytes (16.66 MB) |
| Total collection elapsed time, both download runs | 2,001.773 seconds (33 minutes 22 seconds) |
| Total measured HTTP requests, both runs | 9,999 |
| Total response bodies, both runs | 18,511,327 bytes (18.51 MB) |
| Complete compact JSON manifest | 13,636,499 bytes (13.64 MB) |
| Saved gzip manifest | 653,989 bytes (0.65 MB) |
| Venice / Jev calls | 0 |
| Model tokens / model cost | 0 / $0 |

The collector was limited to five request starts per second and four concurrent requests. Download totals exclude HTTP/TLS overhead and the one preliminary connectivity probe documented in README.md. Elapsed totals add the two active download runs; they exclude the time between runs and final verification/publishing.

## Verification

- Confirmed exactly IDs 1–9,999, with no gaps or duplicates.
- Validated each response's metadata structure and matched every raw file against the combined manifest.
- Confirmed all 9,999 request ledger entries succeeded; no retries were necessary.
- Verified the gzip file decompresses to the exact combined JSON.
- Reran the full collector: all 9,999 IDs skipped, **zero requests**, 0.499 seconds.
- Recorded the manifest SHA-256 and measurements in `full-collection-verification.json`.

Download run: `run-20260920T221752Z.json`. Resume check: `run-20260920T224822Z.json`. The initial 1,000-record benchmark remains in `BENCHMARK.md`.

## Scope

The collection contains official metadata and image references. Portrait image files were not downloaded. Jev classification was not run; these measurements are not a model-performance benchmark. The live demo still uses its 18-pirate sample pending collection integration and queued sorting.

Every ID in the known 9,999-PFP collection is now accounted for. Keep the saved raw files and request ledger for reuse; no additional contiguous collection range remains.
