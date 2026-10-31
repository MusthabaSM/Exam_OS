"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for pdf.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  title?: string;
}

export function PdfViewer({ url, title }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isToolbarVisible, setIsToolbarVisible] = useState(true);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5));
  const prevPage = () => setPageNumber((prev) => Math.max(prev - 1, 1));
  const nextPage = () => setPageNumber((prev) => (numPages ? Math.min(prev + 1, numPages) : prev));
  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  useEffect(() => {
    if (!isFullscreen) {
      setIsToolbarVisible(true);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // If mouse is in the top 120px, show toolbar
      if (e.clientY <= 120) {
        setIsToolbarVisible(true);
        if (hideTimeoutRef.current) {
          clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }
      } else {
        // If mouse is below and toolbar is visible, start hide timer
        if (!hideTimeoutRef.current && isToolbarVisible) {
          hideTimeoutRef.current = setTimeout(() => {
            setIsToolbarVisible(false);
            hideTimeoutRef.current = null;
          }, 2000);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    
    // Initial hide timer when entering fullscreen
    if (!hideTimeoutRef.current && isToolbarVisible) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsToolbarVisible(false);
        hideTimeoutRef.current = null;
      }, 2000);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isFullscreen, isToolbarVisible]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setPageNumber((prev) => Math.max(prev - 1, 1));
      } else if (e.key === 'ArrowRight') {
        setPageNumber((prev) => (numPages ? Math.min(prev + 1, numPages) : prev));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [numPages]);

  // Touch handlers for swiping
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    if (swipeDistance > 50) {
      // Swiped left -> next page
      nextPage();
    } else if (swipeDistance < -50) {
      // Swiped right -> prev page
      prevPage();
    }
  };

  return (
    <div className={cn(
      "flex flex-col shadow-sm bg-surface overflow-hidden relative",
      isFullscreen 
        ? "fixed inset-0 z-[100] rounded-none border-0" 
        : "h-full border border-border rounded-xl"
    )}>
      {/* Toolbar */}
      <div 
        className={cn(
          "flex items-center justify-between px-4 py-3 bg-surface-elevated border-b border-border transition-transform duration-300 ease-in-out",
          isFullscreen ? "absolute top-0 left-0 right-0 z-10 shadow-md" : "relative",
          isFullscreen && !isToolbarVisible ? "-translate-y-full" : "translate-y-0"
        )}
      >
        <div className="font-medium text-foreground truncate max-w-[150px] sm:max-w-xs md:max-w-md">
          {title || 'Document'}
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-surface border border-border rounded-md">
            <button onClick={zoomOut} className="p-1.5 hover:bg-surface-hover text-foreground-muted hover:text-foreground transition-colors disabled:opacity-50">
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium px-2 text-foreground w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button onClick={zoomIn} className="p-1.5 hover:bg-surface-hover text-foreground-muted hover:text-foreground transition-colors disabled:opacity-50">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Pagination */}
          <div className="flex items-center bg-surface border border-border rounded-md">
            <button onClick={prevPage} disabled={pageNumber <= 1} className="p-1.5 hover:bg-surface-hover text-foreground-muted hover:text-foreground transition-colors disabled:opacity-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium px-2 text-foreground w-16 text-center">
              {pageNumber} / {numPages || '-'}
            </span>
            <button onClick={nextPage} disabled={!numPages || pageNumber >= numPages} className="p-1.5 hover:bg-surface-hover text-foreground-muted hover:text-foreground transition-colors disabled:opacity-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => window.open(url, '_blank')} title="Download">
            <Download className="w-4 h-4" />
          </Button>

          <Button variant="outline" size="icon" className="h-8 w-8" onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Hover area to ensure the toolbar appears even if mouse leaves too quickly */}
      {isFullscreen && (
        <div 
          className="absolute top-0 left-0 right-0 h-10 z-0 bg-transparent" 
          onMouseEnter={() => {
            setIsToolbarVisible(true);
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
              hideTimeoutRef.current = null;
            }
          }} 
        />
      )}

      {/* PDF Container */}
      <div 
        className={cn(
          "flex-1 overflow-auto relative flex justify-center p-4 min-h-[600px]",
          isFullscreen ? "bg-black/50" : "bg-surface-hover/50"
        )}
        style={{ paddingTop: isFullscreen ? '4rem' : '1rem' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-full text-foreground-muted">
              Loading document...
            </div>
          }
          error={
            <div className="flex items-center justify-center h-full text-danger">
              Failed to load PDF file.
            </div>
          }
          className="flex flex-col items-center"
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="shadow-md bg-white transition-transform"
            loading={
              <div className="flex items-center justify-center h-[800px] w-[600px] bg-surface text-foreground-muted">
                Loading page...
              </div>
            }
          />
        </Document>
      </div>
    </div>
  );
}
