# Full collection visual verification

Production browser run on 2026-09-20, with all 9,999 official metadata records and live jev-latest through Venice.

- All 9,999 decisions returned in 23.8 seconds (rounded UI measurement).
- 421 decisions/second; median server-to-Venice round trip 1,107 ms per batch.
- 79 completed batches, 79 requests, zero retries.
- 9,684 placed; 315 sent to review.
- Visual accounting: 9,999 received, 9,999 settled, zero moving after completion.
- 99.3% raw choice agreement with official character families.
- Reported usage: 3,974,218 input tokens; 832,254 output tokens. Not a billing receipt.

Verified desktop 1280×720: dock bottom at 708px, inspector below viewport. Mobile 390×844: dock bottom at 836px, no horizontal overflow. Human pile browser opened with 7,719 pirates across 161 pages.

Every answer creates one tile, with actual batch arrival timing and fixed 320ms visual transit. Two arms follow concurrent active decisions; arm gestures are not individual inference timers. Restored answers seed as settled. Tests cover all 9,999 unique visual events, duplicate prevention, no invented idle activity, restoration, and low-confidence routing.
