import { useCallback, type ReactNode } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Building2,
  CheckCircle2,
  FileText,
  HardHat,
  Headset,
  MapPinned,
  Scale,
  ShieldCheck,
  Tag,
  UserCheck,
  Wallet,
  BadgeCheck,
} from "lucide-react-native";
import { BrandMark } from "@/src/components/brand/BrandMark";
import { PrimaryButton } from "@/src/components/ui/PrimaryButton";
import { SecondaryButton } from "@/src/components/ui/SecondaryButton";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { StateBlock } from "@/src/components/ui/StateBlock";
import { VerifiedBadge } from "@/src/components/ui/VerifiedBadge";
import { PropertyCard } from "@/src/components/property/PropertyCard";
import { SERVER_ORIGIN } from "@/src/config/env";
import {
  LANDING_CHECKS,
  LANDING_GUARANTEES,
  LANDING_PARTNERS,
  LANDING_REVIEWS,
  LANDING_SERVICES,
  LANDING_STATS,
} from "@/src/content/landing";
import { fetchLatestBlogs } from "@/src/services/api/blogs";
import { getApiErrorMessage } from "@/src/services/api/client";
import {
  fetchProperties,
  type PropertyListItem,
} from "@/src/services/api/properties";
import { colors, elevation, radii, spacing, typography } from "@/src/theme";

const HERO_IMAGE = `${SERVER_ORIGIN.replace(/\/$/, "")}/images/hero-home-web.jpg`;

const CHECK_ICONS = [FileText, Scale, UserCheck, MapPinned] as const;
const GUARANTEE_ICONS = [BadgeCheck, ShieldCheck, Wallet, Headset] as const;
const SERVICE_ICONS = {
  browse: Building2,
  sell: Tag,
  request: FileText,
  construction: HardHat,
} as const;

async function openWebPath(path: string): Promise<void> {
  const url = `${SERVER_ORIGIN.replace(/\/$/, "")}${path}`;
  await WebBrowser.openBrowserAsync(url);
}

export default function HomeScreen() {
  const featured = useQuery({
    queryKey: ["properties", "home-rail"],
    queryFn: async () => {
      const featuredOnly = await fetchProperties({
        featured: true,
        sortBy: "newest",
        limit: 3,
      });
      if (featuredOnly.properties.length > 0) {
        return featuredOnly;
      }
      return fetchProperties({
        sortBy: "newest",
        limit: 3,
      });
    },
  });

  const blogs = useQuery({
    queryKey: ["blogs", "home"],
    queryFn: () => fetchLatestBlogs(3),
  });

  const listings = featured.data?.properties ?? [];

  const renderListing = useCallback(
    (item: PropertyListItem) => (
      <PropertyCard
        key={item.id}
        item={item}
        onPress={() => router.push(`/property/${item.id}`)}
      />
    ),
    []
  );

  return (
    <ScreenContainer scroll atmosphere="hero" testID="home-screen">
      {/* Hero */}
      <View style={styles.hero}>
        <BrandMark size="md" />
        <View style={styles.trustPill}>
          <ShieldCheck size={14} color={colors.primary} />
          <Text style={styles.trustPillText}>
            Every listing legally verified before you see it
          </Text>
        </View>
        <Text style={styles.heroTitle}>
          Buy property in Pakistan{" "}
          <Text style={styles.heroAccent}>without the fear.</Text>
        </Text>
        <Text style={styles.heroBody}>
          Fake files, disputed plots, and double-sold houses end here. Manzil
          makes sure you get clear title, real ownership, and genuine documents.
        </Text>
        <PrimaryButton
          label="Browse verified listings"
          onPress={() => router.push("/(tabs)/browse")}
          testID="home-browse-cta"
        />
        <SecondaryButton
          label="Request a property"
          onPress={() => router.push("/request/create")}
          style={styles.heroSecondary}
          testID="home-request-cta"
        />
      </View>

      <View style={styles.heroMedia}>
        <Image source={{ uri: HERO_IMAGE }} style={styles.heroImage} />
        <View style={styles.heroOverlayCard}>
          <VerifiedBadge label="Manzil Verified" />
          <Text style={styles.heroOverlayText}>
            Title deed, ownership & society dues confirmed by our legal team.
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {LANDING_STATS.map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Partners */}
      <View style={styles.band}>
        <Text style={styles.bandEyebrow}>
          Cross-checked against official records
        </Text>
        <View style={styles.partnerWrap}>
          {LANDING_PARTNERS.map((partner) => (
            <View key={partner} style={styles.partnerChip}>
              <CheckCircle2 size={14} color={colors.primary} />
              <Text style={styles.partnerText}>{partner}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.zeroValue}>Zero</Text>
        <Text style={styles.zeroLabel}>disputed titles delivered</Text>
      </View>

      {/* Services */}
      <Section
        eyebrow="Services"
        title="Everything you need in one place"
        body="Browse, sell, request, or build — with the same Manzil trust standard."
      >
        <View style={styles.serviceGrid}>
          {LANDING_SERVICES.map((service) => {
            const Icon = SERVICE_ICONS[service.key as keyof typeof SERVICE_ICONS];
            return (
              <Pressable
                key={service.key}
                style={styles.serviceCard}
                onPress={() => router.push(service.href as never)}
                accessibilityRole="button"
                accessibilityLabel={service.title}
              >
                <Icon size={22} color={colors.primary} />
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceBody}>{service.body}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      {/* Verification */}
      <Section
        eyebrow="The Verification Standard"
        title="Four checks stand between a listing and you"
        body="Nothing is published on Manzil until it clears every stage."
      >
        <View style={styles.checkList}>
          {LANDING_CHECKS.map((check, index) => {
            const Icon = CHECK_ICONS[index];
            return (
              <View key={check.step} style={styles.checkCard}>
                <Text style={styles.checkStep}>{check.step}</Text>
                <Icon size={20} color={colors.primary} />
                <Text style={styles.checkTitle}>{check.title}</Text>
                <Text style={styles.checkBody}>{check.body}</Text>
              </View>
            );
          })}
        </View>
      </Section>

      {/* Featured listings */}
      <Section
        eyebrow="Featured"
        title="Verified listings"
        body="Each of these has passed Manzil verification checks."
        actionLabel="View all"
        onAction={() => router.push("/(tabs)/browse")}
      >
        <StateBlock
          loading={featured.isLoading}
          error={
            featured.isError
              ? getApiErrorMessage(featured.error, "Could not load listings")
              : null
          }
          empty={
            !featured.isLoading && !featured.isError && listings.length === 0
              ? "Verified listings coming soon."
              : null
          }
          onRetry={() => void featured.refetch()}
        />
        <View style={styles.listStack}>{listings.map(renderListing)}</View>
      </Section>

      {/* Guarantees */}
      <View style={styles.guaranteeBand}>
        <Text style={styles.guaranteeTitle}>
          Guarantees that put the risk on us
        </Text>
        <Text style={styles.guaranteeIntro}>
          Trust is easy to promise and hard to prove. These are the commitments
          we are willing to be held to.
        </Text>
        <View style={styles.guaranteeGrid}>
          {LANDING_GUARANTEES.map((item, index) => {
            const Icon = GUARANTEE_ICONS[index];
            return (
              <View key={item.title} style={styles.guaranteeCard}>
                <Icon size={20} color={colors.accent} />
                <Text style={styles.guaranteeCardTitle}>{item.title}</Text>
                <Text style={styles.guaranteeCardBody}>{item.body}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Blogs */}
      <Section
        eyebrow="Insights & guides"
        title="From the Manzil blog"
        body="Practical advice on titles, societies, verification, and buying safely."
        actionLabel="Open web blog"
        onAction={() => void openWebPath("/blogs")}
      >
        <StateBlock
          loading={blogs.isLoading}
          error={
            blogs.isError
              ? getApiErrorMessage(blogs.error, "Could not load articles")
              : null
          }
          empty={
            !blogs.isLoading &&
            !blogs.isError &&
            (blogs.data?.length ?? 0) === 0
              ? "Articles coming soon."
              : null
          }
          onRetry={() => void blogs.refetch()}
        />
        <View style={styles.blogStack}>
          {(blogs.data || []).map((blog) => (
            <Pressable
              key={blog.id}
              style={styles.blogCard}
              onPress={() => router.push(`/blog/${blog.slug}`)}
              accessibilityRole="button"
              accessibilityLabel={blog.title}
            >
              {blog.coverImage ? (
                <Image source={{ uri: blog.coverImage }} style={styles.blogCover} />
              ) : (
                <View style={[styles.blogCover, styles.blogCoverFallback]}>
                  <BookOpen size={24} color={colors.primary} />
                </View>
              )}
              <View style={styles.blogBody}>
                <Text style={styles.blogTitle} numberOfLines={2}>
                  {blog.title}
                </Text>
                <Text style={styles.blogSummary} numberOfLines={3}>
                  {blog.summary}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </Section>

      {/* Reviews */}
      <Section
        eyebrow="Stories"
        title="Trusted by families who couldn't afford a mistake"
        body="Real buyers who chose verification over regret."
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.reviewRow}
        >
          {LANDING_REVIEWS.map((review) => (
            <View key={review.name} style={styles.reviewCard}>
              <Text style={styles.reviewQuote}>“{review.quote}”</Text>
              <View style={styles.reviewFooter}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewInitials}>{review.initials}</Text>
                </View>
                <View>
                  <Text style={styles.reviewName}>{review.name}</Text>
                  <Text style={styles.reviewMeta}>{review.meta}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </Section>

      {/* Final CTA / form entry */}
      <View style={styles.ctaBand}>
        <Text style={styles.ctaEyebrow}>Start with confidence</Text>
        <Text style={styles.ctaTitle}>
          Let us verify your next property — before you commit
        </Text>
        <Text style={styles.ctaBody}>
          Tell us what you’re looking for. Our team will run verification and
          get back to you — no obligation.
        </Text>
        <PrimaryButton
          label="Request a property"
          onPress={() => router.push("/request/create")}
        />
        <SecondaryButton
          label="List a property to sell"
          onPress={() => router.push("/(tabs)/sell")}
          style={styles.ctaSecondary}
        />
      </View>
    </ScreenContainer>
  );
}

function Section(props: {
  eyebrow: string;
  title: string;
  body: string;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionEyebrow}>{props.eyebrow}</Text>
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>{props.title}</Text>
        {props.actionLabel && props.onAction ? (
          <Pressable onPress={props.onAction} accessibilityRole="button">
            <Text style={styles.sectionAction}>{props.actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionBody}>{props.body}</Text>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  trustPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(25, 91, 59, 0.2)",
    backgroundColor: colors.secondary,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  trustPillText: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.xs,
  },
  heroTitle: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["3xl"],
    lineHeight: 38,
    textAlign: "center",
  },
  heroAccent: {
    color: colors.primary,
  },
  heroBody: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  heroSecondary: {
    marginTop: spacing.xs,
    alignSelf: "stretch",
  },
  heroMedia: {
    borderRadius: radii["2xl"],
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    ...elevation.card,
  },
  heroImage: {
    width: "100%",
    height: 200,
    backgroundColor: colors.muted,
  },
  heroOverlayCard: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    backgroundColor: "rgba(255, 252, 247, 0.96)",
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroOverlayText: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    color: colors.foreground,
    fontFamily: typography.fonts.serifBold,
    fontSize: typography.sizes.xl,
  },
  statLabel: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
    textAlign: "center",
  },
  band: {
    backgroundColor: colors.secondaryLight,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing["2xl"],
    alignItems: "center",
  },
  bandEyebrow: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  partnerWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.sm,
  },
  partnerChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  partnerText: {
    color: colors.foreground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.xs,
  },
  zeroValue: {
    marginTop: spacing.lg,
    color: colors.primary,
    fontFamily: typography.fonts.serifBold,
    fontSize: typography.sizes["4xl"],
  },
  zeroLabel: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
  },
  section: {
    marginBottom: spacing["2xl"],
  },
  sectionEyebrow: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.xs,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: {
    flex: 1,
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["2xl"],
    lineHeight: 30,
  },
  sectionAction: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
    marginBottom: 4,
  },
  sectionAccent: {
    marginTop: spacing.sm,
    width: 40,
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  sectionBody: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    lineHeight: 22,
  },
  serviceGrid: {
    gap: spacing.md,
  },
  serviceCard: {
    backgroundColor: colors.card,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
    ...elevation.card,
  },
  serviceTitle: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes.lg,
  },
  serviceBody: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  checkList: {
    gap: spacing.md,
  },
  checkCard: {
    backgroundColor: colors.card,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  checkStep: {
    color: "rgba(25, 91, 59, 0.28)",
    fontFamily: typography.fonts.serifBold,
    fontSize: typography.sizes["2xl"],
  },
  checkTitle: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes.lg,
  },
  checkBody: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  listStack: {
    gap: spacing.md,
  },
  guaranteeBand: {
    backgroundColor: colors.primary,
    borderRadius: radii["2xl"],
    padding: spacing.lg,
    marginBottom: spacing["2xl"],
  },
  guaranteeTitle: {
    color: colors.primaryForeground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["2xl"],
    lineHeight: 30,
    textAlign: "center",
  },
  guaranteeIntro: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    color: "rgba(250, 248, 243, 0.8)",
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    lineHeight: 22,
    textAlign: "center",
  },
  guaranteeGrid: {
    gap: spacing.md,
  },
  guaranteeCard: {
    borderWidth: 1,
    borderColor: "rgba(250, 248, 243, 0.18)",
    backgroundColor: "rgba(250, 248, 243, 0.06)",
    borderRadius: radii.xl,
    padding: spacing.md,
    gap: spacing.sm,
  },
  guaranteeCardTitle: {
    color: colors.primaryForeground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes.base,
  },
  guaranteeCardBody: {
    color: "rgba(250, 248, 243, 0.75)",
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  blogStack: {
    gap: spacing.md,
  },
  blogCard: {
    backgroundColor: colors.card,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    ...elevation.card,
  },
  blogCover: {
    width: "100%",
    height: 140,
    backgroundColor: colors.muted,
  },
  blogCoverFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  blogBody: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  blogTitle: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes.lg,
  },
  blogSummary: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  reviewRow: {
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  reviewCard: {
    width: 280,
    backgroundColor: colors.card,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...elevation.card,
  },
  reviewQuote: {
    color: colors.foreground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    lineHeight: 22,
    flex: 1,
  },
  reviewFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewInitials: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.xs,
  },
  reviewName: {
    color: colors.foreground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.sm,
  },
  reviewMeta: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.xs,
  },
  ctaBand: {
    backgroundColor: colors.secondaryLight,
    borderRadius: radii["2xl"],
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  ctaEyebrow: {
    color: colors.primary,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.xs,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  ctaTitle: {
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["2xl"],
    lineHeight: 30,
    textAlign: "center",
  },
  ctaBody: {
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  ctaSecondary: {
    alignSelf: "stretch",
  },
});
