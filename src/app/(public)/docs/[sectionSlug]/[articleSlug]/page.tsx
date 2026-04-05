import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { createSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  params: {
    sectionSlug: string;
    articleSlug: string;
  };
  searchParams?:
    | {
        fromCategory?: string;
      }
    | Promise<{
        fromCategory?: string;
      }>;
};

export const dynamic = "force-dynamic";

type ArticleSection = {
  title: string;
  slug: string;
};

type ArticleDetail = {
  id: string;
  title: string;
  content: string | null;
  updated_at?: string | null;
  section: ArticleSection | null;
};

type RelatedArticle = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
};

const CATEGORY_LABELS: Record<string, string> = {
  reglement: "Règlements",
  rp: "Documents RP",
  guide: "Guides & Aide",
};

export default async function ArticlePage({ params, searchParams }: Props) {
  const { sectionSlug, articleSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const fromCategory = resolvedSearchParams?.fromCategory;
  const supabase = createSupabaseClient();

  const { data: article, error } = await supabase
    .from("articles")
    .select(
      `
      *,
      section:sections (
        title,
        slug
      )
    `
    )
    .eq("slug", articleSlug)
    .eq("is_published", true)
    .single();

  if (error || !article) {
    notFound();
  }

  const typedArticle = article as ArticleDetail;

  if (typedArticle.section?.slug !== sectionSlug) {
    notFound();
  }

  const { data: subArticles } = await supabase
    .from("articles")
    .select("id, title, slug, content")
    .eq("parent_article_id", article.id)
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  const typedSubArticles = (subArticles as RelatedArticle[] | null) ?? [];
  const categoryLabel = fromCategory ? CATEGORY_LABELS[fromCategory] ?? typedArticle.section?.title : typedArticle.section?.title;
  const backHref = fromCategory ? `/docs/category/${fromCategory}` : `/docs/${sectionSlug}`;
  const relatedArticleSuffix = fromCategory ? `?fromCategory=${fromCategory}` : "";

  return (
    <div className="anomaly-panel anomaly-outline max-w-5xl space-y-8 p-6 md:p-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-white">
          Accueil
        </Link>
        <span>/</span>
        <Link href={backHref} className="transition-colors hover:text-white">
          {categoryLabel}
        </Link>
        <span>/</span>
        <span className="text-white">{typedArticle.title}</span>
      </div>

      <div className="space-y-4 border-b border-white/10 pb-6">
        <Link href={backHref}>
          <Button variant="ghost" size="sm" className="-ml-2 gap-2 text-primary hover:bg-white/5 hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Retour à {categoryLabel}
          </Button>
        </Link>

        <h1 className="text-4xl font-bold tracking-tight text-white">{typedArticle.title}</h1>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {typedArticle.updated_at && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Mis à jour le {format(new Date(typedArticle.updated_at), "d MMMM yyyy", { locale: fr })}
            </div>
          )}
        </div>
      </div>

      <div
        className="prose prose-invert max-w-none text-[#dde3da]
          prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:mt-8 prose-h2:text-2xl prose-h2:text-primary
          prose-h3:mt-6 prose-h3:text-xl
          prose-p:my-4 prose-p:leading-7 prose-p:text-[#dde3da]
          prose-a:text-primary prose-a:no-underline hover:prose-a:underline
          prose-strong:text-white prose-strong:font-semibold
          prose-ul:my-4 prose-li:my-2
          prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2
          prose-code:rounded prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-primary
          prose-pre:border prose-pre:border-white/10 prose-pre:bg-black/30"
        dangerouslySetInnerHTML={{ __html: typedArticle.content || "" }}
      />

      {typedSubArticles.length > 0 && (
        <div className="space-y-4 border-t border-white/10 pt-8">
          <h2 className="text-2xl font-bold tracking-tight text-white">Articles liés</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {typedSubArticles.map((subArticle) => (
              <Link key={subArticle.id} href={`/docs/${sectionSlug}/${subArticle.slug}${relatedArticleSuffix}`} className="group block">
                <Card className="anomaly-panel-soft rounded-sm border-white/10 py-0 transition-all duration-200 hover:border-primary/40">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-lg text-white transition-colors group-hover:text-primary">
                      {subArticle.title}
                      <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {subArticle.content?.replace(/<[^>]*>?/gm, "").substring(0, 100)}...
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-white/10 pt-8">
        <Link href={backHref}>
          <Button variant="outline" className="gap-2 border-white/10 bg-transparent text-white hover:bg-white/5">
            <ArrowLeft className="h-4 w-4" />
            Voir tous les articles de {categoryLabel}
          </Button>
        </Link>
      </div>
    </div>
  );
}
