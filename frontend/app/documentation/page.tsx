"use client";

import { ProtectedShell } from "@/components/layout/protected-shell";
import { Card } from "@/components/ui/card";
import { useSession } from "@/hooks/use-session";

const Section = ({ title, steps }: { title: string; steps: string[] }) => (
  <Card>
    <h3 className="section-title mb-3">{title}</h3>
    <ol className="list-inside list-decimal space-y-2 text-sm text-slate-600">
      {steps.map((s, i) => (
        <li key={i}>{s}</li>
      ))}
    </ol>
  </Card>
);

const AgentGuide = () => (
  <div className="space-y-4">
    <Section
      title="Getting Started (Agent)"
      steps={[
        "Register as an Agent from the login page — upload your KPL Form and SSM Form, add your contact person, and submit.",
        "Save your Application ID and use Check Application Status on the login page to track approval.",
        "Once approved, log in with the account code and temporary password emailed to you, then change your password."
      ]}
    />
    <Section
      title="Buying Tickets"
      steps={[
        "Open Ticket Purchase, filter products by outlet, set quantities (respect min/max), and add to cart.",
        "Submit to create the order, then review it on the Transaction Review page.",
        "Click Pay Offline: upload your bank-in slip, choose the payment group and type, and submit.",
        "Orders you did not finish paying appear under Incomplete Order — click Complete to resume.",
        "Once Finance marks the payment paid and Admin approves it, your vouchers are generated automatically."
      ]}
    />
    <Section
      title="Vouchers"
      steps={[
        "Open Voucher Issued to see each order with issued / used / available counts.",
        "Click into an order to view every voucher's serial number, dates, and status — use the filter and Export To Excel as needed.",
        "Click View QR and give the QR / serial number to your customer — they show it at the gate."
      ]}
    />
    <Section
      title="Account & Renewal (Agent)"
      steps={[
        "Your company details, documents, and account expiry are under Profile.",
        "Renewal opens two months before your account expires — click Request Renewal.",
        "As an Agent you must upload the KPL Form and SSM Form, and provide your KPL License Number and KPL Expiry Date (minimum 2 months before expiry).",
        "Track the renewal status on the same page; you will be emailed the outcome.",
        "Change your password anytime under Settings."
      ]}
    />
  </div>
);

const PartnerGuide = () => (
  <div className="space-y-4">
    <Section
      title="Getting Started (Partner)"
      steps={[
        "Register as a Partner from the login page — upload your SSM Form, add your contact person, and submit.",
        "Save your Application ID and use Check Application Status on the login page to track approval.",
        "Once approved, log in with the account code and temporary password emailed to you, then change your password."
      ]}
    />
    <Section
      title="Buying Tickets"
      steps={[
        "Open Ticket Purchase, filter products by outlet, set quantities (respect min/max), and add to cart.",
        "Submit to create the order, then review it on the Transaction Review page.",
        "Click Pay Offline: upload your bank-in slip, choose the payment group and type, and submit.",
        "Orders you did not finish paying appear under Incomplete Order — click Complete to resume.",
        "Once Finance marks the payment paid and Admin approves it, your vouchers are generated automatically."
      ]}
    />
    <Section
      title="Vouchers"
      steps={[
        "Open Voucher Issued to see each order with issued / used / available counts.",
        "Click into an order to view every voucher's serial number, dates, and status — use the filter and Export To Excel as needed.",
        "Click View QR and give the QR / serial number to your customer — they show it at the gate."
      ]}
    />
    <Section
      title="Account & Renewal (Partner)"
      steps={[
        "Your company details, documents, and account expiry are under Profile.",
        "Renewal opens two months before your account expires — click Request Renewal.",
        "As a Partner you only need to upload your updated SSM Form.",
        "Track the renewal status on the same page; you will be emailed the outcome.",
        "Change your password anytime under Settings."
      ]}
    />
  </div>
);

const AdminGuide = () => (
  <div className="space-y-4">
    <Section
      title="Approving Registrations"
      steps={[
        "New applications appear under Agent Requests / Partner Requests.",
        "Open a request to review company info, documents, and contact persons.",
        "Approve, Reject, or ask for Revision (remarks are required for reject/revision).",
        "On approval the account is created and credentials are emailed; it then shows under Active Agents / Active Partners."
      ]}
    />
    <Section
      title="Purchase Schemes"
      steps={[
        "Create a scheme under Purchase Schemes: add products with price, min/max quantity, and optional incentive/discount.",
        "Bind the scheme to an agent/partner account — without a bound scheme the account sees no products.",
        "New revisions version the product set; the latest effective revision is what accounts buy from."
      ]}
    />
    <Section
      title="Payments & Vouchers"
      steps={[
        "Offline payments wait under Pending Payment Approval.",
        "Finance must Mark Payment Paid first; until then the row shows Awaiting finance.",
        "Click Approve Payment (or open the row for full review). Approving confirms the order and auto-generates the vouchers.",
        "Reject / Revision requires a reason; the agent is emailed either way."
      ]}
    />
    <Section
      title="Complimentary, Renewals & Announcements"
      steps={[
        "Complimentary: pick the account, add products (minimum 20 tickets total), and submit — free vouchers are issued at RM 0.",
        "Renewals: review requests under Account Renewal; approving extends the account expiry.",
        "Announcements: create Home/Login announcements with an effective and expiry date for agents, partners, or both."
      ]}
    />
    <Section
      title="Reports"
      steps={[
        "Open Reports and pick a report (Transaction, Purchase Summary, Payment, Voucher Issued, Complimentary…).",
        "Filter by user, company, or date range, then click Search.",
        "Click a Reference No. in the table to see the full transaction details.",
        "Use Export To Excel to download the filtered report."
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
      subtitle={`${guideName} user guide`}
    >
      {!user ? null : isAdmin ? <AdminGuide /> : isPartner ? <PartnerGuide /> : <AgentGuide />}
    </ProtectedShell>
  );
}
