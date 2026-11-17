import { useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
} from "react-native";
import { Stack, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { StateBlock } from "@/src/components/ui/StateBlock";
import { PropertyCard } from "@/src/components/property/PropertyCard";
import { favoritesListKey } from "@/src/hooks/useFavoriteIds";
import { getApiErrorMessage } from "@/src/services/api/client";
import {
  fetchFavorites,
  type FavoriteProperty,
} from "@/src/services/api/favorites";
import { useAuthStore } from "@/src/store/authStore";
import { colors, spacing, typography } from "@/src/theme";

export default function FavoritesScreen() {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s.hydrated);

  const query = useQuery({
    queryKey: favoritesListKey,
    queryFn: fetchFavorites,
    enabled: Boolean(user),
  });

  const renderItem = useCallback(({ item }: { item: FavoriteProperty }) => {
    return (
      <PropertyCard
        item={item}
        onPress={() => router.push(`/property/${item.id}`)}
      />
    );
  }, []);

  if (!hydrated) {
    return (
      <ScreenContainer>
        <StateBlock loading />
      </ScreenContainer>
    );
  }

  if (!user) {
    return (
      <ScreenContainer atmosphere="hero" testID="favorites-screen">
        <Stack.Screen options={{ title: "Favorites" }} />
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.body}>
          Sign in to save verified homes and find them later.
        </Text>
        <PrimaryButton
          label="Sign in"
          onPress={() => router.push("/login")}
          testID="favorites-sign-in"
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer style={styles.screen} atmosphere="hero" testID="favorites-screen">
      <Stack.Screen options={{ title: "Favorites" }} />
      <Text style={styles.title}>Favorites</Text>
      <Text style={styles.subtitle}>
        Homes you saved while browsing Manzil.
      </Text>

      <StateBlock
        loading={query.isLoading}
        error={
          query.isError
            ? getApiErrorMessage(query.error, "Could not load favorites")
            : null
        }
        onRetry={() => void query.refetch()}
      />

      {!query.isLoading && !query.isError ? (
        <FlatList
          style={styles.list}
          data={query.data ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={query.isRefetching && !query.isLoading}
              onRefresh={() => void query.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <StateBlock empty="No saved homes yet. Tap the heart on a listing to save it." />
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
  body: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.md,
    paddingBottom: spacing["2xl"],
  },
});
