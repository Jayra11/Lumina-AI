/**
 * Document processing utilities for text extraction and chunking.
 * Supports PDF, TXT, and DOCX files.
 */

import * as fs from "fs";
import * as path from "path";
import * as pdfParseModule from "pdf-parse";
const pdfParse = (pdfParseModule as any).default || pdfParseModule;
import * as mammoth from "mammoth";

// Simple text chunking strategy
const CHUNK_SIZE = 1000; // characters per chunk
const CHUNK_OVERLAP = 200; // overlap between chunks

export interface ChunkedDocument {
  chunks: string[];
  fullText: string;
}

export interface DocumentChunk {
  index: number;
  text: string;
  startChar: number;
  endChar: number;
}

/**
 * Extract text from a file buffer based on file type.
 */
export async function extractTextFromFile(
  fileBuffer: Buffer,
  fileType: "pdf" | "txt" | "docx"
): Promise<string> {
  switch (fileType) {
    case "txt":
      return fileBuffer.toString("utf-8");
    case "pdf":
      return extractTextFromPDF(fileBuffer);
    case "docx":
      return extractTextFromDOCX(fileBuffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Extract text from PDF buffer.
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfParseFunc = typeof pdfParse === "function" ? pdfParse : (pdfParse as any).default;
    const data = await pdfParseFunc(buffer);
    return data.text || "[PDF could not be parsed]";
  } catch (error) {
    console.error("PDF extraction error:", error);
    return "[Failed to extract text from PDF]";
  }
}

/**
 * Extract text from DOCX buffer.
 */
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "[DOCX could not be parsed]";
  } catch (error) {
    console.error("DOCX extraction error:", error);
    return "[Failed to extract text from DOCX]";
  }
}

/**
 * Split text into overlapping chunks for RAG with metadata.
 */
export function chunkText(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunkText = text.substring(start, end);

    chunks.push({
      index,
      text: chunkText,
      startChar: start,
      endChar: end,
    });

    start = end - overlap;
    index++;
  }

  return chunks;
}

/**
 * Simple version that returns just strings (for backward compatibility).
 */
export function chunkTextSimple(text: string, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  return chunkText(text, chunkSize, overlap).map((chunk) => chunk.text);
}

/**
 * Generate a simple summary from text (first N words).
 * In production, use an LLM for better summaries.
 */
export function generateSimpleSummary(text: string, wordLimit = 100): string {
  const words = text.split(/\s+/).slice(0, wordLimit);
  return words.join(" ") + (words.length === wordLimit ? "..." : "");
}

/**
 * Validate file content based on file type.
 */
export function validateFileContent(buffer: Buffer, fileType: "pdf" | "txt" | "docx"): boolean {
  if (fileType === "pdf") {
    // PDF files start with %PDF
    return buffer.toString("ascii", 0, 4) === "%PDF";
  }
  if (fileType === "docx") {
    // DOCX files are ZIP archives, start with PK
    return buffer.toString("ascii", 0, 2) === "PK";
  }
  // TXT files can be any text
  return true;
}
