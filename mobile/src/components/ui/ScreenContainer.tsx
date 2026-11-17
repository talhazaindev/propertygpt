import { type ReactNode } from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenAtmosphere } from "@/src/components/ui/ScreenAtmosphere";
import { layout, spacing } from "@/src/theme";

type ScreenContainerProps = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  testID?: string;
  atmosphere?: "default" | "hero" | "auth";
};

export function ScreenContainer({
  children,
  scroll = false,
  style,
  testID,
  atmosphere = "default",
}: ScreenContainerProps) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, style]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, style]}>{children}</View>
  );

  return (
    <ScreenAtmosphere variant={atmosphere} style={styles.root}>
      <SafeAreaView
        style={styles.safe}
        edges={["top", "left", "right"]}
        testID={testID}
      >
        {body}
      </SafeAreaView>
    </ScreenAtmosphere>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.lg,
    backgroundColor: "transparent",
  },
});
