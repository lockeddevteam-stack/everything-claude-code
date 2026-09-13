import {open,DEMO,T,ids as IDS} from './zz4-lib.mjs';
const {b,p,errs}=await open(DEMO+'#/profile/settings');
await p.waitForTimeout(1500);
const sheet=async()=>T(await p.locator('[data-testid="sheet-password"]').innerText());
const openSheet=async()=>{if(!await p.locator('[data-testid="sheet-password"]').count()){await p.click('[data-testid="row-password"]');await p.waitForTimeout(600);}};
await openSheet();
console.log('SHEET:',(await sheet()).slice(0,600));
const cases=[
  ['empty','','',''],
  ['wrong old','wrongpass','NewPass123','NewPass123'],
  ['mismatch','password','NewPass123','NewPass124'],
  ['too short','password','ab','ab'],
  ['same as old','password','password','password'],
];
for(const [name,o,n1,n2] of cases){
  await openSheet();
  await p.fill('[data-testid="field-pw-old"]',o);
  await p.fill('[data-testid="field-pw-new"]',n1);
  await p.fill('[data-testid="field-pw-again"]',n2);
  await p.click('[data-testid="save-password"]'); await p.waitForTimeout(600);
  const still=await p.locator('[data-testid="sheet-password"]').count();
  const t=p.locator('[data-testid="toast"]');
  console.log('\n['+name+'] sheet open:',still,'| toast:',await t.count()?T(await t.innerText()):'(none)');
  if(still)console.log('   msg:',(await sheet()).replace(/Change your password.*?again/,'').slice(0,400));
  if(!still){console.log('   !! ACCEPTED');}
}
console.log('ERRS',errs);
await b.close();
