/**
 * Captures screenshots of every Travel Agent Portal flow for the user guide.
 * Run with: node scripts/capture-guide.mjs   (dev server must be on :3000)
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000";
const OUT = path.resolve("../docs/user-guide/images");
fs.mkdirSync(OUT, { recursive: true });

const PDF = Buffer.from("%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n");

// Unique suffix per run so re-runs never hit the unique-email constraint on approval.
const RUN = `${Date.now()}`.slice(-6);

const shot = async (page, name, opts = {}) => {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: opts.fullPage ?? false });
  console.log(`✓ ${name}.png`);
};

const login = async (ctx, identifier, password) => {
  const res = await ctx.request.post(`${BASE}/api/auth/login`, {
    data: { identifier, password }
  });
  if (!res.ok()) throw new Error(`login failed for ${identifier}: ${res.status()}`);
};

const json = async (res) => (await res.json()).data;

const run = async () => {
  const browser = await chromium.launch();
  const mk = () => browser.newContext({ viewport: { width: 1440, height: 900 } });

  const pub = await mk();
  const adminCtx = await mk();
  const agentCtx = await mk();
  const financeCtx = await mk();
  const staffCtx = await mk();

  await login(adminCtx, "admin@travel-agent.demo", "admin123!");
  await login(agentCtx, "A20260001", "agent123!");
  await login(financeCtx, "finance@travel-agent.demo", "finance123!");
  await login(staffCtx, "staff@travel-agent.demo", "staff123!");

  // ---------- DATA SETUP ----------
  console.log("-- data setup --");

  // Pending PARTNER registration for the partner queue screenshot
  const ssmUp = await json(
    await pub.request.post(`${BASE}/api/uploads`, {
      multipart: {
        file: { name: "ssm-form.pdf", mimeType: "application/pdf", buffer: PDF },
        docType: "SSM",
        ownerType: "REGISTRATION"
      }
    })
  );
  await pub.request.post(`${BASE}/api/applications`, {
    data: {
      partyType: "PARTNER",
      companyName: "Sunrise Holidays Sdn Bhd",
      registrationNo: "202601000777",
      email: `sunrise+${RUN}@demo.my`,
      contactNo: "0123334444",
      addressLine1: "88 Jalan Sunrise",
      addressLine2: "Petaling Jaya",
      postcode: "46000",
      country: "Malaysia",
      state: "Selangor",
      termsAccepted: true,
      contactPersons: [{ name: "Sun Lee", email: "sun@demo.my", phone: "0123334444" }],
      documentIds: [ssmUp.documentId]
    }
  });

  // Agent order #1: stays PENDING_PAYMENT (for transaction review / pay offline / incomplete orders)
  const catalog = await json(await agentCtx.request.get(`${BASE}/api/purchases/catalog`));
  const sp = catalog[0];
  const order1 = await json(
    await agentCtx.request.post(`${BASE}/api/purchases`, {
      data: { items: [{ schemeProductId: sp.schemeProductId, quantity: 30 }] }
    })
  );

  // Agent order #2: offline payment submitted (for finance/admin approval flow)
  const order2 = await json(
    await agentCtx.request.post(`${BASE}/api/purchases`, {
      data: { items: [{ schemeProductId: sp.schemeProductId, quantity: 25 }] }
    })
  );
  const slip = await json(
    await agentCtx.request.post(`${BASE}/api/uploads`, {
      multipart: {
        file: { name: "bank-slip.pdf", mimeType: "application/pdf", buffer: PDF },
        docType: "PAYMENT_SLIP",
        ownerType: "OFFLINE_PAYMENT"
      }
    })
  );
  const groups = await json(await agentCtx.request.get(`${BASE}/api/payment-groups`));
  const types = await json(await agentCtx.request.get(`${BASE}/api/payment-types`));
  const payment = await json(
    await agentCtx.request.post(`${BASE}/api/purchases/${order2.orderReference}/offline-payment`, {
      data: {
        slipDocumentId: slip.documentId,
        paymentGroupId: groups[0]?.id,
        paymentTypeId: types[0]?.id
      }
    })
  );

  // Renewal request (for admin renewals screenshot)
  await agentCtx.request.post(`${BASE}/api/renewals`, {
    data: { kplLicenseNo: "KPL-2027-0001", kplExpiryDate: "2027-12-31" }
  });

  // HOME announcement (for agent dashboard popup)
  await adminCtx.request.post(`${BASE}/api/announcements`, {
    data: {
      title: "Stay updated with Travel Agent offers and partner news",
      body: "Latest updates for all agents and partners. New offers, account notices, and platform announcements will appear here.",
      displayType: "HOME",
      audience: "BOTH",
      effectiveDate: "2026-01-01",
      expiryDate: "2026-12-31",
      status: "ACTIVE"
    }
  });

  console.log(`orders: ${order1.orderReference}, ${order2.orderReference}; payment: ${payment.id}`);

  // ---------- PUBLIC ----------
  console.log("-- public --");
  const p = await pub.newPage();

  await p.goto(`${BASE}/login`);
  await shot(p, "01-login", { fullPage: true });

  await p.goto(`${BASE}/register/agent`);
  await shot(p, "02-register-terms");

  await p.getByRole("button", { name: "Accept" }).click();
  await p.waitForTimeout(400);
  const inputs = p.locator("input");
  const step1 = [
    "Demo Travel Agency Sdn Bhd", "202601000555", `demo.agency+${RUN}@demo.my`,
    "KPL-2026-5555", "2026-12-31", "0129998888", "0379998888",
    "12 Jalan Demo", "Kuala Lumpur", "", "50000", "Malaysia", "Wilayah Persekutuan"
  ];
  for (let i = 0; i < step1.length; i += 1) {
    if (step1[i]) await inputs.nth(i).fill(step1[i]);
  }
  await shot(p, "03-register-company", { fullPage: true });

  await p.getByRole("button", { name: "Save and Next" }).click();
  await p.waitForTimeout(400);
  const fileInputs = p.locator('input[type="file"]');
  await fileInputs.nth(0).setInputFiles({ name: "kpl-form.pdf", mimeType: "application/pdf", buffer: PDF });
  await p.waitForTimeout(800);
  await fileInputs.nth(1).setInputFiles({ name: "ssm-form.pdf", mimeType: "application/pdf", buffer: PDF });
  await p.waitForTimeout(800);
  await shot(p, "04-register-documents");

  await p.getByRole("button", { name: "Save and Next" }).click();
  await p.waitForTimeout(300);
  await p.getByPlaceholder("Full Name *").fill("Demo Person");
  await p.getByPlaceholder("Email Address").fill("person@demo.my");
  await p.getByPlaceholder("Phone Number").fill("0121112222");
  await shot(p, "05-register-contact");

  await p.getByRole("button", { name: "Save and Next" }).click();
  await p.waitForTimeout(300);
  await p.locator('input[type="checkbox"]').check();
  await shot(p, "06-register-background");

  await p.getByRole("button", { name: "Submit" }).click();
  await p.waitForSelector("text=Well done", { timeout: 15000 });
  await shot(p, "07-register-success");
  const appId = (await p.locator(".tracking-widest").innerText()).trim();
  console.log(`application id: ${appId}`);

  await p.goto(`${BASE}/application-status`);
  await p.getByPlaceholder("Enter application id").fill(appId);
  await p.getByRole("button", { name: "Submit" }).click();
  await p.waitForSelector("text=Application Details", { timeout: 10000 });
  await shot(p, "08-check-status");

  await p.goto(`${BASE}/forgot-password`);
  await shot(p, "09-forgot-password");

  // ---------- ADMIN (registrations, accounts, schemes, announcements) ----------
  console.log("-- admin --");
  const a = await adminCtx.newPage();

  await a.goto(`${BASE}/admin/dashboard`);
  await shot(a, "10-admin-dashboard", { fullPage: true });

  await a.goto(`${BASE}/admin/registrations/agents`);
  await shot(a, "11-admin-agent-requests");

  const pendingAgents = await json(
    await adminCtx.request.get(`${BASE}/api/registrations?partyType=AGENT&status=PENDING`)
  );
  const regId = pendingAgents[0]?.id;
  if (regId) {
    await a.goto(`${BASE}/admin/registrations/${regId}`);
    await shot(a, "12-admin-registration-review", { fullPage: true });

    await a.locator("select").selectOption("APPROVED");
    await a.getByRole("button", { name: "Submit" }).click();
    await a.waitForSelector("text=Account created", { timeout: 15000 });
    await shot(a, "13-admin-registration-approved");
  }

  await a.goto(`${BASE}/admin/agents-active`);
  await shot(a, "14-admin-active-agents");

  const accounts = await json(await adminCtx.request.get(`${BASE}/api/accounts?partyType=AGENT`));
  const seededAgent = accounts.find((x) => x.accountCode === "A20260001") ?? accounts[0];
  await a.goto(`${BASE}/admin/accounts/${seededAgent.id}`);
  await shot(a, "15-admin-account-detail", { fullPage: true });

  await a.goto(`${BASE}/admin/accounts/${seededAgent.id}/schemes`);
  await shot(a, "16-admin-bind-scheme");

  await a.goto(`${BASE}/admin/purchase-schemes`);
  await shot(a, "17-admin-purchase-schemes");

  const schemes = await json(await adminCtx.request.get(`${BASE}/api/purchase-schemes`));
  await a.goto(`${BASE}/admin/purchase-schemes/${schemes[0].id}`);
  await shot(a, "18-admin-scheme-detail", { fullPage: true });

  await a.goto(`${BASE}/admin/announcements`);
  await a.getByRole("button", { name: "Add New Announcement" }).click();
  await a.waitForTimeout(300);
  await shot(a, "19-admin-announcements", { fullPage: true });

  await a.goto(`${BASE}/admin/complimentary`);
  await shot(a, "20-admin-complimentary");

  await a.goto(`${BASE}/admin/renewals`);
  await shot(a, "21-admin-renewals");

  // ---------- AGENT ----------
  console.log("-- agent --");
  const g = await agentCtx.newPage();

  await g.goto(`${BASE}/agent/dashboard`);
  await g.waitForSelector("text=Latest Announcement", { timeout: 10000 }).catch(() => {});
  await shot(g, "30-agent-dashboard-popup");
  await g.keyboard.press("Escape");
  await g.waitForTimeout(300);
  await shot(g, "31-agent-dashboard", { fullPage: true });

  await g.goto(`${BASE}/ticket-purchase`);
  await g.waitForSelector("text=Order Summary", { timeout: 10000 });
  await g.getByRole("button", { name: "Add", exact: true }).first().click();
  await g.waitForTimeout(300);
  await shot(g, "32-ticket-purchase");

  await g.goto(`${BASE}/transaction-review/${order1.orderReference}`);
  await g.waitForSelector("text=Transaction Detail", { timeout: 10000 });
  await shot(g, "33-transaction-review", { fullPage: true });

  await g.getByRole("button", { name: "Pay Offline" }).click();
  await g.waitForTimeout(400);
  await shot(g, "34-pay-offline-modal");
  await g.keyboard.press("Escape");

  await g.goto(`${BASE}/incomplete-orders`);
  await shot(g, "35-incomplete-orders");

  await g.goto(`${BASE}/vouchers`);
  await shot(g, "36-vouchers");

  const voucherGroups = await json(await agentCtx.request.get(`${BASE}/api/vouchers`));
  const withOrder = voucherGroups.find((v) => v.purchaseOrderId);
  if (withOrder) {
    await g.goto(`${BASE}/vouchers/${withOrder.purchaseOrderId}`);
    await shot(g, "37-voucher-detail", { fullPage: true });
  }

  await g.goto(`${BASE}/reports/purchase`);
  await shot(g, "38-agent-purchase-report");

  await g.goto(`${BASE}/profile`);
  await shot(g, "39-agent-profile", { fullPage: true });

  await g.goto(`${BASE}/change-password`);
  await shot(g, "40-change-password");

  // ---------- FINANCE ----------
  console.log("-- finance --");
  const f = await financeCtx.newPage();

  await f.goto(`${BASE}/finance/offline-payments`);
  await shot(f, "50-finance-payments");

  await f.goto(`${BASE}/finance/offline-payments/${payment.id}`);
  await f.waitForSelector("text=Purchase Header", { timeout: 10000 });
  await shot(f, "51-finance-payment-review", { fullPage: true });

  await f.getByRole("button", { name: "Mark Payment Paid" }).click();
  await f.waitForSelector("text=marked as paid", { timeout: 10000 });
  await shot(f, "52-finance-marked-paid");

  // ---------- ADMIN payment approval ----------
  console.log("-- admin payment approval --");
  await a.goto(`${BASE}/admin/offline-payments/pending`);
  await shot(a, "22-admin-payments-pending");

  await a.goto(`${BASE}/admin/offline-payments/${payment.id}`);
  await a.waitForSelector("text=Payment Approval", { timeout: 10000 });
  await shot(a, "23-admin-payment-review", { fullPage: true });

  await a.locator("select").last().selectOption("APPROVED");
  await a.getByRole("button", { name: "Submit" }).click();
  await a.waitForSelector("text=Payment APPROVED", { timeout: 15000 });
  await shot(a, "24-admin-payment-approved");

  await a.goto(`${BASE}/admin/reports`);
  await shot(a, "25-admin-reports");

  await a.goto(`${BASE}/admin/reports/purchase-summary`);
  await shot(a, "26-admin-report-purchase");

  // ---------- STAFF (voucher redemption) ----------
  console.log("-- staff --");
  const groups2 = await json(await agentCtx.request.get(`${BASE}/api/vouchers`));
  const g2 = groups2.find((v) => v.reference === order2.orderReference);
  let serial = null;
  if (g2?.purchaseOrderId) {
    const detail = await json(await agentCtx.request.get(`${BASE}/api/vouchers/${g2.purchaseOrderId}`));
    serial = detail.vouchers.find((v) => v.redeemStatus === "NEW")?.serialNo ?? null;
  }
  const s = await staffCtx.newPage();

  await s.goto(`${BASE}/voucher-redeem`);
  await shot(s, "60-staff-voucher-redeem");

  if (serial) {
    await s.getByPlaceholder(/APM-V/).fill(serial);
    await s.locator('input[placeholder*="Gate"]').fill("Gate 1");
    await s.getByRole("button", { name: "Redeem Voucher" }).click();
    await s.waitForSelector("text=redeemed successfully", { timeout: 10000 });
    await shot(s, "61-staff-voucher-redeemed");
  }

  await browser.close();
  console.log("DONE");
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
