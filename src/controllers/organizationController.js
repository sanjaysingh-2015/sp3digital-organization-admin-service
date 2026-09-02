const organizationService = require("../services/organizationService");

const {
  validateCreatePayload,
  validateUpdatePayload,
  validateStatusPayload,
} = require("../validations/organization.validation");

class OrganizationController {
  getOrganizationList = async (req, res, next) => {
    try {
      const { page, limit, status, organizationType, search } = req.query;
      const organizations = await organizationService.getOrganizationList({
        page,
        limit,
        status,
        organizationType,
        search,
        tenantUuid: req.auth.tenantUuid,
      });
      return res.status(200).json(organizations);
    } catch (error) {
      return next(error);
    }
  };

  // For dropdowns
  getOrganizations = async (req, res) => {
    try {
      const organizations = await organizationService.getOrganizations({
        tenantUuid: req.auth.tenantUuid,
      });
      return res.status(200).json({
        success: true,
        count: organizations.length,
        data: organizations,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Error fetching organizations",
      });
    }
  };

  getOrganizationById = async (req, res, next) => {
    try {
      const organization = await organizationService.getOrganizationById(
        req.params.organizationId,
      );
      return res.status(200).json(organization);
    } catch (error) {
      return next(error);
    }
  };

  createOrganization = async (req, res, next) => {
    try {
      console.log("Request Body ==> ", req.body);
      const { organizationName, organizationType, tenantUuid, userId} = req.body;
      validateCreatePayload(req.body);
      const organization = await organizationService.createOrganization(
        req.body,
        req.auth?.userId || userId,
        req.auth?.tenantUuid || tenantUuid,
      );
      return res.status(201).json(organization);
    } catch (error) {
      return next(error);
    }
  };

  updateOrganization = async (req, res, next) => {
    try {
      validateUpdatePayload(req.body);
      const organization = await organizationService.updateOrganization(
        req.params.organizationId,
        req.body,
        req.auth.userId,
      );
      return res.status(200).json(organization);
    } catch (error) {
      return next(error);
    }
  };

  deleteOrganization = async (req, res, next) => {
    try {
      const organization = await organizationService.deleteOrganization(
        req.params.organizationId,
        req.auth.userId,
      );
      return res.status(200).json(organization);
    } catch (error) {
      return next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      validateStatusPayload(req.body);
      const organization = await organizationService.updateStatus(
        req.params.organizationId,
        req.body.status,
        req.auth.userId,
      );
      return res.status(200).json(organization);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new OrganizationController();
