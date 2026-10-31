export type ValidationStatus = "VALID" | "REVIEW_REQUIRED";

export type ParsedOption = {
  key: string;
  text: string;
};

export type ParsedQuestion = {
  id: string; // Unique identifier for the UI to map edits
  sourceQuestionNumber: string | null;
  questionText: string;
  options: ParsedOption[];
  correctAnswer: string | null;
  explanation: string | null;
  sourceDocumentId: string | null;
  sourcePageNumber: number | null;
  status: ValidationStatus;
  issues: string[];
};

export type ParserState = {
  currentPage: number | null;
  currentSection: "QUESTIONS" | "ANSWER_KEY" | null;
  questions: ParsedQuestion[];
  currentQuestion: Partial<ParsedQuestion> | null;
};
