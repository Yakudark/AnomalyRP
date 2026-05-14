import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/admin-auth";
import { createSupabaseAdminClient } from "@/lib/supabase";

type QuestionnairePayload = {
  questionnaire: {
    id?: string;
    question: string;
    choices: string[];
    answer: number;
  }[];
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

    const payload = (await request.json()) as QuestionnairePayload;
    const supabase = createSupabaseAdminClient();
    const questions = payload.questionnaire ?? [];
    const questionIds = questions.map((question) => question.id).filter(Boolean);

    if (questionIds.length > 0) {
      const { error } = await supabase
        .from("questionnaire_questions")
        .delete()
        .not("id", "in", `(${questionIds.join(",")})`);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("questionnaire_questions")
        .delete()
        .neq("question", "__never_matching_question__");

      if (error) throw error;
    }

    const rows = questions.map((question, index) => ({
      id: question.id,
      question: question.question,
      choices: question.choices,
      answer: question.answer,
      order_index: index,
      updated_at: new Date().toISOString(),
    }));

    const existingRows = rows.filter((row) => row.id);
    const newRows = rows
      .filter((row) => !row.id)
      .map((row) => ({
        question: row.question,
        choices: row.choices,
        answer: row.answer,
        order_index: row.order_index,
        updated_at: row.updated_at,
      }));

    if (existingRows.length > 0) {
      const { error } = await supabase.from("questionnaire_questions").upsert(existingRows, { onConflict: "id" });
      if (error) throw error;
    }

    if (newRows.length > 0) {
      const { error } = await supabase.from("questionnaire_questions").insert(newRows);
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }
}
