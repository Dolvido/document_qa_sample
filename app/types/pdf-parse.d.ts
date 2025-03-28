declare module 'pdf-parse' {
  export interface PDFData {
    text: string;
    numpages: number;
    info: Record<string, any>;
    metadata: Record<string, any>;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer | Uint8Array, options?: {
    pagerender?: (pageData: any) => string;
    max?: number;
    version?: string;
  }): Promise<PDFData>;

  export default pdfParse;
} 