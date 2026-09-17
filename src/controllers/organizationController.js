const organizationService = require('../services/organizationService');

class OrganizationController {
  getList = async (req, res, next) => {
    try {
      const { page, limit, search, status, organizationType } = req.query;
      const result = await organizationService.getList({
        page,
        limit,
        search,
        status,
        organizationType,
        tenantUuid: req.auth.tenantUuid,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  // For dropdowns (parent-org picker, facilities' org picker).
  getDropdownList = async (req, res, next) => {
    try {
      const result = await organizationService.getDropdownList({ tenantUuid: req.auth.tenantUuid });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const organization = await organizationService.getById(req.params.organizationId, {
        tenantUuid: req.auth.tenantUuid,
      });
      return res.status(200).json(organization);
    } catch (error) {
      return next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const organization = await organizationService.create({
        ...req.body,
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(201).json(organization);
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /internal/organizations — identity-admin-service's
   * registrationService.js only. tenantUuid and userId both come from the
   * body here (this route requires authenticate + requireInternalService,
   * which sets req.auth.tenantUuid from the X-Tenant-Uuid header, but the
   * caller also sends it in the body — accept either, prefer the header).
   */
  internalCreate = async (req, res, next) => {
    try {
      console.log("Request ==> ", req.body);
      const organization = await organizationService.create({
        organizationName: req.body.organizationName,
        organizationType: req.body.organizationType,
        parentOrganizationId: req.body.parentOrganizationId,
        addressLine1: req.body.addressLine1,
        addressLine2: req.body.addressLine2,
        cityId: req.body.cityId,
        subDistrictId: req.body.subDistrictId,
        districtId: req.body.districtId,
        stateId: req.body.stateId,
        postalCodeId: req.body.postalCodeId,
        countryId: req.body.countryId,
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        tenantUuid: req.auth.tenantUuid || req.body.tenantUuid,
        userId: req.body.userId,
      });
      return res.status(201).json(organization);
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const organization = await organizationService.update(req.params.organizationId, req.body, {
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(200).json(organization);
    } catch (error) {
      return next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      const organization = await organizationService.updateStatus(req.params.organizationId, req.body.status, {
        tenantUuid: req.auth.tenantUuid,
        userId: req.auth.userId,
      });
      return res.status(200).json(organization);
    } catch (error) {
      return next(error);
    }
  };

  /** Hard delete — see organizationService.hardDelete for who's allowed to call this and why. */
  hardDelete = async (req, res, next) => {
    try {
      const result = await organizationService.hardDelete(req.params.organizationId, {
        tenantUuid: req.auth.tenantUuid,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new OrganizationController();
