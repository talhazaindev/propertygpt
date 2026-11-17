import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ScreenContainer } from "@/src/components/ui/ScreenContainer";
import { StateBlock } from "@/src/components/ui/StateBlock";
import { getApiErrorMessage } from "@/src/services/api/client";
import { fetchBlogBySlug } from "@/src/services/api/blogs";
import { colors, radii, spacing, typography } from "@/src/theme";

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export default function BlogDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const blogSlug = Array.isArray(slug) ? slug[0] : slug;

  const query = useQuery({
    queryKey: ["blog", blogSlug],
    queryFn: () => fetchBlogBySlug(blogSlug),
    enabled: Boolean(blogSlug),
  });

  if (!blogSlug) {
    return (
      <ScreenContainer>
        <StateBlock error="Missing article." />
      </ScreenContainer>
    );
  }

  if (query.isLoading) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: "Article" }} />
        <StateBlock loading />
      </ScreenContainer>
    );
  }

  if (query.isError || !query.data) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ title: "Article" }} />
        <StateBlock
          error={getApiErrorMessage(query.error, "Could not load article")}
          onRetry={() => void query.refetch()}
        />
      </ScreenContainer>
    );
  }

  const blog = query.data;
  const body = blog.content ? stripHtml(blog.content) : blog.summary;

  return (
    <ScreenContainer style={styles.screen} atmosphere="hero">
      <Stack.Screen options={{ title: "Article" }} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {blog.coverImage ? (
          <Image source={{ uri: blog.coverImage }} style={styles.cover} />
        ) : null}
        <Text style={styles.title}>{blog.title}</Text>
        {blog.author?.name ? (
          <Text style={styles.meta}>By {blog.author.name}</Text>
        ) : null}
        {blog.summary ? <Text style={styles.summary}>{blog.summary}</Text> : null}
        <View style={styles.rule} />
        <Text style={styles.body}>{body}</Text>
      </ScrollView>
    </ScreenContainer>
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
  cover: {
    width: "100%",
    height: 220,
    backgroundColor: colors.muted,
  },
  title: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    color: colors.foreground,
    fontFamily: typography.fonts.serif,
    fontSize: typography.sizes["2xl"],
    lineHeight: 32,
  },
  meta: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.sm,
  },
  summary: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    color: colors.foreground,
    fontFamily: typography.fonts.sansSemibold,
    fontSize: typography.sizes.base,
    lineHeight: 24,
  },
  rule: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    height: 1.5,
    width: 48,
    backgroundColor: colors.accent,
    borderRadius: radii.sm,
  },
  body: {
    paddingHorizontal: spacing.lg,
    color: colors.mutedForeground,
    fontFamily: typography.fonts.sans,
    fontSize: typography.sizes.base,
    lineHeight: 26,
  },
});
