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

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Aucun fichier image fourni." }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Format non accepte. Utilisez une image GIF, JPG, PNG ou WebP." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "L'image depasse la taille maximale autorisee de 20 Mo." },
        { status: 413 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const extension = file.name.split(".").pop() || "jpg";
    const safeName = sanitizeFileName(file.name) || `image.${extension}`;
    const path = `home/${Date.now()}-${safeName}`;
    const bytes = await file.arrayBuffer();

    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ url: data.publicUrl });
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
