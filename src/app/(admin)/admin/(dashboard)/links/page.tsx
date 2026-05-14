"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  defaultSiteSettings,
  loadSiteSettings,
  savePublicSettings,
  type SiteSettings,
  type SocialLinks,
} from "@/lib/site-settings";

const emptySocialLink = (): SocialLinks => ({
  label: "Nouveau reseau",
  url: "https://",
  icon: "link",
  is_visible: true,
});

const socialIconOptions = [
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "discord", label: "Discord" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "link", label: "Lien" },
];

export default function LinksSettingsPage() {
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
        setError(loadError instanceof Error ? loadError.message : "Impossible de charger les liens.");
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, []);

  const updateSocialLink = (socialIndex: number, socialLink: SocialLinks) => {
    setSettings((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((item, index) => (index === socialIndex ? socialLink : item)),
    }));
    setSaved(false);
  };

  const validateLinks = () => {
    if (!settings.tebexUrl.trim()) return "Le lien Tebex est obligatoire.";

    for (const [socialIndex, social] of settings.socialLinks.entries()) {
      if (!social.label.trim()) return `Le nom du reseau social ${socialIndex + 1} est vide.`;
      if (!social.url.trim()) return `Le lien du reseau social ${socialIndex + 1} est vide.`;
    }

    return null;
  };

  const saveLinks = async () => {
    const validationError = validateLinks();
    if (validationError) {
      setError(validationError);
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
      setError(saveError instanceof Error ? saveError.message : "Impossible d'enregistrer les liens.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">Administration</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Liens publics</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Gere le Tebex et les reseaux sociaux visibles en bas de page.
          </p>
        </div>

        <Button onClick={saveLinks} className="bg-red-500 text-white hover:bg-red-600" disabled={saving || loading}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer les liens
        </Button>
      </div>

      {loading && <div className="border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white">Chargement...</div>}
      {error && <div className="border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">{error}</div>}
      {saved && <div className="border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-300">Liens enregistres.</div>}

      <section className="border border-white/10 bg-[#111217] p-6 shadow-2xl">
        <div className="grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="tebex-url" className="text-white">Lien Tebex</Label>
            <Input
              id="tebex-url"
              value={settings.tebexUrl}
              onChange={(event) => {
                setSettings((current) => ({ ...current, tebexUrl: event.target.value }));
                setSaved(false);
              }}
              className="border-white/10 bg-black/20 text-white"
            />
          </div>

          <div className="space-y-4">
            {settings.socialLinks.map((social, socialIndex) => (
              <div key={social.id ?? `new-social-${socialIndex}`} className="border border-white/10 bg-black/20 p-4">
                <div className="grid gap-3 lg:grid-cols-[1fr_1.4fr_170px_44px_44px] lg:items-end">
                  <div className="space-y-2">
                    <Label htmlFor={`social-label-${socialIndex}`} className="text-white">Nom</Label>
                    <Input
                      id={`social-label-${socialIndex}`}
                      value={social.label}
                      onChange={(event) => updateSocialLink(socialIndex, { ...social, label: event.target.value })}
                      className="border-white/10 bg-black/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`social-url-${socialIndex}`} className="text-white">Lien</Label>
                    <Input
                      id={`social-url-${socialIndex}`}
                      value={social.url}
                      onChange={(event) => updateSocialLink(socialIndex, { ...social, url: event.target.value })}
                      className="border-white/10 bg-black/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`social-icon-${socialIndex}`} className="text-white">Icone</Label>
                    <select
                      id={`social-icon-${socialIndex}`}
                      value={social.icon}
                      onChange={(event) => updateSocialLink(socialIndex, { ...social, icon: event.target.value })}
                      className="flex h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 py-1 text-sm text-white outline-none"
                    >
                      {socialIconOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={social.is_visible ? "Masquer le reseau social" : "Afficher le reseau social"}
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => updateSocialLink(socialIndex, { ...social, is_visible: !social.is_visible })}
                  >
                    {social.is_visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Supprimer le reseau social"
                    className="text-muted-foreground hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => {
                      setSettings((current) => ({
                        ...current,
                        socialLinks: current.socialLinks.filter((_, index) => index !== socialIndex),
                      }));
                      setSaved(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() => {
                setSettings((current) => ({ ...current, socialLinks: [...current.socialLinks, emptySocialLink()] }));
                setSaved(false);
              }}
            >
              <Plus className="h-4 w-4" />
              Ajouter un reseau social
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
