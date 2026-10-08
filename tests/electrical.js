// Cable sizing & voltage drop: NEC 2008 (Tables 310.16 / 310.17 / Chapter 9 Table 9) and SBC 401 (IEC 60364-5-52).
//   node tests/electrical.js
// Expected values are read by hand from the code tables.
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
const doc = () => w.document;
function run(vals) {
  w.renderCalc('cablesizing');
  const base = { cs_std: 'nec', cs_phase: '3', cs_volt: 480, cs_mode: 'amp', cs_load: 100, cs_pf: 0.85, cs_len: 1, cs_vdlim: 50, cs_cont: 0,
    cs_metal: 'cu', cs_amb: 30, cs_ngroup: 3, cs_par: 1, cs_temp: 75, cs_inst: 'conduit', cs_conduit: 'pvc',
    cs_ins: 'pvc', cs_method: 'C', cs_layout: 'bunched', cs_use: 'other', cs_supply: 'A' };
  for (const [k, val] of Object.entries({ ...base, ...vals })) { const e = doc().getElementById(k); if (e) e.value = String(val); }
  return w.calcCableSizing();
}

// ---------- tables transcribed from the code text ----------
check('NEC 310.16: 4 AWG copper 60/75/90 = 70/85/95 A', w.eval('NEC_T16["4"].cu'), [70, 85, 95]);
check('NEC 310.16: 500 kcmil aluminum 75 °C = 310 A', w.eval('NEC_T16["500"].al[1]'), 310);
check('NEC 310.17: 4/0 copper 75 °C in free air = 360 A', w.eval('NEC_T17["4/0"].cu[1]'), 360);
check('NEC Table 9: 4 AWG copper in PVC conduit R = 1.02 ohm/km, XL = 0.157', w.eval('[NEC_T9["4"].rcu[0], NEC_T9["4"].xl[0]]'), [1.02, 0.157]);
check('NEC Table 8: 4 AWG = 21.15 mm²', w.eval('NEC_MM2["4"]'), 21.15);
check('IEC B.52-4: 2.5 mm² Cu PVC three loaded, method C = 24 A', w.eval('IEC_AMP.pvc3.Cu["2.5"][4]'), 24);
check('IEC B.52-2: 2.5 mm² Cu PVC two loaded, method C = 27 A', w.eval('IEC_AMP.pvc2.Cu["2.5"][4]'), 27);
check('IEC B.52-5: 300 mm² Al XLPE three loaded, method C = 440 A', w.eval('IEC_AMP.xlpe3.Al["300"][4]'), 440);

// ---------- NEC 2008 ----------
let r = run({ cs_load: 100, cs_temp: 75 });
check('NEC 100 A: 60 °C terminations up to 100 A -> 1 AWG (110 A at 60 °C)', r.chosen.s, '1');
r = run({ cs_load: 101 });
check('NEC 101 A: 75 °C terminations above 100 A -> 2 AWG (115 A)', r.chosen.s, '2');
r = run({ cs_load: 200, cs_amb: 40, cs_temp: 90 });
check('NEC 200 A, 40 °C, 90 °C insulation: 3/0 (225 x 0.91 = 204.75, limited by 75 °C termination 200 A)', r.chosen.s, '3/0');
check('NEC ambient factor 40 °C / 90 °C column = 0.91', r.kT, 0.91);
r = run({ cs_load: 80, cs_cont: 100 });
check('NEC continuous load: 125 % of 80 A = 100 A', r.Ireq, 100);
r = run({ cs_ngroup: 6 });
check('NEC 6 current-carrying conductors: 80 %', r.kG, 0.8);
r = run({ cs_ngroup: 25 });
check('NEC 25 current-carrying conductors: 45 %', r.kG, 0.45);
r = run({ cs_load: 50, cs_len: 100, cs_vdlim: 50 });
check('NEC 50 A: 6 AWG', r.chosen.s, '6');
check('NEC voltage drop = sqrt3 x I x L x (R cos + X sin) = 12.61 V', r.dV, Math.sqrt(3) * 50 * 0.1 * (1.61 * 0.85 + 0.167 * Math.sqrt(1 - 0.85 * 0.85)), 0.01);
r = run({ cs_load: 50, cs_len: 100, cs_vdlim: 2 });
check('NEC voltage drop governs when the limit is 2 %', r.governs, 'vd');
check('...and the chosen size is larger than the ampacity-only size', r.chosen.s !== r.byAmp.s, true);
r = run({ cs_load: 350, cs_par: 2, cs_temp: 75 });
check('NEC parallel conductors only from 1/0 AWG', r.chosen && NEC_IDX(r.chosen.s) >= NEC_IDX('1/0'), true);
function NEC_IDX(s) { return w.eval('NEC_AWG').indexOf(s); }
r = run({ cs_load: 20, cs_temp: 90, cs_metal: 'cu' });
check('NEC 20 A -> 12 AWG copper', r.chosen.s, '12');
check('NEC standard breaker for 20 A = 20 A (240.6(A))', r.ocpd, 20);
r = run({ cs_load: 100, cs_metal: 'al', cs_temp: 75 });
check('NEC aluminum 100 A at 60 °C termination -> 1 AWG (aluminum 60 °C = 85 A) is too small, 1/0 (100 A)', r.chosen.s, '1/0');

// ---------- SBC 401 / IEC 60364 ----------
r = run({ cs_std: 'iec', cs_phase: '3', cs_volt: 400, cs_load: 24, cs_amb: 30, cs_ngroup: 1, cs_ins: 'pvc', cs_method: 'C', cs_len: 1, cs_vdlim: 5 });
check('IEC Ib 24 A -> In 25 A -> 4 mm² (2.5 mm² gives only 24 A)', [r.ocpd, r.chosen.s], [25, 4]);
r = run({ cs_std: 'iec', cs_phase: '3', cs_volt: 400, cs_load: 24, cs_amb: 40, cs_ngroup: 1, cs_ins: 'pvc', cs_method: 'C', cs_len: 1, cs_vdlim: 5 });
check('IEC ambient 40 °C PVC factor = 0.87', r.kT, 0.87);
r = run({ cs_std: 'iec', cs_phase: '3', cs_volt: 400, cs_load: 24, cs_amb: 40, cs_ins: 'xlpe', cs_method: 'C', cs_len: 1 });
check('IEC ambient 40 °C XLPE factor = 0.91', r.kT, 0.91);
r = run({ cs_std: 'iec', cs_ngroup: 3, cs_load: 24, cs_amb: 30, cs_method: 'B1', cs_ins: 'pvc', cs_len: 1 });
check('IEC 3 circuits bunched: 0.70', r.kG, 0.7);
r = run({ cs_std: 'iec', cs_ngroup: 3, cs_load: 24, cs_amb: 30, cs_method: 'C', cs_layout: 'layer', cs_ins: 'pvc', cs_len: 1 });
check('IEC 3 circuits single layer on a wall: 0.79', r.kG, 0.79);
r = run({ cs_std: 'iec', cs_phase: '3', cs_volt: 400, cs_load: 60, cs_pf: 0.8, cs_amb: 30, cs_ngroup: 1, cs_ins: 'pvc', cs_method: 'C', cs_len: 100, cs_vdlim: 5 });
check('IEC Ib 60 A -> In 63 A -> 16 mm² (PVC, method C: 76 A)', [r.ocpd, r.chosen.s], [63, 16]);
const dvp = (0.0225 * 100 / 16 * 0.8 + 0.08e-3 * 100 * 0.6) * 60;
check('IEC Annex G.52 voltage drop % (3-phase, b = 1, relative to U0 = 230.9 V)', r.vdPct, dvp / (400 / Math.sqrt(3)) * 100, 0.001);
check('...and the line-to-line value shown', r.dV, dvp * Math.sqrt(3), 0.001);
r = run({ cs_std: 'iec', cs_phase: '1', cs_volt: 230, cs_load: 20, cs_pf: 0.8, cs_amb: 30, cs_ins: 'pvc', cs_method: 'C', cs_len: 50, cs_vdlim: 5 });
check('IEC single-phase uses b = 2 (two loaded conductors table B.52-2)', r.chosen.s, 4);
r = run({ cs_std: 'iec', cs_len: 300, cs_vdlim: 5, cs_load: 24 });
check('IEC limit rises 0.005 %/m beyond 100 m, max +0.5 %', r.vdLimEff, 5.5);
r = run({ cs_std: 'iec', cs_len: 130, cs_vdlim: 5, cs_load: 24 });
check('IEC 130 m: +0.15 %', r.vdLimEff, 5.15);
r = run({ cs_std: 'iec', cs_method: 'D2', cs_gnd: 30, cs_rho: 2.5, cs_ins: 'xlpe', cs_load: 50, cs_len: 1 });
check('IEC buried: 30 °C ground XLPE factor 0.93', r.kT, 0.93);
r = run({ cs_std: 'iec', cs_method: 'D1', cs_gnd: 20, cs_rho: 1.5, cs_ins: 'pvc', cs_load: 50, cs_len: 1 });
check('IEC buried ducts, soil 1.5 K·m/W: 1.1', r.kT, 1.1);

// ---------- UI ----------
w = boot('sa'); w.renderCalc('cablesizing');
check('Saudi code selects SBC 401 / IEC by default', w.document.getElementById('cs_std').value, 'iec');
check('NEC-only fields hidden under IEC', w.document.querySelector('.cs-nec').style.display, 'none');
w = boot(); w.renderCalc('cablesizing');
check('international mode starts on NEC', w.document.getElementById('cs_std').value, 'nec');
check('result block rendered', /المقطع المقترح|لا يوجد مقطع/.test(w.document.getElementById('cs_results').textContent), true);
w.document.getElementById('cs_std').value = 'iec'; w.csToggle('std');
check('switching to IEC refills the voltage-drop limit with 5 %', +w.document.getElementById('cs_vdlim').value, 5);
w.document.getElementById('cs_use').value = 'lighting'; w.csToggle('use');
check('IEC lighting from the public network: 3 %', +w.document.getElementById('cs_vdlim').value, 3);
w.document.getElementById('cs_supply').value = 'B'; w.csToggle('use');
check('IEC lighting from a private supply: 6 %', +w.document.getElementById('cs_vdlim').value, 6);

check('no page errors', errors.length, 0);
if (errors.length) console.log(errors.slice(0, 3));
console.log(fail ? `${fail} electrical check(s) FAILED` : 'all electrical checks passed');
process.exit(fail ? 1 : 0);
