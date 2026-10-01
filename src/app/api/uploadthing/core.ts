import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const f = createUploadthing();

async function requireUserId(req: Request): Promise<string> {
  const token = await getToken({
    req: req as NextRequest,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token?.id && !token?.sub) {
    throw new UploadThingError("Unauthorized");
  }

  return String(token.id ?? token.sub);
}

/**
 * UploadThing file routes. Files go directly to UploadThing's CDN so they
 * never pass through the Vercel serverless 4.5MB request body limit.
 */
export const ourFileRouter = {
  propertyImages: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 10,
    },
  })
    .middleware(async ({ req }) => {
      const userId = await requireUserId(req);
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        name: file.name,
      };
    }),

  verificationDocuments: f({
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 5,
    },
    image: {
      maxFileSize: "8MB",
      maxFileCount: 5,
    },
  })
    .middleware(async ({ req }) => {
      const userId = await requireUserId(req);
      return { userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        url: file.ufsUrl,
        name: file.name,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
