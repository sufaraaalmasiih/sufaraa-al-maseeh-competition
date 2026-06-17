"use client";

import Image from "next/image";
import { useCompetitionContent } from "@/features/competition-content/competition-content-runtime";

const BRAND_LOGO_SRC = "/brand/sufaraa-logo-transparent.png";

interface CompetitionIntroCardHeaderProps {
  title?: string;
  description?: string;
}

export function CompetitionIntroCardHeader({
  title,
  description,
}: CompetitionIntroCardHeaderProps) {
  const content = useCompetitionContent();

  return (
    <>
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
        <span className="stage1-intro-screen__team-slot" aria-hidden />
      </header>

      {title || description ? (
        <>
          <div className="stage1-intro-screen__divider" aria-hidden />
          <div className="stage1-intro-screen__stage-block">
            {title ? <h2 className="stage1-intro-screen__stage-name">{title}</h2> : null}
            {description ? <p className="stage1-intro-screen__lead">{description}</p> : null}
          </div>
        </>
      ) : null}
    </>
  );
}
