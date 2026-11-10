# OWG Agent Portal — Travel Agent OTA Platform

**A B2B ticketing portal for theme-park and attraction operators.** Travel agents and partners register online and buy tickets at wholesale prices set by the operator. They pay by bank transfer and receive QR vouchers, which gate staff redeem at the entrance. Admin and finance approve each step along the way.

![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?logo=nextdotjs)
![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Prisma 6](https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white)

![Admin dashboard with KPI cards, daily sales, top agents and monthly revenue charts](docs/images/admin-dashboard.jpg)

<sub>All screenshots show the built-in fictional demo data (`*.demo` accounts, `DEMO-` references).</sub>

## Contents

- [The full journey](#the-full-journey)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Running with Docker Compose](#running-with-docker-compose)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Testing](#testing)
- [Documentation](#documentation)
- [Troubleshooting](#troubleshooting)

## The full journey

```mermaid
flowchart LR
    A["Agent / Partner<br/>registers online<br/>+ uploads KPL/SSM docs"] --> B["Admin<br/>approves request<br/>(account code + temp<br/>password emailed)"]
    B --> C["Agent / Partner<br/>buys tickets<br/>+ uploads bank<br/>transfer slip"]
    C --> D["Finance<br/>marks payment<br/>as Paid"]
    D --> E["Admin<br/>approves payment<br/>(vouchers issued<br/>automatically)"]
    E --> F["Staff<br/>redeems voucher<br/>QR at the gate"]
```

Each purchase order moves through these states:

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT: agent submits cart
    PENDING_PAYMENT --> PENDING_APPROVAL: bank slip uploaded
    PENDING_APPROVAL --> PENDING_APPROVAL: Finance marks Paid
    PENDING_APPROVAL --> ORDER_CONFIRMED: Admin approves (after Finance Paid)
    PENDING_APPROVAL --> REVISION: Admin requests revision (reason required)
    PENDING_APPROVAL --> REJECTED: Admin rejects (reason required)
    ORDER_CONFIRMED --> [*]: vouchers issued
```

## Features

### Public pages

- The **login page** links to agent and partner registration and to the public **application status** check. Users can also reset a forgotten password from here.

![Login page with Become an Agent, Become a Partner, Check Application Status and demo credentials](docs/images/login.jpg)

### Agent & Partner portal

- **Self-registration.** A 4-step wizard covers company info, KPL/SSM document upload, contact persons and company background. It has a T&C gate, generates an Application ID, and lets applicants check their status publicly.
- **Account-code login** (`A20260001` / `P20260001`). Temporary passwords are emailed and expire after 24 hours. The first login forces a password change, with complexity rules.
- **Ticket Purchase.** A catalog priced by the account's scheme, with per-item min/max quantities, outlet filter, cart, incentives and an order summary.
- **Offline Payment.** Agents upload a bank slip, choose the payment group and type, and track approval history.
- **Voucher Issued.** Each voucher has its own serial number and QR code. Agents see issued, used and available counts and the redeem status (New / Locked / Redeemed / Expired), and can export to Excel.
- **Incomplete Orders** and **Purchase/Payment reports with Excel export**. The company profile is view-only.
- **Account renewal.** It unlocks 2 months before expiry. Expired accounts can still log in but can no longer purchase.
- Announcement popups on the home page and an announcement feed on the dashboard.

| Registration wizard | Ticket purchase |
|---|---|
| ![Agent registration wizard, company information step](docs/images/registration-wizard.jpg) | ![Ticket purchase catalog with order summary](docs/images/ticket-purchase.jpg) |

![Voucher detail with issued/used/available counts and a voucher QR code](docs/images/voucher-qr.jpg)

### Admin portal

- **Registration approval queues** (separate Agent and Partner queues). Admins review uploaded documents and Approve, Reject or request Revision with remarks. Approval creates the account and emails the credentials.
- **Outlets & Products.** Products belong to outlets. **Bulk product creation** adds up to 200 rows at once. It supports Excel (`.xlsx`) import, browser-saved drafts, and optional automatic inclusion in a scheme. The batch is all-or-nothing: if any row is invalid, no products are created.
- **Purchase Schemes.** Admins group products with custom prices, min/max quantities and incentives. Schemes have versioned revisions by effective date and are bound to accounts (Standard / Special).
- **Offline Payment approval.** Two people are involved: Finance marks the payment paid, then Admin approves and the vouchers are generated. Admins can preview uploaded slips in a popup.
- **Complimentary vouchers** (minimum 20 tickets per request). Admin creates the request and Finance approves or rejects it. Users can't review their own requests, and vouchers are issued exactly once.
- **Account renewals** and **announcements** (Home/Login, audience-targeted, JPG/PDF attachments).
- **9 reports:** Transaction, Transaction Details, Purchase Summary, Purchase Details, Top Purchase, Voucher Issued, Ticket (serial/QR search), Complimentary and Payment. All of them have user/company/date filters, quick search, paging, TOTAL rows and **Export To Excel**.

| Purchase scheme revisions | Bulk products |
|---|---|
| ![Purchase scheme detail with a revision's products, prices, min/max and incentives](docs/images/purchase-scheme.jpg) | ![Bulk product creation with Excel import and product catalog](docs/images/bulk-products.jpg) |

![Transaction report with filters, status badges and Export To Excel](docs/images/transaction-report.jpg)

### Finance role

- A dedicated queue for checking bank slips and clicking **Mark Payment Paid**. Admin can't approve a payment until Finance has done this.
- Approves or rejects complimentary voucher requests.

| Payment review (Finance + Admin) | Slip preview |
|---|---|
| ![Admin payment review with purchase header, Finance status and approval panel](docs/images/payment-approval.jpg) | ![Uploaded payment slip preview popup (demo slip)](docs/images/payment-slip-preview.jpg) |

### Staff (gate)

- **Voucher Redeem** screen. Staff scan the QR code or type the serial number, and can optionally record the entrance gate. Each voucher can be redeemed once. Already-redeemed, expired, locked and unknown vouchers are rejected with a clear reason.
- Legacy retail scanner and a ticket list with Excel export.

![Voucher redemption showing a successful redeem with serial, product, company and gate](docs/images/voucher-redeem.jpg)

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript (strict), Tailwind CSS, Recharts, lucide-react |
| Backend | Next.js API routes → thin controllers → **framework-free service layer** |
| Database | PostgreSQL + Prisma 6 |
| Auth | Custom JWT (jose, HS256 access + refresh tokens in httpOnly cookies), bcrypt |
| Validation | zod |
| Files | Private disk uploads (`uploads/`) + authenticated download route |
| Email | Pluggable driver (`EMAIL_DRIVER`), console logger by default |
| Excel | exceljs (`?format=xlsx` on report endpoints) |
| QR | HMAC-signed payloads + qrcode data URLs; html5-qrcode for camera scanning |

## Quick start

**Requirements:** Node.js 22 (the version the Dockerfile uses) and PostgreSQL 16. The commands below run Postgres in Docker.

```bash
# 1. Postgres (Docker)
docker run -d --name offline-ota-postgres -p 5432:5432 \
  -e POSTGRES_USER=travel_agent -e POSTGRES_PASSWORD=travel_agent \
  -e POSTGRES_DB=travel_agent postgres:16

# 2. Install
cd frontend
npm install

# 3. Configure: create frontend/.env with the variables listed under "Configuration"
#    (at minimum DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET)

# 4. Database schema
npm run prisma:migrate

# 5. Demo data (DESTRUCTIVE: wipes and re-creates all data in that database)
set -a; source .env; set +a          # the seed script reads DATABASE_URL from the shell
APP_MODE=demo DEMO_DATABASE_NAME=travel_agent DEMO_ALLOW_RESET=true npm run prisma:seed

# 6. Run
npm run dev                          # http://localhost:3000
```

Other scripts in `frontend/package.json`: `npm run build`, `npm start`, `npm run lint`, `npm run prisma:generate` and `npm run docs:capture`.

### Demo accounts

These are created by the seed.

| Role | Username | Password |
|---|---|---|
| Admin | `admin@travel-agent.demo` | `admin123!` |
| Agent | `A20260001` | `agent123!` |
| Partner | `P20260001` | `partner123!` |
| Finance | `finance@travel-agent.demo` | `finance123!` |
| Staff | `staff@travel-agent.demo` | `staff123!` |

## Configuration

Put these in `frontend/.env`. Next.js reads both `.env` and `.env.local`, but the Prisma CLI reads only `.env`. Never commit real values.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string (`postgresql://USER:PASSWORD@HOST:PORT/DB`) |
| `JWT_ACCESS_SECRET` | yes | Signs access tokens and voucher QR payloads |
| `JWT_REFRESH_SECRET` | yes | Signs refresh tokens |
| `JWT_ACCESS_EXPIRES_IN` | no | Access token lifetime (default `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | no | Refresh token lifetime (default `7d`) |
| `APP_URL` | no | Public URL of the deployment |
| `UPLOAD_DIR` | no | Upload folder. A relative path is resolved from the repo root. Default `uploads` |
| `EMAIL_DRIVER` | no | Email driver. Only `console` is implemented |
| `APP_MODE` | no | `demo` turns on the demo banner and `DEMO-` voucher prefixes, forces console email and blocks outbound Klook calls |
| `DEMO_DATABASE_NAME` | seed only | Must match the database name in `DATABASE_URL` before the seed will run |
| `DEMO_ALLOW_RESET` | seed only | Must be `true` before the seed will run |
| `APP_TIMEZONE` | no | Business timezone for OTA redemption checks (default `Asia/Kuala_Lumpur`) |
| `KLOOK_ENABLED`, `KLOOK_ENVIRONMENT`, `KLOOK_API_BASE_URL`, `KLOOK_CLIENT_ID`, `KLOOK_API_KEY` | no | Optional overrides for the Klook OTA provider client in `backend/services/ota` |
| `PRISMA_QUERY_LOGS` | no | `true` logs every SQL query |

## Running with Docker Compose

`compose.yaml` builds the app image (Node 22, `next build`) and a `postgres:16-alpine` database. Each has its own volume, and the app is published on `127.0.0.1:8094`. It reads a repo-root `.env`, which must define `POSTGRES_PASSWORD` plus the app variables above.

```bash
docker compose build
docker compose run --rm app npx prisma migrate deploy --schema ../backend/prisma/schema.prisma
docker compose up -d app
docker compose logs --tail=100 app
```

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the hosted test deployment and [`docs/DEMO_MODE.md`](docs/DEMO_MODE.md) for the daily demo-data refresh: `backend/scripts/refresh-demo.cjs`, run by the systemd timer in `deploy/`.

## Project structure

```
frontend/          Next.js app: pages, API routes, UI kit, hooks
  app/             routes: /admin/**, /agent/**, /finance/**, staff /voucher-redeem,
                   public /login, /register/[type], /application-status
  app/api/         REST endpoints (thin, delegate to backend/services)
  components/      ui primitives, layout shells, report shell, scanner, FileUpload
  scripts/         capture-guide.mjs / capture-docs.ts (screenshot bots), export-data.mjs
  tests/           *.integration.ts service-level tests
backend/           framework-free business logic
  prisma/          schema.prisma, migrations, seed.ts
  services/        ★ all domain logic (registration, scheme, purchase, payment, voucher…)
  services/ota/    OTA provider interface + Klook client
  controllers/     thin re-export objects
  middleware/      JWT auth context + role guards
  scripts/         demo-mode fixtures and start script
shared/            cross-cutting TS types + utils
deploy/            systemd service + timer for the demo refresh
docs/
  user-guide/      illustrated HTML user guide (42 screenshots)
  transfer/        DB schema dump, data export guide, QSTUDIO plugin package
  images/          README screenshots
uploads/           uploaded documents (gitignored)
```

## Architecture

```mermaid
flowchart TB
    subgraph Browser
        UI["Next.js pages<br/>(admin · agent · finance · staff · public)"]
    end
    subgraph Next["Next.js server"]
        API["API routes<br/>frontend/app/api"]
        MW["JWT auth + role guards<br/>backend/middleware"]
        SVC["Service layer<br/>backend/services"]
    end
    DB[(PostgreSQL<br/>via Prisma)]
    FS[["uploads/<br/>private files"]]
    MAIL["Email driver<br/>(console)"]

    UI -->|fetch + httpOnly cookies| API
    API --> MW --> SVC
    SVC --> DB
    SVC --> FS
    SVC --> MAIL
```

All domain logic lives in `backend/services` and does not depend on Next.js, so the API routes stay thin and the services can be reused elsewhere. [`docs/transfer/README.md`](docs/transfer/README.md) covers porting them to another project.

## Testing

The integration tests in `frontend/tests` call the service layer directly against the database in `DATABASE_URL`. They create their own uniquely tagged fixtures. Run them from `frontend/`:

```bash
npx tsx tests/product-batch.integration.ts
npx tsx tests/purchase-eligibility.integration.ts
npx tsx tests/complimentary-approval.integration.ts   # expects seeded ADMIN and FINANCE users
```

## Documentation

| Document | Contents |
|---|---|
| [`docs/user-guide/`](docs/user-guide/USER_GUIDE.md) | Step-by-step illustrated guide for every role (also served in-app at `/documentation`) |
| [`design.md`](design.md) | UI design system: layout, colors, components, motion |
| [`docs/WORKFLOW_REVIEW.md`](docs/WORKFLOW_REVIEW.md) | Workflow and approval review notes |
| [`docs/PROJECT_SPEC_FULL.md`](docs/PROJECT_SPEC_FULL.md), [`docs/QUOTATION_SPEC.md`](docs/QUOTATION_SPEC.md), [`docs/QUOTATION_FUNCTION_LIST.md`](docs/QUOTATION_FUNCTION_LIST.md) | Functional specification and itemised function list |
| [`docs/BECCA_COMMISSION_SPEC.md`](docs/BECCA_COMMISSION_SPEC.md) | Specification for a proposed commission-at-POS module |
| [`docs/transfer/README.md`](docs/transfer/README.md) | Schema dump, data export and integration guide |

## Troubleshooting

- **`Environment variable not found: DATABASE_URL` from Prisma.** The Prisma CLI doesn't read `.env.local`. Put the variable in `frontend/.env` or export it in your shell.
- **`Seed resets data: require APP_MODE=demo …`** The seed is destructive on purpose and refuses to run unless `APP_MODE=demo`, `DEMO_ALLOW_RESET=true` and `DEMO_DATABASE_NAME` equal to the database name in `DATABASE_URL` are all set in the shell.
- **No emails arrive.** Only the console email driver is implemented, so temporary passwords and notifications are printed in the server log.
- **An approved agent sees an empty Ticket Purchase catalog.** Approval doesn't assign a scheme. Bind a purchase scheme to the account from the account's detail page (**Admin → Agent/Partner → account → Schemes**).
- **The admin dashboard charts are empty.** The dashboard plots legacy bookings from the last 120 days, so a database seeded long ago shows no recent activity.
- **The container exits on start with `APP_MODE=demo`.** `backend/scripts/start-demo.cjs` runs the daily demo refresh first, and that script runs only on the project's own test deployment. Leave `APP_MODE` unset elsewhere.
