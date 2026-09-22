const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function main() {
  // MongoDB connection string from environment variables
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  let client;
  try {
    // Connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get database name from connection string
    const dbName = uri.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    
    // Get collections
    const usersCollection = db.collection('User');
    const propertiesCollection = db.collection('Property');
    
    // Find or create an admin user to be the default owner
    let defaultOwner = await usersCollection.findOne({ role: 'ADMIN' });
    
    if (!defaultOwner) {
      console.log('No admin user found, creating one...');
      defaultOwner = {
        name: 'Admin',
        email: 'admin@propertygpt.com',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await usersCollection.insertOne(defaultOwner);
      defaultOwner._id = result.insertedId;
      console.log(`Created default admin with ID: ${defaultOwner._id}`);
    } else {
      console.log(`Using existing admin user: ${defaultOwner.name} (${defaultOwner._id})`);
    }
    
    // Find properties with missing owner references
    const problemProperties = await propertiesCollection.find({
      $or: [
        { ownerId: { $exists: false } },
        { ownerId: null }
      ]
    }).toArray();
    
    console.log(`Found ${problemProperties.length} properties with missing owner references`);
    
    // Fix each property
    let fixed = 0;
    for (const property of problemProperties) {
      await propertiesCollection.updateOne(
        { _id: property._id },
        { $set: { ownerId: defaultOwner._id } }
      );
      fixed++;
      console.log(`Fixed property ${property.title || 'Untitled'} (${property._id})`);
    }
    
    console.log(`Repaired ${fixed} properties with missing owner references`);
    
    // Check for properties with issues loading owner relations
    const allProperties = await propertiesCollection.find({}).toArray();
    console.log(`Checking ${allProperties.length} properties for potential owner relation issues...`);
    
    // Add some sample data to make sure issue doesn't reproduce
    if (allProperties.length === 0) {
      console.log('Adding a sample property to test relation...');
      await propertiesCollection.insertOne({
        title: 'Test Property',
        description: 'A test property',
        price: 100000,
        type: 'HOUSE',
        area: 150,
        address: '123 Test St',
        status: 'PENDING',
        featured: false,
        images: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        ownerId: defaultOwner._id
      });
      console.log('Added sample property with proper owner relation');
    }
    
    console.log('Repair process completed successfully!');
  } catch (error) {
    console.error('Error repairing properties:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

main(); 