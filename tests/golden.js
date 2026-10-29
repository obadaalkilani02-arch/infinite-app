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
 'coolingload','hvacairflow','ductsizing','ventilation','chwflow','coolingtower','fcuselection','splitselection','desertcooler','ductweight','parkingvent','uvalue','kitchenhood','diffuserselection','sprinkler','fm200calc','co2calc','stairpress','elevatorpress','lightingcalc','lpgcalc','cablesizing','heatingload','heatingpipes','radiators','floorheating','heatexpansion','chimney','fueltank','airheating','motorcircuit','loadcalc','protcond','faultloop','transformer','pfcorrection','conduitfill','hvacmotor','firepump','alarmbattery','lightning','elevatorfeeder','liftplan','egress','exitparts','fireprot','extinguisher','fadetect','concretefire','wastechute','sitesafety','accessreq','watersupplyjo','ductnoise','fitouttrack','aptboq','spacereq','spacehome','spacestair','roomacoustics','natlight','accessplan','masonrywall','deadload','liveload','windload','seismic','rcbeam','rcslab','rccolumn','rcfooting','bearingcap','retainwall','steelmember','steeltension','steelbolt','steelweld','formworkpressure','formworkcheck','formworkprop','scaffoldcheck','scaffoldtower','scaffoldsafety','prestressloss','prestressstress','prestressultimate','prestressend','rcflatslab','rccoef','rcwall','scaffoldtimber','rctorsion','rccrack','rcdeflect','swbdesign','swbinsul','prmpci','prmenvelope','prmsystem','prmchiller','prmfan','prmextlight','pvprotect','pfcharm','lvtransformer','substationvent','harmindex','gaspipe','combair','ventsize','epss','medgas','hcelectest','ventmulti','gaspiptest','maq55','lh2sep','ventterm','ieccenv','ieccpipe','iecclpd','ifcflow','ifcegress','ec8spec','ec2beam','acibeam','sbcarea','sbcfirecon','sbcroom','sbcload','sbclive','sbcwind','sbcseis','acicolumn','acifooting','acislab1','acislab2','acidev','acidefl','sbcfound','sbcretain','masonasd','masonwall','masonshear','sdshop','genroom','sbcfixtures','sbcdead','sbcrain','ugmain','nfpa101','thermalcomfort','cleanroom','rclimit','htmgas','ec3member','uaeegress','uaesprink','uaemisc','uaecomp','uaeaccess','uaedetect','smokemgmt','uaesmoke','nfpa20','nfpa14','nfpa22','nfpa10','nfpa13h','nfpa13s','uaefp','uaestore','uaespray','uaegas','uaeinst','uaespec','uaerisk','uaecons','nfpa15','nfpa11','nfpa16','nfpa17','ec8lat','ec2serv','nfpa50','boilernz','iso7396','asmea17','necbox','necev','necpool','necwork','necwiring','necpv','necocpd','neccap','necheat','nfpa72','eigq','eigh','ashrae170','nfpa58','syrac','syrload','syrins','upcdrain','upcwater','egac','egcold','egmat','egpipe','egeff','egequip','dbcarch','dbcelec','dbchvac','dbcplumb','dbcenv','dbcvt','dbcacc','syrvent','syrmat','dbcseis','dbcstr','dbcgeo','dbcvilla','dbcsec','dbcglass','dbctele','egelev','egegress','egnet','psychro','pumphead','egexpo','egsep','egfinish','egspr','egsan','septic','sanfix','natvent','condensation','shelter','shortcircuit','earthelectrode','maxdemand','liftmotor','genset','spd','neutral','phasebal'];

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
  // Parent: one child process per calculator (a hostile value such as 1e9 can exhaust the heap or hang one calculator; the child is killed and reported, the sweep goes on).
  const cp = require('child_process');
  let flagged = 0, crashed = 0;
  for (const t of TYPES) {
    const r = cp.spawnSync(process.execPath, ['--max-old-space-size=1500', __filename, '--edge-one', t], { encoding: 'utf8', timeout: 120000, maxBuffer: 1 << 26 });
    const out = (r.stdout || '').split('\n').filter(l => /^\S.*\s(zero|negative|empty|huge)\s/.test(l));
    out.forEach(l => console.log(l));
    flagged += out.length;
    if (r.error || r.status !== 0) { crashed++; flagged++; console.log(t.padEnd(18), 'CRASH'.padEnd(9), r.error ? r.error.code || r.error.message : 'exit ' + r.status + (r.signal ? ' ' + r.signal : '')); }
  }
  console.log(`\nedge sweep done: ${flagged} flagged (${crashed} crashed) of ${TYPES.length * 4} runs`);
} else if (mode === '--edge-one') {
  // For one calculator, force every numeric input to a hostile value and look for NaN/undefined/Infinity/throws.
  const hostile = { zero: '0', negative: '-5', empty: '', huge: '1e9' };
  const t = process.argv[3];
  const { w, errors } = boot();
  for (const [label, val] of Object.entries(hostile)) {
    errors.length = 0;
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
    if (status !== 'OK') console.log(t.padEnd(18), label.padEnd(9), status.padEnd(6), note);
  }
  process.exit(0);
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
