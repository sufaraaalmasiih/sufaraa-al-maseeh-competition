"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface StateViewProps {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
}

interface LoadingStateProps extends Partial<StateViewProps> {
  waitingComponent?: string;
}

export function LoadingState({
  title = "جاري التحميل...",
}: LoadingStateProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center text-lg font-semibold">
        {title}
      </CardContent>
    </Card>
  );
}

export function ErrorState({
  title,
  description,
  actionHref,
  actionLabel,
}: StateViewProps) {
  return (
    <Card className="border-destructive/40">
      <CardContent className="p-8 text-center">
        <h2 className="text-xl font-bold text-destructive">{title}</h2>
        {description ? (
          <p className="mt-3 text-muted-foreground">{description}</p>
        ) : null}
        {actionHref && actionLabel ? (
          <Button asChild className="mt-5" variant="outline">
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
