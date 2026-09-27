"""Fetch the Home Office small boat figures and update data.json.

Runs daily from the GitHub Action in .github/workflows/update.yml.
Two sources, both provisional Home Office data:
  1. The weekly time-series spreadsheet (.ods), daily figures since 2018.
  2. The "last 7 days" page, updated every day.
The 7-day page wins where the two overlap, because it is newer.
"""
import io
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import requests

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data.json"
PUB = "https://www.gov.uk/government/publications/migrants-detected-crossing-the-english-channel-in-small-boats"
LAST7 = PUB + "/migrants-detected-crossing-the-english-channel-in-small-boats-last-7-days"
HEADERS = {"User-Agent": "channel-crossings-tracker (GitHub Action)"}


def load():
    if DATA.exists():
        return json.loads(DATA.read_text())
    return {"days": []}


def to_int(v):
    try:
        if pd.isna(v):
            return 0
    except TypeError:
        pass
    s = re.sub(r"[^\d]", "", str(v))
    return int(s) if s else 0


def fetch_last7():
    html = requests.get(LAST7, headers=HEADERS, timeout=60).text
    tables = pd.read_html(io.StringIO(html))
    out = {}
    for t in tables:
        cols = [str(c).lower() for c in t.columns]
        if not any("migrant" in c for c in cols):
            continue
        dcol = t.columns[0]
        mcol = t.columns[next(i for i, c in enumerate(cols) if "migrant" in c)]
        bcol = next((t.columns[i] for i, c in enumerate(cols) if "boat" in c), None)
        ucol = next((t.columns[i] for i, c in enumerate(cols) if "uncontrolled" in c), None)
        for _, r in t.iterrows():
            d = pd.to_datetime(str(r[dcol]), errors="coerce", dayfirst=True)
            if pd.isna(d):
                continue
            key = d.strftime("%Y-%m-%d")
            out[key] = {
                "date": key,
                "migrants": to_int(r[mcol]),
                "boats": to_int(r[bcol]) if bcol is not None else 0,
                "uncontrolled": to_int(r[ucol]) if ucol is not None else None,
            }
    return out


def fetch_timeseries():
    """Best effort: the spreadsheet's layout can change, so failures are non-fatal."""
    page = requests.get(PUB, headers=HEADERS, timeout=60).text
    m = re.search(r'https://assets\.publishing\.service\.gov\.uk/[^"\']+\.ods', page)
    if not m:
        print("No time-series spreadsheet link found")
        return {}
    raw = requests.get(m.group(0), headers=HEADERS, timeout=120).content
    sheets = pd.read_excel(io.BytesIO(raw), engine="odf", sheet_name=None, header=None)
    out = {}
    for name, df in sheets.items():
        # Find the header row: one that mentions a date and migrants.
        hdr = None
        for i in range(min(len(df), 30)):
            row = [str(x).lower() for x in df.iloc[i].tolist()]
            if any("date" in c for c in row) and any("migrant" in c for c in row):
                hdr = i
                break
        if hdr is None:
            continue
        cols = [str(x).lower() for x in df.iloc[hdr].tolist()]
        body = df.iloc[hdr + 1:]
        di = next(i for i, c in enumerate(cols) if "date" in c)
        mi = next(i for i, c in enumerate(cols) if "migrant" in c)
        bi = next((i for i, c in enumerate(cols) if "boat" in c), None)
        for _, r in body.iterrows():
            d = pd.to_datetime(r.iloc[di], errors="coerce", dayfirst=True)
            if pd.isna(d):
                continue
            key = d.strftime("%Y-%m-%d")
            out[key] = {
                "date": key,
                "migrants": to_int(r.iloc[mi]),
                "boats": to_int(r.iloc[bi]) if bi is not None else 0,
                "uncontrolled": None,
            }
        if out:
            print(f"Time series: {len(out)} days from sheet '{name}'")
            break
    return out


def write_csv(days):
    """data.csv: the full daily history as a spreadsheet-friendly download."""
    lines = ["date,people,boats,uncontrolled_landings"]
    for d in days:
        u = "" if d.get("uncontrolled") is None else str(d["uncontrolled"])
        lines.append(f"{d['date']},{d['migrants']},{d['boats']},{u}")
    (ROOT / "data.csv").write_text("\n".join(lines) + "\n")
    print("Saved data.csv")


def main():
    data = load()
    days = {d["date"]: d for d in data.get("days", [])}

    try:
        ts = fetch_timeseries()
    except Exception as e:  # noqa: BLE001
        print("Time series skipped:", e)
        ts = {}
    for k, v in ts.items():
        prev = days.get(k, {})
        if prev.get("uncontrolled") is not None:
            v["uncontrolled"] = prev["uncontrolled"]
        days[k] = v

    last7 = fetch_last7()
    if not last7:
        print("Could not read the last-7-days table", file=sys.stderr)
        sys.exit(1)
    days.update(last7)

    ordered = sorted(days.values(), key=lambda d: d["date"])
    latest = ordered[-1]["date"]
    year = latest[:4]

    # Year to date: exact if we hold every day of the year, otherwise keep the
    # reported base total and add the days after it.
    have_full_year = any(d["date"] <= f"{year}-01-07" for d in ordered if d["date"].startswith(year))
    if have_full_year:
        data["ytdBase"] = 0
        data["ytdBaseDate"] = f"{year}-01-00"
        prev_year = str(int(year) - 1)
        same_point = prev_year + latest[4:]
        prev_total = sum(d["migrants"] for d in ordered if d["date"].startswith(prev_year) and d["date"] <= same_point)
        if prev_total:
            data["prevYearSamePoint"] = prev_total
    elif data.get("ytdBaseDate", "")[:4] != year:
        data["ytdBase"] = 0
        data["ytdBaseDate"] = f"{year}-01-00"
        data.pop("prevYearSamePoint", None)

    data["days"] = ordered
    data["checkedAt"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    data["source"] = PUB
    DATA.write_text(json.dumps(data, indent=1) + "\n")
    print(f"Saved {len(ordered)} days, latest {latest}")
    write_csv(ordered)

    try:
        from og_image import draw
        draw(data)
        print("Saved og-image.png")
        # Stamp the preview image link with the latest date, so X and other
        # sites fetch the new picture instead of showing a cached old one.
        page = ROOT / "index.html"
        html = page.read_text()
        stamped = re.sub(r"og-image\.png(\?v=[0-9-]*)?", "og-image.png?v=" + latest, html)
        if stamped != html:
            page.write_text(stamped)
    except Exception as e:  # noqa: BLE001 - the preview image is optional
        print("Preview image skipped:", e)


if __name__ == "__main__":
    main()
