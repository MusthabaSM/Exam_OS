export interface ParsedTopicWeightage {
  topicName: string;
  weightage?: number;
  questionCount?: number;
}

export interface ParsedSubjectWeightage {
  subjectName: string;
  questionCount?: number;
  marksCount?: number;
  weightage?: number; 
  priorityRank?: number;
  estimatedDifficulty?: string;
  studyRecommendation?: string;
  topics: ParsedTopicWeightage[];
}

export interface ParsedExamWeightage {
  examName: string;
  subjects: ParsedSubjectWeightage[];
}

export interface ParsedWeightageData {
  sourceYear?: string;
  exams: ParsedExamWeightage[];
}

/**
 * Deterministically parses PDF text to extract multiple exams and their subject/topic weightages.
 */
export function parseWeightageText(text: string): ParsedWeightageData {
  const rawLines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  const exams: ParsedExamWeightage[] = [];
  let sourceYear: string | undefined = undefined;

  // Extract Year
  for (let i = 0; i < Math.min(20, rawLines.length); i++) {
    const yearMatch = rawLines[i].match(/\b(202[0-9])\b/);
    if (yearMatch) {
      sourceYear = yearMatch[1];
      break;
    }
  }

  const parsePercentage = (str: string): number | undefined => {
    const match = str.match(/(\d+(?:\.\d+)?)%|(\d+(?:\.\d+)?)\s*%/);
    if (match) return parseFloat(match[1] || match[2]);
    return undefined;
  };

  const parseQuestions = (str: string): number | undefined => {
    const match = str.match(/(?:^|\s|\()(\d+)\s*(?:Questions?|Q\b|Qs\b)/i) || 
                  str.match(/(?:Questions?|Q\b|Qs\b):\s*(\d+)/i);
    if (match) return parseInt(match[1], 10);
    return undefined;
  };

  const parseMarks = (str: string): number | undefined => {
    const match = str.match(/(?:^|\s|\()(\d+(?:\.\d+)?)\s*(?:Marks?|M\b)/i) || 
                  str.match(/(?:Marks?|M\b):\s*(\d+(?:\.\d+)?)/i);
    if (match) return parseFloat(match[1]);
    return undefined;
  };

  const parsePriority = (str: string): number | undefined => {
    const match = str.match(/PRIORITY\s*[:\-]?\s*(\d+)/i);
    if (match) return parseInt(match[1], 10);
    return undefined;
  };

  const parseDifficulty = (str: string): string | undefined => {
    const lower = str.toLowerCase();
    if (lower.match(/high-level|complex|time-intensive|advanced|heavy|difficult/)) return 'High';
    if (lower.match(/standard|moderate|regular/)) return 'Medium';
    if (lower.match(/basic|foundational|easiest|simple|low priority/)) return 'Low';
    return undefined;
  };

  const extractRecommendation = (str: string): string | undefined => {
    const rec = str.replace(/PRIORITY\s*\d+:\s*(?:Study (?:First(?: & in Detail)?|in Detail|Low Priority))?[\s\:\-]*/i, '').trim();
    if (rec.toLowerCase() === 'study priority & detail recommendation') return undefined;
    return rec.length > 0 ? rec : undefined;
  };

  const ignoredKeywords = [
    "exam type", "interview status", "mains format", "total marks", 
    "subject / unit", "exam phase", "weightage", "study priority",
    "mains section", "online section", "section", "core topics"
  ];

  let currentExam: ParsedExamWeightage | null = null;
  let currentSubject: ParsedSubjectWeightage | null = null;
  const legacySubjects: ParsedSubjectWeightage[] = [];

  const pushSubjectToExam = () => {
    if (currentSubject && (currentSubject.questionCount || currentSubject.marksCount || currentSubject.priorityRank || currentSubject.weightage)) {
        if (currentExam) {
            // Find if subject already exists to merge
            const existingSubject = currentExam.subjects.find(s => s.subjectName.toLowerCase() === currentSubject!.subjectName.toLowerCase());
            if (existingSubject) {
                if (currentSubject.weightage !== undefined) existingSubject.weightage = currentSubject.weightage;
                if (currentSubject.questionCount !== undefined) existingSubject.questionCount = currentSubject.questionCount;
                if (currentSubject.marksCount !== undefined) existingSubject.marksCount = currentSubject.marksCount;
                if (currentSubject.priorityRank !== undefined) existingSubject.priorityRank = currentSubject.priorityRank;
                if (currentSubject.estimatedDifficulty) existingSubject.estimatedDifficulty = currentSubject.estimatedDifficulty;
                if (currentSubject.studyRecommendation) existingSubject.studyRecommendation = currentSubject.studyRecommendation;
                currentSubject.topics.forEach(t => {
                    if (!existingSubject.topics.some(ex => ex.topicName === t.topicName)) {
                        existingSubject.topics.push(t);
                    }
                });
            } else {
                currentExam.subjects.push(currentSubject);
            }
        } else {
            legacySubjects.push(currentSubject);
        }
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const lowerLine = line.toLowerCase();
    
    // Check for Exam Header (e.g., "1. TNPSC Group 2 (Executive Post Stream)")
    // A strict regex for digits followed by dot and space, and a reasonably long exam name.
    const examHeaderMatch = line.match(/^(?:\d+\.\s+)?(TNPSC Group 2.*?|ISRO Assistant.*?|State Bank of India.*?|Indian Overseas Bank.*?|IBPS Clerk.*?)$/i) || line.match(/^\d+\.\s+(.+)$/);
    if (examHeaderMatch && !lowerLine.startsWith("page ") && line.length > 5 && line.length < 80) {
        pushSubjectToExam(); // Save previous subject if any
        currentSubject = null;
        
        const rawExamName = examHeaderMatch[1].trim();
        // Check if we already have this exam (just in case it's split across pages with same header, unlikely but possible)
        let existingExam = exams.find(e => e.examName.toLowerCase() === rawExamName.toLowerCase());
        if (existingExam) {
            currentExam = existingExam;
        } else {
            currentExam = {
                examName: rawExamName,
                subjects: []
            };
            exams.push(currentExam);
        }
        continue;
    }

    // Ignore meta lines
    if (ignoredKeywords.some(kw => lowerLine.startsWith(kw))) continue;
    if (lowerLine.startsWith("page ") || /^\d+$/.test(line)) continue;

    const parts = line.includes('|') ? line.split('|').map(p => p.trim()) : [line];
    
    let lineQs = parseQuestions(line);
    let lineMarks = parseMarks(line);
    let linePct = parsePercentage(line);
    let linePri = parsePriority(line);
    let lineDiff = parseDifficulty(line);
    let lineRec = linePri ? extractRecommendation(line) : undefined;
    let lineTopics: string[] = [];

    // Attempt to extract topics from comma-separated text
    const textOnlyParts = parts.filter(p => !parseQuestions(p) && !parseMarks(p) && !parsePriority(p));
    for (const p of textOnlyParts) {
       if (p.includes(',') || p.split(' ').length > 3) {
           const maybeTopics = p.split(',').map(t => t.trim()).filter(t => t.length > 2);
           if (maybeTopics.length > 1) {
               lineTopics = maybeTopics;
           }
       }
    }

    let possibleSubjectName: string | undefined;
    if (parts.length >= 3 && !parseQuestions(parts[0]) && !parseMarks(parts[0]) && !parsePriority(parts[0])) {
        possibleSubjectName = parts[0];
    } else if (parts.length === 1 && !lineQs && !lineMarks && !linePri && !linePct && !line.includes(',') && line.length >= 2 && line.length < 60) {
        // Ensure it doesn't look like a standard descriptive sentence or a property bullet
        if (!line.includes('.') && !lowerLine.startsWith('•') && !lowerLine.startsWith('-') && !lowerLine.startsWith('*')) {
            possibleSubjectName = line;
        }
    }

    if (possibleSubjectName) {
        // Strip common prefixes like "Part A:" or "Unit I:" for cleaner subject names
        const cleanSubjectName = possibleSubjectName.replace(/^(?:Part|Unit)\s+[A-Z0-9IVX]+:\s*/i, '').trim();

        pushSubjectToExam();
        currentSubject = {
            subjectName: cleanSubjectName.replace(/:$/, '').trim(),
            topics: []
        };
    }

    if (currentSubject) {
        if (lineQs && !currentSubject.questionCount) currentSubject.questionCount = lineQs;
        if (lineMarks && !currentSubject.marksCount) currentSubject.marksCount = lineMarks;
        if (linePct && !currentSubject.weightage) currentSubject.weightage = linePct;
        if (linePri && !currentSubject.priorityRank) currentSubject.priorityRank = linePri;
        if (lineDiff && !currentSubject.estimatedDifficulty) currentSubject.estimatedDifficulty = lineDiff;
        if (lineRec && !currentSubject.studyRecommendation) currentSubject.studyRecommendation = lineRec;
        
        if (lineTopics.length > 0) {
            lineTopics.forEach(t => {
                if (!currentSubject!.topics.some(ex => ex.topicName === t)) {
                    currentSubject!.topics.push({ topicName: t });
                }
            });
        }
    }
  }

  pushSubjectToExam(); // Push the final subject

  // If no exams were detected (fallback for single-exam legacy format), treat the whole thing as one "Unrecognized Exam Section"
  if (exams.length === 0 && legacySubjects.length > 0) {
     exams.push({
         examName: "Unrecognized Exam Section",
         subjects: legacySubjects
     });
  }

  return {
    sourceYear,
    exams
  };
}
