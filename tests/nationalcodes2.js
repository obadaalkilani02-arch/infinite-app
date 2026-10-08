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
w = boot('intl'); w.renderCalc('egress');
check('the egress calculator is available with every code', [!!w.document.getElementById('eg_results'), w.document.getElementById('fire-category').querySelectorAll('.calc-card').length], [true, 6]);

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
