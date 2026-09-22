import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";

interface BlogDocument {
  _id: ObjectId;
  title: string;
  slug: string;
  content: string;
  summary: string;
  coverImage: string;
  images: string[];
  status: string;
  tags: string[];
  authorId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
}

interface TeamMemberDocument {
  _id: ObjectId;
  name: string;
  email: string;
  role: string;
  image?: string;
}

// GET /api/blogs/[slug] - Get a specific blog by slug
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { error: "Blog slug is required" },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectDB();

    // Find blog by slug
    const blog = await db.collection("BlogPost").findOne({
      slug: slug,
      status: "PUBLISHED", // Only return published blogs
    }) as BlogDocument | null;

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    // Get author details
    const author = await db.collection("TeamMember").findOne({
      _id: new ObjectId(blog.authorId),
    }) as TeamMemberDocument | null;

    // Format response
    const formattedBlog = {
      id: blog._id.toString(),
      title: blog.title,
      slug: blog.slug,
      content: blog.content,
      summary: blog.summary,
      coverImage: blog.coverImage,
      images: blog.images,
      tags: blog.tags,
      createdAt: blog.createdAt.toISOString(),
      updatedAt: blog.updatedAt.toISOString(),
      publishedAt: blog.publishedAt ? blog.publishedAt.toISOString() : null,
      author: author
        ? {
            id: author._id.toString(),
            name: author.name,
            image: author.image || null,
          }
        : null,
    };

    return NextResponse.json(formattedBlog);
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json(
      { error: "Failed to fetch blog" },
      { status: 500 }
    );
  }
} 