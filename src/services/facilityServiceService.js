const { Op } = require("sequelize");
const { FacilityServices, Facilities, Departments, sequelize } = require("../models");
const { toSequelizePage, buildEnvelope } = require("../utils/pagination");
const CodeUtil = require("../utils/code.util");
const { STATUS, notFound, assertMutable } = require("../utils/lifecycle");
const { ConflictError } = require("../validations/facilityService.validation");

const SERVICE_ATTRIBUTES = [
  "facility_service_id",
  "facility_id",
  "department_id",
  "service_code",
  "service_name",
  "service_category",
  "status",
  "created_by",
  "created_on",
  "modified_by",
  "modified_on",
];

function toResponseShape(record) {
  if (!record) return null;
  const plain =
    typeof record.get === "function" ? record.get({ plain: true }) : record;
  return {
    facilityServiceId: plain.facility_service_id,
    facilityId: plain.facility_id,
    departmentId: plain.department_id,
    serviceCode: plain.service_code,
    serviceName: plain.service_name,
    serviceCategory: plain.service_category,
    status: plain.status,
    createdBy: plain.created_by,
    createdOn: plain.created_on,
    modifiedBy: plain.modified_by,
    modifiedOn: plain.modified_on,
  };
}

class FacilityServiceService {
  async getServiceList({ page, limit, status, facilityId, departmentId, serviceCategory, search } = {}) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });

    const where = {};
    if (status) where.status = status;
    if (facilityId) where.facility_id = facilityId;
    if (departmentId) where.department_id = departmentId;
    if (serviceCategory) where.service_category = serviceCategory;
    if (search) where.service_name = { [Op.like]: `%${search}%` };

    const result = await FacilityServices.findAndCountAll({
      where,
      attributes: SERVICE_ATTRIBUTES,
      order: [["created_on", "DESC"]],
      limit: safeLimit,
      offset,
    });

    return buildEnvelope(
      { rows: result.rows.map(toResponseShape), count: result.count },
      { page: safePage, limit: safeLimit },
    );
  }

  async getServices({ facilityId, departmentId } = {}) {
    const where = { status: STATUS.ACTIVE };
    if (facilityId) where.facility_id = facilityId;
    if (departmentId) where.department_id = departmentId;

    const services = await FacilityServices.findAll({
      where,
      attributes: SERVICE_ATTRIBUTES,
      order: [["service_name", "ASC"]],
    });

    return services.map(toResponseShape);
  }

  async getServiceById(facilityServiceId) {
    const service = await FacilityServices.findOne({
      where: { facility_service_id: facilityServiceId },
      attributes: SERVICE_ATTRIBUTES,
    });
    if (!service) throw notFound("Facility service");
    return toResponseShape(service);
  }

  async _findEntityOrThrow(facilityServiceId, transaction) {
    const service = await FacilityServices.findOne({
      where: { facility_service_id: facilityServiceId },
      transaction,
    });
    if (!service) throw notFound("Facility service");
    return service;
  }

  async _assertFacilityExists(facilityId, transaction) {
    if (!facilityId) return;
    const facility = await Facilities.findOne({ where: { facility_id: facilityId }, transaction });
    if (!facility) {
      throw new ConflictError(
        "facilityId does not reference an existing facility",
        [{ field: "facilityId", message: "not found" }],
      );
    }
  }

  async _assertDepartmentExists(departmentId, facilityId, transaction) {
    if (!departmentId) return;
    const department = await Departments.findOne({ where: { department_id: departmentId }, transaction });
    if (!department) {
      throw new ConflictError(
        "departmentId does not reference an existing department",
        [{ field: "departmentId", message: "not found" }],
      );
    }
    if (facilityId && department.facility_id !== facilityId) {
      throw new ConflictError(
        "departmentId does not belong to the given facilityId",
        [{ field: "departmentId", message: "must belong to facilityId" }],
      );
    }
  }

  async _assertNoDuplicate({ serviceName, facilityId, excludeId, transaction } = {}) {
    if (!serviceName) return;
    const where = { service_name: serviceName, facility_id: facilityId };
    if (excludeId) where.facility_service_id = { [Op.ne]: excludeId };

    const existing = await FacilityServices.findOne({
      where,
      attributes: ["facility_service_id", "service_code", "service_name"],
      transaction,
    });
    if (existing) {
      throw new ConflictError(
        "Service with this serviceName already exists at this facility",
        [{ field: "serviceName", message: "must be unique within the facility" }],
      );
    }
  }

  async createService(data, actorUserId) {
    await this._assertFacilityExists(data.facilityId);
    await this._assertDepartmentExists(data.departmentId, data.facilityId);
    await this._assertNoDuplicate({
      serviceName: data.serviceName,
      facilityId: data.facilityId,
    });

    const now = new Date();
    const created = await FacilityServices.create({
      facility_id: data.facilityId,
      department_id: data.departmentId ?? null,
      service_code: CodeUtil.generateCode("SV", data.serviceName),
      service_name: data.serviceName,
      service_category: data.serviceCategory ?? null,
      status: STATUS.ACTIVE,
      created_by: actorUserId,
      created_on: now,
      modified_by: actorUserId,
      modified_on: now,
    });

    return this.getServiceById(created.facility_service_id);
  }

  async updateService(facilityServiceId, data, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const service = await this._findEntityOrThrow(facilityServiceId, transaction);
      assertMutable(service, "Facility service");

      const effectiveFacilityId = data.facilityId ?? service.facility_id;
      if (data.facilityId !== undefined) {
        await this._assertFacilityExists(data.facilityId, transaction);
      }
      if (data.departmentId !== undefined) {
        await this._assertDepartmentExists(data.departmentId, effectiveFacilityId, transaction);
      }
      if (data.serviceName !== undefined) {
        await this._assertNoDuplicate({
          serviceName: data.serviceName,
          facilityId: effectiveFacilityId,
          excludeId: facilityServiceId,
          transaction,
        });
      }

      const values = { modified_by: actorUserId, modified_on: new Date() };
      if (data.facilityId !== undefined) values.facility_id = data.facilityId;
      if (data.departmentId !== undefined) values.department_id = data.departmentId;
      if (data.serviceName !== undefined) values.service_name = data.serviceName;
      if (data.serviceCategory !== undefined) values.service_category = data.serviceCategory;

      await service.update(values, { transaction });
      return service;
    }).then((service) => this.getServiceById(service.facility_service_id));
  }

  async deleteService(facilityServiceId, actorUserId) {
    const service = await this._findEntityOrThrow(facilityServiceId);
    assertMutable(service, "Facility service");

    await service.update({
      status: STATUS.DELETED,
      modified_by: actorUserId,
      modified_on: new Date(),
    });

    return this.getServiceById(facilityServiceId);
  }

  async updateStatus(facilityServiceId, status, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const service = await this._findEntityOrThrow(facilityServiceId, transaction);
      assertMutable(service, "Facility service");

      await service.update(
        { status, modified_by: actorUserId, modified_on: new Date() },
        { transaction },
      );
      return service;
    }).then((service) => this.getServiceById(service.facility_service_id));
  }
}

module.exports = new FacilityServiceService();
