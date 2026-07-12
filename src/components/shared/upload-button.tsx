import Link from "next/link";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Contextual "upload a screenshot" entry point. Lives on the read pages where an
 * upload is actually applicable (rosters, box scores, team data) rather than as
 * a global prompt. Passing `domain` preselects it on the upload screen.
 */
export function UploadButton({
  domain,
  label = "Upload",
}: {
  domain?: string;
  label?: string;
}) {
  return (
    <Button variant="outline" size="sm" asChild>
      <Link href={domain ? `/upload?domain=${domain}` : "/upload"}>
        <Upload className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
