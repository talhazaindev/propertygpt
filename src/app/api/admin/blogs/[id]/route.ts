import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import { updateBlogSchema } from "@/schemas/blog";
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

// GET /api/admin/blogs/[id] - Get a specific blog
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Validate object ID
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid blog ID" },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectDB();

    // Find blog by ID
    const blog = await db.collection("BlogPost").findOne({
      _id: new ObjectId(id),
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
      status: blog.status,
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

// PUT /api/admin/blogs/[id] - Update a blog
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Validate object ID
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid blog ID" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await req.json();
    
    // Extract updateable fields
    const { title, content, summary, tags, status, coverImage, images } = body;
    
    // Validate with Zod schema
    const validationResult = updateBlogSchema.safeParse({
      id,
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

    // Connect to database
    const { db } = await connectDB();

    // Check if blog exists
    const existingBlog = await db.collection("BlogPost").findOne({
      _id: new ObjectId(id),
    });

    if (!existingBlog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    // Generate new slug if title is updated
    let slug = existingBlog.slug;
    if (title && title !== existingBlog.title) {
      const baseSlug = slugify(title, { lower: true, strict: true });
      
      // Check if slug already exists and append number if needed
      let newSlug = baseSlug;
      let counter = 0;
      let slugExists = true;
      
      while (slugExists) {
        const slugBlog = await db.collection("BlogPost").findOne({ 
          slug: newSlug,
          _id: { $ne: new ObjectId(id) }  // Exclude current blog
        });
        
        if (!slugBlog) {
          slugExists = false;
          slug = newSlug;
        } else {
          counter++;
          newSlug = `${baseSlug}-${counter}`;
        }
      }
    }

    // Prepare update data
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (summary) updateData.summary = summary;
    if (tags) updateData.tags = tags;
    if (slug !== existingBlog.slug) updateData.slug = slug;
    if (coverImage) updateData.coverImage = coverImage;
    if (images) updateData.images = images;
    
    // Handle status change - update publishedAt if changing to PUBLISHED
    if (status && status !== existingBlog.status) {
      updateData.status = status;
      if (status === "PUBLISHED" && existingBlog.status !== "PUBLISHED") {
        updateData.publishedAt = new Date();
      }
    }

    // Update blog
    await db.collection("BlogPost").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Get updated blog
    const updatedBlog = await db.collection("BlogPost").findOne({
      _id: new ObjectId(id),
    }) as BlogDocument;

    // Get author details
    const author = await db.collection("TeamMember").findOne({
      _id: new ObjectId(updatedBlog.authorId),
    }) as TeamMemberDocument | null;

    // Format response
    const formattedBlog = {
      id: updatedBlog._id.toString(),
      title: updatedBlog.title,
      slug: updatedBlog.slug,
      content: updatedBlog.content,
      summary: updatedBlog.summary,
      coverImage: updatedBlog.coverImage,
      images: updatedBlog.images,
      status: updatedBlog.status,
      tags: updatedBlog.tags,
      createdAt: updatedBlog.createdAt.toISOString(),
      updatedAt: updatedBlog.updatedAt.toISOString(),
      publishedAt: updatedBlog.publishedAt ? updatedBlog.publishedAt.toISOString() : null,
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
    console.error("Error updating blog:", error);
    return NextResponse.json(
      { error: "Failed to update blog" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blogs/[id] - Delete a blog
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Validate object ID
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid blog ID" },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectDB();

    // Check if blog exists
    const blog = await db.collection("BlogPost").findOne({
      _id: new ObjectId(id),
    });

    if (!blog) {
      return NextResponse.json(
        { error: "Blog not found" },
        { status: 404 }
      );
    }

    // Delete blog
    await db.collection("BlogPost").deleteOne({
      _id: new ObjectId(id),
    });

    return NextResponse.json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { error: "Failed to delete blog" },
      { status: 500 }
    );
  }
} 