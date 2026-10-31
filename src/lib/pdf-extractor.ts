import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import 'pdfjs-dist/legacy/build/pdf.worker.mjs'; // Force Vercel NFT to trace the worker
import path from 'path';

export async function extractTextFromPDF(buffer: Buffer, includePageNumbers: boolean = false): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  
  const loadingTask = pdfjs.getDocument({
    data: uint8Array,
    useSystemFonts: true,
    disableFontFace: true,
    standardFontDataUrl: path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts') + '/'
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  let fullText = '';

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();
    
    // Layout-aware extraction
    const items = textContent.items as any[];
    
    // Group into columns if applicable
    // We'll use a simple heuristic: if there's a significant gap in the middle of the page,
    // or we just divide the page into vertical strips.
    const pageWidth = viewport.width;
    const midX = pageWidth / 2;
    
    // Sort items: first by column (left vs right), then by Y (top to bottom, which means highest Y first in PDF space), then X
    // PDF space: Y is usually from bottom up, so higher Y is higher on page.
    items.sort((a, b) => {
      const ax = a.transform[4];
      const ay = a.transform[5];
      const bx = b.transform[4];
      const by = b.transform[5];
      
      const aCol = ax < midX ? 0 : 1;
      const bCol = bx < midX ? 0 : 1;
      
      if (aCol !== bCol) return aCol - bCol;
      
      // Tolerance for Y (if they are on the same line)
      if (Math.abs(ay - by) > 5) {
        return by - ay; // Highest Y first (top to bottom)
      }
      
      return ax - bx; // Left to right
    });
    
    let pageText = '';
    let lastY = null;
    let lastCol = null;

    for (const item of items) {
      const ax = item.transform[4];
      const ay = item.transform[5];
      const col = ax < midX ? 0 : 1;
      
      if (lastY !== null && Math.abs(ay - lastY) <= 5 && lastCol === col) {
        if (pageText.length > 0 && !pageText.endsWith(' ') && !item.str.startsWith(' ')) {
          pageText += ' ';
        }
        pageText += item.str;
      } else {
        pageText += (pageText ? '\n' : '') + item.str;
      }
      
      lastY = ay;
      lastCol = col;
    }

    if (includePageNumbers) {
      fullText += `\n[PAGE_NUM:${pageNum}]\n${pageText}`;
    } else {
      fullText += `\n${pageText}`;
    }
  }

  return fullText;
}
