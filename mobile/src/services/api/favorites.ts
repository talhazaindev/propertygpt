import { apiClient } from "@/src/services/api/client";
import type { PropertyListItem, PropertyListResponse } from "@/src/services/api/properties";

export type FavoriteProperty = PropertyListItem & {
  favoritedAt?: string;
  isFavorite?: boolean;
};

export async function fetchFavoriteIds(): Promise<string[]> {
  const { data } = await apiClient.get<{ ids: string[] }>("/api/favorites/ids");
  return data.ids || [];
}

export async function fetchFavorites(): Promise<FavoriteProperty[]> {
  const { data } = await apiClient.get<{
    properties: FavoriteProperty[];
  }>("/api/favorites");
  return data.properties || [];
}

export async function addFavorite(propertyId: string): Promise<void> {
  await apiClient.post("/api/favorites", { propertyId });
}

export async function removeFavorite(propertyId: string): Promise<void> {
  await apiClient.delete(`/api/favorites/${encodeURIComponent(propertyId)}`);
}

export async function toggleFavorite(input: {
  propertyId: string;
  currentlyFavorited: boolean;
}): Promise<boolean> {
  if (input.currentlyFavorited) {
    await removeFavorite(input.propertyId);
    return false;
  }
  await addFavorite(input.propertyId);
  return true;
}

/** Shape compatible with browse list responses when needed. */
export async function fetchFavoritesAsList(): Promise<PropertyListResponse> {
  const properties = await fetchFavorites();
  return {
    properties,
    pagination: {
      total: properties.length,
      pages: 1,
      page: 1,
      limit: properties.length || 20,
    },
  };
}
