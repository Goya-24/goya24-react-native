import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from "react";
import { Linking, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { WebView } from "react-native-webview";
import type {
  ShouldStartLoadRequest,
  WebViewMessageEvent,
} from "react-native-webview/lib/WebViewTypes";

import { parseEvent, type Goya24Event } from "./events";
import { messengerHost, messengerUrl, type Goya24Options } from "./options";
import { identifyPayload, type Goya24User } from "./user";

/** Talks to a mounted messenger: introduce a user who signed in after it
 *  opened, or load it again. Obtained through the component's `ref`. */
export interface Goya24MessengerHandle {
  /** Tell the messenger who is signed in, after it has opened.
   *
   *  This is a claim, the way the web loader's `identify()` is one: a
   *  proven identity has to be in `options.user` when the messenger opens,
   *  because it travels in the boot request. */
  identify(user: Goya24User): void;
  /** Load the messenger again — after the network came back, say. */
  reload(): void;
}

export interface Goya24MessengerProps {
  /** The workspace, and who is here. */
  options: Goya24Options;
  /** The messenger booted and is showing the conversation. */
  onReady?: () => void;
  /** Whether the panel is open and how many replies are unread — every time
   *  either changes. */
  onState?: (state: { open: boolean; unread: number }) => void;
  /** The unread count, every time it changes. For a badge on your own
   *  button, once the messenger has been opened at least once. */
  onUnread?: (count: number) => void;
  /** The person pressed the messenger's close button. Pop the screen, or
   *  hide the view — the messenger does not put itself away. */
  onClose?: () => void;
  /** The messenger could not start: a wrong key, a revoked one, no network. */
  onError?: (reason: string) => void;
  /** A link inside a conversation that leads off goya24. The WebView does
   *  not follow it — this is the messenger, not a browser. By default it is
   *  handed to the system browser through `Linking.openURL`; pass your own
   *  handler to open it elsewhere, or one that does nothing to ignore it. */
  onOpenLink?: (url: string) => void;
  /** Layout for the WebView. It fills its parent by default. */
  style?: StyleProp<ViewStyle>;
  /** Behind the page while it loads. Defaults to white; on a dark screen
   *  pass the theme's background so the first frame is not a flash. */
  backgroundColor?: string;
}

const HOST_MESSAGE = "dastyar24-host";

/** The goya24 messenger, filling whatever it is put in.
 *
 *  It is the same messenger a website shows, in the mode made for apps: open
 *  at once, no launcher, and a close button that fires `onClose` rather than
 *  shrinking to a corner. Put it on a screen of its own and pop that screen
 *  from `onClose`, or anywhere else a full-height view fits.
 *
 *  ```tsx
 *  <Goya24Messenger
 *    options={{ workspaceKey: "d24_pk_…", locale: "fa", user: { id: "u_1024", hash, name: "Sara" } }}
 *    onClose={() => navigation.goBack()}
 *    onUnread={setUnread}
 *  />
 *  ```
 */
export const Goya24Messenger = forwardRef<Goya24MessengerHandle, Goya24MessengerProps>(
  function Goya24Messenger(
    { options, onReady, onState, onUnread, onClose, onError, onOpenLink, style, backgroundColor },
    ref,
  ) {
    // Two of the WebView instance methods, held through a callback ref: the
    // library types its class generically over the props it is given, which
    // no ref object can be declared to match.
    const web = useRef<{ injectJavaScript(script: string): void; reload(): void } | null>(null);
    const attach = useCallback((instance: unknown) => {
      web.current = instance as { injectJavaScript(script: string): void; reload(): void } | null;
    }, []);
    const unread = useRef(-1);
    const url = useMemo(() => messengerUrl(options), [options]);
    const host = useMemo(() => messengerHost(options), [options]);

    useImperativeHandle(
      ref,
      () => ({
        identify(user) {
          // The messenger listens for `message` events on its own window; a
          // top-level page's `postMessage` delivers one.
          const message = JSON.stringify({
            source: HOST_MESSAGE,
            type: "identify",
            data: identifyPayload(user),
          });
          web.current?.injectJavaScript(`window.postMessage(${message}, "*"); true;`);
        },
        reload() {
          web.current?.reload();
        },
      }),
      [],
    );

    const onMessage = useCallback(
      (event: WebViewMessageEvent) => {
        const parsed: Goya24Event | null = parseEvent(event.nativeEvent.data);
        if (!parsed) return;
        switch (parsed.type) {
          case "ready":
            onReady?.();
            break;
          case "state":
            onState?.({ open: parsed.open, unread: parsed.unread });
            if (parsed.unread !== unread.current) {
              unread.current = parsed.unread;
              onUnread?.(parsed.unread);
            }
            break;
          case "close":
            onClose?.();
            break;
          case "error":
            onError?.(parsed.reason);
            break;
        }
      },
      [onReady, onState, onUnread, onClose, onError],
    );

    const onShouldStartLoadWithRequest = useCallback(
      (request: ShouldStartLoadRequest) => {
        const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(request.url);
        // Anything on the messenger's own host is the messenger; a relative
        // or scheme-less address cannot leave it either.
        if (!match || (match[1] ?? "").toLowerCase() === host) return true;
        if (onOpenLink) onOpenLink(request.url);
        else void Linking.openURL(request.url).catch(() => undefined);
        return false;
      },
      [host, onOpenLink],
    );

    return (
      <WebView
        ref={attach}
        source={{ uri: url }}
        style={[styles.web, backgroundColor ? { backgroundColor } : null, style]}
        onMessage={onMessage}
        onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
        // Voice messages need the microphone. On iOS the page asks and the
        // grant sticks for the messenger's own host; on Android the WebView
        // grants what the app holds. The app still declares RECORD_AUDIO and
        // NSMicrophoneUsageDescription, or the mic button does nothing.
        mediaCapturePermissionGrantType="grantIfSameHostElsePrompt"
        mediaPlaybackRequiresUserAction={false}
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        // Two things a messenger never wants: a zoom that breaks the layout,
        // and an overscroll bounce that reads as the screen coming apart.
        scalesPageToFit={false}
        bounces={false}
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures={false}
        originWhitelist={["https://*", "http://*"]}
      />
    );
  },
);

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: "#ffffff" },
});
