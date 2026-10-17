---
name: wololo.top
description: The ranked AoE2 DE player's campaign map. The ladder is drawn as territory, players as heraldic tokens, results as a front line.
colors:
  ink-deep: "#0b0a08"
  ink-800: "#100e0b"
  ink-surface: "#14120e"
  ink-raised: "#1a1712"
  ink-500: "#221e17"
  hairline: "#2e2a21"
  hairline-strong: "#3d372b"
  bone-50: "#faf6ec"
  bone-100: "#f3ecdc"
  bone: "#ece4d2"
  bone-300: "#d6ccb6"
  bone-400: "#b8ad96"
  bone-dim: "#a39a86"
  bone-min: "#8f8673"
  bone-faint: "#5c5446"
  imperial-gold: "#e3b341"
  imperial-gold-light: "#f0cf73"
  imperial-gold-deep: "#c99a2e"
  azure: "#5b8fd6"
  azure-light: "#9dbde8"
  azure-deep: "#3f74bd"
  victory: "#3fae6a"
  victory-light: "#7fcf9c"
  defeat: "#e0604f"
  defeat-light: "#f09a8c"
  gules: "#c8463b"
  live: "#ff4a3d"
  bronze: "#b8814a"
  age-dark: "#8f6136"
  age-feudal: "#a8743f"
  age-castle: "#bf8f55"
  age-imperial: "#d2ac74"
  age-legend: "#ecd9ac"
typography:
  display:
    fontFamily: "Cinzel, 'Trajan Pro', serif"
    fontSize: "clamp(3rem, 8.5vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0.06em"
  headline:
    fontFamily: "Cinzel, 'Trajan Pro', serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.08em"
  score-display:
    fontFamily: "'Barlow Condensed', Barlow, ui-sans-serif, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  score:
    fontFamily: "'Barlow Condensed', Barlow, ui-sans-serif, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.01em"
    fontFeature: "tnum"
  body:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  title:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
  label:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.3
  meta:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.35
    fontFeature: "tnum"
rounded:
  sm: "1px"
  md: "2px"
  lg: "3px"
  2xl: "4px"
spacing:
  gutter-sm: "16px"
  gutter-md: "24px"
  gutter-lg: "32px"
  row: "12px"
  section: "40px"
  section-lg: "56px"
  container: "1280px"
components:
  tab:
    textColor: "{colors.bone-400}"
    typography: "{typography.label}"
    padding: "10px 16px"
  tab-active:
    textColor: "{colors.bone-50}"
  seg-button:
    textColor: "{colors.bone-400}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  seg-button-active:
    backgroundColor: "{colors.ink-raised}"
    textColor: "{colors.imperial-gold}"
  input-search:
    backgroundColor: "{colors.ink-surface}"
    textColor: "{colors.bone-50}"
    rounded: "{rounded.sm}"
  input-search-focus:
    backgroundColor: "{colors.ink-raised}"
  plaque:
    backgroundColor: "{colors.ink-surface}"
    rounded: "{rounded.md}"
    padding: "24px"
  button-ghost:
    textColor: "{colors.bone-300}"
    rounded: "{rounded.lg}"
    padding: "6px 12px"
  nav-link:
    textColor: "{colors.bone-400}"
    typography: "{typography.label}"
    height: "64px"
    padding: "0 16px"
  nav-link-active:
    textColor: "{colors.bone-50}"
  age-token:
    size: "8px"
---

# Design System: wololo.top

## Overview

**Creative North Star: "The Campaign Map"**

wololo.top is the ranked player's campaign map. The ground is warm burnt ink, the text is bone, and the ladder is drawn as territory: players are heraldic tokens, results are a front line, and the page edges carry a map frame's grid ruling. The world refuses the dark-SaaS dashboard of glowing rounded cards, gray-on-gray text and a centered hero with three feature tiles.

Density is true data density. Tables and rows stay tabular and are divided by hairlines, not boxed into cards; the one container with character is the plaque, and it is rare. Rank is carried by weight, case and reversal before size. Numbers are the protagonists and get their own condensed, tabular voice; titles are inscriptions in tracked capitals.

Official game art (civilization emblems, building icons) appears only in support of data and must stay replaceable, because monetization is planned: the brand is the wordmark and the palette, never the game's art.

**Key Characteristics:**
- Warm ink ground, bone text, gold rationed to brand, rank #1 and the active state.
- Heraldic pair: azure and gules from the wordmark's party-per-pale shield.
- ELO tiers expressed as the game's ages on one bronze-to-pale-gold ramp.
- Squared forms (1-4px), one chamfered corner on plaques, hairline-divided data strips.
- Cinzel inscriptions, Barlow Condensed figures, Barlow UI, JetBrains Mono meta.

## Colors

A warm, low-chroma ink-and-bone ground carrying a small heraldic set of tinctures, each with one job.

### Primary
- **Imperial Gold** (imperial-gold): the brand (the `.top` suffix and the shield outline), rank #1 (its position and score), and the active state (active tab underline, active segment, active nav underline, focus ring, caret, text selection tint). Nothing else at rest.

### Secondary
- **Heraldic Azure** (azure, with azure-light and azure-deep): the second tincture of the wordmark shield (azur against gules). Used for Team ladders (the Team rating marker beside gold's 1v1) and for the opposing side when two sides are drawn. Never a link color.

### Tertiary
- **The Ages Ramp** (age-dark, age-feudal, age-castle, age-imperial, age-legend): ELO tiers as the game's ages, Dark from 0, Feudal from 1000, Castle from 1400, Imperial from 1800, Legend from 2200. One ramp from dark bronze to pale gold that deliberately excludes Imperial Gold. Rendered as the age token and the age name beside a rating.
- **Bronze** (bronze, the amber family): the material the ages ramp is cut from; Tailwind's amber scale is redefined to it.

### Semantic
- **Victory** (victory, victory-light) and **Defeat** (defeat, defeat-light): results, records, streaks and win rates. Always paired with a letter, sign or glyph, never color alone.
- **Gules** (gules): the red half of the wordmark shield and the deep step of the defeat family.
- **On Air** (live): only for what is happening now (the pulsing live dot, live counts).

### Neutral
- **Burnt Ink** (ink-deep to ink-500): the ground, from page (ink-deep) through header/menus (ink-800), plaques and inputs (ink-surface), to raised and active fills (ink-raised).
- **Hairlines** (hairline, hairline-strong): every divider, panel border and row rule; the strong step for control outlines and hover underlines.
- **Bone** (bone-50 to bone-min): text. bone is body, bone-50 is emphasis and big numbers, bone-400 is idle controls, bone-dim is secondary text and meta.
- **Bone Floor** (bone-min): the minimum text tone; it passes WCAG AA on every ink surface.
- **Bone Faint** (bone-faint): decoration only (map-rule ticks and grid letters, scrollbar hover). Never readable text.

### Named Rules
**The Rationed Gold Rule.** Imperial Gold marks the brand, rank #1 and the active state only. Ranks #2 and below, scores, links and buttons are bone. Gold may appear as a transient focus or hover signal (focus ring, link underline decoration), never as a resting color on a link or button.

**The Inherited World Rule.** Tailwind's gray, emerald, green, red, amber and blue scales are redefined in the theme on purpose, so any page not yet rewritten by hand inherits bone, heraldic green and red, bronze and azure instead of stock Tailwind. Writing `gray-600` yields the AA floor, not a failing gray. Do not reintroduce unredefined scales (stone, slate, zinc, neutral) on new surfaces.

**The Two Tinctures Rule.** Gold and azure are the only side colors: gold for 1v1 and the player's own side, azure for Team and the opposition. No third team color.

**The Ages Rule.** Rating tiers are always the five ages on the bronze ramp, never a MOBA rainbow (cyan "Diamond", purple "Legend"), and the ramp never borrows Imperial Gold.

## Typography

**Display Font:** Cinzel (with Trajan Pro, serif), weights 600 and 700
**Score Font:** Barlow Condensed (with Barlow, sans-serif), weights 600-800
**Body Font:** Barlow (with system-ui, sans-serif), weights 400-700
**Mono Font:** JetBrains Mono (with ui-monospace), weights 400 and 500

All four are self-hosted (Fontsource, latin subsets).

**Character:** A Roman inscription for the brand and section titles, a scoreboard condensed for every number that matters, a plain humanist sans for reading, and a measuring mono for meta. Tables are tabular-figured throughout.

### Hierarchy
- **Display** (Cinzel 700, clamp(3rem, 8.5vw, 6rem), 0.95): the WOLOLO wordmark at hero scale, one line. The header wordmark is the same face at 1.35rem, 0.12em tracking.
- **Headline** (Cinzel 600, 15-16px, 0.08em, uppercase): section titles, the inscription style. Smaller steps (13px) label ladder blocks.
- **Score Display** (Barlow Condensed 700, 2.6rem, line-height 1, -0.01em, tabular): the headline rating on a player's ladder.
- **Score** (Barlow Condensed 700, 1.6rem down to 1rem, tabular): ranks, ratings, percentages, records in lists and data cells.
- **Title** (Barlow 600, 16px): player names and civilization names in rows.
- **Body** (Barlow 400, 16px, 1.5): reading text; taglines step to 18-20px at max 36ch.
- **Label** (Barlow 500, 14-15px): nav links, tabs, segments, buttons.
- **Meta** (JetBrains Mono 400, 12px, tabular): measured strings: match type, map, duration, ids, country codes, data-cell captions, small qualifiers.

### Named Rules
**The No Figures In Cinzel Rule.** Cinzel has no real figures ("1v1" reads "IVI"). Digits never go in Cinzel headings: numbers go in Barlow Condensed, and a numeric qualifier beside a heading goes in mono.

**The Twelve Pixel Floor.** No text under 12px. The sole exception is the chromeless OBS overlay route (/live/:id), sized for stream scenes.

**The Measured Meta Rule.** Anything that is measured or identified (type, map, duration, ids, country) is set in mono, joined with a middle dot.

## Layout

A single 1280px container with 16 / 24 / 32px gutters (mobile / sm / lg) under a sticky 64px header. Pages compose as asymmetric grids rather than centered heroes: the home sets a roughly 1.55 : 1 split (main column, then a narrower column of tokens), collapsing to one column below lg. Sections are separated by 40px (56px at lg) gaps and by hairlines; the map rule (a hairline with A-H grid letters and end ticks) frames a transition between major bands.

Data is laid out as strips: rows of 10-12px vertical padding, each closed by a hairline, the last row open. Columns are tabular, aligned right for numbers, and use fixed rank and avatar tracks (for example rank 36px, avatar 32px, name flexible, score auto). Player ladders sit side by side, divided by spacing and a hairline above their stats, not boxed.

## Elevation & Depth

Flat by default. Depth is tonal: the ground steps from ink-deep to ink-raised, and hairlines do the separating. Shadows exist only on things that float above the page.

### Shadow Vocabulary
- **Dropdown** (`box-shadow: 0 12px 32px -8px rgba(0,0,0,0.7)`): nav group menus.
- **Search results** (`box-shadow: 0 16px 40px -12px rgba(0,0,0,0.8)`): the search suggestion list.
- **Active inset** (`box-shadow: inset 0 -2px 0 #e3b341`): the single active-state underline (part of the active selector, not elevation).

### Named Rules
**The Floating-Only Shadow Rule.** A shadow means the element floats over content (menus, suggestions). Resting surfaces never cast one, and nothing glows.

## Shapes

Straight cuts. Radii are 1-4px everywhere (Tailwind's radius scale is redefined so `rounded-md` is 2px and `rounded-lg` 3px). Full rounding is reserved for dots (the live dot, loading spinner).

The plaque carries one chamfered corner: the top-right 14px is cut off by a clip path. It is the only container with a silhouette. The age token is a rotated square (an 8px lozenge), the same piece that marks milestones on the profile. The wordmark seal is a shield divided per pale, azure and gules, outlined in gold.

Accent borders (a 2px colored top or left edge) appear only on squared, unrounded pieces: verdict and assessment callouts take a 2px top edge, the active mobile nav item a 2px left edge, floating menus a gold-tinted top edge.

## Components

### Selection Controls
Exactly two selection controls exist, plus one active state.
- **Tabs** (switch the view: profile sections, meta views, ladder types): a row closed by a hairline; each tab is 15px Barlow 500 in bone-400 with a transparent 2px bottom edge. Hover lifts to bone-50 with a hairline-strong edge; active is bone-50 with a gold edge.
- **Segmented filter** (filter the current view: mode, level, period, band): a 2px-radius hairline-outlined group of 14px buttons in bone-400, hover bone-50.
- **Active state**: one treatment for every control: ink-raised fill, gold text and a 2px inset gold underline. No filled gold pills, boxed tabs or gold/azure toggles.

### Buttons
- **Shape:** gently squared (3px).
- **Ghost (the default):** transparent, hairline outline, bone-300 text, 14px Barlow 500, inline SVG icon at 16px.
- **Hover / Focus:** border steps to bone-dim; focus is the global 2px gold outline at 2px offset.
- **Text links:** bone-300 with a hairline-strong underline at 3px offset; the underline decoration turns gold on hover.

### Plaque
- **Corner Style:** 2px radius with the top-right 14px corner chamfered.
- **Background:** ink-surface with a 1px hairline border.
- **Shadow Strategy:** none.
- **Internal Padding:** 20-28px.
- **Use:** rare. The player plaque, the match scoreboard, the home's "front" (top five), live match entries. Everything else is a hairline-divided strip.

### Inputs / Fields
- **Style:** ink-surface fill, hairline border with a bone-faint bottom edge, 1px radius, bone-50 text, bone-min placeholder, leading SVG magnifier, a mono `/` key hint.
- **Focus:** fill steps to ink-raised, the bottom edge turns gold; gold caret.
- **Suggestions:** an ink-800 floating list with a gold-tinted top edge and hairline-divided rows.

### Navigation
- **Style:** sticky ink-deep bar, 64px, hairline bottom. Wordmark left; grouped links right (Players, Matches as dropdowns; Stats, Overlay as links), 15px Barlow 500 in bone-400.
- **States:** hover bone-50 with a hairline-strong 2px underline; active bone-50 with a gold 2px underline; dropdown chevrons are SVG and rotate when open.
- **Mobile:** a drawer of block links; the active item takes a 2px gold left edge on ink-surface.

### Age Token and Legend (signature)
An 8px rotated square filled with the age color of a rating, set before the score with the age name as its accessible label. Wherever scores are listed, a visible legend lists the five ages with their mono thresholds (`<1000`, `1000+`, `1400+`, `1800+`, `2200+`) so color is never the only carrier.

### Map Rule (signature)
A full-width hairline with tick marks and mono grid letters A to H, as on the frame of a campaign map. It divides bands of the page. Map coordinates live here, on the divider, never as a label above a heading.

### Rating Ladder
A player's ladder: a 10px square marker (gold for 1v1, azure for Team) beside a 13px inscription label, the age name in its age color, the rating in Score Display, the rank in Score, a mono top-percent tag, then a hairline and a two-column grid of mono captions over condensed figures (record in victory/defeat, win rate, games, streak).

## Do's and Don'ts

### Do:
- **Do** keep Imperial Gold (#e3b341) to the brand, rank #1 and the active state; ranks #2 and below, scores, links and buttons are bone.
- **Do** use azure for Team ladders and the opposing side, as the wordmark's second tincture.
- **Do** show ratings with the age token and, wherever scores are listed, the visible ages legend.
- **Do** set every number that matters in Barlow Condensed (tabular), and measured meta strings in JetBrains Mono.
- **Do** use bone-min (#8f8673) as the lowest text tone; anything dimmer is decoration.
- **Do** use the tabs for switching views and the segmented filter for filtering, with the single gold active state.
- **Do** divide data with hairlines and keep plaques rare.
- **Do** draw icons and arrows as inline SVG; use the building icon images in public/iconos/buildings for the replay map; show country as a mono code.
- **Do** keep official game art (civ emblems, building icons) in a supporting, replaceable role.
- **Do** pair victory and defeat colors with a letter, sign or glyph.

### Don't:
- **Don't** put digits in Cinzel headings.
- **Don't** set text under 12px outside the /live/:id OBS overlay.
- **Don't** place kickers or eyebrows above headings; map coordinates belong on the map rule.
- **Don't** use emoji or Unicode glyphs as icons (no flag emoji, no ▲▼ or ⚔ characters).
- **Don't** put an accent border on a rounded piece; accent edges belong to squared pieces only.
- **Don't** wrap rows and columns into cards, add glows, or cast shadows on resting surfaces.
- **Don't** use gold for links, buttons, scores or ranks below #1, and don't use azure for links.
- **Don't** add a third selection control or another active-state style.
- **Don't** use the ages ramp's colors with Imperial Gold or a MOBA-style rank rainbow.
- **Don't** make game art the brand; the wordmark and palette are the identity.

### Open Decisions
- No grid coordinates on section headings: declined under the craft-floor kicker ban; coordinates stay on the map rule.
- No civilization emblem on ladder tokens: deferred, the API returns no main civ.
- Map names stay untranslated: they are the game's proper names.
- Match detail below the scoreboard stays behind the replay button: the replay downloads from Relic on demand.
- Siege workshop and town centre have no building icon yet: drawn as a ring until art exists.
