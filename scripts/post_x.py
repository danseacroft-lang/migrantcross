"""Post the latest figures to X after each daily update.

Does nothing unless all four X keys are stored as GitHub secrets:
  X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET
Posts once per new day of figures, plus a weekly summary when the figures
reach a Sunday. Remembers what it has posted in x_state.json.
"""
import json
import os
import sys
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATE = ROOT / "x_state.json"
SITE = "channelcrossings.world"
KEYS = ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_SECRET"]


def fmt(n):
    return f"{n:,}"


def nice(iso):
    d = date.fromisoformat(iso)
    return f"{d.strftime('%A')} {d.day} {d.strftime('%B')}"


def daily_text(data):
    days = data["days"]
    last = days[-1]
    n, yr = last["migrants"], last["date"][:4]
    lead = (f"{fmt(n)} {'person' if n == 1 else 'people'} crossed the Channel in {fmt(last['boats'])} small "
            f"{'boat' if last['boats'] == 1 else 'boats'} on {nice(last['date'])}."
            if n else f"No small boat crossings of the Channel were detected on {nice(last['date'])}.")
    ytd = data.get("ytdBase", 0) + sum(d["migrants"] for d in days if d["date"] > data.get("ytdBaseDate", "") and d["date"][:4] == yr)
    text = f"{lead}\n\n{yr} so far: {fmt(ytd)}"
    prev = data.get("prevYearSamePoint")
    if prev:
        pct = round((ytd / prev - 1) * 100)
        text += f" ({'↑' if pct > 0 else '↓'}{abs(pct)}% on {int(yr) - 1})"
    return text + f"\n\nSource: Home Office (provisional)\n{SITE}"


def weekly_text(data):
    by = {d["date"]: d for d in data["days"]}
    sunday = date.fromisoformat(data["days"][-1]["date"])
    monday = sunday - timedelta(days=6)
    week = [by.get((monday + timedelta(days=i)).isoformat(), {"migrants": 0, "boats": 0}) for i in range(7)]
    prev = [by.get((monday - timedelta(days=7 - i)).isoformat(), {"migrants": 0}) for i in range(7)]
    total, before = sum(d["migrants"] for d in week), sum(d["migrants"] for d in prev)
    boats = sum(d["boats"] for d in week)
    text = (f"Week in numbers, {monday.day} {monday.strftime('%b')} to {sunday.day} {sunday.strftime('%b')}:\n\n"
            f"{fmt(total)} {'person' if total == 1 else 'people'} crossed the Channel in {fmt(boats)} small {'boat' if boats == 1 else 'boats'}.")
    if before:
        pct = round((total / before - 1) * 100)
        text += f" That's {'up' if pct > 0 else 'down'} {abs(pct)}% on the week before." if pct else " The same as the week before."
    return text + f"\n\nSource: Home Office (provisional)\n{SITE}"


def post(text):
    from requests_oauthlib import OAuth1Session
    session = OAuth1Session(os.environ["X_API_KEY"], os.environ["X_API_SECRET"],
                            os.environ["X_ACCESS_TOKEN"], os.environ["X_ACCESS_SECRET"])
    r = session.post("https://api.x.com/2/tweets", json={"text": text}, timeout=30)
    if r.status_code >= 300:
        raise RuntimeError(f"X said {r.status_code}: {r.text[:300]}")
    print("Posted:", text.splitlines()[0])


def main():
    if not all(os.environ.get(k) for k in KEYS):
        print("X keys not set, skipping auto-post")
        return
    data = json.loads((ROOT / "data.json").read_text())
    latest = data["days"][-1]["date"]
    state = json.loads(STATE.read_text()) if STATE.exists() else {}
    if state.get("lastPosted", "") >= latest:
        print("Already posted", latest)
        return
    try:
        post(daily_text(data))
        if date.fromisoformat(latest).weekday() == 6:   # figures now run to a Sunday
            post(weekly_text(data))
    except Exception as e:  # noqa: BLE001 - never fail the whole update because of X
        print("Auto-post failed:", e, file=sys.stderr)
        return
    STATE.write_text(json.dumps({"lastPosted": latest}) + "\n")


if __name__ == "__main__":
    main()
