# Audit table — SmartEngineering (updated 2026-10-07)

Render: golden snapshot + edge sweep via `node tests/golden.js [--update|--edge]`.
Review status: Done = verified against standard in a prior session (per handoff summary); Todo = not yet re-verified this cycle.

## Plumbing (20)
| Calc | Standard | Review | Notes |
|---|---|---|---|
| sump, sewage, liftpit | IPC-2021 / ASME A17.1 | Todo | |
| booster, lifting, recirc | IPC E103.3, Hazen-Williams | Todo | edge: 1e9 input -> RangeError |
| heater | ASHRAE | Todo | edge: NaN when peak/tankSize/eff = 0 or empty (no divide guards, calcHeater) |
| raindrain | IPC 1106 | Done (table fixed) | edge: 1e9 input -> RangeError |
| waterconsumption, pool | MEWA 2018 / SPATA | pool Done (evaporation rebuilt) | pool edge: 1e9 -> RangeError |
| fixtureunits, friction, irrigation | IPC / Colebrook | irrigation pump Done | |
| booster / fixtureunits | IPC 2021 E103.3(2)/(3), 709.1, 710.1(1)/(2), E103.1 | Done (numbers) | Hunter curve now the code table (tank and flushometer columns, interpolated); residual 8 psi (5.6 m) tank / 15 psi (10.6 m) flushometer; drain table 710.1(1) and stack table 710.1(2) with branch-interval columns; shower 25.8–55.6 gpm row added | |
| vent | IPC 2021 Table 906.1 / 912.3 | Done (rebuilt) | DFU + developed-length lookup; wet vent per 912.3 | individual/branch vent sizing is the 1/2-drain rule only |
| waterhammer | PDI-WH201 via ASPE Vol.2 | Done (rebuilt) | arrester sizes A–F by FU (≤330), +1 size above 65 psi, 2 arresters if branch >20 ft | PDI-WH201 itself not in library (taken as cited by ASPE) |
| expansiontank | ASPE Vol.2 Eq. 5-6 | Done (formula fixed) | was Vs·Ec/[(Pa/P1)-(Pa/P2)] (oversized); now Vs·Ec/(1-P1/P2), absolute pressures | |
| grease | UPC 2021 Tables 1014.2.1 / 1014.3.6 | 🔴 flagged | PDI-G101 method not in library; UI now points to UPC DFU table (8→500 gal, 21→750, 35→1000…) | unverified |
| dhwrecirc | ASPE | 🔴 flagged | heat-loss rates unverified | |
| chlorination | AWWA C651/C652 | 🔴 flagged | codes not in library | |
| prv | ASSE 1003 | 🔴 flagged | generic Cv table | |

## HVAC (15)
coolingload, hvacairflow, ductsizing, ventilation, chwflow, coolingtower, fcuselection, splitselection, desertcooler, ductweight, parkingvent, uvalue, kitchenhood, diffuserselection
Done earlier: ventilation (62.1), ductweight, ductsizing, kitchenhood, diffuserselection.

Reviewed 2026-10-07 (checks in `tests/hvac.js`; U-value targets come from the office file `معاملات انتقال الحرارة.xlsx`):

| Calc | Status | Fixed | Still open |
|---|---|---|---|
| hvacairflow | Done | none needed — CFM = Qs/(1.10·ΔT) matches ASHRAE Fund. Ch.1 | unused rough ACH estimate inside calc (not displayed) |
| chwflow | Done (numbers) | Hazen-Williams used the SI constant with gpm/inch units → pressure drop ≈100× too small (0.014 vs 1.44 ft/100ft for 240 gpm in 5"); now US form 0.2083·(100/C)^1.852·Q^1.852/d^4.8655. Office pipe-table lookup returned "<½"" for any fractional GPM in its integer gaps (4.5, 24.5…). 16" ID 15.000 → 14.688 (Sch 40); added 18/20/24" (>16" pipes used to cap at 16") | "pipe type" input (copper/PVC/HDPE) has no effect (steel Sch 40 only; now stated in note); Hx-efficiency divides load (office convention, kept) |
| coolingtower | Done | guard: T_in ≤ T_out or COC ≤ 1 gave negative/infinite flows → now an error message | footprint 0.18 m²/TR is a rough rule; blowdown = E/(COC−1) ignores drift (conservative); office Evaporation & Bleeding .doc has equation objects that could not be extracted |
| fcuselection | Done (rebuilt with user approval) | "electrical kW" was actually thermal capacity (Q/3412) → relabelled; "ASHRAE recommends 10%" claim removed; **OA handling rebuilt**: OA sensible (1.10·CFM·ΔT) + latent (4840·CFM·ΔW) now added to the coil load (new inputs: outdoor/indoor DBT and W), OA is part of supply CFM instead of being added to it, CHW GPM and selection use the coil load (default 5 TR zone → 6.0 TR coil) | supply ΔT 20 °F, CHW ΔT 10 °F and EWT are fixed constants |
| splitselection | Done (no change) | — | derating slopes (0.7%/°C outdoor, 1%/°C indoor) are approximations, already disclosed in UI |
| desertcooler | Done (numbers) | water use used 3.5 L/h per 1000 CFM; adiabatic energy balance gives ≈18 L/h per 1000 CFM → now 1.10·CFM·(DBT−LDBT)/1050·0.4536 (bleed-off excluded, noted) | office Evaporation & Bleeding calc not machine-readable |
| parkingvent | Done (logic) | no numeric error found (0.75 cfm/ft² ≡ 3.81 L/s/m²) | NFPA 88A smoke-exhaust ACH (6–10) not verified — NFPA 88A not extracted from library; CO₂ mode treats 100 % of exhaust as fresh air while other modes use 90 % |
| uvalue | Done | the 8 office assemblies did not reproduce the office Excel: interior partitions used Rse 0.04 instead of an interior film, interior block k 0.91 instead of 0.77, roof films 0.10/0.04 instead of 0.15/0.106 (int_wall 2.94 vs 2.29 W/m²K, roof_typ 1.85 vs 1.60). Assemblies now carry the office film resistances; element-type select now actually resets Rsi/Rse (ISO 6946) | office films (0.123/0.03) differ slightly from ISO 6946 defaults (0.13/0.04) used when you switch element type manually |
| coolingload | Done (data) | envelope U-values (0.72/2.29/2.28/1.60/0.66/1.57/2.31) match the office file; latent infiltration 4840·CFM·ΔW and sensible 1.10·CFM·ΔT correct; comment on person split fixed (250 sens + 200 lat, total 450 unchanged); "ASHRAE recommends 10-15 %" claim removed | quick mode: area × load density (400-550 BTU/h·m², a *total* load) also added people + lights + equipment → double counting. Now (user decision) the default treats the density as total and adds nothing; the previous office method stays as a 🔴-flagged second option ("added"). Detailed mode unchanged. Solar irradiance and glazing defaults remain 🔴 (no site climate data); full RTS still pending hourly climate data |

## Fire (5) — safety priority
Reviewed 2026-10-07 against NFPA 13-2019, NFPA 12-2022, NFPA 92-2021 and the ASHRAE/NFPA/SFPE Handbook of Smoke Control Engineering (all in `standars\`). Behavioural checks: `tests/fire.js`.

| Calc | Status | Fixed | Still open |
|---|---|---|---|
| fm200calc | Done (earlier session) | critical nozzle-count fix | |
| sprinkler | Done (numbers) | one pipe table for all hazards → per-hazard tables (light 27.5.2.2.1, ordinary 27.5.3.4, extra A.27.5.4); sidewall used pendent coverage (ordinary 12.1 → 9.3 m², light 20.9 → 18.2 m²); warning when manual area exceeds NFPA max; extra hazard flagged as hydraulic-only (27.5.4); wrong table/chapter refs (8.6.2.2.1, 8.2, Ch.11) corrected | branch pipe = size for ⌈count/3⌉ is an unsourced layout assumption (BOQ heuristic); "Code" selector (SBC 801/EN 12845) does not change limits |
| co2calc | Done (numbers) | single flooding factor → NFPA 12 Table 5.3.3(a) volume-graded FF + minimum quantity for surface fires; deep-seated split per Table 5.4.2.1 (dry electrical 0.100 below 56.6 m³ / 0.083 + 200 lb min above; records 65% 0.125; fur/dust 75% 0.166) | not modelled: conversion factor for >34% fuels, openings, non-stoppable ventilation, temperature correction (listed in UI note) |
| stairpress | Done (refs/warnings) | NFPA 92 refs corrected (§4.6, not 6.3); open-door velocity no longer attributed to NFPA 92; added min-pressure and 133 N door-force warnings (A.4.4.2.2) | open-door model (0.5 factor on extra doors, +50% leakage) and Fan SP friction constants are unsourced; BS EN 12101-6 not in library so door leakage table unverified (values lower than ASHRAE Handbook Table 11.2) |
| elevatorpress | Done (rebuilt with user approval) | refs corrected (§4.7); K=0.839 explained (C=0.65, ρ=1.2) — "0.827 for ordinary doors" removed; min-pressure warning; **formula rebuilt**: Qe = K·√P·[Ae_closed·margin + Ae_open·n + Ae_vent] per NFPA 92 §4.7 (recall-floor door open 0.56 m² default from ASHRAE Handbook Table 11.2, hoistway vent input; margin applied to leakage only; closed-doors-only result still shown for comparison; default 9-door case 3.40 → 5.37 m³/s) | single-door-area default and vent area are project-specific inputs (vent defaults to 0 with a warning); 0.04/0.08 m² door options unsourced |

## Electrical (1)
lightingcalc (Done). lpgcalc (Done).

## Edge sweep (163/164 clean)
Fixed 2026-10-07:
1. heater: peak/tankSize/eff <= 0 now shows "أدخل بيانات صحيحة" instead of NaN.
2. booster/lifting/pool pump counts and raindrain leaders now clamped to their field range (were driving huge string builds).

Open (low risk): raindrain still throws RangeError only when ALL numeric fields are set to 1e9 at once; no single field triggers it. Revisit during raindrain review.
| heater | ASPE Vol.2 Table 6-1 (hot-water demand per fixture) | Done (checked cell by cell) | all 17 fixture rows, demand and storage factors match the table (script-verified); source was labelled "ASHRAE Table 8"; hotel dishwasher now mid-range 125 gph (table 50–200); usable storage was fixed 80%, now 75% vertical / 65% horizontal per ASPE stratification text; extra-25% margin flagged as non-code | table is at 140°F final temperature; recovery method has no ASPE equation check yet |
| waterconsumption | NFPA 20-2022 §11.4.1.3 | Done (diesel) | fuel tank = 1 gal/hp + 5% expansion + 5% sump confirmed; label corrected to diesel engine hp; fire duration attributed to NFPA 13 | 🔴 MEWA 2018 demand table, storage days and ground-tank = days × roof tank are office/regional practice (not in library) |
| lifting / recirc | none (pump head from user friction rate) | 🔴 flagged | generic Hazen-style input method, no code basis | |
| friction | Darcy–Weisbach / Swamee–Jain | Done | residual-pressure hint corrected to IPC E103.1 (5.6 / 10.6 m) | 🔴 equivalent-length guide approximate |
| sump / sewage / liftpit | IPC 2021 §712 | see above | | |

## National codes (reference-code selector)
Header selector: International (default) / Saudi / Egypt / Syria, persisted (`si_code`). Only values found in the local library are offered; nothing is estimated.
| Code | Source (local library) | Used in | Notes |
|---|---|---|---|
| Syria | Syrian Arab HVAC Code Table 1/3 (36 cities), Table 2/3 (indoor), Table 3/3 (ventilation) | cooling load (detailed): city → outdoor DBT + humidity ratio; indoor preset; ventilation rates | city RH + altitude → W via psychrometrics |
| Egypt | Egyptian HVAC Code Tables 2-2 (indoor), 2-8 (ventilation) | cooling load indoor preset; ventilation rates | Egyptian code has only monthly climate averages (no design city values); Table 2-8 = Syrian 3/3 |
| Saudi | SBC 501-2024 Table 403.3.1.1 | ventilation rates (≈55 occupancies, L/s) | no city table in the available text; SBC 701/801/601 not readable (Arabic PDFs are scans, English ones password-protected) |
UAE (Dubai Building Code 2021) and Jordan were added on 2026-10-08, see "National codes, part 2" below. Egyptian fire / plumbing PDFs are scanned images (no text layer).
### Saudi (SBC) — now readable
| Topic | SBC clause | Result |
|---|---|---|
| Plumbing tables | SBC 701-18 (= IPC 2015 in SI): 710.1(1)/(2), 712.4.2, 912.3, E103.1, E103.3(3) | compared with app values: identical (Hunter table machine-checked, 100 rows). No numeric change; code-basis note + mm sizes + Table 604.4 fixture flow limits shown under results |
| Stair pressurization | SBC 201 §909.20.4.4 / 909.20.5 | 25 Pa minimum; 87 Pa maximum (sprinklered, no vestibule) — warnings switch to SBC limits |
| Elevator pressurization | SBC 801 §909.21.1 | 25–62 Pa; intake ≥ 6 m from exhaust; recall-floor exception — warnings switch to SBC limits |
| Sprinklers | SBC 801 §903 / §914.3.2 | design by NFPA 13 (unchanged); high-rise secondary supply note |
| Smoke barrier pressure | SBC 801 §909.6.1 | 12 Pa (sprinklered) — equals the NFPA 92 value already used |
Not yet compared: SBC 601/602 energy codes (U-values), SBC 801 fire pump/standpipe flows, SBC 702 private sewage.
### SBC 601 / 602 (energy codes) — U-value check
- SBC 601-18 Table 5.1: max U (W/m²K) per climate zone 1/2/3 and class (nonresidential / residential / semiconditioned) for roofs, walls, floors, doors and glazing — **24 opaque values machine-checked against the extracted text (0 differences)**; glazing 2.89 / 2.38 / 1.87 and SHGC ≤ 0.25 read from the same table.
- SBC 602-18 Table 11.1: 29 Saudi cities with climate zone, elevation, 1 % design DB and 10-yr max DB — city selector in the cooling load; SBC 602 §11.2 indoor 23.9 °C / 50 %.
- The old uvalue warning ("12 climate zones … 0.53 / 0.34") was unsourced and wrong (SBC 601 has 3 zones); replaced.
- Not covered: SBC 602 Table 5.2 (low-rise residential envelope), slab-on-grade F-factors, below-grade C-factors, SHGC multipliers (Table 5.3).
### SBC 801 — fire pumps and standpipes
SBC 801-18 sets **no flow rates of its own**: standpipes per NFPA 14 (§905.2), fire pumps per NFPA 20 (§913.1), sprinklers per NFPA 13. The Saudi-specific items found (shown under the fire-tank results in Saudi mode):
- §905.3.1 Class III standpipes where the highest floor is > 9 m above / lowest > 9 m below Civil Defense access (Class I allowed if fully sprinklered)
- §905.3.3 malls: Class I connections, 945 L/min at the remote connection with the sprinkler demand, ≤ 345 kPa loss
- §913.2.1 pump room 2-hour barrier (1-hour if not high-rise and fully sprinklered); §913.3 pump room > 4 °C
- §914.3.1.2 (> 128 m) pumps fed by ≥ 2 mains in different streets; §914.3.2 secondary supply, 30 min
Added to the water/fire-tank calculator (all codes): standpipe demand per NFPA 14-2019 §7.10 — Class I/III 500 gpm + 250 gpm per extra standpipe (cap 1000 sprinklered / 1250 not), Class II 100 gpm; combined system = greater of sprinkler and standpipe demand (§7.10.1.3.1.1); 30-minute supply (§9.2); warns when the entered pump flow is below the demand. Not modelled: 750 gpm rule for horizontal standpipes with ≥ 3 connections, partial sprinklering, > 80,000 ft² floors, residual pressure 100/65 psi.
### Images in `standars/صور كود/` (17 screenshots of SBC 701-18 / SBC 501 tables — read one by one)
Tables 709.1, 709.2, 710.1(1), 710.1(2), 712.4.2, 906.1, 906.5.1, 604.3, 604.4, 604.5, 604.10.1, 704.1, 606.5.4/606.5.7, 608.17.1, 1003.3.4.1, 308.5, 314.2.2 (condensate drain).
- Used: 1003.3.4.1 (grease retention, now in the grease results for Saudi mode — it is the SBC/IPC-2015 table, removed from IPC 2021), 606.5.7 / 606.5.4 (tank drain / overflow sizes), 704.1 (slopes), 604.5 (fixture supply pipe sizes), 604.3/604.4 (already in notes).
- Cross-checked against the app (no change needed): 709.1 / 709.2 DFU values, 710.1(1), 710.1(2), 712.4.2.
- **906.1 vent table as printed in SBC differs from the IPC values in a few cells** (apparent printing errors/shifted cells): 2"/10 dfu row printed as 50 mm/10 dfu instead of 20; 3" stack 21 dfu with 2" vent 36 m (IPC 110 ft = 33.5 m); 4" stack 43 dfu with 2" vent 26 m (IPC 35 ft = 10.7 m); 4" stack 140 dfu 2" vent 11.8 m and 2½" vent 110 m (IPC 27 ft = 8.2 m and 65 ft = 19.8 m). In every differing cell the IPC value the app uses is the smaller (more conservative) one, so the app was left unchanged.
- Not used (no matching calculator): 906.5.1 sump vents, 604.10.1 manifolds, 608.17.1, 308.5 hanger spacing, 314.2.2 condensate drain sizing (could go in FCU/split results).

## New sections
### Electrical — cable sizing and voltage drop (`cablesizing`)
- **NEC 2008** (NFPA-70 text in the library): Table 310.16 / 310.17 ampacity (60/75/90 °C, Cu/Al, 14 AWG–1000 kcmil), ambient correction (Table 310.16 footer), grouping 310.15(B)(2)(a), 110.14(C) termination temperature (60 °C ≤ 100 A, 75 °C above), 125 % continuous load (210.19(A)(1)), 240.4(D) small conductors, 240.6(A) standard breaker ratings, 310.4 parallel conductors from 1/0 AWG, Chapter 9 Table 9 R and X for voltage drop. All tables parsed from the text; spot values asserted in `tests/electrical.js`.
- **SBC 401-18 (IEC 60364-5-52)**: Tables B.52-2 … B.52-5 rebuilt by page coordinates (PVC/XLPE, 2 and 3 loaded conductors, Cu 1.5–300, Al 2.5–300 mm², methods A1 A2 B1 B2 C D1 D2), factors B.52-14 (air), B.52-15 (ground), B.52-16 (soil), B.52-17 (grouping, bunched / single layer), voltage-drop formula and limits of Annex G.52 / Table G.52-1 (3/5 % public supply, 6/8 % private, +0.005 %/m beyond 100 m, max +0.5 %).
- Known data issue in the SBC text: Table B.52-14 prints XLPE 1.5 at 10 °C and 0.6 for mineral at 35 °C (typos); 1.15 used for XLPE at 10 °C. 🔴 Standard IEC breaker ratings (6, 10, 16 …) are a common series, not listed in SBC 401.
- Not covered: IEC methods E/F/G (free air multi-core), grouping of buried cables (Tables B.52-18/19). (Motor circuits and short-circuit withstand are now covered by the calculators below.)
### Electrical extras (`motorcircuit`, `loadcalc`, `protcond`, `faultloop`, `transformer`, `pfcorrection`, `conduitfill`)
Data was parsed from the NEC 2008 text (motor tables, Chapter 9 Tables 4 and 5) or typed from SBC 401-18; spot values and the code's own worked examples are asserted in `tests/electrical2.js` (Annex A.81 examples, Annex C conductor counts).
- **motorcircuit** — NEC Art. 430: FLC from Tables 430.248 / 430.250 (induction columns; the 200 hp row has a missing 115 V dash in the text, handled); conductors ≥ 125 % FLC (430.22, ambient and grouping factors, termination column limit 110.14(C)); overload ≤ 125 % (SF ≥ 1.15 or rise ≤ 40 °C) / 115 % of nameplate, 140 % / 130 % if it cannot start (430.32(C)); short-circuit and ground-fault protection by Table 430.52 with the next-higher standard rating (Exception 1) and the starting limits of Exception 2 (fuse 400 %/300 %, dual-element 225 %, breaker 400 %/300 %, instantaneous 1300/1700 %); disconnect ≥ 115 % (430.110); EGC from Table 250.122 (instantaneous breaker: on the 175 % dual-element fuse, 250.122(D)(2)); several motors 430.24 and 430.62(A) (largest standard rating **not above** the sum). Not covered: motors above 600 V (Part XI, Table 310.60), wye-delta / part-winding, non-continuous duty, multispeed, hermetic compressors (Art. 440). Fuse ratings 1, 3, 6, 10, 601 added per 240.6(A).
- **loadcalc** — NEC Art. 220: dwelling standard method (33 VA/m² + 2 × 1500 VA small appliance + laundry, Table 220.42; 75 % for ≥ 4 fixed appliances; dryers Table 220.54; ranges Table 220.55 column C with Note 1; larger of heating / cooling; 25 % of the largest motor), optional method 220.82 (10 kVA at 100 % + 40 %; heating 65 % / 40 % of < 4 / ≥ 4 units), other occupancies (Table 220.12 VA/m², Tables 220.42 / 220.44 / 220.56, 220.14(I)/(K) receptacles, 220.60, motors 125 % of the largest, continuous load 125 % per 215.2(A)(1)). 🔴 The continuous share of "other loads" is a designer input. Not covered: neutral load (220.61), ranges 1.75–8.75 kW by columns A/B, show-window / track lighting, the 83 % service-conductor rule of 310.15(B)(7).
- **protcond** — NEC: Table 250.122 (+ 250.122(B) proportional up-sizing by circular mils, capped at the circuit conductors), Table 250.66 with 250.66(A)/(B) electrode limits, 250.102(C) supply-side bonding jumper (12.5 % above 1100 kcmil Cu / 1750 kcmil Al). SBC 401: PE by Table 54-2 (k₁/k₂ for different metals) or S = √(I²t)/k (54-3.1.2, ≤ 5 s), minima 54-3.1.3, k computed from the Annex A.54 formula and Table A.54-1 parameters (reproduces Tables A.54-2 and A.54-4 within ±0.6), cable withstand t = (kS/I)² with Table 43-1 k and the I²t comparison (43-4.5.2). The IEC 60228 standard-size series (1.5 … 630 mm²) is the one printed in the Alfanar / Elsewedy catalogues (flag removed 2026-10-08).
- **faultloop** — SBC 401 chapter 41: Table 41-1 maximum disconnection times (ac, TN / TT, final circuits ≤ 32 A; 5 s TN / 1 s TT otherwise), Zs·Ia ≤ U₀ (41-1.4.4, 41-1.5.4), TT with RCD RA·IΔn ≤ 50 V (41-1.5.3), and the measured-at-room-temperature rule Zs(m) ≤ 2U₀/(3Ia) (chapter 61 text) used against the 20 °C resistances (ρ₂₀ from Table A.54-1). Ia of MCB types B / C / D = 5 / 10 / 20 × In is the upper limit of the instantaneous-trip range 3–5 / 5–10 / 10–20 × In of IEC 60898 as printed in Schneider guide Fig H31 (flag removed 2026-10-08; the guide notes IEC 60898 allows up to 50 × In for type D, which manufacturers consider unrealistic); fuse Ia is a user input. Cable reactance is neglected (noted in the UI).
- **transformer** — NEC 450.3(B) (≤ 600 V: primary only 125 % / 167 % / 300 %, primary + secondary 250 % and 125 % / 167 %, Note 1 rounding only for the 125 % rows) and 450.3(A) (> 600 V, impedance ≤ 6 % and 6–10 %, any / supervised location). 🔴 The short-circuit current I₂/Z % (infinite bus) is an engineering estimate, not a code value (the new `shortcircuit` calculator gives the full impedance method). The kVA series is now the standard series of Schneider guide Fig A15 (100 … 3150 kVA). Transformers above 10 % impedance are outside Table 450.3(A).
- **pfcorrection** — SBC 401 chapter 81: kVAR = kW(tanφ₁ − tanφ₂) (matches Table 81-2 to ±0.001), fixed bank ≤ 15 % of the transformer (81-4.3.4), devices 1.3 × (1.15) × Ic (81-4.4.4.2), line-current reduction (81-4.4.4.1), Table 81-3 (16 motor rows) and Table 81-4, self-excitation limit √3·0.9·I₀·Uₙ, resonance order √(kVAsc/kVAR), capacitor type per Table 81-5 (general and simplified rules), and the transformer-limit example A.81-1.2 (132.5 kVAR reproduced). The code sets no target power factor ("as per the rules of the Kingdom"). 🔴 The ±0.5 warning band around an integer harmonic is not from the code.
- **Link loadcalc → cablesizing** — the «إرسال الحمل إلى حاسبة مقطع الكابل» button stores the calculated load (kVA), supply system, line voltage, conductor metal and the continuous share (`si_load_feed`, in-memory fallback); the cable-sizing calculator imports it only when it was sent to it (a banner with an import button otherwise), sets the reference to NEC, the load as kVA, phase, voltage, metal and `cs_cont` = continuous demand ÷ total (lighting of non-dwellings; dwelling loads 0 %), then sizes the conductor. Design current and the 125 % ampacity equal those of the load calculation (tested). Length, ambient and installation stay the designer's inputs. No new coefficients.
- **Links motorcircuit / transformer → cablesizing** — same hand-off (`si_load_feed`, now also in "amp" mode). A motor sends its table FLC with a 100 % continuous share (= the 125 % of 430.22(A)); the motor feeder sends the 430.24 ampacity (125 % of the largest motor already included) with 0 %. The motor's conductor insulation, termination temperature, ambient and number of current-carrying conductors travel with it, and the conductor chosen by the cable-sizing calculator equals the motor-circuit calculator's when the length is short (tested: 8 AWG for 25 hp at 460 V, 6 AWG for the 25 hp + 5 hp feeder). To make that possible `cablesizing` gained a termination-temperature selector (automatic = 60 °C up to 100 A and 75 °C above, 110.14(C)(1); 75 °C for motors of design B, C, D, 110.14(C)(1)(4); or 60 °C) — the default behaviour is unchanged. A transformer sends its rated secondary or primary current with a 100 % continuous share 🔴 (the code does not say transformer feeders are continuous; the share is editable in the cable calculator). Voltages above 1000 V (2300 V motors, an 11 kV primary) are refused with a message.
### Electrical, part 3 (`hvacmotor`, `firepump`, `alarmbattery`, `lightning`, `elevatorfeeder`) — `tests/electrical3.js`
- **hvacmotor** — NEC Art. 440: rated-load current RLA from the compressor nameplate, or the branch-circuit selection current if larger (440.6(A) and Exception 1); one compressor: conductors ≥ 125 % (440.32); several compressors / motors / loads: Σ currents + 25 % of the highest (440.33, 440.34, highest by 440.7); short-circuit and ground-fault protection ≤ 175 % (225 % if it cannot start, not below 15 A) (440.22(A)), and for several loads with the compressor largest 175 % of it + the others (440.22(B)(1)); the next lower standard rating is used because 440.22 has no round-up wording; disconnect ≥ 115 % of the rated-load current (440.12(A)(1)) or of the sum (440.12(B)(2)); overload relay ≤ 140 %, fuse / inverse breaker ≤ 125 %, thermal protector ≤ 156 % (440.52); controller rated ≥ RLA and LRA (440.41(A)); LRA assumed 6 × RLA when not marked (440.12(C)); marked MCA / MOCP equipment (440.35). Not covered: wye-delta compressors (72 %), 15/20 A circuits (440.54), room air conditioners (Part VII), 440.22(B)(2) when a fan motor is the largest load, interlock exceptions of 440.33. Sends the conductor ampacity to `cablesizing`.
- **firepump** — NEC Art. 695: conductors ≥ 125 % FLC for the pump alone (430.22 via 695.6(C)(2)), 125 % × (pump + pressure-maintenance pump) + 100 % accessories otherwise (695.6(C)(1)); the overcurrent device carries the sum of locked-rotor currents + accessories indefinitely and the next standard rating is taken (695.4(B)(1)); transformer ≥ 125 % × motors + 100 % × accessories (695.5(A)); voltage drop ≤ 15 % at the controller when starting and ≤ 5 % at the motor at 115 % FLC (695.7) with R and X from Chapter 9 Table 9; no overload or ground-fault protection (695.6(D),(H)). The conductor is the smallest size meeting ampacity **and** both drops. Locked-rotor current defaults to Table 430.251(B) (a maximum used for selecting disconnects and controllers — conservative; the motor nameplate value can be entered). 🔴 Starting and running power factors (0.30 / 0.85) and the source drop at starting are designer inputs.
- **alarmbattery** — NFPA 72 (2019) 10.6.7.2: 24 h of quiescent load then 5 min of alarm (15 min for emergency voice / mass notification, 10.6.7.2.1.2 and .7; CO detection 12 h unmonitored, 5 min monitored, .3 and .4), margin ≥ 20 % on the calculated Ah (10.6.7.2.1.1); minima enforced in the UI. The default device currents are now the sample calculation of NFPA 72 Handbook (2019) Exhibit 10.1 (0.1770 A standby, 3.32 A alarm → 4.5246 Ah × 1.2 = 5.43 Ah, asserted in `tests/electrical3.js`); high-power loudspeaker arrays (3 days + 60 min, 10.6.7.2.1.4 with the handbook commentary) were added. 🔴 The battery series (4.5 … 200 Ah) is a common series, not from NFPA 72.
- **lightning** — SBC 401 chapter 82: rolling-sphere radius 20 / 30 / 45 / 60 m and minimum peak current 3 / 5 / 10 / 16 kA per LPL I–IV (Table 82-4), maximum parameters (Table 82-3: 200 / 150 / 100 / 100 kA, 100 / 75 / 50 / 50 C, 10 / 5.6 / 2.5 / 2.5 MJ/Ω) and probabilities (Table 82-5). Geometry: protected radius √(h(2R−h)) − √(z(2R−z)) for one mast; sag R − √(R²−(d/2)²) for two. Since 2026-10-08 it also gives the external LPS of a rectangular roof: BS EN 62305-3 (as quoted in the Furse catalogue Tables 3–7: mesh 5 / 10 / 15 / 20 m, down conductors 10 / 10 / 15 / 20 m, 10 Ω earth termination, metal-sheet thickness) and NFPA 780-2023 (Class I ≤ 23 m / II above with the minimum material sizes of Tables 4.1.1.1.1–2, strike terminals ≤ 6 m or 7.6 m apart (4.6.2), at least two down conductors and one per 30 m of perimeter above 76 m (4.8.10), cross-run conductors on roofs wider than 15 m (4.8.8), sphere radius ≤ 45 m (4.7.3.1.4)). The NFPA 780 scan is OCR text with errors: values were read against the figures' context. Still not covered (IEC 62305-3 / -2 are not in the library): the protection-angle Table 2 (only a chart in Furse), risk assessment for choosing the LPL, separation distance, SPDs. Tables 82-3 / 82-5 are printed with merged cells for LPL III and IV; the usual IEC 62305-1 reading (equal values) is used.
- **elevatorfeeder** — NEC Art. 620: Table 620.14 demand factors (1.00 … 0.72), 620.13(B)/(D) sum of controller nameplate currents + other loads. Not covered: 620.51 / 620.61 disconnect and protection, duty-cycle conversion of motor currents (Table 430.22(E)). Sends the current to `cablesizing`.
- **pfcorrection** gained the NEC 460.8 capacitor circuit rating: conductor and disconnecting means ≥ 135 % of the capacitor rated current (≥ 1/3 of the motor conductor ampacity when connected to motor terminals), protection as low as practicable.
- **conduitfill** — NEC Chapter 9: Table 1 (53 / 31 / 40 %), nipples 60 % (Note 4), Table 4 for 12 raceway types (EMT, ENT, FMC, IMC, LFNC-A/B, LFMC, RMC, PVC 80 / 40 / A / EB), Table 5 for THHN / XHHW / THW / RHH (no outer covering), Note 7 (decimal ≥ 0.8 rounds the count up for same-size conductors — 6 × 8 AWG THHN in 3/4 in. EMT, matching Annex C). Not covered: Table 5A compact conductors, multiconductor cables, pull and bend limits.
### Electrical, part 4 — from the new catalogue folder (`shortcircuit`, `earthelectrode`, `maxdemand`, `liftmotor` + extensions) — `tests/electrical4.js`
- **shortcircuit** — Schneider Electric guide 2010 chapter G §4 (impedance method; SBC 401 43-4.1 / 43-4.5.1 require the prospective current at every point and a breaking capacity not less than it): MV network Za = U²/Psc (Xa = 0.995 Za, Ra = 0.1 Xa), transformer Ztr = U²/Pn·Usc/100 with Rtr from the losses or the typical Fig G35 values (13 ratings, oil / cast-resin, scaled by (U/420)²) or neglected, parallel identical transformers (impedance ÷ n; the guide adds the individual currents — slightly higher), circuit breaker 0.15 mΩ, busbars 0.15 mΩ/m (0.18 at 60 Hz), cables ρ = 22.5 / 36 mΩ·mm²/m and 0.08 mΩ/m (0.096 at 60 Hz), parallel conductors, free R-X sections, motors 3.5 × In above 25 % of the transformer, per-section breaking-capacity check, a button that sends the current to `protcond` (IEC mode, k²S²). **Example G37 reproduced within 3 %** (book 26 / 22 / 7.4 / 3.2 kA, tool 25.3 / 21.7 / 7.5 / 3.3 kA; the book's transformer figures Rtr 2.24 and Xtr 8.10 are not exactly derivable from its own Pcu, Usc — the tool derives Rtr 2.35, Xtr 8.50). Arc resistance is not deducted (conservative). IEC 60909 is not in the library.
- **earthelectrode** — SBC 401 Annex D.54 (informative): horizontal conductor R = 2ρ/L, plate R = 0.8ρ/P, rod R = ρ/L, n rods ρ/(nL) when spaced > 4L (Schneider chapter E §6), soil resistivity Tables D.54-1 / D.54-2 (the upper value of each range is used; the text printed "200 to 3 000" for siliceous sand — read as 200–300 as in IEC 60364-5-54 and the Schneider guide), Table 54-1 minimum sizes (22 rows; brackets = electric-shock protection only), targets: TT with RCD 50 V/IΔn (41-1.5.3), NEC 250.56 (25 Ω, rods ≥ 1.8 m apart, 250.53(F)-(H) depths, 2.44 m rod), BS EN 62305-3 10 Ω (Furse). Not covered: ring + rods combined, mutual-resistance factors for close rods, metallic piles (D.54-4).
- **maxdemand** — SBC 401 31-1 gives no values. Method 1: IET Guidance Note 1 Table H2 as printed in "A Practical Guide to the Wiring Regulations" §4.2 (lighting 66 / 90 / 75 %, heating, cooking, instantaneous water heaters, conventional circuits, socket-outlet points; no diversity for thermostatic water heaters, floor warming, storage heating) — all five worked examples of the book reproduced (30.6 A, 9.6 kW, 27.6 kW, 14.75 kW, 68 A). The book's domestic-cooker examples (39 A and 46.3 A) apply 30 % to the whole load while its own rule says "remainder"; the rule is followed. Motors are not given reliably in the printed text (garbled), so they are left to `motorcircuit`. Method 2: Schneider chapter A: apartment blocks Fig A10 (25 × 6 kVA × 0.46 = 69 kVA = 100 A reproduced), circuit function Fig A13 (motors/lifts 1 / 0.75 / 0.60 by rank), ku 0.75 for motors, board factor Fig A12 (IEC 60439), transformer series Fig A15. 🔴 default socket ks 0.2 (range 0.1–0.2 in the guide). Both modes send the current to `cablesizing` (new `std: 'iec'` hand-off flag).
- **liftmotor** — Al-Sharif, Lift Report 1999 (a paper, not a code): lift M = P·75·9.81·s(1−CF)/η, dynamic acceleration check with the inertia method, escalator P = (m g n (R_E/R_S) sinθ s + P_H)/(η_S η_G 1000 n_act/n_rat); all eight worked examples are asserted (49.44, 14.7, 7.65, 46.4 kW, a = 1.02 and 1.31 m/s², 71.3 and 39.86 kW). Example 5 prints car mass 1000 kg but its arithmetic uses 2000 kg (3050 = 2000 + 0.5 × 2100) — the arithmetic is followed. ACVV/VVVF derating by 5 % torque. 🔴 IEC 60072-1 standard motor ratings, default motor efficiency 0.90 and cosφ 0.85 are not from the paper.
- **cablesizing** — SBC 401 Annex E.52 / Table E.52-1 third-harmonic reduction (0–15 % none, 15–33 % 0.86, 33–45 % neutral current 0.86, > 45 % neutral current 1.0; neutral current 3·h₃·I_B) for four- and five-core cables, IEC mode, three-phase. The tool also keeps In ≤ Iz for the neutral-based current, so the 40 % example selects 16 mm² where the Annex (design load vs table capacity only) selects 10 mm².
- **Catalogue notes** — the conductor resistances in Alfanar / Elsewedy catalogues are IEC 60228 values (16 mm²: 1.15 Ω/km at 20 °C), consistent with the ρ = 0.0225 Ω·mm²/m used at service temperature; no manufacturer-specific data were adopted (standing rule: follow the codes).
### Electrical, part 5 (`genset`, `spd`, `neutral` + cable trays and conduit cables) — `tests/electrical5.js`
- **cablesizing, methods E / F / G** — SBC 401 Tables B.52-10 … B.52-13 (PVC / XLPE × Cu / Al, free air on perforated trays and ladders) rebuilt by page coordinates from the password-protected PDF (19 / 18 / 19 / 18 rows; columns: E 2 and 3 loaded multi-core, F touching 2 loaded / trefoil / flat, G spaced horizontal / vertical; single-core columns start at 25 mm²; spot values asserted). Grouping: Table B.52-20 (multi-core, perforated / unperforated / vertical perforated trays and ladders, touching or spaced, 1–6 trays × 1–9 cables) and B.52-21 (single-core, 1–3 trays × 1–3 circuits) keyed by hand from the page dump. Rules chosen: the next larger tabulated column / row (conservative), a circuit of m parallel conductors counts as m circuits (notes 5 and 6), a spaced value that is not tabulated falls back to the touching row, vertical spacing (G2) uses the horizontal row, G is not tabulated for two loaded conductors (F touching is used), and unperforated trays are not tabulated for single-core cables (perforated is used). The labels of the spaced rows of B.52-21 are not printed in the text: perforated spaced = horizontal formation, vertical perforated and ladder spaced = trefoil, inferred from the layout of the table. The IEC reference of 40 °C ambient etc. is unchanged.
- **genset** — standby generator: NEC 445.13 (conductors ≥ 115 % of the nameplate current), 700.5(A), 700.12 (10 s), 701.11 (60 s), fuel 2 h; Schneider chapter N: In = S/(√3U), X = x%·U²/S, Isc = 100·In/x'd (transient) and 100·In/x''d, steady ≈ 0.5 In, phase-neutral If = U√3/(2X'd + X'o), motor restart ΔU/U = (Id − In)/(Isc − In), restarting tips (largest motor or sum > Pn/3). Reproduced: Fig N6 (500 kVA, x'd 30 %: 2.4 kA vs the guide's 2.5 kA; insulation fault 3.2 kA vs 3 kA) and the two restart examples (55 % and 10 %). UPS: Sr = 1.17·Pn, overload 1.5 In / 1 min and 1.25 In / 10 min, Fig N9 currents, Sg = Sr·x''d/U'Rcc with the two points of the chart (4 % without filter, 12 % with filter: 1316 kVA vs the guide's "≈ 1400", 439 kVA vs "≈ 500"), battery energy with the 20 % ageing margin of NFPA 72 A.10.6.7.2.1.1. 🔴 The generator rating series, the 10 % / 20 % voltage-dip classes (derived from the guide's examples), the motor η·cosφ = 0.8 (reproduces 45 kW ↔ 81 A), the inverter efficiency 0.95 and the design margin are not code values.
- **spd** — SBC 401 44-3.3 (need: overhead line with keraunic level > 25 days, or risk assessment levels a–c always / d, e when d > dc = 1/Ng, 2/Ng, Ng = 0.1·Td; conventional length d = d1 + d2/Kg + d3/Kt, at most 1 km, Annex C.44 — Kg = Kt = 4 is read from the text "K g 4 … K t 4" and agrees with IEC 60364-4-44) and 53-4.2 (Up per category II = 2.5 kV at 230/400 V, Table 53-3 Uc, Table 53-2 connection types 1 and 2, In ≥ 5 kA, Iimp ≥ 12.5 kA, N–PE of type 2: 20 / 10 kA and 50 / 25 kA, follow current ≥ 100 A, leads ≤ 0.5 m, PE 4 mm² / 16 mm², RCD immunity 3 kA); Schneider chapter J: Fig J21 arrangement, J31 Iimp (25 / 18.75 / 12.5 kA), J32 Imax (20 / 40 / 65 kA by exposure), ΔU ≈ 1000 V per metre. Table 44-3 for 120–240 V is taken from Fig J25. IEC 62305-2 is not in the library, so the protection level is an input.
- **neutral** — NEC 220.61: maximum unbalance, 70 % of the range / dryer part and of the part above 200 A, none for nonlinear loads or a 3-wire circuit of a 4-wire wye; size from Table 310.16 (75 °C). SBC 401 52-4.2: equal to the line for single-phase two-conductor circuits, up to 16 mm² Cu / 25 mm² Al, and harmonics 15–33 %; 1.45·I_B above 33 %; reduced (≥ 50 %, ≥ 16 / 25 mm²) only when balanced, protected and harmonics ≤ 15 %; Schneider G7 I_N = 3·I_H3 (≤ √3 × line). Not covered: the 140 % two-phase exception as an input.
- **conduitfill** — NEC Chapter 9 Table 1 Note 9: a multiconductor cable counts as one conductor of area π/4·OD² (the major diameter if elliptical); Note 7 does not apply to cables.
### Heating — heating load and boiler (`heatingload`)
- Syrian Arab Code (HVAC) §3/10/1: Q1 = ΣU·A·Δt, Q2 = 0.342·V·Δt with air changes of Table 15/3, +15 % (10–20 %), hot water Q3 = 1.1641·V·Δt, boiler Q_b = Q_T·(1 + a + b) with a = 0.1, b = 0.2, burner Q_b/(Cv·η) with Cv = 11.6 kW/kg, annual fuel 0.75·Q_H·N·F·C·24/(Cv·η) (N = 150 d, F = 0.33–1, C = 0.6). Indoor winter temperatures of Table 2/3 and city design temperatures of Table 1/3 (Syria mode).
- The extracted formula text of the expansion-tank volume (V = 0.025·Q ÷ Δt?) is ambiguous, so it is not used (the thermal expansion calculator already covers it).
- Default U values are the office assemblies of the U-value calculator and the SBC glazing limit; the temperature-difference factor for unheated neighbours is the designer's decision (not in the code).
### Quotations — BOQ and printable offer (`quotations` section)
Sections → items (description, unit, quantity, unit price), totals with discount and VAT, saved in the browser, JSON and CSV export/import, printable bilingual offer. Optional build-up pricing follows the office sheets (Valves / Equip.: after-discount cost × accessories 15 %, transportation 4 %, installation 10 %, engineering, overhead — percentages are editable defaults, not code values). No code basis applies; no company branding of third-party offers is reproduced.
### Mobile
- The project-information bar was clipped at 200 px (hidden fields on phones): now 640 px and two columns below 420 px. Forms are single-column below 420 px.
### Lighting (`lightingcalc`) vs SBC
- The old note "SBC 401: offices ≤ 10–12 W/m², retail ≤ 16, hospitals ≤ 11" was **wrong/unsourced**: power densities are in **SBC 601-18 (Energy Conservation Code) Chapter 9**, not in SBC 401 (the electrical code). Replaced by the real tables: **Table 9.3** (space-by-space, per-row allowance for 28 space types — values checked against the text) and **Table 9.2** (building-area method, 33 building types — all 33 values machine-checked, 0 differences). Compliance is on the total installed power vs the allowance (trade-offs allowed, §9.5.1(d) / §9.6.1(d)).
- Not computed: room-cavity-ratio +20 % (§9.6.4), additional allowances for display / retail lighting (§9.6.2) and non-mandatory controls (§9.6.3), exterior lighting (Table 9.1B).
- Emergency / egress illumination shown as notes: SBC 201 §1008.2.1 (11 lux normal), §1008.3.5 (11 lux avg / 1 lux min, 6 / 0.6 lux at end of 90 min, 40:1); SBC 401 lift machine room 200 lux, control panel 100 lux, car 50 lux.
- 🔴 The recommended illuminance (lux) per space (IES / CIBSE) is **not in the local library** — values kept as editable defaults and flagged in the UI. SBC 401 itself says minimum illuminance values "can be given by each Saudi regulation".
### Heating network (`heatingpipes`, `radiators`, `floorheating`) — Syrian Arab Code
- **heatingpipes** — §3/10/5: closed-circuit velocity limits (Table 31/3: ≤ 50 mm → 1.2 m/s; > 50 mm → velocity at 400 Pa/m friction) and erosion limit by operating hours (Table 33/3: 1500 h 4.6 · 2000 h 4.4 · 3000 h 4.0 · 4000 h 3.7 · 6000 h 3.0 m/s, next-higher-hours row used). Friction by Darcy–Weisbach (Swamee–Jain) for steel schedule 40 (k = 0.045 mm) at the real water temperature instead of the code's 20 °C charts (Figures 2/3–4/3 are images). Pump per §7/33: motor ≥ duty-point power + 20 %, shut-off head ≈ +15 %, hot-water pump ≥ 110 °C, strainer / valves. 🔴 Fitting allowance (% of straight length), the extra boiler/valve resistance and the motor-size series are designer inputs / common ratings, not code values.
- **radiators** — §7/29 only requires manufacturer-certified output per DIN 4704 and gives no formula. The element count uses the usual catalog correction Q = Q₀(ΔT/ΔT₀)ⁿ (n = 1.3, EN 442 log-mean ΔT) — 🔴 not in the local library, flagged in the UI.
- **floorheating** — §7/40: PEX 16 × 2 mm, loops ≤ 110 m, supply after the mixing valve ≤ 50 °C (both checked); spacing, W/m² and surface temperature are not in the code (designer inputs). 🔴 PEX roughness 0.007 mm is a common value.
- **Link from the heating-load calculator** — the «إرسال حمل الغرف» buttons on the heating-load results hand every room (name, indoor temperature, area and load **with the safety factor**, W) to `radiators` (fills the table, indoor temperature per row), `floorheating` (room picker fills area and load) or `heatingpipes` (pump-served load and the main row = whole-building heating load with the safety factor, DHW excluded; the critical-radiator connection row = the biggest room, changeable with a room picker; branch sections stay a designer input because they depend on the drawings, lengths and fitting % keep their defaults). What was sent is auto-imported only by the calculator it was sent to. The snapshot is kept in `localStorage` (`si_heat_rooms`, in-memory fallback) so it survives leaving the screen; reopening the radiators calculator later keeps the defaults and offers an import button. No new coefficients — only data transfer (tests/heatingnet.js).
### Heating extras (`heatexpansion`, `chimney`, `fueltank`, `airheating`) — Syrian Arab Code
- **heatexpansion** — §3/10/1 (4): V = 0.025·Q/Δt (V m³, Q boiler kW, Δt supply–return K). The text extraction scrambled the fraction; the PDF glyph positions (numerator `0.025 Q`, denominator `Δt`, baseline `V =`) show it is a fraction. Open tank components (§7/43/1) and closed tank components (§7/43/2) are listed; the code gives no closed-vessel sizing, pre-charge pressure or diaphragm size (manufacturer data). The plumbing `expansiontank` stays DHW-only.
- **chimney** — §7/39 and §7/20/7. The code says dimensions are calculated per DIN 4705 (not in the local library), so this is a **compliance check, not a sizing**: connector ≥ flue-outlet diameter; plate ≥ 3 mm; connector length ≤ 25 % of chimney height; upward slope ≥ 0.05 (§7/20/7); bend radius ≥ 2 × connector diameter (or largest side); insulation (§7/39 a says ≥ 20 mm in the boiler room, §7/20/7 says ≥ 25 mm — the stricter 25 mm is checked); chimney inner area ≥ boiler smoke-outlet area; top ≥ 2.5 m above the highest roof point; steel chimney rock wool ≥ 50 mm; draft stabilizer when more than one boiler; CO₂ ≤ 12 % at boiler calibration. Brick/steel construction rules are shown as notes.
- **fueltank** — §7/35 (main, unburied/buried) and §7/36 (day tank) give only equipment and installation rules, no capacity formula. Consumption uses the code's own relations (burner kg/h = Q_b/(C_v·η); annual = 0.75·Q_H·N·F·C·24/(C_v·η), identical to the heating-load calculator — tested), average day = annual/N. 🔴 Storage days (15), diesel density (0.85 kg/L) and day-tank hours (8) are designer inputs, not code values; the daily figure is a season average, not the design peak.
- **airheating** — §4/2/2/1/3 (three methods: all fresh, all return, mixed) with Q = 0.342·V·Δt (§3/10/1): supply air V = Q/(0.342·(t_s − t_i)); coil = room load + 0.342·V_oa·(t_i − t_o) (the code requires the outside-air heat to be added to the load); coil water flow at the chosen supply/return. 🔴 Supply-air temperature (45 °C) and unit count are designer inputs.
- Links: all four read from the heating-load snapshot (`boiler` block: Q_H, Q_b, C_v, η, N, F, C; rooms now carry the volume). The new heating-load send buttons feed `heatexpansion`, `fueltank` and `airheating`; the chimney check needs boiler data that no calculator produces, so it has no link. Clause letters in the on-screen references are Latin (a, b-1, b-2) so they need no translation.
- Not done: air-handling-unit coil selection, steam systems, solar air collectors (descriptive only in the code), DIN 4705 chimney sizing (standard not in the library).

## Electrical, part 6: phase balance (`phasebal`)

- **Basis:** NEC 2008 210.11(B) (load evenly proportioned among the multioutlet branch circuits of a panelboard); Atkinson, *Electrical Installation Designs* 6.9, 8.17, 12.16 (balance the diversified current per phase, Tables 8.2 and 12.2); SBC 401 52-3.6.2 (an unbalanced multicore circuit is chosen for its largest phase current, so that value is what the hand-off sends to the cable-sizing calculator).
- **Calculation:** phase totals (fixed rows, balanced three-phase rows added to all three phases, "automatic" rows placed largest-first on the lightest phase and then improved by moves/swaps that lower the variance), average, unbalance = largest deviation from the average / average, neutral current = sqrt(Ia²+Ib²+Ic²-IaIb-IbIc-IcIa) (linear loads, one power factor, 120° phasors).
- **Verified against:** Atkinson Table 12.2 (155.2 / 153.2 / 138.8 A -> unbalance 6.89 %, neutral 15.50 A); automatic distribution of the same circuits is not worse than the book; equal loads, single-phase and three-phase edge cases (tests/electrical6.js).
- 🔴 **No code value:** neither NEC nor SBC 401 gives a percentage limit for phase unbalance. The "target" field (default 10 %) is a design input, labelled as such in the UI. Harmonic neutral current is not included (see `neutral`).


## National codes, part 2: UAE (Dubai Building Code 2021) and Jordan

Selector now has six entries (international, Saudi, Egypt, Syria, UAE, Jordan). Texts extracted to `standars_text\UAE-*.txt` and `JO-*.txt`; Jordanian tables whose numbers are images were read from rendered pages.

| Code | Source | Used in | Notes |
|---|---|---|---|
| UAE | DBC 2021 H.4.6 Tables H.1 / H.2 | cooling load (detailed): outdoor 46 °C DB / 29 °C WB -> 18.35 g/kg (psychrometric equation, sea level); indoor 24 °C / 50 % | safety factors <= 10 % sensible, <= 5 % latent (H.4.6.3) and the 34/32 °C treated-outdoor-air condition (H.4.6.4) are shown in the note only |
| UAE | DBC E.5.2.3 Tables E.4 - E.7 | U-value compliance list: roof 0.3, wall / exposed floor 0.57, glazing 2.1 / 1.9 / 1.7, shopfront 1.9, skylight 1.9 W/m²K | shading coefficient and light transmittance are not checked |
| UAE | DBC G.4.7.3, G.4.7.2, Table G.3 | cable sizing: IEC reference by default, voltage drop 4 % (no length allowance), ambient 48 °C; note quotes ground 40 °C, soil 2.0 K·m/W at 0.9 m, minimum 2.5 mm² lighting / 4 mm² sockets | current ratings still come from the SBC 401 / IEC tables (DBC refers to BS standards, tables not digitised) |
| UAE | DBC H.4.10.2 | ventilation: ASHRAE 62.1 / 62.2 / 170 (no local list) | |
| Jordan | Thermal Insulation Code, Appendix A (Tables A1 - A6) | cooling load: 4 climate zones, summer design 31 / 38 / 32 / 36 °C, design RH range 49-60 / 36-42 / 36-42 / 30-34 % (the maximum is used for the humidity ratio, sea-level pressure); heating load: winter design 6 / 10 / 5 / 3 °C | 🔴 selecting the maximum summer RH is a choice (the code gives a range); zone altitude is not corrected |
| Jordan | Thermal Insulation Code Tables 1 - 3 | U-value compliance list: roof / exposed floor 1.0 (cat. 1) / 2.7 (cat. 2); wall 1.8 / 2.7; doors 3.5 / 7.0 / 5.8; windows by frame, glazing and exposure (2.3 - 6.7) | category 1 = 100 m² or more or any centrally heated / air-conditioned building |
| Jordan | Mechanical Ventilation Code Table 1 | cooling load indoor presets (summer columns) | 🔴 the table is a merged-cell layout read from the page image: the RH given on the first row of a block (45-50 % for houses ... offices) is applied to the whole block |
| Jordan | Mechanical Ventilation Code Table 2 | ventilation list: ten rows that give one value (factories 0.8, offices 1.3, hotel bedrooms 1.7, corridors 1.3, home kitchens 10, restaurant kitchens 20, toilets 10 L/s per m²; laboratories 8 and luxury homes 12 L/s per person) | the code takes the larger of the per-person and per-m² values, the app adds them, so only single-value rows are offered; the store row (8/5 per person and 3.0 per m²) is left out |
| Jordan | Electrical Installations Code 4/5/6 (page 97) | cable sizing: IEC reference by default, voltage drop 2.5 % at full current | the Jordanian current-rating tables (16 - 61) are not digitised; IEC tables are used and the note says so |

Not used yet (extracted, available): Dubai G.4.10 load balancing, G.4.16 maximum demand (Tables G.11 - G.16), G.4.19 earthing, G.4.20 power factor, H.5 water, H.6 drainage, H.7 lighting, H.9 fire; Jordanian central heating, drainage, water supply, interior lighting, lifts, fire protection, fire alarm, lightning, earthing codes.


## National codes, part 3: Dubai maximum demand and Jordanian water / drainage

| Code | Source | Used in | Notes |
|---|---|---|---|
| UAE | DBC 2021 G.4.16.1 / G.4.16.2, Tables G.15, G.16, G.4.20.1, G.4.16.1 a) | `maxdemand`, third method "كود دبي": assumed loads per point (lighting / fan 100 W, fluorescent 1.8 x lamp wattage, 13 A socket point at least 200 W with a twin socket = 2 points, 15 A general socket 500 W residential / 1000 W commercial-industrial, actual load of fixed equipment, standby / spare / future loads), TCL, demand factor, maximum demand and current, feeder or transformer limit of Table G.15 (60 A 30 kW, 100 A 50, 125 A 60, 160 A 80, 200 A 100, 300 A 150, 400 A 200, 1000 kVA 800, 1500 kVA 1200), motor / air-conditioning limit of Table G.16 (1000 kVA 650 kW, 1500 kVA 950 kW), circuit counts (lighting <= 2000 W per circuit, radial 5 sockets / 20 A, ring 10 sockets / 30 A) | selected by default when the UAE code is chosen; cos phi default 0.95 is the value recommended by G.4.20.1; 🔴 the demand factor has no code value (set by a qualified engineer and approved by DEWA), default 1; the 5 VA exclusion is quoted, not applied |
| Jordan | Water Supply Code Tables 2, 3 and §3/3/3 a) | plumbing `fixtureunits` result note: minimum flow and pressure per fixture (pressure 0.20 bar minimum, 1.0 bar maximum except special cases), minimum supply pipe sizes, simultaneous fixtures N = sqrt(n - 1) + 1; `booster` note: pressure limits | values read from the rendered page images; the app's own IPC / SBC values are not replaced |
| Jordan | Sanitary Drainage Code Tables 1, 4, 5, 6 | `fixtureunits` note: fixture units by fixture (e.g. WC 4 private / 6 public, basin 1, bathtub 2, shower 2), maximum units per pipe (stacks 100 mm 256 ... 300 mm 8400; horizontal 100 mm 216 ... 300 mm 8200), minimum horizontal slope 2 % up to 150 mm and 1:60 / 1:90 / 1:120 above, cleanout sizes | 🔴 Table 4 row assignment (stacks / horizontal) was inferred from the values equalling the IPC tables; the Jordanian fixture units differ from IPC for WCs (4 / 6 vs 3 / 4) and urinals (2 vs 4), so the calculator keeps its IPC / SBC basis and the Jordanian values are shown for comparison |

Not done yet: Jordanian Table 1 of the water code (minimum storage by occupancy), hot-water Tables 7 - 9, pipe-sizing Tables 4 - 6 (equivalent units / lengths), drainage Tables 2, 3, 7 - 13 (rainwater roof areas, grease interceptors, manholes), and the other Jordanian codes (lighting, lifts, fire, alarm, lightning, earthing, heating).


## National codes, part 4: lighting, lifts and fire (Jordan; Dubai H.7)

| Code | Source | Used in | Notes |
|---|---|---|---|
| Jordan | Interior Lighting Code Table 4 (standard service illuminance = average over the maintenance cycle) | `lightingcalc`: the lux of 13 space types is filled from the code: general office 500, deep-plan / open office 750, meeting room 750, retail 500, classroom (examination / lecture hall) 500, kitchen work areas 500, home bathroom 100, living room 50, bedroom 50 (150 at the bedhead), home stairs 100, hotel entrance hall 75, place of worship 150 | values read from the page images (Table 4, pages 58-70); 🔴 the other space types keep the reference values; open-plan = deep-plan office, hotel bedroom = home bedroom (the code refers to the homes rows), mosque = place of worship; hospital rows were not used (the row groups of Table 4 (d) were ambiguous in the images); the code has no lighting power density |
| UAE | DBC H.7.2 Table H.15, H.7.4, H.7.6 | `lightingcalc`: building-area LPD list (7.5 / 7.8 / 8.9 / 9.8 / 4.9 / 6.9 W/m²) replaces the SBC list; note with egress lighting (stairs >= 108 lux, floors >= 10.8 lux), controls, working-plane 400 - 500 lux | illuminance follows BS EN 12464-1 / ISO 8995-1 (not in the library): lux values stay 🔴 |
| Jordan | Lifts Code Table 6 | `elevatorfeeder`: diversity factor 1 and 2 lifts 1.0, 3 lifts 0.9, 4 lifts 0.8; more than 4 lifts: no reduction (the code asks to consult the lift contractor) | the conductor is still chosen from NEC 310.16; Table 2 (speed against travel) and the traffic tables were not transcribed |
| Jordan | Fire Alarm Systems Code 2/10/3 | `alarmbattery`: a Jordanian type (24 h standby then 30 min of alarm) selected by default | the code gives no battery margin: the NFPA 72 minimum 20 % stays (🔴); the charging time and the generator case were not read |
| Jordan | Water Supply Code chapter 5, Tables 10, 13, 14, 17 | `sprinkler` result note (also added the existing Saudi SBC 801 note, which was not reaching this calculator): low / ordinary / high hazard residual pressure 1.00 bar, flow 1890 - 2830 / 2650 - 3780 L/min, duration 30-60 / 60-90 / 60-120 min; K 45-50 / 75-85 / 110-120; maximum sprinklers per pipe size for steel and copper | the tool still sizes by NFPA 13 |

Not done: the Jordanian fire-protection code (exits and fire resistance, Tables 1 - 19), Jordanian hot-water / pipe-sizing / storage tables, rainwater and grease tables, lifts Tables 2 - 5 and 9 - 15, lightning and earthing codes, central heating.


## National codes, part 5: Jordanian lightning, central heating and fire protection

| Source | Used in | Notes |
|---|---|---|
| Lightning Protection Code §2/2, Tables 1 - 7 (risk index method) | `lightning` (Jordan): seven index values A - G are added; 40 or more requires a protection system, a sum noticeably below 40 does not (unless other considerations require it); a brick or concrete chimney 4.5 m or more above the adjoining roof is protected regardless. A: 2 / 4 / 6 / 7 / 8 / 10; B: 1 / 2 / 4 / 5 / 7 / 8 / 10; C: 2 / 5 / 6 / 8 / 10; D: 2 / 5 / 10; E: 2 / 6 / 8 / 10; F by height up to 9 / 15 / 18 / 24 / 30 / 38 / 46 / 53 m: 2 / 4 / 5 / 8 / 11 / 16 / 22 / 30; G by thunderstorm days up to 3 / 6 / 12 / 15 / 18 / 21 / above: 2 / 5 / 11 / 14 / 17 / 20 / 21 | 🔴 Table 7 prints no band for more than 6 up to 9 days: the next band (11) is used with a warning; above 53 m the largest index (30) is used with a warning; the threshold is "significantly below 40": the tool reports the sum against 40 only |
| Lightning Protection Code §3/2/3, Tables 8 - 10, §3/2/5 | note under the risk-index result: tape 3 x 20 mm or rod 10 mm for air terminals and down conductors, bonds external as the same / internal 1.5 x 20 mm tape or 6.5 mm rod, down conductors one up to 100 m² else min(1 + 1 per 300 m² above the first 100 m², 1 per 30 m of perimeter) (computed from the roof fields), each earth terminal <= 10 ohm x number of terminals and the whole system <= 10 ohm, 18 m between horizontal conductors on large roofs | the stranded-conductor sizes of Tables 8 and 10 were not used (printed as 19/1180 and 416/0.46, unclear) |
| Central Heating Code Table 1 | `heatingload`: ten indoor presets (classrooms 18-20 C, assembly halls 17-19, gymnasiums 14-16, hotel bedrooms 22, homes 19-21, shops 18-20, public buildings 18-20, factories 16-18, places of worship 18, offices 19-21; the air changes per hour range is in the label) | the preset sets the middle of the code's range; hospital, kitchen and other rows were not used (the row alignment in the page image was uncertain); the six last rows were cross-checked against the winter columns of the mechanical-ventilation code Table 1 |
| Central Heating Code Table 2 | note: height additions to the heat loss (4.2 m 2 % / 3 % up to 11 m 24 % / 36 %, radiators with sections / fan heaters) | not applied automatically; the ceiling panel radiator column was left out (11 values for 12 heights) |
| Central Heating Code Table 5, §5/3/3 | `heatingpipes` / `radiators`: 82 C maximum entering water, flow-return difference 10 K at the boiler, 8 K at radiators (7 K finned / heating units): defaults 82 / 72 C (pipes) and 82 / 74 C (radiators) | |
| Central Heating Code Table 7 | `heatingpipes`: maximum water velocity by nominal diameter (15 mm 0.3657 ... 150 mm 1.7068 m/s) replaces the Syrian 1.2 m/s / 400 Pa/m rule; pumped circulation pressure loss at most 0.15 m of water per 10 m; elbows at 2/3 of the value in quiet buildings (note) | 🔴 no limit above 150 mm: the 150 mm value is kept; Table 8 (heat emission of bare steel pipes) was not used |
| Fire Protection Code §5/2, Table 1 | `ventilation` note: occupant load factors in m² per person (dense assembly 0.6 net, less dense 1.1, standing 0.3; classrooms 1.5, workshops 4.0, nurseries 3.0; sleeping wards 8 gross, treatment 15; apartments 18, hotels 18, dormitories 10, motels 15; shops 3 ground floor / 5 upper; offices 9; industrial 9; storage 25; car parks 2 persons per public space, 1 per private); exit width units 100 persons (level routes, ramps class A) / 60 (stairs) | not used in a calculation; the app's ventilation calculator keeps ASHRAE 62.1 densities |

Not done: the rest of the Jordanian Fire Protection Code (occupancy classification, exits, travel distance, fire resistance Tables 2 - 19), Jordanian earthing code, hot-water / pipe-sizing / storage / rainwater / grease tables of the water and drainage codes, Table 8 of the heating code, lifts Tables 2 - 5 and 9 - 15. (Part 6 below covers the earthing code, hot water and lifts Tables 2 - 4, 16, 17.)

## National codes, part 6: Jordanian earthing, hot water and lifts

| Source | Used in | Notes |
|---|---|---|
| Earthing Code 2/3/1 - 2/3/3, Tables 2 - 5 (k values) | `protcond` (new "Jordanian earthing code" option, default for Jordan): S = sqrt(I²t) / k for t <= 5 s. Table 2 (insulated, not in a cable or touching the sheath; PVC / rubber / thermosetting): copper 143 / 166 / 176, aluminium 95 / 110 / 116, steel 52 / 60 / 64 (30 C to 160 / 220 / 250 C); Table 3 (core of a cable, 70 / 85 / 90 C start): copper 115 / 134 / 143, aluminium 76 / 89 / 94; Table 4 (sheath or armour, 60 / 75 / 80 C start): steel 44 / 44 / 54, aluminium 81 / 93 / 98, lead 22 / 26 / 27; Table 5 (bare, 30 C start; visible 500 / 300 / 500 C, normal 200, fire hazard 150): copper 228 / 159 / 138, aluminium 125 / 105 / 91, steel 82 / 58 / 50 | values read from the page images; the Table 4 steel PVC / rubber values (44, 44) are as printed |
| Earthing Code Tables 6 and 7, 2/3/1 (a), 2/4 | same: Table 6 smallest protective conductor from the largest phase conductor (S <= 16: S/2; 25 - 50: 16; 70 - 150: 50; 185 - 630: 70 mm²); Table 7 earthing lead / earth continuity conductor / bonding lead by phase size; minimum 2.5 mm² mechanically protected, 4 mm² otherwise when not part of a cable; main bonding at least half the earthing conductor and 6 mm²; Table 1 buried earthing conductor (16 mm² copper mechanically unprotected, 25 mm² copper not protected against corrosion); supplementary bonding 2.5 / 4 mm² | 🔴 Table 6 prints S/2 for S <= 16 (IEC 54-2 has S): the printed rule is used; between the printed bands (16 - 25, 50 - 70, 150 - 185) the upper band is taken; the 1.5 mm² (unsheathed) and 6 mm² (entry points) footnotes of Table 7 are quoted, not applied |
| Earthing Code Tables 8 - 11, 3/2/5 | `earthelectrode` (Jordan): Table 8 soils (marsh 30, loam / clay / arable 100, wet sand 200, dry gravel 500, dry sand 1000, stony 3000 ohm.m), Table 9 (strip 10 / 25 / 50 / 100 m: 20 / 10 / 5 / 3; rod 1 / 2 / 3 / 5 m: 70 / 40 / 30 / 20; plate 0.5 x 1 m 35, 1 x 1 m 25 ohm at 100 ohm.m, scaled by rho / 100), Table 10 minimum sizes, Table 11 formulas (IEEE Std 142: rod R = rho/(2 pi L)(ln 4L/a - 1); horizontal wire of length 2L at depth s/2; ring R = rho/(2 pi² D)(ln 8D/d + ln 4D/s)), strips 0.5 - 1 m deep, rods at least 2L apart, plates 3 m apart with the top edge 1 m deep | 🔴 Table 9 prints "2" for the 5 m rod: 20 is used (the formula gives 19.5); the two-rod and plate formulas of Table 11 were not used (the two-rod series is only valid for s < L, the plate rows are both labelled vertical); no maximum resistance is printed in the code: the existing targets (TT, NEC, lightning, custom) stay; a strip is entered by an equivalent diameter (the code gives none); n rods use R1/n (no mutual effect) |
| Earthing Code chapter 4 (Tables 12 - 16, fault-loop impedance) | not used | BS 88 / BS 1361 fuse-specific values and Table 16 units unclear; the app's fault-loop calculator stays IEC-based |
| Water Supply Code chapter 4 (4/2/1 - 4/2/5, Tables 7 - 9) | `heater` and `dhwrecirc` notes (Jordan): minimum storage 45 L per person per day and 135 L per dwelling unit (checked in the heater when persons / units are entered), flow rates at outlets (bath 0.40, sink 0.25, basin 0.15, spray head 0.15, 100 mm rose 0.30 L/s), stored water <= 65 C, outlet temperatures (bath 48 - 60, shower 43, basins 43 - 60, kitchen sink 60 C), pipe sizes (cold feed >= 25 mm, return >= 15 mm, boiler pipes >= 25 mm, vent >= 20 mm and 0.50 m above the overflow), dead legs 3 m (<= 20 mm) / 2 m (>= 25 mm) | the code gives no heat-loss or circulation rate: the calculations are unchanged |
| Lifts Code 2/2 (b) - (f), Tables 2 - 4 | new calculator `liftplan` (71st): population = floors above ground x net area per floor / m² per person (10 in general offices), handling capacity in 5 minutes = population x 10 - 25 % (12 % different start times, 17 % the same), travel = ground-to-first + (floors - 2) x typical height, Table 2 recommended maximum travel by speed and building type, Tables 3 and 4 interval and handling capacity for 6 - 18 floors (2 - 6 cars, 1.0 - 3.5 m/s, 630 - 1600 kg), interval rating (offices <= 30 s excellent, <= 45 acceptable, >= 60 unacceptable; apartments 90 - 100 s acceptable), basement served: capacity x 0.8 and interval x 1.2, office service guide (one lift per 3 / 4 / 5 floors); both worked examples of the code (3 x 1000 kg at 1.6 m/s, 33 s, 93 persons; 6 x 1600 kg at 3.5 m/s, 25 s, 195 persons) are reproduced by the tests | 🔴 two printed intervals contradict their own capacities (capacity = 300 x 0.8 x persons / interval): 10 floors, 3 cars, 1.6 m/s, 1250 kg prints 83 s for 97 persons (about 40 s) and 7 floors, 3 cars, 1.6 m/s, 1000 kg prints 25 s for 107 persons (about 29 s): both intervals are left out; the Table 2 intensive speed prints 0.25 (Table 12 says 2.5): 2.5 is used; the first light-duty row at 1.00 m/s appears twice (20 / 20 and 35 / 30): both kept; the bed-lift row prints 45 m at 1.00 and 40 m at 1.60: as printed |
| Lifts Code Tables 16 and 17 | `liftplan`: landing depth (residential: Cd single, 1500 mm or the larger Cd in a group; other: 1.5 Cd single, 2400 mm or 1.5 Cd side by side, sum of the two largest Cd facing and at most 4500 mm; bed lifts: 1.5 Cd, facing sum), common machine room: area Ra + 0.9 Ra (N - 1), width Rw + (N - 1)(Ww + 200) (side by side) or half the second term (facing), depth Rd or 2 Wd + distance between shafts, N rounded up to even | the Ra, Rw, Rd, Ww, Wd inputs come from Tables 9 - 15 |

Not done: lifts Tables 9 - 15 (car, shaft, pit, headroom and machine room dimensions): the table images in the PDF are about 540 x 345 px bitmaps and several digits (4400 / 4600, 3700 / 3100, 4900 / 4000) cannot be told apart, so no value was transcribed; Table 5 (power systems) of the lifts code; the rest of the Jordanian Fire Protection Code; Table 1 (storage), Tables 4 - 6 (pipe sizing) of the water code; drainage Tables 2, 3, 7 - 13; Table 8 of the heating code; earthing code chapters 4 - 5 (loop impedance and measurement); Dubai G.4.10 / G.4.19 / H.5 / H.6 / H.9.

## National codes, part 7: Jordanian water storage, rainwater, grease and loading units

| Source | Used in | Notes |
|---|---|---|
| Water Supply Code 3/2/2, Table 1 | `waterconsumption` (Jordan): 11 inputs, minimum one-day storage = quantity x litres (dwelling 1000 L, hotel 135 L per bed, hostel / motel / pension 90, restaurant 7 L per meal, hospital 600 L per bed, boarding school 90 L per bed, day school 30 L per seat, cinema / theatre 10 L per seat, offices 3 L per m² of roof area or 30 L per person, mosque 10 L per person); the required minimum is the larger of Table 1 and the daily consumption of the MEWA rows; compared with roof + ground tank volumes of the tool | the tool's own ground-tank rule (days x roof tank) is unchanged (an office practice, 🔴 in the tool); the code gives no storage days |
| Water Supply Code 3/2/3 | note under `waterconsumption`: tightness, vents (total diameter = total draw-off diameters, at most 50 mm), float valve axis at least 100 mm below the overflow edge, gate valve on the feed, stop valve at each outlet, ground tank 3 m from absorption pits in all directions, 15 m from absorption fields, 2 m from drains | |
| Water Supply Code 3/4, Tables 4, 5, 6 | note under `fixtureunits`: loading units per fixture (private / public: bath 2 / 4, basin 1 / 2, shower 2 / 4, WC cistern 3 / 5, WC flush valve 6 / 10, ...), Table 5 by pipe size, Table 6 equivalent lengths of elbows, tees, gate / globe / angle valves for 15 - 150 mm, pressure loss P_L = P_w - (P_s + P_r), static head 9.8 x 10³ N/m² per m | 🔴 the tee (90) value for 15 mm prints as "9.0": 0.9 is used (the row rises 0.9, 1.2, 1.5 ...); the flow-versus-loading-unit curves (Fig. 3 a, b) and the pipe-sizing charts (Figs. 4 - 6) are graphs and were not digitised, so the loading-unit method is not a calculation |
| Sanitary Drainage Code 7/2 - 7/5, Tables 10 - 13 | `raindrain` (Jordan): default rainfall 50 mm/h (1.97 in/h) for flat roofs, 75 mm/h for sloped; note: slopes 1 % (0.5 % exceptionally), Table 10 (50 mm 100 m², 75 mm 150 m², 100 mm 200 m², at least 2 outlets), Tables 11 and 12 gutters (75 - 150 mm; true / nominal half-round, aluminium or cast-iron ogee, steel ogee), Table 13 outlet sizes by outlet-edge angle, rain pipes equal to the outlets, none needed under 6 m² | the three rows of Table 10 are read across a page break; Table 13 prints no end-outlet value for the 150 mm obtuse row ("-"); the IPC-based calculation is unchanged |
| Sanitary Drainage Code 4/5, Table 9 | note under `grease`: unit flow between 1.3 and 3.5 L/s, at most 4 fixtures per unit, minimum flow 1.26 / 1.58 / 2.21 / 3.15 L/s for 1 - 4 fixtures (50 % when the inlet is more than 1.2 m below any fixture outlet), flow-control device and own trap and vent per fixture, water seal at least 50 mm | the PDI-G101 calculation is unchanged |

Not done: drainage Tables 2, 3 (pipe-size flows), 7 (distances of septic tanks and absorption pits: the numbers are missing from the text and were not read), 8 (inspection chambers); water Tables 2 - 3 are in part 3; the fire code (egress): chapter 5 general rules and Table 5 (maximum exit-path length and dead end by occupancy, readable) are known but each occupancy chapter (8 - 15) has its own exit unit capacity (assembly 100 / 75 persons per unit) and minimum number of exits in text with lost numbers, so an egress calculator needs those pages read first.

## National codes, part 8: Jordanian fire protection code, means of egress

| Source | Used in | Notes |
|---|---|---|
| Fire Protection Code 5/2/1, 5/2/2, Table 1 | new calculator `egress` (72nd, in the fire category): occupant load = area / factor (assembly dense 0.6, less dense 1.1, standing 0.3 net; classrooms 1.5, workshops 4.0, nurseries 3.0 net; sleeping wards 8, treatment 15 gross; apartments 18, hotels 18, dormitories 10, lodging houses 15; shops 3 ground / 5 upper; offices 9; industrial 9; storage 25; car parks 2 persons per public space, 1 per private); exit width unit 0.55 m, fraction below 0.5 dropped and from 0.5 counted as half a unit | the mezzanine rule of the Table 1 note is quoted, not applied |
| Fire Protection Code 5/2/3 and chapters 8, 10, 11, 12, 13 (exit unit capacity) | `egress`: persons per unit for doors / horizontal exits and ramps A / stairs: general 100 / 60, assembly 100 / 75, residential 100 / 75, health care 30 / 22, commercial 100 / 60, business 100 / 60; required width if all by doors or all by stairs, capacity of the exits entered | 🔴 chapter 13 prints the door capacity as 1000 (typo): 100 is used; health care does not give a figure for doors: the horizontal-exit value 30 is used; educational, industrial and storage chapters refer to the general rule; the extra 1.5 units for stairs discharging at the exit floor are quoted, not applied |
| Fire Protection Code 5/4, 5/5, chapters 8 - 15 (number of exits) | `egress`: assembly category from the occupant load (A over 1000: 4 exits, B 601 - 1000: 3 exits of at least two units each, C 301 - 600 and D 50 - 300: 2); other occupancies at least 2 separated exits per floor; single-exit exemptions tested: business room up to 100 persons with a 30 m path (13/2/4 b), industrial room up to 25 persons with a 15 m path (14/2/4 b), storage room up to 10 persons and 900 m² (15/2/4 b) | 🔴 the number of persons or area above which educational rooms need two doors (9/2/4 b) is unreadable (font boxes in the PDF): not applied; commercial class C single exit within 15 m (12/2/4 b) and residential street-level exemption (11/1/6 d) are quoted only |
| Fire Protection Code 5/6, Table 5 | `egress`: maximum exit path (non-sprinklered / sprinklered) and dead end: assembly 45 / 60 and 6, educational 45 / 60 and 6, health care and correctional 30 / 45 and 9, hotels 30 / 45 and 12, apartments 35 / 50, dormitories 30 / 45, commercial and covered markets 30 / 45 and 15, business 60 / 90 and 15, industrial general or special 30 / 45 and 15, industrial high hazard 25 / 30, storage ordinary hazard 60 / 120, storage high hazard 25 / 30, open car parks 60 / 90 and 15, enclosed car parks 45 / 60 and 15; escape-path width at least the exit width and 0.7 m (5/2/4) | 🔴 the dead-end cells of apartments ("06"), dormitories ("00") and the high-hazard rows ("00") are garbled in the print: no limit is applied to them; storage low hazard has no printed limit; lodging houses are not in Table 5: no check |

Not done: the rest of the fire code: exit components (doors, stairs, ramps, horizontal exits: 5/3), exit lighting and signs (5/8 - 5/10), fire resistance (Tables 2 - 19), fire alarm (6/3, partly in `alarmbattery`), sprinklers (6/4, partly in `sprinkler`), occupancy-specific details inside chapters 8 - 15 (aisle widths, seating, correctional institutions).

## National codes, part 9: Jordanian fire protection code, exit components, extinguishers and requirements by occupancy

Three new calculators in the fire category (now nine): `exitparts` (EP-01), `fireprot` (FR-01), `extinguisher` (EX-01). All text read from the page images (the text layer loses the numbers). In the code the clause letters are Arabic (أ ب ج د هـ و ز ح ط ي ك ل); in the app they are shown as Latin A - L (the translator turns bare Arabic letters into odd words: د = "min").

| Source | Used in | Notes |
|---|---|---|
| 5/3/1 (doors) | `exitparts`: clear width ≥ 0.7 m, leaf ≤ 1.2 m, same floor level on both sides (a step down ≤ 0.2 m for a door that opens straight outside), side hinges opening with the exit for more than 50 persons or high-hazard contents, opening force ≤ 225 N, effective landing width ≥ 0.55 m with the door open; panic hardware for an assembly of 100 persons or more (8/2/7 a): push ≤ 65 N, bar 0.75 - 1.1 m high, length ≥ half the leaf | |
| 5/3/2, Table 2 (internal stairs) | `exitparts`: class A / B width 1.10 / 0.90 (1.10 from 50 persons, handrail projection up to 90 mm not deducted), riser ≤ 0.19 / 0.20 m, tread ≥ 0.25 / 0.22 m, 2R + T 0.55 - 0.70 m, variation ≤ 5 mm, 3 - 12 risers per flight, ≤ 3.6 m between landings, landing ≥ 1.10 m, handrail 0.75 - 0.85 m and 40 mm from the wall, guard ≥ 1.05 m (0.9 m in assembly, 8/2/7 b) with 0.15 m gaps, nosing 25 mm for a tread below 0.25 m, no winders | 🔴 Table 2 prints the minimum distance between floor and ceiling as 0.25 m (obvious misprint): not applied; Fig. 8 (landing depth equal to the stair width) is quoted |
| 5/3/6, Table 3 (ramps) | `exitparts`: class A width 1.1 m, slope ≤ 1:10, no limit between landings, 100 persons per unit up and down; class B 0.75 m, 1:8, 3.6 m, 100 down / 60 up | |
| 5/3/9, Table 4 and 5/3/10 (fire escape stairs and ladders) | `exitparts`: for 10 persons or more width between rails 0.55 m, landing 550 mm, riser ≤ 225 mm, tread ≥ 225 mm, nosing ≥ 25 mm, 3.6 m between landings, headroom 2.1 m, no spiral; below 10 persons 0.45 m, 450 mm, 300 mm, 150 mm, 1.95 m; guards 0.75 - 1.05 m; at most 50 % of the exit capacity, not in new buildings; ladders: supports ≤ 3 m, uprights 1.15 m above the roof, 0.7 / 0.2 m clearances, rungs ≥ 22 mm at 0.25 - 0.30 m, last rung ≤ 0.3 m, rails ≥ 0.4 m apart, for 3 adults at most | 🔴 Table 4 "access to the exit" row (door and window sizes) is printed with lost symbols: not checked; the upright section (12.5 x 50 mm) is not checked |
| 5/3/3, 5/3/4 (smokeproof towers, horizontal exits) | `exitparts`: tower walls 2 h, open vestibule at least as long and wide as the stair door, discharge to a street / court of 7 m width and 100 m², vestibule door 0.9 m, glazed panel ≤ 0.45 m²; horizontal exit: 0.3 m² net per person on each side, ≤ 50 % of the capacity, walls 2 h, bridge as wide as the door and ≥ 1.1 m, level difference ≤ 0.2 m | |
| 5/8 - 5/10 (lighting, emergency lighting, signs) | `exitparts`: 10 lux at floor level (2 lux during a show in assembly places), emergency lighting at least 1 h and automatic, sign lit with 50 lux at its surface, the word "Exit" in Arabic, battery units only for emergency lighting | |
| 6/4/4, Table 9 (extinguishers) | `extinguisher`: class A size = 0.065 x floor area, not less than 26 A (400 m²), at least two per floor, total rating ≥ the size (code example 104 A for 1600 m²); class B: foam 50 x surface, other types 80 x surface (single container, undivided group up to 2 m apart; divided groups: the larger of the largest container and the largest undivided group), spills 10 x litres; handle at 1 m, nearest extinguisher within 25 m | 🔴 no rating rule for classes C and D |
| Chapters 8 - 15 (protection), 6/3, 6/4/1, 7/4 | `fireprot`: per occupancy the alarm, detection, sprinkler, hose, extinguisher, emergency-lighting and hazard-room requirements with their thresholds (hotel 15 guests alarm, 25 rooms emergency light, above 4 floors hoses 19 mm / 600 m², below 4 floors one extinguisher per 200 m²; apartments above 6 floors or 18 units alarm, hoses, extinguishers, 25 units emergency light; dormitory above 700 m² or 2 floors; commercial class A / B / C from 2500 / 250 m² of sales, sprinklers above 1250 m² per floor, hoses 25 mm / 400 m²; offices hoses from 5 floors, emergency light above 2 floors, 1000 persons or 100 on the floor; assembly hoses 25 mm / 400 m², health care 19 mm / 400 m² and detectors 9 / 4.5 m; industrial, storage); number of hoses per floor = area / area per hose and risers at most two hoses per floor; equipment rooms 2 h (7/4); manual call points ≤ 65 m (6/3/6) | 🔴 education: the extinguisher area per unit and the hose size and area are printed as empty boxes (the general 800 m² of 6/4/1 is used); 6/4/1 riser diameter printed as 50.8 mm above 12 m and 63.5 mm up to 12 m (apparently swapped, quoted with a warning); commercial class thresholds read as 2500 / 250 m²; multi-storey Table 11 was added later (part 15); the number 800 m² per hose for offices, industry and apartments is the general 6/4/1 value |
| Table 6, 7, 8, 10, 12 | `fireprot`: vertical-opening walls 2 h from 4 floors, flame spread classes A 0 - 25, B 26 - 75, C 76 - 200 with smoke ≤ 450, interior finish class by occupancy (Table 8, one class lower with sprinklers), one-storey structure rating by area (Table 10), apartments Table 12 by protection type (area between horizontal exits, exit path 35 / 50 / 50 / 50 m, smoke barriers 15 / 30 / 30 m, dead end 6 / 6 / 6 / 12 m, corridor walls 60 / 45 / 45 / 30 min, doors, stairs, distance to the main door 20 / 30 / 30 / 35 m) | 🔴 Table 12: the corridor wall value for the fully sprinklered type (30 min) is printed on a shifted row and was matched by position; Table 10: the area bands are paired with the hours by reading order (education, health care and residential only have the 3000 m² row) |

Not done in the fire code: Chapter 17 (fire resistance of concrete elements, structural), Chapter 16 (operating features, drills and inspection intervals), the finish classes of apartments beyond Table 12, assembly seating and aisle widths, stage and projection rooms beyond the numbers above.

## National codes, part 10: Jordanian fire alarm systems code

One new calculator in the fire category (now ten, 76 calculators in all): `fadetect` (FD-01), and an extension of `alarmbattery` (Jordan option). All numbers were read from the page images of the code (the text layer reverses the Arabic and loses the tables). The clause letters are shown as Latin A - L, as in part 9.

| Source | Used in | Notes |
|---|---|---|
| 2/6/3, Table 1 (point detector spacing and ceiling height) | `fadetect`: any point within 5.3 m of a point heat detector or 7.5 m of a point smoke detector, and at least floor area / 50 m² (heat) or / 100 m² (smoke) detectors; the count is the larger of the area rule and the smallest regular grid whose half-diagonal stays within the distance; ceiling heights (general / upper) heat grade 1: 9.0 / 13.5, grade 2: 7.5 / 12.0, grade 3: 6.0 / 10.5, high-temperature 6.0 / 10.5, point smoke 10.5 / 15.0; the upper limit needs a link to the civil defence with a response within 5 minutes; a part of the ceiling up to 10 % may go to 10.5 m (heat) or 12.5 m (smoke), and to 15 / 18 m above the upper limits | |
| 2/6/3 corridors, sloping roofs, barriers | `fadetect`: a corridor under 5 m wide gains half of (5 m - width); a pitched or corrugated roof with the detectors on the ridge gains 1 % per degree up to 25 % on the distance and the square of that on the area; a barrier deeper than 150 mm and up to 10 % of the ceiling height cuts the distance by twice its depth; deeper than 10 % it is a wall and the parts are separate rooms; the roof counts as flat when the rise is under 150 mm (heat) or 600 mm (smoke) | |
| Table 2 (beam detectors) and 2/6/3 | `fadetect`: beam height 2.7 - 25 m (40 m if the stored goods are no higher than 5 m), beams at most 14 m apart, 10 - 100 m long, 0.3 - 0.6 m below the ceiling, 7 m from a wall measured perpendicular to the beam; number of beams = ceil(width / 14) lines | 🔴 Table 2 prints the distance of the beam from the wall as 8 m while 2/6/3 says 7 m: the stricter 7 m is used; the upper beam length is printed in an unclear form ("14 +") and the footnote says 100 m: 100 m is used; the 7.5 m distance is printed for smoke detectors "of the linear type", evidently the point type (beam 7 m) |
| 2/6/2, 2/6/4, 2/6/6 (siting) | `fadetect`: sensing element 25 - 150 mm (heat) or 25 - 600 mm (smoke) below the ceiling, not within 500 mm of a wall, partition or barrier; quoted as notes: no detector in a void up to 800 mm (unless a fire-spread route), rooms divided by walls reaching within 300 mm of the ceiling are separate, lift and service shafts, stair landings, light wells over 800 mm, concealed detectors with a visible indicator, smoke (not heat) detectors in circulation and escape routes (2/7/4) | |
| 2/2/1 (zones) | `fadetect`: one zone is one fire compartment on one floor, at most 2000 m² and 30 m of search distance; a building of 300 m² or less may be a single zone; number of zones = floors x max(compartments, ceil(floor area / 2000)) | |
| 2/3/6, 3/5/2 (sounders) | `fadetect`: sound level at least 65 dB(A) or 5 dB above the background noise lasting more than 30 s (the larger), 75 dB(A) at the bed head with the doors closed where people sleep, frequency 500 - 1000 Hz (quoted) | |
| 2/4/2, 2/4/3 (call points) | `fadetect`: walking distance to the nearest manual call point at most 30 m (less in very hazardous conditions, quoted), mounted at 1.4 m, alarm delay at most 1 s (quoted) | |
| 2/11/4, 2/11/6 (cables) | `fadetect`: conductor of the detector circuit at least 1.0 mm² solid copper or 0.5 mm² stranded; cables below 2.25 m above the floor protected (quoted) | |
| 2/10/3, 2/10/4 (standby power) | `alarmbattery`: new Jordanian option for a facility with an automatic emergency generator or a generator running all the time: 6 hours of standby instead of 24, then 30 minutes of alarm (2/10/4 B 3 and 4); the maximum alarm load is every sounder together with the detectors of 25 % of the zones and not fewer than two zones (2/10/3 D); standby duration is now editable, with the minimum taken from the system type | 🔴 the code gives no safety margin on the amp-hour: the NFPA 72 20 % stays (as before) |

Not done in the fire alarm code: the number and placement of sounders and loudspeakers beyond the level (2/3), control panel and loop capacity and cable lengths, the extra rules for special occupancies (2/7 beyond the circulation rule), air-sampling and flame detectors, the equipment standards of chapter 3.


## National codes, part 11: Jordanian electrical installations code, cable current-carrying capacity and voltage drop

No new calculator (76 in all): the cable-sizing calculator `cablesizing` gets a third reference, "الكودة الأردنية للتمديدات الكهربائية" (`cs_std = jo`), which is the default when the Jordanian code is selected (it used the IEC tables before). The numbers come from the text layer of the code (the digits are exact; the words are reversed) and were checked against the page images; headings, method letters and the rows the text layer loses (Table 23 rows 70 - 400, the 3-phase tails of Tables 50 - 55) were read from the images.

| Source | Used in | Notes |
|---|---|---|
| 4/5/1 - 4/5/3 | `cablesizing` (jo): tables at 30 °C and 50 Hz; In ÷ (ambient factor × grouping factor) must not exceed the table value; the voltage drop is the table mV/A/m × Ib × length (the worst phase angle) against the 2.5 % limit of 4/5 | 🔴 the list of standard device ratings is the common one (as for IEC), not from the code |
| Table 8 (grouping, more than three cables) | `cablesizing` (jo): single-core cables by loaded conductors (4: 0.80, 6: 0.69, 8: 0.62, 10: 0.59, 12: 0.55, 16: 0.51, 20: 0.48, 24: 0.43, 28: 0.41, 32: 0.39, 36: 0.38, 40: 0.36), multi-core by cables (2: 0.80, 3: 0.70, 4: 0.65, 5: 0.60, 6: 0.57, 8: 0.52, 10: 0.48, 12: 0.45, 14: 0.43, 16: 0.41, 18: 0.39, 20: 0.38); the next higher printed count is used; no factor for cables in air (J, K) which are spaced | the note "no reduction when the spacing exceeds twice the cable diameter" is quoted |
| Tables 9 - 11 (methods A - K) | the cable list labels: A conduit, B trunking, C underground ducts, E - H clipped direct, J and K in air | Tables 12 - 15 (enclosed trenches L, M, N and their factors) are not used |
| Tables 16 - 25 (copper) | ten cable families: PVC 70 °C single-core in conduit or trunking (16), clipped direct (17 for BS 6004, 20 for BS 6004 / 6346), hung in air (18, flat or trefoil); PVC twin and multi-core in conduit (19) and in air (21); PVC armoured clipped (22) and in air (23); thermosetting (XLPE) 90 °C armoured clipped (24) and in air (25) | 🔴 printed misprints, see below |
| Tables 47 - 55 (aluminium) | nine families: PVC single-core in conduit (47), clipped (48), in air (49); PVC multi-core clipped (50) and in air (51); PVC armoured clipped (52) and in air (53); XLPE armoured clipped (54) and in air (55) | the two-cable column stops at 95 mm² in Tables 50 - 55 (as printed) |
| Ambient factors under each table | PVC tables 25 °C 1.06, 35 °C 0.94, 40 °C 0.87, 45 °C 0.79, 50 °C 0.71, 55 °C 0.61, 60 °C 0.50, 65 °C 0.35; XLPE tables 25 °C 1.04 up to 80 °C 0.41; reference 30 °C; the next higher printed temperature is used | |

Printed misprints and how they are handled (also shown with the result):
- Table 17, 300 mm²: the two-cable current is printed 460 A, below the three-cable value 500 A: left empty (single-phase circuits skip 300 mm²).
- Table 20, 50 and 150 mm² (two-cable current 136 and 230 A, below the three-cable values) and 300 mm² (three-phase 350 A, below 240 mm²): left empty. Tables 17 and 20 both cover methods E - H and give different values (Table 20 lower by 5 to 10 %); both are offered, labelled by the printed standard numbers, with no way to tell from the text which cable each is meant for.
- Table 25, 95 mm², voltage drop for two cables printed 0.25: 0.52 used (Table 24, the same cable).
- Table 51, 50 mm², three-phase current printed 10 A: left empty.
- Table 22, 4 mm²: voltage drops 12 and 9.6 are not in the ratio 0.866 of the other rows: used as printed. Tables 52 - 55: a few three-phase drops are up to 7 % below 0.866 × the two-cable value: used as printed.
- Table 24 / 25: both voltage-drop columns for two cables are headed "a.c.": the larger (right) is taken as a.c., the left as d.c., as in all other tables.
- Table 23 starts at 6 mm² (no rows for 1.5 - 4 mm²); Table 21 starts at 25 mm²; Tables 16, 19 and 47 are for methods A, B, C and the code limits method C (underground ducts) to 35 mm²: a selector enforces it.
- Table 18 (copper single-core in air): the 240 mm² voltage drops are slightly above the 185 mm² ones in the print (conservative): kept.

Not done: tables of rubber (26 - 28, 33, 34), paper (29 - 32, 56 - 59), mineral-insulated (36 - 46, 60, 61) and flexible cords (35), the cable-use guidance (62, 63), the trench factors (13 - 15), the conduit and trunking capacity (4/6, Table 67 onwards) and the clip spacing (70 onwards), the thermal-insulation factor (4/2/1 A 5), and every cable type or method the code does not tabulate (single-core XLPE, direct burial): those stay with the SBC 401 / IEC reference.


## National codes, part 12: Jordanian sanitary drainage code, septic tank, pits, inspection chambers (Tables 2, 3, 7, 8)

New calculator `septic` (SEP-01, 77th, plumbing category 21): the pages were read from rendered images (the text layer loses most numbers of chapter 6 and Tables 7 and 8). It is available with every code, like the fire calculators.

| Source | Used in | Notes |
|---|---|---|
| 6/2/3 A (septic tank capacity) | `septic`: C = 0.18 P + 2 (m³) with 0.18 m³ per person per day (the daily consumption, editable); the compartments below make 3 m³ the smallest tank (2 + 1 m³) | 🔴 the code says "taking site conditions and other factors into account": no further factor is given |
| 6/2/3 B - G | `septic`: at least two compartments; first at least 2/3 of the capacity and 2 m³, width at least 1 m, length at least 1.5 m, liquid depth 0.6 - 1.8 m; second at most 1/3 and at least 1 m³, length at least 1.5 m above 6 m³; two inspection openings 500 × 500 mm and an extra one above the baffle when the first compartment is longer than 3.7 m; inlet and outlet 25 mm apart in level; baffle openings 75 - 150 mm, 225 - 300 mm below the surface, total width 225 mm; walls 225 mm above the outlet | the checks need a width and depth: the lengths follow from the volumes |
| 6/3/4, 6/3/5, 6/3/6, 6/3/7, 6/4 (pits) | `septic`: collecting pit = people × 180 L × 45 days; total depth at most 4 m, cover to the inlet pipe crown at most 0.6 m; circular, square or rectangular (square and rectangular only for the collecting pit); walls 200 mm solid cement block or 150 mm 6:1 concrete, floor 150 mm of 6:1 concrete; inlet pipe 100 mm inside the wall; air inlet 100 mm and 750 mm above the cover; vent pipe 3 m horizontal and 3 m vertical; abandoned pits emptied and filled within 30 days | 🔴 the effective liquid depth is not given: total depth minus 0.6 m is assumed for the plan area; the vent slope is printed "5:1" (kept as printed); the absorption pit capacity has no formula in the code |
| Table 7 | `septic`: minimum clear distances (m) drain pipe / septic tank / absorption pit: buildings (clause 2/3/5) / 1.5 / 3.5; adjacent property line (inside the property) / 1.5 / 3.5; watertight water tank 2.5 / 3.5 / 15; trees (not permitted) / 3 / 3; the entered distances are checked, and an absorption pit that fails is replaced by a watertight collecting pit (footnote) | the memory note said these numbers were missing from the text: they are readable in the page image |
| 4/3 and Table 8 (inspection chambers) | `septic`: the smallest round or square chamber (400 / 500 / 600 / 900 mm: depth 600 / 800 / 1500 / 4000 mm, 2 / 3 / 4 / 4 branches, branch 100 / 100 / 150 / 200 mm, cover 300 / 400 / 600 / 600 mm) and rectangular chamber (900 × 600, 1200 × 600, 1500 × 600 at 1500 mm: 2 / 3 / 4 branches of 150 mm; 1200 × 900 and 1500 × 900 at 4000 mm: 3 / 4 branches of 200 mm) for the depth, the branches on the busiest side and the largest branch; rules of 4/3/1 - 4/3/3: spacing at most 20 m, drop chamber for 600 mm, walls and floor slab 150 mm, outlet invert 50 mm lower, channel height 0.8 of the pipe, step irons from 1.5 m depth | 🔴 the minimum cover size of the rectangular rows is printed once (600 mm): used for all; the footnote ** on the 900 × 600 row is unreadable |
| 3/2/2, 3/2/3, Tables 2 and 3 | note under `fixtureunits` (Jordan): equivalent units by intermittent flow for fixtures not in Table 1 (0.50 - 0.99 L/s: 2, 1.00 - 1.49: 3, 1.50 - 1.99: 4, 2.00 - 3.15: 5) and the maximum load of a trap (32 mm: 1, 40: 3, 50: 4, 80: 6, 100: 8 units); 4/1/5 building drain at least 150 mm | 🔴 the first row of Table 2 is printed "up to" without the number: 0.49 is assumed |

Not done in the drainage code: the vent sizing of chapter 5 (the tables are the IPC ones in the tool), the gutter and rain-pipe details already in `raindrain`, the grease unit sizing (note only), the materials of 3/1 and 7/1.


## National codes, part 13: Jordanian lifts code, standard lift dimensions (Tables 9 - 13)

No new calculator (77): `liftplan` gets a section "أبعاد المصعد والبئر وغرفة المكنات" (lift type, rated load, rated speed, optional available shaft size) that gives, for the chosen lift, the car (Cw × Cd × Ch), minimum shaft (Ww × Wd), clear entrance (Ew × Eh), pit depth Ph, overhead Sh (or the total Uh at 2.50 m/s), and the machine room (Ra, Rw × Rd, Rh), checks an available shaft, and a button sends Cd, Ra, Rw, Rd, Ww, Wd to the Table 16 and 17 fields. The table bodies are bitmaps inside the PDF: they were read from crops enlarged 4 - 14 times (the digits are legible), cell by cell, with the merged speed cells mapped to speeds by the dividers.

| Source | Used in | Notes |
|---|---|---|
| 3/2/1, 3/2/2, Table 9 (light-duty passenger lifts) | 400 kg (5 persons), 630 (8), 800 (10), 1000 (13) at 0.50 / 0.63 / 1.00 / 1.60 m/s: e.g. 630 kg: car 1100 × 1400 × 2200, shaft 1800 × 2100, entrance 800 × 2000, pit 1400 (0.50, 0.63) or 1700 (1.00, 1.60), overhead 4000 or 4200 (1.60), machine room 15 m² 2500 × 3700 × 2600 | 🔴 the first load is printed "4000" in the blurred image: read as 400 kg (5 persons and the 1100 × 950 car fit); the pit of the 1000 kg lift is not printed at 1.00 and 1.60 m/s: left empty |
| Table 10 (residential lifts) | 630 kg and 1000 kg at 0.50 / 0.63 / 1.00 m/s: shaft 2000 × 1900 and 2000 × 2600, pit 1400 / 1700 and 1500 / 1700, overhead 4000, machine rooms 10 m² (2200 × 3700) and 12 m² (2400 × 4200), height 2600 | |
| Table 11 (general-purpose passenger lifts) | 630 - 1600 kg at 1.00 / 1.60 m/s: e.g. 1000 kg: car 1600 × 1400 × 2300, shaft 2400 × 2300, entrance 1100 × 2100, pit 1800, overhead 4200, machine room 20 m² 3200 × 4900 × 2700 | the overhead of the 800 kg lift is printed 4000 at both speeds (the 630 kg lift is 4000 / 4200): kept as printed |
| Table 12 (heavy-traffic passenger lifts) | 1000, 1250, 1600 kg at 2.50 / 3.50 m/s: pit 2800 / 3400, overhead 9400 / 10400, 9500 / 10400, 9700 / 10600, machine room 20, 22, 25 m² | the machine room height column is empty in the print |
| Table 13 (passenger and bed lifts) | 1600 (21), 1800 (24), 2000 (26), 2500 kg (33) at 0.50 - 2.50 m/s: car, shaft, entrance 1300 × 2100, pit 1700 / 1900 / 3200 by speed band (1800 / 1900 / 2100 for 2500 kg), overhead 4600 up to 1.60 m/s and the total shaft height Uh 9700 at 2.50 m/s, machine room 25 - 29 m² | 🔴 the machine room depth of the 1800 kg lift reads 5000 mm, below the 1600 kg value (5500): 5800 mm (the 2000 kg value) is used and the print is noted in the result |

Tables 14 and 15 (goods lifts) were added later, see part 16 (first left out because the stacked speed bands are blurred at the cell edges); Table 7 and the performance tables 3 and 4 were already in `liftplan`.


## National codes, part 14: Jordanian central heating code, Tables 8 - 11 and 5/3

| Source | Used in | Notes |
|---|---|---|
| Tables 9, 10, 11 | `heatexpansion` (Jordan only): minimum feed pipe (20 / 25 / 32 / 40 / 50 mm for a boiler below 58.6, 146.5, 293, 586 kW, then above), minimum safety pipe (the same bands and sizes) and drain valve or cock (20 / 25 / 32 / 40 / 50 mm below 43.95, 87.9, 175.8, 263.7 kW, then above) from the boiler power entered | the printed bands overlap at their limits ("from 58600 to 146500", "from 146500 to 293000"): the larger size is taken at a limit |
| 5/3/6 | `heatexpansion` (Jordan only, optional inputs): feed and expansion tank at least 0.08 × the water volume of the system or 1 L per m² of radiating surface, the larger of the two | 🔴 the factor 0.08 is printed with a stray character beside it; "or" is read as "either, the larger governs"; the calculator still sizes the tank by the Syrian relation |
| 5/3/7, 5/3/8, 5/3/10, 5/5/1, 5/5/3 | note under the results: feed pipe on the pump suction line and insulated where frost can occur; vent pipe 20 mm at every high point, additional vent 15 mm, no vent from the feed pipe; tank bottom at least 1 m above the highest part of the network; pipes sloped at least 0.5 : 100 towards the vent; each boiler has an open safety pipe and a drain valve of at least 20 mm, the lowest part of the network a 15 mm drain cock | |
| Table 8 (heat emission of horizontal uninsulated black steel pipes) | `heatingpipes` (Jordan note): NOT applied | the printed W/m values (DN15: 50, 62, 72, 84, 97, 109, 122, 135 for ΔT 15.5 - 54.4 K; DN150: 302 - 818) are about 2.3 times a rough radiation + natural-convection estimate (about 58 W/m for DN15 and 350 W/m for DN150 at 54.4 K): the unit is doubtful, so no calculation uses them; the factors of 5/3/4 (vertical pipe about 98 %, stacked pipes 95 / 85 / 75 / 65 % for 2 / 4 / 6 / 8 pipes, a pipe near a wall or ceiling 80 %) were read but need the table |
| Table 6 (gravity circulation head) | not used | gravity systems are not calculated in the tool |
| Fire Protection Code Table 11 (fire resistance of multi-storey structure elements) | transcribed later, see part 15 | this first reading left it out because the area column has no row borders; part 15 settled it by decoding the bitmap numbers and pairing by order |

Not done in the heating code: Table 12 (spacing of pipe supports), Tables 13 and 14 (insulation thicknesses) and the chimney and radiator rules of the later chapters.


## National codes, part 15: Jordanian fire protection code, Table 11 (multi-storey structure fire resistance)

`fireprot`: a multi-storey building (more than one floor) now gets its structure fire resistance from Table 11 by occupancy, building height and the area of the largest floor (new field "ارتفاع المبنى"); one floor keeps Table 10. Result: hours for the ground floor and above, hours for a basement, and the note that elements of a basement not larger than 50 m² need only half an hour (the footnote of the table, number read from the page image).

How the table was read (it had been left out because the area column looked unreliable):
- The text layer of the page has no area numbers: they are tiny bitmaps drawn in a pixel font where the glyphs for 2 and 5 are swapped in shape (a glyph like "S" is 2, one like "Z" is 5). All 22 bitmaps of the page were extracted at native size, decoded one by one, and matched with the text items by position; the drawing order of the page was traced as well.
- The page is flowing columns (occupancy, area, height, basement rating, ground rating) aligned with blank lines, not a bordered table, so the pairing of an area with a row cannot be read from the vertical position: it was settled by order. Every occupancy has exactly as many area values as rating rows (assembly 5 / 5, education 2 / 2, residential 4 / 4, commercial 5 / 5, administrative 5 / 5, industrial 5 / 5, storage 7 / 7), and the pairing by order reproduces the same structure in all of them (a row "15 m, no area limit", then "28 m" with an area limit, then the unlimited height with the high-rise area limit).
- Rows as read (area m², height m, ground / basement hours): assembly (250, 7.5: 0.5 / 1.0*), (500, 7.5: 0.5 / 1.0), (unlimited, 15: 1.0 / 1.0), (1000, 28: 1.0 / 1.5), (unlimited, unlimited: 1.5 / 2.0); education and health (2000, 28: 1.0 / 1.5), (2000, unlimited: 1.5 / 2.0); residential up to 3 floors (unlimited, 9: 0.5 / 1.0), 4 floors (250, 12: 1.0 / 1.0), any floors (3000, 28: 1.0 / 1.5), (2000, unlimited: 1.5 / 2.0); commercial (150, 7.5: 0.5 / 1.0*), (500, 7.5: 0.5 / 1.0), (unlimited, 15: 1.0 / 1.0), (1000, 28: 1.0 / 2.0), (2000, unlimited: 2.0 / 4.0); administrative (250, 7.5), (500, 7.5), (unlimited, 15), (5000, 28: 1.0 / 1.5), (unlimited, unlimited: 1.5 / 2.0); industrial (250, 7.5: 0.5 / 1.0*), (unlimited, 7.5: 0.5 / 1.0), (unlimited, 15: 1.0 / 1.0), (unlimited, 28: 1.0 / 2.0), (2000, unlimited: 2.0 / 4.0); storage (150, 7.5: 0.5 / 1.0*), (300, 7.5: 0.5 / 1.0), (unlimited, 15: 1.0 / 1.0), (unlimited, 15: 1.0 / 2.0), (unlimited, 28: 2.0 / 4.0), (unlimited, 28: 4.0 / 4.0), (1000, unlimited: 4.0 / 4.0).

🔴 Still uncertain: the pairing is by order (an inference, not a printed fact); storage prints two rows with the same height and the same unlimited area but different ratings (twice): the higher is taken; a building that exceeds the limits of the last row of its occupancy (for example a high-rise commercial building above 2000 m² per floor) has no row and is sent to the competent authority; education and health have no row for a low building (the first row is 28 m), so any building up to 28 m takes it.


## National codes, part 16: Jordanian lifts code, Tables 14 and 15 (goods lifts)

`liftplan` (the section "standard lift dimensions"): two more lift types, the general-purpose goods lifts (Table 14: 500, 1000, 1500, 2000 twice, 3000 twice) and the heavy-duty goods lifts (Table 15: 1500, 2000 twice, 3000 twice, 4000, 5000). A rated load that is printed twice (two car shapes) is told apart in the list by its car size. Output as for Tables 9 - 13: car, shaft, clear entrance, pit and overhead for the chosen speed band, machine room, and the available-shaft check.

How the tables were read (they were left out twice because the speed cells are stacked inside small bitmaps):
- Each table is one bitmap of 509 x 456 and 521 x 532 pixels in the PDF, stored upside down, with about four pixels per digit (each digit is a 4 x 4 pixel glyph on a fixed pitch of 4 px). The bitmaps were extracted at native size (not through the page renderer), flipped, cut into cells, and the digit pixels were read cell by cell as grey-level maps; a nearest-neighbour glyph check (leave-one-out over about 760 glyphs of the two tables, 32 disagreements, all between look-alike glyphs: 4 / 6, 3 / 5, 0 / 8) was used to challenge every reading, and the disagreements were decided by the pixel maps and the relations below.
- Relations that hold in the data and cross-check the readings: Cw = Ew in all 14 rows; Ch = Eh in 13 of 14; Wd = Cd + 300 in Table 14 and Cd + 400 in Table 15 in all 14 rows (after the one misprint below); persons = floor(load / 75) in all rows; the same loads have the same car in both tables; the heavy-duty machine room is 300 mm deeper than the general one in the four loads where both are printed (1500, 2000, 2000 second car, 3000 second car); Ra is above Rw x Rd in every row; the printed speed bands equal the union of the speeds of the small speed table above each table (except the 1500 kg row of Table 15, below). Two digits were decided by the pixels against the first reading: Table 14 overhead of the 3000 kg lifts at 0.50 m/s is 4400 (not 4600), and Rh of the 1000 kg lift is 2400 (not 2600).
- Speeds: the printed bands are 0.50 | 0.63 and 1.00 (500 kg), one band for all four speeds (1000 kg), 0.25 | 0.50 | 0.63 and 1.00 (1500 and 2000 kg, and the 3000 kg lifts of Table 15), 0.25 | 0.50 | 0.63 (3000 kg of Table 14 and the 4000 and 5000 kg lifts). 0.63 and 1.00 m/s share a pit depth and an overhead.
- Notes carried: Table 14 note 2 (Cd is the internal depth with the collapsible-gate doors closed; allow extra for stowing them when the net depth is wanted), Table 15 note 2 (add 200 mm to Wd when entrances face each other, read from a blurred line), both tables note 1 (valid for lower speeds) and note 3 (Rd and Rw each equal to or above the printed, or their product at least Ra).

🔴 Still uncertain: the single-source rows (the 500 and 1000 kg lifts of Table 14 have no counterpart in Table 15 to compare with; Rh of the 1000 kg lift could be 2600); Ww and the machine-room digits are checked only by the consistency of their columns; Table 15 prints Wd of the first 3000 kg car as 4300 (a swap of 3400 = Cd 3000 + 400): 3400 is used and the print is shown; the second 3000 kg car of Table 15 has Eh 2500 above Ch 2300 as printed; the speed table of Table 15 gives 0.25, 0.63, 1.00 for 1500 kg while the main table has a 0.50 cell (the main table is used); the second digit of the 3800 overhead of the two small Table 14 lifts could be read 0 (3000), which is rejected because it is below the car height of 2000 plus any clearance.


## National codes, part 17: Jordanian central heating Tables 12 - 14 and sanitary drainage Table 4 with chapter 5 (vents)

All of these are plain text in the page images (the text layer lost the numbers, so each page was rendered and read), unlike the bitmap tables of parts 15 and 16.

`heatingpipes` (Jordan only): for every loaded pipe row the selected nominal size now gets the spacing between hangers (Table 12, horizontal and vertical pipes) and the minimum insulation thickness (Table 13 for hot surfaces, Table 14 for protection from freezing indoors or outdoors, whichever governs). New fields: the insulation conductivity W/(m.K) (the smallest printed column 0.03 - 0.07 not below it; above 0.07 there is no value and the result says so) and the pipe location. Notes under the result: sleeves 5/5/4 C (internal diameter 10 mm larger, 30 mm above the finished floor, ends 30 mm out of the finished wall), no hangers in walls below 100 mm (5/5/4 D), clearance of the insulation 20 mm to walls and ceilings and 80 mm to the floor (5/5/3 G), expansion-joint gap 33.3 % of the total expansion (5/5/3 H), insulation execution 9/4 (separate insulation per pipe, 20 mm bands at 0.45 m, tanks above 1.2 m diameter or 1.8 m length with 25 mm bands) and 9/3/1 (types).

| Source | Used in | Notes |
|---|---|---|
| Table 12 | `heatingpipes` | 15 - 100 mm: horizontal 1.8 / 2.5 / 2.5 / 2.7 / 3.0 / 3.0 / 3.0 / 3.5 / 4.0 m, vertical 2.5 / 3.0 / 3.0 / 3.0 / 3.5 / 3.5 / 4.5 / 4.5 / 4.5 m; "100 and above" shares the last row |
| Table 13 | `heatingpipes` | bands up to 20 / 20 - 80 / 80 - 200 / 200 and flat: 0.03 W/mK 8 / 11 / 16 / 22 mm up to 0.07: 31 / 39 / 49 / 59 mm; the bands share their limits (20, 80, 200 mm), so the thicker value is taken at a limit |
| Table 14 | `heatingpipes` | bands 15 - 40 / 40 - 80 / 80 and above: indoors (possible freezing) 22 - 82, 16 - 48, 13 - 39 mm and outdoors 27 - 99, 19 - 58, 16 - 46 mm for 0.03 - 0.07 W/mK; the thicker value is taken at 40 and 80 mm |
| Table 4 (3/3/2, 5/3/1 A) | `vent` (Jordan only, shown before the IPC result, which is kept for comparison) | vent pipes 32 - 200 mm: maximum units 1 / 8 / 24 / 48 / 84 / 256 / 600 / 1380 / 3600 and maximum length 13.7 / 18.2 / 36.5 / 54.7 / 64.5 / 91.8 / 118.6 / 155 / 228 m; the smallest size that satisfies both is chosen; the stack check uses the vertical-drain units (32 - 300 mm: 1 / 2 / 16 / 32 / 48 / 256 / 600 / 1380 / 3600 / 5600 / 8400). The drain Table 4 values were already in the `fixtureunits` note (100 - 300 mm); all of Table 4 is now in the vent block |
| 5/3/1 C | `vent` | the length may be exceeded by up to a third if the next larger size is used for the whole pipe: shown as an alternative |
| 5/4/2 B | `vent` (wet vent) | 40 mm for one equivalent unit, 50 mm up to four, more is not allowed |
| 5/3/1 B, 5/3/2, 5/4/1, 5/4/3, 5/4/5, 5/5, 5/1/3, 5/2/1 | note under the vent result | main vent stack at least 100 mm for a drain shared by buildings; vent connection at 45 degrees or more, branch vents 150 mm above the fixture rim; common, circuit (2 - 8 water closets) and relief (every tenth branch, Y fitting, 1 m above the floor) venting; terminals 150 mm above a parapet or 3 m above a used roof, 2 m horizontally or 1 m vertically from openings, cowl with a rust-proof screen; steel vents not below ground or lower than 150 mm above it unless protected |

🔴 Uncertain: 5/3/1 C is printed "by an amount that exceeds a third" (a negative particle is probably missing: read as "not exceeding a third"); 5/4/1 C gives the independent vent as "50 mm or one and a half times the drain size" without saying which governs; the footnote marks of Table 4 (except the trap arm / sinks / water closets) are printed incompletely, so they were listed but not applied to individual figures; the vent block uses the entered length as the developed length of the vent and the entered units as the equivalent units of the vent, not summing the branches.

Not done: Table 12 for plastic or copper pipes of light gauge (only the heavy gauge is printed), the radiator and chimney rules of the later chapters of the heating code, heating Table 8 (unit doubtful), drainage Tables 9 to 13 beyond those already used (grease Table 9 and rain Tables 10 - 13 are in the notes of `grease` and `raindrain`), fire chapters 16 and 17.


## National codes, part 18: Jordanian thermal insulation code, Tables 13 - 16 (`uvalue`)

Tables 1 - 3 (maximum U-values) and Appendix A (climate zones) were already used in earlier parts; this part makes the U-value calculation itself follow the code (4/3). Read from the rendered pages (plain text in the images).

`uvalue` (Jordan only): the inside and outside film resistances come from Tables 14 and 13 instead of ISO 6946 (new fields: wind exposure, surface type A / B; filled when the element, exposure or surface changes, and when an assembly button is pressed; an internal partition takes the inner film on both faces), an optional unventilated air cavity from Table 16 is added to the resistance, and the layer material list has an extra group with the 104 rows of Table 15 (k in the dry state, with the density).

| Source | Used in | Notes |
|---|---|---|
| Table 13 (outside film, m².K/W) | `uvalue` | exposure sheltered / moderate / severe (wind below 0.5 / 0.5 - 5.0 / above 5.0 m/s): walls type A 0.08 / 0.06 / 0.03, B 0.10 / 0.07 / 0.03; roofs A 0.07 / 0.04 / 0.02, B 0.09 / 0.05 / 0.02; the underside of a floor exposed to air 0.09 (sheltered only) |
| Table 14 (inside film) | `uvalue` | walls (horizontal) A 0.12, B 0.31; roofs and floors upward A 0.10, B 0.21; downward A 0.15 |
| Table 16 (unventilated cavity) | `uvalue` | 5 mm: A 0.11 / 0.11, B 0.18 / 0.18; 20 mm and more: A 0.18 horizontal or upward and 0.20 downward, B 0.35 and 1.06 (heat flow horizontal or upward / downward) |
| Table 15 (conductivity of materials) | `uvalue` | stone, sand, concrete and clay bricks, concrete (normal, lightweight 2000 - 1000 kg/m³ and foam 1600 - 400), floor finishes, plasters, mortar, wood and boards, asbestos cement, damp-proof layers, glass, metals, plastic foams, mineral fibres, glass wool, cork and loose fills |
| 2/4/1 | note | the U-value of a wall with openings is the area-weighted average, compared with Table 3 |

🔴 Uncertain: the exposure classes and surface types follow the printed definitions, but the table prints no outside film for a floor in moderate or severe exposure (the sheltered 0.09 is reused and flagged) and no inside film of type B for downward flow (A reused); Table 15 rows are paired with their material by the order of the printed list: the mineral-fibre, glass-wool, cork and "pitch and bitumen" rows are flagged because the printed value rows do not line up one to one with the labels (several densities per label, ranges such as 0.045 - 0.060 where the larger value is used); the "volcanic rocks" heading prints no value (left out), and rubber and glass brick print no density; two rows of baked clay brick (solid and the first hollow row) both print 2000 / 1.00, one is kept; the values are for the natural dry state as the code says.

Not done in the thermal insulation code: Tables 17 - 22 (vapour pressure, vapour barriers and condensation), Table 23 (specific heat capacities), Tables 24 and 25 (heat reduction for intermittent occupancy and heating), and the thermal-bridge rules of chapter 4.


## National codes, part 19: Jordanian thermal insulation code, Tables 24 and 25 (design ratio of the heating energy, `heatingload`)

Plain numbers in the rendered pages (8/1 - 8/3). `heatingload` (Jordan only): a new section "heating energy reduction by occupancy" with the thermal inertia of the building (8/2: heavy = stone or concrete multi-storey structures with solid partitions; medium = lightweight materials with solid partitions; light = one storey without partitions or with few non-solid ones, upper floors without partitions count as light), the weekly period (7 or 5 days), the daily period (4, 8, 12 or 16 h), the operation of the heat supply equipment (continuous or intermittent daily) and the time lag of the building (low or high). The result is the design ratio = daily factor x weekly factor x plant factor, shown with the reduced heating load and boiler capacity beside the full ones. The default (heavy, 7 days, 8 h, continuous) is neutral (1.0). The ratio does not change the existing outputs or the load sent to the other calculators.

| Source | Used in | Notes |
|---|---|---|
| Table 24 | `heatingload` | daily period 4 / 8 / 12 / 16 h: light 0.68 / 1.00 / 1.25 / 1.40, heavy 0.96 / 1.00 / 1.02 / 1.03; weekly: 7 days 1.0, 5 days light 0.75 and heavy 0.85 |
| Table 25 | `heatingload` | continuous operation 1.0; daily intermittent operation (low / high time lag): light buildings 0.55 / 0.70, medium 0.70 / 0.85, heavy 0.85 / 0.95 |
| 8/3/3 (example) | test | light building, high time lag, 12 h, 5 days: 0.70 x 1.25 x 0.75 = 0.66 of the total design load, reproduced (0.656) |

🔴 Uncertain: the medium column of Table 24 is empty in the print (the heading lists light, medium and heavy but only the first and last carry numbers, and the "1.0" for continuous days is centred): the mean of the light and heavy values is used for the medium building (daily value except at 8 h, weekly value at 5 days) and flagged; the code gives the ratio for the design on the basis of "optimum energy consumption" and says it is preferable ("يفضل"), it does not say that the equipment may be selected on the reduced load, so both numbers are shown and the choice is left to the designer.

Not done: Table 23 (specific heat capacities, used only for the time lag and decrement factor of chapter 7), the periodic heat flow method itself (the time lag and decrement factor of a wall), Tables 17 - 22 (vapour and condensation).


## National codes, part 20: Jordanian natural ventilation and sanitary principles code, sanitary fixture count (new calculator `sanfix`)

NEW calculator (78th, plumbing 22): the number of toilets, washbasins, urinals and showers by occupancy and number of persons, with the sanitary-room requirements of chapter 5 (the user chose the natural ventilation code after the heating, drainage and thermal parts). Source pages (chapter 4 and Appendix E, Tables E1 - E7) are plain text and graphs in the rendered images; the tables under the graphs were read, the graphs were not used.

| Source | Used in | Notes |
|---|---|---|
| Table E1 (cinemas, theatres) | `sanfix` | 1200 seats = 11 toilets (2 at 100 seats, 3, 5, 6, 7, 8, 8, 9, 10, 10, 11, 11 each 100 seats); split 7 men : 3 women; washbasin per 2 toilets; two urinals per 3 toilets; one toilet less per 3 urinals but not below 3/4; theatres + 20 %. The printed example (1200 seats: women 4 + 2 basins, men 6 toilets, 4 basins, 6 urinals) is reproduced |
| Table E2 (community centre) | `sanfix` | men 1 / 2 / 3 / 3 / 3 / 4 / 4 / 4 / 4 / 4 and women 1 / 2 / 2 / 2 / 2 / 3 / 3 / 3 / 3 / 3 for 1000 - 10000 residents; urinal per men's toilet, 2 basins per 3 toilets, minimum contents of the rooms, sports facilities |
| Table E3 (parks, stations) | `sanfix` | 2 / 2 / 3 / 4 / 5 / 6 / 7 / 8 / 9 / 10 toilets for 1500 - 15000 persons; parks 3 men : 2 women, stations 3 : 1 (+ 30 % when the wait exceeds an hour); a urinal and a basin per 2 men's toilets |
| Table E4 (commercial) | `sanfix` | men 2 - 13 (50 - 500 workers), women 2 - 13 (50 - 350 workers); customers / 4 as workers; basin rule for customers |
| Table E5 (offices) | `sanfix` | 3 / 5 / 6 / 8 / 9 / 10 / 12 / 14 toilets for 50 - 400 persons; the printed examples (90 persons = 5, 240 persons = 9 for each sex) are reproduced by the option "the whole number for each sex" |
| Table E6 (schools) | `sanfix` | 4 toilets at 100 boys to 34 at 1900 (19 rows, read from a low-resolution image); basin per toilet; urinal per toilet for boys; + 12.5 % for girls; a fountain per 75; staff 30 % |
| Table E7 (industry) | `sanfix` | men 3 - 13, women 4 - 21, urinals 2 - 11 for 50 - 400 persons; + 1 toilet per 20 more women or 33 more men, + 1 urinal per 50 more persons; basins by the class of the industry |
| 4/2/1 D, 4/2/5, 4/2/6 | `sanfix` | mosques (100 / 150 persons per toilet, 30 / 50 per ablution place), hospitals (toilet per 8, basin per 10, shower per 20), hostels (toilet 10 men / 8 women, urinal 10, shower 12), temporary housing (12) |
| Chapter 5 (5/1 - 5/6) | `sanfix` | window area 5 % of the floor area (each 0.15 m2) for residential units, 0.3 m2 per window or a vertical duct 0.06 + 0.03 per extra toilet for the others, 10 air changes per hour when mechanical, exhaust outlet 1.5 m from any openable window; floors, skirtings 100 mm, tiling 1.2 m / 1.75 m, drinking fountain tap 0.82 m, recess 0.60 m, grab rails 0.80 - 0.85 m |

🔴 Uncertain: the code prints counts "for N persons" without saying clearly whether N is the persons of one sex: they were read as persons of the same sex (men and women columns differ at the same N), the sex split uses the 2 : 1 women : men of the general text (or the whole number for each sex as in the printed office example, chosen in the form); Table E4 prints no women's count above 350 workers and no table goes beyond its last row (the last value is kept and flagged); Table E6 is a small blurred image; the hostel basin rule prints "per 4 persons" for the next forty exactly as for the first 42 (possible misprint) then per 5; sports halls and gymnasiums (toilet per 30 m2, shower per 25 m2, urinal per 30 m2) were not transcribed because "for males and females" is not settled; the graphs under each table were not read, only the printed tables.

Not done in this code: Table 1 (outdoor air for respiration) and Table 4 (recommended outdoor air for the conditioned space, a figure with curves of the air per occupant of a 3 m room), Tables 5 - 11 (flow through openings, wind and stack effect, pressure coefficients) and the worked example of Appendix D (natural ventilation rate of an ordinary building), Appendices A and B (contaminant concentration and condensation).


## National codes, part 21: Jordanian natural ventilation and sanitary principles code, Tables 1 and 4 (outdoor air) in the `ventilation` calculator

Continuation of the natural ventilation code (the user asked to continue in the Jordanian codes without further questions). A Jordan-only form section and result block were added to the existing `ventilation` calculator (ASHRAE 62.1 stays the main result; the other codes are unchanged). Source pages are plain text and small bitmap digits in the rendered images; the same Table 4 is printed again as Table 2 of the mechanical ventilation code, which was used to cross-check the layout.

| Source | Used in | Notes |
|---|---|---|
| Table 4 (recommended outdoor air for conditioned spaces, L/s) | `ventilation` (Jordan), `JO_NV4`, `joNvAir` | 17 rows: per-person recommended / minimum 8 / 5, 12 / 8, 18 / 12 and per m2 of floor 0.8 (factories), 1.3 (large-hall offices), 3.0 (stores and markets), 1.7 (hotel bedrooms, closed offices), 1.3 (corridors), 10 (home kitchens), 20 (restaurant kitchens), 10 (toilets); recommended = per person, minimum = the larger of the per-person and per-m2 values (as the table header says), design = the larger of the recommended and the minimum |
| Table 1 (respiration, adult males) | `JO_NV1`, `joNvResp` | metabolic rate 100 / 160 - 320 / 320 - 480 / 480 - 650 / 650 - 800 W, oxygen 0.1 - 0.9 L/s, fresh air 0.8 / 1.3 - 2.6 / 2.6 - 3.9 / 3.9 - 5.3 / 5.3 - 6.4 L/s per person; females 75 % of the male rates; CO2 limit 0.5 % (fresh air 0.04 %, exhaled 4.4 %) |
| 2/1/3, 2/2/1 | note under the results | text of the two clauses (respiration; Table 4, Appendix C examples and Figure 3 are referred to) |

🔴 Uncertain:
- The per-person values are printed in merged cells (8 / 5, 12 / 8, 18 / 12) and the vertical centring of the printed digits differs between the two codes (natural ventilation code vs Table 2 of the mechanical code), so the exact rows covered cannot be fixed with certainty. Rows placed by judgement (flagged `band` in the results): theatres in 8 / 5, halls and ordinary homes in 12 / 8, cafeterias in 18 / 12. Placed with confidence in the same tier in both layouts: factories, large-hall offices and stores (8 / 5), hotel bedrooms, laboratories and closed offices (12 / 8), meeting rooms, luxury homes and dining halls (18 / 12). The labs 8 and luxury homes 12 of the earlier `JO_VENT` list (mechanical code, "rows that give a single value") are the minimum column of these tiers and agree.
- Closed offices per m2: the natural ventilation code prints 1.7 (checked at 6x zoom), the mechanical ventilation code prints 1.3; 1.7 is used here (the larger) and the `JO_VENT` row from the mechanical code keeps its printed 1.3.
- Corridors, kitchens and toilets: the values sit in the per-m2 column; the natural code text says the quantity is calculated "in proportion to the number of persons", the mechanical code says it is NOT recommended to calculate it per person; they were applied per m2 only.
- The rule "design = the larger of the recommended and the minimum" is the tool's reading (the printed minimum is a floor), not a printed sentence.
- Not done: Figure 3 (air for the occupants of a room 2.7 m high: curves a - e of the air changes against the floor area per person; a graph, not transcribed), Tables 5 - 11 (flow through openings, wind and stack effect) and the appendices A - D (contaminant concentration, condensation, the examples of air quantities in Appendix C and the natural ventilation example).


## National codes, part 22: Jordanian natural ventilation code, chapter 3 and Appendix D (new calculator `natvent`)

NEW calculator (79th, HVAC 16, card in "air networks"): the natural ventilation airflow through openings by wind and by temperature difference, and the leakage through window cracks, from chapter 3 of the natural ventilation and sanitary principles code (the user asked to continue in the Jordanian codes without further questions). The page is plain text with small bitmap digits and formulas in the rendered images; the worked example of Appendix D is reproduced by the defaults.

| Source | Used in | Notes |
|---|---|---|
| Equations 1 and 2, Table 5 | `joNvCrack`, case "cracks" | Q = k L dp^0.67 (L/s), k = 0.08 / 0.21 / 0.08 (ranges 0.02 - 0.30, 0.06 - 0.80, 0.005 - 0.20) for sliding, pivoting and pivoting-with-weather-strip windows; large openings Q = Cd A (2 dp / rho)^0.5 with Cd = 0.61 (0.65 in special cases), quoted in the note |
| Equation 5, Table 7 | `joNvWind` | u_r = u_m K z^a at the building height; K / a = 0.68 / 0.17, 0.52 / 0.20, 0.35 / 0.25, 0.21 / 0.33 for open rural, rural with obstacles, outskirts, inside cities |
| Table 8 | `JO_NV_WIND` | mean wind speed and mean of the highest wind speed (m/s) by month and annual for the Jordan Valley and Aqaba, the eastern highlands and the desert (numbers taken from the PDF text layer, checked against the image; the Appendix D value 2.8 m/s is the eastern highlands annual mean) |
| Table 6 | result line "wind pressure" | 0.5 x 1.18 x u_r^2; the printed values (0.59 at 1 m/s and Cp 1, 9.44, 8.67, 59.0 ...) are reproduced by the test; the temperature-difference half of the table (pressures by height) is not used |
| Table 9 (3/5) | `joNvTwo`, case "two openings" | Q_w = Cd A_w u_r dCp^0.5 with 1/A_w^2 = 1/(A1+A2)^2 + 1/(A3+A4)^2; Q_b = Cd A_b (2 dT g H1 / T)^0.5 with 1/A_b^2 = 1/(A1+A3)^2 + 1/(A2+A4)^2; the combined case takes the larger flow (3/5/4); dCp from Table 11 or 1.0 (exposed) / 0.1 (sheltered) (3/5/2) / 0.2 (approximate, 3/6/3) |
| Table 10 (3/6/2) | `joNvSingle`, case "one wall" | wind 0.025 A u_r; two openings Q = Cd A [E sqrt 2 / ((1+E) (1+E^2)^0.5)] (dT g H1 / T)^0.5 with E = A1/A2; one opening Q = Cd (A/3) J(phi) (dT g H2 / T)^0.5; the larger of wind and temperature is taken |
| Table 11 | `JO_NV_CP`, `joNvCp` | Cp of the walls A, B, C, D of a rectangular building at 0 and 90 degrees for 3 height bands (h/w up to 1/2, 1/2 to 3/2, 3/2 to 6) x 2 plan bands (l/w 1 to 3/2, 3/2 to 4) |
| Appendix D | tests | 25 x 10 x 8 m in Amman: u_r = 2.8 x 0.52 x 8^0.2 = 2.2 m/s, A_w = 5.3 m2, Q_w = 7.11 m3/s (7.14 unrounded), 12.8 changes per hour (12.9); 6 K, openings 2.5 + 2.5 and 5.0 + 5.0 m2, H1 = 6 m: A_b = 4.47 m2, Q_b = 4.18 m3/s (4.2), 7.6 changes per hour (7.5) |

🔴 Uncertain:
- Table 11 is a small bitmap table; the digits were read at 3x and the signs of the windward values (+0.7 / +0.8, printed with border artefacts) taken as positive, confirmed by the Appendix D row (0.7 and -0.3 for h/w 0.8, l/w 2.5). The printed bands share their limits (h/w = 1/2 and 3/2, l/w = 3/2): the lower band is taken at the limit. The column at the left of the table (-0.8, -1.0, -1.1, -1.1, -1.2, -1.2, apparently the roof) has no readable header and was not used.
- Table 9, combined effect: the printed switching criterion u_r / sqrt(dT) against 0.26 (A_b / A_w)^? (H1 / dCp)^0.5 has exponents that cannot be read and is printed with "Q = Q_w" under the "less than" branch (the reverse of the physics, 0.26 = sqrt(2 g / 300) is exactly the equality of the two flows); clause 3/5/4 says to take the larger of the two flows, which is what the tool does.
- Table 8: the printed annual mean of the highest speeds of the eastern highlands is 10.3 while the twelve months average 10.46 (all the other annual values agree within 0.06); the printed values are used. Which column is the "design" speed is not stated beyond the example (annual mean of the mean speeds, 2.8 m/s).
- J(phi) of Table 10 for a window with a hinged light opening is read from Figure 8 (curves against the opening angle and the height : width ratio): a graph, not transcribed, so the value is entered by the user (1 = no hinge).
- The code's own worked example rounds A_b to 4.4 in the formula (4.47 in the line above) and Q_b to 4.2.
- Not done in this code: Table 6 (b) pressures by height and temperature difference, Appendix A / B (contaminant concentration, condensation) and Appendix C (examples of air quantities).


## National codes, part 23: Jordanian mechanical ventilation and air conditioning code, Tables 23, 12 and 16 in the cooling load, duct sizing and diffuser calculators

The mechanical ventilation code (PDF "كودة التهوية الميكانيكية", 239 pages) had only its Tables 1 and 2 in the app (parts 1 and 21); this part takes three more of its small tables into the calculators they belong to. Jordan only; the other codes are unchanged. The three tables are plain text in the PDF (the digits of Table 23 are in the text layer and agree with the rendered page).

| Source | Used in | Notes |
|---|---|---|
| Table 23 (heat gain from persons, W per person) | `coolingload` (fields cl_pact, cl_pt; `JO_PPL`, `joPeople`) | six activities x room temperatures 28 / 26 / 24 / 21 C, sensible and latent; replaces the flat 450 BTU/hr per person when internal gains are added (detailed mode, or the office method of the quick mode); default: office and hotel staff at 24 C = 74 + 62 = 136 W. Totals are constant along a row within 2 W (104 - 105, 120 - 121, 134 - 136, 150 - 151, 165 - 166, 299 - 302) |
| Table 12 (recommended maximum air velocities in ducts, m/s) | `ductsizing` (field dt_jo_use; `JO_DUCTV`, `joDuctVel`) | public buildings / industrial columns; main and branch ducts and outdoor air intakes replace the practice limits (supply and return main 5 - 8 or 6 - 12 m/s, branches 2.5 - 3 or 4.5 - 9, outdoor air 2.5 - 4.5 or 5 - 6); the other rows (air washers, heater-to-fan connection, grilles and openings) are in the data and tests only |
| Table 16 (air velocity at the outlet for accepted noise levels) | `diffuserselection` (field df_jo; `JO_OUTV`, `dfJoPick`) | four groups of spaces 1.75 - 2.5, 2.5 - 4.5, 4.0 - 5.0 and 5.0 - 7.5 m/s: choosing one fills the neck-velocity limit with the upper end |

🔴 Uncertain:
- Table 23, the sixth row ("walking at 5 km/h, moderate heavy work") has more latent than sensible heat at 21 C (162 against 138 W); the totals and the monotone columns agree with the other rows, so it is kept as printed. "عمل موضعي" (restaurants) is kept as printed. The table has only four temperature columns: there is no interpolation, the user picks the column (24 C by default, the app's cooling design temperature).
- Table 12: the table has no row for exhaust ducts, so exhaust keeps the practice limit. "Maximum recommended" is read as the upper end of the printed range and the lower end as the lower end of the acceptable band (the existing check flags both too high and too low).
- Table 16: the range is printed with the lower end for quiet use; the upper end is used as the limit (the user can still edit the field). Table 15 (velocities 0.1 - 0.45 m/s, titled "through air grilles" but with the size of occupied-zone air speeds) was not used.
- Table 17 (maximum temperature difference of the supply air by outlet height) is cut off in the PDF (only the 3.00 m and 3.50 m rows, 8 / 11 and 9 / 12 K, are visible): not used.
- Not done in this code: Tables 3 - 11 (duct dimensions and sheet gauges for rectangular and round steel and aluminium ducts), 13 (fitting loss coefficients), 14, 18 (thermal insulation of ducts), 19 - 21 (noise), 22 (refrigerants), 24 - 25 (water flow in pipes, a bitmap table), 26 - 31 (calculation forms and unit conversions).


## National codes, part 24: Jordanian mechanical ventilation code, Tables 4, 5, 6, 8 and 9 (duct sheet thickness) in the duct takeoff

`ductweight` (Jordan only): the sheet thickness of each duct comes from the code instead of the SMACNA gauge table (5/2, "ducts made of steel sheets" and "of aluminium sheets"). The tables are plain text in the rendered pages and were read from the images (the text layer has the numbers but the rows are scrambled).

| Source | Used in | Notes |
|---|---|---|
| Table 4 (rectangular steel ducts, up to 10 m/s and 500 Pa) | `JO_SHEET.rectLow`, `joSheet` | longest side up to 400 / 600 mm 0.6 mm, 800 / 1000 0.8, 1500 / 2250 1.0, 3000 1.2 |
| Table 6 (rectangular steel, 10 - 40 m/s and up to 2500 Pa) | `JO_SHEET.rectHigh` | up to 1000 mm 0.8, 1500 1.0, 1501 and above 1.2 |
| Table 5 (round steel, up to 10 m/s and 500 Pa) | `JO_SHEET.round` | diameter up to 500 mm 0.6, 750 0.8, 1250 1.0, 1750 / 2500 1.2 |
| Tables 8 and 9 (aluminium rectangular / round) | `alRect`, `alRound` | rectangular 0.8 (to 600) / 1.0 (to 1000) / 1.2 (to 2250) / 1.6 (to 3000); round 0.8 / 1.0 / 1.2 / 1.6 / 1.6 for 500 / 750 / 1250 / 1750 / 2500 mm; an aluminium material (2.70 kg/m2 per mm) was added to the Jordanian material list |
| Bottom rows of Tables 4 and 5 (ducts galvanized after fabrication) | `galRect`, `galRound`, field dw_jo_gal | rectangular up to 300 mm 1.2, above 1.6; round up to 300 1.0, to 450 1.2, above 1.6 |

The stiffening data of the same tables (maximum distance between joints and stiffeners with and without a bead or bend, minimum stiffening angle: 3 x 25 x 25 ... 5 x 50 x 50) are not used by the weight calculation; the note says so. Tables 7 and 10 (steel and aluminium connections to equipment at 500 - 1000 Pa: 1.0 / 1.0 / 1.2 / 1.6 mm steel and 1.2 / 1.2 / 1.6 / 2.0 aluminium for 800 / 1000 / 2250 / 3000 mm) were read and not used (they are joint details, not the duct).

🔴 Uncertain:
- The title of Table 8 is printed "of steel sheets" while 5/2 (b) assigns Tables 8, 9 and 10 to aluminium and the thicknesses are the aluminium ones (thicker than Table 4): treated as aluminium.
- "ducts galvanized after fabrication" is my reading of the Arabic word printed under Tables 4 and 5 (hot-dip galvanizing after the duct is made); the thicker values apply to it.
- There is no round table for the high-velocity class: Table 5 is used and the result says so. The aluminium tables exist for low velocities only and are used for both classes.
- The longest side printed bands share their limits (e.g. 600 / 601): the upper limit belongs to the lower row. Sizes above the last row keep its thickness and are flagged (the high-velocity rectangular table has no upper limit).
- Not done in this code: Table 3 (preferred duct dimensions, bitmap-like lists), 11 (gypsum ducts), 13 (fitting loss coefficients), 14 (duct materials), 18 (duct insulation), 19 - 21 (noise), 22 (refrigerants), 24 - 25 (pipe flows).


## National codes, part 25: Jordanian mechanical ventilation code 7/3/1 and Table 18, duct insulation thickness in the duct takeoff

`ductweight` (Jordan only), the insulation and hanger section: the material of Table 18 and the temperature difference of 7/3/1 fill the insulation thickness (fields dw_jo_ins, dw_jo_dt; `JO_DINS`, `joDuctIns`, `dwJoInsPick`).

| Source | Used in | Notes |
|---|---|---|
| 7/3/1 | `joDuctIns` | the equivalent thickness of cork is 25 mm above a difference of 7 degrees between the duct air and the ambient air and 50 mm above 10 degrees (no value is printed below 7) |
| Table 18 | `JO_DINS` | conductivity (W/m.K) of nine insulating materials: cork board 0.040 - 0.043, loose cork granules 0.043 - 0.050, kapok 0.030 - 0.034, mineral slag wool 0.036 - 0.040, expanded rubber (rigid) 0.028, glass wool 0.036, rock wool 0.036 - 0.040, fibreboard 0.050 - 0.064, pressed felt 0.038; density, vapour permeability, water collection, structural strength and fire resistance columns were read and are not used |

Thickness of another material = cork-equivalent x k(material) / 0.043, rounded up to 5 mm, with the upper end of the conductivity range of the material.

🔴 Uncertain: the code states the thickness "equivalent to cork" without naming the conductivity of the reference cork (0.040 - 0.043); the upper end 0.043 is used for the reference and for the material, so the cork board itself gives exactly 25 / 50 mm. Which other materials the code means by "equivalent" is not printed: the conductivity ratio is the tool's reading. The rule 7/3/1 sets no thickness below 7 degrees. The code gives no vapour barrier thickness for ducts. Not done in this code: Table 13 (fitting loss coefficients, a large diagram table), Tables 3 and 11 (preferred duct dimensions, gypsum ducts), 14, 19 - 22, 24 - 25.


## National codes, part 26: Jordanian thermal insulation code, chapters 5 and 6, condensation inside building elements (new calculator `condensation`)

NEW calculator (80th, HVAC 17, card in "air networks" after the natural ventilation one): interstitial condensation of a wall or roof by the vapour pressure method (Glaser) with the data and rules of the thermal insulation code (the earlier parts took Tables 1 - 3, 13 - 16 and 24 / 25 from this code; Tables 17 - 22 were open). The pages are plain text; the digits of Table 17 are in the PDF text layer (checked against the image).

| Source | Used in | Notes |
|---|---|---|
| 5/2/2, 5/2/3 | field "indoor vapour pressure" | the vapour pressure indoors exceeds the outdoor one by 540 N/m2 (3.4 g/kg, ordinary occupancies) or 1080 N/m2 (large kitchens, 6.8 g/kg); or an entered indoor humidity |
| Table 17 | `JO_PSAT`, `joPsat` | saturated water vapour pressure 0 - 30.9 C (31 x 10 values, linear interpolation between tenths); agrees with Magnus within 0.6 %; outside the table the Magnus formula is used and flagged |
| Table 18 | `JO_VAPOUR` | vapour resistivity (MN.s/(g.m)) of 26 materials as ranges; the lower value is the default (5/4: "when the true value is not known the lowest values are taken"), the upper on request |
| Table 22 | `JO_VAPOUR` (8 more rows) | epoxy and melamine paints, polypropylene, PVC films 0.4 / 0.5 mm, PE films 0.10 / 0.30 mm, cold bituminous paint 1.0 mm |
| 5/5 | `joGlaser` | W = 0.005 [(Pi - Ps) / sum Rvi - (Ps - Po) / sum Rvo] kg/m2 with the limit 1.0 kg/m2 (0.5 for condensation in an air cavity or in a highly absorbent insulation) |
| Table 21 | `JO_BARRIER` | maximum permeance of the vapour barrier by the insulation group (resistivity above 2000 / 160 - 2000 / below 160) and the element: group 2 0.06 g/(MN.s) everywhere; group 3 walls 0.06, ceiling underside 0.02, roof back 0.02, metal construction 0.002; group 1 needs none |
| Appendix A, Tables A1 - A4 and A6 | field "climate zone" | the winter design temperature (6 / 10 / 5 / 3 C) and the maximum winter design relative humidity (73 / 63 / 70 / 66 %) of the four zones; the temperatures were already in `JO_ZONES` |

The layers use the Table 15 materials of the U-value calculator for the conductivity (`JO_MATS`) with an automatic suggestion of the Table 18 row (`joVapourGuess`, by the position of the material in the list: stones, bricks, concrete, foam concrete, tiles, plasters, wood and boards, asbestos cement, felt and bitumen, polystyrene by density, polyurethane, mineral and glass fibres, cork boards); every value can be edited. Films of Table 22 need their real thickness.

🔴 Uncertain:
- Table 17 prints 3793 at 27.8 C: a transposition of 3738 (the neighbours 3717 and 3759 fix it); 3738 is used and the result says so.
- The code states the 5/5 formula for the cold face of the insulation; here it is applied at the plane where the vapour pressure exceeds the saturated one by the most (one plane only), and 5/5 gives no drying rule for the summer.
- Table 22 prints polyethylene film 0.10 mm = 350000 and 0.30 mm = 184000 (the thinner film more resistive than the thicker one: possibly swapped); the values are used as printed. The Table 22 values are resistivities (MN.s/(g.m)), so the film thickness must be entered.
- The suggestion of a Table 18 row for a Table 15 material is the tool's mapping (the code does not link the two tables); the row "felt and bitumen 20 mm" is kept as printed.
- Appendix A6 columns were read as winter minimum / maximum and summer minimum / maximum (summer agrees with the values already in `JO_ZONES`).
- Not done in this code: Tables 19 - 20 (puncture resistance and properties of vapour-barrier films, qualitative), 23 (specific heat capacity of materials, chapter 8) and chapter 7 (periodic heat flow, time lag and decrement factor).


## National codes, part 27: Jordanian shelters code, new calculator `shelter` (units, built space, ventilation, sanitary units, water)

NEW calculator (81st, HVAC 18, card after the condensation one): the services side of the shelters code (the user asked to continue in the Jordanian codes; the code was unused). The pages are plain text in the rendered images (the text layer loses most numbers); the structural chapters (wall and slab thicknesses, Tables 7 - 11 and 14 - 32) are not part of this calculator.

| Source | Used in | Notes |
|---|---|---|
| Table 6 (3/2/1) | `JO_SHL`, `joShelter` | shelter units by occupancy: residential 1 per 15 m2 of the total area, health care 1 per bed, hotels 0.5 per bed, restaurants and gathering places 0.5 per seat, places of worship 25 % of the prayer hall area, offices and commercial 1 per office or shop and not below 1 per 20 m2, education 0.67 per seat, industry 1 per 25 m2 (other buildings: the nearest occupancy) |
| 3/2/2 A - C | `joShelter` | at least 1.0 m2 and 2.5 m3 per unit; extra spaces: air lock 0.05 m2 and decontamination room 0.07 m2 per unit, storage 2.00 m2 per shelter room, toilets 1.00 m2 per 25 persons |
| 5/2/2 | `joShelter` | unfiltered mechanical ventilation at least 6.0 m3/h per unit (15 in hot humid regions when cooling devices are not used); with filters 3.0 m3/h per unit; overpressure 50 - 150 N/m2 (5/3/1); 5/2/3: carbon dioxide reaches 2.5 % after about 3 hours when the ventilation is stopped (2.5 m3 of air per person) and 4.0 % after about 5 hours |
| 6/3/4 | `joShelter` | one sanitary unit per 25 shelter units; a portable one is enough up to 25; at least two permanent between 25 and 100; above 100 at least three permanent and separated from the other rooms; at least two units (women and men) for two families or a public shelter; unit 1.20 x 0.75 m |
| 6/4 | `joShelter` | supplies for at least two weeks; drinking water 50 litres per unit (containers of 20 - 50 L), 50 litres per shower; lighting power 5 - 15 W/m2 (6/3 K) |

🔴 Uncertain:
- Table 6 prints "15/1 square metre" for residential (read as one unit per 15 m2) and "25 % of the prayer hall area" for worship (read as 0.25 unit per m2 of that area: the unit of the quantity is not stated).
- 3/2/2 C prints "300 square metres per extraction fan per shelter room", which is unreasonable (perhaps 3.00): not used.
- 3/2/2 D (fixed spaces for small shelters up to 50 units: 0.9 m2 occupied space, 3.5 m2 air-lock and decontamination rooms, ceiling 2.0 - 3.0 m, 1.0 m2 toilet) and the climate requirements of Table 12 (oxygen at least 18 % long / 16 % short period, carbon dioxide at most 1.0 % long / 2.5 % short, the long-period value printed "10 %" read 1.0 % from the text of 5/2/2, temperature and humidity pairs) are in the notes only, not applied.
- The rule for 25 to 100 units (at least two permanent) and for over 100 (at least three, separated) is combined with one unit per 25 units as the larger; the printed text does not say how the two rules combine.
- Not done in this code: the structural tables (thickness of walls and roofs, reinforcement ratios, blast loads, Tables 7 - 11 and 14 - 32), the blast doors and valves, filters and the electrical rules other than the lighting power.


## National codes, part 28: Jordanian acoustics code, Table 20 (recommended noise criteria) in the duct sizing sound check

`ductsizing` (Jordan only): a list of the 12 kinds of space of Table 20 (4/4/2, preferred noise curves: PNC, NC and dB(A)) next to the NC/RC class of the official sound check; choosing a space sets the class (`JO_NOISE`, `joNoiseNC`, `dtJoNoisePick`) and the results quote the three bands of the table. The table is plain text in the rendered pages (PDF pages 79 - 81 of the acoustics code).

| Space (Table 20) | PNC | NC | dB(A) |
|---|---|---|---|
| concert, opera and recital halls | 10 - 20 | 10 - 20 | 20 - 30 |
| broadcast and recording studios (sensitive microphone) | 10 - 20 | 15 - 20 | 25 - 30 |
| large lecture halls, drama theatres, places of worship | 20 max | 20 - 25 | 30 - 35 |
| studios (ordinary microphone) | 25 max | 20 - 25 | 30 - 35 |
| small lecture halls, small theatres, music rooms, large conference rooms | 35 max | 25 - 30 | 35 - 40 |
| bedrooms, hospitals, houses, hotels | 25 - 40 | 25 - 35 | 35 - 45 |
| private offices, small conference rooms, classrooms, libraries | 30 - 40 | 30 - 35 | 40 - 45 |
| living rooms of houses | 30 - 40 | 35 - 45 | 45 - 55 |
| large offices, reception, shops, cafeterias, restaurants | 35 - 45 | 35 - 50 | 45 - 60 |
| waiting halls, laboratories, drawing rooms | 40 - 50 | 40 - 45 | 50 - 55 |
| maintenance and equipment rooms, kitchens, dye works | 45 - 55 | 45 - 60 | 55 - 70 |
| shops, garages, control rooms (speech and phone only) | 50 - 60 | - | - |
| (row 13) workplaces where speech is not needed | 60 - 75 | - | - |

The tool has three NC classes (25, 35, 45): the class is chosen from the upper end of the NC range of the space (up to 25 -> 25, up to 35 -> 35, above -> 45).

🔴 Uncertain: the code prints ranges, not one value; the upper end of the NC range decides the class, so a space with NC 35 - 50 (large offices) is checked as 45 and a range above 45 (equipment rooms, NC up to 60) is flagged as beyond the highest class of the tool. The garages row has no NC curve (the class is not changed) and row 13 (PNC 60 - 75) is not offered. Table 21 (NR curves per octave band for the same environments), the sound insulation tables (2 - 19) and the exposure limits (Table 23) were not used.


## National codes, part 29: Jordanian code of requirements for building for the disabled, 6/7/2 (lifts) in the lift planning

First use of the disabled-access code (PDF "كودةمتطلبات البناء الخاص بالمعوقين", pages 119 - 122 of the PDF); the rest of that code (ramps, doors, toilets, parking, signage) is architectural and is not part of this MEP application. `liftplan` (Jordan only, passenger lifts): the chosen standard car of the lifts code is checked against the accessibility minima and the other rules are listed (`joLiftAccess`, block "access for the disabled" in `liftDimsHTML`).

| Source | Used in | Notes |
|---|---|---|
| 6/7/2 (A) 4 | checks | car at least 1.1 m wide and 1.4 m deep; very large wheelchairs (severe disabilities) 1.8 x 1.8 m |
| 6/7/2 (A) 5 | checks | clear door width at least 0.8 m (1.0 m preferred) |
| 6/7/2 (A) 3, 4, 5, 6 | note | lobby at least 1.5 x 1.5 m (1.8 m deep on ground floors and busy places); handrails at 1.0 m above the floor and 0.04 m from the wall; door closing speed 0.3 m/s (residential, for the disabled) or 0.5 m/s, photocells, open at least 6 s; controls at most 1.6 m (average 1.4 m), for wheelchair users 1.3 m (average 1.05 m), 0.6 m from the car door; touch panels 0.03 m and buttons 0.015 m; hydraulic lifts for exact levelling; lift dimensions per the lifts code except the five-passenger lift |

🔴 Uncertain: the rectangular handrail section is printed "0.75 x 0.10 m" (unreasonable, perhaps in centimetres) and is not quoted; "handrails at 1.0 m" is as printed (a common value is 0.9 m); the sentence about the five-passenger lift is read as "the dimensions follow the lifts code except for the five-passenger lift". The checks use the table values of the lifts code (Cw, Cd, Ew), not the doors of other standards.


## National codes, part 30: Jordanian mechanical ventilation code, Table 13 and 5/3/5 - 5/3/7 (loss coefficients of duct fittings) in the duct sizing

`ductsizing` (Jordan only): a fitting of Table 13 (field dt_jo_fit, count dt_jo_fn, area ratio dt_jo_ar) gives its pressure loss at the velocity of the sized duct, Pa and in.wg (`JO_FIT`, `joFitF`, `joFitLoss`, `joFitHTML`). Table 13 is a figure table in the PDF (page 91 - 93 of the code, drawings of the fittings with a column F): read from the rendered pages.

| Fitting | F |
|---|---|
| 90 degree elbow, sharp / rounded / wide (R = 2D) | 1.5 / 0.5 / 0.1 |
| 45 degree elbow, sharp / rounded / wide (R = 2D) | 0.5 / 0.2 / 0.05 |
| gradual expansion, angle up to 8 degrees | 0.15 [1 - A1/A2]^2 |
| gradual expansion above 8 degrees; sudden expansion | [1 - A1/A2]^2 |
| flow from a duct into a room | 1.0 |
| gradual contraction; sudden contraction; flow from a room into a duct | 0; 0 - 0.35; 0 - 0.35 |
| branching (row 13) | no coefficient printed (refers to rows 7, 6 and 10) |

Pressure loss = F x 0.5 x 1.2 x v^2 (5/3/3: air at 15 C, 60 % RH, 760 mm Hg). The notes list 5/3/5 (static regain about two thirds of the change in velocity pressure), 5/3/6 (site-formed fittings of lined brick + 20 %, lined cement + 10 %) and 5/3/7 (slopes of transitions 1 : 7 or 16 degrees, contraction 3 degrees on four sides or 5 on two, branch angle about 30 degrees, bend radius at least 1.5 duct diameters).

🔴 Uncertain: the ranges 0 - 0.35 of the sudden contraction and of the flow from a room into a duct are printed without a condition (the upper value is used and flagged); the branching row has no value; the density is the 1.2 kg/m3 of the rest of the tool, not the 15 C air (1.22) of 5/3/3. Not done in this code: the rectangular elbow with turning vanes (5/3/7 D, the number of vanes by the radius and the duct size), the dynamic losses of fans and equipment, and Table 3 / 11 (preferred duct dimensions, gypsum ducts).


## National codes, part 31: Jordanian central heating code 2/8/1 and fire protection code 7/4/7 (fuel tanks and the fuel room) in the fuel tank calculator

`fueltank` (Jordan only): a block under the results (`JO_FUEL`, `joFuel`, `joFuelFormHTML`, `joFuelHTML`; optional fields ft_jo_sel, ft_jo_in, ft_jo_area). Pages read from the PDFs (the digits are missing in the text extractions): central heating code pages 39 - 43, fire protection code page 183.

| Rule | Value |
|---|---|
| Main tank, 2/8/1 B | capacity for 21 days at the maximum fuel consumption; level indicator |
| Daily tank, 2/8/1 M 1 and 2 | capacity for the boiler at the maximum load for 24 hours and at most 0.9 m3; above that more than one daily tank; one burner is not connected to more than one daily tank; two or more daily tanks are not connected to each other |
| Daily tank vent pipe, 2/8/1 M 7 | rises above the height of the main tank, diameter at least 32 mm |
| Bund under the tank, 2/8/1 H | leak-proof, floor and walls without a roof, capacity 10 % of the tank capacity |
| Buried tank, 2/8/1 K | plates as in BS 799; bituminous coat at least 3 mm or a rust-resistant paint; no direct burying where water sources may be polluted, where the water table is above the tank bottom, or in acidic soil |
| Fuel room, fire code 7/4/7 A | floor lower than the door threshold (or any other opening) so that the volume of the room below the threshold equals the maximum stored fuel + 10 % |
| Fuel room, 7/4/2, 7/4/3 B, 2/8/1 F | walls, floor and ceiling 2 hours; doors from outside 1 hour; the door at least half the wall resistance, opening outwards, openable from inside without a key |

Results: minimum main tank (21 days x 24 hours x burner L/h), daily tank capacity and the number of daily tanks (daily capacity / 900 L, rounded up), the bund, the room volume below the threshold, and the threshold height for a given floor area. The Syrian clause numbers (7/35, 7/36) and the Syrian checklists are not shown in Jordan; the consumption relations and the fuel values stay from the Syrian code and are labelled so.

🔴 Uncertain: the maximum consumption is not defined by a number (the full burner load for 24 hours a day is taken, as in the daily tank rule; the average-season figures remain as information); the bund is printed "ten percent" of the tank capacity, less than the tank itself although its purpose is to collect all that leaks or overflows, while the fire code asks 110 % of the stored fuel for the whole room (both are shown, the printed 10 % is not changed); the number of daily tanks is derived from 0.9 m3 per tank; the second clause lettered "و" of 2/8/1 is written J in the references (the code letters two clauses "و").


## National codes, part 32: Jordanian central heating code Table 3 and 3/3/2, 3/2/2 (natural-draft chimneys) in the chimney check

`chimney` (Jordan only, `renderChimneyJo`, `calcChimneyJo`, `joChimney`, `joChimneyNoteHTML`; the Syrian check stays for the other codes). Table 3 (page 51 of the code) is a figure-like table: the capacity column and the height columns were read from the rendered page; the row alignment of the lower block (930 - 2900 kW) was checked against the text positions.

| Item | Value |
|---|---|
| Table 3 | suitable area of a natural-draft chimney of light-oil boilers (cm2) by the boiler capacity connected to the chimney (25 - 2900 kW, 32 rows) and the chimney height (6, 8, 10, 12, 15, 20, 30, 40 m; 2 to 5 printed heights per row). E.g. 115 kW: 580 / 560 / 545 / 535 / 520 at 8 / 10 / 12 / 15 / 20 m; 930 kW: 2990 / 2660 / 2540 at 20 / 30 / 40 m |
| Table 3 conditions | CO2 10 %; flue gas velocity 2 - 4 m/s; not very short with a large area, not very long and narrow; 50 % of the areas with fans; the height is of secondary importance compared with the draft |
| 3/3/2 A 2, A 3, A 5 | rectangular side ratio at most 2 : 1; horizontal connector at most 25 % of the vertical chimney (except with mechanical draw); sleeve at least 30 degrees |
| 3/3/2 A 9, B 2, B 3, D | brick chimney: 50 mm still-air gap or rock wool at least 25 mm; draft at least 1.27 mm water at the start; draft stabilizer where the draft exceeds 1.27 mm; boiler room opening at least twice the chimney area |
| 3/2/2 A, B | steel chimney pipes: plate 5 mm below 0.3 m diameter, 6 mm above; cleaning openings of at least 50 % of the pipe section and 7500 mm2; connector plate at least 3 mm |

Lookup: the first row of at least the boiler capacity; between two printed heights the lower height (larger area) is used; above the last printed height of the row the last value is used with a warning; below the first printed height or above 2900 kW no area is given.

🔴 Uncertain: the row printed "1.5" between 90 and 115 kW is read as 100 kW; the value 4336 (30 m, 1630 kW) is printed as it is; the 1.27 mm of water is printed both for the draft at the start and for fitting the stabilizer; the 5 / 6 mm plate rule is printed thicker than the 3 mm of the connector and is applied to the larger side of a rectangular section; "not very short with a large area" has no number. Not done: the draft calculation (the chimney effect), the 0.3 m diameter test on equivalent diameters, Table 3 for other fuels (the code prints light oil only).


## National codes, part 33: Jordanian fire protection code chapter 17 (fire resistance of concrete, Tables 13 - 19): new calculator `concretefire` (CF-01, fire category, now 11 calculators; 82 in all)

`concretefire` (`JO_CF`, `JO_CF_H`, `JO_CF_T17`, `JO_CF_PLAINWALL`, `renderConcreteFire`, `cfBuild`, `calcConcreteFire`, `concreteFireResultsHTML`): element (beam RC / beam PC / slab RC / slab PC / column / wall), required fire resistance (0.5, 1, 1.5, 2, 3, 4 h), the variant (plain, clad, lightweight aggregate ...), then the minimum cover and dimensions of the table and a check of the entered values; the full table row is shown with the chosen hour highlighted. It is available with every code (the data are the Jordanian ones). Tables read from the rendered pages 332 - 341 of the code PDF (the text extraction has the digits but not the cladding thicknesses).

| Table | Content (hours 0.5 / 1 / 1.5 / 2 / 3 / 4, mm) |
|---|---|
| 13 reinforced beams | A plain: cover 15 25 35 45 55 65, width 80 110 140 180 240 280; B 15 mm plaster on light mesh: cover 15 15 20 30 40 50, width 70 85 110 170 210 250; C 15 mm vermiculite-gypsum: cover 15 15 15 15 15 25, width 60 60 85 125 145 170; D lightweight: cover 15 20 30 35 45 50, width 80 100 130 160 200 250 |
| 14 prestressed beams | A plain 25 40 50 65 85 100 / 80 ... 280; B vermiculite 15 mm 15 25 35 45 60 75 / 70 70 100 125 170 210; C vermiculite 25 mm 15 15 25 35 50 65 / 60 60 70 100 140 180; D gypsum on mesh 15 30 40 50 75 90 / 70 85 110 170 210 250; E 15 mm mix 15 25 30 45 60 75 / 60 60 85 125 145 170; F 25 mm mix 15 15 25 30 45 50 / 60 60 70 85 125 140; G lightweight 20 30 40 50 65 80 / 80 100 130 160 200 250 |
| 15 / 16 slabs | RC: solid cover 15 15 20 20 25 25, depth 100 100 125 125 150 150; hollow 20 25 30 40 40 50 under the void, depth 100 110 140 160 175 190; box flange 20 25 30 40 40 50, depth 105 130 155 180 205 230; ribs with blocks 50 70 80 90 100 125; T beams cover 15 25 35 45 55 65, web 60 75 90 115 140 150, flange 90 100 125 125 150 150; ribbed without blocks bottom 15 ... 65, side 10 15 20 25 30 40, rib 30 40 45 60 70 75. PC: solid cover 15 25 30 40 50 65, depth 90 100 125 125 150 150; T beams cover 25 40 50 65 85 100, web 60 90 110 150 200 250; ribbed side cover 15 20 25 35 45 50, rib 30 45 55 75 100 125 (other rows as in the table) |
| 17 soffit cladding | increase of 0.5 / 1 / 1.5 / 2 / 3 h: vermiculite-gypsum on the soffit 10 10 15 15 25; on suspended mesh 10 10 10 10 15; cement or gypsum on suspended mesh 10 10 15 20 25 |
| 18 columns | A 150 200 250 300 400 450; B 15 mm plaster 150 150 150 225 275 300; C 15 mm vermiculite-gypsum 120 120 150 200 225 275; D additional steel 150 190 200 225 275 300; E lightweight 150 150 200 225 275 300 |
| 19 walls | A and B 75 75 100 100 150 180; C 65 65 75 75 100 125; 17/5: vertical steel at least 1 %, cover 15 mm (up to 1 h) or 25 mm; plain walls 150 / 175 / 200 mm for 1 / 1.5 / 2 h |

Rules applied: 17/2/4 and 17/3/5 (no bar cover below half the table value or the 0.5 h value), 17/2/5 (extra mesh of 2 mm wires at 100 mm, 0.5 kg/m2, when the cover exceeds 40 mm), 17/2/6 (T beams: cover x sqrt(b / bw) when bw is at least b / 3; below that the table does not apply), 17/4/4 (additional steel at 20 mm from the surface).

🔴 Uncertain: "or" in 17/2/4 and 17/3/5 is read as both limits (the larger); Table 14 row D prints no plaster thickness; the footnote of Table 17 names slabs A, B, C while the first row names A to D; the table header of Table 15 / 16 prints four hour values for six columns (read as 0.5 to 4); the cover rule of 17/2/6 is applied to the cover only. Not done: interpolation between hours, the explanation of the other aggregates (17/1/4), insulation on the soffit by Table 17 inside the slab check (the table is shown, not added automatically).


## National codes, part 34: Jordanian mechanical ventilation code Table 3 (preferred duct dimensions) in the duct sizing

`ductsizing` (Jordan only, `JO_PREF_ROUND`, `JO_PREF_RECT`, `JO_PREF_OVAL`, `joPrefDe`, `joPref`, `joPrefHTML`): after the calculated diameter, the results list the nearest preferred round size (not smaller than the calculated diameter, with its velocity in m/s) and the four preferred rectangular sizes of smallest area whose equal-friction equivalent diameter De = 1.3 (a b)^0.625 / (a + b)^0.25 is at least the calculated diameter (with velocity), and the whole of Table 3 in the note. Table 3 (page 74 - 75 of the code, 5/2/1 C 3) read from the rendered pages.

| Shape | Preferred sizes (mm) |
|---|---|
| Round (32) | 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 450, 500, 550, 600, 650, 700, 750, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800 |
| Rectangular (25, width x height) | 150x100, 250x100, 200x150, 250x150, 400x150, 200x200, 300x200, 500x200, 600x200, 250x250, 300x250, 500x250, 600x250, 500x300, 700x300, 400x400, 600x400, 700x400, 600x500, 700x500, 700x600, 800x600, 700x700, 800x700, 800x800 |
| Flat oval spiral (41, minor x major) | 150 x 550 to 790 (4), 200 x 520 to 1000 (7), 250 x 570 to 970 (6), 300 x 620 to 940 (5), 350 x 670 to 990 (5), 400 x 640 to 960 (5), 450 x 690 to 930 (4), 500 x 660 to 980 (5), steps of 80 mm |

🔴 Uncertain: the table is a list without any rule for choosing between shapes; the rectangle choice here is by the smallest area (the designer may prefer a flatter section for the ceiling space); the ASHRAE equal-friction formula is the one the tool already uses for rectangular ducts, not a formula of the code. Not done: Table 11 (gypsum ducts: the digits of the wall thickness and the reinforcement length are lost in the print), tables 14 and 19 - 22 (bitmaps).


## National codes, part 35: Jordanian electrical installations code 4/6 (Tables 64 - 69): the unit system for conduits and trunking in `conduitfill`

`conduitfill` (Jordan only; the NEC conduit fill stays for the other codes): `JO_CU`, `JO_CND_SIZES`, `JO_CND_SHORT`, `JO_CND_EFF`, `JO_TRK`, `joCndFactors`, `renderConduitFillJo`, `calcConduitFillJo`, `conduitFillJoResultsHTML`. For PVC single-core cables: each cable has a factor; the sum is compared with the factor of the conduit (16 / 20 / 25 / 32 mm) or of the trunking; the smallest size that equals the sum or follows it is chosen. Pages 211 - 219 of the code PDF (the table digits are in the text extraction; the layout of Table 67 was read from the text positions and the rendered page).

| Table | Content |
|---|---|
| 64 (short straight runs, up to 3 m) | solid 1 / 1.5 / 2.5 mm2 = 22 / 27 / 39; stranded 1.5 / 2.5 / 4 / 6 / 10 = 31 / 43 / 58 / 88 / 146 |
| 65 | conduit 16 / 20 / 25 / 32 mm = 290 / 460 / 800 / 1400 |
| 66 (longer runs or with bends) | 1 / 1.5 / 2.5 mm2 = 16 / 22 / 30 (solid or stranded); stranded 4 / 6 / 10 = 43 / 58 / 105 |
| 67 | conduit factors by length (1 - 10 m) and 0 - 4 bends, in five groups of 16 / 20 / 25 / 32 mm: the factor depends only on L x 2^bends (21 effective lengths from 2 to 40 m): e.g. 8 m: straight 158 / 256 / 463 / 818, one bend 130 / 213 / 388 / 692, two bends 97 / 159 / 292 / 529 |
| 68 (trunking cables) | solid 1.5 / 2.5 = 7.1 / 10.2; stranded 1.5 / 2.5 / 4 / 6 / 10 = 8.1 / 11.4 / 15.2 / 22.9 / 36.3 |
| 69 (trunking) | 75x25 738; 50x37.5 767; 100x25 993; 50x50 1037; 75x37.5 1146; 100x37.5 1542; 75x50 1555; 100x50 2091; 75x75 2371; 100x75 3189; 100x100 4252 |
| 4/6/2 D | other cables and trunking: occupancy factor at most 45 % (the area method: sum of the cable areas / 0.45 against the section of the trunking) |

The five worked examples of 4/6/2 E (six 2.5 mm2 cables in 2.5 m: 16 mm; 8 m with two bends, 6 x 1.5 + 5 x 2.5: 282, 25 mm; 4 m with three bends, 12 x 1 mm2: 25 mm; trunking 40 x 2.5 + 10 x 4 + 5 x 6 = 674.5: 75 x 25; cables of 6.2 / 7.3 / 11.0 mm in trunking: 3052 mm2, 75 x 50) are reproduced by the tests.

🔴 Uncertain: Table 67 has eight odd digits (printed 477 for 177 at 1 m and two bends with 16 mm, 486 for 463, 285 for 286, 273 for 278, 383 for 388, 353 for 358, 338 for 333 and 404 for 401); they are corrected by the pattern of the table (equal cells for equal L x 2^bends) and the model reproduces the other 192 of the 200 printed cells; a length between two printed lengths takes the larger one; the code does not combine the unit system and the 45 % rule (the larger section of the two is shown); Table 68 has no 1 mm2 solid cable. Not done: the cable-use guidance (Tables 62 - 63), the clip spacing of 4/7 (Table 70 and after), the trench factors (13 - 15) and the cable types other than PVC single-core.


## National codes, part 36: Jordanian electrical installations code 4/7/1 and Table 70 (clip spacing of cables) in the cable sizing

`cablesizing` (reference "Jordanian code" only): two fields (cable kind, overall diameter) and a results block `joClipHTML` (`JO_CLIP`, `JO_CLIP_CARAVAN`, `JO_CLIP_KINDS`, `joClip`). Table 70 (page 221 of the code) was read from the rendered page: maximum distance between clips of cables in accessible positions, horizontal / vertical (mm).

| Overall diameter d (mm) | Non-armoured (PVC, rubber or lead sheath) | Armoured | Mineral insulated (copper or lead sheath) |
|---|---|---|---|
| d up to 9 | 250 / 400 | - | 600 / 800 |
| over 9 up to 15 | 300 / 400 | 350 / 450 | 900 / 1200 |
| over 15 up to 20 | 350 / 450 | 400 / 550 | 1500 / 2000 |
| over 20 up to 40 | 400 / 550 | 450 / 600 | - |
| caravans (non-armoured, all sizes) | 150 horizontal / 250 vertical | | |

Rules in the note: horizontal values for runs inclined more than 30 degrees from the vertical, vertical values for 30 degrees or less; the overall diameter of a flat cable is its major axis; above 40 mm and for single-core cables of 300 mm2 or more the manufacturer's instructions apply; cables on wheeled trolleys 250 / 400 (4/7/1 B 1); joists spaced 350 - 400 mm need no extra fixing (B 2); 4/7/1 A: non-armoured cables in conduit without extra fixing in vertical runs up to 5 m (A 1), any cable in trunking without a middle support up to 5 m (A 2), vertical runs supported at the top with 3 m for lead-sheathed and 5 m for rubber or PVC sheathed cables (A 7).

🔴 Uncertain: the caravan column prints values only in the 15 - 20 mm row with the label "all sizes" below it (read as valid for every diameter); the clause letters (A 1, A 2, A 7, B 1, B 2) follow the order of the printed letters. Not done: the cable fixing in conduits and the support rules for trunking and ladders, the clip spacing for other cable families, the minimum bending radii (Table 5).


## National codes, part 37: Jordanian electrical installations code 7/2/4, Tables 71 and 72 (distance between the supports of conduits and trunking) in the Jordanian `conduitfill`

A block under the unit-system results (`JO_SUP_CND`, `JO_SUP_TRK`, `joSupportHTML`): the table of the chosen kind with the row of the chosen conduit diameter (16 / 20 / 25 / 32 mm) or of the chosen trunking section highlighted. Pages 223 - 224 of the code, read from the rendered pages (the band limits of Table 72 are only in the image).

| Table 71, conduits (m, horizontal / vertical) | rigid metal | rigid insulating | flexible |
|---|---|---|---|
| up to 16 mm | 0.75 / 1.00 | 0.75 / 1.00 | 0.30 / 0.50 |
| over 16 up to 25 | 1.75 / 2.00 | 1.50 / 1.75 | 0.40 / 0.60 |
| over 25 up to 40 | 2.00 / 2.25 | 1.75 / 2.00 | 0.60 / 0.80 |
| over 40 | 2.25 / 2.50 | 2.00 / 2.00 | 0.80 / 1.00 (printed "0.100") |

| Table 72, trunking (section mm2) | metal | insulating |
|---|---|---|
| over 300 up to 700 | 0.75 / 1.00 | 0.50 / 0.50 |
| over 700 up to 1500 | 1.25 / 1.50 | 0.50 / 0.50 |
| over 1500 up to 2500 | 1.75 / 2.00 | 1.25 / 1.25 |
| over 2500 up to 5000 | 3.00 / 3.00 | 1.50 / 2.00 |
| over 5000 | 3.00 / 3.00 | 1.75 / 2.00 |

The figures assume that the conduit or trunking is not exposed to other mechanical stresses; they do not apply to trunking that carries lighting fittings or where reinforcing couplers are used; flexible conduit needs supports within 300 mm of a bend or fitting.

🔴 Uncertain: the vertical flexible value over 40 mm is printed "0.100" (read 1.00); the distance from a bend is printed 3000 mm in the note of Table 72 (probably 300 mm as in Table 71, so it is not quoted for trunking); the first band of Table 72 starts at 300 mm2 (no value below). Not done: the support of cables in trunking and of the other raceways (ladders, tray) and the rules of 7/2/1 to 7/2/3.


## National codes, part 38: Jordanian electrical installations code 4/5/5, Tables 12 - 15 (cables in enclosed trenches, methods L, M, N) in the cable sizing

`cablesizing` (reference "Jordanian code", only for the families in air J and K): fields `cs_jo_trench` (none / L / M / N) and `cs_jo_tcol` (the arrangement of the cables, filled by `csJoTrench`); `JO_TRENCH`, `JO_TRENCH_FIX`, `joTrenchFactor`. The factor of the table replaces the "no grouping" of the spaced cables in air and is taken per conductor size inside the selection loop (the factor falls with the size, so a larger cable may be needed). Pages 143 - 148 of the code, headers read from the rendered pages.

| Table | Method (Table 12) | Columns (cables laid in the trench) | Range of factors |
|---|---|---|---|
| 13 | L: trench 450 x 300 mm, cover 100 mm; single-core cables touching in trefoil or spaced one diameter apart, multi-core cables 50 mm apart | 1: two single-core cables or one cable of one core or of three or four cores; 2: three single-core or two double-core; 3: four single-core or two three- or four-core; 4: six single-core or four double-core or three three- or four-core | 4 mm2: 0.93 / 0.90 / 0.87 / 0.82; 630 mm2: 0.77 / 0.71 / 0.65 / 0.56 |
| 14 | M: trench 450 mm wide, cover 100 mm, flat groups of two or three cables, 50 mm between groups | 1: six single-core or four double-core or three three- or four-core; 2: eight single-core or four three- or four-core; 3: twelve single-core or eight double-core or six three- or four-core | 4 mm2: 0.86 / 0.83 / 0.76; 630 mm2: 0.63 / 0.57 / 0.49 |
| 15 | N: trench 600 x 760 mm, cover 100 mm, groups of two or three cables 50 mm apart | 1: twelve single-core or eight double-core or six three- or four-core; 2: eighteen single-core or twelve double-core or nine three- or four-core; 3: twenty-four single-core or sixteen double-core or twelve three- or four-core | 4 mm2: 0.81 / 0.74 / 0.69; 630 mm2: 0.54 / 0.47 / 0.41 |

Rules: the factors apply to the ratings of methods J and K (Table 11); a conductor below 4 mm2 takes the 4 mm2 row; a size between two printed rows takes the larger row (the smaller factor).

🔴 Uncertain: three cells (Table 13, 300 mm2, column 2 blank; Table 15, 300 mm2, columns 1 and 3 printed 0.69 and 0.64, which break the series: 0.61 / 0.57 and 0.48 / 0.44) were replaced by the factor of the lower neighbouring row (0.73, 0.57, 0.44); the column headers of Tables 13 - 15 are read from the images (the third word group of Table 15 column 2 reads "six or twelve double-core" in the text layer and was read as twelve). Not done: the other cable families in trenches (the codes prints only these three methods) and the cable-use guidance of Tables 62 - 63.


## National codes, part 39: Jordanian electrical installations code 4/2/7 B and Table 5 (bending radius of non-flexible cables) in the cable sizing

A results block after the clip spacing (`joBend`, `joBendHTML`), using the same two fields (cable kind and overall diameter, now labelled for both). Table 5 (page 124 of the code, read from the rendered page; the factors are in the image only):

| Cable | Overall diameter d | Factor (x d) = minimum internal radius of the bend |
|---|---|---|
| rubber or PVC, unarmoured, round copper or aluminium conductors | up to 10 mm | 3 (2 for round stranded single-core cables in a conduit or trunking) |
| | over 10 up to 25 mm | 4 (3 in a conduit or trunking) |
| | over 25 mm | 6 |
| armoured (PVC or rubber) | any | 6 |
| PVC with solid or shaped copper conductors, armoured or unarmoured | any | 8 |
| paper insulated, lead sheathed | any | 12 |
| mineral insulated (copper or aluminium sheath, PVC covering or none) | any | 6 |
| flat cables | the factor is multiplied by the length of the major axis | |

4/2/7 B 3: the internal radius of a conduit bend equals that of the cables and is at least 2.5 times the outside diameter of the conduit; 4/2/7 B 2: elbows without inspection openings only at the ends of conduits behind a lighting fitting or at an outlet box, or at positions not more than 500 mm from an easily accessible outlet box in a run of at most 10 m between two outlet points, if the other bends of the run total at most one right angle.

🔴 Uncertain: the third row is printed "PVC (solid or shaped copper conductors)" with the word read as "solid"; the paper insulated row is not selectable by the cable-kind list of the clip table (the lead-sheathed value 12 is quoted in the note); "armoured" is taken for every armoured kind. Test heap: `tests/nationalcodes2.js` now needs `node --max-old-space-size=6144` (set in the npm test script).


## National codes, part 40: Jordanian electrical installations code 4/4/1 D 1 and Table 7 (protection of lampholders) as a note in the cable sizing

A note in the Jordanian `cablesizing` results: the rated current of the overcurrent protective device of a lighting circuit is at most 6 A for the bayonet lampholders B15 and the Edison screw E14, and at most 16 A for B22, E27 and E40, except where the lampholders and their wiring are enclosed in an earthed metal sheath or a non-combustible insulating material or a separate means of overcurrent protection is provided. Page 135 of the code; the values of Table 7 stand one row above their labels in the print and were paired by the row positions (B15 6, B22 16, E14 6, E27 16, E40 16, as in the usual practice for these lampholders).

🔴 Uncertain: the pairing of the values with the lampholder types follows the layout of the page, not a printed grid. Not done: Table 6 (ratings of plugs and sockets: a classification, not a calculation) and the other 4/4 rules.


## National codes, part 41: Jordanian electrical installations code 2/2/1 and Tables 1 and 2 (assumed current demand and coincidence factors) in the maximum demand

`maxdemand` (the method "IET H2", which is the same table): in the Jordan reference the method is named after the Jordanian Table 2 and the form and results carry the Jordanian notes. Two Jordan-only categories are added (`MD_CATS_JO`, `mdCats()`): motors (not lifts) and sockets and points of use in the main rooms. Pages 33 - 38 of the code, read from the rendered pages (the percentages are in the images).

| Table 2 row | Dwelling | Small shops, offices | Small hotels |
|---|---|---|---|
| 1 lighting | 66 % of the total demand | 90 % | 75 % |
| 2 heating and power | 100 % of the first 10 A + 50 % of the rest | largest + 75 % of the rest | largest + 80 % of the next + 60 % of the rest |
| 3 cooking | first 10 A + 30 % of the rest + 5 A with a socket in the control unit | largest + 80 % + 60 % | largest + 80 % + 60 % |
| 4 motors (not lifts) | blank | largest + 80 % of the next + 60 % of the rest | largest + 50 % of the rest |
| 5 instantaneous water heaters | largest + next + 25 % of the rest | the same | the same |
| 6 - 8 thermostatic heaters, floor warming, thermal storage | 100 % | | |
| 9 final circuits | largest + 40 % of each other | largest + 50 % | largest + 50 % |
| 10 sockets and other fixed equipment | largest point + 40 % of each other | largest + 75 % | largest + 75 % of the other points of the main rooms + 40 % of the rest |

Table 1 (assumed current of a point of use): sockets rated up to 2 A 0.5 A at least, others their rating; lighting the equivalent current of the load with at least 100 W per lampholder; discharge lighting the rated watts x 1.8 volt-amperes when exact data are missing (power factor 0.85 with the control gear and the harmonics); clocks, shavers, bell transformers and loads up to 5 VA neglected; a domestic cooker first 10 A + 30 % of the rest + 5 A for a socket in the control unit; other fixed equipment its rating.

🔴 Uncertain: the dwelling column of the motor row is blank in the print (no diversity is applied); the printed columns of row 9 are partly cut (40 % read for dwellings and 50 % for the other two, as in the same table of the IET guidance which this table equals); which sockets belong to the "main rooms" is the designer's decision. Not done: the circuit arrangements (Appendix, ring and radial circuits), the voltage drop check of 2/2/1 (a) and the other points of chapter 2.

## Part 42 - Jordanian Interior Lighting Code, Table 3 (daylight factor and limiting glare index)

Source: code 4/1/1 - 4/1/2 and Table 3 (pages 51 - 58 of the PDF, read from the rendered pages). Used in the `lightingcalc` calculator for Jordan only (`JO_DL`, `joDaylightHTML`, `joDaylightUpdate`; fields lt_jo_dl, lt_jo_dl_avg, lt_jo_dl_min, lt_jo_dl_gi, lt_jo_dl_roof). Table 2 (lamp types) holds no numbers and is not used; the efficacy column of the printed Table 2 is lost in the PDF.

31 rows: [space, average DF %, minimum DF %, measured at, limiting glare index]. Entrance halls 2 / 0.6 / 24; offices 5 / 2 / 23; typing and office machines 5 / 2.5 / 23; school assembly halls 1 / 0.3 / 21; classrooms, drawing rooms, laboratories 5 / 2 / 21; staff rooms 5 / 1.5 / 23; sports halls 5 / 3.5 / 21; museums 5 / 1 / 21; pools 5 / 2 / 23 and surroundings 1 / 0.5 / 23; worship hall 5 / 1 / 21; drawing offices 5 / 2.5 / 21; library reading rooms 5 / 1.5 / 23 and shelves (no average) 1.5 / 23; bank counters 5 / 2 / 23 and public areas 2 / 0.6 / 24; hospital reception 2 / 0.6 / 24, wards 5 / 1 / 21, pharmacies 5 / 3 / 21 - 23; surgery waiting rooms 2 / 0.6 / 24, operating rooms 5 / 2.5 / 21, laboratories 5 / 2 / 22; manual switchboards (no average) 2 / 20; auditoria 1 / 0.6 / 24; corridors and stairs 2 / 0.6 (no glare index); airport reception and customs 2 / 0.6 / 24; circulation areas 2 / 0.6 (no glare index).

Rules built in: all spaces with a daylight factor below 1 % need supplementary electric lighting (table footnote); roof-lit workplaces must not go below 5 % (4/1/2 C), otherwise a supplementary electric system lifts the illuminance to the recommended value; the glare index calculated by the IES method (Technical Report No. 4) must not exceed the table value (4/1/2 D). The calculator compares the entered average, minimum and glare index with the table.

🔴 Uncertain: pharmacy glare index printed 21 - 23 (the smaller, stricter value 21 is used); the measuring place "اللوحة" of the stairs row is read as printed (probably the landing); 4/1/2 C says "the minimum limit of the daylight factor" without saying average or minimum, so the entered average is checked (the minimum if no average is entered). Not done: the IES daylight-factor calculation itself (natural lighting code, 19 lumen-method tables), Table 4 notes on lamp colour appearance.

## National codes, part 43: Jordanian solid waste code (كودة النفايات): new calculator `wastechute` (WST-01, plumbing)

Source: the whole code (chapters 2 - 4, pages 12 - 46 of the PDF, read from the rendered pages because the text layer loses the digits). A new plumbing calculator (`renderWasteChute`, `calcWasteChute`, `wasteChuteResultsHTML`; fields ws_*) that gives the minimum values and checks the entered dimensions against the printed limits (`JO_WS_*` tables). The code has no waste generation rates and no container counts (the competent authority decides them), so none are invented.

| Item | Printed limit |
|---|---|
| chute internal diameter (2/4/5 B, 2/4/6 A) | 450 mm for high buildings, 400 mm for buildings lower than 30 m (and never below 400 mm) |
| vent pipe (2/4/6 B) | the larger of 150 mm and 10 % of the chute diameter; two adjacent chutes with one vent: 10 % of the sum of the two diameters |
| vent end (2/4/4 E) | 400 mm above the parapet or above a roof water tank; 2.5 m on a roof used for recreation; pipe slope not less than 45 degrees |
| chute extension / elbow (2/4/6 B 3, 2/4/5 B) | inclination not less than 60 degrees, section of the inclined part not less than the vertical part; flap of a bifurcated extension not thinner than 5 mm |
| cleaning gates (2/4/3), distances (2/3/2 B, 2/4/1 A) | gates at most three floors apart; chute to the farthest dwelling 20 m; successive chutes of low blocks 40 m |
| hopper (2/5) | inlet opening at most 250 mm high x 350 mm wide; lower edge of the opening at most 750 mm above the floor; waterproof surround 300 mm; shutter gap 20 mm |
| Table 1 frame thickness | wrought steel 2.00, cast iron 8.00, cast aluminium 4.00 mm |
| Table 2 receiving unit (door / side and bottom plates) | mild steel 2.60 / 1.60, cast iron 6.40 / 4.00, cast aluminium 6.40 / 4.00, wrought aluminium 3.30 / 2.00 mm |
| storage room (2/6) | height and floor-to-chute-end distance 2 m (3 m for large containers); chute end at least 25 mm below the ceiling and at most 225 mm above the container rim; floor 100 mm; drain 100 mm; walls 1 hour, door half an hour; carrying distance 15 m (4/4) |
| bulky waste (4/1) | separate ground-floor zone at least 10 m2 x 2.3 m, i.e. 0.3 m3 per person |
| containers (4/2) | cylindrical 1.0 m3, flat-sided 0.75 m3; steel base 3 / sides 1.5 mm, aluminium 6.5 / 3 mm |
| incinerator (chapter 3) | combustion chamber 0.25 m3 at least; capacity 1.5 x the daily volume, standard sizes 0.5 / 1 / 1.5 / 2 / 2.5 / 3 m3; explosion relief 0.1 m2 per 3 m3 of the primary chamber; 1200 C design, 1750 C firebrick; clearances 1.2 m (0.6 m with plates) at the feed door, 0.9 m sides, 1.2 m front; chimney 0.9 m above the roof or 0.6 m above the highest part within 3 m |

🔴 Uncertain: 2/4/5 B (450 mm high buildings) and 2/4/6 A (400 mm) overlap for a building of more than four floors under 30 m: 450 mm is the governing value and 400 mm is shown as a partial pass; the number of cleaning gates is taken as one per three floors; the reduced feed-door clearance is printed 0.3 mm (read as printed); 0.3 m3 per person with the 10 m2 and 2.3 m minimum is the reading of "i.e. 0.3 m3 per person"; the primary chamber volume is taken equal to the standard incinerator capacity when not entered. Not done: figures 1 - 16 (typical details), the technical terms and the unit-conversion tables.

## National codes, part 44: Jordanian building space requirements code (كودة متطلبات الفراغ في المباني), chapter 5 toilet rooms, in the `sanfix` calculator

Source: 5/3 (toilet rooms), 5/4 (vertical clearance), graphs 1 and 2 and Table 7 (pages 47 - 52 of the PDF, read from the rendered pages). The rest of the code was looked at and left: chapter 4 (exit distances and widths, Tables 1 - 6) repeats what the fire code already gives in `egress` and `exitparts`; chapters 6 and 7 (Tables 8 - 19: area per person in restaurants, schools, wards, factories, room areas of dwellings, hotels and dormitories) are architectural space standards that no calculator of the app uses; Table 7 (fixtures per capacity for mosques, health care and dormitories) is the same as the Appendix E counts in `sanfix`.

Added to `sanfix` (all codes, the calculator is Jordanian): fields sf_sa_floor, sf_sa_cls, sf_sa_np, sf_sa_sex; `JO_SA_G1`, `JO_SA_G2`, `joSaInterp`, `joSfAreaCalc`, `joSfAreaHTML`.

| Rule | Value |
|---|---|
| 5/3/1 | each building of fixed use: at least one toilet room with a WC and a basin of at least 2 m2; one for each body sharing the building; the area per sex not below that of one toilet room (residential and up to 30 occupants excepted) |
| 5/3/3 | unknown ratio of the sexes: 1 : 2 for women and men |
| 5/3/4 | men only: area 10 % less (never below 2 m2) with at least one urinal per two WCs; women only: 10 % more |
| 5/3/5 | occupancy under 6 hours: men's WCs may be replaced by one urinal each, urinals not above the WCs (not for educational buildings) |
| 5/3/7 | one WC per 2.5 m2 of toilet room; graph 1 (commercial) and graph 2 (public gatherings other than mosques, theatres, lecture halls, cinemas; 3 m2 per person for the floor area) give the toilet-room area from the floor area |
| 5/4/1 | clear height 2.100 m under tiles, ceiling, beams or hanging objects |

Graph readings (toilet-room area m2 at a floor area of 100 / 200 / ... / 1000 m2): graph 1 1.4, 3.2, 4.9, 6.4, 7.8, 9.2, 10.6, 12.0, 13.4, 14.8 (ends near 1025 m2 at 15.2); graph 2 2.4, 4.4, 6.0, 7.3, 8.4, 9.4, 10.3, 11.2, 11.7, 12.1 (ends at 1000 m2). Obtained by locating the printed curve in the 3x rendered image (accuracy about 0.2 m2).

🔴 Uncertain: the graph values (read by pixel position, the origin of the area axis is about 10 m2 uncertain in graph 2); the code says women : men = 1 : 2 while Appendix E of the natural ventilation code (the counts of the calculator) uses 2 : 1 for the unknown ratio, which the screen points out; Figures 6 and 7 (fixture dimensions and clearances) and Tables 10, 16, 17 not transferred.

## National codes, part 45: Jordanian general safety code in the execution of construction projects, chapter 2: new calculator `sitesafety` (SS-01, plumbing screen)

Source: chapter 2 (working environment), pages 32 - 50 of the PDF, read from the rendered pages (the text layer loses the numbers). A new calculator `renderSiteSafety`, `calcSiteSafety`, `siteSafetyResultsHTML` (fields ss_*, tables `JO_SS_LUX`, `JO_SS_NOISE`, `joSsNoiseHours`); chapters 1, 3 - 7 (contractor duties, material handling, welding, scaffolds, excavation, demolition, blasting, painting, boilers, tools, lifting plant, personal protective equipment, temporary works) are procedural and were not transferred.

| Rule | Value |
|---|---|
| 2/2/1 - 2/2/9 sanitary facilities | one facility = WC with shower + one basin + one urinal; up to 100 workers one per 25 (plus one for any remainder); above 100 one per 35 (plus one for any remainder); vent pipe at least 100 mm at least 25 mm below the WC; washed daily, sterilised twice a week; one hand basin per 5 workers (with nail brush) when lead or toxic materials are used |
| 2/3 drinking water | own pipes at least 2 m from pipes carrying polluted water |
| 2/4/2 first aid | 10 - 100 workers one box and a stretcher; above 100 one box per 100 workers or fraction, and one per group of more than 10 workers working 300 m or more apart; first aider: trained worker up to 100 workers, full-time nurse above 100 |
| 2/5/2 extinguishers | at least one per 300 m2 with at most 30 m to the farthest point; flammable liquids above 0.02 m3 or gases above 0.023 kN in one place: one within 10 m; room storing 0.250 m3: one within 3 m of the door; outdoor store: one 7.5 - 9 m away; may be replaced by a 2 m3 tank with a 30 m x 19 mm hose, 6 m reach, 19 L/min |
| 2/6/4 | 3 m between buildings and stacks of timber and other combustibles; incompatible materials separated by a 1 hour barrier |
| 2/7, Table 4 illuminance | 30 lux external corridors and excavation / fill; 50 lux internal corridors, concrete placing, tunnels; 100 lux walkways, stairs, compressed-air work, interior construction, storerooms, toilets; 300 lux welding |
| 2/9, Table 5 noise | 90 dB 8 h, 92 6, 95 4, 97 3, 100 2, 102 1.5, 105 1, 110 0.5, 115 0.25 h per day; Fe = sum T / L; impact or impulse noise at most 140 dB |
| 2/12 temporary electrical | portable lamps at most 12 V and non-sparking in wet or explosive places; earthing; marking of the maximum voltage; protection of cables from damage |
| 2/13 openings and edges | guard rail 0.5 kN/m, at least 1 m high, opening height at most 0.85 m; toe board at least 150 mm; roof-edge guards at least 0.85 m |

🔴 Uncertain: the first-aid, extinguisher and sanitary counts above 100 workers (read as 4 facilities for the first hundred and one per 35 beyond, because "one per 35 of the whole number" would lower the count above 100); Fe has no printed limit (taken as 1); between two printed noise levels the next higher level (shorter time) is used; "vertical opening height 0.85 m" of 2/13/1 is quoted as printed. Not transferred: the contents lists of the first-aid box and chapter 4/10 boilers.

## National codes, part 46: Jordanian code of building requirements for the disabled, 2/5 - 2/7 and 2/4/4: new calculator `accessreq` (AC-01, plumbing screen)

Source: PDF pages 78 - 130 read from the rendered pages (the text layer loses the numbers). `renderAccess`, `calcAccess`, `accessResultsHTML`; data tables `JO_AC` (77 rows in 8 groups, each row a rule function of the user category), `JO_AC_ARR` (Figures 63 - 67), `JO_AC_LUX`. The user enters the executed values of the items he cares about; each row shows the printed limit and a pass or fail mark, and the limits follow the selected user category (wheelchair or crutches), the wheelchair cubicle arrangement and the door direction. Chapters 2/1 - 2/4 (spaces, ramps, stairs, doors, car parks) and chapter 3 (requirements by building type) are architectural and were not transferred; the lift requirements (6/7/2) are already in the lift planning calculator.

| Group | Rules read |
|---|---|
| WC cubicle | crutch users: width 0.9 m, depth 1.5 m (door out) / 1.7 m (door in) (1.3 / 1.5 with a concealed cistern), door to WC 0.80 m (1.5 m for wheelchair users); wheelchair cubicles 1.5 x 2.0, 1.5 x 1.7, 1.6 x 1.5 (door parallel), 1.5 x 1.8 (door in), 2.1 x 2.1 (assisted from all sides); 1.0 m width for diagonal transfer; wall to basin 0.72 m (0.75 preferred); seat height wheelchair 0.46 - 0.50 (0.475), crutches 0.42 - 0.45 (0.445) (Table 4); seat width 0.45 - 0.50; water level to rim 0.20 - 0.26; back support at most 0.3 m; flush handle at most 1.2 m |
| Basin | rim 0.67 - 0.82 m (0.75) for wheelchairs, about 0.9 m for crutches; clear height below 0.8 m front and 0.7 m rear; 0.35 m to the drain pipe; 0.3 m from the centre line to obstructions; depth 0.2 m |
| Bath | length 1.6 m (1.7), width 0.7 m (0.76), depth 0.35 - 0.40 m, rim about 0.45 m, platform 0.3 m deep (0.4 - 0.6), soap holder within 0.7 m |
| Shower | wheelchair cubicle 1.20 x 1.20 m, others 0.9 x 0.9 m (1.05 deep preferred), seat 0.4 m high and 0.35 m deep, controls 0.9 m, sprayers 1.5 - 1.9 m, shelf 0.65 m, barrier 0.03 m; WC and shower together 1.9 x 1.7 m |
| Rails | tube 0.030 - 0.045 m, 0.040 - 0.065 m from the wall, 150 kg, slope at most 15 degrees, WC rail 0.225 m above the seat and 0.40 m long (0.50 m, lower end 0.2 m from the WC), vertical rail 1.0 - 1.4 m high and 0.4 m long; lifting eyes 140 kg |
| Fittings | drinking fountain rim at most 0.9 m; mirror: crutch users upper edge 1.8 m and lower edge 1.3 m, wheelchair lower edge 0.9 m; medicine cupboard 1.25 m (wheelchair) / 1.55 m; linen cupboard 1.1 m; bidet 0.4 m |
| Electrical | switches 1.00 m high, 0.10 - 0.70 m from the door frame, at least 0.4 m from a corner; pull cord 1.00 m (up to 1.2 m wheelchair, 1.5 m others); acrylic plate 0.2 x 0.2 m; sockets 1.00 m and never below 0.5 m (kitchens 0.2 m above the work surface); boards at most 1.2 m (wheelchair) / 1.5 m; phone shelf 0.75 m, 0.72 m free below, receiver 1.0 m, coin slot 0.9 m, booth 0.9 x 1.2 m; illuminance 110 / 160 / 160 / 215 / 110 / 110 lux (entrances, stairs, sitting rooms, kitchens, bathrooms, bedrooms) and supplementary 750 / 325 / 325 / 160 |
| Heating and windows | appliances able to give 22 C living and dining rooms, 17 C bedrooms, kitchens and circulation (at heights up to 1.0 m) and 21 C at 0.2 m; floor surface at most 24 C (21 C for disabled children); ceiling heating up to 2.4 m; controls at least 0.60 m (0.7 preferred); window sill at most 0.60 m on upper floors, protection 0.85 m, controls at most 1.35 m |

🔴 Uncertain: "in the region of" values (basin rim for crutches, bath rim, shower seat) are checked with a tolerance of 0.05 m or 0.02 m; the two sides of the cubicle figures are taken in the order of the printed width and depth; the kitchen socket height of 1.2 m for non-wheelchair users and the 0.5 m rings of 2/5/1 B are quoted only in the notes. The code gives no limit on the number of accessible fixtures here (chapter 3 not transferred).

## National codes, part 47: Jordanian building water supply code chapter 5, pipe scheduling of sprinkler networks (Tables 11 - 16, 5/5/5 - 5/5/7, 5/6/2) in the `sprinkler` calculator

Source: PDF pages 58 - 68 of the water supply code, read from the rendered pages. A Jordan-only panel in `sprinkler` (`JO_SP_TAB`, `JO_SP_DRY`, `JO_SP_WET`, `JO_SP_BRANCH`, `JO_SP_C`, `JO_SP_VALVES`, `joSpSize`, `joSprinkHTML`, `joSprinkUpdate`; fields spk_jo_*): hazard class + pipe material + number of sprinklers fed -> minimum nominal size, the limit of sprinklers per valve group (wet / dry, with or without accelerator), the branch-line limit, the valve group of Table 16 and the water quantity Q. The tool itself still sizes by NFPA 13. The previous note quoted the ordinary and high hazard schedules as "Tables 13 and 14": they are Tables 13 and 15 (Table 14 is the exceptional case); corrected.

| Rule | Value |
|---|---|
| Table 12 (low hazard) steel | 2 / 3 / 5 / 10 / 30 / 60 / 100 sprinklers on 25 / 32 / 40 / 50 / 65 / 80 / 90 mm |
| Table 12 copper | 2 / 3 / 5 / 12 / 40 / 65 / 115 sprinklers on the same sizes |
| Table 14 (ordinary, spacing above 3.7 m) | steel 15 / 30 / 60 and copper 20 / 35 / 65 sprinklers on 65 / 80 / 90 mm |
| 5/5/5 A, Table 11 | wet: 500 (low) and 1000 (ordinary, high) sprinklers per valve group; dry with accelerator 250 / 500, without 125 / 250 (low / ordinary or high) |
| 5/5/6 | branch line at most 8 sprinklers each side of the cross main (low, ordinary), 6 (high); areas without partitions needing over 100 sprinklers: feed main or riser sized for ordinary hazard |
| Table 16 | wet: main stop + alarm valve; dry: main stop + air valve + compressed-air supply; alternate: main stop + alarm valve + compressed air; pre-action: main stop + pre-action valve + compressed air |
| 5/6/2 | Q = 3.72 C A^0.5 (L/s, A in m2), C 1.5 wooden, 1.0 ordinary, 0.8 non-combustible, 0.6 fire-resistant |

Also read (already in the app): Table 18 (supports, same as the central heating Table 12), 6/1/1 (buried depth 500 mm, expansion joints at most every 10 m).

🔴 Uncertain: Table 11 is printed with the low-hazard limits smaller than the ordinary or high ones (opposite of the usual expectation; used as printed); Table 14 gives only 65 - 90 mm, so the other sizes follow Table 13; the formula Q = 3.72 C A^0.5 is printed for "the unit area of 5/6/1" without more context.
