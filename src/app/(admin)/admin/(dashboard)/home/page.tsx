"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Editor } from "@/components/editor/Editor";
import { defaultSiteSettings, loadSiteSettings, savePublicSettings, type SiteSettings } from "@/lib/site-settings";
import { uploadAdminImage } from "@/lib/upload-image";

export default function HomeSettingsPage() {
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
        setError(loadError instanceof Error ? loadError.message : "Impossible de charger l'accueil.");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const saveHome = async () => {
    if (!settings.homeTitle.trim()) {
      setError("Le titre d'accueil est obligatoire.");
      return;
    }

    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      await savePublicSettings(settings);
      setSettings(await loadSiteSettings());
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Impossible d'enregistrer l'accueil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">Administration</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Accueil</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Gere le titre et le contenu de la page d&apos;accueil. Les images s&apos;importent directement dans l&apos;editeur.
          </p>
        </div>

        <Button onClick={saveHome} className="bg-red-500 text-white hover:bg-red-600" disabled={saving || loading}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer l&apos;accueil
        </Button>
      </div>

      {loading && <div className="border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white">Chargement...</div>}
      {error && <div className="border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">{error}</div>}
      {saved && <div className="border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-300">Accueil enregistre.</div>}

      <section className="border border-white/10 bg-[#111217] p-6 shadow-2xl">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="home-title" className="text-white">Titre accueil</Label>
            <Input
              id="home-title"
              value={settings.homeTitle}
              onChange={(event) => {
                setSettings((current) => ({ ...current, homeTitle: event.target.value }));
                setSaved(false);
              }}
              className="border-white/10 bg-black/20 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Texte accueil</Label>
            <Editor
              content={settings.homeContent}
              onChange={(homeContent) => {
                setSettings((current) => ({ ...current, homeContent }));
                setSaved(false);
              }}
              uploadImage={uploadAdminImage}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
