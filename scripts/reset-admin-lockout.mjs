// Clears the dashboard's wrong-password counters and lockouts (MongoDB collection `admin_login_attempts`).
//
//   npm run auth:unlock            lists what is stored, then deletes it
//   npm run auth:unlock -- --dry   only lists it
//
// It touches nothing else: not ADMIN_DASHBOARD_PASSWORD_HASH, not the session secret, not any session. To sign
// everyone out too, change ADMIN_SESSION_VERSION in the environment (Vercel) and redeploy.
// The records are keyed by a hash of the visitor's address, so with a single admin the whole collection is "the admin's".
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { MongoClient } = require("mongodb");

const env = {};
for (const file of [".env", ".env.local"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
    if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
}

const uri = process.env.MONGODB_URI || process.env.MONGO_URL || env.MONGODB_URI || env.MONGO_URL;
if (!uri) {
  console.error("MONGODB_URI (or MONGO_URL) is not set.");
  process.exit(1);
}

const dryRun = process.argv.includes("--dry");
const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });

try {
  await client.connect();
  const collection = client.db().collection("admin_login_attempts");
  const records = await collection.find({}).toArray();
  const now = Date.now();

  console.log(`records: ${records.length}`);
  for (const record of records) {
    const locked = record.lockedUntil && record.lockedUntil.getTime() > now;
    console.log(
      `- ${String(record._id).slice(0, 8)}…  failures=${record.failures}  ${locked ? `LOCKED until ${record.lockedUntil.toISOString()}` : "not locked"}`
    );
  }

  if (dryRun) {
    console.log("dry run: nothing was deleted.");
  } else {
    const result = await collection.deleteMany({});
    console.log(`deleted: ${result.deletedCount}. Sign-in is open again.`);
  }
} catch (error) {
  console.error("Failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.close();
}
