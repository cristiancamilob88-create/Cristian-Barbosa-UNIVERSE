import "server-only";

/**
 * Normalizes a phone number from ContactForm's free-text field (digits,
 * spaces, `()`/`-`/`+` allowed — see leadSchema in
 * src/app/api/lead/route.ts) into E.164 for Twilio's WhatsApp API,
 * which requires it. Returns `null` when normalization isn't safe to
 * guess — never sends to a malformed/ambiguous number.
 *
 * Colombian-mobile default, stated explicitly: this site's real market
 * is Colombia (COP pricing, "Colombia local time" throughout
 * src/lib/format.ts) — a 10-digit number starting with `3` and no `+`
 * is assumed to be a Colombian mobile missing its `+57`, not guessed at
 * for any other country code. A number that already has a `+` is
 * trusted as-is (just stripped of formatting characters).
 */
export function normalizePhoneToE164(raw: string): string | null {
  const trimmed = raw.trim();

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    return digits.length >= 8 ? `+${digits}` : null;
  }

  const digitsOnly = trimmed.replace(/\D/g, "");

  // Already has a country code without the `+` (e.g. "57300...", 11-12
  // digits starting with 57) — Colombia's own country code.
  if (digitsOnly.startsWith("57") && digitsOnly.length === 12) {
    return `+${digitsOnly}`;
  }

  // Bare 10-digit Colombian mobile (e.g. "3001234567").
  if (digitsOnly.length === 10 && digitsOnly.startsWith("3")) {
    return `+57${digitsOnly}`;
  }

  return null;
}
