-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'AGENT', 'STAFF', 'FINANCE');

-- CreateEnum
CREATE TYPE "PartyType" AS ENUM ('AGENT', 'PARTNER');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REVISION');

-- CreateEnum
CREATE TYPE "AnnouncementDisplay" AS ENUM ('HOME', 'LOGIN');

-- CreateEnum
CREATE TYPE "AnnouncementAudience" AS ENUM ('AGENT', 'PARTNER', 'BOTH');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SchemeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('DRAFT', 'PENDING_PAYMENT', 'PENDING_APPROVAL', 'ORDER_CONFIRMED', 'REJECTED', 'REVISION', 'CANCELLED');

-- CreateEnum
CREATE TYPE "OfflinePaymentStatus" AS ENUM ('PENDING_APPROVAL', 'ORDER_CONFIRMED', 'REJECTED', 'REVISION');

-- CreateEnum
CREATE TYPE "VoucherRedeemStatus" AS ENUM ('NEW', 'LOCKED', 'REDEEMED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VoucherSource" AS ENUM ('PURCHASE', 'COMPLIMENTARY');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('KPL', 'SSM', 'PAYMENT_SLIP', 'ANNOUNCEMENT_MEDIA', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentOwnerType" AS ENUM ('REGISTRATION', 'AGENT', 'RENEWAL', 'OFFLINE_PAYMENT', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "AgreementType" AS ENUM ('PREPAID', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('ADULT', 'CHILD', 'BUNDLE');

-- CreateEnum
CREATE TYPE "ValidityType" AS ENUM ('SAME_DAY', 'FIXED_DATE', 'DATE_RANGE');

-- CreateEnum
CREATE TYPE "BookingPaymentStatus" AS ENUM ('PREPAID_PAID', 'UNBILLED', 'INVOICED', 'PAID');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('ACTIVE', 'USED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE');

-- CreateEnum
CREATE TYPE "OTAProvider" AS ENUM ('KLOOK');

-- CreateEnum
CREATE TYPE "OTAEnvironment" AS ENUM ('SANDBOX', 'PRODUCTION');

-- CreateEnum
CREATE TYPE "KlookOrderStatus" AS ENUM ('PENDING', 'RESERVED', 'CONFIRMED', 'CANCELLED', 'FAILED', 'REDEEMED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "agentId" TEXT,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "passwordExpiresAt" TIMESTAMP(3),
    "refreshTokenHash" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "agreementType" "AgreementType" NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "creditBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "outstandingBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "creditLimit" DECIMAL(12,2),
    "billingCycleStartDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "partyType" "PartyType" NOT NULL DEFAULT 'AGENT',
    "accountCode" TEXT,
    "registrationNo" TEXT,
    "kplLicenseNo" TEXT,
    "kplExpiryDate" TIMESTAMP(3),
    "fax" TEXT,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "addressLine3" TEXT,
    "postcode" TEXT,
    "country" TEXT,
    "state" TEXT,
    "targetMarket" TEXT,
    "salesChannel" TEXT,
    "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "accountExpiry" TIMESTAMP(3),
    "registrationId" TEXT,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketType" (
    "id" TEXT NOT NULL,
    "outletId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "category" "TicketCategory" NOT NULL,
    "sellingPrice" DECIMAL(12,2) NOT NULL,
    "costPrice" DECIMAL(12,2) NOT NULL,
    "commissionRate" DECIMAL(5,2) NOT NULL,
    "validityType" "ValidityType" NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TicketType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outlet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Outlet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "bookingReference" TEXT NOT NULL,
    "totalTickets" INTEGER NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "totalCommission" DECIMAL(12,2) NOT NULL,
    "totalPayable" DECIMAL(12,2) NOT NULL,
    "paymentStatus" "BookingPaymentStatus" NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "ticketCode" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'ACTIVE',
    "checkedInAt" TIMESTAMP(3),
    "checkedInBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "invoiceType" "InvoiceType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalSales" DECIMAL(12,2) NOT NULL,
    "totalCommission" DECIMAL(12,2) NOT NULL,
    "totalPayable" DECIMAL(12,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopUp" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "reference" TEXT NOT NULL,
    "notes" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTAProviderSetting" (
    "id" TEXT NOT NULL,
    "provider" "OTAProvider" NOT NULL,
    "apiBaseUrl" TEXT,
    "clientId" TEXT,
    "apiKey" TEXT,
    "environment" "OTAEnvironment" NOT NULL DEFAULT 'SANDBOX',
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OTAProviderSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KlookProduct" (
    "id" TEXT NOT NULL,
    "klookProductId" TEXT NOT NULL,
    "localProductId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT,
    "country" TEXT,
    "category" TEXT,
    "packageOptionsJson" JSONB NOT NULL,
    "bookingPolicyJson" JSONB,
    "voucherType" TEXT,
    "confirmationType" TEXT,
    "rawJson" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KlookProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KlookAvailabilityLog" (
    "id" TEXT NOT NULL,
    "klookProductId" TEXT NOT NULL,
    "localProductId" TEXT,
    "requestJson" JSONB NOT NULL,
    "responseJson" JSONB NOT NULL,
    "availabilityId" TEXT,
    "travelDate" TEXT NOT NULL,
    "status" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KlookAvailabilityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KlookOrder" (
    "id" TEXT NOT NULL,
    "localOrderId" TEXT NOT NULL,
    "klookOrderId" TEXT,
    "klookBookingReference" TEXT,
    "klookProductId" TEXT NOT NULL,
    "localProductId" TEXT,
    "availabilityId" TEXT,
    "travelDate" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerPhone" TEXT,
    "quantityAdult" INTEGER NOT NULL DEFAULT 0,
    "quantityChild" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2),
    "currency" TEXT,
    "status" "KlookOrderStatus" NOT NULL DEFAULT 'PENDING',
    "voucherCode" TEXT,
    "voucherUrl" TEXT,
    "rawBookingRequestJson" JSONB NOT NULL,
    "rawBookingResponseJson" JSONB NOT NULL,
    "rawStatusResponseJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "redeemedAt" TIMESTAMP(3),
    "redeemedByStaffId" TEXT,

    CONSTRAINT "KlookOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KlookRedemptionLog" (
    "id" TEXT NOT NULL,
    "klookOrderId" TEXT,
    "voucherCode" TEXT,
    "bookingReference" TEXT,
    "staffId" TEXT,
    "status" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestJson" JSONB NOT NULL,

    CONSTRAINT "KlookRedemptionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OTAApiLog" (
    "id" TEXT NOT NULL,
    "otaProvider" "OTAProvider" NOT NULL,
    "action" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "requestHeadersJson" JSONB NOT NULL,
    "requestBodyJson" JSONB,
    "responseStatus" INTEGER,
    "responseBodyJson" JSONB,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OTAApiLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "ownerType" "DocumentOwnerType" NOT NULL,
    "ownerId" TEXT,
    "docType" "DocumentType" NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "licenseNo" TEXT,
    "expiryDate" TIMESTAMP(3),
    "uploadedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentId" TEXT,
    "registrationId" TEXT,
    "renewalId" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactPerson" (
    "id" TEXT NOT NULL,
    "ownerType" "DocumentOwnerType" NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentId" TEXT,
    "registrationId" TEXT,

    CONSTRAINT "ContactPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "partyType" "PartyType" NOT NULL,
    "companyName" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "kplLicenseNo" TEXT,
    "kplExpiryDate" TIMESTAMP(3),
    "contactNo" TEXT NOT NULL,
    "fax" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT NOT NULL,
    "addressLine3" TEXT,
    "postcode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "targetMarket" TEXT,
    "salesChannel" TEXT,
    "termsAcceptedAt" TIMESTAMP(3),
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAgentId" TEXT,
    "createdUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RenewalRequest" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "kplLicenseNo" TEXT,
    "kplExpiryDate" TIMESTAMP(3),
    "ssmExpiryDate" TIMESTAMP(3),
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RenewalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "mediaDocumentId" TEXT,
    "displayType" "AnnouncementDisplay" NOT NULL,
    "audience" "AnnouncementAudience" NOT NULL DEFAULT 'BOTH',
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scheme" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organisation" TEXT,
    "status" "SchemeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemeRevision" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "revisionNumber" INTEGER NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "status" "SchemeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchemeRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemeProduct" (
    "id" TEXT NOT NULL,
    "schemeRevisionId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "minQty" INTEGER NOT NULL DEFAULT 1,
    "maxQty" INTEGER,
    "incentiveRate" DECIMAL(5,2),
    "discountRate" DECIMAL(5,2),

    CONSTRAINT "SchemeProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchemeAssignment" (
    "id" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "bindingType" TEXT NOT NULL DEFAULT 'STANDARD',
    "incentive" TEXT,
    "assignedByUserId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchemeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "orderReference" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "schemeRevisionId" TEXT,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "incentiveTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "discountTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalPayable" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "invoiceId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderItem" (
    "id" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,
    "ticketTypeId" TEXT NOT NULL,
    "schemeProductId" TEXT,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "lineTotal" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentGroup" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PaymentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PaymentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflinePayment" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "paymentGroupId" TEXT,
    "paymentTypeId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "bankReference" TEXT,
    "bankName" TEXT,
    "slipDocumentId" TEXT,
    "status" "OfflinePaymentStatus" NOT NULL DEFAULT 'PENDING_APPROVAL',
    "submittedByUserId" TEXT,
    "financePaidByUserId" TEXT,
    "financePaidAt" TIMESTAMP(3),
    "adminApprovedByUserId" TEXT,
    "adminApprovedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfflinePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfflinePaymentOrder" (
    "id" TEXT NOT NULL,
    "offlinePaymentId" TEXT NOT NULL,
    "purchaseOrderId" TEXT NOT NULL,

    CONSTRAINT "OfflinePaymentOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentStatusHistory" (
    "id" TEXT NOT NULL,
    "offlinePaymentId" TEXT NOT NULL,
    "fromStatus" "OfflinePaymentStatus",
    "toStatus" "OfflinePaymentStatus" NOT NULL,
    "actorUserId" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplimentaryGrant" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "schemeRevisionId" TEXT,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplimentaryGrant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "serialNo" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "source" "VoucherSource" NOT NULL,
    "purchaseOrderId" TEXT,
    "complimentaryGrantId" TEXT,
    "ticketTypeId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "redeemStatus" "VoucherRedeemStatus" NOT NULL DEFAULT 'NEW',
    "redeemedAt" TIMESTAMP(3),
    "redeemedByUserId" TEXT,
    "entranceGate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoucherRedemption" (
    "id" TEXT NOT NULL,
    "voucherId" TEXT NOT NULL,
    "entranceGate" TEXT,
    "staffUserId" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoucherRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_agentId_idx" ON "User"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_email_key" ON "Agent"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_accountCode_key" ON "Agent"("accountCode");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_registrationId_key" ON "Agent"("registrationId");

-- CreateIndex
CREATE INDEX "Agent_agreementType_idx" ON "Agent"("agreementType");

-- CreateIndex
CREATE INDEX "Agent_isActive_idx" ON "Agent"("isActive");

-- CreateIndex
CREATE INDEX "Agent_partyType_idx" ON "Agent"("partyType");

-- CreateIndex
CREATE INDEX "Agent_accountStatus_idx" ON "Agent"("accountStatus");

-- CreateIndex
CREATE UNIQUE INDEX "TicketType_sku_key" ON "TicketType"("sku");

-- CreateIndex
CREATE INDEX "TicketType_outletId_idx" ON "TicketType"("outletId");

-- CreateIndex
CREATE UNIQUE INDEX "Outlet_code_key" ON "Outlet"("code");

-- CreateIndex
CREATE INDEX "Outlet_active_idx" ON "Outlet"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_bookingReference_key" ON "Booking"("bookingReference");

-- CreateIndex
CREATE INDEX "Booking_agentId_idx" ON "Booking"("agentId");

-- CreateIndex
CREATE INDEX "Booking_createdByUserId_idx" ON "Booking"("createdByUserId");

-- CreateIndex
CREATE INDEX "Booking_invoiceId_idx" ON "Booking"("invoiceId");

-- CreateIndex
CREATE INDEX "Booking_createdAt_idx" ON "Booking"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_ticketCode_key" ON "Ticket"("ticketCode");

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_qrToken_key" ON "Ticket"("qrToken");

-- CreateIndex
CREATE INDEX "Ticket_bookingId_idx" ON "Ticket"("bookingId");

-- CreateIndex
CREATE INDEX "Ticket_ticketTypeId_idx" ON "Ticket"("ticketTypeId");

-- CreateIndex
CREATE INDEX "Ticket_visitDate_idx" ON "Ticket"("visitDate");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_agentId_idx" ON "Invoice"("agentId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_periodStart_periodEnd_idx" ON "Invoice"("periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "TopUp_agentId_idx" ON "TopUp"("agentId");

-- CreateIndex
CREATE INDEX "TopUp_createdBy_idx" ON "TopUp"("createdBy");

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OTAProviderSetting_provider_key" ON "OTAProviderSetting"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "KlookProduct_klookProductId_key" ON "KlookProduct"("klookProductId");

-- CreateIndex
CREATE INDEX "KlookProduct_localProductId_idx" ON "KlookProduct"("localProductId");

-- CreateIndex
CREATE INDEX "KlookProduct_isActive_idx" ON "KlookProduct"("isActive");

-- CreateIndex
CREATE INDEX "KlookAvailabilityLog_klookProductId_travelDate_idx" ON "KlookAvailabilityLog"("klookProductId", "travelDate");

-- CreateIndex
CREATE INDEX "KlookAvailabilityLog_localProductId_idx" ON "KlookAvailabilityLog"("localProductId");

-- CreateIndex
CREATE INDEX "KlookAvailabilityLog_createdAt_idx" ON "KlookAvailabilityLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "KlookOrder_localOrderId_key" ON "KlookOrder"("localOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "KlookOrder_klookOrderId_key" ON "KlookOrder"("klookOrderId");

-- CreateIndex
CREATE INDEX "KlookOrder_klookProductId_idx" ON "KlookOrder"("klookProductId");

-- CreateIndex
CREATE INDEX "KlookOrder_localProductId_idx" ON "KlookOrder"("localProductId");

-- CreateIndex
CREATE INDEX "KlookOrder_status_idx" ON "KlookOrder"("status");

-- CreateIndex
CREATE INDEX "KlookOrder_travelDate_idx" ON "KlookOrder"("travelDate");

-- CreateIndex
CREATE INDEX "KlookOrder_voucherCode_idx" ON "KlookOrder"("voucherCode");

-- CreateIndex
CREATE INDEX "KlookOrder_klookBookingReference_idx" ON "KlookOrder"("klookBookingReference");

-- CreateIndex
CREATE INDEX "KlookRedemptionLog_klookOrderId_idx" ON "KlookRedemptionLog"("klookOrderId");

-- CreateIndex
CREATE INDEX "KlookRedemptionLog_staffId_idx" ON "KlookRedemptionLog"("staffId");

-- CreateIndex
CREATE INDEX "KlookRedemptionLog_createdAt_idx" ON "KlookRedemptionLog"("createdAt");

-- CreateIndex
CREATE INDEX "OTAApiLog_otaProvider_createdAt_idx" ON "OTAApiLog"("otaProvider", "createdAt");

-- CreateIndex
CREATE INDEX "OTAApiLog_action_idx" ON "OTAApiLog"("action");

-- CreateIndex
CREATE INDEX "OTAApiLog_success_idx" ON "OTAApiLog"("success");

-- CreateIndex
CREATE INDEX "Document_ownerType_ownerId_idx" ON "Document"("ownerType", "ownerId");

-- CreateIndex
CREATE INDEX "Document_docType_idx" ON "Document"("docType");

-- CreateIndex
CREATE INDEX "Document_agentId_idx" ON "Document"("agentId");

-- CreateIndex
CREATE INDEX "Document_registrationId_idx" ON "Document"("registrationId");

-- CreateIndex
CREATE INDEX "Document_renewalId_idx" ON "Document"("renewalId");

-- CreateIndex
CREATE INDEX "ContactPerson_agentId_idx" ON "ContactPerson"("agentId");

-- CreateIndex
CREATE INDEX "ContactPerson_registrationId_idx" ON "ContactPerson"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_applicationId_key" ON "Registration"("applicationId");

-- CreateIndex
CREATE INDEX "Registration_status_partyType_idx" ON "Registration"("status", "partyType");

-- CreateIndex
CREATE INDEX "Registration_email_idx" ON "Registration"("email");

-- CreateIndex
CREATE INDEX "RenewalRequest_agentId_idx" ON "RenewalRequest"("agentId");

-- CreateIndex
CREATE INDEX "RenewalRequest_status_idx" ON "RenewalRequest"("status");

-- CreateIndex
CREATE INDEX "Announcement_displayType_audience_status_idx" ON "Announcement"("displayType", "audience", "status");

-- CreateIndex
CREATE INDEX "Announcement_effectiveDate_expiryDate_idx" ON "Announcement"("effectiveDate", "expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "Scheme_code_key" ON "Scheme"("code");

-- CreateIndex
CREATE INDEX "SchemeRevision_schemeId_effectiveDate_idx" ON "SchemeRevision"("schemeId", "effectiveDate");

-- CreateIndex
CREATE UNIQUE INDEX "SchemeRevision_schemeId_revisionNumber_key" ON "SchemeRevision"("schemeId", "revisionNumber");

-- CreateIndex
CREATE INDEX "SchemeProduct_schemeRevisionId_idx" ON "SchemeProduct"("schemeRevisionId");

-- CreateIndex
CREATE INDEX "SchemeProduct_ticketTypeId_idx" ON "SchemeProduct"("ticketTypeId");

-- CreateIndex
CREATE INDEX "SchemeAssignment_agentId_idx" ON "SchemeAssignment"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "SchemeAssignment_schemeId_agentId_bindingType_key" ON "SchemeAssignment"("schemeId", "agentId", "bindingType");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_orderReference_key" ON "PurchaseOrder"("orderReference");

-- CreateIndex
CREATE INDEX "PurchaseOrder_agentId_status_idx" ON "PurchaseOrder"("agentId", "status");

-- CreateIndex
CREATE INDEX "PurchaseOrder_createdAt_idx" ON "PurchaseOrder"("createdAt");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_purchaseOrderId_idx" ON "PurchaseOrderItem"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "PurchaseOrderItem_ticketTypeId_idx" ON "PurchaseOrderItem"("ticketTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentGroup_name_key" ON "PaymentGroup"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentType_name_key" ON "PaymentType"("name");

-- CreateIndex
CREATE INDEX "OfflinePayment_agentId_status_idx" ON "OfflinePayment"("agentId", "status");

-- CreateIndex
CREATE INDEX "OfflinePaymentOrder_purchaseOrderId_idx" ON "OfflinePaymentOrder"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "OfflinePaymentOrder_offlinePaymentId_purchaseOrderId_key" ON "OfflinePaymentOrder"("offlinePaymentId", "purchaseOrderId");

-- CreateIndex
CREATE INDEX "PaymentStatusHistory_offlinePaymentId_idx" ON "PaymentStatusHistory"("offlinePaymentId");

-- CreateIndex
CREATE INDEX "ComplimentaryGrant_agentId_idx" ON "ComplimentaryGrant"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_serialNo_key" ON "Voucher"("serialNo");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_qrToken_key" ON "Voucher"("qrToken");

-- CreateIndex
CREATE INDEX "Voucher_agentId_redeemStatus_idx" ON "Voucher"("agentId", "redeemStatus");

-- CreateIndex
CREATE INDEX "Voucher_purchaseOrderId_idx" ON "Voucher"("purchaseOrderId");

-- CreateIndex
CREATE INDEX "Voucher_ticketTypeId_idx" ON "Voucher"("ticketTypeId");

-- CreateIndex
CREATE INDEX "Voucher_expiryDate_idx" ON "Voucher"("expiryDate");

-- CreateIndex
CREATE INDEX "VoucherRedemption_voucherId_idx" ON "VoucherRedemption"("voucherId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketType" ADD CONSTRAINT "TicketType_outletId_fkey" FOREIGN KEY ("outletId") REFERENCES "Outlet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_checkedInBy_fkey" FOREIGN KEY ("checkedInBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopUp" ADD CONSTRAINT "TopUp_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TopUp" ADD CONSTRAINT "TopUp_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KlookProduct" ADD CONSTRAINT "KlookProduct_localProductId_fkey" FOREIGN KEY ("localProductId") REFERENCES "TicketType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KlookAvailabilityLog" ADD CONSTRAINT "KlookAvailabilityLog_klookProductId_fkey" FOREIGN KEY ("klookProductId") REFERENCES "KlookProduct"("klookProductId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KlookAvailabilityLog" ADD CONSTRAINT "KlookAvailabilityLog_localProductId_fkey" FOREIGN KEY ("localProductId") REFERENCES "TicketType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KlookOrder" ADD CONSTRAINT "KlookOrder_klookProductId_fkey" FOREIGN KEY ("klookProductId") REFERENCES "KlookProduct"("klookProductId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KlookOrder" ADD CONSTRAINT "KlookOrder_localProductId_fkey" FOREIGN KEY ("localProductId") REFERENCES "TicketType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KlookOrder" ADD CONSTRAINT "KlookOrder_redeemedByStaffId_fkey" FOREIGN KEY ("redeemedByStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KlookRedemptionLog" ADD CONSTRAINT "KlookRedemptionLog_klookOrderId_fkey" FOREIGN KEY ("klookOrderId") REFERENCES "KlookOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KlookRedemptionLog" ADD CONSTRAINT "KlookRedemptionLog_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_renewalId_fkey" FOREIGN KEY ("renewalId") REFERENCES "RenewalRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactPerson" ADD CONSTRAINT "ContactPerson_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactPerson" ADD CONSTRAINT "ContactPerson_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RenewalRequest" ADD CONSTRAINT "RenewalRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeRevision" ADD CONSTRAINT "SchemeRevision_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeProduct" ADD CONSTRAINT "SchemeProduct_schemeRevisionId_fkey" FOREIGN KEY ("schemeRevisionId") REFERENCES "SchemeRevision"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeProduct" ADD CONSTRAINT "SchemeProduct_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeAssignment" ADD CONSTRAINT "SchemeAssignment_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchemeAssignment" ADD CONSTRAINT "SchemeAssignment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_schemeRevisionId_fkey" FOREIGN KEY ("schemeRevisionId") REFERENCES "SchemeRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderItem" ADD CONSTRAINT "PurchaseOrderItem_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflinePayment" ADD CONSTRAINT "OfflinePayment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflinePayment" ADD CONSTRAINT "OfflinePayment_paymentGroupId_fkey" FOREIGN KEY ("paymentGroupId") REFERENCES "PaymentGroup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflinePayment" ADD CONSTRAINT "OfflinePayment_paymentTypeId_fkey" FOREIGN KEY ("paymentTypeId") REFERENCES "PaymentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflinePaymentOrder" ADD CONSTRAINT "OfflinePaymentOrder_offlinePaymentId_fkey" FOREIGN KEY ("offlinePaymentId") REFERENCES "OfflinePayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfflinePaymentOrder" ADD CONSTRAINT "OfflinePaymentOrder_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentStatusHistory" ADD CONSTRAINT "PaymentStatusHistory_offlinePaymentId_fkey" FOREIGN KEY ("offlinePaymentId") REFERENCES "OfflinePayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplimentaryGrant" ADD CONSTRAINT "ComplimentaryGrant_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_complimentaryGrantId_fkey" FOREIGN KEY ("complimentaryGrantId") REFERENCES "ComplimentaryGrant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "TicketType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_redeemedByUserId_fkey" FOREIGN KEY ("redeemedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoucherRedemption" ADD CONSTRAINT "VoucherRedemption_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "Voucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

