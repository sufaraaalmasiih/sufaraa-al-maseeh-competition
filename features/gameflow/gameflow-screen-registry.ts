import type { ReactNode } from "react";
import type { GameFlowStatus } from "@/types";

export type GameFlowScreenRenderer<TContext> = (context: TContext) => ReactNode;

export type GameFlowScreenRegistry<TContext> = Partial<
  Record<GameFlowStatus, GameFlowScreenRenderer<TContext>>
>;

export function resolveGameFlowScreen<TContext>(
  registry: GameFlowScreenRegistry<TContext>,
  status: GameFlowStatus,
  context: TContext,
): ReactNode | undefined {
  const render = registry[status];
  return render ? render(context) : undefined;
}
