// Shared helpers for the training-program integration tests
// (docs/TRAINING.md). Not itself a test file — imported by the ones that are.
import { randomUUID } from "node:crypto";
import { getTestPool } from "./testHelpers.integration";
import { findOrCreateContactDirect } from "./repositories/contact";
import {
  PLAN_DICIEMBRE_PRODUCT_SLUG,
  activateEnrollment,
  getProductIdBySlug,
  upsertPendingEnrollment,
  type EnrollmentRow,
} from "./repositories/training";

export const TEST_MEMBER_SECRET = "member-test-secret-" + "m".repeat(20);

export function uniqueEmail(prefix = "alumno"): string {
  return `${prefix}-${randomUUID()}@example.com`;
}

/**
 * A Plan Diciembre student in a known state — test data only. `startDate`
 * set = approved (active + entitlement); omitted = still pending.
 * `consent` defaults to true (a site sign-up); false models someone
 * Cristian added by hand from /admin.
 */
export async function makeStudent(
  options: { email?: string; name?: string; startDate?: string; consent?: boolean } = {},
): Promise<{ contactId: string; email: string; enrollment: EnrollmentRow }> {
  const email = options.email ?? uniqueEmail();
  const client = await getTestPool().connect();
  try {
    const productId = await getProductIdBySlug(client, PLAN_DICIEMBRE_PRODUCT_SLUG);
    if (!productId) throw new Error("plan-diciembre product missing — run npm run db:setup:test");
    const { contact } = await findOrCreateContactDirect(client, {
      name: options.name ?? "Ana Pérez",
      email,
      phone: null,
    });
    if (options.consent !== false) {
      await client.query("update contact set data_consent_at = now(), data_consent_version = 'test' where id = $1", [
        contact.id,
      ]);
    }
    let enrollment = await upsertPendingEnrollment(client, { contactId: contact.id, productId, goal: "Primera dominada" });
    if (options.startDate) {
      enrollment = (await activateEnrollment(client, enrollment.id, options.startDate)) as EnrollmentRow;
    }
    return { contactId: contact.id, email, enrollment };
  } finally {
    client.release();
  }
}
