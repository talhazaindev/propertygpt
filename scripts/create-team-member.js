import { MongoClient } from 'mongodb';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log(`Loading .env file from: ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('No .env file found in project root');
  dotenv.config();
}

const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/propertygpt';

async function createSuperAdminTeamMember() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(dbUrl);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const usersCollection = db.collection('User');
    const teamMembersCollection = db.collection('TeamMember');
    
    console.log('Looking for SuperAdmin user...');
    const superAdmin = await usersCollection.findOne({ email: 'superadmin@propertygpt.com' });
    
    if (!superAdmin) {
      console.log('SuperAdmin user not found. Creating one...');
      const hashedPassword = await bcrypt.hash('SuperAdmin123', 12);
      const newSuperAdmin = {
        name: 'Super Admin',
        email: 'superadmin@propertygpt.com',
        hashedPassword,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await usersCollection.insertOne(newSuperAdmin);
      console.log('Created SuperAdmin user:', result.insertedId.toString());
    } else {
      console.log('Found existing SuperAdmin user:', superAdmin._id.toString());
    }
    
    // Check if team member already exists
    const existingTeamMember = await teamMembersCollection.findOne({ email: 'superadmin@propertygpt.com' });
    
    if (existingTeamMember) {
      console.log('TeamMember already exists:', existingTeamMember._id.toString());
    } else {
      console.log('Creating TeamMember record...');
      const hashedPassword = await bcrypt.hash('SuperAdmin123', 12);
      const teamMember = {
        name: 'Super Admin',
        email: 'superadmin@propertygpt.com',
        hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await teamMembersCollection.insertOne(teamMember);
      console.log('Created TeamMember record:', result.insertedId.toString());
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
    console.log('Closed MongoDB connection');
  }
}

createSuperAdminTeamMember(); 