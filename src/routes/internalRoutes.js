const express = require('express');
const router = express.Router();

const organizationController = require('../controllers/organizationController');
const { requireInternalService } = require('../middleware/authentication');
const { validate } = require('../middleware/validate');
const { internalCreateSchema } = require('../validations/organization.validation');

// Route paths are relative to /api/v1/organization-admin/internal.
// authenticate() already ran at the app-level mount (see app.js); this just
// additionally requires that authentication resolved to the internal
// service credential specifically, not an end-user JWT.
router.post(
  '/organizations',
  requireInternalService,
  validate(internalCreateSchema),
  organizationController.internalCreate,
);

module.exports = router;
