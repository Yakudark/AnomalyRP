"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Editor } from "@/components/editor/Editor";
import { defaultSiteSettings, loadSiteSettings, savePublicSettings, type SiteSettings } from "@/lib/site-settings";
import { uploadAdminImage } from "@/lib/upload-image";

export default function LegalSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLegalSettings = async () => {
    setLoading(true);
    setError(null);

    try {
      setSettings(await loadSiteSettings());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger les mentions legales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLegalSettings();
  }, []);

  const saveLegalText = async (rgpdText = settings.rgpdText) => {
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const nextSettings = { ...settings, rgpdText };
      await savePublicSettings(nextSettings);
      setSettings(nextSettings);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible d'enregistrer les mentions legales.");
    } finally {
      setSaving(false);
    }
  };

  const clearLegalText = async () => {
    if (!confirm("Supprimer le contenu des mentions legales ?")) return;
    await saveLegalText("");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">Administration</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Mentions legales</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Ajoutez, modifiez ou videz le texte affiche sur la page publique des mentions legales.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            onClick={loadLegalSettings}
            disabled={saving || loading}
          >
            <RotateCcw className="h-4 w-4" />
            Recharger
          </Button>
          <Button
            variant="outline"
            className="border-red-500/30 bg-red-500/10 text-red-200 hover:bg-red-500/20"
            onClick={clearLegalText}
            disabled={saving || loading || !settings.rgpdText.trim()}
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
          <Button onClick={() => saveLegalText()} className="bg-red-500 text-white hover:bg-red-600" disabled={saving || loading}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Enregistrer
          </Button>
        </div>
      </div>

      {loading && <div className="border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white">Chargement...</div>}
      {error && <div className="border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">{error}</div>}
      {saved && <div className="border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-300">Mentions legales enregistrees.</div>}

      <section className="border border-white/10 bg-[#111217] p-6 shadow-2xl">
        <div className="space-y-3">
          <Label htmlFor="legal-text" className="text-white">Texte des mentions legales</Label>
          <Editor
            content={settings.rgpdText || "<p></p>"}
            onChange={(rgpdText) => {
              setSettings((current) => ({ ...current, rgpdText }));
              setSaved(false);
            }}
            uploadImage={uploadAdminImage}
          />
        </div>
      </section>
    </div>
  );
}
