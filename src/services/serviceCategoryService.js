// Business logic for the ServiceCategory entity (routes: /service-categories).
// Not to be confused with facilityServiceCatalogService.js, which handles
// the separate "FacilityService" entity behind /facility-services.
//
// NOTE: the Sequelize model is imported as `ServiceCategoryModel` rather
// than `ServiceCategory` — the class below is itself named `ServiceCategory`
// and would otherwise shadow the model inside every method, which is
// exactly the bug this fixes (every call below used to resolve
// `ServiceCategory.findAndCountAll`/`findOne`/`create` against the class,
// not the model, so every route on this resource threw at runtime).
const { Organization, ServiceCategory: ServiceCategoryModel } = require("../models");
const { toSequelizePage, buildEnvelope } = require("../utils/pagination");
const { Op } = require("sequelize");

function notFound(message = "Service category not found") {
  const error = new Error(message);
  error.statusCode = 404;
  error.code = "SERVICE_CATEGORY_NOT_FOUND";
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

function toResponse(serviceCategory) {
  if (!serviceCategory) return null;
  const plain = serviceCategory.get
    ? serviceCategory.get({ plain: true })
    : serviceCategory;
  return {
    serviceCategoryId: plain.serviceCategoryId,
    serviceCategoryUuid: plain.serviceCategoryUuid,
    tenantUuid: plain.tenantUuid,
    organizationId: plain.organizationId,
    serviceCategoryCode: plain.serviceCategoryCode,
    serviceCategoryName: plain.serviceCategoryName,
    description: plain.description,
    status: plain.status,
    createdOn: plain.createdOn,
    modifiedOn: plain.modifiedOn,
  };
}

class ServiceCategory {
  async getList({ page, limit, search, status, organizationId, tenantUuid }) {
    const {
      limit: safeLimit,
      offset,
      page: safePage,
    } = toSequelizePage({ page, limit });

    const where = { tenant_uuid: tenantUuid };
    if (status) where.status = status;
    if (organizationId) where.organization_id = organizationId;
    if (search) {
      where[Op.or] = [
        { service_category_name: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } },
      ];
    }

    const result = await ServiceCategoryModel.findAndCountAll({
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

  async getDropdownList({ tenantUuid }) {
    const rows = await ServiceCategoryModel.findAll({
      where: { tenant_uuid: tenantUuid, status: "ACTIVE" },
      order: [["serviceCategoryName", "ASC"]],
    });
    return { success: true, count: rows.length, data: rows.map(toResponse) };
  }

  async getById(serviceCategoryId, { tenantUuid }) {
    const serviceCategory = await ServiceCategoryModel.findOne({
      where: {
        service_category_id: serviceCategoryId,
        tenant_uuid: tenantUuid,
      },
    });
    if (!serviceCategory) throw notFound();
    return toResponse(serviceCategory);
  }

  async create(payload, { tenantUuid, userId }) {
    await assertOrganizationExists(payload.organizationId, tenantUuid);

    const serviceCategory = await ServiceCategoryModel.create({
      tenantUuid,
      organizationId: payload.organizationId,
      // Auto-generated, same pattern as Organization.generateCode — the
      // column is NOT NULL and nothing in the create request supplies it.
      serviceCategoryCode: ServiceCategoryModel.generateCode(payload.serviceCategoryName),
      serviceCategoryName: payload.serviceCategoryName,
      description: payload.description,
      status: "ACTIVE",
      createdBy: userId || null,
      modifiedBy: userId || null,
    });

    return toResponse(serviceCategory);
  }

  async update(serviceCategoryId, patch, { tenantUuid, userId }) {
    const serviceCategory = await ServiceCategoryModel.findOne({
      where: { service_category_id: serviceCategoryId, tenant_uuid: tenantUuid },
    });
    if (!serviceCategory) throw notFound();

    if (patch.organizationId !== undefined) {
      await assertOrganizationExists(patch.organizationId, tenantUuid);
    }

    await serviceCategory.update({
      ...patch,
      modifiedBy: userId || null,
      modifiedOn: new Date(),
    });
    return toResponse(serviceCategory);
  }

  async updateStatus(serviceCategoryId, status, { tenantUuid, userId }) {
    const serviceCategory = await ServiceCategoryModel.findOne({
      where: { service_category_id: serviceCategoryId, tenant_uuid: tenantUuid },
    });
    if (!serviceCategory) throw notFound();

    await serviceCategory.update({
      status,
      modifiedBy: userId || null,
      modifiedOn: new Date(),
    });
    return toResponse(serviceCategory);
  }
}

module.exports = new ServiceCategory();
