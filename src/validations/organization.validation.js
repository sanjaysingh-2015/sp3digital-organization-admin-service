const { Joi } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');

// Matches ORGANIZATION_TYPES in organizations.component.ts exactly — keep
// these two lists in sync if either changes.
const ORGANIZATION_TYPES = [
  'STATE_HEALTH_DEPT',
  'DISTRICT_HEALTH_AUTHORITY',
  'HEALTH_NETWORK',
  'GOVERNMENT',
  'NGO',
  'PRIVATE_CHAIN',
  'OTHER',
];

const STATUSES = ['ACTIVE', 'INACTIVE', 'DISABLED', 'DELETED'];

const listQuerySchema = paginationQuerySchema({
  search: Joi.string().max(200).allow('').optional(),
  status: Joi.string().valid(...STATUSES, '').optional(),
  organizationType: Joi.string().valid(...ORGANIZATION_TYPES, '').optional(),
});

const createSchema = Joi.object({
  organizationName: Joi.string().trim().min(2).max(200).required(),
  organizationType: Joi.string().valid(...ORGANIZATION_TYPES).allow(null).optional(),
  parentOrganizationId: Joi.number().integer().positive().allow(null).optional(),
});

const updateSchema = Joi.object({
  organizationName: Joi.string().trim().min(2).max(200).optional(),
  organizationType: Joi.string().valid(...ORGANIZATION_TYPES).allow(null).optional(),
  parentOrganizationId: Joi.number().integer().positive().allow(null).optional(),
}).min(1);

const statusSchema = Joi.object({
  status: Joi.string().valid(...STATUSES).required(),
});

// Internal (service-to-service) create is a slightly different shape:
// identity-admin-service's registrationService.js supplies tenantUuid and
// userId directly in the body rather than deriving them from a user JWT,
// since registration happens before the user can log in.
const internalCreateSchema = Joi.object({
  tenantUuid: Joi.string().uuid().required(),
  organizationName: Joi.string().trim().min(2).max(200).required(),
  organizationType: Joi.string().valid(...ORGANIZATION_TYPES).allow(null).optional(),
  parentOrganizationId: Joi.number().integer().positive().allow(null).optional(),
  userId: Joi.number().integer().positive().allow(null).optional(),
});

module.exports = {
  ORGANIZATION_TYPES,
  STATUSES,
  listQuerySchema,
  createSchema,
  updateSchema,
  statusSchema,
  internalCreateSchema,
};
