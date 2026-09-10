const express = require('express');
const router = express.Router();

const controller = require('../controllers/departmentController');
const { validate, Joi } = require('../middleware/validate');
const { listQuerySchema, createSchema, updateSchema, statusSchema } = require('../validations/department.validation');

// Route paths are relative to /api/v1/organization-admin/departments.

const dropdownQuerySchema = Joi.object({
  facilityId: Joi.number().integer().positive().optional(),
});

/**
 * @openapi
 * /departments/list:
 *   get:
 *     tags: [Departments]
 *     summary: Unpaginated ACTIVE-only list, for dropdowns
 *     parameters:
 *       - name: facilityId
 *         in: query
 *         description: Narrow the dropdown to departments of a single facility.
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: All ACTIVE departments for the caller's tenant (optionally filtered by facility).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Department' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/list', validate(dropdownQuerySchema, 'query'), controller.getDropdownList);

/**
 * @openapi
 * /departments:
 *   get:
 *     tags: [Departments]
 *     summary: Paginated, filterable list of departments
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/SortByParam'
 *       - $ref: '#/components/parameters/SortDirParam'
 *       - $ref: '#/components/parameters/SearchParam'
 *       - $ref: '#/components/parameters/StatusFilterParam'
 *       - name: facilityId
 *         in: query
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Paginated departments.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Department' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *   post:
 *     tags: [Departments]
 *     summary: Create a department
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DepartmentCreateRequest' }
 *     responses:
 *       201:
 *         description: Department created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Department' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/', validate(listQuerySchema, 'query'), controller.getList);
router.post('/', validate(createSchema), controller.create);

/**
 * @openapi
 * /departments/{departmentId}:
 *   get:
 *     tags: [Departments]
 *     summary: Get a department by id
 *     parameters:
 *       - name: departmentId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: The department.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Department' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Departments]
 *     summary: Update a department
 *     parameters:
 *       - name: departmentId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DepartmentUpdateRequest' }
 *     responses:
 *       200:
 *         description: Updated department.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Department' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:departmentId', controller.getById);
router.put('/:departmentId', validate(updateSchema), controller.update);

/**
 * @openapi
 * /departments/{departmentId}/status:
 *   patch:
 *     tags: [Departments]
 *     summary: Transition a department's status (soft delete uses `{"status":"DELETED"}`)
 *     parameters:
 *       - name: departmentId
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
 *         description: Department with updated status.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Department' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:departmentId/status', validate(statusSchema), controller.updateStatus);

module.exports = router;
