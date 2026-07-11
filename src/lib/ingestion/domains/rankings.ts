import { InputMethod, ScreenType, UploadDomain } from "@prisma/client";
import type { DomainHandler } from "./types";

/**
 * RANKINGS — national polls. A screenshot may be either the Top 25 or the CFP
 * board, so no single `screenshotScreenType` is pinned: the pipeline runs the
 * detector and routes to the existing TOP_25 / CFP_RANKINGS parser. Not
 * team-scoped.
 */
export const rankingsDomain: DomainHandler = {
  domain: UploadDomain.RANKINGS,
  label: "Rankings",
  description: "National poll rankings (Top 25 or CFP).",
  allowedInputMethods: [InputMethod.SCREENSHOT],
  allowedScreenTypes: [ScreenType.TOP_25, ScreenType.CFP_RANKINGS],
  requiresControlledTeam: false,
  entityTypes: ["RankingSnapshot", "RankingEntry"],
};
