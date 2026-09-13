// The smallest app that shows the messenger: a button with an unread badge,
// and a screen it opens. Drop into an Expo app with react-native-webview
// installed; the key is the one from Settings → Install.
import { useRef, useState } from "react";
import { Modal, Pressable, SafeAreaView, Text } from "react-native";
import { Goya24Messenger, type Goya24MessengerHandle } from "@goya24/react-native";

export default function App() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const messenger = useRef<Goya24MessengerHandle>(null);

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Pressable onPress={() => setOpen(true)}>
        <Text>پشتیبانی{unread > 0 ? ` (${unread})` : ""}</Text>
      </Pressable>
      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <Goya24Messenger
          ref={messenger}
          options={{ workspaceKey: "d24_pk_YOUR_KEY", locale: "fa" }}
          onUnread={setUnread}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </SafeAreaView>
  );
}
