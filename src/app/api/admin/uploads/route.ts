import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase";

const BUCKET = "site-images";
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

type UploadRequest = {
  fileName?: string;
  fileSize?: number;
  contentType?: string;
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const candidate = error as { message?: string; details?: string; hint?: string; code?: string };
    return [candidate.message, candidate.details, candidate.hint, candidate.code].filter(Boolean).join(" ");
  }
  return "Erreur inconnue.";
};

const sanitizeFileName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function POST(request: Request) {
  try {
    await requireAuthenticatedUser(request);

    const payload = (await request.json()) as UploadRequest;
    const fileName = payload.fileName?.trim();
    const fileSize = payload.fileSize;
    const contentType = payload.contentType;

    if (!fileName || typeof fileSize !== "number" || !contentType) {
      return NextResponse.json({ error: "Aucun fichier image fourni." }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: "Format non accepte. Utilisez une image GIF, JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "L'image depasse la taille maximale autorisee de 20 Mo." },
        { status: 413 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const extension = fileName.split(".").pop() || "jpg";
    const safeName = sanitizeFileName(fileName) || `image.${extension}`;
    const path = `home/${Date.now()}-${safeName}`;

    const { data: signedUpload, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path, { upsert: false });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({
      path: signedUpload.path,
      uploadToken: signedUpload.token,
      url: data.publicUrl,
    });
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
