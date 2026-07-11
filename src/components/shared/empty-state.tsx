import { Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Honest empty state for a canonical read page that has no promoted data yet
 * (as opposed to PagePlaceholder, which marks a page not yet built). We never
 * fake data — pages render exactly what the database holds.
 */
export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Database className="h-6 w-6" />
        </span>
        <div className="max-w-md space-y-1">
          <p className="font-medium">{title}</p>
          {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
