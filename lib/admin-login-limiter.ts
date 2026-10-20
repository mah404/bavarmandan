import "server-only";

import { createHmac } from "node:crypto";
import clientPromise from "@/lib/mongodb";

const maximumFailures = 5;
const lockDurationMs = 15 * 60 * 1000;
const collectionName = "admin_login_attempts";

type AttemptRecord = {
  _id: string;
  failures: number;
  lockedUntil?: Date;
  expiresAt: Date;
};

let indexesReady: Promise<unknown> | null = null;

function ipKey(ip: string) {
  const secret = process.env.ADMIN_DASHBOARD_SESSION_SECRET || "missing-secret";
  return createHmac("sha256", secret).update(ip).digest("hex");
}

async function attemptsCollection() {
  const client = await clientPromise;
  const collection = client.db().collection<AttemptRecord>(collectionName);

  indexesReady ??= collection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: "expire_admin_login_attempts" }
  );
  await indexesReady;

  return collection;
}

export async function readLoginLock(ip: string) {
  const collection = await attemptsCollection();
  const record = await collection.findOne({ _id: ipKey(ip) });
  const now = Date.now();

  if (record?.lockedUntil && record.lockedUntil.getTime() > now) {
    return Math.ceil((record.lockedUntil.getTime() - now) / 1000);
  }

  if (record?.lockedUntil) {
    await collection.deleteOne({ _id: record._id });
  }

  return 0;
}

export async function recordLoginFailure(ip: string) {
  const collection = await attemptsCollection();
  const key = ipKey(ip);
  const expiry = new Date(Date.now() + lockDurationMs);

  const record = await collection.findOneAndUpdate(
    { _id: key },
    {
      $inc: { failures: 1 },
      $set: { expiresAt: expiry },
      $setOnInsert: { _id: key },
    },
    { upsert: true, returnDocument: "after" }
  );

  const failures = record?.failures ?? 1;
  if (failures >= maximumFailures) {
    const lockedUntil = new Date(Date.now() + lockDurationMs);
    await collection.updateOne(
      { _id: key },
      { $set: { lockedUntil, expiresAt: lockedUntil } }
    );
    return { locked: true, remainingAttempts: 0, retryAfterSeconds: 15 * 60 };
  }

  return {
    locked: false,
    remainingAttempts: maximumFailures - failures,
    retryAfterSeconds: 0,
  };
}

export async function clearLoginFailures(ip: string) {
  const collection = await attemptsCollection();
  await collection.deleteOne({ _id: ipKey(ip) });
}
