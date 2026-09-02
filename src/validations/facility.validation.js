/**
 * facility.validation.js — validation for the /facilities endpoints.
 */
const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE", "DISABLED", "DELETED"];
const ALLOWED_FACILITY_TYPES = [
  "CHC",
  "PHC",
  "SUB_CENTER",
  "DISTRICT_HOSPITAL",
  "CLINIC",
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

function isValidEmail(value) {
  if (value === undefined || value === null || value === "") return true; // optional
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPositiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

function validateCreatePayload(body = {}) {
  const errors = [];

  if (!isPositiveInt(body.organizationId)) {
    errors.push({ field: "organizationId", message: "organizationId is required and must be a positive integer" });
  }
  if (!isNonEmptyString(body.facilityName)) {
    errors.push({ field: "facilityName", message: "facilityName is required" });
  } else if (body.facilityName.length > 200) {
    errors.push({ field: "facilityName", message: "facilityName must be at most 200 characters" });
  }
  if (body.facilityType !== undefined && body.facilityType !== null) {
    if (!ALLOWED_FACILITY_TYPES.includes(body.facilityType)) {
      errors.push({ field: "facilityType", message: `facilityType must be one of: ${ALLOWED_FACILITY_TYPES.join(", ")}` });
    }
  }
  if (!isValidEmail(body.email)) {
    errors.push({ field: "email", message: "email must be a valid email address" });
  }
  if (body.latitude !== undefined && body.latitude !== null && typeof body.latitude !== "number") {
    errors.push({ field: "latitude", message: "latitude must be a number" });
  }
  if (body.longitude !== undefined && body.longitude !== null && typeof body.longitude !== "number") {
    errors.push({ field: "longitude", message: "longitude must be a number" });
  }

  if (errors.length) throw new ValidationError("Invalid facility payload", errors);
}

function validateUpdatePayload(body = {}) {
  const errors = [];

  if (body.organizationId !== undefined && !isPositiveInt(body.organizationId)) {
    errors.push({ field: "organizationId", message: "organizationId must be a positive integer" });
  }
  if (body.facilityName !== undefined) {
    if (!isNonEmptyString(body.facilityName)) {
      errors.push({ field: "facilityName", message: "facilityName cannot be empty" });
    } else if (body.facilityName.length > 200) {
      errors.push({ field: "facilityName", message: "facilityName must be at most 200 characters" });
    }
  }
  if (body.facilityType !== undefined && body.facilityType !== null) {
    if (!ALLOWED_FACILITY_TYPES.includes(body.facilityType)) {
      errors.push({ field: "facilityType", message: `facilityType must be one of: ${ALLOWED_FACILITY_TYPES.join(", ")}` });
    }
  }
  if (!isValidEmail(body.email)) {
    errors.push({ field: "email", message: "email must be a valid email address" });
  }

  if (errors.length) throw new ValidationError("Invalid facility payload", errors);
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
  ALLOWED_FACILITY_TYPES,
  validateCreatePayload,
  validateUpdatePayload,
  validateStatusPayload,
};
