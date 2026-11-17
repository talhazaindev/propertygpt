import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BrandMark } from "@/src/components/brand/BrandMark";
import { colors, spacing, typography } from "@/src/theme";

type BrandSplashProps = {
  /** When true, fade the splash out after a short brand beat. */
  ready?: boolean;
  onHidden?: () => void;
};

/**
 * Native-feeling Manzil startup surface shown while fonts/auth hydrate.
 */
export function BrandSplash({ ready = false, onHidden }: BrandSplashProps) {
  const opacity = useRef(new Animated.Value(1)).current;
  const markScale = useRef(new Animated.Value(0.92)).current;
  const markOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(markOpacity, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(markScale, {
          toValue: 1,
          duration: 640,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(lineWidth, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tagOpacity, {
          toValue: 1,
          duration: 420,
          delay: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [lineWidth, markOpacity, markScale, tagOpacity]);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 380,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onHidden?.();
      });
    }, 280);
    return () => clearTimeout(timer);
  }, [onHidden, opacity, ready]);

  return (
    <Animated.View
      style={[styles.overlay, { opacity }]}
      pointerEvents={ready ? "none" : "auto"}
      accessibilityLabel="Manzil is loading"
    >
      <LinearGradient
        colors={[colors.background, "#f3f0e8", colors.secondaryLight]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbTop} />
      <View style={styles.orbBottom} />

      <Animated.View
        style={{
          opacity: markOpacity,
          transform: [{ scale: markScale }],
        }}
      >
        <BrandMark size="hero" />
      </Animated.View>

      <Animated.View
        style={[
          styles.rule,
          {
            transform: [
              {
                scaleX: lineWidth,
              },
            ],
          },
        ]}
      />

      <Animated.View style={{ opacity: tagOpacity }}>
        <Text style={styles.tagline}>Verified property. Clear title.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  orbTop: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(25, 91, 59, 0.08)",
  },
  orbBottom: {
    position: "absolute",
    bottom: -40,
    left: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(209, 162, 85, 0.12)",
  },
  rule: {
    marginTop: spacing.xl,
    height: 1.5,
    width: 120,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  tagline: {
    marginTop: spacing.md,
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    letterSpacing: 0.4,
    textAlign: "center",
  },
});
