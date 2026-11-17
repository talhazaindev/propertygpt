import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { Heart } from "lucide-react-native";
import { router } from "expo-router";
import { useFavoriteIds, useToggleFavorite } from "@/src/hooks/useFavoriteIds";
import { useAuthStore } from "@/src/store/authStore";
import { colors, radii } from "@/src/theme";

type FavoriteButtonProps = {
  propertyId: string;
  size?: number;
  /** When true, sits on photo overlays with a dark frosted circle. */
  overlay?: boolean;
  testID?: string;
};

export function FavoriteButton({
  propertyId,
  size = 20,
  overlay = false,
  testID,
}: FavoriteButtonProps) {
  const user = useAuthStore((s) => s.user);
  const ids = useFavoriteIds();
  const toggle = useToggleFavorite();

  const favorited = Boolean(ids.data?.includes(propertyId));
  const busy =
    toggle.isPending && toggle.variables?.propertyId === propertyId;

  return (
    <Pressable
      onPress={() => {
        if (!user) {
          router.push("/login");
          return;
        }
        toggle.mutate({
          propertyId,
          currentlyFavorited: favorited,
        });
      }}
      accessibilityRole="button"
      accessibilityLabel={favorited ? "Remove from favorites" : "Save to favorites"}
      accessibilityState={{ selected: favorited }}
      hitSlop={10}
      style={[
        styles.btn,
        overlay ? styles.overlay : styles.plain,
        favorited ? styles.active : null,
      ]}
      testID={testID || `favorite-${propertyId}`}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Heart
          size={size}
          color={favorited ? colors.destructive : colors.primaryDark}
          fill={favorited ? colors.destructive : "transparent"}
        />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    backgroundColor: "rgba(250, 248, 243, 0.92)",
  },
  plain: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  active: {
    borderColor: colors.destructive,
  },
});
