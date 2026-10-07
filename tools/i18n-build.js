// Merge i18n/en/part-*.json into i18n/en.json and inject it into the app between the I18N markers.
//   node tools/i18n-build.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'src', 'SmartEngineering_App.html');
const PARTS = path.join(ROOT, 'i18n', 'en');

const dict = {};
const files = fs.readdirSync(PARTS).filter(f => /^part-.*\.json$/.test(f)).sort();
for (const f of files) {
  let part;
  try { part = JSON.parse(fs.readFileSync(path.join(PARTS, f), 'utf8')); }
  catch (e) { console.error(`INVALID JSON in ${f}: ${e.message}`); process.exit(1); }
  for (const [k, v] of Object.entries(part)) {
    if (typeof v !== 'string') { console.error(`non-string value for "${k}" in ${f}`); process.exit(1); }
    dict[k] = v;
  }
}
fs.writeFileSync(path.join(ROOT, 'i18n', 'en.json'), JSON.stringify(dict, null, 1), 'utf8');

// keep the inline JSON safe inside <script>: "</" and "<!--" must not appear literally
const json = JSON.stringify(dict).replace(/</g, '\\u003c');
let html = fs.readFileSync(APP, 'utf8');
const re = /<!--I18N-BEGIN-->[\s\S]*?<!--I18N-END-->/;
if (!re.test(html)) { console.error('I18N markers not found in app'); process.exit(1); }
html = html.replace(re, () => `<!--I18N-BEGIN--><script id="i18n-dict" type="application/json">${json}</script><!--I18N-END-->`);
fs.writeFileSync(APP, html, 'utf8');
console.log(`dictionary: ${Object.keys(dict).length} phrases from ${files.length} part file(s), ${(json.length / 1024).toFixed(0)} KB injected`);
