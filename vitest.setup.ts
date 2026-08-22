import { vi } from "vitest";

// `server-only` throws unconditionally unless imported through Next's own
// bundler (which picks the package's "server" export condition) — under
// plain Vitest/Node it always throws "cannot be imported from a Client
// Component module". Every server/db/* module imports it for real builds;
// tests just need it to be a no-op.
vi.mock("server-only", () => ({}));
