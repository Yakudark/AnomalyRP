import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, ChevronRight, FileText, FolderOpen, Map, Shield, type LucideIcon } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";

type Props = {
  params: {
    categorySlug: string;
  };
};

export const dynamic = "force-dynamic";

type SectionSummary = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  order_index: number;
};

type ArticleSummary = {
  id: string;
  section_id: string;
  parent_article_id: string | null;
  is_published: boolean;
};

const CATEGORY_INFO: Record<string, { title: string; description: string; icon: LucideIcon; color: string }> = {
  reglement: {
    title: "Règlement",
    description: "Toutes les sections du règlement du serveur.",
    icon: BookOpen,
    color: "text-primary",
  },
  rp: {
    title: "Documents RP",
    description: "Lois, procédures et documents officiels.",
    icon: Shield,
    color: "text-white",
  },
  guide: {
    title: "Guides & Aide",
    description: "Guides et tutoriels pour bien démarrer.",
    icon: Map,
    color: "text-white",
  },
};

export default async function CategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const supabase = createSupabaseClient();
  const categoryInfo = CATEGORY_INFO[categorySlug];

  if (!categoryInfo) {
    notFound();
  }

  const [sectionsResult, articlesResult] = await Promise.all([
    supabase
      .from("sections")
      .select("id, title, slug, description, order_index")
      .eq("category", categorySlug)
      .eq("is_visible", true)
      .order("order_index", { ascending: true }),
    supabase
      .from("articles")
      .select("id, section_id, parent_article_id, is_published")
      .eq("is_published", true),
  ]);

  if (sectionsResult.error || articlesResult.error) {
    console.error(sectionsResult.error || articlesResult.error);
    notFound();
  }

  const sections = (sectionsResult.data as SectionSummary[] | null) ?? [];
  const articles = (articlesResult.data as ArticleSummary[] | null) ?? [];
  const Icon = categoryInfo.icon;

  return (
    <div className="anomaly-panel anomaly-outline space-y-8 p-6 md:p-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-white">
          Accueil
        </Link>
        <span>/</span>
        <span className="text-white">{categoryInfo.title}</span>
      </div>

      <div className="space-y-2 border-b border-white/10 pb-6">
        <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight text-white">
          <Icon className={`h-10 w-10 ${categoryInfo.color}`} />
          {categoryInfo.title}
        </h1>
        <p className="text-lg text-muted-foreground">{categoryInfo.description}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {sections.length > 0 ? (
          sections.map((section) => {
            const rootArticleCount = articles.filter(
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
                <h2 className="mt-4 text-base font-semibold text-white transition-colors group-hover:text-primary">
                  {section.title}
                </h2>
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
          <div className="col-span-full border border-dashed border-white/10 py-12 text-center text-muted-foreground">
            Aucune section publiée pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
