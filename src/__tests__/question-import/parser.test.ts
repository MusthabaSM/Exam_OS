import { describe, it, expect } from 'vitest';
import { parseDocument } from '../../lib/question-import/parser';

describe('Question Parser', () => {
  it('1. Parses Q1. format with A. options and inline answer', () => {
    const text = `
    Q1. What is the capital of India?
    A. Mumbai
    B. New Delhi
    C. Chennai
    D. Kolkata
    Answer: B
    `;
    const res = parseDocument([{ text }]);
    expect(res).toHaveLength(1);
    expect(res[0].sourceQuestionNumber).toBe('1');
    expect(res[0].questionText).toBe('What is the capital of India?');
    expect(res[0].options).toHaveLength(4);
    expect(res[0].options[0].key).toBe('A');
    expect(res[0].options[0].text).toBe('Mumbai');
    expect(res[0].correctAnswer).toBe('B');
    expect(res[0].status).toBe('VALID');
  });

  it('2. Parses 1. format with numbered options and normalizes them to A-D', () => {
    const text = `
    1. What is the capital of India?
    1. Mumbai
    2. New Delhi
    3. Chennai
    4. Kolkata
    Answer: 2
    `;
    const res = parseDocument([{ text }]);
    expect(res).toHaveLength(1);
    expect(res[0].sourceQuestionNumber).toBe('1');
    expect(res[0].options).toHaveLength(4);
    expect(res[0].options[0].key).toBe('A');
    expect(res[0].options[1].key).toBe('B');
    expect(res[0].correctAnswer).toBe('B');
    expect(res[0].status).toBe('VALID');
  });

  it('3. Parses Answer Text and resolves to key', () => {
    const text = `
    Question 2: Which planet is red?
    A) Earth
    B) Mars
    C) Jupiter
    D) Saturn
    Correct Answer: Mars
    `;
    const res = parseDocument([{ text }]);
    expect(res).toHaveLength(1);
    expect(res[0].sourceQuestionNumber).toBe('2');
    expect(res[0].correctAnswer).toBe('B');
    expect(res[0].status).toBe('VALID');
  });

  it('4. Parses separate Answer Key', () => {
    const text = `
    1) First question
    (A) Opt 1
    (B) Opt 2
    (C) Opt 3
    (D) Opt 4

    2) Second question
    (A) Opt 3
    (B) Opt 4
    (C) Opt 5
    (D) Opt 6

    ANSWER KEY
    1. A
    2. B
    `;
    const res = parseDocument([{ text }]);
    expect(res).toHaveLength(2);
    expect(res[0].correctAnswer).toBe('A');
    expect(res[1].correctAnswer).toBe('B');
  });

  it('5. Marks missing answers as REVIEW_REQUIRED', () => {
    const text = `
    1. Question without answer
    A. Option A
    B. Option B
    C. Option C
    D. Option D
    `;
    const res = parseDocument([{ text }]);
    expect(res).toHaveLength(1);
    expect(res[0].status).toBe('REVIEW_REQUIRED');
    expect(res[0].issues).toContain('Missing correct answer.');
  });

  it('6. Preserves page boundaries', () => {
    const text = `
    [PAGE_NUM:1]
    1. Question 1
    A. Opt A
    B. Opt B
    C. Opt C
    D. Opt D
    Ans: A

    [PAGE_NUM:2]
    2. Question 2
    A. Opt C
    B. Opt D
    C. Opt E
    D. Opt F
    Ans: B
    `;
    const res = parseDocument([{ text }]);
    expect(res).toHaveLength(2);
    expect(res[0].sourcePageNumber).toBe(1);
    expect(res[1].sourcePageNumber).toBe(2);
  });

  it('7. BUGFIX: Differentiates numeric options from new questions', () => {
    const text = `
    1. Which of the following is an operating system?
    1. Python
    2. Linux
    3. HTML
    4. SQL
    5. What does CPU stand for?
    A. Central Processing Unit
    B. Computer Personal Unit
    C. Central Program Utility
    D. Control Processing User
    Answer: A
    `;
    const res = parseDocument([{ text }]);
    
    // We expect 2 questions, because 5. is a new question.
    expect(res).toHaveLength(2);
    expect(res[0].questionText).toBe('Which of the following is an operating system?');
    expect(res[0].options).toHaveLength(4); // 1, 2, 3, 4 (normalized to A,B,C,D)
    expect(res[1].sourceQuestionNumber).toBe('5');
    expect(res[1].questionText).toBe('What does CPU stand for?');
    expect(res[1].options).toHaveLength(4);
    
    // Test 1 has no answer, so REVIEW_REQUIRED. Test 2 has Answer: A, so VALID.
    expect(res[0].status).toBe('REVIEW_REQUIRED');
    expect(res[1].status).toBe('VALID');
  });

  it('8. Rejects questions with exactly 3 or 5 options', () => {
    const text = `
    10. A question with 3 options
    A. Opt 1
    B. Opt 2
    C. Opt 3
    Ans: A

    11. A question with 5 options
    A. Opt 1
    B. Opt 2
    C. Opt 3
    D. Opt 4
    E. Opt 5
    Ans: B
    `;
    const res = parseDocument([{ text }]);
    expect(res).toHaveLength(2);
    
    expect(res[0].sourceQuestionNumber).toBe('10');
    expect(res[0].status).toBe('VALID');
    expect(res[0].options).toHaveLength(3);
    
    expect(res[1].sourceQuestionNumber).toBe('11');
    expect(res[1].status).toBe('VALID');
    expect(res[1].options).toHaveLength(5);
  });
});
