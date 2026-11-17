import { StyleSheet, View, type ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/src/theme";

type ScreenAtmosphereProps = ViewProps & {
  variant?: "default" | "hero" | "auth";
};

/**
 * Soft Manzil wash behind screen content — green mist + gold warmth.
 */
export function ScreenAtmosphere({
  variant = "default",
  style,
  children,
  ...props
}: ScreenAtmosphereProps) {
  const gradient =
    variant === "auth"
      ? ([colors.background, "#f1eee4", colors.secondaryLight] as const)
      : variant === "hero"
        ? ([colors.background, "#f4f1e9", "#e8f0ea"] as const)
        : ([colors.background, colors.background] as const);

  return (
    <View style={[styles.root, style]} {...props}>
      <LinearGradient
        colors={[...gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {variant !== "default" ? (
        <>
          <View style={styles.orbPrimary} />
          <View style={styles.orbAccent} />
        </>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  orbPrimary: {
    position: "absolute",
    top: -70,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "rgba(25, 91, 59, 0.07)",
  },
  orbAccent: {
    position: "absolute",
    bottom: 120,
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(209, 162, 85, 0.1)",
  },
});
