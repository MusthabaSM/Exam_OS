"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Plus, Search, Bold, Italic, List, AlignLeft, Book, Save, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Note } from "@prisma/client";
import { createNoteAction, updateNoteAction, deleteNoteAction } from "@/actions/noteActions";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { SmoothInput } from "@/components/ui/SmoothInput";

export default function NotesClient({ initialNotes, examId }: { initialNotes: Note[], examId?: string }) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Content is managed by tiptap, we can extract HTML when saving
    },
    editorProps: {
      attributes: {
        class: 'w-full h-full min-h-[300px] bg-transparent border-none focus:outline-none text-foreground resize-none leading-relaxed placeholder:text-foreground-muted/30',
      },
    },
  });

  // Keep notes state in sync with props
  useEffect(() => {
    setNotes(initialNotes);
    if (activeNote) {
      const updatedActive = initialNotes.find(n => n.id === activeNote.id);
      if (updatedActive) {
        setActiveNote(updatedActive);
        // Only update editor content if it's different to avoid losing cursor position
        if (editor && editor.getHTML() !== updatedActive.content) {
          editor.commands.setContent(updatedActive.content);
        }
      } else {
        setActiveNote(null);
        setTitle("");
        editor?.commands.setContent("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNotes]);

  const handleCreateNote = () => {
    startTransition(async () => {
      const res = await createNoteAction({
        title: "New Note",
        content: "<p></p>",
        examId,
      });
      if (!res.success) {
        alert(res.error);
        return;
      }
      
      handleSelectNote(res.data);
    });
  };

  const handleSelectNote = (note: Note) => {
    setActiveNote(note);
    setTitle(note.title);
    if (editor) {
      editor.commands.setContent(note.content);
    }
  };

  const handleSave = () => {
    if (activeNote && editor) {
      startTransition(async () => {
        const content = editor.getHTML();
        const res = await updateNoteAction({
          id: activeNote.id,
          title,
          content,
        });
        if (!res.success) {
          alert(res.error);
        }
      });
    }
  };

  const handleDelete = () => {
    if (activeNote && confirm("Are you sure you want to delete this note?")) {
      startTransition(async () => {
        const res = await deleteNoteAction({ id: activeNote.id });
        if (res.success) {
          setActiveNote(null);
          setTitle("");
          editor?.commands.setContent("");
        } else {
          alert(res.error);
        }
      });
    }
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] -m-4 md:-m-8 flex flex-col md:flex-row bg-surface">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-r border-border flex flex-col bg-surface shrink-0 h-1/3 md:h-full">
        <div className="p-4 border-b border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium -tracking-[0.01em] text-foreground">Notes</h2>
            <Button size="icon" variant="ghost" onClick={handleCreateNote} disabled={isPending}>
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <SmoothInput 
              type="text" 
              placeholder="Search notes..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.map(note => {
            const strippedContent = note.content.replace(/<[^>]*>?/gm, '').trim();
            const preview = strippedContent.substring(0, 40) || "No content";
            
            return (
              <div 
                key={note.id} 
                onClick={() => handleSelectNote(note)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${activeNote?.id === note.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-surface-hover border border-transparent'}`}
              >
                <h4 className={`text-sm font-semibold mb-1 ${activeNote?.id === note.id ? 'text-primary' : 'text-foreground'}`}>{note.title}</h4>
                <p className="text-xs text-foreground-muted truncate">{preview}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <Book className="w-3 h-3 text-foreground-muted" />
                  <span className="text-[10px] font-medium text-foreground-muted">General</span>
                </div>
              </div>
            );
          })}
          {filteredNotes.length === 0 && (
            <div className="p-4 text-center text-sm text-foreground-muted">No notes found.</div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col h-2/3 md:h-full bg-background">
        {activeNote ? (
          <>
            <div className="p-4 border-b border-border flex flex-wrap items-center justify-between gap-4 bg-surface shrink-0">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`w-8 h-8 shrink-0 ${editor?.isActive('bold') ? 'bg-surface-hover' : ''}`}
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`w-8 h-8 shrink-0 ${editor?.isActive('italic') ? 'bg-surface-hover' : ''}`}
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-1 shrink-0" />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`w-8 h-8 shrink-0 ${editor?.isActive('bulletList') ? 'bg-surface-hover' : ''}`}
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 shrink-0"
                  onClick={() => editor?.chain().focus().unsetAllMarks().run()}
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleDelete} disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
                <Button size="sm" className="gap-2" onClick={handleSave} disabled={isPending}>
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </Button>
              </div>
            </div>
            <div className="flex-1 p-8 overflow-y-auto">
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note Title"
                className="text-4xl font-bold text-foreground bg-transparent border-none focus:outline-none w-full mb-6 placeholder:text-foreground-muted/30"
              />
              <div className="prose prose-sm sm:prose-base focus:outline-none max-w-none text-foreground min-h-[300px]">
                <EditorContent editor={editor} />
              </div>
              <div className="mt-12 pt-6 border-t border-border flex justify-end">
                <Button size="lg" className="gap-2" onClick={handleSave} disabled={isPending}>
                  {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} Save Note
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-foreground-muted flex-col">
            <Book className="w-16 h-16 mb-4 opacity-20" />
            <p>Select a note or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
