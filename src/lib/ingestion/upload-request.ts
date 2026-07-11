import { InputMethod, UploadDomain, type User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getDomain } from "./domains";
import type { DomainHandler } from "./domains";

/**
 * Validates the common fields of an upload request (screenshot or manual) and
 * enforces the domain → team binding rules in one place:
 *
 *   - domain + inputMethod are required and must be compatible with the handler
 *   - dynastyId is required and must exist
 *   - team-scoped domains (handler.requiresControlledTeam) must target the
 *     caller's controlled team; any explicit teamId must match it
 *   - any explicit teamId must belong to the dynasty
 *
 * Returns the resolved user + effective teamId so callers don't re-derive them.
 */
export class UploadRequestError extends Error {
  constructor(
    message: string,
    readonly status: number = 400
  ) {
    super(message);
    this.name = "UploadRequestError";
  }
}

export interface ResolvedUploadRequest {
  user: User;
  dynastyId: string;
  domain: UploadDomain;
  inputMethod: InputMethod;
  handler: DomainHandler;
  teamId: string | null;
}

function asEnum<T extends Record<string, string>>(
  e: T,
  value: unknown
): T[keyof T] | undefined {
  return typeof value === "string" && Object.values(e).includes(value)
    ? (value as T[keyof T])
    : undefined;
}

export async function resolveUploadRequest(input: {
  domain?: unknown;
  inputMethod?: unknown;
  dynastyId?: unknown;
  teamId?: unknown;
}): Promise<ResolvedUploadRequest> {
  const inputMethod =
    input.inputMethod == null
      ? InputMethod.SCREENSHOT
      : asEnum(InputMethod, input.inputMethod);
  if (!inputMethod) {
    throw new UploadRequestError(
      `inputMethod must be one of: ${Object.values(InputMethod).join(", ")}.`
    );
  }

  const domain = asEnum(UploadDomain, input.domain);
  if (!domain) {
    throw new UploadRequestError(
      `domain is required and must be one of: ${Object.values(UploadDomain).join(", ")}.`
    );
  }

  const handler = getDomain(domain);
  if (!handler) {
    throw new UploadRequestError(`No handler registered for domain ${domain}.`, 500);
  }
  if (!handler.allowedInputMethods.includes(inputMethod)) {
    throw new UploadRequestError(
      `Domain ${domain} does not support ${inputMethod} input.`
    );
  }
  if (inputMethod === InputMethod.MANUAL && !handler.manualSchema) {
    throw new UploadRequestError(
      `Domain ${domain} has no manual schema.`,
      500
    );
  }

  const dynastyId = typeof input.dynastyId === "string" ? input.dynastyId : "";
  if (!dynastyId) {
    throw new UploadRequestError("dynastyId is required.");
  }
  const dynasty = await prisma.dynasty.findUnique({ where: { id: dynastyId } });
  if (!dynasty) {
    throw new UploadRequestError("Dynasty not found.", 404);
  }

  const user = await getCurrentUser();
  const membership = await prisma.dynastyMembership.findUnique({
    where: { userId_dynastyId: { userId: user.id, dynastyId } },
  });

  const explicitTeamId =
    typeof input.teamId === "string" && input.teamId ? input.teamId : null;

  // Any explicit team must belong to this dynasty.
  if (explicitTeamId) {
    const team = await prisma.team.findUnique({ where: { id: explicitTeamId } });
    if (!team || team.dynastyId !== dynastyId) {
      throw new UploadRequestError("Team not found in this dynasty.", 404);
    }
  }

  let teamId = explicitTeamId;
  if (handler.requiresControlledTeam) {
    if (!membership?.controlledTeamId) {
      throw new UploadRequestError(
        "Set your controlled team for this dynasty before uploading team-scoped data.",
        409
      );
    }
    if (explicitTeamId && explicitTeamId !== membership.controlledTeamId) {
      throw new UploadRequestError(
        "Team-scoped uploads must target your controlled team.",
        403
      );
    }
    teamId = membership.controlledTeamId;
  }

  return { user, dynastyId, domain, inputMethod, handler, teamId };
}
