"use client";

import React, { useState, useRef, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, MoreHorizontal, Filter, Search, Loader2, Trash2, Eye, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Document, DocumentType, DocumentStatus } from "@prisma/client";
import { createDocumentAction, deleteDocumentAction, searchDocumentsTextAction } from "@/actions/documentActions";
import { LemniscateBloom } from "@/components/loading/LemniscateBloom";

export default function MaterialsClient({ examId, initialDocuments }: { examId: string, initialDocuments: Document[] }) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [deepSearchResults, setDeepSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (search.trim().length < 3) {
      setDeepSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchDocumentsTextAction(search);
      if (res.success) {
        setDeepSearchResults(res.data || []);
      }
      setIsSearching(false);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleUploadClick = () => {
    setIsUploading(!isUploading);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (file.type !== "application/pdf") {
        alert("Only PDF files are supported.");
        return;
      }
      
      if (file.size > 250 * 1024 * 1024) {
        alert("File size exceeds 250MB limit.");
        return;
      }

      setIsProcessing(true);
      
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        
        // Generate a unique path for the file
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${examId}/${fileName}`;
        
        // Upload to Supabase Storage
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('exam-documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Generate signed URL so backend can bypass RLS during processing
        const { data: signedData } = await supabase.storage
          .from('exam-documents')
          .createSignedUrl(uploadData.path, 3600);
        const signedUrl = signedData?.signedUrl;

        // Create the database record
        startTransition(async () => {
          const res = await createDocumentAction({
            examId,
            name: file.name,
            originalFilename: file.name,
            mimeType: file.type || "application/pdf",
            fileSize: file.size,
            documentType: DocumentType.OTHER,
            status: DocumentStatus.UPLOADED,
            storageKey: uploadData.path
          });

          if (!res.success) {
            alert(res.error);
          } else {
            // Trigger processing asynchronously with signed URL
            fetch(`/api/documents/${res.data.id}/process`, { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ signedUrl })
            }).catch(console.error);
          }
          setIsProcessing(false);
          setIsUploading(false);
        });
      } catch (err: any) {
        alert(err.message || "An error occurred during upload.");
        setIsProcessing(false);
        setIsUploading(false);
      }
    }
  };

  const handleDeleteDocument = (docId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    startTransition(async () => {
      const res = await deleteDocumentAction(docId, examId);
      if (!res.success) {
        alert(res.error);
      }
    });
  };

  const handleRetryProcessing = async (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      let signedUrl;
      if (doc.storageKey) {
        const { data } = await supabase.storage.from('exam-documents').createSignedUrl(doc.storageKey, 3600);
        signedUrl = data?.signedUrl;
      }
      
      fetch(`/api/documents/${doc.id}/process`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedUrl })
      }).catch(console.error);
      
      alert('Processing retried. Please wait a moment and refresh.');
    } catch (err) {
      console.error(err);
      alert('Failed to retry processing');
    }
  };

  const filteredDocuments = initialDocuments.filter(doc => doc.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium -tracking-[0.01em] text-foreground">Study Materials</h2>
          <p className="text-sm text-foreground-muted mt-1">Manage notifications, PDFs, and notes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleUploadClick}>
            <Upload className="w-4 h-4" /> Add Material
          </Button>
        </div>
      </div>

      {isUploading && (
        <div className="p-8 border-2 border-dashed border-border rounded-xl bg-surface flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-top-4 duration-300 min-h-[300px]">
          {isProcessing || isPending ? (
            <div className="text-primary mb-4">
              <LemniscateBloom size={100} />
            </div>
          ) : (
            <Upload className="w-10 h-10 text-foreground-muted mb-4" />
          )}
          <h3 className="text-lg font-medium text-foreground mb-1">
            {isProcessing || isPending ? (
              <span className="animate-pulse">
                {/* We don't have a split state for supabase upload vs db insert right now, so we just say Uploading */}
                Uploading & Processing...
              </span>
            ) : "Upload Material"}
          </h3>
          <p className="text-sm text-foreground-muted mb-6">
            {isProcessing || isPending 
              ? "Please wait while we persist your document..." 
              : "Drag and drop a PDF file here, or click to browse."}
          </p>
          <input type="file" accept=".pdf" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
          {!isProcessing && !isPending && (
            <Button onClick={() => fileInputRef.current?.click()}>Choose PDF File</Button>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input 
            type="text" 
            placeholder="Search documents..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface border border-border rounded-md text-sm placeholder:text-foreground-muted focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" /> Filter
        </Button>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-elevated border-b border-border">
              <tr>
                <th className="px-4 py-3 font-medium text-foreground-muted">Document Name</th>
                <th className="px-4 py-3 font-medium text-foreground-muted">Type</th>
                <th className="px-4 py-3 font-medium text-foreground-muted">Size</th>
                <th className="px-4 py-3 font-medium text-foreground-muted">Status</th>
                <th className="px-4 py-3 font-medium text-foreground-muted">Date</th>
                <th className="px-4 py-3 font-medium text-foreground-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDocuments.map(doc => (
                <tr key={doc.id} className="hover:bg-surface-hover transition-colors group cursor-pointer" onClick={() => router.push(`/exams/${examId}/materials/${doc.id}`)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-surface-elevated border border-border flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">{doc.documentType}</td>
                  <td className="px-4 py-3 text-foreground-muted">{(doc.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                  <td className="px-4 py-3">
                    {doc.status === DocumentStatus.UPLOADED ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" /> Uploaded
                      </span>
                    ) : doc.status === DocumentStatus.PROCESSING ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/20 text-warning-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" /> Processing
                      </span>
                    ) : doc.status === DocumentStatus.PROCESSED ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
                        <span className="w-1.5 h-1.5 rounded-full bg-success" /> Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                        <span className="w-1.5 h-1.5 rounded-full bg-destructive" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground-muted tabular-nums">
                    {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(doc.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-foreground-muted hover:text-foreground transition-colors p-1">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/exams/${examId}/materials/${doc.id}`)}>
                          <Eye className="w-4 h-4 mr-2" /> View Details
                        </DropdownMenuItem>
                        {doc.status === DocumentStatus.FAILED && (
                          <DropdownMenuItem onClick={(e) => handleRetryProcessing(doc, e)}>
                            <Loader2 className="w-4 h-4 mr-2" /> Retry Processing
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={(e) => handleDeleteDocument(doc.id, e)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {filteredDocuments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-foreground-muted">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <p>No study materials found.</p>
                      <Button onClick={() => setIsUploading(true)} variant="outline">
                        <Upload className="w-4 h-4 mr-2" /> Upload Material
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Deep Search Results */}
      {search.trim().length >= 3 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-2 text-foreground">
            <AlignLeft className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-medium">Deep Search Results</h3>
            {isSearching && <Loader2 className="w-4 h-4 text-foreground-muted animate-spin ml-2" />}
          </div>
          
          {deepSearchResults.length > 0 ? (
            <div className="grid gap-4">
              {deepSearchResults.map((result, idx) => (
                <div key={idx} className="bg-surface border border-border rounded-xl p-4 cursor-pointer hover:border-primary transition-colors" onClick={() => router.push(`/materials/${result.documentId}`)}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-foreground-muted" />
                      <span className="font-medium text-sm text-foreground">{result.documentName}</span>
                    </div>
                    {result.pageNumber && (
                      <span className="text-xs font-medium px-2 py-1 bg-surface-elevated rounded-md text-foreground-muted">
                        Page {result.pageNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground-muted line-clamp-3 leading-relaxed">
                    ...{result.text}...
                  </p>
                </div>
              ))}
            </div>
          ) : !isSearching ? (
            <div className="p-8 text-center border border-dashed border-border rounded-xl bg-surface-elevated/50 text-foreground-muted text-sm">
              No matching content found inside your documents.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
