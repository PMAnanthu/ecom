# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-08-04

### Added
- **Tags / Classification**: Products now have a multi-tag field. Admin can add tags via a pill-style input (Enter or comma to add). Storefront filters products by tag in all templates.
- **3 Full Storefront Templates**: Each template controls the entire customer experience — nav shell, home, products, product detail, about, cart, checkout, and orders pages all adapt per template:
  - **Top Nav** (`default`) — horizontal nav with hero banner, dark header
  - **Sidebar** (`sidebar`) — persistent left sidebar with category + tag filters
  - **Card** (`card`) — gradient background, large cards, indigo accent color, hero section
- **Template switching**: Storefront reads the store's `template` field on every page via `TemplateProvider` context. Changing the template in admin settings immediately changes the entire store layout.
- **About page**: New `/about` route on storefront — shows store name, description, and contact info (address, phone) from shop settings.
- **Order tracking**: Orders page now shows a visual progress bar (Ordered → Processing → Shipped → Delivered) styled per template.
- **Super-admin template management** (`/super/templates`): Super admin can enable/disable which templates admins are allowed to pick, with visual mockup previews.
- **Admin template picker**: Settings page shows visual template previews with mockups; admin picks from enabled templates only.
- **`platform-service`**: Added `StoreTemplate` model + `/templates` endpoint; seeded with 3 built-in templates.
- **`catalog-service`**: Added `tags String[]` field to Product; `GET /products/tags` returns all unique tags for a store; `tag` query param filters products.

### Fixed
- `platform-service` tsconfig now includes only `src/` to prevent seed.ts from breaking Docker build

[0.2.0]: https://github.com/PMAnanthu/ecom/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/PMAnanthu/ecom/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/PMAnanthu/ecom/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/PMAnanthu/ecom/releases/tag/v0.1.0

## [0.1.2] - 2026-08-04

### Fixed
- **storefront**: Product images now load correctly — paths prefixed with `NEXT_PUBLIC_CATALOG_URL` (was resolving relative to storefront port instead of catalog-service port)
- **platform-ui catalog**: Product edit mode added — Edit button opens pre-filled form, supports updating name/price/stock/description and adding new images
- **platform-ui catalog**: Linter warnings resolved (readonly props, no nested ternaries, `SyntheticEvent` over deprecated `FormEvent`)

## [0.1.1] - 2026-08-04

### Added
- **platform-ui**: Shop Settings page (`/settings`) — shop name, currency selector, logo upload, address/city/country/phone fields; saved to store `branding` JSON
- **platform-ui sidebar**: Settings link added to admin navigation

### Fixed
- **platform-ui**: Super-admin pages moved to `/super/*` routes (was conflicting with admin `/dashboard` — Next.js route group collision)
- **storefront**: Serwist PWA service worker disabled in dev to fix Turbopack conflict; dev server now runs with `--webpack`
- **platform-ui login**: After login, admin's `storeId` fetched from store-service and persisted in auth store; all subsequent API calls automatically inject `x-store-id` header via axios interceptor — fixes catalog/order 400 errors

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
- **platform-ui**: Next.js 16 admin/super-admin dashboard with role-based routing, store settings, catalog management, orders, shop settings
- **storefront**: Next.js 16 PWA with Serwist service worker — product listing, product detail, cart, checkout, order history, login/register
- Separate PostgreSQL schemas per service (multiSchema Prisma preview feature)
- Kubernetes manifests for all services, GitHub Actions CI/CD workflow

[0.1.2]: https://github.com/PMAnanthu/ecom/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/PMAnanthu/ecom/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/PMAnanthu/ecom/releases/tag/v0.1.0
