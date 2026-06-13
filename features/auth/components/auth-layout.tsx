import Link from "next/link";
import { Cross } from "lucide-react";
import { CompetitionGradientShell } from "@/components/layout/competition-gradient-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthLayoutProps {
  title: string;
  description: string;
  switchHref?: string;
  switchLabel?: string;
  children: React.ReactNode;
}

export function AuthLayout({
  title,
  description,
  switchHref,
  switchLabel,
  children,
}: AuthLayoutProps) {
  return (
    <CompetitionGradientShell contentClassName="mx-auto flex w-full min-w-0 max-w-3xl flex-col items-center px-4 py-8 text-center">
      <section className="w-full">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-white/15 shadow-sm backdrop-blur-sm">
            <Cross className="h-8 w-8 text-white" strokeWidth={2.4} />
          </div>
          <p className="mt-4 text-sm font-bold text-[#d8f4ff]">Sufaraa Al-Maseeh</p>
          <h1 className="team-waiting-screen__title mt-1">سفراء المسيح</h1>
          <p className="team-waiting-screen__slogan mt-2">نحيا بالكلمة... ونشهد للحق</p>
        </div>
        <Card className="w-full min-w-0 border-white/25 bg-white/90 shadow-[0_18px_50px_rgba(0,0,0,0.15)] backdrop-blur-md">
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            {children}
            {switchHref && switchLabel ? (
              <div className="mt-6 text-center text-sm text-muted-foreground">
                <Link className="font-semibold text-primary hover:underline" href={switchHref}>
                  {switchLabel}
                </Link>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </CompetitionGradientShell>
  );
}
