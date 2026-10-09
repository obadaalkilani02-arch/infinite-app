// Reference-code selector, part 2: UAE (Dubai Building Code 2021) and Jordan (Jordanian national codes).
//   node tests/nationalcodes2.js
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'SmartEngineering_App.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push((e.detail && e.detail.message) || e.message));
function boot(code) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/', beforeParse(win) { try { win.localStorage.setItem('si_lang', 'ar'); if (code) win.localStorage.setItem('si_code', code); } catch (e) {} } });
  const w = dom.window; w.alert = () => {}; w.confirm = () => true; w.scrollTo = () => {};
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

// ---------- selector ----------
let w = boot();
check('six codes in the selector: international, Saudi, Egypt, Syria, UAE, Jordan', [...w.document.getElementById('codeSel').options].map(o => o.value), ['intl', 'sa', 'eg', 'sy', 'ae', 'jo']);
w.setCode('ae', true);
check('UAE is persisted and restored', [w.localStorage.getItem('si_code'), boot('ae').eval('CODEREF')], ['ae', 'ae']);
check('Jordan is restored', boot('jo').eval('CODEREF'), 'jo');

// ---------- UAE: Dubai Building Code 2021 ----------
w = boot('ae');
let doc = w.document;
w.showCalc('coolingload');
doc.getElementById('cl_mode').value = 'detailed'; fire(w, doc.getElementById('cl_mode'));
check('Dubai outdoor conditions (Table H.1) are offered', !!doc.getElementById('cl_city'), true);
pick(w, 'cl_city', 0);
check('outdoor dry-bulb 46 C', +doc.getElementById('cl_odb').value, 46);
check('humidity ratio from 46 C dry-bulb / 29 C wet-bulb: 18.35 g/kg (psychrometric equation, sea level)', +doc.getElementById('cl_ow').value, 18.35, 0.15);
check('wet-bulb helper: 46 / 29 C', w.humidityRatioWB(46, 29, 0), 18.35, 0.1);
check('wet-bulb helper: saturated air at 25 C = 20.1 g/kg', w.humidityRatioWB(25, 25, 0), 20.1, 0.1);
pick(w, 'cl_indoor', 0);
check('indoor 24 C (Table H.2)', +doc.getElementById('cl_idb').value, 24);
check('... 50 % RH gives the same humidity ratio as the psychrometric helper', +doc.getElementById('cl_iw').value, +w.humidityRatioGkg(24, 50, 0).toFixed(1), 0.01);
check('the note quotes the safety factors 10 % sensible, 5 % latent and the 34 / 32 C outdoor air', ['10%', '5%', '34°C', '32°C'].every(s => doc.getElementById('calc-body').textContent.includes(s)), true);

w.renderCalc('uvalue');
const cu = doc.getElementById('cu_el');
check('UAE envelope limits offered: roof 0.3, wall and exposed floor 0.57, glazing 2.1 / 1.9 / 1.7, shopfront 1.9, skylight 1.9', [...cu.options].slice(1).map(o => +o.textContent.split('— ').pop()), [0.3, 0.57, 2.1, 1.9, 1.7, 1.9, 1.9]);
pick(w, 'cu_el', 1);
check('wall: U target 0.57', +doc.getElementById('uv_target').value, 0.57);
pick(w, 'cu_el', 0);
check('roof: U target 0.3', +doc.getElementById('uv_target').value, 0.3);

w.renderCalc('cablesizing');
check('cable sizing: IEC reference, 4 % voltage drop, 48 C ambient (Table G.3)', [doc.getElementById('cs_std').value, +doc.getElementById('cs_vdlim').value, +doc.getElementById('cs_amb').value], ['iec', 4, 48]);
check('... the note quotes G.4.7.3 and G.3', ['G.4.7.3', 'G.3', '2.0 K'].every(s => doc.getElementById('calc-body').textContent.includes(s)), true);
setv(w, 'cs_len', 250);
let cs = w.eval('calcCableSizing()');
check('a 250 m cable keeps the 4 % limit (no length allowance outside SBC)', cs.vdLimEff, 4, 1e-9);
check('... and the notes cite the Dubai code', cs.notes.some(n => n.includes('كود دبي')), true);
w.renderCalc('protcond');
check('protective conductors default to the IEC reference', doc.getElementById('pc_std').value, 'iec');
w.renderCalc('ventilation');
check('ventilation: no UAE list, the note refers to ASHRAE 62.1', [w.eval('ventLocalList()'), doc.getElementById('calc-body').textContent.includes('ASHRAE 62.1')], [null, true]);

// ---------- Jordan ----------
w = boot('jo');
doc = w.document;
check('four climate zones: 31 / 6, 38 / 10, 32 / 5 and 36 / 3 C (summer / winter)', w.eval('JO_ZONES.map(z => [z.ts, z.tw])'), [[31, 6], [38, 10], [32, 5], [36, 3]]);
check('design RH ranges (summer): 49-60, 36-42, 36-42, 30-34 %', w.eval('JO_ZONES.map(z => [z.rhMin, z.rhMax])'), [[49, 60], [36, 42], [36, 42], [30, 34]]);
w.showCalc('coolingload');
doc.getElementById('cl_mode').value = 'detailed'; fire(w, doc.getElementById('cl_mode'));
pick(w, 'cl_city', 2);
check('zone 3 (Amman, Irbid, Zarqa): 32 C', +doc.getElementById('cl_odb').value, 32);
check('... humidity ratio at 42 % RH: 12.5 g/kg', +doc.getElementById('cl_ow').value, 12.5, 0.15);
check('indoor presets: 11 rows from Table 1', doc.getElementById('cl_indoor').options.length - 1, 11);
pick(w, 'cl_indoor', 10);
check('offices 23 C', +doc.getElementById('cl_idb').value, 23);
pick(w, 'cl_indoor', 5);
check('homes 21 - 23 C: 22 C', +doc.getElementById('cl_idb').value, 22);

w.renderCalc('heatingload');
pick(w, 'hl_city', 0);
check('heating load: zone 1 winter 6 C', +doc.getElementById('hl_to').value, 6);
pick(w, 'hl_city', 3);
check('... zone 4 winter 3 C', +doc.getElementById('hl_to').value, 3);

w.renderCalc('uvalue');
const co = [...doc.getElementById('cu_el').options].slice(1).map(o => o.textContent);
check('Jordanian envelope list: 7 elements plus 12 windows (2 frames x 2 glazings x 3 exposures)', co.length, 19);
pick(w, 'cu_el', 0);
check('roof, category 1: 1.0', +doc.getElementById('uv_target').value, 1.0);
pick(w, 'cu_el', 1);
check('roof, category 2: 2.7', +doc.getElementById('uv_target').value, 2.7);
pick(w, 'cu_el', 2);
check('wall, category 1: 1.8', +doc.getElementById('uv_target').value, 1.8);
const win = co.findIndex(t => t.includes('نافذة إطار معدني') && t.includes('مزدوج') && t.includes('شديد التعرض'));
pick(w, 'cu_el', win);
check('metal-frame double glazing, severe exposure: 3.5', +doc.getElementById('uv_target').value, 3.5);
const win2 = co.findIndex(t => t.includes('نافذة خشب أو PVC') && t.includes('مفرد') && t.includes('محمي'));
pick(w, 'cu_el', win2);
check('wood or PVC single glazing, sheltered: 3.8', +doc.getElementById('uv_target').value, 3.8);

w.renderCalc('ventilation');
check('Jordanian minimum outdoor air: 10 rows, first row factories 0.8 L/s per m2', [w.eval('ventLocalList().length'), w.eval('ventLocalList()[0]')], [10, ['مصانع', 0, 0.8]]);
check('... offered in the ventilation list', doc.getElementById('calc-body').innerHTML.includes('الكودة الأردنية للتهوية الميكانيكية جدول 2'), true);

w.renderCalc('cablesizing');
check('cable sizing: the Jordanian code reference (Tables 16 - 25 and 47 - 55) and 2.5 % voltage drop', [doc.getElementById('cs_std').value, +doc.getElementById('cs_vdlim').value, +doc.getElementById('cs_amb').value], ['jo', 2.5, 40]);
setv(w, 'cs_len', 250);
cs = w.eval('calcCableSizing()');
check('... 250 m: limit stays 2.5 %', cs.vdLimEff, 2.5, 1e-9);

// ---------- Jordan: cable current-carrying capacity and voltage drop (4/5, Tables 8, 16 - 25, 47 - 55) ----------
w = boot('jo'); doc = w.document; w.renderCalc('cablesizing');
const J = w.eval('JSON.parse(JSON.stringify(JO_CABLE))');
const jo = vals => { Object.keys(vals).forEach(id => setv(w, id, vals[id])); w.csToggle(); return w.eval('calcCableSizing()'); };
const joBase = {cs_std: 'jo', cs_phase: '3', cs_volt: 400, cs_mode: 'kw', cs_load: 55, cs_pf: 0.85, cs_len: 80, cs_amb: 40, cs_ngroup: 1, cs_par: 1, cs_metal: 'cu', cs_vdlim: 2.5, cs_jo_arr: 'flat', cs_jo_c: 'no'};
check('Jordan cable tables: 10 copper families, 9 aluminium families (19 tables)', [Object.keys(J).filter(k => J[k].m === 'cu').length, Object.keys(J).filter(k => J[k].m === 'al').length], [10, 9]);
check('the copper list is offered and Table 24 (XLPE armoured, clipped direct) is the default; the IEC fields are hidden and the Jordanian fields shown', [doc.getElementById('cs_jo').options.length, doc.getElementById('cs_jo').value, doc.querySelector('.cs-iec').style.display, doc.querySelector('.cs-jo').style.display], [10, 'cu_xlpea_clip', 'none', '']);
setv(w, 'cs_metal', 'al'); w.csToggle('metal');
check('aluminium: the list switches to the nine aluminium tables and Table 54', [doc.getElementById('cs_jo').options.length, doc.getElementById('cs_jo').value], [9, 'al_xlpea_clip']);
setv(w, 'cs_metal', 'cu'); w.csToggle('metal');
check('table entries as printed: Table 16 (16 mm2), 17 (50), 19 (35), 22 (16), 24 (95), 47 (150), 54 (300)', [J.cu_pvc1_encl.rows['16'], J.cu_pvc1_clip.rows['50'], J.cu_pvcm_encl.rows['35'], J.cu_pvca_clip.rows['16'], J.cu_xlpea_clip.rows['95'], J.al_pvc1_encl.rows['150'], J.al_xlpea_clip.rows['300']],
  [[74, 2.7, 66, 2.3], [175, 0.93, 160, 0.82], [98, 1.3, 86, 1.1], [86, 2.7, 73, 2.3], [338, 0.52, 289, 0.45], [235, 0.73, 200, 0.64], [null, null, 460, 0.26]]);
check('Table 23 rows 70 - 400 read from the page image; Table 49 (air, flat and trefoil) row 50; the Table 25 misprint (0.25) replaced by 0.52', [J.cu_pvca_air.rows['240'], J.al_pvc1_air.rows['50'], J.cu_xlpea_air.rows['95']], [[485, 0.25, 420, 0.20], [155, 1.5, 1.34, 140, 1.3], [356, 0.52, 304, 0.45]]);
check('printed values that contradict their neighbours are left empty (Table 17 300 mm2 two cables, Table 51 50 mm2 three-phase)', [J.cu_pvc1_clip.rows['300'][0], J.al_pvcm_air.rows['50'][2]], [null, null]);
let bad = [];
for (const [id, f] of Object.entries(J)) {
  const sizes = Object.keys(f.rows).map(Number).sort((a, b) => a - b), cols = f.ar ? [0, 3] : [0, 2];
  for (const c of cols) { let p = null; for (const s of sizes) { const x = f.rows[s][c]; if (x == null) continue; if (p != null && x <= p) bad.push(id + ' I' + c + ' ' + s); p = x; } }
  if (!f.ar) for (const c of [1, 3]) { let p = null; for (const s of sizes) { const x = f.rows[s][c]; if (x == null) continue; if (p != null && x > p) bad.push(id + ' v' + c + ' ' + s); p = x; } }
}
check('every table: the current rises and the voltage drop falls with the conductor size (a typing check on the transcription)', bad, []);
let r = jo(joBase);
check('55 kW, 400 V, cos phi 0.85, 80 m, 40 C, Table 24: Ib 93.4 A, In 100 A, factor 0.91; 25 mm2 carries it (126 x 0.91 = 114.7) but drops 2.99 %: 35 mm2 (1.2 mV/A/m, 8.97 V = 2.24 %)', [r.mm2, +r.Ib.toFixed(1), r.ocpd, r.kT, r.kG, r.tab, +r.vdPct.toFixed(2), r.governs, r.byAmp.s], [35, 93.4, 100, 0.91, 1, 153, 2.24, 'vd', 25]);
r = jo({cs_jo: 'cu_pvca_clip'});
check('Table 22 (PVC armoured) at 40 C (0.87): 35 mm2 (119 x 0.87 = 103.5 A) and 1.1 mV/A/m = 8.22 V = 2.05 %', [r.mm2, r.kT, r.tab, +r.vdPct.toFixed(2)], [35, 0.87, 119, 2.05]);
check('ambient: PVC 28 C -> 1, 25 C -> 1.06, 66 C -> not tabulated; XLPE 25 C -> 1.04, 66 C -> 0.58 (the next printed temperature), 85 C -> not tabulated', [w.eval("joAmbFactor('pvc', 28)"), w.eval("joAmbFactor('pvc', 20)"), w.eval("joAmbFactor('pvc', 66)"), w.eval("joAmbFactor('xlpe', 25)"), w.eval("joAmbFactor('xlpe', 66)"), w.eval("joAmbFactor('xlpe', 85)")], [1, 1.06, null, 1.04, 0.58, null]);
r = jo({cs_jo: 'cu_pvca_clip', cs_amb: 66});
check('PVC at 66 C: no factor, the calculation stops with a warning', [r.invalid === true, r.warnings.length > 0], [true, true]);
r = jo({cs_jo: 'cu_pvca_clip', cs_amb: 30, cs_ngroup: 3});
check('Table 8, multi-core cables: 3 cables 0.70', r.kG, 0.70, 1e-9);
check('... 2 cables 0.80, 5 cables 0.60, 7 cables 0.52 (the next higher printed count), 21 cables 0.38 with a warning', [jo({cs_ngroup: 2}).kG, jo({cs_ngroup: 5}).kG, jo({cs_ngroup: 7}).kG, jo({cs_ngroup: 21}).kG, jo({cs_ngroup: 21}).warnings.length > 0], [0.8, 0.6, 0.52, 0.38, true]);
r = jo({cs_jo: 'cu_pvc1_clip', cs_ngroup: 2});
check('Table 8, single-core cables: two three-phase circuits = 6 loaded conductors 0.69; three circuits = 9 -> 0.59 (10 conductors); a single circuit 1', [r.kG, jo({cs_ngroup: 3}).kG, jo({cs_ngroup: 1}).kG], [0.69, 0.59, 1]);
check('... two single-phase circuits = 4 loaded conductors 0.80', jo({cs_phase: '1', cs_volt: 230, cs_ngroup: 2}).kG, 0.8, 1e-9);
setv(w, 'cs_phase', '3'); setv(w, 'cs_volt', 400);
check('cables in air (methods J, K) are spaced: no grouping factor', [jo({cs_jo: 'cu_pvcm_air', cs_ngroup: 6}).kG, jo({cs_jo: 'cu_pvc1_air', cs_ngroup: 6}).kG], [1, 1]);
r = jo({cs_jo: 'cu_pvc1_air', cs_ngroup: 1, cs_amb: 30, cs_mode: 'amp', cs_load: 150, cs_len: 20, cs_jo_arr: 'flat'});
const flat = [r.mm2, r.tab];
r = jo({cs_jo_arr: 'trefoil'});
check('single-core cables hung in air, three-phase 150 A: flat uses 195 A at 50 mm2 (0.85 mV), trefoil 170 A (0.80 mV): both 50 mm2', [flat, r.mm2, r.tab], [[50, 195], 50, 170]);
r = jo({cs_jo_arr: 'flat', cs_load: 175});
check('175 A flat: 195 A at 50 mm2 is not enough with In = 200 A: 70 mm2 (240 A)', [r.mm2, r.tab, r.ocpd], [70, 240, 200]);
r = jo({cs_jo: 'cu_xlpea_clip', cs_phase: '1', cs_volt: 230, cs_mode: 'amp', cs_load: 60, cs_len: 30, cs_amb: 30, cs_ngroup: 1});
check('single-phase 60 A, 30 m, Table 24: two-cable columns: 16 mm2 (108 A, 2.9 mV/A/m = 5.22 V = 2.27 %)', [r.mm2, r.tab, +r.vdPct.toFixed(2)], [16, 108, 2.27]);
r = jo({cs_jo: 'cu_pvc1_clip', cs_load: 470, cs_len: 1, cs_vdlim: 10});
check('single-phase 470 A on Table 17: In 500 A; 300 mm2 is empty (printed misprint) so the next, 400 mm2 (680 A), is chosen', [r.ocpd, r.mm2, r.tab], [500, 400, 680]);
setv(w, 'cs_phase', '3'); setv(w, 'cs_volt', 400); setv(w, 'cs_vdlim', 2.5);
r = jo({cs_jo: 'cu_pvc1_encl', cs_mode: 'amp', cs_load: 150, cs_len: 1, cs_amb: 30, cs_jo_c: 'no'});
const open = [r.mm2, r.tab, r.ocpd];
r = jo({cs_jo_c: 'yes'});
check('Table 16 (methods A, B, C), 150 A three-phase: In 160 A, 70 mm2 (160 A); with method C (underground ducts) the values stop at 35 mm2 (106 A): no size, with a warning', [open, !!r.chosen, r.warnings.length > 0], [[70, 160, 160], false, true]);
r = jo({cs_jo: 'cu_pvc1_encl', cs_jo_c: 'no', cs_load: 250});
check('... 250 A is beyond the table (120 mm2, 220 A): no size and a warning naming the Table', [!!r.chosen, r.warnings.some(x => x.includes('16'))], [false, true]);
r = jo({cs_jo: 'cu_pvcm_encl', cs_mode: 'amp', cs_load: 60, cs_len: 20, cs_jo_c: 'no'});
check('Table 19 (multi-core in conduit), three-phase 60 A, 20 m: In 63 A; 16 mm2 (62 A) is short, 25 mm2 (70 A) passes; 1.5 mV/A/m x 60 A x 20 m = 1.8 V', [r.mm2, r.tab, +r.dV.toFixed(2)], [25, 70, 1.8]);
setv(w, 'cs_metal', 'al'); w.csToggle('metal');
r = jo({cs_jo: 'al_xlpea_clip', cs_mode: 'kw', cs_load: 55, cs_pf: 0.85, cs_len: 80, cs_amb: 40, cs_jo_c: 'no'});
check('aluminium Table 54, the same 55 kW / 80 m / 40 C: 35 mm2 (113 A) is enough for 100 A but drops 3.55 %; 50 mm2 2.6 %; 70 mm2 (176 A, 0.99 mV) 1.85 %', [r.mm2, r.byAmp.s, +r.vdPct.toFixed(2)], [70, 35, 1.85]);
r = jo({cs_jo: 'al_pvcm_air', cs_mode: 'amp', cs_load: 100, cs_len: 1, cs_amb: 30, cs_vdlim: 10});
check('aluminium Table 51 (three-phase 50 mm2 is empty): 100 A -> In 100 A -> 70 mm2 (139 A)', [r.mm2, r.tab], [70, 139]);
setv(w, 'cs_metal', 'cu'); w.csToggle('metal');
doc.getElementById('cs_jo').value = 'cu_xlpea_clip'; setv(w, 'cs_amb', 40); setv(w, 'cs_mode', 'kw'); setv(w, 'cs_load', 55); setv(w, 'cs_len', 80); setv(w, 'cs_vdlim', 2.5); w.calcResult('cablesizing');
const csText = doc.getElementById('cs_results').textContent;
check('the results quote the table, the printed misprint notes and the 4/5/3 method', ['جدول 24', '4/5/3', '4/5', '🔴', 'عنوانا عمودي'].every(s => csText.includes(s)), true);
w.feedSendAmps({src: 'x', desc: '', I: 120, ph: 3, V: 400, contPct: 0, std: 'iec', metal: 'al', sysName: 'ثلاثي الطور 400 V'});
check('a load sent from another calculator selects the Jordanian reference and the aluminium list', [doc.getElementById('cs_std').value, doc.getElementById('cs_metal').value, doc.getElementById('cs_jo').value, +doc.getElementById('cs_load').value], ['jo', 'al', 'al_xlpea_clip', 120]);
w = boot('intl'); w.renderCalc('cablesizing');
check('other codes offer the Jordanian reference too, but start on NEC', [[...w.document.getElementById('cs_std').options].map(o => o.value), w.document.getElementById('cs_std').value, w.document.querySelector('.cs-jo').style.display], [['nec', 'iec', 'jo'], 'nec', 'none']);

// ---------- UAE: maximum demand, DBC G.4.16 and Tables G.15 / G.16 ----------
w = boot('ae');
doc = w.document;
w.renderCalc('maxdemand');
check('with the UAE code the Dubai method is selected and its block shown', [doc.getElementById('md_mode').value, doc.getElementById('md-dbc').style.display, doc.getElementById('md-iet').style.display], ['dbc', '', 'none']);
let md = w.calcMaxDemand();
check('default loads: 40 lighting points x 100 W, 30 x 13 A sockets x 200 W, 10 twin sockets = 20 points x 200 W, 2 x 3 kW, 2 x 25 kW AC, 10 kW future = 80 kW TCL', [md.mode, md.tcl], ['dbc', 80], 1e-9);
check('... demand factor 1: 80 kW needs the 160 A feeder (80 kW, Table G.15)', [md.md, md.f15.kind, md.f15.rating, md.f15.limit], [80, 'feeder', 160, 80], 1e-9);
check('... current at 400 V and cos phi 0.95: 121.6 A', md.I, 80000 / (Math.sqrt(3) * 400 * 0.95), 1e-9);
check('... lighting 4000 W -> 2 circuits of 2000 W; 50 socket points -> 10 radial (5 each) or 5 ring (10 each)', [md.lightCircuits, md.sockPts, md.radial, md.ring], [2, 50, 10, 5]);
check('... 50 kW of air conditioning: the 1000 kVA transformer (650 kW, Table G.16)', md.t16, [1000, 650]);
setv(w, 'md_ddf', 0.7); md = w.calcMaxDemand();
check('demand factor 0.7: 56 kW -> 125 A feeder (60 kW)', [md.md, md.f15.rating], [56, 125], 1e-9);
setv(w, 'md_ddf', 1);
function dbRows(rows) { doc.getElementById('db-rows').innerHTML = rows.map(r => w.dbRowHTML(r[0], r[1], r[2], r[3])).join(''); }
dbRows([['fluo', 'fluo', 10, 36], ['s15', 'sock15', 4, ''], ['light', 'light', 5, 60], ['twin', 'twin13', 1, 100]]);
md = w.calcMaxDemand();
check('fluorescent 10 x 36 W x 1.8 = 648 W, 15 A sockets 4 x 1000 W (commercial), lighting 5 x 60 W, one twin socket 2 x 200 W (a lower entry is raised to 200 W)', md.tcl, (648 + 4000 + 300 + 400) / 1000, 1e-9);
setv(w, 'md_dprem', 'res'); md = w.calcMaxDemand();
check('residential: 15 A sockets at 500 W', md.tcl, (648 + 2000 + 300 + 400) / 1000, 1e-9);
dbRows([['big', 'equip', 1, 120]]); md = w.calcMaxDemand();
check('a 120 kW unit is above 100 kW (DEWA approval note); 120 kW needs the 300 A feeder (150 kW)', [md.maxUnit, md.f15.rating], [120, 300]);
dbRows([['huge', 'equip', 1, 1500]]); md = w.calcMaxDemand();
check('1500 kW exceeds Table G.15: no entry', md.f15, null);
dbRows([['ac', 'ac', 10, 80]]); md = w.calcMaxDemand();
check('800 kW of air conditioning: 1500 kVA transformer (950 kW); 1000 kW has no entry', [md.t16, (dbRows([['ac', 'ac', 10, 100]]), w.calcMaxDemand().t16)], [[1500, 950], null]);
dbRows([['ac', 'ac', 2, 25], ['e', 'equip', 1, 20]]); w.calcResult('maxdemand');
check('results show G.15, G.16 and G.4.16', ['G.15', 'G.16', 'G.4.16'].every(s => doc.getElementById('md_results').textContent.includes(s)), true);
w.mdSend();
check('the maximum demand current goes to the cable-sizing calculator (IEC, 400 V)', [doc.getElementById('cs_std').value, +doc.getElementById('cs_load').value, +doc.getElementById('cs_volt').value], ['iec', +(70000 / (Math.sqrt(3) * 400 * 0.95)).toFixed(2), 400]);
w = boot('intl'); w.renderCalc('maxdemand');
check('other codes keep the IET method as the default (the Dubai method stays available)', [w.document.getElementById('md_mode').value, [...w.document.getElementById('md_mode').options].length], ['iet', 3]);

// ---------- Jordan: water supply and sanitary drainage notes ----------
w = boot('jo');
doc = w.document;
w.renderCalc('fixtureunits'); w.calcResult('fixtureunits');
let bodyText = doc.getElementById('calc-body').textContent;
check('Jordan, fixture units: the water-supply and drainage tables are quoted (Tables 2, 3, 1, 4, 5, 6, N = sqrt(n-1) + 1)', ['الكودة الأردنية لتزويد المباني بالمياه', 'الكودة الأردنية للتصريف الصحي', 'جدول 4', '8400', '1 : 60', '√(n − 1) + 1'].every(s => bodyText.includes(s)), true);
w.renderCalc('booster'); w.calcResult('booster');
check('Jordan, booster: minimum 0.20 bar and maximum 1.0 bar at the fixtures', ['0.20 bar', '1.0 bar'].every(s => doc.getElementById('calc-body').textContent.includes(s)), true);
w = boot('sa'); w.renderCalc('fixtureunits'); w.calcResult('fixtureunits');
check('Saudi notes are unchanged (SBC) and carry no Jordanian text', [w.document.getElementById('calc-body').textContent.includes('SBC 701-18'), w.document.getElementById('calc-body').textContent.includes('الكودة الأردنية')], [true, false]);

// ---------- lighting, lifts, fire: Dubai H.7 and the Jordanian codes ----------
w = boot('jo'); doc = w.document;
w.renderCalc('lightingcalc');
const ltLuxOf = key => { const sel = doc.querySelector('#lt-tbody .lt-space'); sel.value = key; w.ltSpaceChange(sel); return +doc.querySelector('#lt-tbody .lt-lux').value; };
check('Jordan lighting, Table 4: meeting 750, deep-plan office 750, office 500, retail 500, classroom 500, kitchen 500', ['meeting', 'office_open', 'office', 'retail', 'classroom', 'kitchen'].map(ltLuxOf), [750, 750, 500, 500, 500, 500]);
check('... bathroom 100, bedroom 50, living room 50, hotel room 50, hotel entrance hall 75, stairs 100, mosque 150', ['bathroom', 'bedroom', 'living', 'hotelroom', 'hotellobby', 'stairway', 'mosque'].map(ltLuxOf), [100, 50, 50, 50, 75, 100, 150]);
check('... spaces the code does not cover keep the reference value (warehouse 100, operating room 1000)', ['warehouse', 'operating'].map(ltLuxOf), [100, 1000]);
check('the Jordanian lighting note is shown', doc.getElementById('calc-body').textContent.includes('جدول 4') && doc.getElementById('calc-body').textContent.includes('750'), true);
w = boot('intl'); doc = w.document; w.renderCalc('lightingcalc');
const ltI = key => { const sel = doc.querySelector('#lt-tbody .lt-space'); sel.value = key; w.ltSpaceChange(sel); return +doc.querySelector('#lt-tbody .lt-lux').value; };
check('international: meeting 300, bedroom 150 (unchanged reference values)', ['meeting', 'bedroom'].map(ltI), [300, 150]);
w = boot('ae'); doc = w.document; w.renderCalc('lightingcalc');
check('UAE lighting: building-area list from Table H.15 (7.5 / 7.8 / 8.9 / 9.8 / 4.9 / 6.9 W/m2)', w.eval('lpdBuildingList().map(b => b[1])'), [7.5, 7.8, 8.9, 9.8, 4.9, 6.9]);
check('... offered in the selector with the Dubai label and the H.7 note (108 lux stairs, 10.8 lux floors, 25 %)', ['كود دبي جدول H.15', '108', '10.8', '25%'].every(s => doc.getElementById('calc-body').textContent.includes(s)), true);
doc.getElementById('lt_bldg').value = '3'; w.calcResult('lightingcalc');
check('selecting retail / malls / workshops (9.8 W/m2) works without errors', doc.getElementById('lt_results').textContent.length > 0, true);
w = boot('sa'); w.renderCalc('lightingcalc');
check('Saudi keeps the SBC 601 list (33 building types)', w.eval('lpdBuildingList().length'), 33);

w = boot('jo'); doc = w.document; w.renderCalc('elevatorfeeder');
const ef = n => { doc.getElementById('ef_n').value = String(n); return w.calcElevatorFeeder(); };
check('Jordan lifts, Table 6: 1 and 2 lifts 1.0, 3 lifts 0.9, 4 lifts 0.8, more than 4: no reduction', [1, 2, 3, 4, 5, 8].map(n => ef(n).df), [1, 1, 0.9, 0.8, 1, 1]);
check('... 3 lifts x 60 A x 0.9 = 162 A; 4 lifts 192 A', [ef(3).I, ef(4).I], [162, 192]);
w.calcResult('elevatorfeeder');
check('results name the Jordanian table', doc.getElementById('ef_results').textContent.includes('جدول 6'), true);
w = boot('intl'); w.renderCalc('elevatorfeeder'); w.document.getElementById('ef_n').value = '4';
check('international keeps NEC 620.14 (4 lifts 0.85)', w.calcElevatorFeeder().df, 0.85);

w = boot('jo'); doc = w.document; w.renderCalc('alarmbattery');
check('Jordan alarm battery: the Jordanian type is selected, 24 h standby and 30 min alarm', [doc.getElementById('ab_type').value, +doc.getElementById('ab_hours').value, +doc.getElementById('ab_min').value], ['jo', 24, 30]);
let ab = w.calcAlarmBattery();
check('... 30 minutes of alarm in the calculation', [ab.hours, ab.minutes, ab.ref], [24, 30, '2/10/3']);
w = boot('intl'); doc = w.document; w.renderCalc('alarmbattery');
check('international: NFPA 72 type, 5 minutes, and the Jordanian type is not offered', [doc.getElementById('ab_type').value, +doc.getElementById('ab_min').value, [...doc.getElementById('ab_type').options].some(o => o.value === 'jo')], ['fa', 5, false]);

w = boot('jo'); doc = w.document; w.renderCalc('sprinkler'); w.calcResult('sprinkler');
bodyText = doc.getElementById('calc-body').textContent;
check('Jordan sprinklers: Table 10 (1890 - 2830, 2650 - 3780 L/min), Table 17 K and Tables 13 / 14', ['1890', '2650', '110 – 120', '275', '170', 'NFPA 13'].every(s => bodyText.includes(s)), true);
w = boot('sa'); w.renderCalc('sprinkler'); w.calcResult('sprinkler');
check('Saudi sprinkler results now show the SBC 801 note too (914.3.2)', w.document.getElementById('calc-body').textContent.includes('914.3.2'), true);
w = boot('intl'); w.renderCalc('sprinkler'); w.calcResult('sprinkler');
check('international: no code note under the sprinkler results', w.document.getElementById('calc-body').textContent.includes('الكودة الأردنية'), false);

// ---------- Jordan: lightning risk index, central heating, fire-code occupant loads ----------
w = boot('jo'); doc = w.document; w.renderCalc('lightning'); w.calcResult('lightning');
let jr = w.calcJoRisk();
check('Jordan lightning, defaults: office 7 + reinforced concrete 2 + ordinary contents 2 + sparse area 5 + flat 2 + 20 m (8) + 10 days (11) = 37 < 40: not necessary', [jr.A, jr.B, jr.C, jr.D, jr.E, jr.F, jr.G, jr.sum, jr.required], [7, 2, 2, 5, 2, 8, 11, 37, false]);
doc.getElementById('jr_a').value = '5'; jr = w.calcJoRisk();
check('a school or hospital (A = 10): 40, protection required', [jr.A, jr.sum, jr.required], [10, 40, true]);
doc.getElementById('jr_a').value = '0'; doc.getElementById('jr_chim').value = 'yes'; jr = w.calcJoRisk();
check('a brick or concrete chimney 4.5 m or more above the roof is protected whatever the sum', [jr.sum < 40, jr.required, jr.chimney], [true, true, true]);
doc.getElementById('jr_chim').value = 'no';
const jf = h => { doc.getElementById('jr_h').value = String(h); const r = w.calcJoRisk(); return [r.F, r.fOver]; };
check('Table 6 heights: 9 m -> 2, 10 -> 4, 15 -> 4, 18 -> 5, 24 -> 8, 30 -> 11, 38 -> 16, 46 -> 22, 53 -> 30, 54 m -> 30 with a warning', [9, 10, 15, 18, 24, 30, 38, 46, 53, 54].map(jf), [[2, false], [4, false], [4, false], [5, false], [8, false], [11, false], [16, false], [22, false], [30, false], [30, true]]);
const jg = d => { doc.getElementById('jr_days').value = String(d); const r = w.calcJoRisk(); return [r.G, r.gGap]; };
check('Table 7 days: 3 -> 2, 5 -> 5, 8 -> 11 (band not printed, warning), 10 -> 11, 13 -> 14, 17 -> 17, 20 -> 20, 25 -> 21', [3, 5, 8, 10, 13, 17, 20, 25].map(jg), [[2, false], [5, false], [11, true], [11, false], [14, false], [17, false], [20, false], [21, false]]);
doc.getElementById('jr_h').value = '20'; doc.getElementById('jr_days').value = '10';
const dn = (l, wd, h) => { doc.getElementById('lp_bl').value = String(l); doc.getElementById('lp_bw').value = String(wd); doc.getElementById('lp_bh').value = String(h); return w.calcJoRisk().down; };
check('down conductors, 3/2/3: 30 x 20 m (600 m2, 100 m perimeter) -> min(1 + 2, 4) = 3; 10 x 8 m (80 m2) -> 1; 100 x 60 m -> min(1 + 20, 11) = 11', [dn(30, 20, 20).n, dn(10, 8, 20).n, dn(100, 60, 20).n], [3, 1, 11]);
check('a building higher than 30 m is flagged for clause 3/3/1', [dn(30, 20, 20).tall, dn(30, 20, 35).tall], [false, true]);
w.calcResult('lightning');
check('the results show the sum, the decision and the sizes (3 x 20 mm tape, 10 mm rod, 10 ohm)', ['المجموع', '3 × 20', '10 Ω', '18 م'].every(s => doc.getElementById('jr_results').textContent.includes(s)), true);
w = boot('intl'); w.renderCalc('lightning'); w.calcResult('lightning');
check('other codes have no risk-index block', w.document.getElementById('jr_results'), null);

w = boot('jo'); doc = w.document; w.renderCalc('heatingload');
check('Jordan heating load: ten indoor presets (Table 1) and the height-addition note', [doc.querySelector('#hl-rooms .hl-room select').options.length - 1, doc.getElementById('calc-body').textContent.includes('4.2 م: 2%')], [10, true]);
const hs = doc.querySelector('#hl-rooms .hl-room select'); hs.value = '19'; hs.dispatchEvent(new w.Event('change', { bubbles: true }));
check('choosing classrooms (18 - 20 C) sets 19 C', +doc.querySelector('#hl-rooms .hl-ti').value, 19);
check('Table 2 has 12 heights from 4.2 to 11.0 m: 2 / 3 % at 4.2 m and 24 / 36 % at 11 m', [w.eval('JO_HEIGHT_ADD.length'), w.eval('JO_HEIGHT_ADD[0]'), w.eval('JO_HEIGHT_ADD[11]')], [12, [4.2, 2, 3], [11.0, 24, 36]]);
w.renderCalc('heatingpipes');
check('Jordan heating pipes: 82 / 72 C by default (Table 5) and the Table 7 velocities', [+doc.getElementById('hp_ts').value, +doc.getElementById('hp_tr').value, w.eval('Object.keys(JO_PIPE_V).length')], [82, 72, 11]);
const hp = w.calcHeatingPipes();
check('every selected pipe stays within its Table 7 velocity (1.7068 m/s above 150 mm)', hp.rows.filter(r => r.kw > 0 && r.sel).every(r => r.sel.V <= (w.eval('JO_PIPE_V')[r.sel.dn] || 1.7068) + 1e-9), true);
w.renderCalc('radiators');
check('Jordan radiators: 82 / 74 C (8 K at the radiator)', [+doc.getElementById('rd_ts').value, +doc.getElementById('rd_tr').value], [82, 74]);
w = boot('sy'); w.renderCalc('heatingpipes');
check('Syria keeps 80 / 60 C and the 1.2 m/s rule', [+w.document.getElementById('hp_ts').value, +w.document.getElementById('hp_tr').value], [80, 60]);
w = boot('jo'); w.renderCalc('ventilation');
check('Jordan ventilation note quotes the occupant load factors (0.6, 1.5, 18, 100 and 60 persons per unit)', ['0.6', '1.5', '18', '60 للأدراج'].every(s => w.document.getElementById('calc-body').textContent.includes(s)), true);

// ---------- Jordan: earthing code, protective conductors (Tables 1-7) and earth electrodes (Tables 8-11) ----------
w = boot('jo'); doc = w.document; w.renderCalc('protcond');
check('Jordan protective conductors: the Jordanian earthing code is the default and its block is shown', [doc.getElementById('pc_std').value, doc.getElementById('pc-jo').style.display, doc.getElementById('pc-iec').style.display], ['jo', '', 'none']);
let pj = w.calcProtCond();
check('default: 50 mm2 phase, separate insulated copper PVC (Table 2 k = 143), 10 kA, 0.2 s -> 31.27 mm2 -> 35 mm2', [pj.k, pj.sCalc, pj.sPick], [143, 10000 * Math.sqrt(0.2) / 143, 35], 0.01);
check('... Table 6: 50 mm2 -> 16; Table 7: earthing lead 16, continuity conductor 16, bonding lead 6; main bonding half of 16 = 8 -> 10 mm2', [pj.t6, pj.t7.row, pj.bondMainStd], [16, [50, 16, 16, 6], 10]);
const pjSet = (kind, mat, col, extra) => { setv(w, 'pj_kind', kind); w.pjKind(); setv(w, 'pj_mat', mat); setv(w, 'pj_ins', col); Object.keys(extra || {}).forEach(id => setv(w, id, extra[id])); return w.calcProtCond(); };
check('Table 2 (separate): copper 143 / 166 / 176, aluminium 95 / 110 / 116, steel 52 / 60 / 64 for PVC / rubber / thermosetting', [0, 1, 2].map(c => pjSet('sep', 'cu', c).k).concat([0, 1, 2].map(c => pjSet('sep', 'al', c).k), [0, 1, 2].map(c => pjSet('sep', 'steel', c).k)), [143, 166, 176, 95, 110, 116, 52, 60, 64]);
check('Table 3 (core of a cable): copper 115 / 134 / 143, aluminium 76 / 89 / 94', [0, 1, 2].map(c => pjSet('core', 'cu', c).k).concat([0, 1, 2].map(c => pjSet('core', 'al', c).k)), [115, 134, 143, 76, 89, 94]);
check('Table 4 (sheath or armour): steel 44 / 44 / 54, aluminium 81 / 93 / 98, lead 22 / 26 / 27', [0, 1, 2].map(c => pjSet('arm', 'steel', c).k).concat([0, 1, 2].map(c => pjSet('arm', 'al', c).k), [0, 1, 2].map(c => pjSet('arm', 'lead', c).k)), [44, 44, 54, 81, 93, 98, 22, 26, 27]);
check('... the material list follows the table (armour: steel, aluminium, lead)', (pjSet('arm', 'steel', 0), [...doc.getElementById('pj_mat').options].map(o => o.value)), ['steel', 'al', 'lead']);
check('Table 5 (bare): copper 228 / 159 / 138 at 500 / 200 / 150 C, aluminium 125 / 105 / 91, steel 82 / 58 / 50', [0, 1, 2].map(c => pjSet('bare', 'cu', c).k).concat([0, 1, 2].map(c => pjSet('bare', 'al', c).k), [0, 1, 2].map(c => pjSet('bare', 'steel', c).k), [0, 1, 2].map(c => pjSet('bare', 'cu', c).tf), [0, 1, 2].map(c => pjSet('bare', 'al', c).tf)), [228, 159, 138, 125, 105, 91, 82, 58, 50, 500, 200, 150, 300, 200, 150]);
pj = pjSet('sep', 'cu', 0, {pj_i: 0.1, pj_t: 0.2, pj_part: 'no', pj_mech: 'yes'});
check('a 0.1 kA fault needs 0.31 mm2 but a separate conductor is at least 2.5 mm2 with mechanical protection and 4 mm2 without', [pj.sPick, pjSet('sep', 'cu', 0, {pj_mech: 'no'}).sPick], [2.5, 4]);
pjSet('sep', 'cu', 0, {pj_part: 'yes', pj_mech: 'yes'});
check('Table 6: S <= 16 -> S/2 (10 mm2 -> 6, 16 -> 10), 25 to 50 -> 16, 70 to 150 -> 50, 185 to 630 -> 70', [10, 16, 25, 35, 50, 70, 95, 150, 185, 240, 630].map(s => setv(w, 'pj_s', s) || w.calcProtCond().t6), [5, 8, 16, 16, 16, 50, 50, 50, 70, 70, 70]);
check('Table 7: 1.5 -> (6, 1, 1), 6 -> (6, 2.5, 1), 16 -> (6, 6, 2.5), 50 -> (16, 16, 6), 150 -> (50, 50, 16), 630 -> (70, 70, 50)', [1.5, 6, 16, 50, 150, 630].map(s => (setv(w, 'pj_s', s), w.calcProtCond().t7.row.slice(1))), [[6, 1, 1], [6, 2.5, 1], [6, 6, 2.5], [16, 16, 6], [50, 50, 16], [70, 70, 50]]);
setv(w, 'pj_s', 6); w.calcResult('protcond');
check('the results quote Table 1 (16 and 25 mm2 buried), the 6 mm2 main bonding and the supplementary bonding clause', ['الجدول 1', '25 mm²', '6 mm²', '2/4/3'].every(s => doc.getElementById('pc_results').textContent.includes(s)), true);
w = boot('sa'); w.renderCalc('protcond');
const wi = boot('intl'); wi.renderCalc('protcond');
check('other codes keep their defaults (Saudi IEC, international NEC) and still offer the Jordanian option', [w.document.getElementById('pc_std').value, wi.document.getElementById('pc_std').value, [...w.document.getElementById('pc_std').options].map(o => o.value)], ['iec', 'nec', ['nec', 'iec', 'jo']]);

w = boot('jo'); doc = w.document; w.renderCalc('earthelectrode');
check('Jordan earth electrodes: Table 8 soils (marsh 30, loam / arable 100, wet sand 200, dry gravel 500, dry sand 1000, stony 3000), loam by default', [Object.values(w.eval('JO_SOIL')).map(s => s[2]), doc.getElementById('ea_soil').value, +doc.getElementById('ea_rho').value], [[30, 100, 200, 500, 1000, 3000], 'loam', 100]);
let ea = w.calcEarthElectrode();
check('horizontal conductor 40 m, 0.8 m deep, 10 mm (Table 11): 4.63 ohm at 100 ohm.m', ea.jo.R, 4.628, 0.01);
setv(w, 'ea_shape', 'ring'); ea = w.calcEarthElectrode();
check('ring of 40 m perimeter, same depth and wire: 5.05 ohm', ea.jo.R, 5.049, 0.01);
setv(w, 'ea_type', 'rods'); w.eaType(); ea = w.calcEarthElectrode();
check('one 3 m rod of 25.4 mm (Table 11): 31.0 ohm; Table 9 says about 30 ohm', [+ea.jo.R1.toFixed(2), ea.jo.t9rows[2][1]], [31.04, 30]);
setv(w, 'ea_n', 2); setv(w, 'ea_sp', 5); ea = w.calcEarthElectrode();
check('two rods 5 m apart are closer than 2L = 6 m: warning; at 6 m: no warning', [ea.warnings.some(x => x.includes('ضعف طول القضيب')), (setv(w, 'ea_sp', 6), w.calcEarthElectrode().warnings.some(x => x.includes('ضعف طول القضيب')))], [true, false]);
check('Table 9 is scaled by rho / 100: in 200 ohm.m a 1, 2, 3, 5 m rod gives 140, 80, 60, 40 ohm', (setv(w, 'ea_soil', 'wetsand'), w.eaSoil(), w.calcEarthElectrode().jo.t9rows.map(r => r[1])), [140, 80, 60, 40]);
setv(w, 'ea_type', 'plate'); w.eaType(); setv(w, 'ea_soil', 'loam'); w.eaSoil(); setv(w, 'ea_pa', 0.5); setv(w, 'ea_pb', 1); ea = w.calcEarthElectrode();
check('plates: 0.5 x 1 m gives 35 ohm and 1 x 1 m 25 ohm (Table 9, 100 ohm.m); another size has no table entry', [ea.jo.R, (setv(w, 'ea_pa', 1), w.calcEarthElectrode().jo.R), (setv(w, 'ea_pa', 0.7), w.calcEarthElectrode().jo.R)], [35, 25, null]);
setv(w, 'ea_type', 'ring'); w.eaType(); setv(w, 'ea_mat', 'h_gs_strip'); w.calcResult('earthelectrode');
check('the results quote Table 10 (100 mm2 and 3 mm for a galvanised strip) and the Table 9 / 11 block', ['الجدول 10', '100 mm²', '3 mm', 'الجدولان 9 و11'].every(s => doc.getElementById('ea_results').textContent.includes(s)), true);
w = boot('sa'); w.renderCalc('earthelectrode');
check('other codes keep the SBC soil list and have no Jordanian block', [w.eval('Object.keys(eaSoilTable()).length'), w.calcEarthElectrode().jo], [Object.keys(boot('intl').eval('EA_SOIL')).length, undefined]);

// ---------- Jordan: hot water (water supply code, chapter 4) ----------
w = boot('jo'); doc = w.document; w.renderCalc('heater');
check('Jordan heater: the minimum-storage inputs are offered and give no check by default', [!!doc.getElementById('h_persons'), !!doc.getElementById('h_units'), w.calcHeater().jo.checked], [true, true, false]);
setv(w, 'h_persons', 10); let hh = w.calcHeater().jo;
check('10 persons: 45 L each = 450 L, met by the selected tank', [hh.byPersons, hh.minStorage, hh.ok], [450, 450, true]);
setv(w, 'h_persons', 100); hh = w.calcHeater().jo;
check('100 persons: 4500 L is more than the selected 2000 L tank', [hh.minStorage, hh.ok], [4500, false]);
setv(w, 'h_persons', 0); setv(w, 'h_units', 10); hh = w.calcHeater().jo;
check('10 dwelling units: 135 L each = 1350 L', [hh.byUnits, hh.minStorage, hh.ok], [1350, 1350, true]);
setv(w, 'h_units', 20); setv(w, 'h_persons', 10);
check('the larger of the two governs: 20 units = 2700 L over 10 persons = 450 L', w.calcHeater().jo.minStorage, 2700);
w.calcResult('heater');
bodyText = doc.getElementById('calc-body').textContent;
check('the results show the check and the note quotes 45 L, 135 L, 65 C, Table 7 (0.40 L/s bath), Table 8 and the Table 9 dead legs (3 m and 2 m)', ['4/2/1', '45 لتر', '135 لتر', '65°C', '0.40', 'جدول 8', 'جدول 9', '3 m', '2 m'].every(s => bodyText.includes(s)), true);
setv(w, 'h_tout', 70);
check('a stored temperature above 65 C is flagged', w.calcHeater().jo.hot, true);
w.renderCalc('dhwrecirc'); w.calcResult('dhwrecirc');
check('the recirculation results quote Table 9 and the return line', ['جدول 9', '15 mm'].every(s => doc.getElementById('calc-body').textContent.includes(s)), true);
w = boot('intl'); w.renderCalc('heater');
check('other codes: no Jordanian storage inputs', [w.document.getElementById('h_persons'), w.calcHeater().jo], [null, undefined]);

// ---------- Jordan: water storage (Table 1), rain (7/2, Tables 10-13), grease (4/5, Table 9), loading units (Tables 4-6) ----------
w = boot('jo'); doc = w.document; w.renderCalc('waterconsumption');
check('Jordan storage: Table 1 has 11 lines (1000 L per dwelling, 135 per hotel bed, 90 hostel, 7 per meal, 600 hospital, 90 / 30 boarding / day school, 10 cinema, 3 per m2 or 30 per person offices, 10 mosque)', w.eval('JO_STORAGE.map(r => r[2])'), [1000, 135, 90, 7, 600, 90, 30, 10, 3, 30, 10]);
check('... one input per line', [...Array(11).keys()].every(i => !!doc.getElementById('wj_q' + i)), true);
let wc = w.calcWaterConsumption();
check('default MEWA rows: 59.2 m3 per day; nothing entered in Table 1 -> the daily consumption governs and the tanks (3 + 9 days) hold it', [+wc.totalM3.toFixed(1), wc.jo.tableM3, +wc.jo.req.toFixed(1), wc.jo.ok], [59.2, 0, 59.2, true]);
setv(w, 'wj_q0', 100); wc = w.calcWaterConsumption();
check('100 dwelling units = 100 m3 per day (1 m3 each): the Table 1 value governs', [wc.jo.tableM3, wc.jo.req, wc.jo.ok], [100, 100, true]);
setv(w, 'wj_q0', 1000); setv(w, 'wj_q8', 5000); setv(w, 'wj_q3', 200); wc = w.calcWaterConsumption();
check('1000 units + 5000 m2 of offices (3 L) + 200 meals (7 L) = 1000 + 15 + 1.4 m3 exceeds the 710.4 m3 stored', [+wc.jo.tableM3.toFixed(1), wc.jo.ok], [1016.4, false]);
w.calcResult('waterconsumption');
bodyText = doc.getElementById('calc-body').textContent;
check('the results quote 3/2/2, the tank clauses (100 mm float, 3 m / 15 m / 2 m distances)', ['3/2/2', 'جدول 1', '100 mm', '15 m', '2 m', '❌'].every(s => bodyText.includes(s)), true);
w = boot('intl'); w.renderCalc('waterconsumption');
check('other codes: no Jordanian storage inputs', [w.document.getElementById('wj_q0'), w.calcWaterConsumption().jo], [null, undefined]);
w = boot('jo'); doc = w.document; w.renderCalc('raindrain'); w.calcResult('raindrain');
bodyText = doc.getElementById('calc-body').textContent;
check('Jordan rain: default 1.97 in/hr (50 mm/hr) and the note gives 50 / 75 mm/hr, 1 % / 0.5 %, Table 10 (100 / 150 / 200 m2), Tables 11 and 12 gutters, Table 13 outlets and the 6 m2 exemption', [+doc.getElementById('rd_i').value, ['50 mm/ساعة', '75 mm/ساعة', '0.5%', '150 m²', '200 m²', '170', '110', '75–75', '6 m²'].every(s => bodyText.includes(s) || bodyText.includes(s.replace('–', ' و')))], [1.97, true]);
w = boot('intl'); w.renderCalc('raindrain');
check('other codes keep 4 in/hr', +w.document.getElementById('rd_i').value, 4);
w = boot('jo'); doc = w.document; w.renderCalc('grease'); w.calcResult('grease');
bodyText = doc.getElementById('calc-body').textContent;
check('Jordan grease: 1.3 - 3.5 L/s per unit, Table 9 (1.26 / 1.58 / 2.21 / 3.15 L/s for 1 - 4 fixtures), at most 4 fixtures, 50 % when the inlet is 1.2 m lower, 50 mm seal', ['1.3 لتر', '3.5 لتر', '1.26', '1.58', '2.21', '3.15', '1.2 m', '50%', '50 mm'].every(s => bodyText.includes(s)), true);
w.renderCalc('fixtureunits'); w.calcResult('fixtureunits');
bodyText = doc.getElementById('calc-body').textContent;
check('Jordan fixture units note adds the loading units (Tables 4 and 5), the equivalent lengths (Table 6) and the pressure-loss relation', ['جدول 4 الوحدات لكل قطعة', 'مرحاض بصمام دفاق 6 / 10', 'جدول 5', 'كوع 90° قياسي 0.6', 'محبس كروي 4.6', '9.8 × 10³'].every(s => bodyText.includes(s)), true);

// ---------- lift selection (Jordanian lifts code, Tables 2, 3, 4, 16, 17) ----------
w = boot('jo'); doc = w.document; w.renderCalc('liftplan');
let lp = w.calcLiftPlan();
check('the code example 1: 8 floors above ground (9 served), 925 m2 each at 10 m2 per person = 740 people, 12 % = 88.8 persons per 5 minutes', [lp.pop, +lp.req.toFixed(1), +lp.travel.toFixed(1)], [740, 88.8, 26.4]);
check('... travel 26.4 m for a large office: 1.6 m/s (Table 2)', lp.speed.speed, 1.6);
check('... three 1000 kg lifts at 1.6 m/s: 93 persons, 33 s (Table 3)', [lp.pick.cars, lp.pick.load, lp.pick.speed, lp.pick.cap, lp.pick.interval], [3, 1000, 1.6, 93, 33]);
check('... 33 s is acceptable (45 s limit) and the 2-car 2.5 m/s options fail on capacity', [lp.pick.rating, lp.cands.filter(c => c.cars === 2).every(c => !c.capOk)], ['ok', true]);
setv(w, 'lp_base', 'yes'); lp = w.calcLiftPlan();
check('with a basement level served: capacity x 0.8, interval x 1.2 -> 3 lifts of 1250 kg at 2.5 m/s (91 persons, 39.6 s)', [lp.pick.cars, lp.pick.load, lp.pick.speed, +lp.pick.cap.toFixed(1), +lp.pick.interval.toFixed(1)], [3, 1250, 2.5, 91.2, 39.6]);
setv(w, 'lp_base', 'no');
setv(w, 'lp_n', 16); setv(w, 'lp_h', 3.2); setv(w, 'lp_h1', 5.5); setv(w, 'lp_pop', 1080); setv(w, 'lp_start', 'uniform'); w.lpStart(); lp = w.calcLiftPlan();
check('the code example 2: 16 floors, 1080 people at 17 % = 183.6 persons, travel 50.3 m -> 3.5 m/s', [+lp.req.toFixed(1), +lp.travel.toFixed(1), lp.speed.speed], [183.6, 50.3, 3.5]);
check('... six 1600 kg (21 persons) lifts: 195 persons per 5 minutes, interval 25 s', [lp.pick.cars, lp.pick.load, lp.pick.speed, lp.pick.cap, lp.pick.interval], [6, 1600, 3.5, 195, 25]);
setv(w, 'lp_pop', 0); setv(w, 'lp_n', 5); lp = w.calcLiftPlan();
check('Tables 3 and 4 cover 6 to 18 floors only', [lp.cover, lp.cands.length, (setv(w, 'lp_n', 19), w.calcLiftPlan().cover)], [false, 0, false]);
setv(w, 'lp_n', 7); lp = w.calcLiftPlan();
check('7 floors, 3 cars, 1000 kg: the printed interval (25 s) contradicts the capacity (107) and is left out; 1250 kg: 31 s / 122', [lp.cands.find(c => c.cars === 3 && c.load === 1000).interval, lp.cands.find(c => c.cars === 3 && c.load === 1250).interval, lp.cands.find(c => c.cars === 3 && c.load === 1250).cap], [null, 31, 122]);
setv(w, 'lp_n', 10);
check('10 floors, 3 cars, 1.6 m/s, 1250 kg: the printed 83 s interval (for 97 persons) is left out', w.calcLiftPlan().cands.find(c => c.cars === 3 && c.speed === 1.6 && c.load === 1250).interval, null);
setv(w, 'lp_n', 9);
check('office quality: one lift per 3 / 4 / 5 floors for 9 floors = 3 / 3 / 2', w.calcLiftPlan().quality.map(q => q.cars), [3, 3, 2]);
check('Table 3 has 11 rows, Table 4 has 33 rows, and every capacity is within 15 % of 300 x 0.8 x persons / interval', [w.eval('JO_LP_PERF.filter(r => r[0] <= 9).length'), w.eval('JO_LP_PERF.filter(r => r[0] >= 10).length'), w.eval('JO_LP_PERF.every(r => Object.keys(r[3]).every(l => { const [i, c] = r[3][l]; return i == null || Math.abs(c - 300 * 0.8 * JO_LP_PERSONS[l] / i) / c < 0.15; }))')], [11, 33, true]);
setv(w, 'lp_type', 'res'); lp = w.calcLiftPlan();
check('apartments: 26.4 m -> 1.0 m/s (light-duty row to 35 m)', [lp.speed.speed, lp.t2.length], [1, 5]);
setv(w, 'lp_type', 'hosp'); lp = w.calcLiftPlan();
check('hospitals: only the bed / passenger lifts are listed (12, 45, 40 m as printed) and none reaches 26.4 m at the lowest speed', [lp.t2.map(x => x.max), lp.speed.speed], [[12, 45, 40], 1]);
setv(w, 'lp_type', 'loff');
const land = (gk, ga) => { setv(w, 'lp_gk', gk); setv(w, 'lp_ga', ga); return w.calcLiftPlan().landing.depth; };
check('Table 16, Cd = 1400: other buildings single 2100, side by side 2400, facing 2800; residential single 1400, group 1500; bed lifts single 2100, facing 2800', [land('non', 'single'), land('non', 'side'), land('non', 'face'), land('res', 'single'), land('res', 'side'), land('bed', 'single'), land('bed', 'face')], [2100, 2400, 2800, 1400, 1500, 2100, 2800]);
setv(w, 'lp_cd', 2500); setv(w, 'lp_cd2', 2500);
check('... facing lifts never need more than 4500 mm (other buildings)', land('non', 'face'), 4500);
setv(w, 'lp_mn', 3); setv(w, 'lp_ra', 15); setv(w, 'lp_rw', 2500); setv(w, 'lp_rd', 3700); setv(w, 'lp_ww', 1800); setv(w, 'lp_wd', 2100); setv(w, 'lp_gap', 1500); setv(w, 'lp_ma', 'side');
let mac = w.calcLiftPlan().machine;
check('Table 17: 3 lifts are counted as 4; area 15 + 0.9 x 15 x 3 = 55.5 m2, width 2500 + 3 x (1800 + 200) = 8500, depth Rd = 3700', [mac.nn, mac.area, mac.width, mac.depth], [4, 55.5, 8500, 3700]);
setv(w, 'lp_ma', 'face'); mac = w.calcLiftPlan().machine;
check('... facing: width 2500 + 3 x 2000 / 2 = 5500, depth 2 x 2100 + 1500 = 5700', [mac.width, mac.depth], [5500, 5700]);
w.calcResult('liftplan');
check('the results name Tables 2, 3, 16 and 17', ['الجدول 2', 'جدول 3', 'الجدول 16', 'الجدول 17'].every(s => doc.getElementById('lp_results').textContent.includes(s)), true);
// Tables 9 - 13: standard lift dimensions
w = boot('jo'); doc = w.document; w.renderCalc('liftplan');
const LD = w.eval('JSON.parse(JSON.stringify(JO_LD))');
check('seven tables of lifts (five of passengers, two of goods): 4 + 2 + 5 + 3 + 4 + 7 + 7 rated loads', Object.keys(LD).map(k => LD[k].rows.length), [4, 2, 5, 3, 4, 7, 7]);
let ldBad = [];
for (const [k, t] of Object.entries(LD)) {
  t.rows.forEach((r, i) => {
    const id = k + '#' + (r.id || r.load);
    if (!(r.Ww > r.Cw && r.Wd > r.Cd && r.Ew < r.Cw + 1 && (r.Eh < r.Ch + 1 || r.ehHigher))) ldBad.push(id + ' shaft/car');
    if (i && !(r.load >= t.rows[i - 1].load && r.persons >= t.rows[i - 1].persons && (r.load > t.rows[i - 1].load || (t.goods && r.id)))) ldBad.push(id + ' load order');
    if (![r.ph, r.sh, r.rh].every(a => a.length === r.v.length) || (r.uh && r.uh.length !== r.v.length)) ldBad.push(id + ' per-speed arrays');
    for (const a of [r.ph, r.sh]) { let p = null; a.forEach(x => { if (x == null) return; if (p != null && x < p) ldBad.push(id + ' non-increasing with speed'); p = x; }); }
    if (!(r.Ra >= 7 && r.Rw >= 2000 && r.Rd >= 3200)) ldBad.push(id + ' machine room');
  });
}
check('the transcription is consistent: shaft larger than the car, entrance inside the car, loads and persons rise, pit and overhead do not fall with the speed', ldBad, []);
check('Table 9: 630 kg at 1.60 m/s: pit 1700, overhead 4200; 400 kg: car 1100 x 950, shaft 1800 x 1600, machine room 7.5 m2 (2200 x 3200)', [LD.t9.rows[1].ph[3], LD.t9.rows[1].sh[3], [LD.t9.rows[0].Cw, LD.t9.rows[0].Cd, LD.t9.rows[0].Ww, LD.t9.rows[0].Wd, LD.t9.rows[0].Ra, LD.t9.rows[0].Rw, LD.t9.rows[0].Rd]], [1700, 4200, [1100, 950, 1800, 1600, 7.5, 2200, 3200]]);
check('Table 9: the pit of the 1000 kg lift at 1.00 and 1.60 m/s is not printed', LD.t9.rows[3].ph, [1500, 1500, null, null]);
check('Table 10 (630 kg, 1.00 m/s): shaft 2000 x 1900, pit 1700; Table 11 (1000 kg): car 1600 x 1400 x 2300, shaft 2400 x 2300, entrance 1100 x 2100, pit 1800, overhead 4200, machine room 20 m2 3200 x 4900 x 2700', [[LD.t10.rows[0].Ww, LD.t10.rows[0].Wd, LD.t10.rows[0].ph[2]], [LD.t11.rows[2].Cw, LD.t11.rows[2].Cd, LD.t11.rows[2].Ch, LD.t11.rows[2].Ww, LD.t11.rows[2].Wd, LD.t11.rows[2].Ew, LD.t11.rows[2].Eh, LD.t11.rows[2].ph[0], LD.t11.rows[2].sh[0], LD.t11.rows[2].Ra, LD.t11.rows[2].Rw, LD.t11.rows[2].Rd, LD.t11.rows[2].rh[0]]],
  [[2000, 1900, 1700], [1600, 1400, 2300, 2400, 2300, 1100, 2100, 1800, 4200, 20, 3200, 4900, 2700]]);
check('Table 12 (heavy traffic, 1600 kg, 3.50 m/s): pit 3400, overhead 10600, no machine room height; Table 13 (2500 kg): car 1800 x 2700, pit 2100 at 1.60 m/s; (1600 kg at 2.50 m/s): pit 3200, overhead not printed, total 9700', [[LD.t12.rows[2].ph[1], LD.t12.rows[2].sh[1], LD.t12.rows[2].rh[1]], [LD.t13.rows[3].Cw, LD.t13.rows[3].Cd, LD.t13.rows[3].ph[3]], [LD.t13.rows[0].ph[4], LD.t13.rows[0].sh[4], LD.t13.rows[0].uh[4]]], [[3400, 10600, null], [1800, 2700, 2100], [3200, null, 9700]]);
check('Table 13: the 1800 kg lift prints a machine room depth of 5000 mm below the 1600 kg value: 5800 mm is used and the print is kept for the note', [LD.t13.rows[1].Rd, LD.t13.rows[1].rdPrinted], [5800, 5000]);
// Tables 14 and 15: goods lifts (bitmaps of ~4 px per digit, checked by cross-relations)
let gBad = [];
[LD.t14, LD.t15].forEach((t, ti) => t.rows.forEach(r => {
  const id = 't' + (14 + ti) + '#' + (r.id || r.load);
  if (r.Ew !== r.Cw) gBad.push(id + ' Ew != Cw');
  if (r.Eh !== r.Ch && !r.ehHigher) gBad.push(id + ' Eh != Ch');
  if (r.Wd !== r.Cd + (ti ? 400 : 300)) gBad.push(id + ' Wd != Cd + ' + (ti ? 400 : 300));
  if (r.persons !== Math.floor(r.load / 75)) gBad.push(id + ' persons != load / 75');
  if (r.Rw < r.Ww) gBad.push(id + ' machine room narrower than the shaft');
  if (!(r.Ra > r.Rw * r.Rd / 1e6)) gBad.push(id + ' Ra not above Rw x Rd');
}));
check('goods lifts: Cw = Ew, Ch = Eh (one printed exception), Wd = Cd + 300 (Table 14) / + 400 (Table 15), persons = load / 75 rounded down, machine room as wide as the shaft, Ra above Rw x Rd', gBad, []);
const gp = [[2, 0], [3, 1], [4, 2], [6, 4]];   // 1500, 2000, 2000 (second car), 3000 (second car): Table 14 row -> Table 15 row
check('the same car for the same load in the two goods tables (also the first 3000 kg car), and the heavy-duty machine room is 300 mm deeper in the four pairs where both print it', [[2, 0], [3, 1], [4, 2], [5, 3], [6, 4]].map(([a, b]) => LD.t14.rows[a].Cw === LD.t15.rows[b].Cw && LD.t14.rows[a].Cd === LD.t15.rows[b].Cd), [true, true, true, true, true]);
check('... Rd(Table 15) - Rd(Table 14) = 300 mm for 1500, 2000, 2000 (second car) and 3000 (second car)', gp.map(([a, b]) => LD.t15.rows[b].Rd - LD.t14.rows[a].Rd), [300, 300, 300, 300]);
check('Table 14: 500 kg has three speeds (0.50, 0.63 and 1.00 share the band of the second pit 1500), 1000 kg four speeds with one pit 1500 and overhead 3800; 1500 kg at 1.00 m/s: pit 1800, overhead 4200; 3000 kg: three speeds, overhead 4200 / 4400 / 4500', [LD.t14.rows[0].v, LD.t14.rows[0].ph, LD.t14.rows[1].v.length, LD.t14.rows[1].ph, LD.t14.rows[1].sh, LD.t14.rows[2].ph[3], LD.t14.rows[2].sh[3], LD.t14.rows[5].v, LD.t14.rows[5].sh],
  [[0.5, 0.63, 1], [1400, 1500, 1500], 4, [1500, 1500, 1500, 1500], [3800, 3800, 3800, 3800], 1800, 4200, [0.25, 0.5, 0.63], [4200, 4400, 4500]]);
check('Table 15: 1500 kg car 1700 x 2000 x 2300, shaft 2600 x 2400, overhead 4800, machine room 16 m2 (2600 x 4800 x 2700); 5000 kg: car 2500 x 3600 x 2500, three speeds, overhead 5200, machine room 46 m2 (4000 x 6800)', [[LD.t15.rows[0].Cw, LD.t15.rows[0].Cd, LD.t15.rows[0].Ch, LD.t15.rows[0].Ww, LD.t15.rows[0].Wd, LD.t15.rows[0].sh[0], LD.t15.rows[0].Ra, LD.t15.rows[0].Rw, LD.t15.rows[0].Rd, LD.t15.rows[0].rh[0]], [LD.t15.rows[6].Cw, LD.t15.rows[6].Cd, LD.t15.rows[6].Ch, LD.t15.rows[6].v.length, LD.t15.rows[6].sh[2], LD.t15.rows[6].Ra, LD.t15.rows[6].Rw, LD.t15.rows[6].Rd]],
  [[1700, 2000, 2300, 2600, 2400, 4800, 16, 2600, 4800, 2700], [2500, 3600, 2500, 3, 5200, 46, 4000, 6800]]);
check('Table 15: the 3000 kg well depth is printed 4300 (above the 5000 kg lift, against Cd + 400): 3400 is used and the print kept; the second 3000 kg car has an entrance higher than its car as printed', [LD.t15.rows[3].Wd, LD.t15.rows[3].wdPrinted, LD.t15.rows[4].ehHigher, LD.t15.rows[4].Eh, LD.t15.rows[4].Ch], [3400, 4300, true, 2500, 2300]);
let lx = w.calcLiftPlan().dims;
check('defaults: general-purpose passenger lift 1000 kg at 1.00 m/s', [lx.dt, lx.row.load, lx.speed, lx.ph, lx.sh, lx.rd], ['t11', 1000, 1, 1800, 4200, 4900]);
setv(w, 'lp_dt', 't13'); w.lpDimFill('type');
check('choosing the bed / passenger lift refills the loads (4) and the speeds (5 for 1600 kg: the third, 1.00 m/s, is chosen)', [doc.getElementById('lp_dl').options.length, doc.getElementById('lp_dv').options.length, doc.getElementById('lp_dv').value], [4, 5, '1']);
setv(w, 'lp_dl', 2500); w.lpDimFill('load');
check('the 2500 kg lift has 4 speeds (no 2.50 m/s)', [doc.getElementById('lp_dv').options.length, [...doc.getElementById('lp_dv').options].map(o => o.value)], [4, ['0.5', '0.63', '1', '1.6']]);
setv(w, 'lp_dv', '1.6'); lx = w.calcLiftPlan().dims;
check('2500 kg at 1.60 m/s: pit 2100, overhead 4600, machine room 29 m2', [lx.ph, lx.sh, lx.row.Ra], [2100, 4600, 29]);
setv(w, 'lp_dt', 't11'); w.lpDimFill('type'); setv(w, 'lp_dl', 1000); w.lpDimFill('load'); setv(w, 'lp_dv', '1');
setv(w, 'lp_aw', 2300); setv(w, 'lp_ad', 2300); lx = w.calcLiftPlan().dims;
check('an available shaft of 2300 x 2300 mm against the 2400 x 2300 minimum: width fails, depth passes', [lx.wOk, lx.dOk], [false, true]);
w.lpDimApply();
check('the transfer button fills the Table 16 and 17 fields with C_d 1400, R_a 20, R_w 3200, R_d 4900, W_w 2400, W_d 2300', ['lp_cd', 'lp_ra', 'lp_rw', 'lp_rd', 'lp_ww', 'lp_wd'].map(id => +doc.getElementById(id).value), [1400, 20, 3200, 4900, 2400, 2300]);
w.calcResult('liftplan');
check('the results show the dimensions of the chosen lift and the note on the bitmaps of Tables 9 - 15 (no goods-lift note for a passenger lift)', [['أبعاد المصعد المعياري', 'جدول 11', 'الجداول 9 إلى 15'].every(s => doc.getElementById('lp_results').textContent.includes(s)), doc.getElementById('lp_results').textContent.includes('مصاعد البضائع (الجدولان 14 و15)')], [true, false]);
setv(w, 'lp_dt', 't14'); w.lpDimFill('type');
check('choosing the general goods lifts lists seven loads: 2000 and 3000 kg twice, told apart by the car size', [doc.getElementById('lp_dl').options.length, [...doc.getElementById('lp_dl').options].map(o => o.value), doc.getElementById('lp_dl').options[4].textContent.includes('2000 × 2100')], [7, ['500', '1000', '1500', '2000', '2000b', '3000', '3000b'], true]);
setv(w, 'lp_dl', '2000b'); w.lpDimFill('load'); setv(w, 'lp_dv', '1'); lx = w.calcLiftPlan().dims;
check('2000 kg (second car) at 1.00 m/s: car 2000 x 2100, shaft 2800 x 2400, pit 1800, overhead 4500, machine room 17 m2', [lx.row.Cw, lx.row.Cd, lx.row.Ww, lx.row.Wd, lx.ph, lx.sh, lx.row.Ra], [2000, 2100, 2800, 2400, 1800, 4500, 17]);
w.calcResult('liftplan');
check('the goods-lift results carry the note on the bitmaps and the Table 14 gate note, but no printed-misprint note', [['مصاعد البضائع (الجدولان 14 و15)', 'ملاحظة 2 من الجدول 14'].every(s => doc.getElementById('lp_results').textContent.includes(s)), doc.getElementById('lp_results').textContent.includes('مطبوع 4300')], [true, false]);
setv(w, 'lp_dt', 't15'); w.lpDimFill('type'); setv(w, 'lp_dl', '3000'); w.lpDimFill('load'); w.calcResult('liftplan');
check('Table 15, 3000 kg: the results explain the misprinted 4300 and the Table 15 note (+200 mm of well depth for two entrances)', ['مطبوع 4300', 'ملاحظة 2 من الجدول 15', '200 mm'].every(s => doc.getElementById('lp_results').textContent.includes(s)), true);
w = boot('intl'); w.renderCalc('liftplan');
check('the calculator is available whatever the national code (seventy-one calculators)', [!!w.document.getElementById('lp_results'), w.document.querySelectorAll('.calc-card').length >= 71], [true, true]);

// ---------- Jordanian fire protection code: means of egress (chapter 5, Tables 1 and 5, chapters 8 - 15) ----------
w = boot('jo'); doc = w.document; w.renderCalc('egress');
check('exit units (5/2/2): a fraction below 0.5 is dropped, from 0.5 up counts half: 0.55 -> 1, 0.6 -> 1, 0.7 -> 1, 0.9 -> 1.5, 1.0 -> 1.5, 1.1 -> 2, 1.65 -> 3, 2.0 -> 3.5', [0.55, 0.6, 0.7, 0.9, 1.0, 1.1, 1.65, 2.0].map(x => w.fpUnits(x)), [1, 1, 1, 1.5, 1.5, 2, 3, 3.5]);
check('assembly categories: 49 none, 50 and 300 D, 301 and 600 C, 601 and 1000 B, 1001 A', [49, 50, 300, 301, 600, 601, 1000, 1001].map(x => w.fpAssemblyCat(x)), [null, 'D', 'D', 'C', 'C', 'B', 'B', 'A']);
let eg = w.calcEgress();
check('defaults: dense assembly 600 m2 at 0.6 = 1000 persons, category B, 3 exits of at least 2 units', [eg.load, eg.cat, eg.minExits, eg.minUnitsEach], [1000, 'B', 3, 2]);
check('... two 1.1 m doors (2 units each) and two 1.1 m stairs: 4 x 100 + 4 x 75 = 700 persons: not enough for 1000; 4 exits and 2 units each pass', [eg.capacity, eg.capOk, eg.exitsOk, eg.unitsEachOk], [700, false, true, true]);
check('... required width: 1000 / 100 x 0.55 = 5.5 m by doors, 1000 / 75 x 0.55 = 7.33 m by stairs', [+eg.reqWidthDoor.toFixed(2), +eg.reqWidthStair.toFixed(2)], [5.5, 7.33]);
check('Table 5 for assembly: 45 m and a 6 m dead end without sprinklers, 60 m with', [eg.t5.path, eg.t5.dead, (setv(w, 'eg_spk', 'yes'), w.calcEgress().t5.path)], [45, 6, 60]);
setv(w, 'eg_spk', 'no'); setv(w, 'eg_tr', 50);
check('a 50 m path fails the 45 m limit; the 1.2 m path width passes 0.7 m', [w.calcEgress().travelOk, w.calcEgress().pwOk], [false, true]);
setv(w, 'eg_tr', 30);
const egSet = (occ, area, extra) => { setv(w, 'eg_occ', occ); w.egOcc(); setv(w, 'eg_area', area); Object.keys(extra || {}).forEach(id => setv(w, id, extra[id])); return w.calcEgress(); };
eg = egSet('as_dense', 3000, {});
check('assembly category A (3000 / 0.6 = 5000): four exits', [eg.load, eg.cat, eg.minExits], [5000, 'A', 4]);
eg = egSet('hc_sleep', 800, {});
check('health care sleeping 8 m2 gross: 100 persons, 30 / 22 per unit: 4 x 30 + 4 x 22 = 208', [eg.load, eg.capDoor, eg.capStair, eg.capacity], [100, 30, 22, 208]);
eg = egSet('res_apt', 1800, {});
check('apartments 18 m2: 100 persons, 100 / 75 per unit; Table 5 apartments 35 / 50 m, dead end not transcribed', [eg.load, eg.capDoor, eg.capStair, eg.t5.path, eg.t5.dead], [100, 100, 75, 35, null]);
eg = egSet('res_hotel', 1800, {eg_spk: 'yes'});
check('hotels with sprinklers: 45 m and a 12 m dead end', [eg.t5.path, eg.t5.dead], [45, 12]);
eg = egSet('bus', 900, {eg_spk: 'no', eg_nd: 1, eg_ns: 0, eg_tr: 30});
check('offices 9 m2: 900 m2 = 100 persons, 60 / 100 m path; one exit is enough for a room of up to 100 persons with a path of 30 m, not with 31 m', [eg.load, eg.t5.path, eg.exitsOk, (setv(w, 'eg_tr', 31), w.calcEgress().exitsOk)], [100, 60, true, false]);
eg = egSet('ind', 225, {eg_nd: 1, eg_ns: 0, eg_tr: 15});
check('industrial 225 m2 = 25 persons: a single exit with a 15 m path is allowed, a 16 m path is not', [eg.load, eg.exitsOk, (setv(w, 'eg_tr', 16), w.calcEgress().exitsOk)], [25, true, false]);
eg = egSet('sto_ord', 225, {eg_nd: 1, eg_ns: 0, eg_tr: 30});
check('storage 225 m2 at 25 m2 per person = 9 persons, below 900 m2: a single exit is allowed; ordinary hazard 60 m (120 m sprinklered)', [eg.load, eg.exitsOk, eg.t5.path, (setv(w, 'eg_spk', 'yes'), w.calcEgress().t5.path)], [9, true, 60, 120]);
eg = egSet('sto_low', 1000, {eg_spk: 'no', eg_nd: 2, eg_ns: 0});
check('low-hazard storage has no Table 5 limit', [eg.t5, eg.t5none], [null, true]);
eg = egSet('park_open', 0, {eg_spaces: 100, eg_park: '2', eg_spk: 'no'});
check('an open car park of 100 public spaces: 2 persons per space = 200, 60 m / 90 m, dead end 15 m', [eg.load, eg.t5.path, eg.t5.dead, (setv(w, 'eg_spk', 'yes'), w.calcEgress().t5.path)], [200, 60, 15, 90]);
eg = egSet('ed_class', 150, {eg_spk: 'no'});
check('classrooms 1.5 m2 net: 150 m2 = 100 persons; Table 5 education 45 m, 6 m dead end', [eg.load, eg.t5.path, eg.t5.dead], [100, 45, 6]);
setv(w, 'eg_load', 250); check('a known load overrides the area', w.calcEgress().load, 250);
setv(w, 'eg_load', 0); w.calcResult('egress');
bodyText = doc.getElementById('eg_results').textContent;
check('the results show the load, the 0.55 m unit, Table 5 and the width of the escape path', ['حمل الإشغال', '0.55', 'الجدول 5', '0.7 m'].every(s => bodyText.includes(s)), true);
// ---------- Jordanian fire protection code, part 2: exit components, extinguishers, requirements by occupancy ----------
w = boot('jo'); doc = w.document; w.renderCalc('exitparts');
const ep = (kind, vals) => { setv(w, 'ep_kind', kind); w.epKind(); Object.keys(vals || {}).forEach(id => setv(w, id, vals[id])); return w.calcExitParts(); };
const rowOf = (r, part) => r.rows.find(x => x.n.includes(part));
let xp = ep('door', {});
check('door defaults pass (0.9 m clear, 0.9 m leaf, 100 N, 0.9 m landing)', xp.ok, true);
check('door: 0.6 m clear fails, 1.3 m leaf fails, 250 N fails, 0.5 m landing fails', [ep('door', {ep_dw: 0.6}).ok, (setv(w, 'ep_dw', 0.9), ep('door', {ep_dl: 1.3}).ok), (setv(w, 'ep_dl', 0.9), ep('door', {ep_dforce: 250}).ok), (setv(w, 'ep_dforce', 100), ep('door', {ep_dland: 0.5}).ok)], [false, false, false, false]);
setv(w, 'ep_dland', 0.9);
check('door: a 0.1 m step fails unless the door opens straight outside (then up to 0.2 m)', [ep('door', {ep_dstep: 0.1}).ok, ep('door', {ep_dout: 'yes'}).ok, ep('door', {ep_dstep: 0.3}).ok], [false, true, false]);
setv(w, 'ep_dstep', 0); setv(w, 'ep_dout', 'no');
check('door: more than 50 persons or high hazard need side hinges opening with the exit', [ep('door', {ep_dload: 60, ep_dhinge: 'no'}).ok, ep('door', {ep_dload: 60, ep_dhinge: 'yes'}).ok, ep('door', {ep_dload: 10, ep_dhaz: 'yes', ep_dhinge: 'no'}).ok], [false, true, false]);
setv(w, 'ep_dload', 40); setv(w, 'ep_dhaz', 'no'); setv(w, 'ep_dhinge', 'yes');
check('door: an assembly of 100 persons needs panic hardware; push 65 N, bar 0.75 - 1.1 m, length half the leaf', [ep('door', {ep_dasm: 'yes'}).ok, ep('door', {ep_dpanic: 'yes'}).ok, ep('door', {ep_dbarf: 70}).ok, (setv(w, 'ep_dbarf', 50), ep('door', {ep_dbarh: 1.2}).ok), (setv(w, 'ep_dbarh', 0.9), ep('door', {ep_dbarl: 0.4}).ok)], [false, true, false, false, false]);
xp = ep('stair', {});
check('class A stairs: 1.2 m wide, riser 170, tread 280, 10 risers, landing 1.2, handrail 800, guard 1.1, bars 100, nosing 30 all pass; 2R + T = 620', [xp.ok, rowOf(xp, '2 ×').val], [true, '620 mm']);
check('class A riser 190 passes and 200 fails; class B 200 passes', [ep('stair', {ep_sr: 190}).ok, ep('stair', {ep_sr: 200}).ok, ep('stair', {ep_scl: 'B', ep_sr: 200}).ok], [true, false, true]);
setv(w, 'ep_scl', 'A'); setv(w, 'ep_sr', 170);
check('tread: class A needs 250 mm (240 fails); class B 220 mm passes; 2R + T above 700 mm fails', [ep('stair', {ep_st: 240}).ok, ep('stair', {ep_scl: 'B', ep_st: 220}).ok, ep('stair', {ep_scl: 'A', ep_sr: 190, ep_st: 340}).ok], [false, true, false]);
setv(w, 'ep_sr', 170); setv(w, 'ep_st', 280);
check('width: class B under 50 persons 0.9 m passes and 0.85 fails; from 50 persons it needs 1.1 m; class A needs 1.1 m', [ep('stair', {ep_scl: 'B', ep_sload: 40, ep_sw: 0.9}).ok, ep('stair', {ep_sw: 0.85}).ok, ep('stair', {ep_sload: 60, ep_sw: 1.05}).ok, ep('stair', {ep_scl: 'A', ep_sload: 10, ep_sw: 1.0}).ok], [true, false, false, false]);
setv(w, 'ep_scl', 'A'); setv(w, 'ep_sload', 120); setv(w, 'ep_sw', 1.2);
check('a handrail projection above 90 mm is deducted from the width (1.2 - 2 x 0.15 = 0.9 fails class A)', ep('stair', {ep_sproj: 150}).ok, false);
setv(w, 'ep_sproj', 90);
check('flights: 2 risers or 13 risers fail; 12 risers x 170 = 2.04 m passes; 3.6 m between landings: 12 x 300 mm fails the riser anyway', [ep('stair', {ep_sn: 2}).ok, ep('stair', {ep_sn: 13}).ok, ep('stair', {ep_sn: 12}).ok], [false, false, true]);
setv(w, 'ep_sn', 10);
check('handrail 0.75 - 0.85 m, 40 mm from the wall, guard 1.05 m (0.9 m in assembly), bars 150 mm, nosing 25 mm for a tread below 250 mm, winders forbidden', [ep('stair', {ep_shr: 900}).ok, (setv(w, 'ep_shr', 800), ep('stair', {ep_sgap: 30}).ok), (setv(w, 'ep_sgap', 50), ep('stair', {ep_sguard: 1.0}).ok), ep('stair', {ep_sasm: 'yes'}).ok, (setv(w, 'ep_sasm', 'no'), setv(w, 'ep_sguard', 1.1), ep('stair', {ep_sbar: 160}).ok), (setv(w, 'ep_sbar', 100), ep('stair', {ep_swind: 'yes'}).ok)], [false, false, false, true, false, false]);
setv(w, 'ep_swind', 'no');
check('a tread below 250 mm needs a 25 mm nosing (class B, tread 220)', [ep('stair', {ep_scl: 'B', ep_st: 220, ep_snose: 10}).ok, ep('stair', {ep_snose: 25}).ok], [false, true]);
setv(w, 'ep_scl', 'A'); setv(w, 'ep_st', 280);
xp = ep('ramp', {});
check('class A ramp 1.2 m wide at 1 : 12: passes, capacity 2 units = 200 up and down', [xp.ok, rowOf(xp, 'السعة').val], [true, '200 / 200 شخصًا']);
check('class A needs 1 : 10 (1 : 8 fails); class B allows 1 : 8, 0.75 m and 3.6 m between landings but not 3.7 m; capacity 100 down / 60 up', [ep('ramp', {ep_rs: 8}).ok, ep('ramp', {ep_rcl: 'B', ep_rw: 0.75, ep_rs: 8, ep_rh: 3.6}).ok, ep('ramp', {ep_rh: 3.7}).ok, rowOf(ep('ramp', {ep_rh: 3.6}), 'السعة').val], [false, true, false, '100 / 60 شخصًا']);
setv(w, 'ep_rcl', 'A'); setv(w, 'ep_rw', 1.2); setv(w, 'ep_rs', 12); setv(w, 'ep_rh', 2);
xp = ep('escape', {});
check('fire escape stair for 8 persons (Table 4, below 10): 0.45 m between rails, riser 300, tread 150, headroom 1.95; the defaults pass', xp.ok, true);
check('for 12 persons the limits tighten: 0.5 m between rails fails, riser 250 fails, spiral fails; 50 % share, a new building fail', [ep('escape', {ep_en: 12, ep_ew: 0.5}).ok, (setv(w, 'ep_ew', 0.6), ep('escape', {ep_er: 250}).ok), (setv(w, 'ep_er', 200), ep('escape', {ep_esp: 'yes'}).ok), (setv(w, 'ep_esp', 'no'), ep('escape', {ep_eshare: 60}).ok), (setv(w, 'ep_eshare', 30), ep('escape', {ep_enew: 'yes'}).ok), (setv(w, 'ep_enew', 'no'), ep('escape', {}).ok)], [false, false, false, false, false, true]);
setv(w, 'ep_en', 8);
xp = ep('ladder', {});
check('ladder defaults pass; supports every 3.5 m fail; the rungs 22 mm at 0.25 - 0.30 m; extension 1.15 m', [xp.ok, ep('ladder', {ep_ls: 3.5}).ok, (setv(w, 'ep_ls', 2.5), ep('ladder', {ep_lu: 1.1}).ok), (setv(w, 'ep_lu', 1.2), ep('ladder', {ep_ld: 20}).ok), (setv(w, 'ep_ld', 22), ep('ladder', {ep_lg: 0.35}).ok)], [true, false, false, false, false]);
setv(w, 'ep_lg', 0.28);
xp = ep('horiz', {});
check('horizontal exit: 0.3 m2 per person (200 + 200 = 120 m2 needed, 300 given); 40 % of the capacity; 2 h wall; 1.2 m bridge', [xp.ok, rowOf(xp, 'المساحة الخالصة').lim], [true, '≥ 0.3 × (200 + 200) = 120 m²']);
check('horizontal exit: 100 m2 fails, 55 % fails, a 1.5 h wall fails, a bridge narrower than 1.1 m fails, a 0.3 m step fails', [ep('horiz', {ep_harea: 100}).ok, (setv(w, 'ep_harea', 300), ep('horiz', {ep_hshare: 55}).ok), (setv(w, 'ep_hshare', 40), ep('horiz', {ep_hwall: 1.5}).ok), (setv(w, 'ep_hwall', 2), ep('horiz', {ep_hbw: 1.0, ep_hdw: 0.9}).ok), (setv(w, 'ep_hbw', 1.2), ep('horiz', {ep_hstep: 0.3}).ok)], [false, false, false, false, false]);
setv(w, 'ep_hstep', 0.1);
xp = ep('tower', {});
check('smokeproof tower defaults pass; a 6 m street, a 90 m2 court, a 0.5 m2 glazed panel, a 1.5 h wall fail', [xp.ok, ep('tower', {ep_tcw: 6}).ok, (setv(w, 'ep_tcw', 8), ep('tower', {ep_tca: 90}).ok), (setv(w, 'ep_tca', 120), ep('tower', {ep_tp: 0.5}).ok), (setv(w, 'ep_tp', 0.4), ep('tower', {ep_twall: 1.5}).ok)], [true, false, false, false, false]);
setv(w, 'ep_twall', 2);
xp = ep('light', {});
check('lighting defaults pass (12 lux, 60 lux at the sign, 90 min); 8 lux, a 40 lux sign, 45 min fail; 2 lux passes during a show', [xp.ok, ep('light', {ep_lf: 8}).ok, ep('light', {ep_lf: 2, ep_lcin: 'yes'}).ok, (setv(w, 'ep_lf', 12), setv(w, 'ep_lcin', 'no'), ep('light', {ep_lsg: 40}).ok), (setv(w, 'ep_lsg', 60), ep('light', {ep_ldur: 45}).ok), (setv(w, 'ep_ldur', 90), ep('light', {ep_lbat: 'yes'}).ok)], [true, false, true, false, false, false]);
setv(w, 'ep_lbat', 'no');
w.calcResult('exitparts');
check('the results show the check table', ['الحد في الكودة', '5/10/3', '5/8/1 D'].every(s => doc.getElementById('ep_results').textContent.includes(s)), true);
setv(w, 'ep_kind', 'door'); w.epKind(); w.calcResult('exitparts');
check('only the group of the chosen component is visible', [doc.getElementById('ep_g_door').style.display, doc.getElementById('ep_g_stair').style.display], ['', 'none']);

// extinguishers 6/4/4
w = boot('jo'); doc = w.document; w.renderCalc('extinguisher');
const ex = (vals) => { Object.keys(vals).forEach(id => setv(w, id, vals[id])); return w.calcExtinguisher(); };
let xe = ex({ex_area: 800, ex_ra: 13});
check('class A: 0.065 x 800 = 52 A, four 13A units (52 A)', [+xe.fa.toFixed(2), xe.na, xe.totalA], [52, 4, 52]);
check('class A: 400 m2 and below give the minimum 26 A: two 13A units; 100 m2 also 26 A', [+ex({ex_area: 400}).fa.toFixed(2), ex({ex_area: 400}).na, +ex({ex_area: 100}).fa.toFixed(2)], [26, 2, 26]);
check('class A: the example of the code, 1600 m2 = 104 A: eight 13A, or four 27A (108), or three 43A (129)', [+ex({ex_area: 1600, ex_ra: 13}).fa.toFixed(1), ex({ex_ra: 13}).na, ex({ex_ra: 27}).na, ex({ex_ra: 43}).na], [104, 8, 4, 3]);
check('class A: never fewer than two units per floor (a 43A unit for 100 m2 still needs two)', ex({ex_area: 100, ex_ra: 43}).na, 2);
setv(w, 'ex_area', 800); setv(w, 'ex_ra', 13);
xe = ex({ex_bsc: 'open', ex_bty: 'other', ex_bs: 2, ex_rb: 55});
check('class B, one open container of 2 m2 (Table 9): 80 x 2 = 160 B, three 55B units; with foam 50 x 2 = 100 B, two units', [xe.fb, xe.nb, ex({ex_bty: 'foam'}).fb, ex({ex_bty: 'foam'}).nb], [160, 3, 100, 2]);
check('class B: a spill of 20 litres = 10 x 20 = 200 B, four 55B units; foam is flagged as unsuitable', [ex({ex_bty: 'other', ex_bsc: 'spill', ex_bv: 20}).fb, ex({ex_bsc: 'spill'}).nb, ex({ex_bty: 'foam'}).spillFoam], [200, 4, true]);
setv(w, 'ex_bty', 'other'); setv(w, 'ex_bsc', 'none');
check('without flammable liquids only class A is shown', ex({}).fb === undefined, true);
w.calcResult('extinguisher');
check('the results quote the 25 m distance, the 1 m handle height and the code example', ['25 m', '1 m', '104 A'].every(s => doc.getElementById('ex_results').textContent.includes(s)), true);

// requirements by occupancy
w = boot('jo'); doc = w.document; w.renderCalc('fireprot');
const fp = (occ, vals) => { setv(w, 'fr_occ', occ); w.frOcc(); Object.keys(vals || {}).forEach(id => setv(w, id, vals[id])); return w.calcFireProt(); };
const fr = (r, part) => r.R.find(x => x.n.includes(part));
let fo = fp('hotel', {fr_n: 5, fr_af: 800, fr_at: 4000, fr_units: 24, fr_spk: 'no'});
check('hotel of 5 floors, 24 rooms: alarm required, corridors need smoke detection, standpipes with 19 mm hoses at 600 m2 = 2 hoses and one riser, 24 rooms need no emergency lighting', [fr(fo, 'نظام الإنذار').s, fr(fo, 'الكشف التلقائي').s, fo.hoses, fr(fo, 'الإنارة الاحتياطية').s], ['req', 'req', {dia: 19, area: 600, perFloor: 2, risers: 1}, 'no']);
fo = fp('hotel', {fr_units: 26, fr_n: 3, fr_spk: 'yes'});
check('hotel of 3 floors, 26 rooms, sprinklers: emergency lighting required, no corridor detectors, extinguishers 4000 / 200 = 20 and two per floor', [fr(fo, 'الإنارة الاحتياطية').s, fr(fo, 'الكشف التلقائي').s, fo.extinguishers], ['req', 'no', 20]);
check('hotel: 7 floors need smokeproof stairs unless sprinklered; 14 rooms need no alarm', [fp('hotel', {fr_n: 7, fr_spk: 'no'}).R.find(x => x.n.includes('الأدراج اللامنفذة')).s, fp('hotel', {fr_n: 7, fr_spk: 'yes'}).R.find(x => x.n.includes('الأدراج اللامنفذة')).s, fp('hotel', {fr_n: 3, fr_units: 14}).R.find(x => x.n === 'نظام الإنذار من الحريق').s], ['req', 'no', 'no']);
fo = fp('apt', {fr_n: 9, fr_apt: 1, fr_units: 40});
check('apartments Table 12, ordinary building, 9 floors: 900 m2 between horizontal exits, 35 m, smoke barriers 15 m, dead end 6 m', [fo.t12.area, fo.t12.path, fo.t12.smoke, fo.t12.dead], [900, 35, 15, 6]);
fo = fp('apt', {fr_n: 6, fr_apt: 2, fr_units: 12});
check('apartments, detection, 6 floors: 1800 m2, 50 m, 30 m, 6 m', [fo.t12.area, fo.t12.path, fo.t12.smoke, fo.t12.dead], [1800, 50, 30, 6]);
fo = fp('apt', {fr_n: 10, fr_apt: 3});
check('apartments, corridor sprinklers, 10 floors: 1800 m2, 50 m, 30 m', [fo.t12.area, fo.t12.path, fo.t12.smoke], [1800, 50, 30]);
fo = fp('apt', {fr_n: 10, fr_apt: 4});
check('apartments, full sprinklers: no area limit, 50 m, no smoke-barrier requirement, 12 m dead end', [fo.t12.area, fo.t12.path, fo.t12.smoke, fo.t12.dead], [null, 50, null, 12]);
fo = fp('apt', {fr_n: 4, fr_apt: 1, fr_units: 10});
check('apartments of 4 floors, 10 units: no area limit; no alarm, no standpipes, no extinguishers (up to 6 floors and 18 units)', [fo.t12.area, fr(fo, 'نظام الإنذار').s, fr(fo, 'التمديدات والخراطيم').s, fr(fo, 'طفايات').s], [null, 'no', 'no', 'no']);
fo = fp('apt', {fr_n: 7, fr_apt: 1, fr_units: 20, fr_af: 1000});
check('apartments of 7 floors, 20 units: manual alarm, standpipes (800 m2 per hose: 2 hoses), extinguishers, emergency lighting not yet (25 units)', [fr(fo, 'نظام الإنذار').s, fr(fo, 'التمديدات والخراطيم').s, fo.hoses.perFloor, fr(fo, 'الإنارة الاحتياطية').s], ['req', 'req', 2, 'no']);
check('apartments with detection always need a manual and automatic alarm; 26 units need emergency lighting', [fr(fp('apt', {fr_apt: 2, fr_n: 3, fr_units: 8}), 'نظام الإنذار').s, fr(fp('apt', {fr_apt: 1, fr_units: 26}), 'الإنارة الاحتياطية').s], ['req', 'req']);
fo = fp('dorm', {fr_n: 2, fr_at: 500, fr_af: 250});
check('dormitory: below 700 m2 and 3 floors no hose system; above 700 m2 or 3 floors it is required', [fr(fo, 'التمديدات والخراطيم').s, fp('dorm', {fr_at: 800}).R.find(x => x.n.includes('التمديدات')).s, fp('dorm', {fr_at: 500, fr_n: 3}).R.find(x => x.n.includes('التمديدات')).s], ['no', 'req', 'req']);
fo = fp('com', {fr_sales: 3000, fr_salesfl: 1, fr_af: 3000});
check('commercial: 3000 m2 of sales is class A and needs full sprinklers', [fo.comCls, fr(fo, 'الرشاشات التلقائية').s, fr(fo, 'نظام الإنذار').s], ['A', 'req', 'req']);
fo = fp('com', {fr_sales: 600, fr_salesfl: 1, fr_af: 800});
check('commercial: 600 m2 is class B (no sprinklers while each floor is below 1250 m2): 25 mm hoses at 400 m2 = 2 hoses', [fo.comCls, fr(fo, 'التمديدات والخراطيم').s, fo.hoses], ['B', 'req', {dia: 25, area: 400, perFloor: 2, risers: 1}]);
fo = fp('com', {fr_sales: 200, fr_salesfl: 1, fr_af: 200});
check('commercial: 200 m2 on the ground floor is class C: no alarm, extinguishers only', [fo.comCls, fr(fo, 'نظام الإنذار').s, fr(fo, 'التمديدات') === undefined], ['C', 'no', true]);
check('commercial: a sales area above 2500 m2 is class A; more than 3 sales floors also; floor above 1250 m2 triggers sprinklers', [fp('com', {fr_sales: 2500, fr_salesfl: 1, fr_af: 900}).comCls, fp('com', {fr_sales: 800, fr_salesfl: 4}).comCls, fr(fp('com', {fr_sales: 800, fr_salesfl: 1, fr_af: 1300}), 'الرشاشات التلقائية').s], ['A', 'A', 'req']);
check('office: standpipes from 5 floors (19 mm, 800 m2); alarm when the path exceeds a floor unless sprinklered; emergency lighting above 2 floors', [fp('office', {fr_n: 4, fr_af: 800}).R.find(x => x.n.includes('التمديدات')).s, fp('office', {fr_n: 5, fr_af: 1000}).hoses.perFloor, fr(fp('office', {fr_n: 3, fr_spk: 'no', fr_det: 'no'}), 'نظام الإنذار').s, fr(fp('office', {fr_n: 3, fr_spk: 'yes'}), 'نظام الإنذار').s, fr(fp('office', {fr_n: 3, fr_day: 'no'}), 'الإنارة الاحتياطية').s, fr(fp('office', {fr_n: 2, fr_load: 500, fr_fload: 50}), 'الإنارة الاحتياطية').s], ['no', 2, 'req', 'no', 'req', 'no']);
fo = fp('assembly', {fr_n: 1, fr_load: 1000, fr_af: 3500});
check('assembly: 1000 persons = category B, sprinklers recommended with 25 mm hoses at 400 m2 as the alternative, panic hardware, emergency lighting, Table 10 one hour above 3000 m2', [fo.cat, fr(fo, 'الرشاشات التلقائية').s, fo.hoses.dia, fr(fo, 'خردوات المخارج').s, fo.struct], ['B', 'rec', 25, 'req', 1]);
check('Table 10, single storey: office 3000 m2 = 0.5 h, 3500 m2 = 1 h; commercial 2500 m2 = 1 h and 4000 m2 = 2 h; storage 400 m2 = 0.5, 2500 = 2 h, 3500 = 4 h; education above 3000 m2 has no row', [fp('office', {fr_n: 1, fr_af: 3000}).struct, fp('office', {fr_n: 1, fr_af: 3500}).struct, fp('com', {fr_n: 1, fr_af: 2500, fr_sales: 600}).struct, fp('com', {fr_n: 1, fr_af: 4000}).struct, fp('sto', {fr_n: 1, fr_af: 400}).struct, fp('sto', {fr_n: 1, fr_af: 2500}).struct, fp('sto', {fr_n: 1, fr_af: 3500}).struct, fp('education', {fr_n: 1, fr_af: 3500}).struct], [0.5, 1, 1, 2, 0.5, 2, 4, undefined]);
// Table 11: multi-storey structure fire resistance (floor area and height)
const T11 = (occ, h, a, n) => { const r = w.eval(`frT11(${JSON.stringify(occ)}, ${h}, ${a}, ${n})`); return r ? [r.g, r.b] : null; };
check('Table 11, commercial: 12 m, 800 m2: the row "15 m, no area limit" 1.0 / 1.0; 20 m, 900 m2: row "28 m, 1000 m2" 1.0 ground / 2.0 basement; 20 m, 1500 m2: the last row 2.0 / 4.0; 40 m, 2500 m2: no row', [T11('commercial', 12, 800, 3), T11('commercial', 20, 900, 6), T11('commercial', 20, 1500, 6), T11('commercial', 40, 2500, 12)], [[1, 1], [1, 2], [2, 4], null]);
check('assembly: 7 m 200 m2: 0.5 / 1.0 (basement note); 400 m2: 0.5 / 1.0; 700 m2: 1.0 / 1.0; 25 m 900 m2: 1.0 / 1.5; 25 m 1500 m2: 1.5 / 2.0', [T11('assembly', 7, 200, 2), T11('assembly', 7, 400, 2), T11('assembly', 7, 700, 2), T11('assembly', 25, 900, 8), T11('assembly', 25, 1500, 8)], [[0.5, 1], [0.5, 1], [1, 1], [1, 1.5], [1.5, 2]]);
check('residential: 3 floors 9 m any area 0.5 / 1.0; 4 floors 12 m 200 m2 1.0 / 1.0; 4 floors 300 m2 1.0 / 1.5; 30 m 2000 m2 1.5 / 2.0; 30 m 2500 m2 no row; 5 floors 12 m (not 4) 100 m2 goes to the 28 m row', [T11('residential', 9, 5000, 3), T11('residential', 12, 200, 4), T11('residential', 12, 300, 4), T11('residential', 30, 2000, 10), T11('residential', 30, 2500, 10), T11('residential', 12, 100, 5)], [[0.5, 1], [1, 1], [1, 1.5], [1.5, 2], null, [1, 1.5]]);
check('education / health: up to 28 m and 2000 m2 1.0 / 1.5; above 28 m 1.5 / 2.0; 2500 m2 no row; office: 25 m 4000 m2 1.0 / 1.5; 40 m 9000 m2 1.5 / 2.0', [T11('education', 20, 1800, 5), T11('education', 40, 1800, 12), T11('education', 20, 2500, 5), T11('office', 25, 4000, 8), T11('office', 40, 9000, 12)], [[1, 1.5], [1.5, 2], null, [1, 1.5], [1.5, 2]]);
check('industrial: 7 m, no area limit 0.5 / 1.0; 25 m 1.0 / 2.0; tall 1500 m2 2.0 / 4.0', [T11('industrial', 7, 5000, 2), T11('industrial', 25, 5000, 7), T11('industrial', 40, 1500, 12)], [[0.5, 1], [1, 2], [2, 4]]);
check('storage prints two rows with the same limits and different ratings (15 m: 1.0 / 1.0 and 1.0 / 2.0; 28 m: 2.0 / 4.0 and 4.0 / 4.0): the higher is taken', [T11('storage', 12, 5000, 4), T11('storage', 25, 5000, 8), T11('storage', 7, 100, 2), T11('storage', 7, 200, 2), T11('storage', 40, 900, 12), T11('storage', 40, 1200, 12)], [[1, 2], [4, 4], [0.5, 1], [0.5, 1], [4, 4], null]);
fo = fp('office', {fr_n: 8, fr_h: 25, fr_af: 4000});
check('the requirement row quotes Table 11 with both ratings and the 50 m2 basement note for the first rows; the reading note is shown', [fo.struct, fo.structBasement, fo.R.some(x => x.ref === 'الجدول 11' && x.d.includes('1.5 ساعة لطابق التسوية')), fo.R.some(x => x.n === 'قراءة الجدول 11')], [1, 1.5, true, true]);
check('a single-storey building still uses Table 10; a building outside Table 11 says so', [fp('office', {fr_n: 1, fr_af: 800}).struct, fp('com', {fr_n: 12, fr_h: 40, fr_af: 2500}).R.some(x => x.s === 'info' && x.d.includes('لا صف في الجدول 11'))], [0.5, true]);
fo = fp('health', {fr_n: 2, fr_af: 800});
check('health care of 2 floors: smoke detection in the corridors (9 m / 4.5 m), sprinklers preferred, hoses 19 mm at 400 m2 allowed instead; a single floor has no sprinkler requirement', [fr(fo, 'الكشف التلقائي').s, fr(fo, 'الرشاشات التلقائية').s, fo.hoses, fp('health', {fr_n: 1}).R.find(x => x.n.includes('الرشاشات')).s], ['req', 'rec', {dia: 19, area: 400, perFloor: 2, risers: 1}, 'no']);
check('industrial: hose systems for general industry; full sprinklers for high hazard; storage always sprinklered; low-hazard storage below 900 m2 needs no alarm', [fp('ind', {fr_af: 800}).R.some(x => x.n.includes('التمديدات')), fp('indhigh', {}).R.find(x => x.n.includes('الرشاشات')).s, fp('sto', {fr_haz: 'ord'}).R.find(x => x.n.includes('الرشاشات')).s, fr(fp('sto', {fr_haz: 'low', fr_at: 800}), 'نظام الإنذار').s, fr(fp('sto', {fr_haz: 'low', fr_at: 1000}), 'نظام الإنذار').s], [true, 'req', 'req', 'no', 'req']);
check('education: manual alarm, extinguishers, 2 h hazard rooms; the unreadable hose figures fall back to 6/4/1 (800 m2)', [fr(fp('education', {fr_af: 1600}), 'نظام الإنذار').s, fp('education', {fr_af: 1600}).hoses.perFloor, fr(fp('education', {}), 'عزل المساحات الخطرة').d.includes('ساعتين')], ['req', 2, true]);
w.calcResult('fireprot');
check('the results show the requirements table, the general alarm rules and the equipment rooms (7/4)', ['ما تشترطه الكودة', '65 m', '7/4', '0.17'].every(s => doc.getElementById('fr_results').textContent.includes(s)), true);
setv(w, 'fr_occ', 'hotel'); w.frOcc();
check('fields that do not apply are hidden (hotel shows rooms, hides sales area)', [doc.getElementById('fr_f_units').style.display, doc.getElementById('fr_f_sales').style.display], ['', 'none']);
w = boot('intl'); w.renderCalc('fireprot');
check('the three new calculators are available with every code; the fire category now has nine', [!!w.document.getElementById('fr_results'), w.document.getElementById('fire-category').querySelectorAll('.calc-card').length], [true, 10]);

// ---------- Jordanian fire alarm code: detector layout, zones, sounders ----------
w = boot('jo'); doc = w.document; w.renderCalc('fadetect');
const fd = vals => { Object.keys(vals).forEach(id => setv(w, id, vals[id])); return w.calcFaDetect(); };
const fdRow = (r, part) => r.rows.find(x => x.n.includes(part));
let fx = fd({fd_type: 'smoke', fd_L: 12, fd_W: 8, fd_H: 3, fd_small: 100, fd_civ: 'no', fd_roof: 'flat', fd_cor: 'no', fd_obs: 0});
check('point smoke detector, 12 x 8 m: one detector covers it (half diagonal 7.21 m within 7.5 m, 96 m2 within 100 m2)', [fx.nArea, fx.n, +fx.grid.d.toFixed(2), fx.R, fx.Alim], [1, 1, 7.21, 7.5, 100]);
fx = fd({fd_type: 'h1'});
check('heat detector grade 1, 12 x 8 m: 96 / 50 = 2 detectors, 2 x 1 grid at 6 x 8 m, half diagonal 5.0 m within 5.3 m', [fx.nArea, fx.n, fx.grid.nx + 'x' + fx.grid.ny, +fx.grid.d.toFixed(2), fx.R, fx.Alim], [2, 2, '2x1', 5, 5.3, 50]);
fx = fd({fd_type: 'smoke', fd_L: 20, fd_W: 15});
check('point smoke 20 x 15 m = 300 m2: three by area, four by distance (2 x 2 grid, 6.25 m)', [fx.nArea, fx.nRadius, fx.n, +fx.grid.d.toFixed(2)], [3, 4, 4, 6.25]);
check('ceiling height, smoke: 10 m passes (general 10.5 m); 11 m fails for the whole ceiling; passes with the civil defence link (upper 15 m); a small part (10 %) passes up to 12.5 m and up to 18 m', [fd({fd_L: 12, fd_W: 8, fd_H: 10}).heightOk, fd({fd_H: 11}).heightOk, fd({fd_civ: 'yes'}).heightOk, (setv(w, 'fd_civ', 'no'), fd({fd_H: 12, fd_small: 10}).heightOk), fd({fd_H: 17, fd_small: 10}).heightOk, fd({fd_H: 19, fd_small: 10}).heightOk], [true, false, true, true, true, false]);
check('ceiling height, heat: grade 3 passes at 6 m and fails at 7 m; grade 2 passes at 7.5 m; grade 1 at 9 m, fails at 9.5 m; a small part of a grade 3 ceiling passes at 10 m', [fd({fd_type: 'h3', fd_H: 6, fd_small: 100}).heightOk, fd({fd_H: 7}).heightOk, fd({fd_type: 'h2', fd_H: 7.5}).heightOk, fd({fd_type: 'h1', fd_H: 9}).heightOk, fd({fd_H: 9.5}).heightOk, fd({fd_type: 'h3', fd_H: 10, fd_small: 10}).heightOk], [true, false, true, true, false, true]);
fx = fd({fd_type: 'h1', fd_H: 3, fd_small: 100, fd_L: 24, fd_W: 2, fd_cor: 'no'});
const nFlat = fx.n; fx = fd({fd_cor: 'yes'});
check('corridor 24 x 2 m: the heat distance grows by (5 - 2) / 2 = 1.5 m to 6.8 m and two detectors replace three', [nFlat, fx.n, +fx.R.toFixed(2)], [3, 2, 6.8]);
fx = fd({fd_type: 'smoke', fd_L: 20, fd_W: 15, fd_cor: 'no', fd_roof: 'pitched', fd_ang: 20});
check('pitched roof 20 degrees: + 20 % distance (9 m) and + 44 % area (144 m2): three detectors instead of four', [+fx.R.toFixed(2), +fx.Alim.toFixed(2), fx.n], [9, 144, 3]);
check('the roof slope allowance is capped at 25 % (40 degrees gives 9.375 m)', +fd({fd_ang: 40}).R.toFixed(3), 9.375);
fx = fd({fd_roof: 'flat', fd_L: 12, fd_W: 8, fd_H: 3, fd_obs: 200});
check('a 200 mm barrier (between 150 mm and 10 % of 3 m) cuts the distance by twice its depth: 7.5 - 0.4 = 7.1 m; a 400 mm barrier is a wall (note)', [+fx.R.toFixed(2), fd({fd_obs: 400}).R, fd({fd_obs: 400}).notes.length > 0], [7.1, 7.5, true]);
setv(w, 'fd_obs', 0);
fx = fd({fd_type: 'beam', fd_L: 60, fd_W: 30, fd_H: 3});
check('beam detectors over 60 x 30 m: 3 lines 10 m apart (5 m from the walls), 60 m long; height 2.7 - 25 m (40 m if stored goods are up to 5 m)', [fx.beams.lines, fx.beams.spacing, fx.beams.wallDist, fx.beams.length, fx.heightOk === undefined ? fdRow(fx, 'ارتفاع الحزمة').ok : fx.heightOk, fd({fd_H: 2.5}).rows[0].ok, fd({fd_H: 30}).rows[0].ok, fd({fd_H: 30, fd_stock: 'yes'}).rows[0].ok], [3, 10, 5, 60, true, false, false, true]);
setv(w, 'fd_stock', 'no'); fd({fd_type: 'smoke', fd_L: 12, fd_W: 8, fd_H: 3, fd_drop: 100, fd_wall: 600});
check('mounting: smoke element 25 - 600 mm below the ceiling (700 fails); heat 25 - 150 mm (160 fails); 500 mm from walls (400 fails)', [fd({fd_drop: 700}).ok, fd({fd_drop: 100}).ok, fd({fd_type: 'h1', fd_drop: 160}).ok, fd({fd_drop: 100}).ok, fd({fd_wall: 400}).ok, fd({fd_wall: 600}).ok], [false, true, false, true, false, true]);
fd({fd_type: 'smoke', fd_L: 12, fd_W: 8, fd_H: 3, fd_nf: 4, fd_af: 1500, fd_nc: 1, fd_sd: 25});
check('zones: 4 floors of 1500 m2 give 4 zones; 2500 m2 floors split in two (8 zones); three fire compartments per floor give 12; a building of 300 m2 or less is one zone', [fd({}).zones, fd({fd_af: 2500}).zones, fd({fd_af: 1500, fd_nc: 3}).zones, fd({fd_nf: 1, fd_af: 250, fd_nc: 1}).zones, fd({fd_nf: 1, fd_af: 250}).single], [4, 8, 12, 1, true]);
check('search distance: 35 m fails, 25 m passes', [fd({fd_nf: 4, fd_af: 1500, fd_sd: 35}).ok, fd({fd_sd: 25}).ok], [false, true]);
fx = fd({fd_amb: 62, fd_slp: 'no', fd_lvl: 66});
check('sounders: 62 dB(A) background needs 67 dB(A) (65 minimum); 66 fails; 70 passes; 55 dB(A) background needs 65', [fx.reqDb, fx.ok, fd({fd_lvl: 70}).ok, fd({fd_amb: 55, fd_lvl: 65}).reqDb], [67, false, true, 65]);
check('sleeping accommodation: 75 dB(A) at the bed head: 70 fails, 76 passes', [fd({fd_amb: 55, fd_slp: 'yes', fd_lvl: 70}).ok, fd({fd_lvl: 76}).ok], [false, true]);
setv(w, 'fd_slp', 'no'); setv(w, 'fd_lvl', 70);
check('manual call points within 30 m of walking (31 m fails); conductors 1.0 mm2 solid or 0.5 mm2 stranded', [fd({fd_trav: 31}).ok, fd({fd_trav: 25}).ok, fd({fd_cs: 0.75, fd_str: 'no'}).ok, fd({fd_cs: 1.0}).ok, fd({fd_cs: 0.5, fd_str: 'yes'}).ok, fd({fd_cs: 0.4}).ok], [false, true, false, true, true, false]);
setv(w, 'fd_cs', 1.5); setv(w, 'fd_str', 'no');
w.calcResult('fadetect');
check('the results show the number of detectors, the table of limits and the extra rules', ['عدد الكواشف المطلوب', 'الحد في الكودة', '800 mm', '500 و1000 Hz'].every(s => doc.getElementById('fd_results').textContent.includes(s)), true);
w = boot('intl'); w.renderCalc('fadetect');
check('the detector layout is available with every code', !!w.document.getElementById('fd_results'), true);

w = boot('intl'); w.renderCalc('egress');
check('the egress calculator is available with every code', [!!w.document.getElementById('eg_results'), w.document.getElementById('fire-category').querySelectorAll('.calc-card').length], [true, 10]);

// ---------- Jordan: septic tank, collecting pit, inspection chamber, Table 7 (sanitary drainage code 6/2, 6/3, 4/3) ----------
w = boot('jo'); doc = w.document; w.renderCalc('septic');
const sp = vals => { Object.keys(vals).forEach(id => setv(w, id, vals[id])); return w.calcSeptic(); };
let sx = sp({sp_P: 20, sp_q: 180, sp_W: 1.2, sp_d: 1.2, sp_days: 45, sp_hd: 4, sp_shape: 'circ', sp_pw: 2, sp_ic_h: 1.2, sp_ic_n: 2, sp_ic_bs: 100, sp_db: '', sp_dp: '', sp_dw: '', sp_dt: ''});
check('septic tank for 20 people: C = 0.18 x 20 + 2 = 5.6 m3; first compartment 2/3 = 3.73 m3, second 1/3 = 1.87 m3', [sx.tank.C, sx.tank.V1, sx.tank.V2], [5.6, 5.6 * 2 / 3, 5.6 / 3], 1e-9);
check('... 1.2 m wide and 1.2 m deep: lengths 2.59 m and 1.30 m (the 1.5 m limit of the second compartment applies above 6 m3 only), no extra opening, all checks pass', [+sx.tank.L1.toFixed(2), +sx.tank.L2.toFixed(2), sx.tank.rows[3].ok, sx.tank.rows[4].val, sx.tank.ok], [2.59, 1.30, null, 'غير مطلوبة', true]);
sx = sp({sp_P: 2});
check('2 people: C = 2.36 m3 is raised to 3 m3 (2 m3 + 1 m3), flagged', [sx.tank.C, sx.tank.Ct, sx.tank.V1, sx.tank.V2, sx.tank.raised], [2.36, 3, 2, 1, true], 1e-9);
sx = sp({sp_P: 100, sp_W: 1.5, sp_d: 1.5});
check('100 people: C = 20 m3, 13.33 + 6.67 m3 in a 1.5 x 1.5 m section: 5.93 m and 2.96 m, an extra opening above the baffle (first compartment over 3.7 m)', [sx.tank.C, +sx.tank.L1.toFixed(2), +sx.tank.L2.toFixed(2), sx.tank.rows[4].val, sx.tank.ok], [20, 5.93, 2.96, 'مطلوبة', true], 1e-9);
sx = sp({sp_P: 40, sp_W: 2, sp_d: 1.8});
check('40 people (9.2 m3) in a 2 x 1.8 m section: the second compartment is 0.85 m long, below 1.5 m (the tank exceeds 6 m3): fails', [+sx.tank.L2.toFixed(2), sx.tank.rows[3].ok, sx.tank.ok], [0.85, false, false]);
check('width below 1 m or liquid depth above 1.8 m or below 0.6 m fail', [sp({sp_P: 20, sp_W: 0.8, sp_d: 1.2}).tank.rows[0].ok, sp({sp_W: 1.2, sp_d: 2}).tank.rows[1].ok, sp({sp_d: 0.5}).tank.rows[1].ok], [false, false, false]);
sx = sp({sp_W: 1.2, sp_d: 1.2});
check('collecting pit, 20 people x 180 L x 45 days = 162 m3; total depth 4 m (effective 3.4 m): 47.6 m2, circular 7.79 m, square 6.90 m, rectangular 23.8 x 2 m', [+sx.pit.V.toFixed(6), +sx.pit.A.toFixed(1), +sx.pit.dim.toFixed(2), +sp({sp_shape: 'square'}).pit.dim.toFixed(2), +sp({sp_shape: 'rect', sp_pw: 2}).pit.dim.toFixed(1)], [162, 47.6, 7.79, 6.9, 23.8]);
sp({sp_shape: 'circ'});
check('pit checks: 45 days, 180 L and 4 m depth pass; 30 days, 150 L or 5 m fail', [sx.pit.ok, sp({sp_days: 30}).pit.rows[0].ok, sp({sp_days: 45, sp_q: 150}).pit.rows[1].ok, sp({sp_q: 180, sp_hd: 5}).pit.rows[2].ok], [true, false, false, false]);
sp({sp_hd: 4});
check('inspection chamber, 1.2 m deep, 2 branches of 100 mm: round 600 mm (400 and 500 are too shallow), rectangular 900 x 600', [sp({}).ic.round[1], w.calcSeptic().ic.rect[1]], ['600', '900 × 600']);
check('0.5 m deep: 400 mm; 0.7 m deep: 500 mm (400 mm is only 600 mm deep); 3 branches at 0.5 m: 500 mm', [sp({sp_ic_h: 0.5}).ic.round[1], sp({sp_ic_h: 0.7}).ic.round[1], sp({sp_ic_h: 0.5, sp_ic_n: 3}).ic.round[1]], ['400', '500', '500']);
check('3 m deep with 4 branches of 200 mm: round 900 mm, rectangular 1500 x 900; step irons from 1.5 m', [sp({sp_ic_h: 3, sp_ic_n: 4, sp_ic_bs: 200}).ic.round[1], w.calcSeptic().ic.rect[1], w.calcSeptic().ic.stepIrons, sp({sp_ic_h: 1.4, sp_ic_n: 2, sp_ic_bs: 100}).ic.stepIrons], ['900', '1500 × 900', true, false]);
check('a 200 mm branch needs the 900 mm round or the 1200 x 900 mm rectangular chamber; 5 branches or 5 m of depth: no chamber in Table 8', [sp({sp_ic_h: 1.2, sp_ic_n: 2, sp_ic_bs: 200}).ic.round[1], w.calcSeptic().ic.rect[1], sp({sp_ic_n: 5, sp_ic_bs: 100}).ic.round, w.calcSeptic().ic.rect, sp({sp_ic_n: 2, sp_ic_h: 5}).ic.round], ['900', '1200 × 900', null, null, null]);
sp({sp_ic_h: 1.2, sp_ic_n: 2, sp_ic_bs: 100});
sx = sp({sp_db: 1, sp_dp: 2, sp_dw: 3, sp_dt: 3});
check('Table 7: 1 m to a building fails for the tank (1.5) and the pit (3.5); 2 m to the property line passes for the tank only; 3 m to a watertight water tank fails (3.5) with the drain pipe passing (2.5); 3 m to trees passes for both', [sx.t7.map(r => r.okTank), sx.t7.map(r => r.okPit), sx.t7[2].okDrain, sx.pitFails], [[false, true, false, true], [false, false, false, true], true, true]);
sx = sp({sp_db: 4, sp_dp: 4, sp_dw: 16, sp_dt: 5});
check('4 m, 4 m, 16 m and 5 m: every distance passes (tank and pit)', [sx.t7.every(r => r.okTank && r.okPit), sx.pitFails], [true, false]);
sx = sp({sp_db: '', sp_dp: '', sp_dw: '', sp_dt: ''});
check('blank distances: shown without a check', [sx.t7.map(r => r.okTank), sx.pitFails], [[null, null, null, null], false]);
setv(w, 'sp_dw', 3); w.calcResult('septic');
const spText = doc.getElementById('sp_results').textContent;
check('the results quote 6/2/3, the pit rules, Table 7 and the inspection chamber rules', ['6/2/3', '6/3/7', 'الجدول 7', '4/3/3 J', '4/1/5', 'حفرة تجميعية كتيمة'].every(s => spText.includes(s)), true);
w = boot('intl'); w.renderCalc('septic');
check('the septic calculator is available with every code and the plumbing screen counts 21 calculators', [!!w.document.getElementById('sp_results'), w.document.body.textContent.includes('21 حاسبة متاحة')], [true, true]);

// ---------- Jordan: central heating code Tables 9, 10, 11 and 5/3/6 (heatexpansion) ----------
w = boot('jo'); doc = w.document; w.renderCalc('heatexpansion');
const hxj = vals => { Object.keys(vals).forEach(id => setv(w, id, vals[id])); return w.calcHeatExpansion().jo; };
let hj = hxj({hx_q: 100, hx_vw: '', hx_ar: ''});
check('boiler 100 kW: feed pipe 25 mm (58.6 - 146.5 kW), safety pipe 25 mm, drain valve 32 mm (87.9 - 175.8 kW); no tank minimum without a volume or a surface', [hj.feed, hj.safety, hj.drain, hj.tank], [25, 25, 32, null]);
hj = hxj({hx_q: 50});
check('50 kW: feed 20 mm (below 58.6 kW), safety 20 mm, drain valve 25 mm (43.95 - 87.9 kW)', [hj.feed, hj.safety, hj.drain], [20, 20, 25]);
check('the limits of the printed bands go to the larger size: 58.6 kW -> 25 mm feed; 43.95 kW -> 25 mm drain; 586 kW -> 50 mm; 263.7 kW -> 50 mm drain', [hxj({hx_q: 58.6}).feed, hxj({hx_q: 43.95}).drain, hxj({hx_q: 586}).feed, hxj({hx_q: 263.7}).drain, hxj({hx_q: 293}).safety, hxj({hx_q: 1000}).safety], [25, 25, 50, 50, 40, 50]);
hj = hxj({hx_q: 100, hx_vw: 500, hx_ar: ''});
check('tank minimum: 0.08 x 500 L = 40 L; 60 m2 of radiating surface = 60 L; both: the larger (60 L)', [hj.tank, hxj({hx_vw: '', hx_ar: 60}).tank, hxj({hx_vw: 500, hx_ar: 60}).tank], [40, 60, 60], 1e-9);
setv(w, 'hx_vw', 500); setv(w, 'hx_ar', 60); w.calcResult('heatexpansion');
check('the results show Tables 9 - 11, 5/3/6 and the 0.08 note', ['جدول 9', 'جدول 10', 'جدول 11', '5/3/6', '5/3/8'].every(s => doc.getElementById('hx_results').textContent.includes(s)), true);
w = boot('intl'); w.renderCalc('heatexpansion');
check('other codes keep the Syrian expansion tank calculator without the Jordanian block', [!!w.document.getElementById('hx_results'), !w.document.getElementById('hx_vw'), w.calcHeatExpansion().jo], [true, true, null]);

// ---------- Jordan: central heating code Tables 12, 13 and 14 (pipe supports and insulation, heatingpipes) ----------
w = boot('jo'); doc = w.document; w.renderCalc('heatingpipes');
const H12 = w.eval('JSON.parse(JSON.stringify(JO_HANGERS))'), I13 = w.eval('JSON.parse(JSON.stringify(JO_INS_HOT))'), I14 = w.eval('JSON.parse(JSON.stringify(JO_INS_FROST))');
const rise = a => a.every((x, i) => !i || x >= a[i - 1]), fall = a => a.every((x, i) => !i || x <= a[i - 1]);
check('Table 12: nine sizes 15 - 100 mm, the spacing never falls with the size and is never longer for a horizontal than for a vertical pipe', [H12.length, rise(H12.map(r => r[1])), rise(H12.map(r => r[2])), H12.every(r => r[1] <= r[2])], [9, true, true, true]);
check('Table 12 spot values: 15 mm 1.8 / 2.5 m, 32 mm 2.7 / 3.0, 65 mm 3.0 / 4.5, 100 mm 4.0 / 4.5; sizes above 100 mm take the last row; 15 mm is the floor', [15, 32, 65, 100, 150, 300, 12].map(d => w.joHanger(d).slice(1)), [[1.8, 2.5], [2.7, 3.0], [3.0, 4.5], [4.0, 4.5], [4.0, 4.5], [4.0, 4.5], [1.8, 2.5]]);
check('Table 13: the thickness rises with the conductivity and with the diameter (4 bands x 5 columns); Table 14 rises with the conductivity, falls with the diameter, and the outdoor values exceed the indoor ones',
  [I13.length, I13.every(b => b[1].length === 5 && rise(b[1])), I13.every((b, i) => !i || b[1].every((x, j) => x > I13[i - 1][1][j])), I14.every(b => rise(b[1]) && rise(b[2]) && b[1].every((x, j) => x < b[2][j])), I14.every((b, i) => !i || b[1].every((x, j) => x < I14[i - 1][1][j]))], [4, true, true, true, true]);
const ins = (dn, k, loc) => w.joInsulation(dn, k, loc);
check('Table 13 at 0.04 W/mK: 25 mm pipe 16 mm; at the printed limits the thicker band is taken (20 mm -> 16, not 12; 80 mm -> 23, not 16; 200 mm -> 31 flat-surface band 31, not 23); 15 mm -> 12', [25, 20, 80, 200, 15].map(d => ins(d, 0.04, '').hot), [16, 16, 23, 31, 12]);
check('conductivity columns: 0.03 -> 8 mm (15 mm pipe), 0.035 uses the 0.04 column, 0.07 -> 31 mm, above 0.07 there is no value', [ins(15, 0.03, '').hot, ins(15, 0.035, '').col, ins(15, 0.07, '').hot, ins(15, 0.08, '')], [8, 0.04, 31, null]);
check('Table 14 at 0.05: 40 mm indoors 46 (limit: the thicker band) and outdoors 54; 100 mm indoors 24 and outdoors 28; 80 mm indoors 30 (limit) ; the governing value is the larger of Tables 13 and 14', [ins(40, 0.05, 'in').frost, ins(40, 0.05, 'out').frost, ins(100, 0.05, 'in').frost, ins(100, 0.05, 'out').frost, ins(80, 0.05, 'in').frost, ins(100, 0.05, 'out').gov, ins(100, 0.05, '').gov], [46, 54, 24, 28, 30, 31, 31]);
let fb = true; for (const dn of [15, 20, 25, 32, 40, 50, 65, 80, 100, 125, 150, 200, 250, 300]) for (const k of [0.03, 0.04, 0.05, 0.06, 0.07]) for (const loc of ['in', 'out']) { const x = ins(dn, k, loc); if (!(x.frost > 0 && x.gov >= x.hot && x.gov >= x.frost)) fb = false; }
check('every size and column has values in both tables and the governing thickness is the larger of the two', fb, true);
setv(w, 'hp_ik', 0.04); setv(w, 'hp_loc', 'in');
let hpj = w.calcHeatingPipes().jo;
check('the calculator fills the supports and the insulation for each loaded pipe row (3 rows) with the 0.04 column and indoor frost protection', [hpj.rows.length, hpj.ik, hpj.loc, hpj.rows.every(r => r.hang && r.ins && r.ins.col === 0.04 && r.ins.frost != null), hpj.tooHigh], [3, 0.04, 'in', true, false]);
w.calcResult('heatingpipes');
check('the results show Tables 12 - 14 and the sleeve (10 mm, 30 mm), 20 mm / 80 mm clearance, 100 mm wall and 33.3 % expansion-joint rules', ['الجداول 12 و13 و14', '5/5/4 C', '10 mm', '30 mm', '20 mm', '80 mm', '100 mm', '33.3%'].every(s => doc.getElementById('hp_results').textContent.includes(s)), true);
setv(w, 'hp_ik', 0.08); hpj = w.calcHeatingPipes().jo;
check('a conductivity above 0.07 gives no thickness and a warning', [hpj.tooHigh, hpj.rows.every(r => r.ins === null)], [true, true]);
w.calcResult('heatingpipes');
check('... which the results state', doc.getElementById('hp_results').textContent.includes('أعلى من أكبر عمود'), true);
w = boot('sy'); w.renderCalc('heatingpipes');
check('other codes have no insulation fields and no Jordanian supports block', [!w.document.getElementById('hp_ik'), w.calcHeatingPipes().jo], [true, null]);

// ---------- Jordan: thermal insulation code 8/3, Tables 24 and 25 (design ratio of the heating energy, heatingload) ----------
w = boot('jo'); doc = w.document; w.renderCalc('heatingload');
const HRT = w.eval('JSON.parse(JSON.stringify({d: JO_OCC_DAILY, w: JO_OCC_WEEK, p: JO_PLANT}))');
check('Table 24: daily factors for 4 / 8 / 12 / 16 h: light 0.68 / 1.00 / 1.25 / 1.40, heavy 0.96 / 1.00 / 1.02 / 1.03; five days: light 0.75, heavy 0.85; Table 25 (low / high time lag): light 0.55 / 0.70, medium 0.70 / 0.85, heavy 0.85 / 0.95', [HRT.d, HRT.w, HRT.p], [{light: {4: 0.68, 8: 1, 12: 1.25, 16: 1.4}, heavy: {4: 0.96, 8: 1, 12: 1.02, 16: 1.03}}, {light: 0.75, heavy: 0.85}, {light: {low: 0.55, high: 0.70}, medium: {low: 0.70, high: 0.85}, heavy: {low: 0.85, high: 0.95}}]);
check('the daily factor rises with the hours (and changes far more for a light building), and Table 25 rises with the inertia of the building and with its time lag', [Object.values(HRT.d.light).every((x, i, a) => !i || x >= a[i - 1]), Object.values(HRT.d.heavy).every((x, i, a) => !i || x >= a[i - 1]), HRT.d.light[16] - HRT.d.light[4] > HRT.d.heavy[16] - HRT.d.heavy[4], ['light', 'medium', 'heavy'].every((k, i, a) => HRT.p[k].high > HRT.p[k].low && (!i || HRT.p[k].low > HRT.p[a[i - 1]].low))], [true, true, true, true]);
const hr = w.joHeatRatio('light', 5, 12, 'intermittent', 'high');
check('the code example (8/3/3): light building, high time lag, 12 h a day, 5 days a week: 0.70 x 1.25 x 0.75 = 0.656 (printed 0.66)', [hr.daily, hr.weekly, hr.plant, Math.abs(hr.ratio - 0.65625) < 1e-9, hr.mean], [1.25, 0.75, 0.70, true, false]);
check('continuous plant and seven days: only the daily factor remains (heavy 16 h: 1.03); heavy, 4 h, 5 days, intermittent, low lag: 0.96 x 0.85 x 0.85', [w.joHeatRatio('heavy', 7, 16, 'continuous', 'low').ratio, +w.joHeatRatio('heavy', 5, 4, 'intermittent', 'low').ratio.toFixed(4)], [1.03, +(0.96 * 0.85 * 0.85).toFixed(4)]);
const hm = w.joHeatRatio('medium', 5, 12, 'intermittent', 'low');
check('the medium column is empty in the print: the mean of the light and heavy values is used (12 h: 1.135, 5 days: 0.80) and flagged; 8 h and 7 days is exact', [Math.abs(hm.daily - 1.135) < 1e-9, Math.abs(hm.weekly - 0.80) < 1e-9, hm.plant, hm.mean, w.joHeatRatio('medium', 7, 8, 'continuous', 'high').mean, w.joHeatRatio('medium', 7, 8, 'continuous', 'high').ratio], [true, true, 0.70, true, false, 1]);
let hl = w.calcHeatingLoad();
check('defaults: heavy building, 7 days, 8 h, continuous plant: ratio 1.0 (no reduction)', [hl.jo.inertia, hl.jo.days, hl.jo.hours, hl.jo.ops, hl.jo.ratio], ['heavy', 7, 8, 'continuous', 1]);
setv(w, 'hl_inertia', 'light'); setv(w, 'hl_wk', '5'); setv(w, 'hl_hrs', '12'); setv(w, 'hl_ops', 'intermittent'); setv(w, 'hl_lag', 'high');
hl = w.calcHeatingLoad();
check('the form values give the code example (0.656)', Math.abs(hl.jo.ratio - 0.65625) < 1e-9, true);
w.calcResult('heatingload');
check('the results show Tables 24 and 25, the ratio 0.66 example and the reduced load beside the full one, and the medium-column warning only for a medium building', [['جدول 24', 'جدول 25', '0.70 × 1.25 × 0.75 = 0.66', 'حمل التدفئة بعد النسبة'].every(s => doc.getElementById('hl_results').textContent.includes(s)), doc.getElementById('hl_results').textContent.includes('عمود المبنى المتوسط')], [true, false]);
setv(w, 'hl_inertia', 'medium'); w.calcResult('heatingload');
check('... the warning appears for the medium building', doc.getElementById('hl_results').textContent.includes('عمود المبنى المتوسط'), true);
w = boot('sy'); w.renderCalc('heatingload');
check('other codes have no occupancy fields and no ratio block', [!w.document.getElementById('hl_inertia'), w.calcHeatingLoad().jo], [true, null]);

// ---------- Jordan: thermal insulation code 4/3 (surface resistances, cavities and materials in `uvalue`) ----------
w = boot('jo'); doc = w.document; w.renderCalc('uvalue');
const FRM = w.eval('JSON.parse(JSON.stringify({rse: JO_RSE, rsi: JO_RSI, cav: JO_CAVITY, mats: JO_MATS}))');
check('Table 13 outside film: walls A 0.08 / 0.06 / 0.03 and B 0.10 / 0.07 / 0.03; roofs A 0.07 / 0.04 / 0.02 and B 0.09 / 0.05 / 0.02; the exposed underside of a floor 0.09 (sheltered only)', [FRM.rse.wall.A, FRM.rse.wall.B, FRM.rse.roof.A, FRM.rse.roof.B, FRM.rse.floor.A], [[0.08, 0.06, 0.03], [0.10, 0.07, 0.03], [0.07, 0.04, 0.02], [0.09, 0.05, 0.02], [0.09, null, null]]);
check('Table 14 inside film: walls A 0.12 and B 0.31, roofs (upward) A 0.10 and B 0.21, floors (downward) A 0.15; Table 16 cavities: 5 mm A 0.11 / 0.11, B 0.18 / 0.18; 20 mm and more A 0.18 / 0.20, B 0.35 / 1.06', [FRM.rsi.wall, FRM.rsi.roof, FRM.rsi.floor.A, FRM.cav[5], FRM.cav[20]], [{A: 0.12, B: 0.31}, {A: 0.10, B: 0.21}, 0.15, {A: [0.11, 0.11], B: [0.18, 0.18]}, {A: [0.18, 0.20], B: [0.35, 1.06]}]);
check('the outside film falls with the exposure and a shiny surface (B) resists more than a building material (A); a wider cavity resists more and downward flow more than horizontal', [FRM.rse.wall.A.every((x, i) => !i || x < FRM.rse.wall.A[i - 1]), FRM.rse.wall.B.every((x, i) => x >= FRM.rse.wall.A[i]), FRM.rse.roof.A.every((x, i) => !i || x < FRM.rse.roof.A[i - 1]), [5, 20].every(wd => ['A', 'B'].every(t => FRM.cav[wd][t][1] >= FRM.cav[wd][t][0])), ['A', 'B'].every(t => FRM.cav[20][t][0] >= FRM.cav[5][t][0])], [true, true, true, true, true]);
check('joFilm: wall B in severe exposure 0.31 + 0.03; roof A moderate 0.10 + 0.04; the floor has only its sheltered outer value (0.09 reused for moderate: flagged) and no inner B (0.15 reused: flagged)', [w.joFilm('wall', 2, 'B'), w.joFilm('roof', 1, 'A'), w.joFilm('floor', 1, 'A'), w.joFilm('floor', 0, 'B')].map(f => [f.rsi, f.rse, f.fallback.join('+')]), [[0.31, 0.03, ''], [0.10, 0.04, ''], [0.15, 0.09, 'rse'], [0.15, 0.09, 'rse+rsi']]);
const fam = (n) => FRM.mats.filter(m => m[0].startsWith(n)).sort((a, b) => a[1] - b[1]);
check('Table 15 families: k rises with the density for foam concrete (10 rows), lightweight concrete (6), hollow concrete block (4 + 1 for slabs), hollow clay brick (5), soft stone (2), asbestos cement (2), asphalt mix (2)', ['خرسانة رغوية', 'خرسانة بركام طبيعي خفيف', 'طوب خرساني مفرغ', 'طوب طيني مشوي مفرغ', 'حجر رخو', 'ألواح أسبست إسمنتي', 'خلطة زفتية'].map(n => [fam(n).length, fam(n).every((m, i) => !i || m[2] >= fam(n)[i - 1][2])]), [[10, true], [6, true], [5, true], [5, true], [2, true], [2, true], [2, true]]);
const mat = (n, d) => FRM.mats.find(m => m[0] === n && m[1] === d);
check('Table 15 spot values: marble 2.90, soft stone 1750 1.05, normal concrete 1.75, foam concrete 1000 0.42 and 400 0.14, hollow concrete block 1400 0.90, cement plaster 1.20, mortar 1.40, steel 60, aluminium 200, EPS 25 0.034, XPS 0.030, cork 145 0.042', [mat('رخام', 2600)[2], mat('حجر رخو', 1750)[2], mat('خرسانة عادية ومسلحة بركام عادي الوزن', 2300)[2], mat('خرسانة رغوية', 1000)[2], mat('خرسانة رغوية', 400)[2], mat('طوب خرساني مفرغ', 1400)[2], mat('قصارة إسمنتية', 2000)[2], mat('ملاط (مونة إسمنتية)', 2000)[2], mat('فولاذ', 7800)[2], mat('ألومنيوم', 2800)[2], mat('بوليسترين ممدد (ألواح)', 25)[2], mat('بوليسترين مبثوق (ألواح)، لا تقل كثافته عن', 25)[2], mat('ألواح فلين', 145)[2]], [2.90, 1.05, 1.75, 0.42, 0.14, 0.90, 1.20, 1.40, 60, 200, 0.034, 0.030, 0.042]);
check('every row has a positive conductivity, and rows flagged as paired by position are only the fibre, glass wool, cork and bitumen ones', [FRM.mats.every(m => m[2] > 0), [...new Set(FRM.mats.filter(m => m[3]).map(m => m[0].split(':')[0].split(' (')[0]))].sort()], [true, ['ألواح فلين', 'ألياف معدنية', 'زفت وبيتومين', 'صوف زجاجي'].sort()]);
check('Jordan U-value form: film 0.12 + 0.06 (wall, moderate, type A); the Table 15 materials are an extra group at the end of every layer list', [+doc.getElementById('uv_rsi').value, +doc.getElementById('uv_rse').value, doc.querySelectorAll('#uv-tbody tr:first-child .uv-mat optgroup option').length], [0.12, 0.06, FRM.mats.length]);
let uj = w.calcUValue();
check('the default external wall (plaster 30, block 150, insulation 40, mortar 30, limestone 30) with the code film: U = 1 / (0.12 + 1.2359 + 0.06) = 0.706', +uj.U.toFixed(3), 0.706);
setv(w, 'uv_cav', '20'); uj = w.calcUValue();
check('a 20 mm unventilated cavity adds 0.18 m2K/W (horizontal flow, type A): U = 0.627', [uj.Rcav, +uj.U.toFixed(3)], [0.18, 0.627]);
setv(w, 'uv_cav', ''); setv(w, 'uv_exp', '2'); w.uvJoChange();
check('severe exposure lowers the outside film to 0.03 (U rises to 0.722)', [+doc.getElementById('uv_rse').value, +w.calcUValue().U.toFixed(3)], [0.03, 0.722]);
setv(w, 'uv_mt', 'B'); w.uvJoChange();
check('a shiny surface (B): inside 0.31 and outside 0.03 in severe exposure', [+doc.getElementById('uv_rsi').value, +doc.getElementById('uv_rse').value], [0.31, 0.03]);
setv(w, 'uv_elemtype', 'roof'); w.uvElemTypeChange(doc.getElementById('uv_elemtype'));
check('changing the element to a roof refills the film from Tables 13 and 14 (B, severe: 0.21 + 0.02)', [+doc.getElementById('uv_rsi').value, +doc.getElementById('uv_rse').value], [0.21, 0.02]);
setv(w, 'uv_elemtype', 'floor'); setv(w, 'uv_cav', '20'); setv(w, 'uv_mt', 'B'); const ujf = w.calcUValue();
check('a floor with a 20 mm type B cavity (heat flow downward) takes 1.06 m2K/W', ujf.Rcav, 1.06);
setv(w, 'uv_cav', ''); setv(w, 'uv_mt', 'A'); setv(w, 'uv_exp', '1'); w.uvJoChange();
w.loadUvAssembly('int_wall');
check('the internal partition takes the inner film on both faces (0.12 + 0.12 for a wall, type A) from the code, not the office value 0.123', [doc.getElementById('uv_elemtype').value, +doc.getElementById('uv_rsi').value, +doc.getElementById('uv_rse').value], ['wall', 0.12, 0.12]);
w.calcResult('uvalue');
check('the results state the Jordanian film and the unused values of the code (Tables 13, 14, 16, the position-paired rows of Table 15)', ['كودة العزل الحراري الأردنية', 'الجدولين 13 و14', 'الجدول 16', 'رُبطت بموادها بترتيب ورودها'].every(s => doc.getElementById('uv_results').textContent.includes(s)), true);
w = boot('intl'); w.renderCalc('uvalue');
check('other codes keep the ISO film and the material list without the Jordanian group', [+w.document.getElementById('uv_rsi').value, !w.document.getElementById('uv_exp'), w.document.querySelectorAll('#uv-tbody tr:first-child .uv-mat optgroup').length, w.calcUValue().Rcav], [0.123, true, 0, 0]);

// ---------- Jordan: sanitary drainage code Table 4 and chapter 5 (vents, `vent`) ----------
w = boot('jo'); doc = w.document; w.renderCalc('vent');
const T4 = w.eval('JSON.parse(JSON.stringify({s: JO_DR_SIZES, v: JO_DR_VERT, h: JO_DR_HORZ, l: JO_DR_VLEN, vu: JO_VENT_UNITS, vl: JO_VENT_LEN}))');
check('Table 4: 11 drain sizes 32 - 300 mm, units rise with the size, horizontal never above vertical; 9 vent sizes (32 - 200 mm) with units and lengths rising', [T4.s.length, rise(T4.v), rise(T4.h), T4.h.every((x, i) => x <= T4.v[i]), T4.vu.length, rise(T4.vu), rise(T4.vl), T4.l.filter(x => x != null).length], [11, true, true, true, 9, true, true, 9]);
check('Table 4 cross-check: vents of 100 - 200 mm carry the vertical-drain units (256, 600, 1380, 3600) and vents of 32 and 80 - 200 mm have the vertical-drain lengths (13.7, 64.5, 91.8, 118.6, 155, 228)', [T4.vu.slice(5), [0, 4, 5, 6, 7, 8].map(i => T4.vl[i]), [0, 4, 5, 6, 7, 8].map(i => T4.l[i])], [[256, 600, 1380, 3600], [13.7, 64.5, 91.8, 118.6, 155, 228], [13.7, 64.5, 91.8, 118.6, 155, 228]]);
const jv = (u, L, s, t) => w.joVent(u, L, s || 4, t || 'stack');
check('vent size: 20 units over 30 m -> 50 mm (24 units, 36.5 m); over 40 m -> 65 mm; 1 unit 13 m -> 32 mm; 8 units 18 m -> 40 mm; 9 units over 10 m -> 50 mm', [jv(20, 30).size, jv(20, 40).size, jv(1, 13).size, jv(8, 18).size, jv(9, 10).size], [50, 65, 32, 40, 50]);
check('5/3/1 C: 40 units (65 mm) over 70 m needs 100 mm by the table (91.8 m) but 80 mm for the whole length if the excess over the 65 mm length (54.7 m) is within a third (72.9 m); over 80 m only the table size remains', [jv(40, 70).size, jv(40, 70).altC, jv(40, 80).size, jv(40, 80).altC], [100, 80, 100, 100]);
check('limits: 5000 units exceed the table; 30 units over 300 m exceed every length; wet vents: 1 unit 40 mm, 4 units 50 mm, 5 units not allowed', [jv(5000, 10).exceeds, jv(30, 300).exceeds, jv(1, 5, 4, 'wet').size, jv(4, 5, 4, 'wet').size, jv(5, 5, 4, 'wet').exceeds], ['units', 'length', 40, 50, 'wet']);
check('the stack check uses the vertical units: a 4 in (100 mm) stack takes 256, so 300 fails and 200 passes; 1 1/2 in -> 40 mm takes 2', [jv(300, 10, 4).drainOk, jv(200, 10, 4).drainOk, jv(2, 5, 1.5).drainOk, jv(3, 5, 1.5).drainOk, jv(10, 5, 4).stackMm], [false, true, true, false, 100]);
setv(w, 'vt_dfu', 40); setv(w, 'vt_length', 70); setv(w, 'vt_stackdia', 4); setv(w, 'vt_type', 'stack');
let vj = w.calcVent().jo;
check('the calculator gives the Jordanian result next to the IPC one (100 mm by the table, 80 mm by 5/3/1 C)', [vj.size, vj.altC, vj.stackMm], [100, 80, 100]);
w.calcResult('vent');
check('the results show the Table 4 block first and the IPC result marked for comparison, with the vent terminal (150 mm, 3 m, 2 m / 1 m) and the wet-vent / circuit-vent rules', ['الجدول 4 والباب الخامس', 'IPC للمقارنة', '150 mm', '3 m', 'مترين أفقيًا', '5/4/2', '5/4/3', '5/4/5', '45°'].every(s => doc.getElementById('vent_result').textContent.includes(s)), true);
w = boot('intl'); w.renderCalc('vent'); w.calcResult('vent');
check('other codes keep the IPC vent result without the Jordanian block', [w.calcVent().jo, w.document.getElementById('vent_result').textContent.includes('الجدول 4 والباب الخامس')], [null, false]);

// the other codes are unchanged
w = boot('sa');
w.renderCalc('cablesizing');
check('Saudi: IEC reference, 5 % limit with the length allowance, 40 C', [w.document.getElementById('cs_std').value, +w.document.getElementById('cs_vdlim').value, +w.document.getElementById('cs_amb').value], ['iec', 5, 40]);
w = boot('intl');
w.renderCalc('cablesizing');
check('International: NEC, 3 %', [w.document.getElementById('cs_std').value, +w.document.getElementById('cs_vdlim').value], ['nec', 3]);

check('no page errors', errors, []);
console.log(fail ? '\n' + fail + ' FAILED' : '\nAll national-code (UAE, Jordan) checks passed');
process.exit(fail ? 1 : 0);
