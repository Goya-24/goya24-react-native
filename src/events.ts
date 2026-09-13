/**
 * What the messenger tells the app, over the WebView bridge.
 *
 * The messages are the ones the web loader receives from its frame —
 * `{source: "dastyar24", type: …}` — as JSON strings, posted through
 * `window.ReactNativeWebView.postMessage`. `dastyar24` is the loader's
 * original name and is a contract with every site that embeds it; it is not
 * going to change.
 */
export type Goya24Event =
  /** The messenger has booted and is showing the conversation. */
  | { type: "ready" }
  /** Whether the panel is open (inside an app it always is), and how many
   *  replies landed while nobody was looking. */
  | { type: "state"; open: boolean; unread: number }
  /** The person pressed the messenger's close button: pop the screen. */
  | { type: "close" }
  /** The messenger could not start — a wrong key, a revoked one, no network. */
  | { type: "error"; reason: string };

/** The event a bridge message carries, or null for anything that is not one
 *  of ours — a page can post other things. */
export function parseEvent(message: string): Goya24Event | null {
  let decoded: unknown;
  try {
    decoded = JSON.parse(message);
  } catch {
    return null;
  }
  if (typeof decoded !== "object" || decoded === null) return null;
  const data = decoded as Record<string, unknown>;
  if (data.source !== "dastyar24") return null;
  switch (data.type) {
    case "ready":
      return { type: "ready" };
    case "state":
      return {
        type: "state",
        open: data.open === true,
        unread:
          typeof data.unread === "number" && Number.isFinite(data.unread)
            ? Math.trunc(data.unread)
            : 0,
      };
    case "close":
      return { type: "close" };
    case "error":
      return { type: "error", reason: data.reason === undefined ? "unknown" : String(data.reason) };
    default:
      return null;
  }
}
