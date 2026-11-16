import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing, typography } from "@/src/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Not found" }} />
      <View style={styles.container}>
        <Text style={styles.title}>This screen does not exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go home</Text>
        </Link>
      </View>
    </>
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
    fontSize: typography.sizes.xl,
    color: colors.foreground,
  },
  link: {
    marginTop: spacing.lg,
  },
  linkText: {
    fontFamily: typography.fonts.sansSemibold,
    color: colors.primary,
    fontSize: typography.sizes.base,
  },
});
