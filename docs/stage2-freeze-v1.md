# Stage 2 Freeze v1

## Stage

- Name: `فتشوا الكتب`
- Frozen status: `Frozen v1`

## Completed Capabilities

- `stage2_intro`
- `stage2_role_assignment`
- `stage2_reading`
- `stage2_player_turns`
- `stage2_finished`

## Role Assignment

- Player selection
- Role locking
- Persistence after refresh

## Reading Phase

- Centralized timer
- 180 second reading timer
- Audience synchronization
- Facilitator controls

## Fields Completed

1. Matching (`توصيل`)
2. Arrange Verse (`رتب الآية أو الآيات`)
3. Complete Verse (`أكمل الآيات`)
4. True/False + Correction (`صح أو خطأ مع تصحيح`)

## Answer Engine Features

- Firestore answer persistence
- +15 scoring
- Duplicate scoring prevention
- Timer guard
- Status guard
- Automatic question progression

## Ranking

- Facilitator ranking
- Audience ranking
- `stage2_finished` ranking

## Finish Flow

- Facilitator controlled finish
- Timer stop on finish
- Team finished screen
- Audience results screen

## Firestore Paths

- `competitions/main/system/gameFlow`
- `competitions/main/system/timer`
- `competitions/main/teamStates/{teamId}`
- `competitions/main/answers/stage2_matching_{questionId}_{teamId}`
- `competitions/main/answers/stage2_arrangeVerse_{questionId}_{teamId}`
- `competitions/main/answers/stage2_completeVerse_{questionId}_{teamId}`
- `competitions/main/answers/stage2_trueFalseCorrect_{questionId}_{teamId}`

## Scoring Rules

- Correct answer: **+15**
- Wrong answer: **0**
- Duplicate scoring: **blocked**

## Known Limitations

- Questions are still mock questions
- Excel import not implemented
- Question bank management not implemented
- Ranking persistence not implemented
- Final results not implemented
- Podium not implemented

## Freeze Rule

Do not modify Stage 2 logic unless fixing a confirmed bug.
