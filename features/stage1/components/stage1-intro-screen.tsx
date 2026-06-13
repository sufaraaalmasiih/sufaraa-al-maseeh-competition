import { Stage1IntroContent } from "@/features/stage1/components/stage1-intro-content";
import { STAGE1_INTRO_COPY } from "@/features/stage1/stage1-intro-copy";

export function Stage1IntroScreen() {
  return (
    <Stage1IntroContent
      footer={<p className="stage1-intro-screen__hint">{STAGE1_INTRO_COPY.hint}</p>}
    />
  );
}
