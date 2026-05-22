import { supabaseBrowser } from "@/lib/supabase-browser";

export const uploadAdminImage = async (file: File) => {
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
