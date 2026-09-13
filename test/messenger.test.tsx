import { createRef } from "react";
import { act, create } from "react-test-renderer";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Goya24Messenger, type Goya24MessengerHandle } from "../src/Goya24Messenger";
import { Linking } from "./mocks/react-native";
import { calls } from "./mocks/react-native-webview";

const post = (data: unknown) => {
  act(() => {
    calls.props?.onMessage?.({ nativeEvent: { data: JSON.stringify(data) } });
  });
};

beforeEach(() => {
  calls.injected = [];
  calls.reloads = 0;
  calls.props = null;
  Linking.opened = [];
});

describe("Goya24Messenger", () => {
  it("loads the messenger's app-mode page for the options", () => {
    act(() => {
      create(
        <Goya24Messenger
          options={{ workspaceKey: "d24_pk_abc", locale: "en", user: { id: "u1" } }}
        />,
      );
    });
    expect(calls.props?.source.uri).toBe(
      "https://goya24.com/en/widget?key=d24_pk_abc&theme=light&app=1&uid=u1",
    );
  });

  it("turns the bridge's messages into callbacks, and the unread count only on change", () => {
    const onReady = vi.fn();
    const onState = vi.fn();
    const onUnread = vi.fn();
    const onClose = vi.fn();
    const onError = vi.fn();
    act(() => {
      create(
        <Goya24Messenger
          options={{ workspaceKey: "k" }}
          onReady={onReady}
          onState={onState}
          onUnread={onUnread}
          onClose={onClose}
          onError={onError}
        />,
      );
    });
    post({ source: "dastyar24", type: "ready" });
    post({ source: "dastyar24", type: "state", open: true, unread: 2 });
    post({ source: "dastyar24", type: "state", open: true, unread: 2 });
    post({ source: "dastyar24", type: "state", open: true, unread: 0 });
    post({ source: "dastyar24", type: "close" });
    post({ source: "dastyar24", type: "error", reason: "bad_key" });
    post({ source: "someone-else", type: "close" });

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(onState).toHaveBeenCalledTimes(3);
    expect(onUnread.mock.calls).toEqual([[2], [0]]);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith("bad_key");
  });

  it("keeps the messenger on its own host and hands other links to the app", () => {
    const onOpenLink = vi.fn();
    act(() => {
      create(<Goya24Messenger options={{ workspaceKey: "k" }} onOpenLink={onOpenLink} />);
    });
    const allow = (url: string) => calls.props?.onShouldStartLoadWithRequest?.({ url }) ?? true;
    expect(allow("https://goya24.com/fa/widget?key=k&app=1")).toBe(true);
    expect(allow("https://GOYA24.com/fa/c/abc")).toBe(true);
    expect(allow("about:blank")).toBe(true);
    expect(allow("https://shop.example/order/1001")).toBe(false);
    expect(onOpenLink).toHaveBeenCalledWith("https://shop.example/order/1001");

    // Without a handler the system browser gets it.
    act(() => {
      create(<Goya24Messenger options={{ workspaceKey: "k" }} />);
    });
    expect(allow("https://shop.example/x")).toBe(false);
    expect(Linking.opened).toEqual(["https://shop.example/x"]);
  });

  it("identifies a later sign-in over the bridge, and reloads on request", () => {
    const ref = createRef<Goya24MessengerHandle>();
    act(() => {
      create(<Goya24Messenger ref={ref} options={{ workspaceKey: "k" }} />);
    });
    ref.current?.identify({ id: "u1", name: "Sara", email: "sara@example.com" });
    expect(calls.injected).toHaveLength(1);
    expect(calls.injected[0]).toBe(
      'window.postMessage({"source":"dastyar24-host","type":"identify","data":{"email":"sara@example.com","name":"Sara"}}, "*"); true;',
    );
    ref.current?.reload();
    expect(calls.reloads).toBe(1);
  });
});
