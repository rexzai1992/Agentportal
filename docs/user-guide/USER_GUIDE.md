# Travel Agent Portal — User Guide

A simple step-by-step guide for **everyone who uses the portal**: Agents, Partners, Admin, Finance, and Gate Staff — from registration all the way to redeeming the voucher QR at the gate.

---

## 1. Who uses this system?

| Role | What they do | Login |
|---|---|---|
| **Agent** | Registers with KPL + SSM documents, buys tickets, pays offline, prints vouchers | Account code e.g. `A20260001` |
| **Partner** | Same as agent, but only needs an SSM document | Account code e.g. `P20260001` |
| **Admin** | Approves registrations, creates schemes, approves payments, issues complimentary tickets, views reports | Email |
| **Finance** | Checks the bank slip and marks the payment as *Paid* | Email |
| **Staff** | Redeems the voucher QR / serial number at the entrance gate | Email |

### The full journey at a glance

```
 AGENT/PARTNER          ADMIN                AGENT             FINANCE          ADMIN            STAFF
 ┌────────────┐   ┌───────────────┐   ┌──────────────┐   ┌─────────────┐   ┌───────────┐   ┌────────────┐
 │ 1. Register │ → │ 2. Approve &  │ → │ 3. Buy tickets│ → │ 4. Mark the │ → │ 5. Approve│ → │ 6. Redeem  │
 │ + documents │   │ send password │   │ + upload slip │   │ payment Paid│   │ payment → │   │ voucher QR │
 └────────────┘   └───────────────┘   └──────────────┘   └─────────────┘   │  vouchers │   │  at gate   │
                                                                            └───────────┘   └────────────┘
```

### Demo accounts

| Role | Username | Password |
|---|---|---|
| Admin | `admin@travel-agent.demo` | `admin123!` |
| Agent | `A20260001` | `agent123!` |
| Partner | `P20260001` | `partner123!` |
| Finance | `finance@travel-agent.demo` | `finance123!` |
| Staff | `staff@travel-agent.demo` | `staff123!` |

---

## 2. Agent & Partner — How to Register

### Step 1 — Open the portal

Go to the login page. You will see three buttons: **Become an Agent**, **Become a Partner**, and **Check Application Status**.

![Login page](images/01-login.png)

> **Agent or Partner?**
> - **Agent** → must upload **KPL Form + SSM Form**
> - **Partner** → only needs the **SSM Form**

### Step 2 — Accept the Terms and Conditions

Click **Become an Agent** (or **Become a Partner**). Read the terms, prepare your documents, and click **Accept**.

![Terms and conditions](images/02-register-terms.png)

### Step 3 — Fill in your Company Information

Enter your company name, registration number, email, KPL license (agents only), contact number, and address. Click **Save and Next**.

![Company information](images/03-register-company.png)

### Step 4 — Upload the Required Documents

Drag and drop your **KPL Form** and **SSM Form** (JPG, PNG, or PDF, max 5 MB). A green tick appears when the upload is done. Click **Save and Next**.

![Upload documents](images/04-register-documents.png)

### Step 5 — Add your Contact Person

Fill in the name, email, and phone number. You can add up to **3** contact persons. Click **Save and Next**.

![Contact person](images/05-register-contact.png)

### Step 6 — Company Background & Submit

Target Market and Sales Channel are optional. Tick the **Privacy Policy & Terms** box, then click **Submit**.

![Company background](images/06-register-background.png)

### Step 7 — Save your Application ID

You will see a success screen with your **Application ID**. **Write this ID down** — you need it to check your status. A confirmation email is also sent to you.

![Registration success](images/07-register-success.png)

### Step 8 — Check your Application Status

Anytime, click **Check Application Status** on the login page and enter your Application ID.

![Check application status](images/08-check-status.png)

| Status | Meaning |
|---|---|
| 🟡 **PENDING** | Under review — no action needed |
| 🟢 **APPROVED** | Check your email for your username + temporary password |
| 🟡 **REVISION** | Something needs fixing — check your email for remarks |
| 🔴 **REJECTED** | Application declined — check your email |

### Forgot your password?

Click **Forgot password?** on the login page, enter your username + email, and a **temporary password** will be emailed to you.

![Forgot password](images/09-forgot-password.png)

---

## 3. Admin — Approving Registrations

Login as **Admin**. The dashboard shows pending agent requests, pending partner requests, totals, and pending payment approvals. Click any card to jump to that page.

![Admin dashboard](images/10-admin-dashboard.png)

### Step 1 — Open the request queue

Go to **Agent Requests** (or **Partner Requests**) in the sidebar. You can search and filter by status.

![Agent requests queue](images/11-admin-agent-requests.png)

### Step 2 — Review the application

Click **Review**. You can see the company details, **open the uploaded KPL/SSM documents**, and see the contact persons.

![Review registration](images/12-admin-registration-review.png)

### Step 3 — Approve, Reject, or ask for Revision

In the **Verification** panel choose:
- **Approve** — no remarks needed
- **Rejected** / **Revision** — remarks are **required**

When you click **Approve**, the system automatically:
1. Creates the account with a code like `A20260002` / `P20260002`
2. Emails the applicant their **username + temporary password** (valid 24 hours)

![Registration approved](images/13-admin-registration-approved.png)

### Step 4 — See the account in Active Agents / Active Partners

![Active agents](images/14-admin-active-agents.png)

Click **View** to open the account — here you can change the **account status** and **expiry date**.

![Account detail](images/15-admin-account-detail.png)

---

## 4. Admin — Purchase Schemes (what agents can buy)

Agents can only buy products that are inside a **scheme bound to their account**. Do this once per agent/partner.

### Step 1 — Create a Purchase Scheme

Go to **Purchase Schemes** → **New Purchase Scheme**. Give it a code + name, pick an effective date, click **Add Product**, and set the **price, min/max quantity, and incentive %** per product. Click **Save**.

![Purchase schemes](images/17-admin-purchase-schemes.png)

Click **View** on a scheme to change its status (Active/Inactive) or add a **new revision** (new prices from a new effective date).

![Scheme detail](images/18-admin-scheme-detail.png)

### Step 2 — Bind the scheme to an account

Open the account (**Active Agents** → **View**) → click **View / Bind Scheme** → **Add New Revision** → choose the effective date, the scheme, and an optional incentive. There are **Standard** and **Special** tabs.

![Bind scheme](images/16-admin-bind-scheme.png)

---

## 5. Admin — Announcements

Go to **Announcements** → **Add New Announcement**.

- **Display Type = Home Page** → shows as a **popup + list** on agent/partner dashboards (choose the audience: Agent / Partner / both)
- **Display Type = Login Page** → shows on the login page
- Set effective + expiry dates, optionally attach a JPG/PDF, and set status Active

![Announcements](images/19-admin-announcements.png)

---

## 6. Agent & Partner — Buying Tickets

### Step 1 — First login

Login with your **account code** (e.g. `A20260002`) and the **temporary password** from your email. You will be asked to **change your password** first (min 5 characters, with uppercase, lowercase, number, and a special character).

![Change password](images/40-change-password.png)

### Step 2 — Dashboard

Home announcements pop up when you land on your dashboard.

![Announcement popup](images/30-agent-dashboard-popup.png)

The dashboard also shows your **Pending Approvals**, **Incomplete Orders**, and **Today's Purchases**.

![Agent dashboard](images/31-agent-dashboard.png)

### Step 3 — Buy tickets

Go to **Ticket Purchase**. Pick the product type, enter a quantity (the **min/max** per item is shown), and click **Add**. Your cart appears in the **Order Summary** on the right. Click **Submit**.

![Ticket purchase](images/32-ticket-purchase.png)

### Step 4 — Transaction Review

You are taken to the **Transaction Review** page: reference number, status, all line items, totals, and the **bank information** for your transfer.

![Transaction review](images/33-transaction-review.png)

### Step 5 — Pay Offline

After making your bank transfer, click **Pay Offline**:
1. Upload your **proof of payment** (bank slip)
2. Choose the **Payment Group** and **Payment Type**
3. Click **Submit**

![Pay offline](images/34-pay-offline-modal.png)

Your order status becomes **PENDING APPROVAL** — now Finance and Admin take over (sections 7 and 8).

### Didn't finish paying? — Incomplete Orders

Orders you created but haven't paid are listed in **Incomplete Orders**. Click **Complete** to go back and pay.

![Incomplete orders](images/35-incomplete-orders.png)

### Reports

**Reports** shows all your purchases with dates, amounts, and statuses. Click **Export To Excel** to download an `.xlsx` file.

![Purchase report](images/38-agent-purchase-report.png)

### Profile & Account Renewal

**Profile** shows your company info, documents, and account expiry. When your account is within **2 months of expiry**, a **Request Renewal** button appears — upload your new KPL/SSM, enter the license number and expiry, and submit. Admin will approve it and extend your account.

![Profile](images/39-agent-profile.png)

> ⚠️ **If your account expires**, you can still log in, but Ticket Purchase is hidden and blocked until you renew.

---

## 7. Finance — Marking Payments as Paid

Login as **Finance**. You land on the **Offline Payments** list.

![Finance payments list](images/50-finance-payments.png)

### Step 1 — Open the payment

Click the row to open the review page. Check the purchase details and **open the uploaded bank slip** to verify the money really arrived.

![Finance payment review](images/51-finance-payment-review.png)

### Step 2 — Mark Payment Paid

If the transfer is genuine, click **Mark Payment Paid**. This does **not** generate any tickets — it only tells Admin the money is verified.

![Payment marked paid](images/52-finance-marked-paid.png)

> Admin **cannot approve** a payment before Finance marks it paid.

---

## 8. Admin — Approving the Payment (vouchers are created here)

### Step 1 — Open pending payments

Go to **Offline Payments** in the admin sidebar.

![Pending payments](images/22-admin-payments-pending.png)

### Step 2 — Review and decide

Open the payment. You can see the purchase details, the slip, and when Finance marked it paid. In **Payment Approval** choose:

- **Approved** → the order is confirmed and **vouchers are automatically generated** (one voucher per ticket, each with its own serial number + QR)
- **Rejected** / **Revision** → a reason is required; the agent gets an email

![Admin payment review](images/23-admin-payment-review.png)

![Payment approved](images/24-admin-payment-approved.png)

The agent receives a confirmation email and can now see the vouchers.

---

## 9. Agent & Partner — Your Vouchers

Go to **Vouchers**. Each row shows one order: how many vouchers were **issued**, **used**, and still **available**.

![Vouchers list](images/36-vouchers.png)

Click **View** to see every voucher: serial number, effective/expiry dates, entrance gate, and redeem status (**NEW / LOCKED / REDEEMED**).

![Voucher detail](images/37-voucher-detail.png)

Give the serial number / QR code to your customer — they show it at the gate.

---

## 10. Admin — Complimentary (free tickets)

Go to **Complimentary**: select the agent/partner, click **Add Product**, set quantities (**minimum 20 tickets total**), and Submit. Free vouchers are issued immediately at RM 0.

![Complimentary](images/20-admin-complimentary.png)

## 11. Admin — Account Renewals

Renewal requests from agents/partners appear under **Renewals**. Click **Review** and Approve / Reject / Revision (remarks required for reject/revision). On approval, the account expiry is extended and the agent is emailed.

![Renewals](images/21-admin-renewals.png)

## 12. Admin — Reports

Go to **Reports** and pick a report (Purchase Summary, Payment, Complimentary, Voucher Issued). Filter by dates, then click **Export To Excel** to download.

![Reports menu](images/25-admin-reports.png)

![Purchase summary report](images/26-admin-report-purchase.png)

---

## 13. Staff — Redeeming the Voucher at the Gate

This is the **final step** of the whole journey: the customer arrives at the gate with a voucher.

### Step 1 — Open Voucher Redeem

Login as **Staff** and open **Voucher Redeem** in the sidebar.

![Voucher redeem](images/60-staff-voucher-redeem.png)

### Step 2 — Scan or type the code

Scan the QR code (or type the serial number, e.g. `APM-V-26-134875_012`), optionally enter the gate name, and click **Redeem Voucher**.

![Voucher redeemed](images/61-staff-voucher-redeemed.png)

A green **"Voucher redeemed successfully"** card shows the product, the company, and the redemption time.

The system rejects the voucher if it is:
- ❌ already **redeemed** (each voucher works only once)
- ❌ **expired** or not yet effective
- ❌ **locked**
- ❌ not found

The agent's voucher list updates instantly — the **Used** count goes up and that serial shows **REDEEMED**.

---

## 14. Quick reference — statuses

| Area | Statuses |
|---|---|
| Registration / Renewal | PENDING → APPROVED / REVISION / REJECTED |
| Purchase order | PENDING PAYMENT → PENDING APPROVAL → ORDER CONFIRMED / REVISION / REJECTED |
| Offline payment | PENDING APPROVAL → (Finance marks Paid) → ORDER CONFIRMED / REVISION / REJECTED |
| Voucher | NEW → REDEEMED (or LOCKED / EXPIRED) |
| Account | ACTIVE / INACTIVE / EXPIRED |

## 15. Frequently asked questions

**I lost my Application ID.** Check the confirmation email that was sent when you registered.

**My temporary password expired.** Use **Forgot password?** on the login page — a new temporary password will be emailed to you.

**The agent sees "No products are available".** Admin has not bound a purchase scheme to that account yet — see section 4.

**Admin can't approve a payment.** Finance must click **Mark Payment Paid** first — see section 7.

**A voucher won't redeem.** Check its status in the voucher detail page — it may already be redeemed or expired.

---

*Generated from the live application — all screenshots are real screens from the portal.*
