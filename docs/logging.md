# Logging & Monitoring

## Overview
This project uses Winston for structured logging and exposes metrics and health endpoints...

## Features
- JSON logs
- Request/response logs
- Error tracking via Sentry
- Health checks via Terminus

## Environments
- Dev: debug logs
- Prod: info+ only

## Endpoints
- `/metrics`
- `/health`

## Setup
1. Set `.env` values
2. Install deps
3. Run app
