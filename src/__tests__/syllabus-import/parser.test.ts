import { describe, it, expect } from 'vitest';
import { parseSyllabusText } from '../../lib/syllabus-import/parser';

describe('Syllabus Parser', () => {
  it('1. Parses blocks with first line as subject', () => {
    const text = `
    General Studies
    Indian History
    Indian National Movement
    Indian Polity and Constitution
    Indian Economy
    Geography of India
    Science and Technology
    Environment and Ecology

    Aptitude and Mental Ability
    Number System
    Ratio and Proportion
    Percentage
    Profit and Loss
    Simple and Compound Interest
    Time and Work
    Time, Speed and Distance
    Logical Reasoning
    `;
    const res = parseSyllabusText(text);
    expect(res).toHaveLength(2);
    expect(res[0].name).toBe('General Studies');
    expect(res[0].topics).toHaveLength(7);
    expect(res[0].topics[0]).toBe('Indian History');
    
    expect(res[1].name).toBe('Aptitude and Mental Ability');
    expect(res[1].topics).toHaveLength(8);
  });

  it('2. Ignores document titles and uses multi-block parsing', () => {
    const text = `
    "Exam Syllabus"

    General Studies
    Indian History
    Indian National Movement
    Indian Polity and Constitution
    Indian Economy
    Geography of India
    Science and Technology
    Environment and Ecology

    Aptitude and Mental Ability
    Number System
    Ratio and Proportion
    Percentage
    Profit and Loss
    Simple and Compound Interest
    Time and Work
    Time, Speed and Distance
    Logical Reasoning

    English Language
    Grammar
    Vocabulary
    Synonyms and Antonyms
    Sentence Correction
    Reading Comprehension
    Error Detection

    Computer Science
    Computer Fundamentals
    Operating Systems
    Database Management Systems
    Computer Networks
    Data Structures
    Programming Fundamentals

    Current Affairs
    National Current Affairs
    International Current Affairs
    Government Schemes
    Awards and Honours
    Sports
    Science and Technology Updates
    Important Days
    `;
    const res = parseSyllabusText(text);
    expect(res).toHaveLength(5);
    
    // Total topics: 7 + 8 + 6 + 6 + 7 = 34
    const totalTopics = res.reduce((acc, curr) => acc + curr.topics.length, 0);
    expect(totalTopics).toBe(34);
    
    expect(res[0].name).toBe('General Studies');
    expect(res[0].topics).toHaveLength(7);
    
    expect(res[1].name).toBe('Aptitude and Mental Ability');
    expect(res[1].topics).toHaveLength(8);
    
    expect(res[2].name).toBe('English Language');
    expect(res[2].topics).toHaveLength(6);
    
    expect(res[3].name).toBe('Computer Science');
    expect(res[3].topics).toHaveLength(6);
    
    expect(res[4].name).toBe('Current Affairs');
    expect(res[4].topics).toHaveLength(7);

    // Assert Exam Syllabus is not a subject
    const hasExamSyllabus = res.some(s => s.name === '"Exam Syllabus"' || s.name === 'Exam Syllabus');
    expect(hasExamSyllabus).toBe(false);
  });
});
