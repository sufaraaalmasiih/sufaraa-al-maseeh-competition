# Audience / Stage3 v9.6.74 auto reveal + return fix

## Fixed
- Root fix for stage 3 automatic reveal flow.
- After the 15-second answer timer ends, the system now triggers the real central reveal flow automatically from the stage 3 admin logic.
- This means the return to the question board now propagates correctly for:
  - host/admin
  - contestants
  - audience
- The issue where only manual host reveal returned normally has been fixed from the source.

## Visual fixes
- Answer cards now reveal truly one by one.
- The first card appears, then after 1 second the next card, and so on.
- Previously visible cards no longer re-animate together on each refresh.
- The "استعدوا لكشف الإجابات" card was enlarged significantly so it is clearer on the big screen.
