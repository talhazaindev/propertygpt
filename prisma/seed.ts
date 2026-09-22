import { PrismaClient, TeamRole } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean up the database (optional)
  // Uncomment if you want to clean the database before seeding
  // await prisma.teamMember.deleteMany();
  // await prisma.city.deleteMany();

  // Create cities
  const cities = [
    { name: 'Lahore', province: 'Punjab' },
    { name: 'Karachi', province: 'Sindh' },
    { name: 'Islamabad', province: 'Federal Capital' },
    { name: 'Peshawar', province: 'KPK' },
    { name: 'Quetta', province: 'Balochistan' },
  ];

  console.log('Creating cities...');
  for (const city of cities) {
    const existingCity = await prisma.city.findUnique({
      where: { name: city.name }
    });

    if (!existingCity) {
      await prisma.city.create({
        data: city
      });
      console.log(`Created city: ${city.name}`);
    } else {
      console.log(`City ${city.name} already exists`);
    }
  }

  // Get the first city for reference
  const lahore = await prisma.city.findUnique({
    where: { name: 'Lahore' }
  });

  // Create team members
  const hashedPassword = await bcrypt.hash('Password123', 12);

  const teamMembers: Array<{
    name: string;
    email: string;
    hashedPassword: string;
    role: TeamRole;
    phoneNumber: string;
    isActive: boolean;
    city?: { connect: { id: string } };
  }> = [
    {
      name: 'Super Admin',
      email: 'superadmin@propertygpt.com',
      hashedPassword,
      role: TeamRole.SUPER_ADMIN,
      phoneNumber: '03001234567',
      isActive: true,
      ...(lahore?.id ? { city: { connect: { id: lahore.id } } } : {}),
    },
    {
      name: 'Area Manager',
      email: 'areamanager@propertygpt.com',
      hashedPassword,
      role: TeamRole.AREA_MANAGER,
      phoneNumber: '03001234568',
      isActive: true,
      ...(lahore?.id ? { city: { connect: { id: lahore.id } } } : {}),
    },
    {
      name: 'Property Verifier',
      email: 'verifier@propertygpt.com',
      hashedPassword,
      role: TeamRole.PROPERTY_VERIFIER,
      phoneNumber: '03001234569',
      isActive: true,
      ...(lahore?.id ? { city: { connect: { id: lahore.id } } } : {}),
    },
  ];

  console.log('Creating team members...');
  for (const member of teamMembers) {
    const existingMember = await prisma.teamMember.findUnique({
      where: { email: member.email },
    });

    if (!existingMember) {
      await prisma.teamMember.create({
        data: member,
      });
      console.log(`Created team member: ${member.name}`);
    } else {
      console.log(`Team member ${member.email} already exists`);
    }
  }

  // Create default admin user
  const adminEmail = 'admin@propertygpt.com';
  const existingAdmin = await prisma.teamMember.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    console.log('Creating default admin user...');
    const adminHashedPassword = await bcrypt.hash('admin123', 12);

    await prisma.teamMember.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        hashedPassword: adminHashedPassword,
        role: TeamRole.SUPER_ADMIN,
        isActive: true,
      },
    });

    console.log('Default admin user created');
  } else {
    console.log('Default admin user already exists');
  }

  console.log('Seed script completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error in seed script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 