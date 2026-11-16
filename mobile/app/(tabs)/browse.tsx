import { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { PropertyCard } from "@/src/components/property/PropertyCard";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { StateBlock } from "@/src/components/ui/StateBlock";
import {
  fetchProperties,
  type PropertyListItem,
} from "@/src/services/api/properties";
import { getApiErrorMessage } from "@/src/services/api/client";
import { colors, radii, spacing, typography } from "@/src/theme";

type ListingFilter = "SALE" | "RENTAL";

export default function BrowseScreen() {
  const [listingType, setListingType] = useState<ListingFilter>("SALE");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["properties", listingType, search],
    queryFn: () =>
      fetchProperties({
        listingType,
        search: search || undefined,
        sortBy: "newest",
        limit: 20,
      }),
  });

  const renderItem = useCallback(
    ({ item }: { item: PropertyListItem }) => (
      <PropertyCard
        item={item}
        onPress={() => router.push(`/property/${item.id}`)}
      />
    ),
    []
  );

  const keyExtractor = useCallback((item: PropertyListItem) => item.id, []);

  return (
    <ScreenContainer style={styles.screen} testID="browse-screen">
      <Text style={styles.title} accessibilityRole="header">
        Browse
      </Text>
      <Text style={styles.subtitle}>Verified sale and rental inventory only.</Text>

      <View style={styles.searchRow}>
        <TextInput
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search area, title…"
          placeholderTextColor={colors.mutedForeground}
          style={styles.searchInput}
          returnKeyType="search"
          onSubmitEditing={() => setSearch(searchInput.trim())}
          accessibilityLabel="Search listings"
          testID="browse-search-input"
        />
        <PrimaryButton
          label="Search"
          onPress={() => setSearch(searchInput.trim())}
          style={styles.searchButton}
          testID="browse-search-button"
        />
      </View>

      <View
        style={styles.filters}
        accessibilityRole="tablist"
        accessibilityLabel="Listing type"
      >
        {(["SALE", "RENTAL"] as const).map((value) => {
          const active = listingType === value;
          return (
            <Pressable
              key={value}
              onPress={() => setListingType(value)}
              style={[styles.chip, active ? styles.chipActive : null]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={value === "SALE" ? "For sale" : "For rent"}
              testID={`browse-filter-${value.toLowerCase()}`}
            >
              <Text
                style={[styles.chipLabel, active ? styles.chipLabelActive : null]}
              >
                {value === "SALE" ? "For sale" : "For rent"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <StateBlock
        loading={query.isLoading}
        error={
          query.isError
            ? getApiErrorMessage(query.error, "Could not load listings")
            : null
        }
        onRetry={() => void query.refetch()}
      />

      {!query.isLoading && !query.isError ? (
        <FlatList
          style={styles.listFlex}
          data={query.data?.properties ?? []}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          ListEmptyComponent={
            <StateBlock empty="No listings found for this filter." />
          }
          ListFooterComponent={
            query.data?.pagination ? (
              <Text style={styles.footerMeta}>
                Showing {query.data.properties.length} of{" "}
                {query.data.pagination.total}
              </Text>
            ) : undefined
          }
        />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 0,
    flex: 1,
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
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
    alignItems: "center",
  },
  searchInput: {
    flex: 1,
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
  searchButton: {
    paddingHorizontal: spacing.md,
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: {
    color: colors.foreground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
  chipLabelActive: {
    color: colors.primaryForeground,
  },
  list: {
    paddingBottom: spacing["2xl"],
    gap: spacing.md,
  },
  footerMeta: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
    textAlign: "center",
    marginTop: spacing.sm,
  },
});
