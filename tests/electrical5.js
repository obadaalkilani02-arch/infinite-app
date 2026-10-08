// Electrical, part 5: cable trays and ladders (SBC 401 Tables B.52-10 .. B.52-13, B.52-20, B.52-21), standby generator and UPS (Schneider chapter N,
// NEC Articles 445 / 700), neutral load and multiconductor cables.
//   node tests/electrical5.js
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
  const ok = typeof want === 'number' ? Math.abs(got - want) <= (tol ?? 0.01) : JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
}
const doc = w.document;
const setv = (id, v) => { doc.getElementById(id).value = String(v); };
const text = id => doc.getElementById(id).textContent;

// ---------- cable trays and ladders: methods E, F, G ----------
const efg = w.eval('IEC_EFG');
check('Tables B.52-10..13 have 19 / 18 / 19 / 18 rows', [Object.keys(efg.pvc.Cu).length, Object.keys(efg.pvc.Al).length, Object.keys(efg.xlpe.Cu).length, Object.keys(efg.xlpe.Al).length], [19, 18, 19, 18]);
check('B.52-10 PVC Cu 25 mm2: E 101 A (3 loaded), F trefoil 110, F flat 114, G 146 / 130', efg.pvc.Cu['25'], [119, 101, 131, 110, 114, 146, 130]);
check('B.52-12 XLPE Cu 95 mm2', efg.xlpe.Cu['95'], [352, 298, 377, 328, 342, 430, 389]);
check('B.52-13 XLPE Al 240 mm2', efg.xlpe.Al['240'], [470, 409, 530, 471, 492, 611, 561]);
check('B.52-11 PVC Al 630 mm2 has no multi-core value, single-core 808 / 711 / 746 / 900 / 852', efg.pvc.Al['630'], [null, null, 808, 711, 746, 900, 852]);
check('single-core columns start at 25 mm2; multi-core Cu from 1.5 mm2 (XLPE 26 / 23 A)', [efg.xlpe.Cu['16'][2], efg.xlpe.Cu['1.5']], [null, [26, 23, null, null, null, null, null]]);
check('every tabulated rating grows with the cross-section (E 3 loaded, XLPE Cu)', (() => { const k = Object.keys(efg.xlpe.Cu).map(Number).sort((a, b) => a - b).map(s => efg.xlpe.Cu[s][1]).filter(x => x != null); return k.every((x, i) => i === 0 || x > k[i - 1]); })(), true);
check('method columns: E 3 loaded = 1, trefoil = 3, flat = 4, G horizontal / vertical = 5 / 6, two loaded E = 0 or F touching = 2',
  [w.iecEfgCol('E', 3), w.iecEfgCol('F1', 3), w.iecEfgCol('F2', 3), w.iecEfgCol('G1', 3), w.iecEfgCol('G2', 3), w.iecEfgCol('E', 1), w.iecEfgCol('F1', 1), w.iecEfgCol('G1', 1)], [1, 3, 4, 5, 6, 0, 2, 2]);

// grouping, Table B.52-20 (multi-core, method E)
const gf = (m, sup, sp, trays, n) => w.iecTrayFactor(m, sup, sp, trays, n);
check('B.52-20 perforated tray touching: 1 / 2 / 3 / 4 / 6 / 9 cables on one tray', [1, 2, 3, 4, 6, 9].map(n => gf('E', 'perf', 'touch', 1, n).k), [1.00, 0.88, 0.82, 0.79, 0.76, 0.73]);
check('... 5 cables use the next larger column (6): 0.76', gf('E', 'perf', 'touch', 1, 5).k, 0.76);
check('... 2 trays x 4 cables 0.77, 3 trays x 6 cables 0.71, 6 trays x 9 cables 0.64; 4 trays use the 6-tray row', [gf('E', 'perf', 'touch', 2, 4).k, gf('E', 'perf', 'touch', 3, 6).k, gf('E', 'perf', 'touch', 6, 9).k, gf('E', 'perf', 'touch', 4, 1).trays], [0.77, 0.71, 0.64, 6]);
check('... more than 9 cables: the last column is used with a warning', [gf('E', 'perf', 'touch', 1, 12).k, gf('E', 'perf', 'touch', 1, 12).warn], [0.73, ['cols']]);
check('perforated, spaced by De: 1 tray 3 cables 0.98; 2 trays 6 cables 0.87', [gf('E', 'perf', 'spaced', 1, 3).k, gf('E', 'perf', 'spaced', 2, 6).k], [0.98, 0.87]);
check('... 9 cables spaced is not tabulated: the touching value 0.73 with a note', [gf('E', 'perf', 'spaced', 1, 9).k, gf('E', 'perf', 'spaced', 1, 9).warn], [0.73, ['notab']]);
check('vertical perforated: touching 2 trays x 3 cables 0.81, spaced 1 tray x 3 cables 0.89', [gf('E', 'vperf', 'touch', 2, 3).k, gf('E', 'vperf', 'spaced', 1, 3).k], [0.81, 0.89]);
check('unperforated trays (touching only): 1 tray 1 cable 0.97, 6 trays 9 cables 0.58', [gf('E', 'unperf', 'touch', 1, 1).k, gf('E', 'unperf', 'spaced', 6, 9).k], [0.97, 0.58]);
check('ladders / cleats: touching 1 tray 4 cables 0.80, 2 trays 9 cables 0.73; spaced 3 trays 6 cables 0.93', [gf('E', 'ladder', 'touch', 1, 4).k, gf('E', 'ladder', 'touch', 2, 9).k, gf('E', 'ladder', 'spaced', 3, 6).k], [0.80, 0.73, 0.93]);
// Table B.52-21 (single-core, methods F and G)
check('B.52-21 perforated tray, touching: 1 tray 1 / 2 / 3 circuits 0.98 / 0.91 / 0.87; 3 trays 3 circuits 0.78', [1, 2, 3].map(n => gf('F2', 'perf', 'touch', 1, n).k).concat(gf('F2', 'perf', 'touch', 3, 3).k), [0.98, 0.91, 0.87, 0.78]);
check('... ladder, touching: 2 trays x 2 circuits 0.93, 3 trays x 3 circuits 0.86', [gf('F2', 'ladder', 'touch', 2, 2).k, gf('F2', 'ladder', 'touch', 3, 3).k], [0.93, 0.86]);
check('... vertical perforated, touching: 1 tray x 2 circuits 0.86; 3 circuits is not tabulated: the last value 0.86 with a warning', [gf('F1', 'vperf', 'touch', 1, 2).k, gf('F1', 'vperf', 'touch', 1, 3).k, gf('F1', 'vperf', 'touch', 1, 3).warn.includes('cols')], [0.86, 0.86, true]);
check('... spaced horizontal (G): perforated 2 trays x 2 circuits 0.93; ladder (trefoil) 3 trays x 3 circuits 0.90', [gf('G1', 'perf', 'touch', 2, 2).k, gf('G1', 'ladder', 'touch', 3, 3).k], [0.93, 0.90]);
check('... vertical spacing (G2) is not tabulated: the horizontal row with a warning', [gf('G2', 'perf', 'touch', 1, 2).k, gf('G2', 'perf', 'touch', 1, 2).warn], [0.98, ['G2']]);
check('... more than 3 circuits per tray: the last column with a warning', [gf('F2', 'perf', 'touch', 1, 5).k, gf('F2', 'perf', 'touch', 1, 5).warn], [0.87, ['cols']]);

// cable sizing in IEC mode with the new methods
w.renderCalc('cablesizing');
Object.entries({cs_std: 'iec', cs_phase: '3', cs_volt: 400, cs_mode: 'amp', cs_load: 150, cs_len: 20, cs_amb: 30, cs_metal: 'cu', cs_ins: 'xlpe', cs_ngroup: 1, cs_pf: 0.9, cs_use: 'other'}).forEach(([k, x]) => setv(k, x));
setv('cs_method', 'E'); w.csToggle('std');
let cb = w.calcCableSizing();
check('150 A on a perforated tray (method E, XLPE Cu, 30 C): breaker 160 A, 50 mm2 (E 3 loaded 192 A; 35 mm2 gives 158 A < 160 A)', [cb.efg, cb.ocpd, cb.mm2, cb.tab, cb.kG], [true, 160, 50, 192, 1]);
check('... the layout field is hidden and the tray fields are shown', [doc.querySelector('.cs-air').style.display, doc.querySelector('.cs-tray').style.display, doc.querySelector('.cs-tspace').style.display], ['none', '', '']);
setv('cs_ngroup', 3); cb = w.calcCableSizing();
check('three circuits on the tray (0.82): 50 mm2 gives 157 A < 160 A, so 70 mm2', [cb.kG, cb.mm2], [0.82, 70]);
setv('cs_ntray', 2); setv('cs_support', 'ladder'); cb = w.calcCableSizing();
check('two ladders with three circuits each (0.80): 70 mm2 (246 x 0.8 = 197 A)', [cb.kG, cb.mm2], [0.80, 70]);
setv('cs_ngroup', 1); setv('cs_ntray', 1); setv('cs_support', 'perf');
setv('cs_amb', 40); cb = w.calcCableSizing();
check('ambient 40 C (0.91): 50 mm2 gives 175 A: still enough for 160 A', [cb.kT, cb.mm2, Math.round(cb.allowed)], [0.91, 50, 175]);
setv('cs_amb', 30);
setv('cs_method', 'F2'); w.csToggle(); cb = w.calcCableSizing();
check('single-core cables flat and touching (F): 3 loaded flat column, 35 mm2 (176 A)', [cb.mm2, cb.tab], [35, 176]);
check('... the spacing field belongs to method E only', doc.querySelector('.cs-tspace').style.display, 'none');
setv('cs_method', 'F1'); cb = w.calcCableSizing();
check('trefoil (F): 35 mm2 (169 A)', [cb.mm2, cb.tab], [35, 169]);
setv('cs_method', 'G1'); cb = w.calcCableSizing();
check('spaced horizontally (G): 25 mm2 (182 A)', [cb.mm2, cb.tab], [25, 182]);
setv('cs_method', 'G2'); cb = w.calcCableSizing();
check('spaced vertically (G): 25 mm2 (161 A >= 160 A), with the B.52-21 vertical-spacing note', [cb.mm2, cb.tab, cb.warnings.some(x => x.includes('B.52-21'))], [25, 161, true]);
setv('cs_method', 'E'); setv('cs_ins', 'pvc'); setv('cs_metal', 'al'); cb = w.calcCableSizing();
check('PVC aluminium (Table B.52-11), 150 A, 160 A breaker: 95 mm2 (E 3 loaded 183 A; 70 mm2 gives 150 A)', [cb.mm2, cb.tab], [95, 183]);
setv('cs_ins', 'xlpe'); setv('cs_metal', 'cu'); setv('cs_phase', '1'); setv('cs_volt', 230); setv('cs_load', 60); w.csToggle('phase'); cb = w.calcCableSizing();
check('single-phase 60 A, multi-core on a tray: the two-loaded column (XLPE Cu 6 mm2 = 63 A for a 63 A breaker)', [cb.ocpd, cb.mm2, cb.tab], [63, 6, 63]);
setv('cs_phase', '3'); setv('cs_volt', 400); setv('cs_load', 150);
setv('cs_par', 2); setv('cs_ngroup', 1); setv('cs_method', 'F2'); cb = w.calcCableSizing();
check('two parallel conductors per phase count as two circuits on the tray (note 6): column 2, factor 0.91', [cb.trayInfo.col, cb.kG], [2, 0.91]);
setv('cs_par', 1);
w.calcResult('cablesizing');
check('the results cite Table B.52-12 and the grouping Table B.52-21', text('cs_results').includes('B.52-12') && text('cs_results').includes('B.52-21'), true);
setv('cs_method', 'C'); w.csToggle(); cb = w.calcCableSizing();
check('method C is unchanged (grouping from B.52-17, tray fields hidden)', [cb.efg, doc.querySelector('.cs-tray').style.display, doc.querySelector('.cs-air').style.display], [false, 'none', '']);
check('method list offers E, F (two layouts) and G (two spacings)', ['E', 'F1', 'F2', 'G1', 'G2'].every(m => [...doc.getElementById('cs_method').options].some(o => o.value === m)), true);

// ---------- standby generator set (Schneider chapter N, NEC 445 / 700) ----------
w.renderCalc('genset');
const gset = o => Object.keys(o).forEach(k => setv(k, o[k]));
let gs = w.calcGenset();
check('defaults: 250 kW at cos 0.85 = 294 kVA, 250 / 0.8 = 312.5 kVA governs (the set is rated at cosphi 0.8) -> 315 kVA', [+gs.Sload.toFixed(1), gs.Seng, gs.Sreq, gs.std], [294.1, 312.5, 312.5, 315]);
check('... In = 315 / (sqrt3 x 0.4) = 455 A, conductors 115 % = 523 A (NEC 445.13)', [Math.round(gs.In), Math.round(gs.Icond)], [455, 523]);
check('... load factor 250 / 252 kW = 99 %', Math.round(gs.load), 99);
gset({gs_pf: 0.7}); gs = w.calcGenset();
check('a poor power factor (0.7): 250 / 0.7 = 357 kVA governs over the kW limit', [+gs.Sreq.toFixed(0), gs.std], [357, 400]);
gset({gs_pf: 0.85, gs_marg: 10}); gs = w.calcGenset();
check('a 10 % design margin: 312.5 x 1.1 = 343.75 -> 400 kVA', [gs.Sreq, gs.std], [343.75, 400]);
gset({gs_marg: 0, gs_sel: 250}); gs = w.calcGenset();
check('a chosen 250 kVA set (200 kW) is too small for 250 kW: warned (NEC 700.5(A))', [gs.ok, gs.warnings.length, gs.selGiven], [false, 1, true]);
// Fig N6: 500 kVA set, x'd = 30 %: 2.5 kA; insulation fault 3 kA (x'o = 8 %)
gset({gs_sel: 500, gs_xd1: 30, gs_xd2: 15, gs_xo: 8, gs_u: 400}); gs = w.calcGenset();
check('Fig N6: 500 kVA, x\'d 30 %: In = 722 A, transient short circuit 2.4 kA (the guide: about 2.5 kA)', [Math.round(gs.In), +(gs.Isc1 / 1000).toFixed(1)], [722, 2.4]);
check('... insulation fault U sqrt3 / (2X\'d + X\'o) = 3.2 kA (the guide: 3 kA)', +(gs.If / 1000).toFixed(1), 3.2);
check('... reactances: X\'d = 0.3 x 400^2 / 500000 = 0.096 ohm, X\'o = 0.0256', [+gs.Xd1.toFixed(4), +gs.Xo.toFixed(4)], [0.096, 0.0256]);
check('... sub-transient 100 / 15 = 6.7 In = 4.8 kA; steady 0.5 In', [+(gs.Isc2 / 1000).toFixed(1), Math.round(gs.IscSs)], [4.8, 361]);
// motor restart example (130 kVA ..., In 150 A, Isc 750 A)
check('guide example: Id 480 A, In 150 A, Isc 750 A -> 55 % drop (not tolerable)', w.gsDip(480, 150, 750), 55, 0.01);
check('guide example: Id 210 A -> 10 % (high but tolerable)', w.gsDip(210, 150, 750), 10, 0.01);
gset({gs_sel: 0, gs_xd1: 25, gs_p: 250, gs_pf: 0.85, gs_msum: 40, gs_mmax: 22, gs_k: 6, gs_ec: 0.8}); gs = w.calcGenset();
check('315 kVA set, 40 kW of motors: Im = 40000 / (sqrt3 x 400 x 0.8) = 72.2 A, Id = 433 A', [+gs.mot.Im.toFixed(1), Math.round(gs.mot.Id)], [72.2, 433]);
check('... drop (433 - 455 < 0): no sag from the starting current alone, so 0 or less', gs.mot.dip <= 0, true);
gset({gs_msum: 200, gs_mmax: 75}); gs = w.calcGenset();
check('200 kW of motors on 315 kVA: Id = 6 x 361 A = 2165 A, drop (2165 - 455) / (1820 - 455) = 125 %: bad', [Math.round(gs.mot.Id), Math.round(gs.mot.dip), gs.mot.verdict], [2165, 125, 'bad']);
check('... above a third of the generator kW: cascade restart; largest motor 75 kW below 84 kW: no soft starter', [gs.mot.cascade, gs.mot.softstart], [true, false]);
gset({gs_msum: 90, gs_mmax: 90}); gs = w.calcGenset();
check('a 90 kW motor above one third of 252 kW (84 kW): soft starter', [gs.mot.softstart, gs.mot.cascade], [true, true]);
gset({gs_msum: 20, gs_mmax: 11, gs_k: 6}); gs = w.calcGenset();
check('20 kW of motors (below a third): no restarting problem, drop under 10 %', [gs.mot.cascade, gs.mot.softstart, gs.mot.verdict], [false, false, 'ok']);
w.calcResult('genset');
check('generator results are rendered', text('gs_results').includes('445.13') && text('gs_results').includes('إقلاع المحركات'), true);
w.gsSend();
check('generator conductors sent to cable sizing (NEC, three-phase 400 V, 115 % of In, no extra 125 %)', [doc.getElementById('cs_std').value, doc.getElementById('cs_phase').value, +doc.getElementById('cs_volt').value, +doc.getElementById('cs_load').value, +doc.getElementById('cs_cont').value], ['nec', '3', 400, +(1.15 * 315000 / (Math.sqrt(3) * 400)).toFixed(2), 0], 0.01);

// ---------- UPS and its generator ----------
w.renderCalc('genset'); gset({gs_mode: 'ups'}); w.gsMode();
let up = w.calcGenset();
check('UPS: 100 kVA continuous, 120 kVA for up to 1 min? (default continuous peak): 120 kVA -> Fig N9 120 kVA', [up.mode, up.Preq, up.std], ['ups', 120, 120]);
gset({gs_ud: '1'}); up = w.calcGenset();
check('peak 120 kVA for under a minute (1.5 In overload): 80 kVA needed, but the 100 kVA continuous load governs -> 100 kVA', [up.Preq, up.std], [100, 100]);
gset({gs_ud: '10', gs_upk: 150}); up = w.calcGenset();
check('peak 150 kVA for under 10 min (1.25 In): 120 kVA -> 120 kVA unit', [up.Preq, up.std], [120, 120]);
check('Fig N9 100 kVA: mains 198 A with the charger, 151 A application', [w.eval('GS_UPS.find(r => r[0] === 100)')], [[100, 198, 151]]);
check('Fig N9 has 13 ratings 40 ... 800 kVA', [w.eval('GS_UPS.length'), w.eval('GS_UPS[0][0]'), w.eval('GS_UPS[12][0]')], [13, 40, 800]);
gset({gs_ul: 300, gs_upk: 300, gs_ud: 'cont', gs_xd2: 15, gs_filt: 'no'}); w.gsMode(); up = w.calcGenset();
check('guide example: a 300 kVA UPS -> rectifier Sr = 1.17 x 300 = 351 kVA', [up.std, up.Sr], [300, 351], 1e-9);
check('... without a filter U\'Rcc = 4 %: Sg = 351 x 15 / 4 = 1316 kVA (the guide rounds it to 1400)', [up.urcc, +up.Sg.toFixed(0), up.SgStd], [4, 1316, 1600]);
gset({gs_filt: 'yes'}); w.gsMode(); up = w.calcGenset();
check('... with a filter (5 %): U\'Rcc = 12 %, Sg = 351 x 15 / 12 = 439 kVA (the guide: about 500)', [up.urcc, +up.Sg.toFixed(0), up.SgStd], [12, 439, 500]);
gset({gs_filt: 'custom', gs_urcc: 8}); w.gsMode(); up = w.calcGenset();
check('a custom U\'Rcc 8 %: Sg = 351 x 15 / 8 = 658 kVA', [up.urcc, +up.Sg.toFixed(0)], [8, 658]);
gset({gs_ul: 100, gs_upk: 100, gs_upf: 0.9, gs_ut: 15, gs_ueff: 0.95, gs_vdc: 480}); up = w.calcGenset();
check('battery: 90 kW / 0.95 x 15 min / 60 x 1.2 (20 % ageing) = 28.4 kWh = 59 Ah at 480 V', [+up.kWh.toFixed(1), Math.round(up.Ah)], [28.4, 59]);
gset({gs_u: 400}); up = w.calcGenset();
check('currents for the 100 kVA unit at 400 V', [up.Imains, up.Iu], [198, 151]);
gset({gs_u: 415}); up = w.calcGenset();
check('at 415 V the Fig N9 currents are scaled by 400 / 415', [+up.Imains.toFixed(0), +up.Iu.toFixed(0)], [191, 146]);
gset({gs_u: 400, gs_ul: 1000, gs_upk: 1000}); up = w.calcGenset();
check('a load above 800 kVA is outside Fig N9: warned', [up.std, up.warnings.length], [null, 1]);
gset({gs_ul: 100, gs_upk: 120});
w.calcResult('genset');
check('UPS results are rendered with Fig N9 and the generator', text('gs_results').includes('N9') && text('gs_results').includes('المولّد الذي يغذّي'), true);
w.gsSend('in');
check('UPS mains current sent to cable sizing (IEC, three-phase 400 V)', [doc.getElementById('cs_std').value, doc.getElementById('cs_phase').value, +doc.getElementById('cs_volt').value, +doc.getElementById('cs_load').value > 100], ['iec', '3', 400, true]);
w.renderCalc('genset');
check('the tab / filter fields follow the mode', [doc.getElementById('gs-ups').style.display, doc.getElementById('gs-gen').style.display], ['none', '']);
check('standard generator series (flagged) reaches 2500 kVA', w.eval('GS_STD_KVA[GS_STD_KVA.length - 1]'), 2500);

// ---------- conduit fill with multiconductor cables (NEC Chapter 9 Table 1 Note 9) ----------
w.renderCalc('conduitfill');
doc.getElementById('cf-rows').innerHTML = '';
let cf = w.calcConduitFill();
check('no conductors: nothing to size', cf.n, 0);
w.addCfCable(); doc.querySelector('#cf-crows .cf-cod').value = '20'; doc.querySelector('#cf-crows .cf-cqty').value = '1';
cf = w.calcConduitFill();
const emt = w.eval('NEC_T4.EMT'), area20 = Math.PI / 4 * 400;
const want1 = ['1/2', '3/4', '1', '1-1/4', '1-1/2', '2', '2-1/2', '3'].find(s => area20 <= emt[s][3] + 1e-9);
check('one 20 mm cable: area = pi/4 x 20^2 = 314.2 mm2, counted as one conductor (53 %)', [+cf.total.toFixed(1), cf.n, cf.pct], [314.2, 1, 53]);
check('... the smallest EMT whose 53 % area holds it: ' + want1, cf.chosen.size, want1);
doc.querySelector('#cf-crows .cf-cqty').value = '2'; cf = w.calcConduitFill();
check('two cables: 31 % column, Note 7 does not apply to cables', [cf.n, cf.pct, cf.maxSame], [2, 31, undefined]);
doc.querySelector('#cf-crows .cf-cqty').value = '3'; cf = w.calcConduitFill();
const want3 = ['1/2', '3/4', '1', '1-1/4', '1-1/2', '2', '2-1/2', '3', '3-1/2', '4'].find(s => 3 * area20 <= emt[s][5] + 1e-9);
check('three cables: 40 % column -> ' + want3 + ' in. EMT, no rounding-up of the count', [cf.pct, cf.chosen.size, cf.maxSame], [40, want3, undefined]);
doc.getElementById('cf-rows').insertAdjacentHTML('beforeend', w.cfRowHTML('THHN', '4', 3));
doc.querySelector('#cf-crows .cf-cqty').value = '1'; cf = w.calcConduitFill();
const a4 = w.eval("NEC_T5.THHN['4']");
check('three 4 AWG THHN + one 20 mm cable: 4 conductors at 40 %, total = 3 x ' + a4 + ' + 314.2', [cf.n, +cf.total.toFixed(1)], [4, +(3 * a4 + area20).toFixed(1)]);
doc.querySelector('#cf-crows .cf-crow span').click();
check('removing the cable row removes its area', w.calcConduitFill().n, 3);
w.calcResult('conduitfill');
check('the fill results are rendered', text('cf_results').includes('حجم المجرى'), true);

// ---------- surge protective devices (SBC 401 44-3.3 and 53-4.2, Schneider chapter J) ----------
w.renderCalc('spd');
let sp = w.calcSPD();
check('Table 44-3 impulse withstand (cat IV / III / II / I): 230/400 V 6 / 4 / 2.5 / 1.5 kV, 400/690 V 8 / 6 / 4 / 2.5 kV', [w.eval("SPD_UW['230']"), w.eval("SPD_UW['400']")], [[6, 4, 2.5, 1.5], [8, 6, 4, 2.5]]);
check('Fig J31 Iimp 25 / 18.75 / 12.5 kA and Fig J32 Imax 20 / 40 / 65 kA', [w.eval('Object.values(SPD_IIMP)'), w.eval('Object.values(SPD_IMAX)')], [[25, 18.75, 12.5, 12.5], [20, 40, 65]]);
check('default: 30 thunderstorm days -> Ng = 3 flashes / km2 / year (Ng = 0.1 Td)', [sp.need.Td, sp.need.Ng], [30, 3], 1e-9);
check('an overhead line with Td > 25 days: protection required by the external influences (44-3.3.2.1)', [sp.need.overhead, sp.need.byInfluence], [true, true]);
check('conventional length d = d1 + d2 / 4 + d3 / 4 (Annex C.44): 0.3 km of overhead line -> 0.3 km; level d: dc = 1 / Ng = 0.333 km -> not required by risk', [sp.need.d, +sp.need.dc.toFixed(3), sp.need.byRisk], [0.3, 0.333, false]);
setv('sp_d1', 0.5); sp = w.calcSPD();
check('0.5 km > dc = 0.333 km: required by the risk assessment', sp.need.byRisk, true);
setv('sp_cons', 'e'); sp = w.calcSPD();
check('consequences level e: dc = 2 / Ng = 0.667 km > 0.5 km: not required', [+sp.need.dc.toFixed(3), sp.need.byRisk], [0.667, false]);
['a', 'b', 'c'].forEach(l => { setv('sp_cons', l); check('consequences level ' + l + ' (life, public services, commerce): always required', w.calcSPD().need.byRisk, true); });
setv('sp_cons', 'd'); setv('sp_d1', 0.4); setv('sp_d2', 0.8); setv('sp_d3', 0.4); sp = w.calcSPD();
check('d = 0.4 + 0.8 / 4 + 0.4 / 4 = 0.7 km', sp.need.d, 0.7, 1e-9);
setv('sp_d1', 1); setv('sp_d2', 1); setv('sp_d3', 1); sp = w.calcSPD();
check('the conventional length is limited to 1 km', sp.need.d, 1);
setv('sp_td', 25); setv('sp_d1', 0.3); setv('sp_d2', 0); setv('sp_d3', 0); sp = w.calcSPD();
check('exactly 25 days (AQ 1): no specific protection by the external-influences method', sp.need.byInfluence, false);
setv('sp_d1', 0); sp = w.calcSPD();
check('no overhead line and no unscreened underground line: no specific protection (Table 44-3 withstand is enough)', [sp.need.overhead, sp.need.none], [false, true]);
setv('sp_td', 0); setv('sp_d1', 0.3); sp = w.calcSPD();
check('no thunderstorms: Ng = 0 and an infinite critical length', [sp.need.Ng, sp.need.dc, sp.need.byRisk], [0, Infinity, false]);
setv('sp_td', 30);
// arrangement and currents
setv('sp_lps', 'no'); setv('sp_d', 20); sp = w.calcSPD();
check('no lightning protection system, equipment within 30 m: one Type 2 SPD in the main board (Fig J21)', [sp.arr, sp.Iimp], ['T2', null]);
setv('sp_d', 40); sp = w.calcSPD();
check('... beyond 30 m a Type 2/3 SPD near the equipment is added', sp.arr, 'T2+T23');
setv('sp_lps', 'yes'); w.spdLps(); setv('sp_d', 20); sp = w.calcSPD();
check('with a lightning protection system: Type 1 + Type 2, Iimp 12.5 kA when no protection level is known (53-4.2.3.4)', [sp.arr, sp.Iimp], ['T1T2', 12.5]);
setv('sp_d', 40); check('... and a Type 2/3 beyond 30 m', w.calcSPD().arr, 'T1T2+T23');
check('Iimp by LPL I / II / III: 25 / 18.75 / 12.5 kA per pole', [1, 2, 3].map(l => (setv('sp_lpl', l), w.calcSPD().Iimp)), [25, 18.75, 12.5]);
check('Imax by exposure low / medium / high: 20 / 40 / 65 kA', ['low', 'med', 'high'].map(e => (setv('sp_exp', e), w.calcSPD().Imax)), [20, 40, 65]);
check('the LPL field is shown only with a lightning protection system', (setv('sp_lps', 'no'), w.spdLps(), doc.getElementById('sp_lplw').style.display), 'none');
// Uc, Table 53-3
setv('sp_uo', 230);
const uc = sys => { setv('sp_sys', sys); return w.calcSPD().uc.map(u => [u.id, Math.round(u.Uc)]); };
check('Uc, TN-S and TT: 1.1 Uo line-neutral (253 V), 1.1 Uo line-PE (253 V), Uo neutral-PE (230 V)', [uc('tns'), uc('tt')], [[['ln', 253], ['lpe', 253], ['npe', 230]], [['ln', 253], ['lpe', 253], ['npe', 230]]]);
check('Uc, TN-C: 1.1 Uo line-PEN only', uc('tnc'), [['lpen', 253]]);
check('Uc, IT with neutral: 1.1 Uo, sqrt3 Uo (398 V), Uo; IT without neutral: sqrt3 Uo line-PE only', [uc('itn'), uc('it')], [[['ln', 253], ['lpe', 398], ['npe', 230]], [['lpe', 398]]]);
setv('sp_sys', 'tns'); check('common Uc values (230 V): 260 for 253 V; IT 440 for 398 V', [w.calcSPD().uc[0].common, (setv('sp_sys', 'it'), w.calcSPD().uc[0].common)], [260, 440]);
setv('sp_uo', 120); setv('sp_sys', 'tns'); check('common Uc values apply to 230 V networks only', w.calcSPD().uc[0].common, null);
setv('sp_uo', 230);
// connection types, Table 53-2
const cn = (sys, t) => { setv('sp_sys', sys); setv('sp_ct', t); return w.calcSPD().conn.map(c => c.id + ':' + c.req).join(','); };
check('TN-S / TT type 1: line-PE and neutral-PE mandatory, line-neutral optional', [cn('tns', 1), cn('tt', 1)], ['ln:o,lpe:m,npe:m', 'ln:o,lpe:m,npe:m']);
check('TT type 2: line-neutral and neutral-PE mandatory', cn('tt', 2), 'ln:m,npe:m');
check('TN-C: line-PEN; IT without neutral: line-PE', [cn('tnc', 1), cn('it', 1)], ['lpen:m', 'lpe:m']);
setv('sp_sys', 'tt'); setv('sp_ct', 2); setv('sp_ph', 3); sp = w.calcSPD();
check('connection type 2, three-phase: neutral-PE SPD In 20 kA; single-phase 10 kA', [sp.InNPE, (setv('sp_ph', 1), w.calcSPD().InNPE)], [20, 10]);
setv('sp_lps', 'yes'); setv('sp_ph', 3); sp = w.calcSPD();
check('... and Iimp of the neutral-PE SPD 50 kA three-phase, 25 kA single-phase', [sp.IimpNPE, (setv('sp_ph', 1), w.calcSPD().IimpNPE)], [50, 25]);
setv('sp_ct', 1); sp = w.calcSPD();
check('connection type 1: In 5 kA for every mode', [sp.type2, sp.InNPE], [false, 5]);
// Up
setv('sp_lps', 'no'); setv('sp_sys', 'tns'); setv('sp_up', 1.5); setv('sp_l', 0.5); sp = w.calcSPD();
check('Up of the SPD at the origin must not exceed category II: 2.5 kV at 230/400 V (53-4.2.3.1); 1.5 kV ok', [sp.UpMax, sp.UpOk], [2.5, true]);
check('installed Up = 1.5 + 1000 V/m x 0.5 m = 2.0 kV <= category II 2.5 kV; lead 0.5 m ok', [sp.UpInst, sp.upOk, sp.lenOk], [2, true, true]);
setv('sp_l', 1.2); sp = w.calcSPD();
check('a 1.2 m lead: installed Up 2.7 kV > 2.5 kV and the lead exceeds 0.5 m (53-4.2.9)', [+sp.UpInst.toFixed(1), sp.upOk, sp.lenOk], [2.7, false, false]);
setv('sp_l', 0.5); setv('sp_cat', 3); sp = w.calcSPD();
check('specially protected equipment (category I, 1.5 kV): 2.0 kV installed is not enough', [sp.Uw, sp.upOk], [1.5, false]);
setv('sp_cat', 0); check('equipment at the origin (category IV, 6 kV)', w.calcSPD().Uw, 6);
setv('sp_up', 3); setv('sp_cat', 2); check('an SPD with Up 3 kV exceeds the 2.5 kV of category II', w.calcSPD().UpOk, false);
setv('sp_up', 1.5);
check('PE conductor 4 mm2 Cu, 16 mm2 with a lightning protection system (53-4.2.10)', [w.calcSPD().cu, (setv('sp_lps', 'yes'), w.calcSPD().cu)], [4, 16]);
w.calcResult('spd');
check('SPD results are rendered with the clauses', ['44-3.3', '53-4.2', 'J21'].every(s => text('sp_results').includes(s)), true);

// ---------- neutral conductor (NEC 220.61, SBC 401 52-4.2) ----------
w.renderCalc('neutral');
let nt = w.calcNeutral();
check('defaults: 4-wire wye, line-to-neutral loads 150 / 270 / 200 A: maximum unbalance 270 A', [nt.mode, nt.sys, nt.Iu], ['nec', 'wye', 270]);
check('220.61(B)(2): 70 % of the part above 200 A: 200 + 0.7 x 70 = 249 A', [nt.IN, nt.reduction], [249, 21], 1e-9);
check('... 250 kcmil copper at 75 C (255 A)', [nt.cond.s, nt.cond.allowed], ['250', 255]);
setv('nt_metal', 'al'); nt = w.calcNeutral();
check('aluminium: 350 kcmil (250 A)', [nt.cond.s, nt.cond.allowed], ['350', 250]);
setv('nt_metal', 'cu');
setv('nt_nl', 100); nt = w.calcNeutral();
check('100 A of nonlinear load gets no reduction (C)(2): 100 + 170 = 270 A, nothing above 200 A in the rest', [nt.IN, nt.reduction], [270, 0], 1e-9);
setv('nt_nl', 0); setv('nt_rng', 60); nt = w.calcNeutral();
check('60 A of household ranges / dryers at 70 % (B)(1) + 200 + 0.7 x 10 = 249 A', nt.IN, 249, 1e-9);
setv('nt_rng', 0); setv('nt_three', 'yes'); nt = w.calcNeutral();
check('a 3-wire circuit of two phases and the neutral of a 4-wire wye: no reduction (C)(1)', [nt.IN, nt.three], [270, true]);
setv('nt_three', 'no'); setv('nt_sys', 'sp3'); w.ntMode(); nt = w.calcNeutral();
check('single-phase 3-wire uses two loads: 150 / 270 -> 270 A, the L3 field is hidden', [nt.loads.length, nt.IN, doc.getElementById('nt_l3w').style.display], [2, 249, 'none']);
setv('nt_l2', 180); nt = w.calcNeutral();
check('below 200 A there is no reduction: 180 A', nt.IN, 180, 1e-9);
setv('nt_l2', 270); setv('nt_sys', 'wye'); w.ntMode();
w.calcResult('neutral');
check('NEC results are rendered with 220.61', text('nt_results').includes('220.61'), true);
w.ntSend();
check('the neutral load is sent to the cable-sizing calculator (NEC)', [doc.getElementById('cs_std').value, +doc.getElementById('cs_load').value], ['nec', 249]);
// SBC 401 52-4.2
w.renderCalc('neutral'); setv('nt_mode', 'iec'); w.ntMode();
nt = w.calcNeutral();
check('SBC: 95 mm2 Cu, balanced, protected neutral, harmonics 10 %: may be reduced, 50 mm2 (>= half, >= 16 mm2)', [nt.rule, nt.SN], ['reduced', 50]);
check('... Schneider estimate 3 x 0.10 x 150 = 45 A', nt.IN3, 45, 1e-9);
setv('nt_h3', 20); nt = w.calcNeutral();
check('harmonics 20 % (15 - 33 %): neutral = line', [nt.rule, nt.SN], ['mid', 95]);
setv('nt_h3', 40); nt = w.calcNeutral();
check('harmonics 40 % (> 33 %): the neutral must carry 1.45 IB = 217.5 A', [nt.rule, nt.SN, nt.Ireq145, nt.IN3], ['high', 95, 217.5, 180], 1e-9);
setv('nt_h3', 80); nt = w.calcNeutral();
check('the neutral estimate is capped at sqrt3 x IB: 260 A', nt.IN3, Math.sqrt(3) * 150, 1e-9);
setv('nt_h3', 10); setv('nt_bal', 'no'); nt = w.calcNeutral();
check('an unbalanced load: no reduction', [nt.rule, nt.SN], ['unbal', 95]);
setv('nt_bal', 'yes'); setv('nt_prot', 'no'); nt = w.calcNeutral();
check('a neutral without overcurrent protection: no reduction', [nt.rule, nt.SN], ['unprot', 95]);
setv('nt_prot', 'yes'); setv('nt_s', 16); nt = w.calcNeutral();
check('16 mm2 copper: neutral = line (multi-phase up to 16 mm2 Cu)', [nt.rule, nt.SN], ['small', 16]);
setv('nt_s', 25); setv('nt_im', 'al'); nt = w.calcNeutral();
check('25 mm2 aluminium: neutral = line', [nt.rule, nt.SN], ['small', 25]);
setv('nt_s', 35); nt = w.calcNeutral();
check('35 mm2 aluminium: reduced neutral not below 25 mm2 Al', [nt.rule, nt.SN], ['reduced', 25]);
setv('nt_im', 'cu'); setv('nt_ph', 'sp2'); setv('nt_s', 95); nt = w.calcNeutral();
check('single-phase two-wire circuits: neutral = line whatever the size', [nt.rule, nt.SN], ['sp2', 95]);
setv('nt_ph', 'poly'); setv('nt_h3', 40); w.calcResult('neutral');
check('SBC results are rendered with 52-4.2', text('nt_results').includes('52-4.2'), true);
w.ntSend();
check('1.45 IB sent to the cable-sizing calculator (IEC, 400 V)', [doc.getElementById('cs_std').value, +doc.getElementById('cs_load').value, +doc.getElementById('cs_volt').value], ['iec', 217.5, 400]);

// ---------- screens ----------
w.showCategory('electrical');
const cards5 = doc.getElementById('electrical-category').textContent;
check('electrical screen lists the generator, SPD and neutral calculators', cards5.includes('المولّد الاحتياطي') && cards5.includes('حماية الجهد الزائد') && cards5.includes('موصل الحيادي'), true);
check('electrical screen has 21 cards and the home page says 21', [doc.querySelectorAll('#electrical-category .calc-card').length, doc.body.textContent.includes('21 حاسبة متاحة')], [21, true]);

check('no page errors', errors.length, 0);
if (errors.length) console.log(errors.slice(0, 3));
console.log(fail ? `${fail} electrical-5 check(s) FAILED` : 'all electrical-5 checks passed');
process.exit(fail ? 1 : 0);
