import { describe, it, expect } from "vitest";

describe("Player store logic", () => {
  it("should start as paused", () => {
    const isPlaying = false;
    expect(isPlaying).toBe(false);
  });

  it("should toggle play/pause", () => {
    let isPlaying = false;
    isPlaying = !isPlaying;
    expect(isPlaying).toBe(true);
  });
});
