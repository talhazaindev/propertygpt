const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Find all properties that might have issues
    console.log('Checking for properties without owners...');
    
    let defaultOwnerId;
    
    // First, get a default owner to assign to properties with missing owners
    const defaultOwner = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });
    
    if (!defaultOwner) {
      console.log('No admin user found to use as default owner. Creating one...');
      // Create a default admin user if none exists
      const newOwner = await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@propertygpt.com',
          hashedPassword: await require('bcrypt').hash('admin123', 12),
          role: 'ADMIN'
        }
      });
      console.log(`Created default admin user with ID: ${newOwner.id}`);
      defaultOwnerId = newOwner.id;
    } else {
      defaultOwnerId = defaultOwner.id;
      console.log(`Using existing admin user with ID: ${defaultOwnerId}`);
    }
    
    // Find properties with missing owners (MongoDB approach)
    const propertiesWithIssues = await prisma.property.findMany({
      where: {
        ownerId: null
      },
      select: {
        id: true,
        title: true
      }
    });
    
    console.log(`Found ${propertiesWithIssues.length} properties with missing owner references.`);
    
    // Update properties with null owner
    if (propertiesWithIssues.length > 0) {
      for (const prop of propertiesWithIssues) {
        await prisma.property.update({
          where: { id: prop.id },
          data: { ownerId: defaultOwnerId }
        });
        console.log(`Fixed property "${prop.title}" (${prop.id}) - assigned to default owner`);
      }
      console.log(`Updated ${propertiesWithIssues.length} properties with missing owners.`);
    }
    
    console.log('Property data repair completed!');
  } catch (error) {
    console.error('Error fixing properties:', error);
    if (error instanceof Error) {
      console.error(error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main(); 