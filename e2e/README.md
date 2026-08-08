## E2E Tests — Playwright

### Setup

```bash
cd e2e
npm install
npx playwright install chromium
```

### Environment Variables

Create a `.env` file in `e2e/` (gitignored):

```env
# App URLs — defaults work for local dev
PLATFORM_URL=http://localhost:3000      # platform-ui (super admin)
ADMIN_URL=http://localhost:3001         # admin-ui (merchant)
STOREFRONT_URL=http://localhost:3002    # storefront

# For Cloud Run:
# PLATFORM_URL=https://ecom-platform-ui-496160804659.us-east1.run.app
# ADMIN_URL=https://ecom-admin-ui-496160804659.us-east1.run.app
# STOREFRONT_URL=https://ecom-storefront-m6jmogmpra-ue.a.run.app

# Test credentials
SUPERADMIN_EMAIL=superadmin@ecom.app
SUPERADMIN_PASSWORD=superadmin123
ADMIN_EMAIL=admin@teststore.com
ADMIN_PASSWORD=admin123456
CUSTOMER_EMAIL=customer@test.com
CUSTOMER_PASSWORD=customer123
TEST_STORE_SUBDOMAIN=demo
```

### Run Tests

```bash
# All tests
npm test

# Interactive UI mode
npm run test:ui

# Specific project
npx playwright test --project=platform-ui
npx playwright test --project=admin-ui
npx playwright test --project=storefront
npx playwright test --project=mobile

# Specific file
npx playwright test tests/auth/login.spec.ts

# Headed (see browser)
npm run test:headed

# View HTML report
npm run test:report
```

### Test Coverage

| Area | File | Tests |
|---|---|---|
| Auth (platform-ui) | `tests/auth/login.spec.ts` | Login, wrong password, access denied, logout, unauthenticated redirect |
| Super Admin | `tests/superadmin/superadmin.spec.ts` | Dashboard, Admins CRUD, Stores, Customers block/unblock, Subscriptions CRUD, Templates, Notifications config, Settings |
| Admin | `tests/admin/admin.spec.ts` | Login, Dashboard, Catalog CRUD, Orders, Domain & Publish, Shop Settings, Customize (Home/About/Navbar) |
| Storefront | `tests/storefront/storefront.spec.ts` | Browse, Products, About, Cart, Auth pages, Orders auth gate |

### Tips

- Tests use **page object models** in `pages/` — add new ones there
- Credentials live in `fixtures/credentials.ts` — override with env vars in CI
- Failed tests save screenshots + video in `test-results/`
