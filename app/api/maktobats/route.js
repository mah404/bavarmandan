import { NextResponse } from "next/server";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const MaktobatSchema = new mongoose.Schema({
  title: String,
  content: String,
  pdf: Buffer,
  mimeType: String,
  audioUrl: String, // ✅ added audio support
});

let Maktobat;
try {
  Maktobat = mongoose.models.Maktobat || mongoose.model("Maktobat", MaktobatSchema);
} catch {
  Maktobat = mongoose.model("Maktobat", MaktobatSchema);
}

export async function GET() {
  await connectToDatabase();

  const maktobats = await Maktobat.find();

  const data = maktobats.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    content: doc.content,
    pdfUrl: `data:${doc.mimeType};base64,${doc.pdf.toString("base64")}`,
    audioUrl: doc.audioUrl || null, // ✅ added this
  }));

  return NextResponse.json(data);
}
