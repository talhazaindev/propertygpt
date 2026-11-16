#!/usr/bin/env node
/**
 * Hotfix A static regressions (no server required).
 * Run: node --test scripts/security-static-admin.test.mjs
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function readSrc(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

describe("Hotfix A static regressions", () => {
  it("staff-auth does not trust x-admin-auth headers", () => {
    const source = readSrc("src/lib/staff-auth.ts");
    assert.equal(source.includes("x-admin-auth"), false);
    assert.match(source, /requireStaff/);
    assert.match(source, /getServerSession/);
  });

  it("messaging-auth does not resolve staff from spoofable headers", () => {
    const source = readSrc("src/lib/messaging-auth.ts");
    assert.equal(source.includes("x-admin-auth"), false);
    assert.equal(source.includes("x-admin-email"), false);
    assert.equal(source.includes("x-team-email"), false);
    assert.match(source, /requireAuth/);
  });

  it("adminApi client no longer sends x-admin-auth", () => {
    const source = readSrc("src/lib/adminApi.ts");
    assert.equal(/['"]x-admin-auth['"]\s*:/.test(source), false);
    assert.match(source, /withCredentials:\s*true/);
  });

  it("critical admin routes call requireStaff", () => {
    const files = [
      "src/app/api/admin/users/route.ts",
      "src/app/api/admin/users/[id]/route.ts",
      "src/app/api/admin/team/route.ts",
      "src/app/api/admin/team/[id]/route.ts",
      "src/app/api/admin/cities/route.ts",
      "src/app/api/admin/properties/route.ts",
      "src/app/api/admin/properties/[id]/assign/route.ts",
      "src/app/api/admin/agents/route.ts",
      "src/app/api/admin/session/route.ts",
    ];

    for (const file of files) {
      const source = readSrc(file);
      assert.match(source, /requireStaff/, `${file} missing requireStaff`);
      assert.equal(
        source.includes("x-admin-auth"),
        false,
        `${file} still references x-admin-auth`
      );
    }
  });

  it("user and team PATCH routes do not mass-assign body", () => {
    const userPatch = readSrc("src/app/api/admin/users/[id]/route.ts");
    const teamPatch = readSrc("src/app/api/admin/team/[id]/route.ts");
    assert.equal(userPatch.includes("...body"), false);
    assert.equal(teamPatch.includes("...body"), false);
  });
});

describe("Hotfix B verification document privacy", () => {
  it("public property detail does not return raw verificationDocuments array blindly", () => {
    const source = readSrc("src/app/api/properties/[id]/route.ts");
    assert.match(source, /canAccessVerificationDocuments/);
    assert.match(source, /toSafeVerificationDocuments/);
    assert.equal(
      source.includes("verificationDocuments: property.verificationDocuments || []"),
      false
    );
  });

  it("verificationDocuments UploadThing route uses private ACL", () => {
    const source = readSrc("src/app/api/uploadthing/core.ts");
    assert.match(source, /verificationDocuments:/);
    assert.match(source, /acl:\s*"private"/);
  });

  it("signed download route exists", () => {
    const list = readSrc(
      "src/app/api/properties/[id]/verification-documents/route.ts"
    );
    const download = readSrc(
      "src/app/api/properties/[id]/verification-documents/[docId]/route.ts"
    );
    assert.match(list, /canAccessVerificationDocuments/);
    assert.match(download, /createSignedDownloadUrl/);
  });
});
