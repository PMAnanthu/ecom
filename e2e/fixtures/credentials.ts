// All credentials must be set via environment variables or a .env file.
// See e2e/.env.example for the full list.
export const CREDENTIALS = {
  superadmin: {
    email: process.env.SUPERADMIN_EMAIL ?? '',
    password: process.env.SUPERADMIN_PASSWORD ?? '',
  },
  admin: {
    email: process.env.ADMIN_EMAIL ?? '',
    password: process.env.ADMIN_PASSWORD ?? '',
  },
  customer: {
    email: process.env.CUSTOMER_EMAIL ?? '',
    password: process.env.CUSTOMER_PASSWORD ?? '',
  },
};

export const URLS = {
  platform: process.env.PLATFORM_URL || 'https://ecom-platform-ui-496160804659.us-east1.run.app',
  admin: process.env.ADMIN_URL || 'https://ecom-admin-ui-496160804659.us-east1.run.app',
  storefront: process.env.STOREFRONT_URL || 'https://ecom-storefront-m6jmogmpra-ue.a.run.app',
};

