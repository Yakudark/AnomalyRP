"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  defaultSiteSettings,
  loadSiteSettings,
  saveQuestionnaireSettings,
  type QuestionnaireQuestion,
  type SiteSettings,
} from "@/lib/site-settings";

const emptyQuestion = (): QuestionnaireQuestion => ({
  question: "Nouvelle question",
  choices: ["Reponse 1", "Reponse 2", "Reponse 3"],
  answer: 0,
});

export default function QuestionnaireSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      setLoading(true);
      setError(null);

      try {
        setSettings(await loadSiteSettings());
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Impossible de charger le questionnaire.");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const updateQuestion = (questionIndex: number, question: QuestionnaireQuestion) => {
    setSettings((current) => ({
      ...current,
      questionnaire: current.questionnaire.map((item, index) => (index === questionIndex ? question : item)),
    }));
    setSaved(false);
  };

  const validateQuestionnaire = () => {
    if (settings.questionnaire.length === 0) return "Le questionnaire doit contenir au moins une question.";

    for (const [questionIndex, question] of settings.questionnaire.entries()) {
      if (!question.question.trim()) return `La question ${questionIndex + 1} est vide.`;
      if (question.choices.length < 2) return `La question ${questionIndex + 1} doit contenir au moins deux reponses.`;
      if (question.choices.some((choice) => !choice.trim())) return `La question ${questionIndex + 1} contient une reponse vide.`;
      if (question.answer < 0 || question.answer >= question.choices.length) {
        return `La bonne reponse de la question ${questionIndex + 1} est invalide.`;
      }
    }

    return null;
  };

  const saveQuestionnaire = async () => {
    const validationError = validateQuestionnaire();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await saveQuestionnaireSettings(settings.questionnaire);
      setSettings(await loadSiteSettings());
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible d'enregistrer le questionnaire.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">Administration</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Questionnaire QCM</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Gere les questions, reponses et bonnes reponses du QCM public.
          </p>
        </div>

        <Button onClick={saveQuestionnaire} className="bg-red-500 text-white hover:bg-red-600" disabled={saving || loading}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer le QCM
        </Button>
      </div>

      {loading && <div className="border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white">Chargement...</div>}
      {error && <div className="border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">{error}</div>}
      {saved && <div className="border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-300">Questionnaire enregistre.</div>}

      <section className="border border-white/10 bg-[#111217] p-6 shadow-2xl">
        <div className="space-y-5">
          {settings.questionnaire.map((question, questionIndex) => (
            <div key={question.id ?? `new-question-${questionIndex}`} className="border border-white/10 bg-black/20 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`question-${questionIndex}`} className="text-white">Question {questionIndex + 1}</Label>
                  <Textarea
                    id={`question-${questionIndex}`}
                    value={question.question}
                    onChange={(event) => updateQuestion(questionIndex, { ...question, question: event.target.value })}
                    className="min-h-20 border-white/10 bg-black/20 text-white"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Supprimer la question"
                  className="text-muted-foreground hover:bg-red-500/10 hover:text-red-300"
                  disabled={settings.questionnaire.length <= 1}
                  onClick={() => {
                    setSettings((current) => ({
                      ...current,
                      questionnaire: current.questionnaire.filter((_, index) => index !== questionIndex),
                    }));
                    setSaved(false);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="mt-4 grid gap-3">
                {question.choices.map((choice, choiceIndex) => (
                  <div key={`question-${question.id ?? questionIndex}-choice-${choiceIndex}`} className="grid gap-2 md:grid-cols-[1fr_170px_40px] md:items-end">
                    <div className="space-y-2">
                      <Label htmlFor={`question-${questionIndex}-choice-${choiceIndex}`} className="text-white">
                        Reponse {choiceIndex + 1}
                      </Label>
                      <Input
                        id={`question-${questionIndex}-choice-${choiceIndex}`}
                        value={choice}
                        onChange={(event) => {
                          const choices = question.choices.map((item, index) => index === choiceIndex ? event.target.value : item);
                          updateQuestion(questionIndex, { ...question, choices });
                        }}
                        className="border-white/10 bg-black/20 text-white"
                      />
                    </div>

                    <Button
                      variant={question.answer === choiceIndex ? "default" : "outline"}
                      className={question.answer === choiceIndex ? "bg-green-600 text-white hover:bg-green-700" : "border-white/10 bg-white/5 text-white hover:bg-white/10"}
                      onClick={() => updateQuestion(questionIndex, { ...question, answer: choiceIndex })}
                    >
                      Bonne reponse
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Supprimer la reponse"
                      className="text-muted-foreground hover:bg-red-500/10 hover:text-red-300"
                      disabled={question.choices.length <= 2}
                      onClick={() => {
                        const choices = question.choices.filter((_, index) => index !== choiceIndex);
                        const answer = Math.min(question.answer, choices.length - 1);
                        updateQuestion(questionIndex, { ...question, choices, answer });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                className="mt-4 border-white/10 bg-white/5 text-white hover:bg-white/10"
                onClick={() => updateQuestion(questionIndex, { ...question, choices: [...question.choices, "Nouvelle reponse"] })}
              >
                <Plus className="h-4 w-4" />
                Ajouter une reponse
              </Button>
            </div>
          ))}

          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={() => {
              setSettings((current) => ({ ...current, questionnaire: [...current.questionnaire, emptyQuestion()] }));
              setSaved(false);
            }}
          >
            <Plus className="h-4 w-4" />
            Ajouter une question
          </Button>
        </div>
      </section>
    </div>
  );
}
