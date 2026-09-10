const express = require('express');
const router = express.Router();

const controller = require('../controllers/facilityServiceCatalogController');
const { validate } = require('../middleware/validate');
const {
  listQuerySchema,
  createSchema,
  updateSchema,
  statusSchema,
} = require('../validations/facilityService.validation');

// Route paths are relative to /api/v1/organization-admin/facility-services.

router.get('/', validate(listQuerySchema, 'query'), controller.getList);
router.post('/', validate(createSchema), controller.create);

router.get('/:facilityServiceId', controller.getById);
router.put('/:facilityServiceId', validate(updateSchema), controller.update);
router.patch('/:facilityServiceId/status', validate(statusSchema), controller.updateStatus);

module.exports = router;
