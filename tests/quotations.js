// Quotation / BOQ tool: totals, office build-up pricing, CSV, printable document, save / import.
//   node tests/quotations.js
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'SmartEngineering_App.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push((e.detail && e.detail.message) || e.message));
function boot(lang) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/',
    beforeParse(w) { w.alert = () => {}; w.confirm = () => true; w.scrollTo = () => {}; try { w.localStorage.setItem('si_lang', lang || 'ar'); } catch (e) {} } });
  return dom.window;
}
let fail = 0;
function check(name, got, want, tol) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= (tol ?? 0.001) : JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
}
(async () => {
  let w = boot();
  w.showCategory('quotations');
  check('quotation screen renders', !!w.document.getElementById('qt_root').querySelector('table'), true);
  check('empty offer totals 0', w.qtTotals().grand, 0);

  // direct pricing
  w.qtItem(0, 0, 'desc', 'Pump'); w.qtItem(0, 0, 'qty', 10); w.qtItem(0, 0, 'price', 25.5);
  w.qtAddItem(0); w.qtItem(0, 1, 'qty', 3); w.qtItem(0, 1, 'price', 100);
  w.qtMeta('discount', 10); w.qtMeta('vat', 14);
  let t = w.qtTotals();
  check('line total = qty x unit price (10 x 25.5)', t.sections[0].items[0].total, 255);
  check('sub-total 555', t.sum, 555);
  check('discount 10 % = 55.5', t.discount, 55.5);
  check('net 499.5', t.net, 499.5);
  check('VAT 14 % = 69.93', t.vat, 69.93);
  check('grand total 569.43', t.grand, 569.43);
  check('on-screen total shown', /569\.43/.test(w.document.getElementById('qt_totals').textContent), true);

  // second section
  w.qtAddSection(); w.qtItem(1, 0, 'qty', 2); w.qtItem(1, 0, 'price', 50);
  t = w.qtTotals();
  check('two sections add up (555 + 100)', t.sum, 655);

  // office build-up: cost x (1 - discount) x (1 + factors)
  w.qtPricingMode('buildup');
  for (const [k, v] of Object.entries({ disc: 20, acc: 15, trans: 4, inst: 10, eng: 0, ovh: 0, profit: 0 })) w.qtPricing(k, v);
  w.qtItem(0, 0, 'price', 1000);
  check('build-up: 1000 x 0.8 x 1.29 = 1032', w.qtUnitPrice(w.qtLoad().sections[0].items[0], w.qtLoad().pricing), 1032);
  w.qtPricing('profit', 10);
  check('build-up with 10 % profit: 800 x 1.39 = 1112', w.qtUnitPrice(w.qtLoad().sections[0].items[0], w.qtLoad().pricing), 1112);
  check('selling-price column shown in build-up mode', !!w.document.getElementById('qt_u_0_0'), true);
  w.qtPricingMode('direct');

  // persistence
  check('saved to localStorage', JSON.parse(w.localStorage.getItem('smarteng_boq_v1')).sections.length, 2);
  const w2 = boot(); w2.localStorage.setItem('smarteng_boq_v1', w.localStorage.getItem('smarteng_boq_v1'));
  w2.qtData = null;
  check('reloads the saved offer', w2.qtLoad().sections[0].items[0].desc, 'Pump');

  // CSV
  const csv = w.qtCSV();
  check('CSV has a BOM and the header', csv.startsWith('﻿"No.","Description"'), true);
  check('CSV contains the grand total', csv.includes('Grand total (SAR)'), true);
  check('CSV quotes descriptions', csv.includes('"Pump"'), true);

  // printable document
  w.qtMeta('company', 'Test Co'); w.qtMeta('customer', 'Client A'); w.qtMeta('ref', 'Q-1');
  let doc = w.qtDocHTML();
  check('print document in Arabic: RTL + Arabic title', /dir="rtl"/.test(doc) && /عرض سعر/.test(doc), true);
  check('print document lists the item and customer', /Pump/.test(doc) && /Client A/.test(doc), true);
  const en = boot('en'); await new Promise(r => setTimeout(r, 50));
  en.qtMeta('customer', 'Client A');
  doc = en.qtDocHTML();
  check('print document in English: LTR + QUOTATION', /dir="ltr"/.test(doc) && /QUOTATION/.test(doc), true);

  // export / import round trip
  const json = JSON.stringify(w.qtLoad());
  const f = new w.File([json], 'q.json', { type: 'application/json' });
  w.qtData = w.qtDefault();
  w.qtImport(f);
  await new Promise(r => setTimeout(r, 100));
  check('import restores the saved offer', w.qtLoad().sections.length, 2);
  w.qtDelSection(1);
  check('delete a section', w.qtLoad().sections.length, 1);
  w.qtDelSection(0);
  check('the only section cannot be deleted', w.qtLoad().sections.length, 1);
  w.qtReset();
  check('reset gives an empty offer', w.qtTotals().grand, 0);

  check('no page errors', errors.length, 0);
  if (errors.length) console.log(errors.slice(0, 3));
  console.log(fail ? `${fail} quotation check(s) FAILED` : 'all quotation checks passed');
  process.exit(fail ? 1 : 0);
})();
