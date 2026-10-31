"use client";

import dynamic from 'next/dynamic';
import React from 'react';

const PdfViewer = dynamic(() => import('./PdfViewer').then(mod => mod.PdfViewer), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-foreground-muted min-h-[600px]">Loading PDF Viewer...</div>
});

interface PdfViewerDynamicProps {
  url: string;
  title?: string;
}

export function PdfViewerDynamic(props: PdfViewerDynamicProps) {
  return <PdfViewer {...props} />;
}
