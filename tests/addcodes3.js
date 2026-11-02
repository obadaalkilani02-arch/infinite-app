// Codes added after the Syrian reinforced concrete code (parts 279 onward): MSS SP-69, ASHRAE 62.2 and 62.1, EN 1992 / EN 1993 and ACI 318-14 calculators. Split from tests/addcodes2.js so each process stays under the heap limit.
//   node tests/addcodes2.js
//   node tests/addcodes2.js
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

// ---------- part 279: ANSI/MSS SP-69-2003 (`mss69`: maximum horizontal pipe hanger spacing Table 3 and minimum rod diameter Table 4) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xmhCalc(' + JSON.stringify(o) + ')');
{
  const a = o => calc(Object.assign({mat: 0, sz: 11, dbl: 0, L: 0, rd: 0}, o));
  check('Table 3 steel water: 1/2 in 7 ft (2.1 m), 2 in 10 ft (3.0 m), 4 in 14 ft (4.3 m), 12 in 23 ft (7.0 m), 30 in 33 ft (10.1 m); 1/4 in has no value', [a({sz: 2}).span, a({sz: 7}).span, a({}).span, a({sz: 16}).span, a({sz: 22}).span, a({sz: 0}).span], [[7, 2.1], [10, 3], [14, 4.3], [23, 7], [33, 10.1], null]);
  check('Table 3 steel vapor: 3/8 in 8 ft, 1 1/2 in 12 ft (3.7 m), 4 in 17 ft (5.2 m), 8 in 24 ft (7.3 m), 30 in 44 ft (13.4 m)', [a({mat: 1, sz: 1}).span, a({mat: 1, sz: 6}).span, a({mat: 1}).span, a({mat: 1, sz: 14}).span, a({mat: 1, sz: 22}).span], [[8, 2.4], [12, 3.7], [17, 5.2], [24, 7.3], [44, 13.4]]);
  check('Table 3 copper: water 1/4 in 5 ft (1.5 m), 1 in 6 ft (1.8 m), 4 in 12 ft (3.7 m), 12 in 19 ft (5.8 m); vapor 4 in 16 ft (4.9 m), 6 in 20 ft (6.1 m), 12 in 28 ft (8.5 m); sizes above 12 in have no value', [a({mat: 2, sz: 0}).span, a({mat: 2, sz: 4}).span, a({mat: 2}).span, a({mat: 2, sz: 16}).span, a({mat: 3}).span, a({mat: 3, sz: 13}).span, a({mat: 3, sz: 16}).span, a({mat: 2, sz: 17}).span, a({mat: 3, sz: 22}).span], [[5, 1.5], [6, 1.8], [12, 3.7], [19, 5.8], [16, 4.9], [20, 6.1], [28, 8.5], null, null]);
  check('ductile iron 20 ft (6.1 m), cast iron soil 10 ft (3.0 m), glass 8 ft (2.4 m), plastic and fibreglass follow the manufacturer', [a({mat: 4}).span, a({mat: 5}).span, a({mat: 6}).span, a({mat: 7}).span, a({mat: 7}).spanOk], [[20, 6.1], [10, 3], [8, 2.4], null, false]);
  check('Table 4 column 1,2,6,7: 2 in 3/8 (M10), 2 1/2 in 1/2 (M12), 4 in 5/8 (M16), 6 in 3/4 (M20), 10 in 7/8 (M20), 14 in 1 (M24), 20 in 1 1/4 (M30), 30 in 1 1/4; 1/4 in none', [a({sz: 7}).rodSingle.slice(0, 2), a({sz: 8}).rodSingle.slice(0, 2), a({}).rodSingle.slice(0, 2), a({sz: 13}).rodSingle.slice(0, 2), a({sz: 15}).rodSingle.slice(0, 2), a({sz: 17}).rodSingle.slice(0, 2), a({sz: 20}).rodSingle.slice(0, 2), a({sz: 22}).rodSingle.slice(0, 2), a({sz: 0}).rodSingle], [['3/8', 'M10'], ['1/2', 'M12'], ['5/8', 'M16'], ['3/4', 'M20'], ['7/8', 'M20'], ['1', 'M24'], ['1 1/4', 'M30'], ['1 1/4', 'M30'], null]);
  check('Table 4 column 3,4,8,9,10 (copper, glass, plastic): 1/4 in 3/8, 2 in 3/8, 4 in 1/2 (M12), 5 in 1/2, 6 in 5/8 (M16), 8 in 3/4 (M20), 12 in 3/4, 14 in none', [a({mat: 2, sz: 0}).rodSingle.slice(0, 2), a({mat: 2, sz: 7}).rodSingle.slice(0, 2), a({mat: 2}).rodSingle.slice(0, 2), a({mat: 3, sz: 12}).rodSingle.slice(0, 2), a({mat: 6, sz: 13}).rodSingle.slice(0, 2), a({mat: 7, sz: 14}).rodSingle.slice(0, 2), a({mat: 2, sz: 16}).rodSingle.slice(0, 2), a({mat: 2, sz: 17}).rodSingle], [['3/8', 'M10'], ['3/8', 'M10'], ['1/2', 'M12'], ['1/2', 'M12'], ['5/8', 'M16'], ['3/4', 'M20'], ['3/4', 'M20'], null]);
  check('double rod hangers use one size smaller (4 in steel: 1/2 in; 6 in: 5/8 in; 30 in: 1 in) and never below 3/8 in', [a({dbl: 1}).rod.slice(0, 2), a({dbl: 1, sz: 13}).rod.slice(0, 2), a({dbl: 1, sz: 22}).rod.slice(0, 2), a({dbl: 1, sz: 7}).rod.slice(0, 2)], [['1/2', 'M12'], ['5/8', 'M16'], ['1', 'M24'], ['3/8', 'M10']]);
  check('checks: 4.0 m passes 4.3 m, 4.5 m fails; a 12 mm rod fails 15.9 mm (5/8) but 16 mm passes; 0 skips the check', [a({L: 4}).okSpan, a({L: 4.5}).okSpan, a({rd: 12}).okRod, a({rd: 16}).okRod, a({}).okSpan, a({}).okRod], [true, false, false, true, null, null]);
}
let tt;
w.renderCalc('mss69'); w.calcResult('mss69');
tt = txt(w, 'xmh_results');
check('the default page shows 4.3 m, 14 ft and 5/8 in (M16) and the 🔴 note', [tt.includes('4.3 m'), tt.includes('14 ft'), tt.includes('5/8 in (M16)'), tt.includes('🔴')], [true, true, true, true]);
set('xmh_m', '4'); w.calcResult('mss69'); tt = txt(w, 'xmh_results');
check('ductile iron shows 6.1 m and the hanger-per-section rule', [tt.includes('6.1 m'), tt.includes('لكل وصلة')], [true, true]);
set('xmh_m', '7'); w.calcResult('mss69'); tt = txt(w, 'xmh_results');
check('plastic pipe shows the manufacturer instruction', [tt.includes('مصنع الأنبوب')], [true]);
check('other reference codes open mss69 too', others('mss69', 'xmh_results'), [true, true, true]);
}
// ---------- part 280: ANSI/ASHRAE 62.2-2019 (`a622`: dwelling total ventilation rate, infiltration credit, local exhaust) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xrvCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.01);
{
  const a = o => calc(Object.assign({area: 150, nbr: 3, q50: 0, wsf: 0.5, h: 5, det: 0, aext: 1, bal: 0, enc: 1, vk: 30, nb: 2}, o));
  check('Eq 4-1b: 0.15 x 150 + 3.5 x (3 + 1) = 36.5 L/s; bedrooms below 1 count as 1 (0.15 x 100 + 3.5 x 2 = 22)', [a({}).qtot, a({area: 100, nbr: 0}).qtot, a({nbr: 0, area: 100}).nbr], [36.5, 22, 1]);
  check('Table 4-1b bands: <47 m2 1 bedroom 14, 47-93 m2 5 bedrooms 35, 140-186 m2 3 bedrooms 42, 419-465 m2 5 bedrooms 91, 150 m2 falls in band 4', [Math.round(a({area: 40, nbr: 1}).qtab), Math.round(a({area: 80, nbr: 5}).qtab), Math.round(a({}).qtab), Math.round(a({area: 450, nbr: 5}).qtab), a({}).k], [14, 35, 42, 91, 4]);
  check('table rows: 2 bedrooms in the 233-279 m2 row 52 and 4 bedrooms in the 94-139 m2 row 38 and 1 bedroom in the 373-418 m2 row 70', [Math.round(a({area: 250, nbr: 2}).qtab), Math.round(a({area: 120, nbr: 4}).qtab), Math.round(a({area: 400, nbr: 1}).qtab)], [52, 38, 70]);
  check('Eq 4-3: 0.052 x 400 x 0.5 x (5 / 2.5)^0.4 = 13.72 L/s; no blower door test gives 0', [near(a({q50: 400}).qinf, 13.7217, 0.01), a({}).qinf], [true, 0]);
  check('Eq 4-2 unbalanced: phi = Qinf / Qtot = 0.3759, credit 5.158, Qfan = 31.34 L/s; balanced: Qfan = 36.5 - 13.72 = 22.78 L/s', [near(a({q50: 400}).phi, 0.37594, 1e-4), near(a({q50: 400}).qfan, 31.342, 0.01), near(a({q50: 400, bal: 1}).qfan, 22.778, 0.01)], [true, true, true]);
  check('attached units: Aext 0.8 reduces the credit to 0.8 x 13.72 (balanced Qfan = 36.5 - 10.98 = 25.52 L/s)', [near(a({q50: 400, bal: 1, det: 1, aext: 0.8}).qfan, 25.522, 0.01), a({q50: 400, det: 0, aext: 0.5}).aext], [true, 1]);
  check('exception 4.1.2: unbalanced Qfan not above 7 L/s needs no system; a tight small unit: area 40, 1 bedroom (13.97) with Q50 2000 gives credit and Qfan = 7.8 > 7 so required', [a({area: 20, nbr: 1, q50: 4000, wsf: 0.9, h: 2.5}).none, a({q50: 400}).none, a({}).none], [true, false, false]);
  check('local exhaust: demand hood 50 L/s, other fans 150 L/s, bathrooms 25 L/s each (50 for two); continuous kitchen 5 ach on 30 m3 = 41.67 L/s, bathrooms 10 L/s each (20)', [a({}).kitDemandHood, a({}).kitDemandOther, a({}).bathDemand, near(a({}).kitAch, 41.667, 0.01), a({}).bathCont, a({enc: 0}).contKitOk], [50, 150, 50, true, 20, false]);
}
let tt;
w.renderCalc('a622'); w.calcResult('a622');
tt = txt(w, 'xrv_results');
check('the default page shows 36.5 L/s, 42 L/s, 41.7 L/s and the 🔴 note', [tt.includes('36.5 L/s'), tt.includes('42.0 L/s'), tt.includes('41.7 L/s'), tt.includes('🔴')], [true, true, true, true]);
set('xrv_q', '400'); w.calcResult('a622'); tt = txt(w, 'xrv_results');
check('with a blower door test the page shows Qinf 13.72 L/s and Qfan 31.3 L/s', [tt.includes('13.72 L/s'), tt.includes('31.3 L/s')], [true, true]);
check('other reference codes open a622 too', others('a622', 'xrv_results'), [true, true, true]);
}
// ---------- part 281: ANSI/ASHRAE 62.1-2022 multiple-zone systems (`a621z`: Vbz, Voz, Vou, Ev simplified and Appendix A, Vot) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xvzCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const Z = [{rp: 2.5, pz: 20, ra: 0.3, az: 100, ez: 1, vpz: 400, vdz: 0, er: 0.75}, {rp: 2.5, pz: 10, ra: 0.3, az: 60, ez: 1, vpz: 200, vdz: 0, er: 0.75}, {rp: 3.8, pz: 15, ra: 0.3, az: 80, ez: 0.8, vpz: 300, vdz: 0, er: 0.75}];
  const a = o => calc(Object.assign({sys: 0, ps: 36, vps: 0, zones: Z}, o));
  check('Eq 6-1 and 6-2: zone 1 Vbz 2.5x20+0.3x100 = 80, zone 2 43, zone 3 81 and Voz 81/0.8 = 101.25 L/s', [a({}).zones.map(z => +z.vbz.toFixed(2)), a({}).zones.map(z => +z.voz.toFixed(2))], [[80, 43, 81], [80, 43, 101.25]]);
  check('Zpz = Voz / Vpz: 0.2, 0.215, 0.3375; minimum primary airflow 1.5 Voz = 120, 64.5, 151.88', [a({}).zones.map(z => +z.zpz.toFixed(4)), a({}).zones.map(z => +z.vmin.toFixed(2))], [[0.2, 0.215, 0.3375], [120, 64.5, 151.88]]);
  check('Eq 6-5 and 6-6: D = 36 / 45 = 0.8; Vou = 0.8 x (50 + 25 + 57) + (30 + 18 + 24) = 177.6 L/s', [near(a({}).D, 0.8), near(a({}).vou, 177.6)], [true, true]);
  check('simplified procedure: D 0.8 gives Ev 0.75 and Vot = 177.6 / 0.75 = 236.8; D 0.5 gives Ev = 0.88 x 0.5 + 0.22 = 0.66; D 0.6 gives 0.75', [near(a({}).ev, 0.75), near(a({}).vot, 236.8), near(a({ps: 22.5}).ev, 0.66), near(a({ps: 27}).ev, 0.75)], [true, true, true, true]);
  check('Appendix A (A-1 to A-9): Vps = 900, Xs = 0.19733; Evz = 1 + Xs - Zpz = 0.99733, 0.98233, 0.85983; Ev = 0.85983; Vot = 177.6 / 0.85983 = 206.56', [near(a({sys: 1}).xs, 0.197333, 1e-5), a({sys: 1}).zones.map(z => +z.evz.toFixed(5)), near(a({sys: 1}).ev, 0.85983, 1e-5), near(a({sys: 1}).vot, 206.56, 0.02), a({sys: 1}).crit], [true, [0.99733, 0.98233, 0.85983], true, true, 2]);
  check('a stated Vps changes Xs (Vps 600 gives 0.296) and the critical zone efficiency', [near(a({sys: 1, vps: 600}).xs, 0.296), near(a({sys: 1, vps: 600}).evAlt, 1 + 0.296 - 0.3375, 1e-5)], [true, true]);
  check('A-4 secondary recirculation: one zone Vou = 80, Vps 900, Xs 0.08889, Zpz 0.2, Vdz 500, Vpz 400, Er 0.75, Ez 1 gives Ep 0.8, Fa 0.95, Fb 0.8, Fc 1 and Evz = 0.86111 / 0.95 = 0.90643', [near(calc({sys: 2, ps: 20, vps: 900, zones: [{rp: 2.5, pz: 20, ra: 0.3, az: 100, ez: 1, vpz: 400, vdz: 500, er: 0.75}]}).zones[0].evz, 0.906433, 1e-5), near(calc({sys: 2, ps: 20, vps: 900, zones: [{rp: 2.5, pz: 20, ra: 0.3, az: 100, ez: 1, vpz: 400, vdz: 0, er: 0.75}]}).zones[0].evz, 1 + 80 / 900 - 0.2, 1e-5)], [true, true]);
  check('single-zone Vot = Voz (101.25 for zone 3 alone) and 100 % OA Vot = the sum of Voz = 224.25', [near(calc({sys: 3, ps: 15, vps: 0, zones: [Z[2]]}).vot, 101.25), near(a({sys: 4}).vot, 224.25)], [true, true]);
  check('parser: lines with six numbers are zones, short or text lines are ignored, optional Vdz and Er are read', [w.eval('xvzParse("2.5, 20, 0.3, 100, 1, 400\\nabc\\n1,2,3\\n3.8 15 0.3 80 0.8 300 500 0.5")').length, w.eval('xvzParse("3.8 15 0.3 80 0.8 300 500 0.5")[0].er'), w.eval('xvzParse("3.8 15 0.3 80 0.8 300 500 0.5")[0].vdz'), w.eval('xvzParse("2.5, 20, 0.3, 100, 0, 400")[0].ez')], [2, 0.5, 500, 1]);
}
let tt;
w.renderCalc('a621z'); w.calcResult('a621z');
tt = txt(w, 'xvz_results');
check('the default page shows Voz 101.3 L/s, D 0.800, Vou 177.6 L/s, Ev 0.750, Vot 236.8 L/s and the 🔴 note', [tt.includes('101.3 L/s'), tt.includes('0.800'), tt.includes('177.6 L/s'), tt.includes('0.750'), tt.includes('236.8 L/s'), tt.includes('🔴')], [true, true, true, true, true, true]);
set('xvz_s', '1'); w.calcResult('a621z'); tt = txt(w, 'xvz_results');
check('the alternative procedure shows Ev 0.860 and Vot 206.6 L/s', [tt.includes('0.860'), tt.includes('206.6 L/s')], [true, true]);
set('xvz_z', ''); w.calcResult('a621z'); tt = txt(w, 'xvz_results');
check('an empty zone list asks for a zone', [tt.includes('أدخل منطقة')], [true]);
check('other reference codes open a621z too', others('a621z', 'xvz_results'), [true, true, true]);
}
// ---------- part 282: EN 1992-1-1:2004 shear (6.2) and punching (6.4) (`ec2shear`) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xe2Calc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => calc(Object.assign({fck: 30, fyk: 500, gc: 1.5, gs: 1.15, bw: 300, h: 500, d: 450, asl: 1500, N: 0, ved: 150, cot: 2.5, asw: 100.5, s: 200, pd: 200, c1: 400, c2: 400, rly: 0.01, rlz: 0.01, pv: 600, pm: 0, pcp: 0, ct: 0, bm: 0, sr: 150, al: 90, aswp: 0}, o));
  check('beam without links: k = 1 + sqrt(200 / 450) = 1.6667, rho = 1500 / (300 x 450) = 1.111 %, CRd,c = 0.12, VRd,c = 0.12 x 1.6667 x 33.33^(1/3) x 135000 = 86.89 kN, vmin = 0.4125 MPa (55.7 kN)', [near(a({}).k, 1.66667, 1e-4), near(a({}).rho, 0.0111111, 1e-6), a({}).crd, near(a({}).vrdc, 86.89, 0.05), near(a({}).vmin, 0.41248, 1e-4), a({}).minGov], [true, true, 0.12, true, true, false]);
  check('minimum governs for a lightly reinforced beam: rho 0.2 % gives (0.035 k^1.5 sqrt(fck)) x bw d = 55.68 kN against 0.12 x 1.6667 x (6)^(1/3) x 135000 = 49.0 kN', [near(a({asl: 270}).vrdc, 55.68, 0.05), a({asl: 270}).minGov], [true, true]);
  check('axial compression 300 kN on 150 000 mm2: sigma_cp 2 MPa adds 0.15 x 2 = 0.3 MPa: VRd,c = (0.64366 + 0.3) x 135 = 127.4 kN; sigma above 0.2 fcd = 4 MPa is flagged', [near(a({N: 300}).sigcp, 2), near(a({N: 300}).vrdc, 127.4, 0.1), a({N: 300}).sigOk, a({N: 700}).sigOk], [true, true, true, false]);
  check('rho is capped at 2 % and k at 2.0: d 150 gives k 2; Asl 5000 gives rho 0.02', [a({d: 150}).k, a({asl: 5000}).rho], [2, 0.02]);
  check('compression strut: nu1 = 0.6 (1 - 30/250) = 0.528, fcd 20 MPa, z 405: VRd,max at cot 2.5 = 442.4 kN and at cot 1 = 641.5 kN', [near(a({}).nu, 0.528), near(a({}).fcd, 20), a({}).z, near(a({}).vrdmax, 442.43, 0.05), near(a({cot: 1}).vrdmax, 641.52, 0.05)], [true, true, 405, true, true]);
  check('links: VEd 150 kN needs Asw / s = 150000 / (405 x 434.78 x 2.5) = 0.3408 mm2/mm (minimum 0.08 sqrt(30) / 500 x 300 = 0.2629); the optimal cot theta is the 2.5 limit; 100.5 / 200 = 0.5025 gives VRd,s = 221.2 kN', [near(a({}).aswsReq, 0.34072, 1e-4), near(a({}).aswsMin, 0.26294, 1e-4), a({}).cotOpt, near(a({}).aswsProv, 0.5025), near(a({}).vrds, 221.2, 0.3), a({}).okProv, a({s: 400}).okProv], [true, true, 2.5, true, true, true, false]);
  check('a heavy shear VEd 900 kN: x = 2 VEd / (bw z nu fcd) = 1.403 > 1 so the section fails; VEd 600 kN gives x 0.935 and cot theta = 1 / tan(0.5 asin x) = 1.448', [a({ved: 900}).sectionOk, near(a({ved: 600}).sec2, 0.9353, 1e-3), a({ved: 600}).sectionOk, near(a({ved: 600}).cotOpt, 1.4478, 2e-3), a({ved: 50}).needLinks, a({}).needLinks], [false, true, true, true, false, true]);
  check('maximum link spacing 0.75 d = 337.5 mm: 200 passes, 350 fails', [a({}).smax, a({}).okS, a({s: 350}).okS], [337.5, true, false]);
  check('punching interior 400 x 400, d 200: u1 = 2 x 800 + 4 pi 200 = 4113.3 mm, u0 = 1600, beta 1.15, vEd = 1.15 x 600000 / (4113.3 x 200) = 0.8387 MPa', [near(a({}).u1, 4113.27, 0.01), a({}).u0, a({}).beta, near(a({}).vEd, 0.83873, 1e-4), near(a({}).vEd0, 2.15625, 1e-4)], [true, 1600, 1.15, true, true]);
  check('vRd,c = 0.12 x 2 x (100 x 0.01 x 30)^(1/3) = 0.7457 MPa (k1 0.1 for punching), vmin = 0.5422; with sigma_cp 1 MPa: 0.8457; vRd,max = 0.4 x 0.528 x 20 = 4.224 MPa', [near(a({}).pvrdc, 0.74573, 1e-4), near(a({}).pvmin, 0.54222, 1e-4), near(a({pcp: 1}).pvrdc, 0.84573, 1e-4), near(a({}).vrdmaxP, 4.224, 1e-4), a({}).okMax], [true, true, true, true, true]);
  check('reinforcement: vEd 0.8387 > 0.7457 so required; fywd,ef = 250 + 0.25 x 200 = 300; Asw = (0.8387 - 0.5593) x 150 x 4113.3 / (1.5 x 300) = 383.1 mm2 per perimeter; uout,ef = 1.15 x 600000 / (0.7457 x 200) = 4626 mm', [a({}).needReinf, a({}).fywdef, near(a({}).aswReq, 383.1, 0.5), near(a({}).uout, 4626.4, 1), a({pv: 300}).needReinf, a({pv: 300}).aswReq], [true, 300, true, true, false, 0]);
  check('provided reinforcement: 383 mm2 gives vRd,cs close to vEd, 300 mm2 fails, 500 mm2 passes', [a({aswp: 384}).okReinf, a({aswp: 300}).okReinf, a({aswp: 500}).okReinf, near(a({aswp: 383.1}).vrdcs, 0.83873, 2e-3)], [true, false, true, true]);
  check('beta from an unbalanced moment (6.39 to 6.41): MEd 50 kN.m gives k 0.60, W1 = 1 702 655 mm2 and beta = 1 + 0.6 x 50e6 x 4113.3 / (600000 x 1702655) = 1.1208; circular D 450 with e = 83.33: beta = 1 + 0.6 pi e / (D + 4 d) = 1.1257', [near(a({bm: 1, pm: 50}).kk, 0.6), near(a({bm: 1, pm: 50}).W1, 1702654.8, 1), near(a({bm: 1, pm: 50}).beta, 1.12079, 1e-4), near(a({bm: 1, pm: 50, ct: 1, c1: 450}).beta, 1.12566, 2e-4)], [true, true, true, true]);
  check('Table 6.1 k: c1 / c2 0.5 gives 0.45, 1.0 gives 0.60, 2.0 gives 0.70, 3.0 gives 0.80; rectangular 600 x 300 gives 0.70', [a({c1: 200}).kk, a({}).kk, near(a({c1: 600, c2: 300}).kk, 0.7), a({c1: 1200}).kk], [0.45, 0.6, true, 0.8]);
  check('edge and corner columns: u1 = c2 + 2 c1 + 2 pi d = 2456.6 and 3 d = 600 for u0 = min(c2 + 3d, c2 + 2c1) = 1000 (edge), corner u1 = 800 + pi 200 = 1428.3 with u0 = min(600, 800) = 600; beta 1.4 and 1.5', [near(a({ct: 2}).u1, 2456.64, 0.05), a({ct: 2}).u0, near(a({ct: 3}).u1, 1428.32, 0.05), a({ct: 3}).u0, a({ct: 2}).beta, a({ct: 3}).beta], [true, 1000, true, 600, 1.4, 1.5]);
}
let tt;
w.renderCalc('ec2shear'); w.calcResult('ec2shear');
tt = txt(w, 'xe2_results');
check('the default page shows VRd,c 86.9 kN, VRd,max 442.4 kN, 0.341 mm²/mm and the 🔴 note', [tt.includes('86.9 kN'), tt.includes('442.4 kN'), tt.includes('0.341 mm²/mm'), tt.includes('🔴')], [true, true, true, true]);
set('xe2_m', '1'); w.calcResult('ec2shear'); tt = txt(w, 'xe2_results');
check('the punching page shows u1 4113 mm, vEd 0.839 MPa, 0.746 MPa and Asw 383 mm² and hides the beam group', [tt.includes('4113 mm'), tt.includes('0.839 MPa'), tt.includes('0.746 MPa'), tt.includes('383 mm²'), doc.getElementById('xe2_g0').style.display === 'none'], [true, true, true, true, true]);
check('other reference codes open ec2shear too', others('ec2shear', 'xe2_results'), [true, true, true]);
}
// ---------- part 283: EN 1992-1-1:2004 anchorage (8.4) and lap length (8.7.3) (`ec2bond`) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xbdCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => calc(Object.assign({mode: 0, cl: 4, fyk: 500, gc: 1.5, gs: 1.15, ph: 20, bc: 0, ratio: 1, ten: 0, sh: 0, a: 100, c1: 40, c: 40, ast: 0, k: 0, el: 0, p: 0, w: 0, rho1: 50}, o));
  check('bond strength C30/37 (fctk,0.05 2.0): fctd = 2.0 / 1.5 = 1.3333, fbd = 2.25 x 1 x 1 x 1.3333 = 3.0 MPa; lb,rqd = (20 / 4) (434.78 / 3.0) = 724.64 mm = 36.2 phi', [near(a({}).fctd, 1.33333, 1e-4), near(a({}).fbd, 3.0, 1e-4), near(a({}).fyd, 434.783, 1e-3), near(a({}).lbrqd, 724.638, 0.01)], [true, true, true, true]);
  check('poor bond conditions (eta1 0.7): fbd = 2.1 MPa and lb,rqd = 1035.2 mm; phi 40 mm: eta2 = (132 - 40) / 100 = 0.92, fbd = 2.76, lb,rqd = 10 x 434.78 / 2.76 = 1575.3 mm', [near(a({bc: 1}).fbd, 2.1, 1e-4), near(a({bc: 1}).lbrqd, 1035.197, 0.01), a({ph: 40}).eta2, near(a({ph: 40}).fbd, 2.76, 1e-4), near(a({ph: 40}).lbrqd, 1575.3, 0.05)], [true, true, 0.92, true, true]);
  check('concrete strength is limited to the C60/75 value: C60 and C90 both give fctk,0.05 3.1 and fbd = 2.25 x 3.1 / 1.5 = 4.65 MPa (capped flag only above C60)', [a({cl: 10}).fctk, a({cl: 13}).fctk, near(a({cl: 13}).fbd, 4.65, 1e-4), a({cl: 13}).capped, a({cl: 10}).capped, a({cl: 4}).capped], [3.1, 3.1, true, true, false, false]);
  check('straight bar, a 100, c1 40, c 40: cd = min(50, 40, 40) = 40, alpha2 = 1 - 0.15 (40 - 20) / 20 = 0.85, lbd = 0.85 x 724.64 = 615.9 mm; lb,min = max(217.4, 200, 100) = 217.4', [a({}).cd, near(a({}).a2, 0.85), near(a({}).lbd, 615.94, 0.01), near(a({}).lbmin, 217.39, 0.01), a({}).minGov], [40, true, true, true, false]);
  check('bent bar, a 200, c1 70: cd = min(100, 70) = 70 > 3 phi (60) so alpha1 = 0.7, alpha2 = 1 - 0.15 (70 - 60) / 20 = 0.925, lbd = 0.7 x 0.925 x 724.64 = 469.2 mm and lb,eq = 0.7 x 724.64 = 507.2 mm; cd 40 gives alpha1 1.0 and alpha2 1.0', [a({sh: 1, a: 200, c1: 70, c: 70}).cd, a({sh: 1, a: 200, c1: 70, c: 70}).a1, near(a({sh: 1, a: 200, c1: 70, c: 70}).a2, 0.925), near(a({sh: 1, a: 200, c1: 70, c: 70}).lbd, 469.2, 0.05), near(a({sh: 1, a: 200, c1: 70, c: 70}).lbeq, 507.25, 0.05), a({sh: 1}).a1, a({sh: 1}).a2, a({}).lbeq], [70, 0.7, true, true, true, 1, 1, null]);
  check('transverse bars: 2 legs of 78.54 mm2 on a beam: lambda = (157.08 - 0.25 x 314.16) / 314.16 = 0.25, K 0.1 gives alpha3 = 0.975 and lbd = 0.85 x 0.975 x 724.64 = 600.5 mm; a slab has no minimum so lambda = 0.5 and alpha3 = 0.95', [near(a({ast: 157.08, k: 0}).lam, 0.25, 1e-4), near(a({ast: 157.08}).a3, 0.975, 1e-4), near(a({ast: 157.08}).lbd, 600.54, 0.05), near(a({ast: 157.08, el: 1}).lam, 0.5, 1e-4), near(a({ast: 157.08, el: 1}).a3, 0.95, 1e-4), a({ast: 157.08, k: 2}).a3], [true, true, true, true, true, 1]);
  check('the product alpha2 alpha3 alpha5 is not taken below 0.7 (8.5): cd 80 gives alpha2 0.7, 2 As of links gives alpha3 0.825, p = 3 MPa gives alpha5 0.88; product 0.508 so lbd = 0.7 x 724.64 = 507.2 mm', [a({a: 300, c1: 80, c: 80, ast: 628.32, p: 3}).a2, near(a({a: 300, c1: 80, c: 80, ast: 628.32, p: 3}).a3, 0.825, 1e-4), near(a({a: 300, c1: 80, c: 80, ast: 628.32, p: 3}).a5, 0.88, 1e-4), near(a({a: 300, c1: 80, c: 80, ast: 628.32, p: 3}).m235, 0.5082, 1e-3), near(a({a: 300, c1: 80, c: 80, ast: 628.32, p: 3}).lbd, 507.25, 0.05), a({p: 20}).a5], [0.7, true, true, true, true, 0.7]);
  check('compression: all alpha = 1, lbd = lb,rqd = 724.64 mm, lb,min = max(434.8, 200, 100); a welded cross bar (alpha4 0.7) gives 507.2 mm; hooks do not help in compression', [near(a({ten: 1}).lbd, 724.638, 0.01), near(a({ten: 1}).lbmin, 434.78, 0.01), near(a({ten: 1, w: 1}).lbd, 507.25, 0.05), a({ten: 1, sh: 1}).a1, a({ten: 1}).a2], [true, true, true, 1, 1]);
  check('the minimum governs a short anchorage: phi 12, sigma 0.2 fyd: lb,rqd = 87.0 mm, lbd0 = 60.9 mm below lb,min = max(26.1, 120, 100) = 120 mm', [near(a({ph: 12, ratio: 0.2}).lbrqd, 86.957, 0.01), a({ph: 12, ratio: 0.2}).minGov, near(a({ph: 12, ratio: 0.2}).lbd, 120, 1e-6)], [true, true, true]);
  check('lap length at 50 % lapped: alpha6 = sqrt(50 / 25) = 1.4142, l0 = 0.85 x 1.4142 x 724.64 = 871.1 mm, l0,min = max(307.4, 300, 200) = 307.4 mm; alpha3 is 1 with no links (lambda -1)', [near(a({mode: 1}).a6, 1.41421, 1e-4), near(a({mode: 1}).l0, 871.08, 0.1), near(a({mode: 1}).l0min, 307.43, 0.05), a({mode: 1}).a3, a({mode: 1}).minGov], [true, true, true, 1, false]);
  check('alpha6 limits: 10 % gives 1, 33 % gives 1.149, 100 % gives 1.5; compression lap l0 = 1.4142 x 724.64 = 1024.8 mm', [a({mode: 1, rho1: 10}).a6, near(a({mode: 1, rho1: 33}).a6, 1.14891, 1e-4), a({mode: 1, rho1: 100}).a6, near(a({mode: 1, ten: 1}).l0, 1024.83, 0.1)], [1, true, 1.5, true]);
  check('lap links: phi 20 and 50 % lapped need sum Ast >= As = 314.2 mm2 (8.7.4.1(3)); 0 mm2 fails, 314.2 passes; phi 16 or 20 % lapped need no check', [a({mode: 1}).needT, a({mode: 1}).okT, a({mode: 1, ast: 314.16}).okT, a({mode: 1, ph: 16}).needT, a({mode: 1, rho1: 20}).needT, a({mode: 1, ph: 16}).okT], [true, false, true, false, false, true]);
  check('lap alpha3 uses sum Ast,min = As (sigma / fyd): 314.16 mm2 of links gives lambda 0 and alpha3 1; 628.32 gives lambda 1 and alpha3 0.9 with K = 0.1', [near(a({mode: 1, ast: 314.16}).lam, 0, 1e-4), near(a({mode: 1, ast: 628.32}).lam, 1, 1e-4), near(a({mode: 1, ast: 628.32}).a3, 0.9, 1e-4)], [true, true, true]);
  check('minimum mandrel diameters (Table 8.1N): phi 12 gives 48, 16 gives 64, 20 gives 140 mm', [a({ph: 12}).phiM, a({ph: 16}).phiM, a({ph: 20}).phiM], [48, 64, 140]);
}
let tt;
w.renderCalc('ec2bond'); w.calcResult('ec2bond');
tt = txt(w, 'xbd_results');
check('the default page shows fbd 3.00 MPa, lb,rqd 725 mm, lbd 616 mm and the 🔴 note', [tt.includes('3.00 MPa'), tt.includes('725 mm'), tt.includes('616 mm'), tt.includes('🔴')], [true, true, true, true]);
set('xbd_m', '1'); w.calcResult('ec2bond'); tt = txt(w, 'xbd_results');
check('the lap page shows l0 871 mm, l0,min 307 mm, alpha6 1.414 and the links requirement and shows the lapped-percentage group', [tt.includes('871 mm'), tt.includes('307 mm'), tt.includes('1.414'), tt.includes('314 mm²'), doc.getElementById('xbd_g1').style.display === ''], [true, true, true, true, true]);
check('other reference codes open ec2bond too', others('ec2bond', 'xbd_results'), [true, true, true]);
}
// ---------- part 284: EN 1992-1-1:2004 concrete cover (4.4.1) (`ec2cover`) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const calc = o => J('xcvCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => calc(Object.assign({ex: 1, life: 0, cl: 4, slab: 0, qc: 0, ph: 20, nb: 1, agg: 0, dgam: 0, dst: 0, dadd: 0, dev: 10, xm: 0, sf: 0}, o));
  check('XC1, 50 years, C30/37 (reaches the C30/37 of column XC1, class S4 - 1 = S3): Table 4.4N S3 / XC1 = 10 mm; phi 20 gives cmin,b 20, cmin 20 and cnom 30 mm (bond governs)', [a({}).sc, a({}).cdur, a({}).cminb, a({}).cmin, a({}).cnom, a({}).gov], [3, 10, 20, 20, 30, 0]);
  check('XC1 with C25/30 (below C30/37, no reduction): S4 gives 15 mm; phi 16 gives cmin = max(16, 15, 10) = 16 and cnom 26', [a({cl: 3, ph: 16}).sc, a({cl: 3, ph: 16}).cdur, a({cl: 3, ph: 16}).cmin, a({cl: 3, ph: 16}).cnom, a({cl: 3, ph: 16}).gov], [4, 15, 16, 26, 0]);
  check('XC4 with C40/50 (column XC4 needs C40/50): S3 / XC4 = 25 mm; phi 25 gives cnom 35 mm; aggregate over 32 mm adds 5 to cmin,b: cnom 40 mm', [a({ex: 4, cl: 6, ph: 25}).sc, a({ex: 4, cl: 6, ph: 25}).cdur, a({ex: 4, cl: 6, ph: 25}).cnom, a({ex: 4, cl: 6, ph: 25, agg: 1}).cminb, a({ex: 4, cl: 6, ph: 25, agg: 1}).cnom], [3, 25, 35, 30, 40]);
  check('XD3, 100 years, C45/55: class 4 + 2 - 1 = S5 gives 50 mm (cnom 60); slab geometry gives S4 = 45 (cnom 55); with special quality control S3 = 40 (cnom 50)', [a({ex: 7, life: 1, cl: 7}).sc, a({ex: 7, life: 1, cl: 7}).cnom, a({ex: 7, life: 1, cl: 7, slab: 1}).sc, a({ex: 7, life: 1, cl: 7, slab: 1}).cnom, a({ex: 7, life: 1, cl: 7, slab: 1, qc: 1}).sc, a({ex: 7, life: 1, cl: 7, slab: 1, qc: 1}).cnom], [5, 60, 4, 55, 3, 50]);
  check('XS1 uses the XD1/XS1 column of Table 4.4N and the XD2/XS1 column of Table 4.3N (C40/50): C40/50 gives S3 = 30 mm (cnom 40); C35/45 gives S4 = 35 mm (cnom 45); XD1 with C40/50 gives the same 30 mm', [a({ex: 8, cl: 6}).sc, a({ex: 8, cl: 6}).cdur, a({ex: 8, cl: 6}).cnom, a({ex: 8, cl: 5}).sc, a({ex: 8, cl: 5}).cdur, a({ex: 8, cl: 5}).cnom, a({ex: 5, cl: 6}).cdur], [3, 30, 40, 4, 35, 45, 30]);
  check('XD2 with C40/50: S3 / XD2 = 35 mm (cnom 45); XS2 follows XD3/XS2/XS3 in Table 4.3N (C45/55) and XD2/XS2 in Table 4.4N: C45/55 gives S3 = 35 mm, C40/50 gives S4 = 40 mm', [a({ex: 6, cl: 6}).cdur, a({ex: 6, cl: 6}).cnom, a({ex: 9, cl: 7}).sc, a({ex: 9, cl: 7}).cdur, a({ex: 9, cl: 6}).sc, a({ex: 9, cl: 6}).cdur], [35, 45, 3, 35, 4, 40]);
  check('class S1 row (3 reductions): X0 10, XC4 15, XD1 20, XD2 25 (restored cell), XD3 30; 100 years without reductions on X0 with C25/30 gives S6 = 20 mm', [a({ex: 0, slab: 1, qc: 1}).sc, a({ex: 0, slab: 1, qc: 1}).cdur, a({ex: 4, cl: 6, slab: 1, qc: 1}).cdur, a({ex: 5, cl: 6, slab: 1, qc: 1}).cdur, a({ex: 6, cl: 6, slab: 1, qc: 1}).cdur, a({ex: 7, cl: 7, slab: 1, qc: 1}).cdur, a({ex: 0, cl: 3, life: 1}).sc, a({ex: 0, cl: 3, life: 1}).cdur], [1, 10, 15, 20, 25, 30, 6, 20]);
  check('10 mm floor: phi 8 on S1 / X0 with dst 5 gives max(8, 5, 10) = 10 (the minimum governs); with dst 0 the durability value 10 governs', [a({ex: 0, slab: 1, qc: 1, ph: 8, dst: 5}).cmin, a({ex: 0, slab: 1, qc: 1, ph: 8, dst: 5}).gov, a({ex: 0, slab: 1, qc: 1, ph: 8}).gov], [10, 2, 1]);
  check('additions: XC4 / C25/30 gives S4 = 30; dgam 5 gives 35; dst 5 gives 25 (cmin,b 20 so 25 governs); with XM2 (+10) and rough surface (+5): cmin = 35 + 15 = 50 and cnom 60', [a({ex: 4, cl: 3}).cdur, a({ex: 4, cl: 3, dgam: 5}).cdur2, a({ex: 4, cl: 3, dst: 5}).cdur2, a({ex: 4, cl: 3, dst: 5}).cmin, a({ex: 4, cl: 3, dgam: 5, xm: 2, sf: 1}).cmin, a({ex: 4, cl: 3, dgam: 5, xm: 2, sf: 1}).cnom], [30, 35, 25, 25, 50, 60]);
  check('cover cast against prepared ground is at least 40 mm and against soil 75 mm: default cnom 30 rises to 40 and 75; the minimum cmin is unchanged', [a({sf: 2}).cnom, a({sf: 3}).cnom, a({sf: 3}).cmin, a({sf: 2}).floor], [40, 75, 20, 40]);
  check('bundle of 3 bars of 20 mm: equivalent diameter 20 sqrt(3) = 34.64 mm so cmin,b 34.64 and cnom 44.64', [near(a({nb: 3}).phn, 34.641, 1e-3), near(a({nb: 3}).cmin, 34.641, 1e-3), near(a({nb: 3}).cnom, 44.641, 1e-3)], [true, true, true]);
}
let tt;
w.renderCalc('ec2cover'); w.calcResult('ec2cover');
tt = txt(w, 'xcv_results');
check('the default page shows cnom 30 mm, cmin 20 mm, class S3 and the 🔴 note', [tt.includes('30 mm'), tt.includes('20 mm'), tt.includes('S3'), tt.includes('🔴')], [true, true, true, true]);
set('xcv_ex', '7'); set('xcv_l', '1'); set('xcv_cl', '7'); w.calcResult('ec2cover'); tt = txt(w, 'xcv_results');
check('XD3, 100 years, C45/55 shows cnom 60 mm and class S5', [tt.includes('60 mm'), tt.includes('S5'), tt.includes('50 mm')], [true, true, true]);
check('other reference codes open ec2cover too', others('ec2cover', 'xcv_results'), [true, true, true]);
}
﻿// ---------- part 285: EN 1993-1-8:2005 bolts, fillet welds and hole spacing (`ec3conn`) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const bolt = o => J('xjnBolt(' + JSON.stringify(o) + ')');
const weld = o => J('xjnWeld(' + JSON.stringify(o) + ')');
const space = o => J('xjnSpace(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => bolt(Object.assign({bi: 2, ci: 5, si: 2, th: 0, n: 1, t: 12, e1: 40, p1: 70, e2: 35, p2: 70, pl: 0, pt: 0, ho: 0, sl: 0, cs: 0, lj: 0, gm2: 1.25, dm: 32, nb: 4, V: 240, T: 0, ct: 0, ks: 0, mu: 0}, o));
  check('shear per plane through the thread, M20 (As 245 mm2) 8.8: 0.6 x 800 x 245 / 1.25 = 94.08 kN, two planes 188.16 kN; 10.9 uses alpha_v 0.5: 98.0 kN; 4.6: 47.04 kN; 4.8: 39.2 kN', [near(a({}).fvPlane, 94.08, 1e-3), near(a({n: 2}).fvRd, 188.16, 1e-3), near(a({ci: 6}).fvPlane, 98, 1e-3), near(a({ci: 0}).fvPlane, 47.04, 1e-3), near(a({ci: 1}).fvPlane, 39.2, 1e-3)], [true, true, true, true, true]);
  check('shear through the unthreaded shank uses the gross area 314.16 mm2 and alpha_v 0.6: 0.6 x 800 x 314.16 / 1.25 = 120.64 kN (also for 10.9)', [near(a({th: 1}).fvPlane, 120.637, 1e-2), near(a({th: 1, ci: 6}).fvPlane, 0.6 * 1000 * 314.159 / 1.25 / 1000, 1e-2)], [true, true]);
  check('tension M20 8.8: 0.9 x 800 x 245 / 1.25 = 141.12 kN; countersunk k2 0.63: 98.78 kN; punching with dm 32, t 12, fu 490: 0.6 pi x 32 x 12 x 490 / 1.25 = 283.74 kN', [near(a({}).ftRd, 141.12, 1e-3), near(a({cs: 1}).ftRd, 98.784, 1e-3), near(a({}).bpRd, 283.739, 0.01)], [true, true, true]);
  check('hole diameters: M12 13, M16 18, M20 22, M24 26, M27 30, M30 33 mm', [a({bi: 0}).d0, a({bi: 1}).d0, a({bi: 2}).d0, a({bi: 4}).d0, a({bi: 5}).d0, a({bi: 6}).d0], [13, 18, 22, 26, 30, 33]);
  check('bearing, end and edge bolt (e1 40, e2 35, p2 70, d0 22, fu 490, t 12): alpha_d = 40 / 66 = 0.6061, k1 = min(2.7545, 2.7545, 2.5) = 2.5, Fb,Rd = 2.5 x 0.6061 x 490 x 20 x 12 / 1.25 = 142.55 kN', [near(a({}).ad, 0.606061, 1e-5), near(a({}).ab, 0.606061, 1e-5), a({}).k1, near(a({}).fbRd, 142.545, 0.01)], [true, true, 2.5, true]);
  check('bearing, inner bolt: alpha_d = 70 / 66 - 1/4 = 0.8106, Fb,Rd = 190.65 kN; the fub / fu ratio limits alpha_b for class 4.6 with e1 60: 400 / 490 = 0.8163', [near(a({pl: 1, pt: 1}).ad, 0.810606, 1e-5), near(a({pl: 1, pt: 1}).fbRd, 190.654, 0.02), near(a({ci: 0, e1: 60}).ab, 0.816327, 1e-5)], [true, true, true]);
  check('k1 formula: edge bolt with e2 25 and p2 50: 2.8 x 25 / 22 - 1.7 = 1.4818 and 1.4 x 50 / 22 - 1.7 = 1.4818; a single line (p2 0) ignores p2', [near(a({e2: 25, p2: 50}).k1, 1.48182, 1e-4), a({p2: 0}).k1, near(a({p2: 0, e2: 25}).k1, 1.48182, 1e-4)], [true, 2.5, true]);
  check('hole type: oversized holes 0.8 x 142.55 = 114.04 kN, slotted perpendicular 0.6 x 142.55 = 85.53 kN; a single lap joint with one row caps bearing at 1.5 fu d t / gM2 = 141.12 kN', [near(a({ho: 1}).fbRd, 114.036, 0.01), near(a({ho: 2}).fbRd, 85.527, 0.01), near(a({sl: 1}).fbRd, 141.12, 1e-3), a({sl: 1}).capped, a({sl: 1, ho: 1}).capped], [true, true, true, true, false]);
  check('long joint: Lj 800 mm with d 20 gives 1 - (800 - 300) / 4000 = 0.875 so Fv,Rd per plane 82.32 kN; Lj 300 gives 1; very long joints stop at 0.75', [a({lj: 800}).blf, near(a({lj: 800}).fvPlane, 82.32, 1e-3), a({lj: 300}).blf, a({lj: 10000}).blf], [0.875, true, 1, 0.75]);
  check('per-bolt demand: V 240 kN and T 200 kN on 4 bolts give 60 kN shear and 50 kN tension; combined 60 / 94.08 + 50 / (1.4 x 141.12) = 0.8908 passes; V 400 kN gives 100 kN above 94.08', [a({T: 200}).fvEd, a({T: 200}).ftEd, near(a({T: 200}).comb, 0.890839, 1e-4), a({T: 200}).okComb, a({}).okSh, a({V: 400}).okSh, a({T: 200}).okTn], [60, 50, true, true, true, false, true]);
  check('slip, M20 8.8: Fp,C = 0.7 x 800 x 245 = 137.2 kN; category C (gM3 1.25) class A: 0.5 x 137.2 / 1.25 = 54.88 kN; category B (gM3 1.1) 62.36 kN; with 50 kN tension (cat. C) (137.2 - 0.8 x 50) x 0.5 / 1.25 = 38.88 kN; class 4.6 is not pre-loaded', [near(a({ct: 2}).fpc, 137.2, 1e-3), near(a({ct: 2}).fsRd, 54.88, 1e-3), near(a({ct: 1}).fsRd, 62.3636, 1e-3), near(a({ct: 2, T: 200}).fsRd, 38.88, 1e-3), a({ci: 0}).slipOk, a({ct: 2, ks: 4, mu: 3}).ks, near(a({ct: 2, ks: 4, mu: 3}).fsRd, 0.63 * 0.2 * 137.2 / 1.25, 1e-3)], [true, true, true, true, false, 0.63, true]);
  const w1 = o => weld(Object.assign({si: 2, a: 5, L: 200, Ft: 100, Fl: 0, jt: 0, lj: 200, gm2: 1.25}, o));
  check('fillet weld S355 (fu 490, bw 0.9): fvw,d = 490 / sqrt(3) / (0.9 x 1.25) = 251.47 MPa, Fw,Rd = 1257.3 N/mm for a = 5 and 251.47 kN over 200 mm; throat 5 gives leg 7.07 mm', [near(w1({}).fvwd, 251.468117, 1e-3), near(w1({}).fwRd, 1257.3406, 0.01), near(w1({}).fwTot, 251.468117, 1e-2), near(w1({}).leg, 7.0711, 1e-3), w1({}).bw], [true, true, true, true, 0.9]);
  check('correlation factor bw: S235 0.8, S275 0.85, S355 0.9, S420 1.0, S460 1.0; S235 fvw,d = 360 / sqrt(3) / (0.8 x 1.25) = 207.85 MPa', [w1({si: 0}).bw, w1({si: 1}).bw, w1({si: 2}).bw, w1({si: 3}).bw, w1({si: 4}).bw, near(w1({si: 0}).fvwd, 207.846, 1e-3)], [0.8, 0.85, 0.9, 1, 1, true]);
  check('transverse force 100 kN on a = 5, L = 200: sigma_perp = tau_perp = 100000 / (sqrt(2) x 5 x 200) = 70.71 MPa, equivalent 141.42 MPa against 490 / (0.9 x 1.25) = 435.56: 0.3247; simplified 500 / 1257.3 = 0.3977 (more conservative)', [near(w1({}).sp, 70.7107, 1e-3), near(w1({}).seq, 141.421, 1e-2), near(w1({}).lim1, 435.556, 1e-2), near(w1({}).ratioD, 0.32469, 1e-4), near(w1({}).ratioS, 0.39766, 1e-4)], [true, true, true, true, true]);
  check('longitudinal force 100 kN: tau_par = 100 MPa, equivalent 173.2 MPa: both methods give 0.3977', [near(w1({Ft: 0, Fl: 100}).tl, 100, 1e-6), near(w1({Ft: 0, Fl: 100}).ratioD, 0.39766, 1e-4), near(w1({Ft: 0, Fl: 100}).ratioS, 0.39766, 1e-4)], [true, true, true]);
  check('minimum length max(30, 6 a): a = 5 gives 30 (L 29 fails, 30 passes), a = 8 gives 48; throat under 3 mm fails', [w1({}).minL, w1({L: 29}).okL, w1({L: 30}).okL, w1({a: 8}).minL, w1({a: 2.9}).okA, w1({a: 3}).okA], [30, false, true, 48, false, true]);
  check('long joints: lap Lj 1000 with a = 5 (150a = 750): 1.2 - 0.2 x 1000 / 750 = 0.9333; stiffener weld L 3000: 1.1 - 3 / 17 = 0.9235, L 1700: 1.0, L 12000: 0.6 floor; no reduction for jt 1; fvw,d scales with the factor', [near(w1({lj: 1000}).bl, 0.933333, 1e-5), near(w1({jt: 2, L: 3000}).bl, 0.923529, 1e-5), w1({jt: 2, L: 1700}).bl, w1({jt: 2, L: 12000}).bl, w1({jt: 1, lj: 5000}).bl, near(w1({lj: 1000}).fvwd, 251.468117 * 0.933333, 1e-3)], [true, true, 1, 0.6, 1, true]);
  const s1 = o => space(Object.assign({d0: 22, t: 12, ex: 0, e1: 40, e2: 35, p1: 70, p2: 70}, o));
  check('Table 3.3 d0 22, t 12: e1 and e2 from 1.2 d0 = 26.4 to 4t + 40 = 88 (exposed) or max(8t, 125) = 125 (not exposed); p1 from 2.2 d0 = 48.4 and p2 from 2.4 d0 = 52.8 up to min(14t, 200) = 168; t 16 gives 200', [near(s1({}).e1[0], 26.4, 1e-9), s1({}).e1[1], s1({ex: 1}).e1[1], near(s1({}).p1[0], 48.4, 1e-9), s1({}).p1[1], near(s1({}).p2[0], 52.8, 1e-9), s1({t: 16}).p1[1]], [true, 88, 125, true, 168, true, 200]);
  check('spacing checks: the defaults pass; e1 20 fails; p1 40 fails; p2 50 fails; e1 100 fails when exposed but passes when not exposed', [s1({}).ok1 && s1({}).ok2 && s1({}).okp1 && s1({}).okp2, s1({e1: 20}).ok1, s1({p1: 40}).okp1, s1({p2: 50}).okp2, s1({e1: 100}).ok1, s1({e1: 100, ex: 1}).ok1], [true, false, false, false, false, true]);
}
let tt;
w.renderCalc('ec3conn'); w.calcResult('ec3conn');
tt = txt(w, 'xjn_results');
check('the default page shows Fv,Rd 94.1 kN, Fb,Rd 142.5 kN, Ft,Rd 141.1 kN and the 🔴 note', [tt.includes('94.1 kN'), tt.includes('142.5 kN'), tt.includes('141.1 kN'), tt.includes('🔴')], [true, true, true, true]);
set('xjn_m', '1'); w.calcResult('ec3conn'); tt = txt(w, 'xjn_results');
check('the weld page shows 251.5 kN, 1257 N/mm and 0.398, and hides the bolt group', [tt.includes('251.5 kN'), tt.includes('1257 N/mm'), tt.includes('0.398'), doc.getElementById('xjn_g0').style.display === 'none'], [true, true, true, true]);
set('xjn_m', '2'); w.calcResult('ec3conn'); tt = txt(w, 'xjn_results');
check('the spacing page shows 26.4 to 88.0 mm and 48.4 mm', [tt.includes('26.4'), tt.includes('88.0'), tt.includes('48.4'), doc.getElementById('xjn_g2').style.display === ''], [true, true, true, true]);
check('other reference codes open ec3conn too', others('ec3conn', 'xjn_results'), [true, true, true]);
}

﻿// ---------- part 286: ACI 318-14 bearing (22.8), shear friction (22.9) and corbels (16.5) (`acisf`) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const bear = o => J('xcrBear(' + JSON.stringify(o) + ')');
const fric = o => J('xcrFric(' + JSON.stringify(o) + ')');
const corb = o => J('xcrCorbel(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const b1 = o => bear(Object.assign({fc: 30, A1: 40000, A2: 160000, wider: 1, Bu: 1000}, o));
  check('bearing 200 x 200 on 400 x 400 (sqrt(A2 / A1) = 2): Bn = 0.85 x 30 x 40000 x 2 = 2040 kN, phi Bn = 0.65 x 2040 = 1326 kN; A2 = 90000 gives factor 1.5 and phi Bn 994.5 kN; A2 above 4 A1 is capped at 2; not wider gives 1020 kN and 663 kN', [near(b1({}).Bn, 2040, 1e-6), near(b1({}).pBn, 1326, 1e-6), b1({A2: 90000}).ratio, near(b1({A2: 90000}).pBn, 994.5, 1e-6), b1({A2: 1000000}).ratio, near(b1({wider: 0}).Bn, 1020, 1e-6), near(b1({wider: 0}).pBn, 663, 1e-6)], [true, true, 1.5, true, 2, true, true]);
  check('bearing check: Bu 1000 kN passes with phi Bn 1326; Bu 1400 fails; the design bearing stress is 0.65 x 0.85 x 30 x 2 = 33.15 MPa; A2 smaller than A1 gives the factor 1', [b1({}).ok, b1({Bu: 1400}).ok, near(b1({}).stress, 33.15, 1e-6), b1({A2: 20000}).ratio], [true, false, true, 1]);
  const f1 = o => fric(Object.assign({fc: 30, fy: 420, lam: 0, surf: 0, ac: 150000, Vu: 400, alpha: 90, Nu: 0, Nuc: 0, avfp: 0}, o));
  check('shear friction Vu 400 kN (Vn = 533.3 kN) monolithic mu 1.4: Avf = 533333 / (1.4 x 420) = 907.0 mm2; roughened mu 1.0: 1269.8; not roughened mu 0.6: 2116.4; steel mu 0.7: 1814.2', [near(f1({}).avf, 907.029, 1e-2), near(f1({surf: 1}).avf, 1269.84, 1e-2), near(f1({surf: 2}).avf, 2116.4, 1e-1), near(f1({surf: 3}).avf, 533333.33 / (0.7 * 420), 1e-1)], [true, true, true, true]);
  check('maximum Vn: monolithic normalweight 30 MPa, Ac 150000: least of 900, 855 and 1650 = 855 kN; not roughened or lightweight: least of 900 and 5.5 Ac = 825 kN; Vu 500 kN needs Vn 666.7 below 855 but Vu 700 kN needs 933 above', [near(f1({}).vmax, 855, 1e-6), f1({surf: 2}).vmax, f1({lam: 2}).vmax, f1({Vu: 500}).okMax, f1({Vu: 700}).okMax, f1({}).first, f1({surf: 2}).first], [true, 825, 825, true, false, true, false]);
  check('lightweight lambda: all-lightweight 0.75 gives mu = 1.05 and Avf = 533333 / (1.05 x 420) = 1209.4; sand-lightweight 0.85 gives mu 1.19', [near(f1({lam: 2}).mu, 1.05, 1e-9), near(f1({lam: 2}).avf, 1209.37, 1e-1), near(f1({lam: 1}).mu, 1.19, 1e-9)], [true, true, true]);
  check('inclined bars at 60 degrees: k = 1.4 sin60 + cos60 = 1.7124, Avf = 533333 / (420 x 1.7124) = 741.5 mm2; permanent compression 100 kN on perpendicular bars: 907.0 - 100000 / 420 = 668.9; the compression is ignored for inclined bars', [near(f1({alpha: 60}).k, 1.71244, 1e-4), near(f1({alpha: 60}).avf, 741.54, 1e-1), near(f1({Nu: 100}).avf, 668.93, 1e-1), near(f1({alpha: 60, Nu: 100}).avf, 741.54, 1e-1)], [true, true, true, true]);
  check('net tension 90 kN adds An = 90000 / (0.9 x 420) = 238.1 mm2: total 1145.1 mm2; fy 500 is limited to 420 for shear friction (and 550 for tension)', [near(f1({Nuc: 90}).an, 238.095, 1e-2), near(f1({Nuc: 90}).tot, 1145.12, 1e-1), f1({fy: 500}).fyv, near(f1({fy: 500}).avf, f1({}).avf, 1e-9), f1({fy: 600}).fyt], [true, true, 420, true, 550]);
  check('provided Avf 1000 mm2 perpendicular: Vn = 1.4 x 1000 x 420 = 588 kN, phi Vn = 441 kN passes Vu 400; Avf 900 gives 396.9 kN and fails; with Nu 100 kN: Vn = 1.4 (1000 x 420 + 100000) = 728 kN limited to 855', [near(f1({avfp: 1000}).pVn, 441, 1e-6), f1({avfp: 1000}).okProv, near(f1({avfp: 900}).pVn, 396.9, 1e-6), f1({avfp: 900}).okProv, near(f1({avfp: 1000, Nu: 100}).vnProv, 728, 1e-6), f1({avfp: 1000, Nuc: 90}).okTot], [true, true, true, false, true, false]);
  const c1 = o => corb(Object.assign({fc: 30, fy: 420, lam: 0, bw: 300, h: 500, d: 450, av: 150, Vu: 500, Nuc: 0, prev: 0, hout: 250, asp: 0}, o));
  check('corbel bw 300, h 500, d 450, av 150, Vu 500: av / d = 0.3333, Nuc raised to 0.2 Vu = 100 kN, Mu = 500 x 150 + 100 x 50 = 80 kN.m; Vu / phi 666.7 is below the limit min(810, 769.5, 1485) = 769.5 kN', [near(c1({}).avd, 1 / 3, 1e-9), c1({}).nuc, c1({}).Mu, near(c1({}).vlim, 769.5, 1e-6), c1({}).okV, c1({Vu: 600}).okV, c1({}).ok1 && c1({}).ok2 && c1({}).ok3], [true, 100, 80000, true, true, false, true]);
  check('corbel reinforcement: a = 32.13 mm, Af = 585.3, An = 100000 / (0.75 x 420) = 317.5, Avf = 500000 / (0.75 x 1.4 x 420) = 1133.8; Asc = max(902.7, 2/3 Avf + An = 1073.3, 385.7) = 1073.3 mm2 (shear friction governs); Ah = 0.5 (1073.3 - 317.5) = 377.9', [near(c1({}).a, 32.1324, 1e-3), near(c1({}).af, 585.27, 1e-2), near(c1({}).an, 317.46, 1e-2), near(c1({}).avf, 1133.79, 1e-2), near(c1({}).asc, 1073.32, 1e-2), c1({}).gov, near(c1({}).ah, 377.93, 1e-2)], [true, true, true, true, true, 1, true]);
  check('corbel rules: Nuc prevented uses the entered value (0 gives An 0); Nuc above Vu fails; av / d above 1 fails; outer depth under 0.5 d (225 mm) fails; lightweight limit (0.2 - 0.07 / 3) f\'c bw d = 715.5 kN and (5.5 - 1.9 / 3) bw d = 657 kN', [c1({prev: 1}).nuc, c1({prev: 1}).an, c1({prev: 1, Nuc: 600}).ok2, c1({av: 500}).ok1, c1({hout: 200}).ok3, near(c1({lam: 2}).vlim, 657, 1e-6), near(c1({lam: 2, fc: 30}).mu, 1.05, 1e-9)], [0, 0, false, false, false, true, true]);
  check('corbel provided steel: 1073 mm2 is just below 1073.3 and fails, 1100 passes; the minimum 0.04 f\'c / fy bw d governs a very small shear', [c1({asp: 1073}).okAsp, c1({asp: 1100}).okAsp, c1({Vu: 40, prev: 1}).gov], [false, true, 2]);
}
let tt;
w.renderCalc('acisf'); w.calcResult('acisf');
tt = txt(w, 'xcr_results');
check('the bearing page shows Bn 2040 kN, phi Bn 1326 kN, 33.15 MPa and the 🔴 note', [tt.includes('2040 kN'), tt.includes('1326 kN'), tt.includes('33.15 MPa'), tt.includes('🔴')], [true, true, true, true]);
set('xcr_m', '1'); w.calcResult('acisf'); tt = txt(w, 'xcr_results');
check('the shear friction page shows Avf 907 mm2 and 855 kN and hides the bearing group', [tt.includes('907 mm²'), tt.includes('855 kN'), doc.getElementById('xcr_g0').style.display === 'none', doc.getElementById('xcr_g1').style.display === ''], [true, true, true, true]);
set('xcr_m', '2'); w.calcResult('acisf'); tt = txt(w, 'xcr_results');
check('the corbel page shows Af 585 mm2, Asc 1073 mm2, Ah 378 mm2 and 769 kN', [tt.includes('585 mm²'), tt.includes('1073 mm²'), tt.includes('378 mm²'), tt.includes('769 kN')], [true, true, true, true]);
check('other reference codes open acisf too', others('acisf', 'xcr_results'), [true, true, true]);
}


// ---------- part 287: ACI 318-14 torsion of rectangular beams (22.7, 9.6.4, 9.7.5, 9.7.6.3) (`acitor`) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const tor = o => J('xtqCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => tor(Object.assign({fc: 30, fy: 420, fyt: 420, lam: 0, bw: 300, h: 500, d: 450, c: 40, dt: 10, Tu: 30, Vu: 100, Nu: 0, comp: 0, th: 45, at: 0, s: 0, alp: 0}, o));
  check('section 300 x 500, cover 40 + 10 mm stirrup: centreline offset 45, Aoh = 210 x 410 = 86100 mm2, ph = 2 (210 + 410) = 1240, Acp = 150000, pcp = 1600, Ao = 0.85 Aoh = 73185', [a({}).Aoh, a({}).ph, a({}).Acp, a({}).pcp, near(a({}).Ao, 73185, 1e-6)], [86100, 1240, 150000, 1600, true]);
  check('threshold torsion f\'c 30: Tth = 0.083 sqrt(30) x 150000^2 / 1600 = 6.393 kN.m, Tcr = 0.33 ... = 25.42 kN.m, phi Tth 4.795 and phi Tcr 19.06', [near(a({}).tth, 6.392949, 1e-4), near(a({}).tcr, 25.41775, 1e-3), near(a({}).phi * a({}).tth, 4.794712, 1e-4), near(a({}).phi * a({}).tcr, 19.06331, 1e-3)], [true, true, true, true]);
  check('torsion is neglected when Tu does not exceed phi Tth: 4 kN.m yes, 5 kN.m no', [a({Tu: 4}).negl, a({Tu: 5}).negl], [true, false]);
  check('axial compression 500 kN raises both by sqrt(1 + 500000 / (0.33 x 150000 x 5.477)) = 1.6865: Tth 10.78 and Tcr 42.87 kN.m; tension -500 kN lowers them to sqrt(1 - 1.8444) -> 0 (floored)', [near(a({Nu: 500}).tth, 10.78152, 1e-3), near(a({Nu: 500}).tcr, 42.86629, 1e-3), a({Nu: -500}).tth, near(a({Nu: -100}).nf, 1 - 100000 / (0.33 * 150000 * Math.sqrt(30)), 1e-9)], [true, true, 0, true]);
  check('compatibility torsion: Tu 30 above phi Tcr (19.06) is reduced to 19.06 kN.m; equilibrium torsion keeps 30; compatibility Tu 10 is not reduced', [near(a({comp: 1}).tud, 19.06331, 1e-3), a({}).tud, a({comp: 1, Tu: 10}).tud, a({comp: 1}).red], [true, 30, 10, true]);
  check('section limit: sqrt((100000 / 135000)^2 + (30e6 x 1240 / (1.7 x 86100^2))^2) = 3.043 MPa against 0.75 (0.17 + 0.66) sqrt(30) = 3.410 passes; Tu 40 gives 4.005 and fails; Vc = 0.17 sqrt(30) x 135000 = 125.7 kN', [near(a({}).lhs, 3.043329, 1e-4), near(a({}).rhs, 3.409573, 1e-4), a({}).okSec, near(a({Tu: 40}).lhs, 4.0049, 1e-3), a({Tu: 40}).okSec, near(a({}).vc, 125.7023, 1e-3)], [true, true, true, true, false, true]);
  check('stirrups: At / s = 30e6 / (0.75 x 2 x 73185 x 420 x cot45) = 0.6507 mm2/mm; Al = 0.6507 x 1240 x 1 = 806.8 mm2; theta 30: cot 1.732 gives At / s 0.3757 and Al 1397.5', [near(a({}).ats, 0.650667, 1e-5), near(a({}).al, 806.827, 1e-2), near(a({th: 30}).ats, 0.375664, 1e-5), near(a({th: 30}).al, 1397.5, 0.1), a({th: 10}).th, a({th: 80}).th], [true, true, true, true, 30, 60]);
  check('combined transverse steel: Av / s = (100 / 0.75 - 125.7) x 1000 / (420 x 450) = 0.0404 plus 2 x 0.6507 = 1.3417 mm2/mm against the minimum max(0.2426, 0.25) = 0.25', [near(a({}).avs, 0.040376, 1e-5), near(a({}).totReq, 1.341709, 1e-4), near(a({}).totMin, 0.25, 1e-9), near(a({}).tot, 1.341709, 1e-4), a({Tu: 6, Vu: 0}).tot > 0.25], [true, true, true, true, true]);
  check('minimum longitudinal steel: 0.42 sqrt(30) x 150000 / 420 = 821.6 less 0.6507 x 1240 = 14.76 (a) and less 0.175 x 300 / 420 x 1240 = 155 (b): the lesser (a) 14.76 mm2 is below the calculated 806.8 which governs', [near(a({}).almin, 14.757, 1e-2), near(a({}).alDes, 806.827, 1e-2), a({Tu: 5}).alDes >= a({Tu: 5}).almin], [true, true, true]);
  check('limits: spacing min(ph / 8 = 155, 300) = 155 mm; longitudinal bar diameter max(0.042 s, 10): s unset gives 10 mm, s 300 gives 12.6 mm; sqrt(f\'c) is capped at 8.3 MPa (f\'c 100) and fy at 420', [a({}).smax, a({}).dbl, near(a({s: 300}).dbl, 12.6, 1e-9), a({fc: 100}).sfc, a({fy: 500, fyt: 600}).fy, a({fy: 500, fyt: 600}).fyt], [155, 10, true, 8.3, 420, 420]);
  check('provided steel: At 78.5 mm2 at s = 150 gives Tn,a = 2 x 73185 x 78.5 x 420 / 150 = 32.17 kN.m, Al 1500 gives Tn,b = 74.37; phi Tn = 24.13 below Tu 30 fails; s = 100 gives phi Tn = 36.19 and passes; s 200 exceeds 155 mm', [near(a({at: 78.5, s: 150, alp: 1500}).tnA, 32.1721, 1e-3), near(a({at: 78.5, s: 150, alp: 1500}).tnB, 74.3654, 1e-3), a({at: 78.5, s: 150, alp: 1500}).okProv, near(a({at: 78.5, s: 100, alp: 1500}).phi * a({at: 78.5, s: 100, alp: 1500}).tn, 36.1936, 1e-3), a({at: 78.5, s: 100, alp: 1500}).okProv, a({at: 78.5, s: 200, alp: 1500}).okS, a({}).hasProv], [true, true, false, true, true, false, false]);
  check('oversized cover (200 mm) leaves no core: the geometry is invalid', [a({c: 200}).okGeo, a({}).okGeo], [false, true]);
}
let tt;
w.renderCalc('acitor'); w.calcResult('acitor');
tt = txt(w, 'xtq_results');
check('the default page shows Tth 6.39 kN.m, Tcr 25.42 kN.m, At / s 0.651 mm2/mm, Al 807 mm2 and the 🔴 note', [tt.includes('6.39 kN·m'), tt.includes('25.42 kN·m'), tt.includes('0.651 mm²/mm'), tt.includes('807 mm²'), tt.includes('🔴')], [true, true, true, true, true]);
set('xtq_tu', '3'); w.calcResult('acitor'); tt = txt(w, 'xtq_results');
check('a small torsion shows that it can be neglected and no reinforcement lines', [tt.includes('6.39 kN·m'), !tt.includes('mm²/mm')], [true, true]);
check('other reference codes open acitor too', others('acitor', 'xtq_results'), [true, true, true]);
}
// ---------- part 288: ACI 318-14 walls: thickness and simplified axial design (11.3.1, 11.5.3), in-plane shear and minimum reinforcement (11.5.4, 11.6, 11.7) (`aciwall`) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const ax = o => J('xwlAxial(' + JSON.stringify(o) + ')');
const sh = o => J('xwlShear(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => ax(Object.assign({fc: 30, h: 200, len: 1000, lc: 3000, lu: 6000, hu: 3000, wt: 0, kk: 0, Pu: 500, e: 0}, o));
  check('minimum thickness (Table 11.3.1.1): bearing max(100, 3000 / 25 = 120) = 120 mm; nonbearing max(100, 3000 / 30 = 100) = 100; unsupported height 2400 gives 96 so 100 governs; exterior basement 190 mm; 200 mm passes, 110 fails the bearing wall', [a({}).hmin, a({wt: 1}).hmin, a({hu: 2400}).hmin, a({wt: 2}).hmin, a({}).okH, a({h: 110}).okH, a({wt: 1, h: 110}).okH], [120, 100, 100, 190, true, false, true]);
  check('simplified axial strength: k 0.8, lc 3000, h 200: k lc / 32 h = 0.375, Pn = 0.55 x 30 x 200000 x (1 - 0.1406) = 2835.9 kN, phi Pn = 0.65 Pn = 1843.4 kN', [a({}).sl, near(a({}).red, 0.859375, 1e-9), near(a({}).pn, 2835.9375, 1e-3), near(a({}).ppn, 1843.359375, 1e-3), a({}).ok, a({Pu: 2000}).ok, near(a({}).use, 500 / 1843.359375, 1e-6)], [0.375, true, true, true, true, false, true]);
  check('k 1.0 gives reduction 1 - 0.46875^2 = 0.7803; k 2.0 gives 0.1211; a very slender wall (lc 8000, k 2.0, ratio 2.5) is floored at 0', [near(a({kk: 1}).red, 0.780273, 1e-5), near(a({kk: 2}).red, 0.121094, 1e-5), a({kk: 2, lc: 8000}).red, a({kk: 2, lc: 8000}).pn], [true, true, 0, 0]);
  check('middle third: e <= h / 6 = 33.3 mm passes, 40 mm fails; two layers of reinforcement above 250 mm (not for basement walls)', [a({e: 33}).okE, a({e: 40}).okE, a({}).hw, a({h: 300}).hw, a({h: 300, wt: 2}).hw], [true, false, false, true, false]);
  const s = o => sh(Object.assign({fc: 30, fy: 420, fyt: 420, lam: 0, lw: 4000, h: 250, hw: 6000, Nu: 0, Mu: 0, Vu: 600, det: 0, rt: 0, db: 12, nl: 2, dh: 12, st: 200, dv: 12, sv: 200, base: 0}, o));
  check('in-plane shear: d = 0.8 x 4000 = 3200 mm, Vn,max = 0.83 sqrt(30) x 250 x 3200 = 3636.9 kN, Vc (compression) = 0.17 sqrt(30) x 800000 = 744.9 kN', [s({}).d, near(s({}).vmax, 3636.878, 0.01), near(s({}).vc, 744.9027, 1e-3), s({}).Ag], [3200, true, true, 1000000]);
  check('Vu 600: Vu / phi = 800 kN, Vs = 55.1 kN, Av / s = 55097 / (420 x 3200) = 0.0410 mm2/mm (rho_t 0.000164) so the minimum 0.0025 governs; 0.5 phi Vc = 279.3 kN so Vu is above it and Eq. 11.6.2 applies', [s({}).vnReq, near(s({}).vsReq, 55.0973, 1e-3), near(s({}).avs, 0.040995, 1e-5), s({}).half, s({}).rt, s({}).rlMin], [800, true, true, false, 0.0025, 0.0025]);
  check('Vu 200 (below 0.5 phi Vc): Table 11.6.1 bars <= 16 mm with fy 420 give rho_l 0.0012 and rho_t 0.0020; fy 300: 0.0015 and 0.0025; 20 mm bars: 0.0015 and 0.0025; welded wire: 0.0012 and 0.0020', [s({Vu: 200}).half, s({Vu: 200}).rlMin, s({Vu: 200}).rt, s({Vu: 200, fy: 300}).rlMin, s({Vu: 200, fy: 300}).rt, s({Vu: 200, db: 20}).rlMin, s({Vu: 200, db: 20}).rt, s({Vu: 200, rt: 1, db: 20}).rlMin, s({Vu: 200, rt: 1, db: 20}).rt], [true, 0.0012, 0.002, 0.0015, 0.0025, 0.0015, 0.0025, 0.0012, 0.002]);
  check('Eq. 11.6.2 with Vu 3000 kN (rho_t = 0.009688): hw / lw 1.5 gives rho_l = 0.0025 + 0.5 x 1.0 x 0.007188 = 0.006094; hw / lw 0.5 equals rho_t (capped); hw / lw 3 gives the 0.0025 floor; Vn above the maximum is flagged', [near(s({Vu: 3000}).rt, 0.00968779, 1e-7), near(s({Vu: 3000}).rlMin, 0.0060939, 1e-6), near(s({Vu: 3000, hw: 2000}).rlMin, 0.00968779, 1e-7), s({Vu: 3000, hw: 12000}).rlMin, s({Vu: 3000}).okMax, s({}).okMax], [true, true, true, 0.0025, false, true]);
  check('simplified Vc for axial tension -2000 kN: 0.17 (1 - 2e6 / (3.5 x 1e6)) sqrt(30) x 800000 = 319.2 kN; large tension floors at 0', [near(s({Nu: -2000}).vc, 319.244, 1e-2), s({Nu: -10000}).vc], [true, 0]);
  check('detailed Vc: Mu 0 gives eq. (d) only = 0.27 sqrt(30) x 800000 = 1183.1 kN; Nu 1000 kN adds Nu d / 4 lw = 200 kN: 1383.1; Mu 12000 with Vu 600 (Mu / Vu - lw / 2 = 18000 mm) gives eq. (e) = 316.5 kN as the lesser; Mu 2000 keeps (d) below (e) 1533.6', [near(s({det: 1}).vc, 1183.0807, 1e-2), s({det: 1}).vcE, near(s({det: 1, Nu: 1000}).vc, 1383.0807, 1e-2), near(s({det: 1, Mu: 12000}).vc, 316.4619, 1e-2), near(s({det: 1, Mu: 2000}).vc, 1183.0807, 1e-2), near(s({det: 1, Mu: 2000}).vcE, 1533.6, 0.2), near(s({det: 1, Nu: 1000, Mu: 12000}).vc, 352.0175, 1e-2)], [true, null, true, true, true, true, true]);
  check('spacing: 3h = 750 capped at 450 mm; with shear reinforcement required lw / 3 = 1333 and lw / 5 = 800 do not govern; a short wall lw 1200 (Vu 600) gives lw / 3 = 400 and lw / 5 = 240; without Vs required 450', [s({}).s3, s({}).sl, s({}).st, s({lw: 1200, Vu: 600}).sl, s({lw: 1200, Vu: 600}).st, s({Vu: 200}).sl, s({h: 120}).s3], [450, 450, 450, 400, 240, 450, 360]);
  check('provided steel 2 layers of 12 mm at 200 mm: rho = 2 x 113.1 / (250 x 200) = 0.004524 for both directions; Vs = 2 x 113.1 x 420 x 3200 / 200 = 1520 kN; phi (Vc + Vs) = 1698.7 kN passes Vu 600; spacing 600 mm exceeds 450', [near(s({}).rtP, 0.00452389, 1e-7), near(s({}).rlP, 0.00452389, 1e-7), near(s({}).vsP, 1520.028, 0.01), s({}).okV, s({}).okRt && s({}).okRl, s({sv: 600}).okSl, s({st: 600}).okSt, s({st: 0}).hasP], [true, true, true, true, true, false, false, false]);
  check('weak provided steel fails: 8 mm bars at 300 mm give rho_t 0.00134 below 0.0025; two-layer rule above 250 mm; sqrt(f\'c) capped at 8.3 MPa', [s({dh: 8, st: 300}).okRt, s({h: 300}).two, s({h: 300, base: 1}).two, s({h: 200}).two, s({fc: 100}).sfc], [false, true, false, false, 8.3]);
}
let tt;
w.renderCalc('aciwall'); w.calcResult('aciwall');
tt = txt(w, 'xwl_results');
check('the axial page shows 120 mm, Pn 2836 kN, phi Pn 1843 kN and the 🔴 note', [tt.includes('120 mm'), tt.includes('2836 kN'), tt.includes('1843 kN'), tt.includes('🔴')], [true, true, true, true]);
set('xwl_m', '1'); w.calcResult('aciwall'); tt = txt(w, 'xwl_results');
check('the shear page shows Vc 745 kN, 3637 kN, 0.0025 and hides the axial group', [tt.includes('745 kN'), tt.includes('3637 kN'), tt.includes('0.0025'), doc.getElementById('xwl_g0').style.display === 'none', doc.getElementById('xwl_g1').style.display === ''], [true, true, true, true, true]);
check('other reference codes open aciwall too', others('aciwall', 'xwl_results'), [true, true, true]);
}
// ---------- part 289: ACI 318-14 chapter 18 special moment frames: beams (18.6), columns (18.7), joints (18.8) (`aciseis`) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const beam = o => J('xzsBeam(' + JSON.stringify(o) + ')');
const col = o => J('xzsCol(' + JSON.stringify(o) + ')');
const joint = o => J('xzsJoint(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => beam(Object.assign({fc: 30, fy: 420, fyt: 420, lam: 0, bw: 300, h: 600, d: 540, ln: 5000, c1: 500, c2: 500, ast: 1500, asb: 1000, db: 20, wu: 40, Pu: 0, dh: 10, legs: 2, s: 0}, o));
  check('beam dimensions: ln 5000 >= 4 d = 2160; bw >= min(0.3 h = 180, 250) = 180; the beam narrower than the column has no projection; ln 2000 and bw 150 fail', [a({}).ok1, a({}).bwMin, a({}).ok2, a({}).proj, a({}).ok3, a({ln: 2000}).ok1, a({bw: 150}).ok2], [true, 180, true, 0, true, false, false, false].slice(0, 7));
  check('beam wider than the column: bw 700 on c2 500 gives projection 100 <= min(500, 0.75 x 500 = 375); bw 1400 gives 450 and fails', [a({bw: 700}).proj, a({bw: 700}).projMax, a({bw: 700}).ok3, a({bw: 1400}).ok3], [100, 375, true, false]);
  check('longitudinal steel: minimum max(0.25 sqrt(30) / 420 ; 1.4 / 420) x 300 x 540 = 540 mm2; rho 1500 / 162000 = 0.00926; 400 mm2 fails the minimum; 5000 mm2 gives rho 0.0309 above 0.025', [near(a({}).asMin, 540, 1e-6), near(a({}).rhoT, 0.0092593, 1e-6), a({}).okAs, a({ast: 400}).okAs, a({ast: 5000}).okAs], [true, true, true, false, false]);
  check('nominal moments: top 1500 mm2 Mn = 314.26 kN.m, bottom 1000 mm2 Mn = 215.27 kN.m; positive >= half of negative (157.1) passes; 600 mm2 below gives 131.9 and fails', [near(a({}).mnT, 314.2588, 1e-3), near(a({}).mnB, 215.2706, 1e-3), a({}).ok4, near(a({asb: 600}).mnB, 131.88, 0.05), a({asb: 600}).ok4], [true, true, true, true, false]);
  check('probable moments with 1.25 fy: Mpr top 384.72 and bottom 265.49 kN.m; Ve = (384.72 + 265.49) / 5 + 40 x 5 / 2 = 130.04 + 100 = 230.04 kN', [near(a({}).mprT, 384.7169, 1e-3), near(a({}).mprB, 265.4853, 1e-3), near(a({}).ve0, 130.0404, 1e-3), a({}).vg, near(a({}).ve, 230.0404, 1e-3)], [true, true, true, 100, true]);
  check('hoops: Vc = 0 because the earthquake shear 130 >= half of Ve (115) and Pu 0 < Ag f\'c / 20 = 270 kN: Av / s = 230.04 / 0.75 / (420 x 540) = 1.3524 mm2/mm; Pu 300 kN restores Vc = 150.84 kN and Av / s 0.6873', [a({}).eqHalf, a({}).vc, near(a({}).avs, 1.352384, 1e-5), near(a({Pu: 300}).vc, 150.8428, 1e-3), near(a({Pu: 300}).avs, 0.68733, 1e-4)], [true, 0, true, true, true]);
  check('hoop spacing: min(d / 4 = 135, 6 x 20 = 120, 150) = 120 mm over 2 h = 1200 mm, d / 2 = 270 outside; 2 legs of 10 mm at 100 mm give 1.5708 and pass; at 150 mm the spacing exceeds 120 and Av / s 1.047 fails', [a({}).sMax, a({}).zone, a({}).sMid, near(a({s: 100}).avsP, 1.570796, 1e-5), a({s: 100}).okS && a({s: 100}).okAv, a({s: 150}).okS, a({s: 150}).okAv], [120, 1200, 270, true, true, false, false]);
  const c = o => col(Object.assign({fc: 30, fyt: 420, lam: 0, ty: 0, b: 500, h: 500, lu: 3000, db: 20, Pu: 1500, ast: 4000, nl: 8, hx: 150, c: 40, dh: 12, a1: 0, a2: 0, s: 0, mt: 300, mb: 300, d: 440}, o));
  check('column limits: 500 x 500 passes 300 mm and 0.4; 250 mm and 300 x 800 (0.375) fail; rho 4000 / 250000 = 0.016 in range, 2000 (0.008) and 16000 (0.064) fail', [c({}).ok1 && c({}).ok2, c({b: 250, h: 250}).ok1, c({b: 300, h: 800}).ok2, near(c({}).ratio, 1, 1e-9), c({}).okRho, c({ast: 2000}).okRho, c({ast: 16000}).okRho], [true, false, false, true, true, false, false]);
  check('column zones: lo = max(500, 3000 / 6, 450) = 500; so = 100 + (350 - 150) / 3 -> capped at 150; spacing = min(500 / 4 = 125, 6 x 20 = 120, 150) = 120 inside and min(120, 150) = 120 outside; hx 350 gives so 100; hx 100 caps at 150', [c({}).lo, c({}).so, c({}).sMax, c({}).sOut, c({hx: 350}).so, c({hx: 100}).so, c({lu: 6000}).lo], [500, 150, 120, 120, 100, 150, 1000]);
  check('confinement (Pu 1500 <= 0.3 Ag f\'c 2250): Ach = 420^2 = 176400, Ag / Ach 1.4172; (a) 0.3 (0.4172) 30 / 420 = 0.008941 governs over (b) 0.006429; Ash required at s 120 = 0.008941 x 120 x 420 = 450.6 mm2; kf = 1 and kn = 8 / 6', [c({}).high, c({}).Ach, near(c({}).agach, 1.4172336, 1e-6), near(c({}).ra, 0.0089407, 1e-6), near(c({}).rb, 0.0064286, 1e-6), c({}).rc, near(c({}).ash1, 450.612, 0.01), c({}).gov, c({}).kf, near(c({}).kn, 4 / 3, 1e-9)], [false, 176400, true, true, true, 0, true, 0, 1, true]);
  check('high axial load Pu 3000 > 0.3 Ag f\'c: (c) 0.2 kf kn Pu / (fyt Ach) = 0.010798 governs, hx must be <= 200; fc 80 also counts as high; hx 250 fails only when high', [c({Pu: 3000}).high, near(c({Pu: 3000}).rc, 0.0107980, 1e-6), c({Pu: 3000}).gov, c({Pu: 3000}).hxMax, c({fc: 80}).high, c({hx: 250}).okHx, c({hx: 250, Pu: 3000}).okHx], [true, true, 2, 200, true, true, false]);
  check('provided hoops: legs of 380 mm2 at s = 100 cover 0.008941 x 420 x 100 = 375.5 and pass; 300 mm2 fails; s over the maximum fails', [c({a1: 380, a2: 380, s: 100}).okA, c({a1: 300, a2: 380, s: 100}).okA, c({a1: 380, a2: 380, s: 130}).okS], [true, false, false]);
  check('circular column D 500: Ag / Ach 1.4172, (d) 0.45 (0.4172) 30 / 420 = 0.013411 governs over (e) 0.008571; spiral wire area at s 120 and Dc 420: 0.013411 x 420 x 120 / 4 = 169.0 mm2', [near(c({ty: 1}).ra, 0.0134111, 1e-6), near(c({ty: 1}).rb, 0.0085714, 1e-6), near(c({ty: 1}).abReq, 168.98, 0.05), c({ty: 1}).dc, c({ty: 1, Pu: 3000}).gov], [true, true, true, 420, 2]);
  check('column shear: Ve = (300 + 300) / 3 = 200 kN; Pu 1500 above Ag f\'c / 20 = 375 kN so Vc = 0.17 (1 + 1500000 / (14 x 250000)) sqrt(30) x 500 x 440 = 292.6 kN and no stirrups are needed; Pu 100 kN gives Vc = 0 and Av / s = 200 / 0.75 / (420 x 440) = 1.443', [c({}).ve, c({}).vc0, near(c({}).vc, 292.64, 0.05), c({}).avs, near(c({Pu: 100}).avs, 1.443001, 1e-5)], [200, false, true, 0, true]);
  const j = o => joint(Object.assign({fc: 30, fy: 420, lam: 0, snc: 1500, snb: 1000, b: 500, h: 500, bw: 300, e: 0, hb: 600, cf: 0, at: 1500, ab: 1000, vcol: 150, db: 20}, o));
  check('strong column: 1500 / 1000 = 1.5 >= 1.2 passes; 1100 gives 1.1 and fails', [j({}).sc, j({}).okSc, j({snc: 1100}).sc, j({snc: 1100}).okSc], [1.5, true, 1.1, false]);
  check('joint area: beam narrower than the column: bj = min(500, 300 + 500, 2 x 250) = 500, Aj = 250000; column 400 wide gives 400; eccentricity 50 gives min(400, 700, 2 x 150) = 300; wider beam gives the column width', [j({}).bj, j({}).Aj, j({b: 400}).bj, j({b: 400, e: 50}).bj, j({bw: 600}).bj], [500, 250000, 400, 300, 500]);
  check('joint shear: Vj = 1.25 x 420 x 2500 / 1000 - 150 = 1162.5 kN; Vn = 1.7 sqrt(30) x 250000 = 2327.8 kN (four faces), 1643.2 (1.2) and 1369.3 (1.0); phi Vn = 1978.6 passes with use 0.5875', [near(j({}).vj, 1162.5, 1e-6), near(j({}).vn, 2327.82, 0.01), near(j({cf: 1}).vn, 1643.17, 0.01), near(j({cf: 2}).vn, 1369.31, 0.01), near(j({}).pvn, 1978.648, 0.01), j({}).okV, near(j({}).use, 0.58751, 1e-4), j({at: 3000, ab: 3000, cf: 2}).okV], [true, true, true, true, true, true, true, false]);
  check('joint depth: column 500 >= 20 x 20 = 400 (normalweight), lightweight 26 x 20 = 520 fails, h 300 fails; h >= beam depth / 2 = 300', [j({}).dmin, j({}).okD, j({lam: 2}).dmin, j({lam: 2}).okD, j({h: 300}).okD, j({h: 300}).okH, j({h: 250}).okH], [400, true, 520, false, false, true, false]);
}
let tt;
w.renderCalc('aciseis'); w.calcResult('aciseis');
tt = txt(w, 'xzs_results');
check('the beam page shows Ve 230.0 kN, Av / s 1.352 mm2/mm, the 120 mm spacing and the 🔴 note', [tt.includes('230.0 kN'), tt.includes('1.352 mm²/mm'), tt.includes('120 mm'), tt.includes('🔴')], [true, true, true, true]);
set('xzs_m', '1'); w.calcResult('aciseis'); tt = txt(w, 'xzs_results');
check('the column page shows lo 500 mm, 0.0089 and Ash 451 mm2 and hides the beam group', [tt.includes('500 mm'), tt.includes('0.0089'), tt.includes('451'), doc.getElementById('xzs_g0').style.display === 'none', doc.getElementById('xzs_g1').style.display === ''], [true, true, true, true, true]);
set('xzs_m', '2'); w.calcResult('aciseis'); tt = txt(w, 'xzs_results');
check('the joint page shows 1.500, 1979 or 1978.6 kN and 1162.5 kN', [tt.includes('1.500'), tt.includes('1162.5 kN'), tt.includes('1978.6 kN')], [true, true, true]);
check('other reference codes open aciseis too', others('aciseis', 'xzs_results'), [true, true, true]);
}
// ---------- part 290: ACI 318-14 chapter 17 anchors in concrete: tension, shear and interaction (`acianch`) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const anc = o => J('xakCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => anc(Object.assign({fc: 30, futa: 800, fya: 640, ase: 245, da: 20, abrg: 500, hef: 200, ha: 400, np: 0, type: 0, crk: 0, cond: 1, duc: 0, lam: 0, nx: 2, ny: 2, sx: 150, sy: 150, xl: 300, xr: 300, yb: 300, yt: 300, Nua: 100, Vua: 50}, o));
  check('steel tensile strength is limited to min(futa, 1.9 fya, 860 MPa): 800 stays (1.9 x 640 = 1216), 1200 gives 860, fya 400 gives 760', [a({}).futa, a({}).cappedF, a({futa: 1200}).futa, a({futa: 1200}).cappedF, a({fya: 400}).futa], [800, false, 860, true, 760]);
  check('steel in tension: Nsa = 245 x 800 / 1000 = 196 kN per anchor; 4 anchors with phi 0.75 give 588 kN; brittle steel phi 0.65 gives 509.6 kN', [near(a({}).nsa, 196, 1e-9), near(a({}).pNs, 588, 1e-9), near(a({duc: 1}).pNs, 509.6, 1e-9), a({}).n], [true, true, true, 4]);
  check('basic breakout strength hef 200: Nb = 10 sqrt(30) 200^1.5 = 154.92 kN (cast-in); post-installed kc 7 gives 108.44; hef 300 (280 to 635 mm) uses 3.9 sqrt(30) 300^(5/3) = 287.18 kN; hef 250 is below 280 so kc applies: 216.51', [near(a({}).nb, 154.9193, 1e-3), near(a({type: 2}).nb, 108.4435, 1e-3), near(a({hef: 300}).nb, 287.1843, 1e-3), a({hef: 300}).hmid, near(a({hef: 250}).nb, 216.5064, 1e-3), a({type: 2, hef: 300}).hmid], [true, true, true, true, true, false]);
  check('projected area: edges 300 = 1.5 hef, spacing 150: ANc = (300 + 150 + 300)^2 = 562500, ANco = 9 x 200^2 = 360000, ratio 1.5625; Ncbg = 1.5625 x 154.92 = 242.06 kN; left edge 150 gives ANc 450000 and psi_ed 0.85, Ncbg 164.60 kN', [a({}).anc, a({}).anco, near(a({}).ncbg, 242.0615, 1e-3), a({}).psiEd, a({xl: 150}).anc, near(a({xl: 150}).psiEd, 0.85, 1e-9), near(a({xl: 150}).ncbg, 164.6018, 1e-3)], [562500, 360000, true, 1, 450000, true, true]);
  check('far-apart anchors: ANc cannot exceed n ANco (spacing 1000 mm); uncracked concrete: psi_c 1.25 for cast-in (302.58 kN) and 1.4 for post-installed (237.22 kN with kc 7)', [a({sx: 1000, sy: 1000}).anc, near(a({crk: 3}).ncbg, 302.5768, 1e-3), a({crk: 3}).psiC, near(a({crk: 3, type: 2}).ncbg, 237.2202, 1e-3), a({crk: 3, type: 2}).psiC], [1440000, true, 1.25, true, 1.4]);
  check('pullout of a headed bolt: Np = 8 x 500 x 30 / 1000 = 120 kN, psi_c,P 1.4 uncracked gives 168 kN; post-installed uses the entered Np (50 kN); 4 anchors with phi 0.70 (condition B) give 336 kN', [a({}).np, a({}).npn, a({crk: 3}).npn, a({type: 2, np: 50}).np, near(a({}).pNpn, 336, 1e-9)], [120, 120, 168, 50, true]);
  check('phi of concrete failures: cast-in A 0.75 / B 0.70; category 1 0.75 / 0.65; category 2 0.65 / 0.55; category 3 0.55 / 0.45; pullout always uses condition B', [a({cond: 0}).phiCT, a({}).phiCT, a({type: 2, cond: 0}).phiCT, a({type: 2}).phiCT, a({type: 3, cond: 0}).phiCT, a({type: 3}).phiCT, a({type: 4, cond: 0}).phiCT, a({type: 4}).phiCT, a({type: 2, cond: 0}).phiB], [0.75, 0.7, 0.75, 0.65, 0.65, 0.55, 0.55, 0.45, 0.65]);
  check('tension capacity: the minimum of 588 (steel), 0.70 x 242.06 = 169.44 (breakout) and 336 (pullout) = 169.44 kN governed by breakout; side-face blowout is flagged only when hef > 2.5 ca,min', [near(a({}).pNn, 169.4430, 1e-3), a({}).govN, a({}).side, a({hef: 400, xl: 120}).side, a({futa: 200, xl: 1000, xr: 1000, yb: 1000, yt: 1000}).govN], [true, 1, false, true, 0]);
  check('steel in shear: headed bolt 0.6 x 245 x 800 = 117.6 kN per anchor and 4 phi 0.65 gives 305.76 kN; headed stud uses the full 196 kN; brittle phi 0.60', [near(a({}).vsa, 117.6, 1e-9), near(a({}).pVs, 305.76, 1e-9), near(a({type: 1}).vsa, 196, 1e-9), near(a({duc: 1}).pVs, 282.24, 1e-9)], [true, true, true, true]);
  check('basic shear breakout, ca1 300, le = min(200, 8 x 20) = 160: Vb = min(0.6 (160/20)^0.2 sqrt(20) sqrt(30) 300^1.5 = 115.75 ; 3.7 sqrt(30) 300^1.5 = 105.30) = 105.30 kN', [a({}).le, near(a({}).vb1, 115.7515, 1e-3), near(a({}).vb2, 105.3038, 1e-3), near(a({}).vb, 105.3038, 1e-3)], [160, true, true, true]);
  check('shear projected area: AVco = 4.5 x 300^2 = 405000; AVc = (300 + 150 + 300) x min(450, 400) = 300000; psi_ed,V = 0.7 + 0.3 x 300 / 450 = 0.9; psi_h,V = sqrt(450 / 400) = 1.0607; Vcbg = 74.46 kN, phi 0.70 gives 52.12 kN', [a({}).avco, a({}).avc, near(a({}).psiEdV, 0.9, 1e-9), near(a({}).psiHV, 1.06066, 1e-4), near(a({}).vcbg, 74.4611, 1e-3), near(a({}).pVcb, 52.1227, 1e-3), near(a({cond: 0}).pVcb, 55.8458, 1e-3)], [405000, 300000, true, true, true, true, true]);
  check('psi_c,V: cracked 1.0, with No.4 bar 1.2, with stirrups 1.4, uncracked 1.4; thicker member ha 900 gives psi_h 1 and AVc = 750 x 450', [a({crk: 0}).psiCV, a({crk: 1}).psiCV, a({crk: 2}).psiCV, a({crk: 3}).psiCV, a({ha: 900}).psiHV, a({ha: 900}).avc, a({xl: 500, xr: 500}).psiEdV], [1, 1.2, 1.4, 1.4, 1, 337500, 1]);
  check('pryout: kcp 2.0 for hef 200 (1.0 below 65 mm); Vcpg = 2 x 242.06 = 484.12 kN and phi 0.70 gives 338.89 kN; the shear capacity is the minimum 52.12 kN (breakout governs)', [a({}).kcp, a({hef: 60}).kcp, near(a({}).vcpg, 484.1229, 1e-3), near(a({}).pVcp, 338.886, 1e-2), near(a({}).pVn, 52.1227, 1e-3), a({}).govV, a({xl: 1500, xr: 1500, yb: 1500, yt: 1500}).govV].slice(0, 6).concat([true]), [2, 1, true, true, true, 1, true]);
  check('interaction: Nua 60 and Vua 20: 60 / 169.44 = 0.354 and 20 / 52.12 = 0.384 sum 0.738 <= 1.2 passes; Nua 100, Vua 50 gives 0.590 + 0.959 = 1.549 and fails; Vua 5 is below 0.2 so only tension is checked; Nua 20 only shear', [near(a({Nua: 60, Vua: 20}).sum, 0.737811, 1e-4), a({Nua: 60, Vua: 20}).ok, near(a({}).sum, 1.549443, 1e-3), a({}).ok, a({Nua: 100, Vua: 5}).mode, a({Nua: 20, Vua: 50}).mode, a({Nua: 20, Vua: 50}).ok, a({Nua: 60, Vua: 20}).mode], [true, true, true, false, 0, 1, true, 2]);
}
let tt;
w.renderCalc('acianch'); w.calcResult('acianch');
tt = txt(w, 'xak_results');
check('the default page shows 588.0 kN, 169.4 kN, 52.1 kN, 0.738 and the 🔴 note', [tt.includes('588.0 kN'), tt.includes('169.4 kN'), tt.includes('52.1 kN'), tt.includes('0.738'), tt.includes('🔴')], [true, true, true, true, true]);
check('other reference codes open acianch too', others('acianch', 'xak_results'), [true, true, true]);
}
// ---------- part 291: EN 1992-1-1:2004 slender columns, nominal curvature method (5.8.8) (`ec2col`) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const col = o => J('xecCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => col(Object.assign({fck: 30, fyk: 500, gc: 1.5, gs: 1.15, b: 400, h: 400, d: 360, as: 2400, l0: 5000, N: 1500, m01: 30, m02: 60, phi: 1, cc: 0, mrd: 0}, o));
  check('section 400 x 400: i = 400 / sqrt(12) = 115.47, lambda = 5000 / 115.47 = 43.30; n = 1500e3 / (160000 x 20) = 0.46875; omega = 2400 x 434.78 / (160000 x 20) = 0.3261; nu = 1.3261', [near(a({}).i, 115.4701, 1e-3), near(a({}).lam, 43.30127, 1e-4), a({}).n, near(a({}).om, 0.326087, 1e-6), near(a({}).nu, 1.326087, 1e-6), near(a({}).fyd, 434.7826, 1e-3)], [true, true, 0.46875, true, true, true]);
  check('slenderness limit: A = 1 / (1 + 0.2 x 1) = 0.8333, B = sqrt(1 + 2 x 0.3261) = 1.2854, C = 1.7 - 30 / 60 = 1.2: lambda_lim = 20 x 0.8333 x 1.2854 x 1.2 / sqrt(0.46875) = 37.55 so lambda 43.3 is slender; l0 3000 (lambda 25.98) is not', [near(a({}).A, 0.833333, 1e-6), near(a({}).B, 1.285369, 1e-6), near(a({}).C, 1.2, 1e-9), near(a({}).lim, 37.54804, 1e-3), a({}).slender, a({l0: 3000}).slender], [true, true, true, true, true, false]);
  check('curvature: Kr = (1.3261 - 0.46875) / (1.3261 - 0.4) = 0.92576; beta = 0.35 + 30/200 - 43.30/150 = 0.21132; Kphi = 1 + 0.21132 x 1 = 1.21132; 1/r0 = (434.78 / 200000) / (0.45 x 360) = 1.34192e-5; 1/r = 1.5048e-5 per mm', [near(a({}).kr, 0.925763, 1e-5), near(a({}).beta, 0.211325, 1e-5), near(a({}).kphi, 1.211325, 1e-5), near(a({}).curv0, 1.34192e-5, 1e-9), near(a({}).curv, 1.50483e-5, 1e-9)], [true, true, true, true, true]);
  check('second order: e2 = 1.5048e-5 x 5000^2 / 10 = 37.62 mm; M2 = 1500 x 0.03762 = 56.43 kN.m; constant first-order moment (c = 8) gives 70.54', [near(a({}).e2, 37.62076, 1e-3), near(a({}).m2, 56.43114, 1e-3), a({}).c, near(a({cc: 1}).m2, 70.53893, 1e-3), a({cc: 1}).c], [true, true, 10, true, 8]);
  check('first order: M0e = 0.6 x 60 + 0.4 x 30 = 48 kN.m; imperfection ei = 5000 / 400 = 12.5 mm gives 18.75 kN.m; M0Ed = 66.75; MEd = 66.75 + 56.43 = 123.18 kN.m', [a({}).m0e, a({}).ei, a({}).mi, a({}).m0, near(a({}).med, 123.18114, 1e-3), near(a({}).mdes2, 123.18114, 1e-3)], [48, 12.5, 18.75, 66.75, true, true]);
  check('M0e floor 0.4 M02 and opposite-sign moments: M01 = -30 gives 0.6 x 60 - 12 = 24 = 0.4 M02 and C = 1.7 + 0.5 = 2.2 (lambda_lim 68.8); M01 = 0 gives M0e = 36 and C = 1.7', [a({m01: -30}).m0e, near(a({m01: -30}).C, 2.2, 1e-9), near(a({m01: -30}).lim, 20 * 0.8333333 * 1.285369 * 2.2 / Math.sqrt(0.46875), 0.01), a({m01: 0}).m0e, near(a({m01: 0}).C, 1.7, 1e-9), a({m01: -50, m02: 60}).m0e], [24, true, true, 36, true, 24]);
  check('short column l0 3000: second order ignored, M0Ed = 48 + 1500 x 7.5 / 1000 = 59.25; the end moment 60 and the minimum NEd e0 = 1500 x 20 = 30 kN.m: design 60 kN.m; e0 = max(h / 30, 20) = 20 mm', [a({l0: 3000}).m0, a({l0: 3000}).mdes2, a({}).e0, a({}).mmin, a({h: 800, b: 400, d: 700}).e0], [59.25, 60, 20, 30, near(800 / 30, 26.6667, 1e-3) ? 800 / 30 : 0]);
  check('limits of the factors: small axial force N = 100 gives Kr capped at 1; very slender l0 12000 (lambda 103.9) makes beta negative so Kphi = 1 and lambda > 75 is flagged; phi_ef 0 gives Kphi 1 and A = 1', [a({N: 100}).kr, a({l0: 12000}).kphi, a({l0: 12000}).lim75, a({}).lim75, a({phi: 0}).kphi, a({phi: 0}).A], [1, 1, false, true, 1, 1]);
  check('section resistance: MRd 130 kN.m passes with use 0.9475; 100 kN.m fails; 0 skips the check', [a({mrd: 130}).okR, near(a({mrd: 130}).use, 0.947547, 1e-4), a({mrd: 100}).okR, a({}).okR], [true, true, false, true]);
}
let tt;
w.renderCalc('ec2col'); w.calcResult('ec2col');
tt = txt(w, 'xec_results');
check('the default page shows lambda 43.3, lambda_lim 37.5, M2 56.4 kN.m, MEd 123.2 kN.m and the 🔴 note', [tt.includes('43.3'), tt.includes('37.5'), tt.includes('56.4 kN·m'), tt.includes('123.2 kN·m'), tt.includes('🔴')], [true, true, true, true, true]);
check('other reference codes open ec2col too', others('ec2col', 'xec_results'), [true, true, true]);
}
// ---------- part 292: EN 1998-1:2004 detailing of primary seismic beams and columns, DCM and DCH (5.4.3, 5.5.3) and strong column (4.4.2.3) (`ec8det`) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const beam = o => J('xe8Beam(' + JSON.stringify(o) + ')');
const colm = o => J('xe8Col(' + JSON.stringify(o) + ')');
const strong = o => J('xe8Strong(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
const com = {fck: 30, fyk: 500, fywk: 500, gc: 1.5, gs: 1.15, dch: 0, q0: 3.9, t1: 0.8, tc: 0.5};
{
  const a = o => beam(Object.assign({}, com, {bw: 300, hw: 500, d: 450, b: 300, as: 1700, asc: 1000, dbL: 16, dbw: 8, s: 100, first: 50}, o));
  check('curvature ductility: T1 0.8 >= TC 0.5 gives mu = 2 x 3.9 - 1 = 6.8; T1 0.4 < TC gives 1 + 2 x 2.9 x 0.5 / 0.4 = 8.25', [a({}).mu, a({t1: 0.4}).mu, a({t1: 0.5}).mu], [6.8, 8.25, 6.8]);
  check('fctm: C30 = 0.3 x 30^(2/3) = 2.8965 MPa and C60 = 2.12 ln(1 + 68 / 10) = 4.3547 MPa', [near(a({}).fctm, 2.896468, 1e-5), near(a({fck: 60}).fctm, 4.354742, 1e-5)], [true, true]);
  check('beam ratios: rho = 1700 / (300 x 450) = 0.012593, rho\' = 0.007407, rho_max = 0.007407 + 0.0018 / (6.8 x 0.0021739) x 20 / 434.78 = 0.013009 passes; As 1800 gives 0.013333 and fails; rho_min = 0.5 x 2.8965 / 500 = 0.002896', [near(a({}).rho, 0.0125926, 1e-7), near(a({}).rhoC, 0.0074074, 1e-7), near(a({}).rhoMax, 0.0130086, 1e-6), a({}).okMax, a({as: 1800}).okMax, near(a({}).rhoMin, 0.0028965, 1e-7), a({as: 300}).okMin], [true, true, true, true, false, true, false]);
  check('compression steel at least half of the tension steel: 1000 >= 850 passes, 800 fails', [a({}).okHalf, a({asc: 800}).okHalf], [true, false]);
  check('critical region: DCM lcr = hw = 500; DCH 1.5 hw = 750 mm', [a({}).lcr, a({dch: 1}).lcr], [500, 750]);
  check('hoop spacing: DCM min(500 / 4 = 125, 24 x 8 = 192, 225, 8 x 16 = 128) = 125; DCH min(125, 192, 175, 6 x 16 = 96) = 96; 100 passes both, 130 fails DCM, 100 fails nothing in DCM but 110 fails DCH', [a({}).sMax, a({dch: 1}).sMax, a({}).okS, a({s: 130}).okS, a({dch: 1, s: 100}).okS, a({dch: 1, s: 90}).okS], [125, 96, true, false, false, true]);
  check('hoop details: dbw >= 6 (5 fails), first hoop within 50 mm (60 fails), beam width >= 200 (150 fails)', [a({}).okDbw, a({dbw: 5}).okDbw, a({}).okFirst, a({first: 60}).okFirst, a({}).okBw, a({bw: 150}).okBw], [true, false, true, false, true, false]);
  const c = o => colm(Object.assign({}, com, {bc: 500, hc: 500, lcl: 3000, N: 1500, as: 4000, bo: 420, ho: 420, nbx: 4, nby: 4, nx: 4, ny: 4, dbw: 10, dbL: 20, s: 100, base: 1, prot: 0}, o));
  check('column axial force: nu = 1500e3 / (250000 x 20) = 0.3 passes both classes; N 3000 gives 0.6 which passes DCM (0.65) but fails DCH (0.55); rho_l 4000 / 250000 = 0.016 passes, 2000 and 12000 fail', [c({}).nu, c({}).okNu, c({N: 3000}).nu, c({N: 3000}).okNu, c({N: 3000, dch: 1}).okNu, c({}).nuMax, c({dch: 1}).nuMax, c({}).rhoL, c({}).okRho, c({as: 2000}).okRho, c({as: 12000}).okRho], [0.3, true, 0.6, true, false, 0.65, 0.55, 0.016, true, false, false]);
  check('critical region: DCM max(hc 0.5, lcl / 6 = 0.5, 0.45) = 500 mm; DCH max(0.75, 0.5, 0.6) = 750 mm; lcl 1000 gives lcl / hc = 2 so the whole column is critical', [c({}).lcr, c({dch: 1}).lcr, c({lcl: 1000}).whole, c({}).whole, c({lcl: 6000}).lcr], [500, 750, true, false, 1000]);
  check('confinement effectiveness (12 bars, 4 per side, bo = ho = 420): sum bi^2 = 4 x 58800 = 235200; alpha_n = 1 - 235200 / (6 x 420 x 420) = 0.7778; alpha_s = (1 - 100 / 840)^2 = 0.7761; alpha = 0.60362', [c({}).nb, c({}).sumb2, near(c({}).an, 0.777778, 1e-6), near(c({}).as, 0.776077, 1e-6), near(c({}).alpha, 0.603616, 1e-6), near(c({}).bimax, 140, 1e-9)], [12, 235200, true, true, true, true]);
  check('hoops 10 mm with 4 legs per direction: rho_w = 78.54 x (4 x 420 + 4 x 420) / (420 x 420 x 100) = 0.01496; omega_wd = 0.01496 x 434.78 / 20 = 0.3252; required 30 x 6.8 x 0.3 x 0.0021739 x 500 / 420 - 0.035 = 0.12339; provided alpha omega = 0.19631 passes', [near(c({}).rhoW, 0.01496, 1e-5), near(c({}).wwd, 0.325217, 1e-5), near(c({}).req, 0.123385, 1e-5), near(c({}).prov, 0.196306, 1e-5), c({}).okConf], [true, true, true, true, true]);
  check('only the perimeter hoop (2 legs per direction): omega_wd 0.1626 and alpha omega 0.0982 fail the 0.1234 requirement; protection by the strong column rule (q0 x 2/3 = 2.6, mu = 4.2) lowers the requirement to 0.0628 and passes', [near(c({nx: 2, ny: 2}).wwd, 0.162608, 1e-5), near(c({nx: 2, ny: 2}).prov, 0.098153, 1e-5), c({nx: 2, ny: 2}).okConf, near(c({nx: 2, ny: 2, prot: 1}).mu, 4.2, 1e-9), near(c({nx: 2, ny: 2, prot: 1}).req, 0.0628261, 1e-6), c({nx: 2, ny: 2, prot: 1}).okConf], [true, true, false, true, true, true]);
  check('minimum omega_wd: DCM base 0.08 and above the base none; DCH base 0.12 and above 0.08; 0.3252 passes all', [c({}).wmin, c({base: 0}).wmin, c({dch: 1}).wmin, c({dch: 1, base: 0}).wmin, c({}).okW, c({nx: 2, ny: 2, s: 300}).okW], [0.08, 0, 0.12, 0.08, true, false]);
  check('hoop spacing: DCM min(210, 175, 8 x 20 = 160) = 160; DCH min(140, 125, 6 x 20 = 120) = 120; s 100 passes; s 130 passes DCM but fails DCH; bar spacing 140 <= 200 (DCM) and <= 150 (DCH)', [c({}).sMax, c({dch: 1}).sMax, c({}).okS, c({s: 130}).okS, c({s: 130, dch: 1}).okS, c({}).okBar, c({dch: 1}).okBar, c({bo: 520, ho: 520}).okBar && c({bo: 520, ho: 520, dch: 1}).okBar], [160, 120, true, true, false, true, true, false]);
  check('hoop diameter: DCM at least 6; DCH at least max(6, 0.4 x 20 x sqrt(434.78 / 434.78) = 8): 10 passes, 6 fails in DCH and passes in DCM', [c({}).dbwMin, c({dch: 1}).dbwMin, c({dbw: 6}).okDbw, c({dbw: 6, dch: 1}).okDbw, c({dch: 1}).okDbw], [6, 8, true, false, true]);
  check('strong column: 1500 / 1000 = 1.5 >= 1.3 passes; 1200 gives 1.2 and fails; needed 1300 kN.m; mu 6.8 and with q0 x 2/3 mu = 4.2', [strong(Object.assign({}, com, {mrc: 1500, mrb: 1000})).ratio, strong(Object.assign({}, com, {mrc: 1500, mrb: 1000})).ok, strong(Object.assign({}, com, {mrc: 1200, mrb: 1000})).ok, strong(Object.assign({}, com, {mrc: 1200, mrb: 1000})).need, strong(Object.assign({}, com, {mrc: 1500, mrb: 1000})).mu, near(strong(Object.assign({}, com, {mrc: 1500, mrb: 1000})).mu23, 4.2, 1e-9)], [1.5, true, false, 1300, 6.8, true]);
}
let tt;
w.renderCalc('ec8det'); w.calcResult('ec8det');
tt = txt(w, 'xe8_results');
check('the beam page shows mu 6.80, lcr 500 mm, spacing 125 mm, rho 0.0126 and the 🔴 note', [tt.includes('6.80'), tt.includes('500 mm'), tt.includes('125 mm'), tt.includes('0.0126'), tt.includes('🔴')], [true, true, true, true, true]);
set('xe8_m', '1'); w.calcResult('ec8det'); tt = txt(w, 'xe8_results');
check('the column page shows nu 0.300, alpha omega 0.196, lcr 500 mm and hides the beam group', [tt.includes('0.300'), tt.includes('0.196'), tt.includes('500 mm'), doc.getElementById('xe8_g0').style.display === 'none', doc.getElementById('xe8_g1').style.display === ''], [true, true, true, true, true]);
set('xe8_m', '2'); w.calcResult('ec8det'); tt = txt(w, 'xe8_results');
check('the strong column page shows 1.500, 6.80 and 4.20', [tt.includes('1.500'), tt.includes('6.80'), tt.includes('4.20')], [true, true, true]);
check('other reference codes open ec8det too', others('ec8det', 'xe8_results'), [true, true, true]);
}
// ---------- part 293: NFPA 13 (2016) chapter 9, hanging of sprinkler piping (`nfpa13hg`: Tables 9.2.2.1, 9.1.2.1, clauses 9.2.3, 9.2.5, 9.1.1.2) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const hg = o => J('xhgCalc(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const a = o => hg(Object.assign({mat: 0, sz: 4, main: 0, close: 0, span: 3.5, rod: 10, hp: 0, pend: 0, endL: 600, arm: 300, clr: 100, riser: 6, clamp: 400}, o));
  const row = (mat) => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(sz => a({mat: mat, sz: sz}).maxS);
  check('Table 9.2.2.1(b) steel pipe except threaded lightwall (3/4 NA; 1 and 1 1/4 in. 3.7 m; 1 1/2 in. and larger 4.6 m)', row(0), [0, 3.7, 3.7, 4.6, 4.6, 4.6, 4.6, 4.6, 4.6, 4.6, 4.6, 4.6]);
  check('threaded lightwall steel: 1 to 3 in. 3.7 m, larger NA; copper tube: 3/4 and 1 in. 2.4, 1 1/4 and 1 1/2 in. 3.0, 2 to 3 in. 3.7, 3 1/2 in. and larger 4.6 m', [row(1), row(2)], [[0, 3.7, 3.7, 3.7, 3.7, 3.7, 3.7, 0, 0, 0, 0, 0], [2.4, 2.4, 3.0, 3.0, 3.7, 3.7, 3.7, 4.6, 4.6, 4.6, 4.6, 4.6]]);
  check('CPVC: 5 ft 6 in. (1.7 m), 6 ft (1.8), 6 ft 6 in. (2.0), 7 ft (2.1), 8 ft (2.4), 9 ft (2.7), 10 ft (3.0) for 3/4 to 3 in., larger NA; ductile iron only 3, 4, 6 and 8 in. at 4.6 m', [row(3), row(4)], [[1.7, 1.8, 2.0, 2.1, 2.4, 2.7, 3.0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 4.6, 0, 4.6, 0, 4.6, 4.6]]);
  check('spacing check: 2 in. steel 3.5 m passes (max 4.6), 5 m fails, 3/4 in. steel is not applicable and fails; sprinklers closer than 1.8 m on a branch line allow up to 3.7 m for copper 1 in. (2.4 to 3.7) but not on a main', [a({}).okS, a({span: 5}).okS, a({sz: 0}).na, a({sz: 0}).okS, a({mat: 2, sz: 1, span: 3.5}).okS, a({mat: 2, sz: 1, span: 3.5, close: 1}).okS, a({mat: 2, sz: 1, span: 3.5, close: 1, main: 1}).okS, a({mat: 2, sz: 1, close: 1}).useS], [true, false, true, false, false, true, false, 3.7]);
  check('hanger rod (Table 9.1.2.1): up to 4 in. (100 mm) 10 mm; 5, 6 and 8 in. 12 mm; a 10 mm rod on 5 in. pipe fails', [a({sz: 8}).rod, a({sz: 9}).rod, a({sz: 10}).rod, a({sz: 11}).rod, a({sz: 9, rod: 10}).okRod, a({sz: 9, rod: 12}).okRod, a({}).okRod], [10, 12, 12, 12, false, true, true]);
  check('weight of 2 in. Schedule 40 pipe (OD 60.325, ID 52.5 mm): steel 5.442 kg/m, water 2.165 kg/m, total 7.607 kg/m; over 3.5 m W = 0.2612 kN; hanger design load 5 W + 114 kg x 9.81 = 1.306 + 1.118 = 2.424 kN', [near(a({}).steel, 5.441971, 1e-4), near(a({}).water, 2.164902, 1e-4), near(a({}).mpm, 7.606873, 1e-4), near(a({}).W, 0.261182, 1e-5), near(a({}).load, 2.42425, 1e-4), a({}).hasW, a({mat: 2}).hasW], [true, true, true, true, true, true, false]);
  check('1 in. pipe 3.059 kg/m and 4 in. pipe 24.288 kg/m full of water; the sizes of the table use nominal 20 to 200 mm', [near(a({sz: 1}).mpm, 3.058826, 1e-4), near(a({sz: 8}).mpm, 24.288045, 1e-4), a({sz: 0}).mm, a({sz: 11}).mm], [true, true, 20, 200]);
  check('unsupported end length: steel 1 in. 900 mm, 1 1/4 in. 1200, 1 1/2 in. and larger 1500; copper 450, 600, 750; above 100 psi with pendent sprinklers 300 (steel) and 150 (copper); CPVC has no limit here', [a({sz: 1}).endMax, a({sz: 2}).endMax, a({sz: 3}).endMax, a({mat: 2, sz: 1}).endMax, a({mat: 2, sz: 2}).endMax, a({mat: 2, sz: 4}).endMax, a({hp: 1, pend: 1}).endLim, a({mat: 2, hp: 1, pend: 1}).endLim, a({mat: 3}).endLim, a({hp: 1}).endLim], [900, 1200, 1500, 450, 600, 750, 300, 150, 0, 1500]);
  check('end length check: 600 mm on 2 in. steel passes (1500), 1600 fails; 400 mm fails at 100 psi with pendent sprinklers (300)', [a({}).okEnd, a({endL: 1600}).okEnd, a({endL: 400, hp: 1, pend: 1}).okEnd, a({mat: 3, endL: 5000}).okEnd], [true, false, false, true]);
  check('armover: steel 600 mm, copper 300; high pressure pendent 300 and 150; 300 mm passes steel, 700 fails', [a({}).armLim, a({mat: 2}).armLim, a({hp: 1, pend: 1}).armLim, a({mat: 2, hp: 1, pend: 1}).armLim, a({}).okArm, a({arm: 700}).okArm, a({mat: 2, arm: 350}).okArm], [600, 300, 300, 150, true, false, false]);
  check('clearances and risers: hanger to upright sprinkler 75 mm minimum (100 passes, 60 fails); riser supports every 7.6 m maximum (6 passes, 8 fails); clamp within 600 mm (400 passes, 700 fails)', [a({}).okClr, a({clr: 60}).okClr, a({}).okRiser, a({riser: 8}).okRiser, a({}).okClamp, a({clamp: 700}).okClamp], [true, false, true, false, true, false]);
}
let tt;
w.renderCalc('nfpa13hg'); w.calcResult('nfpa13hg');
tt = txt(w, 'xhg_results');
check('the default page shows 4.6 m, 10 mm, 7.6 kg/m, 2.42 kN, 1500 mm and the 🔴 note', [tt.includes('4.6 m'), tt.includes('10 mm'), tt.includes('7.6 kg/m'), tt.includes('2.42 kN'), tt.includes('1500 mm'), tt.includes('🔴')], [true, true, true, true, true, true]);
check('other reference codes open nfpa13hg too', others('nfpa13hg', 'xhg_results'), [true, true, true]);
}
// ---------- part 294: NFPA 70 (NEC 2008) Articles 500 and 501: temperature class, wiring methods and conduit seals of Class I locations (`necha`) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const tmp = o => J('xnhTemp(' + JSON.stringify(o) + ')');
const seal = o => J('xnhSeal(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const t = o => tmp(Object.assign({cls: 0, ait: 280, organic: 0, mark: 0}, o));
  check('Class I, ignition temperature 280 C: the marking may not exceed it so T2A (280) is the hottest class; 12 classes from T2A to T6 are allowed; 449 C gives T2 and 450 C gives T1; 85 C gives T6 and 84 C has none', [t({}).best[1], t({}).codes.length, t({ait: 449}).best[1], t({ait: 450}).best[1], t({ait: 450}).codes.length, t({ait: 85}).best[1], t({ait: 84}).ok], ['T2A', 12, 'T2', 'T1', 14, 'T6', false]);
  check('Class II dust: the marking must be less than the ignition temperature: 200 C gives T3A (180) not T3 (200); 201 C gives T3; organic dust is capped at 165 C: ignition 200 gives T3B (165), ignition 150 gives T4 (135)', [t({cls: 1, ait: 200}).best[1], t({cls: 1, ait: 201}).best[1], t({cls: 1, ait: 200, organic: 1}).best[1], t({cls: 1, ait: 200, organic: 1}).cap, t({cls: 1, ait: 150, organic: 1}).best[1], t({cls: 1, ait: 200}).strict, t({cls: 1, ait: 200, organic: 1}).strict], ['T3A', 'T3', 'T3B', 165, 'T4', true, false]);
  check('80 percent of the ignition temperature defines high temperature for seals: 224 C for 280 C; the marking check: 280 passes for Class I, 281 fails; 200 fails for Class II dust of 200 C', [near(t({}).high, 224, 1e-9), t({mark: 280}).okMark, t({mark: 281}).okMark, t({cls: 1, ait: 200, mark: 200}).okMark, t({cls: 1, ait: 200, mark: 180}).okMark], [true, true, false, false, true]);
  const s = o => seal(Object.assign({div: 1, encl: 0, arc: 1, splice: 0, size: 1, exc: 0, devT: 0, ait: 280, link: 0, nip: 0, bnd: 0, thru: 0, listed: 0}, o));
  check('Division 1 enclosure entry: an arcing device needs a seal within 450 mm; without arcing devices a seal is needed only for trade size 2 and larger with splices or terminals (2 in. yes, 1.5 in. no, 2 in. without splices no)', [s({}).entry, s({}).dist, s({arc: 0}).entry, s({arc: 0, size: 2, splice: 1}).entry, s({arc: 0, size: 1.5, splice: 1}).entry, s({arc: 0, size: 2, splice: 0}).entry], [true, 450, false, true, false, false]);
  check('Division 2 enclosure entry: only the arcing-device rule applies (the size 2 rule does not)', [s({div: 2}).entry, s({div: 2, arc: 0, size: 2, splice: 1}).entry, s({div: 2, arc: 0}).ruleSize], [true, false, false]);
  check('exceptions to the arcing rule: sealed chamber / oil / nonincendive (1 and 2) remove the seal; the factory-sealed exception (3) works for small entries only; the size rule still applies with splices', [s({exc: 1}).entry, s({exc: 2}).entry, s({exc: 3}).entry, s({exc: 3, size: 2}).entry, s({exc: 1}).excUsed, s({exc: 1, size: 2, splice: 1}).entry], [false, false, false, true, true, true]);
  check('high temperature: a device surface at 230 C exceeds 80 percent of 280 C (224) and counts as an ignition source; 200 C does not', [s({arc: 0, devT: 230}).hot, s({arc: 0, devT: 230}).entry, s({arc: 0, devT: 200}).hot, s({arc: 0, devT: 200}).entry], [true, true, false, false]);
  check('two explosionproof enclosures joined by a nipple of 900 mm or less need one seal (within 450 mm of either); 1000 mm or no link do not qualify', [s({link: 1, nip: 800}).group, s({link: 1, nip: 900}).group, s({link: 1, nip: 1000}).group, s({link: 0, nip: 500}).group, s({link: 1, nip: 0}).group], [true, true, false, false, false]);
  check('boundary seals: within 3.05 m of the boundary; the unbroken-conduit exception is for Division 1 only; threads engaged 5 or 4.5 for listed factory-threaded entries', [s({bnd: 1}).boundary, s({bnd: 1}).bndDist, s({bnd: 1, thru: 1}).through, s({bnd: 1, thru: 1, div: 2}).through, s({bnd: 0}).boundary, s({}).threads, s({listed: 1}).threads], [true, 3050, true, false, false, 5, 4.5]);
  check('pressurized enclosure: Division 1 needs a seal within 450 mm; Division 2 is not covered by that clause', [s({encl: 1}).entryP, s({encl: 1, div: 2}).entryP, s({encl: 1}).entry], [true, false, false]);
}
let tt;
w.renderCalc('necha'); w.calcResult('necha');
tt = txt(w, 'xnh_results');
check('the temperature page shows 280 C, T2A, T2A or colder list and 224 C and the 🔴 note', [tt.includes('280 °C'), tt.includes('T2A (280 °C)'), tt.includes('224.0 °C'), tt.includes('🔴')], [true, true, true, true]);
set('xnh_m', '1'); w.calcResult('necha'); tt = txt(w, 'xnh_results');
check('the wiring page shows the Division 1 methods and hides the temperature group', [tt.includes('501.10(A)(1)'), tt.includes('MI'), doc.getElementById('xnh_g0').style.display === 'none', doc.getElementById('xnh_g1').style.display === ''], [true, true, true, true]);
set('xnh_d', '1'); w.calcResult('necha'); tt = txt(w, 'xnh_results');
check('Division 2 wiring page shows the extra methods', [tt.includes('501.10(B)(1)'), tt.includes('PLTC')], [true, true]);
set('xnh_m', '2'); w.calcResult('necha'); tt = txt(w, 'xnh_results');
check('the seal page shows 450 mm and the 5 threads', [tt.includes('450 mm'), tt.includes('5.0'), tt.includes('501.15'), doc.getElementById('xnh_g2').style.display === ''], [true, true, true, true]);
check('other reference codes open necha too', others('necha', 'xnh_results'), [true, true, true]);
}
// ---------- part 295: EN 1992-1-1:2004 slab detailing: supports (9.3.1.2), shear reinforcement (9.3.2), flat slabs (9.4.1, 9.4.2) and punching reinforcement detailing (9.4.3) (`ec2slab`) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const sup = o => J('xesSupport(' + JSON.stringify(o) + ')');
const shr = o => J('xesShear(' + JSON.stringify(o) + ')');
const flat = o => J('xesFlat(' + JSON.stringify(o) + ')');
const pun = o => J('xesPunch(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const s = o => sup(Object.assign({fck: 30, fyk: 500, gc: 1.5, gs: 1.15, acc: 1, d: 150, asSpan: 600, mmax: 20, span: 4, sup: 0, asTop: 0}, o));
  check('simply supported slab: half of the span steel (600 -> 300 mm2/m) continues to the support; al = d = 150 mm', [s({}).half, s({}).al], [300, 150]);
  check('partial fixity not considered: top steel for 25 % of the maximum span moment (20 -> 5 kN.m/m): a = 150 - sqrt(150^2 - 2 x 5e6 / (20 x 1000)) = 1.676, z = 149.16, As = 5e6 / (434.78 x 149.16) = 77.10 mm2/m; extends 0.2 x 4 m = 800 mm', [s({sup: 1}).msup, near(s({sup: 1}).a, 1.67603, 1e-4), near(s({sup: 1}).z, 149.16198, 1e-4), near(s({sup: 1}).asTop, 77.09739, 1e-4), s({sup: 1}).len], [5, true, true, true, 800]);
  check('end support uses 15 percent: 3 kN.m/m gives 46.15 mm2/m; the provided top steel 80 passes the interior case and 60 fails (77.1); a section that cannot resist the moment is flagged; alpha_cc 0.85 raises the steel', [s({sup: 2}).msup, near(s({sup: 2}).asTop, 46.15436, 1e-4), s({sup: 1, asTop: 80}).okTop, s({sup: 1, asTop: 60}).okTop, s({sup: 1, mmax: 4000}).okM, s({sup: 1, acc: 0.85}).asTop > s({sup: 1}).asTop], [3, true, true, false, false, true]);
  const h = o => shr(Object.assign({fck: 30, fyk: 500, h: 250, d: 210, al: 90, ved: 100, vrdmax: 400, bent: 0, s: 0, st: 0, asw: 0}, o));
  check('slab shear reinforcement: thickness >= 200 (250 passes, 180 fails); longitudinal spacing 0.75 d (1 + cot alpha) = 157.5 for 90 degrees and 315 for 45 degrees; bent-up bars d = 210; transverse 1.5 d = 315', [h({}).okH, h({h: 180}).okH, near(h({}).smaxL, 157.5, 1e-9), near(h({al: 45}).smaxL, 315, 1e-9), h({}).smaxB, h({}).stMax], [true, false, true, true, 210, 315]);
  check('minimum ratio 0.08 sqrt(30) / 500 = 0.000876 and 0.876 mm2/mm per metre width (0.619 for 45 degrees); bent-up bars alone only when VEd <= VRd,max / 3 (100 <= 133 passes, 200 fails)', [near(h({}).rhoMin, 0.00087636, 1e-7), near(h({}).aswMin, 0.876356, 1e-5), near(h({al: 45}).aswMin, 0.876356 * Math.SQRT1_2, 1e-5), h({}).bentOk, h({ved: 200}).bentOk, h({bent: 1, ved: 200}).okBent], [true, true, true, true, false, false]);
  check('spacing checks: links at 150 mm pass (157.5), 200 mm fail; bent-up bars at 210 pass, 250 fail; transverse 300 passes, 350 fails; minimum area per metre at 150 mm = 0.876 x 150 = 131.5: 140 passes, 120 fails', [h({s: 150}).okS, h({s: 200}).okS, h({bent: 1, s: 210}).okS, h({bent: 1, s: 250}).okS, h({st: 300}).okSt, h({st: 350}).okSt, near(h({s: 150}).aswMinRow, 131.4534, 1e-3), h({s: 150, asw: 140}).okAsw, h({s: 150, asw: 120}).okAsw], [true, false, true, false, true, false, true, true, false]);
  const f = o => flat(Object.assign({pw: 6, at: 2000, ty: 0, cz: 400, y: 300, z: 250}, o));
  check('internal column: top steel 0.5 At = 1000 mm2 in a width of 2 x 0.125 x 6000 = 1500 mm; at least 2 bottom bars through the column', [f({}).strip, f({}).aStrip, f({}).nBot], [1500, 1000, 2]);
  check('effective width: edge column be = cz + y = 400 + 300 = 700; corner column be = z + y / 2 = 250 + 150 = 400 mm', [f({}).beEdge, f({}).beCorner, f({}).be, f({ty: 1}).be], [700, 400, 700, 400]);
  const p = o => pun(Object.assign({fck: 30, fyk: 500, d: 200, al: 90, sr: 150, st: 250, asw: 0, a1: 100, n: 3, st1: 250, st2: 350, aout: 700, k: 1.5, bent: 0}, o));
  check('Asw,min = 0.08 sqrt(30) / 500 x 150 x 250 / (1.5 sin90 + cos90) = 21.91 mm2 per leg (18.59 for 45 degrees); 25 passes, 20 fails', [near(p({}).aswMin, 21.9089, 1e-3), near(p({al: 45}).aswMin, 18.59032, 1e-3), p({asw: 25}).okAsw, p({asw: 20}).okAsw], [true, true, true, false]);
  check('layout limits d = 200: first perimeter within d / 2 = 100 (100 passes, 120 fails); radial spacing 0.75 d = 150 (150 passes, 160 fails); tangential 1.5 d = 300 inside and 2 d = 400 outside', [p({}).okFirst, p({a1: 120}).okFirst, p({}).okSr, p({sr: 160}).okSr, p({}).st1Max, p({}).st2Max, p({st1: 320}).okSt1, p({st2: 420}).okSt2], [true, false, true, false, 300, 400, false, false]);
  check('outermost perimeter within k d = 300 of the perimeter with no reinforcement at 700 mm: with 3 perimeters the last is at 100 + 2 x 150 = 400 and the gap 300 passes; 2 perimeters leave 450 and fail; at least 3 perimeters are needed; 1 perimeter fails the minimum of two (one is enough for bent-up bars)', [p({}).aLast, p({}).gap, p({}).okOut, p({n: 2}).aLast, p({n: 2}).okOut, p({}).nMin, p({n: 1}).okN, p({n: 1, bent: 1}).okN], [400, 300, true, 250, false, 3, false, true]);
}
let tt;
w.renderCalc('ec2slab'); w.calcResult('ec2slab');
tt = txt(w, 'xes_results');
check('the support page shows 300 mm2/m, al 150 mm and the 🔴 note', [tt.includes('300 mm²/m'), tt.includes('150 mm'), tt.includes('🔴')], [true, true, true]);
set('xes_m', '3'); w.calcResult('ec2slab'); tt = txt(w, 'xes_results');
check('the punching detailing page shows 21.9 mm2, 150 mm and hides the support group', [tt.includes('21.9 mm²'), tt.includes('150 mm'), doc.getElementById('xes_g0').style.display === 'none', doc.getElementById('xes_g3').style.display === ''], [true, true, true, true]);
set('xes_m', '2'); w.calcResult('ec2slab'); tt = txt(w, 'xes_results');
check('the flat slab page shows 1500 mm, 1000 mm2 and 700 mm', [tt.includes('1500 mm'), tt.includes('1000 mm²'), tt.includes('700 mm')], [true, true, true]);
check('other reference codes open ec2slab too', others('ec2slab', 'xes_results'), [true, true, true]);
}
// ---------- part 296: NFPA 13 (2016) clause 9.3.5, seismic sway bracing of sprinkler piping (`nfpa13sw`: Tables 9.3.5.9.3, 9.3.5.5.2(a) (c) (e), 9.3.5.11.8(a) (b) (c)) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const cp = ss => J('xzbCp(' + ss + ')');
const zone = o => J('xzbZone(' + JSON.stringify(o) + ')');
const brace = o => J('xzbBrace(' + JSON.stringify(o) + ')');
const space = o => J('xzbSpace(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  check('seismic coefficient Table 9.3.5.9.3: Ss 0.33 or less gives 0.35; 1.0 gives 0.51; 2.0 gives 0.93; 2.2 gives 1.03; 4.0 gives 1.87; above 4.0 stays 1.87', [cp(0.2), cp(0.33), cp(1.0), cp(2.0), cp(2.2), cp(4.0), cp(5)], [0.35, 0.35, 0.51, 0.93, 1.03, 1.87, 1.87]);
  check('linear interpolation (9.3.5.9.3.2): Ss 0.45 gives 0.39; 0.35 gives 0.35 + 0.03 x 0.02 / 0.07 = 0.3586; 2.25 gives 1.05', [near(cp(0.45), 0.39, 1e-9), near(cp(0.35), 0.358571, 1e-6), near(cp(2.25), 1.05, 1e-9)], [true, true, true]);
  const z = o => zone(Object.assign({ss: 1, sz: 3, sch: 0, sp: 9, len: 9, wb: 150}, o));
  check('zone weight: 2 in. Schedule 40 water-filled 7.607 kg/m x 9 m = 68.46 plus 150 kg of branches = 218.46 kg; Wp = 1.15 x = 251.23 kg; Fpw = 0.51 x 251.23 = 128.13 kg (1.2565 kN)', [near(z({}).mpm, 7.606873, 1e-5), near(z({}).w, 218.4619, 1e-3), near(z({}).wp, 251.2311, 1e-3), near(z({}).fpw, 128.1279, 1e-3), near(z({}).fkn, 1.256505, 1e-5)], [true, true, true, true, true]);
  check('limit table: spacing 9 m uses the 9.1 m (30 ft) column: Schedule 40 2 in. 341 lb = 154.67 kg; use 0.828 passes; spacing 6 m uses the 6.1 m column (520 lb); 7 m the 7.6 m column; 12.2 m the last; 13 m exceeds the 12 m maximum', [z({}).col, near(z({}).lim, 154.675, 1e-3), z({}).ok, near(z({}).use, 0.828368, 1e-5), z({sp: 6}).col, z({sp: 7}).col, z({sp: 12.2}).col, z({sp: 13}).over, z({sp: 13}).ok], [2, true, true, true, 0, 1, 4, true, false]);
  check('other pipe: Schedule 10 2 in. 256 lb at 30 ft = 116.1 kg (fails with Fpw 128.1); Schedule 5 has no 5 in. or 6 in. rows (not available); Schedule 40 6 in. and larger: 5173 lb at 30 ft', [near(z({sch: 1}).lim, 256 * 0.45359237, 1e-3), z({sch: 1}).ok, z({sch: 2, sz: 8}).avail, z({sch: 2, sz: 9}).avail, near(z({sz: 9}).lim, 5173 * 0.45359237, 1e-3)], [true, false, false, false, true]);
  check('a heavier zone fails: Ss 2.0 (Cp 0.93) gives Fpw 233.6 kg above the 154.7 kg limit; a small zone with 20 kg of branches and Ss 0.2 passes', [near(z({ss: 2}).fpw, 0.93 * 251.2311, 1e-3), z({ss: 2}).ok, z({ss: 0.2, wb: 20}).ok], [true, false, true]);
  const b = o => brace(Object.assign({f: 5, ang: 60, len: 1, wpkg: 0}, o));
  check('brace angle bands: 60 to 90 degrees from vertical use the third column; 45 to 59 the second; 30 to 44 the first; under 30 is outside the tables', [b({}).band, b({ang: 50}).band, b({ang: 40}).band, b({ang: 90}).band, b({ang: 20}).low, b({}).low], [2, 1, 0, 2, true, false]);
  check('1 m (39.4 in.) brace carrying 5 kN (1124 lb) at 60 degrees: 1 in. Schedule 40 pipe is within l/r = 100 (42 in.) with 5456 lb = 24.27 kN and passes; all-thread rod 3/4 in. falls to l/r = 300 with 446 lb and fails; rod threaded at ends 7/8 in. uses l/r = 200 with 1952 lb = 8.68 kN and passes; rod 3/8 is too long (no table)', [b({}).rows[0].ok, b({}).rows[0].tab, near(b({}).rows[0].kn, 24.26949, 1e-4), b({}).rows[13].ok, b({}).rows[13].tab, b({}).rows[19].ok, b({}).rows[19].tab, near(b({}).rows[19].kn, 8.682925, 1e-4), b({}).rows[10].ok, b({}).rows[10].tab], [true, '100', true, false, '300', true, '200', true, false, '']);
  check('the lightest suitable brace is the one with the smallest area: 1 in. pipe (0.494 in2); a heavier load of 30 kN (6744 lb) exceeds the 1 in. pipe (5456 lb) and needs a bigger section; an impossible load of 80 kN has none', [b({}).best.name, b({f: 30}).best.area > 0.494, b({f: 30}).okRows.length < b({}).okRows.length, b({f: 80}).best], ['أنبوب Schedule 40 قطر 1 in', true, true, null]);
  check('net vertical reaction (9.3.5.10): Fpw 5 kN = 510 kg with Wp 400 kg: at 40 degrees it exceeds 0.5 Wp below 45 degrees so uplift must be resisted; at 50 degrees it exceeds 1.0 Wp below 60 degrees so yes; at 60 degrees no; Wp 0 skips', [b({ang: 40, wpkg: 400}).vert, b({ang: 50, wpkg: 400}).vert, b({ang: 60, wpkg: 400}).vert, b({ang: 40}).vert, b({ang: 40, wpkg: 2000}).vert], [true, true, false, false, false]);
  const s = o => space(Object.assign({lat: 9, lon: 18, endL: 1.2, endLong: 6, riser: 3, fourSp: 6, coup: 400, brl: 1.5, rad: 10.7, hang: 100}, o));
  check('spacing: lateral 9 m passes, 13 fails (12 m); longitudinal 18 passes, 25 fails (24 m); last lateral brace 1.2 m passes, 2 fails (1.8 m); last longitudinal 6 passes, 13 fails (12 m)', [s({}).okLat, s({lat: 13}).okLat, s({}).okLong, s({lon: 25}).okLong, s({}).okEnd, s({endL: 2}).okEnd, s({}).okEndL, s({endLong: 13}).okEndL], [true, false, true, false, true, false, true, false]);
  check('risers over 0.9 m need a four-way brace and spacing of 7.6 m or less (6 passes, 8 fails); a 0.5 m riser needs none; coupling brace within 600 mm (400 passes, 700 fails); slenderness 1500 / 10.7 = 140 passes and a 4 m brace 374 fails; hanging within 150 mm', [s({}).fourWay, s({}).okFour, s({fourSp: 8}).okFour, s({riser: 0.5}).fourWay, s({riser: 0.5, fourSp: 20}).okFour, s({}).okCoup, s({coup: 700}).okCoup, near(s({}).lr, 140.1869, 1e-3), s({}).okSl, s({brl: 4}).okSl, s({}).okHang, s({hang: 200}).okHang], [true, true, false, false, true, true, false, true, true, false, true, false]);
}
let tt;
w.renderCalc('nfpa13sw'); w.calcResult('nfpa13sw');
tt = txt(w, 'xzb_results');
check('the default page shows Cp 0.510, Wp 251.2 kg, Fpw 128.1 kg, the 154.7 kg limit and the 🔴 note', [tt.includes('0.510'), tt.includes('251.2 kg'), tt.includes('128.1 kg'), tt.includes('154.7 kg'), tt.includes('🔴')], [true, true, true, true, true]);
set('xzb_m', '1'); w.calcResult('nfpa13sw'); tt = txt(w, 'xzb_results');
check('the brace page shows the lightest brace and hides the zone group', [tt.includes('Schedule 40'), tt.includes('24.27 kN'), doc.getElementById('xzb_g0').style.display === 'none', doc.getElementById('xzb_g1').style.display === ''], [true, true, true, true]);
set('xzb_m', '2'); w.calcResult('nfpa13sw'); tt = txt(w, 'xzb_results');
check('the spacing page shows the 12 m and 24 m limits', [tt.includes('12 m'), tt.includes('24 m'), tt.includes('7.6 m')], [true, true, true]);
check('other reference codes open nfpa13sw too', others('nfpa13sw', 'xzb_results'), [true, true, true]);
}
// ---------- part 297: NFPA 72 (2016) clauses 17.14, 17.16, 17.7.1.8, 17.7.3.2.1, 17.7.3.3, 17.7.3.4 (`nfpa72md`: manual fire alarm boxes, supervisory signal-initiating devices, smoke detector ambient limits and mounting) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const man = o => J('xfmManual(' + JSON.stringify(o) + ')');
const sup = o => J('xfmSuper(' + JSON.stringify(o) + ')');
const smk = o => J('xfmSmoke(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const m = o => man(Object.assign({h: 1100, dEx: 1.2, tr: 50, wg: 0, dGr: 1.2, red: 1, cont: 1, vis: 1}, o));
  check('operable part height (17.14.5): 1070 and 1220 mm are the limits (42 in = 1.0668 m is rounded to 1.07 m in the SI text); 1100 passes; 1000 and 1300 fail', [m({}).okHeight, m({h: 1070}).okHeight, m({h: 1220}).okHeight, m({h: 1000}).okHeight, m({h: 1300}).okHeight, m({h: 1069}).okHeight, m({h: 1221}).okHeight], [true, true, true, false, false, false, false]);
  check('exit door distance 1.5 m (17.14.8.4): 1.5 passes, 1.6 fails; travel 61 m (17.14.8.5): 61 passes, 62 fails', [m({dEx: 1.5}).okExit, m({dEx: 1.6}).okExit, m({tr: 61}).okTravel, m({tr: 62}).okTravel], [true, false, true, false]);
  check('grouped openings over 12.2 m (17.14.8.6): 12.2 m is not "over"; 15 m with a box 1.2 m from the side passes and with 2 m fails', [m({wg: 12.2}).grouped, m({wg: 12.3}).grouped, m({wg: 15}).okGroup, m({wg: 15, dGr: 2}).okGroup, m({wg: 10, dGr: 5}).okGroup], [false, true, true, false, true]);
  check('colour (17.14.8.3), background (17.14.4), visibility (17.14.8.2): each one failing makes okAll false', [m({}).okAll, m({red: 0}).okRed, m({red: 0}).okAll, m({cont: 0}).okCont, m({vis: 0}).okVis, m({vis: 0}).okAll], [true, false, false, false, false, false]);
  const s = o => sup(Object.assign({rev: 2, frac: 0.2, nor: 1, tank: 0, lvl: 70, both: 1, ts: 4.4, rs: 4.4, pk: 0, dp: 70, ps: 120, pm: 100}, o));
  check('control valve (17.16.1.2): two revolutions or one fifth of travel passes, either one is enough; 3 revolutions and 30 % fails; restoration must be at the normal position only (17.16.1.3)', [s({}).okValve, s({rev: 3, frac: 0.2}).okValve, s({rev: 2, frac: 0.5}).okValve, s({rev: 3, frac: 0.3}).okValve, s({}).okRestore, s({nor: 0}).okRestore], [true, true, true, false, true, false]);
  check('water level (17.16.3): pressure tank 70 mm passes and 80 fails; other tanks 300 mm passes and 310 fails (a 200 mm drop passes for a gravity tank); a pressure tank device must indicate high and low', [s({}).okTank, s({lvl: 80}).okTank, s({tank: 1, lvl: 300}).okTank, s({tank: 1, lvl: 310}).okTank, s({tank: 1, lvl: 200}).okTank, s({both: 0}).okBoth, s({tank: 1, both: 0}).okBoth], [true, false, true, false, true, false, true]);
  check('water and room temperature (17.16.4, 17.16.5): 4.4 C (40 F) passes, 5 C fails, zero or negative set points are rejected', [s({}).okTemp, s({ts: 5}).okTemp, s({ts: 0}).okTemp, s({ts: 3}).okTemp, s({}).okRoom, s({rs: 5}).okRoom, s({rs: -1}).okRoom], [true, false, false, true, true, false, false]);
  check('pressure (17.16.2.2): tank or dry-pipe 70 kPa (10 psi) passes, 80 fails and both directions are required; steam: 110 % of a 100 kPa minimum = 110 kPa, 120 passes, 105 fails and only low pressure is required', [s({}).okPrs, s({dp: 80}).okPrs, s({pk: 1}).okPrs, s({both: 0}).okPrsBoth, s({pk: 1, both: 0}).okPrsBoth, s({pk: 2}).okPrs, s({pk: 2, ps: 105}).okPrs, s({pk: 2, both: 0}).okPrsBoth, near(s({pk: 2}).steamMin, 110, 1e-9), s({pk: 2, ps: 110}).okPrs], [true, false, true, false, false, true, false, true, true, true]);
  const k = o => smk(Object.assign({t: 20, rh: 50, v: 0.3, mount: 0, drop: 100, peak: 500}, o));
  check('ambient limits (17.7.1.8): 0 and 38 C pass, -1 and 39 fail; 93 % passes and 94 fails; 1.5 m/s passes and 1.6 fails; any failure makes the whole set unsuitable', [k({t: 0}).okT, k({t: 38}).okT, k({t: -1}).okT, k({t: 39}).okT, k({rh: 93}).okRh, k({rh: 94}).okRh, k({v: 1.5}).okV, k({v: 1.6}).okV, k({}).allAmbient, k({t: 45}).allAmbient, k({rh: 95}).allAmbient, k({v: 2}).allAmbient], [true, true, false, false, true, false, true, false, true, false, false, false]);
  check('sidewall mounting (17.7.3.2.1): the top of the detector at 300 mm or less below the ceiling passes, 350 fails; on the ceiling it always passes; first detector within 910 mm of the peak or high side passes, 1000 fails', [k({mount: 1, drop: 300}).okWall, k({mount: 1, drop: 350}).okWall, k({mount: 0, drop: 900}).okWall, k({peak: 910}).okRow, k({peak: 1000}).okRow], [true, false, true, true, false]);
}
let tt;
w.renderCalc('nfpa72md'); w.calcResult('nfpa72md');
tt = txt(w, 'xfm_results');
check('the default page shows 1100 mm, 1.2 m, 50 m, the limits and the 🔴 note', [tt.includes('1100 mm'), tt.includes('1070'), tt.includes('61 m'), tt.includes('1.5 m'), tt.includes('🔴'), tt.includes('✘')], [true, true, true, true, true, false]);
set('xfm_m', '1'); w.calcResult('nfpa72md'); tt = txt(w, 'xfm_results');
check('the supervisory page shows the valve rule and hides the manual-box group', [tt.includes('17.16.1.2'), doc.getElementById('xfm_g0').style.display === 'none', doc.getElementById('xfm_g1').style.display === ''], [true, true, true]);
set('xfm_dv', '4'); set('xfm_pk', '2'); w.calcResult('nfpa72md'); tt = txt(w, 'xfm_results');
check('steam pressure shows the 110 % minimum of 110.0 kPa', [tt.includes('110.0 kPa'), tt.includes('17.16.2.2.3')], [true, true]);
set('xfm_m', '2'); w.calcResult('nfpa72md'); tt = txt(w, 'xfm_results');
check('the smoke page shows the ambient limits and 0.30 m/s', [tt.includes('93 %'), tt.includes('0.30 m/s'), tt.includes('17.7.1.8'), tt.includes('مناسب')], [true, true, true, true]);
check('other reference codes open nfpa72md too', others('nfpa72md', 'xfm_results'), [true, true, true]);
}
// ---------- part 298: EN 1998-1:2004 capacity design (`ec8cap`: beam shear 5.4.2.2 / 5.5.2.1 (5.8) and reversal 5.5.3.1.2, column shear 5.4.2.3 / 5.5.2.2 (5.9), wall shear magnification 5.4.2.4 / 5.4.2.5 / 5.5.2.4 (5.10) (5.24) to (5.26), joints 5.4.3.3 / 5.5.2.3 / 5.5.3.3 (5.22) to (5.37)) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const beam = o => J('xcdBeam(' + JSON.stringify(o) + ')');
const col = o => J('xcdCol(' + JSON.stringify(o) + ')');
const wall = o => J('xcdWall(' + JSON.stringify(o) + ')');
const joint = o => J('xcdJoint(' + JSON.stringify(o) + ')');
const se = (t, tb, tc, td, e) => J('xcdSe(' + [t, tb, tc, td, e].join(',') + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const bm = o => beam(Object.assign({dc: 1, L: 5, q: 40, m1h: 250, m1s: 150, m2h: 250, m2s: 150, ra1: 1.3, ra2: 1.3, rb1: 1.3, rb2: 1.3, bw: 300, d: 550, fck: 30, fyd: 435, al: 45}, o));
  check('beam DCH (5.8, gamma_Rd 1.2): end moments 1.2 x 250 = 300 and 1.2 x 150 = 180; seismic shear 480 / 5 = 96 kN each way; gravity shear 40 x 5 / 2 = 100; Vmax 196, Vmin 4 at both ends, zeta = 4 / 196', [bm({}).g, near(bm({}).m1a, 300, 1e-9), near(bm({}).m2a, 180, 1e-9), near(bm({}).sA, 96, 1e-9), near(bm({}).sB, 96, 1e-9), near(bm({}).vg, 100, 1e-9), near(bm({}).end[0].vmax, 196, 1e-9), near(bm({}).end[0].vmin, 4, 1e-9), near(bm({}).end[1].vmax, 196, 1e-9), near(bm({}).end[0].zeta, 0.020408, 1e-6), bm({}).end[0].rev], [1.2, true, true, true, true, true, true, true, true, true, false]);
  check('beam DCM uses gamma_Rd 1.0 (5.4.2.2(2)): 250 and 150 give 250 and 150, seismic shear 80 kN, Vmax 180; DCM never needs the reversal rule', [bm({dc: 0}).g, near(bm({dc: 0}).sA, 80, 1e-9), near(bm({dc: 0}).end[0].vmax, 180, 1e-9), bm({dc: 0, q: 0}).end[0].rev], [1.0, true, true, false]);
  check('the joint ratio reduces the end moment: SigmaMRc / SigmaMRb = 0.9 at end 1 for the first direction gives 1.2 x 250 x 0.9 = 270; a ratio above 1 does not increase it', [near(bm({ra1: 0.9}).m1a, 270, 1e-9), near(bm({ra1: 5}).m1a, 300, 1e-9), near(bm({rb2: 0.5}).m2b, 150, 1e-9)], [true, true, true]);
  check('different end moments: end 1 first direction uses the hogging resistance of end 1 and the sagging resistance of end 2; opposite direction the sagging of end 1 and hogging of end 2', [near(bm({m1h: 300, m1s: 100, m2h: 200, m2s: 120}).m1a, 360, 1e-9), near(bm({m1h: 300, m1s: 100, m2h: 200, m2s: 120}).m2a, 144, 1e-9), near(bm({m1h: 300, m1s: 100, m2h: 200, m2s: 120}).m1b, 120, 1e-9), near(bm({m1h: 300, m1s: 100, m2h: 200, m2s: 120}).m2b, 240, 1e-9), near(bm({m1h: 300, m1s: 100, m2h: 200, m2s: 120}).end[0].vmax, 100 + 504 / 5, 1e-9), near(bm({m1h: 300, m1s: 100, m2h: 200, m2s: 120}).end[1].vmin, 100 - 504 / 5, 1e-9)], [true, true, true, true, true, true]);
  check('concrete tensile strength fck 30: fctm 0.30 fck^(2/3) = 2.8965, fctd = 0.7 fctm / 1.5 = 1.3517 MPa', [near(bm({}).fctd, 1.351685, 1e-5)], [true]);
  check('reversal (5.27): q = 10 gives Vmax 121 and Vmin -71, zeta = -0.5868 under -0.5; limit (2 + zeta) fctd bw d = 315.19 kN so 121 passes without inclined bars', [bm({q: 10}).end[0].rev, near(bm({q: 10}).end[0].zeta, -0.586777, 1e-6), near(bm({q: 10}).end[0].lim, 315.1884, 1e-3), bm({q: 10}).end[0].okLim, bm({q: 10}).end[0].incl], [true, true, true, true, false]);
  check('almost full reversal with inclined bars (5.28): q = 0, L = 4, all resistances 400 give 480 each end, shear +/-240, zeta -1, limit 223.03 kN so 240 fails and As = 0.5 x 240 000 / (2 x 435 x sin 45) = 195.06 mm2 per direction', [bm({q: 0, L: 4, m1h: 400, m1s: 400, m2h: 400, m2s: 400}).end[0].rev, near(bm({q: 0, L: 4, m1h: 400, m1s: 400, m2h: 400, m2s: 400}).end[0].vmax, 240, 1e-9), near(bm({q: 0, L: 4, m1h: 400, m1s: 400, m2h: 400, m2s: 400}).end[0].zeta, -1, 1e-9), near(bm({q: 0, L: 4, m1h: 400, m1s: 400, m2h: 400, m2s: 400}).end[0].lim, 223.028, 1e-3), bm({q: 0, L: 4, m1h: 400, m1s: 400, m2h: 400, m2s: 400}).end[0].incl, near(bm({q: 0, L: 4, m1h: 400, m1s: 400, m2h: 400, m2s: 400}).end[0].as, 195.0639, 1e-3)], [true, true, true, true, true, true]);
  const cl = o => col(Object.assign({dc: 1, H: 3, c1: 300, c2: 300, r1: 0.8, r2: 0.8}, o));
  check('column DCH (5.9, gamma_Rd 1.3): 1.3 x 300 x 0.8 = 312 each end, V = 624 / 3 = 208 kN; DCM 1.1 gives 264 and 176 kN; a ratio of 1.2 does not raise the moment (390, V 260 kN)', [cl({}).g, near(cl({}).m1, 312, 1e-9), near(cl({}).v, 208, 1e-9), cl({dc: 0}).g, near(cl({dc: 0}).m1, 264, 1e-9), near(cl({dc: 0}).v, 176, 1e-9), near(cl({r1: 1.2, r2: 1.2}).m1, 390, 1e-9), near(cl({r1: 1.2, r2: 1.2}).v, 260, 1e-9), cl({}).hinge1, cl({r1: 1.2}).hinge1], [1.3, true, true, 1.1, true, true, true, true, true, false]);
  check('different column ends: 250 and 350 with ratios 0.8 and 1.5 give 1.3 x 250 x 0.8 = 260 and 1.3 x 350 = 455; V = 715 / 4 m', [near(cl({H: 4, c1: 250, c2: 350, r1: 0.8, r2: 1.5}).m1, 260, 1e-9), near(cl({H: 4, c1: 250, c2: 350, r1: 0.8, r2: 1.5}).m2, 455, 1e-9), near(cl({H: 4, c1: 250, c2: 350, r1: 0.8, r2: 1.5}).v, 178.75, 1e-9)], [true, true, true]);
  check('elastic spectrum ratio Se(TC) / Se(T1): in the plateau 1; T1 0.8 above TC 0.5 gives 1.6; T1 3 above TD 2 gives 9; T1 0.1 below TB 0.15 gives 2.5 / 2.0 = 1.25', [near(se(0.3, 0.15, 0.5, 2, 1), 2.5, 1e-9), near(se(0.5, 0.15, 0.5, 2, 1) / se(0.8, 0.15, 0.5, 2, 1), 1.6, 1e-9), near(2.5 / se(3, 0.15, 0.5, 2, 1), 9, 1e-9), near(2.5 / se(0.1, 0.15, 0.5, 2, 1), 1.25, 1e-9)], [true, true, true, true]);
  const wl = o => wall(Object.assign({dc: 1, kind: 0, q: 3, v: 500, med: 5000, mrd: 6000, t1: 0.8, tb: 0.15, tc: 0.5, td: 2, eta: 1, ng: 3000, dual: 0}, o));
  check('wall DCM: all shears are raised 50 % (5.4.2.4(7)): 500 gives 750 kN', [wl({dc: 0}).rule, near(wl({dc: 0}).eps, 1.5, 1e-9), near(wl({dc: 0}).vEd, 750, 1e-9), near(wl({dc: 0, kind: 1}).eps, 1.5, 1e-9)], ['dcm', true, true, true]);
  check('wall DCH slender (5.25): ratio 1.6, gamma_Rd MRd / (q MEd) = 0.48, raw = 3 sqrt(0.2304 + 0.256) = 2.0923; V = 1046.1 kN', [wl({}).rule, near(wl({}).ratio, 1.6, 1e-9), near(wl({}).raw, 2.092271, 1e-6), near(wl({}).eps, 2.092271, 1e-6), near(wl({}).vEd, 1046.1357, 1e-3), wl({}).capped], ['slender', true, true, true, true, false]);
  check('wall DCH slender limits: q = 1.8 and MRd / MEd = 1.5 give raw 2.017 above q so eps = q = 1.8; q = 2 with MRd / MEd = 1 and T1 = TC gives raw 1.356 below 1.5 so eps = 1.5', [near(wl({q: 1.8, mrd: 7500}).raw, 2.017285, 1e-6), near(wl({q: 1.8, mrd: 7500}).eps, 1.8, 1e-9), wl({q: 1.8, mrd: 7500}).capped, near(wl({q: 2, mrd: 5000, t1: 0.5}).raw, 1.356466, 1e-6), near(wl({q: 2, mrd: 5000, t1: 0.5}).eps, 1.5, 1e-9)], [true, true, true, true, true]);
  check('wall DCH squat (5.26): gamma_Rd MRd / MEd = 1.2 x 1.2 = 1.44 so V = 720 kN; q = 1.3 caps the factor at 1.3 (650 kN); MRd below MEd flags the input', [wl({kind: 1}).rule, near(wl({kind: 1}).eps, 1.44, 1e-9), near(wl({kind: 1}).vEd, 720, 1e-9), near(wl({kind: 1, q: 1.3}).eps, 1.3, 1e-9), near(wl({kind: 1, q: 1.3}).vEd, 650, 1e-9), wl({kind: 1, mrd: 4000}).okM, wl({}).okM], ['squat', true, true, true, true, false, true]);
  check('large lightly reinforced wall (5.10): (q + 1) / 2 = 2 for q = 3 so V = 1000 kN and a dynamic axial force of 50 % of 3000 = 1500 kN; q = 2 gives 1.5 and no dynamic axial force (5.4.2.5(5))', [wl({kind: 2}).rule, near(wl({kind: 2}).eps, 2, 1e-9), near(wl({kind: 2}).vEd, 1000, 1e-9), near(wl({kind: 2}).dyn, 1500, 1e-9), near(wl({kind: 2, q: 2}).eps, 1.5, 1e-9), wl({kind: 2, q: 2}).dyn], ['lite', true, true, true, true, 0]);
  check('dual system envelope (Figure 5.4): top shear not below half of the base shear 1046.1 / 2 = 523.07 kN; none for plain walls', [near(wl({dual: 1}).vTop, 523.0679, 1e-3), wl({}).vTop], [true, 0]);
  const jt = o => joint(Object.assign({dc: 1, type: 0, a1: 1500, a2: 1000, fy: 435, vc: 150, gr: 1.2, fck: 30, gc: 1.5, bc: 500, bw: 300, hc: 500, hjc: 420, hjw: 500, nu: 0.3, ash: 800, fyw: 435, asv: 600, scr: 100, sj: 100, four: 0, nv: 1}, o));
  check('interior joint (5.22): Vjhd = 1.2 x 2500 x 435 / 1000 - 150 = 1155 kN; bj = min(500, 300 + 250) = 500 (5.34a); eta = 0.6 (1 - 30 / 250) = 0.528; limit 0.528 x 20 sqrt(1 - 0.3 / 0.528) x 500 x 420 = 1457.25 kN passes', [near(jt({}).vjhd, 1155, 1e-9), near(jt({}).bj, 500, 1e-9), near(jt({}).eta, 0.528, 1e-9), near(jt({}).fcd, 20, 1e-9), near(jt({}).lim, 1457.2487, 1e-3), jt({}).okComp], [true, true, true, true, true, true]);
  check('joint hoops: tau = 1155 000 / (500 x 420) = 5.5 MPa; (5.35) gives (30.25 / (1.3517 + 6) - 1.3517) x 250 000 / 435 = 1587.9 mm2; (5.36a) 1.2 x 2500 x 0.76 = 2280 mm2; required is the smaller 1587.9; 800 provided fails; vertical bars 2/3 x 1587.9 x 420 / 500 = 889.2 mm2 and 600 fails', [near(jt({}).ash35, 1587.9412, 1e-2), near(jt({}).ash36, 2280, 1e-6), near(jt({}).ashReq, 1587.9412, 1e-2), jt({}).okAsh, near(jt({}).asv, 889.2471, 1e-2), jt({}).okAsv, jt({ash: 1600, asv: 900}).okAsh, jt({ash: 1600, asv: 900}).okAsv], [true, true, true, false, true, false, true, true]);
  check('exterior joint (5.23): Vjhd = 1.2 x 1500 x 435 / 1000 - 150 = 633 kN; limit is 80 % of 1457.25 = 1165.80 kN; (5.35) gives zero (tau 3.01 MPa is under the tensile strength) and (5.36b) 1.2 x 1000 x 0.76 = 912 mm2 so the required hoops are 0', [near(jt({type: 1}).vjhd, 633, 1e-9), near(jt({type: 1}).lim, 1165.799, 1e-3), jt({type: 1}).okComp, jt({type: 1}).ash35, near(jt({type: 1}).ash36, 912, 1e-9), jt({type: 1}).ashReq, jt({type: 1}).okAsh], [true, true, true, 0, true, 0, true]);
  check('too much shear crushes the strut: As1 = As2 = 3000 gives Vjhd = 1.2 x 6000 x 0.435 - 150 = 2982 kN above 1457 kN; nu_d above eta = 0.528 gives a zero limit', [jt({a1: 3000, a2: 3000}).okComp, jt({nu: 0.6}).lim, jt({nu: 0.6}).okComp], [false, 0, false]);
  check('effective width (5.34b): bc 300 < bw 500, hc 400 gives min(500, 300 + 200) = 500; bc 300, bw 450, hc 200 gives min(450, 400) = 400', [near(jt({bc: 300, bw: 500, hc: 400}).bj, 500, 1e-9), near(jt({bc: 300, bw: 450, hc: 200}).bj, 400, 1e-9), near(jt({bc: 300, bw: 300}).bj, 300, 1e-9)], [true, true, true]);
  check('confinement (5.4.3.3): beams on four sides with bw >= 0.75 bc allow twice the column critical spacing up to 150 mm: scr 100 gives 150, scr 60 gives 120; with bw 300 < 375 the spacing stays 100 and 150 fails; at least one intermediate bar', [jt({four: 1, bw: 400}).four, near(jt({four: 1, bw: 400}).sAllow, 150, 1e-9), near(jt({four: 1, bw: 400, scr: 60}).sAllow, 120, 1e-9), jt({four: 1}).four, near(jt({four: 1}).sAllow, 100, 1e-9), jt({four: 1, sj: 150}).okS, jt({four: 1, bw: 400, sj: 150}).okS, jt({nv: 0}).okBar, jt({}).okBar], [true, true, true, false, true, false, true, false, true]);
}
let tt;
w.renderCalc('ec8cap'); w.calcResult('ec8cap');
tt = txt(w, 'xcd_results');
check('the default page (beam DCH) shows gamma_Rd 1.20, the seismic shear 96.0 kN, Vmax 196.0 / Vmin 4.0 kN and the 🔴 note', [tt.includes('1.20'), tt.includes('96.0 kN'), tt.includes('196.0 / 4.0 kN'), tt.includes('🔴')], [true, true, true, true]);
set('xcd_m', '1'); w.calcResult('ec8cap'); tt = txt(w, 'xcd_results');
check('the column page shows 312.0 kN·m and 208.0 kN, and hides the beam group', [tt.includes('312.0 kN·m'), tt.includes('208.0 kN'), doc.getElementById('xcd_g0').style.display === 'none', doc.getElementById('xcd_g1').style.display === ''], [true, true, true, true]);
set('xcd_m', '2'); w.calcResult('ec8cap'); tt = txt(w, 'xcd_results');
check('the wall page shows eps 2.092 and VEd 1046.1 kN', [tt.includes('2.092'), tt.includes('1046.1 kN')], [true, true]);
set('xcd_m', '3'); w.calcResult('ec8cap'); tt = txt(w, 'xcd_results');
check('the joint page shows 1155.0 kN, the limit 1457.2 kN and the required hoops 1588 mm2', [tt.includes('1155.0 kN'), tt.includes('1457.2 kN'), tt.includes('1588 mm')], [true, true, true]);
check('other reference codes open ec8cap too', others('ec8cap', 'xcd_results'), [true, true, true]);
}
console.log(fail ? `\n${fail} FAIL` : '\nall ok');
if (errors.length) { console.log('jsdom errors:', errors.slice(0, 5)); fail++; }
process.exit(fail ? 1 : 0);
