#!/usr/bin/env node
/**
 * Hotfix B — inventory verification document file keys and mark them private in UploadThing.
 *
 * Prerequisites:
 *   - UPLOADTHING_TOKEN in env
 *   - MONGODB_URI in env
 *   - UploadThing dashboard: allow ACL override / private ACL enabled
 *
 * Usage:
 *   DRY_RUN=1 node scripts/migrate-verification-docs-private.mjs
 *   APPLY=1 node scripts/migrate-verification-docs-private.mjs
 */

import { MongoClient } from "mongodb";
import { UTApi } from "uploadthing/server";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

const DRY_RUN = process.env.APPLY !== "1";
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI / DATABASE_URL");
  process.exit(1);
}

if (!process.env.UPLOADTHING_TOKEN) {
  console.error("Missing UPLOADTHING_TOKEN");
  process.exit(1);
}

function extractKey(doc) {
  if (!doc || typeof doc !== "object") return null;
  if (typeof doc.fileKey === "string" && doc.fileKey.trim()) return doc.fileKey.trim();
  if (typeof doc.key === "string" && doc.key.trim()) return doc.key.trim();
  if (typeof doc.url !== "string") return null;
  try {
    const url = new URL(doc.url, "https://example.invalid");
    const match = url.pathname.match(/\/f\/([^/]+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const client = new MongoClient(MONGODB_URI);
  const utapi = new UTApi();

  await client.connect();
  const db = client.db();
  const properties = db.collection("Property");

  const cursor = properties.find(
    {},
    {
      projection: {
        title: 1,
        verificationDocuments: 1,
        agentVerifiedDocuments: 1,
      },
    }
  );

  const keys = new Set();
  const localPaths = [];
  let propertyCount = 0;
  let docCount = 0;

  for await (const property of cursor) {
    propertyCount += 1;
    const buckets = [
      property.verificationDocuments,
      property.agentVerifiedDocuments,
    ];
    for (const bucket of buckets) {
      if (!Array.isArray(bucket)) continue;
      for (const doc of bucket) {
        docCount += 1;
        const key = extractKey(doc);
        if (key) {
          keys.add(key);
        } else if (typeof doc?.url === "string" && doc.url.startsWith("/")) {
          localPaths.push({
            propertyId: String(property._id),
            title: property.title,
            url: doc.url,
          });
        }
      }
    }
  }

  console.log(`Scanned ${propertyCount} properties, ${docCount} document refs`);
  console.log(`Unique UploadThing keys: ${keys.size}`);
  console.log(`Local/public paths (need manual removal): ${localPaths.length}`);
  if (localPaths.length) {
    console.log(JSON.stringify(localPaths.slice(0, 20), null, 2));
  }

  const keyList = [...keys];
  if (DRY_RUN) {
    console.log("DRY RUN — set APPLY=1 to call utapi.updateACL(..., 'private')");
    console.log(keyList.slice(0, 20));
    await client.close();
    return;
  }

  const chunkSize = 50;
  let updated = 0;
  for (let i = 0; i < keyList.length; i += chunkSize) {
    const chunk = keyList.slice(i, i + chunkSize);
    const result = await utapi.updateACL(chunk, "private");
    updated += chunk.length;
    console.log(`Updated ACL for ${chunk.length} keys`, result);
  }

  console.log(`Done. Marked ${updated} keys private.`);
  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
