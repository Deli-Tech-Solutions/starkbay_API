// src/common/middleware/version.middleware.ts
export function VersionMiddleware(req, res, next) {
  const version = req.headers['accept-version'] || req.url.split('/')[2];
  req.apiVersion = version;
  next();
}