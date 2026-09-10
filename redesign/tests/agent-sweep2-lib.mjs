export const D='file:///home/user/everything-claude-code/redesign/08-build/';
export const SCREENS=['coach','exercise-library','fuel','home','onboarding','profile','progress','review','settings','shopping','split-builder','train','workout-log'];
export function hook(p,bag){
  p.on('pageerror',e=>bag.push({t:'pageerror',m:String(e&&e.message||e)}));
  p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')bag.push({t:m.type(),m:m.text()});});
}
export const listStates=p=>p.evaluate(()=>[...document.querySelectorAll('[data-testid^="dev-state-"],[data-testid^="dev-preset-"]')].map(b=>b.dataset.testid));
