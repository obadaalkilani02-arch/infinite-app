// NFPA codes added from the library folder `standars` (parts 87 onward): NFPA 54 National Fuel Gas Code (fuel gas pipe sizing, combustion air), NFPA 110 / NFPA 99 items.
//   node tests/nfpacodes.js
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
  live.push(w); while (live.length > 4) { try { live.shift().close(); } catch (e) {} }
  return w;
}
let fail = 0;
function check(name, got, want, tol) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= (tol ?? 0.01) : JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
}
const setv = (w, id, val) => { w.document.getElementById(id).value = String(val); };

let w, doc;

// ---------- part 87: NFPA 54-2018 fuel gas piping (`gaspipe`: tables 6.2.1(a-x) and 6.3.1(a-m), equations 6.4.1 / 6.4.2, Annex B) ----------
{
w = boot('intl'); doc = w.document;
const gp = o => w.eval('gpRun(' + JSON.stringify(Object.assign({tbl: '6.2.1(b)', meth: 'longest', mode: 'table', ldu: 'kbtu', lnu: 'ft', hv: 1000, sg: 0.6, sgm: 'auto', rows: []}, o)) + ')');
const rw = (name, load, len, f) => Object.assign({name, load, len, e90: 0, e45: 0, tee: 0, gv: 0}, f || {});
const labs = r => r.rows.map(x => x.lab);
check('37 capacity tables embedded: 24 for natural gas 6.2.1(a-x) and 13 for propane 6.3.1(a-m)', [w.eval('GP_T.length'), w.eval('GP_T.filter(t => t.g === "ng").length'), w.eval('GP_T.filter(t => t.g === "lp").length')], [37, 24, 13]);
check('Table 6.2.1(a), 10 ft, 1 in = 514 cfh; 6.2.1(b), 10 ft, 1/2 in = 172 cfh; 6.2.1(c), 10 ft, 1/2 in = 454 cfh; 6.2.1(j), 50 ft, K&L 3/4 = 168 cfh', [['6.2.1(a)', 10, 2], ['6.2.1(b)', 10, 0], ['6.2.1(c)', 10, 0], ['6.2.1(j)', 50, 4]].map(a => w.eval('GP_T.find(t => t.id === "' + a[0] + '").r.find(r => r[0] === ' + a[1] + ')[' + (a[2] + 1) + ']')), [514, 172, 454, 168]);
// Annex B.7.1, example 1 (longest length method): Table 6.2.1(b), 60 ft, gas 0.60, 1000 Btu/ft3
let r = gp({rows: [rw('A', 35, 60), rw('B', 75, 60), rw('1', 110, 60), rw('2', 135, 60), rw('3', 245, 60)]});
check('B.7.1 example 1: 60 ft row of 6.2.1(b): outlet A 35 cfh -> 1/2 in, outlet B 75 cfh -> 3/4 in, section 1 (110 cfh) -> 3/4 in, section 2 (135 cfh) -> 3/4 in, section 3 (245 cfh) -> 1 in', labs(r), ['1/2"', '3/4"', '3/4"', '3/4"', '1"']);
check('... the row is 60 ft and the capacity of the 1 in is 245 or more', [r.rows[4].rowFt, r.rows[4].cap >= 245], [60, true]);
check('longest-length method: every section uses the single longest run (60 ft), the branch-length method each own run: 10 ft for outlet A -> still 1/2 in, 20 ft -> 1/2 in', [r.lmax, labs(gp({meth: 'branch', rows: [rw('A', 35, 10), rw('B', 75, 20), rw('1', 110, 60)]}))], [60, ['1/2"', '1/2"', '3/4"']]);
// B.7.3, example 3: semirigid copper tubing 6.2.1(j) 1.0 in. w.c., branch length method
r = gp({tbl: '6.2.1(j)', meth: 'branch', rows: [rw('A', 220, 50), rw('B', 75, 30), rw('C', 30, 50), rw('D', 35, 30), rw('E', 80, 30)]});
check('B.7.3 example 3 (6.2.1(j)): section A 220 cfh at 50 ft -> 1 in, B 75 cfh at 30 ft -> 1/2 in, C 30 cfh at 50 ft -> 3/8 in, D 35 cfh at 30 ft -> 3/8 in, E 80 cfh at 30 ft -> 1/2 in', labs(r), ['K&L 1"', 'K&L 1/2"', 'K&L 3/8"', 'K&L 3/8"', 'K&L 1/2"']);
// B.7.2 / B.7.4 CSST (EHD sizes)
r = gp({tbl: '6.2.1(r)', rows: [rw('A', 110, 100)]});
check('B.7.2 example 2: Table 6.2.1(r), 100 ft, 110 cfh -> EHD 18 with a capacity of 189 cfh', [r.rows[0].lab, r.rows[0].cap], ['EHD 18', 189]);
check('B.7.2: Table 6.2.1(p), 60 cfh at 15 ft -> EHD 13; 30 cfh at 10 ft -> EHD 13; 20 cfh at 25 ft -> EHD 13', [[60, 15], [30, 10], [20, 25]].map(a => gp({tbl: '6.2.1(p)', rows: [rw('x', a[0], a[1])]}).rows[0].lab), ['EHD 13', 'EHD 13', 'EHD 13']);
check('B.7.4 example 4: Table 6.2.1(o), 40 ft, 40 cfh (barbecue) -> EHD 18', [gp({tbl: '6.2.1(o)', rows: [rw('G', 40, 40)]}).rows[0].lab], ['EHD 18']);
// unit conversions
r = gp({ldu: 'kw', lnu: 'm', rows: [rw('x', 10, 18.288)]});
check('10 kW = 34.12 kBtu/h = 34.12 cfh of natural gas at 1000 Btu/ft3; 18.288 m = 60 ft', [+r.rows[0].kbtu.toFixed(2), +r.rows[0].cfh.toFixed(2), +r.rows[0].L0.toFixed(2)], [34.12, 34.12, 60], 0.01);
check('a lower heating value of 900 Btu/ft3 needs more gas: 100 kBtu/h = 111.1 cfh', [+gp({hv: 900, rows: [rw('x', 100, 20)]}).rows[0].cfh.toFixed(1)], [111.1], 0.05);
// specific gravity (Table B.3.4)
r = gp({sg: 1.0, rows: [rw('x', 245, 60)]});
check('gas of specific gravity 1.00 (multiplier 0.78, applied above 0.70): the 1 in of the 60 ft row falls from 245 to 191 cfh, so 245 cfh now needs 1-1/4 in', [r.mult, r.sg, r.rows[0].lab], [0.78, 1, '1-1/4"']);
check('the next higher printed gravity is used: 0.72 -> 0.75 -> 0.90; and 0.65 is below the 0.70 threshold, so no multiplier unless the AHJ requires it', [gp({sg: 0.72, rows: [rw('x', 50, 20)]}).mult, gp({sg: 0.65, rows: [rw('x', 50, 20)]}).mult, gp({sg: 0.65, sgm: 'always', rows: [rw('x', 50, 20)]}).mult], [0.9, 1, 0.96]);
// fittings
r = gp({tbl: '6.2.1(b)', rows: [rw('x', 245, 60, {e90: 4})]});
check('four 90-degree elbows on the 1 in section: 4 x 30 x 1.049 / 12 = 10.5 ft added, 60 -> 70.5 ft falls in the 80 ft row where 1 in carries less than 245 cfh, so the size rises to 1-1/4 in and the allowance is re-evaluated at 1.38 in: 13.8 ft, 73.8 ft, still the 80 ft row', [r.rows[0].lab, +r.rows[0].leq.toFixed(1), r.rows[0].rowFt], ['1-1/4"', 13.8, 80]);
check('fewer than four fittings add nothing (3 elbows); CSST gets no equivalent length', [gp({rows: [rw('x', 245, 60, {e90: 3})]}).rows[0].leq, gp({tbl: '6.2.1(p)', rows: [rw('x', 100, 20, {e90: 6})]}).rows[0].leq], [0, 0]);
check('Table B.3.2: 90-degree elbow L = 30 d / 12: 1.55 ft in 1/2 in (d = 0.622), 7.67 ft in 3 in (d = 3.068); tee 67 d / 12 = 3.47 ft and gate valve 7 d / 12 = 0.36 ft in 1/2 in; the allowance function gives the same for four 90-degree elbows in 1/2 in: 6.22 ft', [+(30 * 0.622 / 12).toFixed(2), +(30 * 3.068 / 12).toFixed(2), +(67 * 0.622 / 12).toFixed(2), +(7 * 0.622 / 12).toFixed(2), +w.eval('gpLeq(GP_T[1], 0, {e90: 4, e45: 0, tee: 0, gv: 0})').toFixed(2)], [1.55, 7.67, 3.47, 0.36, 6.22]);
// equations 6.4.1 / 6.4.2
check('equation 6.4.1 reproduces the printed tables within 1 %: 6.2.1(a) 1 in at 10 ft (0.3 in w.c.): 514 cfh; 6.2.1(b) 1/2 in at 10 ft: 172', [w.eval('gpEq(GP_T.find(t => t.id === "6.2.1(a)"), 2, 10)') / 514, w.eval('gpEq(GP_T.find(t => t.id === "6.2.1(b)"), 0, 10)') / 172].map(x => Math.abs(x - 1) < 0.01), [true, true]);
check('equation 6.4.2 (2 psi, 1 psi drop): 6.2.1(f) 1/2 in at 10 ft = 2350 within 3 %', w.eval('gpEq(GP_T.find(t => t.id === "6.2.1(f)"), 0, 10)') / 2350, 1.0, 0.03);
check('propane (6.3.1(a), 10 psi, 1 psi drop): the equation gives thousand Btu/h; 1/2 in at 10 ft = 3320 within 3 %', w.eval('gpEq(GP_T.find(t => t.id === "6.3.1(a)"), 0, 10)') / 3320, 1.0, 0.03);
r = gp({tbl: '6.3.1(a)', rows: [rw('x', 3000, 10)]});
check('propane: a load is entered in kBtu/h, 6.3.1(a) 10 ft, 3000 kBtu/h -> 1/2 in (3320)', [r.rows[0].lab, r.rows[0].cap, r.mult], ['1/2"', 3320, 1]);
r = gp({tbl: '6.2.1(b)', mode: 'eq', rows: [rw('x', 245, 60)]});
check('equation mode: the smallest size whose equation capacity at the exact length covers 245 cfh (1 in carries ~ 245 at 60 ft)', [r.rows[0].lab, r.rows[0].rowFt, r.rows[0].eq > 240], ['1"', 60, true]);
// out of range / too big
r = gp({tbl: '6.2.1(o)', rows: [rw('x', 40, 400)]});
check('Table 6.2.1(o) ends at 300 ft; 400 ft is out of range; the equation cannot be used for CSST (EHD)', [r.rows[0].status, r.maxFt, gp({tbl: '6.2.1(o)', mode: 'eq', rows: [rw('x', 40, 40)]}).rows[0].fb], ['range', 300, true]);
check('a load larger than the largest size gives "big" instead of a wrong answer', [gp({tbl: '6.2.1(b)', rows: [rw('x', 5000000, 60)]}).rows[0].status], ['big']);
// page
w.renderCalc('gaspipe'); w.calcResult('gaspipe');
let tt = doc.getElementById('gp_results').textContent;
check('the page opens with three rows and the 🔴 note; Table 6.2.1(b) is the default', [doc.querySelectorAll('#gp-tbody tr').length, tt.includes('6.2.1(b)'), tt.includes('🔴')], [3, true, true]);
w.gpAddRow();
check('adding a section adds a row and re-renders', [doc.querySelectorAll('#gp-tbody tr').length, doc.querySelectorAll('#gp_results table tr').length], [4, 5]);
setv(w, 'gp_tbl', '6.3.1(a)'); w.calcResult('gaspipe');
check('switching to a propane table shows kBtu/h and hides the gravity multiplier', [doc.getElementById('gp_results').textContent.includes('kBtu/h'), doc.getElementById('gp_results').textContent.includes('معامل الكثافة النوعية')], [true, false]);
check('other reference codes open it too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('gaspipe'); x.calcResult('gaspipe'); return x.document.getElementById('gp_results').textContent.length > 300; }), [true, true, true]);
}

// ---------- part 88: NFPA 54-2018 combustion and ventilation air (`combair`: 9.3, annexes H and I) ----------
{
w = boot('intl'); doc = w.document;
const KW = 3412.142, FT3 = 0.0283168;
const ca = o => w.eval('caCalc(' + JSON.stringify(Object.assign({oth: 40000 / KW, fan: 100000 / KW, method: 'std', ach: 0.5, vroom: 3600 * FT3, vcomm: 0, story: 'same', vc: 0, frac: 0.75}, o)) + ')');
let r = ca({vroom: 8000 * FT3});
check('Annex H.1 (100,000 + 40,000 Btu/h, standard method): total 140,000 Btu/h, required 50 ft3 per 1000 Btu/h = 7000 ft3 (198.2 m3); the 25 x 40 x 8 ft basement of 8000 ft3 is enough, no outdoor openings', [Math.round(r.bt), +(r.vReq / FT3).toFixed(0), +r.vReq.toFixed(1), r.ok], [140000, 7000, 198.2, true]);
r = ca({method: 'inf', ach: 0.65, vroom: 5600 * FT3});
check('Annex H.2 (known rate 0.65 ACH, capped at 0.60): fan-assisted 15 ft3 / 0.6 x 100 = 2500 ft3 plus 21 / 0.6 x 40 = 1400 ft3 = 3900 ft3; the 5600 ft3 basement is enough', [+(r.vInf / FT3).toFixed(0), r.achUsed, r.capped, r.ok], [3900, 0.6, true, true]);
r = ca({method: 'inf', ach: 0.3, vroom: 5600 * FT3});
check('Annex H.3 (0.30 ACH): 15 / 0.3 x 100 = 5000 ft3 plus 21 / 0.3 x 40 = 2800 ft3 = 7800 ft3 against 5600 ft3 available: outdoor air needed (ratio 0.72, reduction 0.28)', [+(r.vInf / FT3).toFixed(0), r.ok, +r.ratio.toFixed(2), +r.red.toFixed(2)], [7800, false, 0.72, 0.28]);
check('the lower limits follow from the 0.60 cap: 35 ft3 per 1000 Btu/h for appliances without a fan (1400 ft3 for 40,000) and 25 ft3 for fan-assisted (2500 ft3 for 100,000); higher infiltration rates give the same', [+(ca({method: 'inf', ach: 0.9, fan: 0}).vInf / FT3).toFixed(0), +(ca({method: 'inf', ach: 0.9, oth: 0}).vInf / FT3).toFixed(0)], [1400, 2500]);
r = ca({});
check('Annex I.1: 3600 ft3 of 7000 ft3 gives the ratio 0.51 and the reduction factor 0.49; the single outdoor opening 140,000 / 3000 = 46.7 in2 (301 cm2) is reduced to 22.7 in2 (146 cm2) (the annex rounds to 23 in2)', [+r.ratio.toFixed(2), +r.red.toFixed(2), +(r.one / 6.4516).toFixed(1), +(r.one * r.red).toFixed(0), +(r.one * r.red / 6.4516).toFixed(1)], [0.51, 0.49, 46.7, 146, 22.7], 0.06);
check('two openings (direct or vertical duct) 1 in2 / 4000 Btu/h = 35 in2 (226 cm2) each, horizontal ducts 1 in2 / 2000 Btu/h = 70 in2 each; 550 and 1100 mm2/kW (41.03 kW x 550 = 225.7 cm2)', [+(r.two / 6.4516).toFixed(1), +(r.hor / 6.4516).toFixed(1), +r.two.toFixed(1), +(41.03 * 550 / 100).toFixed(1)], [35, 70, 225.8, 225.7], 0.15);
check('mechanical supply 0.35 ft3/min per 1000 Btu/h = 49 ft3/min = 1.388 m3/min (0.034 m3/min/kW x 41.03 kW = 1.395)', [+r.mech.toFixed(3), +(41.03 * 0.034).toFixed(3)], [1.388, 1.395]);
check('one opening: not less than the vent connectors (400 cm2 > 301 cm2 governs)', [+ca({vc: 400}).one.toFixed(0), +ca({vc: 100}).one.toFixed(0)], [400, 301]);
check('communicating spaces: same story each opening 1 in2 per 1000 Btu/h = 140 in2 (903 cm2) and not less than 100 in2 (0.06 m2); different stories 2 in2 per 1000 Btu/h = 280 in2 (1806 cm2) in all', [+ca({}).sameEach.toFixed(0), +ca({oth: 5, fan: 0}).sameEach.toFixed(0), +ca({}).diffTotal.toFixed(0)], [903, 645, 1806]);
w.renderCalc('combair'); setv(w, 'ca_fan', 100000 / KW); setv(w, 'ca_oth', 40000 / KW); setv(w, 'ca_vr', 3600 * FT3); w.calcResult('combair');
let tt = doc.getElementById('ca_results').textContent;
check('the page opens with the Annex I.1 data: 7000 ft3, ratio 0.51, 22.7 in2, the mechanical rate and the 🔴 note', [tt.includes('7000'), tt.includes('0.51'), tt.includes('22.7'), tt.includes('1.39 m³/min'), tt.includes('🔴')], [true, true, true, true, true]);
setv(w, 'ca_vr', 250); w.calcResult('combair');
check('a room of 250 m3 (more than 198 m3) needs no outdoor openings', [doc.getElementById('ca_results').textContent.includes('كافٍ'), doc.getElementById('ca_results').querySelectorAll('table').length], [true, 0]);
check('other reference codes open it too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('combair'); x.calcResult('combair'); return x.document.getElementById('ca_results').textContent.length > 300; }), [true, true, true]);
}

// ---------- part 88: NFPA 110-2005 emergency and standby power (`epss`: classes, fuel, starting batteries, testing) ----------
{
w = boot('intl'); doc = w.document;
const ep = o => w.eval('epCalc(' + JSON.stringify(Object.assign({level: 1, type: '10', cls: '48', hx: 96, seis: false, fuel: 'liquid', kw: 250, cons: 0, crank: 'cycle', icr: 600, ah: 0, eta: 0.8, dr: 1, bl: 0}, o)) + ')');
let r = ep({});
check('Class 48 at 250 kW with the estimated 0.27 L/kWh = 67.5 L/h: fuel for the class 67.5 x 48 = 3240 L, low-fuel switch at 3240 L, main tank at least 133 % = 4309 L', [+r.cons.toFixed(2), r.hours, +r.fuelClass.toFixed(1), +r.tank.toFixed(0), +r.sensor.toFixed(1)], [67.5, 48, 3240, 4309, 3240]);
check('engine data: 80 L/h for Class 6 gives 480 L and a tank of 638.4 L; Class 0.083 (5 min) 80 x 0.083 = 6.6 L', [+ep({cons: 80, cls: '6'}).fuelClass.toFixed(1), +ep({cons: 80, cls: '6'}).tank.toFixed(1), +ep({cons: 80, cls: '0.083'}).fuelClass.toFixed(1)], [480, 638.4, 6.6]);
check('5.1.2: seismic design category C-F needs Level 1 with at least 96 h (Class 6 becomes 96 h, 67.5 x 96 = 6480 L); Class X of 120 h stays 120 h; Level 2 is not affected', [ep({cls: '6', seis: true}).hours, +ep({cls: '6', seis: true}).fuelClass.toFixed(1), ep({cls: 'x', hx: 120, seis: true}).hours, ep({cls: '6', seis: true, level: 2}).hours], [96, 6480, 120, 6]);
check('7.9.5: an integral diesel tank inside the building or on the roof is limited to 2498 L: 71.8 L (Class 2 at 100 kW) passes, 4309 L (Class 48 at 250 kW) does not; gas from the network has no tank', [ep({cls: '2', kw: 100}).integral, r.integral, ep({fuel: 'gas'}).fuelClass], [true, false, null]);
check('Table 5.6.4.2: limiter 75 s for 3 cycles (15 s crank + 15 s rest) or 45 s continuous; two periods draw current for 2 x 45 = 90 s in both cases; 600 A x 90 s / 3600 = 15 Ah', [r.tLimiter, ep({crank: 'cont'}).tLimiter, r.tCrank, ep({crank: 'cont'}).tCrank, +r.ah.toFixed(2)], [75, 45, 90, 90, 15]);
check('recharge in 24 h (Level 1) or 36 h (Level 2): 200 Ah installed at 0.8 efficiency needs 10.4 A (Level 1) or 6.94 A (Level 2); without an installed capacity the drawn 15 Ah gives 0.78 A', [+ep({ah: 200}).ich.toFixed(2), +ep({ah: 200, level: 2}).ich.toFixed(2), +r.ich.toFixed(2)], [10.42, 6.94, 0.78]);
check('8.4.2 monthly test at 30 % of 250 kW = 75 kW for 30 min; 8.4.2.3 annual 25 / 50 / 75 % = 62.5 / 125 / 187.5 kW for 30 / 30 / 60 min', [r.monthly, r.annual], [75, [62.5, 125, 187.5]]);
check('7.13.6 acceptance test: a 2 h full-load test at 250 kW x 0.9 derating = 225 kW; with 100 kW of building load the load bank is 125 kW, with 300 kW none; fuel for the two hours 2 x 67.5 = 135 L', [ep({dr: 0.9}).accept, ep({dr: 0.9, bl: 100}).bank, ep({dr: 0.9, bl: 300}).bank, +ep({}).accFuel.toFixed(1), ep({fuel: 'gas'}).accFuel], [225, 125, 0, 135, null]);
w.renderCalc('epss'); w.calcResult('epss');
let tt = doc.getElementById('ep_results').textContent;
check('the page opens with the Class 48 data: 3240 L, 4309 L, 75 kW, the Level 1 list and the 🔴 note', [tt.includes('3240'), tt.includes('4309'), tt.includes('75.0'), tt.includes('المستوى 1'), tt.includes('🔴')], [true, true, true, true, true]);
setv(w, 'ep_fu', 'gas'); w.calcResult('epss');
check('gas from the network shows no tank', [doc.getElementById('ep_results').textContent.includes('غاز من الشبكة'), doc.getElementById('ep_results').textContent.includes('133%')], [true, false]);
check('other reference codes open it too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('epss'); x.calcResult('epss'); return x.document.getElementById('ep_results').textContent.length > 300; }), [true, true, true]);
}

// ---------- part 88: NFPA 54-2018 Category I vent sizing, single appliance (`ventsize`: tables 13.1(a-f), rules 13.1.1 - 13.1.18) ----------
{
w = boot('intl'); doc = w.document;
const vs = o => w.eval('vsRun(' + JSON.stringify(Object.assign({tbl: '13.1(a)', app: 'nat', kbtu: 100, kmin: 0, H: 10, L: 5, n45: 0, n90: 0, out: 0, zone: -1, area: 12}, o)) + ')');
const cell = (tb, H, L, i, k) => w.eval('VS_T["' + tb + '"].r.find(r => r[0] === ' + H + ' && r[1] === ' + L + ')[' + (2 + i * (tb === '13.1(e)' ? 1 : 3) + k) + ']');
check('data: 13.1(a) H 10 ft, L 5 ft, 5 in vent: FAN Min 41, FAN Max 187, NAT Max 124; 13.1(b) 6 ft, L 0, 3 in: 38 / 77 / 45; 13.1(e) 10 ft, L 5: 104 for 5 in; 13.1(a) 100 ft, L 50, 24 in: 752 / 13,354 / 8100', [cell('13.1(a)', 10, 5, 2, 0), cell('13.1(a)', 10, 5, 2, 1), cell('13.1(a)', 10, 5, 2, 2), cell('13.1(b)', 6, 0, 0, 0), cell('13.1(b)', 6, 0, 0, 1), cell('13.1(b)', 6, 0, 0, 2), cell('13.1(e)', 10, 5, 2, 0), cell('13.1(a)', 100, 50, 14, 0), cell('13.1(a)', 100, 50, 14, 1), cell('13.1(a)', 100, 50, 14, 2)], [41, 187, 124, 38, 77, 45, 104, 752, 13354, 8100]);
check('data: 45 rows in (a) and (b), 29 in (c) and (d), all with a FAN Min / FAN Max / NAT Max triple per diameter; FAN Max never below NAT Max and the capacities rise with the diameter', [['13.1(a)', 'VS_T["13.1(a)"].r.length'], ['13.1(b)', 'VS_T["13.1(b)"].r.length'], ['13.1(c)', 'VS_T["13.1(c)"].r.length'], ['13.1(d)', 'VS_T["13.1(d)"].r.length']].map(a => w.eval(a[1])).concat([w.eval(`['13.1(a)', '13.1(b)', '13.1(c)', '13.1(d)'].every(k => VS_T[k].r.every(r => r.length === 2 + VS_T[k].d.length * 3 && VS_T[k].d.every((d, i) => { const mx = r[2 + i * 3 + 1], nt = r[2 + i * 3 + 2]; return mx == null || nt == null || mx >= nt; })))`), w.eval(`['13.1(a)', '13.1(b)'].every(k => VS_T[k].r.every(r => VS_T[k].d.every((d, i) => i === 0 || r[2 + i * 3 + 2] == null || r[2 + (i - 1) * 3 + 2] == null || r[2 + i * 3 + 2] >= r[2 + (i - 1) * 3 + 2])))`)]), [45, 45, 29, 29, true, true]);
let r = vs({});
check('draft-hood appliance of 100 kBtu/h on a 10 ft vent with a 5 ft lateral (13.1(a)): NAT Max 40 / 77 / 124 for 3 / 4 / 5 in, so 5 in; a fan-assisted one: FAN Max 57 / 113 for 3 / 4 in and FAN Min 32 for 4 in, so 4 in', [r.d, vs({app: 'fan'}).d, r.sizes.map(s => Math.round(s.max)).slice(0, 3)], [5, 4, [40, 77, 124]]);
check('interpolation (13.1.15): H = 12.5 ft between 10 ft (124) and 15 ft (142) gives 133 for the 5 in vent; L = 7.5 ft between 5 ft (124) and 10 ft (115) gives 119.5', [+vs({H: 12.5}).sizes[2].max.toFixed(1), +vs({L: 7.5}).sizes[2].max.toFixed(1)], [133, 119.5]);
check('13.1.3: two additional 90-degree elbows cut the maximum by 20 % (124 -> 99.2, so 100 kBtu/h needs 6 in); one 45-degree elbow by 5 %', [+vs({n90: 2}).sizes[2].max.toFixed(1), vs({n90: 2}).d, +vs({n45: 1}).sizes[2].max.toFixed(1)], [99.2, 6, 117.8]);
check('13.1.4: zero lateral is the straight vertical row (10 ft: 3 in NAT 53, FAN 0 / 88 / 53); a lateral under 2 ft uses the first lateral row; above the table lateral (10 ft at H = 10) or beyond the height range there is no answer and no extrapolation', [vs({L: 0}).sizes[0].max, vs({L: 1, H: 6}).sizes[0].max, vs({L: 12}).avail, vs({H: 120}).avail, vs({H: 5}).tooLow], [53, 36, false, false, true]);
check('NA entries: 13.1(a) at 100 ft and 2 ft lateral has no 3 in (NA); the 4 in has FAN Min 10 (not NA) and NAT 194 -> fan-assisted 150 kBtu/h picks 4 in', [vs({H: 100, L: 2}).sizes[0].why, vs({H: 100, L: 2, app: 'fan', kbtu: 150}).d], ['na', 4]);
check('13.1(e) single-wall pipe (draft hood only): 10 ft, 5 ft lateral: 3 / 4 / 5 / 6 in carry 32 / 61 / 104 / 153, so 100 kBtu/h takes 5 in; a fan-assisted appliance is treated as draft hood', [vs({tbl: '13.1(e)'}).d, vs({tbl: '13.1(e)'}).sizes.map(s => Math.round(s.max)).slice(0, 4)], [5, [32, 61, 104, 153]]);
r = vs({tbl: '13.1(c)', kbtu: 60});
check('13.1(c) masonry chimney with a Type B connector, 10 ft, 5 ft lateral, 60 kBtu/h: 3 / 4 / 5 in carry 28 / 57 / 96, so the 5 in connector and a chimney of at least 28 in2 (181 cm2)', [r.d, r.minArea, r.sizes.map(s => Math.round(s.max)).slice(0, 3)], [5, 28, [28, 57, 96]]);
check('13.1(f) exterior masonry chimney (13.1.11): at 17 to 26 F and 63 in2 the minimum input at 10 ft is 245 kBtu/h: 200 fails, 300 passes; below 5 F the table says not recommended; NA when the table has none', [vs({tbl: '13.1(c)', kbtu: 200, zone: 2, area: 63}).ext.min, vs({tbl: '13.1(c)', kbtu: 200, zone: 2, area: 63}).ext.ok, vs({tbl: '13.1(c)', kbtu: 300, zone: 2, area: 63}).ext.ok, vs({tbl: '13.1(c)', zone: 5}).ext.notrec, vs({tbl: '13.1(c)', zone: 3, H: 6}).ext.min], [245, false, true, true, null]);
check('13.1.2 downsizing for a draft hood outlet of 6 in at H = 10 ft: 5 in (one size down, 124 kBtu/h) is allowed; 3 in or 4 in are two or more sizes down and are not; at H = 8 ft downsizing is not allowed, so the 6 in is used', [vs({out: 6}).d, vs({out: 6}).sizes[1].why, vs({out: 6, H: 8}).d, vs({out: 6, H: 8}).sizes[2].why], [5, 'down', 6, 'down']);
check('13.1.2: an outlet of 8 in is reduced at most one size (7 in), so 100 kBtu/h picks 7 in; a draft hood outlet of 4 in or less is not reduced; for fan-assisted the maximum is cut by 10 %: 113 x 0.9 = 101.7 on a 4 in vent under a 5 in collar (105 kBtu/h then needs 5 in)', [vs({out: 8}).d, vs({out: 4}).sizes[1].why, vs({app: 'fan', out: 5}).d, vs({app: 'fan', out: 5, kbtu: 105}).d, +vs({app: 'fan', out: 5}).sizes[1].max.toFixed(1)], [7, 'big', 4, 5, 101.7]);
r = vs({out: 3, H: 20, L: 10, kbtu: 500});
check('13.1.9 the seven-times rule: with a 3 in outlet (7.07 in2) a 9 in vent (63.6 in2 > 49.5) is refused even though its capacity covers 500 kBtu/h', [r.sizes[6].why, r.sizes[6].ok, r.pick], ['seven', false, -1]);
check('13.1.6 modulating appliance: FAN Min must be below the lowest rating; 100 kBtu/h with a minimum of 20 has no 4 in (Min 32) and the whole row fails, with a minimum of 50 the 4 in works', [vs({app: 'fan', kmin: 20}).pick, vs({app: 'fan', kmin: 20}).sizes[1].why, vs({app: 'fan', kmin: 50}).d], [-1, 'small', 4]);
check('kW to kBtu/h in the page reader: 100 kW = 341.2 kBtu/h; 18 m / 6 m become 59.1 ft / 19.7 ft', [+(100 * 3.412142).toFixed(1), +(18 / 0.3048).toFixed(1), +(6 / 0.3048).toFixed(1)], [341.2, 59.1, 19.7]);
w.renderCalc('ventsize'); w.calcResult('ventsize');
let tt = doc.getElementById('vs_results').textContent;
check('the page opens with 100 kW (341 kBtu/h), 6 m height and 2 m lateral, a table of the sizes and the 🔴 note', [tt.includes('341'), tt.includes('13.1(a)'), doc.querySelectorAll('#vs_results table tr').length > 10, tt.includes('🔴')], [true, true, true, true]);
setv(w, 'vs_t', '13.1(e)'); setv(w, 'vs_a', 'fan'); w.calcResult('ventsize');
check('single-wall pipe with a fan-assisted selection shows the draft-hood-only note', [doc.getElementById('vs_results').textContent.includes('13.1(e)')], [true]);
check('other reference codes open it too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('ventsize'); x.calcResult('ventsize'); return x.document.getElementById('vs_results').textContent.length > 300; }), [true, true, true]);
}
// ---------- part 89: NFPA 99-2002 medical gas piping (`medgas`: 5.1.8 - 5.1.12) ----------
{
w = boot('intl'); doc = w.document;
const mg = o => w.eval('mgCalc(' + JSON.stringify(Object.assign({gas: 'o2', p: 350, p1: null, v1: null, t1: null, t2: null, c1: null, dp: null, co: null, co2: null, hc: null, hal: null}, o)) + ')');
let r = mg({});
check('oxygen at 350 kPa: alarms at 280 / 420 kPa (-20 % / +20 %), initial test max(1.5 x 350, 1035) = 1035 kPa, 24 h standing test 420 kPa, verification at 350 kPa, cross-connection 345 kPa', [r.T.alarmLo, r.T.alarmHi, r.T.initial, r.T.standing, r.T.verify, r.T.cross, r.T.alt], [280, 420, 1035, 420, 350, 345, 345]);
check('the analog gauge scale puts the normal reading in the middle 50 % (350 / 0.75 = 467 to 350 / 0.25 = 1400 kPa) and a digital one stops at 2 x 350 = 700 kPa', [+r.T.gaugeMin.toFixed(1), r.T.gaugeMax, r.T.digital], [466.7, 1400, 700]);
check('1.5 x the working pressure governs above 690 kPa: 800 kPa -> 1200 kPa; nitrogen at 1138 kPa (165 psi) -> 1707 kPa and a standing test of 1365.6 kPa; the standard range 345 - 380 kPa (nitrogen 1100 - 1275)', [mg({p: 800}).T.initial, mg({gas: 'n2', p: 1138}).T.initial, +mg({gas: 'n2', p: 1138}).T.standing.toFixed(1), mg({}).T.std, mg({gas: 'n2'}).T.std, mg({p: 350}).T.stdOk, mg({p: 420}).T.stdOk], [1200, 1707, 1365.6, [345, 380], [1100, 1275], true, false]);
check('Type K copper above 1275 kPa (185 psi) for sizes over DN80; Type L otherwise', [mg({gas: 'n2', p: 1300}).T.typeK, mg({gas: 'n2', p: 1138}).T.typeK], [true, false]);
check('alternate test pressures Table 5.1.12.3.3.2: oxygen 345, nitrous oxide 275, medical air 415, nitrogen and instrument air 210, mixtures 140 kPa; vacuum 510 mm HgV, WAGD 380 mm HgV', [mg({}).T.alt, mg({gas: 'n2o'}).T.alt, mg({gas: 'air'}).T.alt, mg({gas: 'n2'}).T.alt, mg({gas: 'inst'}).T.alt, mg({gas: 'mix'}).T.alt, mg({gas: 'vac'}).T.alt, mg({gas: 'wagd'}).T.alt], [345, 275, 415, 210, 210, 140, 510, 380]);
r = mg({gas: 'vac'});
check('medical-surgical vacuum: alarm at 300 mm HgV (12 in), 24 h standing vacuum 300 mm, piping pressure test 415 kPa (60 psi)', [r.T.pos, r.T.alarmVac, r.T.standingVac, r.T.initialVac], [false, 300, 300, 415]);
check('temperature correction (5.1.12.2.7.6): 420 kPa gage at 20 C falling to 10 C allows (420 + 101.4) x 283.15 / 293.15 - 101.4 = 402.2 kPa; a vacuum of 300 mm at 20 C reads 316 mm at 10 C', [+mg({p1: 420, t1: 20, t2: 10}).T.temp.toFixed(1), +mg({gas: 'vac', v1: 300, t1: 20, t2: 10}).T.temp.toFixed(0)], [402.2, 316]);
check('oxygen > 99 %: 99.5 passes, 99 fails; nitrous oxide the same; nitrogen with < 1 % oxygen', [mg({c1: 99.5}).chk[0].ok, mg({c1: 99}).chk[0].ok, mg({gas: 'n2o', c1: 99.2}).chk[0].ok, mg({gas: 'n2', c1: 0.5}).chk[0].ok, mg({gas: 'n2', c1: 1.5}).chk[0].ok], [true, false, true, true, false]);
r = mg({gas: 'air', c1: 21, dp: 4, co: 10, co2: 500, hc: 25, hal: 2});
check('Table 5.1.12.3.12.3: medical air 19.5 - 23.5 % O2, dew point 4 C, CO 10 ppm, CO2 500 ppm, hydrocarbons 25 ppm, halogenated 2 ppm: every limit value passes', [r.chk.length, r.chk.every(c => c.ok)], [6, true]);
r = mg({gas: 'air', c1: 24, dp: 5, co: 11, co2: 501, hc: 26, hal: 2.1});
check('just above every limit all six fail; 19.4 % oxygen also fails', [r.chk.map(c => c.ok), mg({gas: 'air', c1: 19.4}).chk[0].ok], [[false, false, false, false, false, false], false]);
w.renderCalc('medgas'); setv(w, 'mg_p', 350); w.calcResult('medgas');
let tt = doc.getElementById('mg_results').textContent;
check('the page opens with the oxygen data: 1035 kPa, 280 / 420, the support-spacing table and the 🔴 note', [tt.includes('1035'), tt.includes('280 / 420'), tt.includes('DN25'), doc.querySelectorAll('#mg_results table tr').length >= 9, tt.includes('🔴')], [true, true, true, true, true]);
setv(w, 'mg_u', 'psi'); setv(w, 'mg_p', 50); w.calcResult('medgas');
check('50 psi converts to 345 kPa; the initial test stays at 1035 kPa (150 psi)', [doc.getElementById('mg_results').textContent.includes('150.1 psi') || doc.getElementById('mg_results').textContent.includes('150.0 psi'), doc.getElementById('mg_results').textContent.includes('345 kPa')], [true, true]);
setv(w, 'mg_g', 'vac'); w.calcResult('medgas');
check('the vacuum page shows the 300 mm alarm', [doc.getElementById('mg_results').textContent.includes('300 mm HgV')], [true]);
check('other reference codes open it too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('medgas'); x.calcResult('medgas'); return x.document.getElementById('mg_results').textContent.length > 300; }), [true, true, true]);
}

// ---------- part 89: NFPA 99-2002 electrical safety tests (`hcelectest`: 4.3.3, 4.3.2.6, 8.4.1.3, 8.5.2.1) ----------
{
w = boot('intl'); doc = w.document;
const ht = o => w.eval('htCalc(' + JSON.stringify(Object.assign({ctx: 'new', quiet: false, area: 'gen', nrec: 10, V: 120, f: 60, v: null, z: null, ret: null, lim: null, limI: null, zw: null}, o)) + ')');
let r = ht({});
check('limits: new construction 20 mV and 0.1 Ω (0.2 Ω for quiet grounds); periodic 500 mV (general) and 40 mV (critical); the LIM test resistor is 200 x 120 = 24,000 Ω and passes 5.0 mA; a monitor with 1 mA at 120 V needs 120 kΩ', [r.vLim, r.zLim, ht({quiet: true}).zLim, ht({ctx: 'gen'}).vLim, ht({ctx: 'crit'}).vLim, r.limR, r.limI, r.limZ], [20, 0.1, 0.2, 500, 40, 24000, 5, 120]);
check('10 % of the receptacles of each patient care vicinity: 10 -> 1, 25 -> 3, 100 -> 10; retest intervals 12 months (general care) and 6 months (critical care, wet locations)', [ht({nrec: 10}).tests, ht({nrec: 25}).tests, ht({nrec: 100}).tests, r.months, ht({area: 'crit'}).months, ht({area: 'wet'}).months], [1, 3, 10, 12, 6, 6]);
check('200 kΩ to ground: C = 1 / (2 pi f 200000) = 13.26 nF at 60 Hz and 15.92 nF at 50 Hz', [+r.cMaxNF.toFixed(2), +ht({f: 50}).cMaxNF.toFixed(2)], [13.26, 15.92]);
r = ht({v: 20, z: 0.1, ret: 115, lim: 5.0, limI: 1, zw: 250});
check('every limit value passes: 20 mV, 0.1 Ω, 115 g, LIM alarm at 5.0 mA, monitor 1 mA, wiring 250 kΩ', [r.checks.length, r.checks.map(c => c.ok)], [6, [true, true, true, true, true, true]]);
r = ht({v: 21, z: 0.15, ret: 100, lim: 3.5, limI: 1.2, zw: 200});
check('just outside: 21 mV, 0.15 Ω, 100 g, alarm at 3.5 mA (a monitor that alarms below 3.7 mA), 1.2 mA, 200 kΩ (must exceed) all fail; 0.15 Ω passes for a quiet ground', [r.checks.map(c => c.ok), ht({z: 0.15, quiet: true}).checks[0].ok, ht({lim: 5.1}).checks[0].ok, ht({lim: 3.7}).checks[0].ok], [[false, false, false, false, false, false], true, false, true]);
check('periodic general care accepts 450 mV (limit 500) but critical care does not (limit 40)', [ht({ctx: 'gen', v: 450}).checks[0].ok, ht({ctx: 'crit', v: 450}).checks[0].ok, ht({ctx: 'crit', v: 40}).checks[0].ok], [true, false, true]);
const lk = (t, v, f) => w.eval('htLeak("' + t + '", ' + v + ', ' + (f || 0) + ')');
check('leakage limits (µA): portable 300, facility-owned 500, fixed 5000, leads non-isolated 100, isolated 10 (ground intact) and 50 (open), isolation test 50, between leads 50 / 10 / 50', [['port', 'nonpat', 'fixed', 'leadNI', 'leadIsoG', 'leadIsoO', 'isol', 'btwNI', 'btwIsoG', 'btwIsoO'].map(t => lk(t, 1).lim)], [[300, 500, 5000, 100, 10, 50, 50, 50, 10, 50]]);
check('a portable appliance at 300 µA passes, 400 µA is conditional (300 - 500 on existing or special equipment), 501 µA fails; an isolated lead at 11 µA fails', [lk('port', 300).ok, lk('port', 400).cond, lk('port', 400).ok, lk('port', 501).cond, lk('port', 501).ok, lk('leadIsoG', 11).ok], [true, true, false, false, false, false]);
check('above 1 kHz the limit is multiplied by the frequency in kHz up to 10 mA: portable at 2 kHz 600 µA, at 40 kHz 10,000 µA (capped); no conditional band at high frequency', [lk('port', 500, 2).lim, lk('port', 500, 2).ok, lk('port', 700, 2).ok, lk('port', 1, 40).lim, lk('port', 400, 2).cond], [600, true, false, 10000, false]);
w.renderCalc('hcelectest'); w.calcResult('hcelectest');
let tt = doc.getElementById('ht_results').textContent;
check('the page opens with two leakage rows (250 µA passes, 8 µA isolated lead passes), the 24000 Ω resistor and the 🔴 note', [doc.querySelectorAll('#ht-tbody tr').length, tt.includes('24000'), tt.includes('مقبول'), tt.includes('🔴')], [2, true, true, true]);
w.htAddRow();
check('adding a row re-renders without a result for a zero value', [doc.querySelectorAll('#ht-tbody tr').length, doc.querySelectorAll('#ht_results table').length], [3, 1]);
check('other reference codes open it too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('hcelectest'); x.calcResult('hcelectest'); return x.document.getElementById('ht_results').textContent.length > 300; }), [true, true, true]);
}

// ---------- part 90: NFPA 54-2018 Category I vent sizing, two or more appliances (`ventmulti`: tables 13.2(a-f), rules 13.2.1 - 13.2.18) ----------
{
w = boot('intl'); doc = w.document;
const ap = (name, type, kbtu, R, len, n45, n90) => ({name, type, kbtu, R: R == null ? 2 : R, len: len == null ? 2 : len, n45: n45 || 0, n90: n90 || 0});
const vm = o => w.eval('vmRun(' + JSON.stringify(Object.assign({tbl: '13.2(a)', H: 10, apps: [ap('a', 'nat', 100)], c45: 0, c90: 0, manifold: false, ext: false, area: 12}, o)) + ')');
const conn = (tb, d, H, R) => w.eval('vmConn("' + tb + '", ' + d + ', ' + H + ', ' + R + ')');
check('data: 13.2(a) H 10 ft, R 2 ft: 3 in 23 / 47 / 33, 5 in 51 / 136 / 93, 6 in 67 / 206 / 134; 13.2(b) 3 in NAT 33 and 4 in 84 / 85 / 59; 13.2(c) 4 in 40 / 93 / 54; 13.2(e) 6 - 8 ft, rise 2 ft, 5 in 86', [conn('13.2(a)', 3, 10, 2), conn('13.2(a)', 5, 10, 2), conn('13.2(a)', 6, 10, 2), conn('13.2(b)', 3, 10, 2), conn('13.2(b)', 4, 10, 2), conn('13.2(c)', 4, 10, 2), conn('13.2(e)', 5, 10, 2)], [[23, 47, 33], [51, 136, 93], [67, 206, 134], [null, null, 33], [84, 85, 59], [40, 93, 54], [null, 86, 86]]);
check('data: 24 connector rows in each group of (a) - (d) (8 heights x 3 rises), 8 common-vent rows per group; (e) 9 + 7 rows; the (f) table has 8 heights', [['13.2(a)', 'c'], ['13.2(b)', 'c'], ['13.2(c)', 'c'], ['13.2(d)', 'c']].map(a => w.eval('VM_T["' + a[0] + '"].c.map(g => g.r.length).join("/")')).concat([w.eval('VM_T["13.2(a)"].m.map(g => g.r.length).join("/")'), w.eval('VM_T["13.2(e)"].c[0].r.length + "/" + VM_T["13.2(e)"].m[0].r.length'), w.eval('VM_T["13.2(f)"].r.length')]), ['24/24', '24', '24', '24', '8/8', '9/7', 8]);
let r = vm({});
check('a draft-hood appliance of 100 kBtu/h at H = 10 ft and R = 2 ft needs a 6 in connector (5 in carries 93); a fan-assisted one a 5 in connector (4 in carries 86, 5 in 51 - 136)', [r.apps[0].d, vm({apps: [ap('f', 'fan', 100)]}).apps[0].d], [6, 5]);
check('interpolation: H = 12.5 ft between 10 ft (93) and 15 ft (99) gives 96 for the 5 in NAT connector; R = 1.5 ft between 1 ft (78) and 2 ft (93) gives 85.5; R above the table (5 ft) takes the 3 ft row (104); R under 1 ft is outside', [+conn('13.2(a)', 5, 12.5, 2)[2].toFixed(1), +conn('13.2(a)', 5, 10, 1.5)[2].toFixed(1), conn('13.2(a)', 5, 10, 5)[2], conn('13.2(a)', 5, 10, 0.5)], [96, 85.5, 104, null]);
check('13.2.7 extra connector elbows: one 90-degree elbow cuts 134 to 120.6 (6 in still carries 100); three cut it to 93.8 so 100 kBtu/h needs 7 in (182 x 0.7 = 127)', [+vm({apps: [ap('a', 'nat', 100, 2, 2, 0, 1)]}).apps[0].rows[3].max.toFixed(1), vm({apps: [ap('a', 'nat', 100, 2, 2, 0, 1)]}).apps[0].d, vm({apps: [ap('a', 'nat', 100, 2, 2, 0, 3)]}).apps[0].d], [120.6, 6, 7]);
check('13.2.3 connector length: 6 in connector maximum 9 ft; 12 ft cuts 10 % (120.6), 20 ft cuts 20 % (107.2); a 5 in fan-assisted connector of 10 ft (maximum 7.5) takes FAN Min 54 from Table 13.1(a)', [+vm({apps: [ap('a', 'nat', 50, 2, 12)]}).apps[0].rows[3].max.toFixed(1), +vm({apps: [ap('a', 'nat', 50, 2, 20)]}).apps[0].rows[3].max.toFixed(1), vm({apps: [ap('f', 'fan', 100, 2, 10)]}).apps[0].rows[2].min, vm({apps: [ap('f', 'fan', 100, 2, 10)]}).apps[0].d], [120.6, 107.2, 54, 5]);
r = vm({apps: [ap('a', 'fan', 100), ap('b', 'nat', 50)]});
check('common vent (a) at H = 10 ft: FAN+NAT 150 kBtu/h: D 4 carries 97, 5 carries 141 and 6 carries 194, so 6 in (and the connectors are 5 and 5/4 in)', [r.col, r.tot, r.cd, r.apps.map(a => a.d)], [1, 150, 6, [5, 4]]);
r = vm({apps: [ap('a', 'nat', 60), ap('b', 'nat', 60)]});
check('NAT+NAT 120 kBtu/h at H = 10 ft: 5 in carries 124; the connectors are 5 in each so the common vent is at least 5 in', [r.col, r.cd, r.apps.map(a => a.d), Math.round(r.caps.find(c => c.d === 5).capf)], [2, 5, [5, 5], 124]);
check('13.2.8 the common vent is never smaller than the largest connector; 13.2.6 / 13.2.4: one 90-degree elbow and a manifold give 0.9 x 0.9 = 0.81 so 124 becomes 100 and 120 needs 6 in; interpolation at 12.5 ft: (124 + 144) / 2 = 134', [vm({apps: [ap('a', 'nat', 400), ap('b', 'nat', 20)]}).cd, +vm({apps: [ap('a', 'nat', 60), ap('b', 'nat', 60)], c90: 1, manifold: true}).fc.toFixed(2), vm({apps: [ap('a', 'nat', 60), ap('b', 'nat', 60)], c90: 1, manifold: true}).cd, Math.round(vm({apps: [ap('a', 'nat', 60), ap('b', 'nat', 60)], H: 12.5}).caps.find(c => c.d === 5).capf)], [12, 0.81, 6, 134]);
r = vm({tbl: '13.2(b)', apps: [ap('a', 'nat', 60)]});
check('13.2(b) single-wall connectors at H = 10 ft, R = 2 ft: 60 kBtu/h NAT: 3 in 33 and 4 in 59 are too small, 5 in carries 91', [r.apps[0].d, Math.round(r.apps[0].rows[2].max)], [5, 91]);
r = vm({tbl: '13.2(c)', apps: [ap('a', 'nat', 50), ap('b', 'nat', 50)]});
check('13.2(c) masonry chimney, two 50 kBtu/h NAT: 4 in connectors (54), NAT+NAT 100 kBtu/h needs 38 in2 (28 in2 carries 90, 38 in2 carries 131)', [r.apps.map(a => a.d), r.chim, r.cd], [[4, 4], true, 38]);
r = vm({tbl: '13.2(c)', apps: [ap('f', 'fan', 120), ap('n', 'nat', 80)]});
check('13.2(c) FAN 120 + NAT 80 (200 kBtu/h): 5 in connectors; 28 in2 carries 207 (FAN+NAT)', [r.apps.map(a => a.d), r.col, r.cd], [[5, 5], 1, 28]);
r = vm({tbl: '13.2(e)', apps: [ap('a', 'nat', 40), ap('b', 'nat', 40)]});
check('13.2(e) single-wall pipe, draft hood only: 40 kBtu/h at 6 - 8 ft group with a 2 ft rise takes 4 in (53); common NAT+NAT 80 kBtu/h at 10 ft: 4 in carries 59, 5 in carries 95; a fan-assisted appliance is flagged', [r.apps.map(a => a.d), r.cd, vm({tbl: '13.2(e)', apps: [ap('f', 'fan', 40)]}).apps[0].warn], [[4, 4], 5, ['fan']]);
check('13.2(e) groups: H 12 ft uses the 6 - 8 ft group (86), 20 ft the 15 ft group (92), 45 ft the 30 ft and up group (97) for 5 in at a 2 ft rise', [conn('13.2(e)', 5, 12, 2)[2], conn('13.2(e)', 5, 20, 2)[2], conn('13.2(e)', 5, 45, 2)[2]], [86, 92, 97]);
check('13.2(f) exterior masonry chimney (NAT+NAT only): at 10 ft and 63 in2 the maximum is 236 kBtu/h: 200 passes, 250 fails and a fan-assisted appliance fails; NA at 15 ft with 12 in2', [vm({tbl: '13.2(c)', apps: [ap('a', 'nat', 100), ap('b', 'nat', 100)], ext: true, area: 63}).ext.ok, vm({tbl: '13.2(c)', apps: [ap('a', 'nat', 130), ap('b', 'nat', 120)], ext: true, area: 63}).ext.ok, vm({tbl: '13.2(c)', apps: [ap('a', 'fan', 100), ap('b', 'nat', 100)], ext: true, area: 63}).ext.ok, vm({tbl: '13.2(c)', H: 15, apps: [ap('a', 'nat', 20), ap('b', 'nat', 20)], ext: true, area: 12}).ext.max], [true, false, false, null]);
check('height outside the tables (5 ft or 120 ft) gives no connector and no common vent', [vm({H: 5}).apps[0].d, vm({H: 5}).cd, vm({H: 120}).cd], [null, null, null]);
w.renderCalc('ventmulti'); w.calcResult('ventmulti');
let tt = doc.getElementById('vm_results').textContent;
check('the page opens with the boiler (FAN 50 kW) and heater (NAT 25 kW), 9 m height, a connector table, a common-vent table and the 🔴 note', [tt.includes('13.2(a)'), tt.includes('مرجل'), doc.querySelectorAll('#vm_results table').length, tt.includes('🔴'), doc.querySelectorAll('#vm-tbody tr').length], [true, true, 2, true, 2]);
w.vmAddRow();
check('adding an appliance re-renders with three rows', [doc.querySelectorAll('#vm-tbody tr').length, doc.querySelectorAll('#vm_results table tr').length > 10], [3, true]);
setv(w, 'vm_t', '13.2(c)'); w.calcResult('ventmulti');
check('a masonry chimney table shows the chimney area', [doc.getElementById('vm_results').textContent.includes('in²')], [true]);
check('other reference codes open it too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('ventmulti'); x.calcResult('ventmulti'); return x.document.getElementById('vm_results').textContent.length > 300; }), [true, true, true]);
}

// ---------- part 91: NFPA 54-2018 pressure test and purging of fuel gas piping (`gaspiptest`: 8.1, 8.3, annex B.7.5) ----------
{
w = boot('intl'); doc = w.document;
const a12 = Math.PI / 4 * Math.pow(11.938 / 12, 2);
const gt = o => w.eval('gtCalc(' + JSON.stringify(Object.assign({maop: 0.5, design: 0.5, dwelling: false, rows: [{name: 'x', size: '1', len: 100}], od: 0, wt: 0, smys: 0, p1: null, t1: null, t2: null}, o)) + ')');
const vol = V => ({rows: [{name: 'x', size: '12', len: V / a12}]});
check('test pressure = max(1.5 x working pressure, 3 psi): 0.5 psig -> 3 psi, 5 psig -> 7.5, 60 -> 90, 100 -> 150 (above 125 psi); the mechanical gauge reads at most 5 x the test pressure', [gt({maop: 0.5}).tp, gt({maop: 5}).tp, gt({maop: 60}).tp, gt({maop: 100}).tp, gt({maop: 100}).over, gt({maop: 60}).over, gt({maop: 5}).scale], [3, 7.5, 90, 150, true, false, 37.5]);
check('hoop stress limit above 125 psi: 50 % of SMYS = S t / D: 35,000 psi x 0.237 in / 4.5 in = 1843 psi so 150 psi is fine; 20,000 psi x 0.01 / 4 = 50 psi is exceeded', [+gt({maop: 100, od: 4.5, wt: 0.237, smys: 35000}).hoop.toFixed(0), gt({maop: 100, od: 4.5, wt: 0.237, smys: 35000}).hoopBad, gt({maop: 100, od: 4, wt: 0.01, smys: 20000}).hoopBad], [1843, false, true]);
check('pipe volume from the Schedule 40 inside diameters: 100 ft of 1 in = 0.600 ft3 (0.017 m3), 1000 ft of 2 in = 23.3 ft3; the two default sections add', [+gt({}).vol.toFixed(3), +gt({rows: [{name: 'x', size: '2', len: 1000}]}).vol.toFixed(1)], [0.6, 23.3]);
check('duration: 1/2 h per 500 ft3 or fraction: 50 ft3 -> 0.5 h, 500 -> 0.5, 501 -> 1.0, 1500 -> 1.5, 1501 -> 2.0; under 10 ft3 or a single-family dwelling 10 minutes; never over 24 h', [gt(vol(50)).dur, gt(vol(500)).dur, gt(vol(501)).dur, gt(vol(1500)).dur, gt(vol(1501)).dur, +gt(vol(5)).dur.toFixed(4), +gt(Object.assign(vol(50), {dwelling: true})).dur.toFixed(4), gt(vol(40000)).dur], [0.5, 0.5, 1, 1.5, 2, 0.1667, 0.1667, 24]);
const pr = (n, l) => w.eval('gtPurgeRule(' + n + ', ' + l + ')');
check('Table 8.3.1: 2-1/2 in over 50 ft, 3 in over 30 ft, 4 in over 15 ft, 6 in over 10 ft, 8 in and over any length; 2 in and under never', [pr(2.5, 51), pr(2.5, 50), pr(3, 31), pr(3, 30), pr(4, 16), pr(4, 15), pr(5, 16), pr(6, 11), pr(6, 10), pr(8, 1), pr(2, 5000), pr(1, 5000)], [true, false, true, false, true, false, true, true, false, true, false, false]);
check('purging outdoors when the design pressure exceeds 2 psig (3 psig yes, 2 psig no) or a section meets Table 8.3.1; a 4 in line of 20 ft purges outdoors at low pressure', [gt({design: 3}).outdoor, gt({design: 2}).outdoor, gt({rows: [{name: 'a', size: '4', len: 20}]}).outdoor, gt({rows: [{name: 'a', size: '4', len: 20}]}).secs[0].purge], [true, false, true, true]);
check('annex B.7.5: 20 psig at 70 F falling to 40 F: (20 + 14.7) x 499 / 529 - 14.7 = 18.0 psig on the gauge', [+gt({p1: 20, t1: 70, t2: 40}).p2.toFixed(1), gt({}).p2], [18, null]);
w.renderCalc('gaspiptest'); w.calcResult('gaspiptest');
let tt = doc.getElementById('gt_results').textContent;
check('the page opens with 0.5 psig: test pressure 3.0 psig (21 kPa), gauge up to 15.0, 10 minutes (the volume is under 10 ft3), the purge answer and the 🔴 note', [tt.includes('3.0 psig'), tt.includes('21 kPa'), tt.includes('10 min'), tt.includes('يُسمح بالداخل'), tt.includes('🔴')], [true, true, true, true, true]);
setv(w, 'gt_dw', 'yes'); setv(w, 'gt_p', 0.5); w.calcResult('gaspiptest');
check('the dwelling choice keeps 10 minutes and the volume is shown in m3', [doc.getElementById('gt_results').textContent.includes('10 min'), doc.getElementById('gt_results').textContent.includes('m³')], [true, true]);
setv(w, 'gt_u', 'kpa'); setv(w, 'gt_p', 700); w.calcResult('gaspiptest');
check('700 kPa (101.5 psi) gives 1.5 x = 152.3 psi (1050 kPa) and the purge goes outdoors', [doc.getElementById('gt_results').textContent.includes('1050 kPa'), doc.getElementById('gt_results').textContent.includes('إلى الخارج')], [true, true]);
check('other reference codes open it too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('gaspiptest'); x.calcResult('gaspiptest'); return x.document.getElementById('gt_results').textContent.length > 300; }), [true, true, true]);
}

// ---------- part 92: NFPA 55 compressed gases (`maq55`: Tables 6.3.1.1 and 6.2.1 of the second revisions) and liquefied hydrogen separation distances (`lh2sep`: Table 11.3.2.2) ----------
{
w = boot('intl'); doc = w.document;
const mq = o => w.eval('mqCalc(' + JSON.stringify(Object.assign({mat: 'fgg', floor: 'a1', spr: false, cab: false, qty: 500, n: 1}, o)) + ')');
let r = mq({});
check('flammable gas, gaseous, Category 1A / 1B high burning velocity: MAQ 1000 scf per control area; ground floor takes 100 % in up to 4 control areas with 1 h barriers; 500 scf in one area is within the limit', [r.base, r.per, r.pct, r.areaMax, r.ncontrol, r.frr, r.need, r.ok, r.pl], [1000, 1000, 100, 1000, 4, 1, 1, true, 2]);
check('footnotes d (cabinets, gas rooms) and e (sprinklers throughout) add 100 % each and accumulate: x1, x2, x2, x3 -> 1000, 2000, 2000, 3000 scf; a cryogenic flammable fluid and LP-gas get no d / e increase', [mq({}).per, mq({spr: true}).per, mq({cab: true}).per, mq({spr: true, cab: true}).per, mq({mat: 'cf', spr: true, cab: true}).per, mq({mat: 'lp', spr: true, cab: true}).per], [1000, 2000, 2000, 3000, 45, 300]);
const fl = {a10: [5, 1, 2], a79: [5, 2, 2], a46: [12.5, 2, 2], a3: [50, 2, 1], a2: [75, 3, 1], a1: [100, 4, 1], b1: [75, 3, 1], b2: [50, 2, 1]};
check('Table 6.2.1: above grade > 9: 5 % x 1 (2 h); 7-9: 5 % x 2 (2 h); 4-6: 12.5 % x 2 (2 h); 3: 50 % x 2 (1 h); 2: 75 % x 3 (1 h); 1: 100 % x 4 (1 h); below grade 1: 75 % x 3 (1 h); 2: 50 % x 2 (1 h)', Object.keys(fl).map(k => { const x = mq({floor: k}); return [x.pct, x.ncontrol, x.frr]; }), Object.keys(fl).map(k => fl[k]));
r = mq({floor: 'b3'});
check('lower than the second basement level: control areas not permitted (NP)', [r.notP, r.ok, r.ncontrol], [true, false, 0]);
check('4th - 6th floor: 12.5 % of 1000 = 125 scf per area and 250 scf in the 2 areas; 250 scf fits in 2 areas but 251 needs 3 so exceeds', [mq({floor: 'a46', n: 2}).areaMax, mq({floor: 'a46', n: 2}).total, mq({floor: 'a46', n: 2, qty: 250}).ok, mq({floor: 'a46', n: 2, qty: 251}).ok, mq({floor: 'a46', n: 2, qty: 251}).need], [125, 250, true, false, 3]);
check('ground floor 3500 scf needs 4 control areas of 1000 (all four allowed) and 4001 scf needs 5 so exceeds Protection Level 2; asking for only 2 areas limits it to 2000', [mq({qty: 3500, n: 4}).need, mq({qty: 3500, n: 4}).ok, mq({qty: 4001, n: 4}).ok, mq({qty: 3500, n: 2}).ok, mq({qty: 3500, n: 9}).nUsed], [4, true, false, false, 4]);
check('other materials: oxidizing gaseous 1500 scf PL3, pyrophoric 50 scf, unstable detonable 10 scf PL1, unstable class 2 750 scf PL3, corrosive 810, toxic 810, highly toxic 20 scf PL4 (only in gas rooms), liquefied pyrophoric 4 lb, low-BV flammable 162,500 scf, inert unlimited', [['og', 'pg', 'ug4', 'ug2', 'cg', 'tg', 'hg', 'pl', 'fgl'].map(k => mq({mat: k}).base), mq({mat: 'ug4'}).pl, mq({mat: 'hg'}).pl, mq({mat: 'inert'}).nl, mq({mat: 'inert'}).ok], [[1500, 50, 10, 750, 810, 810, 20, 4, 162500], 1, 4, true, true]);
check('footnotes: j (pyrophoric and detonable unstable gas only in sprinklered buildings), k (highly toxic only in cabinets / gas rooms), b (flammable cryogenic fluid), g (LP-gas under NFPA 58)', [mq({mat: 'pg'}).notes, mq({mat: 'pg', spr: true}).notes, mq({mat: 'hg'}).notes, mq({mat: 'hg', cab: true}).notes, mq({mat: 'cf'}).notes, mq({mat: 'cf', spr: true}).notes, mq({mat: 'lp'}).notes], [['j'], [], ['k'], [], ['b'], [], ['g']]);
w.renderCalc('maq55'); w.calcResult('maq55');
let tt = doc.getElementById('mq_results').textContent;
check('the page opens with 1000 scf, 100 %, 4 control areas, 500 scf within the limit and the 🔴 note', [tt.includes('1000 scf'), tt.includes('100.0%'), tt.includes('ضمن الحد'), tt.includes('🔴')], [true, true, true, true]);
setv(w, 'mq_q', 5000); w.calcResult('maq55');
check('5000 scf in one control area exceeds the limit and names Protection Level 2', [doc.getElementById('mq_results').textContent.includes('تفوق الحد'), doc.getElementById('mq_results').textContent.includes('مستوى الحماية 2')], [true, true]);
check('other reference codes open it too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('maq55'); x.calcResult('maq55'); return x.document.getElementById('mq_results').textContent.length > 300; }), [true, true, true]);
}
{
w = boot('intl'); doc = w.document;
const lh = o => w.eval('lhCalc(' + JSON.stringify(Object.assign({gal: 5000, insul: false, barrier: false}, o)) + ')');
const by = (r, n, k) => r.rows.filter(x => x.n === n)[k || 0].d;
check('capacity ranges: 39.7 - 3500 gal (150 - 13,250 L) -> 0, 3501 - 15,000 -> 1, 15,001 - 75,000 -> 2; below 39.7 and above 75,000 gal are outside the table', [39, 39.7, 3500, 3501, 15000, 15001, 75000, 75001].map(g => lh({gal: g}).rg), [-1, 0, 0, 1, 1, 2, 2, 3]);
let r = lh({});
check('3501 - 15,000 gal: lot lines 50 ft, air intakes 75, operable openings 75, ignition sources 50, public assembly 75, parked cars 25, flammable gas systems 75, between hydrogen tanks 5, flammable liquids 75, hazardous materials 75, heavy timber 75, unopenable openings 50, sewer inlets 10, metering stations 15', [by(r, 1), by(r, 2), by(r, 3), by(r, 4), by(r, 5), by(r, 6), by(r, 8), by(r, 9), by(r, 10), by(r, 11), by(r, 12), by(r, 13), by(r, 14), by(r, 16)], [50, 75, 75, 50, 75, 25, 75, 5, 75, 75, 75, 50, 10, 15]);
check('the three ranges for the lot lines are 25 / 50 / 75 ft (7.6 / 15 / 23 m) and for the building (b)(2) unsprinklered combustible construction 50 / 75 / 100 ft (15 / 23 / 30.5 m)', [by(lh({gal: 1000}), 1), by(lh({gal: 5000}), 1), by(lh({gal: 20000}), 1), by(lh({gal: 1000}), 7, 4), by(lh({gal: 5000}), 7, 4), by(lh({gal: 20000}), 7, 4)], [25, 50, 75, 50, 75, 100]);
check('building rows: sprinklered or non-combustible contents 5 ft; unsprinklered combustible contents 25 / 50 / 75 ft (wall under 3 h) or 5 ft (3 h or more); combustible construction sprinklered 50 ft', [by(r, 7, 0), by(r, 7, 1), by(r, 7, 2), by(r, 7, 3)], [5, 50, 5, 50]);
r = lh({insul: true});
check('11.3.2.2.4 insulated parts: the distances of items 1, 7, 8, 10, 11, 12, 13 drop by two thirds but not under 5 ft: 50 -> 16.7, 75 -> 25, 5 stays 5; items outside the list (air intakes 75, ignition 50) are unchanged', [+by(r, 1).toFixed(1), +by(r, 11).toFixed(1), by(r, 7, 0), +by(r, 10).toFixed(1), by(r, 2), by(r, 4)], [16.7, 25, 5, 25, 75, 50]);
r = lh({barrier: true});
check('11.3.2.2.5 a 2 h fire barrier wall takes the same items to 0 ft; the others keep their distances', [by(r, 1), by(r, 8), by(r, 11), by(r, 13), by(r, 2), by(r, 3), by(r, 14)], [0, 0, 0, 0, 75, 75, 10]);
check('the table has 22 exposure rows in three groups', [lh({}).rows.length, [1, 2, 3].map(g => lh({}).rows.filter(x => x.grp === g).length)], [22, [4, 2, 16]]);
w.renderCalc('lh2sep'); w.calcResult('lh2sep');
let tt = doc.getElementById('lh_results').textContent;
check('the page opens with 5000 gal, the 3,501 - 15,000 range, 22 rows plus the header and the 🔴 note', [tt.includes('3,501'), doc.querySelectorAll('#lh_results table tr').length, tt.includes('🔴')], [true, 23, true]);
setv(w, 'lh_u', 'l'); setv(w, 'lh_c', 40000); w.calcResult('lh2sep');
check('40,000 L = 10,567 gal stays in the middle range; 300,000 L is above the table', [doc.getElementById('lh_results').textContent.includes('3,501'), (setv(w, 'lh_c', 300000), w.calcResult('lh2sep'), doc.getElementById('lh_results').textContent.includes('خارج الجدول'))], [true, true]);
check('other reference codes open it too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('lh2sep'); x.calcResult('lh2sep'); return x.document.getElementById('lh_results').textContent.length > 300; }), [true, true, true]);
}
// ---------- part 93: NFPA 54-2018 gas vent termination and draft-hood vent area (`ventterm`: 12.7.3, Table 12.7.3, 12.7.4, 12.8.3) ----------
{
w = boot('intl'); doc = w.document;
const vt = o => w.eval('vtCalc(' + JSON.stringify(Object.assign({type: 'b', dia: 6, wall: 10, x: 6, near: 0, roofA: null, totA: null, inlet: null, d1: 0, d2: 0, horiz: null, vert: null}, o)) + ')');
check('Table 12.7.3 minimum height H by roof slope x/12: flat to 6 = 1.0 ft, 7 = 1.25, 8 = 1.5, 9 = 2.0, 10 = 2.5, 11 = 3.25, 12 = 4.0, 13 - 14 = 5.0, 15 - 16 = 6.0, 17 - 18 = 7.0, 19 - 20 = 7.5, 21 = 8.0, over 21 not covered', [0, 6, 6.5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22].map(x => w.eval('vtSlope(' + x + ')')), [1, 1, 1.25, 1.25, 1.5, 2, 2.5, 3.25, 4, 5, 5, 6, 6, 7, 7.5, 7.5, 8, null]);
let r = vt({});
check('Type B vent of 6 in, 10 ft from a wall, 6/12 roof: Table 12.7.3 gives 1.0 ft above the roof; 5 ft above the highest draft hood', [r.tbl, r.hTab, r.roof, r.total], [true, 1, 1, 5]);
check('a 14 in vent, or one under 8 ft from a wall, takes the 2 ft rule: 2 ft above the roof and 2 ft above any part of a building within 10 ft (a part 3 ft above the roof point -> 5 ft)', [vt({dia: 14}).roof, vt({wall: 5}).roof, vt({wall: 5, near: 3}).roof, vt({wall: 5, near: 3}).tbl], [2, 2, 5, false]);
check('single-wall metal pipe always follows 12.8.3 (2 ft above the roof, 2 ft above the building portions within 10 ft, 5 ft above the highest draft hood); Type B-W needs 12 ft above the bottom of the wall furnace', [vt({type: 'sw'}).tbl, vt({type: 'sw'}).roof, vt({type: 'sw', near: 4}).roof, vt({type: 'sw'}).total, vt({type: 'bw'}).total], [false, 2, 6, 5, 12]);
check('a roof steeper than 21/12 is outside the table: no answer, the actual height cannot comply', [vt({x: 22}).steep, vt({x: 22}).roof, vt({x: 22, roofA: 5}).roofOk, vt({x: 21}).steep], [true, null, false, false]);
check('actual heights: 1.0 ft above the roof passes, 0.9 fails; 5 ft over the draft hood passes, 4.9 fails; 3 ft above a forced-air inlet passes, 2.9 fails', [vt({roofA: 1}).roofOk, vt({roofA: 0.9}).roofOk, vt({totA: 5}).totalOk, vt({totA: 4.9}).totalOk, vt({inlet: 3}).inletOk, vt({inlet: 2.9}).inletOk, vt({}).roofOk], [true, false, true, false, true, false, null]);
r = vt({d1: 4});
check('one draft-hood appliance with a 4 in outlet: vent area at least 12.57 in2 (4 in) and at most 7 x 12.57 = 87.96 in2 (10.58 in)', [+r.amin.toFixed(2), +r.amax.toFixed(2), +r.dmin.toFixed(2), +r.dmax.toFixed(2), r.two], [12.57, 87.96, 4, 10.58, false]);
r = vt({d1: 5, d2: 4});
check('two draft-hood appliances of 5 in and 4 in: at least the larger 19.63 + 50 % of the smaller 6.28 = 25.92 in2 (5.74 in) and at most 7 x 12.57 = 87.96 in2 (smaller outlet)', [+r.amin.toFixed(2), +r.dmin.toFixed(2), +r.amax.toFixed(2), r.two], [25.92, 5.74, 87.96, true]);
check('12.7.4.2 offsets: horizontal 6 ft over vertical 10 ft = 60 % passes, 8 ft over 10 ft = 80 % fails the 75 % limit', [vt({horiz: 6, vert: 10}).run.ok, vt({horiz: 8, vert: 10}).run.ok, +vt({horiz: 8, vert: 10}).run.pct.toFixed(0), vt({}).run], [true, false, 80, null]);
w.renderCalc('ventterm'); w.calcResult('ventterm');
let tt = doc.getElementById('vt_results').textContent;
check('the page opens with the 6 in Type B vent, 3 m from a wall on a 6/12 roof: 1.00 ft (0.30 m), 5.00 ft, the 4 in sizing and the 🔴 note', [tt.includes('1.00 ft (0.30 m)'), tt.includes('5.00 ft'), tt.includes('12.6 in²'), tt.includes('🔴')], [true, true, true, true]);
setv(w, 'vt_t', 'sw'); w.calcResult('ventterm');
check('single-wall pipe shows 2.00 ft above the roof', [doc.getElementById('vt_results').textContent.includes('2.00 ft')], [true]);
check('other reference codes open it too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('ventterm'); x.calcResult('ventterm'); return x.document.getElementById('vt_results').textContent.length > 300; }), [true, true, true]);
}
console.log(fail ? `\n${fail} FAIL` : '\nall ok');
if (errors.length) { console.log('jsdom errors:', errors.slice(0, 5)); fail++; }
process.exit(fail ? 1 : 0);
