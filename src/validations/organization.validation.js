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

// Same shape/limits as facility.validation.js's addressFields -- the
// address-picker component fills these in the same way for both entities.
const addressFields = {
  addressLine1: Joi.string().trim().max(250).allow(null, '').optional(),
  addressLine2: Joi.string().trim().max(250).allow(null, '').optional(),
  city: Joi.string().trim().max(100).allow(null, '').optional(),
  subDistrictName: Joi.string().trim().max(100).allow(null, '').optional(),
  districtName: Joi.string().trim().max(100).allow(null, '').optional(),
  stateName: Joi.string().trim().max(100).allow(null, '').optional(),
  postalCode: Joi.string().trim().max(20).allow(null, '').optional(),
  country: Joi.string().trim().max(100).allow(null, '').optional(),
  latitude: Joi.number().min(-90).max(90).allow(null).optional(),
  longitude: Joi.number().min(-180).max(180).allow(null).optional(),
};

const createSchema = Joi.object({
  organizationName: Joi.string().trim().min(2).max(200).required(),
  organizationType: Joi.string().valid(...ORGANIZATION_TYPES).allow(null).optional(),
  parentOrganizationId: Joi.number().integer().positive().allow(null).optional(),
  ...addressFields,
});

const updateSchema = Joi.object({
  organizationName: Joi.string().trim().min(2).max(200).optional(),
  organizationType: Joi.string().valid(...ORGANIZATION_TYPES).allow(null).optional(),
  parentOrganizationId: Joi.number().integer().positive().allow(null).optional(),
  ...addressFields,
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
