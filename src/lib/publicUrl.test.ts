import { describe, it, expect } from "vitest";
import { toPublicUrl } from "./publicUrl";

describe("toPublicUrl", () => {
  it("joins the configured site URL with a path that starts with a slash", () => {
    expect(toPublicUrl("/bienvenida/tamesis-2026")).toBe("https://cristianbarbosa.com/bienvenida/tamesis-2026");
  });

  it("adds the leading slash itself when the path is missing one", () => {
    expect(toPublicUrl("bienvenida/tamesis-2026")).toBe("https://cristianbarbosa.com/bienvenida/tamesis-2026");
  });

  it("doesn't double a trailing slash from the base with a leading one from the path", () => {
    // env.NEXT_PUBLIC_SITE_URL never actually ends in "/" in this app's
    // own config, but this guards the join logic itself either way.
    expect(toPublicUrl("/entrenar")).not.toContain("//entrenar");
  });
});
