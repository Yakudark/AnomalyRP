"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Cookie,
  ExternalLink,
  Facebook,
  FileText,
  FolderOpen,
  Home,
  Instagram,
  Link as LinkIcon,
  MessageCircle,
  Music2,
  ScrollText,
  ShieldCheck,
  ShoppingBag,
  XCircle,
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

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("accueil");
  const [settings, setSettings] = useState(defaultSiteSettings);
  const [reglementSections, setReglementSections] = useState<SectionCard[]>([]);
  const [reglementArticles, setReglementArticles] = useState<ArticleCard[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  const score = useMemo(
    () => settings.questionnaire.reduce((total, question, index) => total + (answers[index] === question.answer ? 1 : 0), 0),
    [answers, settings.questionnaire]
  );

  useEffect(() => {
    loadSiteSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setShowCookieBanner(localStorage.getItem("astral-cookie-consent") !== "accepted");
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const syncTabFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (["accueil", "reglement", "questionnaire", "tebex"].includes(hash)) {
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
          .eq("category", "reglement")
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

  const socialLinks = settings.socialLinks.filter((social) => social.is_visible);

  const acceptCookies = () => {
    localStorage.setItem("astral-cookie-consent", "accepted");
    setShowCookieBanner(false);
  };

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
          <Image src={heroImage} alt="Accueil Anomaly RP" fill priority className="object-cover opacity-35" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.88),rgba(10,20,10,0.68),rgba(0,0,0,0.9))]" />
        </div>

        <div className="relative grid gap-8 px-6 py-8 md:grid-cols-[1.2fr_0.8fr] md:items-center md:px-10 md:py-10">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
                  Serveur{" "}
                  <Link href="/admin/login" className="text-primary no-underline">
                    roleplay
                  </Link>
                </p>
                <h1 className="text-3xl font-extrabold text-white md:text-5xl">Anomaly RP</h1>
              </div>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[#d6ddd3] md:text-lg">
              Page principale fictive prete a completer avec les images, le reglement, le questionnaire, Tebex,
              le RGPD et le bandeau cookies officiels.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild onClick={() => goToTab("questionnaire")}>
                <a href="#questionnaire">Faire le questionnaire</a>
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
        <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-sm border border-white/10 bg-[#1d1a1a] p-2 lg:grid-cols-4">
          <TabsTrigger value="accueil" className="h-11 rounded-sm data-[state=active]:border-primary data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-none">
            <Home className="h-4 w-4" />
            Accueil
          </TabsTrigger>
          <TabsTrigger value="reglement" className="h-11 rounded-sm data-[state=active]:border-primary data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-none">
            <BookOpen className="h-4 w-4" />
            Reglement
          </TabsTrigger>
          <TabsTrigger value="questionnaire" className="h-11 rounded-sm data-[state=active]:border-primary data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-none">
            <ScrollText className="h-4 w-4" />
            Questionnaire
          </TabsTrigger>
          <TabsTrigger value="tebex" className="h-11 rounded-sm data-[state=active]:border-primary data-[state=active]:!bg-primary data-[state=active]:!text-primary-foreground data-[state=active]:shadow-none">
            <ShoppingBag className="h-4 w-4" />
            Tebex
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accueil" className="space-y-5">
          <section className="anomaly-panel-soft p-6">
            <h2 className="text-2xl font-bold text-white">{settings.homeTitle}</h2>
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
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {reglementSections.length > 0 ? (
                reglementSections.map((section) => {
                  const rootArticleCount = reglementArticles.filter(
                    (article) => article.section_id === section.id && !article.parent_article_id
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
                        {section.description || "Voir les pages disponibles dans cette section."}
                      </p>
                      <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                        <FileText className="h-4 w-4" />
                        {rootArticleCount} lien{rootArticleCount > 1 ? "s" : ""}
                      </div>
                    </Link>
                  );
                })
              ) : (
                rulesPages.map((page) => (
                  <article key={page.title} className="border border-white/10 bg-black/15 p-4">
                    <h3 className="text-lg font-semibold text-white">{page.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{page.text}</p>
                  </article>
                ))
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="questionnaire" id="questionnaire" className="space-y-5">
          <section className="anomaly-panel-soft p-6">
            <h2 className="text-2xl font-bold text-white">Questionnaire QCM</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
             
            </p>

            <div className="mt-6 space-y-5">
              {settings.questionnaire.map((question, questionIndex) => (
                <fieldset key={question.question} className="border border-white/10 bg-black/15 p-4">
                  <legend className="px-1 text-sm font-semibold text-white">{question.question}</legend>
                  <div className="mt-4 space-y-3">
                    {question.choices.map((choice, choiceIndex) => {
                      const isSelected = answers[questionIndex] === choiceIndex;
                      const isCorrect = question.answer === choiceIndex;
                      const showState = submitted && isSelected;

                      return (
                        <label
                          key={choice}
                          className="flex cursor-pointer items-center justify-between gap-3 border border-white/10 bg-[#171414] px-3 py-3 text-sm text-white hover:border-primary/40"
                        >
                          <span className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`question-${questionIndex}`}
                              checked={isSelected}
                              onChange={() => setAnswers((current) => ({ ...current, [questionIndex]: choiceIndex }))}
                              className="h-4 w-4 accent-primary"
                            />
                            {choice}
                          </span>
                          {showState && (
                            isCorrect ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <XCircle className="h-5 w-5 text-red-400" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button onClick={() => setSubmitted(true)}>Valider automatiquement</Button>
              <Button
                variant="outline"
                className="border-white/15 bg-black/20 text-white hover:bg-white/10"
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                }}
              >
                Recommencer
              </Button>
              {submitted && (
                <p className="text-sm font-semibold text-white">
                  Score : {score} / {settings.questionnaire.length}
                </p>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="tebex" className="space-y-5">
          <section className="anomaly-panel-soft p-6">
            <h2 className="text-2xl font-bold text-white">Tebex</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
            </p>
            <Button asChild className="mt-6">
              <a href={settings.tebexUrl} target="_blank" rel="noreferrer">
                Ouvrir la boutique fictive
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </section>
        </TabsContent>
      </Tabs>

      <footer className="anomaly-panel-soft p-6">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-white">
              <ShieldCheck className="h-5 w-5 text-primary" />
              RGPD et confidentialite
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted-foreground">
              {settings.rgpdText}
            </p>
          </div>

          <div className="flex gap-2">
            {socialLinks.map((social) => {
              const SocialIcon = socialIconMap[social.icon as keyof typeof socialIconMap] ?? LinkIcon;

              return (
              <Link
                key={social.id ?? social.label}
                href={social.url}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                className="grid h-10 w-10 place-items-center border border-white/10 bg-black/20 text-white transition-colors hover:border-primary/50 hover:text-primary"
              >
                <SocialIcon className="h-5 w-5" />
              </Link>
              );
            })}
          </div>
        </div>
      </footer>

      {showCookieBanner && (
        <div className="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-5xl border border-white/10 bg-[#1d1a1a] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-3">
              <Cookie className="mt-1 h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-semibold text-white">Bandeau cookies fictif</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {settings.cookieText}
                </p>
              </div>
            </div>
            <Button onClick={acceptCookies} className="md:shrink-0">Accepter</Button>
          </div>
        </div>
      )}
    </div>
  );
}
