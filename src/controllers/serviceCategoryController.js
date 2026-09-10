const serviceCategoryService = require('../services/serviceCategoryService');

class ServiceCategoryController {
  getList = async (req, res, next) => {
    try {
      const { page, limit, search, status,  organizationId } = req.query;
      const result = await serviceCategoryService.getList({
        page,
        limit,
        search,
        status,
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
      const result = await serviceCategoryService.getDropdownList({ tenantUuid: req.auth.tenantUuid });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const result = await serviceCategoryService.getById(req.params.serviceCategoryId, { tenantUuid: req.auth.tenantUuid });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const result = await serviceCategoryService.create(req.body, {
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
      const result = await serviceCategoryService.update(req.params.serviceCategoryId, req.body, {
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
      const result = await serviceCategoryService.updateStatus(req.params.serviceCategoryId, req.body.status, {
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new ServiceCategoryController();
