export type QuestionMatch = {
  numberStr: string;
  questionText: string;
};

export function detectQuestionStart(line: string, inOptionBlock: boolean): QuestionMatch | null {
  const trimmed = line.trim();

  // Explicit Question headers (always questions, regardless of option block state)
  // Q1., Q1), Question 1:, Question 1.
  const explicitMatch = trimmed.match(/^(?:Q|Question)\s*(\d+)(?:[\.\):-])?\s+(.+)$/i);
  if (explicitMatch) {
    return {
      numberStr: explicitMatch[1],
      questionText: explicitMatch[2]
    };
  }

  const explicitMatchNoText = trimmed.match(/^(?:Q|Question)\s*(\d+)(?:[\.\):-])?$/i);
  if (explicitMatchNoText) {
     return {
      numberStr: explicitMatchNoText[1],
      questionText: ""
    };
  }

  // Ambiguous numbered headers (1., 1), 1 ) - only if not inside an option block
  if (!inOptionBlock) {
    const numberMatch = trimmed.match(/^(\d+)[\.\)]\s+(.+)$/);
    if (numberMatch) {
      return {
        numberStr: numberMatch[1],
        questionText: numberMatch[2]
      };
    }

    // Number followed by whitespace (e.g. "1 What is...")
    const spaceMatch = trimmed.match(/^(\d+)\s+(.+)$/);
    if (spaceMatch) {
      return {
        numberStr: spaceMatch[1],
        questionText: spaceMatch[2]
      };
    }
  }

  return null;
}
