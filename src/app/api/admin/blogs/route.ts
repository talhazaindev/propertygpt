import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import { createBlogSchema } from "@/schemas/blog";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import slugify from "slugify";

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

// GET /api/admin/blogs - Fetch all blogs with pagination
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session in API:", session);

    // Check if user is authenticated and has admin access
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Connect to database
    const { db } = await connectDB();

    // Build query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      const statusArray = status.split(",");
      query.status = { $in: statusArray };
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
        ...blog,
        id: blog._id.toString(),
        _id: undefined,
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

// POST /api/admin/blogs - Create a new blog
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("Session in API:", session);

    // Check if user is authenticated and has admin access
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    
    // Extract fields for schema validation
    const { title, content, summary, tags, status } = body;
    
    // Validate with Zod schema
    const validationResult = createBlogSchema.safeParse({
      title, 
      content, 
      summary,
      tags,
      status
    });
    
    if (!validationResult.success) {
      const errors = validationResult.error.format();
      return NextResponse.json({ errors }, { status: 400 });
    }

    // Get image URLs from request body
    const coverImage = body.coverImage || "";
    const images = body.images || [];

    // Connect to database
    const { db } = await connectDB();

    // Generate slug from title
    const baseSlug = slugify(title, { lower: true, strict: true });
    
    // Check if slug already exists and append number if needed
    let slug = baseSlug;
    let counter = 0;
    let slugExists = true;
    
    while (slugExists) {
      const existingBlog = await db.collection("BlogPost").findOne({ slug });
      if (!existingBlog) {
        slugExists = false;
      } else {
        counter++;
        slug = `${baseSlug}-${counter}`;
      }
    }

    // Get team member ID from session
    const teamMemberId = session.user.id;

    // Check if team member exists
    const teamMember = await db.collection("TeamMember").findOne({
      _id: new ObjectId(teamMemberId),
    });

    if (!teamMember) {
      return NextResponse.json(
        { error: "Team member not found" },
        { status: 404 }
      );
    }

    // Prepare blog data with publishedAt if status is PUBLISHED
    const blogData = {
      title,
      slug,
      content,
      summary,
      coverImage,
      images,
      status,
      tags,
      authorId: new ObjectId(teamMemberId),
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    };

    // Insert blog
    const result = await db.collection("BlogPost").insertOne(blogData);

    // Return result
    return NextResponse.json({
      success: true,
      blog: {
        id: result.insertedId.toString(),
        ...blogData,
        authorId: teamMemberId,
        createdAt: blogData.createdAt.toISOString(),
        updatedAt: blogData.updatedAt.toISOString(),
        publishedAt: blogData.publishedAt ? blogData.publishedAt.toISOString() : null,
      },
    });
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      { error: "Failed to create blog" },
      { status: 500 }
    );
  }
} 