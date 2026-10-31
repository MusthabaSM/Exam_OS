export type AnswerMatch = {
  answerValue: string;
};

export function detectInlineAnswer(line: string): AnswerMatch | null {
  const trimmed = line.trim();

  // Common inline answer prefixes
  const prefixRegex = /^(?:Correct\s+Answer|Answer|Ans\.|Ans|Correct\s+Option|Correct)[\s:-]+/i;
  
  const match = trimmed.match(prefixRegex);
  if (match) {
    let rawAnswer = trimmed.substring(match[0].length).trim();
    
    // Check if it's "Option B"
    const optionMatch = rawAnswer.match(/^Option\s+([A-E1-4])\b/i);
    if (optionMatch) {
      return { answerValue: optionMatch[1].toUpperCase() };
    }
    
    // Check if it's just "(B)" or "B"
    const letterMatch = rawAnswer.match(/^[\(]?([A-E1-4])[\)]?\b/i);
    if (letterMatch && letterMatch[0].length <= 3) {
      return { answerValue: letterMatch[1].toUpperCase() };
    }

    // Otherwise, it's just raw text (like "New Delhi")
    return { answerValue: rawAnswer };
  }

  return null;
}
