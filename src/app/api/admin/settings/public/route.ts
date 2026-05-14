import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase";

type SocialLinkPayload = {
  id?: string;
  label: string;
  url: string;
  icon: string;
  is_visible: boolean;
};

type PublicSettingsPayload = {
  homeTitle: string;
  homeContent: string;
  tebexUrl: string;
  rgpdText: string;
  cookieText: string;
  socialLinks: SocialLinkPayload[];
};

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const candidate = error as { message?: string; details?: string; hint?: string; code?: string };
    return [candidate.message, candidate.details, candidate.hint, candidate.code].filter(Boolean).join(" ");
  }
  return "Erreur inconnue.";
};

export async function POST(request: Request) {
  try {
    await requireAuthenticatedUser(request);

    const payload = (await request.json()) as PublicSettingsPayload;
    const supabase = createSupabaseAdminClient();

    const { error: settingsError } = await supabase.from("site_settings").upsert(
      {
        key: "main",
        home_title: payload.homeTitle,
        home_content: payload.homeContent,
        tebex_url: payload.tebexUrl,
        rgpd_text: payload.rgpdText,
        cookie_text: payload.cookieText,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );

    if (settingsError) throw settingsError;

    const socialIds = payload.socialLinks.map((social) => social.id).filter(Boolean);

    if (socialIds.length > 0) {
      const { error } = await supabase
        .from("social_links")
        .delete()
        .not("id", "in", `(${socialIds.join(",")})`);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("social_links")
        .delete()
        .neq("label", "__never_matching_social__");

      if (error) throw error;
    }

    const rows = payload.socialLinks.map((social, index) => ({
      id: social.id,
      label: social.label,
      url: social.url,
      icon: social.icon,
      is_visible: social.is_visible,
      order_index: index,
      updated_at: new Date().toISOString(),
    }));

    const existingRows = rows.filter((row) => row.id);
    const newRows = rows
      .filter((row) => !row.id)
      .map((row) => ({
        label: row.label,
        url: row.url,
        icon: row.icon,
        is_visible: row.is_visible,
        order_index: row.order_index,
        updated_at: row.updated_at,
      }));

    if (existingRows.length > 0) {
      const { error } = await supabase.from("social_links").upsert(existingRows, { onConflict: "id" });
      if (error) throw error;
    }

    if (newRows.length > 0) {
      const { error } = await supabase.from("social_links").insert(newRows);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
