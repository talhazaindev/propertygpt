import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  BedDouble,
  Building2,
  Clock3,
  Home,
  KeyRound,
  Landmark,
  SlidersHorizontal,
  Store,
  Tag,
  Trees,
} from "lucide-react-native";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { PropertyCard } from "@/src/components/property/PropertyCard";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { StateBlock } from "@/src/components/ui/StateBlock";
import { FilterChipRow } from "@/src/components/ui/FilterChip";
import {
  fetchProperties,
  type PropertyListItem,
  type PropertyTypeFilter,
  type SortOption,
} from "@/src/services/api/properties";
import { getApiErrorMessage } from "@/src/services/api/client";
import { colors, radii, spacing, typography } from "@/src/theme";

type ListingFilter = "SALE" | "RENTAL";
type BedroomFilter = "ANY" | "1" | "2" | "3" | "4";

const LISTING_OPTIONS = [
  { value: "SALE" as const, label: "For sale", Icon: Tag },
  { value: "RENTAL" as const, label: "For rent", Icon: KeyRound },
];

const TYPE_OPTIONS = [
  { value: "ALL" as const, label: "All types", Icon: Home },
  { value: "HOUSE" as const, label: "House", Icon: Home },
  { value: "APARTMENT" as const, label: "Apartment", Icon: Building2 },
  { value: "VILLA" as const, label: "Villa", Icon: Landmark },
  { value: "LAND" as const, label: "Land", Icon: Trees },
  { value: "COMMERCIAL" as const, label: "Commercial", Icon: Store },
];

const BEDROOM_OPTIONS = [
  { value: "ANY" as const, label: "Any beds", Icon: BedDouble },
  { value: "1" as const, label: "1+", Icon: BedDouble },
  { value: "2" as const, label: "2+", Icon: BedDouble },
  { value: "3" as const, label: "3+", Icon: BedDouble },
  { value: "4" as const, label: "4+", Icon: BedDouble },
];

const SORT_OPTIONS = [
  { value: "newest" as const, label: "Newest", Icon: Clock3 },
  { value: "price_low" as const, label: "Price ↑", Icon: ArrowUpWideNarrow },
  { value: "price_high" as const, label: "Price ↓", Icon: ArrowDownWideNarrow },
];

/** Hide once the user has scrolled past this offset. */
const HIDE_AFTER_Y = 48;
/** Ignore tiny jitter between frames. */
const HIDE_DELTA = 6;

export default function BrowseScreen() {
  const [listingType, setListingType] = useState<ListingFilter>("SALE");
  const [propertyType, setPropertyType] = useState<PropertyTypeFilter>("ALL");
  const [bedrooms, setBedrooms] = useState<BedroomFilter>("ANY");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(true);

  const lastOffsetY = useRef(0);
  const filtersVisibleRef = useRef(true);
  const anim = useRef(new Animated.Value(1)).current;

  const query = useInfiniteQuery({
    queryKey: ["properties", listingType, propertyType, bedrooms, sortBy, search],
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      fetchProperties({
        listingType,
        type: propertyType === "ALL" ? undefined : propertyType,
        bedrooms: bedrooms === "ANY" ? undefined : Number(bedrooms),
        search: search || undefined,
        sortBy,
        page: pageParam,
        limit: 20,
      }),
    getNextPageParam: (last) =>
      last.pagination.page < last.pagination.pages
        ? last.pagination.page + 1
        : undefined,
  });

  const properties = useMemo(
    () => query.data?.pages.flatMap((page) => page.properties) ?? [],
    [query.data]
  );
  const totalCount = query.data?.pages[0]?.pagination.total ?? 0;

  const setFiltersShown = useCallback(
    (visible: boolean) => {
      if (filtersVisibleRef.current === visible) return;
      filtersVisibleRef.current = visible;
      setFiltersVisible(visible);
      Animated.timing(anim, {
        toValue: visible ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    },
    [anim]
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = Math.max(0, event.nativeEvent.contentOffset.y);
      const delta = y - lastOffsetY.current;
      lastOffsetY.current = y;

      // Only auto-show when the list is back at the top — never on mid-list
      // scroll-up, which feels jumpy and fights the user's reading flow.
      if (y <= HIDE_AFTER_Y) {
        setFiltersShown(true);
        return;
      }

      if (delta > HIDE_DELTA) {
        setFiltersShown(false);
      }
    },
    [setFiltersShown]
  );

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

  const activeFilterCount =
    (listingType !== "SALE" ? 1 : 0) +
    (propertyType !== "ALL" ? 1 : 0) +
    (bedrooms !== "ANY" ? 1 : 0) +
    (sortBy !== "newest" ? 1 : 0) +
    (search ? 1 : 0);

  return (
    <ScreenContainer style={styles.screen} atmosphere="hero" testID="browse-screen">
      <Text style={styles.title} accessibilityRole="header">
        Browse
      </Text>
      <View style={styles.titleAccent} />
      <Text style={styles.subtitle}>Verified sale and rental inventory only.</Text>

      <Animated.View
        style={[
          styles.filtersPanel,
          {
            opacity: anim,
            maxHeight: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 420],
            }),
            marginBottom: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, spacing.sm],
            }),
          },
        ]}
        pointerEvents={filtersVisible ? "auto" : "none"}
      >
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

        <FilterChipRow
          label="Listing"
          options={LISTING_OPTIONS}
          value={listingType}
          onChange={setListingType}
          testIDPrefix="browse-filter"
        />
        <FilterChipRow
          label="Property type"
          options={TYPE_OPTIONS}
          value={propertyType}
          onChange={setPropertyType}
          testIDPrefix="browse-type"
        />
        <FilterChipRow
          label="Bedrooms"
          options={BEDROOM_OPTIONS}
          value={bedrooms}
          onChange={setBedrooms}
          testIDPrefix="browse-beds"
        />
        <FilterChipRow
          label="Sort"
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={setSortBy}
          testIDPrefix="browse-sort"
        />
      </Animated.View>

      {!filtersVisible ? (
        <Pressable
          onPress={() => setFiltersShown(true)}
          style={styles.filtersCollapsed}
          accessibilityRole="button"
          accessibilityLabel="Show filters"
          testID="browse-show-filters"
        >
          <SlidersHorizontal size={16} color={colors.primary} />
          <Text style={styles.filtersCollapsedText}>
            Show filters
            {activeFilterCount > 0 ? ` · ${activeFilterCount} active` : ""}
          </Text>
        </Pressable>
      ) : null}

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
          data={properties}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
          removeClippedSubviews
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isFetchingNextPage}
              onRefresh={() => void query.refetch()}
              tintColor={colors.primary}
            />
          }
          onEndReached={() => {
            if (query.hasNextPage && !query.isFetchingNextPage) {
              void query.fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <StateBlock empty="No listings found for this filter." />
          }
          ListFooterComponent={
            <View style={styles.footerWrap}>
              {query.isFetchingNextPage ? (
                <ActivityIndicator color={colors.primary} />
              ) : null}
              {totalCount > 0 ? (
                <Text style={styles.footerMeta}>
                  Showing {properties.length} of {totalCount}
                </Text>
              ) : null}
            </View>
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
  titleAccent: {
    width: 40,
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  filtersPanel: {
    overflow: "hidden",
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
  filtersCollapsed: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  filtersCollapsedText: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
  list: {
    paddingBottom: spacing["2xl"],
    gap: spacing.md,
  },
  footerWrap: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  footerMeta: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
    textAlign: "center",
  },
});
