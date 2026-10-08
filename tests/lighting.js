// Lighting calculator: lumen method and the SBC 601-18 chapter 9 power-density checks.
//   node tests/lighting.js
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'SmartEngineering_App.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push((e.detail && e.detail.message) || e.message));
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/',
  beforeParse(w) { w.alert = () => {}; w.scrollTo = () => {}; try { w.localStorage.setItem('si_lang', 'ar'); } catch (e) {} } });
const w = dom.window;
let fail = 0;
function check(name, got, want, tol) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= (tol ?? 0.001) : JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
}
w.renderCalc('lightingcalc');
const doc = w.document;
const rows = () => [...doc.querySelectorAll('#lt-tbody tr')];
// leave one row: enclosed office, 20 m2, 500 lux, CU 0.5, MF 0.8, 1200 lm luminaires at 100 lm/W
rows().slice(1).forEach(r => r.remove());
const r0 = rows()[0];
const set = (sel, v) => { r0.querySelector(sel).value = String(v); };
set('.lt-space', 'office'); set('.lt-lux', 500); set('.lt-area', 20); set('.lt-cu', 0.5); set('.lt-flux', 1200);
doc.getElementById('lt_efficacy').value = '100'; doc.getElementById('lt_mf').value = '0.8';
let r = w.calcLighting();
check('total flux = E x A / (CU x MF) = 25000 lm', r.totFlux, 25000);
check('luminaires = ceil(25000 / 1200) = 21', r.totDevices, 21);
check('power = 21 x 1200 / 100 = 252 W', r.totPower, 252);
check('SBC 601 Table 9.3: enclosed office 11.9 W/m2 -> allowance 238 W', r.allowPower, 238, 0.01);
check('252 W exceeds the allowance', r.listedPower > r.allowPower, true);
check('row LPD 12.6 W/m2 shown', r0.querySelector('.lt-lpd').textContent, '12.6');
check('row allowance 11.9 shown', r0.querySelector('.lt-lpd-allow').textContent, '11.9');
// brighter luminaires -> inside the limit
doc.getElementById('lt_efficacy').value = '130';
r = w.calcLighting();
check('at 130 lm/W the power drops to ~194 W', r.totPower, 21 * 1200 / 130, 0.01);
check('...and complies', r.listedPower <= r.allowPower, true);
// building area method
doc.getElementById('lt_bldg').value = String(w.eval('LPD_BUILDING.findIndex(b => /Office\\)$/.test(b[0]))'));
r = w.calcLighting();
check('Table 9.2 office 9.7 W/m2 x 20 m2 = 194 W', r.bldgAllow, 194, 0.01);
w.calcResult('lightingcalc');
check('results mention SBC 601, not SBC 401, for the density limits', /SBC 601/.test(doc.getElementById('lt_results').textContent), true);
// space types without a Table 9.3 entry
set('.lt-space', 'bedroom'); r = w.calcLighting();
check('residential bedroom has no Table 9.3 allowance', r.listedArea, 0);
// tables
check('Table 9.2 has 33 building types', w.eval('LPD_BUILDING.length'), 33);
check('Table 9.2: hospital 13.0, retail 15.1, parking garage 2.7', w.eval('["Hospital","Retail","Parking garage"].map(n => LPD_BUILDING.find(b => b[0].includes("("+n+")"))[1])'), [13.0, 15.1, 2.7]);
check('every space type with an allowance has a positive value', w.eval('Object.values(LUX_TABLE).filter(s => s.lpd != null).every(s => s.lpd > 0)'), true);
check('no page errors', errors.length, 0);
if (errors.length) console.log(errors.slice(0, 3));
console.log(fail ? `${fail} lighting check(s) FAILED` : 'all lighting checks passed');
process.exit(fail ? 1 : 0);
