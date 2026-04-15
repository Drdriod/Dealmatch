import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getOrCreateProfile,
  updateProfile,
  getProfileByUserId,
  getUserProperties,
  createProperty,
  getPropertyById,
  updateProperty,
  createVerificationTask,
  getPendingVerifications,
  createRental,
  getUserRentals,
  createMessage,
  getRentalMessages,
  createReview,
  getUserReviews,
  createDispute,
  getRentalDisputes,
} from "./db";

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

  // Profile management
  profile: router({
    // Get or create user profile
    getOrCreate: protectedProcedure
      .input(z.object({ userRole: z.string() }))
      .mutation(async ({ ctx, input }) => {
        return getOrCreateProfile(ctx.user.id, input.userRole);
      }),

    // Get current user profile
    me: protectedProcedure.query(async ({ ctx }) => {
      return getProfileByUserId(ctx.user.id);
    }),

    // Update profile
    update: protectedProcedure
      .input(
        z.object({
          fullName: z.string().optional(),
          phone: z.string().optional(),
          profilePhoto: z.string().optional(),
          propertyGoal: z.string().optional(),
          preferredStates: z.array(z.string()).optional(),
          propertyTypes: z.array(z.string()).optional(),
          budgetMin: z.string().optional(),
          budgetMax: z.string().optional(),
          needsFinancing: z.boolean().optional(),
          onboardingCompleted: z.boolean().optional(),
          profileSetupCompleted: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const data: any = {};
        if (input.fullName !== undefined) data.fullName = input.fullName;
        if (input.phone !== undefined) data.phone = input.phone;
        if (input.profilePhoto !== undefined) data.profilePhoto = input.profilePhoto;
        if (input.propertyGoal !== undefined) data.propertyGoal = input.propertyGoal;
        if (input.preferredStates !== undefined) data.preferredStates = JSON.stringify(input.preferredStates);
        if (input.propertyTypes !== undefined) data.propertyTypes = JSON.stringify(input.propertyTypes);
        if (input.budgetMin !== undefined) data.budgetMin = input.budgetMin;
        if (input.budgetMax !== undefined) data.budgetMax = input.budgetMax;
        if (input.needsFinancing !== undefined) data.needsFinancing = input.needsFinancing;
        if (input.onboardingCompleted !== undefined) data.onboardingCompleted = input.onboardingCompleted;
        if (input.profileSetupCompleted !== undefined) data.profileSetupCompleted = input.profileSetupCompleted;

        const result = await updateProfile(ctx.user.id, data);
        return result[0];
      }),

    // Update verification status
    updateVerification: protectedProcedure
      .input(
        z.object({
          isLiveVerified: z.boolean().optional(),
          idDocumentUrl: z.string().optional(),
          idDocumentType: z.string().optional(),
          idVerificationStatus: z.enum(["pending", "approved", "rejected"]).optional(),
          verificationCompleted: z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const data: any = {};
        if (input.isLiveVerified !== undefined) data.isLiveVerified = input.isLiveVerified;
        if (input.idDocumentUrl !== undefined) data.idDocumentUrl = input.idDocumentUrl;
        if (input.idDocumentType !== undefined) data.idDocumentType = input.idDocumentType;
        if (input.idVerificationStatus !== undefined) data.idVerificationStatus = input.idVerificationStatus;
        if (input.verificationCompleted !== undefined) data.verificationCompleted = input.verificationCompleted;

        const result = await updateProfile(ctx.user.id, data);
        return result[0];
      }),
  }),

  // Property management
  properties: router({
    // Create property listing
    create: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          description: z.string().optional(),
          category: z.enum(["residential", "commercial", "land", "hotel", "shortlet"]),
          propertyType: z.string().optional(),
          state: z.string(),
          city: z.string().optional(),
          address: z.string().optional(),
          price: z.string(),
          photos: z.array(z.string()).optional(),
          videos: z.array(z.string()).optional(),
          bedrooms: z.number().optional(),
          bathrooms: z.number().optional(),
          amenities: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const property = await createProperty({
          userId: ctx.user.id,
          title: input.title,
          description: input.description,
          category: input.category,
          propertyType: input.propertyType,
          state: input.state,
          city: input.city,
          address: input.address,
          price: input.price as any,
          photos: input.photos ? JSON.stringify(input.photos) : null,
          videos: input.videos ? JSON.stringify(input.videos) : null,
          bedrooms: input.bedrooms,
          bathrooms: input.bathrooms,
          amenities: input.amenities ? JSON.stringify(input.amenities) : null,
          status: "draft",
          verificationStatus: "pending",
        });

        // Create verification task
        await createVerificationTask({
          propertyId: property!.id,
          taskType: "property_verification",
          status: "pending",
          priority: "medium",
          checklist: JSON.stringify([
            { item: "Physical verification", completed: false },
            { item: "Photos verification", completed: false },
            { item: "Safety check", completed: false },
            { item: "Legal documentation", completed: false },
          ]),
        });

        return { propertyId: property!.id, status: "pending_verification" };
      }),

    // Get user's properties
    myListings: protectedProcedure.query(async ({ ctx }) => {
      return getUserProperties(ctx.user.id);
    }),

    // Get property details
    getById: protectedProcedure
      .input(z.object({ propertyId: z.number() }))
      .query(async ({ input }) => {
        return getPropertyById(input.propertyId);
      }),

    // Update property
    update: protectedProcedure
      .input(
        z.object({
          propertyId: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          photos: z.array(z.string()).optional(),
          videos: z.array(z.string()).optional(),
          status: z.enum(["draft", "pending_verification", "verified", "published", "rejected", "delisted"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const property = await getPropertyById(input.propertyId);
        if (!property || property.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        const data: any = {};
        if (input.title !== undefined) data.title = input.title;
        if (input.description !== undefined) data.description = input.description;
        if (input.photos !== undefined) data.photos = JSON.stringify(input.photos);
        if (input.videos !== undefined) data.videos = JSON.stringify(input.videos);
        if (input.status !== undefined) data.status = input.status;

        return updateProperty(input.propertyId, data);
      }),
  }),

  // Verification tasks (for agents)
  verification: router({
    // Get pending verifications
    getPending: protectedProcedure.query(async ({ ctx }) => {
      // Only agents and admins can see verification tasks
      const profile = await getProfileByUserId(ctx.user.id);
      if (!profile || (profile.userRole !== "agent" && profile.userRole !== "admin")) {
        throw new Error("Unauthorized");
      }

      return getPendingVerifications(ctx.user.id);
    }),

    // Approve property
    approveProperty: protectedProcedure
      .input(
        z.object({
          propertyId: z.number(),
          notes: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile || (profile.userRole !== "agent" && profile.userRole !== "admin")) {
          throw new Error("Unauthorized");
        }

        await updateProperty(input.propertyId, {
          verificationStatus: "approved",
          status: "published",
          verificationNotes: input.notes,
          verificationDate: new Date(),
        });

        return { success: true };
      }),

    // Reject property
    rejectProperty: protectedProcedure
      .input(
        z.object({
          propertyId: z.number(),
          reason: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = await getProfileByUserId(ctx.user.id);
        if (!profile || (profile.userRole !== "agent" && profile.userRole !== "admin")) {
          throw new Error("Unauthorized");
        }

        await updateProperty(input.propertyId, {
          verificationStatus: "rejected",
          status: "rejected",
          verificationNotes: input.reason,
          verificationDate: new Date(),
        });

        return { success: true };
      }),
  }),

  // Rental management
  rentals: router({
    // Get user's rentals
    myRentals: protectedProcedure.query(async ({ ctx }) => {
      return getUserRentals(ctx.user.id);
    }),

    // Create rental agreement
    create: protectedProcedure
      .input(
        z.object({
          propertyId: z.number(),
          landlordId: z.number(),
          startDate: z.string(),
          endDate: z.string(),
          monthlyRent: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const rental = await createRental({
          propertyId: input.propertyId,
          landlordId: input.landlordId,
          tenantId: ctx.user.id,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          monthlyRent: input.monthlyRent,
          status: "pending",
        });

        return { rentalId: rental!.id };
      }),
  }),

  // Messaging
  messages: router({
    // Get rental messages
    getRentalMessages: protectedProcedure
      .input(z.object({ rentalId: z.number() }))
      .query(async ({ input }) => {
        return getRentalMessages(input.rentalId);
      }),

    // Send message
    send: protectedProcedure
      .input(
        z.object({
          rentalId: z.number(),
          recipientId: z.number(),
          content: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const message = await createMessage({
          rentalId: input.rentalId,
          senderId: ctx.user.id,
          recipientId: input.recipientId,
          content: input.content,
          isRead: false,
        });

        return { messageId: message!.id };
      }),
  }),

  // Reviews
  reviews: router({
    // Get user reviews
    getUserReviews: protectedProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return getUserReviews(input.userId);
      }),

    // Create review
    create: protectedProcedure
      .input(
        z.object({
          rentalId: z.number(),
          revieweeId: z.number(),
          rating: z.number().min(1).max(5),
          comment: z.string().optional(),
          category: z.enum(["cleanliness", "communication", "accuracy", "location", "value", "overall"]).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const review = await createReview({
          rentalId: input.rentalId,
          reviewerId: ctx.user.id,
          revieweeId: input.revieweeId,
          rating: input.rating,
          comment: input.comment,
          category: input.category,
        });

        return { reviewId: review!.id };
      }),
  }),

  // Disputes
  disputes: router({
    // Get rental disputes
    getRentalDisputes: protectedProcedure
      .input(z.object({ rentalId: z.number() }))
      .query(async ({ input }) => {
        return getRentalDisputes(input.rentalId);
      }),

    // Create dispute
    create: protectedProcedure
      .input(
        z.object({
          rentalId: z.number(),
          title: z.string(),
          description: z.string(),
          category: z.enum(["payment", "maintenance", "damage", "behavior", "other"]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const dispute = await createDispute({
          rentalId: input.rentalId,
          initiatedById: ctx.user.id,
          title: input.title,
          description: input.description,
          category: input.category,
          status: "open",
          priority: "medium",
        });

        return { disputeId: dispute!.id };
      }),
  }),
});

export type AppRouter = typeof appRouter;
