import { stage2RoleFields, type Stage2Roles } from "@/features/stage2/stage2-types";

export function Stage2RoleSummary({ roles }: { roles: Stage2Roles }) {
  return (
    <div className="competition-ranking-panel">
      <div className="competition-ranking-panel__header">
        <h3 className="competition-ranking-panel__title">توزيع المجالات</h3>
        <p className="competition-ranking-panel__desc">كل لاعب مسؤول عن مجال واحد</p>
      </div>
      <div className="grid gap-2 p-4 sm:grid-cols-2">
        {stage2RoleFields.map((field) => (
          <div key={field.key} className="competition-stage-rule">
            <p className="text-sm font-black text-[#4F8A10]">{field.label}</p>
            <p className="mt-1 text-lg font-extrabold text-[#143A5A]">
              {roles[field.key] || "لم يتم التحديد بعد"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
