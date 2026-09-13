import { describe, expect, it } from "vitest";

import { parseEvent } from "../src/events";

describe("parseEvent", () => {
  it("reads the messenger's own messages", () => {
    expect(parseEvent(JSON.stringify({ source: "dastyar24", type: "ready" }))).toEqual({
      type: "ready",
    });
    expect(parseEvent(JSON.stringify({ source: "dastyar24", type: "close" }))).toEqual({
      type: "close",
    });
    expect(
      parseEvent(JSON.stringify({ source: "dastyar24", type: "state", open: true, unread: 2 })),
    ).toEqual({
      type: "state",
      open: true,
      unread: 2,
    });
    expect(
      parseEvent(JSON.stringify({ source: "dastyar24", type: "error", reason: "bad_key" })),
    ).toEqual({
      type: "error",
      reason: "bad_key",
    });
  });

  it("fills in what a message left out", () => {
    expect(parseEvent(JSON.stringify({ source: "dastyar24", type: "state" }))).toEqual({
      type: "state",
      open: false,
      unread: 0,
    });
    expect(
      parseEvent(JSON.stringify({ source: "dastyar24", type: "state", unread: 2.9 })),
    ).toMatchObject({
      unread: 2,
    });
    expect(parseEvent(JSON.stringify({ source: "dastyar24", type: "error" }))).toEqual({
      type: "error",
      reason: "unknown",
    });
  });

  it("ignores everything that is not ours", () => {
    expect(parseEvent("not json")).toBeNull();
    expect(parseEvent("42")).toBeNull();
    expect(parseEvent(JSON.stringify({ source: "someone-else", type: "ready" }))).toBeNull();
    expect(parseEvent(JSON.stringify({ source: "dastyar24", type: "resize" }))).toBeNull();
  });
});
