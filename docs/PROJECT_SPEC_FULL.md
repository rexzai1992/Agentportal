# Agent Portal — Full Project Specification

**Document type:** Complete Scope of Work / Functional Specification (quotation attachment)
**Product:** Agent Portal — B2B Travel Agent & Partner Ticketing Platform
**Version:** 1.0
**Date:** 14 September 2026
**Prepared for:** Client evaluation, quotation attachment and contractual scope baseline

> This document specifies **every module** of the platform in full detail — functional
> requirements, workflows, state machines, business rules, edge cases, screens, reports,
> configuration, controls and acceptance criteria. Every requirement carries a reference
> number so it can be used directly as a contractual scope schedule and as a UAT checklist.
>
> Commercial terms, man-days and price tables are covered separately in the quotation cover
> sheet. No pricing appears in this document.

---

## Table of Contents

| § | Section |
|---|---|
| 1 | Executive Summary |
| 2 | Solution Overview |
| 3 | Roles & Permission Matrix |
| 4 | Module 1 — Public Registration & Onboarding |
| 5 | Module 2 — Registration Approval |
| 6 | Module 3 — Account & User Management |
| 7 | Module 4 — Account Renewal |
| 8 | Module 5 — Outlets & Products |
| 9 | Module 6 — Purchase Schemes (Pricing) |
| 10 | Module 7 — Ticket Purchase |
| 11 | Module 8 — Offline Payment & Two-Actor Approval |
| 12 | Module 9 — Voucher Issuance & Delivery |
| 13 | Module 10 — Gate Redemption / Point of Sale |
| 14 | Module 11 — Becca Commission at POS |
| 15 | Module 12 — Complimentary Vouchers |
| 16 | Module 13 — Announcements |
| 17 | Module 14 — Reporting |
| 18 | Module 15 — Dashboards |
| 19 | Module 16 — Authentication & Security |
| 20 | Module 17 — Configuration & Master Data |
| 21 | Module 18 — Notifications |
| 22 | Module 19 — Audit & Activity Logging |
| 23 | Module 20 — In-Product Documentation |
| 24 | Module 21 — OTA Marketplace Integration (optional) |
| 25 | Cross-Cutting: State Machines |
| 26 | Non-Functional Requirements |
| 27 | Technical Architecture |
| 28 | Environments & Deployment |
| 29 | Deliverables |
| 30 | Implementation Phases |
| 31 | Acceptance Criteria |
| 32 | Assumptions |
| 33 | Out of Scope |
| 34 | Items for Client Confirmation |
| 35 | Appendices — Screen, Report, Email and Status Inventories |

---

## 1. Executive Summary

### 1.1 What the platform is

The Agent Portal is a complete B2B ticketing platform for theme-park and attraction
operators. Travel agents and corporate partners register online, are vetted and approved by
the operator, purchase attraction tickets wholesale under operator-defined pricing schemes,
pay by offline bank transfer, and receive serialised QR-coded vouchers that are redeemed by
gate staff at the point of sale — with the agent's commission (**becca**) calculated and
settled automatically.

### 1.2 What it replaces

| Manual process today | Replaced by |
|---|---|
| Agent applications by email, documents by WhatsApp | Self-service registration wizard with document upload and approval queues |
| Pricing negotiated per agent, held in spreadsheets | Versioned purchase schemes bound to accounts |
| Orders by email, confirmations by reply | Scheme-priced catalogue, cart and order references |
| Bank slips chased by phone | Structured payment submission with Finance verification |
| Paper or PDF vouchers, photocopied and reused | Serialised, HMAC-signed QR vouchers, one-time redemption |
| Commission reconciled by hand each month | Becca captured per redemption, statemented and settled |
| Management reporting assembled in Excel | 21 built-in reports, all exportable |

### 1.3 Business outcomes

| Outcome | Mechanism |
|---|---|
| Faster agent onboarding | Online registration, automated account creation and credential delivery |
| Pricing control per agent | Scheme binding with effective-dated revisions |
| Revenue protection at the gate | One-time redemption, signed QR, full rejection handling |
| Segregation of financial duty | Finance verifies, Admin approves — two different people, enforced server-side |
| Auditable agent margin | Becca frozen at redemption, traceable to voucher serial, gate and staff |
| Management visibility | Role-scoped dashboards and a full report suite with Excel export |
| Defensible audit trail | Immutable history on every approval, payment, redemption and commission event |

### 1.4 Scale of the specified system

| Dimension | Count |
|---|---|
| Functional modules | 21 |
| Numbered requirements | 400+ |
| Distinct user roles | 5 |
| Screens delivered | 95+ |
| Reports with Excel export | 21 |
| Workflow state machines | 8 |
| Automated email notifications | 18 |

---

## 2. Solution Overview

### 2.1 End-to-end business flow

```
Agent / Partner      Admin                 Agent / Partner     Finance             Admin                  Counter / POS
───────────────      ─────                 ───────────────     ───────             ─────                  ─────────────
Register online  →   Approve request   →   Buy tickets     →   Mark payment    →   Approve payment    →   Redeem voucher
+ upload KPL /       (account code +       + upload bank       as Paid             (vouchers issued        QR at the gate
SSM documents        temp password         transfer slip                           automatically)          + becca recorded
                     emailed)
                                                                                                                │
                                                                                                                ▼
                                                                            Admin ──▶ Finance ──▶ Admin ──▶ Finance
                                                                            Generate   Verify     Approve    Pay out
                                                                            commission statement            the becca
```

### 2.2 Module map

```
┌─ ONBOARDING ──────────────┐  ┌─ COMMERCE ────────────────┐  ┌─ FULFILMENT ──────────────┐
│ 1  Registration           │  │ 5  Outlets & Products     │  │ 9  Voucher Issuance       │
│ 2  Registration Approval  │  │ 6  Purchase Schemes       │  │ 10 Gate Redemption / POS  │
│ 3  Account & User Mgmt    │  │ 7  Ticket Purchase        │  │ 11 Becca Commission        │
│ 4  Account Renewal        │  │ 8  Offline Payment        │  │ 12 Complimentary Vouchers │
└───────────────────────────┘  └───────────────────────────┘  └───────────────────────────┘

┌─ ENGAGEMENT ──────────────┐  ┌─ INSIGHT ─────────────────┐  ┌─ PLATFORM ────────────────┐
│ 13 Announcements          │  │ 14 Reporting (21 reports) │  │ 16 Auth & Security        │
│ 18 Notifications          │  │ 15 Dashboards             │  │ 17 Configuration          │
│ 20 In-Product Docs        │  │                           │  │ 19 Audit & Activity Log   │
└───────────────────────────┘  └───────────────────────────┘  │ 21 OTA Integration (opt)  │
                                                              └───────────────────────────┘
```

### 2.3 Two account types

The platform serves two commercially distinct party types through one codebase:

| | Agent | Partner |
|---|---|---|
| Who | Licensed travel agency | Corporate, institutional or reseller partner |
| Account code series | `A20260001` | `P20260001` |
| Registration queue | Agent Requests | Partner Requests |
| Licensing documents | KPL licence + SSM | SSM (KPL optional) |
| Announcement audience | Agent | Partner |
| Scheme binding | Independent | Independent |
| Portal screens | Identical | Identical |

---

## 3. Roles & Permission Matrix

### 3.1 Roles

| Role | Who | Core responsibility |
|---|---|---|
| **Admin** | Operator's commercial / ticketing team | Approve accounts, define products and schemes, approve payments, issue complimentary tickets, generate commission statements, publish announcements, run all reports |
| **Agent** | Travel agency account user | Register, purchase, pay, download vouchers, view own commission and reports |
| **Partner** | Corporate partner account user | Same capability set as Agent, separate queues and codes |
| **Finance** | Operator's finance team | Verify bank slips, mark payments Paid, verify commission statements, record payouts, approve complimentary grants |
| **Staff** | Gate / counter operator | Scan and redeem vouchers, capture gate and POS price |

### 3.2 Permission matrix

Legend: ● full · ◐ own records only · ○ none

| Capability | Admin | Agent / Partner | Finance | Staff |
|---|:---:|:---:|:---:|:---:|
| Submit registration | ○ | public | ○ | ○ |
| Approve / reject registration | ● | ○ | ○ | ○ |
| Manage accounts and users | ● | ◐ profile view | ○ | ○ |
| Approve renewals | ● | ◐ submit | ○ | ○ |
| Manage outlets and products | ● | ○ | ○ | ○ |
| Manage purchase schemes | ● | ○ | ○ | ○ |
| Bind scheme to account | ● | ○ | ○ | ○ |
| Place a purchase order | ○ | ◐ | ○ | ○ |
| Submit offline payment | ○ | ◐ | ○ | ○ |
| Mark payment Paid | ○ | ○ | ● | ○ |
| Approve payment → issue vouchers | ● | ○ | ○ | ○ |
| View vouchers | ● | ◐ | ● | ● |
| Redeem voucher at gate | ○ | ○ | ○ | ● |
| Maintain walk-in rates | ● | ○ | ○ | ○ |
| View becca commission lines | ● | ◐ | ● | config |
| Generate commission statement | ● | ○ | ○ | ○ |
| Verify commission statement | ○ | ○ | ● | ○ |
| Approve commission statement | ● | ○ | ○ | ○ |
| Record commission payout | ○ | ○ | ● | ○ |
| Raise statement dispute | ○ | ◐ | ○ | ○ |
| Grant complimentary vouchers | ● | ○ | ○ | ○ |
| Approve complimentary grant | ○ | ○ | ● | ○ |
| Publish announcements | ● | ○ | ○ | ○ |
| System configuration | ● | ○ | ○ | ○ |
| All reports | ● | ◐ own | ● finance set | ◐ gate set |
| Audit log access | ● | ○ | ● | ○ |

| Ref | Requirement |
|---|---|
| ROLE-01 | Every permission in this matrix is enforced **server-side on every request**, not only by hiding menu items |
| ROLE-02 | A user holds exactly one role; role changes are audited |
| ROLE-03 | Agent and Partner users are scoped to their own account; cross-account access is impossible through any route |
| ROLE-04 | Direct API access by an unauthorised role returns a refusal, tested as an acceptance criterion |
| ROLE-05 | Navigation is role-aware — users see only what they may use |

---

## 4. Module 1 — Public Registration & Onboarding

### 4.1 Purpose

Allow prospective agents and partners to apply online without operator involvement, capture
everything the operator needs to vet them, and give the applicant a way to track progress.

### 4.2 The wizard

```
Step 1              Step 2              Step 3              Step 4              Submit
──────              ──────              ──────              ──────              ──────
Company             Document            Contact             Business            T&C accept
information         upload              persons             background          → Application ID
```

| Ref | Requirement |
|---|---|
| REG-01 | Public, unauthenticated 4-step registration wizard |
| REG-02 | Separate entry points for **Agent** and **Partner** applications |
| REG-03 | Step indicator showing current position and completion state |
| REG-04 | Forward and backward navigation with all entered data retained |
| REG-05 | Per-step validation — the applicant cannot advance with invalid or missing mandatory data |
| REG-06 | Terms & Conditions must be accepted before submission is enabled |
| REG-07 | On submission the system generates a unique **Application ID** and displays it |
| REG-08 | Confirmation email containing the Application ID sent to the applicant |
| REG-09 | Duplicate application detection on company registration number and email, with a clear message |

### 4.3 Step 1 — Company information

| Field | Type | Rule |
|---|---|---|
| Company name | Text | Mandatory |
| Company registration number (SSM) | Text | Mandatory, format validated |
| KPL licence number | Text | Mandatory for Agent, optional for Partner |
| KPL expiry date | Date | Mandatory where KPL supplied; must be a future date |
| Office telephone | Text | Mandatory, format validated |
| Fax | Text | Optional |
| Company email | Email | Mandatory, format validated, used for credential delivery |
| Address line 1 | Text | Mandatory |
| Address line 2 / 3 | Text | Optional |
| Postcode | Text | Mandatory, format validated |
| City / State | Select | Mandatory, from a maintained list |
| Country | Select | Mandatory, defaults to Malaysia |

### 4.4 Step 2 — Document upload

| Ref | Requirement |
|---|---|
| REG-10 | Upload of **KPL licence** document — mandatory for Agent applications |
| REG-11 | Upload of **SSM company registration** document — mandatory for both types |
| REG-12 | Additional supporting documents — optional, multiple |
| REG-13 | Accepted formats PDF, JPG, PNG; maximum file size configurable |
| REG-14 | Client-side format and size validation with a clear error message before upload begins |
| REG-15 | Upload progress indicator; individual files can be removed and replaced |
| REG-16 | Uploaded files are stored in private storage and are never publicly addressable |
| REG-17 | Server-side file type verification — the declared extension alone is not trusted |

### 4.5 Step 3 — Contact persons

| Ref | Requirement |
|---|---|
| REG-18 | One or more contact persons per application; add and remove rows dynamically |
| REG-19 | Per contact: full name, designation, email, mobile number |
| REG-20 | At least one contact is mandatory |
| REG-21 | One contact is flagged as primary — this contact receives the portal credentials on approval |
| REG-22 | Email and mobile format validation per row |

### 4.6 Step 4 — Business background

| Ref | Requirement |
|---|---|
| REG-23 | Target market — free text describing the applicant's customer base |
| REG-24 | Sales channel — how the applicant sells (counter, online, groups, inbound, corporate) |
| REG-25 | Estimated monthly volume — optional, informs scheme assignment |
| REG-26 | Additional remarks — free text |

### 4.7 Application status tracking

| Ref | Requirement |
|---|---|
| REG-27 | Public **Application Status** page requiring no login |
| REG-28 | Applicant enters their Application ID to retrieve status |
| REG-29 | Statuses shown: **Pending**, **Approved**, **Rejected**, **Revision Required** |
| REG-30 | Admin remarks are displayed with Rejected and Revision Required statuses |
| REG-31 | Where revision is required, the applicant can reopen the wizard, correct the flagged items and resubmit |
| REG-32 | Resubmission retains the original Application ID and appends to its history |
| REG-33 | Rate limiting on status lookups to prevent enumeration of Application IDs |

### 4.8 Registration state machine

```
                ┌──────────────────────────────────┐
                │                                  │
   SUBMITTED ──▶ PENDING ──approve──▶ APPROVED ──▶ account created
                   │                               + credentials emailed
                   ├──reject──▶ REJECTED (terminal)
                   │
                   └──revise──▶ REVISION ──resubmit──┘
```

### 4.9 Business rules

| Ref | Rule |
|---|---|
| REG-34 | An Application ID is unique and permanent for the life of the application |
| REG-35 | Approval is the **only** path that creates a portal account |
| REG-36 | A rejected application is terminal; the applicant must submit a fresh application |
| REG-37 | Revision cycles are unlimited and every cycle is retained in history |
| REG-38 | Uploaded documents are carried forward to the account record on approval |
| REG-39 | An application in Approved state cannot be re-approved or re-decided |

---

## 5. Module 2 — Registration Approval

### 5.1 Purpose

Give the operator a controlled, auditable queue for vetting applicants, with the account and
credentials created automatically on approval so no manual account setup is needed.

| Ref | Requirement |
|---|---|
| APR-01 | Separate **Agent Requests** and **Partner Requests** queues |
| APR-02 | Queue columns: Application ID, company name, submission date, status, age in days |
| APR-03 | Filter by status and date range; free-text search on company name and Application ID |
| APR-04 | Sortable columns and paging |
| APR-05 | Ageing indicator highlighting applications awaiting decision beyond a configurable threshold |
| APR-06 | Application detail view showing every submitted field across all four wizard steps |
| APR-07 | Contact person list displayed in full |
| APR-08 | Document list with secure in-browser preview and download through an authenticated route |
| APR-09 | Decision actions: **Approve**, **Reject**, **Request Revision** |
| APR-10 | Remarks are mandatory on Reject and Request Revision |
| APR-11 | Remarks are optional but supported on Approve |
| APR-12 | Confirmation prompt before any decision is committed |
| APR-13 | Approval history panel showing every decision, actor, timestamp and remark |

### 5.2 What approval does automatically

| Ref | Requirement |
|---|---|
| APR-14 | Creates the account record from the application data |
| APR-15 | Allocates the next sequential **account code** — `A` series for agents, `P` series for partners, year-prefixed |
| APR-16 | Creates the primary portal user against the primary contact person |
| APR-17 | Generates a secure temporary password |
| APR-18 | Emails the account code and temporary password to the primary contact |
| APR-19 | Sets the temporary password to expire in **24 hours** |
| APR-20 | Flags the user for forced password change on first login |
| APR-21 | Sets the initial account status to Active and applies the default account expiry period |
| APR-22 | Transfers the uploaded documents to the account record |
| APR-23 | Writes the full approval event to the audit log |

### 5.3 Business rules

| Ref | Rule |
|---|---|
| APR-24 | Account codes are sequential, unique and never reused |
| APR-25 | Approval is atomic — either the account, user, code and email all succeed, or none are committed |
| APR-26 | If credential delivery fails, the admin is alerted and can resend without re-approving |
| APR-27 | Temporary password resend is available from the account screen at any time |
| APR-28 | Approving an application already decided is refused |

---

## 6. Module 3 — Account & User Management

| Ref | Requirement |
|---|---|
| ACC-01 | **Active Agents** and **Active Partners** listings, separately navigable |
| ACC-02 | Listing columns: account code, company name, status, expiry date, scheme bindings, last activity |
| ACC-03 | Filter by status, expiry window, scheme and agreement type; free-text search |
| ACC-04 | Account detail view — company information, address, licensing data, business background |
| ACC-05 | Contact persons tab — add, edit, remove, change primary |
| ACC-06 | Documents tab — view, download, upload replacements, with version history |
| ACC-07 | Users tab — portal users under the account, with create, disable and reset-password actions |
| ACC-08 | Schemes tab — current scheme bindings, binding type and effective dates |
| ACC-09 | Activity tab — chronological log of everything done to and by the account |
| ACC-10 | Account status control: **Active / Inactive / Expired**, with mandatory reason on change |
| ACC-11 | Account expiry date, editable by Admin with reason |
| ACC-12 | Agreement type: **Prepaid / Weekly / Monthly** — drives commission statement frequency |
| ACC-13 | Commission settings per account — settlement method and statement period override |
| ACC-14 | Admin-initiated password reset issuing a fresh temporary password |
| ACC-15 | Account-level notes visible only to operator staff |

### 6.1 Account status effects

| Status | Login | Purchase | Redeem existing vouchers | Becca accrual |
|---|:---:|:---:|:---:|:---:|
| **Active** | Yes | Yes | Yes | Yes |
| **Inactive** | Yes | **No** | Yes | Yes |
| **Expired** | Yes | **No** | Yes | Yes |

| Ref | Rule |
|---|---|
| ACC-16 | An inactive or expired account retains login so the agent can still view vouchers and reports |
| ACC-17 | Purchase is blocked with a clear on-screen explanation and a link to renewal |
| ACC-18 | Vouchers already issued remain fully valid and redeemable — the agent has paid for them |
| ACC-19 | Becca continues to accrue on redemption of vouchers bought while the account was active |
| ACC-20 | Accounts pass automatically to Expired when the expiry date is reached |

### 6.2 Agent-facing profile

| Ref | Requirement |
|---|---|
| ACC-21 | View-only company profile showing all registered details |
| ACC-22 | Contact person list, view-only |
| ACC-23 | Document list with download |
| ACC-24 | Account status and expiry date displayed prominently |
| ACC-25 | Change-request path — the agent raises amendments through renewal or by contacting the operator; direct self-editing of vetted data is not permitted |

---

## 7. Module 4 — Account Renewal

| Ref | Requirement |
|---|---|
| REN-01 | Renewal becomes available to the agent **2 months before** account expiry — configurable |
| REN-02 | Renewal availability is signalled on the agent dashboard with a countdown |
| REN-03 | Renewal form pre-filled with current account data for amendment |
| REN-04 | Upload of renewed KPL licence and any other expiring documents |
| REN-05 | Updated contact persons captured as part of renewal |
| REN-06 | Submission creates a renewal request with its own reference |
| REN-07 | Admin **Account Renewal** queue with filter, search and ageing |
| REN-08 | Renewal detail view showing current values against proposed values, differences highlighted |
| REN-09 | Decisions: **Approve**, **Reject**, **Request Revision**, with mandatory remarks on the latter two |
| REN-10 | Approval extends the account expiry by the configured renewal term |
| REN-11 | Approval applies the amended company data and documents to the account |
| REN-12 | Approval restores purchasing rights to an expired account |
| REN-13 | Email notification to the agent on submission, revision, approval and rejection |
| REN-14 | Renewal history retained per account |
| REN-15 | Only one renewal request may be open per account at a time |
| REN-16 | Automated reminder emails at configurable intervals before expiry |

---

## 8. Module 5 — Outlets & Products

### 8.1 Outlets

| Ref | Requirement |
|---|---|
| OUT-01 | Outlet master with unique code and name |
| OUT-02 | Description and full address |
| OUT-03 | Banking details — bank name, account name, account number — used on payment instructions |
| OUT-04 | Active / inactive flag |
| OUT-05 | Becca settlement model per outlet (see Module 11) |
| OUT-06 | Entrance gate list per outlet, maintained as configuration |
| OUT-07 | Products belong to an outlet; multi-outlet operation is supported from day one |
| OUT-08 | An outlet with products or historical transactions cannot be deleted, only deactivated |

### 8.2 Products (ticket types)

| Field | Description |
|---|---|
| Name | Display name in the agent catalogue |
| SKU | Unique stock-keeping code |
| Description | Long description shown in the catalogue |
| Image | Product image used in the catalogue |
| Category | Adult / Child / Bundle |
| Outlet | Owning outlet |
| Selling price | Standard published price |
| Walk-in rate | Published gate rate, effective-dated (Module 11) |
| Cost price | Operator's internal cost |
| Validity type | Same-day / Fixed date / Date range |
| Validity period | Days or explicit dates, per validity type |
| Becca calculation mode | Fixed rate / POS captured / Fixed amount / Percentage |
| POS price floor and ceiling | Validation bounds for counter price entry |
| Active flag | Controls catalogue visibility |

| Ref | Requirement |
|---|---|
| PRD-01 | Full product master maintenance — create, edit, deactivate |
| PRD-02 | Product image upload with preview |
| PRD-03 | Unique SKU enforced |
| PRD-04 | Product listing with filter by outlet, category and status; free-text search; paging |
| PRD-05 | **Bulk product creation** — create a batch of products in one operation with shared attributes |
| PRD-06 | **Product import** from spreadsheet with a downloadable template |
| PRD-07 | Import validation report — row-by-row, showing accepted rows and the exact reason for each rejection |
| PRD-08 | Import is all-or-nothing per file, or per-row with an explicit partial-accept confirmation |
| PRD-09 | Products in use by a scheme or with issued vouchers cannot be deleted, only deactivated |
| PRD-10 | Deactivating a product removes it from the catalogue but leaves existing vouchers fully valid |
| PRD-11 | Product change audit — who changed which field, from what to what, when |

### 8.3 Validity types

| Type | Meaning | Voucher effect |
|---|---|---|
| **Same-day** | Valid only on the day of issue or a nominated visit date | Effective date = expiry date |
| **Fixed date** | Valid on one specific calendar date | Effective and expiry set to that date |
| **Date range** | Valid across a window | Effective and expiry span the window |

| Ref | Rule |
|---|---|
| PRD-12 | Validity type determines the effective and expiry dates stamped on every voucher at issuance |
| PRD-13 | Validity is evaluated at redemption against the redemption date |
| PRD-14 | Changing a product's validity type never alters vouchers already issued |

---

## 9. Module 6 — Purchase Schemes (Pricing)

### 9.1 Purpose

A scheme is the operator's commercial offer to a group of accounts: which products they may
buy, at what price, in what quantities, with what incentives. Schemes are versioned so that
price history is preserved and historical orders remain correctly valued forever.

### 9.2 Scheme structure

```
SCHEME  (code, name, organisation, status)
  │
  ├── REVISION 1  effective 01 Jan 2026
  │     ├── Product A   RM 75.00   min 10  max 500   incentive 2%
  │     ├── Product B   RM 55.00   min 10  max 500   incentive 2%
  │     └── Product C   RM 180.00  min  1  max 100   discount 5%
  │
  ├── REVISION 2  effective 01 Apr 2026
  │     └── … revised product set and prices
  │
  └── ASSIGNMENTS
        ├── A20260001  binding STANDARD
        ├── A20260007  binding SPECIAL   incentive note "Volume tier 2"
        └── P20260003  binding STANDARD
```

| Ref | Requirement |
|---|---|
| SCH-01 | Scheme master — unique code, name, description, organisation, Active / Inactive status |
| SCH-02 | Scheme listing with filter, search and paging |
| SCH-03 | A scheme contains one or more **revisions**, each with a revision number and an effective date |
| SCH-04 | Each revision holds a product set with per-product price, minimum quantity, maximum quantity, optional incentive rate and optional discount rate |
| SCH-05 | Creating a new revision clones the previous revision's product set as the starting point |
| SCH-06 | Revisions may be future-dated and take effect automatically on their effective date |
| SCH-07 | Revision comparison view showing what changed between two revisions |
| SCH-08 | A revision that has been used by a purchase order becomes immutable |
| SCH-09 | Scheme assignment to accounts in two tabs: **Standard** and **Special** |
| SCH-10 | Per-assignment incentive note |
| SCH-11 | Assignment effective date |
| SCH-12 | An account may hold multiple scheme bindings; the catalogue presents the union of their products |
| SCH-13 | Where the same product appears in more than one bound scheme, the configured precedence rule applies (lowest price by default) |
| SCH-14 | Bulk assignment of a scheme to many accounts at once |
| SCH-15 | Unassignment, with existing orders and vouchers unaffected |
| SCH-16 | Scheme audit — revision creation, price changes, assignment and unassignment |

### 9.3 Business rules

| Ref | Rule |
|---|---|
| SCH-17 | An agent sees **only** products in their bound schemes, at their bound prices |
| SCH-18 | An order is stamped with the exact scheme revision in force at the moment of ordering |
| SCH-19 | A later revision never re-prices an existing order, voucher or commission line |
| SCH-20 | Minimum and maximum quantities are enforced at cart level and re-validated at submission |
| SCH-21 | Incentive and discount rates are applied at line level and shown separately in the order summary |
| SCH-22 | Deactivating a scheme removes it from the catalogue but leaves history intact |
| SCH-23 | An account with no bound scheme sees an empty catalogue with an explanatory message |

---

## 10. Module 7 — Ticket Purchase

### 10.1 Catalogue and cart

| Ref | Requirement |
|---|---|
| PUR-01 | Scheme-priced product catalogue with image, name, category, description and price |
| PUR-02 | Filter by outlet and category; free-text search |
| PUR-03 | Quantity controls enforcing the per-product minimum and maximum from the scheme |
| PUR-04 | Immediate inline message when a quantity breaches min or max |
| PUR-05 | Add to cart, update quantity, remove line, clear cart |
| PUR-06 | Cart persists across sessions until submitted or cancelled |
| PUR-07 | Live order summary — subtotal, incentive total, discount total, **total payable** |
| PUR-08 | Per-line display of unit price, quantity and line total |
| PUR-09 | Order review step before submission |
| PUR-10 | Submission generates a unique **Order Reference** |
| PUR-11 | Order confirmation screen with payment instructions and the operator's bank details |

### 10.2 Incomplete orders

| Ref | Requirement |
|---|---|
| PUR-12 | **Incomplete Orders** screen listing all draft orders |
| PUR-13 | Resume a draft — reopens the cart with contents intact |
| PUR-14 | Cancel a draft with confirmation |
| PUR-15 | Draft age displayed; configurable automatic expiry of stale drafts |

### 10.3 Order state machine

```
  DRAFT ──submit──▶ PENDING PAYMENT ──payment submitted──▶ PENDING APPROVAL
    │                     │                                      │
    │                     │                          ┌───────────┼───────────┐
    │                     │                     approve       reject     revise
    │                     │                          │           │           │
    │                     │                          ▼           ▼           ▼
    │                     │                  ORDER CONFIRMED  REJECTED   REVISION
    │                     │                  + vouchers issued            │
    │                     │                                              │
    └──cancel──▶ CANCELLED ◀───────────cancel─────────────────────────────┘
```

| State | Meaning | Agent can | Vouchers |
|---|---|---|---|
| **Draft** | Cart saved, not submitted | Resume, cancel | None |
| **Pending Payment** | Submitted, awaiting payment submission | Submit payment, cancel | None |
| **Pending Approval** | Payment submitted, in the approval chain | View only | None |
| **Order Confirmed** | Payment approved | View vouchers | **Issued** |
| **Rejected** | Payment rejected | View remarks, resubmit payment | None |
| **Revision** | Correction requested | Amend and resubmit | None |
| **Cancelled** | Withdrawn | View only | None |

### 10.4 Business rules

| Ref | Rule |
|---|---|
| PUR-16 | Purchase is blocked for Inactive and Expired accounts, with an explanatory message and a renewal link |
| PUR-17 | Prices, min and max are re-validated server-side at submission; a scheme change between cart and submit is surfaced to the agent rather than silently applied |
| PUR-18 | Order references are unique and never reused |
| PUR-19 | An order cannot be edited once submitted; corrections go through the Revision path |
| PUR-20 | Vouchers are issued **only** on Admin approval of the linked payment — never at order placement |
| PUR-21 | A cancelled order cannot be revived; the agent places a new order |

### 10.5 Transaction review

| Ref | Requirement |
|---|---|
| PUR-22 | Transaction review screen addressable by order reference |
| PUR-23 | Shows order header, all line items, all totals, current status and status history |
| PUR-24 | Shows linked payment submissions and their status |
| PUR-25 | Shows issued vouchers where the order is confirmed |
| PUR-26 | Printable / exportable order summary |

---

## 11. Module 8 — Offline Payment & Two-Actor Approval

### 11.1 Purpose

Control the money path. The agent pays by bank transfer; Finance verifies the money actually
arrived; only then may Admin release the vouchers. Two different people must act.

### 11.2 Agent submission

| Ref | Requirement |
|---|---|
| PAY-01 | Payment submission against one or more purchase orders |
| PAY-02 | Order selection list showing outstanding orders and their amounts |
| PAY-03 | Capture: amount paid, payment group, payment type, bank name, bank reference number, payment date |
| PAY-04 | **Bank slip upload** — PDF, JPG or PNG, mandatory |
| PAY-05 | Amount reconciliation indicator — submitted amount against selected order total, with over- and under-payment flagged |
| PAY-06 | Remarks field for the agent |
| PAY-07 | Submission confirmation with a payment reference |
| PAY-08 | Payment history screen showing every submission, its status and the approval trail |

### 11.3 Finance verification

| Ref | Requirement |
|---|---|
| PAY-09 | Finance queue of payments awaiting verification, with ageing |
| PAY-10 | Detail view with full payment data, linked orders and the bank slip preview |
| PAY-11 | Slip preview popup with zoom and download |
| PAY-12 | **Mark Payment Paid** action, confirming funds received |
| PAY-13 | **Reject** and **Request Revision** with mandatory remarks |
| PAY-14 | Filter by date, account, amount range and payment type |
| PAY-15 | Finance cannot approve the payment for voucher release — only mark it Paid |

### 11.4 Admin approval

| Ref | Requirement |
|---|---|
| PAY-16 | Admin queue of payments already marked Paid by Finance |
| PAY-17 | Payments **not** marked Paid by Finance are not approvable — enforced server-side, not merely hidden |
| PAY-18 | Approval releases the vouchers for every linked order automatically |
| PAY-19 | **Reject** and **Request Revision** with mandatory remarks |
| PAY-20 | Approval confirmation showing exactly how many vouchers will be generated, before commit |
| PAY-21 | The same user cannot both mark Paid and approve — enforced server-side |

### 11.5 Payment state machine

```
   SUBMITTED ──▶ PENDING APPROVAL ──finance marks paid──▶ FINANCE PAID
                       │                                      │
                       │                            ┌─────────┼─────────┐
                       │                       approve     reject    revise
                       │                            │         │         │
                       │                            ▼         ▼         ▼
                       │                    ORDER CONFIRMED REJECTED REVISION
                       │                    + vouchers issued          │
                       └──reject / revise───────────────────────────────┘
```

| Ref | Requirement |
|---|---|
| PAY-22 | Complete payment status history — from-status, to-status, actor, timestamp, remarks |
| PAY-23 | History is immutable and visible to Admin, Finance and the owning agent |
| PAY-24 | One payment may settle multiple orders; one order may be settled by multiple payments |
| PAY-25 | Payment group and payment type maintained as configurable master data |
| PAY-26 | Email notification to the agent on marked-paid, approved, rejected and revision |
| PAY-27 | Voucher generation is atomic — either every voucher for the approved orders is created, or none is |

---

## 12. Module 9 — Voucher Issuance & Delivery

| Ref | Requirement |
|---|---|
| VCH-01 | On payment approval, exactly one voucher record is created per ticket purchased |
| VCH-02 | Each voucher carries a unique, non-sequential-guessable **serial number** |
| VCH-03 | Each voucher carries an **HMAC-signed QR payload** — forged or tampered codes are rejected at the gate |
| VCH-04 | Effective date and expiry date stamped per the product's validity type |
| VCH-05 | Redeem status: **New / Locked / Redeemed / Expired** |
| VCH-06 | Voucher traceability to its source purchase order or complimentary grant |
| VCH-07 | Agent **Voucher Issued** screen grouped by order, showing issued / used / available counts |
| VCH-08 | Voucher list per order with serial, product, validity, status and redemption timestamp |
| VCH-09 | Voucher detail view with printable QR code and serial |
| VCH-10 | Bulk download of vouchers for an order as a print-ready file |
| VCH-11 | Voucher list export to Excel |
| VCH-12 | Search by serial number across an account |
| VCH-13 | Admin-wide voucher search by serial or QR across all accounts |
| VCH-14 | **Lock** action — an admin may lock a voucher to block redemption pending investigation, with a reason |
| VCH-15 | **Unlock** action restoring the voucher to New, with a reason |
| VCH-16 | Automatic transition to Expired when the expiry date passes |

### 12.1 Voucher state machine

```
   NEW ──redeem at gate──▶ REDEEMED (terminal)
    │
    ├──admin lock──▶ LOCKED ──admin unlock──▶ NEW
    │
    └──expiry date passes──▶ EXPIRED (terminal)
```

| Ref | Rule |
|---|---|
| VCH-17 | Only a voucher in **New** state may be redeemed |
| VCH-18 | Redemption is one-time and irreversible through the application |
| VCH-19 | A locked voucher is rejected at the gate with a distinct message |
| VCH-20 | An expired voucher is rejected at the gate with a distinct message |
| VCH-21 | Serial numbers and QR tokens are globally unique across the whole system |
| VCH-22 | Vouchers survive account deactivation and expiry — the agent already paid for them |

---

## 13. Module 10 — Gate Redemption / Point of Sale

### 13.1 Counter operation

| Ref | Requirement |
|---|---|
| POS-01 | **Voucher Redeem** screen designed for repeated high-volume daily use |
| POS-02 | Camera QR scanning with automatic detection |
| POS-03 | Manual serial number entry as a fallback |
| POS-04 | Support for an attached hardware barcode scanner operating as keyboard input |
| POS-05 | Entrance gate selection, remembered for the session |
| POS-06 | Large touch targets and high-contrast result display, usable on a counter tablet |
| POS-07 | Fast automatic reset between scans — no extra taps required to process the next guest |
| POS-08 | Scan-to-result under 1 second on target hardware |
| POS-09 | Audible and visual success / failure feedback |
| POS-10 | Legacy retail scanner screen and ticket list retained for existing operations |

### 13.2 Redemption outcomes

| Outcome | Cause | Counter message |
|---|---|---|
| **Valid** | New voucher, within validity | Admitted — product, company, serial, timestamp shown |
| **Already redeemed** | Previously redeemed | Rejected — shows when and at which gate it was first used |
| **Expired** | Past expiry date | Rejected — shows the expiry date |
| **Locked** | Administratively locked | Rejected — advises the guest to see the counter supervisor |
| **Not found** | Serial does not exist | Rejected |
| **Invalid signature** | QR forged or tampered | Rejected and flagged as a security event |

| Ref | Requirement |
|---|---|
| POS-11 | Each outcome has a visually distinct result state; no ambiguous messages |
| POS-12 | Successful redemption displays product name, owning company, serial and timestamp |
| POS-13 | Every scan attempt — successful or rejected — is written to the redemption audit log |
| POS-14 | The audit record captures voucher, outcome, gate, staff user and timestamp |
| POS-15 | Invalid-signature events are additionally raised as security alerts |
| POS-16 | Redemption history viewable per voucher |

### 13.3 Group and batch handling

| Ref | Requirement |
|---|---|
| POS-17 | Batch redemption of multiple vouchers in one counter transaction for coach and group arrivals |
| POS-18 | Running count of scanned, accepted and rejected within the batch |
| POS-19 | A failed voucher inside a batch is identified individually; the operator may continue with the remainder |
| POS-20 | Batch reference recorded against every redemption in the batch |
| POS-21 | Batch summary at completion |

### 13.4 Resilience

| Ref | Requirement |
|---|---|
| POS-22 | Where the commission write fails, the redemption still succeeds and is queued for reconciliation |
| POS-23 | Guests are never turned away because of a pricing, commission or reporting fault |
| POS-24 | Network interruption produces a clear retry state rather than an ambiguous failure |
| POS-25 | Duplicate submission protection — a double-tap cannot produce two redemptions |

---

## 14. Module 11 — Becca Commission at POS

> A standalone, expanded version of this module is available as
> `docs/BECCA_COMMISSION_SPEC.md` for use where the commission scope is quoted separately.

### 14.1 Definition

**Becca** is the agent's margin — the gap between the price the ticket is
sold for at the point of sale and the nett scheme price the agent paid the operator.

```
Point-of-sale price            RM 100.00     ← what the end customer pays
Agent scheme (nett) price    − RM  75.00     ← what the agent paid the operator
──────────────────────────────────────────
Becca (agent commission)        RM  25.00
```

### 14.2 Core principle — earned at redemption, not at purchase

An agent may buy 500 vouchers and sell only 380. Commission is recognised at the moment a
voucher is **actually redeemed at the counter**. Unused vouchers simply never earn becca, and
no clawback mechanism is required. This single rule removes the most common source of
agent–operator commission disputes.

### 14.3 Calculation modes

| Mode | Formula | Counter behaviour | Use |
|---|---|---|---|
| **Fixed rate** | Walk-in rate − scheme price | No price entry | Standard tickets with one published gate rate |
| **POS captured** | Price keyed at counter − scheme price | Operator keys the price charged | Promotional or negotiated pricing |
| **Fixed amount** | Flat ringgit amount per ticket | No price entry | Flat-commission arrangements |
| **Percentage** | POS price × commission % | No price entry | Percentage-commission arrangements |

| Ref | Requirement |
|---|---|
| BEC-01 | Calculation mode set per product, overridable per scheme product for a specific agent arrangement |
| BEC-02 | All four modes supported so the operator is not forced into one commercial structure |

### 14.4 Walk-in rate management

| Ref | Requirement |
|---|---|
| BEC-03 | Walk-in (published gate) rate maintained per product |
| BEC-04 | Rates are **effective-dated** — start date and optional end date |
| BEC-05 | Rate history retained; a change creates a new record, never an overwrite |
| BEC-06 | Becca resolves the rate in force **on the redemption date** |
| BEC-07 | Future-dated rates can be entered in advance, e.g. school-holiday pricing |
| BEC-08 | Bulk rate update across selected products with a common effective date |
| BEC-09 | Rate change audit — actor, before value, after value, timestamp |
| BEC-10 | Walk-in rate editing is a distinct permission, separate from general product editing |

### 14.5 Price resolution rules

| Input | Resolution rule |
|---|---|
| POS sell price | Walk-in rate effective on the **redemption** date, or the price keyed at the counter |
| Scheme price | The price on the **exact scheme revision the voucher was purchased under** — never the current price |

**Worked example — historical price protection**

```
Voucher purchased   12 Jan 2026 under SCH-A revision 3 @ RM 75.00
Revision 5          effective 01 Mar 2026 raises the price to RM 82.00
Walk-in rate        RM 100.00 throughout
Voucher redeemed    18 Jun 2026
──────────────────────────────────────────────────────────────────
Becca applied        RM 100.00 − RM 75.00 = RM 25.00   ← revision 3, not revision 5
```

### 14.6 Settlement models

| Model | Cash flow | System behaviour |
|---|---|---|
| **Operator-collected** | Customer pays the operator at the park counter; the operator owes the agent the becca | Becca accrues as a payable; statements raised and settled |
| **Agent-collected** | Customer pays the agent at the agent's own counter using pre-bought vouchers; the agent keeps the becca in cash | Reporting and reconciliation only; no payout |
| **Per outlet** | Mixed operation — some counters operator-manned, some agent-manned | Model set on the outlet; each line records the model in force at its own redemption |

**Settlement methods under the operator-collected model**

| Method | Behaviour |
|---|---|
| Cash payout | Statement issued, verified, approved, paid by bank transfer, reference recorded |
| Credit to account | Net becca credited to the agent's balance, offsetting their next purchase order |
| Hybrid | Agent elects per statement; the election is recorded and approved |

### 14.7 Capture at the counter

| Ref | Requirement |
|---|---|
| BEC-11 | Existing redemption screen extended — the operator's scan flow is unchanged for fixed-rate products |
| BEC-12 | For POS-captured products a price field appears, pre-filled with the walk-in rate |
| BEC-13 | Keyed price validated against a configurable floor and ceiling per product |
| BEC-14 | Variance beyond a configurable threshold requires supervisor override with a reason and a distinct credential |
| BEC-15 | Display of becca on the counter screen is permission-controlled, so margin can be hidden from junior staff |
| BEC-16 | Commission calculation must add no perceptible delay to the scan |
| BEC-17 | Each voucher in a group batch produces its own commission line — never one aggregated line |

### 14.8 Data recorded per commission line

| Field | Description |
|---|---|
| Line reference | Unique identifier |
| Voucher serial | The voucher redeemed |
| Product | Ticket type |
| Agent / Partner | Owning account with account code |
| Purchase order | Originating order |
| Scheme + revision | Which revision priced it |
| Outlet, entrance gate | Where redeemed |
| Staff user, redeemed at | Who and when |
| Calculation mode | Which of the four modes applied |
| POS sell price | Walk-in rate or keyed price |
| Scheme price | Nett price paid by the agent |
| Commission rate | Where percentage mode applies |
| **Becca amount** | The calculated commission |
| Settlement model | In force at redemption |
| Status | Accrued / Statemented / Settled / Void / Exception |
| Exception flag | Negative becca, missing rate, variance override |
| Statement reference | Populated when swept into a statement |
| Batch reference | For group redemptions |

### 14.9 Commission statements

| Ref | Requirement |
|---|---|
| BEC-18 | Statements generated per agent per period |
| BEC-19 | Period follows the account's agreement type — Weekly or Monthly — or an ad-hoc manual period |
| BEC-20 | Generation sweeps all Accrued lines with a redemption date inside the period |
| BEC-21 | Run for one agent, a selected set, or all eligible agents at once |
| BEC-22 | A commission line can belong to exactly one statement; double-sweep prevented at database level |
| BEC-23 | A period cannot be statemented while unresolved exception lines remain, unless explicitly deferred by an admin |
| BEC-24 | Late-arriving lines for a closed period roll forward as clearly-labelled prior-period adjustments |
| BEC-25 | Preview before commit, showing what the statement will contain |

**Statement contents**

```
COMMISSION STATEMENT                            CS-2026-09-A20260001
──────────────────────────────────────────────────────────────────────
Agent            Sunrise Travel Sdn Bhd  (A20260001)
Period           01 Sep 2026 – 30 Sep 2026
Settlement model Operator-collected

SUMMARY BY PRODUCT
  Product                 Redeemed   Unit becca      Gross becca
  Adult Day Pass               312     RM 25.00     RM  7,800.00
  Child Day Pass                88     RM 18.00     RM  1,584.00
  Family Bundle                 12     RM 33.60     RM    403.20
  ──────────────────────────────────────────────────────────────
  Total                        412                  RM  9,787.20

ADJUSTMENTS
  Sep 14  Disputed redemption, gate B — reversed        − RM  150.00
  Sep 22  Goodwill, system downtime                     + RM  100.00
  ──────────────────────────────────────────────────────────────
  Net adjustments                                       − RM   50.00

NET PAYABLE                                             RM  9,737.20
```

| Ref | Requirement |
|---|---|
| BEC-26 | Header — agent, period, settlement model, generation actor and timestamp, statement reference |
| BEC-27 | Summary by product — quantity, unit becca, gross becca |
| BEC-28 | Optional breakdown by outlet, entrance gate and date |
| BEC-29 | Full supporting line detail, every voucher serial, downloadable |
| BEC-30 | Adjustment section with running net |
| BEC-31 | Export to **PDF** for the agent and **Excel** for the operator's finance team |

### 14.10 Adjustments

| Ref | Requirement |
|---|---|
| BEC-32 | Manual adjustment lines on a draft statement, positive or negative |
| BEC-33 | Mandatory category — Dispute, Clawback, Goodwill, Correction, Prior period, Other — and free-text reason |
| BEC-34 | Adjustments above a configurable value require a second approver |
| BEC-35 | Adjustments immutable once the statement is issued; corrections are made by further adjustment, never by editing history |
| BEC-36 | Author and timestamp recorded on every adjustment |
| BEC-37 | Voiding a statemented line creates an automatic prior-period adjustment on the next statement |

### 14.11 Statement lifecycle

```
   DRAFT ──issue──▶ ISSUED ──finance verify──▶ FINANCE VERIFIED ──admin approve──▶ APPROVED
     │                │                                                              │
     │                │                                                        record payment
     │                │                                                              ▼
     │                └──▶ DISPUTED ──resolve──▶ back to ISSUED                    PAID
     ▼
  CANCELLED  (lines return to Accrued for re-sweep)
```

| State | Who acts | Meaning |
|---|---|---|
| Draft | Admin | Generated, editable, adjustments allowed |
| Issued | Admin | Locked and visible to the agent |
| Disputed | Agent raises, Admin resolves | Agent has queried the statement |
| Finance Verified | Finance | Figures checked |
| Approved | Admin | Approved for payment |
| Paid | Finance | Paid out, reference and date recorded |
| Cancelled | Admin | Voided before issue |

| Ref | Requirement |
|---|---|
| BEC-38 | Finance verification and Admin approval **must** be different user accounts — enforced server-side |
| BEC-39 | This reuses the offline-payment two-actor control, so finance staff learn no new pattern |
| BEC-40 | Every transition writes an immutable history record with actor, timestamp and remarks |
| BEC-41 | Payment recording captures date, method, bank reference and optional payment advice upload |
| BEC-42 | Email notification to the agent on Issued and on Paid |
| BEC-43 | Backwards transitions are refused except the explicit dispute-resolution path |

### 14.12 Agent-facing commission features

| Ref | Requirement |
|---|---|
| BEC-44 | **My Commission** dashboard card — becca earned this period, last statement status, amount outstanding |
| BEC-45 | Live commission ledger — every redeemed voucher with its becca, filterable by date, product and outlet |
| BEC-46 | Statement history with status badges and PDF / Excel download |
| BEC-47 | Statement detail with product summary, adjustments and supporting lines |
| BEC-48 | **Raise a dispute** on an issued statement, with reason and optional attachment |
| BEC-49 | Dispute thread visible to both parties until resolved |
| BEC-50 | Under hybrid settlement, the agent elects cash or credit per statement |
| BEC-51 | Under the agent-collected model the same screens present margin reporting with no payout figures |
| BEC-52 | Agents see only their own commission data — enforced server-side |

### 14.13 Accrual rules

| Ref | Rule |
|---|---|
| BEC-53 | Becca accrues only on a successful, first-time redemption |
| BEC-54 | Rejected scans — already redeemed, expired, locked, not found, invalid signature — accrue nothing |
| BEC-55 | One voucher produces at most one commission line, enforced by a unique database constraint |
| BEC-56 | Complimentary vouchers accrue zero becca by default; a grant may be marked commission-bearing |
| BEC-57 | Expired and unredeemed vouchers never accrue becca |
| BEC-58 | Vouchers from cancelled or refunded orders are excluded |
| BEC-59 | Becca is frozen at redemption; later price edits never alter existing lines |
| BEC-60 | Negative becca is recorded as zero, flagged and routed to the exception queue — the guest is still admitted |
| BEC-61 | Where no walk-in rate is effective on the redemption date, the line is flagged and held at zero pending correction |
| BEC-62 | Voiding a line requires a reason and an approver; it is never a silent delete |

### 14.14 Edge cases

| Scenario | Behaviour |
|---|---|
| Voucher redeemed after the agent account expires | Becca still accrues — the agent paid for the voucher |
| Scheme revision changed between purchase and redemption | Original revision price used |
| Walk-in rate changed between purchase and redemption | Rate effective on the redemption date used |
| Product deactivated after vouchers sold | Redemption and accrual proceed normally |
| Outlet changes settlement model mid-period | Each line keeps the model in force at its own redemption |
| Duplicate scan | Rejected; no second commission line possible |
| Commission write fails after redemption | Redemption stands; line queued and surfaced in reconciliation |
| Invalid line found after the statement is issued | Line voided; automatic prior-period adjustment next period |
| Dispute after approval | Recorded and resolved by adjustment, never by rewriting an approved statement |
| Period closed with exceptions outstanding | Statement blocked unless exceptions are explicitly deferred |

---

## 15. Module 12 — Complimentary Vouchers

| Ref | Requirement |
|---|---|
| CMP-01 | Admin grants complimentary (free) vouchers to a nominated account |
| CMP-02 | Product and quantity selection per grant, multiple products per grant |
| CMP-03 | Minimum grant quantity enforced — currently 20, configurable |
| CMP-04 | Mandatory reason / justification on every grant |
| CMP-05 | Validity dates set per grant |
| CMP-06 | Grant state machine: **Pending → Approved / Rejected**, with mandatory remarks on rejection |
| CMP-07 | Finance approval queue for complimentary grants |
| CMP-08 | Approved grants generate vouchers identical in behaviour to purchased vouchers, flagged source = Complimentary |
| CMP-09 | Complimentary vouchers accrue zero becca by default; configurable per grant |
| CMP-10 | Complimentary grants appear in the agent's Voucher Issued screen, clearly labelled |
| CMP-11 | Complimentary report covering grants issued, consumed and outstanding |
| CMP-12 | Full audit trail on grant creation and approval |

---

## 16. Module 13 — Announcements

| Ref | Requirement |
|---|---|
| ANN-01 | Announcement master with title and body content |
| ANN-02 | Display location: **Home** (post-login popup) or **Login** (public login page) |
| ANN-03 | Audience targeting: Agent / Partner / Both |
| ANN-04 | Media upload — JPG or PDF, with preview |
| ANN-05 | Effective date and expiry date |
| ANN-06 | Status: Active / Inactive / Expired, with automatic expiry |
| ANN-07 | Home-page popup shown on login, dismissible, with a do-not-show-again option per announcement |
| ANN-08 | Announcement feed on the agent dashboard listing current announcements |
| ANN-09 | Login-page announcements displayed to unauthenticated visitors |
| ANN-10 | Admin listing with filter by status, audience and date; preview before publishing |
| ANN-11 | Announcement ordering / priority control |

---

## 17. Module 14 — Reporting

All reports support account, date-range, product and outlet filters as applicable, plus quick
search, sortable columns, paging, TOTAL rows and **Export to Excel**.

### 17.1 Operational reports (Admin)

| Ref | Report | Contents |
|---|---|---|
| RPT-01 | Transaction Report | All transactions in a period, summarised by account |
| RPT-02 | Transaction Details | Line-level transaction breakdown |
| RPT-03 | Purchase Summary | Purchases by account and period |
| RPT-04 | Purchase Details | Line-level purchase breakdown by product |
| RPT-05 | Top Purchase | Ranking of accounts by purchase value and volume |
| RPT-06 | Voucher Issued | Vouchers issued by account, order and product |
| RPT-07 | Ticket | Serial and QR search — locate any individual voucher and its full history |
| RPT-08 | Complimentary | Complimentary grants, approvals and consumption |
| RPT-09 | Payment | Offline payments with status, actors and approval timeline |

### 17.2 Commission reports

| Ref | Report | Contents |
|---|---|---|
| RPT-10 | Becca Commission Summary | Becca by agent for a period — volume, gross, adjustments, net |
| RPT-11 | Becca Commission Detail | Line level — serial, product, gate, staff, prices, becca |
| RPT-12 | Becca by Product | Which products generate the most commission; unit margin comparison |
| RPT-13 | Becca by Outlet / Gate | Commission concentration by location |
| RPT-14 | Statement Register | All statements with status, net payable and ageing |
| RPT-15 | Settlement / Payout | Paid statements with date, method and bank reference |
| RPT-16 | Accrual Report | Unstatemented accrued becca — the operator's current commission liability |
| RPT-17 | Exception Report | Negative becca, missing rates, variance overrides, unreconciled lines |
| RPT-18 | Reconciliation | Redemptions with no commission line, and lines with no matching redemption |
| RPT-19 | Adjustment Register | All adjustments by category, agent and author |
| RPT-20 | Margin Analysis | Walk-in revenue vs nett revenue vs commission paid, by period |
| RPT-21 | Agent Performance | Purchased vs redeemed vs expired per agent, redemption rate, becca yield |

### 17.3 Agent-facing reports

| Ref | Requirement |
|---|---|
| RPT-22 | Purchase report scoped to the agent's own account |
| RPT-23 | Payment report scoped to the agent's own account |
| RPT-24 | Voucher report scoped to the agent's own account |
| RPT-25 | Commission ledger and statement history scoped to the agent's own account |
| RPT-26 | All agent reports export to Excel |

### 17.4 Report requirements

| Ref | Requirement |
|---|---|
| RPT-27 | Consistent report shell across all reports — same filter bar, paging and export control |
| RPT-28 | Excel export reproduces on-screen figures exactly, including totals |
| RPT-29 | Large exports are generated server-side without timing out the browser |
| RPT-30 | Every report is role-scoped; an agent's report never returns another account's rows |
| RPT-31 | Date filters offer presets — today, last 7 days, last 30 days, this month, custom range |
| RPT-32 | Reports reconcile to source data; reconciliation is an acceptance criterion |

---

## 18. Module 15 — Dashboards

| Ref | Requirement |
|---|---|
| DSH-01 | **Admin dashboard** — pending registrations, pending renewals, payments awaiting approval, vouchers issued, redemptions today, commission accrued this period, top accounts |
| DSH-02 | **Agent dashboard** — account status and expiry countdown, orders in progress, vouchers available vs used, becca earned this period, announcement feed |
| DSH-03 | **Finance dashboard** — payments awaiting verification, complimentary approvals pending, statements awaiting verification, payouts due |
| DSH-04 | **Staff dashboard** — redemptions processed today, by gate |
| DSH-05 | Metric cards with period-on-period comparison |
| DSH-06 | Click-through from every metric card to the underlying list |
| DSH-07 | Skeleton loading states; no blank screens during data fetch |
| DSH-08 | Dashboard data is role-scoped server-side |

---

## 19. Module 16 — Authentication & Security

| Ref | Requirement |
|---|---|
| SEC-01 | Account-code login (`A20260001` / `P20260001`) for agents and partners |
| SEC-02 | Email login for Admin, Finance and Staff |
| SEC-03 | JWT session management — short-lived access token plus refresh token |
| SEC-04 | Both tokens held in **httpOnly** cookies; no token is readable by client-side script |
| SEC-05 | Automatic silent token refresh; session expiry handled gracefully with a re-login prompt |
| SEC-06 | Passwords hashed with bcrypt; plaintext passwords are never stored or logged |
| SEC-07 | Configurable password complexity rules — length, character classes |
| SEC-08 | Temporary passwords expire in 24 hours |
| SEC-09 | Forced password change on first login |
| SEC-10 | Password reset by emailed link with expiry and single use |
| SEC-11 | Role-based authorisation enforced on **every** API route, not only in the UI |
| SEC-12 | Account-level data scoping enforced server-side on every query |
| SEC-13 | Uploaded documents stored in private storage, served only through an authenticated download route |
| SEC-14 | QR payloads HMAC-signed; signature verified at every redemption |
| SEC-15 | No secrets, keys or credentials present in the client bundle |
| SEC-16 | Rate limiting on login, password reset and public status lookup |
| SEC-17 | Session invalidation on logout and on password change |
| SEC-18 | Security-relevant events — failed logins, invalid signatures, permission refusals — logged |

---

## 20. Module 17 — Configuration & Master Data

| Ref | Configurable item |
|---|---|
| CFG-01 | Payment groups |
| CFG-02 | Payment types |
| CFG-03 | Entrance gates per outlet |
| CFG-04 | States and countries |
| CFG-05 | Default account expiry term and renewal window |
| CFG-06 | Password complexity rules and temporary password lifetime |
| CFG-07 | Maximum upload file size and accepted formats |
| CFG-08 | Complimentary minimum grant quantity |
| CFG-09 | Becca default calculation mode |
| CFG-10 | Becca settlement model — system default and per outlet |
| CFG-11 | Becca settlement method — payout / credit / hybrid |
| CFG-12 | Commission statement period and generation day |
| CFG-13 | POS price floor and ceiling per product |
| CFG-14 | POS variance threshold requiring supervisor override |
| CFG-15 | Display of becca on the counter screen, by role |
| CFG-16 | Complimentary voucher commission treatment |
| CFG-17 | Adjustment value requiring a second approver |
| CFG-18 | Nil-statement generation on / off |
| CFG-19 | Email notification triggers |
| CFG-20 | Queue ageing thresholds |
| CFG-21 | Terms & Conditions content |
| CFG-22 | Operator bank details shown on payment instructions |

| Ref | Requirement |
|---|---|
| CFG-23 | All configuration is editable by Admin through the interface — no code change or redeployment required |
| CFG-24 | Configuration changes are audited |

---

## 21. Module 18 — Notifications

| Ref | Trigger | Recipient |
|---|---|---|
| EML-01 | Registration submitted | Applicant |
| EML-02 | Registration approved — account code and temporary password | Applicant |
| EML-03 | Registration rejected, with remarks | Applicant |
| EML-04 | Registration revision requested, with remarks | Applicant |
| EML-05 | Temporary password resent | Agent user |
| EML-06 | Password reset link | User |
| EML-07 | Password changed confirmation | User |
| EML-08 | Order submitted, with payment instructions | Agent |
| EML-09 | Payment marked Paid by Finance | Agent |
| EML-10 | Payment approved — vouchers issued | Agent |
| EML-11 | Payment rejected or revision requested, with remarks | Agent |
| EML-12 | Complimentary grant approved | Agent |
| EML-13 | Account expiring — reminder series | Agent |
| EML-14 | Renewal submitted / approved / rejected | Agent |
| EML-15 | Commission statement issued | Agent |
| EML-16 | Commission statement paid | Agent |
| EML-17 | Dispute raised | Admin |
| EML-18 | Dispute resolved | Agent |

| Ref | Requirement |
|---|---|
| EML-19 | Pluggable email driver — SMTP in production, console logger in development |
| EML-20 | Branded HTML templates with a plain-text fallback |
| EML-21 | Delivery failures logged and surfaced to Admin, with a resend action |
| EML-22 | Notification triggers individually switchable in configuration |

---

## 22. Module 19 — Audit & Activity Logging

| Ref | Requirement |
|---|---|
| AUD-01 | Immutable audit trail on registration decisions |
| AUD-02 | Immutable audit trail on account status and expiry changes |
| AUD-03 | Immutable audit trail on scheme revisions, price changes and assignments |
| AUD-04 | Immutable audit trail on order status transitions |
| AUD-05 | Immutable audit trail on every payment status transition |
| AUD-06 | Immutable audit trail on voucher issuance, lock, unlock and redemption |
| AUD-07 | Immutable audit trail on every scan attempt, successful or rejected |
| AUD-08 | Immutable audit trail on commission line creation, void and status change |
| AUD-09 | Immutable audit trail on statement transitions and adjustments |
| AUD-10 | Immutable audit trail on walk-in rate changes |
| AUD-11 | Immutable audit trail on configuration changes |
| AUD-12 | Every record carries actor, timestamp, before value, after value and reason where applicable |
| AUD-13 | Audit records cannot be edited or deleted through the application by any role |
| AUD-14 | Activity log viewable per account and per entity |
| AUD-15 | Audit export for external or statutory audit |

---

## 23. Module 20 — In-Product Documentation

| Ref | Requirement |
|---|---|
| DOC-01 | Illustrated user guide accessible from inside the portal |
| DOC-02 | Role-specific chapters — Agent, Admin, Finance, Staff |
| DOC-03 | Annotated screenshots of every major screen |
| DOC-04 | Step-by-step walkthroughs of the registration, purchase, payment, redemption and commission flows |
| DOC-05 | Searchable content |
| DOC-06 | Maintained alongside the application so screenshots stay current |

---

## 24. Module 21 — OTA Marketplace Integration (optional)

Included only where quoted. The platform contains the structural foundation for
marketplace distribution.

| Ref | Requirement |
|---|---|
| OTA-01 | Provider configuration per marketplace, with sandbox and production environments |
| OTA-02 | Product mapping between platform products and marketplace SKUs |
| OTA-03 | Availability and price push to the marketplace |
| OTA-04 | Inbound order creation, reservation, confirmation and cancellation |
| OTA-05 | Marketplace voucher redemption reconciled into the same redemption log |
| OTA-06 | Full API request and response logging for dispute resolution |
| OTA-07 | Availability query logging |

---

## 25. Cross-Cutting: State Machines

The platform is governed by eight explicit state machines. Every transition is permission-
controlled, remark-capable and audited.

| # | Entity | States |
|---|---|---|
| 1 | **Registration** | Pending → Approved / Rejected / Revision → (resubmit) |
| 2 | **Renewal request** | Pending → Approved / Rejected / Revision |
| 3 | **Account** | Active ⇄ Inactive → Expired → (renewal) → Active |
| 4 | **Purchase order** | Draft → Pending Payment → Pending Approval → Order Confirmed / Rejected / Revision / Cancelled |
| 5 | **Offline payment** | Submitted → Pending Approval → Finance Paid → Order Confirmed / Rejected / Revision |
| 6 | **Voucher** | New → Redeemed / Expired; New ⇄ Locked |
| 7 | **Commission line** | Accrued → Statemented → Settled; Void; Exception |
| 8 | **Commission statement** | Draft → Issued → Finance Verified → Approved → Paid; Disputed; Cancelled |

| Ref | Requirement |
|---|---|
| STA-01 | Illegal transitions are refused server-side, not merely hidden in the interface |
| STA-02 | Terminal states cannot be reopened except through the explicitly specified paths |
| STA-03 | Every transition records from-state, to-state, actor, timestamp and remarks |
| STA-04 | Two-actor controls apply on payment approval and on commission statement approval |

---

## 26. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Availability** | Designed for 99.5% availability during park operating hours |
| **Portal performance** | Standard screens respond under 2 seconds at expected load |
| **Counter performance** | Scan-to-result under 1 second on target counter hardware |
| **Report performance** | Standard reports return under 5 seconds; large exports generated server-side without browser timeout |
| **Statement generation** | A full monthly run across all agents completes inside the operator's overnight window |
| **Scale** | Sized for hundreds of active accounts, tens of thousands of vouchers per month and tens of thousands of commission lines per month |
| **Concurrency** | Multiple counter positions redeeming simultaneously without contention or double-redemption |
| **Data integrity** | All monetary values stored as fixed-precision decimals; no floating-point currency arithmetic anywhere; rounding applied once, at line level, by a single documented rule |
| **Atomicity** | Multi-step financial operations — approval plus voucher generation, statement generation — are all-or-nothing |
| **Security** | httpOnly cookie sessions, bcrypt hashing, HMAC-signed QR, private document storage, server-side role and account scoping on every route |
| **Audit** | Immutable trail on every approval, payment, redemption and commission event |
| **Resilience** | A reporting or commission fault never blocks a gate redemption |
| **Browsers** | Current Chrome, Edge, Safari and Firefox |
| **Devices** | Counter screens tested on tablet; admin screens on desktop; agent screens usable on mobile |
| **Responsive** | All screens usable from 360px width upward |
| **Accessibility** | Keyboard navigable, sufficient colour contrast, screen-reader labels on controls |
| **Localisation** | English interface; Malaysian date, currency and document conventions — MYR, KPL, SSM |
| **Retention** | Transactional, commission and audit data retained for the operator's statutory period |
| **Backup** | Nightly database backup with point-in-time recovery to the agreed retention window |

---

## 27. Technical Architecture

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript in strict mode, Tailwind CSS |
| Backend | Next.js API routes → thin controllers → **framework-free service layer** |
| Database | PostgreSQL with Prisma ORM and versioned migrations |
| Authentication | Custom JWT (HS256 access + refresh tokens in httpOnly cookies), bcrypt password hashing |
| File storage | Private disk volume served through an authenticated download route |
| Email | Pluggable driver — SMTP in production, console logger in development |
| Excel export | Server-side XLSX generation on every report endpoint |
| PDF | Server-side generation for statements and voucher sheets |
| QR | HMAC-signed payloads rendered as QR data URLs |
| Containerisation | Docker with Docker Compose |

### 27.1 Architectural principles

| Ref | Principle |
|---|---|
| ARC-01 | All business logic lives in a framework-independent service layer — testable and portable if the presentation framework changes |
| ARC-02 | API routes are thin; they authenticate, authorise, validate and delegate |
| ARC-03 | Authorisation is enforced in the service layer, so no route can bypass it |
| ARC-04 | The database schema is the source of truth for integrity — unique constraints and foreign keys, not application checks alone |
| ARC-05 | TypeScript strict mode throughout; shared types between frontend and backend |
| ARC-06 | Schema changes are delivered as versioned, reversible migrations |
| ARC-07 | Configuration is environment-driven; no environment-specific values are compiled into the build |

---

## 28. Environments & Deployment

| Environment | Purpose |
|---|---|
| **Development** | Local developer environment with seeded demo data |
| **Staging / UAT** | Client acceptance testing, mirroring production configuration |
| **Production** | Live operation |

| Ref | Requirement |
|---|---|
| ENV-01 | Docker deployment package — Dockerfile, Compose file and environment template |
| ENV-02 | Deployable to the client's own infrastructure or a managed host |
| ENV-03 | Database migrations run as a controlled deployment step |
| ENV-04 | Seed data for master records — payment groups, payment types, states |
| ENV-05 | Environment variable reference documenting every setting and secret |
| ENV-06 | Health check endpoint for uptime monitoring |
| ENV-07 | Application logging suitable for production troubleshooting |
| ENV-08 | Documented rollback procedure |

---

## 29. Deliverables

1. Deployed web application covering every module in Sections 4 to 24
2. PostgreSQL schema with versioned migration scripts and seed data
3. Docker deployment package — Dockerfile, Compose file, environment template
4. Deployment guide — environment variables, secrets, first-run setup, rollback
5. Illustrated in-product user guide covering all four operational roles
6. This specification as the contractual scope and UAT baseline
7. Administrator handover and training session, remote or on-site as agreed
8. Source code handover to the client's repository
9. Warranty / defect-rectification period as stated in the quotation

---

## 30. Implementation Phases

| Phase | Content | Exit criteria |
|---|---|---|
| **1. Foundations** | Environment setup, database schema, authentication, role framework, UI shell, configuration | Users log in by role; role-aware navigation in place |
| **2. Onboarding** | Registration wizard, document upload, approval queues, account creation, renewals, notifications | An agent registers and is approved end to end, credentials delivered |
| **3. Commerce** | Outlets, products, bulk creation, import, purchase schemes, revisions, assignments | An approved agent sees the correct catalogue at their bound prices |
| **4. Purchase** | Catalogue, cart, order submission, incomplete orders, transaction review | An agent places a valid order within scheme limits |
| **5. Financial control** | Offline payment submission, Finance verification, Admin approval, voucher generation | A paid order produces valid vouchers under two-actor control |
| **6. Point of sale** | Voucher redemption, QR scanning, gate capture, batch redemption, rejection handling | A voucher is redeemed once and only once, with full audit |
| **7. Becca commission** | Walk-in rates, calculation engine, POS capture, ledger, exceptions, statements, settlement, agent commission screens | A period's redemptions produce a verified, approved, paid statement |
| **8. Reporting** | All 21 reports, Excel exports, statement PDF, dashboards | All reports reconcile against source data |
| **9. Engagement** | Announcements, complimentary vouchers, in-product documentation | Announcements publish correctly to the right audience |
| **10. UAT & handover** | Client acceptance testing, defect rectification, training, go-live | Signed acceptance |

---

## 31. Acceptance Criteria

The system is accepted when the following are demonstrated end to end on the staging
environment.

### 31.1 Onboarding

1. A new agent completes the 4-step registration, uploads KPL and SSM documents, and receives an Application ID.
2. The public status page returns the correct status for that Application ID.
3. An admin requests revision with remarks; the applicant amends and resubmits under the same Application ID.
4. The admin approves; an account is created with the next sequential account code and credentials are emailed.
5. The agent logs in with the account code, is forced to change the temporary password, and reaches their dashboard.
6. A temporary password older than 24 hours is refused.

### 31.2 Commerce

7. The agent sees only products from their bound scheme, at the bound prices.
8. Quantities below the minimum or above the maximum are rejected with a clear message.
9. An order is submitted and receives a unique order reference; totals reflect incentives and discounts correctly.
10. An expired account can log in and view vouchers but cannot place an order.

### 31.3 Financial control

11. The agent submits a payment with a bank slip against the order.
12. Finance previews the slip and marks the payment Paid.
13. An admin attempting to approve a payment **not** marked Paid by Finance is refused.
14. The same user attempting both to mark Paid and to approve is refused.
15. A different admin approves; vouchers are generated automatically for every ticket in the order.
16. The full payment status history is visible to Admin, Finance and the agent.

### 31.4 Fulfilment

17. Every voucher carries a unique serial and a scannable QR code.
18. A voucher is redeemed successfully at the gate; the gate, staff user and timestamp are recorded.
19. A second scan of the same voucher is rejected as Already Redeemed, showing when and where it was first used.
20. Expired, locked, not-found and tampered-QR scans each produce their own distinct rejection message.
21. A group of 20 vouchers is redeemed in one batch, producing 20 individual records under one batch reference.

### 31.5 Becca commission

22. A walk-in rate set with a future effective date is applied only to redemptions on or after that date.
23. A voucher bought under scheme revision 3 and redeemed after revision 5 takes effect is valued at the revision 3 price.
24. A fixed-rate redemption adds no extra keystrokes at the counter and produces the correct becca.
25. A POS-captured redemption accepts a keyed price, rejects a price outside the configured range, and requires supervisor override beyond the variance threshold.
26. A negative-becca scenario admits the guest, records zero becca and appears in the exception queue.
27. A complimentary voucher redemption produces a zero-becca line.
28. A monthly statement sweeps exactly the qualifying lines, and those lines cannot be swept into a second statement.
29. An adjustment is added with a category and reason, is reflected in the net payable, and cannot be edited after issue.
30. Finance verification and Admin approval by the same user is refused; by two users it succeeds.
31. The statement is marked Paid with a bank reference; the agent sees the paid status and downloads the PDF.
32. An agent raises a dispute; it is recorded and resolved by an adjustment on the following period.

### 31.6 Reporting and security

33. All 21 reports return figures that reconcile to source data and export to Excel without loss.
34. An agent requesting another agent's data directly against the API is refused.
35. A staff user requesting an admin function directly against the API is refused.
36. Every approval, payment, redemption and commission event appears in the audit trail with actor and timestamp.

---

## 32. Assumptions

1. The client provides SMTP credentials or an email service account for outbound mail.
2. The client provides hosting, domain and SSL certificate, or accepts a hosted option quoted separately.
3. Master data — products, walk-in rates, scheme prices, outlets, gates, bank details — is supplied by the client at project start in the agreed template.
4. The commercial structure for becca — which calculation mode and settlement model applies to which product and agent — is confirmed during Phase 1.
5. Counter hardware has a working camera or an attached barcode scanner, and adequate network connectivity for the stated performance targets.
6. Payment verification remains a manual finance process against bank statements; no bank API integration is assumed.
7. Commission payouts are executed through the client's existing banking process.
8. Content — terms and conditions, announcement artwork, email wording, statement branding — is supplied by the client.
9. One production and one staging environment are in scope.
10. Client testers are available for UAT within the agreed window.
11. Tax treatment of commission — SST or withholding, if applicable — is confirmed by the client's finance team.

---

## 33. Out of Scope

Not included unless separately quoted:

- Online payment gateway or card acquiring integration
- Automated bank payment file generation or bank API payout
- Accounting system integration — SAP, AutoCount, Xero and similar
- Native mobile applications for iOS or Android
- Multi-language interface beyond English
- Multi-currency operation or currency conversion
- Migration of historical data from existing systems
- Retrospective commission calculation on redemptions predating go-live
- Multi-tier or sub-agent commission cascades
- Commission on products sold outside this platform
- Tax computation and statutory tax reporting
- OTA marketplace integration beyond Module 21 where that module is quoted
- Turnstile or access-control hardware integration
- Hardware supply — scanners, tablets, printers, turnstiles
- Automated dispute resolution logic; disputes are recorded and worked by people
- 24/7 manned support — a support retainer can be quoted separately

---

## 34. Items for Client Confirmation

Configuration decisions only. None changes scope or effort; all can be settled during Phase 1.

| # | Decision | Options |
|---|---|---|
| 1 | Becca calculation mode | Fixed walk-in rate / POS-captured / Fixed amount / Percentage — and per which products |
| 2 | Who collects the cash at the counter | Operator-collected / Agent-collected / Mixed per outlet |
| 3 | Commission settlement method | Cash payout / Credit to account / Hybrid by agent election |
| 4 | Commission statement period | Weekly / Monthly / Per agreement type |
| 5 | Complimentary voucher commission treatment | Zero becca / Commission-bearing |
| 6 | Show becca on the counter screen | Yes / No / By role |
| 7 | POS variance threshold requiring override | Percentage below walk-in rate |
| 8 | Adjustment value requiring a second approver | Ringgit threshold |
| 9 | Negative becca policy | Zero and flag / Block redemption / Allow negative |
| 10 | Default account expiry term and renewal window | Months |
| 11 | Complimentary minimum grant quantity | Currently 20 |
| 12 | Password complexity policy | Length and character class rules |
| 13 | Data retention period | Per statutory requirement |
| 14 | OTA marketplace integration | In scope / Out of scope |
| 15 | Tax treatment of commission | Confirmed by client finance |

---

## 35. Appendices

### 35.1 Screen inventory

| Group | Screens |
|---|---|
| **Public** | Login, Register (Agent), Register (Partner), 4 wizard steps, Application Status, Forgot Password, Reset Password |
| **Shared** | Change Password, Profile, Settings, Documentation |
| **Agent** | Dashboard, Ticket Purchase catalogue, Cart, Order Review, Order Confirmation, Incomplete Orders, Transaction Review, Voucher Issued, Voucher Detail, Offline Payment submission, Payment History, Purchase Report, Payment Report, My Commission, Commission Ledger, Statement History, Statement Detail, Dispute, Renewal |
| **Admin** | Dashboard, Agent Requests, Partner Requests, Application Detail, Active Agents, Active Partners, Account Detail with 6 tabs, Account Renewal queue, Renewal Detail, Outlets, Outlet Detail, Products, Product Detail, Bulk Product Create, Product Import, Purchase Schemes, Scheme Detail, Revision Editor, Revision Compare, Scheme Assignment, Offline Payment queue, Payment Detail, Slip Preview, Complimentary, Grant Detail, Announcements, Announcement Editor, Configuration, Walk-in Rates, Bulk Rate Update, Becca Configuration, Commission Ledger, Exception Queue, Statement Generation, Statement Detail, Adjustment Entry, Statement Register, Activity Log, 21 report screens |
| **Finance** | Offline Payment queue, Payment Detail, Complimentary Approvals, Statement Verification queue, Statement Detail, Payment Recording, finance report set |
| **Staff** | Voucher Redeem, Batch Redeem, Supervisor Override, Scanner, Ticket list |

### 35.2 Report inventory

21 reports, all with Excel export — RPT-01 to RPT-21 in Section 17, plus 4 agent-scoped
report views.

### 35.3 Email inventory

18 automated notifications — EML-01 to EML-18 in Section 21.

### 35.4 Status reference

| Entity | Statuses |
|---|---|
| Registration | Pending, Approved, Rejected, Revision |
| Renewal | Pending, Approved, Rejected, Revision |
| Account | Active, Inactive, Expired |
| Purchase order | Draft, Pending Payment, Pending Approval, Order Confirmed, Rejected, Revision, Cancelled |
| Offline payment | Pending Approval, Finance Paid, Order Confirmed, Rejected, Revision |
| Voucher | New, Locked, Redeemed, Expired |
| Voucher source | Purchase, Complimentary |
| Commission line | Accrued, Statemented, Settled, Void, Exception |
| Commission statement | Draft, Issued, Disputed, Finance Verified, Approved, Paid, Cancelled |
| Announcement | Active, Inactive, Expired |
| Scheme | Active, Inactive |
| Party type | Agent, Partner |
| Agreement type | Prepaid, Weekly, Monthly |
| Product category | Adult, Child, Bundle |
| Validity type | Same-day, Fixed date, Date range |
| Becca calculation mode | Fixed rate, POS captured, Fixed amount, Percentage |
| Settlement model | Operator-collected, Agent-collected, Per outlet |

### 35.5 Requirement reference index

| Prefix | Module |
|---|---|
| ROLE | Roles & permissions |
| REG | Registration & onboarding |
| APR | Registration approval |
| ACC | Account & user management |
| REN | Account renewal |
| OUT / PRD | Outlets & products |
| SCH | Purchase schemes |
| PUR | Ticket purchase |
| PAY | Offline payment |
| VCH | Voucher issuance |
| POS | Gate redemption |
| BEC | Becca commission |
| CMP | Complimentary vouchers |
| ANN | Announcements |
| RPT | Reporting |
| DSH | Dashboards |
| SEC | Authentication & security |
| CFG | Configuration |
| EML | Notifications |
| AUD | Audit & logging |
| DOC | In-product documentation |
| OTA | Marketplace integration |
| STA | State machines |
| ARC | Architecture |
| ENV | Environments & deployment |

---

*End of specification.*
