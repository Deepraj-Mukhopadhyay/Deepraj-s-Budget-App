const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/budget_app';

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of hanging indefinitely
    });

    console.log(`[Database] MongoDB Connected: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    console.error(`[Database Tip] Check if your local MongoDB server is running, or verify your MONGODB_URI in backend/.env`);
    
    // In production or when strictly required, exit with failure
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    
    // In development mode, throw the error so server can handle or report gracefully
    throw error;
  }
};

/**
 * Disconnect from MongoDB database (for clean shutdown / testing)
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB Disconnected successfully.');
  } catch (error) {
    console.error(`[Database Error] Error disconnecting: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB
};
