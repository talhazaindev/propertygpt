import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { useForegroundPolling } from "@/src/hooks/useForegroundPolling";
import { getApiErrorMessage } from "@/src/services/api/client";
import {
  fetchConversationThread,
  sendConversationMessage,
  type ChatMessage,
} from "@/src/services/api/messaging";
import { colors, radii, spacing, typography } from "@/src/theme";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Array.isArray(id) ? id[0] : id;
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const thread = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversationThread(conversationId),
    enabled: Boolean(conversationId),
  });

  useForegroundPolling({
    enabled: Boolean(conversationId),
    intervalMs: 4000,
    onTick: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["conversation", conversationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  async function onSend() {
    if (!conversationId || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      await sendConversationMessage(conversationId, draft.trim());
      setDraft("");
      await thread.refetch();
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not send message"));
    } finally {
      setSending(false);
    }
  }

  if (!conversationId) {
    return (
      <ScreenContainer>
        <Text style={styles.error}>Missing conversation.</Text>
      </ScreenContainer>
    );
  }

  if (thread.isLoading) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: "Chat" }} />
        <ActivityIndicator color={colors.primary} />
      </ScreenContainer>
    );
  }

  if (thread.isError || !thread.data) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: "Chat" }} />
        <Text style={styles.error}>
          {getApiErrorMessage(thread.error, "Could not load chat")}
        </Text>
        <PrimaryButton label="Retry" onPress={() => void thread.refetch()} />
      </ScreenContainer>
    );
  }

  const title = thread.data.conversation.subjectLabel || "Support";
  const messages = thread.data.messages;

  return (
    <ScreenContainer style={styles.screen}>
      <Stack.Screen options={{ title }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={88}
      >
        <FlatList
          style={styles.flex}
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messages}
          renderItem={({ item }) => <Bubble message={item} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No messages in this thread yet.</Text>
          }
        />
        {error ? <Text style={styles.errorPad}>{error}</Text> : null}
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            style={styles.input}
            placeholder="Write a message"
            placeholderTextColor={colors.mutedForeground}
            accessibilityLabel="Message"
          />
          <PrimaryButton
            label="Send"
            loading={sending}
            disabled={!draft.trim()}
            onPress={onSend}
            style={styles.send}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const mine = message.senderType === "USER";
  return (
    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
      <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : null]}>
        {message.body}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  flex: {
    flex: 1,
  },
  messages: {
    padding: spacing.lg,
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleMine: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  bubbleTheirs: {
    alignSelf: "flex-start",
    backgroundColor: colors.secondary,
  },
  bubbleText: {
    color: colors.foreground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
  bubbleTextMine: {
    color: colors.primaryForeground,
  },
  composer: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    color: colors.foreground,
    backgroundColor: colors.card,
    fontFamily: typography.fonts.sans,
  },
  send: {
    paddingHorizontal: spacing.md,
  },
  empty: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
  },
  error: {
    color: colors.destructive,
    fontFamily: typography.fonts.sans,
    marginBottom: spacing.md,
  },
  errorPad: {
    color: colors.destructive,
    fontFamily: typography.fonts.sans,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
});
