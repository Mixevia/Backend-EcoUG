import mongoose, { Schema, Document } from "mongoose";

// This defines what information an Alert must have
export interface IAlert extends Document {
  title: string;           // e.g., "Critical: Wildfire Detected"
  description: string;     // e.g., "Large fire spreading in Northern Gulu"
  type: "fire" | "flood" | "air_quality" | "deforestation" | "other";
  severity: "low" | "medium" | "high" | "critical";
  location: {
    district: string;      // e.g., "Gulu"
    coordinates?: [number, number]; // [Longitude, Latitude]
  };
  isActive: boolean;       // Is the danger still happening?
  createdAt: Date;
}

const AlertSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: { 
      type: String, 
      enum: ["fire", "flood", "air_quality", "deforestation", "other"], 
      required: true 
    },
    severity: { 
      type: String, 
      enum: ["low", "medium", "high", "critical"], 
      default: "medium" 
    },
    location: {
      district: { type: String, required: true },
      coordinates: { type: [Number], index: "2dsphere" }, // Allows map searching
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true } // Automatically adds 'createdAt' and 'updatedAt'
);

// This creates the "Alerts" collection in your MongoDB
export default mongoose.model<IAlert>("Alert", AlertSchema);