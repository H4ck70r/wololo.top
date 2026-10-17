---
version: 1
slug: "src-pages-home-tsx"
primary_target: "src/pages/Home.tsx"
related_targets: ["src/index.css","src/components/Layout.tsx"]
---

# Surface brief · wololo.top — identidad del sitio y portada

Scope: visual world of the whole site (tokens, type, shapes, shell) plus the home page as first surface. Visitor mode: Operate (home leans Persuade only in its first viewport).
Audience/job: the ranked AoE2 DE ladder player looking at themselves or at an opponent (PRODUCT.md). Action: search a player. Proof: the live ladder itself — real top players, real live matches.
Constraints: bilingual via t(); official game art supports data but is never the brand (monetization planned); WOLOLO wordmark is binding; overlay route stays chromeless.
Phases: 1) system + shell + home; 2) match scoreboard + player plaque; 3) /stats, /live, leaderboard, copy and component unification.

## Direction contract

THESIS: The site is the ranked player's campaign map: the ladder drawn as territory, players as heraldic tokens, results as a front line. It refuses the dark-SaaS dashboard of glowing rounded cards, gray-on-gray text and a centered hero with three feature tiles.

OWN-WORLD: Warm burnt-ink ground #0b0a08 → #14120e → #1e1b15; bone text #ece4d2, bone-dim #a39a86 (AA). Imperial gold #e3b341 only for the brand, rank #1 and the active state. Victory #3fae6a and defeat #c8463b always paired with a glyph or letter. Live #ff3b30 only for "on air". Hairline rules #2e2a21 divide; panels are rare and squared (2px radius), plaques carry one chamfered corner. Grid-reference labels (A·1, B·2) in mono caps mark sections like map squares. Cinzel for wordmark and section titles, tracked caps; Barlow Condensed 600–800 for every number that matters; Barlow for UI text; JetBrains Mono tabular for tables. ELO tiers are the game's ages, one bronze→gold scale.

STORY: The player lands on a ladder that is visibly alive, finds their own name in one keystroke, and understands from the plaque and the front line where they stand and why, in their language.

FIRST VIEWPORT: Left two-thirds: WOLOLO in Cinzel at display scale on one line, a one-sentence purpose, the search field as the only primary action (focused on "/"), favorites beneath. Right third: "The front" — top five of 1v1 RM as tokens (rank, civ emblem 28px, name, ELO in Barlow Condensed tabular) and a live count line in live red. A full-width hairline below with grid labels starts the next row: live matches 2000+ as compact rows. No feature cards, no glow, no marketing numbers.

FORM: Campaign war map (assigned position 6 of the grounded list; seed 9236ce42), fused into the user-pinned medieval-competitive world. Raised by datamatics (declined): tabular numerals packed at true data density, no rounding of columns into cards. Raised by the timetable rack (declined): rank carried by weight, case and reversal before size.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
