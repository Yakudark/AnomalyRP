"use client";

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  Home,
  Image as ImageIcon,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "cmdk";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { defaultSiteSettings } from "@/lib/site-settings";

type SectionRelation =
  | {
      title: string | null;
      slug: string | null;
      category: string | null;
      is_visible?: boolean | null;
    }
  | {
      title: string | null;
      slug: string | null;
      category: string | null;
      is_visible?: boolean | null;
    }[]
  | null;

type ArticleRow = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  section: SectionRelation;
};

type SectionRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  category: string | null;
};

type SiteSettingsRow = {
  home_title: string | null;
  home_content: string | null;
  rgpd_text: string | null;
};

type SearchResult = {
  id: string;
  title: string;
  description: string;
  href: string;
  group: string;
  searchText: string;
  icon: typeof Home;
};

type FilteredSearchResult = SearchResult & {
  matchDescription: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  reglement: "Reglement",
  rp: "Documents RP",
  guide: "Guides & Aide",
};

const stripHtml = (content: string | null | undefined) =>
  (content ?? "").replace(/<[^>]*>?/gm, " ").replace(/\s+/g, " ").trim();

const normalizeString = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getSearchTerms = (query: string) =>
  normalizeString(query)
    .split(/\s+/)
    .map((term) => term.trim())
    .filter(Boolean);

const getMatchExcerpt = (text: string, query: string) => {
  const terms = getSearchTerms(query);
  const normalizedText = normalizeString(text);
  const firstMatchIndex = terms.reduce<number>((matchIndex, term) => {
    const index = normalizedText.indexOf(term);
    if (index === -1) return matchIndex;
    return matchIndex === -1 ? index : Math.min(matchIndex, index);
  }, -1);

  if (firstMatchIndex === -1) {
    return text.substring(0, 150);
  }

  const start = Math.max(firstMatchIndex - 55, 0);
  const end = Math.min(firstMatchIndex + 115, text.length);
  const prefix = start > 0 ? "... " : "";
  const suffix = end < text.length ? " ..." : "";

  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
};

const getSection = (section: SectionRelation) => {
  if (Array.isArray(section)) {
    return section[0] ?? null;
  }

  return section;
};

export function CommandMenu({
  open,
  setOpen,
  onArticleSelected,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onArticleSelected?: (sectionSlug: string, articleSlug: string) => void;
}) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  useEffect(() => {
    if (!open || results.length > 0) {
      return;
    }

    async function fetchSearchIndex() {
      setLoading(true);

      const [settingsResult, sectionsResult, articlesResult] = await Promise.all([
        supabaseBrowser
          .from("site_settings")
          .select("home_title, home_content, rgpd_text")
          .eq("key", "main")
          .maybeSingle<SiteSettingsRow>(),
        supabaseBrowser
          .from("sections")
          .select("id, title, slug, description, category")
          .eq("is_visible", true)
          .order("order_index", { ascending: true }),
        supabaseBrowser
          .from("articles")
          .select("id, title, slug, content, section:sections(title, slug, category, is_visible)")
          .eq("is_published", true)
          .order("title", { ascending: true }),
      ]);

      if (settingsResult.error || sectionsResult.error || articlesResult.error) {
        console.error(
          "Erreur lors du chargement de la recherche:",
          settingsResult.error?.message ||
            sectionsResult.error?.message ||
            articlesResult.error?.message,
        );
      }

      const settings = settingsResult.data;
      const sections = (sectionsResult.data as SectionRow[] | null) ?? [];
      const articles = ((articlesResult.data as unknown as ArticleRow[] | null) ?? []).filter((article) => {
        const section = getSection(article.section);
        return section?.slug && section.is_visible !== false;
      });

      const siteResults: SearchResult[] = [
        {
          id: "home",
          title: settings?.home_title || defaultSiteSettings.homeTitle,
          description: stripHtml(settings?.home_content || defaultSiteSettings.homeContent).substring(0, 150),
          href: "/",
          group: "Pages",
          searchText: `${settings?.home_title || defaultSiteSettings.homeTitle} ${stripHtml(
            settings?.home_content || defaultSiteSettings.homeContent,
          )} accueil home anomalyrp presentation serveur roleplay`,
          icon: Home,
        },
        {
          id: "rules",
          title: "Reglement",
          description: "Sections, regles et documents publies du serveur.",
          href: "/#reglement",
          group: "Pages",
          searchText: "Reglement sections regles rules documents publies serveur",
          icon: BookOpen,
        },
        {
          id: "gallery",
          title: "Galerie",
          description: "Images publiques du serveur.",
          href: "/#galerie",
          group: "Pages",
          searchText: "Galerie images photos captures publiques serveur",
          icon: ImageIcon,
        },
        {
          id: "legal",
          title: "Mentions legales",
          description: stripHtml(settings?.rgpd_text || defaultSiteSettings.rgpdText).substring(0, 150),
          href: "/mentions-legales",
          group: "Pages",
          searchText: `${stripHtml(
            settings?.rgpd_text || defaultSiteSettings.rgpdText,
          )} mentions legales rgpd confidentialite donnees`,
          icon: ShieldCheck,
        },
      ];

      const sectionResults = sections.map<SearchResult>((section) => ({
        id: `section-${section.id}`,
        title: section.title,
        description: section.description || "Voir les pages disponibles dans cette section.",
        href: `/docs/${section.slug}`,
        group: CATEGORY_LABELS[section.category || ""] || "Sections",
        searchText: `${section.title} ${section.description || ""} ${section.category || ""}`,
        icon: BookOpen,
      }));

      const articleResults = articles.map<SearchResult>((article) => {
        const section = getSection(article.section);
        const sectionSlug = section?.slug || "docs";
        const sectionTitle = section?.title || "Document";
        const contentText = stripHtml(article.content);

        return {
          id: `article-${article.id}`,
          title: article.title,
          description: contentText.substring(0, 150) || sectionTitle,
          href: `/docs/${sectionSlug}/${article.slug}`,
          group: sectionTitle,
          searchText: `${article.title} ${contentText} ${sectionTitle} ${section?.category || ""}`,
          icon: FileText,
        };
      });

      setResults([...siteResults, ...sectionResults, ...articleResults]);
      setLoading(false);
    }

    fetchSearchIndex();
  }, [open, results.length]);

  const filteredResults = useMemo<FilteredSearchResult[]>(() => {
    const query = searchQuery.trim();
    const terms = getSearchTerms(query);

    if (terms.length === 0) {
      return results.slice(0, 12).map((result) => ({
        ...result,
        matchDescription: result.description,
      }));
    }

    return results
      .map((result) => {
        const haystack = normalizeString(result.searchText);
        const title = normalizeString(result.title);
        let score = 0;

        if (!terms.every((term) => haystack.includes(term))) {
          return {
            result: {
              ...result,
              matchDescription: "",
            },
            score: 0,
          };
        }

        for (const term of terms) {
          if (title === term) score += 8;
          if (title.startsWith(term)) score += 5;
          if (title.includes(term)) score += 3;
          if (haystack.includes(term)) score += 1;
        }

        return {
          result: {
            ...result,
            matchDescription: getMatchExcerpt(result.searchText, query),
          },
          score,
        };
      })
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score || a.result.title.localeCompare(b.result.title))
      .slice(0, 30)
      .map(({ result }) => result);
  }, [results, searchQuery]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setSearchQuery("");
    router.push(result.href);

    if (result.href.startsWith("/docs/")) {
      const [, , sectionSlug, articleSlug] = result.href.split("/");
      if (sectionSlug && articleSlug) {
        onArticleSelected?.(sectionSlug, articleSlug);
      }
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setSearchQuery("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="overflow-hidden rounded-sm border-primary/25 bg-[#081108] p-0 text-white shadow-[0_0_35px_rgba(66,233,62,0.16)] sm:max-w-2xl">
        <Command shouldFilter={false} className="bg-transparent">
          <div className="relative flex h-14 items-center border-b border-primary/15">
            <Search className="absolute left-4 h-4 w-4 text-primary" />
            <CommandInput
              placeholder="Rechercher sur le site..."
              className="h-full w-full border-none bg-transparent pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground"
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>

          <CommandList className="max-h-[430px] overflow-auto p-2">
            {loading && (
              <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Chargement de la recherche...
              </div>
            )}

            {!loading && filteredResults.length === 0 && (
              <CommandEmpty className="px-3 py-8 text-center text-sm text-muted-foreground">
                Aucun resultat trouve pour &quot;{searchQuery}&quot;.
              </CommandEmpty>
            )}

            {!loading && filteredResults.length > 0 && (
              <CommandGroup heading="Resultats" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-primary">
                {filteredResults.map((result) => {
                  const Icon = result.icon;

                  return (
                    <CommandItem
                      key={result.id}
                      value={result.title}
                      onSelect={() => handleSelect(result)}
                      className="flex cursor-pointer items-start gap-3 rounded-sm px-3 py-3 text-sm outline-none transition-colors aria-selected:bg-primary/10 aria-selected:text-white"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-white">{result.title}</span>
                        {result.matchDescription && (
                          <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {result.matchDescription}
                          </span>
                        )}
                      </span>
                      <span className="ml-2 max-w-28 shrink-0 truncate text-xs text-muted-foreground">
                        {result.group}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
