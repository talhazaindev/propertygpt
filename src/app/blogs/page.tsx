"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { BlogCard } from "@/components/blog/BlogCard";

interface Blog {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverImage: string;
  tags: string[];
  publishedAt: string | null;
  createdAt?: string;
  author: {
    id: string;
    name: string;
    image: string | null;
  } | null;
}

interface Pagination {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export default function BlogsPage() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    pages: 0,
    page: 1,
    limit: 9,
  });

  const fetchBlogs = async (page = pagination.page) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
      });

      if (searchQuery) params.set("search", searchQuery);
      if (selectedTag) params.set("tag", selectedTag);

      const response = await fetch(`/api/blogs?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch blogs");
      }

      const data = await response.json();
      setBlogs(data.blogs || []);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      setError("Failed to load blogs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, selectedTag]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchBlogs(1);
  };

  const handleTagClick = (tag: string) => {
    setSelectedTag(tag === selectedTag ? "" : tag);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              Insights & guides
            </p>
            <h1 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-5xl">
              Manzil Blog
            </h1>
            <p className="mt-4 text-muted-foreground">
              Practical advice on titles, societies, verification, and buying safely in Pakistan.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="relative mx-auto mt-10 max-w-xl"
          >
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-28 text-sm text-foreground shadow-sm outline-none ring-primary focus:ring-2"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {selectedTag && (
          <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
            <span>Filtered by tag:</span>
            <button
              type="button"
              onClick={() => setSelectedTag("")}
              className="rounded-full bg-secondary px-3 py-1 font-medium text-primary"
            >
              {selectedTag} ×
            </button>
          </div>
        )}

        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-border bg-card animate-pulse"
              >
                <div className="aspect-[16/10] bg-muted" />
                <div className="space-y-3 p-5">
                  <div className="h-5 w-3/4 rounded bg-muted" />
                  <div className="h-4 w-full rounded bg-muted" />
                  <div className="h-4 w-2/3 rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && blogs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-16 text-center">
            <BookOpen className="mx-auto h-12 w-12 text-primary/40" />
            <h3 className="mt-4 font-serif text-xl text-foreground">
              No blog posts found
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {selectedTag
                ? `No blogs with the tag "${selectedTag}"`
                : searchQuery
                  ? `No results for "${searchQuery}"`
                  : "Published articles will appear here."}
            </p>
            {(selectedTag || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedTag("");
                  setSearchQuery("");
                  setPagination((prev) => ({ ...prev, page: 1 }));
                  fetchBlogs(1);
                }}
                className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {!isLoading && blogs.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {blogs.map((blog) => (
              <BlogCard
                key={blog.id}
                blog={blog}
                onTagClick={handleTagClick}
              />
            ))}
          </div>
        )}

        {!isLoading && blogs.length > 0 && pagination.pages > 1 && (
          <div className="mt-12 flex justify-center">
            <nav className="inline-flex overflow-hidden rounded-lg border border-border bg-card shadow-sm">
              <button
                type="button"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.max(prev.page - 1, 1),
                  }))
                }
                disabled={pagination.page === 1}
                className="px-3 py-2 text-muted-foreground disabled:opacity-40"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="border-x border-border px-4 py-2 text-sm text-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPagination((prev) => ({
                    ...prev,
                    page: Math.min(prev.page + 1, prev.pages),
                  }))
                }
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 text-muted-foreground disabled:opacity-40"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
