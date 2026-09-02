const express = require("express");
const router = express.Router();
const facilityController = require("../controllers/facilityController");

// Route paths are relative to /api/v1/organization-admin/facilities

/**
 * @openapi
 * /api/v1/organization-admin/facilities/list:
 *   get:
 *     summary: List active facilities (unpaginated, for dropdowns). Optional organizationId filter.
 *     tags: [Facilities]
 *     parameters:
 *       - in: query
 *         name: organizationId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of active facilities
 */
router.get("/list", facilityController.getFacilities);

/**
 * @openapi
 * /api/v1/organization-admin/facilities:
 *   get:
 *     summary: List facilities (paginated, filterable by status, facilityType, organizationId, search)
 *     tags: [Facilities]
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
 *         name: facilityType
 *         schema: { type: string, enum: [CHC, PHC, SUB_CENTER, DISTRICT_HOSPITAL, CLINIC, OTHER] }
 *       - in: query
 *         name: organizationId
 *         schema: { type: integer }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Matches against facilityName
 *     responses:
 *       200:
 *         description: Paginated list of facilities
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.get("/", facilityController.getFacilityList);

/**
 * @openapi
 * /api/v1/organization-admin/facilities/{facilityId}:
 *   get:
 *     summary: Get a facility by ID
 *     tags: [Facilities]
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Facility detail object
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:facilityId", facilityController.getFacilityById);

/**
 * @openapi
 * /api/v1/organization-admin/facilities:
 *   post:
 *     summary: Create a facility
 *     tags: [Facilities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [organizationId, facilityName]
 *             properties:
 *               organizationId: { type: integer }
 *               facilityName: { type: string, example: "CHC Lucknow North" }
 *               facilityType: { type: string, enum: [CHC, PHC, SUB_CENTER, DISTRICT_HOSPITAL, CLINIC, OTHER] }
 *               addressLine1: { type: string }
 *               addressLine2: { type: string }
 *               city: { type: string }
 *               stateName: { type: string }
 *               districtName: { type: string }
 *               postalCode: { type: string }
 *               country: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               phoneNumber: { type: string }
 *               email: { type: string }
 *     responses:
 *       201:
 *         description: Facility created
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.post("", facilityController.createFacility);

/**
 * @openapi
 * /api/v1/organization-admin/facilities/{facilityId}:
 *   put:
 *     summary: Update a facility's info
 *     tags: [Facilities]
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Facility updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/:facilityId", facilityController.updateFacility);

/**
 * @openapi
 * /api/v1/organization-admin/facilities/{facilityId}:
 *   delete:
 *     summary: Soft-delete a facility
 *     tags: [Facilities]
 *     parameters:
 *       - in: path
 *         name: facilityId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Facility deleted (status set to DELETED)
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:facilityId", facilityController.deleteFacility);

/**
 * @openapi
 * /api/v1/organization-admin/facilities/{facilityId}/status:
 *   patch:
 *     summary: Update a facility's status
 *     tags: [Facilities]
 *     parameters:
 *       - in: path
 *         name: facilityId
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
 *         description: Facility status updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/:facilityId/status", facilityController.updateStatus);

module.exports = router;
