import { describe, it, expect } from 'vitest';
import { parseWeightageText } from '../../lib/weightage-import/parser';

describe('Weightage Parser - Multi-Exam Deterministic Extraction', () => {

  it('1. Detect one exam section', () => {
    const text = `
    1. TNPSC Group 2 (Executive Post Stream)
    General / Financial Awareness
    50 Marks
    40 Questions
    `;
    const result = parseWeightageText(text);
    expect(result.exams).toHaveLength(1);
    expect(result.exams[0].examName).toBe('TNPSC Group 2 (Executive Post Stream)');
    expect(result.exams[0].subjects).toHaveLength(1);
    expect(result.exams[0].subjects[0].subjectName).toBe('General / Financial Awareness');
  });

  it('2. Detect multiple exam sections', () => {
    const text = `
    1. TNPSC Group 2 (Executive Post Stream)
    General / Financial Awareness
    50 Marks
    
    2. ISRO Assistant / Upper Division Clerk (UDC)
    Quantitative Aptitude
    50 Questions
    `;
    const result = parseWeightageText(text);
    expect(result.exams).toHaveLength(2);
    expect(result.exams[0].examName).toBe('TNPSC Group 2 (Executive Post Stream)');
    expect(result.exams[0].subjects[0].subjectName).toBe('General / Financial Awareness');
    expect(result.exams[1].examName).toBe('ISRO Assistant / Upper Division Clerk (UDC)');
    expect(result.exams[1].subjects[0].subjectName).toBe('Quantitative Aptitude');
  });

  it('3. Correct section boundaries', () => {
    const text = `
    1. Exam A
    Subject A1
    50 Marks
    Subject A2
    40 Marks

    2. Exam B
    Subject B1
    10 Marks
    `;
    const result = parseWeightageText(text);
    expect(result.exams[0].subjects).toHaveLength(2);
    expect(result.exams[0].subjects[0].subjectName).toBe('Subject A1');
    expect(result.exams[0].subjects[1].subjectName).toBe('Subject A2');
    expect(result.exams[1].subjects).toHaveLength(1);
    expect(result.exams[1].subjects[0].subjectName).toBe('Subject B1');
  });

  it('11. Unknown exam fallback (legacy single exam format)', () => {
    const text = `
    Subject Unknown
    50 Marks
    `;
    const result = parseWeightageText(text);
    expect(result.exams).toHaveLength(1);
    expect(result.exams[0].examName).toBe('Unrecognized Exam Section');
    expect(result.exams[0].subjects).toHaveLength(1);
    expect(result.exams[0].subjects[0].subjectName).toBe('Subject Unknown');
  });

  it('24. Correct priority extraction', () => {
    const text = `
    1. Exam A
    General English
    50 Questions
    PRIORITY 3: Study in Detail
    `;
    const result = parseWeightageText(text);
    expect(result.exams[0].subjects[0].priorityRank).toBe(3);
  });

});
