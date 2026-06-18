"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  listStaffAccounts,
  setStaffAccountActive,
  updateStaffAccountRole,
  type StaffAccountRow,
} from "@/features/facilitator/facilitator-staff-admin";
import type { AppRole } from "@/types";

export function FacilitatorStaffPanel() {
  const [rows, setRows] = useState<StaffAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listStaffAccounts());
    } catch {
      setError("تعذر تحميل حسابات الميسرين.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRoleChange(uid: string, role: Exclude<AppRole, "team">) {
    setBusyUid(uid);
    try {
      await updateStaffAccountRole(uid, role);
      await load();
    } catch {
      setError("تعذر تحديث دور الحساب.");
    } finally {
      setBusyUid(null);
    }
  }

  async function handleActiveToggle(uid: string, active: boolean) {
    setBusyUid(uid);
    try {
      await setStaffAccountActive(uid, !active);
      await load();
    } catch {
      setError("تعذر تحديث حالة الحساب.");
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <div className="facilitator-staff-panel space-y-3">
      <div>
        <h3 className="text-base font-extrabold text-[#143A5A]">إدارة حسابات الميسرين</h3>
        <p className="mt-1 text-sm text-[#143A5A]/75">
          اختر أي ميسر لترقيته إلى مشرف عام، أو إعادته إلى ميسر، أو تعطيل حسابه.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm font-bold text-destructive">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm font-semibold text-[#143A5A]/70">جاري التحميل...</p>
      ) : rows.length === 0 ? (
        <p className="text-sm font-semibold text-[#143A5A]/70">لا توجد حسابات ميسرين بعد.</p>
      ) : (
        <ul className="facilitator-staff-panel__list">
          {rows.map((row) => (
            <li key={row.uid} className="facilitator-staff-panel__row">
              <div className="facilitator-staff-panel__identity">
                <p className="facilitator-staff-panel__name">{row.fullName}</p>
                <p className="facilitator-staff-panel__email">{row.email}</p>
              </div>

              <div className="facilitator-staff-panel__controls">
                <div className="space-y-1">
                  <Label htmlFor={`role-${row.uid}`}>الدور</Label>
                  <select
                    id={`role-${row.uid}`}
                    className="facilitator-staff-panel__select"
                    value={row.role}
                    disabled={busyUid === row.uid}
                    onChange={(event) =>
                      void handleRoleChange(
                        row.uid,
                        event.target.value as Exclude<AppRole, "team">,
                      )
                    }
                  >
                    <option value="facilitator">ميسر</option>
                    <option value="super_admin">مشرف عام</option>
                  </select>
                </div>

                <Button
                  type="button"
                  variant={row.active ? "secondary" : "default"}
                  disabled={busyUid === row.uid}
                  onClick={() => void handleActiveToggle(row.uid, row.active)}
                >
                  {row.active ? "تعطيل" : "تفعيل"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
