// Heating load per the Syrian Arab Code (HVAC) section 3/10/1 — formulas checked by hand.
//   node tests/heating.js
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'SmartEngineering_App.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push((e.detail && e.detail.message) || e.message));
function boot(code) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/',
    beforeParse(w) { w.alert = () => {}; w.scrollTo = () => {}; try { w.localStorage.setItem('si_lang', 'ar'); if (code) w.localStorage.setItem('si_code', code); } catch (e) {} } });
  return dom.window;
}
let fail = 0;
function check(name, got, want, tol) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= (tol ?? 0.01) : JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
}
let w = boot();
const setv = (id, v) => { w.document.getElementById(id).value = String(v); };
w.renderCalc('heatingload');
setv('hl_to', -2); setv('hl_safety', 15);
let r = w.calcHeatingLoad();
const Q1 = (12 * 0.72 + 3 * 2.89) * 24, Q2 = 0.342 * 60 * 24;
check('Q1 = sum(U A dt) = 415.4 W (wall 12 m2 U .72 + window 3 m2 U 2.89, dt 24 K)', r.Q1sum, Q1, 0.01);
check('Q2 = 0.342 V dt = 492.5 W (60 m3, 1 air change/h)', r.Q2sum, Q2, 0.01);
check('Q_H = (Q1+Q2) x 1.15', r.QH, (Q1 + Q2) * 1.15, 0.01);
setv('hl_dhw', 100); setv('hl_dhwdt', 50);
r = w.calcHeatingLoad();
check('Q3 = 1.1641 V dt = 5820.5 W', r.Q3, 1.1641 * 100 * 50, 0.01);
check('Q_T = Q_H + Q3', r.QT, r.QH + r.Q3, 0.01);
check('boiler Q_b = Q_T (1 + 0.1 + 0.2) in kW', r.Qb, r.QT * 1.3 / 1000, 0.0001);
check('burner kg/h = Q_b / (11.6 x 0.85)', r.burnerKgH, r.Qb / (11.6 * 0.85), 0.0001);
check('annual fuel = 0.75 Q_H N F C 24 / (Cv eta)', r.annualKg, 0.75 * (r.QH / 1000) * 150 * 0.33 * 0.6 * 24 / (11.6 * 0.85), 0.01);
// ventilation air replaces infiltration
w.document.querySelector('.hl-vent').value = 100;
r = w.calcHeatingLoad();
check('ventilation air 100 m3/h replaces infiltration: Q2 = 0.342 x 100 x 24', r.Q2sum, 0.342 * 100 * 24, 0.01);
// air-change table 15/3
w.document.querySelector('.hl-vent').value = 0;
w.document.querySelector('.hl-n').value = '2';
r = w.calcHeatingLoad();
check('three/four exposed sides: 2 air changes/h', r.Q2sum, 0.342 * 120 * 24, 0.01);
check('Table 15/3 has 8 rows', w.eval('HL_AIR_CHANGES.length'), 8);
check('Table 2/3: residential living rooms 22 C', w.eval('HL_INDOOR[0][1]'), 22);
// zero / negative dt
setv('hl_to', 25); r = w.calcHeatingLoad();
check('outdoor warmer than indoor: no load', r.Q, 0);
// several rooms add up
setv('hl_to', 0); w.addHlRoom();
r = w.calcHeatingLoad();
check('two rooms', r.rooms.length, 2);
check('building load is the sum of the rooms', r.Q, r.rooms[0].q + r.rooms[1].q, 0.001);
// element types
w.document.querySelector('.hl-etype').value = 'roof'; w.hlElemTypeChange(w.document.querySelector('.hl-etype'));
check('changing the element type loads its default U', +w.document.querySelector('.hl-eu').value, 0.661);
// Syrian cities
w = boot('sy'); w.renderCalc('heatingload');
check('Syrian mode offers the city list', !!w.document.getElementById('hl_city'), true);
w.document.getElementById('hl_city').value = '0'; w.hlCityApply('0');
check('Damascus winter design temperature -2 C (Table 1/3)', +w.document.getElementById('hl_to').value, -2);
w = boot(); w.renderCalc('heatingload');
check('no city list in international mode', !!w.document.getElementById('hl_city'), false);
check('results rendered', /استطاعة المرجل/.test(w.document.getElementById('hl_results').textContent), true);
check('no page errors', errors.length, 0);
if (errors.length) console.log(errors.slice(0, 3));
console.log(fail ? `${fail} heating check(s) FAILED` : 'all heating checks passed');
process.exit(fail ? 1 : 0);
