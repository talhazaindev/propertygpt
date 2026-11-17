import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip } from "lucide-react-native";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { useForegroundPolling } from "@/src/hooks/useForegroundPolling";
import { getApiErrorMessage } from "@/src/services/api/client";
import {
  fetchConversationThread,
  markConversationRead,
  sendConversationMessage,
  type ChatMessage,
  type MessageAttachment,
} from "@/src/services/api/messaging";
import {
  isSafeExternalMediaUrl,
  uploadFiles,
} from "@/src/services/upload/uploadthing";
import { colors, radii, spacing, typography } from "@/src/theme";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Array.isArray(id) ? id[0] : id;
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [pendingAttachments, setPendingAttachments] = useState<
    MessageAttachment[]
  >([]);
  const [sending, setSending] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const thread = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => fetchConversationThread(conversationId as string),
    enabled: Boolean(conversationId),
  });

  useEffect(() => {
    if (!conversationId || !thread.data) return;
    if ((thread.data.conversation.userUnreadCount || 0) <= 0) return;
    void markConversationRead(conversationId)
      .then(() =>
        queryClient.invalidateQueries({ queryKey: ["conversations"] })
      )
      .catch(() => undefined);
  }, [conversationId, thread.data, queryClient]);

  useForegroundPolling({
    enabled: Boolean(conversationId),
    intervalMs: 6000,
    onTick: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["conversation", conversationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  async function pickAttachment(): Promise<void> {
    setError(null);
    setAttaching(true);
    try {
      const choice = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsMultipleSelection: false,
      });

      let assetUri: string | null = null;
      let assetName = "attachment.jpg";
      let assetType = "image/jpeg";

      if (!choice.canceled && choice.assets?.[0]?.uri) {
        const asset = choice.assets[0];
        assetUri = asset.uri;
        assetName = asset.fileName || "photo.jpg";
        assetType = asset.mimeType || "image/jpeg";
      } else {
        const doc = await DocumentPicker.getDocumentAsync({
          type: ["image/*", "application/pdf"],
          copyToCacheDirectory: true,
          multiple: false,
        });
        if (doc.canceled || !doc.assets?.[0]) return;
        const file = doc.assets[0];
        assetUri = file.uri;
        assetName = file.name || "document";
        assetType = file.mimeType || "application/octet-stream";
      }

      if (!assetUri) return;

      const blob = await fetch(assetUri).then((res) => res.blob());
      const fileObj = Object.assign(new File([blob], assetName, { type: assetType }), {
        uri: assetUri,
      });

      const uploaded = await uploadFiles("messageAttachments", {
        files: [fileObj] as unknown as File[],
      });

      const file = uploaded[0] as
        | {
            ufsUrl?: string;
            url?: string;
            name?: string;
            type?: string;
            size?: number;
            serverData?: { url?: string; name?: string; type?: string; size?: number };
          }
        | undefined;

      const url =
        file?.ufsUrl || file?.url || file?.serverData?.url || "";
      if (!url || !isSafeExternalMediaUrl(url)) {
        setError("Attachment upload failed");
        return;
      }

      setPendingAttachments((prev) => [
        ...prev,
        {
          url,
          name: file?.name || file?.serverData?.name || assetName,
          type: file?.type || file?.serverData?.type || assetType,
          size: file?.size || file?.serverData?.size,
        },
      ]);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not attach file"));
    } finally {
      setAttaching(false);
    }
  }

  async function onSend() {
    if (!conversationId) return;
    if (!draft.trim() && pendingAttachments.length === 0) return;
    setSending(true);
    setError(null);
    try {
      await sendConversationMessage(conversationId, {
        body: draft.trim(),
        attachments: pendingAttachments,
      });
      setDraft("");
      setPendingAttachments([]);
      await thread.refetch();
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
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
  const busy = sending || attaching;

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
        {pendingAttachments.length > 0 ? (
          <View style={styles.pendingWrap}>
            {pendingAttachments.map((item, index) => (
              <Pressable
                key={`${item.url}-${index}`}
                onLongPress={() =>
                  setPendingAttachments((prev) =>
                    prev.filter((_, i) => i !== index)
                  )
                }
                style={styles.pendingChip}
              >
                <Text style={styles.pendingText} numberOfLines={1}>
                  {item.name}
                </Text>
              </Pressable>
            ))}
            <Text style={styles.pendingHint}>Long-press to remove</Text>
          </View>
        ) : null}
        {error ? <Text style={styles.errorPad}>{error}</Text> : null}
        <View style={styles.composer}>
          <Pressable
            onPress={() => void pickAttachment()}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel="Attach file"
            style={styles.attachBtn}
            testID="chat-attach"
          >
            <Paperclip size={20} color={colors.primary} />
          </Pressable>
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
            loading={busy}
            disabled={!draft.trim() && pendingAttachments.length === 0}
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
  const attachments = message.attachments || [];

  return (
    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
      {message.body ? (
        <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : null]}>
          {message.body}
        </Text>
      ) : null}
      {attachments.map((item, index) => {
        const safe = isSafeExternalMediaUrl(item.url);
        const isImage = (item.type || "").startsWith("image/");
        if (isImage && safe) {
          return (
            <Image
              key={`${item.url}-${index}`}
              source={{ uri: item.url }}
              style={styles.attachImage}
              accessibilityLabel={item.name}
            />
          );
        }
        return (
          <Pressable
            key={`${item.url}-${index}`}
            disabled={!safe}
            onPress={() => {
              if (safe) void Linking.openURL(item.url);
            }}
          >
            <Text
              style={[
                styles.attachLink,
                mine ? styles.bubbleTextMine : null,
              ]}
            >
              {item.name || "Attachment"}
            </Text>
          </Pressable>
        );
      })}
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
    gap: spacing.xs,
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
  attachImage: {
    width: 180,
    height: 120,
    borderRadius: radii.sm,
    marginTop: 4,
  },
  attachLink: {
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
    textDecorationLine: "underline",
    color: colors.foreground,
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
  attachBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
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
  pendingWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    alignItems: "center",
  },
  pendingChip: {
    backgroundColor: colors.secondary,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    maxWidth: 160,
  },
  pendingText: {
    color: colors.primaryDark,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
  },
  pendingHint: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
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
