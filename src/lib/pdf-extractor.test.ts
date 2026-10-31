import { describe, it, expect } from 'vitest';
import { extractTextFromPDF } from './pdf-extractor';
import fs from 'fs';
import path from 'path';

describe('PDF Extractor (pdfjs-dist)', () => {
  it('should successfully extract text from standard/non-embedded fonts PDF', async () => {
    // The test requires the actual ReportLab PDF to exist in the test environment
    // I'll assume the path to the downloaded ReportLab PDF is valid here since it's an integration test
    const filePath = path.join(process.cwd(), 'scratch', 'test_files', 'IBPS_RRB_Office_Assistant_Clerk_2026_Title_Body.pdf');
    
    // We will copy the file to scratch/test_files before running tests
    const buffer = fs.readFileSync(filePath);
    
    const text = await extractTextFromPDF(buffer);
    
    expect(text).toContain('IBPS RRB Office Assistant');
    expect(text).toContain('Preliminary Examination');
    
    // The parsing should not throw any missing font errors
  });
});
