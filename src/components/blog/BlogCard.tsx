"use client";

import Link from "next/link";
import Image from "next/image";
import { BookOpen, Clock, User } from "lucide-react";

export type PublicBlogCardData = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverImage?: string | null;
  tags?: string[];
  publishedAt?: string | Date | null;
  createdAt?: string | Date | null;
  author?: {
    id?: string;
    name: string;
    image?: string | null;
  } | null;
};

function formatDate(value?: string | Date | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Cover({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-secondary/50">
        <BookOpen className="h-10 w-10 text-primary/40" />
      </div>
    );
  }

  const isDataUrl = src.startsWith("data:");

  if (isDataUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover transition-transform duration-500 group-hover:scale-105"
      sizes="(max-width: 768px) 100vw, 33vw"
    />
  );
}

export function BlogCard({
  blog,
  onTagClick,
}: {
  blog: PublicBlogCardData;
  onTagClick?: (tag: string) => void;
}) {
  const dateLabel = formatDate(blog.publishedAt || blog.createdAt);

  return (
    <Link
      href={`/blogs/${blog.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-muted">
        <Cover src={blog.coverImage} alt={blog.title} />
      </div>

      <div className="flex flex-1 flex-col p-5">
        {blog.tags && blog.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {blog.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-primary"
                onClick={(e) => {
                  if (!onTagClick) return;
                  e.preventDefault();
                  onTagClick(tag);
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-serif text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
          {blog.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
          {blog.summary}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-primary">
              <User className="h-3.5 w-3.5" />
            </span>
            <span className="font-medium text-foreground">
              {blog.author?.name || "Manzil Team"}
            </span>
          </div>
          {dateLabel && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {dateLabel}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
