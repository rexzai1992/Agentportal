# VPSDeck test deployment

Test URL: https://ota-test.13-140-148-77.sslip.io/login

VPSDeck project: https://vps.izzul.xyz/projects/4

The deployment uses the current workspace snapshot, including local changes, on
the SSH host `vpsdeck` at `/opt/apps/offline-ota-test`. It is a Docker Compose
project with its own PostgreSQL database and upload volume. Nginx proxies HTTPS
to `127.0.0.1:8094`; Certbot manages certificate renewal.

Deployment secrets live only in the server's `.env`. Local environment files,
uploads, Git metadata, and node_modules are excluded from the image transfer.
Email uses the console driver, so registration and reset emails are logged on
the server rather than delivered to an inbox.

## Operations

Run these commands from `/opt/apps/offline-ota-test` on the server:

```sh
docker compose ps
docker compose logs --tail=100 app
docker compose build
docker compose run --rm app npx prisma migrate deploy --schema ../backend/prisma/schema.prisma
docker compose up -d app
```

The initial deployment seeds the demo accounts listed in the project README.
Do not rerun `npm run prisma:seed` to update the app: it deletes and recreates
the application's data. Do not use `docker compose down -v` unless deliberately
discarding the test database and uploads.

This is a workspace snapshot deployment; it does not automatically pull GitHub
changes. Upload the intended source changes before rebuilding.
