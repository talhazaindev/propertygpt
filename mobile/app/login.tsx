import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { API_BASE_URL, APP_ENV } from "@/src/config/env";
import { useAuthStore } from "@/src/store/authStore";
import { colors, radii, spacing, typography } from "@/src/theme";

export default function LoginScreen() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const login = useAuthStore((s) => s.login);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (user) {
    return <Redirect href="/(tabs)/account" />;
  }

  async function onSubmit() {
    clearError();
    try {
      await login(email, password);
      router.replace("/(tabs)/account");
    } catch {
      // Error surfaced via store.
    }
  }

  return (
    <ScreenContainer scroll testID="login-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.wrap}
      >
        <Text style={styles.brand}>Manzil</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>
          Sign in to manage your account, listings, and messages.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor={colors.mutedForeground}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            textContentType="emailAddress"
            autoComplete="email"
            accessibilityLabel="Email"
            testID="login-email"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              secureTextEntry={!showPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={setPassword}
              textContentType="password"
              autoComplete="password"
              accessibilityLabel="Password"
              testID="login-password"
            />
            <Pressable
              onPress={() => setShowPassword((v) => !v)}
              style={styles.showToggle}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Hide password" : "Show password"}
            >
              <Text style={styles.showToggleText}>{showPassword ? "Hide" : "Show"}</Text>
            </Pressable>
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          label="Sign in"
          loading={loading}
          onPress={onSubmit}
          disabled={!email.trim() || !password}
          testID="login-submit"
        />

        <Pressable
          onPress={() => router.push("/register")}
          accessibilityRole="link"
          style={styles.switchRow}
        >
          <Text style={styles.switchText}>
            New to Manzil? <Text style={styles.switchLink}>Create an account</Text>
          </Text>
        </Pressable>

        {APP_ENV === "development" ? (
          <Text style={styles.devHint} accessibilityLabel="API base URL">
            API: {API_BASE_URL}
          </Text>
        ) : null}
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  brand: {
    color: colors.primary,
    fontFamily: typography.fonts.serifBold,
    fontSize: typography.sizes["3xl"],
  },
  title: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["2xl"],
  },
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  field: {
    gap: spacing.xs,
  },
  label: {
    color: colors.foreground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    color: colors.foreground,
    backgroundColor: colors.card,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
  },
  passwordRow: {
    position: "relative",
    justifyContent: "center",
  },
  passwordInput: {
    paddingRight: 72,
  },
  showToggle: {
    position: "absolute",
    right: spacing.md,
    height: 48,
    justifyContent: "center",
  },
  showToggleText: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
  error: {
    color: colors.destructive,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
  },
  switchRow: {
    marginTop: spacing.sm,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  switchText: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
  },
  switchLink: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
  },
  devHint: {
    marginTop: spacing.md,
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
    textAlign: "center",
  },
});
