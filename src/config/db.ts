// src/config/db.ts
import mongoose from 'mongoose';
 console.log("Available Env Keys:", Object.keys(process.env));

// Add 'export' right here:
export const connectDB = async () => { 
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in .env file");
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`DB connection failed: ${error}`);
    process.exit(1);
  }
};