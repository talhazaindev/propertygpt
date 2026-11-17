import { apiClient } from "@/src/services/api/client";
import { SERVER_ORIGIN } from "@/src/config/env";

export type BlogListItem = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverImage: string | null;
  tags: string[];
  createdAt: string;
  publishedAt: string | null;
  author?: { id: string; name: string; image: string | null } | null;
};

export type BlogDetail = BlogListItem & {
  content?: string;
  images?: string[];
};

function absolutize(url: string | null | undefined): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  const origin = SERVER_ORIGIN.replace(/\/$/, "");
  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

export async function fetchLatestBlogs(limit = 3): Promise<BlogListItem[]> {
  const { data } = await apiClient.get<{ blogs: BlogListItem[] }>("/api/blogs", {
    params: { limit, page: 1, sortBy: "publishedAt", sortOrder: "desc" },
  });
  return (data.blogs || []).map((blog) => ({
    ...blog,
    coverImage: absolutize(blog.coverImage),
  }));
}

export async function fetchBlogBySlug(slug: string): Promise<BlogDetail> {
  const { data } = await apiClient.get<BlogDetail>(`/api/blogs/${slug}`);
  return {
    ...data,
    coverImage: absolutize(data.coverImage),
    images: (data.images || []).map((uri) => absolutize(uri) || uri),
  };
}
