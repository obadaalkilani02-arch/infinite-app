// Golden-value + edge-input tests.
//   node tests/golden.js --update   -> rewrite tests/golden.json from current app
//   node tests/golden.js            -> compare against golden.json
//   node tests/golden.js --edge     -> edge-input sweep (0 / negative / empty / huge)
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..', 'src', 'SmartEngineering_App.html');
const GOLD = path.join(__dirname, 'golden.json');
const html = fs.readFileSync(APP, 'utf8');

const TYPES = ['sump','sewage','liftpit','booster','lifting','recirc','heater','raindrain','waterconsumption','pool','fixtureunits','friction','irrigation','grease','vent','waterhammer','expansiontank','dhwrecirc','chlorination','prv',
 'coolingload','hvacairflow','ductsizing','ventilation','chwflow','coolingtower','fcuselection','splitselection','desertcooler','ductweight','parkingvent','uvalue','kitchenhood','diffuserselection','sprinkler','fm200calc','co2calc','stairpress','elevatorpress','lightingcalc','lpgcalc','cablesizing','heatingload','heatingpipes','radiators','floorheating','heatexpansion','chimney','fueltank','airheating','motorcircuit','loadcalc','protcond','faultloop','transformer','pfcorrection','conduitfill'];

function boot() {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push((e.detail && e.detail.message) || e.message));
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/', beforeParse(win) { try { win.localStorage.setItem('si_lang', 'ar'); } catch (e) {} } });
  const w = dom.window;
  w.alert = () => {}; w.confirm = () => true; w.scrollTo = () => {};
  return { w, errors };
}

const norm = s => s.replace(/\s+/g, ' ').trim();
const BAD = /NaN|undefined|Infinity|\[object/;

function snapshot(w, t) {
  w.renderCalc(t);
  const body = w.document.getElementById('calc-body');
  return norm(body.textContent);
}

const mode = process.argv[2] || '';

if (mode === '--update') {
  const { w } = boot();
  const out = {};
  for (const t of TYPES) out[t] = snapshot(w, t);
  fs.writeFileSync(GOLD, JSON.stringify(out, null, 1), 'utf8');
  console.log('golden.json written for', TYPES.length, 'calculators');
} else if (mode === '--edge') {
  // For each calculator, force every numeric input to a hostile value and look for NaN/undefined/Infinity/throws.
  const hostile = { zero: '0', negative: '-5', empty: '', huge: '1e9' };
  let flagged = 0;
  for (const t of TYPES) {
    for (const [label, val] of Object.entries(hostile)) {
      const { w, errors } = boot();
      let status = 'OK', note = '';
      try {
        w.renderCalc(t);
        const body = w.document.getElementById('calc-body');
        const inputs = [...body.querySelectorAll('input[type=number]')];
        inputs.forEach(i => { i.value = val; });
        body.dispatchEvent(new w.Event('input', { bubbles: true }));
        const txt = norm(body.textContent);
        const m = txt.match(BAD);
        if (m) { status = 'BAD'; note = m[0]; }
      } catch (e) { status = 'THROW'; note = e.message; }
      if (errors.length) { status = 'ERR'; note += ' ' + errors[0]; }
      if (status !== 'OK') { flagged++; console.log(t.padEnd(18), label.padEnd(9), status.padEnd(6), note); }
    }
  }
  console.log(`\nedge sweep done: ${flagged} flagged of ${TYPES.length * 4} runs`);
} else {
  const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8'));
  const { w } = boot();
  let diff = 0;
  for (const t of TYPES) {
    const now = snapshot(w, t);
    if (now !== gold[t]) { diff++; console.log('CHANGED', t); }
  }
  console.log(diff ? `${diff} calculator(s) changed vs golden` : `all ${TYPES.length} match golden`);
  process.exitCode = diff ? 1 : 0;
}
