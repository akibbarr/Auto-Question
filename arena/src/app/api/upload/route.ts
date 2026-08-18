import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file");

  if (!file || !(file instanceof File)) {
    return Response.json({ error: "ফাইল পাওয়া যায়নি" }, { status: 400 });
  }

  const ext = ALLOWED_EXT[file.type] ?? file.name.split(".").pop() ?? "png";
  const fileName = `${Date.now()}-${randomUUID()}.${ext}`;

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, fileName), buffer);

  return Response.json({ url: `/uploads/${fileName}` }, { status: 201 });
}
