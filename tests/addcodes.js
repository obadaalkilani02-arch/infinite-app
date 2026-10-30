// Codes added from the library folder `standars\إضافات` (parts 94 onward): ICC IECC 2021 (envelope, pipe insulation, lighting power), ICC IFC 2018 (fire flow and hydrants, means of egress),
// Eurocode 8 (spectrum and lateral force), Eurocode 2 and ACI 318M-08 (rectangular beam).
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

// ---------- part 94: IECC 2021 commercial envelope (`ieccenv`: Tables C402.1.4 and C402.4, C402.4.1) ----------
{
w = boot('intl'); doc = w.document;
const ie = o => w.eval('ieEnv(' + JSON.stringify(Object.assign({zone: '4', grp: 'other', comp: 'roofAbove', val: 0, fk: 'fixed', pf: 0.3, fu: 0, fs: 0, gwall: 0, vfen: 0, roof: 0, sky: 0, daylight: false}, o)) + ')');
check('Table C402.1.4, zone 4 all other: roof above deck 0.032, metal-building roof 0.035, attic roof 0.021, mass wall 0.104, metal-building wall 0.052, metal-framed wall 0.064, wood wall 0.064, below-grade wall C 0.119, mass floor 0.057, joist floor 0.033', ['roofAbove', 'roofMetal', 'roofAttic', 'wallMass', 'wallMetalBldg', 'wallMetalFramed', 'wallWood', 'wallBelow', 'floorMass', 'floorJoist'].map(c => ie({comp: c}).max), [0.032, 0.035, 0.021, 0.104, 0.052, 0.064, 0.064, 0.119, 0.057, 0.033]);
check('... unheated slab F 0.52, heated slab F 0.62, swinging door 0.37, nonswinging door 0.31, garage door 0.31', ['slabUnheated', 'slabHeated', 'doorSwing', 'doorNonswing', 'doorGarage'].map(c => ie({comp: c}).max), [0.52, 0.62, 0.37, 0.31, 0.31]);
check('Group R column differs from all other: zone 4 mass wall 0.090 vs 0.104; zone 0 and 1 roof 0.039 vs 0.048; zone 8 unheated slab 0.424 vs 0.434', [ie({grp: 'R', comp: 'wallMass'}).max, ie({zone: '0', grp: 'R'}).max, ie({zone: '0'}).max, ie({zone: '8', grp: 'R', comp: 'slabUnheated'}).max, ie({zone: '8', comp: 'slabUnheated'}).max], [0.09, 0.039, 0.048, 0.424, 0.434]);
check('the kind of each limit: roof and walls U, below-grade wall C, slab F', [ie({}).kind, ie({comp: 'wallBelow'}).kind, ie({comp: 'slabHeated'}).kind], ['U', 'C', 'F']);
check('compliance flags: U 0.032 meets the 0.032 roof limit, 0.033 does not, nothing entered gives none', [ie({val: 0.032}).ok, ie({val: 0.033}).ok, ie({}).ok], [true, false, null]);
check('Table C402.4: zone 6 fixed 0.34, operable 0.42, entrance door 0.63, skylight U 0.50 and SHGC 0.40; zone 0 and 1: 0.50, 0.62, 0.83, 0.70 and 0.30; zone 8 fixed 0.26, skylight 0.41 with no SHGC limit', [ie({zone: '6'}).uMax, ie({zone: '6', fk: 'operable'}).uMax, ie({zone: '6', fk: 'door'}).uMax, ie({zone: '6', fk: 'sky'}).uMax, ie({zone: '6', fk: 'sky'}).sMax, ie({zone: '0'}).uMax, ie({zone: '0', fk: 'operable'}).uMax, ie({zone: '0', fk: 'door'}).uMax, ie({zone: '0', fk: 'sky'}).uMax, ie({zone: '0', fk: 'sky'}).sMax, ie({zone: '8'}).uMax, ie({zone: '8', fk: 'sky'}).uMax, ie({zone: '7', fk: 'sky'}).sMax], [0.34, 0.42, 0.63, 0.5, 0.4, 0.5, 0.62, 0.83, 0.7, 0.3, 0.26, 0.41, null]);
check('SHGC by projection factor (zone 4, fixed): PF below 0.2 = 0.36, 0.2 to under 0.5 = 0.43, 0.5 or more = 0.58; operable windows are lower: 0.33, 0.40, 0.53; zone 0 PF below 0.2 fixed 0.23; entrance doors have no SHGC limit', [ie({pf: 0.1}).sMax, ie({pf: 0.2}).sMax, ie({pf: 0.5}).sMax, ie({pf: 0.1, fk: 'operable'}).sMax, ie({pf: 0.3, fk: 'operable'}).sMax, ie({pf: 0.9, fk: 'operable'}).sMax, ie({zone: '0', pf: 0.1}).sMax, ie({fk: 'door'}).sMax], [0.36, 0.43, 0.58, 0.33, 0.4, 0.53, 0.23, null]);
check('glass flags: U 0.36 passes and 0.37 fails; SHGC 0.43 passes and 0.44 fails at PF 0.3', [ie({fu: 0.36}).uOk, ie({fu: 0.37}).uOk, ie({fs: 0.43}).sOk, ie({fs: 0.44}).sOk], [true, false, true, false]);
check('vertical glazing is limited to 30 % of the gross wall; 40 % with daylight controls in zones 0 to 6 but not in zones 7 and 8: 30 of 100 passes, 31 fails, 40 with daylight (zone 4) passes, 41 fails, 35 with daylight in zone 7 fails', [ie({gwall: 100, vfen: 30}).vOk, ie({gwall: 100, vfen: 31}).vOk, ie({gwall: 100, vfen: 40, daylight: true}).vOk, ie({gwall: 100, vfen: 41, daylight: true}).vOk, ie({zone: '7', gwall: 100, vfen: 35, daylight: true}).vOk, ie({zone: '7', daylight: true}).maxV, ie({zone: '6', daylight: true}).maxV], [true, false, true, false, false, 30, 40]);
check('skylights are limited to 3 % of the gross roof: 3 of 100 passes, 3.1 fails', [ie({roof: 100, sky: 3}).sOkA, ie({roof: 100, sky: 3.1}).sOkA, ie({}).sOkA], [true, false, null]);
w.renderCalc('ieccenv'); w.calcResult('ieccenv');
let tt = txt(w, 'ie_results');
check('the page opens with zone 4: 0.032 for the roof (R = 31.25), glass U 0.36 and SHGC 0.43, and the 🔴 note', [tt.includes('0.032'), tt.includes('31.25'), tt.includes('0.36'), tt.includes('0.43'), tt.includes('🔴')], [true, true, true, true, true]);
setv(w, 'ie_z', '8'); setv(w, 'ie_c', 'slabUnheated'); setv(w, 'ie_v', 0.4); w.calcResult('ieccenv');
check('zone 8 unheated slab with F 0.4 passes the 0.434 limit and shows W/(m·K)', [txt(w, 'ie_results').includes('0.434'), txt(w, 'ie_results').includes('W/(m·K)'), txt(w, 'ie_results').includes('✔')], [true, true, true]);
check('other reference codes open it too', others('ieccenv', 'ie_results'), [true, true, true]);
}
// ---------- part 95: IECC 2021 pipe insulation (`ieccpipe`: Table C403.12.3) ----------
{
w = boot('intl'); doc = w.document;
const ip = o => w.eval('ipCalc(' + JSON.stringify(Object.assign({tF: 150, d: 2, K: 0, part: false, buried: false}, o)) + ')');
check('141 - 200 °F row (conductivity 0.25 - 0.29): under 1 in = 1.5, 1 to under 1.5 in = 1.5, 1.5 to under 4 = 2.0, 4 to under 8 = 2.0, 8 or more = 2.0 in', [0.5, 1, 1.5, 2, 4, 6, 8, 12].map(d => ip({d}).t0), [1.5, 1.5, 2, 2, 2, 2, 2, 2]);
check('> 350 °F row: 4.5, 5.0, 5.0, 5.0, 5.0; 251 - 350 °F row: 3.0, 4.0, 4.5, 4.5, 4.5; 201 - 250 °F row: 2.5, 2.5, 2.5, 3.0, 3.0', [[400, 0.5], [400, 1], [400, 2], [400, 6], [400, 10], [300, 0.5], [300, 1], [300, 2], [300, 6], [300, 10], [220, 0.5], [220, 1], [220, 2], [220, 6], [220, 10]].map(a => ip({tF: a[0], d: a[1]}).t0), [4.5, 5, 5, 5, 5, 3, 4, 4.5, 4.5, 4.5, 2.5, 2.5, 2.5, 3, 3]);
check('105 - 140 °F row: 1.0, 1.0, 1.5, 1.5, 1.5; 40 - 60 °F row: 0.5, 0.5, 1.0, 1.0, 1.0; below 40 °F row: 0.5, 1.0, 1.0, 1.0, 1.5', [[120, 0.5], [120, 1], [120, 2], [120, 6], [120, 10], [50, 0.5], [50, 1], [50, 2], [50, 6], [50, 10], [30, 0.5], [30, 1], [30, 2], [30, 6], [30, 10]].map(a => ip({tF: a[0], d: a[1]}).t0), [1, 1, 1.5, 1.5, 1.5, 0.5, 0.5, 1, 1, 1, 0.5, 1, 1, 1, 1.5]);
check('the band edges: 350 °F falls in the 251 - 350 row, 250 in the 201 - 250 row, 105 in the 105 - 140 row, 140 in the 105 - 140 row, 141 in the 141 - 200 row; 60 and 40 in the 40 - 60 row', [350, 250, 200, 141, 140, 105, 60, 40, 39].map(t => ip({tF: t}).b), [1, 2, 3, 3, 4, 4, 5, 5, 6]);
check('fluid between 60 and 105 °F is not covered by the table', [ip({tF: 80}).none, ip({tF: 61}).none, ip({tF: 104}).none, ip({tF: 105}).none], [true, true, true, false]);
check('note a: pipes under 1.5 in inside partitions take 1 in less (minimum 1 in): 1.5 -> 1.0 at 150 °F and 1 in, 1.0 stays 1.0 at 120 °F, 2 in pipes unchanged; note c: buried heating pipes 1.5 in less (minimum 1): 2.0 -> 1.0 at 150 °F, 5.0 -> 3.5 at 400 °F, cooling pipes unchanged', [ip({d: 1, part: true}).t, ip({tF: 120, d: 1, part: true}).t, ip({part: true}).t, ip({buried: true}).t, ip({tF: 400, buried: true}).t, ip({tF: 50, buried: true}).t], [1, 1, 2, 1, 3.5, 1]);
check('note b: K above the table range increases the thickness T = r((1 + t/r)^(K/k) - 1): 2 in pipe (r = 1.1875 in), t = 2.0, K = 0.35 over k = 0.29 gives 2.72 in; a lower K reduces it; K inside the range leaves it unchanged', [+ip({K: 0.35}).adj.toFixed(2), ip({K: 0.35}).adjusted, ip({K: 0.27}).adjusted, ip({K: 0.27}).adj, ip({K: 0.2}).adj < 2, ip({K: 0.2}).adjusted], [2.72, true, false, 2, true, true]);
w.renderCalc('ieccpipe'); w.calcResult('ieccpipe');
let tt = txt(w, 'ip_results');
check('the page opens at 140 - 200 °F, 2 in: 2.0 in (50.8 mm)', [tt.includes('2.00 in'), tt.includes('50.8 mm'), tt.includes('🔴')], [true, true, true]);
check('other reference codes open it too', others('ieccpipe', 'ip_results'), [true, true, true]);
}
// ---------- part 96: IECC 2021 interior lighting power (`iecclpd`: Table C405.3.2(1) and (2), equation 4-11) ----------
{
w = boot('intl'); doc = w.document;
const ba = n => w.eval('IL_BA.findIndex(e => e[0] === ' + JSON.stringify(n) + ')'), ss = n => w.eval('IL_SS.findIndex(e => e[0] === ' + JSON.stringify(n) + ')');
const il = o => w.eval('ilCalc(' + JSON.stringify(Object.assign({m: 'ba', unit: 'ft', conn: 0, rA1: 0, rA2: 0, rA3: 0, rA4: 0, unfA: 0, unfW: 0, rows: []}, o)) + ')');
check('Table C405.3.2(1) has 32 building types and C405.3.2(2) 95 space types', [w.eval('IL_BA.length'), w.eval('IL_SS.length')], [32, 95]);
check('building area method: Office 0.64 W/ft2, Parking garage 0.18 W/ft2', [w.eval('IL_BA[' + ba('Office') + '][1]'), w.eval('IL_BA[' + ba('Parking garage') + '][1]')], [0.64, 0.18]);
check('space-by-space: Office open plan 0.61, Storage room 0.38, Operating room 2.26 (as printed under healthcare), Restroom otherwise 0.63', [w.eval('IL_SS[' + ss('Office — open plan') + '][1]'), w.eval('IL_SS[' + ss('Storage room') + '][1]'), w.eval('IL_SS[' + ss('Healthcare — operating room') + '][1]'), w.eval('IL_SS[' + ss('Restroom — otherwise') + '][1]')], [0.61, 0.38, 2.26, 0.63]);
let r = il({rows: [{i: ba('Office'), area: 1000}, {i: ba('Parking garage'), area: 500}]});
check('1000 ft2 of office + 500 ft2 of garage = 640 + 90 = 730 W (0.487 W/ft2)', [r.total, +r.avg.toFixed(3), r.area], [730, 0.487, 1500]);
r = il({unit: 'm', rows: [{i: ba('Office'), area: 100}]});
check('metric: 100 m2 of office = 1076.39 ft2 x 0.64 = 688.9 W', [+r.total.toFixed(1), +r.area.toFixed(2)], [688.9, 1076.39]);
r = il({m: 'ss', rows: [{i: ss('Office — open plan'), area: 1000}], rA1: 1000});
check('retail highlighting 4-11: 1000 ft2 of category 1 or 2 = 1000 W + 0.45 x 1000 = 1450 W extra', [r.add, r.total], [1450, 610 + 1450]);
r = il({m: 'ss', rows: [{i: ss('Storage room'), area: 100}], rA1: 500, rA3: 100, rA4: 50});
check('categories combine: 1000 + 0.45 x 500 + 1.05 x 100 + 1.87 x 50 = 1423.5 W (the 1000 W is added once)', [r.add], [1423.5]);
check('retail additional power is only for the space-by-space method; unfinished space is the lesser of the connected power and 0.2 W/ft2: 1000 ft2 with 500 W connected -> 200; with 100 W -> 100', [il({rows: [{i: ba('Office'), area: 100}], rA1: 1000}).add, il({m: 'ss', rows: [{i: ss('Storage room'), area: 100}], unfA: 1000, unfW: 500}).unf, il({m: 'ss', rows: [{i: ss('Storage room'), area: 100}], unfA: 1000, unfW: 100}).unf, il({m: 'ss', rows: [{i: ss('Storage room'), area: 100}], unfA: 1000}).unf], [0, 200, 100, 200]);
check('compliance: 730 W allowed, 730 W connected passes, 731 W fails', [il({conn: 730, rows: [{i: ba('Office'), area: 1000}, {i: ba('Parking garage'), area: 500}]}).ok, il({conn: 731, rows: [{i: ba('Office'), area: 1000}, {i: ba('Parking garage'), area: 500}]}).ok], [true, false]);
w.renderCalc('iecclpd'); w.calcResult('iecclpd');
let tt = txt(w, 'il_results');
check('the page opens with 500 m2 of office and 100 m2 of garage (building area method): 3638 W, 0.56 W/ft2', [tt.includes('3638'), tt.includes('0.56 W/ft²'), tt.includes('🔴')], [true, true, true]);
setv(w, 'il_m', 'ss'); w.ilMethod(); w.calcResult('iecclpd');
tt = txt(w, 'il_results');
check('switching to the space-by-space method rebuilds the rows (Office open plan 0.61 and Storage room 0.38)', [tt.includes('Office — open plan'), tt.includes('0.38')], [true, true]);
check('other reference codes open it too', others('iecclpd', 'il_results'), [true, true, true]);
}
// ---------- part 97: IFC 2018 fire flow and hydrants (`ifcflow`: Tables B105.1(1), B105.1(2), B105.2 and C102.1) ----------
{
w = boot('intl'); doc = w.document;
const ff = o => w.eval('ifFlow(' + JSON.stringify(Object.assign({area: 20000, unit: 'ft', col: 3, dwelling: false, spr: 'none', dead: false}, o)) + ')');
check('Table B105.1(2) has 27 rows, 1500 to 8000 gpm: 1500 - 2000 gpm for 2 h, 2000 - 3000 gpm for 2 h (up to 3000), 3250 - 4000 for 3 h, 4250 and above for 4 h', [w.eval('IF_FF.length'), w.eval('IF_FF[0].gpm'), w.eval('IF_FF[26].gpm'), w.eval('IF_FF.filter(r => r.h === 2).length'), w.eval('IF_FF.filter(r => r.h === 3).length'), w.eval('IF_FF.filter(r => r.h === 4).length')], [27, 1500, 8000, 7, 4, 16]);
check('type IIB / IIIB (column 4): 5,900 ft2 = 1500 gpm; 5,901 = 1750; 21,800 = 3000 gpm for 2 h; 21,801 = 3250 gpm for 3 h; 138,300 = 7750; above = 8000 gpm for 4 h', [5900, 5901, 21800, 21801, 138300, 138301].map(a => ff({area: a}).gpm), [1500, 1750, 3000, 3250, 7750, 8000]);
check('... durations: 2 h up to 3000 gpm, 3 h from 3250, 4 h from 4250', [ff({area: 21800}).h, ff({area: 21801}).h, ff({area: 37900}).h, ff({area: 37901}).h], [2, 3, 3, 4]);
check('other construction types: type IA / IB (first column) 22,700 ft2 = 1500 gpm; IIA / IIIA 12,700 = 1500; IV / V-A 8,200 = 1500; V-B 3,600 = 1500 and 3,601 = 1750', [ff({area: 22700, col: 0}).gpm, ff({area: 22701, col: 0}).gpm, ff({area: 12700, col: 1}).gpm, ff({area: 8200, col: 2}).gpm, ff({area: 3600, col: 4}).gpm, ff({area: 3601, col: 4}).gpm], [1500, 1750, 1500, 1500, 1500, 1750]);
check('metric input: 2000 m2 (21,529 ft2) of type IIB = 3000 gpm for 2 h = 360,000 gal', [ff({area: 2000, unit: 'm'}).gpm, ff({area: 2000, unit: 'm'}).vol], [3000, 360000]);
check('Table C102.1 (gpm / hydrants / spacing ft / distance ft): 1500 and 1750 = 1, 500, 250; 2000 = 2, 450, 225; 2750 = 3, 450, 225; 3000 and 3250 = 3, 400, 225; 4000 = 4, 350, 210; 4250 and 5000 = 5, 300, 180; 5250 = 6, 300, 180; 5750 = 6, 250, 150; 7000 = 7, 250, 150', [5900, 7900, 9800, 18400, 21800, 21801, 37900, 42700, 58600, 65400, 77000, 113200].map(a => { const r = ff({area: a}); return [r.gpm, r.n, r.sp, r.dist].join('/'); }), ['1500/1/500/250', '1750/1/500/250', '2000/2/450/225', '2750/3/450/225', '3000/3/400/225', '3250/3/400/225', '4000/4/350/210', '4250/5/300/180', '5000/5/300/180', '5250/6/300/180', '5750/6/250/150', '7000/7/250/150']);
check('above 7000 gpm one hydrant per 1000 gpm, 200 ft spacing and 120 ft distance: 8000 gpm = 8 hydrants', [ff({area: 200000}).n, ff({area: 200000}).sp, ff({area: 200000}).dist, ff({area: 200000}).more], [8, 200, 120, true]);
check('B105.2 with an NFPA 13 system: 25 % of the table value but not less than 1000 gpm: 3000 -> 1000 gpm (750 raised), 8000 -> 2000 gpm; with NFPA 13R at least 1500 gpm: 3000 -> 1500, 8000 -> 2000; the duration stays that of the table', [ff({area: 21800, spr: 'a'}).gpm, ff({area: 200000, spr: 'a'}).gpm, ff({area: 21800, spr: 'b'}).gpm, ff({area: 200000, spr: 'b'}).gpm, ff({area: 21800, spr: 'a'}).h, ff({area: 200000, spr: 'b'}).h], [1000, 2000, 1500, 2000, 2, 4]);
check('C102.1 spacing / distance +50 % with NFPA 13 and +25 % with 13R: 1000 gpm (1 hydrant, 500 ft, 250 ft) -> 750 ft / 375 ft; 1500 gpm with 13R -> 625 ft / 312.5 ft', [ff({area: 21800, spr: 'a'}).spA, ff({area: 21800, spr: 'a'}).dA, ff({area: 21800, spr: 'b'}).spA, ff({area: 21800, spr: 'b'}).dA], [750, 375, 625, 312.5]);
check('dead-end street: spacing -100 ft and distance -50 ft: 1500 gpm -> 400 ft / 200 ft', [ff({area: 5900, dead: true}).spA, ff({area: 5900, dead: true}).dA], [400, 200]);
check('Table B105.1(1) dwellings (R-3, R-4, townhouses): 3,600 ft2 or less = 1000 gpm for 1 h; with NFPA 13D 500 gpm for 0.5 h; above 3,600 ft2 the Table B105.1(2) value, or half of it for 1 h with NFPA 13D', [ff({area: 3000, dwelling: true}).gpm, ff({area: 3000, dwelling: true}).h, ff({area: 3000, dwelling: true, spr: 'd'}).gpm, ff({area: 3000, dwelling: true, spr: 'd'}).h, ff({area: 3601, dwelling: true}).gpm, ff({area: 4000, dwelling: true, spr: 'd'}).gpm, ff({area: 4000, dwelling: true, spr: 'd'}).h], [1000, 1, 500, 0.5, 1500, 750, 1]);
w.renderCalc('ifcflow'); w.calcResult('ifcflow');
let tt = txt(w, 'if_results');
check('the page opens with 2000 m2 type IIB: 3000 gpm, 2 h, 360000 gal, 3 hydrants and the 🔴 note', [tt.includes('3000 gpm'), tt.includes('360000 gal'), tt.includes('400 ft'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('ifcflow', 'if_results'), [true, true, true]);
}
// ---------- part 98: IFC 2018 means of egress (`ifcegress`: Tables 1004.5, 1006.3.2, 1017.2, 1005.3, 1011.2) ----------
{
w = boot('intl'); doc = w.document;
const SEAT = w.eval('IG_LOAD.length - 1');
const eg = o => w.eval('igCalc(' + JSON.stringify(Object.assign({rows: [{i: 13, n: 15000}], unit: 'ft', spr: 'none', voice: false, grpH: '', grp: 'B', travel: 0, balcony: 0, height: 0, oneStory: false}, o)) + ')');
check('Table 1004.5: business 150 ft2 per occupant, assembly standing 5, chairs only 7, tables and chairs 15, classroom 20, residential 200, mercantile sales 60, warehouse 500', ['أعمال — مكاتب', 'تجمع بلا مقاعد ثابتة — وقوف', 'تجمع بلا مقاعد ثابتة — كراسٍ مكثفة', 'تجمع بلا مقاعد ثابتة — طاولات وكراسٍ', 'تعليمي — صفوف', 'سكني', 'تجاري — صالات بيع', 'مستودعات'].map(n => w.eval('IG_LOAD.find(e => e[0] === ' + JSON.stringify(n) + ')[1]')), [150, 5, 7, 15, 20, 200, 60, 500]);
check('15,000 ft2 of business = 100 occupants (rounded up); 15,001 = 101; fixed seats count one each', [eg({}).load, eg({rows: [{i: 13, n: 15001}]}).load, eg({rows: [{i: SEAT, n: 240}]}).load], [100, 101, 240]);
check('metric area: 600 m2 of business (6,458 ft2) = 44 occupants', [eg({unit: 'm', rows: [{i: 13, n: 600}]}).load], [44]);
check('number of exits (1006.3.2): 500 occupants = 2, 501 = 3, 1000 = 3, 1001 = 4', [500, 501, 1000, 1001].map(n => eg({rows: [{i: SEAT, n}]}).exits), [2, 3, 3, 4]);
check('capacity factors: 0.3 in per occupant on stairways and 0.2 in on other components; 100 occupants = 30 in and 20 in; stairway minimum 44 in (36 in under 50 occupants): 100 -> 44 in', [eg({}).fs, eg({}).fo, eg({}).sw, eg({}).ow, eg({}).stairMin, eg({}).stair], [0.3, 0.2, 30, 20, 44, 44]);
check('under 50 occupants the stairway minimum is 36 in; 500 occupants need 150 in on stairways and 100 in on other components', [eg({rows: [{i: SEAT, n: 49}]}).stairMin, eg({rows: [{i: SEAT, n: 500}]}).sw, eg({rows: [{i: SEAT, n: 500}]}).ow], [36, 150, 100]);
check('with sprinklers and a voice alarm: 0.2 in and 0.15 in (500 occupants -> 100 in and 75 in); not with only one of them; not for group H or I-2', [eg({spr: 'a', voice: true, rows: [{i: SEAT, n: 500}]}).sw, eg({spr: 'a', voice: true, rows: [{i: SEAT, n: 500}]}).ow, eg({spr: 'a', voice: false}).fs, eg({spr: 'none', voice: true}).fs, eg({spr: 'a', voice: true, grpH: 'H'}).fs, eg({spr: 'a', voice: true, grpH: 'I2'}).fs], [100, 75, 0.3, 0.3, 0.3, 0.3]);
check('Table 1017.2 travel distance (unsprinklered / sprinklered, ft): A E M R 200/250; B 200/300; F-2 S-2 U 300/400; I-4 150/200; H-1 not permitted / 75; H-5 NP / 200', [['AEMR', 'none'], ['AEMR', 'a'], ['B', 'none'], ['B', 'a'], ['F2', 'none'], ['F2', 'b'], ['I4', 'none'], ['I4', 'a'], ['H1', 'none'], ['H1', 'a'], ['H5', 'a'], ['I1', 'a']].map(a => eg({grp: a[0], spr: a[1]}).lim), [200, 250, 200, 300, 300, 400, 150, 200, null, 75, 200, 250]);
check('F-1 and S-1: 250 ft with sprinklers, 400 ft only for a one-storey part with sprinklers 903.3.1.1 and a ceiling height of 24 ft or more; NFPA 13R or a lower ceiling keep 250', [eg({grp: 'F1S1', spr: 'a'}).lim, eg({grp: 'F1S1', spr: 'a', height: 24, oneStory: true}).lim, eg({grp: 'F1S1', spr: 'a', height: 23.9, oneStory: true}).lim, eg({grp: 'F1S1', spr: 'b', height: 30, oneStory: true}).lim, eg({grp: 'F1S1', spr: 'none', height: 30, oneStory: true}).lim], [250, 400, 250, 250, 200]);
check('a final exterior balcony adds up to 100 ft: 60 ft -> B sprinklered 360 ft; 150 ft -> 400; not allowed groups stay not permitted', [eg({spr: 'a', balcony: 60}).lim, eg({spr: 'a', balcony: 150}).lim, eg({grp: 'H1', spr: 'none', balcony: 50}).lim], [360, 400, null]);
check('actual travel against the limit: 300 ft passes at the 300 ft sprinklered B limit, 301 fails; no travel entered gives none; a group not permitted gives none', [eg({spr: 'a', travel: 300}).travelOk, eg({spr: 'a', travel: 301}).travelOk, eg({spr: 'a'}).travelOk, eg({grp: 'H1', spr: 'none', travel: 50}).travelOk], [true, false, null, null]);
w.renderCalc('ifcegress'); w.calcResult('ifcegress');
let tt = txt(w, 'ig_results');
check('the page opens with 600 m2 of business and 150 m2 of storage: 50 occupants, 2 exits, 44 in stairway, 200 ft and the 🔴 note', [tt.includes('50'), tt.includes('44 in'), tt.includes('200 ft'), tt.includes('🔴')], [true, true, true, true]);
w.igAddRow(); setv(w, 'ig_g', 'H1'); w.calcResult('ifcegress');
check('adding a row works and group H-1 without sprinklers is not permitted', [w.document.querySelectorAll('#ig-tbody tr').length, txt(w, 'ig_results').includes('غير مسموح')], [3, true]);
check('other reference codes open it too', others('ifcegress', 'ig_results'), [true, true, true]);
}
// ---------- part 99: Eurocode 8 (`ec8spec`: EN 1998-1 Tables 3.2 and 3.3, expressions 3.2 - 3.5 and 3.13 - 3.16, 4.5 and 4.6) ----------
{
w = boot('intl'); doc = w.document;
const e8 = o => w.eval('e8Calc(' + JSON.stringify(Object.assign({type: 1, gt: 'B', ic: 'II', agR: 0.15, xi: 5, q: 3, T: 0.5, ct: 0.075, H: 20, m: 2000, storeys: 6}, o)) + ')');
check('Table 3.2 (type 1) S, TB, TC, TD: A 1.0/0.15/0.4/2.0, B 1.2/0.15/0.5/2.0, C 1.15/0.20/0.6/2.0, D 1.35/0.20/0.8/2.0, E 1.4/0.15/0.5/2.0', ['A', 'B', 'C', 'D', 'E'].map(g => e8({gt: g}).p.join('/')), ['1/0.15/0.4/2', '1.2/0.15/0.5/2', '1.15/0.2/0.6/2', '1.35/0.2/0.8/2', '1.4/0.15/0.5/2']);
check('Table 3.3 (type 2): A 1.0/0.05/0.25/1.2, B 1.35/0.05/0.25/1.2, C 1.5/0.10/0.25/1.2, D 1.8/0.10/0.30/1.2, E 1.6/0.05/0.25/1.2', ['A', 'B', 'C', 'D', 'E'].map(g => e8({type: 2, gt: g}).p.join('/')), ['1/0.05/0.25/1.2', '1.35/0.05/0.25/1.2', '1.5/0.1/0.25/1.2', '1.8/0.1/0.3/1.2', '1.6/0.05/0.25/1.2']);
check('ag = gammaI x agR x g: 0.15 g class II = 1.4715 m/s2; class IV (1.4) = 2.0601; class I (0.8) = 1.1772', [e8({}).ag, e8({ic: 'IV'}).ag, e8({ic: 'I'}).ag, e8({ic: 'III'}).gI], [1.4715, 2.0601, 1.1772, 1.2], 0.0005);
check('damping correction eta = sqrt(10 / (5 + xi)): 5 % = 1.0, 10 % = 0.8165, 30 % = 0.5345 limited to 0.55', [e8({xi: 5}).eta, e8({xi: 10}).eta, e8({xi: 30}).eta], [1, 0.8165, 0.55], 0.0005);
check('elastic spectrum, ground B type 1, 5 %: T = 0 -> ag S = 1.7658; T = TB = 0.15 -> 2.5 ag S = 4.4145; plateau to TC = 0.5; T = 2.0 (TD) -> 1.1036; T = 4 -> 0.2759 (expression 3.5)', [0, 0.15, 0.3, 0.5, 2, 4].map(T => +e8({T}).Se.toFixed(4)), [1.7658, 4.4145, 4.4145, 4.4145, 1.1036, 0.2759]);
check('design spectrum q = 3: T = 0 -> 2/3 ag S = 1.1772; plateau 2.5 ag S / q = 1.4715 from TB to TC; T = 2 -> 0.3679; T = 4 is limited by beta ag = 0.2 ag = 0.2943', [0, 0.15, 0.5, 2, 4].map(T => +e8({T}).Sd.toFixed(4)), [1.1772, 1.4715, 1.4715, 0.3679, 0.2943]);
check('type 2 ground C, q = 1.5 (T = 0.25 on the plateau): ag S x 2.5 / q = 1.4715 x 1.5 x 2.5 / 1.5 = 3.6788', [+e8({type: 2, gt: 'C', q: 1.5, T: 0.25}).Sd.toFixed(4)], [3.6788]);
const b = e8({});
check('T1 = Ct H^0.75 = 0.075 x 20^0.75 = 0.7093 s; lambda = 0.85 (T1 <= 2 TC, more than two storeys); Sd(T1) = 1.0373; Fb = 1.0373 x 2000 x 0.85 = 1763.4 kN', [+b.T1.toFixed(4), b.lam, +b.Sd1.toFixed(4), +b.Fb.toFixed(1)], [0.7093, 0.85, 1.0373, 1763.4], 0.05);
check('lambda = 1.0 for two storeys or fewer and for T1 above 2 TC (H = 50 m -> T1 = 1.41 s > 1.0 s)', [e8({storeys: 2}).lam, e8({H: 50}).lam], [1, 1]);
w.renderCalc('ec8spec'); w.calcResult('ec8spec');
let tt = txt(w, 'e8_results');
check('the page opens with type 1, ground B, 0.15 g: 0.150 g, 4.415, 0.709 s, 1763.4 kN and the 🔴 note', [tt.includes('0.150 g'), tt.includes('4.415'), tt.includes('0.709'), tt.includes('1763.4'), tt.includes('🔴')], [true, true, true, true, true]);
setv(w, 'e8_s', '2'); setv(w, 'e8_g', 'C'); w.calcResult('ec8spec');
check('type 2 ground C changes the parameters (S = 1.5)', [txt(w, 'e8_results').includes('1.5 / 0.1 / 0.25 / 1.2')], [true]);
check('other reference codes open it too', others('ec8spec', 'e8_results'), [true, true, true]);
}
// ---------- part 100: Eurocode 2 (`ec2beam`: EN 1992-1-1 6.1, 6.2, 8.2 - 8.7, 9.2.1) ----------
{
w = boot('intl'); doc = w.document;
const e2 = o => w.eval('e2Calc(' + JSON.stringify(Object.assign({b: 300, h: 600, d: 550, d2: 50, fck: 30, fyk: 500, fywk: 500, gc: 1.5, gs: 1.15, acc: 1, M: 200, V: 150, phi: 20, good: true, sig: 0, lap: 50}, o)) + ')');
let r = e2({});
check('C30/37, B500: fcd = 20.0, fyd = 434.8, fctm = 0.30 fck^(2/3) = 2.896 MPa', [r.fcd, +r.fyd.toFixed(1), +r.fctm.toFixed(3)], [20, 434.8, 2.896], 0.001);
check('M = 200 kN m, b = 300, d = 550: mu = 0.110, As1 = 888 mm2 (z = 518), minimum 0.26 fctm/fyk b d = 248.5 mm2, maximum 0.04 Ac = 7200 mm2', [+r.mu.toFixed(3), Math.round(r.As1), +r.Asmin.toFixed(1), r.Asmax, r.comp], [0.11, 888, 248.5, 7200, false], 0.6);
check('the single-reinforced limit is 0.295 (x = 0.45 d); M = 500 kN m (mu = 0.2755) is still single, M = 600 kN m (mu = 0.3306) needs compression steel: As2 = 295 mm2 and As1 = 3028 mm2', [e2({M: 500}).comp, e2({M: 600}).comp, Math.round(e2({M: 600}).As2), Math.round(e2({M: 600}).As1)], [false, true, 295, 3028], 3);
check('a very small moment is taken up by the minimum steel (the page shows the larger of the two)', [e2({M: 10}).As1 < e2({M: 10}).Asmin], [true]);
check('shear: k = 1 + sqrt(200/d) = 1.60 (limit 2.0), rho_l = 0.54 %, VRd,c = 80.2 kN; VRd,max at cot 2.5 = 540.7 kN; nu1 = 0.6 (1 - fck/250) = 0.528', [+r.k.toFixed(2), +(r.rho * 100).toFixed(2), +(r.VRdc / 1000).toFixed(1), +(r.VRdmax25 / 1000).toFixed(1), +r.nu1.toFixed(3)], [1.6, 0.54, 80.2, 540.7, 0.528], 0.06);
check('links for VEd = 150 kN: cot = 2.5, Asw/s = V / (0.9 d fywd cot) = 0.279 mm2/mm, minimum 0.08 sqrt(fck)/fyk x b = 0.263, maximum spacing 0.75 d = 412.5 mm', [r.cot, +r.aswS.toFixed(3), +r.aswMin.toFixed(3), r.smax, r.needLinks], [2.5, 0.279, 0.263, 412.5, true], 0.002);
check('a high shear exceeds VRd,max at cot 2.5: VEd = 700 kN gives cot between 1 and 2.5; 1200 kN exceeds even cot = 1 (section too small)', [e2({V: 700}).cot < 2.5 && e2({V: 700}).cot >= 1, e2({V: 700}).fail, e2({V: 1200}).fail], [true, false, true]);
check('no links needed by calculation when VEd <= VRd,c (50 kN) but the minimum applies', [e2({V: 50}).needLinks, e2({V: 50}).aswUse], [false, r.aswMin], 0.001);
check('anchorage: fbd = 2.25 eta1 eta2 fctd = 3.04 MPa (good bond), lb,rqd = (20/4) fyd / fbd = 715 mm, minimum max(0.3 lb,rqd, 10 phi, 100) = 214 mm; poor bond (eta1 = 0.7): fbd = 2.13 and lb,rqd = 1021 mm', [+r.fbd.toFixed(2), Math.round(r.lbr), Math.round(r.lbmin), +e2({good: false}).fbd.toFixed(2), Math.round(e2({good: false}).lbr)], [3.04, 715, 214, 2.13, 1021], 1);
check('laps: alpha6 = 1.0 (25 % or less), 1.15 (33 %), 1.4 (50 %), 1.5 (over 50 %); l0 = 1.4 x 715 = 1001 mm at 50 %; phi 40 mm uses eta2 = (132 - 40)/100 = 0.92', [25, 33, 50, 100].map(p => e2({lap: p}).a6), [1, 1.15, 1.4, 1.5]);
check('l0 at 50 % = 1001 mm and the lap minimum max(0.3 alpha6 lb,rqd, 15 phi, 200) is respected; a large bar reduces fbd by eta2: phi 40 gives fbd 2.80 MPa', [Math.round(r.l0), +e2({phi: 40}).fbd.toFixed(2)], [1001, 2.8], 1);
w.renderCalc('ec2beam'); w.calcResult('ec2beam');
let tt = txt(w, 'e2_results');
check('the page opens with 888 mm2, VRd,c 80.2 kN, 715 mm, 1001 mm and the 🔴 note', [tt.includes('888 mm'), tt.includes('80.2 kN'), tt.includes('715 mm'), tt.includes('1001 mm'), tt.includes('🔴')], [true, true, true, true, true]);
setv(w, 'e2_m', 600); w.calcResult('ec2beam');
check('a larger moment shows the compression steel', [txt(w, 'e2_results').includes('295 mm')], [true]);
check('other reference codes open it too', others('ec2beam', 'e2_results'), [true, true, true]);
}
// ---------- part 101: ACI 318M-08 (`acibeam`: 10.2, 9.3, 11.2, 11.4, 12.2.2, 12.3.2) ----------
{
w = boot('intl'); doc = w.document;
const ac = o => w.eval('acCalc(' + JSON.stringify(Object.assign({b: 300, d: 550, fc: 28, fy: 420, fyt: 420, M: 200, V: 150, lam: 1, db: 20, psit: 1, psie: 1, case1: true}, o)) + ')');
let r = ac({});
check('f c = 28 MPa, fy = 420, M = 200 kN m, b = 300, d = 550: As = 1017 mm2 (a = 59.8, c = 70.3 mm), minimum max(sqrt(fc)/4fy, 1.4/fy) b d = 550 mm2, strain 0.0204 (tension-controlled)', [Math.round(r.As), +r.a.toFixed(1), +r.c.toFixed(1), Math.round(r.Asmin), +r.et.toFixed(4), r.over], [1017, 59.8, 70.3, 550, 0.0204, false], 1.5);
check('beta1 = 0.85 for 28 MPa, 0.65 at 55 MPa and above (0.85 - 0.05 (fc - 28) / 7 between)', [28, 35, 42, 56, 70].map(f => +ac({fc: f}).b1.toFixed(3)), [0.85, 0.8, 0.75, 0.65, 0.65]);
check('M = 500 kN m is tension-controlled (As = 2835, strain 0.0054), M = 550 kN m is not (strain 0.0045 < 0.005), and a very large moment has no solution', [Math.round(ac({M: 500}).As), +ac({M: 500}).et.toFixed(4), ac({M: 500}).over, ac({M: 550}).over, ac({M: 2000}).As, ac({M: 2000}).over], [2835, 0.0054, false, true, null, true], 4);
check('shear: Vc = 0.17 lambda sqrt(fc) b d = 148.4 kN; phi Vc = 111.3 kN; Vu = 150 kN -> Vs = 150/0.75 - 148.4 = 51.6 kN; Av/s = max(Vs/(fyt d), 0.062 sqrt(fc) b/fyt, 0.35 b/fyt) = 0.25 mm2/mm; maximum Vs 0.66 sqrt(fc) b d = 576.2 kN', [+(r.Vc / 1000).toFixed(1), +(r.phiVc / 1000).toFixed(1), +(r.Vs / 1000).toFixed(1), +r.AvsReq.toFixed(3), +(r.VsMax / 1000).toFixed(1), r.cat], [148.4, 111.3, 51.6, 0.25, 576.2, 'design'], 0.1);
check('classification: Vu <= phi Vc / 2 (55.6 kN) = none, up to phi Vc = minimum, above = design; Vs above 0.33 sqrt(fc) b d halves the spacing limit (d/2 = 275 -> d/4 = 137.5)', [ac({V: 50}).cat, ac({V: 100}).cat, ac({V: 150}).cat, ac({V: 150}).sMax, ac({V: 450}).sMax, ac({V: 800}).big], ['none', 'min', 'design', 275, 137.5, true]);
check('large Vu needs more than the minimum: Vu = 400 kN -> Vs = 384.9 kN -> Av/s = 1.667 mm2/mm', [+ac({V: 400}).AvsReq.toFixed(3)], [1.667], 0.01);
check('development length (spacing and cover satisfied): bars up to 20 mm use 2.1 (SBC 304 Table 25.4.2.2: 420 x 20 / (2.1 x 5.2915) = 756 mm) and 22 mm or more 1.7 (22 mm = 1027 mm); other cases (1.4 for 16 mm = 907 mm, 1.1 for 25 mm = 1804 mm); minimum 300 mm', [Math.round(r.ld), Math.round(ac({db: 16}).ld), Math.round(ac({db: 22}).ld), Math.round(ac({db: 16, case1: false}).ld), Math.round(ac({db: 25, case1: false}).ld), ac({db: 5}).ld], [756, 605, 1027, 907, 1804, 300], 1);
check('top bars psi_t = 1.3 and epoxy 1.5: the product is limited to 1.7 (db 20: 756 x 1.7 = 1285 mm); bottom bars with epoxy psi_e = 1.2 -> 907 mm', [Math.round(ac({psit: 1.3, psie: 1.5}).ld), Math.round(ac({psie: 1.2}).ld)], [1285, 907], 1);
check('compression: ldc = max(0.24 fy db / (lambda sqrt(fc)), 0.043 fy db, 200) = 381 mm for db 20; light-weight concrete (lambda = 0.75) raises the tension length to 1008 mm', [Math.round(r.ldc), Math.round(ac({lam: 0.75}).ld)], [381, 1008], 1);
w.renderCalc('acibeam'); w.calcResult('acibeam');
let tt = txt(w, 'ac_results');
check('the page opens with 1017 mm2, 148.43 kN, 756 mm, 381 mm and the 🔴 note', [tt.includes('1017 mm'), tt.includes('148.43 kN'), tt.includes('756 mm'), tt.includes('381 mm'), tt.includes('🔴')], [true, true, true, true, true]);
setv(w, 'ac_m', 550); w.calcResult('acibeam');
check('M = 550 kN m warns that the section is not tension-controlled', [txt(w, 'ac_results').includes('أقل من 0.005')], [true]);
check('other reference codes open it too', others('acibeam', 'ac_results'), [true, true, true]);
}
// ---------- part 102: SBC 201 allowable height, stories and area (`sbcarea`: Tables 504.3, 504.4, 506.2, equations 5-1 / 5-2 / 5-5, 508.3, 508.4) ----------
{
w = boot('intl'); doc = w.document;
const sa = o => w.eval('saCalc(' + JSON.stringify(Object.assign({type: 'IIB', mode: 'none', method: 'single', stories: 1, height: 0, P: 0, F: 0, W: 0, rows: [{g: 'B', area: 1000}]}, o), (k, x) => x === Infinity ? '__INF__' : x).replace(/"__INF__"/g, 'Infinity') + ')');
const u = x => x === Infinity ? 'UL' : x;
const lim = (g, t, m, n) => { const x = w.eval('saLim("' + g + '", ' + w.eval('SA_TY.indexOf("' + t + '")') + ', "' + m + '", ' + (n || 1) + ')'); return {h: u(x.h), n: u(x.n), at: u(x.at)}; };
check('Table 504.3: B / IIB 16.5 m without and 22.5 m with sprinklers, IB 48 and 54 m, VB 12 and 18 m, IA unlimited; R with NFPA 13R 18 m', [lim('B', 'IIB', 'none').h, lim('B', 'IIB', 'a').h, lim('B', 'IB', 'none').h, lim('B', 'IB', 'a').h, lim('B', 'VB', 'none').h, lim('B', 'VB', 'a').h, lim('B', 'IA', 'none').h, lim('R-2', 'IIB', 'b').h], [16.5, 22.5, 48, 54, 12, 18, 'UL', 18]);
check('Table 504.4 stories: B IIB 3 / 4; A-1 IIB 2 / 3; E VA 1 / 2; H-1 VB not permitted; I-2 IIIB not permitted; R-2 VB 2 / 3 / 13R 3; R-1 IIB 4 / 5 / 13R 4', [lim('B', 'IIB', 'none').n, lim('B', 'IIB', 'a').n, lim('A-1', 'IIB', 'none').n, lim('A-1', 'IIB', 'a').n, lim('E', 'VA', 'none').n, lim('E', 'VA', 'a').n, lim('H-1', 'VB', 'none').n, lim('I-2', 'IIIB', 'none').n, lim('R-2', 'VB', 'none').n, lim('R-2', 'VB', 'a').n, lim('R-2', 'VB', 'b').n, lim('R-1', 'IIB', 'none').n, lim('R-1', 'IIB', 'a').n, lim('R-1', 'IIB', 'b').n], [3, 4, 2, 3, 1, 2, null, null, 2, 3, 3, 4, 5, 4]);
check('Table 506.2 areas (m2): B IIB 2137 NS / 8547 S1 / 6410 SM; M IIA 1997 / 7989 / 5992; S-1 IB 4459 / 17837 / 13378; A-4 IIA 1440 / 5760 / 4320 (misprints corrected); H-4 IIA S1 13935; I-4 IB 5620 / 11241 / 16861', [lim('B', 'IIB', 'none', 1).at, lim('B', 'IIB', 'a', 1).at, lim('B', 'IIB', 'a', 2).at, lim('M', 'IIA', 'none').at, lim('M', 'IIA', 'a', 1).at, lim('M', 'IIA', 'a', 2).at, lim('S-1', 'IB', 'none').at, lim('S-1', 'IB', 'a', 1).at, lim('S-1', 'IB', 'a', 2).at, lim('A-4', 'IIA', 'none').at, lim('A-4', 'IIA', 'a', 1).at, lim('A-4', 'IIA', 'a', 2).at, lim('H-4', 'IIA', 'a', 1).at, lim('I-4', 'IB', 'none').at, lim('I-4', 'IB', 'a', 1).at, lim('I-4', 'IB', 'a', 2).at], [2137, 8547, 6410, 1997, 7989, 5992, 4459, 17837, 13378, 1440, 5760, 4320, 13935, 5620, 11241, 16861]);
check('every tabular area is a multiple of 500 ft2 (within the m2 rounding)', w.eval('(() => { let bad = 0; for (const g in SA_AR) SA_AR[g].forEach(r => r.forEach(m => { if (m != null && m !== Infinity) { const ft = m / 0.092903; if (Math.abs(ft - Math.round(ft / 500) * 500) > 18) bad++; } })); return bad; })()'), 0);
check('H-1 to H-3 areas do not change with sprinklers; R-3 and A-5 unlimited; R-1 with NFPA 13R takes the NS value', [lim('H-2', 'IIA', 'a', 1).at, lim('H-2', 'IIA', 'a', 2).at, lim('R-3', 'VB', 'none').at, lim('A-5', 'VB', 'none').at, lim('R-1', 'IIB', 'b', 1).at, lim('R-1', 'IIB', 'a', 1).at], [1022, 1022, 'UL', 'UL', 1486, 5946]);
let r = sa({P: 200, F: 100, W: 9});
check('frontage increase If = (F/P - 0.25) x W/9: 100 of 200 m on a 9 m open space = 0.25; W above 9 m counts as 9; below 6 m or F/P under 0.25 = no increase', [r.fr.If, sa({P: 200, F: 100, W: 15}).fr.If, sa({P: 200, F: 100, W: 5.9}).fr.If, sa({P: 200, F: 49, W: 9}).fr.If, sa({P: 200, F: 100, W: 6}).fr.If], [0.25, 0.25, 0, 0, 0.1667], 0.001);
check('Aa = At + NS x If: B IIB without sprinklers 2137 + 2137 x 0.25 = 2671; with sprinklers, one story: 8547 + 2137 x 0.25 = 9081', [Math.round(r.rows[0].aa1), Math.round(sa({mode: 'a', P: 200, F: 100, W: 9}).rows[0].aa1)], [2671, 9081]);
check('multistory 506.2.3: B IIB with sprinklers and 3 stories: (6410 + 0) x 3 = 19230; 5 stories still use Sa = 3; NFPA 13R takes up to 4 stories (R-2 IIIA, 4 stories: 2230 x 4 = 8920)', [sa({mode: 'a', stories: 3}).rows[0].aa, sa({mode: 'a', stories: 5}).sa, sa({mode: 'b', stories: 4, rows: [{g: 'R-2', area: 800}], type: 'IIIA'}).sa, sa({mode: 'b', stories: 4, rows: [{g: 'R-2', area: 800}], type: 'IIIA'}).rows[0].aa], [19230, 3, 4, 8920]);
check('limits against the actual building: B IIB with 3 stories passes and 4 fails; 16.5 m passes and 17 m fails; 1200 m2 passes and 2200 m2 fails', [sa({stories: 3}).nOk, sa({stories: 4}).nOk, sa({height: 16.5}).hOk, sa({height: 17}).hOk, sa({rows: [{g: 'B', area: 1200}]}).areaOk, sa({rows: [{g: 'B', area: 2200}]}).areaOk], [true, false, true, false, true, false]);
check('NFPA 13R is not valid for other than group R (flagged and calculated without sprinklers)', [sa({mode: 'b'}).rows[0].invalid13, sa({mode: 'b'}).rows[0].h], [true, 16.5]);
r = sa({method: 'sep', rows: [{g: 'B', area: 1000}, {g: 'S-1', area: 500}]});
check('508.4 separated: 1000 m2 of B (2137) + 500 m2 of S-1 (1626) = 0.468 + 0.307 = 0.776 passes; 1500 m2 of B + 800 m2 of S-1 = 0.70 + 0.49 > 1 fails; most restrictive height governs', [r.sumR, r.areaOk, sa({method: 'sep', rows: [{g: 'B', area: 1500}, {g: 'S-1', area: 800}]}).areaOk, r.gov.h], [0.776, true, false, 16.5], 0.002);
check('508.4 with more than three stories the sum of the ratios over the stories is limited to 3: B IIB sprinklered, 4 stories of 3000 m2 (4 x 0.47 = 1.9) passes and 4 stories of 4900 m2 (4 x 0.76 = 3.06) fails', [sa({method: 'sep', stories: 4, mode: 'a', rows: [{g: 'B', area: 3000}]}).areaOk, sa({method: 'sep', stories: 4, mode: 'a', rows: [{g: 'B', area: 4900}]}).areaOk], [true, false]);
check('508.3 nonseparated: the most restrictive group governs (B 2137 and S-1 1626 -> 1626), the total area is compared', [sa({method: 'non', rows: [{g: 'B', area: 1000}, {g: 'S-1', area: 500}]}).gov.aa1, sa({method: 'non', rows: [{g: 'B', area: 1000}, {g: 'S-1', area: 500}]}).areaOk, sa({method: 'non', rows: [{g: 'B', area: 1200}, {g: 'S-1', area: 500}]}).areaOk], [1626, true, false]);
check('Table 508.4 (not sprinklered / sprinklered): B and S-1 none; B and F-2 2 / 1 h; A and R 2 / 1; R and H-2 not permitted / 3 h; B and H-2 3 / 2; H-1 with anything not permitted; I-2 with R 2 h / not permitted; F-2 and H-5 not permitted / 2 h', [['B', 'S-1'], ['B', 'F-2'], ['A-2', 'R-2'], ['R-1', 'H-2'], ['B', 'H-2'], ['H-1', 'B'], ['I-2', 'R-1'], ['F-2', 'H-5']].map(p => [w.eval('saSep("' + p[0] + '", "' + p[1] + '", false)'), w.eval('saSep("' + p[0] + '", "' + p[1] + '", true)')].join('/')), ['N/N', '2/1', '2/1', 'NP/3', '3/2', 'NP/NP', 'NP/2', 'NP/2']);
w.renderCalc('sbcarea'); w.calcResult('sbcarea');
let tt = txt(w, 'sa_results');
check('the page opens with B / IIB, 3 stories, 16.5 m, Aa 2137 m2 and the 🔴 note', [tt.includes('16.5 m'), tt.includes('2137'), tt.includes('🔴')], [true, true, true]);
w.saAddRow(); setv(w, 'sa_m', 'sep'); w.calcResult('sbcarea');
check('adding a row and choosing separated occupancies shows the ratio sum and the separation table', [w.document.querySelectorAll('#sa-tbody tr').length, txt(w, 'sa_results').includes('508.4')], [3, true]);
check('other reference codes open it too', others('sbcarea', 'sa_results'), [true, true, true]);
}
// ---------- part 103: SBC 201 fire resistance of elements (`sbcfirecon`: Tables 601, 602, 705.8, 706.4, 707.3.10, 509) ----------
{
w = boot('intl'); doc = w.document;
const sf = o => w.eval('sfCalc(' + JSON.stringify(Object.assign({type: 'IIB', g: 'B', d: 4, sprk: 'n', open: 0, prot: 'up'}, o), (k, x) => x === Infinity ? '__INF__' : x).replace(/"__INF__"/g, 'Infinity') + ')');
check('Table 601 (frame, exterior bearing wall, interior bearing wall, floor, roof): IA 3 / 3 / 3 / 2 / 1.5; IB 2 / 2 / 2 / 2 / 1; IIA 1 each; IIB all 0; IIIA 1 / 2 / 1 / 1 / 1; IV HT; VA 1', [sf({type: 'IA'}), sf({type: 'IB'}), sf({type: 'IIA'}), sf({type: 'IIB'}), sf({type: 'IIIA'}), sf({type: 'IV'}), sf({type: 'VA'})].map(r => [r.t601[0].val, r.t601[1].val, r.t601[2].val, r.t601[4].val, r.t601[5].val].join('/')), ['3/3/3/2/1.5', '2/2/2/2/1', '1/1/1/1/1', '0/0/0/0/0', '1/2/1/1/1', 'HT/2/1/HT/HT/HT', '1/1/1/1/1']);
check('Table 602 groups H / F-1, M, S-1 / others at 1 m: all types 3 / 2 / 1; at 2 m IA 3 / 2 / 1 but other types 2 / 1 / 1', [['H-1', 'F-1', 'B'].map(g => w.eval('sf602(3, "' + g + '", 1)')).join('/'), ['H-1', 'F-1', 'B'].map(g => w.eval('sf602(0, "' + g + '", 2)')).join('/'), ['H-1', 'F-1', 'B'].map(g => w.eval('sf602(3, "' + g + '", 2)')).join('/')], ['3/2/1', '3/2/1', '2/1/1']);
check('Table 602 at 5 m: IA and IB 2 / 1 / 1; IIB and VB 1 / 0 / 0; other types 1 / 1 / 1; from 9 m 0', [w.eval('SA_TY').map((t, i) => ['H-1', 'F-1', 'B'].map(g => w.eval('sf602(' + i + ', "' + g + '", 5)')).join('')), [0, 3, 5, 8].map(i => ['H-1', 'F-1', 'B'].map(g => w.eval('sf602(' + i + ', "' + g + '", 9)')).join(''))], [['211', '211', '111', '100', '111', '111', '111', '111', '100'], ['000', '000', '000', '000']]);
check('Table 705.8, group B: under 0.9 m not permitted; 1 m: UP,NS not permitted, UP,S 15 %, protected 15 %; 2 m: 10 / 25 / 25; 3.5 m: 15 / 45 / 45; 5 m: 25 / 75 / 75; 7 m: 45 % / no limit; 8 m: 70 %; 9 m: no limit', [0.5, 1, 2, 3.5, 5, 7, 8, 9].map(d => ['up', 'ups', 'p'].map(k => String(w.eval('sf705("B", ' + d + ', "' + k + '")'))).join('/')), ['null/null/null', 'null/15/15', '10/25/25', '15/45/45', '25/75/75', '45/Infinity/Infinity', '70/Infinity/Infinity', 'Infinity/Infinity/Infinity']);
check('R-3: 25 % between 0.9 and 1.5 m when sprinklered or protected, no limit from 1.5 m; H-2 and H-3 have no unprotected openings under 4.5 m and UP,S is replaced by UP,NS (5 m: 25 %)', [w.eval('sf705("R-3", 1.2, "ups")'), w.eval('sf705("R-3", 1.2, "up")'), String(w.eval('sf705("R-3", 2, "up")')), w.eval('sf705("H-2", 3, "up")'), w.eval('sf705("H-3", 3, "ups")'), w.eval('sf705("H-2", 5, "ups")'), w.eval('sf705("H-2", 5, "up")')], [25, null, 'Infinity', null, null, 25, 25]);
check('actual openings against the limit: 2 m, sprinklered: 25 % passes and 26 % fails; protected 25 % passes; 12 % unprotected without sprinklers fails (10 %)', [sf({d: 2, sprk: 's', open: 25}).openOk, sf({d: 2, sprk: 's', open: 26}).openOk, sf({d: 2, open: 25, prot: 'p'}).openOk, sf({d: 2, open: 12}).openOk, sf({d: 2}).openOk], [true, false, true, false, null]);
check('exterior bearing wall = the larger of Table 601 and Table 602: IIB at 1 m for group B: max(0, 1) = 1; IA keeps 3', [sf({d: 1}).bearExt, sf({type: 'IA', d: 12}).bearExt], [1, 3]);
check('Table 706.4 fire walls: A, B, E, I, R-1, R-2, U and H-4 3 h; F-1, H-3, H-5, M, S-1 3 h; H-1 and H-2 4 h; F-2, S-2, R-3, R-4 2 h; Table 707.3.10: H-1 and H-2 4 h; F-1, H-3, S-1 3 h; B 2 h; U 1 h', [['A-1', 'B', 'U', 'I-2', 'H-4', 'F-1', 'M', 'H-1', 'H-2', 'F-2', 'R-3'].map(g => w.eval('SF_706("' + g + '")')), ['H-1', 'F-1', 'S-1', 'B', 'R-2', 'U'].map(g => w.eval('SF_707("' + g + '")'))], [[3, 3, 3, 3, 3, 3, 3, 4, 4, 2, 2], [4, 3, 3, 2, 2, 1]]);
check('Table 509 lists 17 incidental uses', [w.eval('SF_509.length')], [17]);
w.renderCalc('sbcfirecon'); w.calcResult('sbcfirecon');
let tt = txt(w, 'sf_results');
check('the page opens with IIB / B at 4 m: 15 % / 45 % / 45 %, fire wall 3 h and the 🔴 note', [tt.includes('15%'), tt.includes('45%'), tt.includes('3 h'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('sbcfirecon', 'sf_results'), [true, true, true]);
}
// ---------- part 104: SBC 201 interior environment (`sbcroom`: 1203.5, 1205, 1206, 1207, 1208, 1209) ----------
{
w = boot('intl'); doc = w.document;
const sr = o => w.eval('srCalc(' + JSON.stringify(Object.assign({use: 'hab', area: 0, width: 0, ceil: 0, ceilKind: 'flat', glass: 0, open: 0, adj: false, adjOpen: 0, adjArea: 0, lux: 0, firstRoom: false, eff: false, occ: 2, living: 0, stories: 0, yard: 0, courtW: 0, courtL: 0, courtOpen: false, opp: false, airIn: 0, stc: 0, iic: 0, field: false, crawlW: 0, crawlL: 0, atticW: 0, atticL: 0}, o)) + ')');
const one = (o, ref) => (sr(o).find(x => x.ref === ref) || {});
check('natural light needs 8 % of the floor area (18 m2 -> 1.44 m2): 1.44 passes, 1.43 fails; natural ventilation 4 % openable (0.72): 0.72 passes, 0.71 fails', [one({area: 18, glass: 1.44, open: 0.72}, '1205.2').ok, one({area: 18, glass: 1.43, open: 0.72}, '1205.2').ok, one({area: 18, glass: 2, open: 0.72}, '1203.5.1').ok, one({area: 18, glass: 2, open: 0.71}, '1203.5.1').ok, +one({area: 18, glass: 2, open: 1}, '1205.2').lim.toFixed(2)], [true, false, true, false, 1.44]);
check('through an adjoining room: opening of 8 % of the room area but not under 2.3 m2 for ventilation (10 m2 -> 2.3), 10 % or 2.3 m2 for light; 30 m2 -> 2.4 m2 for ventilation and 3 m2 for light', [one({area: 10, adj: true, adjOpen: 2.3, open: 1}, '1203.5.1.1').ok, one({area: 10, adj: true, adjOpen: 2.2, open: 1}, '1203.5.1.1').ok, one({area: 30, adj: true, adjOpen: 2.4, open: 2}, '1203.5.1.1').ok, one({area: 30, adj: true, adjOpen: 3, open: 2}, '1205.2.1').ok, one({area: 30, adj: true, adjOpen: 2.9, open: 2}, '1205.2.1').ok], [true, false, true, true, false]);
check('artificial light average 107 lux: 107 passes, 100 fails', [one({lux: 107}, '1205.3').ok, one({lux: 100}, '1205.3').ok], [true, false]);
check('room width 2.1 m: 2.1 passes, 2.09 fails; kitchen passage 0.9 m; ceiling height 2.25 m for habitable rooms and corridors (2.24 fails), 2.1 m for bathrooms, kitchens, storage and laundry (2.1 passes)', [one({width: 2.1}, '1208.1').ok, one({width: 2.09}, '1208.1').ok, one({use: 'kit', width: 0.9}, '1208.1').ok, one({ceil: 2.25}, '1208.2').ok, one({ceil: 2.24}, '1208.2').ok, one({use: 'svc', ceil: 2.1}, '1208.2').ok, one({use: 'kit', ceil: 2.09}, '1208.2').ok, one({use: 'cor', ceil: 2.2}, '1208.2').ok], [true, false, true, true, false, true, false, false]);
check('furred ceiling never under 2.1 m (2.0 fails)', [one({ceil: 2.0, ceilKind: 'furred', use: 'svc'}, '1208.2.1').ok, one({ceil: 2.1, ceilKind: 'furred', use: 'svc'}, '1208.2.1').ok], [false, true]);
check('room areas: one room of the dwelling at least 11.2 m2 (11.2 passes, 11.1 fails), other habitable rooms 6.5 m2 (6.5 passes, 6.4 fails)', [one({area: 11.2, firstRoom: true}, '1208.3').ok, one({area: 11.1, firstRoom: true}, '1208.3').ok, one({area: 6.5}, '1208.3').ok, one({area: 6.4}, '1208.3').ok], [true, false, true, false]);
check('efficiency units: living room 20.4 m2 plus 9.3 m2 for each occupant above two (4 occupants -> 39.0 m2)', [+one({eff: true, occ: 4, living: 39}, '1208.4').lim.toFixed(1), one({eff: true, occ: 4, living: 39}, '1208.4').ok, one({eff: true, occ: 4, living: 38.9}, '1208.4').ok, +one({eff: true, occ: 2, living: 20.4}, '1208.4').lim.toFixed(1)], [39, true, false, 20.4]);
check('yards: 0.9 m up to two stories, +0.3 m for each story above two (5 stories 1.8 m, 20 stories computed at 14: 4.5 m)', [one({stories: 2, yard: 0.9}, '1206.2').lim, one({stories: 5, yard: 1}, '1206.2').lim, one({stories: 20, yard: 1}, '1206.2').lim, one({stories: 2, yard: 0.89}, '1206.2').ok], [0.9, 1.8, 4.5, false], 0.001);
check('courts: width 0.9 m (1.8 m with windows on opposite sides), length 3.0 m unless open at one end; each story above two adds 0.3 m to the width and 0.6 m to the length; air intake of 1.0 m2 above two stories', [one({stories: 2, courtW: 1}, '1206.3').lim, one({stories: 2, courtW: 1, opp: true}, '1206.3').lim, one({stories: 5, courtW: 3, opp: true}, '1206.3').lim, sr({stories: 5, courtL: 4}).filter(x => x.ref === '1206.3')[0].lim, sr({stories: 5, courtL: 4, courtOpen: true}).filter(x => x.ref === '1206.3').length, one({stories: 3, courtW: 3, airIn: 1}, '1206.3.2').ok, one({stories: 3, courtW: 3, airIn: 0.9}, '1206.3.2').ok], [0.9, 1.8, 2.7, 4.8, 0, true, false], 0.001);
check('sound: STC and IIC 50 (45 if tested in the field)', [one({stc: 50}, '1207.2').ok, one({stc: 49}, '1207.2').ok, one({stc: 45, field: true}, '1207.2').ok, one({iic: 49}, '1207.3').ok, one({iic: 45, field: true}, '1207.3').ok], [true, false, true, false, true]);
check('access openings: crawl space 450 x 600 mm, attic 560 x 760 mm (either orientation)', [one({crawlW: 0.45, crawlL: 0.6}, '1209.1').ok, one({crawlW: 0.6, crawlL: 0.4}, '1209.1').ok, one({atticW: 0.76, atticL: 0.56}, '1209.2').ok, one({atticW: 0.5, atticL: 0.76}, '1209.2').ok], [true, false, true, false]);
w.renderCalc('sbcroom'); w.calcResult('sbcroom');
let tt = txt(w, 'sr_results');
check('the page opens with an 18 m2 room: all 5 checks pass and the 🔴 note', [tt.includes('✔ كل البنود (5) محققة'), tt.includes('1205.2'), tt.includes('🔴')], [true, true, true]);
setv(w, 'sr_g', 1); w.calcResult('sbcroom');
check('1 m2 of glass fails the 8 % light rule', [txt(w, 'sr_results').includes('✘ 1 من')], [true]);
check('other reference codes open it too', others('sbcroom', 'sr_results'), [true, true, true]);
}
// ---------- part 105: SBC 301 load combinations (`sbcload`: equations 2-1 and 2-3 with F, H, Fa and T) ----------
{
w = boot('intl'); doc = w.document;
const sl = o => w.eval('slCalc(' + JSON.stringify(Object.assign({D: 100, L: 50, Lr: 10, R: 0, W: 30, E: 0, F: 0, H: 0, Fa: 0, T: 0, hAdds: true, hPerm: true, insp: false, flood: 'none', l05: false}, o)) + ')');
const lr = (o, id) => sl(o).lr.find(x => x[0] === id)[2], as = (o, id) => sl(o).as.find(x => x[0] === id)[2];
check('strength design 2-1 with D 100, L 50, Lr 10, W 30: 1: 140; 2 = 1.4D + 1.7L + 0.5Lr = 230; 3a = 186; 3b = 151; 4 = 205; 5 = 170; 6 = 120; 7 = 90', ['1', '2', '3a', '3b', '4', '5', '6', '7'].map(i => lr({}, i)), [140, 230, 186, 151, 205, 170, 120, 90]);
check('allowable stress 2-3: 1: 100; 2: 150; 3: 110; 4: 145; 5a: 118; 5b: 100; 6a: 158.5; 6b: 137.5; 7: 78; 8: 60', ['1', '2', '3', '4', '5a', '5b', '6a', '6b', '7', '8'].map(i => as({}, i)), [100, 150, 110, 145, 118, 100, 158.5, 137.5, 78, 60]);
check('the governing combinations: strength design 2 (230) with the minimum 7 (90); allowable stress 6a (158.5) with the minimum 8 (60)', [sl({}).lrMax[0], sl({}).lrMax[2], sl({}).lrMin[0], sl({}).asMax[0], sl({}).asMin[0]], ['2', 230, '7', '6a', '8']);
check('exception 1: with a special inspector combination 2 uses 1.2D + 1.6L: 120 + 80 + 5 = 205', [lr({insp: true}, '2')], [205]);
check('exception 2: the load factor of L is 0.5 in combinations 3, 4 and 5 (Lo up to 5 kN/m2): 3a = 161, 4 = 180, 5 = 145', [lr({l05: true}, '3a'), lr({l05: true}, '4'), lr({l05: true}, '5')], [161, 180, 145]);
check('uplift: W = -40 gives combination 6 = 0.9D - 40 = 50 and the 0.6D - 24 = 36 of allowable stress combination 7', [lr({W: -40}, '6'), as({W: -40}, '7')], [50, 36]);
check('F joins with the factor of D (1.4 / 1.2 / 0.9 in 2-1, 1 in 2-3): F = 10: 1 = 154, 7 = 99; 2-3 combination 1 = 110', [lr({F: 10}, '1'), lr({F: 10}, '7'), as({F: 10}, '1')], [154, 99, 110]);
check('H adds with 1.6 (1.0 in 2-3); H resisting a permanent effect takes 0.9 (0.6), otherwise 0: H = 10: 1 = 156, 149 with 0.9, 140 with a non-permanent resisting load; 2-3: 110, 106, 100', [lr({H: 10}, '1'), lr({H: 10, hAdds: false}, '1'), lr({H: 10, hAdds: false, hPerm: false}, '1'), as({H: 10}, '1'), as({H: 10, hAdds: false}, '1'), as({H: 10, hAdds: false, hPerm: false}, '1')], [156, 149, 140, 110, 106, 100]);
check('flood in V zones: 1.0W is replaced by 1.0W + 2.0Fa in combinations 4 and 6 (Fa = 10: 4 = 225, 6 = 140) and 1.5Fa is added to 5a, 6a, 7 with E = 0 in 5b and 6b (133, 173.5, 93)', [lr({flood: 'v', Fa: 10}, '4'), lr({flood: 'v', Fa: 10}, '6'), as({flood: 'v', Fa: 10}, '5a'), as({flood: 'v', Fa: 10}, '6a'), as({flood: 'v', Fa: 10}, '7'), as({flood: 'v', Fa: 10, E: 40}, '5b'), as({flood: 'v', Fa: 10, E: 40}, '8')], [225, 140, 133, 173.5, 93, 100, 88]);
check('flood in non-coastal A zones: 0.5W + 1.0Fa (4 = 200, 6 = 115) and 0.75Fa added (5a = 125.5)', [lr({flood: 'a', Fa: 10}, '4'), lr({flood: 'a', Fa: 10}, '6'), as({flood: 'a', Fa: 10}, '5a')], [200, 115, 125.5]);
check('(Lr or R) takes the larger: R = 20 against Lr = 10 gives combination 2 = 140 + 85 + 10 = 235', [lr({R: 20}, '2')], [235]);
check('self-straining loads: 2-2a = 1.2D + 1.2T + 0.5L, 2-2b = 1.2D + 1.6L + T, 2-4a = D + T, 2-4b = D + 0.75(L + T) with T = 20', sl({T: 20}).self.map(x => x[2]), [169, 220, 120, 152.5]);
w.renderCalc('sbcload'); w.calcResult('sbcload');
let tt = txt(w, 'sl_results');
check('the page opens with 230 and 158.50 and the 🔴 note', [tt.includes('230.00'), tt.includes('158.50'), tt.includes('🔴')], [true, true, true]);
setv(w, 'sl_in', 'yes'); w.calcResult('sbcload');
check('with a special inspector the label shows 1.2D + 1.6L', [txt(w, 'sl_results').includes('1.2D + 1.6L + 0.5')], [true]);
check('other reference codes open it too', others('sbcload', 'sl_results'), [true, true, true]);
}
// ---------- part 106: SBC 301 live loads (`sbclive`: Tables 4-1 and 4-2, equations 4-1 to 4-4) ----------
{
w = boot('intl'); doc = w.document;
const ix = n => w.eval('SLV_ROWS.findIndex(r => r[0] === ' + JSON.stringify(n) + ')');
const lv = o => w.eval('slvCalc(' + JSON.stringify(Object.assign({i: ix('مكاتب — مكاتب'), k: 5, at: 80, floors2: false, slope: 0, span: 0}, o)) + ')');
check('Table 4-1 values (kN/m2): offices 2.5 (concentrated 9.0), lobbies 5.0, mosques 5.0, classrooms 3.0 (4.5), stairs 5.0 (1.5), light storage 6.0, heavy manufacturing 12.0 (13.5), roofs 1.0, one- and two-family dwellings 1.0', [['مكاتب — مكاتب', 2.5, 9], ['مكاتب — ردهات وممرات الطابق الأول', 5, 9], ['مساجد', 5, null], ['مدارس — فصول', 3, 4.5], ['سلالم ومخارج', 5, 1.5], ['مستودعات خفيفة', 6, null], ['تصنيع ثقيل', 12, 13.5], ['أسطح — عادية مستوية أو مائلة أو منحنية', 1, null], ['سكني — منازل لأسرة أو أسرتين', 1, null]].map(a => { const r = lv({i: ix(a[0])}); return [r.Lo, r.conc].join('/') === [a[1], a[2]].join('/'); }), [true, true, true, true, true, true, true, true, true]);
check('Table 4-2 values: machine space of air conditioning 10.0, bakeries 7.2, foundries 30.0, kitchens other than domestic 7.2, rest rooms 3.0, transformer rooms 10.0', ['غرف تكييف (حيز الآلات)', 'مخابز', 'مسابك', 'مطابخ غير منزلية', 'دورات مياه', 'غرف المحولات'].map(n => lv({i: ix(n)}).Lo), [10, 7.2, 30, 7.2, 3, 10]);
check('Table 4-3 KLL: interior columns 4, edge columns with cantilevers 3, corner 2, interior beams 2, other members 1', [0, 2, 3, 5, 6].map(k => lv({k}).kll), [4, 3, 2, 2, 1]);
let r = lv({at: 40});
check('office interior beam with AT = 40 m2: KLL AT = 80, L = 2.5 (0.25 + 4.57 / sqrt(80)) = 1.90 kN/m2, reduction 23.9 %', [+r.L.toFixed(2), +r.pct.toFixed(1), r.kat, r.why], [1.9, 23.9, 80, 'floor']);
check('no reduction below KLL AT = 37.0 m2: AT = 18 (KLL AT = 36) keeps Lo, AT = 18.5 (37.0) starts at Lo x 1.0', [lv({at: 18}).L, lv({at: 18}).why, +lv({at: 18.5}).L.toFixed(3)], [2.5, 'small', 2.503], 0.004);
check('lower limits: 0.5 Lo for a member supporting one floor and 0.4 Lo for two or more floors (AT = 5000 m2: 1.25 and 1.0)', [lv({at: 5000}).L, lv({at: 5000, floors2: true}).L], [1.25, 1]);
check('heavy live loads above 5.0 kN/m2 are not reduced (light manufacturing 6.0); two or more floors may be reduced by at most 20 % (4.8 kN/m2), never below the 4.7.2 value', [lv({i: ix('تصنيع خفيف'), at: 200}).L, lv({i: ix('تصنيع خفيف'), at: 200, floors2: true}).L, lv({i: ix('تصنيع خفيف'), at: 200, floors2: true}).why, lv({i: ix('تصنيع خفيف'), at: 200}).why], [6, 4.8, 'twenty', 'heavy'], 0.001);
check('assembly uses and mosques are never reduced, passenger garages only by up to 20 % for two floors or more', [lv({i: ix('تجمع — مقاعد ثابتة'), at: 500, floors2: true}).L, lv({i: ix('مساجد'), at: 500}).why, lv({i: ix('مرائب لسيارات الركاب فقط'), at: 200}).L, lv({i: ix('مرائب لسيارات الركاب فقط'), at: 200, floors2: true}).L], [3, 'a', 2, 1.6]);
check('roof live load Lr = Lo R1 R2 between 0.6 and 1.0: AT 18 or less R1 = 1; AT 36: 1.2 - 0.011 x 36 = 0.804; AT 54 or more 0.6; slope 10 % (F = 1.2) R2 = 1; slope 50 % (F = 6) R2 = 0.9; slope 100 % (F = 12) R2 = 0.6', [lv({i: ix('أسطح — عادية مستوية أو مائلة أو منحنية'), at: 18}).L, lv({i: ix('أسطح — عادية مستوية أو مائلة أو منحنية'), at: 36}).L, lv({i: ix('أسطح — عادية مستوية أو مائلة أو منحنية'), at: 80}).L, lv({i: ix('أسطح — عادية مستوية أو مائلة أو منحنية'), at: 18, slope: 10}).L, lv({i: ix('أسطح — عادية مستوية أو مائلة أو منحنية'), at: 18, slope: 50}).L, lv({i: ix('أسطح — عادية مستوية أو مائلة أو منحنية'), at: 18, slope: 100}).L], [1, 0.804, 0.6, 1, 0.9, 0.6], 0.001);
check('roof gardens (5.0 kN/m2) follow 4.7 (AT 100, KLL 2: 5 x (0.25 + 4.57 / sqrt(200)) = 2.87) and canopies of fabric (0.25) are not reduced', [lv({i: ix('أسطح — حدائق'), at: 100, k: 5}).why, +lv({i: ix('أسطح — حدائق'), at: 100, k: 5}).L.toFixed(2), lv({i: ix('أسطح — مظلات من قماش على هيكل'), at: 500}).L], ['floor', 2.87, 0.25]);
check('one-way slab tributary area at most 1.5 span squared: span 4 m -> 24 m2 passes and 25 m2 fails', [lv({k: 6, span: 4, at: 24}).slabOk, lv({k: 6, span: 4, at: 25}).slabOk, lv({k: 6}).slabOk], [true, false, null]);
check('the list holds the transcribed uses of Tables 4-1 and 4-2 (at least 90)', [w.eval('SLV_ROWS.length >= 90')], [true]);
w.renderCalc('sbclive'); w.calcResult('sbclive');
let tt = txt(w, 'slv_results');
check('the page opens with an office: Lo 2.50, 9.00 kN, L 1.90 and the 🔴 note', [tt.includes('2.50 kN/m²'), tt.includes('9.00 kN'), tt.includes('1.90 kN/m²'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('sbclive', 'slv_results'), [true, true, true]);
}
// ---------- part 107: SBC 301 wind loads (`sbcwind`: Tables 26-1 to 26-3, 27-2, Figures 27-1 and 27-2, equations 27-1 and 27-2) ----------
{
w = boot('intl'); doc = w.document;
const sw = o => w.eval('swCalc(' + JSON.stringify(Object.assign({V: 45, exp: 'C', kzt: 1, h: 10, L: 30, B: 40, th: 0, dir: 'norm', encl: 'e'}, o)) + ')');
check('Kz from the formula agrees with Table 27-2 (within 0.01): exposure C 5 m 0.86, 10 m 1.00, 20 m 1.16, 50 m 1.40, 150 m 1.77; B 10 m 0.72, 20 m 0.88; D 10 m 1.18, 20 m 1.33', [['C', 5, 0.86], ['C', 10, 1.00], ['C', 20, 1.16], ['C', 50, 1.40], ['C', 150, 1.77], ['B', 10, 0.72], ['B', 20, 0.88], ['D', 10, 1.18], ['D', 20, 1.33]].map(a => w.eval('swKz("' + a[0] + '", ' + a[1] + ')')), [0.86, 1.0, 1.16, 1.4, 1.77, 0.72, 0.88, 1.18, 1.33], 0.011);
check('below 5 m Kz keeps the value at 5 m (Table 27-2 first row: B 0.59, C 0.86, D 1.04)', ['B', 'C', 'D'].map(e => w.eval('swKz("' + e + '", 2)')), [0.59, 0.86, 1.04], 0.011);
check('qz = 0.613 Kz Kzt Kd V2: V = 45 m/s, exposure C, h = 20 m: 0.613 x 1.158 x 0.85 x 2025 = 1221 N/m2; Kzt multiplies', [Math.round(sw({h: 20}).qh), Math.round(sw({h: 20, kzt: 1.2}).qh)], [1222, 1466], 1);
check('leeward wall Cp by L/B: 0 to 1 = -0.5, 2 = -0.3, 4 or more = -0.2, in between linear', [0.5, 1, 2, 3, 4, 6].map(l => w.eval('swLeeWall(' + l + ')')), [-0.5, -0.5, -0.3, -0.25, -0.2, -0.2], 0.001);
let r = sw({});
check('p = q G Cp - qi GCpi with G = 0.85, GCpi = +/-0.18: windward at the top (q = 1056 N/m2, Cp 0.8): 718 - 190 = 528 and 718 + 190 = 908 N/m2; leeward (L/B 0.75: Cp -0.5): -449 - 190 = -639 and -259; sides -0.7: -629 - 190 = -819', [r.wind[r.wind.length - 1].pPos, r.wind[r.wind.length - 1].pNeg, r.lee.pPos, r.lee.pNeg, r.side.pPos].map(Math.round), [528, 908, -639, -259, -819], 2);
check('partially enclosed buildings use GCpi = +/-0.55', [sw({encl: 'p'}).gcpi, Math.round(sw({encl: 'p'}).lee.pPos)], [0.55, -1029], 2);
check('horizontal force on the walls: h = 10 m, B = 40 m, V = 45 m/s, exposure C = 437.4 kN (windward 0.8 qz G + leeward 0.5 qh G), plus the leeward wall', [+sw({}).Fh.toFixed(1)], [437.4], 0.4);
check('flat roof Cp zones (0 - h/2, h/2 - h, h - 2h, beyond 2h): h/L <= 0.5: -0.9, -0.9, -0.5, -0.3; h/L >= 1.0: -1.3, -0.7, -0.7, -0.7; h/L = 0.75: -1.1, -0.8, -0.6, -0.5', [w.eval('swFlatRoof(0.4, 10)').map(z => z.cp), w.eval('swFlatRoof(1.5, 10)').map(z => z.cp), w.eval('swFlatRoof(0.75, 10)').map(z => z.cp)], [[-0.9, -0.9, -0.5, -0.3], [-1.3, -0.7, -0.7, -0.7], [-1.1, -0.8, -0.6, -0.5]], 0.001);
check('windward gable roof Cp: h/L 0.25 at 10 degrees -0.7 and -0.18; at 25 degrees -0.2 and 0.3; h/L 0.5 at 20 degrees -0.4 (no positive case); h/L 1.0 at 30 degrees -0.3 and 0.2; 12.5 degrees -0.6 and -0.09', [[0.25, 10], [0.25, 25], [0.5, 20], [1, 30], [0.25, 12.5]].map(a => { const x = w.eval('swWindRoof(' + a[0] + ', ' + a[1] + ')'); return [x.neg == null ? null : +x.neg.toFixed(2), x.pos == null ? null : +x.pos.toFixed(2)]; }), [[-0.7, -0.18], [-0.2, 0.3], [-0.4, null], [-0.3, 0.2], [-0.6, -0.09]], 0.001);
check('roofs steeper than 60 degrees: Cp = 0.01 theta (0.6 at 60, 0.7 at 70, at most 0.8)', [60, 70, 85].map(t => w.eval('swWindRoof(0.5, ' + t + ')').pos), [0.6, 0.7, 0.8], 0.001);
check('leeward roof Cp: h/L 0.25: -0.3 at 10, -0.5 at 15, -0.6 at 20 degrees; h/L 1.0: -0.7, -0.6, -0.6; 0.5: -0.5, -0.5, -0.6', [[0.25, 10], [0.25, 15], [0.25, 20], [1, 10], [1, 15], [1, 25], [0.5, 10], [0.5, 15], [0.5, 20]].map(a => w.eval('swLeeRoof(' + a[0] + ', ' + a[1] + ')')), [-0.3, -0.5, -0.6, -0.7, -0.6, -0.6, -0.5, -0.5, -0.6], 0.001);
check('a pitched roof (30 degrees) normal to the ridge has windward cases and a leeward case; parallel to the ridge uses the flat roof zones', [sw({th: 30}).roof.length, sw({th: 30}).flat, sw({th: 30, dir: 'par'}).roof.length, sw({th: 30, dir: 'par'}).flat, sw({th: 0}).roof.length], [3, false, 4, true, 4]);
check('the largest suction is on the windward edge of a flat roof: -0.9 x 0.85 x 1056 - 190 = -998 N/m2 for h/L 0.33 (cp -0.9)', [Math.round(sw({}).pMin)], [-998], 3);
w.renderCalc('sbcwind'); w.calcResult('sbcwind');
let tt = txt(w, 'sw_results');
check('the page opens with Kz 1.158, qh 1.221 kN/m2 and the 🔴 note', [tt.includes('1.158'), tt.includes('1.221 kN/m²'), tt.includes('🔴')], [true, true, true]);
setv(w, 'sw_th', 20); w.calcResult('sbcwind');
check('a 20 degree roof lists the two windward cases', [txt(w, 'sw_results').includes('الحالة 1'), txt(w, 'sw_results').includes('السقف المقابل للريح')], [true, true]);
check('other reference codes open it too', others('sbcwind', 'sw_results'), [true, true, true]);
}
// ---------- part 108: SBC 301 seismic design (`sbcseis`: Tables 11-1 to 11-4, 1-3, 12-1, 12-6, 12-7, equations 12-12 to 12-23) ----------
{
w = boot('intl'); doc = w.document;
const sysIx = n => w.eval('SS_SYS.findIndex(s => s[1] === ' + JSON.stringify(n) + ')');
const base = {Ss: 0.6, S1: 0.2, TL: 6, site: 'B', rc: 2, sys: sysIx('إطارات خرسانية خاصة مقاومة للعزم'), ct: 1, Tinp: 0, hn: 10, levels: [{h: 5, w: 5000}, {h: 10, w: 5000}]};
const ss = o => w.eval('ssCalc(' + JSON.stringify(Object.assign({}, base, o)) + ')');
check('Table 11-1 Fa for site class D: Ss 0.25 = 1.6, 0.5 = 1.4, 0.75 = 1.2, 1.0 = 1.1, 1.25 = 1.0; interpolated 0.3 = 1.56; class E at 0.25 = 2.5; class B always 1.0; class A 0.8', [0.25, 0.5, 0.75, 1, 1.25, 0.3].map(s => +ss({site: 'D', Ss: s}).Fa.toFixed(2)).concat([ss({site: 'E', Ss: 0.25}).Fa, ss({site: 'B', Ss: 0.9}).Fa, ss({site: 'A', Ss: 0.9}).Fa]), [1.6, 1.4, 1.2, 1.1, 1, 1.56, 2.5, 1, 0.8]);
check('Table 11-2 Fv for site class D: S1 0.1 = 2.4, 0.2 = 2.0, 0.3 = 1.8, 0.4 = 1.6, 0.5 = 1.5; 0.25 = 1.9; class E at 0.1 = 3.5 and at 0.5 = 2.4; class C at 0.1 = 1.7', [0.1, 0.2, 0.3, 0.4, 0.5, 0.25].map(s => +ss({site: 'D', S1: s}).Fv.toFixed(2)).concat([ss({site: 'E', S1: 0.1}).Fv, ss({site: 'E', S1: 0.5}).Fv, ss({site: 'C', S1: 0.1}).Fv]), [2.4, 2, 1.8, 1.6, 1.5, 1.9, 3.5, 2.4, 1.7]);
check('SDS = 2/3 Fa Ss and SD1 = 2/3 Fv S1: class B, Ss 0.6, S1 0.2 -> 0.4 and 0.1333', [+ss({}).SDS.toFixed(4), +ss({}).SD1.toFixed(4), +ss({}).SMS.toFixed(2)], [0.4, 0.1333, 0.6]);
check('Table 11-3 (risk I to III / IV): SDS 0.1 A / A; 0.2 B / C; 0.4 C / D; 0.6 D / D (class B, S1 very small)', [0.15, 0.3, 0.6, 0.9].map(s => [ss({Ss: s, S1: 0.01, rc: 2}).sdc, ss({Ss: s, S1: 0.01, rc: 4}).sdc].join('/')), ['A/A', 'B/C', 'C/D', 'D/D']);
check('Table 11-4 (risk I to III / IV): SD1 0.0667 A / A; 0.1 B / C; 0.1667 C / D; 0.267 D / D (small Ss)', [0.1, 0.15, 0.25, 0.4].map(s => [ss({Ss: 0.05, S1: s, rc: 2}).sdc, ss({Ss: 0.05, S1: s, rc: 4}).sdc].join('/')), ['A/A', 'B/C', 'C/D', 'D/D']);
check('S1 of 0.75 or more: category E (risk I to III) or F (risk IV)', [ss({S1: 0.8, rc: 2}).sdc, ss({S1: 0.8, rc: 4}).sdc], ['E', 'F']);
check('importance factor Ie: risk I 1.0, II 1.0, III 1.25, IV 1.5', [1, 2, 3, 4].map(r => ss({rc: r}).Ie), [1, 1, 1.25, 1.5]);
check('Table 12-6 Cu: SD1 0.4 and 0.3 = 1.4; 0.2 = 1.5; 0.15 = 1.6; 0.1 or less = 1.7; 0.25 = 1.45; 0.175 = 1.55; 0.125 = 1.65', [[0.4, 0.3, 0.25, 0.2, 0.175, 0.15, 0.125, 0.1, 0.05].map(sd => { const s1 = sd * 1.5; return +ss({site: 'B', Ss: 0.6, S1: s1}).Cu.toFixed(3); })][0], [1.4, 1.4, 1.45, 1.5, 1.55, 1.6, 1.65, 1.7, 1.7], 0.002);
let r = ss({});
check('Ta = Ct hn^x = 0.0466 x 10^0.9 = 0.370 s for a concrete moment frame; Cs0 = SDS / (R/Ie) = 0.4 / 6.5 = 0.0615 is the controlling value (the upper limit SD1 / (T R/Ie) = 0.0554); V = 0.0554 x 10000 = 554 kN', [+r.T.toFixed(3), +r.Cs0.toFixed(4), +r.up.toFixed(4), +r.Cs.toFixed(4), Math.round(r.V)], [0.37, 0.0615, 0.0554, 0.0554, 554], 0.001);
check('upper limit for a taller building (hn = 16 m, T = 0.565 s): Cs = SD1 / (T R) = 0.1333 / (0.565 x 6.5) = 0.0363', [+ss({hn: 16}).Cs.toFixed(4)], [0.0363], 0.0002);
check('long periods beyond TL use SD1 TL / (T2 R/Ie): TL = 0.3 s, T = 0.37 s -> 0.1333 x 0.3 / (0.37^2 x 6.5) = 0.0449', [+ss({TL: 0.3}).up.toFixed(4)], [0.0449], 0.0005);
check('minimum Cs = 0.044 SDS Ie but not under 0.01: SDS 0.05, R = 7 steel moment frame -> Cs = 0.01; for S1 of 0.6 or more at least 0.5 S1 / (R/Ie) = 0.0538 (S1 = 0.7, R = 6.5)', [+ss({Ss: 0.075, S1: 0.02, sys: sysIx('إطارات فولاذية خاصة مقاومة للعزم SMF'), ct: 0}).Cs.toFixed(4), +ss({S1: 0.7, Ss: 1.0, hn: 40}).lo2.toFixed(4), ss({S1: 0.7, Ss: 1.0, hn: 40}).Cs >= 0.0538 - 1e-9], [0.01, 0.0538, true], 0.0002);
check('an analysed period is limited to Cu x Ta: T = 2.0 s is capped at Cu x Ta = 1.633 x 0.370 = 0.605 s (SD1 = 0.1333); 0.45 s stays', [+ss({Tinp: 2}).T.toFixed(3), +ss({Tinp: 0.45}).T.toFixed(3)], [0.605, 0.45], 0.003);
check('vertical distribution exponent k: T <= 0.5 s -> 1, T >= 2.5 s -> 2, in between linear (T = 1.5 -> 1.5); the story forces add up to V and the shear at the base equals V', [ss({Tinp: 0.3}).k, ss({hn: 100}).k, ss({hn: 30, Tinp: 1.0}).k > 1, +(ss({}).F.reduce((a, b) => a + b, 0)).toFixed(1), +ss({}).Vx[0].toFixed(1)], [1, 2, true, +ss({}).V.toFixed(1), +ss({}).V.toFixed(1)], 0.1);
check('with k = 1 the forces follow the weight x height: 5000 x 5 : 5000 x 10 = 1 : 2 -> V/3 and 2V/3', [+(ss({}).F[0] / ss({}).V).toFixed(3), +(ss({}).F[1] / ss({}).V).toFixed(3)], [0.333, 0.667], 0.001);
check('Table 12-1 values as printed: concrete SMF R 6.5 / 3 / 5.5, steel SMF 7 / 3 / 5.5, special RC shear wall (bearing) 4 / 2.5 / 5, special RC shear wall (building frame) 5 / 2.5 / 5, steel OCBF 3 / 2 / 3.25, ordinary RC MF 2.5 / 3 / 2.5', [['إطارات خرسانية خاصة مقاومة للعزم', 0], ['إطارات فولاذية خاصة مقاومة للعزم SMF', 0], ['جدران خرسانية مسلحة خاصة', 0], ['جدران خرسانية مسلحة خاصة', 1], ['إطارات فولاذية عادية متمركزة OCBF', 0], ['إطارات خرسانية عادية', 0]].map(a => { const rows = w.eval('SS_SYS.filter(s => s[1] === ' + JSON.stringify(a[0]) + ')'); return [rows[a[1]][2], rows[a[1]][3], rows[a[1]][4]].join('/'); }), ['6.5/3/5.5', '7/3/5.5', '4/2.5/5', '5/2.5/5', '3/2/3.25', '2.5/3/2.5']);
check('height limits by category (m): special RC shear wall (bearing) not limited in B and C, 50 m in D and E, 30 m in F; steel OCBF 11 in D and not permitted in F; ordinary RC MF not permitted in C to F; SMF unlimited', [w.eval('SS_SYS[0][5]').map(x => x === Infinity ? 'NL' : x).join(','), w.eval('SS_SYS[' + sysIx('إطارات فولاذية عادية متمركزة OCBF') + '][5]').map(x => x === Infinity ? 'NL' : x).join(','), w.eval('SS_SYS[' + sysIx('إطارات خرسانية عادية') + '][5]').map(x => x === Infinity ? 'NL' : x).join(','), w.eval('SS_SYS[' + sysIx('إطارات فولاذية خاصة مقاومة للعزم SMF') + '][5]').map(x => x === Infinity ? 'NL' : x).join(',')], ['NL,NL,50,50,30', 'NL,NL,11,11,0', 'NL,0,0,0,0', 'NL,NL,NL,NL,NL']);
check('the actual height is checked against the limit of the category: a 10 m ordinary RC moment frame in category C is not permitted, a 60 m special RC shear wall (bearing) in category D exceeds 50 m', [ss({sys: sysIx('إطارات خرسانية عادية'), Ss: 0.6, S1: 0.2}).np, ss({sys: 0, hn: 60, Ss: 0.9, S1: 0.3}).hOk, ss({sys: 0, hn: 40, Ss: 0.9, S1: 0.3}).hOk, ss({sys: 0, hn: 60, Ss: 0.05, S1: 0.01}).hOk], [true, false, true, true]);
check('design spectrum Sa(T): SDS 0.4 and SD1 0.1333: T0 = 0.0667 s, Ts = 0.3333 s; Sa(0) = 0.4 x 0.4 = 0.16, plateau 0.4, 0.1333 / T after Ts, SD1 TL / T2 after TL', [+ss({}).T0.toFixed(4), +ss({}).Ts.toFixed(4), +ss({}).Sa0(0).toFixed(3), +ss({}).Sa0(0.2).toFixed(3), +ss({}).Sa0(1).toFixed(4), +ss({}).Sa0(8).toFixed(4)], [0.0667, 0.3333, 0.16, 0.4, 0.1333, 0.0125], 0.001);
check('the table has 59 seismic force-resisting systems', [w.eval('SS_SYS.length')], [59]);
w.renderCalc('sbcseis'); w.calcResult('sbcseis');
let tt = txt(w, 'ss_results');
check('the page opens with Fa 1.56, SDC C, V 653.4 kN and the 🔴 note', [tt.includes('1.56 و 2.40'), tt.includes('653.4 kN'), tt.includes('🔴')], [true, true, true]);
w.ssAddRow();
check('adding a level works', [w.document.querySelectorAll('#ss-tbody tr').length], [5]);
check('other reference codes open it too', others('sbcseis', 'ss_results'), [true, true, true]);
}
// ---------- part 109: SBC 304 column (`acicolumn`: 22.4, 21.2, 25.7, 6.2.5, 6.6.4) ----------
{
w = boot('intl'); doc = w.document;
const cl = o => w.eval('aclCalc(' + JSON.stringify(Object.assign({b: 400, h: 400, cover: 40, tie: 10, db: 20, nb: 3, nl: 3, fc: 28, fy: 420, spiral: false, Pu: 1500, M2: 120, M1: 60, sway: false, lu: 3000, k: 1, bd: 0.6, transv: false, ds: 1, M2s: 0, M2ns: 120}, o)) + ')');
let r = cl({});
check('400 x 400 with 8 bars of 20 mm: Ast = 2513 mm2 (rho 1.57 %), Po = 0.85 f\'c (Ag - Ast) + fy Ast = 4804 kN, phi Pn,max = 0.80 x 0.65 Po = 2498 kN', [Math.round(r.cv.Ast), +(r.rho * 100).toFixed(2), Math.round(r.cv.Po / 1000), Math.round(r.cv.phiPnMax / 1000), r.cv.L.length, r.nBars], [2513, 1.57, 4804, 2498, 3, 8], 1);
check('spiral columns: phi Pn,max = 0.85 x 0.75 Po = 3062 kN', [Math.round(cl({spiral: true}).cv.phiPnMax / 1000)], [3062], 2);
r = cl({b: 300, h: 500, nb: 2, nl: 2});
check('300 x 500 with 4 bars of 20 mm (two layers, d\' = 60): the balanced point (eps_t = 0.002, c = 264 mm): Pb = 1600 kN and Mb = 316 kN m (compression steel 420 MPa, tension steel 400 MPa)', [Math.round(r.cv.bal.c), Math.round(r.cv.bal.Pn / 1000), Math.round(r.cv.bal.Mn / 1e6)], [264, 1600, 316], 2);
check('phi at the balanced point is 0.65 (tied) and 0.75 (spiral); tension-controlled sections reach 0.90', [r.cv.bal.phi, cl({b: 300, h: 500, nb: 2, nl: 2, spiral: true}).cv.bal.phi, Math.max(...r.cv.cap.map(p => p.phi))], [0.65, 0.75, 0.9], 0.001);
r = cl({});
check('slenderness: kl/r = 3000 / (0.3 x 400) = 25 against 34 - 12 M1/M2 = 28 is a short column (delta 1, Mc = M2 = 120 kN m); M2,min = Pu (15 + 0.03 h) = 40.5 kN m', [r.klr, r.lim, r.slender, r.delta, Math.round(r.Mc / 1e6), +(r.M2min / 1e6).toFixed(1)], [25, 28, false, 1, 120, 40.5], 0.01);
r = cl({lu: 6000, M1: -60});
check('slender column bent in single curvature (kl/r = 50 > 40): EI = 0.4 Ec Ig / (1 + 0.6), Pc = 3635 kN, Cm = 0.8, delta = 0.8 / (1 - 1500 / (0.75 x 3635)) = 1.78, Mc = 1.78 x 120 = 213 kN m', [r.klr, r.lim, r.slender, Math.round(r.Pc / 1000), +r.delta.toFixed(2), Math.round(r.Mc / 1e6)], [50, 40, true, 3635, 1.78, 213], 2);
check('braced columns: the limit is capped at 40 (single curvature) and at 22 for sway frames; a transverse load takes Cm = 1.0', [cl({M1: -120}).lim, cl({sway: true}).lim, +cl({lu: 6000, M1: -60, transv: true}).delta.toFixed(2)], [40, 22, 2.22], 0.01);
check('a column close to its buckling load is unstable (Pu of 0.75 Pc): the magnifier is infinite and no capacity ratio is given', [cl({lu: 12000, M1: -60, Pu: 2000}).unstable, cl({lu: 12000, M1: -60, Pu: 2000}).cap], [true, null]);
check('sway frames: Mc = M2ns + delta_s M2s: 120 + 1.3 x 50 = 185 kN m for a slender sway column', [Math.round(cl({sway: true, lu: 6000, ds: 1.3, M2s: 50}).Mc / 1e6)], [185]);
r = cl({});
check('capacity on the ray of the same eccentricity (e = 80 mm): about 1895 kN and 152 kN m; Pu = 1500 gives a demand-to-capacity of 0.79; heavier loads fail', [Math.round(r.cap.P / 1000), Math.round(r.cap.M / 1e6), +(1500000 / r.cap.P).toFixed(2), 3000000 / cl({Pu: 3000}).cap.P > 1], [1895, 152, 0.79, true], 6);
check('limits: rho must be between 1 % and 8 % (4 bars of 12 mm in 400 x 400 = 0.28 % fails); ties 10 mm for bars up to 32 mm and 12 mm above; tie spacing min(16 db, 48 dtie, least dimension) = 320 mm', [cl({nb: 2, nl: 2, db: 12}).rhoOk, cl({}).rhoOk, cl({}).tieMin, cl({db: 36}).tieMin, cl({tie: 8}).tieOk, cl({}).sMax], [false, true, 10, 12, false, 320]);
w.renderCalc('acicolumn'); w.calcResult('acicolumn');
let tt = txt(w, 'acl_results');
check('the page opens with 1.57 %, 4804 kN, 2498 kN, 0.792 and the 🔴 note', [tt.includes('1.57%'), tt.includes('4804 kN'), tt.includes('2498 kN'), tt.includes('0.792'), tt.includes('🔴')], [true, true, true, true, true]);
check('the page draws the interaction diagram', [w.document.querySelector('#acl_results svg polyline') != null], [true]);
check('other reference codes open it too', others('acicolumn', 'acl_results'), [true, true, true]);
}
// ---------- part 110: SBC 304 isolated footing (`acifooting`: 22.5, 22.6, 13, 8.6.1.1) ----------
{
w = boot('intl'); doc = w.document;
const ft = o => w.eval('acfCalc(' + JSON.stringify(Object.assign({L: 2500, B: 2500, h: 600, cover: 75, db: 16, c1: 400, c2: 400, PD: 800, PL: 400, qa: 200, fc: 28, fy: 420, lam: 1, combo: 'sbc', pos: 'int'}, o)) + ')');
let r = ft({});
check('PD 800 + PL 400 on a 2.5 x 2.5 m footing: Pu = 1.4 x 800 + 1.7 x 400 = 1800 kN (1600 with 1.2D + 1.6L), service pressure 192 kPa, required area 1200 / 200 = 6.0 m2', [r.Pu, ft({combo: 'aci'}).Pu, r.qs, +r.AreqNet.toFixed(2), r.bearOk, ft({qa: 150}).bearOk], [1800, 1600, 192, 6, true, false]);
check('d = 600 - 75 - 8 = 517 mm; one-way shear at d from the face: Vu = 288 x 2.5 x 0.533 = 383.8 kN against phi Vc = 0.75 x 0.17 x sqrt(28) x 2500 x 517 = 872 kN', [r.d, +r.Vu1.toFixed(1), Math.round(r.Vc1), r.oneOk], [517, 383.8, 872, true], 0.2);
check('punching: bo = 4 (400 + 517) = 3668 mm, Vu = 1800 - 288 x 0.917^2 = 1558 kN, vu = 0.8215 MPa; vc = least of 0.33 sqrt(f\'c) = 1.746, 0.17 (1 + 2/1) sqrt(f\'c) = 2.699 and 0.083 (2 + 40 x 517 / 3668) sqrt(f\'c) = 3.35; phi vc = 1.31 MPa', [r.bo, +r.Vu.toFixed(0), +r.vu.toFixed(3), +r.vcA.toFixed(3), +r.vcB.toFixed(3), +r.vcC.toFixed(2), +r.phiVc.toFixed(2), r.twoOk], [3668, 1558, 0.821, 1.746, 2.699, 3.35, 1.31, true], 0.6);
check('a long thin column (800 x 200: beta = 4) is governed by 0.17 (1 + 2/beta) sqrt(f\'c) = 1.35 MPa; an edge column uses alpha_s 30 and a corner column 20 with shorter bo', [+ft({c1: 800, c2: 200}).vc.toFixed(2), ft({c1: 800, c2: 200}).beta, ft({pos: 'edge'}).as, ft({pos: 'corner'}).as, Math.round(ft({pos: 'edge'}).bo), ft({pos: 'corner'}).bo < ft({pos: 'edge'}).bo], [1.35, 4, 30, 20, Math.round(ft({pos: 'edge'}).bo), true], 0.01);
check('flexure at the column face: Mu = 288 x 2.5 x 1.05^2 / 2 = 396.9 kN m both ways; the steel from Rn is 2068 mm2 and the minimum 0.0018 x 2500 x 600 = 2700 mm2 governs: 14 bars of 16 mm at 181 mm', [+r.MuL.toFixed(1), +r.MuB.toFixed(1), Math.round(r.AsMinL), Math.round(r.AsL), r.nL, Math.round(r.spL)], [396.9, 396.9, 2700, 2700, 14, 181], 1);
check('a thinner footing is governed by the calculated steel: h = 400 with bars of 20 mm: d = 315 mm, As = 3466 mm2 above the minimum 1800 mm2', [Math.round(ft({h: 400, db: 20}).AsL), ft({h: 400, db: 20}).AsL > ft({h: 400, db: 20}).AsMinL], [3466, true], 25);
check('the short direction takes gamma_s = 2 / (L/B + 1) of the steel in the central band: L 3.0, B 2.0 -> 0.8', [+ft({L: 3000, B: 2000}).gs.toFixed(2), +ft({}).gs.toFixed(2)], [0.8, 1]);
check('development: db 16 uses 420 / (2.1 sqrt(f\'c)) x 16 = 605 mm (minimum 300); available (2500 - 400)/2 - 75 = 975 mm', [Math.round(r.ld), r.avail, r.devOk, Math.round(ft({db: 25}).ld)], [605, 975, true, 1167], 1);
check('minimum depth above the steel 150 mm: h = 200 with 75 mm cover fails (d = 117)', [ft({h: 200}).dOk, r.dOk], [false, true]);
w.renderCalc('acifooting'); w.calcResult('acifooting');
let tt = txt(w, 'acf_results');
check('the page opens with 1800 kN, 192.0 kPa, 872 kN and the 🔴 note', [tt.includes('1800 kN'), tt.includes('192.0 kPa'), tt.includes('872 kN'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('acifooting', 'acf_results'), [true, true, true]);
}
// ---------- part 111: SBC 304 one-way slab and beam (`acislab1`: Tables 7.3.1.1, 9.3.1.1, 7.6.1.1, 24.3.2, 24.4.3.2) ----------
{
w = boot('intl'); doc = w.document;
const sl = o => w.eval('acsCalc(' + JSON.stringify(Object.assign({kind: 'slab', sup: 2, span: 4000, fy: 420, fc: 28, wc: 0, h: 200, b: 300, cover: 30, db: 12, cc: 25, Mu: 30, Vu: 40, fs: 0, lam: 1}, o)) + ')');
check('slab minimum thickness (span 4000): simply supported l/20 = 200, one end continuous l/24 = 167, both ends l/28 = 143, cantilever l/10 = 400 mm', [0, 1, 2, 3].map(s => Math.round(sl({sup: s}).hmin)), [200, 167, 143, 400]);
check('beam minimum depth (span 4000): l/16 = 250, l/18.5 = 216, l/21 = 190, l/8 = 500 mm', [0, 1, 2, 3].map(s => Math.round(sl({kind: 'beam', sup: s}).hmin)), [250, 216, 190, 500]);
check('fy other than 420 multiplies by 0.4 + fy/700 (520 MPa: 1.143 -> 163 mm); lightweight 1440 - 1840 kg/m3 by 1.65 - 0.0003 wc but at least 1.09 (1500: 1.2 -> 171; 1840: 1.098 -> 157)', [Math.round(sl({fy: 520}).hmin), Math.round(sl({wc: 1500}).hmin), Math.round(sl({wc: 1840}).hmin), sl({fy: 420}).modFy], [163, 171, 157, 1]);
let r = sl({});
check('slab strip d = 200 - 30 - 6 = 164 mm; Mu = 30 kN m/m gives As = 497 mm2 (a = 20.9 mm, strain far above 0.005, phi 0.90) above the minimum 0.0018 x 1000 x 200 = 360 mm2', [r.d, Math.round(r.fl.As), r.fl.phi, Math.round(r.AsMin), Math.round(r.AsReq), r.fl.tc], [164, 497, 0.9, 360, 497, true], 1);
check('a shallow slab with a heavy moment is not tension-controlled: h = 120 with 50 kN m gives eps_t below 0.004 and is flagged', [sl({h: 120, Mu: 50}).fl.ok, sl({h: 120, Mu: 50}).fl.et < 0.004, sl({h: 120, Mu: 500}).AsReq], [false, true, null]);
check('crack control 24.3.2 with fs = 2/3 fy = 280: s = min(380 - 2.5 cc, 300) = 300 for cc = 25 and 255 for cc = 50; with fs = 350: min(380 x 0.8 - 2.5 x 25 = 241.5, 240) = 240', [sl({}).sCrack, sl({cc: 50}).sCrack, sl({fs: 350}).sCrack], [300, 255, 240], 0.01);
check('maximum bar spacing in slabs min(3h, 450, crack limit) and the bar spacing from the steel: 12 mm bars at 227 mm for 497 mm2 / m; for beams the crack limit alone; shrinkage steel 0.0020 below 420 MPa', [sl({}).sMax, sl({h: 100}).sMax, Math.floor(sl({}).sReq), sl({kind: 'beam'}).sMax, sl({fy: 350}).AsSt, sl({}).AsSt], [300, 300, 227, 300, 400, 360]);
check('beam minimum steel max(0.25 sqrt(f\'c)/fy, 1.4/fy) bw d = 0.003333 x 300 x 164 = 164 mm2; the slab one 0.0018 b h; shrinkage spacing at most min(5h, 450) = 450', [Math.round(sl({kind: 'beam'}).AsMin), Math.round(sl({}).AsMin), sl({}).sSt], [164, 360, 450]);
check('shear: phi Vc = 0.75 x 0.17 x sqrt(28) x 1000 x 164 = 110.6 kN per metre; 40 kN passes, 120 fails', [+r.phiVc.toFixed(1), sl({}).shearOk, sl({Vu: 120}).shearOk], [110.6, true, false], 0.1);
w.renderCalc('acislab1'); w.calcResult('acislab1');
let tt = txt(w, 'acs_results');
check('the page opens with 143 mm, 497 mm2, 360, 300 mm and the 🔴 note', [tt.includes('143 mm'), tt.includes('497 mm²'), tt.includes('360'), tt.includes('300 mm'), tt.includes('🔴')], [true, true, true, true, true]);
check('other reference codes open it too', others('acislab1', 'acs_results'), [true, true, true]);
}
// ---------- part 112: SBC 304 two-way slab (`acislab2`: Tables 8.3.1.1, 8.3.1.2, 22.6.5.2, 8.6.1.1) ----------
{
w = boot('intl'); doc = w.document;
const s2 = o => w.eval('ac2Calc(' + JSON.stringify(Object.assign({beams: false, panel: 'int', drop: false, ln: 6000, fy: 420, fc: 28, afm: 0, beta: 1, h: 220, cover: 25, db: 12, c1: 400, c2: 400, pos: 'int', Vu: 450, Munb: 0, lam: 1}, o)) + ')');
check('Table 8.3.1.1 (fy 420, ln 6000): interior without drops ln/33 = 182; exterior without edge beams ln/30 = 200; exterior with edge beams ln/33 = 182; with drop panels: interior ln/36 = 167, exterior ln/33 = 182, with edge beams ln/36 = 167', [s2({}), s2({panel: 'ext'}), s2({panel: 'ext-beam'}), s2({drop: true}), s2({drop: true, panel: 'ext'}), s2({drop: true, panel: 'ext-beam'})].map(r => Math.round(r.hmin)), [182, 200, 182, 167, 182, 167]);
check('other yield strengths: 280 MPa interior ln/36 = 167; 520 MPa ln/31 = 194; 350 MPa by interpolation 174', [280, 520, 350].map(f => Math.round(s2({fy: f}).hmin)), [167, 194, 174]);
check('slabs with beams (Table 8.3.1.2): afm <= 0.2 uses 8.3.1.1; afm = 1.0 and beta = 1: ln (0.8 + fy/1400) / (36 + 5 beta (afm - 0.2)) = 165; afm above 2.0: ln (0.8 + fy/1400) / (36 + 9 beta) = 147; not under 125 / 90 mm', [Math.round(s2({beams: true, afm: 0.1}).hmin), Math.round(s2({beams: true, afm: 1}).hmin), Math.round(s2({beams: true, afm: 2.5}).hmin), Math.round(s2({beams: true, afm: 1, ln: 3000}).hmin), Math.round(s2({beams: true, afm: 2.5, ln: 3000}).hmin)], [182, 165, 147, 125, 90]);
let r = s2({});
check('punching of an interior column 400 x 400, d = 220 - 25 - 12 = 183: bo = 2 (583 + 583) = 2332, vc = 1.746 (0.33 sqrt(f\'c)) against 2.699 and 2.257, phi vc = 1.31 MPa; Vu = 450 kN -> vu = 1.054 MPa passes', [r.d, r.bo, +r.vcA.toFixed(3), +r.vcB.toFixed(3), +r.vcC.toFixed(3), +r.phiVc.toFixed(2), +r.vu.toFixed(3), r.shearOk, r.vcGov], [183, 2332, 1.746, 2.699, 2.257, 1.31, 1.054, true, 'a'], 0.02);
check('edge column: bo = 2 (400 + d/2) + (400 + d) = 1566 mm with alpha_s 30; corner: 983 mm with alpha_s 20; a heavier load fails', [Math.round(s2({pos: 'edge'}).bo), Math.round(s2({pos: 'corner'}).bo), s2({pos: 'edge'}).as, s2({pos: 'corner'}).as, s2({Vu: 800}).shearOk], [1566, 983, 30, 20, false]);
check('unbalanced moment in an interior column: gamma_v = 1 - 1 / (1 + 2/3 sqrt(b1/b2)) = 0.4; Munb = 60 kN m adds gamma_v Munb c_AB / Jc = 0.282 MPa', [+r.gv.toFixed(2), +s2({Munb: 60}).vMom.toFixed(3), +s2({Munb: 60}).vu.toFixed(3)], [0.4, 0.282, 1.336], 0.004);
check('minimum steel 0.0018 x 1000 x 220 = 396 mm2/m (0.0020 below 420 MPa); spacing at most 2h = 440 mm', [Math.round(r.AsMin), Math.round(s2({fy: 350}).AsMin), r.sMax], [396, 440, 440]);
w.renderCalc('acislab2'); w.calcResult('acislab2');
let tt = txt(w, 'ac2_results');
check('the page opens with 182 mm, 2332 mm, 1.054 MPa and the 🔴 note', [tt.includes('182 mm'), tt.includes('2332 mm'), tt.includes('1.054 MPa'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('acislab2', 'ac2_results'), [true, true, true]);
}
// ---------- part 113: SBC 304 development and splice lengths (`acidev`: 25.4, 25.5) ----------
{
w = boot('intl'); doc = w.document;
const dv = o => w.eval('acdCalc(' + JSON.stringify(Object.assign({db: 20, fy: 420, fc: 28, lam: 1, top: false, coat: 'none', good: true, method: 'simple', cb: 40, Ktr: 0, psic: 1, psir: 1, confd: false, asRatio: 1, pct: 100}, o)) + ')');
check('tension, Table 25.4.2.2 (good spacing and cover): bars up to 20 mm fy db / (2.1 sqrt(f\'c)) = 756 mm; 22 mm and larger / 1.7: 22 mm 1027, 25 mm 1167; other cases / 1.4 and / 1.1: 20 mm 1134, 25 mm 1804', [dv({}).ld, dv({db: 22}).ld, dv({db: 25}).ld, dv({good: false}).ld, dv({db: 25, good: false}).ld].map(Math.round), [756, 1027, 1167, 1134, 1804]);
check('modifiers: top bars 1.3 -> 983; epoxy 1.5 -> 1134; both capped at 1.7 -> 1285; epoxy 1.2 -> 907; lightweight 0.75 -> 1008; a minimum of 300 mm; sqrt(f\'c) capped at 8.3 MPa (f\'c 100 -> 482 mm)', [dv({top: true}).ld, dv({coat: 'e15'}).ld, dv({top: true, coat: 'e15'}).ld, dv({coat: 'e12'}).ld, dv({lam: 0.75}).ld, dv({db: 10, fy: 280}).ld, dv({fc: 100}).ld].map(Math.round), [983, 1134, 1285, 907, 1008, 300, 482]);
check('equation 25.4.2.3a with cb = 40 mm, Ktr = 0: (cb + Ktr)/db = 2.0, psi_s = 0.8 for 20 mm bars: 420 x 0.8 / (1.1 x 5.2915 x 2.0) x 20 = 577 mm; the confinement term is capped at 2.5 (cb 60: 462 mm); 22 mm bars have psi_s = 1.0', [dv({}).ldF, dv({cb: 60}).ldF, dv({db: 22, cb: 44}).ldF, dv({method: 'full'}).ld].map(Math.round), [577, 462, 794, 577]);
check('standard hook: 0.24 fy psi_e psi_c psi_r db / (lambda sqrt(f\'c)) = 381 mm (minimum 8 db and 150 mm); epoxy 1.2 -> 457; side cover 0.7 x confined 0.8 -> 213', [dv({}).ldh, dv({coat: 'e12'}).ldh, dv({psic: 0.7, psir: 0.8}).ldh].map(Math.round), [381, 457, 213], 1);
check('headed bar: 0.19 fy psi_e db / sqrt(f\'c) = 302 mm (not permitted above fy 420, 36 mm bars or f\'c 40 MPa)', [Math.round(dv({}).ldt), dv({fy: 500}).ldt, dv({db: 40}).ldt, dv({fc: 45}).ldt], [302, null, null, null], 1);
check('compression: max(0.24 fy / (lambda sqrt(f\'c)), 0.043 fy) db = 381 mm; confined by a spiral or close ties (0.75) 286 mm; at least 200 mm', [dv({}).ldc, dv({confd: true}).ldc, dv({db: 10, confd: true}).ldc].map(Math.round), [381, 286, 200]);
check('lap splices in tension (Table 25.5.2.1): class A 1.0 ld when As,provided / As,required >= 2 and at most 50 % spliced (756 mm), class B 1.3 ld otherwise (983 mm); compression 0.071 fy db (596 mm), (0.13 fy - 24) db above 420 MPa (820 mm at 500), 300 mm minimum, one third more for f\'c below 21 MPa', [dv({asRatio: 2.1, pct: 50}).lst, dv({asRatio: 2.1, pct: 100}).lst, dv({}).lst, dv({}).lsc, dv({fy: 500}).lsc, dv({db: 10}).lsc, dv({fc: 20}).lsc].map(Math.round), [756, 983, 983, 596, 820, 300, 795]);
w.renderCalc('acidev'); w.calcResult('acidev');
let tt = txt(w, 'acd_results');
check('the page opens with 756 mm, 381 mm, 983 mm, 596 mm and the 🔴 note', [tt.includes('756 mm'), tt.includes('381 mm'), tt.includes('983 mm'), tt.includes('596 mm'), tt.includes('🔴')], [true, true, true, true, true]);
check('other reference codes open it too', others('acidev', 'acd_results'), [true, true, true]);
}
// ---------- part 114: SBC 304 deflection (`acidefl`: 24.2.3.5, 24.2.4.1.1, Table 24.2.2) ----------
{
w = boot('intl'); doc = w.document;
const df = o => w.eval('acxCalc(' + JSON.stringify(Object.assign({b: 300, h: 500, d: 450, As: 1200, Asc: 0, dc: 50, fc: 28, lam: 1, span: 6000, sup: 0, wD: 15, wL: 8, sus: 0.3, xi: 2, lim: 1}, o)) + ')');
let r = df({});
check('Ec = 4700 sqrt(f\'c) = 24870 MPa, fr = 0.62 sqrt(f\'c) = 3.28 MPa, Mcr = fr Ig / yt = 41.0 kN m, n = 8.04, neutral axis of the cracked section 141 mm, Icr = 1202 x 10^6 mm4', [Math.round(r.Ec), +r.fr.toFixed(2), +(r.Mcr / 1e6).toFixed(1), +r.n.toFixed(2), Math.round(r.x), Math.round(r.Icr / 1e6)], [24870, 3.28, 41, 8.04, 141, 1202], 1);
check('moments (simple span wl2/8): dead 67.5 kN m, total 103.5 kN m; Ie = (Mcr/Ma)3 Ig + [1 - (Mcr/Ma)3] Icr: 1633 and 1321 x 10^6 mm4', [+r.Ma.D.toFixed(1), +r.Ma.T.toFixed(1), Math.round(r.IeD / 1e6), Math.round(r.IeT / 1e6), r.cracked], [67.5, 103.5, 1633, 1321, true], 1);
check('immediate deflections 5 w l4 / (384 Ec Ie): dead 6.2 mm, dead + live 11.8 mm, live 5.6 mm; sustained load (D + 30 % of L): 8.0 mm', [+r.dD.toFixed(1), +r.dT.toFixed(1), +r.dL.toFixed(1), +r.dS.toFixed(1)], [6.2, 11.8, 5.6, 8], 0.1);
check('long term: lambda = xi / (1 + 50 rho\') = 2.0, additional 2.0 x 8.0 = 16.0 mm; total 27.8 mm; after attachment of non-structural elements 16.0 + (11.8 - 8.0) = 19.8 mm', [r.lam, +r.dLong.toFixed(1), +r.dTot.toFixed(1), +r.dAfter.toFixed(1)], [2, 16, 27.8, 19.8], 0.2);
check('compression steel reduces lambda: 600 mm2 -> rho\' = 0.444 % -> lambda = 2 / 1.222 = 1.64; xi = 1.2 for six months; the sustained duration table 1.0 / 1.2 / 1.4 / 2.0', [+df({Asc: 600}).lam.toFixed(2), df({xi: 1.2}).lam], [1.64, 1.2], 0.01);
check('limits of Table 24.2.2: floors l/360 = 16.7 mm on the live deflection passes; elements likely to be damaged l/480 = 12.5 mm on the part after attachment (19.8 mm) fails; not likely to be damaged l/240 = 25 mm passes; flat roofs l/180 = 33.3 mm', [df({lim: 1}).ok, df({lim: 2}).ok, df({lim: 3}).ok, df({lim: 0}).ok, +df({lim: 2}).allow.toFixed(1), +df({lim: 3}).allow.toFixed(1)], [true, false, true, true, 12.5, 25]);
check('an uncracked beam (small loads: Ma below Mcr) uses Ig: wD 2, wL 1 -> 0.65 mm; cantilever 1/8: a 3 m cantilever with 10 kN/m deflects wl4/8EI = 0.13 mm', [+df({wD: 2, wL: 1}).dT.toFixed(2), df({wD: 2, wL: 1}).cracked, +df({sup: 3, span: 3000, wD: 1, wL: 0}).dD.toFixed(2)], [0.65, false, 0.13], 0.01);
w.renderCalc('acidefl'); w.calcResult('acidefl');
let tt = txt(w, 'acx_results');
check('the page opens with Mcr 41.0, 6.2 mm, 5.6 mm, 27.8 mm and the 🔴 note', [tt.includes('41.0 kN'), tt.includes('6.2 mm'), tt.includes('5.6 mm'), tt.includes('27.8 mm'), tt.includes('🔴')], [true, true, true, true, true]);
check('other reference codes open it too', others('acidefl', 'acx_results'), [true, true, true]);
}
// ---------- part 115: SBC 303 foundations (`sbcfound`: Table 4-1, 4.3, 5.2, 5.4, 5.5, Tables 5-1 and 5-2) ----------
{
w = boot('intl'); doc = w.document;
const fd = o => w.eval('sfdCalc(' + JSON.stringify(Object.assign({soil: 3, third: false, L: 2.5, B: 2.5, D: 1.5, P: 600, M: 0, DL: 450, V: 0, H: 0, Pv: 0, Ph: 0, mat: false, settT: 0, settD: 0, span: 0, dist: 2, perm: true, Pole: {P: 0, h: 2, b: 0.4, dbl: false}}, o)) + ')');
check('Table 4-1 (vertical kPa / lateral kPa per m / friction / cohesion): crystalline bedrock 600 / 200 / 0.70; sedimentary rock 200 / 60 / 0.35; gravel 150 / 30 / 0.35; sand 100 / 25 / 0.25; clay 75 / 15 / - / 6', [0, 1, 2, 3, 4].map(s => { const x = fd({soil: s}).s; return [x[1], x[2], x[3], x[4]].join('/'); }), ['600/200/0.7/0', '200/60/0.35/0', '150/30/0.35/0', '100/25/0.25/0', '75/15/0/6']);
let r = fd({});
check('sand, 600 kN on 2.5 x 2.5 m: pressure 96 kPa under the 100 kPa; with the one-third increase for wind or earthquake 133 kPa; required area 6.0 m2; fails at 700 kN', [r.qmax, r.bearOk, +fd({third: true}).qa.toFixed(1), +r.AreqAdm.toFixed(2), fd({P: 700}).bearOk], [96, true, 133.3, 6, false], 0.05);
check('eccentricity: e = M/P: 60 / 600 = 0.1 m (e/L 0.04): qmax = 96 (1 + 6 e / L) = 119 kPa; 0.5 m exceeds L/6 and is flagged; effective length L - 2e', [+fd({M: 60}).e.toFixed(2), +fd({M: 60}).qmax.toFixed(1), fd({M: 60}).eOk, fd({M: 300}).eOk, +fd({M: 60}).Beff.toFixed(2)], [0.1, 119, true, false, 2.3], 0.1);
check('minimum depth below natural ground: rock 0.6 m, cohesionless soil 1.2 m, silt and clay 1.5 m; minimum width 0.30 m', [fd({soil: 0}).minD, fd({soil: 3}).minD, fd({soil: 4}).minD, fd({soil: 3, D: 1.1}).depthOk, fd({soil: 4, D: 1.5}).depthOk, fd({B: 0.25}).widthOk], [0.6, 1.2, 1.5, false, true, false]);
check('lateral bearing grows with depth by the tabular value per metre (25 kPa/m x 1.5 m = 37.5 kPa) up to 15 times the value; passive resistance 0.5 x 37.5 x 1.5 x 2.5 = 70 kN; sliding 0.25 x 450 = 112.5 kN', [r.pAt, fd({D: 20}).pAt, Math.round(r.Hpass), r.slideCap], [37.5, 375, 70, 112.5], 0.5);
check('clay: sliding = cohesion 6 kPa x 6.25 m2 = 37.5 kN, never above half of the dead load (225 kN); friction soils have no such limit', [fd({soil: 4}).slideCap, fd({soil: 4, DL: 50}).slideCap, fd({soil: 3, DL: 450}).slideCap], [37.5, 25, 112.5]);
check('inclined loads V/Pv + H/Ph < 1: 100 / 200 + 20 / 60 = 0.83 passes, 30 / 60 gives 1.0 and fails', [+fd({V: 100, Pv: 200, H: 20, Ph: 60}).Vv.toFixed(2), fd({V: 100, Pv: 200, H: 20, Ph: 60}).incOk, fd({V: 100, Pv: 200, H: 30, Ph: 60}).incOk], [0.83, true, false]);
check('settlement: spread footings 60 mm on clay and 40 mm on sand, mats 80 and 60; angular distortion by structure type (0.0015 mat concrete, 0.008 steel frames, 0.002 cladding, 0.003 lift rails)', [fd({soil: 3, settT: 40}).settOk, fd({soil: 3, settT: 41}).settOk, fd({soil: 4, settT: 60}).settOk, fd({soil: 4, mat: true, settT: 80}).settOk, fd({soil: 3, mat: true, settT: 61}).settOk, fd({settD: 10, span: 5000}).distOk, fd({settD: 11, span: 5000}).distOk, [0, 1, 2, 6].map(k => fd({dist: k}).dist)], [true, false, true, true, false, true, false, [0.0015, 0.008, 0.002, 0.003]], 0.0001);
let pl = fd({Pole: {P: 10, h: 2, b: 0.4, dbl: false}});
check('embedded pole 10 kN at 2 m, 0.4 m diameter, sand (25 kPa/m): nonconstrained d = 0.5 A {1 + [1 + 4.36 h / A]^0.5} with A = 2.34 P / (S1 b) ~ 3.4 m; constrained d2 = 4.25 P h / (S3 b) ~ 2.04 m; doubling the pressure (4.3.5) shortens both', [+pl.dNon.toFixed(2), +pl.dCon.toFixed(2), fd({Pole: {P: 10, h: 2, b: 0.4, dbl: true}}).dNon < pl.dNon, fd({Pole: {P: 10, h: 2, b: 0.4, dbl: true}}).dCon < pl.dCon, fd({}).dNon], [3.4, 2.04, true, true, null], 0.08);
w.renderCalc('sbcfound'); w.calcResult('sbcfound');
let tt = txt(w, 'sfd_results');
check('the page opens with 100 kPa, 96.0 kPa, 1.20 m and the 🔴 note', [tt.includes('100 kPa'), tt.includes('96.0 kPa'), tt.includes('1.20 m'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('sbcfound', 'sfd_results'), [true, true, true]);
}
// ---------- part 116: SBC 303 retaining wall (`sbcretain`: 7.2 - 7.5, Table 7-2, equation 7-1) ----------
{
w = boot('intl'); doc = w.document;
const rw = o => w.eval('srwCalc(' + JSON.stringify(Object.assign({Hs: 3, hb: 0.5, tt: 0.3, tb: 0.5, Lt: 0.8, Lh: 2.0, Df: 1.0, gam: 18, phi: 30, beta: 0, q: 10, rest: false, hw: 0, gsat: 20, tand: 0.5, phib: 30, cb: 0, qa: 150, cohesive: false, rock: false, kh: 0, kv: 0}, o)) + ')');
check('Rankine Ka = (1/3) at phi 30, 0.271 at 35, 0.350 at 30 with a 10 degree slope; at-rest K0 = 1 - sin phi = 0.5', [w.eval('srwKa(30, 0)'), w.eval('srwKa(35, 0)'), w.eval('srwKa(30, 10)')].map(x => +x.toFixed(3)).concat([rw({rest: true}).K]), [0.333, 0.271, 0.35, 0.5], 0.001);
let r = rw({});
check('H = 3.5 m, gamma 18, surcharge 10: Pa = 1/2 Ka gamma H2 + Ka q H = 36.75 + 11.67 = 48.4 kN/m acting 1.307 m above the base', [+r.Pa.toFixed(1), +r.ha.toFixed(3), +r.K.toFixed(3)], [48.4, 1.307, 0.333], 0.05);
check('the vertical forces: base 39.6, stem rectangle 21.6 and triangle 7.2, heel soil 108, surcharge 20, toe soil 7.2 kN/m -> V = 203.6; stabilizing moment 394.2 kN m about the toe', [r.items.map(x => +x[1].toFixed(1)).slice(0, 6), +r.V.toFixed(1), +r.Mr.toFixed(1)], [[39.6, 21.6, 7.2, 108, 0, 20], 203.6, 394.2], 0.1);
check('overturning FS = 394.2 / 63.3 = 6.23 (needs 1.5); sliding FS = V tan(delta) / Pa with tan delta limited to tan(2/3 phi) = 0.364: 74.1 / 48.4 = 1.53 (needs 1.5)', [+r.FSot.toFixed(2), +r.tand.toFixed(3), +r.FSsl.toFixed(2), r.otOk, r.slOk], [6.23, 0.364, 1.53, true, true], 0.03);
check('resultant 1.625 m from the toe: e = 0.025 m within B/6 = 0.55 m; pressures 64.5 / 58.9 kPa under the 150 kPa allowed; a rock site uses the middle half (B/4)', [+r.x.toFixed(3), +r.e.toFixed(3), +r.lim.toFixed(2), +r.qmax.toFixed(1), +r.qmin.toFixed(1), r.midOk, rw({rock: true}).lim], [1.625, 0.025, 0.55, 64.5, 58.9, true, 0.825], 0.05);
check('cohesive backfill requires a sliding factor of 2.0 (the wall fails: 1.53); a shorter heel fails the 1.5 limit; an earthquake with kh = 0.15 lowers the limits to 1.1', [rw({cohesive: true}).slOk, rw({cohesive: true}).fsSL, rw({Lh: 1}).slOk, rw({kh: 0.15}).fsSL, rw({kh: 0.15}).fsOT], [false, 2, false, 1.1, 1.1]);
check('Mononobe-Okabe: phi 30, kh 0.15 -> psi 8.53 degrees, Kae = 0.433, PAE = 1/2 gamma H2 (1 - kv) Kae = 47.7, dynamic increment 11.0 kN/m acting at 0.6 H', [+rw({kh: 0.15}).Kae.toFixed(3), +rw({kh: 0.15}).dPae.toFixed(1), rw({}).dPae, rw({kh: 0.15}).FSsl < r.FSsl], [0.433, 11, 0, true], 0.1);
check('groundwater (1.5 m of water behind the wall) adds hydrostatic pressure and base uplift: sliding and overturning drop', [rw({hw: 1.5}).Pa > r.Pa, rw({hw: 1.5}).U > 0, rw({hw: 1.5}).FSsl < r.FSsl, rw({hw: 1.5}).FSot < r.FSot], [true, true, true, true]);
check('stem base: service Ps = 37 kN/m and Ms = 42 kN m/m; factored 1.6 H: 59.2 and 67.2; minimum top thickness 0.30 m and base depth 1.0 m in front of the wall', [+r.Ps.toFixed(1), +r.Ms.toFixed(1), +r.Vus.toFixed(1), +r.Mus.toFixed(1), rw({tt: 0.25}).topOk, rw({Df: 0.8}).depthOk], [37, 42, 59.2, 67.2, false, false], 0.1);
w.renderCalc('sbcretain'); w.calcResult('sbcretain');
let tt = txt(w, 'srw_results');
check('the page opens with K 0.333, Pa 48.4, FS 6.23 and 1.53 and the 🔴 note', [tt.includes('0.333'), tt.includes('48.4 kN/m'), tt.includes('6.23'), tt.includes('1.53'), tt.includes('🔴')], [true, true, true, true, true]);
check('other reference codes open it too', others('sbcretain', 'srw_results'), [true, true, true]);
}
// ---------- part 117: SBC 305 masonry, allowable stress design (`masonasd`: 8.1.5, 8.1.6.3, 8.2, 8.3, Table 8.1) ----------
{
w = boot('intl'); doc = w.document;
const base = {fm: 10, clay: false, mort: 0, bond: 0, cg: false, sec: 3, gf: 0.5, kA: 0.55, kI: 0.75, dir: 0, b: 1000, t: 190, h: 3000, col: false, reinf: false, As: 159, d: 95, Fs: 220, fy: 420, db: 13, K: 70, Av: 0, s: 400, special: false, shearWall: false, P: 60, M: 2.5, V: 5, Anv: 0, dv: 0};
const ma = o => w.eval('msaCalc(' + JSON.stringify(Object.assign({}, base, o)) + ')');
const ten = o => w.eval('msnTen(MSN_FT, ' + JSON.stringify(Object.assign({}, base, o)) + ')');
let r = ma({});
check('190 mm fully grouted wall, f\'m 10 MPa, h 3 m: An = 190000 mm2, In = 571.6 x 10^6 mm4, r = 54.85 mm, h/r = 54.7; Em = 900 f\'m = 9000 MPa; Fa = 0.25 f\'m [1 - (h/140r)2] = 2.118 MPa (8-16), Fb = f\'m/3 = 3.333 MPa', [r.p.An, Math.round(r.p.In / 1e6 * 10) / 10, +r.p.r.toFixed(2), +r.hr.toFixed(1), r.Em, +r.Fa.toFixed(3), +r.Fb.toFixed(3)], [190000, 571.6, 54.85, 54.7, 9000, 2.118, 3.333], 0.01);
check('P 60 kN, M 2.5 kN m: fa = 0.316, fb = M/S = 0.4155 MPa; interaction fa/Fa + fb/Fb = 0.149 + 0.125 = 0.274 (8-14); e = 41.7 mm, e/r = 0.760 -> Pe = pi2 Em In/h2 (1 - 0.577 e/r)3 = 999.4 kN and Pe/4 = 249.8 kN (8-19, 8-15)', [+r.fa.toFixed(4), +r.fb.toFixed(4), +r.inter.toFixed(3), +r.e.toFixed(1), +(r.Pe / 1000).toFixed(1), r.interOk, r.PeOk], [0.3158, 0.4155, 0.274, 41.7, 999.4, true, true], 0.5);
check('flexural tension ft = fb - fa = 0.100 MPa against Table 8.1 normal to bed joints, fully grouted, mortar M or S: 448 kPa; fv = 1.5 V / Anv = 0.0395 MPa against the lowest of 0.125 sqrt(f\'m) = 0.395, 0.827 and 0.414 + 0.45 N/An = 0.556 MPa (8.2.6.2)', [+r.ft.toFixed(3), r.ten, +r.fv.toFixed(4), +r.shLim.toFixed(3), r.shBy, r.ok], [0.1, 0.448, 0.0395, 0.395, '0.125√f′m', true], 0.001);
check('Table 8.1 (kPa) normal to bed joints, mortar PC/lime M or S: solid 366, hollow ungrouted 228, fully grouted 448, half grouted 228 + 0.5 (448 - 228) = 338; mortar N with masonry cement 138 / 83 / 400', [ten({sec: 0}), ten({sec: 1}), ten({sec: 3}), ten({sec: 2, gf: 0.5}), ten({sec: 0, mort: 3}), ten({sec: 1, mort: 3}), ten({sec: 3, mort: 3})], [366, 228, 448, 338, 138, 83, 400]);
check('parallel to bed joints, running bond: solid 731, hollow ungrouted or partially grouted 455, fully grouted 731 (mortar M or S); mortar S with masonry cement 441; stack bond has 0 unless a continuous grout section exists (917)', [ten({dir: 1, sec: 0}), ten({dir: 1, sec: 1}), ten({dir: 1, sec: 2}), ten({dir: 1, sec: 3}), ten({dir: 1, sec: 3, mort: 2}), ten({dir: 1, bond: 1}), ten({dir: 1, bond: 2, cg: true})], [731, 455, 455, 731, 441, 0, 917]);
let u = ma({sec: 1});
check('hollow ungrouted with An/Ag 0.55 and In/Ig 0.75: An = 104500 mm2, In = 428.7 x 10^6 mm4; half grouted: An = 147250 mm2; the allowable tension of the ungrouted wall is 228 kPa', [u.p.An, Math.round(u.p.In / 1e5) / 10, ma({sec: 2}).p.An, u.ten], [104500, 428.7, 147250, 0.228], 0.01);
check('shear limits of 8.2.6.2: running bond not fully grouted 0.255 + 0.45 N/An; stack bond open-end units fully grouted 0.255 + ...; stack bond other units fully grouted 103 kPa; stack bond not fully grouted has only (a) and (b)', [ma({sec: 1, P: 0, V: 1}).shBy, ma({bond: 2, P: 0, V: 1}).shBy, +ma({bond: 2, P: 0, V: 1}).shLim.toFixed(3), ma({bond: 1, sec: 1, P: 0, V: 1}).shNoExtra, ma({bond: 1, sec: 1, V: 1}).shBy], ['0.255 + 0.45N/A', '0.103 MPa', 0.103, true, '0.125√f′m']);
check('slender wall h/r above 99 uses Fa = 0.25 f\'m (70 r / h)2: h = 6000 on 150 mm: r = 43.3 mm, h/r = 138.6 -> Fa = 2.5 x (70 x 43.3 / 6000)2 = 0.638 MPa', [+ma({t: 150, h: 6000}).Fa.toFixed(3), +ma({t: 150, h: 6000}).hr.toFixed(1), +ma({t: 150, h: 6000}).p.r.toFixed(1)], [0.638, 138.6, 43.3], 0.002);
let q = ma({reinf: true, P: 0, M: 3});
check('reinforced strip, no axial load, M = 3 kN m, As = 159 mm2, d = 95: n = 22.2, neutral axis c = 22.6 mm, fb = 2M / (b c (d - c/3)) = 3.03 MPa < 0.45 f\'m = 4.5, fs = n fb (d - c)/c = 215.7 MPa < Fs = 220', [+q.n.toFixed(1), +q.c.toFixed(1), +q.fbm.toFixed(2), +q.fs.toFixed(1), q.fmOk, q.fsOk], [22.2, 22.6, 3.03, 215.7, true, true], 0.1);
let k = ma({reinf: true, b: 1000, t: 300, d: 250, As: 500, P: 50, M: 15});
const eq1 = 0.5 * k.fbm * 1000 * k.c - 500 * k.fs - 50000, eq2 = 0.5 * k.fbm * 1000 * k.c * (250 - k.c / 3) - (15e6 + 50000 * (250 - 150));
check('cracked section with axial load (b 1000, t 300, d 250, As 500, P 50 kN, M 15 kN m, e = 300 mm): equilibrium C - T = P and the moment about the steel are satisfied, fs = n fb (d - c)/c', [k.mode, Math.abs(eq1) < 5, Math.abs(eq2) < 2e3, Math.abs(k.fs - k.n * k.fbm * (250 - k.c) / k.c) < 1e-6], ['cracked', true, true, true]);
check('compression-only fallback: bars at mid-depth (d = t/2) with e above t/6 are in compression and neglected (8.3.2 d): c = 3 (t/2 - e), fs = 0; e <= t/6 is uncracked', [ma({reinf: true}).mode, ma({reinf: true}).fs, +ma({reinf: true}).c.toFixed(1), ma({reinf: true, M: 1}).mode], ['masonry-only', 0, 160, 'uncracked'], 0.1);
check('axial capacity Pa = (0.25 f\'m An + 0.65 Ast Fs)[1 - (h/140r)2] = 421.8 kN (8-21); a column uses at least e = 0.1 t = 19 mm: M = 60 x 0.019 = 1.14 kN m even for M = 0', [+(ma({reinf: true}).Pa / 1000).toFixed(1), +(ma({reinf: true, col: true, M: 0}).M / 1e6).toFixed(2)], [421.8, 1.14], 0.01);
check('shear, reinforced: Fvm = 0.25 P/An + 0.042 [4 - 1.75 M/(V dv)] sqrt(f\'m) = 0.0789 + 0.2988 = 0.378 MPa (8-29); special shear walls use 0.021: 0.2283; Fvs = 0.5 Av Fs dv / (Anv s) = 0.0195 MPa with Av 71 mm2 at 400 mm; the cap 0.167 sqrt(f\'m) = 0.528', [+ma({reinf: true}).Fvm.toFixed(3), +ma({reinf: true, special: true}).Fvm.toFixed(3), +ma({reinf: true, Av: 71}).Fvs.toFixed(4), +ma({reinf: true, Av: 71}).Fv.toFixed(3), +ma({reinf: true}).cap.toFixed(3)], [0.378, 0.228, 0.0195, 0.397, 0.167 * Math.sqrt(10)], 0.001);
check('partially grouted shear walls use gamma_g = 0.75 (8-25); maximum ratio for special shear walls rho_max = n f\'m / (2 fy (n + fy/f\'m)) = 22.2 x 10 / (2 x 420 x 64.2) = 0.41 % at fy 420; it applies when M/(V dv) >= 1 and P > 0.05 f\'m An = 95 kN (P = 100 kN applies, 60 kN does not)', [ma({reinf: true, sec: 2, shearWall: true}).gg, ma({reinf: true, sec: 2}).gg, +(ma({reinf: true, special: true}).rhoMax * 100).toFixed(2), ma({reinf: true, special: true, P: 100}).rhoApplies, ma({reinf: true, special: true}).rhoApplies, ma({reinf: true, P: 100}).rhoApplies], [0.75, 1, 0.41, true, false, false], 0.01);
const dv = (db, fy, fm, K) => w.eval('msnDev(' + db + ',' + fy + ',' + fm + ',' + K + ')');
check('development length ld = 1.57 db2 fy gamma / (K sqrt(f\'m)) (8-12): Dia 13: 503 mm; Dia 22 with gamma 1.3: 1874 mm; K limited to 9 db: 301 mm; 300 mm minimum; hook le = 13 db; epoxy-coated 1.5 ld', [dv(13, 420, 10, 70).ld, dv(22, 420, 10, 70).ld, dv(13, 420, 10, 300).ld, dv(10, 275, 20, 100).ld, dv(13, 420, 10, 70).le, dv(13, 420, 10, 70).epoxy].map(Math.round), [503, 1874, 301, 300, 169, 755], 1);
w.renderCalc('masonasd'); w.calcResult('masonasd');
let tt = txt(w, 'msa_results');
check('the page opens with Pa 421.8 kN, ld 503 mm, "approved" and the 🔴 note', [tt.includes('421.8 kN'), tt.includes('503 mm'), tt.includes('0.378'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('masonasd', 'msa_results'), [true, true, true]);
}
// ---------- part 118: SBC 305 masonry, strength design of a wall under out-of-plane load (`masonwall`: 9.2, 9.3.5) ----------
{
w = boot('intl'); doc = w.document;
const base = {fm: 10, clay: false, mort: 0, bond: 0, cg: false, sec: 3, gf: 0.5, kA: 0.55, kI: 0.75, dir: 0, tfs: 32, t: 190, h: 4000, reinf: true, fy: 414, db: 16, sp: 800, d: 95, wu: 1.2, Puf: 10, eu: 50, Puw: 8, ws: 0.8, Pserf: 7, Pserw: 5, Pchk: 12, Av: 0, sv: 400};
const mw = o => w.eval('mswCalc(' + JSON.stringify(Object.assign({}, base, o)) + ')');
let r = mw({});
check('Dia 16 at 800 mm: As = 251.3 mm2/m; Pn = Pu/0.9 = 20 kN/m: a = (As fy + Pn) / (0.8 f\'m b) = 15.5 mm; Mn = 10.82 kN m/m and phi Mn = 9.74 kN m/m; Em = 9000, n = 22.2, fr = 1124 kPa (Table 9.1 fully grouted, M or S)', [+r.As.toFixed(1), +r.a.toFixed(1), +(r.Mn / 1e6).toFixed(2), +(r.phiMn / 1e6).toFixed(2), r.Em, +r.n.toFixed(1), r.fr], [251.3, 15.5, 10.82, 9.74, 9000, 22.2, 1.124], 0.01);
check('P-delta (9-28): M0 = wu h2/8 + Puf eu/2 = 2.4 + 0.25 = 2.65 kN m; Mcr = (fr + Pu/An) Sn = 7.33 kN m so the wall is uncracked: delta = 5 M h2 / (48 Em In) = 0.864 mm and Mu = M0 + Pu delta = 2.666 kN m; h/r = 72.9', [+(r.M0 / 1e6).toFixed(3), +(r.D.Mcr / 1e6).toFixed(2), r.D.cracked, +r.D.dl.toFixed(3), +(r.Mu / 1e6).toFixed(3), +r.hr.toFixed(1)], [2.65, 7.33, false, 0.864, 2.666, 72.9], 0.005);
check('shear: Vu = wu h / 2 = 2.4 kN/m; Vnm = 0.083 (4 - 1.75 Mu/(Vu t)) Anv sqrt(f\'m) + 0.25 Pu = 116.7 kN with the ratio limited to 1; phi Vn = 0.8 x 116.7 = 93.4 kN/m; phi Pn,max (9-19) = 851 kN/m', [r.Vu, Math.round(r.Vnm / 100) / 10, Math.round(r.phiVn / 100) / 10, Math.round(r.phiPnMax / 1000)], [2400, 116.7, 93.4, 851], 0.2);
check('maximum steel (9.3.3.5.1): cmax = eps_mu d / (eps_mu + 1.5 fy/Es) = 42.4 mm, amax = 0.8 cmax, As,max = (0.8 f\'m b amax - P) / fy = 626 mm2/m for P = 12 kN/m; the stress limit Pu/Ag 0.095 <= 0.2 f\'m; service deflection 0.58 mm <= 0.007 h = 28 mm', [+r.cmax.toFixed(1), Math.round(r.AsMax), r.maxOk, r.stressOk, +r.S.dl.toFixed(2), r.defLim, r.ok], [42.4, 626, true, true, 0.58, 28, true], 0.5);
let c = mw({wu: 4});
const resid = c.Mu - (c.M0 + c.Pu * c.D.dl), dcalc = 5 * c.D.Mcr * 16e6 / (48 * c.Em * c.p.In) + 5 * (c.Mu - c.D.Mcr) * 16e6 / (48 * c.Em * c.D.Icr);
check('a cracked wall (wu 4 kPa, M0 8.25 kN m above Mcr 7.33): c = (As fy + Pu) / (0.64 f\'m b) = 19.07 mm, Icr (9-35) = 40.1 x 10^6 mm4; the iteration satisfies Mu = M0 + Pu delta with delta from 9-31 (residual below 1 N mm)', [c.D.cracked, +c.D.c9.toFixed(2), +(c.D.Icr / 1e6).toFixed(1), Math.abs(resid) < 1, Math.abs(c.D.dl - dcalc) < 1e-6], [true, 19.07, 40.1, true, true], 0.05);
check('a stronger load fails flexure: wu 8 kPa; hollow ungrouted units with a deep compression block are flagged: a > 32 mm face shell', [mw({wu: 8}).flexOk, mw({sec: 1, db: 25, sp: 200, d: 95}).faceShell, mw({}).faceShell], [false, true, false]);
check('the code limits: f\'m 35 MPa is used as 27 MPa for concrete masonry and 50 as 41 for clay (9.1.9.1.1); fy 500 is used as 414 MPa (9.1.9.3.1)', [mw({fm: 35}).fm, mw({fm: 50, clay: true}).fm, mw({fy: 500}).fy], [27, 41, 414]);
let ur = mw({reinf: false});
check('unreinforced (9.2): h/r = 72.9 > 60: psi = 1 / [1 - Pu/(An f\'m) (70r/h)2] = 1.0088, Mu = 2.673 kN m; phi Pn = 0.6 x 0.8 (An f\'m/1.25)[1 - (h/140r)2] = 531.6 kN/m (9-11); tensile stress at nominal = Mn/Sn - Pn/An = 0.583 MPa below fr = 1.124', [+ur.psi.toFixed(4), +(ur.Mu / 1e6).toFixed(3), +(ur.phiPnMax / 1000).toFixed(1), +ur.st.toFixed(3), ur.ok], [1.0088, 2.673, 531.6, 0.583, true], 0.002);
check('h/r between 45 and 60: psi = 1 and the strengths are reduced by 10 % (9.2.4.3.4): h = 3000 on 190 mm: red = 0.9, compression limit 0.8 f\'m x 0.9 = 7.2 MPa; h/r <= 45: no reduction; shear (9.2.6.1e) 0.620 + 0.45 Nu/Anv = 0.663 MPa -> phi Vn = 100.7 kN/m', [mw({reinf: false, h: 3000}).red, +mw({reinf: false, h: 3000}).scLim.toFixed(2), mw({reinf: false, h: 2400}).red, +(ur.phiVn / 1000).toFixed(1), ur.shBy], [0.9, 7.2, 1, 100.7, '0.620 + 0.45N/A'], 0.05);
w.renderCalc('masonwall'); w.calcResult('masonwall');
let tt = txt(w, 'msw_results');
check('the page opens with 9.74 kN m, 15.5 mm, 626 mm2/m, 0.58 mm and the 🔴 note', [tt.includes('9.74 kN'), tt.includes('15.5 mm'), tt.includes('626 mm'), tt.includes('0.58 mm'), tt.includes('🔴')], [true, true, true, true, true]);
check('other reference codes open it too', others('masonwall', 'msw_results'), [true, true, true]);
}
// ---------- part 119: SBC 305 masonry shear walls, piers and beams (`masonshear`: 9.3.4, 9.3.3.5, 9.3.6) ----------
{
w = boot('intl'); doc = w.document;
const base = {fm: 10, clay: false, mort: 0, bond: 0, cg: false, sec: 3, gf: 0.5, kA: 0.55, kI: 0.75, kind: 0, lw: 1000, t: 190, hw: 3000, db: 19, sp: 900, dbe: 0, ne: 0, dp: 50, Av: 71, s: 800, dv: 0, cat: 0, cd: 3.5, dne: 0, Pu: 0, Mu: 50, Vu: 100, Pchk: 0, fy: 414, b: 190, hb: 800, d: 700, nb: 4, span: 2000, cont: false};
const ms = o => w.eval('mssCalc(' + JSON.stringify(Object.assign({}, base, o)) + ')');
let r = ms({});
check('a 1 m wall with one Dia 19 bar at each end (x = 50 and 950), Pu = 0: the far bar yields, c = T / (0.8 x 0.8 f\'m t) = 117.4 kN / 1216 = 96.5 mm; Mn = C (l/2 - a/2) + T (950 - 500) = 106.98 kN m, phi Mn = 96.28 kN m; the near bar is in compression and neglected', [r.N, r.sp, +r.c.toFixed(1), +(r.Mn / 1e6).toFixed(2), +(r.phiMn / 1e6).toFixed(2), r.ex], [1, 900, 96.5, 106.98, 96.28, 'ok'], 0.02);
let ax = ms({Pu: 90});
check('with Pu = 90 kN (Pn = 100 kN): C = 217.4 kN so c = 178.8 mm, a = 143.0; Mn = 217.4 (500 - 71.5) + 117.4 x 450 = 145.97 kN m, phi Mn = 131.4 kN m; Pu = 3000 kN exceeds the compression capacity', [+ax.c.toFixed(1), +(ax.Mn / 1e6).toFixed(2), +(ax.phiMn / 1e6).toFixed(1), ms({Pu: 3000}).ex, ms({Pu: 3000}).flexOk], [178.8, 145.97, 131.4, 'compression', false], 0.05);
check('shear (9-21 to 9-25) with Mu/(Vu dv) = 50 / (100 x 1.0) = 0.5: Vnm = 0.083 (4 - 0.875) Anv sqrt(f\'m) = 155.8 kN, Vns = 0.5 (71/800) fy dv = 18.4 kN, cap 0.443 Anv sqrt(f\'m) = 266 kN; phi Vn = 139.4 kN; Pu = 90 kN adds 0.25 Pu = 22.5 kN', [Math.round(r.sh.Vnm / 100) / 10, Math.round(r.sh.Vns / 100) / 10, Math.round(r.sh.cap / 1000), Math.round(r.sh.phiVn / 100) / 10, Math.round((ax.sh.Vnm - r.sh.Vnm) / 100) / 10, r.shOk], [155.8, 18.4, 266, 139.4, 22.5, true], 0.1);
check('gamma_g = 0.75 for a partially grouted shear wall (9-21): the capped shear is reduced by 25 %', [+(ms({sec: 2, kA: 1, kI: 1}).sh.cap / r.sh.cap).toFixed(3), ms({sec: 2}).gg], [0.75, 0.75], 0.001);
check('the limit on Vn: Mu/(Vu dv) <= 0.25 gives 0.498 Anv sqrt(f\'m), >= 1 gives 0.332 (interpolated between)', [ms({Mu: 10, Vu: 100}).sh.cap, ms({Mu: 100, Vu: 100}).sh.cap, ms({Mu: 50, Vu: 100}).sh.cap].map(x => +(x / (190000 * Math.sqrt(10))).toFixed(3)), [0.498, 0.332, 0.443], 0.001);
const base2 = {lw: 3000, dp: 100, sp: 800, db: 13, dbe: 19, ne: 1, Pu: 60, Mu: 400, Vu: 120, Pchk: 50};
let w2 = ms(base2);
check('3 m wall: five Dia 13 bars at 700 mm (x = 100 ... 2900) plus one Dia 19 at each end = 1230.7 mm2; c = 332 mm; phi Mn = 714 kN m >= 400; Mu/(Vu dv) = 400 / (120 x 3) = 1.11; phi Pn,max = 3087 kN', [w2.N + 1, +w2.Ast.toFixed(1), Math.round(w2.c), Math.round(w2.phiMn / 1e6), +w2.sh.ratioRaw.toFixed(2), Math.round(w2.phiPnMax / 1000), w2.flexOk], [5, 1230.7, 332, 714, 1.11, 3087, true], 1);
check('maximum steel (9.3.3.5.1) applies because Mu/(Vu dv) >= 1: at the strain gradient 1.5 eps_y the section still carries 1343 kN of axial force against the 50 kN of D + 0.75L + 0.525Q: passes; a very large bar area fails (Dia 32 at every 200 mm); intermediate and special walls use 3 and 4 eps_y', [Math.round(w2.Plim / 1000), w2.maxOk, ms(Object.assign({}, base2, {db: 32, sp: 200, Pchk: 50})).maxOk, ms(Object.assign({}, base2, {cat: 1})).k, ms(Object.assign({}, base2, {cat: 2})).k, ms({}).applies], [1343, true, false, 3, 4, false], 1);
check('perpendicular reinforcement at least one third of the shear steel (9.3.6.2): vertical Ab/sp = 0.190 mm2/mm against (71/800)/3 = 0.030; a coarse vertical layout (Dia 10 at 2400 mm with heavy horizontal steel) fails', [+w2.vertPer.toFixed(3), +(w2.horPer / 3).toFixed(3), w2.perpOk, ms(Object.assign({}, base2, {db: 10, sp: 2400, Av: 400, s: 200})).perpOk], [0.19, 0.03, true, false], 0.002);
let be = ms(Object.assign({}, base2, {Pu: 700, Vu: 200, dne: 20}));
const Fchk = c => { let F = 1216 * c; for (let j = 0; j < 5; j++) { const x = 100 + 700 * j, A = 132.732 + (j === 0 || j === 4 ? 283.529 : 0); if (x > c) F -= A * Math.min(414, 200000 * 0.0025 * (x - c) / c); } return F; };
check('special boundary elements (9.3.6.5): exempt when Pu <= 0.10 Ag f\'m (190 kN) and Mu/(Vu dv) <= 1 or (Vu <= 0.25 Anv sqrt(f\'m) and ratio <= 3); with Pu 700 kN (above 0.10 Ag f\'m = 570 kN) c >= l / (600 Cd delta_ne / hw) = 3000 / (600 x 3.5 x 20 / 3000) = 214 mm is required; c solves C - sum T = Pu / 0.9 (independent check of the equilibrium), so the element is needed', [w2.exempt, be.exempt, Math.round(be.cReq), Math.abs(Fchk(be.c) - 700000 / 0.9) < 2, be.be], [true, false, 214, true, true], 1);
let pr = ms({kind: 1, lw: 600, hw: 1500, Pu: 40});
check('pier (9.3.4.3): 3t <= l <= 6t (570 <= 600 <= 1140 mm), t <= 400 mm, h <= 5 l, Pu <= 0.3 An f\'m, As >= 0.0007 t l; a 450 mm long pier passes the length limit only while the axial force is under 0.05 f\'m Ag = 42.8 kN (40 kN passes, 100 kN fails)', [pr.pierOk, pr.pierL, ms({kind: 1, lw: 450, hw: 1500, Pu: 40}).pierL, ms({kind: 1, lw: 450, hw: 1500, Pu: 100}).pierL, ms({kind: 1, lw: 600, hw: 1500, Pu: 400}).pierAx, ms({kind: 1, lw: 600, hw: 4000, Pu: 40}).pierH], [true, true, true, false, false, false]);
let bm = ms({kind: 2, Mu: 100, Vu: 40, Pu: 0, nb: 4, db: 13});
check('lintel b 190, depth 800, d 700, 4 Dia 13 = 530.9 mm2: a = As fy / (0.8 f\'m b) = 144.6 mm, Mn = As fy (d - a/2) = 138.0 kN m, phi Mn = 124.2; Mcr = fr Sn = 1.839 x 20.27 x 10^6 = 37.3 kN m (parallel to bed joints, fully grouted); 1.3 Mcr = 48.5 <= Mn', [+bm.As.toFixed(1), +bm.a.toFixed(1), +(bm.Mn / 1e6).toFixed(1), +(bm.phiMn / 1e6).toFixed(1), +(bm.Mcr / 1e6).toFixed(1), bm.crOk, bm.flexOk], [530.9, 144.6, 138, 124.2, 37.3, true, true], 0.1);
check('lintel steel required for Mu = 100 kN m (solving phi Mn = Mu): 417 mm2; As,max = (0.8 f\'m b amax - P)/fy = 917 mm2 with cmax = 312 mm applies since Mu/(Vu dv) = 3.1 >= 1; a 2-bar lintel (Dia 13, 265 mm2) cannot carry 100 kN m', [Math.round(bm.AsReq), Math.round(bm.AsMax), bm.applies, ms({kind: 2, Mu: 100, nb: 2, db: 13}).flexOk, ms({kind: 2, Mu: 100, nb: 2, db: 13}).crOk], [417, 917, true, false, true], 1);
check('lintel shear: dv = overall depth 800 mm, Anv = 152000 mm2: Vnm = 0.083 x 2.25 x Anv sqrt(f\'m) = 89.8 kN; Vns = 14.7 kN; phi Vn = 83.6 kN; no stirrups needed while Vu <= phi Vnm = 71.8 kN; Vu = 80 kN needs stirrups of at least 0.0007 b dv = 106 mm2 at most h/2 = 400 mm', [Math.round(bm.sh.Vnm / 100) / 10, Math.round(bm.sh.Vns / 100) / 10, Math.round(bm.sh.phiVn / 100) / 10, bm.sh.needSteel, ms({kind: 2, Vu: 80, Mu: 100}).sh.needSteel, Math.round(bm.AvMin), bm.sMax, ms({kind: 2, Vu: 80, Mu: 100, Av: 71, s: 800}).stirOk, ms({kind: 2, Vu: 80, Mu: 100, Av: 142, s: 400}).stirOk], [89.8, 14.7, 83.6, false, true, 106, 400, false, true], 0.15);
check('beam axial force limited to 0.05 An f\'m = 76 kN; a depth/span above 4/5 (simple) or 2/5 (continuous) is a deep beam: 800 / 1800 = 0.44 is deep only when continuous', [+(bm.axLim / 1000).toFixed(0), ms({kind: 2, Pu: 80}).axOk, ms({kind: 2, span: 1800}).deep, ms({kind: 2, span: 1800, cont: true}).deep, bm.deep], [76, false, false, true, false]);
w.renderCalc('masonshear'); w.calcResult('masonshear');
let tt = txt(w, 'mss_results');
check('the page opens with 714.1 kN m, 1231 mm2, 325.4 kN and the 🔴 note', [tt.includes('714.1 kN'), tt.includes('1231 mm'), tt.includes('325.4 kN'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('masonshear', 'mss_results'), [true, true, true]);
}
// ---------- part 120: Saudi Civil Defense regulation for technical and commercial premises (`sdshop`) ----------
{
w = boot('intl'); doc = w.document;
const sd = o => w.eval('sdsCalc(' + JSON.stringify(Object.assign({At: 600, Af: 600, nf: 1, H: 6, N: 120, type: 0, exitW: 1100, routeW: 1400, doors: 2, ext: 6, reelN: 3, riserN: 1, riserD: 40, hyd: 80, fuel: 0, aisle: 1, head: 1}, o)) + ')');
let r = sd({});
check('exit units = persons / (25 x evacuation time): 120 persons at 3 min (type I) = 1.6 -> 2 units; at 2.5 min (type II) = 1.92 -> 2; at 2 min (type III) = 2.4 -> 3 units; a fraction counts as a whole unit', [sd({}).units, sd({type: 1}).units, sd({type: 2}).units, sd({type: 2}).tE], [2, 2, 3, 2]);
check('the minimum is two units (42 in = 1067 mm, at least 1000 mm): a single person still needs 1067 mm; 8 units need 8 x 533.4 = 4267 mm; width 1066 mm fails and 1067 passes', [sd({N: 10}).unitsReq, Math.round(sd({N: 10}).wReq), Math.round(sd({N: 600}).wReq), sd({exitW: 1066}).exitWOk, sd({exitW: 1067}).exitWOk], [2, 1067, 4267, false, true]);
check('doors: two units need one exit; three units or more need more than one door = units / 4 + 1 rounded up: 3 units -> 2, 6 units -> 3, 8 units -> 3, 9 units -> 4', [sd({}).doors, sd({N: 150, type: 2}).doors, sd({N: 300, type: 2}).doors, sd({N: 600}).doors, sd({N: 675}).doors], [1, 2, 3, 3, 4]);
check('escape route at least 1300 mm: 1299 fails and 1300 passes; fewer doors than required fail', [sd({routeW: 1299}).routeOk, sd({routeW: 1300}).routeOk, sd({N: 300, type: 2, doors: 2}).doorsOk, sd({N: 300, type: 2, doors: 3}).doorsOk], [false, true, false, true]);
check('extinguishers: one per 100 m2 and never fewer than three (two dry powder 12 kg + one CO2 10 kg): 600 m2 -> 6, 120 m2 -> 3, 1000 m2 -> 10, 101 m2 -> 2 rounded to the minimum 3; 5 provided against 6 fails', [sd({}).nExt, sd({At: 120}).nExt, sd({At: 1000}).nExt, sd({At: 101}).nExt, sd({}).powder, sd({ext: 5}).extOk, sd({ext: 6}).extOk], [6, 3, 10, 3, 5, false, true]);
check('hose reels one per 200 m2: 600 m2 -> 3, 650 m2 -> 4; the hose diameter is at least 20 mm (note)', [sd({}).reels, sd({At: 650}).reels, sd({reelN: 2}).reelOk], [3, 4, false]);
check('standpipes: none up to 12 m; dry above 12 m and below 60 m; wet from 60 m; one riser per 600 m2 of floor with the farthest point within 50 m of a hose valve', [sd({H: 12}).stand, sd({H: 12.1}).stand, sd({H: 59.9}).stand, sd({H: 60}).stand, sd({H: 30, Af: 600}).risers, sd({H: 30, Af: 601}).risers, sd({H: 30, Af: 1800}).risers, sd({H: 30, riserN: 0}).riserOk, sd({H: 30, riserD: 50}).riserDistOk, sd({H: 30, riserD: 51}).riserDistOk, sd({H: 6, riserN: 0}).riserOk], ['none', 'dry', 'dry', 'wet', 1, 2, 3, false, true, false, true]);
check('hydrant within 100 m: 100 passes and 101 fails; liquid fuel: up to 10 L portable, up to 50 L in an insulated tank, above 50 L separate tanks (underground at most 5000 L); cladding class A above two floors, class B up to two', [sd({hyd: 100}).hydOk, sd({hyd: 101}).hydOk, sd({fuel: 10}).fuel, sd({fuel: 11}).fuel, sd({fuel: 50}).fuel, sd({fuel: 51}).fuel, sd({nf: 2}).clad, sd({nf: 3}).clad], [true, false, 'portable', 'small tank', 'small tank', 'tank', 'B', 'A']);
check('storage: aisles at least 1 m (0.99 fails); stacks at least 3 ft = 0.914 m below the ceiling (0.9 fails, 0.92 passes); the default shop complies', [sd({aisle: 0.99}).aisleOk, sd({head: 0.9}).headOk, sd({head: 0.92}).headOk, r.ok], [false, false, true, true]);
w.renderCalc('sdshop'); w.calcResult('sdshop');
let tt = txt(w, 'sds_results');
check('the page opens with 2 units, 1067 mm, 6 extinguishers, 3 hose reels and the 🔴 note', [tt.includes('2 وحدة'), tt.includes('1067 mm'), tt.includes('6'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('sdshop', 'sds_results'), [true, true, true]);
}
// ---------- part 121: generator set room ventilation (`genroom`: Cummins T-030 6.5.4 steps 1 - 9, 6.5.6, Table 26) ----------
{
w = boot('intl'); doc = w.document;
const gr = o => w.eval('gvCalc(' + JSON.stringify(Object.assign({Qgs: 5530 * 1.055056 / 60, dp: 6, L: 3.048, ins: false, muff: true, dm: 6, Qaux: 0, Tout: 32.222, Troom: 40, Vcomb: 34.7, alt: 1524, Vfan: 642.4, vel: 2.03}, o)) + ')');
const cf = x => x * 35.3147;
check('Table 26 (kJ/min per m of pipe, kJ/min of muffler): 127 mm 481 and 1584, 254 mm 928 and 3870, 610 mm 2062 and no muffler value; 17 sizes', [w.eval('GV_T26.length'), w.eval('GV_T26.find(r => r[0] === 127).slice(1)'), w.eval('GV_T26.find(r => r[0] === 254).slice(1)'), w.eval('GV_T26.find(r => r[0] === 610).slice(1)')], [17, [481, 1584], [928, 3870], [2062, null]]);
let r = gr({});
check('the manual\'s worked example (5530 Btu/min set, 10 ft of 5 in pipe and a 5 in muffler uninsulated): pipe 24.4 kW + muffler 26.4 kW, total 148.1 kW = 8421 Btu/min; rise 104 F - 90 F = 7.78 K', [+r.QP.toFixed(1), +r.QM.toFixed(1), +r.Q.toFixed(1), Math.round(r.Q * 60 / 1.055056), +r.dT.toFixed(2)], [24.4, 26.4, 148.1, 8421, 7.78], 0.5);
check('air to remove the heat Q / (rho cp dT) ~ 34200 cfm; plus 1226 cfm of combustion air; at 5000 ft x 1.12 gives 39 680 cfm (the manual), a fan of 22 700 cfm leaves 16 980 cfm to the auxiliary fans; louver area at 400 fpm 99.2 ft2', [Math.round(cf(r.Vroom) / 10) * 10, Math.round(cf(r.Vtot) / 10) * 10, +r.f.toFixed(3), Math.round(cf(r.Vadj) / 100) * 100, Math.round(cf(r.aux) / 100) * 100, +(cf(r.Vadj) / 400).toFixed(0)], [34200, 35430, 1.12, 39700, 17000, 99], 150);
check('altitude factor 3 % per 305 m above 305 m and never below 1: 0 m and 305 m -> 1.00; 610 m -> 1.03; 1524 m -> 1.12', [gr({alt: 0}).f, gr({alt: 305}).f, +gr({alt: 610}).f.toFixed(3), +gr({alt: 1524}).f.toFixed(2)], [1, 1, 1.03, 1.12], 0.001);
check('insulated pipe and muffler emit 30 % (24.4 + 26.4 -> 15.2 kW, total 112.5 kW); a muffler outside the room is not counted; a 610 mm muffler has no Table 26 value and is flagged', [+gr({ins: true}).Q.toFixed(1), +gr({muff: false}).QM.toFixed(1), +gr({muff: false}).Q.toFixed(1), gr({dm: 16}).mNone], [112.5, 0, 121.7, true], 0.1);
check('without a set-mounted fan all the air comes from room fans: auxiliary = total = 1124 m3/min; a fan above the need needs no auxiliary fan and the room flow equals the fan flow', [Math.round(gr({Vfan: 0}).aux), Math.round(gr({Vfan: 0}).thru), gr({Vfan: 2000}).auxNeeded, gr({Vfan: 2000}).aux, gr({Vfan: 2000}).thru, gr({}).auxNeeded], [1124, 1124, false, 0, 2000, true]);
check('the effective inlet / outlet area = airflow / velocity: 1124 m3/min at 3 m/s = 6.2 m2; the recommended velocity range 2.5 - 3.6 m/s (2.03 m/s, the louver limit of the example, is outside)', [+gr({Vfan: 0, vel: 3}).Ain.toFixed(1), gr({vel: 2.5}).velOk, gr({vel: 3.6}).velOk, gr({vel: 3.7}).velOk, gr({vel: 2.03}).velOk], [6.2, true, true, false, false], 0.1);
check('a room not warmer than the outside air cannot remove heat: no finite airflow', [gr({Troom: 30}).Vroom === Infinity, gr({Troom: 32.222}).Vroom === Infinity], [true, true]);
w.renderCalc('genroom'); w.calcResult('genroom');
let tt = txt(w, 'gv_results');
check('the page opens with 148.2 kW (97.3 + 24.5 + 26.4), 7.8 K, 1121 m3/min and the 🔴 note', [tt.includes('148.2 kW'), tt.includes('7.8 K'), tt.includes('1121 m'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('genroom', 'gv_results'), [true, true, true]);
}
// ---------- part 122: SBC 201 minimum plumbing fixtures (`sbcfixtures`: Table 2902.1, 2902.1.1, 2902.6) ----------
{
w = boot('intl'); doc = w.document;
const fx = (lines, pm) => w.eval('sfxCalc(' + JSON.stringify(lines.map(l => Object.assign({row: 'B', N: 100, units: 0}, l))) + ', ' + (pm == null ? 0.5 : pm) + ')');
const pick = r => [r.wm, r.wf, r.lm, r.lf, r.b, r.d, r.ss];
check('the table has 25 occupancy rows; the fixed bath of I-4 is 1; factories and storage take their showers from SBC 701 section 411', [w.eval('SFX_ROWS.length'), w.eval('SFX_ROWS.find(r => r.id === "I4").b.fix'), w.eval('SFX_ROWS.find(r => r.id === "F").b'), w.eval('SFX_ROWS.find(r => r.id === "S").b')], [25, 1, 'x', 'x']);
check('office B, 100 persons (50 per sex): water closets 1 per 25 for the first 50 = 2 each; lavatories 1 per 40 for the first 80 = 1.25 -> 2; drinking fountains 1 per 100 = 1; one service sink', pick(fx([{}])), [2, 2, 2, 2, 0, 1, 1]);
check('office B, 200 persons (100 per sex): water closets 50/25 + 50/50 = 3; lavatories 80/40 + 20/80 = 2.25 -> 3; drinking fountains 2', pick(fx([{N: 200}])), [3, 3, 3, 3, 0, 2, 1]);
check('restaurant A-2, 300 persons: water closets 150/75 = 2 each, lavatories 150/200 = 0.75 -> 1, drinking fountain 300/500 -> 1', pick(fx([{row: 'A2', N: 300}])), [2, 2, 1, 1, 0, 1, 1]);
check('arena A-4, 5000 persons: men 1500/75 + 1000/120 = 28.3 -> 29; women 1520/40 + 980/60 = 54.3 -> 55; lavatories 2500/200 = 12.5 -> 13 and 2500/150 = 16.7 -> 17; drinking fountains 5', pick(fx([{row: 'A4', N: 5000}])), [29, 55, 13, 17, 0, 5, 1]);
check('theatre A-1 400 persons: men 200/125 -> 2, women 200/65 = 3.1 -> 4; mosque A-3: 600 persons men 300/150 = 2, women 300/75 = 4, lavatories 300/200 -> 2, one drinking fountain', [pick(fx([{row: 'A1', N: 400}])).slice(0, 4), pick(fx([{row: 'A3m', N: 600}]))], [[2, 4, 1, 1], [2, 4, 2, 2, 0, 1, 1]]);
check('multiple occupancies (2902.1.1): the fractions are added before rounding: B 100 persons + M 200 persons: water closets 2.0 + 0.2 -> 3, lavatories 1.25 + 0.133 -> 2, drinking fountains 1.0 + 0.2 -> 2; rounding each use first would give 4 lavatories', [pick(fx([{}, {row: 'M', N: 200}])).slice(0, 6), pick(fx([{}])).slice(2, 4).reduce((a, b) => a + b) + pick(fx([{row: 'M', N: 200}])).slice(2, 4).reduce((a, b) => a + b)], [[3, 3, 2, 2, 0, 2], 6]);
check('apartment houses, 40 dwelling units: one water closet, lavatory and bath per unit, one kitchen sink per unit and one clothes washer connection per 20 units; hotels 120 sleeping units: one each, no drinking fountain; one- and two-family dwellings: one washer connection per unit', [pick(fx([{row: 'R2a', N: 0, units: 40}])).slice(0, 5), fx([{row: 'R2a', N: 0, units: 40}]).ks, fx([{row: 'R2a', N: 0, units: 40}]).wc, pick(fx([{row: 'R1', N: 0, units: 120}])), fx([{row: 'R3a', N: 0, units: 10}]).wc], [[40, 40, 40, 40, 40], 40, 2, [120, 120, 120, 120, 120, 0, 1], 10]);
check('hospital patients: one water closet and lavatory per room (30 rooms), baths 1 per 15 patients (60 -> 4), drinking fountains 1 per 100; employees 1 per 25 and lavatories 1 per 35 (50 persons per sex: 2 and 2); visitors 1 per 75 and 1 per 100', [pick(fx([{row: 'I2p', N: 60, units: 30}])), pick(fx([{row: 'I2e', N: 100}])).slice(0, 4), pick(fx([{row: 'I2v', N: 300}])).slice(0, 6)], [[30, 30, 30, 30, 4, 1, 1], [2, 2, 2, 2], [2, 2, 2, 2, 0, 1]]);
check('dormitories R-2 and group homes: 1 per 10 and baths 1 per 8: 80 persons -> 4, 4, 4, 4, baths 10, drinking fountains 1; day care I-4: one bath for any number', [pick(fx([{row: 'R2d', N: 80}])), fx([{row: 'I4', N: 60}]).b, fx([{row: 'I4', N: 600}]).b], [[4, 4, 4, 4, 10, 1, 1], 1, 1]);
check('the percentage of men can be changed when approved data exist: 60 % men in office B of 100: 60 men 2.0 + 0.2 -> 3 closets, 40 women 1.6 -> 2', [fx([{}], 0.6).wm, fx([{}], 0.6).wf], [3, 2]);
check('an occupant load of 15 or fewer needs no drinking fountain (2902.6) and, for business and mercantile, no service sink; an educational occupancy still needs the service sink', [fx([{N: 15}]).d, fx([{N: 15}]).ss, fx([{row: 'M', N: 15}]).ss, fx([{row: 'E', N: 15}]).ss, fx([{N: 16}]).d, fx([{N: 16}]).ss], [0, 0, 0, 1, 1, 1]);
check('factory F: water closets and lavatories 1 per 100 each sex (500 persons: 3 and 3), drinking fountains 1 per 400 -> 2, the showers are left to SBC 701', [pick(fx([{row: 'F', N: 500}])).slice(0, 4), fx([{row: 'F', N: 500}]).d, fx([{row: 'F', N: 500}]).notes.indexOf('x') >= 0], [[3, 3, 3, 3], 2, true]);
w.renderCalc('sbcfixtures'); w.calcResult('sbcfixtures');
let tt = txt(w, 'sfx_results');
check('the page opens with the office of 100 persons: 2, 2, 2, 2, one drinking fountain, one service sink and the 🔴 note', [tt.includes('مغسلة خدمة واحدة'), tt.includes('مجموع الكسور 1.25'), tt.includes('🔴')], [true, true, true]);
check('other reference codes open it too', others('sbcfixtures', 'sfx_results'), [true, true, true]);
}
// ---------- part 123: SBC 301 dead loads, soil loads and hydrostatic pressure (`sbcdead`: Tables 3-1, 3-2, 3-3, 3.2.1, 3.2.2) ----------
{
w = boot('intl'); doc = w.document;
const wall = (k, d, t, g, p) => w.eval('sdlWall(' + [k, JSON.stringify(d), t, g, p].join(', ') + ')');
const soil = (k, H, hw, gm, gs) => w.eval('sdlSoil(' + [k, H, hw, gm, gs, 10].join(', ') + ')');
const find = (ar, d) => w.eval('SDL_I.findIndex(x => x.ar === ' + JSON.stringify(ar) + (d ? ' && x.d === ' + JSON.stringify(d) : '') + ')');
check('Table 3-1 has 87 component rows in 7 groups; per-mm rows: gypsum board 0.01, plywood 0.006, stone concrete fill 0.023; area rows: plaster on tile or concrete 0.25, ceramic tile on 25 mm mortar 1.10, brick veneer wall 2.30', [w.eval('SDL_I.length'), w.eval('SDL_G.length'), w.eval('SDL_I[' + find('لوح جبس') + '].v'), w.eval('SDL_I[' + find('لوح جبس') + '].mm'), w.eval('SDL_I[' + find('حشوة خرسانة حجرية') + '].v'), w.eval('SDL_I[' + find('بياض على بلاط أو خرسانة') + '].v'), w.eval('SDL_I[' + find('بلاط خزفي أو حجري على قاعدة مونة', '20 mm / 25 mm') + '].v'), w.eval('SDL_I[' + find('جدار خارجي بأعمدة مع كسوة طوب') + '].v')], [87, 7, 0.01, 1, 0.023, 0.25, 1.1, 2.3]);
check('clay brick wythes 100 / 200 / 300 / 400 mm: 1.90 / 3.80 / 5.50 / 7.50 kN/m2; 150 mm clay is not tabulated', [100, 200, 300, 400, 150].map(t => wall(0, '19.5', t, 0, 0)), [1.9, 3.8, 5.5, 7.5, null]);
check('hollow concrete masonry, unit density 19.5: no grout 100-300 mm: 1.25 / 1.35 / 1.70 / 2.10 / 2.40; 250 mm with grout every 800 mm 2.80 and every 400 mm 3.50; full grout 150 mm 2.80 and 250 mm 4.90', [wall(1, '19.5', 100, 0, 0), wall(1, '19.5', 150, 0, 0), wall(1, '19.5', 200, 0, 0), wall(1, '19.5', 250, 0, 0), wall(1, '19.5', 300, 0, 0), wall(1, '19.5', 250, 3, 0), wall(1, '19.5', 250, 5, 0), wall(1, '19.5', 150, 6, 0), wall(1, '19.5', 250, 6, 0)], [1.25, 1.35, 1.7, 2.1, 2.4, 2.8, 3.5, 2.8, 4.9]);
check('density 16.5 and 21.0, 200 mm: no grout 1.70 and 2.15; full grout at 150 mm 2.75 and 3.05; a grouted 100 mm wythe is not tabulated; 1200 mm grout 150 mm: 1.50, 1.60 and 1.60 for 16.5, 19.5 and 21.0', [wall(1, '16.5', 200, 0, 0), wall(1, '21.0', 200, 0, 0), wall(1, '16.5', 150, 6, 0), wall(1, '21.0', 150, 6, 0), wall(1, '19.5', 100, 6, 0), wall(1, '16.5', 150, 1, 0), wall(1, '19.5', 150, 1, 0), wall(1, '21.0', 150, 1, 0)], [1.7, 2.15, 2.75, 3.05, null, 1.5, 1.6, 1.6]);
check('solid concrete masonry 200 mm: 3.20 / 3.80 / 4.15 for 16.5 / 19.5 / 21.0; 300 mm 4.90 / 5.80 / 6.25; plaster adds 0.24 per face (two faces: +0.48)', [wall(2, '16.5', 200, 0, 0), wall(2, '19.5', 200, 0, 0), wall(2, '21.0', 200, 0, 0), wall(2, '16.5', 300, 0, 0), wall(2, '21.0', 300, 0, 0), wall(2, '21.0', 300, 0, 2), wall(0, '19.5', 200, 0, 1)], [3.2, 3.8, 4.15, 4.9, 6.25, 6.73, 4.04], 0.001);
check('Table 3-2 has 108 densities; reinforced concrete 24, plain stone concrete 23, steel cold-drawn 77.5, water 10, lightweight load-bearing concrete is a range 11 - 16.5 (the upper value is used)', [w.eval('SDL_D.length'), w.eval('SDL_D.find(x => x[0] === "خرسانة مسلحة: حجر بما فيه الحصى")[1]'), w.eval('SDL_D.find(x => x[0] === "خرسانة عادية: حجر بما فيه الحصى")[1]'), w.eval('SDL_D.find(x => x[0] === "فولاذ مسحوب على البارد")[1]'), w.eval('SDL_D.find(x => x[0] === "ماء عذب")[1]'), w.eval('SDL_D.find(x => x[0] === "خرسانة عادية: ركام خفيف آخر (حاملة)")[1]')], [108, 24, 23, 77.5, 10, [11, 16.5]]);
check('Table 3-3 (kN/m2 per m of depth): GW, GP, GM, SW, SP 5.50; GC and SM 7.1; SM-SC, SC, ML, ML-CL 13.35; CL 15.75; OL, MH, CH, OH unsuitable as backfill', [w.eval('SDL_S.map(x => x[0] + ":" + x[2]).join(" ")')], ['GW:5.5 GP:5.5 GM:5.5 GC:7.1 SW:5.5 SP:5.5 SM:7.1 SM-SC:13.35 SC:13.35 ML:13.35 ML-CL:13.35 CL:15.75 OL:null MH:null CH:null OH:null']);
let s = soil(5.5, 3, 0, 19, 9.5);
check('sand backfill 3 m deep, no water: pressure 5.5 x 3 = 16.5 kPa; thrust 0.5 x 16.5 x 3 = 24.75 kN/m acting 1.0 m above the base, moment 24.75 kN m/m', [s.pBase, s.F, +s.arm.toFixed(3), s.M], [16.5, 24.75, 1, 24.75], 0.001);
let sw = soil(5.5, 3, 1, 19, 9.5);
check('water table 1 m below the top (3 m wall): above it 5.5 kPa; below it the soil is submerged (k x 9.5/19 = 2.75 per m) plus 10 per m of water: base pressure 5.5 + 12.75 x 2 = 31.0; thrust 2.75 + 36.5 = 39.25 kN/m, moment 34.42, arm 0.877 m, uplift 20 kPa', [sw.pBase, sw.F, +sw.M.toFixed(2), +sw.arm.toFixed(3), sw.uplift], [31, 39.25, 34.42, 0.877, 20], 0.01);
check('rigid walls (braced by floors): 9.5 for sand and gravel and 16 for silt and clay: 3 m -> thrust 42.75 and 72; ML at 4 m: 53.4 kPa, thrust 106.8 kN/m', [soil(9.5, 3, 0, 19, 9.5).F, soil(16, 3, 0, 19, 9.5).F, soil(13.35, 4, 0, 19, 9.5).pBase, soil(13.35, 4, 0, 19, 9.5).F], [42.75, 72, 53.4, 106.8], 0.001);
w.renderCalc('sbcdead'); w.calcResult('sbcdead');
let tt = txt(w, 'sdl_results');
check('the page opens with the gypsum board of 15 mm (0.150 kN/m2), the wall 1.70 kN/m2, the weight 24.00 kN, 16.5 kPa and the 🔴 note', [tt.includes('0.150 kN/m²'), tt.includes('1.70 kN/m²'), tt.includes('24.00 kN'), tt.includes('16.5 kPa'), tt.includes('🔴')], [true, true, true, true, true]);
check('other reference codes open it too', others('sbcdead', 'sdl_results'), [true, true, true]);
}
// ---------- part 124: SBC 301 rain loads (`sbcrain`: 8.3, Equations 8-1 and 8-2, Table 8-1, 8.4) ----------
{
w = boot('intl'); doc = w.document;
const rn = o => w.eval('srnCalc(' + JSON.stringify(Object.assign({A: 200, i: 180, ds: 50, sys: 1, w: 300, slope: 1}, o)) + ')');
check('Q = 0.278 x 10^-6 A i: 200 m2 at 180 mm/h = 0.0100 m3/s; 1000 m2 -> 0.0500; the intensity is never below 180 mm/h (150 is raised to 180)', [+rn({}).Q.toFixed(4), +rn({A: 1000}).Q.toFixed(4), rn({i: 150}).i, rn({i: 150}).iLow, rn({i: 250}).i], [0.01, 0.05, 180, true, 250], 0.0001);
check('Table 8-1 100 mm drain: 25 mm 0.0051, 50 mm 0.0107, 65 mm 0.0114; 150 mm drain up to 90 mm 0.0341; 200 mm drain up to 115 mm 0.0738', [w.eval('SRN_SYS[0][1][25]'), w.eval('SRN_SYS[0][1][50]'), w.eval('SRN_SYS[0][1][65]'), w.eval('SRN_SYS[1][1][90]'), w.eval('SRN_SYS[2][1][115]')], [0.0051, 0.0107, 0.0114, 0.0341, 0.0738]);
check('hydraulic head by interpolation in the 150 mm drain row: Q = 0.0100 -> 25 + 25 x (0.0100 - 0.0063) / (0.0120 - 0.0063) = 41.2 mm; at Q 0.0120 -> 50; at 0.0170 -> 65; below the first value the 25 mm minimum is used; beyond 0.0341 the table is exceeded', [+rn({}).dh.toFixed(1), rn({A: 1}).dh, +rn({A: 240}).dh.toFixed(1), rn({A: 340}).dh, rn({A: 1000}).dh, rn({A: 1000}).R], [41.2, 25, 50, 65, null, null], 0.1);
check('rain load R = 0.0098 (ds + dh): ds 50 and dh 41.2 -> 0.894 kN/m2; ds 75 on the overflow-edge option (dh = 0): 0.735; ds 75 and dh 50 -> 1.225', [+rn({}).R.toFixed(3), rn({sys: -1, ds: 75}).R, rn({sys: -1, ds: 75}).dh, +rn({A: 240, ds: 75}).R.toFixed(3)], [0.894, 0.735, 0, 1.225], 0.001);
check('scuppers: 600 mm channel scupper Q 0.0353 -> 100 mm, 0.0490 -> 125 mm, 0.0400 -> 108.6 mm; 150 mm wide channel scupper 0.0088 -> 100 mm; widths interpolate between 150 and 600 mm (300 mm at 25 mm head: 0.0011 + (0.0045 - 0.0011) / 3 = 0.00223)', [+rn({sys: 3, w: 600, A: 0.0353 / 0.278e-6 / 180}).dh.toFixed(1), +rn({sys: 3, w: 600, A: 0.049 / 0.278e-6 / 180}).dh.toFixed(1), +rn({sys: 3, w: 600, A: 0.04 / 0.278e-6 / 180}).dh.toFixed(1), +rn({sys: 3, w: 150, A: 0.0088 / 0.278e-6 / 180}).dh.toFixed(1), +w.eval('srnRow(3, 300)[25]').toFixed(5)], [100, 125, 108.6, 100, 0.00223], 0.1);
check('closed scuppers at 125 mm: 150 x 100 mm 0.0112 and 150 x 150 mm 0.0122, 600 x 100 0.0447 and 600 x 150 0.0490; 200 mm head: 0.0160 / 0.0216 / 0.0638 / 0.0866 and the channel scuppers 0.0248 / 0.0992', [w.eval('SRN_SCUP[1][1][150][125]'), w.eval('SRN_SCUP[2][1][150][125]'), w.eval('SRN_SCUP[1][1][600][125]'), w.eval('SRN_SCUP[2][1][600][125]'), w.eval('SRN_SCUP[1][1][150][200]'), w.eval('SRN_SCUP[2][1][150][200]'), w.eval('SRN_SCUP[1][1][600][200]'), w.eval('SRN_SCUP[2][1][600][200]'), w.eval('SRN_SCUP[0][1][150][200]'), w.eval('SRN_SCUP[0][1][600][200]')], [0.0112, 0.0122, 0.0447, 0.049, 0.016, 0.0216, 0.0638, 0.0866, 0.0248, 0.0992]);
check('ponding (8.4.1): a slope under 1.2 degrees is susceptible (1.19 yes, 1.2 no)', [rn({slope: 1.19}).ponding, rn({slope: 1.2}).ponding, rn({slope: 0}).ponding], [true, false, true]);
w.renderCalc('sbcrain'); w.calcResult('sbcrain');
let tt = txt(w, 'srn_results');
check('the page opens with 0.0100 m3/s, 41.3 mm, 0.894 kN/m2 and the 🔴 note', [tt.includes('0.0100 m³/s'), tt.includes('41.3 mm'), tt.includes('0.894 kN/m²'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('sbcrain', 'srn_results'), [true, true, true]);
}
// ---------- part 125: NFPA 24 underground mains (`ugmain`: 10.6.1, A.10.6.1, 10.6.2.1.2.2, 10.10.2) ----------
{
w = boot('intl'); doc = w.document;
const ug = o => w.eval('ugCalc(' + JSON.stringify(Object.assign({k: 2, P: 6.894757, type: 'bend', ang: 90, Sb: 47.88026, Sf: 1.5, h: 0.6, Ht: 2.4, gc: 23, rod: 0, Pw: 10, S: 100}, o)) + ')');
const lbf = kN => kN * 1000 / 4.4482216, ft2 = m2 => m2 * 10.7639104;
check('Table A.10.6.1(a) thrust at 100 psi (lbf, bends 90 degrees = 2 P A sin 45): 4 in 2559, 6 in 5288, 10 in 13685, 12 in 19353, 24 in 73934, 48 in 286637', [1, 2, 4, 5, 10, 14].map(k => Math.round(lbf(ug({k}).T))), [2559, 5288, 13685, 19353, 73934, 286637], 1);
check('other angles at 100 psi, 12 in: 45 degrees 10474, 22.5 degrees 5340, 11.25 degrees 2683, 5 1/8 degrees 1224 (the printed column header, matches 5.125 degrees); dead end and tee P A = 13685', [45, 22.5, 11.25, 5.125].map(a => Math.round(lbf(ug({k: 5, ang: a}).T))).concat([Math.round(lbf(ug({k: 5, type: 'dead'}).T)), Math.round(lbf(ug({k: 5, type: 'tee'}).T))]), [10474, 5340, 2683, 1224, 13685, 13685], 2);
check('Table A.10.6.1(b) bearing area for a 90 degree bend at 100 psi, 1000 lb/ft2 soil, factor 1.5: 3 in 2.6 ft2, 4 in 3.8, 6 in 7.9, 10 in 20.5, 12 in 29.0, 24 in 110.9, 48 in 430.0', [0, 1, 2, 4, 5, 10, 14].map(k => +ft2(ug({k}).Ab).toFixed(1)), [2.6, 3.8, 7.9, 20.5, 29, 110.9, 430], 0.1);
check('the example of A.10.6.1: 6 in, 45 degrees, 150 psi, soil 3000 lb/ft2, factor 1.5: 7.9 x 0.541 x 1.5 x 1/3 = 2.1 ft2', [+ft2(ug({k: 2, ang: 45, P: 150 * 6.894757 / 100, Sb: 3000 * 0.04788026}).Ab).toFixed(2)], [2.14], 0.03);
check('bearing strengths of Table A.10.6.1(c) (kN/m2): soft clay 48, silt 72, sandy silt 145, sand 190, sand clay 285, hard clay 430, muck 0', [w.eval('UG_SOIL.map(x => x[1]).join(" ")')], ['48 72 145 190 285 430 0']);
let vb = ug({type: 'vbend', ang: 45});
check('vertical down bend 45 degrees (6 in, 6.9 bar): Tx = P A (1 - cos 45) = 4.87 kN against the bearing, Ty = P A sin 45 = 11.76 kN needs a gravity block V = 1.5 x 11.76 / 23 = 0.767 m3 = 1.80 t', [+vb.Tx.toFixed(2), +vb.Ty.toFixed(2), +vb.Vg.toFixed(3), +vb.Wg.toFixed(2)], [4.87, 11.76, 0.767, 1.8], 0.01);
check('block geometry: h must lie between the pipe diameter and half the depth Ht (0.18 m <= 0.6 <= 1.2 passes, 1.3 fails) and the width between h and 2h: the 6 in block at 6.9 bar needs 0.74 m2 -> b = 1.23 m (2.05 h) fails the 2h limit, h = 0.8 gives b = 0.92 m passes', [ug({}).hOk, ug({h: 1.3}).hOk, ug({}).bOk, ug({h: 0.8}).bOk, +ug({h: 0.8}).b.toFixed(2)], [true, false, false, true, 0.92], 0.02);
check('muck has no bearing strength: no block area; rods of Table 10.6.2.1.2.2: 6 in 2 rods of 16 mm, 8 in 3 of 16 and 2 of 19, 12 in 6 / 4 / 3 / 2, 16 in 10 / 7 / 5 / 4; 6 in with 19 mm not permitted', [ug({Sb: 0}).Ab, ug({k: 3}).rods, ug({k: 3, rod: 1}).rods, [0, 1, 2, 3].map(r => ug({k: 5, rod: r}).rods), [0, 1, 2, 3].map(r => ug({k: 7, rod: r}).rods), ug({rod: 1}).rods, ug({k: 10}).rodsKnown], [null, 3, 2, [6, 4, 3, 2], [10, 7, 5, 4], null, false]);
check('flushing: 10 ft/s in the nominal diameter: 4 in 391 gpm = 1483 L/min (table 390 / 1500), 6 in 881 gpm = 3335 L/min, 12 in 3525 gpm', [1, 2, 5].map(k => Math.round(ug({k}).Qflush)), [1483, 3336, 13340], 12);
check('hydrostatic test: the greater of 200 psi (13.79 bar) and working pressure + 50 psi: 10 bar -> 13.79 bar; 12 bar -> 15.45 bar', [+(ug({Pw: 10}).Ptest / 100).toFixed(2), +(ug({Pw: 12}).Ptest / 100).toFixed(2)], [13.79, 15.45], 0.01);
check('leakage allowance L = S D sqrt(P) / 794,797 (m, mm, kPa): 6 in = 150 mm, 100 m at 1379 kPa: 100 x 150 x 37.1 / 794797 = 0.70 L/h (= 0.057 gph per 100 ft at 200 psi, Table 10.10.2.2.6: 6 in 0.057)', [+ug({}).Lallow.toFixed(2), +ug({k: 2, S: 30.48}).LallowGph.toFixed(3)], [0.7, 0.057], 0.001);
w.renderCalc('ugmain'); w.calcResult('ugmain');
let tt = txt(w, 'ug_results');
check('the page opens with T 34.1 kN, 0.27 m2, flushing 3336 L/min and the 🔴 note', [tt.includes('34.1 kN'), tt.includes('0.27 m²'), tt.includes('3336 L/min'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('ugmain', 'ug_results'), [true, true, true]);
}
// ---------- part 126: NFPA 101-2018 means of egress (`nfpa101`: Tables 7.3.1.2 and 7.3.3.1, 7.2.2.2.1.2, 7.4.1.2, 7.5.1.3, chapters 12 - 42) ----------
{
w = boot('intl'); doc = w.document;
const nf = o => w.eval('n101Calc(' + JSON.stringify(Object.assign({oc: 11, use: 15, spr: true, area: 3000, seats: 0, bench: 0, extra: 0, nExits: 2, stairW: 2240, levelW: 1500, diag: 40, sepProvided: 0, de: 0, cp: 0, td: 0}, o)) + ')');
check('Table 7.3.1.2 (m2 per person): business 14, concentrated assembly 0.65 net, less concentrated 1.4 net, classrooms 1.9 net, shops 4.6 net, sleeping departments 11.1, hotels and apartments 18.6, storage in mercantile 27.9, other storage 46.5', [15, 0, 1, 22, 23, 25, 33, 34, 36, 37].map(k => w.eval('N101_OL[' + k + '][1]')), [14, 0.65, 1.4, 1.9, 4.6, 11.1, 18.6, 18.6, 27.9, 46.5]);
check('occupant load: business 3000 m2 / 14 = 214.3 -> 215; concentrated assembly 200 m2 net / 0.65 = 307.7 -> 308; 120 fixed seats = 120; 10 m of benches / 455 mm = 21.98 -> 22; extra persons are added', [nf({}).load, nf({oc: 0, use: 0, area: 200}).load, nf({use: 3, seats: 120}).load, nf({use: 2, bench: 10}).load, nf({extra: 10}).load], [215, 308, 120, 22, 225]);
check('number of means of egress (7.4.1.2): 2 up to 500 persons, 3 from 501 to 1000, 4 above 1000; two exits for 215 persons pass, one fails', [500, 501, 1000, 1001].map(n => nf({use: 3, seats: n}).nExits), [2, 3, 3, 4]);
check('capacity factors (Table 7.3.3.1, mm per person stairs / level): all others 7.6 / 5, board and care 10 / 5, health care sprinklered 7.6 / 5, non-sprinklered 15 / 13, high hazard 18 / 10', [nf({}).cf, nf({oc: 8}).cf, nf({oc: 3}).cf, nf({oc: 3, spr: false}).cf, nf({oc: 14}).cf], [[7.6, 5], [10, 5], [7.6, 5], [15, 13], [18, 10]]);
let b = nf({});
check('215 persons: stairs 215 x 7.6 = 1634 mm, level 215 x 5 = 1075 mm; the stair minimum is 1120 mm (7.2.2.2.1.2(B): 915 mm if the load is under 50 (500 m2 = 36 persons), 1420 mm at 2000 persons per stair (60000 m2 on 2 stairs)); provided 2240 mm on 2 stairs (1120 each) and 1500 mm pass; 1500 mm of stairs fails the 1120 minimum per stair', [Math.round(b.reqStair), Math.round(b.reqLevel), b.stairMin, nf({area: 500}).stairMin, nf({area: 60000}).stairMin, b.stairOk, b.levelOk, nf({stairW: 1500}).stairOk, nf({stairW: 1634, nExits: 1}).stairOk], [1634, 1075, 1120, 915, 1420, true, true, false, true]);
check('business (38): dead end 15 m sprinklered, 6.1 m not; common path 30 and 23 m; travel 91 and 61 m: 90 m passes sprinklered and fails without', [nf({}).lims.de, nf({spr: false}).lims.de, nf({}).lims.cp, nf({spr: false}).lims.cp, nf({}).lims.td, nf({spr: false}).lims.td, nf({td: 90}).tdOk, nf({td: 90, spr: false}).tdOk], [15, 6.1, 30, 23, 91, 61, true, false]);
check('assembly (12): travel 61 m, 76 m sprinklered; educational (14): 46 / 61 m; mercantile ordinary (36): 46 / 76 m, high hazard 23 m and no dead end or common path; health care (18): 61 m, dead end 9.1 m, common path 30 m', [[0, 1, 9, 10, 3].map(k => nf({oc: k, spr: false}).lims.td), [0, 1, 9].map(k => nf({oc: k}).lims.td), nf({oc: 10}).lims.de, nf({oc: 10}).deOk, nf({oc: 3}).lims.de, nf({oc: 3}).lims.cp], [[61, 46, 46, 23, 61], [76, 61, 76], -1, false, 9.1, 30]);
check('hotels (28) and apartments (30): dead end and common path 10.7 m, 15 m sprinklered, travel from the unit door 30 / 61 m; industrial (40): general 61 / 76 m, special-purpose 91 / 122 m, high hazard not permitted without sprinklers and 23 m with; storage (42): ordinary 61 / 122 m, high hazard 23 / 30 m', [nf({oc: 6, spr: false}).lims, nf({oc: 7}).lims, nf({oc: 12, spr: false}).lims.td, nf({oc: 13}).lims.td, nf({oc: 14, spr: false}).lims.td, nf({oc: 14}).lims.td, nf({oc: 16}).lims.td, nf({oc: 17, spr: false}).lims.td, nf({oc: 17}).lims.td, nf({oc: 15}).lims.td], [{de: 10.7, cp: 10.7, td: 30}, {de: 15, cp: 15, td: 61}, 61, 122, -1, 23, 122, 23, 30, null]);
check('remoteness (7.5.1.3.2 - 3): the exits are half the building diagonal apart, a third if sprinklered: diagonal 40 m -> 20 m and 13.3 m; 12 m provided fails sprinklered? 12 < 13.3 fails, 14 passes', [+nf({spr: false}).sep.toFixed(1), +nf({}).sep.toFixed(1), nf({sepProvided: 12}).sepOk, nf({sepProvided: 14}).sepOk], [20, 13.3, false, true]);
w.renderCalc('nfpa101'); w.calcResult('nfpa101');
let tt = txt(w, 'n101_results');
check('the page opens with 215 persons, 1634 mm, 1075 mm, 91.0 m and the 🔴 note', [tt.includes('215'), tt.includes('1634 mm'), tt.includes('1075 mm'), tt.includes('91.0 m'), tt.includes('🔴')], [true, true, true, true, true]);
check('other reference codes open it too', others('nfpa101', 'n101_results'), [true, true, true]);
}
// ---------- part 127: ASHRAE 55-2013 thermal comfort (`thermalcomfort`: PMV and PPD, SET and the cooling effect, 5.3.3, 5.3.4, 5.3.5, 5.4, Tables 3-C, 5-B, 5-C, 5-G, 5-J, 5-K) ----------
{
w = boot('intl'); doc = w.document;
const tc = o => w.eval('tcCalc(' + JSON.stringify(Object.assign({ta: 24.5, tr: 25.5, v: 0.15, rh: 50, act1: 8, act2: 11, share2: 0, metc: 0, ens: 2, cloc: 0, add: 0, chair: 2, steps: 0, ctrl: false, asymT: 0, asym: 0, dT: 0, fl: 0, cyc: 0, d15: 0, d60: 0, adCtl: 1, adClo: 1, tmode: 0, tout: 20, te: 20, trm0: 20, alpha: 0.8}, o)) + ')');
const pmv = (ta, tr, v, rh, met, clo) => w.eval('tcPMV(' + [ta, tr, v, rh, met, clo].join(',') + ')');
const rhOf = (t, W) => W * 101.325 / (0.621945 + W) / (w.eval('tcPsat(' + t + ')') / 1000) * 100;
check('ISO 7730 and Appendix B examples (ta = tr, 0.1 m/s): 22 C 60 % 1.2 met 0.5 clo PMV -0.75 PPD 17; 27 C PMV +0.77 PPD 17; 27 C 0.3 m/s PMV +0.44 PPD 9; ta 23.5 tr 25.5 60 % PMV -0.01 PPD 5', [pmv(22, 22, 0.1, 60, 1.2, 0.5), pmv(27, 27, 0.1, 60, 1.2, 0.5), pmv(27, 27, 0.3, 60, 1.2, 0.5), pmv(23.5, 25.5, 0.1, 60, 1.2, 0.5)].map(x => [+x.pmv.toFixed(2), Math.round(x.ppd)]), [[-0.75, 17], [0.77, 17], [0.43, 9], [-0.01, 5]]);
const t5g = [[19.6, 86, 1], [23.9, 66, 1], [25.7, 15, 1], [21.2, 20, 1], [23.6, 67, 0.5], [26.8, 56, 0.5], [27.9, 13, 0.5], [24.7, 16, 0.5]].map(([t, rh, c]) => pmv(t, t, 0.1, rh, 1.1, c).pmv);
check('Table 5-G corners of the graphical comfort zone (1.1 met, 0.1 m/s) give PMV -0.5 or +0.5 within the rounding of the printed temperatures: 1.0 clo -0.5 +0.5 +0.5 -0.5, 0.5 clo -0.5 +0.5 +0.5 -0.5', t5g.map(x => Math.abs(Math.abs(x) - 0.5) <= 0.055), [true, true, true, true, true, true, true, true]);
check('signs of the Table 5-G corners: cold corners negative, warm corners positive', t5g.map(x => x < 0), [true, false, false, true, true, false, false, true]);
check('manual example, patron at 26.7 C, 1.0 met, 0.35 m/s, humidity ratio 0.0093: light clothing and normal chair (0.36 + 0.1 clo) PMV about -0.46 (-0.48), office dress and chair (0.61 + 0.1 clo) PMV about +0.15', [pmv(26.7, 26.7, 0.35, rhOf(26.7, 0.0093), 1.0, 0.46).pmv, pmv(26.7, 26.7, 0.35, rhOf(26.7, 0.0093), 1.0, 0.71).pmv].map(x => +x.toFixed(2)), [-0.48, 0.15], 0.03);
check('Table 3-C and Appendix A: A = 0.5 below 0.2 m/s, 0.6 from 0.2 to 0.6, 0.7 from 0.6 to 1.0; manual cooling example to = 0.6 x 23.9 + 0.4 x 26.3 = 24.9; heating to = 0.5 x 21.1 + 0.5 x 18.7 = 19.9', [tc({v: 0.1, act1: 2}).A, tc({v: 0.35, act1: 2}).A, tc({v: 0.8, act1: 2}).A, +tc({v: 0.35, act1: 2, ta: 23.9, tr: 26.3}).to.toFixed(1), +tc({v: 0.1, ta: 21.1, tr: 18.7}).to.toFixed(1)], [0.5, 0.6, 0.7, 24.9, 19.9]);
check('relative air speed v + 0.0052 (M - 58) for the activity above 58 W/m2: 1.7 met and 0.1 m/s -> 0.1 + 0.0052 x 40.9 = 0.31 m/s; at 1.0 met it equals the air speed', [+tc({v: 0.1, metc: 1.7}).vr.toFixed(2), +tc({v: 0.1, act1: 2}).vr.toFixed(2)], [0.31, 0.1]);
check('Table 5-B: sedentary 1.1; 50 % typing 1.1 + 50 % standing filing 1.4 = 1.25; 15 % typing + 85 % walking about 1.7 = 1.61; a given met overrides the list', [tc({}).met, tc({act2: 10, share2: 50}).met, tc({share2: 85}).met, tc({metc: 1.3}).met].map(x => +x.toFixed(2)), [1.1, 1.25, 1.61, 1.3]);
check('Table 5-C and 5.2.2.2: 0.57 clo + office chair 0.10 = 0.67; executive 0.15 -> 0.72; below 0.5 clo (0.36) and above 1.2 clo (1.30) the chair is not added; Table 7 ensembles 0.36, 0.57, 0.61, 0.96, 1.37', [tc({ens: 1}).clo, tc({ens: 1, chair: 3}).clo, tc({ens: 0}).clo, tc({ens: 6, chair: 3}).clo, w.eval('[0, 1, 2, 3, 16].map(k => TC_ENS[k][1])')].flat().map(x => +x.toFixed(2)), [0.67, 0.72, 0.36, 1.3, 0.36, 0.57, 0.61, 0.96, 1.37]);
check('walking (Handbook equation 46): 1.0 clo at 90 steps/min loses 0.52 clo -> 0.48; the garment adjustment of Table 8 is added to the ensemble', [+tc({cloc: 1.0, steps: 90, chair: 0}).clo.toFixed(2), +tc({ens: 1, add: 0.25, chair: 0}).clo.toFixed(2)], [0.48, 0.82]);
check('Table 5-L applicability of the graphical method (1.1 met, 0.1 m/s, 40 %): summer male 0.57 clo yes, summer female 0.39 no, winter male 1.1 no, winter female 0.97 yes, active worker 1.61 met no; 0.2 m/s or 0.012 humidity ratio fail it', [[0.57, 1.1], [0.39, 1.1], [1.1, 1.1], [0.97, 1.1], [0.57, 1.61]].map(([c, m]) => tc({cloc: c, chair: 0, metc: m, v: 0.1, rh: 40}).grOk).concat([tc({cloc: 0.57, chair: 0, metc: 1.1, v: 0.25, rh: 40}).grOk, tc({cloc: 0.57, chair: 0, metc: 1.1, v: 0.1, rh: 80}).grOk]), [true, false, false, true, false, false, false]);
const rh0 = rhOf(23.9, 0.0093), e0 = tc({ta: 23.9, tr: 23.9, v: 0.1, rh: rh0, metc: 1.1, cloc: 0.57, chair: 0}), e1 = tc({ta: 26.3, tr: 26.3, v: 0.5, rh: rh0, metc: 1.1, cloc: 0.57, chair: 0});
check('elevated air speed example of the manual (23.9 C, 1.1 met, 0.57 clo, 0.0093): the still air SET is 23.9; raising ta and tr to 26.3 C with 0.5 m/s gives the same SET (the cooling effect is 2.4 C)', [+e0.set0.toFixed(1), +e1.set0.toFixed(1), +e1.ce.toFixed(1), e1.elev, e0.elev], [24.0, 24.0, 2.4, true, false], 0.1);
check('with the elevated speed the PMV is taken at ta - CE: 0.5 m/s at 26.3 C gives PMV near the still air value of 23.9 C (-0.44)', [+e1.pmv.toFixed(2), +e0.pmv.toFixed(2)], [-0.43, -0.44], 0.03);
check('5.3.3 air speed limits: with occupant control 1.2 m/s; without control 0.8 above 25.5 C, 0.15 below 22.5 C, the curve 50.49 - 4.4047 to + 0.096425 to2 between (0.32 at 24 C); no upper limit above 1.3 met', [tc({ctrl: true, v: 0.5, ta: 26, tr: 26}).vLim, tc({v: 0.5, ta: 26, tr: 26}).vLim, tc({v: 0.5, ta: 22, tr: 22}).vLim, +tc({v: 0.5, ta: 24, tr: 24}).vLim.toFixed(2), tc({v: 0.5, ta: 26, tr: 26, metc: 1.5}).vLim, tc({v: 0.5, ta: 26, tr: 26}).vOk, tc({v: 0.9, ta: 26, tr: 26}).vOk], [1.2, 0.8, 0.15, 0.32, null, true, false]);
check('manual formula check at 21.1 C: 50.49 - 4.4047 x 21.1 + 0.096425 x 21.1^2 = 0.48 m/s', [+(50.49 - 4.4047 * 21.1 + 0.096425 * 21.1 * 21.1).toFixed(2)], [0.48]);
check('5.3.4 local discomfort applies below 0.7 clo and 1.3 met: 0.5 clo yes, 0.9 clo no, 1.4 met no; vertical difference 3 K, floor 19 to 29 C, asymmetry 5 / 14 / 23 / 10 K, draft 0.15 m/s under 22.5 C unless the occupants control the speed', [tc({cloc: 0.5, chair: 0}).local, tc({cloc: 0.9, chair: 0}).local, tc({cloc: 0.5, chair: 0, metc: 1.4}).local, tc({cloc: 0.5, chair: 0, dT: 3.5}).dtOk, tc({cloc: 0.5, chair: 0, dT: 3}).dtOk, tc({cloc: 0.5, chair: 0, fl: 30}).floorOk, tc({cloc: 0.5, chair: 0, fl: 19}).floorOk, tc({cloc: 0.5, chair: 0, asym: 6}).asymOk, tc({cloc: 0.5, chair: 0, asymT: 1, asym: 6}).asymOk, w.eval('TC_ASYM.map(x => x[1]).join(" ")'), tc({cloc: 0.5, chair: 0, ta: 20, tr: 20, v: 0.3}).draftOk, tc({cloc: 0.5, chair: 0, ta: 20, tr: 20, v: 0.3, ctrl: true}).draftOk, tc({cloc: 0.9, chair: 0, dT: 5}).dtOk], [true, false, false, false, true, false, true, false, true, '5 14 23 10', false, true, true]);
check('5.3.5 variations: a cycle up to 15 minutes 1.1 K peak to peak, a drift 1.1 K in 0.25 h and 2.2 K in 1 h (the manual cases 1.5 K, 1.05 K, 2.2 K)', [tc({cyc: 1.5}).cycOk, tc({cyc: 1.05}).cycOk, tc({d15: 1.5}).d15Ok, tc({d60: 2.2}).d60Ok, tc({d60: 2.5}).d60Ok], [false, true, false, true, false]);
check('5.4 adaptive (manual classroom, September 17.2 C): 80 % limits 0.31 x 17.2 + 14.3 = 19.6 and + 21.3 = 26.6 C; 0.9 m/s raises the upper limit by 1.8 K to 28.4 C when to is above 25 C; the room of 21.7 to 28.3 C passes the low end and fails the high end without the fans', [+tc({tout: 17.2}).ad.lo80.toFixed(1), +tc({tout: 17.2}).ad.hi80.toFixed(1), +tc({tout: 17.2, ta: 28.3, tr: 28.3, v: 0.9, act1: 2}).ad.hi80.toFixed(1), tc({tout: 17.2, ta: 28.3, tr: 28.3, v: 0.9, act1: 2}).ad.ok80, tc({tout: 17.2, ta: 28.3, tr: 28.3, v: 0.15, act1: 2}).ad.ok80, tc({tout: 17.2, ta: 21.7, tr: 21.7, v: 0.15, act1: 2}).ad.ok80], [19.6, 26.6, 28.4, true, false, true]);
check('Table 5-K: 0.6 m/s +1.2 K, 0.9 m/s +1.8 K, 1.2 m/s +2.2 K, none up to 0.3 m/s nor when to is not above 25 C; 90 % limits are 0.31 t + 15.3 and + 20.3', [0.3, 0.6, 0.9, 1.2].map(v => tc({tout: 20, ta: 27, tr: 27, v, act1: 2}).ad.inc).concat([tc({tout: 20, ta: 24, tr: 24, v: 0.9, act1: 2}).ad.inc, +tc({tout: 20}).ad.lo90.toFixed(1), +tc({tout: 20}).ad.hi90.toFixed(1)]), [0, 1.2, 1.8, 2.2, 0, 21.5, 26.5]);
check('equation 5-B running mean: alpha 0.7 gives 0.3 x 20 + 0.7 x 10 = 13 C; the method needs 10 to 33.5 C outdoors (9 C fails), 1.0 to 1.3 met and free clothing', [+tc({tmode: 1, te: 20, trm0: 10, alpha: 0.7}).ad.tpma.toFixed(2), tc({tout: 9}).ad.app, tc({tout: 34}).ad.app, tc({tout: 20}).ad.app, tc({tout: 20, metc: 1.5}).ad.app, tc({tout: 20, adClo: 0}).ad.app, tc({tout: 20, adCtl: 0}).ad.app], [13, false, false, true, false, false, false]);
check('the analytical method needs 1.0 to 2.0 met and up to 1.5 clo (Table 5-A): 2.2 met and 1.6 clo fail; PMV in -0.5 to +0.5 and PPD 10 % at the limit', [tc({}).anOk, tc({metc: 2.2}).anOk, tc({cloc: 1.6, chair: 0}).anOk, tc({}).pmvOk, tc({ta: 30, tr: 30}).pmvOk, tc({ta: 30, tr: 30}).ok], [true, false, false, true, false, false]);
let td = tc({});
check('default room 24.5 / 25.5 C, 50 %, 0.15 m/s, 1.1 met, 0.71 clo: to 25.0 C, PMV +0.05, PPD 5 %, comfort range 23.1 to 26.4 C, graphical method applies', [+td.to.toFixed(1), +td.pmv.toFixed(2), Math.round(td.ppd), +td.lo.toFixed(1), +td.hi.toFixed(1), td.grOk, td.ok], [25, 0.05, 5, 23.1, 26.4, true, true], 0.05);
check('the comfort limits are the solutions of PMV = -0.5 and +0.5 at the same conditions', [+pmv(td.lo, td.lo, td.vr, 50, td.met, td.clo).pmv.toFixed(2), +pmv(td.hi, td.hi, td.vr, 50, td.met, td.clo).pmv.toFixed(2)], [-0.5, 0.5], 0.01);
w.renderCalc('thermalcomfort'); w.calcResult('thermalcomfort');
let tt = txt(w, 'tc_results');
check('the page opens with the operative temperature, PMV, PPD, SET, the adaptive block and the 🔴 note', [tt.includes('الحرارة التشغيلية'), tt.includes('PMV'), tt.includes('PPD'), tt.includes('SET'), tt.includes('المنهج التكيّفي'), tt.includes('🔴')], [true, true, true, true, true, true]);
check('other reference codes open it too', others('thermalcomfort', 'tc_results'), [true, true, true]);
}
// ---------- part 128: ISO 14644 cleanrooms (`cleanroom`: ISO 14644-1 classes, FS 209E and EU GMP equivalents, air change, velocity and ceiling coverage by class, FFU count, ISO 14644-2 schedule) ----------
{
w = boot('intl'); doc = w.document;
const cr = o => w.eval('crCalc(' + JSON.stringify(Object.assign({cls: 7, L: 6, W: 5, H: 3, st: 1, ffu: 650, d: 0.5}, o)) + ')');
check('ISO 14644-1 limits (particles/m3) at 0.5 um: ISO 3 35, 4 352, 5 3520, 6 35200, 7 352000, 8 3520000, 9 35200000', [3, 4, 5, 6, 7, 8, 9].map(c => w.eval('CR_LIM[' + c + '][3]')), [35, 352, 3520, 35200, 352000, 3520000, 35200000]);
check('ISO 5 row: 0.1 um 100000, 0.2 um 23700, 0.3 um 10200, 0.5 um 3520, 1 um 832, 5 um 29; ISO 6 at 5 um 293; ISO 7 at 5 um 2930; ISO 4 has no 5 um limit and ISO 7 none below 0.5 um', [w.eval('CR_LIM[5].join(" ")'), w.eval('CR_LIM[6][5]'), w.eval('CR_LIM[7][5]'), w.eval('CR_LIM[4][5]'), w.eval('CR_LIM[7][0]')], ['100000 23700 10200 3520 832 29', 293, 2930, null, null]);
check('ISO 1 and 2: 10 and 2 particles at 0.1 and 0.2 um; 100, 24, 10, 4 for ISO 2; ISO 3 at 1 um 8', [w.eval('CR_LIM[1].slice(0, 2).join(" ")'), w.eval('CR_LIM[2].slice(0, 4).join(" ")'), w.eval('CR_LIM[3][4]')], ['10 2', '100 24 10 4', 8]);
const bad = [];
for (let N = 1; N <= 9; N++) [0.1, 0.2, 0.3, 0.5, 1, 5].forEach((D, i) => { const t = w.eval('CR_LIM[' + N + '][' + i + ']'); if (t === null) return; const f = cr({cls: N, d: D}).cd; if (Math.abs(f - t) / t > 0.04 && !(N === 1 && D === 0.2) && !(N === 2 && D === 0.5)) bad.push([N, D]); });
check('the formula Cn = 10^N (0.1 / D)^2.08 reproduces every cell of the table within 4 % (ISO 1 at 0.2 um and ISO 2 at 0.5 um are rounded to whole particles in the table: 2 and 4)', [bad, Math.round(cr({cls: 7, d: 0.5}).cd), Math.round(cr({cls: 5, d: 0.5}).cd)], [[], 351676, 3517]);
check('FS 209E equivalents: ISO 3 Class 1 (M1.5), ISO 4 Class 10, ISO 5 Class 100 (M3.5), ISO 6 Class 1000, ISO 7 Class 10000 (M5.5), ISO 8 Class 100000 (M6.5); ISO 1, 2 and 9 none', [3, 4, 5, 6, 7, 8].map(c => cr({cls: c}).fs.join(" ")).concat([cr({cls: 2}).fs, cr({cls: 9}).fs]), ['1 M1.5', '10 M2.5', '100 M3.5', '1000 M4.5', '10000 M5.5', '100000 M6.5', null, null]);
check('EU GMP grades: A and B with ISO 5, C with ISO 7, D with ISO 8; at rest 3520 / 20, 3520 / 29, 352000 / 2900, 3520000 / 29000; in operation B 352000 / 2900, C 3520000 / 29000, D not defined', [cr({cls: 5}).gmp.join(""), cr({cls: 7}).gmp.join(""), cr({cls: 8}).gmp.join(""), cr({cls: 6}).gmp.length, w.eval('JSON.stringify(CR_GMP.map(g => g.slice(2)))')], ['AB', 'C', 'D', 0, '[[3520,20,3520,20],[3520,29,352000,2900],[352000,2900,3520000,29000],[3520000,29000,null,null]]']);
check('air change ranges: ISO 3 360-540, 4 300-540, 5 240-480, 6 150-240, 7 60-90, 8 5-48; ceiling coverage 60-100, 50-90, 35-70, 25-40, 15-20, 5-15 %; velocity ISO 5 0.203-0.406, ISO 7 0.051-0.076, ISO 8 0.005-0.041 m/s', [3, 4, 5, 6, 7, 8].map(c => w.eval('CR_AIR[' + c + '].slice(2, 4).join("-")')).concat([3, 4, 5, 6, 7, 8].map(c => w.eval('CR_AIR[' + c + '].slice(4).join("-")')), [5, 7, 8].map(c => w.eval('CR_AIR[' + c + '].slice(0, 2).join("-")'))), ['360-540', '300-540', '240-480', '150-240', '60-90', '5-48', '60-100', '50-90', '35-70', '25-40', '15-20', '5-15', '0.203-0.406', '0.051-0.076', '0.005-0.041']);
const fx = s => { const r = cr({cls: 5, st: s, L: 12 * 0.3048, W: 12 * 0.3048, H: 7 * 0.3048}); return [r.ach, Math.round(r.V * 35.3146667), +r.ffuRaw.toFixed(1)]; };
check('supplier example 12 x 12 x 7 ft (1008 ft3), ISO 5: 240 ACH needs 6.2 FFUs (the text says 6), 480 ACH needs 12.4 (12), FFU = ACH / 60 x ft3 / 650', [fx(0), fx(2)], [[240, 1008, 6.2], [480, 1008, 12.4]]);
let r = cr({});
check('ISO 7 room 6 x 5 x 3 m at mid range: 75 ACH, supply 6750 m3/h (1875 L/s, 3973 CFM), 6.1 FFU -> 7, coverage 17.5 % of 30 m2 = 5.25 m2 = 8 modules of 2 x 4 ft, velocity 0.064 m/s, non-unidirectional', [r.ach, r.Q, Math.round(r.Q / 3.6), Math.round(r.Q * 0.588578), +r.ffuRaw.toFixed(1), r.ffu, r.cov, +r.covA.toFixed(2), r.ffuCov, +r.vel.toFixed(3), r.unidir], [75, 6750, 1875, 3973, 6.1, 7, 17.5, 5.25, 8, 0.064, false]);
check('low and high end of the range: ISO 7 at rest 60 ACH, operational 90 ACH; ISO 5 and finer are unidirectional, ISO 6 and coarser are not; ISO 9 has no air data', [cr({st: 0}).ach, cr({st: 2}).ach, cr({cls: 5}).unidir, cr({cls: 6}).unidir, cr({cls: 9}).air], [60, 90, true, false, null]);
check('pressure differential 0.03 to 0.05 in w.g. = 7.5 to 12.5 Pa; particle count retest every 6 months up to ISO 5 and 12 months above (ISO 14644-2)', [+r.dp[0].toFixed(1), +r.dp[1].toFixed(1), cr({cls: 5}).retest, cr({cls: 6}).retest, cr({cls: 3}).retest], [7.5, 12.5, 6, 12, 6]);
w.renderCalc('cleanroom'); w.calcResult('cleanroom');
let tt = txt(w, 'cr_results');
check('the page opens with ISO 7, 352,000, FS 209E, EU GMP table and the 🔴 note', [tt.includes('الصنف 7'), tt.includes('352,000'), tt.includes('Class 10000'), tt.includes('GMP'), tt.includes('🔴')], [true, true, true, true, true]);
check('other reference codes open it too', others('cleanroom', 'cr_results'), [true, true, true]);
}
// ---------- part 129: ASHRAE 15 and 34 refrigerant concentration limit (`rclimit`: R-410A RCL 26 lb/1000 ft3, institutional 50 %, 3 kg exemption, permanent opening 0.15 %, pipe 2.2 m) ----------
{
w = boot('intl'); doc = w.document;
const rc = o => w.eval('rcCalc(' + JSON.stringify(Object.assign({ref: 0, rcl: 0.2, inst: false, Q: 15, L: 4, W: 4, H: 2.8, extra: 0, opening: 0, listed: false, pipeH: 0}, o)) + ')');
const lb = 0.45359237, ft = 0.3048;
check('R-410A RCL 26 lb/1000 ft3 = 0.4165 kg/m3 (0.416); the institutional occupancy is reduced to 50 % = 13 lb/1000 ft3 = 0.2082 kg/m3; a given RCL is used for another gas', [+rc({}).rcl.toFixed(4), +rc({}).lbRcl.toFixed(1), +rc({inst: true}).rcl.toFixed(4), +rc({inst: true}).lbRcl.toFixed(1), rc({ref: 1, rcl: 0.3}).rcl, rc({ref: 1, rcl: 0.3, inst: true}).rcl], [0.4165, 26, 0.2082, 13, 0.3, 0.15]);
let ex = rc({Q: 52 * lb, L: 10 * ft * 2, W: 10 * ft, H: 10 * ft});
check('the article example: 52 lb of R-410A and a 10 ft ceiling need at least 200 ft2 of floor (2000 ft3) in a non institutional room', [+(ex.minV / (ft * ft * ft)).toFixed(0), +(ex.minA / (ft * ft)).toFixed(0), ex.ok, rc({Q: 52 * lb, L: 20 * ft, W: 10.01 * ft, H: 10 * ft}).ok], [2000, 200, true, true]);
check('a room of 19.9 ft x 10 ft (199 ft2) is too small for that charge and the institutional room needs twice the volume', [rc({Q: 52 * lb, L: 19.9 * ft, W: 10 * ft, H: 10 * ft}).ok, +(rc({Q: 52 * lb, H: 10 * ft, inst: true}).minV / (ft * ft * ft)).toFixed(0)], [false, 4000]);
let d = rc({});
check('default 15 kg in 4 x 4 x 2.8 m (44.8 m3): maximum 0.4165 x 44.8 = 18.66 kg, minimum volume 36.0 m3, 80 % used, accepted', [d.V, +d.maxQ.toFixed(2), +d.minV.toFixed(1), Math.round(d.ratio * 100), d.ok], [44.8, 18.66, 36, 80, true], 0.01);
check('22 kg in the same room exceeds the limit: deficit 52.8 - 44.8 = 8.0 m3; an extra connected volume of 10 m3 with an opening under 0.15 % of the floor (0.024 m2) is not counted, with 0.03 m2 it is', [rc({Q: 22}).ok, +rc({Q: 22}).deficit.toFixed(1), rc({Q: 22, extra: 10, opening: 0.02}).connected, rc({Q: 22, extra: 10, opening: 0.02}).ok, rc({Q: 22, extra: 10, opening: 0.03}).connected, rc({Q: 22, extra: 10, opening: 0.03}).ok, +rc({}).openMin.toFixed(3)], [false, 8.0, false, false, true, true, 0.024], 0.1);
check('listed equipment with not more than 6.6 lb (3 kg) is exempt from the limit: 3 kg in a 2 m3 closet passes when listed, 3.5 kg does not, and unlisted 3 kg fails', [rc({Q: 3, listed: true, L: 1, W: 1, H: 2}).ok, rc({Q: 3.5, listed: true, L: 1, W: 1, H: 2}).ok, rc({Q: 3, listed: false, L: 1, W: 1, H: 2}).ok, rc({Q: 6.6 * lb, listed: true, L: 1, W: 1, H: 2}).exempt], [true, false, false, true]);
check('refrigerant piping crossing a passage is at least 2.2 m (7.25 ft) above the floor; 0 means not checked', [rc({pipeH: 2.2}).pipeOk, rc({pipeH: 2.0}).pipeOk, rc({pipeH: 0}).pipeOk, +(7.25 * ft).toFixed(2)], [true, false, true, 2.21]);
w.renderCalc('rclimit'); w.calcResult('rclimit');
let tt = txt(w, 'rc_results');
check('the page opens with the RCL, the maximum charge and the 🔴 note', [tt.includes('0.416'), tt.includes('18.7 kg'), tt.includes('26.0 lb/1000 ft³'), tt.includes('🔴'), tt.includes('مقبول')], [true, true, true, true, true]);
check('other reference codes open it too', others('rclimit', 'rc_results'), [true, true, true]);
}
// ---------- part 130: HTM 02-01 Part A medical gas flows and pipe sizing (`htmgas`: Tables 13 - 21, 4.75, A2 - A6 of Appendix G) ----------
{
w = boot('intl'); doc = w.document;
const hf = (gas, dep, n, o) => w.eval('hgFlow(' + JSON.stringify(Object.assign({gas, dep, n, nW: 1, V: 130}, o || {})) + ')');
const q = (gas, dep, n, o) => +hf(gas, dep, n, o).Q.toFixed(2);
const dp = (tab, od, L, Q) => +w.eval('hgLoss(' + JSON.stringify(tab) + ', HG_T[' + JSON.stringify(tab) + '].od.indexOf(' + od + '), ' + L + ', ' + Q + ').dp').toFixed(2);
const calc = o => w.eval('hgCalc(' + JSON.stringify(Object.assign({gas: 0, dep: 0, n: 28, nW: 1, V: 130, extra: 0, len: 30, pct: 30, allow: 0, elbow: 4, teeT: 2, teeB: 1, valve: 2}, o)) + ')');
check('Appendix G worked examples (equation 2): 400 kPa 28 mm 140 m 800 L/min 9.92 kPa, 122 m 1200 L/min 18.26; 700 kPa 1800 L/min 22.11 and 140 m 1100 L/min 10.78; 1100 kPa 2200 L/min 25.43 and 140 m 1300 L/min 10.39', [dp('A2', 28, 140, 800), dp('A2', 28, 122, 1200), dp('A3', 28, 122, 1800), dp('A3', 28, 140, 1100), dp('A4', 28, 122, 2200), dp('A4', 28, 140, 1300)], [9.92, 18.26, 22.11, 10.78, 25.43, 10.39]);
check('vacuum examples: 120 L/min in 122 m of 28 mm 2.99 kPa, 90 L/min in 140 m 2.20 kPa; the 15 mm 12 m 800 L/min example gives 21.3 kPa and 22 mm gives 2.8 kPa', [dp('A5', 28, 122, 120), dp('A5', 28, 140, 90), dp('A2', 15, 12, 800), dp('A2', 22, 12, 800)], [2.99, 2.2, 21.27, 2.78], 0.05);
check('table values: 12 mm at 8 m 311 / 455 / 564 L/min (7, 14, 21 kPa), 28 mm at 122 m 706 and 1287, 76 mm at 8 m 37754 / 53392 / 65392; 700 kPa 28 mm at 122 m 929 and 2232 (34 kPa); 1100 kPa 1145 and 2544; vacuum 28 mm 71 (1.3) and 187 (6.5)', [w.eval('HG_T.A2.f[0].map(r => r[0]).join(" ")'), w.eval('HG_T.A2.f[3][0][5]'), w.eval('HG_T.A2.f[3][2][5]'), w.eval('HG_T.A2.f[7].map(r => r[0]).join(" ")'), w.eval('HG_T.A3.f[3][0][5]'), w.eval('HG_T.A3.f[3][2][5]'), w.eval('HG_T.A4.f[3][0][5]'), w.eval('HG_T.A4.f[3][2][5]'), w.eval('HG_T.A5.f[3][0][5]'), w.eval('HG_T.A5.f[3][3][5]')], ['311 455 564', 706, 1287, '37754 53392 65392', 929, 2232, 1145, 2544, 71, 187]);
check('table shape: 400 kPa 12 to 76 mm (8 sizes, losses 7 14 21), 700 and 1100 kPa 12 to 42 mm (losses 7 14 34), vacuum 12 to 108 mm (losses 1.3 2.6 3.9 6.5), 17 distances from 8 to 457 m, flows fall with distance and rise with the loss', [w.eval('HG_T.A2.od.join(" ")'), w.eval('HG_T.A3.od.join(" ")'), w.eval('HG_T.A5.od.join(" ")'), w.eval('HG_T.A2.loss.join(" ")'), w.eval('HG_T.A3.loss.join(" ")'), w.eval('HG_T.A5.loss.join(" ")'), w.eval('HG_D.length'), w.eval('HG_D[0] + " " + HG_D[16]'), w.eval('["A2", "A3", "A4", "A5"].every(k => HG_T[k].f.every(b => b.every(r => r.every((x, j) => j === 0 || x === null || r[j - 1] === null || x <= r[j - 1] || (k === "A5" && x === 2036)))))')], ['12 15 22 28 35 42 54 76', '12 15 22 28 35 42', '12 15 22 28 35 42 54 76 108', '7 14 21', '7 14 34', '1.3 2.6 3.9 6.5', 17, '8 457', true]);
check('Table 13 oxygen: ward unit of 28 beds 10 + 27 x 6/4 = 50.5 L/min, three ward units Qd = 50.5 x 2 = 101; critical care 9 beds 10 + 8 x 6 x 3/4 = 46; CPAP 10 beds 75 x 10 x 75 % = 562.5; three operating rooms 100 + 2 x 10 = 120; resuscitation 5 trolleys 100 + 4 x 1.5', [q(0, 0, 28), q(0, 0, 28, {nW: 3}), q(0, 17, 9), q(0, 21, 10), q(0, 6, 3), q(0, 1, 5), q(0, 5, 3), q(0, 30, 3)], [50.5, 101, 46, 562.5, 120, 106, 0, 0]);
check('Tables 15 and 16: nitrous oxide 4 operating rooms 15 + 3 x 6 = 33; nitrous oxide/oxygen LDRP 8 rooms 275 + 7 x 3 = 296, 12 rooms 275 x 2 + 11 x 3 = 583; other areas 20 + (n - 1) 10/4', [q(1, 1, 4), q(2, 0, 8), q(2, 0, 12), q(2, 1, 5), q(1, 6, 3)], [33, 296, 583, 30, 0]);
check('Tables 18 and 20: medical air ward of 28 beds 20 + 27 x 10/4 = 87.5, critical care 6 beds 80 + 5 x 40 = 280, SCBU 10 cots 400, operating 3 rooms 40 + 2 x 10 = 60; surgical air 3 rooms 350 + 2 x 175 = 700, 6 rooms 350 + 5 x 87.5 = 787.5, other departments 350', [q(3, 0, 28), q(3, 13, 6), q(3, 11, 10), q(3, 5, 3), q(4, 0, 3), q(4, 1, 6), q(4, 2, 3), q(4, 3, 3)], [87.5, 280, 400, 60, 700, 787.5, 350, 0]);
check('Table 21 vacuum: a ward unit 40, five ward units 40 + 4 x 10 = 80, three operating suites 80 + 2 x 40 = 160, resuscitation 5 trolleys 40 + 4 x 10 = 80; paragraph 4.75 scavenging with V = 130: 4 theatres 130 + 3 x 130 = 520, 5 trolleys 130 + 4 x 32.5 = 260, other 9 rooms 130 + 8 x 16.25 = 260; V = 80 gives 160 for two theatres', [q(5, 0, 1), q(5, 1, 5), q(5, 8, 3), q(5, 2, 5), q(6, 1, 4), q(6, 0, 5), q(6, 5, 9), q(6, 1, 2, {V: 80})], [40, 80, 160, 80, 520, 260, 260, 160]);
check('Table A6 equivalent lengths: 28 mm elbow 0.80, tee through 0.54, tee branch 1.60, ball valve 0.90; 4 elbows, 2 tees through, 1 tee branch and 2 valves = 7.68 m; 15 mm elbow 0.47', [w.eval('hgEq(28, {elbow: 4, teeT: 2, teeB: 1, valve: 2})'), w.eval('hgEq(15, {elbow: 1, teeT: 0, teeB: 0, valve: 0})'), w.eval('hgEq(108, {elbow: 1, teeT: 0, teeB: 0, valve: 0})')], [7.68, 0.47, 2.36], 0.001);
let r = calc({});
check('default 28-bed oxygen ward on 30 m + 30 % + fittings: 50.5 L/min, 12 mm is enough (loss 1.26 kPa against 21 kPa), 12 mm equivalent length 42.14 m uses the 30 m column and its 141 L/min row at 7 kPa', [r.Q, r.allow, r.rec.od, +r.rec.dp.toFixed(2), +r.rec.Leq.toFixed(2), r.rec.dist, r.rec.F, r.rec.loss], [50.5, 21, 12, 1.26, 42.14, 30, 141, 7]);
check('a large flow needs a larger tube: 700 L/min of surgical air over 30 m and fittings takes 22 mm (5.03 kPa against 34 kPa), 12 and 15 mm fail; 80 L/min of vacuum takes 22 mm and the 12 mm tube is not tabulated at that flow', [calc({gas: 4, dep: 0, n: 3}).rec.od, +calc({gas: 4, dep: 0, n: 3}).rec.dp.toFixed(2), calc({gas: 4, dep: 0, n: 3}).rows.slice(0, 2).map(x => x.ok), calc({gas: 5, dep: 1, n: 5}).rec.od, calc({gas: 5, dep: 1, n: 5}).rows[0].ok], [22, 5.03, [false, false], 22, false]);
check('the allowed loss can be changed and the scavenging gas has no pipe table: 1 kPa on the oxygen ward needs 15 mm; flows are added to those of other departments', [calc({allow: 1}).rec.od, calc({extra: 100}).Q, calc({gas: 6, dep: 1, n: 4}).rec, calc({gas: 6, dep: 1, n: 4}).Q], [15, 150.5, null, 520]);
w.renderCalc('htmgas'); w.calcResult('htmgas');
let tt = txt(w, 'hg_results');
check('the page opens with 14.5 L/min (4 beds), the 12 mm tube, the pressure table and the 🔴 note', [tt.includes('14.5'), tt.includes('12 mm'), tt.includes('Δp kPa'), tt.includes('🔴'), tt.includes('5 %')], [true, true, true, true, true]);
check('other reference codes open it too', others('htmgas', 'hg_results'), [true, true, true]);
}
// ---------- part 131: EN 1993-1-1 steel I and H members (`ec3member`: Table 5.2, 6.2, 6.3.1, 6.3.2.3, 6.3.2.4, 6.3.3 with Annex B) ----------
{
w = boot('intl'); doc = w.document;
const sec = n => w.eval('(s => ({h: s[1], b: s[2], tw: s[3], tf: s[4], r: s[5], welded: false, eta: 1}))(EC_SEC.find(x => x[0] === ' + JSON.stringify(n) + '))');
const pr = o => w.eval('ecProps(' + JSON.stringify(o) + ')');
const ec = o => w.eval('ecCalc(' + JSON.stringify(Object.assign({grade: 2, gm1: 1, eta: 1, welded: false, h: 300, b: 150, tw: 7.1, tf: 10.7, r: 15, N: 0, My: 100, Mz: 0, V: 50, Lcy: 4, Lcz: 4, Llt: 4, dy: 0, py: 1, ay: 0, dz: 0, pz: 1, az: 0, sway: false, tor: true, c1: 0}, o)) + ')');
// catalogue values: A cm2, Iy cm4, Iz cm4, Wpl,y cm3, Wpl,z cm3, It cm4, Iw 1000 cm6
const cat = {'IPE 200': [28.48, 1943, 142.4, 220.6, 44.61, 6.98, 12.99], 'IPE 300': [53.81, 8356, 603.8, 628.4, 125.2, 20.12, 125.9], 'IPE 400': [84.46, 23130, 1318, 1307, 229, 51.08, 490], 'IPE 600': [156, 92080, 3387, 3512, 485.6, 165.4, 2846],
  'HEA 200': [53.83, 3692, 1336, 429.5, 203.8, 21.0, 108], 'HEA 300': [112.5, 18260, 6310, 1383, 641.2, 85.17, 1200], 'HEB 200': [78.08, 5696, 2003, 642.5, 305.8, 59.28, 171], 'HEB 300': [149.1, 25170, 8563, 1869, 870.1, 185, 1688]};
const err = n => { const p = pr(sec(n)), c = cat[n], m = [p.A / 100, p.Iy / 1e4, p.Iz / 1e4, p.Wply / 1e3, p.Wplz / 1e3, p.It / 1e4, p.Iw / 1e9]; return m.map((x, i) => Math.abs(x / c[i] - 1)); };
check('section properties by integration with the root fillets match the catalogue for IPE 200, 300, 400, 600, HEA 200, 300 and HEB 200, 300: A, Iy, Iz, Wpl,y and Wpl,z within 0.1 %, Iw within 1 %, It within 5 %', Object.keys(cat).map(n => { const e = err(n); return e.slice(0, 5).every(x => x < 0.001) && e[6] < 0.01 && e[5] < 0.05; }), [true, true, true, true, true, true, true, true]);
check('IPE 300 properties: A 5381 mm2, Iy 8356 cm4, Wpl,y 628.4 cm3, Av = A - 2 b tf + (tw + 2r) tf = 2568 mm2 (25.68 cm2), iy 12.46 cm, iz 3.35 cm', [Math.round(pr(sec('IPE 300')).A), Math.round(pr(sec('IPE 300')).Iy / 1e4), +(pr(sec('IPE 300')).Wply / 1e3).toFixed(1), Math.round(pr(sec('IPE 300')).Av), +(pr(sec('IPE 300')).iy / 10).toFixed(2), +(pr(sec('IPE 300')).iz / 10).toFixed(2)], [5381, 8356, 628.4, 2568, 12.46, 3.35]);
check('Table 6.1 imperfection factors a0 0.13, a 0.21, b 0.34, c 0.49, d 0.76 and the reduction factors at lambda 1.0: 0.7253, 0.6656, 0.5970, 0.5399, 0.4671', [w.eval('JSON.stringify(EC_ALPHA)'), ['a0', 'a', 'b', 'c', 'd'].map(k => +w.eval('ecChi(1.0, EC_ALPHA.' + k + ')').toFixed(4))], ['{"a0":0.13,"a":0.21,"b":0.34,"c":0.49,"d":0.76}', [0.7253, 0.6656, 0.597, 0.5399, 0.4671]]);
const cv = (g, h, b, tf, wd, ax) => w.eval('ecCurve({fyGrade: ' + g + ', h: ' + h + ', b: ' + b + ', tf: ' + tf + ', welded: ' + wd + '}, "' + ax + '")');
check('Table 6.2 curves: rolled h/b > 1.2 and tf <= 40: a and b (S460 a0 and a0); 40 < tf <= 100: b and c (S460 a and a); h/b <= 1.2 and tf <= 100: b and c (S460 a and a); tf > 100: d and d (S460 c and c); welded tf <= 40: b and c, tf > 40: c and d', [[355, 300, 150, 10, false], [460, 300, 150, 10, false], [355, 600, 300, 60, false], [460, 600, 300, 60, false], [355, 300, 300, 19, false], [460, 300, 300, 19, false], [355, 400, 400, 120, false], [460, 400, 400, 120, false], [355, 600, 200, 30, true], [355, 600, 200, 50, true]].map(a => cv(...a, 'y') + cv(...a, 'z')), ['ab', 'a0a0', 'bc', 'aa', 'bc', 'aa', 'dd', 'cc', 'bc', 'cd']);
let r = ec({});
check('IPE 300 S355: epsilon 0.814, web c/t = (278.6 - 30) / 7.1 = 35.0 with the pure bending limit 72 eps = 58.6, flange c/t 5.3 -> class 1; Mpl,y,Rd = 628.4 cm3 x 355 = 223.1 kN.m, Vpl,Rd = 2568 x 355 / sqrt 3 = 526.4 kN', [+r.eps.toFixed(3), +r.ratio.toFixed(1), +r.webLim[0].toFixed(1), +r.fr.toFixed(1), r.cls, +(r.Mply / 1e6).toFixed(1), +(r.Vpl / 1000).toFixed(1)], [0.814, 35.0, 58.6, 5.3, 1, 223.1, 526.4], 0.06);
check('Table 5.2 pure compression web limits 33, 38, 42 eps: IPE 300 in S235 (c/t 35.0) is class 2 and in S355 (limit 34.2) class 4, which the calculator does not resolve; fy drops to 335 MPa above 40 mm (Table 3.1)', [ec({My: 0, V: 0, N: 1000, grade: 0}).cls, ec({My: 0, V: 0, N: 1000, grade: 0}).webLim.map(x => Math.round(x)), ec({My: 0, V: 0, N: 1000}).cls, +ec({My: 0, V: 0, N: 1000}).webLim[2].toFixed(1), ec({tf: 45}).fy, ec({tf: 45}).fu], [2, [33, 38, 42], 4, 34.2, 335, 470]);
r = ec({V: 421.1});
check('6.2.8: V = 0.8 Vpl gives rho = (2 x 0.8 - 1)^2 = 0.36 and My,V,Rd = (Wpl,y - rho Aw^2 / 4 tw) fy = 205.5 kN.m instead of 223.1; below 0.5 Vpl no reduction', [+r.rho.toFixed(2), +(r.MyV / 1e6).toFixed(1), ec({V: 200}).rho, +(ec({V: 200}).MyV / 1e6).toFixed(1)], [0.36, 205.5, 0, 223.1], 0.06);
r = ec({grade: 0, N: 800, My: 40, V: 0});
check('6.2.9.1 class 2 (S235 IPE 300, N = 800 kN): n = 0.633, a = (A - 2 b tf) / A = 0.403, My,N,Rd = Mpl,y (1 - n) / (1 - 0.5a) = 68.0 kN.m, Mz,N,Rd = Mpl,z [1 - ((n - a) / (1 - a))^2] = 25.1 kN.m; N under 0.25 Npl gives no reduction', [r.cls, +r.n.toFixed(3), +r.a.toFixed(3), +(r.MNy / 1e6).toFixed(1), +(r.MNz / 1e6).toFixed(1), +(ec({grade: 0, N: 200, My: 40, V: 0}).MNy / 1e6).toFixed(1)], [2, 0.633, 0.403, 68.0, 25.1, 147.7], 0.06);
check('6.3.1: HEB 300 S355 5 m about both axes: lambda_y = 0.504, curve b, chi = 0.883; curve c about z with chi 0.623; Nb,Rd = chi_z A fy = 3294 kN', [ec({h: 300, b: 300, tw: 11, tf: 19, r: 27, N: 1500, My: 150, Mz: 20, Lcy: 5, Lcz: 5, Llt: 5}).cy, ec({h: 300, b: 300, tw: 11, tf: 19, r: 27, N: 1500, My: 150, Mz: 20, Lcy: 5, Lcz: 5, Llt: 5}).cz, +ec({h: 300, b: 300, tw: 11, tf: 19, r: 27, N: 1500, My: 150, Mz: 20, Lcy: 5, Lcz: 5, Llt: 5}).ly.toFixed(3), +ec({h: 300, b: 300, tw: 11, tf: 19, r: 27, N: 1500, My: 150, Mz: 20, Lcy: 5, Lcz: 5, Llt: 5}).chy.toFixed(3), +ec({h: 300, b: 300, tw: 11, tf: 19, r: 27, N: 1500, My: 150, Mz: 20, Lcy: 5, Lcz: 5, Llt: 5}).chz.toFixed(3), Math.round(ec({h: 300, b: 300, tw: 11, tf: 19, r: 27, N: 1500, My: 150, Mz: 20, Lcy: 5, Lcz: 5, Llt: 5}).Nb / 1000)], ['b', 'c', 0.504, 0.883, 0.623, 3294], 0.002);
r = ec({});
check('6.3.2.3: IPE 300 S355 4 m, uniform moment (C1 = 1): Mcr = 159.9 kN.m, lambda_LT = 1.181, curve b (h/b = 2), chi_LT = 0.590 (kc = 1 so f = 1), Mb,Rd = 131.6 kN.m, utilisation 76 %', [+(r.lt.Mcr / 1e6).toFixed(1), +r.lt.lLT.toFixed(3), r.lt.cLT, +r.lt.chLTm.toFixed(3), r.lt.f, +(r.Mb / 1e6).toFixed(1), Math.round(r.ltUt * 100), r.ok], [159.9, 1.181, 'b', 0.59, 1, 131.6, 76, true], 0.06);
check('LTB curve of Table 6.5: rolled h/b <= 2 b and above 2 c, welded c and d; Table 6.6 kc = 1 / (1.33 - 0.33 psi): 1.0, 0.752 at psi = 0, 0.94 for a uniform load (C1 1.127), 0.90 for a central load (C1 1.348); f = 1 - 0.5 (1 - kc) [1 - 2 (lambda - 0.8)^2]', [ec({}).lt.cLT, ec({h: 600, b: 200, tw: 8, tf: 16, r: 15}).lt.cLT, ec({welded: true, h: 400, b: 200, tw: 8, tf: 16, r: 5}).lt.cLT, ec({welded: true, h: 600, b: 200, tw: 8, tf: 16, r: 5}).lt.cLT, +ec({py: 0, Llt: 6}).lt.kc.toFixed(3), ec({dy: 1}).lt.kc, ec({dy: 2}).lt.kc, +ec({dy: 1, Llt: 6}).lt.C1.toFixed(3), +ec({dy: 2}).lt.C1.toFixed(3), +ec({py: 0, Llt: 6}).lt.f.toFixed(3)], ['b', 'c', 'c', 'd', 0.752, 0.94, 0.9, 1.127, 1.348, 0.905], 0.002);
check('a short beam is not susceptible: 1 m gives lambda_LT 0.35 below 0.4, chi_LT = 1, Mb,Rd = Mpl,y,Rd, and the flange slenderness 0.33 is under 0.5 Mc,Rd / My,Ed = 1.12 (6.3.2.4)', [+ec({Llt: 1}).lt.lLT.toFixed(2), ec({Llt: 1}).lt.ignore, ec({Llt: 1}).lt.chLTm, +(ec({Llt: 1}).Mb / 1e6).toFixed(1), ec({Llt: 1}).lt.restrained, +ec({Llt: 1}).lt.lf.toFixed(2), +ec({Llt: 1}).lt.lfLim.toFixed(2)], [0.35, true, 1, 223.1, true, 0.33, 1.12], 0.06);
check('Table B.3 equivalent uniform moment factors: end moments 0.6 + 0.4 psi = 1.0, 0.6, 0.4 (not below); uniform load 0.95, concentrated load 0.90; uniform load with alpha_h = 1 -> 1.0; sway mode 0.9', [[[0, 1, 0], [0, 0, 0], [0, -1, 0], [1, 0, 0], [2, 0, 0], [1, 0, 1]].map(a => w.eval('ecCm(' + a.join(',') + ')')), ec({N: 300, sway: true}).Cmy, ec({N: 300, sway: true}).Cmz], [[1, 0.6, 0.4, 0.95, 0.9, 1], 0.9, 0.9]);
r = ec({N: 300, V: 0});
check('Annex B, class 1 IPE 300 S355 N = 300 kN, My = 100, uniform moment: kyy = Cmy (1 + (lambda_y - 0.2) n_y) = 1.035, kyz = 0.6 kzz, kzy of Table B.2 0.935 (torsion susceptible) or 0.6 kyy = 0.621 when restrained; equations 6.61 and 6.62 give 0.94 and 1.20 (second governs)', [r.cls, +r.kyy.toFixed(3), +(r.kyz / r.kzz).toFixed(2), +r.kzy.toFixed(3), +r.e1.toFixed(2), +r.e2.toFixed(2), +ec({N: 300, V: 0, tor: false}).kzy.toFixed(3), +ec({N: 300, V: 0, tor: false}).kyy.toFixed(3)], [1, 1.035, 0.6, 0.935, 0.94, 1.2, 0.621, 1.035], 0.006);
r = ec({N: 500, My: 80, Mz: 5, Lcy: 3.5, Lcz: 3.5, Llt: 3.5});
check('a class 3 member (N = 500 kN with My = 80, IPE 300 S355) uses the elastic factors and the stress check: web class 3 (alpha 0.90, psi -0.12), sigma / fy = 0.84, equation 6.62 = 1.43 fails', [r.cls, +r.alpha.toFixed(2), +r.psi.toFixed(2), +r.sec.toFixed(2), +r.e2.toFixed(2), r.ok], [3, 0.9, -0.12, 0.84, 1.43, false], 0.01);
check('tension and welded sections: N = -300 kN has no buckling check (utilisation 0) and a reduced My,N,Rd is not needed below 0.25 Npl; a welded 600 x 200 x 8 x 16 section has Av = eta hw tw = 4544 mm2 and takes curves b and c', [ec({N: -300, V: 0}).bucklingUt, +ec({N: -300, V: 0}).sec.toFixed(2), Math.round(ec({welded: true, h: 600, b: 200, tw: 8, tf: 16, r: 5}).P.Av), ec({welded: true, h: 600, b: 200, tw: 8, tf: 16, r: 5}).cy, ec({welded: true, h: 600, b: 200, tw: 8, tf: 16, r: 5}).cz], [0, 0.2, 4544, 'b', 'c'], 0.01);
w.renderCalc('ec3member'); w.calcResult('ec3member');
let tt = txt(w, 'ec_results');
check('the page opens with IPE 300 S355, class 1, 223.1 kN.m, chi_LT 0.590 and the 🔴 note', [tt.includes('S355'), tt.includes('223.1'), tt.includes('0.590'), tt.includes('Mb,Rd'), tt.includes('🔴'), tt.includes('مقبول')], [true, true, true, true, true, true]);
check('choosing HEB 300 from the catalogue list fills the dimensions', (() => { const x = boot('intl'); x.renderCalc('ec3member'); const s = x.document.getElementById('ec_ps'); s.value = String(x.eval('EC_SEC.findIndex(z => z[0] === "HEB 300")')); x.calcResult('ec3member'); return ['ec_h', 'ec_b', 'ec_tw', 'ec_tf', 'ec_r'].map(i => +x.document.getElementById(i).value); })(), [300, 300, 11, 19, 27]);
check('other reference codes open it too', others('ec3member', 'ec_results'), [true, true, true]);
}
// ---------- part 132: UAE Fire and Life Safety Code chapter 3 (`uaeegress`: Tables 3.1 - 3.4, 3.6A, 3.6B, 3.7, 3.8, 7.4.1) ----------
{
w = boot('ae'); doc = w.document;
const ue = o => w.eval('ueCalc(' + JSON.stringify(Object.assign({oc: 0, spr: true, area: 3000, seats: 0, bench: 0, extra: 0, nExits: 2, stairW: 2600, corrW: 0, diag: 40, sepProvided: 0, de: 0, cp: 0, td: 0, roomArea: 0, riser: 0, tread: 0, head: 0, slope: 0}, o)) + ')');
check('Table 3.6A has 41 occupancy rows; load factors (m2 per person): business 9.3, clinics 9.3, classrooms 1.9 net, labs 4.6, concentrated assembly 0.65, less concentrated 1.4, waiting 0.28, kitchens 9.3, pools 4.6, pool decks 2.8, casinos 1.0, in-patient 22.3, sleeping 11.1, sale area 2.8 and 3.7, detention 11.1, dormitory and apartments 18.6, day care 3.3, labor 3, storage 27.9', [w.eval('UE_OC.length'), [0, 1, 2, 3, 4, 5, 8, 9, 12, 13, 18, 20, 21, 22, 23, 24, 26, 27, 28, 30, 31, 36].map(k => w.eval('UE_OC[' + k + '][1]'))], [41, [9.3, 9.3, 1.9, 4.6, 0.65, 1.4, 0.28, 9.3, 4.6, 2.8, 1, 22.3, 11.1, 9.3, 2.8, 3.7, 11.1, 18.6, 18.6, 3.3, 3, 27.9]]);
check('occupant load: business 3000 m2 / 9.3 = 322.6 -> 323; concentrated assembly 200 m2 / 0.65 = 308; 120 fixed seats = 120; 10 m of benches / 455 mm = 22; extra persons are added', [ue({}).load, ue({oc: 4, area: 200}).load, ue({oc: 7, seats: 120}).load, ue({oc: 6, bench: 10}).load, ue({extra: 10}).load], [323, 308, 120, 22, 333]);
check('Table 3.4: two exits up to 500 persons, three from 501 to 1000, four above 1000; one exit for 323 persons fails', [500, 501, 1000, 1001].map(n => ue({oc: 7, seats: n}).nExits).concat([ue({nExits: 1}).exitsOk, ue({}).exitsOk]), [2, 3, 3, 4, false, true]);
check('Table 3.6A capacities: stairs 7.6 mm per person, ramps 5, corridors 5; labor accommodation 10 stairs, special process industry and high-hazard storage 18 / 10 / 10; animal housing 10; 323 persons need 2455 mm of stairs and 1615 mm of corridor', [ue({}).cap, ue({oc: 31}).cap, ue({oc: 34}).cap, ue({oc: 37}).cap, ue({oc: 40}).cap, Math.round(ue({}).reqStair), Math.round(ue({}).reqCorr), Math.round(ue({}).reqRamp)], [[7.6, 5, 5], [10, 5, 5], [18, 10, 10], [18, 10, 10], [10, 5, 5], 2455, 1615, 1615]);
check('stairs: 2600 mm on 2 stairs (1300 each) passes, 2400 mm fails; the width of one exit stair is 1200 mm for under 2000 persons and 1420 mm above (Table 3.2); 4 exits for 2500 persons', [ue({}).stairOk, ue({stairW: 2400}).stairOk, ue({stairW: 2400, area: 3000, oc: 7, seats: 100}).stairOk, ue({}).stairMin, ue({oc: 7, seats: 2100}).stairMin, ue({stairW: 2000}).stairOk], [true, false, true, 1200, 1420, false]);
check('limits (dead end, common path, travel m) sprinklered / not: business 15, 30, 91 / 6.1, 23, 61; education 15, 30, 61 / 6.1, 23, 45; assembly 6.1, 23, 76 / 6.1, 23, 45; hotel and staff 15, 38, 99 / 10.7, 23, 53; industrial general 15, 30, 76 / 15, 15, 61; special process 122 / 91; open parking 122 / 91, enclosed 60 / 45', [[0, 2, 4, 32, 33, 34, 38, 39].map(k => { const a = ue({oc: k, spr: true}).lims, b = ue({oc: k, spr: false}).lims; return [a.de, a.cp, a.td, b.de, b.cp, b.td].join(' '); })], [['15 30 91 6.1 23 61', '15 30 61 6.1 23 45', '6.1 23 76 6.1 23 45', '15 38 99 10.7 23 53', '15 30 76 15 15 61', '15 30 122 15 15 91', '15 15 122 15 15 91', '15 15 60 15 15 45']]);
check('limit checks: business travel 90 m passes sprinklered and fails without; dead end 7 m fails without sprinklers; high hazard industry has no stated non-sprinklered travel distance (an entered value fails, none passes); storage high hazard 30 / 23 m', [ue({td: 90}).tdOk, ue({td: 90, spr: false}).tdOk, ue({de: 7, spr: false}).deOk, ue({de: 7}).deOk, ue({oc: 35, spr: false}).lims.td, ue({oc: 35, spr: false, td: 20}).tdOk, ue({oc: 35, spr: false}).tdOk, ue({oc: 37}).lims.td, ue({oc: 37, spr: false}).lims.td], [true, false, false, true, null, false, true, 30, 23]);
check('7.4.1 remoteness: a third of the diagonal when sprinklered (40 m -> 13.3 m), a half otherwise (20 m)', [+ue({}).sep.toFixed(1), +ue({spr: false}).sep.toFixed(1), ue({sepProvided: 12}).sepOk, ue({sepProvided: 14}).sepOk], [13.3, 20, false, true]);
check('Table 3.6B: minimum corridor width assembly 1200, education 1830, health care 1830, board and care 1525, mercantile 1675, detention 1220, business 1200; rooms needing two exits business 280 m2, education 93, hotels 185, ambulatory 232; 300 m2 office room needs two exits, 250 does not', [[1, 2, 3, 5, 8, 11, 0].map(k => w.eval('UE_GR[' + k + '][1]')), [0, 1, 6, 4].map(k => w.eval('UE_GR[' + k + '][2]')), ue({roomArea: 300}).twoExitRoom, ue({roomArea: 250}).twoExitRoom, ue({oc: 2, area: 100, corrW: 1700}).corrOk, ue({oc: 2, area: 100, corrW: 1900}).corrOk], [[1830, 1200, 1830, 1220, 1525, 1675, 1200], [280, 93, 185, 232], true, false, false, true]);
check('Table 3.7 assembly doors and aisles: 50 - 200 persons 2 doors 1120 mm, 201 - 500 2 doors 1120, 501 - 1000 3 doors 1220, over 1000 to 2000 4 doors 1220; under 50 none', [100, 300, 700, 1500].map(n => ue({oc: 7, seats: n}).as.slice(1).join(' ')).concat([ue({oc: 7, seats: 40}).as]), ['2 1120', '2 1120', '3 1220', '4 1220', null]);
check('Table 3.8 seats per row by seat way width (aisle on one side / two sides): 300 mm 7 / 14, 325 8 / 16, 350 9 / 18, 375 10 / 20, 400 11 / 22, 425 12 / 24, 450 12 / 26, 475 12 / 28, 500 12 / limited by travel distance', [w.eval('UE_SW.map(x => x.join("/")).join(" ")')], ['300/7/14 325/8/16 350/9/18 375/10/20 400/11/22 425/12/24 450/12/26 475/12/28 500/12/']);
check('Tables 3.1 - 3.3: riser 100 - 180 mm, tread at least 280, headroom at least 2030 mm on stairs, ramp slope at most 1 in 12; a 190 mm riser, 250 mm tread, 2000 mm headroom or slope 0.1 fails', [ue({riser: 190}).riserOk, ue({riser: 175}).riserOk, ue({riser: 90}).riserOk, ue({tread: 250}).treadOk, ue({tread: 280}).treadOk, ue({head: 2000}).headOk, ue({head: 2030}).headOk, ue({slope: 0.1}).rampOk, ue({slope: 1 / 12}).rampOk, ue({riser: 190}).ok], [false, true, false, false, true, false, true, false, true, false]);
w.renderCalc('uaeegress'); w.calcResult('uaeegress');
let tt = txt(w, 'ue_results');
check('the page opens with 323 persons, 2455 mm, 91.0 m and the 🔴 note', [tt.includes('323'), tt.includes('2455 mm'), tt.includes('91.0 m'), tt.includes('🔴'), tt.includes('مقبول')], [true, true, true, true, true]);
check('other reference codes open it too', others('uaeegress', 'ue_results'), [true, true, true]);
}
// ---------- part 133: UAE Fire and Life Safety Code chapter 9 sprinklers (`uaesprink`: Table 9.7 hazard classes and occupancies, 5.12, 5.14, Tables 9.5 and 9.6) ----------
{
w = boot('ae'); doc = w.document;
const us = o => w.eval('usCalc(' + JSON.stringify(Object.assign({occ: 0, hz: -1, side: false, A: 0, s: 0, l: 0, n: 0, pipe: 50, loc: 0, T: 38, P: 0}, o)) + ')');
const idx = n => w.eval('US_OCC.findIndex(x => x[0] === ' + JSON.stringify(n) + ')');
const cls = n => us({occ: idx(n)}).hi;
check('Table 9.7 hazard classes: light 21 m2 (4.6 m) and sidewall 18.2 (4.27), 4.1 L/min/m2 over 140 m2, 60 min, zone 4831; ordinary group 1 12 m2 (4.6), sidewall 9.3 (3), 6.1 over 140 m2, 950 L/min, 60 min; group 2 8.1; extra group 1 9.3 m2 (3.7), 12.2 over 232 m2, 1900 L/min, 90 min, zone 3716; extra group 2 16.3, 120 min', [0, 1, 2, 3, 4].map(k => w.eval('US_HZ[' + k + '].slice(1).join(" ")')), ['21 4.6 18.2 4.27 4.1 140 379 60 4831 0.5', '12 4.6 9.3 3 6.1 140 950 60 4831 1', '12 4.6 9.3 3 8.1 140 950 60 4831 1', '9.3 3.7 0 0 12.2 232 1900 90 3716 0', '9.3 3.7 0 0 16.3 232 1900 120 3716 0']);
check('classification of occupancies: offices, hospitals, hotels-type light (mosques, museums, theaters, corridors); bakeries and canneries ordinary 1; archives, retail and mercantile ordinary 2; aircraft hangars, die casting and saw mills extra 1; asphalt saturating, flammable liquids spraying and plastic processing extra 2', [['المكاتب', 'المستشفيات', 'المساجد', 'المتاحف', 'المسارح ودور العرض', 'الممرات'].map(cls), ['المخابز', 'معامل التعليب'].map(cls), ['الأرشيفات', 'مناطق البيع بالتجزئة', 'التجاري'].map(cls), ['حظائر الطائرات', 'صب القوالب', 'مناشر الأخشاب'].map(cls), ['تشبيع الإسفلت', 'رش السوائل القابلة للاشتعال', 'معالجة البلاستيك'].map(cls)], [[0, 0, 0, 0, 0, 0], [1, 1], [2, 2, 2], [3, 3, 3], [4, 4, 4]]);
check('special hazards refer to another standard (no class): incinerators NFPA 82, ovens NFPA 86C, cable tunnels NFPA 850, marine terminals NFPA 307, cooling towers NFPA 214, solvent extraction; the table has 139 locations', [cls('المحارق ومناولة النفايات والمفروشات'), cls('الأفران والمواقد'), cls('أنفاق الكبلات'), cls('المحطات البحرية والأرصفة'), cls('أبراج التبريد: أسطح المراوح الممتدة'), cls('استخلاص المذيبات'), us({occ: idx('الأفران والمواقد')}).h, w.eval('US_OCC.length')], [-1, -1, -1, -1, -1, -1, null, 139]);
let r = us({occ: idx('المكاتب')});
check('offices (light hazard): 4.1 x 140 = 574 L/min + hose 379 (100 gpm) = 953 L/min x 60 min = 57.2 m3; K 5.6 (80); per head 4.1 x 21 = 86.1 L/min needs (86.1 / 80)^2 = 1.16 bar (above the 0.5 bar minimum); 7 sprinklers (140 / 21 = 6.7)', [Math.round(r.Qs), r.Qhose, Math.round(r.Qt), +r.vol.toFixed(1), r.K, +r.qHead.toFixed(1), +r.pHead.toFixed(2), r.pmin, r.nHeads], [574, 379, 953, 57.2, 80, 86.1, 1.16, 0.5, 7], 0.01);
r = us({occ: idx('الأرشيفات')});
check('archives (ordinary group 2): 8.1 x 140 = 1134 L/min + 950 = 2084 x 60 = 125.0 m3; K 5.6 (80 since the density is not above 8.1); head 8.1 x 12 = 97.2 L/min at 1.48 bar (minimum 1.0 bar); 12 sprinklers; zone 4831 m2', [Math.round(r.Qs), Math.round(r.Qt), +r.vol.toFixed(1), r.K, +r.qHead.toFixed(1), +r.pHead.toFixed(2), r.pmin, r.nHeads, r.zone], [1134, 2084, 125, 80, 97.2, 1.48, 1, 12, 4831], 0.01);
r = us({occ: idx('حظائر الطائرات')});
check('aircraft hangars (extra group 1): 12.2 x 232 = 2830 L/min + 1900 = 4730 x 90 = 425.7 m3; K 8.0 (116) between 8.1 and 13.9; head 12.2 x 9.3 = 113.5 L/min at 0.96 bar; 25 sprinklers; zone 3716 m2', [Math.round(r.Qs), Math.round(r.Qt), +r.vol.toFixed(1), r.K, +r.qHead.toFixed(1), +r.pHead.toFixed(2), r.nHeads, r.zone], [2830, 4730, 425.7, 116, 113.5, 0.96, 25, 3716], 0.01);
r = us({occ: idx('تشبيع الإسفلت')});
check('asphalt saturating (extra group 2): 16.3 x 232 = 3782 L/min + 1900 = 5682 x 120 = 681.8 m3; density above 13.9 gives K 11.2 (161); head 16.3 x 9.3 = 151.6 L/min', [Math.round(r.Qs), Math.round(r.Qt), +r.vol.toFixed(1), r.K, +r.qHead.toFixed(1)], [3782, 5682, 681.8, 161, 151.6], 0.1);
check('the hazard class can be overridden and a sidewall sprinkler takes its own coverage and spacing: ordinary 1 for an office, light sidewall 18.2 m2 and 4.27 m, ordinary sidewall 9.3 m2 and 3 m, extra hazard has no sidewall sprinkler', [us({occ: idx('المكاتب'), hz: 1}).dens, us({side: true, occ: idx('المكاتب')}).cov, us({side: true, occ: idx('المكاتب')}).sp, us({side: true, occ: idx('الأرشيفات')}).cov, us({side: true, occ: idx('الأرشيفات')}).sp, us({side: true, occ: idx('حظائر الطائرات')}).cov], [6.1, 18.2, 4.27, 9.3, 3, 9.3]);
check('spacing of a light hazard layout: 4.5 x 4.5 m = 20.25 m2 passes; 4.7 m exceeds the 4.6 m spacing; 5 x 4.2 = 21 m2 passes coverage but not spacing; 1.5 m is below the 1.8 m minimum', [us({occ: idx('المكاتب'), s: 4.5, l: 4.5}).covOk, us({occ: idx('المكاتب'), s: 4.5, l: 4.5}).spOk, us({occ: idx('المكاتب'), s: 4.7, l: 4.4}).spOk, us({occ: idx('المكاتب'), s: 5, l: 4.2}).covOk, us({occ: idx('المكاتب'), s: 5, l: 4.2}).spOk, us({occ: idx('المكاتب'), s: 1.5, l: 4}).spOk], [true, true, false, true, false, false]);
check('zone limits: 4831 m2 for light and ordinary (floor 5000 m2 needs 2 zones), 3716 m2 for extra hazard (3000 passes, 4000 needs 2 zones)', [us({occ: idx('المكاتب'), A: 5000}).zones, us({occ: idx('المكاتب'), A: 4831}).zoneOk, us({occ: idx('المكاتب'), A: 5000}).zoneOk, us({occ: idx('حظائر الطائرات'), A: 3000}).zoneOk, us({occ: idx('حظائر الطائرات'), A: 4000}).zones], [2, true, false, true, 2]);
check('Table 9.6 heads per pipe size (light / ordinary and storage / above false ceiling and below raised floor): 25 mm 2 / 2 / 2, 32 mm 3 / 3 / 4, 40 mm 5 / 5 / 7, 50 mm 10 / 10 / 15, 65 mm 30 / 20 / 30, 80 mm 60 / 40 / 60, 100 mm 100 each, 150 mm 230 / 275 / 300', [w.eval('US_PIPE.map(x => x.join(":")).join(" ")')], ['25:2:2:2 32:3:3:4 40:5:5:7 50:10:10:15 65:30:20:30 80:60:40:60 100:100:100:100 150:230:275:300']);
check('pipe check: 12 heads on 50 mm fails for light (10) and ordinary (10) but passes above a false ceiling (15); the smallest pipe for 12 heads is 65 mm (light, ordinary) or 50 mm (above false ceiling); 25 heads of ordinary hazard need 80 mm', [us({occ: idx('المكاتب'), n: 12}).pipeOk, us({occ: idx('الأرشيفات'), n: 12}).pipeOk, us({occ: idx('الأرشيفات'), n: 12, loc: 1}).pipeOk, us({occ: idx('المكاتب'), n: 12}).pipeMin, us({occ: idx('الأرشيفات'), n: 12}).pipeMin, us({occ: idx('الأرشيفات'), n: 12, loc: 1}).pipeMin, us({occ: idx('الأرشيفات'), n: 25}).pipeMin, us({occ: idx('المكاتب'), n: 12, pipe: 65}).pipeAllowed], [false, false, true, 65, 65, 50, 80, 30]);
check('Table 9.5: ceiling up to 38 C -> 57 or 68 (bulb) / 60 or 74 (solder) ordinary orange or red; up to 66 C -> 79 or 93 / 100 intermediate yellow or green; up to 107 C -> 141 / 187 high blue; above 107 C none', [37, 38, 50, 66, 80, 107, 120].map(t => { const x = us({occ: 0, T: t}).temp; return x ? x[2] : null; }), ['عادي', 'عادي', 'متوسط', 'متوسط', 'عالٍ', 'عالٍ', null]);
check('operating pressure: at least 0.5 bar (light) and 1.0 bar (ordinary), at most 12 bar: 0.4 bar fails for light, 0.6 passes, 0.8 fails for ordinary, 13 bar fails', [us({occ: idx('المكاتب'), P: 0.4}).opOk, us({occ: idx('المكاتب'), P: 0.6}).opOk, us({occ: idx('الأرشيفات'), P: 0.8}).opOk, us({occ: idx('الأرشيفات'), P: 1.5}).opOk, us({occ: idx('الأرشيفات'), P: 13}).opOk], [false, true, false, true, false]);
w.renderCalc('uaesprink'); w.calcResult('uaesprink');
let tt = txt(w, 'us_results');
check('the page opens with the office light hazard, 574 L/min, 57.2 m3 and the 🔴 note', [tt.includes('خفيف الخطورة'), tt.includes('574 L/min'), tt.includes('57.2 m³'), tt.includes('🔴'), tt.includes('K 5.6')], [true, true, true, true, true]);
check('other reference codes open it too', others('uaesprink', 'us_results'), [true, true, true]);
}
// ---------- part 134: UAE Fire and Life Safety Code miscellaneous (`uaemisc`: Table 4.3, Tables 11.1 - 11.3, Table 12.1, chapter 14 with Tables 14.1 and 14.3, chapters 5 and 6) ----------
{
w = boot('ae'); doc = w.document;
const um = o => w.eval('umCalc(' + JSON.stringify(Object.assign({mode: 0, loc: 0, area: 0, dist: 0, top: 0, bottom: 0, temp: 0, ltype: 1, cap: 1000, unit: 0, dia: 2, fill: 0, sd1: 0, sd2: 0, open: 0, intake: 0, between: 0, oil: 1000, ounit: 0, sep: 0, sloc: 14, zone: 1, travel: 0, cp: 0, clear: 0, len: 12, have: 0, view: 30, mount: 0, fs: 0, avg0: 0, min0: 0, max0: 0, avg90: 0, min90: 0, dur: 0, delay: 0, src: false, lux: 0, watts: 0}, o)) + ')');
const lpg = (t, gal, dia) => w.eval('umLpg(' + JSON.stringify(t) + ', ' + gal + ', ' + (dia || 2) + ')');
check('Table 4.3 travel distances: offices 15 m, corridors and lobbies 22.5, electrical, telephone, mechanical and lift machine rooms 9, parking 15 (and 30 m along the driveway), transformer room 9, HV/LV 9, diesel generator 9, garbage rooms 9, library 15, laboratories 9, gymnasium 15, theater 15, kitchen 9, patient rooms 15, hotel 15', [w.eval('UM_EXT.length'), w.eval('UM_EXT.map(x => x[2]).join(" ")')], [15, '15 22.5 9 15 9 9 9 9 15 9 15 15 9 15 15']);
check('extinguisher sets: offices water 9 L + CO2 2 kg, corridors CO2 5 kg, transformer room 25 kg dry powder trolley per transformer, kitchen foam; 600 m2 of offices (15 m radius) needs 1 set by the estimate, 3000 m2 needs 5; travel 16 m fails in offices; mounting top 1.5 m and bottom 0.3 m; 4 to 49 C', [um({mode: 0}).ext[1], um({mode: 0, loc: 1}).ext[1], um({mode: 0, loc: 4}).ext[1].includes('25 kg'), um({mode: 0, loc: 12}).ext[1].includes('رغوة'), um({mode: 0, area: 600}).sets, um({mode: 0, area: 3000}).sets, um({mode: 0, dist: 16}).travelOk, um({mode: 0, dist: 15}).travelOk, um({mode: 0, top: 1.5, bottom: 0.3}).heightOk, um({mode: 0, top: 1.6, bottom: 0.3}).heightOk, um({mode: 0, top: 1.4, bottom: 0.2}).heightOk, um({mode: 0, temp: 50}).tempOk, um({mode: 0, temp: 30}).tempOk], ['ماء 9 L + CO₂ 2 kg', 'ماء 9 L + CO₂ 5 kg', true, true, 1, 5, false, true, true, false, false, false, true]);
const L = (t, g, d) => { const x = lpg(t, g, d); return x.allowed ? [x.intake, x.openings, x.edge, +x.between.toFixed(2)].join(' ') : 'no'; };
check('Table 11.1 roof top: under 125 gal 6.1, 3, 0, 0; 125 - 250: 6.1, 3, 3, 0; 251 - 500: 6.1, 3, 3, 1; 501 - 2000: 6.1, 3, 7.6, 1; more than 2000 gal not allowed on roofs or podiums', [100, 125, 200, 250, 400, 500, 1000, 2000, 2001].map(g => L('roof', g)), ['6.1 3 0 0', '6.1 3 3 0', '6.1 3 3 0', '6.1 3 3 0', '6.1 3 3 1', '6.1 3 3 1', '6.1 3 7.6 1', '6.1 3 7.6 1', 'no']);
check('Table 11.2 aboveground: 2001 - 30000 gal 15 m and 1.5 m between; 30001 - 70000 gal 23 m and a quarter of the diameter between (2 m -> 0.5); 70001 - 90000 30; 90001 - 120000 38; 120001 - 200000 61; 200001 - 1000000 91; more than 1000000 122', [2500, 30000, 50000, 80000, 100000, 150000, 500000, 2000000].map(g => L('above', g, 2)), ['6.1 3 15 1.5', '6.1 3 15 1.5', '6.1 3 23 0.5', '6.1 3 30 0.5', '6.1 3 38 0.5', '6.1 3 61 0.5', '6.1 3 91 0.5', '6.1 3 122 0.5']);
check('Table 11.3 underground and mounded: under 500 gal 3 m from the structure, 501 - 2000 3 m, then 15 m for every larger size; between containers 0, 0, 1, 1, 1.5 and then a quarter of the diameter', [100, 400, 1500, 2500, 50000, 2000000].map(g => L('under', g, 4)), ['6.1 3 3 0', '6.1 3 3 1', '6.1 3 3 1', '6.1 3 15 1.5', '6.1 3 15 1', '6.1 3 15 1']);
check('capacity conversions and the roof limit: 5 m3 = 1321 gal, 1000 L = 264 gal; a 2500 gal roof container is not allowed (6.3.3); fill connection at least 2.4 m on roofs; remote shutdown within 4.6 m and a second between 7.6 and 30.5 m', [Math.round(um({mode: 1, cap: 5, unit: 1}).gal), Math.round(um({mode: 1, cap: 1000, unit: 2}).gal), um({mode: 1, ltype: 0, cap: 2500}).l.allowed, um({mode: 1, ltype: 0, cap: 2500}).roofLimit, um({mode: 1, ltype: 0, cap: 1000, fill: 2.2}).fillOk, um({mode: 1, ltype: 0, cap: 1000, fill: 2.4}).fillOk, um({mode: 1, sd1: 4.6}).sd1Ok, um({mode: 1, sd1: 5}).sd1Ok, um({mode: 1, sd2: 7}).sd2Ok, um({mode: 1, sd2: 20}).sd2Ok, um({mode: 1, sd2: 31}).sd2Ok], [1321, 264, false, true, false, true, true, false, false, true, false]);
check('LPG distance checks (1000 gal aboveground: 6.1 to intakes, 3 to openings, 7.6 to the structure, 1 between): 7 m to the structure fails, 7.6 passes, 5 m to an intake fails', [um({mode: 1, dist: 7}).dOk, um({mode: 1, dist: 7.6}).dOk, um({mode: 1, intake: 5}).intakeOk, um({mode: 1, intake: 6.1}).intakeOk, um({mode: 1, open: 2.5}).openOk, um({mode: 1, between: 0.5}).betweenOk, um({mode: 1, between: 1}).betweenOk], [false, true, false, true, false, false, true]);
check('Table 14.1 outdoor transformers without a firewall: under 500 gal 1.5 m, 500 to 2000 gal 7.6 m, above 2000 gal 15 m; 1000 L = 264 gal -> 1.5 m; indoor oil above 100 gal needs a 4-hour barrier; 7 m of 1000 gal fails', [499, 500, 2000, 2001].map(g => um({mode: 2, oil: g}).outdoor).concat([um({mode: 2, oil: 1000, ounit: 1}).outdoor, um({mode: 2, oil: 100}).indoorBarrier, um({mode: 2, oil: 101}).indoorBarrier, um({mode: 2, oil: 1000, sep: 7}).sepOk, um({mode: 2, oil: 1000, sep: 7.6}).sepOk]), [1.5, 7.6, 7.6, 15, 1.5, 0, 4, false, true]);
check('substation egress: travel 23 m in basements and cable spreading areas, 60 m elsewhere, common path 15 m, clearance 1525 mm between panel rows', [um({mode: 2, zone: 0, travel: 24}).travelOk, um({mode: 2, zone: 0, travel: 23}).travelOk, um({mode: 2, zone: 1, travel: 60}).travelOk, um({mode: 2, zone: 1, travel: 61}).travelOk, um({mode: 2, cp: 16}).cpOk, um({mode: 2, cp: 15}).cpOk, um({mode: 2, clear: 1500}).clearOk, um({mode: 2, clear: 1525}).clearOk, um({mode: 2, zone: 0}).travelLim], [false, true, true, false, false, true, false, true, 23]);
check('Table 14.3 has 20 locations: the oil-filled transformer room has multisensor detection and water spray, the cable tunnel linear heat detection and water spray, the battery room explosion-proof flame and heat detection with gas, the switchgear room early warning smoke detection only, the yard hydrants', [w.eval('UM_SUB.length'), um({mode: 2, sloc: 14}).sub.slice(1), um({mode: 2, sloc: 4}).sub[2], um({mode: 2, sloc: 1}).sub[1], um({mode: 2, sloc: 13}).sub[2], um({mode: 2, sloc: 18}).sub[2].includes('حنفيات')], [20, ['كشف متعدد المستشعرات', 'رشاش ماء'], 'رشاش ماء بتفعيل من الكشف الحراري الخطي فقط', 'كشف لهب وحرارة مانع للانفجار', 'لا شيء', true]);
check('Table 12.1: exposing wall length 6 m -> 9 m, 9 m -> 11, 12 m -> 12, 15 m -> 14, 18 m -> 15, above 18 m -> 18; a wall of 7 m takes the 9 m row (11 m); 10 m of separation fails for 12 m', [6, 7, 9, 12, 13, 15, 18, 20].map(l => um({mode: 3, len: l}).sep).concat([um({mode: 3, len: 12, have: 10}).sepOk, um({mode: 3, len: 12, have: 12}).sepOk]), [9, 11, 11, 12, 14, 14, 15, 18, false, true]);
check('exit signs: the spacing is the rated viewing distance or 30 m, whichever is less (20 m -> 20, 50 m -> 30), 100 m of corridor needs 4 signs at 30 m; the sign is within 2030 mm above the door and the floor sign 150 - 455 mm above the floor; externally illuminated signs 54 lux', [um({mode: 4, view: 20}).spacing, um({mode: 4, view: 50}).spacing, um({mode: 4, len: 100, view: 50}).signs, um({mode: 4, len: 60, view: 20}).signs, um({mode: 4, mount: 2030}).mountOk, um({mode: 4, mount: 2100}).mountOk, um({mode: 4, fs: 150}).floorSignOk, um({mode: 4, fs: 460}).floorSignOk, um({mode: 4, lux: 54}).signLux, um({mode: 4, lux: 50}).signLux], [20, 30, 4, 3, true, false, true, false, true, false]);
check('emergency lighting: initial average 10.8 lux and minimum 1.1 lux, after 1.5 h average 6.5 and minimum 0.65, ratio 40 : 1, 3 hours, switching delay 1 s (10 s when the source changes): the corner values pass and just below fail', [um({mode: 4, avg0: 10.8}).avg0, um({mode: 4, avg0: 10}).avg0, um({mode: 4, min0: 1.1}).min0, um({mode: 4, min0: 1}).min0, um({mode: 4, avg90: 6.5}).avg90, um({mode: 4, min90: 0.6}).min90, um({mode: 4, min0: 1.1, max0: 44}).ratioOk, um({mode: 4, min0: 1.1, max0: 45}).ratioOk, um({mode: 4, dur: 3}).durOk, um({mode: 4, dur: 2.5}).durOk, um({mode: 4, delay: 1}).delayOk, um({mode: 4, delay: 5}).delayOk, um({mode: 4, delay: 5, src: true}).delayOk, um({mode: 4, watts: 200}).energy], [true, false, true, false, true, false, true, false, true, false, true, false, true, 600]);
for (let k = 0; k < 5; k++) { w.renderCalc('uaemisc'); w.document.getElementById('um_m').value = String(k); w.calcResult('uaemisc'); }
w.renderCalc('uaemisc'); w.calcResult('uaemisc');
let tt = txt(w, 'um_results');
check('the page opens with the extinguisher table, the 🔴 note and each other topic shows its own group', [tt.includes('المطافئ المحمولة'), tt.includes('15.0 m'), tt.includes('🔴'), w.document.getElementById('um_g0').style.display === '', w.document.getElementById('um_g1').style.display === 'none'], [true, true, true, true, true]);
check('other reference codes open it too', others('uaemisc', 'um_results'), [true, true, true]);
}
// ---------- part 135: UAE Fire and Life Safety Code chapter 1 (`uaecomp`: Tables 1.2 - 1.7, 1.9, 1.10a) ----------
{
w = boot('ae'); doc = w.document;
const uc = o => w.eval('ucCalc(' + JSON.stringify(Object.assign({mode: 0, group: 0, sep: 3, area: 100, open: 0, spr: false, protOpen: false, occ: 0, h: 20, total: 0, comp: 0, stories: 1, height: 0, corr: 0, frr: 0, basement: false, apt: false, room: 0, oc10: 0}, o)) + ')');
check('Table 1.4 spot values (unprotected openings %, separation 1.2 / 1.5 / 1.8 / 2.1 / 2.4 / 2.7 / 3.0 m): 9 m2 -> 9, 12, 18, 25, 33, 43, 55; 140 m2 -> 7, 7, 8, 9, 10, 11, 12; 1860 m2 -> 7 everywhere; 0 and 1 m give 0; beyond 3 m 100 %', [[1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0].map(s => uc({sep: s, area: 9}).base), [1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0].map(s => uc({sep: s, area: 140}).base), [1.2, 1.5, 1.8, 2.1, 2.4, 2.7, 3.0].map(s => uc({sep: s, area: 1860}).base), uc({sep: 0, area: 50}).base, uc({sep: 1, area: 50}).base, uc({sep: 3.2, area: 50}).base], [[9, 12, 18, 25, 33, 43, 55], [7, 7, 8, 9, 10, 11, 12], [7, 7, 7, 7, 7, 7, 7], 0, 0, 100]);
check('Table 1.5 spot values: 4.5 m -> 69 (9 m2), 48 (14), 4 (1860); 6 m -> 100, 91, 70, 5; 7.5 m -> 100, 100, 100, 91 (23 m2), 5; 9 m -> 100 up to 28 m2, 86 (37), 8 (930), 6 (1860); 1.2 m 4 % for every area; beyond 9 m 100 %', [[9, 14, 1860].map(a => uc({group: 1, sep: 4.5, area: a}).base), [9, 14, 19, 1860].map(a => uc({group: 1, sep: 6, area: a}).base), [9, 14, 19, 23, 1860].map(a => uc({group: 1, sep: 7.5, area: a}).base), [28, 37, 930, 1860].map(a => uc({group: 1, sep: 9, area: a}).base), uc({group: 1, sep: 1.2, area: 500}).base, uc({group: 2, sep: 9.5, area: 500}).base], [[69, 48, 4], [100, 91, 70, 5], [100, 100, 100, 91, 5], [100, 86, 8, 6], 4, 100]);
check('table consistency: every row falls (or stays) with the exposing area and every column rises with the separation, in both tables', [w.eval('[UC_T14, UC_T15].every(T => Object.keys(T).every(k => T[k].length === 19 && T[k].every((x, i) => i === 0 || x <= T[k][i - 1])))'), w.eval('[UC_T14, UC_T15].every(T => { const ks = Object.keys(T).map(Number).sort((a, b) => a - b); return ks.every((k, j) => j === 0 || T[k].every((x, i) => x >= T[ks[j - 1]][i])); })'), w.eval('UC_AR.length')], [true, true, 19]);
check('the column of the next larger area is used (100 m2 -> the 140 column: 12 % at 3.0 m; 10 m2 -> 14: 40 %), a smaller row for a separation between rows (2.0 m -> the 1.8 row: 12 % at 23 m2 is not used, 18 % at 9 m2), and an area above 1860 uses the last column', [uc({sep: 3, area: 100}).base, uc({sep: 3, area: 10}).base, uc({sep: 2.0, area: 9}).base, uc({sep: 3, area: 5000}).base, uc({sep: 3, area: 100}).col], [12, 40, 18, 7, 140]);
check('openings may be doubled for sprinklers throughout or protected openings (9.4) up to 100 %: 9 m2 at 1.2 m 9 -> 18; 55 -> 100; the actual percentage and the compliance flag', [uc({sep: 1.2, area: 9, spr: true}).allowed, uc({sep: 3, area: 9, protOpen: true}).allowed, uc({sep: 1.2, area: 9}).allowed, +uc({sep: 3, area: 100, open: 10}).actual.toFixed(1), uc({sep: 3, area: 100, open: 10}).ok, uc({sep: 3, area: 100, open: 13}).ok, uc({sep: 3, area: 100, open: 13, spr: true}).ok], [18, 100, 9, 10, true, false, true]);
check('Table 1.2 wall fire rating (hr): group 1 (assembly, educational, business, residential, low hazard industrial) 1 up to 1.5 m then 0; group 2 (mercantile, ordinary hazard) 2, 1, 0; group 3 (high hazard) 3, 2, 1, 0 beyond 9 m; Table 1.3 opening protection 1.5 hr for a 2 hr wall and 0.75 hr for a 1 hr wall', [[1, 2, 5, 10].map(s => uc({group: 0, sep: s}).rating), [1, 2, 5, 10].map(s => uc({group: 1, sep: s}).rating), [1, 2, 5, 10].map(s => uc({group: 2, sep: s}).rating), uc({group: 1, sep: 1}).openRating, uc({group: 0, sep: 1}).openRating, uc({group: 0, sep: 5}).openRating], [[1, 0, 0, 0], [2, 1, 0, 0], [3, 2, 1, 0], 1.5, 0.75, null]);
const ha = (occ, h, o) => { const r = uc(Object.assign({mode: 1, occ, h}, o)); return [r.type, r.hr, r.limit]; };
check('Table 1.6: type A below 23 m (1 hr), B below 55 m (2 hr), C below 128 m (3 hr), D above (4 hr); business A 3485 m2 and unlimited above; board and care 1765 then 5110; day care 2460 then 5620; storage 2415 then 4460; assembly 1440, detention 1395, education 2460, health care 1395, ambulatory 3485, industrial 2320, mercantile 2000, residential 2230', [[22.9, 23, 54.9, 55, 127.9, 128].map(h => uc({mode: 1, occ: 3, h}).type), ha(3, 20), ha(3, 30), ha(4, 20), ha(4, 30), ha(5, 20), ha(5, 30), ha(13, 20), ha(13, 30), [0, 6, 7, 8, 9, 10, 11, 12].map(k => uc({mode: 1, occ: k, h: 10}).limit)], [[0, 1, 1, 2, 2, 3], [0, 1, 3485], [1, 2, 0], [0, 1, 1765], [1, 2, 5110], [0, 1, 2460], [1, 2, 5620], [0, 1, 2415], [1, 2, 4460], [1440, 1395, 2460, 1395, 3485, 2320, 2000, 2230]]);
check('notes 2 and 3 of Table 1.6: a fully sprinklered building that is not mercantile, industrial or storage drops D to C, C to B, and B to A below 36 m; mercantile, industrial and storage get no reduction', [uc({mode: 1, occ: 3, h: 130, spr: true}).type, uc({mode: 1, occ: 3, h: 100, spr: true}).type, uc({mode: 1, occ: 3, h: 30, spr: true}).type, uc({mode: 1, occ: 3, h: 40, spr: true}).type, uc({mode: 1, occ: 11, h: 130, spr: true}).type, uc({mode: 1, occ: 10, h: 30, spr: true}).type, uc({mode: 1, occ: 13, h: 30, spr: true}).type, uc({mode: 1, occ: 3, h: 130, spr: true}).reduced, uc({mode: 1, occ: 11, h: 130, spr: true}).noRed], [2, 1, 0, 1, 3, 1, 1, true, true]);
check('floor area check: 4000 m2 of business in type A fails (3485), 3485 passes, any area passes in type B (unlimited)', [uc({mode: 1, occ: 3, h: 20, area: 4000}).ok, uc({mode: 1, occ: 3, h: 20, area: 3485}).ok, uc({mode: 1, occ: 3, h: 30, area: 90000}).ok, uc({mode: 1, occ: 3, h: 30}).unlimited], [false, true, true, true]);
const sp = (occ, o) => { const r = uc(Object.assign({mode: 2, occ}, o)); return r.required; };
check('Table 1.7 unconditional occupancies: bars and nightclubs, day care, health care, ambulatory care, detention (pre-action), hotels and dormitories, board and care; others need a condition', [0, 3, 4, 5, 6, 9, 11].map(k => sp(k)).concat([sp(2), sp(12), uc({mode: 2, occ: 6}).pre, w.eval('UC_SP.length')]), [true, true, true, true, true, true, true, false, false, true, 18]);
check('Table 1.7 conditions: educational over 1860 m2, over 3 stories or 15 m, with a basement, corridors under 1 hour; mercantile over 1115 m2, business compartment over 900 m2 or height over 23 m; villas over 1115 m2, basement over 900 m2, over 23 m, wall under 2 hours; industrial 2230 and 900 m2; labor accommodation compartment 1860', [sp(2, {total: 1860}), sp(2, {total: 1861}), sp(2, {stories: 4}), sp(2, {height: 16}), sp(2, {basement: true}), sp(2, {corr: 0.5}), sp(12, {total: 1116}), sp(12, {total: 1115}), sp(13, {comp: 901}), sp(13, {height: 24}), sp(13, {height: 23}), sp(7, {total: 1116}), sp(7, {comp: 901}), sp(7, {height: 24}), sp(7, {frr: 1.5}), sp(7, {frr: 2}), sp(14, {total: 2231}), sp(14, {comp: 901}), sp(17, {comp: 1861}), sp(17, {stories: 4}), sp(16, {stories: 4}), sp(8, {height: 16})], [false, true, true, true, true, true, true, false, true, true, false, true, true, true, true, false, true, true, true, true, true, true]);
check('apartments: over 23 m, corridors under 1 hour, or an exit-access condition that fails; the reasons are listed', [sp(10, {height: 24}), sp(10, {height: 20}), sp(10, {corr: 0.5}), sp(10, {apt: true}), uc({mode: 2, occ: 10, height: 24, apt: true}).why.length], [true, false, true, true, 2]);
check('Table 1.9 room ratings (with / without sprinklers, hr): oil-fired boiler 1 / 2, generator 1 / 2, fire pump 1 / 2, emergency command centre 1 / 2, kitchen 1 / 1, gift shop 0 / 1, storage over 9.3 m2 1 / 2, cold room over 20 m2 1 / not allowed, cold room up to 20 m2 0 / 1, electrical room as per the construction type', [2, 15, 14, 11, 21, 16, 35, 4, 5, 10].map(k => [uc({mode: 3, room: k}).with, uc({mode: 3, room: k}).without].join('/')).concat([w.eval('UC_RM.length')]), ['1/2', '1/2', '1/2', '1/2', '1/1', '0/1', '1/2', '1/-2', '0/1', '-1/-1', 38]);
check('Table 1.10a corridors and internal walls (hr): sprinklered corridor day care 1, residential 1, board and care 1, others smoke separation only; not sprinklered corridors educational 1, day care 2, health 1, residential 1, board and care 2, mercantile 1, business 1; walls 1 everywhere not sprinklered, mercantile 1 sprinklered', [w.eval('UC_10A.sc.join("")'), w.eval('UC_10A.si.join("")'), w.eval('UC_10A.nc.join("")'), w.eval('UC_10A.ni.join("")')], ['0101100', '0101110', '1211211', '1111111']);
for (let k = 0; k < 4; k++) { w.renderCalc('uaecomp'); w.document.getElementById('uc_m').value = String(k); w.calcResult('uaecomp'); }
w.renderCalc('uaecomp'); w.calcResult('uaecomp');
let tt = txt(w, 'uc_results');
check('the page opens with the wall rating and openings, the 🔴 note and the group display', [tt.includes('الجدران الخارجية'), tt.includes('%'), tt.includes('🔴'), w.document.getElementById('uc_g0').style.display === '', w.document.getElementById('uc_g2').style.display === 'none'], [true, true, true, true, true]);
check('other reference codes open it too', others('uaecomp', 'uc_results'), [true, true, true]);
}
// ---------- part 136: UAE Fire and Life Safety Code chapter 2 (`uaeaccess`: Tables 2.3 - 2.8, hydrants, breeching inlets, fire lift) ----------
{
w = boot('ae'); doc = w.document;
const ua = o => w.eval('uaCalc(' + JSON.stringify(Object.assign({group: 0, height: 20, area: 3000, vol: 30000, perim: 200, spr: false, basement: 0, hz: 0, road: 200, acc: 0, roadDist: 0, width: 0, grade: 0, dead: 0, clear: 0, eng: 0, breech: 0, park: 0, gate: 0, turn: 0, hydB: 0, hydS: 0}, o)) + ')');
check('Table 2.4 (without sprinklers, largest floor area): up to 2000 m2 one sixth of the perimeter (at least 15 m), over 2000 to 4000 one quarter, over 4000 to 8000 one half, over 8000 to 16000 three quarters, over 16000 the whole perimeter', [1500, 2000, 2001, 4000, 6000, 8000, 10000, 16000, 20000].map(a => ua({area: a}).fracT), ['1/6 (لا يقل عن 15 m)', '1/6 (لا يقل عن 15 m)', '1/4', '1/4', '1/2', '1/2', '3/4', '3/4', 'كامل المحيط']);
check('Table 2.5 (with sprinklers the area is doubled): up to 4000 m2 one sixth, to 8000 one quarter, to 16000 one half, to 32000 three quarters, above the whole perimeter', [3000, 4000, 6000, 10000, 20000, 32000, 40000].map(a => ua({area: a, spr: true}).frac), [1 / 6, 1 / 6, 1 / 4, 1 / 2, 3 / 4, 3 / 4, 1]);
check('Tables 2.6 and 2.7 (industrial and storage by volume): without sprinklers 28400 m3 one sixth, over 28400 one quarter, over 56800 one half, over 85200 three quarters, over 113600 the whole; with sprinklers the limits double (56800, 113600, 170400, 227200)', [20000, 30000, 60000, 90000, 120000].map(v => ua({group: 2, vol: v}).frac).concat([50000, 60000, 120000, 180000, 230000].map(v => ua({group: 2, vol: v, spr: true}).frac)), [1 / 6, 1 / 4, 1 / 2, 3 / 4, 1, 1 / 6, 1 / 4, 1 / 2, 3 / 4, 1]);
check('length of the accessway = fraction x perimeter with a 15 m minimum: 200 m x 1/6 = 33 m; 60 m x 1/6 -> 15 m; one quarter of 200 m = 50 m; the whole perimeter 200 m', [Math.round(ua({area: 1500}).length), ua({area: 1500, perim: 60}).length, ua({area: 3000}).length, ua({area: 20000}).length, ua({area: 1500, acc: 34}).accOk, ua({area: 1500, acc: 30}).accOk], [33, 15, 50, 200, true, false]);
check('accessway required above 15 m of habitable height and for every industrial or storage building; below 15 m an access road of 4 m within 45 m (60 m for low-rise residential) of every point of the plan', [ua({height: 14}).access, ua({height: 15}).access, ua({height: 16}).access, ua({group: 2, height: 8}).access, ua({height: 14}).road, ua({group: 1, height: 14}).road, ua({height: 14, roadDist: 50}).roadDistOk, ua({group: 1, height: 14, roadDist: 50}).roadDistOk], [false, false, true, true, 45, 60, false, true]);
check('Tables 2.3 and 2.8: width 6 m, gradient 10 %, dead end 45 m, overhead clearance 4.5 m, vehicle 2 to 10 m from the facade, breeching inlet within 18 m, parking within 15 m of the entrance, gateway 4 m, turning radius 16 m; values just beyond fail', [ua({width: 6}).widthOk, ua({width: 5.9}).widthOk, ua({grade: 10}).gradeOk, ua({grade: 11}).gradeOk, ua({dead: 45}).deadOk, ua({dead: 50}).deadOk, ua({clear: 4.5}).clearOk, ua({clear: 4}).clearOk, ua({eng: 2}).engOk, ua({eng: 1.5}).engOk, ua({eng: 10}).engOk, ua({eng: 12}).engOk, ua({breech: 18}).breechOk, ua({breech: 20}).breechOk, ua({park: 15}).parkOk, ua({park: 16}).parkOk, ua({gate: 4}).gateOk, ua({gate: 3}).gateOk, ua({turn: 16}).turnOk, ua({turn: 12}).turnOk], [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]);
check('hydrants: spacing along the road residential and commercial 120 m (every part within 60 m), light and ordinary storage and industry 100 m (50 m), high hazard 60 m (30 m); a 200 m road needs 2, 4 and 4 hydrants; at least 2 always; 120 m to 130 m fails', [0, 1, 2, 3, 4, 5, 6].map(k => ua({hz: k}).hz.slice(1, 3).join('/')), ['120/60', '100/50', '100/50', '60/30', '100/50', '100/50', '60/30']);
check('hydrant counts and checks: 200 m of road -> 2 (residential), 2 (storage), 4 (high hazard); 500 m -> 5; 50 m -> 2 minimum; spacing 120 passes and 130 fails for residential; hydrant 6 to 30 m from the building', [ua({hz: 0, road: 200}).n, ua({hz: 1, road: 200}).n, ua({hz: 3, road: 200}).n, ua({hz: 0, road: 500}).n, ua({hz: 0, road: 50}).n, ua({hz: 0, hydS: 120}).spacingOk, ua({hz: 0, hydS: 130}).spacingOk, ua({hydB: 6}).hydDistOk, ua({hydB: 5}).hydDistOk, ua({hydB: 30}).hydDistOk, ua({hydB: 35}).hydDistOk], [2, 2, 4, 5, 2, true, false, true, false, true, false]);
check('hydrant supply: 1900 L/min per hydrant (950 per outlet), two hydrants 3800 L/min (1000 gpm), 6.9 bar at the most remote hydrant, two hours = 456 m3, pump 3800 L/min at 10.3 bar', [ua({}).flow, ua({}).demand, ua({}).pressure, ua({}).volume, ua({}).pump], [1900, 3800, 6.9, 456, [3800, 10.3]]);
check('fire lift: highrise above 23 m or more than 2 basements; none at 23 m or two basements', [ua({height: 24}).liftNeeded, ua({height: 23}).liftNeeded, ua({basement: 3}).liftNeeded, ua({basement: 2}).liftNeeded], [true, false, true, false]);
w.renderCalc('uaeaccess'); w.calcResult('uaeaccess');
let tt = txt(w, 'ua_results');
check('the page opens with the accessway required, the extent 1/4 for 3000 m2, 3800 L/min and the 🔴 note', [tt.includes('مطلوب'), tt.includes('1/4'), tt.includes('3800 L/min'), tt.includes('456 m³'), tt.includes('🔴')], [true, true, true, true, true]);
check('other reference codes open it too', others('uaeaccess', 'ua_results'), [true, true, true]);
}
// ---------- part 137: UAE Fire and Life Safety Code chapter 8 detection and alarm (`uaedetect`: Tables 8.1 - 8.6, 5.4 - 5.8, 6.5 - 6.6, 8, 3, 34 - 39) ----------
{
w = boot('ae'); doc = w.document;
const ud = o => w.eval('udCalc(' + JSON.stringify(Object.assign({mode: 0, L: 12, W: 8, H: 3, S: 9.1, ceil: 0, beamD: 0, beamS: 0, T: 30, mount: 0, rh: 50, v: 0, ach: 0, sep: 0, strat: 0, A: 1500, addr: true, spr: true, zone: 0, open: false, sd: 0, limited: 0, td: 0, mh: 0, me: 0, loc: 0, kind: 0, maxs: 0, db: 0, am: 0, room: 9.14, room2: 0, wall: true, lights: 1, ch: 3, cw: 0, cl: 0, lens: 0}, o)) + ')');
check('Table 8.1: low 39-57 C (maximum ceiling 28 C, no colour), ordinary 58-79 (47), intermediate 80-121 (69, white), high 122-162 (111, blue), extra high 163-204 (152, red), very extra high 205-259 (194, green), ultra high 260-302 (249, orange); the rating must be at least the ceiling temperature + 11 C', [w.eval('UD_T81.map(x => x[2]).join(" ")'), w.eval('UD_T81.map(x => x[3]).join("|")'), [28, 30, 60, 100, 150, 190, 240].map(t => ud({T: t}).cls[0]), ud({T: 300}).cls, ud({T: 30}).rating], ['28 47 69 111 152 194 249', 'بلا لون|بلا لون|أبيض|أزرق|أحمر|أخضر|برتقالي', ['منخفض', 'عادي', 'متوسط', 'عالٍ', 'عالٍ جدًا', 'فائق', 'فائق جدًا'], null, 41]);
check('Table 8.2 ceiling height factors: up to 3.05 m 1, 3.66 m 0.9, 4.27 0.84, 4.88 0.77, 5.49 0.71, 6.10 0.64, 6.71 0.58, 7.32 0.52, 7.93 0.46, 8.54 0.40, 9.14 0.34; above 9.14 m not covered', [3, 3.5, 4, 4.5, 5, 6, 6.5, 7, 7.5, 8, 9].map(h => ud({H: h}).fac).concat([ud({H: 9.5}).tall, ud({H: 9.14}).tall]), [1, 0.9, 0.84, 0.77, 0.71, 0.64, 0.58, 0.52, 0.46, 0.4, 0.34, true, false]);
check('heat detectors on a smooth ceiling, 12 x 8 m at 9.1 m: 2 detectors by either rule; 30 x 20 m: grid 4 x 3 = 12 by the spacing rule but 8 (4 x 2) when every point is within 0.7 S = 6.37 m; at 4 m height the spacing is 9.1 x 0.84 = 7.64 m', [ud({}).n, ud({L: 30, W: 20}).g.rule1, ud({L: 30, W: 20}).g.rule2, ud({L: 30, W: 20}).n, +ud({H: 4}).S.toFixed(2), ud({L: 30, W: 20, H: 4}).g.nx], [2, 12, 8, 8, 7.64, 4]);
check('beams and joists: beams over 100 mm deep reduce the perpendicular spacing to two thirds, solid joists to 50 %; beams deeper than 460 mm and more than 2.4 m apart make each bay a separate area; 100 mm beams count as a smooth ceiling', [+ud({ceil: 1, beamD: 150, beamS: 1500}).beam.toFixed(3), ud({ceil: 1, beamD: 100}).beam, ud({ceil: 2}).joist, ud({ceil: 1, beamD: 500, beamS: 3000}).bays, ud({ceil: 1, beamD: 500, beamS: 2000}).bays, +ud({ceil: 1, beamD: 150, beamS: 1500}).Sperp.toFixed(2), ud({ceil: 2, L: 12, W: 8}).g.ny], [0.667, 1, 0.5, true, false, 6.07, 2]);
check('spot smoke detectors: a room of 84 m2 or less needs one; 85 m2 needs the 9.1 m grid; unsuitable above 38 C, below 0 C, above 93 % humidity or 1.5 m/s', [ud({mode: 1, L: 12, W: 7}).n, ud({mode: 1, L: 12, W: 7}).single, ud({mode: 1, L: 12.1, W: 7}).single, ud({mode: 1, L: 20, W: 15}).g.nx, ud({mode: 1, T: 25}).ambOk, ud({mode: 1, T: 40}).ambOk, ud({mode: 1, T: -1}).ambOk, ud({mode: 1, rh: 94}).ambOk, ud({mode: 1, v: 1.6}).ambOk], [1, true, false, 3, true, false, false, false, false]);
check('Table 8.3: 60 air changes per hour 11.61 m2 per detector, 30 -> 23.23, 20 -> 34.84, 15 -> 46.45, 12 -> 58.06, 10 -> 69.68, 8.6 -> 81.29, 7.5 and below 83.61; the row of the next higher rate is used (25 -> 23.23); 96 m2 at 20 changes needs 3 detectors', [60, 30, 25, 20, 15, 12, 10, 8.6, 7.5, 5].map(a => ud({mode: 1, ach: a}).area).concat([ud({mode: 1, ach: 20}).nAir, ud({mode: 1, ach: 70}).achOver]), [11.61, 23.23, 23.23, 34.84, 46.45, 58.06, 69.68, 81.29, 83.61, 83.61, 3, true]);
check('smoke detectors with beams: deeper than 10 % of the ceiling height with the beam spacing at least 40 % of it -> a detector in every pocket; shallower beams count as a smooth ceiling (3 m: 300 mm and 1200 mm)', [ud({mode: 1, H: 3, beamD: 200, beamS: 1500}).beamClass, ud({mode: 1, H: 3, beamD: 400, beamS: 1500}).beamClass, ud({mode: 1, H: 3, beamD: 400, beamS: 1000}).beamClass, ud({mode: 1, H: 3, beamD: 0}).beamClass], ['سقف أملس', 'كاشف في كل جيب', 'تُراجع أبعاد الجيوب', null]);
check('optical beam detectors: at most 15 m between beams (30 m wide -> 2 rows, 15 -> 1, 15.1 -> 2); intermediate beams closer than the height / 4 (10 m -> 2.5 m)', [ud({mode: 2, W: 30}).rows, ud({mode: 2, W: 15}).rows, ud({mode: 2, W: 15.1}).rows, ud({mode: 2, H: 10}).strat, ud({mode: 2, sep: 15}).sepOk, ud({mode: 2, sep: 16}).sepOk, ud({mode: 2, H: 10, strat: 2}).stratOk, ud({mode: 2, H: 10, strat: 3}).stratOk], [2, 1, 2, 2.5, true, false, true, false]);
check('zones and call points: 2000 m2 per detection zone (10000 m2 for one open area), search distance 60 m or 100 m for addressable systems with sprinklers, a single zone for a building under 300 m2 and 15 m, call points within 45 m (25 m limited mobility, 16 m rapid fire), 1.1 - 1.4 m high, 1.5 m from the exit', [1500, 2001, 10000].map(a => ud({mode: 3, A: a}).zones).concat([ud({mode: 3, addr: true, spr: true}).search, ud({mode: 3, addr: true, spr: false}).search, ud({mode: 3, A: 299, H: 14}).single, ud({mode: 3, A: 300, H: 14}).single, ud({mode: 3, zone: 2500}).zoneOk, ud({mode: 3, zone: 9000, open: true}).zoneOk, ud({mode: 3, limited: 0}).mcp, ud({mode: 3, limited: 1}).mcp, ud({mode: 3, limited: 2}).mcp, ud({mode: 3, td: 46}).mcpOk, ud({mode: 3, mh: 1.5}).mcpHOk, ud({mode: 3, mh: 1.2}).mcpHOk, ud({mode: 3, me: 1.6}).exitOk]), [1, 2, 5, 100, 60, true, false, false, true, 45, 25, 16, false, false, true, false]);
check('Table 8.4 ambient sound: business 55, educational 45, industrial 80, institutional 50, mercantile 40, mechanical rooms 85, assembly 55, residential 35, storage 30, urban thoroughfares 70 / 55, rural 40, tower 35, underground 40, vehicles 50', [w.eval('UD_T84.map(x => x[1]).join(" ")')], ['55 45 80 50 40 85 40 55 35 30 70 55 40 35 40 50']);
check('audible levels: public mode 15 dB above ambient (business 70 dBA), private 10 dB (65), sleeping areas 15 dB but not below 75 dBA, 5 dB above a 60-second maximum level when greater (maximum 70 -> 75; industrial 80 -> 95), wall appliances at least 2290 mm high', [ud({mode: 4, loc: 0}).req, ud({mode: 4, loc: 0, kind: 1}).req, ud({mode: 4, loc: 8, kind: 2}).req, ud({mode: 4, loc: 0, maxs: 70}).req, ud({mode: 4, loc: 2}).req, ud({mode: 4, loc: 8}).req, ud({mode: 4, db: 70}).dbOk, ud({mode: 4, db: 69}).dbOk, ud({mode: 4, am: 2290}).mountOk, ud({mode: 4, am: 2000}).mountOk], [70, 65, 75, 75, 95, 50, true, false, true, false]);
const wl = (room, n) => ud({mode: 4, wall: true, room, lights: n}).cd;
check('Table 8.5 wall-mounted strobes (cd, one light / two on opposite walls / four): 6.10 m 15 / NA / NA; 9.14 m 34 / 15 / NA; 12.2 m 60 / 30 / 15; 15.2 m 94 / 60 / 30; 18.3 m 135 / 95 / 30; 21.3 m 184 / 95 / 60; 24.4 m 240 / 135 / 60; 30.5 m 375 / 240 / 95; 39.6 m 635 / 375 / 185; unlisted values are not tabulated', [[6.1, 9.14, 12.2, 15.2, 18.3, 21.3, 24.4, 30.5, 39.6].map(r => [wl(r, 1), wl(r, 2), wl(r, 4)].join('/')), wl(13.7, 2), wl(8.53, 2), wl(40, 1), wl(10, 1)], [['15/-1/-1', '34/15/-1', '60/30/15', '94/60/30', '135/95/30', '184/95/60', '240/135/60', '375/240/95', '635/375/185'], null, null, null, 60]);
const cl = (ch, room) => ud({mode: 4, wall: false, ch, room}).cd;
check('Table 8.6 ceiling-mounted strobes by ceiling height 3.0 / 6.1 / 9.1 m (cd): 6.1 m room 15 / 30 / 55; 9.1 m 30 / 45 / 75; 12.2 m 60 at 3 m; 15.2 m 95 at all heights; 21.3 m 185; a 13 m room takes the 13.4 m row (75); above 9.14 m no row; a room above 21.3 m is not tabulated', [[3, 6.1, 9.1].map(h => cl(h, 6.1)), [3, 6.1, 9.1].map(h => cl(h, 9.1)), cl(3, 12.2), [3, 6.1, 9.1].map(h => cl(h, 15.2)), cl(3, 21.3), cl(3, 13), cl(10, 9), cl(3, 22), cl(8, 9.1), cl(5, 14)], [[15, 30, 55], [30, 45, 75], 60, [95, 95, 95], 185, 75, null, null, 75, 80]);
check('visible appliance rules: corridors up to 6.1 m wide take 15 cd appliances within 4.57 m of the ends and 30.4 m apart (60 m -> 3, 8 m -> 1); lens 2030 - 2440 mm above the floor', [ud({mode: 4, cw: 3}).corr, ud({mode: 4, cw: 7}).corr, ud({mode: 4, cw: 3, cl: 60}).corrN, ud({mode: 4, cw: 3, cl: 8}).corrN, ud({mode: 4, lens: 2030}).lensOk, ud({mode: 4, lens: 2500}).lensOk, ud({mode: 4, lens: 2000}).lensOk], [true, false, 3, 1, true, false, false]);
for (let k = 0; k < 5; k++) { w.renderCalc('uaedetect'); w.document.getElementById('ud_m').value = String(k); w.calcResult('uaedetect'); }
w.renderCalc('uaedetect'); w.calcResult('uaedetect');
let tt = txt(w, 'ud_results');
check('the page opens with the heat detector spacing, the class and the 🔴 note', [tt.includes('كواشف الحرارة'), tt.includes('9.10 m'), tt.includes('عادي'), tt.includes('🔴'), w.document.getElementById('ud_g0').style.display === '', w.document.getElementById('ud_g4').style.display === 'none'], [true, true, true, true, true, true]);
check('other reference codes open it too', others('uaedetect', 'ud_results'), [true, true, true]);
}
// ---------- part 138: NFPA 92 smoke management (`smokemgmt`: 5.4 – 5.10 and the smoke control handbook chapter 16) ----------
{
w = boot('ae'); doc = w.document;
const sg = o => w.eval('sgCalc(' + JSON.stringify(Object.assign({mode: 0, t0: 33.3, d: 2.911, gam: 1, ia: 2, ib: 1.5, mu: 0.95, fv: 0, q: 2110, chi: 0.7, z: 10.82, width: 0}, o)) + ')');
const rg = (q, chi, W, zb, H) => w.eval('sgSpill(' + [q, chi, W, zb, H].join(',') + ')');
check('handbook example 16.10 (atrium fire, 2000 Btu/s at 35.5 ft, 92 F): plume 45.5 kg/s (100.3 lb/s), layer 65.8 C (150.2 F), exhaust 43.6 m3/s (92,600 cfm)', [sg({}).m, sg({}).ts, sg({}).V], [45.5, 65.8, 43.7], 0.3);
check('the limiting elevation 0.166 Qc^0.4 and the flame regime: inside the flame m = 0.032 Qc^0.6 z', [+sg({}).zl.toFixed(2), sg({}).flame, sg({z: 2}).flame, +sg({z: 2}).m.toFixed(1)], [3.08, false, true, 5.1]);
check('NFPA 92 5.5.1.2: a temperature rise under 2.2 C makes the plume equations invalid; a normal case is valid', [sg({q: 10, z: 50}).dTok, sg({}).dTok], [false, true]);
check('plugholing (example 16.13, 70 F ambient, layer 9.55 ft = 2.91 m deep): Vmax = 14.1 m3/s (29,800 cfm); four inlets of 10.9 m3/s for the 43.6 m3/s of example 16.10 with a separation of 0.9 sqrt(Ve) = 2.97 m', [+sg({t0: 21.1}).vmax.toFixed(1), sg({}).n, +sg({}).smin.toFixed(2), sg({t0: 21.1}).n, +sg({gam: 0.5}).vmax.toFixed(2)], [14.1, 4, 2.97, 3, 6.92]);
check('exhaust inlet d / Di must exceed 2: a 2 x 1.5 m inlet has Di = 1.71 m and d = 2.911 m -> 1.70 (fails); d = 3.5 m -> 2.05 passes', [+sg({}).di.toFixed(2), +sg({}).dratio.toFixed(2), sg({}).dOk, sg({d: 3.5}).dOk], [1.71, 1.7, false, true]);
check('makeup air at 95 % of the exhaust mass at ambient density (33.3 C, 1.152 kg/m3): 37.5 m3/s, 36.7 m2 free area at 1.02 m/s; 36.8 m2 passes, 30 m2 gives 1.25 m/s and fails', [+sg({}).vmu.toFixed(1), +sg({}).areaMu.toFixed(1), sg({fv: 36.8}).muOk, sg({fv: 30}).muOk, +sg({fv: 30}).uMu.toFixed(2)], [37.5, 36.7, true, false, 1.25]);
check('plume diameter 0.5 z against the atrium width: z 20 m gives 10 m, which touches a 10 m wide space (contact at z = 20 m) but not a 25 m one', [sg({z: 20, width: 10}).dp, sg({z: 20, width: 10}).contact, sg({z: 20, width: 10}).zc, sg({z: 20, width: 25}).contact], [10, true, 20, false]);
check('balcony spill plume (example 16.11 in SI): region 1 gives 103.2 kg/s from the printed 0.36 coefficient (the handbook I-P equation gives 111 kg/s); layer 40.5 C', [sg({mode: 1, q: 1055, w: 4, b: 1.83, H: 3.5, zb: 7.8, t0: 33.3}).region, +sg({mode: 1, q: 1055, w: 3.99, b: 1.83, H: 3.505, zb: 7.83, t0: 33.3}).m.toFixed(1), +sg({mode: 1, q: 1055, w: 3.99, b: 1.83, H: 3.505, zb: 7.83, t0: 33.3}).ts.toFixed(1)], [1, 103.2, 40.5]);
check('the three balcony regions: zb below 15 m -> 1; 15 m or more with W under 10 m -> 2; W 10 to 14 m -> 3; wider -> none; regions 1 and 2 agree at 15 m (171.0 and 171.6 kg/s) and 2 and 3 at W = 10 m within 1 %', [rg(1000, 0.7, 5, 14.99, 5).region, rg(1000, 0.7, 5, 15, 5).region, rg(1000, 0.7, 10, 15, 5).region, rg(1000, 0.7, 14, 15, 5).region, rg(1000, 0.7, 14.5, 15, 5).region, +rg(1000, 0.7, 5, 14.999, 5).m.toFixed(1), +rg(1000, 0.7, 5, 15, 5).m.toFixed(1), Math.abs(rg(1000, 0.7, 9.999, 15, 5).m / rg(1000, 0.7, 10, 15, 5).m - 1) < 0.01], [1, 2, 3, 3, 0, 171, 171.6, true]);
check('window plume: Aw 4 m2, Hw 2 m -> Q = 1260 Aw sqrt(Hw) = 7128 kW, a = 0.60 m, m = 30.4 kg/s at zw = 5 m', [Math.round(sg({mode: 2, aw: 4, hw: 2, zw: 5}).qwin), +sg({mode: 2, aw: 4, hw: 2, zw: 5}).a.toFixed(2), +sg({mode: 2, aw: 4, hw: 2, zw: 5}).m.toFixed(1), Math.round(sg({mode: 2, aw: 4, hw: 2, zw: 5, q: 3000}).qused)], [7128, 0.6, 30.4, 3000]);
check('steady-fire smoke descent: 500 kW, H = 10 m, A = 400 m2 (A / H2 = 4): smoke at 4 m after 137 s; after 120 s at 4.37 m; A / H2 outside 0.9 - 14 and z / H below 0.2 are flagged', [Math.round(sg({mode: 3, q: 500, A: 400, H: 10, z: 4}).t), +sg({mode: 3, q: 500, A: 400, H: 10, t: 120, z: 0}).z.toFixed(2), sg({mode: 3, q: 500, A: 400, H: 10, z: 4}).ratioOk, sg({mode: 3, q: 500, A: 50, H: 10, z: 4}).ratioOk, sg({mode: 3, q: 500, A: 400, H: 10, z: 1.5}).zhOk, sg({mode: 3, q: 500, A: 400, H: 10, t: 1, z: 0}).z > 10], [137, 4.37, true, false, false, true]);
check('opposed airflow (example K.1.5): hot smoke 537.8 C against an 1.83 m opening -> 2.16 m/s; the atrium fire case 33.1 C -> 0.54 m/s; 5275 kW at 28.96 m -> 0.32 m/s; the method is refused above 1.02 m/s and below 3 m', [+sg({mode: 4, c: 0, H: 1.83, tf: 537.8, t0: 21.1}).v.toFixed(2), +sg({mode: 4, c: 0, H: 1.83, tf: 33.1, t0: 21.1}).v.toFixed(2), +sg({mode: 4, c: 1, q: 5275, z: 28.96}).v.toFixed(2), sg({mode: 4, c: 1, q: 100000, z: 3}).vOk, sg({mode: 4, c: 1, q: 5275, z: 2.5}).zOk, +sg({mode: 4, c: 0, H: 1.83, tf: 537.8, t0: 21.1, ao: 2}).flow.toFixed(2)], [2.16, 0.54, 0.32, false, false, 4.33]);
for (let k = 0; k < 5; k++) { w.renderCalc('smokemgmt'); w.document.getElementById('sg_m').value = String(k); w.calcResult('smokemgmt'); }
w.renderCalc('smokemgmt'); w.calcResult('smokemgmt');
let tt = txt(w, 'sg_results');
check('the page opens with the atrium plume: mass flow, exhaust, plugholing inlets and the 🔴 note', [tt.includes('تدفق كتلة الدخان'), tt.includes('Plugholing'), tt.includes('هواء التعويض'), tt.includes('🔴'), w.document.getElementById('sg_g0').style.display === '', w.document.getElementById('sg_g4').style.display === 'none', w.document.getElementById('sg_gb').style.display === ''], [true, true, true, true, true, true, true]);
check('other reference codes open it too', others('smokemgmt', 'sg_results'), [true, true, true]);
}
// ---------- part 139: UAE Fire and Life Safety Code chapter 10 smoke control (`uaesmoke`: Tables 10.1 and 10.2, 23, 25, 26 - 29, 31 - 41) ----------
{
w = boot('ae'); doc = w.document;
const uk = o => w.eval('ukCalc(' + JSON.stringify(Object.assign({mode: 0, occ: 0, occ2: -1, h: 30, nb: 2, depth: 6, barea: 1500, spr: true, ns: 10, dw: 0.9, dh: 2.1, fdc: 44, dd: 0.076, w2: 1.8, h2: 2.1, dp: 0, L: 40, W: 1.8, H: 2.8, up: 0, straight: true, open: 0, dist: 0, sp: 0, A: 1500, plant: 0, serv: 0, vents: 0, ct: 0, ach: 12, shared: false, goods: false, combo: false, range: 40, nj: 0, head: 0, per: 75, share: 50, far: 30, lv: 1, hb: 0, fire: 0, qm: 2.5, hw: 12, z: 0, t0: 35, egress: 10, mech: true, rt: 0, res: 0, len: 0, nf: 2}, o)) + ')');
const A = 'CSC and SP', B = 'SP and CMV', C = 'SMV and CMV', C2 = 'CMV and SMV', D = 'CMV or CNV and SMV or SNV', E = 'SNV or SMV and CNV or CMV', F = 'SP and CSC';
check('Table 10.1 as printed: hotels CSC and SP / SP and CMV / CMV or CNV and SMV or SNV / SMV and CMV / SP and CSC; apartments, staff, labour, detention SMV and CMV at mid rise; health care SP and CMV; animal housing and commercial villas CMV or CNV at mid rise; private villas basements SNV or SMV and CNV or CMV then SMV and CMV; offices, schools, day care, mercantile CMV and SMV; assembly and malls CSC and SP at mid rise', w.eval('JSON.stringify(UK_T101)'),
  JSON.stringify([[A, B, D, C, F], [A, C, D, C, F], [A, C, D, C, F], [A, C, D, C, F], [A, B, D, C, F], [A, C, D, C, F], [A, D, D, C, F], [A, D, D, C, F], [A, D, D, E, C], [A, C2, D, C, F], [A, A, D, C, F], [A, A, D, C, F], [A, C2, D, C, F], [A, C2, D, C, F], [A, C2, D, C, F]]));
check('height classes: above 23 m high rise, 15 to 23 m mid rise (both ends), below 15 m low rise; the pressurization rule starts above 23 m', [uk({h: 23.1}).hcat, uk({h: 23}).hcat, uk({h: 15}).hcat, uk({h: 14.99}).hcat, uk({h: 23.1}).must, uk({h: 23}).must], [0, 1, 1, 2, true, false]);
check('basement classes: two shallow basements of 1500 m2 are low depth; three basements, 7.1 m depth or 2001 m2 are high depth; none -> no basement row', [uk({}).bcat, uk({nb: 3}).bcat, uk({depth: 7.1}).bcat, uk({barea: 2001}).bcat, uk({depth: 7}).bcat, uk({nb: 0}).bcat, uk({nb: 0}).reqB], [3, 4, 4, 4, 3, -1, '']);
check('hotels: 30 m -> CSC and SP with SMV and CMV in a 2-basement; 20 m -> SP and CMV; 10 m -> CMV or CNV and SMV or SNV; a deep basement -> SP and CSC', [uk({}).req, uk({}).reqB, uk({h: 20}).req, uk({h: 10}).req, uk({nb: 3}).reqB], [A, C, B, D, F]);
check('mixed occupancies take the most stringent: offices with assembly at 20 m -> CSC and SP; offices with a hotel -> SP and CMV; schools with a day care stay CMV and SMV; the basement of private villas with a hotel -> SMV and CMV', [uk({occ: 9, occ2: 10, h: 20}).req, uk({occ: 9, occ2: 0, h: 20}).req, uk({occ: 12, occ2: 13, h: 20}).req, uk({occ: 8, occ2: 0}).reqB], [A, B, C2, C]);
check('text of a strategy in Arabic: SP and CMV', w.eval('ukText("SP and CMV")'), 'ضغط الدرج و تهوية ميكانيكية للممر');
check('staircase pressure: minimum 12.5 Pa sprinklered and 25 Pa otherwise; door force limit 133 N gives 86.2 Pa for a 0.9 x 2.1 m door and a 44 N closer, capped at 60 Pa by the relief dampers; a 140 N closer leaves no window', [uk({mode: 1}).pmin, uk({mode: 1, spr: false}).pmin, +uk({mode: 1}).pmaxDoor.toFixed(1), uk({mode: 1}).pmax, uk({mode: 1}).window, uk({mode: 1, fdc: 140}).window, uk({mode: 1, fdc: 140}).pmaxDoor], [12.5, 25, 86.2, 60, true, false, 0]);
check('design pressure 50 Pa passes with a door force of 95.6 N; 70 Pa exceeds the 60 Pa cap though the door force is 116.3 N; 100 Pa gives 147 N and fails; 20 Pa fails when unsprinklered', [uk({mode: 1, dp: 50}).dpOk, +uk({mode: 1, dp: 50}).force.toFixed(1), uk({mode: 1, dp: 70}).dpOk, +uk({mode: 1, dp: 70}).force.toFixed(1), uk({mode: 1, dp: 70}).forceOk, uk({mode: 1, dp: 100}).forceOk, uk({mode: 1, dp: 20, spr: false}).dpOk], [true, 95.6, false, 116.3, true, false, false]);
check('open-door airflow 1.0 m/s through two stair doors of 1.89 m2 and the 3.78 m2 discharge door = 7.56 m3/s; multi-point injection above 3 storeys or 15 m with a point every 3 floors (10 floors -> 4); 3 floors 12 m -> one point; 3 floors 16 m -> multi; single injection banned above 8 storeys', [+uk({mode: 1}).qOpen.toFixed(2), uk({mode: 1}).multi, uk({mode: 1}).points, uk({mode: 1, ns: 3, h: 12}).multi, uk({mode: 1, ns: 3, h: 12}).points, uk({mode: 1, ns: 3, h: 16}).multi, uk({mode: 1, ns: 4, h: 12}).multi, uk({mode: 1, ns: 9}).singleBan, uk({mode: 1, ns: 8}).singleBan, uk({mode: 1, h: 23}).must], [7.56, true, 4, false, 1, true, true, true, false, false]);
check('internal corridor 40 x 1.8 x 2.8 m: openings 15 % of 72 m2 = 10.8 m2 within 9 m; purging 6 ACH = 0.336 m3/s; 3 passage units extract 1.5 m3/s, supply 0.9 m3/s at under 1.5 m/s = 0.6 m2, natural inlets 1.0 m2, fans with 20 % -> 1.8 / 1.08', [uk({mode: 2}).area, +uk({mode: 2}).openMin.toFixed(1), +uk({mode: 2}).purge.toFixed(3), uk({mode: 2}).up, uk({mode: 2}).qext, +uk({mode: 2}).qsup.toFixed(2), +uk({mode: 2}).aSup.toFixed(2), +uk({mode: 2}).aNat.toFixed(2), +uk({mode: 2}).fanExt.toFixed(2), +uk({mode: 2}).fanSup.toFixed(2)], [72, 10.8, 0.336, 3, 1.5, 0.9, 0.6, 1, 1.8, 1.08]);
check('corridor openings: 10.8 m2 passes and 10 m2 fails; 9 m passes and 9.5 m fails; extraction is limited to 8 m3/s (20 passage units -> 10 -> 8, capped); a 6 m wide corridor has 10 units = 5 m3/s', [uk({mode: 2, open: 10.8}).openOk, uk({mode: 2, open: 10}).openOk, uk({mode: 2, dist: 9}).distOk, uk({mode: 2, dist: 9.5}).distOk, uk({mode: 2, up: 20}).qext, uk({mode: 2, up: 20}).capped, uk({mode: 2, W: 6}).up, uk({mode: 2, W: 6}).qext], [true, false, true, false, 8, true, 10, 5]);
check('corridor spacing: 15 m between supply and extract on a straight route (40 m -> 3 spans, 4 openings) and 10 m otherwise (4 spans, 5 openings); extract outlet from 1.83 m or 2/3 of a tall corridor (3.6 m high -> 2.4 m)', [uk({mode: 2}).dmax, uk({mode: 2}).nInt, uk({mode: 2}).nOpen, uk({mode: 2, straight: false}).dmax, uk({mode: 2, straight: false}).nOpen, uk({mode: 2, sp: 16}).spOk, uk({mode: 2, sp: 15}).spOk, +uk({mode: 2}).extLow.toFixed(2), +uk({mode: 2, H: 3.6}).extLow.toFixed(2), uk({mode: 2, H: 1.8}).extFit], [15, 3, 4, 10, 5, false, true, 1.87, 2.4, false]);
check('basements up to 2000 m2: smoke vents of 2.5 % (1500 m2 -> 37.5 m2); above 2000 m2 an engineered system; plant rooms 250 m2 or less are exempt, 250 - 2000 m2 take 9 ACH (1000 m2 x 3.5 m -> 8.75 m3/s), larger ones are part of the engineered system', [uk({mode: 3}).small, uk({mode: 3}).ventMin, uk({mode: 3, vents: 37.5}).ventOk, uk({mode: 3, vents: 30}).ventOk, uk({mode: 3, A: 2001}).small, uk({mode: 3, plant: 200}).plantClass, uk({mode: 3, h: 3.5, plant: 1000}).plantClass, +uk({mode: 3, h: 3.5, plant: 1000}).purgeP.toFixed(2), uk({mode: 3, plant: 2500}).plantClass, +uk({mode: 3, h: 3.5, serv: 500}).purgeS.toFixed(3)], [true, 37.5, true, false, false, 0, 1, 8.75, 2, 4.375]);
check('enclosed car park: purging above 2000 m2 at 9 ACH (3000 m2 x 2.8 m -> 21 m3/s), natural openings of 2.5 % (75 m2) replace the supply', [uk({mode: 4, h: 2.8, ct: 0, A: 3000}).req, uk({mode: 4, h: 2.8, ct: 0, A: 2000}).req, +uk({mode: 4, h: 2.8, ct: 0, A: 3000}).purge.toFixed(1), uk({mode: 4, h: 2.8, ct: 0, A: 3000}).nat, uk({mode: 4, h: 2.8, ct: 0, A: 3000, open: 75}).natOk, uk({mode: 4, h: 2.8, ct: 0, A: 3000, open: 70}).natOk], [true, false, 21, 75, true, false]);
check('jet-fan car park of 3000 m2: two zones of 1500 m2, 12 ACH = 14 m3/s per zone in two parts of 50 % (7 m3/s), 100 % each when fans are shared; supply openings the larger of 2.5 % (37.5 m2) and flow / 2 m/s; jet fan spacing 2/3 of a 40 m range = 26.7 m', [uk({mode: 4, h: 2.8, ct: 1, A: 3000}).n, uk({mode: 4, h: 2.8, ct: 1, A: 2000}).n, uk({mode: 4, h: 2.8, ct: 1, A: 2001}).n, +uk({mode: 4, h: 2.8, ct: 1, A: 3000}).q.toFixed(1), uk({mode: 4, h: 2.8, ct: 1, A: 3000}).partQ, uk({mode: 4, h: 2.8, ct: 1, A: 3000, shared: true}).partQ, uk({mode: 4, h: 2.8, ct: 1, A: 3000}).supArea, +uk({mode: 4, h: 2.8, ct: 1, A: 3000}).spacing.toFixed(1)], [2, 1, 2, 14, 7, 14, 37.5, 26.7]);
check('jet fans: CFD needed below 12 ACH, for goods vehicles or coaches (10 MW instead of 4 MW), for mixed natural and mechanical replacement and when spacing exceeds 2/3 of the range; seven fans -> 3 groups of at most three; headroom 3 m', [uk({mode: 4, h: 2.8, ct: 1}).cfd, uk({mode: 4, h: 2.8, ct: 1, ach: 10}).cfd, uk({mode: 4, h: 2.8, ct: 1, goods: true}).cfd, uk({mode: 4, h: 2.8, ct: 1, goods: true}).fire, uk({mode: 4, h: 2.8, ct: 1}).fire, uk({mode: 4, h: 2.8, ct: 1, combo: true}).cfd, uk({mode: 4, h: 2.8, ct: 1, sp: 30}).cfd, uk({mode: 4, h: 2.8, ct: 1, sp: 26}).cfd, uk({mode: 4, h: 2.8, ct: 1, nj: 7}).groups, uk({mode: 4, h: 2.8, ct: 1, head: 2.9}).headOk, uk({mode: 4, h: 2.8, ct: 1, head: 3}).headOk], [false, true, true, 10, 4, true, true, false, 3, false, true]);
check('open car park: 3/4 of the perimeter with openings, 50 % open, within 30 m, up to 2230 m2 and 3 levels; each failure breaks it; a building above 23 m takes sprinklers anyway', [uk({mode: 4, h: 2.8, ct: 2}).open, uk({mode: 4, h: 2.8, ct: 2, per: 70}).open, uk({mode: 4, h: 2.8, ct: 2, share: 49}).open, uk({mode: 4, h: 2.8, ct: 2, far: 31}).open, uk({mode: 4, h: 2.8, ct: 2, A: 2231}).open, uk({mode: 4, h: 2.8, ct: 2, A: 2230, lv: 3}).open, uk({mode: 4, h: 2.8, ct: 2, lv: 4}).open, uk({mode: 4, h: 2.8, ct: 2, hb: 24}).excl], [true, false, false, false, false, true, false, true]);
check('Table 10.2 and 27.12 fires: shops 5 MW 12 m, offices 1 MW 14 m, hotel room 0.5 MW 6 m, hotel public 2.5 MW 12 m, assembly 2.5 MW 12 m; office atrium 2.1 MW and mercantile 5.275 MW', [w.eval('UK_FIRE.map(x => x[1] + "/" + x[2]).join(" ")')], ['5/12 1/14 0.5/6 2.5/12 2.5/12 2.1/0 5.275/0 0/0']);
check('shop fire 5 MW with the highest walking level 12 m above the fire: interface at 13.83 m, plume 92.2 kg/s, layer rise 38 C to 73 C, exhaust 90.4 m3/s; makeup 85 - 95 % = 68.4 - 76.4 m3/s needing 75 m2 at 1.02 m/s or 15.3 m2 at 5 m/s', [uk({mode: 5}).zmin, +uk({mode: 5}).m.toFixed(1), +uk({mode: 5}).dT.toFixed(1), +uk({mode: 5}).ts.toFixed(1), +uk({mode: 5}).V.toFixed(1), +uk({mode: 5}).mu1.toFixed(1), +uk({mode: 5}).mu2.toFixed(1), +uk({mode: 5}).aMu.toFixed(1), +uk({mode: 5}).aMu5.toFixed(1), uk({mode: 5}).mOk, uk({mode: 5}).dTok], [13.83, 92.2, 38, 73, 90.4, 68.4, 76.4, 75, 15.3, true, true]);
check('limits of 29.14: a 30 m high walking level gives 351 kg/s (over 175, so the interface may be at most 20.7 m high); an office fire of 1 MW reaches only 13.6 C of rise (under 18 C) and the allowed plume is 38.9 kg/s', [+uk({mode: 5, hw: 30}).m.toFixed(0), uk({mode: 5, hw: 30}).mOk, +uk({mode: 5, hw: 30}).zMax.toFixed(1), uk({mode: 5, fire: 1}).dTok, +uk({mode: 5, fire: 1}).dT.toFixed(1), +uk({mode: 5, fire: 1}).mAllow.toFixed(1), uk({mode: 5, fire: 1}).mOk, uk({mode: 5, z: 10}).zOk, uk({mode: 5, z: 13.83}).zOk], [351, false, 20.7, false, 13.6, 38.9, true, false, true]);
check('design duration 20 min or 1.5 x egress (10 min -> 20, 20 min -> 30); smoke reservoirs 2000 / 2600 m2 from the room of origin and 1000 / 1300 m2 from a corridor or atrium (natural / mechanical), length 60 m; one fan failing leaves the full rate (3 fans -> each V/2, installed 1.5 V)', [uk({mode: 5}).dur, uk({mode: 5, egress: 20}).dur, uk({mode: 5, mech: false}).lim, uk({mode: 5}).lim, uk({mode: 5, rt: 1, mech: false}).lim, uk({mode: 5, rt: 1}).lim, uk({mode: 5, res: 2601}).resOk, uk({mode: 5, res: 2600}).resOk, uk({mode: 5, len: 61}).lenOk, +uk({mode: 5, nf: 3}).each.toFixed(1), +uk({mode: 5, nf: 3}).total.toFixed(1), uk({mode: 5, nf: 1}).each], [20, 30, 2000, 2600, 1000, 1300, false, true, false, 45.2, 135.6, 0]);
for (let k = 0; k < 6; k++) { w.renderCalc('uaesmoke'); w.document.getElementById('uk_m').value = String(k); w.calcResult('uaesmoke'); }
for (let c = 0; c < 3; c++) { w.document.getElementById('uk_m').value = '4'; w.document.getElementById('uk_ct').value = String(c); w.calcResult('uaesmoke'); }
w.renderCalc('uaesmoke'); w.calcResult('uaesmoke');
let tt = txt(w, 'uk_results');
check('the page opens with the Table 10.1 strategy, the Arabic expansion and the 🔴 note', [tt.includes('الجدول 10.1'), tt.includes('CSC and SP'), tt.includes('ضغط الدرج'), tt.includes('🔴'), w.document.getElementById('uk_g0').style.display === '', w.document.getElementById('uk_g5').style.display === 'none'], [true, true, true, true, true, true]);
w.document.getElementById('uk_m').value = '5'; w.calcResult('uaesmoke'); tt = txt(w, 'uk_results');
check('the atrium page shows the plume, the 175 kg/s limit and the makeup air', [tt.includes('كتلة الدخان'), tt.includes('175'), tt.includes('هواء التعويض'), tt.includes('NFPA 92')], [true, true, true, true]);
w.document.getElementById('uk_m').value = '4'; w.document.getElementById('uk_ct').value = '1'; w.calcResult('uaesmoke');
check('the jet-fan sub-form shows only its own fields', [w.document.getElementById('uk_c1').style.display === '', w.document.getElementById('uk_c0').style.display === 'none', w.document.getElementById('uk_c2').style.display === 'none'], [true, true, true]);
check('other reference codes open it too', others('uaesmoke', 'uk_results'), [true, true, true]);
}
// ---------- part 140: NFPA 20 fire pump (`nfpa20`: Tables 4.10.2, 4.28(a), 9.5.1.1, rules 4.7, 4.10, 4.16, 4.20, 4.22, 6.2, 9.5, 11.2) ----------
{
w = boot('ae'); doc = w.document;
const n20 = o => w.eval('n20Calc(' + JSON.stringify(Object.assign({basis: 0, qd: 500, pn: 116, pr: 0, churn: 120, ssMax: 29, rating: 175, s150: 10, eff: 0.7, alt: 0, temp: 25}, o)) + ')');
check('Table 4.10.2 rated capacities in gpm: 25 50 100 150 200 250 300 400 450 500 750 1000 1250 1500 2000 2500 3000 3500 4000 4500 5000', w.eval('N20_T.map(t => t[0]).join(" ")'), '25 50 100 150 200 250 300 400 450 500 750 1000 1250 1500 2000 2500 3000 3500 4000 4500 5000');
check('Table 4.28(a) as printed: 25 gpm 1 / 1 / 3/4 / 1 / 1 1/4; 300 gpm 4 / 4 / 2 1/2 / 3 1/2 / 3 1/2; 750 gpm 6 / 6 / 4 / 6 / 5; 1500 gpm 8 / 8 / 6 / 8 / 8 with 6 hose valves; 2000 gpm 10 / 10 / 6 / 10 / 8 with two 5 in outlets; 5000 gpm 16 / 14 / 8 / 14 / 10 with 20 valves and header 12', [25, 300, 750, 1500, 2000, 5000].map(q => w.eval('JSON.stringify(N20_T.find(t => t[0] === ' + q + '))')),
  ['[25,1,1,0.75,1,1.25,[1,1.5],[1,2.5],1]', '[300,4,4,2.5,3.5,3.5,[1,2.5],[1,2.5],3]', '[750,6,6,4,6,5,[3,2.5],[1,5],6]', '[1500,8,8,6,8,8,[6,2.5],[1,5],8]', '[2000,10,10,6,10,8,[6,2.5],[2,5],8]', '[5000,16,14,8,14,10,[20,2.5],[3,5],12]']);
check('a 500 gpm demand at 116 psi net: rated 500 gpm, 120 psi (next 5 psi), churn at 120 % = 144 psi, limit 168 psi, 150 % = 750 gpm at 78 psi', [n20({}).qr, n20({}).pmin, n20({}).pr, n20({}).churn, n20({}).churnMax, n20({}).q150, n20({}).p150], [500, 116, 120, 144, 168, 750, 78]);
check('the highest discharge pressure 144 + 29 psi static = 173 psi stays within a 175 psi rating, 150 psi does not; a diesel needs a relief valve when 121 % churn + static exceeds the rating (203 psi)', [n20({}).pdMax, n20({}).pdOk, n20({rating: 150}).pdOk, n20({}).prv, n20({rating: 250}).prv, n20({churn: 141}).churnOk], [173, true, false, true, false, false]);
check('selecting with the 150 % rule: 500 gpm -> 400 gpm pump at 125 % of its rating, pressure factor 0.825 -> 140.6 psi minimum -> 145 psi; 1500 gpm -> 1000 gpm at 150 % with factor 0.65', [n20({basis: 1}).qr, n20({basis: 1}).f, +n20({basis: 1}).fac.toFixed(3), +n20({basis: 1}).pmin.toFixed(1), n20({basis: 1}).pr, n20({basis: 1, qd: 1500}).qr, n20({basis: 1, qd: 1500}).fac], [400, 1.25, 0.825, 140.6, 145, 1000, 0.65]);
check('the 40 psi minimum rated pressure, a given rated pressure is used as is, and an unsuitable one fails (needs 116 psi at 100 %)', [n20({pn: 20}).pr, n20({pr: 130}).pr, n20({pr: 130}).prOk, n20({pr: 100}).prOk, n20({pr: 30, pn: 20}).p40], [40, 130, true, false, false]);
check('above 5000 gpm the pump is reviewed individually; 4.10.1: demand over 150 % of the rated capacity gives no characteristic', [n20({qd: 6000}).over, n20({qd: 6000}).qr, n20({qd: 5000}).over, n20({qd: 8000, basis: 1}).fac, n20({qd: 8000, basis: 1}).over, n20({qd: 7000, basis: 1}).over], [true, 5000, false, 0, true, false]);
check('velocities at 150 % of the rated flow: 500 gpm pump with 5 in pipes 12.0 ft/s; 1000 gpm pump 8 in suction (Sch 30 ID 8.071) 9.4 ft/s and 6 in discharge 16.7 ft/s; 5000 gpm pump 16 in suction 13.2 and 14 in discharge 17.5 ft/s; the limits are 15 and 20 ft/s', [+n20({}).vs.toFixed(1), +n20({}).vd.toFixed(1), +n20({qd: 1000}).vs.toFixed(1), +n20({qd: 1000}).vd.toFixed(1), +n20({qd: 5000}).vs.toFixed(1), +n20({qd: 5000}).vd.toFixed(1), n20({qd: 5000}).vsOk, n20({qd: 5000}).vdOk], [12, 12, 9.4, 16.7, 13.2, 17.5, true, true]);
check('suction pressure at 150 % must not be below 0: 0 passes and -0.1 fails', [n20({s150: 0}).suctOk, n20({s150: -0.1}).suctOk], [true, false]);
check('brake power at 50.0 hp for 500 gpm x 120 psi at 70 %: 150 % point gives 48.8 hp; motor 43.5 hp minimum -> 50 hp; flow meter 875 gpm', [+n20({}).b100.toFixed(1), +n20({}).b150.toFixed(1), +n20({}).bmax.toFixed(1), +n20({}).motorMin.toFixed(1), n20({}).motor, n20({}).meter], [50, 48.8, 50, 43.5, 50, 875]);
check('motor sizes: 5000 gpm x 120 psi needs 435 hp -> 450 hp; at 200 psi over 500 hp -> none; a 25 gpm pump picks 1 hp', [n20({qd: 5000, pn: 120}).motor, n20({qd: 5000, pn: 200}).motor, n20({qd: 25, pn: 40}).motor], [450, 0, 1]);
check('diesel engine derating: 3 % per 300 m above 91 m and 1 % per 5.6 C above 25 C (1000 m -> 0.909; 40 C -> 0.973)', [+n20({alt: 1000}).fAlt.toFixed(3), +n20({temp: 40}).fT.toFixed(4), +n20({alt: 1000}).dieselMin.toFixed(1), +n20({alt: 50, temp: 20}).dieselMin.toFixed(1), +n20({temp: 40}).dieselMin.toFixed(1)], [0.909, 0.9732, 55, 50, 51.4]);
for (const u of ['0', '1']) { w.renderCalc('nfpa20'); w.document.getElementById('n20_u').value = u; w.calcResult('nfpa20'); }
w.renderCalc('nfpa20'); w.calcResult('nfpa20');
let tt = txt(w, 'n20_results');
check('the page opens with the rated capacity, the pipe sizes, the motor and the 🔴 note; the units switch the labels', [tt.includes('السعة المقنَّنة'), tt.includes('أنابيب السحب والتفريغ'), tt.includes('المحرك الكهربائي'), tt.includes('🔴'), w.document.querySelector('#n20_form [data-u="f"]').textContent, w.document.querySelector('#n20_form [data-u="p"]').textContent], [true, true, true, true, 'L/min', 'bar']);
w.document.getElementById('n20_u').value = '1'; w.calcResult('nfpa20');
check('in US units the labels read gpm and psi and the same result (500 gpm, 125 psi demand) is produced', [w.document.querySelector('#n20_form [data-u="f"]').textContent, w.document.querySelector('#n20_form [data-u="p"]').textContent], ['gpm', 'psi']);
check('other reference codes open it too', others('nfpa20', 'n20_results'), [true, true, true]);
}
// ---------- part 141: NFPA 14 standpipe and hose systems (`nfpa14`: 5.4, 7.2 - 7.12, 8.3, 9.2) ----------
{
w = boot('ae'); doc = w.document;
const n14 = o => w.eval('n14Calc(' + JSON.stringify(Object.assign({cls: 0, spr: true, part: false, h: 60, n: 2, area: 2000, horiz: false, haz: 0, sprQ: 0, hose: 0, perim: 150, stat: 0, res15: 0, size: 6, c: 120, eq: 30, valve: 0, dist: 0, garage: false}, o)) + ')');
check('high-rise means an occupiable floor more than 23 m above the lowest fire department access (23 m is not, 23.1 m is)', [n14({h: 23}).high, n14({h: 23.1}).high], [false, true]);
check('Class I and III flow: 500 gpm for one standpipe, 250 gpm for each additional (two -> 750, three -> 1000), at most 1000 gpm sprinklered throughout (four are capped) and 1250 gpm otherwise', [n14({n: 1}).flow, n14({n: 2}).flow, n14({n: 3}).flow, n14({n: 4}).flow, n14({n: 4}).capped, n14({spr: false, n: 4}).flow, n14({spr: false, n: 4}).capped, n14({spr: false, n: 5}).flow, n14({spr: false, n: 5}).capped], [500, 750, 1000, 1000, true, 1250, false, 1250, true]);
check('a floor over 7432 m2 in an unsprinklered building: 500 gpm for the second standpipe and 250 for the third (two -> 1000, three -> 1250); a horizontal standpipe with three or more connections starts at 750 gpm (one -> 750, two -> 1000, three -> capped at 1000)', [n14({spr: false, area: 8000, n: 2}).flow, n14({spr: false, area: 8000, n: 3}).flow, n14({spr: false, area: 7432, n: 2}).flow, n14({horiz: true, n: 1}).flow, n14({horiz: true, n: 2}).flow, n14({horiz: true, n: 3}).flow, n14({horiz: true, n: 3}).capped], [1000, 1250, 750, 750, 1000, 1000, true]);
check('Class II needs 100 gpm at the most remote connection regardless of the number of standpipes; a combined partly sprinklered system adds the sprinkler demand or 150 gpm (light) / 500 gpm (ordinary) whichever is less (one standpipe: 650, 1000, 600 with a 100 gpm demand)', [n14({cls: 1, n: 3}).flow, n14({part: true, spr: false, n: 1}).flow, n14({part: true, spr: false, n: 1, haz: 1}).flow, n14({part: true, spr: false, n: 1, sprQ: 100}).flow], [100, 650, 1000, 600]);
check('a combined system in a sprinklered building takes the greater of the standpipe flow and the sprinkler demand plus hose (750 vs 500 + 400 = 900); Class I only ignores it', [n14({sprQ: 500, hose: 400}).combined, n14({sprQ: 200, hose: 100}).combined, n14({cls: 1, sprQ: 500}).combined], [900, 750, 0]);
check('fire department connections: one 65 mm inlet per 250 gpm (750 -> 3, 1000 -> 4, 100 -> 1), two connections for a high-rise or a perimeter over 274 m, water for 30 minutes (750 gpm = 85.2 m3)', [n14({}).inlets, n14({n: 3}).inlets, n14({cls: 1}).inlets, n14({}).fdcs, n14({h: 20}).fdcs, n14({h: 20, perim: 300}).fdcs, +n14({}).vol.toFixed(1)], [3, 4, 1, 2, 1, 2, 85.2]);
check('riser of 6 in (ID 6.065) with 500 gpm over 60 m + 30 m: friction 0.00976 psi/ft x 295.3 ft = 2.88 psi, elevation 0.4335 x 196.85 ft = 85.3 psi, 2 1/2 in angle valve 31 ft at 250 gpm = 6.68 psi; base pressure 100 + 2.88 + 85.33 + 6.68 = 194.9 psi; velocity 5.55 ft/s', [+n14({}).pf.toFixed(5), +n14({}).fric.toFixed(2), +n14({}).elev.toFixed(1), +n14({}).valve.toFixed(2), +n14({}).need.toFixed(1), +n14({}).vel.toFixed(2)], [0.00976, 2.88, 85.3, 6.68, 194.9, 5.55]);
check('Class II uses 65 psi at the 1 1/2 in valve and 100 gpm: 65 + 0.15 + 85.3 + valve = 151.7 psi; the globe valve (70 ft) loses more than the angle valve and none can be neglected', [+n14({cls: 1}).need.toFixed(1), n14({valve: 1}).valve > n14({valve: 0}).valve, n14({valve: 2}).valve], [151.7, true, 0]);
check('pressure limits: static over 175 psi or residual over 100 psi at a 1 1/2 in connection needs a pressure-regulating device', [n14({stat: 175}).prvNeed, n14({stat: 176}).prvNeed, n14({res15: 100}).prv15, n14({res15: 101}).prv15], [false, true, false, true]);
check('standpipes are at least 4 in (6 in in a combined system of a partly sprinklered building); drains 3/4 in up to 2 in, 1 1/4 in for 2 1/2 - 3 1/2 in, 2 in from 4 in', [n14({size: 4}).sizeOk, n14({size: 4, part: true}).sizeOk, n14({size: 6, part: true}).sizeOk, n14({size: 4}).drain, n14({size: 3}).drain, n14({size: 2}).drain], [true, false, true, '2 in', '1¼ in', '¾ in']);
check('hose connection distances: Class I extra connections beyond 61 m (200 ft) sprinklered, 45.7 m (150 ft) otherwise, 39.7 m (130 ft) in an open garage; Class II within 39.7 m', [n14({}).dAdd, n14({spr: false}).dAdd, n14({garage: true}).dAdd, n14({cls: 1}).dII, n14({dist: 61}).distOk, n14({dist: 62}).distOk, n14({spr: false, dist: 46}).distOk, n14({cls: 1, dist: 40}).distOk], [61, 45.7, 39.7, 39.7, true, false, false, false]);
for (const k of ['0', '1', '2']) { w.renderCalc('nfpa14'); w.document.getElementById('n14_c').value = k; w.calcResult('nfpa14'); }
w.renderCalc('nfpa14'); w.calcResult('nfpa14');
let tt = txt(w, 'n14_results');
check('the page opens with the flow, the pressures, the FDC inlets and the 🔴 note', [tt.includes('تدفق التصميم'), tt.includes('الضغط المتبقي الأدنى'), tt.includes('وصلات الإطفاء'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('nfpa14', 'n14_results'), [true, true, true]);
}
// ---------- part 142: NFPA 22 water tanks (`nfpa22`: 4.1, 4.2.1.4, 14.2.13, 14.5, 14.6) ----------
{
w = boot('ae'); doc = w.document;
const n22 = o => w.eval('n22Calc(' + JSON.stringify(Object.assign({type: 0, q: 1893, dur: 60, qp: 0, cap: 0, shape: 0, a: 6, b: 5, d: 150, fill: 0, fillSize: 0, ovf: 0}, o)) + ')');
check('net capacity 1893 L/min for 60 min = 113.58 m3; a 6 x 5 m tank (30 m2) holds 3.786 m of net water; with the 152 mm plate level and 50 mm to the top the tank is 3.99 m', [+n22({}).vol.toFixed(2), n22({}).area, +n22({}).hNet.toFixed(3), +n22({}).hTotal.toFixed(2), n22({}).capOk], [113.58, 30, 3.786, 3.99, true]);
check('a gravity tank has no vortex plate (3.79 + 0.05 = 3.84 m); a cylinder of 6 m diameter has 28.27 m2', [+n22({type: 1}).hTotal.toFixed(2), n22({type: 1}).suction, +n22({shape: 1}).area.toFixed(2)], [3.84, false, 28.27]);
check('anti-vortex plate: twice the outlet diameter (150 mm -> 300 mm) at half the diameter above the bottom but at least 152 mm (150 mm -> 152 mm; 400 mm -> 200 mm, plate 800 mm)', [n22({}).plate, +n22({}).plateH.toFixed(3), n22({d: 400}).plate, +n22({d: 400}).plateH.toFixed(3), n22({d: 250}).plateH], [300, 0.152, 800, 0.2, 0.152]);
check('the tank must be filled within 8 hours: 113.58 m3 -> 236.6 L/min; 236 fails and 237 passes; a smaller chosen capacity fails the demand', [+n22({}).fillMin.toFixed(1), n22({fill: 236}).fillOk, n22({fill: 237}).fillOk, n22({cap: 100}).capOk, n22({cap: 120}).capOk], [236.6, false, true, false, true]);
check('break tank for a 1000 gpm pump (3785 L/min): 15 min x 150 % = 85.2 m3; 56.8 m3 (30 min of 1893 L/min) is too small', [+n22({qp: 3785}).break15.toFixed(1), n22({qp: 3785, cap: 85.2}).breakOk, n22({qp: 3785, cap: 56.79}).breakOk, n22({qp: 3785, cap: 90}).breakOk], [85.2, true, false, true]);
check('refill of a break tank under 30 min of demand (56.8 m3): two lines of 150 % of the pump (5677.5 L/min) or 110 % of the demand (2082 L/min); with 60 m3 for a 60 min demand: 110 % x (113.6 - 60) / 60 = 982 L/min; with the full capacity none', [n22({cap: 40}).small, n22({cap: 60}).small, n22({qp: 3785}).refill150, +n22({}).refill110.toFixed(1), +n22({cap: 60}).refill.toFixed(0), n22({}).refill, n22({cap: 100}).refill > 0], [true, false, 5677.5, 2082.3, 982, 0, true]);
check('overflow pipe at least 75 mm and one size above the fill line (100 mm fill -> 125 mm); 70 mm fails', [n22({fillSize: 100}).ovfNext, n22({fillSize: 100, ovf: 100}).ovfOk, n22({fillSize: 100, ovf: 125}).ovfOk, n22({ovf: 70}).ovfOk, n22({ovf: 80}).ovfOk, n22({fillSize: 300}).ovfNext], [125, false, true, false, true, 0]);
for (const k of ['0', '1', '2']) { w.renderCalc('nfpa22'); w.document.getElementById('n22_t').value = k; w.document.getElementById('n22_sh').value = k === '1' ? '1' : '0'; w.calcResult('nfpa22'); }
w.renderCalc('nfpa22'); w.calcResult('nfpa22');
let tt = txt(w, 'n22_results');
check('the page opens with the capacity, the plate, the filling rate and the 🔴 note; the width field hides for a cylinder', [tt.includes('السعة الصافية'), tt.includes('لوح منع الدوامة'), tt.includes('معدل ملء'), tt.includes('🔴'), w.document.getElementById('n22_bw').style.display], [true, true, true, true, '']);
w.document.getElementById('n22_sh').value = '1'; w.calcResult('nfpa22');
check('the cylinder hides the width', w.document.getElementById('n22_bw').style.display, 'none');
check('other reference codes open it too', others('nfpa22', 'n22_results'), [true, true, true]);
}
// ---------- part 143: NFPA 10 portable extinguishers (`nfpa10`: Tables 6.2.1.1 and 6.3.1.1, 6.3.2, 6.1.3.9, 6.5, 6.6) ----------
{
w = boot('ae'); doc = w.document;
const n10 = o => w.eval('n10Calc(' + JSON.stringify(Object.assign({mode: 0, haz: 1, area: 1200, rating: 4, travel: 0}, o)) + ')');
check('Table 6.2.1.1: light 2-A, 279 m2 per unit of A; ordinary 2-A, 139 m2; extra 4-A, 92.9 m2; 1045 m2 per extinguisher and 22.9 m of travel for all', [w.eval('N10_A.map(t => t.slice(1).join("/")).join(" ")')], ['2/279/1045/22.9 2/139/1045/22.9 4/92.9/1045/22.9']);
check('ordinary hazard 1200 m2 with 4-A extinguishers: 8.63 units of A -> 3 by rating, 2 by area (1045 m2 each) -> 3; with 2-A extinguishers 5; the minimum size alone needs 5', [+n10({}).units.toFixed(2), n10({}).nRating, n10({}).nArea, n10({}).n, n10({rating: 2}).n, n10({}).minSize], [8.63, 3, 2, 3, 5, 5]);
check('a large floor is governed by the 1045 m2 rule: 5000 m2 ordinary with 10-A -> 4 by rating and 5 by area -> 5 and up to 2 may be replaced by hose stations; a small floor still needs one', [n10({area: 5000, rating: 10}).nRating, n10({area: 5000, rating: 10}).nArea, n10({area: 5000, rating: 10}).n, n10({area: 5000, rating: 10}).hose, n10({area: 50}).n, n10({area: 50}).nArea], [4, 5, 5, 2, 1, 1]);
check('light 1200 m2 -> 4.30 units; extra 12.92 units and an extinguisher below 4-A does not count (2-A fails)', [+n10({haz: 0}).units.toFixed(2), +n10({haz: 2}).units.toFixed(2), n10({haz: 2, rating: 2}).ratingOk, n10({haz: 2, rating: 4}).ratingOk, n10({haz: 1, rating: 1}).ratingOk, n10({haz: 1, rating: 1}).pair2A], [4.3, 12.92, false, true, false, true]);
check('travel distance 22.9 m for Class A (23 m fails)', [n10({travel: 22.9}).travelOk, n10({travel: 23}).travelOk], [true, false]);
check('Table 6.3.1.1: light 5-B at 9.14 m and 10-B at 15.25 m; ordinary 10-B / 20-B; extra 40-B / 80-B', [w.eval('N10_B.map(t => t.slice(1).join("/")).join(" ")')], ['5/10 10/20 40/80']);
check('Class B spill, ordinary hazard: 20-B reaches 15.25 m, 10-B only 9.14 m and 5-B none; a 12 m travel needs the higher rating', [n10({mode: 1, rating: 20}).maxTravel, n10({mode: 1, rating: 10}).maxTravel, n10({mode: 1, rating: 5}).maxTravel, n10({mode: 1, rating: 10, travel: 12}).travelOk, n10({mode: 1, rating: 20, travel: 12}).travelOk, n10({mode: 1, haz: 2, rating: 40}).maxTravel, n10({mode: 1, haz: 0, rating: 5}).maxTravel], [15.25, 9.14, 0, false, true, 9.14, 9.14]);
check('flammable liquid of appreciable depth: 2 m2 needs 2 x 2 / 0.0929 = 43.1-B (21.5-B with AFFF); portable extinguishers are the sole protection only up to 0.93 m2', [+n10({mode: 2, area: 2}).needB.toFixed(1), +n10({mode: 2, area: 2}).needAFFF.toFixed(1), n10({mode: 2, area: 0.93}).sole, n10({mode: 2, area: 0.94}).sole, n10({mode: 2, area: 2, rating: 40}).ok, n10({mode: 2, area: 2, rating: 50}).ok, n10({mode: 2, area: 2, rating: 22, afff: true}).ok], [43.1, 21.5, true, false, false, true, true]);
check('Class D 22.9 m, Class K 9.1 m, obstacle fires 9.1 m by hand and 30.5 m with wheeled units; mounting height 1.53 m up to 18.14 kg and 1.07 m above; clearance 102 mm', [n10({mode: 3}).d, n10({mode: 3}).k, n10({mode: 3}).hand, n10({mode: 3}).wheeled, n10({mode: 3, weight: 18.14}).top, n10({mode: 3, weight: 18.2}).top, n10({mode: 3, weight: 10, top: 1.5}).topOk, n10({mode: 3, weight: 10, top: 1.6}).topOk, n10({mode: 3, weight: 20, top: 1.2}).topOk, n10({mode: 3, bottom: 0.1}).bottomOk, n10({mode: 3, bottom: 0.102}).bottomOk], [22.9, 9.1, 9.1, 30.5, 1.53, 1.07, true, false, false, false, true]);
for (let k = 0; k < 4; k++) { w.renderCalc('nfpa10'); w.document.getElementById('n10_m').value = String(k); w.calcResult('nfpa10'); }
w.renderCalc('nfpa10'); w.calcResult('nfpa10');
let tt = txt(w, 'n10_results');
check('the page opens with the Class A rating, the number of extinguishers and the 🔴 note', [tt.includes('أدنى تصنيف لطفاية واحدة'), tt.includes('عدد الطفايات'), tt.includes('🔴'), w.document.getElementById('n10_g0').style.display === '', w.document.getElementById('n10_g3').style.display === 'none'], [true, true, true, true, true]);
check('other reference codes open it too', others('nfpa10', 'n10_results'), [true, true, true]);
}
// ---------- part 144: NFPA 13 sprinkler water demand and hydraulics (`nfpa13h`: 19.3.3, Table 19.3.3.1.2, 27.2, Table 27.2.3.1.1) ----------
{
w = boot('ae'); doc = w.document;
const dm = o => w.eval('n13Demand(' + JSON.stringify(Object.assign({hz: 1, area: 139.35, wet: true, qr: false, ceil: 3.5, slope: false, ht: false, conceal: false, k: 5.6, As: 12, S: 3.4, inside: 0, long: false}, o)) + ')');
const sg = (o, c) => w.eval('n13Seg(' + JSON.stringify(Object.assign({size: 2, sch: 40, q: 300, len: 10, z: 0, fit: 'E×2 T', extra: 0}, o)) + ',' + (c || 120) + ')');
const hy = o => w.eval('n13Hyd(' + JSON.stringify(Object.assign({segs: [{size: 2, sch: 40, q: 300, len: 10, z: 0, fit: 'E×2 T', extra: 0}, {size: 3, sch: 40, q: 600, len: 20, z: 3, fit: 'G E', extra: 0}], c: 120, k: 80, qh: 75, qBase: 0, hose: 0, dev: 0.2, stat: 6, res: 4, qres: 1000}, o)) + ')');
check('Figure 19.3.3.1.1 as lines: light 0.10 gpm/ft2 at 1500 ft2 to 0.07 at 3000; ordinary 1 0.15 to 0.10 (4000 ft2); ordinary 2 0.20 to 0.15; extra 1 0.30 at 2500 to 0.20 at 5000; extra 2 0.40 to 0.30', [0, 1, 2, 3, 4].map(h => [1500, 2500, 4000, 5000].map(a => +w.eval('n13Dens(' + h + ',' + a + ')').toFixed(3)).join('/')), ['0.1/0.08/0.07/0.07', '0.15/0.13/0.1/0.1', '0.2/0.18/0.15/0.15', '0.3/0.3/0.24/0.2', '0.4/0.4/0.34/0.3']);
check('interpolation on the curves: ordinary 1 at 2500 ft2 0.13, light at 2250 ft2 0.085, extra 2 at 3750 ft2 0.35', [w.eval('n13Dens(1,2500)'), w.eval('n13Dens(0,2250)'), w.eval('n13Dens(4,3750)')], [0.13, 0.085, 0.35], 1e-9);
check('ordinary 1 at 139.35 m2 (1500 ft2): 0.15 gpm/ft2 = 6.1 mm/min; 12 m2 heads give 19.4 gpm each at 12.0 psi (K 5.6), 12 heads, 232.5 gpm; hose 250 gpm; total 482.5 gpm for 60 min = 109.6 m3', [dm({}).a, dm({}).dens, +dm({}).densMM.toFixed(1), +dm({}).q.toFixed(2), +dm({}).P.toFixed(2), dm({}).pOk, dm({}).n, +dm({}).qSpk.toFixed(1), dm({}).hose, +dm({}).total.toFixed(1), dm({}).dur, +dm({}).vol.toFixed(1)], [1500, 0.15, 6.1, 19.38, 11.97, true, 12, 232.5, 250, 482.5, 60, 109.6]);
check('branch geometry 1.2 sqrt(A): 1500 ft2 -> 14.2 m along the branch lines, 5 heads at 3.4 m, 3 branch lines', [+dm({}).len.toFixed(1), dm({}).perBr, dm({}).nBr], [14.2, 5, 3]);
check('quick-response sprinklers (wet, light or ordinary, up to 6.1 m): 40 % reduction at 3.05 m or less, 55 - 1.5 h in between (4.57 m -> 32.5 %, 6.1 m -> 25 %); the density stays but below 1500 ft2 that of 1500 ft2 applies; at least five heads; not for a dry system or above 6.1 m', [+dm({qr: true, ceil: 3.05}).a.toFixed(0), dm({qr: true, ceil: 3.05}).dens, dm({qr: true, ceil: 3.05}).n, +dm({qr: true, ceil: 4.57}).qrPct.toFixed(1), dm({qr: true, ceil: 6.1}).qrPct, dm({qr: true, ceil: 6.1}).a, dm({qr: true, ceil: 6.5}).qrOk, dm({qr: true, wet: false}).qrOk, dm({qr: true, hz: 3}).qrOk, dm({qr: true, ceil: 6.5}).a], [900, 0.15, 7, 32.5, 25, 1125, false, false, false, 1500]);
check('a dry or double-interlock system adds 30 % (1950 ft2 = 181.2 m2) and so does a sloped ceiling over 1 in 6 (compounded: 2535 ft2)', [dm({wet: false}).a, +dm({wet: false}).areaM2.toFixed(1), dm({wet: false, slope: true}).a, dm({slope: true}).a], [1950, 181.2, 2535, 1950]);
check('extra hazard 1 at 2500 ft2 with high-temperature sprinklers or K 11.2: 25 % less but not below 2000 ft2 (185.8 m2) with the density of 2500 ft2; a larger area just loses 25 %', [dm({hz: 3, area: 232.26, ht: true}).a, dm({hz: 3, area: 232.26, ht: true}).dens, dm({hz: 3, area: 232.26, k: 11.2}).a, +dm({hz: 3, area: 232.26, ht: true}).areaM2.toFixed(1), +dm({hz: 3, area: 400, ht: true}).a.toFixed(0), +dm({hz: 3, area: 400, ht: true}).dens.toFixed(3), dm({hz: 1, area: 139.35, ht: true}).a], [2000, 0.3, 2000, 185.8, 3229, 0.228, 1500]);
check('unsprinklered combustible concealed spaces: at least 3000 ft2 (278.7 m2) applied last; an area below the curve range is clamped to it', [dm({hz: 0, conceal: true}).a, +dm({hz: 0, conceal: true}).areaM2.toFixed(1), dm({hz: 0, conceal: true}).dens, dm({hz: 0, area: 50}).clamp, dm({hz: 0, area: 50}).a, dm({hz: 0, area: 139.35}).clamp], [3000, 278.7, 0.1, true, 1500, false]);
check('Table 19.3.3.1.2: light 100 gpm and 30 min; ordinary 250 gpm and 60 - 90 min; extra 500 gpm and 90 - 120 min; inside hose of 100 gpm leaves 150 gpm outside', [dm({hz: 0}).hose, dm({hz: 0}).dur, dm({hz: 0, long: true}).dur, dm({hz: 2}).hose, dm({hz: 2, long: true}).dur, dm({hz: 3}).hose, dm({hz: 4}).dur, dm({hz: 4, long: true}).dur, dm({inside: 100}).outside], [100, 30, 30, 250, 90, 500, 90, 120, 150]);
check('minimum 7 psi (0.5 bar): a K 5.6 head covering 12 m2 at 0.10 gpm/ft2 would need 12.9 gpm and 5.3 psi -> below the minimum, while 20 m2 gives 14.8 psi', [dm({hz: 0, area: 139.35}).pOk, dm({hz: 0, As: 12}).pOk, dm({hz: 0, As: 20}).pOk, +dm({hz: 0, As: 20}).P.toFixed(1)], [false, false, true, 14.8]);
check('equivalent lengths of Table 27.2.3.1.1 for 2 in pipe: 90 deg elbow 5 ft, long 3, 45 deg 2, tee 10, gate 1, check 11, butterfly 6', ['E', 'L', 'E45', 'T', 'G', 'C', 'B'].map(t => w.eval('N13_EQ.' + t + '[3]')), [5, 3, 2, 10, 1, 11, 6]);
check('2 in Sch 40 (52.5 mm) carrying 300 L/min over 10 m with two elbows and a tee (20 ft = 6.1 m): 0.01383 bar/m x 16.1 m = 0.2225 bar at 2.31 m/s', [+sg({}).id.toFixed(1), +sg({}).eq.toFixed(3), +sg({}).p.toFixed(5), +sg({}).fric.toFixed(4), +sg({}).vel.toFixed(2)], [52.5, 6.096, 0.01383, 0.2225, 2.31]);
check('Sch 10 (54.8 mm) lengthens the fittings by (54.79/52.5)^4.87 = 1.23 (7.50 m) and lowers the friction to 0.1966 bar; C = 100 shortens them by 0.713 (4.35 m) and raises the loss to 0.2779 bar', [+sg({sch: 10}).id.toFixed(1), +sg({sch: 10}).eq.toFixed(2), +sg({sch: 10}).fric.toFixed(4), +sg({}, 100).eq.toFixed(3), +sg({}, 100).fric.toFixed(4)], [54.8, 7.5, 0.1966, 4.346, 0.2779]);
check('fittings codes: E x2 T G, tokens are case-insensitive and unknown ones are ignored; the extra equivalent length is added; elevation 0.0981 bar per metre', [+sg({fit: 'g'}).eq.toFixed(3), +sg({fit: 'e*2'}).eq.toFixed(3), sg({fit: 'zz'}).eq, +sg({fit: '', extra: 2}).eq.toFixed(1), +sg({z: 5}).elev.toFixed(4), sg({size: 7}) === null], [0.305, 3.048, 0, 2, 0.4905, true]);
check('a two-segment run: remote head (75 / 80)^2 = 0.879 bar, friction 0.386 bar, elevation 0.294 bar, devices 0.2 bar -> 1.759 bar at the riser base; supply 6 / 4 bar at 1000 L/min gives 5.22 bar at 600 L/min (margin 3.46 bar)', [+hy({}).rem.toFixed(3), +hy({}).fric.toFixed(3), +hy({}).elev.toFixed(4), +hy({}).req.toFixed(3), hy({}).qTot, +hy({}).avail.toFixed(2), +hy({}).margin.toFixed(2), +hy({}).vmax.toFixed(2)], [0.879, 0.386, 0.2943, 1.759, 600, 5.22, 3.46, 2.31]);
check('the remote head never operates below 0.5 bar; a hose allowance adds to the flow at the source', [hy({qh: 40}).rem, hy({hose: 400}).qTot], [0.5, 1000]);
for (const k of ['0', '1']) { w.renderCalc('nfpa13h'); w.document.getElementById('n13_m').value = k; w.calcResult('nfpa13h'); }
w.renderCalc('nfpa13h'); w.calcResult('nfpa13h');
let tt = txt(w, 'n13_results');
check('the page opens with the density, the area and the 🔴 note', [tt.includes('الكثافة على المنحنى'), tt.includes('مساحة التشغيل التصميمية'), tt.includes('الطلب الكلي'), tt.includes('🔴'), w.document.getElementById('n13_g0').style.display, w.document.getElementById('n13_g1').style.display], [true, true, true, true, '', 'none']);
w.document.getElementById('n13_m').value = '1'; w.document.getElementById('n13_q1').value = '300'; w.document.getElementById('n13_l1').value = '10'; w.document.getElementById('n13_f1').value = 'E×2 T'; w.calcResult('nfpa13h'); tt = txt(w, 'n13_results');
check('the pipe table page lists the segment friction and the required pressure', [tt.includes('القطعة 1'), tt.includes('مجموع الاحتكاك'), tt.includes('الضغط المطلوب عند قاعدة المسير'), w.document.getElementById('n13_g1').style.display], [true, true, true, '']);
check('other reference codes open it too', others('nfpa13h', 'n13_results'), [true, true, true]);
}
// ---------- part 145: NFPA 13 sprinkler layout (`nfpa13s`: Tables 10.2.4.2.1, 10.3.3.2.1, 10.2.7.1.2, 10.2.7.2.2, 17.4.2.1, 17.2.1.1) ----------
{
w = boot('ae'); doc = w.document;
const sp = o => w.eval('n13sCalc(' + JSON.stringify(Object.assign({mode: 0, hz: 1, cons: 0, hyd: true, a: 12, b: 8, s: 0, l: 0, w: 0, d: 0, obstructed: false, st: 0, t: 1, two: false, len: 10, wid: 3.5, dim: 0, vert: false, bl: 0, size: 2, mat: 0, act: 0}, o)) + ')');
const ob = a => w.eval('n13sObs(' + a + ')');
check('Table 10.2.4.2.1(a) light hazard: 20 m2 hydraulically (18 m2 pipe schedule) for noncombustible and smooth combustible construction, 12 m2 with members under 0.91 m, 16 m2 obstructed with members over 0.91 m, 11 m2 in concealed spaces; 4.6 m spacing', [w.eval('N13S_LH.map(t => t.slice(1).join("/")).join(" ")')], ['20/18/4.6 20/18/4.6 20/18/4.6 20/18/4.6 12/12/4.6 16/16/4.6 12/12/4.6 11/11/4.6']);
check('ordinary hazard 12 m2 and 4.6 m; extra hazard 8.4 m2 (schedule) 3.7 m, 9 m2 at 10.2 mm/min or more 3.7 m, 12 m2 below 4.6 m; high-piled storage 9 m2 / 12 m2', [w.eval('N13S_OTHER.map(t => t.slice(1).join("/")).join(" ")')], ['12/4.6 8.4/3.7 9/3.7 12/4.6 9/3.7 12/4.6']);
check('maximum coverage by hazard: ordinary 12; light hydraulic 20 and schedule 18; light combustible with members under 0.91 m 12; extra (schedule) 8.4', [sp({hz: 1}).amax, sp({hz: 0}).amax, sp({hz: 0, hyd: false}).amax, sp({hz: 0, cons: 4}).amax, sp({hz: 2}).amax], [12, 20, 18, 12, 8.4]);
check('a 12 x 8 m ordinary room: 4 x 2 = 8 sprinklers at 3 x 4 m (12 m2); light hazard 3 x 2 = 6 at 4 x 4 m (16 m2); extra schedule 4 x 3 = 12 at 3 x 2.67 m', [sp({}).g.nx, sp({}).g.ny, sp({}).g.n, +sp({}).g.area.toFixed(1), sp({hz: 0}).g.n, sp({hz: 0}).g.sx, sp({hz: 0, hyd: false}).g.n, sp({hz: 2}).g.n, +sp({hz: 2}).g.sy.toFixed(2)], [4, 2, 8, 12, 6, 4, 6, 12, 2.67]);
check('a tiny room still needs one sprinkler; the arrangement never exceeds the maximum area', [sp({a: 3, b: 3}).g.n, sp({a: 40, b: 30}).g.area <= 12, sp({a: 40, b: 30, hz: 0}).g.area <= 20], [1, true, true]);
check('chosen spacing 4 x 3 m (12 m2) passes ordinary; 4.6 x 3 m = 13.8 m2 fails; 4.7 m exceeds the spacing; under 1.8 m fails', [sp({s: 4, l: 3}).aOk, sp({s: 4.6, l: 3}).aOk, sp({s: 4.7, l: 3}).sOk, sp({s: 4, l: 4.7}).lOk, sp({s: 1.5, l: 3}).minOk, sp({s: 4, l: 3}).minOk], [true, false, false, false, false, true]);
check('wall distance up to half the spacing (2.3 m for 4.6 m) and not under 100 mm', [sp({w: 2.3}).wOk, sp({w: 2.4}).wOk, sp({w: 0.05}).wOk, sp({w: 0.1}).wOk, sp({}).wall], [true, false, false, true, 2.3]);
check('deflector 25 - 300 mm below an unobstructed ceiling and 25 - 150 mm below members in obstructed construction; storage clearance 450 mm', [sp({d: 300}).dOk, sp({d: 20}).dOk, sp({d: 310}).dOk, sp({d: 160, obstructed: true}).dOk, sp({d: 100, obstructed: true}).dOk, sp({st: 450}).stOk, sp({st: 440}).stOk], [true, false, false, false, true, true, false]);
check('Table 10.3.3.2.1 sidewall: light combustible 4.3 / 3.7 m 11 m2, noncombustible 4.3 / 4.3 m 18 m2; ordinary 3 / 3 m 7.4 and 9.3 m2; opposite walls 7.3 m (light) and 6.1 m (ordinary)', [w.eval('N13S_SW.map(t => t.slice(1).join("/")).join(" ")')], ['4.3/3.7/11/7.3 4.3/4.3/18/7.3 3/3/7.4/6.1 3/3/9.3/6.1']);
check('a 10 m wall of a 3.5 m wide light room needs 3 sidewall sprinklers at 3.33 m, area 11.7 m2; an ordinary combustible room needs 4 at 2.5 m, and a 3.5 m width exceeds 3 m but 5 m is fine with two opposite walls', [sp({mode: 1}).n, +sp({mode: 1}).s.toFixed(2), +sp({mode: 1}).area.toFixed(2), sp({mode: 1}).wOk, sp({mode: 1}).areaOk, sp({mode: 1, t: 2}).n, sp({mode: 1, t: 2}).s, sp({mode: 1, t: 2}).wOk, sp({mode: 1, t: 2, two: true, wid: 5}).wOk, sp({mode: 1, t: 2, two: true, wid: 5}).nTot, sp({mode: 1, t: 2, two: true, wid: 5}).areaOk], [3, 3.33, 11.67, true, true, 4, 2.5, false, true, 8, true]);
check('Table 10.2.7.1.2: A under 1 ft (305 mm) 0; 600 mm -> 90 mm; 610 mm -> 140; 900 -> 190; 915 -> 240; 2200 -> 875; from 7.5 ft (2290 mm) not tabulated', [ob(250), ob(600), ob(610), ob(900), ob(915), ob(2200), ob(2300)], [0, 90, 140, 190, 240, 875, null]);
check('the whole progression of the table in mm: 65 90 140 190 240 300 350 415 450 500 600 750 875', [w.eval('N13S_OBS.map(r => r[1]).join(" ")')], ['65 90 140 190 240 300 350 415 450 500 600 750 875']);
check('a deflector 90 mm above the bottom at 600 mm passes, 100 mm fails; the three-times rule: 150 mm member -> 450 mm; 300 mm -> 600 mm (capped); a 300 mm column -> 900 mm; pipes under 80 mm are exempt; fixed obstructions 1.2 m wide or more need sprinklers beneath', [sp({mode: 2, a: 600, b: 90}).bOk, sp({mode: 2, a: 600, b: 100}).bOk, sp({mode: 2, a: 450, dim: 150}).min3, sp({mode: 2, a: 450, dim: 150}).min3Ok, sp({mode: 2, a: 440, dim: 150}).min3Ok, sp({mode: 2, dim: 300}).min3, sp({mode: 2, dim: 300, vert: true}).min3, sp({mode: 2, dim: 79}).pipeExempt, sp({mode: 2, dim: 1200}).wide, sp({mode: 2, dim: 1199}).wide], [true, false, 450, true, false, 600, 900, true, true, false]);
check('light hazard obstruction table: horizontal A up to 150 mm -> 75 mm below; 151 -> 100; 300 -> 150; 800 -> 450', [100, 150, 151, 300, 450, 800].map(a => sp({mode: 2, a}).lh), [75, 75, 100, 150, 240, 450]);
check('Table 17.4.2.1: steel 1 in 3.7 m, 1 1/2 in and larger 4.6 m, 3/4 in not applicable; thin-wall threaded steel 3.7 m up to 3 in; copper 3/4 in 2.4 m, 1 1/2 in 3.0 m, 2 in 3.7 m; CPVC 3/4 in 1.7 m, 3 in 3.0 m; ductile iron 3 in 4.6 m and 2 in not applicable', [sp({mode: 3, size: 1}).sp, sp({mode: 3, size: 1.5}).sp, sp({mode: 3, size: 0.75}).na, sp({mode: 3, mat: 1, size: 2}).sp, sp({mode: 3, mat: 1, size: 3.5}).na, sp({mode: 3, mat: 2, size: 0.75}).sp, sp({mode: 3, mat: 2, size: 1.5}).sp, sp({mode: 3, mat: 2, size: 2}).sp, sp({mode: 3, mat: 3, size: 0.75}).sp, sp({mode: 3, mat: 3, size: 3}).sp, sp({mode: 3, mat: 4, size: 3}).sp, sp({mode: 3, mat: 4, size: 2}).na], [3.7, 4.6, true, 3.7, true, 2.4, 3, 3.7, 1.7, 3, 4.6, true]);
check('a 20 m steel line at 4.6 m needs 6 hangers (5 spans); a 4.6 m spacing passes and 4.7 m fails; hanger rods 10 mm up to 4 in, 13 mm for 5 - 8 in', [sp({mode: 3, len: 20}).n, sp({mode: 3, act: 4.6}).spOk, sp({mode: 3, act: 4.7}).spOk, sp({mode: 3, size: 0.75, act: 1}).spOk, sp({mode: 3, size: 4}).rod, sp({mode: 3, size: 5}).rod, sp({mode: 3, size: 8}).rod, sp({mode: 3, size: 2.5}).rod], [6, true, false, false, 10, 13, 13, 10]);
for (let k = 0; k < 4; k++) { w.renderCalc('nfpa13s'); w.document.getElementById('n13s_m').value = String(k); w.calcResult('nfpa13s'); }
w.renderCalc('nfpa13s'); w.calcResult('nfpa13s');
let tt = txt(w, 'n13s_results');
check('the page opens with the maximum area, the spacing and the 🔴 note', [tt.includes('أقصى مساحة تغطية للرشاش'), tt.includes('أقصى تباعد'), tt.includes('ترتيب مقترح'), tt.includes('🔴'), w.document.getElementById('n13s_g0').style.display, w.document.getElementById('n13s_g3').style.display], [true, true, true, true, '', 'none']);
check('other reference codes open it too', others('nfpa13s', 'n13s_results'), [true, true, true]);
}
// ---------- part 146: UAE Fire and Life Safety Code chapter 9 systems and risers (`uaefp`: Tables 9.1 - 9.4, 3.2 - 3.4, 4.1 - 4.21) ----------
{
w = boot('ae'); doc = w.document;
const uf = o => w.eval('ufCalc(' + JSON.stringify(Object.assign({mode: 0, row: 0, col: 0, comp: 0, tot: 0, bas: 0, plot: 0, floors: 0, sys: 1, h: 60, n: 2, horiz: false, spr: true, sprQ: 0, hose: 0, fric: 1.5, dn: 0, lv: 1, reels: 1, dist: 0, large: false, outlets: 2}, o)) + ')');
check('Table 9.1 sizes: 18 occupancy rows, each with 7 categories; Table 9.2 has 29 auxiliary rooms; 9.3 has 54 industrial rows; 9.4 has 19 storage rows', [w.eval('UF_T91.length'), w.eval('UF_T91.every(t => t[1].length === 7)'), w.eval('UF_T92.length'), w.eval('UF_T93.length'), w.eval('UF_T93.every(t => t.length === 8)'), w.eval('UF_T94.length'), w.eval('UF_T94.every(t => t.length === 8)')], [18, true, 29, 54, true, 19, true]);
check('Table 9.1 samples: hotels WRS+AS in every category; assembly the same; detention WRS+PAS; business mid-rise WRS only; apartments mid-rise WRS; animal housing up to 900 m2 DRS; educational above 900 m2 WRS with sprinklers if not an open corridor; private villas basement AS and mid-rise AS; commercial villas YFH and WRS+AS+YFH', [w.eval('UF_T91[7][1].join(" ")'), w.eval('UF_T91[4][1][3]'), w.eval('UF_T91[2][1][5]'), w.eval('UF_T91[11][1][5]'), w.eval('UF_T91[0][1][0]'), w.eval('UF_T91[5][1][1]'), w.eval('UF_T91[13][1].join(" ")'), w.eval('UF_T91[14][1].join(" ")')], ['WRS+AS WRS+AS WRS+AS WRS+AS WRS+AS WRS+AS WRS+AS', 'WRS+PAS', 'WRS', 'WRS', 'DRS', 'WRS+ASo', 'DOM+FE DOM+FE DOM+FE AS DOM+FE AS AS', 'YFH YFH YFH+AS WRS+AS+YFH YFH YFH WRS+AS+YFH']);
check('system names: WRS+AS, alternatives with a bar, and an empty cell', [w.eval('ufSys("WRS+AS")'), w.eval('ufSys("WRS+AS|WMS")'), w.eval('ufSys("")'), w.eval('ufSys("YFH")')], ['WRS (مسير رطب) + AS (رشاشات آلية)', 'WRS (مسير رطب) + AS (رشاشات آلية) أو WMS (ضباب مائي)', '—', 'YFH (حنفيات حريق خارجية)']);
check('sprinkler conditions of Table 9.1: animal housing over 2230 m2 total; educational over 1860 m2 or more than one basement; mercantile largest compartment over 1115 m2; private villas over 1115 m2; hotels unconditional', [uf({row: 0, tot: 2230}).need, uf({row: 0, tot: 2231}).need, uf({row: 5, bas: 2}).need, uf({row: 5, tot: 1861}).need, uf({row: 9, comp: 1115}).need, uf({row: 9, comp: 1116}).need, uf({row: 13, tot: 1116}).need, uf({row: 7, tot: 99999}).need, uf({row: 8, comp: 1861}).need], [false, true, true, true, false, true, true, false, true]);
check('the whole plot above 20,000 m2 needs yard hydrants with their own pump and tank', [uf({plot: 20000}).yard, uf({plot: 20001}).yard], [false, true]);
check('Table 9.2: computer rooms CAS; server rooms CAS+PAS; cold rooms PAS; diesel generators FSS+WMS+WSS; garbage rooms AS; transformer rooms WSS; swimming pools hose; lift machine rooms PAS', [3 + 3, 24, 5, 8, 12, 28, 27, 18].map(i => w.eval('UF_T92[' + i + '][1]')), ['CAS', 'CAS+PAS', 'PAS', 'FSS+WMS+WSS', 'AS', 'WSS', 'FHS', 'PAS']);
check('Table 9.3 samples: bakeries DRS / WRS / WRS+AS with condition A; arms factories need a risk analysis; battery rooms CAS over 16 m2; hangars FSS+WMS; generator rooms WRS+FSS+WMS; spray painting FSS; telephone exchanges FE / CAS / CAS with the 232 / 900 m2 condition; steam generators CAS+WSS+WMS', [2, 2, 2, 2].map((r, k) => uf({mode: 2, row: 2, col: k}).sys), ['DRS', 'WRS', 'WRS+AS', 'WRS+AS']);
check('more of Table 9.3', [uf({mode: 2, row: 1}).risk, uf({mode: 2, row: 3, col: 4}).sys, uf({mode: 2, row: 30, col: 2}).sys, uf({mode: 2, row: 28, col: 2}).sys, uf({mode: 2, row: 44, col: 4}).sys, uf({mode: 2, row: 47, col: 0}).sys, uf({mode: 2, row: 47, col: 1}).sys, uf({mode: 2, row: 45, col: 4}).sys, uf({mode: 2, row: 15, col: 4}).sys, uf({mode: 2, row: 2}).risk], [1, 'CAS', 'FSS+WMS', 'WRS+FSS+WMS', 'FSS', 'FE', 'CAS', 'CAS+WSS+WMS', 'WRS+CAS|WMS', 0]);
check('Table 9.3 conditions: A over 900 m2 compartment or 2230 m2 total; F over 232 m2 or 900 m2; C over 16 m2; G over 900 m2', [uf({mode: 2, row: 2, comp: 901}).need, uf({mode: 2, row: 2, comp: 900, tot: 2230}).need, uf({mode: 2, row: 2, tot: 2231}).need, uf({mode: 2, row: 19, comp: 233}).need, uf({mode: 2, row: 19, tot: 901}).need, uf({mode: 2, row: 19, comp: 232, tot: 900}).need, uf({mode: 2, row: 3, tot: 17}).need, uf({mode: 2, row: 3, tot: 16}).need, uf({mode: 2, row: 27, comp: 901}).need], [true, false, true, true, true, false, true, false, true]);
check('industrial and storage plots over 3600 m2 need hydrants; more than 3 floors above fire access need full sprinklers', [uf({mode: 2, plot: 3601}).yard, uf({mode: 2, plot: 3600}).yard, uf({mode: 3, floors: 4}).fully, uf({mode: 3, floors: 3}).fully], [true, false, true, false]);
check('Table 9.4: low hazard storage DRS / WRS / WRS+AS; high hazard storage a risk analysis; warehouses refer to Table 9.1; cold storage WRS+PAS with the 900 m2 condition; hangars WRS+AS or WMS; open parking DRS / WRS; robotic parking WRS+FSS; stables with 2230 m2; truck terminals WRS and a risk analysis; marine WRS+AS; multi-tenant groups refer to chapter 13', [uf({mode: 3, row: 0}).sys, uf({mode: 3, row: 0, col: 1}).sys, uf({mode: 3, row: 0, col: 2}).sys, uf({mode: 3, row: 1}).risk, uf({mode: 3, row: 2}).risk, uf({mode: 3, row: 8, col: 4}).sys, uf({mode: 3, row: 8, tot: 901}).need, uf({mode: 3, row: 9, col: 4}).sys, uf({mode: 3, row: 13}).sys, uf({mode: 3, row: 14, col: 1}).sys, uf({mode: 3, row: 15, tot: 2231}).need, uf({mode: 3, row: 16, col: 4}).sys, uf({mode: 3, row: 16}).risk, uf({mode: 3, row: 17, col: 1}).sys, uf({mode: 3, row: 18}).risk], ['DRS', 'WRS', 'WRS+AS', 1, 2, 'WRS+PAS', true, 'WRS+AS|WMS', 'DRS', 'WRS+FSS', true, 'WRS', 1, 'WRS+AS', 3]);
check('wet riser flow: 500 gpm for one riser, +250 for each more (two 750, three 1000), at most 1000 gpm sprinklered (four capped) and 1250 gpm otherwise; horizontal with three valves starts at 750 gpm', [uf({mode: 4, n: 1}).flow, uf({mode: 4}).flow, uf({mode: 4, n: 3}).flow, uf({mode: 4, n: 4}).flow, uf({mode: 4, n: 4}).capped, uf({mode: 4, n: 4, spr: false}).flow, uf({mode: 4, n: 5, spr: false}).capped, uf({mode: 4, n: 1, horiz: true}).flow, uf({mode: 4, n: 2, horiz: true}).flow], [500, 750, 1000, 1000, true, 1250, true, 750, 1000]);
check('combined with sprinklers: a fully sprinklered building takes the larger of the riser demand and sprinkler plus hose (850 vs 750); otherwise they add (1350); a dry riser takes 250 gpm per outlet in use', [uf({mode: 4, sprQ: 600, hose: 250}).combined, uf({mode: 4, sprQ: 600, hose: 250, spr: false}).combined, uf({mode: 4, sprQ: 300, hose: 100}).combined, uf({mode: 4, sys: 0, outlets: 2}).flow, uf({mode: 4, sys: 0, outlets: 3}).combined], [850, 1350, 750, 500, 750]);
check('residual pressure 7 bar at the wet riser top (6.9 bar for a dry riser); the pump rating 7 + 0.0981 x 60 + 1.5 = 14.39 -> 14.5 bar; churn at 140 % = 20.3 bar, over 12 bar so a regulating station is needed below 84.6 m above the pump; one station is enough since 14.5 bar is under 17.14 bar', [uf({mode: 4}).pTop, uf({mode: 4, sys: 0}).pTop, +uf({mode: 4}).pReq.toFixed(2), uf({mode: 4}).pRated, +uf({mode: 4}).churn.toFixed(1), uf({mode: 4}).prvLv, +uf({mode: 4}).xPrv.toFixed(1), uf({mode: 4}).multi], [7, 6.9, 14.39, 14.5, 20.3, true, 84.6, false]);
check('a 100 m building needs 18.5 bar: more than 24 bar at the 140 % cut-off, so several pumping stations; a low building of 10 m with 0.5 bar friction needs 8.5 bar and a churn of 11.9 bar -> no regulator', [uf({mode: 4, h: 100}).pRated, uf({mode: 4, h: 100}).multi, uf({mode: 4, h: 10, fric: 0.5}).pRated, +uf({mode: 4, h: 10, fric: 0.5}).churn.toFixed(1), uf({mode: 4, h: 10, fric: 0.5}).prvLv], [18.5, true, 8.5, 11.9, false]);
check('fire water for 60 minutes of the pump capacity: 750 gpm = 170.3 m3; pumps: electric main, diesel standby and a jockey (wet) or electric and diesel of at least 100 gpm (dry)', [+uf({mode: 4}).tank.toFixed(1), uf({mode: 4}).pumps.includes('Jockey'), uf({mode: 4, sys: 0}).pumps.includes('100 gpm')], [170.3, true, true]);
check('pipe sizes: risers 150 mm wet and 100 mm dry; horizontal pipes 65 mm for one valve, 100 mm for two, 150 mm for more (wet) or 100 mm (dry); hose reel lines 25 mm for one, 50 mm for more', [uf({mode: 4, dn: 100}).riserOk, uf({mode: 4, dn: 150}).riserOk, uf({mode: 4, sys: 0, dn: 100}).riserOk, uf({mode: 4, lv: 1}).horizMin, uf({mode: 4, lv: 2}).horizMin, uf({mode: 4, lv: 3}).horizMin, uf({mode: 4, sys: 0, lv: 3}).horizMin, uf({mode: 4, reels: 1}).reelMin, uf({mode: 4, reels: 2}).reelMin], [false, true, true, 65, 100, 150, 100, 25, 50]);
check('breeching: four 65 mm inlets for wet risers and two for dry; two per riser in a high-rise or a large building; hose stations within 30 m; enclosures of 2 hours (1 hour if fully sprinklered)', [uf({mode: 4}).breechN, uf({mode: 4, h: 20}).breechN, uf({mode: 4, h: 20, large: true}).breechN, uf({mode: 4, sys: 0}).breechN, uf({mode: 4, dist: 30}).distOk, uf({mode: 4, dist: 31}).distOk, uf({mode: 4}).encl, uf({mode: 4, spr: false}).encl], [2, 1, 2, 1, true, false, 1, 2]);
for (let k = 0; k < 5; k++) { w.renderCalc('uaefp'); w.document.getElementById('uf_m').value = String(k); w.calcResult('uaefp'); }
w.renderCalc('uaefp'); w.calcResult('uaefp');
let tt = txt(w, 'uf_results');
check('the page opens with the Table 9.1 occupancy, the systems and the 🔴 note', [tt.includes('الأنظمة المطلوبة'), tt.includes('شرط الرشاشات'), tt.includes('🔴'), w.document.getElementById('uf_g0').style.display, w.document.getElementById('uf_g4').style.display, w.document.getElementById('uf_ga').style.display], [true, true, true, '', 'none', '']);
w.document.getElementById('uf_m').value = '4'; w.calcResult('uaefp'); tt = txt(w, 'uf_results');
check('the riser page shows the flow, the pressure and the pumps; the area inputs hide', [tt.includes('تدفق التصميم'), tt.includes('ضغط المضخة المقدَّر'), tt.includes('مجموعة المضخات'), w.document.getElementById('uf_ga').style.display], [true, true, true, 'none']);
check('other reference codes open it too', others('uaefp', 'uf_results'), [true, true, true]);
}
// ---------- part 147: UAE Fire and Life Safety Code chapter 9 storage sprinklers (`uaestore`: Tables 9.8 - 9.33, 13 - 14) ----------
{
w = boot('ae'); doc = w.document;
const uw = o => w.eval('uwCalc(' + JSON.stringify(Object.assign({mode: 0, cls: 1, arr: 0, h: 3, aisle: 1.2, enc: false, inrack: false, ht: false, pt: 0, ps: 2.4, pc: 8, sys: 0, g: 2, lt: 1, cm: 3, cg: 0, sub: 0, dens: 0.3}, o)) + ')');
const m1 = o => uw(Object.assign({mode: 1, arr: 1, h: 5, cls: 2}, o));
check('Table 9.15 up to 3.7 m: class I 0.15 gpm/ft2 over 1500 ft2 (140 m2), 250 gpm and 90 min; class II 0.15 under 3 m and 0.20 from 3 m; class III 0.20; class IV 0.20, with in-rack storage 3 - 3.7 m 0.30 over 2500 ft2 (232 m2), 500 gpm and 120 min', [uw({cls: 1}).row.slice(4).join('/'), uw({cls: 2, h: 2.9}).row[4], uw({cls: 2, h: 3}).row[4], uw({cls: 2, h: 3.7}).row[4], uw({cls: 3, h: 3.7}).row[4], uw({cls: 4, h: 2.5}).row[4], uw({cls: 4, h: 3.2}).row[4], uw({cls: 4, h: 3.2, arr: 1}).row.slice(4).join('/'), uw({cls: 3, h: 3.71}).row, uw({cls: 3, h: 3.71}).over], ['0.15/1500/250/90', 0.15, 0.2, 0.2, 0.2, 0.2, 0.2, '0.3/2500/500/120', null, true]);
check('the storage height modification (Figure 9.13, digitised): 60 % at 12 ft, 68 % at 15 ft, 100 % at 20 ft, 136 % at 25 ft, 188 % at 30 ft', [12, 15, 20, 25, 30].map(f => Math.round(w.eval('uwFig(' + f * 0.3048 + ')'))), [60, 68, 100, 136, 188]);
check('single or double row racks of 5 m, class II, 1.2 m aisle, not encapsulated, ordinary ceiling: Table 9.29 row 0.26 / 0.30 / 0.38 / 0.44; the factor 0.769 against the 6.1 m of the table gives 0.338 gpm/ft2 without in-rack sprinklers and 0.231 with them', [m1({}).tab, m1({}).withIn, m1({}).without, +m1({}).fac.toFixed(3), +m1({}).dens.toFixed(3), +m1({inrack: true}).dens.toFixed(3), m1({ht: true}).without], ['9.29', 0.3, 0.44, 0.769, 0.338, 0.231, 0.38]);
check('the table follows the height: 6.5 m -> Table 9.30 (factor 0.959), 7.0 m -> 9.31 (0.895), 6.1 m -> 9.29 with factor 1; palletized stacks use Tables 9.16 - 9.18; at or below 3.7 m Table 9.15, above 7.6 m the large drop or ESFR tables', [m1({h: 6.5}).tab, +m1({h: 6.5}).fac.toFixed(3), m1({h: 7}).tab, +m1({h: 7}).fac.toFixed(3), m1({h: 6.1}).tab, m1({h: 6.1}).fac, m1({arr: 0, h: 6.5}).tab, m1({arr: 0, h: 5}).tab, m1({arr: 0, h: 7.3}).tab, m1({h: 3.7}).low, m1({h: 7.7}).high], ['9.30', 0.959, '9.31', 0.895, '9.29', 1, '9.17', '9.16', '9.18', true, true]);
check('class III encapsulated in 1.2 m aisles needs one in-rack level: no density without in-rack sprinklers (not permitted) and 0.39 with an ordinary ceiling; class IV not encapsulated 7.6 m with 1.2 m aisles: 9.31 needs no in-rack and 0.39 / 0.44 with in-rack', [m1({cls: 3, enc: true, h: 6.1}).row[0], m1({cls: 3, enc: true, h: 6.1}).dens, m1({cls: 3, enc: true, h: 6.1}).noWithout, m1({cls: 3, enc: true, h: 6.1, inrack: true}).withIn, m1({cls: 4, h: 7.6}).tab, m1({cls: 4, h: 7.6}).row.join('/'), m1({cls: 4, h: 7.6}).dens, m1({cls: 4, h: 7.6, inrack: true, ht: true}).dens], ['1 level', null, true, 0.39, '9.31', 'No need/0.39/0.44//', null, 0.39]);
check('the 2.4 m aisle rows: encapsulated class I at 6 m 0.24 / 0.27 with no in-rack; 9.16 palletized prints 0.25 / 0.28 for the same case', [m1({aisle: 2.4, enc: true, cls: 1, h: 6}).row.slice(1, 3).join('/'), m1({aisle: 2.4, enc: true, cls: 1, h: 6, arr: 0}).row.slice(1, 3).join('/'), m1({aisle: 2.4, cls: 4, h: 6}).row.slice(1).join('/')], ['0.24/0.27', '0.25/0.28', '0.32/0.37/0.49/0.57']);
check('multiple-row racks (Tables 9.32 and 9.33): 3.7 - 4.6 m class IV not encapsulated 0.39 / 0.44 with and without in-rack; encapsulated class IV 0.48 / 0.56 (9.32) or 0.58 / 0.66 (9.33) with one level; the height ranges 4.6 and 6.1 m', [m1({arr: 2, h: 4, cls: 4}).row.join('/'), m1({arr: 2, h: 4, cls: 4, enc: true}).row.join('/'), m1({arr: 3, h: 4, cls: 4, enc: true}).row.join('/'), m1({arr: 2, h: 4}).top, m1({arr: 2, h: 4.61}).top, m1({arr: 2, h: 6.2}).top, m1({arr: 2, h: 6.2, cls: 4}).row[0], m1({arr: 3, h: 5, cls: 1}).row[0], m1({arr: 3, h: 4, cls: 1}).row[0]], ['No need/0.39/0.44/0.39/0.44', '1 level/0.48/0.56//', '1 level/0.58/0.66//', 4.6, 6.1, 7.6, '2 levels', '1 level', 'No need']);
check('idle wooden pallets on the floor 1.5 m high with a 6 m ceiling: control mode Table 9.9 gives K 8 0.20, K 11.2 0.45 and K 16.8 0.60 gpm/ft2; 3 m storage K 11.2 0.60 over 3500 / 6000 ft2 and K 16.8; racks only the last two rows', [uw({mode: 2, ps: 1.5, pc: 6}).cm.map(t => t[5]).join('/'), uw({mode: 2, ps: 3, pc: 8}).cm.map(t => t[1] + ':' + t[5]).join('/'), uw({mode: 2, ps: 3, pc: 8, arr: 1}).cm.length, uw({mode: 2, ps: 1.5, pc: 6.2}).cm.map(t => t[1]).join('/'), uw({mode: 2, ps: 4, pc: 9}).cm.map(t => t[6] + '/' + t[7]).join(' ')], ['0.2/0.45/0.6', '16.8:0.6/11.2:0.6', 1, '11.2/16.8', '0/2000 4500/0']);
check('idle pallets with large drop wet: K 11.2 upright 15 sprinklers, K 16.8 upright 15 at 15 psi and K 16.8 pendent 15 at 16 psi up to a 9.1 m ceiling; dry 25 sprinklers; ceiling 10 m K 16.8 pendent 25 psi; 11.5 m K 19.6 pendent 30 psi', [uw({mode: 2, ps: 5, pc: 9}).ld.length, uw({mode: 2, ps: 5, pc: 9, sys: 1}).ld.length, uw({mode: 2, ps: 5, pc: 9, sys: 1}).ld[0][1], uw({mode: 2, ps: 5, pc: 10}).ld[0][1], uw({mode: 2, ps: 5, pc: 11.5}).ld[0][0], uw({mode: 2, ps: 6.2, pc: 9}).ld.length], [3, 2, '25 رشاشًا عند 25 أو 50 أو 75 psi', '15 رشاشًا عند 25 psi', 'K 19.6 مدلى', 0]);
check('idle plastic pallets: indoors up to 3.05 m with a ceiling up to 9.1 m is allowed', [uw({mode: 2, pt: 1, ps: 3.05, pc: 9.1}).plasticOk, uw({mode: 2, pt: 1, ps: 3.1, pc: 9}).plasticOk, uw({mode: 2, pt: 1, ps: 3, pc: 9.2}).plasticOk], [true, false, false]);
check('ESFR tables: palletized class I - IV with 7.5 m storage under a 9 m ceiling is the 7.6 / 9.1 row (K 14 50 psi, K 16.8 35, K 22.4 20, K 25.2 15); 12 m storage under 13 m goes to the 12.2 / 13.7 row (22.4 and 25.2 at 40); 13 m storage is outside', [uw({mode: 3, ps: 7.5, pc: 9}).row.slice(0, 2).join('/'), uw({mode: 3, ps: 7.5, pc: 9}).row[2].map(x => x[0] + ':' + x[2]).join(' '), uw({mode: 3, ps: 12, pc: 13}).row.slice(0, 2).join('/'), uw({mode: 3, ps: 13, pc: 13}).row], ['7.6/9.1', '14:50 16.8:35 22.4:20 25.2:15', '12.2/13.7', null]);
check('ESFR racks up to 7.6 m (9.22): 9 m storage under 10.5 m gives K 14 75, K 16.8 52, K 22.4 35, K 25.2 20; 12 m under 13.7 m: K 14 90, K 16.8 63; racks above 7.6 m (9.24): 10 m storage and 12 m ceiling K 25.2 20 psi; idle wooden pallets (9.13) 7 m / 9 m: pendent K 14 50', [uw({mode: 3, g: 3, ps: 9, pc: 10.5}).row[2].map(x => x[2]).join('/'), uw({mode: 3, g: 3, ps: 12, pc: 13.5}).row[2].map(x => x[2]).join('/'), uw({mode: 3, g: 4, ps: 10, pc: 12}).row[2].map(x => x[2]).join('/'), uw({mode: 3, g: 0, ps: 7, pc: 9}).row[2][0].join(':'), uw({mode: 3, g: 1, ps: 10, pc: 12}).row.slice(0, 2).join('/')], ['75/52/35/20', '90/63/40/40', '75/52/40/20', '14:P:50', '10.7/12.2']);
check('large drop and specific application (9.21 wet, class III, 7 m storage, 9 m ceiling): LD 11.2 15 sprinklers with one in-rack level at 25 psi, K 16.8 at 22 psi, K 19.6 pendent at 16 psi; dry 6 m: 25 sprinklers; 9.19 class IV on pallets 6 m: LD 15 at 50 psi and class II solid piled 7 m: K 16.8 at 10 psi', [uw({mode: 4, cm: 3, ps: 7, pc: 9}).row[4] + '/' + uw({mode: 4, cm: 3, ps: 7, pc: 9}).row[5], uw({mode: 4, cm: 3, ps: 7, pc: 9}).row[6].map(x => x[0] + ':' + x[2]).join(' '), uw({mode: 4, cm: 3, ps: 6, pc: 9, sys: 1}).row[6][0][1], uw({mode: 4, lt: 0, cm: 4, ps: 6, pc: 9}).row[6][0].join(':'), uw({mode: 4, lt: 0, cm: 2, ps: 7, pc: 9, arr: 1}).row[6][0].join(':'), uw({mode: 4, lt: 0, cm: 5, ps: 6, pc: 9}).row[6][0].join(':')], ['7.6/9.1', 'LD 11.2:25 K 16.8:22 K 19.6:16', '25 قائم', 'LD 11.2:15:50', 'K 16.8:15:10', 'LD 11.2:25:25']);
check('racks over 7.6 m (9.23): class I 10 m storage under 10.5 m: K 19.6 pendent 25 psi with LD 20 + in-rack; 11 m under 12 m: K 19.6 30 psi; dry 10 m: LD 36 upright at 55 psi; above a 12.1 m ceiling nothing; dry palletized allowed only classes I - III up to 7.6 m', [uw({mode: 4, lt: 2, cm: 1, ps: 9, pc: 10.5}).row[6].length, uw({mode: 4, lt: 2, cm: 3, ps: 10, pc: 11}).row[6][0].join(':'), uw({mode: 4, lt: 2, cm: 1, ps: 10, pc: 11.5, sys: 1}).row[6][0].join(':'), uw({mode: 4, lt: 2, cm: 1, ps: 10, pc: 12.2}).row, uw({mode: 4, lt: 0, sys: 1, cm: 2, ps: 7}).dryOk, uw({mode: 4, lt: 0, sys: 1, cm: 4, ps: 7}).dryOk, uw({mode: 4, lt: 0, sys: 1, cm: 2, ps: 7.7}).dryOk], [3, 'K 19.6:15 مدلى:30', 'LD 11.2:36 قائم:55', null, true, false, false]);
check('Group A plastics (9.25): under 1.5 m 0.20; 1.5 - 3 m: 0.30 under a 4.6 m ceiling and 0.40 under 6.1 m; 3 - 3.7 m under 5.2 m 0.40; under 8.2 m palletized gives 0.20 with in-rack or 0.40 without; exposed 1.5 - 3 m 0.40 up to 4.6 m', [uw({mode: 5, ps: 1, pc: 3}).rows[0][5], uw({mode: 5, ps: 2, pc: 4}).rows[0][5], uw({mode: 5, ps: 2, pc: 5}).rows[0][5], uw({mode: 5, ps: 3.5, pc: 5}).rows[0][5], uw({mode: 5, ps: 3.5, pc: 8}).rows.map(x => x[5] + x[7]).join(' '), uw({mode: 5, ps: 3.5, pc: 9}).row, uw({mode: 5, sub: 1, ps: 2, pc: 4}).rows[0][5], uw({mode: 5, sub: 2, ps: 2, pc: 6}).rows[0][5], uw({mode: 5, sub: 3, arr: 1, ps: 2, pc: 6}).rows[0].slice(5, 8).join('/')], [0.2, 0.3, 0.4, 0.4, '0.2' + '1 level 0.4No need', null, 0.4, 0.4, '0.2/1500/1 level']);
check('tires (9.27): 1.5 m with any rack 0.20 over 1500 ft2; 2 m on the floor on the side 0.30 over 2500 ft2, 500 gpm, 120 min and the fixed rack with in-rack sprinklers 0.20; rolled paper (9.28) heavy 0.20 and tissue 0.30 under 3 m, ceiling 8 m', [uw({mode: 5, cg: 1, ps: 1, pc: 5}).rows.length, uw({mode: 5, cg: 1, ps: 1, pc: 5}).rows[0][4], uw({mode: 5, cg: 1, ps: 2, pc: 8}).rows.length, uw({mode: 5, cg: 1, ps: 2, pc: 8}).rows[0].slice(4, 9).join('/'), uw({mode: 5, cg: 1, ps: 2, pc: 8}).rows[3][4], uw({mode: 5, cg: 2, ps: 2, pc: 7}).rows.map(t => t[4]).join('/'), uw({mode: 5, cg: 2, ps: 3.1, pc: 7}).row, uw({mode: 5, cg: 1, ps: 2, pc: 8.3}).row], [2, 0.2, 4, '0.3/2500/No need/500/120', 0.2, '0.2/0.3', null, null]);
check('in-rack sprinklers up to 7.6 m: 1.2 m aisles 3.7 m for classes I and II and 2.4 m for III and IV; 2.4 m aisles 3.7 m for I - III and 2.4 m for IV; one level at half the height (6 m -> 3 m); two at a third and two thirds (2 m and 4 m)', [uw({mode: 6, cls: 1}).sp, uw({mode: 6, cls: 2}).sp, uw({mode: 6, cls: 3}).sp, uw({mode: 6, cls: 4}).sp, uw({mode: 6, aisle: 2.4, cls: 3}).sp, uw({mode: 6, aisle: 2.4, cls: 4}).sp, uw({mode: 6, ps: 6}).one, uw({mode: 6, ps: 6}).two.map(x => Math.round(x)).join('/')], [3.7, 3.7, 2.4, 2.4, 3.7, 2.4, 3, '2/4']);
check('Table 9.8: density under 0.20 gpm/ft2 K 5.6 (80); 0.20 - 0.34 K 8 (115); above 0.34 K 11.2 (161)', [uw({mode: 6, dens: 0.15}).kp, uw({mode: 6, dens: 0.2}).kp, uw({mode: 6, dens: 0.34}).kp, uw({mode: 6, dens: 0.35}).kp], [0, 1, 1, 2]);
for (let k = 0; k < 7; k++) { w.renderCalc('uaestore'); w.document.getElementById('uw_m').value = String(k); w.calcResult('uaestore'); }
w.renderCalc('uaestore'); w.calcResult('uaestore');
let tt = txt(w, 'uw_results');
check('the page opens with the Table 9.15 density, hose and duration and the 🔴 note', [tt.includes('الكثافة المطلوبة'), tt.includes('خراطيم الإطفاء ومدة الماء'), tt.includes('🔴'), w.document.getElementById('uw_g0').style.display, w.document.getElementById('uw_g6').style.display], [true, true, true, '', 'none']);
w.document.getElementById('uw_m').value = '1'; w.calcResult('uaestore'); tt = txt(w, 'uw_results');
check('the rack page shows the table, the in-rack requirement and the selected density', [tt.includes('الرشاشات داخل الرف'), tt.includes('الكثافة المختارة'), tt.includes('9.29')], [true, true, true]);
check('other reference codes open it too', others('uaestore', 'uw_results'), [true, true, true]);
}
// ---------- part 148: UAE Fire and Life Safety Code chapter 9 water spray and foam (`uaespray`: 42.4, 44.5, Tables 9.44 and 9.45) ----------
{
w = boot('ae'); doc = w.document;
const ux = o => w.eval('uxCalc(' + JSON.stringify(Object.assign({mode: 0, shape: 0, D: 3, L: 10, end: 0, h: 0.5, A: 100, purp: 0, dens: 10.2, n: 40, P: 3.5, hose: 1900, dur: 60, row: 0, pct: 3, closed: false}, o)) + ')');
const u2 = o => ux(Object.assign({mode: 2, A: 0}, o));
check('horizontal tank D 3 m, L 10 m: shell 94.25 m2 and two flat ends 14.14 m2 (42.4.15 i): total 108.38 m2; dished ends with h 0.5 m 109.96 m2; hemispherical ends 122.52 m2', [ux({}).a1, ux({}).aEnds, ux({}).A, ux({end: 1}).A, ux({end: 2}).A], [94.2478, 14.1372, 108.3849, 109.9557, 122.5221], 1e-3);
check('density 10.2 L/min/m2 (0.25 gpm/ft2): flow 1105.5 L/min, 40 nozzles 27.64 L/min each, K 14.77 L/min/bar^0.5 at 3.5 bar (1.03 gpm/psi^0.5), water 180.3 m3 for 60 min with hoses 1900 L/min', [ux({}).Q, ux({}).qn, ux({}).K, ux({}).Kus, ux({}).vol, ux({}).gpmft2], [1105.526, 27.6382, 14.7732, 1.0259, 180.3316, 0.25], 1e-3);
check('direct area input, density limits: exposure of vessels needs at least 10.2; extinguishing or control 8.1 - 20.4; structures 4.1 - 12.2', [ux({shape: 1, A: 50}).A, ux({shape: 1, A: 50}).aEnds, ux({dens: 9}).inRange, ux({purp: 1, dens: 8.1}).inRange, ux({purp: 1, dens: 20.5}).inRange, ux({purp: 2, dens: 4}).inRange, ux({purp: 2, dens: 12.2}).inRange], [50, 0, false, true, false, false, true]);
check('Table 9.44 outdoor fuel with flash point 37 - 60 C, 100 m2: 0.10 gpm/ft2 = 4.07 L/min/m2, solution 407.5 L/min, 3 % concentrate 12.22 L/min, 30 min: 12.2 m3 and 366.7 L of concentrate plus 10 % = 403.4 L', [ux({mode: 1}).dens, ux({mode: 1}).Q, ux({mode: 1}).conc, ux({mode: 1}).mins, ux({mode: 1}).sol, ux({mode: 1}).concBase, ux({mode: 1}).concVol], [4.0746, 407.46, 12.2238, 30, 12.2238, 366.714, 403.3854], 1e-3);
check('Table 9.44 rows: crude indoor 0.16 gpm/ft2 15 % 55 min; aircraft hangar 0.20 15 % 10 min; spillage 0.10 10 % 15 min; diked area 0.16 10 % 20 min; indoor tank rows need a liquid surface above 37.2 m2', [3, 4, 5, 6, 7, 8].map(k => ux({mode: 1, row: k}).imb + '/' + ux({mode: 1, row: k}).mins).join(' '), '10/30 10/55 15/55 15/10 10/15 10/20');
check('indoor tank condition: a 30 m2 liquid surface is outside the rows (flag), 50 m2 inside; outdoor rows are not flagged', [ux({mode: 1, row: 3, A: 30}).smallTank, ux({mode: 1, row: 3, A: 50}).smallTank, ux({mode: 1, row: 0, A: 30}).smallTank, ux({mode: 1, row: 3}).indoor, ux({mode: 1, row: 0}).indoor], [true, false, false, true, false]);
check('Table 9.45 palletized small containers: 0.30 gpm/ft2 = 12.22 L/min/m2 over 3000 ft2 (278.7 m2): 3406.9 L/min, 30 sprinklers of at most 100 ft2 (9.29 m2) with 113.6 L/min each, concentrate 102.2 L/min, 15 min and 10 % extra: 1686.4 L; 60 min water 204.4 m3', [u2({row: 3}).A, u2({row: 3}).Q, u2({row: 3}).nSpr, u2({row: 3}).qSpr, u2({row: 3}).conc, u2({row: 3}).concVol, u2({row: 3}).vol60], [278.709, 3406.8831, 30, 113.5628, 102.2065, 1686.407, 204.413], 0.01);
check('closed-sprinkler system raises the area to the 476 m2 minimum (44.5.7); open systems keep the table; an override above the table is kept; an override below 476 is raised for closed systems', [u2({row: 1, closed: true}).A, u2({row: 1}).A, ux({mode: 2, row: 1, A: 600}).A, ux({mode: 2, row: 1, A: 600, closed: true}).A, ux({mode: 2, row: 1, A: 300, closed: true}).A, u2({row: 0}).A], [476, 278.709, 600, 600, 476, 185.806], 1e-3);
check('Table 9.45 other rows: spray application 0.40 gpm/ft2 over 5000 ft2, diesel generator 0.30 over 5000 ft2 and 10 min, powder coating 0.20 with blank cells assumed 10 % and 15 min (flag)', [u2({row: 4}).dens, u2({row: 4}).A, u2({row: 6}).mins, u2({row: 6}).imb, u2({row: 5}).blank, u2({row: 5}).imb, u2({row: 5}).mins, u2({row: 6}).blank, u2({row: 0}).mins, u2({row: 2}).A], [16.2984, 464.515, 10, 10, true, 10, 15, false, 15, 185.806], 1e-3);
check('concentrate below 3 % is flagged (44.5.4)', [ux({mode: 1, pct: 2.9}).pctOk, ux({mode: 1, pct: 3}).pctOk, ux({mode: 2, pct: 6}).pctOk], [false, true, true]);
for (let k = 0; k < 3; k++) { w.renderCalc('uaespray'); w.document.getElementById('ux_m').value = String(k); w.calcResult('uaespray'); }
w.renderCalc('uaespray'); w.calcResult('uaespray');
let tt = txt(w, 'ux_results');
check('the page opens with the tank area, the K factor and the 🔴 note', [tt.includes('المساحة الكلية للسطح'), tt.includes('معامل K المطلوب'), tt.includes('🔴'), w.document.getElementById('ux_g0').style.display, w.document.getElementById('ux_g2').style.display], [true, true, true, '', 'none']);
w.document.getElementById('ux_m').value = '2'; w.calcResult('uaespray'); tt = txt(w, 'ux_results');
check('the foam sprinkler page shows the sprinkler count and the 60 min water supply', [tt.includes('عدد الرشاشات الأدنى'), tt.includes('ماء الإمداد (60 min)'), tt.includes('كمية المركز')], [true, true, true]);
check('other reference codes open it too', others('uaespray', 'ux_results'), [true, true, true]);
}
// ---------- part 149: UAE Fire and Life Safety Code chapter 9 gas suppression (`uaegas`: 45 - 47, Tables 9.46 - 9.49) ----------
{
w = boot('ae'); doc = w.document;
const uy = o => w.eval('uyCalc(' + JSON.stringify(Object.assign({mode: 0, V: 100, meas: 0, g: 0, T: 20, C: 40.5, t: 60, mat: 0, col: 0, cyl: 67.5, ch: 0, m: 0, O2: 15, h: 4, L: 4, W: 3, H: 2.5, open: 0, tank: 5.7, temp: 25}, o)) + ')');
check('Table 9.46 n50 at the printed volumes: 1 m3 5.0, 100 1.5, 1000 1.0, 10 000 0.1, 50 000 0.05, 500 000 0.01', [1, 100, 1000, 10000, 50000, 500000].map(V => uy({V}).n50), [5, 1.5, 1, 0.1, 0.05, 0.01], 1e-9);
check('linear interpolation between volumes (45.9.9.3): 550 m3 1.25, 5000 m3 0.6, 30 000 m3 0.075; outside the table the end values and flags', [uy({V: 550}).n50, uy({V: 5000}).n50, uy({V: 30000}).n50, uy({V: 0.5}).n50, uy({V: 0.5}).under, uy({V: 600000}).n50, uy({V: 600000}).over], [1.25, 0.6, 0.075, 5, true, 0.01, true], 1e-9);
check('allowed leakage at 50 Pa = n50 x volume (1000 m3: 1.0 x 1000 = 1000 m3/h); a measured value up to the allowed passes', [uy({V: 1000}).qmax, uy({V: 1000, meas: 0.9}).ok, uy({V: 1000, meas: 1.0}).ok, uy({V: 1000, meas: 1.2}).ok, uy({V: 1000}).ok], [1000, true, true, false, null], 1e-9);
check('nitrogen IG-100, 100 m3, 40.5 %: gas 51.92 m3 (ln(100/59.5)), density 1.165 -> 60.49 kg, residual oxygen 12.44 %; the same at 30 C has density 1.165 x 293.15 / 303.15', [uy({mode: 1}).vol, uy({mode: 1}).mass, uy({mode: 1}).O2, uy({mode: 1, T: 30}).rho, uy({mode: 1}).ratio], [51.9194, 60.4861, 12.4355, 1.12659, 0.519194], 1e-3);
check('inert gas ranges: nitrogen 40 - 41 %, argon 35 - 45 %, IG-541 33 - 35 %, IG-55 31 - 37 %; discharge at most 60 s', [uy({mode: 1, C: 39.9}).inRange, uy({mode: 1, C: 41}).inRange, uy({mode: 1, g: 1, C: 45}).inRange, uy({mode: 1, g: 2, C: 35.1}).inRange, uy({mode: 1, g: 3, C: 31}).inRange, uy({mode: 1, t: 60}).tOk, uy({mode: 1, t: 61}).tOk, uy({mode: 1, g: 1}).rho], [false, true, true, false, true, true, false, 1.662]);
check('CO2 paper (KB 2.00), 100 m3 within 4 min: 57 % -> 84.4 m3 of gas, 154.4 kg at 20 C, residual oxygen 9.03 %; 4 cylinders of 67.5 L at 0.75 kg/L (50.625 kg); leakage alarm at 90 % = 139 kg; 2.57 kg/s over 60 s', [uy({mode: 2}).C, uy({mode: 2}).vol, uy({mode: 2}).mass, uy({mode: 2}).O2, uy({mode: 2}).cap, uy({mode: 2}).n, uy({mode: 2}).leak, uy({mode: 2}).rate, uy({mode: 2}).rho], [57, 84.397, 154.4084, 9.03, 50.625, 4, 138.9676, 2.5735, 1.82955], 1e-3);
check('within 1 minute every material is 34 % and 13.8 % oxygen (printed 13.80); polystyrene and polyurethane have no 4 min value so 34 % is taken and flagged; KB 1 -> 34 %', [uy({mode: 2, col: 1}).C, uy({mode: 2, mat: 5, col: 1}).C, uy({mode: 2, mat: 2}).C, uy({mode: 2, mat: 2}).fallback, uy({mode: 2, mat: 3}).C, uy({mode: 2, mat: 0}).fallback, uy({mode: 2, mat: 2}).KB], [34, 34, 34, true, 34, false, 1]);
check('Table 9.48 rows: electrical switch rooms 1.20 / 40 %, data processing 2.25 / 61 %, high rack control room 1.50 / 47 %, cable rooms 1.50 / 47 %, transformers and generators 2.00 / 57 %', [5, 6, 7, 10, 11, 9, 12].map(k => uy({mode: 2, mat: k}).KB + '/' + uy({mode: 2, mat: k}).C).join(' '), '1.2/40 2.25/61 1.5/47 1.5/47 2/57 2/57 2/57');
check('the free-efflux concentration of KB x 34 % reproduces the printed 4 min column within rounding: KB 1.2 -> 39.3 (40), 1.5 -> 46.4 (47), 2.0 -> 56.4 (57), 2.25 -> 60.7 (61)', [5, 7, 0, 1].map(k => +uy({mode: 2, mat: k}).kbC.toFixed(1)), [39.3, 46.4, 56.4, 60.7]);
check('cylinder rules: not more than 67.5 L and 0.75 kg/L; a 80 L request is limited to 67.5 L and flagged; a 40 L cylinder (30 kg) gives 6 cylinders for 154.4 kg', [uy({mode: 2, cyl: 80}).cv, uy({mode: 2, cyl: 80}).cvOk, uy({mode: 2, cyl: 40}).cap, uy({mode: 2, cyl: 40}).n, uy({mode: 2, cyl: 67.5}).cvOk, uy({mode: 2, t: 61}).tOk], [67.5, false, 30, 6, true, false]);
check('chemical gases: HFC-227ea 6.25 - 9 %, HFC-125 8 - 10 %, Novec 1230 range not printed; discharge at most 10 s', [uy({mode: 3, C: 7}).inRange, uy({mode: 3, C: 6.2}).inRange, uy({mode: 3, ch: 1, C: 9}).inRange, uy({mode: 3, ch: 1, C: 10.1}).inRange, uy({mode: 3, ch: 2, C: 5}).inRange, uy({mode: 3, t: 10}).tOk, uy({mode: 3, t: 11}).tOk, uy({mode: 3, m: 50, t: 10}).rate], [true, false, true, false, null, true, false, 5]);
check('oxygen reduction to 15 % in 500 m3: nitrogen 165.85 m3 (33.17 % of the room); the standard application 13 - 17 %, the body 12 - 20.95 %; 4 h stay then a 30 min break (9 h needs 2 breaks)', [uy({mode: 4, V: 500}).vol, uy({mode: 4}).pct, uy({mode: 4, O2: 12.9}).std, uy({mode: 4, O2: 17}).std, uy({mode: 4, O2: 11.9}).human, uy({mode: 4, O2: 12}).human, uy({mode: 4, h: 4}).tOk, uy({mode: 4, h: 4.1}).tOk, uy({mode: 4, h: 9}).breaks, uy({mode: 4, h: 4}).breaks], [165.849, 33.1699, false, true, false, true, true, false, 2, 0], 1e-3);
check('dry chemical enclosure 4 x 3 x 2.5 m: surface 59 m2, openings up to 15 % = 8.85 m2; 9 m2 is 15.3 % so a local application is needed; wet chemical tank 5.7 - 11.4 L, container at most 19 L, 0 - 54 C', [uy({mode: 5}).S, uy({mode: 5}).maxOpen, uy({mode: 5, open: 8.85}).dryOk, uy({mode: 5, open: 9}).dryOk, +uy({mode: 5, open: 9}).ratio.toFixed(1), uy({mode: 5, tank: 5.6}).tankOk, uy({mode: 5, tank: 11.4}).tankOk, uy({mode: 5, tank: 11.5}).tankOk, uy({mode: 5, tank: 20}).contOk, uy({mode: 5, temp: 55}).tempOk, uy({mode: 5, temp: 0}).tempOk], [59, 8.85, true, false, 15.3, false, true, false, false, false, true], 1e-9);
for (let k = 0; k < 6; k++) { w.renderCalc('uaegas'); w.document.getElementById('uy_m').value = String(k); w.calcResult('uaegas'); }
w.renderCalc('uaegas'); w.calcResult('uaegas');
let tt = txt(w, 'uy_results');
check('the page opens with the n50 allowed value and the 🔴 note', [tt.includes('n50 المسموح'), tt.includes('أقصى تسرب عند 50 Pa'), tt.includes('🔴'), w.document.getElementById('uy_g0').style.display, w.document.getElementById('uy_g5').style.display], [true, true, true, '', 'none']);
w.document.getElementById('uy_m').value = '2'; w.calcResult('uaegas'); tt = txt(w, 'uy_results');
check('the CO2 page shows the KB factor, the cylinders and the leakage alarm', [tt.includes('معامل KB'), tt.includes('عدد الأسطوانات'), tt.includes('إنذار نقص التسرب')], [true, true, true]);
check('other reference codes open it too', others('uaegas', 'uy_results'), [true, true, true]);
}
// ---------- part 150: UAE Fire and Life Safety Code chapter 9 sprinkler installation (`uaeinst`: 17 - 41, Tables 9.34 - 9.43) ----------
{
w = boot('ae'); doc = w.document;
const ui = o => w.eval('uiCalc(' + JSON.stringify(Object.assign({mode: 0, type: 0, S: 3.6, W: 1.8, roomW: 3, dz: 150, sto: 600, esfr: false, kind: 0, A: 600, B: 100, d: 150, src: 0, cls: 0, depth: 500, step: 0, sky: false, pipe: 3, L: 30, N: 500, types: 1, Pw: 10, Pmax: 12, gd: 20, gh: 4, fd: 15, fh: 800, zc: 600}, o)) + ')');
check('standard upright / pendent / concealed: spacing 1.8 - 4.5 m; wall 0.10 m to the smaller of 2.25 m and half the spacing; deflector 25 - 300 mm below the ceiling; 1.5 m x 1.5 m would be too close', [ui({S: 1.8}).sOk, ui({S: 1.79}).sOk, ui({S: 4.5}).sOk, ui({S: 4.6}).sOk, ui({S: 3.6}).wMax, ui({S: 4.5}).wMax, ui({S: 6}).wMax, ui({W: 0.09}).wOk, ui({W: 1.8}).wOk, ui({W: 1.81}).wOk, ui({dz: 25}).dOk, ui({dz: 300}).dOk, ui({dz: 301}).dOk, ui({dz: 24}).dOk], [true, false, true, false, 1.8, 2.25, 2.25, false, true, false, true, true, false, false]);
check('sidewall light hazard: 4.25 m and a room width of 3.6 m, wall 2.125 m or half the spacing, deflector 100 - 150 mm; ordinary hazard 3.0 m, room 3.0 m, wall 1.5 m', [ui({type: 3, S: 4.25}).sOk, ui({type: 3, S: 4.3}).sOk, ui({type: 3, roomW: 3.6}).roomOk, ui({type: 3, roomW: 3.7}).roomOk, ui({type: 3, S: 4.25}).wMax, ui({type: 3, dz: 100}).dOk, ui({type: 3, dz: 160}).dOk, ui({type: 4, S: 3}).sOk, ui({type: 4, S: 3.1}).sOk, ui({type: 4, roomW: 3}).roomOk, ui({type: 4, S: 3}).wMax, ui({type: 4, S: 4}).wMax, ui({type: 0}).roomOk], [true, false, true, false, 2.125, true, false, true, false, true, 1.5, 1.5, null]);
check('concealed has no printed deflector range (flush when under obstructed construction); storage clearance 500 mm and 1000 mm for ESFR / ELO; the covered area is the square of the spacing', [ui({type: 2}).dOk, ui({sto: 500}).stoOk, ui({sto: 499}).stoOk, ui({sto: 900, esfr: true}).stoOk, ui({sto: 1000, esfr: true}).stoOk, +ui({S: 3.6}).cover.toFixed(2), ui({type: 3}).cover], [null, true, false, false, true, 12.96, null]);
check('Tables 9.34 - 9.36: side distance 250 mm -> 0; 300 -> 65; 449 -> 65; 450 -> 90; 1190 -> 305; 1650 -> 508; 1799 -> 508; 1800 and more outside the table', [250, 300, 449, 450, 1190, 1650, 1799, 1800].map(A => ui({mode: 1, kind: 2, A}).req), [0, 65, 65, 90, 305, 508, 508, null]);
check('9.34 verdicts: 600 mm away with the deflector 100 mm above the bottom -> 140 permitted, ok; 150 mm -> not ok; beyond 1800 mm no printed limit', [ui({mode: 1, kind: 2, A: 600, B: 100}).ok, ui({mode: 1, kind: 2, A: 600, B: 150}).ok, ui({mode: 1, kind: 2, A: 2000, B: 900}).ok, ui({mode: 1, kind: 2, A: 2000, B: 900}).out], [true, false, true, true]);
check('Table 9.37 sidewall at a distance: below 1200 mm not allowed; 1200 -> 25; 1499 -> 25; 1500 -> 50; 2400 -> 275; 2550 and more -> 350', [1100, 1200, 1499, 1500, 1800, 2400, 2549, 2550, 3000].map(A => ui({mode: 1, kind: 4, A}).req), [null, 25, 25, 50, 100, 275, 275, 350, 350]);
check('9.37 flags: 1100 mm not allowed; B within the row ok', [ui({mode: 1, kind: 4, A: 1100, B: 0}).notAllowed, ui({mode: 1, kind: 4, A: 1100, B: 0}).ok, ui({mode: 1, kind: 4, A: 1300, B: 25}).ok, ui({mode: 1, kind: 4, A: 1300, B: 26}).ok], [true, false, true, false]);
check('Table 9.38 along the wall: 100 mm -> 25; 150 -> 50; 600 -> 145; 2100 -> 440; 2250 and more outside', [100, 150, 600, 1190, 2100, 2249, 2250].map(A => ui({mode: 1, kind: 3, A}).req), [25, 50, 145, 235, 440, 440, null]);
check('Tables 9.39 and 9.40 vertical obstructions: 150 mm -> 75 below the deflector, 151 -> 100, 305 -> 150, 455 -> 240, 610 -> 315, 760 -> 390, 800 -> 455', [150, 151, 230, 305, 380, 455, 610, 760, 800].map(A => ui({mode: 1, kind: 1, A}).req), [75, 100, 100, 150, 200, 240, 315, 390, 455]);
check('three times the obstruction dimension, at most 609 mm: a 150 mm pipe -> 450 mm; a 300 mm beam -> 609 mm; the actual distance compared', [ui({mode: 1, kind: 0, d: 150}).req, ui({mode: 1, kind: 0, d: 300}).req, ui({mode: 1, kind: 0, d: 150, A: 450}).ok, ui({mode: 1, kind: 0, d: 150, A: 449}).ok, ui({mode: 1, kind: 0, d: 300, A: 609}).ok], [450, 609, true, false, true]);
check('wide horizontal obstructions: over 1.2 m needs sprinklers underneath; up to 1.2 m the sprinklers beside it at no more than 2.25 m from the centre line', [ui({mode: 1, kind: 5, d: 1200, A: 2250}).ok, ui({mode: 1, kind: 5, d: 1201}).under, ui({mode: 1, kind: 5, d: 1000, A: 2300}).ok, ui({mode: 1, kind: 5, d: 1201, A: 100}).ok], [true, true, false, false]);
check('Table 9.41 heat sources (ordinary / intermediate): 0 - 250 W lights 300 / 200; above 250 W 450 / 300; heater 300 / 150; wall diffuser front 1000 / 500; side of diffuser 750 / 450; hot pipes 500 / 300', [0, 1, 2, 3, 4, 5].map(k => ui({mode: 2, src: k, cls: 0}).req + '/' + ui({mode: 2, src: k, cls: 1}).req).join(' '), '300/200 450/300 300/150 1000/500 750/450 500/300');
check('heat source verdict and concealed space: 300 mm ok for an ordinary sprinkler near a light, 299 not; 200 mm ok for intermediate; the concealed space depth 400 mm; a ceiling step of 900 mm is flat, 901 mm makes a wall', [ui({mode: 2, A: 300}).ok, ui({mode: 2, A: 299}).ok, ui({mode: 2, cls: 1, A: 200}).ok, ui({mode: 2, depth: 400}).conc, ui({mode: 2, depth: 399}).conc, ui({mode: 2, step: 900}).step, ui({mode: 2, step: 901}).step], [true, false, true, true, false, false, true]);
check('hangers (Table 9.43): 25 - 50 mm 2 m and 10 mm rods, 65 - 100 mm 2.5 m and 12.5 mm, 150 - 200 mm 3 m and 16 mm', [0, 3, 4, 6, 7, 8].map(k => ui({mode: 3, pipe: k}).s + '/' + ui({mode: 3, pipe: k}).rod).join(' '), '2/10 2/10 2.5/12.5 2.5/12.5 3/16 3/16');
check('hanger load for a 50 mm Sch 40 pipe: 5.44 + 2.16 = 7.60 kg/m; 5 x 7.60 x 2 m + 115 = 191 kg; 100 mm: 24.28 kg/m; 5 x 24.28 x 2.5 + 115 = 418.5 kg = 4.10 kN; 30 m run in 2 m spans = 15', [ui({mode: 3}).w, ui({mode: 3}).load, ui({mode: 3, pipe: 6}).w, ui({mode: 3, pipe: 6}).load, ui({mode: 3, pipe: 6}).kN, ui({mode: 3}).spans, ui({mode: 3, L: 30.1}).spans, ui({mode: 3, L: 0}).spans], [7.6048, 191.0475, 24.283, 418.5374, 4.1044, 15, 16, 1], 1e-3);
check('spare sprinklers (Table 9.42): below 300 -> 6; 300 - 1000 -> 12; above 1000 -> 24; at least 6 of each type: 3 types need 18', [299, 300, 1000, 1001].map(N => ui({mode: 3, N}).spares), [6, 12, 12, 24]);
check('spare stock with several types: 3 types and 200 sprinklers -> 18; 5 types and 2000 -> 30', [ui({mode: 3, N: 200, types: 3}).spares, ui({mode: 3, N: 2000, types: 5}).spares, ui({mode: 3, N: 2000, types: 2}).spares], [18, 30, 24]);
check('tests: gauge 150 % of the maximum pressure (18 bar for 12 bar); hydrostatic test the greater of 1.5 x working pressure and 16 bar (10 bar -> 16; 12 bar -> 18); 7 readings over 24 h at 4 h', [ui({mode: 4}).gauge, ui({mode: 4}).test, ui({mode: 4, Pw: 12}).test, ui({mode: 4}).reads], [18, 16, 18, 7]);
check('PRV above 12.1 bar and the flushing flow at 3 m/s: 100 mm 1478 L/min (24.6 L/s), 50 mm 389.6 L/min', [ui({mode: 4, Pmax: 12.1}).prv, ui({mode: 4, Pmax: 12.2}).prv, ui({mode: 4, pipe: 6}).flush, ui({mode: 4, pipe: 6}).flowL, ui({mode: 4, pipe: 3}).flush], [false, true, 1478.3388, 24.639, 389.656], 0.01);
check('alarm gong at most 25 m and 6 m above the valve; the inlet within 18 m of the road at 500 - 1200 mm; the zone valve distance 600 mm', [ui({mode: 4, gd: 25, gh: 6}).gongOk, ui({mode: 4, gd: 26}).gongOk, ui({mode: 4, gh: 6.1}).gongOk, ui({mode: 4, fd: 18, fh: 500}).fdcOk, ui({mode: 4, fh: 1201}).fdcOk, ui({mode: 4, fd: 18.1}).fdcOk, ui({mode: 4, zc: 599}).zcvOk, ui({mode: 4, zc: 600}).zcvOk], [true, false, false, true, false, false, false, true]);
for (let k = 0; k < 5; k++) { w.renderCalc('uaeinst'); w.document.getElementById('ui_m').value = String(k); w.calcResult('uaeinst'); }
w.renderCalc('uaeinst'); w.calcResult('uaeinst');
let tt = txt(w, 'ui_results');
check('the page opens with the spacing and wall checks and the 🔴 note', [tt.includes('التباعد بين الرشاشات'), tt.includes('البعد عن الجدار'), tt.includes('🔴'), w.document.getElementById('ui_g0').style.display, w.document.getElementById('ui_g4').style.display], [true, true, true, '', 'none']);
w.document.getElementById('ui_m').value = '3'; w.calcResult('uaeinst'); tt = txt(w, 'ui_results');
check('the supports page shows the rod, the load and the spare count', [tt.includes('قطر قضيب التعليق'), tt.includes('الحمل الأدنى للمعلّق'), tt.includes('الرشاشات الاحتياطية')], [true, true, true]);
check('other reference codes open it too', others('uaeinst', 'ui_results'), [true, true, true]);
}
// ---------- part 151: UAE Fire and Life Safety Code special structures (chapter 18) and chapter 10 ventilation (`uaespec`) ----------
{
w = boot('ae'); doc = w.document;
const ub = o => w.eval('ubCalc(' + JSON.stringify(Object.assign({mode: 0, L: 600, d: 300, kind: 0, occ: 400, mc: 1000, lpg: 2000, gc: 3500, cov: 60, tt: 3, stake: 3050, months: 2, inflated: false, exits: 2, trv: 9, acc: 6, fw: 200, fc: 75, ff: 25, cp: 25, car: 22, tp: 100, ex: 700, ev: 6, wd: 1200, ps: 220, es: 50, fl: 25, tl: 400, encl: true, V: 5000, vh: 6, hh: 30, area: 200, sep: 3000, Vs: 300, Vl: 40, Vf: 60, Q: 5000, multi: false, dd: 0.5, rate: 2, sens: false, inl: 6, pt: 60, stage: 0}, o)) + ')');
const row = (r, k) => r.rows.find(x => x.k === k);
check('road tunnel 600 m: 1 intermediate exit (300 m spacing between portals and exit), 24 signs per side at 25 m, 2 cross-passages at 200 m; 1200 m: 3 exits, 5 cross-passages', [row(ub({}), 'ex').v, row(ub({}), 'sg').v, row(ub({}), 'cp').v, row(ub({L: 1200}), 'ex').v, row(ub({L: 1200}), 'cp').v, row(ub({L: 250}), 'ex').v, row(ub({L: 300}), 'ex').v, row(ub({L: 301}), 'ex').v, row(ub({L: 50}), 'cp').v], [1, 24, 2, 3, 5, 0, 0, 1, 0]);
check('tunnel tiers: over 90 m; 240 m and more with a distance to safety above 120 m; 1000 m and more', [ub({L: 90}).tiers, ub({L: 91, d: 50}).tiers, ub({L: 240, d: 120}).tiers, ub({L: 240, d: 121}).tiers, ub({L: 1000, d: 500}).tiers, ub({L: 999, d: 500}).tiers], [[false, false, false], [true, false, false], [true, false, false], [true, true, false], [true, true, true], [true, true, false]]);
check('membrane structure exits: 2 below 500, 3 from 500 to 1000, 4 above 1000; clearance 915 mm; LPG 1525 mm; combustibles 3050 mm', [499, 500, 1000, 1001].map(occ => row(ub({mode: 1, occ}), 'exits').v), [2, 3, 3, 4]);
check('membrane verdicts: clearance 915 ok, 914 not; LPG 1525 ok, 1524 not; combustibles 3050 ok, 3049 not; 4 h and two blowers for inflated', [row(ub({mode: 1, mc: 915}), 'clr').ok, row(ub({mode: 1, mc: 914}), 'clr').ok, row(ub({mode: 1, lpg: 1525}), 'lpg').ok, row(ub({mode: 1, lpg: 1524}), 'lpg').ok, row(ub({mode: 1, gc: 3050}), 'gc').ok, row(ub({mode: 1, gc: 3049}), 'gc').ok, row(ub({mode: 1, inflated: true}), 'pwr').v, row(ub({mode: 1}), 'pwr').v], [true, false, true, false, true, false, 'نافختان آليتان و4 ساعات', 'غير لازمة']);
check('tents: coverage at most 75 %, 3 m between tents, 3050 mm between stake lines, less than 6 months', [row(ub({mode: 1, kind: 1, cov: 75}), 'cov').ok, row(ub({mode: 1, kind: 1, cov: 76}), 'cov').ok, row(ub({mode: 1, kind: 1, tt: 2.9}), 'gap').ok, row(ub({mode: 1, kind: 1, stake: 3049}), 'stk').ok, row(ub({mode: 1, kind: 1, months: 5}), 'tmp').ok, row(ub({mode: 1, kind: 1, months: 6}), 'tmp').ok, !!row(ub({mode: 1, kind: 1}), 'gc')], [true, false, false, false, true, false, false]);
check('modular units: two exits, doors 3.7 m apart, travel 10.7 m, access 6 m, flame spread 200 / 75 / 25', [row(ub({mode: 2, exits: 1}), 'exits').ok, row(ub({mode: 2, sep: 3.6}), 'sep').ok, row(ub({mode: 2, sep: 3.7}), 'sep').ok, row(ub({mode: 2, trv: 10.8}), 'trv').ok, row(ub({mode: 2, acc: 5.9}), 'acc').ok, row(ub({mode: 2, fw: 201}), 'fsw').ok, row(ub({mode: 2, fc: 76}), 'fsc').ok, row(ub({mode: 2, ff: 26}), 'fsf').ok, row(ub({mode: 2, sep: 4}), 'sep').ok], [false, false, true, false, false, false, false, false, true]);
check('metro and tram station: common path 25 m or a car length (30 m car allows 30), 100 m on the platform, 762 m between exits, 6 min, 1200 mm, 220 N, half the escalator capacity, flame spread 25', [row(ub({mode: 3, cp: 26}), 'cp').ok, row(ub({mode: 3, cp: 28, car: 30}), 'cp').ok, row(ub({mode: 3, cp: 31, car: 30}), 'cp').ok, row(ub({mode: 3, tp: 101}), 'tp').ok, row(ub({mode: 3, ex: 762}), 'ex').ok, row(ub({mode: 3, ex: 763}), 'ex').ok, row(ub({mode: 3, ev: 6.1}), 'ev').ok, row(ub({mode: 3, wd: 1199}), 'wd').ok, row(ub({mode: 3, ps: 221}), 'ps').ok, row(ub({mode: 3, es: 51}), 'es').ok, row(ub({mode: 3, fl: 26}), 'fl').ok], [false, true, false, false, true, false, false, false, false, false, false]);
check('station track ventilation: enclosed trainway above 300 m, underground above 60 m', [ub({mode: 3, tl: 300}).vent, ub({mode: 3, tl: 301}).vent, ub({mode: 3, tl: 60, encl: false}).vent, ub({mode: 3, tl: 61, encl: false}).vent], [false, true, false, true]);
check('robotic car park: 2 air changes of 5000 m3 = 2778 L/s; walkways every 6 m vertically and 30 m horizontally; travel 122 m; within 3000 mm of another use needs 2 hours; offices below 300 m2 need smoke-tight partitions', [Math.round(2 * 5000 / 3.6), row(ub({mode: 4}), 'ach').v, row(ub({mode: 4, vh: 6.1}), 'wv').ok, row(ub({mode: 4, hh: 31}), 'wh').ok, row(ub({mode: 4, trv: 123}), 'trv').ok, row(ub({mode: 4, trv: 122}), 'trv').ok, row(ub({mode: 4, sep: 2999}), 'sep').u.includes('ساعتين'), row(ub({mode: 4, sep: 3000}), 'sep').u.includes('لا يلزم')], [2778, '2778 L/s', false, false, false, true, true, true]);
check('amusement structures: above 45 m2 detection and sprinklers with a class III wet riser; 45 m2 exactly none', [row(ub({mode: 4, kind: 1, area: 46}), 'det').v, row(ub({mode: 4, kind: 1, area: 45}), 'det').v, row(ub({mode: 4, kind: 1, area: 46}), 'spr').v], ['مطلوب', 'غير مطلوب', 'مطلوب']);
check('ventilation rates: stair 4 ACH of 300 m3 = 333 L/s; lobby 10 ACH of 40 m3 = 111 L/s; flammable room 20 ACH of 60 m3 = 333 L/s', [row(ub({mode: 5}), 'stair').v, row(ub({mode: 5}), 'lobby').v, row(ub({mode: 5}), 'flam').v], ['333 L/s', '111 L/s', '333 L/s']);
check('detectors and dampers: supply detector above 944 L/s; return and isolation above 7080 L/s serving more than one floor; damper within 0.6 m; fire damper 1.5 h below 3 h, 3 h from 3 h', [row(ub({mode: 5, Q: 944}), 'sd').v, row(ub({mode: 5, Q: 945}), 'sd').v, row(ub({mode: 5, Q: 7081, multi: true}), 'sr').v, row(ub({mode: 5, Q: 7081}), 'sr').v, row(ub({mode: 5, dd: 0.6}), 'dd').ok, row(ub({mode: 5, dd: 0.61}), 'dd').ok, row(ub({mode: 5, rate: 2.9}), 'fd').v, row(ub({mode: 5, rate: 3}), 'fd').v], ['غير مطلوب', 'مطلوب', 'مطلوب', 'غير مطلوب', true, false, '1.5 ساعة', '3 ساعات']);
check('alarm-initiated fire damper for sensitive buildings or habitable height above 23 m; intake 5 m from the discharge; plenum air 121 C; stages above 93 m2', [row(ub({mode: 5, sens: true}), 'ad').v, row(ub({mode: 5, hh: 23}), 'ad').v, row(ub({mode: 5, hh: 23.1}), 'ad').v, row(ub({mode: 5, inl: 4.9}), 'in').ok, row(ub({mode: 5, inl: 5}), 'in').ok, row(ub({mode: 5, pt: 121}), 'pl').ok, row(ub({mode: 5, pt: 122}), 'pl').ok, row(ub({mode: 5, stage: 93}), 'st').v, row(ub({mode: 5, stage: 94}), 'st').v], ['مطلوب', 'غير مطلوب', 'مطلوب', false, true, true, false, 'غير مطلوب', 'مطلوب']);
for (let k = 0; k < 6; k++) { w.renderCalc('uaespec'); w.document.getElementById('ub_m').value = String(k); w.calcResult('uaespec'); }
w.renderCalc('uaespec'); w.calcResult('uaespec');
let tt = txt(w, 'ub_results');
check('the page opens with the tunnel exits and the 🔴 note', [tt.includes('مخارج الطوارئ المتوسطة'), tt.includes('أكثر من 90 m'), tt.includes('🔴'), w.document.getElementById('ub_g0').style.display, w.document.getElementById('ub_g5').style.display], [true, true, true, '', 'none']);
w.document.getElementById('ub_m').value = '5'; w.calcResult('uaespec'); tt = txt(w, 'ub_results');
check('the ventilation page shows the stair rate and the damper checks', [tt.includes('تهوية الدرج'), tt.includes('بعد مخمد الدخان عن حاجز الدخان'), tt.includes('مراوح سحب الدخان')], [true, true, true]);
check('other reference codes open it too', others('uaespec', 'ub_results'), [true, true, true]);
}
// ---------- part 152: UAE Fire and Life Safety Code multi-tenant warehouses (chapter 13) and the F&EI / TI risk indices (chapter 17) (`uaerisk`) ----------
{
w = boot('ae'); doc = w.document;
const ur = o => w.eval('urCalc(' + JSON.stringify(Object.assign({mode: 0, cfg: 0, spr: false, ca: 400, ga: 1600, sh: 2.5, listA: false, vp: 1, len: 250, per: 120, mix: false, nf: 3, nr: 1, gh: 1.5, nh: 2, tlv: 10}, o)) + ')');
check('Table 13A.1: single storey 232 m2 per compartment and 900 m2 gross without sprinklers, 900 and 4830 with; multi-storey 140 and 900 without, 900 and 3720 with', [ur({}).maxComp, ur({}).maxGross, ur({cfg: 1}).maxComp, ur({cfg: 1}).maxGross, ur({spr: true}).maxComp, ur({spr: true}).maxGross, ur({spr: true, cfg: 1}).maxComp, ur({spr: true, cfg: 1}).maxGross], [232, 900, 140, 900, 900, 4830, 900, 3720]);
check('verdicts: compartment 232 ok and 233 not; 140 ok and 141 not for multi-storey; gross 900 ok, 901 not; storage height 3 m ok and 3.1 not without sprinklers, always ok with sprinklers (NFPA 13)', [ur({ca: 232}).compOk, ur({ca: 233}).compOk, ur({cfg: 1, ca: 140}).compOk, ur({cfg: 1, ca: 141}).compOk, ur({ga: 900}).grossOk, ur({ga: 901}).grossOk, ur({sh: 3}).hOk, ur({sh: 3.1}).hOk, ur({spr: true, sh: 12}).hOk, ur({spr: true}).heightLimit, ur({}).heightLimit], [true, false, true, false, true, false, true, false, true, 'بحسب NFPA 13', '3 m']);
check('sprinkler exemption needs the compartment, the gross area, the 3 m height and a List A commodity together', [ur({ca: 230, ga: 700, sh: 2.9, listA: true}).sprNeeded, ur({ca: 233, ga: 700, sh: 2.9, listA: true}).sprNeeded, ur({ca: 230, ga: 700, sh: 2.9}).sprNeeded, ur({ca: 230, ga: 700, sh: 3.1, listA: true}).sprNeeded, ur({ca: 230, ga: 901, sh: 2.9, listA: true}).sprNeeded, ur({cfg: 1, ca: 140, ga: 600, sh: 2, listA: true}).sprNeeded, ur({cfg: 1, ca: 141, ga: 600, sh: 2, listA: true}).sprNeeded], [false, true, true, true, true, false, true]);
check('Table 13A.2 smoke control by compartment size: up to 230 vents; to 2000 purging; to 4830 purging or engineered; above 4830 engineered', [230, 231, 2000, 2001, 4830, 4831].map(ca => ur({ca}).smoke), [0, 1, 1, 2, 2, 3]);
check('Table 13A.3 vents: 2.5 % within 12 m, 5 % 15 m, 10 % 18 m, 15 % 21 m, 20 % 24 m; a 200 m2 compartment at 5 % needs 10 m2 = 40 vents of 0.25 m2; at 2.5 % 5 m2 = 20 vents', [0, 1, 2, 3, 4].map(k => ur({vp: k}).vent.join('/')).join(' '), '2.5/12 5/15 10/18 15/21 20/24');
check('vent area and count', [ur({ca: 200}).ventArea, ur({ca: 200}).ventN, ur({ca: 200, vp: 0}).ventArea, ur({ca: 200, vp: 0}).ventN, ur({ca: 201, vp: 0}).ventN], [10, 40, 5, 20, 21], 1e-9);
check('hydrants every 100 m along the access road (250 m -> 3, 100 -> 1, 101 -> 2); signs every 30 m along the red line (120 m -> 4, 121 -> 5)', [ur({len: 250}).hydrants, ur({len: 100}).hydrants, ur({len: 101}).hydrants, ur({len: 0}).hydrants, ur({per: 120}).signs, ur({per: 121}).signs], [3, 1, 2, 1, 4, 5]);
check('pump 1000 gpm (3800 L/min) and 2 h = 456 m3; 2000 gpm combined (Figure 13A.3) 7600 L/min and 912 m3', [ur({}).pump, ur({}).tank, +ur({}).gpm.toFixed(1), ur({mix: true}).pump, ur({mix: true}).tank, ur({}).pumpSet.includes('للحنفيات فقط'), ur({spr: true}).pumpSet.includes('للرشاشات'), ur({mix: true}).pumpSet.includes('2000')], [3800, 456, 1003.9, 7600, 912, true, true, true], 1e-6);
check('Table 17.2 material factor: NF 0 / NR 0 = 1; NF 1 / NR 0 = 4; NF 2 / NR 0 = 10; NF 3 / NR 0 = 16; NF 4 / NR 0 = 21; NR 1 14 14 14 16 21; NR 2 24; NR 3 29; NR 4 40', [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [3, 2], [2, 3], [4, 4]].map(a => ur({mode: 1, nf: a[0], nr: a[1], sh: 1}).mf), [1, 4, 10, 16, 21, 14, 14, 14, 16, 21, 24, 29, 40]);
check('F&EI = MF x (1 + GH) x (1 + SH): NF 3 / NR 1, GH 1.5, SH 2 -> 16 x 2.5 x 3 = 120 severe; categories 1 - 45 light, 46 - 60 moderate, 61 - 95 high, 96 and more severe', [ur({mode: 1, sh: 2}).fei, ur({mode: 1, sh: 2}).cat, ur({mode: 1, nf: 2, nr: 0, gh: 1, sh: 1.25}).fei, ur({mode: 1, nf: 2, nr: 0, gh: 1, sh: 1.25}).cat, ur({mode: 1, nf: 2, nr: 0, gh: 1, sh: 1.3}).cat, ur({mode: 1, nf: 2, nr: 0, gh: 2, sh: 1}).cat, ur({mode: 1, nf: 2, nr: 0, gh: 2, sh: 1.1}).cat, ur({mode: 1, nf: 2, nr: 2, gh: 1, sh: 0.9}).cat, ur({mode: 1, nf: 2, nr: 2, gh: 1, sh: 1}).cat], [120, 3, 45, 0, 1, 1, 2, 2, 3], 1e-9);
check('Th from Nh: 0, 50, 125, 250, 325; Ts from the TLV: below 5 -> 125; 5 - 50 -> 75; above 50 -> 50', [0, 1, 2, 3, 4].map(nh => ur({mode: 1, nh}).th).concat([4.9, 5, 50, 51].map(tlv => ur({mode: 1, tlv}).ts)), [0, 50, 125, 250, 325, 125, 75, 75, 50]);
check('TI = (Th + Ts)(1 + GH + SH) / 100: Nh 2, TLV 10, GH 1.5, SH 2 -> 200 x 4.5 / 100 = 9.0 moderate; Nh 3 gives 14.6 high; Nh 0 with TLV above 50 gives 2.25 light', [ur({mode: 1, sh: 2}).ti, ur({mode: 1, sh: 2}).tcat, ur({mode: 1, sh: 2, nh: 3}).ti, ur({mode: 1, sh: 2, nh: 3}).tcat, ur({mode: 1, sh: 2, nh: 0, tlv: 100}).ti, ur({mode: 1, sh: 2, nh: 0, tlv: 100}).tcat], [9, 1, 14.625, 2, 2.25, 0], 1e-9);
for (let k = 0; k < 2; k++) { w.renderCalc('uaerisk'); w.document.getElementById('ur_m').value = String(k); w.calcResult('uaerisk'); }
w.renderCalc('uaerisk'); w.calcResult('uaerisk');
let tt = txt(w, 'ur_results');
check('the page opens with the compartment limit, the pump and the 🔴 note', [tt.includes('أقصى مساحة للحيز المقسَّم'), tt.includes('مضخة الحريق'), tt.includes('🔴'), w.document.getElementById('ur_g0').style.display, w.document.getElementById('ur_g1').style.display], [true, true, true, '', 'none']);
w.document.getElementById('ur_m').value = '1'; w.calcResult('uaerisk'); tt = txt(w, 'ur_results');
check('the index page shows MF, F&EI and TI', [tt.includes('معامل المادة MF'), tt.includes('مؤشر الحريق والانفجار F&EI'), tt.includes('مؤشر السمية TI')], [true, true, true]);
check('other reference codes open it too', others('uaerisk', 'ur_results'), [true, true, true]);
}
// ---------- part 153: UAE Fire and Life Safety Code Table 3.1A door fire ratings (added to `uaeegress`) ----------
{
w = boot('ae'); doc = w.document;
const ud = k => w.eval('ueCalc(' + JSON.stringify({oc: 0, spr: true, area: 3000, seats: 0, bench: 0, extra: 0, nExits: 2, stairW: 0, corrW: 0, diag: 40, sepProvided: 0, de: 0, cp: 0, td: 0, roomArea: 0, riser: 0, tread: 0, head: 0, slope: 0, door: k}) + ').door');
check('Table 3.1A: exit stairs, exit discharge and horizontal exits 90 min, smoke proof, self closing, no latches', [0, 1, 7].map(k => ud(k).slice(1).join('/')), ['90/true/true/false', '90/true/true/false', '90/true/true/false']);
check('exit corridors 60 min smoke proof not self closing; service corridors, service rooms and access panels 60 min with latches allowed; elevator lobbies 60 min smoke proof self closing', [2, 3, 4, 5, 6].map(k => ud(k).slice(1).join('/')), ['60/true/false/false', '60/false/false/true', '60/false/false/true', '60/false/false/true', '60/true/true/false']);
check('labour accommodation rooms 30 min; flats and hotel rooms 60 min with latches; office main entrance 60 min smoke proof self closing and latches allowed', [8, 9, 10, 11].map(k => ud(k).slice(1).join('/')), ['30/false/false/true', '60/false/false/true', '60/false/false/true', '60/true/true/true']);
check('the first row is the default and the table has 12 rows', [ud(0)[0], ud(99)[1], w.eval('UE_DOOR.length')], ['مخارج الدرج — كل الإشغالات', 90, 12]);
w.renderCalc('uaeegress'); w.document.getElementById('ue_dr').value = '8'; w.calcResult('uaeegress');
const t2 = txt(w, 'ue_results');
check('the page shows the door rating and the new select', [t2.includes('تصنيف الباب (الجدول 3.1A)'), t2.includes('30 min'), t2.includes('سكن العمال'), w.document.getElementById('ue_dr').options.length], [true, true, true, 12]);
}
// ---------- part 154: UAE Fire and Life Safety Code chapter 12 fire safety during construction, alteration and demolition (`uaecons`) ----------
{
w = boot('ae'); doc = w.document;
const spec = JSON.parse(w.eval('JSON.stringify(UO_SPEC)'));
const base = m => { const o = {mode: m, over: 30, cab: false, cap: 18, nc: 3, wk: 5, insul: false, H: 20, fl: 6, top: 5, dead: 30, n38: 2, n64: 0, sw: 1, so: 45, spr: false}; spec[m].forEach(s => { o[s[0]] = s[7]; }); return o; };
const uo = (m, p) => w.eval('uoCalc(' + JSON.stringify(Object.assign(base(m), p || {})) + ')');
const row = (r, k) => r.rows.find(x => x.k === k);
const okOf = (m, k, val) => row(uo(m, {[k]: val}), k).ok;
check('with the default compliant values every row passes in all four modes', [0, 1, 2, 3].map(m => uo(m).rows.every(x => x.ok !== false)), [true, true, true, true]);
check('hot work: Class I and II liquids 227 L; Thermit shed 15 m; extinguisher 3 - 15 m; combustibles 3 m from cylinders; LPG heater 1.8 m; blower 6 m; hose 1.8 m; fire watch 30 min; 24 h notice', [okOf(0, 'liq', 227), okOf(0, 'liq', 228), okOf(0, 'ther', 15), okOf(0, 'ther', 14.9), okOf(0, 'ext', 3), okOf(0, 'ext', 2.9), okOf(0, 'ext', 15), okOf(0, 'ext', 15.1), okOf(0, 'comb', 3), okOf(0, 'comb', 2.9), okOf(0, 'heat', 1.8), okOf(0, 'heat', 1.7), okOf(0, 'blow', 6), okOf(0, 'blow', 5.9), okOf(0, 'hose', 1.8), okOf(0, 'hose', 1.9), okOf(0, 'watch', 30), okOf(0, 'watch', 29), okOf(0, 'notice', 24), okOf(0, 'notice', 23)], [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]);
check('overnight flammable liquids: 10 gal (37.85 L) inside or within 15 m unless stored in an approved cabinet; LPG in an occupied building: containers of 5 gal (18.93 L) water capacity at most and not more than the workers', [row(uo(0, {over: 37.85}), 'over').ok, row(uo(0, {over: 38}), 'over').ok, row(uo(0, {over: 200, cab: true}), 'over').ok, row(uo(0, {cap: 18.9}), 'lpgocc').ok, row(uo(0, {cap: 19}), 'lpgocc').ok, row(uo(0, {nc: 5}), 'lpgocc').ok, row(uo(0, {nc: 6}), 'lpgocc').ok], [true, false, true, true, false, true, false]);
check('heaters and kettles: connectors 460 mm, heaters 0.9 m, asphalt kettle 6.1 m, attendant 30 m, extinguisher 9.1 m; roof kettle attendant 7.6 m, extinguisher 1.5 - 7.6 m, torch extinguisher 6.1 m, kettle 3 m from exits, lid 2 mm', [okOf(1, 'chim', 460), okOf(1, 'chim', 459), okOf(1, 'htr', 0.9), okOf(1, 'htr', 0.8), okOf(1, 'kett', 6.1), okOf(1, 'kett', 6), okOf(1, 'att', 30), okOf(1, 'att', 31), okOf(1, 'kext', 9.1), okOf(1, 'kext', 9.2), okOf(1, 'ratt', 7.6), okOf(1, 'ratt', 7.7), okOf(1, 'rext', 1.5), okOf(1, 'rext', 1.4), okOf(1, 'rext', 7.7), okOf(1, 'text', 6.1), okOf(1, 'text', 6.2), okOf(1, 'kex', 3), okOf(1, 'kex', 2.9), okOf(1, 'lid', 2), okOf(1, 'lid', 1.9)], [true, false, true, false, true, false, true, false, true, false, true, false, true, false, false, true, false, true, false, true, false]);
check('storage and vehicles: materials 6 m, yard 9 m, vehicles 6.1 m, fuel container 3 m (0.6 m insulated), wiring fastened at 3 m', [okOf(1, 'stor', 6), okOf(1, 'stor', 5.9), okOf(1, 'yard', 9), okOf(1, 'yard', 8.9), okOf(1, 'veh', 6.1), okOf(1, 'veh', 6), okOf(1, 'fuel', 3), okOf(1, 'fuel', 2), row(uo(1, {fuel: 0.6, insul: true}), 'fuel').ok, row(uo(1, {fuel: 0.5, insul: true}), 'fuel').ok, okOf(1, 'wire', 3), okOf(1, 'wire', 3.1)], [true, false, true, false, true, false, true, false, true, false, true, false]);
check('site protection: extinguisher 23 m and 1.5 m high; 1893 L/min water; access road 6.1 m wide, 4.5 m clear, within 46 m; two exit stairs', [okOf(2, 'xt', 23), okOf(2, 'xt', 24), okOf(2, 'mnt', 1.5), okOf(2, 'mnt', 1.6), okOf(2, 'wat', 1893), okOf(2, 'wat', 1800), okOf(2, 'rdw', 6.1), okOf(2, 'rdw', 6), okOf(2, 'rcl', 4.5), okOf(2, 'rcl', 4.4), okOf(2, 'rea', 46), okOf(2, 'rea', 47), okOf(2, 'stairs', 2), okOf(2, 'stairs', 1)], [true, false, true, false, true, false, true, false, true, false, true, false, true, false]);
check('standpipe when the height exceeds 10.7 m; the top hose outlet at most one floor below the highest decked floor; a dead end road over 46 m needs a turnaround', [row(uo(2, {H: 10.7}), 'sp').v, row(uo(2, {H: 10.8}), 'sp').v, row(uo(2, {fl: 6, top: 5}), 'top').ok, row(uo(2, {fl: 6, top: 4}), 'top').ok, row(uo(2, {dead: 46}), 'dead').u.includes('لا تلزم'), row(uo(2, {dead: 47}), 'dead').u.includes('ساحة دوران')], ['غير مطلوب', 'مطلوب', true, false, true, true]);
check('underground and demolition: check-in 7.6 m, conveyors 91 m, Class I liquids 30 m from the portal, storage 30 m, water fitting 46 m, grounding 300 m, drills 6 months, two communication means', [okOf(3, 'chk', 7.6), okOf(3, 'chk', 7.7), okOf(3, 'cnv', 91), okOf(3, 'cnv', 92), okOf(3, 'uex', 91), okOf(3, 'uex', 92), okOf(3, 'cl1', 30), okOf(3, 'cl1', 29), okOf(3, 'sto', 30), okOf(3, 'sto', 29), okOf(3, 'wfit', 46), okOf(3, 'wfit', 47), okOf(3, 'grd', 300), okOf(3, 'grd', 301), okOf(3, 'drl', 6), okOf(3, 'drl', 7), okOf(3, 'com', 2), okOf(3, 'com', 1)], [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false]);
check('demolition by explosives: two 38 mm hoses or one 64 mm; temporary separation wall 1 h with 45 min openings unless sprinklered', [row(uo(3, {n38: 2, n64: 0}), 'hose').ok, row(uo(3, {n38: 1, n64: 0}), 'hose').ok, row(uo(3, {n38: 0, n64: 1}), 'hose').ok, row(uo(3, {sw: 1, so: 45}), 'sepw').ok, row(uo(3, {sw: 0.5, so: 45}), 'sepw').ok, row(uo(3, {sw: 1, so: 30}), 'sepw').ok, row(uo(3, {sw: 0, so: 0, spr: true}), 'sepw').ok], [true, false, true, true, false, false, true]);
for (let k = 0; k < 4; k++) { w.renderCalc('uaecons'); w.document.getElementById('uo_m').value = String(k); w.calcResult('uaecons'); }
w.renderCalc('uaecons'); w.calcResult('uaecons');
let tt = txt(w, 'uo_results');
check('the page opens with the liquids and Thermit rows and the 🔴 note', [tt.includes('سوائل الصنف I وII'), tt.includes('مخزن مواد الثرميت'), tt.includes('🔴'), w.document.getElementById('uo_g0').style.display, w.document.getElementById('uo_g3').style.display], [true, true, true, '', 'none']);
w.document.getElementById('uo_m').value = '2'; w.calcResult('uaecons'); tt = txt(w, 'uo_results');
check('the protection page shows the standpipe and the access road', [tt.includes('صاعد رطب للمبنى تحت الإنشاء'), tt.includes('عرض طريق وصول الدفاع المدني'), tt.includes('أعلى مخرج خرطوم')], [true, true, true]);
check('other reference codes open it too', others('uaecons', 'uo_results'), [true, true, true]);
}
// ---------- part 155: NFPA 15 water spray fixed systems (`nfpa15`: design rates, vessels, racks, transformers, nozzles) ----------
{
w = boot('ae'); doc = w.document;
const n15 = o => w.eval('n15Calc(' + JSON.stringify(Object.assign({mode: 0, h: 0, dens: 0, A: 538.2, shape: 1, D: 3, L: 10, skirt: 0, lv: 3, rl: 98.4, rw: 3.94, W: 2.5, H: 3.5, bottom: false, ground: 60, n: 12, P: 2.5, sp: 2.5, Q: 1200, C: 120, Lp: 30}, o)) + ')');
check('rates: extinguishment range 0.15 - 0.50 gpm/ft2 (6.1 - 20.4 L/min/m2), cable trays 0.15, conveyors 0.25, control of burning 0.50, pumps 0.50, pool fires 0.30, vessels 0.25, steel 0.10 and 0.25, piping 0.15, cable spill 0.30, flame shield 0.15, transformers 0.25 and 0.15', [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(h => n15({h}).minDens), [0.15, 0.15, 0.25, 0.25, 0.5, 0.5, 0.3, 0.25, 0.25, 0.1, 0.25, 0.15, 0.3, 0.15, 0.25, 0.15]);
check('50 m2 at the default 0.15 gpm/ft2 = 538.2 ft2 x 0.15 = 80.7 gpm = 305.6 L/min; plus 250 gpm of hose = 330.7 gpm; rate in L/min/m2: 0.15 x 40.746 = 6.11; a design density of 0.12 on the extinguishment row fails', [n15({}).Q, n15({}).lpm, n15({}).total, n15({}).dL, n15({dens: 0.12}).densOk, n15({dens: 0.5}).rangeOk, n15({dens: 0.55}).rangeOk, n15({h: 4}).rangeOk], [80.73, 305.6, 330.73, 6.11, false, true, false, true], 0.05);
check('control of burning 0.50 gpm/ft2 over 100 ft2 = 50 gpm; a rate below the clause minimum fails; hose streams 946 L/min', [n15({h: 4, A: 100}).Q, n15({h: 4, A: 100, dens: 0.4}).densOk, n15({h: 4, A: 100, dens: 0.5}).densOk, n15({}).hose], [50, false, true, 946]);
check('a horizontal vessel D 3 m L 10 m: shell 94.25 + ends 14.14 = 108.38 m2 = 1166.6 ft2 x 0.25 = 291.7 gpm = 1104 L/min; a sphere of 3 m 28.27 m2; a skirt area is added', [+n15({mode: 1}).A.toFixed(2), +n15({mode: 1}).Q.toFixed(1), +(n15({mode: 1}).Q * 3.78541).toFixed(0), +n15({mode: 1, shape: 2}).A.toFixed(2), +n15({mode: 1, skirt: 5}).Q.toFixed(1), n15({mode: 1, dens: 0.2}).densOk, n15({mode: 1, shape: 0}).note.includes('7.4.2.1')], [108.38, 291.7, 1104, 28.27, 305.1, false, true], 0.05);
check('rack Table 7.4.3.7.3: 1 level 0.25; 2 levels 0.20 and 0.15 all levels; 3 - 5 levels 0.20 and 0.15 alternate; 6 or more 0.20 and 0.10 alternate', [1, 2, 3, 5, 6, 8].map(lv => n15({mode: 2, lv}).k.join('/')), ['0.25//all', '0.2/0.15/all', '0.2/0.15/alt', '0.2/0.15/alt', '0.2/0.1/alt', '0.2/0.1/alt']);
check('rack of 30 m x 1.2 m = 98.43 x 3.937 = 387.5 ft2: 3 levels: lowest 0.20 x 387.5 = 77.5 gpm, one upper level (alternate, the top) 0.15 x 387.5 = 58.1 gpm = 135.6 gpm; 2 levels both: 77.5 + 58.1; 1 level 96.9 gpm; 6 levels: 3 upper at 0.10 = 116.3', [n15({mode: 2, rl: 98.425, rw: 3.937}).upN, +n15({mode: 2, rl: 98.425, rw: 3.937}).Q.toFixed(1), n15({mode: 2, lv: 2, rl: 98.425, rw: 3.937}).upN, +n15({mode: 2, lv: 1, rl: 98.425, rw: 3.937}).Q.toFixed(1), n15({mode: 2, lv: 6, rl: 98.425, rw: 3.937}).upN, +n15({mode: 2, lv: 6, rl: 98.425, rw: 3.937}).Q.toFixed(1), n15({mode: 2, lv: 4, rl: 98.425, rw: 3.937}).upN], [1, 135.6, 1, 96.9, 3, 193.7, 2], 0.1);
check('transformer 4 x 2.5 x 3.5 m: sides 2(14 + 8.75) = 45.5, top 10 = 55.5 m2 = 597.4 ft2 x 0.25 = 149.35 gpm; ground 60 m2 = 645.8 ft2 x 0.15 = 96.9 gpm; total 246.25 gpm, with the bottom 65.5 m2', [n15({mode: 3, L: 4}).env, +n15({mode: 3, L: 4}).qEnvG.toFixed(1), +n15({mode: 3, L: 4}).qGroundG.toFixed(1), +n15({mode: 3, L: 4}).Q.toFixed(1), n15({mode: 3, L: 4, bottom: true}).env, +n15({mode: 3, L: 4}).total.toFixed(1)], [55.5, 149.3, 96.9, 246.2, 65.5, 496.2], 0.01);
check('nozzles: 50 m2 at 10.2 L/min/m2 = 510 L/min over 12 nozzles = 42.5 L/min each; K = 42.5 / sqrt(2.5) = 26.88 L/min/bar^0.5 = 1.87 gpm/psi^0.5; coverage 4.17 m2 per nozzle; at least 1.4 bar; spacing at most 3 m', [n15({mode: 4, A: 50, dens: 10.2}).Q, n15({mode: 4, A: 50, dens: 10.2}).qn, n15({mode: 4, A: 50, dens: 10.2}).K, n15({mode: 4, A: 50, dens: 10.2}).Kus, n15({mode: 4, A: 50, dens: 10.2}).cov, n15({mode: 4, P: 1.4}).pOk, n15({mode: 4, P: 1.3}).pOk, n15({mode: 4, sp: 3}).spOk, n15({mode: 4, sp: 3.1}).spOk], [510, 42.5, 26.8794, 1.8663, 4.1667, true, false, true, false], 0.01);
check('Hazen-Williams SI: 1200 L/min in an 80 mm pipe at C 120: 6.05e5 x 1200^1.85 / (120^1.85 x 80^4.87) = 0.0231 bar/m, 30 m = 0.69 bar; velocity 3.98 m/s; C multipliers 100 0.713, 120 1, 130 1.16, 140 1.33, 150 1.51', [+n15({mode: 4, D: 80}).fl.toFixed(2), +n15({mode: 4, D: 80}).vel.toFixed(2), n15({mode: 4, C: 100}).Cmul, n15({mode: 4, C: 150}).Cmul, n15({mode: 4, C: 140}).Cmul, n15({mode: 4, C: 130}).Cmul], [0.69, 3.98, 0.713, 1.51, 1.33, 1.16], 0.01);
for (let k = 0; k < 5; k++) { w.renderCalc('nfpa15'); w.document.getElementById('n15_m').value = String(k); w.calcResult('nfpa15'); }
w.renderCalc('nfpa15'); w.calcResult('nfpa15');
let tt = txt(w, 'n15_results');
check('the page opens with the rate, the flow and the hose allowance and the 🔴 note', [tt.includes('المعدل الأدنى'), tt.includes('خراطيم الإطفاء'), tt.includes('🔴'), w.document.getElementById('n15_g0').style.display, w.document.getElementById('n15_g4').style.display], [true, true, true, '', 'none']);
w.document.getElementById('n15_m').value = '2'; w.calcResult('nfpa15'); tt = txt(w, 'n15_results');
check('the rack page shows the table densities', [tt.includes('كثافة المستوى الأدنى'), tt.includes('كثافة المستويات العليا'), tt.includes('مستويات عليا تُحمى')], [true, true, true]);
check('other reference codes open it too', others('nfpa15', 'n15_results'), [true, true, true]);
}
// ---------- part 156: NFPA 11 low-expansion foam (`nfpa11`: fixed-roof, floating-roof, indoor tanks, loading racks, diked and spill areas) ----------
{
w = boot('ae'); doc = w.document;
const n11 = o => w.eval('n11Calc(' + JSON.stringify(Object.assign({mode: 0, method: 0, hc: 1, D: 30, pct: 3, rate: 0, fm: 0, seal: 0, dam: 0, w: 0.4, dd: 0.4, k: 2, cls: 0, A: 400, depth: false, q: 200, dist: 8}, o)) + ')');
const A30 = Math.PI * 900 / 4;
check('fixed-roof tank D 30 m, flash point below 38 C, Type II outlets: area 706.9 m2, rate 0.10 gpm/ft2 = 4.07 L/min/m2, 55 min, flow 2880 L/min, volume 158.4 m3, 2 outlets of 1440 L/min', [+n11({}).A.toFixed(1), +n11({}).rateL.toFixed(2), n11({}).tmin, +n11({}).Q.toFixed(0), +n11({}).V.toFixed(1), n11({}).n, +n11({}).qOut.toFixed(0)], [706.9, 4.07, 55, 2880, 158.4, 2, 1440]);
check('the minutes by hydrocarbon: Type II outlets 30 / 55 / 55; hand lines and monitors 50 / 65 / 65 at 0.16 gpm/ft2 (6.5 L/min/m2); subsurface 30 / 55 / 55', [0, 1, 2].map(hc => n11({hc}).tmin).concat([0, 1, 2].map(hc => n11({hc, method: 1}).tmin), [0, 1, 2].map(hc => n11({hc, method: 2}).tmin)), [30, 55, 55, 50, 65, 65, 30, 55, 55]);
check('rate 0.16 gpm/ft2 = 6.52 L/min/m2 for hand lines and indoor tanks; hand lines need no outlet count nor hose allowance', [+n11({method: 1}).rateL.toFixed(2), +n11({method: 3}).rateL.toFixed(2), n11({method: 1}).n, n11({method: 1}).hoseNeeded, n11({method: 0}).hoseNeeded, n11({method: 2}).hoseNeeded], [6.52, 6.52, 0, false, true, true]);
check('surface outlets (Table 5.2.5.2.1): 24 m 1, 24.1 m 2, 37 m 2, 43 m 3, 49 m 4, 55 m 5, 61 m 6; 70 m: 6 + ceil((3848.5 - 2918.7) / 465) = 8; 80 m: 5026.5 m2: 6 + ceil(4.54) = 11', [24, 24.1, 37, 43, 49, 55, 61, 70, 80].map(D => n11({D}).n), [1, 2, 2, 3, 4, 5, 6, 8, 11]);
check('subsurface outlets (Table 5.2.6.2.8): flash point below 38 C 1 / 2 / 3 / 4 / 5 / 6 at 24 / 37 / 43 / 49 / 55 / 61 m; 38 C or higher 1 / 1 / 2 / 2 / 2 / 3; above 61 m 6 + 1 per 465 m2 or 3 + 1 per 700 m2', [24, 37, 43, 49, 55, 61].map(D => n11({method: 2, D, hc: 1}).n).concat([24, 37, 43, 49, 55, 61].map(D => n11({method: 2, D, hc: 0}).n), [n11({method: 2, D: 70, hc: 1}).n, n11({method: 2, D: 70, hc: 0}).n]), [1, 2, 3, 4, 5, 6, 1, 1, 2, 2, 2, 3, 8, 5]);
check('subsurface maximum rate 8.1 L/min/m2 (0.20 gpm/ft2): 8.15 passes the limit? 8.149 is exactly 0.20 gpm/ft2; 8.2 fails; a rate under the minimum fails', [n11({method: 2, rate: 8.1}).maxOk, n11({method: 2, rate: 8.149}).maxOk, n11({method: 2, rate: 8.2}).maxOk, n11({rate: 4}).rateOk, n11({rate: 4.08}).rateOk], [true, true, false, false, true]);
check('a higher application rate shortens the time proportionally but not below 70 %: double rate 55 -> 38.5 min; triple 55 -> 38.5; 1.2 x -> 45.8', [n11({rate: 4.0746 * 2}).t, n11({rate: 4.0746 * 3}).t, +n11({rate: 4.0746 * 1.2}).t.toFixed(1), n11({rate: 4.0746}).t], [38.5, 38.5, 45.8, 55], 0.05);
check('supplementary hose streams: up to 20 m 1, to 36 m 2, above 36 m 3 of 190 L/min; operating time 10 min up to 11 m, 20 min to 29 m, 30 min above', [10, 11, 15, 20, 25, 29, 30, 36, 37].map(D => n11({D}).hoseN + '/' + n11({D}).hoseT).join(' '), '1/10 1/10 1/20 1/20 2/20 2/20 2/30 2/30 3/30');
check('totals for D 30 m: hose 2 x 190 x 30 = 11.4 m3; total 169.8 m3; peak flow 3260 L/min; 3 % concentrate 5094 L; 6 % doubles', [+n11({}).hoseV.toFixed(1), +n11({}).total.toFixed(1), +n11({}).peak.toFixed(0), +(n11({}).conc * 1000).toFixed(0), +(n11({pct: 6}).conc * 1000).toFixed(0)], [11.4, 169.8, 3260, 5094, 10188], 1);
check('indoor tanks need a liquid surface of 37 m2 or more (400 ft2)', [n11({method: 3, D: 6}).indoorOk, n11({method: 3, D: 7}).indoorOk, n11({method: 3, D: 7}).n], [false, true, 1]);
check('floating roof D 60 m, seal width 0.4 m: annulus 74.9 m2; top of seal 12.2 L/min/m2 for 20 min, 916 L/min, 18.3 m3; outlets 188.5 / 12 = 16 (305 mm dam) or 8 (600 mm dam)', [+n11({mode: 1, D: 60}).A.toFixed(1), +n11({mode: 1, D: 60}).rateL.toFixed(2), n11({mode: 1, D: 60}).t, +n11({mode: 1, D: 60}).Q.toFixed(0), +n11({mode: 1, D: 60}).V.toFixed(1), n11({mode: 1, D: 60}).n, n11({mode: 1, D: 60, dam: 1}).n, n11({mode: 1, D: 60, dam: 1}).spacing], [74.9, 12.22, 20, 916, 18.3, 16, 8, 24]);
check('below the seal 20.4 L/min/m2 for 10 min: shoe seal 40 m (5 outlets, no dam), tube seal over 150 mm 18 m (11), tube seal under 150 mm 18 m with a dam, metal secondary seal 18 m', [n11({mode: 1, D: 60, fm: 1}).rateL, n11({mode: 1, D: 60, fm: 1}).t, n11({mode: 1, D: 60, fm: 1}).n, n11({mode: 1, D: 60, fm: 1}).damReq, n11({mode: 1, D: 60, fm: 1, seal: 1}).n, n11({mode: 1, D: 60, fm: 1, seal: 2}).damReq, n11({mode: 1, D: 60, fm: 1, seal: 1}).damReq, n11({mode: 1, D: 60, fm: 1, seal: 3}).spacing], [20.4, 10, 5, false, 11, true, false, 18], 0.05);
check('dam slots 278 mm2 per m2 of dammed area; the dam 300 - 600 mm from the shell', [+n11({mode: 1, D: 60}).Adam.toFixed(1), +n11({mode: 1, D: 60}).slots.toFixed(0), n11({mode: 1, dd: 0.3}).ddOk, n11({mode: 1, dd: 0.6}).ddOk, n11({mode: 1, dd: 0.29}).ddOk, n11({mode: 1, dd: 0.61}).ddOk], [74.9, 20821, true, true, false, false], 1);
check('area hazards: loading racks protein 0.16 / AFFF 0.10 for 15 min, 0.16 where more than 25 mm of fuel can accumulate; diked low-level 0.10 for 30 (class I) or 20 (class II); monitors 0.16; non-diked spill 15 min', [n11({mode: 2, k: 0}).rate, n11({mode: 2, k: 1}).rate, n11({mode: 2, k: 1, depth: true}).rate, n11({mode: 2, k: 2}).t, n11({mode: 2, k: 2, cls: 1}).t, n11({mode: 2, k: 3}).rate, n11({mode: 2, k: 3, cls: 1}).t, n11({mode: 2, k: 4}).t, n11({mode: 2, k: 5}).rate], [0.16, 0.1, 0.16, 30, 20, 0.16, 20, 15, 0.1]);
check('diked area 400 m2 at 4.07 L/min/m2: 1630 L/min for 30 min = 48.9 m3, 3 % = 1467 L; outlets of up to 230 L/min reach 9 m, larger 18 m', [+n11({mode: 2}).Q.toFixed(0), +n11({mode: 2}).V.toFixed(1), +(n11({mode: 2}).conc * 1000).toFixed(0), n11({mode: 2, q: 230}).spacing, n11({mode: 2, q: 231}).spacing, n11({mode: 2, q: 200, dist: 9}).spOk, n11({mode: 2, q: 200, dist: 9.1}).spOk, n11({mode: 2, q: 300, dist: 18}).spOk], [1630, 48.9, 1467, 9, 18, true, false, true], 1);
for (let k = 0; k < 3; k++) { w.renderCalc('nfpa11'); w.document.getElementById('n11_m').value = String(k); w.calcResult('nfpa11'); }
w.renderCalc('nfpa11'); w.calcResult('nfpa11');
let tt = txt(w, 'n11_results');
check('the page opens with the surface area, the minimum rate and the 🔴 note', [tt.includes('مساحة سطح السائل'), tt.includes('الحد الأدنى لمعدل التطبيق'), tt.includes('🔴'), w.document.getElementById('n11_g0').style.display, w.document.getElementById('n11_g2').style.display], [true, true, true, '', 'none']);
w.document.getElementById('n11_m').value = '1'; w.calcResult('nfpa11'); tt = txt(w, 'n11_results');
check('the floating roof page shows the seal area and the dam slots', [tt.includes('مساحة منطقة الختم'), tt.includes('سد الرغوة'), tt.includes('كمية المركز')], [true, true, true]);
check('other reference codes open it too', others('nfpa11', 'n11_results'), [true, true, true]);
}
// ---------- part 157: NFPA 16 foam-water sprinkler and spray systems (`nfpa16`) ----------
{
w = boot('ae'); doc = w.document;
const n16 = o => w.eval('n16Calc(' + JSON.stringify(Object.assign({sys: 1, A: 300, dens: 6.5, sa: 3, sb: 3, P: 1.4, actual: 0, pct: 3, loc: 0, temp: 141}, o)) + ')');
check('closed systems use at least 465 m2 (5000 ft2); deluge or spray the whole area; at the minimum density 6.5 L/min/m2 x 465 = 3022.5 L/min (798 gpm)', [n16({}).areaReq, n16({sys: 0}).areaReq, n16({A: 600}).areaReq, n16({}).Q, +n16({}).gpm.toFixed(0), n16({sys: 0}).Q, n16({sys: 0}).areaNote.includes('كامل')], [465, 300, 600, 3022.5, 798, 1950, true]);
check('the density must be at least 6.5 L/min/m2 (0.16 gpm/ft2)', [n16({dens: 6.4}).densOk, n16({dens: 6.5}).densOk, n16({dens: 0}).dens, n16({dens: 10.2}).densOk], [false, true, 6.5, true]);
check('sprinklers: at most 9.3 m2 and 3.7 m between sprinklers (3 x 3 m = 9 m2 ok; 3.7 x 2.5 = 9.25 ok; 3.8 m not; 3.2 x 3 = 9.6 m2 not); 465 / 9 = 52 sprinklers of 58.1 L/min', [n16({}).sprOk, n16({sa: 3.7, sb: 2.5}).sprOk, n16({sa: 3.7, sb: 2.5}).spOk, n16({sa: 3.8, sb: 2.4}).spOk, n16({sa: 3.2, sb: 3}).sprOk, n16({}).n, +n16({}).qs.toFixed(1)], [true, true, true, false, false, 52, 58.1]);
check('3.8 m line to line is permitted only at 0.25 gpm/ft2 (10.2 L/min/m2)', [n16({sa: 3.7, sb: 3.8, dens: 10.2}).spOk2, n16({sa: 3.7, sb: 3.8}).spOk2, n16({sa: 3.7, sb: 3.8, dens: 10.18}).spOk2], [true, false, false]);
check('K factor: 58.1 L/min at 1.4 bar = 49.1 L/min/bar^0.5 = 3.41 gpm/psi^0.5', [+n16({}).K.toFixed(1), +n16({}).Kus.toFixed(2)], [49.1, 3.41]);
check('duration 10 min; at a higher actual density 13 L/min/m2 the time is 10 x 6.5 / 13 = 5 -> not below 7 min; at 8 L/min/m2 8.1 min; volume 30.2 m3 and 3 % = 907 L at the minimum', [n16({}).tAct, n16({actual: 13}).tAct, +n16({actual: 8}).tAct.toFixed(1), +n16({}).V.toFixed(1), +(n16({}).conc * 1000).toFixed(0), +n16({actual: 8}).V.toFixed(1)], [10, 7, 8.1, 30.2, 907, 30.2], 0.1);
check('containment (A.7.2.6.1 SI example): 6.5 x 465 + 946 = 3969 L/min x 60 = 238 m3; the drain pipe carries 1.5 D A = 4534 L/min', [+n16({}).contQ.toFixed(1), +n16({}).cont.toFixed(0), +n16({}).drain.toFixed(0), n16({}).hose], [3968.5, 238, 4534, 946], 0.1);
check('sprinkler temperature ratings: ceiling 121 - 149 C, intermediate 57 - 77 C', [n16({temp: 121}).tempOk, n16({temp: 149}).tempOk, n16({temp: 150}).tempOk, n16({loc: 1, temp: 57}).tempOk, n16({loc: 1, temp: 78}).tempOk], [true, true, false, true, false]);
w.renderCalc('nfpa16'); w.calcResult('nfpa16');
const tt = txt(w, 'n16_results');
check('the page shows the density, the sprinklers and the containment and the 🔴 note', [tt.includes('الكثافة'), tt.includes('عدد الرشاشات'), tt.includes('حجم الاحتواء'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('nfpa16', 'n16_results'), [true, true, true]);
}
// ---------- part 158: NFPA 17 dry chemical total flooding limits (`nfpa17`) ----------
{
w = boot('ae'); doc = w.document;
const n17 = o => w.eval('n17Calc(' + JSON.stringify(Object.assign({L: 4, W: 3, H: 2.5, open: 0.5, air: 0, t: 30, hn: 1, hf: 1.5, ht: 30}, o)) + ')');
check('enclosure 4 x 3 x 2.5 m: surface 59 m2 and volume 30 m3; 0.5 m2 of openings is 0.85 % (no compensation)', [n17({}).S, n17({}).V, +n17({}).ratio.toFixed(2), n17({}).cat, n17({}).supp], [59, 30, 0.85, 0, 0], 1e-9);
check('categories: up to 1 % none; above 1 up to 5 % 2.44 kg/m2 (0.5 lb/ft2); above 5 up to 15 % 4.88 kg/m2 (1 lb/ft2); above 15 % local application', [0.59, 0.6, 2.95, 2.96, 8.85, 8.86].map(open => n17({open}).cat), [0, 1, 1, 2, 2, 3]);
check('supplementary dry chemical: 1.5 m2 (2.54 %) x 2.44 = 3.66 kg; 6 m2 (10.2 %) x 4.88 = 29.3 kg; above 15 % no compensation figure', [+n17({open: 1.5}).supp.toFixed(2), +n17({open: 6}).supp.toFixed(1), n17({open: 9}).supp, n17({open: 9}).okTotal, n17({open: 8}).okTotal], [3.66, 29.3, 0, false, true]);
check('ventilation not shut down adds its air volume during the discharge: 20 m3/min for 30 s = 10 m3 -> 40 m3', [n17({air: 20}).vAir, n17({air: 20}).Veff, n17({}).Veff], [10, 40, 30], 1e-9);
check('discharge within 30 s; hand hose quantity: 2 hoses x 1.5 kg/s for the greater of 30 s and the working time (45 s -> 135 kg)', [n17({t: 30}).tOk, n17({t: 31}).tOk, n17({hn: 2}).hoseMass, n17({hn: 2, ht: 45}).hoseMass, n17({hn: 2, ht: 10}).hoseT], [true, false, 90, 135, 30]);
w.renderCalc('nfpa17'); w.calcResult('nfpa17');
const tt = txt(w, 'n17_results');
check('the page shows the openings ratio, the discharge time and the 🔴 note', [tt.includes('نسبة الفتحات'), tt.includes('زمن التصريف'), tt.includes('🔴')], [true, true, true]);
check('other reference codes open it too', others('nfpa17', 'n17_results'), [true, true, true]);
}
// ---------- part 159: Eurocode 8 lateral force method and behaviour factor (`ec8lat`) ----------
{
w = boot('ae'); doc = w.document;
const e9 = o => w.eval('e9Calc(' + JSON.stringify(Object.assign({type: 1, gt: 'B', ic: 'II', agR: 0.15, sys: 0, ductile: 0, wall: false, regElev: true, regPlan: true, au: 1.3, a0: 1, ct: 0.075, n: 6, h: 3.2, H: 19.2, mf: 350, mr: 300, s: 1, de: 8, ns: 0}, o)) + ')');
const q = (sys, ductile, o) => e9(Object.assign({sys, ductile}, o)).q;
check('Table 5.1 q0 for DCM: frame, dual, coupled wall 3.0 x alpha_u/alpha_1 (1.3) = 3.9; uncoupled wall 3.0 (no alpha_u/alpha_1 in DCM); torsionally flexible 2.0; inverted pendulum 1.5', [e9({}).q0, e9({}).au, e9({}).q0u, e9({sys: 1}).q0, e9({sys: 1}).au, e9({sys: 2}).q0, e9({sys: 3}).q0], [3, 1.3, 3.9, 3, 1, 2, 1.5], 1e-9);
check('DCH: frame 4.5 x 1.3 = 5.85; uncoupled wall 4.0 x alpha_u/alpha_1; torsionally flexible 3.0; inverted pendulum 2.0', [e9({ductile: 1}).q0u, e9({sys: 1, ductile: 1, au: 1.1}).q0u, e9({sys: 2, ductile: 1}).q0, e9({sys: 3, ductile: 1}).q0], [5.85, 4.4, 3, 2], 1e-9);
check('alpha_u/alpha_1 is limited to 1.5; irregular in plan takes the average with 1.0 (1.3 -> 1.15); irregular in elevation reduces q0 by 20 %', [e9({au: 1.8}).au, e9({regPlan: false}).au, e9({regPlan: false}).q0u, e9({regElev: false}).elev, e9({regElev: false}).q0r], [1.5, 1.15, 3.45, 0.8, 3.12], 1e-9);
check('kw for walls and torsionally flexible systems: (1 + a0) / 3 not above 1 and not below 0.5; frames 1.0; so a wall system with a0 0.5 gives kw 0.5 and q 3.0 x 0.5 = 1.5 (floor 1.5); a0 2 gives 1', [e9({sys: 1, a0: 0.5}).kw, e9({sys: 1, a0: 0.2}).kw, e9({sys: 1, a0: 2}).kw, e9({sys: 1, a0: 3}).kw, e9({sys: 1, a0: 0.5}).q, e9({sys: 0, wall: true, a0: 1.5}).kw, e9({sys: 0}).kw, e9({sys: 2, a0: 0.4}).kw, e9({sys: 3}).kw], [0.5, 0.5, 1, 1, 1.5, 0.8333, 1, 0.5, 1], 1e-3);
check('q is never below 1.5: the inverted pendulum 1.5 and torsionally flexible with walls 2.0 x 0.5', [q(3, 0), q(2, 0, {a0: 0.1})], [1.5, 1.5], 1e-9);
check('T1 = Ct H^0.75: 0.075 x 19.2^0.75 = 0.6879 s; lambda 0.85 (six storeys and T1 below 2 TC = 1.0 s); 0.9 s still 0.85; T1 over 2 TC or two storeys gives 1.0; applicability T1 <= min(4 TC, 2 s)', [+e9({}).T1.toFixed(4), e9({}).lam, e9({n: 2}).lam, e9({n: 3, H: 40, h: 13.3}).lam, e9({}).Tlim, e9({}).lfm, e9({n: 30, h: 3.3, H: 99}).lfm, e9({regElev: false}).lfm], [+(0.075 * Math.pow(19.2, 0.75)).toFixed(4), 0.85, 1, 1, 2, true, false, false], 1e-4);
const ag = 0.15 * 9.81, S = 1.2, TC = 0.5, T1 = 0.075 * Math.pow(19.2, 0.75), qq = 3.9, Sd = ag * S * 2.5 / qq * TC / T1, m = 5 * 350 + 300, Fb = Sd * m * 0.85;
check('Sd(T1) on the plateau-descending branch ag S 2.5 / q TC / T1 (Type 1 ground B, q 3.9); Fb = Sd x m x lambda with m = 2050 t', [+e9({}).Sd.toFixed(4), +e9({}).m.toFixed(0), +e9({}).Fb.toFixed(2)], [+Sd.toFixed(4), 2050, +Fb.toFixed(2)], 1e-3);
check('storey forces follow the linear mode (4.11): F_i = Fb z_i m_i / sum(z_j m_j); the shears sum back to Fb and the top shear equals the roof force', [+e9({}).F.reduce((a, b) => a + b, 0).toFixed(3), +e9({}).V[0].toFixed(3), +e9({}).V[5].toFixed(3), +e9({}).F[5].toFixed(3), e9({}).F.length, +(e9({}).F[5] / e9({}).F[0]).toFixed(3)], [+Fb.toFixed(3), +Fb.toFixed(3), +e9({}).F[5].toFixed(3), +(Fb * 300 * 19.2 / (350 * 3.2 * (1 + 2 + 3 + 4 + 5) + 300 * 19.2)).toFixed(3), 6, +(300 * 6 / (350 * 1)).toFixed(3)], 1e-2);
check('drift: elastic 8 mm x q 3.9 = 31.2 mm; limit 0.005 x 3200 = 16 mm with nu 0.5 (15.6 mm passes), 0.4 for classes III and IV; ductile 0.0075 h = 24 mm; 0.010 h = 32 mm', [+e9({}).dr.toFixed(1), e9({}).lim, e9({}).drOk, e9({de: 8.5}).drOk, e9({ic: 'III'}).nu, e9({ns: 1}).lim, e9({ns: 2}).lim, e9({ns: 2, de: 20}).drOk], [31.2, 16, true, false, 0.4, 24, 32, false], 0.05);
check('theta = Ptot dr / (Vtot h): ground storey 6 storeys: Ptot = 2050 x 9.81 = 20110 kN, dr 31.2 mm, V = Fb, h 3.2 m; limits 0.1 and 0.2 and 0.3', [+e9({}).Pabove[0].toFixed(0), +e9({}).theta.toFixed(4), e9({}).thOk, e9({de: 200}).thOk, e9({de: 200}).p2.includes('غير مسموح')], [20111, +(2050 * 9.81 * 31.2 / 1000 / (Fb * 3.2)).toFixed(4), true, false, true], 1e-3);
check('theta bands: at most 0.1 neglected; 0.1 - 0.2 multiplied by 1/(1 - theta); 0.2 - 0.3 second-order analysis', [e9({de: 1}).p2.includes('لا تُؤخذ'), e9({de: 8}).p2.includes('1 / (1 − θ)'), e9({de: 12}).p2.includes('الدرجة الثانية')], [true, true, true]);
for (let i = 0; i < 2; i++) { w.renderCalc('ec8lat'); w.calcResult('ec8lat'); }
const tt = txt(w, 'e9_results');
check('the page shows q, Fb, the storey table and the 🔴 note', [tt.includes('عامل السلوك q'), tt.includes('قوة القص القاعدية Fb'), tt.includes('Fi (kN)'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('ec8lat', 'e9_results'), [true, true, true]);
}
// ---------- part 160: Eurocode 2 serviceability and detailing (`ec2serv`: span/depth, crack width, punching shear, columns, slabs) ----------
{
w = boot('ae'); doc = w.document;
const BASE = [{mode: 0, fck: 30, fyk: 500, sys: 0, L: 6, d: 250, rho: 0.5, rhoc: 0, ratio: 1, flange: false, part: false}, {mode: 1, fck: 30, b: 1000, h: 250, d: 210, n: 5, phi: 16, c: 30, M: 60, kt: 0.4, s: 200, exp: 0}, {mode: 2, fck: 30, d: 200, rly: 0.8, rlz: 0.8, c1: 400, c2: 400, pos: 0, V: 600, beta: 0, scp: 0}, {mode: 3, b: 400, h: 400, fck: 30, fyk: 500, N: 1500, As: 2400, l0: 3.5, hd: 400, phief: 0, rmKnown: false, rm: 1, phiL: 20}, {mode: 4, h: 200, d: 165, fck: 30, fyk: 500, As1: 785, s1: 200, s2: 300, ss: 500}];
const e3 = o => w.eval('e3Calc(' + JSON.stringify(Object.assign({}, BASE[(o && o.mode) || 0], o)) + ')');
check('Table 7.4N values for C30/37 follow from expressions 7.16: K 1.0 at 1.5 % 14 and at 0.5 % 20; K 1.3: 18 and 26; K 1.5: 20 and 30; flat slab 1.2: 17 and 24; cantilever 0.4: 6 and 8 (the table rounds the expressions)', [0, 1, 2, 3, 4].map(sys => +e3({sys, rho: 1.5}).base.toFixed(0)).concat([0, 1, 2, 3, 4].map(sys => +e3({sys, rho: 0.5}).base.toFixed(0))), [14, 18, 21, 17, 6, 20, 27, 31, 25, 8], 1);
check('equation selection: rho <= rho0 (0.548 % for fck 30) uses 7.16.a, above it 7.16.b; at 0.5 % the base is K(11 + 1.5 sqrt(fck) rho0/rho + 3.2 sqrt(fck) (rho0/rho - 1)^1.5) = 20.5', [e3({rho: 0.5}).eq, e3({rho: 0.6}).eq, +e3({rho: 0.5}).rho0.toFixed(6), +e3({rho: 0.5}).base.toFixed(2), +e3({rho: 1.5}).base.toFixed(2)], ['7.16.a', '7.16.b', 0.005477, +(11 + 1.5 * Math.sqrt(30) * (Math.sqrt(30) * 1e-3 / 0.005) + 3.2 * Math.sqrt(30) * Math.pow(Math.sqrt(30) * 1e-3 / 0.005 - 1, 1.5)).toFixed(2), +(11 + 1.5 * Math.sqrt(30) * (Math.sqrt(30) * 1e-3 / 0.015)).toFixed(2)]);
check('compression steel raises the limit: rho 1.5 %, rho\' 0.5 %: 11 + 1.5 sqrt(30) rho0/(rho - rho\') + sqrt(30) sqrt(rho\'/rho0) / 12', [+e3({rho: 1.5, rhoc: 0.5}).base.toFixed(3)], [+(11 + 1.5 * Math.sqrt(30) * 0.0054772 / 0.01 + Math.sqrt(30) * Math.sqrt(0.005 / 0.0054772) / 12).toFixed(3)], 0.005);
check('modifications: 500 / (fyk As,req / As,prov) up to 1.5 (As,req / As,prov 0.8 -> 1.25); flanged b / bw above 3 x 0.8; spans above 7 m with partitions x 7 / L; flat slabs above 8.5 m x 8.5 / L; the actual l/d and the minimum depth', [e3({ratio: 0.8}).f1, e3({ratio: 0.5}).f1, e3({flange: true}).f2, e3({L: 8, part: true}).f3, e3({L: 8}).f3, e3({sys: 3, L: 9, part: true}).f3, e3({sys: 3, L: 9}).f3, +e3({}).act.toFixed(1), e3({rho: 0.5}).ok, +e3({rho: 0.5}).dmin.toFixed(0)], [1.25, 1.5, 0.8, 0.875, 1, 0.9444, 1, 24, false, 292], 1);
const Ecm = 22000 * Math.pow(3.8, 0.3), ae = 200000 / Ecm, As = 5 * Math.PI * 64, rho = As / (1000 * 210), x = ae * rho * 210 * (Math.sqrt(1 + 2 / (ae * rho)) - 1), z = 210 - x / 3, ss = 60e6 / (As * z), hc = Math.min(2.5 * 40, (250 - x) / 3, 125), rp = As / (1000 * hc), fctm = 0.3 * Math.pow(30, 2 / 3);
const esm = Math.max((ss - 0.4 * fctm / rp * (1 + ae * rp)) / 200000, 0.6 * ss / 200000), srFar = 1.3 * (250 - x), srNear = 3.4 * 30 + 0.8 * 0.5 * 0.425 * 16 / rp;
check('crack section 1000 x 250, d 210, 5 phi 16, cover 30, M 60 kN.m: alpha_e = Es/Ecm, neutral axis x, stress sigma_s, hc,ef, rho_p,eff, strain difference (the 0.6 sigma_s / Es floor is checked)', [+e3({mode: 1}).ae.toFixed(3), +e3({mode: 1}).x.toFixed(1), +e3({mode: 1}).ss.toFixed(0), +e3({mode: 1}).hc.toFixed(1), +e3({mode: 1}).rpe.toFixed(5), +(e3({mode: 1}).esm * 1e3).toFixed(4)], [+ae.toFixed(3), +x.toFixed(1), +ss.toFixed(0), +hc.toFixed(1), +rp.toFixed(5), +(esm * 1e3).toFixed(4)], 1e-3);
check('crack width: bar spacing 200 mm exceeds 5(c + phi/2) = 190 -> sr,max = 1.3(h - x); with 150 mm spacing sr,max = k3 c + k1 k2 k4 phi / rho_p,eff; wk against 0.4 mm and 0.3 mm', [e3({mode: 1}).close, e3({mode: 1, s: 150}).close, +e3({mode: 1}).sr.toFixed(1), +e3({mode: 1, s: 150}).sr.toFixed(1), +e3({mode: 1}).wk.toFixed(3), +e3({mode: 1, s: 150}).wk.toFixed(3), e3({mode: 1}).ok, e3({mode: 1, exp: 1}).ok, e3({mode: 1, s: 150, exp: 1}).ok], [false, true, +srFar.toFixed(1), +srNear.toFixed(1), +(srFar * esm).toFixed(3), +(srNear * esm).toFixed(3), true, true, false]);
check('Tables 7.2N and 7.3N at sigma_s 306 MPa (row 320): wk 0.4: bar 12 mm and spacing 150 mm; wk 0.3: 10 mm and 100 mm; 16 mm bars at 200 mm exceed both; row 160: 40 / 300; 450 MPa: 6 and 5 mm bars, no spacing row', [e3({mode: 1}).maxPhi, e3({mode: 1}).maxS, e3({mode: 1, exp: 1}).maxPhi, e3({mode: 1, exp: 1}).maxS, e3({mode: 1}).phiOk, e3({mode: 1}).sOk], [12, 150, 10, 100, false, false]);
check('Table lookups by steel stress: 160 -> 40 / 32 / 25 mm and 300 / 300 / 200; 240 -> 20 / 16 / 12 and 250 / 200 / 100; 450 -> 6 / 5 / none; above 450 outside', [w.eval("e3Look(E3_T72, 160, 1)"), w.eval("e3Look(E3_T72, 240, 2)"), w.eval("e3Look(E3_T72, 450, 3)"), w.eval("e3Look(E3_T72, 451, 1)"), w.eval("e3Look(E3_T73, 160, 3)"), w.eval("e3Look(E3_T73, 240, 3)"), w.eval("e3Look(E3_T73, 360, 1)")], [40, 16, null, undefined, 200, 100, 100]);
check('punching 400 x 400 interior column, d 200, rho 0.8 %, VEd 600 kN, fck 30: k = 2, vRd,c = 0.12 x 2 x (100 x 0.008 x 30)^(1/3) = 0.692 MPa vs vmin 0.542; u1 = 2(c1 + c2) + 4 pi d = 4113 mm; vEd = 1.15 V / (u1 d) = 0.839 MPa -> shear reinforcement needed; u0 check vs 0.4 nu fcd', [e3({mode: 2}).k, +e3({mode: 2}).vRdc.toFixed(3), +e3({mode: 2}).vmin.toFixed(3), +e3({mode: 2}).u1.toFixed(0), +e3({mode: 2}).vEd.toFixed(3), e3({mode: 2}).cOk, +e3({mode: 2}).vEd0.toFixed(3), +e3({mode: 2}).vRdmax.toFixed(3), e3({mode: 2}).maxOk, +e3({mode: 2}).VRdc.toFixed(0), +e3({mode: 2}).uout.toFixed(0)], [2, +(0.12 * 2 * Math.pow(24, 1 / 3)).toFixed(3), +(0.035 * Math.pow(2, 1.5) * Math.sqrt(30)).toFixed(3), 4113, +(1.15 * 600e3 / (4113.27 * 200)).toFixed(3), false, +(1.15 * 600e3 / (1600 * 200)).toFixed(3), 4.224, true, 495, +(1.15 * 600e3 / (0.12 * 2 * Math.pow(24, 1 / 3) * 200)).toFixed(0)], 0.002);
check('edge and corner columns: u1 = c2 + 2 c1 + 2 pi d and c1 + c2 + pi d; u0 = min(c2 + 3d, c2 + 2 c1) and min(3d, c1 + c2); beta 1.4 and 1.5; a given beta and sigma_cp are used', [+e3({mode: 2, pos: 1}).u1.toFixed(0), +e3({mode: 2, pos: 2}).u1.toFixed(0), e3({mode: 2, pos: 1}).u0, e3({mode: 2, pos: 2}).u0, e3({mode: 2, pos: 1}).beta, e3({mode: 2, pos: 2}).beta, e3({mode: 2, beta: 1.3}).beta, +e3({mode: 2, scp: 1}).vRdc.toFixed(3)], [+(400 + 800 + 2 * Math.PI * 200).toFixed(0), +(800 + Math.PI * 200).toFixed(0), 1000, 600, 1.4, 1.5, 1.3, +(0.12 * 2 * Math.pow(24, 1 / 3) + 0.1).toFixed(3)], 0.002);
check('the control values: k limited to 2 (d 100 mm -> 2), rho_l limited to 2 %, vmin governs at low steel', [e3({mode: 2, d: 100}).k, e3({mode: 2, rly: 3, rlz: 3}).rl, +e3({mode: 2, rly: 0.05, rlz: 0.05}).vRdc.toFixed(3), +e3({mode: 2, rly: 0.05, rlz: 0.05}).vmin.toFixed(3)], [2, 0.02, 0.542, 0.542], 0.001);
check('column 400 x 400, N 1500 kN, As 2400: i = 115.5 mm, lambda 30.3; n = 0.469, omega = 0.326; A 0.7 (unknown creep), B = 1.285, C 0.7 -> lambda_lim 18.4: slender; As,min = max(0.10 N / fyd, 0.002 Ac) = 345 mm2, As,max 6400 (0.08 Ac 12800)', [+e3({mode: 3}).lam.toFixed(1), +e3({mode: 3}).n.toFixed(3), +e3({mode: 3}).om.toFixed(3), e3({mode: 3}).A, +e3({mode: 3}).B.toFixed(3), e3({mode: 3}).C, +e3({mode: 3}).lim.toFixed(1), e3({mode: 3}).slender, +e3({mode: 3}).Asmin.toFixed(0), e3({mode: 3}).Asmax, e3({mode: 3}).Asmax2, e3({mode: 3}).asOk], [30.3, 0.469, 0.326, 0.7, 1.285, 0.7, 18.4, true, 345, 6400, 12800, true], 0.06);
check('known creep ratio and end moments: phi_ef 1.5 -> A = 1/(1 + 0.3) = 0.769; rm 0.5 -> C = 1.2; a short stocky column l0 1.2 m is not slender', [+e3({mode: 3, phief: 1.5}).A.toFixed(3), e3({mode: 3, rmKnown: true, rm: 0.5}).C, e3({mode: 3, rmKnown: true, rm: -0.5}).C, e3({mode: 3, l0: 1.2}).slender, e3({mode: 3, l0: 1.2}).lam], [0.769, 1.2, 2.2, false, 10.4], 0.01);
check('links: at least 6 mm or a quarter of the largest bar (32 mm -> 8); spacing the least of 20 phi, the smaller side and 400 mm: 20 mm bars 400; 12 mm bars 240; reduced x 0.6; minimum bar 8 mm; the axial resistance Ac fcd + As fyd', [e3({mode: 3}).link, e3({mode: 3, phiL: 32}).link, e3({mode: 3}).sMax, e3({mode: 3, phiL: 12}).sMax, e3({mode: 3, phiL: 12}).sRed, e3({mode: 3, phiL: 6}).phiMin, e3({mode: 3}).phiMin, +e3({mode: 3}).NRd.toFixed(0), e3({mode: 3, As: 300}).asOk, e3({mode: 3, As: 6500}).asOk], [6, 8, 400, 240, 144, false, true, 4243, false, false], 0.5);
check('slabs of 200 mm: principal spacing min(3h, 400) = 400; secondary min(3.5h, 450) = 450; concentrated loads min(2h, 250) = 250 and min(3h, 400) = 400; secondary steel 20 %; As,min 248.5 mm2/m; crack steel kc k fct Act / sigma_s = 231.7 mm2/m', [e3({mode: 4}).sp1, e3({mode: 4}).sp2, e3({mode: 4}).spc1, e3({mode: 4}).spc2, +e3({mode: 4}).sec.toFixed(0), +e3({mode: 4}).Asmin.toFixed(1), +e3({mode: 4}).AsCr.toFixed(1)], [400, 450, 250, 400, 157, 248.5, 231.7], 0.1);
check('thin slabs: h 100 -> 3h = 300 and 3.5h = 350; k factor 1.0 up to 300 mm, 0.65 from 800 mm, 0.825 at 550 mm; verdicts', [e3({mode: 4, h: 100, d: 70}).sp1, e3({mode: 4, h: 100, d: 70}).sp2, e3({mode: 4, h: 300}).k, e3({mode: 4, h: 800}).k, e3({mode: 4, h: 550}).k, e3({mode: 4, s1: 400}).mainOk, e3({mode: 4, s1: 401}).mainOk, e3({mode: 4, s2: 450}).secOk, e3({mode: 4, s2: 451}).secOk], [300, 350, 1, 0.65, 0.825, true, false, true, false], 1e-9);
for (let k = 0; k < 5; k++) { w.renderCalc('ec2serv'); w.document.getElementById('e3_m').value = String(k); w.calcResult('ec2serv'); }
w.renderCalc('ec2serv'); w.calcResult('ec2serv');
let tt = txt(w, 'e3_results');
check('the page opens with the span/depth, the Table 7.4N reference and the 🔴 note', [tt.includes('النسبة الأساسية l/d'), tt.includes('l/d الفعلي'), tt.includes('🔴'), w.document.getElementById('e3_g0').style.display, w.document.getElementById('e3_g4').style.display], [true, true, true, '', 'none']);
w.document.getElementById('e3_m').value = '2'; w.calcResult('ec2serv'); tt = txt(w, 'e3_results');
check('the punching page shows vEd, vRd,c and the check', [tt.includes('محيط التحكم u1'), tt.includes('vRd,c'), tt.includes('التحقق بدون تسليح')], [true, true, true]);
check('other reference codes open it too', others('ec2serv', 'e3_results'), [true, true, true]);
}
// ---------- part 161: NFPA 50 bulk oxygen systems separation distances (`nfpa50`) ----------
{
w = boot('ae'); doc = w.document;
const base = {cap: 1000, prot: false, liqL: 2000, liqIIIB: false, gt: 1, gq: 1000};
w.eval('O2_ROWS').forEach(s => { base[s[0]] = s[2]; });
const o2 = o => w.eval('o2Calc(' + JSON.stringify(Object.assign({}, base, o)) + ')');
const row = (r, k) => r.rows.find(x => x.k === k);
const req = (k, o) => row(o2(o), k).req;
check('fixed distances: wood frame 15 m (50 ft), other buildings 0.3 m, wall openings 3 m, solids that burn rapidly 15 m and slowly 7.5 m, public assembly 15 m, non-ambulatory patients 15 m, sidewalk or parked vehicle 3 m, property line 1.5 m, sewer inlets 2.5 m, weeds 4.6 m, underground tank 4.6 m and filling or vent 7.5 m', ['wood', 'bldg', 'open', 'fast', 'slow', 'pub', 'pat', 'walk', 'prop', 'sew', 'weed', 'liqb', 'liqv'].map(k => req(k, {})), [15, 0.3, 3, 15, 7.5, 15, 15, 3, 1.5, 2.5, 4.6, 4.6, 7.5]);
check('Table 2.2.4: liquid storage up to 1000 gal (3785 L) 7.5 m and above 15 m; Class IIIB 4.6 m', [req('liqa', {liqL: 3785}), req('liqa', {liqL: 3786}), req('liqa', {liqL: 5000, liqIIIB: true})], [7.5, 15, 4.6]);
check('Table 2.2.6: liquefied hydrogen 22.5 m any quantity; other liquefied gases 7.5 m up to 3785 L and 15 m above; non-liquefied gases 7.5 m up to 708 m3 (25 000 ft3) and 15 m above', [req('gas', {gt: 0, gq: 10}), req('gas', {gt: 0, gq: 99999}), req('gas', {gt: 1, gq: 3785}), req('gas', {gt: 1, gq: 3786}), req('gas', {gt: 2, gq: 708}), req('gas', {gt: 2, gq: 709})], [22.5, 22.5, 7.5, 15, 7.5, 15]);
check('confining walls: 22.5 m (75 ft) in one direction and 11 m (35 ft) at about 90 degrees', [req('wall1', {}), req('wall2', {})], [22.5, 11]);
check('protective structure of 2 hours interrupting the line of sight: the distances of 2.2.1, 2.2.4 - 2.2.8, 2.2.12 and 2.2.13 become 0.3 m (2.2.14); the others stay', [req('wood', {prot: true}), req('liqa', {prot: true}), req('liqb', {prot: true}), req('gas', {prot: true}), req('fast', {prot: true}), req('slow', {prot: true}), req('walk', {prot: true}), req('prop', {prot: true}), req('open', {prot: true}), req('pub', {prot: true}), req('pat', {prot: true}), req('wall1', {prot: true})], [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 3, 15, 15, 22.5]);
check('verdicts: the exact distance passes and 1 mm less fails (wood frame 15 m)', [row(o2({wood: 15}), 'wood').ok, row(o2({wood: 14.99}), 'wood').ok, row(o2({prop: 1.5}), 'prop').ok, row(o2({prop: 1.49}), 'prop').ok, row(o2({wood: 12, prot: true}), 'wood').ok], [true, false, true, false, true]);
check('scope: more than 566 m3 (20 000 ft3 at 21 C and 101 kPa) is a bulk oxygen system; 566 m3 exactly is not', [o2({cap: 567}).bulk, o2({cap: 566}).bulk, Math.round(o2({cap: 566}).capFt3), o2({}).rows.length], [true, false, 19988, 17]);
for (let i = 0; i < 2; i++) { w.renderCalc('nfpa50'); w.calcResult('nfpa50'); }
const tt = txt(w, 'o2_results');
check('the page lists the distances and the 🔴 note', [tt.includes('سعة التخزين'), tt.includes('مبنى بإطار خشبي'), tt.includes('أماكن التجمع العام'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open it too', others('nfpa50', 'o2_results'), [true, true, true]);
}
// ---------- part 162: boilers approved code of practice (`boilernz`: ratings, safety valves, feed pumps, water level) ----------
{
w = boot('ae'); doc = w.document;
const bz = o => w.eval('bzCalc(' + JSON.stringify(Object.assign({mode: 0, dir: 0, Q: 4000, P: 3000, hgo: 2781.7, hfi: 0, Tfw: 50, area: 100, Qmax: 8000, big: 5000, pumpsN: 2, gd: 150, known: true, fa: 4000, swp: 1000, shared: false, solid: false, type: 1, rho: 900, A: 2.5, set: 1000, alarm: 250}, o)) + ')');
check('Appendix F example 2: shell boiler 3 MW at 1000 kPa with feedwater at 50 C (h 209.5): (2781.7 - 209.5) = 2572.2 kJ/kg and Q = 3000 x 3600 / 2572.2 = 4198.7 kg/h', [+bz({dir: 1}).hfi.toFixed(1), +bz({dir: 1}).dh.toFixed(1), +bz({dir: 1}).Q.toFixed(1)], [209.5, 2572.2, 4198.7], 0.1);
check('output from evaporation: 4000 kg/h x 2572.2 / 3600 = 2858 kW; example 1 with a watertube superheater 80 000 kg/h from 145 C to 3265 kJ/kg gives about 59 MW (the code gives 58 and 59 by two methods)', [+bz({}).P.toFixed(0), +(bz({Q: 80000, hgo: 3265, Tfw: 145}).P / 1000).toFixed(1)], [2858, 59.1], 1);
check('from and at 100 C: P / 2257 kJ/kg: 3000 kW -> 1.329 kg/s = 4785 kg/h; boiler horsepower is area / 1.579 (100 m2 -> 63.3)', [+bz({dir: 1}).faS.toFixed(3), +bz({dir: 1}).fa.toFixed(0), +bz({}).hp.toFixed(1)], [1.329, 4785, 63.3], 0.01);
check('safety valves: two above 2.3 MW (3700 kg/h), one otherwise; capacity at least the maximum evaporation; 115 % of the from-and-at value when the feed temperature is unknown; at most 110 % pressure', [bz({mode: 1}).valves, bz({mode: 1, P: 2300}).valves, bz({mode: 1}).cap, bz({mode: 1, known: false}).cap, bz({mode: 1}).each, bz({mode: 1}).accum], [2, 1, 4000, 4600, 2000, 1100], 1e-9);
check('feed pumps: two above 1.2 MW; a dedicated set 240 % of the water for 100 C feedwater (3000 kW, hgo 2781.7: 4570.9 kg/h -> 10 970); a shared set 120 % of the demand plus the largest pump as reserve (9600 + 5000)', [bz({mode: 1}).pumps, bz({mode: 1, P: 1200}).pumps, +bz({mode: 1}).Q100.toFixed(1), +bz({mode: 1}).total.toFixed(0), bz({mode: 1, shared: true}).total, bz({mode: 1, pumpsN: 1}).pumpOk, bz({mode: 1, P: 1000, pumpsN: 1}).pumpOk], [2, 1, 4570.9, 10970, 14600, false, true], 0.5);
check('pressure gauge at least 150 mm, 100 mm for small boilers (below 100 kW)', [bz({mode: 1}).gauge, bz({mode: 1, P: 90}).gauge, bz({mode: 1, gd: 149}).gaugeOk, bz({mode: 1, P: 90, gd: 100}).gaugeOk], [150, 100, false, true]);
check('water level gauges: one below 100 kW (145 kg/h), otherwise two; sinking time 5 min and 7 min for solid fuel; volume 4000 kg/h x 5 / 60 / 900 = 370 L; 370 L over 2.5 m2 = 148.1 mm above 100 mm governs; watertube boilers 100 mm', [bz({mode: 2, P: 99}).gauges, bz({mode: 2}).gauges, bz({mode: 2}).timeMin, bz({mode: 2, solid: true}).timeMin, +bz({mode: 2}).V.toFixed(0), +bz({mode: 2}).hs.toFixed(1), +bz({mode: 2}).alarm.toFixed(1), bz({mode: 2}).gov, bz({mode: 2, type: 0}).alarm, bz({mode: 2, A: 20}).alarm, bz({mode: 2, A: 20}).gov], [1, 2, 5, 7, 370, 148.1, 148.1, 'الحجم', 100, 100, '100 mm'], 0.1);
check('the alarm level offered must be at least the required one; remote level indicators allowed when the valves are set at 6200 kPa or more', [bz({mode: 2, alarm: 148.2}).lowAlarmOk, bz({mode: 2, alarm: 148}).lowAlarmOk, bz({mode: 2, set: 6200}).remote, bz({mode: 2, set: 6199}).remote], [true, false, true, false]);
for (let k = 0; k < 3; k++) { w.renderCalc('boilernz'); w.document.getElementById('bz_m').value = String(k); w.calcResult('boilernz'); }
w.renderCalc('boilernz'); w.calcResult('boilernz');
let tt = txt(w, 'bz_results');
check('the page opens with the output rating and the 🔴 note', [tt.includes('قدرة الخرج P'), tt.includes('التبخير «من 100 °C وإليه»'), tt.includes('🔴'), w.document.getElementById('bz_g0').style.display, w.document.getElementById('bz_g2').style.display], [true, true, true, '', 'none']);
w.document.getElementById('bz_m').value = '1'; w.calcResult('boilernz'); tt = txt(w, 'bz_results');
check('the valves page shows the count, the capacity and the feed pumps', [tt.includes('عدد صمامات الأمان'), tt.includes('سعة التصريف الكلية الدنيا'), tt.includes('سعة مضخات التغذية الدنيا')], [true, true, true]);
check('other reference codes open it too', others('boilernz', 'bz_results'), [true, true, true]);
}
// ---------- part 163: EN ISO 7396-1 medical gas pipeline systems (`iso7396`: terminal pressures, supports, tests) ----------
{
w = boot('ae'); doc = w.document;
const i7 = o => w.eval('i7Calc(' + JSON.stringify(Object.assign({mode: 0, gas: 0, pn: 400, p0: 430, pf: 380, pfault: 900, pmin: 55, d: 22, L: 30, s: 2, pmax: 450, p1: 400, p2: 399, T1: 20, T2: 20, hours: 24, sect: 0, v1: 40, v2: 52, vh: 1, ar1: 100, ar2: 103}, o)) + ')');
check('compressed medical gases at 400 kPa: not above 110 % (440 kPa) at zero flow, not below 90 % (360 kPa) at design flow and 40 L/min; single-fault limit 1000 kPa; range 400 - 500 kPa', [i7({}).max, i7({}).min, i7({}).test, i7({}).fault, i7({}).maxOk, i7({p0: 441}).maxOk, i7({}).minOk, i7({pf: 359}).minOk, i7({pfault: 1001}).faultOk, i7({}).rangeOk, i7({pn: 399}).rangeOk, i7({pn: 501}).rangeOk], [440, 360, 40, 1000, true, false, true, false, false, true, false, false], 1e-9);
check('air or nitrogen for surgical tools at 800 kPa: not above 115 % (920) nor below 85 % (680 kPa) at 350 L/min; single-fault limit 2000 kPa; range 700 - 1000 kPa', [i7({gas: 1, pn: 800}).max, i7({gas: 1, pn: 800}).min, i7({gas: 1, pn: 800}).test, i7({gas: 1, pn: 800}).fault, i7({gas: 1, pn: 700}).rangeOk, i7({gas: 1, pn: 1001}).rangeOk, i7({gas: 1, pn: 800, p0: 921}).maxOk], [920, 680, 350, 2000, true, false, false], 1e-9);
check('vacuum: at most 60 kPa absolute at design flow with 25 L/min at the terminal', [i7({gas: 2, pmin: 60}).ok, i7({gas: 2, pmin: 61}).ok, i7({gas: 2}).test, i7({gas: 2}).limit], [true, false, 25, 60]);
check('Table 3 supports: up to 15 mm 1.5 m; 22 - 28 mm 2.0 m; 35 - 54 mm 2.5 m; above 54 mm 3.0 m (28.1 mm already above 28 -> 2.5)', [10, 15, 22, 28, 35, 54, 55, 76].map(d => i7({mode: 1, d}).interval), [1.5, 1.5, 2, 2, 2.5, 2.5, 3, 3]);
check('support count for 30 m: 22 mm gives 2 m spacing -> 15 + 1 = 16; a 3 m pipe at 3 m: 2; verdict at the limit passes', [i7({mode: 1}).n, i7({mode: 1, L: 3, d: 76}).n, i7({mode: 1, s: 2}).ok, i7({mode: 1, s: 2.01}).ok], [16, 2, true, false]);
check('mechanical integrity at 1.2 times the maximum pressure in single fault condition (450 kPa -> 540 kPa for 5 min); vacuum pipelines 500 kPa', [i7({mode: 2}).testP, i7({mode: 2}).vacP], [540, 500], 1e-9);
check('Annex E temperature relation: 1400 kPa gauge at 20 C falls to 1349 kPa gauge at 10 C (p2 = 1500 x 283 / 293 - 100); +10 C raises', [+i7({mode: 2, p1: 1400, T1: 20, T2: 10}).pExp.toFixed(0), +i7({mode: 2, p1: 400, T1: 20, T2: 30}).pExp.toFixed(1)], [1349, 417.0], 0.5);
check('leakage limits per hour: 0.4 % after area valves without hoses, 0.6 % with flexible hoses, 0.025 % before; 400 kPa dropping 4 kPa in 24 h at constant temperature is 0.0417 %/h', [+i7({mode: 2, p2: 396}).perHour.toFixed(4), i7({mode: 2, p2: 396}).okLeak, i7({mode: 2, sect: 2, p2: 396}).okLeak, i7({mode: 2, sect: 2, p2: 399.7}).okLeak, i7({mode: 2, sect: 1}).lim, i7({mode: 2, sect: 0}).lim, i7({mode: 2, sect: 2}).lim], [0.0417, true, false, true, 0.6, 0.4, 0.025], 1e-4);
check('temperature correction before judging: 400 kPa at 20 C measured at 15 C shows a 1.7 % lower absolute pressure: the expected gauge pressure is 391.5 kPa, so 391.5 is no leak', [+i7({mode: 2, T2: 15, p2: 391.5}).pExp.toFixed(1), Math.abs(i7({mode: 2, T2: 15, p2: 391.5}).pExp - 391.5) < 0.05, i7({mode: 2, T2: 15, p2: 391.5}).okLeak], [391.5, true, true], 0.05);
check('vacuum leakage rise at most 20 kPa after 1 h; the closed area valve test at most 5 kPa after 15 min', [i7({mode: 2, v1: 40, v2: 60}).vacOk, i7({mode: 2, v1: 40, v2: 61}).vacOk, i7({mode: 2, ar2: 105}).areaOk, i7({mode: 2, ar2: 105.1}).areaOk, i7({mode: 2, v1: 40, v2: 100, vh: 3}).vacOk], [true, false, true, false, true]);
for (let k = 0; k < 3; k++) { w.renderCalc('iso7396'); w.document.getElementById('i7_m').value = String(k); w.calcResult('iso7396'); }
w.renderCalc('iso7396'); w.calcResult('iso7396');
let tt = txt(w, 'i7_results');
check('the page opens with the nominal pressure, the zero flow limit and the 🔴 note', [tt.includes('الضغط الاسمي'), tt.includes('الضغط الأعلى عند انعدام التدفق'), tt.includes('🔴'), w.document.getElementById('i7_g0').style.display, w.document.getElementById('i7_g2').style.display], [true, true, true, '', 'none']);
w.document.getElementById('i7_m').value = '2'; w.calcResult('iso7396'); tt = txt(w, 'i7_results');
check('the test page shows the test pressure and the corrected pressure drop', [tt.includes('ضغط اختبار السلامة الميكانيكية'), tt.includes('هبوط الضغط المصحح'), tt.includes('ارتفاع ضغط التفريغ')], [true, true, true]);
check('other reference codes open it too', others('iso7396', 'i7_results'), [true, true, true]);
}
// ---------- part 164: ASME A17.1-2019 electric elevators (`asmea17`: rated load and platform area, runby, buffers, top clearances, horizontal clearances) ----------
{
w = boot('ae'); doc = w.document;
const B0 = {mode: 0, load: 1000, area: 2.5, cls: 0};
const B1 = {mode: 1, V: 1.6, buf: 0, cw: true, ctl: 1, runby: 200, cwRunby: 300, vg: 0, bs: 0, cs: 0};
const B2 = {mode: 2, carWall: 25, carCw: 30, cwWall: 25, multi: 60, sill: 20, loadSide: 100, vslide: false, mrW: 800, mrH: 2100, head: 2200, mrEnc: 2100, lvl: 100, refA: 0.84, refH: 650};
const a1 = (o, B) => w.eval('a1Calc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
const m0 = o => a1(o, B0), m1 = o => a1(o, B1), m2 = o => a1(o, B2);
check('Table 2.16.1.1: 230 kg 0.65 m2, 1150 kg 2.70 m2, 13500 kg 21.46 m2; 1000 kg interpolates 2.25 + 0.45 x 100/250 = 2.43 m2 with 5 % extra = 2.5515 m2', [230, 1150, 13500, 1000].map(load => m0({load}).maxArea).concat([m0({}).allow]), [0.65, 2.70, 21.46, 2.43, 2.5515], 1e-9);
check('below 230 kg proportional (100 kg: 0.2826 m2); above 13500 kg proportional (20000 kg: 31.79 m2)', [m0({load: 100}).maxArea, m0({load: 20000}).maxArea], [0.65 * 100 / 230, 21.46 * 20000 / 13500], 1e-9);
check('platform area verdict at 1000 kg: 2.55 m2 within the 5 % allowance, 2.56 m2 beyond it', [m0({area: 2.55}).areaOk, m0({area: 2.56}).areaOk], [true, false]);
check('minimum rated load for an area: 2.5 m2 needs 1150 kg; 0.65 and 0.68 (within 5 %) need 230; 0.69 needs 270; 25 m2 is outside the table', [2.5, 0.65, 0.68, 0.69, 25].map(area => m0({area}).minLoad), [1150, 230, 230, 270, null]);
check('freight classes 4 m2: A 240 kg/m2 gives 960 kg, B 145 kg/m2 gives 580 kg, C 240 kg/m2 gives 960 kg; 1000 kg passes A and fails at 4.2 m2 (1008 kg)', [0, 1, 2].map(cls => m0({cls, area: 4}).minFreight).concat([m0({area: 4}).loadOk, m0({area: 4.2}).loadOk]), [960, 580, 960, true, false], 1e-9);
check('Table 2.18.2.1 trip speeds: 0.5 -> 0.90, 0.75 -> 1.05, 1.0 -> 1.40, 2.0 -> 2.55, 5.0 -> 6.00, 10 -> 12.00 m/s; overspeed switch 0.90, 1.05, 1.26, 2.30, 5.70, 11.40', [0.5, 0.75, 1, 2, 5, 10].map(V => m1({V}).govMax).concat([0.5, 0.75, 1, 2, 5, 10].map(V => m1({V}).sw)), [0.9, 1.05, 1.4, 2.55, 6, 12, 0.9, 1.05, 1.26, 2.3, 5.7, 11.4], 1e-9);
check('intermediate speed 1.6 m/s interpolates the table: trip 2.00 + 0.30 x 0.4 = 2.12, switch 1.80 + 0.27 x 0.4 = 1.908, lower limit 115 % = 1.84; above 10 m/s the trip speed is 120 % (12 -> 14.4) and the switch is not tabulated', [m1({}).govMax, m1({}).sw, m1({}).govMin, m1({V: 12}).govMax, m1({V: 12}).sw], [2.12, 1.908, 1.84, 14.4, null], 1e-9);
check('Table 2.22.4.1 oil buffer strokes: 1.00 65, 1.12 85, 1.25 105, 1.50 155, 1.75 205, 2.00 270, 2.50 425, 6.00 2425, 10.00 6740 mm', [1, 1.12, 1.25, 1.5, 1.75, 2, 2.5, 6, 10].map(V => m1({V}).minStroke), [65, 85, 105, 155, 205, 270, 425, 2425, 6740]);
check('unlisted oil buffer speeds use S = 51 (1.15 V)2 to the nearest 5 mm: 1.6 m/s -> 172.7 -> 175; 1.4 -> 132.2 -> 130; 3.2 -> 690.7 -> 690', [1.6, 1.4, 3.2].map(V => m1({V}).minStroke), [175, 130, 690]);
check('Table 2.22.3.1 spring buffer strokes: up to 0.5 m/s 38, 0.51 - 0.75 63, 0.76 - 1.00 100 mm; spring buffers allowed up to 1 m/s only, solid bumpers have no stroke', [0.3, 0.5, 0.75, 1].map(V => m1({V, buf: 1}).minStroke).concat([m1({V: 1.2, buf: 1}).bufOk, m1({V: 1, buf: 1}).bufOk, m1({V: 0.9, buf: 0}).bufOk, m1({V: 0.2, buf: 2}).minStroke]), [38, 38, 63, 100, false, true, true, 0]);
check('gravity stopping distance S = 51 V2 mm at 115 % for oil buffers: 2.0 m/s -> 51 x 2.3^2 = 269.79; for spring buffers at the governor trip speed: 0.75 m/s -> 51 x 1.05^2 = 56.2275', [m1({V: 2}).gstop, m1({V: 0.75, buf: 1}).gstop], [269.79, 56.2275], 1e-9);
check('2.0 m/s oil buffers, counterweight runby 300, car runby 200: upward movement 300 + 270 + 134.895 = 704.895; top clearance + 1100 = 1804.895; counterweight top 200 + 270 + 150 + 134.895 = 754.895', [m1({V: 2}).up, m1({V: 2}).topClear, m1({V: 2}).cwTop], [704.895, 1804.895, 754.895], 1e-6);
check('default 1.6 m/s: upward movement 300 + 175 + 86.3328 = 561.3328; top clearance 1661.3328; counterweight top 200 + 175 + 150 + 86.3328 = 611.3328', [m1({}).up, m1({}).topClear, m1({}).cwTop], [561.3328, 1661.3328, 611.3328], 1e-6);
check('spring buffers 0.75 m/s: upward 300 + 63 + 28.11375 = 391.11375, top 1491.11375, counterweight top 441.11375', [m1({V: 0.75, buf: 1}).up, m1({V: 0.75, buf: 1}).topClear, m1({V: 0.75, buf: 1}).cwTop], [391.11375, 1491.11375, 441.11375], 1e-6);
check('minimum runby: oil buffers 150; spring buffers with other control 150; with rheostatic or single-speed AC Table 2.4.2.2: 0.1 -> 75, 0.2 -> 150, 0.5 -> 225, 0.75 -> 300, 1.0 -> 300; uncounterweighted 0.15 -> 75, above -> 150', [m1({}).runbyMin, m1({V: 0.75, buf: 1}).runbyMin].concat([0.1, 0.2, 0.5, 0.75, 1].map(V => m1({V, buf: 1, ctl: 0}).runbyMin)).concat([m1({V: 0.15, cw: false, buf: 1}).runbyMin, m1({V: 0.16, cw: false, buf: 1}).runbyMin, m1({V: 1.6, cw: false}).runbyMin]), [150, 150, 75, 150, 225, 300, 300, 75, 150, 150]);
check('spring buffer above 1 m/s with Table 2.4.2.2 is outside the table; the uncounterweighted case has no upward movement of the counterweight (top clearance 1100)', [m1({V: 1.2, buf: 1, ctl: 0}).runbyMin, m1({cw: false}).up, m1({cw: false}).topClear], [null, 0, 1100]);
check('runby limits: car 600 mm and counterweight 900 mm; the car runby also must reach the minimum', [m1({runby: 600}).runbyOk, m1({runby: 601}).runbyOk, m1({runby: 149}).runbyOk, m1({cwRunby: 900}).cwRunbyOk, m1({cwRunby: 901}).cwRunbyOk], [true, false, false, true, false]);
check('actual strokes: 300 mm car buffer at 2.0 m/s passes (min 270), 200 fails; a 400 mm counterweight buffer lifts the upward movement to 300 + 400 + 134.895 = 834.895 and the counterweight top uses the 300 mm car buffer: 200 + 300 + 150 + 134.895 = 784.895', [m1({V: 2, bs: 300}).strokeOk, m1({V: 2, bs: 200}).strokeOk, m1({V: 2, bs: 300, cs: 400}).up, m1({V: 2, bs: 300, cs: 400}).cwTop], [true, false, 834.895, 784.895], 1e-6);
const all = Array(11).fill(true), flip = i => all.map((x, k) => k !== i);
check('default clearances all pass', m2({}).rows.map(x => x.ok), all);
const cases = [['carWall', 19, 0], ['carCw', 24, 1], ['cwWall', 19, 2], ['multi', 49, 3], ['sill', 12, 4], ['sill', 33, 4], ['loadSide', 126, 5], ['mrW', 749, 6], ['mrH', 2029, 6], ['head', 2129, 7], ['mrEnc', 1999, 8], ['lvl', 401, 9], ['refA', 0.71, 10], ['refH', 599, 10]];
check('2.5.1: car-wall 20, car-counterweight 25, counterweight-wall 20, multiple hoistway 50, sill 13 - 32, loading side 125; 2.7: door 750 x 2030, headroom 2130, enclosure 2000, level change 400; refuge 600 mm height: each limit rejects one mm below', cases.map(c => m2({[c[0]]: c[1]}).rows.map(x => x.ok)), cases.map(c => flip(c[2])));
check('edges accepted: sill 13 and 32, vertically sliding doors allow 190 and reject 191, headroom 2130, refuge alternative 0.405 m2 at 1070 mm and not at 1069', [m2({sill: 13}).rows[4].ok, m2({sill: 32}).rows[4].ok, m2({loadSide: 190, vslide: true}).rows[5].ok, m2({loadSide: 191, vslide: true}).rows[5].ok, m2({head: 2130}).rows[7].ok, m2({refA: 0.405, refH: 1070}).rows[10].ok, m2({refA: 0.405, refH: 1069}).rows[10].ok], [true, true, true, false, true, true, false]);
for (let k = 0; k < 3; k++) { w.renderCalc('asmea17'); w.document.getElementById('a1_m').value = String(k); w.calcResult('asmea17'); }
w.renderCalc('asmea17'); w.calcResult('asmea17');
let tt = txt(w, 'a1_results');
check('the page opens with the platform area, the freight minimum and the 🔴 note', [tt.includes('أقصى مساحة صافية للأرضية'), tt.includes('أدنى حمولة لمصاعد الشحن'), tt.includes('🔴'), w.document.getElementById('a1_g0').style.display, w.document.getElementById('a1_g1').style.display], [true, true, true, '', 'none']);
w.document.getElementById('a1_m').value = '1'; w.calcResult('asmea17'); tt = txt(w, 'a1_results');
check('the runby page shows the trip speed, stroke, upward movement and the top clearance (1661 mm)', [tt.includes('سرعة قطع المنظم'), tt.includes('شوط المخفف الأدنى'), tt.includes('أقصى حركة صاعدة للكابينة'), tt.includes('الخلوص العلوي الأدنى فوق سقف الكابينة'), /1[,٬]?661/.test(tt), tt.includes('خلوص قمة ثقل الموازنة')], [true, true, true, true, true, true]);
w.document.getElementById('a1_m').value = '2'; w.calcResult('asmea17'); tt = txt(w, 'a1_results');
check('the clearance page lists the machine room headroom and the pit refuge', [tt.includes('الارتفاع الحر لغرفة الماكينة'), tt.includes('حيز الأمان في الحفرة'), tt.includes('مقبول')], [true, true, true]);
check('other reference codes open it too', others('asmea17', 'a1_results'), [true, true, true]);
}
// ---------- part 165: NEC 2008 Article 314 (`necbox`: box fill 314.16 and pull boxes 314.28) ----------
{
w = boot('ae'); doc = w.document;
const Z = {18: 0, 16: 0, 14: 0, 12: 0, 10: 0, 8: 0, 6: 0};
const B0 = {mode: 0, box: 4, vol: 300, cnt: Z, clamp: false, studs: 0, yokes: 0, gangs: 0, devAwg: 14, eg: false, egAwg: 14, eg2: false, egAwg2: 14};
const B1 = {mode: 1, type: 0, big: 53, len: 600, wid: 400, r1: '78, 53, 53', r2: '', r3: '', sa: 53, sb: 53, sp: 400};
const nb = (o, B) => w.eval('nbCalc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
const f0 = o => nb(o, B0), f1 = o => nb(o, B1);
const cnt = c => Object.assign({}, Z, c);
check('Table 314.16(B): one conductor of 18, 16, 14, 12, 10, 8, 6 AWG needs 24.6, 28.7, 32.8, 36.9, 41.0, 49.2, 81.9 cm3', [18, 16, 14, 12, 10, 8, 6].map(a => f0({cnt: cnt({[a]: 1})}).cond), [24.6, 28.7, 32.8, 36.9, 41.0, 49.2, 81.9], 1e-9);
check('six 12 AWG (221.4) + one clamp (36.9) + one device yoke on 12 AWG (2 x 36.9 = 73.8) + one 12 AWG grounding conductor (36.9) = 369.0 cm3 in the 344 cm3 square box: too small, margin -25', [f0({cnt: cnt({12: 6}), clamp: true, yokes: 1, devAwg: 12, eg: true, egAwg: 12}).cond, f0({cnt: cnt({12: 6}), clamp: true, yokes: 1, devAwg: 12, eg: true, egAwg: 12}).total, f0({cnt: cnt({12: 6}), clamp: true, yokes: 1, devAwg: 12, eg: true, egAwg: 12}).ok, f0({cnt: cnt({12: 6}), clamp: true, yokes: 1, devAwg: 12, eg: true, egAwg: 12}).margin], [221.4, 369, false, -25], 1e-9);
check('the smallest listed box with at least 369 cm3 is the FD multiple cover/gang 395 cm3 (index 23); the 100 x 54 square (497) passes with margin 128', [f0({cnt: cnt({12: 6}), clamp: true, yokes: 1, devAwg: 12, eg: true, egAwg: 12}).minBox, f0({cnt: cnt({12: 6}), clamp: true, yokes: 1, devAwg: 12, eg: true, egAwg: 12, box: 5}).ok, f0({cnt: cnt({12: 6}), clamp: true, yokes: 1, devAwg: 12, eg: true, egAwg: 12, box: 5}).margin], [23, true, 128], 1e-9);
check('clamp and support fittings use the largest conductor present: 2 x 14 AWG + 1 x 12 AWG = 102.5, clamp 36.9, two fitting types 73.8, 14 AWG grounding 32.8 = 246.0', [f0({cnt: cnt({14: 2, 12: 1}), clamp: true, studs: 2, eg: true, egAwg: 14}).cond, f0({cnt: cnt({14: 2, 12: 1}), clamp: true, studs: 2, eg: true, egAwg: 14}).clamp, f0({cnt: cnt({14: 2, 12: 1}), clamp: true, studs: 2, eg: true, egAwg: 14}).studs, f0({cnt: cnt({14: 2, 12: 1}), clamp: true, studs: 2, eg: true, egAwg: 14}).total], [102.5, 36.9, 73.8, 246], 1e-9);
check('a larger grounding conductor sets the clamp allowance: 2 x 14 AWG with a 10 AWG grounding conductor: clamp 41.0', [f0({cnt: cnt({14: 2}), clamp: true, eg: true, egAwg: 10}).clamp, f0({cnt: cnt({14: 2}), clamp: true, eg: true, egAwg: 10}).total], [41, 65.6 + 41 + 41], 1e-9);
check('devices: 2 yokes and 1 extra gang on 14 AWG = 2 x 3 x 32.8 = 196.8; a second set of grounding conductors adds its own allowance: 12 AWG + 10 AWG = 77.9', [f0({yokes: 2, gangs: 1, devAwg: 14}).dev, f0({eg: true, egAwg: 12, eg2: true, egAwg2: 10}).eg], [196.8, 77.9], 1e-9);
check('marked box volume: 369 cm3 equals the requirement (passes), 368.9 fails; 369 cm3 = 22.52 in3; conductor count 3 + 2 = 5', [f0({cnt: cnt({12: 6}), clamp: true, yokes: 1, devAwg: 12, eg: true, egAwg: 12, box: -1, vol: 369}).ok, f0({cnt: cnt({12: 6}), clamp: true, yokes: 1, devAwg: 12, eg: true, egAwg: 12, box: -1, vol: 368.9}).ok, +f0({cnt: cnt({12: 6}), clamp: true, yokes: 1, devAwg: 12, eg: true, egAwg: 12}).in3.toFixed(2), f0({cnt: cnt({14: 3, 12: 2})}).n], [true, false, 22.52, 5], 1e-9);
check('a volume above every listed box has no suggestion', f0({cnt: cnt({6: 10})}).minBox, -1);
check('straight pull: 8 x 53 = 424 mm (16 in); 78 -> 624 mm (24 in); 129 -> 1032 mm (40 in); 423 mm fails', [53, 78, 129].map(big => f1({big}).min).concat([53, 78, 129].map(big => f1({big}).minIn), [f1({len: 424}).ok, f1({len: 423}).ok]), [424, 624, 1032, 16, 24, 40, true, false], 1e-9);
check('angle pull: row 78, 53, 53 -> 6 x 78 + 53 + 53 = 574 mm (22 in); the maximum over rows 574 and 618 (single 103 -> 6 x 103) is 618 mm', [f1({type: 1}).min, f1({type: 1}).minIn, f1({type: 1, r2: '103'}).min, f1({type: 1, r2: '103', r3: '35 35 35 35'}).min, f1({type: 1, r2: '103'}).rows.length], [574, 22, 618, 618, 2], 1e-9);
check('row with four 35 mm raceways: 6 x 35 + 105 = 315 mm; Arabic comma separator: 53، 53 -> 371; value outside the table 60 -> 360 mm and 14.17 in', [f1({type: 1, r1: '35,35,35,35'}).min, f1({type: 1, r1: '53،53'}).min, f1({type: 1, r1: '60'}).min, +f1({type: 1, r1: '60'}).minIn.toFixed(2)], [315, 371, 360, 14.17], 1e-9);
check('angle pull verdict at the limit: 574 mm passes, 573 fails; no entered rows fails', [f1({type: 1, len: 574}).ok, f1({type: 1, len: 573}).ok, f1({type: 1, r1: ''}).ok, f1({type: 1, r1: ''}).min], [true, false, false, 0]);
check('entries carrying the same conductors: 6 x the larger raceway (53 and 78 -> 468 mm); 468 passes, 467 fails; boxes over 1.8 m in any dimension need cabled or racked conductors', [f1({type: 1, sb: 78}).spacing, f1({type: 1, sb: 78, sp: 468}).spacingOk, f1({type: 1, sb: 78, sp: 467}).spacingOk, f1({len: 1801}).racked, f1({len: 1800, wid: 1800}).racked, f1({wid: 1900}).racked], [468, true, false, true, false, true]);
for (let k = 0; k < 2; k++) { w.renderCalc('necbox'); w.document.getElementById('nb_m').value = String(k); w.calcResult('necbox'); }
w.renderCalc('necbox'); w.calcResult('necbox');
let tt = txt(w, 'nb_results');
check('the page opens with the box fill: required volume, box volume, smallest box and the 🔴 note', [tt.includes('الحجم المطلوب'), tt.includes('حجم العلبة'), tt.includes('أصغر علبة مناسبة'), tt.includes('🔴'), w.document.getElementById('nb_g0').style.display, w.document.getElementById('nb_g1').style.display], [true, true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('nb_c12', '6'); set('nb_cl', '1'); set('nb_yk', '1'); set('nb_da', '12'); set('nb_eg', '1'); set('nb_ea', '12'); w.calcResult('necbox'); tt = txt(w, 'nb_results');
check('369 cm3 required in the 344 cm3 box: the page reports the shortfall and suggests a 395 cm3 box', [/369/.test(tt), tt.includes('العلبة غير كافية'), tt.includes('FD multiple cover/gang')], [true, true, true]);
set('nb_m', '1'); w.calcResult('necbox'); tt = txt(w, 'nb_results');
check('the straight pull page shows 424 mm; the angle pull page shows the rows, 574 mm and the spacing', [tt.includes('424'), tt.includes('أقل طول للعلبة في السحب المستقيم')], [true, true]);
set('nb_ty', '1'); w.calcResult('necbox'); tt = txt(w, 'nb_results');
check('angle pull default 78, 53, 53 -> 574 mm in the 600 mm box passes', [tt.includes('574'), tt.includes('أقل مسافة بين المدخل والجدار المقابل'), tt.includes('أقل مسافة بين مدخلين')], [true, true, true]);
check('other reference codes open it too', others('necbox', 'nb_results'), [true, true, true]);
}
// ---------- part 166: NEC 2008 Article 625 (`necev`: EV charging circuit, disconnect, ventilation, heights) ----------
{
w = boot('ae'); doc = w.document;
const B = {sys: 2, I: 32, N: 1, nc: 0, ind: true, h: 900, len: 5, cms: false, vent: false};
const ev = o => w.eval('evCalc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
check('32 A at 240 V single phase: continuous 125 % = 40 A, feeder and branch breaker 40 A, 7.68 kVA; no disconnect (32 A, 120 V to ground) and no plug and cord (240 V)', [ev({}).cont, ev({}).min, ev({}).ocpd, ev({}).each, ev({}).kva, ev({}).disc, ev({}).cord], [40, 40, 40, 40, 7.68, false, false], 1e-9);
check('three 48 A units on one feeder: 1.25 x 144 = 180 A -> 200 A standard; each branch 60 A; 208 V three phase 48 A = 208 x 48 x 1.732 = 17.293 kVA each, 51.878 total', [ev({N: 3, I: 48, sys: 4}).cont, ev({N: 3, I: 48, sys: 4}).ocpd, ev({N: 3, I: 48, sys: 4}).each, ev({N: 3, I: 48, sys: 3}).kva, ev({N: 3, I: 48, sys: 3}).kvaTotal], [180, 200, 60, 9984 * Math.sqrt(3) / 1000, 3 * 9984 * Math.sqrt(3) / 1000], 1e-9);
check('non-continuous loads on the same feeder are added after the 125 %: +10 A -> 190 -> 200 A; +30 A -> 210 -> 225 A', [ev({N: 3, I: 48, nc: 10}).min, ev({N: 3, I: 48, nc: 10}).ocpd, ev({N: 3, I: 48, nc: 30}).min, ev({N: 3, I: 48, nc: 30}).ocpd], [190, 200, 210, 225], 1e-9);
check('the standard rating at the boundary: 2 x 60 A = 150 A exactly -> 150; each 60 A branch 75 -> 80; 10 A -> 12.5 -> 15; 7500 A is above the last standard rating', [ev({N: 2, I: 60}).ocpd, ev({I: 60}).each, ev({I: 10}).each, ev({N: 10, I: 600}).ocpd], [150, 80, 15, null]);
check('disconnecting means: 80 A yes (above 60 A); 60 A at 208Y/120 single phase no; 60 A at 480Y/277 yes (above 150 V to ground); 240 V three phase yes', [ev({I: 80}).disc, ev({I: 60, sys: 1}).disc, ev({I: 60, sys: 5}).disc, ev({I: 30, sys: 4}).disc], [true, false, true, true]);
check('cord and plug only 125 V single phase 15 or 20 A', [ev({sys: 0, I: 15}).cord, ev({sys: 0, I: 20}).cord, ev({sys: 0, I: 21}).cord, ev({sys: 2, I: 15}).cord], [true, true, false, false]);
check('ventilation from Table 625.29(D)(1): 24 A at 240 V single phase -> 30 A branch -> 4.2 m3/min; 80 A at 480 V three phase -> 100 A -> 48; 32 A at 240 V -> 40 A -> 5.6', [ev({I: 24}).vent1, ev({I: 80, sys: 5}).vent1, ev({}).vent1].concat([ev({I: 24}).fromTable, ev({I: 80, sys: 5}).fromTable]), [4.2, 48, 5.6, true, true], 1e-9);
check('ventilation by formula outside the tables: 36 A -> 45 A branch at 240 V = 240 x 45 / 1718 = 6.286 m3/min (221.8 cfm); three phase 208 V: 1.732 x 208 x 45 / 1718 = 9.436 (332.9 cfm); 120 V at 200 A has no table value: 13.97', [ev({I: 36}).vent1, ev({I: 36}).cfm1, ev({I: 36, sys: 3}).vent1, ev({I: 36, sys: 3}).cfm1, ev({I: 150, sys: 0}).vent1, ev({I: 36}).fromTable], [240 * 45 / 1718, 240 * 45 / 48.7, 1.732 * 208 * 45 / 1718, 1.732 * 208 * 45 / 48.7, 120 * 200 / 1718, false], 1e-9);
check('three units charging together need three times the per-vehicle ventilation: 3 x 4.2 = 12.6', ev({I: 24, N: 3}).ventTotal, 12.6, 1e-9);
const tab = JSON.parse(w.eval('JSON.stringify([EV_VT, EV_SYS])')), bad = [];
tab[0].forEach(row => row[1].forEach((x, c) => { if (x !== null) { const s = tab[1][c], f = (s[2] === 3 ? 1.732 : 1) * s[1] * row[0] / 1718; if (x / f < 0.94 || x / f > 1.06) bad.push(row[0] + '/' + c); } }));
check('every Table 625.29(D)(1) value agrees with V x A / 1718 (x 1.732 for three phase) within 6 %', bad, []);
check('coupling height: indoor 450 - 1200 mm, outdoor 600 - 1200 mm', [449, 450, 1200, 1201].map(h => ev({h}).heightOk).concat([599, 600].map(h => ev({h, ind: false}).heightOk)), [false, true, true, false, false, true]);
check('cable length 7.5 m or less; longer only with a cable management system', [ev({len: 7.5}).cableOk, ev({len: 7.6}).cableOk, ev({len: 7.6, cms: true}).cableOk], [true, false, true]);
for (let k = 0; k < 2; k++) { w.renderCalc('necev'); w.calcResult('necev'); }
let tt = txt(w, 'ev_results');
check('the page opens with the continuous load, the disconnect, the ventilation and the 🔴 note', [tt.includes('الحمل المستمر'), tt.includes('وسيلة الفصل'), tt.includes('التهوية الميكانيكية لكل مركبة'), tt.includes('🔴'), tt.includes('غير مطلوبة')], [true, true, true, true, true]);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('ev_sy', '5'); set('ev_i', '80'); set('ev_vn', '1'); w.calcResult('necev'); tt = txt(w, 'ev_results');
check('480 V 80 A: the disconnect is required, 48 m3/min and the ventilation is flagged', [tt.includes('مطلوبة'), /48/.test(tt), tt.includes('مطلوبة لأن المعدّة موسومة')], [true, true, true]);
check('other reference codes open it too', others('necev', 'ev_results'), [true, true, true]);
}
// ---------- part 167: NEC 2008 Article 680 (`necpool`: pool clearances, boxes, bonding, heater, spa) ----------
{
w = boot('ae'); doc = w.document;
const B0 = {mode: 0, oc: 0, ow: 7.5, ot: 5.2, oh: 3.5, rp: 3.2, rc: false, ro: 2.0, rd: 3.0, rh: 1.2, lh: 4.0, li: false, lg: false};
const B1 = {mode: 1, sw: 2.0, sb: false, ou: 3.5, jb: 1.5, jbb: false, jh: 250, jd: 0, md: 2.0, mb: false, ug: 2.0, um: 0, uc: 150};
const B2 = {mode: 2, sh: 0, sa: 80, ln: 10, wd: 5, op: 30, wh: 70, wa: 6000, lv: 12, ld: 500, ll: false};
const B3 = {mode: 3, sr: 2.5, sl: 3.8, sg: false, ss: 2.0, se: 2.0, dw: false, sc: 4.0, sf: 1.5};
const np = (o, B) => w.eval('npCalc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
const m0 = o => np(o, B0), m1 = o => np(o, B1), m2 = o => np(o, B2), m3 = o => np(o, B3);
const oks = r => r.rows.map(x => x.ok);
const flip = (n, i) => Array.from({length: n}, (_, k) => k !== i);
check('default pool layout passes every row', [oks(m0({})), oks(m1({})), oks(m2({})), oks(m3({}))], [flip(8, -1), flip(6, -1), flip(4, -1), flip(6, -1)]);
check('Table 680.8: to the water 6.9 / 7.5 / 8.0 m and to the tower 4.4 / 5.2 / 5.5 m by conductor class; each limit passes at the value and fails 0.01 m below', [[0, 6.9], [1, 7.5], [2, 8.0]].map(c => m0({oc: c[0], ow: c[1]}).rows[0].ok).concat([[0, 6.89], [1, 7.49], [2, 7.99]].map(c => m0({oc: c[0], ow: c[1]}).rows[0].ok), [[0, 4.4], [1, 5.2], [2, 5.5]].map(c => m0({oc: c[0], ot: c[1]}).rows[1].ok), [[0, 4.39], [1, 5.19], [2, 5.49]].map(c => m0({oc: c[0], ot: c[1]}).rows[1].ok)), [true, true, true, false, false, false, true, true, true, false, false, false]);
check('a 7.5 m conductor passes class 0 and 1 but not the over 15 kV class (8.0)', [0, 1, 2].map(oc => m0({oc}).rows[0].ok), [true, true, false]);
check('horizontal limit 3 m; pump receptacle 3.0 m (1.83 m when single, locking, grounded and GFCI); other receptacles 1.83 m', [m0({oh: 2.99}).rows[2].ok, m0({rp: 2.99}).rows[3].ok, m0({rp: 1.83, rc: true}).rows[3].ok, m0({rp: 1.82, rc: true}).rows[3].ok, m0({ro: 1.83}).rows[4].ok, m0({ro: 1.82}).rows[4].ok], [false, false, true, false, true, false]);
check('dwelling receptacle between 1.83 and 6.0 m, at most 2.0 m high', [1.82, 1.83, 6.0, 6.01].map(rd => m0({rd}).rows[5].ok).concat([2.0, 2.01].map(rh => m0({rh}).rows[6].ok)), [false, true, true, false, true, false]);
check('luminaires: outdoors 3.7 m; indoors 2.3 m only when totally enclosed or listed and GFCI-protected', [m0({lh: 3.7}).rows[7].ok, m0({lh: 3.69}).rows[7].ok, m0({lh: 2.3, li: true, lg: true}).rows[7].ok, m0({lh: 2.29, li: true, lg: true}).rows[7].ok, m0({lh: 2.5, li: true}).rows[7].ok, m0({lh: 2.5, lg: true}).rows[7].ok], [true, false, true, false, false, false]);
check('switches 1.5 m unless separated or listed; other outlets 3.0 m; junction boxes 1.2 m unless separated; maintenance disconnect 1.5 m unless a 1.5 m reach path barrier', [m1({sw: 1.49}).rows[0].ok, m1({sw: 1.49, sb: true}).rows[0].ok, m1({ou: 2.99}).rows[1].ok, m1({jb: 1.19}).rows[2].ok, m1({jb: 1.19, jbb: true}).rows[2].ok, m1({md: 1.49}).rows[4].ok, m1({md: 1.49, mb: true}).rows[4].ok], [false, true, false, false, true, false, true]);
check('junction box bottom: the greater of 100 mm above the deck or 200 mm above the maximum water level: deck level with the water 200, deck 100 mm above 100, deck 150 above 100, deck 100 mm below 300', [m1({}).jbReq, m1({jd: 100}).jbReq, m1({jd: 150}).jbReq, m1({jd: -100}).jbReq, m1({jh: 199}).rows[3].ok, m1({jh: 200}).rows[3].ok, m1({jh: 299, jd: -100}).rows[3].ok, m1({jh: 100, jd: 100}).rows[3].ok], [200, 100, 100, 300, false, true, false, true]);
check('underground wiring: at 1.5 m or more allowed; within 1.5 m only metal or nonmetallic raceways with Table 680.10 cover 150 (metal) or 450 mm; other approved raceways not allowed', [m1({ug: 1.49}).rows[5].ok, m1({ug: 1.49, uc: 149}).rows[5].ok, m1({ug: 1.49, um: 1, uc: 449}).rows[5].ok, m1({ug: 1.49, um: 1, uc: 450}).rows[5].ok, m1({ug: 1.49, um: 2, uc: 900}).rows[5].ok, m1({ug: 1.5, um: 2, uc: 0}).rows[5].ok, m1({um: 0}).cover, m1({um: 1}).cover, m1({um: 2}).cover], [true, false, false, true, false, true, 150, 450, 450]);
check('copper grid for an encapsulated shell: 80 m2 x 2 / 0.3 = 533.3 m; none when the steel is bonded; perimeter conductor at 0.5 m: 2 x (10 + 5) + 4 = 34 m; four bonding points (none for a nonconductive shell)', [m2({sh: 1}).grid, m2({}).grid, m2({}).perim, m2({}).points, m2({sh: 1}).points, m2({sh: 2}).points], [80 * 2 / 0.3, 0, 34, 4, 4, 0], 1e-9);
check('feeder grounding conductor Table 250.122 with a 12 AWG minimum: 15 A -> table 14 -> 12; 20 -> 12; 30 -> 10; 70 -> 100 A row -> 8; 2000 -> 250; 6000 -> 800; 7000 -> none', [15, 20, 30, 70, 2000, 6000, 7000].map(op => m2({op}).egc), ['12', '12', '10', '8', '250', '800', null]);
check('the table size before the minimum: 15 A -> 14, 30 A -> 10', [m2({op: 15}).egcTab, m2({op: 30}).egcTab], ['14', '10']);
check('electric pool heater: 70 A -> 2 elements of 35 A, branch 125 % = 87.5 A total, 43.75 -> 45 A protection; 48 A -> 1 element, 60 A; 49 A -> 2 elements, 30.6 -> 35 A; 97 A -> 3 elements, 40.4 -> 45 A', [m2({}).nEl, m2({}).each, m2({}).heatMin, m2({}).heatOcpd, m2({wh: 48}).nEl, m2({wh: 48}).heatOcpd, m2({wh: 49}).nEl, m2({wh: 49}).heatOcpd, m2({wh: 97}).nEl, m2({wh: 97}).heatOcpd, m2({wh: 0}).nEl], [2, 35, 87.5, 45, 1, 60, 2, 35, 3, 45, 0], 1e-9);
check('water bond area 5806 mm2 (9 in2); underwater luminaire at most 150 V, GFCI above 15 V; top of lens 450 mm below the water (100 mm for luminaires listed for it, never less than 100)', [m2({wa: 5806}).rows[1].ok, m2({wa: 5805}).rows[1].ok, m2({lv: 150}).rows[2].ok, m2({lv: 151}).rows[2].ok, m2({lv: 15}).gfci, m2({lv: 16}).gfci, m2({ld: 450}).rows[3].ok, m2({ld: 449}).rows[3].ok, m2({ld: 449, ll: true}).rows[3].ok, m2({ld: 99, ll: true}).rows[3].ok, m2({ll: true}).depthMin, m2({}).depthMin], [true, false, true, false, false, true, true, false, true, false, 100, 450]);
check('spa and hot tub: receptacle 1.83 - 3.0 m; luminaires 3.7 m (2.3 m with GFCI); switches 1.5 m; emergency switch 1.5 m except one-family dwellings; cord at most 4.6 m; flexible conduit at most 1.8 m', [m3({sr: 1.83}).rows[0].ok, m3({sr: 1.82}).rows[0].ok, m3({sr: 3.0}).rows[0].ok, m3({sr: 3.01}).rows[0].ok, m3({sl: 3.7}).rows[1].ok, m3({sl: 3.69}).rows[1].ok, m3({sl: 2.3, sg: true}).rows[1].ok, m3({sl: 2.29, sg: true}).rows[1].ok, m3({ss: 1.49}).rows[2].ok, m3({se: 1.49}).rows[3].ok, m3({se: 1.0, dw: true}).rows[3].ok, m3({sc: 4.6}).rows[4].ok, m3({sc: 4.61}).rows[4].ok, m3({sf: 1.8}).rows[5].ok, m3({sf: 1.81}).rows[5].ok], [true, false, true, false, true, false, true, false, false, false, true, true, false, true, false]);
for (let k = 0; k < 4; k++) { w.renderCalc('necpool'); w.document.getElementById('np_m').value = String(k); w.calcResult('necpool'); }
w.renderCalc('necpool'); w.calcResult('necpool');
let tt = txt(w, 'np_results');
check('the page opens with the clearance rows and the 🔴 note; only the first group is visible', [tt.includes('الخلوص إلى الماء'), tt.includes('مقبس مضخة التدوير'), tt.includes('🔴'), w.document.getElementById('np_g0').style.display, w.document.getElementById('np_g3').style.display], [true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('np_m', '1'); w.calcResult('np_results' && 'necpool'); tt = txt(w, 'np_results');
check('the switch page shows the junction box height rule and the cover table', [tt.includes('ارتفاع أسفل العلبة فوق الأرضية'), tt.includes('أدنى غطاء للتمديد')], [true, true]);
set('np_m', '2'); w.calcResult('necpool'); tt = txt(w, 'np_results');
check('the bonding page shows the feeder grounding conductor (10 AWG for 30 A), the heater and the GFCI item', [tt.includes('موصل تأريض المغذّي'), tt.includes('10 AWG'), tt.includes('سخان الماء'), tt.includes('حماية GFCI للمصابيح')], [true, true, true, true]);
set('np_m', '3'); w.calcResult('necpool'); tt = txt(w, 'np_results');
check('the spa page shows the emergency switch', tt.includes('مفتاح الطوارئ'), true);
check('other reference codes open it too', others('necpool', 'np_results'), [true, true, true]);
}
// ---------- part 168: NEC 2008 Article 110 (`necwork`: working space about electrical equipment) ----------
{
w = boot('ae'); doc = w.document;
const L0 = {mode: 0, vg: 230, c: 1, dep: 1000, ew: 600, wid: 800, eh: 1900, hd: 2300, door: true, ra: 400, en: 1, ex: 0, ed: 1000, ew1: 700, eh1: 2100, hh: 1800};
const H0 = {mode: 1, vg: 6350, kv: 11, c: 1, dep: 1300, wid: 1000, hd: 2300, el: 3.0, fd: 3.1, fh: 2.1, fx: 0, ew1: 700, eh1: 2100};
const wk = (o, B) => w.eval('wkCalc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
const l = o => wk(o, L0), h = o => wk(o, H0);
const oks = r => r.rows.map(x => x.ok);
check('defaults pass every row (five rows up to 600 V, seven above)', [oks(l({})), oks(h({}))], [[true, true, true, true, true], [true, true, true, true, true, true, true]]);
check('Table 110.26(A)(1): 0 - 150 V 914 mm in every condition; 151 - 600 V 914, 1070, 1220 mm for conditions 1, 2, 3', [120, 150].map(vg => [1, 2, 3].map(c => l({vg, c}).dep)).concat([[151, 230, 600].map(vg => [1, 2, 3].map(c => l({vg, c}).dep))]), [[914, 914, 914], [914, 914, 914], [[914, 1070, 1220], [914, 1070, 1220], [914, 1070, 1220]]]);
check('depth verdict at the limit: condition 2 at 230 V needs 1070 mm; 1069 fails', [l({c: 2, dep: 1070}).rows[0].ok, l({c: 2, dep: 1069}).rows[0].ok, l({c: 3, dep: 1220}).rows[0].ok], [true, false, true]);
check('width: the equipment width or 762 mm whichever is greater: 600 mm equipment needs 762; 1000 mm needs 1000; 761 fails', [l({}).wid, l({ew: 1000}).wid, l({wid: 762}).rows[1].ok, l({wid: 761}).rows[1].ok, l({ew: 1000, wid: 999}).rows[1].ok], [762, 1000, true, false, false]);
check('headroom: 2000 mm or the equipment height when taller; 1999 fails; 90 degree door opening required', [l({}).head, l({eh: 2200}).head, l({hd: 2000}).rows[2].ok, l({hd: 1999}).rows[2].ok, l({eh: 2200, hd: 2199}).rows[2].ok, l({door: false}).rows[3].ok], [2000, 2200, true, false, false, false]);
check('handle height at most 2.0 m', [l({hh: 2000}).rows[4].ok, l({hh: 2001}).rows[4].ok], [true, false]);
check('large equipment (1200 A or more and wider than 1.8 m) needs the entrance rule; 1199 A or 1800 mm is not large', [l({ra: 1200, ew: 1801}).large, l({ra: 1199, ew: 1801}).large, l({ra: 1200, ew: 1800}).large, l({ra: 1200, ew: 1801}).rows.length, l({}).rows.length], [true, false, false, 6, 5]);
const big = o => l(Object.assign({ra: 1200, ew: 1801, wid: 1801}, o)).rows[4].ok;
check('entrances for large equipment: two entrances 610 x 2000 pass; 609 wide or 1999 high fail; a single entrance needs unobstructed egress or double depth (2 x 914 = 1828 mm) with the entrance at least 914 mm from the equipment', [big({en: 2, ew1: 610, eh1: 2000}), big({en: 2, ew1: 609}), big({en: 2, eh1: 1999}), big({en: 1}), big({en: 1, ex: 1}), big({en: 1, ex: 2, dep: 1828, ed: 914}), big({en: 1, ex: 2, dep: 1827, ed: 914}), big({en: 1, ex: 2, dep: 1828, ed: 913})], [true, false, false, false, true, true, false, false]);
check('Table 110.34(A): 601 - 2500 V 900 / 1200 / 1500; 2501 - 9000 V 1200 / 1500 / 1800; 9001 - 25000 V 1500 / 1800 / 2800; 25001 V - 75 kV 1800 / 2500 / 3000; above 75 kV 2500 / 3000 / 3700', [2500, 9000, 25000, 75000, 138000].map(vg => [1, 2, 3].map(c => h({vg, c}).dep)), [[900, 1200, 1500], [1200, 1500, 1800], [1500, 1800, 2800], [1800, 2500, 3000], [2500, 3000, 3700]]);
check('band boundaries: 2501 V -> second band, 9001 -> third, 25001 -> fourth, 75001 -> fifth (condition 1)', [2501, 9001, 25001, 75001].map(vg => h({vg}).dep), [1200, 1500, 1800, 2500]);
check('high voltage verdicts: width 914 mm, height 2000 mm, depth at the limit (6350 V condition 1 = 1200 mm)', [h({wid: 914}).rows[2].ok, h({wid: 913}).rows[2].ok, h({hd: 2000}).rows[1].ok, h({hd: 1999}).rows[1].ok, h({dep: 1200}).rows[0].ok, h({dep: 1199}).rows[0].ok], [true, false, true, false, true, false]);
check('Table 110.34(E): up to 7.5 kV 2.8 m; to 35 kV 2.9 m; above 35 kV 2.9 m + 9.5 mm per kV over 35: 69 kV -> 3.223 m, 138 kV -> 3.8785 m', [7.5, 7.6, 35, 69, 138].map(kv => h({kv}).elev), [2.8, 2.9, 2.9, 2.9 + 0.0095 * 34, 2.9 + 0.0095 * 103], 1e-9);
check('unguarded live parts: 3.0 m passes at 11 kV (2.9) and fails at 7.5 kV only if below 2.8', [h({el: 2.9}).rows[3].ok, h({el: 2.89}).rows[3].ok, h({kv: 7.5, el: 2.8}).rows[3].ok, h({kv: 7.5, el: 2.79}).rows[3].ok], [true, false, true, false]);
check('Table 110.31 fence distance: up to 13.799 kV 3.05 m; 13.8 - 230 kV 4.57 m; above 230 kV 5.49 m', [13.799, 13.8, 230, 231].map(kv => h({kv}).fence), [3.05, 4.57, 4.57, 5.49], 1e-9);
check('fence distance verdict at 11 kV: 3.05 m passes, 3.04 fails; fence 2.1 m, or 1.8 m of fabric with 0.3 m of barbed wire', [h({fd: 3.05}).rows[4].ok, h({fd: 3.04}).rows[4].ok, h({fh: 2.1}).rows[5].ok, h({fh: 2.09}).rows[5].ok, h({fh: 1.8, fx: 0.3}).rows[5].ok, h({fh: 1.8, fx: 0.29}).rows[5].ok], [true, false, true, false, true, false]);
check('entrance 610 mm wide and 2000 mm high above 600 V', [h({ew1: 610, eh1: 2000}).rows[6].ok, h({ew1: 609}).rows[6].ok, h({eh1: 1999}).rows[6].ok], [true, false, false]);
for (let k = 0; k < 2; k++) { w.renderCalc('necwork'); w.document.getElementById('wk_m').value = String(k); w.calcResult('necwork'); }
w.renderCalc('necwork'); w.calcResult('necwork');
let tt = txt(w, 'wk_results');
check('the page opens with the working space rows, the dedicated space item and the 🔴 note', [tt.includes('عمق حيز العمل'), tt.includes('حيز المعدّة المخصَّص'), tt.includes('🔴'), w.document.getElementById('wk_g0').style.display, w.document.getElementById('wk_g1').style.display], [true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('wk_c', '2'); set('wk_d', '1000'); w.calcResult('necwork'); tt = txt(w, 'wk_results');
check('condition 2 at 230 V raises the requirement to 1,070 mm and the 1,000 mm depth fails', [/1[,٬]?070/.test(tt), tt.includes('✘')], [true, true]);
set('wk_m', '1'); w.calcResult('necwork'); tt = txt(w, 'wk_results');
check('the high voltage page shows the unguarded live parts, the fence distance and the voltage between phases', [tt.includes('ارتفاع الأجزاء الحية غير المحمية فوق حيز العمل'), tt.includes('المسافة من السور إلى الأجزاء الحية'), tt.includes('الجهد بين الأطوار'), w.document.getElementById('wk_g1').style.display], [true, true, true, '']);
check('other reference codes open it too', others('necwork', 'wk_results'), [true, true, true]);
}
// ---------- part 169: NEC 2008 Chapter 3 wiring methods (`necwiring`: burial cover, supports, expansion, bends) ----------
{
w = boot('ae'); doc = w.document;
const B0 = {mode: 0, loc: 0, m: 0, ckt: 0, cover: 600};
const B1 = {mode: 1, type: 2, d: 21, s: 3.0, f: 0.9, ex: false, L: 12, len: 0.4};
const B2 = {mode: 2, mat: 0, L: 30, t1: 5, t2: 45};
const B3 = {mode: 3, q: 2, e: 0, t: 0, x: 0};
const wr = (o, B) => w.eval('wrCalc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
const m0 = o => wr(o, B0), m1 = o => wr(o, B1), m2 = o => wr(o, B2), m3 = o => wr(o, B3);
check('Table 300.5 minimum cover by location (direct burial, rigid or intermediate metal conduit, nonmetallic raceway): all other locations 600 / 150 / 450; trench under 50 mm concrete 450 / 150 / 300; under a building 0; under a 102 mm slab 450 / 100 / 100; roads 600; dwelling driveways 450; airport runways 450', [0, 1, 2, 3, 4, 5, 6].map(loc => [0, 1, 2].map(m => m0({loc, m}).min)), [[600, 150, 450], [450, 150, 300], [0, 0, 0], [450, 100, 100], [600, 600, 600], [450, 450, 450], [450, 450, 450]]);
check('residential 120 V GFCI 20 A circuits and landscape lighting circuits take the shallower of the method and circuit columns (note 4): 600 -> 300, 600 -> 150, 150 stays 150; dwelling driveway 450 -> 300; trench 300 -> 150', [m0({ckt: 1}).min, m0({ckt: 2}).min, m0({m: 1, ckt: 1}).min, m0({loc: 5, ckt: 1}).min, m0({loc: 1, m: 2, ckt: 2}).min], [300, 150, 150, 300, 150]);
check('cover verdict: 600 mm passes the default; 599 fails; under a building is raceway only', [m0({}).ok, m0({cover: 599}).ok, m0({loc: 2, cover: 0}).ok, m0({loc: 2}).raceOnly, m0({}).raceOnly], [true, false, true, true, false]);
check('Table 344.30(B)(2) rigid and intermediate metal conduit: 16 - 21 mm 3.0 m; 27 mm 3.7; 35 - 41 mm 4.3; 53 - 63 mm 4.9; 78 and larger 6.1 m', [16, 21, 27, 35, 41, 53, 63, 78, 155].map(d => m1({type: 0, d}).max).concat([16, 41, 78].map(d => m1({type: 1, d}).max)), [3, 3, 3.7, 4.3, 4.3, 4.9, 4.9, 6.1, 6.1, 3, 4.3, 6.1]);
check('EMT every 3 m; Table 352.30 and 355.30 (PVC and RTRC): 16 - 27 mm 0.9 m; 35 - 53 mm 1.5 m; 63 - 78 mm 1.8 m; 91 - 129 mm 2.1 m; 155 mm 2.5 m', [16, 78, 155].map(d => m1({type: 2, d}).max).concat([16, 27, 35, 53, 63, 78, 91, 129, 155].map(d => m1({type: 3, d}).max), [27, 53, 129, 155].map(d => m1({type: 4, d}).max)), [3, 3, 3, 0.9, 0.9, 1.5, 1.5, 1.8, 1.8, 2.1, 2.1, 2.5, 0.9, 1.5, 2.1, 2.5]);
check('support spacing verdicts: EMT 3.0 passes and 3.01 fails; a 27 mm rigid conduit at 3.7 m passes the table but not the general 3.0 m rule (3.71 fails the table); PVC 21 mm at 0.9 m passes, 0.91 fails', [m1({s: 3.0}).okTable, m1({s: 3.01}).okTable, m1({type: 0, d: 27, s: 3.7}).okTable, m1({type: 0, d: 27, s: 3.7}).okStd, m1({type: 0, d: 27, s: 3.71}).okTable, m1({type: 3, s: 0.9}).okTable, m1({type: 3, s: 0.91}).okTable], [true, false, true, false, false, true, false]);
check('first support within 900 mm of a box (1.5 m when structural members do not permit); 450 mm of unbroken conduit may be unsupported', [m1({f: 0.9}).firstOk, m1({f: 0.91}).firstOk, m1({f: 1.5, ex: true}).firstOk, m1({f: 1.51, ex: true}).firstOk, m1({len: 0.45}).free, m1({len: 0.46}).free], [true, false, true, false, true, false]);
check('support count: 12 m with the first supports at 0.9 m from the boxes and 3 m spans -> (12 - 1.8) / 3 = 3.4 -> 4 spans -> 5 supports; 7.8 m exactly 2 spans -> 3; shorter than twice the distance -> 1', [m1({}).n, m1({L: 7.8}).n, m1({L: 1.5}).n, m1({L: 0}).n], [5, 3, 1, 0]);
check('PVC expansion 6.084 x 10^-5 mm/mm/C: 5 C -> 0.30 mm/m, 50 C -> 3.04, 100 C -> 6.08 (Table 352.44); 5 to 45 C over 30 m -> 2.4336 mm/m and 73.008 mm', [5, 50, 100].map(d => +m2({t1: 0, t2: d, L: 1}).perM.toFixed(2)).concat([m2({}).perM, m2({}).dL]), [0.30, 3.04, 6.08, 2.4336, 73.008], 1e-6);
check('other materials at 40 C: RTRC 2.7 x 10^-5 -> 1.08 mm/m; steel 1.17 x 10^-5 -> 0.468; aluminium 2.34 x 10^-5 -> 0.936; steel is about 0.20 and aluminium about 0.40 of PVC', [1, 2, 3].map(mat => m2({mat}).perM).concat([m2({mat: 2}).perM / m2({}).perM, m2({mat: 3}).perM / m2({}).perM]), [1.08, 0.468, 0.936, 0.1923, 0.3846], 1e-3);
check('expansion fitting needed from 6 mm (a quarter inch): 2.5 m of PVC over 40 C is 6.084 mm; 2.4 m is 5.84 mm; a falling temperature range counts as zero', [m2({L: 2.5}).need, m2({L: 2.4}).need, m2({t1: 50, t2: 10}).dT, m2({t1: 50, t2: 10}).need], [true, false, 0, false]);
check('bends between pull points: four 90 degree bends (360) pass, five bends or 405 degrees fail; mixed 90 + 2 x 45 + 3 x 30 + 15 = 285 leaves 75', [m3({q: 4}).ok, m3({q: 5}).ok, m3({q: 4, e: 1}).deg, m3({q: 4, e: 1}).left, m3({q: 1, e: 2, t: 3, x: 15}).deg, m3({q: 1, e: 2, t: 3, x: 15}).left], [true, false, 405, -45, 285, 75]);
for (let k = 0; k < 4; k++) { w.renderCalc('necwiring'); w.document.getElementById('wr_m').value = String(k); w.calcResult('necwiring'); }
w.renderCalc('necwiring'); w.calcResult('necwiring');
let tt = txt(w, 'wr_results');
check('the page opens with the minimum cover and the warning tape and the 🔴 note', [tt.includes('أدنى غطاء مطلوب'), tt.includes('شريط التحذير'), tt.includes('🔴'), w.document.getElementById('wr_g0').style.display, w.document.getElementById('wr_g2').style.display], [true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('wr_m', '1'); w.calcResult('necwiring'); tt = txt(w, 'wr_results');
check('the supports page shows the maximum spacing, the first support and the count', [tt.includes('أقصى مسافة بين المساند'), tt.includes('أول مسند من العلبة'), tt.includes('عدد المساند التقريبي')], [true, true, true]);
set('wr_m', '2'); w.calcResult('necwiring'); tt = txt(w, 'wr_results');
check('the expansion page shows 73.0 mm for 30 m of PVC and the required expansion fitting', [/73\.0/.test(tt), tt.includes('وصلة تمدد'), tt.includes('مطلوبة')], [true, true, true]);
set('wr_m', '3'); w.calcResult('necwiring'); tt = txt(w, 'wr_results');
check('the bends page shows the total 180 degrees', [tt.includes('مجموع الانحناءات'), /180/.test(tt)], [true, true]);
check('other reference codes open it too', others('necwiring', 'wr_results'), [true, true, true]);
}
// ---------- part 170: NEC 2008 Article 690 (`necpv`: PV string voltage, circuit currents, protection, grounding conductor) ----------
{
w = boot('ae'); doc = w.document;
const B0 = {mode: 0, voc: 45.5, vmp: 37.0, n: 18, tmin: -5, meth: 0, beta: -0.30, gamma: -0.40, thot: 70, vinv: 1000, mmin: 400, mmax: 800};
const B1 = {mode: 1, isc: 9.5, pm: 1, np: 3, iinv: 40};
const x9 = (o, B) => w.eval('x9Calc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
const m0 = o => x9(o, B0), m1 = o => x9(o, B1);
check('Table 690.7 factors by lowest ambient temperature: 25 -> 1.00; 24 and 20 -> 1.02; 19 -> 1.04; 14 -> 1.06; 9 -> 1.08; 4 and 0 -> 1.10; -1 and -5 -> 1.12; -6 -> 1.14; -11 -> 1.16; -16 -> 1.18; -21 -> 1.20; -26 -> 1.21; -31 -> 1.23; -36 and -40 -> 1.25; below -40 none', [25, 30, 24, 20, 19, 15, 14, 10, 9, 5, 4, 0, -1, -5, -6, -10, -11, -15, -16, -20, -21, -25, -26, -30, -31, -35, -36, -40, -41].map(t => m0({tmin: t}).factor), [1, 1, 1.02, 1.02, 1.04, 1.04, 1.06, 1.06, 1.08, 1.08, 1.10, 1.10, 1.12, 1.12, 1.14, 1.14, 1.16, 1.16, 1.18, 1.18, 1.20, 1.20, 1.21, 1.21, 1.23, 1.23, 1.25, 1.25, null], 1e-9);
check('fractional temperatures take the colder band: -0.5 C -> band -1 to -5 -> 1.12; 4.9 C -> 1.10; 24.9 -> 1.02', [-0.5, 4.9, 24.9].map(t => m0({tmin: t}).factor), [1.12, 1.10, 1.02], 1e-9);
check('45.5 V module at -5 C: 45.5 x 1.12 = 50.96 V; 18 modules = 917.28 V (within a 1000 V inverter) and the dwelling limit of 600 V is exceeded; 13 modules = 662.48 V', [m0({}).vocMax, m0({}).vsys, m0({}).ok, m0({}).dwelling, m0({n: 13}).vsys, m0({n: 13}).dwelling, m0({n: 11}).dwelling], [50.96, 917.28, true, false, 662.48, false, true], 1e-9);
check('inverter limit: at most floor(1000 / 50.96) = 19 modules; 19 modules is 968.24 V (passes), 20 is 1019.2 V (fails)', [m0({}).nMax, m0({n: 19}).ok, m0({n: 20}).ok, m0({n: 20}).vsys], [19, true, false, 1019.2], 1e-9);
check('temperature-coefficient method: -0.30 %/C from 25 to -5 C gives 1 + 0.003 x 30 = 1.09 -> 41.5 x ... 45.5 x 1.09 = 49.595 V; a warm site (35 C) never drops below 1', [m0({meth: 1}).factor, m0({meth: 1}).vocMax, m0({meth: 1, tmin: 35}).factor, m0({meth: 1, beta: 0.30}).factor], [1.09, 49.595, 1, 1.09], 1e-9);
check('hot string voltage: Vmp 37 V at 70 C with -0.40 %/C = 37 x (1 - 0.004 x 45) = 30.34 V; 18 modules = 546.12 V is in 400 - 800 V; the minimum number for 400 V is ceil(400 / 30.34) = 14', [m0({}).vmpHot, m0({}).vmpArray, m0({}).mpptOk, m0({}).nMin, m0({n: 13}).mpptOk, m0({n: 14}).mpptOk], [30.34, 546.12, true, 14, false, true], 1e-9);
check('source circuit: 125 % x 9.5 A = 11.875 A; conductor and device 125 % more = 14.84375 A (156.25 %) -> a 15 A supplementary device; 3 parallel strings give 35.625 A and 44.53125 A -> 45 A', [m1({}).src, m1({}).srcMin, m1({}).srcDev, m1({}).out, m1({}).outMin, m1({}).outDev, m1({}).factor], [11.875, 14.84375, 15, 35.625, 44.53125, 45, 1.5625], 1e-9);
check('device steps: up to 15 A in 1 A steps (10.2 A needs 11 A), above 15 A the standard sizes (16 A -> 20 A; 41 A -> 45 A); beyond 6000 A none', [m1({isc: 6.5}).srcMin, m1({isc: 6.5}).srcDev, m1({isc: 8.0}).srcMin, m1({isc: 8.0}).srcDev, m1({isc: 10.5}).srcDev, m1({isc: 18, np: 1}).srcDev, m1({iinv: 4800}).invDev, m1({iinv: 4900}).invDev], [1.25 * 1.25 * 6.5, 11, 12.5, 13, 20, 30, 6000, null], 1e-9);
check('inverter output circuit: 125 % x 40 A = 50 A -> 50 A; 55 A -> 68.75 -> 70', [m1({}).inv, m1({}).invDev, m1({iinv: 55}).invDev], [50, 50, 70], 1e-9);
check('equipment grounding conductor Table 250.122 on the device: 15 A -> 14; 45 A -> 10; 60 A -> 10; 70 A -> 8 (100 A row); a 15 A source circuit -> 14 AWG', [m1({}).egcSrc, m1({}).egcOut, m1({iinv: 40, np: 5}).egcOut, m1({np: 6}).egcOut], ['14', '10', '8', '8']);
check('module interconnection conductors with one fuse for parallel modules: fuse 15 + 125 % x 2 other strings x 9.5 = 38.75 A; single circuit has none', [m1({}).interc, m1({np: 1}).interc], [15 + 1.25 * 2 * 9.5, null], 1e-9);
check('parallel modules inside one source circuit multiply the current: 2 x 9.5 x 1.25 = 23.75 A, 29.6875 A -> 30 A', [m1({pm: 2}).src, m1({pm: 2}).srcMin, m1({pm: 2}).srcDev], [23.75, 29.6875, 30], 1e-9);
for (let k = 0; k < 2; k++) { w.renderCalc('necpv'); w.document.getElementById('x9_m').value = String(k); w.calcResult('necpv'); }
w.renderCalc('necpv'); w.calcResult('necpv');
let tt = txt(w, 'x9_results');
check('the page opens with the correction factor, the maximum string voltage and the 🔴 note; 917 V', [tt.includes('معامل التصحيح للحرارة الدنيا'), tt.includes('أقصى جهد للسلسلة'), tt.includes('🔴'), /917/.test(tt), w.document.getElementById('x9_g0').style.display, w.document.getElementById('x9_g1').style.display], [true, true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('x9_m', '1'); w.calcResult('necpv'); tt = txt(w, 'x9_results');
check('the current page shows the 156 % sizing, the source device, the grounding conductor and the interconnection conductors', [tt.includes('أقصى تيار لدارة المصدر'), tt.includes('موصل التأريض: دارة المصدر'), tt.includes('14 AWG'), tt.includes('موصلات الربط بين الألواح'), /35\.6/.test(tt)], [true, true, true, true, true]);
check('other reference codes open it too', others('necpv', 'x9_results'), [true, true, true]);
}
// ---------- part 171: NEC 2008 Article 240 (`necocpd`: conductor protection, feeder taps, transformer secondary conductors) ----------
{
w = boot('ae'); doc = w.document;
const B0 = {mode: 0, amp: 75, sm: 7, recep: false, ocpd: 80, cont: 5};
const B1 = {mode: 1, rule: 0, fdr: 400, amp: 150, len: 3, load: 120, dev: 150, leave: false, vp: 480, vs: 208, lp: 3, ls: 3, asec: 300, tot: 25, big: true, th: 9};
const B2 = {mode: 2, rule: 1, vp: 480, vs: 208, pocpd: 100, asec: 300, len: 3, load: 200, dev: 250, leave: false, isec: 280, sum: 250};
const oc = (o, B) => w.eval('ocCalc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
const m0 = o => oc(o, B0), m1 = o => oc(o, B1), m2 = o => oc(o, B2);
const oks = r => r.rows.map(x => x.ok);
check('240.4(B): a 75 A conductor may be protected by the next higher standard rating, 80 A (not for multioutlet receptacle circuits: then 70 A); a standard-rating ampacity keeps its rating (100 -> 100)', [m0({}).limit, m0({}).rule, m0({recep: true}).limit, m0({recep: true}).rule, m0({amp: 100}).limit, m0({amp: 100}).rule], [80, 'B', 70, 'prev', 100, 'std']);
check('device verdicts: 80 A on 75 A passes, 81 fails; 70 A on the receptacle circuit passes and 80 fails', [m0({ocpd: 80}).rows[0].ok, m0({ocpd: 81}).rows[0].ok, m0({recep: true, ocpd: 70}).rows[0].ok, m0({recep: true, ocpd: 80}).rows[0].ok], [true, false, true, false]);
check('800 A is the upper limit of the next-size rule: 790 A -> 800; 801 A and above need the conductor to carry the device rating: 801 -> 800, 1100 -> 1000, 1650 -> 1600', [790, 799.5, 800, 801, 810, 1100, 1650].map(amp => m0({amp}).limit), [800, 800, 800, 800, 800, 1000, 1600]);
check('rule label above 800 A is C', [m0({amp: 1100}).rule, m0({amp: 800}).rule, m0({amp: 801}).rule], ['C', 'std', 'C']);
check('small conductors 240.4(D): 18 Cu 7 A, 16 Cu 10, 14 Cu 15, 12 Al 15, 12 Cu 20, 10 Al 25, 10 Cu 30, larger none; the maximum is the smaller of the small-conductor limit and the 240.4(B) value (ampacity 40 A for all)', [0, 1, 2, 3, 4, 5, 6, 7].map(sm => m0({amp: 40, sm}).limitD), [7, 10, 15, 15, 20, 25, 30, 40]);
check('a 31 A 10 AWG copper conductor: next standard 35 but limited to 30 by 240.4(D); 25 A is a standard rating: 25 limit under 30', [m0({amp: 31, sm: 6}).limitD, m0({amp: 25, sm: 6}).limitD, m0({amp: 31, sm: 6, ocpd: 30}).rows[0].ok, m0({amp: 31, sm: 6, ocpd: 35}).rows[0].ok], [30, 25, true, false]);
check('18 AWG needs continuous loads up to 5.6 A and 16 AWG up to 8 A; larger sizes have no such row', [oks(m0({sm: 0, ocpd: 7, cont: 5.6})), oks(m0({sm: 0, ocpd: 7, cont: 5.7})), oks(m0({sm: 1, ocpd: 10, cont: 8})), oks(m0({sm: 1, ocpd: 10, cont: 8.1})), m0({sm: 2}).rows.length], [[true, true], [true, false], [true, true], [true, false], 1]);
check('an ampacity below the first standard rating with no lower rating has no device (14 A on a receptacle circuit)', [m0({amp: 14, recep: true}).limit, m0({amp: 14, recep: true}).rows[0].ok, m0({amp: 14}).limit], [null, false, 15]);
check('feeder tap not over 3 m: ampacity at least the load and the device (150 A on 120 / 150 passes; 149 fails; 160 A load fails); 3.01 m fails; 10 times rule when the tap leaves the enclosure: 400 A <= 1500', [oks(m1({})), m1({amp: 149}).rows[1].ok, m1({load: 160}).rows[1].ok, m1({len: 3.01}).rows[0].ok, m1({leave: true}).rows[2].ok, m1({leave: true, fdr: 1501}).rows[2].ok, m1({load: 160}).reqLoad], [[true, true], false, false, false, true, false, 160]);
check('25 ft rule: ampacity at least one third of the feeder device (133.33 A for 400 A: 150 passes, 133 fails); length 7.5 m; terminating device not above the ampacity', [oks(m1({rule: 1})), m1({rule: 1, amp: 133}).rows[1].ok, m1({rule: 1, amp: 133.34, dev: 133}).rows[1].ok, m1({rule: 1, len: 7.51}).rows[0].ok, m1({rule: 1, dev: 151}).rows[2].ok, m1({rule: 1}).req], [[true, true, true], false, true, false, false, 400 / 3], 1e-9);
check('transformer tap: primary one third 133.33 A; secondary (480 / 208) x 133.33 = 307.69 A needed: 300 fails, 308 passes; primary plus secondary 7.5 m; secondary device within the secondary ampacity', [m1({rule: 2}).reqSec, oks(m1({rule: 2})), oks(m1({rule: 2, asec: 308, dev: 300})), m1({rule: 2, lp: 4, ls: 3.6}).rows[0].ok, m1({rule: 2, asec: 308}).ratio], [480 / 208 * 400 / 3, [true, true, false, true], [true, true, true, true], false, 480 / 208], 1e-9);
check('high bay tap: horizontal 7.5 m and total 30 m, ampacity one third, single device, 6 AWG copper or larger, at least 9 m above the floor', [oks(m1({rule: 3})), m1({rule: 3, tot: 31}).rows[1].ok, m1({rule: 3, big: false}).rows[4].ok, m1({rule: 3, th: 8.9}).rows[5].ok, m1({rule: 3, len: 7.6}).rows[0].ok], [[true, true, true, true, true, true], false, false, false, false]);
check('secondary conductors protected by the primary device (single-phase 2-wire or delta-delta): 300 A x 208 / 480 = 130 A: 100 A passes, 131 fails', [m2({rule: 0}).max, m2({rule: 0}).rows[0].ok, m2({rule: 0, pocpd: 131}).rows[0].ok], [130, true, false], 1e-9);
check('secondary not over 3 m: ampacity at least the load and the device (250 A), 3.01 m fails; leaving the enclosure: primary device x ratio must not exceed ten times the ampacity', [oks(m2({})), m2({asec: 249}).rows[1].ok, m2({len: 3.01}).rows[0].ok, m2({leave: true}).rows[2].ok, m2({leave: true, asec: 20}).rows[2].ok, m2({}).reqLoad], [[true, true], false, false, true, false, 250]);
check('industrial secondary 7.5 m: ampacity not below the transformer rated secondary current and the device sum within the ampacity', [oks(m2({rule: 2})), m2({rule: 2, asec: 279}).rows[1].ok, m2({rule: 2, sum: 301}).rows[2].ok, m2({rule: 2, len: 7.6}).rows[0].ok], [[true, true, true], false, false, false]);
check('secondary 7.5 m one third rule: (480 / 208) x 100 / 3 = 76.92 A; 300 passes, 76 fails; terminating device 250 within 300 and 301 fails', [m2({rule: 3}).req, oks(m2({rule: 3})), m2({rule: 3, asec: 76}).rows[1].ok, m2({rule: 3, dev: 301}).rows[2].ok], [480 / 208 * 100 / 3, [true, true, true], false, false], 1e-9);
for (let k = 0; k < 3; k++) { w.renderCalc('necocpd'); w.document.getElementById('oc_m').value = String(k); w.calcResult('necocpd'); }
w.renderCalc('necocpd'); w.calcResult('necocpd');
let tt = txt(w, 'oc_results');
check('the page opens with the maximum device, the 🔴 note and only the first group', [tt.includes('أقصى قاطع مسموح للموصل'), tt.includes('🔴'), /80/.test(tt), w.document.getElementById('oc_g0').style.display, w.document.getElementById('oc_g1').style.display], [true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('oc_m', '1'); w.calcResult('necocpd'); tt = txt(w, 'oc_results');
check('the tap page shows the length and the minimum ampacity rows', [tt.includes('تفريعة حتى 3 m'), tt.includes('أدنى سعة'), tt.includes('الأقصى المسموح')], [true, true, true]);
set('oc_r1', '2'); w.calcResult('necocpd'); tt = txt(w, 'oc_results');
check('the transformer tap shows the voltage ratio 2.3 and the secondary ampacity row', [tt.includes('نسبة الجهد'), /2\.3/.test(tt), tt.includes('سعة ثانوي المحوّل')], [true, true, true]);
set('oc_m', '2'); w.calcResult('necocpd'); tt = txt(w, 'oc_results');
check('the secondary page shows the rule title and the voltage ratio', [tt.includes('240.21(C)'), tt.includes('نسبة الجهد')], [true, true]);
check('other reference codes open it too', others('necocpd', 'oc_results'), [true, true, true]);
}
// ---------- part 172: NEC 2008 Article 460 (`neccap`: capacitor conductors, disconnect, improved motor current, discharge resistor) ----------
{
w = boot('ae'); doc = w.document;
const B0 = {mode: 0, kvar: 100, v: 400, ph: 3, motor: false, amot: 100, load: false, acond: 0, imot: 100, pf1: 0.8, pf2: 0.95};
const B1 = {mode: 1, kvar: 100, v: 400, f: 50, conn: 0, r: 200000};
const cq = (o, B) => w.eval('cqCalc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
const m0 = o => cq(o, B0), m1 = o => cq(o, B1);
check('100 kvar at 400 V three phase: I = 100000 / (1.732 x 400) = 144.34 A; conductor and disconnect 135 % = 194.86 A -> 200 A standard', [m0({}).i, m0({}).cond, m0({}).disc, m0({}).discStd], [100000 / (Math.sqrt(3) * 400), 1.35 * 100000 / (Math.sqrt(3) * 400), 1.35 * 100000 / (Math.sqrt(3) * 400), 200], 1e-9);
check('single phase 10 kvar at 230 V: 43.48 A, 58.70 A -> 60 A', [m0({kvar: 10, v: 230, ph: 1}).i, m0({kvar: 10, v: 230, ph: 1}).cond, m0({kvar: 10, v: 230, ph: 1}).discStd], [10000 / 230, 1.35 * 10000 / 230, 60], 1e-9);
check('capacitor connected to the motor terminals: not less than one third of the motor circuit conductor ampacity (600 A -> 200 A governs; 300 A -> 100 A, the 135 % governs)', [m0({motor: true, amot: 600}).condMotor, m0({motor: true, amot: 300}).condMotor, m0({motor: true, amot: 600}).third, m0({motor: false, amot: 600}).condMotor], [200, 1.35 * 100000 / (Math.sqrt(3) * 400), 200, 1.35 * 100000 / (Math.sqrt(3) * 400)], 1e-9);
check('conductor verdict: 195 A passes 194.86; 194 A fails; none entered gives no verdict', [m0({acond: 195}).condOk, m0({acond: 194}).condOk, m0({}).condOk], [true, false, null]);
check('discharge time: 50 V within 1 minute up to 600 V, within 5 minutes above', [m0({}).tdis, m0({v: 600}).tdis, m0({v: 6600}).tdis], [60, 60, 300]);
check('improved power factor: 100 A x 0.80 / 0.95 = 84.21 A for the overload device; a lower factor after or above 1 is invalid', [m0({}).iNew, m0({}).pfOk, m0({pf2: 0.7}).pfOk, m0({pf2: 1}).pfOk, m0({pf2: 1.01}).pfOk], [100 * 0.8 / 0.95, true, false, true, false], 1e-9);
check('delta bank 100 kvar at 400 V, 50 Hz: C = 100000 / (3 x 314.16 x 400^2) = 663.15 uF per branch; star connection gives three times that (1989.4 uF at 230.9 V)', [m1({}).cuF, m1({conn: 1}).cuF, m1({}).vb, m1({conn: 1}).vb], [1e6 * 100000 / (3 * 2 * Math.PI * 50 * 160000), 3e6 * 100000 / (3 * 2 * Math.PI * 50 * 160000), 400, 400 / Math.sqrt(3)], 1e-6);
check('discharge resistance: R <= 60 / (C x ln(565.69 / 50)) = 37.3 kOhm; at that resistance the bank reaches 50 V in exactly 60 s; 1 % more fails', [m1({}).rmax, m1({r: m1({}).rmax}).tact, m1({r: m1({}).rmax}).ok, m1({r: m1({}).rmax * 1.01}).ok, m1({r: m1({}).rmax * 0.99}).ok], [60 / (100000 / (3 * 2 * Math.PI * 50 * 160000) * Math.log(Math.SQRT2 * 400 / 50)), 60, true, false, true], 1e-6);
check('above 600 V the allowed time is 300 s: 6600 V', [m1({v: 6600}).t, m1({v: 6600}).rmax / m1({v: 6600, f: 50}).rmax], [300, 1]);
check('the default 200 kOhm resistor is too slow (tau = 133 s): fails; power in the resistor 400^2 / 200000 = 0.8 W; 60 Hz gives a smaller capacitance', [m1({}).ok, m1({}).p, m1({f: 60}).cuF < m1({}).cuF], [false, 0.8, true], 1e-9);
for (let k = 0; k < 2; k++) { w.renderCalc('neccap'); w.document.getElementById('cq_m').value = String(k); w.calcResult('neccap'); }
w.renderCalc('neccap'); w.calcResult('neccap');
let tt = txt(w, 'cq_results');
check('the page opens with the rated current 144.3 A, the 135 % conductor and the 🔴 note', [tt.includes('التيار المقدَّر للمكثفات'), /144\.3/.test(tt), /194\.9/.test(tt), tt.includes('🔴'), w.document.getElementById('cq_g0').style.display, w.document.getElementById('cq_g1').style.display], [true, true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('cq_m', '1'); w.calcResult('neccap'); tt = txt(w, 'cq_results');
check('the discharge page shows the capacitance 663.1 uF and the maximum resistance', [/663\.1/.test(tt), tt.includes('أقصى مقاومة تفريغ')], [true, true]);
check('other reference codes open it too', others('neccap', 'cq_results'), [true, true, true]);
}
// ---------- part 173: NEC 2008 Articles 422, 424, 426, 427 (`necheat`: heating and appliance circuits, heating cables, snow melting and heat tracing) ----------
{
w = boot('ae'); doc = w.document;
const B0 = {mode: 0, v: 230, ph: 1, kw: 6, t: 0, res: true, asme: false, multi: false, marked: 0, motor: false};
const B1 = {mode: 1, v: 230, ph: 1, place: 0, wm: 20, len: 60, sp: 50, bx: 250, lm: 100};
const B2 = {mode: 2, v: 230, ph: 1, kind: 0, dens: 650, area: 20, wm: 25, len: 100, mi: false, ind: false, imp: false, vimp: 24, gfci: false};
const eh = (o, B) => w.eval('ehCalc(' + JSON.stringify(Object.assign({}, B, o)) + ')');
const m0 = o => eh(o, B0), m1 = o => eh(o, B1), m2 = o => eh(o, B2);
const oks = r => r.rows.map(x => x.ok);
check('6 kW at 230 V single phase: 26.09 A; 125 % = 32.61 A -> 35 A; 80 kW three phase 400 V: 115.47 A', [m0({}).i, m0({}).min, m0({}).ocpd, m0({kw: 80, v: 400, ph: 3}).i], [6000 / 230, 1.25 * 6000 / 230, 35, 80000 / (Math.sqrt(3) * 400)], 1e-9);
check('equipment factors: space heating, storage water heater, continuous appliance and resistance boiler 125 %; non-continuous appliance 100 %; an electrode boiler below 50 kW 125 %; 60 kW electrode boiler at 100 % = 86.60 A -> 90 A', [0, 1, 2, 3, 4, 5].map(t => m0({kw: 10, t}).f).concat([m0({kw: 60, v: 400, ph: 3, t: 5}).f, m0({kw: 60, v: 400, ph: 3, t: 5}).min, m0({kw: 60, v: 400, ph: 3, t: 5}).ocpd]), [1.25, 1.25, 1.25, 1, 1.25, 1.25, 1, 60000 / (Math.sqrt(3) * 400), 90], 1e-9);
check('resistance elements above 48 A are subdivided into loads of at most 48 A protected at 60 A or less: 15 kW at 230 V (65.22 A) -> 2 loads of 32.61 A with 45 A devices; 80 kW at 400 V -> 3 loads, 50 A devices', [m0({kw: 15}).sub, m0({kw: 15}).n, m0({kw: 15}).each, m0({kw: 15}).dev, m0({kw: 80, v: 400, ph: 3}).n, m0({kw: 80, v: 400, ph: 3}).dev], [true, 2, 15000 / 230 / 2, 45, 3, 50], 1e-9);
check('the 48 A boundary: 11.04 kW at 230 V is exactly 48 A (no subdivision); 11.05 kW needs two loads; non-resistance equipment is not subdivided', [m0({kw: 11.04}).sub, m0({kw: 11.05}).sub, m0({kw: 11.05}).n, m0({kw: 15, res: false}).sub, m0({kw: 15, res: false}).dev, m0({kw: 15, res: false}).devOk], [false, true, 2, false, 90, true]);
check('ASME-vessel boilers and listed instantaneous water heaters: loads up to 120 A with devices up to 150 A: 80 kW at 400 V (115.47 A) is one load with a 150 A device; 100 kW (144.34 A) -> 2 loads of 72.17 A with 100 A devices; a space heater gets no ASME relief (4 loads, 50 A)', [m0({kw: 80, v: 400, ph: 3, t: 4, asme: true}).sub, m0({kw: 80, v: 400, ph: 3, t: 4, asme: true}).dev, m0({kw: 80, v: 400, ph: 3, t: 4, asme: true}).devOk, m0({kw: 100, v: 400, ph: 3, t: 4, asme: true}).n, m0({kw: 100, v: 400, ph: 3, t: 4, asme: true}).dev, m0({kw: 100, v: 400, ph: 3, t: 0, asme: true}).n, m0({kw: 100, v: 400, ph: 3, t: 0, asme: true}).dev], [false, 150, true, 2, 100, 4, 50]);
check('single non-motor appliance protection (422.11(E)): unmarked up to 13.3 A -> 20 A (3 kW at 230 V, 13.04 A; device 20 A passes); over 13.3 A -> 150 % next standard (3.1 kW -> 13.48 A -> 25 A; 6 kW -> 39.1 -> 40 A); a marked 30 A rating caps a 35 A circuit', [m0({kw: 3, t: 2}).max, oks(m0({kw: 3, t: 2})), m0({kw: 3.1, t: 2}).max, m0({kw: 6, t: 2}).max, oks(m0({kw: 6, t: 2})), m0({kw: 6, t: 2, marked: 30}).max, oks(m0({kw: 6, t: 2, marked: 30}))], [20, [true, true], 25, 40, [true, true], 30, [true, false]]);
check('fixed space heating and boilers have no 422.11(E) row; multioutlet space heating circuits only 15, 20, 25 or 30 A: 3 kW (20 A) passes, 6 kW (35 A) fails', [m0({}).rows.length, m0({t: 4}).rows.length, oks(m0({kw: 3, multi: true})), oks(m0({multi: true}))], [1, 1, [true, true], [true, false]]);
check('heating cable 20 W/m x 60 m = 1.2 kW, 5.22 A, 125 % = 6.52 A -> 15 A; concrete floor: at most 54 W/m and 25 mm between runs', [m1({}).p, m1({}).i, m1({}).min, m1({}).ocpd, oks(m1({})), m1({wm: 54}).rows[0].ok, m1({wm: 54.1}).rows[0].ok, m1({sp: 25}).rows[1].ok, m1({sp: 24}).rows[1].ok], [1200, 1200 / 230, 1.25 * 1200 / 230, 15, [true, true, true, true], true, false, true, false], 1e-9);
check('ceiling cables up to 9 W/m need 38 mm between runs; above 9 W/m no spacing rule applies; boxes 200 mm and recessed luminaires 50 mm', [m1({place: 1, wm: 9}).rows.length, m1({place: 1, wm: 9, sp: 38}).rows[0].ok, m1({place: 1, wm: 9, sp: 37}).rows[0].ok, m1({place: 1, wm: 9.1}).rows.length, m1({bx: 200}).rows[2].ok, m1({bx: 199}).rows[2].ok, m1({lm: 50}).rows[3].ok, m1({lm: 49}).rows[3].ok], [3, true, false, 2, true, false, true, false]);
check('snow melting 650 W/m2 x 20 m2 = 13 kW at 230 V: 56.52 A, 125 % = 70.65 A -> 80 A; ground-fault protection of equipment required except MI cable in a noncombustible medium', [m2({}).p, m2({}).i, m2({}).min, m2({}).ocpd, m2({}).gf, m2({mi: true}).gf], [13000, 13000 / 230, 1.25 * 13000 / 230, 80, true, false], 1e-9);
check('heat tracing 25 W/m x 100 m = 2.5 kW: 10.87 A, 13.59 A -> 15 A; ground-fault protection required except in industrial plants with alarm and supervision', [m2({kind: 1}).p, m2({kind: 1}).i, m2({kind: 1}).ocpd, m2({kind: 1}).gf, m2({kind: 1, ind: true}).gf], [2500, 2500 / 230, 15, true, false], 1e-9);
check('impedance heating secondary voltage 30 V; up to 80 V with GFCI protection for personnel', [m2({imp: true}).rows.length, m2({imp: true, vimp: 30}).rows[0].ok, m2({imp: true, vimp: 31}).rows[0].ok, m2({imp: true, vimp: 31, gfci: true}).rows[0].ok, m2({imp: true, vimp: 80, gfci: true}).rows[0].ok, m2({imp: true, vimp: 81, gfci: true}).rows[0].ok, m2({}).rows.length], [1, true, false, true, true, false, 0]);
for (let k = 0; k < 3; k++) { w.renderCalc('necheat'); w.document.getElementById('eh_m').value = String(k); w.calcResult('necheat'); }
w.renderCalc('necheat'); w.calcResult('necheat');
let tt = txt(w, 'eh_results');
check('the page opens with the current 26.1 A, the minimum circuit 32.6 A and the 🔴 note', [tt.includes('التيار'), /26\.1/.test(tt), /32\.6/.test(tt), tt.includes('🔴'), w.document.getElementById('eh_g0').style.display, w.document.getElementById('eh_g1').style.display], [true, true, true, true, '', 'none']);
const set = (id, val) => { w.document.getElementById(id).value = val; };
set('eh_kw', '15'); w.calcResult('necheat'); tt = txt(w, 'eh_results');
check('15 kW resistance heater: the subdivision item with 2 loads appears', [tt.includes('تجزئة عناصر المقاومة'), tt.includes('2 حمل')], [true, true]);
set('eh_m', '1'); w.calcResult('necheat'); tt = txt(w, 'eh_results');
check('the cable page shows 1.20 kW and the spacing rows', [/1\.20/.test(tt), tt.includes('المسافة بين مسارين متجاورين')], [true, true]);
set('eh_m', '2'); w.calcResult('necheat'); tt = txt(w, 'eh_results');
check('the snow melting page shows 13.00 kW and the ground-fault item', [/13\.00/.test(tt), tt.includes('الحماية من التماس الأرضي للمعدات')], [true, true]);
check('other reference codes open it too', others('necheat', 'eh_results'), [true, true, true]);
}
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
console.log(fail ? `\n${fail} FAIL` : '\nall ok');
if (errors.length) { console.log('jsdom errors:', errors.slice(0, 5)); fail++; }
process.exit(fail ? 1 : 0);
