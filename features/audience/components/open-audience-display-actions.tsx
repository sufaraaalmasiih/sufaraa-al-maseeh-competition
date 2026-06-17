"use client";



import { Check, Copy, ExternalLink, Monitor } from "lucide-react";

import Link from "next/link";

import { useState } from "react";

import {

  AUDIENCE_DISPLAY_PATH,

  getAudienceDisplayUrl,

} from "@/features/audience/audience-display-utils";

import { cn } from "@/lib/utils";



interface OpenAudienceDisplayActionsProps {

  className?: string;

  primaryLabel?: string;

  showSameTabLink?: boolean;

}



export function OpenAudienceDisplayActions({

  className,

  primaryLabel = "فتح على الشاشة الكبيرة (تبويب جديد)",

  showSameTabLink = true,

}: OpenAudienceDisplayActionsProps) {

  const [copied, setCopied] = useState(false);

  const audienceUrl = getAudienceDisplayUrl();



  async function handleCopyUrl() {

    try {

      await navigator.clipboard.writeText(audienceUrl);

      setCopied(true);

      window.setTimeout(() => setCopied(false), 2500);

    } catch {

      // Clipboard may be blocked — user can copy from the hint below.

    }

  }



  return (

    <div className={cn("open-audience-display-actions", className)}>

      <div className="open-audience-display-actions__buttons">

        <Link

          href={AUDIENCE_DISPLAY_PATH}

          target="_blank"

          rel="noopener noreferrer"

          className="facilitator-btn facilitator-btn--primary no-underline"

        >

          <ExternalLink className="h-4 w-4" aria-hidden />

          {primaryLabel}

        </Link>



        <button

          type="button"

          className="facilitator-btn facilitator-btn--outline"

          onClick={() => void handleCopyUrl()}

        >

          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}

          {copied ? "تم نسخ الرابط" : "نسخ رابط الشاشة"}

        </button>



        {showSameTabLink ? (

          <Link href={AUDIENCE_DISPLAY_PATH} className="facilitator-btn facilitator-btn--outline no-underline">

            <Monitor className="h-4 w-4" aria-hidden />

            فتح في هذا التبويب

          </Link>

        ) : null}

      </div>



      <p className="open-audience-display-actions__hint open-audience-display-actions__hint--info">

        إذا ظهر تبويب فارغ، انسخ الرابط وافتحه يدوياً:{" "}

        <span className="font-mono text-sm">{audienceUrl}</span>

      </p>

    </div>

  );

}

