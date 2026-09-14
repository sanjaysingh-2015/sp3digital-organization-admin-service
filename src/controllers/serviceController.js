const serviceService = require('../services/serviceService');

class ServiceController {
  getList = async (req, res, next) => {
    try {
      const { page, limit, search, status,  organizationId, serviceCategoryId } = req.query;
      const result = await serviceService.getList({
        page,
        limit,
        search,
        status,
        organizationId,
        serviceCategoryId,
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
      const { organizationId, serviceCategoryId } = req.query;
      const result = await serviceService.getDropdownList({
        organizationId,
        serviceCategoryId,
        tenantUuid: req.auth.tenantUuid,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const result = await serviceService.getById(req.params.serviceId, { tenantUuid: req.auth.tenantUuid });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const result = await serviceService.create(req.body, {
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const result = await serviceService.update(req.params.serviceId, req.body, {
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      const result = await serviceService.updateStatus(req.params.serviceId, req.body.status, {
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new ServiceController();
