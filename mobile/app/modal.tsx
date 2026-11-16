import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/src/theme";

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manzil</Text>
      <Text style={styles.body}>Verified property marketplace by AlWahabCo.</Text>
      <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  title: {
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["2xl"],
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    color: colors.mutedForeground,
    textAlign: "center",
  },
});
