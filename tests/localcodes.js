// Checks for the reference-code (country) selector and the national-code data.
//   node tests/localcodes.js
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'SmartEngineering_App.html'), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', e => errors.push((e.detail && e.detail.message) || e.message));
function boot(code) {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc, url: 'http://localhost/', beforeParse(win) { try { win.localStorage.setItem('si_lang', 'ar'); if (code) win.localStorage.setItem('si_code', code); } catch (e) {} } });
  const w = dom.window; w.alert = () => {}; w.confirm = () => true; w.scrollTo = () => {};
  return w;
}
let fail = 0;
function check(name, got, want, tol) {
  const ok = typeof want === 'number' ? Math.abs(got - want) <= (tol ?? 0.01) : JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fail++;
  console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : `  got=${JSON.stringify(got)} want=${JSON.stringify(want)}`));
}
const fire = (w, el) => el.dispatchEvent(new w.Event('change', { bubbles: true }));

// default and persistence
let w = boot();
check('default code is international', w.eval('CODEREF'), 'intl');
w.setCode('sy', true);
check('choice is persisted', w.localStorage.getItem('si_code'), 'sy');
w = boot('eg');
check('saved code restored on start', [w.eval('CODEREF'), w.document.getElementById('codeSel').value], ['eg', 'eg']);
w = boot('bogus');
check('unknown saved code falls back to international', w.eval('CODEREF'), 'intl');

// Syrian code, Table 1/3
w = boot('sy');
const doc = w.document;
check('36 Syrian cities in Table 1/3', w.eval('SY_CITIES.length'), 36);
check('Damascus 40 C / 20 % RH at 729 m', w.eval('(c=>[c.ts,c.tw,c.rhs,c.rhw,c.alt])(SY_CITIES[0])'), [40, -2, 20, 75, 729]);
check('Lattakia 34 C / 60 % RH', w.eval('(c=>[c.n,c.ts,c.rhs])(SY_CITIES[8])'), ['اللاذقية', 34, 60]);
w.showCalc('coolingload');
doc.getElementById('cl_mode').value = 'detailed'; fire(w, doc.getElementById('cl_mode'));
const city = doc.getElementById('cl_city');
check('city selector offered for Syria', !!city, true);
city.value = '0'; fire(w, city);
check('city fills outdoor dry-bulb', +doc.getElementById('cl_odb').value, 40);
const wDam = +doc.getElementById('cl_ow').value;
check('Damascus design humidity ratio plausible (g/kg)', wDam > 7 && wDam < 12, true);
const ind = doc.getElementById('cl_indoor');
ind.value = '2'; fire(w, ind); // offices 24-25 C / 40-50 %
check('indoor preset fills 24.5 C', +doc.getElementById('cl_idb').value, 24.5);

// Egypt: indoor presets only
w = boot('eg'); w.showCalc('coolingload');
w.document.getElementById('cl_mode').value = 'detailed'; fire(w, w.document.getElementById('cl_mode'));
check('no city selector for Egypt (no design city data)', !!w.document.getElementById('cl_city'), false);
check('Egyptian indoor presets present', w.document.getElementById('cl_indoor').options.length > 10, true);

// Ventilation rates per code
function vent(code, idx, label) {
  const x = boot(code); x.showCalc('ventilation');
  const u = x.document.getElementById('vt_use'); u.value = 'loc' + idx; fire(x, u);
  return { rp: +x.document.getElementById('vt_rp').value, ra: +x.document.getElementById('vt_ra').value, text: u.options[u.selectedIndex].text };
}
let r = vent('sa', 0);
check('SBC office: 2.5 L/s per person -> 5.30 cfm', r.rp, 2.5 / 0.47195, 0.01);
check('SBC office: 0.30 L/s per m2 -> 0.059 cfm/ft2', r.ra, 0.30 / 5.0802, 0.001);
r = vent('eg', 6);
check('Egypt office: 10 L/s per person', r.rp, 10 / 0.47195, 0.01);
r = vent('sy', 11);
check('Syria garage: 7.5 L/s per m2 and no per-person part', [r.rp, +r.ra.toFixed(3)], [0, +(7.5 / 5.0802).toFixed(3)]);
check('Egyptian and Syrian ventilation tables share one list', w.eval('ARAB_VENT.length'), 20);
w = boot(); w.showCalc('ventilation');
check('international mode keeps only the ASHRAE list', w.document.getElementById('vt_use').options.length, 12);

// Saudi code (SBC 201 / 801 / 701) — fire and plumbing
w = boot('sa');
check('SBC stair limits 25-87 Pa', w.eval('(l=>[l.min,l.max])(stairLimits())'), [25, 87]);
check('SBC elevator limits 25-62 Pa', w.eval('(l=>[l.min,l.max])(elevLimits())'), [25, 62]);
w.renderCalc('stairpress'); w.document.getElementById('st_pres').value = 100;
check('stair at 100 Pa breaches the SBC 87 Pa maximum', w.calcStairPress().warnings.some(m => /87/.test(m)), true);
w.document.getElementById('st_pres').value = 20;
check('stair at 20 Pa is below the SBC 25 Pa minimum', w.calcStairPress().warnings.some(m => /25/.test(m)), true);
w.renderCalc('elevatorpress'); w.document.getElementById('el_pres').value = 70;
check('elevator at 70 Pa breaches the SBC 62 Pa maximum', w.calcElevatorPress().warnings.some(m => /62/.test(m)), true);
w.document.getElementById('el_pres').value = 25;
check('elevator at 25 Pa passes the SBC limits', w.calcElevatorPress().warnings.some(m => /Pa أقل|أعلى من الحد/.test(m)), false);
w.renderCalc('fixtureunits'); w.calcResult('fixtureunits');
check('SBC note shown under the fixture-unit results', /SBC 701-18/.test(w.document.getElementById('fixtureunits_result').textContent), true);
w = boot();
w.renderCalc('fixtureunits'); w.calcResult('fixtureunits');
check('no SBC note in international mode', /SBC 701-18/.test(w.document.getElementById('fixtureunits_result').textContent), false);
w.renderCalc('stairpress'); w.document.getElementById('st_pres').value = 100;
check('international mode has no 87 Pa maximum', w.calcStairPress().warnings.some(m => /87/.test(m)), false);
// SBC 701-18 tables compared with the values the app uses
check('SBC 710.1(1): 100 mm drain 216 dfu at 20 mm/m', w.eval('DRAIN_PIPE_TABLE.find(r=>r.size===4).dfu'), 216);
check('SBC 710.1(1): 200 mm drain 1920 dfu', w.eval('DRAIN_PIPE_TABLE.find(r=>r.size===8).dfu'), 1920);
check('SBC 712.4.2: 80 L/min = 21 gpm (2 in pipe)', Math.round(80 / 3.78541), 21);
check('SBC 712.4.2: 175 L/min = 46 gpm (3 in pipe)', Math.round(175 / 3.78541), 46);
// SBC 601-18 Table 5.1 / SBC 602-18 Table 11.1
w = boot('sa');
check('29 Saudi cities in SBC 602 Table 11.1', w.eval('SA_CITIES.length'), 29);
check('Riyadh (K. Khaled) zone 1, DB 1% 43.9', w.eval('(c=>[c.z,c.db,c.mx,c.alt])(SA_CITIES.find(c=>/مطار الملك خالد/.test(c.n)))'), [1, 43.9, 47.6, 614]);
check('Abha is zone 3', w.eval('SA_CITIES[0].z'), 3);
w.showCalc('coolingload');
w.document.getElementById('cl_mode').value = 'detailed'; fire(w, w.document.getElementById('cl_mode'));
w.document.getElementById('cl_city').value = '19'; fire(w, w.document.getElementById('cl_city'));
check('Saudi city fills outdoor DB with the 1 % value', +w.document.getElementById('cl_odb').value, 43.9);
w.document.getElementById('cl_indoor').value = '0'; fire(w, w.document.getElementById('cl_indoor'));
check('SBC 602 indoor summer 23.9 C', +w.document.getElementById('cl_idb').value, 23.9);
w.showCalc('uvalue');
const setSel = (id, v) => { const e = w.document.getElementById(id); e.value = v; fire(w, e); };
setSel('sbc_city', '0'); setSel('sbc_class', '0'); setSel('sbc_elem', 'wall_steel');
check('Abha (zone 3) steel-framed wall, nonresidential: U <= 0.340', +w.document.getElementById('uv_target').value, 0.34);
setSel('sbc_city', '19'); setSel('sbc_class', '1'); setSel('sbc_elem', 'roof_deck');
check('Riyadh (zone 1) residential roof above deck: U <= 0.272', +w.document.getElementById('uv_target').value, 0.272);
setSel('sbc_elem', 'glass_50');
check('glazing >40-50 %: U <= 2.38', +w.document.getElementById('uv_target').value, 2.38);
check('compliance check runs against the SBC limit', typeof w.calcUValue().compliance, 'boolean');
w = boot(); w.showCalc('uvalue');
check('no SBC selectors in international mode', !!w.document.getElementById('sbc_zone'), false);
// Standpipe demand (NFPA 14-2019 §7.10) and the SBC 801 notes in the water/fire tank calculator
function sp(cls, n, spk, spkGpm, pump) {
  const x = boot(); x.renderCalc('waterconsumption');
  const s = (id, v) => { x.document.getElementById(id).value = String(v); };
  s('wc_sp_class', cls); s('wc_sp_n', n); s('wc_sp_spk', spk); s('wc_spk_gpm', spkGpm); s('wc_pumpgpm', pump);
  return x.calcWaterConsumption();
}
check('Class I, 1 standpipe: 500 gpm', sp('I', 1, 'full', 0, 1000).spDemand, 500);
check('Class I, 2 standpipes: 750 gpm', sp('I', 2, 'full', 0, 1000).spDemand, 750);
check('Class I sprinklered: capped at 1000 gpm', sp('I', 6, 'full', 0, 1500).spDemand, 1000);
check('Class I not sprinklered: capped at 1250 gpm', sp('I', 6, 'none', 0, 1500).spDemand, 1250);
check('Class II: 100 gpm', sp('II', 3, 'full', 0, 1000).spDemand, 100);
check('sprinkler demand above standpipe demand governs (900 vs 750)', sp('I', 2, 'full', 900, 1000).spReq, 900);
check('30-minute volume = 750 gpm x 30 min', +sp('I', 2, 'full', 0, 1000).spVol30.toFixed(1), 85.2);
check('pump below the demand is flagged', sp('I', 2, 'full', 0, 500).spShort, true);
check('pump at the demand is not flagged', sp('I', 2, 'full', 0, 750).spShort, false);
check('no hose system: no demand', sp('none', 2, 'full', 0, 500).spReq, 0);
w = boot('sa'); w.renderCalc('waterconsumption'); w.calcResult('waterconsumption');
check('SBC 801 note under the fire-tank results', /945 L\/min/.test(w.document.getElementById('waterconsumption_result').textContent), true);
// SBC 701-18 images (grease interceptor Table 1003.3.4.1, slope Table 704.1, tank drains Table 606.5.7)
w = boot('sa');
check('grease 15 L/min -> 3.6 kg', w.eval('sbcGreaseKg(15)'), 3.6);
check('grease 100 L/min rounds up to the 132 row -> 32 kg', w.eval('sbcGreaseKg(100)'), 32);
check('grease 380 L/min -> 91 kg', w.eval('sbcGreaseKg(380)'), 91);
check('grease above 380: twice the rating (760 L/min = 200.8 gpm -> 182 kg)', Math.round(w.eval('sbcGreaseKg(760)')), 182);
w.renderCalc('grease');
w.document.querySelector('.gr-qty').value = 4; w.calcResult('grease');
check('SBC grease row shown in Saudi mode', /1003\.3\.4\.1/.test(w.document.getElementById('grease_result').textContent), true);
w.renderCalc('fixtureunits'); w.calcResult('fixtureunits');
check('slope table 704.1 and Table 604.5 in the fixture-unit note', /704\.1/.test(w.document.getElementById('fixtureunits_result').textContent) && /604\.5/.test(w.document.getElementById('fixtureunits_result').textContent), true);
w.renderCalc('waterconsumption'); w.calcResult('waterconsumption');
check('tank drain/overflow sizes (606.5.7 / 606.5.4) in the tank note', /606\.5\.7/.test(w.document.getElementById('waterconsumption_result').textContent), true);
check('no page errors', errors.length, 0);
if (errors.length) console.log(errors.slice(0, 5));
console.log(fail ? `${fail} local-code check(s) FAILED` : 'all local-code checks passed');
process.exit(fail ? 1 : 0);
