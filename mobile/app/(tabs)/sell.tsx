import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CircleDashed,
  EyeOff,
  LayoutGrid,
  ShieldAlert,
  ShoppingBag,
} from "lucide-react-native";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { StateBlock } from "@/src/components/ui/StateBlock";
import { FilterChipRow } from "@/src/components/ui/FilterChip";
import { PropertyCard } from "@/src/components/property/PropertyCard";
import { getApiErrorMessage } from "@/src/services/api/client";
import {
  deleteProperty,
  fetchMyProperties,
  type MyListingStatusFilter,
  type PropertyListItem,
} from "@/src/services/api/properties";
import { useAuthStore } from "@/src/store/authStore";
import { colors, radii, spacing, typography } from "@/src/theme";

const STATUS_OPTIONS = [
  { value: "ALL" as const, label: "All", Icon: LayoutGrid },
  { value: "PENDING" as const, label: "Pending", Icon: CircleDashed },
  { value: "VERIFIED" as const, label: "Verified", Icon: BadgeCheck },
  { value: "ACTIVE" as const, label: "Active", Icon: BadgeCheck },
  { value: "REJECTED" as const, label: "Rejected", Icon: ShieldAlert },
  { value: "SOLD" as const, label: "Sold", Icon: ShoppingBag },
  { value: "HIDDEN" as const, label: "Hidden", Icon: EyeOff },
];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending review",
  VERIFIED: "Verified",
  ACTIVE: "Active",
  REJECTED: "Rejected",
  SOLD: "Sold",
  HIDDEN: "Hidden",
};

export default function SellScreen() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<MyListingStatusFilter>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const mine = useQuery({
    queryKey: ["properties", "mine", status],
    queryFn: () =>
      fetchMyProperties({
        status: status === "ALL" ? undefined : status,
        limit: 20,
      }),
    enabled: Boolean(user),
  });

  const onDelete = useCallback(
    (item: PropertyListItem) => {
      Alert.alert(
        "Delete listing",
        `Remove “${item.title}”? This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              void (async () => {
                setDeletingId(item.id);
                try {
                  await deleteProperty(item.id);
                  await queryClient.invalidateQueries({
                    queryKey: ["properties", "mine"],
                  });
                  await queryClient.invalidateQueries({ queryKey: ["properties"] });
                } catch (error) {
                  Alert.alert(
                    "Delete failed",
                    getApiErrorMessage(error, "Could not delete listing")
                  );
                } finally {
                  setDeletingId(null);
                }
              })();
            },
          },
        ]
      );
    },
    [queryClient]
  );

  const renderItem = useCallback(
    ({ item }: { item: PropertyListItem }) => (
      <View style={styles.cardWrap}>
        <PropertyCard
          item={item}
          onPress={() => router.push(`/property/${item.id}`)}
        />
        <View style={styles.statusPill}>
          <Text style={styles.statusLine}>
            {STATUS_LABEL[item.status] || item.status}
          </Text>
        </View>
        {item.rejectionReason ? (
          <Text style={styles.reject}>Reason: {item.rejectionReason}</Text>
        ) : null}
        <View style={styles.actions}>
          <Pressable
            onPress={() =>
              router.push(`/listing/create?editId=${encodeURIComponent(item.id)}`)
            }
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${item.title}`}
            testID={`sell-edit-${item.id}`}
          >
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
          <Pressable
            onPress={() => onDelete(item)}
            style={[styles.actionBtn, styles.actionDanger]}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.title}`}
            disabled={deletingId === item.id}
            testID={`sell-delete-${item.id}`}
          >
            <Text style={styles.actionDangerText}>
              {deletingId === item.id ? "Deleting…" : "Delete"}
            </Text>
          </Pressable>
        </View>
      </View>
    ),
    [deletingId, onDelete]
  );

  const emptyMessage = useMemo(() => {
    if (status === "ALL") return "You have not submitted any listings yet.";
    return `No ${STATUS_LABEL[status]?.toLowerCase() || status.toLowerCase()} listings.`;
  }, [status]);

  if (!hydrated) {
    return (
      <ScreenContainer>
        <StateBlock loading />
      </ScreenContainer>
    );
  }

  if (!user) {
    return (
      <ScreenContainer atmosphere="hero" testID="sell-screen">
        <Text style={styles.title} accessibilityRole="header">
          Sell
        </Text>
        <View style={styles.titleAccent} />
        <Text style={styles.body}>
          Sign in to list a property and track verification status.
        </Text>
        <PrimaryButton
          label="Sign in to sell"
          onPress={() => router.push("/login")}
          style={styles.cta}
          testID="sell-sign-in"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.screen} atmosphere="hero" testID="sell-screen">
      <Text style={styles.title} accessibilityRole="header">
        Sell
      </Text>
      <View style={styles.titleAccent} />
      <Text style={styles.body}>
        Submit a listing for Manzil verification. Photos and ownership documents
        are required before review.
      </Text>
      <PrimaryButton
        label="List a property"
        onPress={() => router.push("/listing/create")}
        style={styles.cta}
        testID="sell-list-cta"
      />

      <Text style={styles.sectionTitle} accessibilityRole="header">
        My listings
      </Text>
      <FilterChipRow
        label="Status"
        options={STATUS_OPTIONS}
        value={status}
        onChange={setStatus}
        testIDPrefix="sell-status"
      />
      <StateBlock
        loading={mine.isLoading}
        error={
          mine.isError
            ? getApiErrorMessage(mine.error, "Could not load your listings")
            : null
        }
        onRetry={() => void mine.refetch()}
      />
      {!mine.isLoading && !mine.isError ? (
        <FlatList
          style={styles.listFlex}
          data={mine.data?.properties ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={<StateBlock empty={emptyMessage} />}
        />
      ) : null}
    </ScreenContainer>
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
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.xs,
  },
  titleAccent: {
    width: 40,
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
  cta: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes.xl,
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing["2xl"],
  },
  cardWrap: {
    gap: spacing.xs,
  },
  statusPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.secondary,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusLine: {
    color: colors.primaryDark,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.xs,
  },
  reject: {
    color: colors.destructive,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
    justifyContent: "center",
  },
  actionText: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
  actionDanger: {
    borderColor: colors.destructive,
  },
  actionDangerText: {
    color: colors.destructive,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
});
