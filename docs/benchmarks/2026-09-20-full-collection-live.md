# Live production showcase validation — September 20, 2026

Tested https://jev-pirate-sorter.vercel.app in the browser with the server's configured Venice key. No key was read or exposed during verification.

## Fresh full-collection run

- **9,999 / 9,999** live Jev decisions completed.
- **24.3 seconds** active browser-observed processing time (UI rounded to one decimal).
- **411 decisions per second** average end-to-end throughput (UI rounded).
- **79 batches / 79 requests / 0 retries**; up to 128 pirates per batch, four concurrent requests.
- **1,165 ms** median and **1,345 ms** p95 server-to-Venice round-trip latency per batch.
- **9,682 placed / 317 review / 0 pending** with the 85% confidence routing threshold.
- **99.2%** raw choice agreement against official known traits (UI rounded, all 9,999 eligible).
- Provider-reported successful-batch usage: **3,974,218 input tokens / 832,255 output tokens**.
- Requested model: **jev-latest**, through Venice's Decisions API.

These figures describe this run, not a guaranteed rate or an independent comparison against other models. Timings include browser/server networking and queue orchestration; they are not pure model inference times. The API's reported tokens are recorded without substituting an estimate. Account billing was not independently measured. Venice's promotional pricing is linked in the demo.

## Recovery and interface checks

A prior run paused at 2,720 completed decisions, drained its active batches, survived a page reload, and resumed from saved results. The initial 32-record batching encountered HTTP 429 after 100 successful requests. Increasing batches to 128 reduced the request count for a fresh full collection to 79. Automatic provider cooldown/retry is covered by a regression test; actual saved-run recovery was exercised in the browser. The mixed-settings recovery run also finished all 9,999 decisions, in 40.5 active seconds, with 99.0% raw agreement.

The full Human pile was inspected with pagination (161 pages at 48 portraits/page). All pile counts are driven by real answers. Arms intentionally visualize selected real decisions, with counts representing all decisions. No fabricated or precomputed model answers were used.

A visitor-authored custom brief and renamed Ghost Crew pile completed a 100-pirate rehearsal in 0.9 seconds (792 ms server-to-Venice round trip, one request). With the unchanged conservative threshold, 23 were placed and 77 routed to review; subjective criteria are not scored as factual accuracy. The mobile page was checked at 390 × 844, with document width equal to viewport width, and the voxel toggle was exercised.
