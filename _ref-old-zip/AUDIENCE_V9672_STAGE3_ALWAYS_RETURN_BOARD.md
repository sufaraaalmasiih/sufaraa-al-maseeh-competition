# Audience v9.6.72 stage3 always-return surgical fix

## Surgical fix
- Fixed stage 3 so the question board returns again reliably after the reveal flow.
- The return-to-board logic is now driven from the reveal model itself, not only from one narrow status branch.
- Audience now forces stage 3 back to `choosing` whenever the reveal window is actually finished.
- Added extra self-healing cleanup when returning to the board:
  - clear active question
  - clear answers
  - clear results
  - reset reveal timing fields
  - start the next choosing timer cleanly
- Added an extra safety patch in `stage3-admin-v9646.js` so the admin side also advances if stage 3 is left in `revealing` or `results_done` after reveal time ends.

## Goal
Make stage 3 return to the board **always and reliably**, not sometimes.
