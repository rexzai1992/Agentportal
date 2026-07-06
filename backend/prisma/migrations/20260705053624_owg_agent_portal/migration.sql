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

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'FINANCE';

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "accountCode" TEXT,
ADD COLUMN     "accountExpiry" TIMESTAMP(3),
ADD COLUMN     "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "addressLine1" TEXT,
ADD COLUMN     "addressLine2" TEXT,
ADD COLUMN     "addressLine3" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "fax" TEXT,
ADD COLUMN     "kplExpiryDate" TIMESTAMP(3),
ADD COLUMN     "kplLicenseNo" TEXT,
ADD COLUMN     "partyType" "PartyType" NOT NULL DEFAULT 'AGENT',
ADD COLUMN     "postcode" TEXT,
ADD COLUMN     "registrationId" TEXT,
ADD COLUMN     "registrationNo" TEXT,
ADD COLUMN     "salesChannel" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "targetMarket" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordExpiresAt" TIMESTAMP(3),
ADD COLUMN     "username" TEXT;

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

-- CreateIndex
CREATE UNIQUE INDEX "Agent_accountCode_key" ON "Agent"("accountCode");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_registrationId_key" ON "Agent"("registrationId");

-- CreateIndex
CREATE INDEX "Agent_partyType_idx" ON "Agent"("partyType");

-- CreateIndex
CREATE INDEX "Agent_accountStatus_idx" ON "Agent"("accountStatus");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

