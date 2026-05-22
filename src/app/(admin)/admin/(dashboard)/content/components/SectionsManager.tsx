"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, MoreVertical, Edit, Trash2, Folder, Loader2, Eye, EyeOff } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

type Section = {
  id: string;
  title: string;
  slug: string;
  category: string;
  is_visible?: boolean;
  description?: string;
  icon?: string;
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

type SectionsManagerProps = {
  sections: Section[];
  onSectionsChange?: () => void;
};

export function SectionsManager({ sections, onSectionsChange }: SectionsManagerProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("guide");
  const [description, setDescription] = useState("");
  const [isVisible, setIsVisible] = useState(true);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setCategory("guide");
    setDescription("");
    setIsVisible(true);
    setEditingSection(null);
  };

  const openNew = () => {
    resetForm();
    setIsOpen(true);
  };

  const openEdit = (section: Section) => {
    setEditingSection(section);
    setTitle(section.title);
    setSlug(section.slug);
    setCategory(section.category);
    setDescription(section.description || "");
    setIsVisible(section.is_visible ?? true);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!title || !slug || !category) return;
    setLoading(true);

    try {
      if (editingSection) {
        // Update
        const { error } = await supabaseBrowser
            .from('sections')
            .update({ title, slug, category, description, is_visible: isVisible })
            .eq('id', editingSection.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabaseBrowser
            .from('sections')
            .insert({ title, slug, category, description, is_visible: isVisible });
        if (error) throw error;
      }

      setIsOpen(false);
      resetForm();
      refreshSections();
    } catch (error) {
       console.error(error);
       alert(`Erreur lors de la sauvegarde: ${getErrorMessage(error, "Erreur inconnue.")}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
      if (!confirm("Supprimer cette section supprimera aussi ses articles. Continuer ?")) return;
      
      try {
          const { error: articlesError } = await supabaseBrowser.from('articles').delete().eq('section_id', id);
          if (articlesError) throw articlesError;

          const { error: sectionError } = await supabaseBrowser.from('sections').delete().eq('id', id);
          if (sectionError) throw sectionError;
          refreshSections();
      } catch (error) {
          console.error(error);
          alert(`Erreur lors de la suppression: ${getErrorMessage(error, "Erreur inconnue.")}`);
      }
  }

  const handleVisibilityToggle = async (section: Section) => {
      const nextVisibility = !(section.is_visible ?? true);

      try {
          const { error } = await supabaseBrowser
              .from('sections')
              .update({ is_visible: nextVisibility })
              .eq('id', section.id);
          if (error) throw error;
          refreshSections();
      } catch (error) {
          console.error(error);
          alert(`Erreur lors du changement de visibilite: ${getErrorMessage(error, "Erreur inconnue.")}`);
      }
  }

  // Auto-slug
  const handleTitleChange = (val: string) => {
      setTitle(val);
      if (!editingSection) { // Only auto-slug on create
          setSlug(val.toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, ''));
      }
  }

  const refreshSections = () => {
      if (onSectionsChange) {
          onSectionsChange();
          return;
      }

      router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Liste des Sections</h2>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button onClick={openNew} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" /> Nouvelle Section
            </Button>
          </SheetTrigger>
          <SheetContent className="bg-card border-l border-white/10 text-white">
            <SheetHeader>
              <SheetTitle>{editingSection ? "Modifier la section" : "Créer une section"}</SheetTitle>
              <SheetDescription>
                Configurez la catégorie pour vos articles.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-8">
               <div className="space-y-2">
                 <Label>Titre</Label>
                 <Input value={title} onChange={e => handleTitleChange(e.target.value)} className="bg-white/5" placeholder="ex: Lore" />
               </div>
               <div className="space-y-2">
                 <Label>Slug</Label>
                 <Input value={slug} onChange={e => setSlug(e.target.value)} className="bg-white/5 font-mono text-xs" placeholder="ex: lore" />
               </div>
               <div className="space-y-2">
                 <Label>Catégorie</Label>
                 <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background/50 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                 >
                     <option value="guide">Guide</option>
                     <option value="rp">Lore / RP</option>
                     <option value="reglement">Règlement</option>
                     <option value="system">Système</option>
                 </select>
               </div>
               <div className="space-y-2">
                 <Label>Description (optionnel)</Label>
                 <Input value={description} onChange={e => setDescription(e.target.value)} className="bg-white/5" placeholder="Courte description..." />
               </div>
               <label className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
                 <span>Visible sur le site</span>
                 <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={e => setIsVisible(e.target.checked)}
                    className="h-4 w-4 accent-primary"
                 />
               </label>
               
               <Button onClick={handleSave} disabled={loading} className="w-full">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer
               </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="rounded-md border border-white/10 bg-card/60 backdrop-blur-sm">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow className="hover:bg-transparent border-white/5">
              <TableHead>Titre</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Visibilite</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map((section) => (
              <TableRow key={section.id} className="hover:bg-white/5 border-white/5">
                <TableCell className="font-medium flex items-center gap-2">
                    <Folder className="h-4 w-4 text-blue-400" />
                    {section.title}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{section.slug}</TableCell>
                <TableCell>
                    <Badge variant="outline" className="capitalize">{section.category}</Badge>
                </TableCell>
                <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2 text-muted-foreground hover:bg-white/5 hover:text-white"
                      onClick={() => handleVisibilityToggle(section)}
                    >
                      {(section.is_visible ?? true) ? (
                        <>
                          <Eye className="h-4 w-4 text-primary" />
                          Visible
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 text-red-400" />
                          Masquee
                        </>
                      )}
                    </Button>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(section)}>
                        <Edit className="mr-2 h-4 w-4" /> Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-500 focus:text-red-500" onClick={() => handleDelete(section.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {sections.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">Aucune section trouvée.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
