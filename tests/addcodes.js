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
function boot(code) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/', beforeParse(win) { try { win.localStorage.setItem('si_lang', 'ar'); if (code) win.localStorage.setItem('si_code', code); } catch (e) {} } });
  const w = dom.window; w.alert = () => {}; w.confirm = () => true; w.scrollTo = () => {};
  live.push(w); while (live.length > 4) { try { live.shift().close(); } catch (e) {} }
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
const others = (id, res) => ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc(id); x.calcResult(id); return x.document.getElementById(res).textContent.length > 250; });

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
check('development length (db = 20 mm, spacing and cover satisfied: 1.7): ld = fy psi_t psi_e db / (1.7 lambda sqrt(fc)) = 934 mm; 16 mm with the 2.1 expression: 420 x 16 / (2.1 x 5.2915) = 605 mm; other cases (1.4 for 16 mm = 907 mm, 1.1 for 25 mm = 1804 mm); minimum 300 mm', [Math.round(r.ld), Math.round(ac({db: 16}).ld), Math.round(ac({db: 16, case1: false}).ld), Math.round(ac({db: 25, case1: false}).ld), ac({db: 5}).ld], [934, 605, 907, 1804, 300], 1);
check('top bars psi_t = 1.3 and epoxy 1.5: the product is limited to 1.7 (db 20: 934 x 1.7 = 1587 mm); bottom bars with epoxy psi_e = 1.2 -> 1121 mm', [Math.round(ac({psit: 1.3, psie: 1.5}).ld), Math.round(ac({psie: 1.2}).ld)], [1587, 1121], 1);
check('compression: ldc = max(0.24 fy db / (lambda sqrt(fc)), 0.043 fy db, 200) = 381 mm for db 20; light-weight concrete (lambda = 0.75) raises the tension length to 1245 mm', [Math.round(r.ldc), Math.round(ac({lam: 0.75}).ld)], [381, 1245], 1);
w.renderCalc('acibeam'); w.calcResult('acibeam');
let tt = txt(w, 'ac_results');
check('the page opens with 1017 mm2, 148.43 kN, 934 mm, 381 mm and the 🔴 note', [tt.includes('1017 mm'), tt.includes('148.43 kN'), tt.includes('934 mm'), tt.includes('381 mm'), tt.includes('🔴')], [true, true, true, true, true]);
setv(w, 'ac_m', 550); w.calcResult('acibeam');
check('M = 550 kN m warns that the section is not tension-controlled', [txt(w, 'ac_results').includes('أقل من 0.005')], [true]);
check('other reference codes open it too', others('acibeam', 'ac_results'), [true, true, true]);
}
console.log(fail ? `\n${fail} FAIL` : '\nall ok');
if (errors.length) { console.log('jsdom errors:', errors.slice(0, 5)); fail++; }
process.exit(fail ? 1 : 0);
