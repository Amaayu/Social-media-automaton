const mongoose = require('mongoose');

/**
 * MongoDB Database Configuration
 * Connects to MongoDB Atlas
 */
class Database {
  constructor() {
    this.connection = null;
  }

  /**
   * Connect to MongoDB Atlas
   */
  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI;

      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not set');
      }

      // Connection options (removed deprecated options)
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      this.connection = await mongoose.connect(mongoUri, options);

      console.log('✅ MongoDB connected successfully');
      console.log(`   Database: ${this.connection.connection.name}`);
      console.log(`   Host: ${this.connection.connection.host}`);

      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected');
      });

      return this.connection;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error.message);
      throw error;
    }
  }

  /**
   * Disconnect from MongoDB
   */
  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log('MongoDB disconnected');
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = new Database();
