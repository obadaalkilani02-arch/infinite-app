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
Not available: UAE, Jordan (no code in library). Egyptian fire / plumbing PDFs are scanned images (no text layer).
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
- Not covered: motor circuits (NEC Art. 430), short-circuit withstand, IEC methods E/F/G (free air multi-core), grouping of buried cables (Tables B.52-18/19).
### Heating — heating load and boiler (`heatingload`)
- Syrian Arab Code (HVAC) §3/10/1: Q1 = ΣU·A·Δt, Q2 = 0.342·V·Δt with air changes of Table 15/3, +15 % (10–20 %), hot water Q3 = 1.1641·V·Δt, boiler Q_b = Q_T·(1 + a + b) with a = 0.1, b = 0.2, burner Q_b/(Cv·η) with Cv = 11.6 kW/kg, annual fuel 0.75·Q_H·N·F·C·24/(Cv·η) (N = 150 d, F = 0.33–1, C = 0.6). Indoor winter temperatures of Table 2/3 and city design temperatures of Table 1/3 (Syria mode).
- The extracted formula text of the expansion-tank volume (V = 0.025·Q ÷ Δt?) is ambiguous, so it is not used (the thermal expansion calculator already covers it).
- Default U values are the office assemblies of the U-value calculator and the SBC glazing limit; the temperature-difference factor for unheated neighbours is the designer's decision (not in the code).
### Quotations — BOQ and printable offer (`quotations` section)
Sections → items (description, unit, quantity, unit price), totals with discount and VAT, saved in the browser, JSON and CSV export/import, printable bilingual offer. Optional build-up pricing follows the office sheets (Valves / Equip.: after-discount cost × accessories 15 %, transportation 4 %, installation 10 %, engineering, overhead — percentages are editable defaults, not code values). No code basis applies; no company branding of third-party offers is reproduced.
### Mobile
- The project-information bar was clipped at 200 px (hidden fields on phones): now 640 px and two columns below 420 px. Forms are single-column below 420 px.
