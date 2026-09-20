"""Resumable public metadata collection; no Venice credentials or model calls.
Usage: python3 scripts/collect-pirates.py [start_id] [end_id]
Successful and confirmed-missing IDs are skipped on subsequent runs.
"""
import concurrent.futures, datetime, json, pathlib, subprocess, sys, threading, time
ROOT = pathlib.Path(__file__).resolve().parents[1] / 'data' / 'collection'
RAW = ROOT / 'raw'
RAW.mkdir(parents=True, exist_ok=True)
JOURNAL = ROOT / 'requests.jsonl'
START, END = (int(sys.argv[1]), int(sys.argv[2])) if len(sys.argv) == 3 else (1, 1000)
assert 1 <= START <= END <= 9999
prior = {}
if JOURNAL.exists():
    for line in JOURNAL.read_text().splitlines():
        entry = json.loads(line)
        prior[entry['tokenId']] = entry
pending = [i for i in range(START, END + 1) if not (prior.get(i, {}).get('status') == 'missing' or (prior.get(i, {}).get('status') == 'ok' and (RAW / f'{i}.json').exists()))]
lock = threading.Lock()
next_request = 0.0
run_id = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ')
begin = time.monotonic()
entries = []
def collect(token_id):
    global next_request
    url = f'https://api.proofofplay.gg/api/metadata/pirate/{token_id}'
    for attempt in range(1, 4):
        with lock:
            delay = max(0, next_request - time.monotonic())
            next_request = max(time.monotonic(), next_request) + .2
        time.sleep(delay)
        temp = RAW / f'{token_id}.tmp'
        result = subprocess.run(['curl', '--silent', '--show-error', '--max-time', '25', '--output', str(temp), '--write-out', '%{http_code} %{size_download} %{time_total}', url], capture_output=True, text=True)
        parts = result.stdout.split()
        code, size, elapsed = (int(parts[0]), int(parts[1]), float(parts[2])) if len(parts) == 3 else (0, 0, 0)
        status = 'error'
        if result.returncode == 0 and code == 200:
            try:
                data = json.loads(temp.read_text())
                if not isinstance(data, dict) or not isinstance(data.get('attributes'), list) or not data.get('name'):
                    raise ValueError('Unexpected metadata schema')
                temp.replace(RAW / f'{token_id}.json')
                status = 'ok'
            except (ValueError, OSError):
                status = 'invalid_metadata'
        elif code in (404, 410):
            status = 'missing'
        record = dict(runId=run_id, tokenId=token_id, source=url, fetchedAt=datetime.datetime.now(datetime.timezone.utc).isoformat(), attempt=attempt, httpStatus=code, status=status, responseBytes=size, requestSeconds=elapsed)
        with lock:
            with JOURNAL.open('a') as out:
                out.write(json.dumps(record) + '\n')
                out.flush()
            entries.append(record)
            prior[token_id] = record
            if len(entries) % 100 == 0:
                print(json.dumps({'requests':len(entries), 'lastId':token_id, 'elapsedSeconds':round(time.monotonic()-begin, 2)}), flush=True)
        temp.unlink(missing_ok=True)
        if status in ('ok', 'missing'):
            return
        time.sleep(attempt * 2)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
    list(pool.map(collect, pending))
ids = list(range(START, END + 1))
manifest = {str(i): json.loads((RAW / f'{i}.json').read_text()) for i in ids if prior.get(i, {}).get('status') == 'ok' and (RAW / f'{i}.json').exists()}
manifest_path = ROOT / f'pirates-{START}-{END}.json'
manifest_path.write_text(json.dumps(manifest, separators=(',', ':')) + '\n')
report = dict(runId=run_id, startId=START, endId=END, requestedIds=len(ids), skippedPreviouslyCompleted=len(ids)-len(pending), successfulIds=[i for i in ids if str(i) in manifest], missingIds=[i for i in ids if prior.get(i, {}).get('status') == 'missing'], failedIds=[i for i in ids if str(i) not in manifest and prior.get(i, {}).get('status') != 'missing'], elapsedSeconds=round(time.monotonic()-begin,3), httpRequests=len(entries), responseBytes=sum(e['responseBytes'] for e in entries), summedRequestSeconds=round(sum(e['requestSeconds'] for e in entries),3), manifestBytes=manifest_path.stat().st_size, concurrency=4, maxRequestsPerSecond=5, veniceRequests=0, modelTokens=0, modelCostUsd=0)
(ROOT / f'run-{run_id}.json').write_text(json.dumps(report, indent=2)+'\n')
(ROOT / 'latest-run.json').write_text(json.dumps(report, indent=2)+'\n')
print(json.dumps({**report, 'successfulIds':len(report['successfulIds'])}, indent=2), flush=True)
