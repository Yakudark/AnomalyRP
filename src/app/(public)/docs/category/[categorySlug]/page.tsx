import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, ChevronRight, FileText, Map, Shield, type LucideIcon } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  params: {
    categorySlug: string;
  };
};

export const dynamic = "force-dynamic";

type SectionSummary = {
  title: string;
  slug: string;
  category: string;
};

type ArticleSummary = {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  order_index: number;
  section: SectionSummary | null;
};

const CATEGORY_INFO: Record<string, { title: string; description: string; icon: LucideIcon; color: string }> = {
  reglement: {
    title: "Règlements",
    description: "Tous les règlements et directives du serveur",
    icon: BookOpen,
    color: "text-primary",
  },
  rp: {
    title: "Documents RP",
    description: "Lois, procédures et documents officiels",
    icon: Shield,
    color: "text-white",
  },
  guide: {
    title: "Guides & Aide",
    description: "Guides et tutoriels pour bien démarrer",
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

  const { data: articles, error } = await supabase
    .from("articles")
    .select(
      `
      id,
      title,
      slug,
      content,
      order_index,
      section:sections (
        title,
        slug,
        category
      )
    `
    )
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  if (error) {
    console.error(error);
    notFound();
  }

  const filteredArticles = ((articles as ArticleSummary[] | null) ?? []).filter((article) => article.section?.category === categorySlug);
  const Icon = categoryInfo.icon;

  return (
    <div className="anomaly-panel anomaly-outline space-y-8 p-6 md:p-8">
      <div className="space-y-2 border-b border-white/10 pb-6">
        <h1 className="flex items-center gap-3 text-4xl font-bold tracking-tight text-white">
          <Icon className={`h-10 w-10 ${categoryInfo.color}`} />
          {categoryInfo.title}
        </h1>
        <p className="text-lg text-muted-foreground">{categoryInfo.description}</p>
      </div>

      <div className="grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredArticles.length > 0 ? (
          filteredArticles.map((article) => (
            <Link
              key={article.id}
              href={`/docs/${article.section?.slug}/${article.slug}?fromCategory=${categorySlug}`}
              className="group block h-full"
            >
              <Card className="anomaly-panel-soft aspect-square h-full rounded-sm border-white/10 py-0 transition-all duration-200 hover:border-primary/40">
                <CardHeader className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <FileText className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <CardTitle className="line-clamp-2 text-lg text-white transition-colors group-hover:text-primary">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="text-xs">{article.section?.title}</CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <p className="line-clamp-3 text-sm text-muted-foreground">
                    {article.content?.replace(/<[^>]*>?/gm, "").substring(0, 150)}...
                  </p>
                  <Button variant="link" className="mt-3 h-auto p-0 text-primary group-hover:underline">
                    En savoir plus →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full rounded-sm border border-dashed border-white/10 py-12 text-center text-muted-foreground">
            Aucun article publié dans cette catégorie pour le moment.
          </div>
        )}
      </div>
    </div>
  );
}
