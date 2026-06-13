# Audience v9.6.73 stage3 header + animation polish

## Main improvements
- Simplified the center header area in stage 3 so it shows only the stage title.
- Removed the extra stage title block from the stage 3 board area.
- Rebuilt the stage 3 board header so it uses space more efficiently for:
  - current turn
  - countdown timer
  - larger table area
- Improved table-space usage in stage 3 by tightening the board shell and enlarging the useful grid area.
- Added better row-motion handling for rankings:
  - rows that move upward now animate more clearly
  - the effect is based on previous rank vs current rank
- Improved general-results reveal so rows appear progressively from the lowest score to the highest.
- Improved answer-card reveal animation.
- Sped up progressive answer reveal:
  - reveal countdown reduced
  - then one team card appears each second
- Reduced and lifted the “استعدوا لكشف الإجابات” card so it stays cleaner on screen.
