"use client";



import { CompetitionGradientShell } from "@/components/layout/competition-gradient-shell";

import { OpenAudienceDisplayActions } from "@/features/audience/components/open-audience-display-actions";

import { AudienceShellBody } from "@/features/audience/components/audience-shell-body";

import {

  getAudienceShellContentClassName,

  shouldCenterAudienceShellContent,

} from "@/features/audience/components/audience-shell-layout";

import { useAudienceShellData } from "@/features/audience/use-audience-shell-data";



interface FacilitatorInlineAudienceDisplayProps {

  compact?: boolean;

}



export function FacilitatorInlineAudienceDisplay({

  compact = false,

}: FacilitatorInlineAudienceDisplayProps) {

  const data = useAudienceShellData();

  const { status, loading } = data;



  return (

    <div className={compact ? "facilitator-audience-mirror facilitator-audience-mirror--compact" : "facilitator-audience-mirror"}>

      <div className="facilitator-audience-mirror__toolbar">

        <p className="facilitator-card__desc">

          عرض مباشر داخل لوحة الميسر — نفس محتوى شاشة الجمهور بدون iframe.

        </p>

      </div>

      <div className="facilitator-audience-mirror__viewport">

        <CompetitionGradientShell

          embedded

          centerContent={shouldCenterAudienceShellContent(status, loading)}

          contentClassName={

            loading

              ? "app-loading-screen__content py-8"

              : getAudienceShellContentClassName(status) ?? "px-4 py-4"

          }

        >

          <AudienceShellBody data={data} loadingVariant="inline" />

        </CompetitionGradientShell>

      </div>

      {!compact ? (

        <OpenAudienceDisplayActions

          primaryLabel="شاشة العرض الكاملة (تبويب جديد)"

          showSameTabLink={false}

        />

      ) : null}

    </div>

  );

}

