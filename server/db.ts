import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, profiles, InsertProfile, properties, InsertProperty, verificationTasks, rentals, messages, reviews, disputes } from "../drizzle/schema";
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

// Profile queries
export async function getOrCreateProfile(userId: number, userRole: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  const newProfile: InsertProfile = {
    userId,
    userRole: userRole as any,
    onboardingCompleted: false,
    profileSetupCompleted: false,
    verificationCompleted: false,
  };
  
  await db.insert(profiles).values(newProfile);
  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return result[0];
}

export async function updateProfile(userId: number, data: Partial<InsertProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(profiles).set(data).where(eq(profiles.userId, userId));
  return db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
}

export async function getProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Property queries
export async function createProperty(data: InsertProperty) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(properties).values(data);
  // Fetch the created property
  const result = await db.select().from(properties).orderBy(properties.id).limit(1);
  return result[0];
}

export async function getUserProperties(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(properties).where(eq(properties.userId, userId)).orderBy(properties.createdAt);
}

export async function getPropertyById(propertyId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateProperty(propertyId: number, data: Partial<InsertProperty>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(properties).set(data).where(eq(properties.id, propertyId));
  return getPropertyById(propertyId);
}

// Verification task queries
export async function createVerificationTask(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(verificationTasks).values(data);
  const result = await db.select().from(verificationTasks).orderBy(verificationTasks.id).limit(1);
  return result[0];
}

export async function getPendingVerifications(agentId?: number) {
  const db = await getDb();
  if (!db) return [];
  
  if (agentId) {
    return db.select().from(verificationTasks)
      .where(and(eq(verificationTasks.assignedAgentId, agentId), eq(verificationTasks.status, 'pending')))
      .orderBy(verificationTasks.createdAt);
  }
  
  return db.select().from(verificationTasks)
    .where(eq(verificationTasks.status, 'pending'))
    .orderBy(verificationTasks.createdAt);
}

// Rental queries
export async function createRental(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(rentals).values(data);
  const result = await db.select().from(rentals).orderBy(rentals.id).limit(1);
  return result[0];
}

export async function getUserRentals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(rentals)
    .where(eq(rentals.tenantId, userId))
    .orderBy(rentals.createdAt);
}

// Message queries
export async function createMessage(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(messages).values(data);
  const result = await db.select().from(messages).orderBy(messages.id).limit(1);
  return result[0];
}

export async function getRentalMessages(rentalId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(messages)
    .where(eq(messages.rentalId, rentalId))
    .orderBy(messages.createdAt);
}

// Review queries
export async function createReview(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(reviews).values(data);
  const result = await db.select().from(reviews).orderBy(reviews.id).limit(1);
  return result[0];
}

export async function getUserReviews(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(reviews)
    .where(eq(reviews.revieweeId, userId))
    .orderBy(reviews.createdAt);
}

// Dispute queries
export async function createDispute(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(disputes).values(data);
  const result = await db.select().from(disputes).orderBy(disputes.id).limit(1);
  return result[0];
}

export async function getRentalDisputes(rentalId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(disputes)
    .where(eq(disputes.rentalId, rentalId))
    .orderBy(disputes.createdAt);
}
