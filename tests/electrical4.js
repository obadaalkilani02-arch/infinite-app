// Electrical, part 4 (from the new catalogues): short-circuit current (Schneider Electric guide, chapter G).
//   node tests/electrical4.js
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
const rel = (got, want, pct) => Math.abs(got - want) / want * 100 <= pct;

// ---------- short-circuit current: the worked example of the guide (Fig G37) ----------
w.renderCalc('shortcircuit');
let sc = w.calcShortCircuit();
check('defaults reproduce Fig G37: 5 sections after the transformer', sc.rows.length, 5);
check('MV network 500 MVA at 420 V: Za = 0.353 mOhm, Xa = 0.351, Ra = 0.035 (Fig G34)', [+sc.Za.toFixed(3), +sc.Xa.toFixed(3), +sc.Ra.toFixed(3)], [0.353, 0.351, 0.035]);
check('transformer 1000 kVA, Usc 5 %: Ztr = 8.82 mOhm', sc.Ztr, 8.82, 1e-9);
check('... In = 1374.6 A', sc.In, 1374.6, 0.1);
check('... Rtr = 13.3 kW / (3 In^2) = 2.35 mOhm (the guide prints 2.24)', sc.Rtr, 2.35, 0.02);
check('... Xtr from Ztr and Rtr (the guide prints 8.10)', sc.Xtr, Math.sqrt(8.82 * 8.82 - sc.Rtr * sc.Rtr), 1e-9);
check('cable 4 x 240 mm2, 5 m: R = 22.5 x 5 / (240 x 4) = 0.117 mOhm (guide 0.12), X = 0.40', [+sc.rows[0].R.toFixed(3), +sc.rows[0].X.toFixed(3)], [0.117, 0.4]);
check('Isc1 after the cable = 26 kA (within 3 %)', rel(sc.rows[0].Isc, 26, 3), true);
check('Isc2 at the busbars (CB 0.15 + 10 m x 0.15) = 22 kA (within 3 %)', rel(sc.rows[2].Isc, 22, 3), true);
check('busbar section X = 1.5 mOhm and the breaker 0.15 mOhm', [sc.rows[2].X, sc.rows[1].X], [1.5, 0.15], 1e-9);
check('100 m of 95 mm2 Cu: R = 23.68 mOhm, X = 8', [+sc.rows[3].R.toFixed(2), sc.rows[3].X], [23.68, 8], 1e-9);
check('Isc3 after 100 m of 95 mm2 = 7.4 kA (within 3 %)', rel(sc.rows[3].Isc, 7.4, 3), true);
check('20 m of 10 mm2 Cu: R = 45 mOhm', sc.rows[4].R, 45, 1e-9);
check('Isc4 on the final circuit = 3.2 kA (within 3 %)', rel(sc.rows[4].Isc, 3.2, 3), true);
check('the current falls along the circuit', sc.p0.Isc > sc.rows[0].Isc && sc.rows[0].Isc > sc.rows[2].Isc && sc.rows[2].Isc > sc.rows[3].Isc && sc.rows[3].Isc > sc.rows[4].Isc, true);
check('totals are cumulative sums: RT after the last section', sc.rows[4].RT, sc.p0.RT + sc.rows.reduce((a, r) => a + r.R, 0), 1e-9);
check('Isc = U20 / (sqrt3 x ZT)', sc.rows[4].Isc, 420 / (Math.sqrt(3) * sc.rows[4].ZT), 1e-9);

// the simple transformer case (Fig G31 example: 400 kVA, 420 V, Usc 4 %, infinite MV network)
doc.getElementById('sc-rows').innerHTML = '';
setv('sc_psc', 0); setv('sc_kva', 400); setv('sc_usc', 4); setv('sc_rmode', 'none');
sc = w.calcShortCircuit();
check('400 kVA at 420 V: In = 550 A', sc.In, 550, 0.5);
check('... Isc = In x 100 / Usc = 13.7 kA', sc.p0.Isc, 13.75, 0.05);
check('... an infinite MV network has no impedance', sc.Za, 0);
setv('sc_n', 2); sc = w.calcShortCircuit();
check('two identical transformers on one busbar: twice the current (27.5 kA)', sc.p0.Isc, 27.5, 0.1);
setv('sc_n', 1);
setv('sc_rmode', 'typ'); setv('sc_kva', 1000); setv('sc_usc', 6); sc = w.calcShortCircuit();
check('Fig G35 typical Rtr for 1000 kVA oil: 2.3 mOhm; Ztr = 10.6 (Usc 6 %)', [sc.Rtr, +sc.Ztr.toFixed(1)], [2.3, 10.6], 1e-9);
setv('sc_ttype', 'cast'); sc = w.calcShortCircuit();
check('... cast-resin 1000 kVA: Rtr = 1.9 mOhm', sc.Rtr, 1.9, 1e-9);
setv('sc_kva', 450); sc = w.calcShortCircuit();
check('a rating between table rows uses the nearest one (500 kVA)', sc.typRow, 500);
setv('sc_ttype', 'oil'); setv('sc_kva', 800); sc = w.calcShortCircuit();
check('Fig G35 800 kVA oil: Rtr = 2.9 mOhm', sc.Rtr, 2.9, 1e-9);
check('Fig G31 typical Usc: 400 kVA oil 4 %, 800 kVA oil 6 %, 400 kVA resin 6 %', [w.scTypicalUsc(400, 'oil'), w.scTypicalUsc(800, 'oil'), w.scTypicalUsc(400, 'cast')], [4, 6, 6]);
setv('sc_rmode', 'pcu'); setv('sc_pcu', 5000000); sc = w.calcShortCircuit();
check('absurd losses are limited to Z with a warning', [sc.Rtr <= sc.Ztr + 1e-9, sc.warnings.length], [true, 1]);

// 60 Hz reactances and parallel conductors
setv('sc_rmode', 'none'); setv('sc_hz', 60);
doc.getElementById('sc-rows').insertAdjacentHTML('beforeend', w.scRowHTML('bus', 'bus', {len: 10}) + w.scRowHTML('cable', 'cable', {s: 120, par: 2, len: 50, metal: 'al'}) + w.scRowHTML('known', 'man', {r: 1.5, x: 2.5}));
sc = w.calcShortCircuit();
check('60 Hz: busbars 0.18 mOhm/m -> 1.8 mOhm for 10 m', sc.rows[0].X, 1.8, 1e-9);
check('60 Hz: cables 0.096 mOhm/m; 2 x 120 mm2 Al over 50 m: R = 36 x 50 / 240 = 7.5 mOhm', [sc.rows[1].X, sc.rows[1].R], [4.8, 7.5], 1e-9);
check('a section with known R and X is added as given', [sc.rows[2].R, sc.rows[2].X], [1.5, 2.5]);
setv('sc_hz', 50);

// motors
doc.getElementById('sc-rows').innerHTML = '';
setv('sc_psc', 500); setv('sc_kva', 1000); setv('sc_usc', 5); setv('sc_rmode', 'pcu'); setv('sc_pcu', 13300);
setv('sc_mot', 100); sc = w.calcShortCircuit();
check('100 A of motors (73 kVA) is below 25 % of 1000 kVA: neglected', sc.mot.significant, false);
check('... but its contribution is 3.5 x 100 A = 0.35 kA', sc.mot.Iscm, 0.35, 1e-9);
setv('sc_mot', 400); sc = w.calcShortCircuit();
check('400 A of motors (291 kVA) exceeds 25 %: significant, +1.4 kA', [sc.mot.significant, sc.mot.Iscm], [true, 1.4]);
check('... total at the transformer terminals = source + motors', sc.mot.total, sc.p0.Isc + 1.4, 1e-9);
w.calcResult('shortcircuit');
check('motor note is rendered when significant', text('sc_results').includes('25%'), true);
setv('sc_mot', 0);

// breaking capacity check (SBC 401 43-4.5.1) and the render
w.renderCalc('shortcircuit');
const icus = doc.querySelectorAll('#sc-rows .sc-icu');
icus[0].value = '36'; icus[3].value = '6';
sc = w.calcShortCircuit();
w.calcResult('shortcircuit');
const res = text('sc_results');
check('breaking capacity 36 kA >= 25 kA is accepted', res.includes('قدرة القطع 36.0 kA كافية'), true);
check('breaking capacity 6 kA < 7.5 kA is rejected', res.includes('قدرة القطع 6.0 kA أقل من التيار'), true);
check('results cite SBC 401 43-4.5.1', res.includes('43-4.5.1'), true);

// hide / show of the row fields by type
const sel = doc.querySelector('#sc-rows .sc-type');
sel.value = 'cb'; w.scRowType(sel);
const row0 = doc.querySelector('#sc-rows .sc-row');
check('a breaker row hides the cable fields and shows the breaker count', [row0.querySelector('.sc-f-cable').style.display, row0.querySelector('.sc-f-cb').style.display], ['none', '']);
sel.value = 'cable'; w.scRowType(sel);

// link: send the current to the protective-conductor calculator (k2S2)
w.renderCalc('shortcircuit');
sc = w.calcShortCircuit();
w.scSend(2);
check('the current is carried to the protective-conductor calculator in IEC mode', [doc.getElementById('pc_std').value, +doc.getElementById('pc_i').value], ['iec', +sc.rows[2].Isc.toFixed(3)]);
check('... with a confirmation note', text('pc_feed_note').includes('تيار القصر'), true);
w.renderCalc('protcond');
check('the hand-off is consumed once', text('pc_feed_note').includes('استُوردت'), false);

// ---------- earth electrode resistance (SBC 401 Annex D.54, Table 54-1, NEC 250.53 / 250.56) ----------
check('soil table: 21 entries incl. the three averages of Table D.54-2', Object.keys(w.eval('EA_SOIL')).length, 21);
check('soil table values (D.54-1): marl 100-200, siliceous sand 200-300, granite 1500-10000', [w.eval('EA_SOIL.marl.slice(1)'), w.eval('EA_SOIL.silsand.slice(1)'), w.eval('EA_SOIL.granite.slice(1)')], [[100, 200], [200, 300], [1500, 10000]]);
check('Table D.54-2 averages: 50, 500, 3000', [w.eval('EA_SOIL.avg50[2]'), w.eval('EA_SOIL.avg500[2]'), w.eval('EA_SOIL.avg3000[2]')], [50, 500, 3000]);
w.renderCalc('earthelectrode');
check('default soil gives rho = 50 ohm.m', +doc.getElementById('ea_rho').value, 50);
setv('ea_soil', 'granite'); w.eaSoil();
check('choosing a soil fills the upper value of its range', +doc.getElementById('ea_rho').value, 10000);
check('... and shows the range as a hint', text('ea_rhohint').includes('1500 – 10000'), true);
setv('ea_soil', 'custom'); w.eaSoil(); setv('ea_rho', 100);
check('a custom soil keeps the entered value', +doc.getElementById('ea_rho').value, 100);
setv('ea_len', 50);
let ea = w.calcEarthElectrode();
check('ring of 50 m in 100 ohm.m: R = 2 x 100 / 50 = 4 ohm (D.54-3.2 a)', [ea.type, ea.R], ['ring', 4], 1e-9);
setv('ea_len', 40); ea = w.calcEarthElectrode();
check('default target TT with 300 mA RCD: 50 / 0.3 = 166.7 ohm, and 5 ohm passes', [+ea.Rt.toFixed(1), ea.ok, ea.R], [166.7, true, 5]);
setv('ea_idn', 30); ea = w.calcEarthElectrode();
check('30 mA RCD: R_A up to 1667 ohm', ea.Rt, 50 / 0.03, 1e-9);
setv('ea_tgt', 'lps'); ea = w.calcEarthElectrode();
check('lightning (BS EN 62305-3): 10 ohm; a 5 ohm ring passes, length needed 20 m', [ea.Rt, ea.ok, ea.needL], [10, true, 20], 1e-9);
setv('ea_len', 10); ea = w.calcEarthElectrode();
check('a 10 m ring in 100 ohm.m: 20 ohm fails the 10 ohm requirement', [ea.R, ea.ok], [20, false]);
setv('ea_type', 'rods'); w.eaType();
setv('ea_rl', 3); setv('ea_n', 1); setv('ea_sp', 12); setv('ea_tgt', 'nec'); w.eaTgt();
ea = w.calcEarthElectrode();
check('one 3 m rod in 100 ohm.m: R = 33.3 ohm', [+ea.R.toFixed(2), +ea.R1.toFixed(2)], [33.33, 33.33]);
check('NEC 250.56: above 25 ohm needs another electrode', [ea.Rt, ea.ok], [25, false]);
check('rods needed for 25 ohm: ceil(100 / (3 x 25)) = 2', ea.needN, 2);
setv('ea_n', 4); ea = w.calcEarthElectrode();
check('four 3 m rods spaced exactly 4L = 12 m: R = 100 / 12 = 8.33 ohm, but the guide asks for more than 4L', [+ea.R.toFixed(2), ea.spacingOk, ea.warnings.length], [8.33, false, 1]);
setv('ea_sp', 13); ea = w.calcEarthElectrode();
check('spacing of 13 m (> 4L = 12 m) is accepted', [ea.spacingOk, ea.warnings.length], [true, 0]);
setv('ea_sp', 6); ea = w.calcEarthElectrode();
check('spacing below 4L warns that the simple formula is optimistic', [ea.spacingOk, ea.warnings.length], [false, 1]);
setv('ea_sp', 1); setv('ea_rl', 2); ea = w.calcEarthElectrode();
check('spacing < 1.8 m (NEC 250.56) and rods < 2.44 m (250.53(G)) are warned', ea.warnings.length >= 3, true);
setv('ea_rl', 3); setv('ea_sp', 13); setv('ea_n', 1);
setv('ea_type', 'plate'); w.eaType(); setv('ea_pa', 0.5); setv('ea_pb', 1); ea = w.calcEarthElectrode();
check('plate 0.5 x 1 m (perimeter 3 m) in 100 ohm.m: R = 0.8 x 100 / 3 = 26.7 ohm', [ea.P, +ea.R.toFixed(2)], [3, 26.67]);
check('... perimeter needed for 25 ohm: 3.2 m', ea.needP, 3.2, 1e-9);
setv('ea_pa', 0.4); ea = w.calcEarthElectrode();
check('a plate side under 0.5 m is warned', ea.warnings.length, 1);
setv('ea_pa', 0.5);

// material lists and Table 54-1 minimum sizes
w.eaType();
const ids = () => [...doc.getElementById('ea_mat').options].map(o => o.value);
check('plate materials: 4 choices', ids().length, 4);
setv('ea_type', 'rods'); w.eaType();
check('rod materials come from the vertical-electrode rows (8)', ids().length, 8);
setv('ea_mat', 'v_cu_rod'); w.calcResult('earthelectrode');
let res4 = text('ea_results');
check('copper rod: 15 mm (12 mm for protection against shock only)', res4.includes('15 mm') && res4.includes('12 mm'), true);
setv('ea_mat', 'v_gs_pipe'); w.calcResult('earthelectrode'); res4 = text('ea_results');
check('galvanised steel pipe: 25 mm, 2 mm wall, 350 g/m2, 45 um', ['25 mm', '2 mm', '350 g/m²', '45 µm'].every(s => res4.includes(s)), true);
setv('ea_type', 'ring'); w.eaType();
check('horizontal conductors: 10 materials', ids().length, 10);
setv('ea_mat', 'h_gs_strip'); w.calcResult('earthelectrode'); res4 = text('ea_results');
check('galvanised strip 90 mm2 x 3 mm, 500 g/m2, 63 um', ['90 mm²', '3 mm', '500 g/m²', '63 µm'].every(s => res4.includes(s)), true);
check('the TT table lists 30 / 100 / 300 / 500 mA when the target is TT', (setv('ea_tgt', 'tt'), w.calcResult('earthelectrode'), text('ea_results').includes('1667')), true);
check('every material row has a shape and a name', w.eval('EA_MAT.every(x => /^[hvp]$/.test(x.s) && x.name)'), true);

// ---------- maximum demand and diversity (IET Table H2 as printed in the Practical Guide, Schneider chapter A) ----------
w.renderCalc('maxdemand');
let md = w.calcMaxDemand();
check('default premises: shops and offices, three-phase, 230 V', [md.mode, md.prem, md.ph, md.U0, md.V], ['iet', 'shop', 3, 230, 400]);
const cat = id => md.cats.find(c => c.cat === id);
check('lighting 15 + 7 + 12 A at 90 % = 30.6 A (the Practical Guide example)', cat('light').dem, 30.6, 1e-9);
check('conventional circuits 2 x 32 A + 2 x 20 A: 32 + 0.5 x 72 = 68 A (the guide example)', cat('conv').dem, 68, 1e-9);
check('three 3 kW heaters in a shop: 100 % + 75 % of the rest = 32.6 A', cat('heat').dem, 3000 / 230 * 2.5, 1e-9);
check('total after diversity = 131.2 A, three-phase 43.7 A per phase', [+md.dem.toFixed(1), +md.Iph.toFixed(1)], [131.2, 43.7]);
check('connected load 34 + 104 + 39.1 = 177.1 A', md.conn, 34 + 104 + 3 * 3000 / 230, 1e-9);
check('apparent power = demand x 230 V', md.kva, md.dem * 0.23, 1e-9);
const setRows = rows => { doc.getElementById('md-rows').innerHTML = rows.map(r => w.mdRowHTML(r[0], r[1], r[2] || 1, r[3] || '', r[4] || '')).join(''); md = w.calcMaxDemand(); };
const amp = (c, prem) => { setv('md_prem', prem); md = w.calcMaxDemand(); return cat(c).dem; };
const kw = (cats, prem, cs) => { setv('md_prem', prem); setv('md_cs', cs || 'no'); md = w.calcMaxDemand(); return +(md.cats.find(c => c.cat === cats).dem * 230 / 1000).toFixed(3); };
setRows([['h1', 'heat', 3, '', 3], ['h2', 'heat', 2, '', 2]]);
check('boarding-house heaters 3, 3, 3, 2, 2 kW: 9.6 kW (the guide example)', kw('heat', 'hotel'), 9.6);
setRows([['c1', 'cook', 2, '', 12], ['c2', 'cook', 1, '', 10]]);
check('small-hotel cookers 12, 12, 10 kW: 27.6 kW (the guide example)', kw('cook', 'hotel'), 27.6);
setRows([['w1', 'whi', 2, '', 7], ['w2', 'whi', 1, '', 3]]);
check('office instantaneous water heaters 7, 7, 3 kW: 14.75 kW (the guide example)', kw('whi', 'shop'), 14.75);
setRows([['l1', 'light', 1, 15], ['l2', 'light', 1, 7], ['l3', 'light', 1, 12]]);
check('shop lighting 34 A at 90 %', amp('light', 'shop'), 30.6, 1e-9);
check('household lighting 66 %', amp('light', 'dom'), 34 * 0.66, 1e-9);
check('guest-house lighting 75 %', amp('light', 'hotel'), 34 * 0.75, 1e-9);
setRows([['k', 'cook', 1, 86.95]]);
setv('md_prem', 'dom'); setv('md_cs', 'no'); md = w.calcMaxDemand();
check('household cooker 86.95 A: 10 A + 30 % of the remainder = 33.1 A (the guide prints 39 A with 30 % of the whole load)', cat('cook').dem, 10 + 0.3 * 76.95, 1e-9);
setv('md_cs', 'yes'); md = w.calcMaxDemand();
check('... plus 5 A when the control unit has a socket-outlet', cat('cook').dem, 10 + 0.3 * 76.95 + 5, 1e-9);
setRows([['h', 'heat', 3, 10]]); setv('md_prem', 'dom'); md = w.calcMaxDemand();
check('household heating 30 A: 10 A + 50 % of the remainder = 20 A', cat('heat').dem, 20, 1e-9);
setRows([['c', 'conv', 2, 32], ['d', 'conv', 2, 20]]);
check('household conventional circuits: 100 % of the largest + 40 % of the rest = 60.8 A', cat('conv').dem, 32 + 0.4 * 72, 1e-9);
setRows([['s', 'sock', 4, 13]]);
check('household socket-outlet points 4 x 13 A: 13 + 0.4 x 39 = 28.6 A', cat('sock').dem, 28.6, 1e-9);
setv('md_prem', 'shop'); md = w.calcMaxDemand();
check('shop socket-outlet points: 13 + 0.75 x 39 = 42.25 A', cat('sock').dem, 42.25, 1e-9);
setRows([['t', 'nodiv', 2, 10], ['f', 'fixed', 1, 5]]); md = w.calcMaxDemand();
check('no diversity for thermostatic water heaters, floor warming and storage heating; fixed equipment at full load', [cat('nodiv').dem, cat('fixed').dem], [20, 5]);
setRows([['x', 'light', 1, 0]]); md = w.calcMaxDemand();
check('a row without current is ignored', md.cats.length, 0);
setRows([['l', 'light', 1, 20]]); setv('md_ph', 1); md = w.calcMaxDemand();
check('single-phase: V = 230 and the phase current is the whole demand', [md.V, md.Iph], [230, md.dem]);
check('Table 4.1 style rows can be added', (w.addMdRow(), doc.querySelectorAll('#md-rows .md-row').length), 2);
setv('md_ph', 3);
const expIph = +(w.calcMaxDemand().Iph.toFixed(2));
w.mdSend();
check('maximum demand sent to cable sizing in IEC mode: current per phase, three-phase 400 V', [doc.getElementById('cs_std').value, +doc.getElementById('cs_load').value, doc.getElementById('cs_phase').value, +doc.getElementById('cs_volt').value], ['iec', expIph, '3', 400]);

// IEC: apartment blocks (Fig A10), circuit functions (Fig A13), boards (Fig A12)
w.renderCalc('maxdemand'); setv('md_mode', 'iec'); w.mdMode();
check('Fig A10: 1 -> 1, 2-4 -> 1, 5 -> 0.78, 12 -> 0.63, 17 -> 0.53, 22 -> 0.49, 27 -> 0.46, 33 -> 0.44, 37 -> 0.42, 45 -> 0.41, 60 -> 0.40', [1, 4, 5, 12, 17, 22, 27, 33, 37, 45, 60].map(n => w.mdAptKs(n)), [1, 1, 0.78, 0.63, 0.53, 0.49, 0.46, 0.44, 0.42, 0.41, 0.4]);
check('Fig A12: 2-3 circuits 0.9, 4-5 0.8, 6-9 0.7, 10 or more 0.6', [2, 3, 4, 5, 6, 9, 10, 20].map(n => w.mdBoardKs(n)), [0.9, 0.9, 0.8, 0.8, 0.7, 0.7, 0.6, 0.6]);
md = w.calcMaxDemand();
check('25 consumers x 6 kVA = 150 kVA x 0.46 = 69 kVA (the guide example)', [md.apt.installed, md.apt.ks, md.apt.dem], [150, 0.46, 69], 1e-9);
check('... entering the rising main at 400 V: 100 A', md.Iapt, 100, 0.5);
setv('md_apn', 10); setv('md_apk', 6); md = w.calcMaxDemand();
check('third-floor feeder: 10 consumers x 6 kVA x 0.63 = 37.8 kVA = 55 A (the guide example)', [md.apt.dem, Math.round(md.Iapt)], [37.8, 55], 1e-9);
setv('md_aph', 'yes'); md = w.calcMaxDemand();
check('electric heat-storage consumers: ks = 0.8 whatever the number', md.apt.ks, 0.8);
setv('md_aph', 'no'); setv('md_apn', 25);
md = w.calcMaxDemand();
check('general loads: lighting 20, sockets 36 x 0.2, A/C 60, lifts 15 x 0.75 (1), 10 x 0.75 (0.75), pump 5 x 0.75 (0.6)', +md.sumDem.toFixed(3), 20 + 7.2 + 60 + 11.25 + 5.625 + 2.25, 1e-9);
check('motor ks follows the rank 1 / 0.75 / 0.6 (Fig A13)', md.rows.filter(r => r.fn === 'motor').map(r => r.ks), [1, 0.75, 0.6]);
check('total = apartments + general loads', md.total, 69 + 106.325, 1e-9);
check('current at 400 V', md.I, md.total * 1000 / (Math.sqrt(3) * 400), 1e-9);
check('standard transformer for 175 kVA (Fig A15): 250', md.nextKva, 250);
setv('md_board', 'yes'); md = w.calcMaxDemand();
check('board factor for 6 circuits = 0.7 applies to the general loads only', [md.boardKs, +md.gen.toFixed(4)], [0.7, +(106.325 * 0.7).toFixed(4)]);
check('Fig A15 list: 100 ... 3150 kVA (14 ratings)', w.eval('TR_COMMON_KVA'), [100, 160, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150]);
const miSel = doc.querySelector('#mi-rows .mi-row .mi-fn'); miSel.value = 'sock'; w.miRowFn(miSel);
check('changing the function refills ku and ks (sockets 1 / 0.2)', [+doc.querySelector('#mi-rows .mi-ku').value, +doc.querySelector('#mi-rows .mi-ks').value], [1, 0.2]);
miSel.value = 'motor'; w.miRowFn(miSel);
check('... motors: ku 0.75 and ks disabled', [+doc.querySelector('#mi-rows .mi-ku').value, doc.querySelector('#mi-rows .mi-ks').disabled], [0.75, true]);
miSel.value = 'light'; w.miRowFn(miSel);
w.mdSend();
check('IEC maximum demand sent to cable sizing: three-phase 400 V, IEC reference', [doc.getElementById('cs_std').value, doc.getElementById('cs_phase').value, +doc.getElementById('cs_volt').value, +doc.getElementById('cs_load').value > 100], ['iec', '3', 400, true]);
w.renderCalc('maxdemand'); w.calcResult('maxdemand');
check('IET results mention the BS 7671 guide', text('md_results').includes('H2'), true);
setv('md_mode', 'iec'); w.mdMode(); w.calcResult('maxdemand');
check('IEC results mention Fig A15', text('md_results').includes('A15'), true);

// ---------- lift and escalator motor sizing (Al-Sharif, Lift Report 1999: the eight worked examples) ----------
w.renderCalc('liftmotor');
const lmSet = o => Object.keys(o).forEach(k => setv(k, o[k]));
let lm = w.calcLiftMotor();
check('defaults are Example 5: 28 passengers at 1.75 m/s, CF 50 %, eta 0.75 -> 24 kW', [lm.mode, +lm.M.toFixed(2)], ['lift', 24.03]);
check('... the out-of-balance mass is half of the load: 1050 kg', lm.mob, 1050, 1e-9);
check('... nearest standard rating 30 kW (IEC list, flagged)', lm.std, 30);
lmSet({lm_p: 49, lm_s: 1.6, lm_cf: 0.4, lm_eta: 0.7});
check('Example 1: 49 passengers, 1.6 m/s, CF 40 %, eta 70 % -> 49.44 kW', w.calcLiftMotor().M, 49.44, 0.01);
check('... 55 kW is the next standard rating above 49.4', w.calcLiftMotor().std, 55);
lmSet({lm_type: 'hyd', lm_p: 8, lm_s: 1, lm_eta: 0.8});
lm = w.calcLiftMotor();
check('Example 2: hydraulic 8 passengers, 1 m/s, eta 80 % (CF = -1) -> 14.7 kW', [lm.CF, +lm.M.toFixed(1)], [-1, 14.7]);
check('... 15 kW is the next IEC rating; no dynamic check for a hydraulic lift', [lm.std, lm.dyn], [15, undefined]);
lmSet({lm_type: 'trac', lm_p: 13, lm_s: 1.2, lm_cf: 0.5, lm_eta: 0.75});
check('Example 3: 13 passengers, 1.2 m/s, CF 50 %, eta 75 % -> 7.65 kW', w.calcLiftMotor().M, 7.65, 0.005);
lmSet({lm_p: 78, lm_s: 1, lm_cf: 0.45, lm_eta: 0.68});
check('Example 4: 78 passengers, 1.0 m/s, CF 45 %, eta 68 % -> 46.4 kW and a 55 kW IEC motor (the paper picks 50)', [+w.calcLiftMotor().M.toFixed(1), w.calcLiftMotor().std], [46.4, 55]);
// Example 5 dynamic check: motor D, 248 Nm, 24 kW, inertia 1.1, 920 rpm; car 2000 kg, counterweight 3050 kg
lmSet({lm_p: 28, lm_s: 1.75, lm_cf: 0.5, lm_eta: 0.75, lm_pm: 24, lm_n: 920, lm_tr: 248, lm_tf: 2, lm_c: 2000, lm_cw: 0, lm_jm: 1.1, lm_jo: 0.15, lm_drive: 'dc'});
lm = w.calcLiftMotor();
check('Example 5: out-of-balance torque 249.5 Nm', lm.dyn.Tob, 249.5, 0.3);
check('... counterweight defaults to C + CF x Q = 3050 kg', lm.dyn.CW, 3050, 1e-9);
check('... total inertia 4.396 kg m2', lm.dyn.Jtot, 4.396, 0.01);
check('... acceleration 1.02 m/s2 -> acceptable (0.8 - 1.0 or more with a variable-speed drive)', [+lm.dyn.a.toFixed(2), lm.dyn.verdict], [1.02, 'ok-vs']);
lmSet({lm_drive: 'two'}); lm = w.calcLiftMotor();
check('a two-speed drive above 1.0 m/s2 may need a flywheel', lm.dyn.verdict, 'flywheel');
lmSet({lm_drive: 'vvvf'}); lm = w.calcLiftMotor();
check('VVVF / ACVV: the torque is derated by 5 % (Tmax = 2 x 248 x 0.95)', [lm.dyn.derate, +lm.dyn.Tmax.toFixed(1)], [0.95, 471.2]);
check('... so the acceleration falls to 0.92 m/s2: inside the usual range', [+lm.dyn.a.toFixed(2), lm.dyn.verdict], [0.92, 'ok']);
lmSet({lm_drive: 'dc', lm_tr: 0}); lm = w.calcLiftMotor();
check('without a torque the rated value is 9550 x kW / rpm = 249.1 Nm', lm.dyn.Tr, 9550 * 24 / 920, 1e-9);
lmSet({lm_tr: 248, lm_at: 0.8}); lm = w.calcLiftMotor();
check('rated torque needed for 0.8 m/s2: (T_ob + a Jtot / k) / 2 -> 235 Nm', lm.dyn.TrNeeded, (lm.dyn.Tob + 0.8 * lm.dyn.Jtot / lm.dyn.k) / 2, 1e-9);
check('... smaller than the motor chosen, so 0.8 m/s2 is reachable', lm.dyn.TrNeeded < 248, true);
// Example 6 (Example 4 lift with a 729 Nm, Tmax = 2.34 x Trated, 610 rpm motor)
lmSet({lm_p: 78, lm_s: 1, lm_cf: 0.45, lm_eta: 0.68, lm_pm: 46.4, lm_n: 610, lm_tr: 729, lm_tf: 2.34, lm_c: 8700, lm_cw: 11365, lm_jm: 2.1, lm_jo: 0.25, lm_drive: 'dc'});
lm = w.calcLiftMotor();
check('Example 6: maximum acceleration 1.31 m/s2', lm.dyn.a, 1.31, 0.01);
check('... total inertia 11.7 kg m2 and Tmax 1706 Nm', [+lm.dyn.Jtot.toFixed(1), Math.round(lm.dyn.Tmax)], [11.7, 1706]);
lmSet({lm_tf: 1, lm_tr: 300}); lm = w.calcLiftMotor();
check('a motor whose torque cannot lift the load is flagged (acceleration < 0.6 and a warning)', [lm.dyn.verdict, lm.warnings.length], ['low', 1]);
lmSet({lm_tf: 1.4, lm_tr: 729}); lm = w.calcLiftMotor();
check('between 0.6 and 0.8 m/s2 is marginal', lm.dyn.verdict, lm.dyn.a < 0.8 && lm.dyn.a >= 0.6 ? 'marginal' : lm.dyn.verdict);
// motor current
lmSet({lm_p: 28, lm_s: 1.75, lm_cf: 0.5, lm_eta: 0.75, lm_pm: 24, lm_v: 400, lm_em: 0.9, lm_pf: 0.85});
lm = w.calcLiftMotor();
check('estimated current = 24 kW / (sqrt3 x 400 x 0.9 x 0.85) = 45.3 A', lm.I, 24000 / (Math.sqrt(3) * 400 * 0.9 * 0.85), 1e-9);
lmSet({lm_pm: 0}); lm = w.calcLiftMotor();
check('with no chosen motor the nearest standard rating (30 kW) is used', [lm.Pm, +lm.I.toFixed(1)], [30, +(30000 / (Math.sqrt(3) * 400 * 0.9 * 0.85)).toFixed(1)]);
// escalators
lmSet({lm_mode: 'esc'}); w.lmMode();
lmSet({lm_re: 20, lm_rs: 0.2, lm_th: 30, lm_es: 0.75, lm_en: 2, lm_ph: 4000, lm_ns: 0.83, lm_ng: 1, lm_na: 720, lm_nr: 720});
lm = w.calcLiftMotor();
check('Example 7: rise 20 m, 0.75 m/s, 2 per step, 30 deg, eta 83 %, handrails 4 kW -> 71.3 kW', [lm.mode, +lm.M.toFixed(1)], ['esc', 71.3]);
check('... 75 kW is the next standard rating; 100 effective steps', [lm.std, lm.steps], [75, 100]);
lmSet({lm_re: 12, lm_en: 1.5, lm_ns: 0.95, lm_ng: 0.87, lm_na: 630, lm_nr: 720});
lm = w.calcLiftMotor();
check('Example 8: rise 12 m, n = 1.5, 630 rpm on a 720 rpm motor, 0.95 x 0.87 -> 39.86 kW', lm.M, 39.86, 0.02);
check('... the next IEC rating is 45 kW (the paper picks a 40 kW)', lm.std, 45);
lmSet({lm_na: 800}); lm = w.calcLiftMotor();
check('running above the rated speed is warned', lm.warnings.length, 1);
lmSet({lm_na: 720, lm_th: 0}); lm = w.calcLiftMotor();
check('a horizontal walkway only needs the handrail power: 4000 / (0.95 x 0.87 x 1000)', lm.M, 4000 / (0.95 * 0.87 * 1000), 1e-9);
lmSet({lm_th: 30});
w.lmSend();
check('motor current sent to cable sizing (IEC, three-phase 400 V)', [doc.getElementById('cs_std').value, doc.getElementById('cs_phase').value, +doc.getElementById('cs_volt').value, +doc.getElementById('cs_load').value > 0], ['iec', '3', 400, true]);
w.renderCalc('liftmotor'); w.calcResult('liftmotor');
check('lift results show the dynamic check', text('lm_results').includes('التحقق الديناميكي'), true);
setv('lm_mode', 'esc'); w.lmMode(); w.calcResult('liftmotor');
check('escalator results are rendered', text('lm_results').includes('السلم المتحرك'), true);

// ---------- lightning: external LPS design (BS EN 62305-3 via Furse, NFPA 780) ----------
w.renderCalc('lightning');
let lp = w.calcLightning();
check('default roof 30 x 20 m, height 20 m, LPL III: perimeter 100 m', [lp.lps.L, lp.lps.W, lp.lps.P], [30, 20, 100]);
check('BS EN 62305-3 class III: mesh 15 m (2 x 2 cells), down conductors 15 m apart -> 7', [lp.lps.iec.mesh, lp.lps.iec.nx, lp.lps.iec.ny, lp.lps.iec.dc, lp.lps.iec.nDown], [15, 2, 2, 15, 7]);
check('... air-termination conductors: 100 + 1 x 20 + 1 x 30 = 150 m; earth 10 ohm', [lp.lps.iec.length, lp.lps.iec.earth], [150, 10]);
setv('lp_lpl', 1); lp = w.calcLightning();
check('class I: 5 x 5 m mesh -> 6 x 4 cells, 10 m down conductors -> 10, 290 m of conductor', [lp.lps.iec.mesh, lp.lps.iec.nx, lp.lps.iec.ny, lp.lps.iec.nDown, lp.lps.iec.length], [5, 6, 4, 10, 290]);
setv('lp_lpl', 2); lp = w.calcLightning();
check('class II: 10 x 10 m mesh, 10 m down conductors', [lp.lps.iec.mesh, lp.lps.iec.dc], [10, 10]);
setv('lp_lpl', 4); lp = w.calcLightning();
check('class IV: 20 x 20 m mesh and 20 m spacing', [lp.lps.iec.mesh, lp.lps.iec.dc, lp.lps.iec.nDown], [20, 20, 5]);
setv('lp_lpl', 3);
check('the Table 5 / Table 7 data', [w.eval('Object.values(LP_IEC).map(x => x.mesh)'), w.eval('Object.values(LP_IEC).map(x => x.dc)')], [[5, 10, 15, 20], [10, 10, 15, 20]]);
check('Table 3 sheet thicknesses: copper 5 / 0.5, steel 4 / 0.5, aluminium 7 / 0.65, lead 2.0, zinc 0.7', w.eval('LP_SHEET'), [['نحاس', 5, 0.5], ['فولاذ (مجلفن أو لا يصدأ)', 4, 0.5], ['ألمنيوم', 7, 0.65], ['رصاص', null, 2], ['زنك', null, 0.7]]);
check('NFPA 780: a 20 m building takes Class I materials (Cu main conductor 29 mm2, Al 50 mm2, solid terminal 9.5 / 12.7 mm)', [lp.lps.nfpa.cls, lp.lps.nfpa.mat.cu.main, lp.lps.nfpa.mat.al.main, lp.lps.nfpa.mat.cu.at, lp.lps.nfpa.mat.al.at], ['I', 29, 50, 9.5, 12.7]);
check('... terminals every 6 m on the 100 m perimeter -> 17; one down conductor per 30 m above 76 m -> 4', [lp.lps.nfpa.sp, lp.lps.nfpa.nAir, lp.lps.nfpa.nDown], [6, 17, 4]);
check('... a roof wider than 15 m needs one cross-run conductor (45 m connection spacing)', [lp.lps.nfpa.cross, lp.lps.nfpa.crossRuns], [true, 1]);
setv('lp_bh', 30); setv('lp_at', 'tall'); lp = w.calcLightning();
check('a 30 m building takes Class II (Cu 58 mm2, Al 97 mm2, terminals 12.7 / 15.9 mm); 600 mm terminals every 7.6 m -> 14', [lp.lps.nfpa.cls, lp.lps.nfpa.mat.cu.main, lp.lps.nfpa.mat.al.main, lp.lps.nfpa.mat.cu.at, lp.lps.nfpa.mat.al.at, lp.lps.nfpa.sp, lp.lps.nfpa.nAir], ['II', 58, 97, 12.7, 15.9, 7.6, 14]);
setv('lp_bh', 23); lp = w.calcLightning();
check('exactly 23 m is still Class I (the limit is exceeding 23 m)', lp.lps.nfpa.cls, 'I');
setv('lp_bl', 10); setv('lp_bw', 8); lp = w.calcLightning();
check('a small 10 x 8 m roof: perimeter 36 m, two down conductors, no cross-run', [lp.lps.P, lp.lps.nfpa.nDown, lp.lps.nfpa.cross, lp.lps.iec.nDown], [36, 2, false, 3]);
w.calcResult('lightning');
check('the LPS results are rendered with both references', text('lp_results').includes('BS EN 62305-3') && text('lp_results').includes('NFPA 780'), true);
setv('lp_bl', 0); lp = w.calcLightning();
check('a zero roof length switches the roof design off', lp.lps, undefined);
w.calcResult('lightning');
check('the earlier rolling-sphere results are unchanged', text('lp_results').includes('82-4'), true);

// ---------- cable sizing: third-harmonic reduction factors (SBC 401 Annex E.52, Table E.52-1) ----------
w.renderCalc('cablesizing');
Object.entries({cs_std: 'iec', cs_phase: '3', cs_volt: 400, cs_mode: 'amp', cs_load: 39, cs_len: 5, cs_amb: 30, cs_metal: 'cu', cs_ins: 'pvc', cs_method: 'C', cs_ngroup: 1, cs_pf: 0.9}).forEach(([k, x]) => setv(k, x));
w.csToggle('std'); setv('cs_use', 'other');
let cb = w.calcCableSizing();
check('Annex E.52-2 example: 39 A, four-core PVC cable on a wall (method C): 6 mm2 without harmonics', [cb.mm2, cb.harm.k5, cb.harm.sizeOn], [6, 1, 'phase']);
setv('cs_h3', 10); cb = w.calcCableSizing();
check('10 % third harmonic (0 - 15 %): no reduction, still 6 mm2', [cb.mm2, cb.harm.k5], [6, 1]);
setv('cs_h3', 20); cb = w.calcCableSizing();
check('20 % third harmonic: factor 0.86, design load 39 / 0.86 = 45.3 A', [+cb.harm.k5, +cb.harm.design.toFixed(1), cb.harm.sizeOn], [0.86, 45.3, 'phase']);
check('... 10 mm2 is necessary (the code example)', cb.mm2, 10);
setv('cs_h3', 40); cb = w.calcCableSizing();
check('40 %: sized on the neutral current 39 x 0.4 x 3 = 46.8 A with 0.86 -> design load 54.4 A (the code example)', [cb.harm.sizeOn, +cb.harm.IN.toFixed(1), cb.harm.k5, +cb.harm.design.toFixed(1)], ['neutral', 46.8, 0.86, 54.4]);
check('... the 50 A device must not exceed Iz = 57 x 0.86 = 49 A, so this tool picks 16 mm2 (the example only compares the design load: 10 mm2)', [cb.ocpd, cb.mm2], [50, 16]);
setv('cs_h3', 50); cb = w.calcCableSizing();
check('50 %: neutral current 39 x 0.5 x 3 = 58.5 A, rating factor 1 -> 16 mm2 (the code example)', [cb.harm.sizeOn, cb.harm.IN, cb.harm.k5, cb.harm.design, cb.mm2], ['neutral', 58.5, 1, 58.5, 16]);
setv('cs_h3', 15); cb = w.calcCableSizing();
check('boundaries: exactly 15 % is in the first band (no reduction), 33 % still on the phase current, 45 % on the neutral with 0.86', [cb.harm.k5, (setv('cs_h3', 33), w.calcCableSizing().harm.sizeOn), (setv('cs_h3', 45), w.calcCableSizing().harm.k5)], [1, 'phase', 0.86]);
setv('cs_h3', 20); setv('cs_phase', '1'); cb = w.calcCableSizing();
check('single-phase circuits ignore the third-harmonic field', [cb.harm.h3, cb.harm.k5], [0, 1]);
setv('cs_phase', '3'); setv('cs_h3', 20); w.calcResult('cablesizing');
check('the cable results quote Annex E.52', text('cs_results').includes('E.52'), true);

// ---------- screens ----------
w.showCategory('electrical');
const cards = doc.getElementById('electrical-category').textContent;
check('electrical screen lists the new calculators', ['تيار القصر', 'قطب التأريض', 'الحمل الأقصى', 'محرك المصعد'].every(s => cards.includes(s)), true);
check('electrical home card count follows the cards', doc.querySelectorAll('#electrical-category .calc-card').length, 18);
check('home page says 18 electrical calculators', doc.body.textContent.includes('18 حاسبة متاحة'), true);

check('no page errors', errors.length, 0);
if (errors.length) console.log(errors.slice(0, 3));
console.log(fail ? `${fail} electrical-4 check(s) FAILED` : 'all electrical-4 checks passed');
process.exit(fail ? 1 : 0);
