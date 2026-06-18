"use client";

import { Check, Copy, ExternalLink, Monitor } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AUDIENCE_DISPLAY_PATH,
  getAudienceDisplayUrl,
  openAudienceDisplayTab,
} from "@/features/audience/audience-display-utils";
import { cn } from "@/lib/utils";

interface OpenAudienceDisplayActionsProps {
  className?: string;
  primaryLabel?: string;
  showSameTabLink?: boolean;
}

export function OpenAudienceDisplayActions({
  className,
  primaryLabel = "فتح شاشة الجمهور (تبويب جديد)",
  showSameTabLink = true,
}: OpenAudienceDisplayActionsProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [openFeedback, setOpenFeedback] = useState<string | null>(null);
  const audienceUrl = getAudienceDisplayUrl();

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(audienceUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setOpenFeedback("تعذر النسخ تلقائياً — انسخ الرابط من الأسفل يدوياً.");
    }
  }

  function handleOpenNewTab() {
    setOpenFeedback(null);
    const opened = openAudienceDisplayTab();
    if (!opened) {
      setOpenFeedback(
        "حظر المتصفح للنوافذ المنبثقة. انسخ الرابط وافتحه يدوياً، أو اسمح بالنوافذ المنبثقة لهذا الموقع.",
      );
      return;
    }
    setOpenFeedback("تم فتح شاشة الجمهور في تبويب جديد — اترك تبويب الميسر مفتوحاً.");
  }

  function handleOpenSameTab() {
    const confirmed = window.confirm(
      "ستغادر لوحة الميسر في هذا التبويب.\n\nللعمل معاً: استخدم «تبويب جديد» واترك الميسر مفتوحاً في التبويب الأول.",
    );
    if (confirmed) {
      router.push(AUDIENCE_DISPLAY_PATH);
    }
  }

  return (
    <div className={cn("open-audience-display-actions", className)}>
      <div className="open-audience-display-actions__buttons">
        <button
          type="button"
          className="facilitator-btn facilitator-btn--primary"
          onClick={handleOpenNewTab}
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          {primaryLabel}
        </button>

        <button
          type="button"
          className="facilitator-btn facilitator-btn--outline"
          onClick={() => void handleCopyUrl()}
        >
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? "تم نسخ الرابط" : "نسخ رابط الشاشة"}
        </button>

        {showSameTabLink ? (
          <button
            type="button"
            className="facilitator-btn facilitator-btn--outline"
            onClick={handleOpenSameTab}
          >
            <Monitor className="h-4 w-4" aria-hidden />
            فتح في هذا التبويب
          </button>
        ) : null}
      </div>

      <p className="open-audience-display-actions__hint open-audience-display-actions__hint--info">
        يمكنك تشغيل الميسر والجمهور معاً من نفس المتصفح: تبويب للميسر وتبويب آخر لـ{" "}
        <span className="font-mono text-sm">{audienceUrl}</span>
        . لا تسجّل دخول فريق في نفس المتصفح أثناء تشغيل الميسر.
      </p>

      {openFeedback ? (
        <p className="open-audience-display-actions__hint open-audience-display-actions__hint--info">
          {openFeedback}
        </p>
      ) : null}
    </div>
  );
}
