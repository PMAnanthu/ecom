# Changelog

All notable changes to api-gateway are documented here.
Format: `## [x.y.z] — YYYY-MM-DD` with `### Added / Changed / Fixed` subsections.

## [1.0.0] — 2026-08-07

### Added
- Initial release — JWT validation and reverse proxy to all services
- Injects `x-user-id`, `x-user-role`, `x-store-id` headers for downstream services
