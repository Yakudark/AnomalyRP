"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, EyeOff, ImagePlus, Loader2, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadAdminImage } from "@/lib/upload-image";
import { supabaseBrowser } from "@/lib/supabase-browser";

type GalleryImage = {
  id: string;
  image_url: string;
  alt_text: string | null;
  object_position_x: number;
  object_position_y: number;
  is_visible: boolean;
  order_index: number;
  created_at: string;
};

type GalleryResponse = {
  images?: GalleryImage[];
  error?: string;
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function GallerySettingsPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const getAuthHeaders = useCallback(async () => {
    const { data } = await supabaseBrowser.auth.getSession();
    const token = data.session?.access_token;

    if (!token) {
      throw new Error("Session admin introuvable. Reconnecte-toi a l'administration.");
    }

    return { Authorization: `Bearer ${token}` };
  }, []);

  const loadGallery = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/gallery", { headers });
      const payload = (await response.json().catch(() => null)) as GalleryResponse | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de charger la galerie.");
      }

      setImages(payload?.images ?? []);
    } catch (loadError) {
      setError(getErrorMessage(loadError, "Impossible de charger la galerie."));
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const addImage = async (file: File) => {
    setUploading(true);
    setError(null);
    setSaved(false);

    try {
      const imageUrl = await uploadAdminImage(file);
      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl,
          altText: file.name.replace(/\.[^.]+$/, ""),
          isVisible: true,
          orderIndex: images.length,
        }),
      });
      const payload = (await response.json().catch(() => null)) as GalleryResponse | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible d'ajouter l'image.");
      }

      await loadGallery();
      setSaved(true);
    } catch (uploadError) {
      setError(getErrorMessage(uploadError, "Impossible d'ajouter l'image."));
    } finally {
      setUploading(false);
    }
  };

  const updateImage = async (
    image: GalleryImage,
    patch: Partial<Pick<GalleryImage, "alt_text" | "is_visible" | "order_index" | "object_position_x" | "object_position_y">>
  ) => {
    setSavingId(image.id);
    setError(null);
    setSaved(false);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: image.id,
          altText: patch.alt_text,
          isVisible: patch.is_visible,
          orderIndex: patch.order_index,
          objectPositionX: patch.object_position_x,
          objectPositionY: patch.object_position_y,
        }),
      });
      const payload = (await response.json().catch(() => null)) as GalleryResponse | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de modifier l'image.");
      }

      await loadGallery();
      setSaved(true);
    } catch (updateError) {
      setError(getErrorMessage(updateError, "Impossible de modifier l'image."));
    } finally {
      setSavingId(null);
    }
  };

  const deleteImage = async (image: GalleryImage) => {
    if (!confirm("Supprimer cette image de la galerie ?")) return;

    setSavingId(image.id);
    setError(null);
    setSaved(false);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/admin/gallery?id=${image.id}`, {
        method: "DELETE",
        headers,
      });
      const payload = (await response.json().catch(() => null)) as GalleryResponse | null;

      if (!response.ok) {
        throw new Error(payload?.error || "Impossible de supprimer l'image.");
      }

      await loadGallery();
      setSaved(true);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError, "Impossible de supprimer l'image."));
    } finally {
      setSavingId(null);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    for (const file of files) {
      await addImage(file);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-400">Administration</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Galerie</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Ajoutez les images de la galerie et choisissez lesquelles sont visibles sur le site.
          </p>
        </div>

        <div>
          <input ref={fileInputRef} type="file" accept="image/gif,image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleFileChange} />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-red-500 text-white hover:bg-red-600"
            disabled={uploading || loading}
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Ajouter des images
          </Button>
        </div>
      </div>

      {loading && <div className="border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white">Chargement...</div>}
      {error && <div className="border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">{error}</div>}
      {saved && <div className="border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-medium text-green-300">Galerie mise a jour.</div>}

      {!loading && images.length === 0 && (
        <section className="grid min-h-72 place-items-center border border-dashed border-white/10 bg-[#111217] p-8 text-center">
          <div>
            <ImagePlus className="mx-auto h-10 w-10 text-red-400" />
            <h2 className="mt-4 text-lg font-semibold text-white">Aucune image</h2>
            <p className="mt-2 text-sm text-muted-foreground">Ajoutez vos premieres images pour alimenter la galerie publique.</p>
          </div>
        </section>
      )}

      {images.length > 0 && (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {images.map((image, imageIndex) => (
            <article key={image.id} className="border border-white/10 bg-[#111217] p-4 shadow-2xl">
              <div className="relative aspect-video overflow-hidden border border-white/10 bg-black/30">
                <Image
                  src={image.image_url}
                  alt={image.alt_text || "Image galerie"}
                  fill
                  className="object-cover"
                  style={{ objectPosition: `${image.object_position_x}% ${image.object_position_y}%` }}
                />
              </div>

              <div className="mt-4 grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor={`alt-${image.id}`} className="text-white">Texte alternatif</Label>
                  <Input
                    id={`alt-${image.id}`}
                    value={image.alt_text ?? ""}
                    onChange={(event) => {
                      const altText = event.target.value;
                      setImages((current) =>
                        current.map((item) => (item.id === image.id ? { ...item, alt_text: altText } : item))
                      );
                    }}
                    className="border-white/10 bg-black/20 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`order-${image.id}`} className="text-white">Ordre</Label>
                  <Input
                    id={`order-${image.id}`}
                    type="number"
                    value={image.order_index}
                    onChange={(event) => {
                      const orderIndex = Number(event.target.value);
                      setImages((current) =>
                        current.map((item) => (item.id === image.id ? { ...item, order_index: orderIndex } : item))
                      );
                    }}
                    className="border-white/10 bg-black/20 text-white"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor={`position-x-${image.id}`} className="text-white">
                      Cadrage horizontal ({image.object_position_x}%)
                    </Label>
                    <Input
                      id={`position-x-${image.id}`}
                      type="range"
                      min={0}
                      max={100}
                      value={image.object_position_x}
                      onChange={(event) => {
                        const positionX = Number(event.target.value);
                        setImages((current) =>
                          current.map((item) => (item.id === image.id ? { ...item, object_position_x: positionX } : item))
                        );
                      }}
                      className="border-white/10 bg-black/20 text-white accent-red-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`position-y-${image.id}`} className="text-white">
                      Cadrage vertical ({image.object_position_y}%)
                    </Label>
                    <Input
                      id={`position-y-${image.id}`}
                      type="range"
                      min={0}
                      max={100}
                      value={image.object_position_y}
                      onChange={(event) => {
                        const positionY = Number(event.target.value);
                        setImages((current) =>
                          current.map((item) => (item.id === image.id ? { ...item, object_position_y: positionY } : item))
                        );
                      }}
                      className="border-white/10 bg-black/20 text-white accent-red-500"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    onClick={() =>
                      updateImage(image, {
                        alt_text: image.alt_text,
                        order_index: image.order_index,
                        object_position_x: image.object_position_x,
                        object_position_y: image.object_position_y,
                      })
                    }
                    disabled={savingId === image.id}
                  >
                    {savingId === image.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Enregistrer
                  </Button>
                  <Button
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    onClick={() => updateImage(image, { is_visible: !image.is_visible })}
                    disabled={savingId === image.id}
                  >
                    {image.is_visible ? <Eye className="h-4 w-4 text-green-400" /> : <EyeOff className="h-4 w-4 text-red-400" />}
                    {image.is_visible ? "Visible" : "Masquee"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-muted-foreground hover:bg-red-500/10 hover:text-red-300"
                    onClick={() => deleteImage(image)}
                    disabled={savingId === image.id}
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Position actuelle : {imageIndex + 1}</p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
