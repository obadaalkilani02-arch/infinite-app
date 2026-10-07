// The packaged web bundle (used by the PWA, Android and Windows builds) must boot exactly like the source page:
// the splash has to hide and the app has to appear. (A previous build injected the PWA script inside a JavaScript
// string, which left the splash frozen on phones.)
//   node tests/pwa.js
const { JSDOM, VirtualConsole } = require('jsdom');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

execFileSync(process.execPath, [path.join(__dirname, '..', 'tools', 'build-web.js')], { stdio: 'ignore' });
const dir = path.join(__dirname, '..', 'dist', 'web');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'SmartEngineering_App.html'), 'utf8');

let fail = 0;
function check(name, got, want) {
  const ok = got === want;
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
}

const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push((e.detail && e.detail.message) || e.message));
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/',
  beforeParse(w) { w.alert = () => {}; w.scrollTo = () => {}; try { w.localStorage.setItem('si_lang', 'ar'); } catch (e) {} } });
const w = dom.window;

check('manifest link in <head>', !!w.document.head.querySelector('link[rel=manifest]'), true);
check('service-worker registration script is the last script of <body>', /serviceWorker/.test([...w.document.body.querySelectorAll('script')].pop().textContent), true);
check('bundle is the source page plus the PWA additions only', html.length - src.length < 2000 && html.length > src.length, true);
check('page script defined its functions (no early script break)', typeof w.showCalc, 'function');

setTimeout(() => {
  check('splash hidden after 3 s', w.document.getElementById('splash').style.display, 'none');
  check('app shown after the splash', w.document.getElementById('app').style.display, 'flex');
  check('no script errors', errors.length, 0);
  if (errors.length) console.log(errors.slice(0, 3));
  const sw = fs.readFileSync(path.join(dir, 'sw.js'), 'utf8');
  check('service-worker cache name carries a content hash', /infinite-[\d.]+(?:-[a-z]+\.\d+)?-[0-9a-f]{8}/.test(sw) || /const CACHE = 'infinite-.+-[0-9a-f]{8}'/.test(sw), true);
  console.log(fail ? `${fail} pwa check(s) FAILED` : 'all pwa checks passed');
  process.exit(fail ? 1 : 0);
}, 3300);
