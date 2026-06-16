import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const maxImageSize = 2 * 1024 * 1024;
const allowedPurposes = new Set(["logo", "favicon", "hero", "doctor"]);
const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml"]);

function extensionFromType(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  if (type === "image/svg+xml") return "svg";
  return "bin";
}

async function verifyAdmin(authorization: string | null) {
  if (!authorization?.startsWith("Bearer ")) return false;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
  const response = await fetch(`${apiUrl}/auth/me`, {
    headers: { Authorization: authorization },
    cache: "no-store"
  });

  if (!response.ok) return false;

  const payload = (await response.json()) as { data?: { role?: string; isActive?: boolean } };
  return payload.data?.role === "ADMIN" && payload.data.isActive !== false;
}

export async function POST(request: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { success: false, message: "Vercel Blob belum dikonfigurasi. Tambahkan BLOB_READ_WRITE_TOKEN di environment Vercel." },
      { status: 503 }
    );
  }

  const isAdmin = await verifyAdmin(request.headers.get("authorization"));
  if (!isAdmin) {
    return NextResponse.json({ success: false, message: "Hanya Admin yang boleh upload asset CMS." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const purpose = String(formData.get("purpose") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, message: "File gambar wajib diisi." }, { status: 422 });
  }

  if (!allowedPurposes.has(purpose)) {
    return NextResponse.json({ success: false, message: "Kategori upload tidak valid." }, { status: 422 });
  }

  if (!allowedMimeTypes.has(file.type)) {
    return NextResponse.json({ success: false, message: "Format gambar harus PNG, JPG, WebP, atau SVG." }, { status: 422 });
  }

  if (file.size > maxImageSize) {
    return NextResponse.json({ success: false, message: "Ukuran gambar maksimal 2MB." }, { status: 422 });
  }

  const now = new Date();
  const folder = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const extension = extensionFromType(file.type);
  const pathname = `clinic-cms/${purpose}/${folder}/${crypto.randomUUID()}.${extension}`;
  const blob = await put(pathname, file, {
    access: "public",
    addRandomSuffix: false
  });

  return NextResponse.json({
    success: true,
    data: {
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      contentType: file.type
    }
  });
}
