export type DateCandidate = {
  date: string;
  rawText: string;
  field: "prelims" | "mains" | "applicationStart" | "applicationEnd" | "genericExam" | "ignored" | "unknown";
  confidence: number;
  matchedKeywords: string[];
  surroundingContext: string;
};

export type ParsedExamData = {
  name?: string;
  org?: string;
  registrationStart?: string;
  registrationEnd?: string;
  examDate?: string;
  prelimsDate?: string;
  mainsDate?: string;
  totalMarks?: string;
  minimumQualifyingMarks?: string;
  stages?: { name: string; weightage?: string }[];
  debugCandidates?: DateCandidate[];
};

export function parseExamNotificationText(text: string): ParsedExamData {
  const normalizedText = text.replace(/\r\n/g, '\n');
  const lines = normalizedText.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
  const fullTextSingleLine = lines.join(' ');

  let orgGuess = "";
  let nameGuess = "";

  const nameKeywords = /(Recruitment Examination|Competitive Examination|Combined.*?Examination|Recruitment to the post of.*?)/i;
  for (let i = 0; i < Math.min(30, lines.length); i++) {
    const upperLine = lines[i].toUpperCase();
    
    if (!orgGuess && (upperLine.includes('COMMISSION') || upperLine.includes('BOARD') || upperLine.includes('AUTHORITY') || upperLine.includes('MINISTRY') || upperLine.includes('DEPARTMENT'))) {
      if (!upperLine.includes('GOVERNMENT OF INDIA') && !upperLine.includes('IMPORTANT DATES')) {
        orgGuess = lines[i];
      }
    }
    
    if (!nameGuess) {
      const match = lines[i].match(nameKeywords);
      if (match) {
        nameGuess = match[0];
      } else if (upperLine.includes('EXAMINATION') || upperLine.includes('RECRUITMENT') || upperLine.includes('TEST')) {
        if (!upperLine.includes('NOTICE') && !upperLine.includes('ADVERTISEMENT') && !upperLine.match(/NO\.\s*\d+/)) {
          nameGuess = lines[i];
        }
      }
    }
  }

  // Do not blindly set orgGuess to the first line
  if (!nameGuess && lines.length > 1) {
    if (!lines[1].match(/NOTICE|NOTIFICATION/i)) {
      nameGuess = lines[1];
    } else if (lines.length > 2) {
      nameGuess = lines[2];
    }
  }

  const extractAllDates = (input: string) => {
    const dateRegex = /\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*,?\s*\d{4})\b/ig;
    const matches = [];
    let match;
    while ((match = dateRegex.exec(input)) !== null) {
      matches.push({ dateStr: match[1], index: match.index });
    }
    return matches;
  };

  const formatDateForInput = (d: string) => {
    if (d.match(/^\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2}$/)) {
      return d.replace(/[\/\.]/g, '-');
    }
    if (d.match(/^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{4}$/)) {
      const parts = d.split(/[\/\.-]/);
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    try {
      const cleanDate = d.replace(/(\d{1,2})(st|nd|rd|th)\b/ig, '$1');
      const parsed = new Date(cleanDate);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    } catch(e) {}
    return "";
  };

  const rawDates = extractAllDates(fullTextSingleLine);
  const candidates: DateCandidate[] = [];

  for (const rd of rawDates) {
    const iso = formatDateForInput(rd.dateStr);
    if (!iso) continue;

    // Use a window around the date
    const windowStart = Math.max(0, rd.index - 120);
    const windowEnd = Math.min(fullTextSingleLine.length, rd.index + rd.dateStr.length + 120);
    const prefix = fullTextSingleLine.substring(windowStart, rd.index).toLowerCase();
    
    // Find the text specifically between the last date and this date
    let lastDateEnd = 0;
    for (const prev of rawDates) {
      if (prev.index < rd.index) {
         lastDateEnd = Math.max(lastDateEnd, prev.index + prev.dateStr.length);
      }
    }
    
    // The text immediately preceding the date, without crossing over the previous date
    const textSinceLastDate = fullTextSingleLine.substring(lastDateEnd, rd.index).toLowerCase();
    
    // tightPrefix is strictly bounded by the last date, capped at 80 chars
    let tightPrefix = textSinceLastDate;
    if (tightPrefix.length > 80) tightPrefix = tightPrefix.substring(tightPrefix.length - 80);
    
    // loosePrefix can cross date boundaries (for context), capped at 150 chars
    const loosePrefix = fullTextSingleLine.substring(Math.max(0, rd.index - 150), rd.index).toLowerCase();

    const matchedKeywords: string[] = [];
    let prelimsScore = 0;
    let mainsScore = 0;
    let examScore = 0;
    let appStartScore = 0;
    let appEndScore = 0;
    let isIgnored = false;

    // Helper to evaluate patterns
    const evaluatePatterns = (patterns: {p: RegExp, tight: number, loose: number}[], categoryScore: number) => {
      let score = categoryScore;
      for (const { p, tight, loose } of patterns) {
        if (tightPrefix.match(p)) {
          score += tight;
          matchedKeywords.push(`Tight: ${p.source}`);
        } else if (loosePrefix.match(p)) {
          // ensure there's no other date between the match and this date
          const matchIdx = loosePrefix.search(p);
          const textBetween = loosePrefix.substring(matchIdx + p.source.length);
          // if there is another date-like string in between, lower the score
          if (textBetween.match(/\d{4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)) {
             score += Math.floor(loose / 4);
          } else {
             score += loose;
          }
          matchedKeywords.push(`Loose: ${p.source}`);
        }
      }
      return score;
    };

    // --- NEGATIVE SCORING (NOTIFICATION DATES) ---
    const notificationPatterns = [
      /notification date/i, /date of notification/i, /notification dated/i, 
      /notification issued on/i, /notification released on/i, /notification published on/i,
      /advertisement date/i, /advertisement dated/i, /advertisement issued on/i, 
      /advertisement released on/i, /notice dated/i, /notice issued on/i, 
      /notice published on/i, /corrigendum dated/i, /office order dated/i, 
      /government order dated/i, /recruitment notice dated/i, /recruitment notification dated/i,
      /admit card/i, /result/i, /answer key/i
    ];

    for (const pattern of notificationPatterns) {
      if (tightPrefix.match(pattern)) {
        prelimsScore -= 200;
        mainsScore -= 200;
        examScore -= 200;
        appStartScore -= 200;
        appEndScore -= 200;
        isIgnored = true;
        matchedKeywords.push(`Ignored Context: ${pattern.source}`);
        break;
      }
    }

    // --- APPLICATION START ---
    appStartScore = evaluatePatterns([
      { p: /application start date|registration start date/i, tight: 120, loose: 60 },
      { p: /application starting date|registration starting date/i, tight: 120, loose: 60 },
      { p: /applications open from|apply online from/i, tight: 110, loose: 50 },
      { p: /application begins|registration begins|applications begin/i, tight: 110, loose: 50 },
      { p: /application window opens|registration starts|online application starts|online registration starts/i, tight: 110, loose: 50 },
      { p: /application starts|applications start|online application start date/i, tight: 110, loose: 50 },
      { p: /applications are invited from/i, tight: 100, loose: 40 },
      { p: /application start|registration start|registration opening date/i, tight: 90, loose: 40 },
      { p: /opening date/i, tight: 80, loose: 30 }
    ], appStartScore);

    // --- APPLICATION END ---
    appEndScore = evaluatePatterns([
      { p: /application end date|registration end date|registration closing date/i, tight: 120, loose: 60 },
      { p: /application closing date|application deadline|application close date/i, tight: 120, loose: 60 },
      { p: /last date to apply|last date of application|last date for application|last date for submission/i, tight: 120, loose: 60 },
      { p: /last date for submission of application/i, tight: 120, loose: 60 },
      { p: /applications close|application closes|application window closes|application window ends/i, tight: 110, loose: 50 },
      { p: /registration closes|registration ends|online application closes|online registration closes/i, tight: 110, loose: 50 },
      { p: /online application ends|online registration ends|online application end date/i, tight: 110, loose: 50 },
      { p: /application ends|applications end/i, tight: 110, loose: 50 },
      { p: /last date for online application|last date for online registration/i, tight: 110, loose: 50 },
      { p: /application end|registration end/i, tight: 90, loose: 40 },
      { p: /closing date/i, tight: 80, loose: 30 }
    ], appEndScore);

    // --- PRELIMS ---
    prelimsScore = evaluatePatterns([
      { p: /preliminary examination date|date of preliminary examination|date for preliminary examination/i, tight: 120, loose: 60 },
      { p: /preliminary examination will be held on|preliminary examination is scheduled on|preliminary examination is scheduled to be held on/i, tight: 110, loose: 55 },
      { p: /preliminary examination shall be held on|prelims will be conducted on|preliminary examination will be conducted on/i, tight: 110, loose: 55 },
      { p: /prelims date|preliminary exam date|date of prelims|date of preliminary exam/i, tight: 100, loose: 50 },
      { p: /preliminary examination|prelims examination|preliminary test|preliminary stage|preliminary written examination/i, tight: 90, loose: 45 },
      { p: /preliminary exam|prelims exam|prelims/i, tight: 70, loose: 35 }
    ], prelimsScore);

    // --- MAINS ---
    mainsScore = evaluatePatterns([
      { p: /main examination date|mains examination date|date of main examination|date of mains examination|date for main examination|date for mains examination/i, tight: 120, loose: 60 },
      { p: /main examination will be held on|mains examination will be held on|main examination is scheduled on|mains examination is scheduled on/i, tight: 110, loose: 55 },
      { p: /main examination shall be conducted on|mains examination shall be conducted on/i, tight: 110, loose: 55 },
      { p: /main exam date|mains exam date/i, tight: 100, loose: 50 },
      { p: /main examination|mains examination/i, tight: 90, loose: 45 },
      { p: /main exam|mains exam|mains/i, tight: 70, loose: 35 }
    ], mainsScore);

    // --- GENERIC EXAM ---
    examScore = evaluatePatterns([
      { p: /date of conduct of examination/i, tight: 70, loose: 35 },
      { p: /date of examination|date for examination/i, tight: 60, loose: 30 },
      { p: /exam date|examination date|date of exam/i, tight: 50, loose: 25 },
      { p: /examination will be held on|exam will be held on|examination is scheduled on|exam is scheduled on/i, tight: 50, loose: 25 }
    ], examScore);

    const scores = [
      { field: "prelims", score: prelimsScore },
      { field: "mains", score: mainsScore },
      { field: "applicationStart", score: appStartScore },
      { field: "applicationEnd", score: appEndScore },
      { field: "genericExam", score: examScore }
    ];

    scores.sort((a, b) => b.score - a.score);
    const top = scores[0];

    candidates.push({
      date: iso,
      rawText: rd.dateStr,
      field: isIgnored ? "ignored" : (top.score > 0 ? top.field as any : "unknown"),
      confidence: isIgnored ? -1 : top.score,
      matchedKeywords,
      surroundingContext: prefix
    });
  }

  // Field Resolution
  const getBestForField = (field: string) => {
    const c = candidates.filter(c => c.field === field && c.confidence > 0).sort((a, b) => b.confidence - a.confidence);
    return c.length > 0 ? c[0].date : "";
  };

  const finalPrelims = getBestForField("prelims");
  const finalMains = getBestForField("mains");
  const finalAppStart = getBestForField("applicationStart");
  const finalAppEnd = getBestForField("applicationEnd");
  const finalGeneric = getBestForField("genericExam");

  let resolvedExamDate = "";
  if (!finalPrelims && !finalMains) {
    resolvedExamDate = finalGeneric;
  } else if (finalPrelims) {
    resolvedExamDate = finalPrelims;
  } else if (finalMains) {
    resolvedExamDate = finalMains;
  }

  // 5. Exam Stages (Strict)
  const explicitStages = [
    { key: "Preliminary Examination", patterns: /\b(preliminary examination|preliminary exam|prelims)\b/i },
    { key: "Main Examination", patterns: /\b(main examination|mains examination|main exam|mains exam|mains)\b/i },
    { key: "Interview", patterns: /\b(interview|viva|viva voce|personality test)\b/i },
    { key: "Skill Test", patterns: /\b(skill test|typing test)\b/i },
    { key: "Document Verification", patterns: /\b(document verification)\b/i },
    { key: "Medical Examination", patterns: /\b(medical examination)\b/i },
    { key: "Physical Test", patterns: /\b(physical test|physical efficiency test)\b/i },
    { key: "Phase I", patterns: /\b(phase i|stage i)\b/i },
    { key: "Phase II", patterns: /\b(phase ii|stage ii)\b/i },
    { key: "Phase III", patterns: /\b(phase iii|stage iii)\b/i },
  ];

  const stagesSet = new Set<string>();
  const textLower = fullTextSingleLine.toLowerCase();

  for (const stage of explicitStages) {
    if (stage.patterns.test(textLower)) {
      stagesSet.add(stage.key);
    }
  }

  let sumMaxMarks = 0;
  const qualStrings: string[] = [];

  const stages = Array.from(stagesSet).map(name => {
    let bestWeightage = undefined;
    let maxStageMaxMarks = 0;
    let maxStageQualMarks = 0;
    
    const nameLower = name.toLowerCase();
    
    // Find all occurrences of this stage
    const nameRegex = new RegExp(`\\b${nameLower.replace(/[-\/\\^$*+?.()|[\\]{}]/g, '\\\\$&')}\\b`, 'g');
    let match;
    while ((match = nameRegex.exec(textLower)) !== null) {
       const stageIdx = match.index;
       
       // Find the start of the next stage to limit context
       let nextStageIdx = textLower.length;
       for (const otherStage of explicitStages) {
           if (otherStage.key === name) continue;
           const otherRegex = new RegExp(`\\b${otherStage.key.toLowerCase().replace(/[-\/\\^$*+?.()|[\\]{}]/g, '\\\\$&')}\\b`, 'g');
           let matchOther;
           while ((matchOther = otherRegex.exec(textLower)) !== null) {
               if (matchOther.index > stageIdx && matchOther.index < nextStageIdx) {
                   nextStageIdx = matchOther.index;
               }
           }
       }
       
       const contextStr = textLower.substring(stageIdx + nameLower.length, Math.min(stageIdx + nameLower.length + 150, nextStageIdx));
       
       // 1. Weightage
       // Look for explicit label first
       const weightLabelMatch = contextStr.match(/(?:weightage|weight|percentage|contribution)[\s:=-]*0*(\d{1,3}(?:\.\d+)?)\s*%/i) ||
                                contextStr.match(/(?:weightage|weight|percentage|contribution)[\s:=-]*0*(\d{1,3}(?:\.\d+)?)/i);
       
       if (weightLabelMatch) {
          const w = parseFloat(weightLabelMatch[1]);
          if (!isNaN(w)) bestWeightage = `${w}%`;
       } else {
          // fallback to % sign
          const fallbackWeight = contextStr.match(/0*(\d{1,3}(?:\.\d+)?)\s*%/);
          if (fallbackWeight) {
             const w = parseFloat(fallbackWeight[1]);
             if (!isNaN(w)) bestWeightage = `${w}%`;
          }
       }

       // 2. Maximum Marks
       const maxMarksLabelMatch = contextStr.match(/(?:maximum\s*marks|max\s*marks|marks)[\s:=-]*(\d{1,4}(?:\.\d+)?)/i);
       if (maxMarksLabelMatch) {
          const m = parseFloat(maxMarksLabelMatch[1]);
          if (!isNaN(m) && m <= 1000) maxStageMaxMarks = m;
       }

       // 3. Qualifying Marks
       const qualMarksLabelMatch = contextStr.match(/(?:minimum\s*qualifying\s*marks|qualifying\s*marks|minimum\s*marks|pass\s*marks|cut[\s-]?off)[\s:=-]*(\d{1,4}(?:\.\d+)?)/i);
       if (qualMarksLabelMatch) {
          const q = parseFloat(qualMarksLabelMatch[1]);
          if (!isNaN(q) && q <= 1000) maxStageQualMarks = q;
       }
    }
    
    if (maxStageMaxMarks > 0) {
       sumMaxMarks += maxStageMaxMarks;
    }
    if (maxStageQualMarks > 0) {
       qualStrings.push(`${name.split(' ')[0]}: ${maxStageQualMarks}`);
    }
    
    return { name, weightage: bestWeightage };
  });

  // 3. Total Marks
  let totalMarks = "";
  const explicitTotalRegex = /(?:grand\s*total|total\s*maximum\s*marks|total\s*marks\s*for\s*examination|maximum\s*marks\s*in\s*total|overall\s*maximum\s*marks|total\s*marks)[\s:=-]*(\d{2,4})/i;
  const explicitTotalMatch = fullTextSingleLine.match(explicitTotalRegex);
  
  if (explicitTotalMatch) {
    const m = parseInt(explicitTotalMatch[1]);
    if (!isNaN(m) && m <= 3000) totalMarks = m.toString();
  } else if (sumMaxMarks > 0) {
    totalMarks = sumMaxMarks.toString();
  } else {
    // Fallback logic
    const marksRegex = /(?:maximum|max|full)?\s*marks?[\s:-]*(\d{2,4})/ig;
    let maxFound = 0;
    let matchMarks;
    while ((matchMarks = marksRegex.exec(fullTextSingleLine)) !== null) {
      const m = parseInt(matchMarks[1]);
      if (!isNaN(m) && m > maxFound && m <= 1000) maxFound = m;
    }
    if (maxFound > 0) totalMarks = maxFound.toString();
  }

  // 4. Minimum Qualifying Marks
  let minimumQualifyingMarks = "";
  if (qualStrings.length > 0) {
    minimumQualifyingMarks = qualStrings.join(", ");
  } else {
    // Fallback logic
    const qualRegex = /(?:minimum\s*)?(?:qualifying|pass|passing)\s*(?:marks?|score|standard)[^\n]*?(?:is|are|:)?\s*(\d{1,3}(?:\.\d+)?\s*(?:%|percent|marks?))/i;
    const qualMatch = normalizedText.match(qualRegex);
    if (qualMatch) {
      minimumQualifyingMarks = qualMatch[1].trim();
    }
  }

  return {
    name: nameGuess,
    org: orgGuess,
    registrationStart: finalAppStart,
    registrationEnd: finalAppEnd,
    examDate: resolvedExamDate,
    prelimsDate: finalPrelims,
    mainsDate: finalMains,
    totalMarks,
    minimumQualifyingMarks,
    stages: stages.length > 0 ? stages : undefined,
    debugCandidates: candidates
  };
}
