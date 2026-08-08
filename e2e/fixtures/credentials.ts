// Central test credentials and URLs — override with env vars in CI
export const CREDENTIALS = {
  superadmin: {
    email: process.env.SUPERADMIN_EMAIL || 'superadmin@ecom.app',
    password: process.env.SUPERADMIN_PASSWORD || 'superadmin123',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@teststore.com',
    password: process.env.ADMIN_PASSWORD || 'admin123456',
  },
  customer: {
    email: process.env.CUSTOMER_EMAIL || 'customer@test.com',
    password: process.env.CUSTOMER_PASSWORD || 'customer123',
  },
};

export const URLS = {
  platform: process.env.PLATFORM_URL || 'http://localhost:3000',
  admin: process.env.ADMIN_URL || 'http://localhost:3001',
  storefront: process.env.STOREFRONT_URL || 'http://localhost:3002',
};
