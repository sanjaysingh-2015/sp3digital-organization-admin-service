const departmentService = require("../services/departmentService");

const {
  validateCreatePayload,
  validateUpdatePayload,
  validateStatusPayload,
} = require("../validations/department.validation");

class DepartmentController {
  getDepartmentList = async (req, res, next) => {
    try {
      const { page, limit, status, facilityId, search } = req.query;
      const departments = await departmentService.getDepartmentList({
        page,
        limit,
        status,
        facilityId,
        search,
      });
      return res.status(200).json(departments);
    } catch (error) {
      return next(error);
    }
  };

  getDepartments = async (req, res) => {
    try {
      const { facilityId } = req.query;
      const departments = await departmentService.getDepartments({ facilityId });
      return res.status(200).json({
        success: true,
        count: departments.length,
        data: departments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Error fetching departments",
      });
    }
  };

  getDepartmentById = async (req, res, next) => {
    try {
      const department = await departmentService.getDepartmentById(req.params.departmentId);
      return res.status(200).json(department);
    } catch (error) {
      return next(error);
    }
  };

  createDepartment = async (req, res, next) => {
    try {
      validateCreatePayload(req.body);
      const department = await departmentService.createDepartment(req.body, req.auth.userId);
      return res.status(201).json(department);
    } catch (error) {
      return next(error);
    }
  };

  updateDepartment = async (req, res, next) => {
    try {
      validateUpdatePayload(req.body);
      const department = await departmentService.updateDepartment(
        req.params.departmentId,
        req.body,
        req.auth.userId,
      );
      return res.status(200).json(department);
    } catch (error) {
      return next(error);
    }
  };

  deleteDepartment = async (req, res, next) => {
    try {
      const department = await departmentService.deleteDepartment(
        req.params.departmentId,
        req.auth.userId,
      );
      return res.status(200).json(department);
    } catch (error) {
      return next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      validateStatusPayload(req.body);
      const department = await departmentService.updateStatus(
        req.params.departmentId,
        req.body.status,
        req.auth.userId,
      );
      return res.status(200).json(department);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new DepartmentController();
