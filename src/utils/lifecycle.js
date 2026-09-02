/**
 * Shared lifecycle semantics for organization-domain master data
 * (organizations, facilities, departments, facility services). Kept in one
 * place so "what does DELETED mean" only has one answer across the codebase
 * — mirrors identity-service's utils/lifecycle.js conventions.
 *
 * ACTIVE     -> usable
 * INACTIVE   -> reversible admin action (e.g. facility temporarily closed).
 *               Can go back to ACTIVE.
 * DISABLED   -> administratively disabled (e.g. suspended pending review).
 *               Can go back to ACTIVE.
 * DELETED    -> soft-deleted. Terminal state for normal API flows.
 */
const STATUS = Object.freeze({
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DISABLED: 'DISABLED',
  DELETED: 'DELETED'
});

function notFound(entity) {
  const error = new Error(`${entity} not found`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  error.expose = true;
  return error;
}

function conflict(message, code = 'LIFECYCLE_CONFLICT', extra = {}) {
  const error = new Error(message);
  error.statusCode = 409;
  error.code = code;
  error.expose = true;
  Object.assign(error, extra);
  return error;
}

function assertNotDeleted(record, entity) {
  if (record.status === STATUS.DELETED) {
    throw conflict(`${entity} has been deleted and can no longer be modified`);
  }
}

/** Alias kept for parity with identity-service's assertMutable naming. */
function assertMutable(record, entity) {
  assertNotDeleted(record, entity);
}

module.exports = { STATUS, notFound, conflict, assertNotDeleted, assertMutable };
