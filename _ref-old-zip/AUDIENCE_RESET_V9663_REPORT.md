# Sufaraa v9.6.63 - Audience Reset Clean Foundation

Base version: `sufaraa-v9-6-62-stage1-final-instant-wait-verified.zip`

## What changed

The audience screen was reset for a clean rebuild.

Runtime removed from `audience.html`:

- `audience-game-flow.js`
- `stage3-audience-v9646.js`
- `stage4-audience-v9650.js`
- `stage3-final-v9646.css` from audience page only
- `stage4-final-v9650.css` from audience page only
- Old mode buttons: live/general/stage3/stage4
- Old audience renderer with accumulated routes and reveal logic

Files deleted from the package because they were audience-only runtime files:

- `audience-game-flow.js`
- `stage3-audience-v9646.js`
- `stage4-audience-v9650.js`

Files kept because they are still used by admin/contestant pages:

- `stage3-final-v9646.css`
- `stage4-final-v9650.css`
- `stage3-shared-v9646.js`
- `stage4-shared-v9650.js`
- `stage3-admin-v9646.js`
- `stage3-contestant-v9646.js`
- `stage4-admin-v9650.js`
- `stage4-contestant-v9650.js`

## New audience foundation

`audience.html` now loads only:

- Firebase app/firestore compat
- `firebase-init.js`
- `game-flow-core.js`
- `audience-script.js`

`audience-script.js` was rewritten from scratch. It only:

- connects to Firestore
- reads `meta/gameFlow`
- reads `teams`
- shows a clean status foundation
- supports fullscreen and reload

It does not render old results, stage 3, or stage 4 logic.

## Verification

All remaining local JavaScript files passed syntax validation with Node.
