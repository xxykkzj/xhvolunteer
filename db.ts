import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, userRankSnapshot } from "../drizzle/schema";
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
      name: user.name || 'Unknown',
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);


    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.updatedAt = new Date();
    }

    const result = await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });

    // Initialize userRankSnapshot for new users
    // Check if this is a new user (insertId will be > 0 for new inserts)
    if (result[0]?.insertId) {
      const newUserId = Number(result[0].insertId);
      await db.insert(userRankSnapshot).values({
        userId: newUserId,
        totalHours: 0,
        totalPoints: 0,
        rankLevel: 1,
        joyBadge: false,
      }).catch((err) => {
        // Ignore duplicate key errors (in case snapshot already exists)
        if (!err.message?.includes('Duplicate entry')) {
          console.error("[Database] Failed to initialize userRankSnapshot:", err);
        }
      });
    }
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

// TODO: add feature queries here as your schema grows.
