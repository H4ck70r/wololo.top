# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: the ranked ladder player of Age of Empires II: Definitive Edition. They come to look at themselves — their rating and where it sits in the ladder, their recent matches, the rivals they keep meeting, and what separates their wins from their losses — and to look up an opponent before or after a game. They arrive from a search, a shared link to a profile or a match, or a bookmark, often right after playing.

Secondary (confirmed by existing features, not the design priority): streamers who put the live overlay in OBS, and the competitive community that follows top players through live matches, head-to-head and the civ meta.

## Product Purpose

Turn the public data of AoE2 ranked play into an honest reading of how a player is doing and why. Success is a player understanding something true about their own game that the in-game screens do not tell them, and coming back after their next session.

## Positioning

The site interprets instead of only listing: every chart carries a sentence that says what it means (rating inflation, percentile against the current ladder, what separates wins from losses), and claims are bounded by what the data can actually prove — the copy says so when it cannot. Replay analysis compares a player against tens of thousands of games at their level. It is built in Spanish and English from the start.

## Operating Context

- Players check after a session, on desktop or phone, sometimes mid-queue.
- Profiles and matches are reached through shared URLs (`/player/:id`, `/match/:id`, `/h2h/:a/:b`), so each of those pages must stand on its own as a first impression.
- The live overlay (`/live/:profileId`) runs inside OBS as a browser source with no site chrome; the configurator lives at `/overlay`, with a manual at `/manual`.
- Data comes from the AOE2DE API (separate repo); the site is a static SPA served from Hostinger.

## Capabilities and Constraints

- Routes: home, player profile (tabs: overview, matches, civs & maps, rivals, standing), head-to-head, leaderboard with rating distribution and inflation, live matches, civ meta (`/stats`), compare, clan, match detail, replay analysis (`/analyze`), Steam login and profile claim, overlay configurator, live overlay, manual.
- Bilingual EN/ES through `src/lib/i18n.tsx`; every user-facing string goes through `t()`.
- Game assets on hand: 62 civilization emblems (`public/icons/civs`), unit, building and technology icons (`public/iconos`).
- Monetization: none today, planned later (ads or premium). Microsoft's Game Content Usage Rules allow official game art only on non-commercial fan sites, so the identity must stand on its own and official art must stay replaceable: it can support content (civ emblems next to data) but must not be the brand.
- Must keep the "Not affiliated with Xbox Game Studios" notice and must not imply endorsement by Microsoft or World's Edge.
- Undecided: what the paid tier would contain; whether to add more locales.

## Brand Commitments

- The name WOLOLO (wordmark, uppercase) is the brand and stays. Everything else visual is replaceable.
- Voice: plain, precise, honest about the limits of the data; no hype, no invented certainty. Spanish copy in neutral Castilian.

## Evidence on Hand

- Live production data: ladder of 300k+ players, match history, live matches, civ statistics.
- No testimonials, press, user counts or partner logos exist; do not fabricate any.

## Product Principles

1. The player looking at themselves comes first; every page answers "how am I doing, and why".
2. Interpret, don't decorate: each number earns a sentence, each chart a conclusion.
3. Say only what the data can prove, and say when it can't.
4. Shared pages are front doors: a profile or match link must make sense to someone who has never seen the site.
5. Own the identity: the game's art supports the data, it is never the brand.

## Accessibility & Inclusion

Text contrast must meet WCAG AA (current secondary text fails it). Win/loss and other states must never rely on color alone. Bilingual parity: no hardcoded English strings.
