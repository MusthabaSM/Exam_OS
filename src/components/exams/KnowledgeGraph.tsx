"use client";
import React from 'react';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 50, y: 50 }, data: { label: 'Calculus I' }, style: { background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '8px' } },
  { id: '2', position: { x: 50, y: 150 }, data: { label: 'Calculus II' }, style: { background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '8px' } },
  { id: '3', position: { x: 250, y: 150 }, data: { label: 'Physics Mechanics' }, style: { background: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)', borderRadius: '8px' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', style: { stroke: 'var(--primary)' } },
  { id: 'e1-3', source: '1', target: '3', style: { stroke: 'var(--primary)' } },
];

export function KnowledgeGraph() {
  return (
    <div className="h-[300px] w-full border border-border rounded-lg overflow-hidden shadow-sm">
      <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
        <Background gap={12} size={1} color="var(--border)" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
