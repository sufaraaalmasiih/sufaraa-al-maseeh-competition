# Stage 2 Player Turns Foundation

## Scope

Sprint 3.2 foundation for **فتشوا الكتب** player-turn flow after reading.

This sprint builds the **field progression shell only**. It does not implement real questions, answers, scoring, or ranking.

## Field order

Teams advance through four fields in this fixed order:

| Order | Field key | Arabic label |
|------:|-----------|--------------|
| 1 | `matching` | توصيل |
| 2 | `arrangeVerse` | رتّب الآية أو الآيات |
| 3 | `completeVerse` | أكمل الآيات |
| 4 | `trueFalseCorrect` | صح أو خطأ مع تصحيح |

Source: `features/stage2/stage2-field-sequence.ts`

## gameFlow status

Active during: `stage2_player_turns`

Prerequisite: `competitions/main/teamStates/{teamId}.stage2Roles.locked === true`

Official finish remains facilitator responsibility via `stage2_finished`. Teams never auto-advance `gameFlow`.

## Firestore progress fields

Path: `competitions/main/teamStates/{teamId}`

Updated on each **إنهاء هذا المجال التجريبي** click:

| Field | Purpose |
|-------|---------|
| `progress.stage2FieldIndex` | Current field index (0–3 active, 4 = all complete) |
| `progress.stage2Field` | Current field key while active; empty string when complete |
| `progress.stage2QuestionIndex` | Synced with field index for future question steps |
| `updatedAt` | Write timestamp |

### Defaults when missing

| Field | Default |
|-------|---------|
| `progress.stage2FieldIndex` | `0` |
| `progress.stage2Field` | `"matching"` |
| `progress.stage2QuestionIndex` | `0` |

## Team UX

When `stage2_player_turns`:

1. If roles not locked → block with Arabic message.
2. Show assigned player for current field.
3. Show field label and `المجال N من 4`.
4. Show placeholder: `سيتم بناء أسئلة هذا المجال في الخطوة القادمة`.
5. Button: `إنهاء هذا المجال التجريبي` → advance to next field in Firestore.
6. After all four fields → `تم إنهاء جميع مجالات المرحلة الثانية، بانتظار توجيه الميسر`.

## Facilitator visibility

When `gameFlow.status === stage2_player_turns`, facilitator panel shows read-only table:

- team name
- current field Arabic label
- field number out of 4
- assigned player (if available)
- completion status

## Audience

No change. Placeholder remains:

`أسئلة مرحلة فتشوا الكتب قيد التنفيذ`

## Intentionally not implemented

- Stage 2 real questions
- Answer documents (`competitions/main/answers/...`)
- Scoring (`stageScores.stage2`, `totalScore`)
- Stage 2 ranking
- Excel import
- Stage 3 / Stage 4
- Automatic `gameFlow` transition to `stage2_finished`

## Stage 1 freeze

Stage 1 logic is unchanged per `docs/stage1-freeze-v1.md`.

## Key files

| File | Role |
|------|------|
| `features/stage2/stage2-field-sequence.ts` | Field metadata + helpers |
| `features/stage2/stage2-progress.ts` | Progress normalization |
| `features/stage2/finish-stage2-field.ts` | Firestore progress write |
| `features/stage2/use-team-stage2-progress.ts` | Team progress hook |
| `features/stage2/use-stage2-team-progress-list.ts` | Facilitator list hook |
| `features/stage2/components/stage2-player-turns-screen.tsx` | Team UI |
| `features/stage2/components/stage2-progress-table.tsx` | Facilitator table |
