# V9.6.60 - Stage 1/2/4 targeted fix

Base: v9.6.59 surgical clean.

Changes:
- Restored the better Stage 1 UI/gameplay renderer from v9.6.58 (`contest-fixes-v9542.js`) while keeping the v9.6.59 clean moderator-controlled transitions.
- Restored Stage 2 correction validation helper (`stage2-correction-v9638.js`) to improve correction-question behavior.
- Re-added the final-question guard for Stage 1 so question 50 immediately ends this team into moderator wait without returning to the last question.
- Preserved the v9.6.59 rule: if a team has finished its current stage, it stays in moderator wait even while the global game flow remains running for other teams.
- Fixed Stage 4 clean renderer binding so the final Stage 4 streak UI overrides the legacy renderer globally.
- Verified all JavaScript files with `node --check`.
