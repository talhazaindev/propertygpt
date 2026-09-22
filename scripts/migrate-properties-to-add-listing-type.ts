import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration: Adding listingType to existing properties...');
  
  try {
    // Get count of properties without listingType
    const countWithoutListingType = await prisma.property.count({
      where: {
        // @ts-ignore - This is intentional as we're checking for missing field
        listingType: null
      }
    });
    
    console.log(`Found ${countWithoutListingType} properties without a listingType.`);
    
    if (countWithoutListingType > 0) {
      // Update all properties without listingType to have SALE as the default
      const result = await prisma.property.updateMany({
        where: {
          // @ts-ignore - This is intentional as we're checking for missing field
          listingType: null
        },
        data: {
          listingType: 'SALE'
        }
      });
      
      console.log(`Updated ${result.count} properties with default listingType SALE.`);
    } else {
      console.log('No properties need updating.');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 