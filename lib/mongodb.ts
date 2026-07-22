import { MongoClient } from "mongodb";

const options = {};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const mongoUris = [
  { name: "MONGODB_URI", value: process.env.MONGODB_URI },
  { name: "MONGO_URL", value: process.env.MONGO_URL },
].filter((item): item is { name: string; value: string } => Boolean(item.value));

if (mongoUris.length === 0) {
  throw new Error("Please add MONGODB_URI or MONGO_URL to your environment");
}

const connectWithFallback = async () => {
  let lastError: unknown;

  for (const uri of mongoUris) {
    try {
      const client = new MongoClient(uri.value, options);
      await client.connect();
      return client;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB connection failed with ${uri.name}`, error);
    }
  }

  throw lastError;
};

export const getMongoClient = () => {
  if (process.env.NODE_ENV === "development") {
    global._mongoClientPromise ??= connectWithFallback();
    return global._mongoClientPromise;
  }

  return connectWithFallback();
};

const clientPromise = {
  then: (...args: Parameters<Promise<MongoClient>["then"]>) =>
    getMongoClient().then(...args),
  catch: (...args: Parameters<Promise<MongoClient>["catch"]>) =>
    getMongoClient().catch(...args),
  finally: (...args: Parameters<Promise<MongoClient>["finally"]>) =>
    getMongoClient().finally(...args),
  [Symbol.toStringTag]: "Promise",
} as Promise<MongoClient>;

export default clientPromise;
