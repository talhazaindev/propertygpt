import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { colors, spacing, typography } from "@/src/theme";

type StateBlockProps = {
  loading?: boolean;
  error?: string | null;
  empty?: string | null;
  onRetry?: () => void;
};

/**
 * Shared loading / empty / error presentation with a11y roles.
 */
export function StateBlock({ loading, error, empty, onRetry }: StateBlockProps) {
  if (loading) {
    return (
      <View
        style={styles.wrap}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading"
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.wrap} accessibilityRole="alert">
        <Text style={styles.error}>{error}</Text>
        {onRetry ? <PrimaryButton label="Retry" onPress={onRetry} /> : null}
      </View>
    );
  }

  if (empty) {
    return (
      <View style={styles.wrap} accessibilityRole="text">
        <Text style={styles.empty}>{empty}</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  error: {
    color: colors.destructive,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
  empty: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
});
