"use client";

import { useState } from "react";
import { ErrorState } from "@/components/layout/state-view";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { startStage3Reveal } from "@/features/stage3/start-stage3-reveal";

export function Stage3StartRevealButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStartReveal() {
    setPending(true);
    setError(null);

    try {
      await startStage3Reveal();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "تعذر بدء الإعلان.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>بدء الإعلان</CardTitle>
        <CardDescription>
          بعد انتهاء وقت الإجابة، اضغط لإظهار النتائج للجميع ووضع السؤال كمُستخدم.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? <ErrorState title="تعذر المتابعة" description={error} /> : null}
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            void handleStartReveal();
          }}
        >
          {pending ? "جاري بدء الإعلان..." : "بدء الإعلان"}
        </Button>
      </CardContent>
    </Card>
  );
}
