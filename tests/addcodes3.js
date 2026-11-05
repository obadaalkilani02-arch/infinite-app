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
// ---------- part 299: EN 1998-1:2004 ductile walls (`ec8wall`: critical region and boundary elements 5.4.3.4.2 / 5.5.3.4.5 (5.19) (5.20) (5.21), DCH web shear 5.5.3.4.2 / 5.5.3.4.3 (5.38) (5.39) and minimum web reinforcement 5.5.3.4.5, sliding shear 5.5.3.4.4 (5.40) to (5.43)) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const det = o => J('xewDetail(' + JSON.stringify(o) + ')');
const shr = o => J('xewShear(' + JSON.stringify(o) + ')');
const sld = o => J('xewSlide(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const d = o => det(Object.assign({dc: 1, lw: 4, hw: 20, hs: 3.2, ns: 6, bw: 300, bc: 300, hc: 4000, q0: 4, mr: 0.85, t1: 0.8, tc: 0.5, N: 2000, asv: 3000, fck: 30, gc: 1.5, fyd: 435, fywd: 435, bo: 220, ho: 400, s: 70, dbw: 10, dbL: 16, nbx: 3, nby: 5, nx: 3, ny: 5, rl: 1.2, bf: 0, lf: 0}, o));
  check('critical height (5.19): max(lw 4, hw / 6 = 3.33) = 4 but not above hs = 3.2 for 6 storeys; 7 storeys allow 2 hs = 6.4 so 4; lw 1 m with hw 30 gives max(1, 5) = 5 capped at 2 lw = 2; hw 60 with 7 storeys gives 10 capped by 2 hs = 6.4', [near(d({}).hcr, 3.2, 1e-9), near(d({ns: 7}).hcr, 4, 1e-9), near(d({lw: 1, hw: 30, ns: 7}).hcr, 2, 1e-9), near(d({hw: 60, ns: 7}).hcr, 6.4, 1e-9)], [true, true, true, true]);
  check('curvature ductility: q0 x MEd / MRd = 3.4 gives mu = 2 x 3.4 - 1 = 5.8 for T1 >= TC (5.4); T1 = 0.3 below TC 0.5 gives 1 + 2 x 2.4 x 0.5 / 0.3 = 9 (5.5)', [near(d({}).q0, 3.4, 1e-9), near(d({}).mu, 5.8, 1e-9), near(d({t1: 0.3}).mu, 9, 1e-9)], [true, true, true]);
  check('axial force and web ratio: nu_d = 2000 000 / (4000 x 300 x 20) = 0.0833 within 0.35 (DCH) and 0.4 (DCM); omega_v = 3000 / 1.2e6 x 435 / 20 = 0.054375; nu_d 0.40 fails DCH and passes DCM', [near(d({}).nu, 0.083333, 1e-6), near(d({}).wv, 0.054375, 1e-9), d({}).okNu, d({N: 9600}).okNu, d({N: 9600, dc: 0}).okNu, d({N: 11000, dc: 0}).okNu], [true, true, true, false, true, false]);
  check('confinement factor: sum of b_i squared = 2 x 220^2 / 2 + 2 x 400^2 / 4 = 128 400, alpha_n = 1 - 128 400 / 528 000 = 0.7568; alpha_s at s 70 = 0.8409 x 0.9125 = 0.7673; alpha = 0.5807', [near(d({}).an, 0.756818, 1e-6), near(d({}).as, 0.767330, 1e-6), near(d({}).alpha, 0.580729, 1e-6), near(d({}).bimax, 110, 1e-9)], [true, true, true, true]);
  check('boundary element (5.20): rho_w = 78.54 x 2660 / (220 x 400 x 70) = 0.03391, omega_wd = 0.7376; requirement 30 x 5.8 x 0.137708 x 0.002175 x 300 / 220 - 0.035 = 0.03607; alpha omega_wd = 0.4284 passes; at s = 100 it is 0.2642 (still passes the strength rule)', [near(d({}).rhoW, 0.0339149, 1e-6), near(d({}).wwd, 0.73765, 1e-5), near(d({}).req, 0.036067, 1e-6), near(d({}).prov, 0.428374, 1e-5), d({}).okConf, near(d({s: 100}).prov, 0.264225, 1e-5), d({s: 100}).okConf], [true, true, true, true, true, true, true]);
  check('a heavily loaded wall needs more confinement than provided: nu_d 0.35 (N 8400) with mu 5.8 gives requirement 30 x 5.8 x 0.404375 x 0.002175 x 1.3636 - 0.035 = 0.17369; alpha omega_wd = 0.2642 at s = 100 still passes, thin hoops dbw 6 do not (omega_wd drops)', [near(d({N: 8400}).req, 0.173685, 1e-6), d({N: 8400, s: 100}).okConf, d({N: 8400, s: 100, dbw: 6, nx: 2, ny: 2}).okConf], [true, true, false]);
  check('minimum omega_wd: DCH 0.12 (5.5.3.4.5(10)), DCM 0.08; a thin hoop at wide spacing fails it', [d({}).wmin, d({dc: 0}).wmin, d({}).okW, d({dbw: 6, s: 220, nx: 2, ny: 2}).okW], [0.12, 0.08, true, false]);
  check('confined length: xu = 0.137708 x 4000 x 300 / 220 = 751.14 mm; eps_cu2,c = 0.0035 + 0.1 x 0.42837 = 0.04634; lc = 751.14 (1 - 0.0035 / 0.04634) = 694.4 mm, above the minimum max(0.15 lw = 600, 1.5 bw = 450) = 600; a small lc uses the minimum', [near(d({}).xu, 751.1364, 1e-3), near(d({}).ecu, 0.0463374, 1e-6), near(d({}).lc, 694.4009, 1e-3), near(d({}).lcMin, 600, 1e-9), near(d({}).lcUse, 694.4009, 1e-3), near(d({N: 0, asv: 0}).lcUse, 600, 1e-9)], [true, true, true, true, true, true]);
  check('thickness (5.4.3.4.2(10)): lc 694 not above max(2 bw = 600, 0.2 lw = 800) so bw >= hs / 15 = 213.3 mm and 300 passes; bw 200 fails; storey height 6 m needs 400 and fails 300; a long lc above 800 needs hs / 10 = 320', [near(d({}).bwMin, 213.3333, 1e-3), d({}).okBw, d({bw: 200}).okBw, near(d({hs: 6}).bwMin, 400, 1e-9), d({hs: 6}).okBw, near(d({lw: 8, hc: 8000, N: 8000, asv: 6000}).bwMin, 320, 1e-9)], [true, true, false, true, false, true]);
  check('hoops: DCH spacing min(bo / 3 = 73.3, 125, 6 dbL = 96) = 73.3 so 70 passes and 100 fails; DCM min(110, 175, 128) = 110 passes both; bar distance 110 <= 150 (DCH); a 180 mm core with two bars across gives 180: fails DCH (150) and passes DCM (200); hoop diameter 0.4 x 16 = 6.4 mm for DCH', [near(d({}).sMax, 73.3333, 1e-3), d({}).okS, d({s: 100}).okS, near(d({dc: 0}).sMax, 110, 1e-9), d({dc: 0, s: 100}).okS, d({}).okBar, d({bo: 180, nbx: 2}).okBar, d({bo: 180, nbx: 2, dc: 0}).okBar, near(d({}).dbwMin, 6.4, 1e-9), d({dbw: 6}).okDbw, d({dc: 0, dbw: 6}).okDbw], [true, true, false, true, true, true, false, true, true, false, true]);
  check('longitudinal ratio of the boundary element 0.5 % (5.4.3.4.2(8)): 1.2 passes and 0.4 fails; flange exemption: bf > hs / 15 = 213 and lf > hs / 5 = 640 mm', [d({}).okRl, d({rl: 0.4}).okRl, d({bf: 250, lf: 800}).flange, d({bf: 200, lf: 800}).flange, d({bf: 250, lf: 600}).flange], [true, false, true, false, false]);
  check('EN 1992-1-1 alone for DCM boundary hoops when nu_d is 0.15 or less (5.4.3.4.2(12)): 0.083 yes, 0.20 no; never in DCH', [d({dc: 0}).light, d({dc: 0, N: 4800}).light, d({}).light], [true, false, false]);
  const sh = o => shr(Object.assign({lw: 4000, bw: 300, fck: 30, gc: 1.5, v: 800, m: 6000, vc: 200, ten: 0, crit: 1, n: 1500, fyh: 435, fyv: 435, rh: 0.4, rv: 0.4, db: 10, sp: 200}, o));
  check('web crushing (5.5.3.4.2): z = 0.8 x 4000 = 3200, nu1 = 0.6 x (1 - 30 / 250) = 0.528, VRd,max = 300 x 3200 x 0.528 x 20 / 2 = 5068.8 kN outside the critical region and 40 % = 2027.52 inside', [near(sh({}).z, 3200, 1e-9), near(sh({}).nu1, 0.528, 1e-9), near(sh({crit: 0}).vMax, 5068.8, 1e-6), near(sh({}).vMax, 2027.52, 1e-6), sh({}).okMax, sh({v: 2100}).okMax, sh({v: 2100, crit: 0}).okMax], [true, true, true, true, true, false, true]);
  check('shear ratio: alpha_s = 6000 / (800 x 4) = 1.875 below 2 so (5.38) applies: rho_h = 600 000 / (0.75 x 1.875 x 4000 x 300 x 435) = 0.000817 but at least 0.002 (5.5.3.4.5(13)); alpha_s = 3 above 2: rho_h = 500 000 / (300 x 3200 x 435) = 0.001197 also raised to 0.002', [near(sh({}).as, 1.875, 1e-9), sh({}).low, near(sh({}).rhoReq, 0.000817369, 1e-8), near(sh({}).rhoH, 0.002, 1e-12), near(sh({v: 500}).as, 3, 1e-9), sh({v: 500}).low, near(sh({v: 500}).rhoReq, 0.00119732, 1e-8), near(sh({v: 500}).rhoH, 0.002, 1e-12)], [true, true, true, true, true, false, true, true]);
  check('heavy shear: VEd 3000 gives alpha_s 0.5 and rho_h = 2 800 000 / (0.75 x 0.5 x 4000 x 300 x 435) = 0.014304; 0.4 % fails; tensile axial force in the critical region makes VRd,c zero: 0.015326; outside the critical region VRd,c stays', [near(sh({v: 3000}).rhoReq, 0.01430396, 1e-7), sh({v: 3000}).okH, near(sh({v: 3000, ten: 1}).rhoReq, 0.01532567, 1e-7), near(sh({v: 3000, ten: 1, crit: 0}).rhoReq, 0.01430396, 1e-7)], [true, false, true, true]);
  check('vertical bars (5.39): rho_v fyd,v >= rho_h fyd,h - minN / (bw z) = 0.004 - 1.5e6 / (300 x 3200 x 435) = 0.000408 so the 0.002 minimum governs; with rho_h = 1 % it is 0.006408 and 0.4 % fails; small bars and spacing limits: 10 mm at 200 passes, 6 mm fails, 300 mm spacing fails, bw / 8 = 37.5 mm upper bound', [near(sh({}).rhoVreq, 0.002, 1e-12), sh({}).okV, near(sh({rh: 1}).rhoVreq, 0.00640805, 1e-8), sh({rh: 1}).okV, sh({}).okBarD, sh({db: 6}).okBarD, sh({db: 40}).okBarD, sh({}).okSp, sh({sp: 300}).okSp, near(sh({db: 8}).sMax, 200, 1e-9)], [true, true, true, false, true, false, false, true, false, true]);
  const sl = o => sld(Object.assign({lw: 4000, bw: 300, fck: 30, gc: 1.5, fyd: 435, asj: 3000, asi: 0, phi: 45, n: 1500, m: 6000, z: 3200, xi: 0.2, mu: 0.7, v: 800, squat: 0, base: 1}, o));
  check('dowel action (5.41): min(1.3 x 3000 x sqrt(20 x 435) = 363.77 kN; 0.25 x 435 x 3000 = 326.25 kN) = 326.25 kN; for 1000 mm2 the second term 108.75 governs again', [near(sl({}).vdd, 326.25, 1e-6), near(sl({asj: 1000}).vdd, 108.75, 1e-6)], [true, true]);
  check('friction (5.43): 0.7 [(3000 x 435 + 1500 000) x 0.2 + 6000e6 / 3200] = 1705.2 kN against 0.5 x 0.528 x 20 x 0.2 x 4000 x 300 = 1267.2 kN so the second limit governs; smooth surface 0.6 gives 1461.6 kN', [near(sl({}).vfd, 1267.2, 1e-6), sl({}).fricMax, near(sl({mu: 0.6}).vfd, 1267.2, 1e-6), near(sl({n: 0, m: 0, mu: 0.6, asj: 1000}).vfd, 0.6 * 435000 * 0.2 / 1000, 1e-6), near(sl({n: 0, m: 0, mu: 0.6, asj: 1000}).vfd, 52.2, 1e-6)], [true, true, true, true, true]);
  check('sliding resistance (5.40): 326.25 + 0 + 1267.2 = 1593.45 kN against VEd 800 passes; inclined bars 2000 mm2 at 45 degrees add 435 x 2000 x cos 45 = 615.18 kN; VEd 1700 fails', [near(sl({}).vrd, 1593.45, 1e-6), sl({}).ok, near(sl({asi: 2000}).vid, 615.1829, 1e-3), near(sl({asi: 2000}).vrd, 2208.6329, 1e-3), sl({v: 1700}).ok, sl({v: 1700, asi: 2000}).ok], [true, true, true, true, false, true]);
  check('squat walls (5.5.3.4.4(3)): inclined bars carry more than VEd / 2 at the base and VEd / 4 above; 0 inclined bars fail; 615 kN passes 400 and 200', [sl({squat: 1}).okId, near(sl({squat: 1}).vidMin, 400, 1e-9), sl({squat: 1, asi: 2000}).okId, near(sl({squat: 1, base: 0}).vidMin, 200, 1e-9), sl({squat: 1, base: 0, asi: 2000}).okId, sl({}).okId], [false, true, true, true, true, true]);
}
let tt;
w.renderCalc('ec8wall'); w.calcResult('ec8wall');
tt = txt(w, 'xew_results');
check('the default page (boundary element DCH) shows hcr 3.20 m, mu 5.80, alpha omega_wd 0.428 and the 🔴 note', [tt.includes('3.20 m'), tt.includes('5.80'), tt.includes('0.428'), tt.includes('🔴'), tt.includes('✘')], [true, true, true, true, false]);
set('xew_m', '1'); w.calcResult('ec8wall'); tt = txt(w, 'xew_results');
check('the shear page shows VRd,max 2027.5 kN and alpha_s 1.88 and hides the detail group', [tt.includes('2027.5 kN'), tt.includes('1.88'), doc.getElementById('xew_g0').style.display === 'none', doc.getElementById('xew_g1').style.display === ''], [true, true, true, true]);
set('xew_m', '2'); w.calcResult('ec8wall'); tt = txt(w, 'xew_results');
check('the sliding page shows Vdd 326.3 kN and VRd,S 1593.5 kN', [tt.includes('326.3 kN') || tt.includes('326.2 kN'), tt.includes('1593.5 kN') || tt.includes('1593.4 kN'), tt.includes('1267.2 kN')], [true, true, true]);
check('other reference codes open ec8wall too', others('ec8wall', 'xew_results'), [true, true, true]);
}
// ---------- part 300: EN 1992-1-1:2004 time-dependent concrete (`ec2time`: strength and modulus development 3.1.2 / 3.1.3 (3.1) to (3.5), creep coefficient 3.1.4 and Annex B (B.1) to (B.10) with non-linear creep (3.7) and effective modulus (7.20), drying and autogenous shrinkage (3.8) to (3.13) and (B.11) (B.12) checked against Table 3.2) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const prp = o => J('xcpProps(' + JSON.stringify(o) + ')');
const crp = o => J('xcpCreep(' + JSON.stringify(o) + ')');
const shr = o => J('xcpShr(' + JSON.stringify(o) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  const p = o => prp(Object.assign({fck: 30, cem: 1, t: 28, agg: 0}, o));
  check('Table 3.1: fcm = 38, fctm = 0.3 x 30^(2/3) = 2.8965, Ecm = 22 x 3.8^0.3 = 32.837 GPa; C60/75: fctm = 2.12 ln(1 + 6.8) = 4.3547 and Ecm = 39.100 GPa', [near(p({}).fcm, 38, 1e-9), near(p({}).fctm, 2.896468, 1e-6), near(p({}).ecm, 32836.568, 1e-2), near(p({fck: 60}).fctm, 4.354742, 1e-6), near(p({fck: 60}).ecm, 39099.874, 1e-2)], [true, true, true, true, true]);
  check('aggregate: limestone x 0.9, sandstone x 0.7, basalt x 1.2 (3.1.3(2))', [near(p({agg: 1}).ecm, 0.9 * 32836.568, 1e-2), near(p({agg: 2}).ecm, 0.7 * 32836.568, 1e-2), near(p({agg: 3}).ecm, 1.2 * 32836.568, 1e-2)], [true, true, true]);
  check('strength at 7 days (class N, s = 0.25): beta_cc = exp(0.25 (1 - 2)) = 0.77880, fcm(t) = 29.594, fck(t) = 21.594, fctm(t) = 2.2558 (alpha 1), Ecm(t) = 30.464 GPa', [near(p({t: 7}).bcc, 0.778801, 1e-6), near(p({t: 7}).fcmT, 29.59443, 1e-4), near(p({t: 7}).fckT, 21.59443, 1e-4), near(p({t: 7}).fctmT, 2.255772, 1e-5), near(p({t: 7}).ecmT, 30463.912, 1e-2)], [true, true, true, true, true]);
  check('at 28 days every factor is 1; at 90 days beta_cc = 1.11690, fcm(t) = 42.442, fck(t) stays 30 (3.1.2(5)), fctm(t) = 3.1180 (alpha 2/3), Ecm(t) = 33.944 GPa', [near(p({}).bcc, 1, 1e-12), near(p({}).fckT, 30, 1e-12), near(p({t: 90}).bcc, 1.116900, 1e-6), near(p({t: 90}).fcmT, 42.44219, 1e-4), near(p({t: 90}).fckT, 30, 1e-12), near(p({t: 90}).fctmT, 3.118015, 1e-5), near(p({t: 90}).ecmT, 33943.921, 1e-2)], [true, true, true, true, true, true, true]);
  check('cement coefficients s: R 0.20, N 0.25, S 0.38; the slow class gains less early: 7-day factor exp(0.38 x -1) = 0.6839, rapid exp(-0.2) = 0.8187; 3 days or less is flagged', [p({cem: 0}).s, p({cem: 1}).s, p({cem: 2}).s, near(p({cem: 2, t: 7}).bcc, 0.683861, 1e-6), near(p({cem: 0, t: 7}).bcc, 0.818731, 1e-6), p({t: 3}).early, p({t: 7}).early], [0.2, 0.25, 0.38, true, true, true, false]);
  const sh = o => shr(Object.assign({fck: 30, cem: 1, rh: 50, ac: 150000, u: 1600, ts: 7, t: 1000}, o));
  const tab = {20: [0.62, 0.58, 0.49, 0.30, 0.17, 0], 40: [0.48, 0.46, 0.38, 0.24, 0.13, 0], 60: [0.38, 0.36, 0.30, 0.19, 0.10, 0], 80: [0.30, 0.28, 0.24, 0.15, 0.08, 0], 90: [0.27, 0.25, 0.21, 0.13, 0.07, 0]};
  const got = {}; for (const k of Object.keys(tab)) got[k] = [20, 40, 60, 80, 90, 100].map(rh => +(sh({fck: +k, rh: rh, t: 0}).ecd0 * 1000).toFixed(2));
  check('B.11 and B.12 against all 30 values of Table 3.2 (cement N, fck 20 to 90, RH 20 to 100 %)', got, tab);
  check('shrinkage (class N, RH 50, h0 187.5): beta_RH = 1.35625, eps_cd,0 = 482.24e-6, kh = 0.86875, eps_cd(inf) = 418.95e-6; rapid cement 667.9e-6 and slow 386.9e-6 for eps_cd,0', [near(sh({}).h0, 187.5, 1e-9), near(sh({}).bRH, 1.35625, 1e-9), near(sh({}).ecd0, 0.000482241, 1e-9), near(sh({}).kh, 0.86875, 1e-9), near(sh({}).ecdInf, 0.000418947, 1e-9), near(sh({cem: 0}).ecd0, 0.000667892, 1e-9), near(sh({cem: 2}).ecd0, 0.000386883, 1e-9)], [true, true, true, true, true, true, true]);
  check('development in time (ts 7, t 1000): beta_ds = 993 / (993 + 0.04 x sqrt(187.5^3)) = 0.90627, eps_cd(t) = 379.68e-6; autogenous 2.5 x 20e-6 = 50e-6 with beta_as = 0.99821 gives 49.91e-6; total 429.59e-6 at t and 468.95e-6 at infinity', [near(sh({}).bds, 0.906272, 1e-6), near(sh({}).ecdT, 0.00037968, 1e-8), near(sh({}).ecaInf, 0.00005, 1e-12), near(sh({}).bas, 0.998208, 1e-6), near(sh({}).ecaT, 0.00004991, 1e-8), near(sh({}).ecsT, 0.00042959, 1e-8), near(sh({}).ecsInf, 0.000468947, 1e-9), near(sh({t: 0}).ecsT, 0.000468947, 1e-9)], [true, true, true, true, true, true, true, true]);
  check('kh interpolation (Table 3.3): h0 100 -> 1.0, 150 -> 0.925, 200 -> 0.85, 250 -> 0.80, 300 -> 0.75, 400 -> 0.725, 500 and 800 -> 0.70, below 100 stays 1.0', [100, 150, 200, 250, 300, 400, 500, 800, 50].map(h => +sh({ac: h * 800, u: 1600}).kh.toFixed(4)), [1, 0.925, 0.85, 0.8, 0.75, 0.725, 0.7, 0.7, 1]);
  const c = o => crp(Object.assign({fck: 30, cem: 1, rh: 50, ac: 150000, u: 1600, t0: 28, t: 0, temp: 20, sig: 0}, o));
  check('creep (C30/37, RH 50, h0 187.5, class N, t0 = 28 at 20 degrees): alpha1 0.94406, alpha2 0.98369, phi_RH = 1.79494, beta(fcm) = 2.72532, t0 adjusted by temperature 27.9475 (class N: alpha 0 leaves it), beta(t0) = 0.48862, phi0 = 2.39025', [near(c({}).phiRH, 1.794945, 1e-5), near(c({}).bfcm, 2.725320, 1e-5), near(c({}).t0T, 27.94749, 1e-4), near(c({}).t0e, 27.94749, 1e-4), near(c({}).bt0, 0.488624, 1e-5), near(c({}).phi0, 2.390250, 1e-4), near(c({}).phiInf, 2.390250, 1e-4)], [true, true, true, true, true, true, true]);
  check('time development (B.7): beta_H = 1.5 x (1 + 0.6^18) x 187.5 + 250 x 0.95971 = 521.207, beta_c at 10 000 days = (9972 / 10 493.2)^0.3 = 0.98483, phi(t) = 2.35400; t = 0 means infinity with beta_c = 1', [near(c({}).bH, 521.2073, 1e-3), near(c({t: 10000}).bc, 0.984832, 1e-5), near(c({t: 10000}).phiT, 2.353995, 1e-4), near(c({}).bc, 1, 1e-12), near(c({t: 20}).bc, 0, 1e-12)], [true, true, true, true, true]);
  check('cement type moves the age at loading (B.9): class R at 7 days becomes 12.096 (beta(t0) = 0.57261, a bigger creep reduction), class S becomes 4.0357; temperature 40 degrees ages 28 days to 66.86 (B.10)', [near(c({cem: 0, t0: 7}).t0e, 12.09624, 1e-3), near(c({cem: 0, t0: 7}).bt0, 0.572613, 1e-5), near(c({cem: 2, t0: 7}).t0e, 4.035666, 1e-3), near(c({temp: 40}).t0T, 66.8634, 1e-3), near(c({t0: 0.1}).t0e, 0.5, 1e-12)], [true, true, true, true, true]);
  check('low strength branch (fcm 28 not above 35): phi_RH = 1 + 0.2 / (0.1 x 300^(1/3)) = 1.29876 and beta_H = 915.82 with no alpha factors', [near(c({fck: 20, rh: 80, ac: 150000, u: 1000}).h0, 300, 1e-9), near(c({fck: 20, rh: 80, ac: 150000, u: 1000}).phiRH, 1.298760, 1e-5), near(c({fck: 20, rh: 80, ac: 150000, u: 1000}).bH, 915.8215, 1e-3), near(c({fck: 20, rh: 80, ac: 150000, u: 1000}).bfcm, 3.174902, 1e-5)], [true, true, true, true]);
  check('non-linear creep (3.7): sigma 15 MPa at fck(28) = 30 gives k = 0.5 and phi x exp(1.5 x 0.05) = x 1.07788; 12 MPa (k = 0.4) stays linear; creep strain = phi sigma / (1.05 Ecm) and Ec,eff = Ecm / (1 + phi)', [near(c({sig: 15}).ks, 0.5, 1e-12), c({sig: 15}).nl, near(c({sig: 15}).phiNl, 2.390250 * 1.0778842, 1e-4), c({sig: 12}).nl, near(c({sig: 12}).phiNl, 2.390250, 1e-4), near(c({sig: 15}).eccInf, 0.00112088, 1e-7), near(c({}).ecEff, 9685.588, 1e-1), near(c({sig: 15}).ecEff, 32836.568 / (1 + 2.390250 * 1.0778842), 1e-1)], [true, true, true, false, true, true, true, true]);
}
let tt;
w.renderCalc('ec2time'); w.calcResult('ec2time');
tt = txt(w, 'xcp_results');
check('the default page (strength at 7 days, class N) shows fcm(t) 29.6 MPa, Ecm 32.84 GPa and the 🔴 note', [tt.includes('29.6 MPa'), tt.includes('32.84 GPa'), tt.includes('0.779'), tt.includes('🔴')], [true, true, true, true]);
set('xcp_m', '1'); w.calcResult('ec2time'); tt = txt(w, 'xcp_results');
check('the creep page shows phi(inf, t0) = 2.390 and Ec,eff 9.69 GPa and shows the shared group but not the strength group', [tt.includes('2.390'), tt.includes('9.69 GPa'), doc.getElementById('xcp_g0').style.display === 'none', doc.getElementById('xcp_gs').style.display === '', doc.getElementById('xcp_g1').style.display === ''], [true, true, true, true, true]);
set('xcp_m', '2'); w.calcResult('ec2time'); tt = txt(w, 'xcp_results');
check('the shrinkage page shows eps_cd,0 0.482 per mille and the total 0.469 per mille at infinity and hides the creep group', [tt.includes('0.482'), tt.includes('0.469'), doc.getElementById('xcp_g1').style.display === 'none', doc.getElementById('xcp_g2').style.display === ''], [true, true, true, true]);
check('other reference codes open ec2time too', others('ec2time', 'xcp_results'), [true, true, true]);
}
// ---------- part 301: EN 1992-1-1:2004 deflection by calculation (`ec2defl`: 7.4.3 uncracked / fully cracked sections with the distribution coefficient (7.18) (7.19), effective modulus (7.20), shrinkage curvature (7.21), limits 7.4.1(4) (5)) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const cal = o => J('xdnCalc(' + JSON.stringify(Object.assign({sch: 0, L: 6, q: 15, b: 300, h: 500, bf: 300, hf: 0, d: 450, d2: 50, as: 1256, as2: 0, fck: 30, es: 200000, phi: 2.5, ecs: 0.4}, o)) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
const rel = (a, b, e) => Math.abs(a - b) <= (e || 1e-6) * Math.abs(b);
{
  const r = cal({});
  check('materials: Ecm = 22 x 3.8^0.3 = 32 836.57 MPa, Ec,eff = Ecm / 3.5 = 9381.88, fctm = 2.89647; alpha_e = 200 000 / Ecm = 6.09077 short and 21.3177 long term', [rel(r.ecm, 32836.568031, 1e-8), rel(r.ecEff, 9381.876580, 1e-8), rel(r.fctm, 2.896468154, 1e-8), rel(r.aeS, 6.0907705, 1e-7), rel(r.aeL, 21.317697, 1e-7)], [true, true, true, true, true]);
  const rho = 1256 / (300 * 450), a = 6.0907705034573 * rho, xc = 450 * (-a + Math.sqrt(a * (a + 2)));
  check('uncracked transformed rectangle: yI = 258.1768 mm, II = 3.370304e9 mm4 (short term), 3.997351e9 (long term, alpha_e 21.32)', [rel(r.sS.yI, 258.17679378, 1e-7), rel(r.sS.II, 3370303813.52, 1e-7), rel(r.sL.II, 3997350794.67, 1e-7)], [true, true, true]);
  check('fully cracked rectangle: x = d (-alpha rho + sqrt(alpha rho (alpha rho + 2))) = 128.1238 mm and Icr = b x3 / 3 + alpha As (d - x)2 = 1.002898e9; long term x = 207.887, Icr = 2.467943e9', [rel(r.sS.x, xc, 1e-9), rel(r.sS.x, 128.12378278, 1e-7), rel(r.sS.Icr, 1002897897.83, 1e-7), rel(r.sL.x, 207.887352575, 1e-7), rel(r.sL.Icr, 2467942757.73, 1e-7)], [true, true, true, true, true]);
  check('cracking and distribution (7.19): Mcr = 2.89647 x 3.3703e9 / 241.82 = 40.368 kN m, M = 15 x 36 / 8 = 67.5, zeta = 1 - 1.0 (40.368 / 67.5)2 = 0.64234 short and 1 - 0.5 (...)2 = 0.82117 long', [rel(r.Mcr, 40.3682418, 1e-7), near(r.M, 67.5, 1e-12), rel(r.zS, 0.64233856, 1e-7), rel(r.zL, 0.82116928, 1e-7), r.cracked], [true, true, true, true, true]);
  check('deflections (5 q L4 / 384 E I): aI = 2.28722, aII = 7.68636, short-term interpolation (7.18) 5.75529 mm; long term with Ec,eff 10.18426 mm; creep increment 4.42897', [rel(r.aIS, 2.28722152, 1e-7), rel(r.aIIS, 7.68635714, 1e-7), rel(r.dS, 5.75529451, 1e-7), rel(r.dL, 10.18426409, 1e-7), rel(r.dCreep, 10.18426409 - 5.75529451, 1e-6)], [true, true, true, true, true]);
  check('shrinkage curvature (7.21): 1/r uncracked = 4.57946e-7 and cracked 1.050684e-6 per mm, interpolated with zeta_long = 9.44685e-7, delta = L2 / 8 x curvature = 4.25108 mm; total 14.43535 mm = L / 415.7 within L / 250 = 24 mm', [rel(r.kI, 4.5794645e-7, 1e-6), rel(r.kII, 1.05068445e-6, 1e-6), rel(r.kcs, 9.4468469e-7, 1e-6), rel(r.dCs, 4.25108109, 1e-6), rel(r.dT, 14.43534518, 1e-6), near(r.ratio, 415.65, 0.01), near(r.lim, 24, 1e-9), near(r.lim2, 12, 1e-9), r.ok], [true, true, true, true, true, true, true, true, true]);
  const c2 = cal({as2: 628});
  check('compression steel 628 mm2 at d2 = 50: yI = 254.0065, II = 3.506079e9, x = 122.9753, Icr = 1.021131e9; long term x = 187.506, Icr = 2.745381e9; Mcr 41.2826; total 12.00176 mm', [rel(c2.sS.yI, 254.00649616, 1e-7), rel(c2.sS.II, 3506078708.39, 1e-7), rel(c2.sS.x, 122.97531072, 1e-7), rel(c2.sS.Icr, 1021131183.50, 1e-7), rel(c2.sL.x, 187.50599263, 1e-7), rel(c2.sL.Icr, 2745380950.83, 1e-7), rel(c2.Mcr, 41.28257521, 1e-7), rel(c2.dT, 12.00175596, 1e-6), c2.sL.okComp], [true, true, true, true, true, true, true, true, true]);
  const t1 = cal({bf: 1000, hf: 120});
  check('T section 1000 x 120 flange with 300 web: short-term neutral axis 75.678 mm lies in the flange (rectangle bf), II = 5.617359e9, Icr = 1.216369e9, Mcr = 52.3047; long-term x = 131.0205 passes the flange (T branch), Icr = 3.473707e9; total 10.23165 mm', [rel(t1.sS.x, 75.67783631, 1e-7), t1.sS.flange, rel(t1.sS.yI, 188.92860065, 1e-7), rel(t1.sS.II, 5617358976.60, 1e-7), rel(t1.sS.Icr, 1216369158.00, 1e-7), rel(t1.Mcr, 52.3047166, 1e-7), rel(t1.sL.x, 131.02054700, 1e-6), t1.sL.flange, rel(t1.sL.Icr, 3473706572.74, 1e-6), rel(t1.dT, 10.23164664, 1e-6)], [true, true, true, true, true, true, true, false, true, true]);
  const t2 = cal({bf: 1000, hf: 120, as: 4000, q: 60});
  check('heavily reinforced T section (As 4000, q 60): short-term x = 125.7827 mm below the flange (T branch), Icr = 3.224274e9, M = 270 kN m, zeta = 0.94449 / 0.97224, total 18.29521 mm still within L / 250', [rel(t2.sS.x, 125.78265022, 1e-6), !t2.sS.flange, rel(t2.sS.Icr, 3224273594.66, 1e-6), near(t2.M, 270, 1e-9), rel(t2.zS, 0.94448697, 1e-6), rel(t2.zL, 0.97224348, 1e-6), rel(t2.dT, 18.29521118, 1e-6), t2.ok], [true, true, true, true, true, true, true, true]);
  const cu = cal({sch: 1, L: 2.5, q: 10}), ss = cal({sch: 2, q: 40}), cp = cal({sch: 3, L: 2.5, q: 20});
  check('cantilever with a distributed load (L 2.5, q 10): M = q L2 / 2 = 31.25 below Mcr so zeta = 0, aI = q L4 / 8 E I = 0.441208 mm, long term 1.301991, shrinkage k = 1/2 gives 1.431083, total 2.733074', [near(cu.M, 31.25, 1e-12), !cu.cracked, near(cu.zS, 0, 1e-12), rel(cu.dS, 0.44120786, 1e-6), rel(cu.dL, 1.30199126, 1e-6), rel(cu.dCs, 1.43108267, 1e-6), rel(cu.dT, 2.73307393, 1e-6)], [true, true, true, true, true, true, true]);
  check('central point load 40 kN on 6 m: M = P L / 4 = 60, aI = P L3 / 48 E I, total 11.22523 mm; cantilever tip load 20 kN on 2.5 m: M = 50 and total 6.61756 mm (k = 1/3 and 1/2 for shrinkage)', [near(ss.M, 60, 1e-12), rel(ss.dS, 3.72789760, 1e-6), rel(ss.dT, 11.22523210, 1e-6), near(cp.M, 50, 1e-12), rel(cp.dS, 1.71481296, 1e-6), rel(cp.dT, 6.61756015, 1e-6)], [true, true, true, true, true, true]);
  const lg = cal({q: 4}), fl = cal({L: 8, q: 22});
  check('a light load below the cracking moment: M = 18 gives zeta = 0, uncracked deflection 0.609926 mm, total 3.860632 mm; a long beam (L 8, q 22): M = 176, total 58.446 mm exceeds L / 250 = 32 mm and L / 500 = 16', [!lg.cracked, near(lg.zL, 0, 1e-12), rel(lg.dS, 0.60992574, 1e-6), rel(lg.dT, 3.86063176, 1e-6), rel(fl.dT, 58.4460746, 1e-6), near(fl.lim, 32, 1e-9), near(fl.lim2, 16, 1e-9), fl.ok], [true, true, true, true, true, true, true, false]);
  check('compression steel is flagged when it lies in the tension zone: d2 = 150 mm with the short-term x about 123 gives okComp false, while the long-term x of about 187 keeps it inside', [cal({as2: 628, d2: 150}).sS.okComp, cal({as2: 628, d2: 150}).sL.okComp, cal({as2: 628, d2: 50}).sS.okComp, cal({}).sS.okComp], [false, true, true, true]);
}
let tt;
w.renderCalc('ec2defl'); w.calcResult('ec2defl');
tt = txt(w, 'xdn_results');
check('the default page shows Mcr 40.37 kN m, M 67.50 kN m, total 14.44 mm with L / 416 and the 🔴 note and passes L / 250', [tt.includes('40.37 kN·m'), tt.includes('67.50 kN·m'), tt.includes('14.44 mm'), tt.includes('L / 416'), tt.includes('🔴'), !tt.includes('✘')], [true, true, true, true, true, true]);
set('xdn_l', '8'); set('xdn_q', '22'); w.calcResult('ec2defl'); tt = txt(w, 'xdn_results');
check('the long beam page reports 58.45 mm and a failed limit', [tt.includes('58.45 mm'), tt.includes('✘')], [true, true]);
set('xdn_as', '0'); w.calcResult('ec2defl'); tt = txt(w, 'xdn_results');
check('no tension steel asks for the reinforcement area', [tt.includes('أدخل مساحة حديد الشد')], [true]);
check('other reference codes open ec2defl too', others('ec2defl', 'xdn_results'), [true, true, true]);
}
// ---------- part 302: EN 1992-1-1:2004 strut-and-tie details (`ec2stm`: struts and nodes 6.5.2 / 6.5.4 (6.55) to (6.62), transverse tension in compression fields 6.5.3 (6.58) (6.59), partially loaded areas 6.7 (6.63), corbels J.3, surface reinforcement J.1 and frame corners J.2.2) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const stt = o => J('xsmStrut(' + JSON.stringify(Object.assign({fck: 30, gc: 1.5, acc: 1, type: 3, boost: 0, f: 800, b: 300, w: 150}, o)) + ')');
const tie = o => J('xsmTie(' + JSON.stringify(Object.assign({f: 1000, a: 200, b: 600, h: 2000, fyd: 435}, o)) + ')');
const par = o => J('xsmPart(' + JSON.stringify(Object.assign({fck: 30, gc: 1.5, acc: 1, b1: 200, d1: 200, b2: 600, d2: 600, h: 500, f: 2500}, o)) + ')');
const cor = o => J('xsmCorbel(' + JSON.stringify(Object.assign({ac: 200, hc: 500, z: 400, f: 500, hd: 0, fyd: 435, asm: 1500, asl: 600, vrdc: 200}, o)) + ')');
const srf = o => J('xsmSurf(' + JSON.stringify(Object.assign({phi: 40, act: 40000, cover: 50, h1: 600, h2: 500, tan: 0.7, f1: 400, f2: 500}, o)) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  check('design strength fcd = 1 x 30 / 1.5 = 20 MPa and nu = 1 - 30 / 250 = 0.88; limits: strut fcd = 20, cracked strut 0.6 x 0.88 x 20 = 10.56, CCC 17.6, CCT one direction 0.85 x 17.6 = 14.96, more than one direction 0.75 x 17.6 = 13.2, triaxial 3 x 17.6 = 52.8', [near(stt({}).fcd, 20, 1e-12), near(stt({}).nu, 0.88, 1e-12), ...stt({}).lims.map((x, i) => near(x, [20, 10.56, 17.6, 14.96, 13.2, 52.8][i], 1e-9))], [true, true, true, true, true, true, true, true]);
  check('node check: 800 kN on 300 x 150 mm gives 17.78 MPa against 14.96 (ratio 1.188) so it fails and the 10 % increase (16.456) still fails; a 200 mm node gives 13.33 and passes with capacity 14.96 x 300 x 150 = 673.2 kN', [near(stt({}).sigma, 17.777778, 1e-5), stt({}).ok, near(stt({}).ratio, 1.188352, 1e-5), near(stt({boost: 1}).lim, 16.456, 1e-9), stt({boost: 1}).ok, near(stt({w: 200}).sigma, 13.333333, 1e-5), stt({w: 200}).ok, near(stt({}).fmax, 673.2, 1e-9)], [true, false, true, true, false, true, true, true]);
  check('the 10 % increase applies to the three node types only: not to struts (types 0, 1) and not to the triaxial node (type 5)', [stt({type: 0, boost: 1}).boost, stt({type: 1, boost: 1}).boost, stt({type: 2, boost: 1}).boost, stt({type: 4, boost: 1}).boost, stt({type: 5, boost: 1}).boost], [1, 1, 1.1, 1.1, 1]);
  check('alpha_cc and gamma_c change fcd: 0.85 x 30 / 1.5 = 17 MPa and C50: nu = 0.8, k3 x nu x fcd = 0.75 x 0.8 x 33.33 = 20', [near(stt({acc: 0.85}).fcd, 17, 1e-12), near(stt({fck: 50, type: 4}).lim, 20, 1e-9)], [true, true]);
  check('transverse tension, partial discontinuity (b = 600 <= H / 2 = 1000): T = 0.25 x (600 - 200) / 600 x 1000 = 166.67 kN, bef = b = 600, As = 166 667 / 435 = 383.1 mm2', [tie({}).partial, near(tie({}).t, 166.666667, 1e-5), near(tie({}).bef, 600, 1e-9), near(tie({}).as, 383.1418, 1e-3), tie({}).okA], [true, true, true, true, true]);
  check('full discontinuity (b = 1500 > 1000): h = H / 2 = 1000, T = 0.25 x (1 - 0.7 x 200 / 1000) x 1000 = 215 kN, bef = 0.5 x 2000 + 0.65 x 200 = 1130 mm; a = 1200 above h is flagged', [!tie({b: 1500}).partial, near(tie({b: 1500}).hh, 1000, 1e-9), near(tie({b: 1500}).t, 215, 1e-9), near(tie({b: 1500}).bef, 1130, 1e-9), tie({b: 1500, a: 1200}).okA, near(tie({b: 1500, a: 1200}).t, 0.25 * (1 - 0.7 * 1.2) * 1000, 1e-9)], [true, true, true, true, false, true]);
  check('the two tension rules switch at b = H / 2 = 1000 (a = 200): partial gives (1 - 0.2) / 4 x 1000 = 200 at b = 1000 and full gives 0.25 x (1 - 0.14) x 1000 = 215 just above', [near(tie({b: 1000}).t, 200, 1e-9), tie({b: 1000}).partial, near(tie({b: 1001}).t, 0.25 * (1 - 0.7 * 200 / 1000) * 1000, 1e-9)], [true, true, true]);
  check('partially loaded area: Ac0 = 40 000, Ac1 = 360 000, sqrt = 3.0 so FRdu = 40 000 x 20 x 3 / 1000 = 2400 kN (not capped), 2500 kN fails; Ac1 = 640 000 gives k = 4 capped at 3: still 2400; Ac1 = 160 000 gives 1600', [near(par({}).ac0, 40000, 1e-9), near(par({}).k, 3, 1e-9), near(par({}).frdu, 2400, 1e-9), !par({}).capped, par({}).ok, near(par({b2: 800, d2: 800}).k, 4, 1e-9), par({b2: 800, d2: 800}).capped, near(par({b2: 800, d2: 800}).frdu, 2400, 1e-9), near(par({b2: 400, d2: 400}).frdu, 1600, 1e-9), par({b2: 400, d2: 400, f: 1500}).ok], [true, true, true, true, false, true, true, true, true, true]);
  check('distribution height and shape: h >= max(b2 - b1, d2 - d1) = 400 so 500 passes and 350 fails; a rectangular 600 x 400 distribution of a square load is not similar in shape', [near(par({}).hMin, 400, 1e-9), par({}).okH, par({h: 350}).okH, par({}).similar, par({d2: 400}).similar], [true, true, false, true, false]);
  check('corbel: tan theta = 400 / 200 = 2.0 within 1.0 to 2.5, theta = 63.43 degrees, Ftd = 500 x 200 / 400 = 250 kN, As = 574.7 mm2 against 1500 provided, strut force 500 / sin = 559.02 kN; HEd 50 adds to Ftd = 300', [near(cor({}).tan, 2, 1e-12), cor({}).okTan, cor({}).okShort, near(cor({}).theta, 63.434949, 1e-5), near(cor({}).ftd, 250, 1e-9), near(cor({}).asm, 574.7126, 1e-3), cor({}).okAs, near(cor({}).fc, 559.016994, 1e-5), near(cor({hd: 50}).ftd, 300, 1e-9)], [true, true, true, true, true, true, true, true, true]);
  check('corbel limits: ac = 100 gives tan 4 above 2.5 and ac = 450 gives 0.889 below 1.0; ac = z0 = 400 is no longer a corbel; 500 mm2 of steel is not enough for 574.7', [cor({ac: 100}).okTan, cor({ac: 450}).okTan, cor({ac: 400}).okShort, cor({asm: 500}).okAs, cor({ac: 450}).okShort], [false, false, false, false, false]);
  check('corbel links (J.3): ac 200 < 0.5 hc = 250 -> 0.25 x 1500 = 375 mm2 and 600 passes; ac 300 above 0.5 hc with FEd 500 > VRd,c 200 -> 0.5 x 500 000 / 435 = 574.7 mm2 (600 passes, 500 fails); FEd 150 below VRd,c needs none', [cor({}).caseL, near(cor({}).aslMin, 375, 1e-9), cor({}).okAsl, cor({ac: 300}).caseL, near(cor({ac: 300}).aslMin, 574.7126, 1e-3), cor({ac: 300}).okAsl, cor({ac: 300, asl: 500}).okAsl, cor({ac: 300, f: 150}).caseL, near(cor({ac: 300, f: 150}).aslMin, 0, 1e-12)], [0, true, true, 1, true, true, false, 2, true]);
  check('surface reinforcement: 40 mm bars exceed 32 so it is needed, 0.01 x 40 000 = 400 mm2; 32 mm is not enough to need it; cover 80 > 70 gives 0.005 x 40 000 = 200 mm2 while 50 gives none', [srf({}).need, near(srf({}).min, 400, 1e-9), srf({phi: 32}).need, srf({}).dur, srf({cover: 80}).dur, near(srf({cover: 80}).durMin, 200, 1e-9)], [true, true, false, false, true, true]);
  check('frame corners (J.2.2): h2 / h1 = 500 / 600 = 0.833 lies between 2/3 and 3/2 so no link or anchorage check; 400 / 600 = 2/3 exactly is outside the open range; the swapped order gives the same ratio; tan theta 0.7 is inside 0.4 to 1.0 and 0.3 is not; dF = 100 kN', [srf({}).noCheck, srf({h2: 400}).noCheck, near(srf({h1: 500, h2: 600}).ratio, 500 / 600, 1e-12), srf({}).okTan, srf({tan: 0.3}).okTan, srf({tan: 1.2}).okTan, near(srf({}).dF, 100, 1e-9)], [true, false, true, true, false, false, true]);
}
let tt;
w.renderCalc('ec2stm'); w.calcResult('ec2stm');
tt = txt(w, 'xsm_results');
check('the default page (CCT node) shows 17.78 MPa against 14.96 MPa, fails, and shows the strut group only', [tt.includes('17.78 MPa'), tt.includes('14.96 MPa'), tt.includes('✘'), tt.includes('🔴'), doc.getElementById('xsm_g0').style.display === '', doc.getElementById('xsm_g1').style.display === 'none'], [true, true, true, true, true, true]);
set('xsm_m', '1'); w.calcResult('ec2stm'); tt = txt(w, 'xsm_results');
check('the tie page shows T 166.7 kN and 383 mm2', [tt.includes('166.7 kN'), tt.includes('383 mm²'), doc.getElementById('xsm_g1').style.display === '', doc.getElementById('xsm_g0').style.display === 'none'], [true, true, true, true]);
set('xsm_m', '2'); w.calcResult('ec2stm'); tt = txt(w, 'xsm_results');
check('the partially loaded page shows FRdu 2400.0 kN and fails 2500 kN', [tt.includes('2400.0 kN'), tt.includes('✘')], [true, true]);
set('xsm_m', '3'); w.calcResult('ec2stm'); tt = txt(w, 'xsm_results');
check('the corbel page shows Ftd 250.0 kN, 575 mm2 and tan 2.00', [tt.includes('250.0 kN'), tt.includes('575 mm²'), tt.includes('2.00')], [true, true, true]);
set('xsm_m', '4'); w.calcResult('ec2stm'); tt = txt(w, 'xsm_results');
check('the surface page shows 400 mm2 and the default ratio 0.67 (exactly 2/3, outside the open range so a strut-and-tie model is required)', [tt.includes('400 mm²'), tt.includes('0.67'), doc.getElementById('xsm_g4').style.display === ''], [true, true, true]);
check('other reference codes open ec2stm too', others('ec2stm', 'xsm_results'), [true, true, true]);
}
// ---------- part 303: EN 1992-1-1:2004 Annex I (`ec2flat`: flat slab moment apportionment Table I.1, edge and corner column moment limit I.1.2(5), lateral load distribution to shear walls I.1.2(6)) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const str = o => J('xfaStrips(' + JSON.stringify(Object.assign({lt: 7, bd: 0, mneg: 400, mpos: 250, pick: 1}, o)) + ')');
const edg = o => J('xfaEdge(' + JSON.stringify(Object.assign({type: 0, cz: 400, y: 200, z: 300, d: 220, fck: 30, m: 60}, o)) + ')');
const wl = o => J('xfaWalls(' + JSON.stringify(Object.assign({p: 1000, yp: 10, ns: 12, walls: [{y: 0, ei: 1}, {y: 8, ei: 2}, {y: 16, ei: 1}]}, o)) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  check('Table I.1 mid-range (70 % and 60 %) for a 7 m panel: strips 3.5 + 3.5 m; negative 280 + 120 kN m; positive 150 + 100 kN m; per metre 80, 34.286, 42.857, 28.571', [near(str({}).wc, 3.5, 1e-12), near(str({}).wm, 3.5, 1e-12), near(str({}).mnc, 280, 1e-9), near(str({}).mnm, 120, 1e-9), near(str({}).mpc, 150, 1e-9), near(str({}).mpm, 100, 1e-9), near(str({}).pnc, 80, 1e-9), near(str({}).pnm, 34.285714, 1e-5), near(str({}).ppc, 42.857143, 1e-5), near(str({}).ppm, 28.571429, 1e-5)], [true, true, true, true, true, true, true, true, true, true]);
  check('limits of Table I.1: lower 60 % / 40 % negative and 50 % / 50 % positive (240 + 160, 125 + 125); upper 80 % / 20 % and 70 % / 30 % (320 + 80, 175 + 75); the two strips always add to 100 %', [near(str({pick: 0}).mnc, 240, 1e-9), near(str({pick: 0}).mnm, 160, 1e-9), near(str({pick: 0}).mpc, 125, 1e-9), near(str({pick: 0}).mpm, 125, 1e-9), near(str({pick: 2}).mnc, 320, 1e-9), near(str({pick: 2}).mnm, 80, 1e-9), near(str({pick: 2}).mpc, 175, 1e-9), near(str({pick: 2}).mpm, 75, 1e-9), [0, 1, 2].every(p => near(str({pick: p}).mnc + str({pick: p}).mnm, 400, 1e-9) && near(str({pick: p}).mpc + str({pick: p}).mpm, 250, 1e-9))], [true, true, true, true, true, true, true, true, true]);
  check('a drop wider than a third of the panel (3000 mm > 2333) sets the column strip to the drop width 3.0 m and the middle strip to 4.0 m; 2000 mm is not enough and keeps 3.5 m; per metre column strip becomes 280 / 3 = 93.33', [str({bd: 3000}).drop, near(str({bd: 3000}).wc, 3, 1e-12), near(str({bd: 3000}).wm, 4, 1e-12), near(str({bd: 3000}).pnc, 93.333333, 1e-5), str({bd: 2000}).drop, near(str({bd: 2000}).wc, 3.5, 1e-12)], [true, true, true, true, false, true]);
  check('edge column: be = cz + y = 600 mm, Mt,max = 0.17 x 600 x 220^2 x 30 = 148.104 kN m; 60 passes (ratio 0.405) and 200 exceeds by 51.896; corner column: be = z + y / 2 = 400 and Mt,max = 98.736', [near(edg({}).be, 600, 1e-9), near(edg({}).mmax, 148.1040, 1e-6), edg({}).ok, near(edg({}).ratio, 60 / 148.104, 1e-6), edg({m: 200}).ok, near(edg({m: 200}).excess, 51.896, 1e-6), near(edg({type: 1}).be, 400, 1e-9), near(edg({type: 1}).mmax, 98.736, 1e-6), near(edg({}).excess, 0, 1e-12)], [true, true, true, true, false, true, true, true, true]);
  check('shear walls (I.1): centroid (0 x 1 + 8 x 2 + 16 x 1) / 4 = 8 m, e = 10 - 8 = 2 m, sum EI y2 = 64 + 0 + 64 = 128; Pn = 250 - 125, 500 + 0, 250 + 125 = 125, 500, 375 kN', [near(wl({}).ybar, 8, 1e-12), near(wl({}).e, 2, 1e-12), near(wl({}).sumEIy2, 128, 1e-9), near(wl({}).pn[0].total, 125, 1e-9), near(wl({}).pn[1].total, 500, 1e-9), near(wl({}).pn[2].total, 375, 1e-9), near(wl({}).pn[0].torsion, -125, 1e-9), near(wl({}).sum, 1000, 1e-9)], [true, true, true, true, true, true, true, true]);
  check('a load through the centroid gives pure stiffness shares 250, 500, 250 and no torsion; equilibrium holds for six unequal walls: sum of forces = P and sum of force x position = P x yp', [near(wl({yp: 8}).pn[0].total, 250, 1e-9), near(wl({yp: 8}).pn[1].total, 500, 1e-9), near(wl({yp: 8}).pn[2].total, 250, 1e-9), near(wl({yp: 8}).pn[0].torsion, 0, 1e-12), (() => { const o = {p: 1800, yp: 11.3, walls: [{y: 0, ei: 1}, {y: 5, ei: 3}, {y: 9.5, ei: 2}, {y: 14, ei: 1.5}, {y: 19, ei: 2.5}, {y: 24, ei: 1}]}; const r = wl(o); const m = r.pn.reduce((s, x, i) => s + x.total * o.walls[i].y, 0); return near(r.sum, 1800, 1e-7) && near(m, 1800 * 11.3, 1e-6); })()], [true, true, true, true, true]);
  check('unused walls (EI 0) take no load and do not shift the centroid; more than 25 storeys is flagged', [wl({walls: [{y: 0, ei: 1}, {y: 8, ei: 2}, {y: 16, ei: 1}, {y: 40, ei: 0}]}).pn[3].total, near(wl({walls: [{y: 0, ei: 1}, {y: 8, ei: 2}, {y: 16, ei: 1}, {y: 40, ei: 0}]}).ybar, 8, 1e-12), wl({walls: [{y: 0, ei: 1}, {y: 8, ei: 2}, {y: 16, ei: 1}, {y: 40, ei: 0}]}).count, wl({ns: 25}).okStoreys, wl({ns: 26}).okStoreys], [0, true, 3, true, false]);
}
let tt;
w.renderCalc('ec2flat'); w.calcResult('ec2flat');
tt = txt(w, 'xfa_results');
check('the default page shows strips 3.50 m, 280.0 kN m negative in the column strip and the 🔴 note', [tt.includes('3.50 m'), tt.includes('280.0 kN·m'), tt.includes('150.0 kN·m'), tt.includes('🔴'), doc.getElementById('xfa_g0').style.display === ''], [true, true, true, true, true]);
set('xfa_m', '1'); w.calcResult('ec2flat'); tt = txt(w, 'xfa_results');
check('the edge column page shows Mt,max 148.1 kN m and passes', [tt.includes('148.1 kN·m'), tt.includes('600 mm'), !tt.includes('✘'), doc.getElementById('xfa_g1').style.display === '', doc.getElementById('xfa_g0').style.display === 'none'], [true, true, true, true, true]);
set('xfa_m', '2'); w.calcResult('ec2flat'); tt = txt(w, 'xfa_results');
check('the wall page shows 125.0, 500.0 and 375.0 kN and the centroid 8.00 m', [tt.includes('125.0 kN'), tt.includes('500.0 kN'), tt.includes('375.0 kN'), tt.includes('8.00 m')], [true, true, true, true]);
check('other reference codes open ec2flat too', others('ec2flat', 'xfa_results'), [true, true, true]);
}
// ---------- part 304: ACI 318-14 strut-and-tie models and deep beams (`acistm`: struts 23.3 / 23.4 (23.4.1) (23.4.3) Table 23.4.3 and closed ties 23.6.3, nodal zones 23.9 (23.9.1) (23.9.2) Table 23.9.2 and 23.2.7, ties 23.7 (23.7.2) with 23.2.9, reinforcement crossing bottle-shaped struts 23.5.3, deep beams 9.9) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const stt = o => J('xatStrut(' + JSON.stringify(Object.assign({fc: 30, lam: 1, type: 0, w1: 200, w2: 250, bs: 300, as1: 0, fsp: 420, fus: 1000, dbt: 10, dbc: 25, s: 150}, o)) + ')');
const nod = o => J('xatNode(' + JSON.stringify(Object.assign({fc: 30, cfg: 2, w: 150, w2: 0, bs: 300, fus: 500, angle: 45}, o)) + ')');
const tie = o => J('xatTie(' + JSON.stringify(Object.assign({fc: 30, fy: 420, ats: 1800, atp: 0, fse: 1000, fpy: 1670, bonded: 1, fut: 500, bw: 300, d: 450}, o)) + ')');
const bot = o => J('xatBottle(' + JSON.stringify(Object.assign({fc: 30, bs: 300, layers: [{as: 200, s: 150, alpha: 60}, {as: 157, s: 200, alpha: 30}]}, o)) + ')');
const dep = o => J('xatDeep(' + JSON.stringify(Object.assign({ln: 3, h: 1000, bw: 300, d: 900, av: 0, vu: 800, fc: 30, fy: 420, av1: 150, s: 150, avh: 150, s2: 150, as: 2500}, o)) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  check('strut coefficients (Table 23.4.3): uniform 1.0, bottle with reinforcement 0.75, bottle without 0.60 lambda, tension zone 0.40, other cases 0.60 lambda; lambda 0.85 gives 0.51', [0, 1, 2, 3, 4].map(t => near(stt({type: t}).beta, [1, 0.75, 0.6, 0.4, 0.6][t], 1e-12)), [true, true, true, true, true]);
  check('lambda enters only the two 0.60 cases: sand-lightweight 0.85 gives 0.51 for types 2 and 4 and leaves types 0, 1 and 3 unchanged; all-lightweight 0.75 gives 0.45', [near(stt({type: 2, lam: 0.85}).beta, 0.51, 1e-12), near(stt({type: 4, lam: 0.85}).beta, 0.51, 1e-12), near(stt({type: 0, lam: 0.85}).beta, 1, 1e-12), near(stt({type: 1, lam: 0.85}).beta, 0.75, 1e-12), near(stt({type: 3, lam: 0.85}).beta, 0.4, 1e-12), near(stt({type: 2, lam: 0.75}).beta, 0.45, 1e-12)], [true, true, true, true, true, true]);
  check('fce = 0.85 x beta x fc: 25.5 MPa for a uniform strut at fc 30; 19.125 (bottle), 13.005 (type 2, lambda 0.85), 10.2 (tension zone), 15.3 (type 4)', [near(stt({}).fce, 25.5, 1e-12), near(stt({type: 1}).fce, 19.125, 1e-12), near(stt({type: 2, lam: 0.85}).fce, 13.005, 1e-12), near(stt({type: 3}).fce, 10.2, 1e-12), near(stt({type: 4}).fce, 15.3, 1e-12)], [true, true, true, true, true]);
  check('Fns = fce Acs at the smaller end: 25.5 x 200 x 300 / 1000 = 1530 kN against 1912.5 at the 250 mm end, so 1530; phi Fns = 1147.5 passes Fus 1000 (ratio 0.87146) and fails 1200; the order of the two widths does not matter', [near(stt({}).a1, 60000, 1e-9), near(stt({}).fns1, 1530, 1e-9), near(stt({}).fns2, 1912.5, 1e-9), near(stt({}).fns, 1530, 1e-9), near(stt({}).phiFns, 1147.5, 1e-9), stt({}).ok, near(stt({}).ratio, 1000 / 1147.5, 1e-9), stt({fus: 1200}).ok, near(stt({w1: 250, w2: 200}).fns, 1530, 1e-9)], [true, true, true, true, true, true, true, false, true]);
  check('bottle strut with reinforcement: Fns = 19.125 x 60 000 / 1000 = 1147.5, phi Fns = 860.625 so 1000 fails; type 2 at lambda 0.85 gives 780.3, tension zone 612, other 918', [near(stt({type: 1}).fns, 1147.5, 1e-9), near(stt({type: 1}).phiFns, 860.625, 1e-9), stt({type: 1}).ok, near(stt({type: 2, lam: 0.85}).fns, 780.3, 1e-9), near(stt({type: 3}).fns, 612, 1e-9), near(stt({type: 4}).fns, 918, 1e-9)], [true, true, false, true, true, true]);
  check('compression reinforcement adds A\'s f\'s = 1000 x 420 / 1000 = 420 kN at each end (23.4.1b): 1950 and 2332.5 so Fns = 1950', [near(stt({as1: 1000}).steel, 420, 1e-9), near(stt({as1: 1000}).fns1, 1950, 1e-9), near(stt({as1: 1000}).fns2, 2332.5, 1e-9), near(stt({as1: 1000}).fns, 1950, 1e-9), near(stt({as1: 1000, fsp: 300}).fns, 1530 + 300, 1e-9)], [true, true, true, true, true]);
  check('required width = Fus / (phi fce bs) = 1 000 000 / (0.75 x 25.5 x 300) = 174.29 mm', [near(stt({}).wReq, 174.2919, 1e-3), near(stt({fus: 500}).wReq, 87.14597, 1e-4)], [true, true]);
  check('closed ties (23.6.3.1): smallest of the strut dimension (min of 300, 200, 250 = 200), 48 x 10 = 480 and 16 x 25 = 400 gives 200 so 150 passes and 250 fails; thin ties 3 mm give 144 and 10 mm compression bars give 160', [near(stt({}).dmin, 200, 1e-9), near(stt({}).sMax, 200, 1e-9), stt({}).okS, stt({s: 250}).okS, near(stt({dbt: 3}).sMax, 144, 1e-9), near(stt({dbc: 10}).sMax, 160, 1e-9)], [true, true, true, false, true, true]);
  check('nodal zone coefficients (Table 23.9.2): 1.0, 0.80, 0.60 give fce = 25.5, 20.4, 15.3 MPa at fc 30', [near(nod({cfg: 0}).beta, 1, 1e-12), near(nod({cfg: 1}).beta, 0.8, 1e-12), near(nod({cfg: 2}).beta, 0.6, 1e-12), near(nod({cfg: 0}).fce, 25.5, 1e-12), near(nod({cfg: 1}).fce, 20.4, 1e-12), near(nod({cfg: 2}).fce, 15.3, 1e-12)], [true, true, true, true, true, true]);
  check('node strength: Anz = 150 x 300 = 45 000, Fnn = 15.3 x 45 000 / 1000 = 688.5, phi Fnn = 516.375 passes 500 (ratio 0.9683) and fails 600; 1.0 gives 1147.5 and 0.80 gives 918', [near(nod({}).anz, 45000, 1e-9), near(nod({}).fnn, 688.5, 1e-9), near(nod({}).phiFnn, 516.375, 1e-9), nod({}).ok, near(nod({}).ratio, 500 / 516.375, 1e-9), nod({fus: 600}).ok, near(nod({cfg: 0}).fnn, 1147.5, 1e-9), near(nod({cfg: 1}).fnn, 918, 1e-9)], [true, true, true, true, true, false, true, true]);
  check('the smaller of the two face areas governs (23.9.4): a 120 mm section gives 36 000 mm2, Fnn = 550.8, phi Fnn = 413.1 and 500 fails; a wider second section (200 mm) does not reduce it; width needed for 500 kN is 145.24 mm', [near(nod({w2: 120}).anz, 36000, 1e-9), near(nod({w2: 120}).fnn, 550.8, 1e-9), near(nod({w2: 120}).phiFnn, 413.1, 1e-9), nod({w2: 120}).ok, near(nod({w2: 200}).anz, 45000, 1e-9), near(nod({}).wReq, 145.2433, 1e-3)], [true, true, true, false, true, true]);
  check('angle between strut and tie (23.2.7): 25 degrees passes, 24.9 fails', [nod({angle: 25}).okAngle, nod({angle: 24.9}).okAngle, nod({angle: 45}).okAngle], [true, false, true]);
  check('tie (23.7.2): Fnt = 1800 x 420 / 1000 = 756 kN, phi Fnt = 567 passes 500 (ratio 0.88183) and fails 600; required area = 500 000 / (0.75 x 420) = 1587.3 mm2', [near(tie({}).fnt, 756, 1e-9), near(tie({}).phiFnt, 567, 1e-9), tie({}).ok, near(tie({}).ratio, 500 / 567, 1e-9), tie({fut: 600}).ok, near(tie({}).atsReq, 1587.3016, 1e-3)], [true, true, true, true, false, true]);
  check('prestressed tie: bonded delta fp 414 MPa so fse + dfp = 1414 below fpy 1670: Fnt = 756 + 500 x 1414 / 1000 = 1463; capped at fpy 1300 gives 1406; unbonded 69 MPa gives 756 + 534.5 = 1290.5; the prestress can cover the whole demand so no mild steel is required (0)', [near(tie({atp: 500}).dfp, 414, 1e-9), near(tie({atp: 500}).fps, 1414, 1e-9), near(tie({atp: 500}).fnt, 1463, 1e-9), !tie({atp: 500}).capped, near(tie({atp: 500, fpy: 1300}).fnt, 1406, 1e-9), tie({atp: 500, fpy: 1300}).capped, near(tie({atp: 500, bonded: 0}).fnt, 1290.5, 1e-9), near(tie({atp: 500}).atsReq, 0, 1e-12)], [true, true, true, true, true, true, true, true]);
  check('corbel tie minimum (23.2.9): Asc >= 0.04 x (30 / 420) x 300 x 450 = 385.71 mm2; 1800 passes and 300 fails', [near(tie({}).ascMin, 385.7143, 1e-3), tie({}).okAsc, tie({ats: 300}).okAsc, near(tie({fc: 40}).ascMin, 0.04 * 40 / 420 * 135000, 1e-6)], [true, true, false, true]);
  check('bottle strut reinforcement (23.5.3): rho1 = 200 / (300 x 150) = 0.0044444 and rho2 = 0.0026167; sum rho sin alpha = 0.0038490 + 0.0013083 = 0.0051573 >= 0.003', [near(bot({}).rho[0], 0.00444444, 1e-8), near(bot({}).rho[1], 0.00261667, 1e-8), near(bot({}).terms[0], 0.003849002, 1e-8), near(bot({}).terms[1], 0.001308333, 1e-8), near(bot({}).sum, 0.005157335, 1e-8), bot({}).ok, bot({}).n, bot({}).fcOk], [true, true, true, true, true, true, 2, true]);
  check('one direction only (23.5.3.1): alpha1 60 degrees gives 0.003849 and passes with the 40 degree rule; alpha1 35 degrees gives 0.0025492 < 0.003 and fails both; 6 bars at exactly 0.003 pass', [bot({layers: [{as: 200, s: 150, alpha: 60}, {as: 0, s: 200, alpha: 30}]}).one, near(bot({layers: [{as: 200, s: 150, alpha: 60}, {as: 0, s: 200, alpha: 30}]}).sum, 0.003849002, 1e-8), bot({layers: [{as: 200, s: 150, alpha: 60}, {as: 0, s: 200, alpha: 30}]}).ok, bot({layers: [{as: 200, s: 150, alpha: 60}, {as: 0, s: 200, alpha: 30}]}).okAngle, near(bot({layers: [{as: 200, s: 150, alpha: 35}, {as: 0, s: 200, alpha: 30}]}).sum, 0.0044444444 * Math.sin(35 * Math.PI / 180), 1e-8), bot({layers: [{as: 200, s: 150, alpha: 35}, {as: 0, s: 200, alpha: 30}]}).ok, bot({layers: [{as: 200, s: 150, alpha: 35}, {as: 0, s: 200, alpha: 30}]}).okAngle, bot({layers: [{as: 135, s: 150, alpha: 90}, {as: 0, s: 200, alpha: 30}]}).ok], [true, true, true, true, true, false, false, true]);
  check('required area of the first direction = 0.003 x 300 x 150 / sin 60 = 155.88 mm2; the 23.5.3 shortcut applies only up to fc 41.4 MPa (6000 psi)', [near(bot({}).asReq1, 155.8846, 1e-3), bot({fc: 41.4}).fcOk, bot({fc: 45}).fcOk], [true, true, false]);
  check('deep beam classification (9.9.1.1): ln 3 m <= 4h = 4 m is deep; ln 5 m is not by length; a concentrated load at 1.5 m <= 2h = 2 m makes it deep; 2.5 m does not', [dep({}).byLength, dep({}).deep, dep({ln: 5}).byLength, dep({ln: 5}).deep, dep({ln: 5, av: 1.5}).byLoad, dep({ln: 5, av: 1.5}).deep, dep({ln: 5, av: 2.5}).deep, dep({ln: 4}).byLength], [true, true, false, false, true, true, false, true]);
  check('dimensional limit (9.9.2.1): phi 0.83 sqrt(30) x 300 x 900 / 1000 = 0.75 x 0.83 x 5.4772 x 270 = 920.58 kN; Vu 800 passes and 1000 fails', [near(dep({}).vmax, 920.5847, 1e-3), dep({}).okV, dep({vu: 1000}).okV, near(dep({fc: 40}).vmax, 0.6225 * Math.sqrt(40) * 270, 1e-6)], [true, true, false, true]);
  check('distributed reinforcement (9.9.3.1): 0.0025 x 300 x 150 = 112.5 mm2 each way passes with 150; 100 mm2 fails; at 200 mm spacing 150 mm2 is just enough but 200 mm exceeds min(d / 5 = 180, 300) = 180', [near(dep({}).avMin, 112.5, 1e-9), near(dep({}).avhMin, 112.5, 1e-9), dep({}).okAv, dep({av1: 100}).okAv, dep({avh: 100}).okAvh, near(dep({s: 200}).avMin, 150, 1e-9), dep({s: 200}).okAv, near(dep({}).sMax, 180, 1e-9), dep({}).okS, dep({s: 200}).okS, dep({s2: 200}).okS2, near(dep({d: 2000}).sMax, 300, 1e-9)], [true, true, true, false, false, true, true, true, true, false, false, true]);
  check('minimum tension steel (9.9.3.2 with 9.6.1.2 in SI): max(0.25 sqrt(30) / 420 = 0.003260, 1.4 / 420 = 0.003333) x 270 000 = 900 mm2; at fc 60: 0.25 sqrt(60) / 420 x 270 000 = 1244.9 mm2 governs', [near(dep({}).asMin, 900, 1e-6), dep({}).okAs, near(dep({fc: 60}).asMin, 0.25 * Math.sqrt(60) / 420 * 270000, 1e-6), dep({fc: 60, as: 1000}).okAs, dep({as: 800}).okAs], [true, true, true, false, false]);
}
let tt;
w.renderCalc('acistm'); w.calcResult('acistm');
tt = txt(w, 'xat_results');
check('the default page (uniform strut) shows fce 25.50 MPa, Fns 1530.0 kN, phi Fns 1147.5 kN, width 174.3 mm and the 🔴 note', [tt.includes('25.50 MPa'), tt.includes('1530.0 kN'), tt.includes('1147.5 kN'), tt.includes('174.3 mm'), tt.includes('🔴'), !tt.includes('✘'), doc.getElementById('xat_g0').style.display === '', doc.getElementById('xat_g1').style.display === 'none'], [true, true, true, true, true, true, true, true]);
set('xat_m', '1'); w.calcResult('acistm'); tt = txt(w, 'xat_results');
check('the node page shows fce 15.30 MPa, Fnn 688.5 kN and phi Fnn 516.4 kN', [tt.includes('15.30 MPa'), tt.includes('688.5 kN'), tt.includes('516.4 kN'), doc.getElementById('xat_g1').style.display === '', doc.getElementById('xat_g0').style.display === 'none'], [true, true, true, true, true]);
set('xat_m', '2'); w.calcResult('acistm'); tt = txt(w, 'xat_results');
check('the tie page shows Fnt 756.0 kN, phi Fnt 567.0 kN, 1587 mm2 and Asc 386 mm2', [tt.includes('756.0 kN'), tt.includes('567.0 kN'), tt.includes('1587 mm²'), tt.includes('386 mm²')], [true, true, true, true]);
set('xat_m', '3'); w.calcResult('acistm'); tt = txt(w, 'xat_results');
check('the bottle page shows the sum 0.0052 and the first-direction area 156 mm2', [tt.includes('0.0052'), tt.includes('156 mm²'), doc.getElementById('xat_g3').style.display === ''], [true, true, true]);
set('xat_m', '4'); w.calcResult('acistm'); tt = txt(w, 'xat_results');
check('the deep beam page shows 920.6 kN, 900 mm2 and the deep classification', [tt.includes('920.6 kN'), tt.includes('900 mm²'), tt.includes('عميق'), doc.getElementById('xat_g4').style.display === ''], [true, true, true, true]);
check('other reference codes open acistm too', others('acistm', 'xat_results'), [true, true, true]);
}
// ---------- part 305: ACI 318-14 durability and cover (`aciexp`: exposure classes and mix requirements 19.3 (Table 19.3.1.1, Table 19.3.2.1, Table 19.3.3.1, 19.3.3.3), specified concrete cover 20.6.1.3 (Tables 20.6.1.3.1 to 20.6.1.3.3, 20.6.1.3.4 bundles) and corrosive environments 20.6.1.4) ----------
{
w = boot('ae'); doc = w.document;
const J = x => JSON.parse(w.eval('JSON.stringify(' + x + ')'));
const set = (id, val) => { w.document.getElementById(id).value = val; };
const mix = o => J('xauMix(' + JSON.stringify(Object.assign({f: 0, s: 0, w: 0, c: 0, kind: 0, pre: 0, agg: 2, fcIn: 0, wcIn: 0}, o)) + ')');
const cov = o => J('xauCover(' + JSON.stringify(Object.assign({cons: 0, exp: 1, mem: 2, kind: 0, db: 16, nb: 1, corr: 0}, o)) + ')');
const near = (a, b, e) => Math.abs(a - b) <= (e || 0.001);
{
  check('no exposure (F0, S0, W0, C0): no w/cm limit, fc 17 MPa (2500 psi), no air requirement, chloride 1.00 %', [mix({}).wc, mix({}).fc, mix({}).air, mix({}).cl], [null, 17, null, 1]);
  check('freezing and thawing (Table 19.3.2.1): F1 0.55 / 24 MPa, F2 0.45 / 31 MPa, F3 0.40 / 35 MPa; plain concrete in F3 0.45 / 31 MPa', [mix({f: 1}).wc, mix({f: 1}).fc, mix({f: 2}).wc, mix({f: 2}).fc, mix({f: 3}).wc, mix({f: 3}).fc, mix({f: 3, kind: 2}).wc, mix({f: 3, kind: 2}).fc], [0.55, 24, 0.45, 31, 0.4, 35, 0.45, 31]);
  check('sulfate classes: S1 0.50 / 28, S2 0.45 / 31, S3 0.45 / 31; water W1 0.50 / 28; corrosion C2 0.40 / 35 and C1 has no w/cm limit with 17 MPa', [mix({s: 1}).wc, mix({s: 1}).fc, mix({s: 2}).wc, mix({s: 2}).fc, mix({s: 3}).wc, mix({s: 3}).fc, mix({w: 1}).wc, mix({w: 1}).fc, mix({c: 2}).wc, mix({c: 2}).fc, mix({c: 1}).wc, mix({c: 1}).fc], [0.5, 28, 0.45, 31, 0.45, 31, 0.5, 28, 0.4, 35, null, 17]);
  check('the most restrictive requirement governs (19.3.2.1): W1 with S2 gives 0.45 and 31 MPa from S2 (the commentary example); F2 with C2 gives 0.40 from C2 and 35 from C2; F3 with W1 and S1 gives 0.40 (F3) and 35 (F3)', [mix({w: 1, s: 2}).wc, mix({w: 1, s: 2}).fc, mix({w: 1, s: 2}).wcCls, mix({f: 2, c: 2}).wc, mix({f: 2, c: 2}).wcCls, mix({f: 2, c: 2}).fc, mix({f: 3, w: 1, s: 1}).wc, mix({f: 3, w: 1, s: 1}).wcCls, mix({f: 3, w: 1, s: 1}).fc], [0.45, 31, 'S2', 0.4, 'C2', 35, 0.4, 'F3', 35]);
  check('lightweight concrete: the w/cm limits do not apply (footnote 1) so a 0.60 proposal is not rejected', [mix({f: 2, kind: 1}).wcApplies, mix({f: 2, wcIn: 0.6}).okWc, mix({f: 2, kind: 1, wcIn: 0.6}).okWc, mix({f: 2, wcIn: 0.45}).okWc, mix({f: 2, wcIn: 0.4}).okWc], [false, false, true, true, true]);
  check('strength proposal: F2 needs 31 MPa so 30 fails and 31 passes; C2 needs 35', [mix({f: 2, fcIn: 30}).okFc, mix({f: 2, fcIn: 31}).okFc, mix({c: 2, fcIn: 31}).okFc, mix({c: 2, fcIn: 35}).okFc, mix({f: 2, fcIn: 0}).okFc], [false, true, false, true, true]);
  check('air content (Table 19.3.3.1): F1 by aggregate size 9.5, 12.5, 19, 25, 37.5, 50, 75 mm = 6, 5.5, 5, 4.5, 4.5, 4, 3.5; F2 and F3 = 7.5, 7, 6, 6, 5.5, 5, 4.5', [0, 1, 2, 3, 4, 5, 6].map(i => mix({f: 1, agg: i}).air).concat([0, 1, 2, 3, 4, 5, 6].map(i => mix({f: 2, agg: i}).air), [mix({f: 3, agg: 0}).air]), [6, 5.5, 5, 4.5, 4.5, 4, 3.5, 7.5, 7, 6, 6, 5.5, 5, 4.5, 7.5]);
  check('air reduction of one point for fc above 35 MPa (19.3.3.3): 40 MPa gives 5 for F2 at 19 mm; 35 MPa keeps 6; 36 reduces; no entrained air in F0', [mix({f: 2, fcIn: 40}).airMin, mix({f: 2, fcIn: 40}).airRed, mix({f: 2, fcIn: 35}).airMin, mix({f: 2, fcIn: 36}).airMin, mix({f: 0, fcIn: 40}).airMin, mix({f: 1, agg: 0}).airMin], [5, true, 6, 5, null, 6]);
  check('chloride limits (Table 19.3.2.1): nonprestressed C0 1.00, C1 0.30, C2 0.15; prestressed 0.06 for every class', [0, 1, 2].map(c => mix({c: c}).cl).concat([0, 1, 2].map(c => mix({c: c, pre: 1}).cl)), [1, 0.3, 0.15, 0.06, 0.06, 0.06]);
  check('cement for sulfate classes: S1 Type II with (MS) blends, S2 Type V with (HS), S3 Type V plus pozzolan or slag; calcium chloride permitted in S0 and S1 only', [mix({s: 1}).cement[0], mix({s: 2}).cement[0], mix({s: 3}).cement[0], mix({s: 2}).cement[3], mix({s: 3}).cement[3], mix({s: 1}).cement[3], mix({s: 0}).cement[3]], ['النوع II', 'النوع V', 'النوع V مع بوزولان أو إسمنت خبث', 'غير مسموح', 'غير مسموح', 'بلا قيد', 'بلا قيد']);
  check('cover cast-in-place nonprestressed (Table 20.6.1.3.1): against ground 75; exposed 50 for bars 19 mm and larger and 40 for 16 mm and smaller', [cov({exp: 0}).cover, cov({exp: 1, db: 16}).cover, cov({exp: 1, db: 19}).cover, cov({exp: 1, db: 25}).cover, cov({exp: 1, db: 10, kind: 1}).cover], [75, 40, 50, 50, 40]);
  check('not exposed: slabs, joists and walls 20 mm (bars to 36 mm) and 40 mm for 43 and 57 mm bars; beams, columns, pedestals and ties 40 mm for everything', [cov({exp: 2, mem: 0, db: 16}).cover, cov({exp: 2, mem: 0, db: 36}).cover, cov({exp: 2, mem: 0, db: 43}).cover, cov({exp: 2, mem: 1, db: 57}).cover, cov({exp: 2, mem: 1, db: 20}).cover, cov({exp: 2, mem: 2, db: 16}).cover, cov({exp: 2, mem: 2, db: 10, kind: 1}).cover], [20, 20, 40, 40, 20, 40, 40]);
  check('cast-in-place prestressed (Table 20.6.1.3.2): ground 75; exposed 25 for slabs, joists and walls and 40 for other members; not exposed 20 for slabs and walls, beams 40 for primary steel and 25 for stirrups, ties and hoops', [cov({cons: 1, exp: 0}).cover, cov({cons: 1, exp: 1, mem: 0}).cover, cov({cons: 1, exp: 1, mem: 1}).cover, cov({cons: 1, exp: 1, mem: 2}).cover, cov({cons: 1, exp: 2, mem: 0}).cover, cov({cons: 1, exp: 2, mem: 2, kind: 0}).cover, cov({cons: 1, exp: 2, mem: 2, kind: 1}).cover, cov({cons: 1, exp: 2, mem: 2, kind: 2, db: 15}).cover], [75, 25, 25, 40, 20, 40, 25, 40]);
  check('precast exposed (Table 20.6.1.3.3): walls 20 mm (40 mm for 43 and 57 mm bars or tendons above 38 mm); other members 30 (16 mm and smaller), 40 (19 to 36 mm bars, tendons above 16 to 38 mm) and 50 (43 and 57 mm bars, tendons above 38 mm)', [cov({cons: 2, exp: 1, mem: 1, db: 16}).cover, cov({cons: 2, exp: 1, mem: 1, db: 43}).cover, cov({cons: 2, exp: 1, mem: 1, kind: 2, db: 40}).cover, cov({cons: 2, exp: 1, mem: 1, kind: 2, db: 15}).cover, cov({cons: 2, exp: 1, mem: 0, db: 16}).cover, cov({cons: 2, exp: 1, mem: 0, db: 25}).cover, cov({cons: 2, exp: 1, mem: 2, db: 43}).cover, cov({cons: 2, exp: 1, mem: 0, kind: 2, db: 20}).cover, cov({cons: 2, exp: 1, mem: 0, kind: 2, db: 15}).cover, cov({cons: 2, exp: 1, mem: 0, kind: 2, db: 40}).cover], [20, 40, 40, 20, 30, 40, 50, 40, 30, 50]);
  check('precast not exposed: slabs and walls 15 mm for bars to 36 mm, 30 mm for 43 and 57 mm bars or tendons above 38 mm and 20 mm for tendons to 38 mm; beams primary steel max(db, 15) not above 40 and 10 mm for stirrups and ties', [cov({cons: 2, exp: 2, mem: 0, db: 16}).cover, cov({cons: 2, exp: 2, mem: 0, db: 43}).cover, cov({cons: 2, exp: 2, mem: 1, kind: 2, db: 15}).cover, cov({cons: 2, exp: 2, mem: 0, kind: 2, db: 40}).cover, cov({cons: 2, exp: 2, mem: 2, db: 10}).cover, cov({cons: 2, exp: 2, mem: 2, db: 25}).cover, cov({cons: 2, exp: 2, mem: 2, db: 57}).cover, cov({cons: 2, exp: 2, mem: 2, kind: 1, db: 10}).cover], [15, 30, 20, 30, 15, 25, 40, 10]);
  check('precast has no ground-cast row: it uses the exposed row and flags it', [cov({cons: 2, exp: 0, mem: 0, db: 25}).cover, cov({cons: 2, exp: 0, mem: 0, db: 25}).note], [40, 'precast']);
  check('bundled bars (20.6.1.3.4): three 25 mm bars give an equivalent 43.30 mm and cover min(43.30, 50) = 43.30 above the 40 mm of the table; four 32 mm bars give 64 mm and 50 mm; cast against ground stays 75', [near(cov({exp: 2, mem: 2, db: 25, nb: 3}).deq, 43.30127, 1e-4), near(cov({exp: 2, mem: 2, db: 25, nb: 3}).cover, 43.30127, 1e-4), near(cov({exp: 2, mem: 2, db: 32, nb: 4}).cover, 50, 1e-9), cov({exp: 0, db: 32, nb: 4}).cover, cov({exp: 2, mem: 2, db: 25, nb: 1}).bundle], [true, true, true, 75, 0]);
  check('corrosive environment (20.6.1.4.2): prestressed members with Class T or C get 1.5 times: cast-in-place beam 40 becomes 60, precast beam 25 becomes 37.5; nonprestressed is unchanged', [cov({cons: 1, exp: 2, mem: 2, corr: 1}).cover, cov({cons: 2, exp: 2, mem: 2, db: 25, corr: 1}).cover, cov({cons: 0, exp: 2, mem: 2, corr: 1}).cover, cov({cons: 1, exp: 2, mem: 2, corr: 1}).corr, cov({cons: 0, corr: 1}).corr], [60, 37.5, 40, true, false]);
}
let tt;
w.renderCalc('aciexp'); w.calcResult('aciexp');
tt = txt(w, 'xau_results');
check('the default page (no exposure) shows 17 MPa, chloride 1.00 % and the 🔴 note and the mix group only', [tt.includes('17 MPa'), tt.includes('1.00 %'), tt.includes('🔴'), doc.getElementById('xau_g0').style.display === '', doc.getElementById('xau_g1').style.display === 'none'], [true, true, true, true, true]);
set('xau_f', '2'); set('xau_c', '2'); set('xau_p', '1'); w.calcResult('aciexp'); tt = txt(w, 'xau_results');
check('F2 with C2 prestressed shows 0.40 (C2), 35 MPa, air 6.0 % and chloride 0.06 %', [tt.includes('0.40'), tt.includes('35 MPa'), tt.includes('6.0 %'), tt.includes('0.06 %')], [true, true, true, true]);
set('xau_m', '1'); w.calcResult('aciexp'); tt = txt(w, 'xau_results');
check('the cover page shows 40 mm for the default cast-in-place beam and shows its group', [tt.includes('40 mm'), doc.getElementById('xau_g1').style.display === '', doc.getElementById('xau_g0').style.display === 'none'], [true, true, true]);
set('xau_cs', '1'); set('xau_cr', '1'); w.calcResult('aciexp'); tt = txt(w, 'xau_results');
check('prestressed in a corrosive environment shows 60 mm and the factor 1.5', [tt.includes('60 mm'), tt.includes('1.5')], [true, true]);
check('other reference codes open aciexp too', others('aciexp', 'xau_results'), [true, true, true]);
}
console.log(fail ? `\n${fail} FAIL` : '\nall ok');
if (errors.length) { console.log('jsdom errors:', errors.slice(0, 5)); fail++; }
process.exit(fail ? 1 : 0);
