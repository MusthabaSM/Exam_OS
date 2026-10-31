export interface ParsedSyllabusSubject {
  name: string;
  topics: string[];
}

export function parseSyllabusText(text: string): ParsedSyllabusSubject[] {
  const rawLines = text.split(/\r?\n/);
  const subjects: ParsedSyllabusSubject[] = [];
  
  let currentSubject: ParsedSyllabusSubject | null = null;
  let pendingSubjectName: string | null = null;

  const IGNORED_TITLES = [
    "exam syllabus",
    "table of contents",
    "contents",
    "syllabus",
    "index"
  ];

  const isBulletedOrNumbered = (t: string) => /^[•\-\*○]\s/.test(t) || /^\d+\.\s/.test(t) || /^[A-Za-z]\.\s/.test(t);
  const cleanText = (t: string) => t.replace(/^[•\-\*○]\s*/, '').replace(/^\d+\.\s*/, '').replace(/^[A-Za-z]\.\s*/, '').trim();

  // Group into blocks separated by blank lines
  const blocks: { text: string; indent: number; isBullet: boolean }[][] = [];
  let currentBlock: { text: string; indent: number; isBullet: boolean }[] = [];

  for (const rawLine of rawLines) {
    const textTrimmed = rawLine.trim();
    if (textTrimmed.length === 0) {
      if (currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
    } else {
      const match = rawLine.match(/^(\s*)/);
      const indent = match ? match[1].length : 0;
      currentBlock.push({ text: textTrimmed, indent, isBullet: isBulletedOrNumbered(textTrimmed) });
    }
  }
  if (currentBlock.length > 0) {
    blocks.push(currentBlock);
  }

  for (const block of blocks) {
    if (block.length === 1) {
      const line = block[0].text;
      const lowerLine = line.toLowerCase().replace(/['"]/g, '');
      
      if (IGNORED_TITLES.includes(lowerLine)) {
        continue;
      }
      
      if (line.length > 3) {
        pendingSubjectName = line.replace(/:$/, '').trim();
      }
    } else {
      let startIndex = 0;
      const firstLine = block[0];
      
      if (pendingSubjectName) {
        if (firstLine.isBullet) {
          currentSubject = { name: pendingSubjectName, topics: [] };
          subjects.push(currentSubject);
          startIndex = 0;
        } else {
          currentSubject = { name: firstLine.text.replace(/:$/, '').trim(), topics: [] };
          subjects.push(currentSubject);
          startIndex = 1;
        }
        pendingSubjectName = null;
      } else {
        const subjectName = firstLine.text.replace(/:$/, '').trim();
        if (IGNORED_TITLES.includes(subjectName.toLowerCase().replace(/['"]/g, ''))) {
          currentSubject = { name: "General Topics", topics: [] };
          subjects.push(currentSubject);
          startIndex = 1;
        } else {
          currentSubject = { name: subjectName, topics: [] };
          subjects.push(currentSubject);
          startIndex = 1;
        }
      }

      for (let i = startIndex; i < block.length; i++) {
        const tLine = block[i];
        if (tLine.text.length < 2) continue; 
        
        const isAllCaps = /^[A-Z0-9\s\.\&\-\:\(\)]+$/.test(tLine.text) && tLine.text.length > 3 && !/[a-z]/.test(tLine.text);
        let nextLineIsBullet = false;
        if (i + 1 < block.length) {
          nextLineIsBullet = block[i + 1].isBullet;
        }
        
        // If it's not a bullet, and (it's all caps OR ends with colon OR next line is a bullet), it's a new subject
        if (i > startIndex && !tLine.isBullet && (isAllCaps || tLine.text.endsWith(":") || nextLineIsBullet)) {
           currentSubject = { name: tLine.text.replace(/:$/, '').trim(), topics: [] };
           subjects.push(currentSubject);
           continue;
        }
        
        const cleaned = cleanText(tLine.text);
        if (cleaned.length > 2 && !currentSubject!.topics.includes(cleaned)) {
          currentSubject!.topics.push(cleaned);
        }
      }
    }
  }

  return subjects.filter(s => s.topics.length > 0);
}
