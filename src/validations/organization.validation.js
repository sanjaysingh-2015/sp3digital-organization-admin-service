/**
 * organization.validation.js
 *
 * Lightweight, dependency-free validation for the /organizations endpoints.
 * Mirrors identity-service's tenant.validation.js: error shape
 * (statusCode + message + details) flows through the same error-handling
 * middleware as notFound()/assertMutable() in utils/lifecycle.js.
 */
const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE", "DISABLED", "DELETED"];
const ALLOWED_ORGANIZATION_TYPES = [
  "STATE_HEALTH_DEPT",
  "DISTRICT_HEALTH_AUTHORITY",
  "HEALTH_NETWORK",
  "GOVERNMENT",
  "NGO",
  "PRIVATE_CHAIN",
  "OTHER",
];

class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.statusCode = 400;
    this.details = details;
  }
}

class ConflictError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ConflictError";
    this.statusCode = 409;
    this.details = details;
  }
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/** Validates payload for POST /organizations. Throws ValidationError. */
function validateCreatePayload(body = {}) {
  const errors = [];

  if (!isNonEmptyString(body.organizationName)) {
    errors.push({ field: "organizationName", message: "organizationName is required" });
  } else if (body.organizationName.length > 200) {
    errors.push({ field: "organizationName", message: "organizationName must be at most 200 characters" });
  }

  if (body.organizationType !== undefined && body.organizationType !== null) {
    if (!ALLOWED_ORGANIZATION_TYPES.includes(body.organizationType)) {
      errors.push({
        field: "organizationType",
        message: `organizationType must be one of: ${ALLOWED_ORGANIZATION_TYPES.join(", ")}`,
      });
    }
  }

  if (body.parentOrganizationId !== undefined && body.parentOrganizationId !== null) {
    if (!Number.isInteger(body.parentOrganizationId) || body.parentOrganizationId <= 0) {
      errors.push({ field: "parentOrganizationId", message: "parentOrganizationId must be a positive integer" });
    }
  }

  if (errors.length) throw new ValidationError("Invalid organization payload", errors);
}

/** Validates payload for PUT/PATCH /organizations/:id. Same rules, all fields optional-aware. */
function validateUpdatePayload(body = {}) {
  const errors = [];

  if (body.organizationName !== undefined) {
    if (!isNonEmptyString(body.organizationName)) {
      errors.push({ field: "organizationName", message: "organizationName cannot be empty" });
    } else if (body.organizationName.length > 200) {
      errors.push({ field: "organizationName", message: "organizationName must be at most 200 characters" });
    }
  }

  if (body.organizationType !== undefined && body.organizationType !== null) {
    if (!ALLOWED_ORGANIZATION_TYPES.includes(body.organizationType)) {
      errors.push({
        field: "organizationType",
        message: `organizationType must be one of: ${ALLOWED_ORGANIZATION_TYPES.join(", ")}`,
      });
    }
  }

  if (body.parentOrganizationId !== undefined && body.parentOrganizationId !== null) {
    if (!Number.isInteger(body.parentOrganizationId) || body.parentOrganizationId <= 0) {
      errors.push({ field: "parentOrganizationId", message: "parentOrganizationId must be a positive integer" });
    }
  }

  if (errors.length) throw new ValidationError("Invalid organization payload", errors);
}

/** Validates payload for PATCH /organizations/:id/status. */
function validateStatusPayload(body = {}) {
  const errors = [];
  if (!isNonEmptyString(body.status)) {
    errors.push({ field: "status", message: "status is required" });
  } else if (!ALLOWED_STATUSES.includes(body.status)) {
    errors.push({ field: "status", message: `status must be one of: ${ALLOWED_STATUSES.join(", ")}` });
  }
  if (errors.length) throw new ValidationError("Invalid status payload", errors);
}

module.exports = {
  ValidationError,
  ConflictError,
  ALLOWED_STATUSES,
  ALLOWED_ORGANIZATION_TYPES,
  validateCreatePayload,
  validateUpdatePayload,
  validateStatusPayload,
};
