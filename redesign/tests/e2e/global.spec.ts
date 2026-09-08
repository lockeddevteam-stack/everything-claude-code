// Global baseline: navigation reach + back for all 18 pages, axe-core (wcag2a/wcag2aa), 44px target scan and a
// WCAG contrast scan of every visible text node, per page. Findings on the current app are expected: scans use
// expect.soft so the run completes and the numbers land in baseline/{axe,targets,contrast,global-summary}.json.
// console/pageerror checks stay hard.
import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { PAGES, boot, tap, navTab, NAV, RESULTS_DIR, TESTS_DIR, enumerateInteractive, splitErrors, writeJson, SCREEN_ERROR, VOICE_BTN } from './helpers';

// one file → one worker, tests run in order; not serial so a soft-failed page does not skip the rest
test.describe.configure({ timeout: 90_000 });

const AXE_PATH = path.join(TESTS_DIR, 'node_modules', 'axe-core', 'axe.min.js');
const SCANS_DIR = path.join(RESULTS_DIR, 'scans');

type AxeResult = { violations: { id: string; impact: string; description: string; help: string; helpUrl: string; nodes: { target: string[]; html: string; failureSummary: string }[] }[]; passes: unknown[]; incomplete: unknown[] };

const axeByPage: Record<string, unknown> = {};
const targetsByPage: Record<string, unknown> = {};
const contrastByPage: Record<string, unknown> = {};
const summary: Record<string, Record<string, unknown>> = {};
const navResults: Record<string, unknown>[] = [];

async function runAxe(page: Page) {
  await page.addScriptTag({ path: AXE_PATH });
  const res = await page.evaluate(async () => {
    // @ts-expect-error axe is injected
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }, resultTypes: ['violations'] });
    return {
      violations: r.violations.map((v: AxeResult['violations'][0]) => ({
        id: v.id, impact: v.impact, description: v.description, help: v.help, helpUrl: v.helpUrl, nodeCount: v.nodes.length,
        nodes: v.nodes.slice(0, 8).map(n => ({ target: n.target.join(' '), html: n.html.slice(0, 160), summary: (n.failureSummary || '').slice(0, 240) })),
      })),
      passes: r.passes.length, incomplete: r.incomplete.length,
    };
  });
  return res;
}

async function targetScan(page: Page) {
  const els = await enumerateInteractive(page, 'body', []);
  const small = els.filter(e => e.w < 44 || e.h < 44).map(e => ({ selector: e.path, tag: e.tag, role: e.role, label: e.label, text: e.text, aria: e.aria, w: e.w, h: e.h, inNav: false }));
  return { total: els.length, under44: small.length, items: small };
}

async function contrastScan(page: Page) {
  return page.evaluate(() => {
    const parse = (c: string): [number, number, number, number] | null => {
      const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
      const p = m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);
      return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
    };
    const lum = ([r, g, b]: number[]) => { const f = (v: number) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
    const ratio = (a: number[], b: number[]) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
    const over = (fg: number[], bg: number[]) => { const a = fg[3]; return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]; };
    const hex = (c: number[]) => '#' + [c[0], c[1], c[2]].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
    const cssPath = (el: Element) => {
      const parts: string[] = []; let e: Element | null = el;
      while (e && e !== document.body && e.parentElement) { const p: Element = e.parentElement; parts.unshift(`${e.tagName.toLowerCase()}:nth-child(${Array.prototype.indexOf.call(p.children, e) + 1})`); e = p; if (parts.length > 8) { parts.unshift('...'); break; } }
      return parts.join(' > ');
    };
    const bodyBg = (() => { const b = parse(getComputedStyle(document.body).backgroundColor); const h = parse(getComputedStyle(document.documentElement).backgroundColor); return (b && b[3] > 0) ? over(b, [255, 255, 255, 1]) : (h && h[3] > 0) ? over(h, [255, 255, 255, 1]) : [255, 255, 255, 1]; })();
    // effective background behind an element: composite ancestor layers (nearest first) until opaque
    const backgroundOf = (el: Element): { bg: number[] | null; reason?: string } => {
      const layers: number[][] = []; let e: Element | null = el; let opacity = 1;
      while (e) {
        const cs = getComputedStyle(e);
        if (cs.backgroundImage && cs.backgroundImage !== 'none') return { bg: null, reason: /gradient/.test(cs.backgroundImage) ? 'gradient' : 'image' };
        const c = parse(cs.backgroundColor);
        const op = parseFloat(cs.opacity); if (!isNaN(op) && op < 1) opacity *= op;
        if (c && c[3] > 0) { layers.push([c[0], c[1], c[2], c[3] * (opacity < 1 ? opacity : 1)]); if (c[3] >= 1) break; }
        if (e === document.body) break;
        e = e.parentElement;
      }
      let bg = bodyBg;
      for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
      return { bg };
    };
    const results: { selector: string; text: string; fg: string; bg: string; ratio: number; required: number; size: number; weight: number; large: boolean }[] = [];
    const unknown: { selector: string; text: string; reason: string }[] = [];
    let checked = 0; let passed = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    const seen = new Set<string>();
    while ((node = walker.nextNode())) {
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const el = node.parentElement; if (!el) continue;
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'TITLE', 'OPTION'].includes(el.tagName)) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
      const rect = el.getBoundingClientRect(); if (rect.width === 0 || rect.height === 0) continue;
      // hidden by an ancestor?
      let hiddenAnc = false; let a: Element | null = el.parentElement;
      while (a) { const acs = getComputedStyle(a); if (acs.display === 'none' || acs.visibility === 'hidden' || parseFloat(acs.opacity) === 0) { hiddenAnc = true; break; } a = a.parentElement; }
      if (hiddenAnc) continue;
      const fgRaw = parse(cs.color); if (!fgRaw) continue;
      const size = parseFloat(cs.fontSize); const weight = parseInt(cs.fontWeight, 10) || (cs.fontWeight === 'bold' ? 700 : 400);
      const large = size >= 24 || (size >= 18.66 && weight >= 700);
      const required = large ? 3 : 4.5;
      const { bg, reason } = backgroundOf(el);
      const key = `${text.slice(0, 40)}|${cs.color}|${bg ? hex(bg) : reason}|${size}|${weight}`;
      if (seen.has(key)) continue; seen.add(key);
      if (!bg) { unknown.push({ selector: cssPath(el), text: text.slice(0, 60), reason: reason || 'unknown' }); continue; }
      const fg = fgRaw[3] < 1 ? over(fgRaw, bg) : fgRaw;
      const r = Math.round(ratio(fg, bg) * 100) / 100;
      checked++;
      if (r < required) results.push({ selector: cssPath(el), text: text.slice(0, 60), fg: hex(fg), bg: hex(bg), ratio: r, required, size, weight, large });
      else passed++;
    }
    return { checked, passed, failures: results.length, unknown: unknown.length, items: results, unknownItems: unknown.slice(0, 40) };
  });
}

async function scanPage(page: Page, slug: string) {
  const axe = await runAxe(page);
  const targets = await targetScan(page);
  const contrast = await contrastScan(page);
  axeByPage[slug] = axe; targetsByPage[slug] = targets; contrastByPage[slug] = contrast;
  fs.mkdirSync(SCANS_DIR, { recursive: true });
  writeJson(path.join(SCANS_DIR, `${slug}.json`), { slug, axe, targets, contrast });
  return { axe, targets, contrast };
}

test.describe('global', () => {
  test('nav reaches every top-level tab and Home stays the default', async ({ page }, testInfo) => {
    const b = await boot(page);
    await expect(page.locator(`${NAV} button[aria-label^="Home"][aria-current="page"]`)).toBeVisible();
    const tabs = ['Train', 'Fuel', 'Coach', 'Profile', 'Home'];
    const reached: Record<string, boolean> = {};
    for (const t of tabs) {
      await tap(page, navTab(t));
      reached[t] = await page.locator(`${NAV} button[aria-label^="${t}"][aria-current="page"]`).isVisible({ timeout: 5000 }).catch(() => false);
      expect.soft(reached[t], `nav tab ${t} becomes current`).toBe(true);
    }
    await expect(page.locator(SCREEN_ERROR)).toHaveCount(0);
    navResults.push({ test: 'top-level tabs', reached });
    writeJson(path.join(SCANS_DIR, 'nav-tabs.json'), reached);
    await testInfo.attach('nav-tabs', { body: JSON.stringify(reached, null, 2), contentType: 'application/json' });
    const errs = splitErrors(b.errors);
    expect(errs.page, JSON.stringify(errs.page, null, 2)).toEqual([]);
    expect(errs.console, JSON.stringify(errs.console, null, 2)).toEqual([]);
  });

  // in-app back control per page + what should be visible afterwards; null = no back control on that screen
  const BACK: Record<string, { sel: string; then: string } | null> = {
    home: null, 'train-hub': null, 'coach-chat': null, 'coach-plan': null, 'coach-setup': null, profile: null,
    'workout-log': null, review: null,
    progress: { sel: '[aria-label="Back"]', then: 'text=TOTAL WORKOUTS' },
    'pr-vault': { sel: '[aria-label="Back"]', then: 'text=FEATURED LIFTS' },
    photos: { sel: '[aria-label="Back"]', then: 'text=TOTAL WORKOUTS' },
    cycle: { sel: '[aria-label="Back to home"]', then: 'text=TOTAL WORKOUTS' },
    'workout-detail': { sel: '[aria-label="Back"]', then: 'h1:has-text("TRAIN")' },
    'exercise-library': { sel: '[aria-label="Back"]', then: 'h1:has-text("TRAIN")' },
    'split-builder': { sel: '[aria-label="Back"]', then: 'h1:has-text("TRAIN")' },
    cardio: { sel: '[aria-label="Back to Train"]', then: 'h1:has-text("TRAIN")' },
    settings: { sel: '[aria-label="Back to profile"]', then: 'button:has-text("Settings")' },
    'shopping-budget': { sel: 'button:text-is("Fuel")', then: 'button[aria-label="Shopping and budget"]' },
  };
  // screens go() pushes onto history (L57549): browser back should pop them
  const HISTORY_BACK: Record<string, string> = {
    progress: 'text=TOTAL WORKOUTS', cycle: 'text=TOTAL WORKOUTS', settings: 'button:has-text("Settings")', cardio: 'h1:has-text("TRAIN")',
  };

  for (const def of PAGES) {
    test(`reach ${def.slug} via ${def.path}; back returns; axe + targets + contrast`, async ({ page }, testInfo) => {
      const b = await boot(page, def.seed || {}, def.bootOpts || {});
      await def.enter(page);
      await expect(page.locator(def.ready).first()).toBeVisible();
      await expect(page.locator(SCREEN_ERROR)).toHaveCount(0);
      await page.waitForTimeout(400); // let entrance animations finish before measuring

      const { axe, targets, contrast } = await scanPage(page, def.slug);
      expect.soft(axe.violations, `axe violations on ${def.slug}`).toEqual([]);
      expect.soft(targets.under44, `targets under 44x44 on ${def.slug}`).toBe(0);
      expect.soft(contrast.failures, `contrast failures on ${def.slug}`).toBe(0);

      // back
      let backOk: boolean | null = null; let historyBackOk: boolean | null = null;
      const back = BACK[def.slug];
      if (back) {
        const ctl = page.locator(back.sel).first();
        if (await ctl.isVisible().catch(() => false)) {
          await tap(page, ctl);
          backOk = await page.locator(back.then).first().isVisible({ timeout: 5000 }).catch(() => false);
          expect.soft(backOk, `in-app back on ${def.slug} returns to previous screen`).toBe(true);
          // re-enter for the history-back check
          if (HISTORY_BACK[def.slug]) { await def.enter(page); await expect(page.locator(def.ready).first()).toBeVisible(); }
        } else { backOk = false; expect.soft(false, `back control ${back.sel} missing on ${def.slug}`).toBe(true); }
      }
      if (HISTORY_BACK[def.slug]) {
        await page.goBack();
        historyBackOk = await page.locator(HISTORY_BACK[def.slug]).first().isVisible({ timeout: 5000 }).catch(() => false);
        expect.soft(historyBackOk, `browser back from ${def.slug} pops the pushed screen`).toBe(true);
      }
      const errs = splitErrors(b.errors);
      const rec = {
        slug: def.slug, path: def.path, reached: true, inAppBack: backOk, historyBack: historyBackOk,
        axeViolations: axe.violations.length, axeNodes: axe.violations.reduce((n: number, v: { nodeCount: number }) => n + v.nodeCount, 0),
        axeIds: axe.violations.map((v: { id: string }) => v.id),
        interactiveTotal: targets.total, targetsUnder44: targets.under44,
        contrastChecked: contrast.checked, contrastFailures: contrast.failures, contrastUnknown: contrast.unknown,
        consoleErrors: errs.console.length, pageErrors: errs.page.length, errors: b.errors.map(e => e.text),
      };
      summary[def.slug] = rec;
      navResults.push(rec);
      // persist: Playwright restarts the worker after a failed test, so in-memory accumulators do not survive
      writeJson(path.join(SCANS_DIR, `${def.slug}.json`), { slug: def.slug, axe, targets, contrast, summary: rec });
      await testInfo.attach('scan-summary', { body: JSON.stringify(rec, null, 2), contentType: 'application/json' });
      expect(errs.page, JSON.stringify(errs.page, null, 2)).toEqual([]);
      expect(errs.console, JSON.stringify(errs.console, null, 2)).toEqual([]);
    });
  }

  test.afterAll(async () => {
    // merge whatever pages were scanned in this process with any earlier per-page files (serial mode → same worker)
    for (const f of fs.existsSync(SCANS_DIR) ? fs.readdirSync(SCANS_DIR) : []) {
      const d = JSON.parse(fs.readFileSync(path.join(SCANS_DIR, f), 'utf8'));
      axeByPage[d.slug] ??= d.axe; targetsByPage[d.slug] ??= d.targets; contrastByPage[d.slug] ??= d.contrast;
      if (d.summary) summary[d.slug] ??= d.summary;
    }
    const order = PAGES.map(p => p.slug);
    const sorted = <T,>(m: Record<string, T>) => Object.fromEntries(order.filter(k => k in m).map(k => [k, m[k]]));
    writeJson(path.join(RESULTS_DIR, 'axe.json'), { tags: ['wcag2a', 'wcag2aa'], axeVersion: '4.10.3', pages: sorted(axeByPage) });
    writeJson(path.join(RESULTS_DIR, 'targets.json'), { minSize: 44, excluded: [], pages: sorted(targetsByPage) });
    writeJson(path.join(RESULTS_DIR, 'contrast.json'), { thresholds: { normal: 4.5, large: 3 }, largeText: '>=24px or >=18.66px bold', pages: sorted(contrastByPage) });
    const perPage = Object.fromEntries(order.filter(k => summary[k]).map(k => [k, summary[k]]));
    const totals = Object.values(perPage).reduce((t, r) => ({
      axeViolations: t.axeViolations + (r.axeViolations as number), axeNodes: t.axeNodes + (r.axeNodes as number),
      targetsUnder44: t.targetsUnder44 + (r.targetsUnder44 as number), contrastFailures: t.contrastFailures + (r.contrastFailures as number),
      contrastUnknown: t.contrastUnknown + (r.contrastUnknown as number), consoleErrors: t.consoleErrors + (r.consoleErrors as number), pageErrors: t.pageErrors + (r.pageErrors as number),
    }), { axeViolations: 0, axeNodes: 0, targetsUnder44: 0, contrastFailures: 0, contrastUnknown: 0, consoleErrors: 0, pageErrors: 0 });
    const navFile = path.join(SCANS_DIR, 'nav-tabs.json');
    const navTabs = fs.existsSync(navFile) ? JSON.parse(fs.readFileSync(navFile, 'utf8')) : null;
    writeJson(path.join(RESULTS_DIR, 'global-summary.json'), { generated: new Date().toISOString(), pagesScanned: Object.keys(perPage).length, totals, navTabs, pages: perPage });
  });
});
