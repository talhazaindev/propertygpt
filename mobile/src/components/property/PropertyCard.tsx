import { memo, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { VerifiedBadge } from "@/src/components/ui/VerifiedBadge";
import type { PropertyListItem } from "@/src/services/api/properties";
import { formatPrice } from "@/src/utils/format";
import { colors, elevation, radii, spacing, typography } from "@/src/theme";

type PropertyCardProps = {
  item: PropertyListItem;
  onPress?: () => void;
};

function PropertyCardComponent({ item, onPress }: PropertyCardProps) {
  const image = item.images?.[0];
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
      {image ? (
        <Image
          source={{ uri: image }}
          style={styles.image}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Text style={styles.fallbackText}>No photo</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.price}>{price}</Text>
          {verified ? <VerifiedBadge label="Verified" /> : null}
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {[item.city?.name, item.address].filter(Boolean).join(" · ")}
        </Text>
        <Text style={styles.specs} numberOfLines={1}>
          {[
            item.bedrooms != null ? `${item.bedrooms} bed` : null,
            item.bathrooms != null ? `${item.bathrooms} bath` : null,
            item.area ? `${item.area} sq ft` : null,
            item.listingType === "RENTAL" ? "Rent" : "Sale",
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
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
    opacity: 0.94,
  },
  image: {
    width: "100%",
    height: 160,
    backgroundColor: colors.muted,
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  price: {
    color: colors.primaryDark,
    fontFamily: typography.fonts.serifBold,
    fontSize: typography.sizes.lg,
    flexShrink: 1,
  },
  cardTitle: {
    color: colors.foreground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.base,
  },
  meta: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
  },
  specs: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
