# Subscription Management System Documentation

## Overview
This module provides subscription management for recurring product deliveries and services, including:
- Subscription creation and management
- Support for various billing cycles (weekly, monthly, yearly)
- Recurring payment processing
- Subscription modification (change, pause, resume, cancel)
- Analytics (active, paused, churn, etc.)
- Notifications (renewal, payment failure, etc.)

## Key Endpoints
- `POST /subscriptions` — Create a new subscription
- `PATCH /subscriptions/:id` — Update subscription (modify, cancel, etc.)
- `PATCH /subscriptions/:id/pause` — Pause subscription
- `PATCH /subscriptions/:id/resume` — Resume subscription
- `GET /subscriptions/:id` — Get subscription details
- `GET /subscriptions/analytics/stats` — Subscription analytics

## Recurring Payments
- Recurring payments are processed daily via a scheduled job.
- Payment logic should be implemented in `SubscriptionBillingService`.

## Notifications
- Notifications are sent for renewals, payment failures, and other events using the notification system.

## Analytics
- Analytics endpoints provide stats on active, paused, and cancelled subscriptions.

## Extending
- Add more billing cycles by updating the `BillingCycle` enum.
- Integrate payment gateway in `SubscriptionBillingService`.
- Customize notification templates in `SubscriptionNotificationService`.

---

For further details, see the code in `src/subscription/`.
