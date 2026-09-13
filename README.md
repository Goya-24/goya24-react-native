<p align="center">
  <img src="https://raw.githubusercontent.com/Goya-24/.github/main/profile/goya24-icon.svg" width="72" alt="">
</p>
<h1 align="center">goya24 for React Native</h1>
<p align="center">
  The <a href="https://goya24.com">goya24</a> AI support messenger inside a React Native or Expo app: one component over <code>react-native-webview</code>, with a signed-in user the store can prove and a close button that talks to your navigation.
</p>
<p align="center">
  <a href="https://github.com/Goya-24/goya24-react-native/actions/workflows/ci.yml"><img src="https://github.com/Goya-24/goya24-react-native/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://www.npmjs.com/package/@goya24/react-native"><img src="https://img.shields.io/npm/v/@goya24/react-native?label=%40goya24%2Freact-native" alt="npm"></a>
  <img src="https://img.shields.io/badge/react--native-%E2%89%A50.73-20232A" alt="React Native ≥ 0.73">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-0e7c86" alt="MIT"></a>
</p>

## Install

```sh
npm i @goya24/react-native react-native-webview
```

The package is a thin layer over [`react-native-webview`](https://github.com/react-native-webview/react-native-webview): the messenger is the same one a website shows, served by goya24, in the mode made for apps. Nothing about what it says lives in the app — a fix on the service reaches every app without a release. Expo: `npx expo install react-native-webview`.

For voice messages, declare the microphone: `RECORD_AUDIO` in `AndroidManifest.xml`, `NSMicrophoneUsageDescription` in `Info.plist`. Without them the mic button simply does nothing.

## Open it

```tsx
import { Goya24Messenger } from "@goya24/react-native";

function SupportScreen({ navigation }) {
  return (
    <Goya24Messenger
      options={{
        workspaceKey: "d24_pk_…", // Settings → Install in your workspace
        locale: "fa", // or "en"
      }}
      onClose={() => navigation.goBack()}
    />
  );
}
```

That is a full-screen messenger on a screen of its own; its close button fires `onClose`, and popping the screen is yours. It fills whatever it is put in, so a tab or a sheet works the same way.

## Who is signed in

```tsx
<Goya24Messenger
  options={{
    workspaceKey: "d24_pk_…",
    user: {
      id: "u_1024",
      hash: session.goya24Hash, // hmac_sha256(identitySecret, id), from YOUR server
      name: "Sara",
      email: "sara@example.com",
      plan: "gold",
    },
  }}
/>
```

With `id` and `hash` the identity is **proven**: your server signs the id with the workspace's identity secret (Settings → Install), and goya24 checks the signature before trusting the name and email. That is what lets the agent hand a customer their own orders. Without `hash` the details are still sent, as a claim, and the inbox marks them as one.

Never compute the hash in the app — the secret must not ship inside an app bundle. Ask your backend for it with the session.

Someone who signs in after the messenger opened can be introduced through the ref, as a claim:

```tsx
const messenger = useRef<Goya24MessengerHandle>(null);
messenger.current?.identify({ id: "u_1024", name: "Sara", email: "sara@example.com" });
```

## What it tells you

| Prop         | When                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `onReady`    | The messenger booted and is showing the conversation.                                                                   |
| `onState`    | Whether the panel is open and how many replies are unread, every time either changes.                                   |
| `onUnread`   | The unread count, only when it changes — for a badge on your own button.                                                |
| `onClose`    | The person pressed the messenger's close button. Pop the screen.                                                        |
| `onError`    | It could not start: a wrong key, a revoked one, no network.                                                             |
| `onOpenLink` | A link in a conversation that leads off goya24. The WebView never follows it; by default it goes to the system browser. |

`theme: "dark"`, `backgroundColor` for the frame behind the page while it loads, `style` for layout, and `origin` for a self-hosted goya24 complete the options. `messengerUrl(options)` is exported for anyone who would rather open the same page in a WebView of their own.

## How it talks to the app

The page posts JSON strings through `window.ReactNativeWebView.postMessage` — `{ source: "dastyar24", type: "ready" | "state" | "close" | "error", … }` — and listens for `{ source: "dastyar24-host", type: "identify", data }` on its own window. `dastyar24` is the web loader's original name and a contract with every site that embeds it. `parseEvent` is exported if you drive the WebView yourself.

## Development

```sh
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

Tests run in Node against fakes of the two native modules (`test/mocks`); nothing here needs a simulator.

## License

MIT
