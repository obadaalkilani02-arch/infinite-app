// Payment certificate (مستخلص) tool inside the quotations screen: cumulative totals, retention cap, advance recovery, VAT bases, next certificate, CSV, printable document, save / import.
//   node tests/payment.js
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
  check('the quotation tab is shown first and the certificate tab is hidden', [w.document.getElementById('qt_root').style.display, w.document.getElementById('ipc_root').style.display], ['', 'none']);
  w.qtTab('pay');
  check('the certificate screen renders its tables and summary', [!!w.document.getElementById('ipc_root').querySelector('table'), !!w.document.getElementById('ipc_totals'), w.document.getElementById('qt_root').style.display, w.document.getElementById('ipc_root').style.display], [true, true, 'none', '']);
  check('an empty certificate is all zero', [w.ipcTotals().gross, w.ipcTotals().payable, w.ipcTotals().progress], [0, 0, null]);

  // data of the worked example
  w.ipcItem(0, 0, 'desc', 'Concrete'); w.ipcItem(0, 0, 'cqty', 100); w.ipcItem(0, 0, 'price', 50); w.ipcItem(0, 0, 'pqty', 20); w.ipcItem(0, 0, 'qty', 30);
  w.ipcAddItem(0); w.ipcItem(0, 1, 'desc', 'Steel'); w.ipcItem(0, 1, 'cqty', 10); w.ipcItem(0, 1, 'price', 1000); w.ipcItem(0, 1, 'pqty', 0); w.ipcItem(0, 1, 'qty', 4);
  let t = w.ipcTotals();
  check('item 1: contract 5000, previous 1000, this period 1500, cumulative 2500, 50 %', [t.sections[0].items[0].contract, t.sections[0].items[0].prev, t.sections[0].items[0].cur, t.sections[0].items[0].cum, t.sections[0].items[0].pct], [5000, 1000, 1500, 2500, 50]);
  check('item 2: contract 10000, this period 4000, cumulative 4000, 40 %', [t.sections[0].items[1].contract, t.sections[0].items[1].cur, t.sections[0].items[1].cum, t.sections[0].items[1].pct], [10000, 4000, 4000, 40]);
  check('sums: contract 15000, previous 1000, this period 5500, cumulative 6500, progress 43.33 %', [t.contractSum, t.prevSum, t.curSum, t.cumSum, +t.progress.toFixed(2)], [15000, 1000, 5500, 6500, 43.33]);

  // retention, materials, advance, extras
  w.ipcMeta('materials', 2000); w.ipcMeta('prevMaterials', 500); w.ipcMeta('matPct', 80);
  w.ipcMeta('retention', 10); w.ipcMeta('retCap', 5); w.ipcMeta('advance', 3000); w.ipcMeta('vat', 15); w.ipcMeta('prevNet', 1000);
  w.ipcAddAdj(); w.ipcAdj(0, 'name', 'Delay'); w.ipcAdj(0, 'dir', 'ded'); w.ipcAdj(0, 'type', 'pct'); w.ipcAdj(0, 'value', 1);
  w.ipcAddAdj(); w.ipcAdj(1, 'name', 'Extra'); w.ipcAdj(1, 'dir', 'add'); w.ipcAdj(1, 'type', 'amt'); w.ipcAdj(1, 'value', 200);
  t = w.ipcTotals();
  check('materials 2000 x 80 % = 1600 (previous 400); gross = 6500 + 1600 = 8100', [t.materials, t.prevMaterials, t.gross], [1600, 400, 8100]);
  check('retention 10 % = 810 is capped at 5 % of the contract = 750', t.retention, 750);
  check('advance recovery pro rata: 3000 x 6500 / 15000 = 1300', t.advRec, 1300);
  check('extras: 1 % of gross = 81 deducted and 200 added', [t.ded, t.add, t.adjs], [81, 200, [81, 200]]);
  check('net cumulative = 8100 - 750 - 1300 + 200 - 81 = 6169; this certificate = 6169 - 1000 = 5169', [t.netCum, t.netThis], [6169, 5169]);
  check('VAT on the work of the period (5500 + 1600 - 400 = 6700) at 15 % = 1005; payable 6174', [t.workThis, t.vat, t.payable], [6700, 1005, 6174]);
  w.ipcMeta('vatBasis', 'net'); t = w.ipcTotals();
  check('VAT on the net certificate: 5169 x 15 % = 775.35; payable 5944.35', [t.vat, t.payable], [775.35, 5944.35]);
  w.ipcMeta('vatBasis', 'work');
  w.ipcMeta('retCap', 0); check('without a cap the retention is 10 % of 8100 = 810', w.ipcTotals().retention, 810);
  w.ipcMeta('retCap', 5);
  w.ipcMeta('advMode', 'pct'); w.ipcMeta('advPct', 20); check('advance recovery as 20 % of gross = 1620 (the advance 3000 is the limit)', w.ipcTotals().advRec, 1620);
  w.ipcMeta('advPct', 50); check('50 % of gross = 4050 is limited to the advance 3000', w.ipcTotals().advRec, 3000);
  w.ipcMeta('advMode', 'prorata');
  w.ipcMeta('retention', 0); check('no retention rate gives zero retention', w.ipcTotals().retention, 0);
  w.ipcMeta('retention', 10);

  // on-screen summary
  w.ipcRender();
  const txt = w.document.getElementById('ipc_totals').textContent;
  check('on-screen summary shows the payable amount, retention and contract value', [/6,174\.00/.test(txt), /750\.00/.test(txt), /15,000\.00/.test(txt), /43\.33/.test(txt)], [true, true, true, true]);
  check('per-line values are shown (cumulative 2,500.00 and 1,500.00)', [/2,500\.00/.test(w.document.getElementById('ipc_c_0_0').textContent), /1,500\.00/.test(w.document.getElementById('ipc_t_0_0').textContent)], [true, true]);

  // over-measurement warning
  w.ipcItem(0, 1, 'qty', 11);
  t = w.ipcTotals();
  check('a cumulative quantity above the contract quantity is flagged', [t.sections[0].items[1].over, +t.sections[0].items[1].pct.toFixed(6), /⚠️/.test(w.document.getElementById('ipc_totals').textContent)], [true, 110, true]);
  w.ipcItem(0, 1, 'qty', 4);

  // next certificate
  w.ipcNext();
  t = w.ipcTotals();
  const d = w.ipcLoad();
  check('next certificate: previous quantities 50 and 4, current 0, previous net 6169, certificate number 2, previous materials 2000', [d.sections[0].items[0].pqty, d.sections[0].items[1].pqty, d.sections[0].items[0].qty, d.meta.prevNet, d.meta.certNo, d.meta.prevMaterials], [50, 4, 0, 6169, 2, 2000]);
  check('the new certificate pays nothing until new work is entered: net 0, VAT 0, payable 0', [t.netThis, t.vat, t.payable], [0, 0, 0]);
  w.ipcItem(0, 0, 'qty', 10);
  t = w.ipcTotals();
  check('10 more units of concrete (500) with the same materials: gross 8600; retention capped 750; advance 3000 x 7000 / 15000 = 1400; net cumulative 8600 - 750 - 1400 + 200 - 86 = 6564; this certificate 395', [t.gross, t.retention, t.advRec, t.netCum, t.netThis], [8600, 750, 1400, 6564, 395]);

  // persistence
  check('saved to localStorage', JSON.parse(w.localStorage.getItem('smarteng_ipc_v1')).sections[0].items.length, 2);
  const w2 = boot(); w2.localStorage.setItem('smarteng_ipc_v1', w.localStorage.getItem('smarteng_ipc_v1')); w2.ipcData = null;
  check('reloads the saved certificate', [w2.ipcLoad().sections[0].items[0].desc, w2.ipcLoad().meta.certNo], ['Concrete', 2]);

  // CSV
  const csv = w.ipcCSV();
  check('CSV has a BOM, the header and the amount due', [csv.startsWith('﻿"No.","Description"'), csv.includes('Amount due (SAR)'), csv.includes('"Concrete"'), csv.includes('Retention 10%'), csv.includes('"Delay"')], [true, true, true, true, true]);

  // printable document
  w.ipcMeta('company', 'Test Co'); w.ipcMeta('project', 'Tower A'); w.ipcMeta('contractor', 'Contractor B');
  let doc = w.ipcDocHTML();
  check('print document in Arabic: RTL, Arabic title, project, contractor and the three signatures', [/dir="rtl"/.test(doc), /مستخلص أعمال/.test(doc), /Tower A/.test(doc), /Contractor B/.test(doc), /المقاول<\/div><div>الاستشاري<\/div><div>المالك/.test(doc)], [true, true, true, true, true]);
  const en = boot('en'); await new Promise(r => setTimeout(r, 50));
  en.ipcMeta('project', 'Tower A');
  doc = en.ipcDocHTML();
  check('print document in English: LTR + PAYMENT CERTIFICATE + Amount due', [/dir="ltr"/.test(doc), /PAYMENT CERTIFICATE/.test(doc), /Amount due for payment/.test(doc)], [true, true, true]);

  // export / import round trip
  const json = JSON.stringify(w.ipcLoad());
  const f = new w.File([json], 'c.json', { type: 'application/json' });
  w.ipcData = w.ipcDefault();
  w.ipcImport(f);
  await new Promise(r => setTimeout(r, 100));
  check('import restores the saved certificate', [w.ipcLoad().sections[0].items.length, w.ipcLoad().adj.length, w.ipcTotals().netCum], [2, 2, 6564]);
  w.ipcAddSection(); check('add a section', w.ipcLoad().sections.length, 2);
  w.ipcDelSection(1); check('delete a section', w.ipcLoad().sections.length, 1);
  w.ipcDelSection(0); check('the only section cannot be deleted', w.ipcLoad().sections.length, 1);
  w.ipcDelAdj(0); check('delete an extra line', w.ipcLoad().adj.length, 1);
  w.ipcDelItem(0, 1); w.ipcDelItem(0, 0); check('the last item cannot be removed (an empty item stays)', w.ipcLoad().sections[0].items.length, 1);
  w.ipcReset();
  check('reset gives an empty certificate', [w.ipcTotals().payable, w.ipcLoad().meta.certNo, w.ipcLoad().adj.length], [0, 1, 0]);

  // robustness: bad numbers and negative omissions
  w.ipcItem(0, 0, 'cqty', 'abc'); w.ipcItem(0, 0, 'price', ''); w.ipcItem(0, 0, 'qty', 5);
  check('non-numeric entries count as zero', [w.ipcTotals().cumSum, w.ipcTotals().progress], [0, null]);
  w.ipcItem(0, 0, 'cqty', 10); w.ipcItem(0, 0, 'price', 100); w.ipcItem(0, 0, 'pqty', 8); w.ipcItem(0, 0, 'qty', -3);
  t = w.ipcTotals();
  check('a negative quantity (omission) reduces the cumulative value: (8 - 3) x 100 = 500', [t.cumSum, t.curSum, t.progress], [500, -300, 50]);
  w.ipcMeta('retention', 10); w.ipcMeta('retCap', 0); w.ipcMeta('advance', 1000);
  t = w.ipcTotals();
  check('retention is never negative and the advance recovery follows the progress (1000 x 500 / 1000 = 500)', [t.retention, t.advRec], [50, 500]);
  w.ipcMeta('vat', 15); w.ipcMeta('prevNet', 5000);
  t = w.ipcTotals();
  check('a negative certificate carries no VAT (net negative, base negative)', [t.netThis < 0, t.vat], [true, 0]);

  check('the quotation tool still works next to it: switching tabs back renders the offer', [(() => { w.qtTab('quote'); return !!w.document.getElementById('qt_root').querySelector('table') && w.document.getElementById('ipc_root').style.display === 'none'; })()], [true]);
  check('no page errors', errors.length, 0);
  if (errors.length) console.log(errors.slice(0, 3));
  console.log(fail ? `${fail} payment-certificate check(s) FAILED` : 'all payment-certificate checks passed');
  process.exit(fail ? 1 : 0);
})();
