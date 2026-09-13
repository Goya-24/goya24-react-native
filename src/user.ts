/**
 * Who is signed in to the app, as the messenger is told.
 *
 * With `id` and `hash` the identity is *proven*: your server signs the id
 * with the workspace's identity secret (`hmac_sha256(secret, id)`, hex), and
 * goya24 checks the signature before trusting a word. Without `hash` the
 * details are still sent, as a claim — useful, and the inbox marks it as one.
 *
 * Never compute the hash in the app. The secret must not ship inside an app
 * bundle; the hash comes from your backend, usually with the session.
 */
export interface Goya24User {
  /** Your own id for the user. This is what gets signed. */
  id: string;
  /** `hmac_sha256(identitySecret, id)` as lowercase hex, computed on your
   *  server. Omitted, the user is sent as a claim. */
  hash?: string;
  /** The name the agent greets them by. */
  name?: string;
  /** Their email, for the inbox and for follow-ups. */
  email?: string;
  /** A plan or tier name the agent may mention ("gold", "trial"). */
  plan?: string;
}

/** Whether goya24 will treat this identity as proven. */
export function isProven(user: Goya24User): boolean {
  return typeof user.hash === "string" && user.hash.length > 0;
}

/** The query parameters the messenger reads — the same ones the web loader
 *  puts in the frame's address. */
export function userQuery(user: Goya24User): Record<string, string> {
  const out: Record<string, string> = { uid: user.id };
  if (isProven(user)) out.uhash = user.hash as string;
  if (user.name) out.uname = user.name;
  if (user.email) out.uemail = user.email;
  if (user.plan) out.uplan = user.plan;
  return out;
}

/** The payload of an `identify` message sent after boot — a claim, the way
 *  the web loader's `identify()` sends one. */
export function identifyPayload(user: Goya24User): Record<string, string> {
  const out: Record<string, string> = {};
  if (user.email !== undefined) out.email = user.email;
  if (user.name !== undefined) out.name = user.name;
  if (user.plan !== undefined) out.plan = user.plan;
  return out;
}
