const express = require('express');
const router = express.Router();

const controller = require('../controllers/organizationController');
const { requireInternalService } = require('../middleware/authentication');
const { validate } = require('../middleware/validate');
const { listQuerySchema, createSchema, updateSchema, statusSchema } = require('../validations/organization.validation');

// See app.js: authenticate() runs for the whole /api/v1/organization-admin
// mount, so every handler below already has req.auth populated. authorize()
// is deliberately NOT chained per-route yet — see authentication.js's
// authorize() doc comment for why (no ORGANIZATION-ADMIN:* permission
// codes exist upstream yet). Left in place, commented at the call site
// below, so enabling it later is a one-line change per route.

// Route paths are relative to /api/v1/organization-admin/organizations.

router.get('/list', controller.getDropdownList);
router.get('/', validate(listQuerySchema, 'query'), controller.getList);
router.post('/', validate(createSchema), controller.create);

router.get('/:organizationId', controller.getById);
router.put('/:organizationId', validate(updateSchema), controller.update);
router.patch('/:organizationId/status', validate(statusSchema), controller.updateStatus);

// Hard delete is intentionally internal-service-only — organization-admin-ui
// always uses PATCH .../status {status: 'DELETED'} (see organizationService's
// hardDelete doc comment for why). Not chaining `authorize` here: it's
// already narrower than any permission check could be.
router.delete('/:organizationId', requireInternalService, controller.hardDelete);

module.exports = router;
