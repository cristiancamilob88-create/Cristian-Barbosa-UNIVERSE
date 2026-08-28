import { describe, expect, it, vi } from "vitest";

const afterMock = vi.fn();
vi.mock("next/server", () => ({
  after: (task: () => Promise<void>) => afterMock(task),
}));

describe("runAfterResponse", () => {
  it("hands the task to Next's after() when a request scope exists", async () => {
    afterMock.mockImplementationOnce(() => undefined);
    vi.resetModules();
    const { runAfterResponse } = await import("./afterResponse");
    const task = vi.fn().mockResolvedValue(undefined);

    runAfterResponse(task);

    expect(afterMock).toHaveBeenCalledWith(task);
    // after() owns calling the task in a real request — this helper
    // must not also call it itself, or the task would run twice.
    expect(task).not.toHaveBeenCalled();
  });

  it("falls back to a plain fire-and-forget call when after() throws (no request scope — how this project's route-handler tests invoke POST()/GET())", async () => {
    afterMock.mockImplementationOnce(() => {
      throw new Error("`after` was called outside a request scope.");
    });
    vi.resetModules();
    const { runAfterResponse } = await import("./afterResponse");
    const task = vi.fn().mockResolvedValue(undefined);

    expect(() => runAfterResponse(task)).not.toThrow();
    expect(task).toHaveBeenCalledTimes(1);
  });
});
