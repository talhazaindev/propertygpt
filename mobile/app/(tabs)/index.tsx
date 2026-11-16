import { useCallback } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { StateBlock } from "@/src/components/ui/StateBlock";
import { VerifiedBadge } from "@/src/components/ui/VerifiedBadge";
import { PropertyCard } from "@/src/components/property/PropertyCard";
import { getApiErrorMessage } from "@/src/services/api/client";
import {
  fetchProperties,
  type PropertyListItem,
} from "@/src/services/api/properties";
import { colors, spacing, typography } from "@/src/theme";

export default function HomeScreen() {
  const featured = useQuery({
    queryKey: ["properties", "home-rail"],
    queryFn: async () => {
      const featuredOnly = await fetchProperties({
        featured: true,
        sortBy: "newest",
        limit: 5,
      });
      if (featuredOnly.properties.length > 0) {
        return featuredOnly;
      }
      return fetchProperties({
        sortBy: "newest",
        limit: 5,
      });
    },
  });

  const listings = featured.data?.properties ?? [];

  const renderItem = useCallback(
    ({ item }: { item: PropertyListItem }) => (
      <PropertyCard
        item={item}
        onPress={() => router.push(`/property/${item.id}`)}
      />
    ),
    []
  );

  return (
    <ScreenContainer scroll testID="home-screen">
      <Text style={styles.eyebrow} accessibilityRole="header">
        Manzil By AlWahabCo
      </Text>
      <Text style={styles.title}>
        Buy property in Pakistan{" "}
        <Text style={styles.titleAccent}>without the fear.</Text>
      </Text>
      <Text style={styles.body}>
        Every listing is verified before publication — clear title, real
        ownership, genuine documents.
      </Text>

      <View style={styles.badgeWrap}>
        <VerifiedBadge />
      </View>

      <PrimaryButton
        label="Browse verified listings"
        onPress={() => router.push("/(tabs)/browse")}
        testID="home-browse-cta"
      />
      <PrimaryButton
        label="Request a property"
        onPress={() => router.push("/request/create")}
        style={styles.secondaryCta}
        testID="home-request-cta"
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Verified picks
        </Text>
        <StateBlock
          loading={featured.isLoading}
          error={
            featured.isError
              ? getApiErrorMessage(
                  featured.error,
                  "Could not load featured listings"
                )
              : null
          }
          empty={
            !featured.isLoading && !featured.isError && listings.length === 0
              ? "No featured listings yet. Browse all verified inventory instead."
              : null
          }
          onRetry={() => void featured.refetch()}
        />
        {!featured.isLoading && !featured.isError && listings.length > 0 ? (
          <FlatList
            data={listings}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
            initialNumToRender={5}
            renderItem={renderItem}
          />
        ) : null}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.primary,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["3xl"],
    lineHeight: 38,
    marginBottom: spacing.md,
  },
  titleAccent: {
    color: colors.primary,
  },
  body: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  badgeWrap: {
    marginBottom: spacing.xl,
  },
  secondaryCta: {
    marginTop: spacing.sm,
  },
  section: {
    marginTop: spacing["2xl"],
  },
  sectionTitle: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes.xl,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
});
