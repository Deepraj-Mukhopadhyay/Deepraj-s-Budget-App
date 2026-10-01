const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const startTestDb = async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    return uri;
  } catch (error) {
    console.warn(`[Test DB Warning] MongoMemoryServer startup notice: ${error.message}`);
    // If MongoMemoryServer cannot download binary in current environment, try local or throw
    const fallbackUri = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/budget_app_test';
    try {
      await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 2000 });
      return fallbackUri;
    } catch (fallbackErr) {
      throw new Error(`Cannot connect to MongoDB test database: ${fallbackErr.message}`);
    }
  }
};

const stopTestDb = async () => {
  try {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  } catch (error) {
    console.error(`Error stopping test DB: ${error.message}`);
  }
};

const clearTestDb = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
};

module.exports = {
  startTestDb,
  stopTestDb,
  clearTestDb
};
