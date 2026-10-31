import { validateQuestion } from './validator';
import { ParsedQuestion, ParsedOption } from './types';
import { parseAnswerKeyLine, ParsedAnswerKey } from './answerKeyParser';
import { extractPageNumber } from './normalizer';
import { detectInlineAnswer } from './answerDetector';

export interface ParseInput {
  text: string;
  sourceDocumentId?: string;
}

export function parseDocument(inputs: ParseInput[]): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  let answerKey: ParsedAnswerKey = {};
  
  for (const input of inputs) {
    const text = input.text;
    
    // Split answer key
    const answerKeyBoundaryMatch = text.match(/(?:^|\n|\s)(ANSWER KEY|ANSWERS|SOLUTIONS|ANSWER KEYS|CORRECT ANSWERS)(?:\s*\:|\n|\s|$)/i);
    let questionsText = text;
    let answerKeyText = "";
    
    if (answerKeyBoundaryMatch && answerKeyBoundaryMatch.index !== undefined) {
      questionsText = text.substring(0, answerKeyBoundaryMatch.index);
      answerKeyText = text.substring(answerKeyBoundaryMatch.index + answerKeyBoundaryMatch[0].length);
    }
    
    // Tokenize questionsText
    // We look for anything that looks like a marker:
    // Page: [PAGE_NUM:1]
    // Alpha: A. A) (A)
    // Num: 1. 1) (1)
    // QExplicit: Q1. Q1) Question 1.
    
    const regex = /(?:(\[PAGE_NUM:\d+\])|(?:\b(Q|Question\s*)\.?\s*(\d{1,3})\s*[\.\)\-\:]\s*)|(?:(?<=(?:^|\s))[\(]?([A-Ea-e])[\.\)]\s*)|(?:(?<=(?:^|\s))[\(]?(\d+)[\.\)]\s*))/gi;
    const tokens = [];
    let match;
    while ((match = regex.exec(questionsText)) !== null) {
      if (match[1]) {
        tokens.push({ type: 'PAGE', val: parseInt(match[1].match(/\d+/)![0], 10), index: match.index, length: match[0].length, raw: match[0] });
      } else if (match[2]) {
        tokens.push({ type: 'Q_EXPLICIT', val: parseInt(match[3], 10), index: match.index, length: match[0].length, raw: match[0] });
      } else if (match[4]) {
        tokens.push({ type: 'ALPHA', val: match[4].toUpperCase(), index: match.index, length: match[0].length, raw: match[0] });
      } else if (match[5]) {
        tokens.push({ type: 'NUM', val: parseInt(match[5], 10), index: match.index, length: match[0].length, raw: match[0] });
      }
    }
    
    // Now state machine
    let expectedQNum = -1; // -1 means we haven't seen a question yet
    let currentQStartIdx = -1;
    let currentQNumStr = "";
    let currentPage = null;
    let currentQPage = null;
    
    // We need to group tokens into Questions.
    // A Question starts when we decide a token is a Question marker.
    // How to decide if a NUM token is a Question or Option?
    // If it is strictly expectedQNum + 1, it COULD be a question.
    // But if we are inside a question, and we haven't seen options yet, and we see NUM=1, then NUM=2, these are options.
    
    const qBoundaries = [];
    
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t.type === 'PAGE') {
        currentPage = t.val;
        continue;
      }
      
      let isNewQuestion = false;
      
      if (t.type === 'Q_EXPLICIT') {
        isNewQuestion = true;
      } else if (t.type === 'NUM') {
        const tVal = t.val as number;
        if (expectedQNum === -1) {
          // First question
          if (tVal === 1 || tVal === 10) { // allow starting at 1 or 10
            isNewQuestion = true;
          }
        } else {
          // Is it the next question?
          if (tVal > expectedQNum && tVal <= expectedQNum + 5) {
            // It could be the next question.
            // But what if it's Option 2, 3, 4 of the CURRENT question?
            // If the current question ALREADY has a NUM=1 option inside it, then NUM=2 is an option!
            // Let's look BACK from current token to the start of current question.
            let hasSeenNum1Option = false;
            let hasSeenAlphaOption = false;
            for (let j = i - 1; j >= 0; j--) {
              if (tokens[j].index <= currentQStartIdx) break; // out of current question
              if (tokens[j].type === 'NUM' && (tokens[j].val as number) === 1) hasSeenNum1Option = true;
              if (tokens[j].type === 'ALPHA') hasSeenAlphaOption = true;
            }
            
            // Lookahead to see if there are ALPHA options before the next NUM or Q_EXPLICIT
            let hasAlphaAhead = false;
            for (let j = i + 1; j < tokens.length; j++) {
              if (tokens[j].type === 'NUM' || tokens[j].type === 'Q_EXPLICIT') break;
              if (tokens[j].type === 'ALPHA') {
                hasAlphaAhead = true;
                break;
              }
            }
            
            // If we've seen NUM=1, and we are NUM=2, it's an option.
            // But if there are ALPHA options ahead before the next number, this current number is actually a new question!
            if (hasSeenNum1Option && !hasAlphaAhead) {
               // this is part of the numeric option chain
               isNewQuestion = false;
            } else {
               isNewQuestion = true;
            }
          }
        }
      }
      
      if (isNewQuestion) {
        if (currentQStartIdx !== -1) {
          qBoundaries.push({
             qNum: currentQNumStr,
             start: currentQStartIdx,
             end: t.index,
             page: currentQPage
          });
        }
        currentQStartIdx = t.index + t.length;
        currentQNumStr = t.val.toString();
        currentQPage = currentPage as number | null;
        expectedQNum = t.val as number;
      }
    }
    
    if (currentQStartIdx !== -1) {
       qBoundaries.push({
         qNum: currentQNumStr,
         start: currentQStartIdx,
         end: questionsText.length,
         page: currentQPage
       });
    }
    
    for (const b of qBoundaries) {
      const qBlock = questionsText.substring(b.start, b.end);
      const parsedQ = parseQuestionBlock(b.qNum, qBlock, input.sourceDocumentId);
      parsedQ.sourcePageNumber = b.page as number | null;
      questions.push(parsedQ);
    }
    
    // Parse Answer Key from answerKeyText
    if (answerKeyText) {
      const lines = answerKeyText.split('\n');
      for (const line of lines) {
        parseAnswerKeyLine(line, answerKey);
      }
    }
  }
  
  // Apply answers
  for (const q of questions) {
    if (!q.correctAnswer && q.sourceQuestionNumber && answerKey[q.sourceQuestionNumber]) {
      q.correctAnswer = answerKey[q.sourceQuestionNumber];
    }
    validateQuestion(q);
    
    if (q.status !== 'VALID') {
       console.log(`\n--- REJECTED QUESTION ---`);
       console.log(`Question number: ${q.sourceQuestionNumber}`);
       console.log(`Reason rejected: ${q.issues.join(', ')}`);
       console.log(`Extracted text: ${q.questionText.substring(0, 100)}...`);
    }
  }
  
  return questions;
}

function parseQuestionBlock(qNumStr: string, block: string, sourceDocId?: string): ParsedQuestion {
  const options: ParsedOption[] = [];
  
  // Find options in the block
  // Options can be A), B), C), D), E) or 1), 2), 3), 4), 5)
  const optionMatches = Array.from(block.matchAll(/(?<=(?:^|\s))[\(]?([A-E1-5a-e])[\.\)]\s*/g));
  
  // We might have multiple chains (e.g. 1, 2 statements and then A, B, C, D options)
  // Let's build all valid chains.
  let alphaChain: RegExpMatchArray[] = [];
  let numChain: RegExpMatchArray[] = [];
  
  let expectedAlphaCode = 65; // 'A'
  for (const match of optionMatches) {
    const val = match[1].toUpperCase();
    if (val.match(/^[A-E]$/) && val.charCodeAt(0) === expectedAlphaCode) {
      alphaChain.push(match);
      expectedAlphaCode++;
    }
  }
  
  let expectedNum = 1;
  for (const match of optionMatches) {
    const val = match[1];
    if (val.match(/^[1-5]$/) && parseInt(val, 10) === expectedNum) {
      numChain.push(match);
      expectedNum++;
    }
  }
  
  // Pick the best chain. Usually, options have 4 or 5 items. 
  // If alphaChain has >= 3 items, it's almost certainly the options.
  let validOptionMatches: RegExpMatchArray[] = [];
  if (alphaChain.length >= 3) {
    validOptionMatches = alphaChain;
  } else if (numChain.length >= 3) {
    validOptionMatches = numChain;
  } else if (alphaChain.length > numChain.length) {
    validOptionMatches = alphaChain;
  } else if (numChain.length > 0) {
    validOptionMatches = numChain;
  }
  
  let questionText = block;
  if (validOptionMatches.length > 0) {
    questionText = block.substring(0, validOptionMatches[0].index!).trim();
  }
  
  for (let i = 0; i < validOptionMatches.length; i++) {
    const match = validOptionMatches[i];
    const startIdx = match.index! + match[0].length;
    const endIdx = (i + 1 < validOptionMatches.length) ? validOptionMatches[i+1].index! : block.length;
    
    let optText = block.substring(startIdx, endIdx).trim();
    let key = match[1].toUpperCase();
    if (key.match(/^[1-5]$/)) {
       key = String.fromCharCode(64 + parseInt(key, 10)); // 1->A, 2->B
    }
    options.push({ key, text: optText });
  }
  
  // Find inline answer
  let correctAnswer = null;
  const lines = block.split('\n');
  
  let qText = lines.join('\n').trim();
  if (!qText) {
    qText = "[Text missing from PDF - likely an image or equation]";
  }
  
  for (const line of lines) {
    const ansMatch = detectInlineAnswer(line);
    if (ansMatch) {
      // If it's a direct letter key like 'A' or 'B'
      if (ansMatch.answerValue.match(/^[A-E]$/)) {
        correctAnswer = ansMatch.answerValue;
      } else if (ansMatch.answerValue.match(/^[1-5]$/)) {
        correctAnswer = String.fromCharCode(64 + parseInt(ansMatch.answerValue, 10));
      } else {
        // Text answer, try to map to option
        const textVal = ansMatch.answerValue.toLowerCase().trim();
        const matchedOpt = options.find(o => o.text.toLowerCase().trim() === textVal || o.text.toLowerCase().includes(textVal));
        if (matchedOpt) {
          correctAnswer = matchedOpt.key;
        }
      }
      
      // Remove this line from wherever it is (question text or option text)
      questionText = questionText.replace(line, '').trim();
      for (const opt of options) {
        opt.text = opt.text.replace(line, '').trim();
      }
    }
  }

  // Clean up question text (remove page headers if present)
  questionText = questionText.replace(/Page\s+\d+/gi, '').trim();
  if (!questionText) {
    questionText = "[Text missing from PDF - likely an image or equation]";
  }

  return {
    id: crypto.randomUUID(),
    sourceQuestionNumber: qNumStr,
    questionText: questionText,
    options: options,
    correctAnswer: correctAnswer,
    explanation: null,
    sourcePageNumber: null,
    sourceDocumentId: sourceDocId || null,
    status: 'REVIEW_REQUIRED',
    issues: []
  };
}
