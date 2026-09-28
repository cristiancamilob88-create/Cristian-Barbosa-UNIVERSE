import { z } from "zod";

/**
 * Where a requested event is — captured by AddressAutocomplete in the
 * shows form, validated by /api/lead, stored on `lead.event_*`
 * (migration 0016). One schema shared by browser and server so the two
 * can't drift.
 */
export const eventAddressSchema = z.object({
  /** Street + number (or free text when Maps isn't configured). */
  line: z.string().trim().min(3).max(200),
  /** Apto / oficina / salón / referencia — typed by the person. */
  detail: z.string().trim().max(120).optional(),
  city: z.string().trim().max(120).optional(),
  region: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().max(80).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  placeId: z.string().trim().max(300).optional(),
});

export type EventAddress = z.infer<typeof eventAddressSchema>;

/** One component of a Google Places (New) result. */
export interface AddressComponentLike {
  longText: string | null;
  shortText: string | null;
  types: string[];
}

/**
 * Turns a Places (New) result into our fields. Pure, so it's unit
 * tested without Google. Colombian addresses often come back without a
 * street_number (e.g. "Cra. 43A #1-50" lives in `route`) — so the line
 * falls back to the formatted address rather than dropping it.
 */
export function toEventAddress(input: {
  components: AddressComponentLike[];
  formattedAddress?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeId?: string | null;
}): EventAddress {
  const pick = (type: string, short = false) => {
    const c = input.components.find((component) => component.types.includes(type));
    return (short ? c?.shortText : c?.longText) ?? c?.longText ?? undefined;
  };
  const street = [pick("route"), pick("street_number")].filter(Boolean).join(" #").trim();
  const firstPart = input.formattedAddress?.split(",")[0]?.trim();
  const line = street || firstPart || input.formattedAddress?.trim() || "";

  return {
    line,
    city: pick("locality") ?? pick("administrative_area_level_2"),
    region: pick("administrative_area_level_1"),
    postalCode: pick("postal_code"),
    country: pick("country"),
    latitude: input.latitude ?? undefined,
    longitude: input.longitude ?? undefined,
    placeId: input.placeId ?? undefined,
  };
}
