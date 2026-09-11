const facilityServiceCatalogService = require('../services/facilityServiceCatalogService');

class FacilityServiceCatalogController {
  getList = async (req, res, next) => {
    try {
      const { page, limit, search, status, facilityId, serviceCategoryId } = req.query;
      const result = await facilityServiceCatalogService.getList({
        page,
        limit,
        search,
        status,
        facilityId,
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
      const row = await facilityServiceCatalogService.getById(req.params.facilityServiceId, {
        tenantUuid: req.auth.tenantUuid,
      });
      return res.status(200).json(row);
    } catch (error) {
      return next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const row = await facilityServiceCatalogService.create(req.body, {
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(201).json(row);
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const row = await facilityServiceCatalogService.update(req.params.facilityServiceId, req.body, {
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(200).json(row);
    } catch (error) {
      return next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      const row = await facilityServiceCatalogService.updateStatus(
        req.params.facilityServiceId,
        req.body.status,
        { tenantUuid: req.auth.tenantUuid, userId: req.auth.userId },
      );
      return res.status(200).json(row);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new FacilityServiceCatalogController();
