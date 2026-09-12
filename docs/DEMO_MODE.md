# Daily demo data

The isolated test deployment uses APP_MODE=demo and DEMO_DATABASE_NAME matching
its database name. It has separate PostgreSQL storage, uploads and JWT secrets.
Do not enable demo mode against a live database.

`node ../backend/scripts/refresh-demo.cjs` backfills 365 calendar days through
today in Asia/Kuala_Lumpur. It adds one purchase per agent/partner per day,
linked payment history, labelled sample slips, and individual vouchers.
Monthly registration, renewal and complimentary records fill additional queues.
Historical purchases are mostly completed, with mixed recent workflow states.
Quantities vary by date; expiry and redemption history follow issuance.

Daily runs are additive and repeatable: unique dated references preserve user
edits. Past history is retained, so the database grows beyond one year over time.
Demo login account expiry is extended; pending approvals are not automatically
completed. A dedicated single-connection advisory lock prevents overlapping runs.
Run the refresh before starting the app and through the host systemd timer at
00:05 Malaysia time, with persistent catch-up after downtime. Failures surface
in systemd logs and must be investigated.

Email is captured by the console driver; outbound Klook calls are disabled.
The global demo banner labels the environment; fixture identifiers and slips
are explicitly marked DEMO. The existing real application workflows remain usable.

The base seed is destructive and now requires APP_MODE=demo,
DEMO_DATABASE_NAME and DEMO_ALLOW_RESET=true. Daily refresh does not run it.
Never reset the database during a daily refresh.
