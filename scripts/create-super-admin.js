const axios = require('axios');

async function createSuperAdmin() {
  try {
    console.log('Creating super admin user...');
    console.log('Attempting to connect to: http://localhost:3000/api/register');
    
    const response = await axios.post('http://localhost:3000/api/register', {
      name: 'Super Admin',
      email: 'superadmin@propertygpt.com',
      password: 'SuperAdmin123', // Strong password
      phoneNumber: '03001234567'
    }, {
      timeout: 10000 // 10 second timeout
    });

    if (response.status === 200 || response.status === 201) {
      console.log('Super admin created successfully!');
      console.log('Email:', response.data.email);
      console.log('\nYou can now log in with:');
      console.log('Email: superadmin@propertygpt.com');
      console.log('Password: SuperAdmin123');
    } else {
      console.error('Failed to create super admin:', response.data.error);
    }
  } catch (error) {
    console.error('Error creating super admin:');
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Make sure your Next.js server is running with: npm run dev');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('Connection timed out. Server might be slow to respond.');
    } else if (error.response) {
      console.error('Server responded with error:', error.response.status);
      console.error('Error details:', error.response.data);
    } else if (error.request) {
      console.error('No response received from server.');
    } else {
      console.error('Error message:', error.message);
    }
    
    console.error('\nFull error:', error);
  }
}

createSuperAdmin(); 