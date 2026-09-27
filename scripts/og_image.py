"""Draw og-image.png: the picture X and other sites show when the link is shared.

Called at the end of update.py, so the image always carries the latest figure.
Uses Pillow and the DejaVu fonts that come with GitHub's Ubuntu runners.
"""
from datetime import date
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
BLUE = (0, 122, 255)
WHITE = (255, 255, 255)
SOFT = (214, 232, 255)
ORANGE = (255, 159, 10)

FONT_DIRS = [
    "/usr/share/fonts/truetype/dejavu",
    "/usr/share/fonts/dejavu",
]


def font(bold, size):
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    for d in FONT_DIRS:
        p = Path(d) / name
        if p.exists():
            return ImageFont.truetype(str(p), size)
    return ImageFont.load_default(size)


def fmt(n):
    return f"{n:,}"


def nice_date(iso):
    d = date.fromisoformat(iso)
    return f"{d.strftime('%a')} {d.day} {d.strftime('%B')}"


def draw(data, out=ROOT / "og-image.png"):
    days = sorted(data.get("days", []), key=lambda d: d["date"])
    if not days:
        return
    last = days[-1]
    year = last["date"][:4]
    week = sum(d["migrants"] for d in days[-7:])
    ytd = None
    base_date = data.get("ytdBaseDate", "")
    if data.get("ytdBase") is not None and base_date[:4] == year:
        ytd = data["ytdBase"] + sum(
            d["migrants"] for d in days if d["date"] > base_date and d["date"][:4] == year
        )

    img = Image.new("RGB", (W, H), BLUE)
    g = ImageDraw.Draw(img)

    # Badge on the left
    badge_path = ROOT / "logo-badge.png"
    if badge_path.exists():
        badge = Image.open(badge_path).convert("RGB").resize((430, 430), Image.LANCZOS)
        mask = Image.new("L", (430, 430), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, 429, 429), fill=255)
        img.paste(badge, (70, 100), mask)

    x = 560
    g.text((x, 118), "LATEST DAY · " + nice_date(last["date"]).upper(), font=font(True, 26), fill=SOFT)
    num = fmt(last["migrants"])
    g.text((x - 6, 150), num, font=font(True, 150), fill=WHITE)
    people = "person" if last["migrants"] == 1 else "people"
    boats = "boat" if last["boats"] == 1 else "boats"
    line = (f"{people} crossed in {fmt(last['boats'])} {boats}"
            if last["migrants"] else "No crossings detected")
    g.text((x, 325), line, font=font(False, 34), fill=WHITE)

    g.line((x, 395, W - 70, 395), fill=SOFT, width=2)
    g.text((x, 420), "LAST 7 DAYS", font=font(True, 22), fill=SOFT)
    g.text((x, 452), fmt(week), font=font(True, 52), fill=WHITE)
    if ytd is not None:
        g.text((x + 300, 420), f"{year} SO FAR", font=font(True, 22), fill=SOFT)
        g.text((x + 300, 452), fmt(ytd), font=font(True, 52), fill=WHITE)

    g.rectangle((0, H - 10, W, H), fill=ORANGE)
    g.text((x, 548), "Provisional Home Office figures · Updated daily", font=font(False, 24), fill=SOFT)
    img.save(out, optimize=True)


if __name__ == "__main__":
    import json

    draw(json.loads((ROOT / "data.json").read_text()))
    print("Saved og-image.png")
