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

/**
 * @openapi
 * /organizations/list:
 *   get:
 *     tags: [Organizations]
 *     summary: Unpaginated ACTIVE-only list, for dropdowns (parent-org / facility org picker)
 *     responses:
 *       200:
 *         description: All ACTIVE organizations for the caller's tenant.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Organization' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/list', controller.getDropdownList);

/**
 * @openapi
 * /organizations:
 *   get:
 *     tags: [Organizations]
 *     summary: Paginated, filterable list of organizations
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortDirParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/StatusFilterParam'
 *       - name: organizationType
 *         in: query
 *         schema: { type: string, enum: [STATE_HEALTH_DEPT, DISTRICT_HEALTH_AUTHORITY, HEALTH_NETWORK, GOVERNMENT, NGO, PRIVATE_CHAIN, OTHER] }
 *     responses:
 *       200:
 *         description: Paginated organizations.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Organization' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *   post:
 *     tags: [Organizations]
 *     summary: Create an organization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OrganizationCreateRequest' }
 *     responses:
 *       201:
 *         description: Organization created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Organization' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/', validate(listQuerySchema, 'query'), controller.getList);
router.post('/', validate(createSchema), controller.create);

/**
 * @openapi
 * /organizations/{organizationId}:
 *   get:
 *     tags: [Organizations]
 *     summary: Get an organization by id
 *     parameters:
 *       - name: organizationId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: The organization.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Organization' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Organizations]
 *     summary: Update an organization
 *     parameters:
 *       - name: organizationId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/OrganizationUpdateRequest' }
 *     responses:
 *       200:
 *         description: Updated organization.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Organization' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   delete:
 *     tags: [Organizations]
 *     summary: Hard delete an organization (internal-service callers only)
 *     description: >
 *       organization-admin-ui never calls this directly — it always uses
 *       PATCH .../status with `{ "status": "DELETED" }` for a soft delete.
 *       This route is reserved for identity-admin-service's registration
 *       rollback/compensation flow, authenticated with the shared
 *       internal-service token.
 *     parameters:
 *       - name: organizationId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *       - $ref: '#/components/parameters/XTenantUuid'
 *     responses:
 *       200:
 *         description: Organization permanently deleted.
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       403:
 *         description: Caller authenticated with an end-user JWT rather than the internal-service token.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:organizationId', controller.getById);
router.put('/:organizationId', validate(updateSchema), controller.update);

/**
 * @openapi
 * /organizations/{organizationId}/status:
 *   patch:
 *     tags: [Organizations]
 *     summary: Transition an organization's status (the normal soft-delete path is `{"status":"DELETED"}`)
 *     parameters:
 *       - name: organizationId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/StatusUpdateRequest' }
 *     responses:
 *       200:
 *         description: Organization with updated status.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Organization' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:organizationId/status', validate(statusSchema), controller.updateStatus);

// Hard delete is intentionally internal-service-only — organization-admin-ui
// always uses PATCH .../status {status: 'DELETED'} (see organizationService's
// hardDelete doc comment for why). Not chaining `authorize` here: it's
// already narrower than any permission check could be.
router.delete('/:organizationId', requireInternalService, controller.hardDelete);

module.exports = router;
