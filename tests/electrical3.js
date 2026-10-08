// Electrical, part 3: A/C equipment circuits (NEC 440), fire pump circuit (NEC 695), fire alarm battery (NFPA 72 10.6.7.2),
// lightning rolling sphere (SBC 401 ch. 82), elevator feeder (NEC 620), capacitor conductors (NEC 460.8).
//   node tests/electrical3.js
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'SmartEngineering_App.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push((e.detail && e.detail.message) || e.message));
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/',
  beforeParse(w) { w.alert = () => {}; w.scrollTo = () => {}; try { w.localStorage.setItem('si_lang', 'ar'); } catch (e) {} } });
const w = dom.window;
let fail = 0;
function check(name, got, want, tol) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= (tol ?? 0.01) : JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
}
const doc = w.document;
const setv = (id, v) => { doc.getElementById(id).value = String(v); };
const text = id => doc.getElementById(id).textContent;

// ---------- data parsed from NEC Table 430.251(B) ----------
const lrc = (hp, V) => w.eval(`(() => { const r = NEC_LRC_3P.rows.find(x => Math.abs(x[0] - ${hp}) < 1e-3); return r ? r[1][NEC_LRC_3P.volts.indexOf(${V})] : undefined; })()`);
check('Table 430.251(B): 27 horsepower rows', w.eval('NEC_LRC_3P.rows.length'), 27);
check('Table 430.251(B): 10 hp at 460 V = 81 A', lrc(10, 460), 81);
check('Table 430.251(B): 100 hp at 460 V = 725 A', lrc(100, 460), 725);
check('Table 430.251(B): 500 hp at 575 V = 2900 A', lrc(500, 575), 2900);
check('Table 430.251(B): 25 hp at 208 V = 404 A', lrc(25, 208), 404);
check('Table 430.251(B): 1 hp at 115 V = 60 A', lrc(1, 115), 60);
check('Table 430.251(B): 3 hp has no 115 V value', lrc(3, 115), null);
check('Table 430.251(B): 7-1/2 hp at 230 V = 127 A', lrc(7.5, 230), 127);

// ---------- A/C equipment circuits (Article 440) ----------
w.renderCalc('hvacmotor');
setv('hm_om', 0); setv('hm_omx', 0);                                        // the defaults carry a 3 A fan: start with the compressor alone
let hm = w.calcHvacMotor();
check('one 24 A compressor (RLA): conductors 125 % = 30 A (440.32)', [hm.single, hm.Ireq], [true, 30]);
check('... 10 AWG Cu at 75 C and 40 C ambient (35 A x 0.88 = 30.8 A)', hm.cond.s, '10');
check('... branch protection 175 % x 24 = 42 A -> 40 A (not rounded up)', [hm.ocpdRaw, hm.ocpd], [42, 40]);
check('... if it cannot start the compressor: 225 % = 54 A -> 50 A', [hm.ocpdStartRaw, hm.ocpdStart], [54, 50]);
check('... disconnecting means 115 % x 24 = 27.6 A (440.12(A)(1))', hm.disc, 27.6, 1e-9);
check('... EGC for a 40 A device: 10 AWG Cu', hm.egc, '10');
check('... overload relay <= 140 % = 33.6 A', hm.comps[0].relay, 33.6, 1e-9);
check('... overload fuse / breaker <= 125 % = 30 A', hm.comps[0].fuseOl, 30, 1e-9);
check('... thermal protector <= 156 % = 37.44 A', hm.comps[0].thermal, 37.44, 1e-9);
check('... LRA not marked: 6 x RLA = 144 A (440.12(C))', [hm.comps[0].lra, hm.comps[0].lraAssumed], [144, true]);
doc.querySelector('#hm-rows .hm-bcsc').value = '28';
hm = w.calcHvacMotor();
check('branch-circuit selection current 28 A > RLA is used: conductors 35 A', hm.Ireq, 35, 1e-9);
check('... protection 175 % x 28 = 49 A -> 45 A', hm.ocpd, 45);
doc.querySelector('#hm-rows .hm-bcsc').value = '';
doc.querySelector('#hm-rows .hm-lra').value = '130';
check('marked LRA is used when given', w.calcHvacMotor().comps[0].lra, 130);
doc.querySelector('#hm-rows .hm-lra').value = '';
setv('hm_om', 3); setv('hm_omx', 3);
w.addHmRow();
const hmr = doc.querySelectorAll('#hm-rows .hm-row');
hmr[1].querySelector('.hm-rla').value = '18';
hm = w.calcHvacMotor();
check('two compressors + 3 A fan: conductors 42 + 3 + 25 % x 24 = 51 A (440.33)', hm.Ireq, 51, 1e-9);
check('... protection 175 % x 24 + 18 + 3 = 63 A -> 60 A (440.22(B)(1))', [hm.ocpdRaw, hm.ocpd], [63, 60]);
check('... starting limit 225 % x 24 + 18 + 3 = 75 A -> 70 A', hm.ocpdStart, 70);
check('... disconnecting means 115 % x (42 + 3) = 51.75 A (440.12(B)(2))', hm.disc, 51.75, 1e-9);
hmr[1].remove();
setv('hm_om', 0); setv('hm_omx', 0);
doc.querySelector('#hm-rows .hm-rla').value = '5';
hm = w.calcHvacMotor();
check('a 5 A compressor: protection is not required to be below 15 A', hm.ocpd, 15);
setv('hm_om', 10); setv('hm_omx', 10);
hm = w.calcHvacMotor();
check('when a fan motor is the largest load, 440.22(B)(2) applies (not computed)', [hm.largestIsComp, hm.ocpd === undefined], [false, true]);
setv('hm_mode', 'marked'); w.hmMode(); setv('hm_mca', 32); setv('hm_mocp', 50); setv('hm_mrla', 25);
hm = w.calcHvacMotor();
check('marked equipment: conductors >= MCA 32 A: 8 AWG at 40 C (10 AWG gives 30.8 A)', [hm.Ireq, hm.cond.s], [32, '8']);
check('... protection not above MOCP 50 A, EGC for 50 A: 10 AWG', [hm.ocpd, hm.egc], [50, '10']);
check('... disconnecting means 115 % of 25 A', hm.disc, 28.75, 1e-9);
w.calcResult('hvacmotor');
check('A/C results rendered', text('hm_results').includes('440.35'), true);
setv('hm_mode', 'comp'); w.hmMode();
doc.querySelector('#hm-rows .hm-rla').value = '24'; setv('hm_om', 0); setv('hm_omx', 0);
w.hmSend();
check('A/C send to cable sizing: the conductor ampacity as a current', [doc.getElementById('cs_mode').value, +doc.getElementById('cs_load').value, +doc.getElementById('cs_cont').value], ['amp', 30, 0]);
check('... 400 V three-phase, 40 C ambient', [+doc.getElementById('cs_volt').value, doc.getElementById('cs_phase').value, +doc.getElementById('cs_amb').value], [400, '3', 40]);

// ---------- fire pump circuit (Article 695) ----------
w.renderCalc('firepump');
setv('fp_jhp', 0);                                                            // the default has a 3 hp jockey pump: start with the fire pump alone
let fp = w.calcFirePump();
check('100 hp at 460 V: FLC 124 A', fp.Ifp, 124);
check('motor only: conductors 125 % x 124 = 155 A (430.22 via 695.6(C)(2))', [fp.onlyMotor, fp.Ireq], [true, 155]);
check('locked-rotor current from Table 430.251(B): 725 A', [fp.lrcFp, fp.lrcFromTable], [725, true]);
check('overcurrent device carries 725 A indefinitely: next standard 800 A (695.4(B)(1))', [fp.ocpdMin, fp.ocpd], [725, 800]);
check('EGC for an 800 A device: 1/0 AWG Cu', fp.egc, '1/0');
check('transformer >= 125 % x FLC x sqrt3 x V = 123.5 kVA (695.5(A))', fp.trKva, 1.25 * 124 * Math.sqrt(3) * 460 / 1000, 1e-9);
setv('fp_jhp', 3); setv('fp_acc', 2); fp = w.calcFirePump();
check('with a 3 hp jockey (4.8 A) and 2 A of accessories: 125 % x 128.8 + 2 = 163 A (695.6(C)(1))', fp.Ireq, 163, 1e-9);
check('... device >= 725 + 32 + 2 = 759 A -> 800 A', [fp.ocpdMin, fp.ocpd], [759, 800]);
setv('fp_jhp', 0); setv('fp_acc', 0);
setv('fp_lrc', 600); fp = w.calcFirePump();
check('motor-plate locked-rotor current 600 A overrides the table: device 600 A', [fp.lrcFromTable, fp.ocpd], [false, 600]);
setv('fp_lrc', 0);
// voltage drop: short run is governed by ampacity, a long run by the 695.7 limits
setv('fp_len', 5); fp = w.calcFirePump();
check('5 m: the ampacity conductor (2/0 AWG at 75 C) also meets 695.7', [fp.chosen.s, fp.byAmp.s], ['2/0', '2/0']);
setv('fp_len', 300); fp = w.calcFirePump();
const t9 = s => w.eval(`NEC_T9['${s}']`);
const vdS = (s, I, L, pf) => Math.sqrt(3) * I * (L / 1000) * (t9(s).rcu[0] * pf + t9(s).xl[0] * Math.sqrt(1 - pf * pf)) / 460 * 100;
check('300 m: the conductor is larger than the ampacity size (voltage drop governs)', w.eval(`necSizeIdx('${fp.chosen.s}')`) > w.eval(`necSizeIdx('${fp.byAmp.s}')`), true);
check('... starting drop of the chosen size is within 15 %', fp.chosen.vdStart <= 15, true);
check('... and it is computed with sqrt3 x I x L x (R cos + X sin) / V from Table 9', fp.chosen.vdStart, vdS(fp.chosen.s, 725, 300, 0.3), 1e-9);
check('... running drop at 115 % FLC is within 5 %', [fp.chosen.vdRun <= 5, Math.abs(fp.chosen.vdRun - vdS(fp.chosen.s, 1.15 * 124, 300, 0.85)) < 1e-9], [true, true]);
setv('fp_len', 40); setv('fp_up', 12); fp = w.calcFirePump();
check('12 % source drop at starting leaves only 3 % for the cable (40 m)', [fp.up, fp.up + fp.chosen.vdStart <= 15], [12, true]);
setv('fp_up', 0);
setv('fp_volt', 230); setv('fp_hp', 250); fp = w.calcFirePump();
check('250 hp at 230 V is not in Table 430.250', fp.noTable, true);
w.calcResult('firepump');
check('missing table value is reported', text('fp_results').includes('430.250'), true);
setv('fp_volt', 460); setv('fp_hp', 100); setv('fp_len', 100);
w.calcResult('firepump');
check('fire pump results rendered with 695.7', text('fp_results').includes('695.7'), true);

// ---------- fire alarm secondary supply (NFPA 72 10.6.7.2) ----------
w.renderCalc('alarmbattery');
let ab = w.calcAlarmBattery();
check('standby current: 120 mA + 60 x 0.3 mA = 138 mA', ab.iq, 0.138, 1e-9);
check('alarm current: 250 + 60 x 0.5 + 20 x 75 = 1780 mA', ab.ia, 1.78, 1e-9);
check('24 h of standby: 3.312 Ah', ab.ahSb, 0.138 * 24, 1e-9);
check('5 minutes of alarm: 0.148 Ah', ab.ahAl, 1.78 * 5 / 60, 1e-9);
check('required capacity with the 20 % margin = 4.152 Ah', ab.req, (0.138 * 24 + 1.78 * 5 / 60) * 1.2, 1e-9);
check('nearest common battery 4.5 Ah', ab.next, 4.5);
setv('ab_margin', 10); setv('ab_hours', 10); ab = w.calcAlarmBattery();
check('the margin cannot go below 20 % and the standby below 24 h', [ab.margin, ab.hours], [20, 24]);
setv('ab_margin', 20);
setv('ab_type', 'voice'); w.abType(); ab = w.calcAlarmBattery();
check('voice evacuation: 15 minutes of alarm (10.6.7.2.1.2)', [ab.minutes, ab.ahAl], [15, 1.78 * 15 / 60], 1e-9);
setv('ab_min', 5); ab = w.calcAlarmBattery();
check('the alarm duration cannot be shortened below the code value', ab.minutes, 15);
setv('ab_type', 'co'); w.abType(); ab = w.calcAlarmBattery();
check('CO detection not monitored: 12 hours of alarm (10.6.7.2.3)', [ab.minutes, ab.ahAl], [720, 1.78 * 12], 1e-9);
setv('ab_type', 'com'); w.abType(); ab = w.calcAlarmBattery();
check('CO detection monitored by a supervising station: 5 minutes (10.6.7.2.4)', ab.minutes, 5);
setv('ab_type', 'fa'); w.abType();
setv('ab_ah', 7); check('a 7 Ah battery is enough', w.calcAlarmBattery().ok, true);
setv('ab_ah', 4); check('a 4 Ah battery is not enough', w.calcAlarmBattery().ok, false);
setv('ab_ah', 0);
doc.querySelectorAll('#ab-rows .ab-row')[2].remove();
check('deleting the notification row removes its alarm current', w.calcAlarmBattery().ia, 0.28, 1e-9);
w.addAbRow();
check('adding a row works', doc.querySelectorAll('#ab-rows .ab-row').length, 3);
w.calcResult('alarmbattery');
check('battery results rendered', text('ab_results').includes('10.6.7.2'), true);

// ---------- lightning: rolling sphere (SBC 401 chapter 82) ----------
w.renderCalc('lightning');
let lp = w.calcLightning();
check('LPL III: R = 45 m, minimum peak current 10 kA (Table 82-4)', [lp.R, lp.p.imin], [45, 10]);
check('mast 25 m: radius at ground = sqrt(25 x 65) = 40.31 m', lp.r0, Math.sqrt(1625), 1e-9);
check('radius at 15 m = 40.31 - sqrt(15 x 75) = 6.77 m', lp.rz, Math.sqrt(1625) - Math.sqrt(1125), 1e-9);
setv('lp_lpl', 1); lp = w.calcLightning();
check('LPL I: R = 20 m, minimum peak current 3 kA, maximum 200 kA', [lp.R, lp.p.imin, lp.p.imax], [20, 3, 200]);
check('LPL I, mast 25 m is capped at R: radius 20 m with a warning', [lp.r0, lp.warnings.length], [20, 1]);
setv('lp_lpl', 2); lp = w.calcLightning();
check('LPL II: R = 30 m, 5 kA, 150 kA, probabilities 0.98 / 0.97 (Table 82-5)', [lp.R, lp.p.imin, lp.p.imax, lp.p.pMax, lp.p.pMin], [30, 5, 150, 0.98, 0.97]);
setv('lp_lpl', 4); lp = w.calcLightning();
check('LPL IV: R = 60 m, 16 kA, 100 kA, probabilities 0.95 / 0.84', [lp.R, lp.p.imin, lp.p.imax, lp.p.pMax, lp.p.pMin], [60, 16, 100, 0.95, 0.84]);
setv('lp_lpl', 3); setv('lp_h', 25); setv('lp_z', 15); setv('lp_d', 40); lp = w.calcLightning();
check('two masts 40 m apart: the sphere sags R - sqrt(R2 - 400) = 4.69 m', lp.pair.sag, 45 - Math.sqrt(2025 - 400), 1e-9);
check('... the protected height at the midpoint is 25 - 4.69 = 20.3 m', lp.pair.zmid, 25 - (45 - Math.sqrt(1625)), 1e-9);
check('... a 15 m roof is protected at the midpoint', lp.pair.protectsZ, true);
setv('lp_z', 22); lp = w.calcLightning();
check('... a 22 m roof is not', lp.pair.protectsZ, false);
setv('lp_d', 90); lp = w.calcLightning();
check('masts 2R apart: the sphere passes between them', lp.pair.fail, true);
setv('lp_z', 30); setv('lp_d', 0); lp = w.calcLightning();
check('a roof above the mast tip is not protected by it', lp.zOver, true);
setv('lp_z', 15);
w.calcResult('lightning');
check('lightning results rendered', text('lp_results').includes('82-4'), true);

// ---------- elevator feeder (Article 620) ----------
check('Table 620.14: 1 -> 1.00, 2 -> 0.95, 3 -> 0.90, 4 -> 0.85, 5 -> 0.82, 6 -> 0.79, 7 -> 0.77, 8 -> 0.75, 9 -> 0.73, 10 -> 0.72', w.eval('NEC_T62014'), [1, 0.95, 0.9, 0.85, 0.82, 0.79, 0.77, 0.75, 0.73, 0.72]);
w.renderCalc('elevatorfeeder');
let ef = w.calcElevatorFeeder();
check('4 elevators of 60 A: demand factor 0.85 -> 204 A', [ef.df, ef.I], [0.85, 204], 1e-9);
check('... without the demand factor (620.13(D)): 240 A', ef.Inodf, 240);
check('... conductor 4/0 AWG Cu at 75 C (230 A; 3/0 gives 200 A)', ef.cond.s, '4/0');
check('... apparent power sqrt3 x 400 x 204 = 141.3 kVA', ef.kva, Math.sqrt(3) * 400 * 204 / 1000, 1e-9);
setv('ef_n', 1); ef = w.calcElevatorFeeder();
check('one elevator: no reduction (620.13(B))', [ef.df, ef.I], [1, 60]);
setv('ef_n', 12); ef = w.calcElevatorFeeder();
check('12 elevators: the 10-or-more factor 0.72', ef.df, 0.72);
setv('ef_n', 4); setv('ef_oth', 6); ef = w.calcElevatorFeeder();
check('other connected loads are added after the demand factor: 204 + 6 = 210 A', ef.I, 210, 1e-9);
w.efSend();
check('elevator send to cable sizing: 210 A, 400 V, three-phase, no extra 125 %', [+doc.getElementById('cs_load').value, +doc.getElementById('cs_volt').value, doc.getElementById('cs_phase').value, +doc.getElementById('cs_cont').value], [210, 400, '3', 0]);
w.renderCalc('elevatorfeeder'); w.calcResult('elevatorfeeder');
check('elevator results rendered', text('ef_results').includes('620.14'), true);

// ---------- capacitor circuit (NEC 460.8) in the power factor calculator ----------
w.renderCalc('pfcorrection');
const pf = w.calcPFCorrection();
w.calcResult('pfcorrection');
check('the power factor results show the NEC 460.8 conductor / disconnect rating', text('pf_results').includes('460.8'), true);
check('... 135 % of the capacitor current', Math.round(1.35 * pf.Ic), Math.round(1.35 * pf.Q * 1000 / (Math.sqrt(3) * 400)));

// ---------- screens ----------
w.showCategory('electrical');
const cards = doc.getElementById('electrical-category').textContent;
check('electrical screen lists the new calculators', ['معدات التكييف والتبريد', 'مضخة الحريق', 'بطارية إنذار الحريق', 'كرة الدحرجة', 'مغذّي المصاعد'].every(s => cards.includes(s)), true);
check('electrical screen has 14 calculator cards', doc.querySelectorAll('#electrical-category .calc-card').length, 14);

check('no page errors', errors.length, 0);
if (errors.length) console.log(errors.slice(0, 3));
console.log(fail ? `${fail} electrical-3 check(s) FAILED` : 'all electrical-3 checks passed');
process.exit(fail ? 1 : 0);
