import { StyleSheet, Text, View } from "react-native";
import { BadgeCheck } from "lucide-react-native";
import { colors, radii, spacing, typography } from "@/src/theme";

type VerifiedBadgeProps = {
  label?: string;
};

export function VerifiedBadge({ label = "Title Verified" }: VerifiedBadgeProps) {
  return (
    <View style={styles.badge} accessibilityRole="text">
      <BadgeCheck size={14} color={colors.primaryForeground} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: spacing.sm - 2,
  },
  label: {
    color: colors.primaryForeground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.xs,
    letterSpacing: 0.2,
  },
});
