import type { ReactNode } from "react";
import competitionLogo from "@/features/team/assets/competition-logo-white-transparent.png";
import {
  STAGE1_INTRO_COPY,
  STAGE1_INTRO_VIDEO_ID,
} from "@/features/stage1/stage1-intro-copy";

interface Stage1IntroContentProps {
  teamName?: string;
  footer?: ReactNode;
}

export function Stage1IntroContent({ teamName, footer }: Stage1IntroContentProps) {
  return (
    <div className="stage1-intro-screen">
      <article className="stage1-intro-screen__card">
        <header className="stage1-intro-screen__header">
          <img
            src={competitionLogo.src}
            alt={`شعار ${STAGE1_INTRO_COPY.competitionName}`}
            width={competitionLogo.width}
            height={competitionLogo.height}
            decoding="async"
            className="stage1-intro-screen__header-logo"
          />
          <div className="stage1-intro-screen__header-copy">
            <h1 className="stage1-intro-screen__competition-name">
              {STAGE1_INTRO_COPY.competitionName}
            </h1>
            <p className="stage1-intro-screen__competition-slogan">
              {STAGE1_INTRO_COPY.competitionSlogan}
            </p>
            {teamName ? (
              <p className="stage1-intro-screen__team-name">{teamName}</p>
            ) : null}
          </div>
        </header>

        <div className="stage1-intro-screen__divider" aria-hidden />

        <div className="stage1-intro-screen__body">
          <div className="stage1-intro-screen__stage-block">
            <p className="competition-intro__stage-number">{STAGE1_INTRO_COPY.eyebrow}</p>
            <h2 className="stage1-intro-screen__stage-name">{STAGE1_INTRO_COPY.stageName}</h2>
            <p className="stage1-intro-screen__lead">{STAGE1_INTRO_COPY.lead}</p>
          </div>

          <div className="stage1-intro-screen__content-row">
            <ul className="stage1-intro-screen__rules">
              {STAGE1_INTRO_COPY.details.map((line) => (
                <li key={line} className="stage1-intro-screen__rule">
                  {line}
                </li>
              ))}
            </ul>

            <div className="stage1-intro-screen__video-wrap">
              <p className="stage1-intro-screen__video-label">فيديو الشرح</p>
              <div className="stage1-intro-screen__video">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${STAGE1_INTRO_VIDEO_ID}`}
                  title={STAGE1_INTRO_COPY.videoTitle}
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
