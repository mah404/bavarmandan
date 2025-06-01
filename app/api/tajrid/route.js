import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGODB_URI);
  }
};

const KashfolmoradSchema = new mongoose.Schema({
  title: String,
  content: String,
  pdf: Buffer,
  mimeType: String,
});

const Kashfolmorad = mongoose.models.Kashfolmorad || mongoose.model("Kashfolmorad", KashfolmoradSchema);

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();

    const items = await Kashfolmorad.find();

    const formatted = items.map((item, index) => ({
      id: `tajrid-${index}`,
      title: item.title,
      content: item.content,
      pdfUrl: `data:${item.mimeType};base64,${item.pdf.toString("base64")}`,
    }));

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to load Tajrid data." }), {
      status: 500,
    });
  }
}
