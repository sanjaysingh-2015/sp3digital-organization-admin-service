const { Joi } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');

// Matches DEPARTMENT_TYPES in departments.component.ts exactly.
const DEPARTMENT_TYPES = ['OPD', 'IPD', 'EMERGENCY', 'LAB', 'PHARMACY', 'RADIOLOGY', 'MATERNITY', 'OTHER'];
const STATUSES = ['ACTIVE', 'INACTIVE', 'DISABLED', 'DELETED'];

const listQuerySchema = paginationQuerySchema({
  search: Joi.string().max(200).allow('').optional(),
  status: Joi.string().valid(...STATUSES, '').optional(),
  facilityId: Joi.number().integer().positive().allow('').optional(),
});

const createSchema = Joi.object({
  facilityId: Joi.number().integer().positive().required(),
  departmentName: Joi.string().trim().min(2).max(200).required(),
  departmentType: Joi.string().valid(...DEPARTMENT_TYPES).allow(null).optional(),
});

const updateSchema = Joi.object({
  facilityId: Joi.number().integer().positive().optional(),
  departmentName: Joi.string().trim().min(2).max(200).optional(),
  departmentType: Joi.string().valid(...DEPARTMENT_TYPES).allow(null).optional(),
}).min(1);

const statusSchema = Joi.object({
  status: Joi.string().valid(...STATUSES).required(),
});

module.exports = { DEPARTMENT_TYPES, STATUSES, listQuerySchema, createSchema, updateSchema, statusSchema };
