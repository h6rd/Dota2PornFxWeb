import argparse
import random
import subprocess
from datetime import datetime, timedelta, timezone
from html import escape

DAYS = 60
CI_PATTERNS = ("[bot]", "github-actions", "dependabot", "renovate")

TITLE = "Project activity"
SUBTITLE = "Commits per day over the last {days} days, updated {today}"
LEGEND = {"hand": "by hand", "ci": "from CI"}

SHOW = {"total": True, "by_hand": True, "from_ci": True}

COLORS = {
    "bg":      "#141218",
    "stroke":  "#2f2c37",
    "title":   "#f4eefc",
    "muted":   "#a59fb3",
    "faint":   "#746f82",
    "hand":    "#c0ace7",
    "ci":      "#814de8",
}

C = COLORS


def git(*args):
    return subprocess.run(["git", *args], check=True, capture_output=True,
                          text=True, encoding="utf-8").stdout


def utc_date(ts):
    return datetime.fromtimestamp(int(ts), tz=timezone.utc).date()


def real_data():
    commits = []
    for line in git("log", "--format=%at\x1f%an\x1f%ae").splitlines():
        ts, name, email = line.split("\x1f", 2)
        who = f"{name} {email}".lower()
        commits.append((utc_date(ts), any(p in who for p in CI_PATTERNS)))
    return commits


def demo_data():
    rnd = random.Random(7)
    today = datetime.now(timezone.utc).date()
    commits = []
    for back in range(100, -1, -1):
        d = today - timedelta(days=back)
        for _ in range(rnd.choice([0, 1, 1, 2, 3, 4, 6, 9, 14])):
            commits.append((d, rnd.random() < 0.35))
    return commits


def render(commits):
    today = datetime.now(timezone.utc).date()
    days = [today - timedelta(days=DAYS - 1 - i) for i in range(DAYS)]
    hand = {d: 0 for d in days}
    ci = {d: 0 for d in days}
    for d, bot in commits:
        if d in hand:
            (ci if bot else hand)[d] += 1
    total = len(commits)
    total_ci = sum(1 for _, b in commits if b)
    first = min((d for d, _ in commits), default=today)

    W, H = 900, 232
    X0, X1, BASE, CHART_H = 28, 872, 160, 100
    slot = (X1 - X0) / DAYS
    bar_w = slot * 0.72
    peak = max((hand[d] + ci[d] for d in days), default=1) or 1

    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" '
         f'role="img" aria-label="{escape(TITLE)}: commits per day over the last {DAYS} days">',
         '<style>text{font-family:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif}</style>',
         f'<rect x="0.5" y="0.5" width="{W-1}" height="{H-1}" rx="14" fill="{C["bg"]}" stroke="{C["stroke"]}"/>',
         f'<text x="28" y="34" font-size="18" font-weight="700" fill="{C["title"]}">{escape(TITLE)}</text>',
         f'<text x="28" y="54" font-size="12" fill="{C["muted"]}">'
         f'{escape(SUBTITLE.format(days=DAYS, today=today.isoformat()))}</text>']

    lx = 720
    for key in ("hand", "ci"):
        o.append(f'<rect x="{lx}" y="25" width="10" height="10" rx="3" fill="{C[key]}"/>')
        o.append(f'<text x="{lx+16}" y="34" font-size="12" fill="{C["muted"]}">{escape(LEGEND[key])}</text>')
        lx += 80

    for i, d in enumerate(days):
        x = X0 + i * slot + (slot - bar_w) / 2
        y = BASE
        for series, color in ((ci, C["ci"]), (hand, C["hand"])):
            if series[d]:
                h = max(2, series[d] / peak * CHART_H)
                y -= h
                o.append(f'<rect x="{x:.1f}" y="{y:.1f}" width="{bar_w:.1f}" height="{h:.1f}" rx="2" fill="{color}"/>')

    o.append(f'<line x1="{X0}" y1="{BASE+0.5}" x2="{X1}" y2="{BASE+0.5}" stroke="{C["stroke"]}" stroke-width="1.5"/>')
    o.append(f'<text x="{X0}" y="186" font-size="11" fill="{C["faint"]}">{days[0].isoformat()}</text>')
    o.append(f'<text x="{X1}" y="186" font-size="11" fill="{C["faint"]}" text-anchor="end">{days[-1].isoformat()}</text>')

    parts = []
    if SHOW["total"]:
        parts.append(f"{total} commits since {first.isoformat()}")
    if SHOW["by_hand"]:
        parts.append(f"{total - total_ci} by hand")
    if SHOW["from_ci"]:
        parts.append(f"{total_ci} from CI")
    sep = f'<tspan fill="{C["faint"]}" xml:space="preserve">  /  </tspan>'
    o.append(f'<line x1="{X0}" y1="200" x2="{X1}" y2="200" stroke="{C["stroke"]}"/>')
    o.append(f'<text x="{X0}" y="220" font-size="12" fill="{C["muted"]}">{sep.join(parts)}</text>')
    o.append("</svg>")
    return "\n".join(o), total


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="activity.svg")
    ap.add_argument("--demo", action="store_true", help="use fake data (no git needed)")
    a = ap.parse_args()
    svg, n = render(demo_data() if a.demo else real_data())
    import os
    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(svg)
    print(f"wrote {a.out}: {n} commits")