// Use CommonJS require instead of ESM import
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma Client
const prisma = new PrismaClient();

async function main() {
  console.log('Starting team member check script...');

  const email = process.argv[2];
  if (!email) {
    console.error('Please provide an email address as an argument');
    console.log('Usage: npm run check-team-member your-email@example.com');
    process.exit(1);
  }

  console.log(`Checking for team member with email: ${email}`);

  try {
    // Check if the team member exists
    const teamMember = await prisma.teamMember.findUnique({
      where: { email }
    });

    if (teamMember) {
      console.log('✅ Team member found:');
      console.log(`ID: ${teamMember.id}`);
      console.log(`Name: ${teamMember.name}`);
      console.log(`Role: ${teamMember.role}`);
      console.log(`Is Active: ${teamMember.isActive}`);
    } else {
      console.log('❌ No team member found with this email.');
      
      // Check if the user exists in the User table
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (user) {
        console.log('📌 User found in User table:');
        console.log(`ID: ${user.id}`);
        console.log(`Name: ${user.name}`);
        console.log(`Role: ${user.role}`);
        
        // Suggest creating a team member
        console.log('\n👉 To create a team member for this user, run:');
        console.log(`npm run create-team-member ${email}`);
      } else {
        console.log('❌ No user found with this email either.');
      }
    }

    // List all team members
    console.log('\n📋 All team members:');
    const allTeamMembers = await prisma.teamMember.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (allTeamMembers.length === 0) {
      console.log('No team members found in the database.');
    } else {
      allTeamMembers.forEach(member => {
        console.log(`- ${member.name} (${member.email}) - ${member.role} - ${member.isActive ? 'Active' : 'Inactive'}`);
      });
    }
  } catch (error) {
    console.error('Error checking team member:', error);
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