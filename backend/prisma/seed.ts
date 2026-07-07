import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import {
  AgreementType,
  BookingPaymentStatus,
  InvoiceStatus,
  InvoiceType,
  Prisma,
  PrismaClient,
  TicketStatus
} from "@prisma/client";

const prisma = new PrismaClient();

const decimal = (value: number): Prisma.Decimal => new Prisma.Decimal(value.toFixed(2));
const num = (value: Prisma.Decimal): number => Number(value.toString());

const makeBookingRef = (index: number) => `DEMO-TA-${String(index + 1).padStart(4, "0")}`;

async function resetDatabase() {
  await prisma.activityLog.deleteMany();
  // OWG portal children first (FK-safe order)
  await prisma.voucherRedemption.deleteMany();
  await prisma.voucher.deleteMany();
  await prisma.complimentaryGrant.deleteMany();
  await prisma.paymentStatusHistory.deleteMany();
  await prisma.offlinePaymentOrder.deleteMany();
  await prisma.offlinePayment.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.schemeAssignment.deleteMany();
  await prisma.schemeProduct.deleteMany();
  await prisma.schemeRevision.deleteMany();
  await prisma.scheme.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.renewalRequest.deleteMany();
  await prisma.document.deleteMany();
  await prisma.contactPerson.deleteMany();
  await prisma.paymentGroup.deleteMany();
  await prisma.paymentType.deleteMany();
  await prisma.topUp.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.user.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.agent.deleteMany();
}

async function main() {
  await resetDatabase();

  const [adminPassword, agentPassword, staffPassword, financePassword, partnerPassword] =
    await Promise.all([
      bcrypt.hash("admin123!", 10),
      bcrypt.hash("agent123!", 10),
      bcrypt.hash("staff123!", 10),
      bcrypt.hash("finance123!", 10),
      bcrypt.hash("partner123!", 10)
    ]);

  const [prepaidAgent, weeklyAgent, monthlyAgent] = await Promise.all([
    prisma.agent.create({
      data: {
        companyName: "Amazing Travel Sdn Bhd",
        contactName: "Aina Rahman",
        phone: "+601122334455",
        email: "amazing.travel@travel-agent.demo",
        agreementType: AgreementType.PREPAID,
        commissionRate: decimal(12),
        creditBalance: decimal(2800),
        outstandingBalance: decimal(0),
        creditLimit: decimal(0),
        billingCycleStartDate: new Date("2026-03-01T00:00:00.000Z"),
        isActive: true,
        partyType: "AGENT",
        accountCode: "A20260001",
        registrationNo: "202601000001",
        kplLicenseNo: "KPL-2026-0001",
        kplExpiryDate: new Date("2026-12-31T00:00:00.000Z"),
        addressLine1: "12 Jalan Ampang",
        addressLine2: "Kuala Lumpur",
        postcode: "50450",
        country: "Malaysia",
        state: "Wilayah Persekutuan",
        accountStatus: "ACTIVE",
        accountExpiry: new Date("2026-12-31T00:00:00.000Z")
      }
    }),
    prisma.agent.create({
      data: {
        companyName: "Holiday Expert",
        contactName: "Farid Hassan",
        phone: "+60197774411",
        email: "holiday.expert@travel-agent.demo",
        agreementType: AgreementType.WEEKLY,
        commissionRate: decimal(10),
        creditBalance: decimal(0),
        outstandingBalance: decimal(0),
        creditLimit: decimal(8000),
        billingCycleStartDate: new Date("2026-03-03T00:00:00.000Z"),
        isActive: true
      }
    }),
    prisma.agent.create({
      data: {
        companyName: "Global Adventure",
        contactName: "Nur Adib",
        phone: "+60129992211",
        email: "global.adventure@travel-agent.demo",
        agreementType: AgreementType.MONTHLY,
        commissionRate: decimal(8),
        creditBalance: decimal(0),
        outstandingBalance: decimal(0),
        creditLimit: decimal(25000),
        billingCycleStartDate: new Date("2026-03-01T00:00:00.000Z"),
        isActive: true
      }
    })
  ]);

  const [mainOutlet, waterParkOutlet] = await Promise.all([
    prisma.outlet.create({
      data: {
        name: "Main Outlet",
        code: "MAIN",
        description: "Primary ticket redemption outlet",
        address: "Main entrance",
        bankName: "CIMB Bank",
        bankAccountName: "Main Outlet Sdn Bhd",
        bankAccountNo: "1234-5678-9012"
      }
    }),
    prisma.outlet.create({
      data: {
        name: "Travel Desk Outlet",
        code: "TRAVEL-DESK",
        description: "Partner and agent ticket service counter",
        address: "Travel desk lobby",
        bankName: "Maybank",
        bankAccountName: "Travel Desk Sdn Bhd",
        bankAccountNo: "5544-3322-1100"
      }
    })
  ]);

  const [adult, child, bundle] = await Promise.all([
    prisma.ticketType.create({
      data: {
        outletId: mainOutlet.id,
        name: "Adult Entry RM 80",
        category: "ADULT",
        sellingPrice: decimal(80),
        costPrice: decimal(64),
        commissionRate: decimal(12),
        validityType: "FIXED_DATE",
        active: true
      }
    }),
    prisma.ticketType.create({
      data: {
        outletId: mainOutlet.id,
        name: "Child Entry RM 50",
        category: "CHILD",
        sellingPrice: decimal(50),
        costPrice: decimal(40),
        commissionRate: decimal(10),
        validityType: "FIXED_DATE",
        active: true
      }
    }),
    prisma.ticketType.create({
      data: {
        outletId: waterParkOutlet.id,
        name: "Family Bundle RM 180",
        category: "BUNDLE",
        sellingPrice: decimal(180),
        costPrice: decimal(145),
        commissionRate: decimal(9),
        validityType: "FIXED_DATE",
        active: true
      }
    })
  ]);

  const adminUser = await prisma.user.create({
    data: {
      fullName: "Admin User",
      email: "admin@travel-agent.demo",
      passwordHash: adminPassword,
      role: "ADMIN"
    }
  });

  const agentUser = await prisma.user.create({
    data: {
      fullName: "Agent User",
      email: "agent@travel-agent.demo",
      username: prepaidAgent.accountCode,
      passwordHash: agentPassword,
      role: "AGENT",
      agentId: prepaidAgent.id
    }
  });

  const staffUser = await prisma.user.create({
    data: {
      fullName: "Staff User",
      email: "staff@travel-agent.demo",
      passwordHash: staffPassword,
      role: "STAFF"
    }
  });

  await prisma.user.create({
    data: {
      fullName: "Finance User",
      email: "finance@travel-agent.demo",
      passwordHash: financePassword,
      role: "FINANCE"
    }
  });

  // A demo partner party + login
  const partnerAgent = await prisma.agent.create({
    data: {
      companyName: "Coral Partner Enterprise",
      contactName: "Wan Nur",
      phone: "+60123456789",
      email: "coral.partner@travel-agent.demo",
      agreementType: AgreementType.WEEKLY,
      commissionRate: decimal(8),
      billingCycleStartDate: new Date("2026-03-01T00:00:00.000Z"),
      isActive: true,
      partyType: "PARTNER",
      accountCode: "P20260001",
      registrationNo: "202601000099",
      addressLine1: "5 Jalan Coral",
      addressLine2: "George Town",
      postcode: "10200",
      country: "Malaysia",
      state: "Pulau Pinang",
      accountStatus: "ACTIVE",
      accountExpiry: new Date("2026-11-30T00:00:00.000Z")
    }
  });

  await prisma.user.create({
    data: {
      fullName: "Coral Partner",
      email: "coral.partner@travel-agent.demo",
      username: partnerAgent.accountCode,
      passwordHash: partnerPassword,
      role: "AGENT",
      agentId: partnerAgent.id
    }
  });

  const bookingAgents = [prepaidAgent, weeklyAgent, monthlyAgent];
  const ticketTypes = [adult, child, bundle];

  let prepaidBalance = num(prepaidAgent.creditBalance);
  let weeklyOutstanding = 0;
  let monthlyOutstanding = 0;

  const weeklyBookingIds: string[] = [];
  const monthlyBookingIds: string[] = [];

  const now = new Date("2026-04-07T08:00:00.000Z");

  for (let i = 0; i < 10; i += 1) {
    const agent = bookingAgents[i % bookingAgents.length];
    const ticketType = ticketTypes[i % ticketTypes.length];
    const quantity = 3;

    const subtotal = num(ticketType.sellingPrice) * quantity;
    const commission = Number(((subtotal * num(ticketType.commissionRate)) / 100).toFixed(2));
    const payable = Number((subtotal - commission).toFixed(2));

    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - (9 - i));

    const paymentStatus: BookingPaymentStatus =
      agent.agreementType === "PREPAID" ? "PREPAID_PAID" : "UNBILLED";

    const booking = await prisma.booking.create({
      data: {
        agentId: agent.id,
        customerName: `Demo Customer ${i + 1}`,
        customerPhone: `+6012${String(4000000 + i * 101)}`,
        bookingReference: makeBookingRef(i),
        totalTickets: quantity,
        subtotal: decimal(subtotal),
        totalCommission: decimal(commission),
        totalPayable: decimal(payable),
        paymentStatus,
        createdByUserId: i % 2 === 0 ? agentUser.id : adminUser.id,
        createdAt
      }
    });

    const visitDate = new Date(createdAt);
    visitDate.setDate(createdAt.getDate() + (i % 4));

    const ticketsPayload = Array.from({ length: quantity }).map((_, idx) => {
      let status: TicketStatus = "ACTIVE";
      let checkedInAt: Date | null = null;
      let checkedInBy: string | null = null;

      if (i < 4 && idx < 2) {
        status = "USED";
        checkedInAt = new Date(visitDate);
        checkedInAt.setHours(10 + idx, 15, 0, 0);
        checkedInBy = staffUser.id;
      } else if (visitDate < now && i > 6 && idx === 2) {
        status = "EXPIRED";
      }

      return {
        bookingId: booking.id,
        ticketTypeId: ticketType.id,
        ticketCode: `${booking.bookingReference}-${String(idx + 1).padStart(3, "0")}`,
        qrToken: crypto.randomUUID(),
        visitDate,
        status,
        checkedInAt,
        checkedInBy,
        createdAt
      };
    });

    await prisma.ticket.createMany({ data: ticketsPayload });

    if (agent.agreementType === "PREPAID") {
      prepaidBalance -= payable;
    }

    if (agent.agreementType === "WEEKLY") {
      weeklyOutstanding += payable;
      weeklyBookingIds.push(booking.id);
    }

    if (agent.agreementType === "MONTHLY") {
      monthlyOutstanding += payable;
      monthlyBookingIds.push(booking.id);
    }
  }

  await prisma.agent.update({
    where: { id: prepaidAgent.id },
    data: {
      creditBalance: decimal(prepaidBalance)
    }
  });

  await prisma.topUp.create({
    data: {
      agentId: prepaidAgent.id,
      amount: decimal(1500),
      reference: "TOPUP-DEMO-001",
      notes: "Initial preload",
      createdBy: adminUser.id
    }
  });

  const weeklyBookings = await prisma.booking.findMany({
    where: { id: { in: weeklyBookingIds } },
    orderBy: { createdAt: "asc" }
  });

  const monthlyBookings = await prisma.booking.findMany({
    where: { id: { in: monthlyBookingIds } },
    orderBy: { createdAt: "asc" }
  });

  const weeklyBatch1 = weeklyBookings.slice(0, 1);
  const weeklyBatch2 = weeklyBookings.slice(1);
  const monthlyBatch1 = monthlyBookings.slice(0, 2);

  const sumPayable = (rows: { totalPayable: Prisma.Decimal }[]) =>
    rows.reduce((acc, row) => acc + num(row.totalPayable), 0);
  const sumSales = (rows: { subtotal: Prisma.Decimal }[]) =>
    rows.reduce((acc, row) => acc + num(row.subtotal), 0);
  const sumCommission = (rows: { totalCommission: Prisma.Decimal }[]) =>
    rows.reduce((acc, row) => acc + num(row.totalCommission), 0);

  const invoice1 = await prisma.invoice.create({
    data: {
      agentId: weeklyAgent.id,
      invoiceNumber: "INV-20260401-1001",
      invoiceType: InvoiceType.WEEKLY,
      periodStart: new Date("2026-03-24T00:00:00.000Z"),
      periodEnd: new Date("2026-03-30T23:59:59.999Z"),
      totalSales: decimal(sumSales(weeklyBatch1)),
      totalCommission: decimal(sumCommission(weeklyBatch1)),
      totalPayable: decimal(sumPayable(weeklyBatch1)),
      status: InvoiceStatus.ISSUED,
      dueDate: new Date("2026-04-10T23:59:59.999Z")
    }
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      agentId: monthlyAgent.id,
      invoiceNumber: "INV-20260401-2001",
      invoiceType: InvoiceType.MONTHLY,
      periodStart: new Date("2026-03-01T00:00:00.000Z"),
      periodEnd: new Date("2026-03-31T23:59:59.999Z"),
      totalSales: decimal(sumSales(monthlyBatch1)),
      totalCommission: decimal(sumCommission(monthlyBatch1)),
      totalPayable: decimal(sumPayable(monthlyBatch1)),
      status: InvoiceStatus.PAID,
      dueDate: new Date("2026-04-07T23:59:59.999Z"),
      paidAt: new Date("2026-04-05T10:30:00.000Z")
    }
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      agentId: weeklyAgent.id,
      invoiceNumber: "INV-20260407-1002",
      invoiceType: InvoiceType.WEEKLY,
      periodStart: new Date("2026-03-31T00:00:00.000Z"),
      periodEnd: new Date("2026-04-06T23:59:59.999Z"),
      totalSales: decimal(sumSales(weeklyBatch2)),
      totalCommission: decimal(sumCommission(weeklyBatch2)),
      totalPayable: decimal(sumPayable(weeklyBatch2)),
      status: InvoiceStatus.OVERDUE,
      dueDate: new Date("2026-04-06T23:59:59.999Z")
    }
  });

  await prisma.booking.updateMany({
    where: { id: { in: weeklyBatch1.map((row) => row.id) } },
    data: {
      invoiceId: invoice1.id,
      paymentStatus: "INVOICED"
    }
  });

  await prisma.booking.updateMany({
    where: { id: { in: weeklyBatch2.map((row) => row.id) } },
    data: {
      invoiceId: invoice3.id,
      paymentStatus: "INVOICED"
    }
  });

  await prisma.booking.updateMany({
    where: { id: { in: monthlyBatch1.map((row) => row.id) } },
    data: {
      invoiceId: invoice2.id,
      paymentStatus: "PAID"
    }
  });

  weeklyOutstanding = sumPayable([...weeklyBatch1, ...weeklyBatch2]);
  monthlyOutstanding = Number((sumPayable(monthlyBookings) - sumPayable(monthlyBatch1)).toFixed(2));

  await prisma.agent.update({
    where: { id: weeklyAgent.id },
    data: {
      outstandingBalance: decimal(weeklyOutstanding)
    }
  });

  await prisma.agent.update({
    where: { id: monthlyAgent.id },
    data: {
      outstandingBalance: decimal(monthlyOutstanding)
    }
  });

  // Payment lookups (offline payment)
  await prisma.paymentGroup.createMany({
    data: [{ name: "Bank Transfer" }, { name: "Cheque" }, { name: "Cash Deposit" }]
  });
  await prisma.paymentType.createMany({
    data: [{ name: "CIMB" }, { name: "Maybank" }, { name: "Touch 'n Go" }]
  });

  // Sample purchase scheme with one revision + products, bound to the demo agent
  const scheme = await prisma.scheme.create({
    data: {
      code: "AGENTP1",
      name: "Agent Purchase Scheme 1",
      organisation: "Agent Portal",
      status: "ACTIVE",
      createdByUserId: adminUser.id
    }
  });

  const schemeRevision = await prisma.schemeRevision.create({
    data: {
      schemeId: scheme.id,
      revisionNumber: 1,
      effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
      status: "ACTIVE",
      createdByUserId: adminUser.id,
      products: {
        create: [
          { ticketTypeId: adult.id, price: decimal(72), minQty: 20, maxQty: 500, incentiveRate: decimal(3) },
          { ticketTypeId: child.id, price: decimal(45), minQty: 20, maxQty: 500, incentiveRate: decimal(2) },
          { ticketTypeId: bundle.id, price: decimal(160), minQty: 10, maxQty: 200 }
        ]
      }
    }
  });

  await prisma.schemeAssignment.create({
    data: {
      schemeId: scheme.id,
      agentId: prepaidAgent.id,
      bindingType: "STANDARD",
      assignedByUserId: adminUser.id,
      effectiveDate: schemeRevision.effectiveDate
    }
  });

  // Sample login-page announcement
  await prisma.announcement.create({
    data: {
      title: "Welcome to the Travel Agent Portal",
      body: "Register online to manage purchases, renewals, offers, and account updates in one workspace.",
      displayType: "LOGIN",
      audience: "BOTH",
      effectiveDate: new Date("2026-01-01T00:00:00.000Z"),
      expiryDate: new Date("2026-12-31T00:00:00.000Z"),
      status: "ACTIVE",
      createdByUserId: adminUser.id
    }
  });

  await prisma.activityLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: "SEED_INIT",
        entityType: "SYSTEM",
        entityId: "seed",
        description: "Seeded Travel Agent demo dataset"
      },
      {
        userId: staffUser.id,
        action: "SEED_CHECKINS",
        entityType: "TICKET",
        entityId: "bulk",
        description: "Created initial scanner history"
      }
    ]
  });

  console.log("Seed complete.");
  console.log("Demo credentials:");
  console.log("admin@travel-agent.demo / admin123!");
  console.log("agent (username) A20260001 / agent123!  (or agent@travel-agent.demo)");
  console.log("partner (username) P20260001 / partner123!");
  console.log("staff@travel-agent.demo / staff123!");
  console.log("finance@travel-agent.demo / finance123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
