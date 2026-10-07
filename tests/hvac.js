// Behavioural checks for the reviewed HVAC calculators.
//   node tests/hvac.js
// U-value expectations come from the office file "معاملات انتقال الحرارة.xlsx".
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
function check(name, got, want, tol) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= (tol ?? 0.5) : got === want;
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
}
const setVal = (id, v) => { doc.getElementById(id).value = String(v); };

// ---------- U-value: assemblies vs office Excel ----------
const OFFICE_U = { ext_wall: 0.720, int_wall: 2.294, wet_wall: 2.277, roof_typ: 1.599, roof_top: 0.661, ext_kitchen: 0.718, basement_wall: 1.567, lightwell_wall: 2.307 };
w.renderCalc('uvalue');
for (const [key, u] of Object.entries(OFFICE_U)) {
  w.loadUvAssembly(key);
  check(`uvalue ${key} = ${u} (office file)`, w.calcUValue().U, u, 0.002);
}
w.loadUvAssembly('ext_wall');
check('uvalue default film values follow ext_wall (Rsi 0.123)', +doc.getElementById('uv_rsi').value, 0.123, 1e-9);
setVal('uv_elemtype', 'roof');
doc.getElementById('uv_elemtype').dispatchEvent(new w.Event('change'));
check('uvalue element type roof -> ISO 6946 Rsi 0.10', +doc.getElementById('uv_rsi').value, 0.10, 1e-9);

// ---------- CHW flow ----------
function chw(tr, dt) {
  w.renderCalc('chwflow');
  setVal('chw_tr', tr); setVal('chw_dt', dt);
  setVal('chw_hxeff', 1); // UI default is 0.9; use direct connection so the 500 rule is exact
  return w.calcChwFlow();
}
let c = chw(100, 10);
check('chw 100 TR @10°F = 240 GPM (500 rule)', c.GPM, 240, 0.1);
// 240 gpm in 5" Sch40 (ID 5.047) @ C=120: 0.2083·(100/120)^1.852·240^1.852/5.047^4.8655 ≈ 1.44 ft/100ft
// (the previous SI-constant formula returned ≈0.014 for the same case)
check('chw 5" @240 gpm H-W ≈ 1.44 ft/100ft', c.hf_per_100ft, 1.44, 0.03);
check('chw 240 gpm @4 ft/s needs 4.95" → 5" pipe', c.selPipe.nom, '5"');
check('chw table lookup in integer gap (4.5 gpm) -> 1"', w.chwTableLookup(4.5).size, '1"');
check('chw table lookup in gap (24.5 gpm) -> 2"', w.chwTableLookup(24.5).size, '2"');
check('chw table lookup 0.5 gpm -> ½"', w.chwTableLookup(0.5).size, '½"');
check('chw table lookup above 13000 -> special design', w.chwTableLookup(20000).size.startsWith('>24'), true);
c = chw(3000, 10);
check('chw 3000 TR: selects a pipe large enough (≥20")', ['20"', '24"'].includes(c.selPipe.nom), true);

// ---------- Cooling tower guards ----------
w.renderCalc('coolingtower');
setVal('ct_t_in', 32); setVal('ct_t_out', 36);
check('cooling tower: T_in ≤ T_out flagged invalid', w.calcCoolingTower().invalid, true);
setVal('ct_t_in', 37); setVal('ct_t_out', 32); setVal('ct_coc', 1);
check('cooling tower: COC ≤ 1 flagged invalid', w.calcCoolingTower().invalid, true);
setVal('ct_coc', 3);
const ct = w.calcCoolingTower();
check('cooling tower default: heat rejection = 200×(1+1/5) = 240 TR', ct.Q_rejection_TR, 240, 0.01);
check('cooling tower default: makeup > evaporation', ct.GPM_makeup > ct.GPM_evap, true);

// ---------- Desert cooler water ----------
w.renderCalc('desertcooler');
const d = w.calcDesertCooler();
// energy balance: 1.10·CFM·(DBT−LDBT)/1050 lb/hr × 0.4536
const expect = 1.10 * d.CFM * (d.dbt - d.LDBT) / 1050 * 0.4536;
check('desert cooler water = energy balance', d.waterLph, expect, 0.01);
check('desert cooler water ≈ 15-25 L/h per 1000 CFM', d.waterLph / (d.CFM / 1000) > 15 && d.waterLph / (d.CFM / 1000) < 25, true);

// ---------- FCU: outdoor-air coil load ----------
// zone 5 TR = 60,000 BTU/h, SHR .75, OA 200 CFM, OA 43°C/14 g/kg, room 24°C/9.3 g/kg:
//   sens = 1.10·200·(19·1.8) = 7,524 · lat = 4840·200·0.0047 = 4,550 → OA 12,074 → coil 72,074 BTU/h = 6.006 TR
//   supply CFM = 45,000/(1.10·20) = 2,045 (OA is part of it) · CHW = 72,074/5000 = 14.4 GPM
w.renderCalc('fcuselection');
let f = w.calcFcuSelection();
check('fcu OA sensible = 7524 BTU/h', f.Q_oa_sens, 7524, 1);
check('fcu OA latent = 4550 BTU/h', f.Q_oa_lat, 4550, 1);
check('fcu coil load = 6.006 TR', f.TR_coil, 6.006, 0.002);
check('fcu supply CFM excludes OA addition (2045)', f.CFM_total, 2045, 1);
check('fcu CHW flow on coil load = 14.4 GPM', f.GPM_chw, 14.4, 0.05);
check('fcu std capacity for 6.006×1.10 = 6.6 TR → 7.5', f.std_cap, 7.5);
setVal('fc_oa', 0);
f = w.calcFcuSelection();
check('fcu OA=0: coil = zone load (5 TR)', f.TR_coil, 5, 1e-9);
setVal('fc_oa', 5000);
check('fcu OA > supply flagged', w.calcFcuSelection().oaExceedsSupply, true);

// ---------- Cooling load quick mode: no double counting by default ----------
w.renderCalc('coolingload');
setVal('cl_area', 200);
let cl = w.calcCoolingLoad();
check('cooling load quick (default): internal gains not added', cl.Q_people + cl.Q_light + cl.Q_equip, 0);
check('cooling load quick (default): Q = area × density × (1+10%) = 99,000', cl.Q_total, 99000, 1);
setVal('cl_quick_int', 'added');
cl = w.calcCoolingLoad();
// office method: 90,000 + people 4,500 + lights 6,824 + equip 5,118 = 106,442 → ×1.10 = 117,086
check('cooling load quick (office method): internal gains added', cl.Q_total, 117086, 2);
setVal('cl_mode', 'detailed');
cl = w.calcCoolingLoad();
check('cooling load detailed mode always adds internal gains', cl.Q_people > 0 && cl.Q_light > 0 && cl.Q_equip > 0, true);

check('no page-level errors', errors.length, 0);
console.log(fail ? `\n${fail} FAILED` : '\nall HVAC checks passed');
process.exit(fail ? 1 : 0);
