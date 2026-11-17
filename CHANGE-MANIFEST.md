# Change manifest — version 3 (supersedes v1 and v2)

Upload the folders into your repository in the same places, commit, then merge.

## New in version 3
- Flood Line option C reworded: "Trade call logs for telecom movement maps" (all 5 languages).
- New `content/cost-notes.json`: a non-scored money and environment note in every scenario debrief, all 12 scenarios × 5 languages.
- New debrief heading "The bigger picture" above each scenario reflection.
- Neutrality added to Targeting the Unseen, The Listening Clinic and The Heat Map, with short explanations.
- "The options that were not taken" is kept.
- `tools/builder.js` now also packs `cost-notes.json`.

## Technical debt removed
- Removed the unused per-scenario colour map from `app/game.js` (its CSS was already gone); scenarios use brand tokens, with the optional `"colors"` field still working.
- Removed leftover `accent-brand` class names that no stylesheet used.
- Stylesheet is the single consolidated brand-token version (one `:root`, no duplicate rules).
- Dropped the separate `CSS-CLEANUP.patch` from v2; `CHANGES.patch` now holds everything.
- `START-HERE.html` rebuilt from the current source so it matches exactly.

## Files
- `app/game.js`, `app/styles.css`, `app/shell.html`, `app/assets/` (12 storyboards, 48 decision pictures)
- `content/` scenarios and i18n (5 languages), `settings.json`, `humanity-reasons.json`, `cost-notes.json`, `assets.json`
- `tools/builder.js`, `tools/tools.js`, `tools/checker.js`, `tools/tests/handoff.test.cjs`
- `.github/workflows/pages.yml`, `START-HERE.html`
