// docs/migration/v1-to-v2.md
# 📘 Migration Guide: API v1 ➡ v2

This document outlines the necessary changes to migrate from API v1 to API v2.

## ✨ Key Differences

| Field/Behavior         | v1                          | v2                                 |
|------------------------|-----------------------------|--------------------------------------|
| Endpoint               | `/api/v1/users`             | `/api/v2/users`                      |
| DTO field for name     | `name`                      | `fullName`                           |
| Role support           | ❌ Not supported             | ✅ `role` required (admin/editor/etc) |
| Deprecation header     | ❌ Not applicable            | ✅ v1 includes deprecation warning    |

## 🚀 Action Required
- Update your frontend or integration clients to send:
  - `fullName` instead of `name`
  - Include a valid `role` (e.g. `admin`, `editor`, `viewer`)
  - Change endpoints from `/v1/` to `/v2/`

## 📅 Deprecation Timeline
- API v1 will be deprecated after **2025-12-31**
- Migrate to v2 before this date to avoid disruptions
