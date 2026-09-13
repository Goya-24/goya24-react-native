import { userQuery, type Goya24User } from "./user";

/** The language the messenger opens in. It speaks Persian and English. */
export type Goya24Locale = "fa" | "en";

/** The messenger's colours. */
export type Goya24Theme = "light" | "dark";

/** Where the messenger is served from. Only for a self-hosted goya24. */
export const DEFAULT_ORIGIN = "https://goya24.com";

/** Everything the messenger needs to open: the workspace, and who is here. */
export interface Goya24Options {
  /** The workspace's public key, from Settings → Install. It looks like
   *  `d24_pk_…` and is safe to ship in the app: it is on every page of the
   *  site too. */
  workspaceKey: string;
  /** The language the messenger opens in. Persian by default. */
  locale?: Goya24Locale;
  /** Light or dark. Light by default. */
  theme?: Goya24Theme;
  /** Who is signed in, if anyone. See `Goya24User` for how to prove it. */
  user?: Goya24User;
  /** The origin the messenger is loaded from, without a trailing slash.
   *  Only for a self-hosted goya24. */
  origin?: string;
}

/** The page the WebView loads.
 *
 *  `/{locale}/widget` with `app=1` — the messenger's own address, in the
 *  mode made for native apps: full screen, open at once, a close button
 *  that asks the app to put it away, and the signed-in user in the query
 *  exactly as the web loader passes them. */
export function messengerUrl(options: Goya24Options): string {
  const origin = (options.origin ?? DEFAULT_ORIGIN).replace(/\/+$/, "");
  const locale = options.locale ?? "fa";
  const params = new URLSearchParams({
    key: options.workspaceKey,
    theme: options.theme ?? "light",
    app: "1",
    ...(options.user ? userQuery(options.user) : {}),
  });
  return `${origin}/${locale}/widget?${params.toString()}`;
}

/** The host the messenger lives on — what a link inside a conversation is
 *  compared against before the WebView is allowed to follow it. */
export function messengerHost(options: Goya24Options): string {
  const origin = options.origin ?? DEFAULT_ORIGIN;
  const match = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]+)/i.exec(origin);
  return (match?.[1] ?? origin).toLowerCase();
}
