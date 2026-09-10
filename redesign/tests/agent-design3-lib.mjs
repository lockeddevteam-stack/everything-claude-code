// Shared helpers for the third ship review. Not a test; imported by agent-design3-*.mjs.
import fs from 'fs';
export const DIR = '/home/user/everything-claude-code/redesign/08-build';
export const OUT = '/tmp/claude-0/-home-user-everything-claude-code/f7fd4e3f-0443-5a8d-a801-04f3354b33c8/scratchpad/s3';
export const screens = fs.readdirSync(DIR).filter(f => f.endsWith('.html')).sort();
fs.mkdirSync(OUT, { recursive: true });

// Open the screen's own dev state switcher and return the list of state labels.
export async function listStates(p) {
  return await p.evaluate(() => {
    const t = document.querySelector('[data-testid=dev-toggle],[data-testid=dev-open],#dev-toggle,#dev-open');
    if (!t) return [];
    t.click();
    const items = [...document.querySelectorAll('.dev__item,.dev-item')];
    return items.map((b, i) => b.getAttribute('data-testid') || String(i));
  });
}

export async function pickState(p, testid) {
  return await p.evaluate((id) => {
    const t = document.querySelector('[data-testid=dev-toggle],[data-testid=dev-open],#dev-toggle,#dev-open');
    if (t) t.click();
    const b = document.querySelector(`[data-testid="${id}"]`);
    if (!b) return false;
    b.click();
    // close any dev menu still open
    const m = document.querySelector('.dev__menu');
    if (m && !m.hidden) { const tt = document.querySelector('.dev__toggle'); if (tt) tt.click(); }
    return true;
  }, testid);
}

export const visFn = `(e)=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&s.opacity!=='0';}`;
