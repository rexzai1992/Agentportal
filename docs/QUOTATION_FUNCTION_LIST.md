# Agent Portal — Itemised Function List

**Document type:** Quotation line-item schedule
**Product:** Agent Portal — B2B Travel Agent & Partner Ticketing Platform
**Version:** 1.0
**Date:** 14 September 2026

> Every function in the portal, itemised as a quotable line. Fill in the rate column to
> build the quotation. Each item cross-references the requirement numbers in
> `PROJECT_SPEC_FULL.md`, so the client can see exactly what each line buys.
>
> **Totals:** 21 modules · 148 quotable functions · 95+ screens · 21 reports

---

## Summary

| # | Module | Functions | Screens | Spec ref | Price (RM) |
|---|---|---:|---:|---|---|
| 1 | Public Registration & Onboarding | 9 | 8 | REG-01…39 | |
| 2 | Registration Approval | 7 | 3 | APR-01…28 | |
| 3 | Account & User Management | 10 | 9 | ACC-01…25 | |
| 4 | Account Renewal | 6 | 4 | REN-01…16 | |
| 5 | Outlets & Products | 10 | 7 | OUT/PRD | |
| 6 | Purchase Schemes (Pricing) | 9 | 6 | SCH-01…23 | |
| 7 | Ticket Purchase | 8 | 6 | PUR-01…26 | |
| 8 | Offline Payment & Approval | 9 | 6 | PAY-01…27 | |
| 9 | Voucher Issuance & Delivery | 8 | 5 | VCH-01…22 | |
| 10 | Gate Redemption / POS | 8 | 5 | POS-01…25 | |
| 11 | **Becca Commission at POS** | **18** | **13** | BEC-01…62 | |
| 12 | Complimentary Vouchers | 5 | 4 | CMP-01…12 | |
| 13 | Announcements | 5 | 3 | ANN-01…11 | |
| 14 | Reporting (21 reports) | 12 | 25 | RPT-01…32 | |
| 15 | Dashboards | 4 | 4 | DSH-01…08 | |
| 16 | Authentication & Security | 8 | 4 | SEC-01…18 | |
| 17 | Configuration & Master Data | 5 | 5 | CFG-01…24 | |
| 18 | Notifications (18 emails) | 4 | 1 | EML-01…22 | |
| 19 | Audit & Activity Logging | 4 | 2 | AUD-01…15 | |
| 20 | In-Product Documentation | 3 | 1 | DOC-01…06 | |
| 21 | OTA Marketplace Integration *(optional)* | 6 | 4 | OTA-01…07 | |
| | **Core subtotal (modules 1–20)** | **142** | | | |
| | **Optional add-ons (module 21 + §23)** | | | | |
| | **TOTAL** | | | | |

---

## 1. Public Registration & Onboarding

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 1.1 | Registration wizard framework | 4-step wizard, step indicator, forward/back navigation, data retention between steps | |
| 1.2 | Agent / Partner registration tracks | Two entry points, separate data handling, different document requirements | |
| 1.3 | Company information capture | 13 fields with format validation — SSM number, KPL number and expiry, address, postcode, state, country | |
| 1.4 | Document upload | KPL and SSM upload, multiple supporting documents, format and size validation, server-side type verification, progress indicator | |
| 1.5 | Contact person management | Dynamic add/remove rows, per-row validation, primary contact flag | |
| 1.6 | Business background capture | Target market, sales channel, estimated volume, remarks | |
| 1.7 | Terms & Conditions gate | Configurable T&C content, acceptance enforcement before submission | |
| 1.8 | Application ID generation & confirmation | Unique ID, on-screen confirmation, confirmation email, duplicate detection | |
| 1.9 | Public application status page | No-login status lookup, remarks display, revision resubmission, rate limiting | |

## 2. Registration Approval

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 2.1 | Agent Requests queue | Listing, filter, search, sort, paging, ageing indicator | |
| 2.2 | Partner Requests queue | Separate queue with the same capability | |
| 2.3 | Application detail view | All four wizard steps displayed, contact list, business background | |
| 2.4 | Secure document viewer | Authenticated preview and download, never publicly addressable | |
| 2.5 | Approve / Reject / Revision actions | Three decisions, mandatory remarks, confirmation prompt | |
| 2.6 | Automated account creation on approval | Account record, sequential account code, primary user, temporary password, credential email, expiry, document transfer — atomic | |
| 2.7 | Approval history panel | Every decision with actor, timestamp and remarks | |

## 3. Account & User Management

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 3.1 | Active Agents listing | Columns, filters, search, paging | |
| 3.2 | Active Partners listing | Separate listing, same capability | |
| 3.3 | Account detail — company tab | All registered company and licensing data | |
| 3.4 | Account detail — contacts tab | Add, edit, remove, change primary | |
| 3.5 | Account detail — documents tab | View, download, replace, version history | |
| 3.6 | Account detail — users tab | Create, disable, reset password | |
| 3.7 | Account detail — schemes tab | Current bindings, binding type, effective dates | |
| 3.8 | Account detail — activity tab | Chronological account activity log | |
| 3.9 | Account status & expiry control | Active / Inactive / Expired with reason, expiry editing, automatic expiry, status-effect rules | |
| 3.10 | Agent-facing profile | View-only company profile, contacts, documents, status and expiry display | |

## 4. Account Renewal

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 4.1 | Renewal availability window | Unlocks 2 months before expiry (configurable), dashboard countdown | |
| 4.2 | Agent renewal submission | Pre-filled amendable form, renewed document upload, updated contacts | |
| 4.3 | Admin renewal queue | Listing, filter, search, ageing | |
| 4.4 | Renewal detail with change comparison | Current vs proposed values, differences highlighted | |
| 4.5 | Approve / Reject / Revision + expiry extension | Decisions with remarks, term extension, data application, rights restoration | |
| 4.6 | Renewal reminder emails | Configurable reminder series before expiry | |

## 5. Outlets & Products

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 5.1 | Outlet master | Code, name, description, address, active flag, delete protection | |
| 5.2 | Outlet banking details | Bank name, account name, account number for payment instructions | |
| 5.3 | Entrance gate configuration | Gate list per outlet | |
| 5.4 | Product master | 12-field product record with unique SKU | |
| 5.5 | Product image upload | Upload with preview, used in the agent catalogue | |
| 5.6 | Product validity types | Same-day / Fixed date / Date range, driving voucher dating | |
| 5.7 | Product listing | Filter by outlet, category and status; search; paging | |
| 5.8 | Bulk product creation | Batch create with shared attributes | |
| 5.9 | Spreadsheet product import | Downloadable template, row-by-row validation report, partial-accept confirmation | |
| 5.10 | Product change audit | Field-level before/after audit trail | |

## 6. Purchase Schemes (Pricing)

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 6.1 | Scheme master | Code, name, description, organisation, status | |
| 6.2 | Scheme listing | Filter, search, paging | |
| 6.3 | Revision management | Revision numbering, effective dating, clone-from-previous, future dating | |
| 6.4 | Scheme product editor | Per-product price, min qty, max qty, incentive rate, discount rate | |
| 6.5 | Revision comparison view | What changed between two revisions | |
| 6.6 | Revision immutability | A revision used by an order becomes locked | |
| 6.7 | Scheme assignment | Standard and Special binding tabs, incentive note, effective date | |
| 6.8 | Bulk assignment & unassignment | Assign a scheme to many accounts at once; unassign without affecting history | |
| 6.9 | Multi-scheme precedence | Union of products across bound schemes with a configured precedence rule | |

## 7. Ticket Purchase

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 7.1 | Scheme-priced catalogue | Image, name, category, description, price; filter and search | |
| 7.2 | Cart with quantity enforcement | Min/max enforcement, inline breach messages, add/update/remove/clear | |
| 7.3 | Cart persistence | Survives across sessions until submitted or cancelled | |
| 7.4 | Live order summary | Subtotal, incentive total, discount total, total payable; per-line breakdown | |
| 7.5 | Order submission | Review step, server-side revalidation, unique order reference | |
| 7.6 | Order confirmation & payment instructions | Confirmation screen with operator bank details | |
| 7.7 | Incomplete Orders screen | Draft listing, resume, cancel, age display, configurable auto-expiry | |
| 7.8 | Transaction review screen | Header, lines, totals, status history, linked payments, issued vouchers, printable summary | |

## 8. Offline Payment & Two-Actor Approval

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 8.1 | Agent payment submission | Amount, group, type, bank name, reference, date, remarks | |
| 8.2 | Multi-order settlement | One payment settling multiple orders; one order settled by multiple payments | |
| 8.3 | Bank slip upload | PDF/JPG/PNG upload, mandatory | |
| 8.4 | Amount reconciliation indicator | Over- and under-payment flagged against selected order totals | |
| 8.5 | Finance verification queue | Listing, filters, ageing, detail view | |
| 8.6 | Slip preview popup | Zoom and download | |
| 8.7 | Mark Payment Paid action | Finance-only action, hard prerequisite to approval | |
| 8.8 | Admin approval + automatic voucher release | Approval gated on Finance Paid, pre-commit voucher count confirmation, atomic generation | |
| 8.9 | Two-actor enforcement & status history | Same-user block enforced server-side; immutable from/to/actor/timestamp/remarks history | |

## 9. Voucher Issuance & Delivery

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 9.1 | Voucher generation engine | One record per ticket, unique serial, atomic generation | |
| 9.2 | HMAC-signed QR generation | Signed payload, tamper rejection at the gate | |
| 9.3 | Validity dating | Effective and expiry dates per the product's validity type | |
| 9.4 | Voucher state management | New / Locked / Redeemed / Expired, automatic expiry | |
| 9.5 | Agent Voucher Issued screen | Grouped by order, issued / used / available counts | |
| 9.6 | Voucher detail & printable QR | Per-voucher view with printable serial and QR | |
| 9.7 | Bulk voucher download & Excel export | Print-ready file per order, list export | |
| 9.8 | Voucher search & admin lock/unlock | Serial search account-wide and system-wide; lock and unlock with reason | |

## 10. Gate Redemption / Point of Sale

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 10.1 | Voucher Redeem screen | Counter-optimised layout, large touch targets, fast auto-reset | |
| 10.2 | Camera QR scanning | Automatic detection | |
| 10.3 | Manual serial entry & hardware scanner support | Fallback entry, keyboard-wedge scanner support | |
| 10.4 | Entrance gate capture | Gate selection remembered for the session | |
| 10.5 | Six-outcome rejection handling | Valid / Already redeemed / Expired / Locked / Not found / Invalid signature, each visually distinct | |
| 10.6 | Redemption audit logging | Every attempt logged with voucher, outcome, gate, staff, timestamp; security alerts on invalid signatures | |
| 10.7 | Batch / group redemption | Multi-voucher transaction, running counts, per-voucher failure identification, batch reference, summary | |
| 10.8 | Counter resilience | Duplicate-submission protection, retry state on network loss, redemption never blocked by a downstream fault | |

## 11. Becca Commission at POS ★

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 11.1 | Walk-in rate master | Per-product published gate rate | |
| 11.2 | Effective-dated rate history | Start/end dates, no overwrite, future dating, rate resolved on redemption date | |
| 11.3 | Bulk walk-in rate update | Many products, one effective date | |
| 11.4 | Rate change audit & permission | Before/after audit; editing as a distinct permission | |
| 11.5 | Calculation engine — 4 modes | Fixed rate / POS captured / Fixed amount / Percentage | |
| 11.6 | Historical price resolution | Scheme price read from the revision the voucher was bought under, never the current price | |
| 11.7 | POS price capture at the counter | Price field for POS-captured products, pre-filled with walk-in rate | |
| 11.8 | Price validation & supervisor override | Per-product floor and ceiling, variance threshold, override with distinct credential and reason | |
| 11.9 | Commission line capture | 19 fields per redemption, frozen at redemption, one line per voucher enforced at database level | |
| 11.10 | Permission-controlled margin display | Show or hide becca on the counter screen by role | |
| 11.11 | Settlement model engine | Operator-collected / Agent-collected / Per outlet, recorded per line | |
| 11.12 | Commission ledger | All accrued lines, filterable by date, product, outlet, agent | |
| 11.13 | Exception queue | Negative becca, missing rate, variance override, unreconciled lines | |
| 11.14 | Statement generation | Per agent per period, sweep with double-sweep prevention, preview before commit, multi-agent run, prior-period roll-forward | |
| 11.15 | Adjustments | Positive/negative lines, 6 categories, mandatory reason, second-approver threshold, post-issue immutability | |
| 11.16 | Statement lifecycle & two-actor control | Draft → Issued → Finance Verified → Approved → Paid, plus Disputed and Cancelled; same-user block; immutable history | |
| 11.17 | Payout recording & settlement methods | Payment date, method, bank reference, advice upload; cash payout / account credit / hybrid election | |
| 11.18 | Agent commission screens | My Commission card, live ledger, statement history and detail, PDF/Excel download, dispute raising and thread | |

## 12. Complimentary Vouchers

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 12.1 | Complimentary grant creation | Account, multi-product selection, quantities, validity dates | |
| 12.2 | Minimum quantity & mandatory reason | Configurable minimum (currently 20), justification required | |
| 12.3 | Finance approval queue | Pending → Approved / Rejected with remarks | |
| 12.4 | Voucher generation from grant | Identical behaviour to purchased vouchers, flagged as complimentary | |
| 12.5 | Commission treatment & labelling | Zero becca by default, configurable per grant; labelled in the agent's voucher screen | |

## 13. Announcements

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 13.1 | Announcement master & editor | Title, body, effective and expiry dates, status, priority ordering | |
| 13.2 | Media upload | JPG or PDF with preview | |
| 13.3 | Display location targeting | Home popup (post-login) or Login page (public) | |
| 13.4 | Audience targeting | Agent / Partner / Both | |
| 13.5 | Popup & dashboard feed delivery | Dismissible popup with do-not-show-again, dashboard announcement feed | |

## 14. Reporting

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 14.1 | Report shell framework | Shared filter bar, presets, sort, paging, TOTAL rows, export control across all reports | |
| 14.2 | Excel export engine | Server-side generation, exact figure reproduction, large-export handling | |
| 14.3 | Transaction Report + Transaction Details | RPT-01, RPT-02 | |
| 14.4 | Purchase Summary + Purchase Details | RPT-03, RPT-04 | |
| 14.5 | Top Purchase | RPT-05 | |
| 14.6 | Voucher Issued + Ticket search | RPT-06, RPT-07 | |
| 14.7 | Complimentary + Payment | RPT-08, RPT-09 | |
| 14.8 | Becca Commission Summary + Detail | RPT-10, RPT-11 | |
| 14.9 | Becca by Product + by Outlet/Gate | RPT-12, RPT-13 | |
| 14.10 | Statement Register + Settlement/Payout + Accrual | RPT-14, RPT-15, RPT-16 | |
| 14.11 | Exception + Reconciliation + Adjustment Register | RPT-17, RPT-18, RPT-19 | |
| 14.12 | Margin Analysis + Agent Performance + 4 agent-scoped reports | RPT-20, RPT-21, RPT-22…26 | |

## 15. Dashboards

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 15.1 | Admin dashboard | 7 metric groups, click-through to underlying lists | |
| 15.2 | Agent dashboard | Status and expiry countdown, orders, vouchers, becca earned, announcement feed | |
| 15.3 | Finance dashboard | Payments, complimentary approvals, statements, payouts due | |
| 15.4 | Staff dashboard + shared metric framework | Redemptions by gate; period comparison, skeleton loading, role scoping | |

## 16. Authentication & Security

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 16.1 | Dual login modes | Account-code login for agents/partners, email login for internal roles | |
| 16.2 | JWT session management | Access + refresh tokens in httpOnly cookies, silent refresh, graceful expiry |  |
| 16.3 | Password security | bcrypt hashing, configurable complexity, forced first-login change | |
| 16.4 | Temporary password lifecycle | 24-hour expiry, resend without re-approval | |
| 16.5 | Password reset flow | Emailed single-use link with expiry | |
| 16.6 | Role-based authorisation layer | Enforced on every API route in the service layer | |
| 16.7 | Account-level data scoping | Server-side scoping on every query; cross-account access impossible | |
| 16.8 | Rate limiting & security event logging | Login, reset and public lookup limits; failed logins, invalid signatures, permission refusals logged | |

## 17. Configuration & Master Data

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 17.1 | Payment groups & payment types | Maintained master data | |
| 17.2 | Reference data | States, countries, entrance gates | |
| 17.3 | Policy configuration | Account expiry term, renewal window, password rules, upload limits, complimentary minimum, queue ageing thresholds | |
| 17.4 | Becca configuration | Calculation mode, settlement model and method, statement period and generation day, price bounds, variance threshold, margin display, adjustment approver threshold | |
| 17.5 | Content configuration | T&C content, operator bank details, notification triggers; all changes audited | |

## 18. Notifications

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 18.1 | Pluggable email driver | SMTP in production, console logger in development | |
| 18.2 | 18 branded email templates | HTML with plain-text fallback, EML-01 to EML-18 | |
| 18.3 | Delivery failure handling | Logged, surfaced to Admin, resend action | |
| 18.4 | Trigger configuration | Each notification individually switchable | |

## 19. Audit & Activity Logging

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 19.1 | Audit framework | Actor, timestamp, before/after values, reason; immutable through the application | |
| 19.2 | Coverage across 11 entity types | Registrations, accounts, schemes, orders, payments, vouchers, scans, commission lines, statements, rates, configuration | |
| 19.3 | Activity log viewer | Per account and per entity | |
| 19.4 | Audit export | For external or statutory audit | |

## 20. In-Product Documentation

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 20.1 | Illustrated user guide | Accessible from inside the portal, searchable | |
| 20.2 | Role-specific chapters | Agent, Admin, Finance, Staff | |
| 20.3 | Annotated screenshots & walkthroughs | Every major screen; registration, purchase, payment, redemption and commission flows | |

## 21. OTA Marketplace Integration *(optional)*

| # | Function | What it covers | Price (RM) |
|---|---|---|---|
| 21.1 | Provider configuration | Per marketplace, sandbox and production environments | |
| 21.2 | Product mapping | Platform products to marketplace SKUs | |
| 21.3 | Availability & price push | Outbound synchronisation | |
| 21.4 | Inbound order handling | Creation, reservation, confirmation, cancellation | |
| 21.5 | Marketplace redemption | Reconciled into the same redemption log | |
| 21.6 | API logging | Full request/response and availability query logging for dispute resolution | |

---

## 22. Platform & Delivery Items

Quote these separately from the functional modules — they are effort that is not a screen.

| # | Item | What it covers | Price (RM) |
|---|---|---|---|
| 22.1 | Database design & migrations | Schema, constraints, indexes, versioned reversible migrations, seed data | |
| 22.2 | Service-layer architecture | Framework-independent business logic layer, shared types, strict TypeScript | |
| 22.3 | UI design system | Layout shell, role-aware navigation, component library, responsive behaviour to 360px | |
| 22.4 | File storage & secure download | Private storage, authenticated download route, server-side type verification | |
| 22.5 | PDF generation | Statements and voucher print sheets | |
| 22.6 | Docker deployment package | Dockerfile, Compose, environment template, health check, rollback procedure | |
| 22.7 | Environment setup | Development, staging/UAT and production configuration | |
| 22.8 | Testing | Unit and integration coverage on the financial and commission paths | |
| 22.9 | UAT support | 36 acceptance tests, defect rectification cycle | |
| 22.10 | Training & handover | Administrator session, source code handover | |
| 22.11 | Documentation | Deployment guide, environment variable reference, this specification set | |

---

## 23. Optional Add-Ons

Quote only if the client wants them. Each is excluded from the core scope in
`PROJECT_SPEC_FULL.md` §33.

| # | Add-on | Price (RM) |
|---|---|---|
| 23.1 | Online payment gateway integration | |
| 23.2 | Automated bank payment file / bank API payout | |
| 23.3 | Accounting system integration (SAP / AutoCount / Xero) | |
| 23.4 | Native mobile app (iOS / Android) | |
| 23.5 | Additional language | |
| 23.6 | Multi-currency operation | |
| 23.7 | Historical data migration | |
| 23.8 | Retrospective commission calculation on pre-go-live redemptions | |
| 23.9 | Multi-tier / sub-agent commission cascade | |
| 23.10 | Tax computation & statutory tax reporting | |
| 23.11 | Turnstile / access-control hardware integration | |
| 23.12 | Annual support & maintenance retainer | |
| 23.13 | Hosting & managed infrastructure | |

---

## 24. Phase Grouping

If the client prefers to phase the investment, these are the natural breakpoints. Each phase
is independently useful.

| Phase | Modules | Delivers |
|---|---|---|
| **Phase 1 — Core portal** | 1, 2, 3, 4, 16, 17, 19, 22 | Agents register, are approved and can log in |
| **Phase 2 — Commerce** | 5, 6, 7 | Agents see the right catalogue and can order |
| **Phase 3 — Money & fulfilment** | 8, 9, 10, 18 | Payment control, vouchers, gate redemption |
| **Phase 4 — Becca commission** | 11 | Commission captured, statemented and settled |
| **Phase 5 — Insight & engagement** | 12, 13, 14, 15, 20 | Reports, dashboards, announcements, documentation |
| **Phase 6 — Optional** | 21, §23 | Marketplace integration and add-ons |

---

*End of function list.*
