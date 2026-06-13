# Audience Visual Polish v9.6.65

## What was improved
- Rebuilt the audience visual layer with stronger contrast and cleaner white/blue/green branding.
- Improved the logo/header presentation with the full competition identity.
- Stage intro screens now show the stage title as the main heading:
  - المرحلة الأولى
  - المرحلة الثانية
  - المرحلة الثالثة
  - المرحلة الرابعة
- The stage name remains visible as a secondary badge.
- Reworked live ranking cards with a calmer, more stable layout.
- Removed the 500ms full re-render loop that caused shaking/flicker.
- Added live timer updates without replacing the whole DOM every tick.
- Rebuilt stage 3 board to look much closer to the admin board style.
- Improved stage 4 layout with stat cards, better question card styling, and cleaner answer/result cards.
- Kept the 5-second countdown -> general results -> final podium flow.

## Technical notes
- `audience.html` was redesigned visually.
- `audience-script.js` was rewritten to use snapshot-driven rendering + lightweight live timer updates.
- The audience screen still reads from:
  - `meta/gameFlow`
  - `teams`
  - `meta/stage3Final`
  - `meta/stage4Final`
