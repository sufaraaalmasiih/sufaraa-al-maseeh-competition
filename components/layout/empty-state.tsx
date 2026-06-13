import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description?: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <div className="mx-auto mb-4 h-1 w-16 rounded-full bg-[#84CB2E]" />
        <h2 className="text-2xl font-bold text-[#143A5A]">{title}</h2>
        {description ? (
          <p className="mx-auto mt-3 max-w-2xl text-base leading-8 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
