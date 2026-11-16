import { useCallback } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { StateBlock } from "@/src/components/ui/StateBlock";
import { PropertyCard } from "@/src/components/property/PropertyCard";
import { getApiErrorMessage } from "@/src/services/api/client";
import {
  fetchMyProperties,
  type PropertyListItem,
} from "@/src/services/api/properties";
import { useAuthStore } from "@/src/store/authStore";
import { colors, spacing, typography } from "@/src/theme";

export default function SellScreen() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const mine = useQuery({
    queryKey: ["properties", "mine"],
    queryFn: () => fetchMyProperties({ limit: 20 }),
    enabled: Boolean(user),
  });

  const renderItem = useCallback(
    ({ item }: { item: PropertyListItem }) => (
      <View>
        <PropertyCard
          item={item}
          onPress={() => router.push(`/property/${item.id}`)}
        />
        <Text style={styles.statusLine}>Status: {item.status}</Text>
        {item.rejectionReason ? (
          <Text style={styles.reject}>Reason: {item.rejectionReason}</Text>
        ) : null}
      </View>
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
      <ScreenContainer testID="sell-screen">
        <Text style={styles.title} accessibilityRole="header">
          Sell
        </Text>
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
    <ScreenContainer style={styles.screen} testID="sell-screen">
      <Text style={styles.title} accessibilityRole="header">
        Sell
      </Text>
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
          ListEmptyComponent={
            <StateBlock empty="You have not submitted any listings yet." />
          }
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
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing["2xl"],
  },
  statusLine: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  reject: {
    color: colors.destructive,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
