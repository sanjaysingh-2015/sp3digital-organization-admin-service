const departmentService = require('../services/departmentService');

class DepartmentController {
  getList = async (req, res, next) => {
    try {
      const { page, limit, search, status, facilityId } = req.query;
      const result = await departmentService.getList({
        page,
        limit,
        search,
        status,
        facilityId,
        tenantUuid: req.auth.tenantUuid,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  // For dropdowns. Supports ?facilityId= for facility-services' department picker.
  getDropdownList = async (req, res, next) => {
    try {
      const result = await departmentService.getDropdownList({
        tenantUuid: req.auth.tenantUuid,
        facilityId: req.query.facilityId,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const department = await departmentService.getById(req.params.departmentId, {
        tenantUuid: req.auth.tenantUuid,
      });
      return res.status(200).json(department);
    } catch (error) {
      return next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const department = await departmentService.create(req.body, {
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(201).json(department);
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const department = await departmentService.update(req.params.departmentId, req.body, {
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(200).json(department);
    } catch (error) {
      return next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      const department = await departmentService.updateStatus(req.params.departmentId, req.body.status, {
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(200).json(department);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new DepartmentController();
