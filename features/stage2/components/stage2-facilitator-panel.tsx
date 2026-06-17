"use client";

import { useMemo, useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { finishStage2Field } from "@/features/stage2/finish-stage2-field";
import { startStage2AnsweringTimer } from "@/features/facilitator/facilitator-flow-actions";
import { getStage2NextField, STAGE2_FIELD_COUNT } from "@/features/stage2/stage2-field-sequence";
import { isStage2FieldQuestionsComplete } from "@/features/stage2/stage2-field-completion";
import {
  useStage2TeamProgressList,
  type Stage2TeamProgressRow,
} from "@/features/stage2/use-stage2-team-progress-list";

function isTeamReadyForNextField(team: Stage2TeamProgressRow): boolean {
  return isStage2FieldQuestionsComplete(
    team.fieldIndex,
    team.stage2QuestionIndex,
    team.isComplete,
  );
}

export function Stage2FacilitatorPanel() {
  const { teams, loading, error } = useStage2TeamProgressList();
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const readyTeams = useMemo(
    () => teams.filter((team) => isTeamReadyForNextField(team)),
    [teams],
  );

  const nextFieldLabel = useMemo(() => {
    const sample = readyTeams[0];
    if (!sample) {
      return null;
    }
    return getStage2NextField(sample.fieldIndex)?.field.label ?? null;
  }, [readyTeams]);

  const advanceLabel = nextFieldLabel
    ? `الانتقال إلى ${nextFieldLabel}`
    : "الانتقال للمجال التالي";

  async function handleAdvanceReadyTeams() {
    if (readyTeams.length === 0 || pending) {
      return;
    }

    setPending(true);
    setActionError(null);

    try {
      await Promise.all(
        readyTeams.map((team) => finishStage2Field(team.teamId, team.fieldIndex)),
      );
      await startStage2AnsweringTimer();
    } catch {
      setActionError("تعذر الانتقال للمجال التالي. تحقق من الاتصال وحاول مرة أخرى.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flow-workspace-panel stage2-facilitator-wrap">
      <div className="stage2-facilitator-panel">
        <div className="stage2-facilitator-panel__header">
          <p className="stage2-facilitator-toolbar__kicker">فتشوا الكتب</p>
          <h3 className="stage2-facilitator-toolbar__title">تقدم مجالات المرحلة الثانية</h3>
          <p className="stage2-facilitator-toolbar__desc">
            راقب تقدم كل فريق. عند إنهاء أسئلة المجال الحالي، انقل الفريق للمجال التالي.
          </p>
        </div>

        {loading ? <LoadingState variant="inline" /> : null}
        {error ? <ErrorState title="تعذر تحميل التقدم" description={error} /> : null}

        {!loading && !error && teams.length > 0 ? (
          <div className="stage2-facilitator-table-wrap">
            <table className="stage2-facilitator-table">
              <thead>
                <tr>
                  <th>الفريق</th>
                  <th>المجال الحالي</th>
                  <th>رقم المجال</th>
                  <th>المتسابق</th>
                  <th>السؤال</th>
                  <th>نقاط م2</th>
                  <th>المجموع</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => {
                  const ready = isTeamReadyForNextField(team);
                  return (
                    <tr
                      key={team.teamId}
                      className={
                        ready
                          ? "stage2-facilitator-table__row--ready"
                          : team.isComplete
                            ? "stage2-facilitator-table__row--done"
                            : undefined
                      }
                    >
                      <td className="stage2-facilitator-table__team">{team.teamName}</td>
                      <td>{team.currentFieldLabel}</td>
                      <td className="stage2-facilitator-table__num">
                        {team.isComplete
                          ? `${STAGE2_FIELD_COUNT}/${STAGE2_FIELD_COUNT}`
                          : team.fieldOrder
                            ? `${team.fieldOrder}/${STAGE2_FIELD_COUNT}`
                            : "—"}
                      </td>
                      <td>{team.isComplete ? "—" : team.assignedPlayerName}</td>
                      <td className="stage2-facilitator-table__num">{team.stage2QuestionIndex}</td>
                      <td className="stage2-facilitator-table__num">{team.stage2Score}</td>
                      <td className="stage2-facilitator-table__num">{team.totalScore}</td>
                      <td>
                        <span
                          className={`stage2-facilitator-table__badge${
                            ready
                              ? " stage2-facilitator-table__badge--ready"
                              : team.isComplete
                                ? " stage2-facilitator-table__badge--done"
                                : ""
                          }`}
                        >
                          {team.isComplete
                            ? "اكتمل"
                            : ready
                              ? "جاهز للانتقال"
                              : "قيد التنفيذ"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="stage2-facilitator-toolbar">
          <div className="facilitator-action-bar">
            <button
              type="button"
              className="facilitator-btn facilitator-btn--primary"
              disabled={pending || readyTeams.length === 0}
              onClick={() => void handleAdvanceReadyTeams()}
            >
              {pending ? "جاري الانتقال..." : advanceLabel}
            </button>
          </div>

          {readyTeams.length > 0 ? (
            <p className="stage2-facilitator-toolbar__hint stage2-facilitator-toolbar__hint--ready">
              {readyTeams.length === 1
                ? "فريق واحد أنهى المجال الحالي وجاهز للانتقال."
                : `${readyTeams.length} فرق أنهت المجال الحالي وجاهزة للانتقال.`}
            </p>
          ) : (
            <p className="stage2-facilitator-toolbar__hint">
              بانتظار إنهاء الفرق لأسئلة المجال الحالي...
            </p>
          )}

          {actionError ? (
            <ErrorState title="تعذر الانتقال" description={actionError} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
