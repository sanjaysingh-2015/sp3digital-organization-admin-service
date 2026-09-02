const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");

// Route paths are relative to /api/v1/organization-admin/departments

/**
 * @openapi
 * /api/v1/organization-admin/departments/list:
 *   get:
 *     summary: List active departments (unpaginated, for dropdowns). Optional facilityId filter.
 *     tags: [Departments]
 *     parameters:
 *       - in: query
 *         name: facilityId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of active departments
 */
router.get("/list", departmentController.getDepartments);

/**
 * @openapi
 * /api/v1/organization-admin/departments:
 *   get:
 *     summary: List departments (paginated, filterable by status, facilityId, search)
 *     tags: [Departments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [ACTIVE, INACTIVE, DISABLED, DELETED] }
 *       - in: query
 *         name: facilityId
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of departments
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.get("/", departmentController.getDepartmentList);

/**
 * @openapi
 * /api/v1/organization-admin/departments/{departmentId}:
 *   get:
 *     summary: Get a department by ID
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Department detail object
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:departmentId", departmentController.getDepartmentById);

/**
 * @openapi
 * /api/v1/organization-admin/departments:
 *   post:
 *     summary: Create a department
 *     tags: [Departments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [facilityId, departmentName]
 *             properties:
 *               facilityId: { type: integer }
 *               departmentName: { type: string, example: "Outpatient Department" }
 *               departmentType: { type: string, enum: [OPD, IPD, EMERGENCY, LAB, PHARMACY, RADIOLOGY, MATERNITY, OTHER] }
 *     responses:
 *       201:
 *         description: Department created
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.post("", departmentController.createDepartment);

/**
 * @openapi
 * /api/v1/organization-admin/departments/{departmentId}:
 *   put:
 *     summary: Update a department's info
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Department updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/:departmentId", departmentController.updateDepartment);

/**
 * @openapi
 * /api/v1/organization-admin/departments/{departmentId}:
 *   delete:
 *     summary: Soft-delete a department
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Department deleted (status set to DELETED)
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:departmentId", departmentController.deleteDepartment);

/**
 * @openapi
 * /api/v1/organization-admin/departments/{departmentId}/status:
 *   patch:
 *     summary: Update a department's status
 *     tags: [Departments]
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [ACTIVE, INACTIVE, DISABLED, DELETED] }
 *     responses:
 *       200:
 *         description: Department status updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/:departmentId/status", departmentController.updateStatus);

module.exports = router;
