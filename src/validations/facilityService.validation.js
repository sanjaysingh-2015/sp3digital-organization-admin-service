const { Joi } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');

const STATUSES = ['ACTIVE', 'INACTIVE', 'DISABLED', 'DELETED'];

const listQuerySchema = paginationQuerySchema({
  search: Joi.string().max(200).allow('').optional(),
  status: Joi.string().valid(...STATUSES, '').optional(),
  facilityId: Joi.number().integer().positive().allow('').optional(),
  serviceCategoryId: Joi.number().integer().positive().allow('').optional(),
  serviceId: Joi.number().integer().positive().allow('').optional(),
});

const createSchema = Joi.object({
  facilityId: Joi.number().integer().positive().required(),
  departmentId: Joi.number().integer().positive().allow(null).optional(),
  serviceId: Joi.number().integer().positive().allow(null).optional(),
  serviceCategoryId: Joi.number().integer().positive().allow(null).optional(),
});

const updateSchema = Joi.object({
  facilityId: Joi.number().integer().positive().optional(),
  departmentId: Joi.number().integer().positive().allow(null).optional(),
  serviceId: Joi.number().integer().positive().allow(null).optional(),
  serviceCategoryId: Joi.number().integer().positive().allow(null).optional(),
}).min(1);

const statusSchema = Joi.object({
  status: Joi.string().valid(...STATUSES).required(),
});

module.exports = { STATUSES, listQuerySchema, createSchema, updateSchema, statusSchema };
