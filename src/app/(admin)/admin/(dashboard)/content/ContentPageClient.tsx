"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SectionsManager } from "./components/SectionsManager";
import { SortableTableBody } from "./components/SortableTableBody";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { toast } from "react-hot-toast";

/** ✅ Types propres */
type Section = {
  id: string;
  title: string;
  category: string;
  slug: string;
  is_visible?: boolean;
};

// ✅ Shape réel renvoyé par Supabase (section = tableau)
type ArticleApi = {
  id: string;
  title: string;
  slug: string;
  is_published: boolean;
  updated_at: string;
  order_index: number | null;
  section: Section[];
};

// ✅ Shape consommé par ton UI (section = objet)
type Article = Omit<ArticleApi, "section"> & {
  section: Section | null;
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function ContentPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSectionId = searchParams.get("section") || "all";

  const [articles, setArticles] = useState<Article[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] =
    useState<string>(initialSectionId);
  const [activeTab, setActiveTab] = useState("articles");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // DND Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
      const oldIndex = articles.findIndex((item) => item.id === active.id);
      const newIndex = articles.findIndex((item) => item.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const newOrderedArticles = [...articles];
      const [movedItem] = newOrderedArticles.splice(oldIndex, 1);
      newOrderedArticles.splice(newIndex, 0, movedItem);
      setArticles(newOrderedArticles);

      const reorderedForApi = newOrderedArticles.map((item, index) => ({
        id: item.id,
        order_index: index,
      }));

      try {
        const response = await fetch("/api/admin/articles/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reorderedForApi),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || "Erreur lors de la réorganisation."
          );
        }

        toast.success("Ordre des articles mis à jour !");
      } catch (apiError: unknown) {
        toast.error(getErrorMessage(apiError, "La réorganisation a échoué."));
        // rollback simple
        setArticles(articles);
      }
    }
  };

  useEffect(() => {
    async function fetchContent() {
      setLoading(true);
      setError(null);

      try {
        const supabase = supabaseBrowser;

        let articlesQuery = supabase
          .from("articles")
          .select(
            `
            id,
            title,
            slug,
            is_published,
            updated_at,
            order_index,
            section:sections (
              id,
              title,
              category,
              slug
            )
          `
          )
          .order("order_index", { ascending: true })
          .order("updated_at", { ascending: false });

        if (selectedSection && selectedSection !== "all") {
          articlesQuery = articlesQuery.eq("section_id", selectedSection);
        }

        const [articlesRes, sectionsRes] = await Promise.all([
          articlesQuery,
          supabase.from("sections").select("*").order("title"),
        ]);

        if (articlesRes.error) throw articlesRes.error;
        if (sectionsRes.error) throw sectionsRes.error;

        // ✅ Normalisation : section[] -> section (1ère ou null)
        const apiData = (articlesRes.data ?? []) as ArticleApi[];
        const normalized: Article[] = apiData.map((a) => ({
          ...a,
          section: a.section?.[0] ?? null,
        }));

        setArticles(normalized);
        const rawSections = (sectionsRes.data ?? []) as Array<{
          id: string;
          title: string;
          slug: string;
          category: string | null;
          is_visible?: boolean | null;
        }>;

        const normalizedSections: Section[] = rawSections.map((s) => ({
          id: s.id,
          title: s.title,
          slug: s.slug,
          category: s.category ?? "", // ✅ jamais null
          is_visible: s.is_visible ?? true,
        }));

        setSections(normalizedSections);
      } catch (err: unknown) {
        console.error(err);
        setError(getErrorMessage(err, "Erreur lors du chargement du contenu."));
      } finally {
        setLoading(false);
      }
    }

    fetchContent();
  }, [selectedSection, reloadKey]);

  // sync URL with selectedSection
  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    const currentSection = current.get("section") ?? "";
    const desired = selectedSection !== "all" ? selectedSection : "";

    if (desired !== currentSection) {
      const newParams = new URLSearchParams();
      if (desired) newParams.set("section", desired);

      router.replace(
        `/admin/content${
          newParams.toString() ? `?${newParams.toString()}` : ""
        }`
      );
    }
  }, [selectedSection, router]);

  const draftsCount = articles.filter((a) => !a.is_published).length;
  const publishedCount = articles.filter((a) => a.is_published).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-white">
        <Loader2 className="mr-2 h-8 w-8 animate-spin" />
        Chargement du contenu...
      </div>
    );
  }

  if (error) return <div className="text-red-500 p-4">Erreur: {error}</div>;

  return (
    <div className="space-y-8 text-white">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestion du Contenu
          </h1>
          <p className="text-muted-foreground">
            Gérez vos articles, guides et règlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select onValueChange={setSelectedSection} value={selectedSection}>
            <SelectTrigger className="w-[180px] bg-black/20 border-white/10 text-white">
              <SelectValue placeholder="Filtrer par section" />
            </SelectTrigger>
            <SelectContent className="bg-background text-white border-white/10">
              <SelectGroup>
                <SelectLabel>Sections</SelectLabel>
                <SelectItem value="all">Toutes les sections</SelectItem>
                {sections.map((section) => (
                  <SelectItem key={section.id} value={section.id}>
                    {section.title}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Link href="/admin/content/new">
            <Button className="bg-primary hover:bg-primary/90 text-white gap-2">
              <Plus className="h-4 w-4" />
              Nouvel Article
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-white/5 border border-white/10 mb-8">
          <TabsTrigger value="articles">
            Tous les articles ({articles.length})
          </TabsTrigger>
          <TabsTrigger value="published">
            Publiés ({publishedCount})
          </TabsTrigger>
          <TabsTrigger value="drafts">Brouillons ({draftsCount})</TabsTrigger>
          <TabsTrigger value="sections">
            Sections ({sections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          <div className="rounded-md border border-white/10 bg-card/60 backdrop-blur-sm">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="w-[300px]">Titre</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Dernière modif.</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {articles.length > 0 ? (
                    <SortableTableBody articles={articles} />
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Aucun article trouvé. Commencez par en créer un !
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
        </TabsContent>

        <TabsContent value="published" className="space-y-4">
          <div className="rounded-md border border-white/10 bg-card/60 backdrop-blur-sm">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="w-[300px]">Titre</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Dernière modif.</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {articles.filter((a) => a.is_published).length > 0 ? (
                    <SortableTableBody
                      articles={articles.filter((a) => a.is_published)}
                    />
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Aucun article publié pour le moment.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          <div className="rounded-md border border-white/10 bg-card/60 backdrop-blur-sm">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader className="bg-white/5">
                  <TableRow className="hover:bg-transparent border-white/5">
                    <TableHead className="w-[300px]">Titre</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Dernière modif.</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {articles.filter((a) => !a.is_published).length > 0 ? (
                    <SortableTableBody
                      articles={articles.filter((a) => !a.is_published)}
                    />
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="h-24 text-center text-muted-foreground"
                      >
                        Aucun brouillon. Tous vos articles sont publiés !
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
        </TabsContent>

        <TabsContent value="sections">
          <SectionsManager sections={sections} onSectionsChange={() => setReloadKey((current) => current + 1)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
