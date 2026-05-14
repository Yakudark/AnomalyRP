import { createSupabaseClient } from "@/lib/supabase";

export async function requireAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    throw new Error("Session admin introuvable. Reconnecte-toi a l'administration.");
  }

  const supabase = createSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("Session admin invalide. Reconnecte-toi a l'administration.");
  }

  return data.user;
}
