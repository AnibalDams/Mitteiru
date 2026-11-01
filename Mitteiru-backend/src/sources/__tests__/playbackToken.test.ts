import { afterAll, describe, expect, test } from "bun:test";
import {
  createPlaybackToken,
  decodePlaybackToken,
  isAllowedCdnBase,
} from "../playbackToken";

const originalSecret = process.env.PLAYBACK_TOKEN_SECRET;
process.env.PLAYBACK_TOKEN_SECRET = "test-playback-secret-1234567890";

const CDN_BASE = "https://cdn.animeonsen.xyz/video/mp4-dash/id/1/";

afterAll(() => {
  if (originalSecret === undefined) {
    delete process.env.PLAYBACK_TOKEN_SECRET;
  } else {
    process.env.PLAYBACK_TOKEN_SECRET = originalSecret;
  }
});

describe("playbackToken", () => {
  test("firma y valida una base de CDN permitida", () => {
    const token = createPlaybackToken(CDN_BASE);
    const decoded = decodePlaybackToken(token);

    expect(decoded?.cdnBase).toBe(CDN_BASE);
    expect(decoded?.expiresAt).toBeGreaterThan(Date.now());
  });

  test("rechaza bases fuera de cdn.animeonsen.xyz/video", () => {
    expect(() => createPlaybackToken("https://evil.example/video/")).toThrow();
    expect(isAllowedCdnBase("https://evil.example/video/")).toBe(false);
    expect(isAllowedCdnBase("http://cdn.animeonsen.xyz/video/")).toBe(false);
    expect(isAllowedCdnBase("https://cdn.animeonsen.xyz/other/")).toBe(false);
  });

  test("rechaza tokens manipulados o mal formados", () => {
    const token = createPlaybackToken(CDN_BASE);
    expect(decodePlaybackToken(`${token}x`)).toBeUndefined();
    expect(decodePlaybackToken("bad.token")).toBeUndefined();
    expect(decodePlaybackToken("")).toBeUndefined();
  });
});
