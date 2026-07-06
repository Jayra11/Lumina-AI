import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, documents, chats, messages, visualSummaries, documentChunks, InsertDocument, InsertChat, InsertMessage, InsertVisualSummary } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Document queries
export async function getUserDocuments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.userId, userId));
}

export async function getDocumentById(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.userId, userId)))
    .limit(1);
  return result[0] || null;
}

export async function createDocument(doc: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(doc);
  return result;
}

// Chat queries
export async function getChatsByDocument(documentId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(chats)
    .where(and(eq(chats.documentId, documentId), eq(chats.userId, userId)));
}

export async function createChat(chat: InsertChat) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(chats).values(chat);
  return result;
}

export async function getChatById(chatId: number, userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, userId)))
    .limit(1);
  return result[0] || null;
}

// Message queries
export async function getMessagesByChat(chatId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.createdAt);
}

export async function createMessage(msg: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(messages).values(msg);
}

export async function updateMessage(messageId: number, content: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db
    .update(messages)
    .set({ content })
    .where(eq(messages.id, messageId));
}

// Visual summary queries
export async function createVisualSummary(summary: InsertVisualSummary) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(visualSummaries).values(summary);
}

export async function getVisualSummariesByDocument(documentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(visualSummaries)
    .where(eq(visualSummaries.documentId, documentId));
}

// Document chunk queries
export async function createDocumentChunk(chunk: { documentId: number; chunkIndex: number; text: string; embedding?: number[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(documentChunks).values(chunk);
}

export async function getDocumentChunks(documentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documentChunks).where(eq(documentChunks.documentId, documentId));
}
