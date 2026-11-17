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
import { BrandMark } from "@/src/components/brand/BrandMark";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { getApiErrorMessage } from "@/src/services/api/client";
import {
  resetPassword,
  sendResetOtp,
  verifyResetOtp,
} from "@/src/services/auth/authApi";
import { useAuthStore } from "@/src/store/authStore";
import { colors, radii, spacing, typography } from "@/src/theme";

type Step = "email" | "otp" | "password" | "done";

export default function ForgotPasswordScreen() {
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Redirect href="/(tabs)/account" />;
  }

  async function onSendCode() {
    setError(null);
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    try {
      await sendResetOtp(email);
      setStep("otp");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send reset code"));
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyCode() {
    setError(null);
    if (!code.trim()) {
      setError("Enter the verification code from your email");
      return;
    }
    setLoading(true);
    try {
      const result = await verifyResetOtp({ email, code });
      setResetToken(result.resetToken);
      setStep("password");
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid verification code"));
    } finally {
      setLoading(false);
    }
  }

  async function onResetPassword() {
    setError(null);
    if (
      password.length < 8 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/[0-9]/.test(password)
    ) {
      setError(
        "Password needs 8+ characters with upper, lower, and a number"
      );
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await resetPassword({
        email,
        resetToken,
        password,
        confirmPassword,
      });
      setStep("done");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not reset password"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll atmosphere="auth" testID="forgot-password-screen">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.wrap}
      >
        <View style={styles.brandBlock}>
          <BrandMark size="lg" />
        </View>

        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          {step === "email"
            ? "Enter the email for your Manzil account."
            : step === "otp"
              ? "Enter the code we emailed you."
              : step === "password"
                ? "Choose a new password."
                : "Your password was updated."}
        </Text>

        <View style={styles.card}>
          {step === "email" ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="you@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  textContentType="emailAddress"
                  autoComplete="email"
                  testID="forgot-email"
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton
                label="Send code"
                loading={loading}
                onPress={onSendCode}
                testID="forgot-send"
              />
            </>
          ) : null}

          {step === "otp" ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>Verification code</Text>
                <TextInput
                  keyboardType="number-pad"
                  placeholder="6-digit code"
                  placeholderTextColor={colors.mutedForeground}
                  style={styles.input}
                  value={code}
                  onChangeText={setCode}
                  textContentType="oneTimeCode"
                  testID="forgot-otp"
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton
                label="Verify code"
                loading={loading}
                onPress={onVerifyCode}
                testID="forgot-verify"
              />
            </>
          ) : null}

          {step === "password" ? (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>New password</Text>
                <TextInput
                  secureTextEntry
                  placeholder="New password"
                  placeholderTextColor={colors.mutedForeground}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  textContentType="newPassword"
                  testID="forgot-password"
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Confirm password</Text>
                <TextInput
                  secureTextEntry
                  placeholder="Confirm password"
                  placeholderTextColor={colors.mutedForeground}
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  textContentType="newPassword"
                  testID="forgot-confirm"
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <PrimaryButton
                label="Update password"
                loading={loading}
                onPress={onResetPassword}
                testID="forgot-submit"
              />
            </>
          ) : null}

          {step === "done" ? (
            <>
              <Text style={styles.doneBody}>
                You can now sign in with your new password.
              </Text>
              <PrimaryButton
                label="Back to sign in"
                onPress={() => router.replace("/login")}
                testID="forgot-done"
              />
            </>
          ) : null}
        </View>

        {step !== "done" ? (
          <Pressable
            onPress={() => router.back()}
            style={styles.switchRow}
            accessibilityRole="link"
          >
            <Text style={styles.switchText}>Back to sign in</Text>
          </Pressable>
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
  brandBlock: {
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["2xl"],
    textAlign: "center",
  },
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 22,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
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
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    color: colors.foreground,
    backgroundColor: colors.background,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
  },
  error: {
    color: colors.destructive,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
  },
  doneBody: {
    color: colors.foreground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
  switchRow: {
    marginTop: spacing.sm,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  switchText: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
});
