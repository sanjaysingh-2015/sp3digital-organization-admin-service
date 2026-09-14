const express = require('express');
const router = express.Router();

const controller = require('../controllers/facilityServiceCatalogController');
const { validate,Joi } = require('../middleware/validate');
const {
  listQuerySchema,
  createSchema,
  updateSchema,
  statusSchema,
} = require('../validations/facilityService.validation');

const dropdownQuerySchema = Joi.object({
  facilityId: Joi.number().integer().positive().optional(),
});

// Route paths are relative to /api/v1/organization-admin/facility-services.
// Unlike the other resources, this one has no /list dropdown route — the
// controller/service don't implement getDropdownList.

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
 * /facility-services:
 *   get:
 *     tags: [Facility Services]
 *     summary: Paginated, filterable list of facility services
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
 *       - name: serviceCategory
 *         in: query
 *         schema: { type: string, enum: [OUTPATIENT, INPATIENT, DIAGNOSTIC, IMMUNIZATION, MATERNAL_HEALTH, TELECONSULTATION, EMERGENCY, OTHER] }
 *     responses:
 *       200:
 *         description: Paginated facility services.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/FacilityServiceCatalog' }
 *                 pagination: { $ref: '#/components/schemas/Pagination' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *   post:
 *     tags: [Facility Services]
 *     summary: Create a facility service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/FacilityServiceCreateRequest' }
 *     responses:
 *       201:
 *         description: Facility service created.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/FacilityServiceCatalog' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/', validate(listQuerySchema, 'query'), controller.getList);
router.post('/', validate(createSchema), controller.create);

/**
 * @openapi
 * /facility-services/{facilityServiceId}:
 *   get:
 *     tags: [Facility Services]
 *     summary: Get a facility service by id
 *     parameters:
 *       - name: facilityServiceId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: The facility service.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/FacilityServiceCatalog' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Facility Services]
 *     summary: Update a facility service
 *     parameters:
 *       - name: facilityServiceId
 *         in: path
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/FacilityServiceUpdateRequest' }
 *     responses:
 *       200:
 *         description: Updated facility service.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/FacilityServiceCatalog' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:facilityServiceId', controller.getById);
router.put('/:facilityServiceId', validate(updateSchema), controller.update);

/**
 * @openapi
 * /facility-services/{facilityServiceId}/status:
 *   patch:
 *     tags: [Facility Services]
 *     summary: Transition a facility service's status (soft delete uses `{"status":"DELETED"}`)
 *     parameters:
 *       - name: facilityServiceId
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
 *         description: Facility service with updated status.
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/FacilityServiceCatalog' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:facilityServiceId/status', validate(statusSchema), controller.updateStatus);

module.exports = router;
