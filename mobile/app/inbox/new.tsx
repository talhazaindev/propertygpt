import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { getApiErrorMessage } from "@/src/services/api/client";
import { startSupportConversation } from "@/src/services/api/messaging";
import { useAuthStore } from "@/src/store/authStore";
import { colors, radii, spacing, typography } from "@/src/theme";

export default function NewSupportMessageScreen() {
  const user = useAuthStore((s) => s.user);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <ScreenContainer>
        <Text style={styles.body}>Sign in to contact support.</Text>
        <PrimaryButton label="Sign in" onPress={() => router.push("/login")} />
      </ScreenContainer>
    );
  }

  async function onSubmit() {
    setError(null);
    if (!body.trim()) {
      setError("Write a short message");
      return;
    }
    setLoading(true);
    try {
      const result = await startSupportConversation(body.trim());
      router.replace(`/inbox/${result.conversation.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not start conversation"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scroll>
      <Text style={styles.title}>Message support</Text>
      <Text style={styles.subtitle}>
        Ask about a listing, verification, or your account.
      </Text>
      <TextInput
        value={body}
        onChangeText={setBody}
        style={styles.input}
        multiline
        placeholder="How can we help?"
        placeholderTextColor={colors.mutedForeground}
        accessibilityLabel="Support message"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Send" loading={loading} onPress={onSubmit} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["2xl"],
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    marginBottom: spacing.lg,
  },
  body: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    marginBottom: spacing.lg,
  },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radii.md,
    padding: spacing.md,
    color: colors.foreground,
    backgroundColor: colors.card,
    fontFamily: typography.fonts.sans,
    textAlignVertical: "top",
    marginBottom: spacing.md,
  },
  error: {
    color: colors.destructive,
    fontFamily: typography.fonts.sans,
    marginBottom: spacing.sm,
  },
});
