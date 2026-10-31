import { expect, test } from 'vitest';
import { parseDocument } from '../parser';

test('real IBPS RRB format parsing', () => {
  const sampleText = `
Directions (1-3): Study the information carefully and answer the questions given below.
B has only one son...

Q1. How is C related to B?
(a) Daughter (b) Daughter-in-law (c) Aunt (d) Mother-in-law (e) None of these

Q2. How is G related to D?
(a) Son
(b) Daughter
(c) Nephew
(d) Uncle
(e) Son-in-law

Q3. What is something else?
(a) A (b) B (c) C (d) D (e) E

Directions (4-5): Next section.
Q4. Something else entirely?
(a) 1 (b) 2 (c) 3 (d) 4 (e) 5

Solutions
S1. Ans. (b)
S2. Ans. (e)
S3. Ans. (a)
S4. Ans. (d)
`;

  const res = parseDocument([{ text: sampleText, sourceDocumentId: 'doc1' }]);
  
  console.log(res);
  
  expect(res.length).toBe(4);
  expect(res[0].sourceQuestionNumber).toBe('1');
  expect(res[0].options.length).toBe(5);
  expect(res[0].correctAnswer).toBe('B');
  
  expect(res[1].sourceQuestionNumber).toBe('2');
  expect(res[1].options.length).toBe(5);
  expect(res[1].correctAnswer).toBe('E');

  expect(res[3].sourceQuestionNumber).toBe('4');
  expect(res[3].options.length).toBe(5);
  expect(res[3].correctAnswer).toBe('D');
});
