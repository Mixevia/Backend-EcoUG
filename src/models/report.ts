import mongoose, { Schema } from "mongoose";

const ReportSchema = new Schema({
  type: {
    type: String,
    enum: ["deforestation", "wetland_drainage", "poaching", "fire", "flood", "pollution", "other"],
    required: true,
  },
  description: { type: String, required: true },
  location: {
    district:  { type: String, required: true },
    lat:       { type: Number },
    lng:       { type: Number },
    address:   { type: String },
  },
  photos:      [{ type: String }],            // Array of image URLs
  status:      { type: String, enum: ["pending", "verified", "resolved", "dismissed"], default: "pending" },
  severity:    { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
  reportedBy:  { type: Schema.Types.ObjectId, ref: "User", required: true },
  upvotes:     [{ type: Schema.Types.ObjectId, ref: "User" }],
  agentNotes:  { type: String },
}, { timestamps: true });

export default mongoose.model("Report", ReportSchema);