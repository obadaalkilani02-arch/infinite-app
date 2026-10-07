// Behavioural checks for the plumbing tables taken from IPC 2021 / ASPE / PDI.
//   node tests/plumbing.js
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'SmartEngineering_App.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push((e.detail && e.detail.message) || e.message));
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/', beforeParse(win) { try { win.localStorage.setItem('si_lang', 'ar'); } catch (e) {} } });
const w = dom.window;
w.alert = () => {}; w.confirm = () => true; w.scrollTo = () => {};
const doc = w.document;

let fail = 0;
function check(name, got, want, tol) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= (tol ?? 0.01) : JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
}
const setVal = (id, v) => { doc.getElementById(id).value = String(v); };
const ev = s => w.eval(s);

// ---------- IPC Tables 710.1(1) / 710.1(2) ----------
check('710.1(1) 4 in drain = 216 dfu', ev('DRAIN_PIPE_TABLE.find(r=>r.size===4).dfu'), 216);
check('710.1(1) 6 in drain = 840 dfu', ev('DRAIN_PIPE_TABLE.find(r=>r.size===6).dfu'), 840);
check('710.1(2) 4 in stack: 90 / 240 / 500', ev('(r=>[r.perInterval,r.upTo3,r.over3])(STACK_TABLE_IPC.find(r=>r.size===4))'), [90, 240, 500]);
check('710.1(2) 3 in stack: 20 / 48 / 72', ev('(r=>[r.perInterval,r.upTo3,r.over3])(STACK_TABLE_IPC.find(r=>r.size===3))'), [20, 48, 72]);

// ---------- Hunter curve (IPC E103.3(3)) ----------
check('Hunter flush-tank column is monotonic', ev('HUNTER_TANK.every((p,i,a)=>i===0||(p[0]>a[i-1][0]&&p[1]>=a[i-1][1]))'), true);
check('Hunter flushometer column is monotonic', ev('HUNTER_VALVE.every((p,i,a)=>i===0||(p[0]>a[i-1][0]&&p[1]>=a[i-1][1]))'), true);
check('flushometer demand > flush-tank demand at 20 FU', w.fuToGPM(20, 2) > w.fuToGPM(20, 1), true);
check('0 FU -> 0 gpm', w.fuToGPM(0, 1), 0);

// ---------- Booster residual pressure (IPC E103.1: 8 psi tank / 15 psi flushometer) ----------
check('residual tank = 5.6 m (8 psi)', 8 * 0.70307, 5.6, 0.05);
check('residual valve = 10.6 m (15 psi)', 15 * 0.70307, 10.6, 0.1);

// ---------- Vent (IPC Table 906.1) ----------
function vent(dfu, dia, lenM) {
  w.renderCalc('vent');
  setVal('vt_type', 'stack'); setVal('vt_dfu', dfu); setVal('vt_stackdia', dia); setVal('vt_length', lenM);
  return w.calcVent();
}
let r = vent(20, 3, 10);
check('vent 20 dfu on 3 in stack: not exceeded', r.exceeds, null);
r = vent(5000, 3, 10);
check('vent 5000 dfu on 3 in stack: exceeds dfu', r.exceeds, 'dfu');

// ---------- Water hammer arrester (PDI-WH201 as cited by ASPE) ----------
function wh(fu, psi, lenM) {
  w.renderCalc('waterhammer');
  setVal('wh_fu', fu); setVal('wh_qty', 1); setVal('wh_psi', psi); setVal('wh_len', lenM);
  return w.calcWaterHammer();
}
let a = wh(10, 50, 3);
check('WH 10 FU, 50 psi, short branch -> single arrester', a.perBranch, 1);
let b = wh(10, 50, 10);
check('WH branch > 20 ft -> two arresters', b.perBranch, 2);
let c = wh(10, 80, 3);
check('WH flow pressure > 65 psi steps the size up', c.steppedUp, true);
check('WH size does not decrease with pressure', c.selected.fuMax >= a.selected.fuMax, true);

// ---------- Expansion tank (ASPE Eq. 5-6) ----------
w.renderCalc('expansiontank');
setVal('et_vol', 2000); setVal('et_tcold', 10); setVal('et_thot', 60); setVal('et_p1', 2); setVal('et_p2', 6);
const et = w.calcExpansionTank();
const P1 = 2 + 1.01325, P2 = 6 + 1.01325;
check('expansion tank Vt = Vs*Ec*P2/(P2-P1)', et.tankLiters, 2000 * et.Ec * P2 / (P2 - P1), 0.01);


// ---------- Water heater (ASPE Vol.2 Table 6-1) ----------
check('Table 6-1 hospital demand/storage factors', ev('[HEATER_TYPES["Hospital"].df,HEATER_TYPES["Hospital"].sf]'), [0.25, 0.6]);
check('Table 6-1 office storage factor 2.0', ev('HEATER_TYPES["Office Building"].sf'), 2);
check('Table 6-1 hotel showers 75 gph', ev('HEATER_TYPES["Hotel"].gph[17]'), 75);
check('Table 6-1 YMCA showers 225 gph', ev('HEATER_TYPES["Y.M.C.A"].gph[17]'), 225);
w.renderCalc('heater');
setVal('h_type', 'Hotel'); w.fillHeaterType(); setVal('hx_qty_17', 10);
setVal('h_orient', '0.75'); const h75 = w.calcHeater();
setVal('h_orient', '0.65'); const h65 = w.calcHeater();
check('usable storage 75% vs 65% of selected capacity', [h75.usableStorageL / h75.selectedCapacity, h65.usableStorageL / h65.selectedCapacity], [0.75, 0.65]);
check('no page errors', errors.length, 0);
if (errors.length) console.log(errors.slice(0, 5));
console.log(fail ? `${fail} plumbing check(s) FAILED` : 'all plumbing checks passed');
process.exit(fail ? 1 : 0);


