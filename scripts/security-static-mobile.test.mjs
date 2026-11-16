/**
 * Static guards for mobile auth + listing adapters.
 * Run: node --test scripts/security-static-mobile.test.mjs
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

describe("mobile auth surface", () => {
  it("ships login/refresh/logout + /api/me routes", () => {
    assert.match(read("src/app/api/auth/mobile/login/route.ts"), /createMobileSession/);
    assert.match(read("src/app/api/auth/mobile/refresh/route.ts"), /rotateMobileSession/);
    assert.match(read("src/app/api/auth/mobile/logout/route.ts"), /revokeMobileSession/);
    assert.match(read("src/app/api/me/route.ts"), /requireAuth/);
  });

  it("requireAuth is Bearer-first with no cookie fallback when Authorization present", () => {
    const src = read("src/lib/require-auth.ts");
    assert.match(src, /getBearerToken/);
    assert.match(src, /resolveMobileUserFromAccessToken/);
    assert.match(src, /getServerSession/);
    const fnStart = src.indexOf("export async function requireAuth");
    const body = src.slice(fnStart);
    assert.ok(fnStart >= 0, "requireAuth must exist");
    assert.ok(
      body.indexOf("if (bearer)") < body.indexOf("getServerSession"),
      "Bearer path must run before cookie session inside requireAuth"
    );
  });

  it("MobileSession model stores hashed refresh tokens", () => {
    const schema = read("prisma/schema.prisma");
    assert.match(schema, /model MobileSession/);
    assert.match(schema, /refreshTokenHash/);
    assert.match(schema, /familyId/);
  });

  it("documents MOBILE_JWT_SECRET in env example", () => {
    assert.match(read(".env.example"), /MOBILE_JWT_SECRET/);
  });
});

describe("listing + upload adapters", () => {
  it("exposes /api/properties/mine and absolute media URLs", () => {
    assert.match(read("src/app/api/properties/mine/route.ts"), /requireAuth/);
    assert.match(read("src/lib/media-url.ts"), /absoluteMediaUrls/);
    assert.match(read("src/app/api/properties/route.ts"), /listingType/);
    assert.match(read("src/app/api/properties/route.ts"), /absoluteMediaUrls/);
  });

  it("UploadThing middleware accepts mobile Bearer tokens", () => {
    const src = read("src/app/api/uploadthing/core.ts");
    assert.match(src, /resolveMobileUserFromAccessToken/);
    assert.match(src, /getBearerToken/);
  });

  it("property mutations use requireAuth", () => {
    assert.match(read("src/app/api/properties/route.ts"), /requireAuth\(req\)/);
    assert.match(read("src/app/api/properties/[id]/route.ts"), /requireAuth\(req\)/);
  });
});
