import { describe, expect, it } from "vitest";

import { DEFAULT_ORIGIN, messengerHost, messengerUrl } from "../src/options";
import { identifyPayload, isProven, userQuery } from "../src/user";

describe("messengerUrl", () => {
  it("opens the messenger's own page in app mode, Persian and light by default", () => {
    const url = new URL(messengerUrl({ workspaceKey: "d24_pk_abc" }));
    expect(url.origin).toBe(DEFAULT_ORIGIN);
    expect(url.pathname).toBe("/fa/widget");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      key: "d24_pk_abc",
      theme: "light",
      app: "1",
    });
  });

  it("carries locale, theme and the signed-in user the way the web loader does", () => {
    const url = new URL(
      messengerUrl({
        workspaceKey: "d24_pk_abc",
        locale: "en",
        theme: "dark",
        user: {
          id: "u_1024",
          hash: "deadbeef",
          name: "Sara",
          email: "sara@example.com",
          plan: "gold",
        },
      }),
    );
    expect(url.pathname).toBe("/en/widget");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      key: "d24_pk_abc",
      theme: "dark",
      app: "1",
      uid: "u_1024",
      uhash: "deadbeef",
      uname: "Sara",
      uemail: "sara@example.com",
      uplan: "gold",
    });
  });

  it("takes a self-hosted origin, with or without a trailing slash", () => {
    expect(messengerUrl({ workspaceKey: "k", origin: "https://support.example/" })).toMatch(
      /^https:\/\/support\.example\/fa\/widget\?/,
    );
    expect(messengerHost({ workspaceKey: "k", origin: "https://Support.Example:8443/" })).toBe(
      "support.example:8443",
    );
    expect(messengerHost({ workspaceKey: "k" })).toBe("goya24.com");
  });
});

describe("Goya24User", () => {
  it("is proven only with a hash, and never sends empty fields", () => {
    expect(isProven({ id: "u1" })).toBe(false);
    expect(isProven({ id: "u1", hash: "" })).toBe(false);
    expect(isProven({ id: "u1", hash: "ab" })).toBe(true);
    expect(userQuery({ id: "u1", name: "" })).toEqual({ uid: "u1" });
    expect(userQuery({ id: "u1", hash: "ab", plan: "trial" })).toEqual({
      uid: "u1",
      uhash: "ab",
      uplan: "trial",
    });
  });

  it("identifies after boot with the claim fields only", () => {
    expect(identifyPayload({ id: "u1", hash: "ab", name: "Sara", email: "s@example.com" })).toEqual(
      {
        name: "Sara",
        email: "s@example.com",
      },
    );
    expect(identifyPayload({ id: "u1" })).toEqual({});
  });
});
