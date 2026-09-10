const express = require('express');
const router = express.Router();

const controller = require('../controllers/serviceController');
const { validate } = require('../middleware/validate');
const { listQuerySchema, createSchema, updateSchema, statusSchema } = require('../validations/service.validation');

// Route paths are relative to /api/v1/organization-admin/service-categories.

/**
 * @openapi
 * /service/list:
 *   get:
 *     tags: [Services]
 *     summary: Unpaginated ACTIVE-only list, for dropdowns
 *     responses:
 *       200:
 *         description: All ACTIVE service categories for the caller's tenant.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Service' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/list', controller.getDropdownList);

/**
 * @openapi
 * /services:
 *   get:
 *     tags: [Services]
 *     summary: Paginated, filterable list of service categories
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortDirParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/StatusFilterParam'
 *       - name: organizationId
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated service categories.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Service' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *   post:
 *     tags: [Services]
 *     summary: Create a service category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ServiceCreateRequest' }
 *     responses:
 *       201:
 *         description: Service category created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Service' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404:
 *         description: The referenced organizationId does not exist in this tenant.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
router.get('/', validate(listQuerySchema, 'query'), controller.getList);
router.post('/', validate(createSchema), controller.create);

/**
 * @openapi
 * /services/{serviceId}:
 *   get:
 *     tags: [Services]
 *     summary: Get a service category by id
 *     parameters:
 *       - name: serviceId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: The service category.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Service' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Services]
 *     summary: Update a service category
 *     parameters:
 *       - name: serviceId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ServiceUpdateRequest' }
 *     responses:
 *       200:
 *         description: Updated service category.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Service' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:serviceId', controller.getById);
router.put('/:serviceId', validate(updateSchema), controller.update);

/**
 * @openapi
 * /services/{serviceId}/status:
 *   patch:
 *     tags: [Services]
 *     summary: Transition a service category's status (soft delete uses `{"status":"DELETED"}`)
 *     parameters:
 *       - name: serviceId
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
 *         description: Service category with updated status.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Service' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:serviceId/status', validate(statusSchema), controller.updateStatus);

module.exports = router;
