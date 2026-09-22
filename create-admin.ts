import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Create admin user
    const adminEmail = 'admin@example.com'
    const adminPassword = 'admin123'
    
    // Check if admin already exists
    const existingAdmin = await prisma.teamMember.findUnique({
      where: { email: adminEmail }
    })
    
    if (existingAdmin) {
      console.log('Admin user already exists')
      return
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    // Create user
    const admin = await prisma.teamMember.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        hashedPassword,
        role: 'SUPER_ADMIN',
        isActive: true
      }
    })
    
    console.log('Admin user created:', admin.id)
  } catch (error) {
    console.error('Error creating admin user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin() 