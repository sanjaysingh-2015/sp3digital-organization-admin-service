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

/**
 * @openapi
 * /internal/organizations:
 *   post:
 *     tags: [Internal]
 *     summary: Create an organization during identity-admin-service self-service tenant registration
 *     description: >
 *       Callable only with the shared internal-service token, before the
 *       first user of a new tenant exists — so tenantUuid and userId are
 *       supplied directly in the body rather than derived from a user JWT.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/XTenantUuid'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/InternalOrganizationCreateRequest' }
 *     responses:
 *       201:
 *         description: Organization created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Organization' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       403:
 *         description: Caller authenticated with an end-user JWT rather than the internal-service token.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.post(
  '/organizations',
  requireInternalService,
  validate(internalCreateSchema),
  organizationController.internalCreate,
);

module.exports = router;
