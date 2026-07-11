import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "Coaches" };

export default function CoachesPage() {
  return (
    <PagePlaceholder
      title="Coaches"
      description="Coaching profiles, tenures, and career win-loss records."
      phase="Phase 3"
      bullets={[
        "Head coaches and coordinators",
        "Career records and tenures",
        "Championships and milestones",
      ]}
    />
  );
}
