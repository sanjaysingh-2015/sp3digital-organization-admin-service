const express = require("express");
const router = express.Router();
const organizationController = require("../controllers/organizationController");

// Route paths are relative to /api/v1/organization-admin/organizations

/**
 * @openapi
 * /api/v1/organization-admin/organizations/list:
 *   get:
 *     summary: List active organizations for the caller's tenant (unpaginated, for dropdowns)
 *     tags: [Organizations]
 *     responses:
 *       200:
 *         description: List of active organizations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 count: { type: integer, example: 3 }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Organization' }
 *       500:
 *         description: Unexpected error fetching organizations
 */
router.get("/list", organizationController.getOrganizations);

/**
 * @openapi
 * /api/v1/organization-admin/organizations:
 *   get:
 *     summary: List organizations for the caller's tenant (paginated, filterable)
 *     tags: [Organizations]
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
 *         name: organizationType
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches against organizationName
 *     responses:
 *       200:
 *         description: Paginated list of organizations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Organization' }
 *                 pagination: { $ref: '#/components/schemas/PaginationMeta' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.get("/", organizationController.getOrganizationList);

/**
 * @openapi
 * /api/v1/organization-admin/organizations/{organizationId}:
 *   get:
 *     summary: Get an organization by ID
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Organization detail object
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:organizationId", organizationController.getOrganizationById);

/**
 * @openapi
 * /api/v1/organization-admin/organizations:
 *   post:
 *     summary: Create an organization
 *     tags: [Organizations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationName]
 *             properties:
 *               organizationName: { type: string, example: "NHM Uttar Pradesh" }
 *               organizationType:
 *                 type: string
 *                 enum: [STATE_HEALTH_DEPT, DISTRICT_HEALTH_AUTHORITY, HEALTH_NETWORK, GOVERNMENT, NGO, PRIVATE_CHAIN, OTHER]
 *               parentOrganizationId: { type: integer, nullable: true }
 *     responses:
 *       201:
 *         description: Organization created
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.post("", organizationController.createOrganization);

/**
 * @openapi
 * /api/v1/organization-admin/organizations/{organizationId}:
 *   put:
 *     summary: Update an organization's info
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               organizationName: { type: string }
 *               organizationType: { type: string }
 *               parentOrganizationId: { type: integer, nullable: true }
 *     responses:
 *       200:
 *         description: Organization updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/:organizationId", organizationController.updateOrganization);

/**
 * @openapi
 * /api/v1/organization-admin/organizations/{organizationId}:
 *   delete:
 *     summary: Soft-delete an organization
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Organization deleted (status set to DELETED)
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:organizationId", organizationController.deleteOrganization);

/**
 * @openapi
 * /api/v1/organization-admin/organizations/{organizationId}/status:
 *   patch:
 *     summary: Update an organization's status
 *     tags: [Organizations]
 *     parameters:
 *       - in: path
 *         name: organizationId
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
 *         description: Organization status updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/:organizationId/status", organizationController.updateStatus);

module.exports = router;
