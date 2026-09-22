#!/usr/bin/env node
/**
 * Verifies DATABASE_URL points at a remote MongoDB Atlas cluster (not localhost)
 * and that the connection succeeds. Run from propertygpt/: npm run verify-atlas
 *
 * Also forces public DNS resolvers for SRV lookups — some ISP DNS returns EBADRESP
 * for _mongodb._tcp.* records.
 */
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

require("dotenv").config({ path: ".env" });
const { MongoClient } = require("mongodb");

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error("FAIL: DATABASE_URL is not set in .env");
    process.exit(1);
  }
  if (uri.includes("localhost") || uri.includes("127.0.0.1")) {
    console.error(
      "FAIL: DATABASE_URL still points at localhost. Use MongoDB Atlas."
    );
    process.exit(1);
  }

  const redacted = uri.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@");
  console.log("Connecting to:", redacted.split("?")[0]);
  console.log("DNS servers:", dns.getServers().join(", "));

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 20000,
  });
  try {
    await client.connect();
    const db = client.db();
    const cols = await db.listCollections().toArray();
    console.log("OK: connected to database", db.databaseName);
    console.log(
      "Collections:",
      cols.length
        ? cols.map((c) => c.name).join(", ")
        : "(none yet — run: npx prisma db push && npm run prisma:seed)"
    );
  } catch (err) {
    console.error("FAIL: could not connect —", err.message);
    console.error("");
    console.error("If you see querySrv EBADRESP / ECONNREFUSED:");
    console.error("  1. Use the non-SRV mongodb:// URI (already set in .env), or");
    console.error("  2. Set Mac DNS to 8.8.8.8 / 1.1.1.1 (System Settings → Network → DNS)");
    console.error("Also check Atlas Network Access allows your IP (or 0.0.0.0/0 for early dev).");
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
