const express = require('express');
const router = express.Router();

const controller = require('../controllers/departmentController');
const { validate, Joi } = require('../middleware/validate');
const { listQuerySchema, createSchema, updateSchema, statusSchema } = require('../validations/department.validation');

// Route paths are relative to /api/v1/organization-admin/departments.

const dropdownQuerySchema = Joi.object({
  facilityId: Joi.number().integer().positive().optional(),
});

router.get('/list', validate(dropdownQuerySchema, 'query'), controller.getDropdownList);
router.get('/', validate(listQuerySchema, 'query'), controller.getList);
router.post('/', validate(createSchema), controller.create);

router.get('/:departmentId', controller.getById);
router.put('/:departmentId', validate(updateSchema), controller.update);
router.patch('/:departmentId/status', validate(statusSchema), controller.updateStatus);

module.exports = router;
