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
console.log(fail ? `\n${fail} FAIL` : '\nall ok');
if (errors.length) { console.log('jsdom errors:', errors.slice(0, 5)); fail++; }
process.exit(fail ? 1 : 0);
