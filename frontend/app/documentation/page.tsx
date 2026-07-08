"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";

interface GuideImage {
  src: string;
  caption: string;
}

const Screenshot = ({ src, caption }: GuideImage) => (
  <figure className="mt-4">
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={caption} loading="lazy" className="w-full" />
    </div>
    <figcaption className="mt-1.5 text-center text-xs text-slate-500">{caption}</figcaption>
  </figure>
);

const Section = ({
  title,
  intro,
  steps,
  images
}: {
  title: string;
  intro?: string;
  steps: string[];
  images?: GuideImage[];
}) => (
  <Card>
    <h3 className="section-title mb-1">{title}</h3>
    {intro ? <p className="mb-2 text-xs text-slate-500">{intro}</p> : null}
    <ol className="list-none space-y-2 text-sm text-slate-600">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white">
            {i + 1}
          </span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
    {images?.map((image) => <Screenshot key={image.src} {...image} />)}
  </Card>
);

const MARKER_NOTE = "The red numbered markers on the screenshot match the steps above.";

const BuyingTicketsSections = () => (
  <>
    <Section
      title="Buying Tickets — Step 1: Build Your Cart"
      intro={MARKER_NOTE}
      steps={[
        "Use the Outlet filter to show products from a specific outlet.",
        "Enter the quantity you want (each product has a minimum and maximum).",
        "Click Add to place the product in your cart (it changes to Update if already added).",
        "When your cart is ready, click Submit to create the order."
      ]}
      images={[{ src: "/docs/ticket-purchase.png", caption: "Ticket Purchase page" }]}
    />
    <Section
      title="Buying Tickets — Step 2: Review & Pay Offline"
      intro={MARKER_NOTE}
      steps={[
        "On the Transaction Review page, check the Bank Information box — transfer the total to this outlet's bank account.",
        "Click Pay Offline to submit your proof of payment."
      ]}
      images={[
        {
          src: "/docs/transaction-review.png",
          caption: "Transaction Review — the order total, bank account, and Pay Offline button"
        }
      ]}
    />
    <Section
      title="Buying Tickets — Step 3: Submit Proof of Payment"
      intro={MARKER_NOTE}
      steps={[
        "Upload your bank-in slip under Proof of Payment.",
        "Choose the Payment Group and Payment Type.",
        "Click Submit. Finance will mark it paid, Admin approves it, and your vouchers are generated automatically."
      ]}
      images={[{ src: "/docs/pay-offline-modal.png", caption: "Pay Offline dialog" }]}
    />
    <Section
      title="Resuming an Unpaid Order"
      intro={MARKER_NOTE}
      steps={["Orders you did not finish paying appear under Incomplete Order — click Complete to resume payment."]}
      images={[{ src: "/docs/incomplete-orders.png", caption: "Incomplete Orders page" }]}
    />
  </>
);

const VoucherSections = () => (
  <>
    <Section
      title="Vouchers"
      intro={MARKER_NOTE}
      steps={["Open Voucher Issued and click an order row to see its vouchers (issued / used / available counts are shown per order)."]}
      images={[{ src: "/docs/voucher-issued.png", caption: "Voucher Issued — one row per order" }]}
    />
    <Section
      title="Voucher Detail & QR"
      intro={MARKER_NOTE}
      steps={[
        "Filter vouchers by status or search a serial number.",
        "Click Export To Excel to download the voucher list.",
        "Click View QR and give the QR / serial number to your customer — they show it at the gate."
      ]}
      images={[{ src: "/docs/voucher-detail.png", caption: "Voucher detail — serials, status, QR" }]}
    />
  </>
);

const GettingStartedSection = ({ role }: { role: "Agent" | "Partner" }) => (
  <Section
    title={`Getting Started (${role})`}
    intro={MARKER_NOTE}
    steps={[
      `Click Become ${role === "Agent" ? "an Agent" : "a Partner"} on the login page and fill in the registration form${
        role === "Agent" ? " (KPL Form and SSM Form required)" : " (SSM Form required)"
      }. Save your Application ID after submitting.`,
      "Use Check Application Status anytime to track your approval.",
      "Once approved, sign in with the account code and temporary password emailed to you, then change your password."
    ]}
    images={[
      { src: "/docs/login.png", caption: "Login page" },
      {
        src: "/docs/register-terms.png",
        caption: "Read the Terms and Conditions, prepare the listed documents, and click Accept"
      },
      {
        src: "/docs/register.png",
        caption: "Registration form — complete each section, then Save and Next"
      }
    ]}
  />
);

const DashboardSection = () => (
  <Section
    title="Your Dashboard"
    intro={MARKER_NOTE}
    steps={[
      "Ticket Management in the sidebar holds Ticket Purchase, Incomplete Order, and Voucher Issued.",
      "Reports shows your purchase and payment history."
    ]}
    images={[{ src: "/docs/agent-dashboard.png", caption: "Dashboard after login" }]}
  />
);

const AccountSection = ({ role }: { role: "Agent" | "Partner" }) => (
  <>
    <Section
      title={`Account & Renewal (${role})`}
      intro={MARKER_NOTE}
      steps={[
        "Company Information, documents, and your account expiry live under Profile.",
        role === "Agent"
          ? "Account Renewal opens two months before expiry — click Request Renewal and upload the KPL Form and SSM Form with your KPL License Number and Expiry Date."
          : "Account Renewal opens two months before expiry — click Request Renewal and upload your updated SSM Form."
      ]}
      images={[{ src: "/docs/profile.png", caption: "Profile — company info and renewal" }]}
    />
    <Section
      title="Changing Your Password"
      intro={MARKER_NOTE}
      steps={[
        "Open Settings and fill in the Change Password form (follow the password rules shown).",
        "Click Change Password — you will be asked to log in again."
      ]}
      images={[{ src: "/docs/settings.png", caption: "Settings — change password" }]}
    />
  </>
);

const AgentGuide = () => (
  <div className="space-y-4">
    <GettingStartedSection role="Agent" />
    <DashboardSection />
    <BuyingTicketsSections />
    <VoucherSections />
    <Section
      title="Purchase Report"
      intro={MARKER_NOTE}
      steps={[
        "Filter your orders by date range.",
        "Click Search to load the results.",
        "Click a Reference No. to reopen the Transaction Review page for that order."
      ]}
      images={[{ src: "/docs/agent-purchase-report.png", caption: "Purchase report" }]}
    />
    <AccountSection role="Agent" />
  </div>
);

const PartnerGuide = () => (
  <div className="space-y-4">
    <GettingStartedSection role="Partner" />
    <DashboardSection />
    <BuyingTicketsSections />
    <VoucherSections />
    <AccountSection role="Partner" />
  </div>
);

const AdminGuide = () => (
  <div className="space-y-4">
    <Section
      title="Admin Dashboard"
      intro={MARKER_NOTE}
      steps={[
        "Pending Agent Requests (and Partner Requests) show new registrations waiting for review — click the card to open them.",
        "Pending Payment Approvals shows offline payments waiting for your approval. Every card on the dashboard is clickable."
      ]}
      images={[{ src: "/docs/admin-dashboard.png", caption: "Admin dashboard" }]}
    />
    <Section
      title="Approving Registrations"
      intro={MARKER_NOTE}
      steps={[
        "Open a request row to review company info, documents, and contact persons. Then Approve, Reject, or ask for Revision (remarks required for reject/revision). On approval the account is created and credentials are emailed."
      ]}
      images={[{ src: "/docs/admin-agent-requests.png", caption: "Agent registration requests" }]}
    />
    <Section
      title="Outlets & Bank Information"
      intro={MARKER_NOTE}
      steps={[
        "When creating an outlet, fill in the Bank Information section — agents see these details when paying for this outlet's products.",
        "For existing outlets, click Edit to set or change the bank account."
      ]}
      images={[
        { src: "/docs/admin-outlets.png", caption: "Outlets page" },
        { src: "/docs/admin-outlet-bank-modal.png", caption: "Editing an outlet's bank information" }
      ]}
    />
    <Section
      title="Purchase Schemes"
      intro={MARKER_NOTE}
      steps={[
        "Create a scheme with products, prices, min/max quantities, and optional incentive/discount — then bind it to an agent/partner account. Without a bound scheme the account sees no products. New revisions version the product set."
      ]}
      images={[{ src: "/docs/admin-schemes.png", caption: "Purchase schemes" }]}
    />
    <Section
      title="Payments & Vouchers"
      intro={MARKER_NOTE}
      steps={[
        "Rows showing Awaiting finance need Finance to Mark Payment Paid first.",
        "Once finance-paid, click Approve Payment (or open the row for full review). Approving confirms the order and auto-generates vouchers. Reject / Revision requires a reason; the agent is emailed either way."
      ]}
      images={[{ src: "/docs/admin-pending-payments.png", caption: "Pending payment approvals" }]}
    />
    <Section
      title="Complimentary, Renewals & Announcements"
      intro={MARKER_NOTE}
      steps={[
        "Complimentary: pick the account, add products (minimum 20 tickets total), and submit — free vouchers are issued at RM 0.",
        "Renewals: open a request row under Account Renewal; approving extends the account expiry.",
        "Announcements: create Home/Login announcements with an effective and expiry date for agents, partners, or both."
      ]}
      images={[
        { src: "/docs/admin-complimentary.png", caption: "Complimentary vouchers" },
        { src: "/docs/admin-renewals.png", caption: "Account renewals" },
        { src: "/docs/admin-announcements.png", caption: "Announcements" }
      ]}
    />
    <Section
      title="Reports"
      intro={MARKER_NOTE}
      steps={[
        "Pick a report from the Reports page, then filter by user, company, or date range.",
        "Click Search to load results; click a Reference No. for full transaction details.",
        "Click Export To Excel to download the filtered report."
      ]}
      images={[
        { src: "/docs/admin-reports-home.png", caption: "Reports home" },
        { src: "/docs/admin-report-transaction.png", caption: "Transaction report — filters, search, export" }
      ]}
    />
  </div>
);

export default function DocumentationPage() {
  const { user } = useSession(["AGENT", "ADMIN"]);

  const isAdmin = user?.role === "ADMIN";
  const isPartner = user?.partyType === "PARTNER";
  const guideName = isAdmin ? "Admin" : isPartner ? "Partner" : "Agent";

  return (
    <ProtectedShell
      roles={["AGENT", "ADMIN"]}
      title="Documentation"
      subtitle={`${guideName} user guide — follow the numbered markers on each screenshot`}
    >
      {!user ? null : isAdmin ? <AdminGuide /> : isPartner ? <PartnerGuide /> : <AgentGuide />}
    </ProtectedShell>
  );
}
