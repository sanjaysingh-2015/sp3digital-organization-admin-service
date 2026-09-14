const { Joi } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');


const STATUSES = ['ACTIVE', 'INACTIVE', 'DISABLED', 'DELETED'];

const listQuerySchema = paginationQuerySchema({
  search: Joi.string().max(200).allow('').optional(),
  status: Joi.string().valid(...STATUSES, '').optional(),
  // Controller/service already read+filter on this — it was missing here,
  // so `validate()`'s stripUnknown silently dropped it from every request.
  organizationId: Joi.number().integer().positive().allow('').optional(),
  serviceCategoryId: Joi.number().integer().positive().allow('').optional(),
});

const createSchema = Joi.object({
  // Required: serviceService.create() calls assertOrganizationExists()
  // unconditionally, so a create request with no organizationId always
  // 404s. Same field name/shape as facility.validation.js's parent id.
  organizationId: Joi.number().integer().positive().required(),
  // Required: the DB column is NOT NULL and nothing else supplies it.
  // Was missing here entirely, so every create request had it silently
  // stripped and the row was inserted with a null service_category_id.
  serviceCategoryId: Joi.number().integer().positive().required(),
  serviceName: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().max(500).optional(),
});

const updateSchema = Joi.object({
  organizationId: Joi.number().integer().positive().optional(),
  serviceCategoryId: Joi.number().integer().positive().optional(),
  serviceName: Joi.string().trim().min(2).max(200).optional(),
  description: Joi.string().trim().max(500).optional(),
}).min(1);

const statusSchema = Joi.object({
  status: Joi.string().valid(...STATUSES).required(),
});

module.exports = {
  STATUSES,
  listQuerySchema,
  createSchema,
  updateSchema,
  statusSchema,
};
