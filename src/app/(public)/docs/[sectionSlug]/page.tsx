import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, FileText, FolderOpen } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  params: {
    sectionSlug: string;
  };
};

export const dynamic = "force-dynamic";

type SectionArticle = {
  id: string;
  title: string;
  slug: string;
  parent_article_id: string | null;
  order_index: number;
  content: string | null;
  is_published: boolean;
};

type SectionWithArticles = {
  title: string;
  slug: string;
  description?: string | null;
  articles?: SectionArticle[];
};

const stripHtml = (content: string | null) => content?.replace(/<[^>]*>?/gm, "").substring(0, 110) || "";

export default async function SectionPage({ params }: Props) {
  const { sectionSlug } = await params;
  const supabase = createSupabaseClient();

  const { data: section, error } = await supabase
    .from("sections")
    .select(
      `
      *,
      articles (
        id,
        title,
        slug,
        parent_article_id,
        order_index,
        content,
        is_published
      )
    `
    )
    .eq("slug", sectionSlug)
    .single();

  if (error || !section) {
    notFound();
  }

  const typedSection = section as SectionWithArticles;
  const allPublishedArticles = typedSection.articles?.filter((article) => article.is_published) || [];
  const rootArticles = allPublishedArticles
    .filter((article) => !article.parent_article_id)
    .sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="anomaly-panel anomaly-outline space-y-8 p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-white">
          Accueil
        </Link>
        <span>/</span>
        <Link href="/#reglement" className="transition-colors hover:text-white">
          Reglement
        </Link>
        <span>/</span>
        <span className="text-white">{typedSection.title}</span>
      </div>

      <div className="space-y-2 border-b border-white/10 pb-6">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
          <FolderOpen className="h-8 w-8 text-primary" />
          {typedSection.title}
        </h1>
        {typedSection.description && <p className="text-lg text-muted-foreground">{typedSection.description}</p>}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {rootArticles.length > 0 ? (
          rootArticles.map((article) => {
            const childCount = allPublishedArticles.filter((item) => item.parent_article_id === article.id).length;

            return (
              <Link key={article.id} href={`/docs/${typedSection.slug}/${article.slug}`} className="group block">
                <Card className="anomaly-panel-soft min-h-32 rounded-sm border-white/10 py-0 transition-all duration-200 hover:border-primary/40">
                  <CardHeader className="gap-3 p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="mt-1 h-5 w-5 shrink-0 text-primary" />
                      <div className="min-w-0 flex-1">
                        <CardTitle className="line-clamp-2 text-base text-white transition-colors group-hover:text-primary">
                          {article.title}
                        </CardTitle>
                        <CardDescription className="mt-2 line-clamp-2 text-sm">
                          {childCount > 0 ? `${childCount} sous-lien(s) disponible(s)` : `${stripHtml(article.content)}...`}
                        </CardDescription>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                    <Button variant="link" className="h-auto w-fit p-0 text-primary group-hover:underline">
                      Ouvrir
                    </Button>
                  </CardHeader>
                </Card>
              </Link>
            );
          })
        ) : (
          <div className="col-span-full border border-dashed border-white/10 py-12 text-center text-muted-foreground">
            Aucun article publie dans cette section pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
