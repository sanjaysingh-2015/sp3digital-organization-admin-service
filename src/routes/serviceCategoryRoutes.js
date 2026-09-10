const express = require('express');
const router = express.Router();

const controller = require('../controllers/serviceCategoryController');
const { validate } = require('../middleware/validate');
const { listQuerySchema, createSchema, updateSchema, statusSchema } = require('../validations/serviceCategory.validation');

// Route paths are relative to /api/v1/organization-admin/facilities.

router.get('/list', controller.getDropdownList);
router.get('/', validate(listQuerySchema, 'query'), controller.getList);
router.post('/', validate(createSchema), controller.create);

router.get('/:serviceCategoryId', controller.getById);
router.put('/:serviceCategoryId', validate(updateSchema), controller.update);
router.patch('/:serviceCategoryId/status', validate(statusSchema), controller.updateStatus);

module.exports = router;
