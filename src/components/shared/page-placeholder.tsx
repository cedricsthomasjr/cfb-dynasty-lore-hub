import { Construction } from "lucide-react";
import { PageHeader } from "./page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Skeleton for pages whose data-backed implementation lands in a later phase.
 * Keeps navigation complete and the shell consistent without faking data.
 */
export function PagePlaceholder({
  title,
  description,
  phase,
  bullets,
}: {
  title: string;
  description?: string;
  phase?: string;
  bullets?: string[];
}) {
  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        action={phase ? <Badge variant="secondary">{phase}</Badge> : null}
      />
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Construction className="h-6 w-6" />
          </span>
          <div className="max-w-md space-y-1">
            <p className="font-medium">Coming in a later phase</p>
            <p className="text-sm text-muted-foreground">
              This page is wired into navigation and will render verified data
              once the ingestion pipeline and canonical tables are online.
            </p>
          </div>
          {bullets && bullets.length > 0 ? (
            <ul className="mt-2 space-y-1 text-left text-sm text-muted-foreground">
              {bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {b}
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
