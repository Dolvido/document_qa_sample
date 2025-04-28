/**
 * Basic PDF text extraction utility that works in the Edge runtime
 * This is a fallback for when the dedicated PDF processing endpoint can't be reached
 */
export async function extractBasicPdfText(base64Data: string): Promise<string> {
  try {
    // Clean the base64 data
    const cleanedData = base64Data.replace(/^data:application\/pdf;base64,/, '');
    
    // Decode base64 to a string
    let decodedData = '';
    try {
      decodedData = atob(cleanedData);
    } catch (e) {
      console.error('Error decoding base64:', e);
      return 'Error decoding PDF data';
    }
    
    // Find text fragments using multiple approaches for better extraction
    const textFragments: string[] = [];
    
    // 1. Look for text between parentheses (common PDF text encoding)
    const textRegex = /\(([^)]+)\)/g;
    let match;
    
    while ((match = textRegex.exec(decodedData)) !== null) {
      // If the match looks like text (not binary data)
      if (/^[\x20-\x7E\s]+$/.test(match[1]) && match[1].length > 1) {
        textFragments.push(match[1]);
      }
    }
    
    // 2. Look for text after /Text markers
    const textMarkerRegex = /\/Text[^(]*\(([^)]+)\)/g;
    while ((match = textMarkerRegex.exec(decodedData)) !== null) {
      if (/^[\x20-\x7E\s]+$/.test(match[1]) && match[1].length > 1) {
        textFragments.push(match[1]);
      }
    }
    
    // 3. Look for text preceded by /TJ markers (another common text marker)
    const tjRegex = /\/TJ\s*\[\s*(?:\([^)]+\)\s*)+\]/g;
    const innerTextRegex = /\(([^)]+)\)/g;
    
    let tjMatch;
    while ((tjMatch = tjRegex.exec(decodedData)) !== null) {
      // Extract inner text
      let innerMatch;
      const tjContent = tjMatch[0];
      while ((innerMatch = innerTextRegex.exec(tjContent)) !== null) {
        if (/^[\x20-\x7E\s]+$/.test(innerMatch[1]) && innerMatch[1].length > 1) {
          textFragments.push(innerMatch[1]);
        }
      }
    }
    
    // 4. Look for words after /Tj (single string text operators)
    const tjWordRegex = /\/Tj\s*\(([^)]+)\)/g;
    while ((match = tjWordRegex.exec(decodedData)) !== null) {
      if (/^[\x20-\x7E\s]+$/.test(match[1]) && match[1].length > 1) {
        textFragments.push(match[1]);
      }
    }
    
    // 5. Look for content after /Contents marker
    const contentRegex = /\/Contents\s*\(([^)]+)\)/g;
    while ((match = contentRegex.exec(decodedData)) !== null) {
      if (/^[\x20-\x7E\s]+$/.test(match[1]) && match[1].length > 1) {
        textFragments.push(match[1]);
      }
    }
    
    // 6. Look for text immediately after BT (Begin Text) markers
    const btRegex = /BT\s*\(([^)]+)\)/g;
    while ((match = btRegex.exec(decodedData)) !== null) {
      if (/^[\x20-\x7E\s]+$/.test(match[1]) && match[1].length > 1) {
        textFragments.push(match[1]);
      }
    }
    
    // 7. Try to find sequences of words by looking for text patterns
    const wordSequenceRegex = /\(([a-zA-Z0-9,\.\s']{3,})\)/g;
    while ((match = wordSequenceRegex.exec(decodedData)) !== null) {
      if (match[1].split(/\s+/).length > 2) { // Only include if it has multiple words
        textFragments.push(match[1]);
      }
    }
    
    // Join all found text fragments
    let extractedText = textFragments.join(' ');
    
    // Clean up the text
    extractedText = extractedText
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Remove duplicate fragments that often occur in PDFs
    const sentences = extractedText.split(/[.!?]\s+/);
    const uniqueSentences = Array.from(new Set(sentences));
    extractedText = uniqueSentences.join('. ');
    
    if (extractedText.length < 10) {
      return "This PDF file doesn't contain easily extractable text. It might be scanned or image-based.";
    }
    
    return extractedText || "Unable to extract meaningful text from this PDF.";
  } catch (error) {
    console.error("Error in basic PDF extraction:", error);
    return "Failed to extract text from PDF document.";
  }
} 