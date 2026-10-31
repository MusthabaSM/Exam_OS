export async function validatePdfFile(file: File | null): Promise<{ valid: boolean; error?: string }> {
  if (!file) {
    return { valid: false, error: 'No file uploaded.' };
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty.' };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'File size exceeds the 5 MB limit.' };
  }

  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Invalid file type. Only PDF files are allowed.' };
  }

  try {
    // Read the first 5 bytes to verify the PDF signature
    const arrayBuffer = await file.slice(0, 5).arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const signature = String.fromCharCode(...bytes);
    
    if (signature !== '%PDF-') {
      return { valid: false, error: 'Invalid PDF format or corrupted file.' };
    }
  } catch (error) {
    return { valid: false, error: 'Failed to read file signature.' };
  }

  return { valid: true };
}
