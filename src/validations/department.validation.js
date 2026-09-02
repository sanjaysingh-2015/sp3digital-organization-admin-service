/**
 * department.validation.js — validation for the /departments endpoints.
 */
const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE", "DISABLED", "DELETED"];
const ALLOWED_DEPARTMENT_TYPES = [
  "OPD",
  "IPD",
  "EMERGENCY",
  "LAB",
  "PHARMACY",
  "RADIOLOGY",
  "MATERNITY",
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
  if (!isNonEmptyString(body.departmentName)) {
    errors.push({ field: "departmentName", message: "departmentName is required" });
  } else if (body.departmentName.length > 150) {
    errors.push({ field: "departmentName", message: "departmentName must be at most 150 characters" });
  }
  if (body.departmentType !== undefined && body.departmentType !== null) {
    if (!ALLOWED_DEPARTMENT_TYPES.includes(body.departmentType)) {
      errors.push({ field: "departmentType", message: `departmentType must be one of: ${ALLOWED_DEPARTMENT_TYPES.join(", ")}` });
    }
  }

  if (errors.length) throw new ValidationError("Invalid department payload", errors);
}

function validateUpdatePayload(body = {}) {
  const errors = [];

  if (body.facilityId !== undefined && !isPositiveInt(body.facilityId)) {
    errors.push({ field: "facilityId", message: "facilityId must be a positive integer" });
  }
  if (body.departmentName !== undefined) {
    if (!isNonEmptyString(body.departmentName)) {
      errors.push({ field: "departmentName", message: "departmentName cannot be empty" });
    } else if (body.departmentName.length > 150) {
      errors.push({ field: "departmentName", message: "departmentName must be at most 150 characters" });
    }
  }
  if (body.departmentType !== undefined && body.departmentType !== null) {
    if (!ALLOWED_DEPARTMENT_TYPES.includes(body.departmentType)) {
      errors.push({ field: "departmentType", message: `departmentType must be one of: ${ALLOWED_DEPARTMENT_TYPES.join(", ")}` });
    }
  }

  if (errors.length) throw new ValidationError("Invalid department payload", errors);
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
  ALLOWED_DEPARTMENT_TYPES,
  validateCreatePayload,
  validateUpdatePayload,
  validateStatusPayload,
};
