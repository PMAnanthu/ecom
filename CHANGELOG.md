# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-04

### Added
- Initial monorepo scaffold with Docker Compose and shared TypeScript config
- **auth-service**: JWT-based auth (register, login, refresh) for SUPERADMIN, ADMIN, USER roles; super-admin seed script
- **api-gateway**: JWT validation, role guards, reverse proxy to all backend services
- **platform-service**: Super-admin endpoints — manage admin accounts, subscription plans, platform analytics
- **store-service**: Admin store management — create store, choose template, upload branding assets, set custom domain, publish/unpublish
- **catalog-service**: Product and category CRUD with multi-image upload (multer), per-store scoping
- **order-service**: Redis-backed cart (add/update/remove/clear), PostgreSQL order persistence, admin order status updates
- **storefront-service**: Domain resolver — maps subdomain or custom domain to store config
- **platform-ui**: Next.js 16 admin/super-admin dashboard with role-based routing, store settings, catalog management, orders, shop settings (name, address, currency, logo)
- **storefront**: Next.js 16 PWA with Serwist service worker — product listing, product detail, cart, checkout, order history, login/register
- Separate PostgreSQL schemas per service (multiSchema Prisma preview feature)
- Kubernetes manifests for all services (Deployments, Services, HPAs), PostgreSQL and Redis StatefulSets, Traefik IngressRoutes
- GitHub Actions CI/CD workflow — multi-arch Docker builds, k3s rollout on push to main
- Shop settings page — name, currency, logo upload, address fields stored in branding JSON

[0.1.0]: https://github.com/PMAnanthu/ecom/releases/tag/v0.1.0
