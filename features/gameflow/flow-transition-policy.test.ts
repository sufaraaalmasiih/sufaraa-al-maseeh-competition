import { describe, expect, it } from "vitest";
import {
  getFlowTransitionKey,
  getFlowTransitionVariant,
  shouldUseInstantFlowTransition,
} from "@/features/gameflow/flow-transition-policy";

describe("flow-transition-policy", () => {
  describe("getFlowTransitionKey", () => {
    it("groups stage3 reveal and results_done", () => {
      expect(getFlowTransitionKey("stage3_reveal")).toBe("stage3-post-answer");
      expect(getFlowTransitionKey("stage3_results_done")).toBe("stage3-post-answer");
    });

    it("groups stage4 question cycle statuses", () => {
      expect(getFlowTransitionKey("stage4_waiting_question")).toBe("stage4-question-cycle");
      expect(getFlowTransitionKey("stage4_question_open")).toBe("stage4-question-cycle");
      expect(getFlowTransitionKey("stage4_answers_closed")).toBe("stage4-question-cycle");
    });

    it("falls back to status when unmapped", () => {
      expect(getFlowTransitionKey("stage1_running")).toBe("stage1_running");
    });
  });

  describe("shouldUseInstantFlowTransition", () => {
    it("is instant while loading or missing status", () => {
      expect(shouldUseInstantFlowTransition(null, "team", true)).toBe(true);
      expect(shouldUseInstantFlowTransition("stage1_running", "team", true)).toBe(true);
    });

    it("is instant for static gameplay statuses per role", () => {
      expect(shouldUseInstantFlowTransition("stage3_board", "team")).toBe(true);
      expect(shouldUseInstantFlowTransition("stage2_player_turns", "audience")).toBe(false);
      expect(shouldUseInstantFlowTransition("stage2_reading", "audience")).toBe(true);
    });
  });

  describe("getFlowTransitionVariant", () => {
    it("uses reveal variant for reveal scenes", () => {
      expect(getFlowTransitionVariant("stage3_reveal")).toBe("reveal");
      expect(getFlowTransitionVariant("stage4_reveal")).toBe("reveal");
    });

    it("uses stage variant for intro and milestone screens", () => {
      expect(getFlowTransitionVariant("stage1_intro")).toBe("stage");
      expect(getFlowTransitionVariant("final_results")).toBe("stage");
    });

    it("uses default for active gameplay", () => {
      expect(getFlowTransitionVariant("stage1_running")).toBe("default");
    });
  });
});
