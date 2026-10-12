// International standards (IEC / ASHRAE and similar) added from the library folder `standars` (parts 83 onward): switchboards (IEC 61439), insulation distances, ASHRAE 90.1 Appendix G and the Schneider guide chapters.
//   node tests/intlcodes.js
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

// ---------- part 83: IEC 61439-1 switchboards (`swbdesign`: Table 7, Annex E / Table 101, 10.10.4.2 temperature rise, Annex N bars, 10.11.2 exemptions) ----------
{
w = boot('intl'); doc = w.document;
const sb = o => w.eval('sbCalc(' + JSON.stringify(Object.assign({rows: [{kind: 'in', cnt: 1, In: 400, Pvn: 31.8, m: 0, name: 'a'}, {kind: 'out', cnt: 6, In: 160, Pvn: 42.6, m: 0, name: 'b'}, {kind: 'out', cnt: 24, In: 40, Pvn: 8.4, m: 0, name: 'c'}, {kind: 'out', cnt: 144, In: 16, Pvn: 2.5, m: 0, name: 'd'}],
  der: 0.8, wirePct: 30, InA: 0, Pdiss: 300, bar: {idx: -1}, Icp: 25, tk: 0.3, Icw: 30, tw: 1, Ipk: 0, Icc: 0, cut: 0}, o)) + ')');
check('Table 7: n = 1.5 up to 5 kA, 1.7 up to 10 kA (10 included), 2 up to 20, 2.1 up to 50, 2.2 above', [5, 5.01, 10, 20, 50, 60].map(i => w.eval('sbN7(' + i + ')[2]')), [1.5, 1.7, 1.7, 2, 2.1, 2.2]);
check('Table 7: cos phi 0.7 / 0.5 / 0.3 / 0.25 / 0.2', [4, 8, 15, 30, 80].map(i => w.eval('sbN7(' + i + ')[1]')), [0.7, 0.5, 0.3, 0.25, 0.2]);
check('assumed loading by the number of circuits: 1 -> 1, 2 and 3 -> 0.9, 4 and 5 -> 0.8, 6 to 9 -> 0.7, 10 or more -> 0.6', [1, 2, 3, 4, 5, 6, 9, 10, 175].map(n => w.eval('sbRdf(' + n + ')')), [1, 0.9, 0.9, 0.8, 0.8, 0.7, 0.7, 0.6, 0.6]);
let r = sb({});
check('ABB work book example (1 incoming 400 A, 6 x 160 A, 24 x 40 A, 144 x 16 A): 174 outgoing circuits -> n = 0.6, circuit currents 96 / 24 / 9.6 A, I_B 320 / 76.8 / 19.2 / 7.68 A', [r.Nout, r.nAuto, r.rows.map(x => +x.Inc.toFixed(1)), r.rows.map(x => +x.IB.toFixed(2))], [174, 0.6, [400, 96, 24, 9.6], [320, 76.8, 19.2, 7.68]]);
check('... device losses P_vB = P_vn (I_B / I_n)^2: 20.35, 9.82, 1.94, 0.58 W per device, 20.35 + 58.89 + 46.45 + 82.94 = 208.63 W', [r.rows.map(x => +x.PvB.toFixed(2)), +r.dev.toFixed(2)], [[20.35, 9.82, 1.94, 0.58], 208.63]);
check('... wiring 30 % = 62.59 W, total 271.23 W; an enclosure dissipating 300 W leaves +28.77 W (verified)', [+r.wire.toFixed(2), +r.total.toFixed(2), +r.dP.toFixed(2), r.ok], [62.59, 271.23, 28.77, true], 0.01);
r = sb({Pdiss: 150});
check('an enclosure dissipating only 150 W: -121.23 W (not verified) and a reduced diversity factor sqrt(150 / 271.23) = 0.74', [+r.dP.toFixed(2), r.ok, +r.rdfRed.toFixed(2)], [-121.23, false, 0.74], 0.01);
r = sb({rows: [{kind: 'out', cnt: 3, In: 200, Pvn: 10, m: 0, name: 'x'}]});
check('ABB example I: three outgoing circuits take n = 0.9 (so a circuit with I_B = 150 A needs I_nc = 166.7 A)', [r.nAuto, +(150 / r.nAuto).toFixed(1)], [0.9, 166.7]);
r = sb({rows: [{kind: 'out', cnt: 20, In: 8, Pvn: 1, m: 1, name: 'x'}], der: 1, InA: 100});
check('note 3 of 10.10.4.2.1: 20 circuits of 8 A on a 100 A ASSEMBLY: the loss is scaled by 100 / 160 = 0.625 (12.5 W instead of 20 W; the standard counts 12 whole circuits = 12 W)', [+r.phi.toFixed(3), +r.sumOut.toFixed(2)], [0.625, 12.5]);
r = sb({bar: {idx: 19, nb: 1, L: 2, I: 969, Ta: 55, Tc: 70}});
check('Table N.1: 100 x 10 mm bar, one per phase, 969 A at 55 C and 70 C: 23.5 W/m (formula 23.56), 3 phases x 2 m = 141 W; carrying capacity 969 A', [+r.bar.Pm.toFixed(1), +r.bar.loss.toFixed(0), Math.round(r.bar.Imax), r.bar.ok], [23.6, 141, 969, true], 0.2);
r = sb({bar: {idx: 0, nb: 2, L: 1, I: 118, Ta: 55, Tc: 70}});
check('Table N.1: 12 x 2 mm, two bars per phase, 118 A: 6.4 W/m (formula 6.41)', [+r.bar.Pm.toFixed(2)], [6.41], 0.02);
check('Table N.2: factor k4 interpolated: 40 C -> 1.54, 42.5 C -> 1.445, 55 C -> 1.00, 90 C conductor at 55 C -> 1.62, below 20 C -> 2.08', [w.eval('sbK4(40, 70)'), w.eval('sbK4(42.5, 70)'), w.eval('sbK4(55, 70)'), w.eval('sbK4(55, 90)'), w.eval('sbK4(10, 70)')], [1.54, 1.445, 1, 1.62, 2.08]);
r = sb({bar: {idx: 19, nb: 1, L: 1, I: 1000, Ta: 55, Tc: 70}});
check('a current of 1000 A exceeds the 969 A of the 100 x 10 bar at 55 C', [r.bar.ok], [false]);
r = sb({});
check('short circuit 25 kA: n = 2.1 and the peak 52.5 kA; I_cw 30 kA / 1 s gives 54.8 kA at 0.3 s (passes) and the peak limit 2.1 x 30 = 63 kA (passes)', [r.n7, +r.Ip.toFixed(1), +r.IcwT.toFixed(1), r.okTh, r.IpkRated, r.okDyn], [2.1, 52.5, 54.8, true, 63, true], 0.1);
r = sb({Icp: 40, tk: 1});
check('40 kA for 1 s on I_cw = 30 kA: thermal check fails (n = 2.1, peak 84 kA also above 63 kA)', [r.okTh, +r.Ip.toFixed(1), r.okDyn], [false, 84, false]);
r = sb({Icp: 20, tk: 4});
check('a fault duration over 3 s is outside the I2t rule: the rating cannot be extended', [r.tOk, r.okTh], [false, false]);
r = sb({Icw: 10, Icp: 8});
check('10.11.2 a: I_cw of 10 kA or less (or I_cc) is exempt from the verification; 11 kA is not', [r.exA, sb({Icw: 11}).exA, sb({Icw: 0, Icc: 10}).exA], [true, false, true]);
check('10.11.2 b: a current-limiting device with cut-off 17 kA is exempt, 18 kA is not', [sb({cut: 17}).exB, sb({cut: 18}).exB], [true, false]);
r = sb({Icw: 0, Icc: 50, Icp: 45});
check('a rating by I_cc (conditional): 45 kA against 50 kA passes', [r.okCc, r.okTh], [true, null]);
w.renderCalc('swbdesign'); w.calcResult('swbdesign');
const tt = doc.getElementById('sb_results').textContent;
check('the page opens with the ABB data and quotes the Table 101 flag, 271.23 W and the verified verdict', [tt.includes('271.23'), tt.includes('28.77'), tt.includes('🔴'), tt.includes('IEC 61439')], [true, true, true, true]);
check('other reference codes open the calculator too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('swbdesign'); x.calcResult('swbdesign'); return x.document.getElementById('sb_results').textContent.length > 300; }).join(), 'true,true,true');
}

// ---------- part 83: IEC 61439-1 insulation coordination and protective conductors (`swbinsul`: Tables 1, 2, 3, 5, 8, 10, 11, 12, A.1, B.1, G.1) ----------
{
w = boot('intl'); doc = w.document;
const sv = o => w.eval('svCalc(' + JSON.stringify(Object.assign({src: 'ovc', u0: 300, ovc: 1, uimp: 4, ui: 690, pd: 3, mg: 2, alt: 2000, Ie: 100, S: 50, Ik: 20, t: 1, mat: 'cu', ins: 'pvc'}, o)) + ')');
check('Table G.1: 300 V to earth: IV 6, III 4, II 2.5, I 1.5 kV; 600 V: 8 / 6 / 4 / 2.5; 1000 V category I 4; 50 V category I 0.33; 150 V category II 1.5', [sv({ovc: 0}).uimp, sv({}).uimp, sv({ovc: 2}).uimp, sv({ovc: 3}).uimp, sv({u0: 600, ovc: 0}).uimp, sv({u0: 1000, ovc: 3}).uimp, sv({u0: 50, ovc: 3}).uimp, sv({u0: 150, ovc: 2}).uimp], [6, 4, 2.5, 1.5, 8, 4, 0.33, 1.5]);
check('Table 1: 4 kV -> 3.0 mm, 6 -> 5.5, 8 -> 8.0, 12 -> 14.0; 2.5 kV and the lower values -> 1.5 mm', [sv({src: 'direct', uimp: 4}).clear, sv({src: 'direct', uimp: 6}).clear, sv({src: 'direct', uimp: 8}).clear, sv({src: 'direct', uimp: 12}).clear, sv({src: 'direct', uimp: 2.5}).clear, sv({u0: 50, ovc: 2}).clear], [3, 5.5, 8, 14, 1.5, 1.5]);
check('Table 2 at U_i = 250 V: pollution 1 -> 1.5; pollution 2 groups I / II / III -> 1.5 / 1.8 / 2.5; pollution 3 groups I / II / IIIa / IIIb -> 3.2 / 3.6 / 4.0 / 4.0', [sv({ui: 250, pd: 1}).creep, sv({ui: 250, pd: 2, mg: 0}).creep, sv({ui: 250, pd: 2, mg: 1}).creep, sv({ui: 250, pd: 2, mg: 2}).creep, sv({ui: 250, pd: 3, mg: 0}).creep, sv({ui: 250, pd: 3, mg: 1}).creep, sv({ui: 250, pd: 3, mg: 2}).creep, sv({ui: 250, pd: 3, mg: 3}).creep], [1.5, 1.5, 1.8, 2.5, 3.2, 3.6, 4, 4]);
check('Table 2: 630 V pollution 3 IIIa -> 10 mm; 690 V takes the 800 V row: 12.5 mm, and IIIb has no printed value there; 1600 V pollution 3 I -> 20 mm; above 1600 V no row', [sv({ui: 630}).creep, sv({ui: 690}).creep, sv({ui: 690, mg: 3}).creep, sv({ui: 1600, mg: 0}).creep, sv({ui: 1700}).creep], [10, 12.5, null, 20, null]);
check('the footnote of Table 2: 415 V takes the 500 V row (8 mm, group IIIa, pollution 3) or the lower 400 V row (6.3 mm); 690 V -> 12.5 or the 630 V row 10 mm; 400 V has no lower row', [sv({ui: 415}).creep, sv({ui: 415}).creepLow, sv({ui: 690}).creepLow, sv({ui: 400}).creepLow], [8, 6.3, 10, null]);
check('the creepage distance is never taken below the clearance: U_i 32 V (1.5 mm) with U_imp 12 kV (14 mm) -> 14 mm', [sv({src: 'direct', uimp: 12, ui: 32}).creepMin], [14]);
check('Table 8: 60 V -> 1000 V a.c. (1415 d.c.), 61 V -> 1500, 300 -> 1500, 690 -> 1890 (2670), 800 -> 2000 (2830), 1000 -> 2200 (3110)', [60, 61, 300, 690, 800, 1000].map(u => sv({ui: u}).diel.ac).concat(sv({ui: 690}).diel.dc), [1000, 1500, 1500, 1890, 2000, 2200, 2670]);
check('Table 10: U_imp 4 kV test voltage 4.8 kV at sea level (3.4 r.m.s.), 4.0 kV at 2000 m (2.8 r.m.s.); 1500 m uses the 2000 m column; U_imp 12 kV at 500 m 14.0 (9.9)', [sv({src: 'direct', uimp: 4, alt: 0}).t10[0][0], sv({src: 'direct', uimp: 4, alt: 0}).t10[1][0], sv({src: 'direct', uimp: 4, alt: 2000}).t10[0][4], sv({src: 'direct', uimp: 4, alt: 2000}).t10[1][4], sv({src: 'direct', uimp: 4, alt: 1500}).aIdx, sv({src: 'direct', uimp: 12, alt: 500}).t10[0][2], sv({src: 'direct', uimp: 12, alt: 500}).t10[1][2]], [4.8, 3.4, 4, 2.8, 4, 14, 9.9]);
check('Annex B: 20 kA for 1 s, copper PVC (k = 143): 139.9 mm2 -> 150; aluminium XLPE (k = 116): 172.4 -> 185; steel butyl rubber (k = 60): 333 mm2', [+sv({}).Sp.toFixed(1), sv({}).SpStd, +sv({mat: 'al', ins: 'xlpe'}).Sp.toFixed(1), sv({mat: 'al', ins: 'xlpe'}).SpStd, Math.round(sv({mat: 'st', ins: 'rub'}).Sp)], [139.9, 150, 172.4, 185, 333]);
check('Table 5: PE / PEN terminal capacity: S 16 -> 16, 25 -> 16, 50 -> 25, 400 -> 200, 500 -> 200, 800 -> 200, 1000 -> 250', [16, 25, 50, 400, 500, 800, 1000].map(s => sv({S: s}).pe5), [16, 16, 25, 200, 200, 200, 250]);
check('Table 3: I_e up to 20 A -> S (the phase conductor), 21 -> 2.5, 26 -> 4, 40 -> 6, 64 -> 10 mm2', [sv({Ie: 20, S: 1.5}).pe3, sv({Ie: 21}).pe3, sv({Ie: 26}).pe3, sv({Ie: 40}).pe3, sv({Ie: 64}).pe3], [1.5, 2.5, 4, 6, 10]);
check('Table A.1: 100 A -> solid 16 - 50, flexible 16 - 35; 101 A takes the 125 A row (25 - 70 / 25 - 50); 16 A -> 1.5 - 4 and 1 - 4', [sv({Ie: 100}).a1, sv({Ie: 101}).a1, sv({Ie: 16}).a1], [[100, 16, 50, 16, 35], [125, 25, 70, 25, 50], [16, 1.5, 4, 1, 4]]);
check('Tables 11 and 12: 100 A -> 35 mm2; 101 A -> 35 (the 100 - 115 A row); 400 A -> 240 mm2; 450 A -> two 150 mm2 cables or two 30 x 5 bars; 4000 A -> four 100 x 10 bars; above 4000 A none', [sv({Ie: 100}).t11, sv({Ie: 101}).t11, sv({Ie: 400}).t11, sv({Ie: 450}).t12, sv({Ie: 4000}).t12, sv({Ie: 4500}).t12], [35, 35, 240, '2 × 150 mm² (كابلات) أو قضيبان 30 × 5', '4 قضبان 100 × 10', null]);
w.renderCalc('swbinsul'); w.calcResult('swbinsul');
const tt = doc.getElementById('sv_results').textContent;
check('the page shows 4 kV, the 12.5 mm creepage, the test voltage and the 🔴 note', [tt.includes('12.5'), tt.includes('1890'), tt.includes('🔴'), tt.includes('IEC 60664-1')], [true, true, true, true]);
check('other reference codes open the calculator too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('swbinsul'); x.calcResult('swbinsul'); return x.document.getElementById('sv_results').textContent.length > 300; }).join(), 'true,true,true');
}

// ---------- part 83: IEC 60364-5-54 bonding, earthing conductor and the 10 mA rule in the IEC branch of `protcond` (542.3.1, 543.7, 544.1, 544.2) ----------
{
w = boot('intl'); doc = w.document; w.renderCalc('protcond');
const pc = o => { setv(w, 'pc_std', 'iec'); w.pcStd(); Object.keys(o).forEach(id => setv(w, id, o[id])); return w.eval('calcProtCond()').bond; };
let b = pc({pc_pemax: 50, pc_bm: 'cu', pc_pesm: 16, pc_leak: 'no', pc_light: 'no', pc_mech: 'yes'});
check('544.1: the largest PE 50 mm2 copper -> main bonding 25 mm2 (half of it; also the cap of 25 mm2 Cu)', [b.main, b.mainStd, b.capped], [25, 25, false]);
b = pc({pc_pemax: 120});
check('544.1: PE 120 mm2 -> half is 60 but the bonding need not exceed 25 mm2 copper', [b.main, b.capped], [25, true]);
b = pc({pc_pemax: 8});
check('544.1: PE 8 mm2 -> half is 4, the minimum 6 mm2 copper governs', [b.main], [6]);
b = pc({pc_pemax: 50, pc_bm: 'al'});
check('544.1 aluminium: PE 50 -> 25 mm2 (above the 16 mm2 minimum, under the equivalent cap 40.98 mm2); PE 120 -> capped at 40.98, next standard 50', [b.mainStd, pc({pc_pemax: 120, pc_bm: 'al'}).capped, +pc({pc_pemax: 120, pc_bm: 'al'}).main.toFixed(2), pc({pc_pemax: 120, pc_bm: 'al'}).mainStd], [25, true, 40.98, 50], 0.01);
b = pc({pc_pemax: 50, pc_bm: 'st'});
check('544.1 steel: minimum 50 mm2 and no stated cap', [b.main, b.capped, b.capB], [50, false, null]);
b = pc({pc_bm: 'cu', pc_pesm: 16, pc_mech: 'yes'});
check('544.2: two exposed parts need 16 mm2 (the smaller PE); an exposed and an extraneous part 8 mm2; minimum 2.5 mm2 protected, 4 mm2 not protected, 16 mm2 aluminium', [b.sup2, b.sup3, b.supMin, pc({pc_mech: 'no'}).supMin, pc({pc_bm: 'al'}).supMin], [16, 8, 2.5, 4, 16]);
check('542.3.1: the earthing conductor 6 mm2 copper (16 with lightning protection); the 10 mA rule is reported only when asked', [pc({pc_light: 'no'}).earthMin, pc({pc_light: 'yes'}).earthMin, pc({pc_leak: 'no'}).leak, pc({pc_leak: 'yes'}).leak], [6, 16, false, true]);
w.calcResult('protcond');
const tt = doc.getElementById('pc_results').textContent;
check('the IEC results show the bonding items and 543.7 when the leakage is above 10 mA', [tt.includes('544.1'), tt.includes('542.3.1'), tt.includes('543.7'), tt.includes('544.2.2')], [true, true, true, true]);
}

// ---------- part 84: ASHRAE 90.1-2022 Appendix G performance cost index (`prmpci`: PRM-RM Table 1 and equations 1 - 3) ----------
{
w = boot('intl'); doc = w.document;
const pp = o => w.eval('prmPci(' + JSON.stringify(Object.assign({types: [{k: 'office', area: 5000}], cz: 1, alt: 'new', bbuec: 200, bbrec: 800, pbp: 620, pbpNre: 0, pbpPre: 0}, o)) + ')');
check('Table 1 has 9 building types x 17 climate zones', [w.eval('PRM_BPF.length'), w.eval('PRM_BPF.every(r => r[2].length === 17)'), w.eval('PRM_CZ.length')], [9, true, 17]);
check('Table 1 values: office 0A/1A 0.54 and zone 7 0.46; hospital zone 8 0.70; retail 3B 0.43; warehouse 6A 0.31; all others 0B/1B 0.60', [w.eval("PRM_BPF.find(r => r[0] === 'office')[2][0]"), w.eval("PRM_BPF.find(r => r[0] === 'office')[2][15]"), w.eval("PRM_BPF.find(r => r[0] === 'hosp')[2][16]"), w.eval("PRM_BPF.find(r => r[0] === 'retail')[2][5]"), w.eval("PRM_BPF.find(r => r[0] === 'ware')[2][13]"), w.eval("PRM_BPF.find(r => r[0] === 'other')[2][1]")], [0.54, 0.46, 0.7, 0.43, 0.31, 0.6]);
check('two area types take the area-weighted BPF: 6000 m2 office (0.54) + 4000 m2 retail (0.43) in 3B = 0.496', [+w.eval("prmBpf([{k: 'office', area: 6000}, {k: 'retail', area: 4000}], 5)").toFixed(3)], [0.496]);
let r = pp({});
check('office in 0B/1B: BPF 0.54, BBP 1000, PCI_t = (200 + 0.54 x 800) / 1000 = 0.632, PCI 0.62: passes by 0.012', [r.bpf, r.bbp, +r.pcit.toFixed(3), +r.pci.toFixed(3), r.ok, +r.margin.toFixed(3)], [0.54, 1000, 0.632, 0.62, true, 0.012]);
check('PBP 640 (PCI 0.64) fails; exactly equal passes (PBP 632)', [pp({pbp: 640}).ok, pp({pbp: 632}).ok], [false, true]);
r = pp({pbp: 560, pbpNre: 640, pbpPre: 610});
check('renewables: PRE = 640 - 610 = 30 -> PCI_t = (200 + 432 - 30) / 1000 = 0.602; PCI 0.56; the extra credit (610 - 560) / 1000 = 5 % is not above the limit', [r.pre, +r.pcit.toFixed(3), +r.pci.toFixed(3), r.extra, r.ok], [30, 0.602, 0.56, 0, true]);
r = pp({pbp: 540, pbpNre: 640, pbpPre: 610});
check('renewable credit of 7 % (610 - 540): 2 % over the 5 % limit is added back: PCI 0.54 -> 0.56', [+r.extra.toFixed(3), +r.adj.toFixed(3), r.ok], [0.02, 0.56, true]);
check('alterations: a major one takes BPF x 1.05 (PCI_t 0.654), a minor one BPF = 1 (PCI_t 1.0)', [+pp({alt: 'major'}).pcit.toFixed(3), pp({alt: 'minor'}).pcit], [0.654, 1]);
w.renderCalc('prmpci'); w.calcResult('prmpci');
const tt = doc.getElementById('pp_results').textContent;
check('the page shows the target 0.632, the PCI 0.620 and the 🔴 note', [tt.includes('0.632'), tt.includes('0.620'), tt.includes('🔴'), tt.includes('ASHRAE')], [true, true, true, true]);
check('other reference codes open the calculator too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('prmpci'); x.calcResult('prmpci'); return x.document.getElementById('pp_results').textContent.length > 300; }).join(), 'true,true,true');
}

// ---------- part 84: ASHRAE 90.1-2022 Appendix G baseline envelope (`prmenvelope`: PRM-RM Tables 24, 26, 28, 30 - 39) ----------
{
w = boot('intl'); doc = w.document;
const pe = o => w.eval('prmEnv(' + JSON.stringify(Object.assign({z: 0, cat: 0, bt: 'off2', wwrP: 35, skP: 0, aWall: 2000, aRoof: 800, aFloor: 0, aDoor: 20, uRoof: 0.4, uWall: 0.6, uFloor: 0.5, uDoor: 2, uGl: 2.5, uSk: 2.8}, o)) + ')');
let r = pe({});
check('zone 0 and 1 nonresidential: roof 0.063, wall 0.124, floor 0.35, swinging door 0.7, non-swinging 1.45 Btu/h ft2 F; glass 1.22, SHGC 0.25, VT 0.28 (office 31 %: band 30.1 - 40 %)', [r.roof, r.wall, r.floor, r.doorSw, r.doorNs, r.uV, r.shgcV, r.vtV, r.bv, r.wwrB], [0.063, 0.124, 0.35, 0.7, 1.45, 1.22, 0.25, 0.28, 3, 31]);
check('in SI: roof 0.358, wall 0.704, glass 6.93 W/m2K (x 5.678)', [+(r.roof * w.eval('PRM_U_SI')).toFixed(3), +(r.wall * w.eval('PRM_U_SI')).toFixed(3), +(r.uV * w.eval('PRM_U_SI')).toFixed(2)], [0.358, 0.704, 6.93]);
r = pe({z: 2});
check('zone 3: glass U 0.57, SHGC 0.25 at 31 %; the opaque tables use the zone 3 row (roof 0.063 nonresidential, wall residential 0.084, semiheated floor 0.069)', [r.uV, r.shgcV, r.roof, pe({z: 2, cat: 1}).wall, pe({z: 2, cat: 2}).floor], [0.57, 0.25, 0.063, 0.084, 0.069]);
r = pe({z: 3});
check('zone 3C has its own fenestration row (U 1.22, SHGC 0.34 and VT 0.34 at 31 %) but the opaque row of zone 3 (roof 0.063; semiheated 0.218)', [r.uV, r.shgcV, r.vtV, r.roof, pe({z: 3, cat: 2}).roof], [1.22, 0.34, 0.34, 0.063, 0.218]);
check('the SHGC band follows the baseline window ratio: office up to 465 m2 (19 %) in zone 3: nonresidential 0.25, residential 0.39 (band 10.1 - 20 %); grocery (7 %): 0.39 / 0.39', [pe({z: 2, bt: 'off1'}).shgcV, pe({z: 2, bt: 'off1', cat: 1}).shgcV, pe({z: 2, bt: 'grocery'}).shgcV, pe({z: 2, bt: 'grocery', cat: 1}).shgcV], [0.25, 0.39, 0.39, 0.39]);
check('semiheated spaces take one SHGC (0.40) and VT (0.44) for every zone; zone 8 nonresidential 0.40 / 0.44', [pe({z: 1, cat: 2}).shgcV, pe({z: 5, cat: 2}).vtV, pe({z: 8}).shgcV, pe({z: 8}).vtV], [0.4, 0.44, 0.4, 0.44]);
check('Table 31: hospital 27 %, hotel over 75 rooms 34 %, office over 4645 m2 40 %, warehouse 6 %; a type that is not listed takes the smaller of the proposed 25 % / 60 % and 40 %', [pe({bt: 'hosp'}).wwrB, pe({bt: 'hotel2'}).wwrB, pe({bt: 'off3'}).wwrB, pe({bt: 'wh'}).wwrB, pe({bt: 'other', wwrP: 25}).wwrB, pe({bt: 'other', wwrP: 60}).wwrB], [27, 34, 40, 6, 25, 40]);
check('skylights: the smaller of the proposed and 3 % of the roof; zone 0/1 nonresidential SHGC 0.36 up to 2 % and 0.19 above (5 % proposed is cut to 3 %: band 2.1 - 5 %)', [pe({skP: 1}).skB, pe({skP: 1}).shgcH, pe({skP: 5}).skB, pe({skP: 5}).shgcH, +pe({skP: 5}).skAB.toFixed(1), pe({skP: 5}).vtH], [1, 0.36, 3, 0.19, 24, 0.21]);
check('below-grade wall C: zone 6 nonresidential 1.14 and residential 0.119; zones 7 and 8: 0.119; slab F: zone 7 residential 0.54, zone 8 nonresidential 0.54 and residential 0.52, others 0.73', [pe({z: 6}).bg, pe({z: 6, cat: 1}).bg, pe({z: 7}).bg, pe({z: 8, cat: 2}).bg, pe({z: 7, cat: 1}).slab, pe({z: 8}).slab, pe({z: 8, cat: 1}).slab, pe({z: 2}).slab], [1.14, 0.119, 0.119, 1.14, 0.54, 0.54, 0.52, 0.73]);
check('zone 3 residential: the non-swinging door is 0.5 and the swinging one 0.7; zone 6 nonresidential non-swinging 0.5, residential swinging 0.5', [pe({z: 2, cat: 1}).doorNs, pe({z: 2, cat: 1}).doorSw, pe({z: 6}).doorNs, pe({z: 6, cat: 1}).doorSw], [0.5, 0.7, 0.5, 0.5]);
check('zone 8: the glass is 0.46 vertical and 0.58 horizontal and the semiheated horizontal 0.81 (Table 32); residential horizontal in zones 4 and 6 is printed 0.58', [pe({z: 8}).uV, pe({z: 8}).uH, pe({z: 8, cat: 2}).uH, pe({z: 4, cat: 1}).uH, pe({z: 6, cat: 1}).uH], [0.46, 0.58, 0.81, 0.58, 0.58]);
r = pe({});
const SI = w.eval('PRM_U_SI');
const gl = 2000 * 0.31, op = 2000 - gl - 20;
check('baseline UA of the default building: glass 620 m2 x 6.93, wall 1360 m2 x 0.704, roof 800 m2 x 0.358, doors 20 m2 x 3.97 = about 5618 W/K', [+r.uaB.toFixed(0), +(gl * 1.22 * SI + op * 0.124 * SI + 800 * 0.063 * SI + 20 * 0.7 * SI).toFixed(0)], [5618, 5618], 2);
check('the proposed UA with the default U-values (glass 2.5 x 700 m2 + wall 0.6 x 1280 m2 + roof 0.4 x 800 + door 2 x 20) = 1750 + 768 + 320 + 40 = 2878 W/K', [+r.uaP.toFixed(0)], [2878], 1);
w.renderCalc('prmenvelope'); w.calcResult('prmenvelope');
const tt = doc.getElementById('pe_results').textContent;
check('the page shows the 31 % window ratio, the glass 6.93 and the 🔴 note', [tt.includes('31.0'), tt.includes('6.93'), tt.includes('🔴'), tt.includes('0.36')], [true, true, true, true]);
check('other reference codes open the calculator too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('prmenvelope'); x.calcResult('prmenvelope'); return x.document.getElementById('pe_results').textContent.length > 300; }).join(), 'true,true,true');
}

// ---------- part 84: ASHRAE 90.1-2022 Appendix G baseline HVAC system (`prmsystem`: PRM-RM Tables 3, 4, 80 and the internal-load / hours rule of G3.2.1.2) ----------
{
w = boot('intl'); doc = w.document;
const sy = (bt, fl, a, cz) => w.eval('prmSystem(' + JSON.stringify(bt) + ', ' + fl + ', ' + a + ', ' + cz + ')').sys;
const COOL = 10, WARM = 1;                                                                                          // 5A and 0B/1B
check('residential: system 1 PTAC (cool) and 2 PTHP (warm) for any size', [sy('res', 3, 500, COOL), sy('res', 30, 90000, WARM)], [1, 2]);
check('public assembly: under 120,000 ft2 (11,148 m2) system 3 / 4; at or over it 12 / 13', [sy('pa', 1, 10000, COOL), sy('pa', 1, 10000, WARM), sy('pa', 1, 12000, COOL), sy('pa', 1, 12000, WARM)], [3, 4, 12, 13]);
check('retail of two floors: 3 / 4; of three floors it follows the other nonresidential rule (4 floors and 2000 m2 -> 5 / 6)', [sy('retail', 2, 90000, COOL), sy('retail', 2, 90000, WARM), sy('retail', 4, 2000, COOL), sy('retail', 4, 2000, WARM)], [3, 4, 5, 6]);
check('hospital: 5 floors 10,000 m2 -> 5; 6 floors 5,000 m2 -> 7; 14,000 m2 (over 150,000 ft2) -> 7; 13,935 m2 (150,000 ft2 exactly) -> 5; same in both climates', [sy('hosp', 5, 10000, COOL), sy('hosp', 6, 5000, WARM), sy('hosp', 2, 14000, COOL), sy('hosp', 2, 13935, WARM)], [5, 7, 7, 5]);
check('heated-only storage: system 9 (cool) and 10 (warm)', [sy('store', 1, 5000, COOL), sy('store', 1, 5000, WARM)], [9, 10]);
check('other nonresidential: 3 floors 2000 m2 (21,528 ft2) -> 3 / 4; 3 floors 2400 m2 (25,833 ft2) -> 5 / 6; 4 floors 2000 m2 -> 5 / 6; 5 floors 8000 m2 -> 5 / 6; 6 floors 3000 m2 -> 7 / 8; 2 floors 14,000 m2 (over 150,000 ft2) -> 7 / 8', [[3, 2000], [3, 2400], [4, 2000], [5, 8000], [6, 3000], [2, 14000]].map(a => sy('other', a[0], a[1], COOL) + '/' + sy('other', a[0], a[1], WARM)), ['3/4', '5/6', '5/6', '5/6', '7/8', '7/8']);
check('climate: 3A is warm (system 6) and 3B cool (system 5) for a 5-floor 8000 m2 building; 0A is warm', [sy('other', 5, 8000, 4), sy('other', 5, 8000, 5), sy('other', 5, 8000, 0)], [6, 5, 6]);
check('Table 4: 13 systems, the heating of system 7 is a fossil-fuel hot-water boiler and of system 8 electric resistance; system 11 depends on the zone', [w.eval('Object.keys(PRM_SYS).length'), w.eval('PRM_SYS[7][4]'), w.eval('PRM_SYS[8][4]'), w.eval('PRM_SYS[3][2]'), w.eval('PRM_SYS[7][3]')], [13, 'غلاية ماء ساخن بالوقود الأحفوري', 'مقاومة كهربائية', 'حجم ثابت', 'ماء مبرد']);
const ze = (arr, tl, te) => w.eval('prmZoneElim(' + JSON.stringify(arr.map(z => ({name: z[0], area: 1, load: z[1], efl: z[2]}))) + ', ' + tl + ', ' + te + ')');
const nm = r => r.removed.map(z => z.name + z.step).join(',') + '|' + r.kept.map(z => z.name).join(',');
check('manual example 1 (loads 10, 14, 16, 34 Btu/h ft2, same hours, limit 12): zone D is moved in step 3, the rest stay', [nm(ze([['A', 10, 60], ['B', 14, 60], ['C', 16, 60], ['D', 34, 60]], 12, 40))], ['D3|A,B,C']);
check('manual example 2 (hours 50, 55, 65, 100): zone D is moved in step 2 (43.3 h from the average of the others), the rest stay', [nm(ze([['A', 10, 50], ['B', 10, 55], ['C', 10, 65], ['D', 10, 100]], 12, 40))], ['D2|A,B,C']);
const ex3 = [['A', 6, 25], ['B', 8, 30], ['C', 10, 35], ['D', 20, 45], ['E', 16, 80], ['F', 28, 90]];
check('manual example 3 (six zones): F leaves in step 1 (both rules), E in step 2 (hours); D is exactly 12 Btu/h ft2 from the others, so with a strict "more than 12" it stays', [nm(ze(ex3, 12, 40))], ['F1,E2|A,B,C,D']);
check('... with a limit just under 12 the manual\'s own outcome follows: D leaves in step 3', [nm(ze(ex3, 11.9, 40))], ['F1,E2,D3|A,B,C']);
check('a single zone is never moved; two equal zones neither', [nm(ze([['A', 50, 100]], 12, 40)), nm(ze([['A', 10, 60], ['B', 10, 60]], 12, 40))], ['|A', '|A,B']);
w.renderCalc('prmsystem'); w.calcResult('prmsystem');
const tt = doc.getElementById('ps_results').textContent;
check('the page opens with the default 5-floor 8000 m2 building (system 5 in 0B/1B? no: warm -> 6) and the example 3 zones in W/m2: F, E and D leave to system 4', [tt.includes('PVAV'), tt.includes('المرحلة 1'), tt.includes('المرحلة 2'), tt.includes('المرحلة 3'), tt.includes('🔴')], [true, true, true, true, true]);
check('other reference codes open the calculator too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('prmsystem'); x.calcResult('prmsystem'); return x.document.getElementById('ps_results').textContent.length > 300; }).join(), 'true,true,true');
}

// ---------- part 84: ASHRAE 90.1-2022 Appendix G baseline chillers and fan power (`prmchiller`: Tables 89, 90; `prmfan`: Tables 57, 58, 60) ----------
{
w = boot('intl'); doc = w.document;
const ch = t => w.eval('prmChiller(' + t + ')');
const s = r => [r.n, r.type, +r.unit.toFixed(1), r.fl, r.iplv];
check('100 tons: one screw chiller, full load 0.790 and IPLV 0.676 kW/ton (below 150 tons)', s(ch(100)), [1, 'screw', 100, 0.79, 0.676]);
check('200 tons: one screw chiller, 0.718 / 0.629 (150 to below 300 tons)', s(ch(200)), [1, 'screw', 200, 0.718, 0.629]);
check('300 tons: still one screw chiller (up to 300 tons) and in the 300-and-over row: 0.639 / 0.572', s(ch(300)), [1, 'screw', 300, 0.639, 0.572]);
check('301 tons: two screw chillers of 150.5 tons: 0.718 / 0.629; 599 tons: two of 299.5 tons: the same', [s(ch(301)), s(ch(599))], [[2, 'screw', 150.5, 0.718, 0.629], [2, 'screw', 299.5, 0.718, 0.629]]);
check('600 tons: two centrifugal chillers of 300 tons: 0.576 / 0.549; 700 tons: two of 350; 1599 tons: two of 799.5 tons (below 800)', [s(ch(600)), s(ch(700)), s(ch(1599))], [[2, 'cent', 300, 0.576, 0.549], [2, 'cent', 350, 0.576, 0.549], [2, 'cent', 799.5, 0.576, 0.549]]);
check('1600 tons needs three chillers (two of 800 are not below 800): 533.3 tons; 2400 tons: four of 600; the unit stays below 800 tons', [s(ch(1600)), s(ch(2400)), ch(2400).ok800], [[3, 'cent', 533.3, 0.576, 0.549], [4, 'cent', 600, 0.576, 0.549], true]);
check('COP = 3.517 / kW per ton: 0.576 -> 6.11; the full-load power of a 700-ton plant = 700 x 0.576 = 403.2 kW', [+ch(700).copFl.toFixed(2), +ch(700).kwFl.toFixed(1)], [6.11, 403.2]);
w.renderCalc('prmchiller'); w.calcResult('prmchiller');
check('the page shows 1500 kW = 426.5 tons: two screw chillers of 213 tons at 0.718 kW/ton', [doc.getElementById('pc2_results').textContent.includes('426.5'), doc.getElementById('pc2_results').textContent.includes('0.718'), doc.getElementById('pc2_results').textContent.includes('🔴')], [true, true, true]);
setv(w, 'pc2_fl', 0.65); setv(w, 'pc2_ip', 0.7); w.calcResult('prmchiller');
const t2 = doc.getElementById('pc2_results').textContent;
check('a proposed chiller of 0.65 kW/ton is 9.5 % better than 0.718; an IPLV of 0.70 is 11.3 % worse than 0.629', [t2.includes('9.5%'), t2.includes('11.3%')], [true, true]);
setv(w, 'pc2_mode', 'cop'); setv(w, 'pc2_fl', 6); setv(w, 'pc2_ip', 0); w.calcResult('prmchiller');
check('the same input as COP 6.0 -> 0.586 kW/ton', [doc.getElementById('pc2_results').textContent.includes('0.586')], [true]);
const fan = o => w.eval('prmFan(' + JSON.stringify(o) + ')');
let f = fan({sys: 7, cfm: 20000, credits: []});
check('system 7 at 20,000 cfm: bhp = 0.0013 x 20,000 = 26, a 30 hp motor at 92.4 %, 26 x 0.746 / 0.924 = 20.99 kW (1.05 W/cfm)', [+f.bhp.toFixed(2), f.motor, f.eff, +f.kW.toFixed(2), +f.wcfm.toFixed(3)], [26, 30, 0.924, 20.99, 1.05]);
f = fan({sys: 7, cfm: 20000, credits: [{k: 'm13', cfm: 20000, val: 0}]});
check('with MERV 13 (0.9 in. w.c. on the whole flow): A = 0.9 x 20,000 / 4131 = 4.357, bhp 30.36 -> 40 hp at 93 %: 24.35 kW', [+f.A.toFixed(3), +f.bhp.toFixed(2), f.motor, f.eff, +f.kW.toFixed(2)], [4.357, 30.36, 40, 0.93, 24.35]);
f = fan({sys: 7, cfm: 20000, credits: [{k: 'nocool', cfm: 20000, val: 0}]});
check('a system without central cooling takes -0.6 in. w.c.: A = -2.905, bhp 23.1 -> 25 hp: 18.65 kW', [+f.A.toFixed(3), +f.bhp.toFixed(1), f.motor, +f.kW.toFixed(2)], [-2.905, 23.1, 25, 18.65]);
f = fan({sys: 3, cfm: 5000, credits: []});
check('system 3 at 5,000 cfm: bhp = 0.00094 x 5000 = 4.7 -> 5 hp at 87.5 %: 4.01 kW; system 11 at 10,000 cfm: 6.2 bhp -> 7.5 hp at 89.5 %: 5.17 kW', [+f.bhp.toFixed(1), f.motor, +f.kW.toFixed(2), +fan({sys: 11, cfm: 10000, credits: []}).kW.toFixed(2)], [4.7, 5, 4.01, 5.17]);
check('systems 1, 2, 9, 10: 0.3 W/cfm: 1000 cfm = 300 W; system 9 with a 500 cfm non-mechanical cooling fan adds 0.054 x 500 = 27 W', [fan({sys: 1, cfm: 1000}).kW, fan({sys: 9, cfm: 1000, nonMech: true, cfmNm: 500}).extra, +fan({sys: 9, cfm: 1000, nonMech: true, cfmNm: 500}).kWtot.toFixed(3)], [0.3, 27, 0.327]);
f = fan({sys: 5, cfm: 10000, credits: [{k: 'erv', cfm: 10000, val: 60}, {k: 'dev', cfm: 10000, val: 249.09}]});
check('energy recovery of 60 % effectiveness: 2.2 x 0.6 - 0.5 = 0.82 in. w.c. plus a device of 249.09 Pa (1 in.): A = 1.82 x 10,000 / 4131 = 4.406', [+f.A.toFixed(3)], [4.406]);
check('motor table: 1 hp 82.5 %, 7.5 hp 89.5 %, 100 hp 94.5 %, 200 hp 95 %; above 200 hp the 200 hp value; between sizes the next one up', [w.eval('prmMotor(1)').eff, w.eval('prmMotor(7.5)').eff, w.eval('prmMotor(100)').eff, w.eval('prmMotor(200)').eff, w.eval('prmMotor(260)').eff, w.eval('prmMotor(7.6)').hp], [0.825, 0.895, 0.945, 0.95, 0.95, 10]);
w.renderCalc('prmfan'); w.calcResult('prmfan');
const t3 = doc.getElementById('pf_results').textContent;
check('the page opens with system 7 at 9440 L/s (20,000 cfm) and the MERV 13 credit: 40 hp, 24.3 kW and the 🔴 note', [t3.includes('40'), t3.includes('24.3'), t3.includes('🔴')], [true, true, true]);
check('other reference codes open both calculators too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('prmchiller'); x.calcResult('prmchiller'); x.renderCalc('prmfan'); x.calcResult('prmfan'); return x.document.getElementById('pf_results').textContent.length > 300; }).join(), 'true,true,true');
}

// ---------- part 85: photovoltaic installations (`pvprotect`: Schneider Electrical Installation Guide 2015 chapter P, IEC 60364-7-712) ----------
{
w = boot('intl'); doc = w.document;
const pv = o => w.eval('pvCalc(' + JSON.stringify(Object.assign({wp: 255, area: 1.6, isc: 9, voc: 37.4, beta: -0.34, tmin: 0, irm: 15, kIsc: 1.25, usys: 1000, nm: 20, ns: 8, type: 'plant', ng: 2.5, len: 120, tech: 'glass', areaTot: 256}, o)) + ')');
let r = pv({});
check('255 Wp on 1.6 m2: efficiency 15.9 %; 20 x 8 modules = 40.8 kWp', [+(r.eff * 100).toFixed(1), +r.pwr.toFixed(1)], [15.9, 40.8]);
check('V_oc 37.4 V at 0 C with -0.34 %/C: 37.4 x 1.085 = 40.58 V per module and 811.6 V for 20 in series (within the 1000 V limit); 25 modules give 1014 V: over the limit', [+r.vocT.toFixed(2), +r.uocMax.toFixed(1), r.sysOk, pv({nm: 25}).sysOk], [40.58, 811.6, true, false]);
check('reverse current: 8 strings: (8 - 1) x 11.25 = 78.75 A against 1.35 x 15 = 20.25 A: protection needed; 2 strings: 11.25 A: not needed; 3 strings: 22.5 A: needed', [+r.rev.toFixed(2), r.revNeed, pv({ns: 2}).revNeed, pv({ns: 3}).revNeed], [78.75, true, false, true]);
check('string fuse: greater than 1.25 x 9 = 11.25 A -> 12 A; recommended at least 1.4 x 9 = 12.6 A -> 15 A (not above I_RM = 15 A); with I_RM 12 A the recommended fuse exceeds it', [r.fMin, r.fRec, r.fOk, pv({irm: 12}).fOk], [12, 15, true, false]);
check('array protection: greater than 1.25 x 72 = 90 A -> 100 A; recommended 1.4 x 72 = 100.8 A -> 125 A; cables 11.25 A (string) and 90 A (array) so overload protection may be omitted', [r.iscArr, r.aMin, r.aRec, r.cableStr, r.cableArr], [72, 100, 125, 11.25, 90]);
check('critical length: plant 200 / 2.5 = 80 m (120 m of cable: SPD needed on the d.c. side; exactly 80 m: needed; 79 m: not); houses 115 / 2.5 = 46 m; service buildings 450 / 2.5 = 180 m', [r.lcrit, r.spd, pv({len: 80}).spd, pv({len: 79}).spd, pv({type: 'house'}).lcrit, pv({type: 'serv'}).lcrit, pv({type: 'serv'}).spd], [80, true, true, false, 46, 180, false]);
check('a second SPD at the array when the line is over 10 m (exactly 10 m: no)', [r.spd2, pv({len: 10}).spd2], [true, false]);
check('leakage capacitance: 256 m2 of frameless glass-glass (1 nF/m2) = 0.256 uF; in-roof 5 nF/m2 = 1.28 uF; thin film 50 nF/m2 = 12.8 uF, all under the 500 uF of an insulation monitor; 12,000 m2 of thin film = 600 uF is over', [+r.cap.toFixed(3), +pv({tech: 'inroof'}).cap.toFixed(2), +pv({tech: 'thin'}).cap.toFixed(1), pv({tech: 'thin'}).capOk, pv({tech: 'thin', areaTot: 12000}).capOk], [0.256, 1.28, 12.8, true, false]);
w.renderCalc('pvprotect'); w.calcResult('pvprotect');
const tt = doc.getElementById('pv_results').textContent;
check('the page opens with the 255 Wp example: 811.6 V, a fuse of 12 to 15 A, 80 m critical length and the 🔴 note', [tt.includes('811.6'), tt.includes('12 إلى 15'), tt.includes('80.0'), tt.includes('🔴')], [true, true, true, true]);
check('other reference codes open the calculator too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('pvprotect'); x.calcResult('pvprotect'); return x.document.getElementById('pv_results').textContent.length > 300; }).join(), 'true,true,true');
}

// ---------- part 85: ASHRAE 90.1-2022 baseline exterior lighting allowance (`prmextlight`: PRM-RM Table 122 = Table G3.6) ----------
{
w = boot('intl'); doc = w.document;
const ex = (q, p) => w.eval('prmExt(' + JSON.stringify(q) + ', ' + p + ')');
let r = ex({park: 1000}, 0);
check('parking lots and drives 0.15 W/ft2 = 1.615 W/m2: 1000 m2 -> 1614.6 W', [+r.elpa.toFixed(1), +r.rows[0].per.toFixed(3)], [1614.6, 1.615], 0.1);
r = ex({wn: 100, ww: 100, st: 10, em: 3, eo: 2, can: 50, so: 100, sf: 10}, 0);
check('per unit: narrow walkways 1.0 W/ft = 3.281 W/m, wide walkways 0.2 W/ft2 = 2.153 W/m2, stairs 10.764 W/m2, main entry 98.43 W/m, other doors 65.62 W/m, canopies 13.455 W/m2, open sales 5.382 W/m2, street frontage 65.62 W/m', r.rows.slice(1).map(x => +x.per.toFixed(3)), [3.281, 2.153, 10.764, 98.425, 65.617, 13.455, 5.382, 65.617], 0.002);
r = ex({park: 2000, wn: 150, ww: 300, em: 4, eo: 6, can: 40}, 6000);
check('the default site (2000 m2 parking, 150 m narrow walks, 300 m2 plaza, 4 m main entry, 6 m other doors, 40 m2 canopy) is allowed 5692.7 W; 6000 W installed exceeds it by 307.3 W', [+r.elpa.toFixed(1), +r.margin.toFixed(1), r.ok], [5692.7, -307.3, false], 0.2);
check('5692 W installed is within the allowance (the margin is 0.7 W); nothing entered gives no result', [ex({park: 2000, wn: 150, ww: 300, em: 4, eo: 6, can: 40}, 5692).ok, ex({}, 100).elpa], [true, 0]);
w.renderCalc('prmextlight'); w.calcResult('prmextlight');
const tt = doc.getElementById('px_results').textContent;
check('the page shows the allowance 5692.7 W, the excess of 307.3 W and the 🔴 note', [tt.includes('5692.7'), tt.includes('307.3'), tt.includes('🔴')], [true, true, true]);
check('other reference codes open the calculator too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('prmextlight'); x.calcResult('prmextlight'); return x.document.getElementById('px_results').textContent.length > 300; }).join(), 'true,true,true');
}

// ---------- part 85: power factor correction capacitors with harmonics (`pfcharm`: Schneider guide 2015 chapter L, 9.2 and 9.3) ----------
{
w = boot('intl'); doc = w.document;
const ph = o => w.eval('pfhCalc(' + JSON.stringify(Object.assign({ssc: 10000, q: 350, f: 50, sn: 630, gh: 100, us: '400'}, o)) + ')');
let r = ph({});
check('S_sc 10 MVA and 350 kvar: h0 = sqrt(10000 / 350) = 5.345 (the guide prints 5.5), f0 = 267.3 Hz at 50 Hz, nearest order 5: resonance risk', [+r.h0.toFixed(3), +r.f0.toFixed(1), r.near, r.risk], [5.345, 267.3, 5, true]);
check('100 kvar: h0 = 10 (a distance of 1 from 9 and 11): no risk; 60 Hz gives 600 Hz', [ph({q: 100}).h0, ph({q: 100}).risk, ph({q: 100, f: 60}).f0], [10, false, 600]);
check('the general rule with S_sc 10 MVA: limits 83.3 / 142.9 / 333.3 kVA; G_h 50 -> standard, 83.3 -> standard, 100 -> heavy duty +10 %, 200 -> +20 % with detuned reactor, 400 -> filtering', [+r.thr[0].toFixed(1), +r.thr[1].toFixed(1), +r.thr[2].toFixed(1)].concat([50, 83.3, 100, 200, 400].map(g => ph({gh: g}).gen)), [83.3, 142.9, 333.3, 0, 0, 1, 2, 3]);
check('the simplified rule (transformer up to 2 MVA, S_n 630): limits 63 / 126 / 315; G_h 50 -> 0, 100 -> 1, 200 -> 2, 400 -> 3; S_n 2500 has no simplified rule', [ph({}).thrS.map(x => +x.toFixed(0))].concat([50, 100, 200, 400].map(g => ph({gh: g}).sim), ph({sn: 2500}).sim), [[63, 126, 315], 0, 1, 2, 3, null]);
check('non-linear share NLL = G_h / S_n: 63 / 630 = 10 % -> standard capacitors; 15.9 % -> increased current rating; 31.7 % -> detuned reactors', [ph({gh: 63}).nllCls, +ph({}).nll.toFixed(1), ph({}).nllCls, ph({gh: 200}).nllCls], [0, 15.9, 1, 2]);
check('capacitor rated voltage with a detuned reactor: 400 V / 50 Hz 480 V; 690 V / 50 Hz 830 V (no 14 % value); 480 V / 60 Hz 575 V; 600 V / 60 Hz 690 V', [ph({}).un[0], ph({us: '690'}).un[0], ph({us: '690'}).un[2], ph({f: 60, us: '480'}).un[0], ph({f: 60, us: '600'}).un[0]], [480, 830, null, 575, 690]);
check('tuning table: 5.7 % -> order 4.2, 210 Hz (250 at 60 Hz); 7 % -> 3.8, 190 / 230; 14 % -> 2.7, 135 / 160; order = 1 / sqrt(p)', [w.eval('PFH_RX').map(x => x.join('/')).join(' '), +(1 / Math.sqrt(0.057)).toFixed(2), +(1 / Math.sqrt(0.07)).toFixed(2), +(1 / Math.sqrt(0.14)).toFixed(2)], ['5.7/4.2/210/250 7/3.8/190/230 14/2.7/135/160', 4.19, 3.78, 2.67]);
w.renderCalc('pfcharm'); w.calcResult('pfcharm');
const tt = doc.getElementById('pfh_results').textContent;
check('the page derives S_sc = 630 / 6 % = 10.5 MVA, h0 = 5.45, quotes the 480 V capacitor and the 🔴 note', [tt.includes('10.5'), tt.includes('5.48'), tt.includes('480'), tt.includes('🔴')], [true, true, true, true]);
setv(w, 'pfh_gk', 0); setv(w, 'pfh_gw', 70); w.calcResult('pfcharm');
check('loads quoted in kW only are taken at power factor 0.7: 70 kW = 100 kVA (NLL 15.9 %)', [doc.getElementById('pfh_results').textContent.includes('15.9%')], [true]);
check('other reference codes open the calculator too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('pfcharm'); x.calcResult('pfcharm'); return x.document.getElementById('pfh_results').textContent.length > 300; }).join(), 'true,true,true');
}

// ---------- part 85: LV/LV transformers (`lvtransformer`: Schneider guide 2015 chapter N, 3.1 - 3.3) ----------
{
w = boot('intl'); doc = w.document;
const lv = o => w.eval('lvtCalc(' + JSON.stringify(Object.assign({kva: 125, ph: 3, u1: 400, u2: 230, k: 12, uk: 0}, o)) + ')');
let r = lv({});
check('the guide example, 125 kVA 400/230 V: I_n = 180.4 A (secondary 313.8 A); the first peak 12 x I_n = 2165 A, 1531 A r.m.s. (the guide: 1530); aM fuses at least 4 x I_n = 722 A', [+r.I1.toFixed(1), +r.I2.toFixed(1), Math.round(r.peak), Math.round(r.rms), Math.round(r.fuseAm)], [180.4, 313.8, 2165, 1531, 722]);
check('the standard row of 125 kVA: 680 W no load, 3700 W full load, u_sc 4.5 %; secondary short-circuit current 313.8 / 0.045 = 6.97 kA', [r.loss0, r.lossN, r.uk, +(r.isc2 / 1000).toFixed(2)], [680, 3700, 4.5, 6.97]);
check('below 50 kVA the peak is 20 to 25 times (mean 22.5 when no factor is given); from 50 kVA 10 to 15 (mean 12.5)', [lv({kva: 40, k: 0}).kmin, lv({kva: 40, k: 0}).kmax, lv({kva: 40, k: 0}).k, lv({kva: 50, k: 0}).kmin, lv({kva: 50, k: 0}).k], [20, 25, 22.5, 10, 12.5]);
check('a transformer between standard ratings takes the next one up: 126 kVA -> 160 kVA (680 W / 5900 W / 5.5 %); above 800 kVA no row', [lv({kva: 126}).row.join('/'), lv({kva: 900}).row], ['160/680/5900/5.5', null]);
check('single-phase 10 kVA at 230 V: 43.5 A; its row 115 W / 530 W / 5 %', [+lv({kva: 10, ph: 1, u1: 230, u2: 230}).I1.toFixed(1), lv({kva: 10, ph: 1, u1: 230, u2: 230}).row.join('/')], [43.5, '10/115/530/5']);
check('typed tables: 23 three-phase and 14 single-phase ratings', [w.eval('LVT_3P.length'), w.eval('LVT_1P.length')], [23, 14]);
check('a transformer outside the table uses the typed u_sc: 1000 kVA, 6 % -> secondary short circuit I_2 / 0.06', [+(lv({kva: 1000, u1: 400, u2: 400, uk: 6}).isc2 / 1000).toFixed(1)], [+(1000000 / (Math.sqrt(3) * 400) / 0.06 / 1000).toFixed(1)]);
w.renderCalc('lvtransformer'); w.calcResult('lvtransformer');
const tt = doc.getElementById('lt_results').textContent;
check('the page shows 1531 A r.m.s., the 1600 A magnetic setting (200 x 8) above it, and the 🔴 note', [tt.includes('1531'), tt.includes('1600'), tt.includes('🔴')], [true, true, true]);
setv(w, 'lt_m', 5); w.calcResult('lvtransformer');
check('with I_m = 5 x 200 = 1000 A (below the inrush) the page warns', [doc.getElementById('lt_results').textContent.includes('أقل من تيار الاندفاع')], [true]);
check('other reference codes open the calculator too', ['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('lvtransformer'); x.calcResult('lvtransformer'); return x.document.getElementById('lt_results').textContent.length > 300; }).join(), 'true,true,true');
}

// ---------- part 86: Schneider guide 2015, MV/LV substation ventilation (`substationvent`: chapter B 6.4) and harmonic indicators (`harmindex`: chapter M 3 and 4.2) ----------
{
w = boot('intl'); doc = w.document;
const sb2 = o => w.eval('subCalc(' + JSON.stringify(Object.assign({p0: 950, pk: 11000, lf: 1, lv: 750, mv: 300, qcw: 0, qaf: 0, H: 1.5, oh: 10, grid: 'chev90', mesh: false, dTf: 0}, o)) + ')');
let r = sb2({});
check('the guide example, 1250 kVA oil transformer (950 W + 11000 W), LV 750 W, MV 300 W: P = 13.00 kW; H = 1.5 m; air rise 2 x 10 K = 20 K', [+r.P.toFixed(2), +r.Q.toFixed(2), r.dT], [13, 13, 20]);
check('formula 2.1: S = 0.18 x 13 / sqrt(1.5) = 1.91 m2 and S\' = 1.1 S = 2.10 m2 (net areas)', [+r.s1.toFixed(2), +r.s1p.toFixed(2)], [1.91, 2.1]);
check('formula 2.2 with chevron blades at 90 degrees (xi = 12, K = 0.222 / sqrt(12) = 0.064): S = 1.85 m2 and S\' = 2.04 m2 (gross areas)', [+r.K.toFixed(3), +r.s2.toFixed(2), +r.s2p.toFixed(2), r.xi], [0.064, 1.85, 2.04, 12]);
check('other grids: chevron 60 degrees xi 33 (K 0.0386); 38 x 10 mm xi 9 (K 0.074); a vermin mesh adds 5 (xi 17, K 0.0538); a free opening K = 0.1 (S = 1.19 m2)', [+sb2({grid: 'chev60'}).K.toFixed(4), +sb2({grid: 'grid'}).K.toFixed(3), sb2({mesh: true}).xi, +sb2({mesh: true}).K.toFixed(4), sb2({grid: 'free'}).K, +sb2({grid: 'free'}).s2.toFixed(2)], [0.0386, 0.074, 17, 0.0538, 0.1, 1.19]);
check('at 15 K and K = 0.1 formula 2.2 is close to 2.1 (0.172 against 0.18 per kW over sqrt H)', [+(sb2({grid: 'free', oh: 7.5}).s2 / sb2({grid: 'free', oh: 7.5}).s1).toFixed(3)], [0.956], 0.002);
check('forced ventilation and wall conduction reduce Q_nac: 13 kW - 2 kW - 3 kW = 8 kW; the airflow of 3 kW at 10 K = 3000 / (1.2 x 1005 x 10) = 0.249 m3/s', [sb2({qcw: 2, qaf: 3}).Q, +sb2({qcw: 2, qaf: 3, dTf: 10}).flow.toFixed(3)], [8, 0.249]);
check('part load: 60 % load factor gives 950 + 11000 x 0.36 = 4910 W of transformer loss', [+(sb2({lf: 0.6}).ptr * 1000).toFixed(0)], [4910]);
w.renderCalc('substationvent'); w.calcResult('substationvent');
let tt = doc.getElementById('sub_results').textContent;
check('the page shows 13.00 kW, 1.91, 2.10, 1.85, 2.04, the over-15-kW warning only above 15 kW, and the 🔴 note', [tt.includes('13.00'), tt.includes('1.91'), tt.includes('2.04'), tt.includes('15 kW'), tt.includes('🔴')], [true, true, true, false, true]);
setv(w, 'sub_pk', 16000); w.calcResult('substationvent');
check('with 16 kW of load losses (P = 18 kW) the warning above 15 kW appears', [doc.getElementById('sub_results').textContent.includes('15 kW')], [true]);
const hi = (i, u, o) => { const ii = {}, uu = {}; w.eval('HI_ORD').forEach(h => { ii[h] = i[h] || 0; uu[h] = u[h] || 0; }); return w.eval('hiCalc(' + JSON.stringify(Object.assign({i1: 100, cos: 0.95, u1: 400, i: ii, u: uu}, o || {})) + ')'); };
r = hi({5: 30, 7: 20, 11: 10}, {});
check('THD_i = sqrt(30^2 + 20^2 + 10^2) = 37.4 %; I_rms = 100 sqrt(1.14) = 106.8 A; lambda / cos phi = 1 / sqrt(1.14) = 0.937; lambda = 0.95 x 0.937 = 0.890; class "10 to 50 %"; dominant order 5', [+r.thdI.toFixed(1), +r.irms.toFixed(1), +r.ratio.toFixed(3), +r.lambda.toFixed(3), r.clsI, r.dom], [37.4, 106.8, 0.937, 0.89, 1, 5]);
check('classes of THD_i: 10 % normal (0), 10.01 to 49.9 significant (1), 50 % and more major (2)', [hi({5: 10}, {}).clsI, hi({5: 10.1}, {}).clsI, hi({5: 49.9}, {}).clsI, hi({5: 50}, {}).clsI], [0, 1, 1, 2]);
check('the classes of THD_u: 5 % normal, 5.1 to 7.9 significant, 8 % and more major', [hi({}, {5: 5}).clsU, hi({}, {5: 5.1}).clsU, hi({}, {5: 7.9}).clsU, hi({}, {5: 8}).clsU], [0, 1, 1, 2]);
r = hi({}, {5: 6.5, 7: 5, 3: 5.5, 4: 1.2, 6: 0.6});
check('EN 50160 limits per order (Fig. M10): 5 -> 6 %, 7 -> 5, 11 -> 3, 13 -> 3, 17 -> 2, 19 -> 1.5, 3 -> 5, 9 -> 1.5, 15 -> 0.5, 2 -> 2, 4 -> 1; U_5 6.5, U_3 5.5, U_4 1.2 and U_6 0.6 exceed them (U_7 = 5 does not)', [[5, 7, 11, 13, 17, 19, 3, 9, 15, 2, 4].map(h => w.eval('HI_LIM[' + h + ']')), r.bad], [[6, 5, 3, 3, 2, 1.5, 5, 1.5, 0.5, 2, 1], [3, 4, 5, 6]]);
check('THD_u of 6.5 % and 5 % components = 8.2 % (major distortion); the apparent power sqrt(3) x 400 x 100 x sqrt(1.14) = 74.0 kVA with I_1 = 100 A', [+hi({}, {5: 6.5, 7: 5}).thdU.toFixed(1), hi({}, {5: 6.5, 7: 5}).clsU, +hi({5: 30, 7: 20, 11: 10}, {}).apparent.toFixed(1)], [8.2, 2, 74]);
w.renderCalc('harmindex'); w.calcResult('harmindex');
tt = doc.getElementById('hi_results').textContent;
check('the page opens with the 30 / 20 / 10 % spectrum: 37.4, 106.8, 0.937 and the 🔴 note; other reference codes open it too', [tt.includes('37.4'), tt.includes('106.77'), tt.includes('0.937'), tt.includes('🔴')].concat(['jo', 'ae', 'sa'].map(c => { const x = boot(c); x.renderCalc('harmindex'); x.calcResult('harmindex'); const a = x.document.getElementById('hi_results').textContent.length > 300; x.renderCalc('substationvent'); x.calcResult('substationvent'); return a && x.document.getElementById('sub_results').textContent.length > 300; })), [true, true, true, true, true, true, true]);
}

console.log(fail ? `\n${fail} FAIL` : '\nall ok');
if (errors.length) { console.log('jsdom errors:', errors.slice(0, 5)); fail++; }
process.exit(fail ? 1 : 0);
