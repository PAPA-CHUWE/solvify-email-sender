import mongoose from "mongoose"

export async function connectDB(uri: string) {
  if (!uri) throw new Error("MONGODB_URI is missing")

  if (mongoose.connection.readyState === 1) return mongoose

  await mongoose.connect(uri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10_000,
  })

  console.log("✅ MongoDB connected")
  return mongoose
}
