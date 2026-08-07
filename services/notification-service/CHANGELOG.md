# Changelog

All notable changes to notification-service are documented here.
Format: `## [x.y.z] — YYYY-MM-DD` with `### Added / Changed / Fixed` subsections.

## [1.0.0] — 2026-08-07

### Added
- Initial release — email (SMTP via Nodemailer) and WhatsApp (Meta Cloud API + Twilio) notifications
- `NotificationConfig` per-store config stored in Postgres (`notif_svc` schema)
- `NotificationLog` table tracks every send attempt with status and error
- `POST /notify/send` — trigger ORDER_PLACED, ORDER_STATUS_UPDATED, ORDER_CANCELLED events
- `GET/PUT /config/:storeId` — super-admin CRUD for per-store notification config
- `GET /logs` — view notification delivery history (super-admin + admin)
- Wired into api-gateway at `/api/notifications/*`
- Super-admin config page in platform-ui with store selector, email and WhatsApp forms
- Sidebar link added under Notifications
