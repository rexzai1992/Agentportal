# Becca Commission at POS — Full Module Specification

**Document type:** Module Scope of Work (quotation attachment)
**Parent system:** Agent Portal — B2B Travel Agent & Partner Ticketing Platform
**Module:** Becca Commission at Point of Sale
**Version:** 1.0
**Date:** 14 September 2026

> This document specifies the Becca Commission module in full — calculation, capture,
> statement, settlement, reporting, controls and screens. It is written to be attached to
> a quotation as the definitive scope for this module. Commercial terms are separate.

---

## 1. Module Purpose

### 1.1 What "becca" means in this system

**Becca** is the agent's margin on an attraction ticket — the gap
between the price the ticket is sold for at the point of sale and the nett scheme price the
agent paid the operator when buying wholesale.

```
Point-of-sale price            RM 100.00     ← what the end customer pays
Agent scheme (nett) price    − RM  75.00     ← what the agent paid the operator
──────────────────────────────────────────
Becca (agent commission)        RM  25.00
```

### 1.2 The core design decision — becca is earned at redemption, not at purchase

An agent may buy 500 vouchers and sell only 380. Commission is recognised **at the moment
a voucher is actually redeemed at the counter**, never at the moment of purchase.

| Approach | Consequence |
|---|---|
| Recognise at purchase (rejected) | Operator accrues commission on tickets that may never be used; unused vouchers create clawback disputes at expiry |
| **Recognise at redemption (specified)** | Commission matches actual footfall; expired vouchers simply never earn becca; no clawback mechanics required |

This single rule removes the most common source of agent–operator commission disputes.

### 1.3 Problems this module solves

| Problem today | How the module solves it |
|---|---|
| Agent margin tracked in spreadsheets, reconciled by hand each month | Becca is computed and stored automatically on every redemption |
| Disputes over how many tickets were actually used | Every commission line traces to a specific voucher serial, gate, staff user and timestamp |
| Price changes retroactively distort past commission | Becca amounts are frozen at redemption; later price edits never alter history |
| No segregation of duty on commission payouts | Statements follow the same Finance → Admin two-actor gate as offline payments |
| Agents have no visibility until the statement arrives | Agents see live becca earned in their own portal |
| Commission paid on complimentary or cancelled tickets | Explicit rules block accrual on non-qualifying vouchers |

---

## 2. Calculation Specification

### 2.1 The formula

```
Becca per redeemed voucher = POS sell price − Agent scheme price
```

Both inputs are fixed-precision decimal values. No floating-point arithmetic is used
anywhere in the money path.

### 2.2 Where each input comes from

| Input | Source | Notes |
|---|---|---|
| **POS sell price** | Product walk-in rate, **or** price keyed at the counter | Determined by the product's calculation mode (§2.3) |
| **Agent scheme price** | The scheme product price on the exact scheme revision the voucher was purchased under | Read from the voucher's originating purchase order line, not from the current scheme |

The second point matters: schemes are versioned. A voucher bought in January under revision 3
and redeemed in June — after revision 5 changed the price — is still valued at the
**revision 3 price**. The system resolves this automatically.

### 2.3 Calculation modes

Each product carries a becca calculation mode:

| Mode | Formula | Counter behaviour | Typical use |
|---|---|---|---|
| **FIXED_RATE** | Walk-in rate − scheme price | No price entry; counter staff just scan | Standard tickets with one published public rate |
| **POS_CAPTURED** | Price keyed at counter − scheme price | Counter staff enter the amount actually charged | Promotional pricing, negotiated group rates, variable packages |
| **FIXED_AMOUNT** | A flat commission amount per ticket | No price entry | Products where the operator pays a fixed ringgit commission regardless of price |
| **PERCENTAGE** | POS price × commission % | No price entry | Products commissioned on a percentage basis rather than a price gap |

All four modes are supported so the operator is not forced into one commercial structure.
Mode is set per product and may be overridden per scheme product where a specific agent
has a different arrangement.

### 2.4 Walk-in rate management

| Ref | Requirement |
|---|---|
| CALC-01 | A **walk-in rate** (published gate price) is maintained on every product |
| CALC-02 | Walk-in rates are **effective-dated** — a rate has a start date and optional end date |
| CALC-03 | Rate history is retained; changing a rate creates a new effective-dated record, never an overwrite |
| CALC-04 | Becca resolves the walk-in rate that was in force **on the redemption date** |
| CALC-05 | Future-dated rates can be entered in advance (e.g. school-holiday pricing) |
| CALC-06 | Bulk rate update across selected products with a common effective date |
| CALC-07 | Rate change audit — who changed it, from what, to what, when |

### 2.5 Worked examples

**Example A — Fixed rate, standard sale**

```
Product              Adult Day Pass
Walk-in rate         RM 100.00   (effective 01 Jan 2026)
Scheme price         RM  75.00   (Scheme SCH-A revision 3)
Calculation mode     FIXED_RATE
─────────────────────────────────────────────────────────
Becca per ticket      RM  25.00
40 tickets redeemed  RM 1,000.00
```

**Example B — POS captured, promotional sale**

```
Product              Adult Day Pass
Counter keyed price  RM  85.00   (school-holiday promo)
Scheme price         RM  75.00
Calculation mode     POS_CAPTURED
─────────────────────────────────────────────────────────
Becca per ticket      RM  10.00
```

**Example C — Percentage mode**

```
Product              Family Bundle
POS price            RM 280.00
Commission rate      12%
Calculation mode     PERCENTAGE
─────────────────────────────────────────────────────────
Becca per ticket      RM  33.60
```

**Example D — Historical price protection**

```
Voucher purchased    12 Jan 2026 under SCH-A revision 3 @ RM 75.00
Scheme revision 5    effective 01 Mar 2026, price raised to RM 82.00
Walk-in rate         RM 100.00 throughout
Voucher redeemed     18 Jun 2026
─────────────────────────────────────────────────────────
Becca applied         RM 100.00 − RM 75.00 = RM 25.00   ← revision 3 price, not revision 5
```

**Example E — Negative becca, blocked**

```
Walk-in rate         RM  70.00   (rate cut after the agent bought)
Scheme price         RM  75.00
─────────────────────────────────────────────────────────
Computed becca      − RM   5.00
Action               Redemption succeeds (customer is admitted).
                     Commission line written with becca = RM 0.00,
                     flagged NEGATIVE_BECCA, routed to an admin
                     exception queue for manual decision.
```

The customer is never turned away because of a pricing anomaly. The commercial problem is
handled separately from the gate operation.

---

## 3. Settlement Models

Settlement behaviour depends on **who takes the customer's money at the counter**. Three
configurations are supported.

### 3.1 Model 1 — Operator-collected (operator owes the agent)

```
Customer  →  pays the OPERATOR at the park counter (RM 100)
Agent     →  already paid the operator nett up front (RM 75)
Operator  →  owes the agent the becca (RM 25)
Settlement→  commission statement + payout run
```

Used when the agent refers customers to the park and the park's own staff handle the sale.
Becca accrues as an operator payable. Statements are raised per period and settled.

### 3.2 Model 2 — Agent-collected (nothing to settle)

```
Customer  →  pays the AGENT at the agent's own counter (RM 100)
Agent     →  already paid the operator nett up front (RM 75)
Agent     →  retains the becca in cash (RM 25)
Settlement→  none — reporting and reconciliation only
```

Used when the agent runs their own counter with pre-purchased vouchers. No money moves.
The module still records becca so both parties can reconcile volumes and margins.

### 3.3 Model 3 — Per outlet (mixed operation)

Each outlet carries its own settlement model. A redemption inherits the model of the outlet
where it occurred, and is recorded on the commission line so that historical reporting stays
correct even if an outlet's model changes later.

### 3.4 Settlement method options under Model 1

| Method | Behaviour |
|---|---|
| **Cash payout** | Statement is issued, verified by Finance, approved by Admin, paid out by bank transfer, marked Paid with the payment reference recorded |
| **Credit to account** | Net becca is credited to the agent's account balance and automatically offsets their next wholesale purchase order |
| **Hybrid** | Agent elects per statement — take the cash or roll it into credit; the election is recorded and approved |

---

## 4. Capture at the Point of Sale

### 4.1 Counter screen requirements

| Ref | Requirement |
|---|---|
| POS-01 | The existing Voucher Redeem screen is extended — QR camera scan or manual serial entry, unchanged for the operator |
| POS-02 | Entrance gate selection is captured and stored on the commission line |
| POS-03 | For **FIXED_RATE**, **FIXED_AMOUNT** and **PERCENTAGE** products, no extra input is required; the scan flow is unchanged and adds no keystrokes |
| POS-04 | For **POS_CAPTURED** products, a price field appears with the walk-in rate pre-filled as the default |
| POS-05 | The keyed price is validated against a configurable floor and ceiling per product; out-of-range entries are rejected with a clear message |
| POS-06 | A configurable variance threshold (e.g. more than 20% below walk-in rate) requires supervisor override with a reason |
| POS-07 | The redemption confirmation shows product, agent/company, serial, timestamp and — where the operator's policy allows — the becca earned |
| POS-08 | Display of becca on the counter screen is a permission-controlled setting, so margin can be hidden from junior counter staff |
| POS-09 | Scan-to-result performance target under 1 second; commission calculation must not slow the counter |
| POS-10 | Offline tolerance — if the commission write fails, the redemption still succeeds and the commission line is queued for reconciliation rather than lost |

### 4.2 Multi-ticket and group redemption

| Ref | Requirement |
|---|---|
| POS-11 | Batch redemption of multiple vouchers in one counter transaction (coach/group arrivals) |
| POS-12 | Each voucher in a batch produces its own commission line — never one aggregated line |
| POS-13 | A batch is atomic: if one voucher in the batch is invalid, the operator is shown which one and may proceed with the remainder |
| POS-14 | Batch reference recorded on every line so a group arrival can be reconstructed |

### 4.3 Data recorded on every commission line

| Field | Description |
|---|---|
| Commission line reference | Unique identifier |
| Voucher serial number | The voucher redeemed |
| Product | Ticket type |
| Agent / Partner account | Owner of the voucher, with account code |
| Purchase order reference | Where the voucher originated |
| Scheme + revision | Which scheme revision priced it |
| Outlet | Where redeemed |
| Entrance gate | Which gate |
| Staff user | Who processed the redemption |
| Redeemed at | Date and time |
| Calculation mode | FIXED_RATE / POS_CAPTURED / FIXED_AMOUNT / PERCENTAGE |
| POS sell price | Walk-in rate or keyed price |
| Scheme price | Nett price paid by the agent |
| Commission rate | Where percentage mode applies |
| **Becca amount** | The calculated commission |
| Settlement model | The model in force at redemption |
| Status | ACCRUED / STATEMENTED / SETTLED / VOID / EXCEPTION |
| Exception flag | NEGATIVE_BECCA, MISSING_RATE, VARIANCE_OVERRIDE, etc. |
| Statement reference | Populated when swept into a statement |
| Batch reference | For group redemptions |

---

## 5. Commission Statements

### 5.1 Statement generation

| Ref | Requirement |
|---|---|
| STMT-01 | Statements are generated per agent account, per period |
| STMT-02 | Period frequency follows the account's agreement type — **Weekly** or **Monthly** — or a manual ad-hoc period |
| STMT-03 | Generation sweeps all ACCRUED commission lines with a redemption date inside the period |
| STMT-04 | Generation can be run for one agent, a selected set, or all eligible agents at once |
| STMT-05 | A commission line can belong to **exactly one** statement; double-sweep is prevented at database level |
| STMT-06 | A period cannot be statemented while it still contains unresolved EXCEPTION lines, unless an admin explicitly defers them to the next period |
| STMT-07 | Late-arriving lines for a closed period roll into the next statement as clearly-labelled prior-period adjustments |
| STMT-08 | Zero-activity agents produce either no statement or a nil statement, per configuration |

### 5.2 Statement contents

```
COMMISSION STATEMENT                            CS-2026-09-A20260001
──────────────────────────────────────────────────────────────────────
Agent            Sunrise Travel Sdn Bhd  (A20260001)
Period           01 Sep 2026 – 30 Sep 2026
Settlement model Operator-collected
Generated        01 Oct 2026 by admin@owg

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

Status  DRAFT → ISSUED → FINANCE VERIFIED → APPROVED → PAID
```

| Ref | Requirement |
|---|---|
| STMT-09 | Header — agent name and account code, period, settlement model, generation timestamp and actor, statement reference |
| STMT-10 | Summary by product — quantity redeemed, unit becca, gross becca |
| STMT-11 | Optional breakdown by outlet, by entrance gate and by date |
| STMT-12 | Full supporting line detail — every voucher serial, downloadable |
| STMT-13 | Adjustment section with running net |
| STMT-14 | Net payable and current status |
| STMT-15 | Export to **PDF** for sending to the agent and **Excel** for the operator's finance team |

### 5.3 Adjustments

| Ref | Requirement |
|---|---|
| ADJ-01 | Manual adjustment lines can be added to a DRAFT statement — positive or negative |
| ADJ-02 | Every adjustment requires a category (Dispute, Clawback, Goodwill, Correction, Prior period, Other) and a free-text reason |
| ADJ-03 | Adjustments above a configurable threshold require a second approver |
| ADJ-04 | Adjustments are immutable once the statement is issued; corrections are made by a further adjustment, never by editing history |
| ADJ-05 | Every adjustment records its author and timestamp |
| ADJ-06 | Voiding a commission line after statementing creates an automatic prior-period adjustment on the next statement |

### 5.4 Statement lifecycle

```
   DRAFT  ──issue──▶  ISSUED  ──finance verify──▶  FINANCE VERIFIED
     │                  │                              │
     │                  │                        admin approve
     │                  │                              ▼
     │                  │                          APPROVED
     │                  │                              │
     │                  │                        record payment
     │                  │                              ▼
     │                  │                            PAID
     ▼                  ▼
  CANCELLED          DISPUTED ──resolve──▶ back to ISSUED
```

| State | Meaning | Who acts |
|---|---|---|
| **DRAFT** | Generated, editable, adjustments allowed | Admin |
| **ISSUED** | Locked and visible to the agent | Admin |
| **DISPUTED** | Agent has raised a query; resolution required | Agent raises, Admin resolves |
| **FINANCE VERIFIED** | Finance has checked the figures | Finance |
| **APPROVED** | Approved for payment | Admin |
| **PAID** | Paid out, with payment reference and date recorded | Finance |
| **CANCELLED** | Voided before issue; lines return to ACCRUED for re-sweep | Admin |

| Ref | Requirement |
|---|---|
| LIFE-01 | Finance verification and Admin approval **must** be performed by two different user accounts — enforced server-side |
| LIFE-02 | This mirrors the existing offline-payment two-actor control, so the operator's finance team learns no new pattern |
| LIFE-03 | Every transition writes an immutable history record: from-state, to-state, actor, timestamp, remarks |
| LIFE-04 | Payment recording captures payment date, method, bank reference and optional payment advice upload |
| LIFE-05 | Email notification to the agent on ISSUED and on PAID |
| LIFE-06 | Backwards transitions are not permitted except the explicit DISPUTED resolution path |

---

## 6. Agent-Facing Features

| Ref | Requirement |
|---|---|
| AGT-01 | **My Commission** dashboard card — becca earned in the current period, last statement status, amount outstanding |
| AGT-02 | Live commission ledger — every redeemed voucher with its becca, filterable by date, product, outlet |
| AGT-03 | Statement history list with status badges and downloadable PDF / Excel |
| AGT-04 | Statement detail view with product summary, adjustments and supporting lines |
| AGT-05 | **Raise a dispute** on an issued statement, with reason and optional supporting attachment |
| AGT-06 | Dispute thread visible to both parties until resolved |
| AGT-07 | Where the hybrid settlement method is enabled, the agent elects cash payout or account credit per statement |
| AGT-08 | Under the agent-collected model, the same screens appear as margin reporting with no payout figures |
| AGT-09 | Agents see **only** their own commission data — enforced server-side on every request |

---

## 7. Reporting

All reports support date-range, account, product, outlet and gate filters, quick search,
paging, TOTAL rows and **Export to Excel**.

| Ref | Report | Contents |
|---|---|---|
| RPT-01 | **Becca Commission Summary** | Becca by agent for a period — redeemed volume, gross becca, adjustments, net |
| RPT-02 | **Becca Commission Detail** | Line level — every redemption with serial, product, gate, staff, prices and becca |
| RPT-03 | **Becca by Product** | Which products generate the most commission; unit margin comparison |
| RPT-04 | **Becca by Outlet / Gate** | Commission concentration by location; supports gate staffing decisions |
| RPT-05 | **Statement Register** | All statements with status, net payable, ageing of unpaid statements |
| RPT-06 | **Settlement / Payout Report** | Paid statements with payment date, method and bank reference |
| RPT-07 | **Accrual Report** | Unstatemented ACCRUED becca — the operator's current commission liability |
| RPT-08 | **Exception Report** | Negative becca, missing walk-in rate, variance overrides, unreconciled lines |
| RPT-09 | **Reconciliation Report** | Redeemed vouchers with no commission line, and commission lines with no matching redemption |
| RPT-10 | **Adjustment Register** | All adjustments by category, agent and author, with reasons |
| RPT-11 | **Margin Analysis** | Walk-in revenue vs nett revenue vs commission paid, by period |
| RPT-12 | **Agent Performance** | Purchased vs redeemed vs expired vouchers per agent, with redemption rate and becca yield |

---

## 8. Business Rules & Controls

### 8.1 Accrual rules

| Ref | Rule |
|---|---|
| RULE-01 | Becca accrues **only** on a successful, first-time redemption |
| RULE-02 | Rejected scans — already redeemed, expired, locked, not found, invalid signature — accrue nothing |
| RULE-03 | One voucher produces at most one commission line; enforced by a unique constraint, not by application logic alone |
| RULE-04 | Complimentary vouchers accrue zero becca by default; a grant may be explicitly marked commission-bearing |
| RULE-05 | Expired and unredeemed vouchers never accrue becca |
| RULE-06 | Vouchers from cancelled or refunded purchase orders are excluded |
| RULE-07 | Becca is frozen at redemption; later edits to walk-in rates, scheme prices or product data never alter existing lines |
| RULE-08 | Negative becca is recorded as zero, flagged and routed to the exception queue |
| RULE-09 | Where no walk-in rate is effective on the redemption date, the line is flagged MISSING_RATE and held at zero pending correction |
| RULE-10 | Voiding a commission line requires a reason and an approver, and is never a silent delete |

### 8.2 Segregation of duty

| Ref | Control |
|---|---|
| CTRL-01 | Counter staff can redeem but cannot see or alter commission configuration |
| CTRL-02 | Finance verifies but cannot generate or approve statements |
| CTRL-03 | Admin generates and approves but cannot mark a statement Paid |
| CTRL-04 | The same user cannot both verify and approve a statement |
| CTRL-05 | Walk-in rate changes are restricted to a dedicated permission, separate from general product editing |
| CTRL-06 | Supervisor override at POS requires a distinct credential, not the counter user's own |

### 8.3 Audit

| Ref | Requirement |
|---|---|
| AUD-01 | Immutable audit trail on every commission line creation, void and status change |
| AUD-02 | Immutable audit trail on every statement transition |
| AUD-03 | Immutable audit trail on every adjustment |
| AUD-04 | Immutable audit trail on every walk-in rate change |
| AUD-05 | Every audit record carries actor, timestamp, before-value, after-value and reason where applicable |
| AUD-06 | Audit records cannot be edited or deleted through the application by any role |
| AUD-07 | Audit export for external or statutory audit |

### 8.4 Edge cases handled

| Scenario | System behaviour |
|---|---|
| Voucher redeemed after the agent account expires | Becca still accrues — the agent paid for the voucher and the customer is admitted |
| Scheme revision changes between purchase and redemption | Original revision price is used (Example D) |
| Walk-in rate changes between purchase and redemption | Rate effective on the **redemption** date is used |
| Product deactivated after vouchers sold | Redemption and accrual proceed normally |
| Outlet changes settlement model mid-period | Each line keeps the model in force at its own redemption time |
| Duplicate scan of the same voucher | Second scan rejected; no second commission line possible |
| Redemption written but commission write fails | Redemption stands; line queued and surfaced in the Reconciliation Report |
| Statement issued, then a line is found to be invalid | Line voided; automatic prior-period adjustment on the next statement |
| Agent disputes a statement after approval | Dispute recorded; resolution by adjustment on the next statement, never by rewriting the approved one |
| Period closed with exceptions outstanding | Statement blocked unless an admin explicitly defers the exceptions |

---

## 9. Configuration Settings

| Ref | Setting | Scope |
|---|---|---|
| CFG-01 | Default becca calculation mode | System, overridable per product and per scheme product |
| CFG-02 | Settlement model | System, or per outlet |
| CFG-03 | Settlement method — payout / credit / hybrid | System, overridable per agent |
| CFG-04 | Statement period frequency | System default, overridable per agent |
| CFG-05 | Statement generation day (e.g. 1st of month, every Monday) | System |
| CFG-06 | POS price floor and ceiling | Per product |
| CFG-07 | Variance threshold requiring supervisor override | System |
| CFG-08 | Display becca on the counter screen | Per role |
| CFG-09 | Complimentary voucher commission treatment | System default, overridable per grant |
| CFG-10 | Adjustment value requiring a second approver | System |
| CFG-11 | Nil-statement generation on / off | System |
| CFG-12 | Email notification triggers | System |

---

## 10. Screens Delivered

| # | Screen | Role |
|---|---|---|
| 1 | Walk-in rate maintenance — per product, effective-dated, with history | Admin |
| 2 | Bulk walk-in rate update | Admin |
| 3 | Becca configuration — modes, thresholds, settlement models | Admin |
| 4 | Extended Voucher Redeem screen with optional price capture and gate selection | Staff |
| 5 | Supervisor override dialog | Staff / Supervisor |
| 6 | Commission ledger — all accrued lines, filterable | Admin |
| 7 | Exception queue — negative becca, missing rates, unreconciled lines | Admin |
| 8 | Statement generation screen — period, agent selection, preview before commit | Admin |
| 9 | Statement detail — summary, adjustments, supporting lines, status actions | Admin |
| 10 | Adjustment entry dialog | Admin |
| 11 | Finance verification queue | Finance |
| 12 | Payment recording screen | Finance |
| 13 | Statement register | Admin / Finance |
| 14 | Agent **My Commission** dashboard card | Agent |
| 15 | Agent commission ledger | Agent |
| 16 | Agent statement history and detail | Agent |
| 17 | Dispute raising and thread view | Agent / Admin |
| 18 | 12 report screens (RPT-01 to RPT-12) with Excel export | Admin / Finance |

---

## 11. Integration with the Existing Portal

This module extends the platform already specified; it does not replace anything.

| Existing component | Extension |
|---|---|
| Product master | Adds walk-in rate history, calculation mode, price floor/ceiling |
| Scheme product | Optional per-agent calculation mode override |
| Outlet master | Adds settlement model |
| Voucher redemption | Extended to capture price and write the commission line |
| Redemption audit log | Linked to commission lines |
| Agent account | Adds commission settings and, under credit settlement, balance offsetting |
| Offline payment approval pattern | Reused as the statement approval pattern — same two-actor control |
| Report shell and Excel export | Reused for all 12 new reports |
| Email driver | Reused for statement issued / paid notifications |
| Activity log | Extended to cover commission events |

No change is required to registration, purchase, payment or voucher issuance workflows.

---

## 12. Non-Functional Requirements

| Area | Requirement |
|---|---|
| **Counter performance** | Commission calculation must add no perceptible delay; scan-to-result stays under 1 second |
| **Accuracy** | All monetary values stored as fixed-precision decimals; rounding applied once, at line level, using a single documented rule |
| **Volume** | Sized for tens of thousands of commission lines per month and hundreds of statements per period |
| **Statement generation** | A full monthly run across all agents completes within the operator's overnight window |
| **Resilience** | A commission write failure never blocks a redemption; failed writes are queued and reconciled |
| **Security** | Commission data is role-scoped server-side; agents can reach only their own lines and statements |
| **Retention** | Commission lines, statements and audit records retained for the operator's statutory period |
| **Exports** | PDF and Excel exports reproduce on-screen figures exactly |

---

## 13. Deliverables for This Module

1. Walk-in rate management with effective dating, history and bulk update
2. Becca calculation engine supporting all four modes with historical price resolution
3. Extended POS redemption capture including price entry, validation and supervisor override
4. Batch / group redemption handling
5. Commission ledger with exception queue and reconciliation
6. Statement generation, adjustments and the full DRAFT → PAID lifecycle
7. Finance verification and payment recording, with two-actor enforcement
8. Agent-facing commission dashboard, ledger, statements and dispute workflow
9. Twelve reports with Excel export, plus statement PDF
10. Configuration screens for all settings in Section 9
11. Complete audit trail across lines, statements, adjustments and rates
12. User-guide chapters covering the counter flow, the admin flow and the finance flow
13. Database migrations and seed data for the new structures

---

## 14. Implementation Sequence

| Stage | Content | Exit criteria |
|---|---|---|
| **B1** | Walk-in rates, calculation modes, configuration | Rates maintainable with history; modes selectable per product |
| **B2** | Calculation engine and commission line capture at redemption | A redemption produces a correct, frozen commission line |
| **B3** | POS price capture, validation, override, batch redemption | Counter can process variable-price and group redemptions |
| **B4** | Commission ledger, exception queue, reconciliation | Every redemption is accounted for or explicitly flagged |
| **B5** | Statement generation and adjustments | A period sweeps cleanly into a draft statement |
| **B6** | Statement lifecycle, Finance verification, payment recording | A statement can be taken from draft to paid by two users |
| **B7** | Agent-facing screens and dispute workflow | Agent sees live becca and can query a statement |
| **B8** | Reports, exports, PDF statement | All 12 reports reconcile against source data |
| **B9** | UAT, training, documentation | Signed acceptance |

---

## 15. Acceptance Criteria

The module is accepted when the following are demonstrated end to end:

1. A walk-in rate is set with a future effective date; a redemption before that date uses the old rate and one after uses the new rate.
2. A voucher bought under scheme revision 3 and redeemed after revision 5 takes effect is valued at the revision 3 price.
3. A fixed-rate redemption adds no extra keystrokes at the counter and produces the correct becca.
4. A POS-captured redemption accepts a keyed price, rejects a price outside the configured range, and requires supervisor override beyond the variance threshold.
5. A group of 20 vouchers redeemed in one batch produces 20 individual commission lines under one batch reference.
6. A duplicate scan is rejected and produces no second commission line.
7. A negative-becca scenario admits the customer, records zero becca and appears in the exception queue.
8. A complimentary voucher redemption produces a zero-becca line.
9. A monthly statement sweeps exactly the qualifying lines, and those lines cannot be swept into a second statement.
10. An adjustment is added with a reason, is reflected in the net payable, and cannot be edited after issue.
11. Finance verification and Admin approval by the same user is rejected; by two users it succeeds.
12. The statement is marked Paid with a bank reference, and the agent sees the paid status and downloads the PDF.
13. An agent disputes a statement; the dispute is recorded and resolved by an adjustment on the following period.
14. All 12 reports return figures that reconcile to the commission ledger and export to Excel without loss.
15. An agent attempting to read another agent's commission data via the API is refused.

---

## 16. Assumptions

1. Walk-in / gate rates for all products are supplied by the client as master data at module start.
2. The commercial structure — which calculation mode and settlement model applies to which product and agent — is confirmed during stage B1.
3. Commission payouts are executed through the client's existing banking process; no bank API integration is assumed.
4. Statement PDFs use a standard template; heavy corporate-identity design work is supplied by the client.
5. Counter hardware and network are adequate for the stated performance targets.
6. Tax treatment of commission (SST or withholding, if any) is confirmed by the client's finance team during B1.

---

## 17. Out of Scope

Not included in this module unless separately quoted:

- Automated bank payment file generation or bank API payout
- Accounting-system posting of commission accruals (SAP, AutoCount, Xero and similar)
- Multi-tier or sub-agent commission cascades
- Commission on products sold outside this platform
- Tax computation and statutory tax reporting
- Currency conversion or multi-currency commission
- Retrospective commission calculation on historical redemptions predating go-live
- Automated dispute resolution logic — disputes are recorded and worked by people

---

## 18. Items for Client Confirmation

Configuration decisions only. None changes the scope or the effort; all can be settled in
stage B1.

| # | Decision | Options |
|---|---|---|
| 1 | Default calculation mode | Fixed walk-in rate / POS-captured / Fixed amount / Percentage |
| 2 | Who collects the cash at the counter | Operator-collected / Agent-collected / Mixed per outlet |
| 3 | Settlement method | Cash payout / Credit to account / Hybrid by agent election |
| 4 | Statement period | Weekly / Monthly / Per agreement type |
| 5 | Complimentary voucher treatment | Zero becca / Commission-bearing |
| 6 | Show becca on the counter screen | Yes / No / By role |
| 7 | Variance threshold requiring override | Percentage below walk-in rate |
| 8 | Adjustment value requiring a second approver | Ringgit threshold |
| 9 | Negative becca policy | Zero and flag / Block redemption / Allow negative |
| 10 | Tax treatment of commission | Confirmed by client finance |

---

*End of module specification.*
