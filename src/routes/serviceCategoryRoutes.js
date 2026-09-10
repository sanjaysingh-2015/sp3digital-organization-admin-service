const express = require('express');
const router = express.Router();

const controller = require('../controllers/serviceCategoryController');
const { validate } = require('../middleware/validate');
const { listQuerySchema, createSchema, updateSchema, statusSchema } = require('../validations/serviceCategory.validation');

// Route paths are relative to /api/v1/organization-admin/service-categories.

/**
 * @swagger
 * /service-categories/list:
 *   get:
 *     tags: [Service Categories]
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
 *                   items: { $ref: '#/components/schemas/ServiceCategory' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/list', controller.getDropdownList);

/**
 * @swagger
 * /service-categories:
 *   get:
 *     tags: [Service Categories]
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
 *                   items: { $ref: '#/components/schemas/ServiceCategory' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *   post:
 *     tags: [Service Categories]
 *     summary: Create a service category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ServiceCategoryCreateRequest' }
 *     responses:
 *       201:
 *         description: Service category created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ServiceCategory' }
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
 * @swagger
 * /service-categories/{serviceCategoryId}:
 *   get:
 *     tags: [Service Categories]
 *     summary: Get a service category by id
 *     parameters:
 *       - name: serviceCategoryId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: The service category.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ServiceCategory' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Service Categories]
 *     summary: Update a service category
 *     parameters:
 *       - name: serviceCategoryId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ServiceCategoryUpdateRequest' }
 *     responses:
 *       200:
 *         description: Updated service category.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ServiceCategory' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:serviceCategoryId', controller.getById);
router.put('/:serviceCategoryId', validate(updateSchema), controller.update);

/**
 * @swagger
 * /service-categories/{serviceCategoryId}/status:
 *   patch:
 *     tags: [Service Categories]
 *     summary: Transition a service category's status (soft delete uses `{"status":"DELETED"}`)
 *     parameters:
 *       - name: serviceCategoryId
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
 *             schema: { $ref: '#/components/schemas/ServiceCategory' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:serviceCategoryId/status', validate(statusSchema), controller.updateStatus);

module.exports = router;
