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
check('the three new calculators are available with every code; the fire category now has eleven', [!!w.document.getElementById('fr_results'), w.document.getElementById('fire-category').querySelectorAll('.calc-card').length], [true, 11]);

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
check('the egress calculator is available with every code', [!!w.document.getElementById('eg_results'), w.document.getElementById('fire-category').querySelectorAll('.calc-card').length], [true, 11]);

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
check('the septic calculator is available with every code and the plumbing screen counts 23 calculators', [!!w.document.getElementById('sp_results'), w.document.body.textContent.includes('23 حاسبة متاحة')], [true, true]);

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

// ---------- Jordan: sanitary fixture count (natural ventilation and sanitary principles code, chapter 4 and Appendix E, `sanfix`) ----------
w = boot('jo'); doc = w.document; w.renderCalc('sanfix');
const SFT = w.eval('JSON.parse(JSON.stringify(JO_SF))');
check('Appendix E tables: counts never fall with the head count; 12 cinema rows (2 at 100 seats up to 11 at 1200), offices 3 / 5 / 6 / 8 / 9 / 10 / 12 / 14, 19 school rows (4 at 100 boys up to 34), industrial men 3 - 13, women 4 - 21 and urinals 2 - 11 for 50 - 400 persons',
  [Object.values(SFT).every(t => t.every((r, i) => !i || (r[0] > t[i - 1][0] && r[1] >= t[i - 1][1]))), SFT.cinema.length, SFT.office.map(r => r[1]), SFT.school.length, [SFT.school[0][1], SFT.school[18][1]], SFT.indM.map(r => r[1]), SFT.indW.map(r => r[1]), SFT.indU.map(r => r[1])],
  [true, 12, [3, 5, 6, 8, 9, 10, 12, 14], 19, [4, 34], [3, 4, 6, 7, 9, 10, 12, 13], [4, 6, 9, 11, 14, 17, 19, 21], [2, 4, 6, 7, 8, 9, 10, 11]]);
const sfRun = (t, o) => { setv(w, 'sf_type', t); for (const [k, x] of Object.entries(Object.assign({sf_n: 0, sf_m: 0, sf_f: 0, sf_cust: 0, sf_sp: 'ratio', sf_pw: 66.7, sf_sex: 'boys', sf_staff: 'no', sf_ind: 'clean', sf_wait: 'no', sf_sport: 'no', sf_area: ''}, o || {}))) setv(w, k, x); return w.calcSanFix(); };
const sfr = (r, who) => r.rows.find(x => x.who.includes(who));
let sf = sfRun('cinema', {sf_n: 1200});
check('the code example, a 1200 seat cinema: 11 water closets -> women 4 + 2 basins; men 8 water closets, 4 basins, 6 urinals, and 8 - 2 = 6 water closets (not below 3/4 of 8)', [sfr(sf, 'نساء').wc, sfr(sf, 'نساء').basin, sfr(sf, 'رجال').wc, sfr(sf, 'رجال').basin, sfr(sf, 'رجال').urinal], [4, 2, 6, 4, 6]);
sf = sfRun('theatre', {sf_n: 1200});
check('a theatre adds 20 %: 11 -> 14 water closets; women 5, men 10 required, 7 urinals, men 10 - 2 = 8 (3/4 of 10 = 7.5 -> 8), basins 3 and 5', [sfr(sf, 'نساء').wc, sfr(sf, 'نساء').basin, sfr(sf, 'رجال').wc, sfr(sf, 'رجال').urinal, sfr(sf, 'رجال').basin], [5, 3, 8, 7, 5]);
sf = sfRun('office', {sf_n: 90, sf_sp: 'full'});
check('the code example, offices 90 persons for each sex: 5 water closets and 3 basins for women; men 5 - 1 = 4 water closets, 3 urinals and 3 basins (3/4 x 5 < 4)', [sfr(sf, 'نساء').wc, sfr(sf, 'نساء').basin, sfr(sf, 'رجال').wc, sfr(sf, 'رجال').urinal, sfr(sf, 'رجال').basin], [5, 3, 4, 3, 3]);
sf = sfRun('office', {sf_n: 240, sf_sp: 'full'});
check('... 240 persons: 9 water closets and 5 basins for women; men 8, 5 urinals, 5 basins', [sfr(sf, 'نساء').wc, sfr(sf, 'نساء').basin, sfr(sf, 'رجال').wc, sfr(sf, 'رجال').urinal, sfr(sf, 'رجال').basin], [9, 5, 8, 5, 5]);
sf = sfRun('office', {sf_n: 90});
check('offices by the 2 : 1 ratio: 90 persons = 60 women (the 100 row: 5 water closets) and 30 men (the 50 row: 3, no reduction below 3/4: 3), 2 urinals and 2 basins', [sfr(sf, 'نساء').wc, sfr(sf, 'رجال').wc, sfr(sf, 'رجال').urinal, sfr(sf, 'رجال').basin], [5, 3, 2, 2]);
sf = sfRun('community', {sf_n: 4500, sf_sport: 'yes'});
check('a community centre of 4500 people: men 3, women 2 water closets; a urinal per men\'s water closet; two basins per 3 water closets; sports facilities add 3 water closets, 2 basins, 5 showers and 20 lockers per sex', [sfr(sf, 'رجال').wc, sfr(sf, 'نساء').wc, sfr(sf, 'رجال').urinal, sfr(sf, 'رجال').basin, sfr(sf, 'نساء').basin, sfr(sf, 'المرافق').shower, sfr(sf, 'المرافق').other], [3, 2, 3, 2, 2, 5, '20 صندوق ملابس']);
sf = sfRun('park', {sf_n: 6000});
check('a park of 6000 people: 3600 men (the 4500 row: 3) and 2400 women (the 3000 row: 2), a urinal and a basin per 2 water closets', [sfr(sf, 'رجال').wc, sfr(sf, 'نساء').wc, sfr(sf, 'رجال').urinal, sfr(sf, 'رجال').basin], [3, 2, 2, 2]);
sf = sfRun('station', {sf_n: 6000, sf_wait: 'yes'});
check('a station of 6000 travellers waiting over an hour (+30 %): 4500 men -> 3 x 1.3 = 3.9 -> 4; 1500 women -> 2 x 1.3 = 2.6 -> 3', [sfr(sf, 'رجال').wc, sfr(sf, 'نساء').wc], [4, 3]);
sf = sfRun('mosque', {sf_n: 500});
check('a mosque of 500: 3 + 2 = 5 water closets and basins, 10 + 4 = 14 ablution places', [sfr(sf, 'المصلون').wc, sfr(sf, 'المصلون').basin, sfr(sf, 'المصلون').other], [5, 5, '14 مكان وضوء']);
sf = sfRun('commercial', {sf_n: 100, sf_sp: 'full', sf_cust: 400});
check('commercial: 100 workers: men 4 - 1 = 3 water closets, 2 urinals and 2 basins; women 4 and 2; 400 customers = 100 equivalent workers (basins max(ceil(5 / 3), 2) = 2)', [sfr(sf, 'العاملون — رجال').wc, sfr(sf, 'العاملون — رجال').urinal, sfr(sf, 'العاملون — رجال').basin, sfr(sf, 'العاملون — نساء').wc, sfr(sf, 'العاملون — نساء').basin, sf.eqCust, sfr(sf, 'الزبائن — رجال').basin], [3, 2, 2, 4, 2, 100, 2]);
sf = sfRun('school', {sf_n: 800, sf_staff: 'yes'});
check('a boys\' school of 800: 21 water closets, 21 basins, 21 urinals, 11 drinking fountains (1 per 75); the staff add 30 %: 7', [sfr(sf, 'الطلاب').wc, sfr(sf, 'الطلاب').basin, sfr(sf, 'الطلاب').urinal, sfr(sf, 'الطلاب').other, sfr(sf, 'الهيئة').wc], [21, 21, 21, '11 مشرب ماء', 7]);
sf = sfRun('school', {sf_n: 800, sf_sex: 'girls'});
check('a girls\' school of 800: 21 x 1.125 = 23.6 -> 24 water closets and basins, no urinals', [sfr(sf, 'الطالبات').wc, sfr(sf, 'الطالبات').basin, sfr(sf, 'الطالبات').urinal], [24, 24, 0]);
sf = sfRun('industrial', {sf_m: 300, sf_f: 200});
check('a clean industry of 300 men and 200 women: men 10 water closets and 9 urinals, women 11; basins: men max(10, 300 / 25 = 12) = 12, women max(11, 8) = 11', [sfr(sf, 'رجال').wc, sfr(sf, 'رجال').urinal, sfr(sf, 'نساء').wc, sfr(sf, 'رجال').basin, sfr(sf, 'نساء').basin], [10, 9, 11, 12, 11]);
sf = sfRun('industrial', {sf_m: 500, sf_f: 500, sf_ind: 'toxic'});
check('beyond 400 persons: + 1 water closet per 33 more men (13 + 4 = 17), + 1 urinal per 50 (11 + 2 = 13), + 1 per 20 more women (21 + 5 = 26); toxic industries 1 basin per 7 persons: 72', [sfr(sf, 'رجال').wc, sfr(sf, 'رجال').urinal, sfr(sf, 'نساء').wc, sfr(sf, 'رجال').basin], [17, 13, 26, 72]);
sf = sfRun('industrial', {sf_m: 300, sf_f: 300, sf_ind: 'unclean'});
check('unclean industries: a basin per 15 persons (20); high hazard industries: an open shower per 50 persons (6)', [sfr(sf, 'رجال').basin, sfRun('industrial', {sf_m: 300, sf_f: 300, sf_ind: 'hazard'}).rows[0].shower], [20, 6]);
sf = sfRun('hospital', {sf_m: 40, sf_f: 40});
check('a hospital of 40 male and 40 female patients: 5 water closets (1 per 8), 4 basins (1 per 10), 2 showers (1 per 20) for each sex', [sf.rows.map(x => [x.wc, x.basin, x.shower])], [[[5, 4, 2], [5, 4, 2]]]);
sf = sfRun('dorm', {sf_m: 100, sf_f: 42});
check('a hostel: 100 men: 10 water closets and urinals, 9 showers, basins 11 + 10 + 4 = 25 (the first 42 and the next 40 per 4, then per 5); 42 women: 6 water closets (1 per 8), 11 basins, 4 showers', [sfr(sf, 'رجال').wc, sfr(sf, 'رجال').urinal, sfr(sf, 'رجال').shower, sfr(sf, 'رجال').basin, sfr(sf, 'نساء').wc, sfr(sf, 'نساء').basin, sfr(sf, 'نساء').shower], [10, 10, 9, 25, 6, 11, 4]);
sf = sfRun('temp', {sf_n: 50});
check('temporary housing: one of each per 12 persons: 5', [sf.rows[0].wc, sf.rows[0].basin, sf.rows[0].urinal, sf.rows[0].shower], [5, 5, 5, 5]);
check('beyond the last printed row the last value is kept and flagged (1500 seats; 600 women in a shop above 350), but an industry above 400 persons has the code\'s own extension rule and no flag', [sfRun('cinema', {sf_n: 1500}).flags.includes('beyond'), sfRun('cinema', {sf_n: 1200}).flags.includes('beyond'), sfRun('commercial', {sf_n: 900, sf_sp: 'ratio'}).flags.includes('beyond'), sfRun('industrial', {sf_m: 500, sf_f: 500}).flags.includes('beyond')], [true, false, true, false]);
sf = sfRun('office', {sf_n: 90, sf_sp: 'full', sf_area: 12, sf_h: 2.7});
check('sanitary room of 12 m2 x 2.7 m: windows 5 % = 0.6 m2, mechanical 10 changes = 324 m3/h, a vertical duct 0.06 + 0.03 x (9 - 1) = 0.30 m2 for the 9 water closets', [+sf.room.win5.toFixed(2), sf.room.flow, sf.room.wcTotal, +sf.room.ductWC.toFixed(2)], [0.6, 324, 9, 0.30]);
check('the form lists the 13 occupancies, starts with offices and hides the fields of the other types', [doc.getElementById('sf_type').options.length, doc.getElementById('sf_type').value, doc.getElementById('sf_m').closest('.field').style.display, doc.getElementById('sf_n').closest('.field').style.display], [13, 'office', 'none', '']);
setv(w, 'sf_type', 'industrial'); w.sfToggle();
check('choosing an industry shows the men and women fields and hides the head count; choosing a cinema relabels it', [doc.getElementById('sf_m').closest('.field').style.display, doc.getElementById('sf_n').closest('.field').style.display], ['', 'none']);
setv(w, 'sf_type', 'cinema'); w.sfToggle();
check('... a cinema asks for the seats', [doc.getElementById('sf_nlab').textContent, doc.getElementById('sf_n').closest('.field').style.display], ['عدد المقاعد', '']);
setv(w, 'sf_n', 1200); w.calcResult('sanfix');
check('the results show the table, the rules of Table E1 and the sanitary-unit rules (1.5 m, 1.2 m and 1.75 m tiling, 0.82 m taps, 10 air changes)', ['جدول هـ1', 'المجموع', '1.5 m', '1.75 m', '0.82 m', '10 تغييرات'].every(s => doc.getElementById('sf_results').textContent.includes(s)), true);
w = boot('intl'); w.renderCalc('sanfix');
check('the sanitary fixture calculator is available with every code (default: offices of 90 persons)', [!!w.document.getElementById('sf_results'), w.calcSanFix().rows.length], [true, 2]);

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

// ---------- Jordan: natural ventilation code, Table 4 (outdoor air for conditioned spaces) and Table 1 (respiration) ----------
w = boot('jo'); doc = w.document; w.renderCalc('ventilation');
const N4 = w.eval('JSON.parse(JSON.stringify(JO_NV4))'), N1 = w.eval('JSON.parse(JSON.stringify(JO_NV1))');
check('Table 4: 17 rows; factories 8 / 5 and 0.8 per m2; stores 3.0 per m2; hotel bedrooms 12 / 8 and 1.7; luxury homes 18 / 12; restaurant kitchens 20 per m2', [N4.length, N4[0].slice(2, 5), N4[2][4], N4[5].slice(2, 5), N4[11].slice(2, 5), N4[15][4]], [17, [8, 5, 0.8], 3.0, [12, 8, 1.7], [18, 12, null], 20]);
check('Table 4: corridors 1.3, home kitchens 10, toilets 10 per m2 and no per-person values; closed offices 1.7 (the mechanical code prints 1.3) flagged', [N4[13].slice(2, 5), N4[14][4], N4[16][4], N4[7][4], N4[7][5]], [[null, null, 1.3], 10, 10, 1.7, 'm2']);
check('Table 4: the three per-person tiers are 8 / 5, 12 / 8 and 18 / 12 (recommended / minimum)', [...new Set(N4.filter(r => r[2] != null).map(r => r[2] + '/' + r[3]))], ['8/5', '12/8', '18/12']);
const na = (i, p, a) => w.eval('joNvAir(' + i + ',' + p + ',' + a + ')');
let nv = na(0, 100, 2000);
check('Table 4: a factory of 100 persons and 2000 m2: recommended 800, minimum the larger of 500 and 1600 = 1600, design 1600 L/s', [nv.qRec, nv.byP, nv.byA, nv.qMin, nv.design], [800, 500, 1600, 1600, 1600]);
nv = na(3, 100, 500);
check('Table 4: a theatre (no per-m2 value): minimum 500, recommended 800, design 800', [nv.qMin, nv.qRec, nv.design, nv.flag], [500, 800, 800, 'band']);
nv = na(13, 0, 100);
check('Table 4: corridors 100 m2: 130 L/s by area only, no recommended value', [nv.qMin, nv.qRec, nv.design], [130, null, 130]);
nv = na(7, 4, 20);
check('Table 4: a closed office of 4 persons and 20 m2: 12 x 4 = 48 recommended, minimum max(32, 34) = 34', [nv.qRec, nv.qMin, nv.design], [48, 34, 48]);
check('Table 1: five activity levels; light work 160 - 320 W, 0.2 - 0.3 L/s oxygen, 1.3 - 2.6 L/s fresh air; very heavy 650 - 800 W and 5.3 - 6.4', [N1.length, N1[1].slice(1), N1[4].slice(1)], [5, [160, 320, 0.2, 0.3, 1.3, 2.6], [650, 800, 0.7, 0.9, 5.3, 6.4]]);
let rs = w.eval('joNvResp(1, 10, 0)');
check('Table 1: 10 persons at light work: 13 to 26 L/s; women only: 75 % = 9.75 to 19.5; 20 persons sitting, half of them women: 14', [rs.lo, rs.hi, w.eval('joNvResp(1, 10, 100)').lo, w.eval('joNvResp(1, 10, 100)').hi, w.eval('joNvResp(0, 20, 50)').lo].map(x => Math.round(x * 1e6) / 1e6), [13, 26, 9.75, 19.5, 14]);
check('the Jordanian ventilation form has the Table 4 list (17 rows), the activity list (5) and the share of women', [doc.getElementById('vt_nv4').options.length, doc.getElementById('vt_nv1').options.length, !!doc.getElementById('vt_nvw')], [17, 5, true]);
setv(w, 'vt_use', 'office'); setv(w, 'vt_pz', 100); setv(w, 'vt_az', 2000 * 10.764); setv(w, 'vt_nv4', 0); setv(w, 'vt_nv1', 1); setv(w, 'vt_nvw', 0);
w.calcResult('ventilation');
let vtx = doc.getElementById('vt_results').textContent;
check('results: the Jordanian block with the factory figures (800, 1600) and the respiration range (130 - 260), next to the ASHRAE result', ['الجدولان 4 و1', '800.0', '1600.0', '130.0 – 260.0', 'للمقارنة: ASHRAE 62.1'].every(s => vtx.includes(s)), true);
setv(w, 'vt_nv4', 7); w.calcResult('ventilation');
check('closed offices: the note on the 1.7 / 1.3 difference between the two codes', doc.getElementById('vt_results').textContent.includes('1.3؛ أُخذت القيمة الأكبر'), true);
setv(w, 'vt_nv4', 13); w.calcResult('ventilation');
check('corridors: the note that the value is per m2 only', doc.getElementById('vt_results').textContent.includes('فحُسبت بالمساحة وحدها'), true);
w = boot('intl'); doc = w.document; w.renderCalc('ventilation'); w.calcResult('ventilation');
check('other codes: no Jordanian Tables 1 / 4 form and no block', [!!doc.getElementById('vt_nv4'), doc.getElementById('vt_results').textContent.includes('الجدولان 4 و1')], [false, false]);

// ---------- Jordan: natural ventilation code, chapter 3 (equations 1 - 5, Tables 5 - 11) and Appendix D, `natvent` ----------
w = boot('jo'); doc = w.document; w.renderCalc('natvent');
const NVd = w.eval('JSON.parse(JSON.stringify({crack: JO_NV_CRACK, terr: JO_NV_TERRAIN, wind: JO_NV_WIND, cp: JO_NV_CP, months: JO_NV_MONTHS, regions: JO_NV_REGIONS}))');
check('Table 5: three window types, mean k 0.08 / 0.21 / 0.08 L/s per m at 1 Pa, ranges 0.02 - 0.30, 0.06 - 0.80, 0.005 - 0.20', NVd.crack.map(r => r.slice(1)), [[0.08, 0.02, 0.30], [0.21, 0.06, 0.80], [0.08, 0.005, 0.20]]);
check('Table 7: K and a of the four terrains: 0.68 / 0.17, 0.52 / 0.20, 0.35 / 0.25, 0.21 / 0.33; K falls and a rises with the roughness', [NVd.terr.map(r => r.slice(1)), NVd.terr.every((r, i) => i === 0 || (r[1] < NVd.terr[i - 1][1] && r[2] > NVd.terr[i - 1][2]))], [[[0.68, 0.17], [0.52, 0.20], [0.35, 0.25], [0.21, 0.33]], true]);
const avg = a => a.slice(0, 12).reduce((s, x) => s + x, 0) / 12;
check('Table 8: 3 regions x (mean, highest) x (12 months + the annual mean); the printed annual means agree with the monthly values within 0.06 (the one exception, the highest speeds of the eastern highlands, prints 10.3 for 10.46)', [NVd.wind.length, NVd.wind.every(r => r.length === 2 && r.every(a => a.length === 13)), NVd.months.length, NVd.wind.flat().map(a => Math.abs(avg(a) - a[12]) <= 0.06)], [3, true, 13, [true, true, true, false, true, true]]);
check('Table 8 spot values: eastern highlands annual mean 2.8, desert January highest 16.1, valley August highest 6.6', [NVd.wind[1][0][12], NVd.wind[2][1][0], NVd.wind[0][1][7]], [2.8, 16.1, 6.6]);
check('Table 11: six rows x two angles x four walls; the windward wall is +0.7 / +0.8 and every other value is negative; Appendix D row (h/w 0.8, l/w 2.5): 0.7, -0.3, -0.7, -0.7', [NVd.cp.length, NVd.cp.every(r => r.length === 2 && r.every(a => a.length === 4)), NVd.cp.every(r => r[0][0] >= 0.7 && r[1][2] >= 0.7 && [1, 2, 3].every(k => r[0][k] < 0) && [0, 1, 3].every(k => r[1][k] < 0)), NVd.cp[3][0]], [6, true, true, [0.7, -0.3, -0.7, -0.7]]);
const nvcp = (h, ww, l, a, p) => w.eval('joNvCp(' + [h, ww, l, a, JSON.stringify(p || 'AB')].join(',') + ')');
check('Table 11 lookup: 25 x 10 x 8 m, wind at 0 degrees on the long walls: dCp = 0.7 - (-0.3) = 1.0 (Appendix D); parallel wind (90 degrees) gives 0 across the long walls and 0.7 - (-0.1) = 0.8 across the short ones', [nvcp(8, 10, 25, 0).dcp, nvcp(8, 10, 25, 90).dcp, nvcp(8, 10, 25, 90, 'CD').dcp, nvcp(8, 10, 25, 0, 'CD').dcp].map(x => Math.round(x * 1e6) / 1e6), [1.0, 0, 0.8, 0]);
check('Table 11 bands: h/w 0.5 stays in the first band and 1.5 in the second; l/w 1.5 is the square-plan band; the row index = band h x 2 + band l; far outside the table is flagged', [nvcp(5, 10, 10, 0).row, nvcp(15, 10, 15, 0).row, nvcp(16, 10, 15, 0).row, nvcp(8, 10, 16, 0).row, nvcp(70, 10, 10, 0).outside, nvcp(8, 10, 50, 0).outside], [0, 2, 4, 3, true, true]);
check('Table 6 (wind): 0.5 x 1.18 x u2 x Cp = 0.59 (1 m/s, Cp 1), 9.44 (4 m/s, Cp 1), 8.67 (7 m/s, Cp 0.3), 59.0 (10 m/s, Cp 1), 0.06 (1 m/s, Cp 0.1)', [[1, 1], [4, 1], [7, 0.3], [10, 1], [1, 0.1]].map(([u, c]) => Math.round(0.5 * w.eval('JO_NV_RHO') * u * u * c * 100) / 100), [0.59, 9.44, 8.67, 59.0, 0.06]);
let nvr = w.eval('JSON.parse(JSON.stringify(calcNatVent()))');
const nearArr = (g, wnt, tol) => g.length === wnt.length && g.every((x, i) => Math.abs(x - wnt[i]) <= tol);
check('Appendix D (a): Amman, mean wind 2.8 m/s, rural with obstacles (K 0.52, a 0.20), h = 8 m: u_r = 2.8 x 0.52 x 8^0.2 = 2.2 m/s', nearArr([nvr.win.um, nvr.win.K, nvr.win.a, nvr.win.ur], [2.8, 0.52, 0.20, 2.207], 0.001), true);
check('... A_w = 7.5 / sqrt 2 = 5.3 m2 (the code), Q_w = 0.61 x 5.3 x 2.2 x 1.0 = 7.11 m3/s (7.14 unrounded) and 12.8 changes per hour in 2000 m3 (12.9); the wind governs', [nearArr([nvr.dcp, nvr.Aw, nvr.Qw, nvr.ach], [1.0, 5.30, 7.11, 12.8], 0.06), nvr.gov], [true, 'wind']);
check('Appendix D (b): 6 K, openings 2.5 + 2.5 and 5.0 + 5.0 m2, H1 = 6 m: A_b = 4.47 m2, Q_b = 4.18 m3/s (4.2) and 7.6 changes per hour (7.5 unrounded)', nearArr([nvr.Ab, nvr.Qb, 3600 * nvr.Qb / 2000], [4.47, 4.18, 7.6], 0.1), true);
setv(w, 'nv_dm', 'custom'); setv(w, 'nv_dcp', 0); nvr = w.eval('JSON.parse(JSON.stringify(calcNatVent()))');
check('wind neglected (dCp 0): the combined rate is Q_b alone, governed by the temperature difference', [nvr.Qw, nvr.gov, +nvr.Q.toFixed(2)], [0, 'stack', 4.18]);
const qwOf = dm => { setv(w, 'nv_dm', dm); return w.eval('calcNatVent().Qw'); };
const qw1 = qwOf('exposed'), qw02 = qwOf('approx'), qw01 = qwOf('sheltered');
check('dCp options: 1.0 exposed, 0.2 approximate (3/6/3) and 0.1 sheltered (3/5/2) change Q_w with the square root of dCp', nearArr([qw02 / qw1, qw01 / qw1], [Math.sqrt(0.2), Math.sqrt(0.1)], 1e-9), true);
setv(w, 'nv_dm', 'table');
const sgE = (a1, a2) => w.eval('joNvSingle("two", ' + a1 + ', ' + a2 + ', 2, 1, 2, 6, 300).Qstack');
check('Table 10, two openings: equal openings (E = 1) give 0.61 x A x 0.5 x sqrt(dT g H / T), and the formula is symmetric in E (1 : 3 equals 3 : 1)', [nearArr([sgE(2, 2)], [0.61 * 4 * 0.5 * Math.sqrt(6 * 9.8 * 2 / 300)], 1e-9), Math.abs(sgE(1, 3) - sgE(3, 1)) < 1e-12], [true, true]);
const sg = w.eval('joNvSingle("one", 2, 0, 1.5, 1, 2.2, 6, 300)');
check('Table 10: one opening of 2 m2, 1.5 m high, J = 1, 6 K: Q = 0.61 x (2 / 3) x sqrt(6 x 9.8 x 1.5 / 300); the wind term 0.025 x 2 x 2.2 = 0.11; the larger is taken', [+sg.Qstack.toFixed(4), +sg.Qwind.toFixed(3), sg.gov], [+(0.61 * 2 / 3 * Math.sqrt(6 * 9.8 * 1.5 / 300)).toFixed(4), 0.11, 'stack']);
const ck = w.eval('joNvCrack(1, 10, 10)');
check('equation (1): a pivoting window, 10 m of crack at 10 Pa: 0.21 x 10 x 10^0.67 = 9.8 L/s (range 2.8 to 37.4)', [+ck.mean.toFixed(2), +ck.lo.toFixed(2), +ck.hi.toFixed(2)], [9.82, 2.81, 37.42]);
check('the form: regions 3, months 13, terrains 4, crack types 3, default case two openings with the Appendix D values', [doc.getElementById('nv_reg').options.length, doc.getElementById('nv_mon').options.length, doc.getElementById('nv_terr').options.length, doc.getElementById('nv_ck').options.length, doc.getElementById('nv_case').value, +doc.getElementById('nv_A1').value, +doc.getElementById('nv_H1').value], [3, 13, 4, 3, 'two', 5, 6]);
const vis = id => doc.getElementById(id).closest('.form-section') && doc.getElementById(id).closest('.form-section').style.display !== 'none' && doc.getElementById(id).closest('.field').style.display !== 'none';
setv(w, 'nv_case', 'single'); w.nvToggle();
check('single-wall case: the Table 9 openings are hidden, the Table 10 ones shown (two openings first); the crack fields hidden', [vis('nv_A1'), vis('nv_sA1'), vis('nv_sA'), vis('nv_cL')], [false, true, false, false]);
setv(w, 'nv_sw', 'one'); w.nvToggle();
check('... one opening: the area, the height and J(Phi) appear instead', [vis('nv_sA1'), vis('nv_sA'), vis('nv_sJ')], [false, true, true]);
setv(w, 'nv_case', 'crack'); w.nvToggle();
check('crack case: only the crack fields', [vis('nv_cL'), vis('nv_A1'), vis('nv_sA'), vis('nv_vol')], [true, false, false, false]);
w.calcResult('natvent');
check('crack results: the three leakage rates and the Table 5 reference', ['9.82', '2.81', '37.42', 'المعادلة 1'].every(s => doc.getElementById('nv_results').textContent.includes(s)), true);
w.renderCalc('natvent'); w.calcResult('natvent');
check('two-openings results: the wind and temperature flows, the governing effect, the air changes and the Table 11 note', ['7.14', '4.18', 'الحاكم: الريح', '12.9', 'الجدول 11 صورة نقطية'].every(s => doc.getElementById('nv_results').textContent.includes(s)), true);
check('HVAC category: 18 calculators and the natural ventilation card', [doc.getElementById('main-categories-grid').textContent.includes('18 حاسبة متاحة'), doc.getElementById('hvac-category').innerHTML.includes("showCalc('natvent')")], [true, true]);

// ---------- Jordan: mechanical ventilation and air conditioning code, Tables 23 (persons), 12 (duct velocities) and 16 (outlet velocities) ----------
w = boot('jo'); doc = w.document;
const PPL = w.eval('JSON.parse(JSON.stringify({t: JO_PPL_T, r: JO_PPL}))');
check('Table 23: six activities at the room temperatures 28, 26, 24 and 21 C; the total (sensible + latent) is constant along a row within 3 W, the sensible part rises and the latent part falls as the room gets cooler', [PPL.t, PPL.r.length, PPL.r.every(r => { const tot = r[1].map(x => x[0] + x[1]); return Math.max(...tot) - Math.min(...tot) <= 3 && r[1].every((x, i) => i === 0 || (x[0] > r[1][i - 1][0] && x[1] < r[1][i - 1][1])); })], [[28, 26, 24, 21], 6, true]);
check('Table 23 spot values: office staff and hotels at 24 C: 74 sensible + 62 latent = 136 W; walking at 5 km/h at 21 C: 138 + 162 = 300 W; primary school at 28 C: 52 + 52; a temperature outside the four columns gives nothing', [w.eval('joPeople(2, 24)'), w.eval('joPeople(5, 21)'), w.eval('joPeople(0, 28)'), w.eval('joPeople(0, 25)')], [{s: 74, l: 62, t: 136}, {s: 138, l: 162, t: 300}, {s: 52, l: 52, t: 104}, null]);
w.renderCalc('coolingload'); setv(w, 'cl_mode', 'detailed'); setv(w, 'cl_ppl', 10); setv(w, 'cl_pact', 2); setv(w, 'cl_pt', 24);
let clr = w.eval('calcCoolingLoad()');
check('cooling load under the Jordanian code: 10 persons, office staff, 24 C: 10 x 136 W x 3.412 = 4640 BTU/hr instead of 10 x 450', [Math.round(clr.Q_people), clr.joP.t], [4640, 136]);
setv(w, 'cl_pact', 5); setv(w, 'cl_pt', 21); clr = w.eval('calcCoolingLoad()');
check('... walking at 5 km/h at 21 C: 10 x 300 W x 3.412 = 10236 BTU/hr; the results line quotes the sensible and latent watts', [Math.round(clr.Q_people), (w.calcResult('coolingload'), doc.getElementById('cl_results').textContent.includes('138 W') && doc.getElementById('cl_results').textContent.includes('162 W'))], [10236, true]);
w = boot('intl'); w.renderCalc('coolingload'); setv(w, 'cl_mode', 'detailed'); setv(w, 'cl_ppl', 10); clr = w.eval('calcCoolingLoad()');
check('other codes: 450 BTU/hr per person and no Table 23 fields', [clr.Q_people, clr.joP, !!w.document.getElementById('cl_pact')], [4500, null, false]);
const DV = w.eval('JSON.parse(JSON.stringify(JO_DUCTV))');
check('Table 12: eight applications; main ducts 5 - 8 m/s (public) and 6 - 12 (industrial); branches 2.5 - 3 and 4.5 - 9; outdoor air intakes 2.5 - 4.5 and 5 - 6; supply grilles 1.2 - 2.3 (public only); supply openings 1.5 - 2.5 (industrial only)', [DV.length, DV[3].slice(1), DV[4].slice(1), DV[0].slice(1), DV[5].slice(1), DV[6].slice(1)], [8, [5, 8, 6, 12], [2.5, 3, 4.5, 9], [2.5, 4.5, 5, 6], [1.2, 2.3, null, null], [null, null, 1.5, 2.5]]);
const jdv = (t, u) => w.eval('joDuctVel("' + t + '", "' + u + '")');
check('Table 12 in fpm: public main 984 - 1575, industrial branch 886 - 1772, outdoor air 492 - 886; the table has no row for exhaust ducts', [jdv('supply_main', 'pub'), jdv('return_branch', 'ind'), jdv('outdoor', 'pub'), jdv('exhaust', 'pub')].map(x => x && [x.minFpm, x.maxFpm]), [[984, 1575], [886, 1772], [492, 886], null]);
w = boot('jo'); doc = w.document; w.renderCalc('ductsizing'); setv(w, 'dt_type', 'supply_main'); let dsz = w.eval('calcDuctSizing()');
check('ductsizing under the Jordanian code: the speed limits of a supply main come from Table 12 (984 - 1575 fpm) instead of 800 - 1500', [dsz.vl.min, dsz.vl.max, dsz.joV.from, dsz.joV.to], [984, 1575, 5, 8]);
setv(w, 'dt_jo_use', 'ind'); setv(w, 'dt_type', 'supply_branch'); dsz = w.eval('calcDuctSizing()');
check('... industrial branch: 886 - 1772 fpm; an exhaust duct keeps the practice limit (400 - 700 fpm) with no Table 12 reference', [dsz.vl.min, dsz.vl.max, (setv(w, 'dt_type', 'exhaust'), w.eval('calcDuctSizing().joV')), w.eval('calcDuctSizing().vl.max')], [886, 1772, null, 700]);
setv(w, 'dt_type', 'supply_main'); setv(w, 'dt_jo_use', 'pub'); w.calcResult('ductsizing');
check('the results quote the table: "Table 12: 5 - 8 m/s"', doc.getElementById('dt_results').textContent.includes('جدول 12: 5–8 m/s'), true);
w = boot('intl'); w.renderCalc('ductsizing'); setv(w, 'dt_type', 'supply_main'); dsz = w.eval('calcDuctSizing()');
check('other codes: the practice limits 800 - 1500 fpm and no Jordanian field', [dsz.vl.min, dsz.vl.max, dsz.joV, !!w.document.getElementById('dt_jo_use')], [800, 1500, null, false]);
w = boot('jo'); doc = w.document; w.renderCalc('diffuserselection');
const OV = w.eval('JSON.parse(JSON.stringify(JO_OUTV))');
check('Table 16: four groups of spaces with 1.75 - 2.5, 2.5 - 4.5, 4.0 - 5.0 and 5.0 - 7.5 m/s', [OV.length, OV.map(r => r.slice(1))], [4, [[1.75, 2.5], [2.5, 4.5], [4.0, 5.0], [5.0, 7.5]]]);
setv(w, 'df_jo', 1); w.dfJoPick();
check('diffuser selection: choosing hotel bedrooms / private offices sets the neck-velocity limit to 4.5 m/s', +doc.getElementById('df_maxvel').value, 4.5);
w = boot('intl'); w.renderCalc('diffuserselection');
check('other codes: no Table 16 list', !!w.document.getElementById('df_jo'), false);

// ---------- Jordan: mechanical ventilation code, Tables 4, 5, 6, 8 and 9 (duct sheet thickness) in the duct takeoff ----------
w = boot('jo'); doc = w.document;
const sh = (shape, dim, mat, cls, gal) => w.eval('joSheet(' + [JSON.stringify(shape), dim, JSON.stringify(mat), JSON.stringify(cls), !!gal].join(',') + ')');
check('Table 4 (rectangular steel, low velocity): by the longest side 400 / 600 -> 0.6, 800 / 1000 -> 0.8, 1500 / 2250 -> 1.0, 3000 -> 1.2; beyond 3000 the last row is kept and flagged', [350, 600, 601, 1000, 1200, 2250, 3000, 3200].map(d => sh('RECTANGLE', d, 'galv', 'low').mm).concat([sh('RECTANGLE', 3200, 'galv', 'low').beyond, sh('RECTANGLE', 3000, 'galv', 'low').beyond]), [0.6, 0.6, 0.8, 0.8, 1.0, 1.0, 1.2, 1.2, true, false]);
check('Table 6 (rectangular steel, 10 - 40 m/s): up to 1000 -> 0.8, 1500 -> 1.0, above 1500 -> 1.2 (no upper limit); the table number is 6', [300, 1000, 1200, 1500, 2000, 3500].map(d => sh('RECTANGLE', d, 'galv', 'high').mm).concat(sh('RECTANGLE', 1200, 'galv', 'high').tab), [0.8, 0.8, 1.0, 1.0, 1.2, 1.2, '6']);
check('Table 5 (round steel): 500 -> 0.6, 750 -> 0.8, 1250 -> 1.0, 1750 and 2500 -> 1.2; the same table for the high-velocity class (the code has no round table for it)', [400, 600, 1000, 1500, 2500].map(d => sh('ROUND', d, 'galv', 'low').mm).concat([sh('ROUND', 600, 'galv', 'high').mm, sh('ROUND', 600, 'galv', 'high').tab]), [0.6, 0.8, 1.0, 1.2, 1.2, 0.8, '5']);
check('Tables 8 and 9 (aluminium): rectangular 400 / 600 -> 0.8, 800 / 1000 -> 1.0, 1500 / 2250 -> 1.2, 3000 -> 1.6; round 500 -> 0.8, 750 -> 1.0, 1250 -> 1.2, 1750 / 2500 -> 1.6', [[400, 600, 800, 1000, 1500, 2250, 3000].map(d => sh('RECTANGLE', d, 'aluminium', 'low').mm), [500, 750, 1250, 1750, 2500].map(d => sh('ROUND', d, 'aluminium', 'low').mm), sh('RECTANGLE', 700, 'aluminium', 'low').tab, sh('ROUND', 700, 'aluminium', 'low').tab], [[0.8, 0.8, 1.0, 1.0, 1.2, 1.2, 1.6], [0.8, 1.0, 1.2, 1.6, 1.6], '8', '9']);
check('ducts galvanized after fabrication: rectangular 300 -> 1.2, above -> 1.6; round 300 -> 1.0, 450 -> 1.2, above -> 1.6', [sh('RECTANGLE', 250, 'galv', 'low', true).mm, sh('RECTANGLE', 400, 'galv', 'low', true).mm, sh('ROUND', 300, 'galv', 'low', true).mm, sh('ROUND', 450, 'galv', 'low', true).mm, sh('ROUND', 800, 'galv', 'low', true).mm], [1.2, 1.6, 1.0, 1.2, 1.6]);
const JS = w.eval('JSON.parse(JSON.stringify(JO_SHEET))');
check('the thickness never falls as the duct grows (every table) and the aluminium tables are never thinner than the steel ones', [Object.values(JS).every(t => t.every((r, i) => i === 0 || r[1] >= t[i - 1][1])), JS.alRect.every((r, i) => r[1] >= JS.rectLow[i][1]), JS.alRound.every((r, i) => r[1] >= JS.round[i][1])], [true, true, true]);
w.renderCalc('ductweight'); w.calcResult('ductweight');
let dwr = w.eval('calcDuctWeight()');
check('the takeoff under the Jordanian code: the default rows (600 x 400 rectangular, 600 round) use Table 4 (0.6 mm) and Table 5 (0.8 mm) and the weight breaks down by thickness', [dwr.jo, Object.keys(dwr.gaugeBreak).sort(), dwr.joTables.sort()], [true, ['0.6 mm — جدول 4', '0.8 mm — جدول 5'], ['4', '5']]);
const dwAll = w.eval('calcDuctWeight().totalWeight'), dwArea = w.eval('calcDuctWeight().totalArea');
setv(w, 'dw_material', 'aluminium'); dwr = w.eval('calcDuctWeight()');
check('aluminium (density 2.70): rectangular 600 -> 0.8 mm (Table 8) and round 600 -> 1.0 mm (Table 9)', [dwr.density, dwr.joTables.sort(), Object.keys(dwr.gaugeBreak)], [2.70, ['8', '9'], ['0.8 mm — جدول 8', '1.0 mm — جدول 9']]);
setv(w, 'dw_material', 'galv'); setv(w, 'dw_jo_cls', 'high'); dwr = w.eval('calcDuctWeight()');
check('high-velocity class: the rectangular rows move to Table 6 (0.8 mm for 600) and the round row stays on Table 5', dwr.joTables.sort(), ['5', '6']);
setv(w, 'dw_jo_cls', 'low'); w.calcResult('ductweight');
check('the results quote the Jordanian code and not the SMACNA gauge sentence', [doc.getElementById('dw_results').textContent.includes('5/2'), doc.getElementById('dw_results').textContent.includes('26G')], [true, false]);
w = boot('intl'); w.renderCalc('ductweight'); w.calcResult('ductweight'); dwr = w.eval('calcDuctWeight()');
check('other codes: the SMACNA gauges (24G for 600 and 26G ...) and no Jordanian fields or aluminium option', [dwr.jo, Object.keys(dwr.gaugeBreak).sort(), !!w.document.getElementById('dw_jo_cls'), [...w.document.getElementById('dw_material').options].some(o => o.value === 'aluminium')], [false, ['24G'], false, false]);

// ---------- Jordan: mechanical ventilation code 7/3/1 and Table 18 (duct insulation thickness) ----------
w = boot('jo'); doc = w.document;
const DI = w.eval('JSON.parse(JSON.stringify(JO_DINS))');
check('Table 18: nine insulating materials; cork board 0.040 - 0.043, kapok 0.030 - 0.034, glass wool 0.036, rock wool 0.036 - 0.040, fibreboard 0.050 - 0.064 W/m.K', [DI.length, DI[0].slice(1), DI[2].slice(1), DI[5].slice(1), DI[6].slice(1), DI[7].slice(1)], [9, [0.040, 0.043], [0.030, 0.034], [0.036, 0.036], [0.036, 0.040], [0.050, 0.064]]);
const di = (i, t) => w.eval('joDuctIns(' + i + ', ' + JSON.stringify(t) + ')');
check('7/3/1: cork board 25 mm above 7 K and 50 mm above 10 K; kapok above 10 K: 50 x 0.034 / 0.043 = 39.5 -> 40 mm; glass wool above 7 K: 20.9 -> 25 mm; fibreboard above 10 K: 74.4 -> 75 mm; no class: nothing', [di(0, '7').mm, di(0, '10').mm, di(2, '10').mm, di(5, '7').mm, di(7, '10').mm, di(0, '')], [25, 50, 40, 25, 75, null]);
w.renderCalc('ductweight'); setv(w, 'dw_jo_ins', 2); setv(w, 'dw_jo_dt', '10'); w.dwJoInsPick();
check('the duct takeoff fills the insulation thickness (40 mm) and shows the working', [+doc.getElementById('dw_ins_thk').value, doc.getElementById('dw_jo_ins_note').textContent.includes('39.5') && doc.getElementById('dw_jo_ins_note').textContent.includes('40 mm')], [40, true]);
w = boot('intl'); w.renderCalc('ductweight');
check('other codes: no Jordanian insulation fields', [!!w.document.getElementById('dw_jo_ins'), +w.document.getElementById('dw_ins_thk').value], [false, 25]);

// ---------- Jordan: thermal insulation code chapters 5 and 6 (Tables 17, 18, 21, 22, formula 5/5), `condensation` ----------
w = boot('jo'); doc = w.document; w.renderCalc('condensation');
const PS = w.eval('JSON.parse(JSON.stringify(JO_PSAT))');
const magnus = t => 611.2 * Math.exp(17.62 * t / (243.12 + t));
check('Table 17: 31 whole degrees x 10 tenths, rising along every row and down the table; spot values 0 C 611, 5 C 872, 20 C 2340, 30.9 C 4469; the printed 27.8 C (3793) was corrected to 3738', [PS.length, PS.every(r => r.length === 10), PS.flat().every((x, i, a) => i === 0 || x > a[i - 1]), PS[0][0], PS[5][0], PS[20][0], PS[30][9], PS[27][8]], [31, true, true, 611, 872, 2340, 4469, 3738]);
check('Table 17 agrees with the Magnus formula within 0.6 % over the whole table', PS.flat().every((x, i) => Math.abs(x / magnus(i / 10) - 1) < 0.006), true);
check('saturation pressure: interpolation between the printed tenths (20.25 C -> 2376.5), the printed values at whole degrees, Magnus outside the table (-5 C about 402, 35 C about 5613)', [w.eval('joPsat(20.25)'), w.eval('joPsat(5)'), Math.round(w.eval('joPsat(-5)')), Math.round(w.eval('joPsat(35)'))], [2376.5, 872, 402, 5613]);
const VP = w.eval('JSON.parse(JSON.stringify(JO_VAPOUR))');
check('Tables 18 and 22: 34 materials; stones 80 - 135, hollow concrete bricks 27 - 54, polystyrene 25 kg/m3 160 - 380, mineral and vegetable fibres 5.4, glass brick 800, PE film 0.10 mm 350000, cold bituminous paint 3240', [VP.length, VP[0].slice(1), VP[2].slice(1), VP[21].slice(1), VP[24].slice(1), VP[5].slice(1), VP[31].slice(1), VP[33].slice(1)], [34, [80, 135], [27, 54], [160, 380], [5.4, 5.4], [800, 800], [350000, 350000], [3240, 3240]]);
check('the lower value is taken by default (5/4): polystyrene 25 kg/m3 -> 160, cement plaster -> 80; the higher value on request', [w.eval('joVres(21, "lo")'), w.eval('joVres(11, "lo")'), w.eval('joVres(21, "hi")')], [160, 80, 380]);
check('the Table 15 material -> Table 18 row suggestion: gypsum plaster -> 12, hollow concrete block -> 2, polystyrene 25 -> 21, cement plaster -> 11, loose perlite -> none', [49, 10, 76, 47, 99].map(i => w.eval('joVapourGuess(' + i + ')')), [12, 2, 21, 11, null]);
let cn = w.eval('JSON.parse(JSON.stringify(calcCondensation()))');
check('default wall (gypsum plaster 15, hollow block 200, polystyrene 50, cement plaster 20 mm) at 5 C and 70 %: R = 1.911, U = 0.523, vapour pressure 1150 / 610 N/m2, total vapour resistance 15.81, no condensation', [+cn.Rt.toFixed(3), +cn.U.toFixed(3), +cn.pi.toFixed(1), +cn.po.toFixed(1), +cn.RvT.toFixed(2), cn.c, cn.surface], [1.911, 0.523, 1150.4, 610.4, 15.81, -1, false]);
check('... the temperatures of the planes 19.06, 18.89, 17.15, 5.60, 5.47 and the vapour pressures 1150, 1123, 938, 665, 610', [cn.planes.map(p => +p.th.toFixed(2)), cn.planes.map(p => Math.round(p.pv))], [[19.06, 18.89, 17.15, 5.60, 5.47], [1150, 1123, 938, 665, 610]]);
check('... the insulation (polystyrene, vapour resistivity 160) is in group 2 and a barrier of at most 0.06 g/(MN s) (resistance of at least 16.7) is advised for a wall', [cn.grp, cn.perm], [2, 0.06]);
doc.getElementById('nc-tbody').innerHTML = w.eval('ncRowHTML(76, 50, 21) + ncRowHTML(10, 200, 2) + ncRowHTML(47, 20, 11)');
setv(w, 'nc_to', 0); setv(w, 'nc_rho', 90); cn = w.eval('JSON.parse(JSON.stringify(calcCondensation()))');
check('insulation on the inside at 0 C and 90 %: condensation at the plane between the insulation and the block (Pv 802 > Ps 768 N/m2), Rvi 8 and Rvo 7', [cn.c, Math.round(cn.planes[1].pv), Math.round(cn.planes[1].ps), cn.Rvi, cn.Rvo], [1, 802, 768, 8, 7]);
check('... the remaining condensate by 5/5: W = 0.005 x [(Pi - Ps) / 8 - (Ps - Po) / 7] about 0.045 kg/m2, within the limit of 1.0 (ok), and the table marks the plane', [+cn.W.toFixed(3), +(0.005 * ((cn.pi - cn.planes[1].ps) / 8 - (cn.planes[1].ps - cn.po) / 7)).toFixed(3), cn.ok, (w.calcResult('condensation'), doc.getElementById('nc_results').textContent.includes('⚠ تكاثف'))], [0.045, 0.045, true, true]);
setv(w, 'nc_pm', 'special'); cn = w.eval('calcCondensation()');
check('large kitchens (5/2/3): the indoor vapour pressure is the outdoor one + 1080 N/m2; with an entered indoor humidity of 50 % at 20 C it is 1170', [Math.round(cn.pi - cn.po), (setv(w, 'nc_pm', 'rh'), Math.round(w.eval('calcCondensation().pi')))], [1080, 1170]);
setv(w, 'nc_zone', 0); w.ncZoneChange();
check('choosing zone 1 (Table A) fills the winter design temperature 6 C and the winter relative humidity 73 % (Table A6)', [+doc.getElementById('nc_to').value, +doc.getElementById('nc_rho').value], [6, 73]);
check('Table 21: group 2 needs 0.06 g/(MN s) for every element; group 3: walls 0.06, ceiling underside 0.02, roof back 0.02, metal construction 0.002; group 1 needs none', [w.eval('JO_BARRIER[2]'), w.eval('JO_BARRIER[3]'), w.eval('JO_BARRIER[1]') === undefined], [[0.06, 0.06, 0.06, 0.06], [0.06, 0.02, 0.02, 0.002], true]);
w.renderCalc('condensation'); w.addNcLayer();
check('the form: four default layers and the add button gives a fifth; the zone list has four zones', [doc.querySelectorAll('#nc-tbody tr').length, doc.getElementById('nc_zone').options.length], [5, 5]);
check('HVAC category: 18 calculators and the condensation card', [doc.getElementById('main-categories-grid').textContent.includes('18 حاسبة متاحة'), doc.getElementById('hvac-category').innerHTML.includes("showCalc('condensation')")], [true, true]);

// ---------- Jordan: shelters code (Table 6, 3/2/2, chapter 5, 6/3/4, 6/4), `shelter` ----------
w = boot('jo'); doc = w.document; w.renderCalc('shelter');
const shl = (o, q, q2, rooms, h, cl, fam) => w.eval('joShelter(' + [o, q, q2 || 0, rooms || 1, h || 2.5, JSON.stringify(cl || 'normal'), !!fam].join(',') + ')');
check('Table 6: residential 1500 m2 -> 100 units, hospital 40 beds -> 40, hotel 60 beds -> 30, restaurant 100 seats -> 50, worship 200 m2 -> 50, school 300 seats -> 201, industrial 1000 m2 -> 40, shops 12 on 400 m2 -> 20 (not below 1 per 20 m2)', [shl(0, 1500).N, shl(1, 40).N, shl(2, 60).N, shl(3, 100).N, shl(4, 200).N, shl(6, 300).N, shl(7, 1000).N, shl(5, 12, 400).N], [100, 40, 30, 50, 50, 201, 40, 20]);
check('... shops: more shops than the area rule gives (30 shops on 400 m2 -> 30)', shl(5, 30, 400).N, 30);
let sr = shl(0, 1500);
check('100 units: at least 1.0 m2 and 2.5 m3 each (100 m2 at 2.5 m high), air lock 5, decontamination 7, storage 2, toilets 4 m2: built space 118 m2', [sr.area, sr.vol, sr.areaNeed, sr.extra.lock, +sr.extra.decon.toFixed(6), sr.extra.store, sr.extra.wc, +sr.total.toFixed(6)], [100, 250, 100, 5, 7, 2, 4, 118]);
check('a ceiling of 2.0 m raises the occupied area to 250 / 2.0 = 125 m2', shl(0, 1500, 0, 1, 2.0).areaNeed, 125);
check('ventilation: 6.0 m3/h per unit without filters (600), 3.0 with filters (300), 15 in a hot humid area without cooling (1500)', [sr.qUnf, sr.qFil, shl(0, 1500, 0, 1, 2.5, 'hot').qMain, sr.qMain], [600, 300, 1500, 600]);
check('sanitary units: up to 25 units one portable unit; 30 units 2 permanent; 60 units 3; 100 units 4; above 100 (101) 5 permanent and separated; two families or a public shelter: at least 2', [shl(0, 300).wcUnits, shl(0, 450).permanent, shl(0, 900).permanent, sr.permanent, shl(0, 1515).permanent, shl(0, 1515).separate, sr.separate, shl(0, 300, 0, 1, 2.5, 'normal', true).wcUnits, shl(0, 300).portableOk], [1, 2, 3, 4, 5, true, false, 2, true]);
check('water: 50 L per unit for two weeks (5000 L = 100 containers of 50 L); lighting power 5 - 15 W/m2 of the occupied area (500 - 1500 W)', [sr.water, sr.containers, sr.lightMin, sr.lightMax], [5000, 100, 500, 1500]);
check('no units: nothing to provide', [shl(0, 0).N, shl(0, 0).wcUnits, shl(0, 0).water], [0, 0, 0]);
w.calcResult('shelter');
check('the results show the units, the ventilation flows and the notes (the 300 m2 fan area is flagged as unusable)', ['100', '600', '300', '118.0', '5000', 'غير معقول'].every(t => doc.getElementById('sh_results').textContent.includes(t)), true);
setv(w, 'sh_occ', 5); w.shToggle();
check('the office / shop occupancy shows the second quantity (area); the others hide it', [doc.getElementById('sh_q2').closest('.field').style.display, (setv(w, 'sh_occ', 1), w.shToggle(), doc.getElementById('sh_q2').closest('.field').style.display)], ['', 'none']);
check('HVAC category: 18 calculators and the shelter card', [doc.getElementById('main-categories-grid').textContent.includes('18 حاسبة متاحة'), doc.getElementById('hvac-category').innerHTML.includes("showCalc('shelter')")], [true, true]);

// ---------- Jordan: acoustics code, Table 20 (recommended noise criteria of the spaces) in the duct sizing sound check ----------
w = boot('jo'); doc = w.document;
const JN = w.eval('JSON.parse(JSON.stringify(JO_NOISE))');
check('Table 20: twelve kinds of space; concert halls NC 10 - 20 and 20 - 30 dB(A); sleeping rooms and hotels PNC 25 - 40, NC 25 - 35, 35 - 45 dB(A); private offices NC 30 - 35; large offices and restaurants NC 35 - 50; rooms of office equipment and kitchens NC 45 - 60 and 55 - 70 dB(A); garages PNC 50 - 60 with no NC curve', [JN.length, JN[0].slice(1), JN[5].slice(1), JN[6][2], JN[8][2], JN[10].slice(2), JN[11].slice(1)], [12, [[10, 20], [10, 20], [20, 30]], [[25, 40], [25, 35], [35, 45]], [30, 35], [35, 50], [[45, 60], [55, 70]], [[50, 60], null, null]]);
check('the NC class of the sound check chosen from the table: the three quietest groups and the music rooms -> 25, the next three -> 35, the living rooms, large offices, waiting halls and equipment rooms -> 45, garages (no NC curve) -> none', [...Array(12).keys()].map(i => w.eval('joNoiseNC(' + i + ')')), ['25', '25', '25', '25', '35', '35', '35', '45', '45', '45', '45', null]);
w.renderCalc('ductsizing'); setv(w, 'dt_jo_sp', 6); w.dtJoNoisePick();
check('duct sizing: choosing private offices sets NC/RC 35; concert halls NC 25; equipment rooms 45', [doc.getElementById('dt_nc').value, (setv(w, 'dt_jo_sp', 0), w.dtJoNoisePick(), doc.getElementById('dt_nc').value), (setv(w, 'dt_jo_sp', 10), w.dtJoNoisePick(), doc.getElementById('dt_nc').value)], ['35', '25', '45']);
check('the results quote Table 20 with the NC, PNC and dB(A) bands; equipment rooms (NC up to 60) flag that the tool checks the highest class (45); garages say there is no NC curve and keep the class', [doc.getElementById('dt_results').textContent.includes('جدول 20') && doc.getElementById('dt_results').textContent.includes('55 إلى 70 dB(A)') && doc.getElementById('dt_results').textContent.includes('يتجاوز المدى 45'), (setv(w, 'dt_jo_sp', 11), w.dtJoNoisePick(), doc.getElementById('dt_nc').value, doc.getElementById('dt_results').textContent.includes('لا يطبع الجدول منحنى NC'))], [true, true]);
w = boot('intl'); w.renderCalc('ductsizing');
check('other codes: no Table 20 list', !!w.document.getElementById('dt_jo_sp'), false);

// ---------- Jordan: requirements of building for the disabled, 6/7/2 (lifts) in the lift planning ----------
w = boot('jo'); doc = w.document;
const la = (cw, cd, ew) => w.eval('joLiftAccess({Cw:' + cw + ',Cd:' + cd + ',Ew:' + ew + '})');
check('6/7/2: a car of at least 1100 x 1400 mm and a door of at least 800 mm pass; 1000 wide, 1300 deep and 700 doors fail; 1800 x 1800 serves the very large wheelchairs', [[1100, 1400, 800], [1000, 1300, 700], [1100, 1300, 800], [1800, 1800, 1000]].map(x => { const r = la(...x); return [r.cwOk, r.cdOk, r.ewOk, r.big]; }), [[true, true, true, false], [false, false, false, false], [true, false, true, false], [true, true, true, true]]);
w.renderCalc('liftplan'); w.calcResult('liftplan');
const lpd = w.eval('calcLiftPlan().dims.row');
check('the lift planning of a Jordan project shows the disabled-access block for the chosen car (1600 x 1400 mm, door 1100 mm: all three pass)', [doc.getElementById('lp_results').textContent.includes('الوصول للمعوقين'), lpd.Cw >= 1100 && lpd.Cd >= 1400 && lpd.Ew >= 800], [true, true]);
setv(w, 'lp_dt', 't14'); w.lpDimFill('type'); w.calcResult('liftplan');
check('goods lifts (Tables 14 and 15) do not get the passenger accessibility block', doc.getElementById('lp_results').textContent.includes('الوصول للمعوقين'), false);
w = boot('intl'); w.renderCalc('liftplan'); w.calcResult('liftplan');
check('other codes: no accessibility block', (w.document.getElementById('lp_results') ? w.document.getElementById('lp_results').textContent : '').includes('الوصول للمعوقين'), false);

// ---------- Jordan: mechanical ventilation code Table 13 (loss coefficients F of the duct fittings) in the duct sizing ----------
w = boot('jo'); doc = w.document;
const FT = w.eval('JSON.parse(JSON.stringify(JO_FIT))');
const fF = (i, ar) => w.eval('joFitF(' + i + ', ' + (ar == null ? 0.5 : ar) + ')');
check('Table 13: 13 fittings; 90-degree sharp elbow 1.5, rounded 0.5, wide bend (R = 2D) 0.1; 45-degree 0.5, 0.2, 0.05; flow from a duct into a room 1.0; gradual contraction 0', [FT.length, [0, 1, 2, 3, 4, 5].map(i => fF(i)), fF(9), fF(10)], [13, [1.5, 0.5, 0.1, 0.5, 0.2, 0.05], 1.0, 0]);
check('expansions by the area ratio A1/A2: gradual up to 8 degrees 0.15 [1 - A1/A2]^2 (0.0375 at 0.5), gradual above 8 degrees and sudden [1 - A1/A2]^2 (0.25 at 0.5; 0.81 at 0.1; 0 at 1); the ranges 0 - 0.35 take the upper value', [fF(6), fF(7), fF(8), fF(8, 0.1), fF(8, 1), fF(11), fF(12)].map(x => Math.round(x * 1e6) / 1e6), [0.0375, 0.25, 0.25, 0.81, 0, 0.35, 0.35]);
const fl = w.eval('joFitLoss(0, 0.5, 5, 3)');
check('loss = F x 0.5 x 1.2 x v^2: a sharp 90-degree elbow at 5 m/s 22.5 Pa, three of them 67.5 Pa; the ranges are flagged', [fl.dp, fl.total, fl.range, w.eval('joFitLoss(11, 0.5, 5, 1).range')], [22.5, 67.5, false, true]);
w.renderCalc('ductsizing'); setv(w, 'dt_jo_fit', 0); setv(w, 'dt_jo_fn', 2); w.calcResult('ductsizing');
const vf = w.eval('calcDuctSizing().vFit');
check('duct sizing: choosing a fitting shows its loss at the calculated velocity (F 1.5 x 0.6 x v2 per fitting) and the rules of 5/3/5 - 5/3/7', [doc.getElementById('dt_results').textContent.includes('جدول 13'), doc.getElementById('dt_results').textContent.includes((1.5 * 0.6 * vf * vf).toFixed(1)), doc.getElementById('dt_results').textContent.includes('5/3/7')], [true, true, true]);
setv(w, 'dt_jo_fit', ''); w.calcResult('ductsizing');
check('no fitting chosen: no Table 13 block', doc.getElementById('dt_results').textContent.includes('جدول 13'), false);
w = boot('intl'); w.renderCalc('ductsizing');
check('other codes: no fitting fields', !!w.document.getElementById('dt_jo_fit'), false);

// ---------- Jordan: central heating code 2/8/1 and fire protection code 7/4/7 (fuel tanks and the fuel room) in the fuel tank calculator ----------
w = boot('jo'); doc = w.document;
check('constants: 21 days, 24 hours, 0.9 m3, bund 10 %, room + 10 %, vent 32 mm, bituminous coat 3 mm', w.eval('JO_FUEL'), {days: 21, dayH: 24, dayMaxL: 900, bundPct: 10, roomPct: 10, ventMm: 32, coatMm: 3});
w.renderCalc('fueltank'); w.calcResult('fueltank');
const fu1 = w.eval('calcFuelTank()').jo;
check('default boiler (130 kW, 11.6 kWh/kg, 0.85, 0.85 kg/L): 15.51 L/h, daily tank 372.3 L (24 h), main tank 7818 L (21 days), one daily tank', [fu1.lph, fu1.dayL, fu1.mainMin, fu1.nDaily].map(x => Math.round(x * 10) / 10), [15.5, 372.3, 7817.7, 1]);
check('bund 10 % of the main tank 781.8 L; room volume below the threshold (1 + 10 %) x 7817.7 = 8599.5 L', [fu1.bund, fu1.roomVol].map(x => Math.round(x * 10) / 10), [781.8, 8599.5]);
const ftx1 = doc.getElementById('ft_results').textContent;
check('results quote 2/8/1, 7/4/7, the 0.9 m3 limit, the 32 mm vent pipe and carry no Syrian clause numbers', [ftx1.includes('2/8/1'), ftx1.includes('7/4/7'), ftx1.includes('0.9 m'), ftx1.includes('32 mm'), ftx1.includes('§7/35'), ftx1.includes('§7/36')], [true, true, true, true, false, false]);
const jfu = (rho, kgh, sel, both, area) => w.eval('joFuel({rho: ' + rho + ', burnerKgH: ' + kgh + '}, ' + sel + ', ' + both + ', ' + area + ')');
check('daily tank limit 0.9 m3: exactly 900 L is one tank, 902 L is two tanks of 451 L; 2864 L is four tanks of 716 L', [jfu(1, 37.5, null, false, 0).nDaily, jfu(1, 37.6, null, false, 0).nDaily, Math.round(jfu(1, 37.6, null, false, 0).perDaily), jfu(1, 119.32, null, false, 0).nDaily, Math.round(jfu(1, 119.32, null, false, 0).perDaily)], [1, 2, 451, 4, 716]);
const fu2 = jfu(0.85, 13.1844, 10000, true, 10);
check('a chosen 10000 L tank with the daily tank in the room: bund 1000 L; stored 10372 L; room volume 11409 L; threshold at least 1141 mm for 10 m2', [fu2.bund, fu2.stored, fu2.roomVol, fu2.sill * 1000].map(x => Math.round(x)), [1000, 10372, 11409, 1141]);
check('a chosen tank smaller than 21 days is flagged; the minimum or a bigger tank is not; no boiler gives no division error', [jfu(0.85, 13.1844, 5000, false, 0).short, jfu(0.85, 13.1844, 9000, false, 0).short, jfu(0.85, 0, null, false, 0).nDaily], [true, false, 1]);
setv(w, 'ft_jo_sel', 5000); w.calcResult('fueltank');
check('the form: a 5000 L tank shows the warning and the 500 L bund', [doc.getElementById('ft_results').textContent.includes('أقل من أدنى سعة'), doc.getElementById('ft_results').textContent.includes('500')], [true, true]);
setv(w, 'ft_jo_sel', ''); setv(w, 'ft_kind', 'buried'); w.calcResult('fueltank');
check('buried tank lists the 3 mm bituminous coat and the three cases where burying is forbidden; above ground lists the four installation methods', [doc.getElementById('ft_results').textContent.includes('3 mm'), doc.getElementById('ft_results').textContent.includes('حامضية')], [true, true]);
setv(w, 'ft_kind', 'unburied'); w.calcResult('fueltank');
check('above ground: four installation methods (2/8/1 C), no bituminous coat line', [doc.getElementById('ft_results').textContent.includes('أربع طرق'), doc.getElementById('ft_results').textContent.includes('حامضية')], [true, false]);
w = boot('intl'); w.renderCalc('fueltank'); w.calcResult('fueltank');
check('other codes: no Jordanian fields or block; the Syrian clauses stay', [!!w.document.getElementById('ft_jo_sel'), w.document.getElementById('ft_results').textContent.includes('2/8/1'), w.document.getElementById('ft_results').textContent.includes('§7/35'), w.eval('calcFuelTank().jo')], [false, false, true, null]);

// ---------- Jordan: central heating code Table 3 and 3/3/2 (natural-draft chimneys of light-oil boilers) in the chimney check ----------
w = boot('jo'); doc = w.document;
const CH = w.eval('JSON.parse(JSON.stringify({H: JO_CHIM_H, T: JO_CHIM}))');
const chRow = kw => CH.T.find(r => r[0] === kw)[1];
check('Table 3: 8 heights (6 to 40 m) and 32 rows from 25 to 2900 kW, each row with 2 to 5 printed values', [CH.H, CH.T.length, CH.T[0][0], CH.T[CH.T.length - 1][0], CH.T.every(r => r[1].length === 8 && r[1].filter(x => x != null).length >= 2 && r[1].filter(x => x != null).length <= 5)], [[6, 8, 10, 12, 15, 20, 30, 40], 32, 25, 2900, true]);
check('Table 3 values: 25 kW 125 at 6 / 8 / 10 m; 90 kW at 20 m 440; 175 kW at 8 m 810; 400 kW at 30 m 1360; 700 kW at 15 m 2490; 930 kW at 40 m 2540; 1630 kW at 30 m 4336; 2900 kW at 30 / 40 m 7270 / 6920', [chRow(25).slice(0, 3), chRow(90)[5], chRow(175)[1], chRow(400)[6], chRow(700)[4], chRow(930)[7], chRow(1630)[6], chRow(2900).slice(6)], [[125, 125, 125], 440, 810, 1360, 2490, 2540, 4336, [7270, 6920]]);
check('the area falls as the chimney gets taller in every row, and rises with the capacity in every column', [CH.T.every(r => { const a = r[1].filter(x => x != null); return a.every((x, i) => i === 0 || x <= a[i - 1] || r[0] === 25); }), CH.H.every((h, c) => { const col = CH.T.map(r => r[1][c]).filter(x => x != null); return col.every((x, i) => i === 0 || x >= col[i - 1]); })], [true, true]);
const jc = (kw, H, fan) => w.eval('joChimney(' + kw + ', ' + H + ', ' + !!fan + ')');
const c1 = jc(115, 12), c2 = jc(115, 13), c3 = jc(115, 25), c4 = jc(930, 12), c5 = jc(3000, 20), c6 = jc(100, 12), c7 = jc(95, 12), c8 = jc(115, 12, true);
check('115 kW at 12 m: 545 cm2 exact; at 13 m the 12 m column (545, step); at 25 m above the printed 20 m: 520 cm2 flagged high; 930 kW at 12 m: below the printed 20 m (no area); 3000 kW: beyond the table', [[c1.status, c1.area], [c2.status, c2.area, c2.hCol], [c3.status, c3.area, c3.hCol], c4.status, c5.status], [['exact', 545], ['step', 545, 12], ['high', 520, 20], 'low', 'beyond']);
check('the row printed 1.5 is read as 100 kW (505 at 12 m, flagged); 95 kW takes the next row (100) and says so; a fan takes 50 %: 272.5 cm2 and a 18.6 cm equivalent diameter', [[c6.area, c6.guess], [c7.row, c7.nextRow, c7.area], [c8.areaFin, Math.round(c8.dEq)]], [[505, true], [100, true, 505], [272.5, 186]]);
w.renderCalc('chimney'); w.calcResult('chimney');
let chr = doc.getElementById('ch_results').textContent;
check('Jordan form: Table 3 sizing and Jordan clauses; no Syrian clause numbers; default 300 mm round chimney (707 cm2) at 12 m for 115 kW passes (545)', [chr.includes('جدول 3'), chr.includes('3/3/2'), chr.includes('§7/39'), chr.includes('الكود السوري'), w.eval('calcChimney().checks[0].ok')], [true, true, false, false, true]);
setv(w, 'ch_d', 200); w.calcResult('chimney');
check('a 200 mm chimney (314 cm2) is below 545 cm2: the table check fails', [w.eval('calcChimney().checks[0].ok'), w.eval('calcChimney().fails')], [false, 1]);
setv(w, 'ch_d', 300); setv(w, 'ch_shape', 'rect'); setv(w, 'ch_d', 500); setv(w, 'ch_b', 200); w.calcResult('chimney');
check('rectangular 500 x 200: side ratio 2.5 fails the 2 : 1 limit; 400 x 200 passes', [w.eval('calcChimney().checks[1].ok'), (setv(w, 'ch_d', 400), w.eval('calcChimney().checks[1].ok'))], [false, true]);
setv(w, 'ch_shape', 'round'); setv(w, 'ch_d', 300);
setv(w, 'ch_lconn', 3.5); check('connector 3.5 m on a 12 m chimney exceeds 25 % (3 m); a fan removes the limit', [w.eval('calcChimney().checks[2].ok'), (setv(w, 'ch_jo_fan', 'fan'), w.eval('calcChimney().checks[2].ok'))], [false, null]);
setv(w, 'ch_jo_fan', 'nat'); setv(w, 'ch_lconn', 3);
setv(w, 'ch_jo_slv', 20); check('sleeve at 20 degrees fails the 30 degree limit', w.eval('calcChimney().checks[3].ok'), false); setv(w, 'ch_jo_slv', 30);
setv(w, 'ch_tconn', 2); check('connector plate 2 mm fails the 3 mm limit', w.eval('calcChimney().checks[4].ok'), false); setv(w, 'ch_tconn', 3);
setv(w, 'ch_jo_pl', 4); check('steel chimney 300 mm: plate 4 mm fails (6 mm from 0.3 m); a 250 mm chimney needs 5 mm and 4 mm fails; 5 mm passes', [w.eval('calcChimney().checks[5].ok'), (setv(w, 'ch_d', 250), w.eval('calcChimney().checks[5].ok')), (setv(w, 'ch_jo_pl', 5), w.eval('calcChimney().checks[5].ok'))], [false, false, true]);
setv(w, 'ch_d', 300); setv(w, 'ch_jo_pl', 0);
setv(w, 'ch_type', 'brick'); setv(w, 'ch_wool', 20); check('brick chimney: rock wool 20 mm fails 25 mm; 25 mm passes', [w.eval('calcChimney().checks[6].ok'), (setv(w, 'ch_wool', 25), w.eval('calcChimney().checks[6].ok'))], [false, true]);
setv(w, 'ch_type', 'steel');
setv(w, 'ch_jo_draft', 1); check('draft 1 mm water gauge is below 1.27; 2 mm without a stabilizer fails, with one passes', [w.eval('calcChimney().checks[7].ok'), (setv(w, 'ch_jo_draft', 2), w.eval('calcChimney().checks[8].ok')), (setv(w, 'ch_stab', 'yes'), w.eval('calcChimney().checks[8].ok'))], [false, false, true]);
setv(w, 'ch_jo_draft', 0); setv(w, 'ch_jo_vent', 1000); check('boiler room vent 1000 cm2 is below twice the 707 cm2 chimney (1414); 1500 passes', [w.eval('calcChimney().checks[9].ok'), (setv(w, 'ch_jo_vent', 1500), w.eval('calcChimney().checks[9].ok'))], [false, true]);
setv(w, 'ch_jo_kw', 3000); w.calcResult('chimney');
check('3000 kW: the result warns that it is beyond the table and the table check is not evaluated', [doc.getElementById('ch_results').textContent.includes('أكبر من أكبر سطر'), w.eval('calcChimney().checks[0].ok')], [true, null]);
w = boot('intl'); w.renderCalc('chimney'); w.calcResult('chimney');
check('other codes: the Syrian chimney check and fields stay (no Table 3 fields)', [!!w.document.getElementById('ch_jo_kw'), w.document.getElementById('ch_results').textContent.includes('الكود السوري'), w.eval('calcChimney().jo === undefined')], [false, true, true]);

// ---------- Jordan: fire protection code chapter 17 (fire resistance of concrete, Tables 13 - 19): the concrete fire resistance calculator ----------
w = boot('jo'); doc = w.document;
check('fire category: 11 calculators and the concrete fire resistance card', [doc.getElementById('main-categories-grid').textContent.includes('11 حاسبة متاحة'), doc.getElementById('fire-category').innerHTML.includes("showCalc('concretefire')")], [true, true]);
const CFD = w.eval('JSON.parse(JSON.stringify({H: JO_CF_H, E: JO_CF, T17: JO_CF_T17}))');
const cfv = (el, i, j) => CFD.E[el][2][i][2][j][1];
check('Table 13 (reinforced beams): 4 rows; plain concrete cover 15 / 25 / 35 / 45 / 55 / 65 and width 80 / 110 / 140 / 180 / 240 / 280; lightweight aggregate cover 15 / 20 / 30 / 35 / 45 / 50', [CFD.H, CFD.E.beamRC[2].length, cfv('beamRC', 0, 0), cfv('beamRC', 0, 1), cfv('beamRC', 3, 0)], [[0.5, 1, 1.5, 2, 3, 4], 4, [15, 25, 35, 45, 55, 65], [80, 110, 140, 180, 240, 280], [15, 20, 30, 35, 45, 50]]);
check('Table 14 (prestressed beams): 7 rows; plain concrete cover 25 / 40 / 50 / 65 / 85 / 100; row G 20 / 30 / 40 / 50 / 65 / 80 and width 80 to 250; row F width 60 / 60 / 70 / 85 / 125 / 140', [CFD.E.beamPC[2].length, cfv('beamPC', 0, 0), cfv('beamPC', 6, 0), cfv('beamPC', 6, 1), cfv('beamPC', 5, 1)], [7, [25, 40, 50, 65, 85, 100], [20, 30, 40, 50, 65, 80], [80, 100, 130, 160, 200, 250], [60, 60, 70, 85, 125, 140]]);
check('Table 15 (reinforced slabs): solid cover 15 / 15 / 20 / 20 / 25 / 25 and depth 100 / 100 / 125 / 125 / 150 / 150; hollow depth 100 to 190; box depth 105 to 230; ribs F side cover 10 / 15 / 20 / 25 / 30 / 40', [CFD.E.slabRC[2].length, cfv('slabRC', 0, 0), cfv('slabRC', 0, 1), cfv('slabRC', 1, 2), cfv('slabRC', 2, 2), cfv('slabRC', 5, 1)], [6, [15, 15, 20, 20, 25, 25], [100, 100, 125, 125, 150, 150], [100, 110, 140, 160, 175, 190], [105, 130, 155, 180, 205, 230], [10, 15, 20, 25, 30, 40]]);
check('Table 16 (prestressed slabs): solid cover 15 / 25 / 30 / 40 / 50 / 65 and depth 90 / 100 / 125 / 125 / 150 / 150; T beams cover 25 / 40 / 50 / 65 / 85 / 100 and web 60 / 90 / 110 / 150 / 200 / 250; box flange 25 / 25 / 30 / 40 / 50 / 65', [cfv('slabPC', 0, 0), cfv('slabPC', 0, 1), cfv('slabPC', 4, 0), cfv('slabPC', 4, 2), cfv('slabPC', 2, 1)], [[15, 25, 30, 40, 50, 65], [90, 100, 125, 125, 150, 150], [25, 40, 50, 65, 85, 100], [60, 90, 110, 150, 200, 250], [25, 25, 30, 40, 50, 65]]);
check('Tables 18, 19 and 17: columns A 150 / 200 / 250 / 300 / 400 / 450, B 150 / 150 / 150 / 225 / 275 / 300, C 120 / 120 / 150 / 200 / 225 / 275, D 150 / 190 / 200 / 225 / 275 / 300; walls A 75 / 75 / 100 / 100 / 150 / 180, C 65 / 65 / 75 / 75 / 100 / 125; Table 17 rows 10 / 10 / 15 / 15 / 25, 10 / 10 / 10 / 10 / 15 and 10 / 10 / 15 / 20 / 25', [[0, 1, 2, 3].map(i => cfv('column', i, 0)), cfv('wall', 0, 0), cfv('wall', 2, 0), CFD.T17.map(r => r[1])], [[[150, 200, 250, 300, 400, 450], [150, 150, 150, 225, 275, 300], [120, 120, 150, 200, 225, 275], [150, 190, 200, 225, 275, 300]], [75, 75, 100, 100, 150, 180], [65, 65, 75, 75, 100, 125], [[10, 10, 15, 15, 25], [10, 10, 10, 10, 15], [10, 10, 15, 20, 25]]]);
check('every row is non-decreasing from 0.5 to 4 hours (covers, widths, depths, dimensions)', Object.values(CFD.E).every(E => E[2].every(V => V[2].every(p => p[1].every((x, i) => i === 0 || x >= p[1][i - 1])))), true);
w.showCalc('concretefire'); w.calcResult('concretefire');
check('opens on the reinforced beam (A, plain concrete) at 2 h: cover 45 mm and width 180 mm are the minimum; two parameters; no check marks before values are entered', [w.eval('calcConcreteFire().rows.map(r => r.need)'), w.eval('calcConcreteFire().rows.map(r => r.ok)'), doc.getElementById('cf_results').textContent.includes('جدول 13')], [[45, 180], [null, null], true]);
setv(w, 'cf_in0', 40); setv(w, 'cf_in1', 200); w.calcResult('concretefire');
check('cover 40 mm fails 45 mm; width 200 mm passes 180 mm', w.eval('calcConcreteFire().rows.map(r => r.ok)'), [false, true]);
setv(w, 'cf_h', 4); w.calcResult('concretefire');
check('at 4 h the cover rises to 65 mm (above 40 mm: the extra mesh of 17/2/5 is mentioned) and the width to 280 mm', [w.eval('calcConcreteFire().rows.map(r => r.need)'), w.eval('calcConcreteFire().mesh'), doc.getElementById('cf_results').textContent.includes('0.5 kg')], [[65, 280], true, true]);
setv(w, 'cf_h', 2); setv(w, 'cf_tb', 300); setv(w, 'cf_tbw', 150); w.calcResult('concretefire');
check('T beam: b 300 and bw 150 (bw at least b / 3): the cover is multiplied by the root of 2 = 1.414 (45 mm becomes 63.6 mm); the width is not multiplied', [Math.round(w.eval('calcConcreteFire().factor') * 1000) / 1000, Math.round(w.eval('calcConcreteFire().rows[0].need') * 10) / 10, w.eval('calcConcreteFire().rows[1].need')], [1.414, 63.6, 180]);
setv(w, 'cf_tbw', 90); w.calcResult('concretefire');
check('T beam with bw below b / 3 (90 < 100): the table does not apply and the warning shows', [w.eval('calcConcreteFire().tThin'), doc.getElementById('cf_results').textContent.includes('حماية إضافية')], [true, true]);
setv(w, 'cf_tb', ''); setv(w, 'cf_tbw', '');
const cfs = (id, x) => { const e = doc.getElementById(id); e.value = String(x); e.dispatchEvent(new w.Event('change', { bubbles: true })); };
cfs('cf_el', 'slabPC');
check('switching to the prestressed slab rebuilds the variants (6) and the fields; solid slab at 2 h: cover 40 and depth 125', [doc.getElementById('cf_var').options.length, doc.getElementById('cf_params').querySelectorAll('input').length, w.eval('calcConcreteFire().rows.map(r => r.need)')], [6, 2, [40, 125]]);
cfs('cf_var', 4);
check('prestressed slab, T beams (E): four fields; at 2 h bottom and side cover 65, web 150, flange 125; the slab soffit table (Table 17) shows', [doc.getElementById('cf_params').querySelectorAll('input').length, w.eval('calcConcreteFire().rows.map(r => r.need)'), doc.getElementById('cf_results').textContent.includes('جدول 17')], [4, [65, 65, 150, 125], true]);
cfs('cf_el', 'column'); cfs('cf_h', 3);
check('column A (no extra protection) at 3 h: 400 mm; variant D (additional steel) 275 mm', [w.eval('calcConcreteFire().rows[0].need'), (cfs('cf_var', 3), w.eval('calcConcreteFire().rows[0].need'))], [400, 275]);
cfs('cf_el', 'wall'); cfs('cf_h', 1);
check('wall A at 1 h: 75 mm; the wall fields (steel ratio and cover) appear', [w.eval('calcConcreteFire().rows[0].need'), !!doc.getElementById('cf_wr') && !!doc.getElementById('cf_wc')], [75, true]);
setv(w, 'cf_wr', 0.5); setv(w, 'cf_in0', 100); setv(w, 'cf_wc', 20); w.calcResult('concretefire');
check('ratio 0.5 %: plain wall, 150 mm needed and 100 mm fails; the cover limit for 1 h is 15 mm (20 passes); at 2 h the plain wall needs 200 mm and the cover 25 mm (20 fails)', [w.eval('calcConcreteFire().walls.plainThick'), w.eval('calcConcreteFire().walls.plainOk'), w.eval('calcConcreteFire().walls.covOk'), (cfs('cf_h', 2), w.eval('calcConcreteFire().walls.plainThick')), w.eval('calcConcreteFire().walls.covOk')], [150, false, true, 200, false]);
cfs('cf_h', 4); setv(w, 'cf_wr', 0.5); w.calcResult('concretefire');
check('4 h: the plain wall thickness is not printed (null, no check) and the result still shows', [w.eval('calcConcreteFire().walls.plainThick'), w.eval('calcConcreteFire().walls.plainOk'), doc.getElementById('cf_results').textContent.includes('غير مطبوعة')], [null, null, true]);
w = boot('intl'); w.showCalc('concretefire');
check('the calculator is available with every code (chapter 17 data) and opens with its results', !!w.document.getElementById('cf_results') && w.document.getElementById('cf_results').textContent.includes('جدول 13'), true);

// ---------- Jordan: mechanical ventilation code Table 3 (preferred duct dimensions) in the duct sizing ----------
w = boot('jo'); doc = w.document;
const PD = w.eval('JSON.parse(JSON.stringify({R: JO_PREF_ROUND, Q: JO_PREF_RECT, O: JO_PREF_OVAL}))');
check('Table 3: 32 round sizes from 75 to 1800 mm, 25 rectangular sizes from 150 x 100 to 800 x 800 and 41 flat oval sizes from 150 x 550 to 500 x 980', [PD.R.length, PD.R[0], PD.R[PD.R.length - 1], PD.Q.length, PD.Q[0], PD.Q[PD.Q.length - 1], PD.O.length, PD.O[0], PD.O[PD.O.length - 1]], [32, 75, 1800, 25, [150, 100], [800, 800], 41, [150, 550], [500, 980]]);
check('round sizes rise (75 to 400 by 25 up to 400; 450 to 800 by 50; 900 to 1800 by 100); rectangles keep width at least height; the oval major axis is 80 mm larger step by step in every minor-axis group', [PD.R.every((x, i) => i === 0 || x > PD.R[i - 1]), PD.R.slice(0, 14), PD.R.slice(14, 22), PD.R.slice(22), PD.Q.every(r => r[0] >= r[1]), PD.O.every((r, i) => i === 0 || r[0] !== PD.O[i - 1][0] || r[1] - PD.O[i - 1][1] === 80)], [true, [75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400], [450, 500, 550, 600, 650, 700, 750, 800], [900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800], true, true]);
const jp = (d, q) => w.eval('joPref(' + d + ', ' + (q || 0.5) + ')');
const pp = jp(300), pq = jp(301), pr = jp(2000);
check('300 mm: the preferred round size is 300; 301 mm: 325; 2000 mm: none; no rectangle beyond the 800 x 800 section', [pp.round, pq.round, pr.round, pr.rect.length], [300, 325, null, 0]);
check('the rectangles offered for 300 mm: at most four, each with an equivalent diameter of at least 300 mm, smallest area first; the velocity is the flow over the area', [pp.rect.length, pp.rect.every(x => x.De >= 300 - 1e-9), pp.rect.every((x, i) => i === 0 || x.a * x.b >= pp.rect[i - 1].a * pp.rect[i - 1].b), Math.round(pp.rect[0].v * 100) / 100 === Math.round(0.5 / (pp.rect[0].a * pp.rect[0].b / 1e6) * 100) / 100], [4, true, true, true]);
check('the equivalent diameter of 300 x 250 by the ASHRAE formula is 1.3 (a b)^0.625 / (a + b)^0.25 = 299 mm (so it does not qualify for 300 mm)', [Math.round(w.eval('joPrefDe(300, 250)')), pp.rect.some(x => x.a === 300 && x.b === 250)], [299, false]);
w.renderCalc('ductsizing'); w.calcResult('ductsizing');
const dsr = doc.getElementById('dt_results').textContent, dc = w.eval('calcDuctSizing()');
check('duct sizing results show the Table 3 block with the preferred round size for the calculated diameter', [dsr.includes('جدول 3'), dsr.includes('الأبعاد المفضلة'), w.eval('joPref(calcDuctSizing().D_calc * 25.4, 1).round') >= dc.D_calc * 25.4 - 1e-9], [true, true, true]);
w = boot('intl'); w.renderCalc('ductsizing'); w.calcResult('ductsizing');
check('other codes: no preferred-size block', w.document.getElementById('dt_results').textContent.includes('الأبعاد المفضلة'), false);

// ---------- Jordan: electrical installations code 4/6 (Tables 64 - 69): the unit system for conduits and trunking in the conduit fill calculator ----------
w = boot('jo'); doc = w.document;
const CU = w.eval('JSON.parse(JSON.stringify({U: JO_CU, S: JO_CND_SIZES, SH: JO_CND_SHORT, E: JO_CND_EFF, T: JO_TRK, L: JO_CND_LEN}))');
check('Table 64 (short straight runs): solid 1 / 1.5 / 2.5 = 22 / 27 / 39; stranded 1.5 / 2.5 / 4 / 6 / 10 = 31 / 43 / 58 / 88 / 146', CU.U.map(c => c[2]), [22, 27, 39, 31, 43, 58, 88, 146]);
check('Table 66 (long runs or with bends): 16 / 22 / 30 for 1 / 1.5 / 2.5 (stranded 1.5 and 2.5 as the solid), stranded 4 / 6 / 10 = 43 / 58 / 105', CU.U.map(c => c[3]), [16, 22, 30, 22, 30, 43, 58, 105]);
check('Table 68 (trunking): solid 1.5 / 2.5 = 7.1 / 10.2 (no 1 mm2); stranded 1.5 / 2.5 / 4 / 6 / 10 = 8.1 / 11.4 / 15.2 / 22.9 / 36.3', CU.U.map(c => c[4]), [null, 7.1, 10.2, 8.1, 11.4, 15.2, 22.9, 36.3]);
check('Table 65 (conduits, short runs) 16 / 20 / 25 / 32 mm = 290 / 460 / 800 / 1400; Table 69 (11 trunking sizes) from 738 (75 x 25) to 4252 (100 x 100), rising', [CU.S, CU.SH, CU.T.length, CU.T[0], CU.T[10], CU.T.every((t, i) => i === 0 || t[1] > CU.T[i - 1][1])], [[16, 20, 25, 32], [290, 460, 800, 1400], 11, ['75 × 25', 738, 75, 25], ['100 × 100', 4252, 100, 100], true]);
// Table 67 as printed (conduit factors 16 / 20 / 25 / 32 mm by length and number of bends; digits as in the print)
const T67 = {1: {4: [130, 213, 388, 692], 3: [158, 256, 463, 818], 2: [477, 286, 514, 900], 1: [188, 303, 543, 947]}, 1.5: {4: [111, 182, 333, 600], 3: [143, 233, 422, 750], 2: [167, 270, 487, 857], 1: [182, 294, 528, 923]},
  2: {4: [97, 159, 292, 529], 3: [130, 213, 388, 692], 2: [158, 256, 486, 818], 1: [177, 285, 514, 900]}, 2.5: {4: [86, 141, 260, 474], 3: [120, 196, 358, 643], 2: [150, 244, 442, 783], 1: [171, 273, 500, 878]},
  3: {3: [111, 182, 333, 600], 2: [143, 233, 422, 750], 1: [167, 270, 487, 857]}, 3.5: {3: [103, 169, 311, 563], 2: [136, 222, 401, 720], 1: [162, 263, 475, 837], 0: [179, 290, 521, 911]},
  4: {3: [97, 159, 292, 529], 2: [130, 213, 383, 692], 1: [158, 256, 463, 818], 0: [177, 286, 514, 900]}, 4.5: {3: [91, 149, 275, 500], 2: [125, 204, 373, 667], 1: [154, 250, 452, 800], 0: [174, 282, 507, 889]},
  5: {3: [86, 141, 260, 474], 2: [120, 196, 353, 643], 1: [150, 244, 442, 783], 0: [171, 278, 500, 878]}, 6: {2: [111, 182, 338, 600], 1: [143, 233, 422, 750], 0: [167, 270, 487, 857]},
  7: {2: [103, 169, 311, 563], 1: [136, 222, 404, 720], 0: [162, 263, 475, 837]}, 8: {2: [97, 159, 292, 529], 1: [130, 213, 388, 692], 0: [158, 256, 463, 818]},
  9: {2: [91, 149, 275, 500], 1: [125, 204, 373, 667], 0: [154, 250, 452, 800]}, 10: {2: [86, 141, 260, 474], 1: [120, 196, 358, 643], 0: [150, 244, 442, 783]}};
const jcf = (L, b) => w.eval('joCndFactors(' + L + ', ' + b + ')');
const cdiffs = [];
Object.keys(T67).forEach(L => Object.keys(T67[L]).forEach(b => { const m = jcf(L, +b).factors; T67[L][b].forEach((x, i) => { if (m[i] !== x) cdiffs.push([+L, +b, CU.S[i], x, m[i]]); }); }));
check('the effective-length model reproduces all 200 printed cells of Table 67 except eight misprints (477 for 177, 486 for 463, 285 for 286, 273 for 278, 383 for 388, 353 for 358, 338 for 333, 404 for 401)', [Object.keys(T67).reduce((a, L) => a + Object.keys(T67[L]).length * 4, 0), cdiffs.length, cdiffs.map(d => d.slice(3)).sort((a, b) => a[0] - b[0])], [200, 8, [[273, 278], [285, 286], [338, 333], [353, 358], [383, 388], [404, 401], [477, 177], [486, 463]]]);
check('the cells that must be equal: every pair of printed cells with the same L x 2^bends agrees (after the misprints) and each bend doubles the length', [jcf(1, 3).factors, jcf(2, 2).factors, jcf(4, 1).factors, jcf(8, 0).factors, jcf(1, 3).eff, jcf(4, 1).eff], [[158, 256, 463, 818], [158, 256, 463, 818], [158, 256, 463, 818], [158, 256, 463, 818], 8, 8]);
check('short straight runs up to 3 m use Table 65 (no bends); 3.2 m rounds to the 3.5 m row; over 10 m and the bend limits (4 bends up to 2.5 m, 3 up to 5 m, 2 up to 10 m) give no value', [jcf(2.5, 0).table, jcf(3.2, 0).Lt, jcf(11, 1).na, jcf(3, 4).na, jcf(2.5, 4).table, jcf(6, 3).na, jcf(5, 3).table, jcf(10, 2).table], [65, 3.5, 'long', 'bends', 67, 'bends', 67, 67]);
w.renderCalc('conduitfill');
const cfj = (mode, L, bends, counts, others) => {
  setv(w, 'cj_mode', mode); setv(w, 'cj_len', L); setv(w, 'cj_bends', bends);
  for (let i = 0; i < 8; i++) setv(w, 'cj_n' + i, (counts || {})[i] || 0);
  for (let k = 1; k <= 3; k++) { setv(w, 'cj_od' + k, (others && others[k - 1] ? others[k - 1][0] : 0)); setv(w, 'cj_oq' + k, (others && others[k - 1] ? others[k - 1][1] : 0)); }
  w.calcResult('conduitfill'); return w.eval('calcConduitFill()');
};
let cx = cfj('conduit', 2.5, 0, {2: 6});
check('example 1: six 2.5 mm2 solid cables in a 2.5 m straight conduit: 6 x 39 = 234, the 16 mm conduit (290)', [cx.total, cx.chosen, cx.path.table], [234, [16, 290], 65]);
cx = cfj('conduit', 8, 2, {1: 6, 2: 5});
check('example 2: 8 m with a bend and a double set (two bends), 6 x 1.5 and 5 x 2.5 mm2: 6 x 22 + 5 x 30 = 282, factor 292, the 25 mm conduit', [cx.total, cx.chosen, cx.path.eff], [282, [25, 292], 32]);
cx = cfj('conduit', 4, 3, {0: 12});
check('example 3: 4 m with three bends, twelve 1.0 mm2 cables: 12 x 16 = 192, factor 292, the 25 mm conduit', [cx.total, cx.chosen], [192, [25, 292]]);
cx = cfj('trunk', 3, 0, {2: 40, 5: 10, 6: 5});
check('example 4: trunking, 40 x 2.5 solid (10.2), 10 x 4 stranded (15.2) and 5 x 6 stranded (22.9): 674.5, the 75 x 25 trunking (738)', [Math.round(cx.total * 10) / 10, cx.chosen], [674.5, ['75 × 25', 738, 75, 25]]);
cx = cfj('trunk', 3, 0, {}, [[6.2, 18], [7.3, 13], [11, 3]]);
check('example 5: cables of outside diameter 6.2 x 18, 7.3 x 13 and 11.0 x 3: area 1373 mm2 / 0.45 = 3050 mm2 (3052 in the print), the 75 x 50 trunking', [Math.round(cx.area), Math.round(cx.need / 10) * 10, cx.byArea[0]], [1373, 3050, '75 × 50']);
cx = cfj('conduit', 2.5, 0, {2: 6});
check('the form shows the Table 64 / 65 result, no NEC fields; a conduit that is too small is marked, and a 1 mm2 solid cable in trunking has no Table 68 factor', [doc.getElementById('cf_results').textContent.includes('الجدولان 64 و65'), !!doc.getElementById('cf-rows'), cfj('conduit', 3, 0, {7: 20}).chosen, cfj('trunk', 3, 0, {0: 3}).missing.length], [true, false, null, 1]);
cfj('trunk', 3, 0, {2: 40, 5: 10, 6: 5}, [[6.2, 18]]);
check('trunking with both kinds of cable shows both sizes and the note that the code does not combine them', [doc.getElementById('cf_results').textContent.includes('لا تجمع الطريقتين'), w.eval('calcConduitFill().byArea !== null')], [true, true]);
w = boot('intl'); w.renderCalc('conduitfill'); w.calcResult('conduitfill');
check('other codes: the NEC conduit fill stays (no unit-system fields)', [!!w.document.getElementById('cj_mode'), !!w.document.getElementById('cf-rows'), w.document.getElementById('cf_results').textContent.includes('حجم المجرى')], [false, true, true]);

// ---------- Jordan: electrical installations code 4/7/1 Table 70 (maximum distance between cable clips) in the cable sizing ----------
w = boot('jo'); doc = w.document;
const CLP = w.eval('JSON.parse(JSON.stringify({C: JO_CLIP, CV: JO_CLIP_CARAVAN, K: JO_CLIP_KINDS}))');
check('Table 70: non-armoured 250 / 400, 300 / 400, 350 / 450, 400 / 550 (horizontal / vertical) for 9 / 15 / 20 / 40 mm; armoured none, 350 / 450, 400 / 550, 450 / 600; mineral insulated 600 / 800, 900 / 1200, 1500 / 2000, none; caravans 150 / 250; four cable kinds', [CLP.C.non.map(r => r.slice(1)), CLP.C.arm.map(r => r.slice(1)), CLP.C.mi.map(r => r.slice(1)), CLP.CV, CLP.K.length], [[[250, 400], [300, 400], [350, 450], [400, 550]], [[null, null], [350, 450], [400, 550], [450, 600]], [[600, 800], [900, 1200], [1500, 2000], [null, null]], [150, 250], 4]);
const jclip = (k, d) => w.eval('joClip(' + JSON.stringify(k) + ', ' + d + ')');
check('non-armoured: 9 mm 250 / 400 (the limit belongs to the band), 9.5 mm 300 / 400, 16 mm 350 / 450, 20 mm 350 / 450, 21 mm 400 / 550, 40 mm 400 / 550, 41 mm beyond the table', [[9, 9.5, 16, 20, 21, 40].map(d => [jclip('non', d).h, jclip('non', d).v]), jclip('non', 41).beyond], [[[250, 400], [300, 400], [350, 450], [350, 450], [400, 550], [400, 550]], true]);
check('armoured cables of 9 mm and mineral insulated cables over 20 mm have no printed value; armoured 12 mm 350 / 450; mineral insulated 20 mm 1500 / 2000; caravans 150 / 250 at any size; no diameter gives nothing', [jclip('arm', 9).na, jclip('mi', 25).na, [jclip('arm', 12).h, jclip('arm', 12).v], [jclip('mi', 20).h, jclip('mi', 20).v], [jclip('car', 50).h, jclip('car', 50).v], jclip('non', 0)], [true, true, [350, 450], [1500, 2000], [150, 250], null]);
w.renderCalc('cablesizing'); w.calcResult('cablesizing');
let clt = doc.getElementById('cs_results').textContent;
check('Jordanian cable sizing shows the clip block: default non-armoured 16 mm: 350 mm horizontal and 450 mm vertical, the 30 degree rule and the 5 m / 3 m vertical runs of 4/7/1 A', [clt.includes('جدول 70'), clt.includes('350'), clt.includes('450'), clt.includes('30°'), clt.includes('4/7/1 A 7')], [true, true, true, true, true]);
setv(w, 'cs_clip_kind', 'mi'); setv(w, 'cs_clip_d', 18); w.calcResult('cablesizing');
check('mineral insulated 18 mm: 1500 horizontal and 2000 vertical; 45 mm shows the manufacturer message', [doc.getElementById('cs_results').textContent.includes('2000'), (setv(w, 'cs_clip_d', 45), w.calcResult('cablesizing'), doc.getElementById('cs_results').textContent.includes('تعليمات الصانع'))], [true, true]);
w = boot('intl'); w.renderCalc('cablesizing'); w.calcResult('cablesizing');
check('other codes: no clip block', w.document.getElementById('cs_results').textContent.includes('جدول 70'), false);

// ---------- Jordan: electrical installations code 7/2/4, Tables 71 and 72 (distance between the supports of conduits and trunking) in the conduit fill ----------
w = boot('jo'); doc = w.document;
const SUP = w.eval('JSON.parse(JSON.stringify({C: JO_SUP_CND, T: JO_SUP_TRK}))');
check('Table 71 (conduits, metres horizontal / vertical): up to 16 mm metal 0.75 / 1.00, insulating 0.75 / 1.00, flexible 0.30 / 0.50; over 16 to 25: 1.75 / 2.00, 1.50 / 1.75, 0.40 / 0.60; over 25 to 40: 2.00 / 2.25, 1.75 / 2.00, 0.60 / 0.80; over 40: 2.25 / 2.50, 2.00 / 2.00, 0.80 / 1.00 (printed 0.100)', SUP.C.map(r => r.slice(1)), [[[0.75, 1], [0.75, 1], [0.3, 0.5]], [[1.75, 2], [1.5, 1.75], [0.4, 0.6]], [[2, 2.25], [1.75, 2], [0.6, 0.8]], [[2.25, 2.5], [2, 2], [0.8, 1]]]);
check('Table 72 (trunking): over 300 to 700 mm2 metal 0.75 / 1.00, insulating 0.50 / 0.50; to 1500: 1.25 / 1.50, 0.50 / 0.50; to 2500: 1.75 / 2.00, 1.25 / 1.25; to 5000: 3.00 / 3.00, 1.50 / 2.00; over 5000: 3.00 / 3.00, 1.75 / 2.00', SUP.T.map(r => r.slice(1)), [[[0.75, 1], [0.5, 0.5]], [[1.25, 1.5], [0.5, 0.5]], [[1.75, 2], [1.25, 1.25]], [[3, 3], [1.5, 2]], [[3, 3], [1.75, 2]]]);
check('the spacing never falls with the size (conduits and trunking) and the metal values are not below the insulating ones', [SUP.C.every((r, i) => i === 0 || r.slice(1).every((p, k) => p[0] >= SUP.C[i - 1][k + 1][0] && p[1] >= SUP.C[i - 1][k + 1][1])), SUP.T.every((r, i) => i === 0 || r.slice(1).every((p, k) => p[0] >= SUP.T[i - 1][k + 1][0] && p[1] >= SUP.T[i - 1][k + 1][1])), SUP.T.every(r => r[1][0] >= r[2][0] && r[1][1] >= r[2][1])], [true, true, true]);
w.renderCalc('conduitfill');
const cfs2 = (mode, L, bends, counts) => { setv(w, 'cj_mode', mode); setv(w, 'cj_len', L); setv(w, 'cj_bends', bends); for (let i = 0; i < 8; i++) setv(w, 'cj_n' + i, (counts || {})[i] || 0); w.calcResult('conduitfill'); return doc.getElementById('cf_results').textContent; };
let st = cfs2('conduit', 2.5, 0, {2: 6});
check('conduit 16 mm (example 1): the Table 71 block shows with the 16 mm row (0.75 / 1.00 metal) and the 300 mm rule for flexible conduit', [st.includes('جدول 71'), st.includes('0.75 / 1.00'), st.includes('300 mm')], [true, true, true]);
st = cfs2('trunk', 3, 0, {2: 40, 5: 10, 6: 5});
check('trunking 75 x 25 (1875 mm2, example 4): the Table 72 block shows; 1.75 / 2.00 metal and 1.25 / 1.25 insulating are in the highlighted row', [st.includes('جدول 72'), st.includes('1.75 / 2.00'), st.includes('1.25 / 1.25')], [true, true, true]);
check('nothing chosen (no cables): the table is shown without a highlighted row and the hint to choose cables', [cfs2('conduit', 2.5, 0, {}).includes('اختر كبالًا')], [true]);
w = boot('intl'); w.renderCalc('conduitfill'); w.calcResult('conduitfill');
check('other codes: no support block', w.document.getElementById('cf_results').textContent.includes('جدول 71'), false);

// ---------- Jordan: electrical installations code 4/5/5, Tables 12 - 15 (cables in enclosed trenches, methods L, M, N) in the cable sizing ----------
w = boot('jo'); doc = w.document;
const TR = w.eval('JSON.parse(JSON.stringify({T: JO_TRENCH, F: JO_TRENCH_FIX}))');
const trs = ['4', '6', '10', '16', '25', '35', '50', '70', '95', '120', '150', '185', '240', '300', '400', '500', '630'];
check('Tables 13 - 15: 17 conductor sizes from 4 to 630 mm2; four columns for L and three for M and N', [['L', 'M', 'N'].map(m => Object.keys(TR.T[m].rows).length), ['L', 'M', 'N'].map(m => TR.T[m].cols.length), Object.keys(TR.T.L.rows)], [[17, 17, 17], [4, 3, 3], trs]);
check('Table 13 (L): 4 mm2 0.93 / 0.90 / 0.87 / 0.82; 150 mm2 0.84 / 0.78 / 0.74 / 0.67; 630 mm2 0.77 / 0.71 / 0.65 / 0.56; Table 14 (M): 4 mm2 0.86 / 0.83 / 0.76; 95 mm2 0.75 / 0.70 / 0.63; 630 mm2 0.63 / 0.57 / 0.49; Table 15 (N): 4 mm2 0.81 / 0.74 / 0.69; 240 mm2 0.61 / 0.53 / 0.48; 630 mm2 0.54 / 0.47 / 0.41', [TR.T.L.rows[4], TR.T.L.rows[150], TR.T.L.rows[630], TR.T.M.rows[4], TR.T.M.rows[95], TR.T.M.rows[630], TR.T.N.rows[4], TR.T.N.rows[240], TR.T.N.rows[630]], [[0.93, 0.9, 0.87, 0.82], [0.84, 0.78, 0.74, 0.67], [0.77, 0.71, 0.65, 0.56], [0.86, 0.83, 0.76], [0.75, 0.7, 0.63], [0.63, 0.57, 0.49], [0.81, 0.74, 0.69], [0.61, 0.53, 0.48], [0.54, 0.47, 0.41]]);
check('the factors never rise with the conductor size, and never rise from the column with the fewest cables to the one with the most (after the three replaced cells)', [['L', 'M', 'N'].every(m => trs.every((s, i) => i === 0 || TR.T[m].rows[s].every((x, c) => x <= TR.T[m].rows[trs[i - 1]][c] + 1e-9))), ['L', 'M', 'N'].every(m => trs.every(s => TR.T[m].rows[s].every((x, c) => c === 0 || x <= TR.T[m].rows[s][c - 1] + 1e-9)))], [true, true]);
check('three cells were replaced: L 300 mm2 column 2 (blank, 0.73), N 300 mm2 column 1 (printed 0.69, 0.57 used) and column 3 (printed 0.64, 0.44 used)', [TR.F.length, TR.F.map(x => [x[0], x[1], x[2], x[4]]), TR.T.L.rows[300][1], TR.T.N.rows[300][0], TR.T.N.rows[300][2]], [3, [['L', 300, 1, 0.73], ['N', 300, 0, 0.57], ['N', 300, 2, 0.44]], 0.73, 0.57, 0.44]);
const jtf = (m, c, s) => w.eval('joTrenchFactor(' + JSON.stringify(m) + ', ' + c + ', ' + s + ')');
check('sizes below 4 mm2 use the 4 mm2 row; a size between two rows takes the larger row (380 mm2 aluminium -> 400); the column is limited to the printed columns', [jtf('L', 0, 2.5), jtf('L', 0, 1), jtf('L', 0, 380), jtf('M', 2, 600), jtf('N', 9, 4), jtf('X', 0, 4)], [0.93, 0.93, 0.8, 0.49, 0.69, 1]);
w.renderCalc('cablesizing');
const csj = (o) => { Object.entries(o).forEach(([k, x]) => setv(w, k, x)); w.calcResult('cablesizing'); return w.eval('calcCableSizing()'); };
const base = { cs_std: 'jo', cs_jo: 'cu_xlpea_air', cs_mode: 'amp', cs_load: 200, cs_len: 1, cs_amb: 30, cs_phase: 3, cs_volt: 400, cs_ngroup: 1, cs_par: 1 };
w.eval("csToggle('std')");
let ct0 = csj({ ...base, cs_jo_trench: 'no' });
check('XLPE armoured multi-core cable in air (K), 200 A three-phase at 30 C: 70 mm2 (247 A) without a trench', [ct0.size, ct0.kG], ['70 mm²', 1]);
setv(w, 'cs_jo_trench', 'L'); w.eval('csJoTrench()');
let ct1 = csj({ cs_jo_tcol: 3 });
check('in a method L trench with six single-core / four two-core / three multi-core cables the factor 0.72 at 70 mm2 (178 A) is not enough: 95 mm2 with 0.70 (213 A); the factor shown is the chosen one', [ct1.size, ct1.kG, Math.round(ct1.allowed)], ['95 mm²', 0.7, 213]);
ct1 = csj({ cs_jo_tcol: 0 });
check('in the same trench with a single cable (column 1: 0.87 at 70 mm2 -> 215 A) the 70 mm2 cable is enough again', [ct1.size, ct1.kG], ['70 mm²', 0.87]);
setv(w, 'cs_jo_trench', 'N'); w.eval('csJoTrench()'); ct1 = csj({ cs_jo_tcol: 2 });
check('method N column 3 (twelve three-core cables) lowers the factor to 0.57 at 70 mm2, 0.55 at 95 mm2 and 0.53 at 120 mm2 (186 A): the 150 mm2 cable (0.51 x 408 = 208 A) is chosen', [ct1.size, ct1.kG, Math.round(ct1.allowed)], ['150 mm²', 0.51, 208]);
check('the result notes name the trench table and the 4 mm2 rule; the arrangement list follows the method (3 columns for N, 4 for L)', [doc.getElementById('cs_results').textContent.includes('الجدول 15'), doc.getElementById('cs_jo_tcol').options.length, (setv(w, 'cs_jo_trench', 'L'), w.eval('csJoTrench()'), doc.getElementById('cs_jo_tcol').options.length)], [true, 3, 4]);
setv(w, 'cs_jo', 'cu_xlpea_clip'); w.eval("csToggle('std')"); ct1 = csj({});
check('a family clipped direct (not in air) ignores the trench option (the trench fields are hidden)', [ct1.kG, doc.querySelector('.cs-jotr').style.display], [1, 'none']);
w = boot('intl'); w.renderCalc('cablesizing'); w.calcResult('cablesizing');
check('other codes: the trench option does not change the NEC result (no trench note)', w.document.getElementById('cs_results').textContent.includes('الخندق المغلق'), false);

// ---------- Jordan: electrical installations code 4/2/7 B and Table 5 (bending radius of non-flexible cables) in the cable sizing ----------
w = boot('jo'); doc = w.document;
const jbend = (k, d) => w.eval('joBend(' + JSON.stringify(k) + ', ' + d + ')');
check('Table 5: unarmoured rubber or PVC 3 up to 10 mm (2 for round stranded single-core cables in a conduit), 4 over 10 up to 25 mm (3), 6 over 25 mm; armoured and mineral insulated 6; no diameter gives nothing', [[10, 10.5, 25, 26].map(d => jbend('non', d)), jbend('arm', 12), jbend('mi', 30), jbend('non', 0), jbend('car', 8)], [[{ f: 3, f2: 2 }, { f: 4, f2: 3 }, { f: 4, f2: 3 }, { f: 6, f2: null }], { f: 6, f2: null }, { f: 6, f2: null }, null, { f: 3, f2: 2 }]);
w.renderCalc('cablesizing'); w.calcResult('cablesizing');
let bl = doc.getElementById('cs_results').textContent;
check('the Jordanian cable sizing shows the bend block: default non-armoured 16 mm: radius 4 x 16 = 64 mm (3 x 16 = 48 mm in a conduit), the 2.5 times rule and the 500 mm / 10 m elbows rule', [bl.includes('جدول 5'), bl.includes('64'), bl.includes('48'), bl.includes('2.5'), bl.includes('4/2/7 B 2')], [true, true, true, true, true]);
setv(w, 'cs_clip_kind', 'arm'); setv(w, 'cs_clip_d', 20); w.calcResult('cablesizing');
check('armoured 20 mm: 6 x 20 = 120 mm; a diameter of 5 mm gives 3 x 5 = 15 mm', [doc.getElementById('cs_results').textContent.includes('120'), (setv(w, 'cs_clip_kind', 'non'), setv(w, 'cs_clip_d', 5), w.calcResult('cablesizing'), doc.getElementById('cs_results').textContent.includes('15'))], [true, true]);
w = boot('intl'); w.renderCalc('cablesizing'); w.calcResult('cablesizing');
check('other codes: no bend block', w.document.getElementById('cs_results').textContent.includes('جدول 5'), false);

// ---------- Jordan: electrical installations code 4/4/1 D 1 and Table 7 (lampholder protection) as a note in the cable sizing ----------
w = boot('jo'); w.renderCalc('cablesizing'); w.calcResult('cablesizing');
const lh = w.document.getElementById('cs_results').textContent;
check('the Jordanian cable sizing quotes Table 7: 6 A for B15 and E14, 16 A for B22, E27 and E40, with the exception of enclosed lampholders', [lh.includes('جدول 7'), lh.includes('B15') && lh.includes('E14') && lh.includes('6 A'), lh.includes('B22') && lh.includes('E27') && lh.includes('E40') && lh.includes('16 A'), lh.includes('غير قابلة للاشتعال')], [true, true, true, true]);
w = boot('sa'); w.renderCalc('cablesizing'); w.calcResult('cablesizing');
check('other codes: no lampholder note', w.document.getElementById('cs_results').textContent.includes('جدول 7'), false);

// ---------- Jordan: electrical installations code 2/2/1 and Tables 1 and 2 (coincidence factors) in the maximum demand ----------
w = boot('jo'); doc = w.document;
const mdd = (c, p, u, cs) => w.eval('mdDemand(' + JSON.stringify(c) + ', ' + JSON.stringify(p) + ', ' + JSON.stringify(u) + ', ' + !!cs + ')');
const rnd = x => Math.round(x * 1000) / 1000;
check('Table 2 rows 1, 2, 3 and 5: lighting 66 / 90 / 75 % of 20 A; heating of a dwelling 10 + 0.5 x 10 = 15 A, of a shop 12 + 0.75 x 8 = 18 A, of a small hotel 12 + 0.8 x 5 + 0.6 x 3 = 17.8 A; cooking 10 + 0.3 x 10 + 5 = 18 A; instantaneous heaters 8 + 8 + 0.25 x 8 = 18 A', [rnd(mdd('light', 'dom', [20])), rnd(mdd('light', 'shop', [20])), rnd(mdd('light', 'hotel', [20])), rnd(mdd('heat', 'dom', [10, 10])), rnd(mdd('heat', 'shop', [12, 5, 3])), rnd(mdd('heat', 'hotel', [12, 5, 3])), rnd(mdd('cook', 'dom', [20], true)), rnd(mdd('whi', 'shop', [8, 8, 8]))], [13.2, 18, 15, 15, 12 + 0.75 * 8, 12 + 0.8 * 5 + 0.6 * 3, 18, 18]);
check('Table 2 row 4 (motors, not lift motors): shop 100 % of the largest + 80 % of the next + 60 % of the rest (10 + 4.8 + 3.6 = 18.4 A for 10, 6, 4, 2); small hotel 100 % + 50 % of the rest (10 + 6 = 16 A); a dwelling has no printed value (no diversity: 22 A)', [rnd(mdd('motor', 'shop', [10, 6, 4, 2])), rnd(mdd('motor', 'hotel', [10, 6, 4, 2])), rnd(mdd('motor', 'dom', [10, 6, 4, 2]))], [18.4, 16, 22]);
w.renderCalc('maxdemand');
const mdrows = (list) => { doc.getElementById('md-rows').innerHTML = ''; list.forEach(x => doc.getElementById('md-rows').insertAdjacentHTML('beforeend', w.eval('mdRowHTML(' + JSON.stringify(x[0]) + ', ' + JSON.stringify(x[1]) + ', ' + x[2] + ', ' + x[3] + ', "")'))); w.calcResult('maxdemand'); return w.eval('calcMaxDemand()'); };
check('the Jordanian form offers the motors and main-room sockets categories and names Tables 1 and 2; the method is the default', [!!doc.querySelector('.md-cat option[value=motor]'), !!doc.querySelector('.md-cat option[value=sockm]'), doc.getElementById('md_mode').value, doc.getElementById('calc-body').textContent.includes('الجدولان 1 و2')], [true, true, 'iet', true]);
setv(w, 'md_prem', 'hotel');
let md1 = mdrows([['مآخذ الغرف الرئيسية', 'sockm', 3, 13], ['مآخذ أخرى', 'sock', 2, 13]]);
check('small hotel: three main-room sockets and two other 13 A points: 13 + 2 x 13 x 0.75 + 2 x 13 x 0.40 = 42.9 A (the other codes take 75 % for all)', [rnd(md1.dem), md1.cats.length, md1.cats[0].n], [42.9, 1, 5]);
setv(w, 'md_prem', 'shop'); md1 = mdrows([['مآخذ', 'sockm', 2, 10], ['مآخذ أخرى', 'sock', 2, 10], ['محرك', 'motor', 3, 5]]);
check('shop: the main-room flag does not matter (13 + ... 10 + 3 x 7.5 = 32.5 A for sockets; motors 5 + 0.8 x 5 + 0.6 x 5 = 12 A); total 44.5 A', [rnd(md1.dem), md1.cats.map(c => c.cat)], [44.5, ['sock', 'motor']]);
check('the results note of the Jordanian method quotes Table 1 (100 W per lampholder, 1.8 x the lamp wattage, 0.5 A for sockets up to 2 A) and Table 2', [doc.getElementById('md_mode').value, doc.getElementById('cf_results') === null, (w.calcResult('maxdemand'), (doc.getElementById('md_results') || doc.getElementById('calc-body')).textContent.includes('100 W لكل ماسك مصباح'))], ['iet', true, true]);
w = boot('intl'); w.renderCalc('maxdemand');
check('other codes: no motors or main-room category and the IET note stays', [!!w.document.querySelector('.md-cat option[value=motor]'), !!w.document.querySelector('.md-cat option[value=sockm]'), (w.calcResult('maxdemand'), (w.document.getElementById('md_results') || w.document.getElementById('calc-body')).textContent.includes('A Practical Guide'))], [false, false, true]);


// ---------- part 42: Jordanian interior lighting code Table 3 (daylight factor and limiting glare index) ----------
w = boot('jo'); doc = w.document; w.renderCalc('lightingcalc');
const dl = (i, o) => { doc.getElementById('lt_jo_dl').value = String(i); ['avg', 'min', 'gi'].forEach(k => { doc.getElementById('lt_jo_dl_' + k).value = o && o[k] != null ? String(o[k]) : ''; }); doc.getElementById('lt_jo_dl_roof').value = o && o.roof ? '1' : '0'; w.calcResult('lightingcalc'); return doc.getElementById('lt_jo_dl_res').textContent.replace(/\s+/g, ' '); };
check('Jordan lighting, Table 3: 31 rows of the table are listed', w.eval('JO_DL.length'), 31);
check('... general office: average 5 %, minimum 2 %, glare index 23 at the desk', (t => ['5.0', '2.0', '23', 'سطح المكتب'].every(s => t.includes(s)))(dl(1)), true);
check('... entrance halls 2 / 0.6 / 24, school assembly halls 1 / 0.3 / 21, sports halls 5 / 3.5 / 21', [0, 3, 8].map(i => w.eval('JO_DL[' + i + '].slice(1, 3).concat(JO_DL[' + i + '][4])').join('/')), ['2/0.6/24', '1/0.3/21', '5/3.5/21']);
check('... pools 5 / 2 / 23 with the glare note, pool surroundings 1 / 0.5, worship hall 5 / 1 / 21, drawing offices 5 / 2.5 / 21', [10, 11, 12, 13].map(i => w.eval('JO_DL[' + i + '].slice(1, 5).join("/")')), ['5/2/سطح ماء البركة/23', '1/0.5/مستوى العمل/23', '5/1/الأرضية/21', '5/2.5/سطح الطاولة/21']);
check('... libraries: reading rooms 5 / 1.5 / 23, shelves have no average (null) and 1.5 on the vertical plane', [14, 15].map(i => w.eval('JO_DL[' + i + '].slice(1, 5).join("/")')), ['5/1.5/سطح الطاولة/23', '/1.5/المستوى الرأسي/23']);
check('... banks 5 / 2 / 23 and 2 / 0.6 / 24; hospitals reception 2 / 0.6 / 24, wards 5 / 1 / 21, pharmacies 5 / 3 / 21 (printed 21 - 23)', [16, 17, 18, 19, 20].map(i => w.eval('JO_DL[' + i + '].filter((x, j) => j > 0 && j !== 3 && j < 5).join("/")')), ['5/2/23', '2/0.6/24', '2/0.6/24', '5/1/21', '5/3/21']);
check('... surgery: waiting 2 / 0.6 / 24, operating rooms 5 / 2.5 / 21, laboratories 5 / 2 / 22; manual exchanges - / 2 / 20; auditoria 1 / 0.6 / 24', [21, 22, 23, 24, 25].map(i => w.eval('JO_DL[' + i + '].filter((x, j) => j > 0 && j !== 3 && j < 5).join("/")')), ['2/0.6/24', '5/2.5/21', '5/2/22', '/2/20', '1/0.6/24']);
check('... corridors and stairs 2 / 0.6 with no glare index; airport reception and customs 2 / 0.6 / 24; circulation areas 2 / 0.6 with none', [26, 27, 28, 29, 30].map(i => w.eval('JO_DL[' + i + '].filter((x, j) => j > 0 && j !== 3 && j < 5).join("/")')), ['2/0.6/', '2/0.6/', '2/0.6/24', '2/0.6/24', '2/0.6/']);
{
  const t1 = dl(1, {avg: 4, min: 2.5, gi: 22});
  check('office with average 4 %, minimum 2.5 %, glare 22: the average fails, the minimum and glare pass', [t1.includes('4.0% مقابل 5.0%: ⚠ لا يحقق'), t1.includes('2.5% مقابل 2.0%: ✔ يحقق'), t1.includes('22 مقابل 23 كحد أقصى: ✔ يحقق')], [true, true, true]);
  const t2 = dl(1, {gi: 25});
  check('glare index 25 against 23 fails', t2.includes('25 مقابل 23 كحد أقصى: ⚠ لا يحقق'), true);
  const t3 = dl(0, {avg: 0.8});
  check('a daylight factor below 1 % asks for supplementary electric lighting', t3.includes('أقل من 1%') && t3.includes('إضاءة كهربائية مكملة'), true);
  const t4 = dl(1, {avg: 4, roof: true});
  check('roof lighting: a daylight factor of 4 % is below 5 % and needs the supplementary system', t4.includes('عن 5% (4/1/2 C): ⚠ لا يحقق') && t4.includes('يلزم نظام إنارة كهربائية مكمل'), true);
  const t5 = dl(1, {avg: 6, roof: true});
  check('roof lighting: 6 % passes', t5.includes('عن 5% (4/1/2 C): ✔ يحقق'), true);
  const t6 = dl(15, {min: 1.5});
  check('shelves have no average: only the minimum is checked, a dash is shown for the average', [t6.includes('1.5% مقابل 1.5%: ✔ يحقق'), t6.includes('–'), t6.includes('إنارة كهربائية إضافية')], [true, true, true]);
  const t7 = dl(26);
  check('corridors: no glare index is defined', t7.includes('لم يُحدد للمرفق'), true);
  check('pharmacy note flags the printed range 21 - 23', dl(20).includes('21 – 23') && dl(20).includes('🔴'), true);
}
check('the other codes carry no daylight panel', ['intl', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('lightingcalc'); return !!x.document.getElementById('lt_jo_dl'); }), [false, false, false]);

// ---------- part 43: Jordanian solid waste code, new calculator `wastechute` (chutes, hoppers, storage rooms, containers, bulky waste, incinerators) ----------
w = boot('jo'); doc = w.document; w.renderCalc('wastechute');
const wsDef = {ws_type: 'high', ws_h: 36, ws_fl: 12, ws_np: 0, ws_cd: 450, ws_sh: '0', ws_cd2: 450, ws_vd: 150, ws_roof: 'par', ws_vh: 400, ws_ang: 90, ws_gs: 3, ws_dd: 20, ws_dsp: 40, ws_hh: 250, ws_hw: 350, ws_hz: 750, ws_hs: 300, ws_hm: 'steel', ws_ht: 2, ws_um: 'mild', ws_ud: 2.6, ws_up: 1.6, ws_ct: 'std', ws_rh: 2.4, ws_fz: 2.4, ws_cl: 100, ws_rim: 150, ws_fth: 100, ws_dr: 100, ws_wf: 1, ws_df: 0.5, ws_sg: 20, ws_cr: 15, ws_cs: 'cyl', ws_cv: 1, ws_cm: 'steel', ws_cb: 3, ws_cw: 1.5, ws_ba: 10, ws_bh: 2.3, ws_id: 0, ws_ipc: 0, ws_iex: 0};
const wsRun = o => { Object.entries(Object.assign({}, wsDef, o || {})).forEach(([k, x]) => setv(w, k, x)); const r = w.eval('calcWasteChute()'); w.calcResult('wastechute'); return r; };
const wsRow = (r, label) => r.rows.find(x => x.label.startsWith(label));
const wsFails = r => r.rows.filter(x => x.ok === false).map(x => x.label.split(' (')[0]);
let wr = wsRun();
check('waste, defaults at the printed limits: no row fails and the results are drawn', [wr.fails, wr.warns, doc.getElementById('ws_results').textContent.includes('أدنى قطر داخلي للمسقط')], [0, 0, true]);
check('chute diameter: 450 mm above four floors or from 30 m, 400 mm below', [[36, 12], [20, 6], [29, 4], [30, 4], [10, 3]].map(a => { const c = w.eval('joWsChuteMin(' + a[1] + ', ' + a[0] + ')'); return c.strict + '/' + c.lenient; }), ['450/450', '450/400', '400/400', '450/450', '400/400']);
wr = wsRun({ws_h: 20, ws_fl: 6, ws_cd: 400});
check('... 400 mm in a six-floor building of 20 m meets only the lower reading (warning, not a failure)', [wsRow(wr, 'القطر الداخلي للمسقط').ok, wr.warns, wr.fails], ['warn', 1, 0]);
check('... 350 mm fails', wsRun({ws_cd: 350}).rows[0].ok, false);
check('vent pipe: 150 mm minimum, otherwise 10 % of the chute diameter (shared vent 10 % of the sum of the two)', [wsRun({ws_cd: 450}).ventMin, wsRun({ws_cd: 1800}).ventMin, wsRun({ws_sh: '1', ws_cd: 450, ws_cd2: 1200}).ventMin, wsRun({ws_sh: '1', ws_cd: 450, ws_cd2: 450}).ventMin], [150, 180, 165, 150]);
check('... a 140 mm vent fails, a 165 mm vent passes for the shared 450 + 1200 case', [wsFails(wsRun({ws_vd: 140})).includes('قطر أنبوبة التهوية'), wsFails(wsRun({ws_sh: '1', ws_cd: 450, ws_cd2: 1200, ws_vd: 165})).includes('قطر أنبوبة التهوية')], [true, false]);
check('vent top: 400 mm above the parapet or a roof tank, 2.5 m on a roof used for recreation', [wsRun({ws_roof: 'tank'}).ventH, wsRun({ws_roof: 'rec'}).ventH, wsFails(wsRun({ws_roof: 'rec', ws_vh: 400})).includes('ارتفاع نهاية أنبوبة التهوية'), wsFails(wsRun({ws_roof: 'rec', ws_vh: 2500})).length], [400, 2500, true, 0]);
check('chute inclination at least 60 degrees: 55 fails, 60 passes', [wsFails(wsRun({ws_ang: 55})).length, wsFails(wsRun({ws_ang: 60})).length], [1, 0]);
wr = wsRun({ws_fl: 12});
check('cleaning gates every three floors at most: 12 floors need 4, spacing 4 fails', [wsRow(wr, 'المسافة بين بوابات التنظيف').note.includes('4 على الأقل'), wsFails(wsRun({ws_gs: 4})).length], [true, 1]);
check('distance to the farthest dwelling 20 m (21 fails); chute spacing 40 m only for low buildings', [wsFails(wsRun({ws_dd: 21})).length, wsFails(wsRun({ws_type: 'low', ws_dsp: 41, ws_fl: 3, ws_h: 9, ws_cd: 400})).includes('المسافة الأفقية بين المساقط المتتالية'), wsRun({ws_type: 'high', ws_dsp: 99}).rows.some(x => x.label.startsWith('المسافة الأفقية بين المساقط'))], [1, true, false]);
check('hopper: inlet 250 x 350 mm, opening at most 750 mm above the floor, 300 mm waterproof surround', [{ws_hh: 260}, {ws_hw: 360}, {ws_hz: 800}, {ws_hs: 250}].map(o => wsFails(wsRun(o))[0]), ['ارتفاع فتحة مدخل القادوس', 'عرض فتحة مدخل القادوس', 'ارتفاع الطرف السفلي لفتحة القادوس عن الأرضية', 'عرض التشطيب غير المنفذ للماء حول الفتحة']);
check('Table 1 (frame): wrought steel 2, cast iron 8, cast aluminium 4 mm', [['steel', 1.9, 2], ['castiron', 7.9, 8], ['castalu', 3.9, 4]].map(a => [wsFails(wsRun({ws_hm: a[0], ws_ht: a[1]})).length, wsFails(wsRun({ws_hm: a[0], ws_ht: a[2]})).length].join('/')), ['1/0', '1/0', '1/0']);
check('Table 2 (receiving unit door / side and bottom plates): mild steel 2.6 / 1.6, cast iron and cast aluminium 6.4 / 4, wrought aluminium 3.3 / 2', [['mild', 2.6, 1.6], ['castiron', 6.4, 4], ['castalu', 6.4, 4], ['wroughtalu', 3.3, 2]].map(a => { const ok = wsFails(wsRun({ws_um: a[0], ws_ud: a[1], ws_up: a[2]})).length, bad1 = wsFails(wsRun({ws_um: a[0], ws_ud: a[1] - 0.1, ws_up: a[2]})).length, bad2 = wsFails(wsRun({ws_um: a[0], ws_ud: a[1], ws_up: a[2] - 0.1})).length; return [ok, bad1, bad2].join('/'); }), ['0/1/1', '0/1/1', '0/1/1', '0/1/1']);
check('storage room: height and floor-to-chute-end 2 m (3 m for large containers); chute end 25 mm below the ceiling; 225 mm to the container rim', [[{ws_rh: 1.9}], [{ws_fz: 1.9}], [{ws_ct: 'big', ws_rh: 2.4}], [{ws_ct: 'big', ws_fz: 2.9, ws_rh: 3.2}], [{ws_cl: 20}], [{ws_rim: 230}]].map(a => wsFails(wsRun(a[0])).length), [1, 1, 2, 1, 1, 1]);
check('... floor 100 mm, drain 100 mm, walls 1 hour, door half an hour, shutter gap 20 mm, carrying distance 15 m', [{ws_fth: 90}, {ws_dr: 75}, {ws_wf: 0.5}, {ws_df: 0.25}, {ws_sg: 25}, {ws_cr: 16}].map(o => wsFails(wsRun(o)).length), [1, 1, 1, 1, 1, 1]);
check('containers: cylindrical 1.0 m3, flat-sided 0.75 m3, steel base 3 / sides 1.5 mm, aluminium 6.5 / 3 mm', [[{ws_cv: 0.9}], [{ws_cs: 'flat', ws_cv: 0.75}], [{ws_cs: 'flat', ws_cv: 0.7}], [{ws_cm: 'alu', ws_cb: 6.5, ws_cw: 3}], [{ws_cm: 'alu', ws_cb: 3, ws_cw: 1.5}], [{ws_cb: 2.9}], [{ws_cw: 1.4}]].map(a => wsFails(wsRun(a[0])).length), [1, 0, 1, 0, 2, 1, 1]);
wr = wsRun({ws_np: 500});
check('bulky waste: 0.3 m3 per person on at least 2.3 m: 500 persons need 150 m3 = 65.2 m2; the 10 m2 entered fails', [wr.bulkVol, +wr.bulkArea.toFixed(1), wsFails(wr)], [150, 65.2, ['مساحة منطقة النفايات الضخمة']]);
check('... 20 persons give 6 m3 but the 10 m2 minimum governs; 100 persons on a 3 m height need 10 m2', [wsRun({ws_np: 20}).bulkArea, +wsRun({ws_np: 100, ws_bh: 3}).bulkArea.toFixed(2), wsFails(wsRun({ws_bh: 2.2})).length], [10, 10, 1]);
check('incinerator: capacity 1.5 x the daily volume, standard sizes 0.5 / 1 / 1.5 / 2 / 2.5 / 3 m3', [0.1, 0.3, 1, 1.4, 2, 2.5].map(x => { const i = wsRun({ws_id: x}).inc; return i.model; }), [0.5, 0.5, 1.5, 2.5, 3, null]);
wr = wsRun({ws_id: 2.5});
check('... above 3 m3 two units or a special design; explosion relief 0.1 m2 per 3 m3 of the primary chamber', [wr.inc.units, +wsRun({ws_id: 2}).inc.relief.toFixed(3), +wsRun({ws_id: 1, ws_ipc: 6}).inc.relief.toFixed(2)], [2, 0.1, 0.2]);
check('... relief 0.09 m2 for a 3 m3 chamber fails, 0.1 passes; a 0.2 m3 chamber is below the 0.25 m3 minimum', [wsFails(wsRun({ws_id: 2, ws_iex: 0.09})).length, wsFails(wsRun({ws_id: 2, ws_iex: 0.1})).length, wsFails(wsRun({ws_id: 0.1, ws_ipc: 0.2})).length], [1, 0, 1]);
check('the system text follows the building type (low-rise: 40 m between chutes; high-rise: chutes; hotel: sorting)', [['low', '40 m'], ['high', 'تُستعمل المساقط'], ['hotel', 'فرز']].map(a => { wsRun({ws_type: a[0]}); return doc.getElementById('ws_results').textContent.includes(a[1]); }), [true, true, true]);
check('the notes quote the printed numbers (0.25 m3, 1200, 1750, 1.2 m, 0.9 m, 225, 15 m, 0.3 m3 per person)', ['0.25 m³', '1200', '1750', '1.2 m', '0.9 m', '15 m', '0.3 m³ لكل شخص'].every(s => doc.getElementById('ws_results').textContent.includes(s)), true);
check('the plumbing card exists and the calculator opens with the other codes too', ['intl', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('wastechute'); x.calcResult('wastechute'); return x.document.getElementById('ws_results').textContent.length > 500; }), [true, true, true]);

// ---------- part 44: Jordanian space requirements code 5/3 - 5/4 (floor area of toilet rooms, graphs 1 and 2) in `sanfix` ----------
w = boot('jo'); doc = w.document; w.renderCalc('sanfix');
const saRun = o => { Object.entries(Object.assign({sf_type: 'office', sf_n: 0, sf_sa_floor: '', sf_sa_cls: 'com', sf_sa_np: '', sf_sa_sex: 'both'}, o || {})).forEach(([k, x]) => setv(w, k, x)); w.calcResult('sanfix'); return w.eval('calcSanFix()').sa; };
check('space code graphs: commercial 100 m2 -> 1.4, 500 -> 7.8, 1000 -> 14.8 m2 of toilet rooms (read from the curve); public gatherings 100 -> 2.4, 600 -> 9.4, 1000 -> 12.1', [[100, 'com'], [500, 'com'], [1000, 'com'], [100, 'asm'], [600, 'asm'], [1000, 'asm']].map(a => +saRun({sf_sa_floor: a[0], sf_sa_cls: a[1]}).g.toFixed(2)), [1.4, 7.8, 14.8, 2.4, 9.4, 12.1]);
check('... linear between the printed points (250 m2 commercial: 4.05) and the last point beyond the graph (1500 m2: 15.2, flagged)', [+saRun({sf_sa_floor: 250}).g.toFixed(2), saRun({sf_sa_floor: 1500}).g, saRun({sf_sa_floor: 1500}).beyond, saRun({sf_sa_floor: 1000}).beyond], [4.05, 15.2, true, false]);
check('men only: 10 % less but not below 2 m2; women only: 10 % more', [saRun({sf_sa_floor: 500, sf_sa_sex: 'men'}).area, saRun({sf_sa_floor: 100, sf_sa_sex: 'men'}).area, saRun({sf_sa_floor: 500, sf_sa_sex: 'women'}).area].map(x => +x.toFixed(2)), [7.02, 2, 8.58]);
check('one water closet per 2.5 m2: 500 m2 commercial holds 3, 600 m2 gathering (9.4 m2) holds 3', [Math.floor(saRun({sf_sa_floor: 500}).wcByArea + 1e-9), Math.floor(saRun({sf_sa_floor: 600, sf_sa_cls: 'asm'}).wcByArea + 1e-9)], [3, 3]);
check('gatherings with a head count: 3 m2 per person (200 persons -> 600 m2 -> 9.4 m2)', [saRun({sf_sa_cls: 'asm', sf_sa_np: 200, sf_sa_floor: 50}).floorA, +saRun({sf_sa_cls: 'asm', sf_sa_np: 200}).g.toFixed(1)], [600, 9.4]);
{
  const s = saRun({sf_type: 'office', sf_n: 90});
  const wc = w.eval('calcSanFix()').rows.reduce((a, r) => a + r.wc, 0);
  check('the water closets of the fixture table need 2.5 m2 each (office of 90 persons)', [s.wcTotal, s.byWc, s.floorA], [wc, 2.5 * wc, 0]);
  check('nothing is shown without a floor area or any fixture', saRun({sf_type: 'office', sf_n: 0, sf_sa_floor: ''}), null);
  saRun({sf_sa_floor: 500});
  const t = doc.getElementById('sf_results').textContent;
  check('the block quotes 2 m2 per toilet room, 1 : 2, 6 hours, 2.100 m and the 0.2 m2 reading note', ['2 m²', '1 : 2', '6 ساعات', '2.100 m', '0.2 m²', '15.2'].filter(x => x !== '15.2').every(x => t.includes(x)), true);
}
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
