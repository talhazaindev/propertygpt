import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useVideoPlayer, VideoView } from "expo-video";
import { Share2, Video as VideoIcon } from "lucide-react-native";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { SecondaryButton } from "@/src/components/ui/SecondaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { StateBlock } from "@/src/components/ui/StateBlock";
import { VerifiedBadge } from "@/src/components/ui/VerifiedBadge";
import { SERVER_ORIGIN } from "@/src/config/env";
import { getApiErrorMessage } from "@/src/services/api/client";
import { fetchPropertyById } from "@/src/services/api/properties";
import {
  isSafeExternalMediaUrl,
  isVideoUrl,
} from "@/src/services/upload/uploadthing";
import { useAuthStore } from "@/src/store/authStore";
import { formatArea, formatPrice, telUrl, whatsappUrl } from "@/src/utils/format";
import { colors, radii, spacing, typography } from "@/src/theme";

const width = Dimensions.get("window").width;
const heroHeight = Math.round(width * 0.72);

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const propertyId = Array.isArray(id) ? id[0] : id;
  const user = useAuthStore((s) => s.user);
  const [imageIndex, setImageIndex] = useState(0);
  const galleryRef = useRef<FlatList<string>>(null);

  const query = useQuery({
    queryKey: ["property", propertyId],
    queryFn: () => fetchPropertyById(propertyId as string),
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

  const isOwner = Boolean(
    user &&
      query.data?.owner?.id &&
      user.id === query.data.owner.id
  );

  const onShare = useCallback(async () => {
    if (!query.data) return;
    const webUrl = `${SERVER_ORIGIN.replace(/\/$/, "")}/properties/${query.data.id}`;
    try {
      await Share.share({
        message: `${query.data.title}\n${webUrl}`,
        url: webUrl,
        title: query.data.title,
      });
    } catch {
      // User cancelled.
    }
  }, [query.data]);

  const onMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / width);
      setImageIndex(index);
    },
    []
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

  return (
    <ScreenContainer style={styles.screen} testID="property-detail-screen">
      <Stack.Screen
        options={{
          title: property.title,
          headerRight: () => (
            <Pressable
              onPress={() => void onShare()}
              accessibilityRole="button"
              accessibilityLabel="Share listing"
              style={styles.shareHeader}
              testID="property-share"
            >
              <Share2 size={20} color={colors.primaryDark} />
            </Pressable>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isLoading}
            onRefresh={() => void query.refetch()}
            tintColor={colors.primary}
          />
        }
      >
        {images.length > 0 ? (
          <FlatList
            ref={galleryRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(uri, index) => `${uri}-${index}`}
            onMomentumScrollEnd={onMomentumEnd}
            renderItem={({ item: uri }) => (
              <GallerySlide uri={uri} active={images[imageIndex] === uri} />
            )}
            style={styles.gallery}
            getItemLayout={(_, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />
        ) : (
          <View style={[styles.hero, styles.heroFallback]}>
            <Text style={styles.fallbackText}>No photos</Text>
          </View>
        )}

        {images.length > 1 ? (
          <View style={styles.pagerRow}>
            <Text style={styles.pagerText}>
              {imageIndex + 1} / {images.length}
            </Text>
          </View>
        ) : null}

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
                  onPress={() => {
                    setImageIndex(index);
                    galleryRef.current?.scrollToIndex({ index, animated: true });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={video ? `Video ${index + 1}` : `Photo ${index + 1}`}
                  style={[
                    styles.thumb,
                    index === imageIndex ? styles.thumbActive : null,
                  ]}
                >
                  {video ? (
                    <View style={[styles.thumbImage, styles.thumbVideo]}>
                      <VideoIcon size={16} color={colors.primaryForeground} />
                    </View>
                  ) : (
                    <Image
                      source={{ uri }}
                      style={styles.thumbImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
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
          {!isOwner ? (
            <SecondaryButton
              label={user ? "Message about this listing" : "Sign in to message"}
              onPress={() => {
                if (!user) {
                  router.push("/login");
                  return;
                }
                router.push(
                  `/inbox/new?propertyId=${encodeURIComponent(property.id)}&title=${encodeURIComponent(property.title)}`
                );
              }}
              testID="property-message"
            />
          ) : null}
          <SecondaryButton
            label="Share listing"
            onPress={() => void onShare()}
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

function GallerySlide({ uri, active }: { uri: string; active: boolean }) {
  if (isVideoUrl(uri) && isSafeExternalMediaUrl(uri)) {
    return <InAppVideo uri={uri} active={active} />;
  }
  if (uri.startsWith("https://") || uri.startsWith("http://")) {
    return (
      <Image
        source={{ uri }}
        style={styles.hero}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
    );
  }
  return (
    <View style={[styles.hero, styles.heroFallback]}>
      <Text style={styles.fallbackText}>Unavailable</Text>
    </View>
  );
}

function InAppVideo({ uri, active }: { uri: string; active: boolean }) {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
  });

  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  return (
    <View style={styles.hero}>
      <VideoView
        player={player}
        style={styles.hero}
        contentFit="cover"
        nativeControls
        fullscreenOptions={{ enable: true }}
      />
    </View>
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
  gallery: {
    width,
    height: heroHeight,
  },
  hero: {
    width,
    height: heroHeight,
    backgroundColor: colors.muted,
  },
  heroFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackText: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
  },
  pagerRow: {
    position: "absolute",
    top: heroHeight - 36,
    right: spacing.lg,
    backgroundColor: "rgba(15,61,40,0.72)",
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  pagerText: {
    color: colors.primaryForeground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.xs,
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
  shareHeader: {
    paddingHorizontal: spacing.sm,
    minHeight: 44,
    justifyContent: "center",
  },
  error: {
    color: colors.destructive,
    fontFamily: typography.fonts.sans,
    marginBottom: spacing.md,
  },
});
