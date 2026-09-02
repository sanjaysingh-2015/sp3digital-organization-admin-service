const express = require("express");
const router = express.Router();
const facilityServiceController = require("../controllers/facilityServiceController");

// Route paths are relative to /api/v1/organization-admin/facility-services

/**
 * @openapi
 * /api/v1/organization-admin/facility-services/list:
 *   get:
 *     summary: List active facility services (unpaginated, for dropdowns)
 *     tags: [FacilityServices]
 *     parameters:
 *       - in: query
 *         name: facilityId
 *         schema: { type: integer }
 *       - in: query
 *         name: departmentId
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of active facility services
 */
router.get("/list", facilityServiceController.getServices);

/**
 * @openapi
 * /api/v1/organization-admin/facility-services:
 *   get:
 *     summary: List facility services (paginated, filterable)
 *     tags: [FacilityServices]
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
 *         name: departmentId
 *         schema: { type: integer }
 *       - in: query
 *         name: serviceCategory
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of facility services
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.get("/", facilityServiceController.getServiceList);

/**
 * @openapi
 * /api/v1/organization-admin/facility-services/{facilityServiceId}:
 *   get:
 *     summary: Get a facility service by ID
 *     tags: [FacilityServices]
 *     parameters:
 *       - in: path
 *         name: facilityServiceId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Facility service detail object
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get("/:facilityServiceId", facilityServiceController.getServiceById);

/**
 * @openapi
 * /api/v1/organization-admin/facility-services:
 *   post:
 *     summary: Create a facility service
 *     tags: [FacilityServices]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [facilityId, serviceName]
 *             properties:
 *               facilityId: { type: integer }
 *               departmentId: { type: integer, nullable: true }
 *               serviceName: { type: string, example: "Teleconsultation" }
 *               serviceCategory: { type: string, enum: [OUTPATIENT, INPATIENT, DIAGNOSTIC, IMMUNIZATION, MATERNAL_HEALTH, TELECONSULTATION, EMERGENCY, OTHER] }
 *     responses:
 *       201:
 *         description: Facility service created
 *       400: { $ref: '#/components/responses/ValidationError' }
 */
router.post("", facilityServiceController.createService);

/**
 * @openapi
 * /api/v1/organization-admin/facility-services/{facilityServiceId}:
 *   put:
 *     summary: Update a facility service's info
 *     tags: [FacilityServices]
 *     parameters:
 *       - in: path
 *         name: facilityServiceId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Facility service updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.put("/:facilityServiceId", facilityServiceController.updateService);

/**
 * @openapi
 * /api/v1/organization-admin/facility-services/{facilityServiceId}:
 *   delete:
 *     summary: Soft-delete a facility service
 *     tags: [FacilityServices]
 *     parameters:
 *       - in: path
 *         name: facilityServiceId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Facility service deleted (status set to DELETED)
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete("/:facilityServiceId", facilityServiceController.deleteService);

/**
 * @openapi
 * /api/v1/organization-admin/facility-services/{facilityServiceId}/status:
 *   patch:
 *     summary: Update a facility service's status
 *     tags: [FacilityServices]
 *     parameters:
 *       - in: path
 *         name: facilityServiceId
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
 *         description: Facility service status updated
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch("/:facilityServiceId/status", facilityServiceController.updateStatus);

module.exports = router;
