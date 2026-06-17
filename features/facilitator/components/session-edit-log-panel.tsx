"use client";

import { ScrollText } from "lucide-react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import {
  formatEditLogChanges,
  getEditLogActionLabel,
  type EditLogChangeItem,
} from "@/features/facilitator/edit-log-format";
import type { SessionEditLogEntry } from "@/features/facilitator/competition-session";

function formatDate(ms: number): string {
  if (!ms) {
    return "—";
  }
  try {
    return new Intl.DateTimeFormat("ar", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toLocaleString();
  }
}

function groupChangeItems(items: EditLogChangeItem[]) {
  const groups = new Map<string, EditLogChangeItem[]>();

  items.forEach((item) => {
    const key = item.teamName ?? "";
    const bucket = groups.get(key) ?? [];
    bucket.push(item);
    groups.set(key, bucket);
  });

  return Array.from(groups.entries()).map(([teamName, groupItems]) => ({
    teamName: teamName || null,
    items: groupItems,
  }));
}

function EditLogChangesTable({ items }: { items: EditLogChangeItem[] }) {
  const noteItems = items.filter((item) => item.note && !item.before && !item.after);
  const diffItems = items.filter((item) => item.before !== undefined || item.after !== undefined);

  return (
    <div className="space-y-2">
      {noteItems.map((item) => (
        <p key={`${item.label}-${item.note}`} className="text-sm leading-7 text-[#143A5A]/75">
          <span className="font-black text-[#143A5A]/90">{item.label}: </span>
          {item.note}
        </p>
      ))}

      {diffItems.length > 0 ? (
        <div className="edit-log-diff-table-wrap">
          <table className="edit-log-diff-table">
            <thead>
              <tr>
                <th>الحقل</th>
                <th>القيمة السابقة</th>
                <th>القيمة الجديدة</th>
              </tr>
            </thead>
            <tbody>
              {diffItems.map((item) => (
                <tr key={`${item.label}-${item.before}-${item.after}`}>
                  <td className="edit-log-diff-table__field">{item.label}</td>
                  <td className="edit-log-diff-table__before">{item.before ?? "—"}</td>
                  <td className="edit-log-diff-table__after">{item.after ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

export function SessionEditLogPanel({
  entries,
  loading,
  error,
  title = "سجل التعديلات (للقراءة فقط)",
  emptyMessage = "لا توجد تعديلات مسجلة بعد.",
}: {
  entries: SessionEditLogEntry[];
  loading: boolean;
  error: string | null;
  title?: string;
  emptyMessage?: string;
}) {
  if (loading) {
    return <LoadingState variant="page" />;
  }
  if (error) {
    return <ErrorState title="تعذر تحميل سجل التعديلات" description={error} />;
  }
  if (entries.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-[#143A5A]/10 bg-white/70 p-4">
        <p className="text-sm font-bold text-[#143A5A]/55">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3 rounded-2xl border border-[#143A5A]/10 bg-white/70 p-4">
      <div className="flex items-center gap-2">
        <ScrollText className="h-4 w-4 text-[#2388C4]" aria-hidden />
        <h4 className="text-sm font-black text-[#143A5A]">{title}</h4>
      </div>
      <div className="space-y-4">
        {entries.map((entry) => {
          const changeItems = formatEditLogChanges(entry);
          const groups = groupChangeItems(changeItems);

          return (
            <article key={entry.id} className="edit-log-entry-card">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2388C4]/10 pb-3">
                <strong className="text-sm font-black text-[#143A5A]">
                  {getEditLogActionLabel(entry.action)}
                </strong>
                <span className="text-xs font-bold text-[#143A5A]/45">
                  {formatDate(entry.createdAtMs)}
                </span>
              </div>
              <p className="mt-2 text-sm font-bold text-[#143A5A]/75">
                الميسر: {entry.facilitatorName}
                {entry.teamName ? ` · الفريق: ${entry.teamName}` : ""}
              </p>

              {changeItems.length > 0 ? (
                <div className="mt-3 space-y-4">
                  {groups.map((group) => (
                    <div key={group.teamName ?? "general"}>
                      {group.teamName ? (
                        <span className="edit-log-team-badge">الفريق: {group.teamName}</span>
                      ) : null}
                      <EditLogChangesTable items={group.items} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm font-bold text-[#143A5A]/45">
                  لم تُسجَّل قيم سابقة وجديدة لهذا الإجراء.
                </p>
              )}

              {entry.reason ? (
                <p className="edit-log-reason-box">
                  <span className="font-black">سبب التعديل: </span>
                  {entry.reason}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
