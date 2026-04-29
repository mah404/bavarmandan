import { NextResponse } from "next/server";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
    if (!MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined");
    }

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
    audioUrl: String,
});

const Maktobat =
    mongoose.models.Maktobat || mongoose.model("Maktobat", MaktobatSchema);

export async function GET() {
    try {
        await connectToDatabase();

        const maktobats = await Maktobat.find();

        const data = maktobats.map((doc) => ({
            id: doc._id.toString(),
            title: doc.title,
            content: doc.content,
            pdfUrl: doc.pdf && doc.mimeType ?
                `data:${doc.mimeType};base64,${doc.pdf.toString("base64")}` :
                null,
            audioUrl: doc.audioUrl || null,
        }));

        return NextResponse.json(data);
    } catch (error) {
        console.error("GET /api/maktobats error:", error);

        return NextResponse.json({ error: "Failed to fetch maktobats" }, { status: 500 });
    }
}