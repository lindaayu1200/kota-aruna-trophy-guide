#!/usr/bin/env python3
"""Capture the four ARUNA Trophy Ledger views from the real app with Playwright.

The server is the repository's own `node serve.ts`; nothing is fetched from a network
beyond localhost. Each shot is a 1280x800 JPEG under 250 KiB, re-compressed if needed.
"""
import glob
import io
import os
import subprocess
import time
import urllib.request
from pathlib import Path

os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/root/.cache/ms-playwright'
from PIL import Image, ImageStat
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'screenshots'
PORT = 8199
BASE = f'http://127.0.0.1:{PORT}/'
MAX_BYTES = 250 * 1024


def start_server():
    process = subprocess.Popen(
        ['node', 'serve.ts', '--port', str(PORT)], cwd=ROOT,
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
    )
    for _ in range(80):
        try:
            urllib.request.urlopen(BASE, timeout=1).read()
            return process
        except Exception:
            if process.poll() is not None:
                raise RuntimeError('serve.ts exited before becoming ready')
            time.sleep(0.15)
    process.terminate()
    raise RuntimeError('serve.ts did not become ready')


def browser_options():
    """Use a locally installed Chromium when the harness has no headless shell."""
    root = Path(os.environ['PLAYWRIGHT_BROWSERS_PATH'])
    candidates = sorted(glob.glob(str(root / 'chromium-*' / 'chrome-linux64' / 'chrome')))
    candidates += sorted(glob.glob(str(root / 'chromium-*' / 'chrome-linux' / 'chrome')))
    if candidates:
        return dict(executable_path=candidates[-1], args=['--no-sandbox'])
    return dict(args=['--no-sandbox'])


def compress_if_needed(path: Path):
    raw = path.read_bytes()
    if len(raw) <= MAX_BYTES:
        return len(raw)
    image = Image.open(path).convert('RGB')
    for quality in (84, 78, 72, 66, 60, 54, 48):
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG', quality=quality, optimize=True, progressive=True)
        if buffer.tell() <= MAX_BYTES:
            path.write_bytes(buffer.getvalue())
            return buffer.tell()
    raise RuntimeError(f'{path.name} could not be compressed below {MAX_BYTES} bytes')


def visible_count(page, selector: str) -> int:
    """Count elements whose box is actually inside the 1280x800 viewport."""
    return page.evaluate("""(selector) => [...document.querySelectorAll(selector)].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth;
    }).length""", selector)


def capture(page, filename: str):
    target = SHOTS / filename
    page.screenshot(path=str(target), type='jpeg', quality=88)
    size = compress_if_needed(target)
    with Image.open(target) as image:
        assert image.format == 'JPEG'
        assert image.size == (1280, 800), image.size
        spread = ImageStat.Stat(image.convert('L')).stddev[0]
    assert spread > 12, f'{filename} looks blank (stddev {spread:.1f})'
    print(f'{filename:28s} {size / 1024:6.1f} KiB  1280x800  contrast {spread:5.1f}')


def main():
    SHOTS.mkdir(exist_ok=True)
    server = start_server()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(**browser_options())
            context = browser.new_context(viewport={'width': 1280, 'height': 800}, device_scale_factor=1)
            context.add_init_script("""
              localStorage.setItem('aruna-ledger.progress.v1', JSON.stringify([
                'Cunning Stunts', 'The Shootist', 'Top Fun'
              ]));
              localStorage.setItem('aruna-ledger.spoiler.v1', 'off');
            """)
            page = context.new_page()
            errors = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.goto(BASE, wait_until='networkidle')
            page.wait_for_selector('.trophy-row')

            # 1. The cover: checklist on the left, a cited guide open in the centre.
            page.locator('.trophy-row[data-name="Just Like Paradise"] .row-body').click()
            page.wait_for_selector('.steps li')
            assert visible_count(page, '.trophy-row') >= 6
            assert visible_count(page, '.cite') >= 3
            capture(page, '1-checklist-guide.jpg')

            # 2. The full missable-safe route plus its watchlist.
            page.locator('.tab[data-view="roadmap"]').click()
            page.wait_for_selector('.route-row')
            assert page.locator('.route-row').count() == 55
            assert visible_count(page, '#roadmap-watchlist .rail-list li') >= 6
            capture(page, '2-roadmap-missables.jpg')

            # 3. Missable-only filter and spoiler mode masking story names.
            page.locator('.tab[data-view="ledger"]').click()
            page.locator('.chip-btn[data-filter="missable"]').click()
            page.locator('#btn-spoiler').click()
            page.wait_for_function("document.querySelectorAll('.row-name').length > 0 && [...document.querySelectorAll('.row-name')].some(n => n.textContent.startsWith('???'))")
            assert page.locator('.chip-btn.is-active').inner_text() == 'Missable'
            assert visible_count(page, '.row-name') >= 6
            assert page.evaluate("[...document.querySelectorAll('.row-name')].filter(n => n.textContent.startsWith('???')).length") >= 5
            capture(page, '3-filters-spoiler.jpg')

            # 4. Every collectible count table.
            page.locator('.tab[data-view="collectibles"]').click()
            page.wait_for_selector('.table tbody tr')
            assert page.locator('.table tbody tr').count() == 15
            assert visible_count(page, '.table tbody tr') >= 10
            capture(page, '4-collectibles.jpg')

            if errors:
                raise RuntimeError('Browser errors: ' + '; '.join(errors))
            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()


if __name__ == '__main__':
    main()
