const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('Starting create team member script...');

  const email = process.argv[2];
  if (!email) {
    console.error('Please provide an email address as an argument');
    console.log('Usage: npm run create-team-member your-email@example.com');
    process.exit(1);
  }

  console.log(`Creating team member with email: ${email}`);

  try {
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log(`❌ No user found with email: ${email}`);
      console.log('Please create a user first or check the email address.');
      return;
    }

    // Check if a team member already exists with this email
    const existingTeamMember = await prisma.teamMember.findUnique({
      where: { email }
    });

    if (existingTeamMember) {
      console.log(`⚠️ Team member already exists with email: ${email}`);
      console.log(`ID: ${existingTeamMember.id}`);
      console.log(`Name: ${existingTeamMember.name}`);
      console.log(`Role: ${existingTeamMember.role}`);
      return;
    }

    // Create a default password
    const defaultPassword = 'PropertyGPT@2024';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create the team member
    const teamMember = await prisma.teamMember.create({
      data: {
        name: user.name || 'Team Member',
        email: user.email,
        hashedPassword,
        role: 'PROPERTY_VERIFIER',
        isActive: true
      }
    });

    console.log('✅ Team member created successfully:');
    console.log(`ID: ${teamMember.id}`);
    console.log(`Name: ${teamMember.name}`);
    console.log(`Email: ${teamMember.email}`);
    console.log(`Role: ${teamMember.role}`);
    console.log(`Password: ${defaultPassword} (please change this after first login)`);

  } catch (error) {
    console.error('Error creating team member:', error);
  }
}

main()
  .catch((e) => {
    console.error('Error in script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 