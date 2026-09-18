# Agent Portal — Project Specification

**Document type:** Scope of Work / Functional Specification (attachment to quotation)
**Product:** Agent Portal — B2B Travel Agent & Partner Ticketing Platform
**Version:** 1.0
**Date:** 14 September 2026
**Prepared for:** Client evaluation and quotation attachment

> This document describes **what the system does**. Commercial terms, man-day rates and
> price tables are covered separately in the quotation cover sheet.

---

## 1. Executive Summary

The Agent Portal is a complete B2B ticketing platform for theme-park and attraction
operators. It allows travel agents and corporate partners to register online, be approved
by the operator, purchase attraction tickets wholesale under operator-defined pricing
schemes, pay by offline bank transfer, and receive QR-coded vouchers that are redeemed by
gate staff at the point of sale.

The platform replaces manual processes that are today handled by email, spreadsheets,
WhatsApp and paper vouchers, and adds a controlled financial workflow with a two-actor
(Finance → Admin) payment approval gate.

This specification also covers the **Becca Commission at POS** module — the calculation,
recording, statement and settlement of the agent's margin (the *becca*, or price difference)
at the moment a voucher is redeemed at the counter.

### 1.1 Business outcomes

| Outcome | How the system delivers it |
|---|---|
| Remove manual agent onboarding | Self-service online registration with document upload and an approval queue |
| Control wholesale pricing per agent | Versioned purchase schemes bound to individual accounts |
| Eliminate paper vouchers | Serialised, QR-signed digital vouchers with one-time redemption |
| Prevent revenue leakage at the gate | Locked / redeemed / expired voucher states, full redemption audit trail |
| Segregate financial duties | Finance verifies payment, Admin approves issuance — two different people |
| Make agent margin auditable | Becca commission captured per redemption, reconciled into statements |
| Give management visibility | 9+ operational reports, all exportable to Excel |

---

## 2. Solution Overview

### 2.1 End-to-end business flow

```
Agent / Partner        Admin                  Agent / Partner      Finance              Admin                    Counter / POS
───────────────        ─────                  ───────────────      ───────              ─────                    ─────────────
Register online   →    Approve request   →    Buy tickets      →   Mark payment     →   Approve payment      →   Redeem voucher
+ upload KPL /         (account code +        + upload bank        as Paid              (vouchers issued          QR at the gate
SSM documents          temporary password     transfer slip                             automatically)            + becca recorded
                       emailed to agent)
```

### 2.2 User roles

| Role | Who they are | Primary responsibility |
|---|---|---|
| **Admin** | Operator's commercial / ticketing team | Approve accounts, define schemes and products, approve payments, issue complimentary tickets, publish announcements, run reports |
| **Agent** | Travel agency account | Register, purchase tickets, submit payment, download vouchers, view own reports |
| **Partner** | Corporate / institutional account | Same portal as Agent with a separate approval queue, account code series and announcement audience |
| **Finance** | Operator's finance team | Verify bank slips and mark payments as Paid — a hard prerequisite to voucher issuance |
| **Staff** | Gate / counter operator | Scan or key in voucher serials, redeem one-time, record entrance gate and becca |

Role separation is enforced server-side on every request, not only in the user interface.

---

## 3. Functional Specification by Module

### Module A — Public Registration & Onboarding

| Ref | Requirement |
|---|---|
| A-01 | Public 4-step registration wizard: (1) Company information, (2) Document upload, (3) Contact persons, (4) Business background |
| A-02 | Separate registration tracks for **Agent** and **Partner** party types |
| A-03 | Terms & Conditions acceptance gate before the wizard can be submitted |
| A-04 | Mandatory upload of KPL licence and SSM company registration documents (PDF / JPG / PNG) |
| A-05 | Multiple contact persons per application, each with name, designation, email, mobile |
| A-06 | System-generated **Application ID** returned on submission and emailed to the applicant |
| A-07 | Public **Application Status** page — applicant enters Application ID to see Pending / Approved / Rejected / Revision Required with remarks |
| A-08 | Field-level validation: company registration number, KPL number and expiry, postcode, state, country, phone/fax formats |
| A-09 | Draft-safe wizard — data retained when moving between steps |

### Module B — Registration Approval (Admin)

| Ref | Requirement |
|---|---|
| B-01 | Separate Agent Requests and Partner Requests approval queues |
| B-02 | Application detail view showing all submitted fields, contact persons and uploaded documents |
| B-03 | Secure in-browser preview / download of uploaded documents (authenticated route, files never publicly served) |
| B-04 | Three decisions: **Approve**, **Reject**, **Request Revision** — each with mandatory remarks |
| B-05 | Approval automatically creates the portal account, allocates the next **account code** (`A20260001` for agents, `P20260001` for partners) and emails a temporary password |
| B-06 | Temporary password expires in 24 hours; first login forces a password change |
| B-07 | Revision requests re-open the application to the applicant with the admin's remarks attached |
| B-08 | Full approval history retained per application |

### Module C — Account Management (Admin)

| Ref | Requirement |
|---|---|
| C-01 | Active Agents and Active Partners listings with search, filter and paging |
| C-02 | Account profile: company details, address, KPL/SSM data, target market, sales channel, contact persons, documents |
| C-03 | Account status control — **Active / Inactive / Expired** |
| C-04 | Account expiry date per account; expired accounts may still log in but cannot purchase |
| C-05 | Portal user management per account (create, disable, reset password) |
| C-06 | Agreement type per account (Prepaid / Weekly / Monthly) |
| C-07 | Activity log of administrative actions against the account |

### Module D — Account Renewal

| Ref | Requirement |
|---|---|
| D-01 | Renewal becomes available to the agent **2 months before** account expiry |
| D-02 | Agent submits a renewal request with updated documents (renewed KPL, etc.) |
| D-03 | Admin renewal approval queue with Approve / Reject / Revision and remarks |
| D-04 | Approval extends the account expiry date and restores purchasing rights |
| D-05 | Email notification to the agent on each state change |

### Module E — Outlets & Products

| Ref | Requirement |
|---|---|
| E-01 | Outlet master — code, name, description, address, bank name / account name / account number, active flag |
| E-02 | Product (ticket type) master — name, SKU, description, image, category (Adult / Child / Bundle), selling price, cost price, validity type (Same-day / Fixed date / Date range), active flag |
| E-03 | Products belong to an outlet; multi-outlet operation supported |
| E-04 | **Bulk product creation** — create a batch of products in one operation |
| E-05 | **Product import** from spreadsheet with row-level validation and error reporting |
| E-06 | Product images used in the agent-facing catalogue |

### Module F — Purchase Schemes (Pricing)

| Ref | Requirement |
|---|---|
| F-01 | A scheme groups selected products with a scheme-specific price per product |
| F-02 | Per-product **minimum** and **maximum** purchase quantity |
| F-03 | Optional per-product **incentive rate** and **discount rate** |
| F-04 | **Versioned revisions** — each change creates a new revision with an effective date; historical orders remain bound to the revision they were purchased under |
| F-05 | Scheme binding to accounts in two tabs: **Standard** and **Special**, with an incentive note per binding |
| F-06 | Active / Inactive scheme status |
| F-07 | An agent sees only the products in the scheme(s) bound to their account, at their bound prices |

### Module G — Ticket Purchase (Agent)

| Ref | Requirement |
|---|---|
| G-01 | Scheme-priced product catalogue with images, category and price |
| G-02 | Cart with quantity controls enforcing per-product min/max |
| G-03 | Live order summary — subtotal, incentive total, discount total, total payable |
| G-04 | Order submission generates a unique **Order Reference** |
| G-05 | **Incomplete Orders** screen — saved drafts can be resumed or cancelled |
| G-06 | Purchase blocked for Inactive or Expired accounts, with an explanatory message |
| G-07 | Order statuses: Draft → Pending Payment → Pending Approval → Order Confirmed / Rejected / Revision / Cancelled |
| G-08 | Transaction review screen per order reference showing items, totals and current status |

### Module H — Offline Payment & Two-Actor Approval

| Ref | Requirement |
|---|---|
| H-01 | Agent submits a payment against one or more purchase orders |
| H-02 | Payment capture: amount, payment group, payment type, bank name, bank reference, **bank slip upload** |
| H-03 | One payment may settle multiple purchase orders |
| H-04 | **Finance** queue — verify the slip against the bank statement and **Mark Payment Paid** |
| H-05 | **Admin** queue — approve only payments already marked Paid by Finance (hard prerequisite, enforced server-side) |
| H-06 | Admin approval automatically issues the vouchers for the linked orders |
| H-07 | Reject / Revision paths with mandatory remarks at both Finance and Admin stages |
| H-08 | Complete payment status history — who changed what, from which status to which, when, with remarks |
| H-09 | Payment Group and Payment Type maintained as configurable master data |

### Module I — Voucher Issuance & Delivery

| Ref | Requirement |
|---|---|
| I-01 | On approval, one voucher record is generated per ticket purchased |
| I-02 | Each voucher carries a unique **serial number** and a **cryptographically signed QR code** |
| I-03 | Voucher validity — effective date and expiry date |
| I-04 | Redeem status: **New / Locked / Redeemed / Expired** |
| I-05 | Agent "Voucher Issued" screen with issued / used / available counts per order |
| I-06 | Voucher detail view with printable QR and serial |
| I-07 | Vouchers traceable to their source — purchase order or complimentary grant |
| I-08 | Bulk voucher listing and export per order |

### Module J — Gate Redemption / Point of Sale

| Ref | Requirement |
|---|---|
| J-01 | **Voucher Redeem** screen for counter staff — camera QR scan or manual serial entry |
| J-02 | Optional **entrance gate** selection recorded against each redemption |
| J-03 | Strict one-time redemption; a second scan is rejected |
| J-04 | Clear rejection handling with distinct messages: Already Redeemed, Expired, Locked, Not Found, Invalid Signature |
| J-05 | Successful redemption displays product name, agent/company, serial and redemption timestamp |
| J-06 | Every scan attempt — successful or rejected — is written to the redemption audit log with staff user and timestamp |
| J-07 | QR payloads are HMAC-signed; forged or tampered codes are rejected |
| J-08 | Designed for repeated high-volume daily counter use — large touch targets, fast reset between scans |

### Module K — Becca Commission at POS ★

*Detailed in Section 4.*

### Module L — Complimentary Vouchers

| Ref | Requirement |
|---|---|
| L-01 | Admin grants complimentary (free) vouchers to an account |
| L-02 | Minimum grant quantity enforced (currently 20) |
| L-03 | Reason / justification captured against every grant |
| L-04 | Finance approval queue for complimentary grants — Pending / Approved / Rejected with remarks |
| L-05 | Approved grants generate vouchers identical in behaviour to purchased vouchers, flagged as source = Complimentary |
| L-06 | Complimentary vouchers are excluded from becca commission by default (configurable) |

### Module M — Announcements

| Ref | Requirement |
|---|---|
| M-01 | Announcements targeted to display location: **Home** (post-login popup) or **Login** (public login page) |
| M-02 | Audience targeting: Agent / Partner / Both |
| M-03 | Media upload — JPG or PDF |
| M-04 | Effective date and expiry date; status Active / Inactive / Expired |
| M-05 | Home-page popup on login plus an announcement feed on the agent dashboard |

### Module N — Reporting

All reports support user / company / date-range filters, quick search, paging, TOTAL rows,
and **Export to Excel**.

| Ref | Report | Purpose |
|---|---|---|
| N-01 | Transaction Report | All transactions in a period, summarised |
| N-02 | Transaction Details | Line-level transaction breakdown |
| N-03 | Purchase Summary | Purchases by account and period |
| N-04 | Purchase Details | Line-level purchase breakdown |
| N-05 | Top Purchase | Ranking of accounts by purchase value |
| N-06 | Voucher Issued | Vouchers issued, by account / order / product |
| N-07 | Ticket | Serial and QR search — locate any individual voucher |
| N-08 | Complimentary | Complimentary grants and their consumption |
| N-09 | Payment | Offline payments, their status and approval actors |
| N-10 | **Becca Commission** | Becca earned per agent / product / outlet / period (Section 4) |
| N-11 | **Becca Settlement** | Statements raised, paid and outstanding (Section 4) |
| N-12 | Agent-facing Purchase and Payment reports, scoped to the agent's own account only |

### Module O — Dashboards

| Ref | Requirement |
|---|---|
| O-01 | Admin dashboard — pending registrations, pending payments, vouchers issued, redemption volume, top accounts |
| O-02 | Agent dashboard — account status and expiry, orders in progress, vouchers available vs used, announcement feed |
| O-03 | Finance dashboard — payments awaiting verification, complimentary approvals pending |
| O-04 | Metric cards with period comparison and skeleton loading states |

### Module P — Platform, Security & Configuration

| Ref | Requirement |
|---|---|
| P-01 | Account-code login (`A20260001` / `P20260001`) for agents and partners; email login for internal roles |
| P-02 | JWT session management — short-lived access token plus refresh token, both in httpOnly cookies |
| P-03 | Password hashing with bcrypt; configurable complexity rules; forced change on first login |
| P-04 | Password reset via emailed link with expiry |
| P-05 | Role-based authorisation enforced on every API route |
| P-06 | Uploaded documents stored in private storage, served only through an authenticated download route |
| P-07 | Activity logging of privileged actions with actor, entity, timestamp |
| P-08 | Configurable email driver — SMTP in production, console logger in development |
| P-09 | Configuration screen for payment groups, payment types and system settings |
| P-10 | Built-in illustrated **user guide** accessible from inside the portal |

---

## 4. Becca Commission at POS — Detailed Specification

### 4.1 Definition

**Becca** is the agent's margin on a ticket: the gap between the price
at which the ticket is sold to the end customer at the point of sale and the nett scheme
price the agent paid the operator. The portal recognises becca **at the moment of
redemption**, not at the moment of purchase, so that commission is only earned on tickets
that are actually used.

```
Point-of-sale price          RM 100.00
Agent scheme (nett) price  − RM  75.00
─────────────────────────────────────
Becca (agent commission)      RM  25.00   ← recorded at redemption
```

### 4.2 Calculation modes

The system supports two calculation modes, selectable per product (or per scheme product):

| Mode | Becca basis | When to use |
|---|---|---|
| **Fixed rate** | Published walk-in / gate rate − agent scheme price | Standard products with one published public rate |
| **POS captured** | Actual price keyed at the counter − agent scheme price | Promotional or negotiated sales where the counter price varies |

A **walk-in rate** field is added to the product master to support Fixed-rate mode. In
POS-captured mode the counter operator enters the amount actually charged; the field is
validated against configurable floor and ceiling limits to prevent keying errors.

### 4.3 Settlement models

Settlement behaviour is a configuration setting, because it depends on who holds the cash:

| Model | Cash flow | System behaviour |
|---|---|---|
| **Operator-collected** | The customer pays the operator at the operator's counter. The operator owes the agent the becca. | Becca accrues as a payable. Statements are raised and settled through a payout run. |
| **Agent-collected** | The customer pays the agent at the agent's own counter, using vouchers the agent already paid for at nett. | Becca is reporting-only. No payout is generated; the agent has already retained the margin in cash. |
| **Per outlet** | Mixed operation — some counters operator-manned, some agent-manned. | Settlement model is set on the outlet; each redemption follows the model of the outlet it was redeemed at. |

### 4.4 Functional requirements

| Ref | Requirement |
|---|---|
| K-01 | Walk-in / gate rate maintained per product, with effective-dated history |
| K-02 | Becca calculation mode configurable per product: Fixed rate or POS captured |
| K-03 | Optional capture of the actual POS sell price on the redemption screen, with min/max validation |
| K-04 | On every successful redemption the system records: voucher serial, product, agent, outlet, entrance gate, staff user, timestamp, POS price, scheme price, **becca amount** |
| K-05 | Becca amounts are frozen at redemption time — later changes to product or scheme pricing never alter historical commission |
| K-06 | Settlement model configurable globally or per outlet (Operator-collected / Agent-collected / Per outlet) |
| K-07 | Complimentary vouchers carry zero becca by default; configurable per grant |
| K-08 | **Commission statement** generation per agent per period (weekly or monthly, matching the account's agreement type) |
| K-09 | Statement contents: redeemed voucher count, gross becca, adjustments, net payable, supporting line detail |
| K-10 | Manual adjustment lines on a statement (clawbacks, disputes, goodwill), each requiring a reason and an approver |
| K-11 | Statement lifecycle: **Draft → Issued → Finance Verified → Paid**, mirroring the existing two-actor Finance → Admin control |
| K-12 | Statement PDF and Excel export for sending to the agent |
| K-13 | Agent-facing **My Commission** screen — becca earned this period, statement history, payment status |
| K-14 | Becca Commission report — filterable by agent, product, outlet, entrance gate and date range, with Excel export |
| K-15 | Becca Settlement report — statements raised, paid and outstanding, with ageing |
| K-16 | Reconciliation view — redeemed vouchers with no statement line, and statement lines with no matching redemption |
| K-17 | Full audit trail on every statement transition and every adjustment |
| K-18 | Optional alternative to payout: credit net becca to the agent's account balance to offset their next purchase order |

### 4.5 Becca data captured per redemption

| Field | Description |
|---|---|
| Voucher serial | The redeemed voucher |
| Product | Ticket type redeemed |
| Agent / Partner | Account that owns the voucher |
| Outlet & entrance gate | Where it was redeemed |
| Staff user | Who processed the redemption |
| Redeemed at | Timestamp |
| POS sell price | Walk-in rate, or the price keyed at the counter |
| Scheme price | The nett price the agent paid |
| Becca amount | POS sell price − scheme price |
| Settlement model | The model in force at the time of redemption |
| Statement reference | Populated when the line is swept into a statement |

### 4.6 Controls

- Becca is recognised **only** on a successful, first-time redemption. Rejected scans create no commission.
- A voucher can contribute to exactly one commission line; duplicate accrual is prevented at the database level.
- Negative becca (scheme price above POS price) is blocked and flagged for review rather than silently accrued.
- Statements cannot be issued for periods that still contain unreconciled redemptions.
- Finance and Admin approvals on a statement must be performed by two different users.

---

## 5. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Availability** | Designed for 99.5% availability during park operating hours |
| **Performance** | Standard portal screens respond under 2 seconds; voucher scan-to-result under 1 second on counter hardware |
| **Scale** | Sized for tens of thousands of vouchers per month and hundreds of active agent accounts |
| **Security** | httpOnly cookie sessions, bcrypt password hashing, HMAC-signed QR payloads, private document storage, server-side role enforcement on every route, no secrets in the client bundle |
| **Audit** | Immutable audit trail on registrations, payments, redemptions and commission statements |
| **Data integrity** | Monetary values stored as fixed-precision decimals; no floating-point currency arithmetic |
| **Browsers** | Current Chrome, Edge, Safari and Firefox; counter screens tested on tablet |
| **Responsive** | All screens usable from 360px mobile width upward |
| **Localisation** | English interface; Malaysian date, currency and document conventions (KPL, SSM, MYR) |
| **Backup** | Nightly database backup with point-in-time recovery, retained per the agreed retention period |

---

## 6. Technical Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript (strict mode), Tailwind CSS |
| Backend | Next.js API routes → thin controllers → framework-free service layer |
| Database | PostgreSQL with Prisma ORM and versioned migrations |
| Authentication | Custom JWT (HS256 access + refresh tokens in httpOnly cookies), bcrypt |
| File storage | Private disk volume with an authenticated download route |
| Email | Pluggable driver — SMTP in production |
| Excel export | Server-side XLSX generation on every report endpoint |
| QR | HMAC-signed payloads rendered as QR data URLs |
| Deployment | Docker container with Docker Compose; deployable to the client's own infrastructure or a managed host |

All business logic lives in a framework-independent service layer, which keeps the system
testable and portable should the presentation framework change in future.

---

## 7. Deliverables

1. Deployed web application covering all modules in Sections 3 and 4
2. PostgreSQL database schema with migration scripts and seed data
3. Docker deployment package (`Dockerfile`, `compose.yaml`, environment template)
4. Deployment guide covering environment variables, secrets and first-run setup
5. Illustrated end-user guide, accessible from inside the portal, covering every role
6. Administrator handover session (remote or on-site, as agreed)
7. Source code handover to the client's repository
8. Warranty / defect-rectification period as stated in the quotation

---

## 8. Assumptions

1. The client provides SMTP credentials or an email service account for outbound mail.
2. The client provides hosting, domain and SSL certificate, or agrees to a hosted option quoted separately.
3. Walk-in / gate rates and scheme prices are supplied by the client as master data at project start.
4. Counter hardware has a working camera or an attached barcode scanner for voucher redemption.
5. Payment verification remains a manual finance process against bank statements; no bank API integration is assumed.
6. Content — terms and conditions, announcement artwork, email wording — is supplied by the client.
7. One production environment and one staging environment are in scope.

---

## 9. Out of Scope

The following are **not** included unless separately quoted:

- Online payment gateway / card acquiring integration
- Accounting system integration (SAP, AutoCount, Xero, etc.)
- Native mobile applications for iOS or Android
- Multi-language interface beyond English
- Migration of historical data from existing systems
- Third-party OTA marketplace integration beyond what is already implemented
- Hardware supply — scanners, tablets, printers, turnstiles
- Turnstile or access-control hardware integration
- 24/7 manned support (a support retainer can be quoted separately)

---

## 10. Implementation Phases

| Phase | Content | Exit criteria |
|---|---|---|
| **1. Foundations** | Environment setup, database schema, authentication, role framework, UI shell | Users can log in by role; skeleton navigation in place |
| **2. Onboarding** | Public registration wizard, document upload, approval queues, account creation, renewals | An agent can register and be approved end to end |
| **3. Commerce** | Outlets, products, purchase schemes, ticket purchase, cart, orders | An approved agent can place an order at scheme prices |
| **4. Financial control** | Offline payment submission, Finance verification, Admin approval, voucher generation | A paid order produces valid vouchers |
| **5. Point of sale** | Voucher redemption, QR scanning, gate capture, rejection handling | A voucher can be redeemed once and only once |
| **6. Becca commission** | Walk-in rates, becca capture at POS, statements, settlement workflow, commission reports | A period's redemptions produce a settled statement |
| **7. Reporting & polish** | Full report suite, Excel exports, dashboards, announcements, complimentary vouchers | All reports reconcile against source data |
| **8. UAT & handover** | Client acceptance testing, defect fixes, training, documentation, go-live | Signed acceptance |

---

## 11. Acceptance Criteria

The system is accepted when the following can be demonstrated end to end on the staging
environment:

1. A new agent registers online, uploads documents, is approved by Admin, receives credentials by email and logs in.
2. That agent purchases tickets at their bound scheme price, within min/max quantity limits.
3. The agent uploads a bank slip; Finance marks it Paid; Admin approves; vouchers are issued automatically.
4. A voucher is redeemed at the counter, is rejected on a second scan, and the redemption is visible in the audit log.
5. The redemption produces a becca commission line with the correct amount, frozen against later price changes.
6. A commission statement for the period is generated, verified by Finance, approved by Admin and exported.
7. All reports return correct totals and export to Excel without data loss.
8. Role boundaries hold — an agent cannot access another agent's data, and a staff user cannot reach admin functions, when tested directly against the API.

---

## 12. Items Requiring Client Confirmation

These affect configuration only, not scope or effort, and can be confirmed during Phase 1:

| # | Item | Options |
|---|---|---|
| 1 | Becca calculation basis | Fixed walk-in rate, POS-captured price, or configurable per product |
| 2 | Who operates the counter and collects the cash | Operator-collected, agent-collected, or mixed per outlet |
| 3 | Settlement method | Payout against statement, credit to account balance, or reporting only |
| 4 | Statement period | Weekly or monthly, per agreement type |
| 5 | Becca treatment for complimentary vouchers | Zero commission, or commission-bearing |
| 6 | Approval thresholds | Whether large statements require an additional approver |

---

*End of specification.*
