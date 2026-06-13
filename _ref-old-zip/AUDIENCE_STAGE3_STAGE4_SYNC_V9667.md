# Audience stage 3 / stage 4 sync v9.6.67

## Changes
- Stage 3 board now mimics the admin board style more closely:
  - 5 columns
  - category cards
  - blue question bars
  - difficulty label + question number
  - points badge
  - active question highlighted in gold
- Stage 3 audience flow:
  - choosing: table + turn + choice timer
  - question_open: question + answer countdown only
  - answer_closed: question + waiting for host reveal
  - revealing: 5-second countdown, then progressive answer reveal
  - results_done: all revealed results
- Stage 4 audience flow:
  - idle: waiting card
  - question_open: question number + question + countdown only
  - answer_closed: question + waiting for host reveal
  - revealing: 5-second countdown, then progressive answer reveal
  - results_done: all revealed results
- Removed visible answer-status cards during the answer window for stage 3 and stage 4.
- Kept the audience display connected to the same admin-controlled Firestore docs:
  - meta/stage3Final
  - meta/stage4Final
