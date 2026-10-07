// Extract every distinct Arabic phrase (run of Arabic words) from the app source, in order of first appearance.
//   node tools/i18n-extract.js            -> writes i18n/phrases.json + i18n/todo.txt (phrases not yet in i18n/en.json)
// The phrase definition MUST stay identical to AR_RUN in the app's I18N engine.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'src', 'SmartEngineering_App.html');
const DICT = path.join(ROOT, 'i18n', 'en.json');
const AR_RUN = /[؀-ۿ]+(?:[  ]+[؀-ۿ]+)*/g;

let html = fs.readFileSync(APP, 'utf8');
// the dictionary itself is not source text
html = html.replace(/<!--I18N-BEGIN-->[\s\S]*?<!--I18N-END-->/, '');
// the generated letter is a user document (never translated at runtime)
html = html.replace(/const letterHTML = `[\s\S]*?<\/div>`;/, '');
// the I18N engine's own regex literals contain Arabic-range characters
html = html.replace(/const I18N = \(function \(\) \{[\s\S]*?\}\)\(\);/, '');
// pure comment lines are not displayed
html = html.replace(/^\s*\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

const seen = new Map();
let m;
while ((m = AR_RUN.exec(html))) {
  if (!seen.has(m[0])) seen.set(m[0], m.index);
}
const list = [...seen.keys()];
const dict = fs.existsSync(DICT) ? JSON.parse(fs.readFileSync(DICT, 'utf8')) : {};
const missing = list.filter(p => !(p in dict));

fs.mkdirSync(path.join(ROOT, 'i18n'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'i18n', 'phrases.json'), JSON.stringify(list), 'utf8');

// translator working file: short phrases get surrounding source context to disambiguate
const lines = missing.map((p, i) => {
  const at = seen.get(p);
  const ctx = p.length <= 12
    ? '   «' + html.slice(Math.max(0, at - 30), at + p.length + 30).replace(/\s+/g, ' ').replace(/[`$\\]/g, '') + '»'
    : '';
  return `${i}\t${p}${ctx}`;
});
fs.writeFileSync(path.join(ROOT, 'i18n', 'todo.txt'), lines.join('\n'), 'utf8');
const chars = list.reduce((s, p) => s + p.length, 0);
console.log(`${list.length} distinct phrases (${chars} chars); translated ${list.length - missing.length}; missing ${missing.length}`);
