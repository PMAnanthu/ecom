# Changelog

All notable changes to payment-service are documented here.
Format: `## [x.y.z] — YYYY-MM-DD` with `### Added / Changed / Fixed` subsections.

## [1.0.0] — 2026-08-08

### Added

- Initial release — Razorpay integration for product purchases and subscription payments
- `PlatformPaymentConfig` — super-admin configures Razorpay keys for subscription money
- `StorePaymentConfig` — store admin configures Razorpay keys for product sale money
- `POST /orders/create` + `POST /orders/verify` — product checkout flow
- `POST /subscriptions/create` + `POST /subscriptions/verify` — subscription purchase flow
- `PaymentOrder` log table tracking all Razorpay transactions with status
