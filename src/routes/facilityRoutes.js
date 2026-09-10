const express = require('express');
const router = express.Router();

const controller = require('../controllers/facilityController');
const { validate } = require('../middleware/validate');
const { listQuerySchema, createSchema, updateSchema, statusSchema } = require('../validations/facility.validation');

// Route paths are relative to /api/v1/organization-admin/facilities.

/**
 * @openapi
 * /facilities/list:
 *   get:
 *     tags: [Facilities]
 *     summary: Unpaginated ACTIVE-only list, for dropdowns
 *     responses:
 *       200:
 *         description: All ACTIVE facilities for the caller's tenant.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Facility' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/list', controller.getDropdownList);

/**
 * @openapi
 * /facilities:
 *   get:
 *     tags: [Facilities]
 *     summary: Paginated, filterable list of facilities
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortDirParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/StatusFilterParam'
 *       - name: facilityType
 *         in: query
 *         schema: { type: string, enum: [CHC, PHC, SUB_CENTER, DISTRICT_HOSPITAL, CLINIC, OTHER] }
 *       - name: organizationId
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated facilities.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Facility' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *   post:
 *     tags: [Facilities]
 *     summary: Create a facility
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/FacilityCreateRequest' }
 *     responses:
 *       201:
 *         description: Facility created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Facility' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/', validate(listQuerySchema, 'query'), controller.getList);
router.post('/', validate(createSchema), controller.create);

/**
 * @openapi
 * /facilities/{facilityId}:
 *   get:
 *     tags: [Facilities]
 *     summary: Get a facility by id
 *     parameters:
 *       - name: facilityId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: The facility.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Facility' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Facilities]
 *     summary: Update a facility
 *     parameters:
 *       - name: facilityId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/FacilityUpdateRequest' }
 *     responses:
 *       200:
 *         description: Updated facility.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Facility' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:facilityId', controller.getById);
router.put('/:facilityId', validate(updateSchema), controller.update);

/**
 * @openapi
 * /facilities/{facilityId}/status:
 *   patch:
 *     tags: [Facilities]
 *     summary: Transition a facility's status (soft delete uses `{"status":"DELETED"}`)
 *     parameters:
 *       - name: facilityId
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
 *         description: Facility with updated status.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Facility' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:facilityId/status', validate(statusSchema), controller.updateStatus);

module.exports = router;
