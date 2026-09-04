# /teach console — exact rendered content and shape for S115, segment 6 (Puzzles), position 4

Files read: `C:\Users\MUS\Desktop\CurriculumWwebsitePrototype\app\js\teach\main.js`, `...\app\js\teach\segments.js`, `...\app\js\teach\line.js`, `...\app\teach\index.html`, `...\app\css\teach.css`, `...\app\js\ui\board2d.js`, plus `...\app\js\ui\console.js`, `...\app\css\product.css`, `...\app\css\base.css`, `...\app\css\tokens.css`, `...\app\css\annot.css`, `...\app\data\showcase.json`.

All data below is real: I ran `buildSegments` and `buildLine`/`buildPgn` against `showcase.json`'s `data.S115` under node, so every string is computed, not inferred.

---

## 1. The full DOM tree, in order

Static skeleton is `app/teach/index.html`; JS fills text and appends children. `(h:N)` = index.html line, `(m:N)` = main.js line.

```
body.teach                                                        (h:15)
├─ header#t-top                                                   (h:17)
│  ├─ a.t-back[href="/"][aria-label="Efhaam, home"]               (h:18)
│  │  ├─ span.mark[aria-hidden="true"]                            (h:19)
│  │  └─ span                              → "Efhaam"             (h:20)
│  ├─ div.t-id                                                    (h:22)
│  │  ├─ p.mono.t-crumb                                           (h:23)
│  │  │  ├─ b                              → "Session 115"        (m:280)
│  │  │  └─ span                           → " · Stage 3 Bishop · Level 3B"   (m:283-284)
│  │  └─ h1.t-title                        → "Three-Move Combinations"        (m:285)
│  ├─ div.t-seg.mono[aria-hidden="true"]                          (h:28)  rebuilt m:287-292
│  │  ├─ b                                 → "Puzzles"            (m:288)
│  │  └─ span                              → "6 of 8"             (m:292)
│  ├─ p.t-status.sr[role="status"]                                (h:29)  text via say() m:88
│  ├─ div.t-pick[role="group"][aria-label="Free sessions"]        (h:30)  built m:91-100
│  │  ├─ button[type=button][data-id="S001"][aria-label="S001 The Board & The Rook"][aria-current="false"] → "S001"
│  │  ├─ button[data-id="S042"][aria-label="S042 Fork Mastery"][aria-current="false"]        → "S042"
│  │  └─ button[data-id="S115"][aria-label="S115 Three-Move Combinations"][aria-current="true"] → "S115"
│  └─ div.t-views[role="group"][aria-label="View"]                (h:31)
│     ├─ button[data-view="teach"][aria-pressed="true"][aria-keyshortcuts="T"]  → "Teach"    (h:32)
│     └─ button[data-view="prep"][aria-pressed="false"][aria-keyshortcuts="P"]  → "Prep"     (h:33)
└─ main#t-main[tabindex="-1"]                                     (h:37)
   ├─ div#t-teach.t-grid                                          (h:39)
   │  ├─ aside.t-rail.t-left[aria-label="The session, minute by minute"]        (h:40)
   │  │  ├─ p.t-rail-h.mono                                       (h:41)
   │  │  │  ├─ span                         → "60 min planned · 42 timed"       (m:321-322)
   │  │  │  └─ b                            → "10–12 yrs"  (EN DASH)            (m:323)
   │  │  ├─ ol.t-flow                                             (h:42)  built m:303-316
   │  │  │  └─ li ×8   (li.on = current, li.done = earlier)        (m:326-327)
   │  │  │     └─ button[type=button][aria-label=segLabel][aria-current="step"|"false"]  (m:308-314, 328)
   │  │  │        ├─ span.n                 → "01" … "08"          (m:310)
   │  │  │        ├─ span.l                 → sg.label             (m:311)
   │  │  │        └─ span.m                 → "8m" | "—"           (m:312)
   │  │  └─ div.t-panel.t-pos                                     (h:43)
   │  │     ├─ h3.t-rail-h.mono                                   (h:44)
   │  │     │  ├─ span                      → "This position"  (static, h:44)
   │  │     │  └─ b                         → "S115-P4"            (m:404)
   │  │     ├─ div.t-copy[role="group"][aria-labelledby="t-fen-l"]              (h:45)
   │  │     │  ├─ p.t-field-l.mono#t-fen-l  → "FEN"  (static, h:46)
   │  │     │  ├─ code.t-fen                → the FEN | "—"        (m:405)
   │  │     │  └─ button.t-copy-btn[data-copy="fen"][disabled?] → "Copy FEN"    (h:48, m:406)
   │  │     ├─ div.t-copy.t-copy-pgn[role="group"][aria-labelledby="t-pgn-l"][hidden]  (h:50, m:412)
   │  │     │  ├─ p.t-field-l.mono#t-pgn-l  → "PGN"  (static, h:51)
   │  │     │  ├─ code.t-pgn                → PGN fragment | ""    (m:413)
   │  │     │  └─ button.t-copy-btn[data-copy="pgn"] → "Copy PGN"  (h:53)
   │  │     ├─ p.t-copy-status.mono[role="status"] → "" | "FEN copied" | "PGN copied" | "Copy unavailable"  (m:429,431,436)
   │  │     └─ p.t-note.mono                → 1 of 4 sentences     (m:414-419)
   │  ├─ section.t-stage[aria-label="The board and the question"]  (h:60)   +.no-board when no fen (m:380)
   │  │  ├─ p.t-beat-h.mono                 → "06 / 08 · Puzzles · position 4 of 8 · Core"   (m:351-354)
   │  │  ├─ h2.t-beat-title  (+.long when >130 chars)  → bt.prompt || sg.label               (m:355-359)
   │  │  ├─ div.t-beats[role="group"][aria-label="Positions in this segment"]   (h:63)  built m:361-375
   │  │  │  └─ button[type=button][aria-label="Position n of 8"][aria-current="true|false"] → "1" … "8"
   │  │  ├─ div.t-board-wrap                                      (h:64)
   │  │  │  ├─ div.t-board.board2d[role="img"][aria-label=…]       (h:64; classes+role added board2d.js:32-33)
   │  │  │  │  └─ div.sq ×64  (.sq.l|.sq.d, +.from|.to)  → optional span.co.f / span.co.r / img
   │  │  │  └─ p.t-empty  → "No position for this part of the session."  (m:388, only when !fen)
   │  │  ├─ p.t-caption  (+.clipped)        → "Black to move" (this beat) | sg.body           (m:392-395)
   │  │  └─ p.t-hint.mono → "Left and right step the line. Up and down change position. R reveals the answer."  (static, h:66)
   │  └─ aside.t-rail.t-right[aria-label="Focus, answer and clock"]             (h:69)
   │     ├─ div.t-panel.t-focus  (+.clipped)                      (h:70)
   │     │  ├─ h3.t-rail-h.mono → span "The focus" (static h:71) + b "S115" (m:444)
   │     │  ├─ dl.t-meta                                          (h:72)  rebuilt m:446-456
   │     │  │  ├─ div ├─ dt → "unit"      └─ dd → "5 Advanced Tactics & Sacrifice"  (m:448)
   │     │  │  └─ div ├─ dt → "routine"   └─ dd → "THE PLAN"                        (m:449-450)
   │     │  ├─ p.t-prompt                   → thinking_routine.focus (785 chars)    (m:459-460)
   │     │  └─ p.t-hintline[hidden?]        → "Hint: …"                             (m:461-463)
   │     ├─ div.t-panel.t-solution  (+.locked when body hidden, m:484)             (h:76)
   │     │  ├─ h3.t-rail-h.mono → span "The answer" (static h:77) + b "hidden"|"revealed"|"open"  (m:474)
   │     │  ├─ p.t-sol-lead                 → "Hidden so you can ask the room first." | "Nothing to reveal here."  (m:482, 488)
   │     │  ├─ div.t-sol-body#t-sol-body[hidden?]  (+.clipped)    (h:79)  rebuilt m:485-511
   │     │  │  ├─ p.san                     → bt.sanLine || bt.moves.join(' ')      (m:494)
   │     │  │  ├─ p                         → bt.result                             (m:496)
   │     │  │  ├─ p                         → bt.answer                             (m:497)
   │     │  │  ├─ ul > li ×≤6               → sg.bullets  (only when !bt.answer)     (m:498-501)
   │     │  │  ├─ p.san "What they will play" + ul > li × bt.mistakes                (m:502-506)
   │     │  │  └─ p.san "Ask the room"      + ul > li ×≤5 sg.questions               (m:507-511)
   │     │  ├─ button.t-reveal[aria-expanded][aria-controls="t-sol-body"][aria-keyshortcuts="R"][hidden?]  (h:80, m:478)
   │     │  │  ├─ span.t-reveal-l           → "Reveal answer" | "Hide answer"        (m:480)
   │     │  │  └─ kbd[aria-hidden="true"]   → "R"  (static, h:80)
   │     │  └─ div.t-line[hidden?]                                (h:81, m:519)
   │     │     ├─ h3.t-rail-h.mono → span "Whole line" (static h:82) + b "0/5"      (m:521)
   │     │     ├─ ol.t-plies                                      (h:83)  built m:527-535
   │     │     │  └─ li ×5 > button[type=button][aria-current="step"?]
   │     │     │       ├─ span.no           → "1." "1…" "2." "2…" "3."              (m:532)
   │     │     │       └─ span              → p.san                                 (m:533)
   │     │     └─ div.t-line-btns                                 (h:84)
   │     │        ├─ button[data-ply="start"][aria-label="First move of the line"] → "First"  (h:85)
   │     │        ├─ button[data-ply="back"][aria-label="Previous move"]           → "Back"   (h:86)
   │     │        ├─ button[data-ply="next"][aria-label="Next move"]               → "Next"   (h:87)
   │     │        └─ button[data-ply="end"][aria-label="Last move of the line"]    → "Last"   (h:88)
   │     ├─ div.t-panel.t-controls                                (h:92)
   │     │  ├─ h3.t-rail-h.mono → span "Step the session" (static h:93) + b → **never written by JS, stays empty**
   │     │  └─ div.t-ctl                                          (h:94)
   │     │     ├─ button.t-prev[disabled?]  → "Previous position"  (h:95, m:554)
   │     │     └─ button.t-next[disabled?]  → "Next position"      (h:96, m:555)
   │     └─ div.t-panel.t-clock                                   (h:99)
   │        ├─ h3.t-rail-h.mono#t-clock-h → span "Segment clock" (static h:100) + b "Puzzles" (m:562)
   │        ├─ p.t-time.num                                       (h:101)
   │        │  ├─ b                         → "0:39"               (m:563; static default "0:00" h:101)
   │        │  └─ span                      → "no planned minutes" (m:564-566)
   │        ├─ div.t-bar[role="progressbar"][aria-labelledby="t-clock-h"][aria-valuemin="0"][aria-valuemax="100"][aria-valuenow][aria-valuetext]  (h:102, m:571-574)
   │        │  └─ i  (style.width = "0.0%")                        (m:569)
   │        └─ div.t-ctl                                           (h:103)
   │           ├─ button.t-play             → "Start segment" | "Resume" | "Pause"  (h:104, m:575)
   │           └─ button.t-reset            → "Reset"  (static, h:105)
   └─ div#t-prep.t-prep[role="region"][aria-label="Session plan"][tabindex="0"][hidden]   (h:112)  built m:588-683
```

Also written on load, outside the tree: `document.body.style.setProperty('--rook', '#9070ce')` (m:67-68, `STAGE_HUE[3]` m:16), `history.replaceState(null,'','?s=S115')` (m:69), `document.title = "Three-Move Combinations · free session — Efhaam"` (m:72).

Element-creation helper: `el(parent, tag, cls, text)` — sets `className` only if `cls` truthy, `textContent` only if `text` truthy (m:19-25). So `el(d,'dt','','unit')` produces a bare `<dt>` with no class.

---

## 2. Every text-bearing node — exact string / exact expression

### The strings you named

| Rendered | Node | Expression | Line |
|---|---|---|---|
| `SESSION 115` | `.t-crumb > b` | `` `Session ${L.session_number}` `` → `"Session 115"` | main.js:280 |
| ` · STAGE 3 BISHOP · LEVEL 3B` | `.t-crumb > span` | `` ` · Stage ${L.stage.number} ${L.stage.name} · Level ${L.level.code}` `` → `" · Stage 3 Bishop · Level 3B"` — **leading space is part of the string, not a flex gap** (comment m:281-282) | main.js:283-284 |
| `PUZZLES` (chip) | `.t-seg > b` | `sg.label` = `"Puzzles"` (hardcoded, segments.js:73) | main.js:288 |
| `6 OF 8` | `.t-seg > span` | `` `${S.seg + 1} of ${S.segments.length}` `` → `"6 of 8"` | main.js:292 |
| `06 / 08 · PUZZLES · POSITION 4 OF 8 · CORE` | `.t-beat-h` | `` `${pad(S.seg+1)} / ${pad(S.segments.length)} · ${sg.label}` `` + `` (sg.beats.length>1 ? ` · position ${S.beat+1} of ${sg.beats.length}` : '') `` + `` (bt.difficulty ? ` · ${bt.difficulty}` : '') ``. `pad` = `String(n).padStart(2,'0')` (m:26). `bt.difficulty` = `p.difficulty` = `"Core"` (segments.js:79) | main.js:351-354 |
| `60 MIN PLANNED · 42 TIMED` | `.t-left .t-rail-h > span` | `` `${L.estimated_duration_min} min planned · ${inClassMinutes()} timed` ``. `estimated_duration_min` = 60. `inClassMinutes()` = `S.segments.reduce((a,sg)=>a+(sg.key==='homework'?0:(sg.minutes||0)),0)` = 8+5+7+6+0+0+16+0 = **42** | main.js:321-322; inClassMinutes m:84-85 |
| `10–12 YRS` | `.t-left .t-rail-h > b` | `` `${L.age_band.replace('-','–')} yrs` `` → `"10–12 yrs"`. **`age_band` is `"10-12"` (hyphen) in the data; the render swaps in U+2013 EN DASH.** Uppercased by CSS only | main.js:323 |
| `THIS POSITION` / `S115-P4` | `.t-pos h3.t-rail-h > span` / `> b` | span static `"This position"`; b = `fen ? (bt.tag \|\| '') : 'none'`, `bt.tag` = `p.id` = `"S115-P4"` | index.html:44; main.js:404; segments.js:77 |
| `THE FOCUS` / `S115` | `.t-focus h3.t-rail-h > span` / `> b` | span static `"The focus"`; b = `L.id` = `"S115"` | index.html:71; main.js:444 |
| `UNIT` / `5 Advanced Tactics & Sacrifice` | `.t-meta > div > dt` / `> dd` | `rows[0] = ['unit', \`${L.unit.number} ${L.unit.name}\`]` → `"unit"` / `"5 Advanced Tactics & Sacrifice"`. **dt is uppercased by CSS (teach.css:205); dd is not** | main.js:447-448, 452-456 |
| `ROUTINE` / `THE PLAN` | second `.t-meta > div` | `['routine', (L.thinking_routine && L.thinking_routine.current !== 'none' && L.thinking_routine.current) \|\| '—']` → `"THE PLAN"` — **already uppercase in the data**, not a CSS transform | main.js:449-451 |
| `THE ANSWER` / `HIDDEN` | `.t-solution h3.t-rail-h > span` / `> b` | span static `"The answer"`; b = `bt.gated ? (S.revealed ? 'revealed' : 'hidden') : 'open'`. Puzzle beats set `gated: true` (segments.js:81), so on arrival it is `"hidden"` | index.html:77; main.js:474 |
| `SEGMENT CLOCK` / `PUZZLES` | `.t-clock h3.t-rail-h > span` / `> b` | span static `"Segment clock"`; b = `sg.label` = `"Puzzles"` | index.html:100; main.js:562 |
| `0:39` | `.t-time > b` | `mmss(S.clock.elapsed)`, `mmss = (s) => \`${Math.floor(s/60)}:${pad(Math.floor(s%60))}\``. **Not from data** — `S.clock.elapsed` accumulates `(now - last)/1000` in `tick()` while `S.clock.running`. `0:39` = 39 s after `.t-play` was pressed. Reset to 0 on load (m:66) and on every segment change (m:204). Static HTML default is `"0:00"` | main.js:563; mmss m:27; tick m:578-585 |
| `no planned minutes` | `.t-time > span` | `budget = (sg.minutes \|\| 0) * 60`; Puzzles has **no `minutes` key at all** (segments.js:72-83) → `budget = 0` → falsy branch → literal `'no planned minutes'`. Truthy branch would be `` `/ ${mmss(budget)} planned${over ? \` · over by ${mmss(S.clock.elapsed-budget)}\` : ''}` ``. **Renders lowercase** — `.t-time` carries `num`, not `mono`, so there is no `text-transform` | main.js:560, 564-566 |

### Every other text node

Static, from index.html: `"Efhaam"` (20), `"Teach"` (32), `"Prep"` (33), `"This position"` (44), `"FEN"` (46), `"Copy FEN"` (48), `"PGN"` (51), `"Copy PGN"` (53), `"FEN for a board. PGN for the whole line."` (56, immediately overwritten by m:414-419), `"Left and right step the line. Up and down change position. R reveals the answer."` (66), `"The focus"` (71), `"The answer"` (77), `"Hidden so you can ask the room first."` (78), `"Reveal answer"` (80), `"R"` (80), `"Whole line"` (82), `"First"` (85), `"Back"` (86), `"Next"` (87), `"Last"` (88), `"Step the session"` (93), `"Previous position"` (95), `"Next position"` (96), `"Segment clock"` (100), `"0:00"` (101), `"Start segment"` (104), `"Reset"` (105).

JS-written:

- `.t-title` = `L.title` = `"Three-Move Combinations"` — m:285.
- `.t-pick` button labels = `id`; `aria-label` = `` `${id} ${S.data[id].title}` `` — m:94, 96.
- `.t-flow` rows — m:310-312, table in §3.
- flow `aria-label` = `segLabel(sg,i)` = `` `Segment ${i+1} of ${S.segments.length}: ${sg.label}` + (sg.minutes ? `, ${sg.minutes} minutes` : ', no planned minutes') `` — m:298-300. For row 6: `"Segment 6 of 8: Puzzles, no planned minutes"`.
- `.t-fen` = `fen || '—'` — m:405. This beat, ply 0: `8/p3k3/1q2rpp1/8/1p2R3/8/PPP1Q2P/1K6 b - - 1 30`. `fen` is `(cur && cur.fen) || bt.fen` (m:349) — i.e. the ply-N FEN once stepping.
- `.t-pgn` = `buildPgn(l[0].fen, l, { event: \`${S.id} ${sg.label}${bt.tag ? \` · ${bt.tag}\` : ''}\` })` when `!gated && l.length > 1`, else `''` — m:409-411. Verified output for this beat:
  ```
  [Event "S115 Puzzles · S115-P4"]
  [Site "Efhaam curriculum bundle 1.1.0"]
  [Result "*"]
  [SetUp "1"]
  [FEN "8/p3k3/1q2rpp1/8/1p2R3/8/PPP1Q2P/1K6 b - - 1 30"]

  30... Qg1+ 31. Qe1 Qxe1+ 32. Rxe1 Rxe1# *
  ```
  Tags and numbering from line.js:37-56 — move number seeded from FEN field 6, side from field 2.
- `.t-note` — four mutually exclusive strings, m:414-419: `'FEN for a board. PGN for the whole line.'` (pgn present) / `'FEN for a board. The PGN comes with the answer.'` (line exists but gated — **this is the state on arrival at P4**) / `'FEN for a board. No line on this position.'` / `'Nothing to copy for this part.'`.
- `.t-copy-status` = `` `${kind} copied` `` or `'Copy unavailable'`, cleared after 1600 ms — m:429, 431, 435-438.
- `.t-beat-title` = `bt.prompt || sg.label` — m:356. For P4 (349 chars): *"Black has a queen and rook aimed at the e-file, and White's queen and rook are both stationed there — but Black can use the x-ray relationship between them. The plan is to force White's queen onto a square where Black's rook will already be pointing straight through it. Calculate the battery all the way to checkmate before you move. Mate in three."*  `.long` is toggled at `> 130` chars (m:359). **Measured: all 3 warm-up prompts (158-173), both guided prompts (250, 276) and all 8 puzzle prompts (280-381) exceed 130, so `.long` is on for every beat that has a prompt. Only intro / core / discussion / activity / homework fall back to the segment label and get display type.**
- `.t-beats` buttons = `String(i+1)`; `aria-label` = `` `Position ${i+1} of ${n}` `` — m:367-369. `n = sg.beats.length > 1 ? sg.beats.length : 0` (m:362) → **the chip row is empty for single-beat segments**.
- `.t-caption` = `sg.body && !bt.prompt ? sg.body : parts.join(' · ')` where `parts` = `[\`${turnOf(fen)} to move\`]` + `[\`after ${cur.san}\`]` — m:392-395. Puzzles has no `body` and P4 has a prompt → ply 0 gives `"Black to move"`; ply 1 gives `"White to move · after Qg1+"`. `turnOf = (fen) => fen.split(' ')[1] === 'b' ? 'Black' : 'White'` (m:86). For Core explanation the caption is instead the 1083-char `core.explanation` — that is the box the m:241-246 comment says was cut 62px with no cue.
- `.t-prompt` = `(L.thinking_routine && L.thinking_routine.focus) || L.learning_objective` — m:459-460. 785 chars, 9 sentences, starts *"Before touching a piece, students must trace the entire three-move forcing line in their head…"*.
- `.t-hintline` = `bt.hint ? \`Hint: ${bt.hint}\` : ''`, `hidden = !bt.hint` — m:461-463. P4: `"Hint: Picture your rook waiting behind your queen — if the queen trades herself off, what is the rook looking at?"` All 8 puzzles carry a hint; no other beat type does.
- `.t-sol-body`, revealed, for P4 — m:493-511:
  - `p.san` → `"1.Qg1+ Qe1 2.Qxe1+ Rxe1 3.Rxe1#"` (`bt.sanLine` = `p.solution.san_line`, segments.js:78)
  - `p` → `"Checkmate."` (`bt.result` = `p.solution.result`, segments.js:76)
  - `p` → the 3-sentence `p.explanation` (segments.js:75)
  - bullets branch skipped (`sg.bullets` empty for puzzles **and** `bt.answer` present)
  - `p.san` → `"What they will play"` + `ul` with the 2 `common_mistakes`
  - questions branch skipped (`sg.questions` is only set on the discussion segment, segments.js:58)
- `.t-reveal-l` = `S.revealed ? 'Hide answer' : 'Reveal answer'` — m:480.
- `.t-sol-lead` = `'Hidden so you can ask the room first.'` (m:482) or, when `!has`, `'Nothing to reveal here.'` (m:488).
- `.t-line .t-rail-h b` = `` `${S.ply}/${l.length - 1}` `` → `"0/5"` for P4 — m:521.
- `.t-plies` chips = `span.no` `` `${Math.ceil(n/2)}${n % 2 === 1 ? '.' : '…'}` `` + `span` `p.san` — m:532-533. Verified for P4: `1. Qg1+`, `1… Qe1`, `2. Qxe1+`, `2… Rxe1`, `3. Rxe1#`. **These are line-relative ordinals, not the FEN's move numbers** (the PGN uses 30/31/32).
- `.t-play` = `S.clock.running ? 'Pause' : (S.clock.elapsed ? 'Resume' : 'Start segment')` — m:575.
- `.t-bar` `aria-valuetext` = `` `${mmss(elapsed)} of ${mmss(budget)}` `` or `` `${mmss(elapsed)}, no planned minutes` `` — m:572-574.
- `.t-empty` = `'No position for this part of the session.'` — m:388.
- `.t-status` (sr-only, `role="status"`) — three writers: `goto` m:208-210 → `` `${sg.label}, position ${S.beat+1} of ${sg.beats.length}.` + (bt.prompt ? ` ${bt.prompt}` : '') + (bt.fen ? ` ${turnOf(bt.fen)} to move.` : '') ``; `setPly` m:221-223 → `` `${cur.san}, ${cur.highlight.join(' to ')}. ${turnOf(cur.fen)} to move.` `` or `'Back to the starting position.'`; `toggleReveal` m:158 → `` `Answer shown. ${bt.sanLine || ''}` `` / `'Answer hidden.'`; `setView` m:144 → `'Session plan.'`.
- Board `aria-label` — board2d.js:86, `` `${turn} to move.${last}${list}` ``. Verified for P4 ply 0: `"Black to move. Black pawn on a7, black king on e7, black queen on b6, black rook on e6, black pawn on f6, black pawn on g6, black pawn on b4, white rook on e4, white pawn on a2, white pawn on b2, white pawn on c2, white queen on e2, white pawn on h2, white king on b1."` Piece order is grid order, rank 8 → rank 1, a → h.

Fields `segments.js` computes that **main.js never renders**: `stars` (segments.js:80), `themes` (81), `sideToMove` (79).

---

## 3. segments.js → the numbered flow rows

`buildSegments(lesson)` (segments.js:14-107) pushes up to eight objects in fixed source order. Each row's three spans come from `buildFlow` (main.js:303-316): `span.n` = `pad(i+1)`, `span.l` = `sg.label`, `span.m` = `` sg.minutes ? `${sg.minutes}m` : '—' ``.

Verified output for S115 (`segments.length === 8`):

| n | label (exact) | minutes source | m | key | beats | guard |
|---|---|---|---|---|---|---|
| 01 | `Warm-up` | `flow.warmup_review.duration_min` = 8 | `8m` | `warmup` | 3 | `review && (review.description \|\| (review.review_items \|\| []).length)` — segments.js:21 |
| 02 | `Introduction` | `flow.lesson_introduction.duration_min` = 5 | `5m` | `intro` | 1 (`[{}]`) | `if (intro)` — 33 |
| 03 | `Core explanation` | `flow.core_explanation.duration_min` = 7 | `7m` | `core` | 1 — `demonstrations` is `[]`, `orOne` substitutes `[{}]` | `if (core)` — 43 |
| 04 | `Discussion` | `flow.guided_discussion.duration_min` = 6 | `6m` | `discussion` | 1 (`[{}]`) | `if (disc)` — 53 |
| 05 | `Guided practice` | **no `minutes` key is written at all** (segments.js:63-68) → `undefined` | `—` | `guided` | 2 | `if ((flow.guided_examples \|\| []).length)` — 62 |
| 06 | `Puzzles` | **no `minutes` key** (72-83) → `undefined` | `—` | `puzzles` | 8 | `if ((lesson.puzzles \|\| []).length)` — 71 |
| 07 | `Calculate-Out-Loud Combination Game` | `lesson.practical_activity.duration_min` = 16 | `16m` | `activity` | 1 | `if (act)` — 87 |
| 08 | `Homework` | `minutes: null`, written explicitly (101) | `—` | `homework` | 1 (`[{}]`) | unconditional — 100 |

Labels 01-06 and 08 are **hardcoded string literals** in segments.js (lines 23, 35, 45, 56, 64, 73, 101). Only row 07 comes from data: `label: act.name || 'Activity'` (89) → `"Calculate-Out-Loud Combination Game"`, which is `practical_activity.name` verbatim — **not lowercased** (contrast console.js:105, which does `.toLowerCase()`).

`orOne = (beats) => (beats.length ? beats : [{}])` (segments.js:12) — the stepper needs ≥1 beat per segment.

Beat shapes:
- warm-up (25-28): `{fen, prompt, answer, tag: it.revisits ? \`revisits ${it.revisits}\` : undefined, gated: true}`. S115 tags: `"revisits Mate-in-two calculation (knight check + rook)"`, `"…(rook lift)"`, `"…(Arabian-style knight + rook)"`. **No `moves`, so no steppable line and no PGN.**
- guided (65-67): `{fen, prompt, answer: g.answer || g.walkthrough, gated: true}` — also no `moves`.
- puzzles (74-82): `{fen, moves, prompt, answer: p.explanation, tag: p.id, result, sanLine, sideToMove, difficulty, stars, mistakes, themes, hint, gated: true}`. S115 tags `S115-P1`…`S115-P8`; difficulties `Foundation, Foundation, Core, Core, Core, Challenge, Challenge, Challenge`; every puzzle has exactly 5 `solution.moves`.
- activity (93): `{fen: act.starting_fen, answer: act.success_criteria}` — S115 has **no `starting_fen`**, so this beat renders `.t-stage.no-board` + `.t-empty` (comment segments.js:90-92 says 124/213 bundle sessions have one but none of the three free ones).
- homework (100-105): `body` = `` `${(hw.online_practice||[]).length} online, ${(hw.over_the_board||[]).length} over the board · ${hw.estimated_time_min||0} min at home` `` → `"2 online, 2 over the board · 15 min at home"`; `bullets` = the four practice strings concatenated.

Segment bodies (the `.t-caption` source when the beat has no prompt): warm-up 349 ch, intro 341 ch (`intro.hook`), core 1083 ch (`core.explanation`), discussion 283 ch, activity 441 ch (`act.setup`), homework 43 ch. Guided practice and Puzzles have **no body**.

---

## 4. The board

**Same module, same class, different CSS.** teach imports `Board2D` from `/js/ui/board2d.js` (main.js:1) and constructs it **once at boot** against the pre-existing `<div class="t-board">`: `S.board = new Board2D(q('.t-board'))` (main.js:50). The constructor adds `board2d`, sets `role="img"`, and appends 64 `<div class="sq">` (board2d.js:32-40). No `opts`, so `flip = false` — **the board is never flipped, so S115-P4 is drawn white-at-bottom even though Black is to move.** `render(fen, highlight)` (board2d.js:49-87) re-classes each square `sq l|d`, adds `.from` to `highlight[0]` and `.to` to the rest, appends `span.co.f` on rank 1 and `span.co.r` on file a, appends `<img src="/assets/cburnett/{w|b}{PNBRQK}.svg" alt="" decoding="async">`, and rewrites the container `aria-label`.

The main page uses the identical module (console.js:2) but constructs it on a `div.b-slot` (console.js:157), so the element is `<div class="b-slot board2d">`.

The differences are entirely in stylesheet and driver:

| | /teach (teach.css:182-199) | main page (product.css:90-108) |
|---|---|---|
| sizing owner | `.t-board { width: min(100%, 68vh) }` (164); desktop `width: min(100cqw, 100cqh)` with `.t-board-wrap { container-type: size }` (376-377) | `.board2d { width: auto; height: min(100%, 100cqw); max-width: 100%; min-width: 0; margin: 0 auto }` inside `.pane-board { container-type: inline-size }` (88-89) |
| light square | `#e8dcc4` (186) | `#cfc3ac` (97) |
| dark square | `#a98a63` (187) | `#6f6152` (98) |
| destination ring | `inset 0 0 0 5px var(--accent)` (193) | `inset 0 0 0 4px var(--hue)` (103) |
| origin/dest ink ring | `outline: 3px solid #17120e; outline-offset: -3px` (191-192) | identical (101-102) |
| coordinates | `0.56rem`, `rgb(24 16 10 / 0.9)`, ls `0.04em`, offsets 3px/1px (194-197) | `0.44rem`, `rgb(20 18 14 / 0.5)`, ls `0.06em`, offsets 2px/1px (104-107) |
| pieces | `inset: 5%; width/height 90%; drop-shadow(0 2px 5px rgb(0 0 0 / 0.4))` (198-199) | `inset: 6%; width/height 88%; drop-shadow(0 2px 4px rgb(0 0 0 / 0.45))` (108) |
| entrance | none — static | `opacity: var(--k2); transform: scale(calc(0.96 + var(--k2) * 0.04))` (95) |
| hue token | `var(--accent)` → `var(--rook)`, which main.js:68 rewrites per session (`#9070ce` for S115) | `var(--hue)`, written per frame by the scroll director |
| what drives re-render | `renderBoard()` on beat / ply / reveal change (m:344-398), plies from `buildLine` (line.js:12-29) | scroll position: `k = clamp((t - 0.4)/0.34)`, `step = open ? min(frames.length-1, floor(k*frames.length)) : 0`, frames built inline with `chess.move()` (console.js:65-90) — and only while the answer is open |

`app/index.html` loads tokens, base, acts, product, terms, annot (lines 18-23) — **not teach.css**. So `.board2d` on the main page resolves to product.css's rules and `.t-*` has no styling at all.

`parseFen` is exported and also consumed by `app/js/ui/compare.js:2`, whose comment (compare.js:264-269) notes it deliberately does *not* use `.board2d` because act 4's gate measures assert that class.

---

## 5. Keyboard shortcuts and interactive controls

### Keyboard — `onKey`, one `keydown` listener on `window` (main.js:129, 161-188)

Guards, in order:
1. `if (e.metaKey || e.ctrlKey || e.altKey) return` — m:162.
2. `if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || (t && t.isContentEditable)) return` — m:164-165.
3. `const inConsole = q('#t-main').contains(t) || q('#t-top').contains(t)` — m:170. Header counts on purpose: scoping to `#t-main` alone left R and P dead after a coach clicked a session pill (comment m:166-169).

| Key | Effect | Gate | Line |
|---|---|---|---|
| `t` / `T` | `setView('teach')` | `inConsole` | 171 |
| `p` / `P` | `setView(S.view === 'prep' ? 'teach' : 'prep')` | `inConsole` | 172-175 |
| — | `if (S.view === 'prep') return` — everything below is teach-only, so every key that scrolls a document keeps scrolling it | | 177 |
| `r` / `R` | `toggleReveal()` | `inConsole` | 178 |
| `ArrowRight` | `setPly(Math.min(last, S.ply + 1))` + `preventDefault()` | `canStep()` | 184 |
| `ArrowLeft` | `setPly(Math.max(0, S.ply - 1))` + `preventDefault()` | `canStep()` | 185 |
| `ArrowDown` | `stepBeat(1)` + `preventDefault()` | `!scrolls` | 186 |
| `ArrowUp` | `stepBeat(-1)` + `preventDefault()` | `!scrolls` | 187 |

`scrolls = document.documentElement.scrollHeight > innerHeight + 1` (m:183) — below 1100px the page scrolls and Up/Down are left to the browser. **Arrows are not gated by `inConsole`.** `canStep = () => line().length > 1 && !(beat().gated && !S.revealed)` (m:82) — stepping waits for the reveal. Declared in the markup as `aria-keyshortcuts`: `T` (index.html:32), `P` (33), `R` (80).

Focus: `q('#t-main').focus({ preventScroll: true })` on the first frame (m:57), and again on leaving prep if focus was inside it (m:145); prep gets focus on open because it has nothing focusable inside (m:144, comment 142-143).

### Controls

| Control | Handler | Wiring | State |
|---|---|---|---|
| `a.t-back` | none — plain `href="/"` | index.html:18 | — |
| `.t-pick button` ×3 | `load(id)` | m:97 | `aria-current` = `String(b.dataset.id === S.id)` (m:294) |
| `.t-views button` ×2 | `setView(b.dataset.view)` | m:103-105 | `aria-pressed` (m:140) |
| `.t-flow li > button` ×8 | `goto(i, 0)` | m:314 | `.on` / `.done` on the `li`, `aria-current="step"\|"false"` on the button (m:326-328) |
| `.t-beats button` ×n | `goto(S.seg, i)` | m:370 | `aria-current` (m:374); rebuilt only when count or `dataset.seg` changes (m:363) |
| `.t-copy-btn[data-copy="fen"]` | `copy(btn)` → `navigator.clipboard.writeText(q('.t-fen').textContent)` | m:126-128, 423-439 | `disabled = !fen` (m:406); `.ok` for 1600 ms |
| `.t-copy-btn[data-copy="pgn"]` | same, reads `.t-pgn` | m:126-128 | parent `.t-copy-pgn` `hidden = !pgn` (m:412) |
| `.t-reveal` | `toggleReveal()` → flips `S.revealed`, resets `S.ply = 0` when hiding, re-runs board/solution/line/transport/markScrollers, announces | m:108, 148-159 | `hidden = !has \|\| !bt.gated` (m:478); `aria-expanded` (479). Never leaves the DOM (comment m:476-477) |
| `.t-plies button` ×(l-1) | `setPly(n)` | m:534 | `aria-current="step"` on the active one (m:539-540); rebuilt only when `ol.dataset.key !== \`${S.id}:${S.seg}:${S.beat}\`` (m:523-524) |
| `.t-line-btns button` ×4 | `setPly(clamp({start:0, back:S.ply-1, next:S.ply+1, end:last}[b.dataset.ply]))` | m:118-125 | `disabled = !stepping \|\| at that end` (m:550-553) |
| `.t-prev` / `.t-next` | `stepBeat(-1)` / `stepBeat(1)` | m:106-107 | `disabled` at the two ends of the whole session (m:554-555) |
| `.t-play` | `S.clock.running = !S.clock.running; S.clock.last = performance.now(); renderClock()` | m:109-113 | label m:575 |
| `.t-reset` | `S.clock = {running:false, elapsed:0, last:0}; renderClock()` | m:114-117 | — |
| `#t-prep` | `tabindex="0"` scroll container; Escape is **not** handled here (unlike console.js:428-430) | index.html:112 | `hidden = v !== 'prep'` (m:138) |

Non-input machinery: `requestAnimationFrame(tick)` clock loop (m:58, 578-585); `ResizeObserver` on `CAPPED = ['.t-focus', '.t-sol-body', '.t-caption']` toggling `.clipped` when `scrollHeight > clientHeight + 1` (m:247-269), falling back to a `resize` listener where `ResizeObserver` is missing (m:266); `keepCurrentVisible()` centring the active flow row in the horizontal scroller below 1100px (m:335-342).

Stepper wrap-around: `stepBeat` walks segment boundaries rather than stalling (m:191-199); `goto` resets `ply`/`revealed` always and the clock **only when the segment changed** (m:203-204).

---

## 6. The CSS

Root font-size is browser default **16px** — neither tokens.css nor teach.css sets `html { font-size }`, and `body.teach { font-size: 16px }` (teach.css:31) affects `em`/inheritance only. So `1rem = 16px` on both routes (base.css:14 sets `body { font-size: 17px }` on the main page, which changes `em` padding and inherited sizes but not `rem`).

### Local token block — `body.teach` (teach.css:13-35)

```
--fg: #f4efe4          --ground: #110f0e     --line:   rgb(214 181 143 / 0.16)
--fg-dim: #cdbca9      --panel: #1a1613      --line-2: rgb(214 181 143 / 0.5)
--fg-faint: #9c8875    --panel-hi: #221b16   --accent: var(--rook)
```
`--line-2` is 0.5 and not 0.3 deliberately: "this is the only boundary most of the controls have, and 0.3 composites to 1.93:1 against `--ground`" (comment teach.css:21-23). `--sans / --mono / --display` come from tokens.css:44-46. `--accent` resolves through `--rook`, which main.js:68 overwrites on `body.style` → **`#9070ce` for S115** (`STAGE_HUE[3]`, m:16), not tokens.css's `#d2604b`.

These names all exist on the main page with **different values** (`--fg-dim: #b8ae9d`, `--fg-faint: #7b7387`, `--line: rgb(244 239 228 / 0.11)`, `--line-2: rgb(244 239 228 / 0.24)`, tokens.css) and the main page uses `--hue`, not `--accent`.

`body.teach` is itself `display: grid; grid-template-rows: auto minmax(0, 1fr)` (teach.css:34) — header row, console row.

`.mono` (teach.css:37-38): `font-family: var(--mono); letter-spacing: 0.16em; text-transform: uppercase; font-size: 0.66rem; font-weight: 500`. **base.css:107-113 defines the same class with `letter-spacing: 0.19em`** — a collision if teach markup is dropped onto the main page. `.num` (39): `font-family: var(--mono); font-variant-numeric: tabular-nums`. `[hidden] { display: none !important }` (46) is load-bearing: several panels declare `display: grid`, which otherwise beats the UA `[hidden]` rule (comment 43-45).

### `.t-grid` at desktop

```css
.t-grid {                                                        /* teach.css:89-93 */
  height: 100%; min-height: 0;
  display: grid; gap: 1px; background: var(--line);
  grid-template-columns: minmax(220px, 0.86fr) minmax(0, 1.9fr) minmax(240px, 1fr);
}
.t-rail, .t-stage {                                              /* 94-96 */
  background: var(--ground); min-width: 0; min-height: 0;
  padding: clamp(10px, 1vw, 16px); display: grid; align-content: start;
  gap: clamp(8px, 0.9vh, 14px); overflow-y: auto; scroll-padding-block: 4px;
}
```
The 1px `gap` over `background: var(--line)`, with each rail painting `var(--ground)`, is what draws the two hairline gutters. Scrollbars: `width: 6px`, thumb `var(--line-2)` (97-98).

Desktop gate — `@media (min-width: 1100px), (min-width: 700px) and (min-height: 800px)` (teach.css:364-378):
```css
body.teach { height: 100vh; overflow: hidden; }
.t-grid  { height: 100%; }
.t-rail, .t-stage { overflow-y: auto; }
.t-left  { grid-template-rows: auto minmax(0, 1fr) auto; }        /* header, flow, .t-pos */
.t-right { grid-template-rows: auto minmax(8rem, 1fr) auto auto; }/* focus, solution, controls, clock */
.t-stage { grid-template-rows: auto auto auto minmax(0, 1fr) auto auto; }
.t-focus { max-height: 26vh; align-content: start; overflow-y: auto; min-height: 0; }
.t-solution { min-height: 0; }
.t-board-wrap { container-type: size; }
.t-board { width: min(100cqw, 100cqh); }
```
Every row that must hold something inside a fixed-height box is `minmax(0, 1fr)`, never `auto` (comment 356-363). `container-type: size` needs a definite height, which is why this block and `height: 100vh` travel together and are gated on having the room. `@media (min-width: 1100px)` alone adds `.t-flow { align-content: start; overflow-y: auto; min-height: 0 }` (379-381). `.t-focus` is re-capped at `20vh` under 820px tall (398-400, which also cuts `.t-plies` to `3.8em`) and `42vh` above 1000px tall (404-406).

Other breakpoints: `≤1099px` single column, order left/stage/right = 1/2/3, `.t-flow` becomes a masked horizontal scroller, `.t-seg { display: none }` (327-354). `700-1099px & ≥800px tall` two columns `minmax(0,1.5fr) minmax(250px,1fr)` with `.t-left` spanning both (388-393). `≤560px` (408-413).

### The exact declarations you asked for

| Selector | Declarations | Line | rem→px |
|---|---|---|---|
| `.t-rail-h` | `margin: 0; display: flex; justify-content: space-between; gap: 8px; color: var(--fg-faint); font-size: 0.62rem` — plus `.mono`'s mono family, `letter-spacing: 0.16em`, `uppercase`, `weight 500`. **`.t-rail-h` (100) is later than `.mono` (37) at equal specificity, so 0.62rem wins over 0.66rem.** `h3.t-rail-h { font-weight: 500 }` (102). `.t-rail-h b { color: var(--accent); font-weight: 500; text-align: right }` (103) | 100-103 | 9.92px; b = `#9070ce`; span = `#9c8875` |
| `.t-flow li` | no own rules at desktop. `ol.t-flow { list-style: none; margin: 0; padding: 0; display: grid; gap: 2px }` (109). `.t-flow button { width: 100%; text-align: left; background: transparent; border: 0; border-left: 2px solid transparent; padding: 0.62em 0.7em; display: grid; grid-template-columns: 1.9em 1fr auto; gap: 8px; align-items: baseline; color: var(--fg-dim); transition: background 180ms, color 180ms, border-color 180ms }` (110-115). `.n` and `.m`: `font-family: var(--mono); font-size: 0.56rem; color: var(--fg-faint)` (117, 119) — **no `text-transform`**. `.l`: `font-size: 0.86rem; line-height: 1.24` (118), sans, **mixed case**. `li.on button { background: #2a2119; color: #fff8ee; border-left-color: var(--accent) }` (122-123) — `#2a2119` rather than `--panel-hi` "so the accent numerals clear 4.5:1 at every stage colour, purple included" (comment 120-121). `li.on .n, li.on .m { color: var(--accent) }` (124). `li.done .n { color: var(--fg-dim) }` (125). Hover: `background: var(--panel); color: var(--fg)` (116) | 109-125 | `.n`/`.m` 8.96px, `.l` 13.76px |
| `.t-crumb` | `margin: 0; color: var(--fg-faint)` — size/spacing all from `.mono`: mono, `0.66rem`, `0.16em`, uppercase, 500. `.t-crumb b { color: var(--accent); font-weight: 500 }` | 66-67 | 10.56px; b `#9070ce` |
| `.t-title` | `margin: 2px 0 0; font-size: 0.95rem; font-weight: 500; letter-spacing: -0.01em; color: #fff8ee; white-space: nowrap; overflow: hidden; text-overflow: ellipsis` — inherits `var(--sans)` | 68-69 | 15.2px |
| `.t-beat-h` | `margin: 0; color: var(--fg-faint); font-size: 0.58rem` + `.mono` (mono, `0.16em`, uppercase, 500) | 147 | 9.28px, `#9c8875` |
| `.t-beat-title` | `margin: 0; font-family: var(--display); font-weight: 400; font-size: clamp(1.2rem, 1.9vw, 1.85rem); line-height: 1.04; letter-spacing: -0.022em; font-variation-settings: 'opsz' 72, 'SOFT' 0, 'WONK' 0`. `.long`: `font-family: var(--sans); font-size: clamp(0.95rem, 1.05vw, 1.1rem); font-weight: 400; line-height: 1.4; letter-spacing: -0.005em; color: #fff8ee; max-height: 9lh; overflow-y: auto` | 148-155 | 19.2-29.6px display; 15.2-17.6px long |
| `.t-beats button` | `background: transparent; border: 1px solid var(--line-2); font-family: var(--mono); font-size: 0.6rem; padding: 0.32em 0.6em; color: var(--fg-dim); min-width: 2em; transition: all 180ms`. Hover `border-color: var(--accent); color: var(--fg)`. `[aria-current='true'] { background: var(--accent); border-color: var(--accent); color: #160d09 }`. Container `.t-beats { display: flex; gap: 4px; flex-wrap: wrap }` (156) | 156-162 | 9.6px |
| `.t-caption` | `margin: 0; font-size: 0.88rem; line-height: 1.45; color: var(--fg-dim); max-width: 62ch; max-height: 11lh; overflow-y: auto` | 171-172 | 14.08px, `#cdbca9` |
| `.t-hint` | `margin: 0; color: var(--fg-faint); font-size: 0.58rem; letter-spacing: 0.14em` + `.mono`'s uppercase and mono family (`.t-hint` at 173 overrides `.mono`'s 0.16em) | 173 | 9.28px |
| `.t-meta` | `dl`: `margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px`. `> div { border-top: 1px solid var(--line); padding-top: 5px; display: grid; gap: 1px }`. `dt { font-family: var(--mono); font-size: 0.56rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--fg-faint) }`. `dd { margin: 0; font-family: var(--mono); font-size: 0.8rem; color: var(--fg); overflow-wrap: anywhere }` — **dd is not uppercased** | 202-207 | dt 8.96px, dd 12.8px |
| `.t-reveal` | `background: transparent; border: 1px solid var(--accent); color: var(--fg); padding: 0.7em 0.8em; font-size: 0.82rem; transition: all 180ms`; hover `background: var(--accent); color: #160d09`; `kbd { font-family: var(--mono); font-size: 0.62rem; opacity: 0.7; border: 1px solid currentColor; padding: 0 0.3em; margin-left: 0.4em }`. Placed `grid-row: 4` (229), or `grid-row: 3` under `.t-solution.locked` (235) | 246-250 | 13.12px |
| `.t-time` | `margin: 0; display: flex; align-items: baseline; gap: 0.5em; flex-wrap: wrap`; `b { font-size: 1.5rem; font-weight: 500; letter-spacing: -0.02em }`; `span { font-family: var(--mono); font-size: 0.58rem; color: var(--fg-faint) }`. Element carries `.num` → mono + tabular-nums, **no uppercase** | 274-276 | b 24px, span 9.28px |

Supporting rules for the same region: `.t-panel { border: 1px solid var(--line); background: var(--panel); padding: clamp(9px, 0.85vw, 14px); display: grid; gap: 8px }` (104-105). `.t-solution { grid-template-rows: auto auto minmax(0, 1fr) auto auto }` with all five children placed by explicit `grid-row` (225-230) because "half of these children are hidden at any moment, and auto-placement would slide the 1fr row onto whichever one is left" (comment 221-224); `.t-solution.locked { grid-template-rows: auto minmax(0, 1fr) auto; align-items: center }` (233-235). `.t-focus.clipped, .t-sol-body.clipped, .t-caption.clipped` apply only a `mask-image: linear-gradient(to bottom, #000 calc(100% - 18px), transparent)` (215-218) — mask only, so toggling it cannot feed back into layout (comment m:262-263). `.t-bar { height: 3px; background: rgb(244 239 228 / 0.1) }`, `i { position: absolute; inset: 0 auto 0 0; width: 0%; background: var(--accent) }`, `.t-bar.over i { background: #e0705a; outline: 1px solid var(--fg) }` (277-281). `.t-ctl .t-next, .t-ctl .t-play { border-color: var(--accent); color: var(--fg) }` — scoped through `.t-ctl` so they beat the generic `.t-ctl button` rule (comment 268-270). `.t-plies { max-height: 5.4em; overflow-y: auto }` (253-254); `.t-plies button { font-family: var(--mono); font-size: 0.62rem; padding: 0.28em 0.42em }` (255-257); `.t-plies .no { color: var(--fg-faint); margin-right: 0.25em }` (261). `.t-sol-body .san { font-family: var(--mono); font-size: 0.94rem; letter-spacing: 0.06em; color: var(--accent) }` (237-238); `.t-sol-body p { font-size: 0.8rem; line-height: 1.42; color: var(--fg-dim) }` (239); `.t-sol-body li { font-size: 0.76rem; line-height: 1.34 }` with a 5×1px accent dash `::before` (242-245). `.t-prompt { font-size: 0.88rem; line-height: 1.42; color: #fff1e5; border: 1px solid var(--line-2); border-left: 2px solid var(--accent); background: var(--panel-hi); padding: 8px 10px }` (209-211). `.t-hintline { font-size: 0.8rem; line-height: 1.4; color: var(--fg-dim) }` (212). `.t-note { font-size: 0.58rem; letter-spacing: 0.12em; color: var(--fg-faint) }` (106). `.t-copy code { font-family: var(--mono); font-size: 0.56rem; line-height: 1.5; color: var(--fg-dim); background: #0d0b09; border: 1px solid var(--line); padding: 6px 7px; white-space: pre-wrap; word-break: break-all; min-height: 2.6em; max-height: 9em; overflow-y: auto }` (131-136). `.t-empty` is a dashed `min(100%, 42ch)` box, mono `0.6rem`, ls `0.14em`, uppercase, padding `2.6em 2em` (174-177). `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 2px }` (41).

Header: `#t-top { display: flex; align-items: center; gap: clamp(10px, 1.4vw, 22px); padding: 10px clamp(14px, 1.6vw, 26px); border-bottom: 1px solid var(--line); background: #171310; flex-wrap: wrap }` (52-57). `.t-id { min-width: 14rem; flex: 1 }` (65). `.t-seg { display: flex; align-items: center; gap: 0.6em; color: var(--fg-dim); border: 1px solid var(--line-2); padding: 0.5em 0.8em; font-size: 0.6rem }`, `b { color: var(--accent) }` (70-72). `.t-pick button, .t-views button { background: transparent; border: 1px solid var(--line-2); padding: 0.5em 0.7em; font-family: var(--mono); font-size: 0.6rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--fg-dim) }`, active `background/border: var(--accent); color: #160d09` (74-83).

### Act-4 container, for contrast

`.console` (product.css:28-41) is already the same idiom — `display: grid; grid-template-columns: minmax(0, 1.02fr) minmax(0, 1.28fr) minmax(0, 1fr); gap: 1px; background: var(--line); border: 1px solid var(--line-2)` — but it carries `opacity: calc(var(--in2) * (1 - var(--out)))` and a `perspective(2200px) rotateX(...) translateY(...) scale(...)` entrance, and `.session { grid-template-rows: auto minmax(0, 1fr) }` (product.css:8-13) gives it its height. `.pane` is `background: var(--glass); padding: clamp(12px, 1.2vw, 18px); display: grid; gap: clamp(7px, 0.9vh, 11px); align-content: start; overflow: hidden` (product.css:41-42) — `overflow: hidden`, not `auto`, so a rail's internal scroll does not exist there. `annot.css` is loaded last and "wins every tie with the ACT 4 block" (annot.css:14), and `.pane-ctl` reserves a `clamp(104px, 9.6vw, 150px)` callout gutter (annot.css:48-54). Act 4 currently renders `showcase.data.S042` through `buildConsole` (app/js/main.js:37), and `console.js` builds only four flow rows (`SEGMENTS`, console.js:5-10 + `practical_activity`, 104-107) from `duration_min` alone, lowercasing the activity name (105) — a different flow model from `buildSegments`' eight.


## HARD CONSTRAINTS
- `[hidden] { display: none !important; }` — teach.css:46. Load-bearing: "Several of these panels declare `display: grid`, which beats the user-agent `[hidden] { display: none }`. Without this the gated solution and the prep view are both visible from the first paint" (teach.css:43-45).
- `.t-solution { grid-template-rows: auto auto minmax(0, 1fr) auto auto; }` with every child given an explicit `grid-row` (teach.css:225-230) — "Rows are placed explicitly — half of these children are hidden at any moment, and auto-placement would slide the 1fr row onto whichever one is left" (teach.css:223-224). The `.locked` variant re-cuts to three rows and moves `.t-reveal` to `grid-row: 3` (teach.css:233-235).
- `--line-2: rgb(214 181 143 / 0.5);` — teach.css:24. "0.5, not 0.3: this is the only boundary most of the controls have, and 0.3 composites to 1.93:1 against --ground" (teach.css:21-23).
- `.t-flow li.on button { background: #2a2119; color: #fff8ee; border-left-color: var(--accent); }` — teach.css:122-123. "#2a2119 rather than --panel-hi so the accent numerals clear 4.5:1 at every stage colour, purple included" (teach.css:120-121). S115 is the purple stage.
- `.board2d .sq.from::after, .board2d .sq.to::after { ... outline: 3px solid #17120e; outline-offset: -3px; }` — teach.css:191-192. "The accent wash alone is 1.08:1 on a dark square... The ink ring is the cue that does not depend on hue: 12:1 on a light square, 5.8:1 on a dark one" (teach.css:188-190).
- `.t-bar.over i { background: #e0705a; outline: 1px solid var(--fg); }` — teach.css:281, plus the `· over by mm:ss` figure printed beside it (main.js:565). "Over budget is a hue swap of equal luminance, so it needs the outline as well as the 'over by' figure" (teach.css:279-280).
- `.t-ctl .t-next, .t-ctl .t-play { border-color: var(--accent); color: var(--fg); }` — teach.css:271. "Scoped through .t-ctl so these two actually beat the generic button rule above: unscoped, the primary pair was drawn exactly like Reset, and its hover put --fg on the accent at 2.66:1" (teach.css:268-270).
- `const inConsole = q('#t-main').contains(t) || q('#t-top').contains(t);` — main.js:170. Single-character shortcuts must stay scoped to the console (WCAG 2.1.4) and must include the header: "scoping to #t-main alone leaves R and P dead for the rest of the class after the coach clicks a session pill" (main.js:166-169).
- `const scrolls = document.documentElement.scrollHeight > innerHeight + 1;` gating ArrowUp/ArrowDown — main.js:183-187. "Below 1100px the page itself scrolls, and taking Up/Down would strand the panels that sit under the board" (main.js:181-182).
- `if (S.view === 'prep') return;` before R and the arrows — main.js:177. "Prep is a document. Every key that scrolls one has to keep scrolling it" (main.js:176).
- `reveal.hidden = !has || !bt.gated;` — main.js:478. The reveal is a toggle and never leaves the DOM: "activating it must not delete the control the coach just used, or focus lands on <body>" (main.js:476-477). Same for the flow rows: "Built once per session: clicking a row must not delete the row that was clicked" (main.js:302).
- `const CAPPED = ['.t-focus', '.t-sol-body', '.t-caption'];` plus a `ResizeObserver` on all three — main.js:247, 265-269. It "has to re-run when the boxes change, not only when the content does... a panel measured at 1440x900 kept its verdict at 1244x620: a 62px cut painted as a complete panel" (main.js:257-263). `.t-caption` is on the list because teach.css:172 caps it at `11lh` with `overflow-y: auto` and S115's 185-word core explanation loses 62px / 33 words with no cue (main.js:241-246).
- `.clipped` may only paint a mask — `-webkit-mask-image / mask-image: linear-gradient(to bottom, #000 calc(100% - 18px), transparent)` (teach.css:215-218) — "so toggling it cannot feed back into layout" (main.js:263).
- Every row that must hold content inside a fixed-height box is `minmax(0, 1fr)`, never `auto`: `.t-left { grid-template-rows: auto minmax(0, 1fr) auto }`, `.t-right { auto minmax(8rem, 1fr) auto auto }`, `.t-stage { auto auto auto minmax(0, 1fr) auto auto }` — teach.css:368-370, rationale 356-363.
- `.t-board-wrap { container-type: size; }` + `.t-board { width: min(100cqw, 100cqh); }` may only exist inside the `body.teach { height: 100vh }` gate — teach.css:364-377. "`container-type: size` needs a definite height, which is why this block and `height: 100vh` travel together — and why it is gated on having the room for it: a 1024x600 tablet keeps the scrolling single column" (teach.css:358-362).
- `.t-stage.no-board .t-board-wrap { container-type: normal; }` — teach.css:170. "The size containment has to go with it: a size-contained box in an auto row is a box whose contents cannot give it a height, i.e. zero" (teach.css:167-168). S115's activity beat has no `starting_fen`, so this path is live.
- `.t-prep { height: 100%; overflow-y: auto; min-height: 0; }` — teach.css:292. "Without the height this scroll container has no definite height to scroll against, and at every window over 1100px the document below the fold — eight segments, five note groups, pacing, homework — is unreachable by any means" (teach.css:289-292).
- `if (v === 'prep') { renderPrep(); prep.focus(); ... }` — main.js:144. "Prep is a scroll container with nothing focusable inside it, so opening it has to hand it focus or a keyboard cannot reach the document at all" (main.js:142-143).
- The status region is the only announcement channel and the board is `role="img"`: `function say(m) { q('.t-status').textContent = m; }` (main.js:88) and "The board is a role=\"img\": stepping it is not an announcement, so the move, the two squares and the new side to move are said here instead" (main.js:219-220, 221-223).
- `.t-focus` must stay capped and internally scrollable: `max-height: 26vh` (teach.css:374), `20vh` under 820px tall (399), `42vh` above 1000px tall (405). "S115's routine focus is nine sentences long. The panel that holds it takes a quarter of the rail and scrolls inside, so neither the answer nor the clock can be pushed off the bottom of a 720px window" (teach.css:371-373). Measured: 785 characters.
- `const inClassMinutes = () => S.segments.reduce((a, sg) => a + (sg.key === 'homework' ? 0 : (sg.minutes || 0)), 0);` — main.js:84-85. "Homework is not taught in the room, so it is not part of the class total" (main.js:83). For S115 this is 42, not 57.
- `out.push({ key: 'homework', label: 'Homework', minutes: null, ... })` — segments.js:100-101. "Homework happens at home, so it carries no in-class minutes" (segments.js:97-98). The flow row must therefore print `—`, not `15m`.
- `const orOne = (beats) => (beats.length ? beats : [{}]);` — segments.js:12. "The stepper needs at least one beat per segment or advancing would stall" (segments.js:11). S115's `core_explanation.demonstrations` is `[]`, so this path is live.
- `const pgn = !gated && l.length > 1 ? buildPgn(...) : '';` — main.js:409-411. "The movetext is the answer, so the PGN waits for the reveal, and it is dropped entirely when there is no line: a fragment with no moves reads as broken" (main.js:407-408).
- `const canStep = () => line().length > 1 && !(beat().gated && !S.revealed);` — main.js:82. "Stepping the line shows the answer, so it waits for the reveal" (main.js:81).
- `title.classList.toggle('long', title.textContent.length > 130);` — main.js:359, with the `.long` type tier at teach.css:153-155. "A prompt is anything from three words to a 380-character calculation brief, so it gets two type tiers rather than one display size that only suits the short ones" (main.js:357-358). All 13 prompt-bearing beats in S115 exceed 130 chars.
- `renderLine` must be its own renderer — main.js:516. "Its own renderer because renderSolution returns early on a gated beat, which used to leave the previous beat's plies on screen" (main.js:514-515). Likewise `renderTransport` sits "outside every early return, so a disabled state is never stale" (main.js:544).
- `c.querySelector('span').textContent = ` · Stage ...`;` — main.js:283-284. "The leading space is part of the string, not a flex gap: this line is read aloud and copied as often as it is looked at" (main.js:281-282).
- `{ ... }` — Board2D is constructed with no `opts`, so `this.flip = !!opts.flip` is false (board2d.js:30). The board is never flipped, including for the black-to-move puzzles that are 4 of S115's 8.
- Attribution debt carried by any reuse of the board: "Pieces are cburnett SVG, CC BY-SA 3.0, which is GPL-compatible for artwork; the credit line still has to ship in the footer, and there is no ATTRIBUTION file in this prototype" — board2d.js:24-26.

## UNKNOWNS
- Whether act 4 keeps `buildConsole` at all. `app/js/main.js:37` currently calls `buildConsole(document.getElementById('console'), showcase.data.S042)` — a different flow model (four rows from `duration_min` only, console.js:5-10 + 104-107) against a different session. I could not tell from the files whether S115 replaces S042 there, whether `buildConsole` is rewritten, or whether a second component is added.
- `app/index.html` (lines 18-23) does not load `teach.css`, so every `.t-*` class is unstyled on the main page. Whether the intent is to add `<link href="/css/teach.css">` to index.html, port the rules into product.css, or scope a copy under an act-4 container — and therefore what happens to the `.mono` collision (base.css:107-113 uses `letter-spacing: 0.19em` and product.css:225-226 forces its colour, vs teach.css:37-38's 0.16em) — is not determined by anything I read.
- Whether the reproduction is meant to be interactive or a fixed frame. /teach's content is a function of mutable state (`S.seg`, `S.beat`, `S.ply`, `S.revealed`, `S.clock`); act 4's console is a function of scroll progress `t` (console.js:85-90, `AUTO_REVEAL = 0.42`). Which one drives the copy changes what the reveal, the stepper and the clock even mean.
- "0:39" cannot be derived from any file. It is `mmss(S.clock.elapsed)` where `elapsed` accumulates wall-clock deltas in `tick()` (main.js:578-585) after `.t-play` is pressed, and resets on every segment change (main.js:204). If a screenshot is the reference, I cannot know from the source what value should be hardcoded.
- What `.t-controls .t-rail-h b` should contain. The element exists (index.html:93) but no line in main.js ever writes it, so it renders empty. Whether a reproduction should leave it empty or fill it is undecided.
- The `--rook` override. `main.js:68` writes `#9070ce` onto `document.body.style` for S115. On the main page `--rook` is a tokens.css stage hue (`#d2604b`) that other components read (`product.css:196 .notes .warn li::before { background: var(--rook) }`), and act colour is carried by `--hue` written per frame by the scroll director. Whether act 4 should set `--accent: #9070ce` locally, repoint `--hue`, or overwrite `--rook` (which would recolour act 4's warn bullets) is not something the files settle.
- Any actual rendered geometry. I read no browser output, so I cannot say whether `.t-caption`, `.t-focus` or `.t-sol-body` clip inside act 4's narrower columns (`minmax(0, 1.02fr) minmax(0, 1.28fr) minmax(0, 1fr)`, product.css:30, with `.pane { overflow: hidden }`, product.css:41) — nor whether the eight-row flow fits `.pane`'s `align-content: start` box.
- How `annot.css`'s four numbered callouts (`--a1`..`--a4`, annot.css:21-25; `.pane-ctl` gutter, 48-54) interact with teach's panels. The callouts name the four controls `buildConsole` emits (`ic-clock`, `ic-sol`, `ic-fen`, `ic-prep`); nothing in the files says whether those leader lines are meant to survive, retarget onto `.t-clock`/`.t-solution`/`.t-pos`, or be dropped.
- Whether the prep view (`#t-prep`, `renderPrep`, main.js:588-683) is in scope. It is a second full document with its own light-on-paper token set (teach.css:286-321) and act 4 already has a `.prep` disclosure of its own (console.js:358-431).
- `S001` and `S042` remain in `FREE` (main.js:15) and the picker builds a button per id (main.js:91-100). Whether act 4 shows only S115 or keeps the three-session picker is not stated.