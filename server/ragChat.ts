/**
 * RAG-powered chat with streaming support.
 * Retrieves relevant document chunks and generates responses using LLM.
 */

import { invokeLLM } from "./_core/llm";
import { getDocumentChunks } from "./db";

export interface RAGChatOptions {
  query: string;
  documentId: number;
  chatHistory: Array<{ role: "user" | "assistant"; content: string }>;
}

/**
 * Generate a RAG-powered response with document context.
 * Returns the full response text (streaming support to be added).
 */
export async function generateRAGResponse(options: RAGChatOptions): Promise<string> {
  const { query, documentId, chatHistory } = options;

  // Retrieve relevant chunks from the document
  const chunks = await getDocumentChunks(documentId);
  const contextText = chunks
    .map((chunk) => chunk.text)
    .join("\n\n---\n\n");

  // Build the system prompt with context
  const systemPrompt = `You are a helpful AI assistant specialized in analyzing documents. 
You have access to the following document content for context:

<document_context>
${contextText}
</document_context>

Use the document context above to answer the user's questions accurately and thoroughly.
If the answer is not found in the document, say so clearly.`;

  // Build the messages array
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...chatHistory,
    { role: "user" as const, content: query },
  ];

  // Call the LLM
  const response = await invokeLLM({
    messages,
    model: "gpt-4o-mini", // Use a capable model for RAG
  });

  // Extract the response text
  const responseText =
    response.choices[0]?.message?.content || "No response generated";

  return typeof responseText === "string" ? responseText : JSON.stringify(responseText);
}

/**
 * Generate a streaming RAG response.
 * Returns an async generator that yields chunks of the response.
 */
export async function* generateRAGResponseStreaming(
  options: RAGChatOptions
): AsyncGenerator<string, void, unknown> {
  const { query, documentId, chatHistory } = options;

  // Retrieve relevant chunks from the document
  const chunks = await getDocumentChunks(documentId);
  const contextText = chunks
    .map((chunk) => chunk.text)
    .join("\n\n---\n\n");

  // Build the system prompt with context
  const systemPrompt = `You are a helpful AI assistant specialized in analyzing documents.
You have access to the following document content for context:

<document_context>
${contextText}
</document_context>

Use the document context above to answer the user's questions accurately and thoroughly.
If the answer is not found in the document, say so clearly.`;

  // Build the messages array
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...chatHistory,
    { role: "user" as const, content: query },
  ];

  // For now, we'll yield the full response
  // TODO: Implement true streaming with SSE when the LLM helper supports stream: true
  try {
    const response = await invokeLLM({
      messages,
      model: "gpt-4o-mini",
    });

    const responseText =
      response.choices[0]?.message?.content || "No response generated";
    const text = typeof responseText === "string" ? responseText : JSON.stringify(responseText);

    // Simulate streaming by yielding in chunks
    const chunkSize = 50;
    for (let i = 0; i < text.length; i += chunkSize) {
      yield text.substring(i, i + chunkSize);
    }
  } catch (error) {
    yield `Error generating response: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
