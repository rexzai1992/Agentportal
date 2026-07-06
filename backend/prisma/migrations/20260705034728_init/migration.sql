-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'AGENT', 'STAFF');

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
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "agentId" TEXT,
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

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketType" (
    "id" TEXT NOT NULL,
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_agentId_idx" ON "User"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_email_key" ON "Agent"("email");

-- CreateIndex
CREATE INDEX "Agent_agreementType_idx" ON "Agent"("agreementType");

-- CreateIndex
CREATE INDEX "Agent_isActive_idx" ON "Agent"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TicketType_sku_key" ON "TicketType"("sku");

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

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
