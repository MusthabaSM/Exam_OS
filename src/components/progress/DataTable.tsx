"use client";
import React from 'react';
import {
  useLegacyTable as useReactTable,
  getCoreRowModel,
  LegacyColumnDef,
} from '@tanstack/react-table/legacy';
import { flexRender } from '@tanstack/react-table';

type TopicProgress = {
  id: string;
  name: string;
  mastery: number;
  status: 'Needs Review' | 'On Track' | 'Mastered';
};

const defaultData: TopicProgress[] = [
  { id: '1', name: 'Calculus Fundamentals', mastery: 85, status: 'On Track' },
  { id: '2', name: 'Cellular Biology', mastery: 40, status: 'Needs Review' },
  { id: '3', name: 'World History - WWII', mastery: 95, status: 'Mastered' },
];

const columns: LegacyColumnDef<TopicProgress>[] = [
  {
    accessorKey: 'name',
    header: 'Topic Name',
    cell: info => <span className="font-medium text-foreground">{String(info.getValue())}</span>
  },
  {
    accessorKey: 'mastery',
    header: 'Mastery',
    cell: info => <span className="tabular-nums text-foreground-muted">{String(info.getValue())}%</span>
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: info => {
      const val = String(info.getValue());
      const color = val === 'Mastered' ? 'text-success' : val === 'On Track' ? 'text-primary' : 'text-destructive';
      return <span className={`text-sm font-medium ${color}`}>{val}</span>;
    }
  }
];

export function DataTable() {
  const [data] = React.useState(() => [...defaultData]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-surface shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-hover border-b border-border">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th key={header.id} className="p-3 font-medium text-foreground-muted uppercase tracking-wider text-xs">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-border">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="hover:bg-surface-hover transition-colors">
              {row.getAllCells().map(cell => (
                <td key={cell.id} className="p-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
