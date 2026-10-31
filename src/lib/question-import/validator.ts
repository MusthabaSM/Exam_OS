import { ParsedQuestion, ValidationStatus } from "./types";

export function validateQuestion(q: ParsedQuestion): void {
  q.issues = [];
  q.status = "VALID";

  if (!q.questionText || q.questionText.trim().length === 0) {
    q.issues.push("Missing question text.");
    q.status = "REVIEW_REQUIRED";
  }

  if (!q.options || q.options.length < 2 || q.options.length > 6) {
    q.issues.push(`Found ${q.options ? q.options.length : 0} options. Between 2 and 6 options are required.`);
    q.status = "REVIEW_REQUIRED";
  }

  // Check unique option keys
  if (q.options && q.options.length > 0) {
    const keys = q.options.map(o => o.key.toUpperCase());
    const uniqueKeys = new Set(keys);
    if (uniqueKeys.size !== keys.length) {
      q.issues.push("Duplicate option keys detected.");
      q.status = "REVIEW_REQUIRED";
    }
  }

  if (!q.correctAnswer || q.correctAnswer.trim().length === 0) {
    q.issues.push("Missing correct answer.");
    q.status = "REVIEW_REQUIRED";
  } else {
    // Answer must correspond to an option key OR exactly match option text
    // The parser will try to resolve answer text to key. If it didn't resolve,
    // and it's not a valid key, report issue.
    let upperAnswer = q.correctAnswer.toUpperCase().trim();
    if (upperAnswer.match(/^\d+$/)) {
       const num = parseInt(upperAnswer, 10);
       if (num >= 1 && num <= 26) {
          upperAnswer = String.fromCharCode(64 + num);
          q.correctAnswer = upperAnswer;
       }
    }
    
    // Allow single letters A-E or numbers 1-5 even if the option is slightly different?
    // The instruction says "correctAnswer corresponds to an option"
    const matchedKey = q.options.find(o => o.key.toUpperCase() === upperAnswer);
    if (!matchedKey) {
       // Maybe it matches option text?
       const matchedText = q.options.find(o => o.text.trim().toLowerCase() === q.correctAnswer!.trim().toLowerCase());
       if (matchedText) {
          // Fix it to be the key
          q.correctAnswer = matchedText.key;
       } else {
          q.issues.push(`Correct answer "${q.correctAnswer}" does not match any option key.`);
          q.status = "REVIEW_REQUIRED";
       }
    }
  }
}
