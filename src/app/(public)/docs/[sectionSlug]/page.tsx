import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, FileText, FolderOpen } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  params: {
    sectionSlug: string;
  };
};

export const dynamic = "force-dynamic";

type SectionArticle = {
  title: string;
  slug: string;
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

export default async function SectionPage({ params }: Props) {
  const { sectionSlug } = await params;
  const supabase = createSupabaseClient();

  const { data: section, error } = await supabase
    .from("sections")
    .select(
      `
      *,
      articles (
        title,
        slug,
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
  const sortedArticles =
    typedSection.articles?.filter((article) => article.is_published).sort((a, b) => a.order_index - b.order_index) || [];

  return (
    <div className="anomaly-panel anomaly-outline space-y-8 p-6 md:p-8">
      <div className="space-y-2 border-b border-white/10 pb-6">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-white">
          <FolderOpen className="h-8 w-8 text-primary" />
          {section.title}
        </h1>
          {typedSection.description && <p className="text-lg text-muted-foreground">{typedSection.description}</p>}
      </div>

      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedArticles.length > 0 ? (
          sortedArticles.map((article) => (
            <Link key={article.slug} href={`/docs/${typedSection.slug}/${article.slug}`} className="group block h-full">
              <Card className="anomaly-panel-soft aspect-square h-full rounded-sm border-white/10 py-0 transition-all duration-200 hover:border-primary/40">
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <FileText className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <CardTitle className="line-clamp-2 text-lg text-white transition-colors group-hover:text-primary">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {article.content?.replace(/<[^>]*>?/gm, "").substring(0, 100)}...
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button variant="link" className="h-auto p-0 text-primary group-hover:underline">
                    En savoir plus →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-2 rounded-sm border border-dashed border-white/10 py-12 text-center text-muted-foreground">
            Aucun article publié dans cette section pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
