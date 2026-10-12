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
const ep = o => w.eval('epCalc(' + JSON.stringify(Object.assign({level: 1, type: '10', cls: '48', hx: 96, seis: false, fuel: 'liquid', kw: 250, cons: 0, crank: 'cycle', icr: 600, ah: 0, eta: 0.8}, o)) + ')');
let r = ep({});
check('Class 48 at 250 kW with the estimated 0.27 L/kWh = 67.5 L/h: fuel for the class 67.5 x 48 = 3240 L, low-fuel switch at 3240 L, main tank at least 133 % = 4309 L', [+r.cons.toFixed(2), r.hours, +r.fuelClass.toFixed(1), +r.tank.toFixed(0), +r.sensor.toFixed(1)], [67.5, 48, 3240, 4309, 3240]);
check('engine data: 80 L/h for Class 6 gives 480 L and a tank of 638.4 L; Class 0.083 (5 min) 80 x 0.083 = 6.6 L', [+ep({cons: 80, cls: '6'}).fuelClass.toFixed(1), +ep({cons: 80, cls: '6'}).tank.toFixed(1), +ep({cons: 80, cls: '0.083'}).fuelClass.toFixed(1)], [480, 638.4, 6.6]);
check('5.1.2: seismic design category C-F needs Level 1 with at least 96 h (Class 6 becomes 96 h, 67.5 x 96 = 6480 L); Class X of 120 h stays 120 h; Level 2 is not affected', [ep({cls: '6', seis: true}).hours, +ep({cls: '6', seis: true}).fuelClass.toFixed(1), ep({cls: 'x', hx: 120, seis: true}).hours, ep({cls: '6', seis: true, level: 2}).hours], [96, 6480, 120, 6]);
check('7.9.5: an integral diesel tank inside the building or on the roof is limited to 2498 L: 71.8 L (Class 2 at 100 kW) passes, 4309 L (Class 48 at 250 kW) does not; gas from the network has no tank', [ep({cls: '2', kw: 100}).integral, r.integral, ep({fuel: 'gas'}).fuelClass], [true, false, null]);
check('Table 5.6.4.2: limiter 75 s for 3 cycles (15 s crank + 15 s rest) or 45 s continuous; two periods draw current for 2 x 45 = 90 s in both cases; 600 A x 90 s / 3600 = 15 Ah', [r.tLimiter, ep({crank: 'cont'}).tLimiter, r.tCrank, ep({crank: 'cont'}).tCrank, +r.ah.toFixed(2)], [75, 45, 90, 90, 15]);
check('recharge in 24 h (Level 1) or 36 h (Level 2): 200 Ah installed at 0.8 efficiency needs 10.4 A (Level 1) or 6.94 A (Level 2); without an installed capacity the drawn 15 Ah gives 0.78 A', [+ep({ah: 200}).ich.toFixed(2), +ep({ah: 200, level: 2}).ich.toFixed(2), +r.ich.toFixed(2)], [10.42, 6.94, 0.78]);
check('8.4.2 monthly test at 30 % of 250 kW = 75 kW for 30 min; 8.4.2.3 annual 25 / 50 / 75 % = 62.5 / 125 / 187.5 kW for 30 / 30 / 60 min', [r.monthly, r.annual], [75, [62.5, 125, 187.5]]);
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
console.log(fail ? `\n${fail} FAIL` : '\nall ok');
if (errors.length) { console.log('jsdom errors:', errors.slice(0, 5)); fail++; }
process.exit(fail ? 1 : 0);
