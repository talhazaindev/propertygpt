import { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { BrandMark } from "@/src/components/brand/BrandMark";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { SecondaryButton } from "@/src/components/ui/SecondaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { StateBlock } from "@/src/components/ui/StateBlock";
import { useAuthStore } from "@/src/store/authStore";
import { API_BASE_URL, APP_ENV, PRIVACY_URL, TERMS_URL } from "@/src/config/env";
import { colors, radii, spacing, typography } from "@/src/theme";

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
  const error = useAuthStore((s) => s.error);
  const logout = useAuthStore((s) => s.logout);
  const logoutEverywhere = useAuthStore((s) => s.logoutEverywhere);
  const updateMyProfile = useAuthStore((s) => s.updateMyProfile);
  const deleteMyAccount = useAuthStore((s) => s.deleteMyAccount);
  const clearError = useAuthStore((s) => s.clearError);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  if (!hydrated) {
    return (
      <ScreenContainer>
        <StateBlock loading />
      </ScreenContainer>
    );
  }

  if (!user) {
    return (
      <ScreenContainer atmosphere="auth" testID="account-screen">
        <View style={styles.brandBlock}>
          <BrandMark size="md" />
        </View>
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
        <SecondaryButton
          label="Request a property"
          onPress={() => router.push("/request/create")}
          style={styles.secondaryCta}
        />
        <LegalLinks />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll atmosphere="auth" testID="account-screen">
      <View style={styles.brandBlock}>
        <BrandMark size="sm" />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        Account
      </Text>
      <View style={styles.profileCard}>
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
        <View style={[styles.block, styles.blockLast]}>
          <Text style={styles.label}>Phone</Text>
          <Text style={styles.value}>{user.phoneNumber || "—"}</Text>
        </View>
      </View>

      <PrimaryButton
        label="Edit profile"
        onPress={() => {
          clearError();
          setEditName(user.name || "");
          setEditPhone(user.phoneNumber || "");
          setEditOpen(true);
        }}
        style={styles.cta}
        testID="account-edit-profile"
      />
      <SecondaryButton
        label="My listings"
        onPress={() => router.push("/(tabs)/sell")}
        style={styles.secondaryCta}
      />
      <SecondaryButton
        label="Request a property"
        onPress={() => router.push("/request/create")}
        style={styles.secondaryCta}
      />
      <SecondaryButton
        label="Support inbox"
        onPress={() => router.push("/(tabs)/inbox")}
        style={styles.secondaryCta}
      />
      <SecondaryButton
        label="Browse verified homes"
        onPress={() => router.push("/(tabs)/browse")}
        style={styles.secondaryCta}
      />
      <SecondaryButton
        label="Sign out"
        loading={loading}
        onPress={() => {
          void logout();
        }}
        style={styles.secondaryCta}
        testID="account-sign-out"
      />
      <SecondaryButton
        label="Sign out everywhere"
        onPress={() => {
          Alert.alert(
            "Sign out everywhere",
            "This ends all Manzil sessions on your other devices.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Sign out everywhere",
                style: "destructive",
                onPress: () => {
                  void logoutEverywhere();
                },
              },
            ]
          );
        }}
        style={styles.secondaryCta}
        testID="account-logout-all"
      />
      <SecondaryButton
        label="Delete account"
        onPress={() => {
          clearError();
          setDeletePassword("");
          setDeleteOpen(true);
        }}
        style={styles.dangerCta}
        testID="account-delete"
      />

      <LegalLinks />

      {APP_ENV === "development" ? (
        <Text style={styles.devHint}>API: {API_BASE_URL}</Text>
      ) : null}

      <Modal
        visible={editOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setEditOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit profile</Text>
            <Text style={styles.modalBody}>
              Update your display name and phone. Phone must be 03XXXXXXXXX.
            </Text>
            <TextInput
              placeholder="Name"
              placeholderTextColor={colors.mutedForeground}
              style={styles.modalInput}
              value={editName}
              onChangeText={setEditName}
              testID="account-edit-name"
            />
            <TextInput
              placeholder="03XXXXXXXXX"
              placeholderTextColor={colors.mutedForeground}
              style={styles.modalInput}
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
              testID="account-edit-phone"
            />
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
            <PrimaryButton
              label="Save"
              loading={loading}
              disabled={!editName.trim()}
              onPress={() => {
                void (async () => {
                  try {
                    await updateMyProfile({
                      name: editName.trim(),
                      phoneNumber: editPhone.trim(),
                    });
                    setEditOpen(false);
                  } catch {
                    // Error via store.
                  }
                })();
              }}
              testID="account-edit-save"
            />
            <SecondaryButton
              label="Cancel"
              onPress={() => setEditOpen(false)}
              style={styles.secondaryCta}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Delete account</Text>
            <Text style={styles.modalBody}>
              This permanently deletes your account, listings, and messages.
              Enter your password to confirm.
            </Text>
            <TextInput
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={colors.mutedForeground}
              style={styles.modalInput}
              value={deletePassword}
              onChangeText={setDeletePassword}
              testID="account-delete-password"
            />
            {error ? <Text style={styles.modalError}>{error}</Text> : null}
            <PrimaryButton
              label="Delete forever"
              loading={loading}
              disabled={!deletePassword}
              onPress={() => {
                void (async () => {
                  try {
                    await deleteMyAccount(deletePassword);
                    setDeleteOpen(false);
                    Alert.alert("Account deleted", "Your Manzil account was removed.");
                  } catch {
                    // Error via store.
                  }
                })();
              }}
              testID="account-delete-confirm"
            />
            <SecondaryButton
              label="Cancel"
              onPress={() => setDeleteOpen(false)}
              style={styles.secondaryCta}
            />
          </View>
        </View>
      </Modal>
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
  brandBlock: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  body: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 22,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  block: {
    marginBottom: spacing.md,
  },
  blockLast: {
    marginBottom: 0,
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
  dangerCta: {
    marginTop: spacing.lg,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  modalTitle: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes.xl,
  },
  modalBody: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  modalInput: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    color: colors.foreground,
    backgroundColor: colors.background,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
  },
  modalError: {
    color: colors.destructive,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
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
