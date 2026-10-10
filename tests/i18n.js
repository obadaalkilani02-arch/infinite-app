// Language (Arabic ⇄ English), theme persistence and splash structure checks.
//   node tests/i18n.js
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'SmartEngineering_App.html'), 'utf8');
const TYPES = ['sump','sewage','liftpit','booster','lifting','recirc','heater','raindrain','waterconsumption','pool','fixtureunits','friction','irrigation','grease','vent','waterhammer','expansiontank','dhwrecirc','chlorination','prv',
 'coolingload','hvacairflow','ductsizing','ventilation','chwflow','coolingtower','fcuselection','splitselection','desertcooler','ductweight','parkingvent','uvalue','kitchenhood','diffuserselection','sprinkler','fm200calc','co2calc','stairpress','elevatorpress','lightingcalc','lpgcalc','cablesizing','heatingload','heatingpipes','radiators','floorheating','heatexpansion','chimney','fueltank','airheating','motorcircuit','loadcalc','protcond','faultloop','transformer','pfcorrection','conduitfill','hvacmotor','firepump','alarmbattery','lightning','elevatorfeeder','liftplan','egress','exitparts','fireprot','extinguisher','fadetect','concretefire','wastechute','sitesafety','accessreq','watersupplyjo','septic','sanfix','natvent','condensation','shelter','shortcircuit','earthelectrode','maxdemand','liftmotor','genset','spd','neutral','phasebal'];
const AR = /[؀-ۿ]/;
const tick = () => new Promise(r => setTimeout(r, 0));

let fail = 0;
function check(name, got, want) {
  const ok = got === want;
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
}

function boot(seed) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', e => errors.push((e.detail && e.detail.message) || e.message));
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/',
    beforeParse(win) {
      win.alert = () => {}; win.confirm = () => true; win.scrollTo = () => {};
      win.matchMedia = win.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {} }));
      for (const [k, v] of Object.entries(seed || {})) win.localStorage.setItem(k, v);
    } });
  return { w: dom.window, errors };
}
const numbers = s => (s.match(/-?\d+(?:\.\d+)?/g) || []).join(' ');
const arabicLeft = w => {
  const found = new Set();
  const walker = w.document.createTreeWalker(w.document.body, 5); // SHOW_ELEMENT | SHOW_TEXT
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeType === 3) {
      const el = n.parentElement;
      if (!el || el.closest('script,style,textarea,[data-no-i18n]')) continue;
      (n.nodeValue.match(/[؀-ۿ]+(?: +[؀-ۿ]+)*/g) || []).forEach(m => found.add(m));
    } else {
      if (n.closest('[data-no-i18n]')) continue;
      for (const a of ['title', 'placeholder', 'aria-label', 'alt', 'label']) {
        const v = n.getAttribute(a);
        if (v && AR.test(v)) found.add(`@${a}: ${v}`);
      }
    }
  }
  return [...found];
};

(async () => {
  // ---------- defaults & persistence ----------
  let { w } = boot({});
  check('device language (jsdom = en-US) defaults to English', w.document.documentElement.lang, 'en');
  check('English sets dir=ltr', w.document.documentElement.dir, 'ltr');
  check('language button shows the other language (ع)', w.document.getElementById('langBtn').textContent, 'ع');

  ({ w } = boot({ si_lang: 'ar' }));
  check('saved Arabic wins over device language', w.document.documentElement.lang, 'ar');
  check('Arabic sets dir=rtl', w.document.documentElement.dir, 'rtl');
  const homeAr = w.document.getElementById('main-home').textContent.replace(/\s+/g, ' ').trim();
  w.toggleLang(); await tick();
  check('toggle switches to English', w.document.documentElement.lang, 'en');
  check('toggle persists the choice', w.localStorage.getItem('si_lang'), 'en');
  check('Arabic home title is translated', /Integrated engineering calculators/.test(w.document.getElementById('main-home').textContent), true);
  w.toggleLang(); await tick();
  check('toggle back restores Arabic exactly (home text identical)', w.document.getElementById('main-home').textContent.replace(/\s+/g, ' ').trim(), homeAr);

  // theme
  check('theme defaults to light', w.document.documentElement.getAttribute('data-theme'), '');
  w.toggleTheme();
  check('toggleTheme applies dark', w.document.documentElement.getAttribute('data-theme'), 'dark');
  check('theme choice persisted', w.localStorage.getItem('si_theme'), 'dark');
  ({ w } = boot({ si_lang: 'ar', si_theme: 'dark' }));
  check('saved dark theme restored on load', w.document.documentElement.getAttribute('data-theme'), 'dark');

  // splash structure: infinity paths drawn then lit; brand text present
  ({ w } = boot({ si_lang: 'ar' }));
  const sp = w.document.getElementById('splash');
  check('splash has the three ∞ layers (glow, edge, core)', ['inf-glow', 'inf-edge', 'inf-core'].every(c => sp.querySelector('.' + c)), true);
  check('splash brand text', sp.querySelector('.brand').textContent, '+INFINITE');

  // ---------- full coverage + numeric invariance ----------
  // Two fresh instances (the app's row counters keep growing across re-renders, so an AR/EN pair on one instance would differ).
  const arInst = boot({ si_lang: 'ar' }).w;
  const arNums = {};
  for (const t of TYPES) { arInst.renderCalc(t); await tick(); arNums[t] = numbers(arInst.document.getElementById('calc-body').textContent); }

  ({ w } = boot({ si_lang: 'en' }));
  await tick();

  let leftovers = new Set();
  const numDiff = [];
  for (const cat of ['plumbing', 'hvac', 'fire', 'heating', 'electrical', 'quotations', 'correspondence']) {
    w.showCategory(cat); await tick();
    arabicLeft(w).forEach(x => leftovers.add(x));
  }
  w.showMainHome(); await tick();
  for (const t of TYPES) {
    w.renderCalc(t); await tick();
    const body = w.document.getElementById('calc-body');
    if (numbers(body.textContent) !== arNums[t]) numDiff.push(t);
    arabicLeft(w).forEach(x => leftovers.add(x));
  }
  check('English mode: no Arabic text left on any screen/calculator', [...leftovers].length, 0);
  if (leftovers.size) console.log('   untranslated:', [...leftovers].slice(0, 25));
  check('English mode: every calculator shows identical numbers to Arabic mode', numDiff.length, 0);
  if (numDiff.length) console.log('   number differences in:', numDiff.join(', '));

  // national-code options (Saudi / Egyptian / Syrian) are translated too
  const codeLeft = new Set();
  for (const code of ['sa', 'eg', 'sy']) {
    const x = boot({ si_lang: 'en', si_code: code }).w; await tick();
    x.renderCalc('coolingload'); await tick();
    const m = x.document.getElementById('cl_mode'); m.value = 'detailed'; m.dispatchEvent(new x.Event('change')); await tick();
    arabicLeft(x).forEach(s => codeLeft.add(code + ': ' + s));
    x.renderCalc('uvalue'); await tick();
    arabicLeft(x).forEach(s => codeLeft.add(code + ': ' + s));
    x.renderCalc('ventilation'); await tick();
    arabicLeft(x).forEach(s => codeLeft.add(code + ': ' + s));
    // <option> text is a text node, but also check the rendered option labels directly
    for (const o of x.document.querySelectorAll('#calc-body option')) if (AR.test(o.textContent)) codeLeft.add(code + ' option: ' + o.textContent);
  }
  check('English mode: national-code options fully translated', codeLeft.size, 0);
  if (codeLeft.size) console.log('   untranslated:', [...codeLeft].slice(0, 20));
  check('header code selector translated', [...w.document.querySelectorAll('#codeSel option')].map(o => o.textContent).join(','), 'Intl,Saudi,Egypt,Syria,UAE,Jordan');

  // dynamic content: recalculation after an input change is translated too
  w.renderCalc('stairpress'); await tick();
  w.document.getElementById('st_pres').value = 10;
  w.calcResult('stairpress'); await tick();
  check('dynamic warning is translated (stairpress, 10 Pa)', /below the minimum/.test(w.document.getElementById('st_results').textContent), true);
  check('no Arabic left after dynamic update', arabicLeft(w).length, 0);

  // user-written letter must stay untouched
  w.document.getElementById('co_to_company').value = 'شركة الاختبار';
  w.showCategory('correspondence'); await tick();
  w.document.getElementById('co_body_ar').value = 'نص عربي';
  w.generateLetter(); await tick();
  const letter = w.document.getElementById('co_letter_doc');
  check('letter document keeps its Arabic content in English UI', AR.test(letter.textContent), true);

  // native dialogs are translated in English mode
  let msg = '';
  w.alert = m => { msg = m; };
  // the I18N wrapper was installed over the original alert; reinstall by re-calling through the engine
  check('I18N.tr translates a known phrase', w.eval("I18N.tr('أدخل بيانات صحيحة')"), 'Enter valid data');
  check('duplicated Arabic+English term collapses', w.eval("I18N.tr('معامل الطلب Demand Factor')"), 'Demand factor');
  check('parenthesised repeat collapses', w.eval("I18N.tr('سكيمر (Skimmer)')"), 'skimmer');
  check('dynamic run split at the Arabic comma', w.eval("I18N.tr('مضخة عاملة، كل مضخة بتصرف')"), 'duty pump(s), each pump at a flow of');

  console.log(fail ? `\n${fail} FAILED` : '\nall language checks passed');
  process.exit(fail ? 1 : 0);
})();
