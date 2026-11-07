import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

API = "https://api.github.com"
RED = 0xE74C3C
USER_AGENT = "dota2pornfx-ci-notifier (+https://github.com/h6rd/Dota2PornFxWeb)"
MAX_FAILED_JOBS = 5


def github_get(path, token):
    req = urllib.request.Request(f"{API}{path}")
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def previous_conclusion(run, repo, token):
    data = github_get(
        f"/repos/{repo}/actions/workflows/{run['workflow_id']}/runs"
        f"?status=completed&event=schedule&per_page=10",
        token,
    )
    older = [r for r in data.get("workflow_runs", []) if r["run_number"] < run["run_number"]]
    older.sort(key=lambda r: r["run_number"], reverse=True)
    return older[0]["conclusion"] if older else None


def failed_jobs(run, repo, token):
    data = github_get(f"/repos/{repo}/actions/runs/{run['id']}/jobs?filter=latest&per_page=100", token)
    result = []
    for job in data.get("jobs", []):
        if job.get("conclusion") not in ("failure", "timed_out"):
            continue
        step = next(
            (s["name"] for s in job.get("steps", []) if s.get("conclusion") in ("failure", "timed_out")),
            None,
        )
        result.append((job["name"], step, job.get("html_url")))
    return result


def clip(text, limit):
    text = str(text or "")
    return text if len(text) <= limit else text[: limit - 1] + "…"


def build_payload(run, jobs):
    commit = run.get("head_commit") or {}
    first_line = (commit.get("message") or "").splitlines()[0] if commit.get("message") else ""
    sha = (run.get("head_sha") or "")[:7]

    lines = []
    for name, step, url in jobs[:MAX_FAILED_JOBS]:
        where = f"**{clip(name, 80)}**" + (f" → {clip(step, 80)}" if step else "")
        lines.append(f"• [{where}]({url})" if url else f"• {where}")
    if len(jobs) > MAX_FAILED_JOBS:
        lines.append(f"…and {len(jobs) - MAX_FAILED_JOBS} more")

    fields = [
        {"name": "Event", "value": clip(run.get("event"), 100) or "?", "inline": True},
        {"name": "Branch", "value": clip(run.get("head_branch"), 100) or "?", "inline": True},
        {"name": "Run", "value": f"#{run.get('run_number')}", "inline": True},
    ]
    if sha:
        fields.append({"name": "Commit", "value": clip(f"`{sha}` {first_line}", 300), "inline": False})
    if lines:
        fields.append({"name": "Failed jobs", "value": clip("\n".join(lines), 1000), "inline": False})

    return {
        "username": "CI",
        "allowed_mentions": {"parse": []},
        "embeds": [
            {
                "title": clip(f"❌ {run.get('name')} failed", 250),
                "url": run.get("html_url"),
                "color": RED,
                "fields": fields,
                "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            }
        ],
    }


def post(url, payload):
    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", USER_AGENT)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.status


def main():
    webhook = os.environ.get("DISCORD_ADMIN_WEBHOOK_URL", "").strip()
    dry_run = os.environ.get("DRY_RUN", "false").strip().lower() == "true"
    if not webhook and not dry_run:
        print("DISCORD_ADMIN_WEBHOOK_URL is not set - nothing to do.")
        return 0

    with open(os.environ["GITHUB_EVENT_PATH"], "r", encoding="utf-8") as f:
        event = json.load(f)
    run = event["workflow_run"]
    repo = os.environ.get("GITHUB_REPOSITORY") or event["repository"]["full_name"]
    token = os.environ.get("GITHUB_TOKEN", "").strip()

    if run.get("event") == "schedule" and token:
        try:
            if previous_conclusion(run, repo, token) in ("failure", "timed_out"):
                print(f"{run['name']}: previous scheduled run also failed, not repeating the alert.")
                return 0
        except Exception as exc:
            print(f"::warning::could not check the previous run: {exc}", file=sys.stderr)

    jobs = []
    if token:
        try:
            jobs = failed_jobs(run, repo, token)
        except Exception as exc:
            print(f"::warning::could not load failed jobs: {exc}", file=sys.stderr)

    payload = build_payload(run, jobs)
    if dry_run:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return 0

    try:
        status = post(webhook, payload)
    except urllib.error.HTTPError as exc:
        print(f"::error::Discord returned HTTP {exc.code}", file=sys.stderr)
        return 1
    print(f"Notification sent (HTTP {status}).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
