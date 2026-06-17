"use client";

import { useEffect, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { LoadingState } from "@/components/layout/state-view";
import { DEFAULT_COMPETITION_CONTENT } from "@/features/competition-content/competition-content-defaults";
import type { CompetitionContentDocument } from "@/features/competition-content/competition-content-types";
import {
  resetCompetitionContentCache,
  useCompetitionContent,
  useCompetitionContentSync,
} from "@/features/competition-content/competition-content-runtime";
import {
  saveCompetitionContent,
  subscribeCompetitionContent,
} from "@/features/competition-content/competition-content-store";
import type { GameFlowStatus } from "@/types";

type EditorSection = "brand" | "intro" | "stages" | "team" | "audience" | "waiting";

const SECTIONS: { id: EditorSection; label: string }[] = [
  { id: "brand", label: "العلامة والمقدمة" },
  { id: "intro", label: "مقدمة المسابقة" },
  { id: "stages", label: "شرح المراحل" },
  { id: "team", label: "نصوص شاشة الفريق" },
  { id: "audience", label: "نصوص شاشة الجمهور" },
  { id: "waiting", label: "انتظار المرحلة 3" },
];

const TEAM_STATUS_ORDER: GameFlowStatus[] = [
  "waiting_players",
  "competition_intro",
  "stage1_intro",
  "stage1_running",
  "stage1_finished",
  "stage2_intro",
  "stage2_role_assignment",
  "stage2_reading",
  "stage2_player_turns",
  "stage2_finished",
  "stage3_intro",
  "stage3_board",
  "stage3_question_open",
  "stage3_answer_closed",
  "stage3_reveal",
  "stage3_results_done",
  "stage3_finished",
  "stage4_intro",
  "stage4_waiting_question",
  "stage4_question_open",
  "stage4_answers_closed",
  "stage4_reveal",
  "stage4_finished",
  "final_results",
  "podium",
];

function Field({
  label,
  value,
  onChange,
  multiline = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  hint?: string;
}) {
  return (
    <label className="facilitator-content-field">
      <span>{label}</span>
      {hint ? <span className="facilitator-content-field__hint">{hint}</span> : null}
      {multiline ? (
        <textarea
          className="facilitator-archive__input min-h-24"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          type="text"
          className="facilitator-archive__input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  );
}

function LinesField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  hint?: string;
}) {
  return (
    <label className="facilitator-content-field">
      <span>{label}</span>
      {hint ? <span className="facilitator-content-field__hint">{hint}</span> : null}
      <textarea
        className="facilitator-archive__input min-h-32"
        value={value.join("\n")}
        onChange={(event) =>
          onChange(
            event.target.value
              .split("\n")
              .map((line) => line.trim())
              .filter(Boolean),
          )
        }
      />
    </label>
  );
}

export function FacilitatorAboutTab() {
  useCompetitionContentSync();
  const liveContent = useCompetitionContent();
  const [draft, setDraft] = useState<CompetitionContentDocument>(liveContent);
  const [section, setSection] = useState<EditorSection>("brand");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(
    null,
  );

  useEffect(() => {
    return subscribeCompetitionContent((content) => {
      setLoading(false);
      if (!dirty) {
        setDraft(content);
      }
    });
  }, [dirty]);

  useEffect(() => {
    if (!dirty) {
      setDraft(liveContent);
    }
  }, [liveContent, dirty]);

  function patchDraft(patch: Partial<CompetitionContentDocument>) {
    setDraft((current) => ({ ...current, ...patch }));
    setDirty(true);
    setFeedback(null);
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      await saveCompetitionContent(draft);
      setDirty(false);
      setFeedback({
        kind: "success",
        text: "تم حفظ النصوص. ستظهر فوراً على شاشات الفرق والجمهور.",
      });
    } catch {
      setFeedback({ kind: "error", text: "تعذر حفظ النصوص." });
    } finally {
      setSaving(false);
    }
  }

  async function handleRestoreDefaults() {
    if (!window.confirm("استعادة كل النصوص الافتراضية؟ سيُستبدل المحتوى المحفوظ.")) {
      return;
    }
    setSaving(true);
    try {
      await saveCompetitionContent(DEFAULT_COMPETITION_CONTENT);
      resetCompetitionContentCache();
      setDraft(DEFAULT_COMPETITION_CONTENT);
      setDirty(false);
      setFeedback({ kind: "success", text: "تمت استعادة النصوص الافتراضية." });
    } catch {
      setFeedback({ kind: "error", text: "تعذر استعادة الافتراضي." });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState variant="page" />;
  }

  return (
    <div className="space-y-6">
      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <div>
            <h3 className="facilitator-card__title">تحرير نصوص المسابقة</h3>
            <p className="facilitator-card__desc">
              عدّل كل الكتابات التي تظهر للمتسابقين وللجمهور: المقدمة، شرح المراحل، عناوين
              الشاشات، ونصوص الانتظار. التغييرات تُحفظ في Firestore وتظهر لحظياً.
            </p>
          </div>
        </div>

        <div className="facilitator-content-tabs">
          {SECTIONS.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={
                section === entry.id
                  ? "facilitator-content-tabs__btn facilitator-content-tabs__btn--active"
                  : "facilitator-content-tabs__btn"
              }
              onClick={() => setSection(entry.id)}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="facilitator-content-editor">
          {section === "brand" ? (
            <>
              <Field
                label="اسم المسابقة"
                value={draft.brand.title}
                onChange={(value) => patchDraft({ brand: { ...draft.brand, title: value } })}
              />
              <Field
                label="الشعار"
                value={draft.brand.slogan}
                onChange={(value) => patchDraft({ brand: { ...draft.brand, slogan: value } })}
              />
              <Field
                label="وصف للميسر (لا يظهر للفرق)"
                value={draft.brand.facilitatorDescription}
                multiline
                onChange={(value) =>
                  patchDraft({ brand: { ...draft.brand, facilitatorDescription: value } })
                }
              />
            </>
          ) : null}

          {section === "intro" ? (
            <>
              <Field
                label="عنوان المقدمة"
                value={draft.competitionIntro.eyebrow}
                onChange={(value) =>
                  patchDraft({
                    competitionIntro: { ...draft.competitionIntro, eyebrow: value },
                  })
                }
              />
              <Field
                label="الفقرة التعريفية"
                value={draft.competitionIntro.lead}
                multiline
                onChange={(value) =>
                  patchDraft({
                    competitionIntro: { ...draft.competitionIntro, lead: value },
                  })
                }
              />
              <Field
                label="تلميح الجاهزية (شاشة الفريق)"
                value={draft.competitionIntro.readyHint}
                multiline
                onChange={(value) =>
                  patchDraft({
                    competitionIntro: { ...draft.competitionIntro, readyHint: value },
                  })
                }
              />
              {draft.competitionIntro.stages.map((stage, index) => (
                <div key={stage.number} className="facilitator-content-group">
                  <p className="facilitator-content-group__title">المرحلة {stage.number}</p>
                  <Field
                    label="اسم المرحلة"
                    value={stage.name}
                    onChange={(value) => {
                      const stages = [...draft.competitionIntro.stages];
                      stages[index] = { ...stage, name: value };
                      patchDraft({ competitionIntro: { ...draft.competitionIntro, stages } });
                    }}
                  />
                  <Field
                    label="ملخص المرحلة"
                    value={stage.summary}
                    multiline
                    onChange={(value) => {
                      const stages = [...draft.competitionIntro.stages];
                      stages[index] = { ...stage, summary: value };
                      patchDraft({ competitionIntro: { ...draft.competitionIntro, stages } });
                    }}
                  />
                </div>
              ))}
            </>
          ) : null}

          {section === "stages" ? (
            <>
              {(["stage1", "stage2", "stage3", "stage4"] as const).map((stageKey) => {
                const stage = draft.stages[stageKey];
                const richStageKey =
                  stageKey === "stage1" || stageKey === "stage2" || stageKey === "stage3"
                    ? stageKey
                    : null;
                const ruleSummary = draft.facilitatorStageRules[stageKey];
                return (
                  <div key={stageKey} className="facilitator-content-group">
                    <p className="facilitator-content-group__title">{stage.name}</p>
                    <Field
                      label="اسم المرحلة"
                      value={stage.name}
                      onChange={(value) =>
                        patchDraft({
                          stages: {
                            ...draft.stages,
                            [stageKey]: { ...stage, name: value },
                          },
                        })
                      }
                    />
                    <Field
                      label="عنوان شاشة الشرح"
                      value={stage.title}
                      onChange={(value) =>
                        patchDraft({
                          stages: {
                            ...draft.stages,
                            [stageKey]: { ...stage, title: value },
                          },
                        })
                      }
                    />
                    <Field
                      label="الفقرة التمهيدية"
                      value={stage.lead}
                      multiline
                      onChange={(value) =>
                        patchDraft({
                          stages: {
                            ...draft.stages,
                            [stageKey]: { ...stage, lead: value },
                          },
                        })
                      }
                    />
                    <LinesField
                      label="قواعد المرحلة (سطر لكل قاعدة)"
                      value={stage.rules}
                      onChange={(rules) =>
                        patchDraft({
                          stages: {
                            ...draft.stages,
                            [stageKey]: { ...stage, rules },
                          },
                        })
                      }
                    />
                    {richStageKey ? (
                      <>
                        <Field
                          label="تسمية المرحلة (eyebrow)"
                          value={draft.stages[richStageKey].eyebrow}
                          onChange={(value) =>
                            patchDraft({
                              stages: {
                                ...draft.stages,
                                [richStageKey]: {
                                  ...draft.stages[richStageKey],
                                  eyebrow: value,
                                },
                              },
                            })
                          }
                        />
                        <Field
                          label="عنوان فيديو الشرح"
                          value={draft.stages[richStageKey].videoTitle}
                          onChange={(value) =>
                            patchDraft({
                              stages: {
                                ...draft.stages,
                                [richStageKey]: {
                                  ...draft.stages[richStageKey],
                                  videoTitle: value,
                                },
                              },
                            })
                          }
                        />
                        <Field
                          label="معرّف فيديو YouTube"
                          value={draft.stages[richStageKey].videoId}
                          hint="الجزء بعد /embed/ في رابط يوتيوب"
                          onChange={(value) =>
                            patchDraft({
                              stages: {
                                ...draft.stages,
                                [richStageKey]: {
                                  ...draft.stages[richStageKey],
                                  videoId: value,
                                },
                              },
                            })
                          }
                        />
                        <Field
                          label="تلميح أسفل شاشة الشرح"
                          value={draft.stages[richStageKey].hint}
                          onChange={(value) =>
                            patchDraft({
                              stages: {
                                ...draft.stages,
                                [richStageKey]: {
                                  ...draft.stages[richStageKey],
                                  hint: value,
                                },
                              },
                            })
                          }
                        />
                      </>
                    ) : null}
                    <Field
                      label="ملخص القواعد (للميسر فقط)"
                      value={ruleSummary}
                      multiline
                      onChange={(value) =>
                        patchDraft({
                          facilitatorStageRules: {
                            ...draft.facilitatorStageRules,
                            [stageKey]: value,
                          },
                        })
                      }
                    />
                  </div>
                );
              })}
            </>
          ) : null}

          {section === "team" ? (
            <div className="facilitator-content-status-list">
              {TEAM_STATUS_ORDER.map((status) => (
                <Field
                  key={status}
                  label={status}
                  value={draft.teamStatusLabels[status]}
                  onChange={(value) =>
                    patchDraft({
                      teamStatusLabels: { ...draft.teamStatusLabels, [status]: value },
                    })
                  }
                />
              ))}
            </div>
          ) : null}

          {section === "audience" ? (
            <div className="facilitator-content-status-list">
              {TEAM_STATUS_ORDER.map((status) => (
                <Field
                  key={status}
                  label={status}
                  value={draft.audienceStatusLabels[status]}
                  onChange={(value) =>
                    patchDraft({
                      audienceStatusLabels: { ...draft.audienceStatusLabels, [status]: value },
                    })
                  }
                />
              ))}
            </div>
          ) : null}

          {section === "waiting" ? (
            <>
              {(["answer_closed", "reveal", "results_done"] as const).map((variant) => (
                <div key={`team-${variant}`} className="facilitator-content-group">
                  <p className="facilitator-content-group__title">الفريق — {variant}</p>
                  <Field
                    label="العنوان"
                    value={draft.stage3TeamWaiting[variant].title}
                    onChange={(value) =>
                      patchDraft({
                        stage3TeamWaiting: {
                          ...draft.stage3TeamWaiting,
                          [variant]: { ...draft.stage3TeamWaiting[variant], title: value },
                        },
                      })
                    }
                  />
                  <Field
                    label="الوصف"
                    value={draft.stage3TeamWaiting[variant].subtitle}
                    onChange={(value) =>
                      patchDraft({
                        stage3TeamWaiting: {
                          ...draft.stage3TeamWaiting,
                          [variant]: { ...draft.stage3TeamWaiting[variant], subtitle: value },
                        },
                      })
                    }
                  />
                </div>
              ))}
              {(["answer_closed", "reveal", "results_done"] as const).map((variant) => (
                <div key={`audience-${variant}`} className="facilitator-content-group">
                  <p className="facilitator-content-group__title">الجمهور — {variant}</p>
                  <Field
                    label="العنوان"
                    value={draft.stage3AudienceWaiting[variant].title}
                    onChange={(value) =>
                      patchDraft({
                        stage3AudienceWaiting: {
                          ...draft.stage3AudienceWaiting,
                          [variant]: { ...draft.stage3AudienceWaiting[variant], title: value },
                        },
                      })
                    }
                  />
                  <Field
                    label="الوصف"
                    value={draft.stage3AudienceWaiting[variant].subtitle}
                    onChange={(value) =>
                      patchDraft({
                        stage3AudienceWaiting: {
                          ...draft.stage3AudienceWaiting,
                          [variant]: { ...draft.stage3AudienceWaiting[variant], subtitle: value },
                        },
                      })
                    }
                  />
                </div>
              ))}
            </>
          ) : null}
        </div>

        <div className="facilitator-timer__buttons">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--primary"
            disabled={saving || !dirty}
            onClick={() => void handleSave()}
          >
            <Save className="h-4 w-4" aria-hidden />
            {saving ? "جارٍ الحفظ..." : "حفظ النصوص"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={saving}
            onClick={() => void handleRestoreDefaults()}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            استعادة الافتراضي
          </button>
        </div>

        {feedback ? (
          <p
            className={
              feedback.kind === "success"
                ? "facilitator-inline-success"
                : "facilitator-inline-error"
            }
          >
            {feedback.text}
          </p>
        ) : null}
      </div>
    </div>
  );
}
