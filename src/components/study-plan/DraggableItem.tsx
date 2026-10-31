"use client";
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export function DraggableItem({ id, title }: { id: string, title: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-4 bg-surface-elevated border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-default"
    >
      <div {...attributes} {...listeners} className="cursor-grab hover:bg-surface-hover p-1 rounded-sm text-foreground-muted" aria-label="Drag handle">
        <GripVertical size={16} />
      </div>
      <span className="font-medium text-foreground">{title}</span>
    </div>
  );
}
