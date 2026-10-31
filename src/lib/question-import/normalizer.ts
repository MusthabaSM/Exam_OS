export function normalizeText(text: string): string {
  // Replace Windows CRLF with \n
  let normalized = text.replace(/\r\n/g, "\n");
  
  // Strip excessive newlines while preserving single empty lines as boundaries
  normalized = normalized.replace(/\n{3,}/g, "\n\n");
  
  // Clean up weird spaces, non-breaking spaces
  normalized = normalized.replace(/\u00A0/g, " ");
  
  return normalized;
}

export function extractPageNumber(line: string): number | null {
  const match = line.match(/^\[PAGE_NUM:(\d+)\]$/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}
