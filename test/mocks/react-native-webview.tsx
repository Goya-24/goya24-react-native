import { forwardRef, useImperativeHandle } from "react";

/** A WebView that records what it was told and lets a test drive the two
 *  callbacks the messenger depends on. */
export interface WebViewMessageEvent {
  nativeEvent: { data: string };
}
export interface WebViewNavigation {
  url: string;
}

export interface FakeWebViewProps {
  source: { uri: string };
  onMessage?: (event: WebViewMessageEvent) => void;
  onShouldStartLoadWithRequest?: (request: WebViewNavigation) => boolean;
}

export const calls = {
  injected: [] as string[],
  reloads: 0,
  props: null as FakeWebViewProps | null,
};

export const WebView = forwardRef<unknown, FakeWebViewProps>(function WebView(props, ref) {
  calls.props = props as FakeWebViewProps;
  useImperativeHandle(ref, () => ({
    injectJavaScript(script: string) {
      calls.injected.push(script);
    },
    reload() {
      calls.reloads += 1;
    },
  }));
  return null;
});
