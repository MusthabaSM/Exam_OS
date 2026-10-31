"use client";
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

export function StudyEditor() {
  const editor = useEditor({
    extensions: [StarterKit],
    content: '<p>Start typing your study notes here...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose-base focus:outline-none min-h-[150px] p-4 text-foreground',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-border rounded-lg bg-surface overflow-hidden shadow-sm">
      <div className="border-b border-border bg-surface-hover p-2 flex gap-2">
        <button 
          onClick={() => editor.chain().focus().toggleBold().run()} 
          className={`px-2 py-1 rounded-sm text-sm font-medium ${editor.isActive('bold') ? 'bg-primary text-primary-foreground' : 'text-foreground-muted hover:text-foreground'}`}
        >
          Bold
        </button>
        <button 
          onClick={() => editor.chain().focus().toggleItalic().run()} 
          className={`px-2 py-1 rounded-sm text-sm font-medium ${editor.isActive('italic') ? 'bg-primary text-primary-foreground' : 'text-foreground-muted hover:text-foreground'}`}
        >
          Italic
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
