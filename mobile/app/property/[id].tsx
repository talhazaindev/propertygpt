import { useMemo, useState } from "react";
import {
  Dimensions,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Video } from "lucide-react-native";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { StateBlock } from "@/src/components/ui/StateBlock";
import { VerifiedBadge } from "@/src/components/ui/VerifiedBadge";
import { getApiErrorMessage } from "@/src/services/api/client";
import { fetchPropertyById } from "@/src/services/api/properties";
import { isVideoUrl } from "@/src/services/upload/uploadthing";
import { formatArea, formatPrice, telUrl, whatsappUrl } from "@/src/utils/format";
import { colors, radii, spacing, typography } from "@/src/theme";

const width = Dimensions.get("window").width;

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const propertyId = Array.isArray(id) ? id[0] : id;
  const [imageIndex, setImageIndex] = useState(0);

  const query = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => fetchPropertyById(propertyId),
    enabled: Boolean(propertyId),
  });

  const contactPhone = useMemo(() => {
    const property = query.data;
    if (!property) return null;
    return (
      property.contactPhone ||
      property.owner?.phoneNumber ||
      property.owner?.phone ||
      null
    );
  }, [query.data]);

  const callHref = telUrl(contactPhone);
  const waHref = whatsappUrl(
    contactPhone,
    query.data
      ? `Hi, I'm interested in "${query.data.title}" on Manzil.`
      : undefined
  );

  if (!propertyId) {
    return (
      <ScreenContainer>
        <Text style={styles.error}>Missing property id.</Text>
      </ScreenContainer>
    );
  }

  if (query.isLoading) {
    return (
      <ScreenContainer testID="property-detail-screen">
        <Stack.Screen options={{ title: "Property" }} />
        <StateBlock loading />
      </ScreenContainer>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ScreenContainer testID="property-detail-screen">
        <Stack.Screen options={{ title: "Property" }} />
        <StateBlock
          error={getApiErrorMessage(query.error, "Could not load property")}
          onRetry={() => void query.refetch()}
        />
      </ScreenContainer>
    );
  }

  const property = query.data;
  const images = property.images?.length ? property.images : [];
  const activeImage = images[imageIndex] || images[0];

  return (
    <ScreenContainer style={styles.screen}>
      <Stack.Screen options={{ title: property.title }} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeImage && !isVideoUrl(activeImage) ? (
          <Image source={{ uri: activeImage }} style={styles.hero} />
        ) : activeImage && isVideoUrl(activeImage) ? (
          <Pressable
            style={[styles.hero, styles.heroVideo]}
            onPress={() => void Linking.openURL(activeImage)}
            accessibilityRole="button"
            accessibilityLabel="Play listing video"
          >
            <Video size={36} color={colors.primaryForeground} />
            <Text style={styles.heroVideoLabel}>Tap to play video</Text>
          </Pressable>
        ) : (
          <View style={[styles.hero, styles.heroFallback]}>
            <Text style={styles.fallbackText}>No photos</Text>
          </View>
        )}

        {images.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbs}
          >
            {images.map((uri, index) => {
              const video = isVideoUrl(uri);
              return (
                <Pressable
                  key={`${uri}-${index}`}
                  onPress={() => setImageIndex(index)}
                  accessibilityRole="button"
                  accessibilityLabel={video ? `Video ${index + 1}` : `Photo ${index + 1}`}
                  style={[
                    styles.thumb,
                    index === imageIndex ? styles.thumbActive : null,
                  ]}
                >
                  {video ? (
                    <View style={[styles.thumbImage, styles.thumbVideo]}>
                      <Video size={16} color={colors.primaryForeground} />
                    </View>
                  ) : (
                    <Image source={{ uri }} style={styles.thumbImage} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        <View style={styles.headerRow}>
          <Text style={styles.price}>
            {formatPrice(property.price, property.listingType)}
          </Text>
          {property.status === "VERIFIED" || property.status === "ACTIVE" ? (
            <VerifiedBadge />
          ) : null}
        </View>

        <Text style={styles.title}>{property.title}</Text>
        <Text style={styles.meta}>
          {[property.city?.name, property.address].filter(Boolean).join(" · ")}
        </Text>

        <View style={styles.specs}>
          <Spec label="Type" value={property.type} />
          <Spec
            label="Listing"
            value={property.listingType === "RENTAL" ? "Rent" : "Sale"}
          />
          <Spec
            label="Beds"
            value={property.bedrooms != null ? String(property.bedrooms) : "—"}
          />
          <Spec
            label="Baths"
            value={
              property.bathrooms != null ? String(property.bathrooms) : "—"
            }
          />
          <Spec label="Area" value={formatArea(property.area)} />
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.description}>{property.description}</Text>

        {property.owner?.name ? (
          <Text style={styles.listedBy}>Listed by {property.owner.name}</Text>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton
            label="Call"
            disabled={!callHref}
            onPress={() => {
              if (callHref) void Linking.openURL(callHref);
            }}
          />
          <PrimaryButton
            label="WhatsApp"
            disabled={!waHref}
            onPress={() => {
              if (waHref) void Linking.openURL(waHref);
            }}
            style={styles.whatsapp}
          />
          {!contactPhone ? (
            <Text style={styles.contactHint}>
              Contact number is not available for this listing yet.
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.specItem}>
      <Text style={styles.specLabel}>{label}</Text>
      <Text style={styles.specValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  content: {
    paddingBottom: spacing["3xl"],
  },
  hero: {
    width,
    height: Math.round(width * 0.72),
    backgroundColor: colors.muted,
  },
  heroFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroVideo: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryDark,
  },
  heroVideoLabel: {
    color: colors.primaryForeground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
  fallbackText: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
  },
  thumbs: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  thumb: {
    width: 64,
    height: 48,
    borderRadius: radii.sm,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: colors.border,
  },
  thumbActive: {
    borderColor: colors.primary,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbVideo: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryDark,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  price: {
    color: colors.primaryDark,
    fontFamily: typography.fonts.serifBold,
    fontSize: typography.sizes["2xl"],
    flexShrink: 1,
  },
  title: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes.xl,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  meta: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },
  specs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  specItem: {
    minWidth: "30%",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  specLabel: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
  },
  specValue: {
    color: colors.foreground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes.lg,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.foreground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  listedBy: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  whatsapp: {
    backgroundColor: "#128C7E",
  },
  contactHint: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  error: {
    color: colors.destructive,
    fontFamily: typography.fonts.sans,
    marginBottom: spacing.md,
  },
});
