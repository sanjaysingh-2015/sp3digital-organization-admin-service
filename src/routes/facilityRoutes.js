const express = require('express');
const router = express.Router();

const controller = require('../controllers/facilityController');
const { validate } = require('../middleware/validate');
const { listQuerySchema, createSchema, updateSchema, statusSchema } = require('../validations/facility.validation');

// Route paths are relative to /api/v1/organization-admin/facilities.

router.get('/list', controller.getDropdownList);
router.get('/', validate(listQuerySchema, 'query'), controller.getList);
router.post('/', validate(createSchema), controller.create);

router.get('/:facilityId', controller.getById);
router.put('/:facilityId', validate(updateSchema), controller.update);
router.patch('/:facilityId/status', validate(statusSchema), controller.updateStatus);

module.exports = router;
