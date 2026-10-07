// Behavioural checks for the fire calculators against NFPA 13-2019, NFPA 12-2022, NFPA 92-2021.
//   node tests/fire.js
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'SmartEngineering_App.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push((e.detail && e.detail.message) || e.message));
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/', beforeParse(win) { try { win.localStorage.setItem('si_lang', 'ar'); } catch (e) {} } });
const w = dom.window;
w.alert = () => {}; w.confirm = () => true; w.scrollTo = () => {};
const doc = w.document;

let fail = 0;
function check(name, got, want) {
  const ok = typeof want === 'number' ? Math.abs(got - want) < 0.5 : got === want;
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
}
const setVal = (el, v) => { el.value = String(v); };

// ---------- Sprinkler (NFPA 13-2019) ----------
function spkRow(area, haz, type, maxAreaOverride) {
  w.renderCalc('sprinkler');
  const rows = doc.querySelectorAll('#spk-tbody tr');
  for (let i = 1; i < rows.length; i++) rows[i].remove();
  const tr = rows[0];
  setVal(tr.querySelector('.spk-area'), area);
  setVal(tr.querySelector('.spk-haz'), haz);
  setVal(tr.querySelector('.spk-type'), type);
  w.spkSyncArea(tr);
  if (maxAreaOverride) setVal(tr.querySelector('.spk-maxarea'), maxAreaOverride);
  const r = w.calcSprinkler();
  return { r, tr, maxArea: +tr.querySelector('.spk-maxarea').value, count: +tr.querySelector('.spk-count').textContent, main: tr.querySelector('.spk-mainpipe').textContent };
}
let s = spkRow(100, 'ordinary1', 'sidewall');
check('sidewall ordinary default area = 100 ft² (9.3 m²)', s.maxArea, 9.3);
check('sidewall ordinary count = ceil(100/9.3)', s.count, 11);
s = spkRow(100, 'light', 'sidewall');
check('sidewall light default area = 196 ft² (18.2 m²)', s.maxArea, 18.2);
s = spkRow(100, 'light', 'pendent');
check('pendent light default area = 20.9 m²', s.maxArea, 20.9);
s = spkRow(100, 'ordinary2', 'pendent');
check('pendent ordinary default area = 12.1 m²', s.maxArea, 12.1);
s = spkRow(25 * 20.9, 'light', 'pendent');
check('light 25 sprinklers -> 2½" (Table 27.5.2.2.1: ≤30)', s.main, '2½"');
s = spkRow(25 * 12.1, 'ordinary1', 'pendent');
check('ordinary 25 sprinklers -> 3" (Table 27.5.3.4: 2½"≤20)', s.main, '3"');
s = spkRow(100 * 20.9, 'light', 'pendent');
check('light 100 sprinklers -> 3½" (≤100)', s.main, '3½"');
s = spkRow(120 * 20.9, 'light', 'pendent');
check('light 120 sprinklers -> ordinary table 5" (27.5.2.2.2; 4"≤100)', s.main, '5"');
s = spkRow(30 * 9.3, 'extra1', 'pendent');
check('extra 30 sprinklers -> 3½" (A.27.5.4: 3"≤27)', s.main, '3½"');
check('extra hazard emits hydraulic-calc warning', s.r.warnings.some(x => x.includes('27.5.4')), true);
s = spkRow(100, 'light', 'pendent', 25);
check('manual area above NFPA max emits warning', s.r.warnings.some(x => x.includes('تتجاوز حد NFPA')), true);
s = spkRow(100, 'light', 'pendent');
check('default light row emits no warnings', s.r.warnings.length, 0);

// ---------- CO2 (NFPA 12-2022) ----------
function co2Room(L, W, H, type) {
  w.renderCalc('co2calc');
  const rows = doc.querySelectorAll('#co2-tbody tr');
  for (let i = 1; i < rows.length; i++) rows[i].remove();
  const tr = rows[0];
  setVal(tr.querySelector('.co2-l'), L); setVal(tr.querySelector('.co2-w'), W); setVal(tr.querySelector('.co2-h'), H);
  setVal(tr.querySelector('.co2-type'), type);
  return w.calcCO2().totalCO2;
}
check('dry electrical 60 m³ (2119 ft³ ≥2000): 0.083 → min 200 lb', co2Room(5, 4, 3, 'deep'), 200);
check('dry electrical 48 m³ (1695 ft³ <2000): 0.100 lb/ft³ → 169.5 lb', co2Room(4, 4, 3, 'deep'), 169.5);
check('dry electrical 100 m³ (3531 ft³): 0.083 → 293 lb', co2Room(5, 5, 4, 'deep'), 293);
check('surface 60 m³ (2119 ft³): 0.056 → 118.7 lb', co2Room(5, 4, 3, 'surface'), 118.7);
check('surface 10 m³ (353 ft³): 0.067 → 23.7 lb', co2Room(2, 2.5, 2, 'surface'), 23.7);
check('surface 1000 m³ (35315 ft³): 0.050 → 1766 lb', co2Room(10, 10, 10, 'surface'), 1766);
check('records 60 m³: 0.125 → 264.9 lb', co2Room(5, 4, 3, 'records'), 264.9);
check('fur 60 m³: 0.166 → 351.8 lb', co2Room(5, 4, 3, 'fur'), 351.8);

// ---------- Stair pressurisation (NFPA 92-2021 §4.4.2 / Annex A.4.4.2.2) ----------
function stair(dw, P) {
  w.renderCalc('stairpress');
  setVal(doc.getElementById('st_dw'), dw);
  setVal(doc.getElementById('st_pres'), P);
  return w.calcStairPress();
}
check('stair default (0.9 m door, 50 Pa) has no warnings', stair(0.9, 50).warnings.length, 0);
check('stair 1.2 m door at 80 Pa exceeds 133 N door force', stair(1.2, 80).warnings.length, 1);
check('stair 10 Pa below 12.5 Pa minimum', stair(0.9, 10).warnings.length, 1);

// ---------- Elevator ----------
w.renderCalc('elevatorpress');
let e = w.calcElevatorPress();
// defaults: 9 doors, 1 open (0.56 m²), vent 0, P=25, K=0.839, factor 1.5
// leak = 0.839×(8×0.06)×5 = 2.014 → ×1.5 = 3.020; open = 0.839×0.56×5 = 2.349; total 5.37 m³/s
check('elevator default: leakage with margin = 3.02 m³/s', Math.round(e.Qe_leakFinal * 100) / 100, 3.02);
check('elevator default: open recall door = 2.35 m³/s', Math.round(e.Qe_open * 100) / 100, 2.35);
check('elevator default: total = 5.37 m³/s', Math.round(e.Qe_final * 100) / 100, 5.37);
check('elevator default: closed-only comparison = 3.40 m³/s', Math.round(e.Qe_closedOnly * 100) / 100, 3.4);
check('elevator default: vent=0 warning present', e.warnings.some(x => x.includes('تهوية البئر')), true);
setVal(doc.getElementById('el_avent'), 0.5);
e = w.calcElevatorPress();
check('elevator with 0.5 m² vent: +0.839×0.5×5 = 2.10 → total 7.47', Math.round(e.Qe_final * 100) / 100, 7.47);
check('elevator with vent: no vent warning', e.warnings.length, 0);
setVal(doc.getElementById('el_open'), '0');
e = w.calcElevatorPress();
check('elevator recall door closed (+ vent 0.5): 9 doors leakage 3.40 + vent 2.10 = 5.50', Math.round(e.Qe_final * 100) / 100, 5.5);
check('elevator recall door closed emits §4.7 warning', e.warnings.some(x => x.includes('§4.7')), true);
w.renderCalc('elevatorpress');
setVal(doc.getElementById('el_nopen'), 99);
e = w.calcElevatorPress();
check('elevator open-door count clamped to door count', e.nOpen, 9);

check('no page-level errors', errors.length, 0);
console.log(fail ? `\n${fail} FAILED` : '\nall fire checks passed');
process.exit(fail ? 1 : 0);
