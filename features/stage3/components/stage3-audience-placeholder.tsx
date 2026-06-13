"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { audienceGameFlowLabels } from "@/features/gameflow/gameflow-copy";
import { STAGE3_NAME } from "@/features/stage3/stage3-constants";
import type { GameFlowStatus } from "@/types";

interface Stage3AudiencePlaceholderProps {
  status: GameFlowStatus;
}

export function Stage3AudiencePlaceholder({ status }: Stage3AudiencePlaceholderProps) {
  return (
    <Card>
      <CardHeader className="text-center">
        <p className="text-sm font-bold text-[#4F8A10]">{STAGE3_NAME}</p>
        <CardTitle className="text-3xl text-[#143A5A]">
          {audienceGameFlowLabels[status]}
        </CardTitle>
        <CardDescription className="text-base leading-7">
          بطاقة جمهور تأسيسية — لا تُعرض إجابات أو نقاط حية بعد.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="rounded-md border border-primary/15 bg-white px-4 py-3 text-center text-sm leading-7 text-muted-foreground">
          No answers, scoring, or timers implemented yet.
        </p>
      </CardContent>
    </Card>
  );
}
