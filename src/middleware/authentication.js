const axios = require("axios");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

/**
 * Organization-service does NOT own users, roles or permissions — those
 * live in identity-service's own database, and per the platform's bounded
 * context design there are deliberately no cross-DB foreign keys and no
 * synchronous cross-service DB queries on the request path (see the
 * Healthcare Vendor RFPs architecture notes: "Design the healthcare domain
 * and notification domain as separate bounded contexts from Day 1").
 *
 * So authorization here is entirely claims-based: identity-service resolves
 * a user's roles -> permissions at token-issuance time and embeds them in
 * the JWT (permissions / scp / scope claim). This middleware verifies the
 * token's signature and trusts those claims directly instead of re-querying
 * identity's Users/Roles/Permissions tables.
 */

let jwksCache;

function authError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.expose = true;
  return error;
}

function getBearerToken(header) {
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7).trim();
}

async function getJwks(url) {
  if (jwksCache?.url === url && jwksCache.expiresAt > Date.now())
    return jwksCache.keys;
  const response = await axios.get(url, { timeout: 5_000 });
  if (!Array.isArray(response.data?.keys)) {
    throw authError(
      503,
      "AUTH_CONFIGURATION_ERROR",
      "JWKS endpoint returned an invalid response",
    );
  }

  jwksCache = {
    url,
    keys: response.data.keys,
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
  return jwksCache.keys;
}

async function verifyToken(token) {
  const options = {
    issuer: process.env.ADMIN_JWT_ISSUER || undefined,
    audience: process.env.ADMIN_JWT_AUDIENCE || undefined,
  };

  if (process.env.ADMIN_JWT_SECRET) {
    return jwt.verify(token, process.env.ADMIN_JWT_SECRET, {
      ...options,
      algorithms: ["HS256", "HS384", "HS512"],
    });
  }

  if (!process.env.ADMIN_JWKS_URL) {
    throw authError(
      503,
      "AUTH_CONFIGURATION_ERROR",
      "No admin JWT verifier is configured",
    );
  }

  const decoded = jwt.decode(token, { complete: true });
  if (!decoded?.header?.kid)
    throw authError(
      401,
      "INVALID_TOKEN",
      "JWT header does not include a key identifier",
    );
  const keys = await getJwks(process.env.ADMIN_JWKS_URL);
  const jwk = keys.find((key) => key.kid === decoded.header.kid);

  if (!jwk)
    throw authError(401, "INVALID_TOKEN", "JWT signing key is not recognized");

  return jwt.verify(
    token,
    crypto.createPublicKey({ key: jwk, format: "jwk" }),
    {
      ...options,
      algorithms: ["RS256", "RS384", "RS512"],
    },
  );
}

function permissionsFromClaims(claims) {
  if (Array.isArray(claims.permissions)) return new Set(claims.permissions);
  if (Array.isArray(claims.scp)) return new Set(claims.scp);
  if (typeof claims.scope === "string")
    return new Set(claims.scope.split(" ").filter(Boolean));
  return new Set();
}

async function authenticate(req, res, next) {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token)
      throw authError(401, "UNAUTHENTICATED", "A bearer token is required");

    const claims = await verifyToken(token);

    const tenantUuid = claims.tenant_uuid || claims.tenantUuid || claims.tid;
    if (!tenantUuid || typeof tenantUuid !== "string") {
      throw authError(
        403,
        "TENANT_CLAIM_REQUIRED",
        "JWT must include a tenant UUID claim",
      );
    }

    const userId = claims.user_id ?? claims.userId ?? claims.sub;

    req.auth = {
      claims,
      tenantUuid,
      userId,
      permissions: permissionsFromClaims(claims),
      ipAddress: req.ip,
    };
    return next();
  } catch (error) {
    if (
      error instanceof jwt.JsonWebTokenError ||
      error instanceof jwt.TokenExpiredError
    ) {
      return next(
        authError(401, "INVALID_TOKEN", "Bearer token is invalid or expired"),
      );
    }
    return next(error);
  }
}

function authorize(requiredPermission) {
  console.log("requiredPermission ==> ", requiredPermission);
  return (req, res, next) => {
    const permissions = req.auth?.permissions || new Set();

    const allowsAll =
      permissions.has("ALL_PERMISSIONS") ||
      permissions.has("organization-admin:*") ||
      permissions.has("ORGANIZATION-ADMIN:*");
    console.log("permissions ==> ", permissions);
    const allowsSpecific = permissions.has(requiredPermission);

    if (!allowsAll && !allowsSpecific) {
      return next(
        authError(
          403,
          "INSUFFICIENT_PERMISSION",
          `Permission ${requiredPermission} is required`,
        ),
      );
    }
    return next();
  };
}

function tenantMatchesPath(paramName) {
  return (req, res, next) => {
    if (req.params[paramName] !== req.auth.tenantUuid) {
      return next(
        authError(
          403,
          "TENANT_MISMATCH",
          "Requested tenant does not match the authenticated tenant",
        ),
      );
    }
    return next();
  };
}

module.exports = { authenticate, authorize, tenantMatchesPath };
