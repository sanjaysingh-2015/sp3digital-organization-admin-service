const { Joi } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');

// Matches FACILITY_TYPES in facilities.component.ts exactly.
const FACILITY_TYPES = ['CHC', 'PHC', 'SUB_CENTER', 'DISTRICT_HOSPITAL', 'CLINIC', 'OTHER'];
const STATUSES = ['ACTIVE', 'INACTIVE', 'DISABLED', 'DELETED'];

const listQuerySchema = paginationQuerySchema({
  search: Joi.string().max(200).allow('').optional(),
  status: Joi.string().valid(...STATUSES, '').optional(),
  facilityType: Joi.string().valid(...FACILITY_TYPES, '').optional(),
  organizationId: Joi.number().integer().positive().allow('').optional(),
});

const addressFields = {
  addressLine1: Joi.string().trim().max(250).allow(null, '').optional(),
  addressLine2: Joi.string().trim().max(250).allow(null, '').optional(),
  cityId: Joi.number().allow(null).optional(),
  subDistrictId: Joi.number().allow(null).optional(),
  districtId: Joi.number().allow(null).optional(),
  stateId: Joi.number().allow(null).optional(),
  postalCodeId: Joi.number().allow(null).optional(),
  countryId: Joi.number().allow(null).optional(),
  latitude: Joi.number().min(-90).max(90).allow(null).optional(),
  longitude: Joi.number().min(-180).max(180).allow(null).optional(),
  phoneNumber: Joi.string().trim().max(30).allow(null, '').optional(),
  email: Joi.string().trim().email().max(320).allow(null, '').optional(),
};

const createSchema = Joi.object({
  organizationId: Joi.number().integer().positive().required(),
  facilityName: Joi.string().trim().min(2).max(200).required(),
  facilityType: Joi.string().valid(...FACILITY_TYPES).allow(null).optional(),
  ...addressFields,
});

const updateSchema = Joi.object({
  organizationId: Joi.number().integer().positive().optional(),
  facilityName: Joi.string().trim().min(2).max(200).optional(),
  facilityType: Joi.string().valid(...FACILITY_TYPES).allow(null).optional(),
  ...addressFields,
}).min(1);

const statusSchema = Joi.object({
  status: Joi.string().valid(...STATUSES).required(),
});

module.exports = { FACILITY_TYPES, STATUSES, listQuerySchema, createSchema, updateSchema, statusSchema };
