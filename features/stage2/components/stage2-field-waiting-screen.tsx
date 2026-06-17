"use client";

import { Hourglass } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stage2FieldWaitingScreenProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function Stage2FieldWaitingScreen({
  title,
  subtitle = "بانتظار توجيه الميسر",
  className,
}: Stage2FieldWaitingScreenProps) {
  return (
    <section className={cn("stage2-field-waiting-screen", className)}>
      <div className="stage2-field-waiting-screen__card">
        <div className="stage2-field-waiting-screen__badge">تم إنجاز المجال</div>

        <div className="stage2-field-waiting-screen__icon" aria-hidden>
          <Hourglass className="h-8 w-8" strokeWidth={2.4} />
        </div>

        <h2 className="stage2-field-waiting-screen__title">{title}</h2>

        <div className="stage2-field-waiting-screen__footer">
          <span aria-hidden className="stage2-field-waiting-screen__pulse" />
          <p className="stage2-field-waiting-screen__subtitle">{subtitle}</p>
          <p className="stage2-field-waiting-screen__hint">
            سيتم المتابعة عندما يوجّهكم الميسر.
          </p>
        </div>
      </div>
    </section>
  );
}
