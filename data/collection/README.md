# Resumable Pirate Nation metadata collection

This directory stores an offline collection index, separate from the deployed 18-pirate demo. Fetching metadata does not call Jev or Venice. Portrait image files are not downloaded in this pass; the official metadata preserves image references, and the existing app supports the public illustrated/voxel archive.

- `raw/{tokenId}.json`: original successful official metadata response.
- `requests.jsonl`: append-only per-request ledger with token ID, source, UTC time, status, response body bytes, and request duration. Every attempt is recorded.
- `pirates-1-1000.json`: initial benchmark subset.
- `pirates-1-9999.json`: complete metadata collection, keyed by token ID.
- `pirates-1-9999.json.gz`: compressed copy of the complete collection.
- `FULL-COLLECTION-BENCHMARK.md`: complete collection measurements.
- `full-collection-verification.json`: verified counts, byte sizes and SHA-256 checksum.
- `run-*.json`: immutable per-run measurements and exact successful/missing/failed IDs.
- `latest-run.json`: most recent run report.

Resume or extend from the repository root:

```sh
python3 scripts/collect-pirates.py 1 9999
# All 9,999 IDs are already saved; this makes zero new requests.
```

Successful IDs with saved files and confirmed missing IDs are skipped. Transient failures are retried up to three times and remain eligible on the next run. Missing metadata is recorded, never invented. A maximum of four concurrent requests and five request starts per second keeps ingestion bounded. Run one collector at a time.

Byte counts measure downloaded response bodies, excluding HTTP/TLS overhead. Elapsed duration includes throttling, retries, file writes and manifest creation. Model requests, tokens and cost are zero because no model is invoked. Metadata-host billing is not measured; this is a public endpoint with no credentials. One preliminary successful connectivity probe (ID 2, 1,806 bytes, 0.231261 seconds) preceded the measured collection and is excluded from its ledger totals.

These are ingestion measurements, not Jev sorting latency, accuracy, or cost benchmarks. Loading all collected records into the live demo still requires the paginated display and bounded sorting queue described in the main README.
