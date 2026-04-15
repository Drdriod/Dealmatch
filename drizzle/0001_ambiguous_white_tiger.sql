CREATE TABLE `disputes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rentalId` int NOT NULL,
	`initiatedById` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` longtext NOT NULL,
	`category` enum('payment','maintenance','damage','behavior','other'),
	`status` enum('open','in_review','resolved','escalated') DEFAULT 'open',
	`priority` enum('low','medium','high','critical') DEFAULT 'medium',
	`assignedAgentId` int,
	`resolution` longtext,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `disputes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rentalId` int NOT NULL,
	`senderId` int NOT NULL,
	`recipientId` int NOT NULL,
	`content` longtext NOT NULL,
	`isRead` boolean DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userRole` enum('buyer','seller','renter','landlord','investor','admin','agent') NOT NULL,
	`fullName` varchar(255),
	`phone` varchar(20),
	`profilePhoto` varchar(500),
	`isLiveVerified` boolean NOT NULL DEFAULT false,
	`liveVerificationDate` timestamp,
	`idDocumentUrl` varchar(500),
	`idDocumentType` varchar(50),
	`idVerificationStatus` enum('pending','approved','rejected') DEFAULT 'pending',
	`idVerificationDate` timestamp,
	`propertyGoal` varchar(100),
	`preferredStates` json,
	`propertyTypes` json,
	`budgetMin` decimal(15,2),
	`budgetMax` decimal(15,2),
	`needsFinancing` boolean DEFAULT false,
	`referralCode` varchar(20),
	`referralEarnings` decimal(15,2) DEFAULT '0',
	`referredByCode` varchar(20),
	`onboardingCompleted` boolean DEFAULT false,
	`profileSetupCompleted` boolean DEFAULT false,
	`verificationCompleted` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `profiles_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `profiles_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` longtext,
	`category` enum('residential','commercial','land','hotel','shortlet') NOT NULL,
	`propertyType` varchar(100),
	`state` varchar(100) NOT NULL,
	`city` varchar(100),
	`address` varchar(500),
	`latitude` decimal(10,8),
	`longitude` decimal(11,8),
	`price` decimal(15,2) NOT NULL,
	`currency` varchar(3) DEFAULT 'NGN',
	`photos` json,
	`videos` json,
	`thumbnailUrl` varchar(500),
	`status` enum('draft','pending_verification','verified','published','rejected','delisted') DEFAULT 'draft',
	`verificationStatus` enum('pending','approved','rejected') DEFAULT 'pending',
	`assignedAgentId` int,
	`verificationNotes` longtext,
	`verificationDate` timestamp,
	`bedrooms` int,
	`bathrooms` int,
	`squareFeet` int,
	`amenities` json,
	`rentalDuration` varchar(50),
	`availableFrom` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `properties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rentals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`landlordId` int NOT NULL,
	`tenantId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`monthlyRent` decimal(15,2),
	`totalAmount` decimal(15,2),
	`status` enum('pending','active','completed','cancelled','disputed') DEFAULT 'pending',
	`agreementUrl` varchar(500),
	`termsAccepted` boolean DEFAULT false,
	`paidAmount` decimal(15,2) DEFAULT '0',
	`paymentStatus` enum('pending','partial','paid','overdue') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rentals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`rentalId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`revieweeId` int NOT NULL,
	`rating` int NOT NULL,
	`comment` longtext,
	`category` enum('cleanliness','communication','accuracy','location','value','overall'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `verificationTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`propertyId` int NOT NULL,
	`assignedAgentId` int,
	`taskType` enum('property_verification','user_verification','document_review'),
	`status` enum('pending','in_progress','completed','rejected') DEFAULT 'pending',
	`priority` enum('low','medium','high') DEFAULT 'medium',
	`checklist` json,
	`notes` longtext,
	`photosUploaded` json,
	`assignedAt` timestamp DEFAULT (now()),
	`completedAt` timestamp,
	`dueDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `verificationTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `userIdIdx` ON `profiles` (`userId`);
--> statement-breakpoint
CREATE INDEX `userRoleIdx` ON `profiles` (`userRole`);
--> statement-breakpoint
CREATE INDEX `propertyUserIdIdx` ON `properties` (`userId`);
--> statement-breakpoint
CREATE INDEX `propertyStatusIdx` ON `properties` (`status`);
--> statement-breakpoint
CREATE INDEX `propertyCategoryIdx` ON `properties` (`category`);
--> statement-breakpoint
CREATE INDEX `propertyStateIdx` ON `properties` (`state`);
--> statement-breakpoint
CREATE INDEX `taskPropertyIdIdx` ON `verificationTasks` (`propertyId`);
--> statement-breakpoint
CREATE INDEX `taskAgentIdIdx` ON `verificationTasks` (`assignedAgentId`);
--> statement-breakpoint
CREATE INDEX `taskStatusIdx` ON `verificationTasks` (`status`);
--> statement-breakpoint
CREATE INDEX `rentalPropertyIdIdx` ON `rentals` (`propertyId`);
--> statement-breakpoint
CREATE INDEX `rentalLandlordIdIdx` ON `rentals` (`landlordId`);
--> statement-breakpoint
CREATE INDEX `rentalTenantIdIdx` ON `rentals` (`tenantId`);
--> statement-breakpoint
CREATE INDEX `rentalStatusIdx` ON `rentals` (`status`);
--> statement-breakpoint
CREATE INDEX `messageRentalIdIdx` ON `messages` (`rentalId`);
--> statement-breakpoint
CREATE INDEX `messageSenderIdIdx` ON `messages` (`senderId`);
--> statement-breakpoint
CREATE INDEX `messageRecipientIdIdx` ON `messages` (`recipientId`);
--> statement-breakpoint
CREATE INDEX `reviewRentalIdIdx` ON `reviews` (`rentalId`);
--> statement-breakpoint
CREATE INDEX `reviewReviewerIdIdx` ON `reviews` (`reviewerId`);
--> statement-breakpoint
CREATE INDEX `reviewRevieweeIdIdx` ON `reviews` (`revieweeId`);
--> statement-breakpoint
CREATE INDEX `disputeRentalIdIdx` ON `disputes` (`rentalId`);
--> statement-breakpoint
CREATE INDEX `disputeInitiatedByIdIdx` ON `disputes` (`initiatedById`);
--> statement-breakpoint
CREATE INDEX `disputeStatusIdx` ON `disputes` (`status`);
--> statement-breakpoint
CREATE INDEX `disputeAgentIdIdx` ON `disputes` (`assignedAgentId`);
