"use client";



import type { ReactNode } from "react";

import Image from "next/image";

import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";

import { StageIntroTeamMetaBlock } from "@/features/stage/components/stage-intro-team-meta";



const BRAND_LOGO_SRC = "/brand/sufaraa-logo-transparent.png";



type StageIntroKey = "stage1" | "stage2" | "stage3" | "stage4";



const STAGE_META_LABELS: Record<StageIntroKey, string> = {

  stage1: "المرحلة الأولى",

  stage2: "المرحلة الثانية",

  stage3: "المرحلة الثالثة",

  stage4: "المرحلة الرابعة",

};



interface StageIntroContentProps {

  stage: StageIntroKey;

  showTeamMeta?: boolean;

  showWaitStatus?: boolean;

  /** When a gameplay header is rendered outside the card (team/audience shell). */

  usesExternalHeader?: boolean;

  footer?: ReactNode;

}



export function StageIntroContent({

  stage,

  showTeamMeta = false,

  showWaitStatus = false,

  usesExternalHeader = false,

  footer,

}: StageIntroContentProps) {

  const content = useCompetitionContent();

  const stageContent = content.stages[stage];

  const usesShellHeader = showTeamMeta || usesExternalHeader;



  return (

    <div className="stage1-intro-screen stage1-intro-screen--centered">

      <article className="stage1-intro-screen__card">

        {usesShellHeader ? (

          showWaitStatus ? (

            <div className="stage1-intro-screen__wait-only">

              <div className="stage1-intro-screen__wait-chip">

                <span className="stage1-intro-screen__wait-chip-label">الحالة</span>

                <span className="stage1-intro-screen__wait-chip-value">بانتظار الميسر</span>

              </div>

            </div>

          ) : null

        ) : (

          <header className="stage1-intro-screen__header stage1-intro-screen__header--split">

            <div className="stage1-intro-screen__brand-cluster">

              <Image

                src={BRAND_LOGO_SRC}

                alt={`شعار ${content.brand.title}`}

                width={80}

                height={76}

                priority

                className="stage1-intro-screen__header-logo"

              />

              <div className="stage1-intro-screen__header-copy">

                <h1 className="stage1-intro-screen__competition-name">{content.brand.title}</h1>

                <p className="stage1-intro-screen__competition-slogan">{content.brand.slogan}</p>

              </div>

            </div>



            <div className="stage1-intro-screen__header-side">

              {showTeamMeta ? (

                <StageIntroTeamMetaBlock stageLabel={STAGE_META_LABELS[stage]} />

              ) : (

                <span className="stage1-intro-screen__team-slot" aria-hidden />

              )}



              {showWaitStatus ? (

                <div className="stage1-intro-screen__wait-chip">

                  <span className="stage1-intro-screen__wait-chip-label">الحالة</span>

                  <span className="stage1-intro-screen__wait-chip-value">بانتظار الميسر</span>

                </div>

              ) : null}

            </div>

          </header>

        )}



        {usesShellHeader && !showWaitStatus ? null : (

          <div className="stage1-intro-screen__divider" aria-hidden />

        )}



        <div className="stage1-intro-screen__body">

          <div className="stage1-intro-screen__stage-block">

            <p className="competition-intro__stage-number">{stageContent.eyebrow}</p>

            <h2 className="stage1-intro-screen__stage-name">{stageContent.name}</h2>

            <p className="stage1-intro-screen__lead">{stageContent.lead}</p>

          </div>



          <div className="stage1-intro-screen__content-row">

            <ul className="stage1-intro-screen__rules">

              {stageContent.rules.map((line) => (

                <li key={line} className="stage1-intro-screen__rule">

                  {line}

                </li>

              ))}

            </ul>



            <div className="stage1-intro-screen__video-wrap">

              <p className="stage1-intro-screen__video-label">فيديو الشرح</p>

              <div className="stage1-intro-screen__video">

                <iframe

                  src={`https://www.youtube-nocookie.com/embed/${stageContent.videoId}`}

                  title={stageContent.videoTitle}

                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"

                  referrerPolicy="strict-origin-when-cross-origin"

                  allowFullScreen

                  className="stage1-intro-screen__video-frame"

                />

              </div>

            </div>

          </div>

        </div>

      </article>



      {footer ? <div className="stage1-intro-screen__footer">{footer}</div> : null}

    </div>

  );

}

