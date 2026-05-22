"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Blockquote from '@tiptap/extension-blockquote';
import Heading from '@tiptap/extension-heading';
import History from '@tiptap/extension-history'; 
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { TextSelection } from '@tiptap/pm/state';

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
  MoveDown // AJOUT ICI
} from 'lucide-react'; 
import { cn } from '@/lib/utils';
import { type ComponentType, useCallback, useEffect, useRef, useState } from 'react';

type EditorProps = {
  content: string;
  onChange: (html: string) => void;
  editable?: boolean;
  uploadImage?: (file: File) => Promise<string>;
};

export function Editor({ content, onChange, editable = true, uploadImage }: EditorProps) {
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
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
      Image.configure({
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

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-input bg-background/50 rounded-lg overflow-hidden flex flex-col focus-within:ring-1 focus-within:ring-primary/50 transition-all">
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
      {/* Toolbar */}
      {editable && (
          <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/5 bg-white/[0.02]">
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
            </div>
          </div>
      )}
      
      {/* Content Area */}
      <EditorContent editor={editor} className="flex-1 bg-black/20" />
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
