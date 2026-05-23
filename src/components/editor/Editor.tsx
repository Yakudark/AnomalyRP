"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Blockquote from '@tiptap/extension-blockquote';
import Heading from '@tiptap/extension-heading';
import History from '@tiptap/extension-history'; 
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Extension, Mark } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { NodeSelection, TextSelection } from '@tiptap/pm/state';

import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';

import { Button } from '@/components/ui/button';
import {
  Bold as BoldIcon, Italic as ItalicIcon, List, ListOrdered, Quote, Undo, Redo, 
  Heading2, Heading3, Link as LinkIcon, Image as ImageIcon, 
  Table as TableIcon, Table2, 
  Rows3, Columns3, PanelBottomOpen, PanelBottomClose, PanelRightOpen, PanelRightClose,
  TableCellsMerge, TableCellsSplit,
  MoveDown,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Code2,
} from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { type ComponentType, useCallback, useEffect, useRef, useState } from 'react';

type EditorProps = {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  uploadImage?: (file: File) => Promise<string>;
};

const TextColor = Mark.create({
  name: "textColor",

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.style.color || null,
        renderHTML: (attributes) => {
          if (!attributes.color) return {};
          return { style: `color: ${attributes.color}` };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[style*=color]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", HTMLAttributes, 0];
  },
});

const TextAlign = Extension.create({
  name: "textAlign",

  addGlobalAttributes() {
    return [
      {
        types: ["heading", "paragraph"],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (element) => element.style.textAlign || null,
            renderHTML: (attributes) => {
              if (!attributes.textAlign) return {};
              return { style: `text-align: ${attributes.textAlign}` };
            },
          },
        },
      },
    ];
  },
});

const AlignedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      imageAlign: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-align") || null,
        renderHTML: (attributes) => {
          if (attributes.imageAlign === "center") {
            return {
              "data-align": "center",
              style: "display: block; margin-left: auto; margin-right: auto;",
            };
          }

          if (attributes.imageAlign === "right") {
            return {
              "data-align": "right",
              style: "display: block; margin-left: auto; margin-right: 0;",
            };
          }

          if (attributes.imageAlign === "left") {
            return {
              "data-align": "left",
              style: "display: block; margin-left: 0; margin-right: auto;",
            };
          }

          return {};
        },
      },
    };
  },
});

export function Editor({ content, onChange, editable = true, uploadImage }: EditorProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const editorShellRef = useRef<HTMLDivElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [htmlMode, setHtmlMode] = useState(false);
  const [selectedImagePos, setSelectedImagePos] = useState<number | null>(null);
  const [selectedImageAlign, setSelectedImageAlign] = useState<string | null>(null);
  const [imageMenuPosition, setImageMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      TextColor,
      TextAlign,
      BulletList,
      OrderedList,
      ListItem,
      Blockquote,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      History, 
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
        },
      }),
      AlignedImage.configure({
         HTMLAttributes: {
            class: 'rounded-lg border border-white/10 my-4',
         }
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[300px] px-6 py-4 text-white',
      },
      handleClick(view, _pos, event) {
        const target = event.target instanceof Element ? event.target.closest("img") : null;
        if (!(target instanceof HTMLImageElement)) return false;

        event.preventDefault();
        event.stopPropagation();

        const imagePosition = findImagePositionByElement(view.dom, view.state.doc, target);
        if (imagePosition === null) return false;

        selectImageAtPosition(imagePosition);
        setImageMenuFromElement(target);

        return true;
      },
      handleClickOn(view, pos, node) {
        if (node.type.name !== "image") return false;

        const transaction = view.state.tr.setSelection(NodeSelection.create(view.state.doc, pos));
        view.dispatch(transaction);
        setSelectedImagePos(pos);
        setSelectedImageAlign(node.attrs.imageAlign || null);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editable,
    immediatelyRender: false,
  });

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  useEffect(() => {
    if (!editor || editor.getHTML() === content) return;

    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;

    const syncSelectedImage = () => {
      const selection = editor.state.selection;

      if (selection instanceof NodeSelection && selection.node.type.name === "image") {
        setSelectedImagePos(selection.from);
        setSelectedImageAlign(selection.node.attrs.imageAlign || null);
        return;
      }

      setSelectedImagePos(null);
      setSelectedImageAlign(null);
      setImageMenuPosition(null);
    };

    editor.on("selectionUpdate", syncSelectedImage);
    return () => {
      editor.off("selectionUpdate", syncSelectedImage);
    };
  }, [editor]);

  const insertImageFromUrl = useCallback(() => {
    if (!editor) return;
    const url = window.prompt("URL de l'image:");

    if (!url) return;

    editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const handleImageClick = useCallback(() => {
    if (uploadImage) {
      imageInputRef.current?.click();
      return;
    }

    insertImageFromUrl();
  }, [insertImageFromUrl, uploadImage]);

  const handleImageFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = "";

      if (!file || !editor || !uploadImage) return;

      setUploadingImage(true);

      try {
        const url = await uploadImage(file);
        editor.chain().focus().setImage({ src: url }).run();
      } catch (error) {
        window.alert(error instanceof Error ? error.message : "Impossible d'envoyer l'image.");
      } finally {
        setUploadingImage(false);
      }
    },
    [editor, uploadImage]
  );

  const insertParagraphAfterTable = useCallback(() => {
    if (!editor) return;

    editor
      .chain()
      .focus()
      .command(({ state, dispatch }) => {
        const { $from } = state.selection;
        let tableDepth: number | null = null;

        for (let depth = $from.depth; depth > 0; depth -= 1) {
          if ($from.node(depth).type.name === "table") {
            tableDepth = depth;
            break;
          }
        }

        if (tableDepth === null) {
          return editor.commands.insertContent("<p></p>");
        }

        const insertPosition = $from.after(tableDepth);
        const paragraph = state.schema.nodes.paragraph.create();

        if (!dispatch) return true;

        const transaction = state.tr.insert(insertPosition, paragraph);
        transaction.setSelection(TextSelection.near(transaction.doc.resolve(insertPosition + 1)));
        dispatch(transaction.scrollIntoView());

        return true;
      })
      .run();
  }, [editor]);

  const setTextAlign = useCallback(
    (textAlign: "left" | "center" | "right") => {
      if (!editor) return;

      if (editor.isActive("heading")) {
        editor.chain().focus().updateAttributes("heading", { textAlign }).run();
        return;
      }

      editor.chain().focus().updateAttributes("paragraph", { textAlign }).run();
    },
    [editor]
  );

  const setTextColor = useCallback(
    (color: "#ef4444" | "#22c55e") => {
      editor?.chain().focus().setMark("textColor", { color }).run();
    },
    [editor]
  );

  const unsetTextColor = useCallback(() => {
    editor?.chain().focus().unsetMark("textColor").run();
  }, [editor]);

  const selectImageAtPosition = useCallback(
    (position: number) => {
      if (!editor) return false;

      const node = editor.state.doc.nodeAt(position);
      if (!node || node.type.name !== "image") return false;

      const transaction = editor.state.tr.setSelection(NodeSelection.create(editor.state.doc, position));
      editor.view.dispatch(transaction);
      editor.view.focus();
      setSelectedImagePos(position);
      setSelectedImageAlign(node.attrs.imageAlign || null);

      return true;
    },
    [editor]
  );

  const setImageMenuFromElement = useCallback((imageElement: HTMLImageElement) => {
    const rect = imageElement.getBoundingClientRect();
    setImageMenuPosition({
      left: rect.left + rect.width / 2,
      top: Math.max(rect.top - 12, 12),
    });
  }, []);

  const setImageAlign = useCallback(
    (imageAlign: "left" | "center" | "right") => {
      if (!editor) return;

      const position = selectedImagePos ?? editor.state.selection.from;
      const node = editor.state.doc.nodeAt(position);

      if (node?.type.name === "image") {
        const transaction = editor.state.tr.setNodeMarkup(position, undefined, { ...node.attrs, imageAlign });
        transaction.setSelection(NodeSelection.create(transaction.doc, position));
        editor.view.dispatch(transaction);
        editor.view.focus();
        setSelectedImagePos(position);
        setSelectedImageAlign(imageAlign);
        const imageElement = getImageElementByPosition(editor.view.dom, editor.state.doc, position);
        if (imageElement) {
          window.requestAnimationFrame(() => setImageMenuFromElement(imageElement));
        }
        return;
      }

      editor.chain().focus().updateAttributes("image", { imageAlign }).run();
    },
    [editor, selectedImagePos, setImageMenuFromElement]
  );

  const handleEditorMouseDownCapture = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!editor) return;

      const target = event.target instanceof Element ? event.target.closest("img") : null;
      if (!(target instanceof HTMLImageElement)) return;

      const imagePosition = findImagePositionByElement(editor.view.dom, editor.state.doc, target);
      if (imagePosition === null) return;

      event.preventDefault();
      event.stopPropagation();
      selectImageAtPosition(imagePosition);
      setImageMenuFromElement(target);
    },
    [editor, selectImageAtPosition, setImageMenuFromElement]
  );

  if (!editor) {
    return null;
  }

  return (
    <div ref={editorShellRef} className="flex flex-col rounded-lg border border-input bg-background/50 transition-all focus-within:ring-1 focus-within:ring-primary/50">
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
      {/* Toolbar */}
      {editable && (
          <div className="sticky top-4 z-20 flex flex-wrap items-center gap-1 rounded-t-lg border-b border-white/5 bg-background/95 p-2 shadow-[0_8px_18px_rgba(0,0,0,0.25)] backdrop-blur">
            <ToolbarButton 
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive('bold')}
                icon={BoldIcon}
                tooltip="Gras"
            />
            <ToolbarButton 
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive('italic')}
                icon={ItalicIcon}
                tooltip="Italique"
            />
            <ToolbarButton
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                active={editor.isActive('underline')}
                icon={UnderlineIcon}
                tooltip="Souligné"
            />
            <div className="w-px h-6 bg-white/10 mx-1" />
            <ToolbarButton
                onClick={() => setTextAlign("left")}
                active={editor.isActive({ textAlign: "left" })}
                icon={AlignLeft}
                tooltip="Aligner à gauche"
            />
            <ToolbarButton
                onClick={() => setTextAlign("center")}
                active={editor.isActive({ textAlign: "center" })}
                icon={AlignCenter}
                tooltip="Centrer"
            />
            <ToolbarButton
                onClick={() => setTextAlign("right")}
                active={editor.isActive({ textAlign: "right" })}
                icon={AlignRight}
                tooltip="Aligner à droite"
            />
            <button
                type="button"
                onClick={() => setTextColor("#ef4444")}
                className={cn(
                  "h-8 w-8 rounded-md border border-transparent bg-red-500 text-xs font-bold text-white hover:border-white/20",
                  editor.isActive("textColor", { color: "#ef4444" }) && "ring-2 ring-primary"
                )}
                title="Texte rouge"
            >
              R
            </button>
            <button
                type="button"
                onClick={() => setTextColor("#22c55e")}
                className={cn(
                  "h-8 w-8 rounded-md border border-transparent bg-green-500 text-xs font-bold text-white hover:border-white/20",
                  editor.isActive("textColor", { color: "#22c55e" }) && "ring-2 ring-primary"
                )}
                title="Texte vert"
            >
              V
            </button>
            <button
                type="button"
                onClick={unsetTextColor}
                className="h-8 rounded-md px-2 text-xs font-semibold text-muted-foreground hover:bg-white/10 hover:text-white"
                title="Retirer la couleur"
            >
              Auto
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <ToolbarButton 
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor.isActive('heading', { level: 2 })}
                icon={Heading2}
                tooltip="Titre 2"
            />
            <ToolbarButton 
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                active={editor.isActive('heading', { level: 3 })}
                icon={Heading3}
                tooltip="Titre 3"
            />
            <div className="w-px h-6 bg-white/10 mx-1" />
            <ToolbarButton 
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive('bulletList')}
                icon={List}
                tooltip="Liste à puces"
            />
            <ToolbarButton 
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive('orderedList')}
                icon={ListOrdered}
                tooltip="Liste numérotée"
            />
            <ToolbarButton 
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                active={editor.isActive('blockquote')}
                icon={Quote}
                tooltip="Citation"
            />
            <div className="w-px h-6 bg-white/10 mx-1" />
            <ToolbarButton 
                onClick={setLink}
                active={editor.isActive('link')}
                icon={LinkIcon}
                tooltip="Lien"
            />
            <ToolbarButton 
                onClick={handleImageClick}
                active={editor.isActive('image')}
                icon={ImageIcon}
                tooltip={uploadImage ? "Importer une image" : "Image"}
                disabled={uploadingImage}
            />
            <ToolbarButton
                onClick={() => setImageAlign("left")}
                active={selectedImageAlign === "left"}
                icon={AlignLeft}
                tooltip="Image à gauche"
                disabled={selectedImagePos === null}
            />
            <ToolbarButton
                onClick={() => setImageAlign("center")}
                active={selectedImageAlign === "center"}
                icon={AlignCenter}
                tooltip="Centrer l'image"
                disabled={selectedImagePos === null}
            />
            <ToolbarButton
                onClick={() => setImageAlign("right")}
                active={selectedImageAlign === "right"}
                icon={AlignRight}
                tooltip="Image à droite"
                disabled={selectedImagePos === null}
            />
            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Boutons pour les tableaux */}
            <ToolbarButton 
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                active={editor.isActive('table')}
                icon={TableIcon}
                tooltip="Insérer un tableau (3x3)"
            />
            <ToolbarButton 
                onClick={() => editor.chain().focus().addRowAfter().run()}
                active={false}
                icon={PanelBottomOpen} 
                tooltip="Ajouter une ligne en dessous"
                disabled={!editor.isActive('table')}
            />
            <ToolbarButton 
                onClick={() => editor.chain().focus().deleteRow().run()}
                active={false}
                icon={PanelBottomClose} 
                tooltip="Supprimer la ligne active"
                disabled={!editor.isActive('table')}
            />
            <ToolbarButton 
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                active={false}
                icon={PanelRightOpen} 
                tooltip="Ajouter une colonne à droite"
                disabled={!editor.isActive('table')}
            />
            <ToolbarButton 
                onClick={() => editor.chain().focus().deleteColumn().run()}
                active={false}
                icon={PanelRightClose} 
                tooltip="Supprimer la colonne active"
                disabled={!editor.isActive('table')}
            />
            <ToolbarButton 
                onClick={() => editor.chain().focus().deleteTable().run()}
                active={editor.isActive('table')}
                icon={Table2} 
                tooltip="Supprimer le tableau"
                disabled={!editor.isActive('table')}
            />
            <div className="w-px h-6 bg-white/10 mx-1" />
            <ToolbarButton 
                onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
                active={editor.isActive('tableHeader')}
                icon={Columns3} 
                tooltip="Activer/Désactiver l'en-tête de colonne"
                disabled={!editor.isActive('table')}
            />
            <ToolbarButton 
                onClick={() => editor.chain().focus().toggleHeaderRow().run()}
                active={editor.isActive('tableHeader')}
                icon={Rows3} 
                tooltip="Activer/Désactiver l'en-tête de ligne"
                disabled={!editor.isActive('table')}
            />
            <ToolbarButton 
                onClick={() => editor.chain().focus().mergeCells().run()}
                active={editor.isActive('tableCell', { colspan: null })}
                icon={TableCellsMerge}
                tooltip="Fusionner les cellules"
                disabled={!editor.can().mergeCells()}
            />
            <ToolbarButton 
                onClick={() => editor.chain().focus().splitCell().run()}
                active={editor.isActive('tableCell', { colspan: 1 })}
                icon={TableCellsSplit}
                tooltip="Diviser la cellule"
                disabled={!editor.can().splitCell()}
            />
            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* Nouveau bouton: Ajouter un paragraphe en dessous */} 
            <ToolbarButton
                onClick={insertParagraphAfterTable}
                active={false}
                icon={MoveDown}
                tooltip="Ajouter un paragraphe en dessous"
            />
            <div className="w-px h-6 bg-white/10 mx-1" />

            <div className="ml-auto flex items-center gap-1">
                <ToolbarButton 
                    onClick={() => editor.chain().focus().undo().run()}
                    active={false}
                    icon={Undo}
                    tooltip="Annuler"
                    disabled={!editor.can().undo()}
                />
                <ToolbarButton 
                    onClick={() => editor.chain().focus().redo().run()}
                    active={false}
                    icon={Redo}
                    tooltip="Rétablir"
                    disabled={!editor.can().redo()}
                />
                <ToolbarButton
                    onClick={() => setHtmlMode((current) => !current)}
                    active={htmlMode}
                    icon={Code2}
                    tooltip="Afficher le HTML"
                />
            </div>
          </div>
      )}
      
      {/* Content Area */}
      {htmlMode ? (
        <textarea
          value={content}
          onChange={(event) => {
            const html = event.target.value;
            onChange(html);
            editor.commands.setContent(html, { emitUpdate: false });
          }}
          className="min-h-[300px] w-full flex-1 resize-y bg-black/20 px-6 py-4 font-mono text-sm text-white outline-none"
          spellCheck={false}
        />
      ) : (
        <div onMouseDownCapture={handleEditorMouseDownCapture}>
          <EditorContent editor={editor} className="flex-1 bg-black/20" />
        </div>
      )}
      {editable && imageMenuPosition && selectedImagePos !== null && (
        <div
          className="fixed z-[200] flex -translate-x-1/2 -translate-y-full items-center gap-1 rounded-md border border-primary/30 bg-[#081108] p-1 shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
          style={{ left: imageMenuPosition.left, top: imageMenuPosition.top }}
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
        >
          <ToolbarButton
            onClick={() => setImageAlign("left")}
            active={selectedImageAlign === "left"}
            icon={AlignLeft}
            tooltip="Image à gauche"
          />
          <ToolbarButton
            onClick={() => setImageAlign("center")}
            active={selectedImageAlign === "center"}
            icon={AlignCenter}
            tooltip="Centrer l'image"
          />
          <ToolbarButton
            onClick={() => setImageAlign("right")}
            active={selectedImageAlign === "right"}
            icon={AlignRight}
            tooltip="Image à droite"
          />
        </div>
      )}
    </div>
  );
}

type ToolbarButtonProps = {
    onClick: () => void;
    active: boolean;
    icon: ComponentType<{ className?: string }>;
    tooltip: string;
    disabled?: boolean;
};

function ToolbarButton({ onClick, active, icon: Icon, tooltip, disabled }: ToolbarButtonProps) {
    return (
        <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "h-8 w-8 p-0 text-muted-foreground hover:text-white hover:bg-white/10",
                active && "bg-primary/20 text-primary hover:bg-primary/30",
                disabled && "opacity-50 cursor-not-allowed"
            )}
            title={tooltip}
        >
            <Icon className="h-4 w-4" />
        </Button>
    )
}

function findImagePositionByElement(
  editorRoot: HTMLElement,
  doc: ProseMirrorNode,
  imageElement: HTMLImageElement
) {
  const imageElements = Array.from(editorRoot.querySelectorAll("img"));
  const imageIndex = imageElements.indexOf(imageElement);
  if (imageIndex < 0) return null;

  let currentImageIndex = 0;
  let imagePosition: number | null = null;

  doc.descendants((node, position) => {
    if (node.type.name !== "image") return true;
    if (imagePosition !== null) return false;

    if (currentImageIndex === imageIndex) {
      imagePosition = position;
      return false;
    }

    currentImageIndex += 1;
    return true;
  });

  return imagePosition;
}

function getImageElementByPosition(
  editorRoot: HTMLElement,
  doc: ProseMirrorNode,
  imagePosition: number
) {
  let imageIndex: number | null = null;
  let currentImageIndex = 0;

  doc.descendants((node, position) => {
    if (node.type.name !== "image") return true;

    if (position === imagePosition) {
      imageIndex = currentImageIndex;
      return false;
    }

    currentImageIndex += 1;
    return true;
  });

  if (imageIndex === null) return null;

  return editorRoot.querySelectorAll("img")[imageIndex] ?? null;
}
