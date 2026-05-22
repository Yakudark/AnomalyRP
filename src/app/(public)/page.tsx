"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Facebook,
  FileText,
  FolderOpen,
  Images,
  Home,
  Instagram,
  Link as LinkIcon,
  MessageCircle,
  Music2,
  ShieldCheck,
  ShoppingBag,
  X,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import heroImage from "@/lib/asset/anomalyRP.jpg";
import headerImage from "@/lib/asset/anomalyRP.png";
import { defaultSiteSettings, loadSiteSettings } from "@/lib/site-settings";
import { supabaseBrowser } from "@/lib/supabase-browser";

const rulesPages = [
  {
    title: "1. Respect et comportement",
    text: "Texte fictif du reglement. Remplacer cette section par les consignes officielles du serveur.",
  },
  {
    title: "2. Roleplay et coherence",
    text: "Texte fictif. Cette page pourra contenir plusieurs paragraphes, des images et des exemples.",
  },
  {
    title: "3. Sanctions",
    text: "Texte fictif. Ajouter ici les avertissements, exclusions temporaires et exclusions definitives.",
  },
];

const socialIconMap = {
  youtube: Youtube,
  tiktok: Music2,
  discord: MessageCircle,
  instagram: Instagram,
  facebook: Facebook,
  link: LinkIcon,
};

type SectionCard = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  order_index: number;
};

type ArticleCard = {
  id: string;
  section_id: string;
  parent_article_id: string | null;
};

type GalleryImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  object_position_x: number;
  object_position_y: number;
  order_index: number;
};

type GalleryResponse = {
  images?: GalleryImage[];
};

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("accueil");
  const [settings, setSettings] = useState(defaultSiteSettings);
  const [reglementSections, setReglementSections] = useState<SectionCard[]>([]);
  const [reglementArticles, setReglementArticles] = useState<ArticleCard[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const [galleryPage, setGalleryPage] = useState(0);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    loadSiteSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const syncTabFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (["accueil", "reglement", "galerie"].includes(hash)) {
        setActiveTab(hash);
      }
    };

    syncTabFromHash();
    window.addEventListener("hashchange", syncTabFromHash);
    return () => window.removeEventListener("hashchange", syncTabFromHash);
  }, []);

  useEffect(() => {
    async function loadReglementNavigation() {
      const [sectionsResult, articlesResult] = await Promise.all([
        supabaseBrowser
          .from("sections")
          .select("id, title, slug, description, order_index")
          .eq("is_visible", true)
          .order("order_index", { ascending: true }),
        supabaseBrowser
          .from("articles")
          .select("id, section_id, parent_article_id")
          .eq("is_published", true),
      ]);

      if (sectionsResult.data) {
        setReglementSections(sectionsResult.data as SectionCard[]);
      }

      if (articlesResult.data) {
        setReglementArticles(articlesResult.data as ArticleCard[]);
      }
    }

    loadReglementNavigation();
  }, []);

  useEffect(() => {
    async function loadGalleryImages() {
      const response = await fetch("/api/gallery", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as GalleryResponse | null;

      if (response.ok && payload?.images) {
        setGalleryImages(payload.images);
      }

      setGalleryLoaded(true);
    }

    loadGalleryImages();
  }, []);

  const galleryPageCount = Math.ceil(galleryImages.length / 9);
  const visibleGalleryImages = galleryImages.slice(galleryPage * 9, galleryPage * 9 + 9);

  const socialLinks = settings.socialLinks.filter((social) => social.is_visible);

  const scrollToTabs = () => {
    window.setTimeout(() => {
      document.getElementById("main-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const goToTab = (value: string) => {
    setActiveTab(value);
    window.history.replaceState(null, "", `#${value}`);
    scrollToTabs();
  };

  return (
    <div className="space-y-8">
      <section className="anomaly-panel anomaly-outline relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroImage}
            alt="Accueil Anomaly RP"
            fill
            priority
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.88),rgba(10,20,10,0.68),rgba(0,0,0,0.9))]" />
        </div>

        <div className="relative grid gap-8 px-6 py-8 md:grid-cols-[1.2fr_0.8fr] md:items-center md:px-10 md:py-10">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  Serveur{" "}
                  <Link
                    href="/admin/login"
                    className="text-primary no-underline"
                  >
                    roleplay
                  </Link>
                </p>
                <h1 className="text-3xl font-extrabold text-white md:text-5xl">
                  Anomaly RP
                </h1>
              </div>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[#d6ddd3] md:text-lg">
              Bienvenue dans Le Flux. Bienvenue sur Anomaly RP. Un serveur RP
              Whitelist +18 sur FiveM, pensé pour une immersion totale et une
              ambiance unique. Retrouve ici le règlement, les informations
              essentielles, des tutoriels et tout ce qu&apos;il faut pour rejoindre
              l&apos;expérience.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild onClick={() => goToTab("galerie")}>
                <a href="#galerie">Voir la galerie</a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white/15 bg-black/30 text-white hover:bg-white/10"
                onClick={() => goToTab("reglement")}
              >
                <a href="#reglement">Voir le reglement</a>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[220px] overflow-hidden md:max-w-[280px]">
            <div className="absolute inset-0">
              <Image
                src={headerImage}
                alt="Header Astral"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <Tabs
        id="main-tabs"
        value={activeTab}
        onValueChange={(value) => {
          goToTab(value);
        }}
        className="space-y-5"
      >
        <TabsList className="grid h-auto w-full grid-cols-2 gap-3 rounded-sm border border-primary/15 bg-[#081108]/80 p-2 shadow-[0_0_0_1px_rgba(66,233,62,0.08),0_12px_28px_rgba(0,0,0,0.35)] lg:grid-cols-4">
          <TabsTrigger
            value="accueil"
            className="h-12 rounded-sm border border-transparent text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_22px_rgba(66,233,62,0.22)] focus-visible:ring-2 focus-visible:ring-primary/70 data-[state=active]:border-primary data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-[0_0_18px_rgba(66,233,62,0.26)]"
          >
            <Home className="h-4 w-4" />
            Accueil
          </TabsTrigger>
          <TabsTrigger
            value="reglement"
            className="h-12 rounded-sm border border-transparent text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_22px_rgba(66,233,62,0.22)] focus-visible:ring-2 focus-visible:ring-primary/70 data-[state=active]:border-primary data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-[0_0_18px_rgba(66,233,62,0.26)]"
          >
            <BookOpen className="h-4 w-4" />
            Reglement
          </TabsTrigger>
          <TabsTrigger
            value="galerie"
            className="h-12 rounded-sm border border-transparent text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_22px_rgba(66,233,62,0.22)] focus-visible:ring-2 focus-visible:ring-primary/70 data-[state=active]:border-primary data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-[0_0_18px_rgba(66,233,62,0.26)]"
          >
            <Images className="h-4 w-4" />
            Galerie
          </TabsTrigger>
          <a
            href={settings.tebexUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-sm border border-transparent px-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_22px_rgba(66,233,62,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
          >
            <ShoppingBag className="h-4 w-4" />
            Boutique
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </TabsList>

        <TabsContent value="accueil" className="space-y-5">
          <section className="anomaly-panel-soft p-6">
            <h2 className="text-2xl font-bold text-white">
              {settings.homeTitle}
            </h2>
            <div
              className="prose prose-invert mt-5 max-w-none text-sm leading-7 text-muted-foreground
                prose-headings:text-white prose-h2:text-xl prose-h2:text-primary
                prose-p:text-muted-foreground prose-strong:text-white prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: settings.homeContent }}
            />
          </section>
        </TabsContent>

        <TabsContent value="reglement" id="reglement" className="space-y-5">
          <section className="anomaly-panel-soft p-6">
            <h2 className="text-2xl font-bold text-white">Règlement</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground"></p>
            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {reglementSections.length > 0
                ? reglementSections.map((section) => {
                    const rootArticleCount = reglementArticles.filter(
                      (article) =>
                        article.section_id === section.id &&
                        !article.parent_article_id,
                    ).length;

                    return (
                      <Link
                        key={section.id}
                        href={`/docs/${section.slug}`}
                        className="group block min-h-36 border border-white/10 bg-black/15 p-4 transition-colors hover:border-primary/40"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <FolderOpen className="h-6 w-6 shrink-0 text-primary" />
                          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                        </div>
                        <h3 className="mt-4 text-base font-semibold text-white transition-colors group-hover:text-primary">
                          {section.title}
                        </h3>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                          {section.description ||
                            "Voir les pages disponibles dans cette section."}
                        </p>
                        <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                          <FileText className="h-4 w-4" />
                          {rootArticleCount} lien
                          {rootArticleCount > 1 ? "s" : ""}
                        </div>
                      </Link>
                    );
                  })
                : rulesPages.map((page) => (
                    <article
                      key={page.title}
                      className="border border-white/10 bg-black/15 p-4"
                    >
                      <h3 className="text-lg font-semibold text-white">
                        {page.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {page.text}
                      </p>
                    </article>
                  ))}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="galerie" id="galerie" className="space-y-5">
          <section className="anomaly-panel-soft p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-white">Galerie</h2>
              {galleryPageCount > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-primary/25 bg-[#081108]/80 text-white hover:border-primary/70 hover:bg-primary/10 hover:text-primary"
                    onClick={() => setGalleryPage((current) => Math.max(current - 1, 0))}
                    disabled={galleryPage === 0}
                    aria-label="Images precedentes"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-16 text-center text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {galleryPage + 1} / {galleryPageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="border-primary/25 bg-[#081108]/80 text-white hover:border-primary/70 hover:bg-primary/10 hover:text-primary"
                    onClick={() => setGalleryPage((current) => Math.min(current + 1, galleryPageCount - 1))}
                    disabled={galleryPage >= galleryPageCount - 1}
                    aria-label="Images suivantes"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {!galleryLoaded ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="aspect-video animate-pulse border border-white/10 bg-white/5" />
                ))}
              </div>
            ) : visibleGalleryImages.length > 0 ? (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {visibleGalleryImages.map((image) => (
                  <button
                    type="button"
                    key={image.id}
                    className="group relative aspect-video overflow-hidden border border-primary/15 bg-black/20 shadow-[0_12px_28px_rgba(0,0,0,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                    onClick={() => setSelectedGalleryImage(image)}
                    aria-label={`Ouvrir ${image.alt_text || "image galerie"} en grand`}
                  >
                    <Image
                      src={image.image_url}
                      alt={image.alt_text || "Image galerie Anomaly"}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      style={{ objectPosition: `${image.object_position_x}% ${image.object_position_y}%` }}
                    />
                    <div className="absolute inset-0 opacity-0 ring-1 ring-inset ring-primary/40 transition-opacity group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-6 border border-dashed border-white/10 py-12 text-center text-muted-foreground">
                Aucune image visible pour le moment.
              </div>
            )}
          </section>
        </TabsContent>
      </Tabs>

      <footer className="anomaly-panel-soft p-6">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <Link
              href="/mentions-legales"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary hover:underline"
            >
              <ShieldCheck className="h-5 w-5 text-primary" />
              Mention légale
            </Link>
          </div>

          <div className="flex flex-wrap gap-4">
            {socialLinks.map((social) => {
              const SocialIcon =
                socialIconMap[social.icon as keyof typeof socialIconMap] ??
                LinkIcon;

              return (
                <Link
                  key={social.id ?? social.label}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="grid h-16 w-16 place-items-center rounded-sm border border-primary/25 bg-[#081108]/80 text-white shadow-[0_0_0_1px_rgba(66,233,62,0.08),0_12px_28px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/70 hover:bg-primary/10 hover:text-primary hover:shadow-[0_0_22px_rgba(66,233,62,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                >
                  <SocialIcon className="h-8 w-8" />
                </Link>
              );
            })}
          </div>
        </div>
      </footer>

      {selectedGalleryImage && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={selectedGalleryImage.alt_text || "Image galerie"}
          onClick={() => setSelectedGalleryImage(null)}
        >
          <div className="relative max-h-[92vh] w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            <Button
              type="button"
              size="icon"
              className="absolute right-3 top-3 z-10 border border-primary/30 bg-[#081108]/90 text-white hover:bg-primary/10 hover:text-primary"
              onClick={() => setSelectedGalleryImage(null)}
              aria-label="Fermer l'image"
            >
              <X className="h-5 w-5" />
            </Button>
            <div className="relative h-[82vh] overflow-hidden border border-primary/20 bg-black shadow-[0_0_35px_rgba(66,233,62,0.18)]">
              <Image
                src={selectedGalleryImage.image_url}
                alt={selectedGalleryImage.alt_text || "Image galerie Anomaly"}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
            {selectedGalleryImage.alt_text && (
              <p className="mt-3 text-center text-sm text-muted-foreground">{selectedGalleryImage.alt_text}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
