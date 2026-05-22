import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase";

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const candidate = error as { message?: string; details?: string; hint?: string; code?: string };
    return [candidate.message, candidate.details, candidate.hint, candidate.code].filter(Boolean).join(" ");
  }
  return "Erreur inconnue.";
};

export async function GET() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("gallery_images")
      .select("id, image_url, alt_text, object_position_x, object_position_y, order_index")
      .eq("is_visible", true)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ images: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
