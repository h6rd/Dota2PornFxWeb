import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

API = "https://api.github.com"
TIME_FORMAT = "%Y-%m-%dT%H:%M:%SZ"
MAX_PAGES = 10


def env_int(name, default):
    raw = (os.environ.get(name) or "").strip()
    return int(raw) if raw else default


def parse_time(value):
    return datetime.strptime(value, TIME_FORMAT).replace(tzinfo=timezone.utc)


def select_old_runs(runs, cutoff, keep_latest, skip_ids=()):
    ordered = sorted(runs, key=lambda r: r["created_at"], reverse=True)
    candidates = ordered[keep_latest:]
    return [
        r
        for r in candidates
        if parse_time(r["created_at"]) < cutoff and r["id"] not in skip_ids
    ]


def api(method, path, token):
    req = urllib.request.Request(f"{API}{path}", method=method)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        body = resp.read()
        return json.loads(body) if body else None


def list_workflows(repo, token):
    workflows, page = [], 1
    while True:
        data = api("GET", f"/repos/{repo}/actions/workflows?per_page=100&page={page}", token)
        batch = data.get("workflows", [])
        workflows += batch
        if len(batch) < 100:
            return workflows
        page += 1


def list_completed_runs(repo, workflow_id, token):
    runs = []
    for page in range(1, MAX_PAGES + 1):
        data = api(
            "GET",
            f"/repos/{repo}/actions/workflows/{workflow_id}/runs?status=completed&per_page=100&page={page}",
            token,
        )
        batch = data.get("workflow_runs", [])
        runs += batch
        if len(batch) < 100:
            break
    return runs


def write_summary(lines):
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if path:
        with open(path, "a", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")


def main():
    token = os.environ.get("GITHUB_TOKEN", "").strip()
    repo = os.environ.get("GITHUB_REPOSITORY", "").strip()
    if not token or not repo:
        print("::error::GITHUB_TOKEN and GITHUB_REPOSITORY must be set", file=sys.stderr)
        return 1

    retention_days = env_int("RETENTION_DAYS", 14)
    keep_latest = env_int("KEEP_LATEST", 5)
    max_delete = env_int("MAX_DELETE", 500)
    dry_run = os.environ.get("DRY_RUN", "false").strip().lower() == "true"
    current_run = env_int("GITHUB_RUN_ID", 0)

    cutoff = datetime.now(timezone.utc) - timedelta(days=retention_days)
    print(
        f"Retention {retention_days} d (before {cutoff.strftime(TIME_FORMAT)}), "
        f"keep latest {keep_latest} per workflow, max {max_delete} deletions, dry_run={dry_run}"
    )

    to_delete = []
    for wf in list_workflows(repo, token):
        runs = list_completed_runs(repo, wf["id"], token)
        old = select_old_runs(runs, cutoff, keep_latest, skip_ids={current_run})
        print(f"- {wf['name']}: {len(runs)} completed run(s), {len(old)} to delete")
        to_delete += [(wf["name"], r) for r in old]

    total_candidates = len(to_delete)
    to_delete = to_delete[:max_delete]

    deleted, failed = 0, 0
    per_workflow = {}
    for name, run in to_delete:
        label = f"{name} #{run.get('run_number', '?')} ({run['id']}, {run['created_at']})"
        if dry_run:
            print(f"[dry-run] would delete {label}")
            deleted += 1
            per_workflow[name] = per_workflow.get(name, 0) + 1
            continue
        try:
            api("DELETE", f"/repos/{repo}/actions/runs/{run['id']}", token)
            deleted += 1
            per_workflow[name] = per_workflow.get(name, 0) + 1
        except urllib.error.HTTPError as e:
            failed += 1
            print(f"::warning::could not delete {label}: HTTP {e.code}", file=sys.stderr)
        time.sleep(0.2)

    verb = "Would delete" if dry_run else "Deleted"
    print(f"\n{verb} {deleted} run(s), {failed} failed, {total_candidates - len(to_delete)} left for the next run")

    summary = ["## Workflow runs cleanup", "", f"{verb} **{deleted}** run(s); {failed} failed.", ""]
    if per_workflow:
        summary += ["| Workflow | Runs |", "|---|---|"]
        summary += [f"| {n} | {c} |" for n, c in sorted(per_workflow.items())]
    write_summary(summary)
    return 0


if __name__ == "__main__":
    sys.exit(main())
