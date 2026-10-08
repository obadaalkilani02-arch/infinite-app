// Heating extras: expansion tank, chimney check, diesel tank, warm-air heating (Syrian Arab Code §3/10/1, §7/39, §7/35-36, §4/2/2/1/3).
//   node tests/heatingmore.js
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
const status = (r, k) => r.checks.find(c => c.k === k).ok;

// ---------- expansion tank: V = 0.025 Q / dt ----------
w.renderCalc('heatexpansion');
let hx = w.calcHeatExpansion();
check('100 kW at 80/60: V = 0.025 x 100 / 20 = 0.125 m3', hx.V, 0.125, 1e-9);
check('... = 125 L', hx.L, 125, 1e-6);
setv('hx_ts', 90); setv('hx_tr', 60); hx = w.calcHeatExpansion();
check('dt 30 K: V = 0.0833 m3', hx.V, 0.025 * 100 / 30, 1e-9);
setv('hx_q', 400); hx = w.calcHeatExpansion();
check('400 kW at dt 30: V = 0.3333 m3', hx.V, 0.025 * 400 / 30, 1e-9);
setv('hx_ts', 60); setv('hx_tr', 70); hx = w.calcHeatExpansion();
check('return hotter than supply: invalid, no volume', hx.bad && hx.V === 0, true);
w.calcResult('heatexpansion');
check('invalid input is flagged on screen', doc.getElementById('hx_results').textContent.includes('أعلى من حرارة الإياب'), true);
setv('hx_ts', 80); setv('hx_tr', 60);
w.calcResult('heatexpansion');
check('open tank: lists the 50 mm make-up opening and the 5 cm insulation', /50 mm/.test(doc.getElementById('hx_results').textContent) && /5 cm/.test(doc.getElementById('hx_results').textContent), true);
setv('hx_type', 'closed'); w.calcResult('heatexpansion');
check('closed tank: lists BS 4814 and the diaphragm', /BS 4814/.test(doc.getElementById('hx_results').textContent) && doc.getElementById('hx_results').textContent.includes('غشاء'), true);
check('results show the volume in litres', doc.getElementById('hx_results').textContent.includes('V = 0.025'), true);

// ---------- chimney check ----------
w.renderCalc('chimney');
let ch = w.calcChimney();
check('default steel chimney: no failed checks', ch.fails, 0);
check('default: 8 checks pass, bends / stabilizer / CO2 not applicable', ch.passes, 8);
check('flue outlet area for 200 mm = 314 cm2', ch.aFlue, Math.PI / 4 * 200 * 200 / 100, 0.01);
check('chimney section for 300 mm = 707 cm2', ch.aCh, Math.PI / 4 * 300 * 300 / 100, 0.01);
setv('ch_dconn', 150); ch = w.calcChimney();
check('connector smaller than the flue outlet fails (7/39 a)', status(ch, 'conn'), false);
setv('ch_dconn', 200);
setv('ch_lconn', 3.1); ch = w.calcChimney();
check('connector 3.1 m on a 12 m chimney (limit 3.0 m = 25 %) fails', status(ch, 'len'), false);
setv('ch_lconn', 3); setv('ch_h', 8); ch = w.calcChimney();
check('same connector on an 8 m chimney (limit 2 m) fails', status(ch, 'len'), false);
setv('ch_h', 12);
setv('ch_slope', 0.03); ch = w.calcChimney();
check('slope 0.03 < 0.05 fails (7/20/7)', status(ch, 'slope'), false);
setv('ch_slope', 0.05);
setv('ch_tconn', 2); ch = w.calcChimney();
check('2 mm connector plate fails (>= 3 mm)', status(ch, 'thick'), false);
setv('ch_tconn', 3);
setv('ch_iconn', 20); ch = w.calcChimney();
check('20 mm insulation fails the stricter 25 mm of 7/20/7', status(ch, 'ins'), false);
setv('ch_iconn', 25);
setv('ch_rbend', 300); ch = w.calcChimney();
check('bend radius 300 mm < 2 x 200 mm fails', status(ch, 'bend'), false);
setv('ch_rbend', 400); ch = w.calcChimney();
check('bend radius 400 mm = 2 x 200 mm passes', status(ch, 'bend'), true);
setv('ch_rbend', 0);
setv('ch_d', 150); ch = w.calcChimney();
check('chimney section 177 cm2 < flue outlet 314 cm2 fails (7/39 b)', status(ch, 'area'), false);
setv('ch_shape', 'rect'); setv('ch_d', 200); setv('ch_b', 150); ch = w.calcChimney();
check('rectangular 200 x 150 = 300 cm2 < 314 cm2 fails', status(ch, 'area'), false);
setv('ch_d', 250); ch = w.calcChimney();
check('rectangular 250 x 150 = 375 cm2 passes', status(ch, 'area'), true);
setv('ch_shape', 'round'); setv('ch_d', 300);
setv('ch_roof', 2); ch = w.calcChimney();
check('top only 2.0 m above the roof fails (>= 2.5 m)', status(ch, 'roof'), false);
setv('ch_roof', 2.5);
setv('ch_wool', 30); ch = w.calcChimney();
check('steel chimney with 30 mm rock wool fails (>= 50 mm)', status(ch, 'wool'), false);
setv('ch_type', 'brick'); ch = w.calcChimney();
check('brick chimney: the rock-wool check does not apply', status(ch, 'wool'), null);
setv('ch_type', 'steel'); setv('ch_wool', 50);
setv('ch_n', 2); ch = w.calcChimney();
check('two boilers without a draft stabilizer fail', status(ch, 'stab'), false);
setv('ch_stab', 'yes'); ch = w.calcChimney();
check('two boilers with a draft stabilizer pass', status(ch, 'stab'), true);
setv('ch_n', 1);
setv('ch_co2', 13); ch = w.calcChimney();
check('CO2 13 % > 12 % fails', status(ch, 'co2'), false);
setv('ch_co2', 11.5); ch = w.calcChimney();
check('CO2 11.5 % passes', status(ch, 'co2'), true);
setv('ch_co2', 0);
w.calcResult('chimney');
check('results rendered with the DIN 4705 note', doc.getElementById('ch_results').textContent.includes('DIN 4705'), true);
setv('ch_dconn', 150); w.calcResult('chimney');
check('a failed check shows the warning', doc.getElementById('ch_results').textContent.includes('عدّل التصميم'), true);

// ---------- warm-air heating ----------
w.renderCalc('airheating');
let ah = w.calcAirHeating();
check('12 kW, 20 -> 45 C: V = 12000 / (0.342 x 25) = 1403.5 m3/h', ah.Vh, 12000 / (0.342 * 25), 1e-6);
check('all-return air: no outside-air load', ah.Qoa, 0, 1e-9);
check('all-return air: coil = room load', ah.Qcoil, 12000, 1e-6);
check('all-return air: mixed temperature = room temperature', ah.tmix, 20, 1e-9);
setv('ah_mode', 'fresh'); w.ahMode(); ah = w.calcAirHeating();
check('all-fresh air: ratio 100 %', ah.f, 1);
check('all-fresh air: fraction field locked', doc.getElementById('ah_f').disabled, true);
check('all-fresh air: outside-air load 0.342 x V x (20 - 0) = 9600 W', ah.Qoa, 0.342 * ah.Vh * 20, 1e-6);
check('all-fresh air: coil = load + outside air', ah.Qcoil, 12000 + ah.Qoa, 1e-6);
check('all-fresh air: coil = 0.342 V (ts - tmix)', ah.Qcoil, 0.342 * ah.Vh * (45 - ah.tmix), 1e-6);
setv('ah_mode', 'mix'); w.ahMode(); setv('ah_f', 30); ah = w.calcAirHeating();
check('mixture: fraction field editable', doc.getElementById('ah_f').disabled, false);
check('30 % outside air at 0 C: mixed temperature = 14 C', ah.tmix, 14, 1e-9);
check('30 % outside air: outside-air load', ah.Qoa, 0.342 * 0.3 * ah.Vh * 20, 1e-6);
check('2 units share the air and the coil load equally', ah.perAir * 2, ah.Vh, 1e-9);
check('water flow of the coil at 80/60', ah.waterLs, ah.Qcoil / 1000 / (4.19 * 20) / w.waterRho(70) * 1000, 1e-6);
setv('ah_vol', 200); ah = w.calcAirHeating();
check('air changes = V / room volume', ah.ach, ah.Vh / 200, 1e-9);
setv('ah_ts', 18); ah = w.calcAirHeating();
check('supply colder than the room: invalid', ah.bad, true);
w.calcResult('airheating');
check('invalid supply temperature is flagged on screen', doc.getElementById('ah_results').textContent.includes('أعلى من حرارة المكان'), true);
setv('ah_ts', 45); w.calcResult('airheating');
check('results rendered', doc.getElementById('ah_results').textContent.includes('وشيعة التسخين'), true);

// ---------- links from the heating-load calculator ----------
try { w.localStorage.removeItem('si_heat_rooms'); } catch (e) {}
w.eval('HEAT_MEM = null');
function twoRooms(n1, a1, n2, a2) {
  w.renderCalc('heatingload');
  setv('hl_to', -2); setv('hl_safety', 15);
  const first = doc.querySelectorAll('#hl-rooms .hl-room')[0];
  first.querySelector('.hl-name').value = n1; first.querySelector('.hl-area').value = String(a1); first.querySelector('.hl-ti').value = '24';
  w.addHlRoom();
  const second = doc.querySelectorAll('#hl-rooms .hl-room')[1];
  second.querySelector('.hl-name').value = n2; second.querySelector('.hl-area').value = String(a2); second.querySelector('.hl-ti').value = '20';
}
w.renderCalc('heatexpansion');
check('no stored load: the expansion tank keeps its default 100 kW', +doc.getElementById('hx_q').value, 100);
twoRooms('Salon', 30, 'Bedroom', 14);
const hl = w.calcHeatingLoad();
w.hlSendRooms('heatexpansion');
check('expansion tank gets the boiler capacity (kW)', +doc.getElementById('hx_q').value, +hl.Qb.toFixed(2), 0.0001);
check('expansion tank result follows the boiler capacity', w.calcHeatExpansion().V, 0.025 * +hl.Qb.toFixed(2) / 20, 1e-9);
w.renderCalc('heatexpansion');
check('reopening without a new send keeps the default', +doc.getElementById('hx_q').value, 100);
doc.querySelector('button[onclick="hxImport()"]').click();
check('the import button brings the boiler capacity back', +doc.getElementById('hx_q').value, +hl.Qb.toFixed(2), 0.0001);

twoRooms('Salon', 30, 'Bedroom', 14);
w.hlSendRooms('fueltank');
let ft = w.calcFuelTank();
check('fuel tank: heating load from the calculator (kW)', ft.QH, +(hl.QH / 1000).toFixed(3), 0.0001);
check('fuel tank: boiler capacity from the calculator', ft.Qb, +hl.Qb.toFixed(2), 0.0001);
check('fuel tank: burner consumption = Qb / (Cv x eta)', ft.burnerKgH, ft.Qb / (11.6 * 0.85), 1e-9);
check('fuel tank: annual fuel equals the heating-load calculator (kg)', ft.annualKg, hl.annualKg, hl.annualKg * 0.001);
check('fuel tank: average day = annual / season days', ft.dailyKg, ft.annualKg / 150, 1e-9);
check('fuel tank: main tank = daily kg x 15 days / 0.85', ft.mainL, ft.dailyKg * 15 / 0.85, 1e-6);
check('fuel tank: day tank = burner kg/h x 8 h / 0.85', ft.dayL, ft.burnerKgH * 8 / 0.85, 1e-6);
setv('ft_days', 30); setv('ft_rho', 0.9); ft = w.calcFuelTank();
check('fuel tank: 30 days at 0.9 kg/L', ft.mainL, ft.dailyKg * 30 / 0.9, 1e-6);
setv('ft_kind', 'buried'); w.calcResult('fueltank');
check('buried tank lists the 500 mm vent height and the 12 cm slab', /500 mm/.test(doc.getElementById('ft_results').textContent) && /12 cm/.test(doc.getElementById('ft_results').textContent), true);
setv('ft_kind', 'unburied'); w.calcResult('fueltank');
check('unburied tank lists the 0.5 m base', /0\.5 m/.test(doc.getElementById('ft_results').textContent), true);
w.renderCalc('fueltank');
check('fuel tank: reopening keeps the defaults', +doc.getElementById('ft_qh').value, 100);
doc.querySelector('button[onclick="ftImport()"]').click();
check('fuel tank: import button restores the load', +doc.getElementById('ft_qh').value, +(hl.QH / 1000).toFixed(3), 0.0001);

twoRooms('Salon', 30, 'Bedroom', 14);
w.hlSendRooms('airheating');
const rs = doc.getElementById('ah_room');
check('warm air: room picker lists both rooms', rs && rs.options.length, 3);
rs.value = '1'; rs.dispatchEvent(new w.Event('change'));
check('warm air: picking a room fills its load (W)', +doc.getElementById('ah_q').value, Math.round(hl.rooms[1].q * (1 + hl.safety)));
check('warm air: ... its room temperature', +doc.getElementById('ah_ti').value, 20);
check('warm air: ... the design outdoor temperature', +doc.getElementById('ah_to').value, -2);
check('warm air: ... and the room volume', +doc.getElementById('ah_vol').value, Math.round(hl.rooms[1].volume));
// what was sent to one calculator is not auto-imported by another
twoRooms('Salon', 30, 'Bedroom', 14);
w.hlSendRooms('heatexpansion');
w.renderCalc('fueltank');
check('a send to the expansion tank does not fill the fuel tank', +doc.getElementById('ft_qh').value, 100);
// the old snapshot format (before the boiler data existed) must not break the new calculators
w.eval('hlSaveSnapshot({rooms:[{name:"x",ti:20,A:10,q:500}], QH:500, to:0, safety:0.15, pending:false})');
w.renderCalc('heatexpansion');
check('old snapshot without boiler data: default value, no crash', +doc.getElementById('hx_q').value, 100);
w.renderCalc('fueltank');
check('old snapshot: fuel tank still opens', +doc.getElementById('ft_qh').value, 100);

// ---------- screens ----------
w.showCategory('heating');
const cards = doc.getElementById('heating-category').textContent;
check('heating screen lists the four new calculators', ['خزان التمدد', 'فحص مدخنة', 'خزانات المازوت', 'التدفئة بالهواء'].every(s => cards.includes(s)), true);
check('heating screen has 8 calculator cards', doc.querySelectorAll('#heating-category .calc-card').length, 8);

check('no page errors', errors.length, 0);
if (errors.length) console.log(errors.slice(0, 3));
console.log(fail ? `${fail} heating-extras check(s) FAILED` : 'all heating-extras checks passed');
process.exit(fail ? 1 : 0);
