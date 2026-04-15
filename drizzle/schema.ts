import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, decimal, json, longtext, index, foreignKey } from "drizzle-orm/mysql-core";

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
 * User profiles with role-specific information and verification status
 */
export const profiles = mysqlTable("profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  userRole: mysqlEnum("userRole", ["buyer", "seller", "renter", "landlord", "investor", "admin", "agent"]).notNull(),
  fullName: varchar("fullName", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  profilePhoto: varchar("profilePhoto", { length: 500 }),
  
  // Verification fields
  isLiveVerified: boolean("isLiveVerified").default(false).notNull(),
  liveVerificationDate: timestamp("liveVerificationDate"),
  idDocumentUrl: varchar("idDocumentUrl", { length: 500 }),
  idDocumentType: varchar("idDocumentType", { length: 50 }), // passport, driver_license, national_id, etc
  idVerificationStatus: mysqlEnum("idVerificationStatus", ["pending", "approved", "rejected"]).default("pending"),
  idVerificationDate: timestamp("idVerificationDate"),
  
  // Onboarding data
  propertyGoal: varchar("propertyGoal", { length: 100 }),
  preferredStates: json("preferredStates"), // JSON array of states
  propertyTypes: json("propertyTypes"), // JSON array of property types
  budgetMin: decimal("budgetMin", { precision: 15, scale: 2 }),
  budgetMax: decimal("budgetMax", { precision: 15, scale: 2 }),
  needsFinancing: boolean("needsFinancing").default(false),
  
  // Referral
  referralCode: varchar("referralCode", { length: 20 }).unique(),
  referralEarnings: decimal("referralEarnings", { precision: 15, scale: 2 }).default("0"),
  referredByCode: varchar("referredByCode", { length: 20 }),
  
  // Onboarding status
  onboardingCompleted: boolean("onboardingCompleted").default(false),
  profileSetupCompleted: boolean("profileSetupCompleted").default(false),
  verificationCompleted: boolean("verificationCompleted").default(false),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [{
  userIdIdx: index("userIdIdx").on(table.userId),
  userRoleIdx: index("userRoleIdx").on(table.userRole),
}]);

export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = typeof profiles.$inferInsert;

/**
 * Properties/listings created by sellers and landlords
 */
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: longtext("description"),
  category: mysqlEnum("category", ["residential", "commercial", "land", "hotel", "shortlet"]).notNull(),
  propertyType: varchar("propertyType", { length: 100 }),
  
  // Location
  state: varchar("state", { length: 100 }).notNull(),
  city: varchar("city", { length: 100 }),
  address: varchar("address", { length: 500 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  
  // Pricing
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("NGN"),
  
  // Media
  photos: json("photos"), // JSON array of photo URLs
  videos: json("videos"), // JSON array of video URLs
  thumbnailUrl: varchar("thumbnailUrl", { length: 500 }),
  
  // Status and verification
  status: mysqlEnum("status", ["draft", "pending_verification", "verified", "published", "rejected", "delisted"]).default("draft"),
  verificationStatus: mysqlEnum("verificationStatus", ["pending", "approved", "rejected"]).default("pending"),
  assignedAgentId: int("assignedAgentId"),
  verificationNotes: longtext("verificationNotes"),
  verificationDate: timestamp("verificationDate"),
  
  // Property details
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  squareFeet: int("squareFeet"),
  amenities: json("amenities"), // JSON array of amenities
  
  // Rental specific
  rentalDuration: varchar("rentalDuration", { length: 50 }), // daily, weekly, monthly, yearly
  availableFrom: timestamp("availableFrom"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [{
  userIdIdx: index("propertyUserIdIdx").on(table.userId),
  statusIdx: index("propertyStatusIdx").on(table.status),
  categoryIdx: index("propertyCategoryIdx").on(table.category),
  stateIdx: index("propertyStateIdx").on(table.state),
}]);

export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

/**
 * Verification tasks for DealMatch agents
 */
export const verificationTasks = mysqlTable("verificationTasks", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  assignedAgentId: int("assignedAgentId"),
  taskType: mysqlEnum("taskType", ["property_verification", "user_verification", "document_review"]),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "rejected"]).default("pending"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  
  // Verification details
  checklist: json("checklist"), // JSON array of checklist items
  notes: longtext("notes"),
  photosUploaded: json("photosUploaded"), // JSON array of verification photo URLs
  
  // Timestamps
  assignedAt: timestamp("assignedAt").defaultNow(),
  completedAt: timestamp("completedAt"),
  dueDate: timestamp("dueDate"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [{
  propertyIdIdx: index("taskPropertyIdIdx").on(table.propertyId),
  agentIdIdx: index("taskAgentIdIdx").on(table.assignedAgentId),
  statusIdx: index("taskStatusIdx").on(table.status),
}]);

export type VerificationTask = typeof verificationTasks.$inferSelect;
export type InsertVerificationTask = typeof verificationTasks.$inferInsert;

/**
 * Rental agreements and bookings between landlords and tenants
 */
export const rentals = mysqlTable("rentals", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  landlordId: int("landlordId").notNull(),
  tenantId: int("tenantId").notNull(),
  
  // Rental details
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  monthlyRent: decimal("monthlyRent", { precision: 15, scale: 2 }),
  totalAmount: decimal("totalAmount", { precision: 15, scale: 2 }),
  
  // Status
  status: mysqlEnum("status", ["pending", "active", "completed", "cancelled", "disputed"]).default("pending"),
  
  // Agreement
  agreementUrl: varchar("agreementUrl", { length: 500 }),
  termsAccepted: boolean("termsAccepted").default(false),
  
  // Payment tracking
  paidAmount: decimal("paidAmount", { precision: 15, scale: 2 }).default("0"),
  paymentStatus: mysqlEnum("paymentStatus", ["pending", "partial", "paid", "overdue"]).default("pending"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [{
  propertyIdIdx: index("rentalPropertyIdIdx").on(table.propertyId),
  landlordIdIdx: index("rentalLandlordIdIdx").on(table.landlordId),
  tenantIdIdx: index("rentalTenantIdIdx").on(table.tenantId),
  statusIdx: index("rentalStatusIdx").on(table.status),
}]);

export type Rental = typeof rentals.$inferSelect;
export type InsertRental = typeof rentals.$inferInsert;

/**
 * Messages between landlords and tenants
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  rentalId: int("rentalId").notNull(),
  senderId: int("senderId").notNull(),
  recipientId: int("recipientId").notNull(),
  
  content: longtext("content").notNull(),
  isRead: boolean("isRead").default(false),
  readAt: timestamp("readAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [{
  rentalIdIdx: index("messageRentalIdIdx").on(table.rentalId),
  senderIdIdx: index("messageSenderIdIdx").on(table.senderId),
  recipientIdIdx: index("messageRecipientIdIdx").on(table.recipientId),
}]);

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

/**
 * Reviews from both landlords and tenants
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  rentalId: int("rentalId").notNull(),
  reviewerId: int("reviewerId").notNull(),
  revieweeId: int("revieweeId").notNull(),
  
  rating: int("rating").notNull(), // 1-5 stars
  comment: longtext("comment"),
  category: mysqlEnum("category", ["cleanliness", "communication", "accuracy", "location", "value", "overall"]),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [{
  rentalIdIdx: index("reviewRentalIdIdx").on(table.rentalId),
  reviewerIdIdx: index("reviewReviewerIdIdx").on(table.reviewerId),
  revieweeIdIdx: index("reviewRevieweeIdIdx").on(table.revieweeId),
}]);

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Disputes between landlords and tenants
 */
export const disputes = mysqlTable("disputes", {
  id: int("id").autoincrement().primaryKey(),
  rentalId: int("rentalId").notNull(),
  initiatedById: int("initiatedById").notNull(),
  
  title: varchar("title", { length: 255 }).notNull(),
  description: longtext("description").notNull(),
  category: mysqlEnum("category", ["payment", "maintenance", "damage", "behavior", "other"]),
  
  status: mysqlEnum("status", ["open", "in_review", "resolved", "escalated"]).default("open"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium"),
  
  // Resolution
  assignedAgentId: int("assignedAgentId"),
  resolution: longtext("resolution"),
  resolvedAt: timestamp("resolvedAt"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [{
  rentalIdIdx: index("disputeRentalIdIdx").on(table.rentalId),
  initiatedByIdIdx: index("disputeInitiatedByIdIdx").on(table.initiatedById),
  statusIdx: index("disputeStatusIdx").on(table.status),
  agentIdIdx: index("disputeAgentIdIdx").on(table.assignedAgentId),
}]);

export type Dispute = typeof disputes.$inferSelect;
export type InsertDispute = typeof disputes.$inferInsert;