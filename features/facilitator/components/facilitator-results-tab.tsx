"use client";

import { useRef, useState } from "react";
import { Archive, Download, MonitorPlay } from "lucide-react";
import { EmptyState } from "@/components/layout/empty-state";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { setGameFlowStatus } from "@/features/facilitator/facilitator-flow-actions";
import { saveActiveSessionResults } from "@/features/facilitator/competition-session";
import { ArchiveResultsTable } from "@/features/facilitator/components/archive-results-table";
import { exportElementAsPng } from "@/features/facilitator/export-results-image";
import { useFinalResults } from "@/features/facilitator/use-final-results";
import { CompetitionPodium } from "@/components/competition/competition-podium";

export function FacilitatorResultsTab() {
  const { teams, loading, error } = useFinalResults();
  const exportRef = useRef<HTMLDivElement>(null);
  const [pending, setPending] = useState<"final_results" | "podium" | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [archiveMessage, setArchiveMessage] = useState<string | null>(null);

  async function handleExportImage() {
    if (!exportRef.current) {
      return;
    }
    setExporting(true);
    setArchiveMessage(null);
    try {
      await exportElementAsPng(
        exportRef.current,
        `نتائج-سفراء-المسيح-${new Date().toISOString().slice(0, 10)}.png`,
      );
    } catch {
      setArchiveMessage("تعذر تصدير الصورة. حاول مرة أخرى.");
    } finally {
      setExporting(false);
    }
  }

  async function handleArchive() {
    setArchiving(true);
    setArchiveMessage(null);
    try {
      const sessionId = await saveActiveSessionResults(teams, "manual");
      if (!sessionId) {
        setArchiveMessage("لا توجد مسابقة نشطة. ابدأ المسابقة من تبويب «سير المسابقة» أولاً.");
        return;
      }
      setArchiveMessage("تم حفظ النتائج في السجل.");
    } catch {
      setArchiveMessage("تعذر حفظ النتائج في السجل.");
    } finally {
      setArchiving(false);
    }
  }

  const topThree = teams.slice(0, 3);

  async function push(status: "final_results" | "podium") {
    setPending(status);
    setPushError(null);
    try {
      await setGameFlowStatus(status, "final");
    } catch {
      setPushError("تعذر عرض الشاشة على الفرق والجمهور.");
    } finally {
      setPending(null);
    }
  }

  if (loading) {
    return <LoadingState variant="page" />;
  }

  if (error) {
    return <ErrorState title="تعذر تحميل النتائج" description={error} />;
  }

  if (teams.length === 0) {
    return <EmptyState title="لا توجد نتائج بعد." />;
  }

  return (
    <div className="space-y-6">
      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <MonitorPlay className="h-5 w-5 text-[#2388C4]" aria-hidden />
          <div>
            <h3 className="facilitator-card__title">عرض على الفرق والجمهور</h3>
            <p className="facilitator-card__desc">
              ينقل جميع الشاشات إلى النتائج النهائية أو منصة الفائزين.
            </p>
          </div>
        </div>
        <div className="facilitator-timer__buttons">
          <button
            type="button"
            className="facilitator-btn facilitator-btn--primary"
            disabled={pending !== null}
            onClick={() => void push("final_results")}
          >
            {pending === "final_results" ? "جاري العرض..." : "عرض النتائج النهائية"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--primary"
            disabled={pending !== null}
            onClick={() => void push("podium")}
          >
            {pending === "podium" ? "جاري العرض..." : "عرض منصة الفائزين"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={exporting}
            onClick={() => void handleExportImage()}
          >
            <Download className="h-4 w-4" aria-hidden />
            {exporting ? "جاري التصدير..." : "تصدير كصورة"}
          </button>
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            disabled={archiving}
            onClick={() => void handleArchive()}
          >
            <Archive className="h-4 w-4" aria-hidden />
            {archiving ? "جاري الحفظ..." : "حفظ النتائج في السجل"}
          </button>
        </div>
        {pushError ? <p className="facilitator-inline-error">{pushError}</p> : null}
        {archiveMessage ? (
          <p className="facilitator-inline-success">{archiveMessage}</p>
        ) : null}
      </div>

      <div ref={exportRef} className="facilitator-export-target space-y-6">
        <CompetitionPodium
          animate
          teams={topThree.map((team) => ({
            teamId: team.teamId,
            teamName: team.teamName,
            score: team.total,
            governorate: team.governorate,
          }))}
          showGovernorate
        />

      <div className="facilitator-card">
        <div className="facilitator-card__head">
          <div>
            <h3 className="facilitator-card__title">الترتيب العام التفصيلي</h3>
            <p className="facilitator-card__desc">نقاط كل مرحلة والمجموع الكلي.</p>
          </div>
        </div>
        <ArchiveResultsTable teams={teams} />
      </div>
      </div>
    </div>
  );
}
