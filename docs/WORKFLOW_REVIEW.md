# Workflow and approval review

Review started: 2026-09-11. Evidence: local source code only; runtime and deployed behavior have not been tested. Existing local changes are included in the inspected state.

User direction: review workflows one by one, require multilevel approvals, and remove dead ends and inconsistent behavior. Approval roles and levels remain to be agreed per workflow before implementation.

Updated product decision: the user explicitly clarified that product creation does NOT need review. Bulk product creation is implemented as a single Admin action, with optional automatic scheme inclusion. Earlier proposed product-approval stages below are superseded. Approval policy for separate scheme management and other workflows is still open.

## Review sequence

1. Agent / partner registration, revision, activation, credential delivery, and initial scheme assignment.
2. Purchase schemes, pricing revisions, and account bindings.
3. Ticket purchase and order eligibility.
4. Payment submission, Finance verification, final approval, revision, and voucher issuance.
5. Complimentary grants.
6. Renewal and account status / expiry changes.
7. Voucher redemption and exception handling.
8. Other administration, legacy booking paths, reports, and navigation consistency.

## First flow: registration

Current path: applicant submits documents → one Admin approves → active Agent and User records created → temporary password generated → notification → separate manual scheme assignment.

Confirmed gaps:

- Only one reviewer is recorded. There are no sequential approval levels in `backend/services/registration.service.ts` or the registration schema.
- REVISION is available to Admin, but the public application routes provide create and status only. There is no applicant correction/resubmission path for the same application.
- `backend/services/email/email.service.ts` implements only a console driver, including outside demo mode. Promised credential and revision emails are not delivered to an inbox by this implementation.
- Approval does not assign a purchase scheme. `getPurchaseCatalog` returns an empty list when there are no assignments. Activation therefore does not mean the account can buy tickets; onboarding needs an explicit pricing handoff.
- Registration status/account creation commit before temporary-password setup. A failure at that boundary can leave an approved account without usable credentials; retrying approval is blocked.
- Only APPROVED is protected against further decisions. Rejected applications can subsequently be approved without an explicit reopen/resubmit transition.

Proposed path for discussion: submit → level 1 document review → level 2 final approval → credentials and scheme setup → ready to purchase. Revision returns to the applicant and resubmission restarts review; rejection closes the request unless explicitly reopened. Preserve each decision and actor. Separate reviewers must be enforced by the server.

Acceptance checks after policy and implementation: normal approval, revision/resubmit, rejection/reopen policy, unauthorized/skipped/self approval, duplicate/concurrent approval, document access, credential-delivery failure/retry, and first purchasable catalog.

## Preliminary findings for later flows

These are source findings, not completed end-to-end reviews.

| Area | Existing behavior | Gap |
| --- | --- | --- |
| Payment | Paid timestamp required before approval | Mark-paid API allows ADMIN as well as FINANCE; approval service does not require a different actor. One Admin can perform both steps. |
| Payment transitions | Submission, mark-paid, and approval methods exist | Services lack current-state guards; submission can move an already confirmed order back to pending, and final decisions can be overwritten. |
| Complimentary | Admin creation sets APPROVED and issues vouchers immediately | No review stages. |
| Renewal | One Admin decision updates account | No multilevel chain; no final-state guard. Submission does not enforce the profile's renewal window. |
| Account maintenance | Admin directly changes status/expiry | No review stages. |

No business logic or approval policy has been changed by this review.

## Product and scheme creation review

Source review completed 2026-09-11; runtime verification remains pending. Product means the TicketType managed at `/products`.

Current sequence: active outlet → Admin creates active product → Admin creates active scheme/revision → Admin binds scheme to account → catalog → purchase.

### Product findings

- `frontend/app/api/ticket-types/route.ts` validates an active outlet, required fields, unique SKU, allowed category, and positive finite price. These are useful existing guards.
- Creation immediately sets `active: true`; no draft, review, rejection, revision, or approval history exists.
- `/products` provides create and list only. No product edit/deactivation route or UI was found in the inspected application routes.
- Creation hardcodes cost equal to selling price, commission to 10%, and validity to FIXED_DATE. The form cannot configure these values. Voucher issuance separately hardcodes one-year expiry, so product validity is not a connected policy.
- Agent catalog does not filter inactive products or inactive outlets.

### Scheme findings

- `backend/services/scheme.service.ts` immediately activates schemes and revisions. Status changes and bindings also bypass approvals.
- Scheme validation only requires code/name and at least one product (revisions require products). Server validation is missing for price bounds, integer quantity limits, min/max consistency, rate bounds, duplicate products, effective-date policy, and active product/outlet eligibility.
- Catalog respects revision effective dates but ignores assignment effective dates. A future assignment can expose prices today.
- `createPurchaseOrder` loads scheme-product IDs without checking assignment to the purchasing agent, active scheme/product/outlet, effective dates, or whether the revision is current. The API's active-account guard does not cover these checks. This allows catalog restrictions to be bypassed through a direct request.
- Scheme detail API permits any AGENT to read any scheme ID, including prices and revisions, without assignment filtering.
- Binding UI says Add New Revision, but the service upserts the same scheme/account/type row, replacing its effective date and incentive without revision history.
- Binding incentive and STANDARD/SPECIAL labels are stored but not used by catalog/pricing calculations. No special-over-standard precedence is implemented.
- New scheme revisions start with an empty product list and replace the entire catalog for that scheme when effective. Omitted products disappear; the UI does not explain this or copy the previous revision. Incentive is reset to null on picked products and cannot be edited in the revision form; discount is also absent from that form.
- Revision save/status actions lack user-facing error handling; revision save also lacks an in-flight submission guard.

### Proposed approval flow for discussion

Product: draft → level 1 product/outlet/validity review → level 2 final approval → active product. Later edits should create a reviewed version; deactivation needs explicit handling for new sales versus already issued vouchers.

Scheme: draft from approved products → level 1 pricing/quantity/incentive review → level 2 final approval → scheduled activation → approved account assignment → eligible catalog. Price revisions retain the live version until approved and effective. Assignment changes preserve history and effective dates.

Approval-role ownership is not yet specified. Do not treat these proposed roles or stages as agreed implementation policy.

Acceptance checks: rejected/unapproved products and schemes cannot sell; future assignments stay unavailable; stale/unassigned/inactive IDs fail at checkout; invalid pricing and quantity rules are rejected; revisions preserve intended products/rates; assignment history survives updates; approval stages require distinct authorized actors; duplicate/concurrent submission is safe.

## Implemented: bulk product creation without review

- `/products`: choose one outlet and optional scheme; enter up to 200 product rows, copy/remove rows, import `.xlsx`, and create once. Description and image are optional shared fields. Copy clears SKU to avoid accidental duplicates.
- Draft save/restore is local to the browser and signed-in user; drafts are not products and have no review queue.
- `POST /api/ticket-types/batch`: Admin-only, server validation with row-specific errors, unique SKUs, active outlet/scheme checks, transactional creation and activity log. Invalid or conflicting batches do not partially save.
- When a scheme is selected, a new revision includes every existing product/rate plus new rows. Scheme price defaults to base price unless overridden. A scheduled latest revision retains its future effective date; the page explains this and creation returns the effective timestamp.
- Existing single-product API remains compatible. Product cost/commission defaults and one-year voucher validity remain as before; this change does not claim to resolve the other audit findings.
- `.xlsx` import previews values only, accepts Name/SKU/Type/Price and optional Scheme Price headers, rejects formula/error cells, and limits file size and row count.
- Verification: TypeScript check; local admin login and product/outlet/scheme APIs; database integration test covering multiple products, invalid/duplicate rows, atomic failure, preserved scheme prices, price overrides/defaults, concurrent duplicate submission, inactive outlets, and Excel parsing. Test records are removed after execution.
- Local launch: `cd frontend && npm run dev -- --hostname 127.0.0.1`; existing `offline-ota-postgres` container must be running. No database migration needed.

## Implemented: catalog and checkout eligibility

- Catalog and checkout share one resolver: current active account, non-expired account, effective assignment, active scheme, latest active revision effective now, active product, and active outlet.
- Future assignments no longer expose prices early. Old revision IDs, unassigned IDs, future revision IDs, and inactive products/outlets/schemes are rejected at checkout, even when submitted directly through the API.
- Checkout reads eligibility and writes the order plus activity record in one serializable transaction. Transaction conflicts return a refresh/retry message.
- Quantities must be positive whole numbers within scheme limits. Duplicate cart rows are rejected so splitting an item cannot bypass its quantity limit. Quantities are no longer silently changed by the server.
- Ticket Purchase exposes a refresh action that clearly states it clears the cart, displays catalog failures even when the list is empty, and explains effective-date/availability causes for an empty catalog.
- Validation: TypeScript; `frontend/tests/purchase-eligibility.integration.ts` on local PostgreSQL, covering successful pricing plus assignment/revision/status/expiry and quantity rejection; local agent login/catalog HTTP checks and invalid checkout rejection.
- No schema migration or product-approval step introduced. Other audit findings, including scheme binding history and incentive policy, remain separate work.
