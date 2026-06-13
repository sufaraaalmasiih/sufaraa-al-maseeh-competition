# Stage 1 Question Bank Audit

> Sprint A — compatibility focus (no full 50-question import yet)

## Current bank structure

| Field | Location | Notes |
|-------|----------|-------|
| Source | `features/stage1/stage1-mock-questions.ts` | Static TypeScript array |
| Count | **6** | Dev / QA bank |
| Types | `missing`, `fill_blank`, `multiple_choice`, `arrange` (×2 each category represented) |
| ID pattern | `stage1-{type}-{n}` | Used in answer doc id `stage1_{questionId}_{teamId}` |
| Arrange | `parts` + optional `correctOrder`; answer stored as `a \| b \| c` | Matches old pipe format |
| Text types | `correctAnswer` string only | Graded with `normalizeStage1AnswerText` |

## Old bank structure

| Field | Location | Notes |
|-------|----------|-------|
| Source | `data.js` → `DATA.stage1` | 50 rows from Excel-style tuples |
| Shape | `{ q, answer, options[] }` | Most rows are implicit MC (4 options) |
| Type plan | `getStage1Plan` / `STAGE1_TYPES` | Cycle: ماذا ينقص، اختر من متعدد، رتّب، فراغات |
| Type per row | `q.type` / `q.typeName` from import, else plan slot | `stage1QuestionType` in `script.js`, `contest-fixes-v9542.js` |
| Arrange correct | `answer` or `correctOrder` split by `\|` | `arrangeCorrectParts` |
| Fill samples | Last rows in `data.js` L50–52 | فراغات prompts |

**Old reference files:** `data.js`, `script.js` (L342–358, L2247+), `contest-fixes-v9542.js` (L376–383)

## Migration path (recommended)

1. **Export** old `DATA.stage1` (or Excel) to JSON with explicit `type` per row:
   - `multiple_choice` | `missing` | `fill_blank` | `arrange`
2. **Map fields:**
   - MC: `prompt` ← `q`, `options`, `correctAnswer` ← `answer`
   - missing / fill_blank: `prompt`, `correctAnswer` ← `answer` (no options)
   - arrange: `parts` / `correctOrder` from split `answer`, `correctAnswer` = joined pipe string
3. **Load** via future `stage1-question-bank.ts` (Firestore or static import) — **do not** change answer collection paths.
4. **Cap** at `min(50, bank.length)` to match official max; `progress.stage1QuestionIndex` already supports 0..50.
5. **Shuffle** arrange display with `seededShuffleStage1Parts(teamId|questionId)` (implemented).

## Intentionally not done in Sprint A

- Importing all 50 questions from ZIP (data exists in old `data.js`; not copied into repo).
- Excel upload UI.
- Changing Firestore collection names or scoring constants.
