// Electrical, part 6: phase balance (NEC 210.11(B), Atkinson Tables 8.2 and 12.2).
//   node tests/electrical6.js
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
const text = id => doc.getElementById(id).textContent;
// replace the demo rows with [name, amps, phase] rows
function setRows(rows) {
  doc.getElementById('pb-rows').innerHTML = rows.map(r => w.pbRowHTML(r[0], r[1], r[2])).join('');
}

w.renderCalc('phasebal');
let r = w.calcPhaseBal();
check('default: seven circuits; the six automatic ones (25 20 15 15 10 5 A) split into 30 A per phase, plus the 15 A three-phase pump: 45 A each, no unbalance', [r.rows.length, r.tot, r.unb], [7, [45, 45, 45], 0], 1e-9);

// Atkinson Table 12.2: brown 155.2, black 153.2, grey 138.8 A
const t122 = [['heaters L1', 65.2, '1'], ['sockets', 30, '1'], ['showers', 60, '1'],
  ['heaters L2', 65.2, '2'], ['lights 1', 6, '2'], ['showers 2', 60, '2'], ['sinks', 12, '2'], ['cooker', 10, '2'],
  ['heaters L3', 65.2, '3'], ['lights 2 3', 12, '3'], ['quartz', 26, '3'], ['tubular', 15.6, '3'], ['chiller', 20, '3']];
setRows(t122); r = w.calcPhaseBal();
check('Table 12.2 totals: 155.2 / 153.2 / 138.8 A', r.tot, [155.2, 153.2, 138.8], 1e-9);
check('... average 149.07 A, unbalance = largest deviation (149.07 - 138.8) / 149.07 = 6.89 %', [+r.avg.toFixed(4), +r.unb.toFixed(4)], [149.0667, 6.8873]);
check('... neutral current from the phasor sum: 15.50 A', r.IN, 15.497, 1e-3);
check('... the largest phase current is 155.2 A and the L1 power I x U0 = 155.2 x 230.9 V = 35.8 kVA', [r.Imax, r.kVA[0]], [155.2, 155.2 * 400 / Math.sqrt(3) / 1000], 1e-6);

// the same circuits all left to the automatic distribution do no worse than the book
setRows(t122.map(x => [x[0], x[1], 'auto'])); r = w.calcPhaseBal();
check('automatic distribution of the Table 12.2 circuits: total 447.2 A kept, unbalance not above the book (6.89 %)', [+(r.tot[0] + r.tot[1] + r.tot[2]).toFixed(6), r.unb <= 6.8874], [447.2, true], 1e-9);
check('... every circuit gets a phase', r.asg.every(a => a === 0 || a === 1 || a === 2), true);

// equal loads and three-phase loads
setRows([1, 2, 3, 4, 5, 6].map(k => ['c' + k, 10, 'auto'])); r = w.calcPhaseBal();
check('six equal 10 A circuits: 20 A per phase, no unbalance, no neutral current', [r.tot, r.unb, r.IN], [[20, 20, 20], 0, 0], 1e-9);
setRows([['motor', 30, '3p']]); r = w.calcPhaseBal();
check('a balanced three-phase load adds to all three phases: 30 / 30 / 30 A, neutral 0', [r.tot, r.IN, r.unb], [[30, 30, 30], 0, 0], 1e-9);
setRows([['one phase', 30, '1']]); r = w.calcPhaseBal();
check('a single 30 A load on L1: neutral 30 A, unbalance 200 %', [r.IN, r.unb], [30, 200], 1e-9);
setRows([['fixed', 40, '1'], ['a', 20, 'auto'], ['b', 20, 'auto']]); r = w.calcPhaseBal();
check('fixed 40 A on L1, two 20 A circuits: they go to L2 and L3 (40 / 20 / 20 -> kept off L1 by the variance)', [r.tot[0], r.asg[1] !== 0, r.asg[2] !== 0, r.asg[1] !== r.asg[2]], [40, true, true, true]);
setRows([]); r = w.calcPhaseBal();
check('no circuits: zeros without errors', [r.tot, r.unb, r.IN], [[0, 0, 0], 0, 0]);

// apply and send
setRows([['x', 30, 'auto'], ['y', 20, 'auto'], ['z', 10, 'auto']]); w.calcResult('phasebal');
check('results are rendered with the three phases and the target', ['L1', 'L2', 'L3', 'تيار الحيادي'].every(t => text('pb_results').includes(t)), true);
w.pbApply();
const sel = [...doc.querySelectorAll('#pb-rows .pb-ph')].map(e => e.value);
check('applying the proposal fixes every automatic row on L1, L2 or L3, all different here', [sel.every(x => ['1', '2', '3'].includes(x)), new Set(sel).size], [true, 3]);
w.pbSend();
check('the largest phase current goes to the cable-sizing calculator (IEC, 400 V, 30 A)', [doc.getElementById('cs_std').value, +doc.getElementById('cs_load').value, +doc.getElementById('cs_volt').value], ['iec', 30, 400]);

// screens
w.showCategory('electrical');
check('electrical screen lists the calculator; 22 cards and the home page says 22', [doc.getElementById('electrical-category').textContent.includes('توزيع الأحمال على الأطوار'),
  doc.querySelectorAll('#electrical-category .calc-card').length, doc.body.textContent.includes('22 حاسبة متاحة')], [true, 22, true]);

check('no script errors', errors, []);
console.log(fail ? '\n' + fail + ' FAILED' : '\nAll phase-balance checks passed');
process.exit(fail ? 1 : 0);
