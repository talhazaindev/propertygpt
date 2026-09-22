import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('Starting property owner fix script...');

  // Find properties that might have invalid owner references
  const propertiesWithIssues = await prisma.property.findMany({
    where: {
      ownerId: {
        not: undefined
      }
    },
    include: {
      owner: true
    }
  });

  console.log(`Found ${propertiesWithIssues.length} properties to check`);

  // Count properties with missing owners
  const propertiesWithMissingOwners = propertiesWithIssues.filter(
    property => !property.owner
  );

  console.log(`Found ${propertiesWithMissingOwners.length} properties with missing owners`);

  if (propertiesWithMissingOwners.length === 0) {
    console.log('No properties with missing owners found. Everything looks good!');
    return;
  }

  // Find or create a default admin user to assign as owner
  let adminUser = await prisma.user.findFirst({
    where: {
      role: 'ADMIN'
    }
  });

  if (!adminUser) {
    console.log('No admin user found, creating a default admin...');
    adminUser = await prisma.user.create({
      data: {
        name: 'System Admin',
        email: 'admin@propertygpt.com',
        role: 'ADMIN',
      }
    });
  }

  console.log(`Will assign missing owners to admin user: ${adminUser.name} (${adminUser.id})`);

  // Update properties with missing owners
  for (const property of propertiesWithMissingOwners) {
    console.log(`Fixing property: ${property.id} - ${property.title}`);
    
    try {
      await prisma.property.update({
        where: {
          id: property.id
        },
        data: {
          ownerId: adminUser.id
        }
      });
      console.log(`✅ Successfully updated property owner`);
    } catch (error) {
      console.error(`❌ Failed to update property: ${property.id}`, error);
    }
  }

  console.log('Property owner fix script completed!');
}

main()
  .catch((e) => {
    console.error('Error in fix script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 