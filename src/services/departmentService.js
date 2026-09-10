const { Facility, Department } = require('../models');
const { toSequelizePage, buildEnvelope } = require('../utils/pagination');
const { Op } = require('sequelize');

function notFound(message = 'Department not found') {
  const error = new Error(message);
  error.statusCode = 404;
  error.code = 'DEPARTMENT_NOT_FOUND';
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

function toResponse(department) {
  if (!department) return null;
  const plain = department.get ? department.get({ plain: true }) : department;
  return {
    departmentId: plain.departmentId,
    departmentUuid: plain.departmentUuid,
    tenantUuid: plain.tenantUuid,
    facilityId: plain.facilityId,
    departmentName: plain.departmentName,
    departmentType: plain.departmentType,
    status: plain.status,
    createdOn: plain.createdOn,
    modifiedOn: plain.modifiedOn,
  };
}

class DepartmentService {
  async getList({ page, limit, search, status, facilityId, tenantUuid }) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });

    const where = { tenant_uuid: tenantUuid };
    if (status) where.status = status;
    if (facilityId) where.facility_id = facilityId;
    if (search) where.department_name = { [Op.like]: `%${search}%` };

    const result = await Department.findAndCountAll({
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

  /**
   * Unpaginated, ACTIVE-only, optionally scoped to one facility. The
   * facilityId filter is what feeds the department picker inside the
   * facility-services create/edit form (departments.component.ts also
   * calls this without a filter for its own facility picker's sibling use).
   */
  async getDropdownList({ tenantUuid, facilityId }) {
    const where = { tenant_uuid: tenantUuid, status: 'ACTIVE' };
    if (facilityId) where.facility_id = facilityId;

    const rows = await Department.findAll({ where, order: [['departmentName', 'ASC']] });
    return { success: true, count: rows.length, data: rows.map(toResponse) };
  }

  async getById(departmentId, { tenantUuid }) {
    const department = await Department.findOne({
      where: { department_id: departmentId, tenant_uuid: tenantUuid },
    });
    if (!department) throw notFound();
    return toResponse(department);
  }

  async create(payload, { tenantUuid, userId }) {
    await assertFacilityExists(payload.facilityId, tenantUuid);

    const department = await Department.create({
      tenantUuid,
      facilityId: payload.facilityId,
      departmentName: payload.departmentName,
      departmentType: payload.departmentType || null,
      status: 'ACTIVE',
      createdBy: userId || null,
      modifiedBy: userId || null,
    });

    return toResponse(department);
  }

  async update(departmentId, patch, { tenantUuid, userId }) {
    const department = await Department.findOne({
      where: { department_id: departmentId, tenant_uuid: tenantUuid },
    });
    if (!department) throw notFound();

    if (patch.facilityId !== undefined) {
      await assertFacilityExists(patch.facilityId, tenantUuid);
    }

    await department.update({ ...patch, modifiedBy: userId || null, modifiedOn: new Date() });
    return toResponse(department);
  }

  async updateStatus(departmentId, status, { tenantUuid, userId }) {
    const department = await Department.findOne({
      where: { department_id: departmentId, tenant_uuid: tenantUuid },
    });
    if (!department) throw notFound();

    await department.update({ status, modifiedBy: userId || null, modifiedOn: new Date() });
    return toResponse(department);
  }
}

module.exports = new DepartmentService();
