import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { StateBlock } from "@/src/components/ui/StateBlock";
import { useAuthStore } from "@/src/store/authStore";
import { API_BASE_URL, APP_ENV, PRIVACY_URL, TERMS_URL } from "@/src/config/env";
import { colors, spacing, typography } from "@/src/theme";

async function openLegalUrl(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    await Linking.openURL(url);
  }
}

export default function AccountScreen() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const loading = useAuthStore((s) => s.loading);
  const logout = useAuthStore((s) => s.logout);

  if (!hydrated) {
    return (
      <ScreenContainer>
        <StateBlock loading />
      </ScreenContainer>
    );
  }

  if (!user) {
    return (
      <ScreenContainer testID="account-screen">
        <Text style={styles.title} accessibilityRole="header">
          Account
        </Text>
        <Text style={styles.body}>
          Sign in to manage listings, messaging, and your Manzil profile.
        </Text>
        <PrimaryButton
          label="Sign in"
          onPress={() => router.push("/login")}
          style={styles.cta}
          testID="account-sign-in"
        />
        <Pressable
          onPress={() => router.push("/register")}
          accessibilityRole="link"
          style={styles.registerLink}
          testID="account-register-link"
        >
          <Text style={styles.registerText}>
            New here? <Text style={styles.registerAccent}>Create an account</Text>
          </Text>
        </Pressable>
        <PrimaryButton
          label="Request a property"
          onPress={() => router.push("/request/create")}
          style={styles.secondaryCta}
        />
        <LegalLinks />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll testID="account-screen">
      <Text style={styles.title} accessibilityRole="header">
        Account
      </Text>
      <View style={styles.block}>
        <Text style={styles.label}>Name</Text>
        <Text style={styles.value}>{user.name || "—"}</Text>
      </View>
      <View style={styles.block}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user.email}</Text>
      </View>
      <View style={styles.block}>
        <Text style={styles.label}>Role</Text>
        <Text style={styles.value}>{user.role}</Text>
      </View>
      {user.phoneNumber ? (
        <View style={styles.block}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{user.phoneNumber}</Text>
        </View>
      ) : null}

      <PrimaryButton
        label="My listings"
        onPress={() => router.push("/(tabs)/sell")}
        style={styles.cta}
      />
      <PrimaryButton
        label="Request a property"
        onPress={() => router.push("/request/create")}
        style={styles.secondaryCta}
      />
      <PrimaryButton
        label="Support inbox"
        onPress={() => router.push("/(tabs)/inbox")}
        style={styles.secondaryCta}
      />
      <PrimaryButton
        label="Browse verified homes"
        onPress={() => router.push("/(tabs)/browse")}
        style={styles.secondaryCta}
      />
      <PrimaryButton
        label="Sign out"
        loading={loading}
        onPress={() => {
          void logout();
        }}
        style={styles.secondaryCta}
        testID="account-sign-out"
      />

      <LegalLinks />

      {APP_ENV === "development" ? (
        <Text style={styles.devHint}>API: {API_BASE_URL}</Text>
      ) : null}
    </ScreenContainer>
  );
}

function LegalLinks() {
  return (
    <View style={styles.legalWrap}>
      <Pressable
        onPress={() => void openLegalUrl(PRIVACY_URL)}
        accessibilityRole="link"
        accessibilityLabel="Privacy Policy"
        testID="account-privacy-link"
        style={styles.legalLink}
      >
        <Text style={styles.legalText}>Privacy Policy</Text>
      </Pressable>
      <Text style={styles.legalDot}>·</Text>
      <Pressable
        onPress={() => void openLegalUrl(TERMS_URL)}
        accessibilityRole="link"
        accessibilityLabel="Terms of Service"
        testID="account-terms-link"
        style={styles.legalLink}
      >
        <Text style={styles.legalText}>Terms of Service</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  block: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
    marginBottom: 2,
  },
  value: {
    color: colors.foreground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.base,
  },
  cta: {
    marginTop: spacing.lg,
  },
  secondaryCta: {
    marginTop: spacing.sm,
  },
  registerLink: {
    marginTop: spacing.md,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  registerText: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
  },
  registerAccent: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
  },
  legalWrap: {
    marginTop: spacing["2xl"],
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  legalLink: {
    paddingVertical: spacing.sm,
    minHeight: 44,
    justifyContent: "center",
  },
  legalText: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
  legalDot: {
    color: colors.mutedForeground,
  },
  devHint: {
    marginTop: spacing.xl,
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
    textAlign: "center",
  },
});
