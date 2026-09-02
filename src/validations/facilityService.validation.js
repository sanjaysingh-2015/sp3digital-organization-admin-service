/**
 * facilityService.validation.js — validation for the /facility-services endpoints.
 * (Named to avoid colliding with services/facilityServiceService.js.)
 */
const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE", "DISABLED", "DELETED"];
const ALLOWED_SERVICE_CATEGORIES = [
  "OUTPATIENT",
  "INPATIENT",
  "DIAGNOSTIC",
  "IMMUNIZATION",
  "MATERNAL_HEALTH",
  "TELECONSULTATION",
  "EMERGENCY",
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

function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

function validateCreatePayload(body = {}) {
  const errors = [];

  if (!isPositiveInt(body.facilityId)) {
    errors.push({ field: "facilityId", message: "facilityId is required and must be a positive integer" });
  }
  if (body.departmentId !== undefined && body.departmentId !== null && !isPositiveInt(body.departmentId)) {
    errors.push({ field: "departmentId", message: "departmentId must be a positive integer" });
  }
  if (!isNonEmptyString(body.serviceName)) {
    errors.push({ field: "serviceName", message: "serviceName is required" });
  } else if (body.serviceName.length > 200) {
    errors.push({ field: "serviceName", message: "serviceName must be at most 200 characters" });
  }
  if (body.serviceCategory !== undefined && body.serviceCategory !== null) {
    if (!ALLOWED_SERVICE_CATEGORIES.includes(body.serviceCategory)) {
      errors.push({ field: "serviceCategory", message: `serviceCategory must be one of: ${ALLOWED_SERVICE_CATEGORIES.join(", ")}` });
    }
  }

  if (errors.length) throw new ValidationError("Invalid facility service payload", errors);
}

function validateUpdatePayload(body = {}) {
  const errors = [];

  if (body.facilityId !== undefined && !isPositiveInt(body.facilityId)) {
    errors.push({ field: "facilityId", message: "facilityId must be a positive integer" });
  }
  if (body.departmentId !== undefined && body.departmentId !== null && !isPositiveInt(body.departmentId)) {
    errors.push({ field: "departmentId", message: "departmentId must be a positive integer" });
  }
  if (body.serviceName !== undefined) {
    if (!isNonEmptyString(body.serviceName)) {
      errors.push({ field: "serviceName", message: "serviceName cannot be empty" });
    } else if (body.serviceName.length > 200) {
      errors.push({ field: "serviceName", message: "serviceName must be at most 200 characters" });
    }
  }
  if (body.serviceCategory !== undefined && body.serviceCategory !== null) {
    if (!ALLOWED_SERVICE_CATEGORIES.includes(body.serviceCategory)) {
      errors.push({ field: "serviceCategory", message: `serviceCategory must be one of: ${ALLOWED_SERVICE_CATEGORIES.join(", ")}` });
    }
  }

  if (errors.length) throw new ValidationError("Invalid facility service payload", errors);
}

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
  ALLOWED_SERVICE_CATEGORIES,
  validateCreatePayload,
  validateUpdatePayload,
  validateStatusPayload,
};
