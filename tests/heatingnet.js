// Heating network: pipe sizing + pump, radiators, underfloor loops (Syrian Arab Code §3/10/5, §7/29, §7/33, §7/40).
//   node tests/heatingnet.js
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

// ---------- water properties ----------
check('density of water at 20 C = 998.2', w.waterRho(20), 998.2, 0.2);
check('density of water at 80 C = 971.8', w.waterRho(80), 971.8, 0.3);
check('viscosity of water at 20 C = 1.00 mPa.s', w.waterMu(20) * 1000, 1.0, 0.03);
check('viscosity of water at 80 C = 0.355 mPa.s', w.waterMu(80) * 1000, 0.355, 0.012);

// ---------- Table 33/3 erosion limit ----------
check('erosion limit 3000 h = 4.0 m/s', w.hpErosionLimit(3000), 4.0);
check('erosion limit 3600 h uses the 4000 h row = 3.7 m/s', w.hpErosionLimit(3600), 3.7);
check('erosion limit 6000 h = 3.0 m/s', w.hpErosionLimit(6000), 3.0);

// ---------- pipe sizing ----------
w.renderCalc('heatingpipes');
setv('hp_ts', 80); setv('hp_tr', 60); setv('hp_hours', 3600);
let r = w.calcHeatingPipes();
const m = 100 / (4.19 * 20), Q = m / w.waterRho(70);
check('flow of 100 kW at 20 K = 1.2205 L/s', Q * 1000, 1.2205, 0.001);
check('100 kW main: DN 40 (DN 32 would need 1.26 m/s > 1.2 m/s, Table 31/3)', r.rows[0].sel.dn, 40);
check('velocity in the chosen pipe below 1.2 m/s', r.rows[0].sel.V < 1.2, true);
check('2 kW radiator connection: DN 15', r.rows[2].sel.dn, 15);
// above 50 mm the limit is friction 400 Pa/m
const tbody = doc.getElementById('hp-tbody');
tbody.querySelectorAll('tr')[0].querySelector('.hp-kw').value = '1500';
r = w.calcHeatingPipes();
check('1500 kW main: size above 50 mm, friction <= 400 Pa/m', r.rows[0].sel.dn > 50 && r.rows[0].sel.pa <= 400, true);
const idx = w.eval('HP_STEEL.findIndex(s => s[1] === ' + r.rows[0].sel.dn + ')');
if (idx > 0) {
  const smaller = w.eval('HP_STEEL[' + (idx - 1) + ']'), rho = w.waterRho(70), mu = w.waterMu(70);
  const Qm3 = 1500 / (4.19 * 20) / rho, D = smaller[2] / 1000, V = Qm3 / (Math.PI / 4 * D * D);
  const pa = w.frictionFactor(rho * V * D / mu, 0.045, smaller[2]) / D * rho * V * V / 2;
  check('the next smaller size exceeds the limit (friction > 400 Pa/m or above 50 mm rule / erosion)', smaller[1] <= 50 ? V > 1.2 : (pa > 400 || V > 3.7), true);
}
// pressure drop adds up: flow + return, with fittings
tbody.querySelectorAll('tr')[0].querySelector('.hp-kw').value = '100';
r = w.calcHeatingPipes();
const manual = r.rows.reduce((s, x) => s + (x.kw > 0 ? x.sel.pa * x.len * 2 * (1 + x.fit / 100) / 1000 : 0), 0);
check('critical path pressure drop = sum of pa x 2L x (1 + fittings)', r.dpTotal, manual, 0.0001);
check('pump head = pipes + extra 30 kPa', r.headKPa, r.dpTotal + 30, 0.0001);
check('pump flow for 100 kW at 20 K', r.QPls, 100 / (4.19 * 20) / w.waterRho(70) * 1000, 0.001);
check('hydraulic power = Q x head', r.hyd, r.QPls / 1000 * r.headKPa, 0.0001);
check('motor at least 20 % above the shaft power (code 7/33)', r.motor >= r.shaft * 1.2, true);
check('shut-off head about 15 % above the duty head', r.shutoffM, r.headM * 1.15, 0.0001);
check('results rendered', /ضاغط المضخة|الضاغط الكلي/.test(doc.getElementById('hp_results').textContent), true);

// ---------- radiators ----------
w.renderCalc('radiators');
setv('rd_ts', 80); setv('rd_tr', 60); setv('rd_rated', 150); setv('rd_dtr', 50); setv('rd_n', 1.3); setv('rd_method', 'log');
doc.querySelectorAll('#rd-tbody tr')[0].querySelector('.rd-q').value = '1200';
let rr = w.calcRadiators();
const dtlog = 20 / Math.log((80 - 22) / (60 - 22));
check('log-mean temperature difference 47.27 K', rr.rows[0].dt, dtlog, 0.0001);
check('element output = 150 x (dt/50)^1.3', rr.rows[0].out, 150 * Math.pow(dtlog / 50, 1.3), 0.0001);
check('elements = ceil(1200 / output)', rr.rows[0].count, Math.ceil(1200 / (150 * Math.pow(dtlog / 50, 1.3))));
check('installed >= required', rr.rows[0].inst >= 1200, true);
setv('rd_method', 'arith'); rr = w.calcRadiators();
check('arithmetic dt = 70 - 22 = 48', rr.rows[0].dt, 48, 0.0001);
setv('rd_ts', 50); setv('rd_tr', 40); setv('rd_rated', 150); rr = w.calcRadiators();
check('lower water temperature -> fewer W per element -> more elements', rr.rows[0].count > 9, true);
setv('rd_ts', 20); setv('rd_tr', 18); rr = w.calcRadiators();
check('water colder than the room: no output', rr.rows[0].out, 0);
check('results rendered', /ملخص المشعات/.test(doc.getElementById('rd_results').textContent), true);

// ---------- underfloor heating ----------
w.renderCalc('floorheating');
let fr = w.calcFloorHeating();
check('pipe length = 40 m2 / 0.15 m = 266.7 m', fr.area, 40 / 0.15, 0.01);
check('total with 2 x 5 m to the manifold = 276.7 m', fr.total, 40 / 0.15 + 10, 0.01);
check('circuits = ceil(276.7 / 110) = 3', fr.N, 3);
check('loop length 92.2 m (<= 110 m)', fr.per, (40 / 0.15 + 10) / 3, 0.01);
check('total flow 3200 W at 8 K ~ 345.7 L/h', fr.flowLh, 3200 / 1000 / (4.19 * 8) / w.waterRho(41) * 3600 * 1000, 0.01);
check('PEX 16 x 2: velocity ~ 0.28 m/s per loop', fr.V, fr.loopLh / 3.6e6 / (Math.PI / 4 * 0.012 * 0.012), 0.001);
check('45 C supply is within the 50 C limit', fr.tooHot, false);
setv('fh_ts', 55); fr = w.calcFloorHeating();
check('55 C supply exceeds the 50 C limit of section 7/40', fr.tooHot, true);
setv('fh_area', 12); setv('fh_feed', 3); fr = w.calcFloorHeating();
check('small room: one circuit', fr.N, 1);

// ---------- link: heating load -> radiators / underfloor ----------
try { w.localStorage.removeItem('si_heat_rooms'); } catch (e) {}
w.eval('HEAT_MEM = null');
w.renderCalc('radiators');
check('radiators with no calculated rooms: the default 3 rows', doc.querySelectorAll('#rd-tbody tr').length, 3);
check('radiators with no calculated rooms: a hint to send the rooms first', doc.body.textContent.includes('إرسال حمل الغرف إلى حاسبة المشعات'), true);
w.renderCalc('heatingload');
setv('hl_to', 0); setv('hl_safety', 15);
const roomsEl = doc.querySelectorAll('#hl-rooms .hl-room');
roomsEl[0].querySelector('.hl-name').value = 'Salon';
roomsEl[0].querySelector('.hl-ti').value = '24';
roomsEl[0].querySelector('.hl-area').value = '30';
w.addHlRoom();
const room2 = doc.querySelectorAll('#hl-rooms .hl-room')[1];
room2.querySelector('.hl-name').value = 'Bedroom';
room2.querySelector('.hl-ti').value = '20';
room2.querySelector('.hl-area').value = '14';
const hl = w.calcHeatingLoad();
w.hlSendRooms('radiators');
const rows = doc.querySelectorAll('#rd-tbody tr');
check('sending the rooms fills the radiator table: 2 rows', rows.length, 2);
check('row 1 keeps the room name', rows[0].querySelector('.rd-name').value, 'Salon');
check('row 1 load = room load x (1 + safety)', +rows[0].querySelector('.rd-q').value, Math.round(hl.rooms[0].q * (1 + hl.safety)));
check('row 1 takes the room indoor temperature (24 C)', +rows[0].querySelector('.rd-ti').value, 24);
check('row 2 takes its own indoor temperature (20 C)', +rows[1].querySelector('.rd-ti').value, 20);
check('the radiator results use those loads', w.calcRadiators().rows[0].q, Math.round(hl.rooms[0].q * (1 + hl.safety)));
// imported once: opening the calculator again shows the defaults only if the user has not asked again
w.renderCalc('radiators');
check('reopening without a new send does not overwrite with the old rooms', doc.querySelectorAll('#rd-tbody tr').length, 3);
doc.querySelector('button[onclick="rdImportRooms()"]').click();
check('the import button brings the rooms back', doc.querySelectorAll('#rd-tbody tr').length, 2);
// underfloor: choose a room (back on the heating-load screen, where the send button lives)
w.renderCalc('heatingload');
setv('hl_to', 0); setv('hl_safety', 15);
const again = doc.querySelectorAll('#hl-rooms .hl-room');
again[0].querySelector('.hl-area').value = '30'; again[0].querySelector('.hl-ti').value = '24';
w.addHlRoom();
const again2 = doc.querySelectorAll('#hl-rooms .hl-room')[1];
again2.querySelector('.hl-area').value = '14'; again2.querySelector('.hl-ti').value = '20';
w.hlSendRooms('floorheating');
const sel = doc.getElementById('fh_room');
check('underfloor calculator lists the calculated rooms', sel && sel.options.length, 3);
sel.value = '1'; sel.dispatchEvent(new w.Event('change'));
check('choosing a room fills the area', +doc.getElementById('fh_area').value, 14);
check('choosing a room fills the load', +doc.getElementById('fh_q').value, Math.round(hl.rooms[1].q * (1 + hl.safety)));

check('no page errors', errors.length, 0);
if (errors.length) console.log(errors.slice(0, 3));
console.log(fail ? `${fail} heating-network check(s) FAILED` : 'all heating-network checks passed');
process.exit(fail ? 1 : 0);
