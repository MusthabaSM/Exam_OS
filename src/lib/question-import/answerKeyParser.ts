export type ParsedAnswerKey = {
  [questionNumber: string]: string;
};

export function isAnswerKeyHeader(line: string): boolean {
  const trimmed = line.trim().toUpperCase();
  // Check for strict headers or looser variants commonly seen at the end of PDFs
  return trimmed === "ANSWER KEY" || 
         trimmed === "ANSWERS" || 
         trimmed === "ANSWER KEYS" || 
         trimmed === "SOLUTIONS" ||
         /^ANSWERS?\s+KEY$/i.test(trimmed) ||
         /^ANSWERS?\s*\:/i.test(trimmed) ||
         /^KEY\s*\:/i.test(trimmed) ||
         /^SOLUTIONS?\s*\:/i.test(trimmed);
}

export function parseAnswerKeyLine(line: string, currentKey: ParsedAnswerKey): void {
  const trimmed = line.trim();
  
  // Try to find multiple pairs on the same line if they are separated by spaces/tabs
  // e.g. "1. A   2. B   3. C", "1-A 2-B", "1 C", "1 A 2 B"
  
  // Match "1. B", "Q1 - C", "S1. Ans. (b)", "1-B", "1) B", "1 : B", "1 C"
  const regex = /(?:Q|Question|S)?\s*(\d+)[\.\)\-\:\s]+(?:Ans\.?\s*)?[\(]?([A-F1-6a-f])(?:[\)]|\b|\s|$)/gi;
  
  let match;
  let found = false;
  while ((match = regex.exec(trimmed)) !== null) {
    const qNum = match[1];
    let ans = match[2].toUpperCase();
    
    // Normalize numeric answers (1->A, 2->B, etc) if they match [1-6]
    if (ans.match(/^[1-6]$/)) {
      ans = String.fromCharCode(64 + parseInt(ans, 10));
    }
    
    currentKey[qNum] = ans;
    found = true;
  }
  
  // If not found with the multi-regex, try single precise formats just in case
  if (!found) {
    const singleMatch = trimmed.match(/^(?:Q|Question|S)?\s*(\d+)[\.\)\-\:\s]+(?:Ans\.?\s*)?[\(]?([A-F1-6a-f])(?:[\)]|\b|\s|$)/i);
    if (singleMatch) {
       let ans = singleMatch[2].toUpperCase();
       if (ans.match(/^[1-6]$/)) {
         ans = String.fromCharCode(64 + parseInt(ans, 10));
       }
       currentKey[singleMatch[1]] = ans;
    }
  }
}
