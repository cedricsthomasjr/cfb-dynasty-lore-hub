import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata = { title: "Awards" };

export default function AwardsPage() {
  return (
    <PagePlaceholder
      title="Awards"
      description="Heisman watch and every postseason award, season by season."
      phase="Phase 4"
      bullets={[
        "Heisman watch and finalists",
        "Position and all-conference awards",
        "Historical winners archive",
      ]}
    />
  );
}
