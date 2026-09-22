import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log(`Loading .env file from: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('No .env file found in project root');
  dotenv.config();
}

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('DATABASE_URL is not defined in your environment variables');
  console.log('Please create or update your .env file with a valid MongoDB connection string');
  console.log('Example: DATABASE_URL="mongodb://localhost:27017/propertygpt"');
  process.exit(1);
}

console.log('Checking MongoDB connection...');
console.log(`Connection string: ${dbUrl.replace(/mongodb:\/\/([^:]+):([^@]+)@/, 'mongodb://USERNAME:PASSWORD@')}`);

async function checkConnection() {
  const client = new MongoClient(dbUrl);
  
  try {
    await client.connect();
    console.log('✅ Successfully connected to MongoDB!');
    
    const db = client.db();
    const collections = await db.listCollections().toArray();
    
    console.log('\nAvailable collections:');
    if (collections.length === 0) {
      console.log('No collections found. Database might be empty.');
    } else {
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
    }
    
    // Instructions for creating an admin user manually
    console.log('\n=== Creating Admin User Manually ===');
    console.log('Run this command in MongoDB Compass or MongoDB Shell:');
    console.log(`
db.User.insertOne({
  name: "Super Admin",
  email: "superadmin@propertygpt.com",
  hashedPassword: "$2b$12$k8Y1Vao0klPkGaLIBt7rQeulVsD5m5rUQAdXXRqjK4RA1NTeyXOKC", // This is 'SuperAdmin123'
  role: "ADMIN",
  createdAt: new Date(),
  updatedAt: new Date()
})
    `);
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:');
    console.error(error);
    
    console.log('\n=== Troubleshooting Steps ===');
    console.log('1. Make sure MongoDB is running on your machine');
    console.log('2. If using MongoDB Compass, check the connection string format:');
    console.log('   - For local MongoDB: mongodb://localhost:27017/propertygpt');
    console.log('   - For MongoDB Atlas: mongodb+srv://<username>:<password>@<cluster>.mongodb.net/propertygpt');
    console.log('3. Check if credentials are correct (if using authentication)');
    console.log('4. Check if the port (default: 27017) is correct and not blocked by firewall');
    console.log('5. If using MongoDB Atlas, make sure your IP is whitelisted');
  } finally {
    await client.close();
  }
}

// Run the check
checkConnection(); 