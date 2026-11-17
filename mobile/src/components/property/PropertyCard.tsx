import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Video } from "lucide-react-native";
import { VerifiedBadge } from "@/src/components/ui/VerifiedBadge";
import { FavoriteButton } from "@/src/components/property/FavoriteButton";
import type { PropertyListItem } from "@/src/services/api/properties";
import { isVideoUrl } from "@/src/services/upload/uploadthing";
import { formatPrice } from "@/src/utils/format";
import { colors, elevation, radii, spacing, typography } from "@/src/theme";

type PropertyCardProps = {
  item: PropertyListItem;
  onPress?: () => void;
  /** Show save-heart overlay (default true). */
  showFavorite?: boolean;
};

function PropertyCardComponent({
  item,
  onPress,
  showFavorite = true,
}: PropertyCardProps) {
  const cover =
    item.images?.find((uri) => !isVideoUrl(uri)) || item.images?.[0];
  const coverIsVideo = Boolean(cover && isVideoUrl(cover));
  const verified = item.status === "VERIFIED" || item.status === "ACTIVE";
  const price = formatPrice(item.price, item.listingType);
  const location = [item.city?.name, item.address].filter(Boolean).join(", ");

  const a11yLabel = useMemo(() => {
    const parts = [
      item.title,
      price,
      location || null,
      verified ? "Verified" : null,
      item.listingType === "RENTAL" ? "For rent" : "For sale",
    ].filter(Boolean);
    return parts.join(". ");
  }, [item.title, item.listingType, price, location, verified]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      testID={`property-card-${item.id}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
    >
      <View style={styles.imageWrap}>
        {cover && !coverIsVideo ? (
          <Image
            source={{ uri: cover }}
            style={styles.image}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            accessibilityIgnoresInvertColors
          />
        ) : coverIsVideo ? (
          <View style={[styles.image, styles.videoFallback]}>
            <Video size={28} color={colors.primaryForeground} />
            <Text style={styles.videoFallbackText}>Video</Text>
          </View>
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.fallbackText}>No photo</Text>
          </View>
        )}
        <View style={styles.imageFade} />
        {verified ? (
          <View style={styles.badgeFloat}>
            <VerifiedBadge label="Verified" />
          </View>
        ) : null}
        {showFavorite ? (
          <View style={styles.favoriteFloat}>
            <FavoriteButton propertyId={item.id} overlay size={18} />
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.price}>{price}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[item.city?.name, item.address].filter(Boolean).join(" · ")}
        </Text>
        <View style={styles.specsRow}>
          <Text style={styles.specs} numberOfLines={1}>
            {[
              item.bedrooms != null ? `${item.bedrooms} bed` : null,
              item.bathrooms != null ? `${item.bathrooms} bath` : null,
              item.area ? `${item.area} sq ft` : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          <Text style={styles.listingType}>
            {item.listingType === "RENTAL" ? "Rent" : "Sale"}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export const PropertyCard = memo(PropertyCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii["2xl"],
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    ...elevation.card,
  },
  pressed: {
    opacity: 0.96,
    transform: [{ scale: 0.995 }],
  },
  imageWrap: {
    position: "relative",
  },
  image: {
    width: "100%",
    height: 176,
    backgroundColor: colors.muted,
  },
  imageFade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(15, 61, 40, 0.08)",
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  videoFallback: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.primaryDark,
  },
  videoFallbackText: {
    color: colors.primaryForeground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.xs,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  fallbackText: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
  },
  badgeFloat: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
  },
  favoriteFloat: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    zIndex: 2,
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  price: {
    color: colors.primaryDark,
    fontFamily: typography.fonts.serifBold,
    fontSize: typography.sizes.lg,
  },
  cardTitle: {
    color: colors.foreground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.base,
    lineHeight: 22,
  },
  meta: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
  },
  specsRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  specs: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
    flex: 1,
  },
  listingType: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.xs,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
});
