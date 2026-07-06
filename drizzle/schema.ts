import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, boolean, longtext } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Documents uploaded by users.
 * Stores metadata about PDFs, TXT, DOCX files.
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileType: mysqlEnum("fileType", ["pdf", "txt", "docx"]).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  fileSize: int("fileSize").notNull(),
  textContent: longtext("textContent"), // Full extracted text for RAG
  summary: text("summary"), // Quick summary of document
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Chat sessions per document.
 * Each document can have multiple chat conversations.
 */
export const chats = mysqlTable("chats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  documentId: int("documentId").notNull(),
  title: varchar("title", { length: 255 }), // Auto-generated from first message
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Chat = typeof chats.$inferSelect;
export type InsertChat = typeof chats.$inferInsert;

/**
 * Chat messages in a conversation.
 * Stores user queries and AI responses with streaming support.
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  chatId: int("chatId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: longtext("content").notNull(),
  isStreaming: boolean("isStreaming").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * AI-generated visual summary cards.
 * Stores infographic-style images derived from document content.
 */
export const visualSummaries = mysqlTable("visualSummaries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  documentId: int("documentId").notNull(),
  imageUrl: varchar("imageUrl", { length: 512 }).notNull(),
  storageKey: varchar("storageKey", { length: 512 }).notNull(),
  prompt: text("prompt"), // The prompt used to generate the image
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type VisualSummary = typeof visualSummaries.$inferSelect;
export type InsertVisualSummary = typeof visualSummaries.$inferInsert;

/**
 * Document embeddings for RAG retrieval.
 * Stores chunked text and vector embeddings for semantic search.
 */
export const documentChunks = mysqlTable("documentChunks", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  chunkIndex: int("chunkIndex").notNull(),
  text: longtext("text").notNull(),
  embedding: json("embedding"), // Store as JSON array of floats
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DocumentChunk = typeof documentChunks.$inferSelect;
export type InsertDocumentChunk = typeof documentChunks.$inferInsert;

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  documents: many(documents),
  chats: many(chats),
  visualSummaries: many(visualSummaries),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  user: one(users, { fields: [documents.userId], references: [users.id] }),
  chats: many(chats),
  chunks: many(documentChunks),
  visualSummaries: many(visualSummaries),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, { fields: [chats.userId], references: [users.id] }),
  document: one(documents, { fields: [chats.documentId], references: [documents.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
}));

export const visualSummariesRelations = relations(visualSummaries, ({ one }) => ({
  user: one(users, { fields: [visualSummaries.userId], references: [users.id] }),
  document: one(documents, { fields: [visualSummaries.documentId], references: [documents.id] }),
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
  document: one(documents, { fields: [documentChunks.documentId], references: [documents.id] }),
}));