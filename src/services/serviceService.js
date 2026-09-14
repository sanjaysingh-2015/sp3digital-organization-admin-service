// Business logic for the Service entity (routes: /service-categories).
// Not to be confused with facilityServiceCatalogService.js, which handles
// the separate "FacilityService" entity behind /facility-services.
//
// NOTE: the Sequelize model is imported as `ServiceModel` rather
// than `Service` — the class below is itself named `Service`
// and would otherwise shadow the model inside every method, which is
// exactly the bug this fixes (every call below used to resolve
// `Service.findAndCountAll`/`findOne`/`create` against the class,
// not the model, so every route on this resource threw at runtime).
const { Organization, ServiceCategory, Service: ServiceModel } = require("../models");
const { toSequelizePage, buildEnvelope } = require("../utils/pagination");
const UuidUtil = require("../utils/uuid.util");
const CodeUtil = require("../utils/code.util");
const { Op } = require("sequelize");

function notFound(message = "Service not found") {
  const error = new Error(message);
  error.statusCode = 404;
  error.code = "SERVICE_NOT_FOUND";
  error.expose = true;
  return error;
}

async function assertOrganizationExists(organizationId, tenantUuid) {
  const organization = await Organization.findOne({
    where: { organization_id: organizationId, tenant_uuid: tenantUuid },
  });
  if (!organization) {
    const error = new Error("Organization not found in this tenant");
    error.statusCode = 404;
    error.code = "ORGANIZATION_NOT_FOUND";
    error.expose = true;
    throw error;
  }
}

/** A service category, if given, must belong to the same organization as the service. */
async function assertServiceCategoryBelongsToOrganization(serviceCategoryId, organizationId, tenantUuid) {
  const serviceCategory = await ServiceCategory.findOne({
    where: { service_category_id: serviceCategoryId, organization_id: organizationId, tenant_uuid: tenantUuid },
  });
  if (!serviceCategory) {
    const error = new Error("Service category not found in this organization");
    error.statusCode = 404;
    error.code = "SERVICE_CATEGORY_NOT_FOUND";
    error.expose = true;
    throw error;
  }
}

function toResponse(service) {
  if (!service) return null;
  const plain = service.get
    ? service.get({ plain: true })
    : service;
  return {
    serviceId: plain.serviceId,
    serviceUuid: plain.serviceUuid,
    tenantUuid: plain.tenantUuid,
    organizationId: plain.organizationId,
    serviceCategoryId: plain.serviceCategoryId,
    serviceCode: plain.serviceCode,
    serviceName: plain.serviceName,
    description: plain.description,
    status: plain.status,
    createdOn: plain.createdOn,
    modifiedOn: plain.modifiedOn,
  };
}

class Service {
  async getList({ page, limit, search, status, organizationId, serviceCategoryId, tenantUuid }) {
    const {
      limit: safeLimit,
      offset,
      page: safePage,
    } = toSequelizePage({ page, limit });

    const where = { tenant_uuid: tenantUuid };
    if (status) where.status = status;
    if (organizationId) where.organization_id = organizationId;
    if (serviceCategoryId) where.service_category_id = serviceCategoryId;
    // `city` isn't a Service column — that was copy-pasted from a
    // facility-style search and threw a SQL error on every search.
    if (search) where.service_name = { [Op.like]: `%${search}%` };

    const result = await ServiceModel.findAndCountAll({
      where,
      limit: safeLimit,
      offset,
      order: [["createdOn", "DESC"]],
    });

    return buildEnvelope(
      { rows: result.rows.map(toResponse), count: result.count },
      { page: safePage, limit: safeLimit },
    );
  }

  async getDropdownList({ tenantUuid, organizationId, serviceCategoryId }) {
    const where = { tenant_uuid: tenantUuid, status: "ACTIVE" };
    if (organizationId) where.organization_id = organizationId;
    if (serviceCategoryId) where.service_category_id = serviceCategoryId;

    const rows = await ServiceModel.findAll({
      where,
      order: [["serviceName", "ASC"]],
    });
    return { success: true, count: rows.length, data: rows.map(toResponse) };
  }

  async getById(serviceId, { tenantUuid }) {
    const service = await ServiceModel.findOne({
      where: {
        service_id: serviceId,
        tenant_uuid: tenantUuid,
      },
    });
    if (!service) throw notFound();
    return toResponse(service);
  }

  async create(payload, { tenantUuid, userId }) {
    await assertOrganizationExists(payload.organizationId, tenantUuid);
    await assertServiceCategoryBelongsToOrganization(payload.serviceCategoryId, payload.organizationId, tenantUuid);

    const service = await ServiceModel.create({
      tenantUuid,
      organizationId: payload.organizationId,
      serviceCategoryId: payload.serviceCategoryId,
      // Auto-generated, same pattern as Organization.generateCode — the
      // column is NOT NULL and nothing in the create request supplies it.
      serviceUuid: UuidUtil.generate(),
      serviceCode: CodeUtil.generateCode("SVR",payload.serviceName),
      serviceName: payload.serviceName,
      description: payload.description,
      status: "ACTIVE",
      createdBy: userId || null,
      modifiedBy: userId || null,
    });

    return toResponse(service);
  }

  async update(serviceId, patch, { tenantUuid, userId }) {
    const service = await ServiceModel.findOne({
      where: { service_id: serviceId, tenant_uuid: tenantUuid },
    });
    if (!service) throw notFound();

    const effectiveOrganizationId = patch.organizationId !== undefined ? patch.organizationId : service.organizationId;
    if (patch.organizationId !== undefined) {
      await assertOrganizationExists(patch.organizationId, tenantUuid);
    }
    if (patch.serviceCategoryId !== undefined) {
      await assertServiceCategoryBelongsToOrganization(patch.serviceCategoryId, effectiveOrganizationId, tenantUuid);
    }

    await service.update({
      ...patch,
      modifiedBy: userId || null,
      modifiedOn: new Date(),
    });
    return toResponse(service);
  }

  async updateStatus(serviceId, status, { tenantUuid, userId }) {
    const service = await ServiceModel.findOne({
      where: { service_id: serviceId, tenant_uuid: tenantUuid },
    });
    if (!service) throw notFound();

    await service.update({
      status,
      modifiedBy: userId || null,
      modifiedOn: new Date(),
    });
    return toResponse(service);
  }
}

module.exports = new Service();
