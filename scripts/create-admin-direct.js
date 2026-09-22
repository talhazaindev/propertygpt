const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Create a new Prisma client instance
const prisma = new PrismaClient();

async function createSuperAdmin() {
  console.log('Attempting to create super admin directly in database...');
  
  try {
    // Check if the admin user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: 'superadmin@propertygpt.com',
      },
    });

    if (existingUser) {
      console.log('Super admin already exists with email: superadmin@propertygpt.com');
      
      // Update the role to ADMIN if it's not already
      if (existingUser.role !== 'ADMIN') {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'ADMIN' },
        });
        console.log('Updated user role to ADMIN');
      }
      
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('SuperAdmin123', 12);

    // Create the admin user
    const user = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'superadmin@propertygpt.com',
        hashedPassword,
        role: 'ADMIN',
        phoneNumber: '03001234567',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('Super admin created successfully!');
    console.log('Email: superadmin@propertygpt.com');
    console.log('Password: SuperAdmin123');
  } catch (error) {
    console.error('Error creating super admin:');
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
createSuperAdmin(); 