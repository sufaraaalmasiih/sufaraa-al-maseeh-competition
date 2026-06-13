"use client";

import { ExternalLink, RefreshCw } from "lucide-react";
import { useState } from "react";

interface FacilitatorAudiencePreviewProps {
  compact?: boolean;
}

export function FacilitatorAudiencePreview({
  compact = false,
}: FacilitatorAudiencePreviewProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="facilitator-timer__buttons">
        <a
          className="facilitator-btn facilitator-btn--outline"
          href="/audience"
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          فتح في نافذة جديدة
        </a>
        <button
          type="button"
          className="facilitator-btn facilitator-btn--outline"
          onClick={() => setRefreshKey((key) => key + 1)}
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          تحديث
        </button>
      </div>

      <div
        className={
          compact
            ? "facilitator-audience-preview facilitator-audience-preview--compact"
            : "facilitator-audience-preview"
        }
      >
        <iframe
          key={refreshKey}
          title="معاينة شاشة الجمهور"
          src="/audience"
          className="facilitator-audience-preview__frame"
        />
      </div>
    </div>
  );
}
