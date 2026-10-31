// Codes added after commit a79fe2a (parts 208 onward): the Egyptian fire code part 1 and part 4 calculators, the NFPA 13R / 13D, 96, 80, 110 and 1142 calculators. Split from tests/addcodes.js because one process ran out of heap (8 GB) with all parts together.
//   node tests/addcodes2.js
//   node tests/addcodes.js
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

// ---------- part 208: Egyptian fire code part 1, chapter 3-7 external exposure (`egexpo`: Tables 3-d, 3-e, 3-f, 3-g, 3-h; permitted unprotected openings, minimum limiting distance, wall fire resistance, exceptions) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const P = (t, k, a, d) => J('xePermit(' + [t, k, a, d].join(',') + ')');
check('Table 3-d printed cells: 10 m2 below 3:1 at 1, 2, 3, 4, 5 m = 7, 20, 50, 96, 100; 100 m2 at 5 m = 23, 12 m = 100; 1000 m2 above 10:1 at 30 m = 100, 20 m = 65; 2000 m2 at 45 m = 100', [P(0, 0, 10, 1), P(0, 0, 10, 2), P(0, 0, 10, 3), P(0, 0, 10, 4), P(0, 0, 10, 5), P(0, 0, 100, 5), P(0, 0, 100, 12), P(0, 2, 1000, 30), P(0, 2, 1000, 20), P(0, 1, 2000, 45)], [7, 20, 50, 96, 100, 23, 100, 100, 65, 100], 1e-9);
check('Table 3-e printed cells: 10 m2 below 3:1 at 1, 2, 3, 4, 5, 6 m = 3, 10, 25, 51, 86, 100; 2000 m2 above 10:1 at 45, 60, 65 m = 64, 97, 100; 500 m2 between 3:1 and 10:1 at 30 m = 89', [P(1, 0, 10, 1), P(1, 0, 10, 2), P(1, 0, 10, 3), P(1, 0, 10, 4), P(1, 0, 10, 5), P(1, 0, 10, 6), P(1, 2, 2000, 45), P(1, 2, 2000, 60), P(1, 2, 2000, 65), P(1, 1, 500, 30)], [3, 10, 25, 51, 86, 100, 64, 97, 100, 89], 1e-9);
check('the boundary gives 0 % and any distance beyond the last column gives 100 %', [P(0, 0, 100, 0), P(0, 0, 100, -3), P(0, 2, 2000, 1000), P(1, 0, 2000, 70)], [0, 0, 100, 100], 1e-9);
check('proportion for a distance between columns: 100 m2 below 3:1 at 4.5 m = (17 + 23) / 2 = 20; at 0.5 m = 3 (between the boundary 0 and 6 at 1 m)', [P(0, 0, 100, 4.5), P(0, 0, 100, 0.5)], [20, 3], 1e-9);
check('proportion for an area between rows: 240 m2 below 3:1 at 4 m = 13 + (11 - 13) x 0.9 = 11.2; 40 m2 at 3 m = 22 + (18 - 22) x 0.5 = 20 (between 30 and 50 m2)', [P(0, 0, 240, 4), P(0, 0, 40, 3)], [11.2, 20], 1e-9);
check('an area below 10 m2 takes the 10 m2 row and above 2000 m2 the 2000 m2 row', [P(0, 0, 4, 3), P(0, 0, 10, 3), P(0, 0, 5000, 20), P(0, 0, 2000, 20)], [50, 50, 26, 26], 1e-9);
check('ratio class: 20 x 12 -> below 3:1; 36 x 12 -> exactly 3:1 is the middle class; 12 x 36 the same; 120 x 12 = 10:1 is still middle; 121 x 12 -> above 10:1', [J('xeClass(20,12)'), J('xeClass(36,12)'), J('xeClass(12,36)'), J('xeClass(120,12)'), J('xeClass(121,12)')], [0, 1, 1, 1, 2]);
{
  const bad = J(`(function () {
    const out = [];
    for (let t = 0; t < 2; t++) for (let a = 0; a < XE_AREA.length; a++) for (let k = 0; k < 3; k++) {
      const r = XE_T[t][a][k], n = XE_DIST[t].length;
      if (r.length > n || r[0] !== 0 || r[r.length - 1] !== 100 || r.slice(0, -1).some(x => x >= 100)) out.push('shape ' + t + ' ' + a + ' ' + k);
      for (let i = 1; i < n; i++) if (xeCell(t, a, k, i) < xeCell(t, a, k, i - 1)) out.push('dist ' + t + ' ' + a + ' ' + k + ' ' + i);
      if (k > 0) for (let i = 0; i < n; i++) if (xeCell(t, a, k, i) < xeCell(t, a, k - 1, i)) out.push('class ' + t + ' ' + a + ' ' + k + ' ' + i);
      if (a > 0) for (let i = 0; i < n; i++) if (xeCell(t, a, k, i) > xeCell(t, a - 1, k, i)) out.push('area ' + t + ' ' + a + ' ' + k + ' ' + i);
      if (t === 1) for (let i = 0; i < XE_DIST[0].length; i++) { const j = XE_DIST[1].indexOf(XE_DIST[0][i]); if (xeCell(1, a, k, j) > xeCell(0, a, k, i)) out.push('table ' + a + ' ' + k + ' ' + i); }
    }
    return out;
  })()`);
  check('every printed row starts at 0, ends at its first 100 and the cells rise with distance and ratio class and fall with area; table 3-e never exceeds table 3-d', bad, []);
}
const dmin = (t, k, a, p) => J('xeMinDist(' + [t, k, a, p].join(',') + ')');
check('minimum distance: 100 m2 below 3:1 for 20 % -> 4.5 m, for 100 % -> 12 m; none for 0 %; 10 m2 for 7 % -> 1 m', [dmin(0, 0, 100, 20), dmin(0, 0, 100, 100), dmin(0, 0, 100, 0), dmin(0, 0, 10, 7)], [4.5, 12, 0, 1], 1e-9);
check('the minimum distance round-trips through the table for a spread of facades', J('[[0,0,100,20],[0,1,240,35],[1,2,60,12],[1,0,800,50]].map(x => { const d = xeMinDist(...x); return Math.abs(xePermit(x[0], x[1], x[2], d) - x[3]) < 0.5 && xePermit(x[0], x[1], x[2], d - 0.02) < x[3]; })'), [true, true, true, true]);
const F = o => J('xeFacade(' + JSON.stringify(Object.assign({g: 3, mo: 0, L: 20, H: 12, bd: 0, d: 4, sw: 12, Ao: 40, fr: 0, gf: 0}, o)) + ')');
{
  const r = F({});
  check('facade 20 x 12 m, group D (table 3-d), 4 m: area 240, ratio 1.67 (below 3:1), permitted 11.2 %, 26.88 m2', [r.t, r.area, r.q, r.k, r.pTab, r.allowed, r.maxArea], [0, 240, 20 / 12, 0, 11.2, 11.2, 26.88], 1e-9);
  check('40 m2 of openings = 16.67 % exceeds 11.2 %; the minimum distance is 5.69 m (between 5 m at 14.4 % and 6 m at 17.7 %); wall fire resistance 1 h', [r.pAct, r.ok, r.dmin, r.frr], [16.6667, false, 5.69, 1], 1e-3);
  check('group E uses table 3-e: 240 m2 at 4 m between the 150 m2 value 7 and the 250 m2 value 5 = 5.2 % (against 11.2 % for table 3-d)', [F({g: 4}).t, F({g: 4}).pTab], [1, 5.2], 1e-9);
  check('groups: A, B, C, D, F-3 use table 3-d; E, F-1, F-2 use table 3-e', [0, 1, 2, 3, 4, 5, 6, 7].map(g => F({g}).t), [0, 0, 0, 0, 1, 1, 1, 0]);
  check('a sprinklered building doubles the permitted percentage (22.4 %) and halves the required distance; wired glass does the same; the result is capped at 100 %', [F({mo: 1}).allowed, F({mo: 2}).allowed, F({mo: 1}).ok, F({mo: 1}).dmin < r.dmin, F({mo: 1, d: 30}).allowed], [22.4, 22.4, true, true, 100], 1e-9);
  const o40 = F({mo: 1});
  check('with doubling 16.67 % needs the table value 8.33 %: between 2 m (8 %) and 3 m (9.1 %) = 2.31 m', [o40.dmin], [2.31], 0.011);
  check('limits: 11.2 % x 240 = 26.88 m2 passes, 27 m2 fails', [F({Ao: 26.88}).ok, F({Ao: 27}).ok], [true, false]);
  check('a street: distance 4 m to its edge + half of a 12 m width = 10 m to the axis', [F({bd: 1}).dlim, F({bd: 1}).pTab], [10, P(0, 0, 240, 10)], 1e-9);
  check('facade of 240 m2 at 10 m: 150 m2 row 61 %, 250 m2 row 40 % -> 42.1 %', [P(0, 0, 240, 10)], [42.1], 1e-9);
  check('exception 3-7-4-1: ground-floor facade on a street, 9 m from its axis, height up to 5 m -> 100 %', [F({bd: 1, d: 3, sw: 12, gf: 1, H: 5, L: 30}).allowed, F({bd: 1, d: 3, sw: 12, gf: 1, H: 5, L: 30}).gfOk], [100, true]);
  const g1 = F({bd: 1, d: 2.9, sw: 12, gf: 1, H: 5}), g2 = F({bd: 1, d: 3, sw: 12, gf: 1, H: 5.1}), g3 = F({bd: 0, d: 20, gf: 1, H: 5});
  check('... but not when the axis is nearer than 9 m, the storey is higher than 5 m, or the boundary is not a street', [g1.gfOk, g1.gfDist, g2.gfOk, g2.gfH, g3.gfOk, g3.gfStreet], [false, false, false, false, false, false]);
  check('a wall without openings with less than the required resistance: 75 % from half an hour, 100 % below it; both fail at 4 m and need a wall rated 0.75 h at 25 % or more', [F({Ao: 0, fr: 1}).pAct, F({Ao: 0, fr: 2}).pAct, F({Ao: 0, fr: 1}).ok, F({Ao: 0, fr: 1}).frr], [75, 100, false, 0.75]);
  check('Table 3-f: group D below 25 % -> 1 h, 25 % or more -> 3/4 h (exactly 25 % -> 3/4 h); group E below 25 % -> 2 h, otherwise 1 h', [F({Ao: 59.9}).frr, F({Ao: 60}).frr, F({g: 4, Ao: 59.9}).frr, F({g: 4, Ao: 60}).frr], [1, 0.75, 2, 1]);
  check('openings larger than the facade are cut to the facade area; a facade without size is invalid', [F({Ao: 500}).AoE, F({Ao: 500}).pAct, F({L: 0}).valid], [240, 100, false], 1e-9);
  check('area flags: 6 m2 below the first row, 2500 m2 above the last', [F({L: 2, H: 3}).areaLow, F({L: 50, H: 50}).areaHigh, r.areaLow, r.areaHigh], [true, true, false, false]);
  const pr = J('xeProfile({}, xeFacade(' + JSON.stringify({g: 3, mo: 0, L: 20, H: 12, bd: 0, d: 4, sw: 12, Ao: 40, fr: 0, gf: 0}) + '))');
  check('the profile rows: 1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 45, 60 m; permitted area = percentage x 240 m2', [pr.map(x => x.d), pr[3].p, +pr[3].a.toFixed(3), pr[13].p], [[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 45, 60], 11.2, 26.88, 100], 1e-9);
}
const O = o => J('xeOther(' + JSON.stringify(Object.assign({g: 3, sv: 1, an: 100, sh: 1, nf: 2, hd: 8, bh: 15, fl: 60, fu: 0}, o)) + ')');
check('3-7-5-1: vertical spacing at least 0.90 m; 3-7-5-2: corner spacing 0.90 m above 135 degrees, 1.20 m from 90 to 135 degrees, none given below 90 degrees', [O({sv: 0.9}).vOk, O({sv: 0.89}).vOk, O({an: 136}).cReq, O({an: 135}).cReq, O({an: 90}).cReq, O({an: 89}).cReq, O({an: 89}).cOk, O({an: 100, sh: 1.2}).cOk, O({an: 100, sh: 1.19}).cOk], [true, false, 0.9, 1.2, 1.2, null, null, true, false]);
check('Table 3-h: 1 floor 7.5 m, 2 floors 10 m, 3 floors 12 m, 4 or more 14 m; 8 m is not enough for 2 floors, 10 m is', [1, 2, 3, 4, 5, 9].map(n => O({nf: n}).hReq), [7.5, 10, 12, 14, 14, 14]);
check('... compliance of the horizontal distance and the floor between: 1 h for A to D and F-3, 2 h for E, F-1 and F-2', [O({hd: 8}).hOk, O({hd: 10}).hOk, O({g: 3}).slab, O({g: 4}).slab, O({g: 5}).slab, O({g: 7}).slab], [false, true, 1, 2, 2, 1]);
check('Table 3-g: building height below 8 m -> surfaces C; 8 to 24 m -> B; above 24 m -> A', [7.9, 8, 24, 24.1, 60].map(h => O({bh: h}).surf), [0, 1, 1, 2, 2]);
check('fire load class: more than 100 kg/m2 -> F-1, 50 to 100 -> F-2, up to 50 -> F-3; in MJ/m2 the limits are 2000 and 1000', [[101, 0], [100, 0], [50.1, 0], [50, 0], [2001, 1], [2000, 1], [1000, 1], [999, 1]].map(x => O({fl: x[0], fu: x[1]}).fcls), [0, 1, 1, 2, 0, 1, 2, 2]);
let tt;
w.renderCalc('egexpo'); w.calcResult('egexpo');
tt = txt(w, 'xe_results');
check('the default page shows the area, the table 3-d, the permitted percentage with ✘, the minimum distance, the wall resistance, the profile table and the 🔴 note; only the first group is visible', [tt.includes('240.0 m²'), tt.includes('3-D'), tt.includes('11.2 %'), tt.includes('✘'), tt.includes('5.69 m'), tt.includes('1 h'), tt.includes('المسافة الفاصلة (m)'), tt.includes('🔴'), w.document.getElementById('xe_g0').style.display, w.document.getElementById('xe_g1').style.display, w.document.getElementById('xe_g2').style.display], [true, true, true, true, true, true, true, true, '', 'none', 'none']);
set('xe_Ao', '20'); w.calcResult('egexpo'); tt = txt(w, 'xe_results');
check('20 m2 of openings = 8.3 % is below 11.2 %: ✔', [tt.includes('8.3 %'), tt.includes('✔')], [true, true]);
set('xe_gr', '4'); w.calcResult('egexpo'); tt = txt(w, 'xe_results');
check('group E switches to table 3-e and lowers the permitted percentage to 5.2 %', [tt.includes('3-E'), tt.includes('5.2 %'), tt.includes('2 h')], [true, true, true]);
set('xe_gr', '3'); set('xe_mo', '1'); w.calcResult('egexpo'); tt = txt(w, 'xe_results');
check('sprinklers: the permitted percentage becomes 22.4 % with the reason shown', [tt.includes('22.4 %'), tt.includes('رشاشات تلقائية بالكامل')], [true, true]);
set('xe_mo', '0'); set('xe_gf', '1'); set('xe_bd', '1'); set('xe_d', '3'); set('xe_H', '4'); w.calcResult('egexpo'); tt = txt(w, 'xe_results');
check('ground-floor facade on a street 9 m from its axis shows the exception 3-7-4-1 as satisfied and 100 %', [tt.includes('استثناء الطابق الأرضي'), tt.includes('غير متحقق'), tt.includes('100.0 %')], [true, false, true]);
set('xe_m', '1'); w.calcResult('egexpo'); tt = txt(w, 'xe_results');
check('four facades: facade 1 fails (16.7 % against 11.2 %), the building does not comply, the table lists the four rows; only the second group is visible', [tt.includes('واجهة 1'), tt.includes('غير مطابق'), tt.includes('أصغر مسافة 5.69 m'), w.document.getElementById('xe_g0').style.display, w.document.getElementById('xe_g1').style.display], [true, true, true, 'none', '']);
set('xe_A1', '20'); set('xe_A4', '10'); w.calcResult('egexpo'); tt = txt(w, 'xe_results');
check('after reducing facade 1 to 20 m2 all four facades comply and the building result turns to compliant', [tt.includes('مطابق'), tt.includes('غير مطابق')], [true, false]);
set('xe_m', '2'); w.calcResult('egexpo'); tt = txt(w, 'xe_results');
check('the rules page shows the 0.90 m spacing, the 1.20 m corner, the table 3-h distance 10.0 m with ✘ for 8 m, the surfaces B and the class F-2', [tt.includes('0.90 m'), tt.includes('1.20 m'), tt.includes('10.0 m'), tt.includes('✘'), tt.includes('F-2'), w.document.getElementById('xe_g2').style.display], [true, true, true, true, true, '']);
check('other reference codes open egexpo too', others('egexpo', 'xe_results'), [true, true, true]);
}
// ---------- part 209: Egyptian fire code part 1, mixed occupancies and fire separations (`egsep`: Tables 2-b, 3-a, 3-b, 3-c; clauses 2-3-2, 3-3-3, 3-3-4) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const pr = (a, b) => J('xsPair(' + a + ',' + b + ')');
const O = {'A-1': 0, 'A-2': 1, 'A-3': 2, 'A-4': 3, 'B-1': 4, 'B-2': 5, 'C-1': 6, 'C-2': 7, D: 8, E: 9, 'F-1': 10, 'F-2': 11, 'F-3': 12};
const h = (a, b) => { const p = pr(O[a], O[b]); return p === null ? null : p.ok ? p.h + p.note : 'X'; };
check('Table 2-b, assembly subdivisions: A-1 with A-2, A-3, A-4 and the other assembly pairs = 1 h; assembly with institutional B-1 and B-2 = 2 h', [h('A-1', 'A-2'), h('A-1', 'A-3'), h('A-1', 'A-4'), h('A-2', 'A-3'), h('A-2', 'A-4'), h('A-3', 'A-4'), h('A-1', 'B-1'), h('A-4', 'B-1'), h('A-1', 'B-2'), h('A-3', 'B-2'), h('B-1', 'B-2')], ['1', '1', '1', '1', '1', '1', '2', '2', '2', '2', '2']);
check('... residential: C-1 and C-2 with A-1 = 2 h, with A-2 / A-3 / A-4 = 1 h, with B-1 = 2 h, with B-2 = 1 h, C-1 with C-2 = 1 h; D with A-1 = 2, A-2 = 1, A-4 = 1, B-1 = 2, B-2 = 1, C-1 = 1, C-2 = 1', [h('C-1', 'A-1'), h('C-1', 'A-2'), h('C-1', 'A-4'), h('C-1', 'B-1'), h('C-1', 'B-2'), h('C-2', 'A-1'), h('C-2', 'A-3'), h('C-2', 'B-1'), h('C-2', 'B-2'), h('C-1', 'C-2'), h('D', 'A-1'), h('D', 'A-2'), h('D', 'A-4'), h('D', 'B-1'), h('D', 'B-2'), h('D', 'C-1'), h('D', 'C-2')], ['2', '1', '1', '2', '1', '2', '1', '2', '1', '1', '2', '1', '1', '2', '1', '1', '1']);
check('... mercantile E: 2 h with every A, B and C division, 1 h with D; the 🔴 cell D with A-3 is read as 1 h', [['A-1', 'A-2', 'A-3', 'A-4', 'B-1', 'B-2', 'C-1', 'C-2'].map(x => h('E', x)), h('E', 'D'), h('D', 'A-3')], [['2', '2', '2', '2', '2', '2', '2', '2'], '1', '1']);
check('... industrial F-1: not allowed with any A, B or C division; 3 h with D and with E; F-2: 2 h with A, B and C, 1 h (car workshops 2 h) with D and E, 3 h with F-1; F-3: 1 h (garages 1.5 h) with A, C, D, E and F-2, 2 h with B, 3 h with F-1', [['A-1', 'A-2', 'A-3', 'A-4', 'B-1', 'B-2', 'C-1', 'C-2'].map(x => h('F-1', x)), h('F-1', 'D'), h('F-1', 'E'), ['A-1', 'A-4', 'B-1', 'B-2', 'C-1', 'C-2'].map(x => h('F-2', x)), h('F-2', 'D'), h('F-2', 'E'), h('F-2', 'F-1'), ['A-1', 'A-4', 'C-1', 'C-2', 'D', 'E', 'F-2'].map(x => h('F-3', x)), h('F-3', 'B-1'), h('F-3', 'B-2'), h('F-3', 'F-1')], [Array(8).fill('X'), '3', '3', Array(6).fill('2'), '1W', '1W', '3', Array(7).fill('1G'), '2', '2', '3']);
check('the matrix is symmetric, has no entry on the diagonal and every row i has i entries', J(`(function () {
  for (let i = 0; i < 13; i++) { if (XS_M[i].length !== i) return 'row ' + i; if (xsPair(i, i) !== null) return 'diagonal ' + i; for (let j = 0; j < 13; j++) if (JSON.stringify(xsPair(i, j)) !== JSON.stringify(xsPair(j, i))) return 'sym ' + i + ',' + j; }
  return 'ok'; })()`), 'ok');
const C = x => J('xsClosure(' + x + ')');
check('Table 3-c: below 0.75 h none; 0.75 -> 0.5; 1 -> 0.75; 1.5 -> 1; 2 -> 1.5; 3 -> 2; 4 -> 3 (2.5 is not listed: takes the larger neighbour 2)', [0.5, 0.75, 1, 1.5, 2, 3, 4, 2.5].map(x => C(x).c), [0, 0.5, 0.75, 1, 1.5, 2, 3, 2]);
check('exact entries are flagged, the 2.5 h row is not', [C(2).exact, C(2.5).exact, C(0.5).exact], [true, false, true]);
const calc = o => J('xsCalc(' + JSON.stringify(o) + ')');
{
  const r = calc({mode: 0, a: 8, b: 9, ar: 200});
  check('D with E: 1 h, closure 0.75 h, E is not F-1 or F-2 and 200 m2 is within 300 m2: the building may be classified by its main purpose', [r.hEff, r.cl.c, r.accessory], [1, 0.75, true]);
  check('accessory use above 300 m2 or an F-1 / F-2 secondary use is not accepted; 300 m2 exactly is', [calc({mode: 0, a: 8, b: 9, ar: 301}).accessory, calc({mode: 0, a: 8, b: 9, ar: 300}).accessory, calc({mode: 0, a: 8, b: 11, ar: 100}).accessory, calc({mode: 0, a: 8, b: 12, ar: 100}).accessory], [false, true, false, true]);
  check('garage F-3 beside D: 1.5 h (closure 1 h); car repair F-2 beside E: 2 h (closure 1.5 h); F-1 beside residential: not permitted', [calc({mode: 0, a: 8, b: 12, ar: 50}).hEff, calc({mode: 0, a: 8, b: 12, ar: 50}).cl.c, calc({mode: 0, a: 9, b: 11, ar: 50}).hEff, calc({mode: 0, a: 9, b: 11, ar: 50}).cl.c, calc({mode: 0, a: 6, b: 10, ar: 50}).p.ok], [1.5, 1, 2, 1.5, false]);
  check('the one-dwelling rule appears for industrial F-2 / F-3 beside residential', [calc({mode: 0, a: 12, b: 6, ar: 50}).dwelling, calc({mode: 0, a: 6, b: 11, ar: 50}).dwelling, calc({mode: 0, a: 8, b: 6, ar: 50}).dwelling], [true, true, false]);
  check('the same division gives no separation', [calc({mode: 0, a: 4, b: 4, ar: 50}).p], [null]);
}
check('Table 3-a hours: stored hazardous materials 3, transformers 2.5, under stands 0.75, fuel-fired plant (B or F-1, large) 2, other buildings 1, machinery 1, incinerator or boiler 2, refuse store 2 or 1 with sprinklers, refuse chutes 2 or 1 with a fusible-link door, commercial kitchen 1', J('XS_S.map(x => x[1])'), [3, 2.5, 0.75, 2, 1, 1, 2, 2, 1, 2, 1, 1]);
check('...with closures 2, 2, 0.5, 1.5, 0.75, 0.75, 1.5, 1.5, 0.75, 1.5, 0.75, 0.75', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(i => calc({mode: 1, sp: i}).cl.c), [2, 2, 0.5, 1.5, 0.75, 0.75, 1.5, 1.5, 0.75, 1.5, 0.75, 0.75]);
check('Table 3-b: elevator and non-exit stair shafts follow the floors 1 / 1.5 / 2 / 3 / 4 h -> 0.75 / 1 / 1.5 / 2 / 3 h; other shafts -> 0.75 / 1 / 1 / 2 / 3 h; exit stairs are not tabulated', [[0, 1, 2, 3, 4].map(f => calc({mode: 2, vt: 0, fr: f}).h), [0, 1, 2, 3, 4].map(f => calc({mode: 2, vt: 1, fr: f}).h), calc({mode: 2, vt: 2, fr: 0}).h], [[0.75, 1, 1.5, 2, 3], [0.75, 1, 1, 2, 3], null]);
check('shaft closures: 0.75 -> 0.5, 1 -> 0.75, 1.5 -> 1, 2 -> 1.5, 3 -> 2', [[0, 1, 2, 3, 4].map(f => calc({mode: 2, vt: 0, fr: f}).cl.c)], [[0.5, 0.75, 1, 1.5, 2]]);
{
  const m3 = Object.assign({mode: 3, sh: 1, ow: 1, oh: 2.1, sl: 20, tw: 4, spr: false, bh: 12, lc: 0});
  const r = calc(m3);
  check('a 1.0 x 2.1 door in a 1 h separation: area 2.1 m2, closure 0.75 h, within 3.7 m and 12 m2, 4 m of 20 m = 20 %, no division', [r.A, r.cl.c, r.okSize, r.frac, r.okFrac, r.split, r.sections], [2.1, 0.75, true, 20, true, false, 1], 1e-9);
  check('size limits: 3.7 x 3.2 m (11.84 m2) passes, 3.8 m wide fails, 3.7 x 3.24 m (11.99 m2) passes, 3.7 x 3.3 m (12.21 m2) fails; with sprinklers on both sides up to 24 m2 passes and 24.1 m2 fails', [calc(Object.assign({}, m3, {ow: 3.7, oh: 3.2})).okSize, calc(Object.assign({}, m3, {ow: 3.8, oh: 2})).okSize, calc(Object.assign({}, m3, {ow: 3.7, oh: 3.24})).okSize, calc(Object.assign({}, m3, {ow: 3.7, oh: 3.3})).okSize, calc(Object.assign({}, m3, {ow: 6, oh: 4, spr: true})).okSize, calc(Object.assign({}, m3, {ow: 6, oh: 4.02, spr: true})).okSize], [true, false, true, false, true, false]);
  check('openings above 8 m2 must be divided into sections of at most 8 m2: 9 m2 -> 2, 16 m2 -> 2, 16.5 m2 -> 3', [calc(Object.assign({}, m3, {ow: 3, oh: 3})).sections, calc(Object.assign({}, m3, {ow: 4, oh: 4, spr: true})).sections, calc(Object.assign({}, m3, {ow: 5.5, oh: 3, spr: true})).sections], [2, 2, 3]);
  check('total width of openings 25 % of the separation length is allowed, above it is not', [calc(Object.assign({}, m3, {tw: 5})).okFrac, calc(Object.assign({}, m3, {tw: 5.2})).okFrac], [true, false]);
  check('20-minute closure: 0.75 h separation in a building up to 10 m; 1 h separation only for a corridor opening to rented rooms, offices or B-2 rooms; none for 1.5 h', [calc(Object.assign({}, m3, {sh: 0.75, bh: 10})).min20, calc(Object.assign({}, m3, {sh: 0.75, bh: 10.5})).min20, calc(Object.assign({}, m3, {sh: 1})).min20, calc(Object.assign({}, m3, {sh: 1, lc: 1})).min20, calc(Object.assign({}, m3, {sh: 1.5, lc: 1})).min20, calc(Object.assign({}, m3, {sh: 0.5})).min20], [true, false, false, true, false, false]);
  check('an exit enclosure wall never needs more than 1.5 h closure (3 h wall gives 2 -> 1.5) and its openings are exempt from the size limits', [calc(Object.assign({}, m3, {sh: 3, lc: 2})).clEff, calc(Object.assign({}, m3, {sh: 3, lc: 0})).clEff, calc(Object.assign({}, m3, {sh: 1, lc: 2, ow: 6, oh: 5})).okSize], [1.5, 2, true]);
  check('zero separation length gives no ratio', [calc(Object.assign({}, m3, {sl: 0})).frac], [0]);
}
{
  check('fire wall: E, F-1 or F-2 on either side -> 4 h (closure 3 h, roof 2 h, parapet 0.9 m, wall facing vacant land 2 h); otherwise 2 h (closure 1.5 h, roof 1 h, parapet 0.3 m, land 1 h)', [calc({mode: 4, a: 8, b: 9}), calc({mode: 4, a: 8, b: 6}), calc({mode: 4, a: 11, b: 3}), calc({mode: 4, a: 12, b: 12})].map(r => [r.h, r.cl.c, r.roof, r.parapet, r.land]), [[4, 3, 2, 0.9, 2], [2, 1.5, 1, 0.3, 1], [4, 3, 2, 0.9, 2], [2, 1.5, 1, 0.3, 1]], 1e-9);
}
let tt;
w.renderCalc('egsep'); w.calcResult('egsep');
tt = txt(w, 'xs_results');
check('the default page (D beside E) shows the 1 h separation, the 0.75 h closure, the classification by main purpose and the 🔴 note; only the first group is visible', [tt.includes('بين D و E'), tt.includes('1 h'), tt.includes('0.75 h (45 min)'), tt.includes('ممكن'), tt.includes('🔴'), w.document.getElementById('xs_g0').style.display, w.document.getElementById('xs_g1').style.display], [true, true, true, true, true, '', 'none']);
set('xs_a', '0'); set('xs_b', '10'); w.calcResult('egsep'); tt = txt(w, 'xs_results');
check('assembly A-1 with F-1: not permitted in the same building', [tt.includes('غير مسموح'), tt.includes('2-3-2-4')], [true, true]);
set('xs_b', '12'); set('xs_a', '8'); w.calcResult('egsep'); tt = txt(w, 'xs_results');
check('D beside the garage F-3 shows 1.5 h and the reason', [tt.includes('1.5 h'), tt.includes('الجراجات')], [true, true]);
set('xs_m', '1'); w.calcResult('egsep'); tt = txt(w, 'xs_results');
check('the special spaces page: transformers 2.5 h, closure 2 h with the neighbouring-value remark', [tt.includes('2.5 h'), tt.includes('غرفة محولات كهربائية'), tt.includes('القيمة الأعلى المجاورة'), w.document.getElementById('xs_g1').style.display], [true, true, true, '']);
set('xs_m', '2'); w.calcResult('egsep'); tt = txt(w, 'xs_results');
check('the shaft page: elevator shaft in 1.5 h floors needs 1 h; exit stairs refer to clause 4-3-1-1', [tt.includes('1 h'), tt.includes('0.75 h (45 min)')], [true, true]);
set('xs_vt', '2'); w.calcResult('egsep'); tt = txt(w, 'xs_results');
check('exit stairs are not tabulated', [tt.includes('4-3-1-1'), tt.includes('غير مدرجة')], [true, true]);
set('xs_m', '3'); w.calcResult('egsep'); tt = txt(w, 'xs_results');
check('the openings page shows the closure, the size check ✔, the 20 % ratio and no division', [tt.includes('0.75 h (45 min)'), tt.includes('✔'), tt.includes('20.0 %'), tt.includes('لا يلزم')], [true, true, true, true]);
set('xs_ow', '4'); set('xs_oh', '4'); w.calcResult('egsep'); tt = txt(w, 'xs_results');
check('a 4 x 4 m opening fails the size limit (✘) and needs two sections', [tt.includes('غير مطابقة'), tt.includes('✘'), tt.includes('2 أقسام')], [true, true, true]);
set('xs_m', '4'); w.calcResult('egsep'); tt = txt(w, 'xs_results');
check('the fire wall page for D beside E shows 4 h, closure 3 h and the 0.90 m parapet', [tt.includes('4 h'), tt.includes('3 h'), tt.includes('0.90 m')], [true, true, true]);
check('other reference codes open egsep too', others('egsep', 'xs_results'), [true, true, true]);
}
// ---------- part 210: Egyptian fire code part 1, interior finishes and fire stopping (`egfinish`: clauses 3-6-2 to 3-6-8 and 3-4-1) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const cls = (fs, sd) => J('xfClass(' + fs + ',' + sd + ')');
check('3-6-2-4: flame spread 0 - 25 -> A, 26 - 75 -> B, 76 - 200 -> C (class limits are inclusive), above 200 or smoke above 450 -> not classified', [0, 25, 26, 75, 76, 200, 201].map(x => cls(x, 300)).concat([cls(10, 450), cls(10, 451)]), [0, 0, 1, 1, 2, 2, -1, 0, -1]);
check('3-6-2-5 and 3-6-2-6: critical radiant flux 0.45 W/cm2 or more -> class 1, 0.22 or more -> class 2, below that none', [0.5, 0.45, 0.449, 0.22, 0.219, 0].map(x => J('xfFloor(' + x + ')')), [1, 1, 2, 2, 0, 0]);
const calc = o => J('xfCalc(' + JSON.stringify(o) + ')');
{
  const m1 = {mode: 1, req: 1, freq: 1, gb: false, spr: false, act: 1, fact: 1, da: 0, wa: 100};
  check('no sprinklers: requirements stay (B and floor 1); sprinklers lower the walls and ceilings one class: A -> B, B -> C, C stays C; floors 1 -> 2 and 2 -> none', [calc(m1).effReq, calc(Object.assign({}, m1, {spr: true, req: 0})).effReq, calc(Object.assign({}, m1, {spr: true, req: 1})).effReq, calc(Object.assign({}, m1, {spr: true, req: 2})).effReq, calc(Object.assign({}, m1, {spr: true})).fEff, calc(Object.assign({}, m1, {spr: true, freq: 2})).fEff, calc(m1).fEff], [1, 1, 2, 2, 2, 0, 1]);
  check('group B institutions get no reduction even with sprinklers', [calc(Object.assign({}, m1, {spr: true, gb: true, req: 0})).effReq, calc(Object.assign({}, m1, {spr: true, gb: true})).fEff, calc(Object.assign({}, m1, {spr: true, gb: true})).reduce], [0, 1, false]);
  check('a better class replaces a lesser requirement: actual A and B satisfy B, actual C does not; actual none (not classified) never satisfies', [0, 1, 2, -1].map(a => calc(Object.assign({}, m1, {act: a})).okWall), [true, true, false, false]);
  check('floor: actual class 1 satisfies 1 and 2, class 2 does not satisfy 1, unclassified never; nothing required always passes', [calc(Object.assign({}, m1, {fact: 1})).okFloor, calc(Object.assign({}, m1, {fact: 2})).okFloor, calc(Object.assign({}, m1, {fact: 0})).okFloor, calc(Object.assign({}, m1, {freq: 0, fact: 0})).okFloor, calc(Object.assign({}, m1, {freq: 2, fact: 2})).okFloor], [true, false, false, true, true]);
  check('3-6-6: decorations of class C up to 10 % of the wall or ceiling area where A or B is required: 10 % passes, 11 % fails; no limit when C is required', [calc(Object.assign({}, m1, {da: 10})).okDeco, calc(Object.assign({}, m1, {da: 11})).okDeco, calc(Object.assign({}, m1, {req: 2, da: 50})).decoAllowed, calc(Object.assign({}, m1, {req: 2, da: 50})).okDeco], [true, false, null, true]);
}
{
  const m2 = {mode: 2, ua: 9, ud: 3, ga: 36, gd: 12, gap: 0.6, ta: 20, ca: 40, loc: 0, gap2: 1.2};
  const r = calc(m2);
  check('3-6-8: unit 9 m2 and 3 m, group 36 m2 and 12 m, gap 0.60 m and 50 % of the ceiling are all exactly at their limits and pass', [r.okUnit, r.okGroup, r.okGap, r.share, r.okShare, r.ok], [true, true, true, 50, true, true]);
  check('... just beyond each limit fails: unit 9.1 m2 or 3.1 m, group 36.1 m2 or 12.1 m, gap 0.59 m, 51 % of the ceiling', [calc(Object.assign({}, m2, {ua: 9.1})).ok, calc(Object.assign({}, m2, {ud: 3.1})).ok, calc(Object.assign({}, m2, {ga: 36.1})).ok, calc(Object.assign({}, m2, {gd: 12.1})).ok, calc(Object.assign({}, m2, {gap: 0.59})).ok, calc(Object.assign({}, m2, {ta: 20.4})).ok], [false, false, false, false, false, false]);
  check('in a public corridor or an exit stair shaft: 0.9 m2 units at least 1.2 m apart only', [calc(Object.assign({}, m2, {loc: 1, ua: 0.9})).ok, calc(Object.assign({}, m2, {loc: 1, ua: 0.91})).ok, calc(Object.assign({}, m2, {loc: 1, ua: 0.5, gap2: 1.19})).ok, calc(Object.assign({}, m2, {loc: 1, ua: 0.5, gap2: 1.2})).ok], [true, false, false, true]);
  check('no ceiling area gives no share', [calc(Object.assign({}, m2, {ca: 0})).share], [0]);
}
{
  const m3 = {mode: 3, area: 300, fs25: true, spr: false, comp: false, stud: false, h: 2.7};
  check('3-4-1-2: concealed space limit 500 m2 for flame spread up to 25, 250 m2 above; 500 passes, 501 fails; 300 m2 needs 1 part', [calc(m3).limit, calc(Object.assign({}, m3, {fs25: false})).limit, calc(Object.assign({}, m3, {area: 500})).ok, calc(Object.assign({}, m3, {area: 501})).ok, calc(m3).parts], [500, 250, true, false, 1]);
  check('parts needed: 1200 m2 at 250 -> 5, 1250 -> 5, 1251 -> 6; sprinklers or a fire compartment design remove the limit', [calc(Object.assign({}, m3, {area: 1200, fs25: false})).parts, calc(Object.assign({}, m3, {area: 1250, fs25: false})).parts, calc(Object.assign({}, m3, {area: 1251, fs25: false})).parts, calc(Object.assign({}, m3, {area: 5000, spr: true})).ok, calc(Object.assign({}, m3, {area: 5000, comp: true})).ok], [5, 5, 6, true, true]);
  check('3-4-1-3: combustible studs or sheathing: height up to 3 m passes, 3.1 m needs 2 vertical parts, 7 m needs 3', [calc(Object.assign({}, m3, {stud: true, h: 3})).okStud, calc(Object.assign({}, m3, {stud: true, h: 3.1})).okStud, calc(Object.assign({}, m3, {stud: true, h: 3.1})).studParts, calc(Object.assign({}, m3, {stud: true, h: 7})).studParts, calc(Object.assign({}, m3, {stud: false, h: 9})).okStud], [true, false, 2, 3, true]);
}
let tt;
w.renderCalc('egfinish'); w.calcResult('egfinish');
tt = txt(w, 'xf_results');
check('the default page classifies flame spread 40 / smoke 300 as B and the floor flux 0.30 as class 2, with the 🔴 note; only the first group is visible', [tt.includes('نوعية تشطيب الحوائط والأسقفB'), tt.includes('نوعية تشطيب الأرضيات2'), tt.includes('🔴'), w.document.getElementById('xf_g0').style.display, w.document.getElementById('xf_g1').style.display], [true, true, true, '', 'none']);
set('xf_fs', '300'); w.calcResult('egfinish'); tt = txt(w, 'xf_results');
check('flame spread 300 is not classified and the reason is shown', [tt.includes('غير مصنفة'), tt.includes('أكبر من 200')], [true, true]);
set('xf_m', '1'); w.calcResult('egfinish'); tt = txt(w, 'xf_results');
check('the requirements page shows the required B, the adopted B, ✔ for an actual B and the decorations at 0 %', [tt.includes('النوعية المطلوبة للحوائط والأسقفB'), tt.includes('النوعية المعتمدة بعد التخفيضB'), tt.includes('✔'), tt.includes('0.0 %')], [true, true, true, true]);
set('xf_sp', '1'); w.calcResult('egfinish'); tt = txt(w, 'xf_results');
check('with sprinklers the adopted class becomes C and the floor requirement is lowered to 2', [tt.includes('النوعية المعتمدة بعد التخفيضC'), tt.includes('بعد التخفيض: 2')], [true, true]);
set('xf_gb', '1'); w.calcResult('egfinish'); tt = txt(w, 'xf_results');
check('group B shows that there is no reduction', [tt.includes('النوعية المعتمدة بعد التخفيضB'), tt.includes('لا يسري التخفيض')], [true, true]);
set('xf_m', '2'); w.calcResult('egfinish'); tt = txt(w, 'xf_results');
check('the light fixtures page is compliant for the defaults (4 m2 units, 20 m2 groups, 25 % of the ceiling)', [tt.includes('مطابقة'), tt.includes('25.0 %'), w.document.getElementById('xf_g2').style.display], [true, true, '']);
set('xf_ta', '25'); w.calcResult('egfinish'); tt = txt(w, 'xf_results');
check('62.5 % of the ceiling fails the 50 % limit', [tt.includes('62.5 %'), tt.includes('غير مطابقة'), tt.includes('✘')], [true, true, true]);
set('xf_m', '3'); w.calcResult('egfinish'); tt = txt(w, 'xf_results');
check('the concealed spaces page shows 500 m2, 300 m2 passing and one part', [tt.includes('500 m²'), tt.includes('300.0 m²'), tt.includes('✔')], [true, true, true]);
set('xf_fc', '1'); w.calcResult('egfinish'); tt = txt(w, 'xf_results');
check('flame spread above 25 lowers the limit to 250 m2 and 300 m2 needs two parts', [tt.includes('250 m²'), tt.includes('✘')], [true, true]);
check('other reference codes open egfinish too', others('egfinish', 'xf_results'), [true, true, true]);
}
// ---------- part 211: Egyptian fire code part 4, chapter 3 automatic sprinklers (`egspr`: Figure 3-1 area / density curves, Tables 3-A to 3-K, clauses 3-14 to 3-31) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const F2 = 0.09290304, G = 40.7458;
const dens = (c, a) => J('xrDensity(' + c + ',' + a + ')');
check('Figure 3-1 ends in L/min/m2: light 0.10 gpm/ft2 at 1500 ft2 = 4.07 and 0.07 at 3000 ft2 = 2.85; ordinary 1: 6.11 and 4.07 (4000 ft2); ordinary 2: 8.15 and 6.11; extra 1: 12.22 at 2500 ft2 and 8.15 at 5000 ft2; extra 2: 16.30 and 12.22', [[0, 1500], [0, 3000], [1, 1500], [1, 4000], [2, 1500], [2, 4000], [3, 2500], [3, 5000], [4, 2500], [4, 5000]].map(x => dens(x[0], x[1] * F2)), [0.10 * G, 0.07 * G, 0.15 * G, 0.10 * G, 0.20 * G, 0.15 * G, 0.30 * G, 0.20 * G, 0.40 * G, 0.30 * G], 1e-9);
check('between the ends the curve is a straight line: light at 2250 ft2 = 0.085 gpm/ft2; ordinary 1 at 2750 ft2 = 0.125; extra 2 at 3750 ft2 = 0.35', [dens(0, 2250 * F2), dens(1, 2750 * F2), dens(4, 3750 * F2)], [0.085 * G, 0.125 * G, 0.35 * G], 1e-9);
check('outside the curve the end values are used: light below 1500 ft2 and above 3000 ft2; extra below 2500 ft2 and above 5000 ft2', [dens(0, 50), dens(0, 900), dens(3, 100), dens(3, 700), dens(4, 700)], [0.10 * G, 0.07 * G, 0.30 * G, 0.20 * G, 0.30 * G], 1e-9);
const calc = o => J('xrCalc(' + JSON.stringify(o) + ')');
{
  const m0 = {mode: 0, c: 1, area: 1500 * F2, dry: false, hot: false, hoseSel: 0, tm: 0, sa: 12, K: 80};
  const r = calc(m0), d = 0.15 * G;
  check('ordinary group 1 over 1500 ft2 (139.35 m2): density 6.11 L/min/m2, flow 852 L/min, 12 sprinklers of 12 m2 each discharging 73.3 L/min at (73.3 / 80)^2 = 0.84 bar', [r.d, r.Q, r.heads, r.qHead, r.pHead], [d, d * 1500 * F2, 12, d * 12, Math.pow(d * 12 / 80, 2)], 1e-9);
  check('duration 60 minutes for ordinary hazard; volume = 852 x 60 / 1000 = 51.1 m3; maximum area of one system 4850 m2', [r.t, r.V, r.maxArea], [60, d * 1500 * F2 * 60 / 1000, 4850], 1e-9);
  check('hose allowances: 190 L/min for one point, 380 for two or more, and the combined inside and outside flow of Table 3-e: 380 light, 950 ordinary, 1900 extra', [calc(Object.assign({}, m0, {hoseSel: 1})).Qh, calc(Object.assign({}, m0, {hoseSel: 2})).Qh, calc(Object.assign({}, m0, {hoseSel: 3, c: 0})).Qh, calc(Object.assign({}, m0, {hoseSel: 3, c: 2})).Qh, calc(Object.assign({}, m0, {hoseSel: 3, c: 3})).Qh], [190, 380, 380, 950, 1900]);
  check('durations: light 30 or 30, ordinary 60 or 90, extra 90 or 120 minutes', [calc(Object.assign({}, m0, {c: 0})).t, calc(Object.assign({}, m0, {c: 0, tm: 1})).t, calc(m0).t, calc(Object.assign({}, m0, {tm: 1})).t, calc(Object.assign({}, m0, {c: 3})).t, calc(Object.assign({}, m0, {c: 4, tm: 1})).t], [30, 30, 60, 90, 90, 120]);
  const dry = calc(Object.assign({}, m0, {dry: true, area: 200}));
  check('a dry system increases the design area by 30 %: 200 m2 -> 260 m2 with the density read at 260 m2', [dry.A, dry.d], [260, dens(1, 260)], 1e-9);
  check('high-temperature sprinklers cut the design area 25 % in extra hazard but never below 186 m2: 400 -> 300, 200 -> 186; they do nothing in ordinary hazard', [calc(Object.assign({}, m0, {c: 3, hot: true, area: 400})).A, calc(Object.assign({}, m0, {c: 3, hot: true, area: 200})).A, calc(Object.assign({}, m0, {c: 1, hot: true, area: 200})).A], [300, 186, 200], 1e-9);
  check('areas outside the curve are flagged: below the start (50 m2 -> the start density) and above the end (500 m2 on the light curve)', [calc(Object.assign({}, m0, {area: 50})).below, calc(Object.assign({}, m0, {c: 0, area: 500})).above, calc(m0).below, calc(m0).above], [true, true, false, false]);
  check('extra hazard areas above 3750 m2 are not allowed for one system through the area limit 3750 m2', [calc(Object.assign({}, m0, {c: 3})).maxArea, calc(Object.assign({}, m0, {c: 4})).maxArea, calc(Object.assign({}, m0, {c: 0})).maxArea], [3750, 3750, 4850]);
}
{
  const p = (haz, mat, above, wide, n) => J('(function () { const t = ' + (above ? (haz ? "'j'" : "'g'") : (haz ? "'h'" : "'f'")) + '; return xrPipe(t, ' + mat + ', ' + n + ', ' + wide + '); })()');
  check('Table 3-f, light hazard steel: 2 sprinklers DN 25, 3 -> 32, 5 -> 38, 10 -> 50, 30 -> 63, 60 -> 75; copper: 12 -> 50, 40 -> 63, 65 -> 75; one more than the limit moves to the next size', [2, 3, 4, 5, 6, 10, 11, 30, 31, 60].map(n => p(0, 0, false, false, n).dn).concat([12, 13, 40, 41, 65].map(n => p(0, 1, false, false, n).dn)), [25, 32, 38, 38, 50, 50, 63, 63, 75, 75, 50, 63, 63, 75, 75]);
  check('... beyond DN 75 (60 steel, 65 copper) the table has no row', [p(0, 0, false, false, 61), p(0, 1, false, false, 66)], [null, null]);
  check('Table 3-h, ordinary hazard steel: 2, 3, 5, 10, 20, 40, 100, 160, 275 sprinklers -> DN 25, 32, 38, 50, 63, 75, 100, 125, 150; copper 12, 25, 45, 115, 180, 300 -> 50, 63, 75, 100, 125, 150', [2, 3, 5, 10, 20, 40, 100, 160, 275].map(n => p(1, 0, false, false, n).dn).concat([12, 25, 45, 115, 180, 300].map(n => p(1, 1, false, false, n).dn)), [25, 32, 38, 50, 63, 75, 100, 125, 150, 50, 63, 75, 100, 125, 150]);
  check('... 276 steel sprinklers have no row in the table (DN 200 by the area limit)', [p(1, 0, false, false, 276), p(1, 1, false, false, 301)], [null, null]);
  check('Table 3-i: when the branches are more than 3.7 m apart DN 63 / 75 / 100 take 15 / 30 / 60 steel (20 / 35 / 65 copper): 15 -> 63, 16 -> 75, 31 -> 100, 61 -> 125 (160 of the normal table)', [15, 16, 30, 31, 60, 61].map(n => p(1, 0, false, true, n).dn).concat([20, 21, 35, 36, 65, 66].map(n => p(1, 1, false, true, n).dn)), [63, 75, 75, 100, 100, 125, 63, 75, 75, 100, 100, 125]);
  check('Table 3-g (light above and below ceilings): 2, 4, 7, 15, 50 steel -> DN 25 to 63; copper 18 -> 50, 65 -> 63; Table 3-j (ordinary): 2, 4, 7, 15, 30, 60 -> DN 25 to 75; copper 18, 40, 65', [2, 4, 7, 15, 50].map(n => p(0, 0, true, false, n).dn).concat([18, 65].map(n => p(0, 1, true, false, n).dn), [2, 4, 7, 15, 30, 60].map(n => p(1, 0, true, false, n).dn), [18, 40, 65].map(n => p(1, 1, true, false, n).dn)), [25, 32, 38, 50, 63, 50, 63, 25, 32, 38, 50, 63, 75, 50, 63, 75]);
  const m1 = {mode: 1, haz: 1, mat: 0, above: false, wide: false, n: 20, side: 8, area: 300};
  check('the page logic: 20 ordinary steel sprinklers -> DN 63; 276 -> DN 200 by area; light 61 -> DN 100 by area; above and below ceilings beyond the table -> feed pipe at least DN 75 sized by the normal table', [calc(m1).p.dn, calc(Object.assign({}, m1, {n: 276})).p.dn, calc(Object.assign({}, m1, {n: 276})).byArea, calc(Object.assign({}, m1, {haz: 0, n: 61})).p.dn, calc(Object.assign({}, m1, {haz: 0, above: true, n: 51})).back, calc(Object.assign({}, m1, {haz: 0, above: true, n: 51})).p2.dn, calc(Object.assign({}, m1, {haz: 1, above: true, n: 61})).p2.dn], [63, 200, true, 100, true, 75, 100]);
  check('branch line: up to 8 sprinklers per side; 9 or 10 only with larger pipes; more than 10 not allowed', [8, 9, 10, 11].map(s => [calc(Object.assign({}, m1, {side: s})).sideOk, calc(Object.assign({}, m1, {side: s})).sideLarge]), [[true, false], [false, true], [false, true], [false, false]]);
  const s0 = calc(Object.assign({}, m1, {haz: 0})), s1 = calc(m1);
  check('Table 3-d: light 1 bar, 1890 - 2840 L/min, 30 - 60 min; ordinary 1.4 bar, 3220 - 5680 L/min, 60 - 90 min; Table 3-e hose allowance combined 380 L/min (30 min) and 950 L/min (60 - 90 min)', [s0.sup, s1.sup, s0.hose, s1.hose], [[1, 1890, 2840, 30, 60], [1.4, 3220, 5680, 60, 90], [190, 380, 380, 30, 30], [190, 380, 950, 60, 90]]);
  check('water volume range: light (1890 + 380) x 30 = 68.1 m3 to (2840 + 380) x 60 = 193.2 m3; ordinary (3220 + 950) x 60 = 250.2 m3 to (5680 + 950) x 90 = 596.7 m3', [s0.vLow, s0.vHigh, s1.vLow, s1.vHigh], [68.1, 193.2, 250.2, 596.7], 1e-9);
  check('the pipe-schedule method is accepted for new work up to 465 m2; the largest areas are 4850 m2', [calc(Object.assign({}, m1, {area: 465})).areaOk, calc(Object.assign({}, m1, {area: 466})).areaOk, s1.maxArea], [true, false, 4850]);
}
{
  const m2 = {mode: 2, haz: 0, ct: 0, hyd: false, sw: false, s: 3.6, b: 3.6, we: 1.5, wb: 3, bd: 0.6};
  const a = o => calc(Object.assign({}, m2, o));
  check('maximum area per sprinkler: light 19 m2 (21 m2 hydraulic) on flat ceilings or beams, 12 m2 under wooden joists, 16 m2 otherwise; ordinary 12 m2 for every construction; extra 8.5 m2 (9.3 m2 hydraulic)', [a({}).areaMax, a({hyd: true}).areaMax, a({ct: 1}).areaMax, a({ct: 2}).areaMax, a({haz: 1}).areaMax, a({haz: 1, ct: 2}).areaMax, a({haz: 2}).areaMax, a({haz: 2, hyd: true}).areaMax], [19, 21, 12, 16, 12, 12, 8.5, 9.3]);
  check('sidewall sprinklers: light 18 m2 (16 m2 for combustible ceilings closed with resistant material), ordinary 9.3 m2 (7.5 m2), extra not given; branch spacing up to 4.25 m (light) or 3 m (ordinary)', [a({sw: true}).areaMax, a({sw: true, ct: 1}).areaMax, a({sw: true, haz: 1}).areaMax, a({sw: true, haz: 1, ct: 1}).areaMax, a({sw: true, haz: 2}).areaMax, a({sw: true}).bMax, a({sw: true, haz: 1}).bMax], [18, 16, 9.3, 7.5, null, 4.25, 3]);
  check('3.6 x 3.6 m (12.96 m2) passes the 19 m2 light limit and fails the 12 m2 limit of ordinary hazard; 4.6 m spacing passes light and ordinary but 3.7 m is the limit of extra hazard', [a({}).okArea, a({haz: 1}).okArea, a({s: 4.6, b: 4.1}).okS, a({s: 4.61}).okS, a({haz: 2, s: 3.7}).okS, a({haz: 2, s: 3.71}).okS], [true, false, true, false, true, false]);
  check('distance of the end sprinkler from the wall: not above half the allowed spacing (2.3 m, 1.85 m for extra) and not less than 0.10 m; end branch from the wall not above 1.5 times the allowed spacing (6.9 m, 5.55 m)', [a({we: 2.3}).okEnd, a({we: 2.31}).okEnd, a({we: 0.1}).okEnd, a({we: 0.09}).okEnd, a({haz: 2, we: 1.85}).okEnd, a({haz: 2, we: 1.86}).okEnd, a({wb: 6.9}).okBranch, a({wb: 6.91}).okBranch, a({haz: 2, wb: 5.55}).okBranch], [true, false, true, false, true, false, true, false, true]);
  check('Table 3-k: lateral distance to the beam (m) -> largest vertical distance (mm): < 0.3 -> 0, 0.3 -> 25, 0.45 -> 50, 0.6 -> 75, 0.75 -> 100, 0.9 -> 150, 1.05 -> 175, 1.2 -> 225, 1.35 -> 275, 1.5 -> 350; 1.65 and more is outside the table', [0.2, 0.3, 0.44, 0.45, 0.6, 0.75, 0.9, 1.05, 1.2, 1.35, 1.5, 1.64, 1.65].map(d => J('xrBeam(' + d + ')')), [0, 25, 25, 50, 75, 100, 150, 175, 225, 275, 350, 350, null]);
}
{
  const m3 = {mode: 3, dn: 0, pmax: 8, haz: 1, tank: 11000, hw: 3};
  check('Table 3-c flushing flow: DN 100 -> 1514 L/min, 125 -> 2271, 150 -> 2839, 200 -> 3785, 250 -> 5678, 300 -> 7570 (the 400, 600, 750, 1000, 1500 and 2000 gpm of NFPA 13)', [0, 1, 2, 3, 4, 5].map(i => calc(Object.assign({}, m3, {dn: i})).flush), [1514, 2271, 2839, 3785, 5678, 7570]);
  check('hydrostatic test 14 bar for 2 h; above 10 bar working pressure it is the working pressure + 4 bar: 10 -> 14, 10.5 -> 14.5, 12 -> 16; 12 bar is the largest working pressure', [8, 10, 10.5, 12].map(p => calc(Object.assign({}, m3, {pmax: p})).test).concat([calc(Object.assign({}, m3, {pmax: 12})).airOk, calc(Object.assign({}, m3, {pmax: 12.5})).airOk]), [14, 14, 14.5, 16, true, false]);
  check('pressure tank: at least 7500 L (light) or 11000 L (ordinary); internal pressure at least 5.5 bar + 3 x the water-column pressure: 3 m -> 5.5 + 3 x 3 / 10.197 = 6.38 bar', [calc(Object.assign({}, m3, {haz: 0})).tankMin, calc(m3).tankMin, calc(Object.assign({}, m3, {tank: 10999})).tankOk, calc(m3).tankOk, calc(m3).tankP], [7500, 11000, false, true, 5.5 + 9 / 10.197], 1e-9);
}
{
  const m4 = {mode: 4, grp: 0, rack: 0, h: 1.5, box: false, gap: 2};
  const s = o => calc(Object.assign({}, m4, o));
  check('Table 3-a: groups I and III on bases -> ordinary 1, groups II and IV -> ordinary 2; on shelves or racks: I and III -> high 1, II and IV -> high 2', [0, 1, 2, 3].map(g => s({grp: g}).deg).concat([0, 1, 2, 3].map(g => s({grp: g, rack: 1}).deg)), ['خطورة عادية، المجموعة 1', 'خطورة عادية، المجموعة 2', 'خطورة عادية، المجموعة 1', 'خطورة عادية، المجموعة 2', 'خطورة عالية، المجموعة 1', 'خطورة عالية، المجموعة 2', 'خطورة عالية، المجموعة 1', 'خطورة عالية، المجموعة 2']);
  check('Table 3-b (plastics group A): up to 1.5 m -> ordinary 2 with 2.0 m clearance; 1.5 - 3 m: shelves in cartons -> high 1, shelves without cartons -> high 2, racks / bases -> high 2, clearance 1.5 m; above 3 m not given', [s({}).plastic, s({}).gap, s({h: 2, rack: 1, box: true}).plastic, s({h: 2, rack: 1}).plastic, s({h: 2}).plastic, s({h: 2}).gap, s({h: 3.5}).plastic, s({h: 3.5}).gap], ['خطورة عادية، المجموعة 2', 2, 'خطورة عالية، المجموعة 1', 'خطورة عالية، المجموعة 2', 'خطورة عالية، المجموعة 2', 1.5, '', null]);
  check('clearance between stock and ceiling: 2.0 m is needed up to 1.5 m of stock, 1.5 m above; smaller values fail', [s({gap: 2}).okGap, s({gap: 1.9}).okGap, s({h: 2, gap: 1.5}).okGap, s({h: 2, gap: 1.4}).okGap, s({h: 3.5}).okGap], [true, false, true, false, null]);
}
let tt;
w.renderCalc('egspr'); w.calcResult('egspr');
tt = txt(w, 'xr_results');
check('the default page (ordinary group 1, 139.4 m2, one inside hose) shows the curve, the density 6.11, the flows 852 + 190 = 1042 L/min, the 60 minute duration, the volume and the 🔴 note; only the first group is visible', [tt.includes('خطورة عادية، المجموعة الأولى'), tt.includes('6.11 L/min/m²'), tt.includes('852 L/min'), tt.includes('1042 L/min'), tt.includes('60 min'), tt.includes('62.5 m³'), tt.includes('🔴'), w.document.getElementById('xr_g0').style.display, w.document.getElementById('xr_g1').style.display], [true, true, true, true, true, true, true, '', 'none']);
set('xr_dr', '1'); set('xr_a', '200'); w.calcResult('egspr'); tt = txt(w, 'xr_results');
check('a dry system shows the 260 m2 design area', [tt.includes('260.0 m²'), tt.includes('30 %')], [true, true]);
set('xr_m', '1'); w.calcResult('egspr'); tt = txt(w, 'xr_results');
check('the pipe-schedule page: 20 steel sprinklers need DN 63, the supply ranges and the volume range 250.2 - 596.7 m3 appear, 300 m2 is within 465 m2', [tt.includes('DN 63'), tt.includes('3220'), tt.includes('5680'), tt.includes('250.2 - 596.7 m³'), tt.includes('✔'), w.document.getElementById('xr_g1').style.display], [true, true, true, true, true, '']);
set('xr_n', '300'); w.calcResult('egspr'); tt = txt(w, 'xr_results');
check('300 ordinary sprinklers need DN 200 by the area limit', [tt.includes('DN 200'), tt.includes('4850')], [true, true]);
set('xr_m', '2'); w.calcResult('egspr'); tt = txt(w, 'xr_results');
check('the coverage page: 12.96 m2 against the ordinary 12 m2 fails ✘, the 3.6 m spacing passes, the beam distance 0.6 m gives 75 mm', [tt.includes('12.96 m²'), tt.includes('✘'), tt.includes('75 mm')], [true, true, true]);
set('xr_m', '3'); w.calcResult('egspr'); tt = txt(w, 'xr_results');
check('the tests page shows the flushing flow 1514 L/min, the 14 bar test, 2.8 bar air test, tank 11000 L ✔ and 6.38 bar', [tt.includes('1514 L/min'), tt.includes('14.0 bar'), tt.includes('2.8 bar'), tt.includes('11000 L'), tt.includes('6.38 bar')], [true, true, true, true, true]);
set('xr_m', '4'); w.calcResult('egspr'); tt = txt(w, 'xr_results');
check('the storage page shows group I on bases as ordinary 1 and the plastics clearance', [tt.includes('خطورة عادية، المجموعة 1'), tt.includes('الفراغ بين قمة المخزون والسقف')], [true, true]);
check('other reference codes open egspr too', others('egspr', 'xr_results'), [true, true, true]);
}
// ---------- part 212: Egyptian fire code part 4, chapters 1 and 2 (`egfw`: hydrants and external network, Hazen-Williams hydraulics with Tables 1-A / 1-B, standpipes Tables 2-C to 2-G, tie rods and straps) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('equivalent-length conversion (C / 120)^1.85: C 100 -> 0.714 (printed 0.713), 120 -> 1, 130 -> 1.160 (1.16), 140 -> 1.330 (1.32 in Table 1-B, 1.33 in Table 2-F), 150 -> 1.511 (1.51)', [100, 120, 130, 140, 150].map(c => J('ewCf(' + c + ')')), [0.713, 1, 1.16, 1.33, 1.51], 0.0035);
const F = (Q, d, c) => J('ewFric(' + [Q, d, c].join(',') + ')');
{
  const f = F(1900, 100, 120), ref = 6.05 * Math.pow(1900, 1.85) / (Math.pow(120, 1.85) * Math.pow(100, 4.87)) * 1e5;
  check('equation 1: 1900 L/min in 100 mm at C = 120 -> 6.05 x Q^1.85 / (C^1.85 d^4.87) x 10^5 = 0.01805 bar/m', [f], [ref], 1e-12);
  const si = 10.67 * Math.pow(1900 / 60000, 1.852) / (Math.pow(120, 1.852) * Math.pow(0.1, 4.87)) / 10.1972;
  check('... agrees with the usual SI Hazen-Williams formula (10.67 Q^1.852 / C^1.852 d^4.87 in m of water) within 2 %', [f / si > 0.98 && f / si < 1.02], [true]);
  check('friction rises as Q^1.85 (double flow -> 3.605 times), falls as d^-4.87 and as C^-1.85; zero when any input is zero', [F(3800, 100, 120) / f, F(1900, 150, 120) / f, F(1900, 100, 150) / f, F(0, 100, 120), F(1900, 0, 120), F(1900, 100, 0)], [Math.pow(2, 1.85), Math.pow(1.5, -4.87), Math.pow(1.25, -1.85), 0, 0, 0], 1e-9);
  const v = J('ewVel(1900, 100)'), pv = J('ewVelP(1900, 100)');
  check('velocity 1900 L/min in 100 mm = 4.032 m/s and velocity pressure 500 v2 = 0.0813 bar (the printed constant 0.005682 does not give this in bar, L/min and mm)', [+v.toFixed(3), +pv.toFixed(4)], [4.032, 0.0813], 0.0005);
}
const EQ = (dn, cnt, c) => J('ewEqLen(' + dn + ',' + JSON.stringify(cnt) + ',' + c + ')');
check('Table 1-a rows (45, short 90, long 90, tee, gate, butterfly, check): DN 20 = 0.3 / 0.6 / 0.3 / 1.2 / - / - / 1.2; DN 100 = 1.2 / 3.0 / 1.8 / 6.0 / 0.6 / 3.7 / 6.7; DN 300 = 4.0 / 8.2 / 5.5 / 18.3 / 1.8 / 8.0 / 19.8', [J('EW_EQ[0]'), J('EW_EQ[7]'), J('EW_EQ[12]')], [[20, 0.3, 0.6, 0.3, 1.2, null, null, 1.2], [100, 1.2, 3.0, 1.8, 6.0, 0.6, 3.7, 6.7], [300, 4.0, 8.2, 5.5, 18.3, 1.8, 8.0, 19.8]]);
check('every row rises with the diameter in every column and the printed 13 diameters are 20 - 300 mm', J(`(function () { const bad = []; for (let i = 1; i < EW_EQ.length; i++) for (let k = 1; k < 8; k++) { const a = EW_EQ[i - 1][k], b = EW_EQ[i][k]; if (a !== null && b !== null && b < a) bad.push(i + ',' + k); if (a !== null && b === null) bad.push('null ' + i + ',' + k); } return [EW_EQ.length, EW_EQ[0][0], EW_EQ[12][0], bad]; })()`), [13, 20, 300, []]);
{
  const e = EQ(100, [0, 0, 2, 1, 1, 0, 1], 120);
  check('DN 100: 2 long elbows 1.8 + tee 6.0 + gate 0.6 + check 6.7 = 16.9 m at C = 120; at C = 140 x 1.330 = 22.48 m; at C = 100 x 0.714 = 12.06 m', [e.base, e.len, EQ(100, [0, 0, 2, 1, 1, 0, 1], 140).len, EQ(100, [0, 0, 2, 1, 1, 0, 1], 100).len], [16.9, 16.9, 16.9 * 1.3303, 16.9 * 0.71384], 0.01);
  check('a valve missing from the table for a small pipe is reported: gate valve in DN 25 contributes nothing and is listed', [EQ(25, [0, 0, 0, 0, 2, 0, 0], 120).len, EQ(25, [0, 0, 0, 0, 2, 0, 0], 120).miss], [0, ['محبس بوابة']]);
  check('a diameter between rows takes the larger row: DN 90 -> DN 100 row; above 300 -> the last row', [EQ(90, [1, 0, 0, 0, 0, 0, 0], 120).row, EQ(500, [1, 0, 0, 0, 0, 0, 0], 120).row], [100, 300]);
}
const T2 = (Q, L) => J('ewT2c(' + Q + ',' + L + ')');
check('Table 2-c: up to 380 L/min -> 50 / 63 / 75 mm by length (15, 15 - 30, over 30 m); 380 - 1900 -> 100 / 100 / 150; 1900 - 2850 -> 125 / 125 / 150; 2850 - 4750 -> 150; above 4750 -> 200', [[380, 15], [380, 16], [380, 31], [1900, 10], [1900, 20], [1900, 31], [1901, 10], [2850, 31], [2851, 10], [4750, 100], [4751, 5]].map(x => T2(x[0], x[1])), [50, 63, 75, 100, 100, 150, 125, 150, 150, 150, 200]);
const calc = o => J('ewCalc(' + JSON.stringify(o) + ')');
{
  const m0 = {mode: 0, sp: 90, nd: 2, fd: 20, dm: 150, df: 100, ht: 0, oh: 500, ct: 0, cv: 0.9, fd2: 150, pw: 8, nj: 100, vd: 600, nh: 4};
  const a = o => calc(Object.assign({}, m0, o));
  check('hydrants: spacing up to 100 m, two within 30 m of the main entrance, one within 25 m of every facade; the mains at least 150 mm and the feed at least 100 mm', [a({}).okSpace, a({sp: 101}).okSpace, a({nd: 1}).okDoor, a({fd: 25}).okFacade, a({fd: 26}).okFacade, a({dm: 149}).okMain, a({df: 99}).okFeed, a({}).okMain, a({}).okFeed], [true, false, false, true, false, false, false, true, true]);
  check('hose outlet centre: barrel hydrant 450 - 600 mm, wall hydrant 600 - 800 mm, underground not restricted; barrel in a box 300 mm above the box bottom', [a({oh: 449}).okH, a({oh: 450}).okH, a({oh: 600}).okH, a({oh: 601}).okH, a({ht: 1, oh: 600}).okH, a({ht: 1, oh: 801}).okH, a({ht: 2}).okH, a({}).boxH, a({ht: 1}).boxH], [false, true, true, false, true, false, null, 300, null]);
  check('burial depth: 0.8 m in ordinary soil, 0.9 m under roads, 1.2 m under railways', [a({cv: 0.79}).okCover, a({cv: 0.8}).okCover, a({ct: 1, cv: 0.89}).okCover, a({ct: 1, cv: 0.9}).okCover, a({ct: 2, cv: 1.19}).okCover, a({ct: 2, cv: 1.2}).okCover], [false, true, false, true, false, true]);
  check('flushing flow at 3 m/s: DN 100 1475, 150 3330, 200 5900, 250 9235, 300 13320 L/min', [100, 150, 200, 250, 300].map(d => a({fd2: d}).flush), [1475, 3330, 5900, 9235, 13320]);
  check('hydrostatic test 14 bar for 2 h up to 10 bar working pressure, above it the working pressure + 4 bar', [8, 10, 10.5, 12].map(p => a({pw: p}).test), [14, 14, 14.5, 16]);
  check('allowed leakage: 2.0 L/h per 100 joints + 1.0 mL/h per mm of isolating valve sizes + 150 mL/min (9 L/h) per hydrant = 2 + 0.6 + 36 = 38.6 L/h', [a({}).leak, a({}).leakParts], [38.6, [2, 0.6, 36]], 1e-9);
}
{
  const m1 = {mode: 1, Q: 1900, dn: 100, d: 0, cm: 1, sys: 1, L: 50, dz: 10, pin: 8, cn: [0, 0, 2, 1, 1, 0, 1], K: 80, pnoz: 1, Kus: 5.6};
  const r = calc(m1), f = F(1900, 100, 120);
  check('run of 50 m + 16.9 m equivalent in 100 mm black steel (C = 120): loss = 0.01805 x 66.9 = 1.208 bar, elevation 10 m = 0.981 bar, outlet total pressure 8 - 1.208 - 0.981 = 5.81 bar', [r.c, r.f, r.eq.len, r.Ltot, r.loss, r.elev, r.pOut], [120, f, 16.9, 66.9, f * 66.9, 10 * 0.0980665, 8 - f * 66.9 - 0.980665], 1e-9);
  check('normal pressure Pn = Pt - Pv (equation 3) and nozzle flow Q = K sqrt(P): 80 L/min at 1 bar, 113.1 at 2 bar; Km = 14.4 x 5.6 = 80.64', [r.pn, calc(Object.assign({}, m1, {pnoz: 2})).Qn, r.Qn, r.Km], [r.pOut - J('ewVelP(1900, 100)'), 80 * Math.sqrt(2), 80, 80.64], 1e-9);
  check('the actual inside diameter replaces the nominal one: 106 mm gives 19.4 % of the 100 mm friction x (100/106)^4.87 and the equivalent length still uses the nominal row', [calc(Object.assign({}, m1, {d: 106})).f, calc(Object.assign({}, m1, {d: 106})).eq.row], [F(1900, 106, 120), 100], 1e-9);
  check('materials: external network black steel (Table 1-c) 120, cast iron 100, plastic 150, cement-lined 140; inside systems black steel dry 100 (Table 2-d); a material absent from a table gives no C', [calc(Object.assign({}, m1, {sys: 0, cm: 1})).c, calc(Object.assign({}, m1, {sys: 0, cm: 0})).c, calc(Object.assign({}, m1, {sys: 0, cm: 4})).c, calc(Object.assign({}, m1, {sys: 0, cm: 5})).c, calc(Object.assign({}, m1, {sys: 1, cm: 2})).c, calc(Object.assign({}, m1, {sys: 0, cm: 2})).cOk, calc(Object.assign({}, m1, {sys: 1, cm: 7})).cOk], [120, 100, 150, 140, 100, false, false]);
}
{
  const m2 = {mode: 2, cls: 0, spr: false, comb: false, hyd: false, area: 3000, Q: 1900, L: 40, le: 15, H: 30, dn: 150, cm: 1, h2: 0, hs: 63, rch: 40, pr: 4.5, pm: 7, ps: 16, hh: 1.2};
  const s = o => calc(Object.assign({}, m2, o));
  check('Table 2-c gives DN 150 for 1900 L/min over 30 m; the minimum is 100 mm (class 1 and 3), 150 mm for a combined hose-and-sprinkler riser, 100 mm again for a fully sprinklered hydraulically designed combined system, none for class 2', [s({}).t2c, s({}).dnMin, s({comb: true}).dnMin, s({comb: true, spr: true, hyd: true}).dnMin, s({cls: 1}).dnMin, s({}).dn, s({comb: true, L: 10}).dn], [150, 100, 150, 100, 0, 150, 150]);
  check('adopted diameter must not be below the required one: DN 125 fails and DN 150 passes', [s({dn: 125}).okDn, s({dn: 150}).okDn], [false, true]);
  check('first riser flow 1900 L/min for floors up to 7500 m2: 1899 fails, 1900 passes, 7501 m2 not decided (page missing), class 2 not applicable', [s({Q: 1899}).Q1900, s({}).Q1900, s({area: 7501}).Q1900, s({cls: 1}).Q1900], [false, true, null, null]);
  check('hose reach: 45 m (60 m in a sprinklered building) for classes 1 and 3; class 2: 40 m for 38 mm hose, 36 m for 25 mm', [s({}).reach, s({spr: true}).reach, s({cls: 2}).reach, s({cls: 1}).reach, s({cls: 1, h2: 1}).reach, s({rch: 45}).okReach, s({rch: 45.1}).okReach], [45, 60, 45, 40, 36, true, false]);
  check('residual pressure at least 4.5 bar; at most 7 bar at 38 mm and smaller outlets, 12 bar at larger ones; at most 24 bar in the system', [s({pr: 4.4}).okResid, s({pr: 4.5}).okResid, s({hs: 38, pm: 7}).okMax, s({hs: 38, pm: 7.1}).okMax, s({hs: 63, pm: 12}).okMax, s({hs: 63, pm: 12.1}).okMax, s({ps: 24}).okSys, s({ps: 24.1}).okSys, s({hs: 25}).maxOut], [false, true, true, false, true, false, true, false, 7]);
  check('drain pipe (Table 2-g): DN 50 and below -> 20, DN 63 and 75 -> 32, DN 100 and above -> 50 mm', [50, 63, 75, 100, 150].map(d => s({dn: d}).drain), [20, 32, 32, 50, 50]);
  const f2 = F(1900, 150, 120);
  check('pump pressure = 4.5 residual + 30 m x 0.0981 + friction x (40 + 15 m): 4.5 + 2.942 + 0.00252 x 55; water volume 1900 x 30 / 1000 = 57 m3', [s({}).pump, s({}).vol, s({}).run, s({}).f], [4.5 + 30 * 0.0980665 + f2 * 55, 57, f2 * 55, f2], 1e-9);
  check('connection height 0.90 - 1.50 m', [s({hh: 0.89}).okH, s({hh: 0.9}).okH, s({hh: 1.5}).okH, s({hh: 1.51}).okH], [false, true, true, false]);
}
{
  const t = dn => calc({mode: 3, dn});
  check('Table 1-d tie rods: DN 100 and 150: 2 x 16 mm; 200: 3 x 16 or 2 x 19; 250: 4 / 3 / 2 for 16 / 19 / 22; 300: 6 / 4 / 3 / 2; 350: 8 / 5 / 4 / 3; 400: 10 / 7 / 5 / 4', [100, 150, 200, 250, 300, 350, 400].map(d => t(d).tie), [[2, null, null, null], [2, null, null, null], [3, 2, null, null], [4, 3, 2, null], [6, 4, 3, 2], [8, 5, 4, 3], [10, 7, 5, 4]]);
  check('tie-rod diameter for fixing lugs: 16 mm up to DN 200, 19 mm for DN 250, 22 mm for DN 300; none above', [100, 200, 250, 300, 400].map(d => t(d).rod), [16, 16, 19, 22, null]);
  check('Table 1-e straps (width, A, B, C, D): DN 100 65 / 320 / 260 / 65 / 45; DN 300 75 / 570 / 490 / 170 / 150; none above DN 300', [t(100).strap, t(300).strap, t(400).strap], [[100, 65, 320, 260, 65, 45], [300, 75, 570, 490, 170, 150], null]);
}
let tt;
w.renderCalc('egfw'); w.calcResult('egfw');
tt = txt(w, 'ew_results');
check('the default page checks the hydrant spacing 90 m ✔, the 150 mm main, the burial 0.90 m, the flushing flow 3330 L/min, the test 14 bar, the leakage 38.60 L/h and shows the 🔴 note; only the first group is visible', [tt.includes('90 m'), tt.includes('✔'), tt.includes('3330 L/min'), tt.includes('14.0 bar'), tt.includes('38.60 L/h'), tt.includes('🔴'), w.document.getElementById('ew_g0').style.display, w.document.getElementById('ew_g1').style.display], [true, true, true, true, true, true, '', 'none']);
set('ew_sp', '120'); w.calcResult('egfw'); tt = txt(w, 'ew_results');
check('a spacing of 120 m fails ✘', [tt.includes('✘'), tt.includes('120 m')], [true, true]);
set('ew_m', '1'); w.calcResult('egfw'); tt = txt(w, 'ew_results');
check('the hydraulics page shows C 120, the friction 18.237 mbar/m, the velocity 4.03 m/s, the equivalent length 16.90 m and the conversion factors', [tt.includes('120'), tt.includes('18.237 mbar/m'), tt.includes('4.03 m/s'), tt.includes('16.90 m'), tt.includes('C 140 = 1.330'), w.document.getElementById('ew_g1').style.display], [true, true, true, true, true, '']);
set('ew_m', '2'); w.calcResult('egfw'); tt = txt(w, 'ew_results');
check('the standpipe page: DN 150 from Table 2-C ✔ for the entered DN 150, 4.5 bar residual, pump pressure, 57 m3, drain DN 50, and the note about the missing book pages', [tt.includes('DN 150'), tt.includes('✔'), tt.includes('57.0 m³'), tt.includes('DN 50'), tt.includes('78 و 79'), tt.includes('ضغط المضخة اللازم')], [true, true, true, true, true, true]);
set('ew_dn2', '3'); w.calcResult('egfw'); tt = txt(w, 'ew_results');
check('DN 100 against the required 150 shows ✘', [tt.includes('القطر المدخل DN 100 ✘')], [true]);
set('ew_m', '3'); w.calcResult('egfw'); tt = txt(w, 'ew_results');
check('the restraint page: DN 150 -> 2 x 16 mm tie rods and a 65 x 16 strap 370 / 310 / 90 / 70 mm', [tt.includes('2 × 16 mm'), tt.includes('65 × 16 mm'), tt.includes('370 / 310 / 90 / 70 mm')], [true, true, true]);
check('other reference codes open egfw too', others('egfw', 'ew_results'), [true, true, true]);
}
// ---------- part 213: Egyptian fire code part 4, chapter 4 fixed water spray (`egspray`: design densities, Table 4-d shelves, transformers, Table 4-b electrical clearances, Tables 4-a and 4-h, ultra-high-speed limits) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const B = (kv, k) => J('xwBeam(' + kv + ',' + k + ')');
check('Table 4-b rows (operating kV -> mm): up to 13.8 -> 180, 22 -> 255, 33 -> 330, 66 -> 635, 115 -> 1070, 132 -> 1270, 160 -> 1475, 220 -> 1930, 500 -> 3150', [10, 13.8, 22, 33, 66, 115, 132, 160, 220, 500].map(x => B(x, 0).mm), [180, 180, 255, 330, 635, 1070, 1270, 1475, 1930, 3150], 1e-9);
check('the same rows by maximum system voltage (24, 36, 72, 121, 145, 170, 245, 525 kV) and by BIL (125, 170, 325, 550, 650, 750, 1050, 1550 kV)', [[24, 255], [36, 330], [72, 635], [121, 1070], [145, 1270], [170, 1475], [245, 1930], [525, 3150]].map(x => B(x[0], 1).mm).concat([[125, 255], [170, 330], [325, 635], [550, 1070], [650, 1270], [750, 1475], [1050, 1930], [1550, 3150]].map(x => B(x[0], 2).mm)), [255, 330, 635, 1070, 1270, 1475, 1930, 3150, 255, 330, 635, 1070, 1270, 1475, 1930, 3150], 1e-9);
check('between two rows the clearance is proportional: 44 kV = 330 + (635 - 330) / 3 = 431.67 mm; above 500 kV (operating) there is no value', [B(44, 0).mm, B(44, 0).exact, B(66, 0).exact, B(501, 0).mm, B(501, 0).over], [330 + 305 / 3, false, true, null, true], 1e-9);
check('each row is consistent across the three voltage columns, rising in every column', J(`(function () { for (let i = 1; i < XW_B.length; i++) for (let k = 0; k < 4; k++) if (XW_B[i][k] <= XW_B[i - 1][k]) return 'row ' + i; return 'ok'; })()`), 'ok');
const S = n => J('xwShelf(' + n + ')');
check('Table 4-d: 1 level 10 L/min/m2; 2 levels 8 and 6 for both; 3 to 5 levels 8 and 6 alternately; 6 or more 8 and 4 alternately', [S(1), S(2), S(3), S(5), S(6), S(12)], [{top: 10, other: null, mode: ''}, {top: 8, other: 6, mode: 'both'}, {top: 8, other: 6, mode: 'alt'}, {top: 8, other: 6, mode: 'alt'}, {top: 8, other: 4, mode: 'alt'}, {top: 8, other: 4, mode: 'alt'}]);
const calc = o => J('xwCalc(' + JSON.stringify(o) + ')');
{
  const h = i => calc({mode: 0, h: i, area: 50, d: 10, na: 8});
  check('densities: conveyor 10, drive unit 10, pumps of flammables 20, control of burning 20, basins 12, tank surfaces 10, tank supports 10, horizontal steel 4, vertical steel 10, vertical pipe rows 6, transformer 10, transformer floor 6', [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(i => h(i).d), [10, 10, 20, 20, 12, 10, 10, 4, 10, 6, 10, 6]);
  check('cable trays: 12 L/min/m2 in general, 6 with a steel shield (1.5 mm and 150 mm wider) or other sprinklers', [h(1).d, h(2).d], [12, 6]);
  const c = h(3);
  check('conveyor of 50 m2: 10 x 50 = 500 L/min plus 1000 L/min of hose streams for one hour = 1500 L/min, hose volume 60 m3; 7 nozzles of 8 m2 give 71.4 L/min each', [c.Q, c.hose, c.Qtot, c.hoseVol, c.nozzles, c.qN], [500, 1000, 1500, 60, 7, 500 / 7], 1e-9);
  check('only conveyors and transformers carry the 1000 L/min hose allowance', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14].map(i => h(i).hose), [0, 0, 0, 1000, 1000, 0, 0, 0, 0, 0, 0, 0, 0, 1000, 1000]);
  const g = d => calc({mode: 0, h: 0, area: 100, d, na: 8});
  check('the general case needs 6 to 20 L/min/m2: 5.9 and 20.1 fail, 6 and 20 pass; 100 m2 at 12 -> 1200 L/min', [g(5.9).okD, g(6).okD, g(20).okD, g(20.1).okD, g(12).Q], [false, true, true, false, 1200]);
}
{
  const s = o => calc(Object.assign({mode: 1, n: 3, a1: 30, vd: 0.6, rows: 0}, o));
  check('3 levels of 30 m2: 8 x 30 + 6 x 30 = 420 L/min; 1 level: 10 x 30 = 300; 6 levels: 8 x 30 + 4 x 30 = 360', [s({}).Q, s({n: 1}).Q, s({n: 6}).Q, s({n: 2}).Q], [420, 300, 360, 420]);
  check('nozzles at most 0.80 m below the protected shelf; vertical pipe rows get 6 L/min/m2 from one side', [s({vd: 0.8}).okV, s({vd: 0.81}).okV, s({rows: 2}).vertRow, s({}).vertRow], [true, false, 180, 0]);
}
{
  const t = o => calc(Object.assign({mode: 2, L: 4, W: 2.5, H: 3.5, ag: 30, kind: 0, kv: 66, clr: 700}, o));
  const r = t({});
  check('transformer 4 x 2.5 x 3.5 m: six faces 2 (10 + 14 + 8.75) = 65.5 m2; 655 L/min on the faces + 6 x 30 = 180 on the floor = 835; with the 1000 L/min hose allowance 1835 L/min', [r.Af, r.Qf, r.Qg, r.Q, r.Qtot, r.hoseVol], [65.5, 655, 180, 835, 1835, 60], 1e-9);
  check('clearance for 66 kV is 635 mm: 700 mm passes, 600 mm fails; a 72 kV maximum voltage gives the same row', [t({}).okClr, t({clr: 600}).okClr, t({kind: 1, kv: 72}).beam.mm], [true, false, 635]);
  check('no value above the table: 600 kV has none and no pass / fail', [t({kv: 600}).beam.mm, t({kv: 600}).okClr], [null, null]);
}
{
  const e = o => calc(Object.assign({mode: 3, kind: 0, kv: 33, clr: 330}, o));
  check('the electrical page calculation: 33 kV -> 330 mm, equal passes, 329 fails; 115 kV row', [e({}).beam.mm, e({}).okClr, e({clr: 329}).okClr, e({kv: 115}).row[3]], [330, true, false, 1070]);
}
{
  const p = o => calc(Object.assign({mode: 4, dn: 150, pw: 12, wt: 3.4, light: false, len: 50, sp: 2.5, pn: 2, cov: false, up: 4, rt: 80, qn: 100}, o));
  check('Table 4-a: up to DN 125 the wall equals the light standard-weight pipe; DN 150 needs 3.40 mm; DN 200 and 250 need 4.80 mm; none above DN 250', [p({dn: 125}).wallLight, p({}).wall, p({dn: 200}).wall, p({dn: 250}).wall, p({dn: 300}).wall], [true, 3.4, 4.8, 4.8, undefined]);
  check('wall check: 3.40 passes and 3.39 fails for DN 150; DN 200 needs 4.80; working pressure above 20 bar needs certified pipes', [p({}).okWall, p({wt: 3.39}).okWall, p({dn: 200, wt: 4.79}).okWall, p({dn: 200, wt: 4.8}).okWall, p({pw: 20}).pOk, p({pw: 21}).pOk], [true, false, false, true, true, false]);
  const phys = J(`XW_V.map(r => r[0])`);
  const id = {20: 20.93, 25: 26.64, 32: 35.05, 38: 40.89, 50: 52.5, 63: 62.71, 75: 77.93, 125: 128.2, 150: 154.05};
  const rel = Object.keys(id).map(k => { const v = J('XW_V.find(r => r[0] === ' + k + ')[1]') * 3.28084, ph = Math.PI / 4 * Math.pow(id[k] / 1000, 2) * 1000; return Math.abs(v / ph - 1); });
  check('Table 4-h medium values agree (within 1.5 %) with the volume of schedule-40 pipes when read as litres per FOOT (not per metre)', [Math.max(...rel) < 0.015], [true]);
  check('DN 150 medium 5.681 L/ft = 18.64 L/m; 50 m = 932 L; 108 m exceeds the 2000 L limit of an ultra-high-speed system; DN 25 = 0.558 L/m; light DN 150 6.241 L/ft', [p({}).lpm, p({}).vol, p({len: 107}).okVol, p({len: 108}).okVol, p({dn: 25}).lpm, p({light: true}).lpf], [5.681 * 3.28084, 5.681 * 3.28084 * 50, true, false, 0.17 * 3.28084, 6.241], 1e-9);
  check('DN 100 is not in Table 4-h, nor is a light DN 20', [p({dn: 100}).v, p({dn: 100}).vol, p({dn: 20, light: true}).lpf], [null, null, null]);
  check('nozzle spacing up to 3.0 m, nozzle pressure at least 1.4 bar', [p({sp: 3}).okSp, p({sp: 3.01}).okSp, p({pn: 1.4}).okP, p({pn: 1.39}).okP], [true, false, true, false]);
  check('ultra-high-speed: operating pressure 3.5 bar (75 % = 2.625 bar with frangible covers), response 100 ms, local nozzle 100 L/min', [p({up: 3.5}).okUp, p({up: 3.4}).okUp, p({up: 2.7, cov: true}).okUp, p({up: 2.6, cov: true}).okUp, p({rt: 100}).okResp, p({rt: 101}).okResp, p({qn: 99}).okNoz], [true, false, true, false, true, false, false]);
}
let tt;
w.renderCalc('egspray'); w.calcResult('egspray');
tt = txt(w, 'xw_results');
check('the default page (conveyor, 50 m2) shows the density 10, the flows 500 / 1000 / 1500 L/min, the 60 m3 hose volume and the 🔴 note; only the first group is visible', [tt.includes('10.0 L/min/m²'), tt.includes('500 L/min'), tt.includes('1000 L/min'), tt.includes('1500 L/min'), tt.includes('60.0 m³'), tt.includes('🔴'), w.document.getElementById('xw_g0').style.display, w.document.getElementById('xw_g1').style.display], [true, true, true, true, true, true, '', 'none']);
set('xw_h', '0'); set('xw_d', '25'); w.calcResult('egspray'); tt = txt(w, 'xw_results');
check('a general density of 25 shows ✘ and the 6 to 20 range', [tt.includes('✘'), tt.includes('من 6 إلى 20')], [true, true]);
set('xw_m', '1'); w.calcResult('egspray'); tt = txt(w, 'xw_results');
check('the shelves page shows 8 and 6 L/min/m2 alternately and the 420 L/min flow', [tt.includes('8 L/min/m²'), tt.includes('6 L/min/m²'), tt.includes('بالتبادل'), tt.includes('420 L/min')], [true, true, true, true]);
set('xw_m', '2'); w.calcResult('egspray'); tt = txt(w, 'xw_results');
check('the transformer page shows 65.5 m2, 835 L/min, 1835 L/min and 635 mm ✔', [tt.includes('65.5 m²'), tt.includes('835 L/min'), tt.includes('1835 L/min'), tt.includes('635 mm'), tt.includes('✔')], [true, true, true, true, true]);
set('xw_m', '3'); w.calcResult('egspray'); tt = txt(w, 'xw_results');
check('the clearances page shows 635 mm for 66 kV with ✔ and the nine rows', [tt.includes('635 mm'), tt.includes('✔'), tt.includes('13.8/17.5/95 kV = 180 mm'), tt.includes('500.0/525.0/1550 kV = 3150 mm')], [true, true, true, true]);
set('xw_kv2', '44'); w.calcResult('egspray'); tt = txt(w, 'xw_results');
check('44 kV is proportional between the 33 and 66 kV rows: 432 mm', [tt.includes('432 mm'), tt.includes('بالنسبة والتناسب')], [true, true]);
set('xw_m', '4'); w.calcResult('egspray'); tt = txt(w, 'xw_results');
check('the pipes page: DN 150 wall 3.40 ✔, 18.64 L/m, 932 L ✔, the 3.0 m spacing, 1.4 bar and the ultra-high-speed limits', [tt.includes('3.40 mm'), tt.includes('18.64 L/m'), tt.includes('932 L'), tt.includes('1.4 bar'), tt.includes('100 ms'), tt.includes('5.681')], [true, true, true, true, true, true]);
check('other reference codes open egspray too', others('egspray', 'xw_results'), [true, true, true]);
}
// ---------- part 214: Egyptian fire code part 4, chapter 3 occupancy classification and sprinkler installation rules (`egsprinst`: clauses 3-4, 3-18-2, 3-18-1, 3-19 to 3-24) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
check('occupancy list: 55 entries = 10 light, 8 ordinary group 1, 23 ordinary group 2, 7 extra group 1, 7 extra group 2', J(`[0, 1, 2, 3, 4].map(c => XK_O.filter(x => x[1] === c).length).concat([XK_O.length])`), [10, 8, 23, 7, 7, 55]);
const idx = name => J('XK_O.findIndex(x => x[0] === ' + JSON.stringify(name) + ')');
const calc = o => J('xkCalc(' + JSON.stringify(o) + ')');
{
  const c = (n, sh) => calc({mode: 0, oc: idx(n), sh});
  check('examples: offices and hospitals are light; bakeries and parking are ordinary 1; paper mills, textile and printing are ordinary 2; hangars and foam upholstery are extra 1; paint dipping and plastics are extra 2', [c('المكاتب', 1).cls, c('أماكن التمريض أو الاستشفاء أو النقاهة', 1).cls, c('المخابز', 1).cls, c('أماكن انتظار السيارات أو صالات عرضها', 1).cls, c('معالجة الورق', 1).cls, c('تصنيع المنسوجات', 1).cls, c('دور الطبع والنشر', 1).cls, c('حظائر الطائرات', 1).cls, c('التنجيد بالإسفنج الصناعي (الفوم)', 1).cls, c('الدهانات والطلاء بالغمس', 1).cls, c('معالجة البلاستيك', 1).cls], [0, 0, 1, 1, 2, 2, 2, 3, 3, 4, 4]);
  check('curve numbers of Figure 3-1 follow the class (1 to 5); areas 4850 for light and ordinary; extra 2350 by tables, 3750 hydraulic; the table method only for light and ordinary', [0, 1, 2, 3, 4].map(k => { const r = calc({mode: 0, oc: J('XK_O.findIndex(x => x[1] === ' + k + ')'), sh: 1}); return [r.curve, r.areaTab, r.areaHyd, r.tableMethod]; }), [[1, 4850, 4850, true], [2, 4850, 4850, true], [3, 4850, 4850, true], [4, 2350, 3750, false], [5, 2350, 3750, false]]);
  check('stock height: ordinary 1 up to 2.4 m (2.5 m moves to group 2, 3.8 m to the storage rules); ordinary 2 up to 3.7 m (3.8 m to storage rules); light and extra have no limit', [c('المخابز', 2.4).okStock, c('المخابز', 2.5).okStock, c('المخابز', 2.5).next, c('المخابز', 3.8).next, c('معالجة الورق', 3.7).okStock, c('معالجة الورق', 3.8).okStock, c('معالجة الورق', 3.8).next, c('المكاتب', 9).okStock, c('حظائر الطائرات', 9).okStock], [true, false, 2, 'storage', true, false, 'storage', null, null]);
}
{
  const a = o => calc(Object.assign({mode: 1, cls: 1, hyd: false, area: 4000, stor: 0}, o));
  check('largest area of one system: light and ordinary 4850 m2 in both methods; extra 2350 m2 by tables and 3750 m2 hydraulically', [a({cls: 0}).limit, a({cls: 2, hyd: true}).limit, a({cls: 3}).limit, a({cls: 3, hyd: true}).limit, a({cls: 4}).limit], [4850, 4850, 2350, 3750, 2350]);
  check('4850 m2 passes, 4851 needs 2 control groups, 9700 needs 2, 9701 needs 3; extra by tables: 2351 -> 2', [a({area: 4850}).exOk, a({area: 4851}).sections, a({area: 9700}).sections, a({area: 9701}).sections, a({cls: 3, area: 2351}).sections], [true, 2, 2, 3, 2]);
  check('storage in the same system: storage up to 3750 m2 and the total with the other area up to 4850 m2', [a({stor: 3750, area: 1100}).okStor, a({stor: 3751, area: 1000}).okStor, a({stor: 3750, area: 1100}).okTotal, a({stor: 3750, area: 1101}).okTotal, a({stor: 0}).mixed, a({stor: 100}).mixed], [true, false, true, false, false, true]);
}
{
  const d = o => calc(Object.assign({mode: 2, dn: 100, dm: 50, vol: 100, freeze: false, da: 25, tieD: 25, tieS: 4, td: 25}, o));
  check('main drain by riser size: up to 50 mm -> 20 mm, 63 / 75 / 90 mm -> 32 mm, 100 mm and more -> 50 mm', [25, 50, 62, 63, 75, 90, 100, 150].map(n => d({dn: n}).main), [20, 20, 20, 32, 32, 32, 50, 50]);
  check('main drain check: 50 mm drain for a 100 mm riser passes, 32 mm fails', [d({}).mainOk, d({dm: 32}).mainOk], [true, false]);
  check('auxiliary drain, wet: up to 19 L a 12 mm nipple with cap; 19 to 190 L a 20 mm valve; 190 L and more a 25 mm valve', [19, 19.1, 189.9, 190, 400].map(v => d({vol: v}).aux + d({vol: v}).auxDn), ['nipple12', 'valve2020', 'valve2020', 'valve2525', 'valve2525']);
  check('auxiliary drain, dry or exposed to freezing: up to 19 L a 12 mm valve; above that two 25 mm valves and a 50 x 300 mm condensate nipple', [19, 19.1, 300].map(v => d({vol: v, freeze: true}).aux + d({vol: v, freeze: true}).auxDn), ['valve1212', 'two2525', 'two2525']);
  check('valve size check against the requirement; tie-in drains at most 25 mm with a slope of at least 4 mm/m; test pipe at least 25 mm', [d({vol: 200, da: 20}).auxOk, d({vol: 200, da: 25}).auxOk, d({tieD: 26}).okTie, d({tieS: 3.9}).okTie, d({}).okTie, d({td: 24}).okTest, d({td: 25}).okTest], [false, true, false, false, true, false, true]);
}
{
  const s = o => calc(Object.assign({mode: 3, role: 0, dry: true, freeze: false, slope: 4, temp: 10}, o));
  check('slopes in dry and exposed systems: branches 4 mm/m; feed and distribution mains 2 mm/m, 4 mm/m when they pass freezing areas; wet systems need none', [s({}).needEff, s({role: 1}).needEff, s({role: 1, freeze: true}).needEff, s({dry: false, freeze: false}).needEff, s({dry: false, freeze: true}).needEff], [4, 2, 4, 0, 4]);
  check('slope pass / fail: 4 mm/m passes for a branch, 3.9 fails; 1.9 mm/m fails for a main and 2 passes; wet systems pass any slope', [s({}).okSlopeEff, s({slope: 3.9}).okSlopeEff, s({role: 1, slope: 2}).okSlopeEff, s({role: 1, slope: 1.9}).okSlopeEff, s({dry: false, slope: 0}).okSlopeEff], [true, false, true, false, true]);
  check('pipe temperature at least 4 C', [s({temp: 4}).okTemp, s({temp: 3.9}).okTemp, s({temp: -2}).okTemp], [true, false, false]);
}
{
  const t = o => calc(Object.assign({mode: 4, dn: 50, screwed: false, pf: 12, tc: 6, br: 300, de: 32, hl: 20, hd: 32, hyd: false, fd: 63, hp: 6, vd: 25}, o));
  check('flange or mechanical joint at each floor for 75 mm and larger risers; screwed ends only up to 50 mm', [t({dn: 74}).flange, t({dn: 75}).flange, t({screwed: true, dn: 50}).okScrew, t({screwed: true, dn: 63}).okScrew, t({screwed: false, dn: 100}).okScrew], [false, true, true, false, true]);
  check('bend radius: 6 x D up to DN 50 (300 mm), 5 x D from DN 63 (315 mm for DN 63, 500 mm for DN 100)', [t({}).bendMin, t({dn: 63}).bendMin, t({dn: 100}).bendMin, t({br: 299}).okBend, t({br: 300}).okBend], [300, 315, 500, false, true]);
  check('fittings rated 12 bar or more, valve closing 5 s or more, distribution pipe ends 32 mm or more', [t({pf: 11.9}).okPress, t({pf: 12}).okPress, t({tc: 4.9}).okClose, t({tc: 5}).okClose, t({de: 25}).okEnd, t({de: 32}).okEnd], [false, true, false, true, false, true]);
  check('hose connections: horizontal pipe 25 mm up to 6 m, 32 mm over 6 m up to 25 m, 38 mm over 25 m; feed 63 mm (50 mm with hydraulic calculations); pressure at most 7 bar; vertical at least 25 mm', [t({hl: 6}).hose, t({hl: 6.1}).hose, t({hl: 25}).hose, t({hl: 25.1}).hose, t({hl: 30, hd: 32}).okHose, t({}).feedMin, t({hyd: true}).feedMin, t({hyd: true, fd: 50}).okFeed, t({fd: 50}).okFeed, t({hp: 7}).okP, t({hp: 7.1}).okP, t({vd: 20}).okVert], [25, 32, 32, 38, false, 63, 50, true, false, true, false, false]);
}
let tt;
w.renderCalc('egsprinst'); w.calcResult('egsprinst');
tt = txt(w, 'xk_results');
check('the default page (bakery, 2 m of stock) shows ordinary hazard group 1, curve 2, 4850 m2, the table method allowed, ✔ and the 🔴 note; only the first group is visible', [tt.includes('المخابز'), tt.includes('خطورة عادية، المجموعة الأولى'), tt.includes('منحنى الكثافة والمساحة رقم 2'), tt.includes('4850 m²'), tt.includes('مسموحة'), tt.includes('✔'), tt.includes('🔴'), w.document.getElementById('xk_g0').style.display, w.document.getElementById('xk_g1').style.display], [true, true, true, true, true, true, true, '', 'none']);
set('xk_sh', '3'); w.calcResult('egsprinst'); tt = txt(w, 'xk_results');
check('3 m of stock exceeds the ordinary-1 limit: ✘ and the move to group 2', [tt.includes('✘'), tt.includes('المجموعة الثانية للخطورة العادية')], [true, true]);
set('xk_m', '1'); w.calcResult('egsprinst'); tt = txt(w, 'xk_results');
check('the area page: 4850 m2 limit and 4000 m2 passing', [tt.includes('4850 m²'), tt.includes('4000 m²'), tt.includes('✔')], [true, true, true]);
set('xk_cl', '3'); set('xk_ar', '3000'); w.calcResult('egsprinst'); tt = txt(w, 'xk_results');
check('extra hazard by tables 2350 m2: 3000 m2 needs 2 control groups ✘', [tt.includes('2350 m²'), tt.includes('✘'), tt.includes('2 مجموعات')], [true, true, true]);
set('xk_m', '2'); w.calcResult('egsprinst'); tt = txt(w, 'xk_results');
check('the drain page: DN 50 riser -> 20 mm drain... for 100 mm: 50 mm, the 100 L trapped volume needs a 20 mm valve, tie-in drain 25 mm / 4 mm/m, test pipe 25 mm', [tt.includes('DN 50'), tt.includes('محبس 20 mm'), tt.includes('4 mm/m'), tt.includes('DN 25')], [true, true, true, true]);
set('xk_m', '3'); w.calcResult('egsprinst'); tt = txt(w, 'xk_results');
check('the slope page: branch 4 mm/m ✔ and the temperature 10 C ✔', [tt.includes('4 mm/m'), tt.includes('10.0 °C'), tt.includes('✔')], [true, true, true]);
set('xk_m', '4'); w.calcResult('egsprinst'); tt = txt(w, 'xk_results');
check('the connections page: bend 300 mm, hose pipe DN 32, feed DN 63, 7 bar limit', [tt.includes('300 mm'), tt.includes('DN 32'), tt.includes('DN 63'), tt.includes('7 bar')], [true, true, true, true]);
check('other reference codes open egsprinst too', others('egsprinst', 'xk_results'), [true, true, true]);
}
// ---------- part 215: Egyptian fire code part 1, chapter 4-4 exit components (`egexitcomp`: doors, horizontal exits, ramps, corridors, smokeproof enclosures) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xcCalc(' + JSON.stringify(o) + ')');
{
  const d = o => calc(Object.assign({mode: 0, ang: 90, rt: 0.75, va: 0, vs: 1, gt: 6, sc: 0.6, lock: false, rev: false, rx: true, rb: false, rd: false, rs: 3, rn: 1, exits: 3}, o));
  check('door opening angle at least 90 degrees; stair clearance at least 0.50 m; no locking against the escape direction', [d({ang: 90}).okAngle, d({ang: 89}).okAngle, d({sc: 0.5}).okClear, d({sc: 0.49}).okClear, d({lock: true}).okSwing, d({}).okSwing], [true, false, true, false, false, true]);
  check('vision panel: wired glass 6 mm or more, area up to 0.80 m2, no side above 1.35 m, door rating up to 0.75 h; a 1 h door cannot have glass', [d({va: 0.8, vs: 1.35}).okGlass, d({va: 0.81}).okGlass, d({va: 0.5, vs: 1.36}).okGlass, d({va: 0.5, gt: 5}).okGlass, d({va: 0.5, rt: 1}).okGlass, d({va: 0.5, rt: 0.5}).okGlass, d({va: 0}).okGlass], [true, false, false, false, false, true, true]);
  check('a revolving door is accepted on the exit-discharge floor with a swinging door beside it, not for B or F-1 or a single exit or a loading of 1.2 m2 per person or less, and not above half of the exits', [d({rev: true}).okRev, d({rev: true, rx: false}).okRev, d({rev: true, rb: true}).okRev, d({rev: true, rd: true}).okRev, d({rev: true, rs: 0}).okRev, d({rev: true, rn: 2, exits: 3}).okRev, d({rev: true, rn: 2, exits: 4}).okRev, d({rev: false, rx: false}).okRev], [true, false, false, false, false, false, true, true]);
}
{
  const h = o => calc(Object.assign({mode: 1, exits: 4, hx: 2, units: 8, uo: 4, fac: 10, area1: 600, dw: 1.1, dsum: 1.1, bw: 1.1, rails: false, open: false, gh: 1, go: 0.1}, o));
  check('horizontal exits count at most half the required exits (4 -> 2, 5 -> 2, 3 -> 1); the other exits keep at least half of the exit units (8 -> 4, 7 -> 4)', [h({}).maxH, h({exits: 5}).maxH, h({exits: 3}).maxH, h({hx: 3}).okCount, h({}).okCount, h({}).minOther, h({units: 7}).minOther, h({uo: 3.9}).okUnits, h({uo: 4}).okUnits], [2, 2, 1, false, true, 4, 4, false, true]);
  check('not allowed for areas with 1.2 m2 per person or less; at least two exits are needed so a horizontal exit never stands alone', [h({fac: 1.2}).okFactor, h({fac: 1.21}).okFactor, h({exits: 1}).okSingle, h({}).okSingle], [false, true, false, true]);
  check('bridge width at least the larger of the door width and the sum of the doors; 9 cm may be lost to a handrail; open bridge needs a 1 m guard with openings up to 10 cm', [h({bw: 1.09}).okBridge, h({bw: 1.09, rails: true}).okBridge, h({bw: 1.01, rails: true}).okBridge, h({bw: 1, rails: true}).okBridge, h({dw: 1.1, dsum: 1.5, bw: 1.4}).okBridge, h({open: true}).okGuard, h({open: true, gh: 0.99}).okGuard, h({open: true, go: 0.11}).okGuard], [false, true, true, false, false, true, false, false]);
  check('capacity of the area beside the exit: 600 m2 at 10 m2 per person = 60 persons', [h({}).cap], [60]);
}
{
  const r = o => calc(Object.assign({mode: 2, g: 1, rise: 1, run: 10, w: 1.5, ll: 1.5, nr: 2, side: 0.3, endw: 0.36, red: false}, o));
  check('maximum slope: 1:6 inside E and F, 1:8 for other inside ramps, 1:10 outside and inside A and B-2: a 1 m rise needs 6, 8, 10 m of run', [0, 1, 2].map(g => r({g}).run), [6, 8, 10]);
  check('slope check: 1:8 allows exactly 12.5 %; 1 m in 8 m passes, 1 m in 7.9 m fails; the 1:10 ramp fails at 1 m in 9 m', [r({run: 8}).okSlope, r({run: 7.9}).okSlope, r({g: 2, run: 9}).okSlope, r({g: 2, run: 10}).okSlope], [true, false, false, true]);
  check('rise above 3.70 m needs horizontal landings: 3.7 m none, 3.71 m one, 7.4 m one, 7.41 m two; landing length not below the ramp width (1.20 m when the width exceeds 2.00 m)', [r({rise: 3.7}).landings, r({rise: 3.71}).landings, r({rise: 7.4}).landings, r({rise: 7.41}).landings, r({rise: 4, ll: 1.4}).okLand, r({rise: 4, ll: 1.5}).okLand, r({rise: 4, w: 2.5, ll: 1.2}).okLand, r({rise: 4, w: 2.5, ll: 1.1}).okLand, r({rise: 3, ll: 0.5}).okLand], [0, 1, 1, 2, false, true, true, false, true]);
  check('handrails: one side for a width under 1.10 m, both sides from 1.10 m; side landing 0.30 m, end landing 0.36 m', [r({w: 1.09, nr: 1}).okRails, r({w: 1.1, nr: 1}).okRails, r({w: 1.1, nr: 2}).okRails, r({side: 0.29}).okSide, r({endw: 0.35}).okEnd, r({red: true}).okWidth], [true, false, true, false, false, false]);
}
{
  const c = o => calc(Object.assign({mode: 3, pub: true, pr: 1, dr: 20 / 60, opn: 0.75}, o));
  check('public corridors need a 1 h separation, doors of at least 20 minutes and opening protection of 3/4 h', [c({}).okPart, c({pr: 0.75}).okPart, c({}).door20, c({dr: 19 / 60}).door20, c({}).okOpen, c({opn: 0.5}).okOpen], [true, false, true, false, true, false]);
}
{
  const s = o => calc(Object.assign({mode: 4, sr: 2, dr: 1.5, vr: 20 / 60, spr: false, fr: 2, vw: 1.1, vl: 1.8, vo: 1.5, ach: 1, sup: 100, exh: 150, sh: 0.15, eh: 0.15, tr: 0.5, sa: 10, va: 1, tv: 3, dp: 12.5, stack: 20, rp: 25, dd: 3, gr: 1, gh: 2, bd: 1.5}, o));
  check('enclosure 2 h with 1.5 h doors; vestibule door 20 minutes; the fan room 2 h, or 1 h in a fully sprinklered building', [s({}).okShaft, s({sr: 1.5}).okShaft, s({}).okDoors, s({dr: 1}).okDoors, s({}).okVDoor, s({vr: 0.3}).okVDoor, s({}).okFan, s({fr: 1}).okFan, s({fr: 1, spr: true}).okFan, s({spr: true}).fan], [true, false, true, false, true, false, true, false, true, 1]);
  check('vestibule: width 1.10 m, length 1.80 m in the escape direction, vent opening 1.50 m2; one air change a minute and exhaust of at least 150 % of supply; supply opening within 15 cm of the floor, exhaust within 15 cm of the ceiling; smoke trap 0.50 m', [s({vw: 1.09}).okVw, s({vl: 1.79}).okVl, s({vo: 1.49}).okVo, s({ach: 0.9}).okAch, s({exh: 149}).okExh, s({exh: 150}).okExh, s({sh: 0.16}).okSupH, s({eh: 0.16}).okExhH, s({tr: 0.49}).okTrap], [false, false, false, false, false, true, false, false, false]);
  check('natural venting: 10 % of the stair shaft area at each floor and 30 % at the smoke-trap top: 10 m2 shaft needs 1 m2 and 3 m2', [s({}).ventNat, s({}).trapVent, s({va: 0.99}).okVentNat, s({tv: 2.99}).okTrapVent, s({sa: 20}).ventNat], [1, 3, false, false, 2], 1e-9);
  check('pressurisation: at least 12.5 Pa; with the stack pressure the total must stay at or under 87.5 Pa (8.75 mm of water); relief at 25 Pa with the doors closed', [s({dp: 12.4}).okPmin, s({dp: 60, stack: 27.5}).okPmax, s({dp: 60, stack: 27.6}).okPmax, s({rp: 24.9}).okRelief, s({rp: 25}).okRelief], [false, true, false, false, true]);
  check('smoke detector within 3 m of the vestibule door; generator room 1 h and 2 h running; balcony door 1.5 h', [s({dd: 3}).okDet, s({dd: 3.1}).okDet, s({gr: 0.75}).okGen, s({gh: 1.9}).okGen, s({}).okGen, s({bd: 1}).okBal], [true, false, false, false, true, false]);
}
let tt;
w.renderCalc('egexitcomp'); w.calcResult('egexitcomp');
tt = txt(w, 'xc_results');
check('the default page (doors) shows 90, the 0.60 m clearance with ✔ and the 🔴 note; only the first group is visible', [tt.includes('90°'), tt.includes('0.60 m'), tt.includes('✔'), tt.includes('🔴'), w.document.getElementById('xc_g0').style.display, w.document.getElementById('xc_g1').style.display], [true, true, true, true, '', 'none']);
set('xc_va', '0.9'); set('xc_rt', '2'); w.calcResult('egexitcomp'); tt = txt(w, 'xc_results');
check('glass in a 2 h door shows ✘ and the wired-glass line', [tt.includes('غير مطابق'), tt.includes('✘'), tt.includes('زجاج النظارة')], [true, true, true]);
set('xc_m', '1'); w.calcResult('egexitcomp'); tt = txt(w, 'xc_results');
check('the horizontal exits page: at most 2 of 4 exits, 60 persons, bridge 1.10 m ✔', [tt.includes('(4)'), tt.includes('60'), tt.includes('1.10 m'), tt.includes('✔'), w.document.getElementById('xc_g1').style.display], [true, true, true, true, '']);
set('xc_m', '2'); w.calcResult('egexitcomp'); tt = txt(w, 'xc_results');
check('the ramps page: 1 : 8 (12.5 %), the actual slope 1 : 10.0 and 8.0 m of minimum run', [tt.includes('1 : 8'), tt.includes('12.5 %'), tt.includes('1 : 10.0'), tt.includes('8.0 m')], [true, true, true, true]);
set('xc_ri', '5'); set('xc_ru', '30'); w.calcResult('egexitcomp'); tt = txt(w, 'xc_results');
check('a 5 m rise on 30 m is steeper than 1:8 (✘) and needs one landing', [tt.includes('✘'), tt.includes('البسطات الوسيطة1')], [true, true]);
set('xc_m', '3'); w.calcResult('egexitcomp'); tt = txt(w, 'xc_results');
check('the corridors page shows the 1 h separation, the 20 minute door and 0.75 h', [tt.includes('1.00 h'), tt.includes('20 min'), tt.includes('0.75 h')], [true, true, true]);
set('xc_m', '4'); w.calcResult('egexitcomp'); tt = txt(w, 'xc_results');
check('the smokeproof enclosure page: 2 h, 1.5 h, 12.5 Pa, 87.5 Pa and 25 Pa lines', [tt.includes('2.00 h'), tt.includes('1.50 h'), tt.includes('12.5 Pa'), tt.includes('87.5 Pa'), tt.includes('25 Pa'), w.document.getElementById('xc_g4').style.display], [true, true, true, true, true, '']);
check('other reference codes open egexitcomp too', others('egexitcomp', 'xc_results'), [true, true, true]);
}
// ---------- part 216: Egyptian fire code part 1, chapter 5 high-rise buildings (`egrise`: applicability heights, firefighters' lift and services, smoke developed limits of Tables 5-a and 5-b) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xhCalc(' + JSON.stringify(o) + ')');
check('applicability heights: C-1 flats above 34 m; C-2, A, D, E, F above 22 m; B above 16 m (13 m with bedridden occupants); exactly at the limit does not apply', [0, 1, 2, 3, 4, 5, 6, 7].map(g => calc({mode: 0, g, h: 0, nf: 1}).limit), [34, 22, 22, 22, 22, 22, 16, 13]);
check('34 m does not apply to flats, 34.1 m does; 22.1 m applies to offices; 13.5 m applies to a hospital with bedridden patients but not to ordinary institutions (16 m)', [calc({mode: 0, g: 0, h: 34, nf: 10}).applies, calc({mode: 0, g: 0, h: 34.1, nf: 10}).applies, calc({mode: 0, g: 3, h: 22.1, nf: 8}).applies, calc({mode: 0, g: 7, h: 13.5, nf: 4}).applies, calc({mode: 0, g: 6, h: 13.5, nf: 4}).applies, calc({mode: 0, g: 6, h: 16.1, nf: 4}).applies], [false, true, true, true, false, true]);
check('the excess height and the average storey height', [calc({mode: 0, g: 3, h: 30, nf: 10}).over, calc({mode: 0, g: 3, h: 30, nf: 10}).floors, calc({mode: 0, g: 3, h: 20, nf: 0}).over], [8, 3, 0], 1e-9);
{
  const l = o => calc(Object.assign({mode: 1, h: 60, v: 1, la: 2, lq: 900, ch: 0, sr: 1, wa: 400, oa: 4, sb: 2, fl: 0}, o));
  check('the firefighters lift must reach the top floor within one minute: 60 m needs 1.00 m/s, 99.9 m needs 1.665 m/s; 0.99 m/s fails for 60 m', [l({}).vmin, l({h: 99.9}).vmin, l({v: 0.99}).okTime, l({}).okTime, l({h: 99.9, v: 1.6}).okTime], [1, 1.665, false, true, false], 1e-9);
  check('lift car area at least 2 m2, load at least 900 kg, at most one change, shaft 1 h', [l({la: 1.99}).okArea, l({la: 2}).okArea, l({lq: 899}).okLoad, l({lq: 900}).okLoad, l({ch: 1}).okChanges, l({ch: 2}).okChanges, l({sr: 0.9}).okShaft, l({sr: 1}).okShaft], [false, true, false, true, true, false, false, true]);
  check('venting openings at least 1 % of the external wall of the floor (400 m2 -> 4 m2); standby power at least 2 h', [l({}).openMin, l({oa: 3.99}).okOpen, l({oa: 4}).okOpen, l({sb: 1.9}).okStandby, l({sb: 2}).okStandby], [4, false, true, false, true], 1e-9);
}
check('Table 5-a: exit stairs and their lobbies, refuge areas, risers 25 for walls, ceilings and floors; lift cars 100 / 100 / 300', [0, 1, 2].map(e => calc({mode: 2, p: 0, e, si: 0}).lim).concat([0, 1, 2].map(e => calc({mode: 2, p: 1, e, si: 0}).lim)), [25, 25, 25, 100, 100, 300]);
check('Table 5-b: exit-access corridors walls 100, ceilings 25, floors 300; other spaces walls 300, ceilings 25, floors 300', [0, 1, 2].map(e => calc({mode: 2, p: 2, e, si: 0}).lim).concat([0, 1, 2].map(e => calc({mode: 2, p: 3, e, si: 0}).lim)), [100, 25, 300, 300, 25, 300]);
check('limits are inclusive: 25 passes and 26 fails on a stair wall', [calc({mode: 2, p: 0, e: 0, si: 25}).ok, calc({mode: 2, p: 0, e: 0, si: 26}).ok, calc({mode: 2, p: 3, e: 0, si: 300}).ok, calc({mode: 2, p: 3, e: 0, si: 301}).ok], [true, false, true, false]);
let tt;
w.renderCalc('egrise'); w.calcResult('egrise');
tt = txt(w, 'xh_results');
check('the default page (offices at 30 m) shows the 22 m limit, the excess 8.0 m and the 🔴 note; only the first group is visible', [tt.includes('22 m'), tt.includes('8.0 m'), tt.includes('يخضع المبنى'), tt.includes('🔴'), w.document.getElementById('xh_g0').style.display, w.document.getElementById('xh_g1').style.display], [true, true, true, true, '', 'none']);
set('xh_gr', '0'); w.calcResult('egrise'); tt = txt(w, 'xh_results');
check('flats at 30 m do not come under the chapter (34 m limit)', [tt.includes('34 m'), tt.includes('لا يسري الباب الخامس')], [true, true]);
set('xh_m', '1'); w.calcResult('egrise'); tt = txt(w, 'xh_results');
check('the extra requirements page: speed 1.00 m/s minimum, 900 kg, 4.00 m2 of venting, 2.0 h', [tt.includes('1.00 m/s'), tt.includes('900 kg'), tt.includes('4.00 m²'), tt.includes('2.0 h'), w.document.getElementById('xh_g1').style.display], [true, true, true, true, '']);
set('xh_v', '0.8'); w.calcResult('egrise'); tt = txt(w, 'xh_results');
check('a 0.8 m/s lift fails the one-minute rule ✘', [tt.includes('✘')], [true]);
set('xh_m', '2'); set('xh_p', '1'); set('xh_e', '2'); set('xh_si', '350'); w.calcResult('egrise'); tt = txt(w, 'xh_results');
check('a lift car floor of 350 exceeds 300 ✘ and the table limits line shows 100 / 100 / 300', [tt.includes('✘'), tt.includes('300'), tt.includes('5-A')], [true, true, true]);
check('other reference codes open egrise too', others('egrise', 'xh_results'), [true, true, true]);
}
// ---------- part 217: Egyptian fire code part 1, chapter 6-1 assembly occupancies (`egasm`: A-1 construction rules, Tables 6-1-2-2 and 6-1-2-3, A-4, protection triggers and finishes) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xaCalc(' + JSON.stringify(o) + ')');
{
  const a = o => calc(Object.assign({mode: 0, nf: 1, area: 500, load: 400, drop: 3, comb: 0, sp: 0, rh: 4}, o));
  check('A-1: one floor, 600 m2 and 600 persons gives 3/4 h; 601 m2, 601 persons or 2 floors goes to the 2 h rules', [a({area: 600, load: 600}).res, a({area: 601}).res, a({load: 601}).res, a({nf: 2}).res], [0.75, 2, 2, 2]);
  check('A-1 combustible type only for up to 300 persons and a floor drop of at most 4.00 m (with approval)', [a({load: 300, drop: 4}).combOk, a({load: 301}).combOk, a({load: 300, drop: 4.1}).combOk, a({load: 300, area: 700}).combOk], [true, false, false, false]);
  check('A-1 combustible requested without the conditions is flagged', [a({comb: 1, load: 400}).combBad, a({comb: 1, load: 250}).combBad, a({comb: 0, load: 400}).nc, a({load: 250}).nc], [true, false, true, false]);
  check('A-1 large buildings: ceilings 2 h, mezzanines 1 h, basement sections 500 m2 with 2 h partitions unless sprinklered, roof 1 h only up to 5 m above the seating floor', [a({area: 800}).ceil, a({area: 800}).mezz, a({area: 800}).base, a({area: 800, sp: 1}).base, a({area: 800}).baseRes, a({area: 800, rh: 5}).roof, a({area: 800, rh: 5.1}).roof], [2, 1, 500, null, 2, 1, 0]);
}
{
  const t = o => calc(Object.assign({mode: 1, ty: 0, nf: 1, st: 1, area: 1500, sp: 0, comb: 0}, o));
  check('Table 6-1-2-2 (A-2), 3/4 h: one floor 1600 / 2000 / 2400 m2 and two floors 800 / 1000 / 1200 m2', [1, 2, 3].map(s => t({st: s, area: 1}).lim).concat([1, 2, 3].map(s => t({st: s, nf: 2, area: 1}).lim)), [1600, 2000, 2400, 800, 1000, 1200]);
  check('A-2: 1600 m2 stays at 3/4 h, 1601 m2 needs 1 h with no area limit and a non-combustible building; six floors need 2 h', [t({area: 1600}).res, t({area: 1601}).res, t({area: 1601}).lim, t({area: 1601}).nc, t({nf: 5, area: 90000}).res, t({nf: 6}).res], [0.75, 1, null, true, 1, 2]);
  check('A-2 sprinklers double the 3/4 h areas (3200 passes, 3201 does not); basement 500 m2 / 1 h then 1000 m2 / 2 h', [t({sp: 1, area: 3200}).res, t({sp: 1, area: 3201}).res, t({}).base, t({}).baseRes, t({area: 1601}).base, t({area: 1601}).baseRes], [0.75, 1, 500, 1, 1000, 2]);
  check('A-2 combustible request beyond the combustible rows is flagged; inside them it is not', [t({comb: 1, area: 1601}).combBad, t({comb: 1, area: 1000}).combBad, t({area: 1000}).nc], [true, false, false]);
}
{
  const t = o => calc(Object.assign({mode: 1, ty: 1, nf: 1, st: 1, area: 900, sp: 0, comb: 0}, o));
  check('Table 6-1-2-3 (A-3): 3/4 h one floor 1000 / 1250 / 1500 m2', [1, 2, 3].map(s => t({st: s, area: 1}).lim), [1000, 1250, 1500]);
  check('A-3: 1 h combustible rows 2400 / 3000 / 3600 (one floor) and 1200 / 1500 / 1800 (two floors); non-combustible 1 h rows 4000 / 5000 / 6000 and 2000 / 2500 / 3000', [1, 2, 3].map(s => t({st: s, area: [1001, 1251, 1501][s - 1]}).lim).concat([1, 2, 3].map(s => t({st: s, nf: 2, area: 1}).lim)).concat([1, 2, 3].map(s => t({st: s, area: [2401, 3001, 3601][s - 1]}).lim)).concat([1, 2, 3].map(s => t({st: s, nf: 2, area: [1201, 1501, 1801][s - 1]}).lim)), [2400, 3000, 3600, 1200, 1500, 1800, 4000, 5000, 6000, 2000, 2500, 3000]);
  check('A-3 selection: 1000 m2 -> 3/4 h; 1001 -> 1 h combustible allowed; 2401 -> 1 h non-combustible with 2 h partitions; 4001 -> 2 h', [t({area: 1000}).res, t({area: 1001}).res, t({area: 1001}).nc, t({area: 2401}).res, t({area: 2401}).nc, t({area: 2401}).baseRes, t({area: 4001}).res], [0.75, 1, false, 1, true, 2, 2]);
  check('A-3 two floors: 1800 m2 on three streets stays at the combustible 1 h row, 1801 needs the non-combustible row, 3001 needs 2 h; three floors need 2 h', [t({nf: 2, st: 3, area: 1800}).nc, t({nf: 2, st: 3, area: 1801}).nc, t({nf: 2, st: 3, area: 1801}).res, t({nf: 2, st: 3, area: 3001}).res, t({nf: 3, area: 10}).res], [false, true, 1, 2, 2]);
  check('A-3 basement is 500 m2 on every row and sprinklers double the areas (2000 passes 3/4 h; 2001 does not)', [t({}).base, t({sp: 1, area: 2000}).res, t({sp: 1, area: 2001}).res], [500, 0.75, 1]);
}
{
  const a = o => calc(Object.assign({mode: 2, load: 1200, dx: 8, comb: 0}, o));
  check('A-4: combustible type needs at most 1500 persons and at least 6 m to the opposite boundary', [a({}).combOk, a({load: 1500, dx: 6}).combOk, a({load: 1501}).combOk, a({dx: 5.9}).combOk, a({comb: 1, load: 2000}).combBad, a({comb: 1}).combBad], [true, true, false, false, true, false]);
}
{
  const p = o => calc(Object.assign({mode: 3, g: 1, load: 250, h: 15, po: 20, edu: 0, area: 1200, side: 60, nf: 1, lb: 0, ex: 0, as: 0, dp: 80, below: 0}, o));
  check('separation above 200 persons; alarm above 300 (A-1, A-2) and 500 (A-3); A-4 by the load under the stands', [p({load: 200}).sep, p({load: 201}).sep, p({load: 300}).alarm, p({load: 301}).alarm, p({g: 2, load: 500}).alarm, p({g: 2, load: 501}).alarm, p({g: 3, load: 9000, below: 500}).alarm, p({g: 3, below: 501}).alarm], [false, true, false, true, false, true, false, true]);
  check('emergency lighting: A-1 always; A-2 above one floor or 300 persons; A-3 above 500 m2 or 500 persons; A-4 not listed', [p({g: 0}).light, p({}).light, p({nf: 2}).light, p({load: 301}).light, p({g: 2, area: 500}).light, p({g: 2, area: 501}).light, p({g: 3}).lightKnown], [true, false, true, true, false, true, false]);
  check('sprinklers: high-rise above 22 m, more than 300 persons below the discharge floor, more than 400 persons except in educational; the exemption removes the last two', [p({h: 22}).sprHigh, p({h: 22.1}).sprHigh, p({lb: 301}).sprBelow, p({load: 401}).spr400, p({load: 401, edu: 1}).spr400, p({load: 401, ex: 1}).spr, p({lb: 301, ex: 2}).sprBelow, p({}).spr], [false, true, true, true, false, false, false, false]);
  check('smoke barriers only for educational above 3000 m2 or 90 m: 7000 m2 gives 3 compartments; 200 m side gives 3', [p({edu: 1, area: 3000, side: 90}).barrier, p({edu: 1, area: 3001}).barrier, p({edu: 1, side: 91}).barrier, p({area: 9000}).barrier, p({edu: 1, area: 7000}).comps, p({edu: 1, side: 200}).comps], [false, true, true, false, 3, 3]);
  check('external wall 1 h under 25 % unprotected openings, 3/4 h at 25 % or more; detectors in air systems; main exit half the load; panic hardware above 100', [p({po: 24.9}).wall, p({po: 25}).wall, p({g: 0, as: 1}).det, p({g: 0, as: 2}).det, p({g: 1, as: 1}).det, p({load: 600}).mainCap, p({dp: 100}).panic, p({dp: 101}).panic], [1, 0.75, false, true, true, 300, false, true]);
  check('finishes for other places become class C below 300 persons (not educational)', [p({load: 299}).cls3, p({load: 299, edu: 1}).cls3, p({load: 300}).cls3], ['C', 'B', 'B']);
}
let tt;
w.renderCalc('egasm'); w.calcResult('egasm');
tt = txt(w, 'xa_results');
check('the default page shows A-1 at 3/4 h with its checks and the 🔴 note; only the first group is visible', [tt.includes('3/4 h'), tt.includes('600 m²'), tt.includes('🔴'), w.document.getElementById('xa_g0').style.display, w.document.getElementById('xa_g1').style.display], [true, true, true, '', 'none']);
set('xa_m', '1'); set('xa_a1', '1700'); w.calcResult('egasm'); tt = txt(w, 'xa_results');
check('A-2 at 1700 m2 on one street moves to 1 h and shows the table clause', [tt.includes('1 h'), tt.includes('6-1-2-2'), tt.includes('غير قابل للاحتراق')], [true, true, true]);
set('xa_ty', '1'); set('xa_a1', '800'); w.calcResult('egasm'); tt = txt(w, 'xa_results');
check('A-3 table is titled 6-1-2-3', [tt.includes('6-1-2-3'), tt.includes('A-3')], [true, true]);
set('xa_m', '2'); set('xa_dx', '5'); w.calcResult('egasm'); tt = txt(w, 'xa_results');
check('A-4 at 5 m is not allowed to be combustible ✘', [tt.includes('✘'), tt.includes('غير قابل للاحتراق')], [true, true]);
set('xa_m', '3'); set('xa_l3', '700'); w.calcResult('egasm'); tt = txt(w, 'xa_results');
check('protection page shows 350 persons for a 700-person hall and the finishes', [tt.includes('350'), tt.includes('A / لا متطلبات'), tt.includes('Panic Hardware')], [true, true, true]);
check('other reference codes open egasm too', others('egasm', 'xa_results'), [true, true, true]);
}
// ---------- part 218: Egyptian fire code part 1, chapter 6-1 seating (`egseat`: aisles, bench seats, open stands, guard rails, stages, projection rooms, educational / library / exhibition rules) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xmCalc(' + JSON.stringify(o) + ')');
{
  const a = o => calc(Object.assign({mode: 0, n: 50, both: 0, r: 10, w: 105, s: 7, bk: 40, dead: 6, trav: 30, sp: 0, sl: 12}, o));
  check('aisle width: 75 cm up to 60 seats on one side, 105 cm above 60 or on both sides, plus 2.5 cm per row', [a({n: 60}).base, a({n: 61}).base, a({both: 1}).base, a({r: 10}).req, a({n: 70, r: 20}).req], [75, 105, 105, 100, 155], 1e-9);
  check('aisle width check: 100 cm passes for 50 seats and 10 rows at 105 cm; 99 cm fails', [a({w: 105}).okW, a({n: 50, w: 99}).okW, a({n: 50, w: 100}).okW, a({n: 80, w: 105, r: 10}).okW, a({n: 80, w: 130, r: 10}).okW], [true, false, true, false, true]);
  check('seven chairs to an aisle, 40 cm back clearance, 6 m dead end, 35 / 50 m travel, slope not steeper than 1 : 10', [a({s: 7}).okSeats, a({s: 8}).okSeats, a({bk: 39}).okBack, a({dead: 6.1}).okDead, a({trav: 35}).okTravel, a({trav: 36}).okTravel, a({trav: 50, sp: 1}).okTravel, a({trav: 51, sp: 1}).okTravel, a({sl: 10}).okSlope, a({sl: 9}).okSlope], [true, false, false, false, true, false, true, false, true, false]);
}
{
  const b = o => calc(Object.assign({mode: 1, n: 120, w: 110, back: 1, sc: 75, pw: 45, bk: 30, s: 7}, o));
  check('bench seats: aisle by 60 persons per exit unit of 55 cm with at least two units (110 cm): 120 -> 110, 121 -> 165, 500 -> 495', [b({n: 120}).reqAisle, b({n: 121}).reqAisle, b({n: 500}).reqAisle, b({n: 10}).reqAisle, b({n: 121, w: 165}).okAisle, b({n: 121, w: 164}).okAisle], [110, 165, 495, 110, true, false]);
  check('bench seats: 45 cm per person; row spacing 75 cm with backs and 55 cm without; 30 cm clearance; 7 seats with backs and 20 without', [b({pw: 44}).okSeat, b({sc: 74}).okSpacing, b({back: 0, sc: 55}).okSpacing, b({back: 0, sc: 54}).okSpacing, b({bk: 29}).okBack, b({s: 8}).okSeats, b({back: 0, s: 20}).okSeats, b({back: 0, s: 21}).okSeats], [false, false, true, false, false, false, true, false]);
}
{
  const s = o => calc(Object.assign({mode: 2, n: 200, w: 110, s: 20, ri: 20, tr: 28, sl: 8}, o));
  check('A-4: 20 virtual seats, aisle 110 cm (75 cm below 60 persons), riser at most 22.5 cm, tread at least 25 cm, slope 1 : 10', [s({s: 20}).okSeats, s({s: 21}).okSeats, s({n: 59}).req, s({n: 60}).req, s({n: 59, w: 75}).okW, s({w: 109}).okW, s({ri: 22.5}).okRiser, s({ri: 22.6}).okRiser, s({tr: 24.9}).okTread, s({sl: 10}).okSlope], [true, false, 75, 110, true, false, true, false, false, true]);
}
{
  const g = o => calc(Object.assign({mode: 3, hf: 75, face: 0, sb: 50, hc: 65, dl: 40, hu: 65}, o));
  check('guard rails: 75 cm at tier edges (1 m facing an aisle end or stair bottom); cross-aisle 65 cm unless seat backs reach 60 cm; upper level 65 cm when the step exceeds 45 cm', [g({}).front, g({face: 1}).front, g({hf: 74}).okFront, g({face: 1, hf: 99}).okFront, g({sb: 60}).crossNeeded, g({sb: 59}).crossNeeded, g({hc: 64}).okCross, g({sb: 60, hc: 10}).okCross, g({dl: 45}).upperNeeded, g({dl: 46}).upperNeeded, g({dl: 46, hu: 64}).okUpper, g({dl: 46, hu: 65}).okUpper], [75, 100, false, false, false, true, false, true, false, true, false, true]);
}
{
  const t = o => calc(Object.assign({mode: 4, plat: 0, a: 60, load: 500, pw: 12, ph: 7, d: 8}, o));
  check('stage: vents above 45 m2 serving more than 300 (7.5 % = 4.5 m2 for 60 m2); sprinklers above 45 m2 serving more than 200; hose valves above 50 m2; control station above 45 m2 and 300', [t({}).vent, t({}).ventMin, t({a: 45}).vent, t({load: 300}).vent, t({load: 300}).spr, t({load: 200}).spr, t({a: 50}).hose, t({a: 51}).hose, t({}).station, t({load: 300}).station], [true, 4.5, false, false, true, false, false, true, true, false], 1e-9);
  check('stage: sprinkler alternative at a depth up to 9 m; the curtain is fabric up to 18 m and 1000 persons, otherwise steel with at least 10 cm or 1/120 of the width; curtain size is the opening plus 0.90 m and 0.60 m', [t({}).sprAlt, t({d: 9.1}).sprAlt, t({}).curtainFabric, t({pw: 18.1}).curtainFabric, t({load: 1001}).curtainFabric, t({pw: 20}).thick, t({pw: 10, load: 1200}).thick, t({}).curW, t({}).curH, t({plat: 1}).stage], [true, false, true, false, false, 2000 / 120, 10, 12.9, 7.6, false], 1e-9);
}
{
  const p = o => calc(Object.assign({mode: 5, n: 2, l: 4, w: 3, h: 2.5, nd: 1, sp: 0, dw: 80, dh: 2.1, op: 20, dr: 0.75, rr: 1, cs: 75, cr: 90}, o));
  check('projection room: 7 m2 for one machine plus 3.5 m2 for each extra; at least 2.50 m in each direction and 2.30 m high', [p({n: 1}).reqArea, p({n: 3}).reqArea, p({n: 2, l: 3.4, w: 3}).okArea, p({n: 2, l: 3.5, w: 3}).okArea, p({w: 2.4}).okDim, p({h: 2.29}).okH], [7, 14, false, true, false, false], 1e-9);
  check('projection room doors: one when no side exceeds 9 m; two spaced at least a third of the perimeter above; width 75 cm, height 2 m; opening 25 %; 3/4 h doors, 1 h room; 75 / 90 cm operating space', [p({}).doors, p({l: 9.5}).doors, p({l: 9.5, nd: 1}).okDoors, p({l: 9.5, nd: 2, sp: 8.4}).okSpacing, p({l: 9.5, nd: 2, sp: 8.3}).okSpacing, p({dw: 74}).okDw, p({dh: 1.99}).okDh, p({op: 26}).okOpen, p({dr: 0.5}).okDoorRes, p({rr: 0.75}).okRoomRes, p({cs: 70}).okSide, p({cr: 85}).okRear], [1, 2, false, true, false, false, false, false, false, false, false, false]);
}
{
  const e = o => calc(Object.assign({mode: 6, cw: 180, sa: 200, sr: 0, hs: 0, ra: 400, ea: 150}, o));
  check('educational corridor 180 cm; library stack above 250 m2 needs 2 h separation or sprinklers; open shelves rooms 500 m2 (1000 with sprinklers); exhibitions above 200 m2 need sprinklers', [e({cw: 179}).okCor, e({sa: 250}).stackSep, e({sa: 251}).stackSep, e({sa: 251}).stackOk, e({sa: 251, sr: 2}).stackOk, e({sa: 251, hs: 1}).stackOk, e({ra: 500}).okRead, e({ra: 501}).okRead, e({ra: 1000, hs: 1}).okRead, e({ra: 1001, hs: 1}).okRead, e({ea: 200}).exSpr, e({ea: 201}).exOk, e({ea: 201, hs: 1}).exOk], [false, false, true, false, true, true, true, false, true, false, false, false, true]);
}
let tt;
w.renderCalc('egseat'); w.calcResult('egseat');
tt = txt(w, 'xm_results');
check('the default page shows the 100 cm aisle, the checks and the 🔴 note; only the first group is visible', [tt.includes('100.0 cm'), tt.includes('✔'), tt.includes('🔴'), w.document.getElementById('xm_g0').style.display, w.document.getElementById('xm_g1').style.display], [true, true, true, '', 'none']);
set('xm_w0', '90'); w.calcResult('egseat'); tt = txt(w, 'xm_results');
check('a 90 cm aisle for 50 seats and 10 rows fails ✘', [tt.includes('✘')], [true]);
set('xm_m', '1'); set('xm_n1', '500'); w.calcResult('egseat'); tt = txt(w, 'xm_results');
check('bench seats for 500 persons need a 495 cm aisle and the 110 cm provided fails', [tt.includes('495 cm'), tt.includes('✘')], [true, true]);
set('xm_m', '4'); w.calcResult('egseat'); tt = txt(w, 'xm_results');
check('the stage page shows 4.50 m2 of vents and the 12.90 x 7.60 m curtain', [tt.includes('4.50 m²'), tt.includes('12.90 × 7.60 m'), tt.includes('68')], [true, true, true]);
set('xm_pt', '1'); w.calcResult('egseat'); tt = txt(w, 'xm_results');
check('a plain raised platform is not a stage', [tt.includes('ليست منصة أداء مسرحي')], [true]);
set('xm_m', '5'); w.calcResult('egseat'); tt = txt(w, 'xm_results');
check('two machines in 3 x 3 m (9 m2) need 10.50 m2 ✘', [tt.includes('10.50 m²'), tt.includes('✘')], [true, true]);
set('xm_m', '6'); w.calcResult('egseat'); tt = txt(w, 'xm_results');
check('the educational page shows the 180 cm corridor and the 250 m2 stack rule', [tt.includes('180 cm'), tt.includes('250 m²')], [true, true]);
check('other reference codes open egseat too', others('egseat', 'xm_results'), [true, true, true]);
}
// ---------- part 219: Egyptian fire code part 1, chapter 6-2 institutional occupancies (`egbld`: B-1 construction, Table 6-2-2-2 for B-2, smoke barriers, waiting areas, alarm, ramps and finishes) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xbCalc(' + JSON.stringify(o) + ')');
{
  const a = o => calc(Object.assign({mode: 0, pr: 2, sp: 0}, o));
  check('B-1: 2 h non-combustible, basement sections 500 m2 with 2 h partitions (omitted with sprinklers), mezzanines 3/4 h, roof 1 h', [a({}).res, a({}).nc, a({}).base, a({sp: 1}).base, a({}).baseRes, a({}).mezz, a({}).roof], [2, true, 500, null, 2, 0.75, 1]);
  check('B-1 designed resistance below 2 h fails', [a({pr: 1.75}).okRes, a({pr: 2}).okRes, a({pr: 3}).okRes], [false, true, true]);
}
{
  const t = o => calc(Object.assign({mode: 1, nf: 1, sp: 0, area: 100, comb: 0}, o));
  check('Table 6-2-2-2 not sprinklered, one floor: 250 m2 at 3/4 h, up to 1000 m2 at 1 h, above that 2 h', [t({area: 250}).res, t({area: 251}).res, t({area: 1000}).res, t({area: 1001}).res], [0.75, 1, 1, 2]);
  check('sprinklered, one floor: 500 m2 at 3/4 h, up to 2400 m2 at 1 h, above that 2 h', [t({sp: 1, area: 500}).res, t({sp: 1, area: 501}).res, t({sp: 1, area: 2400}).res, t({sp: 1, area: 2401}).res], [0.75, 1, 1, 2]);
  check('two floors: 500 m2 not sprinklered and 1600 m2 sprinklered at 1 h, above that 2 h; three floors need 2 h; the limits themselves', [t({nf: 2, area: 500}).res, t({nf: 2, area: 501}).res, t({nf: 2, sp: 1, area: 1600}).res, t({nf: 2, sp: 1, area: 1601}).res, t({nf: 3, area: 10}).res, t({area: 250}).lim, t({nf: 2, sp: 1, area: 1}).lim, t({nf: 4}).lim], [1, 2, 1, 2, 2, 250, 1600, null]);
  check('combustible: allowed on the one-floor rows and the 3/4 h rows, flagged on two floors; the 2 h row is non-combustible with a sprinklered basement', [t({comb: 1, area: 800}).combBad, t({comb: 1, area: 200}).combBad, t({comb: 1, nf: 2, area: 400}).combBad, t({area: 200}).nc, t({area: 800}).nc, t({nf: 2, area: 400}).nc, t({nf: 3}).nc, t({nf: 3}).baseSpr, t({area: 800}).baseSpr], [false, false, true, false, false, true, true, true, false]);
}
{
  const p = o => calc(Object.assign({mode: 2, sub: 1, h: 12, imm: 1, sleep: 1, load: 80, area: 1500, side: 40, wa: 25, pers: 30, po: 20, rt: 0, rs: 10}, o));
  check('high-rise: 16 m for B, 13 m with sleeping persons unable to move', [p({h: 16, imm: 0}).high, p({h: 16.1, imm: 0}).high, p({h: 13}).high, p({h: 13.1}).high, p({}).limit, p({imm: 0}).limit], [false, true, false, true, 13, 16]);
  check('smoke barriers: more than 60 persons on a sleeping floor; 2 sections minimum, 2000 m2 or 45 m per section: 5000 m2 -> 3; 100 m side -> 3', [p({load: 60}).smoke, p({load: 61}).smoke, p({sleep: 0}).smoke, p({}).comps, p({area: 5000}).comps, p({area: 1000, side: 100}).comps, p({area: 2000, side: 45}).comps, p({load: 10}).comps], [false, true, false, 2, 3, 3, 2, 1]);
  check('waiting areas: 30 m2 on sleeping floors, 60 m2 elsewhere; alarm above 20 sleeping persons; external wall by 25 %', [p({wa: 30}).okWait, p({wa: 31}).okWait, p({sleep: 0, wa: 60}).okWait, p({sleep: 0, wa: 61}).okWait, p({pers: 20}).alarm, p({pers: 21}).alarm, p({po: 24}).wall, p({po: 25}).wall], [true, false, true, false, false, true, 1, 0.75]);
  check('ramps: B-1 interior 1 : 8, everything else 1 : 10', [p({sub: 0}).rampMax, p({sub: 0, rt: 1}).rampMax, p({}).rampMax, p({sub: 0, rs: 8}).okRamp, p({sub: 0, rs: 7}).okRamp, p({rs: 9}).okRamp], [8, 10, 10, true, false, false]);
  check('exit units: 30 persons per unit; doors 45 (B-1) and 36 (B-2)', [p({load: 61}).units, p({load: 60}).units, p({sub: 0}).doorsPer, p({}).doorsPer], [3, 2, 45, 36]);
}
let tt;
w.renderCalc('egbld'); w.calcResult('egbld');
tt = txt(w, 'xb_results');
check('the default page shows B-1 at 2 h with the 🔴 note; only the first group is visible', [tt.includes('2 h'), tt.includes('غير قابل للاحتراق'), tt.includes('🔴'), w.document.getElementById('xb_g0').style.display, w.document.getElementById('xb_g1').style.display], [true, true, true, '', 'none']);
set('xb_m', '1'); set('xb_a1', '1100'); w.calcResult('egbld'); tt = txt(w, 'xb_results');
check('B-2 at 1100 m2 not sprinklered needs 2 h and a sprinklered basement', [tt.includes('2 h'), tt.includes('برشاشات تلقائية'), tt.includes('6-2-2-2')], [true, true, true]);
set('xb_s1', '1'); w.calcResult('egbld'); tt = txt(w, 'xb_results');
check('sprinklered at 1100 m2 stays at 1 h with the 2400 m2 limit', [tt.includes('2400 m²'), tt.includes('1 h')], [true, true]);
set('xb_m', '2'); w.calcResult('egbld'); tt = txt(w, 'xb_results');
check('the protection page shows two smoke compartments, the 13 m limit, the 36-person doors and the finishes', [tt.includes('2 أقسام'), tt.includes('13 m'), tt.includes('36 شخصًا'), tt.includes('غرف تتسع لأربعة أشخاص أو أقل')], [true, true, true, true]);
set('xb_sb', '0'); w.calcResult('egbld'); tt = txt(w, 'xb_results');
check('B-1 shows the 1 : 8 ramp and the class C finishes for other places', [tt.includes('1 : 8'), tt.includes('C / لا متطلبات')], [true, true]);
check('other reference codes open egbld too', others('egbld', 'xb_results'), [true, true, true]);
}
// ---------- part 220: Egyptian fire code part 1, chapter 6-3 residential occupancies (`egres`: Table 6-3-2-1 construction and floor areas, hotels and lodging protection, egress limits) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xzCalc(' + JSON.stringify(o) + ')');
{
  const t = o => calc(Object.assign({mode: 0, nf: 1, st: 1, area: 100, sp: 0, comb: 0}, o));
  check('Table 6-3-2-1, 3/4 h: one floor 1200 / 1500 / 1800 m2, two floors 900 / 1125 / 1350, three floors 600 / 750 / 900', [1, 2, 3].map(s => t({st: s}).lim).concat([1, 2, 3].map(s => t({st: s, nf: 2}).lim)).concat([1, 2, 3].map(s => t({st: s, nf: 3}).lim)), [1200, 1500, 1800, 900, 1125, 1350, 600, 750, 900]);
  check('3/4 h limits: 1200 m2 passes on one street, 1201 needs 1 h with no limit for one floor; four floors need 1 h', [t({area: 1200}).res, t({area: 1201}).res, t({area: 1201}).lim, t({nf: 4, area: 100}).res], [0.75, 1, null, 1]);
  check('1 h rows: two floors 6000 m2 on one street and unlimited otherwise; three floors 4000 / 5000 / 6000; four 3000 / 3750 / 4500; five 2400 / 3000 / 3600; six 2000 / 2500 / 3000', [t({nf: 2, area: 901}).lim, t({nf: 2, st: 2, area: 1126}).lim, t({nf: 3, area: 601}).lim, t({nf: 3, st: 2, area: 751}).lim, t({nf: 3, st: 3, area: 901}).lim, t({nf: 4, st: 1, area: 100}).lim, t({nf: 4, st: 2, area: 100}).lim, t({nf: 4, st: 3, area: 100}).lim, t({nf: 5, st: 1, area: 100}).lim, t({nf: 5, st: 3, area: 100}).lim, t({nf: 6, st: 1, area: 100}).lim, t({nf: 6, st: 2, area: 100}).lim], [6000, null, 4000, 5000, 6000, 3000, 3750, 4500, 2400, 3600, 2000, 2500]);
  check('1 h limits are inclusive: two floors on one street 6000 passes, 6001 needs 2 h; six floors 2000 passes, 2001 needs 2 h; seven floors need 2 h', [t({nf: 2, area: 6000}).res, t({nf: 2, area: 6001}).res, t({nf: 6, area: 2000}).res, t({nf: 6, area: 2001}).res, t({nf: 7, area: 10}).res], [1, 2, 1, 2, 2]);
  check('sprinklers double the areas: 2400 passes at 3/4 h for one floor, 2401 does not; the basement is 500 m2 with 3/4 h partitions, 2 h in the other rows', [t({sp: 1, area: 2400}).res, t({sp: 1, area: 2401}).res, t({}).base, t({}).baseRes, t({nf: 4}).baseRes, t({sp: 1, area: 2400}).dbl], [0.75, 1, 500, 0.75, 2, true]);
  check('combustible type: allowed in the 3/4 h rows with approval, flagged when only 1 h or 2 h rows fit; the 1 h and 2 h rows are non-combustible', [t({comb: 1, area: 1000}).combBad, t({comb: 1, area: 2000}).combBad, t({area: 1000}).nc, t({area: 2000}).nc, t({nf: 7}).nc], [false, true, false, true, true]);
}
{
  const p = o => calc(Object.assign({mode: 1, sub: 1, h: 18, nf: 6, rooms: 60, guests: 120, direct: 0, sp: 0, cl: 60, dorm: 0, da: 0, fa: 400, br: 10, trav: 25, dead: 8, rt: 0, rs: 10, dw: 80, po: 20, as: 0}, o));
  check('high-rise: C-1 above 34 m, C-2 above 22 m', [p({sub: 0, h: 34}).high, p({sub: 0, h: 34.1}).high, p({h: 22}).high, p({h: 22.1}).high, p({sub: 0}).limit, p({}).limit], [false, true, false, true, 34, 22]);
  check('hotel alarm above 25 guests; corridor smoke detectors above 50 rooms; exemption with three floors or fewer and direct exits, or sprinklers', [p({guests: 25}).alarmHotel, p({guests: 26}).alarmHotel, p({rooms: 50}).smokeDet, p({rooms: 51}).smokeDet, p({nf: 3, direct: 1}).alarmExempt, p({nf: 4, direct: 1}).alarmExempt, p({sp: 1}).alarmExempt, p({sub: 0, h: 40}).alarmHigh, p({sub: 0, h: 30}).alarmHigh], [false, true, false, true, true, false, true, true, false]);
  check('sprinklers: high-rise, hotels above 50 rooms without direct exits, dormitories above three floors or 250 m2 of sleeping area', [p({h: 23}).sprHigh, p({rooms: 51}).sprHotel, p({rooms: 51, direct: 1}).sprHotel, p({rooms: 50}).sprHotel, p({dorm: 1, nf: 4}).sprDorm, p({dorm: 1, nf: 3, da: 251}).sprDorm, p({dorm: 1, nf: 3, da: 250}).sprDorm, p({rooms: 10}).spr, p({rooms: 10, h: 25}).spr], [true, true, false, false, true, true, false, false, true]);
  check('smoke barriers in hotel corridors longer than 45 m unless sprinklered or direct exits: 60 m -> 2 compartments, 100 m -> 3', [p({cl: 45}).barrier, p({cl: 60}).barrier, p({cl: 60}).comps, p({cl: 100}).comps, p({cl: 60, sp: 1}).barrier, p({cl: 60, direct: 1}).barrier, p({sub: 0, cl: 60}).barrier], [false, true, 2, 3, false, false, false]);
  check('corridor partitions 1 h (1/2 h with sprinklers); occupant load 2 per bedroom or 4 m2 per dormitory person', [p({}).corrRes, p({sp: 1}).corrRes, p({}).load, p({dorm: 1, fa: 400}).load, p({br: 7}).load], [1, 0.5, 20, 100, 14]);
  check('travel 30 / 45 m, dead end 9 / 12 m, ramps 1 : 8 inside and 1 : 10 outside, door 80 cm, external wall 25 %', [p({trav: 30}).okTravel, p({trav: 31}).okTravel, p({trav: 45, sp: 1}).okTravel, p({dead: 9}).okDead, p({dead: 10}).okDead, p({dead: 12, sp: 1}).okDead, p({rs: 8}).okRamp, p({rs: 7}).okRamp, p({rt: 1, rs: 9}).okRamp, p({rt: 1, rs: 10}).okRamp, p({dw: 79}).okDoor, p({po: 25}).wall, p({po: 24}).wall], [true, false, true, true, false, true, true, false, false, true, false, 0.75, 1]);
  check('exit signs for C-2 only; emergency lighting for high-rise buildings; duct detectors when the system serves more than one floor or wing', [p({}).signs, p({sub: 0}).signs, p({h: 25}).light, p({h: 20}).light, p({as: 0}).detDuct, p({as: 1}).detDuct, p({as: 2}).detDuct], [true, false, true, false, false, true, true]);
}
let tt;
w.renderCalc('egres'); w.calcResult('egres');
tt = txt(w, 'xz_results');
check('the default page (three floors on one street, 800 m2) needs 1 h with a 4000 m2 limit and the 🔴 note; only the first group is visible', [tt.includes('1 h'), tt.includes('4000 m²'), tt.includes('🔴'), w.document.getElementById('xz_g0').style.display, w.document.getElementById('xz_g1').style.display], [true, true, true, '', 'none']);
set('xz_n', '2'); set('xz_a', '800'); w.calcResult('egres'); tt = txt(w, 'xz_results');
check('two floors at 800 m2 stays at 3/4 h with the 900 m2 limit', [tt.includes('3/4 h'), tt.includes('900 m²')], [true, true]);
set('xz_s0', '1'); set('xz_a', '1800'); w.calcResult('egres'); tt = txt(w, 'xz_results');
check('with sprinklers the 900 m2 limit doubles to 1800', [tt.includes('1800 m²'), tt.includes('3/4 h'), tt.includes('900 × 2')], [true, true, true]);
set('xz_m', '1'); w.calcResult('egres'); tt = txt(w, 'xz_results');
check('the hotel page shows the 22 m limit, 2 smoke compartments for the 60 m corridor, the 1 : 8 ramp limit and the finishes', [tt.includes('22 m'), tt.includes('2 أقسام'), tt.includes('1 : 8'), tt.includes('C / لا متطلبات')], [true, true, true, true]);
set('xz_sb', '0'); w.calcResult('egres'); tt = txt(w, 'xz_results');
check('C-1 shows the 34 m limit', [tt.includes('34 m')], [true]);
check('other reference codes open egres too', others('egres', 'xz_results'), [true, true, true]);
}
// ---------- part 221: Egyptian fire code part 1, chapter 6-4 business occupancies (`egoff`: Table 6-4-2-1 construction and floor areas, alarm / emergency lighting / sprinkler triggers, egress limits) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xdCalc(' + JSON.stringify(o) + ')');
{
  const t = o => calc(Object.assign({mode: 0, nf: 1, st: 1, area: 100, sp: 0, comb: 0}, o));
  check('Table 6-4-2-1, 3/4 h: one floor 1000 / 1250 / 1500 m2, two floors 800 / 1000 / 1200', [1, 2, 3].map(s => t({st: s}).lim).concat([1, 2, 3].map(s => t({st: s, nf: 2}).lim)), [1000, 1250, 1500, 800, 1000, 1200]);
  check('1 h rows: one floor 4800 / 6000 / 7200, two floors 2400 / 3000 / 3600, three floors 1600 / 2000 / 2400', [1, 2, 3].map(s => t({st: s, area: [1001, 1251, 1501][s - 1]}).lim).concat([1, 2, 3].map(s => t({st: s, nf: 2, area: [801, 1001, 1201][s - 1]}).lim)).concat([1, 2, 3].map(s => t({st: s, nf: 3, area: 100}).lim)), [4800, 6000, 7200, 2400, 3000, 3600, 1600, 2000, 2400]);
  check('2 h limited rows: one floor unlimited; two floors 7200 on one street and unlimited otherwise; three 4800 / 6000 / 7200; four 3600 / 4500 / 5400; five 2880 / 3600 / 5400 (as printed); six 2400 / 3000 / 3600', [t({nf: 2, area: 7200}).lim, t({nf: 2, st: 2, area: 100000}).lim, t({nf: 3, area: 100000}).lim === undefined, t({nf: 4, st: 1, area: 3600}).lim, t({nf: 4, st: 2, area: 4500}).lim, t({nf: 4, st: 3, area: 5400}).lim, t({nf: 5, st: 1, area: 2880}).lim, t({nf: 5, st: 2, area: 3600}).lim, t({nf: 5, st: 3, area: 5400}).lim, t({nf: 6, st: 1, area: 2400}).lim, t({nf: 6, st: 3, area: 3600}).lim], [7200, null, false, 3600, 4500, 5400, 2880, 3600, 5400, 2400, 3600]);
  check('selection: 1000 m2 at 3/4 h, 1001 at 1 h; 4800 at 1 h, 4801 needs 2 h; three floors 1600 at 1 h, 1601 at 2 h; seven floors use the unlimited 2 h row with full ceilings', [t({area: 1000}).res, t({area: 1001}).res, t({area: 4800}).res, t({area: 4801}).res, t({nf: 3, area: 1600}).res, t({nf: 3, area: 1601}).res, t({nf: 7, area: 5}).res, t({nf: 7, area: 5}).ceilRed, t({nf: 4, area: 5}).ceilRed, t({nf: 3, area: 1601}).ceilRed], [0.75, 1, 1, 2, 1, 2, 2, false, true, true]);
  check('sprinklers double the areas (2000 passes 3/4 h, 2001 needs 1 h); basement 500 m2 with partitions 3/4 h, 1 h, 2 h; combustible allowed to 1 h rows only', [t({sp: 1, area: 2000}).res, t({sp: 1, area: 2001}).res, t({}).baseRes, t({area: 2000}).baseRes, t({nf: 4}).baseRes, t({comb: 1, area: 3000}).combBad, t({comb: 1, area: 4801}).combBad, t({comb: 1, area: 500}).combBad, t({area: 3000}).nc, t({area: 4801}).nc], [0.75, 1, 0.75, 1, 2, false, true, false, false, true]);
}
{
  const p = o => calc(Object.assign({mode: 1, h: 12, fa: 800, hh: 18, load: 600, above: 200, below: 0, dark: 0, as: 0, po: 20, sp: 0, trav: 28, dead: 6, rt: 0, rs: 10, ca: 400, cr: 1}, o));
  check('exemption up to 4 m and 200 m2; high-rise above 22 m', [p({h: 4, fa: 200}).exempt, p({h: 4.1, fa: 200}).exempt, p({h: 4, fa: 201}).exempt, p({hh: 22}).high, p({hh: 22.1}).high, p({hh: 22.1}).spr], [true, false, false, false, true, true]);
  check('alarm above 500 persons or 150 persons above or below the discharge floor; emergency lighting above 1000, 200 above, 150 below or windowless parts', [p({load: 500, above: 150}).alarm, p({load: 501}).alarm, p({load: 400, above: 151}).alarm, p({load: 400, above: 100, below: 151}).alarm, p({load: 1000, above: 200, below: 0}).light, p({load: 1001}).light, p({load: 400, above: 201}).light, p({load: 400, above: 100, below: 151}).light, p({load: 400, above: 100, dark: 1}).light], [false, true, true, true, false, true, true, true, true]);
  check('duct detectors when the system serves more than one floor or a floor at 13 m or more; external wall 25 %', [p({as: 0}).detDuct, p({as: 1}).detDuct, p({as: 2}).detDuct, p({po: 24.9}).wall, p({po: 25}).wall], [false, true, true, 1, 0.75]);
  check('travel 30 / 45 m, dead end 6 / 12 m, ramps 1 : 8 inside and 1 : 10 outside, exit units of 60 persons', [p({trav: 30}).okTravel, p({trav: 31}).okTravel, p({trav: 45, sp: 1}).okTravel, p({dead: 6}).okDead, p({dead: 7}).okDead, p({dead: 12, sp: 1}).okDead, p({rs: 8}).okRamp, p({rs: 7.9}).okRamp, p({rt: 1, rs: 10}).okRamp, p({rt: 1, rs: 9}).okRamp, p({load: 600}).units, p({load: 601}).units], [true, false, true, true, false, true, true, false, true, false, 10, 11]);
  check('combustible partitions in a non-combustible building: sprinklered, or inside 500 m2 with 1 h fire barriers', [p({}).conduit, p({ca: 501}).conduit, p({ca: 400, cr: 0.75}).conduit, p({ca: 900, cr: 0.5, sp: 1}).conduit], [true, false, false, true]);
}
let tt;
w.renderCalc('egoff'); w.calcResult('egoff');
tt = txt(w, 'xd_results');
check('the default page (four floors, 1500 m2 on one street) needs 2 h with a 3600 m2 limit and the 🔴 note; only the first group is visible', [tt.includes('2 h'), tt.includes('3600 m²'), tt.includes('🔴'), w.document.getElementById('xd_g0').style.display, w.document.getElementById('xd_g1').style.display], [true, true, true, '', 'none']);
set('xd_n', '1'); set('xd_a', '900'); w.calcResult('egoff'); tt = txt(w, 'xd_results');
check('one floor of 900 m2 stays at 3/4 h with the 1000 m2 limit', [tt.includes('3/4 h'), tt.includes('1000 m²')], [true, true]);
set('xd_s0', '1'); set('xd_a', '2000'); w.calcResult('egoff'); tt = txt(w, 'xd_results');
check('with sprinklers the limit doubles to 2000 m2', [tt.includes('2000 m²'), tt.includes('1000 × 2')], [true, true]);
set('xd_m', '1'); w.calcResult('egoff'); tt = txt(w, 'xd_results');
check('the protection page shows the alarm requirement for 600 persons, 10 exit units and the finishes', [tt.includes('مطلوب'), tt.includes('10 وحدة'), tt.includes('C / لا متطلبات'), tt.includes('22 m')], [true, true, true, true]);
check('other reference codes open egoff too', others('egoff', 'xd_results'), [true, true, true]);
}
// ---------- part 222: Egyptian fire code part 1, chapter 6-5 mercantile occupancies (`egmerc`: shop classes A / B / C, Table 6-5-2-1, protection and egress limits, covered malls) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xlCalc(' + JSON.stringify(o) + ')');
{
  const c = o => calc(Object.assign({mode: 0, area: 1500, sale: 2, upper: 1, mz: 0, h: 10, fa: 800}, o));
  check('shop classes: A above 3000 m2 or more than three sale floors; B between 300 and 3000 m2 or sale off the ground floor; C up to 300 m2 on the ground floor only', [c({area: 3000}).cls, c({area: 3001}).cls, c({area: 100, sale: 4, upper: 1}).cls, c({area: 300, sale: 1, upper: 0}).cls, c({area: 301, sale: 1, upper: 0}).cls, c({area: 100, sale: 2, upper: 1}).cls, c({area: 100, sale: 1, upper: 0}).cls], ['B', 'A', 'A', 'C', 'B', 'B', 'C']);
  check('a mezzanine above 40 % of the floor area counts as another sale floor (3 floors + mezzanine -> 4 -> class A)', [c({sale: 3, mz: 40}).eff, c({sale: 3, mz: 41}).eff, c({sale: 3, mz: 41, area: 100}).cls, c({sale: 3, mz: 40, area: 100}).cls], [3, 4, 'A', 'B']);
  check('exemption up to 4 m and 200 m2; high-rise above 24 m as printed (22 m flagged from chapter five)', [c({h: 4, fa: 200}).exempt, c({h: 4.1, fa: 200}).exempt, c({h: 24}).high, c({h: 24.1}).high, c({h: 23}).mid, c({h: 22}).mid, c({h: 25}).mid, c({area: 3001}).sprA, c({}).sprA], [true, false, false, true, true, false, false, true, false]);
}
{
  const t = o => calc(Object.assign({mode: 1, nf: 1, st: 1, area: 100, sp: 0, comb: 0}, o));
  check('3/4 h rows: one floor 1000 / 1250 / 1500; two floors 600 / 750 / 900; doubled when sprinklered', [1, 2, 3].map(s => t({st: s}).lim).concat([1, 2, 3].map(s => t({st: s, nf: 2}).lim)).concat([t({sp: 1}).lim, t({sp: 1, nf: 2, st: 3}).lim]), [1000, 1250, 1500, 600, 750, 900, 2000, 1800]);
  check('1 h not sprinklered: one floor 1500 on every street; two floors 1200 / 1500 / 1500; three floors 800 / 1000 / 1200', [1, 2, 3].map(s => t({st: s, area: 1501 * 0 + 1400}).lim).concat([1, 2, 3].map(s => t({st: s, nf: 2, area: [1201, 1501, 1501][s - 1] * 0 + 1100}).lim)).concat([1, 2, 3].map(s => t({st: s, nf: 3, area: 100}).lim)), [1500, 1500, 1500, 1200, 1500, 1500, 800, 1000, 1200]);
  check('1 h not sprinklered is chosen between the 3/4 h limit and its own limit; above 1500 m2 the building must be sprinklered (its doubled 3/4 h limit then covers 1501 m2)', [t({area: 1000}).res, t({area: 1001}).res, t({area: 1001}).need, t({area: 1500}).need, t({area: 1501}).need, t({area: 1501}).sprRow, t({area: 1501}).res], [0.75, 1, false, false, true, false, 0.75]);
  check('1 h sprinklered rows: 4800 / 6000 / 7200, 2400 / 3000 / 3600, 1600 / 2000 / 2400', [1, 2, 3].map(s => t({sp: 1, st: s, area: [2001, 2501, 3001][s - 1]}).lim).concat([1, 2, 3].map(s => t({sp: 1, st: s, nf: 2, area: [1201, 1501, 1801][s - 1]}).lim)).concat([1, 2, 3].map(s => t({sp: 1, st: s, nf: 3, area: [601, 751, 901][s - 1]}).lim)), [4800, 6000, 7200, 2400, 3000, 3600, 1600, 2000, 2400]);
  check('2 h sprinklered rows: two floors 7500 then unlimited; three 5000 / 6250 / 7500; four 3750 / 4650 / 5600; five 3000 / 3750 / 4500; six 2500 / 3100 / 3750', [t({sp: 1, nf: 2, area: 7200}).lim, t({sp: 1, nf: 2, st: 2, area: 9000}).lim, t({sp: 1, nf: 3, st: 1, area: 4900}).lim, t({sp: 1, nf: 3, st: 2, area: 6200}).lim, t({sp: 1, nf: 3, st: 3, area: 7500}).lim, t({sp: 1, nf: 4, st: 1, area: 3750}).lim, t({sp: 1, nf: 4, st: 2, area: 4650}).lim, t({sp: 1, nf: 4, st: 3, area: 5600}).lim, t({sp: 1, nf: 5, st: 1, area: 3000}).lim, t({sp: 1, nf: 5, st: 2, area: 3750}).lim, t({sp: 1, nf: 5, st: 3, area: 4500}).lim, t({sp: 1, nf: 6, st: 1, area: 2500}).lim, t({sp: 1, nf: 6, st: 2, area: 3100}).lim, t({sp: 1, nf: 6, st: 3, area: 3750}).lim], [7500, null, 5000, 6250, 7500, 3750, 4650, 5600, 3000, 3750, 4500, 2500, 3100, 3750]);
  check('rows beyond: seven floors go to the 3 h row with a 1.5 h roof; the 2 h rows have a 1 h roof; the roof is not specified for 3/4 h and 1 h rows; limits are inclusive', [t({sp: 1, nf: 7}).res, t({sp: 1, nf: 7}).roof, t({sp: 1, nf: 4}).roof, t({}).roof, t({sp: 1, nf: 2, area: 2401}).res, t({sp: 1, nf: 2, area: 7500}).res, t({sp: 1, nf: 2, area: 7501}).res, t({sp: 1, nf: 6, area: 3700, st: 3}).res], [3, 1.5, 1, 0, 2, 2, 3, 2]);
  check('basement: 500 m2 with 3/4 h partitions, 500 m2 with 2 h partitions (1 h not sprinklered), sprinklered basement otherwise; combustible only in the 3/4 h rows', [t({}).basePart, t({area: 1100}).basePart, t({sp: 1, area: 2000}).basePart, t({sp: 1, area: 4000}).basePart, t({nf: 4, sp: 1}).basePart, t({comb: 1, area: 700}).combBad, t({comb: 1, area: 1200}).combBad, t({area: 500}).nc, t({area: 1200}).nc], [0.75, 2, 0.75, null, null, false, true, false, true]);
}
{
  const p = o => calc(Object.assign({mode: 2, cls: 1, ag: 1200, ab: 600, au: 1800, nf: 3, mx: 1200, bf: 600, hh: 15, po: 20, sp: 0, trav: 28, dead: 6, rt: 0, rs: 8, wall: 1, aw: 110, aw1: 150}, o));
  check('occupant load: 3 m2 per person on the ground floor and basement, 6 m2 above; 1200 / 3 + 600 / 3 + 1800 / 6 = 900', [p({}).load, p({}).above, p({}).below, p({ag: 0, ab: 0, au: 600}).load], [900, 300, 200, 100], 1e-9);
  check('alarm above 300 persons, 150 above or below the ground floor, or more than two floors', [p({nf: 2, ag: 300, ab: 0, au: 300}).alarm, p({nf: 2, ag: 300, ab: 0, au: 1000}).alarm, p({nf: 2, ag: 100, ab: 0, au: 500}).alarm, p({nf: 3, ag: 100, ab: 0, au: 100}).alarm, p({nf: 2, ag: 100, ab: 460, au: 0}).alarm], [false, true, false, true, true]);
  check('sprinklers: class A, a floor above 1200 m2, a floor below the discharge floor above 300 m2, or above 24 m', [p({cls: 0}).sprA, p({cls: 1, mx: 1200, bf: 300, hh: 24}).spr, p({mx: 1201, bf: 300}).spr, p({mx: 1200, bf: 301}).spr, p({mx: 1200, bf: 300, hh: 24.1}).spr, p({mx: 1200, bf: 300, hh: 24}).sprBase], [true, false, true, true, true, false]);
  check('external wall 2 h under 25 % unprotected openings and 1 h above; duct detectors above four floors', [p({po: 24}).wall, p({po: 25}).wall, p({nf: 4}).detDuct, p({nf: 5}).detDuct], [2, 1, false, true]);
  check('travel 30 / 60 m, dead end 6 m, ramps 1 : 6 inside and 1 : 10 outside; 90 / 60 persons per unit in corridors and stairs; 110 / 75 persons per door unit', [p({trav: 30}).okTravel, p({trav: 31}).okTravel, p({trav: 60, sp: 1}).okTravel, p({dead: 6.1}).okDead, p({rs: 6}).okRamp, p({rs: 5}).okRamp, p({rt: 1, rs: 9}).okRamp, p({}).uCor, p({}).uStair, p({}).uDoor, p({}).uDoorOther], [true, false, true, false, true, false, false, 5, 15, 4, 7]);
  check('emergency lighting for classes A and B; the extra exit rule above 400 m2 with sale off the ground floor: ground units + 0.75 x stair units', [p({cls: 0}).lightNeeded, p({cls: 1}).lightNeeded, p({cls: 2}).lightNeeded, p({}).extra, p({ag: 300, ab: 0, au: 0}).extra, p({ag: 300, ab: 0, au: 200}).extra, p({}).groundUnits, p({}).wallUnits], [true, true, false, true, false, true, 5 + 0.75 * 9, (2 / 3) * 11.75], 1e-9);
  check('aisles 110 cm between walls, 90 cm between displays; class A needs one 150 cm aisle to the exit', [p({aw: 109}).okAisle, p({wall: 0, aw: 90}).okAisle, p({wall: 0, aw: 89}).okAisle, p({cls: 0, aw1: 149}).okAisleA, p({cls: 0, aw1: 150}).okAisleA, p({cls: 1, aw1: 10}).okAisleA], [false, true, false, false, true, true]);
}
{
  const m = o => calc(Object.assign({mode: 3, ga: 2000, gu: 2000, mw: 9, sp: 0, nf: 2, trav: 55, ne: 2, ew: 360, fx: 0, sw: 0}, o));
  check('covered mall: load 2000 / 3 + 2000 / 6 = 1000 persons -> 12 exit units (660 cm)', [m({}).load, m({}).units, m({}).fixedMin], [1000, 12, 660], 1e-9);
  check('mall width at least 9 m (6 m when the mall and the connected building are sprinklered) and at least the exit units', [m({mw: 8.9}).okW, m({mw: 6, sp: 1}).okW, m({mw: 5.9, sp: 1}).okW, m({mw: 9, ga: 6000, gu: 6000}).okWU, m({mw: 6.6, sp: 1}).okWU, m({mw: 6.5, sp: 1}).okWU], [false, true, false, false, true, false]);
  check('mall exits: two at least, each 165 cm or the units for the load it serves (12 units / 2 = 6 units = 330 cm)', [m({}).exitW, m({ew: 330}).okExit, m({ew: 329}).okExit, m({ne: 1, ew: 700}).okExit, m({ga: 100, gu: 100}).exitW], [330, true, false, false, 165]);
  check('mall travel 60 m, three floors maximum, sprinklered centre, sidewalk drop 1.50 m', [m({trav: 60}).okTravel, m({trav: 61}).okTravel, m({nf: 3}).okFloors, m({nf: 4}).okFloors, m({sp: 1}).okSpr, m({}).okSpr, m({sw: 1.5}).sidewalk, m({sw: 1.6}).sidewalk], [true, false, true, false, true, false, 2, 1]);
}
let tt;
w.renderCalc('egmerc'); w.calcResult('egmerc');
tt = txt(w, 'xl_results');
check('the default page shows class B, the 24 m height and the 🔴 note; only the first group is visible', [tt.includes('الفئة'), tt.includes('24 m'), tt.includes('🔴'), w.document.getElementById('xl_g0').style.display, w.document.getElementById('xl_g1').style.display], [true, true, true, '', 'none']);
set('xl_m', '1'); w.calcResult('egmerc'); tt = txt(w, 'xl_results');
check('the table page for 3 floors and 1000 m2 asks for sprinklers and shows 1 h with the 1600 m2 limit', [tt.includes('1600 m²'), tt.includes('1 h'), tt.includes('يلزم تزويد المبنى بالكامل برشاشات')], [true, true, true]);
set('xl_s1', '1'); w.calcResult('egmerc'); tt = txt(w, 'xl_results');
check('with sprinklers the same building stays at 1 h without the sprinkler warning', [tt.includes('1600 m²'), tt.includes('يلزم تزويد المبنى بالكامل برشاشات')], [true, false]);
set('xl_m', '2'); w.calcResult('egmerc'); tt = txt(w, 'xl_results');
check('the protection page shows 900 persons, 5 corridor units and the finishes', [tt.includes('900'), tt.includes('5 وحدة'), tt.includes('C / لا متطلبات'), tt.includes('11.75')], [true, true, true, true]);
set('xl_m', '3'); w.calcResult('egmerc'); tt = txt(w, 'xl_results');
check('the mall page shows 12 exit units and the 9 m width check', [tt.includes('12 وحدة'), tt.includes('9 m'), tt.includes('165')], [true, true, true]);
check('other reference codes open egmerc too', others('egmerc', 'xl_results'), [true, true, true]);
}
// ---------- part 223: Egyptian fire code part 1, chapter 6-6 industrial and storage occupancies (`egind`: Tables 6-6-2-1 for F-1 / F-2 / F-3 with open garages, protection and egress limits, garages and car repair shops) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xiCalc(' + JSON.stringify(o) + ')');
{
  const t = o => calc(Object.assign({mode: 0, nf: 1, st: 1, area: 100, sp: 0, comb: 0, gar: 0, lf: 0}, o));
  check('F-1 3/4 h not sprinklered: one floor 800 / 1000 / 1200 m2, two floors 400 / 500 / 600; doubled when sprinklered (1600 / 2400)', [1, 2, 3].map(s => t({st: s}).lim).concat([1, 2, 3].map(s => t({st: s, nf: 2}).lim)).concat([t({sp: 1}).lim, t({sp: 1, st: 3}).lim]), [800, 1000, 1200, 400, 500, 600, 1600, 2400]);
  check('F-1 sprinklered: 3/4 h non-combustible row up to 2400 m2, then the 2 h row doubled to 4800, then the 3 h row up to 6000 m2; above that nothing fits', [t({sp: 1, area: 1700}).res, t({sp: 1, area: 1700}).lim, t({sp: 1, area: 1700}).nc, t({sp: 1, area: 2500}).res, t({sp: 1, area: 2500}).lim, t({sp: 1, area: 4801}).res, t({sp: 1, area: 4801}).lim, t({sp: 1, area: 6001}).found], [0.75, 2400, true, 2, 4800, 3, 6000, false]);
  check('F-1 not sprinklered: 1201 m2 needs 2 h (2400 m2 limit); 2401 m2 cannot be built without sprinklers; five floors are outside the table', [t({area: 1201}).res, t({area: 1201}).lim, t({area: 2401}).found, t({nf: 5}).found, t({nf: 4, st: 2, area: 700}).lim, t({nf: 4, st: 3, area: 800}).lim], [2, 2400, false, false, 750, 900]);
  check('F-1 two floors 3 streets: 1900 m2 as printed (2 h row); three floors 800 / 1000 / 1200', [t({nf: 2, st: 3, area: 700}).res, t({nf: 2, st: 3, area: 1850}).lim, t({nf: 3, st: 1, area: 100}).lim, t({nf: 3, st: 3, area: 100}).lim], [2, 1900, 800, 1200]);
  check('F-1 combustible: allowed with approval only in the first 3/4 h row; flagged beyond it', [t({comb: 1, area: 700}).combBad, t({comb: 1, area: 700}).nc, t({comb: 1, area: 900}).combBad, t({area: 900}).nc], [false, false, true, true]);
  check('F-1 basement: 500 m2 with 3/4 h or 2 h partitions, sprinklered basement in the sprinklered rows; roof 1 h at 2 h and 1.5 h at 3 h', [t({}).base, t({}).basePart, t({area: 900}).basePart, t({sp: 1, area: 1700}).baseSpr, t({sp: 1, area: 1700}).ceilBase, t({area: 900}).roof, t({sp: 1, area: 4801}).roof, t({sp: 1, area: 4801}).mezz], [500, 0.75, 2, true, 2, 1, 1.5, 1.5]);
}
{
  const t = o => calc(Object.assign({mode: 1, nf: 1, st: 1, area: 100, sp: 0, comb: 0, gar: 0, lf: 0}, o));
  check('F-2 3/4 h: not sprinklered 1000 / 1250 / 1500 and 600 / 750 / 900; sprinklered 3000 / 3750 / 4500 and 1200 / 1500 / 1800', [1, 2, 3].map(s => t({st: s}).lim).concat([1, 2, 3].map(s => t({st: s, nf: 2}).lim)).concat([1, 2, 3].map(s => t({st: s, sp: 1}).lim)).concat([1, 2, 3].map(s => t({st: s, sp: 1, nf: 2}).lim)), [1000, 1250, 1500, 600, 750, 900, 3000, 3750, 4500, 1200, 1500, 1800]);
  check('F-2 1 h rows: 3200 / 4000 / 4800, 1600 / 2000 / 2400, 1070 / 1340 / 1600, 800 / 1000 / 1200', [1, 2, 3].map(s => t({st: s, area: 1100 * (s === 1 ? 1 : 0) + 1300}).lim).slice(0, 0).concat([1, 2, 3].map(s => t({st: s, area: [1001, 1251, 1501][s - 1]}).lim)).concat([1, 2, 3].map(s => t({st: s, nf: 3}).lim)).concat([t({nf: 4}).lim, t({nf: 4, st: 3}).lim]), [3200, 4000, 4800, 1070, 1340, 1600, 800, 1200]);
  check('F-2 selection: 1 h up to its limit, then 1.5 h (4 floors 1500 m2 -> 1.5 h), 2 h up to six floors, seven floors need sprinklers and the 3 h row', [t({area: 3200}).res, t({area: 3201}).res, t({area: 3201}).lim, t({nf: 4, area: 1300}).res, t({nf: 4, area: 1300}).lim, t({nf: 6}).res, t({nf: 6}).lim, t({nf: 7}).found, t({nf: 7, sp: 1}).res, t({nf: 7, sp: 1}).lim], [1, 1.5, 6000, 1.5, 1500, 2, 1500, false, 3, null]);
  check('F-2 2 h rows (as printed): 9000 / 11250 / 13500, 4500 / 5625 / 6750, 3000 / 3750 / 4500, 2250 / 2800 / 3375, 1800 / 2250 / 2770, 1500 / 1875 / 2250', [1, 2, 3].map(s => t({nf: 1, st: s, area: [9000, 11250, 13500][s - 1]}).lim).concat([1, 2, 3].map(s => t({nf: 4, st: s, area: [2000, 2500, 3000][s - 1]}).lim)).concat([1, 2, 3].map(s => t({nf: 5, st: s, area: [1600, 2000, 2500][s - 1]}).lim)), [9000, 11250, 13500, 2250, 2800, 3375, 1800, 2250, 2770]);
  check('F-2 basement 500 m2 with 3/4 h, 1 h or 2 h partitions; combustible allowed up to the 1 h rows only', [t({}).base, t({}).basePart, t({area: 3000}).basePart, t({area: 5000}).basePart, t({comb: 1, area: 3000}).combBad, t({comb: 1, area: 5000}).combBad, t({area: 5000}).nc, t({area: 3000}).nc], [500, 0.75, 1, 2, false, true, true, false]);
}
{
  const t = o => calc(Object.assign({mode: 2, nf: 1, st: 1, area: 100, sp: 0, comb: 0, gar: 0, lf: 0}, o));
  check('F-3 3/4 h: one floor not sprinklered 1600 / 2000 / 2400, sprinklered 4800 / 6000 / 7200; two floors 800 / 1000 / 1200 and 1600 / 2000 / 2400', [1, 2, 3].map(s => t({st: s}).lim).concat([1, 2, 3].map(s => t({st: s, sp: 1}).lim)).concat([1, 2, 3].map(s => t({st: s, nf: 2}).lim)).concat([1, 2, 3].map(s => t({st: s, nf: 2, sp: 1}).lim)), [1600, 2000, 2400, 4800, 6000, 7200, 800, 1000, 1200, 1600, 2000, 2400]);
  check('F-3 non-combustible 3/4 h rows 4800 / 6000 / 7200, 2400 / 3000 / 3600, 1600 / 2000 / 2400, 1200 / 1500 / 1800 with 1 h basement partitions', [t({area: 2000}).lim, t({area: 2000}).nc, t({area: 2000}).basePart, t({nf: 2, area: 2000}).lim, t({nf: 3, area: 1500}).lim, t({nf: 4, area: 1100}).lim], [4800, true, 1, 2400, 1600, 1200]);
  check('F-3 open garages: no fire resistance needed up to six floors with 12000 / 14000 / 16000 m2 at one or two floors, 6000 / 8000 / 10000 at three, 4500 / 5500 / 6500, 3600 / 4500 / 5400, 3000 / 3750 / 4500', [t({gar: 1, nf: 1, area: 11000}).res, t({gar: 1, nf: 2, area: 11000}).lim, t({gar: 1, nf: 3, st: 2, area: 100}).lim, t({gar: 1, nf: 4, st: 3, area: 100}).lim, t({gar: 1, nf: 5, st: 2, area: 100}).lim, t({gar: 1, nf: 6, st: 1, area: 100}).lim, t({gar: 1, nf: 7, area: 100}).res, t({gar: 0, nf: 3, area: 5000}).res, t({gar: 1, nf: 3, area: 5000}).res], [0, 12000, 8000, 6500, 4500, 3000, 2, 2, 0]);
  check('F-3 closed multi-floor rows (1 h): unlimited one floor, 7200 / 9000 / 10800, 4800 / 6000 / 7200, 3600 / 4500 / 5400, 2880 / 3600 / 4320, 2400 / 3000 / 3600 with 2 h basement partitions', [t({nf: 2, area: 5000}).lim, t({nf: 2, area: 5000}).res, t({nf: 5, st: 3, area: 4000}).lim, t({nf: 6, st: 2, area: 2900}).lim, t({nf: 6, st: 2, area: 2900}).basePart, t({nf: 2, area: 1e6}).res, t({nf: 7, area: 1e9}).res], [7200, 1, 4320, 3000, 2, 2, 2]);
  check('F-3 very low fire load: unlimited one floor with 1 h basement partitions; otherwise the unlimited general 1 h row with 2 h partitions', [t({area: 99999, lf: 1}).res, t({area: 99999, lf: 1}).basePart, t({area: 99999}).res, t({area: 99999}).basePart, t({area: 99999, lf: 1}).lim], [1, 1, 1, 2, null]);
  check('F-3 combustible flagged when only the non-combustible rows fit', [t({comb: 1, area: 1500}).combBad, t({comb: 1, area: 2000}).combBad, t({comb: 1, area: 1500}).res], [false, true, 0.75]);
}
{
  const p = o => calc(Object.assign({mode: 3, g: 2, h: 12, fa: 800, hh: 12, nf: 2, po: 20, load: 200, above: 50, below: 0, sa: 800, sp: 0, trav: 25, dead: 10, rt: 0, rs: 6, pers: 8, hz: 0, exp: 0, kind: 0, ar: 3000}, o));
  check('F-3 exemption up to 4 m and 200 m2; not for F-1 / F-2; high-rise above 22 m; duct detectors above four floors', [p({h: 4, fa: 200}).exempt, p({h: 4, fa: 201}).exempt, p({g: 1, h: 4, fa: 100}).exempt, p({hh: 22}).high, p({hh: 22.1}).high, p({nf: 4}).detDuct, p({nf: 5}).detDuct], [true, false, false, false, true, false, true]);
  check('alarm above 300 persons or 25 above / below ground for F-1 and F-2, above 500 and 75 for F-3; storage alarm at 500 / 3000 / 10000 m2', [p({g: 1, load: 300, above: 25}).alarm, p({g: 1, load: 301}).alarm, p({g: 1, above: 26}).alarm, p({g: 0, below: 26}).alarm, p({load: 500, above: 75}).alarm, p({load: 501}).alarm, p({above: 76}).alarm, p({g: 0, sa: 501}).storeAlarm, p({g: 1, sa: 3000}).storeAlarm, p({g: 1, sa: 3001}).storeAlarm, p({sa: 10000}).storeAlarm, p({sa: 10001}).storeAlarm], [false, true, true, true, false, true, true, true, false, true, false, true]);
  check('emergency lighting above 500 persons, 100 above or 75 below the discharge floor; external wall 2 / 1 h (F-1 / F-2) or 1 / 3/4 h (F-3)', [p({load: 500, above: 100}).light, p({load: 501}).light, p({above: 101}).light, p({below: 76}).light, p({g: 1, po: 24}).wall, p({g: 1, po: 25}).wall, p({po: 24}).wall, p({po: 25}).wall], [false, true, true, true, 2, 1, 1, 0.75]);
  check('travel 20 / 25 m (F-1) and 30 / 45 m (F-2, F-3); dead end none for F-1 and 15 m otherwise; ramps 1 : 6 inside and 1 : 10 outside', [p({g: 0, trav: 20}).okTravel, p({g: 0, trav: 21}).okTravel, p({g: 0, trav: 25, sp: 1}).okTravel, p({trav: 30}).okTravel, p({trav: 45, sp: 1}).okTravel, p({trav: 46, sp: 1}).okTravel, p({g: 0, dead: 0}).okDead, p({g: 0, dead: 1}).okDead, p({dead: 15}).okDead, p({dead: 16}).okDead, p({rs: 6}).okRamp, p({rs: 5}).okRamp, p({rt: 1, rs: 10}).okRamp], [true, false, true, true, true, false, true, false, true, false, true, false, true]);
  check('exit units: 30 persons (F-1) or 60 (others) per unit, doors 45 / 75; a single exit when the load is at most 30 and travel 15 m (not F-1); storage 1000 m2 and ten persons; the 120 m extension for one-floor F-2 / F-3 without explosion hazard', [p({g: 0, load: 61}).units, p({g: 1, load: 61}).units, p({g: 0}).doorPer, p({g: 2}).doorPer, p({load: 30, trav: 15}).singleInd, p({load: 31, trav: 15}).singleInd, p({g: 0, load: 10, trav: 5}).singleInd, p({sa: 1000, pers: 10}).singleStore, p({sa: 1001}).singleStore, p({hz: 1}).singleStore, p({nf: 1}).ext, p({nf: 2}).ext, p({nf: 1, exp: 1}).ext, p({g: 0, nf: 1}).ext, p({nf: 1, trav: 120}).okExt, p({nf: 1, trav: 121}).okExt], [3, 2, 45, 75, true, false, false, true, false, false, true, false, false, false, true, false]);
  check('occupant load factors: factories 5 m2, storage 30 m2, garages 50 m2 per person', [p({kind: 0}).calcLoad, p({kind: 1}).calcLoad, p({kind: 2}).calcLoad], [600, 100, 60], 1e-9);
}
{
  const q = o => calc(Object.assign({mode: 4, vl: 1.8, ga: 1200, vf: 20000, dd: 0, open: 0, sp: 0, trav: 30, wa: 1200, above: 0, wf: 1, wdd: 0, wauth: 0, wg: 0, ws: 9, wm: 9}, o));
  check('garages: vestibule at least 1.80 m; ventilation 13.7 m3/h per m2 (16440 for 1200 m2); hose valves above 1000 m2 and 60 cm below ground; sprinklers above 1.50 m', [q({vl: 1.8}).vest, q({vl: 1.79}).vest, q({}).vent, q({vf: 16440}).ventOk, q({vf: 16439}).ventOk, q({ga: 1001, dd: 0.61}).hose, q({ga: 1000, dd: 0.61}).hose, q({dd: 0.6}).hose, q({dd: 1.51}).spr, q({dd: 1.5}).spr], [true, false, 16440, true, false, true, false, false, true, false], 1e-9);
  check('garage travel: open 40 / 60 m, closed 35 / 50 m', [q({open: 1}).garTravel, q({open: 1, sp: 1}).garTravel, q({}).garTravel, q({sp: 1}).garTravel, q({trav: 35}).okGar, q({trav: 36}).okGar], [40, 60, 35, 50, true, false]);
  check('car repair shops: sprinklers above 1000 m2 under another occupancy, on more than one floor or below ground level by over 60 cm, or by order; exempt at street level with 9 m frontage and entrances', [q({above: 1}).wsSpr, q({wf: 2}).wsSpr, q({wdd: 0.7}).wsSpr, q({wa: 1000, above: 1}).wsSpr, q({wauth: 1, wa: 500}).wsSpr, q({wf: 2, wg: 1}).wsNeed, q({wdd: 0.6, wg: 1, wf: 2}).wsExempt, q({wg: 1, wf: 2, ws: 8}).wsNeed, q({wf: 2, wg: 1, ws: 9, wm: 9}).wsExempt, q({wf: 2, wg: 1, ws: 9, wm: 9}).wsNeed], [true, true, true, false, true, false, true, true, true, false]);
}
let tt;
w.renderCalc('egind'); w.calcResult('egind');
tt = txt(w, 'xi_results');
check('the default page (F-1, two floors, 1000 m2) needs 2 h with a 1200 m2 limit and the 🔴 note; only the first group is visible', [tt.includes('2 h'), tt.includes('1200 m²'), tt.includes('🔴'), w.document.getElementById('xi_g0').style.display, w.document.getElementById('xi_g3').style.display], [true, true, true, '', 'none']);
set('xi_m', '2'); set('xi_gt', '1'); set('xi_n', '3'); set('xi_a', '5000'); w.calcResult('egind'); tt = txt(w, 'xi_results');
check('an open garage of three floors and 5000 m2 needs no fire resistance and shows the 6000 m2 limit', [tt.includes('لا اشتراط'), tt.includes('6000 m²'), tt.includes('جراج مفتوح')], [true, true, true]);
set('xi_m', '3'); w.calcResult('egind'); tt = txt(w, 'xi_results');
check('the protection page shows the F-3 exit units, the 22 m limit and the finishes; the table inputs are hidden', [tt.includes('22 m'), tt.includes('4 وحدة'), tt.includes('C / لا متطلبات'), w.document.getElementById('xi_g0').style.display, w.document.getElementById('xi_g3').style.display], [true, true, true, 'none', '']);
set('xi_m', '4'); w.calcResult('egind'); tt = txt(w, 'xi_results');
check('the garage page shows the 16440 m3/h ventilation and the 1.80 m vestibule', [tt.includes('16440'), tt.includes('1.80 m'), tt.includes('الجدول 2-B')], [true, true, true]);
check('other reference codes open egind too', others('egind', 'xi_results'), [true, true, true]);
}
// ---------- part 224: Egyptian fire code part 1, chapters 3-1, 3-2 and 3-5 (`egconstr`: secondary combustible materials in non-combustible construction, floor finishes, mezzanines and the rules for load-bearing and shared elements) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xoCalc(' + JSON.stringify(o) + ')');
{
  const m = o => calc(Object.assign({mode: 0, k: 3, t: 20, fs: 100, sandwich: 0}, o));
  check('paint has no limits; paper 0.9 mm and flame spread 25; interior finishes 0.9 mm; wall cladding 25 mm and 150; ceiling cladding 25 mm and 25; insulation 25', [0, 1, 2, 3, 4, 5].map(k => m({k}).maxT).concat([0, 1, 2, 3, 4, 5].map(k => m({k}).maxFS)), [null, 0.9, 0.9, 25, 25, null, null, 25, null, 150, 25, 25]);
  check('wall cladding of 25 mm and flame spread 150 passes; 26 mm or 151 fails', [m({t: 25, fs: 150}).ok, m({t: 26, fs: 150}).ok, m({t: 25, fs: 151}).ok], [true, false, false]);
  check('ceiling cladding needs flame spread 25: 25 passes and 26 fails', [m({k: 4, t: 10, fs: 25}).ok, m({k: 4, t: 10, fs: 26}).ok, m({k: 4, t: 26, fs: 25}).ok], [true, false, false]);
  check('thin paper: 0.9 mm and flame spread 25 pass; 1.0 mm fails', [m({k: 1, t: 0.9, fs: 25}).ok, m({k: 1, t: 1, fs: 25}).ok, m({k: 1, t: 0.9, fs: 26}).ok, m({k: 2, t: 0.9, fs: 500}).ok, m({k: 2, t: 0.91, fs: 0}).ok], [true, false, false, true, false]);
  check('insulation: flame spread 25, or 75 between two non-combustible layers without air gaps', [m({k: 5, t: 50, fs: 25}).ok, m({k: 5, fs: 26}).ok, m({k: 5, fs: 75, sandwich: 1}).ok, m({k: 5, fs: 76, sandwich: 1}).ok, m({k: 5, sandwich: 1}).fsLimit, m({k: 5}).fsLimit], [true, false, true, false, 75, 25]);
  check('paint has no thickness or flame spread limit', [m({k: 0, t: 99, fs: 999}).ok], [true]);
}
{
  const f = o => calc(Object.assign({mode: 1, void: 0, area: 8}, o));
  check('floor finishes: a filled void or at most 10 m2 between fire stops', [f({void: 1, area: 99}).okFloor, f({area: 10}).okFloor, f({area: 10.1}).okFloor, f({void: 1}).fillOk, f({}).fillOk], [true, true, false, true, false]);
}
{
  const e = o => calc(Object.assign({mode: 2, mz: 160, fl: 400, sup: 2, own: 1, res: 2, ra: 1, rb: 2, res2: 2}, o));
  check('a mezzanine above 40 % of the floor below counts as a floor: 160 of 400 passes, 161 does not', [e({}).pct, e({}).floor, e({mz: 161}).floor, e({mz: 161}).okMz, e({fl: 0}).pct], [40, false, true, false, 0], 1e-9);
  check('a load-bearing element must not be weaker than what it carries or its own requirement', [e({}).okSupport, e({res: 1.75}).okSupport, e({sup: 1, own: 2, res: 1.75}).okOwn, e({sup: 1, own: 2, res: 2}).okOwn, e({}).need, e({sup: 3}).need], [true, false, false, true, 2, 3]);
  check('an element belonging to two compartments takes the stricter requirement', [e({}).stricter, e({res2: 1.9}).okShared, e({res2: 2}).okShared, e({ra: 3}).stricter], [2, false, true, 3]);
}
{
  const s = o => calc(Object.assign({mode: 3, dr: 20, dual: 0, fb: 60, lv: 0, vp: 0, wg: 1, gap: 20, fill: 1, duct: 1, dmp: 1, sw: 1, sc: 1}, o));
  check('smoke door fire resistance at least 20 minutes; a smoke barrier that is also a 60-minute fire barrier needs the stricter value', [s({dr: 20}).okDoor, s({dr: 19}).okDoor, s({dual: 1}).doorMin, s({dual: 1, dr: 40}).okDoor, s({dual: 1, dr: 60}).okDoor, s({dual: 1, fb: 15}).doorMin], [true, false, 60, false, true, 20]);
  check('the door swings on a vertical axis and returns to closed; no louvres or grilles; a vision panel only in wired or fire-resistant glass', [s({}).okSwing, s({sw: 0}).okSwing, s({sc: 0}).okSwing, s({}).okLouver, s({lv: 1}).okLouver, s({vp: 1, wg: 1}).okVision, s({vp: 1, wg: 0}).okVision, s({vp: 0, wg: 0}).okVision], [true, false, false, true, false, true, false, true]);
  check('penetration gaps up to 25 mm filled with flame-stopping material; smoke dampers where ducts pass the barrier', [s({gap: 25}).okGap, s({gap: 26}).okGap, s({gap: 20, fill: 0}).okFill, s({gap: 0, fill: 0}).okFill, s({}).dampers, s({duct: 0}).dampers, s({dmp: 0}).okDamper, s({duct: 0, dmp: 0}).okDamper], [true, false, false, true, true, false, false, true]);
}let tt;
w.renderCalc('egconstr'); w.calcResult('egconstr');
tt = txt(w, 'xo_results');
check('the default page shows wall cladding of 20 mm with flame spread 100 allowed and the 🔴 note; only the first group is visible', [tt.includes('تجليد الحوائط'), tt.includes('مسموح'), tt.includes('🔴'), w.document.getElementById('xo_g0').style.display, w.document.getElementById('xo_g1').style.display], [true, true, true, '', 'none']);
set('xo_fs', '200'); w.calcResult('egconstr'); tt = txt(w, 'xo_results');
check('flame spread 200 on the wall cladding is refused ✘', [tt.includes('✘'), tt.includes('غير مسموح')], [true, true]);
set('xo_m', '1'); w.calcResult('egconstr'); tt = txt(w, 'xo_results');
check('the floor page shows the 10 m2 rule', [tt.includes('10 m²'), tt.includes('3-1-2-3')], [true, true]);
set('xo_m', '2'); w.calcResult('egconstr'); tt = txt(w, 'xo_results');
check('the mezzanine page shows 40 % and the stricter shared element', [tt.includes('40 %'), tt.includes('2.0 h')], [true, true]);
set('xo_m', '3'); w.calcResult('egconstr'); tt = txt(w, 'xo_results');
check('the smoke barrier page shows the 20-minute door, the 25 mm gap and the dampers, and only its own group is visible', [tt.includes('20 دقيقة'), tt.includes('25 mm'), tt.includes('خوانق الدخان'), w.document.getElementById('xo_g3').style.display, w.document.getElementById('xo_g0').style.display], [true, true, true, '', 'none']);
set('xo_lv', '1'); w.calcResult('egconstr'); tt = txt(w, 'xo_results');
check('a louvred smoke door is refused ✘', [tt.includes('✘')], [true]);
check('other reference codes open egconstr too', others('egconstr', 'xo_results'), [true, true, true]);
}
// ---------- part 225: Egyptian fire code part 1, chapter 3-10 fire brigade compatibility (`egbrig`: access windows, basement openings, risers, hydrants, hose reels, foam inlets, emergency lighting) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xbrCalc(' + JSON.stringify(o) + ')');
{
  const a = o => calc(Object.assign({mode: 0, fl: 40, nw: 3, ww: 90, wh: 120, ws: 90, sg: 1, bd: 30, bw: 90, bh: 120, bs: 90}, o));
  check('one access window for every 16 m of frontage (at least one): 16 m -> 1, 16.1 -> 2, 40 m -> 3, 0 -> 1', [a({fl: 16}).winMin, a({fl: 16.1}).winMin, a({fl: 40}).winMin, a({fl: 0}).winMin, a({fl: 48}).winMin, a({fl: 49}).winMin], [1, 2, 3, 1, 3, 4]);
  check('windows at least 85 x 110 cm with the sill at most 100 cm above the floor; two windows are too few for 40 m', [a({ww: 85}).okWinW, a({ww: 84}).okWinW, a({wh: 110}).okWinH, a({wh: 109}).okWinH, a({ws: 100}).okSill, a({ws: 101}).okSill, a({nw: 2}).okWinN, a({nw: 3}).okWinN], [true, false, true, false, true, false, false, true]);
  check('a window covered by hard-to-break material (wired glass) is refused', [a({sg: 1}).okGlass, a({sg: 0}).okGlass], [true, false]);
  check('basements with a horizontal dimension above 23 m need an access opening of 85 x 110 cm with the sill at most 100 cm (a stair beyond)', [a({bd: 23}).needBase, a({bd: 23.1}).needBase, a({bw: 84}).okBaseW, a({bh: 109}).okBaseH, a({bs: 100}).okBaseSill, a({bs: 101}).okBaseSill, a({bs: 101}).stairBase, a({bs: 100}).stairBase], [false, true, false, false, true, false, true, false]);
}
{
  const r = o => calc(Object.assign({mode: 1, fh: 20, hr: 0, dm: 30, sp: 45, pr: 4.5, dd: 63, nr: 1, rv: 60, vd: 15}, o));
  check('a riser is needed above 16 m; wet risers above 28 m or in high-rise buildings; dry or wet between', [r({fh: 16}).riser, r({fh: 16.1}).riser, r({fh: 28}).wet, r({fh: 28.1}).wet, r({fh: 20, hr: 1}).wet, r({fh: 20}).wet], [false, true, false, true, true, false]);
  check('risers at most 50 m apart, hydrants within 36 m of any floor point, 63 mm hose, 4 kg/cm2 at the outlet, 18 m from the fire engine', [r({sp: 50}).okSpacing, r({sp: 51}).okSpacing, r({dm: 36}).okDist, r({dm: 37}).okDist, r({dd: 63}).okDia, r({dd: 65}).okDia, r({pr: 4}).okPress, r({pr: 3.9}).okPress, r({vd: 18}).okVis, r({vd: 19}).okVis], [true, false, true, false, true, false, true, false, true, false]);
  check('wet-riser reserve: 60 m3 for one riser and 30 m3 for each other (60 + 30 x (n - 1)); reducible to 30 m3 per riser with approval', [r({nr: 1}).reserve, r({nr: 2}).reserve, r({nr: 3}).reserve, r({nr: 0}).reserve, r({nr: 1}).reserveRed, r({nr: 3}).reserveRed, r({nr: 2, rv: 89}).okReserve, r({nr: 2, rv: 90}).okReserve, r({nr: 2, rv: 60}).okReserveRed, r({nr: 2, rv: 59}).okReserveRed], [60, 90, 120, 0, 30, 90, false, true, true, false]);
}
{
  const h = o => calc(Object.assign({mode: 2, md: 100, ob: 20, hs: 90, od: 50, hp: 4.5, pb: 50, rd: 25, rh: 1.2, hl: 30}, o));
  check('external hydrants: main at least 100 mm, within 25 m of the building, at most 100 m apart, 60 m from any opening, 4 kg/cm2', [h({md: 100}).okMain, h({md: 99}).okMain, h({ob: 25}).okOut, h({ob: 26}).okOut, h({hs: 100}).okSp, h({hs: 101}).okSp, h({od: 60}).okOpen, h({od: 61}).okOpen, h({hp: 4}).okPress, h({hp: 3.9}).okPress], [true, false, true, false, true, false, true, false, true, false]);
  check('public hydrant for small buildings within 60 m; hose reels 19 to 38 mm, mounted at most 1.50 m high, 30 m of hose', [h({pb: 60}).okPub, h({pb: 61}).okPub, h({rd: 19}).reelOk, h({rd: 38}).reelOk, h({rd: 18}).reelOk, h({rd: 39}).reelOk, h({rh: 1.5}).okReelH, h({rh: 1.51}).okReelH, h({hl: 30}).okHose, h({hl: 29}).okHose, h({}).reelCover], [true, false, true, true, false, false, true, false, true, false, 36]);
}
{
  const f = o => calc(Object.assign({mode: 3, bf: 1, fv: 1, fd: 15, fp: 25, lx: 10}, o));
  check('foam inlet visible, within 18 m of the foam mixer position, bore at least 25 cm; emergency lighting 10 lux at floor level', [f({}).okFoamVis, f({fv: 0}).okFoamVis, f({fd: 18}).okFoamD, f({fd: 19}).okFoamD, f({fp: 25}).okFoamPipe, f({fp: 24}).okFoamPipe, f({lx: 10}).okLux, f({lx: 9}).okLux, f({}).lux], [true, false, true, false, true, false, true, false, 10]);
}
let tt;
w.renderCalc('egbrig'); w.calcResult('egbrig');
tt = txt(w, 'xbr_results');
check('the default page shows the window count of 3 for 40 m, the 85 cm minimum and the 🔴 note; only the first group is visible', [tt.includes('16 m'), tt.includes('85 cm'), tt.includes('🔴'), w.document.getElementById('xbr_g0').style.display, w.document.getElementById('xbr_g1').style.display], [true, true, true, '', 'none']);
set('xbr_nw', '2'); w.calcResult('egbrig'); tt = txt(w, 'xbr_results');
check('two windows for a 40 m frontage fail ✘', [tt.includes('✘')], [true]);
set('xbr_m', '1'); set('xbr_fh', '30'); w.calcResult('egbrig'); tt = txt(w, 'xbr_results');
check('at 30 m the riser must be wet and the reserve of 60 m3 is shown', [tt.includes('رطب'), tt.includes('60 m³'), tt.includes('28 m')], [true, true, true]);
set('xbr_nr', '3'); set('xbr_rv', '60'); w.calcResult('egbrig'); tt = txt(w, 'xbr_results');
check('three wet risers need 120 m3 and a 60 m3 tank fails ✘', [tt.includes('120 m³'), tt.includes('✘')], [true, true]);
set('xbr_m', '2'); w.calcResult('egbrig'); tt = txt(w, 'xbr_results');
check('the hydrants page shows the 100 mm main, the 100 m spacing and the hose reel limits', [tt.includes('100 mm'), tt.includes('100 m'), tt.includes('19')], [true, true, true]);
set('xbr_m', '3'); set('xbr_bf', '1'); w.calcResult('egbrig'); tt = txt(w, 'xbr_results');
check('the foam inlet page shows the 18 m rule and the 10 lux emergency lighting', [tt.includes('18 m'), tt.includes('10 lux')], [true, true]);
check('other reference codes open egbrig too', others('egbrig', 'xbr_results'), [true, true, true]);
}
// ---------- part 226: Egyptian fire code part 1, chapter 4-3 exit protection (`egprot`: exit enclosure resistance, exposure distances, exit signs, escape route lighting and emergency lighting) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xpCalc(' + JSON.stringify(o) + ')');
{
  const a = o => calc(Object.assign({mode: 0, fl: 2, er: 2, op: 0, flat: 0, hh: 20, dr2: 2, dsp: 0}, o));
  check('the exit enclosure must resist at least what the floors it penetrates resist; the discharge is treated the same unless sprinklered on both sides', [a({}).okEnc, a({er: 1.75}).okEnc, a({er: 3}).okEnc, a({dr2: 1}).okDis, a({dr2: 1, dsp: 1}).okDis, a({dr2: 2}).okDis], [true, false, true, false, true, true]);
  check('openings other than doors in exit walls are refused, except in flat buildings up to 16 m', [a({op: 0}).okOpen, a({op: 1}).okOpen, a({op: 1, flat: 1, hh: 16}).okOpen, a({op: 1, flat: 1, hh: 16.1}).okOpen], [true, false, true, false]);
}
{
  const e = o => calc(Object.assign({mode: 1, dh: 3, da: 1.5, db: 1, wg: 0}, o));
  check('exit exposure: 3.00 m horizontally, 1.50 m above and 1.00 m below an unprotected opening', [e({}).okHor, e({dh: 2.9}).okHor, e({}).okAbove, e({da: 1.4}).okAbove, e({}).okBelow, e({db: 0.9}).okBelow, e({}).okAll, e({dh: 2.9}).okAll], [true, false, true, false, true, false, true, false]);
  check('a wired-glass opening counts as protected', [e({wg: 1}).protectedOpening, e({wg: 0}).protectedOpening, e({}).hor, e({}).above, e({}).below], [true, false, 3, 1.5, 1]);
}
{
  const s = o => calc(Object.assign({mode: 2, lh: 10, ar: 1, en: 1, auth: 0, lit: 1, mir: 0, dec: 0, load: 400, unf: 0, gl: 0, col: 1, dir: 1, ar2: 1, emg: 1, sgemg: 1}, o));
  check('exit sign letters at least 8 cm, Arabic and English unless the authority approves; illuminated; no mirrors or decor blocking', [s({lh: 8}).okH, s({lh: 7.9}).okH, s({}).okLang, s({en: 0}).okLang, s({en: 0, auth: 1}).okLang, s({lit: 0}).okLit, s({mir: 1}).okTraffic, s({dec: 1}).okTraffic, s({}).okTraffic], [true, false, true, false, true, false, false, false, true]);
  check('self-luminous signs for floors above 750 persons mostly unfamiliar with the routes; arrow on route signs; backup lighting for signs when emergency lighting is required', [s({load: 750, unf: 1}).glow, s({load: 751, unf: 1}).glow, s({load: 800}).glow, s({load: 800, unf: 1, gl: 0}).okGlow, s({load: 800, unf: 1, gl: 1}).okGlow, s({dir: 1, ar2: 0}).okArrow, s({dir: 0, ar2: 0}).okArrow, s({sgemg: 0}).okBackup, s({emg: 0, sgemg: 0}).okBackup, s({col: 0}).okColor], [false, true, false, false, true, false, true, false, true, false]);
}
{
  const l = o => calc(Object.assign({mode: 3, lx: 30, bt: 0, lum: 0, un: 1, ug: 0, nw: 0, pub: 0, mall: 0, hr: 0, inst: 0, du: 1, el: 10, tr: 8, au: 1, sepf: 1, cb: 0}, o));
  check('exit lighting at least 25 lux (2.5 fc) at floor level; no battery units or luminous / reflective materials as the main lighting', [l({lx: 25}).okLux, l({lx: 24}).okLux, +l({lx: 25}).fc.toFixed(2), l({bt: 1}).noBattery, l({lum: 1}).okLamps, l({un: 0}).okUniform], [true, false, 2.32, false, false, false]);
  check('emergency lighting needed underground, windowless, public buildings, covered malls and high-rise; duration 1 h, 1.5 h institutional, 2 h high-rise', [l({}).needEm, l({ug: 1}).needEm, l({nw: 1}).needEm, l({pub: 1}).needEm, l({mall: 1}).needEm, l({hr: 1}).needEm, l({}).dur, l({inst: 1}).dur, l({hr: 1}).dur, l({hr: 1, inst: 1}).dur], [false, true, true, true, true, true, 1, 1.5, 2, 2]);
  check('emergency lighting checks: duration, 10 lux, 10 s transfer, automatic, independent feeds in non-combustible conduits', [l({du: 1}).okDur, l({du: 0.9}).okDur, l({inst: 1, du: 1.4}).okDur, l({hr: 1, du: 2}).okDur, l({el: 10}).okLevel, l({el: 9}).okLevel, l({tr: 10}).okTransfer, l({tr: 11}).okTransfer, l({au: 0}).okAuto, l({sepf: 0}).okSep, l({cb: 1}).okCombust], [true, false, false, true, true, false, true, false, false, false, false]);
}
let tt;
w.renderCalc('egprot'); w.calcResult('egprot');
tt = txt(w, 'xp_results');
check('the default page shows the 2 h exit enclosure check and the 🔴 note; only the first group is visible', [tt.includes('2.0 h') || tt.includes('2 h'), tt.includes('3-3-3'), tt.includes('🔴'), w.document.getElementById('xp_g0').style.display, w.document.getElementById('xp_g1').style.display], [true, true, true, '', 'none']);
set('xp_er', '1'); w.calcResult('egprot'); tt = txt(w, 'xp_results');
check('a 1 h enclosure for 2 h floors fails ✘', [tt.includes('✘')], [true]);
set('xp_m', '1'); set('xp_dh', '2'); w.calcResult('egprot'); tt = txt(w, 'xp_results');
check('a 2.00 m horizontal distance fails the 3.00 m exposure rule ✘', [tt.includes('3.00 m'), tt.includes('✘')], [true, true]);
set('xp_m', '2'); set('xp_lh', '6'); w.calcResult('egprot'); tt = txt(w, 'xp_results');
check('6 cm letters fail the 8 cm sign rule ✘', [tt.includes('8 cm'), tt.includes('✘')], [true, true]);
set('xp_m', '3'); set('xp_hr', '1'); w.calcResult('egprot'); tt = txt(w, 'xp_results');
check('the lighting page shows 25 lux, 10 lux and the 2 h duration for high-rise', [tt.includes('25 lux'), tt.includes('10 lux'), tt.includes('2 h')], [true, true, true]);
check('other reference codes open egprot too', others('egprot', 'xp_results'), [true, true, true]);
}
// ---------- part 227: NFPA 13R and 13D residential sprinklers (`nfparesid`: design discharge, number of design sprinklers, supply duration, heat source distances, omissions, system limits) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xqCalc(' + JSON.stringify(o) + ')');
{
  const d = o => calc(Object.assign({mode: 0, sys: 0, n: 4, a: 16, ql: 50, k: 60, pl: 0.5, qr: 0, da: 90, one: 0, area: 150, eh: 6, st: 3, ch: 2.7, bd: 0, carea: 20}, o));
  check('13R design: density 2.04 L/min per m2 on 16 m2 is 32.6 L/min, the listed 50 L/min governs; four sprinklers give 200 L/min for 30 minutes = 6 m3', [d({}).dens, +d({}).qd.toFixed(2), d({}).qs, d({}).q, d({}).dur, d({}).vol], [2.04, 32.64, 50, 200, 30, 6], 1e-9);
  check('13R takes at most four sprinklers; 13D at most two', [d({n: 6}).n, d({n: 6}).exceeded, d({sys: 1, n: 4}).n, d({sys: 1, n: 4}).exceeded, d({sys: 1, n: 1}).n, d({sys: 1, n: 0}).n], [4, true, 2, true, 1, 1]);
  check('the largest of density, listing and K governs: 25 m2 at 2.04 = 51 L/min against a 40 L/min listing and K 60 (42.4 L/min) gives 51; with K 80 (56.6 L/min) the K flow governs; 30 m2 gives 61.2', [+d({a: 25, ql: 40}).qd.toFixed(2), +d({a: 25, ql: 40}).qs.toFixed(2), +d({a: 25, ql: 40, k: 80}).qk.toFixed(2), +d({a: 25, ql: 40, k: 80}).qs.toFixed(2), +d({a: 30, ql: 40, k: 20}).qs.toFixed(2)], [51, 51, 56.57, 56.57, 61.2]);
  check('the minimum operating pressure is 0.5 bar (7 psi) or the listing if higher', [d({pl: 0.3}).pmin, d({pl: 0.5}).pmin, d({pl: 0.9}).pmin, +d({pl: 0.9, k: 80}).qk.toFixed(2)], [0.5, 0.5, 0.9, 75.89]);
  check('13D: 10 minutes, or 7 minutes for a one-storey dwelling under 186 m2; 13D density is printed 2.0', [d({sys: 1}).dur, d({sys: 1, one: 1, area: 185}).dur, d({sys: 1, one: 1, area: 186}).dur, d({sys: 1, one: 0, area: 100}).dur, d({sys: 1}).dens], [10, 7, 10, 10, 2]);
  check('13D volume for two sprinklers at 50 L/min for 10 minutes = 1.0 m3 and 0.7 m3 for 7 minutes', [d({sys: 1}).vol, d({sys: 1, one: 1, area: 100}).vol], [1, 0.7], 1e-9);
  check('quick-response option in a 13R dwelling: 4.1 L/min per m2 over the whole 90 m2 = 369 L/min, taken when larger than the sprinkler flow', [d({qr: 1}).qrFlow, d({qr: 1}).tot, d({qr: 1, n: 4, da: 20}).tot, d({qr: 0}).qrFlow, d({sys: 1, qr: 1}).qr], [369, 369, 200, 0, false], 1e-9);
  check('elevation loss 0.098 bar per metre: 6 m = 0.588 bar; the supply 3 bar covers 0.5 + 0.588; 1 bar does not', [+d({eh: 6}).elev.toFixed(3), +d({eh: 6}).pReq.toFixed(3), d({st: 3}).okStatic, d({st: 1}).okStatic, d({st: 0}).okStatic], [0.588, 1.088, true, false, true]);
  check('reduced sprinkler count applies up to 7.3 m ceilings and 355 mm beams with compartments up to 55 m2', [d({ch: 7.3}).hgt, d({ch: 7.4}).hgt, d({bd: 0.355, carea: 55}).beam, d({bd: 0.36}).beam, d({bd: 0.3, carea: 56}).beam], [true, false, true, false, false]);
}
{
  const h = o => calc(Object.assign({mode: 1, sys: 1, hs: 3, dh: 1000, tc: 30, sk: 0, uc: 0}, o));
  check('the Table 7.5.6.3 rows: fireplace side 900 / 300, fireplace front 1500 / 900, stove 1050 / 300, range 450 / 229, water heater 150 / 76, lights 150 / 76 and 300 / 150', [0, 1, 2, 3, 10, 11, 12].map(i => h({hs: i}).ord).concat([0, 1, 2, 3, 10, 11, 12].map(i => h({hs: i}).mid)), [900, 1500, 1050, 450, 150, 150, 300, 300, 900, 300, 229, 76, 76, 150]);
  check('the heat source rows number 13 and the distances are inclusive: 450 mm passes an ordinary sprinkler near a range, 449 does not; 229 passes an intermediate one', [h({hs: 3, dh: 450}).okOrd, h({hs: 3, dh: 449}).okOrd, h({hs: 3, dh: 229}).okMid, h({hs: 3, dh: 228}).okMid], [true, false, true, false]);
  check('ambient limits: up to 38 C ordinary or intermediate, 38 to 65 C intermediate, up to 107 C high temperature; skylights and unventilated attics need intermediate', [h({tc: 38}).need, h({tc: 40}).need, h({tc: 65}).need, h({tc: 100}).need, h({tc: 110}).need, h({sk: 1}).skyMid, h({uc: 1}).skyMid, h({}).skyMid], ['عادية أو متوسطة', 'متوسطة', 'متوسطة', 'عالية (للساونا وغرف البخار)', 'عالية', true, true, false]);
}
{
  const c = o => calc(Object.assign({mode: 2, sys: 0, ba: 4, ca: 2, ncw: 1, pv: 2, pf: 1, fe: 0, fa: 0}, o));
  check('no sprinklers in bathrooms up to 5.1 m2 and closets up to 2.2 m2 (13R) or 2.1 m2 (13D) with non-combustible surfaces', [c({ba: 5.1}).bath, c({ba: 5.2}).bath, c({ca: 2.2}).closet, c({ca: 2.3}).closet, c({sys: 1, ca: 2.1}).closet, c({sys: 1, ca: 2.2}).closet, c({ncw: 0}).closet], [true, false, true, false, true, false, false]);
  check('ceiling pockets up to 2.8 m3 under a protected floor are omitted; fuel-fired equipment below or level with the living areas needs one quick-response sprinkler', [c({pv: 2.8}).pockets, c({pv: 2.9}).pockets, c({pf: 0}).pockets, c({fe: 1, fa: 0}).fuelNeed, c({fe: 1, fa: 1}).fuelNeed, c({fe: 0}).fuelNeed], [true, false, false, true, false, false]);
}
{
  const s = o => calc(Object.assign({mode: 3, sys: 0, fa: 1500, fl: 3, fd: 65, tp: 25, ra: 3000, pr: 0.5, gm: 20, wp: 6, pd: 25, steel: 1, fz: 0}, o));
  check('13R fire department connection above 186 m2 or more than one storey, at least 38 mm; riser area 4831 m2; test connection 25 mm; operating pressure 0.5 bar; gauge twice the working pressure', [s({fa: 186, fl: 1}).fdc, s({fa: 187, fl: 1}).fdc, s({fa: 100, fl: 2}).fdc, s({fd: 38}).fdcSize, s({fd: 37}).fdcSize, s({ra: 4831}).riserOk, s({ra: 4832}).riserOk, s({tp: 24}).test, s({pr: 0.49}).press, s({gm: 12, wp: 6}).gauge, s({gm: 11.9, wp: 6}).gauge], [false, true, true, true, false, true, false, false, false, true, false]);
  check('13D pipe sizes: steel 25 mm and other pipe 20 mm; durations 10 / 30 minutes', [s({sys: 1, pd: 25}).okPipe, s({sys: 1, pd: 24}).okPipe, s({sys: 1, steel: 0, pd: 20}).okPipe, s({sys: 1, steel: 0, pd: 19}).okPipe, s({sys: 1}).dur, s({sys: 0}).dur], [true, false, true, false, 10, 30]);
}
let tt;
w.renderCalc('nfparesid'); w.calcResult('nfparesid');
tt = txt(w, 'xq_results');
check('the default page shows the 13R design: four sprinklers, 200 L/min, 30 min and 6.00 m3 with the 🔴 note; only the first group is visible', [tt.includes('NFPA 13R'), tt.includes('200 L/min'), tt.includes('30 min'), tt.includes('6.00 m³'), tt.includes('🔴'), w.document.getElementById('xq_g0').style.display, w.document.getElementById('xq_g1').style.display], [true, true, true, true, true, '', 'none']);
set('xq_sy', '1'); w.calcResult('nfparesid'); tt = txt(w, 'xq_results');
check('switching to 13D limits the design to two sprinklers (100 L/min) for 10 min', [tt.includes('NFPA 13D'), tt.includes('100 L/min'), tt.includes('10 min')], [true, true, true]);
set('xq_m', '1'); w.calcResult('nfparesid'); tt = txt(w, 'xq_results');
check('the heat source page shows the range distances 450 and 229 mm', [tt.includes('450 mm'), tt.includes('229 mm'), tt.includes('7.5.6.3')], [true, true, true]);
set('xq_m', '2'); w.calcResult('nfparesid'); tt = txt(w, 'xq_results');
check('the omissions page shows the 5.1 m2 bathroom and 2.1 m2 closet limits for 13D', [tt.includes('5.1 m²'), tt.includes('2.1 m²')], [true, true]);
set('xq_m', '3'); w.calcResult('nfparesid'); tt = txt(w, 'xq_results');
check('the system page shows the 4831 m2 riser limit and the 10-minute supply', [tt.includes('4831 m²'), tt.includes('10 min')], [true, true]);
check('other reference codes open nfparesid too', others('nfparesid', 'xq_results'), [true, true, true]);
}
// ---------- part 228: NFPA 96 commercial cooking exhaust (`nfpa96`: clearances and their reduction, hood / duct construction, filters, access, duct enclosure ratings and termination clearances) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xjCalc(' + JSON.stringify(o) + ')');
{
  const c = o => calc(Object.assign({mode: 0, mt: 0, rd: 0, cl: 500, lst: 0, zp: 0, encType: 0, ec: 460, hd: 300, bf: 1, pt: 460, bg: 160}, o));
  check('clearance to combustible 457 mm, limited-combustible 76 mm, non-combustible 0; the provided 457 passes and 456 fails', [0, 1, 2].map(m => c({mt: m}).base), [457, 76, 0]);
  check('the clearance check is inclusive', [c({cl: 457}).ok, c({cl: 456}).ok, c({mt: 1, cl: 76}).ok, c({mt: 1, cl: 75}).ok, c({mt: 2, cl: 0}).ok], [true, false, true, false, true]);
  check('reduction systems apply to combustible material only: 28 gauge sheet on 25 mm spacers gives 229 mm, 22 gauge on mineral wool 76 mm, listed enclosure per its listing', [c({rd: 1}).reqEff, c({rd: 2}).reqEff, c({rd: 3}).reqEff, c({mt: 1, rd: 1}).reqEff, c({rd: 1, cl: 229}).ok, c({rd: 1, cl: 228}).ok, c({lst: 1}).reqEff], [229, 76, null, 76, true, false, null]);
  check('zero clearance to limited-combustible only with listed or masonry protection', [c({mt: 1, zp: 1}).zero, c({mt: 1, zp: 0}).zero, c({mt: 0, zp: 1}).zero], [true, false, false]);
  check('duct enclosures: 457 mm to combustible enclosure surfaces and 152 mm to non-combustible or limited-combustible ones', [c({encType: 0, ec: 457}).okEnc, c({encType: 0, ec: 456}).okEnc, c({encType: 1, ec: 152}).okEnc, c({encType: 1, ec: 151}).okEnc, c({encType: 0}).encReq, c({encType: 1}).encReq], [true, false, true, false, 457, 152]);
  check('a baffle is needed when the grease removal device is within 457 mm of the heat source; the flame path 457 mm and the gap 152 mm', [c({hd: 457, bf: 0}).baffleOk, c({hd: 456, bf: 0}).baffleOk, c({hd: 300, bf: 1}).baffleOk, c({pt: 457}).baffleDist, c({pt: 456}).baffleDist, c({bg: 152}).baffleGap, c({bg: 151}).baffleGap], [true, false, true, true, false, true, false]);
}
{
  const d = o => calc(Object.assign({mode: 1, ss: 0, ht: 1.21, ds: 0, dt: 1.52, q: 1.5, area: 0.4, fa: 45, ao: 508, ah: 508, ai: 3.5, da: 400, fx: 0.9, ov: 50, jg: 6, ed: 40, tl: 0.9}, o));
  check('hood steel 1.21 mm (stainless 0.91); duct steel 1.52 mm (stainless 1.21)', [d({ht: 1.21}).hoodOk, d({ht: 1.2}).hoodOk, d({ss: 1, ht: 0.91}).hoodOk, d({ss: 1, ht: 0.9}).hoodOk, d({dt: 1.52}).ductOk, d({dt: 1.5}).ductOk, d({ds: 1, dt: 1.21}).ductOk, d({ds: 1, dt: 1.2}).ductOk], [true, false, true, false, true, false, true, false]);
  check('duct velocity at least 152.4 m/min (2.54 m/s): 1.5 m3/s over 0.4 m2 is 225 m/min (738 ft/min); 0.9 m3/s over 0.4 m2 is 135 m/min and fails', [d({}).vel, Math.round(d({}).velFpm), d({}).velOk, d({q: 0.9}).vel, d({q: 0.9}).velOk, d({q: 1.016, area: 0.4}).velOk], [225, 738, true, 135, false, true], 1e-9);
  check('filters at 45 degrees or steeper; access opening 508 x 508 mm with 3.7 m cleaning intervals; 457 mm to the damper; 0.92 m to the fan', [d({fa: 45}).filterAngle, d({fa: 44}).filterAngle, d({ao: 508}).accessOk, d({ao: 507}).accessOk, d({ah: 507}).accessOk, d({ai: 3.7}).accessInt, d({ai: 3.8}).accessInt, d({da: 457}).damperAcc, d({da: 458}).damperAcc, d({fx: 0.92}).fanAcc, d({fx: 0.93}).fanAcc], [true, false, true, false, false, true, false, true, false, true, false]);
  check('telescoping joints: overlap at most 50.8 mm, size difference at most 6.4 mm; opening edge at least 38.1 mm; transition at most 0.92 m', [d({ov: 50.8}).overlap, d({ov: 51}).overlap, d({jg: 6.4}).jointGap, d({jg: 6.5}).jointGap, d({ed: 38.1}).edge, d({ed: 38}).edge, d({tl: 0.92}).trans, d({tl: 1}).trans], [true, false, true, false, true, false, true, false]);
}
{
  const e = o => calc(Object.assign({mode: 2, fl: 3, er: 1, hd2: 3, cs: 1.5, ai2: 0, vs: 1, ud: 0.46, uf: 1.02, an: 0, wd: 3, nw: 1}, o));
  check('enclosure rating 1 h below four storeys and 2 h from four storeys up', [e({fl: 3}).rating, e({fl: 4}).rating, e({fl: 3, er: 1}).okRating, e({fl: 4, er: 1}).okRating, e({fl: 4, er: 2}).okRating], [1, 2, true, false, true]);
  check('rooftop termination: 3 m horizontal, 1.5 m to combustible structure, 0.92 m below intakes within 3 m, upblast fan 0.46 m and 1.02 m from the roof', [e({hd2: 3}).hor, e({hd2: 2.9}).hor, e({cs: 1.5}).comb, e({cs: 1.4}).comb, e({ai2: 1, vs: 0.92}).vert, e({ai2: 1, vs: 0.9}).vert, e({ai2: 0, vs: 0}).vert, e({ud: 0.46}).up1, e({ud: 0.45}).up1, e({uf: 1.02}).up2, e({uf: 1}).up2], [true, false, true, false, true, false, true, true, false, true, false]);
  check('wall termination: 3 m plus 76 mm per degree above horizontal: 30 degrees needs 5.28 m', [+e({an: 0}).wallReq.toFixed(3), +e({an: 30}).wallReq.toFixed(3), e({an: 30, wd: 5.28}).wallOk, e({an: 30, wd: 5.2}).wallOk, e({an: 90}).wallReq], [3, 5.28, true, false, 9.84]);
}
let tt;
w.renderCalc('nfpa96'); w.calcResult('nfpa96');
tt = txt(w, 'xj_results');
check('the default page shows the 457 mm clearance, the checks and the 🔴 note; only the first group is visible', [tt.includes('457 mm'), tt.includes('✔'), tt.includes('🔴'), w.document.getElementById('xj_g0').style.display, w.document.getElementById('xj_g1').style.display], [true, true, true, '', 'none']);
set('xj_cl', '300'); w.calcResult('nfpa96'); tt = txt(w, 'xj_results');
check('300 mm of clearance to combustible material fails ✘', [tt.includes('✘')], [true]);
set('xj_m', '1'); set('xj_q', '0.9'); w.calcResult('nfpa96'); tt = txt(w, 'xj_results');
check('the construction page shows 152.4 m/min and fails the velocity at 135 m/min ✘', [tt.includes('152.4'), tt.includes('135.0'), tt.includes('✘')], [true, true, true]);
set('xj_m', '2'); w.calcResult('nfpa96'); tt = txt(w, 'xj_results');
check('the termination page shows the 3 m clearance, the 1 h enclosure for three storeys and the 1.02 m fan rule', [tt.includes('3 m'), tt.includes('1 h'), tt.includes('1.02 m')], [true, true, true]);
check('other reference codes open nfpa96 too', others('nfpa96', 'xj_results'), [true, true, true]);
}
// ---------- part 229: NFPA 80 fire doors (`nfpa80`: swinging door clearances, glazing limits, floor coverings, damper sleeve and sign) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xnCalc(' + JSON.stringify(o) + ')');
{
  const c = o => calc(Object.assign({mode: 0, hm: 0, ge: 3.2, gs: 3.2, gb: 15, bh: 0, fl: 0, chf: 0.25}, o));
  check('hollow metal door edge clearance is 3.18 mm plus or minus 1.59 mm: 1.59 to 4.77 mm', [+c({}).lo.toFixed(2), +c({}).hi.toFixed(2), c({ge: 1.59}).okEdge, c({ge: 1.58}).okEdge, c({ge: 4.77}).okEdge, c({ge: 4.78}).okEdge, c({gs: 4.77}).okStile, c({gs: 4.8}).okStile], [1.59, 4.77, true, false, true, false, true, false]);
  check('wood or HPDL-faced doors may not exceed 3.18 mm', [c({hm: 1, ge: 3.18}).okEdgeMat, c({hm: 1, ge: 3.3}).okEdgeMat, c({hm: 0, ge: 4.7}).okEdgeMat, c({hm: 1}).maxEdge, c({hm: 0}).maxEdge > 4.7], [true, false, true, 3.18, true]);
  check('the bottom clearance is at most 19 mm (3/4 in.), 9.5 mm when the door bottom is higher than 965 mm above the floor', [c({gb: 19}).okBottom, c({gb: 19.1}).okBottom, c({}).bottomMax, c({bh: 966}).bottomMax, c({bh: 965}).bottomMax, c({bh: 966, gb: 10}).okBottom, c({bh: 966, gb: 9.5}).okBottom], [true, false, 19, 9.5, 19, false, true]);
  check('combustible floor covering through 1.5 h or lower rated openings needs 0.22 W/cm2; not through 3 h doors', [c({fl: 1, chf: 0.22}).coverOk, c({fl: 1, chf: 0.21}).coverOk, c({fl: 1.5, chf: 0.3}).coverOk, c({fl: 3, chf: 1}).coverOk, c({fl: 0}).coverOk], [true, false, true, false, true]);
}
{
  const g = o => calc(Object.assign({mode: 1, rt: 3, ga: 0.05, gd: 0.5, tr: 0}, o));
  check('3 h doors limit glazing to 0.065 m2 (100 in2); other ratings are limited to the tested area', [g({rt: 3}).limit, g({rt: 0}).limit, g({rt: 1}).limit, g({rt: 2}).limit, g({ga: 0.065}).areaOk, g({ga: 0.066}).areaOk, g({rt: 1, ga: 5}).areaOk], [0.065, null, null, null, true, false, true]);
  check('an individual light is at most 0.84 m2 and 1.37 m in any dimension; temperature-rise doors refuse glazing above 0.065 m2', [g({ga: 0.84, gd: 1.37}).lightOk, g({ga: 0.85}).lightOk, g({gd: 1.38}).lightOk, g({tr: 1, ga: 0.07}).tempBad, g({tr: 1, ga: 0.065}).tempBad, g({tr: 0, ga: 0.5}).tempBad], [true, false, false, true, false, false]);
}
{
  const s = o => calc(Object.assign({mode: 2, sc: 60, ex: 30, sg: 13, hd: 0}, o));
  check('damper sleeve clearance at least the expansion clearance plus 25.4 mm; sign letters at least 13 mm', [s({sc: 55.4, ex: 30}).okSleeve, s({sc: 55.3, ex: 30}).okSleeve, s({sg: 13}).okDamperSign, s({sg: 12}).okDamperSign], [true, false, true, false]);
}
let tt;
w.renderCalc('nfpa80'); w.calcResult('nfpa80');
tt = txt(w, 'xn_results');
check('the default page shows the 3.18 mm clearance with the tolerance and the 🔴 note; only the first group is visible', [tt.includes('3.18 mm'), tt.includes('✔'), tt.includes('🔴'), w.document.getElementById('xn_g0').style.display, w.document.getElementById('xn_g1').style.display], [true, true, true, '', 'none']);
set('xn_ge', '6'); w.calcResult('nfpa80'); tt = txt(w, 'xn_results');
check('a 6 mm edge clearance fails ✘', [tt.includes('✘')], [true]);
set('xn_m', '1'); w.calcResult('nfpa80'); tt = txt(w, 'xn_results');
check('the glazing page shows the 0.065 m2 limit for three hours', [tt.includes('0.065 m²'), tt.includes('0.84 m²'), tt.includes('4.4.5')], [true, true, true]);
set('xn_m', '2'); w.calcResult('nfpa80'); tt = txt(w, 'xn_results');
check('the damper page shows the sleeve rule', [tt.includes('25.4 mm')], [true]);
check('other reference codes open nfpa80 too', others('nfpa80', 'xn_results'), [true, true, true]);
}
// ---------- part 230: NFPA 110 emergency and standby power (`nfpa110`: class, type, level, main fuel tank 133 %, acceptance and exercise loading, time delays) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xgCalc(' + JSON.stringify(o) + ')');
{
  const c = o => calc(Object.assign({mode: 0, c: 2, cx: 8, t: 1, tr: 8, lv: 0, hp: 0, fr: 60, tk: 1000, kw: 500}, o));
  check('class hours: 0.083, 0.25, 2, 6, 48 and class X as entered', [0, 1, 2, 3, 4, 5].map(k => c({c: k, cx: 12}).hours), [0.083, 0.25, 2, 6, 48, 12]);
  check('types: U 0 s, 10 s, 60 s, 120 s and M with no limit; the transfer time is checked against the type', [0, 1, 2, 3, 4].map(k => c({t: k}).tmax), [0, 10, 60, 120, null]);
  check('type 10: 10 s passes, 11 s fails; type M always passes', [c({t: 1, tr: 10}).okType, c({t: 1, tr: 11}).okType, c({t: 4, tr: 9999}).okType, c({t: 0, tr: 1}).okType], [true, false, true, false]);
  check('fuel for class 2 at 60 L/h is 120 L and the main tank must hold 133 % = 159.6 L; 1000 L passes, 159 L fails', [c({}).fuel, +c({}).tank.toFixed(1), c({}).okTank, c({tk: 159}).okTank, c({tk: 159.6}).okTank], [120, 159.6, true, false, true], 1e-9);
  check('class 48 needs 2880 L of fuel and a 3830.4 L tank; the energy over the class is kW x hours', [c({c: 4}).fuel, +c({c: 4}).tank.toFixed(1), c({c: 4}).okTank, c({c: 4, tk: 3830.4}).okTank, c({c: 4}).kwh], [2880, 3830.4, false, true, 24000]);
  check('level 1 for life-safety loads, level 2 otherwise', [c({lv: 0}).level.includes('1'), c({lv: 1}).level.includes('2')], [true, true]);
}
{
  const t = o => calc(Object.assign({mode: 1, kw: 500, bl: 100, bd: 1.5}, o));
  check('acceptance full-load test: 30 % for 30 min, 50 % for 30 min and 100 % for 60 min of 500 kW: 150 / 250 / 500 kW and 75 + 125 + 500 = 700 kWh', [t({}).s1, t({}).s2, t({}).s3, t({}).accKwh], [150, 250, 500, 700], 1e-9);
  check('load bank sizes: the nameplate step minus the building load, never negative', [t({}).lb1, t({}).lb2, t({}).lb3, t({bl: 400}).lb1, t({bl: 400}).lb3, t({bl: 600}).lb3], [50, 150, 400, 0, 100, 0]);
  check('monthly diesel exercise: 30 min at least 30 % of nameplate; below that the annual 50 % x 30 min and 75 % x 60 min test applies', [t({}).monthly, t({bl: 150}).okMonthly, t({bl: 149}).okMonthly, t({bl: 149}).annualNeeded, t({bl: 150}).annualNeeded, t({}).a1, t({}).a2, t({}).annualH, t({}).annualKwh], [150, true, false, true, false, 250, 375, 1.5, 125 + 375], 1e-9);
  check('annual load bank steps and the building load test duration', [t({}).annualLb1, t({}).annualLb2, t({bl: 300}).annualLb1, t({bl: 300}).annualLb2, t({bd: 1.5}).okBuilding, t({bd: 1.4}).okBuilding], [150, 275, 0, 75, true, false]);
}
{
  const d = o => calc(Object.assign({mode: 2, gt: 0, ts: 1, tre: 5, tsd: 5, cl: 5}, o));
  check('time delays: start 1 s (0.5 s gas turbines), restoration 5 min, shutdown 5 min, cooldown 5 min', [d({ts: 1}).okStart, d({ts: 0.9}).okStart, d({gt: 1, ts: 0.5}).okStart, d({gt: 1, ts: 0.4}).okStart, d({tre: 5}).okRestore, d({tre: 4.9}).okRestore, d({tsd: 5}).okShutdown, d({tsd: 4}).okShutdown, d({cl: 5}).cool, d({cl: 4}).cool], [true, false, true, false, true, false, true, false, true, false]);
}
let tt;
w.renderCalc('nfpa110'); w.calcResult('nfpa110');
tt = txt(w, 'xg_results');
check('the default page shows class 2, type 10, the 160 L fuel and the 🔴 note; only the first group is visible', [tt.includes('فئة 2'), tt.includes('نوع 10'), tt.includes('160 L') || tt.includes('159.6'), tt.includes('🔴'), w.document.getElementById('xg_g0').style.display, w.document.getElementById('xg_g1').style.display], [true, true, true, true, '', 'none']);
set('xg_m', '1'); w.calcResult('nfpa110'); tt = txt(w, 'xg_results');
check('the test page shows the 150 / 250 / 500 kW steps and the 700 kWh', [tt.includes('150 kW'), tt.includes('250 kW'), tt.includes('500 kW'), tt.includes('700 kWh')], [true, true, true, true]);
set('xg_m', '2'); w.calcResult('nfpa110'); tt = txt(w, 'xg_results');
check('the time delay page shows the 5 min rules', [tt.includes('5 min'), tt.includes('✔')], [true, true]);
check('other reference codes open nfpa110 too', others('nfpa110', 'xg_results'), [true, true, true]);
}
// ---------- part 231: NFPA 1142 water supplies for suburban and rural fire fighting (`nfpa1142`: occupancy and construction numbers, exposure, minimum supply and delivery rate) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xtCalc(' + JSON.stringify(o) + ')');
{
  const c = o => calc(Object.assign({oh: 4, cc: 1, dw: 0, v: 1500, exa: 50, exd: 30, av: 20000}, o));
  check('the occupancy numbers are 3, 4, 5, 6 and 7 and the construction numbers 0.5, 0.75, 1.0, 0.75 and 1.5 (Types I to V)', [0, 1, 2, 3, 4].map(i => c({oh: i}).oh).concat([0, 1, 2, 3, 4].map(i => c({cc: i}).cc0)), [3, 4, 5, 6, 7, 0.5, 0.75, 1, 0.75, 1.5]);
  check('1500 m3 = 52950 ft3; OHC 7 and Type II gives 52950 / 7 x 0.75 = 5673 gal = 21473 L with no exposure; the minimum 2000 gal does not govern', [Math.round(c({}).vft), Math.round(c({}).gal0), Math.round(c({}).lit), c({}).floorBind], [52950, 5673, 21473, false]);
  check('a small building is held to the 2000 gal (7570 L) floor: 100 m3 of OHC 7 Type I', [c({v: 100, oh: 4, cc: 0}).floorBind, Math.round(c({v: 100, oh: 4, cc: 0}).lit), Math.round(c({v: 100, oh: 4, cc: 0}).minL)], [true, 7570, 7570]);
  check('exposure: within 15.24 m of another building and 9.3 m2 or larger, or OHC 3 / 4 at any size within that distance; multiplies by 1.5 with a 3000 gal (11355 L) floor', [c({exd: 15.24}).exp, c({exd: 15.3}).exp, c({exa: 9, oh: 2, exd: 10}).exp, c({exa: 9, oh: 4, exd: 10}).exp, c({exa: 9.3, oh: 4, exd: 10}).exp, +(c({exd: 10, oh: 4}).gal1 / c({exd: 30, oh: 4}).gal1).toFixed(6), c({exd: 10, v: 10}).minL], [true, false, false, false, true, 1.5, 11355]);
  check('dwellings are capped at a construction number of 1.0 (Type V 1.5 becomes 1.0)', [c({dw: 1, cc: 4}).cc, c({dw: 0, cc: 4}).cc, c({dw: 1, cc: 0}).cc], [1, 1.5, 0.5]);
  check('severe and high hazard occupancies (numbers 3 and 4) are exposure hazards at any size within 15.24 m', [c({exa: 1, oh: 0, exd: 10}).exp, c({exa: 1, oh: 1, exd: 10}).exp, c({exa: 1, oh: 2, exd: 10}).exp], [true, true, false]);
  check('the rate follows the required supply: 2000 gal -> 250 gpm; 5673 gal -> 500; 12000 gal -> 750; 25000 gal -> 1000', [c({v: 100, cc: 0}).rateGpm, c({}).rateGpm, c({v: 3300}).rateGpm, c({v: 7000}).rateGpm, Math.round(c({}).rateLpm)], [250, 500, 750, 1000, 1893]);
  check('availability: 21474 L is enough (21473.4 required), 21400 L is not', [c({av: 21474}).ok, c({av: 21400}).ok, c({av: 100000}).ok], [true, false, true]);
}
let tt;
w.renderCalc('nfpa1142'); w.calcResult('nfpa1142');
tt = txt(w, 'xt_results');
check('the default page shows the occupancy 7, the construction 0.75, the supply in litres, the 500 gpm rate and the 🔴 note', [tt.includes('0.75'), tt.includes('500 gpm'), tt.includes('✔'), tt.includes('🔴')], [true, true, true, true]);
set('xt_v', '100'); set('xt_oh', '1'); set('xt_cc', '0'); w.calcResult('nfpa1142'); tt = txt(w, 'xt_results');
check('a small low-hazard building shows the 7570 L floor and 250 gpm', [tt.includes('7570 L'), tt.includes('250 gpm')], [true, true]);
set('xt_ed', '10'); w.calcResult('nfpa1142'); tt = txt(w, 'xt_results');
check('an exposure hazard shows the 11355 L floor', [tt.includes('11355 L'), tt.includes('يوجد')], [true, true]);
check('other reference codes open nfpa1142 too', others('nfpa1142', 'xt_results'), [true, true, true]);
}
// ---------- part 232: NFPA 70E-2015 electrical safety (`nfpa70e`: shock approach boundaries for ac and dc, arc flash PPE category and boundary for ac equipment and dc sources, minimum arc rating) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xuCalc(' + JSON.stringify(o) + ')');
{
  const a = o => calc(Object.assign({mode: 0, v: 2, mov: 0, d: 2}, o));
  check('ac 151 to 750 V: limited 1.0 m (3 ft 6 in) fixed or 3.0 m movable, restricted 0.3 m (1 ft 0 in)', [a({}).lab, a({}).labFt, a({mov: 1}).lab, a({}).rab, a({}).rabFt], [1, '3 ft 6 in', 3, 0.3, '1 ft 0 in']);
  check('ac 751 V to 15 kV: 1.5 m and 0.7 m; 765 to 800 kV: 7.2 m and 4.9 m (15 ft 11 in)', [a({v: 3}).lab, a({v: 3}).rab, a({v: 13}).lab, a({v: 13}).rab, a({v: 13}).rabFt], [1.5, 0.7, 7.2, 4.9, '15 ft 11 in']);
  check('ac 50 to 150 V: avoid contact (no restricted distance); below 50 V nothing is specified', [a({v: 1}).avoid, a({v: 1}).lab, a({v: 0}).none, a({v: 0}).lab], [true, 1, true, null]);
  check('a person at 0.5 m from a 480 V fixed part is inside the limited and outside the restricted boundary; at 0.2 m inside both', [a({d: 0.5}).inLab, a({d: 0.5}).inRab, a({d: 0.2}).inRab, a({d: 1.5}).inLab], [true, false, true, false]);
  const d = o => calc(Object.assign({mode: 1, v: 2, mov: 0, d: 2}, o));
  check('dc 301 V to 1 kV: limited 1.0 m, restricted 0.3 m; 1.1 to 5 kV: 1.5 m and 0.5 m (1 ft 5 in); 500.1 to 800 kV: 8.0 m and 5.0 m', [d({}).lab, d({}).rab, d({v: 3}).lab, d({v: 3}).rab, d({v: 3}).rabFt, d({v: 10}).lab, d({v: 10}).rab], [1, 0.3, 1.5, 0.5, '1 ft 5 in', 8, 5]);
  check('dc 100 to 300 V avoids contact; dc 250.1 to 500 kV restricted 3.5 m (11 ft 6 in) and movable limited 6.0 m (20 ft 0 in)', [d({v: 1}).avoid, d({v: 9}).rab, d({v: 9}).rabFt, d({v: 9, mov: 1}).lab, d({v: 9, mov: 1}).labFt], [true, 3.5, '11 ft 6 in', 6, '20 ft 0 in']);
  const f = o => calc(Object.assign({mode: 2, eq: 1, ik: 20, t: 0.03, wd: 455, cl: 0}, o));
  check('panelboards above 240 V to 600 V within 25 kA, 0.03 s and 455 mm: category 2, boundary 900 mm, 8 cal/cm2; panelboards 240 V and below: category 1, 485 mm, 4 cal/cm2', [f({}).within, f({}).cat, f({}).bnd, f({}).rate, f({eq: 0}).cat, f({eq: 0}).bnd, f({eq: 0}).rate], [true, 2, 900, 8, 1, 485, 4]);
  check('a short-circuit current of 30 kA, a clearing time of 0.05 s or a working distance of 400 mm takes the panelboard outside the table', [f({ik: 30}).within, f({ik: 30}).badI, f({t: 0.05}).within, f({t: 0.05}).badT, f({wd: 400}).within, f({wd: 400}).badW, f({ik: 25}).within], [false, true, false, true, false, true, true]);
  check('MCC 600 V class: 65 kA at 0.03 s is category 2 (1.5 m); 40 kA at 0.2 s is category 4 (4.3 m); 50 kA at 0.2 s is outside the table', [f({eq: 2, ik: 60}).cat, f({eq: 2, ik: 60}).bnd, f({eq: 2, ik: 40, t: 0.2}).cat, f({eq: 2, ik: 40, t: 0.2}).bnd, f({eq: 2, ik: 50, t: 0.2}).within, f({eq: 2, ik: 30, t: 0.03}).cat], [2, 1500, 4, 4300, false, 2]);
  check('600 V switchgear and switchboards up to 35 kA and 0.5 s: category 4, 6 m; other 600 V equipment 65 kA: category 2, 1.5 m', [f({eq: 3, ik: 35, t: 0.5}).cat, f({eq: 3, ik: 35, t: 0.5}).bnd, f({eq: 3, ik: 36, t: 0.5}).within, f({eq: 4, ik: 65}).cat, f({eq: 4, ik: 65}).bnd], [4, 6000, false, 2, 1500]);
  check('NEMA E2 starters, metal-clad switchgear and other 1 to 15 kV equipment: category 4, 12 m at 910 mm; 455 mm is too close', [f({eq: 5, ik: 35, t: 0.24, wd: 910}).cat, f({eq: 6, ik: 35, t: 0.24, wd: 910}).bnd, f({eq: 9, ik: 20, t: 0.2, wd: 910}).cat, f({eq: 9, ik: 20, t: 0.2, wd: 455}).within], [4, 12000, 4, false]);
  check('arc-resistant switchgear with the doors closed has no category (N/A); with the doors open it is category 4 and 12 m', [f({eq: 7, ik: 35, t: 0.24, wd: 910}).closed, f({eq: 7, ik: 35, t: 0.24, wd: 910}).cat, f({eq: 8, ik: 35, t: 0.24, wd: 910}).cat, f({eq: 8, ik: 35, t: 0.24, wd: 910}).bnd, f({eq: 8, ik: 35, t: 0.24, wd: 910}).closed], [true, null, 4, 12000, false]);
  check('a current-limiting source of 200 A or less lowers a 600 V category by one but never below 1 and does not apply above 1 kV', [f({cl: 1}).cat, f({cl: 1}).red, f({eq: 0, cl: 1}).cat, f({eq: 3, ik: 35, t: 0.5, cl: 1}).cat, f({eq: 6, ik: 35, t: 0.24, wd: 910, cl: 1}).cat, f({cl: 1}).bnd], [1, true, 1, 3, 4, 900]);
  check('the minimum arc ratings of categories 1 to 4 are 4, 8, 25 and 40 cal/cm2', [1, 2, 3, 4].map(c => J('XU_RATING')[c]), [4, 8, 25, 40]);
  const e = o => calc(Object.assign({mode: 3, dv: 0, ik: 3, dur: 2, wd: 455}, o));
  check('dc 100 V to under 250 V: below 4 kA category 1 (900 mm), 4 to 7 kA category 2 (1.2 m), 7 to 15 kA category 3 (1.8 m), 15 kA is outside', [e({}).cat, e({}).bnd, e({ik: 5}).cat, e({ik: 5}).bnd, e({ik: 10}).cat, e({ik: 10}).bnd, e({ik: 15}).within, e({ik: 4}).cat], [1, 900, 2, 1200, 3, 1800, false, 2]);
  check('dc 250 to 600 V: 1.5 kA category 2; 2 kA category 2; 5 kA category 3; 8 kA category 4 (2.5 m); 10 kA is outside', [e({dv: 1, ik: 1}).cat, e({dv: 1, ik: 2}).cat, e({dv: 1, ik: 5}).cat, e({dv: 1, ik: 8}).cat, e({dv: 1, ik: 8}).bnd, e({dv: 1, ik: 10}).within, e({dv: 1, ik: 1.5}).cat], [1, 2, 3, 4, 2500, false, 2]);
  check('dc: an arc longer than 2 s or a working distance under 455 mm takes the source outside the table', [e({dur: 3}).within, e({dur: 3}).badT, e({wd: 400}).within, e({wd: 400}).badW, e({dur: 2}).within], [false, true, false, true, true]);
}
let tt;
w.renderCalc('nfpa70e'); w.calcResult('nfpa70e');
tt = txt(w, 'xu_results');
check('the default page shows the 1.00 m limited and 0.30 m restricted boundaries and the 🔴 note', [tt.includes('1.00 m'), tt.includes('0.30 m'), tt.includes('3 ft 6 in'), tt.includes('🔴')], [true, true, true, true]);
set('xu_mv', '1'); w.calcResult('nfpa70e'); tt = txt(w, 'xu_results');
check('a movable conductor shows the 3.00 m boundary', [tt.includes('3.00 m'), tt.includes('10 ft 0 in')], [true, true]);
set('xu_m', '2'); w.calcResult('nfpa70e'); tt = txt(w, 'xu_results');
check('the arc flash mode shows category 2, the 0.90 m boundary and the 8 cal/cm2 rating, and the groups switch', [tt.includes('فئة 2'), tt.includes('0.90 m'), tt.includes('8 cal/cm²'), doc.getElementById('xu_g2').style.display === '', doc.getElementById('xu_g0').style.display === 'none'], [true, true, true, true, true]);
set('xu_ik', '40'); w.calcResult('nfpa70e'); tt = txt(w, 'xu_results');
check('40 kA leaves the table and asks for an incident energy analysis', [tt.includes('تحليل طاقة القوس'), tt.includes('✘') || tt.includes('خارج المعايير')], [true, true]);
set('xu_m', '3'); w.calcResult('nfpa70e'); tt = txt(w, 'xu_results');
check('the dc mode defaults (250 to 600 V, 5 kA, 2 s, 455 mm) give category 3, the 1.80 m boundary and 25 cal/cm2', [tt.includes('فئة 3'), tt.includes('1.80 m'), tt.includes('25 cal/cm²')], [true, true, true]);
check('other reference codes open nfpa70e too', others('nfpa70e', 'xu_results'), [true, true, true]);
}
// ---------- part 233: NFPA 30-2015 aboveground tanks (`nfpa30t`: distance to property lines and buildings, shell-to-shell spacing, dike capacity and subdivision) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xvCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.02);
{
  const a = o => calc(Object.assign({mode: 0, cat: 0, r0: 6, r1: 0, r2: 0, r3: 0, cap: 200, dia: 8, half: 0}, o));
  check('Table 22.4.1.1(b): 275 gal 5/5 ft; 751 to 12000 gal 15/5; 52834 gal (200 m3) 50/15; 100001 to 500000 gal 80/25; 2.64 million gal 165/55; over 3 million gal 175/60', [a({cap: 0.5}).tP, a({cap: 0.5}).tB, a({cap: 5}).tP, a({cap: 5}).tB, a({}).tP, a({}).tB, a({cap: 1000}).tP, a({cap: 1000}).tB, a({cap: 10000}).tP, a({cap: 10000}).tB, a({cap: 20000}).tP, a({cap: 20000}).tB], [5, 5, 15, 5, 50, 15, 80, 25, 165, 55, 175, 60]);
  check('horizontal or vertical tank with relief to 2.5 psi: protection for exposures gives the table value, no protection twice the property-line value, inerting half', [a({}).pFt, a({}).bFt, a({r0: 7}).pFt, a({r0: 7}).bFt, a({r0: 5}).pFt, a({r0: 5}).bFt, a({r0: 8}).pFt], [50, 15, 100, 15, 25, 7.5, 25]);
  check('floating roof 8 m (26.25 ft): exposures protection half a diameter but not under 5 ft; no protection one diameter; the building column is a sixth of the diameter with a 5 ft minimum', [near(a({r0: 0}).pFt, 13.12), a({r0: 0}).bFt, near(a({r0: 1}).pFt, 26.25), a({r0: 1}).bFt], [true, 5, true, 5]);
  check('weak roof-to-shell seam 8 m: foam half a diameter, exposures one diameter (a third for the building), none two diameters', [near(a({r0: 2}).pFt, 13.12), near(a({r0: 3}).pFt, 26.25), near(a({r0: 3}).bFt, 8.75), near(a({r0: 4}).pFt, 52.49), near(a({r0: 4}).bFt, 8.75)], [true, true, true, true, true]);
  check('a 60 m tank: floating roof without protection is capped at 175 ft; weak seam without protection at 350 ft; the foam row does not apply over 45 m', [a({dia: 60, r0: 1}).pFt, a({dia: 60, r0: 1}).capP, a({dia: 60, r0: 4}).pFt, a({dia: 60, r0: 2}).warn, a({dia: 30, r0: 2}).warn], [175, true, 350, 'foam', '']);
  check('a Class IIIA vertical weak-seam tank away from Class I and II dikes takes half the distances', [near(a({r0: 3, half: 1}).pFt, 13.12), a({r0: 3, half: 1}).bFt, a({r0: 6, half: 1}).pFt], [true, 5, 50]);
  check('the distance in metres is the feet times 0.3048', [near(a({}).pM, 15.24), near(a({}).bM, 4.572)], [true, true]);
  check('pressure above 2.5 psi: with exposure protection 1.5 times the table value but at least 25 ft; without, 3 times and at least 50 ft for the property line', [a({cat: 1, r1: 0}).pFt, a({cat: 1, r1: 0}).bFt, a({cat: 1, r1: 1}).pFt, a({cat: 1, r1: 1}).bFt, a({cat: 1, r1: 0, cap: 0.5}).pFt, a({cat: 1, r1: 1, cap: 0.5}).pFt], [75, 25, 150, 25, 25, 50]);
  check('boil-over liquids, 8 m: floating roof without protection one diameter; fixed roof with foam a diameter and a third; with exposures 2 diameters and two thirds; none 4 diameters (capped at 350 ft)', [near(a({cat: 2, r2: 1}).pFt, 26.25), near(a({cat: 2, r2: 2}).pFt, 26.25), near(a({cat: 2, r2: 2}).bFt, 8.75), near(a({cat: 2, r2: 3}).pFt, 52.49), near(a({cat: 2, r2: 3}).bFt, 17.5), near(a({cat: 2, r2: 4}).pFt, 104.99), near(a({cat: 2, r2: 4, dia: 40}).pFt, 350, 0.01)], [true, true, true, true, true, true, true]);
  check('a fixed roof over 45 m storing boil-over liquid without inerting is flagged; a floating roof is not', [a({cat: 2, r2: 4, dia: 50}).warn, a({cat: 2, r2: 3, dia: 50}).warn, a({cat: 2, r2: 1, dia: 50}).warn, a({cat: 2, r2: 4, dia: 20}).warn], ['fixed150', 'fixed150', '', '']);
  check('unstable liquid at 200 m3 (50 ft table value): venting up to 2.5 psi protected 50/25, exposures 125/50, none 250/100; above 2.5 psi protected 100/50, exposures 200/100, none 400/150', [0, 1, 2, 3, 4, 5].map(i => a({cat: 3, r3: i}).pFt).concat([0, 1, 2, 3, 4, 5].map(i => a({cat: 3, r3: i}).bFt)), [50, 125, 250, 100, 200, 400, 25, 50, 100, 50, 100, 150]);
  check('unstable liquid in a small tank still keeps the minimum distances: 5 m3 (15 ft) none up to 2.5 psi needs 100 ft; protected needs 25 ft', [a({cat: 3, r3: 2, cap: 5}).pFt, a({cat: 3, r3: 0, cap: 5}).pFt, a({cat: 3, r3: 5, cap: 5}).pFt], [100, 25, 150]);
  check('Class IIIB: 40 m3 5/5 ft; 200 m3 15/10; 150 m3 10/10; 500 m3 15/15', [a({cat: 4, cap: 40}).pFt, a({cat: 4, cap: 40}).bFt, a({cat: 4, cap: 200}).pFt, a({cat: 4, cap: 200}).bFt, a({cat: 4, cap: 150}).pFt, a({cat: 4, cap: 150}).bFt, a({cat: 4, cap: 500}).pFt, a({cat: 4, cap: 500}).bFt], [5, 5, 15, 10, 10, 10, 15, 15]);
  const s = o => calc(Object.assign({mode: 1, ss: 1, d1: 8, d2: 8, imp: 1, dike: 0}, o));
  check('shell spacing: a sixth of the sum of the diameters (8 m + 8 m gives 2.67 m) but at least 3 ft (0.91 m) for small tanks', [near(s({}).sM, 2.667), near(s({d1: 2, d2: 2}).sM, 0.914, 0.001), s({d1: 2, d2: 2}).sFt, s({ss: 0}).sFt === s({}).sFt], [true, true, 3, true]);
  check('tanks over 45 m: floating roof 1/6 remote impounding or 1/4 diking; Class I or II 1/4 or 1/3; Class IIIA 1/6 or 1/4', [near(s({ss: 0, d1: 60, d2: 60, imp: 0}).sM, 20, 0.05), near(s({ss: 0, d1: 60, d2: 60, imp: 1}).sM, 30, 0.05), near(s({d1: 60, d2: 60, imp: 0}).sM, 30, 0.05), near(s({d1: 60, d2: 60, imp: 1}).sM, 40, 0.05), near(s({ss: 2, d1: 60, d2: 60, imp: 0}).sM, 20, 0.05), near(s({ss: 2, d1: 60, d2: 60, imp: 1}).sM, 30, 0.05)], [true, true, true, true, true, true]);
  check('Class IIIB tanks need at most 3 ft (0.9 m) unless they stand in a Class I or II dike, where the Class IIIA rule applies; unstable liquid needs half the sum of the diameters', [s({ss: 3, d1: 30, d2: 30}).sFt, near(s({ss: 3, d1: 30, d2: 30, dike: 1}).sM, 60 / 6), near(s({ss: 4}).sM, 8)], [3, true, true]);
  const d = o => calc(Object.assign({mode: 2, v1: 500, vo: 100, a: 900, h: 1.2, cls1: 1, wk: 0, vg: 1200}, o));
  check('dike 900 m2 x 1.2 m less 100 m3 of other tanks holds 980 m3, enough for a 500 m3 tank; the height needed is 0.667 m', [near(d({}).net, 980, 1e-6), d({}).okCap, near(d({}).hNeed, 0.667, 0.001), d({h: 0.5}).okCap], [true, true, true, false]);
  check('over 1.8 m the dike needs access; over 3.6 m with Class I liquid it needs remote valve operation; earthen walls from 0.9 m have a 0.6 m top', [d({}).access, d({h: 2}).access, d({h: 4}).valve, d({h: 4, cls1: 0}).valve, d({h: 0.8}).earth, d({}).earth], [false, true, true, false, false, true]);
  check('subdivision: a tank over 380 m3 (100,000 gal) needs one, over 1590 m3 for weak seam or floating roof; groups of at most 570 m3 or 2385 m3', [d({}).subTank, d({wk: 1}).subTank, d({}).groups, d({wk: 1}).groups, d({vg: 570}).groups, d({vg: 571}).groups, d({wk: 1, vg: 2386}).groups], [true, false, 3, 1, 1, 2, 2]);
}
let tt;
w.renderCalc('nfpa30t'); w.calcResult('nfpa30t');
tt = txt(w, 'xv_results');
check('the default page shows 15.2 m to the property line, 4.6 m to the building, the 15 ft table value and the 🔴 note', [tt.includes('15.2 m'), tt.includes('4.6 m'), tt.includes('50 ft / 15 ft'), tt.includes('🔴')], [true, true, true, true]);
set('xv_c', '1'); w.calcResult('nfpa30t'); tt = txt(w, 'xv_results');
check('pressure above 2.5 psi shows 150 ft (3 times the table value) for the unprotected row and switches the selector', [tt.includes('150 ft'), tt.includes('25 ft'), doc.getElementById('xv_s1').style.display === '', doc.getElementById('xv_s0').style.display === 'none'], [true, true, true, true]);
set('xv_m', '1'); w.calcResult('nfpa30t'); tt = txt(w, 'xv_results');
check('the spacing mode shows 2.67 m, the 6 m LPG separation and switches the groups', [tt.includes('2.67 m'), tt.includes('6.0 m'), doc.getElementById('xv_g1').style.display === '', doc.getElementById('xv_g0').style.display === 'none'], [true, true, true, true]);
set('xv_m', '2'); w.calcResult('nfpa30t'); tt = txt(w, 'xv_results');
check('the dike mode shows 980 m3, 3 groups and the subdivision need', [tt.includes('980 m³'), tt.includes('يلزم تقسيم للخزان'), tt.includes('✔')], [true, true, true]);
check('other reference codes open nfpa30t too', others('nfpa30t', 'xv_results'), [true, true, true]);
}
// ---------- part 234: NFPA 30-2015 liquids in buildings (`nfpa30m`: maximum allowable quantities per control area, floor percentages, liquid storage rooms and warehouses) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xyCalc(' + JSON.stringify(o) + ')');
{
  const a = o => calc(Object.assign({mode: 0, cl: 1, occ: 0, spr: 1, cab: 0, p16: 0, hc: 0, fl: 5, q: 300}, o));
  check('Table 9.6.1 base quantities in litres: IA 115, IB and IC 460, IA/IB/IC combined 460, II 460, IIIA 1265, IIIB 50600', [0, 1, 2, 3, 4, 5].map(i => a({cl: i, spr: 0, p16: 0}).base), [115, 460, 460, 460, 1265, 50600]);
  check('the increases: sprinklers double, cabinets or safety cans double, both together multiply to four (460 L -> 920 L -> 1840 L)', [a({spr: 0}).maq, a({}).maq, a({spr: 0, cab: 1}).maq, a({cab: 1}).maq, a({cab: 1}).mult], [460, 920, 920, 1840, 4]);
  check('Class IIIB has no limit in a fully sprinklered building protected per 66.16; unsprinklered it is 50600 L', [a({cl: 5, p16: 1}).unlimited, a({cl: 5, p16: 0}).unlimited, a({cl: 5, spr: 0, p16: 1}).unlimited, a({cl: 5, spr: 0}).maq], [true, false, false, 50600]);
  check('Table 9.7.2: first floor 100 % and 4 control areas with 1 h barriers; third floor 50 % and 2 areas; fourth to sixth 12.5 % and 2 areas with 2 h; over the ninth 5 % and 1 area', [5, 3, 2, 0].map(i => a({fl: i}).pct).concat([5, 3, 2, 0].map(i => a({fl: i}).areas), [5, 3, 2, 0].map(i => a({fl: i}).barrier)), [100, 50, 12.5, 5, 4, 2, 2, 1, 1, 1, 2, 2]);
  check('below grade: the first level 75 % in 3 areas, the second 50 % in 2 areas, lower is not permitted', [a({fl: 6}).pct, a({fl: 6}).areas, a({fl: 7}).pct, a({fl: 7}).areas, a({fl: 8}).np, a({fl: 8}).ok], [75, 3, 50, 2, true, false]);
  check('IB and IC at 300 L on the first floor: allowed 920 L and compliant; on the fourth floor 12.5 % of 920 is 115 L so 300 L exceeds by 185 L', [a({}).maqFloor, a({}).ok, a({fl: 2}).maqFloor, a({fl: 2}).ok, a({fl: 2}).over, a({}).total], [920, true, 115, false, 185, 3680]);
  check('special occupancies: 38 L for Class I and II, 227 L for IIIA, 454 L for IIIB; IIIB doubles in a sprinklered health care or educational building', [a({occ: 1, cl: 1}).lim, a({occ: 1, cl: 3}).lim, a({occ: 1, cl: 4}).lim, a({occ: 1, cl: 5}).lim, a({occ: 1, cl: 5, hc: 1}).lim, a({occ: 1, cl: 5, hc: 1, spr: 0}).lim], [38, 38, 227, 454, 908, 454]);
  check('special occupancy: 300 L is over the 38 L limit but allowed in storage cabinets up to 680 L; 700 L is not; 30 L needs no cabinet', [a({occ: 1, q: 300}).ok, a({occ: 1, q: 300, cab: 1}).ok, a({occ: 1, q: 300, cab: 1}).cabOk, a({occ: 1, q: 700, cab: 1}).ok, a({occ: 1, q: 30}).ok, a({occ: 1, q: 30, cab: 1}).cabOk], [false, true, true, false, true, false]);
  const s = o => calc(Object.assign({mode: 1, rt: 1, ex: 5, only3b: 0, prot: 0, att: 0, da: 50, cont: 0.2}, o));
  check('Table 9.9.1: rooms up to 150 ft2 have 1 h walls with 3/4 h doors; 150 to 500 ft2 have 2 h walls with 1.5 h doors; warehouses have 4 h fire walls with 3 h doors', [s({rt: 0}).wall, s({rt: 0}).door, s({}).wall, s({}).door, s({rt: 2}).wall, s({rt: 2}).door], [1, 0.75, 2, 1.5, 4, 3]);
  check('warehouse exterior walls: 4 h within 3 m, 2 h from 3 to 15 m, none beyond; IIIB-only or protected warehouses may drop to 2 h walls and 1.5 h doors; an attached one needs a door on each side', [s({rt: 2, ex: 2}).ext, s({rt: 2, ex: 5}).ext, s({rt: 2, ex: 20}).ext, s({rt: 2, only3b: 1}).wallRed, s({rt: 2, prot: 1}).doorRed, s({rt: 2}).reduce, s({rt: 2, att: 1}).attached, s({rt: 1, att: 1}).attached], [4, 2, 0, 2, 1.5, false, true, false]);
  check('dispensing: a storage area over 93 m2 needs a separated dispensing area; a container over 38 L needs spill control', [s({da: 93}).dispOk, s({da: 94}).dispOk, s({cont: 0.2}).curb, s({cont: 0.03}).curb], [true, false, true, false]);
}
let tt;
w.renderCalc('nfpa30m'); w.calcResult('nfpa30m');
tt = txt(w, 'xy_results');
check('the default page shows 920 L, the 100 % first floor, 4 control areas and the 🔴 note', [tt.includes('920 L'), tt.includes('100.0 %'), tt.includes('3680 L'), tt.includes('✔'), tt.includes('🔴')], [true, true, true, true, true]);
set('xy_fl', '0'); w.calcResult('nfpa30m'); tt = txt(w, 'xy_results');
check('a floor above the ninth gives 46 L and the over-quantity message', [tt.includes('46 L'), tt.includes('إشغال المستوى 2 أو 3'), tt.includes('✘')], [true, true, true]);
set('xy_oc', '1'); w.calcResult('nfpa30m'); tt = txt(w, 'xy_results');
check('the special occupancy shows the 38 L limit', [tt.includes('38 L'), tt.includes('الجدول 9.6.2.1')], [true, true]);
set('xy_m', '1'); w.calcResult('nfpa30m'); tt = txt(w, 'xy_results');
check('the storage mode shows the 2 h wall, the 1.5 h door and switches the groups', [tt.includes('2 h'), tt.includes('1.5 h'), tt.includes('40:B'), doc.getElementById('xy_g1').style.display === '', doc.getElementById('xy_g0').style.display === 'none'], [true, true, true, true, true]);
check('other reference codes open nfpa30m too', others('nfpa30m', 'xy_results'), [true, true, true]);
}
// ---------- part 235: NFPA 45-2015 laboratories using chemicals (`nfpa45`: laboratory unit class, fire separation, stories and area (Table 5.1.1), second means of access, maximum liquid quantities (Table 9.1.1)) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xlbCalc(' + JSON.stringify(o) + ')');
{
  const a = o => calc(Object.assign({mode: 0, cl: 1, st: 2, below: 0, area: 120, edu: 0, wa: 60}, o));
  check('Class A units: 2 h separation, stories 1 to 3, not below grade, not over 929 m2', [a({cl: 0}).sepTable, a({cl: 0, st: 3}).okStory, a({cl: 0, st: 4}).okStory, a({cl: 0, below: 1}).okStory, a({cl: 0, area: 929}).okArea, a({cl: 0, area: 930}).okArea, a({cl: 0, area: 930}).ok], [2, true, false, false, true, false, false]);
  check('Class B: 1 h in stories 1 to 3 and one below grade, 2 h in stories 4 to 6, nothing above the sixth; not over 929 m2', [a({st: 3}).sepTable, a({st: 4}).sepTable, a({st: 6}).okStory, a({st: 7}).okStory, a({below: 1, st: 1}).sepTable, a({below: 1, st: 1}).okStory, a({below: 1, st: 2}).okStory, a({area: 1000}).ok], [1, 2, true, false, 1, true, false, false]);
  check('Class C: no separation in stories 1 to 3 and two below grade, 1 h in stories 4 to 6, 2 h above the sixth, any area', [a({cl: 2, st: 3}).sepTable, a({cl: 2, st: 5}).sepTable, a({cl: 2, st: 8}).sepTable, a({cl: 2, below: 1, st: 2}).okStory, a({cl: 2, below: 1, st: 3}).okStory, a({cl: 2, below: 1, st: 2}).sepTable, a({cl: 2, area: 5000}).okArea], [0, 1, 2, true, false, 0, true]);
  check('Class D: no separation and no limit; an educational laboratory needs at least 1 h whatever the table says', [a({cl: 3, st: 12}).sepTable, a({cl: 3, st: 12}).ok, a({cl: 3, edu: 1}).sep, a({cl: 0, edu: 1}).sep, a({cl: 2, st: 5, edu: 1}).sep, a({cl: 3}).maxArea], [0, true, 1, 2, 1, null]);
  check('a second means of access is needed beyond 46.5 m2 in Class A and 93 m2 in Classes B, C and D', [a({cl: 0, wa: 46.5}).second, a({cl: 0, wa: 47}).second, a({wa: 93}).second, a({wa: 94}).second, a({cl: 3, wa: 100}).second], [false, true, false, true, true]);
  const q = o => calc(Object.assign({mode: 1, cl: 0, g: 0, st: 1, below: 0, area: 93, open: 0, use: 100, stock: 100}, o));
  check('Class A Class I liquids in 93 m2 (10 x 9.3): 380 L in use and 760 L in use and storage; the unit caps are 1820 L; 930 m2 reaches the caps', [Math.round(q({}).useMax), Math.round(q({}).storeMax), q({area: 930}).useMax, q({area: 930}).storeMax], [380, 760, 1820, 1820]);
  check('Class A combined Class I, II and IIIA: 76 L and 150 L per 9.3 m2 with caps of 3028 L and 6060 L', [Math.round(q({g: 1}).useMax), Math.round(q({g: 1}).storeMax), q({g: 1, area: 930}).useMax, q({g: 1, area: 930}).storeMax], [760, 1500, 3028, 6060]);
  check('Classes B, C and D Class I: 20, 7.5 and 4 L in use and 38, 15 and 7.5 L in use and storage per 9.3 m2 (caps 1136, 570, 284 and 1820, 1136, 570)', [1, 2, 3].map(c => q({cl: c, area: 9.3}).useMax).concat([1, 2, 3].map(c => q({cl: c, area: 9.3}).storeMax), [1, 2, 3].map(c => q({cl: c, area: 9300}).useMax), [1, 2, 3].map(c => q({cl: c, area: 9300}).storeMax)), [20, 7.5, 4, 38, 15, 7.5, 1136, 570, 284, 1820, 1136, 570]);
  check('floor reductions: B above the third floor 50 %; C and D 25 % on floors 4 to 6 and 50 % above the sixth; none below grade or for A', [q({cl: 1, st: 3, area: 9.3}).f, q({cl: 1, st: 4, area: 9.3}).f, q({cl: 2, st: 3}).f, q({cl: 2, st: 4}).f, q({cl: 3, st: 6}).f, q({cl: 3, st: 7}).f, q({cl: 2, st: 8, below: 1}).f, q({cl: 0, st: 9}).f], [1, 0.5, 1, 0.75, 0.75, 0.5, 1, 1]);
  check('open systems limit the quantity in use to 10 % of the allowance; the totals are compared with the allowances', [Math.round(q({open: 1}).useLim), Math.round(q({}).useLim), q({open: 1, use: 38}).okUse, q({open: 1, use: 39}).okUse, q({use: 380, stock: 380}).okStore, q({use: 380, stock: 381}).okStore], [38, 380, true, false, true, false]);
}
let tt;
w.renderCalc('nfpa45'); w.calcResult('nfpa45');
tt = txt(w, 'xlb_results');
check('the default page (Class B, second floor, 120 m2) shows 1 h, the permitted result and the 🔴 note', [tt.includes('1 h'), tt.includes('مسموح'), tt.includes('✔'), tt.includes('🔴')], [true, true, true, true]);
set('xlb_c', '0'); set('xlb_bl', '1'); w.calcResult('nfpa45'); tt = txt(w, 'xlb_results');
check('a Class A unit below grade is refused', [tt.includes('غير مسموح'), tt.includes('✘')], [true, true]);
set('xlb_m', '1'); set('xlb_bl', '0'); set('xlb_c', '1'); w.calcResult('nfpa45'); tt = txt(w, 'xlb_results');
check('the quantity mode shows 258 L in use and 490 L in use and storage and switches the groups', [tt.includes('258 L'), tt.includes('490 L'), doc.getElementById('xlb_g1').style.display === '', doc.getElementById('xlb_g0').style.display === 'none'], [true, true, true, true]);
check('other reference codes open nfpa45 too', others('nfpa45', 'xlb_results'), [true, true, true]);
}
// ---------- part 236: NFPA 409-2016 aircraft hangars (`nfpa409`: hangar group, construction, clear space, foam-water and sprinkler protection flows and quantities) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xafCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.01);
{
  const a = o => calc(Object.assign({mode: 0, door: 7, tail: 6, area: 1800, t: 1, mem: 0, floors: 1, red: 0, glass: 20}, o));
  check('group III for a door of 8.5 m or less and an area within the Type II (222) limit of 1858 m2; over it, group II up to 3716 m2', [a({}).group, a({area: 1858}).group, a({area: 1859}).group, a({area: 3716}).group, a({area: 3717}).group], [3, 3, 2, 2, 1]);
  check('group I for a door over 8.5 m, a tail over 8.5 m or an area over 3716 m2; a membrane hangar is group IV; more than one story makes group II', [a({door: 9}).group, a({door: 8.5}).group, a({tail: 9}).group, a({area: 4000}).group, a({mem: 1, door: 9}).group, a({floors: 2}).group], [1, 3, 1, 1, 4, 2]);
  check('Table 4.1.3 maxima in m2: I 2787, II (222) 1858, II (111) and III (211) and IV 1394, II (000) and III (200) 1115, V (111) 743, V (000) 465', [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => a({t: i}).max3), [2787, 1858, 1394, 1394, 1394, 1115, 1115, 743, 465]);
  check('the area limit follows the type: Type V (000) 466 m2 is group II, 465 m2 is group III; Type I 2787 m2 is group III, 2788 m2 group II', [a({t: 8, area: 465}).group, a({t: 8, area: 466}).group, a({t: 0, area: 2787}).group, a({t: 0, area: 2788}).group], [3, 2, 3, 2]);
  check('group I hangars must be Type I or Type II; types III, IV and V are refused; other groups are not constrained', [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => a({door: 9, t: i}).constrOk), [true, true, true, false, false, true, false, false, false]);
  check('clear space: 15 m (50 ft) for Types I to IV and 23 m (75 ft) for Type V', [a({t: 0}).clear, a({t: 6}).clear, a({t: 7}).clear, a({t: 8}).clear], [15, 15, 23, 23]);
  check('reductions: 3 h walls need no distance; a 2 h wall allows 7.5 m (25 ft); the full 2 h package with glass up to 25 % allows 7.5 m but 30 % glass keeps the full distance', [a({red: 1}).clear, a({red: 2}).clear, a({red: 3}).clear, a({red: 3, glass: 30}).clear, a({red: 3, glass: 30}).glassBad, a({red: 3, glass: 25}).glassBad, a({red: 3, glass: 30, t: 7}).clear], [0, 7.5, 7.5, 15, true, false, 23]);
  const f = o => calc(Object.assign({mode: 1, grp: 1, sys: 0, area: 1200, foam: 0, pct: 3, asp: 1, supp: 0, wing: 150, ext: 0}, o));
  check('group I deluge: 8.1 L/min/m2 with air aspirating devices (9720 L/min for 1200 m2), 6.5 L/min/m2 with AFFF non-aspirating (7800 L/min)', [Math.round(f({}).waterQ), f({}).foamRate, Math.round(f({asp: 0}).waterQ), f({asp: 0}).foamRate], [9720, 8.1, 7800, 6.5]);
  check('deluge water supply lasts 60 min, 45 min with supplementary protection; one deluge system per 1394 m2 (3000 m2 needs 3)', [f({}).waterDur, f({supp: 1}).waterDur, f({}).nDeluge, f({area: 3000}).nDeluge, f({area: 1394}).nDeluge, f({area: 1395}).nDeluge], [60, 45, 1, 3, 1, 2]);
  check('foam concentrate for 10 min: 9720 L/min x 10 x 3 % = 2916 L, with an equal reserve; the water volume for 60 min is 583 m3', [Math.round(f({}).conc), Math.round(f({}).concReserve), Math.round(f({}).waterVol), Math.round(f({pct: 6}).conc)], [2916, 2916, 583, 5832]);
  check('supplementary protection is required for a wing area over 279 m2 only', [f({wing: 280}).suppReq, f({wing: 279}).suppReq, f({wing: 150}).suppReq], [true, false, false]);
  check('group I closed-head sprinklers with low-level foam: 6.9 L/min/m2 over 1394 m2 for 45 min plus AFFF 4.1 or protein 6.5 L/min/m2 over the whole floor', [Math.round(f({sys: 1}).sprQ), f({sys: 1}).sprDur, Math.round(f({sys: 1}).foamQ), f({sys: 1, foam: 1}).foamQ, Math.round(f({sys: 1}).waterQ), f({sys: 1}).waterDur], [9619, 45, 4920, 7800, 14539, 45]);
  check('group I high-expansion foam needs 0.9 m3/min/m2 (1080 m3/min for 1200 m2) and 12 min of concentrate; the maximum sprinkler system is 4831 m2', [Math.round(f({sys: 2}).hxQ), f({sys: 2}).foamQ, f({sys: 2}).foamDur, f({sys: 1, area: 5000}).sysTooBig, f({sys: 0, area: 5000}).sysTooBig, f({sys: 1, area: 4831}).sysTooBig], [1080, 0, 12, true, false, false]);
  const g = o => calc(Object.assign({mode: 1, grp: 2, sys: 0, area: 1200, foam: 0, pct: 3, asp: 1, supp: 0, wing: 150, ext: 0}, o));
  check('group II: deluge with air-aspirating devices reduces to 6.5 L/min/m2; closed-head sprinklers 6.9 L/min/m2 over 464.5 m2 for 30 min with foam solution water for 20 min', [g({}).foamRate, Math.round(g({}).waterQ), Math.round(g({sys: 1}).sprQ), g({sys: 1}).sprDur, g({sys: 1}).foamWaterDur, Math.round(g({sys: 1}).waterQ)], [6.5, 7800, 3205, 30, 20, 8125]);
  check('group II high-expansion foam: water for 24 min; closed-head foam-water (AFFF) 6.5 L/min/m2 for 30 min in zones of 1393 m2', [g({sys: 2}).hxWaterDur, Math.round(g({sys: 2}).hxQ), g({sys: 3}).foamQ, g({sys: 3}).waterDur, g({sys: 3}).nZones, g({sys: 3, area: 3000}).nZones], [24, 1080, 7800, 30, 1, 3]);
  check('hand hose: two lines at 227 L/min for 20 min need 454 L/min and 272 L of 3 % concentrate; the exterior hose allowance 1893 L/min is added when the supply is shared', [f({}).hoseQ, Math.round(f({}).hoseConc), Math.round(f({}).totalQ), Math.round(f({ext: 1}).totalQ), Math.round(f({}).ext)], [454, 272, 10174, 12067, 0]);
}
let tt;
w.renderCalc('nfpa409'); w.calcResult('nfpa409');
tt = txt(w, 'xaf_results');
check('the default page shows group II (2000 m2 over the 1858 m2 Type II limit), 15.0 m clear space and the 🔴 note', [tt.includes('المجموعة II'), tt.includes('15.0 m'), tt.includes('2 h / 1 h'), tt.includes('🔴')], [true, true, true, true]);
set('xaf_d', '9'); w.calcResult('nfpa409'); tt = txt(w, 'xaf_results');
check('a 9 m door makes group I and Type II (222) is accepted', [tt.includes('ارتفاع باب الطائرات أكثر من 8.5 m'), tt.includes('مقبول')], [true, true]);
set('xaf_t', '7'); w.calcResult('nfpa409'); tt = txt(w, 'xaf_results');
check('Type V under group I is refused and the distance becomes 23.0 m', [tt.includes('غير مقبول'), tt.includes('23.0 m')], [true, true]);
set('xaf_m', '1'); w.calcResult('nfpa409'); tt = txt(w, 'xaf_results');
check('the protection mode shows 9720 L/min, the 2916 L of concentrate and switches the groups', [tt.includes('9720 L/min'), tt.includes('2916 L'), doc.getElementById('xaf_g1').style.display === '', doc.getElementById('xaf_g0').style.display === 'none'], [true, true, true, true]);
set('xaf_gr', '1'); w.calcResult('nfpa409'); tt = txt(w, 'xaf_results');
check('group II shows the 6.5 L/min/m2 reduced rate and its selector', [tt.includes('6.5 L/min/m²'), doc.getElementById('xaf_s2').style.display === '', doc.getElementById('xaf_s1').style.display === 'none'], [true, true, true]);
check('other reference codes open nfpa409 too', others('nfpa409', 'xaf_results'), [true, true, true]);
}
// ---------- part 237: NFPA 502-2014 road tunnels (`nfpa502`: tunnel category and provisions by length, critical velocity by iteration with the design fire sizes) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xtnCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-6);
{
  check('tunnel categories: X below 90 m, A from 90 m, B from 240 m only when the farthest point from safety exceeds 120 m, C from 300 m, D from 1000 m', [[89, 0], [90, 0], [239, 200], [240, 100], [240, 130], [299, 130], [300, 0], [999, 0], [1000, 0]].map(p => J('xtnCat(' + p[0] + ',' + p[1] + ')')), [0, 1, 1, 1, 2, 2, 3, 3, 4]);
  const a = o => calc(Object.assign({mode: 0, L: 600, dmax: 300, sup24: 1}, o));
  check('a 600 m tunnel is category C: standpipe, alarm boxes every 90 m (7), extinguishers (7), hose connections every 85 m (8), one intermediate exit for 300 m spacing, 24 direction signs, 40 detection zones', [a({}).cat, a({}).standpipe, a({}).nBox, a({}).nExt, a({}).nHose, a({}).nExit, a({}).nSign, a({}).nZone], [3, true, 7, 7, 8, 1, 24, 40]);
  check('category C and D make fixed water-based systems conditionally mandatory; below 1000 m emergency ventilation is optional, at 1000 m and over it is required', [a({}).fixed, a({L: 200, dmax: 100}).fixed, a({L: 999}).vent, a({L: 1000}).vent, a({L: 1000}).cat, a({L: 999}).ventOpt], [true, false, false, true, 4, true]);
  check('detection is required in a category B, C or D tunnel without 24-hour supervision; a category A tunnel needs a standpipe but no alarm boxes or exits', [a({sup24: 0}).detect, a({sup24: 1}).detect, a({L: 150, dmax: 70, sup24: 0}).detect, a({L: 150, dmax: 70}).standpipe, a({L: 150, dmax: 70}).alarmBox, a({L: 150, dmax: 70}).nExit, a({L: 50, dmax: 25}).standpipe], [true, false, false, true, false, 0, false]);
  check('traffic is stopped by full controls beyond 240 m; the exit spacing is 300 m and the sign spacing 25 m', [a({L: 241}).trafficFull, a({L: 240, dmax: 130}).trafficFull, a({}).exitSpace, a({L: 200, dmax: 130}).exitSpace], [true, false, 300, 200]);
  const v = o => calc(Object.assign({mode: 1, f: 3, q: 20, h: 5, a: 60, t: 20, kg: 1}, o));
  const ref = (Q, H, A, T, Kg) => { const TK = T + 273.15, rho = 353 / TK; let Vc = 3; for (let i = 0; i < 500; i++) { const Tf = Q * 1000 / (rho * 1.005 * A * Vc) + TK; Vc = 0.5 * Vc + 0.5 * 0.606 * Kg * Math.pow(9.81 * H * Q * 1000 / (rho * 1.005 * A * Tf), 1 / 3); } return Vc; };
  check('the design fires: car 5 MW, several cars 15, bus 30, heavy goods vehicle 150, flammable tanker 300; a typed value is used for the last option', [0, 1, 2, 3, 4].map(i => v({f: i}).q), [5, 15, 30, 150, 300]);
  check('the heavy goods vehicle (150 MW, 5 m, 60 m2, 20 C) gives about 2.9 m/s and matches the independent iteration', [near(v({}).vc, ref(150, 5, 60, 20, 1), 1e-4), v({}).vc > 2.7 && v({}).vc < 3.1], [true, true]);
  check('both equations hold at the solution: Tf = Q/(rho Cp A Vc) + T and Vc = K1 Kg (g H Q / (rho Cp A Tf))^(1/3)', [near(v({}).check1, v({}).tf, 1e-6), near(v({}).check2, v({}).vc, 1e-6), near(v({f: 5, q: 30}).vc, ref(30, 5, 60, 20, 1), 1e-4), v({f: 5, q: 30}).name], [true, true, true, 'معدل إطلاق حرارة مدخل']);
  check('the critical velocity rises with the fire, with the tunnel height, with the grade factor, and falls with a larger area', [v({f: 0}).vc < v({f: 1}).vc, v({f: 1}).vc < v({f: 3}).vc, v({h: 6}).vc > v({}).vc, v({kg: 1.2}).vc >= v({}).vc * 1.2 - 1e-9 && v({kg: 1.2}).vc < v({}).vc * 1.3, v({a: 90}).vc < v({}).vc], [true, true, true, true, true]);
  check('airflow is velocity times the area and the density follows 353 / T', [near(v({}).flow, v({}).vc * 60, 1e-9), near(v({t: 20}).rho, 353 / 293.15, 1e-9), near(v({t: 40}).rho, 353 / 313.15, 1e-9)], [true, true, true]);
}
let tt;
w.renderCalc('nfpa502'); w.calcResult('nfpa502');
tt = txt(w, 'xtn_results');
check('the default page shows category C, 7 alarm boxes, 8 hose connections, the 300 m exit spacing and the 🔴 note', [tt.includes('C (300 m فأكثر)'), tt.includes('≥ 7'), tt.includes('8 توصيلة'), tt.includes('300 m'), tt.includes('🔴')], [true, true, true, true, true]);
set('xtn_l', '1200'); w.calcResult('nfpa502'); tt = txt(w, 'xtn_results');
check('1200 m is category D with required emergency ventilation and 3 intermediate exits', [tt.includes('D (1000 m فأكثر)'), tt.includes('مطلوبة'), tt.includes('3 مخرج وسيط')], [true, true, true]);
set('xtn_m', '1'); w.calcResult('nfpa502'); tt = txt(w, 'xtn_results');
check('the critical velocity mode shows the m/s value, the fire gas temperature and switches the groups', [/\d\.\d\d m\/s/.test(tt), tt.includes('°C'), tt.includes('150 MW'), doc.getElementById('xtn_g1').style.display === '', doc.getElementById('xtn_g0').style.display === 'none'], [true, true, true, true, true]);
check('other reference codes open nfpa502 too', others('nfpa502', 'xtn_results'), [true, true, true]);
}
// ---------- part 238: NFPA 1-2015 chapter 18 (`nfpa1ff`: required fire flow and duration by construction type and area, sprinkler and separation reductions, hydrant count and spacing, fire apparatus access roads) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xfrCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.5);
{
  const fl = (t, a) => J('xfrFlow(' + t + ',' + a + ')');
  check('Table 18.4.5.2.1, Type I (443)/(332)/II (222): up to 22,700 ft2 gives 1500 gpm; 22,701 gives 1750; 295,900 gives 5750; over gives 6000', [fl(0, 22700), fl(0, 22701), fl(0, 30200), fl(0, 295900), fl(0, 295901)], [1500, 1750, 1750, 5750, 6000]);
  check('Type II (111)/III (211): 12,700 ft2 is 1500 gpm, 166,500 is 5750, over is 6000; Type IV (2HH)/V (111): 8,200 is 1500, 12,901 is 2250, 191,400 is 7750, over is 8000', [fl(1, 12700), fl(1, 12701), fl(1, 166500), fl(1, 166501), fl(2, 8200), fl(2, 12901), fl(2, 191400), fl(2, 191401)], [1500, 1750, 5750, 6000, 1500, 2250, 7750, 8000]);
  check('Type II (000)/III (200): 5,900 ft2 is 1500 gpm, 5,901 is 1750, 138,300 is 7750; Type V (000): 3,600 is 1500, 3,601 is 1750, 85,100 is 7750, over is 8000', [fl(3, 5900), fl(3, 5901), fl(3, 138300), fl(3, 138301), fl(4, 3600), fl(4, 3601), fl(4, 85100), fl(4, 85101)], [1500, 1750, 7750, 8000, 1500, 1750, 7750, 8000]);
  check('the duration is 2 h below 3000 gpm, 3 h from 3000 to 3999 and 4 h from 4000', [1500, 2750, 3000, 3750, 4000, 8000].map(q => J('xfrDur(' + q + ')')), [2, 2, 3, 3, 4, 4]);
  check('the hydrant credit is 1500 gpm within 250 ft, 1000 gpm within 500 ft, 750 gpm within 1000 ft and none beyond', [250, 250.1, 500, 501, 1000, 1001].map(d => J('xfrCap(' + d + ')')), [1500, 1000, 1000, 750, 750, 0]);
  const a = o => calc(Object.assign({mode: 0, t: 3, area: 3000, dw: 0, spr: 0, qr: 0, sep: 0, park: 0}, o));
  check('3000 m2 (32,292 ft2) of Type II (000) needs 3750 gpm (14,195 L/min) for 3 h; the fire-flow area note differs for Type I', [Math.round(a({}).ft2), a({}).tbl, a({}).q, Math.round(a({}).lpm), a({}).dur, a({t: 0}).areaNote !== a({}).areaNote], [32292, 3750, 3750, 14195, 3, true]);
  check('a building sprinklered throughout takes 75 % off but not under 1000 gpm (600 gpm with quick-response sprinklers), not over 2000 gpm, for 2 h', [a({spr: 1}).q, a({spr: 1}).dur, a({spr: 1, qr: 1}).q, a({t: 4, area: 20000}).q, a({t: 4, area: 20000, spr: 1}).q, a({spr: 1, area: 100000}).q], [1000, 2, 937.5, 8000, 2000, 2000]);
  check('an open parking structure of Type I or II with a Class I standpipe takes 75 % off down to 1000 gpm', [a({park: 1}).q, a({park: 1, t: 4, area: 20000}).q, a({park: 1, spr: 1}).q], [1000, 2000, 1000]);
  check('a dwelling up to 5000 ft2 needs 1000 gpm for 1 h; sprinklers take 75 % off down to 500 gpm; separation takes 25 % or 40 %; the floor is 500 gpm', [a({dw: 1, area: 300}).q, a({dw: 1, area: 300}).dur, a({dw: 1, area: 300, spr: 1}).q, a({dw: 1, area: 300, sep: 1}).q, a({dw: 1, area: 300, sep: 2}).q, a({dw: 1, area: 300, spr: 1, sep: 2}).q], [1000, 1, 500, 750, 600, 500]);
  check('a dwelling over 5000 ft2 follows the table (600 m2 of Type II (000) is 1750 gpm for 2 h); sprinklers cut it to 500 gpm for 1 h; a 2000 m2 Type V (000) house needs 4000 gpm, 1000 gpm sprinklered, 2400 gpm with 40 % separation', [a({dw: 1, area: 600}).q, a({dw: 1, area: 600}).dur, a({dw: 1, area: 600, spr: 1}).q, a({dw: 1, area: 600, spr: 1}).dur, a({dw: 1, t: 4, area: 2000}).q, a({dw: 1, t: 4, area: 2000, spr: 1}).q, a({dw: 1, t: 4, area: 2000, sep: 2}).q], [1750, 2, 500, 1, 4000, 1000, 2400]);
  check('the water volume is flow times duration: 3750 gpm for 3 h is 2555 m3', [Math.round(a({}).volume), near(a({}).incr, 7500, 0.001)], [2555, true]);
  const h = o => calc(Object.assign({mode: 1, q: 3000, dh: 100, sp: 120, dwl: 0, hr: 2, w: 6.5, cl: 4.5, de: 30, dd: 10, wd: 40, spr: 0, spr13: 0}, o));
  check('3000 gpm with hydrants at 100 m (328 ft) needs 3 hydrants; at 70 m 2; at 200 m 4; beyond 305 m they do not count', [h({}).n, h({dh: 70}).n, h({dh: 200}).n, h({dh: 400}).n, h({dh: 400}).cap], [3, 2, 4, 0, 0]);
  check('hydrant distances: 400 ft (122 m) to the building and 500 ft (152 m) between hydrants; houses 600 ft (183 m) and 800 ft (244 m)', [h({}).okDist, h({dh: 125}).okDist, h({dh: 125, dwl: 1}).okDist, h({}).okSp, h({sp: 160}).okSp, h({sp: 160, dwl: 1}).okSp], [true, false, true, true, false, true]);
  check('access road: 6.1 m wide, 4.1 m clear, hydrant within 3.7 m of the road, dead end over 46 m needs a turnaround', [h({}).okWidth, h({w: 6}).okWidth, h({}).okClear, h({cl: 4}).okClear, h({hr: 3.7}).okRoad, h({hr: 4}).okRoad, h({de: 46}).deadEnd, h({de: 47}).deadEnd], [true, false, true, false, true, false, false, true]);
  check('the road reaches within 15 m of an exterior door (46 m for sprinklered dwellings) and within 46 m of the first-floor wall (137 m sprinklered)', [h({}).okDoor, h({dd: 16}).okDoor, h({dd: 40, spr13: 1}).okDoor, h({}).okWall, h({wd: 50}).okWall, h({wd: 130, spr: 1}).okWall, h({wd: 140, spr: 1}).okWall], [true, false, true, true, false, true, false]);
  check('hydrants are not required where the network gives 500 gpm or less', [h({q: 500}).rural, h({q: 501}).rural], [true, false]);
}
let tt;
w.renderCalc('nfpa1ff'); w.calcResult('nfpa1ff');
tt = txt(w, 'xfr_results');
check('the default page shows 3750 gpm, 14195 L/min, 3 h and the 🔴 note', [tt.includes('3750 gpm'), tt.includes('14195 L/min'), tt.includes('3 h'), tt.includes('🔴')], [true, true, true, true]);
set('xfr_sp', '1'); w.calcResult('nfpa1ff'); tt = txt(w, 'xfr_results');
check('sprinklers throughout give 1000 gpm for 2 h and the larger-demand note', [tt.includes('1000 gpm'), tt.includes('2 h'), tt.includes('الأكبر من الطلبين')], [true, true, true]);
set('xfr_m', '1'); w.calcResult('nfpa1ff'); tt = txt(w, 'xfr_results');
check('the hydrant mode shows 3 hydrants and switches the groups', [tt.includes('≥ 3'), tt.includes('6.1 m'), doc.getElementById('xfr_g1').style.display === '', doc.getElementById('xfr_g0').style.display === 'none'], [true, true, true, true]);
check('other reference codes open nfpa1ff too', others('nfpa1ff', 'xfr_results'), [true, true, true]);
}
// ---------- part 239: NFPA 211-2016 chimneys (`nfpa211`: chimney class by flue gas temperature, connector clearance with clearance-reduction systems, masonry chimney construction) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xchCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.01);
{
  const a = o => calc(Object.assign({mode: 0, t: 300, res: 1}, o));
  check('flue gas up to 538 C: column I for residential appliances and column II otherwise; up to 760 C column III; up to 982 C column IV; above column V', [a({}).k, a({res: 0}).k, a({t: 538}).k, a({t: 539}).k, a({t: 760}).k, a({t: 761}).k, a({t: 982}).k, a({t: 983}).k], [0, 1, 0, 2, 2, 3, 3, 4]);
  check('the chimney types: column I two, column II three; higher columns also serve lower ones', [a({}).types.length, a({res: 0}).types.length, a({t: 900}).types.length, a({}).higher.length, a({t: 983}).higher.length, a({t: 983}).label.startsWith('العمود V')], [2, 3, 3, 4, 0, true]);
  check('the temperature is shown in Fahrenheit: 538 C is 1000 F', [Math.round(a({t: 538}).tF), Math.round(a({t: 760}).tF)], [1000, 1400]);
  const c = o => calc(Object.assign({mode: 1, c: 0, p: 5, ceil: 0}, o));
  check('Table 9.5.1.1 clearances in inches: gas without draft hood 18, unlisted gas with draft hood 9, listed gas with draft hood 6, low-heat unit heater with draft hood 6, medium-heat 36', [0, 3, 6, 11, 13].map(i => c({c: i}).cunIn), [18, 9, 6, 6, 36]);
  check('a 24-gauge sheet metal shield with ventilated air space cuts 18 in. to 6.12 in. (155 mm) on a wall and to 9 in. (229 mm) on a ceiling', [near(c({}).cpr, 6.12), Math.round(c({}).cprMm), c({}).R, c({ceil: 1}).cpr, Math.round(c({ceil: 1}).cprMm), c({ceil: 1}).R], [true, 155, 66, 9, 229, 50]);
  check('Cpr = Cun (1 - R/100): 9 in. with 66 % is 3.06 in.; 36 in. is 12.24 in.; unprotected stays 18 in.; insulation board without air space 50 %: 9 in.', [near(c({c: 3}).cpr, 3.06), near(c({c: 13}).cpr, 12.24), c({p: 0}).cpr, c({p: 2}).cpr, near(c({p: 2, ceil: 1}).cpr, 12.06), near(c({p: 2, ceil: 1}).cprMm, 306.3, 0.1)], [true, true, 18, 9, true, true]);
  check('3.5 in. masonry without air space gives 33 % on a wall (12.06 in.) and cannot be used as a ceiling protector; with ventilated air space 66 % on a wall only', [c({p: 1}).R, near(c({p: 1}).cpr, 12.06), c({p: 1, ceil: 1}).na, c({p: 4}).R, c({p: 4, ceil: 1}).na, c({p: 5, ceil: 1}).na], [33, true, true, 66, true, false]);
  check('the table minimums for 18 in. are 12, 9 and 6 in. on walls and 12 and 9 in. on ceilings; ventilation is required except for the first three protections', [c({p: 1}).min, c({p: 2}).min, c({p: 5}).min, c({p: 2, ceil: 1}).min, c({p: 5, ceil: 1}).min, c({p: 1}).ventilated, c({p: 5}).ventilated, c({p: 0}).hasR], [12, 9, 6, 12, 9, false, true, false]);
  const m = o => calc(Object.assign({mode: 2, m: 0, h: 1, hn: 0.8, wt: 200, stone: 0}, o));
  check('Table 7.2 wall thickness: residential 102 mm, low-heat 203, medium-heat 203; rubble stone 305 mm; liner 16 mm of fireclay for the first two and 114 mm of fireclay brick above', [0, 1, 2, 3].map(i => m({m: i}).brick), [102, 203, 203, 203]);
  check('liners: 16 mm fireclay for residential and low-heat, 114 mm fireclay brick for medium and high-heat; mortar medium duty up to medium-heat and high duty for high-heat', [0, 1, 2, 3].map(i => m({m: i}).linerT).concat([0, 3].map(i => m({m: i}).mortar)), [16, 16, 114, 114, 'متوسط التحمل', 'عالي التحمل']);
  check('termination: 0.91 m above the roof and 0.61 m above structures within 3.05 m for residential and low-heat; 3.05 m within 7.6 m for medium-heat; 6.1 m within 15.2 m for high-heat', [0, 1, 2, 3].map(i => m({m: i}).term).concat([0, 2, 3].map(i => m({m: i}).nearD)), [0.91, 0.91, 3.05, 6.1, 3.05, 7.6, 15.2]);
  check('air space: 51 mm inside and 25 mm outside for residential; 51 / 51 for low-heat; 102 / 102 for medium-heat; high-heat takes the double wall rule', [0, 1, 2].map(i => m({m: i}).airIn).concat([0, 1, 2].map(i => m({m: i}).airOut), [m({m: 3}).double, m({m: 0}).double]), [51, 51, 102, 25, 51, 102, true, false]);
  check('compliance: a 0.91 m termination, a 0.61 m clearance over nearby structures and a 102 mm wall pass for residential; shorter or thinner do not', [m({wt: 102}).okTop, m({h: 0.9}).okTop, m({hn: 0.6}).okNear, m({hn: 0.61}).okNear, m({wt: 101}).okWall, m({wt: 102}).okWall, m({stone: 1, wt: 200}).okWall, m({stone: 1, wt: 305}).okWall], [true, false, false, true, false, true, false, true]);
}
let tt;
w.renderCalc('nfpa211'); w.calcResult('nfpa211');
tt = txt(w, 'xch_results');
check('the default page (300 C, residential) shows column I, the two chimney types and the 🔴 note', [tt.includes('العمود I'), tt.includes('572 °F') || tt.includes('°F'), tt.includes('مدخنة بناء من النوع السكني'), tt.includes('🔴')], [true, true, true, true]);
set('xch_m', '1'); w.calcResult('nfpa211'); tt = txt(w, 'xch_results');
check('the connector mode shows 6.1 in. for the 24-gauge shield, 66 %, and switches the groups', [tt.includes('6.1 in.'), tt.includes('66 %'), tt.includes('Cpr') || tt.includes('(1 − 66 / 100)'), doc.getElementById('xch_g1').style.display === '', doc.getElementById('xch_g0').style.display === 'none'], [true, true, true, true, true]);
set('xch_m', '2'); w.calcResult('nfpa211'); tt = txt(w, 'xch_results');
check('the masonry mode shows the 102 mm wall, 16 mm liner, 0.91 m termination and passes the default checks', [tt.includes('102 mm'), tt.includes('16 mm'), tt.includes('0.91 m'), tt.includes('✔'), doc.getElementById('xch_g2').style.display === ''], [true, true, true, true, true]);
check('other reference codes open nfpa211 too', others('nfpa211', 'xch_results'), [true, true, true]);
}
// ---------- part 240: NFPA 31-2016 fuel oil tanks (`nfpa31`: vent opening size, tank location and maximum capacity, clearances to flames and property lines, tank room door rating) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xoiCalc(' + JSON.stringify(o) + ')');
{
  const vg = g => J('xoiVent(' + g + ')');
  check('Table 7.2.5.1: up to 660 gal 1.25 in.; 661 to 3000 gal 1.5 in.; to 10,000 gal 2 in.; to 20,000 gal 2.5 in.; to 35,000 gal 3 in.; beyond the table nothing', [660, 661, 3000, 3001, 10000, 10001, 20000, 20001, 35000, 35001].map(vg), [1.25, 1.5, 1.5, 2, 2, 2.5, 2.5, 3, 3, 0]);
  const a = o => calc(Object.assign({cap: 2000, loc: 4, eng: 0, low: 1, dp: 2, df: 2, bar: 0}, o));
  check('the vent size follows the capacity in litres: 2000 L (528 gal) 1.25 in.; 3000 L (792 gal) 1.5 in.; 12,000 L (3170 gal) 2 in.; and the metric size is the inches times 25.4', [a({}).vent, a({cap: 3000}).vent, a({cap: 12000}).vent, Math.round(a({}).ventMm), Math.round(a({cap: 12000}).gal)], [1.25, 1.5, 2, 32, 3170]);
  check('an outside tank up to 1040 L needs 1.5 m from the property line, up to 2500 L 3 m, and a larger one falls under NFPA 30', [a({loc: 0, cap: 1000, dp: 1.5}).pass, a({loc: 0, cap: 1000, dp: 1.4}).pass, a({loc: 0, cap: 2000, dp: 3}).pass, a({loc: 0, cap: 2000, dp: 2.9}).pass, a({loc: 0, cap: 3000, dp: 50}).pass, a({loc: 0, cap: 1000}).reqDist, a({loc: 0, cap: 2000}).reqDist], [true, false, true, false, false, 1.5, 3]);
  check('an underground tank must be 0.3 m from a basement wall, pit or property line', [a({loc: 5, dp: 0.3}).pass, a({loc: 5, dp: 0.2}).pass], [true, false]);
  check('inside without a dedicated room: up to 5000 L (non-engineered) or 5200 L (engineered); above that fails', [a({cap: 5000}).pass, a({cap: 5100}).pass, a({cap: 5100, eng: 1}).pass, a({cap: 5300, eng: 1}).pass, a({cap: 5000}).over, a({cap: 5100}).over, a({cap: 5100, eng: 1}).lim], [true, false, true, false, false, true, 5200]);
  check('a dedicated room of 1 or 2 hours has the same limit; a 3-hour room may exceed it', [a({loc: 1, cap: 5100}).pass, a({loc: 2, cap: 5100}).pass, a({loc: 3, cap: 9000}).pass, a({loc: 1, cap: 4000}).pass], [false, false, true, true]);
  check('on an upper floor a tank is limited to 2500 L (660 gal)', [a({low: 0, cap: 2500}).pass, a({low: 0, cap: 3000}).pass, a({low: 1, cap: 3000}).pass], [true, false, true]);
  check('a tank of 38 to 5000 L needs 1.5 m from an open flame or burner unless a 1-hour barrier is provided; a smaller one 0.6 m from an ignition source', [a({df: 1.5}).pass, a({df: 1}).pass, a({df: 1, bar: 1}).pass, a({cap: 30, df: 0.5}).pass, a({cap: 30, df: 0.6}).pass, a({cap: 30}).small, a({cap: 38}).medium, a({cap: 5000}).medium, a({cap: 5001}).medium], [true, false, true, false, true, true, true, true, false]);
  check('the tank room door: 1.5 h for a 2-hour room, 3 h for a 3-hour room, and a listed self-closing door for a 1-hour room; only rooms have doors', [a({loc: 2}).door, a({loc: 3}).door, a({loc: 1}).door, a({loc: 1}).room, a({loc: 4}).room, a({loc: 0}).room, a({loc: 5}).room], [1.5, 3, 0, true, false, false, false]);
}
let tt;
w.renderCalc('nfpa31'); w.calcResult('nfpa31');
tt = txt(w, 'xoi_results');
check('the default page (2000 L inside, not in a dedicated room) shows the 1.25 in. vent, the compliant result and the 🔴 note', [tt.includes('1.25 in.'), tt.includes('متوافق'), tt.includes('✔'), tt.includes('🔴')], [true, true, true, true]);
set('xoi_c', '6000'); w.calcResult('nfpa31'); tt = txt(w, 'xoi_results');
check('6000 L inside without a room exceeds the limit', [tt.includes('غير متوافق'), tt.includes('✘')], [true, true]);
set('xoi_l', '2'); w.calcResult('nfpa31'); tt = txt(w, 'xoi_results');
check('a 2-hour room shows the 1.5 h door and the 150 mm sill', [tt.includes('1.5 h'), tt.includes('150 mm')], [true, true]);
set('xoi_l', '0'); w.calcResult('nfpa31'); tt = txt(w, 'xoi_results');
check('an outside tank larger than 2500 L refers to NFPA 30 chapter 22 and the distance field is shown', [tt.includes('الفصل 22 من NFPA 30'), doc.getElementById('xoi_dpf').style.display === '', doc.getElementById('xoi_dff').style.display === 'none'], [true, true, true]);
check('other reference codes open nfpa31 too', others('nfpa31', 'xoi_results'), [true, true, true]);
}
// ---------- part 241: UPC 2021 Table 422.1 (`upcfix`: minimum plumbing fixtures by occupancy: water closets, urinals, lavatories, bathtubs, drinking fountains, male and female split, rounding up, notes 3 and 4) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xpfCalc(' + JSON.stringify(o) + ')');
{
  const a = o => calc(Object.assign({t: 5, total: 300, male: 50, units: 20, exposed: 0}, o));
  check('business 300 persons (150 men, 150 women): WC 3 men and 8 women, urinals 2, lavatories 2 men and 3 women, drinking fountains 2', [a({}).wm, a({}).wf, a({}).um, a({}).lm, a({}).lf, a({}).dr], [3, 8, 2, 2, 3, 2]);
  check('assembly with fixed seats (A-1) 1000 persons: WC 4 men and 9 women, urinals 4, lavatories 3 and 5, fountains 4', [a({t: 0, total: 1000}).wm, a({t: 0, total: 1000}).wf, a({t: 0, total: 1000}).um, a({t: 0, total: 1000}).lm, a({t: 0, total: 1000}).lf, a({t: 0, total: 1000}).dr], [4, 9, 4, 3, 5, 4]);
  check('A-1 1500 persons (750 men): WC 4 and 11, urinals 5 (over 600 add one per 300 men), lavatories 4 and 6', [a({t: 0, total: 1500}).wm, a({t: 0, total: 1500}).wf, a({t: 0, total: 1500}).um, a({t: 0, total: 1500}).lm, a({t: 0, total: 1500}).lf], [4, 11, 5, 4, 6]);
  check('A-2, A-3, A-4 and A-5 differ in their steps: 400 persons give WC 3 / 2 / 2 / 2 men', [1, 2, 3, 4].map(t => a({t, total: 400}).wm).concat([a({t: 1, total: 400}).lm, a({t: 2, total: 400}).lm]), [3, 2, 2, 2, 2, 1]);
  check('A-5 uses the same ratios as A-4', [a({t: 4, total: 1000}).wm, a({t: 3, total: 1000}).wm, a({t: 4, total: 1000}).lf === a({t: 3, total: 1000}).lf], [4, 4, true]);
  check('educational: 1 per 50 men, 1 per 30 women, 1 urinal per 100 men, 1 lavatory per 40; 600 persons give 6 / 10 / 3 / 8 / 8 and 4 fountains', [a({t: 6, total: 600}).wm, a({t: 6, total: 600}).wf, a({t: 6, total: 600}).um, a({t: 6, total: 600}).lm, a({t: 6, total: 600}).lf, a({t: 6, total: 600}).dr], [6, 10, 3, 8, 8, 4]);
  check('note 3: women WC are not fewer than the men WC plus urinals; 20 men only in a business gives 2 for women', [a({total: 20, male: 100}).wm, a({total: 20, male: 100}).um, a({total: 20, male: 100}).wf0, a({total: 20, male: 100}).wf, a({total: 20, male: 100}).noteF, a({}).noteF], [1, 1, 0, 2, true, false]);
  check('note 4: the WC may be cut by the urinals added but not under two thirds of the minimum', [a({}).wmMin, a({t: 6, total: 600}).wm, a({t: 6, total: 600}).wmMin], [2, 6, 4]);
  check('mercantile: urinals none up to 200 men, 1 up to 400; WC women 4 for 201 to 300; lavatories 1 per 400 women over 400', [a({t: 14, total: 300}).um, a({t: 14, total: 500}).um, a({t: 14, total: 500}).wf, a({t: 14, total: 1000}).lf], [0, 1, 4, 4]);
  check('factory: WC 1 to 50, 2 to 75, 3 to 100 and one more per 40; no urinals; showers 1 per 15 exposed persons', [a({t: 7, total: 150}).wm, a({t: 7, total: 250}).wm, a({t: 7, total: 150}).um, a({t: 7, total: 150, exposed: 30}).bt, a({t: 7, total: 150}).bt], [2, 4, 0, 2, 0]);
  check('storage: WC 1 / 2 / 3 per 100 persons then 1 per 500 men and 150 women; lavatories by sex 1 to 200; 1000 persons: 4 / 4 / 3 / 3', [a({t: 20, total: 1000}).wm, a({t: 20, total: 1000}).wf, a({t: 20, total: 1000}).lm, a({t: 20, total: 1000}).lf], [4, 4, 3, 3]);
  check('employee use: men 1 / 2 / 3 to 15 / 35 / 55, women 1 / 3 / 4, then 1 per 40; lavatory 1 per 40 each', [a({t: 11, total: 60}).wm, a({t: 11, total: 60}).wf, a({t: 11, total: 120}).wm, a({t: 11, total: 120}).wf, a({t: 11, total: 60}).lm, a({t: 11, total: 60}).lf], [2, 3, 4, 5, 1, 1]);
  check('institutional I-1: 1 per 15 each sex for WC and lavatories, 1 bath per 8 persons; 100 persons: 4 / 4 / 4 / 4 / 13', [a({t: 8, total: 100}).wm, a({t: 8, total: 100}).wf, a({t: 8, total: 100}).lm, a({t: 8, total: 100}).lf, a({t: 8, total: 100}).bt], [4, 4, 4, 4, 13]);
  check('hospital individual rooms: one WC, lavatory and bath per room; wards 1 WC per 8 patients, 1 lavatory per 10, 1 bath per 20', [a({t: 9, units: 12}).wm, a({t: 9, units: 12}).lm, a({t: 9, units: 12}).bt, a({t: 10, total: 40}).wm, a({t: 10, total: 40}).lm, a({t: 10, total: 40}).bt, a({t: 10, total: 40}).dr], [12, 12, 12, 5, 4, 2, 1]);
  check('prison cells one per cell, showers 1 per 20; correctional facilities WC 1 per 8, lavatory 1 per 10, shower 1 per 8, one fountain per floor', [a({t: 12, units: 30}).wm, a({t: 12, units: 30, total: 40}).bt, a({t: 13, total: 40, units: 3}).wm, a({t: 13, total: 40, units: 3}).lm, a({t: 13, total: 40, units: 3}).bt, a({t: 13, total: 40, units: 3}).dr], [30, 2, 5, 4, 5, 3]);
  check('hotel one set per sleeping room; apartment houses one per apartment with a washer connection per 12 units; one- and two-family dwellings one of each', [a({t: 15, units: 30}).wm, a({t: 15, units: 30}).bt, a({t: 17, units: 25}).wm, a({t: 17, units: 25}).washer, a({t: 17, units: 25}).ot, a({t: 19, units: 1}).wm, a({t: 19, units: 1}).ot], [30, 30, 25, 3, 2, 1, 3]);
  check('dormitories: WC 1 per 10 men and 1 per 8 women; urinals 1 per 25 men and one more per 50 over 150; lavatories 1 per 12; baths 1 per 8', [a({t: 16, total: 100}).wm, a({t: 16, total: 100}).wf, a({t: 16, total: 100}).um, a({t: 16, total: 100}).lm, a({t: 16, total: 100}).bt, a({t: 16, total: 400}).um], [5, 7, 2, 5, 13, 7]);
  check('the shared single-user facility: total load of 10 or less (not residential), business or mercantile of 50 or less', [a({total: 10}).single, a({total: 11}).single, a({total: 40}).single50, a({total: 60}).single50, a({t: 14, total: 50}).single50, a({t: 15, units: 5, total: 5}).single, a({t: 6, total: 50}).single50], [true, false, true, false, true, false, false]);
  check('the sex split follows the input: 60 % men of 100 persons in a business gives WC 2 for 60 men and 3 for 40 women', [a({total: 100, male: 60}).wm, a({total: 100, male: 60}).wf, a({total: 100, male: 60}).lm, a({total: 100, male: 60}).lf], [2, 3, 1, 1]);
}
let tt;
w.renderCalc('upcfix'); w.calcResult('upcfix');
tt = txt(w, 'xpf_results');
check('the default page shows the men and women WC, the urinals, the drinking fountains and the 🔴 note', [tt.includes('المراحيض للذكور (WC)'), tt.includes('المباول للذكور'), tt.includes('نوافير الشرب'), tt.includes('🔴')], [true, true, true, true]);
set('xpf_t', '9'); w.calcResult('upcfix'); tt = txt(w, 'xpf_results');
check('a hospital individual-room occupancy counts units and shows the unit field', [tt.includes('واحد لكل وحدة'), doc.getElementById('xpf_fu').style.display === '', doc.getElementById('xpf_fm').style.display === 'none'], [true, true, true]);
set('xpf_t', '7'); w.calcResult('upcfix'); tt = txt(w, 'xpf_results');
check('a factory shows the exposed persons field and no urinals', [doc.getElementById('xpf_fe').style.display === '', doc.getElementById('xpf_fm').style.display === '', !tt.includes('المباول للذكور')], [true, true, true]);
check('other reference codes open upcfix too', others('upcfix', 'xpf_results'), [true, true, true]);
}
// ---------- part 242: ASHRAE 170-2021 Tables 8-1, 8-2 and 9-1 (`a170op`: outpatient specialized and general spaces, residential health care spaces: pressure, outdoor and total ach, exhaust, recirculation, filter, humidity, temperature, Rp-Ra option) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xahCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-6);
{
  check('the three tables have 43, 28 and 30 spaces', [J('XAH_T1.length'), J('XAH_T2.length'), J('XAH_T3.length')], [43, 28, 30]);
  const a = o => calc(Object.assign({mode: 0, s: 4, area: 40, h: 3, people: 2}, o));
  check('Table 8-1 operating room: positive, 4 outdoor and 20 total ach, no recirculation by room units, MERV-16, RH 20-60, 68-75 F', [a({}).press, a({}).oa, a({}).tot, a({}).row[6], a({}).row[8], a({}).row[9], a({}).row[10]], ['P', 4, 20, 'N', 'MERV-16', '20-60', '68-75/20-24']);
  check('for 40 m2 x 3 m (120 m3): 4 ach is 133.3 L/s outdoor, 20 ach is 666.7 L/s total and 533.3 L/s the rest', [near(a({}).oaFlow * 1000, 133.333, 1e-3), near(a({}).totFlow * 1000, 666.667, 1e-3), near(a({}).recFlow * 1000, 533.333, 1e-3), a({}).vol], [true, true, true, 120]);
  check('Table 8-1: delivery, procedure, trauma, class 2 and class 3 imaging rooms are positive with 4 / 3 / 3 / 3 / 4 outdoor ach', [0, 5, 9, 12, 13].map(s => a({s}).oa), [4, 3, 3, 3, 4]);
  check('Table 8-1: AII anteroom and PE anteroom have no outdoor requirement, 10 total ach, pressure by the served room; PE room HEPA', [a({s: 15}).oa, a({s: 15}).tot, a({s: 15}).press, a({s: 17}).row[8], a({s: 18}).row[8], a({s: 18}).press], [null, 10, 'E', 'HEPA', 'HEPA', 'P']);
  check('Table 8-1: sterile and support spaces: clean workroom positive 2 / 4, sterilizer room 10 total and exhausted, regulated waste 2 / 10 exhausted', [a({s: 34}).press, a({s: 34}).oa, a({s: 34}).tot, a({s: 33}).tot, a({s: 33}).row[5], a({s: 39}).tot, a({s: 39}).row[5]], ['P', 2, 4, 10, 'Y', 10, 'Y']);
  check('Table 8-1 last row: soiled workroom negative 2 / 6, exhausted, 72-78 F', [a({s: 42}).press, a({s: 42}).oa, a({s: 42}).tot, a({s: 42}).row[10]], ['N', 2, 6, '72-78/22-26']);
  const b = o => calc(Object.assign({mode: 1, s: 5, area: 20, h: 3, people: 2}, o));
  check('Table 8-2 general examination room: 2 / 2 ach, air class 1, Rp 3.8 L/s with a minimum population of 3, Ra 0.6 L/s per m2', [b({}).oa, b({}).tot, b({}).cls, b({}).rpL, b({}).minPop, b({}).raL], [2, 2, 1, 3.8, 3, 0.6]);
  check('Rp-Ra: with 2 people the minimum population 3 applies: 3.8 x 3 + 0.6 x 20 = 23.4 L/s; with 5 people 31 L/s; 23.4 L/s is 1.4 ach in 60 m3', [near(b({}).voz, 23.4), near(b({people: 5}).voz, 31), near(b({}).vozAch, 23.4 * 3.6 / 60, 1e-6)], [true, true, true]);
  check('Table 8-2: the therapeutic pool has only Ra (2.4 L/s per m2: 48 L/s for 20 m2) and 10 total ach; a toilet room has no Rp-Ra option', [b({s: 18}).voz, b({s: 18}).tot, b({s: 24}).voz, b({s: 24}).press, b({s: 24}).row[5]], [48, 10, null, 'N', 'Y']);
  check('Table 8-2: the birthing room Rp 5 L/s with a minimum of 4 persons gives 5 x 4 + 0.9 x 20 = 38 L/s; psychiatric rooms 0.3 L/s per m2', [near(b({s: 0}).voz, 38), b({s: 10}).raL, b({s: 13}).cls], [true, 0.3, 2]);
  const c = o => calc(Object.assign({mode: 2, s: 5, area: 20, h: 3, people: 2}, o));
  check('Table 9-1 nursing home: resident room 2 / 2 ach MERV-14 Max 60 70-78 F, AII room negative 2 / 12 exhausted, resident living area 4 / 4', [c({}).oa, c({}).tot, c({}).row[8], c({}).row[10], c({s: 0}).press, c({s: 0}).tot, c({s: 4}).oa, c({s: 4}).tot], [2, 2, 'MERV-14', '70-78/21-29', 'N', 12, 4, 4]);
  check('Table 9-1 hospice and assisted living: hospice resident room 2 / 2 MERV-8 70-75 F; assisted living rows have no ach requirement', [c({s: 10}).oa, c({s: 10}).tot, c({s: 10}).row[8], c({s: 13}).oa, c({s: 13}).tot, c({s: 13}).oaFlow, c({s: 14}).row[10]], [2, 2, 'MERV-8', null, null, null, '70-78/21-29']);
  check('Table 9-1 service and support: clean linen positive with 2 ach total, dietary storage and laundry no recirculation, hazardous waste 2 / 10, clean utility positive 2 / 4', [c({s: 17}).press, c({s: 17}).tot, c({s: 18}).row[6], c({s: 20}).tot, c({s: 21}).row[6], c({s: 28}).oa, c({s: 28}).tot, c({s: 26}).press, c({s: 26}).oa, c({s: 26}).tot], ['P', 2, 'N', 10, 'N', 2, 10, 'P', 2, 4]);
  check('unoccupied turndown is not allowed in toilets, laundry and clean utility, allowed in resident rooms', [c({s: 7}).row[7], c({s: 21}).row[7], c({s: 26}).row[7], c({s: 5}).row[7]], ['N', 'N', 'N', 'Y']);
}
let tt;
w.renderCalc('a170op'); w.calcResult('a170op');
tt = txt(w, 'xah_results');
check('the default page (operating room, 60 m3) shows 66.7 L/s, 333.3 L/s, MERV-16 and the 🔴 note', [tt.includes('66.7 L/s'), tt.includes('333.3 L/s'), tt.includes('MERV-16'), tt.includes('🔴')], [true, true, true, true]);
set('xah_m', '1'); w.calcResult('a170op'); tt = txt(w, 'xah_results');
check('Table 8-2 shows the Rp-Ra airflow 23.4 L/s and the air class, and switches the selectors', [tt.includes('23.4 L/s'), tt.includes('فئة الهواء'), doc.getElementById('xah_g1').style.display === '', doc.getElementById('xah_g0').style.display === 'none'], [true, true, true, true]);
set('xah_m', '2'); w.calcResult('a170op'); tt = txt(w, 'xah_results');
check('Table 9-1 shows the turndown row and the resident room values', [tt.includes('خفض التشغيل عند عدم الإشغال'), tt.includes('MERV-14'), doc.getElementById('xah_g2').style.display === ''], [true, true, true]);
check('other reference codes open a170op too', others('a170op', 'xah_results'), [true, true, true]);
}
// ---------- part 243: NFPA 130-2014 transit station egress (`nfpa130`: platform load, exit capacity, 4-minute platform time, 6-minute time to a point of safety, annex C.1.3 sample) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xtrCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.01);
{
  const a = o => calc(Object.assign({train: 1500, entr: 814, stairs: 7320, nEsc: 2, escW: 1220, emStairs: 2440, dPlat: 41.5, rise: 9.1, dConc: 16.5, rise2: 0, dOut: 3.05, cv: 0, gates: 4, service: 1, exitDoors: 3660, minW: 1220, travel: 60, common: 20, carLen: 20, hold: 0}, o));
  check('annex C.1.3 center-platform sample: platform load 2314; exit capacity 406 + 68 + 135 = 609 p/min; platform clear time 3.80 min', [a({}).P, Math.round(a({}).stCap), Math.round(a({}).escCap), Math.round(a({}).emCap), Math.round(a({}).platCap), near(a({}).Fp, 3.80)], [2314, 406, 68, 135, 609, true]);
  check('walking times: 41.5 m at 37.7 = 1.10 min, 9.1 m rise at 14.6 = 0.62, 16.5 m at 37.7 = 0.44, 3.05 m = 0.08; total 2.23 min', [near(a({}).T1, 1.10), near(a({}).T2, 0.62), near(a({}).T3, 0.44), near(a({}).T5, 0.08), near(a({}).T, 2.23, 0.02)], [true, true, true, true, true]);
  check('waiting at the platform exits 2.71 min; concourse load 1801 (2314 - 3.80 x 135); fare barrier capacity 560 and flow time 3.22 min give no waiting', [near(a({}).Wp, 2.70, 0.02), Math.round(a({}).conc / 10) * 10, Math.round(a({}).fbCap), near(a({}).Ffb, 3.22, 0.02), a({}).Wfb], [true, 1800, 560, true, 0]);
  check('the total exit time is 4.94 min (within 6) and the platform test passes (within 4)', [near(a({}).total, 4.94, 0.02), a({}).test1, a({}).test2], [true, true, true]);
  check('one escalator is discounted: a single escalator gives no capacity; the share of escalators is below 50 %', [a({nEsc: 1}).escCap, a({}).escOk, near(a({}).escShare, 0.111, 0.005), a({nEsc: 5, escW: 3000}).escOk], [0, true, true, false]);
  check('a heavy platform fails the 4-minute test: 4000 persons gives Fp 6.6 min; the 6-minute test fails with it', [near(a({entr: 2500}).Fp, 6.56, 0.02), a({entr: 2500}).test1, a({entr: 2500}).test2], [true, false, false]);
  check('the concourse speed 61.0 m/min shortens the concourse walk: 16.5 m takes 0.27 min', [near(a({cv: 1}).T3, 0.27), a({cv: 1}).vC], [true, 61]);
  check('width and distance limits: 1120 mm clear width, 100 m travel, 25 m or one car length common path', [a({minW: 1120}).okWidth, a({minW: 1100}).okWidth, a({travel: 100}).okDist, a({travel: 101}).okDist, a({common: 25}).okCommon, a({common: 26}).okCommon, a({common: 30, carLen: 30}).okCommon], [true, false, true, false, true, false, true]);
  check('no fare barrier capacity with a concourse load cannot be evaluated; with no concourse load there is no waiting', [a({gates: 0, service: 0, exitDoors: 0}).test2, a({train: 0, entr: 0}).conc, a({train: 0, entr: 0}).Wfb], [false, 0, 0]);
  check('the holding area holds 1 person per 0.46 m2', [Math.round(a({hold: 46}).hold)], [100]);
}
let tt;
w.renderCalc('nfpa130'); w.calcResult('nfpa130');
tt = txt(w, 'xtr_results');
check('the default page shows 2314 persons, 609 p/min, 3.80 min, 4.94 min and the 🔴 note', [tt.includes('2314'), tt.includes('609 p/min'), tt.includes('3.80 min'), tt.includes('4.94 min'), tt.includes('🔴')], [true, true, true, true, true]);
set('xtr_en', '3000'); w.calcResult('nfpa130'); tt = txt(w, 'xtr_results');
check('a heavy platform shows the failed test mark', [tt.includes('✘')], [true]);
check('other reference codes open nfpa130 too', others('nfpa130', 'xtr_results'), [true, true, true]);
}
// ---------- part 244: NFPA 86-2015 Class A ovens (`nfpa86`: safety ventilation for solvent vapors in continuous and batch ovens, 25 / 50 % LFL, products of combustion, temperature and altitude corrections) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xovCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.01);
{
  const a = o => calc(Object.assign({type: 0, solv: 0.5, sg: 0.87, vd: 3.7, lfl: 1.0, t: 150, alt: 0, ctrl: 0, direct: 0, kw: 0}, o));
  check('xylene-like solvent (SpGr 0.87, VD 3.7, LFL 1.0 %): vapor 0.1956 m3/L; LFL at 150 C = 1.0 x (1 - 0.000784 x 125) = 0.902 %; barely explosive 21.68 m3/L', [near(a({}).vap, 0.19555, 1e-4), near(a({}).lflT, 0.902, 1e-3), near(a({}).barely, 21.68, 0.01)], [true, true, true]);
  check('the diluted mixture at 25 % LFL is 4 times that (86.7 m3/L); at 50 % with a continuous indicator 2 times (43.4)', [near(a({}).dil, 86.72, 0.05), near(a({ctrl: 1}).dil, 43.36, 0.05), a({}).limit, a({ctrl: 1}).limit], [true, true, 25, 50]);
  check('continuous oven at 0.5 L/min: 43.4 standard m3/min; corrected for 150 C (423 / 294 = 1.439) it is 62.4 m3/min; with the controller 31.2', [near(a({}).std, 43.36, 0.05), near(a({}).tf, 1.4388, 1e-3), near(a({}).act, 62.38, 0.1), near(a({ctrl: 1}).act, 31.19, 0.1)], [true, true, true, true]);
  check('the LFL correction table: 100 C gives 0.94, 149 C 0.90, 204 C 0.86, 260 C 0.81', [[100, 0.94], [149, 0.90], [204, 0.86], [260, 0.81]].map(p => near(a({t: p[0]}).lflF, p[1], 0.01)), [true, true, true, true]);
  check('direct-fired: 586.2 kW gives 10.36 standard m3/min of products of combustion added before the corrections', [near(a({direct: 1, kw: 586.2}).poc, 10.36, 0.01), near(a({direct: 1, kw: 586.2}).stdTot, 43.36 + 10.36, 0.06), a({direct: 0, kw: 586.2}).poc], [true, true, 0]);
  check('altitude factors: none below 305 m, 1.04 at 305 m, 1.06 at 457.5 m, 1.20 at 1524 m, 1.45 at 3048 m and above', [200, 305, 457.5, 1524, 3048, 4000].map(h => Math.round(J('xovAlt(' + h + ')') * 1000) / 1000), [1, 1.04, 1.06, 1.2, 1.45, 1.45]);
  check('the altitude correction multiplies the flow: at 1524 m the 62.4 m3/min becomes 1.20 times that', [near(a({alt: 1524}).act, 62.38 * 1.2, 0.1), a({alt: 1524}).af], [true, 1.2]);
  check('estimating method C (340 m3 per 3.8 L): applies for ethanol at 100 C and sea level (barely explosive 13.2 m3/L) but not for the xylene-like solvent', [a({sg: 0.79, vd: 1.6, lfl: 3.3, t: 100}).estOk, near(a({sg: 0.79, vd: 1.6, lfl: 3.3, t: 100}).barely, 13.22, 0.05), a({}).estOk, near(a({sg: 0.79, vd: 1.6, lfl: 3.3, t: 100}).est, 44.74, 0.05), a({sg: 0.79, vd: 1.6, lfl: 3.3, t: 100, alt: 400}).estOk, a({sg: 0.79, vd: 1.6, lfl: 3.3, t: 200}).estOk], [true, true, false, true, false, false]);
  const b = o => a(Object.assign({type: 1, solv: 10}, o));
  check('batch oven: 3.29 standard m3/min per litre (440 scfm/gal) of solvent in the batch, increased in proportion when the dilution volume exceeds 19.75 m3/L', [near(b({sg: 0.79, vd: 1.6, lfl: 3.3, t: 100}).std, 32.9, 0.01), near(b({}).ratio, 21.68 / 19.75, 1e-3), near(b({}).std, 3.29 * 10 * 21.68 / 19.75, 0.05)], [true, true, true]);
  check('batch multiplier 1.4 for 121 to 260 C; none below 121; above 260 C by test', [b({t: 150}).mult, b({t: 120}).mult, b({t: 260}).mult, b({t: 300}).mult, b({t: 300}).high], [1.4, 1, 1.4, 1, true]);
  check('batch at 150 C: 36.1 standard m3/min x 1.439 x 1.4 = 72.7 m3/min; unit conversions to m3/h and L/s', [near(b({}).act, 72.7, 0.2), near(b({}).actH, b({}).act * 60, 1e-9), near(b({}).actLs, b({}).act * 1000 / 60, 1e-9)], [true, true, true]);
}
let tt;
w.renderCalc('nfpa86'); w.calcResult('nfpa86');
tt = txt(w, 'xov_results');
check('the default page shows the corrected flow 62.4 m3/min, the 0.902 % LFL and the 🔴 note', [tt.includes('62.4 m³/min'), tt.includes('0.90 %'), tt.includes('🔴')], [true, true, true]);
set('xov_m', '1'); w.calcResult('nfpa86'); tt = txt(w, 'xov_results');
check('the batch mode shows 3.29 m3/min per litre and switches the groups', [tt.includes('3.29 m³/min'), doc.getElementById('xov_g1').style.display === '', doc.getElementById('xov_g0').style.display === 'none'], [true, true, true]);
check('other reference codes open nfpa86 too', others('nfpa86', 'xov_results'), [true, true, true]);
}
// ---------- part 245: NFPA 90A-2015 smoke detectors, dampers and duct materials (`nfpa90a`: 944 / 7080 L/s thresholds, isolation dampers and exemptions, fire damper rating, fusible link, flexible and gypsum ducts, service openings) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xdaCalc(' + JSON.stringify(o) + ')');
{
  const a = o => calc(Object.assign({sup: 2500, ret: 2500, stories: 1, ahu: 0, rating: 2, tmax: 40, tsc: 0, t: 35, vert: 0, conn: 3, len: 30, risers: 2, vel: 6, filtered: 0, noProc: 0, inlet: 0}, o));
  check('supply detector: required above 944 L/s (2000 cfm); not at 944 or below', [a({}).detSup, a({sup: 944}).detSup, a({sup: 944.1}).detSup, a({sup: 500}).detSup], [true, false, true, false]);
  check('return detectors: more than 7080 L/s and more than one story only', [a({ret: 8000, stories: 3}).detRet, a({ret: 8000, stories: 1}).detRet, a({ret: 8000, stories: 1}).detRetCap, a({ret: 7080, stories: 3}).detRet, a({}).detRet], [true, false, true, false, false]);
  check('isolation dampers: over 7080 L/s on either side; exempt for a unit on the floor it serves or on the roof serving the floor below', [a({sup: 8000}).iso, a({sup: 2500, ret: 8000}).iso, a({sup: 8000, ahu: 1}).iso, a({sup: 8000, ahu: 2}).iso, a({sup: 8000, ahu: 1}).isoOver, a({sup: 7080}).iso, a({}).sys], [true, true, false, false, true, false, 2500]);
  check('fire damper rating: 1.5 h for walls under 3 h, 3 h for 3 h and over; none without a rated barrier', [a({}).fdRating, a({rating: 2.99}).fdRating, a({rating: 3}).fdRating, a({rating: 4}).fdRating, a({rating: 0}).fdRated, a({}).fdRated], [1.5, 1.5, 3, 3, false, true]);
  check('fusible link: 28 C above the maximum, not less than 71 C: 40 C gives 71, 60 C gives 88', [a({}).link, a({tmax: 60}).link, a({tmax: 43}).link, a({tmax: 44}).link], [71, 88, 71, 72]);
  check('smoke control combination damper: 28 C above the design temperature and not over 177 C: 149 C passes (177), 150 C fails (178), none passes', [a({tsc: 149}).linkSC, a({tsc: 149}).linkSCok, a({tsc: 150}).linkSC, a({tsc: 150}).linkSCok, a({}).linkSCok], [177, true, 178, false, true]);
  check('flexible Class 0 or 1 ducts up to 121 C, or vertical serving no more than two stories; gypsum board ducts up to 52 C', [a({t: 121}).flexOk, a({t: 130}).flexOk, a({t: 130, vert: 1}).flexOk, a({t: 52}).gypOk, a({t: 53}).gypOk], [true, false, true, true, false]);
  check('air connector runs up to 4.27 m (14 ft)', [a({conn: 4.27}).connOk, a({conn: 4.3}).connOk, a({conn: 0}).connOk], [true, false, true]);
  check('service openings at 6.1 m (20 ft) intervals plus one at the base of each vertical riser: 30 m gives 4 + 2 = 6; 6.1 m gives 1', [a({}).openRun, a({}).openings, a({len: 6.1, risers: 0}).openings, a({len: 12.2, risers: 0}).openings, a({len: 6, risers: 1}).openings], [4, 6, 1, 2, 1]);
  check('service opening exemptions: filtered supply, or all three of no dust process, inlets 2.13 m or screened and 5.08 m/s (1000 fpm)', [a({}).soExempt, a({filtered: 1}).soExempt, a({noProc: 1, inlet: 1}).soExempt, a({noProc: 1, inlet: 1, vel: 5}).soExempt, a({noProc: 1, inlet: 1, vel: 5.08}).soExempt, a({noProc: 1, vel: 9}).soExempt], [false, true, true, false, true, false]);
}
let tt;
w.renderCalc('nfpa90a'); w.calcResult('nfpa90a');
tt = txt(w, 'xda_results');
check('the default page shows the 1.5 h damper, the 71 °C link, Class II, 6 openings and the 🔴 note', [tt.includes('1.5 h'), tt.includes('71 °C'), tt.includes('Class II'), tt.includes('6 فتحة'), tt.includes('🔴')], [true, true, true, true, true]);
set('xda_ts', '150'); w.calcResult('nfpa90a'); tt = txt(w, 'xda_results');
check('a smoke control design temperature of 150 C shows the 178 °C link and the failed mark', [tt.includes('178 °C'), tt.includes('✘')], [true, true]);
set('xda_np', '1'); set('xda_in', '1'); w.calcResult('nfpa90a'); tt = txt(w, 'xda_results');
check('the three exemption conditions replace the service opening count', [tt.includes('غير مطلوبة'), tt.includes('6 فتحة')], [true, false]);
check('other reference codes open nfpa90a too', others('nfpa90a', 'xda_results'), [true, true, true]);
}
// ---------- part 246: NFPA 85-2015 boiler enclosure and component purge (`nfpa85`: 25 to 40 % purge rate, 5 minutes and 5 volume changes, parallel component purge, mandatory trip level, emergency and all-fan-trip procedures) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xbpCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.01);
{
  const a = o => calc(Object.assign({F: 400, pct: 30, fuel: 0, V: 8000, Vc: 1500, rho: 1.2, trip: 0, cur: 20}, o));
  check('purge rate 30 % of 400 kg/s = 120 kg/s = 100 m3/s; the limits are 100 kg/s (25 %) and 160 kg/s (40 % for coal)', [a({}).Q, near(a({}).Qv, 100), a({}).minQ, a({}).maxQ, a({}).pctOk], [120, true, 100, 160, true]);
  check('boiler enclosure of 8000 m3: five volume changes take 400 s = 6.67 min, longer than 5 min', [near(a({}).t5v, 6.667, 0.005), near(a({}).tB, 6.667, 0.005), a({}).govB], [true, true, 1]);
  check('a small enclosure of 4000 m3 needs only 3.33 min for five changes, so 5 minutes governs', [near(a({V: 4000}).t5v, 3.333, 0.005), a({V: 4000}).tB, a({V: 4000}).govB], [true, 5, 0]);
  check('component of 1500 m3: 75 s per change set = 1.25 min, so 5 min governs; with the enclosure purge in parallel the total is 6.67 and no extra wait', [near(a({}).t5c, 1.25), a({}).tC, a({}).govC, near(a({}).total, 6.667, 0.005), a({}).extra], [true, 5, 0, true, 0]);
  check('annex example: a 5 minute enclosure purge and a 7 minute precipitator purge leave the precipitator waiting 2 minutes', [a({V: 4000, Vc: 8400}).tB, near(a({V: 4000, Vc: 8400}).tC, 7), near(a({V: 4000, Vc: 8400}).extra, 2), near(a({V: 4000, Vc: 8400}).total, 7)], [5, true, true, true]);
  check('no component volume gives no component purge', [a({Vc: 0}).tC, a({Vc: 0}).extra, near(a({Vc: 0}).total, 6.667, 0.005)], [0, 0, true]);
  check('purge rate limits: 24 % fails, 25 % passes; 41 % fails for coal but gas or oil units may exceed 40 %', [a({pct: 24}).pctOk, a({pct: 25}).pctOk, a({pct: 40}).pctOk, a({pct: 41}).pctOk, a({pct: 41, fuel: 1}).pctOk, a({fuel: 1}).maxQ], [false, true, true, false, true, 0]);
  check('the mandatory trip level is 5 percentage points below the purge rate: 30 % gives 25 % = 100 kg/s', [a({}).mftPct, a({}).mftQ, a({pct: 35}).mftPct], [25, 100, 30]);
  check('emergency shutdown with fans in service: below the purge rate holds 5 min first, above it ramps down at once; all-fan trip holds 15 min', [a({trip: 1, cur: 20}).hold, a({trip: 1, cur: 20}).below, a({trip: 1, cur: 50}).hold, a({trip: 1, cur: 50}).below, a({trip: 2}).hold, a({trip: 0}).hold], [5, true, 0, false, 15, 0]);
  check('time from the trip: 5 + 6.67 = 11.67 min (below purge rate); 15 + 6.67 = 21.67 min after an all-fan trip', [near(a({trip: 1, cur: 20}).fromTrip, 11.667, 0.005), near(a({trip: 2}).fromTrip, 21.667, 0.005), near(a({trip: 0}).fromTrip, 6.667, 0.005)], [true, true, true]);
}
let tt;
w.renderCalc('nfpa85'); w.calcResult('nfpa85');
tt = txt(w, 'xbp_results');
check('the default page shows 100.0 kg/s, 160.0 kg/s, 6.7 min, 25.0 % trip level and the 🔴 note', [tt.includes('100.0 kg/s'), tt.includes('160.0 kg/s'), tt.includes('6.7 min'), tt.includes('25.0 % = 100.0 kg/s'), tt.includes('🔴')], [true, true, true, true, true]);
set('xbp_tr', '2'); w.calcResult('nfpa85'); tt = txt(w, 'xbp_results');
check('an all-fan trip shows the 15 minute hold and 21.7 min', [tt.includes('15 min'), tt.includes('21.7 min')], [true, true]);
set('xbp_p', '45'); w.calcResult('nfpa85'); tt = txt(w, 'xbp_results');
check('45 % for coal shows the failed mark', [tt.includes('✘')], [true]);
check('other reference codes open nfpa85 too', others('nfpa85', 'xbp_results'), [true, true, true]);
}
// ---------- part 247: NFPA 220-2015 types of construction (`nfpa220`: Table 4.1.1 fire resistance ratings for Types I to V, heavy timber allowable dimensions of Type IV 2HH) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const rate = (t, r) => J('xncRating(' + t + ',' + r + ')');
const chk = (i, b, d) => J('xncCheck(' + i + ',' + b + ',' + d + ')');
{
  check('Type I (442): exterior bearing walls 4 h, columns supporting more than one floor 4 h, columns supporting a roof only 3 h, roof-ceiling 2 h', [rate(0, 0).s, rate(0, 6).s, rate(0, 8).s, rate(0, 13).s], ['4', '4', '3', '2']);
  check('Type I (332): beams supporting one floor only 2 h, roof-ceiling assemblies 1.5 h; Type II (222) roof-ceiling 1 h', [rate(1, 10).s, rate(1, 13).s, rate(1, 13).hours, rate(2, 13).s], ['2', '1.5', 1.5, '1']);
  check('Type II (222): exterior bearing walls 2 h but 1 h supporting a roof only; Type II (111) all 1 h; Type II (000) all 0', [rate(2, 0).s, rate(2, 2).s, rate(3, 0).s, rate(3, 8).s, rate(4, 3).s, rate(4, 6).s], ['2', '1', '1', '1', '0', '0']);
  check('Type III (211): exterior bearing walls 2 h and interior elements 1 h; Type III (200): interior elements 0', [rate(5, 0).s, rate(5, 3).s, rate(5, 12).s, rate(6, 0).s, rate(6, 3).s], ['2', '1', '1', '2', '0']);
  check('Type IV (2HH): exterior bearing walls 2 h, interior bearing walls 2, 1, 1 h, columns, beams and floors heavy timber', [rate(7, 0).s, rate(7, 2).s, rate(7, 3).s, rate(7, 4).s, rate(7, 5).s, rate(7, 6).s, rate(7, 9).s, rate(7, 12).s, rate(7, 13).s, rate(7, 6).timber, rate(7, 0).timber], ['2', '2', '2', '1', '1', 'H', 'H', 'H', 'H', true, false]);
  check('Type V (111): all structural elements 1 h; Type V (000): 0; exterior bearing walls of Types II (000), III and V (000) marked 0b', [rate(8, 0).s, rate(8, 13).s, rate(9, 0).s, rate(9, 0).cond, rate(4, 0).cond, rate(6, 0).cond, rate(0, 15).cond, rate(0, 14).s], ['1', '1', '0b', true, true, false, true, '0']);
  check('every row holds ten ratings, one per construction type', [J('XNC_R.length'), J('XNC_R.every(r => r[1].length === 10)'), J('XNC_T.length')], [16, true, 10]);
  check('heavy timber columns supporting floor loads: 205 mm in any dimension; 200 mm fails; a 205 x 300 section passes', [chk(0, 205, 205).ok, chk(0, 200, 300).ok, chk(0, 300, 205).ok, chk(0, 205, 204).ok], [true, false, true, false]);
  check('roof columns 150 x 205 mm; floor beams 150 x 255 mm; roof beams 100 x 150 mm', [chk(1, 150, 205).ok, chk(1, 149, 205).ok, chk(1, 150, 204).ok, chk(2, 150, 255).ok, chk(2, 150, 254).ok, chk(3, 100, 150).ok, chk(3, 100, 149).ok], [true, false, false, true, false, true, false]);
  check('arches: floor-loaded 205 mm; roof arches from grade 150 x 205 (lower half) and 150 x 150 (upper half); from the walls 100 x 150', [chk(4, 205, 205).ok, chk(5, 150, 205).ok, chk(6, 150, 150).ok, chk(6, 150, 149).ok, chk(7, 100, 150).ok, chk(7, 99, 150).ok], [true, true, true, false, true, false]);
  check('thicknesses: splice plates 75 mm, floor planks 75 mm, roof decks 51 mm, stair treads 51 mm, spaced pieces 75 mm', [chk(8, 0, 75).ok, chk(8, 0, 74).ok, chk(9, 0, 75).ok, chk(10, 0, 51).ok, chk(10, 0, 50).ok, chk(11, 0, 51).ok, chk(12, 0, 75).ok, chk(12, 0, 60).ok], [true, false, true, true, false, true, true, false]);
}
let tt;
w.renderCalc('nfpa220'); w.calcResult('nfpa220');
tt = txt(w, 'xnc_results');
check('the default page (Type II 222) shows 2 h, 1 h, 0 (ب) and the 🔴 note', [tt.includes('2 h'), tt.includes('1 h'), tt.includes('0 (ب)'), tt.includes('🔴')], [true, true, true, true]);
set('xnc_t', '7'); w.calcResult('nfpa220'); tt = txt(w, 'xnc_results');
check('Type IV shows the heavy timber entries', [tt.includes('خشب ثقيل'), tt.includes('النوع IV (2HH)')], [true, true]);
set('xnc_m', '1'); w.calcResult('nfpa220'); tt = txt(w, 'xnc_results');
check('the heavy timber mode shows 205 × 205 mm with a pass mark and switches the groups', [tt.includes('205 × 205 mm'), tt.includes('✔'), doc.getElementById('xnc_g1').style.display === '', doc.getElementById('xnc_g0').style.display === 'none'], [true, true, true, true]);
set('xnc_w', '100'); set('xnc_d', '100'); w.calcResult('nfpa220'); tt = txt(w, 'xnc_results');
check('a 100 × 100 mm column fails', [tt.includes('✘')], [true]);
check('other reference codes open nfpa220 too', others('nfpa220', 'xnc_results'), [true, true, true]);
}
// ---------- part 248: NFPA 418-2016 rooftop heliports (`nfpa418`: category by helicopter length, foam rate 4.1 L/min m2, 10 minute fixed and 2 minute hose line, extinguisher rating, water demand of the largest system, geometric and construction limits) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xhpCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.01);
{
  const a = o => calc(Object.assign({len: 12, area: 200, conc: 3, hangarQ: 0, pitch: 1, ang: 120, sep: 12, tank: 20, fuel: 10, smoke: 16, roof: 16, heat: 4, hpitch: 0.5}, o));
  check('categories by overall length: under 15.2 m is H-1, 15.2 up to 24.4 is H-2, 24.4 up to 36.6 is H-3, 36.6 m and more is outside', [10, 12, 15.1, 15.2, 24.3, 24.4, 36.5, 36.6, 50].map(l => a({len: l}).cat), [0, 0, 0, 1, 1, 2, 2, -1, -1]);
  check('critical fire areas and extinguishers: H-1 34.8 m2 and 4-A:80-B, H-2 78.0 m2 and 10-A:120-B, H-3 133.8 m2 and 30-A:240-B', [a({len: 12}).A, a({len: 12}).ext, a({len: 20}).A, a({len: 20}).ext, a({len: 30}).A, a({len: 30}).ext, a({len: 40}).A], [34.8, '4-A:80-B', 78, '10-A:120-B', 133.8, '30-A:240-B', 0]);
  check('fixed foam on a 200 m2 pad: 820 L/min, 8200 L of solution in 10 minutes, 246 L of 3 % concentrate and 7954 L of water', [near(a({}).fixedQ, 820), near(a({}).fixedSol, 8200), near(a({}).fixedConc, 246), near(a({}).fixedWater, 7954)], [true, true, true, true]);
  check('hose line for an H-1 helicopter: 4.1 x 34.8 = 142.7 L/min for 2 minutes = 285.4 L of solution, 8.56 L of 3 % concentrate', [near(a({}).hoseQ, 142.68, 0.01), near(a({}).hoseSol, 285.36, 0.01), near(a({}).hoseConc, 8.5608, 0.001)], [true, true, true]);
  check('concentrate percentages: 1 % gives 82, 6 % gives 492 L for the fixed system', [near(a({conc: 1}).fixedConc, 82), near(a({conc: 6}).fixedConc, 492)], [true, true]);
  check('H-1 may use two portable foam extinguishers instead of the system; H-2 and H-3 may not', [a({len: 12}).h1port, a({len: 20}).h1port, a({len: 30}).h1port], [true, false, false]);
  check('the water demand is that of the largest system: pad 820 L/min unless the hangar system is larger', [Math.round(a({}).demand), a({}).demandBy, a({hangarQ: 1000}).demand, a({hangarQ: 1000}).demandBy, a({hangarQ: 820}).demandBy], [820, 0, 1000, 1, 0]);
  check('pad pitch from 0.5 to 2 percent', [a({pitch: 0.5}).pitchOk, a({pitch: 0.4}).pitchOk, a({pitch: 2}).pitchOk, a({pitch: 2.1}).pitchOk], [true, false, true, false]);
  check('egress points at least 90 degrees and 9.1 m apart', [a({ang: 90}).angOk, a({ang: 89}).angOk, a({sep: 9.1}).sepOk, a({sep: 9}).sepOk], [true, false, true, false]);
  check('tanks 15.2 m from the FATO edge, fueling equipment 7.6 m from hangars, no smoking and Class A roof covering within 15.2 m, heaters 3 m from engines, hangar floor pitch 0.5 %', [a({tank: 15.2}).tankOk, a({tank: 15}).tankOk, a({fuel: 7.6}).fuelOk, a({fuel: 7.5}).fuelOk, a({smoke: 15.2}).smokeOk, a({smoke: 15}).smokeOk, a({roof: 15.2}).roofOk, a({heat: 3}).heatOk, a({heat: 2.9}).heatOk, a({hpitch: 0.5}).hpitchOk, a({hpitch: 0.4}).hpitchOk], [true, false, true, false, true, false, true, true, false, true, false]);
}
let tt;
w.renderCalc('nfpa418'); w.calcResult('nfpa418');
tt = txt(w, 'xhp_results');
check('the default page shows H-1, 820 L/min, 8200 L, 4-A:80-B and the 🔴 note', [tt.includes('H-1'), tt.includes('820 L/min'), tt.includes('8200 L'), tt.includes('4-A:80-B'), tt.includes('🔴')], [true, true, true, true, true]);
set('xhp_m', '1'); w.calcResult('nfpa418'); tt = txt(w, 'xhp_results');
check('the site mode shows 1.0 % with a pass mark, the 2 h structure and switches the groups', [tt.includes('1.0 %'), tt.includes('✔'), tt.includes('2 h'), doc.getElementById('xhp_g1').style.display === '', doc.getElementById('xhp_g0').style.display === 'none'], [true, true, true, true, true]);
set('xhp_p', '3'); w.calcResult('nfpa418'); tt = txt(w, 'xhp_results');
check('a 3 % pitch shows the failed mark', [tt.includes('✘')], [true]);
check('other reference codes open nfpa418 too', others('nfpa418', 'xhp_results'), [true, true, true]);
}
// ---------- part 249: NFPA 51B-2014 hot work (`nfpa51b`: 11 m clearance, fire watch conditions, 30 minute watch after the work, 24 hour permit) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xhwCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.01);
{
  const a = o => calc(Object.assign({d: 8, spark: 0, easy: 0, open: 0, opp: 0, unobs: 0, combFloor: 0, permit: 8}, o));
  check('default: 11 m radius (380 m2 circle), combustibles at 8 m are inside, fire watch required for one reason, 30 minutes afterwards', [a({}).radius, near(a({}).areaM2, 380.13, 0.05), a({}).near, a({}).c1, a({}).reasons, a({}).watch, a({}).after, a({}).finalCheck], [11, true, true, true, 1, true, 0.5, false]);
  check('combustibles at exactly 11 m or farther are outside the radius and need no fire watch on their own: the PAI makes a final check after 30 minutes', [a({d: 11}).near, a({d: 11}).c1, a({d: 11}).watch, a({d: 11}).finalCheck, a({d: 10.9}).watch, a({d: 30}).near], [false, false, false, true, true, false]);
  check('the other three conditions each require a fire watch even when nothing is within 11 m', [a({d: 30, easy: 1}).watch, a({d: 30, open: 1}).watch, a({d: 30, opp: 1}).watch, a({d: 30, easy: 1, open: 1, opp: 1}).reasons, a({d: 30, easy: 1}).finalCheck], [true, true, true, 3, false]);
  check('extended spark travel of 20 m enlarges the clearance radius to 20 m (1257 m2); a travel of 5 m does not reduce it', [a({spark: 20}).radius, a({spark: 20}).extended, near(a({spark: 20}).areaM2, 1256.64, 0.05), a({spark: 5}).radius, a({spark: 5}).extended, a({spark: 20, d: 15}).near, a({spark: 20, d: 15}).c1], [20, true, true, 11, false, true, false]);
  check('a second fire watch is needed when materials cannot be observed by the first, only where a fire watch applies', [a({unobs: 1}).multi, a({d: 30, unobs: 1}).multi, a({}).multi], [true, false, false]);
  check('a permit is valid up to 24 hours', [a({permit: 24}).permitOk, a({permit: 24.1}).permitOk, a({permit: 8}).permitOk], [true, false, true]);
  check('combustible floors require sweeping and wetting', [a({combFloor: 1}).sweep, a({}).sweep], [true, false]);
}
let tt;
w.renderCalc('nfpa51b'); w.calcResult('nfpa51b');
tt = txt(w, 'xhw_results');
check('the default page shows 11.0 m, the fire watch, 30 min, 24 and the 🔴 note', [tt.includes('11.0 m'), tt.includes('مطلوب'), tt.includes('30 min'), tt.includes('24'), tt.includes('🔴')], [true, true, true, true, true]);
set('xhw_d', '30'); w.calcResult('nfpa51b'); tt = txt(w, 'xhw_results');
check('with nothing within 11 m the final check by the PAI is shown instead of the 30 minute watch', [tt.includes('غير مطلوب بالشروط الأربعة'), tt.includes('لا توجد')], [true, true]);
set('xhw_p', '30'); w.calcResult('nfpa51b'); tt = txt(w, 'xhw_results');
check('a 30 hour permit shows the failed mark', [tt.includes('✘')], [true]);
check('other reference codes open nfpa51b too', others('nfpa51b', 'xhw_results'), [true, true, true]);
}
// ---------- part 250: Syrian Arab Code annex 1 chapter 1 dead loads (`syrdl`: unit weights of materials, wall weights per m2, hollow-block weights, equivalent loads of heavy partitions) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xsdCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => calc(Object.assign({mode: 0, grp: 0, mat: 0, V: 1, t: 0.1, row: 0, plaster: 2, H: 3, Lw: 5, open: 0, hb: 0, tb: 0, sz: 0, nb: 8, A: 20, slab: 0, cont: 0, w: 4, L: 5, hp: 0.2, h: 0.5, sumW: 40}, o));
  check('plain concrete 24 kN/m3: 2 m3 weigh 48 kN, a 0.1 m layer 2.4 kN/m2; not a range', [a({V: 2}).wLo, near(a({}).aLo, 2.4), a({}).range, a({}).name], [48, true, false, 'الخرسانة العادية دون التسليح']);
  check('hollow block 14 to 19 kN/m3 is a range: 1 m3 weighs 14 to 19 kN', [a({mat: 7}).range, a({mat: 7}).wLo, a({mat: 7}).wHi], [true, 14, 19]);
  check('table sizes: 18 common materials, 41 construction materials, 27 metals, 17 woods', [J('XSD_M.map(g => g.length)'), J('XSD_M[1].findIndex(m => m[0].includes("20 cm"))')], [[18, 41, 27, 17], 29]);
  check('construction table: concrete block hollow 20 cm 13.5, reinforced concrete 2 % 25.3 and 5 % 26, mortar 22, lightweight 12 to 20', [a({grp: 1, mat: 29}).lo, a({grp: 1, mat: 37}).lo, a({grp: 1, mat: 38}).lo, a({grp: 1, mat: 34}).lo, a({grp: 1, mat: 39}).hi], [13.5, 25.3, 26, 22, 20]);
  check('metals and woods: steel 77 kN/m3 (metals 16), lead 114, oak 7.2, pine 5.3', [a({grp: 2, mat: 16}).lo, a({grp: 2, mat: 11}).lo, a({grp: 3, mat: 0}).lo, a({grp: 3, mat: 16}).lo], [77, 114, 7.2, 5.3]);
  check('wall table: every plastered value is the bare wall plus 0.44 (one face) and 0.88 (two faces) of 20 mm mortar at 22 kN/m3', [J('XSD_W.every(w => Math.abs(w[4] - w[3] - 0.44) < 0.005 && (w[5] === null || Math.abs(w[5] - w[3] - 0.88) < 0.005))'), J('XSD_W.length')], [true, 29]);
  check('solid clay brick 120 mm wall: 2.44 bare, 2.88 and 3.32 plastered; 3 m x 5 m less a 2 m2 opening = 13 m2 gives 43.16 kN and 9.96 kN/m', [a({mode: 1}).w0, a({mode: 1, plaster: 1}).w, a({mode: 1}).w, near(a({mode: 1, open: 2}).total, 43.16, 0.005), near(a({mode: 1}).line, 9.96), a({mode: 1}).net, a({mode: 1, open: 2}).net], [2.44, 2.88, 3.32, true, true, 15, 13]);
  check('stone wall has no plastered-both-faces value; light and heavy classification at 1.5 kN/m2', [a({mode: 1, row: 26, plaster: 2}).ok, a({mode: 1, row: 26, plaster: 1}).w, a({mode: 1, row: 2}).heavy, a({mode: 1, row: 2, plaster: 0}).heavy, a({mode: 1, row: 2, plaster: 0}).w], [false, 8.14, true, false, 1.22]);
  check('hollow blocks: h1 14 cm 2.5 cm 38/35 10 kg; 3 cm 35/32 10.9 kg; h1 36 cm 3 cm 38/35 19.6; 8 per m2 of the first = 80 kg/m2', [a({mode: 2}).W, a({mode: 2, tb: 1, sz: 1}).W, a({mode: 2, hb: 12, tb: 1}).W, a({mode: 2}).perM2, a({mode: 2}).total], [10, 10.9, 19.6, 80, 1600]);
  check('heavy wall on a one-way slab perpendicular to the span: Wp = 4 x 3 = 12 kN/m; We = 2 Wp/L = 4.8, 1.75 Wp/L = 4.2 and 1.5 Wp/L = 3.6 kN/m2', [a({mode: 3}).Wp, near(a({mode: 3}).We, 4.8), near(a({mode: 3, cont: 1}).We, 4.2), near(a({mode: 3, cont: 2}).We, 3.6)], [12, true, true, true]);
  check('wall parallel to the span: e = hp + 0.3 L + h = 0.2 + 1.5 + 0.5 = 2.2 m and We = 12 / 2.2; h limited to 0.3 L gives e = hp + 0.6 L = 3.2 m', [near(a({mode: 3, slab: 1}).e, 2.2), near(a({mode: 3, slab: 1}).We, 5.4545, 0.001), near(a({mode: 3, slab: 1, h: 2}).e, 3.2), near(a({mode: 3, slab: 1, h: 2}).emax, 3.2)], [true, true, true, true]);
  check('two-way slab: We = 1.5 x 40 / 20 = 3 kN/m2; classification heavy from 1.5 kN/m2 of wall', [a({mode: 3, slab: 2}).We, a({mode: 3, w: 1.4}).heavy, a({mode: 3, w: 1.5}).heavy], [3, false, true]);
}
let tt;
w.renderCalc('syrdl'); w.calcResult('syrdl');
tt = txt(w, 'xsd_results');
check('the default page shows 24.0 kN/m³, 2.40 kN/m² and the 🔴 note', [tt.includes('24.0 kN/m³'), tt.includes('2.40 kN/m²'), tt.includes('🔴')], [true, true, true]);
set('xsd_gr', '3'); w.calcResult('syrdl');
check('choosing the woods group rebuilds the material list to 17 entries', [doc.getElementById('xsd_mt').options.length], [17]);
set('xsd_m', '1'); w.calcResult('syrdl'); tt = txt(w, 'xsd_results');
check('the wall mode shows 3.320 kN/m², 9.96 kN/m and 49.8 kN and switches the groups', [tt.includes('3.320 kN/m²'), tt.includes('9.96 kN/m'), tt.includes('49.8 kN'), doc.getElementById('xsd_g1').style.display === '', doc.getElementById('xsd_g0').style.display === 'none'], [true, true, true, true, true]);
set('xsd_m', '2'); w.calcResult('syrdl'); tt = txt(w, 'xsd_results');
check('the hollow block mode shows 13.3 kg', [tt.includes('13.3 kg')], [true]);
set('xsd_m', '3'); w.calcResult('syrdl'); tt = txt(w, 'xsd_results');
check('the heavy partition mode shows 4.80 kN/m² and the heavy classification', [tt.includes('4.80 kN/m²'), tt.includes('ثقيل')], [true, true]);
check('other reference codes open syrdl too', others('syrdl', 'xsd_results'), [true, true, true]);
}
// ---------- part 251: Syrian Arab Code annex 1 chapter 2 live loads (`syrll`: Table 2-1 loads by use, Table 2-2 reduction in multi-storey buildings, light partition equivalent load, balcony barrier forces) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xslCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => calc(Object.assign({mode: 0, use: 5, hs: 3, A: 100, n: 8, P: 2, w: 1.2, qLive: 2, kind: 0, len: 10, hb: 1}, o));
  check('table has 46 uses; residential rooms 2 kN/m2 and 1.4 kN concentrated; 100 m2 carry 200 kN', [J('XSL_U.length'), a({}).q, a({}).Q, a({}).total, a({}).kind, a({}).Qkind], [46, 2, 1.4, 200, 'f', 'f']);
  check('hotel corridors 5 and 4.5, hospital operating rooms at least 3 and 4.5, archives at least 5 with a computed concentrated load', [a({use: 8}).q, a({use: 8}).Q, a({use: 13}).kind, a({use: 13}).q, a({use: 13}).Q, a({use: 16}).kind, a({use: 16}).q, a({use: 16}).Qkind], [5, 4.5, 'm', 3, 4.5, 'm', 5, 'c']);
  check('roofs: 1.0 kN/m2 flat, 0.5 kN/m2 steep, accessible roofs at least 2; balconies 4 and 5', [a({use: 0}).q, a({use: 1}).q, a({use: 2}).q, a({use: 2}).kind, a({use: 3}).q, a({use: 4}).q, a({use: 0}).Qkind], [1, 0.5, 2, 'm', 4, 5, 'n']);
  check('book stores: 2.4 per metre of height but not less than 7 (3 m gives 7.2, 2 m gives 7); paper stores 4 per metre (12); cold stores 5 per metre not less than 15 (2 m gives 15, 4 m gives 20)', [near(a({use: 30}).q, 7.2), a({use: 30, hs: 2}).q, a({use: 31}).q, a({use: 32, hs: 2}).q, a({use: 32, hs: 4}).q, a({use: 30}).byH, a({use: 29}).byH], [true, 7, 12, 15, 20, true, false]);
  check('the starred uses (dancing, sports stands, stage) carry a dynamic factor 1.1: 6.6 kN/m2; others do not', [a({use: 24}).dyn, a({use: 26}).dyn, a({use: 27}).dyn, a({use: 23}).dyn, near(a({use: 24}).qDyn, 6.6), a({use: 23}).qDyn], [true, true, true, false, true, 6]);
  check('car parks: 6 kN/m2 and 9 kN for light cars; heavier cars computed not less than 6 and 9; the car flag applies to both', [a({use: 38}).q, a({use: 38}).Q, a({use: 38}).kind, a({use: 39}).kind, a({use: 39}).Qkind, a({use: 38}).car, a({use: 39}).car, a({use: 5}).car], [6, 9, 'f', 'm', 'm', true, true, false]);
  check('machine rooms 7.5 kN/m2 and 4.5 kN; printing presses at least 20; studios 4 with a computed concentrated load', [a({use: 43}).q, a({use: 43}).Q, a({use: 45}).q, a({use: 45}).kind, a({use: 44}).q, a({use: 44}).Qkind], [7.5, 4.5, 20, 'm', 4, 'c']);
  check('Table 2-2 factors by level from the top: 1, 1, 0.9, 0.8, 0.7, 0.6, then 0.5 for the sixth below and lower', [0, 1, 2, 3, 4, 5, 6, 7, 15].map(k => J('xslFactor(' + k + ')')), [1, 1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5, 0.5]);
  check('eight storeys with 2 kN each: factors sum 6.0, so 12 kN instead of 16 kN, saving 4 kN, last factor 0.5', [a({mode: 1}).allowed, near(a({mode: 1}).sum, 6), near(a({mode: 1}).sumP, 12), a({mode: 1}).full, near(a({mode: 1}).saving, 4), a({mode: 1}).last], [true, true, true, 16, true, 0.5]);
  check('five storeys or fewer: no reduction; six storeys give factors summing 5.0', [a({mode: 1, n: 5}).allowed, a({mode: 1, n: 5}).sum, a({mode: 1, n: 5}).saving, a({mode: 1, n: 6}).allowed, near(a({mode: 1, n: 6}).sum, 5)], [false, 5, 0, true, true]);
  check('light partition equivalent load: 0.75 at 1.0 kN/m2 up to 1.75 at 1.5 (1.15 at 1.2; 0.95 at 1.1); below 1.0 the chart minimum 0.75; heavy above 1.5', [a({mode: 2, w: 1}).eq, near(a({mode: 2, w: 1.2}).eq, 1.15), near(a({mode: 2, w: 1.1}).eq, 0.95), near(a({mode: 2, w: 1.5}).eq, 1.75), a({mode: 2, w: 0.8}).eq, a({mode: 2, w: 0.8}).below, a({mode: 2, w: 1.6}).light, a({mode: 2, w: 1.5}).light], [0.75, true, true, true, 0.75, true, false, true]);
  check('the equivalent load is neglected when the live load exceeds 6 kN/m2', [a({mode: 2, qLive: 6.5}).neglect, a({mode: 2, qLive: 6.5}).total, a({mode: 2, qLive: 6}).neglect, near(a({mode: 2, qLive: 3}).total, 1.15), a({mode: 2, w: 1.7}).total], [true, 0, false, true, 0]);
  check('balcony barriers: 1 kN/m in ordinary buildings, 3 kN/m at panic barriers; 10 m gives 10 or 30 kN; overturning 1.5 times the moment at 1 m', [a({mode: 3}).F, a({mode: 3, kind: 1}).F, a({mode: 3}).line, a({mode: 3, kind: 1}).line, a({mode: 3, kind: 1}).M, a({mode: 3, kind: 1}).Mreq, near(a({mode: 3, hb: 1.2}).Mreq, 1.8)], [1, 3, 10, 30, 3, 4.5, true]);
}
let tt;
w.renderCalc('syrll'); w.calcResult('syrll');
tt = txt(w, 'xsl_results');
check('the default page shows 2.0 kN/m², 1.4 kN, 200.0 kN and the 🔴 note', [tt.includes('2.0 kN/m²'), tt.includes('1.4 kN'), tt.includes('200.0 kN'), tt.includes('🔴')], [true, true, true, true]);
set('xsl_m', '1'); w.calcResult('syrll'); tt = txt(w, 'xsl_results');
check('the reduction mode shows 12.0 kN and 16.0 kN and switches the groups', [tt.includes('12.0 kN'), tt.includes('16.0 kN'), doc.getElementById('xsl_g1').style.display === '', doc.getElementById('xsl_g0').style.display === 'none'], [true, true, true, true]);
set('xsl_m', '2'); w.calcResult('syrll'); tt = txt(w, 'xsl_results');
check('the light wall mode shows 1.15 kN/m²', [tt.includes('1.15 kN/m²')], [true]);
set('xsl_m', '3'); w.calcResult('syrll'); tt = txt(w, 'xsl_results');
check('the barrier mode shows 1.0 kN/m and 10.0 kN', [tt.includes('1.0 kN/m'), tt.includes('10.0 kN')], [true, true]);
check('other reference codes open syrll too', others('syrll', 'xsl_results'), [true, true, true]);
}
// ---------- part 252: Syrian Arab Code annex 1 chapters 3 and 4 (`syrdyn`: machinery factor alpha, lifts and cranes, car park barriers, snow load, thermal and shrinkage effects) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xsyCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => calc(Object.assign({mode: 0, useA: 1, L: 5, G: 20, P: 10, Pd: 10, W: 20, crane: 1, wheel: 100, drive: 100, trolley: 60, empty: 80, mass: 1500, v: 4.5, dc: 100, rampL: 15, alt: 600, slope: 20, depth: 0, zone: 1, dt: 15, len: 30}, o));
  check('alpha = 0.4 / (1 + L/5) + 0.6 / (1 + G/P) = 0.2 + 0.2 = 0.4; the dynamic load 10 grows to 14; the simplified alpha 0.3 gives 13', [near(a({}).alpha, 0.4), near(a({}).Pd, 14), near(a({}).add, 4), a({useA: 0}).alpha, near(a({useA: 0}).Pd, 13)], [true, true, true, 0.3, true]);
  check('a long element and a heavy permanent load lower alpha: L 20, G 100, P 10 gives 0.4/5 + 0.6/11 = 0.1345', [near(a({L: 20, G: 100}).alpha, 0.08 + 0.6 / 11, 0.0005)], [true]);
  check('lifts: 20 kN moving weight needs 40 kN of equivalent dynamic load, 60 kN in total', [a({mode: 1}).dynLift, a({mode: 1}).totLift], [40, 60]);
  check('cranes: factors 1.1, 1.25 and 1.35; a 100 kN wheel becomes 125 kN; longitudinal 20 % of 100 = 20, lateral 20 % of 60 = 12, end stop half of 80 = 40', [a({mode: 1, crane: 0}).cf, a({mode: 1}).cf, a({mode: 1, crane: 2}).cf, a({mode: 1}).vert, a({mode: 1}).longi, near(a({mode: 1}).lat, 12), a({mode: 1}).stop], [1.1, 1.25, 1.35, 125, 20, true, 40]);
  check('car park barrier: cars up to 1500 kg use 150 kN over 1.5 m = 100 kN/m; the formula gives 151.9 kN for 1500 kg at 4.5 m/s; 16.2 km/h', [a({mode: 2}).heavy, a({mode: 2}).F, near(a({mode: 2}).F0, 151.875), a({mode: 2}).per, near(a({mode: 2}).vkmh, 16.2)], [false, 150, true, 100, true]);
  check('a 2000 kg car: F = 0.5 x 2000 x 4.5^2 / 100 = 202.5 kN, applied at 0.375 m; a 3000 kg car 303.75 kN at the bumper level', [a({mode: 2, mass: 2000}).heavy, near(a({mode: 2, mass: 2000}).F, 202.5), a({mode: 2, mass: 2000}).hF, near(a({mode: 2, mass: 3000}).F, 303.75), a({mode: 2, mass: 3000}).hF], [true, true, 0.375, true, null]);
  check('ramps: half the force at 61 cm; ramp end barriers twice the force for ramps over 20 m', [a({mode: 2}).ramp, a({mode: 2}).rampEnd, a({mode: 2, rampL: 20}).rampEnd, a({mode: 2, rampL: 25}).rampEnd, a({mode: 2}).rampH], [75, 150, 150, 300, 0.61]);
  check('snow Table 4-1: nothing to 250 m; (h/1000) - 0.25 up to 500 m; (h/400) - 1 up to 1500; (h/250) - 3.25 up to 2500', [0, 200, 250, 300, 500, 600, 1000, 1500, 2000, 2500].map(h => Math.round(J('xsySnow(' + h + ')') * 10000) / 10000), [0, 0, 0, 0.05, 0.25, 0.5, 1.5, 2.75, 4.75, 6.75]);
  check('snow slope factor (75 - a)/50: 1 up to 25 degrees, 0.9, 0.8, 0.7 and 0.6 at 30, 35, 40 and 45; the design load at 600 m and 20 degrees is 0.5 kN/m2 (50 kgf/m2)', [20, 25, 30, 35, 40, 45].map(s => Math.round(J('xsySlope(' + s + ')') * 100) / 100), [1, 1, 0.9, 0.8, 0.7, 0.6]);
  check('design snow load: 600 m flat roof 0.5 kN/m2; 1000 m at 35 degrees 1.5 x 0.8 = 1.2 kN/m2; depth 0.4 m of snow at 2.5 kN/m3 = 1 kN/m2; beyond-table flags', [a({mode: 3}).s, near(a({mode: 3, alt: 1000, slope: 35}).s, 1.2), a({mode: 3}).kgf, a({mode: 3, depth: 0.4}).depth, a({mode: 3, alt: 2600}).over, a({mode: 3, slope: 50}).beyond, a({mode: 3}).over], [0.5, true, 50, 1, true, true, false]);
  check('Table 4-3: very humid +-15 and +5 / -25; humid +-20 and +10 / -30; medium +-25 and +10 / -35; dry +-30 and +10 / -45', [0, 1, 2, 3].map(z => a({mode: 4, zone: z})).map(r => [r.dt, r.rise, r.drop]), [[15, 5, -25], [20, 10, -30], [25, 10, -35], [30, 10, -45]]);
  check('thermal strain 1e-5 x 15 = 1.5e-4: 4.5 mm over 30 m; a humid zone +-20 gives 6 mm; the drop of 30 gives 9 mm; the shrinkage case -20 C gives 6 mm', [near(a({mode: 4}).eps, 1.5e-4, 1e-9), near(a({mode: 4}).dL, 4.5), near(a({mode: 4}).dLT, 6), near(a({mode: 4}).dLdrop, 9), near(a({mode: 4}).dLshr, 6)], [true, true, true, true, true]);
}
let tt;
w.renderCalc('syrdyn'); w.calcResult('syrdyn');
tt = txt(w, 'xsy_results');
check('the default page shows alpha 0.400, the corrected load 14.00 and the 🔴 note', [tt.includes('0.400'), tt.includes('14.00'), tt.includes('🔴')], [true, true, true]);
set('xsy_m', '1'); w.calcResult('syrdyn'); tt = txt(w, 'xsy_results');
check('the lift and crane mode shows 60.0 kN and 125.0 kN and switches the groups', [tt.includes('60.0 kN'), tt.includes('125.0 kN'), doc.getElementById('xsy_g1').style.display === '', doc.getElementById('xsy_g0').style.display === 'none'], [true, true, true, true]);
set('xsy_m', '2'); w.calcResult('syrdyn'); tt = txt(w, 'xsy_results');
check('the barrier mode shows 150 kN and 100.0 kN/m', [tt.includes('150 kN'), tt.includes('100.0 kN/m')], [true, true]);
set('xsy_m', '3'); w.calcResult('syrdyn'); tt = txt(w, 'xsy_results');
check('the snow mode shows 0.50 kN/m²', [tt.includes('0.50 kN/m²')], [true]);
set('xsy_m', '4'); w.calcResult('syrdyn'); tt = txt(w, 'xsy_results');
check('the thermal mode shows ± 20 °C and 4.5 mm', [tt.includes('± 20 °C'), tt.includes('4.5 mm')], [true, true]);
check('other reference codes open syrdyn too', others('syrdyn', 'xsy_results'), [true, true, true]);
}
// ---------- part 253: Syrian Arab Code annex 1 chapter 5 wind loads (`syrwind`: station speeds, S1 S2 S3, dynamic pressure q = 0.613 Vs2, wall and roof pressure coefficients, force coefficient Cf and friction) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xswCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => calc(Object.assign({mode: 0, st: 17, V: 45, S1: 1, cat: 0, cls: 1, H: 12, S3: 1, Cp: 1, h: 12, w: 10, l: 15, ang: 0, q: 700, cpi: 0, angle: 20, b: 20, d: 15, hh: 30, surf: 0}, o));
  check('20 stations; Mezzeh (Damascus) 55 and 48 m/s; Salamiyah (Salnfah) 67 and 58; Raqqa 40 and 35; and V = 1.15 Vk holds within 0.6 m/s for every station', [J('XSW_ST.length'), J('XSW_ST[17]'), J('XSW_ST[11]'), J('XSW_ST[8]'), J('XSW_ST.every(s => Math.abs(s[1] - 1.15 * s[2]) <= 0.6)')], [20, ['المزة (دمشق)', 55, 48], ['صلنفة', 67, 58], ['الرقة', 40, 35], true]);
  check('S2 table corners: category 1 class A 0.83 at 3 m and 1.27 at 200 m; category 4 class C 0.47 at 3 m and 1.18 at 200 m; category 3 class B at 100 m 1.12', [J('xswS2(0,0,3)'), J('xswS2(0,0,200)'), J('xswS2(3,2,3)'), J('xswS2(3,2,200)'), J('xswS2(2,1,100)')], [0.83, 1.27, 0.47, 1.18, 1.12]);
  check('S2 is flat below 3 m and above 200 m and interpolates linearly: category 1 class B at 12.5 m = 0.97, at 1 m 0.78, at 250 m 1.24', [near(J('xswS2(0,1,12.5)'), 0.97), J('xswS2(0,1,1)'), J('xswS2(0,1,250)'), a({H: 1}).s2Below, a({H: 250}).s2Above, a({}).s2Above], [true, 0.78, 1.24, true, true, false]);
  check('every row of the S2 table has twelve values that never decrease with height within a column', [J('XSW_S2.every(r => r.length === 12)'), J('XSW_S2.every((r, i) => i === 0 || r.every((x, c) => x >= XSW_S2[i - 1][c]))')], [true, true]);
  check('Mezzeh, category 1 class B at 10 m: V 55, S2 0.95, Vs 52.25 m/s, q = 0.613 x 52.25^2 = 1673.5 N/m2 = 170.6 kgf/m2', [a({H: 10}).V, a({H: 10}).S2, near(a({H: 10}).Vs, 52.25), near(a({H: 10}).q, 1673.5, 0.1), near(a({H: 10}).kgf, 170.6, 0.1)], [55, 0.95, true, true, true]);
  check('manual V of 45 m/s gives Vk = 39.1; S1 1.2 and S3 1.1 multiply the speed; Cp 0.8 scales the pressure', [near(a({st: -1}).Vk, 39.13, 0.01), near(a({st: -1, H: 10, S1: 1.2, S3: 1.1}).Vs, 45 * 0.95 * 1.2 * 1.1, 0.001), near(a({H: 10, Cp: 0.8}).p, 0.8 * a({H: 10}).q, 0.001)], [true, true, true]);
  check('ratio bands: h/w up to 0.5 band 0, up to 1.5 band 1, beyond band 2; l/w up to 1.5 band 0 else band 1; out-of-table flags', [[5, 10, 10].concat([0]).slice(0, 3), [0.5, 0.51, 1.5, 1.51].map(r => J('xswBands(' + r * 10 + ',10,15).hb')), [1.5, 1.51].map(r => J('xswBands(10,10,' + r * 10 + ').lb')), J('xswBands(60,10,15).hwOut'), J('xswBands(10,10,40).lwOut'), J('xswBands(10,10,10).lwOut')].slice(1), [[0, 1, 1, 2], [0, 1], true, true, false]);
  check('wall Cpe for h/w 1.2 and l/w 1.5: 0 degrees A +0.7, B -0.25, C -0.6, D -0.6 (local -1.1); 90 degrees -0.6, -0.6, +0.7, -0.25', [a({mode: 1}).vals, a({mode: 1, ang: 1}).vals, a({mode: 1}).loc], [[0.7, -0.25, -0.6, -0.6], [-0.6, -0.6, 0.7, -0.25], -1.1]);
  check('wall table corners: low squat 0 degrees +0.7 -0.2 -0.5 -0.5 (local -0.8); tall slender l/w 1.2 gives +0.8 and local -1.2; tall long B -0.4', [a({mode: 1, h: 2, w: 10, l: 12}).vals, a({mode: 1, h: 2, w: 10, l: 12}).loc, a({mode: 1, h: 30, w: 10, l: 12}).vals[0], a({mode: 1, h: 30, w: 10, l: 12}).loc, a({mode: 1, h: 30, w: 10, l: 30}).vals[1]], [[0.7, -0.2, -0.5, -0.5], -0.8, 0.8, -1.2, -0.4]);
  check('net wall pressure with Cpi -0.3 at q = 700: A (0.7 + 0.3) x 700 = 700, B 35, C -210; with Cpi +0.2: A 350', [near(a({mode: 1}).net[0], 700), near(a({mode: 1}).net[1], 35), near(a({mode: 1}).net[2], -210), a({mode: 1}).cpi, a({mode: 1, cpi: 1}).cpi, near(a({mode: 1, cpi: 1}).net[0], 350)], [true, true, true, -0.3, 0.2, true]);
  check('roof, band 1 at 20 degrees: EF -0.7, GH -0.5, EG -0.8, FH -0.6, local -1.5 -1.5 -1.5 -1.0; interpolated at 15 degrees EF -0.9', [a({mode: 2}).gen, a({mode: 2}).loc, near(a({mode: 2, angle: 15}).gen[0], -0.9)], [[-0.7, -0.5, -0.8, -0.6], [-1.5, -1.5, -1.5, -1], true]);
  check('roof, low building: 45 degrees EF +0.3 and 60 degrees +0.7; tall band 40 degrees EF -0.2 and 50 degrees +0.2; beyond the last angle flagged', [a({mode: 2, h: 2, w: 10, l: 12, angle: 45}).gen[0], a({mode: 2, h: 2, w: 10, l: 12, angle: 60}).gen[0], a({mode: 2, h: 30, w: 10, l: 12, angle: 40}).gen[0], a({mode: 2, h: 30, w: 10, l: 12, angle: 50}).gen[0], a({mode: 2, angle: 70}).over, a({mode: 2, angle: 60}).over], [0.3, 0.7, -0.2, 0.2, true, false]);
  check('Cf at b/d 1: 0.9 up to h/b 1/2, 0.95 at 1, 1.05 at 4, 1.4 at 20, 1.025 at 3; b/d 3 at h/b 2 gives 1.25; b/d 4 and over 1.2 to 1.6; b/d 1/4 and under 0.7', [J('xswCf(1,0.5)'), J('xswCf(1,1)'), J('xswCf(1,4)'), J('xswCf(1,20)'), near(J('xswCf(1,3)'), 1.025), J('xswCf(3,2)'), J('xswCf(5,0.5)'), J('xswCf(5,6)'), J('xswCf(0.2,6)')], [0.9, 0.95, 1.05, 1.4, true, 1.25, 1.2, 1.6, 0.75]);
  check('Cf interpolates between b/d rows: b/d 1.25 at h/b 1 is 0.975; the example b 20, d 15, h 30 gives Cf 1.0083, Ae 600 m2, F 423.5 kN', [near(J('xswCf(1.25,1)'), 0.975), near(a({mode: 3}).Cf, 1.00833, 0.0005), a({mode: 3}).Ae, near(a({mode: 3}).F / 1000, 423.5, 0.1)], [true, true, 600, true]);
  check('friction: surface coefficients 0.01, 0.02, 0.04; none when d is under 4h; b 20, h 10, d 60 gives 0.01 x 700 x [20 x 20 + 2 x 10 x 20] = 5.6 kN', [a({mode: 3, surf: 1}).cfr, a({mode: 3, surf: 2}).cfr, a({mode: 3}).long, a({mode: 3}).Ff, a({mode: 3, hh: 10, d: 60}).long, near(a({mode: 3, hh: 10, d: 60}).Ff / 1000, 5.6, 0.001)], [0.02, 0.04, false, 0, true, true]);
}
let tt;
w.renderCalc('syrwind'); w.calcResult('syrwind');
tt = txt(w, 'xsw_results');
check('the default page shows 55.0 m/s, the design speed 53.1 m/s and the 🔴 note', [tt.includes('55.0 m/s'), tt.includes('53.1 m/s'), tt.includes('🔴')], [true, true, true]);
set('xsw_m', '1'); w.calcResult('syrwind'); tt = txt(w, 'xsw_results');
check('the wall mode shows +0.70, 700 N/m² and switches the groups', [tt.includes('+0.70'), tt.includes('700 N/m²'), doc.getElementById('xsw_g1').style.display === '', doc.getElementById('xsw_g0').style.display === 'none'], [true, true, true, true]);
set('xsw_m', '2'); w.calcResult('syrwind'); tt = txt(w, 'xsw_results');
check('the roof mode shows 0.70 for the EF zone and the local coefficients', [tt.includes('0.70'), tt.includes('المعاملات الموضعية')], [true, true]);
set('xsw_m', '3'); w.calcResult('syrwind'); tt = txt(w, 'xsw_results');
check('the force mode shows 423.5 kN', [tt.includes('423.5 kN')], [true]);
check('other reference codes open syrwind too', others('syrwind', 'xsw_results'), [true, true, true]);
}
// ---------- part 254: Syrian Arab Code for unreinforced load-bearing walls chapter 5 (`syrwall`: basic allowable compressive stresses Tables 5-1 to 5-3, effective height and slenderness, buckling reduction Table 5-4, eccentricity factor, wind and concentrated load) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xsaCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
const red = (sb, lam) => J('xsaRed(' + sb + ',' + lam + ')');
{
  const a = o => calc(Object.assign({mat: 2, a: 1, b: 1, H: 3, t: 0.25, L: 0, open: 0, ho: 0, k: 1.5, eq: 0, N: 100, e: 0.02, wind: 0, P: 0, lb: 20, wb: 25}, o));
  check('Table 5-1 rubble stone: 150 kgf/cm2 stone gives 2 2 2 3 across the mortars; 250 gives 3 3 4 5; 600 and over gives 5 7 8 10', [[0, 1, 2, 3].map(m => J('xsaBasic(0,0,' + m + ')')), [0, 1, 2, 3].map(m => J('xsaBasic(0,1,' + m + ')')), [0, 1, 2, 3].map(m => J('xsaBasic(0,3,' + m + ')'))], [[2, 2, 2, 3], [3, 3, 4, 5], [5, 7, 8, 10]]);
  check('Table 5-1 dressed stone: 150 gives 7 9 11 13; 400 gives 14 17 20 23; 600 and over gives 18 23 27 31', [[0, 1, 2, 3].map(m => J('xsaBasic(1,0,' + m + ')')), [0, 1, 2, 3].map(m => J('xsaBasic(1,2,' + m + ')')), [0, 1, 2, 3].map(m => J('xsaBasic(1,3,' + m + ')'))], [[7, 9, 11, 13], [14, 17, 20, 23], [18, 23, 27, 31]]);
  check('Table 5-2 artificial stone: 75 gives 8 9 10 11; 100 gives 9 10 11 12; 150 gives 10 12 14 16; 200 gives 12 15 17 19', [0, 1, 2, 3].map(s => [0, 1, 2, 3].map(m => J('xsaBasic(2,' + s + ',' + m + ')'))), [[8, 9, 10, 11], [9, 10, 11, 12], [10, 12, 14, 16], [12, 15, 17, 19]]);
  check('Table 5-3 concrete: 100 / 120 / 150 give 18 / 22 / 27 plain and 15 / 18 / 22 for concrete with embedded stones', [[0, 1, 2].map(c => J('xsaBasic(3,' + c + ',0)')), [0, 1, 2].map(c => J('xsaBasic(4,' + c + ',0)'))], [[18, 22, 27], [15, 18, 22]]);
  check('Table 5-4 nodes: slenderness 12 gives 6 7 8 10 11 12 13 15 22 for basic stresses 8 to 30; 14 gives 4 5 6 7 8 8 9 10 14; 16 gives 3 3 4 5 6 6 6 7 10; 18 gives 3 3 4 4 4 5 7 from 12; 20 gives 3 and 5 at 22 and 30', [[8, 10, 12, 14, 16, 18, 20, 22, 30].map(s => red(s, 12).v), [8, 10, 12, 14, 16, 18, 20, 22, 30].map(s => red(s, 14).v), [8, 10, 12, 14, 16, 18, 20, 22, 30].map(s => red(s, 16).v), [12, 14, 16, 18, 20, 22, 30].map(s => red(s, 18).v), [red(22, 20).v, red(30, 20).v]], [[6, 7, 8, 10, 11, 12, 13, 15, 22], [4, 5, 6, 7, 8, 8, 9, 10, 14], [3, 3, 4, 5, 6, 6, 6, 7, 10], [3, 3, 4, 4, 4, 5, 7], [3, 5]]);
  check('no reduction up to slenderness 10; linear interpolation between rows and columns: 8.5 at 11 for basic 10, 6.5 at 12 for basic 9', [red(10, 8).v, red(10, 10).v, near(red(10, 11).v, 8.5), near(red(9, 12).v, 6.5), near(red(11, 13).v, (5.5 + 8.5 + 4.5 + 6.5) / 4 - 0.25 + 0, 2)], [10, 10, true, true, true]);
  check('not permitted: slenderness over 20, a basic stress below 8 above slenderness 10, and cells the table leaves blank; a basic stress over 30 uses the 30 column', [red(10, 21).ok, red(7, 12).ok, red(10, 18).ok, red(8, 16).ok, red(14, 20).ok, red(31, 12).over, red(31, 12).v, red(5, 8).ok, red(5, 8).v], [false, false, false, true, false, true, 22, true, 5]);
  check('default: effective height 3, slenderness 12, basic stress 10 reduced to 7; centre stress 4.08, edges 6.04 and 2.12, factor eta 1.5, limit 10.5', [a({}).sb, a({}).Ho, a({}).Hb, a({}).lam, a({}).red, near(a({}).sc, 4.0789, 0.001), near(a({}).s1, 6.0367, 0.001), near(a({}).s2, 2.121, 0.001), a({}).eta, near(a({}).edgeLim, 10.5), a({}).okC, a({}).okE], [10, 3, 3, 12, 7, true, true, true, 1.5, true, true, true]);
  check('wall between vertical supports: L 4 m and H 3 m (H/L 0.75) gives Hb = 3 / 1.75 = 1.714 and slenderness 6.86, no reduction; H/L under 0.5 or a wide opening treats it as a column', [a({L: 4}).wallOk, near(a({L: 4}).Hb, 1.7143), near(a({L: 4}).lam, 6.857, 0.001), a({L: 4}).red, a({L: 8}).wallOk, a({L: 8}).Hb, a({L: 6, open: 2.5}).wallOk, a({L: 6, open: 2}).wallOk], [true, true, true, 10, false, 3, false, true]);
  check('support conditions: free at the top Ho = 2H = 6 (slenderness 24 is not permitted); partial restraint 1.5 H = 4.5 gives slenderness 18', [a({ho: 2}).Ho, a({ho: 2}).lam, a({ho: 2}).redOk, a({ho: 1}).Ho, a({ho: 1}).lam, a({ho: 1}).redOk], [6, 24, false, 4.5, 18, false]);
  check('equivalent slenderness overrides the computed one: 10 gives the full 10, 12 gives 7, 14 gives 5 for basic 10', [a({eq: 1}).lam, a({eq: 1}).red, a({eq: 2}).lam, a({eq: 2}).red, a({eq: 3}).lam, a({eq: 3}).red], [10, 10, 12, 7, 14, 5]);
  check('eccentricity outside the middle third: e = 0.1 m with 100 kN/m gives edge stress 2 N / (3 x 0.025) = 27.2 kgf/cm2; e at half the thickness is unstable; with e = 0 eta is 1', [a({e: 0.1, N: 100}).core, near(a({e: 0.1, N: 100}).s1, 27.19, 0.01), a({e: 0.1, N: 100}).s2, a({e: 0.125}).s1 === null, a({e: 0}).eta, near(a({e: 0}).s1, a({e: 0}).sc, 1e-9)], [false, true, 0, true, 1, true]);
  check('wind raises the edge limit by 25 %: 13.125 instead of 10.5; the centre check is unchanged', [near(a({wind: 1}).edgeLim, 13.125), near(a({wind: 1}).red, 7), a({N: 200}).okC, a({N: 100}).okC], [true, true, false, true]);
  check('a concentrated load of 50 kN on 20 x 25 cm gives 10.2 kgf/cm2 against 1.5 x 7 = 10.5; 60 kN fails; a bearing of 20 cm exceeds max(15, 2/3 of 25 cm = 16.7)', [near(a({P: 50}).bearS, 10.197, 0.01), near(a({P: 50}).bearLim, 10.5), a({P: 50}).okB, a({P: 60}).okB, near(a({}).bearL, 16.667, 0.001), a({t: 0.2}).bearL, a({P: 50, lb: 15}).okB], [true, true, true, false, true, 15, false]);
}
let tt;
w.renderCalc('syrwall'); w.calcResult('syrwall');
tt = txt(w, 'xsa_results');
check('the default page shows 10.0 kgf/cm², the reduced 7.0 kgf/cm², the centre stress 4.08 and the 🔴 note', [tt.includes('10.0 kgf/cm²'), tt.includes('7.0 kgf/cm²'), tt.includes('4.08 kgf/cm²'), tt.includes('✔'), tt.includes('🔴')], [true, true, true, true, true]);
set('xsa_m', '0'); w.calcResult('syrwall'); tt = txt(w, 'xsa_results');
check('rubble stone with a basic stress of 2 at slenderness 12 is not permitted and the stone group is shown', [tt.includes('غير مسموح'), doc.getElementById('xsa_g0').style.display === '', doc.getElementById('xsa_g1').style.display === 'none'], [true, true, true]);
set('xsa_m', '3'); w.calcResult('syrwall'); tt = txt(w, 'xsa_results');
check('plain concrete shows 18.0 kgf/cm² and hides the mortar field', [tt.includes('18.0 kgf/cm²'), doc.getElementById('xsa_mo').parentNode.style.display === 'none', doc.getElementById('xsa_g2').style.display === ''], [true, true, true]);
check('other reference codes open syrwall too', others('syrwall', 'xsa_results'), [true, true, true]);
}
// ---------- part 255: Syrian Arab Code for unreinforced load-bearing walls chapters 1 and 3 (`syrwall2`: minimum thickness by wall type, building limits, Table 3-1 supporting walls, wall and tie spacing) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xsbCalc(' + JSON.stringify(o) + ')');
{
  const a = o => calc(Object.assign({w: 4, t: 25, t2: 20, st: 3, live: 2, L: 20, B: 10, part: 20, H: 10, hs: 3.2, setb: 0, hf: 3, sp: 5, tie: 0, ss: 5, ts: 15, ls: 1, tp: 4, course: 25}, o));
  check('13 wall types; minimum thickness: rubble without mortar 50 (one storey), rubble with mortar 25, dressed stone 20, mixed 35, brick 20, block 20, concrete 20 (two storeys), cyclopean 25', [J('XSB_W.length'), J('XSB_W.map(x => x[1])'), J('XSB_W.map(x => x[3])')], [13, [50, 25, 20, 35, 20, 20, 20, 20, 20, 20, 25, 20, 25], [1, 99, 99, 99, 99, 99, 99, 99, 99, 2, 99, 99, 99]]);
  check('a 25 cm brick wall in a regular three-storey building passes everything; no failures', [a({}).fail, a({}).okT, a({}).okFree, a({}).okSp, a({}).okSup, a({}).okSupL], [0, true, true, true, true, true]);
  check('thickness limits: brick 19 cm fails, 20 cm passes; rubble stone with mortar 24 cm fails and the course height under 25 cm fails', [a({t: 19}).okT, a({t: 20}).okT, a({w: 1, t: 24}).okT, a({w: 1, t: 25, course: 24}).okCourse, a({w: 1, t: 25, course: 25}).okCourse, a({w: 4, course: 1}).okCourse], [false, true, false, false, true, true]);
  check('double walls need both leaves: brick (20 + cavity + 20) with a 19 cm outer leaf fails; the stone double wall needs 15 cm', [a({w: 5, t2: 19}).okO, a({w: 5, t2: 20}).okO, a({w: 8, t2: 15}).okO, a({w: 8, t2: 14}).okO, a({w: 4, t2: 1}).okO], [false, true, true, false, true]);
  check('storey limits: rubble without mortar one storey only; plain concrete two; seven storeys at most (including the cellar)', [a({w: 0, t: 50, st: 1}).okSt, a({w: 0, t: 50, st: 2}).okSt, a({w: 9, st: 2}).okSt, a({w: 9, st: 3}).okSt, a({st: 7}).okN, a({st: 8}).okN], [true, false, true, false, true, false]);
  check('building limits: live load 5 kN/m2, length 3.5 times the width, parts 30 m, height 24 m, storey 4.25 m, setback 25 %', [a({live: 5}).okLive, a({live: 5.1}).okLive, a({L: 35}).okPlan, a({L: 35.1}).okPlan, a({part: 30}).okPart, a({part: 31}).okPart, a({H: 24}).okH, a({H: 24.5}).okH, a({hs: 4.25}).okSh, a({hs: 4.3}).okSh, a({setb: 25}).okSet, a({setb: 26}).okSet], [true, false, true, false, true, false, true, false, true, false, true, false]);
  check('Table 3-1: 20 to 25 cm walls up to 3.25 m free and supports 6 m apart; 25 to 30 cm up to 3.5 m and 8 m; 30 cm and over 4.15 m and 8 m; under 20 cm is outside', [J('xsbRow(20)'), J('xsbRow(24.9)'), J('xsbRow(25)'), J('xsbRow(29)'), J('xsbRow(30)'), J('xsbRow(40)'), J('xsbRow(19)')], [[20, 3.25, 6], [20, 3.25, 6], [25, 3.5, 8], [25, 3.5, 8], [30, 4.15, 8], [30, 4.15, 8], null]);
  check('free height by thickness: a 22 cm wall 3.3 m fails (3.25), a 25 cm wall 3.5 m passes, a 30 cm wall 4.15 passes and 4.2 fails; 19 cm has no row', [a({t: 22, hf: 3.3}).okFree, a({t: 22, hf: 3.25}).okFree, a({hf: 3.5}).okFree, a({t: 30, hf: 4.15}).okFree, a({t: 30, hf: 4.2}).okFree, a({t: 19}).okFree], [false, true, true, true, false, false]);
  check('support spacing: 6 m for 20 to 25 cm and 8 m above; the supporting wall 15 cm thick and at least a fifth of the free height long', [a({t: 22, ss: 6}).okSup, a({t: 22, ss: 6.5}).okSup, a({ss: 8}).okSup, a({ss: 8.5}).okSup, a({ts: 14}).okSupT, a({ts: 15}).okSupT, a({hf: 3, ls: 0.6}).okSupL, a({hf: 3, ls: 0.5}).okSupL], [true, false, true, false, false, true, true, false]);
  check('bearing wall spacing: 4 m for rubble without mortar, 6 m otherwise, extended to 8 m with vertical ties', [a({w: 0, t: 50, sp: 4}).okSp, a({w: 0, t: 50, sp: 4.5}).okSp, a({sp: 6}).okSp, a({sp: 7}).okSp, a({sp: 7}).spExt, a({sp: 7, tie: 1}).spExt, a({sp: 8.5, tie: 1}).spExt, a({w: 0, t: 50, sp: 5, tie: 1}).spExt], [true, false, true, false, false, true, false, true]);
  check('vertical ties no more than 5 m apart; the failure count adds up', [a({tp: 5}).okTie, a({tp: 5.5}).okTie, a({t: 19, hf: 9, sp: 9}).fail], [true, false, 5]);
}
let tt;
w.renderCalc('syrwall2'); w.calcResult('syrwall2');
tt = txt(w, 'xsb_results');
check('the default page shows the brick wall, 25 cm, the all-pass message, 3.50 m and the 🔴 note', [tt.includes('جدار آجر بسيط') || tt.includes('Simple brick wall'), tt.includes('25 cm'), tt.includes('3.50 m'), tt.includes('✔'), tt.includes('🔴')], [true, true, true, true, true]);
set('xsb_t', '18'); set('xsb_hf', '5'); w.calcResult('syrwall2'); tt = txt(w, 'xsb_results');
check('a thin tall wall shows failed marks', [tt.includes('✘')], [true]);
check('other reference codes open syrwall2 too', others('syrwall2', 'xsb_results'), [true, true, true]);
}
// ---------- part 256: Syrian Arab Code annex 2 seismic code chapters 3 and 4 (`syrseis`: zone factor, Ca and Cv with the near-source factors, importance, period, base shear with its limits, vertical distribution, drift) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xseCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => calc(Object.assign({zone: 2, soil: 3, src: 2, dist: 10, occ: 2, sys: 1, R: 5.5, omega: 2.8, n: 5, hs: 3.2, w: 4000, wr: 3000, T: 0, D: 0, rmax: 0, AB: 0, dS: 0}, o));
  check('zone factors Z: 0.075 0.15 0.20 0.25 0.30 0.40 for zones 1 2A 2B 2C 3 4', [J('XSE_Z'), J('XSE_ZN')], [[0.075, 0.15, 0.2, 0.25, 0.3, 0.4], ['1', '2A', '2B', '2C', '3', '4']]);
  check('Table 3-9 Ca rows: SA 0.06 0.12 0.16 0.20 0.24 0.32; SD 0.12 0.22 0.28 0.32 0.36 0.44; SE 0.19 0.30 0.34 0.35 0.36 0.36', [J('XSE_CA[0]'), J('XSE_CA[3]'), J('XSE_CA[4]')], [[0.06, 0.12, 0.16, 0.2, 0.24, 0.32], [0.12, 0.22, 0.28, 0.32, 0.36, 0.44], [0.19, 0.3, 0.34, 0.35, 0.36, 0.36]]);
  check('Table 3-10 Cv rows: SC 0.13 0.25 0.32 0.38 0.45 0.56; SD 0.18 0.32 0.40 0.47 0.54 0.64; SE 0.26 0.50 0.64 0.74 0.84 0.96', [J('XSE_CV[2]'), J('XSE_CV[3]'), J('XSE_CV[4]')], [[0.13, 0.25, 0.32, 0.38, 0.45, 0.56], [0.18, 0.32, 0.4, 0.47, 0.54, 0.64], [0.26, 0.5, 0.64, 0.74, 0.84, 0.96]]);
  check('Na and Nv: source A at 3.5 km, source B, source C and distances beyond the table', [near(J('xseNear(XSE_NA[0], 3.5)'), 1.35), J('xseNear(XSE_NA[0], 10)'), J('xseNear(XSE_NA[0], 30)'), J('xseNear(XSE_NA[1], 2)'), J('xseNear(XSE_NV[0], 2)'), J('xseNear(XSE_NV[0], 5)'), J('xseNear(XSE_NV[0], 10)'), J('xseNear(XSE_NV[0], 15)'), near(J('xseNear(XSE_NV[0], 7.5)'), 1.4), J('xseNear(XSE_NV[2], 2)')], [true, 1, 1, 1.3, 2, 1.6, 1.2, 1, true, 1]);
  check('default (zone 2B, soil SD, concrete frame, 5 storeys of 3.2 m): hn 16, T = 0.0731 x 8 = 0.5848 s, Ca 0.28, Cv 0.40, W 19000 kN', [a({}).hn, near(a({}).T, 0.58480, 0.0001), a({}).Ca, a({}).Cv, a({}).I, a({}).W, a({}).zone4], [16, true, 0.28, 0.4, 1, 19000, false]);
  check('base shear: Cv I W / (R T) = 2362.9, upper limit 2.5 Ca I W / R = 2418.2, lower limit 0.11 Ca I W = 585.2; the first governs and there is no top force below 0.7 s', [near(a({}).V1, 2362.9, 0.1), near(a({}).V2, 2418.18, 0.1), near(a({}).V3, 585.2, 0.1), near(a({}).V, 2362.9, 0.1), a({}).gov, a({}).Ft], [true, true, true, true, 0, 0]);
  check('a short period is capped by 2.5 Ca I W / R: T = 0.2 s gives 2418.2; a long period hits the minimum 0.11 Ca I W: T = 5 s with Cv/R small', [near(a({T: 0.2}).V, 2418.18, 0.1), a({T: 0.2}).gov, near(a({T: 8, R: 8.5}).V, a({T: 8, R: 8.5}).V3, 1e-9), a({T: 8, R: 8.5}).gov], [true, 1, true, 2]);
  check('top force Ft = 0.07 T V for T over 0.7 s and at most 0.25 V: T = 1.0 gives 0.07 V; T = 4 gives 0.25 V', [a({T: 1}).Ft === a({T: 1}).V * 0.07, near(a({T: 4}).Ft, 0.25 * a({T: 4}).V, 1e-9), a({T: 0.7}).Ft], [true, true, 0]);
  check('vertical distribution: forces sum to V and the shear at the base equals V; the moment is the sum of Fx hx', [near(a({}).floors.reduce((s, f) => s + f.F, 0), a({}).V, 1e-6), near(a({}).floors[0].Vx, a({}).V, 1e-6), near(a({}).M, a({}).floors.reduce((s, f) => s + f.F * f.h, 0), 1e-6), a({}).floors.length, a({}).floors[4].i], [true, true, true, 5, 5]);
  check('for T over 0.7 s the top floor also carries Ft and the storey shear at the top equals Fx of the roof', [near(a({T: 1}).floors[4].F, a({T: 1}).Ft + (a({T: 1}).V - a({T: 1}).Ft) * 3000 * 16 / (4000 * (3.2 + 6.4 + 9.6 + 12.8) + 3000 * 16), 1e-6), near(a({T: 1}).floors[4].Vx, a({T: 1}).floors[4].F, 1e-9)], [true, true]);
  check('zone 4, soil SC, source A at 2 km: Na 1.5, Nv 2.0, Ca = 0.40 x 1.5 = 0.60, Cv = 0.56 x 2.0 = 1.12, minimum 0.8 Z Nv I W / R', [a({zone: 5, soil: 2, src: 0, dist: 2}).zone4, a({zone: 5, soil: 2, src: 0, dist: 2}).Na, a({zone: 5, soil: 2, src: 0, dist: 2}).Nv, near(a({zone: 5, soil: 2, src: 0, dist: 2}).Ca, 0.6), near(a({zone: 5, soil: 2, src: 0, dist: 2}).Cv, 1.12), near(a({zone: 5, soil: 2, src: 0, dist: 2, occ: 2}).V4, 0.8 * 0.4 * 2 * 19000 / 5.5, 0.01), a({zone: 4, soil: 2}).Na], [true, 1.5, 2, true, true, true, 1]);
  check('redundancy factor: 1 for zones 1 to 2C; zone 4 with r_max 0.1 and AB 400 m2: 2 - 6.1 / (0.1 x 20) = -1.05 so 1; r_max 0.5: 2 - 6.1 / 10 = 1.39', [a({rmax: 0.5, AB: 100}).rho, a({zone: 5, rmax: 0.1, AB: 400}).rho, near(a({zone: 5, rmax: 0.5, AB: 400}).rho, 2 - 6.1 / (0.5 * 20), 1e-9), a({zone: 5}).rho, a({zone: 5, rmax: 1, AB: 150}).rho], [1, 1, true, 1, 1.5]);
  check('vertical component 0.5 Ca I D, Em = Omega0 x E, drift: dM = 0.7 R dS = 0.7 x 5.5 x 20 = 77 mm over 3200 = 0.0241 (limit 0.025 below 0.7 s, 0.020 from 0.7 s)', [near(a({D: 10000}).Ev, 0.5 * 0.28 * 10000, 1e-9), near(a({}).Em, 2.8 * a({}).V, 1e-6), near(a({dS: 20}).dM, 77, 1e-9), near(a({dS: 20}).drift, 0.0240625, 1e-7), a({dS: 20}).okDrift, a({dS: 20, T: 1}).okDrift, a({dS: 20, T: 1}).limit, a({dS: 20}).limit], [true, true, true, true, true, false, 0.02, 0.025]);
  check('simplified method: 3.0 Ca W / R = 3 x 0.28 x 19000 / 5.5 = 2901.8', [near(a({}).simpl, 2901.82, 0.01), near(a({}).coef, a({}).V / 19000, 1e-12)], [true, true]);
}
let tt;
w.renderCalc('syrseis'); w.calcResult('syrseis');
tt = txt(w, 'xse_results');
check('the default page shows Z 0.200, Ca 0.280, T 0.585 s, V 2363 kN and the 🔴 note', [tt.includes('0.200'), tt.includes('0.280'), tt.includes('0.585 s'), tt.includes('2363 kN'), tt.includes('🔴')], [true, true, true, true, true]);
set('xse_z', '5'); set('xse_s', '2'); set('xse_sr', '0'); set('xse_d', '2'); w.calcResult('syrseis'); tt = txt(w, 'xse_results');
check('zone 4 shows the near-source factors Na = 1.50 and Nv = 2.00', [tt.includes('Na = 1.50'), tt.includes('Nv = 2.00')], [true, true]);
set('xse_ds', '20'); w.calcResult('syrseis'); tt = txt(w, 'xse_results');
check('a story drift input shows a check mark or a failed mark', [tt.includes('✔') || tt.includes('✘')], [true]);
check('other reference codes open syrseis too', others('syrseis', 'xse_results'), [true, true, true]);
}
// ---------- part 257: Syrian Arab Code annex 2 Tables 3-6 and 3-8 (`syrseis2`: R, Omega0 and height limits of the lateral force resisting systems, non-building structures) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xssCalc(' + JSON.stringify(o) + ')');
{
  const a = o => calc(Object.assign({mode: 0, sys: 17, zone: 2, h: 20, nb: 0}, o));
  check('Table 3-6 has 41 building systems in six groups; all have Omega0 2.8, 2.2 or 2.0 and R between 2.2 and 8.5', [J('XSS_S.length'), J('XSS_G.length'), J('XSS_S.every(s => [2.8, 2.2, 2.0].includes(s[3]))'), J('Math.min(...XSS_S.map(s => s[2]))'), J('Math.max(...XSS_S.map(s => s[2]))')], [41, 6, true, 2.2, 8.5]);
  check('group counts: bearing walls 8, building frame 9, moment frames 7, dual 15, cantilever columns 1, mixed 1', [0, 1, 2, 3, 4, 5].map(g => J('XSS_S.filter(s => s[0] === ' + g + ').length')), [8, 9, 7, 15, 1, 1]);
  check('moment frames: SMRF steel and concrete 8.5 with no height limit; MMRWF 6.5 and 49 m; IMRF concrete 5.5; OMRF steel 4.5 and 49 m; OMRF concrete 3.5; STMF 6.5 and 73 m', [17, 18, 19, 20, 21, 22, 23].map(i => a({sys: i})).map(r => [r.R, r.omega, r.hl]), [[8.5, 2.8, null], [8.5, 2.8, null], [6.5, 2.8, 49], [5.5, 2.8, -1], [4.5, 2.8, 49], [3.5, 2.8, -1], [6.5, 2.8, 73]]);
  check('bearing and frame systems: concrete shear walls 4.5 / 49 m and 5.5 / 73 m; masonry 4.5 / 49 and 5.5 / 49; EBF 7.0 / 73; special concentrically braced 6.4 / 73; cantilever columns 2.2, 2.0 and 11 m', [a({sys: 2}), a({sys: 11}), a({sys: 3}), a({sys: 12}), a({sys: 8}), a({sys: 16}), a({sys: 39})].map(r => [r.R, r.omega, r.hl]), [[4.5, 2.8, 49], [5.5, 2.8, 73], [4.5, 2.8, 49], [5.5, 2.8, 49], [7, 2.8, 73], [6.4, 2.2, 73], [2.2, 2, 11]]);
  check('dual systems: concrete walls with SMRF 8.5, with steel OMRF 4.2 / 49, with concrete IMRF 6.5 / 49; masonry with MMRWF 6.0; steel EBF with SMRF 8.5 and with OMRF 4.2; special braced with SMRF 7.5', [24, 25, 26, 30, 31, 32, 37, 38].map(i => a({sys: i})).map(r => [r.R, r.hl]), [[8.5, null], [4.2, 49], [6.5, 49], [6, 49], [8.5, null], [4.2, 49], [7.5, null], [4.2, 49]]);
  check('SMRF is allowed in zones 3 and 4 at any height; a 73 m dual system is allowed at 70 m and not at 80 m in zone 4', [a({zone: 5, h: 200}).ok, a({sys: 8, zone: 5, h: 70}).ok, a({sys: 8, zone: 5, h: 80}).ok, a({sys: 8, zone: 5, h: 80}).hOk, a({sys: 8, zone: 2, h: 80}).ok, a({sys: 8, zone: 5, h: 70}).margin], [true, true, false, false, true, 3]);
  check('systems with a dash are prohibited in zones 3 and 4 but allowed below: concrete IMRF, concrete OMRF, braced concrete frames, masonry with IMRF; concrete walls with IMRF carry footnote 5', [a({sys: 20, zone: 4}).prohibited, a({sys: 20, zone: 3}).prohibited, a({sys: 22, zone: 5}).ok, a({sys: 29, zone: 4}).ok, a({sys: 35, zone: 5}).ok, a({sys: 26, zone: 4}).prohibited, a({sys: 26, zone: 3}).ok, a({sys: 26, zone: 3}).prohibited], [true, false, false, false, false, true, true, false]);
  check('the mixed (interactive) system is prohibited in zones 2A, 2B, 2C, 3 and 4 but allowed in zone 1; the zone 1 steel OMRF takes R = 8', [a({sys: 40, zone: 0}).ok, a({sys: 40, zone: 1}).prohibited, a({sys: 40, zone: 5}).ok, a({sys: 21, zone: 0}).R, a({sys: 21, zone: 0}).zone1, a({sys: 21, zone: 1}).R, a({sys: 21, zone: 1}).zone1], [true, true, false, 8, true, 4.5, false]);
  check('Table 3-8 has 11 non-building structures with Omega0 2.0: vessels 2.2, silos 3.6, cantilever 2.9, lattice towers 2.9, cantilever columns 2.2, cooling towers 3.6, hoppers 2.9, racks 3.6, signs 3.6, amusement 2.2, others 2.9', [J('XSS_N.length'), J('XSS_N.map(n => n[1])'), a({mode: 1, nb: 5}).R, a({mode: 1}).omega], [11, [2.2, 3.6, 2.9, 2.9, 2.2, 3.6, 2.9, 3.6, 3.6, 2.2, 2.9], 3.6, 2]);
}
let tt;
w.renderCalc('syrseis2'); w.calcResult('syrseis2');
tt = txt(w, 'xss_results');
check('the default page shows SMRF, R 8.5, Omega0 2.8, no height limit and the 🔴 note', [tt.includes('8.5'), tt.includes('2.8'), tt.includes('✔'), tt.includes('🔴')], [true, true, true, true]);
set('xss_s', '20'); set('xss_z', '5'); w.calcResult('syrseis2'); tt = txt(w, 'xss_results');
check('the concrete IMRF in zone 4 shows the failed prohibited mark', [tt.includes('✘')], [true]);
set('xss_m', '1'); w.calcResult('syrseis2'); tt = txt(w, 'xss_results');
check('the non-building mode shows R 2.2 and switches the groups', [tt.includes('2.2'), doc.getElementById('xss_g1').style.display === '', doc.getElementById('xss_g0').style.display === 'none'], [true, true, true]);
check('other reference codes open syrseis2 too', others('syrseis2', 'xss_results'), [true, true, true]);
}
// ---------- part 258: Syrian Arab Code annex 2 chapter 5 (`syrspec`: design response spectrum from Ca and Cv, vertical component, minimum dynamic base shear 90 / 80 / 100 %, SRSS combination, mass participation) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
const calc = o => J('xspCalc(' + JSON.stringify(o) + ')');
{
  const a = o => calc(Object.assign({Ca: 0.28, Cv: 0.40, T: 0.6, na: 1, case: 0, Vs: 2400, Vd: 1800, modes: [120, 60, 30], mass: [70, 15, 8]}, o));
  check('Ts = Cv / (2.5 Ca) = 0.40 / 0.70 = 0.5714 s, T0 = 0.2 Ts = 0.1143 s, plateau 2.5 Ca = 0.70 g', [near(a({}).Ts, 0.571429, 1e-5), near(a({}).T0, 0.114286, 1e-5), near(a({}).plateau, 0.7)], [true, true, true]);
  check('spectrum: Ca at T = 0 (0.28), 0.70 at T0, flat to Ts, then Cv / T (0.40 at 1 s, 0.20 at 2 s, 0.1333 at 3 s); halfway up the rise at T0 / 2 gives 0.49', [near(J('xspSa(0,0.28,0.4)'), 0.28), near(J('xspSa(0.1142857,0.28,0.4)'), 0.7, 1e-4), near(J('xspSa(0.3,0.28,0.4)'), 0.7), near(J('xspSa(1,0.28,0.4)'), 0.4), near(J('xspSa(2,0.28,0.4)'), 0.2), near(J('xspSa(3,0.28,0.4)'), 0.13333, 1e-4), near(J('xspSa(0.0571429,0.28,0.4)'), 0.49, 1e-4)], [true, true, true, true, true, true, true]);
  check('the spectrum is continuous at Ts: Cv / Ts equals 2.5 Ca; T = 0.6 s lies just past Ts: 0.4 / 0.6 = 0.6667 g = 6.54 m/s2; vertical 2/3 of it', [near(a({T: 0.5714286}).Sa, 0.7, 1e-4), near(a({}).Sa, 0.666667, 1e-5), near(a({}).SaMs2, 6.543, 0.001), near(a({}).SaV, 0.444444, 1e-5), a({}).vertFactor, a({na: 1.2}).vertFactor], [true, true, true, true, '2/3', 'site']);
  check('minimum dynamic base shear: 90 % of 2400 = 2160 for a regular structure, 80 % = 1920, 100 % = 2400; 1800 fails with factors 1.2, 1.0667 and 1.3333', [a({}).minVd, a({case: 1}).minVd, a({case: 2}).minVd, a({}).okVd, near(a({}).scale, 1.2), near(a({case: 1}).scale, 1.066667, 1e-5), near(a({case: 2}).scale, 1.333333, 1e-5)], [2160, 1920, 2400, false, true, true, true]);
  check('a dynamic shear above the minimum needs no scaling: 2300 against 2160 gives factor 1', [a({Vd: 2300}).okVd, a({Vd: 2300}).scale, a({Vd: 2160}).scale], [true, 1, 1]);
  check('SRSS of 120, 60 and 30 = sqrt(14400 + 3600 + 900) = 137.48; the absolute sum is 210; scaled 1.2 x 137.48 = 164.98', [near(a({}).srss, 137.477, 0.001), a({}).abs, near(a({}).dS, 164.973, 0.001), near(a({modes: [3, 4]}).srss, 5, 1e-9)], [true, 210, true, true]);
  check('mass participation: 70 + 15 + 8 = 93 % passes the 90 % rule; 85 % fails; the parser splits commas, spaces and Arabic semicolons', [a({}).mass, a({}).massOk, a({mass: [50, 35]}).massOk, J('xspParse("1, 2.5; 3")'), J('xspParse("4 5")'), J('xspParse("")')], [93, true, false, [1, 2.5, 3], [4, 5], []]);
  check('sample points: 7 periods at 0, T0, Ts, 1, 2, 3 and 4 s', [a({}).pts.length, near(a({}).pts[2].Sa, 0.7, 1e-4), near(a({}).pts[6].Sa, 0.1)], [7, true, true]);
}
let tt;
w.renderCalc('syrspec'); w.calcResult('syrspec');
tt = txt(w, 'xsp_results');
check('the default page shows Ts 0.571 s, 0.700 g, 0.667 g, the 2160.0 kN minimum, the factor 1.200 and the 🔴 note', [tt.includes('0.571 s'), tt.includes('0.700 g'), tt.includes('0.667 g'), tt.includes('2160.0 kN'), tt.includes('1.200'), tt.includes('🔴')], [true, true, true, true, true, true]);
set('xsp_vd', '2300'); w.calcResult('syrspec'); tt = txt(w, 'xsp_results');
check('a sufficient dynamic shear shows the pass mark', [tt.includes('✔')], [true]);
check('other reference codes open syrspec too', others('syrspec', 'xsp_results'), [true, true, true]);
}
// ---------- part 259: Syrian Arab Code annex 5 foundations (`syrfound`: Es and K tables, rigidity ratio, contact pressure with partial uplift and step ratio, pile allowable stresses, plain concrete classes) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xsfCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => calc(Object.assign({mode: 0, es: 2, k: 5, E: 25000, Esoil: 50, d: 0.6, B: 2, L: 2.5, P: 600, Mx: 0, My: 60, qa: 200, fc: 100, fy: 4200, st: 0, Ac: 700, As: 10, fs: 1000, sleeve: 1, fa: 30, faAll: 60, fb: 10, fbAll: 80, cl: 1}, o));
  check('Table 6-7 has 11 rows: soft clay 0.5 to 2, medium 1.5 to 6, stiff 2.5 to 10, very stiff 5 to 20, hard 10 to 40; sands 10-25, 25-75, 75-150, 150-400; gravel 100 to 400; organic 0.5 to 2', [J('XSF_ES.length'), J('XSF_ES.map(e => e[2] + "-" + e[3])')], [11, ['0.5-2', '1.5-6', '2.5-10', '5-20', '10-40', '10-25', '25-75', '75-150', '150-400', '100-400', '0.5-2']]);
  check('Table 8-1 has 8 rows of K: clay 0.5 to 1, fill 1 to 2, wet clay 2 to 3, damp clay 4 to 5, coarse sand 8 to 10, gravel with fine sand 10 to 12, with coarse sand 12 to 15, large gravel 15 to 20 kgf/cm3', [J('XSF_K.length'), J('XSF_K.map(k => k[1] + "-" + k[2])')], [8, ['0.5-1', '1-2', '2-3', '4-5', '8-10', '10-12', '12-15', '15-20']]);
  check('Es of stiff clay 2.5 to 10 MN/m2 (25.5 to 102 kgf/cm2), geometric mean 5; K of coarse sand and gravel 10 to 12 kgf/cm3 = 981 to 1177 MN/m3', [a({}).es[2], a({}).es[3], near(a({}).esMid, 5), near(a({}).esKg[0], 25.49, 0.01), near(a({}).esKg[1], 101.97, 0.01), a({}).kk[1], near(a({}).kN[0], 980.665, 0.01), near(a({}).kN[1], 1176.8, 0.1)], [2.5, 10, true, true, true, 10, true, true]);
  check('rigidity ratio Kr = (25000 / 50) x (0.6 / 2)^3 = 13.5 gives a very rigid footing; Kr 0.135 moderately rigid; Kr 0.005 or less flexible', [near(a({}).Kr, 13.5), a({}).cls, a({Esoil: 200000}).cls, near(a({Esoil: 200000}).Kr, 0.003375, 1e-9), a({Esoil: 5000}).cls, near(a({Esoil: 5000}).Kr, 0.135)], [true, 0, 2, true, 1, true]);
  check('Kr of 0.05 is moderately rigid; the boundaries 2 and 0.005 belong to the rigid and flexible classes', [near(a({E: 5000, Esoil: 100, d: 0.2, B: 2}).Kr, 0.05), a({E: 5000, Esoil: 100, d: 0.2, B: 2}).cls, a({E: 2000, Esoil: 1000, d: 1, B: 1}).Kr, a({E: 2000, Esoil: 1000, d: 1, B: 1}).cls, a({E: 5, Esoil: 1000, d: 1, B: 1}).cls], [true, 1, 2, 0, 2]);
  const c = o => a(Object.assign({mode: 1}, o));
  check('full contact: P 600 kN on 2 x 2.5 m with My 60 kN m: ex 0.1, P/A 120, sigma max 120 x (1 + 0.3) = 156 and min 84 kPa; the step ratio is 2:1 for 1.59 kgf/cm2; tension 1.25 sqrt(100) = 12.5', [near(c({}).ex, 0.1), c({}).ey, c({}).s0, c({}).full, near(c({}).smax, 156, 1e-9), near(c({}).smin, 84, 1e-9), c({}).stepRatio, c({}).okQ, c({}).tension], [true, 0, 120, true, true, true, [2, 1], true, 12.5]);
  check('biaxial within the middle third: Mx 30 and My 60 give ey 0.05 and ex 0.1, kern 0.05 + 0.02 and sigma max 120 x (1 + 0.3 + 0.12) = 170.4', [near(c({Mx: 30}).ey, 0.05), near(c({Mx: 30}).kern, 0.07), near(c({Mx: 30}).smax, 170.4, 1e-9), near(c({Mx: 30}).smin, 69.6, 1e-9)], [true, true, true, true]);
  check('partial uplift: My 300 kN m gives ex 0.5 over the middle third; sigma max = 2 x 600 / (3 x 2.5 x (1 - 0.5)) = 320 kPa, contact length 1.5 m of 2; fails 200 kPa', [c({My: 300}).full, c({My: 300}).partial, c({My: 300}).mode, near(c({My: 300}).smax, 320, 1e-9), c({My: 300}).smin, near(c({My: 300}).contact, 0.75), c({My: 300}).okQ], [false, true, 1, true, 0, true, false]);
  check('the bending in the other direction uses the other side: Mx 300 gives ey 0.5 on L = 2.5: 2 x 600 / (3 x 2 x (1.25 - 0.5)) = 266.7; e at half the dimension is unstable; both eccentricities outside the kern needs software', [near(c({Mx: 300, My: 0}).smax, 266.667, 0.001), c({Mx: 750, My: 0}).mode, c({My: 210}).mode, c({Mx: 60, My: 300}).mode, c({Mx: 60, My: 300}).smax], [true, 2, 1, 3, null]);
  check('step ratios by contact pressure: under 2 kgf/cm2 2:1; 2 to 4 gives 1:1.5; above 4 gives 1:1', [J('xsfStep(1.9)'), J('xsfStep(2)'), J('xsfStep(4)'), J('xsfStep(4.1)')], [[2, 1], [1, 1.5], [1, 1.5], [1, 1]]);
  const p = o => a(Object.assign({mode: 2, fc: 250}, o));
  check('Table 9-1: concrete compression 0.30 / 0.44 and 0.40 / 0.53 of f\'c; steel 0.35 / 0.47, 0.40 / 0.53, 0.50 / 0.67 of fy; tension of plain and reinforced concrete 0; prestressed temporary 9.5 sqrt(f\'c); bending 0.45 / 0.55 f\'c, 5 and 19 sqrt(f\'c)', [J('XSF_P.length'), J('XSF_P.map(x => x[1] + "/" + x[2])')], [14, ['0.3/0.44', '0.4/0.53', '0.35/0.47', '0.4/0.53', '0.5/0.67', '0/0', '0/null', '0/9.5', '0.5/0.67', '0.5/0.67', '0.5/0.67', '0.45/0.55', '0/5', '0/19']]);
  check('pile stresses for f\'c 250: unconfined concrete 75 permanent and 110 temporary; confined concrete 100 and 132.5; steel bars at fy 4200: 1680 and 2226; prestressed temporary tension 9.5 x 15.81 = 150.2', [near(p({}).fall, 75), near(p({}).fallT, 110), near(p({st: 1}).fall, 100), near(p({st: 1}).fallT, 132.5), near(p({st: 3}).fall, 1680), near(p({st: 3}).fallT, 2226), near(p({st: 7}).fallT, 150.2, 0.1), p({st: 6}).fallT], [true, true, true, true, true, true, true, null]);
  check('pile capacity: confined 0.33 x 250 x 700 + 1000 x 10 = 67 750 kgf; unconfined 0.85 x (0.3 x 250 x 700 + 10 000) = 53 125 kgf; the combined check 30/60 + 10/80 = 0.625 passes and fails above one', [p({}).Pall1, p({}).Pall2, p({}).Pall, p({sleeve: 0}).Pall, near(p({}).inter, 0.625), p({}).okI, p({fa: 50}).okI, near(p({fa: 50}).inter, 0.9583, 0.001)], [67750, 53125, 67750, 53125, true, true, true, true]);
  check('concrete classes: C8 80 / 90 / 12, C10 100 / 110 / 14, C12 120 / 130 / 15 kgf/cm2; tension 14 kgf/cm2 = 1.4 sqrt(100)', [J('XSF_C.map(c => c[1] + "/" + c[2] + "/" + c[3])'), a({mode: 3}).fc, a({mode: 3}).fcm, a({mode: 3}).ft, near(a({mode: 3}).ftSqrt, 1.4), a({mode: 3, cl: 2}).c[0]], [['80/90/12', '100/110/14', '120/130/15'], 100, 110, 14, true, 'C12']);
}
let tt;
w.renderCalc('syrfound'); w.calcResult('syrfound');
tt = txt(w, 'xsf_results');
check('the default page shows 2.5 إلى 10.0 MN/m², 13.500 and the 🔴 note', [tt.includes('2.5 إلى 10.0 MN/m²') || tt.includes('2.5 to 10.0 MN/m²'), tt.includes('13.500'), tt.includes('🔴')], [true, true, true]);
set('xsf_m', '1'); w.calcResult('syrfound'); tt = txt(w, 'xsf_results');
check('the contact mode shows 156.0 kPa and 84.0 kPa and switches the groups', [tt.includes('156.0 kPa'), tt.includes('84.0 kPa'), doc.getElementById('xsf_g1').style.display === '', doc.getElementById('xsf_g0').style.display === 'none'], [true, true, true, true]);
set('xsf_my', '300'); w.calcResult('syrfound'); tt = txt(w, 'xsf_results');
check('a large moment shows the partial contact stress 320.0 kPa and a failed mark', [tt.includes('320.0 kPa'), tt.includes('✘')], [true, true]);
set('xsf_m', '2'); w.calcResult('syrfound'); tt = txt(w, 'xsf_results');
check('the pile mode shows 67750 kgf and 0.63', [tt.includes('67750 kgf'), tt.includes('0.63')], [true, true]);
set('xsf_m', '3'); w.calcResult('syrfound'); tt = txt(w, 'xsf_results');
check('the concrete mode shows C10 and 14 kgf/cm²', [tt.includes('C10'), tt.includes('14 kgf/cm²')], [true, true]);
check('other reference codes open syrfound too', others('syrfound', 'xsf_results'), [true, true, true]);
}
// ---------- part 260: Syrian Arab Code annex 2 chapter 6 and Table 3-7 (`syrnsc`: lateral force on non-structural components and equipment, ap and Rp, limits 0.7 and 4.0 Ca Ip Wp) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xsnCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => calc(Object.assign({el: 16, ap: 0, Rp: 0, ip: 0, Ca: 0.28, Wp: 10, hx: 10, hr: 16}, o));
  check('Table 3-7 has 24 rows; every ap is 1.0 or 2.5 and every Rp is 1.5, 3.0 or 4.0', [J('XSN_E.length'), J('XSN_E.every(e => e[2] === 1 || e[2] === 2.5)'), J('XSN_E.every(e => [1.5, 3, 4].includes(e[3]))')], [24, true, true]);
  check('selected rows: parapets 2.5 / 3.0; interior partitions 1.0 / 3.0; appendages 2.5 / 4.0; storage racks 2.5 / 4.0; flexible chimneys below the centre of mass 2.5 / 3.0; non-ductile rigid links 1.0 / 1.5; flexible ductile links 2.5 / 3.0', [0, 2, 3, 9, 6, 21, 22].map(i => [J('XSN_E[' + i + '][2]'), J('XSN_E[' + i + '][3]')]), [[2.5, 3], [1, 3], [2.5, 4], [2.5, 4], [2.5, 3], [1, 1.5], [2.5, 3]]);
  check('equipment default: ap 1.0, Rp 3.0, Ip 1.0, Ca 0.28, Wp 10 kN at hx 10 of hr 16: Fp = 1 x 0.28 / 3 x (1 + 1.875) x 10 = 2.683 kN', [a({}).ap, a({}).Rp, a({}).Ip, near(a({}).Fp2, 0.28 / 3 * 2.875 * 10, 1e-9), near(a({}).Fp, 2.6833, 0.001), a({}).govMin, a({}).govMax], [1, 3, 1, true, true, false, false]);
  check('limits: minimum 0.7 Ca Ip Wp = 1.96 and maximum 4.0 Ca Ip Wp = 11.2 kN; at the ground (hx 0) the formula gives 0.933 and the minimum 1.96 governs', [near(a({}).min, 1.96), near(a({}).max, 11.2), near(a({hx: 0}).Fp2, 0.9333, 0.001), a({hx: 0}).govMin, near(a({hx: 0}).Fp, 1.96)], [true, true, true, true, true]);
  check('a flexible element (ap 2.5, Rp 1.5) at the roof: 2.5 x 0.28 / 1.5 x 4 x 10 = 18.67 which is capped at 11.2 kN', [near(a({el: 23, hx: 16}).Fp2, 18.667, 0.001), a({el: 23, hx: 16}).govMax, near(a({el: 23, hx: 16}).Fp, 11.2)], [true, true, true]);
  check('important buildings: Ip 1.5 multiplies the force by 1.5; the simple relation 4.0 Ca Ip Wp = 16.8 kN; the vertical component 0.5 Ca Ip Wp = 2.1 kN', [a({ip: 1}).Ip, near(a({ip: 1}).Fp2, 1.5 * a({}).Fp2, 1e-9), near(a({ip: 1}).Fp1, 16.8), near(a({ip: 1}).Fv, 2.1), near(a({}).Fv, 1.4)], [1.5, true, true, true, true]);
  check('manual ap and Rp override the table and ap is checked between 1.0 and 2.5; hx is clamped between 0 and hr', [a({ap: 2, Rp: 2}).ap, a({ap: 2, Rp: 2}).Rp, a({ap: 2.6}).apOk, a({ap: 0.9}).apOk, a({ap: 1}).apOk, a({hx: 40}).hx, near(a({hx: 40}).Fp2, 0.28 / 3 * 4 * 10, 1e-9)], [2, 2, false, false, true, 16, true]);
}
let tt;
w.renderCalc('syrnsc'); w.calcResult('syrnsc');
tt = txt(w, 'xsn_results');
check('the default page shows ap = 1.00, Rp = 3.00, Fp 2.68 kN and the 🔴 note', [tt.includes('ap = 1.00'), tt.includes('Rp = 3.00'), tt.includes('2.68 kN'), tt.includes('🔴')], [true, true, true, true]);
set('xsn_ip', '1'); w.calcResult('syrnsc'); tt = txt(w, 'xsn_results');
check('the important-building factor shows 4.03 kN', [tt.includes('4.03 kN')], [true]);
check('other reference codes open syrnsc too', others('syrnsc', 'xsn_results'), [true, true, true]);
}
// ---------- part 261: Syrian Arab Code annex 2 clause 4-13 (`syrtors`: centre of rigidity, torsional moment with accidental eccentricity, distribution of the storey shear to the resisting elements) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
const els = [{X: 0, Y: 5, Kx: 0, Ky: 100}, {X: 20, Y: 5, Kx: 0, Ky: 200}, {X: 10, Y: 0, Kx: 100, Ky: 0}, {X: 10, Y: 10, Kx: 100, Ky: 0}];
const calc = o => J('xsrCalc(' + JSON.stringify(Object.assign({els, Xcm: 10, Ycm: 5, Lx: 20, Ly: 10, Vx: 0, Vy: 1000, acc: 1}, o)) + ')');
{
  check('the parser reads X, Y, Kx, Ky per line with commas, semicolons or spaces and ignores short lines', [J('xsrParse("0, 5, 0, 100\\n20 5 0 200\\nbad line\\n1,2,3")').length, J('xsrParse("0, 5, 0, 100\\n20 5 0 200")')[1], J('xsrParse("1,1,-5,3")')[0].Kx], [2, {X: 20, Y: 5, Kx: 0, Ky: 200}, 0]);
  check('centre of rigidity: Xcr = (0 x 100 + 20 x 200) / 300 = 13.333; Ycr = (0 + 10) x 100 / 200 = 5; sums 200 and 300', [near(calc({}).Xcr, 13.3333, 1e-4), calc({}).Ycr, calc({}).sKx, calc({}).sKy, calc({}).n], [true, 5, 200, 300, 4]);
  check('eccentricity ex = 10 - 13.333 = -3.333, ey = 0; accidental 0.05 x 20 = 1 gives Xc = -4.333 and Mt = 1000 x -4.333 = -4333.3 kN m; without it -3333.3', [near(calc({}).exc, -3.33333, 1e-4), calc({}).eyc, near(calc({}).Xc, -4.33333, 1e-4), near(calc({}).Mt, -4333.33, 0.01), near(calc({acc: 0}).Mt, -3333.33, 0.01), calc({acc: 0}).ax], [true, 0, true, true, true, 0]);
  check('torsional stiffness J = 100 x 13.333^2 + 200 x 6.667^2 + 2 x 100 x 5^2 = 31 666.7', [near(calc({}).J, 31666.67, 0.01)], [true]);
  check('forces in the y walls: wall at x = 0 carries 333.3 + 182.5 = 515.8 kN and the wall at x = 20 carries 666.7 - 182.5 = 484.2 kN; the x walls carry nothing; the sum is 1000', [near(calc({}).rows[0].dy, 333.333, 0.001), near(calc({}).rows[0].ty, 182.456, 0.001), near(calc({}).rows[0].Fy, 515.789, 0.001), near(calc({}).rows[1].Fy, 484.211, 0.001), calc({}).rows[2].Fy, near(calc({}).sumFy, 1000, 1e-9), calc({}).okSum], [true, true, true, true, 0, true, true]);
  check('without the accidental eccentricity: 473.7 and 526.3 kN; a symmetric layout has no torsion: 500 and 500', [near(calc({acc: 0}).rows[0].Fy, 473.684, 0.001), near(calc({acc: 0}).rows[1].Fy, 526.316, 0.001), near(calc({els: [{X: 0, Y: 5, Kx: 0, Ky: 100}, {X: 20, Y: 5, Kx: 0, Ky: 100}, {X: 10, Y: 0, Kx: 100, Ky: 0}, {X: 10, Y: 10, Kx: 100, Ky: 0}], acc: 0}).rows[0].Fy, 500, 1e-9), near(calc({els: [{X: 0, Y: 5, Kx: 0, Ky: 100}, {X: 20, Y: 5, Kx: 0, Ky: 100}], acc: 0}).Mt, 0, 1e-9)], [true, true, true, true]);
  check('shear in x: Vx = 500 and Vy = 0 with the accidental 0.05 x 10 = 0.5 m: Mt = -250; the x walls carry 250 +- 3.95 kN and the sum is 500', [calc({Vx: 500, Vy: 0}).Yc, near(calc({Vx: 500, Vy: 0}).Mt, -250, 1e-9), near(calc({Vx: 500, Vy: 0}).rows[2].Fx, 246.053, 0.001), near(calc({Vx: 500, Vy: 0}).rows[3].Fx, 253.947, 0.001), near(calc({Vx: 500, Vy: 0}).sumFx, 500, 1e-9), calc({Vx: 500, Vy: 0}).okSum], [0.5, true, true, true, true, true]);
  check('both directions together superpose: Mt = Vy Xc - Vx Yc = -4333.3 - 250 and the sums equal both shears', [near(calc({Vx: 500}).Mt, -4333.333 - 250, 0.01), near(calc({Vx: 500}).sumFx, 500, 1e-9), near(calc({Vx: 500}).sumFy, 1000, 1e-9)], [true, true, true]);
  check('eccentricity ratios 3.33 / 20 = 0.167 and 0; a lone element has no torsion and carries all the shear', [near(calc({}).eccRatioX, 0.16667, 1e-4), calc({}).eccRatioY, calc({els: [{X: 0, Y: 0, Kx: 50, Ky: 50}], Xcm: 0, Ycm: 0, acc: 0}).rows[0].Fy, calc({els: [{X: 0, Y: 0, Kx: 50, Ky: 50}], Xcm: 0, Ycm: 0, acc: 0}).J], [true, 0, 1000, 0]);
}
let tt;
w.renderCalc('syrtors'); w.calcResult('syrtors');
tt = txt(w, 'xsr_results');
check('the default page shows Xcr = 13.333, Mt -4333.3, 515.8 and 484.2 and the 🔴 note', [tt.includes('Xcr = 13.333'), tt.includes('-4333.3'), tt.includes('515.8'), tt.includes('484.2'), tt.includes('🔴')], [true, true, true, true, true]);
set('xsr_ac', '0'); w.calcResult('syrtors'); tt = txt(w, 'xsr_results');
check('without the accidental eccentricity the page shows 473.7 and 526.3', [tt.includes('473.7'), tt.includes('526.3')], [true, true]);
set('xsr_el', ''); w.calcResult('syrtors'); tt = txt(w, 'xsr_results');
check('an empty element list shows the prompt', [tt.includes('X, Y, Kx, Ky')], [true]);
check('other reference codes open syrtors too', others('syrtors', 'xsr_results'), [true, true, true]);
}
// ---------- part 262: Syrian Arab Code annex 2 Tables 3-4 and 3-5 and clause 3-9 (`syrirr`: vertical and plan irregularity checks, choice of the analysis method) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xsiCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const v = o => calc(Object.assign({mode: 0, k1: 100, kUp: 100, k2: 100, k3: 100, k4: 100, W: 3000, Wadj: 3000, roof: false, Bs: 20, Badj: 20, off: 0, Lel: 5, cap1: 100, capUp: 100, ratioUp: 0, stories: 5, H: 16}, o));
  check('a regular storey: no irregularity of any kind and no weak storey limit', [v({}).count, v({}).soft, v({}).weight, v({}).geoIrr, v({}).dis, v({}).weak], [0, false, false, false, false, false]);
  check('soft storey: stiffness under 70 % of the storey above (69 of 100) or under 80 % of the mean of the three above (79 of 100)', [v({k1: 69}).soft, v({k1: 70, k2: 80, k3: 80, k4: 80}).soft, v({k1: 79}).soft, v({k1: 80}).soft, near(v({k1: 69}).r1, 0.69), v({k1: 90, k2: 120, k3: 120, k4: 120}).soft, near(v({k1: 90, k2: 120, k3: 120, k4: 120}).avg3, 120)], [true, false, true, false, true, true, true]);
  check('weight irregularity: over 150 % of the adjacent storey (4600 of 3000); the lighter last roof is ignored', [v({W: 4600}).weight, v({W: 4500}).weight, near(v({W: 4600}).wr, 1.5333), v({W: 4600, roof: true}).weight], [true, false, true, false]);
  check('geometric irregularity: horizontal dimension over 130 % of the adjacent storey (26.1 of 20), 26 passes', [v({Bs: 26.1}).geoIrr, v({Bs: 26}).geoIrr, near(v({Bs: 26.1}).geo, 1.305)], [true, false, true]);
  check('in-plane discontinuity: an offset greater than the element length (5.1 against 5 m) counts', [v({off: 5.1}).dis, v({off: 5}).dis, v({off: 5.1}).count], [true, false, 1]);
  check('weak storey: strength under 80 % of the storey above (79 of 100); the limit of two storeys or 9 m', [v({cap1: 79}).weak, v({cap1: 80}).weak, v({cap1: 79}).limit5, v({cap1: 79, stories: 2, H: 9}).limit5, v({cap1: 79, stories: 2, H: 9.5}).limit5, v({cap1: 79, stories: 3, H: 8}).limit5, v({cap1: 90, stories: 9, H: 30}).limit5], [true, false, true, false, true, true, false]);
  check('the drift ratio exception (up to 1.3) removes the soft and the weight irregularities only', [v({k1: 60, ratioUp: 1.3}).soft, v({k1: 60, ratioUp: 1.31}).soft, v({k1: 60, ratioUp: 1.2}).softRaw, v({W: 5000, ratioUp: 1.25}).weight, v({W: 5000, ratioUp: 1.25}).weightRaw, v({cap1: 60, ratioUp: 1.2}).weak, v({Bs: 30, ratioUp: 1.2}).geoIrr, v({k1: 60}).count], [false, true, true, false, true, true, true, 1]);
  const p = o => calc(Object.assign({mode: 1, dmax: 12, davg: 10, px: 0, py: 0, Lx: 30, Ly: 20, Aop: 0, Atot: 600, dstiff: 0, outp: 0, npar: 0, ecc: 0, Lmax: 30}, o));
  check('torsional irregularity: maximum drift over 1.2 times the average (12.1 of 10); 12 passes', [p({}).torsion, p({dmax: 12.1}).torsion, near(p({dmax: 12.1}).dr, 1.21), p({dmax: 12.1}).count], [false, true, true, 1]);
  check('re-entrant corners: a projection over 15 % of the plan dimension in both directions (5 of 30 and 4 of 20 gives 0.167 and 0.2); one direction alone is not enough', [p({px: 5, py: 4}).reentrant, p({px: 5, py: 2}).reentrant, p({px: 4.5, py: 3}).reentrant, near(p({px: 5, py: 4}).reX, 0.1667, 1e-3), p({px: 4.5, py: 3}).reentrant], [true, false, false, true, false]);
  check('diaphragm discontinuity: openings over 50 % of the area (301 of 600) or a stiffness change above 50 %', [p({Aop: 301}).dia, p({Aop: 300}).dia, p({dstiff: 0.51}).dia, p({dstiff: 0.5}).dia, near(p({Aop: 301}).openR, 0.5017, 1e-3)], [true, false, true, false, true]);
  check('out-of-plane offsets and non-parallel systems each count; the count adds up', [p({outp: 1}).out, p({npar: 1}).nonpar, p({outp: 1, npar: 1, dmax: 13}).count, p({}).count], [true, true, 3, 0]);
  check('stiffness eccentricity: 6.5 m of 30 m = 21.7 % exceeds 20 %; 6 m is exactly 20 %', [p({ecc: 6.5}).ecc20, p({ecc: 6}).ecc20, near(p({ecc: 6.5}).eccPct, 21.667, 0.001)], [true, false, true]);
  const m = o => calc(Object.assign({mode: 2, irrV: 0, irrH: 0, irrNonStd: 0, zone: 2, occ: 2, resind: false, sysTable: 1, light: 0, homo: 1, softSoil: 0, T: 0.5, stories: 5, H: 16, eccPct: 0}, o));
  check('a regular 5-storey 16 m building of Table 3-6 in zone 2B (occupancy 3): equivalent static method; the zone 2 rule alone also allows it', [m({}).static, m({}).dyn, m({}).method, m({}).b, m({}).a], [true, false, 1, true, true]);
  check('simplified static: occupancy 3, regular, up to two storeys (three for light-frame family houses); not for occupancy 1 or 2', [m({stories: 2, H: 7}).simp, m({stories: 2, H: 7}).method, m({stories: 3, H: 10}).simp, m({stories: 3, H: 10, light: 1}).simp, m({stories: 2, H: 7, occ: 0}).simp, m({stories: 2, H: 7, irrV: 1}).simp], [true, 0, false, true, false, false]);
  check('over 73 m dynamic analysis is required; at 73 m it is still static for a regular building', [m({H: 73.5}).dyn, m({H: 73.5}).dynA, m({H: 73}).dyn, m({H: 73.5}).method], [true, true, false, 2]);
  check('vertical irregularity requires the dynamic analysis; horizontal only when not described in the tables', [m({irrV: 1}).dyn, m({irrV: 1}).dynB, m({irrH: 1}).dynB, m({irrH: 1, irrNonStd: 1}).dynB, m({irrH: 1}).dyn], [true, true, false, true, false]);
  check('in zone 3 an irregular structure is static only up to five storeys or 20 m; beyond that it is dynamic', [m({zone: 4, irrH: 1, stories: 5, H: 20}).c, m({zone: 4, irrH: 1, stories: 5, H: 20}).dyn, m({zone: 4, irrH: 1, stories: 6, H: 20}).c, m({zone: 4, irrH: 1, stories: 6, H: 20}).dyn, m({zone: 4, irrH: 1, stories: 5, H: 21}).dyn], [true, false, false, true, true]);
  check('zone 1 allows the static method for everything, zone 2 for occupancy 3 except residential and industrial; zone 3 and 4 irregular beyond the limit is dynamic', [m({zone: 0, irrH: 1, stories: 8, H: 30}).a, m({zone: 0, irrH: 1, stories: 8, H: 30}).static, m({zone: 0, irrH: 1, stories: 8, H: 30}).dyn, m({zone: 1, resind: true, sysTable: 0}).a, m({zone: 1, resind: true, sysTable: 0}).dyn, m({zone: 1, sysTable: 0}).a, m({zone: 4, stories: 8, H: 25, homo: 0}).dynC, m({zone: 4, stories: 8, H: 25, homo: 1}).dynC], [true, true, false, false, true, true, true, false]);
  check('soil SF or a period above 0.7 s requires the dynamic analysis; eccentricity over 20 % recommends it', [m({softSoil: 1}).dynD, m({T: 0.71}).dynD, m({T: 0.7}).dynD, m({T: 0.71}).method, m({eccPct: 21}).recomm, m({eccPct: 20}).recomm, m({eccPct: 21}).method], [true, true, false, 2, true, false, 1]);
}
let tt;
w.renderCalc('syrirr'); w.calcResult('syrirr');
tt = txt(w, 'xsi_results');
check('the default vertical page shows 0.80 for the soft storey ratio, the count 0 and the 🔴 note', [tt.includes('0.80'), tt.includes('✔'), tt.includes('🔴')], [true, true, true]);
set('xsi_m', '1'); set('xsi_dm', '13'); w.calcResult('syrirr'); tt = txt(w, 'xsi_results');
check('the plan mode shows 1.30 and the failed mark and switches the groups', [tt.includes('1.30'), tt.includes('✘'), doc.getElementById('xsi_g1').style.display === '', doc.getElementById('xsi_g0').style.display === 'none'], [true, true, true, true]);
set('xsi_m', '2'); w.calcResult('syrirr'); tt = txt(w, 'xsi_results');
check('the method mode names the equivalent static method for the default building', [tt.includes('3-9-3')], [true]);
set('xsi_h2', '80'); w.calcResult('syrirr'); tt = txt(w, 'xsi_results');
check('a building over 73 m shows the dynamic method', [tt.includes('3-9-4')], [true]);
check('other reference codes open syrirr too', others('syrirr', 'xsi_results'), [true, true, true]);
}
console.log(fail ? `\n${fail} FAIL` : '\nall ok');
if (errors.length) { console.log('jsdom errors:', errors.slice(0, 5)); fail++; }
process.exit(fail ? 1 : 0);
