/**
 * Manzil design tokens — sourced from web `src/app/globals.css` `:root`.
 * Do not invent a parallel palette.
 */

export const colors = {
  background: "#faf8f3",
  foreground: "#18221b",
  card: "#fffcf7",
  cardForeground: "#18221b",
  primary: "#195b3b",
  primaryForeground: "#faf8f3",
  primaryLight: "#2a7a52",
  primaryDark: "#0f3d28",
  secondary: "#e3efe5",
  secondaryForeground: "#18221b",
  secondaryLight: "#f0f6f1",
  secondaryDark: "#c5d9c9",
  accent: "#d1a255",
  accentForeground: "#18221b",
  muted: "#edf0e7",
  mutedForeground: "#5c6b61",
  border: "#dbe0d6",
  input: "#dbe0d6",
  ring: "#195b3b",
  destructive: "#e11d48",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  "3xl": 48,
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  "2xl": 16,
  "3xl": 24,
  full: 9999,
} as const;

export const typography = {
  fonts: {
    sans: "Manrope_500Medium",
    sansSemibold: "Manrope_600SemiBold",
    sansBold: "Manrope_700Bold",
    serif: "PlayfairDisplay_600SemiBold",
    serifBold: "PlayfairDisplay_700Bold",
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
  },
  weights: {
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
};

export const elevation = {
  card: {
    shadowColor: "#18221b",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
} as const;

export const layout = {
  headerHeight: 64,
  tapTarget: 48,
  contentMaxWidth: 720,
  screenPadding: spacing.lg,
} as const;
