import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getUserDocuments,
  getDocumentById,
  createDocument,
  getChatsByDocument,
  createChat,
  getChatById,
  getMessagesByChat,
  createMessage,
  createVisualSummary,
  getVisualSummariesByDocument,
} from "./db";
import { extractTextFromFile, chunkText, generateSimpleSummary } from "./documentProcessor";
import { generateRAGResponse } from "./ragChat";
import { storagePut } from "./storage";
import { generateImage } from "./_core/imageGeneration";
import { transcribeAudio } from "./_core/voiceTranscription";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Document management
  documents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getUserDocuments(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getDocumentById(input.documentId, ctx.user.id);
      }),

    upload: protectedProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileType: z.enum(["pdf", "txt", "docx"]),
          fileData: z.string(), // base64 encoded
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Decode base64 file data
          const fileBuffer = Buffer.from(input.fileData, "base64");

          // Upload to S3
          const storageKey = `${ctx.user.id}-documents/${Date.now()}-${input.fileName}`;
          const { url } = await storagePut(storageKey, fileBuffer, "application/octet-stream");

          // Extract text from file
          const textContent = await extractTextFromFile(fileBuffer, input.fileType);

          // Create document record
          const result = await createDocument({
            userId: ctx.user.id,
            fileName: input.fileName,
            fileType: input.fileType,
            storageKey,
            fileSize: fileBuffer.length,
            textContent,
            summary: generateSimpleSummary(textContent),
          });

          return { success: true, message: "Document uploaded successfully" };
        } catch (error) {
          throw new Error(`Failed to upload document: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }),
  }),

  // Chat management
  chats: router({
    listByDocument: protectedProcedure
      .input(z.object({ documentId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getChatsByDocument(input.documentId, ctx.user.id);
      }),

    create: protectedProcedure
      .input(z.object({ documentId: z.number(), title: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const chat = await createChat({
          userId: ctx.user.id,
          documentId: input.documentId,
          title: input.title || "New Chat",
        });
        return chat;
      }),

    get: protectedProcedure
      .input(z.object({ chatId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getChatById(input.chatId, ctx.user.id);
      }),
  }),

  // Messages and RAG chat
  messages: router({
    list: protectedProcedure
      .input(z.object({ chatId: z.number() }))
      .query(async ({ ctx, input }) => {
        return getMessagesByChat(input.chatId);
      }),

    send: protectedProcedure
      .input(
        z.object({
          chatId: z.number(),
          documentId: z.number(),
          content: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          // Save user message
          const userMsg = await createMessage({
            chatId: input.chatId,
            role: "user",
            content: input.content,
          });

          // Get chat history for context
          const messages = await getMessagesByChat(input.chatId);
          const chatHistory = messages.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          }));

          // Generate RAG response
          const response = await generateRAGResponse({
            query: input.content,
            documentId: input.documentId,
            chatHistory,
          });

          // Save assistant message
          const assistantMsg = await createMessage({
            chatId: input.chatId,
            role: "assistant",
            content: response,
          });

          return { success: true, response };
        } catch (error) {
          throw new Error(`Failed to send message: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }),
  }),

  // Summarization
  summarize: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");

        // Use LLM to generate a detailed summary
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: "You are a document summarization expert. Provide a concise summary with key points.",
            },
            {
              role: "user",
              content: `Please summarize this document:\n\n${doc.textContent?.substring(0, 5000) || "No content"}`,
            },
          ],
          model: "gpt-4o-mini",
        });

        const summary = response.choices[0]?.message?.content || "Summary generation failed";
        return { success: true, summary };
      } catch (error) {
        throw new Error(`Failed to summarize: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  // Visual summary generation
  generateVisualSummary: protectedProcedure
    .input(z.object({ documentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const doc = await getDocumentById(input.documentId, ctx.user.id);
        if (!doc) throw new Error("Document not found");

        // Generate a prompt for the visual summary
        const prompt = `Create an infographic-style visual summary of this document content. Make it visually appealing with key points, statistics, and insights:\n\n${doc.textContent?.substring(0, 2000) || "No content"}`;

        // Generate the image
        const imageResult = await generateImage({
          prompt,
          model: "MODEL_GPT_IMAGE_2",
          quality: "high",
        });
        const imageUrl = imageResult.url || "";

        // Save visual summary record
        const summary = await createVisualSummary({
          userId: ctx.user.id,
          documentId: input.documentId,
          imageUrl: imageUrl || "",
          storageKey: imageUrl || "",
          prompt: prompt || "",
        });

        return { success: true, imageUrl: imageUrl || "" };
      } catch (error) {
        throw new Error(`Failed to generate visual summary: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  // Image analysis
  analyzeImage: protectedProcedure
    .input(
      z.object({
        imageUrl: z.string(),
        query: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: input.query },
                { type: "image_url", image_url: { url: input.imageUrl } },
              ],
            },
          ],
          model: "gpt-4o",
        });

        const analysis = response.choices[0]?.message?.content || "Analysis failed";
        return { success: true, analysis };
      } catch (error) {
        throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  // Voice transcription
  transcribeVoice: protectedProcedure
    .input(z.object({ audioUrl: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: "en",
        });

        const text = typeof result === "object" && "text" in result ? result.text : "Transcription failed";
        return { success: true, text };
      } catch (error) {
        throw new Error(`Failed to transcribe audio: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),
});

export type AppRouter = typeof appRouter;
