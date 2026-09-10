const axios = require('axios');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

let jwksCache;

function authError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.expose = true;
  return error;
}

function getBearerToken(header) {
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

/**
 * Constant-time check for the shared service-to-service secret, so a
 * naive `===` timing side-channel can't be used to brute-force it.
 * Deliberately returns false (rather than throwing) on any length
 * mismatch, since timingSafeEqual requires equal-length buffers.
 */
function isInternalServiceToken(token) {
  const expected = process.env.INTERNAL_SERVICE_TOKEN;
  if (!expected || !token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

async function getJwks(url) {
  if (jwksCache?.url === url && jwksCache.expiresAt > Date.now()) return jwksCache.keys;
  const response = await axios.get(url, { timeout: 5_000 });
  if (!Array.isArray(response.data?.keys)) {
    throw authError(503, 'AUTH_CONFIGURATION_ERROR', 'JWKS endpoint returned an invalid response');
  }
  jwksCache = { url, keys: response.data.keys, expiresAt: Date.now() + 10 * 60 * 1000 };
  return jwksCache.keys;
}

/**
 * Byte-for-byte the same verification logic as identity-admin-service's
 * authentication.js. This MUST stay in sync: these are not this service's
 * own keys, they're identity-admin-service's — this service only ever
 * verifies tokens minted there, never signs its own.
 */
async function verifyToken(token) {
  const options = {
    issuer: process.env.ADMIN_JWT_ISSUER || undefined,
    audience: process.env.ADMIN_JWT_AUDIENCE || undefined,
  };

  if (process.env.ADMIN_JWT_SECRET) {
    return jwt.verify(token, process.env.ADMIN_JWT_SECRET, {
      ...options,
      algorithms: ['HS256', 'HS384', 'HS512'],
    });
  }

  if (!process.env.ADMIN_JWKS_URL) {
    throw authError(503, 'AUTH_CONFIGURATION_ERROR', 'No admin JWT verifier is configured');
  }

  const decoded = jwt.decode(token, { complete: true });
  if (!decoded?.header?.kid) {
    throw authError(401, 'INVALID_TOKEN', 'JWT header does not include a key identifier');
  }

  const keys = await getJwks(process.env.ADMIN_JWKS_URL);
  const jwk = keys.find((key) => key.kid === decoded.header.kid);
  if (!jwk) throw authError(401, 'INVALID_TOKEN', 'JWT signing key is not recognized');

  return jwt.verify(token, crypto.createPublicKey({ key: jwk, format: 'jwk' }), {
    ...options,
    algorithms: ['RS256', 'RS384', 'RS512'],
  });
}

function scopesFromClaims(claims) {
  if (Array.isArray(claims.permissions)) return new Set(claims.permissions);
  if (Array.isArray(claims.scp)) return new Set(claims.scp);
  if (typeof claims.scope === 'string') return new Set(claims.scope.split(' ').filter(Boolean));
  return new Set();
}

/**
 * Two ways to authenticate against this service:
 *
 * 1. A real end-user bearer JWT minted by identity-admin-service — the
 *    normal path, used by organization-admin-ui. tenantUuid comes from
 *    the token's tenant_uuid claim, exactly like identity-admin-service.
 *
 * 2. The shared INTERNAL_SERVICE_TOKEN as the bearer token, used only by
 *    identity-admin-service's registrationService.js during self-service
 *    tenant registration (see routes/organizationRoutes.js's
 *    /internal/organizations, and the DELETE compensation call). There is
 *    no end-user JWT at that point in the flow — registration is what
 *    *creates* the first user — so the caller supplies the tenant via the
 *    X-Tenant-Uuid header instead of a token claim.
 */
async function authenticate(req, res, next) {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) throw authError(401, 'UNAUTHENTICATED', 'A bearer token is required');

    if (isInternalServiceToken(token)) {
      const tenantUuid = req.headers['x-tenant-uuid'];
      if (!tenantUuid || typeof tenantUuid !== 'string') {
        throw authError(400, 'TENANT_HEADER_REQUIRED', 'X-Tenant-Uuid header is required for service-to-service calls');
      }
      req.auth = {
        tenantUuid,
        isInternalService: true,
        scopes: new Set(['ALL_PERMISSIONS']),
      };
      return next();
    }

    const claims = await verifyToken(token);
    const tenantUuid = claims.tenant_uuid || claims.tenantUuid || claims.tid;
    if (!tenantUuid || typeof tenantUuid !== 'string') {
      throw authError(403, 'TENANT_CLAIM_REQUIRED', 'JWT must include a tenant UUID claim');
    }

    req.auth = {
      claims,
      tenantUuid,
      isInternalService: false,
      scopes: scopesFromClaims(claims),
    };
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return next(authError(401, 'INVALID_TOKEN', 'Bearer token is invalid or expired'));
    }
    return next(error);
  }
}

function methodToActions(method) {
  switch (method) {
    case 'GET':
    case 'HEAD':
      return ['READ'];
    case 'POST':
      return ['CREATE'];
    case 'PUT':
    case 'PATCH':
      return ['UPDATE'];
    case 'DELETE':
      return ['DELETE'];
    default:
      return ['WRITE'];
  }
}

function matchesFineGrainedOrgAdminScope(codes, actions) {
  return [...codes].some((code) => {
    const parts = code.toUpperCase().split(':');
    if (parts.length !== 3) return false;
    const [service, , action] = parts;
    return service === 'ORGANIZATION-ADMIN' && actions.includes(action);
  });
}

/**
 * Scope check ONLY — no DB round trip. Unlike identity-admin-service's
 * authorize(), this service has no access to identity's Users/Roles/
 * RolePermissions tables to re-derive permissions as a defense-in-depth
 * check, so the JWT's own `permissions` claim (populated by identity-
 * admin-service at login) is the sole source of truth here. See README
 * "Data ownership / auth boundary" for why this is an accepted interim
 * gap, not an oversight: it depends on identity-admin-service issuing
 * ORGANIZATION-ADMIN:* permission codes, which it does not do yet.
 *
 * Until those permission codes exist, every route mounts with only
 * `authenticate` (valid tenant-scoped token) and does NOT chain this
 * `authorize` gate — see app.js. It's exported and ready to enable
 * per-route the moment identity-admin-service starts issuing them.
 */
function authorize(requiredPermission, tokenActions = []) {
  return (req, res, next) => {
    if (req.auth?.isInternalService) return next();

    const tokenScopes = req.auth?.scopes || new Set();
    const allowsAll =
      tokenScopes.has('ALL_PERMISSIONS') ||
      tokenScopes.has('organization-admin:*') ||
      tokenScopes.has('ORGANIZATION-ADMIN:*');
    const allowsSpecific =
      tokenScopes.has(requiredPermission) || matchesFineGrainedOrgAdminScope(tokenScopes, tokenActions);

    if (!allowsAll && !allowsSpecific) {
      return next(authError(403, 'INSUFFICIENT_PERMISSION', `Permission ${requiredPermission} is required`));
    }
    return next();
  };
}

/** Only identity-admin-service (via INTERNAL_SERVICE_TOKEN) may call a route guarded by this. */
function requireInternalService(req, res, next) {
  if (!req.auth?.isInternalService) {
    return next(authError(403, 'INTERNAL_ONLY', 'This endpoint may only be called by a trusted internal service'));
  }
  return next();
}

module.exports = { authenticate, authorize, requireInternalService, methodToActions };
