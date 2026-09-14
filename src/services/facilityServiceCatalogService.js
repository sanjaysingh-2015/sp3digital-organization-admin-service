// Business logic for the FacilityService entity (a facility's service
// catalog, routes: /facility-services). Not to be confused with
// facilityService.js, which handles the Facility entity itself.
const {
  Facility,
  Department,
  ServiceCategory,
  Service,
  FacilityService,
} = require("../models");
const { toSequelizePage, buildEnvelope } = require("../utils/pagination");
const { Op } = require("sequelize");
const UuidUtils = require("../utils/uuid.util");

// Every list/getById query joins these so the UI can show real names
// instead of raw ids (facilityId/departmentId/serviceCategoryId/serviceId).
// Sequelize's default association alias (no `as` given in models/index.js)
// is the model name itself — that's the key each is nested under below.
const NAME_INCLUDES = [
  { model: Facility, attributes: ["facilityId", "facilityName"] },
  { model: Department, attributes: ["departmentId", "departmentName"] },
  {
    model: ServiceCategory,
    attributes: ["serviceCategoryId", "serviceCategoryName"],
  },
  { model: Service, attributes: ["serviceId", "serviceName", "serviceCode"] },
];

function notFound(message = "Facility service not found") {
  const error = new Error(message);
  error.statusCode = 404;
  error.code = "FACILITY_SERVICE_NOT_FOUND";
  error.expose = true;
  return error;
}

async function assertFacilityExists(facilityId, tenantUuid) {
  const facility = await Facility.findOne({
    where: { facility_id: facilityId, tenant_uuid: tenantUuid },
  });
  if (!facility) {
    const error = new Error("Facility not found in this tenant");
    error.statusCode = 404;
    error.code = "FACILITY_NOT_FOUND";
    error.expose = true;
    throw error;
  }
}

/** A department, if given, must belong to the same facility as the service. */
async function assertDepartmentBelongsToFacility(
  departmentId,
  facilityId,
  tenantUuid,
) {
  if (departmentId === undefined || departmentId === null) return;
  const department = await Department.findOne({
    where: {
      department_id: departmentId,
      facility_id: facilityId,
      tenant_uuid: tenantUuid,
    },
  });
  if (!department) {
    const error = new Error("Department not found in this facility");
    error.statusCode = 404;
    error.code = "DEPARTMENT_NOT_FOUND";
    error.expose = true;
    throw error;
  }
}

function toResponse(facilityServiceRow) {
  if (!facilityServiceRow) return null;
  const plain = facilityServiceRow.get
    ? facilityServiceRow.get({ plain: true })
    : facilityServiceRow;
  return {
    facilityServiceId: plain.facilityServiceId,
    facilityServiceUuid: plain.facilityServiceUuid,
    tenantUuid: plain.tenantUuid,
    facilityId: plain.facilityId,
    facilityName: plain.Facility ? plain.Facility.facilityName : null,
    departmentId: plain.departmentId,
    departmentName: plain.Department ? plain.Department.departmentName : null,
    serviceId: plain.serviceId,
    serviceName: plain.Service ? plain.Service.serviceName : null,
    serviceCode: plain.Service ? plain.Service.serviceCode : null,
    serviceCategoryId: plain.serviceCategoryId,
    serviceCategoryName: plain.ServiceCategory
      ? plain.ServiceCategory.serviceCategoryName
      : null,
    status: plain.status,
    createdOn: plain.createdOn,
    modifiedOn: plain.modifiedOn,
  };
}

class FacilityServiceCatalogService {
  async getDropdownList({ tenantUuid, facilityId }) {
    const where = { tenant_uuid: tenantUuid, status: "ACTIVE" };
    if (facilityId) where.facility_id = facilityId;

    const rows = await FacilityService.findAll({
      where,
      order: [["facilityServiceId", "ASC"]],
    });
    return { success: true, count: rows.length, data: rows.map(toResponse) };
  }

  async getList({
    page,
    limit,
    search,
    status,
    facilityId,
    serviceCategoryId,
    serviceId,
    tenantUuid,
  }) {
    const {
      limit: safeLimit,
      offset,
      page: safePage,
    } = toSequelizePage({ page, limit });

    const where = { tenant_uuid: tenantUuid };
    if (status) where.status = status;
    if (facilityId) where.facility_id = facilityId;
    if (serviceCategoryId) where.service_category_id = serviceCategoryId;
    if (serviceId) where.service_id = serviceId;
    // service_name isn't a column on facility_services itself (it now lives
    // on the joined Service row) — reference it through the include below
    // with Sequelize's `$Association.column$` dot syntax instead of a bare
    // column name, which would otherwise throw a "no such column" SQL error.
    if (search) where["$Service.service_name$"] = { [Op.like]: `%${search}%` };

    const result = await FacilityService.findAndCountAll({
      where,
      include: NAME_INCLUDES,
      limit: safeLimit,
      offset,
      order: [["createdOn", "DESC"]],
    });

    return buildEnvelope(
      { rows: result.rows.map(toResponse), count: result.count },
      { page: safePage, limit: safeLimit },
    );
  }

  async getById(facilityServiceId, { tenantUuid }) {
    const row = await FacilityService.findOne({
      where: {
        facility_service_id: facilityServiceId,
        tenant_uuid: tenantUuid,
      },
      include: NAME_INCLUDES,
    });
    if (!row) throw notFound();
    return toResponse(row);
  }

  async create(payload, { tenantUuid, userId }) {
    await assertFacilityExists(payload.facilityId, tenantUuid);
    await assertDepartmentBelongsToFacility(
      payload.departmentId,
      payload.facilityId,
      tenantUuid,
    );

    const row = await FacilityService.create({
      tenantUuid,
      facilityServiceUuid: UuidUtils.generate(),
      facilityId: payload.facilityId,
      departmentId: payload.departmentId || null,
      serviceId: payload.serviceId,
      serviceCategoryId: payload.serviceCategoryId,
      status: "ACTIVE",
      createdBy: userId || null,
      modifiedBy: userId || null,
    });

    // Re-fetch with the name includes so the create response matches the
    // shape of getList/getById instead of coming back with null names.
    return this.getById(row.facilityServiceId, { tenantUuid });
  }

  async update(facilityServiceId, patch, { tenantUuid, userId }) {
    const row = await FacilityService.findOne({
      where: {
        facility_service_id: facilityServiceId,
        tenant_uuid: tenantUuid,
      },
    });
    if (!row) throw notFound();

    const effectiveFacilityId =
      patch.facilityId !== undefined ? patch.facilityId : row.facilityId;
    if (patch.facilityId !== undefined) {
      await assertFacilityExists(patch.facilityId, tenantUuid);
    }
    if (patch.departmentId !== undefined) {
      await assertDepartmentBelongsToFacility(
        patch.departmentId,
        effectiveFacilityId,
        tenantUuid,
      );
    }

    await row.update({
      ...patch,
      modifiedBy: userId || null,
      modifiedOn: new Date(),
    });
    // Re-fetch with the name includes rather than reusing the pre-update
    // `row` (which was loaded without them) — same reasoning as create().
    return this.getById(facilityServiceId, { tenantUuid });
  }

  async updateStatus(facilityServiceId, status, { tenantUuid, userId }) {
    const row = await FacilityService.findOne({
      where: {
        facility_service_id: facilityServiceId,
        tenant_uuid: tenantUuid,
      },
    });
    if (!row) throw notFound();

    await row.update({
      status,
      modifiedBy: userId || null,
      modifiedOn: new Date(),
    });
    return this.getById(facilityServiceId, { tenantUuid });
  }
}

module.exports = new FacilityServiceCatalogService();
