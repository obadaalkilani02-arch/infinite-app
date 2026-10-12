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

console.log(fail ? `\n${fail} FAIL` : '\nall ok');
if (errors.length) { console.log('jsdom errors:', errors.slice(0, 5)); fail++; }
process.exit(fail ? 1 : 0);
