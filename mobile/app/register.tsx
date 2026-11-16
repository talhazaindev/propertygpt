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
import {
  registerAccount,
  sendSignupOtp,
  verifySignupOtp,
} from "@/src/services/auth/authApi";
import { getApiErrorMessage } from "@/src/services/api/client";
import { useAuthStore } from "@/src/store/authStore";
import { colors, radii, spacing, typography } from "@/src/theme";

type Step = "details" | "otp" | "password";

export default function RegisterScreen() {
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");
  const [signupToken, setSignupToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return <Redirect href="/(tabs)/account" />;
  }

  async function onSendCode() {
    setError(null);
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required");
      return;
    }
    setLoading(true);
    try {
      await sendSignupOtp(email);
      setStep("otp");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send verification code"));
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
      const result = await verifySignupOtp({ email, code });
      setSignupToken(result.signupToken);
      setStep("password");
    } catch (err) {
      setError(getApiErrorMessage(err, "Invalid verification code"));
    } finally {
      setLoading(false);
    }
  }

  async function onCreateAccount() {
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
      await registerAccount({
        name,
        email,
        password,
        phoneNumber,
        signupToken,
      });
      await login(email, password);
      router.replace("/(tabs)/account");
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not create account"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.wrap}
      >
        <Text style={styles.brand}>Manzil</Text>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>
          {step === "details"
            ? "Verify your email to get started."
            : step === "otp"
              ? "Enter the code we sent to your email."
              : "Choose a password to finish signup."}
        </Text>

        {step === "details" ? (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Full name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.mutedForeground}
                autoComplete="name"
                accessibilityLabel="Full name"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                autoComplete="email"
                accessibilityLabel="Email"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Phone (optional)</Text>
              <TextInput
                style={styles.input}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                placeholder="03XX XXXXXXX"
                placeholderTextColor={colors.mutedForeground}
                accessibilityLabel="Phone"
              />
            </View>
            <PrimaryButton
              label="Send verification code"
              loading={loading}
              onPress={onSendCode}
            />
          </>
        ) : null}

        {step === "otp" ? (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Verification code</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                placeholder="6-digit code"
                placeholderTextColor={colors.mutedForeground}
                accessibilityLabel="Verification code"
              />
            </View>
            <PrimaryButton label="Verify email" loading={loading} onPress={onVerifyCode} />
            <Pressable onPress={onSendCode} disabled={loading} style={styles.switchRow}>
              <Text style={styles.switchLink}>Resend code</Text>
            </Pressable>
          </>
        ) : null}

        {step === "password" ? (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="At least 8 characters"
                placeholderTextColor={colors.mutedForeground}
                accessibilityLabel="Password"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Confirm password</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Re-enter password"
                placeholderTextColor={colors.mutedForeground}
                accessibilityLabel="Confirm password"
              />
            </View>
            <PrimaryButton
              label="Create account"
              loading={loading}
              onPress={onCreateAccount}
            />
          </>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          onPress={() => router.replace("/login")}
          accessibilityRole="link"
          style={styles.switchRow}
        >
          <Text style={styles.switchText}>
            Already have an account? <Text style={styles.switchLink}>Sign in</Text>
          </Text>
        </Pressable>
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
});
