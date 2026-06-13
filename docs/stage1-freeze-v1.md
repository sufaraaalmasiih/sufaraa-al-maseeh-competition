# Stage 1 Freeze v1

## Stage

- Name: `اجمعوا الكنوز`
- Frozen status: `Frozen v1`

## Completed Capabilities

- `stage1_intro`
- `stage1_running`
- `stage1_finished`
- Central timer
- Mock questions
- Answer confirmation
- Firestore answers
- Scoring: `+5` for a correct answer and `0` for a wrong answer
- Duplicate scoring prevention
- Late answer blocking
- Facilitator controls
- Live ranking
- Audience live ranking
- Finished screens
- Test checklist

## Firestore Paths

- `competitions/main/system/gameFlow`
- `competitions/main/system/timer`
- `competitions/main/teamStates/{teamId}`
- `competitions/main/answers/stage1_{questionId}_{teamId}`

## Known Limitations

- Questions are still local mock questions.
- Excel import is not implemented yet.
- Real question bank UI is not implemented yet.

## Freeze Rule

Do not modify Stage 1 logic unless fixing a confirmed bug.
