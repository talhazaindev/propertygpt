#!/usr/bin/env node
/**
 * Hotfix A regression checks against a running Next.js server.
 *
 * Usage:
 *   BASE_URL=http://127.0.0.1:3000 node scripts/security-regression-admin.mjs
 *
 * Expects unauthenticated callers (and header-spoof callers) to receive 401.
 */

const BASE_URL = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  ""
);

const cases = [
  {
    name: "Unauthenticated POST /api/admin/users cannot create ADMIN",
    method: "POST",
    path: "/api/admin/users",
    body: {
      name: "Attacker",
      email: `attacker-${Date.now()}@example.com`,
      password: "Password123!",
      role: "ADMIN",
    },
  },
  {
    name: "Unauthenticated PATCH /api/admin/users/[id] privilege escalation",
    method: "PATCH",
    path: "/api/admin/users/000000000000000000000000",
    body: { role: "ADMIN", password: "Hacked123!" },
  },
  {
    name: "Unauthenticated PATCH /api/admin/team/[id]",
    method: "PATCH",
    path: "/api/admin/team/000000000000000000000000",
    body: { role: "SUPER_ADMIN", isActive: true },
  },
  {
    name: "Unauthenticated DELETE /api/admin/team/[id]",
    method: "DELETE",
    path: "/api/admin/team/000000000000000000000000",
  },
  {
    name: "Unauthenticated POST /api/admin/cities",
    method: "POST",
    path: "/api/admin/cities",
    body: { name: `HackCity-${Date.now()}`, province: "Punjab" },
  },
  {
    name: "Header-only x-admin-auth on POST /api/admin/team",
    method: "POST",
    path: "/api/admin/team",
    headers: { "x-admin-auth": "true" },
    body: {
      name: "Fake Admin",
      email: `fake-admin-${Date.now()}@example.com`,
      password: "Password123!",
      role: "SUPER_ADMIN",
    },
  },
  {
    name: "Header-only x-admin-auth on GET /api/admin/properties",
    method: "GET",
    path: "/api/admin/properties",
    headers: { "x-admin-auth": "true" },
  },
  {
    name: "Header-only x-admin-auth on GET /api/admin/agents",
    method: "GET",
    path: "/api/admin/agents",
    headers: { "x-admin-auth": "true" },
  },
  {
    name: "Messaging staff impersonation via headers",
    method: "GET",
    path: "/api/messages/conversations",
    headers: {
      "x-admin-auth": "true",
      "x-admin-email": "superadmin@example.com",
    },
  },
  {
    name: "Unauthenticated verification document download",
    method: "GET",
    path: "/api/properties/000000000000000000000000/verification-documents/deadbeef",
  },
];

async function runCase(testCase) {
  const res = await fetch(`${BASE_URL}${testCase.path}`, {
    method: testCase.method,
    headers: {
      "Content-Type": "application/json",
      ...(testCase.headers || {}),
    },
    body: testCase.body ? JSON.stringify(testCase.body) : undefined,
  });

  const ok = res.status === 401 || res.status === 403;
  return {
    name: testCase.name,
    status: res.status,
    ok,
  };
}

async function main() {
  console.log(`Running Hotfix A regressions against ${BASE_URL}\n`);

  const results = [];
  for (const testCase of cases) {
    try {
      results.push(await runCase(testCase));
    } catch (error) {
      results.push({
        name: testCase.name,
        status: "ERR",
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  let failed = 0;
  for (const result of results) {
    const mark = result.ok ? "PASS" : "FAIL";
    if (!result.ok) failed += 1;
    console.log(
      `${mark}  [${result.status}] ${result.name}${
        result.error ? ` (${result.error})` : ""
      }`
    );
  }

  console.log(
    `\n${results.length - failed}/${results.length} passed; ${failed} failed`
  );
  process.exit(failed === 0 ? 0 : 1);
}

main();
