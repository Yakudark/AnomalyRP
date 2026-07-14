import { supabaseBrowser } from "@/lib/supabase-browser";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/gif", "image/jpeg", "image/png", "image/webp"]);

export const uploadAdminImage = async (file: File) => {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Format non accepte. Utilisez une image GIF, JPG, PNG ou WebP.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("L'image depasse la taille maximale autorisee de 20 Mo.");
  }

  const { data } = await supabaseBrowser.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error("Session admin introuvable. Reconnecte-toi a l'administration.");
  }

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/uploads", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || "Impossible d'envoyer l'image.");
  }

  const payload = (await response.json()) as { url: string };
  return payload.url;
};
