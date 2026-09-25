/**
 * Legal identity of the site's owner and the versions of the published
 * policies — the single source for /privacidad, /terminos, the footer's
 * business-data line and the consent checkbox. Real data, sent by
 * Cristian himself (2026-09-24); none of it is invented.
 *
 * Required by Colombian law for a site that collects personal data and
 * sells online: Ley 1581 de 2012 + Decreto 1377 de 2013 (who the data
 * controller is and how to reach them) and Ley 1480 de 2011, art. 50
 * (who the seller is).
 */
export const legalEntity = {
  name: "Cristian Camilo Barbosa Pachón",
  /** Cédula de ciudadanía — also his RUT number (persona natural). */
  documentLabel: "C.C. / RUT",
  documentNumber: "1025520594",
  email: "cristiancamilob88@gmail.com",
  phoneDisplay: "+57 302 634 2927",
  city: "Envigado, Antioquia",
  country: "Colombia",
} as const;

/**
 * Bump when the text of /privacidad changes materially — stored per
 * contact (contact.data_consent_version) so it's always provable which
 * version someone authorized.
 */
export const privacyPolicyVersion = "2026-09-24";
export const termsVersion = "2026-09-24";

export const legalLinks = [
  { href: "/privacidad", label: "Política de privacidad" },
  { href: "/terminos", label: "Términos y condiciones" },
] as const;
