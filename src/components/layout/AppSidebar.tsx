"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, FileText, Home, Map as MapIcon, Shield, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { createSupabaseClient } from "@/lib/supabase";
import type { Section } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import logoImage from "@/lib/asset/anomaly_logo.png";

type Article = {
  id: string;
  title: string;
  slug: string;
  section_id: string;
  parent_article_id: string | null;
  subArticles?: Article[];
};

type CategoryConfig = {
  key: string;
  title: string;
  icon: LucideIcon;
  colorClass: string;
  sections: Section[];
};

type PanelState = string | "__closed__" | null;

const ArticleLink = ({
  article,
  sectionSlug,
  pathname,
  onNavigate,
  resetKey,
  level = 0,
}: {
  article: Article;
  sectionSlug: string;
  pathname: string | null;
  onNavigate: () => void;
  resetKey: number;
  level?: number;
}) => {
  const articlePath = `/docs/${sectionSlug}/${article.slug}`;
  const isActive = pathname === articlePath;
  const hasSubArticles = Boolean(article.subArticles?.length);
  const isForcedOpen = Boolean(
    hasSubArticles && article.subArticles?.some((sub) => pathname === `/docs/${sectionSlug}/${sub.slug}`)
  );
  const [manualOpen, setManualOpen] = useState(false);
  const isOpen = isForcedOpen || manualOpen;

  return (
    <div>
      <div className="flex items-center gap-1">
        {hasSubArticles && (
          <button onClick={() => setManualOpen(!isOpen)} className="rounded p-1 transition-colors hover:bg-white/5">
            <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", isOpen ? "" : "-rotate-90")} />
          </button>
        )}

        <Link
          href={articlePath}
          onClick={onNavigate}
          className={cn(
            "flex flex-1 items-center gap-2 border-l border-white/10 px-3 py-1.5 text-xs font-medium transition-all duration-200",
            level > 0 && "ml-4",
            !hasSubArticles && "ml-5",
            isActive
              ? "border-l-primary bg-primary/10 text-white"
              : "text-muted-foreground hover:border-l-primary/40 hover:bg-white/5 hover:text-white"
          )}
        >
          <FileText className={cn("h-3 w-3 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
          <span className="flex-1 truncate">{article.title}</span>
          {isActive && <ChevronRight className="h-3 w-3 shrink-0 text-primary" />}
        </Link>
      </div>

      {hasSubArticles && isOpen && (
        <div className="ml-2 mt-0.5 space-y-0.5">
          {article.subArticles!.map((subArticle) => (
            <ArticleLink
              key={`${subArticle.id}-${resetKey}`}
              article={subArticle}
              sectionSlug={sectionSlug}
              pathname={pathname}
              onNavigate={onNavigate}
              resetKey={resetKey}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function AppSidebar() {
  const pathname = usePathname();
  const [sections, setSections] = useState<Section[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualCategoryKey, setManualCategoryKey] = useState<PanelState>(null);
  const [manualSectionId, setManualSectionId] = useState<PanelState>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    async function fetchData() {
      const supabase = createSupabaseClient();

      const [sectionsRes, articlesRes] = await Promise.all([
        supabase.from("sections").select("*").order("order_index", { ascending: true }),
        supabase
          .from("articles")
          .select("id, title, slug, section_id, parent_article_id, order_index")
          .eq("is_published", true)
          .order("order_index", { ascending: true }),
      ]);

      if (sectionsRes.data) {
        setSections(sectionsRes.data as Section[]);
      }

      if (articlesRes.data) {
        const articlesMap = new Map<string, Article>();
        const rootArticles: Article[] = [];

        articlesRes.data.forEach((article) => {
          articlesMap.set(article.id, { ...article, subArticles: [] });
        });

        articlesMap.forEach((article) => {
          if (article.parent_article_id) {
            const parent = articlesMap.get(article.parent_article_id);
            if (parent) {
              parent.subArticles!.push(article);
            }
          } else {
            rootArticles.push(article);
          }
        });

        setArticles(rootArticles);
      }

      setLoading(false);
    }

    fetchData();
  }, []);

  const categories = useMemo<CategoryConfig[]>(
    () => [
      {
        key: "reglement",
        title: "Règlement",
        icon: BookOpen,
        colorClass: "text-primary",
        sections: sections.filter((s) => s.category === "reglement"),
      },
      {
        key: "rp",
        title: "Documents RP",
        icon: Shield,
        colorClass: "text-white",
        sections: sections.filter((s) => s.category === "rp"),
      },
      {
        key: "guide",
        title: "Guides & Aide",
        icon: MapIcon,
        colorClass: "text-white",
        sections: sections.filter((s) => s.category === "guide"),
      },
    ],
    [sections]
  );

  const currentSectionSlug = pathname?.split("/")[2] ?? null;
  const matchedCategoryKey =
    categories.find((category) => category.sections.some((section) => section.slug === currentSectionSlug))?.key ?? null;

  const activeCategoryKey =
    manualCategoryKey === "__closed__" ? null : manualCategoryKey ?? matchedCategoryKey;
  const activeCategory = categories.find((category) => category.key === activeCategoryKey) ?? null;

  const matchedSectionId =
    activeCategory?.sections.find((section) => section.slug === currentSectionSlug)?.id ?? null;

  const activeSectionId =
    manualSectionId === "__closed__"
      ? null
      : manualSectionId && activeCategory?.sections.some((section) => section.id === manualSectionId)
        ? manualSectionId
        : matchedSectionId;

  const activeSection = activeCategory?.sections.find((section) => section.id === activeSectionId) ?? null;
  const activeSectionArticles = activeSection
    ? articles.filter((article) => article.section_id === activeSection.id && !article.parent_article_id)
    : [];

  const closeAllPanels = () => {
    setManualCategoryKey("__closed__");
    setManualSectionId("__closed__");
    setResetKey((current) => current + 1);
  };

  return (
    <aside className="relative z-50 hidden w-72 shrink-0 md:block">
      <div className="sticky top-8">
        <div className="anomaly-panel overflow-hidden">
          <div className="border-b border-white/10 px-5 py-4">
            <Link href="/" onClick={closeAllPanels} className="flex items-center gap-3">
              <Image src={logoImage} alt="Astral" className="h-auto w-16 drop-shadow-[0_0_20px_rgba(66,233,62,0.3)]" />
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">Anomaly</div>
                <div className="text-sm font-semibold text-white">Documentation</div>
              </div>
            </Link>
          </div>

          <ScrollArea className="max-h-[calc(100vh-18rem)] px-4 py-4">
            <div className="space-y-1 pb-4">
              <Link
                href="/"
                onClick={closeAllPanels}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 text-sm font-semibold uppercase tracking-[0.08em] transition-all duration-200",
                  pathname === "/" ? "text-primary" : "text-white/80 hover:bg-white/5 hover:text-white"
                )}
              >
                <Home className={cn("h-4 w-4", pathname === "/" ? "text-primary" : "text-muted-foreground")} />
                Accueil
              </Link>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-20 rounded bg-muted/30 animate-pulse" />
                    <div className="h-8 w-full rounded bg-muted/20 animate-pulse" />
                    <div className="h-8 w-full rounded bg-muted/20 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 pb-2">
                {categories.map((category) => {
                  const isActive = activeCategoryKey === category.key;

                  return (
                    <Button
                      key={category.key}
                      variant="ghost"
                      className={cn(
                        "h-10 w-full justify-between px-2 text-xs font-bold uppercase tracking-[0.18em] hover:bg-white/5",
                        category.colorClass
                      )}
                      onClick={() => {
                        setManualCategoryKey((current) => (current === category.key ? "__closed__" : category.key));
                        setManualSectionId(null);
                      }}
                    >
                      <span className="flex items-center gap-2">
                        <category.icon className="h-3 w-3" />
                        {category.title}
                      </span>
                      <ChevronRight className={cn("h-3 w-3 transition-transform duration-200", isActive ? "rotate-90 text-primary" : "")} />
                    </Button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {activeCategory && !loading && (
          <div className="absolute left-full top-0 z-[60] ml-4 w-72">
            <div className="anomaly-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-2">
                  <activeCategory.icon className={cn("h-4 w-4", activeCategory.colorClass)} />
                  <div className="text-sm font-semibold text-white">{activeCategory.title}</div>
                </div>
                <button
                  onClick={() => {
                    setManualCategoryKey("__closed__");
                    setManualSectionId(null);
                  }}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
              </div>

              <ScrollArea className="max-h-[calc(100vh-18rem)] px-3 py-3">
                <div className="space-y-2">
                  {activeCategory.sections.map((section) => {
                    const isActive = activeSectionId === section.id;

                    return (
                      <Button
                        key={section.id}
                        variant="ghost"
                        className="h-9 w-full justify-between px-3 text-sm font-semibold text-white/90 hover:bg-white/5"
                        onClick={() => setManualSectionId((current) => (current === section.id ? "__closed__" : section.id))}
                      >
                        <span className="truncate">{section.title}</span>
                        <ChevronRight className={cn("h-3 w-3 transition-transform", isActive ? "rotate-90 text-primary" : "text-muted-foreground")} />
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}

        {activeCategory && activeSection && !loading && (
          <div className="absolute left-[calc(100%+19rem)] top-0 z-[70] ml-4 w-80">
            <div className="anomaly-panel overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div className="text-sm font-semibold text-white">{activeSection.title}</div>
                <button
                  onClick={() => setManualSectionId("__closed__")}
                  className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/5 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4 rotate-180" />
                </button>
              </div>

              <ScrollArea className="max-h-[calc(100vh-18rem)] px-3 py-3">
                <div className="space-y-2">
                  {activeSectionArticles.length > 0 ? (
                    activeSectionArticles.map((article) => (
                      <ArticleLink
                        key={`${article.id}-${resetKey}`}
                        article={article}
                        sectionSlug={activeSection.slug}
                        pathname={pathname}
                        onNavigate={closeAllPanels}
                        resetKey={resetKey}
                      />
                    ))
                  ) : (
                    <p className="px-3 py-2 text-xs italic text-muted-foreground/50">Aucun article</p>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
