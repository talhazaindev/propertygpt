// Simple script to fix properties with missing owners
import { MongoClient, ObjectId } from 'mongodb';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as path from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function main() {
  const uri = process.env.DATABASE_URL;
  
  if (!uri) {
    console.error('DATABASE_URL not found in environment variables');
    process.exit(1);
  }
  
  // Extract database name from connection string
  const dbName = uri.split('/').pop()?.split('?')[0];
  
  if (!dbName) {
    console.error('Could not extract database name from connection string');
    process.exit(1);
  }
  
  console.log(`Using database: ${dbName}`);
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(dbName);
    const users = db.collection('User');
    const properties = db.collection('Property');
    
    // Find an admin user to use as default owner
    let defaultOwner = await users.findOne({ role: 'ADMIN' });
    
    if (!defaultOwner) {
      console.log('No admin user found. Creating one...');
      defaultOwner = {
        name: 'Admin',
        email: 'admin@propertygpt.com',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await users.insertOne(defaultOwner);
      defaultOwner._id = result.insertedId;
      console.log(`Created admin user with ID: ${defaultOwner._id}`);
    } else {
      console.log(`Using existing admin: ${defaultOwner.name} (${defaultOwner._id})`);
    }
    
    // Find properties with missing owner IDs
    const propertiesWithIssues = await properties.find({
      $or: [
        { ownerId: { $exists: false } },
        { ownerId: null }
      ]
    }).toArray();
    
    console.log(`Found ${propertiesWithIssues.length} properties with missing owner references`);
    
    // Fix each property
    for (const property of propertiesWithIssues) {
      await properties.updateOne(
        { _id: property._id },
        { $set: { ownerId: defaultOwner._id } }
      );
      console.log(`Fixed property "${property.title || 'Untitled'}" (${property._id})`);
    }
    
    console.log('Property data repair completed');
    
  } catch (error) {
    console.error('Error repairing properties:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

main(); 