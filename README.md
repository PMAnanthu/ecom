# ecom — SaaS E-Commerce Platform

A multi-tenant SaaS e-commerce platform. Each merchant (Admin) gets their own configurable store with a custom subdomain or domain. Customers shop on published stores via a PWA storefront.

## Architecture

```
ecom/
├── services/
│   ├── api-gateway/        # Port 4000 — JWT validation + reverse proxy
│   ├── auth-service/       # Port 3001 — Auth for all 3 roles
│   ├── platform-service/   # Port 3002 — Super-admin: subscriptions, analytics
│   ├── store-service/      # Port 3003 — Store config, branding, domain, publish
│   ├── catalog-service/    # Port 3004 — Products, categories, image uploads
│   ├── order-service/      # Port 3005 — Cart (Redis) + checkout + orders
│   └── storefront-service/ # Port 3006 — Domain → store config resolver
├── platform-ui/            # Next.js 16 — Admin + Super-admin dashboard
├── storefront/             # Next.js 16 PWA — Customer-facing storefront
├── k8s/                    # Kubernetes manifests (k3s, Traefik ingress)
└── docker-compose.yml      # Local dev
```

## User Roles

| Role | Access |
|------|--------|
| **Super Admin** | Manage admin accounts, subscription plans, platform analytics |
| **Admin** | Create store, manage products, view/update orders, shop settings |
| **Customer** | Browse products, add to cart, checkout, track orders |

## Tech Stack

- **Backend**: Node.js + Express + TypeScript, Prisma ORM, PostgreSQL, Redis
- **Frontend**: Next.js 16, Tailwind CSS, shadcn/ui, Zustand
- **PWA**: Serwist service worker (offline support)
- **Infrastructure**: Docker Compose (dev), Kubernetes/k3s (prod), Traefik ingress, GitHub Actions CI/CD

## Local Development

### Prerequisites
- Docker & Docker Compose
- Node.js 20+

### Start all services
```bash
docker compose up -d
```

### Run database migrations
```bash
for svc in auth-service platform-service store-service catalog-service order-service storefront-service; do
  cd services/$svc
  DATABASE_URL="postgresql://ecom:ecom_dev@localhost:5432/ecom" npx prisma db push
  cd ../..
done
```

### Seed super-admin
```bash
cd services/auth-service
DATABASE_URL="postgresql://ecom:ecom_dev@localhost:5432/ecom" npx ts-node prisma/seed.ts
```

### Start frontend apps
```bash
# Admin dashboard
cd platform-ui && npm run dev -- --port 3100

# Customer storefront
cd storefront && npm run dev -- --port 3200 --webpack
```

### Default credentials
| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@ecom.app` | `superadmin123` |

## Environment Variables

Copy `.env.example` to `.env` in each service directory. For Docker, values are pre-set in `docker-compose.yml`.

**Never commit real secrets.** `k8s/secrets/` is gitignored.

## Production Deployment (k3s)

```bash
# Apply all manifests
kubectl apply -k k8s/

# Update image after push
kubectl rollout restart deployment/<service-name> -n ecom
```

CI/CD via GitHub Actions (`.github/workflows/deploy.yml`) builds multi-arch Docker images and rolls out to k3s on push to `main`.

## API Reference

Base URL: `http://localhost:4000/api`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | None | Register user |
| POST | `/auth/login` | None | Login, returns JWT |
| POST | `/auth/refresh` | None | Refresh access token |
| GET | `/catalog/products` | None | List products |
| GET | `/catalog/products/:id` | None | Product detail |
| POST | `/catalog/products` | Admin | Create product |
| POST | `/catalog/products/:id/images` | Admin | Upload product image |
| GET | `/store` | Admin | Get store config |
| POST | `/store` | Admin | Create store |
| PATCH | `/store` | Admin | Update store settings |
| PATCH | `/store/publish` | Admin | Toggle publish |
| GET | `/orders/cart` | User | Get cart |
| POST | `/orders/cart/items` | User | Add to cart |
| POST | `/orders/orders/checkout` | User | Place order |
| GET | `/orders/orders` | User/Admin | List orders |
| PATCH | `/orders/orders/:id/status` | Admin | Update order status |
| GET | `/platform/analytics` | SuperAdmin | Platform stats |
| GET | `/platform/admins` | SuperAdmin | List admins |
| POST | `/platform/subscriptions` | SuperAdmin | Create subscription plan |

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT
