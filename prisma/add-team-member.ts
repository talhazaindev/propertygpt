const { PrismaClient, TeamRole } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Admin user credentials
  const userEmail = 'superadmin@propertygpt.com'; 
  const name = 'Super Admin';
  const role = TeamRole.SUPER_ADMIN;
  const password = 'superadmin123';

  try {
    // Check if team member already exists
    const existingTeamMember = await prisma.teamMember.findUnique({
      where: {
        email: userEmail
      }
    });

    if (existingTeamMember) {
      console.log(`Team member with email ${userEmail} already exists.`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create team member
    const teamMember = await prisma.teamMember.create({
      data: {
        name,
        email: userEmail,
        role,
        hashedPassword,
        isActive: true
      }
    });

    console.log(`Team member created successfully with ID: ${teamMember.id}`);
  } catch (error) {
    console.error('Error creating team member:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 