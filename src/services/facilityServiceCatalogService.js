// Business logic for the FacilityService entity (a facility's service
// catalog, routes: /facility-services). Not to be confused with
// facilityService.js, which handles the Facility entity itself.
const { Facility, Department, FacilityService } = require('../models');
const { toSequelizePage, buildEnvelope } = require('../utils/pagination');
const { Op } = require('sequelize');

function notFound(message = 'Facility service not found') {
  const error = new Error(message);
  error.statusCode = 404;
  error.code = 'FACILITY_SERVICE_NOT_FOUND';
  error.expose = true;
  return error;
}

async function assertFacilityExists(facilityId, tenantUuid) {
  const facility = await Facility.findOne({ where: { facility_id: facilityId, tenant_uuid: tenantUuid } });
  if (!facility) {
    const error = new Error('Facility not found in this tenant');
    error.statusCode = 404;
    error.code = 'FACILITY_NOT_FOUND';
    error.expose = true;
    throw error;
  }
}

/** A department, if given, must belong to the same facility as the service. */
async function assertDepartmentBelongsToFacility(departmentId, facilityId, tenantUuid) {
  if (departmentId === undefined || departmentId === null) return;
  const department = await Department.findOne({
    where: { department_id: departmentId, facility_id: facilityId, tenant_uuid: tenantUuid },
  });
  if (!department) {
    const error = new Error('Department not found in this facility');
    error.statusCode = 404;
    error.code = 'DEPARTMENT_NOT_FOUND';
    error.expose = true;
    throw error;
  }
}

function toResponse(facilityServiceRow) {
  if (!facilityServiceRow) return null;
  const plain = facilityServiceRow.get ? facilityServiceRow.get({ plain: true }) : facilityServiceRow;
  return {
    facilityServiceId: plain.facilityServiceId,
    facilityServiceUuid: plain.facilityServiceUuid,
    tenantUuid: plain.tenantUuid,
    facilityId: plain.facilityId,
    departmentId: plain.departmentId,
    serviceName: plain.serviceName,
    serviceCategory: plain.serviceCategory,
    status: plain.status,
    createdOn: plain.createdOn,
    modifiedOn: plain.modifiedOn,
  };
}

class FacilityServiceCatalogService {
  async getList({ page, limit, search, status, facilityId, serviceCategory, tenantUuid }) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });

    const where = { tenant_uuid: tenantUuid };
    if (status) where.status = status;
    if (facilityId) where.facility_id = facilityId;
    if (serviceCategory) where.service_category = serviceCategory;
    if (search) where.service_name = { [Op.like]: `%${search}%` };

    const result = await FacilityService.findAndCountAll({
      where,
      limit: safeLimit,
      offset,
      order: [['createdOn', 'DESC']],
    });

    return buildEnvelope(
      { rows: result.rows.map(toResponse), count: result.count },
      { page: safePage, limit: safeLimit },
    );
  }

  async getById(facilityServiceId, { tenantUuid }) {
    const row = await FacilityService.findOne({
      where: { facility_service_id: facilityServiceId, tenant_uuid: tenantUuid },
    });
    if (!row) throw notFound();
    return toResponse(row);
  }

  async create(payload, { tenantUuid, userId }) {
    await assertFacilityExists(payload.facilityId, tenantUuid);
    await assertDepartmentBelongsToFacility(payload.departmentId, payload.facilityId, tenantUuid);

    const row = await FacilityService.create({
      tenantUuid,
      facilityId: payload.facilityId,
      departmentId: payload.departmentId || null,
      serviceName: payload.serviceName,
      serviceCategory: payload.serviceCategory || null,
      status: 'ACTIVE',
      createdBy: userId || null,
      modifiedBy: userId || null,
    });

    return toResponse(row);
  }

  async update(facilityServiceId, patch, { tenantUuid, userId }) {
    const row = await FacilityService.findOne({
      where: { facility_service_id: facilityServiceId, tenant_uuid: tenantUuid },
    });
    if (!row) throw notFound();

    const effectiveFacilityId = patch.facilityId !== undefined ? patch.facilityId : row.facilityId;
    if (patch.facilityId !== undefined) {
      await assertFacilityExists(patch.facilityId, tenantUuid);
    }
    if (patch.departmentId !== undefined) {
      await assertDepartmentBelongsToFacility(patch.departmentId, effectiveFacilityId, tenantUuid);
    }

    await row.update({ ...patch, modifiedBy: userId || null, modifiedOn: new Date() });
    return toResponse(row);
  }

  async updateStatus(facilityServiceId, status, { tenantUuid, userId }) {
    const row = await FacilityService.findOne({
      where: { facility_service_id: facilityServiceId, tenant_uuid: tenantUuid },
    });
    if (!row) throw notFound();

    await row.update({ status, modifiedBy: userId || null, modifiedOn: new Date() });
    return toResponse(row);
  }
}

module.exports = new FacilityServiceCatalogService();
