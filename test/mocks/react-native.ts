/** Just enough of react-native for the component to render in Node. */
export const Linking = {
  opened: [] as string[],
  openURL(url: string): Promise<void> {
    Linking.opened.push(url);
    return Promise.resolve();
  },
};

export const StyleSheet = {
  create<T>(styles: T): T {
    return styles;
  },
};

export type StyleProp<T> = T | T[] | null | undefined;
export type ViewStyle = Record<string, unknown>;
