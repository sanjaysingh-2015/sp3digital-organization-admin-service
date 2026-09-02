const facilityServiceService = require("../services/facilityServiceService");

const {
  validateCreatePayload,
  validateUpdatePayload,
  validateStatusPayload,
} = require("../validations/facilityService.validation");

class FacilityServiceController {
  getServiceList = async (req, res, next) => {
    try {
      const { page, limit, status, facilityId, departmentId, serviceCategory, search } = req.query;
      const services = await facilityServiceService.getServiceList({
        page,
        limit,
        status,
        facilityId,
        departmentId,
        serviceCategory,
        search,
      });
      return res.status(200).json(services);
    } catch (error) {
      return next(error);
    }
  };

  getServices = async (req, res) => {
    try {
      const { facilityId, departmentId } = req.query;
      const services = await facilityServiceService.getServices({ facilityId, departmentId });
      return res.status(200).json({
        success: true,
        count: services.length,
        data: services,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Error fetching facility services",
      });
    }
  };

  getServiceById = async (req, res, next) => {
    try {
      const service = await facilityServiceService.getServiceById(req.params.facilityServiceId);
      return res.status(200).json(service);
    } catch (error) {
      return next(error);
    }
  };

  createService = async (req, res, next) => {
    try {
      validateCreatePayload(req.body);
      const service = await facilityServiceService.createService(req.body, req.auth.userId);
      return res.status(201).json(service);
    } catch (error) {
      return next(error);
    }
  };

  updateService = async (req, res, next) => {
    try {
      validateUpdatePayload(req.body);
      const service = await facilityServiceService.updateService(
        req.params.facilityServiceId,
        req.body,
        req.auth.userId,
      );
      return res.status(200).json(service);
    } catch (error) {
      return next(error);
    }
  };

  deleteService = async (req, res, next) => {
    try {
      const service = await facilityServiceService.deleteService(
        req.params.facilityServiceId,
        req.auth.userId,
      );
      return res.status(200).json(service);
    } catch (error) {
      return next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      validateStatusPayload(req.body);
      const service = await facilityServiceService.updateStatus(
        req.params.facilityServiceId,
        req.body.status,
        req.auth.userId,
      );
      return res.status(200).json(service);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new FacilityServiceController();
