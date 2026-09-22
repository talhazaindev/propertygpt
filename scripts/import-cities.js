const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Path to the CSV file
const csvFilePath = path.join(__dirname, '../data/pakistan-cities.csv');

async function importCities() {
  console.log('Starting city import...');
  
  try {
    // Read the CSV file
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    
    // Parse the CSV data
    parse(fileContent, {
      columns: true,
      trim: true,
    }, async (err, records) => {
      if (err) {
        console.error('Error parsing CSV:', err);
        return;
      }
      
      console.log(`Found ${records.length} cities to import.`);
      
      // Process each record
      for (const record of records) {
        try {
          // Check if city already exists
          const existingCity = await prisma.city.findUnique({
            where: { name: record.name },
          });
          
          if (!existingCity) {
            // Create the city if it doesn't exist
            await prisma.city.create({
              data: {
                name: record.name,
                province: record.province,
              },
            });
            console.log(`Created city: ${record.name}, ${record.province}`);
          } else {
            console.log(`City already exists: ${record.name}`);
          }
        } catch (cityError) {
          console.error(`Error processing city ${record.name}:`, cityError);
        }
      }
      
      console.log('City import completed.');
      
      // Disconnect from the database
      await prisma.$disconnect();
    });
  } catch (error) {
    console.error('Error importing cities:', error);
    await prisma.$disconnect();
  }
}

// Run the import
importCities().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
}); 