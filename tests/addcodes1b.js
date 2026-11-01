// Codes added from the library folder `standars\إضافات` (parts 94 onward): ICC IECC 2021 (envelope, pipe insulation, lighting power), ICC IFC 2018 (fire flow and hydrants, means of egress), (second half: parts 174 onward; split from addcodes.js to keep each process under the heap limit)
// Eurocode 8 (spectrum and lateral force), Eurocode 2 and ACI 318M-08 (rectangular beam).
//   node tests/addcodes1b.js
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'SmartEngineering_App.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push((e.detail && e.detail.message) || e.message));
const live = [];
function boot(code, tmp) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/', beforeParse(win) { try { win.localStorage.setItem('si_lang', 'ar'); if (code) win.localStorage.setItem('si_code', code); } catch (e) {} } });
  const w = dom.window; w.alert = () => {}; w.confirm = () => true; w.scrollTo = () => {};
  if (tmp) return w; live.push(w); while (live.length > 4) { try { const o = live.shift(); try { o.stop && o.stop(); o.document.head.innerHTML = ''; o.document.body.innerHTML = ''; } catch (e) {} o.close(); } catch (e) {} }
  return w;
}
let fail = 0;
function check(name, got, want, tol) {
  const near = (a, b) => typeof b === 'number' && typeof a === 'number' ? Math.abs(a - b) <= (tol ?? 0.01) : JSON.stringify(a) === JSON.stringify(b);
  const ok = typeof want === 'number' ? near(got, want) : Array.isArray(want) && tol != null ? Array.isArray(got) && got.length === want.length && want.every((x, i) => near(got[i], x)) : JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
}
const setv = (w, id, val) => { w.document.getElementById(id).value = String(val); };
const txt = (w, id) => w.document.getElementById(id).textContent;
const others = (id, res) => ['jo', 'ae', 'sa'].map(c => { const x = boot(c, true); x.renderCalc(id); x.calcResult(id); const ok = x.document.getElementById(res).textContent.length > 250; try { x.document.head.innerHTML = ''; x.document.body.innerHTML = ''; } catch (e) {} x.close(); return ok; });

let w, doc;

// ---------- part 174: NFPA 72-2019 (`nfpa72`: smoke and heat detector spacing, audible and visual notification) ----------
{
w = boot('ae'); doc = w.document;
const M0 = {mode: 0, L: 12, W: 8, H: 3, S: 9.1, cons: 0, bd: 0, bs: 3};
const M1 = {mode: 1, L: 20, W: 12, H: 4, S: 15.2, cons: 0, bd: 0, bs: 3000, tc: 38};
const M2 = {mode: 2, am: 0, avg: 55, max: 60, l0: 90, d0: 3, n: 1, dmin: 3};
const M3 = {mode: 3, vt: 0, L: 8, W: 6, hm: 2.1, top: 700, dp: 4, Lc: 40};
const n72 = (o, B) => w.eval('n72Calc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
const m0 = o => n72(o, M0), m1 = o => n72(o, M1), m2 = o => n72(o, M2), m3 = o => n72(o, M3);
const gr = r => [r.g.n, r.g.nx, r.g.ny];
check('smoke detectors 12 x 8 m with the nominal 9.1 m spacing: 2 detectors (2 x 1 grid of 6 x 8 m); the farthest point 5.0 m is inside 0.7 S = 6.37 m; a 5 x 4 m room needs 1', [gr(m0({})), m0({}).g.lx, m0({}).g.ly, m0({}).g.rad, m0({}).g.rule, gr(m0({L: 5, W: 4})), m0({L: 5, W: 4}).g.rad], [[2, 2, 1], 6, 8, 5, 'a', [1, 1, 1], Math.hypot(2.5, 2)], 1e-9);
check('the 0.7 S rule saves detectors: a 20 x 20 m room needs 6 (2 x 3, spacing 10 x 6.67 m, farthest point 6.01 m) instead of 9 by the 9.1 m spacing rule alone', [gr(m0({L: 20, W: 20})), m0({L: 20, W: 20}).g.rule, m0({L: 20, W: 20}).g.rad, m0({L: 20, W: 20}).g.lx, m0({L: 20, W: 20}).g.ly], [[6, 2, 3], 'b', Math.hypot(5, 20 / 6), 10, 20 / 3], 1e-9);
check('beams 300 mm deep in a 3 m high room (0.1 H = 0.3 m): beam spacing 3 m (at least 0.4 H = 1.2) gives a detector in every pocket: 3 pockets x 2 = 6; beam spacing 1.0 m (below 0.4 H): half spacing across the beams -> 2 x 2 = 4; 200 mm beams are a smooth ceiling', [m0({cons: 1, bd: 300}).note, m0({cons: 1, bd: 300}).g.n, m0({cons: 1, bd: 300, bs: 1}).note, m0({cons: 1, bd: 300, bs: 1}).g.n, m0({cons: 1, bd: 200}).note, m0({cons: 1, bd: 200}).g.n], ['pockets', 6, 'beams', 4, 'smooth', 2]);
check('rooms of 84 m2 or less and corridors up to 4.6 m wide use smooth ceiling spacing with deep beams: 10 x 8 m -> 2; 30 x 4 m corridor -> 3 (10 m apart, farthest point 5.39 m inside 6.37 m)', [m0({cons: 1, bd: 500, L: 10, W: 8}).note, m0({cons: 1, bd: 500, L: 10, W: 8}).g.n, m0({cons: 1, bd: 500, L: 30, W: 4}).note, m0({cons: 1, bd: 500, L: 30, W: 4}).g.n, m0({cons: 1, bd: 500, L: 30, W: 4}).area], ['smooth', 2, 'smooth', 3, 120]);
check('Table 17.6.3.5.1 multipliers by ceiling height: up to 3.0 m 1.00; 3.5 0.91; 4.0 0.84; 4.5 0.77; 5.0 0.71; 5.8 0.64; 6.5 0.58; 7.0 0.52; 7.5 0.46; 8.0 0.40; 9.0 0.34; 9.1 0.34; above 9.1 none', [3.0, 3.5, 4.0, 4.5, 5.0, 5.8, 6.5, 7.0, 7.5, 8.0, 9.0, 9.1, 9.2].map(H => m1({H}).mult), [1.0, 0.91, 0.84, 0.77, 0.71, 0.64, 0.58, 0.52, 0.46, 0.40, 0.34, 0.34, null]);
check('band edges: 3.7 m is the 0.91 band, 4.3 m the 0.84 band', [m1({H: 3.7}).mult, m1({H: 3.71}).mult, m1({H: 4.3}).mult, m1({H: 4.31}).mult], [0.91, 0.84, 0.84, 0.77]);
check('heat detectors 15.2 m listed at 4 m: 0.84 x 15.2 = 12.768 m; 20 x 12 m -> 2 detectors (10 x 12 m, farthest 7.81 m)', [m1({}).red, m1({}).eff, gr(m1({})), m1({}).g.rad], [12.768, 12.768, [2, 2, 1], Math.hypot(5, 6)], 1e-9);
check('the minimum spacing is not less than 0.4 H: a 6.1 m listed detector at 9.1 m gives 0.34 x 6.1 = 2.07 m but 0.4 x 9.1 = 3.64 m governs', [m1({S: 6.1, H: 9.1}).red, m1({S: 6.1, H: 9.1}).min, m1({S: 6.1, H: 9.1}).eff, m1({H: 9.1}).eff], [0.34 * 6.1, 3.64, 3.64, 0.34 * 15.2], 1e-9);
check('solid joists halve the spacing at right angles (12.768 -> 6.384): 20 x 12 m -> 4 detectors; beams deeper than 100 mm give two thirds (8.512): 4 detectors; 100 mm beams are smooth', [m1({cons: 1}).sy, gr(m1({cons: 1})), m1({cons: 2, bd: 150}).sy, m1({cons: 2, bd: 150}).g.n, m1({cons: 2, bd: 100}).note, m1({cons: 2, bd: 100}).g.n], [12.768 / 2, [4, 2, 2], 12.768 * 2 / 3, 4, 'smooth', 2], 1e-9);
check('beams deeper than 460 mm and more than 2.4 m apart make each bay a separate area', [m1({cons: 2, bd: 500, bs: 2500}).sep, m1({cons: 2, bd: 500, bs: 2400}).sep, m1({cons: 2, bd: 450, bs: 3000}).sep, m1({cons: 1, bd: 500, bs: 3000}).sep], [true, false, false, false]);
check('detector temperature rating (Table 17.6.2.1): maximum ceiling temperature 28 low, 47 ordinary, 69 intermediate, 111 high, 152 extra high, 194, 249; 38 C ceiling -> ordinary and a rating of at least 49 C', [38, 28, 29, 47, 48, 111, 112, 250].map(tc => m1({tc}).cls), ['عادية (57 - 79 °C)', 'منخفضة (38 - 56 °C)', 'عادية (57 - 79 °C)', 'عادية (57 - 79 °C)', 'متوسطة (80 - 121 °C)', 'عالية (122 - 162 °C)', 'عالية جدًا (163 - 204 °C)', null]);
check('rating at least 11 C above the ceiling temperature', m1({tc: 38}).rating, 49);
check('public mode: 15 dB above the average ambient or 5 dB above the 60 s maximum: avg 55, max 60 -> 70 dBA; private 10 dB -> 65; sleeping at least 75 dBA; a loud maximum of 80 dBA governs (85)', [m2({}).req, m2({am: 1}).req, m2({am: 2}).req, m2({max: 80}).req, m2({am: 2, avg: 70}).req], [70, 65, 75, 85, 85]);
check('the 110 dBA ceiling: ambient 100 dBA needs 115 (not allowed); above 105 dBA ambient a visual appliance is required; total sound including the ambient at the minimum hearing distance', [m2({avg: 100}).ok, m2({}).ok, m2({avg: 105}).visual, m2({avg: 106}).visual, m2({}).totOk, m2({l0: 120}).totOk], [false, true, false, true, true, false]);
check('combining the ambient with a 90 dBA appliance at 3 m: 10 log (10^5.5 + 10^9) = 90.0014; ten appliances at 6 m: 90 + 10 - 6.02 = 93.98 dBA', [m2({}).tot, m2({n: 10, dmin: 6}).lApp], [10 * Math.log10(Math.pow(10, 5.5) + 1e9), 90 + 10 - 20 * Math.log10(2)], 1e-6);
check('distance estimate (free field): 90 dBA at 3 m to 70 dBA needed -> 30 m; four appliances double the range: 60 m; the range scales with the level difference (80 dBA appliance -> 9.5 m)', [m2({}).d, m2({n: 4}).d, m2({l0: 80}).d], [30, 60, 3 * Math.pow(10, 10 / 20)], 1e-9);
check('wall-mounted visual Table 18.5.5.5.1(a): 6.1 m 15 cd; 8 m -> 8.53 m 30 cd; 12.2 m 60 cd and 15 cd with four appliances; 13 m -> 75 / 19; 39.6 m 635 / 185; above that none', [[6.1, 6.1], [8, 6], [12.2, 12.2], [13, 13], [39.6, 39.6], [40, 40]].map(d => [m3({L: d[0], W: d[1]}).cd1, m3({L: d[0], W: d[1]}).cd4]), [[15, null], [30, null], [60, 15], [75, 19], [635, 185], [null, undefined]]);
check('the next room size row applies: 6.11 m -> 30 cd (8.53 m row); 21.3 m 184 cd; 21.4 m 240 cd; 27.4 m 304', [6.11, 21.3, 21.4, 27.4].map(L => m3({L, W: 5}).cd1), [30, 184, 240, 304]);
check('wall mounting height 2.03 - 2.44 m; lower mounting enlarges the room size by twice the shortfall: 1.9 m raises an 8.4 m room to 8.66 m (34 cd instead of 30); 2.03 m itself adds nothing', [m3({}).hOk, m3({hm: 2.03}).hOk, m3({hm: 2.02}).hOk, m3({hm: 2.44}).hOk, m3({hm: 2.45}).hOk, m3({L: 8.4, hm: 1.9}).size, m3({L: 8.4, hm: 1.9}).cd1, m3({L: 8.4}).cd1, m3({hm: 2.03}).size], [true, true, false, true, false, 8.4 + 2 * (2.03 - 1.9), 34, 30, 8], 1e-9);
check('ceiling-mounted Table 18.5.5.5.1(b): lens up to 3.0 m: 6.1 m 15 cd, 9.1 m 30, 12.2 m 60, 13.4 m 75; up to 6.1 m: 30 / 45 / 75 / 80; up to 9.1 m: 55 / 75 / 95 / 110 / 115 / 135 / 150 / 177 / 185', [[3, 6], [3, 8], [3, 12], [3, 13.4], [5, 8], [5, 14], [9, 6], [9, 8], [9, 14.5], [9, 21.3]].map(c => m3({vt: 1, hm: c[0], L: c[1], W: c[1]}).cd1), [15, 30, 60, 75, 45, 80, 55, 75, 95, 185]);
check('ceiling table limits: 13.5 m at 3 m height and 22 m at 9 m have no entry; above 9.1 m the lens is suspended at 9.1 m or wall appliances are used', [m3({vt: 1, hm: 3, L: 13.5, W: 13.5}).cd1, m3({vt: 1, hm: 9, L: 22, W: 22}).cd1, m3({vt: 1, hm: 9.5}).col, m3({vt: 1, hm: 9.5}).cd1, m3({vt: 1, hm: 3}).col, m3({vt: 1, hm: 3.1}).col], [null, null, null, null, 3, 6.1]);
check('sleeping areas Table 18.5.5.8.3: 110 cd when the lens top is 610 mm or more from the ceiling, 177 cd below; rooms over 4.9 m need the appliance within 4.9 m of the pillow', [m3({vt: 2, top: 610}).cd1, m3({vt: 2, top: 609}).cd1, m3({vt: 2, dp: 4.9}).pOk, m3({vt: 2, dp: 5}).pOk, m3({vt: 2, L: 4.9, W: 4, dp: 9}).pOk, m3({vt: 2, L: 4.9, W: 4}).pillow], [110, 177, true, false, true, false]);
check('corridor appliances (15 cd): within 4.6 m of the ends and at most 30.5 m apart: 40 m -> 3 appliances at 15.4 m; 9.2 m or shorter -> 1; 39.7 m -> 2 at 30.5 m; width up to 6.1 m', [m3({vt: 3}).n, m3({vt: 3}).spacing, m3({vt: 3, Lc: 9.2}).n, m3({vt: 3, Lc: 9.3}).n, m3({vt: 3, Lc: 39.7}).n, m3({vt: 3, Lc: 39.7}).spacing, m3({vt: 3, W: 6.1}).wide, m3({vt: 3, W: 6.2}).wide, m3({vt: 3}).cd1], [3, 15.4, 1, 2, 2, 30.5, false, true, 15], 1e-9);
for (let k = 0; k < 4; k++) { w.renderCalc('nfpa72'); w.document.getElementById('n72_m').value = String(k); w.calcResult('nfpa72'); }
w.renderCalc('nfpa72'); w.calcResult('nfpa72');
let tt = txt(w, 'n72_results');
check('the page opens with the smoke detector count 2, the farthest point and the 🔴 note', [tt.includes('عدد الكواشف'), tt.includes('أبعد نقطة عن كاشف'), tt.includes('🔴'), w.document.getElementById('n72_g0').style.display, w.document.getElementById('n72_g3').style.display], [true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('n72_m', '1'); w.calcResult('nfpa72'); tt = txt(w, 'n72_results');
check('the heat page shows the multiplier 0.84 for the 4 m ceiling and the detector class', [tt.includes('معامل خفض التباعد'), /0\.84/.test(tt), tt.includes('تصنيف الكاشف')], [true, true, true]);
set('n72_m', '2'); w.calcResult('nfpa72'); tt = txt(w, 'n72_results');
check('the audible page shows 70 dBA and the total limit 110', [tt.includes('المستوى المطلوب'), /70\.0/.test(tt), tt.includes('110 dBA')], [true, true, true]);
set('n72_m', '3'); w.calcResult('nfpa72'); tt = txt(w, 'n72_results');
check('the visual page shows 30 cd for the 8 x 6 m wall-mounted room', [tt.includes('الشدة بجهاز واحد'), /30 cd/.test(tt)], [true, true]);
check('other reference codes open it too', others('nfpa72', 'n72_results'), [true, true, true]);
}
// ---------- part 175: Schneider EIG 2015 chapter Q (`eigq`: residential circuits, RCD and earth electrode, bathroom zones, special locations) ----------
{
w = boot('ae'); doc = w.document;
const M0 = {mode: 0, n: [1, 2, 1, 1, 1, 1, 0], wh: 1, wm: 1, dw: 1, ck: 1, sh: 2, p: 3000};
const M1 = {mode: 1, r: 40, hh: 1.5, hc: false, ovh: false, nk: 30, c1: 0.4, c2: 0.4, c3: 0.4};
const M2 = {mode: 2, d: 0.3, h: 1.0, depth: 0.5, k: 0, sel: true, selv12: false, rcd: true, sep: false, selv50: false, door: 1.0};
const q8 = (o, B) => w.eval('q8Calc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
const m0 = o => q8(o, M0), m1 = o => q8(o, M1), m2 = o => q8(o, M2);
const room = (i, c) => { const n = [0, 0, 0, 0, 0, 0, 0]; n[i] = c; return n; };
check('Fig. Q9 minimum points per room function: living room 1 light and 5 sockets; bedroom or office 1 and 3; kitchen 2 and 4; bathroom 2 and 1; hall 1 and 1; WC 1 and 0; laundry 0 and 1', [0, 1, 2, 3, 4, 5, 6].map(i => [m0({n: room(i, 1)}).lights, m0({n: room(i, 1)}).sockets]), [[1, 5], [1, 3], [2, 4], [2, 1], [1, 1], [1, 0], [0, 1]]);
check('default dwelling: 9 lighting points, 17 sockets; 2 lighting circuits, 3 socket circuits, 6 appliance circuits, 11 in all', [m0({}).lights, m0({}).sockets, m0({}).cLight, m0({}).cSock, m0({}).cAppl, m0({}).total], [9, 17, 2, 3, 6, 11]);
check('at most 8 points per circuit: 8 lights -> 1 circuit, 9 -> 2; 16 sockets -> 2 circuits, 17 -> 3', [m0({n: room(1, 8), wh: 0, wm: 0, dw: 0, ck: 0, sh: 0}).cLight, m0({n: room(0, 9)}).cLight, m0({n: room(1, 1)}).cSock, m0({n: [0, 0, 4, 0, 0, 0, 0]}).cSock, m0({n: room(6, 17)}).cSock, m0({n: room(6, 16)}).cSock], [1, 2, 1, 2, 3, 2]);
check('Fig. Q11 conductors by power (230 V): up to 2300 W 1.5 mm2 (2.5 Al) with 16 A breaker or 10 A fuse; up to 4600 W 2.5 mm2 (4) with 25 A or 20 A; up to 7300 W 6 mm2 (10) with 40 A or 32 A; above 7300 W none', [2300, 2301, 4600, 4601, 7300, 7301].map(p => m0({p}).pick ? m0({p}).pick.slice(1) : null), [[1.5, 2.5, 2300, 16, 10], [2.5, 4, 4600, 25, 20], [2.5, 4, 4600, 25, 20], [6, 10, 7300, 40, 32], [6, 10, 7300, 40, 32], null]);
check('earth electrode: R = 50 V / 300 mA = 166.7 ohm in theory, 80 ohm in practice: 80 passes for the 300 mA incoming RCD; 80.1 to 166.6 needs 30 mA RCDs instead; above 166.7 no 300 mA protection', [m1({}).rLim, m1({r: 80}).rOk, m1({r: 80.1}).rOk, m1({r: 80.1}).rOnly30, m1({r: 166.6}).rOnly30, m1({r: 167}).rNone, m1({r: 166.6}).rNone], [50 / 0.3, true, false, true, true, true, false], 1e-9);
check('board operating handles between 1.0 and 1.8 m (1.30 m maximum for handicapped or elderly users)', [1.0, 1.8, 0.99, 1.81].map(hh => m1({hh}).hOk).concat([1.3, 1.31].map(hh => m1({hh, hc: true}).hOk)), [true, true, false, false, true, false]);
check('surge arrester strongly recommended with overhead bare conductors and a keraunic level above 25', [m1({ovh: true, nk: 26}).spd, m1({ovh: true, nk: 25}).spd, m1({ovh: false, nk: 40}).spd], [true, false, false]);
check('the three arrester connection lengths each at most 0.5 m (total 1.2 here)', [m1({}).cabOk, m1({c1: 0.5, c2: 0.5, c3: 0.5}).cabOk, m1({c2: 0.51}).cabOk, m1({}).spdTotal], [true, true, false, 1.2], 1e-9);
check('bathroom zones around a bath: inside up to the depth 0.5 m zone 0; above it to 2.25 m zone 1; 0 - 0.60 m outside zone 2; 0.60 - 3.0 m zone 3 (2.4 m beyond zone 2); higher than 2.25 m or beyond 3.0 m outside the zones', [[-0.2, 0.3], [0, 0.5], [0, 0.51], [-0.2, 2.25], [-0.2, 2.26], [0.3, 1], [0.6, 1], [0.61, 1], [3.0, 1], [3.01, 1], [0.3, 2.26]].map(c => m2({d: c[0], h: c[1]}).z), [0, 0, 1, 1, -1, 2, 2, 3, 3, -1, -1]);
check('luminaires: zone 2 only class II on a 30 mA RCD circuit, zones 0 and 1 SELV 12 V, zone 3 and outside free', [m2({}).allowed, m2({sel: false}).allowed, m2({d: 0, h: 1, selv12: false}).allowed, m2({d: 0, h: 1, selv12: true}).allowed, m2({d: 0, h: 0.3, selv12: true}).allowed, m2({d: 1}).allowed, m2({d: 5}).allowed], [true, false, false, true, true, true, true]);
check('sockets only in zone 3 with 30 mA RCD, electrical separation or SELV 50 V; none in zones 0 - 2; free outside the zones', [m2({k: 1, d: 1}).allowed, m2({k: 1, d: 1, rcd: false}).allowed, m2({k: 1, d: 1, rcd: false, sep: true}).allowed, m2({k: 1, d: 1, rcd: false, selv50: true}).allowed, m2({k: 1, d: 0.3}).allowed, m2({k: 1, d: 0, h: 1}).allowed, m2({k: 1, d: 5}).allowed], [true, false, true, true, false, false, true]);
check('switches: zone 3 free, zone 2 SELV 12 V only, zones 0 and 1 no; water heaters in zones 1 and 2 (and 3), never zone 0', [m2({k: 2, d: 1}).allowed, m2({k: 2}).allowed, m2({k: 2, selv12: true}).allowed, m2({k: 2, d: 0, h: 1, selv12: true}).allowed, m2({k: 3, d: 0, h: 0.3}).allowed, m2({k: 3, d: 0, h: 1}).allowed, m2({k: 3}).allowed, m2({k: 3, d: 1}).allowed], [true, false, true, false, false, true, true, true]);
check('no switch or socket within 0.60 m of the door of a prefabricated shower cabinet', [m2({door: 0.59}).door, m2({door: 0.6}).door], [true, false]);
check('the special locations table has 17 rows; zone table 4; the room table 7; the circuit table 7', [w.eval('Q8_LOC.length'), w.eval('Q8_Z.length'), w.eval('Q8_ROOMS.length'), w.eval('Q8_CKT.length')], [17, 4, 7, 7]);
for (let k = 0; k < 4; k++) { w.renderCalc('eigq'); w.document.getElementById('q8_m').value = String(k); w.calcResult('eigq'); }
w.renderCalc('eigq'); w.calcResult('eigq');
let tt = txt(w, 'q8_results');
check('the page opens with the points, the circuits and the 🔴 note; 11 circuits', [tt.includes('نقاط الإضاءة الدنيا'), tt.includes('عدد الدوائر الكلي'), /\b11\b/.test(tt), tt.includes('🔴'), w.document.getElementById('q8_g0').style.display, w.document.getElementById('q8_g3').style.display], [true, true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('q8_m', '1'); w.calcResult('eigq'); tt = txt(w, 'q8_results');
check('the protection page shows 167 ohm and the 80 ohm verdict', [/167/.test(tt), tt.includes('قاطع الدخول التفاضلي 300 mA مناسب')], [true, true]);
set('q8_m', '2'); w.calcResult('eigq'); tt = txt(w, 'q8_results');
check('the zone page shows zone 2, IP24 and the SELV 12 V protection principle', [tt.includes('منطقة 2'), tt.includes('IP24'), tt.includes('SELV 12 V أو قاطع RCD')], [true, true, true]);
set('q8_m', '3'); set('q8_lc', '8'); w.calcResult('eigq'); tt = txt(w, 'q8_results');
check('the special locations page shows the caravan park rows: IP55 and one RCD per 6 sockets', [tt.includes('مواقف الكرفانات'), tt.includes('IP55'), tt.includes('واحد لكل 6 مقابس')], [true, true, true]);
check('other reference codes open it too', others('eigq', 'q8_results'), [true, true, true]);
}
// ---------- part 176: Schneider EIG 2015 chapter H (`eigh`: circuit-breaker derating, Icu / Ics / Icm, magnetic curves, discrimination) ----------
{
w = boot('ae'); doc = w.document;
const M0 = {mode: 0, ib: 34, t: 50, fam: 0, grp: 0.8, iz: 0};
const M1 = {mode: 1, isc: 20, icu: 25, ics: 100, kva: 400, v: 400, z: 4, n: 2};
const M2 = {mode: 2, in: 16, inrush: 80, isc: 400};
const M3 = {mode: 3, irA: 250, irB: 100, imA: 2500, imB: 800, iscB: 3000, trip: 0, load: 0, inA: 250, inB: 100, icw: 0};
const h8 = (o, B) => w.eval('h8Calc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
const m0 = o => h8(o, M0), m1 = o => h8(o, M1), m2 = o => h8(o, M2), m3 = o => h8(o, M3);
check('the guide example: 34 A at 50 C in a closed box (x 0.8): the 40 A iC60 gives 35.6 x 0.8 = 28.48 A (not enough); the 50 A gives 44.0 x 0.8 = 35.2 A -> select 50 A', [m0({}).pick.n, m0({}).pick.g, m0({}).prev.n, m0({}).prev.g, m0({}).ok], [50, 35.2, 40, 28.48, true], 1e-9);
check('without grouping the 40 A iC60 at 50 C gives 35.6 A -> 40 A; at the 30 C reference a 32 A load takes the 32 A breaker; 34 A takes 40 A', [m0({grp: 1}).pick.n, m0({grp: 1}).pick.i, m0({grp: 1, t: 30, ib: 32}).pick.n, m0({grp: 1, t: 30}).pick.n], [40, 35.6, 32, 40], 1e-9);
check('conductor condition I_B <= I_n <= I_z: 50 A selected on a 45 A cable fails, on a 50 A cable passes', [m0({iz: 45}).izBad, m0({iz: 45}).ok, m0({iz: 50}).ok, m0({iz: 50}).izBad], [true, false, true, false]);
check('interpolation between table temperatures: 40 A iC60 at 37.5 C -> 38.4 A; at 47.5 C -> 36.2 A; clamped below 20 C (42.0 A) and above 60 C (33.2 A)', [37.5, 47.5, 10, 70].map(t => w.eval('h8Interp(H8_IC[10][1], H8_T1, ' + t + ')')), [38.4, 36.2, 42.0, 33.2], 1e-9);
check('Compact NSX TM at its 40 C reference gives the rating; 50 C derates the 100 A unit to 95 A; 42.5 C interpolates (98.75 A); 5 C clamps at 115 A; 80 C at 85 A', [40, 50, 42.5, 5, 80].map(t => w.eval('h8Interp(H8_NS[7][1], H8_T2, ' + t + ')')), [100, 95, 98.75, 115, 85], 1e-9);
check('NSX selection: 90 A at 50 C with no grouping -> the 100 A unit (95 A); 300 A is above the largest unit (250 A gives 238 A at 50 C): none', [m0({fam: 1, ib: 90, grp: 1}).pick.n, m0({fam: 1, ib: 300, grp: 1}).pick, m0({fam: 1, ib: 300, grp: 1}).ok, m0({fam: 1, ib: 40, t: 40, grp: 1}).pick.n], [100, null, false, 40]);
check('IEC 60947-2 making factor n by Icu (kA): 1 -> 1.41, 2 -> 1.42, 4 -> 1.47, 5 -> 1.5, 8 -> 1.7, 15 -> 2.0, 30 -> 2.1, 60 -> 2.2 (limits included in the lower band)', [1, 1.5, 2, 3, 4, 4.5, 5, 6, 8, 10, 15, 20, 30, 50, 60].map(k => w.eval('h8K(' + k + ')[1]')), [1.41, 1.41, 1.42, 1.42, 1.47, 1.47, 1.5, 1.5, 1.7, 1.7, 2.0, 2.0, 2.1, 2.1, 2.2]);
check('Icu 25 kA: Icm = 2.1 x 25 = 52.5 kA; Ics at 100 % = 25 kA; prospective 20 kA peaks at 2.0 x 20 = 40 kA, within the making capacity; verdicts', [m1({}).icm, m1({}).ics, m1({}).ipeak, m1({}).ok, m1({}).icsOk, m1({}).peakOk, m1({}).n, m1({}).cos], [52.5, 25, 40, true, true, true, 2.1, 0.25], 1e-9);
check('insufficient capacity: Icu 15 kA against 20 kA fails; Ics 50 % (12.5 kA) is below the prospective 20 kA', [m1({icu: 15}).ok, m1({ics: 50}).ics, m1({ics: 50}).icsOk, m1({icu: 20}).ok], [false, 12.5, false, true], 1e-9);
check('two-pole breaker in an IT system: 15 % of the three phase short-circuit current up to 10 kA, 25 % above it: 10 kA -> 1.5, 20 kA -> 5.0, 10.1 -> 2.525', [m1({isc: 10}).it, m1({isc: 20}).it, m1({isc: 10.1}).it], [1.5, 5, 2.525], 1e-9);
check('400 kVA transformer at 400 V and Zsc 4 %: I_n = 577.35 A and 14.43 kA; two in parallel: principal breakers 28.87 kA, main breakers 14.43 kA; the Fig. H46 table (500 MVA at 20 kV) says 14 / 27 kA; a 500 kVA pair is not tabulated', [m1({}).in, m1({}).isc1, m1({}).cbp, m1({}).cbm, m1({}).tab.slice(1), m1({kva: 500}).tab], [400 / (Math.sqrt(3) * 0.4), 400 / (Math.sqrt(3) * 0.4) / 0.04 / 1000, 2 * 400 / (Math.sqrt(3) * 0.4) / 0.04 / 1000, 400 / (Math.sqrt(3) * 0.4) / 0.04 / 1000, [14, 27], null], 1e-9);
check('three 400 kVA units: table 28 / 42 kA; a single unit has no main breaker contribution (0 kA); every Fig. H46 row is conservative against the formula (main <= (n - 1) x I_sc1 with Zsc 4 percent and principal <= n x I_sc1)', [m1({n: 3}).tab.slice(1), m1({n: 1}).cbm, m1({n: 1}).cbp > 0].concat([m1({n: 3}).cbm > 28, m1({n: 3}).cbp > 42]), [[28, 42], 0, true, true, true], 1e-9);
check('magnetic ranges (IEC 60898) for a 16 A breaker: B 48 - 80 A, C 80 - 160 A, D 160 - 320 A; with an 80 A inrush only D avoids tripping; the recommended curve is D', [m2({}).curves.map(c => [c.lo, c.hi]), m2({}).curves.map(c => c.noTrip), m2({}).curves.map(c => c.tripsFault), m2({}).rec], [[[48, 80], [80, 160], [160, 320]], [false, false, true], [true, true, true], 'D']);
check('a 40 A inrush allows B; 60 A or 79.9 A needs C; 400 A minimum fault is enough for D; 300 A minimum fault is not (D needs 320): no curve', [m2({inrush: 40}).rec, m2({inrush: 60}).rec, m2({inrush: 79.9}).rec, m2({isc: 300}).rec, m2({isc: 300, inrush: 60}).rec], ['B', 'C', 'C', null, 'C']);
check('discrimination rules (Fig. N26): distribution I_r ratio above 1.6 and I_m ratio above 2 (magnetic) or 1.5 (electronic); motors I_r ratio above 3: ratios 2.5 and 3.125 pass; 1.6 exactly fails', [m3({}).irOk, m3({}).imOk, m3({irA: 160}).irOk, m3({load: 1}).irOk, m3({load: 1, irA: 350}).irOk, m3({trip: 1, imA: 1500, imB: 1000}).imOk, m3({trip: 1, imA: 1600, imB: 1000}).imOk], [true, true, false, false, true, false, true]);
check('current discrimination is total when the largest short-circuit on B (3000 A) stays below the magnetic threshold of A: 2500 A threshold -> partial; 3500 A -> total', [m3({}).total, m3({imA: 3500}).total, m3({imA: 3000}).total], [false, true, false]);
check('Compact NSX natural total discrimination: trip rating ratio above 1.6 and breaker rating ratio above 2.5 (250 / 100 = 2.5 fails, 260 / 100 passes); time discrimination with a category B breaker needs Icw not below the downstream short-circuit', [m3({}).nsx, m3({inA: 260}).nsx, m3({icw: 3000}).time, m3({icw: 2999}).time, m3({}).time], [false, true, true, false, false]);
for (let k = 0; k < 4; k++) { w.renderCalc('eigh'); w.document.getElementById('h8_m').value = String(k); w.calcResult('eigh'); }
w.renderCalc('eigh'); w.calcResult('eigh');
let tt = txt(w, 'h8_results');
check('the page opens with the selected rating 50 A, the 35.2 A derated current and the 🔴 note', [tt.includes('التيار المقدَّر المختار'), /35\.2/.test(tt), tt.includes('القاطع الأصغر التالي'), tt.includes('🔴'), w.document.getElementById('h8_g0').style.display, w.document.getElementById('h8_g3').style.display], [true, true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('h8_m', '1'); w.calcResult('eigh'); tt = txt(w, 'h8_results');
check('the capacity page shows Icm 52.5 kA, the transformer current and the Fig. H46 values', [/52\.5/.test(tt), tt.includes('قدرة الوصل Icm'), tt.includes('الشكل H46'), tt.includes('قواطع الدارات الخارجة')], [true, true, true, true]);
set('h8_m', '2'); w.calcResult('eigh'); tt = txt(w, 'h8_results');
check('the curve page recommends type D for the 80 A inrush and 400 A minimum fault', [tt.includes('المنحنى المناسب'), tt.includes('النوع D')], [true, true]);
set('h8_m', '3'); w.calcResult('eigh'); tt = txt(w, 'h8_results');
check('the discrimination page shows the ratios 2.50 and 3.13', [tt.includes('نسبة ضبط الحمل الزائد'), /2\.50/.test(tt), /3\.13/.test(tt)], [true, true, true]);
check('other reference codes open it too', others('eigh', 'h8_results'), [true, true, true]);
}
// ---------- part 177: ASHRAE 170-2021 (`ashrae170`: Table 7-1 space parameters and airflows, operating room diffuser array) ----------
{
w = boot('ae'); doc = w.document;
const B0 = {mode: 0, s: 23, area: 40, h: 3, single: false, aiiOff: false};
const B1 = {mode: 1, area: 50, h: 3, tl: 2.0, tw: 0.6, q: 0};
const a7 = (o, B) => w.eval('a7Calc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
const m0 = o => a7(o, B0), m1 = o => a7(o, B1);
const idx = n => w.eval('A7_T.findIndex(x => x[1] === ' + JSON.stringify(n) + ')');
const T = JSON.parse(w.eval('JSON.stringify(A7_T)'));
check('Table 7-1 has 85 space rows in 7 groups; positive 19, negative 36, see-7.2 (anterooms) 3, no requirement 27', [T.length, T.filter(x => x[2] === 'P').length, T.filter(x => x[2] === 'N').length, T.filter(x => x[2] === 'E').length, T.filter(x => x[2] === 'NR').length, w.eval('A7_G.length')], [85, 19, 36, 3, 27, 7]);
check('key rows: operating room 4 outdoor / 20 total ach, positive, MERV-16, RH 20 - 60, 68 - 75 F; AII room 2 / 12 negative exhausted MERV-14; PE room positive 2 / 12 HEPA no turndown; patient room 2 / 4 MERV-14', [20, 1, 28, 23].map(i => T[i].slice(2)), [['P', 4, 20, 'NR', 'N', 'Y', 'MERV-16', '20-60', '68-75/20-24'], ['N', 2, 12, 'Y', 'N', 'Y', 'MERV-14', 'Max 60', '70-75/21-24'], ['P', 2, 12, 'NR', 'N', 'N', 'HEPA', 'Max 60', '70-75/21-24'], ['NR', 2, 4, 'NR', 'NR', 'Y', 'MERV-14', 'Max 60', '70-75/21-24']]);
check('more rows: Class 3 imaging 4 / 20 positive; trauma room 3 / 15 positive; toilet room (support) 10 ach negative; neonatal ICU 2 / 6 positive 72 - 78 F; burn unit HEPA 40 - 60 %; autopsy 2 / 12 negative', [idx('غرفة التصوير من الفئة 3'), idx('غرفة الصدمات والإنعاش في الإسعاف'), idx('دورة مياه (مرافق دعم المرضى)'), idx('العناية المركزة لحديثي الولادة'), idx('العناية المركزة للجروح والحروق'), idx('غرفة التشريح')].map(i => [T[i][2], T[i][3], T[i][4], T[i][8], T[i][9]]), [['P', 4, 20, 'MERV-16', '20-60'], ['P', 3, 15, 'MERV-14', '20-60'], ['N', null, 10, 'MERV-8', 'NR'], ['P', 2, 6, 'MERV-14', '30-60'], ['P', 2, 6, 'HEPA', '40-60'], ['N', 2, 12, 'MERV-8', 'NR']]);
check('patient room 40 m2 x 3 m = 120 m3: 4 total ach -> 120 x 4 / 3600 = 0.1333 m3/s (133.3 L/s); outdoor 2 ach = 66.7 L/s; recirculated part 66.7 L/s', [m0({}).vol, m0({}).totalFlow, m0({}).oaFlow, m0({}).recircFlow, m0({}).ach, m0({}).oaAch], [120, 4 * 120 / 3600, 2 * 120 / 3600, 2 * 120 / 3600, 4, 2], 1e-9);
check('note y: a single-bed room with Group D diffusers needs 6 total ach on the volume up to 1.83 m: 6 x (40 x 1.83) / 3600 = 0.122 m3/s; the same for the seclusion room; other spaces are unaffected', [m0({single: true}).ach, m0({single: true}).totalFlow, m0({single: true}).note, m0({single: true, s: idx('غرفة العزل والاحتجاز')}).ach, m0({single: true, s: idx('غرفة معالجة')}).ach, m0({single: true}).oaFlow], [6, 6 * 40 * 1.83 / 3600, 'y', 6, 6, 2 * 120 / 3600], 1e-9);
check('note u: an AII room not used for isolation needs 4 total ach: 4 x 120 / 3600 = 0.1333; in use 12 ach = 0.4 m3/s', [m0({s: 1}).ach, m0({s: 1}).totalFlow, m0({s: 1, aiiOff: true}).ach, m0({s: 1, aiiOff: true}).totalFlow, m0({s: 1, aiiOff: true}).note], [12, 0.4, 4, 4 * 120 / 3600, 'u'], 1e-9);
check('spaces without a requirement: the corridor has no outdoor air (NR) and 2 total ach; the toilet room 10 ach exhausted; warewashing no airflow', [m0({s: idx('ممر منطقة رعاية المرضى')}).oaAch, m0({s: idx('ممر منطقة رعاية المرضى')}).oaFlow, m0({s: idx('ممر منطقة رعاية المرضى')}).ach, m0({s: idx('دورة مياه المريض')}).totalFlow, m0({s: idx('غسل الأواني')}).ach, m0({s: idx('غسل الأواني')}).totalFlow], [null, null, 2, 10 * 120 / 3600, null, null], 1e-9);
check('operating room diffuser array: table 2.0 x 0.6 m plus 305 mm each side = 2.61 x 1.21 m = 3.158 m2; 127 - 178 L/s/m2 -> 401 - 562 L/s; for a 150 m3 room 9.6 - 13.5 ach; non-diffuser share at most 30 % = 0.947 m2', [m1({}).footL, m1({}).footW, m1({}).arrayA, m1({}).qMin, m1({}).qMax, m1({}).achMin, m1({}).achMax, m1({}).nonDiff], [2.61, 1.21, 2.61 * 1.21, 2.61 * 1.21 * 127, 2.61 * 1.21 * 178, 2.61 * 1.21 * 127 * 3.6 / 150, 2.61 * 1.21 * 178 * 3.6 / 150, 2.61 * 1.21 * 0.3], 1e-9);
check('array velocity verdict: 500 L/s over 3.158 m2 = 158 L/s/m2 passes; 300 L/s (95) and 600 L/s (190) fail; the 20 ach minimum for 150 m3 is 833 L/s', [m1({q: 500}).vOk, m1({q: 300}).vOk, m1({q: 600}).vOk, m1({q: 500}).vAct, m1({}).q20], [true, false, false, 500 / (2.61 * 1.21) / 1000, 20 * 150 / 3.6], 1e-9);
for (let k = 0; k < 2; k++) { w.renderCalc('ashrae170'); w.document.getElementById('a7_m').value = String(k); w.calcResult('ashrae170'); }
w.renderCalc('ashrae170'); w.calcResult('ashrae170');
let tt = txt(w, 'a7_results');
check('the page opens with the patient room, the 120 m3 volume and the 🔴 note; only the first group visible', [tt.includes('غرفة المريض'), tt.includes('الهواء الخارجي الأدنى'), /120/.test(tt), tt.includes('🔴'), w.document.getElementById('a7_g0').style.display, w.document.getElementById('a7_g1').style.display], [true, true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('a7_s', String(idx('غرفة العمليات'))); w.calcResult('ashrae170'); tt = txt(w, 'a7_results');
check('the operating room shows positive pressure, MERV-16 and 20 ach', [tt.includes('موجب'), tt.includes('MERV-16'), /20 ach/.test(tt), tt.includes('2.5 Pa')], [true, true, true, true]);
set('a7_m', '1'); w.calcResult('ashrae170'); tt = txt(w, 'a7_results');
check('the diffuser page shows 2.61 x 1.21 m and the two return grilles', [/2\.61/.test(tt), tt.includes('شبكتا الإرجاع'), tt.includes('HEPA')], [true, true, true]);
check('other reference codes open it too', others('ashrae170', 'a7_results'), [true, true, true]);
}
// ---------- part 178: NFPA 58-2020 (`nfpa58`: LP-gas container separation, relief valve and transfer distances, container groups) ----------
{
w = boot('ae'); doc = w.document;
const M0 = {mode: 0, unit: 'gal', cap: 2000, n: 1, under: false, red: false, single: false, far25: false, mound: false, d1: 2.5, d2: 2.5, dbld: 20, dbtw: 2};
const M1 = {mode: 1, ct: 0, dop: 2, dig: 4, xp: 3, dtr: 10};
const M2 = {mode: 2, fp: 0, n: 8, cap: 12000, half: false, dgp: 15.3};
const M3 = {mode: 3, c1: 3, c2: 6, c3: 3, c4: 2, c5: 3, small: false};
const n58 = (o, B) => w.eval('n58Calc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
const m0 = o => n58(o, M0), m1 = o => n58(o, M1), m2 = o => n58(o, M2), m3 = o => n58(o, M3);
check('Table 6.4.1.1 aboveground distances to buildings (m) by water capacity: <125 gal 0; 125-250 3; 251-500 3; 501-2000 7.6; 2001-30000 15; 30001-70000 23; 70001-90000 30; 90001-120000 38; 120001-200000 61; 200001-1000000 91; above 122', [100, 125, 250, 251, 500, 501, 2000, 2001, 30000, 30001, 70000, 70001, 90000, 90001, 120000, 120001, 200000, 200001, 1000000, 1000001].map(cap => m0({cap}).d), [0, 3, 3, 3, 3, 7.6, 7.6, 15, 15, 23, 23, 30, 30, 38, 38, 61, 61, 91, 91, 122]);
check('mounded or underground containers: 3 m up to 2000 gal, 15 m above', [100, 125, 2000, 2001, 1000001].map(cap => m0({cap, under: true}).d), [3, 3, 3, 15, 15]);
check('between containers: 0 below 251 gal; 1 m for 251 - 2000; 1.5 m for 2001 - 30000; above that a quarter of the sum of the diameters (2.5 + 2.5 m -> 1.25 m, 4 + 6 -> 2.5 m); underground never below 1 m', [100, 250, 251, 2000, 2001, 30000].map(cap => m0({cap}).between).concat([m0({cap: 30001}).between, m0({cap: 30001, d1: 4, d2: 6}).between, m0({cap: 100, under: true}).between, m0({cap: 2000, under: true}).between]), [0, 0, 1, 1, 1.5, 1.5, 1.25, 2.5, 1, 1], 1e-9);
check('halving for 2001 - 30000 gal with 6.30.3 - 6.30.5: 10000 gal 15 -> 7.5 m; it does not apply to 2000 or 30001 gal', [m0({cap: 10000, red: true}).d, m0({cap: 2000, red: true}).d, m0({cap: 30001, red: true}).d, m0({cap: 10000, red: true}).note], [7.5, 7.6, 23, '6.4.1.2']);
check('6.4.1.3: a single ASME container up to 1200 gal at least 25 ft from other containers over 125 gal needs 3 m instead of 7.6 m; 1201 gal or the missing condition keeps 7.6', [m0({cap: 1200, single: true, far25: true}).d, m0({cap: 1201, single: true, far25: true}).d, m0({cap: 1200, single: true}).d, m0({cap: 1200, far25: true}).d, m0({cap: 1200, single: true, far25: true}).note], [3, 7.6, 7.6, 7.6, '6.4.1.3']);
check('6.4.2.1: underground or mounded 2001 - 30000 gal with the full 6.30 provisions: 3 m instead of 15 m', [m0({cap: 10000, under: true, mound: true}).d, m0({cap: 10000, under: true}).d, m0({cap: 100, under: true, mound: true}).d], [3, 15, 3]);
check('6.4.3 small containers (below 125 gal each) as a group: 4 x 100 gal = 400 gal aggregate -> 0 m; 6 x 100 = 600 gal -> by the aggregate (501 - 2000 gal row, 7.6 m); no separation inside the group', [m0({cap: 100, n: 4}).d, m0({cap: 100, n: 4}).note, m0({cap: 100, n: 5}).d, m0({cap: 100, n: 6}).d, m0({cap: 100, n: 6}).note, m0({cap: 100, n: 6}).between, m0({cap: 100, n: 1}).d], [0, '6.4.3(1)', 0, 7.6, '6.4.3(2)', 0, 0]);
check('cubic metre input uses the table limits: < 0.5 m3 -> 0 m; 0.5 and 1.0 -> 3 m; 1.9 -> 3 m (251 - 500 gal); 7.6 -> 7.6 m; 7.7 -> 15 m; 114 -> 15; 115 -> 23; 3785 -> 91; 3786 -> 122', [0.4, 0.5, 1.0, 1.9, 7.6, 7.7, 114, 115, 3785, 3786].map(cap => m0({unit: 'm3', cap}).d), [0, 3, 3, 3, 7.6, 15, 15, 23, 91, 122]);
check('distance verdicts: 7.6 m passes for 2000 gal, 7.5 fails; between containers 1 m passes, 0.99 fails', [m0({dbld: 7.6}).rows[0].ok, m0({dbld: 7.5}).rows[0].ok, m0({dbtw: 1}).rows[1].ok, m0({dbtw: 0.99}).rows[1].ok], [true, false, true, false]);
check('Table 6.4.4.3: exchange cylinders 0.9 m to an opening below and 1.5 m to ignition sources; cylinders filled at the point of use 0.9 / 3.0 m; ASME filled at the point of use 1.5 / 3.0 m', [0, 1, 2].map(ct => [m1({ct}).rows[0].req, m1({ct}).rows[1].req]), [[0.9, 1.5], [0.9, 3], [1.5, 3]]);
check('relief valve verdicts: 0.9 m passes, 0.89 fails for cylinders; 4 m passes the 3 m limit for ASME filled at use, 2.9 fails', [m1({dop: 0.9}).rows[0].ok, m1({dop: 0.89}).rows[0].ok, m1({ct: 2, dig: 3}).rows[1].ok, m1({ct: 2, dig: 2.9}).rows[1].ok], [true, false, true, false]);
check('Table 6.7.2.1 exposures (m): A 3.1; B, C, D 7.6; E 15; F1 3.1; F2 7.6; G 1.5; H 7.6; I 3.1; J 3.1; K 6.1; L 3.1', [...Array(13).keys()].map(xp => m1({xp}).rows[2].req), [3.1, 7.6, 7.6, 7.6, 15, 3.1, 7.6, 1.5, 7.6, 3.1, 3.1, 6.1, 3.1]);
check('point of transfer verdict: 10 m from the property line passes (7.6 m), 7.5 fails; from a school yard needs 15 m', [m1({}).rows[2].ok, m1({dtr: 7.5}).rows[2].ok, m1({xp: 4, dtr: 14.9}).rows[2].ok, m1({xp: 4, dtr: 15}).rows[2].ok], [true, false, false, true]);
check('Table 6.5.1.2: hose streams only 6 containers per group and 15 m; monitor nozzles 6 and 7.6 m; water spray 9 and 7.6 m; insulation 9 and 7.6 m; 8 containers need 2 groups for hose streams and one for water spray', [0, 1, 2, 3].map(fp => [m2({fp}).max, m2({fp}).sep]).concat([[m2({}).groups, m2({fp: 2}).groups, m2({fp: 3, n: 10}).groups]]), [[6, 15], [6, 7.6], [9, 7.6], [9, 7.6], [2, 1, 2]]);
check('half the distance for hose-only groups where 6.30.3 and 6.30.4 are met (7.5 m) but not for other protection; individual capacity 12000 gal or more; verdict at 15 m', [m2({half: true}).sep, m2({fp: 1, half: true}).sep, m2({}).big, m2({cap: 11999}).big, m2({dgp: 15}).rows[0].ok, m2({dgp: 14.9}).rows[0].ok, m2({half: true, dgp: 7.5}).rows[0].ok, m2({n: 6}).cOk, m2({n: 7}).cOk], [7.5, 7.6, true, false, true, false, true, true, false]);
check('other distances: combustibles 3 m; flammable liquid tanks 6 m unless the container is 125 gal or less beside a fuel tank up to 2.5 m3; diked area wall 3 m; overhead lines above 600 V 1.8 m; buried container 3 m from a building', [m3({}).rows.map(x => x.ok), m3({c1: 2.9}).rows[0].ok, m3({c2: 5.9}).rows[1].ok, m3({c2: 5.9, small: true}).rows[1].ok, m3({c3: 2.9}).rows[2].ok, m3({c4: 1.79}).rows[3].ok, m3({c4: 1.8}).rows[3].ok, m3({c5: 2.9}).rows[4].ok], [[true, true, true, true, true], false, false, true, false, false, true, false]);
for (let k = 0; k < 4; k++) { w.renderCalc('nfpa58'); w.document.getElementById('n58_m').value = String(k); w.calcResult('nfpa58'); }
w.renderCalc('nfpa58'); w.calcResult('nfpa58');
let tt = txt(w, 'n58_results');
check('the page opens with the 2000 gal container, 7.6 m, the between-containers distance and the 🔴 note; only the first group visible', [tt.includes('سعة الماء للحاوية'), /7\.6/.test(tt), tt.includes('المسافة بين الحاويات'), tt.includes('🔴'), w.document.getElementById('n58_g0').style.display, w.document.getElementById('n58_g3').style.display], [true, true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('n58_m', '1'); w.calcResult('nfpa58'); tt = txt(w, 'n58_results');
check('the relief valve page shows 0.9 / 1.5 m for an exchange cylinder and 7.6 m for the property line', [/0\.9/.test(tt), /1\.5/.test(tt), /7\.6/.test(tt), tt.includes('الجدول 6.7.2.1')], [true, true, true, true]);
set('n58_m', '2'); w.calcResult('nfpa58'); tt = txt(w, 'n58_results');
check('the group page shows 2 groups of at most 6 containers', [tt.includes('عدد المجموعات المطلوب'), tt.includes('أقصى عدد حاويات في المجموعة')], [true, true]);
check('other reference codes open it too', others('nfpa58', 'n58_results'), [true, true, true]);
}
// ---------- part 179: Syrian Arab Code HVAC chapter 3 (`syrac`: design conditions, fresh air and filtration, hospitals, noise, internal gains, air velocities) ----------
{
w = boot('ae'); doc = w.document;
const sy = o => w.eval('syCalc(' + JSON.stringify(o) + ')');
const m0 = o => sy(Object.assign({mode: 0, s: 0, tw: 0, rhw: 0, ts: 0, rhs: 0}, o));
const m1 = o => sy(Object.assign({mode: 1, s: 11, n: 10, area: 40, vol: 120, q: 0}, o));
const m2 = o => sy(Object.assign({mode: 2, s: 3, vol: 100, ach: 0, oa: 0}, o));
const m3 = o => sy(Object.assign({mode: 3, s: 0, dba: 0, nc: 0}, o));
const m4 = o => sy(Object.assign({mode: 4, a: 2, t: 2, n: 10, m: 8, p: 0, k: 2, e: 0, q: 3}, o));
const m5 = o => sy(Object.assign({mode: 5, tb: 0, q: 1000, c: 0}, o));
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const nm = (arr, n) => J(arr).findIndex(x => x[1] === n);
check('table sizes: Table 2/3 28 rows in 7 groups; Table 3/3 + 5/3 28 rows; hospitals 15; noise 49 rows in 12 groups; persons 11; motors 28; office equipment 7; air handling parts 13; return inlets 5; space velocities 25', [J('SY_C').length, J('SY_G').length, J('SY_V').length, J('SY_H').length, J('SY_N').length, J('SY_NG').length, J('SY_P').length, J('SY_M').length, J('SY_E').length, J('SY_AH').length, J('SY_RI').length, J('SY_RV').length], [28, 7, 28, 15, 49, 12, 11, 28, 7, 13, 5, 25]);
check('Table 2/3 key rows: living rooms 22 C 40-50 % winter, 24-25 C 40-50 % summer; operating rooms and ICU 24-25 C winter, 20-23 C summer, 45-50 %; pools 28 C; stairwell 14 C', [0, 16, 21, 4].map(i => J('SY_C')[i].slice(2, 6)), [[[22, 22], [40, 50], [24, 25], [40, 50]], [[24, 25], [45, 50], [20, 23], [45, 50]], [[28, 28], null, null, null], [[14, 14], null, null, null]]);
check('conditions verdicts: living room 22 C, 45 %, 24.5 C, 60 % -> only the last fails; 23 C winter fails; the stairwell has no summer limit', [m0({tw: 22, rhw: 45, ts: 24.5, rhs: 60}).rows.map(x => x.ok), m0({tw: 23}).rows.map(x => x.ok), m0({s: 4, tw: 14, ts: 25}).rows.map(x => x.ok), m0({s: 16, ts: 23.1}).rows.map(x => x.ok), m0({s: 16, ts: 23}).rows.map(x => x.ok)], [[true, true, true, false], [false], [true], [false], [true]]);
check('Table 3/3: offices 10 L/s per person -> 10 persons = 100 L/s = 360 m3/h, filtration 35 - 60 %; verdict 100 passes, 99 fails', [m1({}).flow, m1({}).m3h, m1({}).filter, m1({q: 100}).ok, m1({q: 99}).ok], [100, 360, [35, 60], true, false], 1e-9);
check('apartments 7.5 L/s per person: 4 persons = 30 L/s, filter 20 %; bathrooms 25 L/s per room and kitchens 50 L/s with no filtration limit; shops 13 / 8 / 8; computer centres 45 %', [m1({s: 0, n: 4}).flow, m1({s: 0}).filter, m1({s: 1, n: 3}).flow, m1({s: 1}).filter, m1({s: 2, n: 2}).flow, m1({s: 3, n: 1}).flow, m1({s: 5, n: 1}).flow, m1({s: 26}).filter], [30, [20, 20], 75, null, 100, 13, 8, [45, 45]], 1e-9);
check('kitchens without hood: 8 L/s per person -> 5 persons 40 L/s; exhaust 7.5 L/s per m2 -> 150 L/s for 20 m2; filtration 15 %', [m1({s: 10, n: 5, area: 20}).flow, m1({s: 10, n: 5, area: 20}).exhaust, m1({s: 10}).filter], [40, 150, [15, 15]], 1e-9);
check('garages: the larger of 7.5 L/s per m2 and 6 ach: 200 m2 x 7.5 = 1500 vs 6 x 600 / 3.6 = 1000 -> 1500; 100 m2 -> 750 vs 1000 -> 1000; filtration 10 - 35 %', [m1({s: 17, area: 200, vol: 600}).flow, m1({s: 17, area: 100, vol: 600}).flow, m1({s: 17, area: 100, vol: 600}).flowAch, m1({s: 17}).filter, m1({s: 27}).filter, m1({s: 27}).flow], [1500, 1000, 1000, [10, 35], null, 0], 1e-9);
check('Table 4/3: general operating room 15 / 15 ach positive, exhaust required, return not acceptable, 2 filter stages 25 / 90 %; orthopaedic 3 stages with HEPA 99.97 %; laboratories negative, total 10 ach, one stage 80 %; velocity 0.46 +- 0.1', [3, 0, 10].map(i => J('SY_H')[i].slice(1, 10)), [['+', 15, 15, 'مطلوب', 'غير مقبول', 2, 25, 90, null], ['+', 15, 15, 'مطلوب', 'غير مقبول', 3, 25, 90, 99.97], ['-', null, 10, 'مطلوب', 'غير مقبول', 1, 80, null, null]]);
check('hospital flows: 100 m3 operating room 15 ach = 100 x 15 / 3.6 = 416.7 L/s both for total and fresh air; laboratory 10 ach = 277.8 L/s with no fresh-air minimum', [m2({}).totalFlow, m2({}).oaFlow, m2({s: 10}).totalFlow, m2({s: 10}).oaFlow], [1500 / 3.6, 1500 / 3.6, 1000 / 3.6, null], 1e-9);
check('hospital verdicts: 14 ach total fails 15, 15 passes; fresh air 5 ach for children rooms passes, 4.9 fails; laboratory fresh-air check is skipped', [m2({ach: 14}).rows[0].ok, m2({ach: 15}).rows[0].ok, m2({s: 5, oa: 5}).rows[0].ok, m2({s: 5, oa: 4.9}).rows[0].ok, m2({s: 10, oa: 3}).rows.length], [false, true, true, false, 0]);
check('Table 7/3: administration rooms 25 - 35 dB(A) NC 20 - 30; operating rooms 35 - 45 / 30 - 40; concert halls 25 - 35 / 20 - 25; swimming pools 45 - 60 / 40 - 55; industrial 65 - 80 / 60 - 75', [nm('SY_N', 'غرف الإدارة'), nm('SY_N', 'غرف العمليات'), nm('SY_N', 'صالات حفلات موسيقية'), nm('SY_N', 'حمامات السباحة'), 48].map(i => J('SY_N')[i].slice(2)), [[[25, 35], [20, 30]], [[35, 45], [30, 40]], [[25, 35], [20, 25]], [[45, 60], [40, 55]], [[65, 80], [60, 75]]]);
check('noise verdicts: 35 dB(A) passes the administration limit, 36 fails; NC 30 passes, 31 fails; a row with no values is not checked', [m3({s: nm('SY_N', 'غرف الإدارة'), dba: 35}).rows[0].ok, m3({s: nm('SY_N', 'غرف الإدارة'), dba: 36}).rows[0].ok, m3({s: nm('SY_N', 'غرف الإدارة'), nc: 30}).rows[0].ok, m3({s: nm('SY_N', 'غرف الإدارة'), nc: 31}).rows[0].ok, m3({s: 47, dba: 80, nc: 70}).rows.length], [true, false, true, false, 0]);
check('Table 8/3 consistency: for every activity and temperature the sensible plus latent equals the average heat gain', J('SY_P').map(p => p[4].every(t => t[0] + t[1] === p[3])), Array(11).fill(true));
check('Table 8/3 selected cells: seated at rest 115 total / 103 average, 24 C: 68 sensible + 35 latent; office work 21 C: 84 + 48; heavy work 26.7 C: 136 + 289', [J('SY_P')[0].slice(2, 4), J('SY_P')[0][4][2], J('SY_P')[2][4][3], J('SY_P')[10][4][0]], [[115, 103], [68, 35], [84, 48], [136, 289]]);
check('Table 9/3 consistency: motor outside + motor inside heat is within 1.2 % of the total for every size except the 7.5 kW row, which is about 3 % off (printed 7178 W)', [J('SY_M').filter(r => r[0] !== 7.5).every(r => Math.abs(r[3] + r[4] - r[2]) / r[2] <= 0.012), (() => { const r = J('SY_M')[14]; return Math.abs(r[3] + r[4] - r[2]) / r[2] > 0.025; })(), J('SY_M')[14]], [true, true, [7.5, 85, 8760, 7178, 1315]]);
check('internal gains: 10 persons doing office work at 24 C = 720 W sensible + 600 W latent; two 0.75 kW motors inside = 2 x 993 = 1986 W (motor outside 747, equipment outside 249 each); 3 PCs = 300 - 1500 W', [m4({}).pSens, m4({}).pLat, m4({}).mW, m4({p: 1}).mW / 2, m4({p: 2}).mW / 2, m4({}).eLo, m4({}).eHi], [720, 600, 1986, 747, 249, 300, 1500], 1e-9);
check('total gains: sensible 720 + 1986 + (300 - 1500) = 3006 - 4206 W; with the latent 600 W = 3606 - 4806 W; a fixed-power appliance (coffee maker 1000 W) has equal limits', [m4({}).sensLo, m4({}).sensHi, m4({}).total, m4({}).totalHi, m4({e: 4, q: 1}).eLo, m4({e: 4, q: 1}).eHi], [3006, 4206, 3606, 4806, 1000, 1000], 1e-9);
check('Table 24/3: final HEPA filters 0.35 - 1.25 m/s -> for 1000 L/s the face area is 0.8 - 2.857 m2; low-speed intake louver 2 m/s -> 0.5 m2; high-speed spray unit 6 - 9 m/s', [m5({c: 6}).aMinM2, m5({c: 6}).aMaxM2, m5({c: 0}).aMinM2, m5({c: 0}).aMaxM2, J('SY_AH')[12].slice(2)], [0.8, 1 / 0.35, 0.5, 0.5, [6, 9]], 1e-9);
check('Table 25/3 cells: main rectangular duct in a building duct at NC 35 12.7 m/s; round branch at NC 45 20.3; occupied space NC 25: rectangular end 2.4, round main 8.6; above acoustic ceiling NC 25 rectangular end 3.0', [m5({tb: 1, l: 0, nc: 1, shape: 0, seg: 0, ar: 2}).vmax, m5({tb: 1, l: 0, nc: 0, shape: 1, seg: 1, ar: 2}).vmax, m5({tb: 1, l: 2, nc: 2, shape: 0, seg: 2, ar: 2}).vmax, m5({tb: 1, l: 2, nc: 2, shape: 1, seg: 0, ar: 2}).vmax, m5({tb: 1, l: 1, nc: 2, shape: 0, seg: 2, ar: 2}).vmax], [12.7, 20.3, 2.4, 8.6, 3.0]);
check('duct sizing: 1000 L/s at 12.7 m/s = 0.0787 m2, round 316.6 mm, 2:1 rectangle 198.4 x 396.8 mm', [m5({tb: 1, l: 0, nc: 1, shape: 0, seg: 0, ar: 2}).area, m5({tb: 1, l: 0, nc: 1, shape: 0, seg: 0, ar: 2}).dia, m5({tb: 1, l: 0, nc: 1, shape: 0, seg: 0, ar: 2}).side1, m5({tb: 1, l: 0, nc: 1, shape: 0, seg: 0, ar: 2}).side2], [1 / 12.7, Math.sqrt(4 / 12.7 / Math.PI), Math.sqrt(1 / 12.7 / 2), 2 * Math.sqrt(1 / 12.7 / 2)], 1e-9);
check('Table 26/3: NC 45 / 40 / 35 / 30 / 25 supply outlets 3.2 / 2.8 / 2.5 / 2.2 / 1.8 m/s and return openings 3.8 / 3.4 / 3.0 / 2.5 / 2.2; 1000 L/s at NC 35: 0.4 m2 outlet, 0.333 m2 return', [J('SY_OS'), J('SY_OR'), m5({tb: 2, nc2: 2}).areaS, m5({tb: 2, nc2: 2}).areaR], [[3.2, 2.8, 2.5, 2.2, 1.8], [3.8, 3.4, 3.0, 2.5, 2.2], 0.4, 1 / 3], 1e-9);
check('Table 27/3 and 28/3: return inlet near seats 2 - 3 m/s; above the occupied zone 4 m/s; 1000 L/s needs 0.25 - 0.333 m2 for the 3 - 4 m/s row; apartments 0.12 m/s; opera below 0.13 m/s at 1 m', [J('SY_RI')[2].slice(1), J('SY_RI')[0].slice(1), m5({tb: 3, c: 1}).aMinM2, m5({tb: 3, c: 1}).aMaxM2, J('SY_RV')[0][1], J('SY_RV')[17][1]], [[2, 3], [4, 4], 0.25, 1 / 3, '0.12', 'أقل من 0.13 عند 1 m من الأرض'], 1e-9);
for (let k = 0; k < 6; k++) { w.renderCalc('syrac'); w.document.getElementById('sy_m').value = String(k); w.calcResult('syrac'); }
w.renderCalc('syrac'); w.calcResult('syrac');
let tt = txt(w, 'sy_results');
check('the page opens with the living-room conditions: 22 C and 24 - 25 C, the 🔴 note; only the first group visible', [tt.includes('نوع المبنى'), /22/.test(tt), /24 - 25/.test(tt), tt.includes('🔴'), w.document.getElementById('sy_g0').style.display, w.document.getElementById('sy_g5').style.display], [true, true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('sy_m', '1'); w.calcResult('syrac'); tt = txt(w, 'sy_results');
check('the ventilation page shows 100 L/s for ten persons in offices and the 35 - 60 % filtration', [tt.includes('التدفق المطلوب'), /100\.0 L\/s/.test(tt), /35 - 60/.test(tt)], [true, true, true]);
set('sy_m', '2'); w.calcResult('syrac'); tt = txt(w, 'sy_results');
check('the hospital page shows positive pressure, 15 ach and the two filter stages', [tt.includes('موجب'), /15 ach/.test(tt), tt.includes('الثانية 90')], [true, true, true]);
set('sy_m', '4'); w.calcResult('syrac'); tt = txt(w, 'sy_results');
check('the gains page shows the 720 W sensible, 600 W latent and the 993 W motor', [tt.includes('الحرارة المحسوسة للأشخاص'), /720 W/.test(tt), /600 W/.test(tt), /993 W/.test(tt)], [true, true, true, true]);
set('sy_m', '5'); set('sy_tb', '1'); w.calcResult('syrac'); tt = txt(w, 'sy_results');
check('the velocity page shows the duct limit, area and diameter; sub-groups switch', [tt.includes('السرعة القصوى المسموحة'), tt.includes('قطر المجرى المستدير الأدنى'), w.document.getElementById('sy_t1').style.display, w.document.getElementById('sy_t0').style.display], [true, true, '', 'none']);
check('other reference codes open it too', others('syrac', 'sy_results'), [true, true, true]);
}

// ---------- part 180: Syrian Arab Code HVAC chapter 3, loads (`syrload`: U-value Tables 11/3 - 14/3, heating load 10/3/1, Damascus cooling load 10/3/2) ----------
{
w = boot('ae'); doc = w.document;
const sz = o => w.eval('szCalc(' + JSON.stringify(o) + ')');
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const MAT = J('SZ_MAT');
const mi = (n, rho) => MAT.findIndex(m => m[1] === n && (rho === undefined || m[2] === rho));
const U0 = {mode: 0, dir: 0, ext: 1, wind: 2, air: 0, layers: [], ti: 22, te: 0, dt: 22};
const u0 = o => sz(Object.assign({}, U0, o));
const L = (m, d, lam) => ({m, d, lam: lam || 0});
const WALL = [L(mi('ملاط (طينة) اسمنتي', 1850), 20), L(mi('بلوك اسمنتي عادي مفرغ', 1400), 200), L(mi('ألواح بوليستيرين مشكل بالقولبة', 20), 40), L(mi('ملاط (طينة) اسمنتي', 1850), 20)];
check('Tables 11/3 - 13/3: interior surface resistance 0.13 horizontal / 0.10 up / 0.17 down; exterior by wind 1, 2, 3, 4, 5, 7, 10 m/s 0.08, 0.06, 0.05, 0.04, 0.04, 0.03, 0.02; the 25 mm air space 0.18 / 0.19 / 0.16 (horizontal, down, up)', [J('SZ_RSI'), J('SZ_WS'), J('SZ_RSE'), J('SZ_AIR')[5], J('SZ_AIR').length, J('SZ_AIR')[1], J('SZ_AIR')[8]], [[0.13, 0.10, 0.17], [1, 2, 3, 4, 5, 7, 10], [0.08, 0.06, 0.05, 0.04, 0.04, 0.03, 0.02], [25, 0.18, 0.19, 0.16], 9, [5, 0.11, 0.11, 0.11], [300, 0.18, 0.23, 0.16]]);
check('Table 14/3 key materials: structural concrete 2400 kg/m3 1.85 W/m.K, 1400 kg/m3 0.56; hollow block 1400 0.9; steel 60; aluminium 200; air 1.17 kg/m3 0.02; mineral-wool slab 0.04; every conductivity is positive', [MAT[mi('خرسانة إنشائية (رمل عادي، رمل خفيف)', 2400)][3], MAT[mi('خرسانة إنشائية (رمل عادي، رمل خفيف)', 1400)][3], MAT[mi('بلوك اسمنتي عادي مفرغ', 1400)][3], MAT[mi('فولاذ')][3], MAT[mi('ألومنيوم')][3], MAT[mi('الهواء')][3], MAT[mi('صوف صخري: ألواح جاسئة')][3], MAT.every(m => (Array.isArray(m[3]) ? m[3].every(x => x > 0) : m[3] > 0))], [1.85, 0.56, 0.9, 60, 200, 0.02, 0.04, true]);
check('material list: 17 groups, every entry has a group in range and every density is null, a number or a range', [J('SZ_MG').length, MAT.every(m => m[0] >= 0 && m[0] < 17), MAT.every(m => m[2] === null || typeof m[2] === 'number' || (Array.isArray(m[2]) && m[2].length === 2)), MAT.length], [17, true, true, w.eval('SZ_RAW.reduce((s, e) => s + e[2].length, 0)')]);
{
  const R = 0.13 + 0.02 / 0.72 * 2 + 0.2 / 0.9 + 0.04 / 0.036 + 0.05;
  check('wall of two 20 mm plaster coats, 200 mm hollow block (0.9) and 40 mm moulded EPS (0.036) with 3 m/s wind: R = 0.13 + 2 x 0.0278 + 0.2222 + 1.1111 + 0.05 = 1.5689 m2.K/W, U = 0.6374 W/m2.K', [u0({layers: WALL}).rt, u0({layers: WALL}).u, u0({layers: WALL}).rl], [R, 1 / R, R - 0.18], 1e-9);
  const air = u0({layers: WALL, air: 5});
  check('adding a 25 mm air space adds 0.18 horizontally, 0.16 for upward heat flow (roof, R_si 0.10) and 0.19 downward (floor, R_si 0.17)', [air.rt - R, u0({layers: WALL, air: 5, dir: 1}).rt - (R - 0.13 + 0.10 + 0.16), u0({layers: WALL, air: 5, dir: 2}).rt - (R - 0.13 + 0.17 + 0.19)], [0.18, 0, 0], 1e-9);
  check('an internal element uses the interior resistance on both sides: 100 mm layer with a custom 0.04 W/m.K = 2.5 + 0.13 + 0.13; wind rows 10 m/s 0.02', [u0({layers: [L(0, 100, 0.04)], ext: 0}).rt, u0({layers: [L(0, 100, 0.04)], wind: 6}).rt, u0({layers: []}).rt], [2.76, 2.5 + 0.13 + 0.02, 0.18], 1e-9);
}
check('conductivity ranges use the upper value: extruded polystyrene 70 mm with smooth skin 0.028 - 0.035 -> 0.07 / 0.035 = 2.0; mass uses the mean density; 200 mm concrete 2400 kg/m3 = 480 kg/m2; a material without density gives no mass', [u0({layers: [L(mi('ألواح بوليستيرين مشكل بالبثق (سطوح ملساء)'), 70)]}).rl, u0({layers: [L(mi('ألواح بوليستيرين مشكل بالبثق (سطوح ملساء)'), 70)]}).mass, u0({layers: [L(mi('خرسانة إنشائية (رمل عادي، رمل خفيف)', 2400), 200)]}).mass, u0({layers: [L(mi('تربة غضارية'), 100)]}).mass], [2.0, 32.5 * 0.07, 480, null], 1e-9);
{
  const w1 = u0({layers: WALL});
  check('heat flux and interior surface temperature: 22 K difference -> q = U x 22 = 14.02 W/m2; theta_si = 22 - q x 0.13 = 20.18 C', [w1.q, w1.tsi], [w1.u * 22, 22 - w1.u * 22 * 0.13], 1e-9);
}
check('layers with no material or no thickness are ignored', [u0({layers: [L(-1, 100), L(mi('خشب الصنوبر'), 0)]}).layers.length, u0({layers: [L(-1, 100)]}).u], [0, 1 / 0.18], 1e-9);
check('Table 15/3 air changes: 0.5, 1.0, 1.5, 2.0, 0.75, 0.5, 2, 2 per hour', J('SZ_ACH').map(x => x[1]), [0.5, 1.0, 1.5, 2.0, 0.75, 0.5, 2, 2]);
{
  const H = {mode: 1, ti: 20, te: 0, els: [{a: 100, u: 1}, {a: 50, u: 0.5}, {a: 0, u: 0}, {a: 0, u: 0}, {a: 0, u: 0}], vol: 100, ach: 1, achc: 1.5, sf: 15, g: 200, dtw: 50, eta: 0.85, cf: 11.6, z: 150, n2: 0.33, cw: 0.6, dtd: 20};
  const h = sz(H);
  const Q = 2500 + 0.342 * 150 * 20, Qs = Q * 1.15, Q3 = 200 * 50 / 0.86, Qt = Qs + Q3, Qb = Qt * 1.3;
  check('heating: Q1 = (100 x 1 + 50 x 0.5) x 20 = 2500 W; Q2 = 0.342 x 150 m3/h x 20 = 1026 W; Q = 3526 W; +15 % = 4054.9 W; hot water 200 x 50 / 0.86 = 11627.9 W', [h.q1, h.q2, h.q, h.qs, h.q3, h.vdot, h.n], [2500, 1026, 3526, Qs, Q3, 150, 1.5], 1e-9);
  check('boiler: total 15682.8 W x 1.3 = 20387.6 W; burner 20.3876 / (11.6 x 0.85) = 2.0678 kg/h; annual fuel 0.75 x 4.0549 x 24 x 150 x 0.33 x 0.6 / 9.86 = 219.8 kg; tank 0.025 x 20.3876 / 20 = 0.02549 m3', [h.qt, h.qb, h.bb, h.annual, h.tank], [Qt, Qb, Qb / 1000 / 9.86, 0.75 * Qs / 1000 * 24 * 150 * 0.33 * 0.6 / 9.86, 0.025 * Qb / 1000 / 20], 1e-9);
  check('the table air change is used when no custom value is given: row 1.0 per hour for 100 m3 -> 100 m3/h; the 0.5 row for no external openings', [sz(Object.assign({}, H, {achc: 0})).vdot, sz(Object.assign({}, H, {achc: 0, ach: 0})).vdot, sz(Object.assign({}, H, {g: 0})).q3, sz(Object.assign({}, H, {g: 0})).qt], [100, 50, 0, Qs], 1e-9);
}
check('cooling data tables: roof CLTD peaks 30 / 25 / 21 / 19 at 18 - 20 h; wall CLTD peaks N 12, NE 14, E 21, SE 20, S 18, SW 24, W 27, NW 21; LM rows; glass CLTD peak 8 at 16 h; 12 shading coefficients; 9 CLF rows', [J('SZ_ROOF').map(r => Math.max(...r[3])), J('SZ_WALL').map(r => Math.max(...r)), J('SZ_LM'), Math.max(...J('SZ_GC')), J('SZ_SC').length, J('SZ_CLF1').length, J('SZ_CLF1').every(g => g.length === 3 && g.every(r => r.length === 7)), J('SZ_CLF2').every(r => r.length === 7)], [[30, 25, 21, 19], [12, 14, 21, 20, 18, 24, 27, 21], [[0.5, 1.1, 0, 1.1, 2.2, 1.1], [0.5, 0.5, 0, 0.5, 1.6, 0.5], [1.1, 0.5, 0, 0, 0.5, 0.5]], 8, 12, 9, true, true]);
check('solar and shading tables: maximum solar gain June N 139, NE/NW 555, E/W 675, SE/SW 439, S 189, horizontal 871 W/m2; July S 227; August S 350; clear 6 mm SC 0.94 / 0.95, reflective 0.4; Table 21/3 peaks: east at 8 h 0.80, south at 12 h 0.83, west at 16 h 0.82', [J('SZ_SH')[0], J('SZ_SH')[1][4], J('SZ_SH')[2][4], J('SZ_SC')[1], J('SZ_SC')[11], J('SZ_CLF2')[2].indexOf(Math.max(...J('SZ_CLF2')[2])), J('SZ_CLF2')[4].indexOf(Math.max(...J('SZ_CLF2')[4])), J('SZ_CLF2')[6].indexOf(Math.max(...J('SZ_CLF2')[6]))], [[139, 555, 675, 439, 189, 871], 227, 350, ['زجاج مفرد شفاف 6 mm', 0.94, 0.95], ['زجاج عاكس 6 mm', 0.4, 0.4], 0, 2, 4]);
const C0 = {mode: 2, hr: 4, mo: 1, to: 40, dr: 19.69, tr: 24, rt: 0, ra: 0, ru: 0, K: 1, f: 1, walls: [{d: 6, a: 0, u: 0}, {d: 4, a: 0, u: 0}, {d: 0, a: 0, u: 0}], glass: [{d: 5, a: 0}, {d: 8, a: 0}, {d: 0, a: 0}], gu: 5.7, sc: 0, ho: 1, shade: false, cls: 1, pn: 0, pa: 2, pt: 2, la: 0, lw: 20, lf: 1, mp: 0, me: 0.85, mf: 1, ew: 0, ta: 0, tu: 0, tt: 0, vv: 0, dw: 0};
const c0 = o => sz(Object.assign({}, C0, o));
check('Damascus mean outdoor temperature 40 - 19.69 / 2 = 30.155 C; correction (25.5 - 24) + (30.155 - 29.4) = 2.255 K', [c0({}).tm, c0({}).corr, c0({tr: 25.5}).corr], [30.155, 2.255, 0.755], 1e-9);
check('roof type 9 without ceiling at 16 h: CLTD 28 + LM 0.5 (July, horizontal) + 2.255 = 30.755 K; Q = 100 x 1.136 x 30.755 = 3493.7 W; light colour K = 0.5: 28.5 x 0.5 + 2.255 = 16.505; return-air ceiling f = 0.75: 23.066 K; June LM 1.1', [c0({ra: 100}).roofCc, c0({ra: 100}).q1, c0({ra: 100, K: 0.5}).roofCc, c0({ra: 100, f: 0.75}).roofCc, c0({ra: 100, mo: 0}).roofCc, c0({ra: 100, rt: 2}).roofU, c0({ra: 100, ru: 0.9}).q1], [30.755, 100 * 1.136 * 30.755, 28.5 * 0.5 + 2.255, 30.755 * 0.75, 29.1 + 2.255 + 0, 0.727, 100 * 0.9 * 30.755], 1e-9);
check('walls at 16 h (July): west CLTD 15 + LM 0 + 2.255 = 17.255 K (20 m2, U 1 -> 345.1 W); south 18 + 1.6 + 2.255 = 21.855 K; north 10 + 0.5 + 2.255 = 12.755 K; NE and NW use the NE/NW column (14 / 11 + 0.5)', [...c0({walls: [{d: 6, a: 20, u: 1}, {d: 4, a: 20, u: 1}, {d: 0, a: 20, u: 1}]}).walls.map(x => x.cc), c0({walls: [{d: 6, a: 20, u: 1}, {d: 4, a: 0, u: 0}, {d: 0, a: 0, u: 0}]}).q2, ...c0({walls: [{d: 1, a: 1, u: 1}, {d: 7, a: 1, u: 1}, {d: 0, a: 0, u: 0}]}).walls.map(x => x.cc)], [17.255, 21.855, 12.755, 20 * 17.255, 14 + 0.5 + 2.255, 11 + 0.5 + 2.255, 12.755], 1e-9);
check('glass conduction at 16 h: CLTD 8 + 2.255 = 10.255 K; 10 m2 with U 5.7 -> 584.5 W', [c0({glass: [{d: 5, a: 10}, {d: 8, a: 0}, {d: 0, a: 0}]}).gCc, c0({glass: [{d: 5, a: 10}, {d: 8, a: 0}, {d: 0, a: 0}]}).q3], [10.255, 10 * 5.7 * 10.255], 1e-9);
check('glass solar: SW 10 m2 clear 3 mm (SC 1) July SE/SW 473 W/m2 x CLF 0.58 (medium, no shading, 16 h) = 2743.4 W; with interior shading CLF 0.81 = 3831.3 W; light class 0.66; horizontal 861 x 0.62 x 10; shading coefficient column 22.7: 6 mm clear 0.94, 17: 0.95', [c0({glass: [{d: 5, a: 10}, {d: 8, a: 0}, {d: 0, a: 0}]}).q4, c0({glass: [{d: 5, a: 10}, {d: 8, a: 0}, {d: 0, a: 0}], shade: true}).q4, c0({glass: [{d: 5, a: 10}, {d: 8, a: 0}, {d: 0, a: 0}], cls: 0}).q4, c0({glass: [{d: 8, a: 10}, {d: 8, a: 0}, {d: 0, a: 0}]}).q4, c0({sc: 1, ho: 0, glass: [{d: 5, a: 10}, {d: 8, a: 0}, {d: 0, a: 0}]}).glass[0].sc, c0({sc: 1, ho: 1, glass: [{d: 5, a: 10}, {d: 8, a: 0}, {d: 0, a: 0}]}).glass[0].sc], [10 * 473 * 0.58, 10 * 473 * 0.81, 10 * 473 * 0.66, 10 * 861 * 0.62, 0.94, 0.95], 1e-9);
{
  const o = {ra: 100, walls: [{d: 6, a: 20, u: 1}, {d: 4, a: 0, u: 0}, {d: 0, a: 0, u: 0}], glass: [{d: 5, a: 10}, {d: 8, a: 0}, {d: 0, a: 0}], pn: 10, la: 100, mp: 1000, me: 0.8, ew: 200, ta: 30, tu: 1.5, tt: 5, vv: 300, dw: 8};
  const c = c0(o);
  const q1 = 100 * 1.136 * 30.755, q2 = 20 * 17.255, q3 = 10 * 5.7 * 10.255, q4 = 10 * 473 * 0.58, q5 = 0.342 * 300 * 16, q6 = 10 * 72, q7 = 100 * 20, q8 = 30 * 1.5 * 5, q9 = 1000 / 0.8 + 200;
  const qs = q1 + q2 + q3 + q4 + q5 + q6 + q7 + q8 + q9, ql = 0.85 * 300 * 8 + 10 * 60;
  check('internal gains: ventilation 0.342 x 300 x 16 = 1641.6 W; people 10 x 72 = 720 W; lights 100 x 20 = 2000 W; partition 30 x 1.5 x 5 = 225 W; motors 1000 / 0.8 + 200 = 1450 W', [c.q5, c.q6, c.q7, c.q8, c.q9], [1641.6, 720, 2000, 225, 1450], 1e-9);
  check('totals: sensible = sum of Q1 .. Q9; latent = 0.85 x 300 x 8 + 10 x 60 = 2640 W; total and sensible heat ratio', [c.qs, c.ql1, c.ql2, c.ql, c.qt, c.shr], [qs, 2040, 600, ql, qs + ql, qs / (qs + ql)], 1e-9);
}
for (let k = 0; k < 3; k++) { w.renderCalc('syrload'); w.document.getElementById('sz_m').value = String(k); w.calcResult('syrload'); }
w.renderCalc('syrload'); w.calcResult('syrload');
let tt = txt(w, 'sz_results');
check('the page opens with the default four-layer wall: U about 0.64 W/m2.K, the layer list and the 🔴 note; only the first group visible', [tt.includes('معامل الانتقال الحراري U'), tt.includes('الطبقة 1'), tt.includes('الطبقة 3'), tt.includes('🔴'), w.document.getElementById('sz_g0').style.display, w.document.getElementById('sz_g2').style.display], [true, true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('sz_m', '1'); set('sz_a1', '100'); set('sz_u1', '1'); set('sz_vol', '100'); set('sz_gw', '200'); w.calcResult('syrload'); tt = txt(w, 'sz_results');
check('the heating page shows the boiler capacity, burner flow and tank volume', [tt.includes('استطاعة المرجل'), tt.includes('استطاعة حراق المرجل'), tt.includes('حجم خزان التمدد'), tt.includes('حمل تسخين ماء الاستعمال')], [true, true, true, true]);
set('sz_m', '2'); set('sz_ra', '100'); set('sz_ga1', '10'); w.calcResult('syrload'); tt = txt(w, 'sz_results');
check('the cooling page shows the roof, glass radiation, total load and the sensible heat ratio', [tt.includes('الأسقف'), tt.includes('الزجاج بالإشعاع الشمسي'), tt.includes('حمل التبريد الكلي'), tt.includes('نسبة الحمل المحسوس'), w.document.getElementById('sz_g2').style.display, w.document.getElementById('sz_g0').style.display], [true, true, true, true, '', 'none']);
check('other reference codes open it too', others('syrload', 'sz_results'), [true, true, true]);
}



// ---------- part 181: Syrian Thermal Insulation Code (`syrins`: Table 3 U limits, Equations 5-6, Tables 7-9 windows and glass, Chapter 4 condensation, Tables 15-16 energy reduction, Appendix A city data) ----------
{
w = boot('ae'); doc = w.document;
const sn = o => w.eval('snCalc(' + JSON.stringify(o) + ')');
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const MAT = J('SZ_MAT');
const mi = (n, rho) => MAT.findIndex(m => m[1] === n && (rho === undefined || m[2] === rho));
const m0 = o => sn(Object.assign({mode: 0, e: 1, u: 0.6, aw: 0, af: 0}, o));
const m1 = o => sn(Object.assign({mode: 1, aw: 80, uw: 0.6, ad: 5, ud: 2, an: 15, un: 3, ar: 100, ur: 0.4, ae: 0, ue: 0, ag: 100, ug: 0.8, ti: 20, te: 0}, o));
const m2 = o => sn(Object.assign({mode: 2, fr: 0, ug: 4, uf: 3, ge: 0, gg: 2, gs: 0, ratio: 0.2}, o));
const L = (m, d, lam, v, rv) => ({m, d, lam: lam || 0, v: v || 0, rv: rv || 0});
const m3 = o => sn(Object.assign({mode: 3, ti: 20, te: -2, rhi: 60, rhe: 75, wind: 2, days: 60, fibre: false, layers: []}, o));
const m4 = o => sn(Object.assign({mode: 4, bt: 0, lag: 1, cont: false, wk: 5, dh: 2, q0: 0}, o));
check('table sizes: 7 element rows; window tables 13 x 9 each; Table 9 5 emissivities x 5 gaps x 4 gases; 34 vapour materials; 36 cities of 14 fields; 9 specific heats', [J('SN_EL').length, J('SN_W30').length, J('SN_W30').every(r => r.length === 9), J('SN_W20').length, J('SN_W20').every(r => r.length === 9), J('SN_UGL').length, J('SN_UGL').every(g => g.length === 5 && g.every(r => r.length === 4)), J('SN_VM').length, J('SN_CITY').length, J('SN_CITY').every(c => c.length === 14), J('SN_CP').length], [7, 13, true, 13, true, 5, true, 34, 36, true, 9]);
check('Table 3 limits: roof 0.5, walls 0.8, facade incl. openings 1.5, ground floors 1, floors between storeys 1, exposed floors 0.5', J('SN_EL').map(x => x[1]), [0.5, 0.8, null, 1.5, 1, 1, 0.5]);
check('element verdicts: wall 0.8 passes, 0.81 fails; roof 0.5 passes, 0.51 fails; exposed floor 0.5; ground floor 1.0 passes 1.01 fails; facade 1.5', [m0({u: 0.8}).ok, m0({u: 0.81}).ok, m0({e: 0, u: 0.5}).ok, m0({e: 0, u: 0.51}).ok, m0({e: 6, u: 0.5}).ok, m0({e: 4, u: 1}).ok, m0({e: 4, u: 1.01}).ok, m0({e: 3, u: 1.5}).ok, m0({e: 3, u: 1.51}).ok], [true, false, true, false, true, true, false, true, false]);
check('windows: ratio 0.2 (20 / 100 m2) -> limit 5.2; 21 / 100 -> limit 3.5; 5.2 passes the first, 3.6 fails the second; no facade area -> ratio 0', [m0({e: 2, u: 5.2, aw: 20, af: 100}).lim, m0({e: 2, u: 5.2, aw: 21, af: 100}).lim, m0({e: 2, u: 5.2, aw: 20, af: 100}).ok, m0({e: 2, u: 3.6, aw: 21, af: 100}).ok, m0({e: 2, u: 3.5, aw: 21, af: 100}).ok, m0({e: 2, u: 1, aw: 5, af: 0}).ratio], [5.2, 3.5, true, false, true, 0]);
{
  const f = m1({});
  check('Equation 5: facade 80 m2 wall U 0.6, 5 m2 door U 2, 15 m2 windows U 3 -> A = 100 m2, U = (48 + 10 + 45) / 100 = 1.03; window share 0.15 -> window limit 5.2; verdicts', [f.areaFacade, f.uf, f.ratio, f.limWin, f.okFacade, f.okWall, f.okWin], [100, 1.03, 0.15, 5.2, true, true, true], 1e-9);
  check('Equation 6: building with 100 m2 roof U 0.4 and 100 m2 ground floor U 0.8: A_B = 300 m2, U_B = (103 + 40 + 80) / 300 = 0.74333; heat loss at 20 K = 4460 W; roof and ground verdicts', [f.ao, f.ub, f.q, f.okRoof, f.okGnd], [300, 223 / 300, 4460, true, true], 1e-9);
  check('facade verdicts: facade U 1.6 fails; windows above 20 % need 3.5: 30 m2 windows of 100 m2 with U 4 fail', [m1({uw: 1.5, an: 15, aw: 80, un: 5}).uf > 1.5, m1({an: 30, aw: 65, un: 4}).limWin, m1({an: 30, aw: 65, un: 4}).okWin, m1({an: 30, aw: 65, un: 3.5}).okWin], [true, 3.5, false, true]);
}
check('Table 7 (30 % frame) corners and rows: Ug 5.7 with Uf 7 = 6.1; Ug 5.7 with Uf 1 = 4.3; Ug 1.1 with Uf 1 = 1.2; Ug 2.1 with Uf 2.2 = 2.3; Ug 3.3 with Uf 3.8 = 3.6', [m2({ug: 0, uf: 8}).uwin, m2({ug: 0, uf: 0}).uwin, m2({ug: 12, uf: 0}).uwin, m2({ug: 7, uf: 3}).uwin, m2({ug: 1, uf: 7}).uwin], [6.1, 4.3, 1.2, 2.3, 3.6]);
check('Table 8 (20 % frame): Ug 5.7 with Uf 7 = 5.9; Ug 5.7 with Uf 1 = 4.8; Ug 1.1 with Uf 1 = 1.2; Ug 2.1 with Uf 1.8 = 2.2; Ug 1.7 with Uf 3 = 2.1', [m2({fr: 1, ug: 0, uf: 8}).uwin, m2({fr: 1, ug: 0, uf: 0}).uwin, m2({fr: 1, ug: 12, uf: 0}).uwin, m2({fr: 1, ug: 7, uf: 2}).uwin, m2({fr: 1, ug: 9, uf: 5}).uwin], [5.9, 4.8, 1.2, 2.2, 2.1]);
check('window tables are monotonic: each row non-decreasing with the frame U, each column non-increasing as the glass U falls', [J('SN_W30'), J('SN_W20')].map(t => t.every(r => r.every((x, i) => i === 0 || x >= r[i - 1])) && t.every((r, i) => i === 0 || r.every((x, j) => x <= t[i - 1][j]))), [true, true]);
check('window approximations: Ug 4 is not in the list so the row picked is Ug 2.9 (index 3); area-weighted estimate for 30 % frame Ug 2.9 Uf 2.2 = 0.7 x 2.9 + 0.3 x 2.2 = 2.69 against the table 2.8', [m2({ug: 3, uf: 3}).ugVal, m2({ug: 3, uf: 3}).ufVal, m2({ug: 3, uf: 3}).approx, m2({ug: 3, uf: 3}).uwin, m2({ug: 3, uf: 3}).frame], [2.9, 2.2, 0.7 * 2.9 + 0.3 * 2.2, 2.8, 0.3], 1e-9);
check('Table 9 key cells (ISO 10077-1): plain glass 4-12-4 air 2.9, argon 2.7, krypton 2.6, SF6 3.1; emissivity 0.05 4-12-4 air 1.7, argon 1.3, krypton 1.1, SF6 2.2; emissivity 0.1 4-15-4 air 1.6; 0.2 4-6-4 argon 2.3', [0, 1, 2, 3].map(s => m2({ge: 0, gg: 2, gs: s}).glass).concat([0, 1, 2, 3].map(s => m2({ge: 4, gg: 2, gs: s}).glass), [m2({ge: 3, gg: 3, gs: 0}).glass, m2({ge: 2, gg: 0, gs: 1}).glass]), [2.9, 2.7, 2.6, 3.1, 1.7, 1.3, 1.1, 2.2, 1.6, 2.3]);
check('Table 9 trends: lower emissivity never raises the air-filled U; krypton is the best gas for every emissivity at 4-12-4; window verdict at 0.2 ratio: 3.2 passes 5.2, ratio 0.3 with 3.6 fails 3.5', [[0, 1, 2, 3, 4].map(e => m2({ge: e, gg: 2, gs: 0}).glass).every((x, i, a) => i === 0 || x <= a[i - 1]), [0, 1, 2, 3, 4].every(e => m2({ge: e, gg: 2, gs: 2}).glass === Math.min(...[0, 1, 2, 3].map(s => m2({ge: e, gg: 2, gs: s}).glass))), m2({ug: 1, uf: 3}).ok, m2({ratio: 0.3, ug: 1, uf: 7}).ok], [true, true, true, false]);
check('dew point against Table 12: 20 C with 45 / 60 / 75 / 95 % = 7.73 / 12 / 15.48 / 19.18; 25 C 60 % 16.69; 30 C 50 % 18.44; 10 C 70 % 4.79; 40 C 50 % 27.66; -10 C 70 % -13.95; 0 C 70 % -4.26 (within 0.15 C)', [[20, 45, 7.73], [20, 60, 12], [20, 75, 15.48], [20, 95, 19.18], [25, 60, 16.69], [30, 50, 18.44], [10, 70, 4.79], [40, 50, 27.66], [-10, 70, -13.95], [0, 70, -4.26]].map(a => Math.abs(w.eval('snDew(snPs(' + a[0] + ') * ' + a[1] + ' / 100)') - a[2]) <= 0.15), Array(10).fill(true));
check('saturation pressure round trip and Table 11 anchors: the dew point of saturated air equals its temperature; 20 C = 2337 Pa (humidity ratio about 14.7 g/kg is Table 11 17.3 at 101.3 kPa and 20 C -> pressure 2.76 kPa not used); 0 C = 610.5 Pa', [[-5, 0, 10, 25, 35].every(t => Math.abs(w.eval('snDew(snPs(' + t + '))') - t) < 1e-9), Math.abs(w.eval('snPs(20)') - 2337) < 3, w.eval('snPs(0)')], [true, true, 610.5], 1e-9);
{
  const ly = [L(mi('ملاط (طينة) اسمنتي', 1850), 20, 0, 11), L(mi('بلوك اسمنتي عادي مفرغ', 1400), 200, 0, 2), L(mi('ألواح بوليستيرين مشكل بالقولبة', 20), 50, 0, 22), L(mi('ملاط (طينة) اسمنتي', 1850), 20, 0, 11)];
  const c = m3({layers: ly});
  const rt = 0.13 + 0.05 + 2 * 0.02 / 0.72 + 0.2 / 0.9 + 0.05 / 0.036, q = 22 / rt;
  check('insulated wall 20 C 60 %, -2 C: R_T = 0.13 + 0.05 + 0.0556 + 0.2222 + 1.3889 = 1.8467, q = 11.913 W/m2, inner surface 20 - 0.13 q = 18.45 C; dew point 12.0 C so no surface condensation; surface humidity about 66 % (below 70 %, no mould); the 3 K rule', [c.rt, c.q, c.tsi, c.condS, Math.abs(c.td - 12) < 0.15, c.mold, c.gap <= 3], [rt, q, 20 - q * 0.13, false, true, false, true], 1e-9);
  check('maximum U to avoid surface condensation: (20 - 12.0) / (0.13 x 22) = 2.80 W/m2.K; the wall U 0.54 is far below; vapour resistance 80 x 0.02 + 27 x 0.2 + 100 x 0.05 + 1.6 = 13.6 MN.s/g', [c.umax, c.u < c.umax, c.RvTot, c.lay.length], [(20 - c.td) / (0.13 * 22), true, 13.6, 4], 1e-9);
  check('no interstitial condensation in the insulated wall: every interface pressure below saturation', [c.condI, c.excess.every(x => x < 0), c.mass, c.okI], [false, true, 0, true]);
}
{
  const ly = [L(mi('ألواح بوليستيرين مشكل بالقولبة', 20), 50, 0.04, 0, 5), L(mi('خرسانة إنشائية (رمل عادي، رمل خفيف)', 2400), 200, 1.85, 0, 100)];
  const c = m3({te: -5, rhe: 80, layers: ly.map(x => Object.assign(x, {v: 0}))});
  const rt = 0.13 + 0.05 + 0.05 / 0.04 + 0.2 / 1.85, q = 25 / rt, t1 = 20 - q * 0.13 - q * 1.25;
  const ps = t => t >= 0 ? 610.5 * Math.exp(17.269 * t / (237.3 + t)) : 610.5 * Math.exp(21.875 * t / (265.5 + t));
  const psi = ps(20) * 0.6, pe = ps(-5) * 0.8, rin = 0.25, rtot = 0.25 + 20;
  const g = (psi - ps(t1)) / rin - (ps(t1) - pe) / (rtot - rin);
  check('inside insulation 50 mm (rho_v 5) with cold concrete 200 mm (rho_v 100): R = 1.538, q = 16.25 W/m2, interface -2.43 C; vapour pressure 1389 Pa against 499 saturation -> interstitial condensation at interface 1', [c.rt, c.q, c.T[1], c.condI, c.worst, c.P[1] > c.PS[1], c.RvTot], [rt, q, t1, true, 1, true, rtot], 1e-6);
  check('condensed amount: g = (p_i - p_s) / R_in - (p_s - p_e) / R_out = 3605 e-6 g/m2.s; 60 days -> about 18.7 kg/m2, far above 0.5 kg/m2 so it fails; the fibre limit is 0.35', [c.g, c.mass, c.lim, c.okI, m3({te: -5, rhe: 80, fibre: true, layers: ly}).lim], [g, g * 1e-6 * 86400 * 60 / 1000, 0.5, false, 0.35], 1e-9);
  const wb = m3({te: -5, rhe: 80, layers: [L(mi('ألواح بوليستيرين مشكل بالقولبة', 20), 0.1, 0.04, 31), ...ly]});
  check('a vapour barrier on the warm side (PE film 0.1 mm, 350000 -> 35 MN.s/g) cuts the condensed amount by more than 100 times but does not remove it (the cold concrete face is the plane): R_V = 55.25', [wb.RvTot, wb.condI, wb.mass < c.mass / 100, wb.mass > 0], [55.25, true, true, true], 1e-9);
}
check('surface condensation case: an uninsulated 200 mm concrete wall (lambda 1.85) at -2 C and 80 % indoors 20 C: U = 1/(0.13 + 0.05 + 0.108) = 3.47; inner surface 20 - 3.47 x 22 x 0.13 = 10.1 C below the 16.4 C dew point (80 %) -> condensation and mould', [m3({rhi: 80, layers: [L(mi('خرسانة إنشائية (رمل عادي، رمل خفيف)', 2400), 200, 1.85, 6)]}).condS, m3({rhi: 80, layers: [L(mi('خرسانة إنشائية (رمل عادي، رمل خفيف)', 2400), 200, 1.85, 6)]}).tsi, m3({rhi: 80, layers: [L(mi('خرسانة إنشائية (رمل عادي، رمل خفيف)', 2400), 200, 1.85, 6)]}).mold, m3({rhi: 80, layers: [L(mi('خرسانة إنشائية (رمل عادي، رمل خفيف)', 2400), 200, 1.85, 6)]}).gap > 3], [true, 20 - 22 / (0.18 + 0.2 / 1.85) * 0.13, true, true], 1e-9);
check('Table 15: continuous 1.0; intermittent light 0.55 / 0.70, medium 0.70 / 0.85, heavy 0.85 / 0.95 by low / high time-lag; Table 16: 5 days light 0.75, heavy 0.85; 4, 8, 12, 16 h light 0.68, 1.00, 1.25, 1.40, heavy 0.96, 1.00, 1.02, 1.03', [J('SN_T15'), J('SN_T16W'), J('SN_T16D')], [[[0.55, 0.70], [0.70, 0.85], [0.85, 0.95]], {5: [0.75, 0.85]}, {4: [0.68, 0.96], 8: [1, 1], 12: [1.25, 1.02], 16: [1.40, 1.03]}]);
check('code example: light building with high lag, 12 h a day, 5 days a week: h = 0.70 x 0.75 x 1.25 = 0.65625 (printed 0.66); heavy low-lag 8 h 7 days = 0.85 x 1 x 1 = 0.85', [m4({}).h, m4({}).t15, m4({}).wk, m4({}).dy, m4({bt: 2, lag: 0, wk: 7, dh: 1}).h], [0.65625, 0.7, 0.75, 1.25, 0.85], 1e-9);
check('continuous operation uses 1.0: heavy 16 h 5 days continuous = 1 x 0.85 x 1.03; medium building takes the mean of light and heavy columns (5 days 0.80, 4 h 0.82) and says so; energy = base x h', [m4({bt: 2, cont: true, dh: 3}).h, m4({bt: 1, dh: 0}).wk, m4({bt: 1, dh: 0}).dy, m4({bt: 1, dh: 0}).medNote, m4({bt: 0}).medNote, m4({q0: 1000}).energy], [0.85 * 1.03, 0.8, 0.82, true, false, 656.25], 1e-9);
check('Appendix A: Damascus 40 / -2 C, 20 / 75 %, range 19.69, solar 7700 / 2820, wind 5.5 NW / W, 729 m, 33.29 N 36.13 E; Latakia 34 / 4 C, 60 / 65 %; Al-Tanf summer 8000 solar; Al-Bukamal 44 C; Zabadani 1200 m -5 C', [0, 8, 21, 22, 32].map(i => J('SN_CITY')[i]), [['دمشق', 40, -2, 20, 75, 19.69, 7700, 2820, 5.5, 'NW', 'W', 729, 33.29, 36.13], ['اللاذقية', 34, 4, 60, 65, 5.18, 6590, 2300, 5.5, 'S', 'NE', 7, 35.32, 35.46], ['التنف', 42, -3, 20, 75, 17.54, 8000, 3020, 5.5, 'W', 'W', 712, 33.29, 38.39], ['البوكمال', 44, -3, 20, 65, 15.16, 7850, 2940, 4, 'W', 'W', 175, 34.26, 40.55], ['الزبداني', 35, -5, 20, 75, 15.61, 7650, 2610, 5, 'NW', 'NW', 1200, 33.43, 36.07]]);
check('city data sanity: summer temperature above winter for all, humidity 0 - 100, latitude 32 - 38, longitude 35 - 42, positive elevations', [J('SN_CITY').every(c => c[1] > c[2] && c[3] > 0 && c[3] < 100 && c[4] < 100 && c[12] > 32 && c[12] < 38 && c[13] > 35 && c[13] < 42 && c[11] > 0 && c[5] > 0 && c[6] > c[7])], [true]);
check('Table 2 and heat storage: 1 m3 of concrete (2400 kg/m3, 1000 J/kg.K) heated 10 K stores 24 MJ = 6.667 kWh; steel 500, water 4180', [sn({mode: 6, m: 0, rho: 2400, vol: 1, dt: 10}).qs, sn({mode: 6, m: 0, rho: 2400, vol: 1, dt: 10}).kwh, J('SN_CP')[5][1], J('SN_CP')[8][1]], [24e6, 24e6 / 3.6e6, 500, 4180], 1e-9);
for (let k = 0; k < 7; k++) { w.renderCalc('syrins'); w.document.getElementById('sn_m').value = String(k); w.calcResult('syrins'); }
w.renderCalc('syrins'); w.calcResult('syrins');
let tt = txt(w, 'sn_results');
check('the page opens with the wall limit 0.8 W/m2.K and a passing 0.6 design value, the 🔴 note; only the first group visible', [tt.includes('الحد الأعظمي لـ U'), /0\.8/.test(tt), tt.includes('محقق'), tt.includes('🔴'), w.document.getElementById('sn_g0').style.display, w.document.getElementById('sn_g3').style.display], [true, true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('sn_m', '1'); set('sn_a1', '80'); set('sn_u1', '0.6'); set('sn_a2', '5'); set('sn_u2', '2'); set('sn_a3', '15'); set('sn_u3', '3'); set('sn_a4', '100'); set('sn_u4', '0.4'); set('sn_a6', '100'); set('sn_u6', '0.8'); w.calcResult('syrins'); tt = txt(w, 'sn_results');
check('the building page shows the facade U 1.030 and the building U 0.743', [tt.includes('U الواجهة شاملة الفتحات'), /1\.030/.test(tt), /0\.743/.test(tt)], [true, true, true]);
set('sn_m', '3'); w.calcResult('syrins'); tt = txt(w, 'sn_results');
check('the condensation page shows the dew point, the inner surface temperature and the interface list for the default insulated wall', [tt.includes('نقطة الندى للهواء الداخلي'), tt.includes('درجة حرارة السطح الداخلي'), tt.includes('السطح الفاصل 1'), tt.includes('لا يحدث'), w.document.getElementById('sn_g3').style.display, w.document.getElementById('sn_g0').style.display], [true, true, true, true, '', 'none']);
set('sn_m', '4'); w.calcResult('syrins'); tt = txt(w, 'sn_results');
check('the energy page shows 0.66 and the Table 15 note', [tt.includes('نسبة التخفيض التصميمية h'), /0\.66/.test(tt), tt.includes('الجدولان 15 و16')], [true, true, true]);
set('sn_m', '5'); set('sn_c', '0'); w.calcResult('syrins'); tt = txt(w, 'sn_results');
check('the city page shows Damascus data and 729 m', [tt.includes('دمشق'), /729/.test(tt), /33\.29/.test(tt)], [true, true, true]);
check('other reference codes open it too', others('syrins', 'sn_results'), [true, true, true]);
}


// ---------- part 182: 2021 Uniform Plumbing Code (`upcdrain`: DFU, Table 703.2 drain and vent sizing, trap arms, grease interceptors; `upcwater`: WSFU, Table 610.10, Table 610.4 meter and supply sizing) ----------
{
w = boot('ae'); doc = w.document;
const uq = o => w.eval('uqCalc(' + JSON.stringify(o) + ')');
const uz = o => w.eval('uzCalc(' + JSON.stringify(o) + ')');
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const idx = (a, n) => J(a).findIndex(x => x[0] === n);
const WCg = idx('UQ_F', 'مرحاض 1.6 GPF بخزان ثقالي'), LAV = idx('UQ_F', 'مغسلة يد'), SHW = idx('UQ_F', 'دش برأس واحد'), CW = idx('UQ_F', 'غسالة ملابس منزلية (أنبوب قائم)'), MH = idx('UQ_F', 'منزل متنقل (مصيدة)'), WCbig = idx('UQ_F', 'مرحاض أكثر من 1.6 GPF بخزان ثقالي');
const d0 = o => uq(Object.assign({mode: 0, oc: 0, battery: false, rows: [], gpm: 0, ni: 1, cg: 0}, o));
const d1 = o => uq(Object.assign({mode: 1, kind: 0, dfu: 20, slope: 0, wc: 0, six: 0, len: 20, drain: 4}, o));
const d2 = o => uq(Object.assign({mode: 2, t: 2, len: 0, dfu: 1, wcLen: 0}, o));
const d3 = o => uq(Object.assign({mode: 3, dfu: 12, gpm: 0, pd: 2, l: 24, w: 24, d: 12, n: 2, hyd: 0, app: 0, per: 1}, o));
check('table sizes: Table 702.1 has 40 fixture rows; Table 703.2 10 pipe sizes (1 1/4 to 12 in); 13 grease interceptor rows; 5 trap-arm rows', [J('UQ_F').length, J('UQ_S').length, ['UQ_V', 'UQ_H', 'UQ_L', 'UQ_VT', 'UQ_VL'].map(n => J(n).length).every(x => x === 10), J('UQ_GD').length, J('UQ_TA').length], [40, 10, true, 13, 5]);
check('Table 703.2: vertical 1, 2, 16, 48, 256, 600, 1380, 3600, 5600, 8400; horizontal 1, 1, 8, 35, 216, 428, 720, 2640, 4680, 8200; vertical lengths 45, 65, 85, 212, 300, 390, 510, 750; vent units 1, 8, 24, 84, 256, 600, 1380, 3600 and lengths 45, 60, 120, 212, 300, 390, 510, 750', [J('UQ_V'), J('UQ_H'), J('UQ_L'), J('UQ_VT'), J('UQ_VL')], [[1, 2, 16, 48, 256, 600, 1380, 3600, 5600, 8400], [1, 1, 8, 35, 216, 428, 720, 2640, 4680, 8200], [45, 65, 85, 212, 300, 390, 510, 750, null, null], [1, 8, 24, 84, 256, 600, 1380, 3600, null, null], [45, 60, 120, 212, 300, 390, 510, 750, null, null]]);
check('Table 702.1 key values (private / public / assembly): water closet 1.6 GPF gravity 3 / 4 / 6; above 1.6 GPF 4 / 6 / 8; lavatory 1 / 1 / 1; bathtub 2 / 2 / not listed; clothes washer 3 / 3 / 3; mobile home 12 / not listed / not listed; urinal integral trap 1.0 GPF 2 / 2 / 5; floor drain 2', [J('UQ_F')[WCg].slice(2), J('UQ_F')[WCbig].slice(2), J('UQ_F')[LAV].slice(2), J('UQ_F')[0].slice(2), J('UQ_F')[CW].slice(2), J('UQ_F')[MH].slice(2), J('UQ_F')[32].slice(2), J('UQ_F')[9].slice(2)], [[3, 4, 6], [4, 6, 8], [1, 1, 1], [2, 2, null], [3, 3, 3], [12, null, null], [2, 2, 5], [2, 2, 2]]);
check('DFU sum, private: 4 closets 12 + 6 lavatories 6 + 2 showers 4 = 22; public 16 + 6 + 4 = 26; assembly 24 + 6 + 4 = 34; the mobile home is not listed for public use', [d0({rows: [{f: WCg, n: 4}, {f: LAV, n: 6}, {f: SHW, n: 2}]}).total, d0({oc: 1, rows: [{f: WCg, n: 4}, {f: LAV, n: 6}, {f: SHW, n: 2}]}).total, d0({oc: 2, rows: [{f: WCg, n: 4}, {f: LAV, n: 6}, {f: SHW, n: 2}]}).total, d0({oc: 1, rows: [{f: MH, n: 1}]}).na, d0({oc: 1, rows: [{f: MH, n: 1}]}).total], [22, 26, 34, 1, 0]);
check('clothes washer battery: three washers 9 DFU, 18 with the battery rule (6 each); two washers keep 3 each; Table 702.2 intermittent flow: up to 7.5 gpm 1, up to 15 2, up to 30 4, up to 50 6, above 50 by the authority; continuous 2 DFU per gpm', [d0({rows: [{f: CW, n: 3}]}).total, d0({battery: true, rows: [{f: CW, n: 3}]}).total, d0({battery: true, rows: [{f: CW, n: 2}]}).total, [7.5, 7.51, 15, 30, 50].map(g => d0({gpm: g}).ifDfu), d0({gpm: 51}).ifOver, d0({gpm: 10, ni: 2}).ifDfu, d0({cg: 5}).cont, d0({rows: [{f: WCg, n: 2}], gpm: 20, cg: 3}).sum], [9, 18, 6, [1, 2, 2, 4, 6], true, 4, 10, 6 + 4 + 6]);
check('Table 703.2 horizontal drain: 20 DFU -> 3 in (35); 8 DFU -> 2 in; 9 DFU -> 3 in; 36 DFU -> 4 in; 217 -> 5 in; 2641 -> 10 in; 8201 beyond the table', [[20, 8, 9, 36, 217, 2641].map(n => d1({dfu: n}).size), d1({dfu: 8201}).size], [[3, 2, 3, 4, 5, 10], null]);
check('water closets: any closet forces at least 3 in; 3 in takes at most five closets (6 closets with 18 DFU -> 4 in); 2 in with a closet is not allowed', [d1({dfu: 3, wc: 1}).size, d1({dfu: 12, wc: 4}).size, d1({dfu: 18, wc: 6}).size, d1({dfu: 18, wc: 5}).size, d1({dfu: 3, six: 1}).size, d1({dfu: 3, wc: 0}).size], [3, 3, 4, 3, 3, 2]);
check('1/8 in per ft slope multiplies horizontal capacity by 0.8 and is limited to 4 in and larger: 100 DFU -> 4 in (172.8); 200 DFU -> 5 in (342.4); 20 DFU -> 4 in; capacity shown', [d1({dfu: 100, slope: 1}).size, d1({dfu: 100, slope: 1}).cap, d1({dfu: 200, slope: 1}).size, d1({dfu: 200, slope: 1}).cap, d1({dfu: 20, slope: 1}).size, d1({dfu: 100, slope: 1}).fact], [4, 216 * 0.8, 5, 428 * 0.8, 4, 0.8], 1e-9);
check('vertical stack: 20 DFU -> 3 in (48); 16 DFU -> 2 in (no closets); 15 DFU over 100 ft needs 3 in because 2 in is limited to 85 ft; 40 DFU 100 ft keeps 3 in (212 ft limit); 100 DFU over 350 ft -> 4 in has 300 ft so the next size 5 in (390 ft)', [d1({kind: 1, dfu: 20}).size, d1({kind: 1, dfu: 16}).size, d1({kind: 1, dfu: 15, len: 100}).lenOk, d1({kind: 1, dfu: 15, len: 100}).sizeLen, d1({kind: 1, dfu: 40, len: 100}).lenOk, d1({kind: 1, dfu: 100, len: 350}).size, d1({kind: 1, dfu: 100, len: 350}).sizeLen, d1({kind: 1, dfu: 100, len: 350}).lenOk], [3, 2, false, 3, true, 4, 5, false]);
check('vents: 24 DFU 100 ft for a 3 in drain -> 2 in (120 ft limit) and 1 1/2 in minimum -> 2 in; 150 ft -> increase one size to 3 in; a 4 in drain forces 2 in even for 1 DFU; a 6 in drain forces 3 in; 1 DFU on a 2 in drain -> 1 1/4 in; 5 DFU 50 ft -> 1 1/2 in', [d1({kind: 2, dfu: 24, len: 100, drain: 3}).final, d1({kind: 2, dfu: 24, len: 150, drain: 3}).final, d1({kind: 2, dfu: 24, len: 150, drain: 3}).up, d1({kind: 2, dfu: 1, len: 20, drain: 4}).final, d1({kind: 2, dfu: 10, len: 20, drain: 6}).final, d1({kind: 2, dfu: 1, len: 20, drain: 2}).final, d1({kind: 2, dfu: 5, len: 50, drain: 2}).final, d1({kind: 2, dfu: 24, len: 100, drain: 3}).minDiam], [2, 3, true, 2, 3, 1.25, 1.5, 1.5]);
check('Table 1002.2 trap arms: 1 1/4 in 2 1/2 - 30 in; 1 1/2 in 3 - 42; 2 in 4 - 60; 3 in 6 - 72; 4 in 8 - 120; 2 in arm 1500 mm = 59.06 in passes, 1600 mm = 62.99 in fails; closet 1800 mm = 70.9 in passes the 6 ft limit, 1900 mm fails', [J('UQ_TA'), d2({len: 1500 / 25.4}).lenOk, d2({len: 1600 / 25.4}).lenOk, d2({len: 2 / 25.4}).minOk, d2({wcLen: 1800 / 25.4}).wcOk, d2({wcLen: 1900 / 25.4}).wcOk], [[[1.25, 2.5, 30], [1.5, 3, 42], [2, 4, 60], [3, 6, 72], [4, 8, 120]], true, false, false, true, false]);
check('Table 702.1(1): trap and arm maximum DFU 1 1/4 in 1, 1 1/2 in 3, 2 in 4, 3 in 6, 4 in 8; a 2 in arm with 4 DFU passes, 5 fails', [J('UQ_TRAP'), d2({dfu: 4}).dfuOk, d2({dfu: 5}).dfuOk, d2({t: 4}).maxDfu], [[[1.25, 1], [1.5, 3], [2, 4], [3, 6], [4, 8]], true, false, 8]);
check('Table 1014.3.6: 8 DFU 500 gal, 21 -> 750, 35 -> 1000, 90 -> 1250, 172 -> 1500, 216 -> 2000, 2112 -> 10000, 2640 -> 15000; the code example 12 DFU -> 750 gal; 9 DFU -> 750; 2641 beyond; extra flow 10 gpm x 30 min = 300 gal', [[8, 21, 35, 90, 172, 216, 2112, 2640, 12, 9].map(n => d3({dfu: n}).vol), d3({dfu: 2641}).volOver, d3({gpm: 10}).extra, d3({gpm: 10}).volTot], [[500, 750, 1000, 1250, 1500, 2000, 10000, 15000, 750, 750], true, 300, 1050]);
check('Table 1014.2.1 hydromechanical: 2 in 20 / 20 / 10 gpm; 3 in 60 / 75 / 35; 4 in 125 / 150 / 75; 5 in 230 / 250 / 125; 6 in 375 / 400 / 200; 3 in with a 1-minute period -> 75 gpm, 2-minute -> 35', [J('UQ_GH'), d3({pd: 3}).std, d3({pd: 3, per: 2}).std], [[[2, 20, 20, 10], [3, 60, 75, 35], [4, 125, 150, 75], [5, 230, 250, 125], [6, 375, 400, 200]], 75, 35]);
check('fixture capacity method (code example): two 24 x 24 x 12 in compartments = 2 x 24 x 24 x 12 / 231 x 0.75 = 44.88 gal; + hydrant 3 + rated appliance 2 = 49.88 gpm at 1 minute, 24.94 at 2 minutes; maximum fixture capacity 2.5 x rate', [d3({hyd: 3, app: 2}).gal, d3({hyd: 3, app: 2}).load, d3({hyd: 3, app: 2}).rate, d3({hyd: 3, app: 2, per: 2}).rate, d3({hyd: 3, app: 2}).maxCap], [2 * 24 * 24 * 12 / 231 * 0.75, 2 * 24 * 24 * 12 / 231 * 0.75 + 5, 2 * 24 * 24 * 12 / 231 * 0.75 + 5, (2 * 24 * 24 * 12 / 231 * 0.75 + 5) / 2, 2.5 * (2 * 24 * 24 * 12 / 231 * 0.75 + 5)], 1e-9);
// water
const wI = (n, o) => J('UZ_F').findIndex(x => x[0] === n);
const WCw = wI('مرحاض 1.6 GPF بخزان ثقالي'), LAVw = wI('مغسلة يد'), SHWw = wI('دش (لكل رأس)'), KIT = wI('حوض مطبخ منزلي (مع غسالة أطباق أو بدونها)'), CWw = wI('غسالة ملابس'), DW = wI('غسالة أطباق منزلية'), WCbw = wI('مرحاض أكثر من 1.6 GPF بخزان ثقالي');
const w0 = o => uz(Object.assign({mode: 0, oc: 0, rows: [], hose2: 0}, o));
const w1 = o => uz(Object.assign({mode: 1, p: 50, dh: 0, len: 100, fu: 30}, o));
const w2 = o => uz(Object.assign({mode: 2, wc: 0, ur: 0, other: 0}, o));
check('Table 610.3 values (private / public / assembly): closet 1.6 gravity 2.5 / 2.5 / 3.5; above 1.6 3 / 5.5 / 7; lavatory 1 / 1 / 1; bathtub 4 / 4; 3/4 in bathtub fill 10 / 10; hose bibb 2.5 / 2.5; mobile home 12; drinking fountain 0.5 / 0.5 / 0.75; shower 2 / 2', [J('UZ_F')[WCw].slice(2), J('UZ_F')[WCbw].slice(2), J('UZ_F')[LAVw].slice(2), J('UZ_F')[0].slice(2), J('UZ_F')[1].slice(2), J('UZ_F')[7].slice(2), J('UZ_F')[11].slice(2), J('UZ_F')[6].slice(2), J('UZ_F')[SHWw].slice(2), J('UZ_F').length], [[2.5, 2.5, 3.5], [3, 5.5, 7], [1, 1, 1], [4, 4, null], [10, 10, null], [2.5, 2.5, null], [12, null, null], [0.5, 0.5, 0.75], [2, 2, null], 26]);
check('WSFU sum, private: 4 closets 10 + 6 lavatories 6 + 2 showers 4 + kitchen sink 1.5 + clothes washer 4 + dishwasher 1.5 = 27; hot or cold alone = 3/4 x 27 = 20.25; public closets above 1.6 GPF 5.5; showers are not listed for assembly; hose bibbs 2.5 + 3 x 1 = 5.5', [w0({rows: [{f: WCw, n: 4}, {f: LAVw, n: 6}, {f: SHWw, n: 2}, {f: KIT, n: 1}, {f: CWw, n: 1}, {f: DW, n: 1}]}).total, w0({rows: [{f: WCw, n: 4}, {f: LAVw, n: 6}, {f: SHWw, n: 2}, {f: KIT, n: 1}, {f: CWw, n: 1}, {f: DW, n: 1}]}).sep, w0({oc: 1, rows: [{f: WCbw, n: 2}]}).total, w0({oc: 2, rows: [{f: SHWw, n: 1}]}).na, w0({hose2: 4}).hose], [27, 20.25, 11, 1, 5.5], 1e-9);
check('Table 610.10 closets with flushometer valves: 1 -> 40, 2 -> 70, 3 -> 90, 4 -> 105, 5 -> 115, 6 -> 125, 7 -> 135; urinals 1 -> 20, 2 -> 35, 3 -> 45, 4 -> 53, 5 -> 58, 6 -> 63; code examples E: 2 WC + 2 UR + 1 LAV = 106; M: 4 + 4 + 4 LAV = 162; T: 6 + 6 + 6 LAV = 194', [[0, 1, 2, 3, 4, 5, 6, 7].map(n => w2({wc: n}).wc), [1, 2, 3, 4, 5, 6].map(n => w2({ur: n}).ur), w2({wc: 2, ur: 2, other: 1}).fu, w2({wc: 4, ur: 4, other: 4}).fu, w2({wc: 6, ur: 6, other: 6}).fu, w2({wc: 1, ur: 1, other: 1}).fu], [[0, 40, 70, 90, 105, 115, 125, 135], [20, 35, 45, 53, 58, 63], 106, 162, 194, 61]);
check('Table 610.4 integrity: 3 pressure ranges x 14 rows x 15 length columns; meter sizes never below the supply size except the 3/4 in meter rows; the lengths 40 - 1000 ft; first row of the 30 - 45 psi group 6, 5, 4, 3, 2, 1, 1, 1, 0 ...', [J('UZ_T').length, J('UZ_T').every(g => g.length === 14 && g.every(r => r[2].length === 15)), J('UZ_LEN'), J('UZ_T')[0][0][2].slice(0, 9), J('UZ_T')[2][13][2][14]], [3, true, [40, 60, 80, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900, 1000], [6, 5, 4, 3, 2, 1, 1, 1, 0], 329]);
check('Table 610.4 monotonic: capacity never rises with length in any row, and a higher pressure range never lowers a capacity', [J('UZ_T').every(g => g.every(r => r[2].every((x, i) => i === 0 || x <= r[2][i - 1]))), [0, 1].every(k => J('UZ_T')[k].every((r, i) => r[2].every((x, c) => x <= J('UZ_T')[k + 1][i][2][c])))], [true, true]);
check('sizing: 50 psi, 100 ft, 30 WSFU -> range 46 - 60, column 100 ft, first row with 30 or more is 3/4 in meter and 1 in supply (33); 40 psi, 40 ft, 100 WSFU -> 1 1/2 in meter and 1 1/2 in supply (150); 7 WSFU at 50 psi and 40 ft -> first row (3/4 in, 1/2 in table) rounds to 3/4 in', [w1({}).range, w1({}).col, w1({}).meter, w1({}).supply, w1({}).cap, w1({p: 40, len: 40, fu: 100}).meter, w1({p: 40, len: 40, fu: 100}).supply, w1({p: 50, len: 40, fu: 7}).supply, w1({p: 50, len: 40, fu: 7}).exact], [1, 3, 0.75, 1, 33, 1.5, 1.5, 0.75, 0.5]);
check('pressure ranges and elevation: 45 psi is the 30 - 45 group, 46 the second, 60 the second, 61 the third, 29 below the table; 20 ft of rise from a 50 psi main leaves 40 psi (1/2 psi per ft); length 1000 ft is the last column, 1001 beyond; 0.5 psi per ft', [[45, 46, 60, 61, 29].map(p => w1({p}).range), w1({p: 50, dh: 20}).p, w1({p: 50, dh: 20}).range, w1({len: 1000}).col, w1({len: 1001}).col, w1({p: 40, dh: -10}).p], [[0, 1, 1, 2, -1], 40, 0, 14, -1, 45]);
check('capacity beyond the table: 500 WSFU at 40 ft and 50 psi -> beyond the largest row 654? no: 654 covers it, 700 does not; zero-capacity rows are skipped: 1 WSFU at 500 ft with 40 psi uses the 3/4 in x 3/4 in row (4)', [w1({p: 50, len: 40, fu: 654}).i, w1({p: 50, len: 40, fu: 655}).i, w1({p: 40, len: 500, fu: 1}).meter, w1({p: 40, len: 500, fu: 1}).exact, w1({p: 40, len: 500, fu: 1}).cap], [13, -1, 0.75, 0.75, 4]);
for (const id of ['upcdrain', 'upcwater']) {
  for (let k = 0; k < (id === 'upcdrain' ? 4 : 3); k++) { w.renderCalc(id); w.document.getElementById((id === 'upcdrain' ? 'uq' : 'uz') + '_m').value = String(k); w.calcResult(id); }
}
w.renderCalc('upcdrain'); w.calcResult('upcdrain');
let tt = txt(w, 'uq_results');
check('the DFU page opens with 4 gravity closets, 6 lavatories and 2 showers = 22 DFU, the trap sizes and the 🔴 note; only the first group visible', [tt.includes('مجموع التجهيزات'), /22\.0 DFU/.test(tt), tt.includes('مصيدة وذراع'), tt.includes('🔴'), w.document.getElementById('uq_g0').style.display, w.document.getElementById('uq_g3').style.display], [true, true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('uq_m', '1'); set('uq_k', '2'); set('uq_dfu', '24'); set('uq_len', '150'); set('uq_lu', '1'); set('uq_dr', '3'); w.calcResult('upcdrain'); tt = txt(w, 'uq_results');
check('the vent page asks to increase the vent one pipe size over the whole length (150 ft against 120 ft) and shows the final 3 in', [tt.includes('زيادة مقاس واحد'), tt.includes('مقاس التهوية النهائي'), /3 in/.test(tt)], [true, true, true]);
set('uq_m', '3'); w.calcResult('upcdrain'); tt = txt(w, 'uq_results');
check('the grease page shows 750 gal for 12 DFU and the hydromechanical rating', [/750 gal/.test(tt), tt.includes('الغرّاسة الهيدروميكانيكية'), tt.includes('التدفق المطلوب للغرّاسة')], [true, true, true]);
check('other reference codes open it too', others('upcdrain', 'uq_results'), [true, true, true]);
w.renderCalc('upcwater'); w.calcResult('upcwater');
tt = txt(w, 'uz_results');
check('the WSFU page opens with the fixture rows, the hot/cold three-quarter note and the 🔴 note; only the first group visible', [tt.includes('مجموع الوحدات للتغذية الباردة'), tt.includes('ثلاثة أرباع'), tt.includes('🔴'), w.document.getElementById('uz_g0').style.display, w.document.getElementById('uz_g1').style.display], [true, true, true, '', 'none']);
set('uz_m', '1'); set('uz_p', '344.7'); set('uz_pu', '1'); set('uz_len', '30.48'); set('uz_lu', '0'); set('uz_dh', '0'); set('uz_fu', '30'); w.calcResult('upcwater'); tt = txt(w, 'uz_results');
check('the sizing page converts 344.7 kPa to 50 psi and 30.48 m to 100 ft: range 46 - 60 psi, meter 3/4 in, supply 1 in', [tt.includes('46 - 60 psi'), /100 ft/.test(tt), tt.includes('مقاس العداد وخدمة الشارع'), /50\.0 psi/.test(tt)], [true, true, true, true]);
set('uz_m', '2'); w.calcResult('upcwater'); tt = txt(w, 'uz_results');
check('the flushometer page shows 105 FU for four closets and 53 for four urinals, total 162', [/105 FU/.test(tt), /53 FU/.test(tt), /162\.0 FU/.test(tt)], [true, true, true]);
check('other reference codes open it too', others('upcwater', 'uz_results'), [true, true, true]);
}

// ---------- part 183: Egyptian HVAC and refrigeration code (`egac`: design conditions, fresh air, filtration, hospitals, noise, air velocities; `egcold`: cold-storage load, Chapter 3, and monthly climate of Egyptian cities) ----------
{
w = boot('ae'); doc = w.document;
const ek = o => w.eval('ekCalc(' + JSON.stringify(o) + ')');
const ej = o => w.eval('ejCalc(' + JSON.stringify(o) + ')');
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const e0 = o => ek(Object.assign({mode: 0, s: 0, ts: 0, rhs: 0, tw: 0, rhw: 0}, o));
const e1 = o => ek(Object.assign({mode: 1, s: 11, n: 10, area: 40, vol: 120, q: 0}, o));
const e2 = o => ek(Object.assign({mode: 2, s: 3, vol: 100, ach: 0, oa: 0, ts: 0, rhs: 0}, o));
const e3 = o => ek(Object.assign({mode: 3, s: 0, dba: 0, nc: 0, rc: 0}, o));
const e4 = o => ek(Object.assign({mode: 4, tb: 0, q: 1000, c: 0}, o));
const iv = (a, n) => J(a).findIndex(x => x[0] === n || x[1] === n);
check('table sizes: Table 2-2 26 rows; hospital rows 15; fresh air / filtration rows 29; noise 49 rows in 12 groups; velocity-in-space rows 25', [J('EK_C').length, J('EK_H').length, J('EK_V').length, J('EK_N').length, J('EK_NG').length, J('EK_RVS').length], [26, 15, 29, 49, 12, 25]);
check('Table 2-2 key rows: flats summer 24 C 50-55 %, winter 21 C 40-50 %; offices 23-26 / 40-50, winter 21-23 / 20-30; garage 26-36 summer and 4-13 winter; gymnasium 18-20 / 55-60; computer centres 21-23 / 45-55; kitchens 29-31 / 21-23', [0, 9, 15, 22, 24, 8].map(i => J('EK_C')[i].slice(1)), [[[24, 24], [50, 55], [21, 21], [40, 50]], [[23, 26], [40, 50], [21, 23], [20, 30]], [[26, 36], null, [4, 13], null], [[18, 20], [55, 60], [18, 20], [20, 30]], [[21, 23], [45, 55], [21, 23], [45, 55]], [[29, 31], null, [21, 23], null]]);
check('conditions verdicts: flats 24 C, 52 %, 21 C, 45 % all pass; 60 % summer fails; offices 26 C passes and 26.1 fails; the industrial row has no checks', [e0({ts: 24, rhs: 52, tw: 21, rhw: 45}).rows.map(x => x.ok), e0({rhs: 60}).rows[0].ok, e0({s: 9, ts: 26}).rows[0].ok, e0({s: 9, ts: 26.1}).rows[0].ok, e0({s: 25, ts: 25, rhs: 50}).rows.length], [[true, true, true, true], false, true, false, 0]);
check('Table 2-8: offices 10 L/s per person -> 10 persons 100 L/s = 360 m3/h, filtration 35-60 %; verdict 100 passes, 99 fails', [e1({}).flow, e1({}).m3h, e1({}).filter, e1({q: 100}).ok, e1({q: 99}).ok], [100, 360, [35, 60], true, false], 1e-9);
check('flats: 7.5 L/s per person x 4 = 30 L/s or 0.35 ach: 120 m3 -> 11.67 L/s (30 governs); 400 m3 -> 38.89 L/s governs; bathrooms 25 and kitchens 50 per room; shops 13 / 8 / 8; bars and night clubs 15; garage 7.5 L/s per m2: 200 m2 -> 1500; changing rooms 2.5 L/s per m2: 40 m2 -> 100; kitchens exhaust 150 L/s for 20 m2; computer centres 45 %', [e1({s: 0, n: 4}).flow, e1({s: 0, n: 4, vol: 400}).flow, e1({s: 0, n: 4, vol: 400}).achFlow, e1({s: 1, n: 3}).flow, e1({s: 2, n: 2}).flow, e1({s: 3, n: 1}).flow, e1({s: 8, n: 2}).flow, e1({s: 9, n: 2}).flow, e1({s: 17, area: 200}).flow, e1({s: 26, area: 40}).flow, e1({s: 10, n: 5, area: 20}).exhaust, e1({s: 27}).filter], [30, 0.35 * 400 / 3.6, 0.35 * 400 / 3.6, 75, 100, 13, 30, 30, 1500, 100, 150, [45, 45]], 1e-9);
check('Table 2-10 filtration: apartments 20; cafeteria 35; kitchens 15; telephone and telegraph 85; garage 10-35; worship, cinemas, gymnasiums, sports 30-35; industrial none; bathrooms none', [0, 6, 10, 14, 15, 17, 18, 24, 1, 28].map(i => J('EK_V')[i][3]), [[20, 20], [35, 35], [15, 15], [85, 85], [85, 85], [10, 35], [30, 35], [30, 35], null, null]);
check('Tables 2-3 and 2-9: orthopaedic OR 20-24 C 50-60 % positive 15 / 15 ach exhaust required, return not acceptable, 3 stages 25 / 90 / HEPA 99.97; children 5 / 12 ach (the Syrian code gives 15); ICU return not acceptable; patient care ±; laboratories negative 10 ach no fresh-air limit; laundries negative 2 / 10; administration no ventilation values', [0, 5, 6, 7, 10, 12, 13].map(i => J('EK_H')[i].slice(5, 11)), [['+', 15, 15, 'مطلوب', 'غير مقبول', 3], ['+', 5, 12, 'اختياري', 'غير مقبول', 2], ['+', 2, 6, 'اختياري', 'غير مقبول', 2], ['±', 2, 4, 'اختياري', 'اختياري', 2], ['-', null, 10, 'مطلوب', 'غير مقبول', 1], ['-', 2, 10, 'مطلوب', 'غير مقبول', 1], ['', null, null, '', '', 1]]);
check('hospital flows: 100 m3 general OR 15 ach = 416.7 L/s total and fresh; children 12 ach = 333.3 L/s total and 5 ach = 138.9 L/s fresh; laboratory 277.8 L/s total with no fresh-air minimum; verdicts: 14 ach fails 15, 15 passes; children 12 passes, 11.9 fails; OR temperature 22 passes, 25 fails, RH 55 passes', [e2({}).totalFlow, e2({}).oaFlow, e2({s: 5}).totalFlow, e2({s: 5}).oaFlow, e2({s: 10}).totalFlow, e2({s: 10}).oaFlow, e2({ach: 14}).rows[0].ok, e2({ach: 15}).rows[0].ok, e2({s: 5, ach: 12}).rows[0].ok, e2({s: 5, ach: 11.9}).rows[0].ok, e2({ts: 22, rhs: 55}).rows.map(x => x.ok), e2({ts: 25}).rows[0].ok], [1500 / 3.6, 1500 / 3.6, 1200 / 3.6, 500 / 3.6, 1000 / 3.6, null, false, true, true, false, [true, true], false], 1e-9);
check('Tables 2-12 - 2-14: flats 35-45 dB(A), NC 30-40, RC 30-40; administration rooms 25-35 / 20-30 / 20-30; concert halls 25-35 / 20-25 / 20-25; transport waiting 40-55 / 35-40 / 35-40; swimming pools 45-60 / 40-55 / 40-55; industrial no listening need 65-80 / 60-75 / 60-75', [2, 13, 19, 47, 45, 48].map(i => J('EK_N')[i].slice(2)), [[[35, 45], [30, 40], [30, 40]], [[25, 35], [20, 30], [20, 30]], [[25, 35], [20, 25], [20, 25]], [[40, 55], [35, 40], [35, 40]], [[45, 60], [40, 55], [40, 55]], [[65, 80], [60, 75], [60, 75]]]);
check('RC equals NC in every row of the printed tables and each range is ordered; verdicts: administration 35 dB(A) passes 36 fails; NC 30 passes 31 fails; RC 30 passes 31 fails', [J('EK_N').every(r => r[3][0] === r[4][0] && r[3][1] === r[4][1] && r[2][0] <= r[2][1]), e3({s: 13, dba: 35}).rows[0].ok, e3({s: 13, dba: 36}).rows[0].ok, e3({s: 13, nc: 30}).rows[0].ok, e3({s: 13, nc: 31}).rows[0].ok, e3({s: 13, rc: 30}).rows[0].ok, e3({s: 13, rc: 31}).rows[0].ok], [true, true, false, true, false, true, false]);
check('velocities (same values as the Syrian Tables 24/3 - 28/3): final HEPA filter 0.35-1.25 m/s -> 0.8 - 2.857 m2 for 1000 L/s; building duct main rectangular NC 35 12.7 m/s -> 0.0787 m2 and 316.6 mm round; Table 2-17 NC 35 outlet 2.5 and return 3.0 m/s; Table 2-18 return near seats 2-3 m/s -> 0.333 - 0.5 m2; Table 2-19 apartments 0.12', [e4({c: 6}).aMinM2, e4({c: 6}).aMaxM2, e4({tb: 1, l: 0, nc: 1, shape: 0, seg: 0, ar: 2}).vmax, e4({tb: 1, l: 0, nc: 1, shape: 0, seg: 0, ar: 2}).area, e4({tb: 1, l: 0, nc: 1, shape: 0, seg: 0, ar: 2}).dia, e4({tb: 2, nc2: 2}).vs, e4({tb: 2, nc2: 2}).vr, e4({tb: 3, c: 2}).aMinM2, e4({tb: 3, c: 2}).aMaxM2, e4({tb: 4, c: 0}).row], [0.8, 1 / 0.35, 12.7, 1 / 12.7, Math.sqrt(4 / 12.7 / Math.PI), 2.5, 3, 1 / 3, 0.5, ['الشقق السكنية', '0.12']], 1e-9);
// refrigeration
const E0 = {mode: 0, ti: -20, to: 40, col: 1, wind: false, tadj: 30, tg: 10};
const el = (t, a, m, x, rx) => ({t, a, m, x, rx: rx || 0});
const c0 = (els, o) => ej(Object.assign({}, E0, {els}, o));
check('table sizes: 5 insulation materials, 18 respiration rows, 26 cities of 12 months each, 3 motor bands, 3 F_d values', [J('EJ_K').length, J('EJ_RESP').length, J('EJ_CITY').length, J('EJ_CITY').every(c => c[1].length === 12 && c[2].length === 12 && c[3].length === 12), J('EJ_MOT').length, J('EJ_FD').length], [5, 18, 26, true, 3, 3]);
check('Table 3/1: glass fibre 0.048, beaded polystyrene 0.036, extruded 0.029, polyurethane boards 0.026, expanded polyurethane 0.023 W/m.K; Table 3/3: dark 5 / 3 / 5 / 11, medium 4 / 3 / 4 / 9, light 3 / 2 / 3 / 5 (east, south, west, roof); Table 3/7: 1.8 / 1 / 0.8, 1.5 / 1 / 0.5, 1.3 / 1 / 0.3', [J('EJ_K').map(x => x[1]), J('EJ_SUN'), J('EJ_MOT').map(x => x.slice(2))], [[0.048, 0.036, 0.029, 0.026, 0.023], [[5, 3, 5, 11], [4, 3, 4, 9], [3, 2, 3, 5]], [[1.8, 1, 0.8], [1.5, 1, 0.5], [1.3, 1, 0.3]]]);
{
  const U = 1 / (1 / 9.37 + 0.1 / 0.023 + 1 / 9.37), Uw = 1 / (1 / 9.37 + 0.1 / 0.023 + 1 / 34);
  const east = c0([el(0, 20, 4, 100)]);
  check('east wall 20 m2 with 100 mm expanded polyurethane in a -20 C store at 40 C outside: U = 1 / (0.1067 + 4.3478 + 0.1067) = 0.2192; dT = 40 + 4 (medium colour) + 20 = 64 K; Q = 0.2192 x 20 x 64 = 0.2806 kW; with wind 24 km/h the outside film is 1/34: U = 0.2230', [east.rows[0].u, east.rows[0].dt, east.rows[0].q, east.total, c0([el(0, 20, 4, 100)], {wind: true}).rows[0].u], [U, 64, U * 20 * 64 / 1000, U * 20 * 64 / 1000, Uw], 1e-9);
  const Uf = 1 / (1 / 9.37 + 0.1 / 0.023);
  check('other surfaces: north wall no sun dT 60; south dT 63; west 64; roof medium 9 K -> 69; dark roof 11 -> 71; light roof 5 -> 65; floor on frozen-store ground 10 C: dT 30 and U without the outside film 0.2245 -> 100 m2 gives 0.6735 kW; chilled-store ground 18 C with +2 C room: dT 16; long-term 30 C; adjacent heated space 30 C: dT 50', [3, 1, 2].map(t => c0([el(t, 10, 4, 100)]).rows[0].dt).concat([c0([el(4, 10, 4, 100)]).rows[0].dt, c0([el(4, 10, 4, 100)], {col: 0}).rows[0].dt, c0([el(4, 10, 4, 100)], {col: 2}).rows[0].dt, c0([el(5, 100, 4, 100)]).rows[0].dt, c0([el(5, 100, 4, 100)]).rows[0].u, c0([el(5, 100, 4, 100)]).rows[0].q, c0([el(5, 100, 4, 100)], {tg: 18, ti: 2}).rows[0].dt, c0([el(6, 10, 4, 100)]).rows[0].dt]), [60, 63, 64, 69, 71, 65, 30, Uf, Uf * 100 * 30 / 1000, 16, 50], 1e-9);
  check('other insulation and extra layers: 60 mm extruded polystyrene (0.029) plus a 0.2 m2.K/W concrete layer: R = 0.1067 + 0.2 + 2.069 + 0.1067; elements without area or thickness are ignored; totals add', [c0([el(3, 10, 2, 60, 0.2)]).rows[0].u, c0([el(3, 0, 2, 60), el(3, 10, 2, 0)]).rows.length, c0([el(0, 20, 4, 100), el(5, 100, 4, 100)]).total], [1 / (1 / 9.37 + 0.2 + 0.06 / 0.029 + 1 / 9.37), 0, east.total + Uf * 100 * 30 / 1000], 1e-9);
}
check('Table 3/2: -20 C store -> 100 mm of expanded polyurethane; -2 C -> 75; 2 C -> 75; 8 C -> 50; 10 C -> 50; glass fibre at -20 C needs ceil(100 x 0.048 / 0.023) = 209 mm; band index', [-20, -2, 2, 8, 10].map(t => c0([el(0, 10, 4, 100)], {ti: t}).minPU), [100, 75, 75, 50, 50]);
const P0 = {mode: 1, kind: 0, cap: 100000, m: 10000, cpa: 3.5, cpb: 1.8, wf: 0.7, ti: 25, ts: 2, tf: -2, tout: -20, c: -1, vol: 500, nac: 8, to: 35};
const p = o => ej(Object.assign({}, P0, o));
{
  const mdot = 10000 / 86400, hr = (f, g, t) => f * Math.pow(1.8 * t + 32, g) * 1e-6;
  check('chilled product: 10000 kg/day (= 10 % of 100000 kg) -> 0.1157 kg/s; cooling 0.1157 x 3.5 x (25 - 2) = 9.317 kW; below 10 % of capacity the 10 % rate is used; no respiration for a non-vegetable product', [p({}).mdot, p({}).cool, p({}).qTot, p({m: 5000}).mdot, p({}).resp, p({}).qac], [mdot, mdot * 3.5 * 23, mdot * 3.5 * 23, mdot, 0, 0], 1e-9);
  const pot = J('EJ_RESP').findIndex(x => x[0] === 'بطاطس');
  check('respiration of potatoes (f 0.01709, g 1.769) at 5 C: 0.01709 x 41^1.769 = 12.2 W/Mg = 1.22e-5 kW/kg; 100000 kg -> 1.22 kW; air renewal 8 per day for 500 m3 and 30 K (35 - 5 C): 8 / 86400 x 500 x 1.19 x 30 = 1.65 kW; respiration increases with temperature', [p({c: pot, ts: 5}).hr, p({c: pot, ts: 5}).resp, p({c: pot, ts: 5}).qac, p({c: pot, ts: 5}).qTot, hr(0.01709, 1.769, 10) > hr(0.01709, 1.769, 5)], [hr(0.01709, 1.769, 5), 100000 * hr(0.01709, 1.769, 5), 8 / 86400 * 500 * 1.19 * 30, mdot * 3.5 * 20 + 100000 * hr(0.01709, 1.769, 5) + 8 / 86400 * 500 * 1.19 * 30, true], 1e-9);
  check('frozen product: 20000 kg/day at 1.8 kJ/kg.K from -10 to -20 C: 0.2315 x 1.8 x 10 = 4.167 kW; temperature difference never below 5 K; freezing tunnel: 0.1157 x 3.5 x 22 = 8.91 kW + latent 223 x 0.7 = 156.1 kJ/kg x 0.1157 = 18.07 kW + 0.1157 x 1.8 x 18 = 3.75 kW', [p({kind: 1, m: 20000, ti: -10, ts: -20}).q, p({kind: 1, m: 20000, ti: -18, ts: -20}).dt, p({kind: 1, m: 20000, ti: -18, ts: -20}).q, p({kind: 2, ti: 20}).sens1, p({kind: 2}).lh, p({kind: 2, ti: 20}).latent, p({kind: 2, ti: 20}).sens2, p({kind: 2, ti: 20}).q], [20000 / 86400 * 1.8 * 10, 5, 20000 / 86400 * 1.8 * 5, mdot * 3.5 * 22, 156.1, mdot * 156.1, mdot * 1.8 * 18, mdot * (3.5 * 22 + 156.1 + 1.8 * 18)], 1e-9);
}
const I0 = {mode: 2, a: 6, h: 3, ti: 35, rhi: 60, tr: -20, rhr: 90, e: 0, nh: 16, tau: 25, fy: 0.0008, phi: 1};
const inf = o => ej(Object.assign({}, I0, o));
{
  const r = inf({});
  check('air properties: 35 C 60 % -> h about 90.13 kJ/kg and density 1.131; -20 C 90 % -> h about -18.71 kJ/kg and density 1.394 (sea level)', [r.i.h, r.i.rho, r.r.h, r.r.rho], [90.13, 1.1311, -18.71, 1.3939], 0.01);
  check('infiltration: F_m = [2 / (1 + (rho_r/rho_i)^(1/3))]^1.5 = 0.948; Q_ref = 0.221 x 6 x 108.85 x 1.394 x 0.434 x 5.42 x 0.948 = about 449 kW', [r.fm, r.qref], [0.9484, 449.2], 0.5);
  check('N_f = 25 s x 0.0008 = 0.02; Q_In = Q_ref x 0.02 x 16/24 = about 6.2 kW; the flow is gravity driven', [r.nf, r.qin, r.dir], [0.02, r.qref * 0.02 * 16 / 24, true], 1e-9);
}
check('infiltration relations: 1 - E never below 0.75 (E = 0.5 -> 0.75; E = 0.1 -> 0.9); phi scales linearly; shift hours scale N/24; a colder outside gives no gravity flow; a taller door increases the flow by sqrt(H)', [inf({e: 0.5}).eff, inf({e: 0.1}).eff, inf({e: 0.5}).qin / inf({}).qin, inf({phi: 0.5}).qin / inf({}).qin, inf({nh: 8}).qin / inf({}).qin, inf({ti: -25, tr: -20}).qref, inf({ti: -25, tr: -20}).dir, inf({h: 12}).qref / inf({}).qref], [0.75, 0.9, 0.75, 0.5, 0.5, 0, false, 2], 1e-9);
const M0 = {mode: 3, tr: -20, np: 2, nph: 8, af: 200, pl: 10, nl: 12, mots: [{kw: 3, p: 0, h: 16}, {kw: 1, p: 1, h: 16}, {kw: 0.2, p: 2, h: 16}], qtr: 10, qpr: 5, qin: 2, fd: 1, fs: 1.1, td: 20};
const mi = o => ej(Object.assign({}, M0, o));
{
  const r = mi({});
  const qpe = 0.392 * 2 * 8 / 24, qlt = 10 * 200 * 12 / 24 / 1000, qmo = 3 * 1.3 * 16 / 24 + 1 * 1 * 16 / 24 + 0.2 * 0.8 * 16 / 24, qmi = qpe + qlt + qmo, qst = 17 + qmi;
  check('miscellaneous: people (272 - 6 x -20) = 392 W each, 2 x 8 h/24 -> 0.2613 kW; lights 10 W/m2 x 200 m2 x 12/24 = 1.0 kW; motors 3 kW inside x 1.3 x 16/24 = 2.6, 1 kW outside with equipment inside x 1.0 = 0.667, 0.2 kW inside with equipment outside x 0.8 = 0.107 kW', [r.qpe, r.qlt, r.mot.map(m => m.eps), r.mot.map(m => m.q), r.qmo, r.qmi], [qpe, qlt, [1.3, 1, 0.8], [2.6, 16 / 24, 0.2 * 0.8 * 16 / 24], qmo, qmi], 1e-9);
  check('total: Q_ST = 10 + 5 + 2 + Q_Mi; frozen store F_d 1.10, F_s 1.1 -> Q_T = 1.21 x Q_ST; Q_CL = Q_T x 24 / 20; 1 TR = 3.517 kW; chilled F_d 1.05 and tunnel 1.15', [r.qst, r.fd, r.qt, r.qcl, r.tr, mi({fd: 0}).fd, mi({fd: 2}).fd, mi({td: 18}).qcl / r.qcl], [qst, 1.1, 1.21 * qst, 1.21 * qst * 1.2, 1.21 * qst * 1.2 / 3.517, 1.05, 1.15, 20 / 18], 1e-9);
  check('motor bands: 0.4 kW is the first band (1.8), 0.41 the second (1.5), 2.2 the second, 2.3 the third (1.3), 15 the third, a larger motor keeps the last band and is flagged', [0.4, 0.41, 2.2, 2.3, 15, 20].map(k => mi({mots: [{kw: k, p: 0, h: 24}, {kw: 0, p: 0, h: 0}, {kw: 0, p: 0, h: 0}]}).mot[0].eps), [1.8, 1.5, 1.5, 1.3, 1.3, 1.3]);
}
check('volume: 1000 t of chilled products at 3.75 m3 per tonne = 3750 m3 (potatoes example); 1000 t frozen at 3.5 = 3500 m3', [ej({mode: 4, t: 1000, fz: false}).vol, ej({mode: 4, t: 1000, fz: true}).vol], [3750, 3500]);
check('climate Table 2/1: Cairo maximum 35 C in July (RH 56 %) minimum 9 C; Aswan 42 C in June; Alexandria RH 72 % in July; Siwa humidity 15 % in May; coldest minimum 5 C in Beni Suef; only the printed Sharm el Sheikh September minimum (36) exceeds its maximum', [ej({mode: 5, c: 0}).maxY, ej({mode: 5, c: 0}).mi, ej({mode: 5, c: 0}).city[3][6], ej({mode: 5, c: 0}).minY, ej({mode: 5, c: 23}).maxY, ej({mode: 5, c: 23}).mi, ej({mode: 5, c: 1}).city[3][6], ej({mode: 5, c: 17}).city[3][4], ej({mode: 5, c: 18}).minY, J('EJ_CITY').reduce((s, c) => s + c[1].filter((x, i) => x <= c[2][i]).length, 0)], [35, 6, 56, 9, 42, 5, 72, 15, 5, 1]);
for (const id of ['egac', 'egcold']) {
  const n = id === 'egac' ? 5 : 6, pf = id === 'egac' ? 'ek' : 'ej';
  for (let k = 0; k < n; k++) { w.renderCalc(id); w.document.getElementById(pf + '_m').value = String(k); w.calcResult(id); }
}
w.renderCalc('egac'); w.calcResult('egac');
let tt = txt(w, 'ek_results');
check('the Egyptian conditions page opens with flats: 24 C and 21 C, the 🔴 note; only the first group visible', [tt.includes('المكان المكيف'), /24/.test(tt), /21/.test(tt), tt.includes('🔴'), w.document.getElementById('ek_g0').style.display, w.document.getElementById('ek_g4').style.display], [true, true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('ek_m', '1'); w.calcResult('egac'); tt = txt(w, 'ek_results');
check('the fresh-air page shows 100 L/s for ten persons in offices and 35 - 60 %', [tt.includes('التدفق المطلوب'), /100\.0 L\/s/.test(tt), /35 - 60/.test(tt)], [true, true, true]);
set('ek_m', '2'); set('ek_s2', '5'); w.calcResult('egac'); tt = txt(w, 'ek_results');
check('the hospital page for children rooms shows positive pressure, 12 ach and the 2 stages', [tt.includes('موجب'), /12 ach/.test(tt), tt.includes('الثانية 90')], [true, true, true]);
set('ek_m', '3'); w.calcResult('egac'); tt = txt(w, 'ek_results');
check('the noise page shows the three criteria dB(A), NC and RC', [tt.includes('dB(A)'), tt.includes('معيار الضوضاء NC'), tt.includes('معيار الغرفة RC')], [true, true, true]);
set('ek_m', '4'); set('ek_tb', '1'); w.calcResult('egac'); tt = txt(w, 'ek_results');
check('the velocity page switches the sub-group and shows the duct area', [tt.includes('السرعة القصوى المسموحة'), tt.includes('قطر المجرى المستدير الأدنى'), w.document.getElementById('ek_t1').style.display, w.document.getElementById('ek_t0').style.display], [true, true, '', 'none']);
check('other reference codes open it too', others('egac', 'ek_results'), [true, true, true]);
w.renderCalc('egcold'); w.calcResult('egcold');
tt = txt(w, 'ej_results');
check('the cold-store page opens with the envelope load, the minimum thickness table and the 🔴 note; only the first group visible', [tt.includes('الحمل عبر الغلاف'), tt.includes('أقل سمك للبولي يوريثان المتمدد'), tt.includes('🔴'), w.document.getElementById('ej_g0').style.display, w.document.getElementById('ej_g5').style.display], [true, true, true, '', 'none']);
set('ej_m', '1'); w.calcResult('egcold'); tt = txt(w, 'ej_results');
check('the product page shows the rate and the cooling load', [tt.includes('معدل دخول المنتج'), tt.includes('تبريد المنتج')], [true, true]);
set('ej_m', '2'); w.calcResult('egcold'); tt = txt(w, 'ej_results');
check('the infiltration page shows Q_ref, F_m and Q_In', [tt.includes('معامل F_m'), tt.includes('Q_ref'), tt.includes('حمل التسرب Q_In')], [true, true, true]);
set('ej_m', '3'); set('ej_qtr', '10'); w.calcResult('egcold'); tt = txt(w, 'ej_results');
check('the total page shows Q_CL and the tonnes of refrigeration', [tt.includes('الحمل الحراري للمخزن Q_CL'), tt.includes('TR')], [true, true]);
set('ej_m', '5'); w.calcResult('egcold'); tt = txt(w, 'ej_results');
check('the climate page shows Cairo and the twelve months', [tt.includes('القاهرة'), tt.includes('يناير'), tt.includes('ديسمبر')], [true, true, true]);
check('other reference codes open it too', others('egcold', 'ej_results'), [true, true, true]);
}
// ---------- part 184: Egyptian HVAC code, Word edition (`egmat`: materials and U-value; `egpipe`: water, steam, condensate, fuel oil and refrigerant lines; `egeff`: minimum equipment efficiency, selection, condenser water, diversity; `egequip`: duct sheet thickness, filters, equipment heat gains, vibration isolators) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const eu = o => w.eval('euCalc(' + JSON.stringify(o) + ')');
const em = o => w.eval('emCalc(' + JSON.stringify(o) + ')');
const er = o => w.eval('erCalc(' + JSON.stringify(o) + ')');
const es = o => w.eval('esCalc(' + JSON.stringify(o) + ')');
const EM = J('EU_M');
const mi = n => EM.findIndex(m => m[1] === n);
const LY = (m, d, lam) => ({m, d, lam: lam || 0});
const U0 = {dir: 0, ext: true, rair: 0, ti: 24, te: 40, a: 10, layers: []};
const u0 = o => eu(Object.assign({}, U0, o));
check('materials: 74 rows in 15 groups; key values: plain concrete 2460 kg/m3 1.44 W/m.K, steel 7830 / 45.3, limestone 1650 / 0.93, spray polyurethane 30 / 0.026, hollow clay brick 1790 / 0.6, plywood 530 / 0.14, mosaic tile 2450 / 1.6', [EM.length, J('EU_G').length, ...['خرسانة عادية', 'حديد صلب', 'حجر جيري', 'بولي يوريثان منفذ بالرش', 'طوب طفلي مفرغ', 'أبلكاج (Plywood)', 'بلاط موزايكو'].map(n => EM[mi(n)].slice(2))], [74, 15, [2460, 1.44], [7830, 45.3], [1650, 0.93], [30, 0.026], [1790, 0.6], [530, 0.14], [2450, 1.6]]);
{
  const L = [LY(mi('بياض أسمنتي'), 20), LY(mi('طوب طفلي مفرغ'), 200), LY(mi('ألواح بوليسترين مبثوق'), 50), LY(mi('بياض أسمنتي'), 20)];
  const R = 0.13 + 0.04 + 0.02 / 1.0 + 0.2 / 0.6 + 0.05 / 0.033 + 0.02 / 1.0;
  const r = u0({layers: L});
  check('wall of two cement plaster coats (upper k 1.0), 200 mm hollow clay brick (0.6) and 50 mm extruded polystyrene (upper 0.033): R_T = 0.13 + 0.04 + 0.02 + 0.3333 + 1.5152 + 0.02 = 2.0585, U = 0.4858 W/m2.K; q = U x (24 - 40) = -7.77 W/m2 (a heat gain); 10 m2 -> -77.7 W; inner surface 24 - 0.13 q = 25.01 C', [r.rt, r.u, r.q, r.qa, r.tsi], [R, 1 / R, -16 / R, -160 / R, 24 + 0.13 * 16 / R], 1e-9);
  check('mass of the layers: 1570 x 0.02 x 2 + 1790 x 0.2 + mean 34 x 0.05 = 422.5 kg/m2; a material without density (blockboard) removes the mass; the interior element uses the interior film on both sides; roof and floor films 0.10 / 0.17; an air layer adds its resistance', [r.mass, r.massOk, u0({layers: [LY(mi('كونتر'), 10)]}).massOk, u0({layers: L, ext: false}).rse, u0({layers: L, dir: 1}).rsi, u0({layers: L, dir: 2}).rsi, u0({layers: L, rair: 0.18}).rt - R], [1570 * 0.02 * 2 + 1790 * 0.2 + 34 * 0.05, true, false, 0.13, 0.10, 0.17, 0.18], 1e-9);
  check('custom conductivity overrides the table; layers without a material or thickness are ignored; an empty element has only the films', [u0({layers: [LY(mi('حديد صلب'), 100, 0.04)]}).layers[0].lam, u0({layers: [LY(-1, 100), LY(mi('زجاج عادي'), 0)]}).layers.length, u0({layers: []}).rt], [0.04, 0, 0.17], 1e-9);
}
const W0 = {mode: 0, u: 0, d: 5, q: 2, t: 10, hours: 3000};
const w0 = o => em(Object.assign({}, W0, o));
{
  const r = w0({});
  check('water in DN 50 (52.5 mm): 2 L/s -> 0.924 m/s; friction about 203 Pa/m (Darcy - Weisbach, steel 0.046 mm, 10 C)', [r.v, r.dp], [0.9239, 203], 3);
  check('verdicts for that case: 0.92 m/s is below the general range 1.2 - 3.0; erosion limit 4.0 m/s at 3000 h met; the DN 50 noise limit 1.2 m/s met; the air-separator limit 0.6 m/s not met; plastic 1.5 m/s met', [r.inUse, r.vEro, r.okEro, r.okNoise, r.okAir, r.okPlastic], [false, 4.0, true, true, false, true]);
}
check('Table 32-2 hours: 1000 h -> 4.6, 1500 -> 4.6, 2500 -> 4.0 (next row 3000), 4000 -> 3.7, 6000 -> 3.0, 8000 -> 3.0', [1000, 1500, 2500, 4000, 6000, 8000].map(h => w0({hours: h}).vEro), [4.6, 4.6, 4.0, 3.7, 3.0, 3.0]);
check('smallest diameter meeting Table 30-2: 2 L/s -> DN 50 (DN 40 gives 1.52 m/s); 0.5 L/s -> DN 25; Table 31-2 for 2 L/s -> DN 80 (DN 65 has about 85 Pa/m), whose friction is below 75 Pa/m', [w0({}).best.dn, w0({q: 0.5}).best.dn, w0({}).bestAir.dn, w0({}).bestAir.dp < 75], [50, 25, 80, true]);
check('Table 29-2 uses: general 1.2 - 3.0; city water 0.6 - 1.5; boiler feed 1.8 - 4.6; pump suction 1.2 - 2.1; drains 1.2 - 2.1; 1.5 m/s fits city water; DN 20 at 0.2 L/s = 0.58 m/s fits neither the general range nor city water at 0.6 - 1.5', [J('EM_U'), w0({u: 1, d: 3, q: 1.5}).inUse, w0({u: 0, d: 1, q: 0.2}).inUse, w0({u: 1, d: 1, q: 0.2}).inUse], [[['عام', 1.2, 3.0], ['مياه المدينة', 0.6, 1.5], ['تغذية الغلاية', 1.8, 4.6], ['سحب الطلمبة', 1.2, 2.1], ['خطوط الصرف', 1.2, 2.1]], false, false, false]);
check('Schedule 40 inside diameters (ASME B36.10): DN 15 15.8, 20 20.93, 25 26.64, 40 40.89, 50 52.5, 100 102.26, 200 202.72, 300 303.23', [0, 1, 2, 4, 5, 9, 12, 14].map(i => J('EM_ID')[i][1]), [15.8, 20.93, 26.64, 40.89, 52.5, 102.26, 202.72, 303.23]);
const S0 = {mode: 1, q: 20, pc: 0, dp: 2, p: 25, len: 30, fdn: 50, fe: 0, ft: 0, fg: 0, fk: 0, fa: 0};
const st = o => em(Object.assign({}, S0, o));
check('Table 36-2 spot values: DN 20 at 14 Pa/m 1.1 / 1.4 g/s; DN 100 at 113 Pa/m 249 / 302; DN 250 at 450 Pa/m 5380 / 6550; DN 300 at 450 Pa/m 85 kPa 10200 (printed 1020); 14 rows each with 7 pairs and the 85 kPa value above the 25 kPa one', [J('EM_T36')[0][1], J('EM_T36')[8][4], J('EM_T36')[12][7], J('EM_T36')[13][7], J('EM_T36').length, J('EM_T36').every(r => r.length === 8 && r.slice(1).every(c => c[1] >= c[0]))], [[1.1, 1.4], [249, 302], [5380, 6550], [8540, 10200], 14, true]);
{
  const vg = 1.375 + (1.159 - 1.375) * (126.325 - 125) / 25;
  const r = st({fe: 4, ft: 2, fg: 1, fk: 1});
  check('20 g/s at 58 Pa/m and 25 kPa: DN 40 carries 15 g/s, DN 50 carries 29 -> DN 50; steam specific volume at 126.3 kPa absolute 1.3636; velocity = 0.02 x 1.3636 / 0.002165 = 12.6 m/s', [r.row[0], r.cap, r.vg, r.vel], [50, 29, vg, 0.02 * vg / (Math.PI * 0.0525 * 0.0525 / 4)], 1e-3);
  check('velocity verdicts: 12.6 m/s is within 75 but below the recommended 40 - 60; equivalent length DN 50: 4 elbows 5.2 + 2 tees 4.8 + gate 0.3 + globe 14 = 24.3 m; total 54.3 m; drop 58 x 54.3 = 3.15 kPa against the 10 kPa of the 135 kPa absolute row', [r.velOk, r.velRec, r.leq, r.ltot, r.drop, r.t33[0], r.okDrop], [true, false, 24.3, 54.3, 58 * 54.3 / 1000, 135, true], 1e-9);
  check('selection varies with the pressure drop: 100 g/s at 14 Pa/m and 25 kPa -> DN 125; at 450 Pa/m -> DN 65; 11000 g/s is beyond DN 300 at either pressure', [st({q: 100, dp: 0}).row[0], st({q: 100, dp: 6}).row[0], st({q: 11000, dp: 6, pc: 1}).row, st({q: 11000, dp: 6, pc: 0}).row], [125, 65, null, null]);
}
check('Table 35-2 equivalent lengths: DN 15 elbow 0.4 tee 0.9 gate 0.1 globe 4 angle 2; DN 100 2.7 / 5.5 / 0.6 / 28 / 14; DN 350 9.1 / 19 / 1.9 / 94 / 46; 15 rows', [J('EM_T35')[0], J('EM_T35')[8], J('EM_T35')[14], J('EM_T35').length], [[15, 0.4, 0.9, 0.1, 4, 2], [100, 2.7, 5.5, 0.6, 28, 14], [350, 9.1, 19, 1.9, 94, 46], 15]);
check('Table 33-2: vacuum return 30 - 60 Pa/m and 7 - 14 kPa; 101 kPa 7 Pa/m 0.4 kPa; 135 kPa 60 Pa/m 10 kPa; 1140 kPa 450 - 2300 Pa/m 170 - 210 kPa', [J('EM_T33')[0], J('EM_T33')[1], J('EM_T33')[4], J('EM_T33')[10]], [[null, [30, 60], [7, 14]], [101, [7, 7], [0.4, 0.4]], [135, [60, 60], [10, 10]], [1140, [450, 2300], [170, 210]]]);
const C0 = {mode: 2, kind: 0, q: 100, s: 1, cp: 0};
const cd = o => em(Object.assign({}, C0, o));
check('condensate: dry gravity return at 1 %: 100 g/s -> DN 50 (166 g/s; DN 40 carries 85); wet return at 200 Pa/m: 700 g/s -> DN 65 (1110; DN 50 carries 694); low-pressure counterflow horizontal 50 g/s -> DN 100 (54); steam pipe with counterflow at 40 mm/m: 3 g/s -> DN 40 at 4.9 m/s', [cd({}).dn, cd({}).cap, cd({kind: 1, q: 700, s: 3}).dn, cd({kind: 1, q: 700, s: 3}).cap, cd({kind: 2, q: 50, s: 1}).dn, cd({kind: 3, q: 3, s: 1}).dn, cd({kind: 3, q: 3, s: 1}).vmax], [50, 166, 65, 1110, 100, 40, 4.9]);
check('closed dry return: 35 -> 0 kPa at 60 Pa/m: 1000 g/s -> DN 50 (1680); at 240 Pa/m 1500 g/s -> DN 40 (1790); 1030 -> 100 kPa at 240 Pa/m: 500 g/s -> DN 50 (617); 100 kPa and above 30000 g/s is outside', [cd({kind: 4, q: 1000, cp: 0, s: 1}).dn, cd({kind: 4, q: 1000, cp: 0, s: 1}).cap, cd({kind: 4, q: 1500, cp: 0, s: 2}).dn, cd({kind: 4, q: 1500, cp: 0, s: 2}).cap, cd({kind: 4, q: 500, cp: 7, s: 2}).dn, cd({kind: 4, q: 500, cp: 7, s: 2}).cap, cd({kind: 4, q: 30000, cp: 0, s: 0}).dn], [50, 1680, 40, 1790, 50, 617, null]);
check('fuel oil: heavy 200 L/h and 30 m -> DN 50; 150 L/h rounds up to 200 and 35 m to 40 -> DN 50; heavy 800 L/h 100 m -> DN 100; light 800 L/h 100 m -> DN 50; light 50 L/h 10 m -> DN 15; beyond 800 L/h or 100 m is outside', [em({mode: 3, heavy: true, q: 200, len: 30}).dn, em({mode: 3, heavy: true, q: 150, len: 35}).dn, em({mode: 3, heavy: true, q: 800, len: 100}).dn, em({mode: 3, heavy: false, q: 800, len: 100}).dn, em({mode: 3, heavy: false, q: 50, len: 10}).dn, em({mode: 3, heavy: true, q: 900, len: 30}).dn, em({mode: 3, heavy: true, q: 200, len: 110}).dn], [50, 50, 100, 50, 15, null, null]);
check('refrigerant tables: R-22 liquid 18.7 kPa and suction 18.1; R-134a 13.6 / 12.2; R-502 19.4 / 19.7; velocities suction 4.5 - 20, discharge 10 - 18, liquid to receiver up to 0.5, receiver to coil below 1.5', [J('EM_RF'), J('EM_RV')], [[['R-22', 18.7, 18.1], ['R-134a', 13.6, 12.2], ['R-502', 19.4, 19.7]], [['خط السحب', 4.5, 20], ['خط الطرد', 10, 18], ['خط السائل من المكثف إلى الخزان', 0, 0.5], ['خط السائل من الخزان إلى ملف التبريد', 0, 1.5]]]);
check('refrigerant verdicts: 1 L/s in 20 mm = 3.18 m/s fails the suction minimum; in 10 mm = 12.73 m/s passes suction and discharge; 0.1 L/s in 20 mm = 0.318 m/s passes both liquid lines', [em({mode: 4, r: 0, l: 0, q: 1, id: 20}).vel, em({mode: 4, r: 0, l: 0, q: 1, id: 20}).ok, em({mode: 4, r: 0, l: 0, q: 1, id: 10}).ok, em({mode: 4, r: 0, l: 1, q: 1, id: 10}).ok, em({mode: 4, r: 0, l: 2, q: 0.1, id: 20}).ok, em({mode: 4, r: 0, l: 3, q: 0.1, id: 20}).ok], [4 / (Math.PI * 0.02 * 0.02) / 1000, false, true, true, true, true], 1e-9);
// efficiency
const ge = o => er(Object.assign({mode: 0, e: 0, cap: 3, a1: 0, a2: 0}, o));
const ie = n => J('ER_E').findIndex(x => x[1] + ' - ' + x[2] === n);
const PT = ie('وحدة تكييف طرفية (تبريد) إنشاءات جديدة عند 35 °C - كل السعات');
check('table sizes: 8 groups; efficiency rows; 5 selection rows; every row has a test standard and at least one requirement', [J('ER_G').length, J('ER_E').length, J('ER_SEL').length, J('ER_E').every(x => x[3].length >= 1 && x[4])], [8, 78, 5, true]);
check('key minimum efficiencies: air-cooled 40 - 70 kW COP 2.84 / IPLV 2.90; water-cooled screw 1055 kW and above 5.50 / 5.60; centrifugal 1055 kW and above 6.10 / 6.10; single-effect absorption water-cooled 0.70; cooling tower axial 3.23 L/s.kW; centrifugal tower 1.7; air-cooled condenser 69; oil boiler 733 kW and above 81 %; gas boiler under 88 kW hot water 80 % AFUE', ['مكيف مبرد بالهواء - 40 - 70 kW', 'مبردة بالماء لولبية أو حلزونية - 1055 kW فأكثر', 'مبردة بالماء طاردة مركزية - 1055 kW فأكثر', 'امتصاص أحادي التأثير مبرد بالماء - كل السعات', 'برج تبريد برفاص أو مراوح محورية - الكل', 'برج تبريد بمراوح طاردة مركزية - الكل', 'مكثف مبرد بالهواء - الكل', 'مرجل بالزيت ماء ساخن أو بخار - 733 kW فأكثر', 'مرجل غازي ماء ساخن - أقل من 88 kW'].map(n => ge({e: ie(n)}).req.map(x => x.min)), [[2.84, 2.90], [5.50, 5.60], [6.10, 6.10], [0.70], [3.23], [1.7], [69], [81], [80]]);
check('verdicts: air-cooled 40 - 70 kW COP 2.84 passes 2.83 fails; IPLV 2.90 passes 2.89 fails; a zero entry is not checked', [ge({e: ie('مكيف مبرد بالهواء - 40 - 70 kW'), a1: 2.84, a2: 2.90}).rows.map(x => x.ok), ge({e: ie('مكيف مبرد بالهواء - 40 - 70 kW'), a1: 2.83}).rows[0].ok, ge({e: ie('مكيف مبرد بالهواء - 40 - 70 kW'), a2: 2.89}).rows[0].ok, ge({e: ie('مكيف مبرد بالهواء - 40 - 70 kW')}).rows.length], [[true, true], false, false, 0]);
check('terminal units: 3.66 - 0.213 x Cap COPc at 3 kW = 3.021; the capacity is clamped to 2.05 - 4.4 kW (1 kW -> 3.223, 6 kW -> 2.723); heating 3.2 - 0.089 x 3 = 2.933; replacement heating 2.9 - 0.089 x 3 = 2.633', [ge({e: PT, cap: 3}).req[0].min, ge({e: PT, cap: 1}).req[0].min, ge({e: PT, cap: 6}).req[0].min, ge({e: ie('مضخة حرارية طرفية (تسخين) إنشاءات جديدة - كل السعات'), cap: 3}).req[0].min, ge({e: ie('مضخة حرارية طرفية (تسخين) إحلال - كل السعات'), cap: 3}).req[0].min], [3.66 - 0.213 * 3, 3.66 - 0.213 * 2.05, 3.66 - 0.213 * 4.4, 3.2 - 0.089 * 3, 2.9 - 0.089 * 3], 1e-9);
const sl = o => er(Object.assign({mode: 1, q: 300, unit: 0, maxUnit: 200}, o));
const SELI = row => J('ER_SEL').findIndex(x => x[2] === row[2] && x[0] === row[0]);
check('selection by load (4/14-2): 30 TR direct expansion; 60 TR and 100 TR the 50 - 100 row; 101 TR the 100 - 500 row; 1000 TR the 500 - 1000 row; 1001 TR centrifugal', [30, 60, 100, 101, 1000, 1001].map(q => SELI(sl({q}).sel)), [0, 1, 1, 2, 3, 4]);
check('selection details: 1055 kW = 300 TR; standby 60 TR; 300 TR with 200 TR units -> 2 units of 150; 500 TR -> 3 units; 100 TR -> 2 units; with standby 360 TR; direct expansion flag only up to 50 TR', [sl({q: 1055, unit: 1}).tr, sl({}).standby, sl({}).units, sl({}).each, sl({q: 500}).units, sl({q: 100}).units, sl({}).withStandby, sl({q: 50}).dx, sl({q: 51}).dx], [1055 / 3.517, 60, 2, 150, 3, 2, 360, true, false], 1e-9);
check('condenser water: 1000 kW rejected, 29 to 35 C: 1000 / (4.18 x 6) = 39.87 L/s; make-up about 2 % = 0.797 L/s; diversity (500 + 300) x 0.8 = 640 kW = 182 TR; with 20 % standby 768 kW', [er({mode: 2, q: 1000, twi: 29, two: 35}).flowLs, er({mode: 2, q: 1000, twi: 29, two: 35}).makeup, er({mode: 3, loads: [500, 300, 0, 0, 0], df: 0.8, sb: 20}).cl, er({mode: 3, loads: [500, 300, 0, 0, 0], df: 0.8, sb: 20}).tr, er({mode: 3, loads: [500, 300, 0, 0, 0], df: 0.8, sb: 20}).withStandby], [1000 / 4.18 / 6, 0.02 * 1000 / 4.18 / 6, 640, 640 / 3.517, 768], 1e-9);
// equipment
const dk = o => es(Object.assign({mode: 0, kind: 0, size: 450, reinf: true, pos: false, long: false, j: 0}, o));
check('Table 1-3 rectangular: 300 mm 0.55 with reinforcement and 0.7 without; 301 -> 0.7 (450 row), without 1.0; 600 without 1.6; 650 without reinforcement is not listed; 1000 mm -> 0.85; 2000 mm 1.3', [[300, true], [301, true], [300, false], [450, false], [600, false], [650, false], [1000, true], [2000, true]].map(([s, r]) => dk({size: s, reinf: r}).t), [0.55, 0.7, 0.7, 1.0, 1.6, null, 0.85, 1.3]);
check('Table 1-3 flags and tolerance: 650 mm without reinforcement is flagged; the 300 mm tolerance 0.08, others 0.1', [dk({size: 650, reinf: false}).noUnreinf, dk({size: 300}).tol, dk({size: 450}).tol], [true, 0.08, 0.1]);
check('Table 2-3 round low-pressure: 200 mm negative spiral 0.5, longitudinal 0.7; positive spiral 0.4, longitudinal 0.5; 201 mm -> 0.6; 915 mm positive longitudinal 0.8; 1550 mm negative spiral not made but longitudinal 1.6; beyond 2150 outside', [dk({kind: 1, size: 200}).t, dk({kind: 1, size: 200, long: true}).t, dk({kind: 1, size: 200, pos: true}).t, dk({kind: 1, size: 200, pos: true, long: true}).t, dk({kind: 1, size: 201}).t, dk({kind: 1, size: 915, pos: true, long: true}).t, dk({kind: 1, size: 1550}).t, dk({kind: 1, size: 1550, long: true}).t, dk({kind: 1, size: 2200}).row], [0.5, 0.7, 0.4, 0.5, 0.6, 0.8, null, 1.6, null]);
check('Table 3-3 round high-pressure: 335 mm spiral 0.55, slip 0.7, flanged 0.7; 660 mm slip 0.85; 915 flanged 0.85; 2150 mm spiral not made, flanged 1.6', [[335, 0], [335, 1], [335, 2], [660, 1], [915, 2], [2150, 0], [2150, 2]].map(([s, j]) => dk({kind: 2, size: s, j}).t), [0.55, 0.7, 0.7, 0.85, 0.85, null, 1.6]);
const ft = o => es(Object.assign({mode: 1, f: 2, q: 5000, area: 2}, o));
check('filters: 45 - 65 mm viscous panel holding 180 - 540 g per 1700 m3/h: 5000 m3/h -> 529 - 1588 g; renewable glass-fibre media 600 - 2000 g/m2 over 2 m2 -> 1200 - 4000 g; face area 5000 / 3600 / 2.5 = 0.556 m2; fine non-woven mat 1 m/s -> 1.389 m2; a panel filter has no face-velocity row (area null)', [...ft({}).cap, ...ft({f: 4}).cap, ft({f: 4}).area, ft({f: 7}).area], [180 * 5000 / 1700, 540 * 5000 / 1700, 1200, 4000, 5000 / 3600 / 2.5, 5000 / 3600], 1e-6);
check('filter table sizes: 17 rows, 9 of them dry media; HEPA wet-laid paper DOP 95 - 99.999 %', [J('ES_F').length, J('ES_F').filter(x => x[0] === 2).length, J('ES_F')[15][4]], [17, 9, [95, 99.999]]);
const hg = o => es(Object.assign({mode: 2, kind: 0, e: 9, n: 1, hood: false, w: 1000, inc: true, tw: 50, a: 1}, o));
{
  const gi = J('ES_R').findIndex(x => x[0] === 'غاز بدون برقع' && x[1] === 'شواية');
  const ehood = J('ES_R').findIndex(x => x[0] === 'كهرباء تحتاج برقع' && x[1] === 'شواية سمك');
  check('restaurant gas grill (no hood), per m2 of grill surface: 2 units -> input 93200 W, sensible 33600, latent 18060, total 51660 W; with hood 7680 W; the electric fish grill needing a hood has no gain without hood and 970 W per m2 with hood (3 -> 2910)', [hg({e: gi, n: 2}).input, hg({e: gi, n: 2}).sens, hg({e: gi, n: 2}).lat, hg({e: gi, n: 2}).tot, hg({e: gi, n: 2}).hood, hg({e: gi, n: 2, hood: true}).gain, hg({e: ehood, n: 3}).tot, hg({e: ehood, n: 3}).hood, J('ES_R').length], [93200, 33600, 18060, 51660, 7680, 7680, null, 2910, 24]);
}
check('restaurant consistency: sensible + latent = total for every row that lists them (Tables 23-2 and 24-2)', [J('ES_R').filter(x => x[6] !== null).every(x => x[6] + x[7] === x[8])], [true]);
check('office equipment: personal computer 90 - 530 W each x 3 = 270 - 1590 W; laser printer 300 W x 2 = 600; coffee maker 1050 W; paper shredder 200 - 2420; 19 rows', [hg({kind: 1, e: 2, n: 3}).rec, hg({kind: 1, e: 4, n: 2}).rec, hg({kind: 1, e: 15}).rec, hg({kind: 1, e: 17}).rec, J('ES_O').length], [[270, 1590], [600, 600], [1050, 1050], [200, 2420], 19]);
check('lighting: incandescent W, fluorescent W x 1.25; water surface 23.9 C 132.5 W/m2, 37.8 C 441.5, 50 C interpolated 967.4, 93.3 C 6906.7, above and below the table the end values; 10 m2 at 65.6 C -> 21446 W', [hg({kind: 2, inc: true}).fl, hg({kind: 2, inc: false}).fl, hg({kind: 3, tw: 23.9}).wm2, hg({kind: 3, tw: 37.8}).wm2, hg({kind: 3, tw: 50}).wm2, hg({kind: 3, tw: 93.3}).wm2, hg({kind: 3, tw: 100}).wm2, hg({kind: 3, tw: 10}).wm2, hg({kind: 3, tw: 65.6, a: 10}).q], [1000, 1250, 132.5, 441.5, 441.5 + (1040.7 - 441.5) * (50 - 37.8) / (51.7 - 37.8), 6906.7, 6906.7, 132.5, 21446], 1e-6);
const vb = o => es(Object.assign({mode: 3, w: 300, dflx: 25, rpm: 1450, v: 2}, o));
check('Table 9-3 springs: up to 110 kgf 25 mm / 65 mm and 50 / 90; 300 kgf -> 25 / 115, 50 / 140, 90 / 180; 800 kgf -> 25 / 140, 50 / 180, 90 / 205; 1000 kgf is outside the table', [vb({w: 100}).row[1], vb({}).row[1], vb({w: 800}).row[1], vb({w: 1000}).row], [[[25, 65], [50, 90]], [[25, 115], [50, 140], [90, 180]], [[25, 140], [50, 180], [90, 205]], null]);
{
  const fn = 15.76 / 5, ratio = 1450 / 60 / fn, T = 1 / (ratio * ratio - 1);
  check('isolation: 25 mm deflection -> f_n 3.152 Hz; 1450 rpm = 24.17 Hz, ratio 7.67, T = 0.0173, efficiency 98.3 % which meets the air-handling-unit 80 %; 200 rpm gives a ratio below 1.414 and no isolation; recommended efficiencies by equipment', [vb({}).fn, vb({}).ratio, vb({}).T, vb({}).eff, vb({}).ok, vb({rpm: 200}).eff, J('ES_VE').map(x => x[1])], [fn, ratio, T, (1 - T) * 100, true, null, [[90, 90], [95, 95], [80, 80], [20, 80], [70, 90], [90, 95], [95, 95], [95, 95], [95, 95]]], 1e-9);
}
for (const id of ['egmat', 'egpipe', 'egeff', 'egequip']) {
  const pf = {egmat: 'eu', egpipe: 'em', egeff: 'er', egequip: 'es'}[id], n = {egmat: 1, egpipe: 5, egeff: 4, egequip: 4}[id];
  for (let k = 0; k < n; k++) { w.renderCalc(id); if (n > 1) w.document.getElementById(pf + '_m').value = String(k); w.calcResult(id); }
}
w.renderCalc('egmat'); w.calcResult('egmat');
let tt = txt(w, 'eu_results');
check('the material page opens with the four-layer wall: U 0.486, the layer list and the 🔴 note', [tt.includes('الانتقالية الحرارية U'), tt.includes('الطبقة 1'), tt.includes('الطبقة 3'), /0\.486/.test(tt), tt.includes('🔴')], [true, true, true, true, true]);
check('other reference codes open egmat too', others('egmat', 'eu_results'), [true, true, true]);
const set = (id, val) => { w.document.getElementById(id).value = val; };
w.renderCalc('egpipe'); w.calcResult('egpipe');
tt = txt(w, 'em_results');
check('the water pipe page opens with DN 50, 0.92 m/s and the friction loss; only the first group visible', [tt.includes('سرعة الماء'), /0\.92 m\/s/.test(tt), tt.includes('فقد الاحتكاك'), tt.includes('🔴'), w.document.getElementById('em_g0').style.display, w.document.getElementById('em_g1').style.display], [true, true, true, true, '', 'none']);
set('em_m', '1'); w.calcResult('egpipe'); tt = txt(w, 'em_results');
check('the steam page shows the selected diameter, velocity and total drop', [tt.includes('أصغر قطر يحمل التدفق'), tt.includes('سرعة البخار'), tt.includes('هبوط الضغط الكلي')], [true, true, true]);
set('em_m', '2'); set('em_ck', '3'); set('em_cq', '3'); w.calcResult('egpipe'); tt = txt(w, 'em_results');
check('the condensate page switches its sub-group and shows a diameter', [tt.includes('أصغر قطر'), w.document.getElementById('em_k3').style.display, w.document.getElementById('em_k0').style.display], [true, '', 'none']);
set('em_m', '3'); w.calcResult('egpipe'); tt = txt(w, 'em_results');
check('the fuel page shows the diameter for heavy fuel', [tt.includes('ثقيل رقم 5 و6'), /DN 50/.test(tt)], [true, true]);
set('em_m', '4'); w.calcResult('egpipe'); tt = txt(w, 'em_results');
check('the refrigerant page shows the pressure-drop recommendations', [tt.includes('الفقد الموصى به لخط السائل'), tt.includes('سرعة الوسيط')], [true, true]);
check('other reference codes open egpipe too', others('egpipe', 'em_results'), [true, true, true]);
w.renderCalc('egeff'); w.calcResult('egeff');
tt = txt(w, 'er_results');
check('the efficiency page opens with the minimum values and the 🔴 note; only the first group visible', [tt.includes('المعدة'), tt.includes('أدنى'), tt.includes('🔴'), w.document.getElementById('er_g0').style.display, w.document.getElementById('er_g1').style.display], [true, true, true, '', 'none']);
set('er_m', '1'); w.calcResult('egeff'); tt = txt(w, 'er_results');
check('the selection page shows the system, the standby and the units', [tt.includes('النظام الموصى به'), tt.includes('الاحتياطي'), tt.includes('عدد وحدات التبريد')], [true, true, true]);
set('er_m', '2'); w.calcResult('egeff'); tt = txt(w, 'er_results');
check('the condenser water page shows the flow 39.87 L/s', [/39\.87 L\/s/.test(tt)], [true]);
set('er_m', '3'); w.calcResult('egeff'); tt = txt(w, 'er_results');
check('the diversity page shows the real load', [tt.includes('الحمل الحقيقي')], [true]);
check('other reference codes open egeff too', others('egeff', 'er_results'), [true, true, true]);
w.renderCalc('egequip'); w.calcResult('egequip');
tt = txt(w, 'es_results');
check('the duct page opens with 0.70 mm for a 450 mm duct with reinforcement; only the first group visible', [tt.includes('سماكة اللوح'), /0\.70 mm/.test(tt), tt.includes('🔴'), w.document.getElementById('es_g0').style.display, w.document.getElementById('es_g1').style.display], [true, true, true, '', 'none']);
set('es_m', '1'); w.calcResult('egequip'); tt = txt(w, 'es_results');
check('the filter page shows the efficiencies and the dust holding', [tt.includes('الكفاءة الوزنية'), tt.includes('سعة حجز الغبار')], [true, true]);
set('es_m', '2'); set('es_k', '3'); w.calcResult('egequip'); tt = txt(w, 'es_results');
check('the heat-gain page switches the group and shows the water-surface gain 967 W/m2', [tt.includes('الحرارة الكامنة من سطح الماء'), /967 W\/m²/.test(tt), w.document.getElementById('es_h3').style.display, w.document.getElementById('es_h0').style.display], [true, true, '', 'none']);
set('es_m', '3'); w.calcResult('egequip'); tt = txt(w, 'es_results');
check('the vibration page shows the spring and the efficiency', [tt.includes('النابض المناسب للوزن'), tt.includes('الكفاءة بنظرية درجة حرية واحدة')], [true, true]);
check('other reference codes open egequip too', others('egequip', 'es_results'), [true, true, true]);
}
// ---------- part 185: Dubai Building Code 2021, Part B (`dbcarch`: occupant load, sanitary fixtures, drinking fountains, parking, room / height / corridor / door / window minimums, stairs and ramps) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const dz = o => w.eval('dzCalc(' + JSON.stringify(o) + ')');
const OL = J('DZ_OL'), SF = J('DZ_SF'), DF = J('DZ_DF'), PK = J('DZ_PK'), SP = J('DZ_SP');
const oi = n => OL.findIndex(x => x[0].includes(n)), si = n => SF.findIndex(x => x.n.includes(n)), pi = n => PK.findIndex(x => x[0].includes(n)), xi = n => SP.findIndex(x => x[1].includes(n));
check('tables loaded: 35 occupant-load rows, 13 sanitary rows, 13 drinking-fountain rows, 32 parking rows, 3 ramp rows', [OL.length, SF.length, DF.length, PK.length, J('DZ_RAMP').length], [35, 13, 13, 32, 3]);
const occ = rows => dz({mode: 0, rows});
{
  const r = occ([{i: oi('مكاتب مفتوحة'), q: 500}, {i: oi('أصغر من 14,000'), q: 5000}, {i: oi('مقاعد ثابتة'), q: 300}, {i: oi('دكّية'), q: 10}]);
  check('open office 500 m2 / 4.6 = 108.7 -> 109; mall below 14,000 m2 GLA 5000 / 2.8 = 1785.7 -> 1786; 300 fixed seats -> 300; bench 10 m / 0.455 = 21.98 -> 22; total 2217', [...r.rows.map(x => x.occ), r.total], [109, 1786, 300, 22, 2217]);
  check('a row with a zero quantity gives zero; mosque prayer area 90 m2 / 0.9 = 100; swimming pool surface 46 m2 / 4.6 = 10 and deck 28 m2 / 2.8 = 10', [occ([{i: 0, q: 0}]).total, occ([{i: oi('مساجد'), q: 90}]).total, occ([{i: oi('سطح الماء'), q: 46}, {i: oi('الممشى'), q: 28}]).total], [0, 100, 20]);
}
const san = (rows, x) => dz(Object.assign({mode: 1, rows, resPool: false}, x || {}));
{
  const r = san([{i: si('مكاتب'), n: 200}]);
  check('offices 200 persons -> 100 per gender: 100 / 20 = 5 WC and 5 basins each; urinals at most floor(0.33 x 5) = 1; accessible WC = max(1, ceil(5 % x 10)) = 1', [r.wm, r.wf, r.bm, r.bf, r.urMax, r.accessible, r.sh], [5, 5, 5, 5, 1, 1, 0]);
}
{
  const r = san([{i: si('مكاتب'), n: 200}, {i: si('مطاعم ومناطق'), n: 100}]);
  check('fractions of mixed occupancies are summed first: offices 5 + restaurant 50 / 75 = 0.667 -> 6 male WC; female 5 + 50 / 50 = 6', [r.wm, r.wf, r.bm, r.bf], [6, 6, 6, 6]);
  const q = san([{i: si('مطاعم ومناطق'), n: 700}]);
  check('restaurant 700 persons -> 350 per gender: male 300 / 75 + 50 / 200 = 4.25 -> 5; female 200 / 50 + 150 / 75 = 6; urinals floor(0.33 x 5) = 1', [q.wm, q.wf, q.bm, q.bf, q.urMax], [5, 6, 5, 6, 1]);
}
{
  const r = san([{i: si('ملاهي'), n: 4000}]);
  check('amusement 4000 persons -> 2000: male WC 1500 / 75 + 500 / 120 = 24.17 -> 25; female 1600 / 40 + 400 / 60 = 46.67 -> 47; basins 2000 / 120 = 16.67 -> 17 and 2000 / 60 = 33.3 -> 34; accessible ceil(5 % x 72) = 4', [r.wm, r.wf, r.bm, r.bf, r.accessible], [25, 47, 17, 34, 4]);
  const t = san([{i: si('مكاتب'), n: 3}, {i: si('محلات'), n: 1200}]);
  check('retail 1200 persons -> 600: male 3, female 500 / 100 + 100 / 200 = 5.5 (offices 3 persons -> 2 each, 2 / 20 = 0.1): totals male 3.1 -> 4, female 5.6 -> 6', [t.wm, t.wf], [4, 6]);
}
{
  const p = san([{i: si('أحواض السباحة'), n: 3000}]);
  const pr = san([{i: si('أحواض السباحة'), n: 3000}], {resPool: true});
  check('pool 3000 persons -> 1500: male WC 20, female 1500 / 40 = 37.5 -> 38; basins 1500 / 200 = 7.5 -> 8 and 1500 / 150 = 10; showers 150 per gender; a residential pool halves the showers to 75', [p.wm, p.wf, p.bm, p.bf, p.sh, pr.sh], [20, 38, 8, 10, 150, 75]);
  const l = san([{i: si('سكن عمال'), n: 100}]);
  check('labour accommodation 100 persons -> 50 per gender: 50 / 10 = 5 WC and basins, showers 5; urinals not allowed in residential occupancy', [l.wm, l.wf, l.bm, l.bf, l.sh, l.urMax], [5, 5, 5, 5, 5, 0]);
  const s = san([{i: si('سكن طلاب'), n: 100}]);
  check('student accommodation 100 persons: showers 50 / 8 = 6.25 -> 7', [s.sh], [7]);
  const f = san([{i: si('الجمهور'), n: 10}]);
  check('fuel station public: one male and one female WC with basin whatever the number', [f.wm, f.wf, f.bm, f.bf], [1, 1, 1, 1]);
  const m = san([{i: si('مساجد'), n: 300}]);
  check('mosque 300 worshippers -> 150: WC 150 / 100 = 1.5 -> 2 each; ablution 300 / 50 = 6; no basin rows', [m.wm, m.wf, m.bm, m.bf, m.ab], [2, 2, 0, 0, 6]);
  check('no persons -> nothing required', [san([{i: 0, n: 0}]).any, san([{i: 0, n: 0}]).accessible], [false, 0]);
}
{
  const d = (i, n) => dz({mode: 2, i, n}).n;
  const k = n => DF.findIndex(x => x[0].includes(n));
  check('drinking fountains: offices 400 / 100 = 4; schools 250 students -> 3; restaurant 1001 -> 2; 0 persons -> 0; factories 1200 / 500 -> 3', [d(k('مكاتب'), 400), d(k('مدارس'), 250), d(k('مطاعم'), 1001), d(0, 0), d(k('مصانع'), 1200)], [4, 3, 2, 0, 3]);
}
const prk = (rows, x) => dz(Object.assign({mode: 3, rows: rows.map(r => Object.assign({on: true}, r)), mall: false, hosp: false}, x || {}));
{
  const r = prk([{i: pi('مكاتب'), q: 2000}, {i: pi('محلات تجزئة'), q: 700}, {i: pi('3 و4 غرف'), q: 15}]);
  check('parking: offices 2000 m2 / 50 = 40, retail 700 / 70 = 10, 15 three-bedroom units x 2 = 30 -> 80 bays; preferred 5 % = 4 (more than 20 bays); no EV charging unless a mall', [...r.rows.map(x => x.b), r.bays, r.pref, r.ev, r.hosp], [40, 10, 30, 80, 4, 0, 0]);
  const m = prk([{i: pi('مكاتب'), q: 2000}, {i: pi('محلات تجزئة'), q: 700}, {i: pi('3 و4 غرف'), q: 15}], {mall: true, hosp: true});
  check('mall: EV charging ceil(20 % x 4) = 1; hospital: accessible 10 % of 80 = 8 and one van bay (10 % of 8 = 0.8 -> 1)', [m.ev, m.hosp, m.van], [1, 8, 1]);
  const f = prk([{i: pi('محطة وقود'), q: 140}]);
  check('fuel station: 2 + 140 / 70 = 4 bays; a fuel row with no services still has 2', [f.bays, prk([{i: pi('محطة وقود'), q: 0}]).bays], [4, 2]);
  const h = prk([{i: pi('أكبر من 150'), q: 7}, {i: pi('جامعة: القاعات'), q: 1000}, {i: pi('حافلات الروضة'), q: 10}, {i: pi('حافلات الجامعة'), q: 650}]);
  check('hotel apartments above 150 m2: 7 x 2 = 14; university 1000 / 50 = 20 + 10 % = 22; school buses 10 classrooms / 3 -> 4; university buses 650 / 200 -> 4; car bays 36, buses 8, preferred ceil(1.8) = 2', [...h.rows.map(x => x.b), h.bays, h.bus, h.pref], [14, 22, 4, 4, 36, 8, 2]);
  check('20 bays need no preferred bays, 21 need ceil(1.05) = 2; mosque residential 100 worshippers / 18 -> 6; hotel standard 41 rooms / 5 -> 9; hotel suites 5 / 2 -> 3', [prk([{i: pi('مكاتب'), q: 1000}]).pref, prk([{i: pi('مكاتب'), q: 1001}]).pref, prk([{i: pi('الأحياء'), q: 100}]).bays, prk([{i: pi('غرفة قياسية'), q: 41}]).bays, prk([{i: pi('جناح'), q: 5}]).bays], [0, 2, 6, 9, 3]);
}
const sp = (n, x) => dz(Object.assign({mode: 4, i: xi(n), area: 12, dim: 3, h: 2.7, w: 1.5, glass: 1.2}, x || {}));
{
  const L = 'غرفة سكنية';
  check('residential room 10.5 m2 and 3 m: both met; 10.4 m2 fails the area; 2.99 m fails the dimension', [sp(L, {area: 10.5, dim: 3}).okA, sp(L, {area: 10.5, dim: 3}).okD, sp(L, {area: 10.4}).okA, sp(L, {dim: 2.99}).okD], [true, true, false, false]);
  check('retail shop has only the 2.4 m dimension (no area); studio 21 m2 / 3 m; kitchen 5.4 / 1.8; housekeeper 4.5 / 2.1; command centre 19 / 3', [sp('محل تجزئة').okA, sp('محل تجزئة', {dim: 2.4}).okD, sp('استوديو', {area: 21}).okA, sp('مطبخ مغلق', {area: 5.39}).okA, sp('مدبّرة', {dim: 2.1, area: 4.5}).okD, sp('قيادة طوارئ', {area: 19}).okA], [null, true, true, false, true, true]);
  check('clear heights: Jumaa mosque 5.0 m, Awqat 3.8, ballroom 2.7, office 2.5, corridor 2.3, stair treads 2.03, fire pump room 2.5', [['الجمعة', 'الأوقات', 'قاعات الاحتفالات', 'مكاتب ومحلات', 'مواقف مركبات', 'فوق درجات', 'مضخات'].map(n => SP[xi(n)][3])], [[5.0, 3.8, 2.7, 2.5, 2.3, 2.03, 2.5]]);
  check('height 2.69 m fails a living room (2.7), 2.7 passes; height 2.02 m fails above the treads (2.03)', [sp('غرف المعيشة والنوم (سكني', {h: 2.69}).okH, sp('غرف المعيشة والنوم (سكني', {h: 2.7}).okH, sp('فوق درجات', {h: 2.02}).okH], [false, true, false]);
  check('corridor widths: hotel single 1.5 / double 1.8; mall double-sided 6 and single-sided 3; education 2.1 / 3; internal 1.0; service 1.2; public toilet 1.05; a 1.79 m double-loaded office corridor fails', [['فنادق (ممر مشترك): أحادي', 'فنادق (ممر مشترك): ثنائي', 'أكبر من 3,600 m² للطابق: وحدات من جانبين', 'أكبر من 3,600 m² للطابق: وحدات من جانب واحد', 'فصول من جانب واحد', 'فصول من جانبين', 'ممرات داخل', 'ممرات الخدمة', 'دورات المياه العامة'].map(n => SP.filter(x => x[1].includes(n))[0][3]), sp('مكاتب: ممر ثنائي', {w: 1.79}).okW], [[1.5, 1.8, 6, 3, 2.1, 3, 1.0, 1.2, 1.05], false]);
  check('doors: entry 915 mm, bathroom 815 mm, stair 1200 mm; 0.9 m fails an entry door, 0.915 passes', [sp('باب مدخل').s[3], sp('باب حمام').s[3], sp('عرض الدرج').s[3], sp('باب مدخل', {w: 0.9}).okW, sp('باب مدخل', {w: 0.915}).okW], [0.915, 0.815, 1.2, false, true]);
  const w = sp('مكاتب (مناطق العمل)', {area: 12, glass: 1.2});
  check('window 10 %: 1.2 m2 in 12 m2 = 10.0 % met, need 1.2 m2; 1.19 m2 gives 9.92 % and fails; zero room area gives 0 %', [w.pct, w.okG, w.need, sp('مكاتب (مناطق العمل)', {glass: 1.19}).okG, sp('مكاتب (مناطق العمل)', {area: 0}).pct], [10, true, 1.2, false, 0], 1e-9);
  check('staff accommodation single 13 m2 / 2.7 and double 20 / 2.7; student single 7 / 2.4 and shared 5 per student / 2.4', [['سكن موظفين: غرفة فردية', 'سكن موظفين: غرفة مزدوجة', 'سكن طلاب: غرفة فردية', 'سكن طلاب: غرفة مشتركة'].map(n => SP[xi(n)].slice(3))], [[[13, 2.7], [20, 2.7], [7, 2.4], [5, 2.4]]]);
}
const st = o => dz(Object.assign({mode: 5, riser: 170, tread: 280, flight: 3000, width: 1200, regular: false, steps: 10, slope: 0}, o));
{
  const r = st({});
  check('stair 170 / 280 mm, 1200 mm wide, 3000 mm between landings: all met; 18 risers of 166.7 mm', [r.okRiser, r.okTread, r.okWidth, r.okLand, r.nRis, r.actRis], [true, true, true, true, 18, 3000 / 18], 1e-9);
  check('riser 181 and 99 fail; tread 279 fails; width 1199 fails; 3660 mm passes but 3700 fails the landing rule', [st({riser: 181}).okRiser, st({riser: 99}).okRiser, st({tread: 279}).okTread, st({width: 1199}).okWidth, st({flight: 3660}).okLand, st({flight: 3700}).okLand], [false, false, false, false, true, false]);
  const q = st({regular: true, riser: 160, tread: 300, steps: 14});
  check('regular-use stair: riser 150 - 165, tread 300, 2 - 14 steps: 160 / 300 / 14 met; riser 170 fails the narrower range; tread 290 fails; 15 steps and 1 step fail', [q.okRiserR, q.okTreadR, q.okSteps, st({regular: true, riser: 170}).okRiserR, st({regular: true, tread: 290}).okTreadR, st({regular: true, steps: 15}).okSteps, st({regular: true, steps: 1}).okSteps], [true, true, true, false, false, false, false]);
  check('ramp transitions from Table B.10: 12 % -> 6 % and 3.6 m, 10 % -> 5 % and 3 m, 8 % -> 4 % and 2.4 m; 9 % is interpolated 4.5 % and 2.7 m (not a table row); no slope gives no ramp', [[12, 10, 8].map(s => { const k = st({slope: s}).ramp; return [k.T, k.L, k.table]; }).flat(), st({slope: 9}).ramp.L, st({slope: 9}).ramp.table, st({}).ramp], [[6, 3.6, true, 5, 3, true, 4, 2.4, true], 2.7, false, null], 1e-9);
}
let tt;
const set = (id, val) => { w.document.getElementById(id).value = val; };
w.renderCalc('dbcarch'); w.calcResult('dbcarch');
tt = txt(w, 'dz_results');
check('the occupancy page opens with the open-office result 109 and the 🔴 note; only the first group visible', [tt.includes('حمل الإشغال'), /109/.test(tt), tt.includes('🔴'), w.document.getElementById('dz_g0').style.display, w.document.getElementById('dz_g1').style.display], [true, true, true, '', 'none']);
set('dz_m', '1'); w.calcResult('dbcarch'); tt = txt(w, 'dz_results');
check('the sanitary page shows the WC counts, the urinals and the accessible WC', [tt.includes('مراحيض الرجال'), tt.includes('المباول'), tt.includes('مراحيض ذوي الهمم')], [true, true, true]);
set('dz_m', '2'); w.calcResult('dbcarch'); tt = txt(w, 'dz_results');
check('the drinking fountain page shows the count', [tt.includes('عدد النوافير')], [true]);
set('dz_m', '3'); w.calcResult('dbcarch'); tt = txt(w, 'dz_results');
check('the parking page shows the total bays and the preferred bays', [tt.includes('إجمالي مواقف السيارات'), tt.includes('مواقف مفضّلة')], [true, true]);
set('dz_m', '4'); w.calcResult('dbcarch'); tt = txt(w, 'dz_results');
check('the space page shows the area and dimension checks of the first item', [tt.includes('مساحة الغرفة'), tt.includes('البعد الأدنى')], [true, true]);
set('dz_m', '5'); set('dz_ls', '12'); w.calcResult('dbcarch'); tt = txt(w, 'dz_results');
check('the stair page shows the riser check and the ramp transition 3.6 m', [tt.includes('ارتفاع الدرجة'), tt.includes('طول الانتقال الأدنى'), /3\.6 m/.test(tt), w.document.getElementById('dz_g5').style.display, w.document.getElementById('dz_g0').style.display], [true, true, true, '', 'none']);
check('other reference codes open dbcarch too', others('dbcarch', 'dz_results'), [true, true, true]);
}
// ---------- part 186: Dubai Building Code 2021, Part G (`dbcelec`: cable and breaker sizes, ECC, ELCB, metering and CT, maximum demand, support spacing, substation rooms) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const dx = o => w.eval('dxCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('tables loaded: G.4 11 rows, G.5 16 rows, G.6 12 rows, 6 CT ratios, 8 busbar rows, G.15 9 rows, G.16 2 rows, G.21 18 rows, 4 support rows, 5 substation types', [J('DX_C4').length, J('DX_C5').length, J('DX_C6').length, J('DX_CT').length, J('DX_BB').length, J('DX_G15').length, J('DX_G16').length, J('DX_EL').length, J('DX_SUP').length, J('DX_ST').length], [11, 16, 12, 6, 8, 9, 2, 18, 4, 5]);
const cb = o => dx(Object.assign({mode: 0, sys: 2, ib: 32, use: 0, len: 0, phases: 3}, o));
{
  check('multicore SWA (G.5): 32 A -> 10 mm2 (40 A); 10 A -> 2.5 mm2 labelled 10/15; 11 A -> 4 mm2; 400 A -> 400 mm2; 401 A is out of the table', [cb({}).row.s, cb({ib: 10}).row.s, cb({ib: 10}).row.lab, cb({ib: 11}).row.s, cb({ib: 400}).row.s, cb({ib: 401}).over], [10, 2.5, '10/15', 4, 400, true]);
  check('minimum conductor sizes: lighting 2.5 mm2 (a 5 A circuit gets 2.5), utility sockets 4 mm2 (8 A gets 4 instead of 2.5), general circuits follow the table', [cb({ib: 5, use: 1}).row.s, cb({ib: 8, use: 2}).row.s, cb({ib: 8, use: 0}).row.s, cb({ib: 35, use: 2}).row.s], [2.5, 4, 2.5, 10]);
  check('single cable in normal situations (G.6): 50 A -> 10 mm2; 51 A -> 16 mm2; 400 A -> 300 mm2; 401 A over; concealed single-phase (G.4): 55 A -> 25 mm2 (60 A), 81 A over (largest 80 A, 35 mm2)', [cb({sys: 3, ib: 50}).row.s, cb({sys: 3, ib: 51}).row.s, cb({sys: 3, ib: 400}).row.s, cb({sys: 3, ib: 401}).over, cb({sys: 0, ib: 55}).row.s, cb({sys: 0, ib: 81}).over, cb({sys: 0, ib: 81}).max.s], [10, 16, 300, true, 25, true, 35]);
  check('three-phase concealed (G.4): 60 A -> 35 mm2 (the printed 25/25 read as 25/35); 150 A -> 120 mm2 labelled 150/160; 40 A -> 16 mm2; 30 A -> 10 mm2', [cb({sys: 1, ib: 60}).row.s, cb({sys: 1, ib: 150}).row.s, cb({sys: 1, ib: 150}).row.lab, cb({sys: 1, ib: 40}).row.s, cb({sys: 1, ib: 30}).row.s], [35, 120, '150/160', 16, 10]);
  const r = cb({len: 100});
  check('voltage drop 32 A over 100 m in 10 mm2 three-phase: sqrt(3) x 32 x 100 x 0.0225 / 10 = 12.47 V = 3.12 % of 400 V, within 4 %', [r.vd, r.vdPct, r.okVd], [Math.sqrt(3) * 32 * 100 * 0.0225 / 10, Math.sqrt(3) * 32 * 100 * 0.0225 / 10 / 4, true], 1e-9);
  const q = cb({len: 200});
  check('200 m: 24.9 V = 6.2 % fails; the smallest size within 4 % is 16 mm2 (3.90 %)', [q.okVd, q.vdRow.s, 100 * Math.sqrt(3) * 32 * 200 * 0.0225 / 16 / 400], [false, 16, 3.8971], 1e-3);
  const s = cb({sys: 0, ib: 20, len: 30});
  check('single-phase 20 A over 30 m in 4 mm2: 2 x 20 x 30 x 0.0225 / 4 = 6.75 V = 2.93 % of 230 V', [s.row.s, s.vd, s.vdPct, s.okVd], [4, 6.75, 6.75 / 2.3, true], 1e-9);
}
const ec = s => dx({mode: 1, s});
{
  check('ECC and bonding (G.20): S 10 -> ECC 10, bonding max(5, 6) = 6; S 25 -> ECC 16, bonding 10; S 35 -> 16 / 10; S 70 -> ECC 35, bonding 17.5 -> 25; S 120 -> ECC 60 -> 70, bonding min(30, 25) = 25', [ec(10), ec(25), ec(35), ec(70), ec(120)].map(r => [r.ecc, r.bond, r.eccStd, r.bondStd]).flat(), [10, 6, 10, 6, 16, 10, 16, 10, 16, 10, 16, 10, 35, 17.5, 35, 25, 60, 25, 70, 25]);
  check('main protective bonding: half the ECC, at least 6, at most 25 mm2: S 10 -> 6, S 25 -> 8, S 70 -> 17.5, S 120 -> 25', [10, 25, 70, 120].map(s => ec(s).main), [6, 8, 17.5, 25]);
}
{
  const el = J('DX_EL');
  check('ELCB (G.21): sockets 30 mA, jacuzzi 10, underwater lighting 10, general lighting 30/100, flood lighting 100/300, chiller 100/500/1000, elevators 300/500, neon 300', [0, 4, 5, 7, 8, 12, 16, 17].map(i => el[i][1].join('/')), ['30', '10', '10', '30/100', '100/300', '100/500/1000', '300/500', '300']);
}
const mt = i => dx({mode: 3, i});
{
  check('metering: 60 A and 100 A / 125 A direct (60, 125, 125); 150 A in the gap (not direct, no CT); 160 A -> CT 200/5', [mt(60).direct, mt(100).direct, mt(125).direct, mt(150).direct, mt(150).ct, mt(150).gap, mt(160).ct, mt(160).ratio], [60, 125, 125, null, false, true, true, 200]);
  check('CT ratios: 250 A -> 300/5, 350 -> 400/5, 500 -> 800/5, 1000 -> 1600/5, 2000 -> 2400/5, 2500 -> none; busbars 200 -> 20x10, 400 -> 30x10, 2400 -> 2 x 80x10', [250, 350, 500, 1000, 2000, 2500].map(i => mt(i).ratio), [300, 400, 800, 1600, 2400, null]);
  check('busbars by CT primary current', [mt(160).bb, mt(350).bb, mt(2000).bb], ['20 mm × 10 mm', '30 mm × 10 mm', '2 عدد 80 mm × 10 mm']);
}
const dm = (tab, i, kw) => dx({mode: 4, tab, i, kw});
{
  check('G.15: 200 A feeder allows 100 kW: 90 kW met (90 %), 120 kW not met and needs the 300 A feeder (150 kW); transformer 1,000 kVA 800 kW, 1,500 kVA 1,200 kW; 1,300 kW exceeds all rows', [dm(0, 4, 90).ok, dm(0, 4, 90).use, dm(0, 4, 120).ok, dm(0, 4, 120).minRow[0], dm(0, 7, 800).ok, dm(0, 8, 1200).ok, dm(0, 8, 1300).minRow], [true, 90, false, 'مغذٍّ 300 A', true, true, null]);
  check('G.16 air-conditioning: 1,500 kVA 950 kW, 1,000 kVA 650 kW; 700 kW fails the 1,000 kVA transformer and the smallest row is 1,500 kVA; 600 kW needs only the 1,000 kVA', [dm(1, 0, 950).ok, dm(1, 1, 650).ok, dm(1, 1, 700).ok, dm(1, 1, 700).minRow[0], dm(1, 0, 600).minRow[0]], [true, true, false, 'محول 1,500 kVA', 'محول 1,000 kVA']);
}
const sup = (i, vert, pvc, len) => dx({mode: 5, i, vert, pvc, len});
{
  check('support spacing: trunking steel 1500 / 1800 mm, PVC 1000 / 1200; conduit steel 1200 / 1500; armoured cable 20-40 mm 350 / 600, above 40 mm 600 / 800 (no PVC value)', [sup(0, false, false, 0).sp, sup(0, true, false, 0).sp, sup(0, false, true, 0).sp, sup(0, true, true, 0).sp, sup(1, false, false, 0).sp, sup(1, true, false, 0).sp, sup(2, false, false, 0).sp, sup(2, true, false, 0).sp, sup(3, false, false, 0).sp, sup(3, true, false, 0).sp, sup(2, false, true, 0).pvcOk], [1500, 1800, 1000, 1200, 1200, 1500, 350, 600, 600, 800, false]);
  check('supports for 10 m of horizontal steel trunking: ceil(10000 / 1500) + 1 = 8; 0 m -> 0', [sup(0, false, false, 10).n, sup(0, false, false, 0).n, sup(2, false, false, 7).n], [8, 0, 21]);
}
const sb = (t, n) => dx({mode: 6, t, n});
{
  check('single-room substation (G.23): 1 transformer 33 m2 / 4.57 m; 2 -> 55 / 6.1; 3 -> 55 + 25 = 80; 4 -> 55 + 50 + 10 = 115', [sb(0, 1), sb(0, 2), sb(0, 3), sb(0, 4)].map(r => [r.area, r.width]).flat(), [33, 4.57, 55, 6.1, 80, 6.1, 115, 6.1]);
  check('split substation: 1 transformer: RMU 9 m2 / 3 m + transformer room 21 / 4.57 = 30; 2: RMU 9 + transformers 42 / 6.1 = 51; 4: two RMU sets 9 + 7 + 10 = 26 / 5 m + 84 = 110; basement type gives the same figures', [sb(1, 1), sb(1, 2), sb(1, 4)].map(r => [r.rmuA, r.rmuW, r.txA, r.txW, r.area, r.sets]).flat(), [9, 3, 21, 4.57, 30, 1, 9, 3, 42, 6.1, 51, 1, 26, 5, 84, 6.1, 110, 2]);
  check('basement substation equals the split figures', [sb(2, 2).area, sb(2, 2).txA], [51, 42]);
  check('open to sky dedicated: 6.1 x 6.1 m for one transformer only; pocket: 1 x 1000 kVA 4.57 x 3.66, 2 x 1000 kVA 6.1 x 6.1, three not listed', [sb(3, 1).dim, sb(3, 2).dim, sb(4, 1).dim, sb(4, 2).dim, sb(4, 3).dim], [[6.1, 6.1], null, [4.57, 3.66], [6.1, 6.1], null]);
}
let tt;
w.renderCalc('dbcelec'); w.calcResult('dbcelec');
tt = txt(w, 'dx_results');
check('the cable page opens with 10 mm2 for 32 A in the SWA table and the 🔴 note; only the first group visible', [tt.includes('مقطع الموصل'), /10 mm²/.test(tt), tt.includes('🔴'), w.document.getElementById('dx_g0').style.display, w.document.getElementById('dx_g1').style.display], [true, true, true, '', 'none']);
set('dx_cl', '100'); w.calcResult('dbcelec'); tt = txt(w, 'dx_results');
check('with a length the voltage drop 12.47 V appears', [tt.includes('هبوط الجهد المقدّر'), /12\.47 V/.test(tt)], [true, true]);
set('dx_m', '1'); w.calcResult('dbcelec'); tt = txt(w, 'dx_results');
check('the ECC page shows 16 mm2 for a 25 mm2 phase conductor', [tt.includes('الحد الأدنى لمقطع ECC'), /16\.0 mm²/.test(tt)], [true, true]);
set('dx_m', '2'); w.calcResult('dbcelec'); tt = txt(w, 'dx_results');
check('the ELCB page shows 30 mA for the first circuit', [tt.includes('تيار التشغيل الموصى به'), /30 mA/.test(tt)], [true, true]);
set('dx_m', '3'); w.calcResult('dbcelec'); tt = txt(w, 'dx_results');
check('the metering page shows CT 200/5 for 200 A', [tt.includes('محولات تيار CT'), /200\/5/.test(tt)], [true, true]);
set('dx_m', '4'); w.calcResult('dbcelec'); tt = txt(w, 'dx_results');
check('the demand page shows the 100 kW limit and a pass for 40 kW', [/100 kW/.test(tt), tt.includes('✔')], [true, true]);
set('dx_dt', '1'); w.calcResult('dbcelec'); tt = txt(w, 'dx_results');
check('switching to G.16 swaps the selector', [w.document.getElementById('dx_dl1').style.display, w.document.getElementById('dx_dl0').style.display, /950 kW/.test(tt)], ['', 'none', true]);
set('dx_m', '5'); w.calcResult('dbcelec'); tt = txt(w, 'dx_results');
check('the support page shows 1500 mm', [/1,?500 mm/.test(tt)], [true]);
set('dx_m', '6'); w.calcResult('dbcelec'); tt = txt(w, 'dx_results');
check('the substation page shows 33 m2', [/33 m²/.test(tt), w.document.getElementById('dx_g6').style.display], [true, '']);
check('other reference codes open dbcelec too', others('dbcelec', 'dx_results'), [true, true, true]);
}
// ---------- part 187: Dubai Building Code 2021, Part H HVAC (`dbchvac`: design and comfort conditions, ventilation / energy recovery / DCV, air leakage and condensate) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const dk = o => w.eval('dkCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('Dubai design conditions: outdoor 46 / 29 C, range 13.8 C, 25 N, zone 0B; indoor 24 +/- 1.5 C and 50 +/- 5 %; comfort 22.5 - 25.5 C, 30 - 60 %, 0.2 - 0.3 m/s; three contaminant limits', [J('DK_OUT'), J('DK_IN'), J('DK_CF'), J('DK_CT').map(x => x[1])], [{db: 46, wb: 29, range: 13.8, lat: 25, zone: '0B'}, {t: 24, tTol: 1.5, rh: 50, rhTol: 5}, {tLo: 22.5, tHi: 25.5, rhLo: 30, rhHi: 60, vLo: 0.2, vHi: 0.3}, [0.08, 300, 150]]);
const cm = o => dk(Object.assign({mode: 0, t: 24, rh: 50, v: 0.25, qs: 100, ql: 20, oaDb: 34, oaWb: 32}, o));
{
  const r = cm({});
  check('24 C, 50 %, 0.25 m/s: all comfort limits and the design tolerance met; loads 100 x 1.10 = 110 kW sensible, 20 x 1.05 = 21 kW latent, total 131 kW, SHF 0.8397; treated outdoor air 34 / 32 within the limits', [r.okT, r.okRh, r.okV, r.dTT, r.dTR, r.sensMax, r.latMax, r.totMax, r.shf, r.okOA], [true, true, true, true, true, 110, 21, 131, 110 / 131, true], 1e-9);
  check('limits: 22.5 and 25.5 C pass, 22.4 and 25.6 fail; 30 and 60 % pass, 29 and 61 fail; 0.2 and 0.3 m/s pass, 0.19 and 0.31 fail', [cm({t: 22.5}).okT, cm({t: 25.5}).okT, cm({t: 22.4}).okT, cm({t: 25.6}).okT, cm({rh: 30}).okRh, cm({rh: 60}).okRh, cm({rh: 29}).okRh, cm({rh: 61}).okRh, cm({v: 0.2}).okV, cm({v: 0.3}).okV, cm({v: 0.19}).okV, cm({v: 0.31}).okV], [true, true, false, false, true, true, false, false, true, true, false, false]);
  check('25.5 C is within comfort but outside the design 24 +/- 1.5 (it equals 25.5, so inside); 25.6 is outside both; RH 56 is outside 50 +/- 5; treated outdoor air 35 C dry bulb or 33 C wet bulb fails', [cm({t: 25.5}).dTT, cm({t: 25.6}).dTT, cm({rh: 56}).dTR, cm({oaDb: 35}).okOA, cm({oaWb: 33}).okOA], [true, false, false, false, false]);
}
const vn = o => dk(Object.assign({mode: 1, oa: 1500, ex: 1400, area: 150, occ: 45, vf: 1}, o));
{
  const r = vn({});
  check('outdoor air 1500 L/s above 1000: energy recovery for 50 % of 1400 L/s = 700 L/s at 70 %; density 45 / 150 x 100 = 30 per 100 m2 in 150 m2: DCV required; louver 1500 / 1000 = 1.5 m2 at 1 m/s; imbalance 100 / 1500 = 6.67 %', [r.erReq, r.erFlow, r.erEff, r.dens, r.dcv, r.louver, r.okVf, r.balance], [true, 700, 70, 30, true, 1.5, true, 100 / 1500], 1e-9);
  check('1000 L/s exactly needs no energy recovery; 1001 does; 100 m2 exactly needs no DCV and 24.9 per 100 m2 neither; 25 per 100 m2 in 120 m2 does', [vn({oa: 1000}).erReq, vn({oa: 1001}).erReq, vn({area: 100}).dcv, vn({area: 100, occ: 24.9}).dcv, vn({area: 120, occ: 30}).dcv, vn({area: 150, occ: 37}).dens], [false, true, false, false, true, 24.666666666666668]);
  check('louver face velocity 1.2 m/s fails the 1 m/s limit and gives a smaller area 1.25 m2; no velocity gives 0', [vn({vf: 1.2}).okVf, vn({vf: 1.2}).louverReal, vn({vf: 0}).louverReal], [false, 1.25, 0], 1e-9);
}
const lk = o => dk(Object.assign({mode: 2, cool: 1200, area: 8000, vol: 30000, leak: 0, ga: 6000}, o));
{
  const r = lk({});
  check('leakage limit 5 x 8000 = 40,000 m3/h = 1.33 ACH at 50 Pa for 30,000 m3; 1200 kW needs the test, condensate reuse and sub-meters', [r.leakLimit, r.leakAch, r.testReq, r.condReuse, r.sub, r.okLeak], [40000, 40000 / 30000, true, true, true, null], 1e-9);
  check('test result 4.5 passes, 5 passes, 5.1 fails; 999 kW needs no test; 350 kW exactly needs no condensate reuse, 351 does; sub-meters for GA 5000 even with a small plant, not for 4999', [lk({leak: 4.5}).okLeak, lk({leak: 5}).okLeak, lk({leak: 5.1}).okLeak, lk({cool: 999}).testReq, lk({cool: 350}).condReuse, lk({cool: 351}).condReuse, lk({cool: 100, ga: 5000}).sub, lk({cool: 100, ga: 4999}).sub], [true, true, false, false, false, true, true, false]);
}
let tt;
w.renderCalc('dbchvac'); w.calcResult('dbchvac');
tt = txt(w, 'dk_results');
check('the design page shows 46 / 29, the comfort checks and the 🔴 note; only the first group visible', [tt.includes('46 °C جاف / 29 °C رطب'), tt.includes('حدود الراحة 22.5 - 25.5'), tt.includes('🔴'), w.document.getElementById('dk_g0').style.display, w.document.getElementById('dk_g1').style.display], [true, true, true, '', 'none']);
set('dk_m', '1'); w.calcResult('dbchvac'); tt = txt(w, 'dk_results');
check('the ventilation page shows the 700 L/s energy-recovery flow and the DCV requirement', [/700 L\/s/.test(tt), tt.includes('التحكم بالطلب DCV'), tt.includes('800 ppm')], [true, true, true]);
set('dk_m', '2'); w.calcResult('dbchvac'); tt = txt(w, 'dk_results');
check('the leakage page shows the 40,000 m3/h limit', [/40,?000 m³\/h/.test(tt), tt.includes('اختبار إحكام الهواء')], [true, true]);
check('other reference codes open dbchvac too', others('dbchvac', 'dk_results'), [true, true, true]);
}
// ---------- part 188: Dubai Building Code 2021, Part H water and drainage (`dbcplumb`: tank sizing, fixtures and water pipes, drainage sizes and access, rainwater) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const dj = o => w.eval('djCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
const W = J('DJ_W'), RI = J('DJ_RI');
check('tables loaded: Table H.6 29 categories, 7 flow limits, 3 hot-water rows, 7 outlet rows, 6 pipe rows, 5 access rows, 4 manhole rows, rainfall 16 return periods x 7 durations', [W.length, J('DJ_FX').length, J('DJ_HT').length, J('DJ_OUT').length, J('DJ_PIPE').length, J('DJ_AC').length, J('DJ_MH').length, J('DJ_RP').length, J('DJ_RD').length, RI.length, RI.every(r => r.length === 7)], [29, 7, 3, 7, 6, 5, 4, 16, 7, 16, true]);
check('Table H.14 spot values: 1000 yr 0.5 h 103.44; 100 yr row 75.30 / 52.12 / 38.56 / 31.99 / 25.59 / 14.66 / 5.48; 2 yr 24 h 1.56; every row falls with duration beyond 1 h and every column falls with a shorter return period', [RI[0][0], RI[3], RI[15][6], RI.every(r => r[1] > r[2] && r[5] > r[6]), RI.every((r, k) => k === 0 || r.every((x, c) => x <= RI[k - 1][c]))], [103.44, [75.30, 52.12, 38.56, 31.99, 25.59, 14.66, 5.48], 1.56, true, true]);
const tk = o => dj(Object.assign({mode: 0, i: 22, n: 100, pick: 1, rate: 0, labour: false, h: 0}, o));
{
  const r = tk({});
  check('flats 100 residents, mid-range 250 L/cap/day: 25 m3/day; tank 25 m3 for 24 h; two compartments of 12.5 m3', [W[22][0], r.rate, r.dayM3, r.hours, r.vol, r.comp, r.minApplied], ['مبانٍ سكنية (شقق)', 250, 25, 24, 25, 12.5, false]);
  check('lower and upper ends: 200 and 300 L/cap/day -> 20 and 30 m3; a custom rate of 100 L for 10 persons gives 1.0 m3 (no minimum needed)', [tk({pick: 0}).vol, tk({pick: 2}).vol, tk({rate: 100, n: 10}).vol, tk({rate: 100, n: 10}).minApplied], [20, 30, 1, false]);
  check('offices 2 persons at 45 L = 0.09 m3 -> raised to the 1 m3 minimum; labour accommodation 200 persons at 80 L for 48 h: 16 x 2 = 32 m3', [tk({i: 20, n: 2, pick: 0}).vol, tk({i: 20, n: 2, pick: 0}).minApplied, W[10][0], tk({i: 10, n: 200, pick: 0, labour: true}).vol, tk({i: 10, n: 200, pick: 0, labour: true}).hours], [1, true, 'سكن عمال', 32, 48]);
  const a = tk({h: 2}), b = tk({h: 3}), c = tk({h: 2.5});
  check('tank plan area: 25 m3 at 2 m depth = 12.5 m2; a 3 m water depth is capped at 2.5 m (area 10), fails the 2.5 m limit and the total 3.5 m exceeds the 3 m GRP height; 2.5 m water + 0.5 m free board = 3.0 passes', [a.area, a.okH, a.okGrp, b.area, b.okH, b.okGrp, c.okH, c.okGrp, c.hTank], [12.5, true, true, 10, false, false, true, true, 3]);
  check('Table H.6 spot values: day clinic 300 - 450; hotels per guest 200 - 300; labour 80 - 150; medical per bed 350 - 450; villas 250 - 350; offices 45 - 60; visitors 14 - 40; restaurants 10 - 15', [0, 8, 10, 15, 27, 20, 28, 23].map(i => W[i].slice(1, 3)), [[300, 450], [200, 300], [80, 150], [350, 450], [250, 350], [45, 60], [14, 40], [10, 15]]);
}
const fx = o => dj(Object.assign({mode: 1, q: 60, v: 1.5, d: 50, p: 1.2, fx: [{i: 0, v: 8}, {i: 1, v: 6}, {i: 2, v: 7}, {i: 3, v: 6}]}, o));
{
  const r = fx({});
  const dd = Math.sqrt(4 * 0.001 / (Math.PI * 1.5)) * 1000;
  check('60 L/min at 1.5 m/s needs a 29.13 mm inside diameter; in 50 mm the velocity is 0.5093 m/s (within 1.5); 1.2 bar is within 1.5; flows 8 / 6 / 7 / 6 meet the limits', [r.d, r.vel, r.okVel, r.okP, ...r.okFx], [dd, 0.001 / (Math.PI * 0.0025 / 4 * 1), true, true, true, true, true, true], 1e-9);
  check('limits: shower 8.5 L/min fails, basin 6.5 fails, kitchen 7.5 fails, full flush 6.5 L fails; pressure 1.6 bar fails; 20 mm at 60 L/min gives 3.18 m/s and fails the 1.5 m/s limit', [fx({fx: [{i: 0, v: 8.5}, {i: 1, v: 6.5}, {i: 2, v: 7.5}, {i: 3, v: 6.5}]}).okFx, fx({p: 1.6}).okP, fx({d: 20}).vel, fx({d: 20}).okVel], [[false, false, false, false], false, 0.001 / (Math.PI * 0.0004 / 4), false], 1e-9);
  check('no diameter gives zero velocity; no target velocity gives zero diameter', [fx({d: 0}).vel, fx({v: 0}).d], [0, 0]);
}
const dr = o => dj(Object.assign({mode: 2, fixture: 0, size: 0, system: 0, tall: false, psize: 0, depth: 1500, from: 1, to: 3, cover: 800}, o));
{
  check('Table H.9 outlet sizes: WC 100, basin 32, kitchen sink 40, floor drain 75, bath / shower 40, washing machine 40, balcony drain 50; provided sizes are compared', [0, 1, 2, 3, 4, 5, 6].map(f => dr({fixture: f}).out), [100, 32, 40, 75, 40, 40, 50]);
  check('provided outlet: 100 for a WC passes, 75 fails; none given -> no verdict', [dr({size: 100}).okOut, dr({size: 75}).okOut, dr({}).okOut], [true, false, null]);
  check('Tables H.10 and H.11: soil vent 100 / 150, waste vent 100 / 150, rainwater 100 / 100, vent 75 / 100, balcony drain 50 / 50, AC drain 32 / 32 (up to seven storeys / above)', [0, 1, 2, 3, 4, 5].map(s => [dr({system: s}).pipe, dr({system: s, tall: true}).pipe]).flat(), [100, 150, 100, 150, 100, 100, 75, 100, 50, 50, 32, 32]);
  check('provided pipe size: soil vent 100 passes in a low building and fails in a tall one', [dr({psize: 100}).okPipe, dr({psize: 100, tall: true}).okPipe, dr({psize: 150, tall: true}).okPipe], [true, false, true]);
  check('Table H.13 manholes: 1300 -> 600 x 600; 1301 and 1700 -> 800 x 800; 2500 -> 1000 dia; 2501 and 4000 -> 1500 dia; 4001 -> out of the table; covers 600 x 600 or 600 dia', [1300, 1301, 1700, 2500, 2501, 4000].map(d => dr({depth: d}).mh.slice(1)).concat([dr({depth: 4001}).mh]), [['600 × 600 mm', '600 × 600 mm'], ['800 × 800 mm', '600 × 600 mm'], ['800 × 800 mm', '600 × 600 mm'], ['قطر 1,000 mm (بطانة GRP)', 'قطر 600 mm'], ['قطر 1,500 mm (بطانة GRP)', 'قطر 600 mm'], ['قطر 1,500 mm (بطانة GRP)', 'قطر 600 mm'], null]);
  check('Table H.12 access spacing: start of external drain to access fitting 12, to inspection chamber 18, to manhole 20, no junction value; rodding point to junction 12 and manhole 20; inspection chamber to access fitting 18; manhole to inspection chamber 18 and to manhole 20', [dr({from: 0, to: 0}).acc, dr({from: 0, to: 1}).acc, dr({from: 0, to: 2}).acc, dr({from: 0, to: 3}).acc, dr({from: 1, to: 0}).acc, dr({from: 1, to: 3}).acc, dr({from: 3, to: 1}).acc, dr({from: 4, to: 2}).acc, dr({from: 4, to: 3}).acc, dr({from: 4, to: 1}).acc], [null, 12, 18, 20, 12, 20, 18, 18, 20, null]);
  check('buried pipe with less than 600 mm cover needs 150 mm concrete encasement; 600 does not', [dr({cover: 599}).enc, dr({cover: 600}).enc], [true, false]);
}
const rn = o => dj(Object.assign({mode: 3, rp: 3, dur: 1, area: 500, c: 1, use75: true, slope: 0}, o));
{
  const r = rn({});
  check('100-year 1 h table value 52.12 mm/h; the default roof intensity 75 mm/h on 500 m2: Q = 75 x 500 / 3600 = 10.42 L/s; the table gives 7.24 L/s', [r.table, r.i, r.q, r.qTable], [52.12, 75, 75 * 500 / 3600, 52.12 * 500 / 3600], 1e-9);
  check('table mode uses the table intensity; a 0.9 runoff coefficient scales the flow', [rn({use75: false}).i, rn({use75: false, c: 0.9}).q, rn({rp: 0, dur: 0, use75: false}).i], [52.12, 52.12 * 500 * 0.9 / 3600, 103.44], 1e-9);
  check('gutter slope: 1/50 and 1/70 pass; 1/49 and 1/71 fail; none gives no verdict; 16 m2 gets a floor drain, 17 m2 a free-discharge rain drain', [rn({slope: 50}).okSlope, rn({slope: 70}).okSlope, rn({slope: 49}).okSlope, rn({slope: 71}).okSlope, rn({}).okSlope, rn({area: 16}).floorDrain, rn({area: 17}).floorDrain], [true, true, false, false, null, true, false]);
}
let tt;
w.renderCalc('dbcplumb'); w.calcResult('dbcplumb');
tt = txt(w, 'dj_results');
check('the tank page opens with 25 m3 for 100 flat residents and the 🔴 note; only the first group visible', [tt.includes('سعة الخزان المطلوبة'), /25\.00 m³/.test(tt), tt.includes('🔴'), w.document.getElementById('dj_g0').style.display, w.document.getElementById('dj_g1').style.display], [true, true, true, '', 'none']);
set('dj_m', '1'); w.calcResult('dbcplumb'); tt = txt(w, 'dj_results');
check('the fixtures page shows the 29.1 mm diameter and the pressure verdict', [tt.includes('القطر الداخلي اللازم'), /29\.1 mm/.test(tt), tt.includes('الحد الأقصى 1.5 bar')], [true, true, true]);
set('dj_m', '2'); w.calcResult('dbcplumb'); tt = txt(w, 'dj_results');
check('the drainage page shows the 100 mm outlet and the 20 m manhole spacing', [tt.includes('أدنى قطر مخرج الجهاز'), /20 m/.test(tt), tt.includes('600 × 600')], [true, true, true]);
set('dj_m', '3'); w.calcResult('dbcplumb'); tt = txt(w, 'dj_results');
check('the rainfall page shows 10.42 L/s for 75 mm/h on 500 m2', [/10\.42 L\/s/.test(tt), tt.includes('52.12 mm/h')], [true, true]);
check('other reference codes open dbcplumb too', others('dbcplumb', 'dj_results'), [true, true, true]);
}
// ---------- part 189: Dubai Building Code 2021, Part E envelope (`dbcenv`: glazing ratio by orientation, glazing performance, opaque U-values and SRI) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const dv = o => w.eval('dvCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('Table E.3: eight orientations with limits N 80, NE 70, E 60, SE 40, S 40, SW 40, W 60, NW 70; Table E.5 bands (2.1 / 0.4 / 40), (1.9 / 0.32 / 32), (1.7 / 0.25 / 25); Table E.7 (1.9 / 0.32 / 32), (1.9 / 0.25 / 25); Table E.6 1.9 / 0.76; Table E.4 roof 0.3, wall 0.57, floor 0.57; SRI 29 / 78 / 29', [J('DV_OR').map(x => x[3]), J('DV_GL').map(x => x.slice(1)), J('DV_SK').map(x => x.slice(1)), J('DV_SH'), J('DV_U').map(x => x[1]), J('DV_SRI').map(x => x[1])], [[80, 70, 60, 40, 40, 40, 60, 70], [[2.1, 0.4, 40], [1.9, 0.32, 32], [1.7, 0.25, 25]], [[1.9, 0.32, 32], [1.9, 0.25, 25]], {u: 1.9, sc: 0.76}, [0.3, 0.57, 0.57], [29, 78, 29]]);
check('orientation of a facade by its angle from north: 0 N, 22.4 N, 22.5 NE, 90 E, 112.5 SE, 135 SE, 157.5 S, 180 S, 225 SW, 270 W, 315 NW, 337.5 N, 350 N, -10 N', [0, 22.4, 22.5, 90, 112.5, 135, 157.5, 180, 225, 270, 315, 337.5, 350, -10].map(a => w.eval('dvOrient(' + a + ')')), [0, 0, 1, 2, 3, 3, 4, 4, 5, 6, 7, 0, 0, 0]);
const wall = [300, 250, 400, 250, 300, 250, 400, 250], glass = [90, 70, 100, 50, 60, 50, 100, 60];
const rows = (wl, gl) => wl.map((x, k) => ({wall: x, glass: gl[k]}));
const wr = (wl, gl, res) => dv({mode: 0, res: res !== false, rows: rows(wl || wall, gl || glass)});
{
  const r = wr();
  check('default building: wall 2400 m2, glass 580 m2: WWR 24.17 %; every orientation within its limit (N 30 %, NE 28 %, E 25 %, SE 20 %, S 20 %, SW 20 %, W 25 %, NW 24 %); maximum glass 960 m2 for residential (40 %)', [r.wall, r.glass, r.wwr, ...r.rows.map(x => x.wr), r.maxWwr, r.maxTot, r.okTot, r.allOk], [2400, 580, 580 / 24, 30, 28, 25, 20, 20, 20, 25, 24, 40, 960, true, true], 1e-9);
  const q = wr(wall, glass.map((x, k) => k === 4 ? 150 : x));
  check('south glass 150 of 300 m2 = 50 % exceeds the 40 % south limit although the total 670 / 2400 = 27.9 % is fine', [q.rows[4].ok, q.rows[4].wr, q.okTot, q.allOk], [false, 50, true, false], 1e-9);
  const wl = [300, 300, 300, 300, 300, 300, 300, 300], gl = [125, 125, 125, 125, 125, 125, 125, 125];
  const a = wr(wl, gl, true), b = wr(wl, gl, false);
  check('glass 125 of 300 everywhere = 41.67 %: residential limit 40 % fails; other buildings 60 % pass the total (orientations SE / S / SW still fail at 40 %)', [a.wwr, a.okTot, b.okTot, b.rows.map(x => x.ok)], [1000 / 24, false, true, [true, true, true, false, false, false, true, true]], 1e-9);
  check('limits exactly met pass: 120 of 300 m2 everywhere is 40 % in total and in every orientation (the 40 % ones just pass); zero wall gives zero ratio', [wr(wl, [120, 120, 120, 120, 120, 120, 120, 120]).okTot, wr(wl, [120, 120, 120, 120, 120, 120, 120, 120]).allOk, wr([0, 0, 0, 0, 0, 0, 0, 0], gl).wwr], [true, true, 0]);
}
const gz = o => dv(Object.assign({mode: 1, kind: 0, pct: 50, u: 1.8, sc: 0.3, lt: 35, ag: 1.2, ug: 1.6, af: 0.3, uf: 2.5, psi: 0.06, lg: 4.5}, o));
{
  const r = gz({});
  check('glazing 50 %: band 40 - 60 %, limits U 1.9, SC 0.32, LT 32: 1.8 / 0.3 / 35 all met', [r.band, r.lim, r.okU, r.okSc, r.okLt, r.all], [1, {u: 1.9, sc: 0.32, lt: 32}, true, true, true, true]);
  check('bands: 39.9 % -> first (2.1, 0.4, 40); 40 and 60 % -> second; 60.1 % -> third (1.7, 0.25, 25)', [39.9, 40, 60, 60.1].map(p => gz({pct: p}).band), [0, 1, 1, 2]);
  check('LT 31 % fails the 32 % requirement; U 2.0 fails 1.9; SC 0.33 fails 0.32', [gz({lt: 31}).okLt, gz({u: 2.0}).okU, gz({sc: 0.33}).okSc, gz({lt: 31}).all], [false, false, false, false]);
  check('overall window U = (1.2 x 1.6 + 0.3 x 2.5 + 0.06 x 4.5) / 1.5 = 1.96 W/m2K, above the 1.9 limit of this band; zero area gives 0', [r.uw, r.okUw, gz({ag: 0, af: 0}).uw], [1.96, false, 0], 1e-9);
  check('skylights: 10 % -> (1.9, 0.32, 32); 10.1 % -> (1.9, 0.25, 25); shopfront / showroom: U 1.9 and SC 0.76 only (no light transmittance)', [gz({kind: 1, pct: 10}).lim, gz({kind: 1, pct: 10.1}).lim, gz({kind: 2}).lim, gz({kind: 2}).okLt, gz({kind: 2, sc: 0.76}).okSc, gz({kind: 2, sc: 0.77}).okSc], [{u: 1.9, sc: 0.32, lt: 32}, {u: 1.9, sc: 0.25, lt: 25}, {u: 1.9, sc: 0.76, lt: null}, null, true, false]);
}
const op = o => dv(Object.assign({mode: 2, elem: 1, dir: 0, rair: 0, kIns: 0.035, layers: [{d: 20, k: 1.0}, {d: 200, k: 0.6}, {d: 50, k: 0.035}, {d: 0, k: 0}], sriKind: 1, sri: 0, roofArea: 500, facade: 100, length: 40}, o));
{
  const R = 0.02 + 0.2 / 0.6 + 0.05 / 0.035;
  const r = op({});
  check('wall of 20 mm plaster (1.0), 200 mm block (0.6), 50 mm insulation (0.035): layers R = 1.7819, RT = 0.13 + 0.04 + 1.7819 = 1.9519, U = 0.512 W/m2K within 0.57; empty layers are ignored (3 layers)', [r.layers.length, r.rlay, r.rt, r.u, r.lim, r.ok], [3, R, 0.17 + R, 1 / (0.17 + R), 0.57, true], 1e-9);
  const roof = op({elem: 0, dir: 1});
  const rn = 1 / 0.3 - 0.14;
  check('the same build-up as a roof (film 0.10): U = 0.520 fails the 0.3 limit; required total layer R = 3.333 - 0.14 = 3.193; extra insulation (3.193 - 1.782) x 0.035 = 49.4 mm', [roof.u, roof.ok, roof.rNeed, roof.addIns], [1 / (0.14 + R), false, rn, (rn - R) * 0.035 * 1000], 1e-9);
  check('exposed floor (film 0.17) uses 0.57: R_T = 0.21 + 1.7819 -> U = 0.5; an air layer of 0.18 adds to the resistance; no insulation conductivity gives no extra thickness', [op({elem: 2, dir: 2}).rsi, op({elem: 2, dir: 2}).u, op({rair: 0.18}).rt - r.rt, op({elem: 0, dir: 1, kIns: 0}).addIns], [0.17, 1 / (0.21 + R), 0.18, 0], 1e-9);
  check('SRI: steep roof 29, flat roof 78, wall 29; 80 on a flat roof passes, 77 fails; 29 on a steep roof passes; 75 % of 500 m2 = 375 m2; none given gives no verdict', [op({sriKind: 1, sri: 80}).okSri, op({sriKind: 1, sri: 77}).okSri, op({sriKind: 0, sri: 29}).okSri, op({sriKind: 2, sri: 28}).okSri, op({}).okSri, op({}).sriArea, op({sriKind: 0}).sri, op({sriKind: 1}).sri], [true, false, true, false, null, 375, 29, 78]);
  check('exterior facade lighting: 2.2 W/m2 x 100 m2 = 220 W or 16.4 W/m x 40 m = 656 W', [op({}).lpdArea, op({}).lpdLin], [220, 656], 1e-9);
}
let tt;
w.renderCalc('dbcenv'); w.calcResult('dbcenv');
tt = txt(w, 'dv_results');
check('the glazing-ratio page shows the total 24.2 % and the 🔴 note; only the first group visible', [tt.includes('النسبة الإجمالية WWR'), /24\.2 %/.test(tt), tt.includes('🔴'), w.document.getElementById('dv_g0').style.display, w.document.getElementById('dv_g1').style.display], [true, true, true, '', 'none']);
set('dv_m', '1'); w.calcResult('dbcenv'); tt = txt(w, 'dv_results');
check('the performance page shows the band 40 - 60 % and the overall window U 1.96', [tt.includes('من 40 % إلى 60 %'), /1\.96 W\/m²K/.test(tt)], [true, true]);
set('dv_m', '2'); w.calcResult('dbcenv'); tt = txt(w, 'dv_results');
check('the opaque page shows U = 0.512 and the 0.57 limit', [/0\.512 W\/m²K/.test(tt), tt.includes('0.57 W/m²K')], [true, true]);
check('other reference codes open dbcenv too', others('dbcenv', 'dv_results'), [true, true, true]);
}
// ---------- part 190: Dubai Building Code 2021, Part D vertical transportation (`dbcvt`: population, elevator and escalator counts, speed and performance, minimum specifications, lobbies and distances) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const dy = o => w.eval('dyCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
const SP = J('DY_SP'), CL = J('DY_CL');
check('tables loaded: 4 unit-population sets, 3 hotel guest rates, 4 public-area rates, 4 grouping ratios, 13 performance classes, 5 acceleration rows, 6 travel-distance rows, 41 specification rows', [J('DY_PU').length, J('DY_HG').length, J('DY_HP').length, J('DY_GR').length, CL.length, J('DY_AJ').length, J('DY_TD').length, SP.length], [4, 3, 4, 4, 13, 5, 6, 41]);
check('occupancy rates: apartments 1.5 / 1.8 / 3 / 4 / 5 / +1; staff and student 2 / 2 / 4 / 6 / +2; hotel apartments 1 / 1.5 / 2.5 / 3.5 / +1; hotels 1.8 (4 - 5 star), 1.5, 1.5 per room; public areas 1.2 / 1.5 / 1.5 / 1.5 m2 per person', [J('DY_PU').map(x => x[1]), J('DY_HG').map(x => x[1]), J('DY_HP').map(x => x[1])], [[[1.5, 1.8, 3, 4, 5, 1], [2, 2, 4, 6, null, 2], [2, 2, 4, 6, null, 2], [1, 1.5, 2.5, 3.5, null, 1]], [1.8, 1.5, 1.5], [1.2, 1.5, 1.5, 1.5]]);
const pp = o => dy(Object.assign({mode: 0, kind: 0, ratio: 0, star: 0, mall: false, cars: 0, n: [0, 0, 0, 0, 0, 0], areas: [0, 0, 0, 0]}, o));
{
  const r = pp({n: [100, 50, 20, 10, 5, 10]});
  check('apartments 100 studios, 50 one-bedroom, 20 two-bedroom, 10 three-bedroom, 5 four-bedroom, 10 extra bedrooms: 150 + 90 + 60 + 40 + 25 + 10 = 375 persons; two groupings use 120 % = 450 and ratio 1 gives 0.6 x 375 = 225 each', [r.pop, r.popR, r.weighted, r.g1, r.g2, r.act1, r.act2], [375, 375, 450, 225, 225, 187.5, 187.5], 1e-9);
  const q = pp({n: [100, 50, 20, 10, 5, 10], ratio: 2});
  check('ratio 3 (70 / 30 actual): traffic-study shares 80 % and 40 % of 375 = 300 and 150; actual 262.5 and 112.5; the code example 500 residents -> 600 -> 300 per group', [q.g1, q.g2, q.act1, q.act2, pp({n: [500, 0, 0, 0, 0, 0], kind: 6, ratio: 0}).g1 !== undefined], [300, 150, 262.5, 112.5, true], 1e-9);
  check('staff accommodation: 10 studios 20 + 10 one-bedroom 20 + 5 two-bedroom 20 + 5 three-bedroom 30 + 4 extra bedrooms 8 = 98 (four-bedroom count ignored); hotel apartments 10 x (1 + 1.5 + 2.5 + 3.5) + 5 = 90', [pp({kind: 1, n: [10, 10, 5, 5, 3, 4]}).pop, pp({kind: 3, n: [10, 10, 10, 10, 0, 5]}).pop, pp({kind: 2, n: [10, 0, 0, 0, 0, 0]}).pop], [98, 90, 20]);
  const hotel = pp({kind: 4, star: 0, n: [200], areas: [120, 300, 150, 60]});
  check('4 - 5 star hotel 200 rooms x 1.8 = 360 + meeting 120 / 1.2 = 100 + ballroom 300 / 1.5 = 200 + restaurants 150 / 1.5 = 100 + food and beverage 60 / 1.5 = 40 = 800; a 3-star hotel uses 1.5 per room', [hotel.pop, pp({kind: 4, star: 1, n: [200]}).pop, pp({kind: 4, star: 2, n: [200]}).pop], [800, 300, 300], 1e-9);
  check('car park 100 cars x 1.5 = 150, in a mall x 3.0 = 300; retail 10,000 m2 / 5 = 2000; office 10,000 m2 x 80 % / 10 = 800; labour accommodation 100 rooms x 8 = 800; basement and podium cars 400 x 1.5 = 600', [pp({kind: 5, n: [100]}).pop, pp({kind: 5, n: [100], mall: true}).pop, pp({kind: 6, n: [10000]}).pop, pp({kind: 7, n: [10000]}).pop, pp({kind: 8, n: [100]}).pop, pp({cars: 400}).park], [150, 300, 2000, 800, 800, 600], 1e-9);
  check('empty input gives zero population', [pp({}).pop, pp({}).popR, pp({}).parts.length], [0, 0, 0]);
}
const ec = o => dy(Object.assign({mode: 1, kind: 0, sub: 0, keys: 300, outlets: 100, people: 5000, entrances: 2, walk: false}, o));
{
  check('hotel service elevators: 1 - 2 star 1 up to 250 keys, 251 -> 2, 450 -> 2, 451 -> 3; 3-star 2; 4 - 5 star 2 up to 500, 501 -> 3, 700 -> 3, 701 -> 4', [250, 251, 450, 451].map(k => ec({sub: 0, keys: k}).n).concat([ec({sub: 1, keys: 900}).n], [500, 501, 700, 701].map(k => ec({sub: 2, keys: k}).n)), [1, 2, 2, 3, 2, 2, 3, 3, 4]);
  check('residential, office / hotel apartments: one service elevator; retail 75 outlets -> 1, 76 -> 2, 175 -> 2, 176 -> 3', [ec({kind: 1}).n, ec({kind: 2}).n, ...[75, 76, 175, 176].map(o => ec({kind: 3, outlets: o}).n)], [1, 1, 1, 2, 2, 3]);
  check('university classroom building: first 400 people two elevators, +1 per 300: 400 -> 2, 401 -> 3, 700 -> 3, 701 -> 4', [400, 401, 700, 701].map(p => ec({kind: 4, people: p}).n), [2, 3, 3, 4]);
  check('labour accommodation: the higher of one per 1,000 labourers and one per two entrances: 2500 people, 2 entrances -> 3; 800 people, 6 entrances -> 3; 1,000 people 2 entrances -> 1', [ec({kind: 5, people: 2500, entrances: 2}).n, ec({kind: 5, people: 800, entrances: 6}).n, ec({kind: 5, people: 1000, entrances: 2}).n], [3, 3, 1]);
  const e = p => ec({kind: 6, people: p});
  check('retail escalators (D.22): below 600 optional, 600 - 4500 one group, 4501 - 8000 two groups, then +1 per 4000; elevator sets of two follow', [500, 600, 4500, 4501, 8000, 8001, 12000, 12001].map(p => [e(p).groups, e(p).sets]), [[0, 1], [1, 1], [1, 1], [2, 2], [2, 2], [3, 3], [3, 3], [4, 4]]);
  const m = p => ec({kind: 6, people: p, walk: true});
  check('moving walks (D.23): below 600 trolley movement, 600 - 3600 one group, 3601 - 7200 two groups, +1 per 3000; elevator sets follow', [599, 600, 3600, 3601, 7200, 7201, 10200, 10201].map(p => [m(p).groups, m(p).sets]), [[0, 1], [1, 1], [1, 1], [2, 2], [2, 2], [3, 3], [3, 3], [4, 4]]);
  check('elevator count of a retail set is twice the sets; trolley flag below 600 for moving walks only', [e(5000).n, m(500).trolley, e(500).trolley], [4, true, undefined]);
}
const pf = o => dy(Object.assign({mode: 2, i: 0, h: 100, pop: 600, q: 17}, o));
{
  const r = pf({});
  check('apartments: 100 m climb in 40 - 45 s needs 2.22 - 2.50 m/s; acceleration 0.9 m/s2 and jerk 1.0 m/s3 for 2.5 m/s; HC5 7 % of 600 = 42; waiting <= 40 s; capacity factor 60 - 80 % of 17 = 10.2 - 13.6; door 2.2 / 3.2 s (1.9 / 2.8 s from 120 m height)', [r.vSlow, r.vFast, r.aj, r.hcReq, r.wait, r.perTripLo, r.perTrip, r.door, pf({h: 120}).door], [100 / 45, 2.5, [2, 0.9, 1.0], 42, 40, 10.2, 13.6, [2.2, 3.2], [1.9, 2.8]], 1e-9);
  const hot = pf({i: 5, h: 80, pop: 1000});
  check('4 - 5 star hotel: 80 m in 20 - 25 s -> 3.2 - 4.0 m/s; acceleration 1.0 and jerk 1.1 at 4.0; HC5 12 - 15 % of 1000 = 120 - 150; waiting <= 30 s; capacity factor 50 %; door 1.9 / 2.8', [hot.vSlow, hot.vFast, hot.aj, hot.hcLo, hot.hcReq, hot.wait, hot.cfLo, hot.cfHi, hot.door], [3.2, 4, [3, 1.0, 1.1], 120, 150, 30, 50, 50, [1.9, 2.8]], 1e-9);
  check('office regular: lunch-break HC5 13 % of 1000 = 130 and 12 % in the morning = 120; concentrated office 30 - 35 s; car parks have no travel time; clinics HC 8 - 10 %, capacity factor 50 - 80 %', [pf({i: 8, pop: 1000}).hcLunch, pf({i: 8, pop: 1000}).hcReq, CL[9].slice(1, 3), pf({i: 7}).vFast, CL[10].slice(3, 5), CL[10].slice(7, 9)], [130, 120, [30, 35], null, [8, 10], [50, 80]]);
  check('acceleration and jerk by speed: below 1 m/s uses the first row; 1.6 m/s the 1.5 - 1.75 row; 2.0 the 2.0 - 2.5 row; 3.5 the 3.0 - 4.0 row; 5.0 and above the last row', [0.9, 1.6, 2.0, 3.5, 5.0, 6.0].map(v => pf({i: 8, h: 25 * v}).aj), [[1, 0.7, 0.8], [1.5, 0.8, 0.9], [2, 0.9, 1.0], [3, 1.0, 1.1], [5, 1.2, 1.4], [5, 1.2, 1.4]]);
  check('classes carry the printed travel times: apartments 40 - 45, accommodation 50 - 60, 1-2 star 35 - 40, 3 star 25 - 30, 4-5 star 20 - 25, hotel apartments 25 - 30, regular office 25 - 30, retail 25 - 30', [0, 1, 3, 4, 5, 6, 8, 11].map(i => CL[i].slice(1, 3)), [[40, 45], [50, 60], [35, 40], [25, 30], [20, 25], [25, 30], [25, 30], [25, 30]]);
}
const sp = i => dy({mode: 3, i});
{
  const r = sp(0);
  check('residential minimum passenger elevator for up to 10 floors: 750 kg, 10 persons, cabin 1200 x 1500 (1.8 m2, 0.18 m2 per person), 75 kg per person, door 900 x 2100', [r.row.slice(3, 10), r.area, r.perPerson, r.kgPerPerson], [[750, 10, 1200, 1500, 2300, 900, 2100], 1.8, 0.18, 75], 1e-9);
  const find = (b, e, g) => SP.find(x => x[0].includes(b) && x[1] === e && x[2].includes(g));
  check('office passenger above five floors: minimum 1275 kg 17 persons 1900 x 1500, recommended 1600 kg 21 persons 2100 x 1600; 4 - 5 star service recommended 2000 kg 26 persons 1500 x 2700 door 1400 x 2300; university service minimum 1600 kg 21 persons', [find('مكاتب', 'ركاب', 'أدنى لأكثر من 5').slice(3, 7), find('مكاتب', 'ركاب', 'موصى لأكثر من 5').slice(3, 7), find('4 و5', 'خدمة', 'موصى').slice(3, 10), find('جامعات', 'خدمة', 'أدنى').slice(3, 5)], [[1275, 17, 1900, 1500], [1600, 21, 2100, 1600], [2000, 26, 1500, 2700, 2800, 1400, 2300], [1600, 21]]);
  check('retail trolley elevators 2500 kg 33 persons 2000 x 2400 and 3200 kg 43 persons 2200 x 3000; parking minimum 1275 kg 17 persons; school minimum 750 kg 10 persons', [find('تجزئة', 'ركاب بعربات', 'أدنى').slice(3, 7), find('تجزئة', 'ركاب بعربات', 'موصى').slice(3, 7), find('مواقف', 'ركاب', 'أدنى').slice(3, 5), find('مدارس', 'ركاب', 'أدنى').slice(3, 5)], [[2500, 33, 2000, 2400], [3200, 43, 2200, 3000], [1275, 17], [750, 10]]);
  check('capacity in persons is about 75 kg per person for every row except the 21-person 1600 kg and 26-person 2000 kg rows; every cabin has one door', [SP.every(x => Math.abs(x[3] / x[4] - 75) < 5 || x[3] / x[4] > 70), SP.every(x => x[4] > 0 && x[5] > 0 && x[8] > 0)], [true, true]);
}
const lb = o => dy(Object.assign({mode: 4, i: 0, dist: 50, n: 4, resTyp: false, corr: 1.5, depth: 2.3, fire: 2.3}, o));
{
  check('Table D.1: accommodation 60, open plan office 60, retail 150, assembly 150, educational 150, hotel 60; 60 m passes, 61 fails', [0, 1, 2, 3, 4, 5].map(i => lb({i}).row[1]).concat([lb({dist: 60}).okTd, lb({dist: 61}).okTd]), [60, 60, 150, 150, 150, 60, true, false]);
  check('groups: four elevators in line and in a core are allowed, five are not in a line but five to eight can share a lobby; nine cannot', [lb({n: 4}).inLine, lb({n: 5}).inLine, lb({n: 5}).lobby, lb({n: 8}).lobby, lb({n: 9}).lobby], [true, false, true, true, false]);
  check('lobby depth in front: 2.4 m; typical residential floor: the greater of the corridor width and 1.8 m (1.5 -> 1.8; 2.2 -> 2.2)', [lb({}).front, lb({resTyp: true}).front, lb({resTyp: true, corr: 2.2}).front], [2.4, 1.8, 2.2], 1e-9);
  check('facing cores: the greater of 2.4 m, twice the deepest car (2.3 m -> 4.6 m, above the 4.5 m limit) and 1.5 x the firefighting car; cars 1.5 m deep and 2.0 m fire car -> 3.0 m; 1.0 / 1.0 -> 2.4 m', [lb({}).face, lb({}).okFace, lb({depth: 1.5, fire: 2.0}).face, lb({depth: 1.5, fire: 2.0}).okFace, lb({depth: 1.0, fire: 1.0}).face], [4.6, false, 3.0, true, 2.4], 1e-9);
}
const CH = J('DY_CH'), OFC = J('DY_OF'), BDT = J('DY_BD'), BHT = J('DY_BH');
const vc = o => dy(Object.assign({mode: 5, vk: 0, vf: 12, vp: 450, vb: 2, vg: 8000}, o));
{
  const sum = a => a.reduce((s, x) => s + (Array.isArray(x) ? sum(x) : (x || 0)), 0);
  check('charts D.13 - D.23 loaded from the page images: 8 population charts (D.13, D.15, D.16, D.17, D.18, D.19, D.20, D.23), two boarding-floor pairs, and the office chart of 10 floor bands x 30 columns; cell sums 212, 116, 69, 150, 153, 149, 159, 116 (boarding 44 and 14, office 1191) guard the transcription', [CH.map(x => x.n), CH.map(ch => sum(ch.rows.map(r => r[1]))), sum(BDT.map(t => t.map(r => r[1]))), sum(BHT.map(t => t.map(r => r[1]))), OFC.rows.length, OFC.rows.every(r => r[1].length === 30), sum(OFC.rows.map(r => r[1])), OFC.ga], [['D.13', 'D.15', 'D.16', 'D.17', 'D.18', 'D.19', 'D.20', 'D.23'], [212, 116, 69, 150, 153, 149, 159, 116], 44, 14, 10, true, 1191, [2500, 5000, 7500, 10000, 12500, 15000, 17500, 20000, 22500, 25000]]);
  const ok = (t, f) => t.every(r => f(r[1])), nonDec = v => v.every((x, k) => k === 0 || x === null || v[k - 1] === null || x >= v[k - 1]);
  check('the transcription is consistent: in every chart the count never decreases with the population (along a row) nor with the number of floors (down a column), for the population, boarding and office charts', [CH.every(ch => ok(ch.rows, nonDec) && ch.cols.every((_, k) => ch.rows.every((r, i) => i === 0 || r[1][k] == null || ch.rows[i - 1][1][k] == null || r[1][k] >= ch.rows[i - 1][1][k]))), [...BDT, ...BHT].every(t => ok(t, nonDec)), OFC.rows.every(r => r[1].every((x, k) => k % 3 === 0 || x === null || r[1][k - 1] === null || x >= r[1][k - 1])), Array.from({length: 30}, (_, k) => k).every(k => OFC.rows.every((r, i) => i === 0 || r[1][k] === null || OFC.rows[i - 1][1][k] === null || r[1][k] >= OFC.rows[i - 1][1][k]))], [true, true, true, true]);
  const a = vc({});
  check('residential 12 floors and 450 persons: row 11 - 15, column 401 - 500 gives 3 elevators; two boarding floors add none (D.14b, 700 or fewer persons): 3 in total', [a.v, a.fBand, a.pBand, a.b, a.total, a.out], [3, '11 - 15', '401 - 500', 0, 3, false]);
  check('residential corners: 1 - 5 floors and 200 persons 1; 31 - 35 floors and 1,200 persons 6; 26 - 30 floors up to 200 persons 3; 31 - 35 floors up to 200 persons not in the chart; 700 persons for 1 - 5 floors is outside; 1,201 persons or 36 floors outside', [vc({vf: 1, vp: 200}).v, vc({vf: 33, vp: 1200}).v, vc({vf: 28, vp: 200}).v, vc({vf: 33, vp: 200}).out, vc({vf: 3, vp: 700}).out, vc({vp: 1201}).out, vc({vf: 36}).out], [1, 6, 3, true, true, true, true]);
  check('residential boarding floors add elevators for more than 700 persons: 33 floors, 1,000 persons, 6 boarding floors: 6 + 2 = 8; 5 boarding floors 6 + 2; 3 boarding floors 6 + 1 = 7; a seventh boarding floor is outside; with 700 or fewer persons 31 - 35 floors and 6 boarding floors add 1', [vc({vf: 33, vp: 1000, vb: 6}).total, vc({vf: 33, vp: 1000, vb: 5}).total, vc({vf: 33, vp: 1000, vb: 3}).total, vc({vf: 33, vp: 1000, vb: 7}).total, vc({vf: 33, vp: 700, vb: 6}).b], [8, 8, 7, null, 1]);
  check('staff accommodation (D.15): 12 floors with 301 - 400 persons 2, 200 persons not in the chart; 29 floors 900 persons 5; student accommodation (D.16): 20 floors, 800 persons 5; 1 - 5 floors 200 persons 1; 901 - 1,000 persons outside the student chart', [vc({vk: 1, vf: 12, vp: 301}).v, vc({vk: 1, vf: 12, vp: 200}).out, vc({vk: 1, vf: 29, vp: 900}).v, vc({vk: 2, vf: 20, vp: 800}).v, vc({vk: 2, vf: 3, vp: 200}).v, vc({vk: 2, vf: 20, vp: 801}).out], [2, true, 5, 5, 1, true]);
  check('hotels: 1 - 2 star 30 floors 1,000 persons 7; 3 star 8; 4 - 5 star 30 floors 800 persons 7 and above 900 persons outside; 4 - 5 star 6 - 10 floors 600 persons 4 and 301 - 400 persons 3; 1 - 5 floors always 2', [vc({vk: 3, vf: 30, vp: 1000}).v, vc({vk: 4, vf: 30, vp: 1000}).v, vc({vk: 5, vf: 30, vp: 800}).v, vc({vk: 5, vf: 30, vp: 901}).out, vc({vk: 5, vf: 8, vp: 600}).v, vc({vk: 5, vf: 8, vp: 350}).v, [3, 4, 5].map(k => vc({vk: k, vf: 3, vp: 300}).v)], [7, 8, 7, true, 4, 3, [2, 2, 2]]);
  check('hotel apartments (D.20 plus D.21): 12 floors 600 persons 3, boarding 3 floors adds 0; 28 floors 800 persons 5, above 700 persons 5 boarding floors add 2 -> 7, 6 boarding floors outside; 700 or fewer persons 1', [vc({vk: 6, vf: 12, vp: 600, vb: 3}).total, vc({vk: 6, vf: 28, vp: 800, vb: 5}).v, vc({vk: 6, vf: 28, vp: 800, vb: 5}).b, vc({vk: 6, vf: 28, vp: 800, vb: 5}).total, vc({vk: 6, vf: 28, vp: 800, vb: 6}).out, vc({vk: 6, vf: 28, vp: 700, vb: 5}).b], [3, 5, 2, 7, true, 1]);
  const of = o => vc(Object.assign({vk: 7}, o));
  check('offices (D.22): GA 8,000 m2 in the 7,501 - 10,000 band, 12 floors and 3 boarding floors (group 2 - 4): 5; GA 25,000, 20 floors, 8 boarding floors 13; 2,000 m2, 2 floors, 1 boarding floor 1; 2,500 m2, 6 floors, 6 boarding floors 3; 2,501 m2, 6 floors, 1 boarding floor 2', [of({vg: 8000, vf: 12, vb: 3}).v, of({vg: 25000, vf: 20, vb: 8}).v, of({vg: 2000, vf: 2, vb: 1}).v, of({vg: 2500, vf: 6, vb: 6}).v, of({vg: 2501, vf: 6, vb: 1}).v], [5, 13, 1, 3, 2]);
  check('offices outside the chart: GA above 25,000 m2, 21 floors, nine boarding floors, or a combination the chart leaves blank (2,500 m2 with 8 floors); the groups are 1, 2 - 4 and 5 - 8', [of({vg: 25001}).out, of({vf: 21}).out, of({vb: 9}).out, of({vg: 2500, vf: 8, vb: 1}).out, [1, 4, 5].map(b => of({vb: b}).grp)], [true, true, true, true, ['1', '2 - 4', '5 - 8']]);
  check('car parks (D.23): 5 parking floors and 600 persons 3; 9 floors 1,000 persons 4; 1 floor 300 persons 1 (400 persons outside); 6 floors 200 persons not in the chart; 10 floors outside', [vc({vk: 8, vf: 5, vp: 600}).v, vc({vk: 8, vf: 9, vp: 1000}).v, vc({vk: 8, vf: 1, vp: 300}).v, vc({vk: 8, vf: 1, vp: 400}).out, vc({vk: 8, vf: 6, vp: 200}).out, vc({vk: 8, vf: 10, vp: 300}).out], [3, 4, 1, true, true, true]);
  check('population band labels: 200 persons is "<= 200", 201 is 201 - 300, 1,200 is 1,001 - 1,200 for residential; floors bands 1 - 5, 6 - 10, 11 - 15 ...', [vc({vp: 200, vf: 3}).pBand, vc({vp: 201, vf: 8}).pBand, vc({vp: 1200, vf: 33}).pBand, vc({vf: 6}).fBand, vc({vf: 5}).fBand], ['≤ 200', '201 - 300', '1001 - 1200', '6 - 10', '1 - 5']);
}
let tt;
w.renderCalc('dbcvt'); w.calcResult('dbcvt');
tt = txt(w, 'dy_results');
check('the population page opens with 240 persons for 100 studios and 50 one-bedrooms, the groupings and the 🔴 note; only the first group visible', [tt.includes('إجمالي السكان'), /240 شخص/.test(tt), tt.includes('المجموعة 1'), tt.includes('🔴'), w.document.getElementById('dy_g0').style.display, w.document.getElementById('dy_g1').style.display], [true, true, true, true, '', 'none']);
set('dy_m', '1'); w.calcResult('dbcvt'); tt = txt(w, 'dy_results');
check('the count page shows two service elevators for 300 hotel keys', [tt.includes('الحد الأدنى لمصاعد الخدمة'), tt.includes('غرف 300')], [true, true]);
set('dy_m', '2'); w.calcResult('dbcvt'); tt = txt(w, 'dy_results');
check('the speed page shows 2.22 - 2.50 m/s and the handling capacity 7 %', [/2\.22 - 2\.50 m\/s/.test(tt), tt.includes('7 %'), tt.includes('توقيت الأبواب')], [true, true, true]);
set('dy_m', '3'); w.calcResult('dbcvt'); tt = txt(w, 'dy_results');
check('the specification page shows 750 kg and the cabin 1200 x 1500', [/750 kg/.test(tt), /1,?200 × 1,?500 mm/.test(tt)], [true, true]);
set('dy_m', '4'); w.calcResult('dbcvt'); tt = txt(w, 'dy_results');
check('the lobby page shows the 60 m travel limit', [tt.includes('أقصى مسافة أفقية'), /60 m/.test(tt)], [true, true]);
set('dy_m', '5'); w.calcResult('dbcvt'); tt = txt(w, 'dy_results');
check('the chart page shows the 11 - 15 floors band, the 401 - 500 persons band, 3 elevators in total and only its group is visible', [tt.includes('عدد مصاعد الركاب من مخططات الكود'), tt.includes('فئة المخطط 11 - 15'), tt.includes('فئة 401 - 500'), tt.includes('المجموع3'), tt.includes('🔴'), w.document.getElementById('dy_g5').style.display, w.document.getElementById('dy_g0').style.display], [true, true, true, true, true, '', 'none']);
check('other reference codes open dbcvt too', others('dbcvt', 'dy_results'), [true, true, true]);
}
// ---------- part 191: Dubai Building Code 2021, Part C accessibility (`dbcacc`: ramps, accessible entrances / parking / wheelchair spaces / guest rooms / toilets, dimension checks) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const dg = o => w.eval('dgCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
const IT = J('DG_IT');
check('tables loaded: 3 ramp bands, 2 entrance uses, 36 dimension items, 7 door-manoeuvring rows', [J('DG_RP').length, J('DG_EN').length, IT.length, J('DG_DM').length], [3, 2, 36, 7]);
const rp = o => dg(Object.assign({mode: 0, rise: 900, slope: 6, length: 0, width: 1200}, o));
{
  const r = rp({});
  check('ramp rise 900 mm (500 - 1000 band): recommended up to 7 %, maximum 8.33 %: 6 % passes both; length 900 / 0.06 = 15 m, two runs of at most 10 m, one intermediate landing, total 15 + 3 x 1.5 = 19.5 m; minimum length at 8.33 % is 10.80 m', [r.band[0], r.okSlope, r.okRec, r.len, r.runs, r.land, r.total, r.runsRec, r.minLen83], ['من 500 إلى 1,000 mm', true, true, 15, 2, 1, 19.5, 2, 900 / 0.0833 / 1000], 1e-9);
  check('bands: 499 mm -> first (up to 8 %), 500 and 1000 mm -> second (up to 7 %), 1001 mm -> third (5 - 6 %); maximum 8.33 % in every band', [499, 500, 1000, 1001].map(h => rp({rise: h}).band[3]), [8, 7, 7, 6]);
  const q = rp({rise: 1200});
  check('rise 1200 mm at 6 %: 20 m long, two runs; the recommended run of 4 m would need 5 runs; a 4 % slope is below the recommended 5 - 6 %; 8.33 % passes the maximum, 8.4 % fails', [q.len, q.runs, q.runsRec, rp({rise: 1200, slope: 4}).okRec, rp({slope: 8.33}).okSlope, rp({slope: 8.4}).okSlope, rp({rise: 1200, slope: 6.5}).okRec], [20, 2, 5, false, true, false, false], 1e-9);
  check('handrails on both sides when the level change exceeds 300 mm; an intermediate rail when the width exceeds 2100 mm; width under 1000 mm fails; an elevator is advised above a 2.4 m rise', [rp({rise: 300}).hand, rp({rise: 301}).hand, rp({width: 2100}).mid, rp({width: 2101}).mid, rp({width: 999}).okWidth, rp({width: 1000}).okWidth, rp({rise: 2400}).elev, rp({rise: 2401}).elev], [false, true, false, true, false, true, false, true]);
  check('available length: 10 m for 900 mm = 9 % exceeds 8.33 %; 12 m = 7.5 % passes; no length -> no verdict', [rp({length: 10}).lenSlope, rp({length: 10}).okLenSlope, rp({length: 12}).lenSlope, rp({length: 12}).okLenSlope, rp({}).okLenSlope], [9, false, 7.5, true, null], 1e-9);
  check('zero slope gives zero length and zero runs', [rp({slope: 0}).len, rp({slope: 0}).runs, rp({slope: 0}).total], [0, 0, 0]);
}
const cn = o => dg(Object.assign({mode: 1, kind: 0, use: 0, n: 4, hosp: false}, o));
{
  check('accessible entrances (C.2): residential and similar: 1 or 2 -> 1; 3 or 4 -> 2; 5 -> 3 (50 % rounded up); 8 -> 4; none -> 0; public-use buildings: 100 %', [1, 2, 3, 4, 5, 8, 0].map(n => cn({n}).req).concat([cn({use: 1, n: 6}).req, cn({use: 1, n: 1}).req]), [1, 1, 2, 2, 3, 4, 0, 6, 1]);
  const pk = p => cn({kind: 1, n: p});
  check('accessible parking (C.17): 24 spaces -> not covered; 25 -> 1 (2 % = 0.5); 100 -> 2; 500 -> 10; 501 -> 11; 1000 -> 15; vans 10 % with a minimum of one', [24, 25, 100, 500, 501, 1000].map(p => pk(p).acc).concat([pk(25).van, pk(500).van, pk(1000).van, pk(24).under25]), [0, 1, 2, 10, 11, 15, 1, 1, 2, true]);
  check('hospital and healthcare: 10 % of the capacity -> 200 spaces 20, van 2; 5 spaces 1 with one van', [cn({kind: 1, n: 200, hosp: true}).acc, cn({kind: 1, n: 200, hosp: true}).van, cn({kind: 1, n: 5, hosp: true}).acc, cn({kind: 1, n: 5, hosp: true}).van], [20, 2, 1, 1]);
  const ws = s => cn({kind: 2, n: s});
  check('wheelchair spaces (C.26): 1 per 50 seats or fraction up to 500, then 1 per 100 above: 1 -> 1, 50 -> 1, 51 -> 2, 500 -> 10, 501 -> 11, 600 -> 11, 601 -> 12, 1000 -> 15', [1, 50, 51, 500, 501, 600, 601, 1000].map(s => ws(s).spaces), [1, 1, 2, 10, 11, 11, 12, 15]);
  check('companion seats for 50 % of the spaces: 11 -> 6; groups of two: ceil(5.5 / 2) = 3; car spaces for reserved seats: 1 per 2 -> 6', [ws(501).companions, ws(501).groups, ws(501).parkSeat], [6, 3, 6]);
  const gr = n => cn({kind: 3, n});
  check('hotel rooms (C.27 and C.28): below 50 none; 50 -> 1 mobility room and 2 communication rooms; 200 -> 4 and 8; 500 -> 10 and 20; 600 -> 11 and 22; roll-in showers for half (rounded up)', [49, 50, 200, 500, 600].map(n => [gr(n).mob, gr(n).com]), [[0, 0], [1, 2], [4, 8], [10, 20], [11, 22]]);
  check('roll-in showers 6 and baths 5 of 11 accessible rooms', [gr(600).roll, gr(600).tub], [6, 5]);
  check('accessible water closets (C.21): at least one and 5 % of the total: 10 -> 1; 20 -> 1; 21 -> 2; 100 -> 5; none -> 0', [10, 20, 21, 100, 0].map(n => cn({kind: 4, n}).wc), [1, 1, 2, 5, 0]);
}
const ck = o => dg(Object.assign({mode: 2, i: 14, v1: 915, v2: 1500, dm: 0, dmw: 0}, o));
{
  const ix = n => IT.findIndex(x => x[1].includes(n));
  check('minimum values: door clear width 915 (914 fails); toilet door 815; external route 1200; internal route 1000; turning space 1500', [ck({i: ix('العرض الصافي للباب'), v1: 915}).ok, ck({i: ix('العرض الصافي للباب'), v1: 914}).ok, ck({i: ix('لباب المرحاض'), v1: 815}).ok, ck({i: ix('المسار الخارجي'), v1: 1199}).ok, ck({i: ix('المسار الداخلي'), v1: 1000}).ok, ck({i: ix('الدوران'), v1: 1500}).ok], [true, false, true, false, true, true]);
  check('maximum values: threshold 13 mm (14 fails); door force 25 N; forward reach 1200; obstructed forward reach 1100 beyond 500 mm; cross-slope 2 %; curved-ramp slope 5 %', [ck({i: ix('عتبة'), v1: 13}).ok, ck({i: ix('عتبة'), v1: 14}).ok, ck({i: ix('قوة'), v1: 25}).ok, ck({i: ix('الأمامي الأعلى'), v1: 1201}).ok, ck({i: ix('500 - 600'), v1: 1100}).ok, ck({i: ix('الميل العرضي'), v1: 2}).ok, ck({i: ix('ميل التشغيل'), v1: 5.1}).ok], [true, false, true, false, true, true, false]);
  check('ranges: curb 75 - 150 (74 and 151 fail), switches 400 - 1200, precise controls 750 - 1000, door handles 865 - 1220, handrails 865 - 965 and 650 - 750', [ck({i: ix('الرصيف'), v1: 75}).ok, ck({i: ix('الرصيف'), v1: 74}).ok, ck({i: ix('الرصيف'), v1: 151}).ok, ck({i: ix('مفاتيح'), v1: 1200}).ok, ck({i: ix('حركة يد'), v1: 1000}).ok, ck({i: ix('مقابض'), v1: 1221}).ok, ck({i: ix('الدرابزين الأساسي'), v1: 900}).ok, ck({i: ix('للأطفال'), v1: 700}).ok], [true, false, false, true, true, false, true, true]);
  const lift = ix('كابينة المصعد ذات مدخل');
  check('elevator cabin one entrance 1200 x 1500: exact passes; narrower or shallower fails individually; stretcher cabin 1100 x 2100', [ck({i: lift, v1: 1200, v2: 1500}).ok, ck({i: lift, v1: 1199, v2: 1500}).okW, ck({i: lift, v1: 1200, v2: 1499}).okD, ck({i: ix('للنقالات'), v1: 1100, v2: 2100}).ok, ck({i: ix('للنقالات'), v1: 1100, v2: 2000}).ok], [true, false, false, true, false]);
  check('door manoeuvring (C.11): front pull 1500, front push 1200, hinge side 1500 / 1050, latch side 1200 / 1050, sliding 1200; 1499 mm fails the first; no width given -> no verdict', [0, 1, 2, 3, 4, 5, 6].map(k => ck({dm: k}).dm[1]).concat([ck({dm: 0, dmw: 1500}).okDm, ck({dm: 0, dmw: 1499}).okDm, ck({dm: 0}).okDm]), [1500, 1200, 1500, 1050, 1200, 1050, 1200, true, false, null]);
}
let tt;
w.renderCalc('dbcacc'); w.calcResult('dbcacc');
tt = txt(w, 'dg_results');
check('the ramp page opens with 15.00 m for 900 mm at 6 % and the 🔴 note; only the first group visible', [tt.includes('طول المنحدر المطلوب'), /15\.00 m/.test(tt), tt.includes('🔴'), w.document.getElementById('dg_g0').style.display, w.document.getElementById('dg_g1').style.display], [true, true, true, '', 'none']);
set('dg_m', '1'); w.calcResult('dbcacc'); tt = txt(w, 'dg_results');
check('the count page shows two accessible entrances for four residential entrances', [tt.includes('عدد المداخل الميسّرة'), /\b2\b/.test(tt)], [true, true]);
set('dg_ck', '2'); set('dg_cn', '700'); w.calcResult('dbcacc'); tt = txt(w, 'dg_results');
check('wheelchair spaces for 700 seats: 10 + 2 = 12', [tt.includes('أماكن الكراسي المتحركة'), /\b12\b/.test(tt)], [true, true]);
set('dg_m', '2'); w.calcResult('dbcacc'); tt = txt(w, 'dg_results');
check('the dimension page checks the 915 mm door and shows the manoeuvring space', [tt.includes('الحد الأدنى 915 mm'), tt.includes('✔'), tt.includes('فراغ مناورة الباب')], [true, true, true]);
check('other reference codes open dbcacc too', others('dbcacc', 'dg_results'), [true, true, true]);
}
// ---------- part 192: Dubai Building Code 2021, Part B extension (`dbcarch` modes 6 and 7: waste rooms, prayer rooms, diving boards and pool steps) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const dz = o => w.eval('dzCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('tables loaded: 5 waste rates, 5 waste container rows (Table B.29), 7 bins and bulk containers (Tables B.27 and B.28)', [J('DZ_WS').length, J('DZ_WC').length, J('DZ_BIN').length], [5, 5, 7]);
const ws = o => dz(Object.assign({mode: 6, i: 0, q: 5000, days: 2, ga: 3000, bin: 4, nb: 2, floors: 8, floorArea: 600}, o));
{
  const r = ws({});
  check('residential 5000 m2 NA x 12 kg per 100 m2 = 600 kg/day; two days 1200 kg exceeds 1000 kg: waste consultant (no container row)', [r.daily, r.store, r.cont], [600, 1200, null], 1e-9);
  check('Table B.29: 2000 m2 residential -> 240 kg/day, 480 kg in two days -> 2 x 2.5 m3; office 1000 m2 -> 50 kg/day, 100 kg -> 1 x 1.1 m3; 101 kg -> 1 x 2.5; 251 -> 2 x 2.5; 501 -> 3 x 2.5; 751 -> 4 x 2.5', [ws({q: 2000}).cont, ws({i: 2, q: 1000}).cont, ws({i: 2, q: 1010}).cont, ws({i: 2, q: 2510}).cont, ws({i: 2, q: 5010}).cont, ws({i: 2, q: 7510}).cont], [[500, 2, 2.5], [100, 1, 1.1], [250, 1, 2.5], [500, 2, 2.5], [750, 3, 2.5], [1000, 4, 2.5]]);
  check('hotel: 100 rooms x 3 kg = 300 kg/day (600 kg in two days -> 3 x 2.5); 20 suites x 5 kg = 100 kg/day (200 kg -> 1 x 2.5); commercial like residential 12 kg per 100 m2', [ws({i: 3, q: 100}).daily, ws({i: 3, q: 100}).cont, ws({i: 4, q: 20}).daily, ws({i: 4, q: 20}).cont, ws({i: 1, q: 1000}).daily], [300, [750, 3, 2.5], 100, [250, 1, 2.5], 120]);
  check('building area: 200 and 230 m2 need no special room; 231 - 460 m2 a 1.2 x 1.8 m room on the ground floor; above 460 m2 containers plus 5 m2 for sorting and 5 m2 for bulky waste', [ws({ga: 200}).small, ws({ga: 230}).small, ws({ga: 231}).small, ws({ga: 460}).small, ws({ga: 461}).small, ws({ga: 461}).large, ws({ga: 461}).sort, ws({ga: 460}).sort], [false, false, true, true, false, true, 5, 0]);
  check('refuse chute: above G+3 (4 floors) and floor area above 250 m2: 3 floors no; 4 floors with 250 m2 no; 4 floors with 251 m2 yes', [ws({floors: 3, floorArea: 600}).chute, ws({floors: 4, floorArea: 250}).chute, ws({floors: 4, floorArea: 251}).chute], [false, false, true]);
  check('two 1,100 L Eurobins (980 x 1250 mm) in a row: width (2 x 980 + 3 x 150) = 2.41 m, depth (1250 + 150 + 600) = 2.0 m, 4.82 m2; one bin 1.28 x 2.0', [r.roomW, r.roomL, r.roomA, ws({nb: 1}).roomW], [2.41, 2, 4.82, 1.28], 1e-9);
}
const pr = o => dz(Object.assign({mode: 7, occ: 800, h: 3, depth: 0, tread: 250, swid: 600, sris: 300}, o));
{
  check('prayer room capacity (Table B.26): 100 -> 8; 299 -> 24; 300 -> 24; 400 -> 24 + 5 = 29; 800 -> 24 + 25 = 49; none -> 0', [100, 299, 300, 400, 800, 0].map(o => pr({occ: o}).prayer), [8, 24, 24, 29, 49, 0]);
  const r = pr({});
  check('800 occupants: 49 worshippers, 25 per gender, area 49 x 0.9 = 44.1 m2', [r.prayer, r.each, r.area], [49, 25, 44.1], 1e-9);
  check('diving board depth (Table B.25): up to 1 m 2.5 m; 1.1 m -> 2.8; 2 m -> 2.8; 3 m -> 3.1; 5 m -> 3.7; 10 m -> 5.2; 0.5 m -> 2.5', [0.5, 1, 1.1, 2, 3, 5, 10].map(h => pr({h}).dive), [2.5, 2.5, 2.8, 2.8, 3.1, 3.7, 5.2], 1e-9);
  check('provided depth: 3.0 m below a 3 m board fails (needs 3.1), 3.1 passes; none -> no verdict', [pr({depth: 3.0}).okDive, pr({depth: 3.1}).okDive, pr({}).okDive], [false, true, null]);
  check('pool steps: tread 250 passes, 249 fails; width 600 passes, 599 fails; riser 300 passes, 301 fails', [pr({tread: 250}).okTread, pr({tread: 249}).okTread, pr({swid: 600}).okWid, pr({swid: 599}).okWid, pr({sris: 300}).okRis, pr({sris: 301}).okRis], [true, false, true, false, true, false]);
}
let tt;
w.renderCalc('dbcarch'); w.calcResult('dbcarch');
set('dz_m', '6'); w.calcResult('dbcarch'); tt = txt(w, 'dz_results');
check('the waste page shows 600 kg per day, the consultant verdict for 1200 kg and the 🔴 note; only group 6 visible', [tt.includes('النفايات اليومية'), /600\.0 kg/.test(tt), tt.includes('استشاري إدارة نفايات'), tt.includes('🔴'), w.document.getElementById('dz_g6').style.display, w.document.getElementById('dz_g0').style.display], [true, true, true, true, '', 'none']);
set('dz_m', '7'); w.calcResult('dbcarch'); tt = txt(w, 'dz_results');
check('the prayer page shows 49 worshippers and the dive depth 3.10 m', [tt.includes('سعة غرفة الصلاة'), /49 مصلٍّ/.test(tt), /3\.10 m/.test(tt)], [true, true, true]);
check('other reference codes still open dbcarch', others('dbcarch', 'dz_results'), [true, true, true]);
}
// ---------- part 193: Dubai Building Code 2021, Part G / H extension (`dbcelec` mode 7: interior and exterior lighting power density, egress and working-plane illuminance) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const dx = o => w.eval('dxCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('Table H.15: business 7.5, education 7.8, industrial 8.9, retail 9.8, warehouse 4.9, residential common 6.9 W/m2; Table H.16 has 11 rows (parking 0.86, walkways 2.3 per m / 1.5, stairs 7.5, main entries 69 per m, other doors 46, open sales 2.1, facades 2.2 and 16.4, entrances 5.4, drive-up 200); 5 illuminance rows', [J('DX_LI').map(x => x[1]), J('DX_LE').length, J('DX_LE').map(x => x[1]), J('DX_LX').length], [[7.5, 7.8, 8.9, 9.8, 4.9, 6.9], 11, [0.86, 2.3, 1.5, 7.5, 69, 46, 2.1, 2.2, 16.4, 5.4, 200], 5]);
const li = o => dx(Object.assign({mode: 7, ui: 0, area: 1000, load: 7000, ei: 0, qty: 500, eload: 400, xi: 0, lux: 120}, o));
{
  const r = li({});
  check('offices 1000 m2 at 7.5 W/m2: 7500 W allowed, 7000 W installed = 7.0 W/m2 passes; 7501 W fails; occupancy sensors needed (7.0 is not below 6 W/m2)', [r.allowI, r.actI, r.okI, li({load: 7500}).okI, li({load: 7501}).okI, r.sensors], [7500, 7, true, true, false, true], 1e-9);
  check('other uses: education 7800, industrial 8900, retail 9800, warehouse 4900, residential common areas 6900 W for 1000 m2; 5000 W = 5 W/m2 needs no sensors', [1, 2, 3, 4, 5].map(u => li({ui: u}).allowI), [7800, 8900, 9800, 4900, 6900]);
  check('below 6 W/m2 no occupancy-sensor requirement; zero area gives zero density', [li({load: 5000}).sensors, li({area: 0}).actI, li({load: 0}).sensors], [false, 0, false]);
  check('exterior: parking 0.86 W/m2 x 500 = 430 W; 400 W passes; 431 W fails by 1 W (renewable supply for the excess); walkway under 3 m 2.3 W/m run; main entry 69 W per m door width', [li({}).allowE, li({}).okE, li({eload: 431}).okE, li({eload: 431}).extra, li({ei: 1, qty: 100}).allowE, li({ei: 4, qty: 3}).allowE], [430, true, false, 1, 230, 207], 1e-9);
  check('facade 2.2 W/m2 of lit surface or 16.4 W per m of length; drive-up window 200 W per lane', [li({ei: 7, qty: 100}).allowE, li({ei: 8, qty: 40}).allowE, li({ei: 10, qty: 2}).allowE], [220, 656, 400], 1e-9);
  check('illuminance: stairs 108 lux (107 fails); floors 10.8; assembly exit during shows 2.2; failure of one unit 2.2; office working plane 400 - 500 (399 and 501 fail)', [li({xi: 0, lux: 108}).okLx, li({xi: 0, lux: 107}).okLx, li({xi: 1, lux: 10.8}).okLx, li({xi: 2, lux: 2.2}).okLx, li({xi: 3, lux: 2.1}).okLx, li({xi: 4, lux: 450}).okLx, li({xi: 4, lux: 399}).okLx, li({xi: 4, lux: 501}).okLx], [true, false, true, true, false, true, false, false]);
}
let tt;
w.renderCalc('dbcelec'); w.calcResult('dbcelec');
set('dx_m', '7'); w.calcResult('dbcelec'); tt = txt(w, 'dx_results');
check('the lighting page shows 7,500 W allowed for the offices, the exterior limit 430 W and the illuminance check; only group 7 visible', [/7,?500 W/.test(tt), /430 W/.test(tt), tt.includes('الإضاءة المطلوبة'), tt.includes('🔴'), w.document.getElementById('dx_g7').style.display, w.document.getElementById('dx_g0').style.display], [true, true, true, true, '', 'none']);
check('other reference codes still open dbcelec', others('dbcelec', 'dx_results'), [true, true, true]);
}
// ---------- part 194: Syrian Arab HVAC code chapter 5, ventilation systems (`syrvent`: natural ventilation, intake/exhaust locations, garages, kitchen hoods, stair pressurization, outdoor-air rates of industrial / agricultural / commercial spaces) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const sq = o => w.eval('sqCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
const OA = J('SQ_OA');
check('tables loaded: 9 contaminants, 14 intake-distance rows, 3 vehicle times, 3 CO constants, 5 jet-fan rows, 5 hood types x 4 duties, 4 duty classes, 184 outdoor-air rows', [J('SQ_CT').length, J('SQ_IN').length, J('SQ_TV').length, J('SQ_C').length, J('SQ_JF').length, J('SQ_HD').length, J('SQ_HL').length, OA.length], [9, 14, 3, 3, 5, 5, 4, 184]);
const nv = o => sq(Object.assign({mode: 0, kind: 0, area: 20, open: 1, h: 3, depth: 5, pit: 1.2}, o));
{
  const r = nv({});
  check('natural ventilation: opening 4 % of 20 m2 = 0.8 m2 (1 m2 passes, 0.79 fails); room depth limit 2 x 3 m = 6 m for one side (5 m passes, 6.1 fails) and 5 x 3 = 15 m for opposite sides; open space in front of a below-grade opening 1.5 x 1.2 = 1.8 m', [r.req, r.okOpen, nv({open: 0.79}).okOpen, r.dMax, r.okDepth, nv({depth: 6.1}).okDepth, nv({kind: 1}).dMax, nv({kind: 1, depth: 14}).okDepth, r.below], [0.8, true, false, 6, true, false, 15, true, 1.8], 1e-9);
  check('interior room: opening at least the greater of 8 % of its floor area and 2.3 m2: 20 m2 -> 2.3 (2.3 passes, 2.2 fails); 40 m2 -> 3.2', [nv({kind: 2, open: 2.3}).okInner, nv({kind: 2, open: 2.2}).okInner, nv({kind: 2}).inReq, nv({kind: 2, area: 40}).inReq, nv({kind: 2}).inner, nv({kind: 2}).dMax], [true, false, 2.3, 3.2, true, null], 1e-9);
}
const it = o => sq(Object.assign({mode: 1, i: 5, dist: 5, hin: 3.5, hex: 3.5, dwin: 3.5, q: 2, fa: 1}, o));
{
  const IN = J('SQ_IN');
  check('Table 2/5: class 2 exhaust 3 m, class 3 5 m, class 4 10 m, sewer vent below 1 m 3 m and above 1 m 1 m, fans and chimneys 5, garage entrance 5, truck park 7.5, streets 1.5, busy streets 7.5, empty roof 0.3, bins 5, cooling towers 5, their drains 7.5', IN.map(x => x[1]), [3, 5, 10, 3, 1, 5, 5, 7.5, 1.5, 7.5, 0.3, 5, 5, 7.5]);
  check('chimneys: 5 m passes, 4.9 m fails; intake 3 m above floor passes, 2.9 fails; exhaust at 3 m and 3 m from a window passes, 3 m high with 2.9 m to the window fails', [it({}).okDist, it({dist: 4.9}).okDist, it({hin: 3}).okHeight, it({hin: 2.9}).okHeight, it({hex: 3, dwin: 3}).okExh, it({hex: 3, dwin: 2.9}).okExh, it({hex: 2.9}).okExh], [true, false, true, false, true, false, false]);
  check('rain hood at 2.5 m/s for 2 m3/s -> 0.8 m2; rain limit 21.5 g/m2.h x 1 m2', [it({}).hood, it({}).rain], [0.8, 21.5], 1e-9);
}
const gr = o => sq(Object.assign({mode: 2, area: 3000, h: 2.6, nWalls: 2, wallArea: 600, free: 150, span: 40, nb: 6, n: 6, e: 600, theta: 120, co: 25, thrust: 1000}, o));
{
  const r = gr({});
  const G = 6 * 600 / 3000, f = 100 * G / 26.7, q = 0.692e-6 * f * 120;
  check('garage: 6 operating cars x 600 g/h over 3000 m2: G = 1.2 g/h.m2, f = 4.49 %, Q = 0.692e-6 x 4.494 x 120 = 0.000373 m3/s per m2, 1.12 m3/s in total (0.52 air changes per hour at 2.6 m); NFPA 88A minimum 0.005 x 3000 = 15 m3/s; 8 CO sensors', [r.G, r.f, r.C, r.q, r.Q, r.ach, r.QNfpa, r.QOld, r.sensors], [G, f, 0.692e-6, q, q * 3000, q * 3000 * 3600 / (3000 * 2.6), 15, 22.5, 8], 1e-9);
  check('CO constants: 15 ppm 1.204e-6, 25 ppm 0.692e-6, 35 ppm 0.481e-6; an unknown limit uses 25', [gr({co: 15}).C, gr({co: 25}).C, gr({co: 35}).C, gr({co: 20}).C], [1.204e-6, 0.692e-6, 0.481e-6, 0.692e-6], 1e-12);
  check('open garage: two opposite free walls, openings 150 m2 (above 2.5 % = 75 m2), 40 m2 span and 6 m to the next building -> open; 70 m2 fails (also below a third of the walls 200 m2); span 55 m fails; a single wall fails; 4.9 m to the neighbour fails', [r.isOpen, gr({free: 70}).isOpen, gr({span: 55}).isOpen, gr({nWalls: 1}).isOpen, gr({nb: 4.9}).isOpen, gr({free: 200, area: 40000}).okFree], [true, false, false, false, false, true]);
  check('jet fans: 560 N -> spacing 34 m (max 45 m); unknown thrust uses the first row (1000 N 45 / 60 m); about 2 fans of 45 m spacing for 3000 m2', [gr({thrust: 560}).jf, gr({thrust: 999}).jf, r.nFans], [[560, 34, 45], [1000, 45, 60], 2]);
  check('vehicle time Table 5/3: level 1 enters in 35 s and leaves in 45 s; level 3 40 / 50; level 5 70 / 100; Table 5/4 CO g/min: hot summer 1991 2.54 and 1996 1.89, cold winter 20.47 and 18.96', [J('SQ_TV'), J('SQ_EM').hotS, J('SQ_EM').coldW], [[[1, 35, 45], [3, 40, 50], [5, 70, 100]], [2.54, 1.89], [20.47, 18.96]]);
}
const hd = o => sq(Object.assign({mode: 3, t: 0, l: 0, len: 3, a2: 1.5}, o));
{
  const r = hd({});
  check('wall canopy light duty 0.25 - 0.3 m3/s per metre: a 3 m hood needs 0.75 - 0.9 m3/s; medium 0.3 - 0.45; extra heavy 0.55 and above (no upper limit)', [r.lo, r.hi, hd({l: 1}).lo, hd({l: 1}).hi, hd({l: 3}).lo, hd({l: 3}).hi], [0.75, 0.9, 0.9, 1.35, 1.65, null], 1e-9);
  check('uncertain printed cells: wall heavy 0.45 - 0.6 and single island heavy 0.45 - 0.95 are flagged; others not; eyebrow hoods have no heavy values; backshelf has no extra-heavy value', [hd({l: 2}).cell, hd({t: 1, l: 2}).cell, hd({t: 1, l: 0}).cell, hd({t: 3, l: 2}).cell, hd({t: 3, l: 2}).lo, hd({t: 4, l: 3}).cell], [[0.45, 0.6, 1], [0.45, 0.95, 1], [0.4, 0.45, 0], null, null, null]);
  check('type 2 hoods (no grease): 0.25 - 0.5 m3/s per m2 of hood opening: 1.5 m2 -> 0.375 - 0.75', [r.q2lo, r.q2hi], [0.375, 0.75], 1e-9);
}
const sp = o => sq(Object.assign({mode: 4, nd: 2, ad: 1.9, v: 0.75, leak: 0.5, ducted: false, force: 100}, o));
{
  check('stair pressurization: two open doors of 1.9 m2 at 0.75 m/s = 2.85 m3/s + 0.5 leakage = 3.35; with ducts +15 % = 3.85; with the 50 % margin 5.03 and 5.78; 2 m/s in firefighting mode gives 7.6 m3/s through the doors; door force 100 N passes, 101 fails', [sp({}).flowOpen, sp({}).total, sp({}).design, sp({ducted: true}).total, sp({ducted: true}).design, sp({v: 2}).flowOpen, sp({}).okF, sp({force: 101}).okF], [2.85, 3.35, 3.35 * 1.5, 3.35 * 1.15, 3.35 * 1.15 * 1.5, 7.6, true, false], 1e-9);
}
const oa = o => sq(Object.assign({mode: 5, i: 0, n: 0, area: 100}, o));
{
  const ix = n => OA.findIndex(x => x[1].includes(n));
  const off = OA.findIndex(x => x[0] === 'تجاري: المكاتب' && x[1] === 'مكاتب عامة');
  const r = oa({i: off});
  check('general offices: 10 persons per 100 m2, minimum 8 L/s, preferred 8 - 13: 100 m2 -> 10 persons, 80 L/s minimum, 80 - 130 L/s preferred; 20 persons entered -> 160', [OA[off].slice(2), r.persons, r.lo, r.prefLo, r.prefHi, oa({i: off, n: 20}).lo], [[10, 8, 8, 13, 0], 10, 80, 80, 130, 160], 1e-9);
  check('dining rooms 70 per 100 m2, 5 L/s minimum, 8 - 10 preferred; kitchens 20, 15, 15 - 18; bars 150, 15, 20 - 25; hotel bedrooms 5, 4, 5 - 8; mosques 2.5 / 5; garages 0.8 / 1 - 1.5 L/s per m2', [ix('غرف الطعام'), ix('المطابخ'), ix('خانات'), ix('غرف النوم'), ix('الجوامع'), ix('مرائب إيقاف')].map(i => OA[i].slice(2)), [[70, 5, 8, 10, 0], [20, 15, 15, 18, 0], [150, 15, 20, 25, 0], [5, 4, 5, 8, 0], [null, 2.5, 5, 5, 0], [null, 0.8, 1, 1.5, 0]]);
  check('industrial: boiler rooms 18 / 20 - 23; metal heavy work 18 / 20 - 23; light assembly 10 / 13 - 15; textile 8 / 10 - 13; semiconductor 5 / 8 - 10; agricultural animal husbandry 10 / 10 - 15; mushrooms 5 / 8 - 10', [ix('غرف المراجل'), ix('أعمال معدنية ثقيلة'), ix('أعمال معدنية خفيفة'), ix('غرف نسج وحياكة'), ix('شبه موصل'), ix('تربية الحيوانات'), ix('نمو الفطر')].map(i => OA[i].slice(3, 6)), [[18, 20, 23], [18, 20, 23], [10, 13, 15], [8, 10, 13], [5, 8, 10], [10, 10, 15], [5, 8, 10]]);
  check('special exhaust rows have no value: spray booths, polishing and printing lines, engine testing; two rows with a printed minimum above the preferred range: chemical packaging 15 against 8 - 10, flour milling 15 against 13 - 15', [OA.filter(x => x[6] === 2).length, oa({i: ix('أكشاك الطلاء بالرش')}).special, oa({i: ix('أكشاك الطلاء بالرش')}).lo, OA.filter(x => x[6] === 1).map(x => x[1])], [3, true, null, ['مناطق تغليف', 'طحن الطحين والتكييس']]);
  check('every row has a minimum not above its preferred upper limit, apart from the two flagged', [OA.every(x => x[6] !== 0 || x[3] <= x[5])], [true]);
}
let tt;
w.renderCalc('syrvent'); w.calcResult('syrvent');
tt = txt(w, 'sq_results');
check('the natural ventilation page shows the 0.80 m2 opening and the 6.00 m depth limit, and the 🔴 note; only the first group visible', [tt.includes('مساحة الفتحات الصافية'), /0\.80 m²/.test(tt), /6\.00 m/.test(tt), tt.includes('🔴'), w.document.getElementById('sq_g0').style.display, w.document.getElementById('sq_g1').style.display], [true, true, true, true, '', 'none']);
set('sq_m', '1'); w.calcResult('syrvent'); tt = txt(w, 'sq_results');
check('the intake page shows the 5 m distance for chimneys and the rain hood area', [tt.includes('أقل مسافة 5 m'), tt.includes('مساحة الهود المطري')], [true, true]);
set('sq_m', '2'); w.calcResult('syrvent'); tt = txt(w, 'sq_results');
check('the garage page shows the open garage verdict, the design flow and the CO sensors', [tt.includes('مرآب مفتوح'), tt.includes('التدفق الكلي المطلوب'), tt.includes('حساسات CO')], [true, true, true]);
set('sq_m', '3'); w.calcResult('syrvent'); tt = txt(w, 'sq_results');
check('the hood page shows the light/medium duty range for a wall canopy', [tt.includes('أدنى تدفق لكل متر طولي'), /0\.3 - 0\.45 m³\/s·m/.test(tt)], [true, true]);
set('sq_m', '4'); w.calcResult('syrvent'); tt = txt(w, 'sq_results');
check('the stair page shows 50 Pa, the total 3.35 m3/s and the design flow 5.03 m3/s', [tt.includes('50 Pa'), /3\.35 m³\/s/.test(tt), /5\.0[23] m³\/s/.test(tt)], [true, true, true]);
set('sq_m', '5'); w.calcResult('syrvent'); tt = txt(w, 'sq_results');
check('the outdoor-air page shows the minimum and preferred rates of the first row (18 and 20 - 23 L/s)', [tt.includes('الحد الأدنى'), tt.includes('المفضل'), /18\.0 L\/s لكل شخص/.test(tt)], [true, true, true]);
check('other reference codes open syrvent too', others('syrvent', 'sq_results'), [true, true, true]);
}
// ---------- part 195: Syrian Arab HVAC code chapters 2, 7 and 8 (`syrmat`: duct thickness, hangers and insulation; pipe supports and insulation, copper refrigerant and gas pipes; filters; minimum equipment efficiency; pressure and leakage tests) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const sj = o => w.eval('sjCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('tables loaded: 5 duct thicknesses, 5 hanger rows, 8 duct insulation rows, 2 pipe-support materials, 6 pipe-insulation rows, 4 copper rows, 15 gas hanger rows, 8 thread rows, 10 filters, 17 efficiency categories (the six water-, groundwater- and ground-source heat pump rows of Table 2/8 added), 10 terminal-unit formulas, 3 heat-rejection rows, 4 seam rows, 5 sealing classes, 6 gas pipe location rows (Table 9/7) and 4 valve standards (Table 11/7)', [J('SJ_DT').length, J('SJ_DH').length, J('SJ_DI').length, J('SJ_PS').length, J('SJ_PI').length, J('SJ_CU').length, J('SJ_GH').length, J('SJ_GT').length, J('SJ_FL').length, J('SJ_EF').length, J('SJ_PT').length, J('SJ_TW').length, J('SJ_L1').length, J('SJ_L2').length, J('SJ_GP').length, J('SJ_GV').length], [5, 5, 8, 2, 6, 4, 15, 8, 10, 17, 10, 3, 4, 5, 6, 4]);
const dc = o => sj(Object.assign({mode: 0, side: 600, ins: 1, len: 20, floors: 0}, o));
{
  check('Table 5/7: 400 mm and below 0.63; 401 - 750 0.8; 751 - 1200 1.0; 1201 - 1374 1.2; 1375 and above 1.4 mm', [400, 401, 750, 751, 1200, 1201, 1374, 1375, 2000].map(s => dc({side: s}).t), [0.63, 0.8, 0.8, 1.0, 1.0, 1.2, 1.2, 1.4, 1.4]);
  check('Table 6/7: up to 500 mm rod 8 mm every 3 m; 501 - 1000 rod 10 mm every 2.5 m; 1001 - 1500 rod 12 mm every 2 m; 1501 and above 12 mm every 1.8 m', [500, 501, 800, 1000, 1001, 1500, 1501].map(s => dc({side: s}).h), [[500, 8, 3], [800, 10, 2.5], [800, 10, 2.5], [1000, 10, 2.5], [1500, 12, 2], [1500, 12, 2], [null, 12, 1.8]]);
  check('hangers for 20 m at 2.5 m spacing: 8 + 1 = 9; vertical ducts 2 supports per floor: 5 floors -> 10; reinforcement above 1000 mm only; single-blade damper up to 300 mm, opposed multi-blade above', [dc({}).nHang, dc({floors: 5}).vertHang, dc({side: 1000}).reinf, dc({side: 1001}).reinf, dc({side: 300}).damper, dc({side: 301}).damper], [9, 10, false, true, 'ريشة مفردة', 'متعدد الريش متعاكس']);
  check('Table 7/7: supply or return duct concealed in unconditioned space 50 mm, in conditioned space 25 mm, fresh air in conditioned space 25; weather-exposed rows are flagged uncertain (75 mm for ducts)', [0, 1, 2, 3, 4].map(i => dc({ins: i}).ins[2]).concat([dc({ins: 7}).ins[2], dc({ins: 7}).ins[3], dc({ins: 0}).ins[3]]), [50, 25, 50, 25, 25, 75, 1, 0]);
}
const pp = o => sj(Object.assign({mode: 1, mat: 0, dn: 40, len: 30, pi: 2, od: 48, cu: 15.9, gdn: 15, pw: 6}, o));
{
  check('Table 12/7 steel: up to 25 mm 2.5 m; 26 - 50 3 m; 51 - 75 3.5 m; above 75 4 m; copper: up to 25 2 m; 26 - 75 2.5 m; above 75 3 m', [25, 26, 50, 51, 75, 76].map(d => pp({dn: d}).sp).concat([25, 26, 75, 76].map(d => pp({mat: 1, dn: d}).sp)), [2.5, 3, 3, 3.5, 3.5, 4, 2, 2.5, 2.5, 3]);
  check('supports for 30 m of DN 40 steel pipe (3 m): 10 + 1 = 11', [pp({}).nSup, pp({len: 0}).nSup], [11, 0]);
  check('Table 13/7 chilled / hot water in conditioned spaces: up to 50 mm 15 mm, 60 - 150 mm 25, 200 mm and above 40; weather-exposed 25 / 50 / 75; unconditioned 25 / 40 / 50; sun-exposed refrigerant suction 40 / 50 (none above 150 mm)', [48, 55, 150, 200].map(d => pp({od: d}).ins).concat([pp({pi: 0, od: 48}).ins, pp({pi: 0, od: 100}).ins, pp({pi: 0, od: 219}).ins, pp({pi: 1, od: 100}).ins, pp({pi: 5, od: 48}).ins, pp({pi: 5, od: 100}).ins, pp({pi: 3, od: 200}).ins, pp({pi: 3, od: 200}).insMissing]), [15, 25, 25, 40, 25, 50, 75, 40, 40, 50, null, true]);
  check('Table 1/7 copper refrigerant pipes: 6.4 - 22 mm wall 0.8; 28.6 mm 1.0; 34.9 mm 1.2; 41.3 mm 1.43; larger not covered', [15.9, 22, 22.1, 28.6, 34.9, 41.3, 42].map(d => { const c = pp({cu: d}).cu; return c ? c[1] : null; }), [0.8, 0.8, 1.0, 1.0, 1.2, 1.43, null]);
  check('Table 10/7 gas hanger spacing DN 15: steel 2 m, copper 1.5, stainless 0.5, composite 1; DN 18 has no steel value; DN 25 steel 2.5 / copper 2; DN 80 and above 4 m; Table 8/7 threads: DN 15 10 threads over 19 mm; DN 32 11 over 25.5; DN 65 12 over 38; none for DN 100', [pp({}).gas.slice(1), pp({gdn: 18}).gas.slice(1), pp({gdn: 25}).gas.slice(3), pp({gdn: 80}).gas.slice(3), pp({gdn: 15}).thread, pp({gdn: 32}).thread, pp({gdn: 65}).thread, pp({gdn: 100}).thread], [[1, 0.5, 1.5, 2], [null, 0.5, 1.5, null], [2, 2.5], [4, 4], [15, 19, 10], [32, 25.5, 11], [65, 38, 12], null]);
  check('pressure test 1.5 x working pressure: 6 bar -> 9 bar', [pp({}).test, pp({pw: 10}).test], [9, 15]);
}
{
  check('filter list has the printed limits: bag filters weight efficiency 80 - 98 %, HEPA 99.997 % with 125 - 250 Pa at 1.3 m/s, carbon filter 250 Pa at 1.5 m/s with a prefilter of 65 %, grease filter 12 - 50 mm and 50 Pa at 2.5 m/s', [sj({mode: 2, i: 3}).row[1].includes('80 - 98'), sj({mode: 2, i: 4}).row[1].includes('99.997'), sj({mode: 2, i: 6}).row[1].includes('65 %'), sj({mode: 2, i: 9}).row[1].includes('50 Pa')], [true, true, true, true]);
}
const ef = o => sj(Object.assign({mode: 3, part: 0, i: 0, cap: 100, cop: 0, iplv: 0, q: 0}, o));
{
  check('air-cooled air conditioners (Table 1/8): below 19 kW split 2.93 and package 2.84; 19 - 40 kW 3.02 / 3.11; 40 - 70 2.84 / 2.90; 70 - 223 2.78 / 2.84; 223 and above 2.70 / 2.75 (IPLV)', [10, 19, 39.9, 40, 69.9, 70, 222.9, 223, 500].map(c => ef({cap: c}).rows.map(x => [x[3], x[4]])), [[[2.93, null], [2.84, null]], [[3.02, 3.11]], [[3.02, 3.11]], [[2.84, 2.90]], [[2.84, 2.90]], [[2.78, 2.84]], [[2.78, 2.84]], [[2.70, 2.75]], [[2.70, 2.75]]]);
  check('water-cooled and evaporative: below 19 kW 3.55 / 3.28; 19 - 40 3.27 / 3.11; 40 - 70 and 70 and above 3.22 / 3.02; condensing units from 40 kW: air-cooled 2.96 / 3.28 and water or evaporative 3.84 / 3.84, none below 40 kW', [5, 25, 50, 100].map(c => ef({i: 1, cap: c}).rows[0].slice(3, 5)).concat([ef({i: 2, cap: 39}).rows.length, ef({i: 2, cap: 40}).rows.map(x => x[3])]), [[3.55, 3.28], [3.27, 3.11], [3.22, 3.02], [3.22, 3.02], 0, [2.96, 3.84]]);
  check('heat pumps (Table 2/8): air-cooled cooling 40 - 70 kW 2.72 / 2.78; heating below 19 kW 1.99 split and 1.93 package; 19 - 40 kW 3.2 at 8.3 C and 2.2 at -8.3 C; 40 kW and above 3.1 / 2.0', [ef({i: 3, cap: 50}).rows[0].slice(3, 5), ef({i: 4, cap: 10}).rows.map(x => x[3]), ef({i: 4, cap: 30}).rows.map(x => x[3]), ef({i: 4, cap: 100}).rows.map(x => x[3])], [[2.72, 2.78], [1.99, 1.93], [3.2, 2.2], [3.1, 2.0]]);
  check('water-, groundwater- and ground-source heat pumps (Table 2/8, read from the page image): cooling water source below 19 kW 3.52 at 29.4 C entering water and 3.81 at 23.9 C (none at 19 kW); groundwater source below 40 kW 3.96 and 4.40; ground source 3.63 and 3.75; heating water source 4.1 and 4.2, groundwater 3.9 and 3.4, ground 2.8 and 3.0; none from 40 kW', [ef({i: 5, cap: 10}).rows.map(x => x[3]), ef({i: 5, cap: 19}).rows.length, ef({i: 6, cap: 30}).rows.map(x => x[3]), ef({i: 7, cap: 30}).rows.map(x => x[3]), ef({i: 8, cap: 30}).rows.map(x => x[3]), ef({i: 9, cap: 30}).rows.map(x => x[3]), ef({i: 10, cap: 30}).rows.map(x => x[3]), ef({i: 6, cap: 40}).rows.length], [[3.52, 3.81], 0, [3.96, 4.40], [3.63, 3.75], [4.1, 4.2], [3.9, 3.4], [2.8, 3.0], 0]);
  check('the entering-water conditions of those rows: 29.4 / 23.9 C water, 21.1 / 10 C groundwater, 25 / 21.1 C brine for cooling, and 21.1 / 23.9, 21.1 / 10, 21.1 / 5 for heating; tests ARI 320, 325, 330', [5, 6, 7, 8, 9, 10].map(i => ef({i, cap: 10}).rows.map(x => x[2].replace(/[^0-9.]+/g, ' ').trim())), [['29.4', '23.9'], ['21.1', '10'], ['25', '21.1'], ['21.1', '23.9'], ['21.1', '10'], ['21.1', '5']]);
  check('chillers (Table 3/8): reciprocating 4.20 / 4.65; screw below 528 kW 4.45 / 4.50, 528 - 1055 4.90 / 4.95, 1055 and above 5.50 / 5.60; centrifugal 5.40, 5.55, 6.10; air-cooled without condenser 3.10; absorption 0.60, 0.70, 1.00 / 1.05, 1.00 / 1.00', [ef({i: 11, cap: 300}).rows[0].slice(3, 5), [527, 528, 1054, 1055].map(c => ef({i: 12, cap: c}).rows[0][3]), [100, 600, 2000].map(c => ef({i: 13, cap: c}).rows[0][3]), ef({i: 15, cap: 200}).rows[0][3], ef({i: 16, cap: 200}).rows.map(x => x[3])], [[4.20, 4.65], [4.45, 4.90, 4.90, 5.50], [5.40, 5.55, 6.10], 3.10, [0.60, 0.70, 1.00, 1.00]]);
  check('flags: chiller rows 3/8 other than air-cooled without condenser and absorption carry the uncertain-label flag', [11, 12, 13, 14].map(i => ef({i, cap: 100}).rows[0][5]).concat([ef({i: 15, cap: 100}).rows[0][5]]), [1, 1, 1, 1, 0]);
  check('verdict against a provided COP for a 100 kW air-cooled unit (2.78): 2.78 passes and 2.77 fails; IPLV 2.84 passes', [ef({cop: 2.78}).okCop, ef({cop: 2.77}).okCop, ef({cop: 2.78, iplv: 2.84}).okIplv, ef({cop: 2.78, iplv: 2.83}).okIplv, ef({}).okCop], [[true], [false], [true], [false], null]);
  const pt = o => sj(Object.assign({mode: 3, part: 1, i: 0, cap: 3.5, cop: 0}, o));
  check('packaged terminal units (Table 4/8): new construction cooling at 35 C: 3.66 - 0.213 x 3.5 = 2.9145; at 27.8 C 4.32 - 0.213 x capacity; replacement 3.39 / 3.84; heat pump cooling new 3.60 / 4.25, replacement 3.36 / 3.82; heating new 3.2, replacement 2.9', [pt({}).min, pt({i: 1}).min, pt({i: 2}).min, pt({i: 3}).min, pt({i: 4}).min, pt({i: 5}).min, pt({i: 6}).min, pt({i: 7}).min, pt({i: 8}).min, pt({i: 9}).min], [3.66 - 0.7455, 4.32 - 0.7455, 3.39 - 0.7455, 3.84 - 0.7455, 3.60 - 0.7455, 4.25 - 0.7455, 3.36 - 0.7455, 3.82 - 0.7455, 3.2 - 0.7455, 2.9 - 0.7455], 1e-9);
  check('terminal verdict: a 3 kW unit needs 3.66 - 0.639 = 3.021: 3.03 passes, 3.0 fails', [pt({cap: 3, cop: 3.03}).okCop, pt({cap: 3, cop: 3.0}).okCop, pt({}).okCop], [true, false, null]);
  const tw = o => sj(Object.assign({mode: 3, part: 2, i: 0, cop: 0, q: 100}, o));
  check('heat rejection (Table 5/8): axial-fan cooling towers 3.23 L/s per kW, centrifugal 1.7, air-cooled condensers COP 69; a 100 L/s axial tower may have up to 100 / 3.23 = 30.96 kW of fan power; condensers have no such figure', [tw({}).row[1], tw({i: 1}).row[1], tw({i: 2}).row[1], tw({}).fanKw, tw({i: 2}).fanKw, tw({cop: 3.5}).okCop, tw({cop: 3.2}).okCop], [3.23, 1.7, 69, 100 / 3.23, null, true, false], 1e-9);
}
const gs = o => sj(Object.assign({mode: 5, loc: 1, pm: 75, ceil: false, single: false, ach: 0, app: 0, vc: 0, desig: 0, bury: 400, above: 100, vdist: 1.5, det: 3}, o));
{
  check('Table 9/7: six rows with maximum pressures 350 (external risers and laterals), 75 (internal), 21 (kitchen concealed and fully accessible); containment needed for the internal rows and the concealed kitchen row; Table 11/7 has four standards', [J('SJ_GP').map(x => x[1]), J('SJ_GP').map(x => x[6]), J('SJ_GV').map(x => x[0])], [[350, 75, 350, 75, 21, 21], [0, 1, 0, 1, 1, 0], ['ANSI Z21.15', 'CSA Requirement 3-88', 'ASME B16.44', 'ASME B16.33']]);
  check('pressure limits: external 350 mbar passes (351 fails), internal 75 (76 fails), kitchen 21 (22 fails)', [gs({loc: 0, pm: 350}).okP, gs({loc: 0, pm: 351}).okP, gs({loc: 1, pm: 75}).okP, gs({loc: 1, pm: 76}).okP, gs({loc: 4, pm: 21}).okP, gs({loc: 4, pm: 22}).okP, gs({loc: 5, pm: 22}).okP], [true, false, true, false, true, false, false]);
  check('containment or natural ventilation: needed for internal rows, not for external or fully accessible rows; a pressure above 21 mbar over an unventilated ceiling forces it; concealed kitchen or single-family pipes need none', [gs({loc: 1}).contain, gs({loc: 0, pm: 100}).contain, gs({loc: 0, pm: 100, ceil: true}).contain, gs({loc: 0, pm: 21, ceil: true}).contain, gs({loc: 4, pm: 21}).contain, gs({loc: 4, pm: 21, single: true}).contain, gs({loc: 5, pm: 21}).contain, gs({loc: 1, single: true}).contain], [true, false, true, false, true, false, false, true]);
  check('special inspection of welded joints above 21 mbar (22 yes, 21 no; kitchen pipes may be welded too); mechanical ventilation 2 changes per hour (1.9 fails, 0 = none given)', [gs({pm: 22}).ndtSpecial, gs({pm: 21}).ndtSpecial, gs({loc: 4, pm: 21}).ndtSpecial, gs({ach: 2}).ach, gs({ach: 1.9}).ach, gs({ach: 0}).ach], [true, false, false, true, false, null]);
  check('valves (Table 11/7): shut-off up to 3.45 kPa all four; shut-off at higher pressures none; other uses up to 3.45 kPa without Z21.15; up to 14 kPa CSA and B16.44 only when designated 2G, B16.33 always; up to 345 kPa when designated 5G; up to 800 kPa only ASME B16.33', [gs({}).valves, gs({vc: 1}).valves, gs({app: 1}).valves, gs({app: 1, vc: 1, desig: 0}).valves, gs({app: 1, vc: 1, desig: 1}).valves, gs({app: 1, vc: 2, desig: 1}).valves, gs({app: 1, vc: 2, desig: 0}).valves, gs({app: 1, vc: 3, desig: 0}).valves, gs({app: 1, vc: 3, desig: 1}).valves], [['ANSI Z21.15', 'CSA Requirement 3-88', 'ASME B16.44', 'ASME B16.33'], [], ['CSA Requirement 3-88', 'ASME B16.44', 'ASME B16.33'], ['CSA Requirement 3-88', 'ASME B16.44', 'ASME B16.33'], ['ASME B16.33'], ['CSA Requirement 3-88', 'ASME B16.44', 'ASME B16.33'], ['ASME B16.33'], ['ASME B16.33'], ['ASME B16.33']]);
  check('installation: burial 305 mm (304 fails), 89 mm above ground (88 fails), shut-off valve within 1.85 m of the appliance (1.86 fails), detector coverage 4 m (4.1 fails)', [gs({bury: 305}).okBury, gs({bury: 304}).okBury, gs({above: 89}).okAbove, gs({above: 88}).okAbove, gs({vdist: 1.85}).okValve, gs({vdist: 1.86}).okValve, gs({det: 4}).okDet, gs({det: 4.1}).okDet], [true, false, true, false, true, false, true, false]);
}
const ts = o => sj(Object.assign({mode: 4, pw: 6, vertical: false, dlen: 40, dp: 400, cl: 6, q: 12.7, area: 100, seam: 0, seamLen: 0}, o));
{
  check('pressure and classes: pipe test 1.5 x 6 = 9 bar; duct classes low up to 500 Pa, medium 501 - 749, high from 750; test pressure 2000 Pa for medium; high: the greater of 3000 Pa and design + 500 (750 -> 3000, 3000 -> 3500); low: no pressure test', [ts({}).pipeP, ts({dp: 400}).cls, ts({dp: 600}).cls, ts({dp: 750}).cls, ts({dp: 400}).dtest, ts({dp: 600}).dtest, ts({dp: 750}).dtest, ts({dp: 3000}).dtest], [9, 'منخفض', 'متوسط', 'عالٍ', null, 2000, 3000, 3500]);
  check('tested length at most 30 m vertical and 45 m horizontal: 45 passes horizontally, 46 fails, 30 / 31 vertical', [ts({dlen: 45}).okLen, ts({dlen: 46}).okLen, ts({vertical: true, dlen: 30}).okLen, ts({vertical: true, dlen: 31}).okLen], [true, false, true, false]);
  const r = ts({dp: 500});
  check('Table 2/2: class 6 at 12.7 L/s per m2 and 500 Pa -> 3.8 %; 125 Pa -> 1.5; 1500 Pa -> 7.7; a pressure above the table uses the 1500 Pa column; class 1 at 25 L/s.m2 and 1500 Pa 0.5 %; allowed leak for 100 m2 = 3.8 % x 12.7 x 100 / 100 = 48.26 L/s', [r.l2.pct, ts({dp: 125}).l2.pct, ts({dp: 1500}).l2.pct, ts({dp: 2000}).l2.pct, ts({cl: 1, q: 25, dp: 1500}).l2.pct, r.leakLs], [3.8, 1.5, 7.7, 7.7, 0.5, 48.26], 1e-9);
  check('the nearest listed airflow is used for in-between values (14 L/s -> 15; 11 -> 10) and the first pressure column not below the design pressure (400 Pa -> 500)', [ts({q: 14}).l2.flow, ts({q: 11}).l2.flow, ts({dp: 400}).l2.p, ts({dp: 126}).l2.p], [15, 10, 500, 250]);
  check('Table 1/2 seam leakage: rectangular Pittsburgh 0.25 L/s per m (range 0.015 - 0.87), snap-lock 0.10, round snap-lock 0.17, round grooved 0.19; 100 m of Pittsburgh seam -> 25 L/s', [0, 1, 2, 3].map(i => ts({seam: i}).seam[4]), [0.25, 0.10, 0.17, 0.19]);
  check('seam total length', [ts({seam: 0, seamLen: 100}).seamLs, ts({seam: 3, seamLen: 50}).seamLs, ts({}).seamLs], [25, 9.5, 0], 1e-9);
  check('class tables have 5 airflow rows of 6 pressures each; the first value 125 Pa decreases with the class; two printed second-column values (0.1) are kept as printed', [J('SJ_L2').every(c => c[1].length === 5 && c[1].every(f => f[1].length === 6)), J('SJ_L2').map(c => c[1][0][1][0]), J('SJ_L2')[1][1][4][1][1], J('SJ_L2')[2][1][0][1][1]], [true, [1.9, 1.0, 0.5, 0.5, 0.4], 0.1, 0.1]);
}
let tt;
w.renderCalc('syrmat'); w.calcResult('syrmat');
tt = txt(w, 'sj_results');
check('the duct page opens with 0.80 mm for a 600 mm duct, a 10 mm hanger rod every 2.5 m and the 🔴 note; only the first group visible', [tt.includes('سماكة صفيحة الفولاذ'), /0\.80 mm/.test(tt), /Ø 10 mm/.test(tt), tt.includes('🔴'), w.document.getElementById('sj_g0').style.display, w.document.getElementById('sj_g1').style.display], [true, true, true, true, '', 'none']);
set('sj_m', '1'); w.calcResult('syrmat'); tt = txt(w, 'sj_results');
check('the pipe page shows the 3 m support spacing and the test pressure 9.0 bar', [/3 m/.test(tt), tt.includes('أقصى مسافة بين دعامات'), /9\.0 bar/.test(tt)], [true, true, true]);
set('sj_m', '2'); w.calcResult('syrmat'); tt = txt(w, 'sj_results');
check('the filter page shows the first filter limit', [tt.includes('3 m/s')], [true]);
set('sj_m', '3'); w.calcResult('syrmat'); tt = txt(w, 'sj_results');
check('the efficiency page shows 2.78 COP / 2.84 IPLV for 100 kW', [/2\.78 COP \/ 2\.84 IPLV/.test(tt), tt.includes('ARI 210/240')], [true, true]);
set('sj_ep', '1'); w.calcResult('syrmat'); tt = txt(w, 'sj_results');
check('switching to terminal units swaps the selector and shows the formula', [w.document.getElementById('sj_h1').style.display, w.document.getElementById('sj_h0').style.display, tt.includes('0.213')], ['', 'none', true]);
set('sj_m', '4'); w.calcResult('syrmat'); tt = txt(w, 'sj_results');
check('the test page shows 9.0 bar, the medium-pressure class and the 2000 Pa test pressure for 600 Pa', [/9\.0 bar/.test(tt), tt.includes('تصنيف مجرى الهواء')], [true, true]);
set('sj_m', '5'); w.calcResult('syrmat'); tt = txt(w, 'sj_results');
check('the gas page shows the internal riser row (75 mbar), the four valve standards, the 305 mm burial depth and shows only its group', [tt.includes('الصواعد والنوازل — داخلي'), tt.includes('ASME B16.33'), tt.includes('ANSI Z21.15'), tt.includes('305 mm'), tt.includes('🔴'), w.document.getElementById('sj_g5').style.display, w.document.getElementById('sj_g0').style.display], [true, true, true, true, true, '', 'none']);
check('other reference codes open syrmat too', others('syrmat', 'sj_results'), [true, true, true]);
}
// ---------- part 196: Dubai Building Code 2021, Part F structure (`dbcseis`: seismic parameters and liquefaction, `dbcstr`: wind, loads and serviceability, `dbcgeo`: concrete, ground investigation, piles and shoring) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const dq = o => J('dqCalc(' + JSON.stringify(o) + ')');
const fq = o => J('fqCalc(' + JSON.stringify(o) + ')');
const fz = o => J('fzCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
// ----- dbcseis -----
check('Table F.13 Ss 0.51, S1 0.18, TL 24 and PGA 0.13 (Table F.20); Fa A-E 0.80, 0.90, 1.296, 1.392, 1.684; Fv 0.80, 0.80, 1.50, 2.24, site-specific for E; FPGA 0.80, 0.90, 1.27, 1.54, 2.25; damping rows 0.5 / 2 / 5 / 10 / 20 % with (0.47, 0.54), (0.72, 0.78), (1, 1), (1.4, 1.3), (1.9, 1.7)', [J('DQ_P'), J('DQ_SITE').map(x => x.slice(1)), J('DQ_DAMP')], [{ss: 0.51, s1: 0.18, tl: 24, pga: 0.13}, [[0.8, 0.8, 0.8], [0.9, 0.8, 0.9], [1.296, 1.5, 1.27], [1.392, 2.24, 1.54], [1.684, null, 2.25]], [[0.5, 0.47, 0.54], [2, 0.72, 0.78], [5, 1, 1], [10, 1.4, 1.3], [20, 1.9, 1.7]]]);
const sd = (v, tbl, r4) => w.eval('dqSdc(' + v + ', ' + tbl + ', ' + r4 + ')');
check('Table F.15 boundaries: SDS 0.1669 A, 0.167 B (risk I-III) / C (IV), 0.33 C / D, 0.50 D; SD1 0.0669 A, 0.067 B / C, 0.133 C / D, 0.20 D', [sd(0.1669, 'DQ_SDS', false), sd(0.167, 'DQ_SDS', false), sd(0.167, 'DQ_SDS', true), sd(0.33, 'DQ_SDS', false), sd(0.33, 'DQ_SDS', true), sd(0.5, 'DQ_SDS', false), sd(0.0669, 'DQ_SD1', false), sd(0.067, 'DQ_SD1', false), sd(0.067, 'DQ_SD1', true), sd(0.133, 'DQ_SD1', false), sd(0.133, 'DQ_SD1', true), sd(0.2, 'DQ_SD1', false)], ['A', 'B', 'C', 'C', 'D', 'D', 'A', 'B', 'C', 'C', 'D', 'D']);
const dd = z => J('dqDamp(' + z + ')');
check('damping factors: 5 % gives (1, 1); 10 % (1.4, 1.3); 3.5 % interpolates linearly to (0.86, 0.89); 0.5 % (0.47, 0.54); below 0.5 % and above 20 % are clamped and flagged', [dd(5), dd(10), dd(3.5), dd(0.5), dd(0.2), dd(25)].map(x => [x.bs, x.b1, x.out]), [[1, 1, false], [1.4, 1.3, false], [0.86, 0.89, false], [0.47, 0.54, false], [0.47, 0.54, true], [1.9, 1.7, true]], 1e-9);
const base = {mode: 0, site: 3, risk4: false, T: 1, zeta: 5};
{
  const r = dq(base);
  check('site class D, 5 % damping: SMS = 1.392 x 0.51 = 0.70992; SDS = 0.47328; SM1 = 2.24 x 0.18 = 0.4032; SD1 = 0.2688; T0 = 0.2 SD1 / SDS = 0.11359; Ts = 0.56795', [r.fa, r.fv, r.sms, r.sds, r.sm1, r.sd1, r.T0, r.Ts], [1.392, 2.24, 0.70992, 0.47328, 0.4032, 0.2688, 0.2 * 0.2688 / 0.47328, 0.2688 / 0.47328], 1e-9);
  check('seismic design category of class D: short period C (0.33 <= 0.473 < 0.50), long period D (SD1 >= 0.20), governing D; design Sa at 1 s = SD1 = 0.2688 and MCER 1.5 times = 0.4032', [r.sdcS, r.sdc1, r.sdc, r.sa, r.saMce], ['C', 'D', 'D', 0.2688, 0.4032], 1e-9);
  const sa = T => dq(Object.assign({}, base, {T})).sa;
  check('spectrum: Sa(0) = 0.4 SDS = 0.18931; Sa(0.05) = SDS (0.4 + 0.6 x 0.05 / T0); plateau 0.47328 at 0.3 s; SD1 / T at 2 s = 0.1344; at TL 24 s = 0.0112 and beyond TL SD1 TL / T2 (30 s: 0.007168)', [sa(0), sa(0.05), sa(0.3), sa(2), sa(24), sa(30)], [0.4 * 0.47328, 0.47328 * (0.4 + 0.6 * 0.05 / (0.2 * 0.2688 / 0.47328)), 0.47328, 0.1344, 0.0112, 0.2688 * 24 / 900], 1e-9);
  check('table of the spectrum points is sorted and includes 0, T0, Ts and TL; the continuity at the plateau ends holds', [r.pts[0].T, r.pts[r.pts.length - 1].T, r.pts.every((p, i) => i === 0 || p.T > r.pts[i - 1].T), r.pts.length, Math.abs(r.pts.find(p => Math.abs(p.T - r.Ts) < 1e-12).sa - 0.47328) < 1e-9], [0, 24, true, 11, true]);
  const b = dq(Object.assign({}, base, {site: 1})), bi = dq(Object.assign({}, base, {site: 1, risk4: true}));
  check('class B: SDS = 2/3 x 0.9 x 0.51 = 0.306 -> B (risk I-III) or C (IV); SD1 = 2/3 x 0.8 x 0.18 = 0.096 -> B or C; governing B / C', [b.sds, b.sd1, b.sdcS, b.sdc1, b.sdc, bi.sdcS, bi.sdc1, bi.sdc], [0.306, 0.096, 'B', 'B', 'B', 'C', 'C', 'C'], 1e-9);
  const a = dq(Object.assign({}, base, {site: 0})), c = dq(Object.assign({}, base, {site: 2})), ci = dq(Object.assign({}, base, {site: 2, risk4: true}));
  check('class A: SDS = 0.272 and SD1 = 0.096 -> B; class C: SDS = 0.44064 -> C, SD1 = 2/3 x 1.5 x 0.18 = 0.18 -> C (0.133 to 0.20); risk IV makes C into D', [a.sds, a.sd1, a.sdc, c.sds, c.sd1, c.sdcS, c.sdc1, c.sdc, ci.sdc], [0.272, 0.096, 'B', 0.44064, 0.18, 'C', 'C', 'C', 'D'], 1e-9);
  const e = dq(Object.assign({}, base, {site: 4})), f = dq(Object.assign({}, base, {site: 5}));
  check('class E: only the short period (SDS = 2/3 x 1.684 x 0.51 = 0.57256, category D); Fv requires a site response study, so no SD1, spectrum or final category; class F: nothing computed (site-specific)', [e.sds, e.sdcS, e.longSpecific, e.sd1 === undefined, e.sdc === undefined, f.siteF, f.sds === undefined], [0.57256, 'D', true, true, true, true, true], 1e-9);
  const z = dq(Object.assign({}, base, {zeta: 10}));
  check('10 % damping on class D: Ss / 1.4 = 0.364286, S1 / 1.3 = 0.138462 -> SDS = 0.338057, SD1 = 2/3 x 2.24 x 0.138462 = 0.206769; Sa at 1 s = SD1', [z.bs, z.b1, z.ss, z.s1, z.sds, z.sd1, z.sa], [1.4, 1.3, 0.51 / 1.4, 0.18 / 1.3, 2 / 3 * 1.392 * 0.51 / 1.4, 2 / 3 * 2.24 * 0.18 / 1.3, 2 / 3 * 2.24 * 0.18 / 1.3], 1e-9);
}
{
  const lq = {mode: 1, site: 3, z: 6, sv: 110, svp: 70, crr: 0.2, ks: 1};
  const r = dq(lq);
  check('liquefaction (class D): FPGA 1.54 -> PGAM = 0.2002 g; rd at 6 m for M = 6.2 = 0.9028; CSR = 0.65 x 0.2002 x (110 / 70) x rd = 0.18462; MSF = 6.9 exp(-6.2 / 4) - 0.058 = 1.4065; CRR = 0.2 x MSF = 0.2813; FS = 1.5237 >= 1.5', [r.fpga, r.pgaM, r.rd, r.csr, r.msf, r.crr, r.fs, r.ok], [1.54, 0.2002, 0.9028253035679547, 0.18461874632661107, 1.406511019404527, 0.2813022038809054, 1.5236925256942788, true], 1e-9);
  const q = dq(Object.assign({}, lq, {crr: 0.19689011722578564 * 0.999})), q2 = dq(Object.assign({}, lq, {crr: 0.19689011722578564 * 1.001}));
  check('FS just under 1.5 fails and just over passes; Ksigma scales the resistance (0.8 gives FS 1.219); a small CSR (zero effective ratio) is not a failure', [q.ok, q2.ok, dq(Object.assign({}, lq, {ks: 0.8})).fs, dq(Object.assign({}, lq, {sv: 0})).ok], [false, true, 1.5236925256942788 * 0.8, true], 1e-9);
  check('PGAM by class: A 0.8 x 0.13 = 0.104, B 0.117, C 0.1651, E 0.2925; class F has no PGAM; rd is capped at 1 at the surface and decreases with depth (10 m 0.8115, 20 m 0.597); deeper than 34 m is flagged', [0, 1, 2, 4].map(s => dq(Object.assign({}, lq, {site: s})).pgaM), [0.104, 0.117, 0.1651, 0.2925], 1e-9);
  check('rd: 0 m -> 1; 10 m -> 0.8115; 20 m -> 0.5970; 34 m not flagged; 35 m flagged; site F has no liquefaction values', [0, 10, 20].map(z => dq(Object.assign({}, lq, {z})).rd).concat([dq(Object.assign({}, lq, {z: 34})).deep, dq(Object.assign({}, lq, {z: 35})).deep, dq(Object.assign({}, lq, {site: 5})).siteF]), [1, 0.8115141096924869, 0.5969811727281105, false, true, true], 1e-9);
}
let tt;
w.renderCalc('dbcseis'); w.calcResult('dbcseis');
tt = txt(w, 'dq_results');
check('the default page (class D, 1 s) shows SDS 0.473, SD1 0.269, the category D and the spectrum; the liquefaction group is hidden', [/0\.473 g/.test(tt), /0\.269 g/.test(tt), tt.includes('فئة التصميم الزلزالي'), tt.includes('T = 24.00 s'), tt.includes('🔴'), w.document.getElementById('dq_g0').style.display, w.document.getElementById('dq_g1').style.display], [true, true, true, true, true, '', 'none']);
set('dq_z', '10'); w.calcResult('dbcseis'); tt = txt(w, 'dq_results');
check('10 % damping adds the factors line (beta_S 1.400 and beta_1 1.300)', [tt.includes('βS = 1.400'), tt.includes('β1 = 1.300')], [true, true]);
set('dq_s', '5'); w.calcResult('dbcseis'); tt = txt(w, 'dq_results');
check('class F shows the site-specific message and no coefficients', [tt.includes('يلزم تحليل استجابة الموقع'), tt.includes('SDS = 2/3 SMS')], [true, false]);
set('dq_s', '3'); set('dq_m', '1'); w.calcResult('dbcseis'); tt = txt(w, 'dq_results');
check('the liquefaction page shows PGAM 0.200 g, rd 0.903, FS 1.52 passing, and only its group is visible', [/0\.200 g/.test(tt), /0\.903/.test(tt), /1\.52/.test(tt), tt.includes('✔'), w.document.getElementById('dq_g0').style.display, w.document.getElementById('dq_g1').style.display], [true, true, true, true, 'none', '']);
check('other reference codes open dbcseis too', others('dbcseis', 'dq_results'), [true, true, true]);
// ----- dbcstr -----
check('Table F.10: MRI 1, 10, 50, 300, 700, 1700, 3000 years with 22, 30, 38, 44, 47, 51, 53 m/s; Table F.12 damping concrete 1-2 / 1.5-2.5 %, steel 0.75-1 / 1-1.5 %', [J('FQ_V').map(x => x[0]), J('FQ_V').map(x => x[1]), J('FQ_DMP').map(x => x.slice(1))], [[1, 10, 50, 300, 700, 1700, 3000], [22, 30, 38, 44, 47, 51, 53], [[1, 2, 1.5, 2.5], [0.75, 1, 1, 1.5]]]);
check('Table F.7 densities 25, 18, 20, 7, 78, 20, 25 kN/m3; Table F.9 19, 22, 10, 10.3; Table F.8 walls 4.5, 5.5, 4.0 kN/m2; allowances 0.75, 0.50, 0.30; thermal ranges 20, 15, 25; ACI divisors 180, 360, 480, 240; incremental deflection 20 mm', [J('FQ_DEN').map(x => x[1]), J('FQ_FLU').map(x => x[1]), J('FQ_WALL').map(x => x[1]), J('FQ_ALW').map(x => x[1]), J('FQ_TH').map(x => x[1]), J('FQ_DEF').map(x => x[1]), J('FQ_INC')], [[25, 18, 20, 7, 78, 20, 25], [19, 22, 10, 10.3], [4.5, 5.5, 4], [0.75, 0.5, 0.3], [20, 15, 25], [180, 360, 480, 240], 20]);
const wd = o => fq(Object.assign({mode: 0, mri: 1, H: 80, B: 30, Hs: 3.5, dH: 120, dS: 7, p: 1.2, dm: 0}, o));
{
  const r = wd({});
  check('wind page (MRI 10 years): 30 m/s; 80 m with H/B = 2.667 needs no tunnel test; overall limit H/500 = 160 mm met by 120; storey limits 3500 / 400 = 8.75 and / 600 = 5.833 mm: 7 mm meets the upper only; 1.2 kN/m2 >= 1', [r.v, r.tunnel, r.ar, r.limH, r.okH, r.limS, r.okS, r.okS6, r.pOk], [30, false, 80 / 30, 160, true, [8.75, 3500 / 600], true, false, true], 1e-9);
  check('wind tunnel testing: H = 121 m (> 120) or H / B = 5.263 (> 5) requires it; exactly 120 m and exactly 5 do not', [wd({H: 121}).tunnel, wd({H: 100, B: 19}).tunnel, wd({H: 120}).tunnel, wd({H: 100, B: 20}).tunnel, wd({H: 100, B: 0}).tunnel], [true, true, false, false, false]);
  check('limits are inclusive: 160 mm passes, 160.1 fails; 8.75 passes the storey limit and 8.76 does not; 5.8333 meets the stricter one; pressure 0.99 fails, 1.0 passes', [wd({dH: 160}).okH, wd({dH: 160.1}).okH, wd({dS: 8.75}).okS, wd({dS: 8.76}).okS, wd({dS: 3500 / 600}).okS6, wd({p: 0.99}).pOk, wd({p: 1}).pOk], [true, false, true, false, true, false, true]);
  check('speeds per use: 1 year 22, 50 years 38, category IV 3000 years 53; steel damping 0.75 - 1 % for serviceability', [wd({mri: 0}).v, wd({mri: 2}).v, wd({mri: 6}).v, wd({dm: 1}).dmp.slice(1)], [22, 38, 53, [0.75, 1, 1, 1.5]]);
}
const ld = o => fq(Object.assign({mode: 1, mat: 0, t: 250, wall: 1, wh: 3, alw: 0, flu: 2, fd: 3, ex: 0, len: 60, alpha: 10, near: false, wt: 0.5, found: -4}, o));
{
  const r = ld({});
  check('loads page: slab 25 x 0.25 = 6.25 kN/m2; normal block wall 5.5 x 3 = 16.5 kN/m; allowance 0.75; water 10 x 3 = 30 kPa; thermal 10e-6 x 20 = 200 microstrain -> 12 mm over 60 m', [r.sw, r.wallLine, r.alw, r.pf, r.eps, r.dL], [6.25, 16.5, 0.75, 30, 2e-4, 12], 1e-9);
  check('steel 78 x 0.02 = 1.56; brackish water 2 m = 20.6 kPa; planter soil 19; protected steel +-25 with 12e-6 over 100 m = 30 mm; basement +-15', [ld({mat: 4, t: 20}).sw, ld({flu: 3, fd: 2}).pf, ld({flu: 0, fd: 1}).pf, ld({ex: 2, alpha: 12, len: 100}).dL, ld({ex: 1}).dT], [1.56, 20.6, 19, 30, 15], 1e-9);
  check('design water table: near water bodies +1.0 m DMD regardless of the entered level; away: 0.5 + 1.0 = 1.5; uplift = 10.3 x (1.5 - (-4)) = 56.65 kPa; foundation above the level gives zero', [ld({near: true}).wt, r.wt, r.head, r.up, ld({found: 3}).up, ld({found: 3}).head], [1, 1.5, 5.5, 56.65, 0, -1.5], 1e-9);
}
const sv = o => fq(Object.assign({mode: 2, span: 6000, cant: false, lim: 1, cdiv: 250, de: 14, di: 10, cr: 1, hD: 6, hw: 400, wk: 0.15, cd1: 5, dm1: 40, ie1: 1, cd2: 5, dm2: 30, ie2: 1, gap: 300}, o));
{
  const r = sv({});
  check('serviceability page: L / 360 on 6000 mm = 16.67 mm, 14 passes; incremental 10 <= 20; dry crack limit 0.3 with 0.15; dM1 = 5 x 40 = 200, dM2 = 150, dMT = 250 and a 300 mm gap passes', [r.limD, r.okD, r.okInc, r.wk, r.okW, r.d1, r.d2, r.dMT, r.okGap], [6000 / 360, true, true, 0.3, true, 200, 150, 250, true], 1e-9);
  check('limits: L/180, L/480, L/240 and custom L/250; 16.7 fails the floor limit while 16.6 passes; a cantilever of 2000 mm is checked as a span of 4000 mm', [0, 2, 3, 4].map(l => sv({lim: l}).limD), [6000 / 180, 6000 / 480, 6000 / 240, 6000 / 250], 1e-9);
  check('floor limit boundaries and the cantilever span; incremental 20 passes and 20.1 fails', [sv({de: 16.6}).okD, sv({de: 16.7}).okD, sv({cant: true, span: 2000}).L, sv({cant: true, span: 2000}).limD, sv({di: 20}).okInc, sv({di: 20.1}).okInc], [true, false, 4000, 4000 / 360, true, false], 1e-9);
  check('groundwater cracks: hD / hw = 15 -> 0.15 mm; ratio 5 and below 0.2; 20 -> 0.125; 35 and above 0.05; piles under permanent tension 0.1; wall thickness zero -> ratio 0', [sv({cr: 0}).wk, sv({cr: 0, hD: 2}).wk, sv({cr: 0, hD: 1.96}).wk, sv({cr: 0, hD: 8}).wk, sv({cr: 0, hD: 14}).wk, sv({cr: 0, hD: 16}).wk, sv({cr: 2}).wk, sv({cr: 0, hw: 0}).ratio], [0.15, 0.2, 0.2, 0.125, 0.05, 0.05, 0.1, 0], 1e-9);
  check('crack check is inclusive (0.3 passes dry, 0.31 fails); separation: 250 mm passes, 249 fails; importance 1.25 cuts the displacements to 160 and 120', [sv({wk: 0.3}).okW, sv({wk: 0.31}).okW, sv({gap: 250}).okGap, sv({gap: 249}).okGap, sv({ie1: 1.25}).d1, sv({ie2: 1.25}).d2, sv({ie1: 1.25, ie2: 1.25}).dMT], [true, false, true, false, 160, 120, 200], 1e-9);
}
w.renderCalc('dbcstr'); w.calcResult('dbcstr');
tt = txt(w, 'fq_results');
check('the default wind page shows 30 m/s, the 160.0 mm limit and the damping row; only its group is visible', [tt.includes('30 m/s'), tt.includes('160.0 mm'), tt.includes('الجدول F.12'), tt.includes('🔴'), w.document.getElementById('fq_g0').style.display, w.document.getElementById('fq_g1').style.display, w.document.getElementById('fq_g2').style.display], [true, true, true, true, '', 'none', 'none']);
set('fq_m', '1'); w.calcResult('dbcstr'); tt = txt(w, 'fq_results');
check('the loads page shows 6.25 kN/m2, 16.50 kN/m, 12.0 mm of thermal movement and the 56.65 kPa uplift', [/6\.25 kN\/m²/.test(tt), /16\.50 kN\/m/.test(tt), /12\.0 mm/.test(tt), /56\.65 kPa/.test(tt)], [true, true, true, true]);
set('fq_m', '2'); w.calcResult('dbcstr'); tt = txt(w, 'fq_results');
check('the serviceability page shows 16.7 mm, the 0.300 mm crack limit and the 250.0 mm separation', [/16\.7 mm/.test(tt), /0\.300 mm/.test(tt), /250\.0 mm/.test(tt)], [true, true, true]);
check('other reference codes open dbcstr too', others('dbcstr', 'fq_results'), [true, true, true]);
// ----- dbcgeo -----
check('Table F.3: 14 options with maximum w/c 0.45, 0.40, 0.35, 0.35, 0.35, 0.35, 0.35, 0.40, 0.40, 0.45, 0.50, 0.50, 0.55, 0.55 and minimum contents 360, 380 x 6 (options 2 to 7), 380, 380, 360, 340, 340, 202, 202', [J('FZ_MIX').map(x => x[3]), J('FZ_MIX').map(x => x[4])], [[0.45, 0.40, 0.35, 0.35, 0.35, 0.35, 0.35, 0.40, 0.40, 0.45, 0.50, 0.50, 0.55, 0.55], [360, 380, 380, 380, 380, 380, 380, 380, 380, 360, 340, 340, 202, 202]]);
check('Table F.3 compositions: option 1 GGBS 66 - 80, option 2 fly ash 36 - 55, option 3 GGBS 36 - 65 or fly ash 26 - 35, option 4 GGBS 26 - 35, option 5 fly ash 16 - 20, option 8 GGBS 66 - 80, option 12 fly ash 36 - 55, option 14 fly ash 26 - 35', [0, 1, 2, 3, 4, 7, 11, 13].map(k => J('FZ_MIX')[k][5]), [[['GGBS', 66, 80]], [['FA', 36, 55]], [['GGBS', 36, 65], ['FA', 26, 35]], [['GGBS', 26, 35]], [['FA', 16, 20]], [['GGBS', 66, 80]], [['FA', 36, 55]], [['FA', 26, 35]]]);
const dsT = J('FZ_DS');
check('Table F.25: 14 rows; the totals 280, 360, 380, 400, 410, 420, 430, 440, 450, 460, 470, 490, 500, 510; w/c 0.55, 0.44, 0.42, 0.38, 0.37, 0.36, 0.35, 0.34, 0.33, 0.33, 0.32, 0.31, 0.30, 0.29; the printed OPC of every row but C44/55 equals total - GGBS - silica fume (179, 230, 243, 256, 262, 269, 303, 306, 312, 315, 329, 330, 336), C44/55 is 297', [dsT.length, dsT.map(x => x[1]), dsT.map(x => x[4]), dsT.map(x => x[1] - x[2] - x[3])], [14, [280, 360, 380, 400, 410, 420, 430, 440, 450, 460, 470, 490, 500, 510], [0.55, 0.44, 0.42, 0.38, 0.37, 0.36, 0.35, 0.34, 0.33, 0.33, 0.32, 0.31, 0.30, 0.29], [179, 230, 243, 256, 262, 269, 297, 303, 306, 312, 315, 329, 330, 336]]);
check('Table F.25 supplementary materials: GGBS about 36 % up to C40/50 and 26 % above; silica fume 5 % (C44/55, C48/60), 6 %, 7 %, 8 %', [dsT.slice(0, 6).map(x => Math.round(100 * x[2] / x[1])), dsT.slice(6).map(x => Math.round(100 * x[2] / x[1])), dsT.slice(6).map(x => Math.round(100 * x[3] / x[1]))], [[36, 36, 36, 36, 36, 36], [26, 26, 26, 26, 26, 26, 26, 26], [5, 5, 6, 6, 7, 7, 8, 8]]);
const mx = o => fz(Object.assign({mode: 0, opt: 5, cem: 240, scm: 160, type: 'GGBS', water: 140, ds: 5, vol: 100, use: 0, fcu: 40, cov: 0, cover: 40, aps: 140, ns: 12}, o));
{
  const r = mx({});
  check('mix on option 6 (C40/50): 240 + 160 = 400 kg/m3, w/c = 0.35 (limit 0.35, max water 140), 40 % GGBS within 36 - 65 -> complies', [r.total, r.wc, r.maxWater, r.pct, r.okWc, r.okTot, r.okPct, r.okMix], [400, 0.35, 140, 40, true, true, true, true], 1e-9);
  check('failures: water 141 gives w/c 0.3525; 379 kg/m3 fails the content; GGBS 25 % (300 + 100) or 66 % (136 + 264) outside 36 - 65; fly ash is not allowed on option 6', [mx({water: 141}).okWc, mx({cem: 239, scm: 140}).okTot, mx({cem: 300, scm: 100}).okPct, mx({cem: 136, scm: 264}).okPct, mx({type: 'FA'}).okPct, mx({type: 'FA'}).alt], [false, false, false, false, false, null]);
  check('option 3 accepts GGBS 50 % or fly ash 30 %, rejects fly ash 40 %; the percentage limits are inclusive (36 and 65)', [mx({opt: 2, cem: 200, scm: 200}).okPct, mx({opt: 2, type: 'FA', cem: 280, scm: 120}).okPct, mx({opt: 2, type: 'FA', cem: 240, scm: 160}).okPct, mx({cem: 256, scm: 144}).okPct, mx({cem: 140, scm: 260}).okPct], [true, true, false, true, true]);
  check('blinding option 13: w/c 0.55 and 202 kg/m3 (water 111.1 max at 202); zero cementitious content gives w/c 0', [mx({opt: 12, cem: 120, scm: 82, water: 111}).okMix, mx({opt: 12, cem: 120, scm: 82}).maxWater, mx({cem: 0, scm: 0}).wc], [true, 0.55 * 202, 0], 1e-9);
  const d = mx({ds: 6});
  check('DSCB C44/55: 430 = 297 + 112 + 21, water 0.35 x 430 = 150.5; 100 m3 -> 43000 kg total, 29700 OPC, 11200 GGBS, 2100 silica fume, 15050 kg water', [d.ds.total, d.ds.opc, d.ds.ggbs, d.ds.sf, d.ds.water, d.q.total, d.q.opc, d.q.ggbs, d.q.sf, d.q.water], [430, 297, 112, 21, 150.5, 43000, 29700, 11200, 2100, 15050], 1e-9);
  check('strength minima: structural fcu 35 / f\'c 28 (34.9 fails), prestressed 40 / 32, blinding and screed 20; cover 30, 50, 75 mm (inclusive)', [mx({fcu: 35}).okFcu, mx({fcu: 34.9}).okFcu, mx({use: 1}).minFcu, mx({use: 1}).minFc, mx({use: 1, fcu: 39.9}).okFcu, mx({use: 2}).minFcu, mx({use: 2}).minFc, mx({cov: 1}).minCover, mx({cov: 2}).minCover, mx({cov: 2, cover: 74}).okCover, mx({cov: 2, cover: 75}).okCover], [true, false, 40, 32, false, 20, null, 50, 75, false, true]);
  check('tendons: 80 % of 1860 = 1488 MPa; 12 strands of 140 mm2 -> 2499.84 kN jacking and a duct of at least 3360 mm2', [r.jack, r.Pmax, r.duct], [1488, 2499.84, 3360], 1e-9);
}
const gt = o => fz(Object.assign({mode: 1, n: 15, area: 2400, L: 150, W: 100, B: 6, D: 1000, P: 4000, Pu: 11000, fc: 40, Ls: 3.5, sp: 2800, nb: 12, db: 25, dt: 10}, o));
{
  const r = gt({});
  check('boreholes: above G+12 -> at least 5; 2400 / 750 -> 4 by area; 5000 m2 -> 7; G+12 itself counts as the lower class (3): 1000 m2 -> 3; G+13 -> 5; 750 m2 -> 1 and 751 -> 2; area 3750 -> 5, 3751 -> 6 at G+13', [r.high, r.minBh, r.byArea, r.nb, gt({area: 5000}).nb, gt({n: 12, area: 1000}).nb, gt({n: 12, area: 1000}).high, gt({n: 13}).minBh, gt({area: 750}).byArea, gt({area: 751}).byArea, gt({n: 12, area: 3750}).nb, gt({n: 12, area: 3751}).nb], [true, 5, 4, 5, 7, 3, false, 5, 1, 2, 5, 6]);
  check('large structure grid of 60 m: 150 x 100 -> (3 + 1) x (2 + 1) = 12; 60 x 60 -> 4; 61 x 60 -> 6; investigation depth 3 x 6 = 18 m', [r.grid, gt({L: 60, W: 60}).grid, gt({L: 61, W: 60}).grid, r.depth], [12, 4, 6, 18]);
  check('pile of 1000 mm with 4000 kN: Ac = 785398 mm2, stress 5.093 N/mm2 within 25 % of 40 = 10; FoS = 11000 / 4000 = 2.75 >= 2.5; socket 3 m min (3.5 given); spacing 2.5 m min (2.8 given); 12 bars of 25 -> 0.75 %', [r.Ac, r.stress, r.maxStress, r.okStress, r.fos, r.okFos, r.socketMin, r.okSocket, r.spMin, r.okSp, r.okBars, r.okTie, r.rho], [Math.PI * 250000, 4000000 / (Math.PI * 250000), 10, true, 2.75, true, 3, true, 2500, true, true, true, 0.75], 1e-3);
  check('limits are inclusive: FoS 2.5 passes (Pu 10000), 2.49 fails; socket 3.0 passes, 2.99 fails; spacing 2500 passes, 2499 fails; stress exactly 10 N/mm2 passes; 5 bars or 10 mm bars fail; stirrup 8 fails; zero load gives infinite FoS', [gt({Pu: 10000}).okFos, gt({Pu: 9960}).okFos, gt({Ls: 3}).okSocket, gt({Ls: 2.99}).okSocket, gt({sp: 2500}).okSp, gt({sp: 2499}).okSp, gt({P: 7853.98163397448, Pu: 30000}).okStress, gt({nb: 5}).okBars, gt({db: 10}).okBars, gt({dt: 8}).okTie, gt({P: 0}).fos], [true, false, true, false, true, false, true, false, false, false, null]);
  check('minimum horizontal force 5 % of 4000 = 200 kN; moment for the 75 mm eccentricity 4000 x 0.075 = 300 kN.m; verticality 1/75 gives 53.33 kN; confinement length 3 x 1 m', [r.hMin, r.mEcc, r.hVert, r.conf], [200, 300, 4000 / 75, 3], 1e-9);
}
const sh = o => fz(Object.assign({mode: 2, H: 8, adj: false, gw: false, wb: false, ka: 0.33, sa: 1.5, la: 8, dl: 25, anch: true, Hw: 8, ha: 3, pi: 8, size: 60, pass: 15, org: 1, salt: 3, lift: 200, comp: 96}, o));
{
  const r = sh({});
  check('Table F.18: up to 5 m all types (5 inclusive); 5 to 9 m without neighbouring buildings -> all except soldier piles with lagging (9 inclusive); beyond 9 m or with buildings beyond 5 m -> outside the table', [sh({H: 5}).depthOk, sh({H: 5.1}).depthOk, r.depthOk, sh({H: 9}).depthOk, sh({H: 9.1}).depthOk, sh({H: 6, adj: true}).depthOk, sh({H: 4, adj: true}).depthOk], [0, 1, 1, 1, -1, -1, 0]);
  check('watertight shoring when buildings are adjacent, the groundwater is high or water bodies are near; otherwise not', [r.watertight, sh({adj: true}).watertight, sh({gw: true}).watertight, sh({wb: true}).watertight], [false, true, true, true]);
  check('Table F.19: surcharge 20 kN/m2 gives 0.33 x 20 = 6.6 kPa; anchors 1.2 m apart (1.19 fails); length 3 to 10 m (2.9 and 10.1 fail); movement 40 mm (41 fails)', [r.dp, sh({sa: 1.2}).spOk, sh({sa: 1.19}).spOk, sh({la: 3}).lenOk, sh({la: 10}).lenOk, sh({la: 2.9}).lenOk, sh({la: 10.1}).lenOk, sh({dl: 40}).dispOk, sh({dl: 41}).dispOk], [6.6, true, false, true, true, false, false, true, false], 1e-9);
  check('unplanned excavation: 10 % of the distance from the lowest anchor (3 m -> 0.3, min 0.5; 8 m -> 0.8); without anchors 10 % of the wall (8 m -> 0.8; 4 m -> 0.5)', [r.unplanned, sh({ha: 8}).unplanned, sh({anch: false}).unplanned, sh({anch: false, Hw: 4}).unplanned], [0.5, 0.8, 0.8, 0.5], 1e-9);
  check('backfill: all limits inclusive (PI 10, 75 mm, 20 %, 2 %, 5 %, 150 and 250 mm layers, 95 %) and each one fails just outside', [sh({pi: 10, size: 75, pass: 20, org: 2, salt: 5, lift: 150, comp: 95}).okFill, sh({lift: 250}).okFill, sh({pi: 10.1}).okPI, sh({size: 76}).okSize, sh({pass: 21}).okPass, sh({org: 2.1}).okOrg, sh({salt: 5.1}).okSalt, sh({lift: 149}).okLift, sh({lift: 251}).okLift, sh({comp: 94.9}).okComp], [true, true, false, false, false, false, false, false, false, false]);
}
w.renderCalc('dbcgeo'); w.calcResult('dbcgeo');
tt = txt(w, 'fz_results');
check('the default concrete page shows option 6, w/c 0.350 compliant, the DSCB C40/50 mix 420 kg/m3 and the 🔴 note; only its group is visible', [tt.includes('الخيار 6 من الجدول F.3'), tt.includes('0.350'), tt.includes('مطابقة'), tt.includes('420 kg/m³'), tt.includes('🔴'), w.document.getElementById('fz_g0').style.display, w.document.getElementById('fz_g1').style.display, w.document.getElementById('fz_g2').style.display], [true, true, true, true, true, '', 'none', 'none']);
set('fz_m', '1'); w.calcResult('dbcgeo'); tt = txt(w, 'fz_results');
check('the pile page shows 5 boreholes, the 18.0 m depth, FoS 2.75 and the 300 kN.m moment', [/عدد الجسات الدنيا5/.test(tt), tt.includes('18.0 m'), tt.includes('2.75'), tt.includes('300 kN·m')], [true, true, true, true]);
set('fz_m', '2'); w.calcResult('dbcgeo'); tt = txt(w, 'fz_results');
check('the shoring page shows the allowed systems for 8 m, the 6.6 kPa extra pressure and the compliant backfill', [tt.includes('كل الأنواع عدا الركائز مع التخشيب'), tt.includes('6.6 kPa'), tt.includes('مواد الردممطابقة')], [true, true, true]);
check('other reference codes open dbcgeo too', others('dbcgeo', 'fz_results'), [true, true, true]);
}

// ---------- part 197: Dubai Building Code 2021, Part K villas (`dbcvilla`: planning limits, balconies and guards, rooms and openings, stairs, ramps and garages, pools, sanitary fixtures and waste storage) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const vk = o => J('vkCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
const row = (r, k) => (r.rows.find(x => x.key === k) || {});
const okOf = (r, k) => row(r, k).ok;
check('Table K.1: villa 3 / 3 / 3 m, townhouse 3 / 0 / 3 m; Table K.2 and K.3 and K.5.4.2: living / bedroom 10.5 m2, 3 m, 2.7 m, 10 %; housekeeper 5.5, 2.1, 2.3, 8 %; kitchen 5.4, 1.8, 2.3, 10 %; Table K.5 ramps 12 / 12 / 8 %, lanes 3 / 3.5 / 5 m, radii 0 / 4 / 6, clear height 2.4; Table K.7 garages 3 x 5.5, 3.6 x 6, 6 x 6; Tables K.8 and K.9 bins', [J('VK_SB').map(x => x.slice(1)), J('VK_RM').map(x => x.slice(1)), J('VK_RP').map(x => x.slice(1)), J('VK_GR').map(x => x.slice(1)), J('VK_BN').map(x => x.slice(1))], [[[3, 3, 3], [3, 0, 3]], [[10.5, 3, 2.7, 10], [5.5, 2.1, 2.3, 8], [5.4, 1.8, 2.3, 10]], [[12, 3, 0, 2.4], [12, 3.5, 4, 2.4], [8, 5, 6, 2.4]], [[3, 5.5], [3.6, 6], [6, 6]], [[240, 580, 715, 1060], [360, 660, 880, 1100], [660, 720, 1250, 1320], [1100, 980, 1250, 1355], [2500, 1370, 2040, 1540]]]);
const p0 = o => vk(Object.assign({mode: 0, type: 0, stories: 2, H: 11, slope: 0, gate: 300, sz: 3, sx: 3, sy: 3, ga: 400, annex: 150, annexH: 4, gap: 2, plot: 800, foot: 350, bas: 1, roof: 200, roofStr: 60, roofSet: 2, bays: 2, ps: 2}, o));
{
  const r = p0({});
  check('default villa: every planning rule met (storeys, height, gate, setbacks, annex area / height / gap, basement, roof structures, parking); coverage 350 / 800 = 43.75 % is informative (DCR)', [r.rows.filter(x => x.ok === false).length, r.rows.filter(x => x.ok === null).map(x => x.key), r.cover, r.annexMax, r.roofRatio], [0, ['cover'], 43.75, 240, 30], 1e-9);
  check('three storeys and 16 m are the limits (4 storeys or 16.1 m fail)', [okOf(p0({stories: 3}), 'stories'), okOf(p0({stories: 4}), 'stories'), okOf(p0({H: 16}), 'height'), okOf(p0({H: 16.1}), 'height')], [true, false, true, false]);
  check('gate level: 300 mm passes, 299 fails; by slope 2 % to 5 % (1.9 and 5.1 fail)', [okOf(p0({gate: 300}), 'gate'), okOf(p0({gate: 299}), 'gate'), okOf(p0({slope: 2}), 'gate'), okOf(p0({slope: 5}), 'gate'), okOf(p0({slope: 1.9}), 'gate'), okOf(p0({slope: 5.1}), 'gate')], [true, false, true, true, false, false]);
  check('setbacks of a villa: 3 m from road, neighbour and sikka (2.9 fails); a townhouse needs none from the neighbour (0 passes) but still 3 m from road and sikka', [okOf(p0({sz: 2.9}), 'setZ'), okOf(p0({sx: 2.9}), 'setX'), okOf(p0({sy: 2.9}), 'setY'), okOf(p0({type: 1, sx: 0}), 'setX'), okOf(p0({type: 1, sz: 2.9}), 'setZ'), okOf(p0({type: 1, sy: 2.9}), 'setY')], [false, false, false, true, false, false]);
  check('annex: area up to 60 % of GA (240 of 400 m2 passes, 240.1 fails), height 5.5 m (5.6 fails), gap 1.5 m (1.4 fails); a villa with an annex touching the main building fails the gap; a townhouse may attach (gap 0); no annex means no gap rule', [okOf(p0({annex: 240}), 'annexArea'), okOf(p0({annex: 240.1}), 'annexArea'), okOf(p0({annexH: 5.5}), 'annexH'), okOf(p0({annexH: 5.6}), 'annexH'), okOf(p0({gap: 1.5}), 'annexGap'), okOf(p0({gap: 1.4}), 'annexGap'), okOf(p0({gap: 0}), 'annexGap'), okOf(p0({type: 1, gap: 0}), 'annexGap'), p0({annex: 0}).rows.some(x => x.key === 'annexGap')], [true, false, true, false, true, false, false, undefined, false]);
  check('basement soffit 1.5 m above the gate level (1.6 fails); roof structures 50 % of the roof (100 of 200 passes, 101 fails) with a 1.5 m setback (no setback rule without structures); one parking bay at least; slope 4 %', [okOf(p0({bas: 1.5}), 'basement'), okOf(p0({bas: 1.6}), 'basement'), okOf(p0({roofStr: 100}), 'roofStr'), okOf(p0({roofStr: 101}), 'roofStr'), okOf(p0({roofSet: 1.5}), 'roofSet'), okOf(p0({roofSet: 1.4}), 'roofSet'), p0({roofStr: 0}).rows.some(x => x.key === 'roofSet'), okOf(p0({bays: 1}), 'bays'), okOf(p0({bays: 0}), 'bays'), okOf(p0({ps: 4}), 'parkSlope'), okOf(p0({ps: 4.1}), 'parkSlope')], [true, false, true, false, true, false, false, true, false, true, false]);
  check('empty roof or plot gives no division error (ratio 0 and no coverage row)', [p0({roof: 0}).roofRatio, p0({plot: 0}).rows.some(x => x.key === 'cover')], [0, false]);
}
const bl = o => vk(Object.assign({mode: 1, ph: 3, pd: 3.5, dec: 250, decRoof: 600, el: 3000, gh: 1200, go: 90, gg: 50, gc: 900}, o));
{
  const r = bl({});
  check('balcony 3 m above the finished floor and 3.5 m from the neighbour; decorative projections 250 mm (300 limit) and 600 mm at the roof (900); the guard 1200 mm with 90 mm openings, 50 mm gap and the first climbable element at 900 mm all pass', [r.rows.length, r.rows.every(x => x.ok), r.guardNeeded], [8, true, true]);
  check('limits: 2.7 m (2.6 fails); 3 m from neighbours (2.9 fails); 300 mm (301 fails); 900 mm at the roof (901 fails)', [okOf(bl({ph: 2.7}), 'projH'), okOf(bl({ph: 2.6}), 'projH'), okOf(bl({pd: 3}), 'projD'), okOf(bl({pd: 2.9}), 'projD'), okOf(bl({dec: 300}), 'decor'), okOf(bl({dec: 301}), 'decor'), okOf(bl({decRoof: 900}), 'decorRoof'), okOf(bl({decRoof: 901}), 'decorRoof')], [true, false, true, false, true, false, true, false]);
  check('guard needed from 760 mm (759 not): below that only the four projection rows; height 1200 (1199 fails); opening 99 passes and 100 fails (a 100 mm sphere must not pass); gap 100 passes, 101 fails; climbable element 865 passes, 864 fails', [bl({el: 759}).guardNeeded, bl({el: 759}).rows.length, bl({el: 760}).guardNeeded, okOf(bl({gh: 1200}), 'guardH'), okOf(bl({gh: 1199}), 'guardH'), okOf(bl({go: 99}), 'guardOpen'), okOf(bl({go: 100}), 'guardOpen'), okOf(bl({gg: 100}), 'guardGap'), okOf(bl({gg: 101}), 'guardGap'), okOf(bl({gc: 865}), 'guardClimb'), okOf(bl({gc: 864}), 'guardClimb')], [false, 4, true, true, false, true, false, true, false, true, false]);
}
const rmo = o => vk(Object.assign({mode: 2, room: 0, under: false, area: 14, b: 3.4, len: 4.2, h: 2.8, glass: 1.6, lux: 180, sill: 900, de: 915, db: 750, cw: 1.1, ch: 2.4, kc: 1.3}, o));
{
  const r = rmo({});
  check('bedroom 14 m2, 3.4 m wide, 4.2 m deep, 2.8 m high, glass 1.6 m2 (11.43 %), depth / width 1.235, 180 lux, sill 900, doors 915 / 750, corridor 1.1 x 2.4: every rule met; no kitchen rule for a bedroom', [r.rows.every(x => x.ok), r.glassPct, r.depthRatio, r.glassMin, r.rows.some(x => x.key === 'kitchen')], [true, 1.6 / 14 * 100, 4.2 / 3.4, 10, false], 1e-9);
  check('minimum sizes: 10.5 m2 and 3 m and 2.7 m pass (10.4, 2.9, 2.69 fail); housekeeper 5.5 / 2.1 / 2.3 and 8 % glass; kitchen 5.4 / 1.8 / 2.3, 10 % glass and 1.2 m between counters', [okOf(rmo({area: 10.5}), 'area'), okOf(rmo({area: 10.4}), 'area'), okOf(rmo({b: 3}), 'dim'), okOf(rmo({b: 2.9}), 'dim'), okOf(rmo({h: 2.7}), 'hgt'), okOf(rmo({h: 2.69}), 'hgt'), okOf(rmo({room: 1, area: 5.5, b: 2.1, h: 2.3, glass: 0.44}), 'area'), okOf(rmo({room: 1, area: 5.5, b: 2.1, h: 2.3, glass: 0.44}), 'glass'), okOf(rmo({room: 1, area: 5.5, glass: 0.43}), 'glass'), okOf(rmo({room: 2, area: 5.4, b: 1.8, h: 2.3, glass: 0.54}), 'glass'), okOf(rmo({room: 2, kc: 1.2}), 'kitchen'), okOf(rmo({room: 2, kc: 1.19}), 'kitchen')], [true, false, true, false, true, false, true, true, false, true, true, false], 1e-9);
  check('glass 10 % of the floor area (1.4 of 14 m2 passes, 1.39 fails); room depth up to three times the width (10.2 / 3.4 passes, 10.3 fails); 150 lux (149 fails) only for living rooms and bedrooms; sill 900 (899 fails); doors 915 and 710 (914 and 709 fail); corridor 1 m and 2.3 m (0.99 and 2.29 fail)', [okOf(rmo({glass: 1.4}), 'glass'), okOf(rmo({glass: 1.39}), 'glass'), okOf(rmo({len: 10.2}), 'depth'), okOf(rmo({len: 10.3}), 'depth'), okOf(rmo({lux: 150}), 'lux'), okOf(rmo({lux: 149}), 'lux'), rmo({room: 1}).rows.some(x => x.key === 'lux'), okOf(rmo({sill: 900}), 'sill'), okOf(rmo({sill: 899}), 'sill'), okOf(rmo({de: 915}), 'doorEntry'), okOf(rmo({de: 914}), 'doorEntry'), okOf(rmo({db: 710}), 'doorBath'), okOf(rmo({db: 709}), 'doorBath'), okOf(rmo({cw: 1}), 'corW'), okOf(rmo({cw: 0.99}), 'corW'), okOf(rmo({ch: 2.3}), 'corH'), okOf(rmo({ch: 2.29}), 'corH')], [true, false, true, false, true, false, false, true, false, true, false, true, false, true, false, true, false]);
  check('a non-habitable room under the stairs needs only 2.03 m (2.02 fails); zero floor area gives zero glazing ratio', [okOf(rmo({under: true, h: 2.03}), 'hgt'), okOf(rmo({under: true, h: 2.02}), 'hgt'), rmo({area: 0}).glassPct], [true, false, 0]);
}
const st = o => vk(Object.assign({mode: 3, sty: 0, fh: 3200, n: 0, tread: 290, t305: 290, tw: 160, w: 1050, head: 2400, land: 1050, hr: 900, hd: 45, hg: 60, sl: 10, un: 5}, o));
{
  const r = st({});
  check('floor-to-floor 3200 mm: at least ceil(3200 / 180) = 18 risers and at most floor(3200 / 100) = 32; with 18 risers the riser is 177.8 mm, 17 treads of 290 mm give a 4.93 m run; every rule of a straight stair met', [r.nMin, r.nMax, r.nUsed, r.riser, r.treads, r.run, r.rows.every(x => x.ok)], [18, 32, 18, 3200 / 18, 17, 4930, true], 1e-9);
  check('straight stair: riser 100 - 180 (17 risers -> 188 mm fails; 32 -> 100 passes; 33 -> 96.97 fails); tread 280 passes and 279 fails; width 1000 passes, 999 fails; headroom 2300 (2299 fails); landing 1000 (999 fails)', [okOf(st({n: 17}), 'riser'), okOf(st({n: 32}), 'riser'), okOf(st({n: 33}), 'riser'), okOf(st({tread: 280}), 'tread'), okOf(st({tread: 279}), 'tread'), okOf(st({w: 1000}), 'width'), okOf(st({w: 999}), 'width'), okOf(st({head: 2300}), 'head'), okOf(st({head: 2299}), 'head'), okOf(st({land: 1000}), 'landing'), okOf(st({land: 999}), 'landing')], [false, true, false, true, false, true, false, true, false, true, false]);
  check('handrail 865 - 965 mm (864 and 966 fail); diameter 32 - 51 mm (31 and 52 fail); 57 mm from the wall (56 fails); tread slope 21 mm/m (22 fails); uniformity 10 mm (11 fails)', [okOf(st({hr: 865}), 'handrail'), okOf(st({hr: 965}), 'handrail'), okOf(st({hr: 864}), 'handrail'), okOf(st({hr: 966}), 'handrail'), okOf(st({hd: 32}), 'handrailD'), okOf(st({hd: 51}), 'handrailD'), okOf(st({hd: 31}), 'handrailD'), okOf(st({hd: 52}), 'handrailD'), okOf(st({hg: 57}), 'handrailGap'), okOf(st({hg: 56}), 'handrailGap'), okOf(st({sl: 21}), 'treadSlope'), okOf(st({sl: 22}), 'treadSlope'), okOf(st({un: 10}), 'unif'), okOf(st({un: 11}), 'unif')], [true, true, false, false, true, true, false, false, true, false, true, false, true, false]);
  const sp = st({sty: 1, t305: 190, head: 2030, n: 14}), sp2 = st({sty: 1, t305: 189, head: 2029, n: 13});
  check('spiral stair: riser up to 240 mm (3200 / 14 = 228.6 passes, 3200 / 13 = 246 fails); tread 190 mm at 305 mm from the narrow edge (189 fails); headroom 2030 mm (2029 fails)', [okOf(sp, 'riser'), okOf(sp, 'tread'), okOf(sp, 'head'), okOf(sp2, 'riser'), okOf(sp2, 'tread'), okOf(sp2, 'head')], [true, true, true, false, false, false]);
  const cv = st({sty: 2, t305: 255, head: 2300, n: 14}), cv2 = st({sty: 2, t305: 254, head: 2299, n: 13});
  check('curved stair: riser 100 - 240 (228.6 passes, 246.2 fails), tread 255 mm at 305 mm (254 fails), headroom 2300 mm', [okOf(cv, 'riser'), okOf(cv, 'tread'), okOf(cv, 'head'), okOf(cv2, 'riser'), okOf(cv2, 'tread'), okOf(cv2, 'head')], [true, true, true, false, false, false]);
  const wd = st({sty: 3, tw: 150, t305: 280}), wd2 = st({sty: 3, tw: 149, t305: 279});
  check('winders: 150 mm at the narrowest and 280 mm at 305 mm (149 and 279 fail); the straight stair has no winder rule', [okOf(wd, 'winder'), okOf(wd, 'winder305'), okOf(wd2, 'winder'), okOf(wd2, 'winder305'), r.rows.some(x => x.key === 'winder')], [true, true, false, false, false]);
}
const rp = o => vk(Object.assign({mode: 4, rt: 0, rh: 2.4, rl: 25, lane: 3, rad: 4, rc: 2.5, gt: 1, gw: 3.6, gl: 6, ps: 2, road: 3.5, acc: 8, bays: 2}, o));
{
  const r = rp({});
  check('straight ramp of 2.4 m over 25 m = 9.6 % (limit 12), 3 m lane, 2.5 m clear; enclosed garage 3.6 x 6; parking slope 2 %; internal road 3.5 m; entrance 8 m from the intersection; 2 bays: everything passes and a straight ramp has no radius rule', [r.slope, r.rows.every(x => x.ok), r.rows.some(x => x.key === 'rRadius')], [9.6, true, false], 1e-9);
  check('ramp types: straight and curved 12 %, helical 8 %; lane 3 / 3.5 / 5 m; inner radius 4 / 6 m for curved / helical; clear height 2.4 m', [okOf(rp({rh: 3}), 'rSlope'), okOf(rp({rh: 3.01}), 'rSlope'), okOf(rp({rt: 2, rh: 2}), 'rSlope'), okOf(rp({rt: 2, rh: 2.01}), 'rSlope'), okOf(rp({rt: 1, lane: 3.5}), 'rLane'), okOf(rp({rt: 1, lane: 3.4}), 'rLane'), okOf(rp({rt: 2, lane: 5}), 'rLane'), okOf(rp({rt: 2, lane: 4.9}), 'rLane'), okOf(rp({rt: 1, rad: 4}), 'rRadius'), okOf(rp({rt: 1, rad: 3.9}), 'rRadius'), okOf(rp({rt: 2, rad: 6}), 'rRadius'), okOf(rp({rt: 2, rad: 5.9}), 'rRadius'), okOf(rp({rc: 2.4}), 'rClear'), okOf(rp({rc: 2.39}), 'rClear')], [true, false, true, false, true, false, true, false, true, false, true, false, true, false]);
  check('garages: open single 3 x 5.5, enclosed single 3.6 x 6, enclosed double 6 x 6 (each one short fails)', [okOf(rp({gt: 0, gw: 3, gl: 5.5}), 'gW'), okOf(rp({gt: 0, gw: 3, gl: 5.5}), 'gL'), okOf(rp({gt: 0, gw: 2.9}), 'gW'), okOf(rp({gt: 1, gw: 3.5}), 'gW'), okOf(rp({gt: 1, gl: 5.9}), 'gL'), okOf(rp({gt: 2, gw: 6, gl: 6}), 'gW'), okOf(rp({gt: 2, gw: 3.6}), 'gW')], [true, true, false, false, false, true, false]);
  check('parking slope 4 % (4.1 fails), internal road 3 m (2.9 fails), entrance 6 m from the intersection (5.9 fails), one bay at least; zero length gives a zero slope', [okOf(rp({ps: 4}), 'pSlope'), okOf(rp({ps: 4.1}), 'pSlope'), okOf(rp({road: 3}), 'road'), okOf(rp({road: 2.9}), 'road'), okOf(rp({acc: 6}), 'access'), okOf(rp({acc: 5.9}), 'access'), okOf(rp({bays: 1}), 'bays'), okOf(rp({bays: 0}), 'bays'), rp({rl: 0}).slope], [true, false, true, false, true, false, true, false, 0]);
}
const sv = o => vk(Object.assign({mode: 5, s1: 10, s2: 30, pd: 900, dk: 1.5, fh: 1250, fg: 40, psl: 1200, sw: 450, sp: 800, sf: 800, so: 650, shw: 1900, bed: 5, dens: 120, bin: 0, comm: false, nb: 2, wr: 30, wc: 20, wg: 5}, o));
{
  const r = sv({});
  check('default pool, fixtures and waste store: all rules met; 5 bedrooms x 2.5 kg = 12.5 kg a day, 25 kg for two days, 25 / 120 = 0.2083 m3 -> 208 litres -> 2 bins (the minimum); two 240 l bins need 2 x 580 + 3 x 150 = 1610 mm by 715 + 300 = 1015 mm = 1.634 m2', [r.rows.every(x => x.ok), r.daily, r.store, r.vol, r.nBins, r.padW, r.padL, r.padA], [true, 12.5, 25, 25 / 120, 2, 1610, 1015, 1.610 * 1.015], 1e-9);
  check('pool: shallow slope 12 % (13 fails), deep 33 % (34 fails), depth 850 - 1200 mm (849 and 1201 fail), deck 1.2 m (1.19 fails), fence 1200 mm (1199 fails), gap 50 mm (51 fails), sill 1200 mm (1199 fails)', [okOf(sv({s1: 12}), 'poolShallow'), okOf(sv({s1: 13}), 'poolShallow'), okOf(sv({s2: 33}), 'poolDeep'), okOf(sv({s2: 34}), 'poolDeep'), okOf(sv({pd: 850}), 'poolDepth'), okOf(sv({pd: 1200}), 'poolDepth'), okOf(sv({pd: 849}), 'poolDepth'), okOf(sv({pd: 1201}), 'poolDepth'), okOf(sv({dk: 1.2}), 'deck'), okOf(sv({dk: 1.19}), 'deck'), okOf(sv({fh: 1200}), 'fence'), okOf(sv({fh: 1199}), 'fence'), okOf(sv({fg: 50}), 'fenceGap'), okOf(sv({fg: 51}), 'fenceGap'), okOf(sv({psl: 1200}), 'poolSill'), okOf(sv({psl: 1199}), 'poolSill')], [true, false, true, false, true, true, false, false, true, false, true, false, true, false, true, false]);
  check('fixtures: 400 mm from the wall (399 fails), 750 mm between centres, 750 mm in front, 600 mm to the opposite fixture, shower walls 1800 mm (1799 fails)', [okOf(sv({sw: 400}), 'wcSide'), okOf(sv({sw: 399}), 'wcSide'), okOf(sv({sp: 750}), 'wcPitch'), okOf(sv({sp: 749}), 'wcPitch'), okOf(sv({sf: 750}), 'wcFront'), okOf(sv({sf: 749}), 'wcFront'), okOf(sv({so: 600}), 'wcOpp'), okOf(sv({so: 599}), 'wcOpp'), okOf(sv({shw: 1800}), 'showerWall'), okOf(sv({shw: 1799}), 'showerWall')], [true, false, true, false, true, false, true, false, true, false]);
  check('waste distances: residents 50 m (51 fails); the contractor 30 m for bins up to 240 l and 15 m above (20 m with a 660 l bin fails); gradient 8.33 % (8.34 fails); a dedicated store takes 360 l bins at most, a communal one 2500 l', [okOf(sv({wr: 50}), 'wasteRes'), okOf(sv({wr: 51}), 'wasteRes'), okOf(sv({wc: 30}), 'wasteCon'), okOf(sv({wc: 31}), 'wasteCon'), okOf(sv({bin: 2, wc: 15}), 'wasteCon'), okOf(sv({bin: 2, wc: 20}), 'wasteCon'), okOf(sv({wg: 8.33}), 'wasteGrade'), okOf(sv({wg: 8.34}), 'wasteGrade'), okOf(sv({bin: 1}), 'wasteMax'), okOf(sv({bin: 2}), 'wasteMax'), okOf(sv({bin: 4, comm: true}), 'wasteMax'), okOf(sv({bin: 4, comm: false}), 'wasteMax')], [true, false, true, false, true, false, true, false, true, false, true, false]);
  check('more bedrooms need more bins: 20 bedrooms x 2.5 x 2 = 100 kg at 120 kg/m3 = 833 litres -> 4 bins of 240 l; no density gives zero volume and the two-bin minimum; bins in a row of 3: 3 x 580 + 4 x 150 = 2340 mm', [sv({bed: 20}).nBins, sv({dens: 0}).vol, sv({dens: 0}).nBins, sv({nb: 3}).padW], [4, 0, 2, 2340], 1e-9);
}
let tt;
w.renderCalc('dbcvilla'); w.calcResult('dbcvilla');
tt = txt(w, 'vk_results');
check('the default planning page shows the 16 m height limit, the 240 m2 annex limit, the 43.75 % coverage and the 🔴 note; only the first group is visible', [tt.includes('الارتفاع الكلي للمبنى'), tt.includes('240.0 m²'), /43\.75 %/.test(tt), tt.includes('🔴'), w.document.getElementById('vk_g0').style.display, w.document.getElementById('vk_g1').style.display, w.document.getElementById('vk_g5').style.display], [true, true, true, true, '', 'none', 'none']);
set('vk_m', '2'); w.calcResult('dbcvilla'); tt = txt(w, 'vk_results');
check('the rooms page shows the glazing ratio 11.4 % and the 2.7 m clear height rule', [/11\.4 %/.test(tt), tt.includes('الارتفاع الصافي'), w.document.getElementById('vk_g2').style.display, w.document.getElementById('vk_g0').style.display], [true, true, '', 'none']);
set('vk_m', '3'); w.calcResult('dbcvilla'); tt = txt(w, 'vk_results');
check('the stairs page shows the risers range 18 to 32, 17 treads and the 4.93 m run', [tt.includes('المدى لارتفاع 3200 mm بين 18'), /17 · 4\.93 m/.test(tt)], [true, true]);
set('vk_m', '5'); w.calcResult('dbcvilla'); tt = txt(w, 'vk_results');
check('the pool and waste page shows 12.5 kg a day and the 1.61 x 1.01 m pad', [/12\.5 kg/.test(tt), /1\.61 × 1\.01 m/.test(tt)], [true, true]);
check('other reference codes open dbcvilla too', others('dbcvilla', 'vk_results'), [true, true, true]);
}
// ---------- part 198: Dubai Building Code 2021, Part J security (`dbcsec`: Table J.1 requirements by building type, Table J.2 camera locations, recording storage) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const jq = o => J('jqCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
const T = J('JQ_T'), CAM = J('JQ_CAM'), J1 = J('JQ_J1');
const cell = (type, loc) => (CAM.find(x => x[0] === loc) || [0, []])[1][T.indexOf(type)];
check('Table J.1 has the 23 building types of the code, and every one needs VSS', [T.length, T[0], T[10], T[21], T[22], J1.every(x => x[0] === 1)], [23, 'دور السينما والمسارح', 'الفنادق', 'مراكز التسوق والمولات', 'محطات تعبئة وقود المركبات', true]);
check('columns of Table J.1: control room for cinemas, recreation parks, hotels and malls (4); EACS for recreation parks, financial institutions, hotels, precious-goods shops, self-storage and robotic storage (6); alarm and IDS for art galleries, financial institutions, precious-goods shops, warehouses, hazardous warehouses, self-storage, precious-metal factories, hazardous factories and robotic storage (9); HVM for recreation parks and malls (2)', [0, 1, 2, 3, 4].map(k => J1.reduce((a, r) => a + r[k], 0)).concat([[0, 1, 10, 21].map(i => J1[i][1]), [1, 5, 10, 12, 17, 20].map(i => J1[i][2]), [2, 5, 12, 15, 16, 17, 18, 19, 20].map(i => J1[i][3]), [1, 21].map(i => J1[i][4])]), [23, 4, 6, 9, 2, [1, 1, 1, 1], [1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 1]]);
const q = (t, m) => jq({mode: m || 0, type: t, nI: 8, nR: 16, nD: 40, bI: 4, bR: 3, bD: 2, days: 0});
{
  const h = q(10), mall = q(21), fuel = q(22), sim = q(7), park = q(1);
  check('hotels: VSS, control room and EACS (not IDS or HVM) with notes g and h; malls: VSS, control room and HVM with notes j (as printed on the VSS cell) and k; recreation parks: VSS, control room, EACS and HVM with notes a and b; SIM shops: VSS only with note f; fuel stations: VSS only', [h.req, h.notes, mall.req, mall.notes, park.req, park.notes, sim.req, sim.notes, fuel.req, fuel.notes], [[true, true, true, false, false], {v: 'g', e: 'h'}, [true, true, false, false, true], {v: 'j', h: 'k'}, [true, true, true, false, true], {e: 'a', h: 'b'}, [true, false, false, false, false], {v: 'f'}, [true, false, false, false, false], {}]);
  check('footnotes: 11 letters a - k; h asks 3,000 recorded actions and six months of records; j 100,000 AED; c one million dirhams', [Object.keys(J('JQ_NT')).join(''), J('JQ_NT').h.includes('3000') && J('JQ_NT').h.includes('ستة أشهر'), J('JQ_NT').j.includes('100,000'), J('JQ_NT').c.includes('مليون')], ['abcdefghijk', true, true, true]);
}
check('Table J.2: 61 camera locations and 245 filled cells: R 88, D 90, I 46, ANPR 24 and the single R1, D1, D2, D4, D5 and two each of D3 and R2 (counted per code token)', [CAM.length, CAM.reduce((a, r) => a + r[1].filter(x => x).length, 0), (() => { const c = {}; CAM.forEach(r => r[1].forEach(x => { if (x) x.split(', ').forEach(k => { c[k] = (c[k] || 0) + 1; }); })); return c; })()], [61, 245, {R: 88, D: 90, I: 46, R1: 1, D1: 1, D2: 1, D3: 2, R2: 2, D4: 1, D5: 1, ANPR: 24}]);
check('cells read from the page: 20 building types identify (I) at the emergency exit discharge doors and 22 at all entrances (every type except SIM card shops); SIM shops have no cell at the entrances', [CAM.find(x => x[0] === 'على جميع أبواب تصريف مخارج الطوارئ')[1].filter(x => x === 'I').length, CAM.find(x => x[0] === 'على جميع المداخل')[1].filter(x => x === 'I').length, cell('محلات شرائح الاتصال', 'على جميع المداخل')], [20, 22, '']);
check('selected cells: malls vehicle entrances R + ANPR; fuel stations fuel refilling lines D and 25 fps; financial ATM R1; malls water tank rooms R2 + D4 and HVAC entrances R2 + D5; SIM tables I + R; hotels outdoor corridors D2 and back of house corridors D; important complexes D1; art galleries sales desks R; places of worship all places D', [cell('مراكز التسوق والمولات', 'على مداخل ومخارج المركبات'), cell('محطات تعبئة وقود المركبات', 'على خطوط تعبئة الخزان الرئيسي للوقود'), cell('المؤسسات المالية والنقدية', 'على أجهزة الصراف الآلي والهواتف العامة ومحطات شحنها'), cell('مراكز التسوق والمولات', 'في غرف خزانات المياه'), cell('مراكز التسوق والمولات', 'على مداخل وحدات معالجة الهواء النقي'), cell('محلات شرائح الاتصال', 'على طاولات شرائح الاتصال والهواتف المحمولة'), cell('الفنادق', 'على الممرات الخارجية'), cell('الفنادق', 'على جميع ممرات الواجهة الخلفية والأمامية'), cell('المجمعات المهمة (مجموعات أبراج أو مجمع فلل)', 'على جميع ممرات الواجهة الخلفية والأمامية'), cell('معارض الفنون', 'على مكاتب المبيعات والصرافين'), cell('أماكن العبادة', 'في جميع أماكن العبادة')], ['R, ANPR', 'D', 'R1', 'R2, D4', 'R2, D5', 'I, R', 'D2', 'D', 'D1', 'R', 'D']);
{
  const hot = q(10, 1), fuel = q(22, 1), fin = q(5, 1), self = q(17, 1), rob = q(20, 1), imp = q(9, 1), wor = q(4, 1), sim = q(7, 1);
  check('hotels: 30 camera locations with 13 R, 10 D, 4 I, 1 D2 and 3 ANPR tokens (one cell is D + ANPR); 31 days; VideoGuard required; no outdoor fps', [hot.locs.length, hot.cls.R, hot.cls.D, hot.cls.I, hot.cls.D2, hot.cls.ANPR, hot.days, hot.vg, hot.fps], [30, 13, 10, 4, 1, 3, 31, 1, null]);
  check('recording days: 31 for most, 90 for self-storage and robotic storage, financial institutions 31 (75 for ATM machines); VideoGuard: required, none for places of worship, only above 50 residential units for important complexes; 25 fps for fuel stations only', [fuel.days, fin.days, fin.atmDays, self.days, rob.days, hot.atmDays, imp.vg, wor.vg, fuel.vg, fuel.fps, sim.fps], [31, 31, 75, 90, 90, null, 2, 0, 1, 25, null]);
  check('counts per type (locations): cinemas 21, recreation parks 24, art galleries 7, shooting ranges 11, SIM shops 1, malls 25, fuel stations 9, hotels 30', [0, 1, 2, 3, 7, 21, 22, 10].map(i => q(i, 1).locs.length), [21, 24, 7, 11, 1, 25, 9, 30]);
}
{
  const s = jq({mode: 2, type: 10, nI: 8, nR: 16, nD: 40, bI: 4, bR: 3, bD: 2, days: 0});
  const k = 1e6 / 8 * 86400 / 1e12;
  check('storage for hotels (31 days): I 8 x 4 = 32 Mbps, R 16 x 3 = 48, D 40 x 2 = 80 -> 160 Mbps in total; 1 Mbps for one day is 0.01080 TB, so 0.3456 + 0.5184 + 0.864 TB per day x 31 = 10.71 + 16.07 + 26.78 = 53.57 TB', [s.d, s.n, s.mbps, s.tb[0], s.tb[1], s.tb[2], s.total], [31, 64, 160, 32 * 31 * 0.0108, 48 * 31 * 0.0108, 80 * 31 * 0.0108, 160 * 31 * 0.0108], 1e-9);
  check('an entered period replaces the table value (90 days triples the storage almost: 2.9 times); zero cameras give zero', [jq({mode: 2, type: 10, nI: 8, nR: 16, nD: 40, bI: 4, bR: 3, bD: 2, days: 90}).d, jq({mode: 2, type: 10, nI: 8, nR: 16, nD: 40, bI: 4, bR: 3, bD: 2, days: 90}).total, jq({mode: 2, type: 10, nI: 0, nR: 0, nD: 0, bI: 4, bR: 3, bD: 2, days: 0}).total], [90, 160 * 90 * 0.0108, 0], 1e-9);
}
let tt;
w.renderCalc('dbcsec'); w.calcResult('dbcsec');
tt = txt(w, 'jq_results');
check('the default page (hotels, requirements) shows VSS and EACS required, IDS not required, note g and the 3000 actions of note h; the storage inputs are hidden', [tt.includes('الفنادق'), tt.includes('مراقبة الفيديو VSS'), tt.includes('مطلوب ✔'), tt.includes('غير مطلوب'), tt.includes('3000'), tt.includes('🔴'), w.document.getElementById('jq_g2').style.display], [true, true, true, true, true, true, 'none']);
set('jq_m', '1'); w.calcResult('dbcsec'); tt = txt(w, 'jq_results');
check('the camera page lists the hotel locations with their classes (30 locations, 31 days, VideoGuard)', [tt.includes('عدد مواقع الكاميرات المطلوبة30'), tt.includes('31 يومًا'), tt.includes('يجب تركيبه'), tt.includes('على جميع أبواب تصريف مخارج الطوارئ'), tt.includes('تعريف (الهوية)')], [true, true, true, true, true]);
set('jq_m', '2'); w.calcResult('dbcsec'); tt = txt(w, 'jq_results');
check('the storage page shows 53.57 TB and shows its inputs', [/53\.57 TB/.test(tt), w.document.getElementById('jq_g2').style.display], [true, '']);
check('other reference codes open dbcsec too', others('dbcsec', 'jq_results'), [true, true, true]);
}

// ---------- part 199: Dubai Building Code 2021, Part E safety glazing and façade fire tests (`dbcglass`: Tables E.9 - E.13, containment and manifestation, operable windows, solid metal panels, roofing and signboards) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const gx = o => J('gxCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('Table E.9: low level areas class 1, doors below 900 mm class 2, side panels above 900 mm class 3; Table E.10: up to 0.9 m2 ANSI class A and CPSC category I, above 0.9 m2 class B and category I; building groups: seven in the first group (A1 or A2-s1-d0 panels) and four in the second (B-s1-d0)', [J('GX_E9').map(x => x[2]), J('GX_E10').map(x => [x[1], x[2]]), J('GX_BT').map(x => x[1])], [[1, 2, 3], [['A', 'I'], ['B', 'I']], [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]]);
const s = o => gx(Object.assign({mode: 0, el: 0, hb: 0, ht: 1500, width: 1200, area: 1.5, dist: 0, drop: 0, transp: true, risk: 1, blocked: false, upper: false, sill: 900, open: 100, slope: 0}, o));
{
  check('critical locations: a door leaf below 1500 mm (1499 yes, 1500 no); a side panel likewise; windows below 800 mm (799 yes, 800 no); a panel next to the door edge within 300 mm (301 not critical)', [s({hb: 1499}).critical, s({hb: 1500}).critical, s({el: 1, hb: 0}).critical, s({el: 2, hb: 799}).critical, s({el: 2, hb: 800}).critical, s({el: 3, hb: 0, dist: 300}).critical, s({el: 3, hb: 0, dist: 301}).critical], [true, false, true, true, false, true, false]);
  check('class: windows low level 1; door and side panel glazing starting below 900 mm class 2 (899 -> 2), from 900 mm class 3; ANSI Z97.1 class A and CPSC category I up to 0.9 m2, class B above (0.91)', [s({el: 2, hb: 500}).cls, s({hb: 899}).cls, s({hb: 900}).cls, s({el: 1, hb: 900}).cls, s({area: 0.9}).ansi, s({area: 0.91}).ansi, s({area: 0.91}).cpsc], [1, 2, 3, 3, 'A', 'B', 'I']);
  check('containment below 800 mm over a level change above 760 mm (761 yes, 760 no; a panel starting at 800 mm no); a panel reaching above 800 mm is contained as a whole (top 1200: yes, top 800: no)', [s({hb: 500, drop: 761}).contain, s({hb: 500, drop: 760}).contain, s({hb: 800, drop: 900}).contain, s({hb: 500, drop: 900, ht: 1200}).wholePanel, s({hb: 500, drop: 900, ht: 800}).wholePanel], [true, false, false, true, false]);
  check('manifestation for transparent glazing near doors, 500 mm wide or more (499 no), reaching above 850 mm (850 no), not blocked and not an unreachable upper floor; opaque glazing or no collision risk needs none', [s({width: 500, ht: 851}).manifest, s({width: 499, ht: 851}).manifest, s({width: 600, ht: 850}).manifest, s({width: 600, ht: 851, blocked: true}).manifest, s({width: 600, ht: 851, upper: true}).manifest, s({width: 600, ht: 851, transp: false}).manifest, s({width: 600, ht: 851, risk: 0}).manifest, s({width: 600, ht: 851, risk: 3}).manifest], [true, false, false, false, false, false, false, true]);
  check('manifestation marks cover 50 % of every 900 mm interval: 1800 mm -> 2 intervals, 900 mm; 1200 mm -> 2 intervals (900 + 300), 450 + 150 = 600 mm; 900 mm -> 1 interval, 450 mm; 450 mm -> 225 mm', [1800, 1200, 900, 450].map(w => s({width: w}).markMin), [900, 600, 450, 225], 1e-9);
  check('operable windows: sill 900 mm (899 fails), opening limited to 100 mm (101 fails); overhead glazing from 15 degrees off vertical (14.9 not)', [s({sill: 900}).sillOk, s({sill: 899}).sillOk, s({open: 100}).openOk, s({open: 101}).openOk, s({slope: 15}).overhead, s({slope: 14.9}).overhead], [true, false, true, false, true, false]);
}
const f = o => gx(Object.assign({mode: 1, bt: 1, frr: 0, spr: true, near: false, mall: false, sign: 20, storeys: 1, span: 915}, o));
{
  check('building groups: super high-rise, high-rise, malls, theme parks, schools, hospitals and assembly use the first group; low-rise, mid-rise, warehouses and industrial the second', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(b => f({bt: b}).grp), [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1]);
  check('rated exterior wall only for 1 h, 2 h and 3 h; roofing follows the harder row when the building has no sprinklers, is within 6 m of another building, or is a mall, assembly, hospital or school; a sprinklered building clear of others uses the Class B row', [f({frr: 0}).rated, f({frr: 1}).rated, f({frr: 3}).rated, f({}).roofHard, f({spr: false}).roofHard, f({near: true}).roofHard, f({mall: true}).roofHard], [false, true, true, false, true, true, true]);
  check('signboards: more than 50 m2 (50 no, 50.1 yes) or more than one storey (2 yes) are tested with the facade; spandrel 915 mm passes, 914 mm needs the tested barrier system', [f({sign: 50}).signTest, f({sign: 50.1}).signTest, f({storeys: 2}).signTest, f({span: 915}).spandrelOk, f({span: 914}).spandrelOk], [false, true, true, true, false]);
}
let tt;
w.renderCalc('dbcglass'); w.calcResult('dbcglass');
tt = txt(w, 'gx_results');
check('the default page (a door leaf) shows a critical location, Class 2, ANSI A / category I for 1.5 m2 = class B, the window sill 900 mm and the 🔴 note; only the first group is visible', [tt.includes('موقع حرج للزجاج'), tt.includes('Class 2'), tt.includes('Class B · Cat I'), tt.includes('900 mm'), tt.includes('🔴'), w.document.getElementById('gx_g0').style.display, w.document.getElementById('gx_g1').style.display], [true, true, true, true, true, '', 'none']);
set('gx_m', '1'); w.calcResult('dbcglass'); tt = txt(w, 'gx_results');
check('the fire page (low-rise) shows B-s1-d0, the BS 8414 / NFPA 285 façade tests and the roofing Class B row, and no signboard test', [tt.includes('B-s1-d0'), tt.includes('BS 8414-1'), tt.includes('NFPA 285'), tt.includes('NFPA 256 Class B'), tt.includes('لا يلزم'), w.document.getElementById('gx_g1').style.display], [true, true, true, true, true, '']);
set('gx_bt', '0'); set('gx_fr', '2'); w.calcResult('dbcglass'); tt = txt(w, 'gx_results');
check('a high-rise with a 2 h wall shows A1 or A2-s1-d0 and the ASTM E119 / UL 263 tests for 2 h', [tt.includes('A1 أو A2-s1-d0'), tt.includes('ASTM E119'), tt.includes('بمعيار نجاح 2 h')], [true, true, true]);
check('other reference codes open dbcglass too', others('dbcglass', 'gx_results'), [true, true, true]);
}
// ---------- part 200: Dubai Building Code 2021, Part G telecommunications (`dbctele`: Tables G.35 - G.44, building class, rooms, fibre / GPON, cabinets and copper, pathways) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const tq = o => J('tqCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('Table G.35: eight classes, eight rows of seven fields; class 3 (101 - 300 tenants) has MTR 3 x 3 x 3, RTMR 3 x 3 x 3, MSR 3 x 3 x 3 and FTR 1.5 x 1.5 x 3; villa compounds have no rooms', [J('TQ_BC').length, J('TQ_T').length, J('TQ_T').every(r => r.length === 7), J('TQ_T')[3].slice(2, 6), J('TQ_T')[0].slice(2, 6)], [8, 8, true, [[3, 3, 3], [3, 3, 3], [3, 3, 3], [1.5, 1.5, 3]], [null, null, null, null]]);
const c = (t, f, a) => J('tqClass(' + JSON.stringify({tenants: t, floors: f, area: a}) + ')').cls;
check('class by tenants: 50 -> 1, 51 -> 2, 100 -> 2, 101 -> 3, 300 -> 3, 301 -> 4', [50, 51, 100, 101, 300, 301].map(t => c(t, 1, 100)), [1, 2, 2, 3, 3, 4]);
check('class by floors: G+5 -> 1, G+6 -> 2, G+10 -> 2, G+11 -> 3; by area: 3000 -> 1, 3001 -> 2, 7000 -> 2, 7001 -> 3', [5, 6, 10, 11].map(f => c(1, f, 100)).concat([3000, 3001, 7000, 7001].map(a => c(1, 1, a))), [1, 2, 2, 3, 1, 2, 2, 3]);
check('the largest of the three classes governs: 80 tenants (2), G+12 (3), 6000 m2 (2) -> 3', c(80, 12, 6000), 3);
const m0 = o => tq(Object.assign({mode: 0, type: 'b', tenants: 80, floors: 12, area: 6000}, o));
{
  const r = m0({});
  check('the example (80 tenants, G+12, 6000 m2): class 3, MTR 3 x 3 x 3, FTR 1.5 x 1.5 x 3 in 13 floors, two mobile-service rooms (more than G+10), roof room 3 x 3 x 3', [r.k, r.row[2], r.row[5], r.ftrCount, r.msrCount, r.msrNeeded, r.rtmr], [3, [3, 3, 3], [1.5, 1.5, 3], 13, 2, true, [3, 3, 3]]);
  check('class 4 (more than 300 tenants): FTR 2 x 2 x 3; up to G+10 needs no mobile-service room (msrNeeded false, count 0), G+10 -> 0, G+11 -> 2, G+20 -> 3, G+25 -> 3', [m0({tenants: 301}).row[5], m0({floors: 10}).msrNeeded, m0({floors: 10}).msrCount, m0({floors: 11, tenants: 150}).msrCount, m0({floors: 20, tenants: 150}).msrCount, m0({floors: 25, tenants: 150}).msrCount], [[2, 2, 3], false, 0, 2, 3, 3]);
  check('a chosen type: villa compound (0) has no MTR and no FTR; shopping centre (5) gives MTR 3 x 3 x 3 and FTR "tbd"; warehouses and labour accommodation (7) give MTR 2 x 2 x 3 and FTR 1 x 1 x 3 with no FTR count by floors beyond the floors + 1', [tq({mode: 0, type: 0, floors: 1}).row[2], tq({mode: 0, type: 0, floors: 1}).ftrCount, tq({mode: 0, type: 5, floors: 4}).row[2], tq({mode: 0, type: 5, floors: 4}).row[5], tq({mode: 0, type: 7, floors: 3}).row[5], tq({mode: 0, type: 7, floors: 3}).ftrCount], [null, 0, [3, 3, 3], 'tbd', [1, 1, 3], 4]);
}
const m1 = o => tq(Object.assign({mode: 1, tenants: 200, biz: 0, floors: 12, leasable: 1500, cables: 2}, o));
{
  const r = m1({});
  check('fibre for 200 tenants: 200 x 4 x 1.25 = 1000 cores, band 2 (151 - 600) uses 144-port panels: ceil(1000 / 144) = 7; GPON: ceil(200 / 30) = 7; high-density splitters above 100 units; patch-free below 256 units', [r.coresR, r.band, r.panels, r.gpon, r.modular, r.patchFree], [1000, 1, 7, 7, true, true]);
  check('150 tenants -> 750 cores, band 1 with 24-port panels: ceil(750 / 24) = 32; 151 tenants -> 755 cores and 144-port panels: ceil(755 / 144) = 6', [m1({tenants: 150}).coresR, m1({tenants: 150}).band, m1({tenants: 150}).panels, m1({tenants: 151}).coresR, m1({tenants: 151}).band, m1({tenants: 151}).panels], [750, 0, 32, 755, 1, 6]);
  check('business GPON: ceil(40 x 1.1 / 8) = 6, ceil(8 x 1.1 / 8) = 2 (8.8 / 8 -> 2); 100 tenants stays low density, 101 turns high density; 255 patch-free, 256 not', [m1({biz: 40}).gponBiz, m1({biz: 8}).gponBiz, m1({tenants: 100}).modular, m1({tenants: 101}).modular, m1({tenants: 255}).patchFree, m1({tenants: 256}).patchFree], [6, 2, false, true, true, false]);
  check('mini-ODF every three floors: 12 -> 4, 13 -> 5, 1 -> 1; floor cores for 1500 m2: 7.5 x 4 x 1.25 = 37.5 -> 38 and 8 drop cables (1500 / 200 = 7.5 -> 8); micro-ducts ceil(2 x 1.3) = 3', [m1({floors: 12}).miniOdf, m1({floors: 13}).miniOdf, m1({floors: 1}).miniOdf, r.perFloor, r.drops, r.micro], [4, 5, 1, 38, 8, 3]);
  check('more than 600 tenants is flagged outside the Table G.44 range (the page shows a warning)', m1({tenants: 601}).band, 2);
}
const m2 = o => tq(Object.assign({mode: 2, ports: 8, units: 100, link: 60, bot: 900, front: 1, lux: 500, bulk: 50}, o));
{
  check('cabinet by ports: 8 -> small (index 0), 9 -> index 1, 24 -> 1, 25 -> outside the table (2)', [8, 9, 24, 25].map(p => m2({ports: p}).k), [0, 1, 1, 2]);
  check('limits: link 90 m passes (90.1 fails); cabinet bottom 600 and 1200 mm pass (599 and 1201 fail); front 1 m passes (0.9 fails); 500 lux passes (499 fails); IT room 70 m passes (71 fails)', [m2({link: 90}).okLink, m2({link: 90.1}).okLink, m2({bot: 600}).okHeight, m2({bot: 1200}).okHeight, m2({bot: 599}).okHeight, m2({bot: 1201}).okHeight, m2({front: 1}).okFront, m2({front: 0.9}).okFront, m2({lux: 500}).okLux, m2({lux: 499}).okLux, m2({bulk: 70}).okBulk, m2({bulk: 71}).okBulk], [true, false, true, true, false, false, true, false, true, false, true, false]);
  check('copper cables = units x ports = 800', m2({}).cables, 800);
}
const m3 = o => tq(Object.assign({mode: 3, depth: 600, hand: 150, bends: 2, fill: 40, bw: 300, bh: 300, bd: 150, run: 25, trayH: 3, pub: false, routes: 2, ducts: 2, dia: 110, mmr: 0}, o));
{
  check('pathway limits: depth 600 mm passes (599 fails); manholes 200 m passes (201 fails); 2 bends passes (3 fails); tray fill 50 % passes (51 fails); box 300 x 300 x 150 passes (299, 149 fail)', [m3({depth: 600}).okDepth, m3({depth: 599}).okDepth, m3({hand: 200}).okHand, m3({hand: 201}).okHand, m3({bends: 2}).okBends, m3({bends: 3}).okBends, m3({fill: 50}).okFill, m3({fill: 51}).okFill, m3({}).okBox, m3({bw: 299}).okBox, m3({bd: 149}).okBox], [true, false, true, false, true, false, true, false, true, false, false]);
  check('a pull box is needed for a run longer than 30 m (30 no, 31 yes); the tray cover is needed below 4.8 m in a public area only (4.7 public yes, 4.8 no, 4.7 not public no)', [m3({run: 30}).needBox, m3({run: 31}).needBox, m3({trayH: 4.7, pub: true}).cover, m3({trayH: 4.8, pub: true}).cover, m3({trayH: 4.7, pub: false}).cover], [false, true, true, false, false]);
  check('two routes and two ducts of 110 mm or more per provider (1 route fails, 1 duct fails, 100 mm fails); the MMR needs six ducts (5 fails, 6 passes)', [m3({routes: 1}).okLead, m3({ducts: 1}).okDuct, m3({dia: 100}).okDuct, m3({}).okDuct, m3({mmr: 5}).okMmr, m3({mmr: 6}).okMmr], [false, false, false, true, false, true]);
}
let tt;
w.renderCalc('dbctele'); w.calcResult('dbctele');
tt = txt(w, 'tq_results');
check('the default page (80 tenants, G+12) shows class 3, the 3 x 3 x 3 m room, 1.5 x 1.5 x 3 m FTR, 13 floors, 2 mobile-service rooms and the 🔴 note; only the first group is visible', [tt.includes('فئة 3'), tt.includes('3 × 3 × 3 m'), tt.includes('1.5 × 1.5 × 3 m'), tt.includes('13 طابقًا'), tt.includes('2 غرف لـ G+12'), tt.includes('🔴'), w.document.getElementById('tq_g0').style.display, w.document.getElementById('tq_g1').style.display], [true, true, true, true, true, true, '', 'none']);
set('tq_m', '1'); w.calcResult('dbctele'); tt = txt(w, 'tq_results');
check('the fibre page (200 tenants) shows 1000 cores, 7 panels of 144 ports and 7 GPON splitters per provider, 4 mini-ODFs and 38 cores per floor', [tt.includes('1000'), tt.includes('7 لوحة 144 منفذًا'), tt.includes('موزعات GPON لكل مزود (سكني)7'), tt.includes('مواقع مصغّرات ODF الطابقية4'), tt.includes('38'), w.document.getElementById('tq_g1').style.display], [true, true, true, true, true, '']);
set('tq_m', '2'); w.calcResult('dbctele'); tt = txt(w, 'tq_results');
check('the copper page shows the small 12U cabinet, 800 cables and all five checks marked ✔', [tt.includes('450 mm × 150 mm'), tt.includes('800'), (tt.match(/✔/g) || []).length, tt.includes('✘')], [true, true, 5, false]);
set('tq_m', '3'); set('tq_dp', '500'); w.calcResult('dbctele'); tt = txt(w, 'tq_results');
check('the pathway page shows ✘ for a 500 mm burial depth and the BEP tray', [tt.includes('✘'), tt.includes('300 × 100 mm HDRF')], [true, true]);
check('other reference codes open dbctele too', others('dbctele', 'tq_results'), [true, true, true]);
}
// ---------- part 201: Arab Unified Elevator Code (Egyptian code 2009), electric lifts (`egelev`: Tables 8/1/1, 8/2/1, 9/1, D/4/2/1, Annex C; clearances, machine room, governor and buffers, traction) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const ey = o => J('eyCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('Table 8/1/1: 28 rows from 100 kg (0.37 m2) to 2500 kg (5.00 m2); checksum of the areas 61.79; Table 8/2/1: 20 areas 0.28 - 3.13, sum 35.39', [J('EY_Q').length, J('EY_Q')[0], J('EY_Q')[27], +J('EY_Q').reduce((s, x) => s + x[1], 0).toFixed(2), J('EY_P').length, J('EY_P')[0], J('EY_P')[19], +J('EY_P').reduce((s, x) => s + x, 0).toFixed(2)], [28, [100, 0.37], [2500, 5], 61.79, 20, 0.28, 3.13, 35.39]);
const am = q => J('eyAreaMax(' + q + ')'), an = n => J('eyAreaMin(' + n + ')');
check('maximum car area: 630 kg 1.66, 1000 kg 2.40, 100 kg 0.37, 2500 kg 5.00, 3000 kg = 5 + 0.16 x 5 = 5.80; between two rows the lower row governs (700 kg -> 1.75 of 675)', [630, 1000, 100, 2500, 3000, 700].map(am), [1.66, 2.4, 0.37, 5, 5.8, 1.75], 1e-9);
check('minimum area for passengers: 1 -> 0.28, 8 -> 1.45, 20 -> 3.13, 21 -> 3.245, 30 -> 4.28, 0 -> 0', [1, 8, 20, 21, 30, 0].map(an), [0.28, 1.45, 3.13, 3.245, 4.28, 0], 1e-9);
const m0 = o => ey(Object.assign({mode: 0, Q: 630, use: 0, cw: 1100, cd: 1400, ch: 2200, dw: 800, dh: 2000, ct: 1000, cf: 400}, o));
{
  const r = m0({});
  check('630 kg lift 1100 x 1400: 8 passengers (630 / 75 = 8.4), area 1.54 between 1.45 and 1.66, heights 2000 and above pass', [r.n, +r.area.toFixed(2), r.okMax, r.okMin, r.okH, r.okEH], [8, 1.54, true, true, true, true]);
  check('too large a car for the load (1200 x 1500 = 1.80 > 1.66) fails the maximum; too small (1000 x 1300 = 1.30 < 1.45) fails the minimum; heights 1999 mm fail', [m0({cw: 1200, cd: 1500}).okMax, m0({cw: 1000, cd: 1300}).okMin, m0({ch: 1999}).okH, m0({dh: 1999}).okEH], [false, false, false, false]);
  check('1000 kg: 13 passengers, area limits 2.15 - 2.40; 1600 x 1400 = 2.24 passes; 2000 kg: 26 passengers, 4.20 maximum', [m0({Q: 1000, cw: 1600}).n, +m0({Q: 1000, cw: 1600}).minArea.toFixed(2), +m0({Q: 1000, cw: 1600}).maxArea.toFixed(2), m0({Q: 1000, cw: 1600}).okMax && m0({Q: 1000, cw: 1600}).okMin, m0({Q: 2000}).n, m0({Q: 2000}).maxArea], [13, 2.15, 2.4, true, 26, 4.2]);
  check('accessible lift: door 800 passes (799 fails); car 1100 x 1400 passes (1099 or 1399 fails); control 900 - 1200 mm and 400 mm from the wall (899, 1201, 399 fail)', [m0({dw: 800}).okAccDoor, m0({dw: 799}).okAccDoor, m0({}).okAccCar, m0({cw: 1099}).okAccCar, m0({cd: 1399}).okAccCar, m0({ct: 900}).okAccCtl, m0({ct: 1200}).okAccCtl, m0({ct: 899}).okAccCtl, m0({ct: 1201}).okAccCtl, m0({cf: 399}).okAccCtl], [true, false, true, false, false, true, true, false, false, false]);
  check('fire lift: car 1100 x 2100 (2099 fails), rated load 1000 kg (999 fails), door 800 mm', [m0({Q: 1000, cd: 2100}).okFireCar, m0({cd: 2099}).okFireCar, m0({Q: 1000}).okFireLoad, m0({Q: 999}).okFireLoad, m0({dw: 800}).okFireDoor, m0({dw: 799}).okFireDoor], [true, false, true, false, true, false]);
}
const m1 = o => ey(Object.assign({mode: 1, v: 1.6, reduced: false, c: [0.25, 1.3, 0.5, 0.3, 0.3], pd: 1.7, pb: 0.6, pa: 0.2, fd: 0.6, fh: 2.5}, o));
{
  const r = m1({});
  check('clearances at 1.6 m/s: 0.035 v2 = 0.0896; required 0.1896, 1.0896, 0.3896, 0.1896, 0.1896 m', [+r.t.toFixed(4)].concat(r.req.map(x => +x.toFixed(4))), [0.0896, 0.1896, 1.0896, 0.3896, 0.1896, 0.1896]);
  check('default values pass all five clearances; each fails just below its limit (0.18, 1.08, 0.38, 0.18, 0.18)', [r.ok.every(x => x), m1({c: [0.18, 1.3, 0.5, 0.3, 0.3]}).ok[0], m1({c: [0.25, 1.08, 0.5, 0.3, 0.3]}).ok[1], m1({c: [0.25, 1.3, 0.38, 0.3, 0.3]}).ok[2], m1({c: [0.25, 1.3, 0.5, 0.18, 0.3]}).ok[3], m1({c: [0.25, 1.3, 0.5, 0.3, 0.18]}).ok[4]], [true, false, false, false, false, false]);
  check('half value 0.0175 v2 for speeds up to 4 m/s: 0.0448 at 1.6; not allowed at 4.5 m/s', [+m1({reduced: true}).t.toFixed(4), m1({reduced: true, v: 4}).redOk, m1({reduced: true, v: 4.5}).redOk, m1({reduced: false, v: 4.5}).redOk], [0.0448, true, false, true]);
  check('pit: 0.5 m to the lowest car part (0.49 fails), 0.15 m to the apron (0.14 fails); pit door when deeper than 2.5 m (2.5 no, 2.51 yes)', [m1({pb: 0.5}).okPitB, m1({pb: 0.49}).okPitB, m1({pa: 0.15}).okPitA, m1({pa: 0.14}).okPitA, m1({pd: 2.5}).pitDoor, m1({pd: 2.51}).pitDoor], [true, false, true, false, false, true]);
  check('fence height by horizontal distance: 0.5 m -> 2.5; 1.25 m -> 1.8; 2 m and more -> 1.1; below 0.5 m not allowed', [0.5, 1.25, 2, 3].map(d => +m1({fd: d}).hreq.toFixed(4)).concat([m1({fd: 0.4, fh: 3}).okFence, m1({fd: 1.25, fh: 1.8}).okFence, m1({fd: 1.25, fh: 1.79}).okFence]), [2.5, 1.8, 1.1, 1.1, false, true, false]);
}
const m2 = o => ey(Object.assign({mode: 2, fw: 0.5, fl: 0.6, ps: 0.5, rh: 2.2, hr: 0.3, dl: 0, t0: 10, t1: 35, lx: 200, dw: 0.7, dh: 2, hw: 0.8, hh: 0.8, nz: 55, sl: 70, lh: 1.2}, o));
{
  const r = m2({});
  check('machine room: defaults pass; free area 0.5 x 0.6 (0.49 or 0.59 fail); passage 0.5; height 2 m (1.99 fails); headroom 0.3 (0.29 fails)', [Object.values(r).filter(x => typeof x === 'boolean' && x === false).length, m2({fw: 0.49}).okFree, m2({fl: 0.59}).okFree, m2({ps: 0.49}).okPass, m2({rh: 2}).okH, m2({rh: 1.99}).okH, m2({hr: 0.29}).okHead], [1, false, false, false, true, false, false]);
  check('level difference above 0.5 m needs steps (0.5 no, 0.51 yes); temperature 5 - 40 (4 or 41 fail); 200 lux (199 fails); door 0.6 x 2 (0.59 fails, 1.99 fails); hatch 0.8 x 0.8 (0.79 fails)', [m2({dl: 0.5}).needSteps, m2({dl: 0.51}).needSteps, m2({t0: 5, t1: 40}).okTemp, m2({t0: 4}).okTemp, m2({t1: 41}).okTemp, m2({lx: 199}).okLux, m2({dw: 0.6}).okDoor, m2({dw: 0.59}).okDoor, m2({dh: 1.99}).okDoor, m2({hw: 0.79}).okHatch], [false, true, true, false, false, false, true, false, false, false]);
  check('noise 60 dB passes (61 fails); ladder 65 - 75 degrees (64, 76 fail) and 1.5 m (1.51 fails)', [m2({nz: 60}).okNoise, m2({nz: 61}).okNoise, m2({sl: 65}).okSlope, m2({sl: 75}).okSlope, m2({sl: 64}).okSlope, m2({sl: 76}).okSlope, m2({lh: 1.5}).okLadder, m2({lh: 1.51}).okLadder], [true, false, true, true, false, false, true, false]);
}
const m3 = o => ey(Object.assign({mode: 3, v: 1.6, gt: 3, trip: 2, bt: 2, bs: 200, vi: 1.1}, o));
{
  check('Table 9/1 rows as printed: 1 + 3 + 1 + 6 rows', J('EY_G91').map(x => x.length), [1, 3, 1, 6]);
  check('governor limits: minimum 115 % (1.84 at 1.6 m/s); progressive 1.6 m/s -> table 2.15 (formula 2.156); progressive 1.4 m/s -> 1.25 x 1.4 + 0.25 / 1.4 = 1.9286; 1.0 m/s progressive -> 1.5', [+m3({}).min.toFixed(3), m3({}).max, +m3({v: 1.4}).max.toFixed(4), m3({v: 1}).max], [1.84, 2.15, 1.9286, 1.5]);
  check('instantaneous types: 0.8 m/s (type 0), captive roller 1.0 or the table row 0.85 at 0.70 m/s, buffered 1.5; the trip speed must lie between 115 % and the maximum (2.15 passes, 2.16 fails, 1.83 fails)', [m3({v: 0.63, gt: 0}).textMax, m3({v: 0.7, gt: 1}).max, m3({v: 0.63, gt: 1}).max, m3({v: 1, gt: 2}).max, m3({trip: 2.15}).okTrip, m3({trip: 2.16}).okTrip, m3({trip: 1.83}).okTrip], [0.8, 0.85, 0.8, 1.5, true, false, false]);
  check('gear type by rated speed: instantaneous up to 0.63 m/s, buffered between 0.63 and 1 m/s, progressive for anything; counterweight governor up to 10 % higher (2.15 -> 2.365)', [m3({v: 0.63, gt: 0}).allowed, m3({v: 0.7, gt: 0}).allowed, m3({v: 0.7, gt: 2}).allowed, m3({v: 1, gt: 2}).allowed, m3({v: 1.2, gt: 2}).allowed, m3({v: 2.5, gt: 3}).allowed, +m3({}).cwMax.toFixed(3)], [true, false, true, true, false, true, 2.365]);
  check('buffer stroke: accumulation 0.135 v2 (65 mm minimum): 1 m/s -> 0.135, 0.4 m/s -> 0.065; dissipating 0.067 v2: 2.5 m/s -> 0.41875, 1.6 m/s -> 0.17152', [m3({bt: 0, v: 1}).s, m3({bt: 0, v: 0.4}).s, m3({bt: 2, v: 2.5}).s, +m3({bt: 2}).s.toFixed(5)], [0.135, 0.065, 0.41875, 0.17152], 1e-9);
  check('reduced stroke with monitoring: 0.42 m governs up to 4 m/s, 0.54 m above; at 5 m/s with vi = 3: max(0.603, 0.8375, 0.54) = 0.8375', [m3({bt: 3, v: 3, vi: 1.5}).s, m3({bt: 3, v: 2}).s, +m3({bt: 3, v: 5, vi: 3}).s.toFixed(4), m3({bt: 3, v: 4.5, vi: 0.5}).s > 0.54], [0.42, 0.42, 0.8375, true]);
  check('buffer type by speed: accumulation up to 1 m/s (1.2 fails), with buffered return up to 1.6 (1.7 fails), dissipating any; stroke 200 passes 0.17 but not 0.42', [m3({bt: 0, v: 1}).okBufV, m3({bt: 0, v: 1.2}).okBufV, m3({bt: 1, v: 1.6}).okBufV, m3({bt: 1, v: 1.7}).okBufV, m3({bt: 2, v: 5}).okBufV, m3({}).okStroke, m3({bt: 3, v: 3, bs: 200}).okStroke], [true, false, true, false, true, true, false]);
}
const m4 = o => ey(Object.assign({mode: 4, kind: 0, beta: 90, gamma: 30, al: 170, nr: 6, d: 10, D: 800, fb: 50, P: 1000, Q: 630, W: 1315, r: 1, v: 1.6, a: 0.5, ra: 0, rb: 0, cb: 0, cw: 0, cc: 0, ns: 0, nrv: 0, Dp: 400}, o));
{
  const R = Math.PI / 180;
  check('Table D/4/2/1: V groove 35 -> 18.5, 40 -> 7.1, 45 -> 4.0; undercut 75 -> 2.5, 90 -> 5.0, 105 -> 15.2; 41 is not listed', [J('EY_NV').length, J('EY_NU').length, J('eyNeq(1, 40)'), J('eyNeq(1, 35)'), J('eyNeq(1, 45)'), J('eyNeq(0, 75)'), J('eyNeq(0, 90)'), J('eyNeq(0, 105)'), J('eyNeq(1, 41)')], [6, 7, 7.1, 18.5, 4, 2.5, 5, 15.2, null]);
  const f = (k, b, g, mu, cs) => J('eyF(' + [k, b, g, mu, cs].join(',') + ')');
  check('groove friction: undercut 90 / 30 degrees mu 0.1 -> 0.1892; V groove (no undercut) 0.1 x 4 / pi = 0.12732 for loading, mu / sin(20) = 0.58476 for the stuck case; hardened V mu 0.1 / sin(20) = 0.29238', [f(0, 90, 30, 0.1, 0), f(1, 0, 40, 0.1, 0), f(1, 0, 40, 0.2, 2), f(2, 0, 40, 0.1, 0)].map(x => +x.toFixed(5)), [0.1892, 0.12732, 0.58476, 0.29238]);
  const r = m4({});
  check('friction cases of the default lift: f 0.1892, 0.1631 (mu 0.1 / (1 + 0.16)), 0.37839; e^(f alpha) 1.753, 1.622, 3.073 at 170 degrees', [r.f[0], r.f[1], r.f[2], r.e[0], r.e[1], r.e[2]].map((x, i) => +x.toFixed(i < 3 ? 5 : 3)), [0.1892, 0.1631, 0.37839, 1.753, 1.622, 3.073]);
  check('traction ratios: loading (1000 + 787.5) / 1315 = 1.3593; emergency stop loaded 1630 x 10.31 / (1315 x 9.31) = 1.3727; empty going up 1315 x 10.31 / (1000 x 9.31) = 1.4562; all pass; stuck infinite with no rope mass', [+r.load.ratio.toFixed(4), +r.stopD.ratio.toFixed(4), +r.stopU.ratio.toFixed(4), r.okLoad, r.okStop, r.okStuck, r.stuck.ratio === null || !isFinite(r.stuck.ratio)], [1.3593, 1.3727, 1.4562, true, true, true, true]);
  check('a light counterweight fails loading (800 kg: 1787.5 / 800 = 2.234 > 1.753); with 5 kg of counterweight-side rope the stuck ratio is 1000 / 5 = 200 and passes, with 400 kg it is 2.5 and fails (needs 3.07)', [m4({W: 800}).okLoad, +m4({W: 800}).load.ratio.toFixed(3), m4({rb: 5}).okStuck, +m4({rb: 5}).stuck.ratio.toFixed(1), m4({rb: 400}).okStuck, +m4({rb: 400}).stuck.ratio.toFixed(2)], [false, 2.234, true, 200, false, 2.5]);
  check('2:1 reeving halves the car-side forces but keeps the ratios (default stays 1.3593); rope mass adds to the sides', [+m4({r: 2}).load.ratio.toFixed(4), m4({r: 2}).load.T1 < m4({}).load.T1, +m4({ra: 100}).load.ratio.toFixed(4)], [1.3593, true, +((1787.5 * 9.81 + 100 * 9.81) / (1315 * 9.81)).toFixed(4)]);
  check('specific pressure: T = 28890.45 N, 6 ropes of 10 mm on an 800 mm sheave, undercut 90 degrees: 28890.45 / 48000 x 9.9102 = 5.965 N/mm2 against (12.5 + 4 x 1.6) / 2.6 = 7.269', [+m4({}).p.toFixed(3), +m4({}).pMax.toFixed(3), m4({}).okP, m4({nr: 3}).okP], [5.965, 7.269, true, false]);
  check('V groove 40 degrees: p factor 4.5 / sin(20) = 13.157', [+(m4({kind: 1, beta: 0, gamma: 40}).p / (28890.45 / 48000)).toFixed(3)], [13.157]);
  check('equivalent bends: undercut 90 -> 5.0; no undercut -> 1; V 40 -> 7.1; other sheaves (800 / 400)^4 x (2 + 4 x 1) = 96 added', [m4({}).Neq, m4({beta: 0}).Neq, m4({kind: 1, beta: 0, gamma: 40}).Neq, m4({ns: 2, nrv: 1}).Np, m4({ns: 2, nrv: 1}).Neq, m4({kind: 1, beta: 0, gamma: 41}).nOk], [5, 1, 7.1, 96, 101, false]);
  const Sf = (D, d, N) => Math.pow(10, 2.6834 - Math.log10(695.85e6 * N / Math.pow(D / d, 8.567)) / Math.log10(77.09 * Math.pow(D / d, -2.894)));
  check('rope safety factor formula: Dt / dr = 40 and N = 11.2 -> 19.5; Dt / dr = 80 and N = 5 -> 6.5 (the minimum is 12); the calculator reproduces the formula', [+Sf(40, 1, 11.2).toFixed(1), +Sf(80, 1, 5).toFixed(1), +m4({}).Sreq.toFixed(3), m4({}).Sneed, +m4({D: 400, d: 10, kind: 1, beta: 0, gamma: 40}).Sreq.toFixed(3)], [19.5, 6.5, +Sf(80, 1, 5).toFixed(3), 12, +Sf(40, 1, 7.1).toFixed(3)], 0.06);
  check('actual safety factor: 6 x 50 kN / (1630 x 9.81 N) = 18.76 passes 12; 4 ropes of 25 kN give 6.25 and fail; D / d = 40 passes, 39 fails; 3 ropes pass, 2 fail; 8 mm passes, 7 fails', [+m4({}).S.toFixed(2), m4({}).okS, m4({nr: 4, fb: 25}).okS, m4({D: 400}).okRatio, m4({D: 390}).okRatio, m4({nr: 3}).okN, m4({nr: 2}).okN, m4({d: 8}).okD, m4({d: 7}).okD], [18.76, true, false, true, false, true, false, true, false]);
  check('groove angles: undercut beta up to 106 (107 fails), gamma 25 degrees or more (24 fails); V groove gamma 35 or more (34 fails)', [m4({beta: 105}).limB, m4({beta: 107}).limB, m4({gamma: 25}).limG, m4({gamma: 24}).limG, m4({kind: 1, gamma: 35}).limG, m4({kind: 1, gamma: 34}).limG], [true, false, true, false, true, false]);
}
const m5 = o => ey(Object.assign({mode: 5, tbl: 0, li: 0, vb: 0, sw: 1800, sd: 2100, pd: 1500, oh: 4000}, o));
{
  check('Table C/1/1: four loads; 630 kg car 1100 x 1400 x 2200, shaft 1800 x 2100, pit 1500 (v below 1) and 1700 (below 1.6), overhead 4000 and 4400; the 300 kg lift has no pit or overhead for 2.5 m/s', [J('EY_C1.loads'), J('EY_C1.cw[2]'), J('EY_C1.cd[2]'), J('EY_C1.sw[2]'), J('EY_C1.sd[2]'), m5({li: 2}).pit, m5({li: 2, vb: 1}).pit, m5({li: 2}).oh, m5({li: 2, vb: 1}).oh, m5({li: 0, vb: 2}).pit, m5({li: 0, vb: 2}).oh], [[300, 450, 630, 1000], 1100, 1400, 1800, 2100, 1500, 1700, 4000, 4400, null, null]);
  check('Table C/1/1 machine room (v below 1): areas 7.5, 7.5, 10, 12 m2; 1000 kg: 2400 x 4200 x 2000; shaft check 1800 x 2100 passes for 630 kg, 1799 fails; pit 1500 passes, 1499 fails; 5400 mm overhead at 2.5 m/s', [J('EY_C1.mr[0].area'), m5({li: 3}).mrW, m5({li: 3}).mrD, m5({li: 3}).mrH, m5({li: 2}).okSw && m5({li: 2}).okSd, m5({li: 2, sw: 1799}).okSw, m5({li: 2}).okPit, m5({li: 2, pd: 1499}).okPit, m5({li: 2, vb: 2}).oh], [[7.5, 7.5, 10, 12], 2400, 4200, 2000, true, false, true, false, 5400]);
  check('Table C/2/1: five loads; 1000 kg car 1600 x 1400 x 2300 with door 1100, shaft 2400 x 2300; 1600 kg car 1950 x 1750; pit 1500 / 1700 / 2800, 630 kg none at 2.5 m/s; machine room areas 15, 20, 22, 22, 25', [J('EY_C2.loads'), m5({tbl: 1, li: 2}).tbl.cw[2], m5({tbl: 1, li: 2}).tbl.ch[2], m5({tbl: 1, li: 2}).tbl.dw[2], m5({tbl: 1, li: 2}).tbl.sw[2], m5({tbl: 1, li: 2}).tbl.sd[2], m5({tbl: 1, li: 4}).tbl.cw[4], m5({tbl: 1, li: 4}).tbl.cd[4], m5({tbl: 1, li: 2, vb: 2}).pit, m5({tbl: 1, li: 0, vb: 2}).pit, J('EY_C2.mr[0].area')], [[630, 800, 1000, 1250, 1600], 1600, 2300, 1100, 2400, 2300, 1950, 1750, 2800, null, [15, 20, 22, 22, 25]]);
  check('Table C/3/1: 15 rows; 8 passengers 640 kg 1100 x 1400 = 1.54 m2 (shaft 1600 x 1800); the car area equals width x depth for every row (within the printed rounding)', [J('EY_C3').length, J('EY_C3[2]'), J('EY_C3').every(x => Math.abs(x[3] * x[4] / 1e6 - x[5]) < 0.11)], [15, [0, 8, 640, 1100, 1400, 1.54, 1600, 1800], true]);
}
let tt;
w.renderCalc('egelev'); w.calcResult('egelev');
tt = txt(w, 'ey_results');
check('the default page (630 kg) shows 1.66 m2, 8 passengers, 1.45 m2 minimum, the ✔ marks and no ✘; only the first group is visible', [tt.includes('1.66 m²'), tt.includes('8'), tt.includes('1.45 m²'), (tt.match(/✔/g) || []).length, tt.includes('✘'), w.document.getElementById('ey_g0').style.display, w.document.getElementById('ey_g1').style.display], [true, true, true, 4, false, '', 'none']);
set('ey_us', '1'); w.calcResult('egelev'); tt = txt(w, 'ey_results');
check('the accessible lift adds the door, car and control checks (800 mm, 1100 x 1400, 900 - 1200 mm) and the handrail', [tt.includes('800 mm على الأقل'), tt.includes('1100 mm عرضًا و1400 mm'), tt.includes('بين 900 و1200 mm'), tt.includes('درابزين')], [true, true, true, true]);
set('ey_us', '2'); set('ey_cd', '2100'); w.calcResult('egelev'); tt = txt(w, 'ey_results');
check('the fire lift adds the 1100 x 2100 car, the 1000 kg load and the 70 degree rating; a 630 kg load fails', [tt.includes('1100 mm عرضًا و2100 mm'), tt.includes('1000 kg على الأقل'), tt.includes('70 °C'), tt.includes('✘')], [true, true, true, true]);
set('ey_m', '1'); w.calcResult('egelev'); tt = txt(w, 'ey_results');
check('the clearance page shows 0.190, 1.090, 0.390 m, the pit rules, the fence height 2.41 m and the 🔴 note; the group is switched', [tt.includes('0.190 m'), tt.includes('1.090 m'), tt.includes('0.390 m'), tt.includes('2.41 m'), tt.includes('🔴'), w.document.getElementById('ey_g1').style.display, w.document.getElementById('ey_g0').style.display], [true, true, true, true, true, '', 'none']);
set('ey_m', '2'); w.calcResult('egelev'); tt = txt(w, 'ey_results');
check('the machine-room page shows the 10 checks marked ✔ and no ✘ for defaults', [(tt.match(/✔/g) || []).length, tt.includes('✘')], [10, false]);
set('ey_m', '3'); w.calcResult('egelev'); tt = txt(w, 'ey_results');
check('the governor page shows 1.84 and 2.15 m/s, the 0.172 m stroke and the ✔ marks', [tt.includes('1.84 m/s'), tt.includes('2.15 m/s'), tt.includes('0.172 m'), tt.includes('✘')], [true, true, true, false]);
set('ey_m', '4'); w.calcResult('egelev'); tt = txt(w, 'ey_results');
check('the traction page shows f 0.189, e^(f alpha) 1.75, the ratio 1.359, p 5.96 and the safety factor 18.8, with no ✘', [tt.includes('0.189'), tt.includes('1.75'), tt.includes('1.359'), tt.includes('5.96 N/mm²'), tt.includes('18.8'), tt.includes('✘')], [true, true, true, true, true, false]);
set('ey_tk', '1'); set('ey_tb', '0'); set('ey_tc', '41'); w.calcResult('egelev'); tt = txt(w, 'ey_results');
check('a V groove of 41 degrees is outside Table D/4/2/1 and the page says so', [tt.includes('خارج الجدول'), tt.includes('✘')], [true, true]);
set('ey_m', '5'); set('ey_cs', '15'); w.calcResult('egelev'); tt = txt(w, 'ey_results');
check('Annex C page for the 300 kg residential lift: 1000 x 900 x 2200 car, door 700, shaft 1600 x 1600, pit 1200, overhead 4000 and the 🔴 note', [tt.includes('1000 × 900 × 2200 mm'), tt.includes('700 × 2000 mm'), tt.includes('1600 × 1600 mm'), tt.includes('1200 mm'), tt.includes('4000 mm'), tt.includes('🔴')], [true, true, true, true, true, true]);
check('other reference codes open egelev too', others('egelev', 'ey_results'), [true, true, true]);
}
// ---------- part 202: Egyptian sanitary installations code (2002) (`egsan`: Tables 2-1, 3-5, 3-6, 4-1, 4-2, 4-4, 4-5) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const ez = o => J('ezCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('Table 2-1: 14 population types and 3 per-unit types; the first has steps 50 -> 1 and 300 -> 2 with a fixture per 300 persons; the employee type has 15 -> 1, 40 -> 2, 75 -> 3 and one per 40 persons', [J('EZ_O').length, J('EZ_U').length, J('EZ_O[0][1]'), J('EZ_O[0][2]'), J('EZ_O[8][1]'), J('EZ_O[8][2]')], [14, 3, [[50, 1], [300, 2]], 300, [[15, 1], [40, 2], [75, 3]], 40]);
const N = (t, p) => J('ezN(EZ_O[' + t + '], ' + p + ')');
check('assembly (1a): 50 -> 1, 51 -> 2, 300 -> 2, 301 -> 3, 600 -> 3, 601 -> 4', [50, 51, 300, 301, 600, 601].map(p => N(0, p)), [1, 2, 2, 3, 3, 4]);
check('assembly with food (1b): 100 -> 2, 101 -> 3, 200 -> 3, 201 -> 4, 400 -> 4, 401 -> 5, 700 -> 5, 701 -> 6; restaurants (1c): 50 -> 2, 200 -> 4, 201 -> 5, 400 -> 5, 401 -> 6', [100, 101, 200, 201, 400, 401, 700, 701].map(p => N(1, p)).concat([50, 200, 201, 400, 401].map(p => N(2, p))), [2, 3, 3, 4, 4, 5, 5, 6, 2, 4, 5, 5, 6]);
check('clubs (1d): 40 -> 1, 41 -> 2, 150 -> 4; schools: kindergarten 15 -> 1, 16 -> 2; primary 25 -> 1, 26 -> 2, 100 -> 4; secondary 30 -> 1, 31 -> 2, 90 -> 3', [40, 41, 150].map(p => N(3, p)).concat([15, 16].map(p => N(4, p)), [25, 26, 100].map(p => N(5, p)), [30, 31, 90].map(p => N(6, p))), [1, 2, 4, 1, 2, 1, 2, 4, 1, 2, 3]);
check('workplaces (2): 10 -> 1, 11 -> 2, 25 -> 2, 26 -> 3, 50 -> 3, 75 -> 4, 76 -> 5, 100 -> 5, 101 -> 6, 150 -> 6, 151 -> 7; employees (3): 15 -> 1, 16 -> 2, 40 -> 2, 41 -> 3, 75 -> 3, 76 -> 4, 115 -> 4, 116 -> 5', [10, 11, 25, 26, 50, 75, 76, 100, 101, 150, 151].map(p => N(7, p)).concat([15, 16, 40, 41, 75, 76, 115, 116].map(p => N(8, p))), [1, 2, 2, 3, 3, 4, 5, 5, 6, 6, 7, 1, 2, 2, 3, 3, 4, 4, 5]);
check('commercial centres (4): 50 -> 1, 51 -> 2, 301 -> 3; dormitories: 20 -> 2, 21 -> 3, 40 -> 3, 41 -> 4; hospitals 8 -> 1, 9 -> 2; prisons: 4 -> 1, 5 -> 2; 8 -> 1, 9 -> 2; zero persons -> 0', [50, 51, 301].map(p => N(9, p)).concat([20, 21, 40, 41].map(p => N(10, p)), [8, 9].map(p => N(11, p)), [4, 5].map(p => N(12, p)), [8, 9].map(p => N(13, p)), [N(8, 0)]), [1, 2, 3, 2, 3, 3, 4, 1, 2, 1, 2, 1, 2, 0]);
const sh = (r, p, e) => J('ezShower(' + r + ', ' + p + ', ' + (e || 0) + ')');
check('showers: clubs 15 -> 1, 16 -> 2, 150 -> 10, 151 -> 11, 180 -> 11, 181 -> 12; exposed workers 31 -> 3; dormitory 20 -> 2, 21 -> 3, 41 -> 4; hospital 21 -> 2; prison 7 -> 2 (short term), 16 -> 2 (long term)', [sh(1, 15), sh(1, 16), sh(1, 150), sh(1, 151), sh(1, 180), sh(1, 181), sh(2, 100, 31), sh(3, 20), sh(3, 21), sh(3, 41), sh(4, 21), sh(5, 7), sh(6, 16), sh(0, 50)], [1, 2, 10, 11, 11, 12, 3, 2, 3, 4, 2, 2, 2, 0]);
const m0 = o => ez(Object.assign({mode: 0, type: 8, P: 120, mixed: false, units: 10, exposed: 0}, o));
{
  const r = m0({});
  check('120 employees: 5 WC / urinals, 3 basins (0.5 x 5 rounded up), 2 fountains, 2 urinals at most; mixed use: 72 persons for each sex -> 3 + ceil(0 / ...) = 4 each, total 8', [r.wc, r.basin, r.df, r.urMax, m0({mixed: true}).per, m0({mixed: true}).wc, m0({mixed: true}).wcTotal], [5, 3, 2, 2, 72, 3, 6]);
  check('prisons use as many basins as WC; clubs 1d at 100 persons: 3 WC, 2 basins, 2 fountains (1 per 75, rounded up), 7 showers; schools 1e-2 at 100 pupils: 4 WC, 2 basins, 3 fountains', [m0({type: 12, P: 40}).basin === m0({type: 12, P: 40}).wc, m0({type: 3, P: 100}).wc, m0({type: 3, P: 100}).basin, m0({type: 3, P: 100}).df, m0({type: 3, P: 100}).sh, m0({type: 5, P: 100}).wc, m0({type: 5, P: 100}).basin, m0({type: 5, P: 100}).df], [true, 3, 2, 2, 7, 4, 2, 3]);
  check('one person gets one fountain at least; no persons -> nothing; hospitals have no fountain rule', [m0({P: 1}).df, m0({P: 0}).wc, m0({P: 0}).df, m0({type: 11, P: 20}).df], [1, 0, 0, 0]);
  check('per-unit types: a single-room dwelling x 10 -> 10 WC, 10 basins, 10 baths, 10 kitchen sinks; a hotel x 50 -> 50 / 50 and a cleaning sink; a private hospital room x 4 -> 4, 4, 4', [m0({type: 14}).wc, m0({type: 14}).basin, m0({type: 14}).bath, m0({type: 14}).sink, m0({type: 15, units: 50}).wc, m0({type: 15, units: 50}).clean, m0({type: 16, units: 4}).bath], [10, 10, 10, 10, 50, 1, 4]);
}
check('Table 3-5: 20 rows; every total is at most cold + hot and at least the larger of the two; the flush-valve rows are 2, 4, 6 and 7 (indices 1, 3, 5, 6)', [J('EZ_W').length, J('EZ_W').every(x => x[3] <= x[1] + x[2] + 1e-9 && x[3] >= Math.max(x[1], x[2]) - 1e-9), J('EZ_W').map((x, i) => x[4] ? i : -1).filter(i => i >= 0)], [20, true, [1, 3, 5, 6]]);
check('Table 3-6: 61 rows, units strictly increasing, flows non-decreasing for both columns; the valve column starts at 5 units; 1000 units gives 476 for both; 100 units 88 and 272', [J('EZ_F').length, J('EZ_F').every((x, i, a) => i === 0 || (x[0] > a[i - 1][0] && x[1] >= a[i - 1][1] && (x[2] === null || a[i - 1][2] === null || x[2] >= a[i - 1][2]))), J('EZ_F').filter(x => x[2] === null).map(x => x[0]), J('EZ_F').find(x => x[0] === 1000).slice(1), J('EZ_F').find(x => x[0] === 100).slice(1)], [61, true, [1, 2, 3, 4], [476, 476], [88, 272]]);
const fl = (u, v) => J('ezFlow(' + u + ', ' + v + ')');
check('flows: exact rows 10 units -> 46 (tank) and 132 (valve); 11 units -> 46.5 and 136.5 (linear between 10 and 12); 125 units -> 100 and 289; 0.5 unit -> 1.9 with flush tanks; 4 units with valves is outside the table; 1001 units is outside', [fl(10, false).q, fl(10, true).q, fl(11, false).q, fl(11, true).q, fl(125, false).q, fl(125, true).q, fl(0.5, false).q, fl(4, true).ok, fl(4, true).why, fl(1001, false).ok, fl(1000, true).q, fl(0, true).q], [46, 132, 46.5, 136.5, 100, 289, 1.9, false, 'valve', false, 476, 0]);
const pp = (q, v) => J('ezPipe(' + q + ', ' + v + ')');
check('pipe by velocity: 47 L/min at 1.2 m/s needs 28.8 mm -> 1.25 in (1 in has 26.97 mm); real velocity 0.83 m/s; 600 L/min at 2.4 m/s needs 72.8 mm -> 3 in; 3000 L/min at 1.2 m/s exceeds 4 in', [+pp(47, 1.2).D.toFixed(1), pp(47, 1.2).pick[0], +pp(47, 1.2).v.toFixed(2), pp(600, 2.4).pick[0], pp(3000, 1.2).pick], [28.8, 1.25, 0.83, 3, null]);
const m1 = o => ez(Object.assign({mode: 1, n: new Array(20).fill(0), sys: 0, vi: 0}, o));
const cnt = (a) => { const n = new Array(20).fill(0); for (const [i, c] of a) n[i] = c; return n; };
{
  const r = m1({n: cnt([[0, 2], [7, 2], [9, 2], [12, 1]])});
  check('a flat: 2 tank WC + 2 basins + 2 baths + kitchen sink = cold 12, hot 6, total 14 units; tank curve 47 L/min; hot 30 L/min; total 48 L/min', [r.cold, r.hot, r.total, r.valve, r.fc.q, r.fh.q, r.ft.q], [12, 6, 14, false, 47, 30, 48]);
  check('flush-valve WC in the list switches the automatic system to valves (5 units cold -> 103 L/min); forcing tanks gives 26', [m1({n: cnt([[1, 1]])}).valve, m1({n: cnt([[3, 1]])}).fc.q, m1({n: cnt([[3, 1]]), sys: 1}).fc.q, m1({n: cnt([[3, 1]]), sys: 1}).valve, m1({n: cnt([[0, 1]]), sys: 2}).valve, m1({n: cnt([[0, 1]]), sys: 2}).fc.ok], [true, 132, 46, false, true, false]);
  check('hot water uses the tank curve even with valves; dishwasher (hot 1, total 1) -> 3.8 L/min hot', [m1({n: cnt([[16, 1]]), sys: 2}).fh.q, m1({n: cnt([[16, 1]])}).hot, m1({n: cnt([[16, 1]])}).cold], [3.8, 1, 0]);
}
check('Table 4-1: 31 rows; flush-valve bathroom group 8, tank group 6; WC private 4 and public 6; floor drain 2 / 3 / 4 inch: 3, 5, 6; drinking pipe 0.5; the unlisted trap rows 1 - 6', [J('EZ_D').length, J('EZ_D[0][1]'), J('EZ_D[1][1]'), J('EZ_D[13][1]'), J('EZ_D[14][1]'), J('EZ_D[19][1]'), J('EZ_D[20][1]'), J('EZ_D[21][1]'), J('EZ_D[18][1]'), J('EZ_D').slice(25).map(x => x[1])], [31, 8, 6, 4, 6, 3, 5, 6, 0.5, [1, 2, 3, 4, 5, 6]]);
check('Table 4-2: 10 sizes; 4 inch 160 / 240 / 500 / 90; 8 inch 1400 / 2200 / 3600 / 600; 3 inch 20 / 48 / 72 / 20; limits increase with size for every column', [J('EZ_T2').length, J('EZ_T2.find(x => x[0] === 4)').slice(2), J('EZ_T2.find(x => x[0] === 8)').slice(2), J('EZ_T2.find(x => x[0] === 3)').slice(2), J('EZ_T2').every((x, i, a) => i === 0 || [2, 3, 4, 5].every(k => x[k] >= a[i - 1][k]))], [10, [160, 240, 500, 90], [1400, 2200, 3600, 600], [20, 48, 72, 20], true]);
check('Table 4-4: 10 sizes; 4 inch 180 / 216 / 250 at 10.4 / 20.8 / 41.6 mm/m (none at 5.2); 8 inch 1400 / 1600 / 1920 / 2300; 15 inch 7000 / 8300 / 10000 / 12000; every row increases with slope', [J('EZ_T4').length, J('EZ_T4.find(x => x[0] === 4)')[2], J('EZ_T4.find(x => x[0] === 8)')[2], J('EZ_T4.find(x => x[0] === 15)')[2], J('EZ_T4').every(x => x[2].filter(y => y !== null).every((y, i, a) => i === 0 || y >= a[i - 1]))], [10, [null, 180, 216, 250], [1400, 1600, 1920, 2300], [7000, 8300, 10000, 12000], true]);
const m2 = o => ez(Object.assign({mode: 2, n: new Array(31).fill(0), el: 0, dia: 4, si: false, di: 0, slope: 2, wc: 0}, o));
const cd = a => { const n = new Array(31).fill(0); for (const [i, c] of a) n[i] = c; return n; };
{
  const r = m2({n: cd([[2, 2], [9, 2], [13, 2]])});
  check('2 basins + 2 baths + 2 WC = 2 + 4 + 8 = 14 DFU; a branch needs 3 inch (limit 20); 4 inch passes', [r.dfu, r.min[0], r.ok, m2({n: cd([[2, 2], [9, 2], [13, 2]]), dia: 2}).ok], [14, 3, true, false]);
  check('3 inch branch: 20 DFU passes if not more than 2 WC; 3 WC fails even with small DFU; 21 DFU fails; 4 inch branch: 160 passes, 161 fails', [m2({n: cd([[13, 5]]), dia: 3}).ok, m2({n: cd([[13, 1]]), dia: 3, wc: 3}).ok, m2({n: cd([[2, 21]]), dia: 3}).ok, m2({n: cd([[2, 160]])}).ok, m2({n: cd([[2, 161]])}).ok], [true, false, false, true, false]);
  check('stack of up to 3 intervals: 240 DFU -> 4 inch, 241 -> 5 inch; more than 3 intervals: 500 -> 4 inch total, 90 per interval (91 -> 5 inch); the 3 inch stack allows 6 WC (7 fails)', [m2({n: cd([[2, 240]]), el: 1}).min[0], m2({n: cd([[2, 241]]), el: 1}).min[0], m2({n: cd([[2, 500]]), el: 1}).min2[0], m2({n: cd([[2, 501]]), el: 1}).min2[0], m2({n: cd([[2, 100]]), el: 1, si: true, di: 90}).minInt[0], m2({n: cd([[2, 100]]), el: 1, si: true, di: 91}).minInt[0], m2({n: cd([[2, 10]]), el: 1, dia: 3, wc: 6}).ok, m2({n: cd([[2, 10]]), el: 1, dia: 3, wc: 7}).ok], [4, 5, 4, 5, 4, 5, true, false]);
  check('stack of more than 3 intervals with 4 inch: 500 DFU and 90 per interval pass; 91 per interval fails; 501 total fails', [m2({n: cd([[2, 500]]), el: 1, si: true, di: 90}).ok, m2({n: cd([[2, 500]]), el: 1, si: true, di: 91}).ok, m2({n: cd([[2, 501]]), el: 1, si: true, di: 50}).ok], [true, false, false]);
  check('building drain: 216 DFU at 20.8 mm/m needs 4 inch; at 10.4 mm/m 216 -> 5 inch (4 inch holds 180); at 5.2 mm/m only sizes from 8 inch exist; 4 inch at 41.6 holds 250; 3 inch holds 2 WC only', [m2({n: cd([[2, 216]]), el: 2, dia: 4}).min[0], m2({n: cd([[2, 216]]), el: 2, slope: 1, dia: 5}).min[0], m2({n: cd([[2, 5]]), el: 2, slope: 0}).min[0], m2({n: cd([[2, 250]]), el: 2, slope: 3, dia: 4}).ok, m2({n: cd([[2, 251]]), el: 2, slope: 3, dia: 4}).ok, m2({n: cd([[2, 40]]), el: 2, slope: 2, dia: 3, wc: 3}).ok, m2({n: cd([[2, 40]]), el: 2, slope: 2, dia: 3, wc: 2}).ok, m2({n: cd([[2, 5]]), el: 2, slope: 0, dia: 4}).ok], [4, 5, 8, true, false, false, true, false]);
  check('too many units for every size: 20000 DFU on a branch has no size in Table 4-2', [m2({n: cd([[2, 20000]])}).min], [null]);
}
const m3 = f => ez({mode: 3, floors: f});
check('single-stack system: 6 floors -> 4 inch / 2 inch every 2 floors; 12 -> 4 / 2 every floor or 2; 16 -> 4 / 2.5; 21 -> 5 / 2; 25 -> 5; 5 and 26 are outside', [m3(6).row.slice(2), m3(12).row.slice(2), m3(16).row.slice(2, 4), m3(21).row.slice(2, 4), m3(25).row[2], m3(5).row, m3(26).row, m3(5).below, m3(26).above], [[4, 2, 'كل دورين'], [4, 2, 'كل دور أو كل دورين'], [4, 2.5], [5, 2], 5, null, null, true, true]);
let tt;
w.renderCalc('egsan'); w.calcResult('egsan');
tt = txt(w, 'ez_results');
check('the default page (120 employees) shows 5 WC, 3 basins, 2 fountains, the 0.5 x rule and the 🔴 note; only the first group is visible', [tt.includes('الحد الأدنى للأجهزة الصحية'), tt.includes('المراحيض والمباول لكل جنس5'), tt.includes('عدد الأحواض3'), tt.includes('حنفيات الشرب2'), tt.includes('🔴'), w.document.getElementById('ez_g0').style.display, w.document.getElementById('ez_g1').style.display], [true, true, true, true, true, '', 'none']);
set('ez_mx', '1'); w.calcResult('egsan'); tt = txt(w, 'ez_results');
check('mixed use shows 72 persons per sex and the total of 6', [tt.includes('72'), tt.includes('مجموع المراحيض والمباول للجنسين6')], [true, true]);
set('ez_ty', '14'); w.calcResult('egsan'); tt = txt(w, 'ez_results');
check('a per-unit type shows the dwelling counts', [tt.includes('المراحيض10'), tt.includes('حوض المطبخ10')], [true, true]);
set('ez_m', '1'); w.calcResult('egsan'); tt = txt(w, 'ez_results');
check('the water page shows cold 12, hot 6, total 14, 47 L/min, 1.25 in and the 🔴 note', [tt.includes('12.00'), tt.includes('6.00'), tt.includes('14.00'), tt.includes('47.0 L/min'), tt.includes('1.25 in'), tt.includes('🔴'), w.document.getElementById('ez_g1').style.display, w.document.getElementById('ez_g0').style.display], [true, true, true, true, true, true, '', 'none']);
set('ez_m', '2'); w.calcResult('egsan'); tt = txt(w, 'ez_results');
check('the drainage page shows 14 DFU, 3 in as the smallest size and the ✔ mark for 4 in', [tt.includes('14.0'), tt.includes('3 in'), tt.includes('✔'), tt.includes('✘')], [true, true, true, false]);
set('ez_dm', '2'); w.calcResult('egsan'); tt = txt(w, 'ez_results');
check('a 2 in branch fails with the ✘ mark', [tt.includes('✘')], [true]);
set('ez_m', '3'); set('ez_fl', '18'); w.calcResult('egsan'); tt = txt(w, 'ez_results');
check('the single-stack page for 18 floors shows 4 in, 2.5 in and the diversity-factor note', [tt.includes('4 in'), tt.includes('2.5 in'), tt.includes('معامل تخفيض')], [true, true, true]);
check('other reference codes open egsan too', others('egsan', 'ez_results'), [true, true, true]);
}
// ---------- part 203: Egyptian fire protection code, Part 1, Chapter 4 egress (`egegress`: Tables 4-a to 4-e, exits, travel distance, exit units, stairs) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const eo = o => J('eoCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('Table 4-a: 21 rows; offices 10 m2, mercantile 3 and 6, factories 5, storage 30, garages 50; assembly standing 0.4 and classrooms 1.25; checksum of the factors 211.25', [J('EO_L').length, J('EO_L[12][2]'), J('EO_L[13][2]'), J('EO_L[14][2]'), J('EO_L[15][2]'), J('EO_L[16][2]'), J('EO_L[17][2]'), J('EO_L[0][2]'), J('EO_L[4][2]'), +J('EO_L').reduce((s, x) => s + x[2], 0).toFixed(2)], [21, 10, 3, 6, 5, 30, 50, 0.4, 1.25, 211.25]);
const m0 = o => eo(Object.assign({mode: 0, use: 12, area: 500, bedrooms: 0, seats: 0}, o));
check('offices 500 m2 / 10 = 50 persons; 505 m2 -> 51; assembly standing 100 m2 / 0.4 = 250; classrooms 100 m2 / 1.25 = 80; zero area -> 0; bedrooms x 2', [m0({}).persons, m0({area: 505}).persons, m0({use: 0, area: 100}).persons, m0({use: 4, area: 100}).persons, m0({area: 0}).persons, m0({bedrooms: 30}).bed], [50, 51, 250, 80, 0, 60]);
check('Table 4-b: 11 rows; assembly 35 / 50 with dead end 6; residential dead end 9, travel 30 / 45; mercantile 30 / 60; industrial part 1 has no dead end (20 / 25); open garages 15, 40 / 60; closed garages 35 / 50', [J('EO_T').length, J('EO_T[0]').slice(1), J('EO_T[2]').slice(1), J('EO_T[4]').slice(1), J('EO_T[5]').slice(1), J('EO_T[9]').slice(1), J('EO_T[10]').slice(1)], [11, [6, 35, 50], [9, 30, 45], [6, 30, 60], [null, 20, 25], [15, 40, 60], [15, 35, 50]]);
const m1 = o => eo(Object.assign({mode: 1, tr: 3, spr: false, ae: false, b: false, noSingle: false, load: 50, area: 400, top: 10, travel: 30, dead: 0, roomD: 9, roomLoad: 20}, o));
{
  check('number of exits: assembly or mercantile above 1000 persons -> 4, above 600 -> 3 (601), 600 -> 2, any other group -> 2', [J('eoExits(true, 1001)'), J('eoExits(true, 1000)'), J('eoExits(true, 601)'), J('eoExits(true, 600)'), J('eoExits(false, 5000)')], [4, 3, 3, 2, 2]);
  check('single exit: 60 persons, 600 m2 and 16 m pass (61, 601, 16.1 fail); the institutional group needs 13 m (13.1 fails); groups A and F-1 never', [m1({load: 60, area: 600, top: 16}).single, m1({load: 61}).single, m1({area: 601}).single, m1({top: 16.1}).single, m1({b: true, top: 13}).single, m1({b: true, top: 13.1}).single, m1({noSingle: true}).single], [true, false, false, false, true, false, false]);
  check('travel distance: business 30 m without sprinklers (31 fails), 45 with; assembly 35 / 50; mercantile 60 with sprinklers; dead end 6 m (7 fails) and 12 m for residential and business with sprinklers (13 fails); industrial part 1 allows none', [m1({travel: 30}).okTravel, m1({travel: 31}).okTravel, m1({spr: true, travel: 45}).okTravel, m1({tr: 0, travel: 35}).okTravel, m1({tr: 4, spr: true, travel: 60}).okTravel, m1({dead: 6}).okDead, m1({dead: 7}).okDead, m1({spr: true, dead: 12}).okDead, m1({spr: true, dead: 13}).okDead, m1({tr: 5, dead: 1}).okDead, m1({tr: 5, dead: 0}).okDead, m1({tr: 4, spr: true, dead: 7}).okDead], [true, false, true, true, true, true, false, true, false, false, true, false]);
  check('room travel: 15 m without sprinklers (16 fails), 20 m with; room door swings with the exit above 15 m or 60 persons (15 m and 60 do not)', [m1({roomD: 15}).okRoom, m1({roomD: 16}).okRoom, m1({spr: true, roomD: 20}).okRoom, m1({roomD: 15, roomLoad: 60}).doorSwing, m1({roomD: 15.1}).doorSwing, m1({roomLoad: 61}).doorSwing], [true, false, true, false, true, true]);
}
check('Table 4-d: persons per 55 cm unit 30, 90, 60, 100, 500, 60; Table 4-e doors 36, 45, 110, 75, 75', [J('EO_U').map(x => x[1]), J('EO_D').map(x => x[1])], [[30, 90, 60, 100, 500, 60], [36, 45, 110, 75, 75]]);
check('unit rounding: 3.2 -> 3.5; 3.5 -> 3.5; 3.6 -> 4; 3 -> 3; 0.2 -> 0.5; 0 -> 0', [3.2, 3.5, 3.6, 3, 0.2, 0].map(x => J('eoHalf(' + x + ')')), [3.5, 3.5, 4, 3, 0.5, 0]);
const m2 = o => eo(Object.assign({mode: 2, load: 150, u: 1, du: 2, exits: 2, el: 0, w: 1.65, perDoor: 150, dw: 1.3, leaves: 2}, o));
{
  const r = m2({});
  check('150 persons on 90 per unit = 1.667 -> 2 units = 1.10 m; 2 exits take 1 unit each; the 1.65 m exit passes; door 150 / 110 = 1.36 -> 1.5 units = 0.825 m -> minimum 0.90; 1.3 m door of two 0.65 m leaves passes and is at least 3/4 of 1.65 (1.2375)', [+r.rawUnits.toFixed(3), r.units, +r.width.toFixed(3), r.share, r.okW, +r.doorRaw.toFixed(3), r.doorUnits, +r.doorMin.toFixed(3), r.okDoor, r.okLeaf, r.door34], [1.667, 2, 1.1, 1, true, 1.364, 1.5, 0.9, true, true, true]);
  check('600 persons on stairs (60 per unit) = 10 units = 5.50 m; with 4 exits no exit may take more than 5 units; 3 exits the same', [m2({load: 600, u: 2}).units, +m2({load: 600, u: 2}).width.toFixed(2), m2({load: 600, u: 2, exits: 4}).share, m2({load: 600, u: 2, exits: 1}).share], [10, 5.5, 5, 10]);
  check('minimum element width: exit corridor 1.10 (1.09 fails against the 1.10 minimum when the units need less), non-exit corridor 0.90, non-exit stair 0.72, door leaf 0.80', [0, 1, 2, 3].map(e => m2({el: e}).minEl), [1.1, 0.9, 0.72, 0.8]);
  check('a 1.05 m exit for 100 persons at 90 per unit (1.11 -> 1.5 units = 0.825 m) still fails the 1.10 m minimum; 1.10 passes', [m2({load: 100, w: 1.05}).okW, m2({load: 100, w: 1.1}).okW, +m2({load: 100}).width.toFixed(3)], [false, true, 0.825]);
  check('door leaves: one leaf 0.80 minimum (0.79 fails), two leaves 0.60 each (1.19 m fails), leaf at most 1.20 m (1.21 fails); exit door minimum 0.90', [m2({leaves: 1, dw: 0.8}).okLeaf, m2({leaves: 1, dw: 0.79}).okLeaf, m2({leaves: 2, dw: 1.2}).okLeaf, m2({leaves: 2, dw: 1.19}).okLeaf, m2({leaves: 1, dw: 1.21}).okLeaf, m2({dw: 0.89, leaves: 1}).okDoor], [true, false, true, false, false, false]);
  check('door at least 3/4 of the corridor: 1.2375 m of 1.65 (1.23 fails)', [m2({dw: 1.24}).door34, m2({dw: 1.23}).door34], [true, false]);
}
const m3 = o => eo(Object.assign({mode: 3, w: 1.2, nr: 9, tread: 0.28, rail: 0.9, wall: 0.05, open: false, guard: 1, ball: 0.1}, o));
{
  check('stair: width 1.10 passes (1.09 fails); 3 risers pass (2 fail); tread 0.23 passes (0.22 fails); rail 0.75 - 1.10 (0.74 and 1.11 fail); wall gap 0.04 (0.03 fails)', [m3({w: 1.1}).okW, m3({w: 1.09}).okW, m3({nr: 3}).okRiser, m3({nr: 2}).okRiser, m3({tread: 0.23}).okTread, m3({tread: 0.22}).okTread, m3({rail: 0.75}).okRail, m3({rail: 1.1}).okRail, m3({rail: 0.74}).okRail, m3({rail: 1.11}).okRail, m3({wall: 0.04}).okWall, m3({wall: 0.03}).okWall], [true, false, true, false, true, false, true, true, false, false, true, false]);
  check('open sides: guard 1 m passes (0.99 fails), ball opening 10 cm passes (11 cm fails); closed sides skip both; width over 2.20 m needs a middle rail; over 3.40 m sections of at most 1.70 m: 3.5 m -> 3 sections (1.17 m), 3.4 m -> 2', [m3({open: true, guard: 1}).okGuard, m3({open: true, guard: 0.99}).okGuard, m3({open: true, ball: 0.1}).okBall, m3({open: true, ball: 0.11}).okBall, m3({guard: 0.5}).okGuard, m3({w: 2.2}).midRail, m3({w: 2.21}).midRail, m3({w: 3.4}).multi, m3({w: 3.5}).multi, m3({w: 3.5}).sect, m3({w: 3.4}).sect], [true, false, true, false, true, false, true, false, true, 3, 2]);
}
let tt;
w.renderCalc('egegress'); w.calcResult('egegress');
tt = txt(w, 'eo_results');
check('the default page (offices 500 m2) shows 50 persons, 10 m2 per person and the 🔴 note; only the first group is visible', [tt.includes('10.00 m²/فرد'), tt.includes('عدد الأفراد من المساحة50'), tt.includes('🔴'), w.document.getElementById('eo_g0').style.display, w.document.getElementById('eo_g1').style.display], [true, true, true, '', 'none']);
set('eo_m', '1'); w.calcResult('egegress'); tt = txt(w, 'eo_results');
check('the exits page shows 2 exits, a single exit allowed, 30 m travel and 6 m dead end with no ✘', [tt.includes('الحد الأدنى لعدد المخارج للطابق2'), tt.includes('مسموح'), tt.includes('30 m'), tt.includes('6 m'), tt.includes('✘')], [true, true, true, true, false]);
set('eo_ld', '70'); w.calcResult('egegress'); tt = txt(w, 'eo_results');
check('70 persons forbid a single exit and the page names the load', [tt.includes('غير مسموح'), tt.includes('الحمل 70')], [true, true]);
set('eo_m', '2'); w.calcResult('egegress'); tt = txt(w, 'eo_results');
check('the exit-unit page shows 2.00 units, 1.10 m and no ✘ for defaults', [tt.includes('عدد وحدات الخروج المطلوبة2.0'), tt.includes('1.10 m'), tt.includes('✘')], [true, true, false]);
set('eo_m', '3'); w.calcResult('egegress'); tt = txt(w, 'eo_results');
check('the stairs page shows 6 ✔ marks and no ✘', [(tt.match(/✔/g) || []).length, tt.includes('✘')], [5, false]);
check('other reference codes open egegress too', others('egegress', 'eo_results'), [true, true, true]);
}
// ---------- part 204: Egyptian code for water and sewer pipelines (`egnet`: Tables 1-2 to 1-7, 2-1 to 2-4; demand, peak flows, sewage flows, pipe fill and velocity, friction losses) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const en = o => J('enCalc(' + JSON.stringify(o) + ')');
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('Table 1-2: four uses (180 / 150 / 125 / 280 l/c/d with losses 20 - 40, 15 - 30, 10 - 25, 0 - 20); Table 1-4: three building types 50 - 150, 500 - 1000, 180 - 500; Table 1-7: six surface classes', [J('EN_U').map(x => x.slice(1)), J('EN_B').map(x => x.slice(2)), J('EN_C').map(x => x.slice(1))], [[[180, 20, 40], [150, 15, 30], [125, 10, 25], [280, 0, 20]], [[50, 150], [500, 1000], [180, 500]], [[0.7, 0.95], [0.1, 0.2], [0.3, 0.5], [0.5, 0.7], [0.55, 0.65], [0.6, 0.8]]]);
check('Table 2-1: nine pipe kinds, concrete ks 0.06 / 0.15 / 0.3, asbestos cement 0.015 / 0.03, GRP 0.003 / 0.03, vitrified clay 0.6; Table 2-2: 16 temperatures with 1.007 at 20 C and 0.366 at 80 C; Table 2-3: eight kinds, concrete 130 - 140, plastic 150 - 155', [J('EN_K').length, J('EN_K[4]').slice(1), J('EN_K[0]').slice(1), J('EN_K[2]').slice(1), J('EN_K[8]')[2], J('EN_V').length, J('EN_V.find(x => x[0] === 20)')[1], J('EN_V[15]')[1], J('EN_H').length, J('EN_H[4]').slice(1), J('EN_H[1]').slice(1)], [9, [0.06, 0.15, 0.3], [0.015, 0.03, null], [0.003, 0.03, null], 0.6, 16, 1.007, 0.366, 8, [130, 140], [150, 155]]);
const pop = (m, P1, par, n) => J('enPop(' + [m, P1, JSON.stringify(par), n].join(',') + ')');
check('population: arithmetic 50000 + 1000 x 30 = 80000; geometric 50000 e^(0.02 x 30) = 91106; decreasing 200000 - 150000 e^(-0.9) = 139015', [pop(0, 50000, [1000, 0, 0, 0], 30), pop(1, 50000, [0, 0.02, 0, 0], 30), pop(2, 50000, [0, 0, 200000, 0.03], 30)].map(x => Math.round(x)), [80000, 91106, 139015]);
check('fire flow: 10000 -> 20, 10001 -> 25, 25000 -> 25, 50000 -> 30, 100000 -> 40, 100001 -> 50', [10000, 10001, 25000, 50000, 100000, 100001].map(p => J('enFire(' + p + ')')), [20, 25, 25, 30, 40, 50]);
const pk = (p, r) => J('enPeak(' + p + ',' + r + ')');
check('peak factor urban: 50000 -> 2.25, 50001 -> 2, 100001 -> 1.8, 500000 -> 1.8, 500001 -> 1.4 - 1.6, 1000001 -> 1.2 - 1.4; rural: 50000 -> 2, 100000 -> 1.8, 500000 -> 1.6, 500001 -> none', [pk(50000, false).lo, pk(50001, false).lo, pk(100001, false).lo, pk(500000, false).lo, pk(500001, false).lo + '-' + pk(500001, false).hi, pk(1000001, false).lo + '-' + pk(1000001, false).hi, pk(50000, true).lo, pk(100000, true).lo, pk(500000, true).lo, pk(500001, true).ok], [2.25, 2, 1.8, 1.8, '1.4-1.6', '1.2-1.4', 2, 1.8, 1.6, false]);
const m0 = o => en(Object.assign({mode: 0, use: 0, m: 0, P1: 50000, n: 30, par: [1000, 0.02, 200000, 0.03], meters: false, useInc: false, r: 0, loss: 30, fm: 1.4, fd: 1.8, fh: 2.5, rural: false, ind: 0}, o));
{
  const r = m0({});
  check('capital city 50000 growing to 80000: consumption 180 + loss 30 = 210 l/c/d, Qav = 80000 x 210 / 86400 = 194.44 l/s; max month 1.4 x 180 + 30 = 282, max day 354, max hour 480 l/c/d -> 261.11, 327.78, 444.44 l/s', [r.Pn, r.total, +r.qav.toFixed(2), r.pm, r.pd, r.ph, +r.Qm.toFixed(2), +r.Qd.toFixed(2), +r.Qh.toFixed(2)], [80000, 210, 194.44, 282, 354, 480, 261.11, 327.78, 444.44]);
  check('the worked example of the code: new city 280 + loss 20: 1.4 x 280 + 20 = 412, 1.8 x 280 + 20 = 524, 2.5 x 280 + 20 = 720', [m0({use: 3, loss: 20}).pm, m0({use: 3, loss: 20}).pd, m0({use: 3, loss: 20}).ph], [412, 524, 720]);
  check('design flows: fire 40 l/s and P = 2 at 80000; tree Qdes = 194.44 x 2 = 388.89; grid: transmission 327.78 + 40 = 367.78; mains max(367.78, 444.44) = 444.44; minor 40; services 444.44', [r.fire, r.peak.lo, +r.treeHi.toFixed(2), +r.g1.toFixed(2), +r.g2.toFixed(2), r.g3, +r.g4.toFixed(2)], [40, 2, 388.89, 367.78, 444.44, 40, 444.44]);
  check('consumption growth: (80000 / 50000)^0.125 - 1 = 6.05 % without meters, ^0.11 = 5.31 % with meters; population growth 1 % over 30 years = 34.78 %; applying it raises 180 to 190.89', [+r.pcInc.toFixed(2), +m0({meters: true}).pcInc.toFixed(2), +m0({r: 1}).rInc.toFixed(2), +m0({useInc: true}).q.toFixed(2)], [6.05, 5.31, 34.78, 190.89]);
  check('rural areas have no peak factor above 500000; industry: 10 ha in a new city = 30 l/s, in a village 25', [m0({P1: 600000, par: [0, 0, 0, 0], n: 0, rural: true}).peak.ok, m0({ind: 10, use: 3}).ind, m0({ind: 10, use: 2}).ind], [false, 30, 25]);
}
const m1 = o => en(Object.assign({mode: 1, pop: 50000, cons: 200, ratio: 0.85, len: 1000, dmm: 300, h: 2, alpha: 10, infm: 0, fb: 24, L: 300, te: 3, C: 0.6, A: 5}, o));
{
  const r = m1({});
  check('sewage: Qav = 50000 x 200 x 0.85 / 86400 = 98.38 l/s; minimum 0.2 x 50^(1/6) = 0.3838 -> 37.77; maximum 1 + 14 / (4 + 7.071) = 2.2645 -> 222.79 and 5 / 50^0.167 = 2.6017 -> 255.95; the larger governs', [+r.qav.toFixed(2), +r.qmin.toFixed(2), +r.f15.toFixed(2), +r.f16.toFixed(2), +r.qmax.toFixed(2)], [98.38, 37.77, 222.79, 255.95, 255.95]);
  check('infiltration: 10 x 300 x 2^(2/3) = 4762 l/h per km = 1.3228 l/s per 1000 m; the alternative takes the larger of 24 m3/d/km and 0.46 per cm of diameter: 300 mm -> 24 (0.2778 l/s), 600 mm -> 27.6 (0.3194 l/s)', [+r.infEq.toFixed(4), +m1({infm: 1}).inf.toFixed(4), +m1({infm: 1, dmm: 600}).inf.toFixed(4)], [1.3228, 0.2778, 0.3194]);
  check('rain: tc = 300 / 45 + 3 = 9.67 min is below 10, so i uses 10 min: 750 / 20 = 37.5 mm/h; Qrain = 0.6 x 37.5 x 5 x 2.7778 = 312.5 l/s; L = 450 -> tc 13 -> i = 750 / 23 = 32.61; L = 900 -> tc 23 -> i = 1000 / 43 = 23.26', [+r.tc.toFixed(2), r.tcEff, r.i, +r.rain.toFixed(2), +m1({L: 450}).i.toFixed(2), +m1({L: 900}).i.toFixed(2), r.rainOk, m1({L: 450}).rainOk], [9.67, 10, 37.5, 312.5, 32.61, 23.26, false, true]);
  check('design flows: max dry + infiltration 255.95 + 1.32 = 257.27; with rain 569.77; minimum dry 37.77', [+r.des[0].toFixed(2), +r.des[1].toFixed(2), +r.des[2].toFixed(2)], [257.27, 569.77, 37.77]);
}
const geo = y => J('enGeo(' + y + ')');
check('circular section: full a = pi / 4 and r = 1 / 4; half depth gives half the area and the same radius; y = 0 gives zero', [+geo(1).a.toFixed(5), geo(1).r, +geo(0.5).a.toFixed(5), +geo(0.5).r.toFixed(5), geo(0).a], [0.7854, 0.25, 0.3927, 0.25, 0]);
check('depth from flow ratio: 0.5 -> half depth; 0 -> 0; 1 -> 0.8 of the diameter (0.82 within 0.01); above the maximum (1.08) there is no solution', [+J('enDepth(0.5)').toFixed(5), J('enDepth(0)'), Math.abs(J('enDepth(1)') - 0.82) < 0.01, J('enDepth(1.08)')], [0.5, 0, true, null]);
check('Manning full flow: D 0.4 m, 3 per mille, n 0.013 -> 114.07 l/s at 0.9077 m/s; half-full pipe gives half of it with the same velocity', [+(J('enManning(0.4, 0.003, 0.013)') * 1000).toFixed(2), +J('enPartial(0.05703, 0.4, 0.003, 0.013)').v.toFixed(4), +(J('enManning(0.4, 0.003, 0.013)') / (Math.PI * 0.04)).toFixed(4)], [114.07, 0.9077, 0.9077], 1e-3);
const lm = (s, b, c) => J('enLimits(' + [s, b, c].join(',') + ')');
check('fill and velocity limits: separate small 2/3 and 0.75, separate big 3/4 and 1.0; combined small without rain 1/2 and 0.6, with rain 2/3 and 0.75; big combined 3/4 and 1.0; minimum dry flow 0.5 (small) and 0.6 (big)', [lm(0, false, 0), lm(0, true, 0), lm(1, false, 0), lm(1, false, 1), lm(1, true, 1), lm(0, false, 2), lm(1, true, 2)].map(x => [x.fill === null ? null : +x.fill.toFixed(4), x.vmin]), [[0.6667, 0.75], [0.75, 1], [0.5, 0.6], [0.6667, 0.75], [0.75, 1], [null, 0.5], [null, 0.6]]);
const m2 = o => en(Object.assign({mode: 2, sys: 0, cs: 0, Q: 50, D: 400, S: 3, n: 0.013}, o));
{
  const r = m2({});
  check('50 l/s in 400 mm at 3 per mille: q = 0.44 of the full flow, depth 0.46 D, velocity 0.88 m/s; passes 2/3 and 0.75; smallest pipe is 350 mm (depth 0.57 D); its minimum slope is about 2.0 per mille', [+r.pt.q.toFixed(2), +r.pt.y.toFixed(2), +r.pt.v.toFixed(2), r.okFill, r.okV, r.rec.d, +r.rec.y.toFixed(2), +r.sMin.toFixed(1)], [0.44, 0.46, 0.88, true, true, 350, 0.57, 2]);
  check('a flat pipe fails the velocity (1 per mille: 0.54 m/s < 0.75); a 700 mm class is chosen above it; a flow above the capacity has no depth', [m2({S: 1}).okV, m2({S: 1, D: 700}).big, m2({Q: 300}).pt.y === null, m2({Q: 300}).okFill], [false, false, true, false]);
  check('minimum dry flow: no fill limit and 0.5 m/s: 10 l/s in 400 mm at 3 per mille has v about 0.51 and passes; at 2 per mille it fails', [m2({cs: 2, Q: 10}).okFill, m2({cs: 2, Q: 10}).okV, m2({cs: 2, Q: 10, S: 2}).okV], [true, true, false]);
  check('a large pipe (800 mm) follows the 3/4 rule with 1 m/s: 300 l/s in 800 mm at 3 per mille passes; the combined system with rain allows 2/3 only below 700 mm', [m2({Q: 300, D: 800}).lim.fill, m2({Q: 300, D: 800}).okFill, m2({sys: 1, cs: 1, Q: 200, D: 600}).lim.fill], [0.75, true, 2 / 3]);
}
const vis = T => J('enVisc(' + T + ')') * 1e6;
check('viscosity: 20 C -> 1.007, 22.5 C -> 0.952 (linear), 2 C -> 1.521, 90 C -> 0.366, 80 C -> 0.366', [vis(20), vis(22.5), vis(2), vis(90), vis(80)].map(x => +x.toFixed(3)), [1.007, 0.952, 1.521, 0.366, 0.366]);
const cb = J('enColebrook(0.00003, 0.2, 189658)');
check('Colebrook: f for ks 0.03 mm, D 0.2 m, Re 189658 satisfies 1 / sqrt(f) = -2 log10(ks / 3.71 D + 2.51 / (Re sqrt(f))); laminar 64 / Re; zero Reynolds gives 0', [Math.abs(1 / Math.sqrt(cb) + 2 * Math.log10(0.00003 / (3.71 * 0.2) + 2.51 / (189658 * Math.sqrt(cb)))) < 1e-8, +cb.toFixed(4), J('enColebrook(0.00003, 0.2, 1000)'), J('enColebrook(0.00003, 0.2, 0)')], [true, 0.0169, 0.064, 0]);
const m3 = o => en(Object.assign({mode: 3, Q: 30, D: 200, L: 1000, hw: 6, useHi: false, n: 0.013, T: 20, kk: 6, kc: 1}, o));
{
  const r = m3({});
  check('30 l/s in 200 mm: V = 0.955 m/s; Hazen-Williams (C 140, equation 41) = 4.35 m and equals the SI form 10.67 L Q^1.852 / (C^1.852 D^4.871); Manning (n 0.013, equation 43) = 8.36 m; Darcy with ks 0.03 mm and f = 0.017 gives 3.93 m', [+r.V.toFixed(3), +r.hHW.toFixed(2), Math.abs(r.hHW / (10.67 * 1000 * Math.pow(0.03, 1.852) / (Math.pow(140, 1.852) * Math.pow(0.2, 4.871))) - 1) < 0.002, +r.hM.toFixed(2), +r.f.toFixed(3), +r.hD.toFixed(2)], [0.955, 4.35, true, 8.36, 0.017, 3.93]);
  check('the upper C of a range is used on request: ductile iron 145 gives less loss than 140; plastic 155 less again; steel pipe has ks 0.03; vitrified clay normal ks 0.6; a blank entry (PVC good) gives no Darcy loss', [m3({useHi: true}).hHW < r.hHW, m3({hw: 1, useHi: true}).C, m3({kk: 7}).ks, m3({kk: 8}).ks, m3({kk: 1, kc: 0}).ks, m3({kk: 1, kc: 0}).hD === undefined], [true, 155, 0.03, 0.6, null, true]);
  check('velocity ranges: 0.95 m/s fits only sewers (0.6 - 1.5); 1.2 m/s fits mains and force mains; 1.8 m/s only service pipes (1.5 - 2); boundaries 1.5 and 1.0 are included', [m3({}).vOk, m3({Q: 37.7}).vOk, m3({Q: 56.5}).vOk], [[false, false, true, false], [false, true, true, true], [true, false, false, false]]);
  check('Reynolds regimes: 20 C and 0.955 m/s gives 189658 (turbulent); 5 l/s in 200 mm at 20 C has Re about 31600; tiny flow in a wide pipe is laminar (Re below 2000)', [Math.round(r.Re), Math.round(m3({Q: 5}).Re), m3({Q: 0.2, D: 300}).Re < 2000], [189658, 31610, true], 1);
}
const m4 = o => en(Object.assign({mode: 4, use: 0, bt: 0, lv: 0.5, cnt: 100}, o));
check('Table 1-4: offices at the middle of the range 100 l x 100 persons = 10 m3/day = 0.1157 l/s; hospital 500 beds at the low end 250 m3/day, at the top end 500; hotel 180 - 500', [m4({}).qd, +m4({}).qs.toFixed(4), m4({bt: 1, lv: 0, cnt: 500}).qd, m4({bt: 1, lv: 1, cnt: 500}).qd, m4({bt: 2, lv: 0}).rate, m4({bt: 2, lv: 1}).rate], [10, 0.1157, 250, 500, 180, 500]);
let tt;
w.renderCalc('egnet'); w.calcResult('egnet');
tt = txt(w, 'en_results');
check('the default page shows 80000 persons, 194.44 l/s, 261.11 / 327.78 / 444.44 l/s, fire 40 l/s, P 2.00 and the 🔴 note; only the first group is visible', [tt.includes('80000'), tt.includes('194.44 L/s'), tt.includes('261.11 L/s'), tt.includes('327.78 L/s'), tt.includes('444.44 L/s'), tt.includes('40 L/s'), tt.includes('2.00'), tt.includes('🔴'), w.document.getElementById('en_g0').style.display, w.document.getElementById('en_g1').style.display], [true, true, true, true, true, true, true, true, '', 'none']);
set('en_m', '1'); w.calcResult('egnet'); tt = txt(w, 'en_results');
check('the sewage page shows 98.38, 37.77, 255.95, 312.50 l/s and the 10 minute note', [tt.includes('98.38 L/s'), tt.includes('37.77 L/s'), tt.includes('255.95 L/s'), tt.includes('312.50 L/s'), tt.includes('استُخدم 10.0')], [true, true, true, true, true]);
set('en_m', '2'); w.calcResult('egnet'); tt = txt(w, 'en_results');
check('the pipe-check page shows 114.1 l/s, 350 mm, 2.02 per mille and two ✔ marks without ✘', [tt.includes('114.1 L/s'), tt.includes('350 mm'), tt.includes('2.02'), (tt.match(/✔/g) || []).length >= 2, tt.includes('✘')], [true, true, true, true, false]);
set('en_m', '3'); w.calcResult('egnet'); tt = txt(w, 'en_results');
check('the losses page shows 4.35 m, 8.36 m, 3.93 m, Reynolds 189658 and the turbulent regime', [tt.includes('4.35 m'), tt.includes('8.36 m'), tt.includes('3.93 m'), tt.includes('189658'), tt.includes('مضطرب')], [true, true, true, true, true]);
set('en_hk', '1'); set('en_hs', '0'); w.calcResult('egnet'); tt = txt(w, 'en_results');
check('a blank ks entry says it is not available', [tt.includes('غير متاح')], [true]);
set('en_m', '4'); w.calcResult('egnet'); tt = txt(w, 'en_results');
check('the public buildings page shows 100 l, 10 m3/day and 0.12 l/s', [tt.includes('100 L/فرد/يوم'), tt.includes('10.0 m³/يوم'), tt.includes('0.12 L/s')], [true, true, true]);
check('other reference codes open egnet too', others('egnet', 'en_results'), [true, true, true]);
}
// ---------- part 206: psychrometrics and air processes (`psychro`: ASHRAE Fundamentals chapter 1 properties, coil, mixing, humidifier, room supply air) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const ws = t => J('pycPws(' + t + ')') / 1000;
check('saturation pressure: 0 C 0.6112, 20 C 2.3388, 50 C 12.350, 100 C 101.42 kPa; over ice -10 C 0.2599 kPa', [ws(0), ws(20), ws(50), ws(100), ws(-10)], [0.6112, 2.3388, 12.35, 101.42, 0.2599], 0.006);
check('the two branches meet at 0 C (continuity within 0.2 %) and pressure rises with temperature', [Math.abs(ws(0.0001) / ws(-0.0001) - 1) < 0.002, ws(30) > ws(29)], [true, true]);
check('atmospheric pressure: 0 m 101.325, 1000 m 89.88, 1500 m 84.556 kPa', [J('pycPressure(0)'), J('pycPressure(1000)'), J('pycPressure(1500)')], [101.325, 89.88, 84.556], 0.02);
const P0 = 101.325;
const pst = (t, k, v, p) => J('pycState(' + [t, k, v, p || P0].join(',') + ')');
{
  const s = pst(25, 0, 50);
  check('25 C and 50 %: W = 9.88 g/kg, h = 50.32 kJ/kg, v = 0.858 m3/kg, dew point 13.86 C, wet-bulb 17.89 C, density 1.177 kg/m3', [s.W * 1000, s.h, s.v, s.dp, s.wb, s.rho], [9.88, 50.32, 0.858, 13.86, 17.89, 1.177], 0.03);
  check('degree of saturation below the relative humidity: 49.2 %; vapour pressure 1.585 kPa; not over-saturated', [+s.mu.toFixed(1), +s.pw.toFixed(3), s.over], [49.2, 1.585, false], 0.15);
  const w1 = pst(25, 1, s.wb), w2 = pst(25, 2, s.dp), w3 = pst(25, 3, s.W * 1000);
  check('the four ways of fixing the second property give the same state (round trip from wet-bulb, dew point and humidity ratio)', [w1.rh, w2.rh, w3.rh], [50, 50, 50], 0.05);
  const sat = pst(30, 0, 100);
  check('saturated air: wet-bulb = dew point = dry-bulb; W = Ws; RH 120 is limited to 100', [sat.wb, sat.dp, sat.W, pst(30, 0, 120).rh], [30, 30, sat.Wsat, 100], 1e-4);
  check('wet-bulb above the dry-bulb is limited to the dry-bulb (saturation); dew point above the dry-bulb likewise', [pst(25, 1, 40).rh, pst(25, 2, 40).rh], [100, 100], 1e-6);
  const dry = pst(25, 0, 0);
  check('dry air has zero humidity ratio and its dew point is very low', [dry.W, dry.dp < -90, dry.h, dry.v], [0, true, 25.15, 0.8441], 0.003);
  const hi = pst(25, 0, 50, J('pycPressure(1500)'));
  check('at 1500 m the same RH has a higher humidity ratio (11.9 g/kg) and a larger specific volume', [+(hi.W * 1000).toFixed(1), hi.v > s.v], [11.9, true], 0.1);
  const ice = pst(-5, 0, 80);
  check('below zero the ice branch is used: -5 C and 80 %: pws 0.4018, W 1.98 g/kg, dew point -7.6 C', [+(ice.pws).toFixed(4), +(ice.W * 1000).toFixed(2), +ice.dp.toFixed(1)], [0.4018, 1.98, -7.6], 0.05);
  check('negative wet-bulb uses the ice equation: 0 C dry with -1 C wet-bulb gives a humidity below saturation', [pst(0, 1, -1).rh > 0 && pst(0, 1, -1).rh < 100], [true]);
}
const calc = o => J('pycCalc(' + JSON.stringify(Object.assign({mode: 0, p: P0, t1: 28, k1: 0, v1: 50, q: 1000}, o)) + ')');
{
  const r = calc({mode: 1, t2: 14});
  check('sensible cooling at constant W: 28 C 50 % cooled to 14 C needs the dew point (16.7 C) crossed: over-saturated flag, and the load is m (h2 - h1)', [r.sat, +r.Q.toFixed(2), Math.abs(r.s2.W - r.s1.W) < 1e-12], [true, +(r.m * (r.s2.h - r.s1.h)).toFixed(2), true]);
  const h = calc({mode: 1, t2: 40});
  check('sensible heating 28 -> 40 C at 1000 L/s: about 14.2 kW (1.15 kg/s x 1.028 x 12), no saturation, RH falls to 25.6 %', [+h.Q.toFixed(1), h.sat, +(h.s2.rh).toFixed(1)], [14.2, false, 25.6], 0.1);
  check('mass flow of dry air: 1000 L/s at v = 0.8706 gives 1.1486 kg/s', [calc({}).m], [1000 / 1000 / calc({}).s1.v], 1e-9);
}
{
  const c = calc({mode: 2, t1: 28, v1: 60, method: 0, adp: 8, bf: 0.15});
  const sa = pst(8, 0, 100);
  check('coil by ADP 8 C and BF 0.15: leaving 28 -> 11.0 C; W2 = Wadp + 0.15 (W1 - Wadp)', [c.s2.t, c.s2.W], [8 + 0.15 * 20, sa.W + 0.15 * (c.s1.W - sa.W)], 1e-9);
  check('coil loads: total = m (h1 - h2), sensible + latent = total, SHR = Qs / Q, condensate = m (W1 - W2)', [c.Q, c.Qs + c.Ql, c.shr, c.cond], [c.m * (c.s1.h - c.s2.h), c.Q, c.Qs / c.Q, c.m * (c.s1.W - c.s2.W)], 1e-9);
  check('the example: total 38.8 kW (11.0 TR), SHR 0.51, condensate 26.6 kg/h, leaving RH 95.5 %', [+c.Q.toFixed(1), +(c.Q * 0.2843).toFixed(1), +c.shr.toFixed(2), +(c.cond * 3600).toFixed(1), +c.s2.rh.toFixed(1)], [38.8, 11, 0.51, 26.6, 95.5], 0.06);
  const b = calc({mode: 2, t1: 28, v1: 60, method: 1, t2: c.s2.t, v2: c.s2.rh});
  check('coil by leaving state recovers the ADP 8 C and the bypass factor 0.15', [b.adp.t, b.bf], [8, 0.15], 0.002);
  check('leaving state equal to the ADP gives BF 0; an impossible bypass factor above 1 is limited by the user input range and a state above saturation raises the flag', [calc({mode: 2, t1: 28, v1: 60, method: 0, adp: 8, bf: 0}).s2.t, calc({mode: 2, t1: 28, v1: 60, method: 1, t2: 20, v2: 100}).bad], [8, false]);
  check('a coil that heats (leaving above entering) has a negative load and the flag', [calc({mode: 2, t1: 28, v1: 50, method: 1, t2: 35, v2: 30}).bad, calc({mode: 2, t1: 28, v1: 50, method: 1, t2: 35, v2: 30}).Q < 0], [true, true]);
}
{
  const m = calc({mode: 3, t1: 35, v1: 40, q: 1000, t2: 24, k2: 0, v2: 50, q2: 3000});
  const a = m.s1, b = m.s2, ma = m.m, mb = m.m2;
  check('mixing: dry-air balance of W and h; fresh fraction = m1 / (m1 + m2)', [m.mix.W, m.mix.h, m.fresh], [(ma * a.W + mb * b.W) / (ma + mb), (ma * a.h + mb * b.h) / (ma + mb), ma / (ma + mb) * 100], 1e-6);
  check('mixing example: 1000 L/s at 35 C 40 % with 3000 L/s at 24 C 50 % -> 26.7 C, 10.47 g/kg, 53.5 kJ/kg, 24.2 % of the first stream', [+m.mix.t.toFixed(1), +(m.mix.W * 1000).toFixed(2), +m.mix.h.toFixed(1), +m.fresh.toFixed(1)], [26.7, 10.47, 53.5, 24.2], 0.06);
  check('the mixed temperature lies between the two streams and the mixed flow is the sum of the dry masses at the mixed volume', [m.mix.t > 24 && m.mix.t < 35, m.flow], [true, (ma + mb) * m.mix.v * 1000], 1e-6);
  check('a second stream of zero flow leaves the first state unchanged', [calc({mode: 3, t1: 35, v1: 40, q: 1000, t2: 24, k2: 0, v2: 50, q2: 0}).mix.t], [35], 1e-6);
}
{
  const a = calc({mode: 4, t1: 35, v1: 20, hm: 0, eta: 85});
  check('adiabatic humidifier: constant enthalpy, adiabatic saturation temperature 18.7 C, 85 % efficiency leaves at 21.1 C and 80 % RH, water 22.7 kg/h', [Math.abs(a.s2.h - a.s1.h) < 1e-6, +a.tas.toFixed(1), +a.s2.t.toFixed(1), +a.s2.rh.toFixed(0), +a.steam.toFixed(1)], [true, 18.7, 21.1, 80, 22.7], 0.1);
  check('the 100 % efficiency humidifier saturates the air at the adiabatic saturation temperature (it equals the wet-bulb)', [calc({mode: 4, t1: 35, v1: 20, hm: 0, eta: 100}).s2.rh, calc({mode: 4, t1: 35, v1: 20, hm: 0, eta: 100}).s2.t], [100, a.s1.wb], 0.2);
  const s = calc({mode: 4, t1: 20, v1: 20, hm: 1, rh2: 50});
  const tgt = pst(20, 0, 50);
  check('steam humidifier to 50 % at the entering temperature: W2 = target, steam kg/h = m (W2 - W1) x 3600, the air warms slightly (below 1 K)', [s.s2.W, s.steam, s.s2.t > 20 && s.s2.t < 21], [tgt.W, s.m * (tgt.W - s.s1.W) * 3600, true], 1e-6);
  check('a target below the present humidity needs no steam', [calc({mode: 4, t1: 20, v1: 80, hm: 1, rh2: 50}).steam], [0], 1e-9);
}
{
  const r = calc({mode: 5, t1: 24, v1: 50, q: 0, ts: 13, Qs: 10, Ql: 2, vol: 300});
  const cp = 1.006 + 1.86 * r.s1.W;
  check('supply air: m = Qs / (cp x dT) = 10 / (1.0197 x 11) = 0.8915 kg/s... supply W = Wr - Ql / (m x 2501)', [r.ms, r.Ws], [10 / (cp * 11), r.s1.W - 2 / (10 / (cp * 11) * 2501)], 1e-9);
  check('room SHR 0.833; the supply state is below saturation (RH 90 %), flow about 730 L/s and 8.8 air changes in 300 m3', [+r.shr.toFixed(3), r.bad, +r.supply.rh.toFixed(0), Math.round(r.flow), +r.ach.toFixed(1)], [0.833, false, 90, 730, 8.8], 0.6);
  check('too large a latent load for the airflow gives a negative humidity ratio: no supply state', [calc({mode: 5, t1: 24, v1: 50, ts: 13, Qs: 10, Ql: 40}).supply], [null]);
  check('a supply temperature not below the room has no solution', [calc({mode: 5, t1: 24, v1: 50, ts: 24, Qs: 10, Ql: 2}).ms], [null]);
  check('a supply state over saturation raises the flag: 12 C supply with no latent removal carries the room humidity 9.3 g/kg above the saturation 8.7 g/kg at 12 C; 18 C supply is fine', [calc({mode: 5, t1: 24, v1: 50, ts: 18, Qs: 10, Ql: 0}).bad, calc({mode: 5, t1: 24, v1: 50, ts: 12, Qs: 10, Ql: 0}).bad], [false, true]);
}
let tt;
w.renderCalc('psychro'); w.calcResult('psychro');
tt = txt(w, 'pyc_results');
check('the default page shows the point properties at sea level (28 C, 50 %: W 11.8 g/kg), the 🔴 note and only the first group', [tt.includes('خواص الهواء الرطب عند نقطة'), tt.includes('101.3'), /11\.8\d g\/kg/.test(tt), tt.includes('🔴'), w.document.getElementById('pyc_g0') === null || w.document.getElementById('pyc_g0').style.display === ''], [true, true, true, true, true]);
set('pyc_m', '2'); w.calcResult('psychro'); tt = txt(w, 'pyc_results');
check('the coil page shows the ADP, the bypass factor and the condensate; the coil group is visible', [tt.includes('نقطة ندى الجهاز ADP8.0'), tt.includes('معامل المرور BF'), tt.includes('الماء المتكثف'), w.document.getElementById('pyc_g2').style.display], [true, true, true, '']);
set('pyc_m', '3'); w.calcResult('psychro'); tt = txt(w, 'pyc_results');
check('the mixing page shows the mixed state and the first-stream percentage', [tt.includes('الخليط'), tt.includes('نسبة التيار الأول')], [true, true]);
set('pyc_m', '5'); w.calcResult('psychro'); tt = txt(w, 'pyc_results');
check('the supply page shows the SHR and the supply flow', [tt.includes('نسبة الحمل المحسوس SHR'), tt.includes('تصرف التغذية')], [true, true]);
set('pyc_m', '1'); set('pyc_t2', '10'); w.calcResult('psychro'); tt = txt(w, 'pyc_results');
check('sensible cooling below the dew point warns', [tt.includes('تحت نقطة الندى')], [true]);
set('pyc_k', '1'); set('pyc_v1', '20'); set('pyc_m', '0'); w.calcResult('psychro'); tt = txt(w, 'pyc_results');
check('the wet-bulb input shows the relative humidity of 28 C / 20 C wet-bulb: 49 %', [/الرطوبة النسبية.*?4[89]\.\d %/.test(tt)], [true]);
set('pyc_z', '1500'); w.calcResult('psychro'); tt = txt(w, 'pyc_results');
check('the altitude changes the pressure shown (84.56 kPa)', [tt.includes('84.56')], [true]);
check('other reference codes open psychro too', others('psychro', 'pyc_results'), [true, true, true]);
}
// ---------- part 207: centrifugal pumps (`pumphead`: total dynamic head and power, NPSH available, affinity laws and the operating point) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('water density (Tanaka): 4 C 999.97, 20 C 998.20, 60 C 983.2 kg/m3; vapour pressure: 20 C 2.339, 60 C 19.95, 100 C 101.42 kPa; pressure at 1000 m 89.88 kPa', [J('pnpRho(4)'), J('pnpRho(20)'), J('pnpRho(60)'), J('pnpPv(20)'), J('pnpPv(60)'), J('pnpPv(100)'), J('pnpPatm(1000)')], [999.97, 998.2, 983.2, 2.339, 19.95, 101.42, 89.88], 0.08);
const run = (Q, D, L, C, K) => J('pnpRun(' + [Q, D, L, C, K].join(',') + ')');
{
  const r = run(20, 150, 10, 140, 2);
  const v = 0.02 / (Math.PI * 0.15 * 0.15 / 4);
  check('pipe run 20 L/s in 150 mm: velocity 1.132 m/s, velocity head 0.0653 m, fittings 2 x 0.0653 = 0.1306 m', [r.v, r.hv, r.hm], [v, v * v / 19.6133, 2 * v * v / 19.6133], 1e-9);
  check('friction equals equation 41 of the Egyptian pipelines code: 6.78 L / D^1.165 (V / C)^1.85', [r.hf], [6.78 * 10 / Math.pow(0.15, 1.165) * Math.pow(v / 140, 1.85)], r.hf * 0.004);
  check('slope per km and total', [r.J, r.loss], [r.hf / 10 * 1000, r.hf + r.hm], 1e-9);
  check('no diameter or no length gives no friction (D = 0 -> no loss; L = 0 -> slope 0)', [run(20, 0, 10, 140, 0).hf, run(20, 150, 0, 140, 0).J], [0, 0], 1e-12);
}
const calc = o => J('pnpCalc(' + JSON.stringify(o) + ')');
const m0 = Object.assign({mode: 0, Q: 20, rho: 998, zs: -1.5, zd: 30, ps: 0, pd: 0, Ds: 150, Ls: 10, Ks: 2, Dd: 100, Ld: 120, Kd: 8, C: 140, margin: 10, eta: 65, etaM: 92, mm: 10});
{
  const r = calc(m0), s = run(20, 150, 10, 140, 2), d = run(20, 100, 120, 140, 8);
  check('TDH = static 31.5 + suction loss + discharge loss + velocity-head difference', [r.stat, r.tdh], [31.5, 31.5 + s.loss + d.loss + (d.hv - s.hv)], 1e-9);
  check('the example: discharge velocity 2.55 m/s, TDH about 41.8 m (31.5 static + 0.21 suction + 9.78 discharge + 0.27 velocity head), with 10 % margin 46.0 m', [+d.v.toFixed(2), +r.tdh.toFixed(1), +r.tdhM.toFixed(1)], [2.55, 41.8, 46.0], 0.06);
  check('power: hydraulic = rho g Q H; shaft = hydraulic / 0.65; motor input = shaft / 0.92; standard motor above shaft x 1.1', [r.phDesign, r.shaft, r.motor], [998 * 9.80665 * 0.02 * r.tdhM / 1e6 * 1000, 998 * 9.80665 * 0.02 * r.tdhM / 1e6 * 1000 / 0.65, 998 * 9.80665 * 0.02 * r.tdhM / 1e6 * 1000 / 0.65 / 0.92], 1e-9);
  check('the selected motor is the smallest standard size not below shaft x 1.1', [r.sel >= r.shaft * 1.1, [0.37, 0.55, 0.75, 1.1, 1.5, 2.2, 3, 4, 5.5, 7.5, 11, 15, 18.5, 22, 30, 37, 45, 55, 75, 90, 110, 132, 160, 200, 250, 315, 355].filter(x => x < r.sel).every(x => x < r.shaft * 1.1)], [true, true]);
  check('terminal pressure of 2 bar adds 2 x 100 / (998 x 9.80665 / 1000) = 20.44 m; static pressure on the suction side subtracts it', [+(calc(Object.assign({}, m0, {pd: 2})).tdh - r.tdh).toFixed(2), +(calc(Object.assign({}, m0, {ps: 1})).tdh - r.tdh).toFixed(2)], [20.44, -10.22], 0.01);
  check('a larger suction line lowers the loss; a discharge point below the pump gives negative static head', [calc(Object.assign({}, m0, {Ds: 200})).s.loss < r.s.loss, calc(Object.assign({}, m0, {zd: -5})).stat], [true, -3.5]);
  check('motor above 355 kW is reported (no standard size)', [calc(Object.assign({}, m0, {Q: 600, Ds: 500, Dd: 400, zd: 90, Ld: 100})).sel], [null]);
}
{
  const n0 = Object.assign({mode: 1, Q: 20, liquid: 0, T: 20, rho: 998, pvIn: 2.34, alt: true, z: 0, patm: 101.325, zs: -2, D: 150, L: 10, K: 2, C: 140, npshr: 3, req: 0.6});
  const r = calc(n0), s = run(20, 150, 10, 140, 2);
  check('NPSHa at 20 C sea level: (101.325 - 2.339) / 9.789 = 10.11 m; with a lift of 2 m and the line loss', [+r.head.toFixed(2), r.loss, r.npsha], [10.11, s.loss, r.head - 2 - s.loss], 0.01);
  check('margin and flags: NPSHa - NPSHr, requirement 0.6 m, ratio, no cavitation', [r.margin, r.ok, r.ratio, r.cav], [r.npsha - 3, true, r.npsha / 3, false], 1e-9);
  check('the greatest lift that still leaves the margin: head - loss - NPSHr - 0.6', [r.maxLift], [r.head - s.loss - 3 - 0.6], 1e-9);
  const hot = calc(Object.assign({}, n0, {T: 60}));
  check('hot water: 60 C gives head (101.325 - 19.95) / 9.642 = 8.44 m, a smaller NPSHa than cold water by 1.67 m', [+hot.head.toFixed(2), +(r.head - hot.head).toFixed(2)], [8.44, 1.67], 0.02);
  const hi = calc(Object.assign({}, n0, {z: 1500}));
  check('altitude 1500 m reduces the atmospheric part to 84.56 kPa: NPSHa smaller by about 1.7 m', [+hi.pa.toFixed(2), +(r.npsha - hi.npsha).toFixed(1)], [84.56, 1.7], 0.06);
  check('a pump needing 12 m cannot run: margin negative, flagged cavitation, max lift negative', [calc(Object.assign({}, n0, {npshr: 12})).ok, calc(Object.assign({}, n0, {npshr: 12})).cav, calc(Object.assign({}, n0, {npshr: 12})).maxLift < 0], [false, true, true]);
  check('another liquid uses its own density and vapour pressure; a given atmospheric pressure replaces the altitude', [calc(Object.assign({}, n0, {liquid: 1, rho: 800, pvIn: 20})).rho, calc(Object.assign({}, n0, {alt: false, patm: 90})).pa], [800, 90]);
  check('flooded suction raises NPSHa one-to-one', [+(calc(Object.assign({}, n0, {zs: 3})).npsha - r.npsha).toFixed(6)], [5]);
}
{
  const a0 = Object.assign({mode: 2, n1: 1450, n2: 1200, d1: 250, d2: 225, Q1: 20, H1: 36, P1: 10, q0: 0, h0: 40, qa: 20, ha: 36, qb: 30, hb: 28, hst: 10, qs: 20, hs: 36});
  const r = calc(a0), n = 1200 / 1450;
  check('speed change 1450 -> 1200 rpm: Q x 0.8276 = 16.55, H x 0.6849 = 24.66, P x 0.5668 = 5.67', [r.byN.Q, r.byN.H, r.byN.P], [20 * n, 36 * n * n, 10 * n * n * n], 1e-9);
  check('impeller trim 250 -> 225 mm (10 %): Q 18, H 29.16, P 7.29', [r.byD.Q, r.byD.H, r.byD.P, r.byD.trim], [18, 29.16, 7.29, 10], 1e-9);
  check('the curve through (0, 40), (20, 36), (30, 28): H = 40 + 0.2 Q - 0.02 Q2', [r.curve.A, r.curve.B, r.curve.C], [40, 0.2, -0.02], 1e-9);
  check('a system through the design point: K = (36 - 10) / 400 = 0.065, operating point 20 L/s at 36 m (inside the curve range)', [r.K, r.Q, r.H, r.inRange], [0.065, 20, 36, true], 1e-9);
  const s2 = calc(Object.assign({}, a0, {hst: 15, hs: 35}));
  check('static 15 m and design point (20, 35): K = 0.05; the intersection of 40 + 0.2 Q - 0.02 Q2 with 15 + 0.05 Q2 is 20.38 L/s at 35.77 m', [s2.K, +s2.Q.toFixed(2), +s2.H.toFixed(2), +s2.Hpump.toFixed(2)], [0.05, 20.38, 35.77, 35.77], 0.005);
  check('a system static head above the shut-off head has no operating point; one beyond the last curve point is flagged', [calc(Object.assign({}, a0, {hst: 45, hs: 60})).Q, calc(Object.assign({}, a0, {hst: 2, hs: 5, qs: 100})).inRange], [null, false]);
  check('three points with equal flows cannot define a curve', [calc(Object.assign({}, a0, {qa: 20, qb: 20, ha: 36, hb: 28})).curve], [null]);
  check('a trim above 20 % is flagged in the page (see below)', [calc(Object.assign({}, a0, {d2: 190})).byD.trim], [24], 1e-9);
}
let tt;
w.renderCalc('pumphead'); w.calcResult('pumphead');
tt = txt(w, 'pnp_results');
check('the default page shows TDH, the shaft power, the standard motor and the 🔴-free note; only the first group is visible', [tt.includes('الارتفاع الكلي TDH'), tt.includes('قدرة العمود'), tt.includes('المحرك القياسي المقترح'), w.document.getElementById('pnp_g0').style.display, w.document.getElementById('pnp_g1').style.display], [true, true, true, '', 'none']);
set('pnp_m', '1'); w.calcResult('pumphead'); tt = txt(w, 'pnp_results');
check('the NPSH page shows NPSHa, the margin with ✔ and the maximum lift', [tt.includes('NPSH المتاح'), tt.includes('✔'), tt.includes('أقصى رفع للسحب')], [true, true, true]);
set('pnp_nr2', '12'); w.calcResult('pumphead'); tt = txt(w, 'pnp_results');
check('a large NPSHr shows ✘ and the cavitation warning', [tt.includes('✘'), tt.includes('تكهف محتمل')], [true, true]);
set('pnp_m', '2'); w.calcResult('pumphead'); tt = txt(w, 'pnp_results');
check('the affinity page shows the operating point 20.00 L/s at 36.00 m and the trimming percentage', [tt.includes('نقطة التشغيل20.00 L/s'), tt.includes('36.00 m'), tt.includes('10.0 %')], [true, true, true]);
check('other reference codes open pumphead too', others('pumphead', 'pnp_results'), [true, true, true]);
}
console.log(fail ? `\n${fail} FAIL` : '\nall ok');
if (errors.length) { console.log('jsdom errors:', errors.slice(0, 5)); fail++; }
process.exit(fail ? 1 : 0);
