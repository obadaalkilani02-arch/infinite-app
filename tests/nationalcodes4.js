// Reference-code selector, part 4: Jordanian national codes, parts 76 onward (cable tables and later); split from nationalcodes3.js to keep the heap small.
//   node tests/nationalcodes4.js
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'SmartEngineering_App.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push((e.detail && e.detail.message) || e.message));
const live = [];
function boot(code) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/', beforeParse(win) { try { win.localStorage.setItem('si_lang', 'ar'); if (code) win.localStorage.setItem('si_code', code); } catch (e) {} } });
  const w = dom.window; w.alert = () => {}; w.confirm = () => true; w.scrollTo = () => {};
  live.push(w); while (live.length > 4) { try { live.shift().close(); } catch (e) {} }   // older windows are not used again; closing them keeps the heap bounded
  return w;
}
let fail = 0;
function check(name, got, want, tol) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= (tol ?? 0.01) : JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
}
const fire = (w, el) => el.dispatchEvent(new w.Event('change', { bubbles: true }));
const pick = (w, id, val) => { const e = w.document.getElementById(id); e.value = String(val); fire(w, e); };
const setv = (w, id, val) => { w.document.getElementById(id).value = String(val); };

let w, doc;

// ---------- part 76: Jordanian electrical installations code, cable tables of rubber 85 C (26 - 28) and paper-insulated cables (29 - 32 copper, 56 - 59 aluminium) in the cable sizing calculator ----------
{
w = boot('jo'); doc = w.document; w.renderCalc('cablesizing');
const J = w.eval('JSON.parse(JSON.stringify(JO_CABLE))');
const jo = vals => { Object.keys(vals).forEach(id => setv(w, id, vals[id])); w.csToggle(); return w.eval('calcCableSizing()'); };
const joBase = {cs_std: 'jo', cs_phase: '3', cs_volt: 400, cs_mode: 'amp', cs_load: 100, cs_pf: 0.85, cs_len: 1, cs_amb: 30, cs_ngroup: 1, cs_par: 1, cs_metal: 'cu', cs_vdlim: 10, cs_jo_arr: 'flat', cs_jo_c: 'no', cs_jo_sv: 'no', cs_jo_trench: 'no'};
const fam = k => Object.keys(J).filter(x => J[x].m === k).length;
check('Jordan cable tables: the rubber and paper tables bring copper to 17 families (Tables 16 - 32) and aluminium to 13 (47 - 59); the mineral-insulated and flexible tables of part 77 add 15 copper ones', [fam('cu') - Object.keys(J).filter(k => J[k].mi).length, fam('al')], [17, 13]);
jo(Object.assign({}, joBase, {cs_metal: 'cu'})); w.csToggle('metal');
const nCu = doc.getElementById('cs_jo').options.length;
setv(w, 'cs_metal', 'al'); w.csToggle('metal');
check('the lists offer 32 copper and 13 aluminium tables, the default stays Table 24 / 54', [nCu, doc.getElementById('cs_jo').options.length, doc.getElementById('cs_jo').value], [32, 13, 'al_xlpea_clip']);
setv(w, 'cs_metal', 'cu'); w.csToggle('metal');
check('rubber Tables 26, 27, 28 as printed: 50 mm2 (170 A, 1.0 mV / 145 A, 0.89 mV), 630 mm2 (1050 / 950 A), 150 mm2 in air (480 A, 0.40 mV, 0.40, trefoil 425 A, 0.30)', [J.cu_rub1_encl.rows['50'], J.cu_rub1_clip.rows['630'], J.cu_rub1_air.rows['150']], [[170, 1, 145, 0.89], [1050, 0.18, 950, 0.22], [480, 0.4, 0.4, 425, 0.3]]);
check('paper copper Tables 29 - 32: 1000 mm2 clipped (1280 A, 0.16 mV, 1190 A, 0.15), 800 mm2 in air (two cables 1290, three flat 1220, trefoil 1150), multi-core 400 mm2 (610 / 545 A), 240 mm2 in air (555 / 480 A)', [J.cu_pap1_clip.rows['1000'], J.cu_pap1_air.rows['800'], J.cu_papm_clip.rows['400'], J.cu_papm_air.rows['240']], [[1280, 0.16, 1190, 0.15], [1290, 0.26, 1220, 0.24, 1150, 0.15], [610, 0.2, 545, 0.17], [555, 0.24, 480, 0.2]]);
check('paper aluminium Tables 56 - 59: 800 mm2 clipped (910 A / 890 A), 150 mm2 in air (370, 360, 325 A), multi-core 300 mm2 (425 / 335 A), 400 mm2 in air (585 / 510 A)', [J.al_pap1_clip.rows['800'], J.al_pap1_air.rows['150'], J.al_papm_clip.rows['300'], J.al_papm_air.rows['400']], [[910, 0.19, 890, 0.19], [370, 0.58, 360, 0.56, 325, 0.46], [425, 0.3, 335, 0.26], [585, 0.26, 510, 0.22]]);
check('the misprints: Table 26 6 mm2 two-cable drop 2.7 replaced by 7.7 (as Table 27); Table 30 trefoil 400 mm2 (275 A), Table 56 240 mm2 two cables (345 A) and Table 59 185 and 240 mm2 three-phase (205, 265 A) left empty', [J.cu_rub1_encl.rows['6'][1], J.cu_pap1_air.rows['400'][4], J.al_pap1_clip.rows['240'][0], J.al_papm_air.rows['185'][2], J.al_papm_air.rows['240'][2]], [7.7, null, null, null, null]);
let bad = [];
const newIds = Object.keys(J).filter(k => /_(rub|pap)/.test(k));
for (const id of newIds) {
  const f = J[id], sizes = Object.keys(f.rows).map(Number).sort((a, b) => a - b), cols = f.ar === 2 ? [0, 2, 4] : f.ar ? [0, 3] : [0, 2];
  for (const c of cols) { let p = null; for (const s of sizes) { const x = f.rows[s][c]; if (x == null) continue; if (p != null && x <= p) bad.push(id + ' I' + c + ' ' + s); p = x; } }
  if (!f.ar) for (const c of [1, 3]) { let p = null; for (const s of sizes) { const x = f.rows[s][c]; if (x == null) continue; if (p != null && x > p) bad.push(id + ' v' + c + ' ' + s); p = x; } }
}
check('the 11 new tables: the current rises and the voltage drop falls with the conductor size (a typing check on the transcription)', [newIds.length, bad], [11, []]);
check('ambient factors: rubber 25 C -> 1.05, 28 -> 1, 40 -> 0.89, 75 -> 0.39, 80 -> not tabulated; paper 70 C -> 0.43 (the 0.34 of Table 56 is a misprint), 75 -> 0.30, 76 -> not tabulated', [w.eval("joAmbFactor('rub', 25)"), w.eval("joAmbFactor('rub', 28)"), w.eval("joAmbFactor('rub', 40)"), w.eval("joAmbFactor('rub', 75)"), w.eval("joAmbFactor('rub', 80)"), w.eval("joAmbFactor('pap', 70)"), w.eval("joAmbFactor('pap', 75)"), w.eval("joAmbFactor('pap', 76)")], [1.05, 1, 0.89, 0.39, null, 0.43, 0.3, null]);
let r = jo(Object.assign({}, joBase, {cs_jo: 'cu_rub1_clip', cs_mode: 'kw', cs_load: 55, cs_len: 80, cs_amb: 40, cs_vdlim: 2.5}));
check('55 kW, 400 V, 80 m, 40 C on Table 27 (rubber, clipped): Ib 93.4 A, In 100 A, factor 0.89; 25 mm2 (128 A) carries it but drops 2.99 %; 35 mm2 (158 A x 0.89 = 140.6 A, 1.2 mV) 2.24 %', [r.mm2, r.ocpd, r.kT, r.byAmp.s, +r.allowed.toFixed(1), +r.vdPct.toFixed(2), r.governs], [35, 100, 0.89, 25, 140.6, 2.24, 'vd']);
r = jo(Object.assign({}, joBase, {cs_jo: 'cu_rub1_encl', cs_phase: '1', cs_volt: 230, cs_load: 40, cs_len: 10}));
check('single-phase 40 A, 10 m on Table 26 (enclosed): 6 mm2 (48 A) with the corrected 7.7 mV = 3.08 V (1.34 %); the printed 2.7 would give only 1.08 V', [r.mm2, r.tab, +r.dV.toFixed(2), +r.vdPct.toFixed(2)], [6, 48, 3.08, 1.34]);
r = jo(Object.assign({}, joBase, {cs_phase: '3', cs_volt: 400, cs_jo_c: 'yes', cs_load: 150}));
check('Table 26 with method C (underground ducts) stops at 35 mm2 (134 A): 150 A has no size, with a warning naming Table 26', [!!r.chosen, r.warnings.some(x => x.includes('26'))], [false, true]);
r = jo(Object.assign({}, joBase, {cs_jo: 'cu_rub1_air', cs_jo_c: 'no', cs_load: 400, cs_jo_arr: 'flat'}));
const rf = [r.mm2, r.tab];
r = jo({cs_jo_arr: 'trefoil'});
check('Table 28 (rubber, in air), 400 A three-phase: flat needs 120 mm2 (425 A); trefoil 150 mm2 (425 A); 95 mm2 carries 360 / 325 A', [rf, r.mm2, r.tab], [[120, 425], 150, 425]);
r = jo({cs_jo_arr: 'flat', cs_amb: 80});
check('rubber at 80 C: no factor, the calculation stops and the warning gives the last printed temperature (75 C)', [r.invalid === true, r.warnings.some(x => x.includes('75'))], [true, true]);
r = jo({cs_jo_arr: 'flat', cs_amb: 30, cs_jo: 'cu_pap1_air', cs_load: 285});
const pAir = [r.mm2, r.tab, r.ocpd];
r = jo({cs_jo_arr: 'trefoil'});
const pTre = [r.mm2, r.tab];
r = jo({cs_jo_arr: 'flat', cs_phase: '1', cs_volt: 230});
check('Table 30 (paper, in air), 285 A, In 315 A: three-phase flat uses the column of three cables (95 mm2: 345 A; 70 mm2 gives 280 A), trefoil 315 A at 95 mm2, single-phase two cables 355 A', [pAir, pTre, [r.mm2, r.tab]], [[95, 345, 315], [95, 315], [95, 355]]);
setv(w, 'cs_phase', '3'); setv(w, 'cs_volt', 400);
r = jo({cs_jo_arr: 'flat', cs_jo_sv: 'flat'});
check('unserved lead sheath, flat (Table 30): 95 mm2 factor 0.95 -> 345 x 0.95 = 327.75 A, still enough for 315 A', [r.mm2, r.kSv, +r.allowed.toFixed(2), r.svForm], [95, 0.95, 327.75, 'flat']);
r = jo({cs_jo_arr: 'trefoil', cs_jo_sv: 'flat'});
check('... in air the formation follows the arrangement: trefoil takes the trefoil factor 0.93 (copper) whatever the list says: 95 mm2 gives 315 x 0.93 = 292.95 A, not enough; 120 mm2 (370 x 0.93 = 344.1 A)', [r.mm2, r.kSv, +r.allowed.toFixed(2), r.svForm], [120, 0.93, 344.1, 'tre']);
r = jo({cs_jo: 'cu_pap1_clip', cs_jo_sv: 'tre', cs_jo_arr: 'flat', cs_load: 250});
check('clipped (Table 29) has no arrangement list: the unserved trefoil choice is used as set: 250 A, In 250 A, 70 mm2 (230 A) is short, 95 mm2 (285 x 0.93 = 265.05 A)', [r.mm2, r.kSv, +r.allowed.toFixed(2), r.ocpd], [95, 0.93, 265.05, 250]);
check('the lead-sheath factors: copper flat 50 - 185 mm2 0.95, 240 - 500 1.00, 630 - 1000 1.01; trefoil 0.93 / 0.94 / 0.96; aluminium trefoil 0.95 for 50 - 185 mm2', [w.eval("joSvFactor('cu', 'flat', 150)"), w.eval("joSvFactor('cu', 'flat', 300)"), w.eval("joSvFactor('cu', 'flat', 800)"), w.eval("joSvFactor('cu', 'tre', 150)"), w.eval("joSvFactor('cu', 'tre', 500)"), w.eval("joSvFactor('cu', 'tre', 1000)"), w.eval("joSvFactor('al', 'tre', 120)")], [0.95, 1, 1.01, 0.93, 0.94, 0.96, 0.95]);
r = jo({cs_jo: 'cu_papm_clip', cs_jo_sv: 'flat', cs_load: 150});
check('multi-core paper (Table 31) has no lead-sheath factor: the field is ignored; 150 A, In 160 A: 70 mm2 (180 A)', [r.svForm, r.kSv === undefined, r.mm2, r.tab], ['', true, 70, 180]);
setv(w, 'cs_jo', 'cu_pap1_clip'); w.csToggle();
const svShown = doc.querySelector('.cs-josv').style.display;
setv(w, 'cs_jo', 'cu_xlpea_clip'); w.csToggle();
const svHidden = doc.querySelector('.cs-josv').style.display;
setv(w, 'cs_jo', 'cu_pap1_air'); w.csToggle();
check('the lead-sheath field shows for Tables 29 / 30 / 56 / 57 only; the arrangement list for single-core cables in air', [svShown, svHidden, doc.querySelector('.cs-joair').style.display, doc.querySelector('.cs-josv').style.display], ['', 'none', '', '']);
setv(w, 'cs_metal', 'al'); w.csToggle('metal');
r = jo({cs_metal: 'al', cs_jo: 'al_papm_air', cs_load: 280, cs_amb: 30});
check('aluminium paper multi-core in air (Table 59), 280 A, In 315 A: 150 mm2 (265 A) is short, the empty three-phase cells at 185 and 240 mm2 are skipped and 300 mm2 (420 A) is chosen', [r.mm2, r.tab], [300, 420]);
r = jo({cs_metal: 'al', cs_jo: 'al_pap1_clip', cs_load: 300, cs_amb: 40});
check('aluminium Table 56 at 40 C (0.89): 300 A, In 315 A: 185 mm2 (345 x 0.89 = 307.1 A) is short; 240 mm2 is empty for two cables but three-phase 430 x 0.89 = 382.7 A is used', [r.mm2, r.tab, +r.kT.toFixed(2)], [240, 430, 0.89]);
setv(w, 'cs_metal', 'cu'); w.csToggle('metal');
setv(w, 'cs_jo', 'cu_pap1_air'); setv(w, 'cs_amb', 40); setv(w, 'cs_mode', 'amp'); setv(w, 'cs_load', 285); setv(w, 'cs_len', 1); setv(w, 'cs_vdlim', 10); setv(w, 'cs_jo_sv', 'flat'); w.calcResult('cablesizing');
const t76 = doc.getElementById('cs_results').textContent;
check('the results quote the table, the lead-sheath factor and the printed-misprint notes', ['جدول 30', 'قراب رصاصي غير مخدوم', '275 A', '🔴'].every(s => t76.includes(s)), true);
}
// ---------- part 77: Jordanian electrical installations code, mineral-insulated cable tables (36 - 43, 45, 46, 60, 61) and flexible cables and cords (33 - 35) in the cable sizing calculator ----------
{
w = boot('jo'); doc = w.document; w.renderCalc('cablesizing');
const J = w.eval('JSON.parse(JSON.stringify(JO_CABLE))');
const jo = vals => { Object.keys(vals).forEach(id => setv(w, id, vals[id])); w.csToggle(); return w.eval('calcCableSizing()'); };
const mi = (vals, mc, mt) => { jo(vals); if (mc) setv(w, 'cs_jo_mc', mc); if (mt) setv(w, 'cs_jo_mt', mt); w.csToggle(); return w.eval('calcCableSizing()'); };
const base = {cs_std: 'jo', cs_phase: '3', cs_volt: 400, cs_mode: 'amp', cs_load: 100, cs_pf: 0.85, cs_len: 1, cs_amb: 30, cs_ngroup: 1, cs_par: 1, cs_metal: 'cu', cs_vdlim: 10, cs_jo_arr: 'flat', cs_jo_c: 'no', cs_jo_sv: 'no', cs_jo_trench: 'no'};
const fam = k => Object.keys(J).filter(x => J[x].m === k).length;
const miIds = Object.keys(J).filter(k => J[k].mi);
check('15 more copper families: 12 mineral-insulated tables (36 - 43, 45, 46, 60, 61) and 3 flexible (33 - 35): 32 copper and 13 aluminium', [miIds.length, fam('cu'), fam('al')], [15, 32, 13]);
jo(base);
check('the copper list offers 32 tables in 6 insulation groups; aluminium 13 in 3 groups', [doc.getElementById('cs_jo').options.length, doc.querySelectorAll('#cs_jo optgroup').length, (setv(w, 'cs_metal', 'al'), w.csToggle('metal'), doc.getElementById('cs_jo').options.length), doc.querySelectorAll('#cs_jo optgroup').length], [32, 6, 13, 3]);
setv(w, 'cs_metal', 'cu'); w.csToggle('metal');
check('as printed: Table 36 1.0 mm2 (22 A 42 mV, 18 A 36, twin 17 A 42), Table 37 4 mm2 (33 A, 9.0 mV for three-core and four-core), Table 38 10 mm2 (98 A, 4.5, 3.9), Table 39 1.0 mm2 (18 A, 39; 13 A, 45, 39)', [J.cu_mi36.rows['1'], J.cu_mi37.rows['4'], J.cu_mi38.rows['10'], J.cu_mi39.rows['1']], [[22, 42, 18, 36, 17, 42], [33, 9, 33, 9, null, null, null], [98, 4.5, 3.9, null, null, null, null], [18, 39, 13, 45, 39]]);
check('Table 40 150 mm2 (440 A 0.28 mV, 385 A 0.24; no twin cable), Table 41 25 mm2 (105 A, 1.4; 110 A, 1.4), Table 43 25 mm2 (130 A, 1.5), Table 45 10 mm2 (76 A, 4.2; 64 A, 3.6)', [J.cu_mi40.rows['150'], J.cu_mi41.rows['25'], J.cu_mi43.rows['25'], J.cu_mi45.rows['10']], [[440, 0.28, 385, 0.24, null, null], [105, 1.4, 110, 1.4, null, null, null], [130, 1.5, null, null, null], [76, 4.2, 64, 3.6]]);
check('Table 42 (read from the page image) 1.0 mm2 (29 A, 45 and 39 mV, twin 23 A, 45, three-core 19 A, 39) and 150 mm2 (540 A, 0.30, 0.26); Tables 60 150 mm2 (410 A 0.45, 360 A 0.39) and 61 25 mm2 (115, 95, trefoil 99)', [J.cu_mi42.rows['1'], J.cu_mi42.rows['150'], J.cu_mi60.rows['150'], J.cu_mi61.rows['25']], [[29, 45, 39, 23, 45, 19, 39], [540, 0.3, 0.26, null, null, null, null], [410, 0.45, 360, 0.39], [115, 2.7, 95, 2.4, 99, 2.4]]);
check('Table 46: the seven-core single-phase drop printed 24 at 1.0 mm2 is replaced by 42 (as Tables 37 and 41) and the four-core 28 A at 4.0 mm2 (below 29 A at 2.5 mm2) is left empty', [J.cu_mi46.rows['1'], J.cu_mi46.rows['4'][0]], [[17, 36, 12, 42, 36], null]);
check('flexible: Table 33 4 mm2 (33 A direct or single-phase, 28 A three-phase, 11.0 / 11.0 / 9.7 mV), Table 34 4 mm2 (40 A, 34 A, 13 / 13 / 11.5) and 630 mm2 (830 A, no three-phase, 0.08 / 0.19), Table 35 cords 4 mm2 (25 A, 11 and 9.6 mV)', [J.cu_fx33.rows['4'], J.cu_fx34.rows['4'], J.cu_fx34.rows['630'], J.cu_fx35.rows['4']], [[33, 28, 11, 11, 9.7], [40, 34, 13, 13, 11.5], [830, null, 0.08, 0.19, null], [25, 11, 9.6]]);
let bad = [];
for (const id of miIds) {
  const f = J[id], sizes = Object.keys(f.rows).map(Number).sort((a, b) => a - b);
  for (const g of f.g) for (const [c, up] of [[g.i, true], [g.v, false]]) { let p = null; for (const s of sizes) { const x = f.rows[s][c]; if (x == null) continue; if (p != null && (up ? x <= p : x > p)) bad.push(id + ' ' + g.k + ' col' + c + ' ' + s); p = x; } }
}
check('the 15 tables: for every circuit the current rises and the voltage drop falls with the conductor size (a typing check on the transcription)', bad, []);
check('ambient: mineral-insulated exposed 30 C -> 1, 35 C -> 0.85 (next printed 40), 61 C -> not tabulated; PVC-covered 30 C -> 1.1; bare 105 C terminal 28 C -> 1.0, 100 C -> 0.24, 135 C terminal 30 C -> 1.08 and 130 C -> 0.24', [w.eval("joAmbFactor('mit', 30)"), w.eval("joAmbFactor('mit', 35)"), w.eval("joAmbFactor('mit', 61)"), w.eval("joAmbFactor('mip', 30)"), w.eval("joAmbFactor('m105', 28)"), w.eval("joAmbFactor('m105', 100)"), w.eval("joAmbFactor('m135', 30)"), w.eval("joAmbFactor('m135', 130)")], [1, 0.85, null, 1.1, 1, 0.24, 1.08, 0.24]);
check('ambient: flexible rubber 60 C 28 -> 1, 35 -> 0.91, 56 -> not tabulated; rubber 85 C 32 -> 0.93, 70 -> 0.31; rubber 150 C 90 -> 1, 120 -> 0.57, 121 -> not tabulated; cords: 60 C type 30 -> 1, 36 -> 0.92; 85 C type 45 -> 1, 60 -> 0.83; glass fibre 160 -> 0.82', [w.eval("joAmbFactor('fx60', 28)"), w.eval("joAmbFactor('fx60', 35)"), w.eval("joAmbFactor('fx60', 56)"), w.eval("joAmbFactor('fx85', 32)"), w.eval("joAmbFactor('fx85', 70)"), w.eval("joAmbFactor('fx150', 90)"), w.eval("joAmbFactor('fx150', 120)"), w.eval("joAmbFactor('fx150', 121)"), w.eval("joAmbFactor('cd60', 30)"), w.eval("joAmbFactor('cd60', 36)"), w.eval("joAmbFactor('cd85', 45)"), w.eval("joAmbFactor('cd85', 60)"), w.eval("joAmbFactor('cdgf', 160)")], [1, 0.91, null, 0.93, 0.31, 1, 0.57, null, 1, 0.92, 1, 0.83, 0.82]);
check('the existing sets are untouched by the new lookup: PVC 28 -> 1, 20 -> 1.06, 66 -> not tabulated; XLPE 66 -> 0.58', [w.eval("joAmbFactor('pvc', 28)"), w.eval("joAmbFactor('pvc', 20)"), w.eval("joAmbFactor('pvc', 66)"), w.eval("joAmbFactor('xlpe', 66)")], [1, 1.06, null, 0.58]);
let r = mi(Object.assign({}, base, {cs_jo: 'cu_mi36', cs_phase: '1', cs_volt: 230, cs_load: 25, cs_amb: 40}));
const touch = [r.mm2, r.tab, r.kT, r.joMg.k];
r = mi({}, 'sc2', 'pvc');
check('Table 36, single-phase 25 A (In 25 A) at 40 C, two single-core cables: exposed to touch 0.85 -> 2.5 mm2 (36 A); PVC-covered 0.94 -> 1.5 mm2 (27 x 0.94 = 25.4 A)', [touch, [r.mm2, r.tab, r.kT]], [[2.5, 36, 0.85, 'sc2'], [1.5, 27, 0.94]]);
r = mi(Object.assign({}, base, {cs_jo: 'cu_mi36', cs_phase: '3', cs_volt: 400, cs_load: 30, cs_amb: 30}), 'sc34', 'touch');
check('Table 36, three-phase 30 A (In 32 A): three single-core cables 4 mm2 (41 A, 9.0 mV: 0.27 V); the twin cable is not offered for three-phase', [r.mm2, r.tab, +r.dV.toFixed(2), [...doc.getElementById('cs_jo_mc').options].map(o => o.value)], [4, 41, 0.27, ['sc34']]);
setv(w, 'cs_phase', '1'); setv(w, 'cs_volt', 230); w.csToggle('phase');
check('... single-phase offers two single-core cables and one twin cable', [...doc.getElementById('cs_jo_mc').options].map(o => o.value), ['sc2', 'tw']);
setv(w, 'cs_phase', '3'); setv(w, 'cs_volt', 400); w.csToggle('phase');
r = mi(Object.assign({}, base, {cs_jo: 'cu_mi37', cs_load: 15}), 'c7b', 'touch');
const c7b = [r.mm2, r.tab, +r.dV.toFixed(3), r.ocpd];
const opts3 = [...doc.getElementById('cs_jo_mc').options].map(o => o.value);
r = mi({cs_phase: '1', cs_volt: 230}, 'c7a');
check('Table 37, 15 A (In 16 A): the seven-core cable (all conductors loaded) 2.5 mm2 (17 A): three-phase 14 mV (0.21 V), single-phase 17 mV (0.255 V); three-phase offers three-core, four-core and seven-core', [c7b, [r.mm2, r.tab, +r.dV.toFixed(3)], opts3], [[2.5, 17, 0.21, 16], [2.5, 17, 0.255], ['c3', 'c4', 'c7b']]);
setv(w, 'cs_phase', '3'); setv(w, 'cs_volt', 400);
r = mi(Object.assign({}, base, {cs_jo: 'cu_mi38', cs_load: 40, cs_amb: 40, cs_phase: '3', cs_volt: 400}), 'sc34', '105');
const b105 = [r.mm2, r.tab, r.kT, +r.dV.toFixed(2), r.kG];
r = mi({}, 'sc34', '135');
const b135 = [r.mm2, r.kT];
r = mi({cs_load: 30}, 'c3', '105');
const c3a = [r.mm2, r.tab];
r = mi({cs_load: 40}, 'c3', '105');
check('Table 38 (bare, 105 C terminal), 40 A at 40 C: three single-core cables share the single-core current: 2.5 mm2 (43 A x 0.96, 15 mV = 0.6 V), 135 C terminal 1.04, no grouping factor; the three-core cable carries 30 A on 4 mm2 (40 A x 0.96) and 40 A is beyond its table (6 mm2 is empty): no size, with a warning', [b105, b135, c3a, !!r.chosen, r.warnings.length > 0], [[2.5, 43, 0.96, 0.6, 1], [2.5, 1.04], [4, 40], false, true]);
r = mi(Object.assign({}, base, {cs_jo: 'cu_mi38', cs_phase: '1', cs_volt: 230, cs_load: 40, cs_ngroup: 6}), 'sc2', '105');
check('... single-phase two single-core cables: same 43 A at 2.5 mm2 with 18 mV; six circuits give no reduction in a bare-sheath table', [r.mm2, r.tab, +r.dV.toFixed(2), r.kG], [2.5, 43, 0.72, 1]);
r = mi(Object.assign({}, base, {cs_jo: 'cu_mi42', cs_phase: '3', cs_volt: 400, cs_load: 100, cs_ngroup: 1}), 'sc34', '105');
check('Table 42 (heavy duty, bare), 100 A three-phase: 10 mm2 (105 A, 3.9 mV = 0.39 V); the 135 C terminal at 30 C gives 1.08', [r.mm2, r.tab, +r.dV.toFixed(2), mi({}, 'sc34', '135').kT], [10, 105, 0.39, 1.08]);
r = mi(Object.assign({}, base, {cs_jo: 'cu_mi60', cs_load: 100}), 'sc34');
check('Table 60 (aluminium sheath, single-core), 100 A three-phase: 25 mm2 (115 A, 2.4 mV); there is no condition list for this table', [r.mm2, r.tab, +r.dV.toFixed(3), doc.querySelector('.cs-jomt').style.display], [25, 115, 0.24, 'none']);
r = mi(Object.assign({}, base, {cs_jo: 'cu_mi61', cs_load: 80}), 'sct');
const tre = [r.mm2, r.tab];
r = mi({}, 'sc34');
const flat3 = [r.mm2, r.tab];
r = mi({cs_phase: '1', cs_volt: 230}, 'sc2');
check('Table 61, 80 A (In 80 A): trefoil 25 mm2 (99 A), flat three-phase 25 mm2 (95 A), single-phase two cables 16 mm2 (86 A)', [tre, flat3, [r.mm2, r.tab]], [[25, 99], [25, 95], [16, 86]]);
setv(w, 'cs_phase', '3'); setv(w, 'cs_volt', 400);
r = mi(Object.assign({}, base, {cs_jo: 'cu_fx33', cs_phase: '1', cs_volt: 230, cs_load: 30, cs_len: 20}), 'fx1');
const f33 = [r.mm2, r.tab, +r.dV.toFixed(1)];
r = mi({}, 'fxdc');
check('Table 33 flexible rubber 60 C, 30 A (In 32 A), 20 m: 4 mm2 (33 A) with 11 mV: 6.6 V a.c. or direct (11.000 mV)', [f33, [r.mm2, r.tab, +r.dV.toFixed(1)]], [[4, 33, 6.6], [4, 33, 6.6]]);
r = mi(Object.assign({}, base, {cs_jo: 'cu_fx34', cs_phase: '3', cs_volt: 400, cs_load: 30, cs_len: 1, cs_amb: 30}), 'fx3', '85');
const f34 = [r.mm2, r.tab, +r.dV.toFixed(3)];
r = mi({cs_amb: 100}, 'fx3', '150');
const f150 = [r.mm2, r.tab, r.kT];
r = mi({cs_amb: 125}, 'fx3', '150');
check('Table 34 three-phase 30 A (In 32 A): 4 mm2 (34 A, 11.5 mV); at 100 C with the rubber 150 C factor 0.94: 6 mm2 (44 A); at 125 C the factor is not used (printed row out of order): the calculation stops with a warning naming 120 C', [f34, f150, r.invalid === true, r.warnings.some(x => x.includes('120'))], [[4, 34, 0.345], [6, 44, 0.94], true, true]);
r = mi(Object.assign({}, base, {cs_jo: 'cu_fx35', cs_phase: '1', cs_volt: 230, cs_load: 13}), 'cd1', '60');
const cd1 = [r.mm2, r.tab, +r.dV.toFixed(3), r.kG];
r = mi(Object.assign({}, base, {cs_jo: 'cu_fx35', cs_phase: '3', cs_volt: 400, cs_load: 13, cs_ngroup: 4}), 'cd3', '60');
const cd3 = [r.mm2, +r.dV.toFixed(3)];
r = mi(Object.assign({}, base, {cs_jo: 'cu_fx35', cs_load: 10, cs_amb: 60}), 'cd3', '85');
const cd85 = [r.mm2, r.tab, r.kT];
r = mi({}, 'cd3', '60');
check('Table 35 cords: single-phase 13 A: 1.25 mm2 (13 A, 35 mV = 0.455 V); three-phase 29 mV (0.377 V) and no grouping factor; at 60 C the 85 C type (0.83) takes 10 A on 1.25 mm2 (10.8 A) while the 60 C type has no factor at 60 C', [cd1, cd3, cd85, r.invalid === true, doc.getElementById('cs_jo_mt').options.length], [[1.25, 13, 0.455, 1], [1.25, 0.377], [1.25, 13, 0.83], true, 4]);
mi(Object.assign({}, base, {cs_jo: 'cu_mi36'}));
const sh36 = [doc.querySelector('.cs-jomc').style.display, doc.querySelector('.cs-jomt').style.display];
mi({cs_jo: 'cu_mi45'});
const sh45 = [doc.querySelector('.cs-jomc').style.display, doc.querySelector('.cs-jomt').style.display];
mi({cs_jo: 'cu_pvc1_clip'});
const shPlain = [doc.querySelector('.cs-jomc').style.display, doc.querySelector('.cs-jomt').style.display, doc.getElementById('cs_jo_mc').options.length];
check('the circuit list shows for the mineral-insulated and flexible tables, the condition list only where the table has more than one set (Table 45 has none), neither for ordinary cables', [sh36, sh45, shPlain], [['', ''], ['', 'none'], ['none', 'none', 0]]);
mi({cs_jo: 'cu_mi37', cs_load: 15, cs_phase: '3'}, 'c7b', 'touch'); w.calcResult('cablesizing');
const t77 = doc.getElementById('cs_results').textContent;
check('the results name the circuit, the table and the printed notes', ['الدارة:', 'جدول 37', 'سباعي القلب', 'لا تحدد الكودة طريقة التمديد', '🔴'].every(s => t77.includes(s)), true);
check('the earlier tables still choose as before: Table 24 55 kW 400 V 80 m 40 C -> 35 mm2 (153 A, 0.91)', (() => { const x = jo(Object.assign({}, base, {cs_jo: 'cu_xlpea_clip', cs_mode: 'kw', cs_load: 55, cs_len: 80, cs_amb: 40, cs_vdlim: 2.5})); return [x.mm2, x.tab, x.kT]; })(), [35, 153, 0.91]);
}
// ---------- part 78: Jordanian natural ventilation code, Appendix B and Figure 2: ventilation needed to avoid surface condensation (`natvent`) ----------
{
w = boot('jo'); doc = w.document; w.renderCalc('natvent');
const cc = o => w.eval('joCondCalc(' + JSON.stringify(Object.assign({te: 0, rh: 90, ti: 20, u: 2, rsi: 0.12, g: 0}, o)) + ')');
check('saturation vapour pressure by the Magnus equation: 611 Pa at 0 C, 2339 Pa at 20 C, 1704 Pa at 15 C (within 0.3 %)', [w.eval('joCondPsat(0)') / 611.2, w.eval('joCondPsat(20)') / 2339, w.eval('joCondPsat(15)') / 1705.6].map(x => +x.toFixed(3)).map(x => Math.abs(x - 1) < 0.003), [true, true, true]);
let c = cc({});
check('inner surface temperature of a U = 2.0 wall, R_si 0.12, 20 C inside and 0 C outside: 20 - 2.0 x 0.12 x 20 = 15.2 C', c.Ts, 15.2, 1e-9);
check('the outdoor vapour content at 0 C and 90 % is 4.36 g/m3 and the limit at the 15.2 C surface is 12.96 g/m3: 1 / (0.012954 - 0.004362) = 116 m3 of outdoor air per kg of moisture', [+(c.rhoE * 1000).toFixed(2), +(c.rhoMax * 1000).toFixed(2), Math.round(c.vPerKg)], [4.36, 12.96, 116], 0.6);
check('the maximum indoor relative humidity without condensation is psat(15.2) / psat(20) = 73.7 %', c.rhMax, 73.7, 0.3);
check('a better wall (U 0.5) has an 18.8 C surface and needs 85 m3 of outdoor air per kg; a worse one (U 4) with a 10.4 C surface needs 190', [+cc({u: 0.5}).Ts.toFixed(1), Math.round(cc({u: 0.5}).vPerKg), Math.round(cc({u: 4}).vPerKg), +cc({u: 4}).Ts.toFixed(1)], [18.8, 85, 190, 10.4], 1);
c = cc({g: 0.5});
check('0.5 kg/h of moisture needs 116 m3/kg x 0.5 = 58 m3/h = 16.2 L/s of outdoor air', [+(c.q * 3.6).toFixed(0), +c.q.toFixed(1)], [58, 16.2], 0.5);
c = cc({te: 10, rh: 100, ti: 12, u: 9});
check('saturated outdoor air at 10 C and a surface colder than 10 C (U 9 against a 12 C room) leave no margin: ventilation cannot prevent condensation', [c.possible, c.vPerKg], [false, null]);
check('a room colder than outdoors is flagged, not computed', cc({te: 15, ti: 10}).possible, false);
check('the results of the block are drawn in the page, with the printed Appendix B and the reading note', (() => { w.calcResult('natvent'); const t = doc.getElementById('nv_cd_res').textContent; return ['15.2', 'الملحق ب', '🔴'].every(x => t.includes(x)); })(), true);
setv(w, 'nv_cd_g', 0.5); setv(w, 'nv_cd_u', 2); w.calcResult('natvent');
check('with 0.5 kg/h the block quotes 16.2 L/s and 58 m3/h', [doc.getElementById('nv_cd_res').textContent.includes('16.2'), doc.getElementById('nv_cd_res').textContent.includes('58')], [true, true]);
}
// ---------- part 79: Jordanian scaffolding code, timber scaffolds (`scaffoldtimber`: chapter 2 and Tables 1 - 5) ----------
{
w = boot('jo'); doc = w.document;
const tc = o => w.eval('joTsCalc(' + JSON.stringify(Object.assign({type: 'sm18', H: 12, len: 12, q: 2.4, post: [100, 100], bay: 2.4, bayT: 0, width: 1.5, joist: [250, 50], joSp: 2.4, ledger: [250, 50], vert: 2.1, hb: [150, 25], db: [100, 25], tie: [100, 25], board: [250, 50], toe: 150, rail: [100, 50], tieSp: 6, over: 100,
  beam: null, beamSp: 0, proj: 0, inner: 0, bearer: null, wallGap: 0, railPost: null, nPlat: 1}, o)) + ')');
const bad = r => r.rows.filter(x => !x.ok).map(x => x.id);
check('ten timber scaffold classes: single (Tables 1 - 3, four classes), independent (Table 4, four) and extended supports (Table 5, two)', [Object.keys(w.eval('JO_TS')).length, Object.keys(w.eval('JO_TS')).filter(k => w.eval('JO_TS.' + k + '.ext')).length], [10, 2]);
check('a section is parsed as 100x50, 100 x 50 or 100×50 in any order and compared by the larger and the smaller side: 50 x 250 meets 250 x 50 but 200 x 50 does not', [w.eval("joTsSec('100x50')"), w.eval("joTsSec('250 × 75')"), w.eval("joTsSec('abc')"), w.eval('joTsGe([50, 250], [[250, 50]])'), w.eval('joTsGe([200, 50], [[250, 50]])'), w.eval('joTsGe([125, 75], [[250, 50], [125, 75]])')], [[100, 50], [250, 75], null, true, false, true]);
let r = tc({});
check('Table 2 medium single scaffold at its limits (12 m, 2.4 kN/m2, 100 x 100 posts at 2.4 m, 250 x 50 joists at 2.4 m, ledgers 2.1 m apart, braces 150 x 25 and 100 x 25, ties 100 x 25): every check passes', [r.ok, r.rows.length], [true, 17]);
r = tc({H: 20, q: 3, post: [100, 50], bay: 3, vert: 2.4, hb: [100, 25], toe: 100});
check('20 m (limit 18), 3.0 kN/m2 (limit 2.4), posts 100 x 50, bay 3.0 m, ledgers 2.4 m apart, horizontal brace 100 x 25 and toe board 100 mm all fail', bad(r), ['h', 'q', 'post', 'bay', 'vert', 'hb', 'toe']);
r = tc({type: 'sl6', H: 6, q: 1.2, post: [100, 50], bay: 1.8, width: 0.9, joist: [100, 50], ledger: [100, 25], vert: 2.1, hb: [100, 25], tie: [100, 25], board: [230, 40], joSp: 0});
check('Table 1 light single scaffold up to 6 m: 100 x 50 posts at 1.8 m, 0.9 m wide platform with 100 x 50 joists (150 x 50 for 1.5 m), ledgers 100 x 25, boards 230 x 40, ledgers 2.1 m apart: passes; at 7 m the 6 m class fails', [r.ok, bad(tc({type: 'sl6', H: 7, q: 1.2, post: [100, 50], bay: 1.8, width: 0.9, joist: [100, 50], ledger: [100, 25], vert: 2.1, hb: [100, 25], tie: [100, 25], board: [230, 40], joSp: 0}))], [true, ['h']]);
r = tc({type: 'sl6', H: 6, q: 1.2, post: [100, 50], bay: 1.8, width: 1.5, joist: [100, 50], ledger: [100, 25], vert: 2.1, hb: [100, 25], tie: [100, 25], board: [230, 40], joSp: 0});
check('... a 1.5 m wide platform needs 150 x 50 joists: 100 x 50 fails only that row', bad(r), ['jo']);
r = tc({type: 'sh18', H: 18, q: 3.6, post: [150, 100], bay: 1.8, joist: [125, 75], joSp: 1.8, ledger: [250, 50], vert: 1.95, hb: [100, 50], db: [100, 50], tie: [100, 50], board: [250, 50]});
check('Table 3 heavy single scaffold at its limits (3.6 kN/m2, 150 x 100 posts, joists 250 x 50 or 125 x 75 at 1.8 m, ledgers 1.95 m apart, braces and ties 100 x 50): passes; ties 100 x 25 fail', [r.ok, bad(tc({type: 'sh18', H: 18, q: 3.6, post: [150, 100], bay: 1.8, joist: [125, 75], joSp: 1.8, ledger: [250, 50], vert: 1.95, hb: [100, 50], db: [100, 50], tie: [100, 25], board: [250, 50]}))], [true, ['tie']]);
r = tc({type: 'il18', H: 18, q: 1.2, post: [100, 100], bay: 3, bayT: 3, width: 3, joist: [250, 50], ledger: [225, 32], vert: 2.1, hb: [100, 25], db: [100, 25], tie: [100, 25], board: [250, 50], joSp: 0});
check('Table 4 light independent scaffold up to 18 m: posts 100 x 100 at 3.0 x 3.0 m, ledgers 225 x 32, a 3.0 m platform with 250 x 50 joists, boards 250 x 50, ledgers 2.1 m apart: passes; 3.5 m of width fails', [r.ok, bad(tc({type: 'il18', H: 18, q: 1.2, post: [100, 100], bay: 3, bayT: 3, width: 3.5, joist: [250, 50], ledger: [225, 32], vert: 2.1, hb: [100, 25], db: [100, 25], tie: [100, 25], board: [250, 50], joSp: 0}))], [true, ['w']]);
check('Table 4 medium: the horizontal brace may be 150 x 25 or 100 x 32; heavy needs 100 x 50 braces and 100 x 25 ties', [bad(tc({type: 'im18', hb: [100, 32], bayT: 2.4, vert: 1.8, bay: 2.4, joSp: 0})), bad(tc({type: 'ih18', q: 3.6, hb: [100, 25], db: [100, 25], bayT: 2.4, vert: 1.8, bay: 2.4, joSp: 0}))], [[], ['hb', 'db']]);
r = tc({type: 'el', q: 1.2, beam: [250, 50], beamSp: 3, proj: 1.8, inner: 2.7, bearer: [150, 150], board: [250, 50], wallGap: 75, rail: [100, 50], railPost: [100, 50], toe: 150, nPlat: 1});
check('Table 5 light extended-support scaffold at its limits (250 x 50 beams 3.0 m apart, 1.8 m projection with 2.7 m inside = 1.5 times, 150 x 150 bearer, boards within 75 mm of the wall, one platform): passes', [r.ok, r.rows.length], [true, 12]);
r = tc({type: 'em', q: 2.4, beam: [250, 50], beamSp: 3, proj: 2, inner: 2.4, bearer: [100, 100], board: [250, 50], wallGap: 100, rail: [100, 50], railPost: [100, 50], toe: 100, nPlat: 2});
check('medium class with a 250 x 50 beam at 3.0 m, 2.0 m projection with 2.4 m inside (1.2 times), a 100 x 100 bearer, boards 100 mm from the wall, a 100 mm toe board and two platforms: every one of them fails', bad(r), ['beam', 'bsp', 'proj', 'inn', 'bear', 'gap', 'toe', 'np']);
r = tc({H: 12, len: 12, tieSp: 9});
const t75 = [bad(r), bad(tc({H: 6, len: 6, tieSp: 9})), bad(tc({H: 12, over: 50}))];
check('2/1/6: above 7.5 m of height or length ties must be at most 7.5 m apart (9 m fails; a 6 m scaffold is not checked); 2/1/8: joists project 75 mm beyond both sides (50 fails)', t75, [['tsp'], [], ['ovr']]);
w.renderCalc('scaffoldtimber'); w.calcResult('scaffoldtimber');
const txt = doc.getElementById('sct_results').textContent;
check('the page lists the checks, quotes the class name and the drawn-glyph reading note; the default medium scaffold passes', [txt.includes('الجدول 2'), txt.includes('🔴'), txt.includes('يحقق')], [true, true, true]);
check('other codes open the calculator too', ['intl', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('scaffoldtimber'); x.calcResult('scaffoldtimber'); return x.document.getElementById('sct_results').textContent.length > 300; }).join(), 'true,true,true');
}
check('no page errors', errors, []);
console.log(fail ? '\n' + fail + ' FAILED' : '\nAll national-code (Jordan, part 4) checks passed');
process.exit(fail ? 1 : 0);
