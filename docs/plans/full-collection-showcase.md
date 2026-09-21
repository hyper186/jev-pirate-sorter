# Full collection Jev showcase

User approved connecting the entire collection, queued live sorting, measured speed and a deployed showcase.

- Serve a compact, versioned metadata manifest for 9,999 pirates. Keep official traits authoritative on the server; browser requests send only token IDs and the selected criteria.
- Run 128 decisions per Venice request, four bounded concurrent requests. Retry transient failures with backoff and a shared cooldown for HTTP 429. Validate every answer and never replace live decisions with deterministic sorting.
- Persist a versioned run in IndexedDB after successful batches. Resume only unanswered IDs in this browser. Pausing drains active requests and excludes paused time; closing the page requires reopening and pressing Resume.
- Separate model processing from animation: counters and all pile contents reflect every actual answer immediately; arms display representative real decisions. Limit visible central cards and paginate pile galleries.
- Default to all 9,999; offer 100 and 1,000 for rehearsals. Add live elapsed time, throughput, completed/total batches, latency chart, provider-reported usage (unknown when absent), review rate, trait agreement and downloadable evidence.
- Keep custom orders and illustrated/voxel portraits. Show provider/model attribution, metadata-versus-image distinction, current promotional pricing as a linked claim rather than measured billing.
- Tests: bounded concurrency, resume skipping completed IDs, invalid/failed batch handling, cancellation, retries, exact completeness, unknown usage, allowed choices and duplicate IDs.
- Verify local build and browser flows, deploy, run real full collection via production, save benchmark evidence, verify reload/resume and custom orders. No fabricated speed or accuracy comparisons.
