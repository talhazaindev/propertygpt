import { useCallback } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { StateBlock } from "@/src/components/ui/StateBlock";
import { useForegroundPolling } from "@/src/hooks/useForegroundPolling";
import { getApiErrorMessage } from "@/src/services/api/client";
import {
  fetchConversations,
  type ConversationSummary,
} from "@/src/services/api/messaging";
import { useAuthStore } from "@/src/store/authStore";
import { colors, radii, spacing, typography } from "@/src/theme";

export default function InboxScreen() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const queryClient = useQueryClient();

  const list = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    enabled: Boolean(user),
  });

  useForegroundPolling({
    enabled: Boolean(user),
    intervalMs: 4000,
    onTick: async () => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const renderItem = useCallback(
    ({ item }: { item: ConversationSummary }) => (
      <ConversationRow
        item={item}
        onPress={() => router.push(`/inbox/${item.id}`)}
      />
    ),
    []
  );

  if (!hydrated) {
    return (
      <ScreenContainer>
        <StateBlock loading />
      </ScreenContainer>
    );
  }

  if (!user) {
    return (
      <ScreenContainer testID="inbox-screen">
        <Text style={styles.title} accessibilityRole="header">
          Inbox
        </Text>
        <Text style={styles.body}>
          Sign in to message Manzil support about listings or requests.
        </Text>
        <PrimaryButton
          label="Sign in"
          onPress={() => router.push("/login")}
          testID="inbox-sign-in"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.screen} testID="inbox-screen">
      <Text style={styles.title} accessibilityRole="header">
        Inbox
      </Text>
      <Text style={styles.subtitle}>
        Support chat updates while the app is open.
      </Text>
      <PrimaryButton
        label="New support message"
        onPress={() => router.push("/inbox/new")}
        style={styles.cta}
        testID="inbox-new-cta"
      />

      <StateBlock
        loading={list.isLoading}
        error={
          list.isError
            ? getApiErrorMessage(list.error, "Could not load inbox")
            : null
        }
        onRetry={() => void list.refetch()}
      />

      {!list.isLoading && !list.isError ? (
        <FlatList
          style={styles.listFlex}
          data={list.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={<StateBlock empty="No conversations yet." />}
        />
      ) : null}
    </ScreenContainer>
  );
}

function ConversationRow({
  item,
  onPress,
}: {
  item: ConversationSummary;
  onPress: () => void;
}) {
  const unread = item.userUnreadCount > 0;
  return (
    <Pressable
      onPress={onPress}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={`${item.subjectLabel || "Support"}. ${
        item.lastPreview || "No messages yet"
      }${unread ? `. ${item.userUnreadCount} unread` : ""}`}
      testID={`conversation-${item.id}`}
    >
      <View style={styles.rowTop}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.subjectLabel || "Support"}
        </Text>
        {unread ? (
          <View style={styles.badge} accessibilityElementsHidden>
            <Text style={styles.badgeText}>{item.userUnreadCount}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.preview} numberOfLines={2}>
        {item.lastPreview || "No messages yet"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingBottom: 0,
  },
  listFlex: {
    flex: 1,
  },
  title: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["2xl"],
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  body: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  cta: {
    marginBottom: spacing.lg,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing["2xl"],
  },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.card,
    padding: spacing.md,
    gap: spacing.xs,
  },
  rowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  rowTitle: {
    color: colors.foreground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.base,
    flex: 1,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: colors.primaryForeground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.xs,
  },
  preview: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
  },
});
