import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "CFP Rankings" };

export default function CfpPage() {
  return (
    <PagePlaceholder
      title="CFP Rankings"
      description="The College Football Playoff picture as it develops each week."
      phase="Phase 3"
      bullets={[
        "Committee rankings snapshots",
        "Projected bracket and seeding",
        "CFP race narrative updates",
      ]}
    />
  );
}
