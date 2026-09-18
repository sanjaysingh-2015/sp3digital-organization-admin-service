const facilityService = require('../services/facilityService');

class FacilityController {
  getList = async (req, res, next) => {
    try {
      const { page, limit, search, status, facilityType, organizationId } = req.query;
      const result = await facilityService.getList({
        page,
        limit,
        search,
        status,
        facilityType,
        organizationId,
        tenantUuid: req.auth.tenantUuid,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  // For dropdowns (departments' facility picker, facility-services' facility picker).
  getDropdownList = async (req, res, next) => {
    try {
      const result = await facilityService.getDropdownList({ tenantUuid: req.auth.tenantUuid });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const facility = await facilityService.getById(req.params.facilityId, { tenantUuid: req.auth.tenantUuid });
      return res.status(200).json(facility);
    } catch (error) {
      return next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      console.log("Request Body ==> ",req.body);
      const facility = await facilityService.create(req.body, {
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(201).json(facility);
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const facility = await facilityService.update(req.params.facilityId, req.body, {
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(200).json(facility);
    } catch (error) {
      return next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      const facility = await facilityService.updateStatus(req.params.facilityId, req.body.status, {
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(200).json(facility);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new FacilityController();
