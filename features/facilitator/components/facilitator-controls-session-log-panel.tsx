"use client";

import { ScrollText } from "lucide-react";
import { SessionEditLogPanel } from "@/features/facilitator/components/session-edit-log-panel";
import type { useActiveSessionEditLog } from "@/features/facilitator/competition-session";

type EditLogEntry = ReturnType<typeof useActiveSessionEditLog>["entries"][number];

interface FacilitatorControlsSessionLogPanelProps {
  showEditLog: boolean;
  onShowEditLogChange: (updater: (current: boolean) => boolean) => void;
  editLogEntries: EditLogEntry[];
  editLogLoading: boolean;
  editLogError: string | null;
}

export function FacilitatorControlsSessionLogPanel({
  showEditLog,
  onShowEditLogChange,
  editLogEntries,
  editLogLoading,
  editLogError,
}: FacilitatorControlsSessionLogPanelProps) {
  return (
    <div className="facilitator-card">
      <div className="facilitator-card__head">
        <ScrollText className="h-5 w-5 text-[#2388C4]" aria-hidden />
        <div>
          <h3 className="facilitator-card__title">سجل تعديلات المسابقة النشطة</h3>
          <p className="facilitator-card__desc">
            يعرض كل إجراء من تبويب التحكم مع القيمة السابقة والقيمة الجديدة لكل تغيير.
          </p>
        </div>
      </div>
      <button
        type="button"
        className="facilitator-btn facilitator-btn--outline"
        onClick={() => onShowEditLogChange((current) => !current)}
      >
        <ScrollText className="h-4 w-4" aria-hidden />
        {showEditLog ? "إخفاء السجل" : "عرض السجل"}
      </button>
      {showEditLog ? (
        <SessionEditLogPanel
          entries={editLogEntries}
          loading={editLogLoading}
          error={editLogError}
          emptyMessage="لا توجد تعديلات مسجلة للمسابقة النشطة بعد."
        />
      ) : null}
    </div>
  );
}
