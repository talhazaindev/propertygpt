import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addFavorite,
  fetchFavoriteIds,
  removeFavorite,
} from "@/src/services/api/favorites";
import { useAuthStore } from "@/src/store/authStore";

export const favoriteIdsKey = ["favorites", "ids"] as const;
export const favoritesListKey = ["favorites", "list"] as const;

export function useFavoriteIds() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: favoriteIdsKey,
    queryFn: fetchFavoriteIds,
    enabled: Boolean(user),
    staleTime: 30_000,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: async (input: {
      propertyId: string;
      currentlyFavorited: boolean;
    }) => {
      if (!user) {
        throw new Error("SIGN_IN_REQUIRED");
      }
      if (input.currentlyFavorited) {
        await removeFavorite(input.propertyId);
        return false;
      }
      await addFavorite(input.propertyId);
      return true;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: favoriteIdsKey });
      const previous = queryClient.getQueryData<string[]>(favoriteIdsKey) || [];
      const next = input.currentlyFavorited
        ? previous.filter((id) => id !== input.propertyId)
        : previous.includes(input.propertyId)
          ? previous
          : [input.propertyId, ...previous];
      queryClient.setQueryData(favoriteIdsKey, next);
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(favoriteIdsKey, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: favoriteIdsKey });
      void queryClient.invalidateQueries({ queryKey: favoritesListKey });
    },
  });
}
