# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A multi-tenant SaaS e-commerce platform (Shopify-lite). Each merchant (Admin) gets their own configurable store. Customers shop on published stores via subdomains or custom domains.

## Monorepo Structure

```
ecom/
├── services/           # Node.js + Express + TypeScript microservices
│   ├── api-gateway/    # Port 4000 — single entry, JWT validation, reverse proxy
│   ├── auth-service/   # Port 3001 — register/login/refresh for all roles
│   ├── platform-service/ # Port 3002 — super-admin: subscriptions, admin mgmt
│   ├── store-service/  # Port 3003 — admin: store config, templates, domain, publish
│   ├── catalog-service/ # Port 3004 — products, categories, inventory
│   ├── order-service/  # Port 3005 — cart (Redis), checkout, order status
│   └── storefront-service/ # Port 3006 — public: resolve domain → store config
├── ui/
│   ├── platform-ui/    # Next.js — Super Admin dashboard (SUPERADMIN role only)
│   ├── admin-ui/       # Next.js — Merchant Admin dashboard (ADMIN role only)
│   └── storefront/     # Next.js PWA — customer-facing, multi-tenant by Host header
├── k8s/                # Kubernetes manifests (namespace ecom, Traefik ingress)
├── docker-compose.yml  # Local dev only
└── tsconfig.base.json  # Shared TS config extended by each service
```

## Local Development

```bash
# Start all services + Postgres + Redis
docker compose up

# Watch mode (hot reload on src changes)
docker compose watch

# Start a single service
docker compose up api-gateway

# Reset DB (wipe volumes)
docker compose down -v
```

Each service has its own `package.json`. To work on a service directly:
```bash
cd services/auth-service
npm install
npm run dev        # ts-node-dev watch
npm run build      # compile to dist/
npm test           # jest
```

Frontend apps:
```bash
cd ui/platform-ui   # Super Admin (SUPERADMIN role)
cd ui/admin-ui      # Merchant Admin (ADMIN role)
cd ui/storefront    # Customer storefront
npm install
npm run dev        # Next.js dev server
npm run build
```

## Environment Variables

Local dev values are set in `docker-compose.yml`. For running services outside Docker, copy `.env.example` to `.env` in each service directory.

**Never commit real secrets.** `k8s/secrets/` is gitignored — apply manually.

## User Roles

| Role | Token claim | Access |
|------|------------|--------|
| `superadmin` | `role: superadmin` | platform-service, all admin mgmt |
| `admin` | `role: admin`, `storeId: <id>` | their own store only |
| `user` | `role: user`, optional `storeId` | storefront of the store they registered on |

JWT is validated at the **api-gateway** before proxying. Services trust the `x-user-*` headers injected by the gateway.

## Multi-Tenancy

The `storefront` Next.js app reads the `Host` header on every request, calls `storefront-service /resolve?domain=<host>` to get the `storeId` + store config, then renders that tenant's store. This means one Next.js deployment serves all customer stores.

## Database

Single PostgreSQL instance shared by all services (separate schemas not required — all tables are `storeId`-scoped where relevant). Each service manages its own Prisma schema at `services/<name>/prisma/schema.prisma`.

Run migrations per service:
```bash
cd services/auth-service
npx prisma migrate dev
npx prisma db seed        # seeds super-admin account
```

## K8s Deployment

Production runs on k3s (`ecom` namespace). Apply all manifests:
```bash
kubectl apply -k k8s/
```

CI/CD: GitHub Actions builds Docker images (multi-arch arm64/amd64), pushes to GHCR, then runs `kubectl set image` to roll out.

Ingress uses Traefik `IngressRoute` CRDs:
- `*.ecom.app` → storefront
- `platform.ecom.app` → platform-ui
- `api.ecom.app` → api-gateway

## Key Patterns

- **Service auth**: gateway validates JWT, injects `x-user-id`, `x-user-role`, `x-store-id` headers; services read these, never re-validate tokens
- **Cart**: stored in Redis keyed by `cart:<userId>` or `cart:guest:<sessionId>`; merged on login
- **Image uploads**: `multipart/form-data` to catalog-service or store-service; files stored in shared `uploads` volume; served via `/uploads/:file` static route
- **Order flow**: `POST /api/orders/checkout` — cart-service reads cart → catalog-service validates stock → order-service creates order → cart cleared
