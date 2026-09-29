"""Extra data for the dashboard, gathered by the daily update.

  gender.json    small boat arrivals by sex and age (Home Office quarterly dataset)
  petitions.json open UK Parliament petitions about small boat crossings

Each part is independent: if one source fails, the others still update and the
page keeps showing the last good file.
"""
import io
import json
import re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parent.parent
H = {"User-Agent": "channel-crossings-tracker (GitHub Action)"}


def save(name, obj):
    (ROOT / name).write_text(json.dumps(obj, indent=1, ensure_ascii=False) + "\n")


def now_iso():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ------------------------------------------------------------ by sex and age

TABLES = "https://www.gov.uk/government/statistical-data-sets/immigration-system-statistics-data-tables"


def update_gender():
    page = requests.get(TABLES, headers=H, timeout=60).text
    links = re.findall(r'https://assets\.publishing\.service\.gov\.uk/[^"\']+\.xlsx', page)
    url = next(l for l in links if re.search(r"(illegal-entry-routes|irregular-migration).*dataset", l, re.I))
    old = json.loads((ROOT / "gender.json").read_text()) if (ROOT / "gender.json").exists() else {}
    if old.get("source") == url:
        print("Sex and age: dataset unchanged")
        return
    import openpyxl
    raw = requests.get(url, headers=H, timeout=180).content
    wb = openpyxl.load_workbook(io.BytesIO(raw), read_only=True, data_only=True)
    ws = next(s for s in wb.worksheets if s.title.lower().startswith("data_") and ("d01" in s.title.lower()))
    rows = ws.iter_rows(values_only=True)
    head = None
    for r in rows:
        cells = [str(c).strip().lower() if c is not None else "" for c in r]
        if "sex" in cells and "quarter" in cells:
            head = cells
            break
    col = {k: head.index(k) for k in ("quarter", "method of entry", "sex", "age group")}
    col["n"] = next(i for i, c in enumerate(head) if "number" in c)

    recs = []
    for r in rows:
        if r is None or len(r) <= col["n"] or r[col["quarter"]] is None:
            continue
        if "small boat" not in str(r[col["method of entry"]]).lower():
            continue
        try:
            n = int(r[col["n"]] or 0)
        except (TypeError, ValueError):
            continue
        recs.append((str(r[col["quarter"]]).strip(), str(r[col["sex"]]).strip(), str(r[col["age group"]]).strip(), n))
    quarters = sorted({q for q, *_ in recs})
    last4 = set(quarters[-4:])

    def tally(keep):
        sex = {"Male": 0, "Female": 0, "Unknown": 0}
        age = {"17 and under": 0, "18 to 24": 0, "25 to 39": 0, "40 and over": 0, "Unknown": 0}
        adult_men = 0
        for q, s, a, n in recs:
            if not keep(q):
                continue
            sex[s if s in ("Male", "Female") else "Unknown"] += n
            age[a if a in age else "Unknown"] += n
            if s == "Male" and a in ("18 to 24", "25 to 39", "40 and over"):
                adult_men += n
        return {"sex": sex, "age": age, "adultMen": adult_men, "total": sum(sex.values())}

    last_q = quarters[-1]                              # e.g. "2026 Q2"
    y, qn = int(last_q[:4]), int(last_q[-1])
    month = {1: "March", 2: "June", 3: "September", 4: "December"}[qn]
    save("gender.json", {
        "source": url,
        "latestQuarter": last_q,
        "period": f"year ending {month} {y}",
        "lastYear": tally(lambda q: q in last4),
        "since2018": tally(lambda q: True),
        "updatedAt": now_iso(),
    })
    print(f"Sex and age: saved, latest quarter {last_q}")


# ------------------------------------------------------------ petitions

PETITION_SEARCHES = ["small boats", "small boat", "channel crossings", "channel migrants", "illegal crossings"]
PETITION_WORDS = re.compile(r"small boat|channel crossing|cross(ing)? the channel|english channel|dinghies|boats? back", re.I)


def update_petitions():
    found = {}
    for q in PETITION_SEARCHES:
        for state in ("open", "closed"):
            r = requests.get("https://petition.parliament.uk/petitions.json", params={"q": q, "state": state},
                             headers=H, timeout=60)
            r.raise_for_status()
            for p in r.json().get("data", []):
                a = p["attributes"]
                text = " ".join(str(a.get(k) or "") for k in ("action", "background"))
                if not PETITION_WORDS.search(text):
                    continue
                if state == "closed" and (a.get("closed_at") or "") < (date.today() - timedelta(days=365)).isoformat():
                    continue          # keep closed petitions from the past year only
                found[p["id"]] = {
                    "id": p["id"],
                    "title": a["action"],
                    "signatures": a.get("signature_count", 0),
                    "state": a.get("state"),
                    "closes": (a.get("closing_date") or a.get("closed_at") or "")[:10],
                    "response": bool(a.get("government_response")),
                    "debated": bool(a.get("debate")),
                    "url": f"https://petition.parliament.uk/petitions/{p['id']}",
                }
    items = sorted(found.values(), key=lambda p: (p["state"] != "open", -p["signatures"]))[:6]                       # the page shows six
    save("petitions.json", {"petitions": items, "updatedAt": now_iso()})
    print(f"Petitions: {len(items)} saved")


def update_all(days=None):
    for name, job in (("sex and age", update_gender), ("petitions", update_petitions)):
        try:
            job()
        except Exception as e:  # noqa: BLE001 - keep the last good file
            print(f"{name} skipped: {e}")
