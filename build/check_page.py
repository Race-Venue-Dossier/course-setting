"""Smoke test of index.html before it is published: both disciplines, every tab, phone and desktop width.
Fails on any script error, on a tab that draws nothing, or when the page shows a different number of
courses than the data set holds."""
import os, sys, json, glob
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); DATA = os.path.join(ROOT, 'data')
want = {d: len(json.load(open(DATA + '/base/courses_%s.json' % d.lower()))) + len(glob.glob(DATA + '/auto/%s/*.json' % d))
        for d in ('SL', 'GS')}
errors = []; problems = []
with sync_playwright() as p:
    br = p.chromium.launch()
    for vw in (1400, 390):
        pg = br.new_page(viewport={'width': vw, 'height': 900})
        pg.on('pageerror', lambda e: errors.append('%dpx: %s' % (vw, e)))
        pg.on('console', lambda m: m.type == 'error' and errors.append('%dpx console: %s' % (vw, m.text)))
        pg.goto('file://' + os.path.join(ROOT, 'index.html')); pg.wait_for_timeout(600)
        tabs = pg.eval_on_selector_all('.tabs .tab', 'b=>b.map(x=>x.dataset.tab||x.getAttribute("data-t")||x.textContent.trim())')
        n_tabs = pg.eval_on_selector_all('.tabs .tab', 'b=>b.length')
        for d in ('SL', 'GS'):
            pg.evaluate('d=>__KS.setDisc(d)', d); pg.wait_for_timeout(200)
            have = pg.evaluate('()=>__KS.courses.length')
            if have != want[d]: problems.append('%dpx %s: page has %d courses, data %d' % (vw, d, have, want[d]))
            for i in range(n_tabs):
                pg.locator('.tabs .tab').nth(i).click(); pg.wait_for_timeout(250)
                svgs = pg.evaluate('()=>document.querySelectorAll(".page svg").length')
                if svgs < 2: problems.append('%dpx %s tab %d (%s): nothing drawn' % (vw, d, i, tabs[i] if i < len(tabs) else '?'))
        if vw == 390:
            over = pg.evaluate('()=>document.documentElement.scrollWidth-window.innerWidth')
            if over > 2: problems.append('390px: page scrolls sideways by %dpx' % over)
        pg.close()
    br.close()
for e in errors: print('ERROR', e)
for q in problems: print('PROBLEM', q)
print('checked: SL %d, GS %d courses, %d tabs' % (want['SL'], want['GS'], n_tabs))
sys.exit(1 if errors or problems else 0)
