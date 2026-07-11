import { UploadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { PageHeader } from "@/components/shared/page-header";
import { ReviewCard, type ReviewUpload } from "./review-card";

export const metadata = { title: "Review Queue" };
export const dynamic = "force-dynamic";

const REVIEWABLE: UploadStatus[] = [
  UploadStatus.DETECTING,
  UploadStatus.PARSING,
  UploadStatus.NEEDS_REVIEW,
  UploadStatus.FAILED,
  UploadStatus.VALIDATED,
];

export default async function ReviewPage() {
  const uploads = await prisma.upload.findMany({
    where: { status: { in: REVIEWABLE } },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      parseResults: {
        orderBy: { createdAt: "desc" },
        include: { entities: { orderBy: { entityType: "asc" } } },
      },
    },
  });

  if (uploads.length === 0) {
    return (
      <PagePlaceholder
        title="Review Queue"
        description="Extracted data awaiting human validation before it becomes canonical."
        phase="Phase 2"
        bullets={[
          "Upload a screenshot to populate the queue",
          "Detection + parsing run automatically after upload",
          "Approve or reject each extracted entity here",
        ]}
      />
    );
  }

  const data: ReviewUpload[] = uploads.map((u) => {
    const latest = u.parseResults[0];
    const entities = u.parseResults.flatMap((pr) => pr.entities);
    return {
      id: u.id,
      originalName: u.originalName,
      publicUrl: u.publicUrl,
      screenType: u.screenType,
      status: u.status,
      detectionConfidence: u.detectionConfidence,
      parseConfidence: latest?.confidence ?? null,
      entities: entities.map((e) => ({
        id: e.id,
        entityType: e.entityType,
        confidence: e.confidence,
        isValidated: e.isValidated,
        payload: e.payload,
      })),
    };
  });

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Review Queue"
        description="Verify vision-extracted data before it is promoted to canonical tables. Nothing here is trusted until you approve it."
      />
      <div className="space-y-6">
        {data.map((u) => (
          <ReviewCard key={u.id} upload={u} />
        ))}
      </div>
    </div>
  );
}
