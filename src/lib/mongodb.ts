import { MongoClient } from 'mongodb';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set. Configure MongoDB Atlas in .env');
}

if (
  process.env.DATABASE_URL.includes('localhost') ||
  process.env.DATABASE_URL.includes('127.0.0.1')
) {
  throw new Error(
    'DATABASE_URL must point to MongoDB Atlas, not localhost'
  );
}

const uri = process.env.DATABASE_URL;
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

// Helper function to connect to the database
export async function connectDB() {
  const client = await clientPromise;
  const db = client.db();
  return { client, db };
}

export default clientPromise; 