import type { InteractionEventName } from "@/server/db/repositories/interaction";

/**
 * Classifies a social_profile.platform into the right interaction event
 * name. Pure function (no DB, no server-only) so it's unit-testable on
 * its own — see docs/ANALYTICS_ENGINE.md, "outbound_click".
 *
 * whatsapp -> whatsapp_click (its own funnel step, per the brief).
 * A genuinely social network -> social_click.
 * Anything else (spotify, a future partner/affiliate link, "other") ->
 * outbound_click — previously miscounted as social_click even though
 * e.g. Spotify isn't a social network.
 */
const SOCIAL_NETWORK_PLATFORMS = new Set(["instagram", "facebook", "tiktok", "youtube", "linkedin"]);

export function classifyOutboundEvent(platform: string): InteractionEventName {
  if (platform === "whatsapp") return "whatsapp_click";
  if (SOCIAL_NETWORK_PLATFORMS.has(platform)) return "social_click";
  return "outbound_click";
}
