const { PrismaClient } = require('@prisma/client');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting property repair process...');
    
    // First get an admin user to be the default owner
    let defaultOwner = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });
    
    if (!defaultOwner) {
      console.log('Creating a default admin user...');
      // Create a default admin user
      defaultOwner = await prisma.user.create({
        data: {
          name: 'Admin Owner',
          email: 'admin@propertygpt.com',
          hashedPassword: await bcrypt.hash('admin123', 12),
          role: 'ADMIN'
        }
      });
      console.log(`Created default admin with ID: ${defaultOwner.id}`);
    } else {
      console.log(`Using existing admin user: ${defaultOwner.name} (${defaultOwner.id})`);
    }
    
    // Connect directly to MongoDB to fix property issues
    console.log('Connecting to MongoDB to fix property issues...');
    
    // Get MongoDB client from Prisma
    const { db } = prisma._engine.client;
    const properties = db.collection('Property');
    
    // Find properties with owner relation issues
    const problemProperties = await properties.find({
      $or: [
        { ownerId: { $exists: false } },
        { ownerId: null }
      ]
    }).toArray();
    
    console.log(`Found ${problemProperties.length} properties with missing owner references`);
    
    // Fix each property
    let fixed = 0;
    for (const property of problemProperties) {
      await properties.updateOne(
        { _id: property._id },
        { $set: { ownerId: new ObjectId(defaultOwner.id) } }
      );
      fixed++;
      console.log(`Fixed property ${property.title || 'Untitled'} (${property._id})`);
    }
    
    console.log(`Repaired ${fixed} properties with missing owner references`);
    console.log('Repair process completed successfully!');
  } catch (error) {
    console.error('Error repairing properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 