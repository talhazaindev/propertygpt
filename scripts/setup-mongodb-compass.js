const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to .env file
const envPath = path.resolve(process.cwd(), '.env');

// Check if .env exists
const envExists = fs.existsSync(envPath);

console.log('=== MongoDB Compass Connection Setup ===');

if (envExists) {
  console.log(`Found .env file at: ${envPath}`);
} else {
  console.log(`No .env file found. Will create one at: ${envPath}`);
}

rl.question(`
Please enter your MongoDB connection string from MongoDB Compass.
It should look like one of these:
- mongodb://localhost:27017/propertygpt
- mongodb+srv://<username>:<password>@<cluster>.mongodb.net/propertygpt

Connection string: `, (dbUrl) => {
  
  if (!dbUrl) {
    console.error('Error: No connection string provided');
    rl.close();
    return;
  }

  // Validate the connection string format
  if (!dbUrl.startsWith('mongodb://') && !dbUrl.startsWith('mongodb+srv://')) {
    console.error('Error: Invalid connection string format. It should start with "mongodb://" or "mongodb+srv://"');
    rl.close();
    return;
  }

  // Create or update the .env file
  let envContent = '';
  
  if (envExists) {
    // Read existing .env content
    envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if DATABASE_URL already exists in the file
    if (envContent.includes('DATABASE_URL=')) {
      // Replace the existing DATABASE_URL
      envContent = envContent.replace(/DATABASE_URL=.*(\r?\n|$)/g, `DATABASE_URL="${dbUrl}"$1`);
    } else {
      // Add DATABASE_URL to the file
      envContent += `\nDATABASE_URL="${dbUrl}"\n`;
    }
  } else {
    // Create a new .env file with the necessary variables
    envContent = `# MongoDB Connection\nDATABASE_URL="${dbUrl}"\n\n# NextAuth\nNEXTAUTH_SECRET="your-secret-key-here"\nNEXTAUTH_URL="http://localhost:3000"\n`;
  }
  
  // Write to .env file
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Successfully updated .env file with your MongoDB connection string.`);
  
  // Fix package.json dev script if needed
  console.log('\nChecking package.json scripts...');
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const packageJson = require(packageJsonPath);
    
    if (!packageJson.scripts || !packageJson.scripts.dev) {
      console.log('Adding "dev" script to package.json...');
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      packageJson.scripts.dev = "next dev";
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Added "dev" script to package.json');
    } else {
      console.log('✅ "dev" script already exists in package.json');
    }
  } catch (error) {
    console.error('Error updating package.json:', error.message);
  }
  
  console.log(`
=== Next Steps ===
1. Start your MongoDB instance or connect to MongoDB Atlas
2. Start your application with:
   npm run dev
3. Visit the admin login page at:
   http://localhost:3000/admin/login
4. If you need to create an admin user, run this command in MongoDB Compass:

db.User.insertOne({
  name: "Super Admin",
  email: "superadmin@propertygpt.com",
  hashedPassword: "$2b$12$k8Y1Vao0klPkGaLIBt7rQeulVsD5m5rUQAdXXRqjK4RA1NTeyXOKC", // This is 'SuperAdmin123'
  role: "ADMIN",
  createdAt: new Date(),
  updatedAt: new Date()
})
  `);
  
  rl.close();
}); 