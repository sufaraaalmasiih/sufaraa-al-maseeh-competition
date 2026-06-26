"use client";

import { Eye, EyeOff, Save } from "lucide-react";
import { useState } from "react";
import { ErrorState, LoadingState } from "@/components/layout/state-view";
import { TeamLogoBadge } from "@/components/competition/team-logo-badge";
import { PLAYER_LABELS } from "@/features/facilitator/components/facilitator-controls-constants";
import type { ControlsConfirmRequest } from "@/features/facilitator/components/facilitator-controls-confirm-card";

interface FacilitatorControlsTeamProfilePanelProps {
  profileLoading: boolean;
  adminLoading: boolean;
  profileError: string | null;
  teamName: string;
  onTeamNameChange: (value: string) => void;
  governorate: string;
  onGovernorateChange: (value: string) => void;
  accountEmail: string;
  onAccountEmailChange: (value: string) => void;
  accountPassword: string;
  onAccountPasswordChange: (value: string) => void;
  /** كلمة المرور النصّية المخزّنة حالياً لعرضها (إن وُجدت). */
  storedPassword?: string;
  playerNames: string[];
  onPlayerNamesChange: (updater: (current: string[]) => string[]) => void;
  logoUrl?: string | null;
  logoPreviewUrl?: string | null;
  logoFileName?: string | null;
  logoSaving?: boolean;
  onLogoFileChange?: (file: File | null) => void;
  onSaveLogo?: () => void;
  confirmRequest: ControlsConfirmRequest | null;
  onSaveProfile: () => void;
}

export function FacilitatorControlsTeamProfilePanel({
  profileLoading,
  adminLoading,
  profileError,
  teamName,
  onTeamNameChange,
  governorate,
  onGovernorateChange,
  accountEmail,
  onAccountEmailChange,
  accountPassword,
  onAccountPasswordChange,
  storedPassword,
  playerNames,
  onPlayerNamesChange,
  logoUrl,
  logoPreviewUrl,
  logoFileName,
  logoSaving = false,
  onLogoFileChange,
  onSaveLogo,
  confirmRequest,
  onSaveProfile,
}: FacilitatorControlsTeamProfilePanelProps) {
  const [showStored, setShowStored] = useState(false);
  return (
    <div className="facilitator-card">
      <div className="facilitator-card__head">
        <Save className="h-5 w-5 text-[#2388C4]" aria-hidden />
        <div>
          <h3 className="facilitator-card__title">إدارة الفريق</h3>
          <p className="facilitator-card__desc">
            تعديل الاسم والمحافظة واللاعبين وبيانات الدخول.
          </p>
        </div>
      </div>

      {profileLoading || adminLoading ? <LoadingState variant="inline" /> : null}
      {profileError ? (
        <ErrorState title="تعذر تحميل ملف الفريق" description={profileError} />
      ) : null}

      {onLogoFileChange && onSaveLogo ? (
        <div className="mb-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4">
          <div className="mb-3 flex items-center gap-3">
            <TeamLogoBadge logoUrl={logoPreviewUrl || logoUrl} teamName={teamName || "الفريق"} variant="header" />
            <div>
              <p className="text-sm font-black text-[#143A5A]">شعار الفريق</p>
              <p className="text-xs font-semibold text-[#64748B]">
                {logoFileName ? `الصورة الجديدة: ${logoFileName}` : logoUrl ? "يوجد شعار محفوظ حالياً." : "لا يوجد شعار محفوظ بعد."}
              </p>
            </div>
          </div>
          <label className="facilitator-field">
            <span className="facilitator-field__label">إضافة أو تغيير صورة الفريق</span>
            <input
              type="file"
              accept="image/*"
              className="facilitator-input"
              onChange={(event) => onLogoFileChange(event.target.files?.[0] ?? null)}
            />
          </label>
          <div className="facilitator-timer__buttons mt-3">
            <button
              type="button"
              className="facilitator-btn facilitator-btn--outline"
              disabled={!logoFileName || logoSaving}
              onClick={onSaveLogo}
            >
              {logoSaving ? "جارٍ رفع الشعار..." : "حفظ شعار الفريق"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="facilitator-field">
          <span className="facilitator-field__label">اسم الفريق</span>
          <input
            className="facilitator-input"
            value={teamName}
            onChange={(event) => onTeamNameChange(event.target.value)}
          />
        </label>
        <label className="facilitator-field">
          <span className="facilitator-field__label">المحافظة</span>
          <input
            className="facilitator-input"
            value={governorate}
            onChange={(event) => onGovernorateChange(event.target.value)}
          />
        </label>
        <label className="facilitator-field">
          <span className="facilitator-field__label">البريد الإلكتروني</span>
          <input
            type="email"
            className="facilitator-input"
            value={accountEmail}
            onChange={(event) => onAccountEmailChange(event.target.value)}
          />
        </label>
        <label className="facilitator-field">
          <span className="facilitator-field__label">كلمة المرور الجديدة</span>
          <input
            type="password"
            className="facilitator-input"
            value={accountPassword}
            onChange={(event) => onAccountPasswordChange(event.target.value)}
            placeholder="6 أحرف على الأقل (اختياري)"
          />
          <span className="mt-1 flex items-center gap-2 text-xs font-bold text-[#475569]">
            كلمة المرور الحالية:
            <code dir="ltr" className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[#143A5A]">
              {storedPassword ? (showStored ? storedPassword : "••••••••") : "غير محفوظة"}
            </code>
            {storedPassword ? (
              <button
                type="button"
                className="inline-flex items-center text-[#2388C4]"
                onClick={() => setShowStored((value) => !value)}
                aria-label={showStored ? "إخفاء" : "إظهار"}
              >
                {showStored ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            ) : null}
          </span>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLAYER_LABELS.map((label, index) => (
          <label key={label} className="facilitator-field">
            <span className="facilitator-field__label">{label}</span>
            <input
              className="facilitator-input"
              value={playerNames[index] ?? ""}
              onChange={(event) =>
                onPlayerNamesChange((current) => {
                  const next = [...current];
                  next[index] = event.target.value;
                  return next;
                })
              }
            />
          </label>
        ))}
      </div>

      <div className="facilitator-timer__buttons">
        <button
          type="button"
          className="facilitator-btn facilitator-btn--primary"
          disabled={confirmRequest !== null}
          onClick={onSaveProfile}
        >
          حفظ بيانات الفريق
        </button>
      </div>
    </div>
  );
}
