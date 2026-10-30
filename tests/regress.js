const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const file = process.argv[2] || 'src/SmartEngineering_App.html';
const html = fs.readFileSync(file, 'utf8');

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push('jsdomError: ' + (e.detail && e.detail.stack || e.message).split('\n').slice(0,3).join(' | ')));
vc.on('error', (...a) => errors.push('console.error: ' + a.join(' ')));

const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/', beforeParse(win) { try { win.localStorage.setItem('si_lang', 'ar'); } catch (e) {} } });
const w = dom.window;
w.alert = () => {}; w.confirm = () => true; w.scrollTo = () => {};

const types = ['sump','sewage','liftpit','booster','lifting','recirc','heater','raindrain','waterconsumption','pool','fixtureunits','friction','irrigation','grease','vent','waterhammer','expansiontank','dhwrecirc','chlorination','prv',
 'coolingload','hvacairflow','ductsizing','ventilation','chwflow','coolingtower','fcuselection','splitselection','desertcooler','ductweight','parkingvent','uvalue','kitchenhood','diffuserselection','sprinkler','fm200calc','co2calc','stairpress','elevatorpress','lightingcalc','lpgcalc','cablesizing','heatingload','heatingpipes','radiators','floorheating','heatexpansion','chimney','fueltank','airheating','motorcircuit','loadcalc','protcond','faultloop','transformer','pfcorrection','conduitfill','hvacmotor','firepump','alarmbattery','lightning','elevatorfeeder','liftplan','egress','exitparts','fireprot','extinguisher','fadetect','concretefire','wastechute','sitesafety','accessreq','watersupplyjo','ductnoise','fitouttrack','aptboq','spacereq','spacehome','spacestair','roomacoustics','natlight','accessplan','masonrywall','deadload','liveload','windload','seismic','rcbeam','rcslab','rccolumn','rcfooting','bearingcap','retainwall','steelmember','steeltension','steelbolt','steelweld','formworkpressure','formworkcheck','formworkprop','scaffoldcheck','scaffoldtower','scaffoldsafety','prestressloss','prestressstress','prestressultimate','prestressend','rcflatslab','rccoef','rcwall','scaffoldtimber','rctorsion','rccrack','rcdeflect','swbdesign','swbinsul','prmpci','prmenvelope','prmsystem','prmchiller','prmfan','prmextlight','pvprotect','pfcharm','lvtransformer','substationvent','harmindex','gaspipe','combair','ventsize','epss','medgas','hcelectest','ventmulti','gaspiptest','maq55','lh2sep','ventterm','ieccenv','ieccpipe','iecclpd','ifcflow','ifcegress','ec8spec','ec2beam','acibeam','sbcarea','sbcfirecon','sbcroom','sbcload','sbclive','sbcwind','sbcseis','acicolumn','acifooting','acislab1','acislab2','acidev','acidefl','sbcfound','sbcretain','masonasd','masonwall','masonshear','sdshop','genroom','sbcfixtures','sbcdead','sbcrain','ugmain','nfpa101','thermalcomfort','cleanroom','rclimit','htmgas','ec3member','uaeegress','uaesprink','uaemisc','uaecomp','uaeaccess','uaedetect','smokemgmt','uaesmoke','nfpa20','nfpa14','nfpa22','nfpa10','nfpa13h','nfpa13s','uaefp','uaestore','uaespray','uaegas','uaeinst','uaespec','uaerisk','uaecons','nfpa15','nfpa11','nfpa16','nfpa17','ec8lat','ec2serv','nfpa50','boilernz','iso7396','asmea17','necbox','necev','necpool','necwork','necwiring','necpv','necocpd','neccap','necheat','nfpa72','eigq','eigh','ashrae170','nfpa58','syrac','syrload','syrins','upcdrain','upcwater','egac','egcold','egmat','egpipe','egeff','egequip','dbcarch','dbcelec','dbchvac','dbcplumb','dbcenv','dbcvt','dbcacc','syrvent','syrmat','dbcseis','dbcstr','dbcgeo','dbcvilla','dbcsec','dbcglass','dbctele','egelev','egegress','egnet','psychro','pumphead','egexpo','egsep','egfinish','egspr','egfw','egspray','egsprinst','egexitcomp','egsan','septic','sanfix','natvent','condensation','shelter','shortcircuit','earthelectrode','maxdemand','liftmotor','genset','spd','neutral','phasebal'];

let fail = 0;
for (const t of types) {
  const before = errors.length;
  let status = 'OK', note = '';
  try {
    w.renderCalc(t);
    const body = w.document.getElementById('calc-body');
    const txt = body.textContent;
    const bad = txt.match(/NaN|undefined|Infinity|\[object/g);
    const inputs = body.querySelectorAll('input,select').length;
    const resLen = (body.querySelector('[id$="_result"],[id$="_results"]') || {textContent:''}).textContent.trim().length;
    if (bad) { status = 'BAD'; note = 'tokens: ' + [...new Set(bad)].join(','); }
    if (!resLen) { status = status === 'OK' ? 'WARN' : status; note += ' empty-result'; }
    note += ` inputs=${inputs}`;
  } catch (e) { status = 'THROW'; note = e.message; }
  if (errors.length > before) { status = 'ERR'; note += ' ' + errors.slice(before).join(' ; '); }
  if (status !== 'OK') fail++;
  console.log(t.padEnd(18), status.padEnd(6), note);
}
console.log(`\n${types.length} calculators, ${fail} flagged. Page-level errors: ${errors.length}`);

