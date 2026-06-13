# Contestant Flow v9.6.75 - GameFlow router fix

## Problem
Sometimes contestants could still see the old finished/congratulations waiting screen while the host/admin was already on an intro/ready state for the next stage.

## Root cause
Some delayed/stale `finishStage()` or `renderWaiting('finished')` calls were still allowed to decide the contestant screen based on team progress/current values, instead of the global `meta/gameFlow.status`.

## Fix
This version modifies existing contestant flow files directly:

- `contestant-game-flow.js`
- `contestant-ui-polish-v9654.js`

No new patch file was added at the bottom.

## New rule
`meta/gameFlow.status` is now the only authority for contestant routing when a global flow status exists.

Examples:
- If `gameFlow.status = stage2_intro`, contestants always see the stage 2 intro/ready screen.
- A delayed `finishStage('stage1')` can still mark stage 1 as done internally, but it cannot force the old stage 1 finished/waiting screen over `stage2_intro`.
- If `gameFlow.status = stage2_running`, stale stage 1 completion cannot pull the contestant backwards.
- Finished/waiting screens are only shown when they match the current gameFlow stage or when the host status actually asks for a finished/waiting state.

## Safety
- Old achievement overlay remains blocked.
- `progress.stageX.ended` remains internal progress data only.
- Current visible screen follows gameFlow first.
