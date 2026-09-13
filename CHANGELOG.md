# Changelog

## 0.1.0

- `Goya24Messenger`: the messenger in app mode over `react-native-webview`, with `onReady`, `onState`, `onUnread`, `onClose`, `onError` and `onOpenLink`.
- A proven signed-in user through `options.user` (`id` + `hash` signed on your server), and `identify()` through the ref for a later sign-in.
- Links that leave goya24 go to the app, never the WebView.
- `messengerUrl`, `messengerHost`, `parseEvent` and the user helpers exported for a WebView of your own.
