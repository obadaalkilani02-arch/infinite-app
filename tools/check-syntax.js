// Syntax-check every executable <script> block of the app (JSON data blocks are skipped).
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'SmartEngineering_App.html'), 'utf8');
let n = 0;
for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
  if (/application\/json/.test(m[1])) continue;
  new Function(m[2]); n++;
}
console.log(`JS syntax OK (${n} script block${n === 1 ? '' : 's'})`);
