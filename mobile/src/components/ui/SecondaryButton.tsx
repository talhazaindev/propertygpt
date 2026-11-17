import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
} from "react-native";
import { colors, layout, radii, spacing, typography } from "@/src/theme";

type SecondaryButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
};

export function SecondaryButton({
  label,
  loading = false,
  disabled,
  style,
  ...props
}: SecondaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(isDisabled), busy: loading }}
      disabled={isDisabled}
      style={(state) => [
        styles.button,
        state.pressed && !isDisabled ? styles.pressed : null,
        isDisabled ? styles.disabled : null,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: layout.tapTarget,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  pressed: {
    backgroundColor: colors.secondary,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
});
