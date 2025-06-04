# API Documentation Guide

## Accessing the Documentation
- Interactive Swagger UI: `http://localhost:3000/api-docs`
- Raw OpenAPI JSON: `http://localhost:3000/api-docs-json`

## Features
1. **Interactive Testing**: Try out API endpoints directly from the UI
2. **Authentication**:
   - JWT: Add `Bearer <token>` in the Authorization header
   - API Key: Add `X-API-KEY` header
   - Cookies: `session-id` cookie
3. **Request/Response Examples**: See example payloads for each endpoint
4. **Search**: Filter endpoints by tags or description
5. **Export**: Download OpenAPI JSON for import into other tools

## Versioning
The API version is automatically pulled from your `package.json`.

## Best Practices
- Use the "Try it out" feature to test endpoints
- Check response schemas before implementation
- Review required authentication for each endpoint