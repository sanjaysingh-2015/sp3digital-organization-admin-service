const facilityService = require("../services/facilityService");

const {
  validateCreatePayload,
  validateUpdatePayload,
  validateStatusPayload,
} = require("../validations/facility.validation");

class FacilityController {
  getFacilityList = async (req, res, next) => {
    try {
      const { page, limit, status, facilityType, organizationId, search } = req.query;
      const facilities = await facilityService.getFacilityList({
        page,
        limit,
        status,
        facilityType,
        organizationId,
        search,
      });
      return res.status(200).json(facilities);
    } catch (error) {
      return next(error);
    }
  };

  // For dropdowns
  getFacilities = async (req, res) => {
    try {
      const { organizationId } = req.query;
      const facilities = await facilityService.getFacilities({ organizationId });
      return res.status(200).json({
        success: true,
        count: facilities.length,
        data: facilities,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Error fetching facilities",
      });
    }
  };

  getFacilityById = async (req, res, next) => {
    try {
      const facility = await facilityService.getFacilityById(req.params.facilityId);
      return res.status(200).json(facility);
    } catch (error) {
      return next(error);
    }
  };

  createFacility = async (req, res, next) => {
    try {
      validateCreatePayload(req.body);
      const facility = await facilityService.createFacility(req.body, req.auth.userId);
      return res.status(201).json(facility);
    } catch (error) {
      return next(error);
    }
  };

  updateFacility = async (req, res, next) => {
    try {
      validateUpdatePayload(req.body);
      const facility = await facilityService.updateFacility(
        req.params.facilityId,
        req.body,
        req.auth.userId,
      );
      return res.status(200).json(facility);
    } catch (error) {
      return next(error);
    }
  };

  deleteFacility = async (req, res, next) => {
    try {
      const facility = await facilityService.deleteFacility(
        req.params.facilityId,
        req.auth.userId,
      );
      return res.status(200).json(facility);
    } catch (error) {
      return next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      validateStatusPayload(req.body);
      const facility = await facilityService.updateStatus(
        req.params.facilityId,
        req.body.status,
        req.auth.userId,
      );
      return res.status(200).json(facility);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new FacilityController();
