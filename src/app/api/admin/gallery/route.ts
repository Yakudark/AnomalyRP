import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase";

type GalleryImagePayload = {
  id?: string;
  imageUrl?: string;
  altText?: string;
  isVisible?: boolean;
  orderIndex?: number;
  objectPositionX?: number;
  objectPositionY?: number;
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const candidate = error as { message?: string; details?: string; hint?: string; code?: string };
    return [candidate.message, candidate.details, candidate.hint, candidate.code].filter(Boolean).join(" ");
  }
  return "Erreur inconnue.";
};

export async function GET(request: Request) {
  try {
    await requireAuthenticatedUser(request);
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("gallery_images")
      .select("id, image_url, alt_text, object_position_x, object_position_y, is_visible, order_index, created_at")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ images: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAuthenticatedUser(request);
    const payload = (await request.json()) as GalleryImagePayload;

    if (!payload.imageUrl?.trim()) {
      return NextResponse.json({ error: "L'image est obligatoire." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("gallery_images").insert({
      image_url: payload.imageUrl,
      alt_text: payload.altText || null,
      object_position_x: payload.objectPositionX ?? 50,
      object_position_y: payload.objectPositionY ?? 50,
      is_visible: payload.isVisible ?? true,
      order_index: payload.orderIndex ?? 0,
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAuthenticatedUser(request);
    const payload = (await request.json()) as GalleryImagePayload;

    if (!payload.id) {
      return NextResponse.json({ error: "ID image manquant." }, { status: 400 });
    }

    const update: Record<string, string | number | boolean | null> = {
      updated_at: new Date().toISOString(),
    };

    if (payload.altText !== undefined) update.alt_text = payload.altText || null;
    if (payload.isVisible !== undefined) update.is_visible = payload.isVisible;
    if (payload.orderIndex !== undefined) update.order_index = payload.orderIndex;
    if (payload.objectPositionX !== undefined) update.object_position_x = payload.objectPositionX;
    if (payload.objectPositionY !== undefined) update.object_position_y = payload.objectPositionY;

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("gallery_images").update(update).eq("id", payload.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAuthenticatedUser(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID image manquant." }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("gallery_images").delete().eq("id", id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
