#!/usr/bin/env python3
"""Generate RatingSEO award PDFs + registry.json from site/data.js"""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1] / "site"
AWARDS = ROOT / "awards"
FILES = AWARDS / "files"
FILES.mkdir(parents=True, exist_ok=True)

FONT_DISP = Path.home() / "Library/Fonts/Unbounded-VariableFont_wght.ttf"
FONT_BODY = Path("/System/Library/Fonts/Supplemental/Arial Unicode.ttf")
FONT_MONO = FONT_BODY

PAPER = (247, 248, 250)
INK = (16, 20, 28)
MUTED = (107, 115, 133)
SIGNAL = (226, 59, 18)
TEAL = (13, 110, 104)
LINE = (200, 206, 216)
SOFT = (60, 66, 78)
W, H = 1683, 1191


def load_agencies():
    src = (ROOT / "data.js").read_text(encoding="utf-8")
    src = src.replace("window.RATING_DATA", "RATING_DATA", 1)
    ns = {}
    exec(src, ns)
    return sorted(ns["RATING_DATA"]["agencies"], key=lambda a: a["rank"])


def font(path, size):
    try:
        return ImageFont.truetype(str(path), size)
    except Exception:
        return ImageFont.truetype(str(FONT_BODY), size)


def wrap(draw, text, fnt, max_w):
    words = text.split()
    lines, cur = [], ""
    for w in words:
        test = (cur + " " + w).strip()
        if draw.textlength(test, font=fnt) <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def draw_certificate(out_path, *, number, agency_name, kicker, place, label, score, accent):
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    d.rectangle([28, 28, W - 28, H - 28], outline=LINE, width=2)
    d.rectangle([44, 44, W - 44, H - 44], outline=SIGNAL, width=2)

    f_brand = font(FONT_DISP, 36)
    f_meta = font(FONT_MONO, 18)
    f_kicker = font(FONT_MONO, 18)
    f_title = font(FONT_DISP, 92)
    f_agency = font(FONT_DISP, 44)
    f_place = font(FONT_MONO, 88)
    f_label = font(FONT_BODY, 28)
    f_score = font(FONT_MONO, 24)
    f_note = font(FONT_BODY, 20)
    f_foot = font(FONT_MONO, 16)
    f_seal = font(FONT_DISP, 18)
    f_num = font(FONT_MONO, 20)

    d.text((80, 78), "Rating", font=f_brand, fill=INK)
    tw = d.textlength("Rating", font=f_brand)
    d.text((80 + tw, 78), "SEO", font=f_brand, fill=SIGNAL)
    d.text((W - 80, 88), "league / 2026", font=f_meta, fill=MUTED, anchor="rt")
    d.text((W / 2, 120), number, font=f_num, fill=SIGNAL, anchor="mt")
    d.text((W / 2, 200), kicker.upper(), font=f_kicker, fill=MUTED, anchor="mt")

    title_w = d.textlength("Award", font=f_title)
    x0 = (W - title_w) / 2
    d.text((x0, 230), "A", font=f_title, fill=SIGNAL)
    aw = d.textlength("A", font=f_title)
    d.text((x0 + aw, 230), "ward", font=f_title, fill=INK)

    y = 360
    for line in wrap(d, agency_name, f_agency, W - 220)[:2]:
        d.text((W / 2, y), line, font=f_agency, fill=INK, anchor="mt")
        y += 54

    d.text((W / 2, 500), place, font=f_place, fill=accent, anchor="mt")
    y = 580
    for line in wrap(d, label, f_label, W - 280)[:3]:
        d.text((W / 2, y), line, font=f_label, fill=SOFT, anchor="mt")
        y += 34

    d.text((W / 2, 700), score, font=f_score, fill=MUTED, anchor="mt")
    note = (
        "Документ подтверждает позицию агентства в открытой таблице RatingSEO на дату цикла. "
        "Место в рейтинге не продаётся. Актуальные данные: ratingseo.ru"
    )
    y = 780
    for line in wrap(d, note, f_note, W - 300)[:3]:
        d.text((W / 2, y), line, font=f_note, fill=MUTED, anchor="mt")
        y += 28

    d.text((80, H - 110), "ratingseo.ru", font=f_foot, fill=MUTED)
    d.text((80, H - 86), "опубликовано 7 авг 2026", font=f_foot, fill=MUTED)
    d.text((W - 80, H - 110), "редакция", font=f_foot, fill=MUTED, anchor="rt")
    d.text((W - 80, H - 86), "RatingSEO", font=f_foot, fill=MUTED, anchor="rt")

    cx, cy, r = W // 2, H - 95, 42
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=SIGNAL, width=3)
    d.text((cx, cy - 8), "RS", font=f_seal, fill=SIGNAL, anchor="mm")
    d.text((cx, cy + 14), "Q3", font=f_foot, fill=SIGNAL, anchor="mm")
    img.save(out_path, "PDF", resolution=150.0)


def main():
    agencies = load_agencies()
    registry = {
        "cycle": "Q3 2026",
        "indexVersion": "v1.2",
        "published": "2026-08-07",
        "verifyUrl": "https://ratingseo.ru/certificates/#verify",
        "awards": [],
    }

    for a in agencies:
        if a["rank"] > 10:
            break
        num = f"RS-26Q3-T-{a['rank']:04d}"
        fname = f"{num}.pdf"
        draw_certificate(
            FILES / fname,
            number=num,
            agency_name=a["name"],
            kicker="Official league award",
            place=f"#{a['rank']:02d}",
            label=f"{a['rank']}-е место в ТОП-10 рейтинга SEO-агентств России",
            score=f"Score {a['score']} · цикл Q3 2026 · Index v1.2",
            accent=SIGNAL,
        )
        registry["awards"].append(
            {
                "number": num,
                "type": "top10",
                "agencyId": a["id"],
                "agencyName": a["name"],
                "rank": a["rank"],
                "score": a["score"],
                "file": f"/awards/files/{fname}",
                "page": f"/certificate/{a['id']}/",
                "issued": "2026-08-07",
                "cycle": "Q3 2026",
                "indexVersion": "v1.2",
                "status": "valid",
            }
        )

    for a in agencies:
        num = f"RS-26Q3-P-{a['rank']:04d}"
        fname = f"{num}.pdf"
        draw_certificate(
            FILES / fname,
            number=num,
            agency_name=a["name"],
            kicker="Participant Award",
            place="IN",
            label="агентство включено в открытую таблицу рейтинга SEO-агентств России",
            score=f"Score {a['score']} · цикл Q3 2026 · Index v1.2",
            accent=TEAL,
        )
        registry["awards"].append(
            {
                "number": num,
                "type": "participant",
                "agencyId": a["id"],
                "agencyName": a["name"],
                "rank": a["rank"],
                "score": a["score"],
                "file": f"/awards/files/{fname}",
                "page": f"/certificate/{a['id']}-participant/",
                "issued": "2026-08-07",
                "cycle": "Q3 2026",
                "indexVersion": "v1.2",
                "status": "valid",
            }
        )

    (AWARDS / "registry.json").write_text(
        json.dumps(registry, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"Wrote {len(registry['awards'])} awards → {AWARDS}")


if __name__ == "__main__":
    main()
