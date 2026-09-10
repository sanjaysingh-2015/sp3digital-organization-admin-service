const { Joi } = require('../middleware/validate');
const { paginationQuerySchema } = require('../utils/pagination');


const STATUSES = ['ACTIVE', 'INACTIVE', 'DISABLED', 'DELETED'];

const listQuerySchema = paginationQuerySchema({
  search: Joi.string().max(200).allow('').optional(),
  status: Joi.string().valid(...STATUSES, '').optional(),
});

const createSchema = Joi.object({
  serviceCategoryName: Joi.string().trim().min(2).max(200).required(),
  description: Joi.string().trim().max(500).optional(),
});

const updateSchema = Joi.object({
  serviceCategoryName: Joi.string().trim().min(2).max(200).required(),
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
