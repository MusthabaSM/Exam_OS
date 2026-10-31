import { describe, it, expect } from 'vitest';
import { validatePdfFile } from '../src/lib/pdf-validation';

describe('PDF Security Validation', () => {
  it('rejects null file', async () => {
    const res = await validatePdfFile(null);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/No file/);
  });

  it('rejects empty file', async () => {
    const file = new File([], 'empty.pdf', { type: 'application/pdf' });
    const res = await validatePdfFile(file);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/empty/);
  });

  it('rejects oversized file', async () => {
    // 6MB file
    const buffer = new ArrayBuffer(6 * 1024 * 1024);
    const file = new File([buffer], 'large.pdf', { type: 'application/pdf' });
    const res = await validatePdfFile(file);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/exceeds/);
  });

  it('rejects invalid mime type', async () => {
    const file = new File(['%PDF-1.4'], 'test.txt', { type: 'text/plain' });
    const res = await validatePdfFile(file);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/Invalid file type/);
  });

  it('rejects missing PDF signature', async () => {
    const file = new File(['Hello World'], 'fake.pdf', { type: 'application/pdf' });
    const res = await validatePdfFile(file);
    expect(res.valid).toBe(false);
    expect(res.error).toMatch(/Invalid PDF format/);
  });

  it('accepts valid PDF', async () => {
    const file = new File(['%PDF-1.4...data'], 'real.pdf', { type: 'application/pdf' });
    const res = await validatePdfFile(file);
    expect(res.valid).toBe(true);
  });
});
