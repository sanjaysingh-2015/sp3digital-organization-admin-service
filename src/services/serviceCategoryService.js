// Business logic for the Facility entity (routes: /facilities). Not to be
// confused with facilityServiceCatalogService.js, which handles the
// separate "FacilityService" entity behind /facility-services.
const { Organization, Facility } = require("../models");
const { toSequelizePage, buildEnvelope } = require("../utils/pagination");
const { Op } = require("sequelize");

function notFound(message = "Facility not found") {
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

    const result = await ServiceCategory.findAndCountAll({
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
    const rows = await ServiceCategory.findAll({
      where: { tenant_uuid: tenantUuid, status: "ACTIVE" },
      order: [["facilityName", "ASC"]],
    });
    return { success: true, count: rows.length, data: rows.map(toResponse) };
  }

  async getById(serviceCategoryId, { tenantUuid }) {
    const serviceCategory = await ServiceCategory.findOne({
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

    const serviceCategory = await ServiceCategory.create({
      tenantUuid,
      serviceCategoryId: payload.serviceCategoryId,
      serviceCategoryUuid: payload.serviceCategoryUuid,
      organizationId: payload.organizationId,
      serviceCategoryCode: payload.serviceCategoryCode,
      serviceCategoryName: payload.serviceCategoryName,
      description: payload.description,
      status: payload.status,
      status: "ACTIVE",
      createdBy: userId || null,
      modifiedBy: userId || null,
    });

    return toResponse(serviceCategory);
  }

  async update(serviceCategoryId, patch, { tenantUuid, userId }) {
    const serviceCategory = await ServiceCategory.findOne({
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
    const serviceCategory = await ServiceCategory.findOne({
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
