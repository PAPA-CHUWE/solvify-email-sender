import mongoose, { Schema, InferSchemaType } from "mongoose"

const LeadSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    phone: { type: String, required: true, trim: true },
    service: { type: String, required: true, trim: true },
    source: { type: String, trim: true, default: "website" },
    userAgent: { type: String, trim: true, default: "" },
    ip: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
)

export type Lead = InferSchemaType<typeof LeadSchema>

export default mongoose.models.Lead || mongoose.model("Lead", LeadSchema)
