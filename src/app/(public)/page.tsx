'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Book, FileText, Map, Search, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandMenu } from "@/components/shared/CommandMenu";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabaseBrowser } from "@/lib/supabase-browser";
import logoImage from "@/lib/asset/anomaly_logo.png";

interface Section {
  id: string;
  title: string;
  slug: string;
  category: string;
  order_index: number;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  section_id: string;
  parent_article_id: string | null;
  is_published: boolean;
  order_index: number;
}

const normalizeString = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export default function Home() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [homeSearchQuery, setHomeSearchQuery] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = supabaseBrowser;

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [sectionsRes, articlesRes] = await Promise.all([
        supabase.from("sections").select("*").order("order_index", { ascending: true }),
        supabase
          .from("articles")
          .select("id, title, slug, section_id, is_published")
          .eq("is_published", true)
          .order("order_index", { ascending: true }),
      ]);

      if (sectionsRes.data) {
        setSections(sectionsRes.data as Section[]);
      }

      if (articlesRes.data) {
        setArticles(articlesRes.data as Article[]);
      }

      setLoading(false);
    }

    fetchData();
  }, [supabase]);

  const filterContent = (query: string) => {
    if (!query) return { filteredSections: sections, filteredArticles: articles };

    const normalizedQuery = normalizeString(query);

    const filteredSections = sections.filter(
      (section) =>
        normalizeString(section.title).includes(normalizedQuery) ||
        normalizeString(section.category).includes(normalizedQuery)
    );

    const filteredArticles = articles.filter(
      (article) =>
        normalizeString(article.title).includes(normalizedQuery) ||
        sections.some(
          (section) =>
            section.id === article.section_id &&
            (normalizeString(section.title).includes(normalizedQuery) ||
              normalizeString(section.category).includes(normalizedQuery))
        )
    );

    return { filteredSections, filteredArticles };
  };

  const { filteredSections, filteredArticles } = filterContent(homeSearchQuery);

  const categories = [
    { title: "Règlement", icon: Book, categorySlug: "reglement", description: "Les règles, directives et points de référence du serveur." },
    { title: "Documents RP", icon: ShieldAlert, categorySlug: "rp", description: "Les documents de jeu, procédures et supports opérationnels." },
    { title: "Guides & Aide", icon: Map, categorySlug: "guide", description: "Les pages pour s’orienter, apprendre et avancer rapidement." },
  ];

  const filteredCategories = categories.filter(
    (category) =>
      homeSearchQuery === "" ||
      normalizeString(category.title).includes(normalizeString(homeSearchQuery)) ||
      filteredSections.some((s) => s.category === category.categorySlug) ||
      filteredArticles.some((a) => sections.some((s) => s.id === a.section_id && s.category === category.categorySlug))
  );

  const shouldShowPopover = homeSearchQuery.length > 0 && filteredArticles.length > 0;

  return (
    <div className="space-y-8">
      <section className="anomaly-panel anomaly-outline relative overflow-hidden px-6 py-8 md:px-10 md:py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(66,233,62,0.12),transparent_42%)]" />

        <div className="relative space-y-6">
          <div className="flex items-center gap-4">
            <Image
              src={logoImage}
              alt="Astral"
              className="h-auto w-20 drop-shadow-[0_0_24px_rgba(66,233,62,0.35)] md:w-24"
            />
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Accueil</p>
              <h1 className="text-3xl font-extrabold text-white md:text-5xl">Bienvenue sur Anomaly RP</h1>
            </div>
          </div>

          <div className="max-w-3xl space-y-4 text-base leading-7 text-[#d6ddd3] md:text-lg">
            <p>La documentation officielle centralise règles, guides et documents utiles sans changer votre navigation actuelle.</p>
            <p>Le design se rapproche du modèle demandé: fond sombre, accent néon vert et grands panneaux lisibles pour mettre les contenus en avant.</p>
            <p className="font-semibold text-white">La structure existante reste la même, seul l’habillage évolue.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="anomaly-panel-soft p-5">
              <div className="text-sm font-semibold text-white">Liens utiles</div>
              <div className="mt-3 space-y-2 text-sm">
                <Link href="/docs/category/reglement" className="block text-primary hover:text-primary/80">Notre règlement</Link>
                <Link href="/docs/category/guide" className="block text-primary hover:text-primary/80">Nos guides</Link>
                <Link href="/admin/login" className="block text-primary hover:text-primary/80">Connexion administration</Link>
              </div>
            </div>

            {/* <div className="anomaly-panel-soft p-5">
              <div className="text-sm font-semibold text-white">Recherche rapide</div>
              <p className="mt-3 text-sm text-muted-foreground">Retrouvez instantanément un article, une règle ou une page publique.</p>
              <Button
                variant="ghost"
                className="mt-4 h-auto p-0 text-primary hover:bg-transparent hover:text-primary/80"
                onClick={() => setIsSearchOpen(true)}
              >
                Ouvrir la recherche
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div> */}.
          </div>
        </div>
      </section>

      <section className="anomaly-panel-soft p-6">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start">
          
          <div className="min-w-0 flex-1 space-y-4">
            <Popover open={shouldShowPopover}>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
                  <Input
                    type="text"
                    placeholder="Rechercher un article, une règle..."
                    className="h-14 border-white/10 bg-black/20 pl-12 text-base text-white placeholder:text-muted-foreground focus-visible:ring-primary"
                    value={homeSearchQuery}
                    onChange={(e) => setHomeSearchQuery(e.target.value)}
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="mt-2 max-h-60 w-[var(--radix-popover-trigger-width)] overflow-y-auto border-white/10 bg-[#1d1a1a] p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                {loading ? (
                  <p className="p-3 text-sm text-muted-foreground">Chargement des articles...</p>
                ) : filteredArticles.length > 0 ? (
                  filteredArticles.map((article) => (
                    <Link
                      key={article.id}
                      href={`/docs/${sections.find((s) => s.id === article.section_id)?.slug || "unknown"}/${article.slug}`}
                      className="flex items-center gap-2 border-b border-white/5 p-3 text-sm hover:bg-white/5"
                    >
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="flex-1 truncate text-white">{article.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {sections.find((s) => s.id === article.section_id)?.title}
                      </span>
                    </Link>
                  ))
                ) : (
                  <p className="p-3 text-sm text-muted-foreground">Aucun article trouvé.</p>
                )}
              </PopoverContent>
            </Popover>

            <div className="grid gap-3 md:grid-cols-3">
              {filteredCategories.length > 0 ? (
                filteredCategories.map((category) => (
                  <Link
                    key={category.categorySlug}
                    href={`/docs/category/${category.categorySlug}`}
                    className="flex items-start gap-4 rounded-sm border border-white/10 bg-black/15 p-4 transition-colors hover:border-primary/30"
                  >
                    <category.icon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <div className="min-w-0">
                      <div className="font-semibold text-white">{category.title}</div>
                      <p className="mt-1 text-sm text-muted-foreground">{category.description}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-sm border border-dashed border-white/10 px-4 py-5 text-sm text-muted-foreground md:col-span-3">
                  Aucun résultat trouvé pour &quot;{homeSearchQuery}&quot;.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <CommandMenu open={isSearchOpen} setOpen={setIsSearchOpen} />
    </div>
  );
}
