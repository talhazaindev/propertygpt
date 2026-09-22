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

// GET /api/blogs - Fetch published blogs with pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const sortBy = searchParams.get("sortBy") || "publishedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Connect to database
    const { db } = await connectDB();

    // Build query - only return published blogs
    const query: any = {
      status: "PUBLISHED",
    };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { summary: { $regex: search, $options: "i" } },
      ];
    }

    if (tag) {
      query.tags = { $in: [tag] };
    }

    // Build sort
    const sort: any = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Execute query with pagination
    const blogs = await db
      .collection("BlogPost")
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray() as BlogDocument[];

    // Get total count for pagination
    const total = await db.collection("BlogPost").countDocuments(query);

    // Fetch author details
    const authorIds = blogs.map((blog) => new ObjectId(blog.authorId));
    const authors = await db
      .collection("TeamMember")
      .find({ _id: { $in: authorIds } })
      .toArray() as TeamMemberDocument[];

    // Map authors to blogs
    const blogsWithAuthors = blogs.map((blog) => {
      const author = authors.find(
        (a) => a._id.toString() === blog.authorId.toString()
      );
      return {
        id: blog._id.toString(),
        title: blog.title,
        slug: blog.slug,
        summary: blog.summary,
        coverImage: blog.coverImage,
        tags: blog.tags,
        createdAt: blog.createdAt.toISOString(),
        publishedAt: blog.publishedAt ? blog.publishedAt.toISOString() : null,
        author: author
          ? {
              id: author._id.toString(),
              name: author.name,
              image: author.image || null,
            }
          : null,
      };
    });

    return NextResponse.json({
      blogs: blogsWithAuthors,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
} 