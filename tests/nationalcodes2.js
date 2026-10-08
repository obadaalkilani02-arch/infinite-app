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
check('cable sizing: IEC reference and 2.5 % voltage drop', [doc.getElementById('cs_std').value, +doc.getElementById('cs_vdlim').value, +doc.getElementById('cs_amb').value], ['iec', 2.5, 40]);
setv(w, 'cs_len', 250);
cs = w.eval('calcCableSizing()');
check('... 250 m: limit stays 2.5 %', cs.vdLimEff, 2.5, 1e-9);

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
