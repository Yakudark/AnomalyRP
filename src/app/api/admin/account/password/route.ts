import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/admin-auth";
import { createSupabaseAdminClient, createSupabaseClient } from "@/lib/supabase";

type ChangePasswordPayload = {
  currentPassword?: string;
  newPassword?: string;
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
    const user = await requireAuthenticatedUser(request);
    const payload = (await request.json()) as ChangePasswordPayload;
    const currentPassword = payload.currentPassword ?? "";
    const newPassword = payload.newPassword ?? "";

    if (!user.email) {
      return NextResponse.json({ error: "Email du compte admin introuvable." }, { status: 400 });
    }

    if (!currentPassword) {
      return NextResponse.json({ error: "Le mot de passe actuel est obligatoire." }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit contenir au moins 8 caracteres." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "Le nouveau mot de passe doit etre different de l'ancien." },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json({ error: "Le mot de passe actuel est incorrect." }, { status: 401 });
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const passwordChangedAt = new Date().toISOString();
    const userMetadata =
      typeof user.user_metadata === "object" && user.user_metadata !== null
        ? (user.user_metadata as Record<string, unknown>)
        : {};

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: newPassword,
      user_metadata: {
        ...userMetadata,
        password_changed_at: passwordChangedAt,
      },
    });

    if (updateError) throw updateError;

    return NextResponse.json({ ok: true, passwordChangedAt });
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
