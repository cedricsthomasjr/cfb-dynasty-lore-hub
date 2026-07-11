import { InputMethod, type UploadDomain } from "@prisma/client";
import type { DomainHandler, DomainMeta } from "./types";

/**
 * Domain registry — parallel to the parser registry. Maps each UploadDomain to
 * its handler. Adding a domain = one handler file + one registerDomain() call
 * in domains/index.ts. No switch statements anywhere in the pipeline.
 */
const registry = new Map<UploadDomain, DomainHandler>();

export function registerDomain(handler: DomainHandler): void {
  registry.set(handler.domain, handler);
}

export function getDomain(domain: UploadDomain): DomainHandler | undefined {
  return registry.get(domain);
}

export function allDomains(): DomainHandler[] {
  return [...registry.values()];
}

/** Public, serializable metadata for one handler (for APIs / future UIs). */
export function domainMeta(handler: DomainHandler): DomainMeta {
  return {
    domain: handler.domain,
    label: handler.label,
    description: handler.description,
    allowedInputMethods: handler.allowedInputMethods,
    allowedScreenTypes: handler.allowedScreenTypes,
    screenshotScreenType: handler.screenshotScreenType,
    supportsManual: handler.allowedInputMethods.includes(InputMethod.MANUAL),
    requiresControlledTeam: handler.requiresControlledTeam,
    entityTypes: handler.entityTypes,
  };
}
