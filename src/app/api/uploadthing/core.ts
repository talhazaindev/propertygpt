import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import {
  MobileAuthError,
  resolveMobileUserFromAccessToken,
} from "@/lib/mobile-auth";

const f = createUploadthing();

function getBearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    throw new UploadThingError("Malformed Authorization header");
  }
  return token.trim();
}

/**
 * Accept mobile Bearer access tokens first; otherwise fall back to NextAuth JWT cookie.
 * Never fall back to cookies when a Bearer header is present but invalid.
 */
async function requireUserId(req: Request): Promise<string> {
  const bearer = getBearerToken(req);

  if (bearer) {
    try {
      const user = await resolveMobileUserFromAccessToken(bearer);
      return user.id;
    } catch (error) {
      if (error instanceof MobileAuthError) {
        throw new UploadThingError(error.message);
      }
      throw new UploadThingError("Unauthorized");
    }
  }

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
      maxFileSize: "8MB",
      maxFileCount: 10,
    },
    video: {
      maxFileSize: "64MB",
      maxFileCount: 3,
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
        type: file.type,
      };
    }),

  verificationDocuments: f({
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 5,
      acl: "private",
    },
    image: {
      maxFileSize: "8MB",
      maxFileCount: 5,
      acl: "private",
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
        key: file.key,
        name: file.name,
      };
    }),

  messageAttachments: f({
    image: {
      maxFileSize: "8MB",
      maxFileCount: 5,
    },
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 5,
    },
    text: {
      maxFileSize: "4MB",
      maxFileCount: 3,
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
        type: file.type,
        size: file.size,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
