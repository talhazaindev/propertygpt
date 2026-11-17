import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";
import { colors, radii, spacing, typography } from "@/src/theme";

export type FilterOption<T extends string> = {
  value: T;
  label: string;
  Icon?: LucideIcon;
};

type FilterChipProps<T extends string> = {
  label: string;
  selected: boolean;
  onPress: () => void;
  Icon?: LucideIcon;
  testID?: string;
};

export function FilterChip<T extends string>({
  label,
  selected,
  onPress,
  Icon,
  testID,
}: FilterChipProps<T>) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipActive : null]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      testID={testID}
    >
      {Icon ? (
        <Icon
          size={14}
          color={selected ? colors.primaryForeground : colors.primary}
        />
      ) : null}
      <Text style={[styles.label, selected ? styles.labelActive : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

type FilterChipRowProps<T extends string> = {
  label: string;
  options: Array<FilterOption<T>>;
  value: T;
  onChange: (value: T) => void;
  testIDPrefix?: string;
};

export function FilterChipRow<T extends string>({
  label,
  options,
  value,
  onChange,
  testIDPrefix,
}: FilterChipRowProps<T>) {
  return (
    <View style={styles.rowWrap} accessibilityLabel={label}>
      <Text style={styles.rowLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            Icon={option.Icon}
            selected={value === option.value}
            onPress={() => onChange(option.value)}
            testID={
              testIDPrefix
                ? `${testIDPrefix}-${option.value.toLowerCase()}`
                : undefined
            }
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  rowLabel: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.xs,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    minHeight: 36,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    color: colors.foreground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
  labelActive: {
    color: colors.primaryForeground,
  },
});
