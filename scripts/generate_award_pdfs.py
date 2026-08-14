#!/usr/bin/env python3
"""Generate all RatingSEO award PDFs from the vector HTML template via Chrome."""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "site"
REGISTRY = SITE / "awards" / "registry.json"
OUT_DIR = SITE / "awards" / "files"
PORT = 8791
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"


def main() -> int:
    awards = json.loads(REGISTRY.read_text(encoding="utf-8"))["awards"]
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Ensure local server is up (reuse if already running)
    server = None
    try:
        import urllib.request

        urllib.request.urlopen(f"http://127.0.0.1:{PORT}/awards/registry.json", timeout=1)
    except Exception:
        server = subprocess.Popen(
            [sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
            cwd=str(SITE),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        time.sleep(0.6)

    ok = 0
    failed = []
    try:
        for i, a in enumerate(awards, 1):
            number = a["number"]
            out = OUT_DIR / f"{number}.pdf"
            url = f"http://127.0.0.1:{PORT}/awards/template/render.html?n={number}"
            cmd = [
                CHROME,
                "--headless=new",
                "--disable-gpu",
                "--no-pdf-header-footer",
                "--virtual-time-budget=12000",
                "--run-all-compositor-stages-before-draw",
                f"--print-to-pdf={out}",
                url,
            ]
            print(f"[{i}/{len(awards)}] {number} …", flush=True)
            for attempt in range(1, 4):
                if attempt > 1:
                    time.sleep(0.8)
                    out.unlink(missing_ok=True)
                proc = subprocess.run(cmd, capture_output=True, text=True)
                if out.exists() and out.stat().st_size >= 5000:
                    ok += 1
                    print(f"  ok {out.stat().st_size} bytes" + (f" (retry {attempt})" if attempt > 1 else ""))
                    break
            else:
                failed.append(number)
                print(f"  FAIL {number}", (proc.stderr or "")[-400:])
    finally:
        if server is not None:
            server.terminate()
            server.wait(timeout=5)

    # Keep template sample in sync with SPA top-1
    sample = OUT_DIR / "RS-26Q3-T-0001.pdf"
    template_pdf = SITE / "awards" / "template" / "award-top10.pdf"
    if sample.exists():
        template_pdf.write_bytes(sample.read_bytes())

    print(f"Done: {ok}/{len(awards)} ok, failed={failed}")
    return 0 if not failed else 1


if __name__ == "__main__":
    raise SystemExit(main())
