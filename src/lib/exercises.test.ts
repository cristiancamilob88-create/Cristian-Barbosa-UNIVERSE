import { describe, expect, it } from "vitest";
import { exerciseInputSchema, formatBytes, searchKey, videoSizeAdvice, youtubeEmbedUrl, youtubeId } from "./exercises";

describe("youtubeId", () => {
  it("reads every common YouTube link form", () => {
    expect(youtubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtu.be/dQw4w9WgXcQ?si=abc")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://youtube.com/shorts/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://m.youtube.com/watch?v=dQw4w9WgXcQ&t=10")).toBe("dQw4w9WgXcQ");
    expect(youtubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("is null for non-YouTube links and garbage", () => {
    expect(youtubeId("https://www.instagram.com/reel/abc123/")).toBeNull();
    expect(youtubeId("not a url")).toBeNull();
    expect(youtubeId(null)).toBeNull();
    expect(youtubeId("https://www.youtube.com/watch?v=<script>")).toBeNull();
  });

  it("embeds through the privacy-enhanced domain", () => {
    expect(youtubeEmbedUrl("dQw4w9WgXcQ")).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
  });
});

describe("exerciseInputSchema", () => {
  it("turns empty optional fields into null", () => {
    const parsed = exerciseInputSchema.parse({ name: "Fondos", muscleGroup: "triceps", description: "", videoUrl: "" });
    expect(parsed.description).toBeNull();
    expect(parsed.videoUrl).toBeNull();
  });

  it("rejects a non-https video link and an unknown group", () => {
    expect(exerciseInputSchema.safeParse({ name: "X", muscleGroup: "pecho", videoUrl: "javascript:alert(1)" }).success).toBe(false);
    expect(exerciseInputSchema.safeParse({ name: "X", muscleGroup: "gluteo" }).success).toBe(false);
  });
});

describe("searchKey", () => {
  it("ignores accents and case", () => {
    expect(searchKey("Tríceps EN Banco")).toBe("triceps en banco");
  });
});

describe("videoSizeAdvice", () => {
  const MB = 1024 * 1024;

  it("lets a compressed clip through silently", () => {
    expect(videoSizeAdvice(4 * MB)).toEqual({ level: "ok" });
    expect(videoSizeAdvice(15 * MB)).toEqual({ level: "ok" });
  });

  it("warns about a heavy video but still allows it", () => {
    const advice = videoSizeAdvice(38 * MB);
    expect(advice.level).toBe("heavy");
    if (advice.level === "heavy") expect(advice.message).toContain("38 MB");
  });

  it("blocks anything over the 50 MB bucket limit, with how to fix it", () => {
    const advice = videoSizeAdvice(120 * MB);
    expect(advice.level).toBe("too_big");
    if (advice.level === "too_big") expect(advice.message).toMatch(/720p/);
  });
});

describe("formatBytes", () => {
  it("formats MB and GB in Colombian style", () => {
    expect(formatBytes(4.25 * 1024 * 1024)).toBe("4,3 MB");
    expect(formatBytes(152 * 1024 * 1024)).toBe("152 MB");
    expect(formatBytes(1.5 * 1024 * 1024 * 1024)).toBe("1,5 GB");
  });
});
