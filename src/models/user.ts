import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema({
  name:        { type: String, required: true },
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true },
  district:    { type: String },
  role:        { type: String, enum: ["citizen", "agent", "admin"], default: "citizen" },
  avatarUrl:   { type: String },
  reportsCount: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
