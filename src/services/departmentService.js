const { Op } = require("sequelize");
const { Departments, Facilities, sequelize } = require("../models");
const { toSequelizePage, buildEnvelope } = require("../utils/pagination");
const UuidUtil = require("../utils/uuid.util");
const CodeUtil = require("../utils/code.util");
const { STATUS, notFound, assertMutable } = require("../utils/lifecycle");
const { ConflictError } = require("../validations/department.validation");

const DEPARTMENT_ATTRIBUTES = [
  "department_id",
  "department_uuid",
  "facility_id",
  "department_code",
  "department_name",
  "department_type",
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
    departmentId: plain.department_id,
    departmentUuid: plain.department_uuid,
    facilityId: plain.facility_id,
    departmentCode: plain.department_code,
    departmentName: plain.department_name,
    departmentType: plain.department_type,
    status: plain.status,
    createdBy: plain.created_by,
    createdOn: plain.created_on,
    modifiedBy: plain.modified_by,
    modifiedOn: plain.modified_on,
  };
}

class DepartmentService {
  async getDepartmentList({ page, limit, status, facilityId, search } = {}) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });

    const where = {};
    if (status) where.status = status;
    if (facilityId) where.facility_id = facilityId;
    if (search) where.department_name = { [Op.like]: `%${search}%` };

    const result = await Departments.findAndCountAll({
      where,
      attributes: DEPARTMENT_ATTRIBUTES,
      order: [["created_on", "DESC"]],
      limit: safeLimit,
      offset,
    });

    return buildEnvelope(
      { rows: result.rows.map(toResponseShape), count: result.count },
      { page: safePage, limit: safeLimit },
    );
  }

  async getDepartments({ facilityId } = {}) {
    const where = { status: STATUS.ACTIVE };
    if (facilityId) where.facility_id = facilityId;

    const departments = await Departments.findAll({
      where,
      attributes: DEPARTMENT_ATTRIBUTES,
      order: [["department_name", "ASC"]],
    });

    return departments.map(toResponseShape);
  }

  async getDepartmentById(departmentId) {
    const department = await Departments.findOne({
      where: { department_id: departmentId },
      attributes: DEPARTMENT_ATTRIBUTES,
    });
    if (!department) throw notFound("Department");
    return toResponseShape(department);
  }

  async _findEntityOrThrow(departmentId, transaction) {
    const department = await Departments.findOne({
      where: { department_id: departmentId },
      transaction,
    });
    if (!department) throw notFound("Department");
    return department;
  }

  async _assertFacilityExists(facilityId, transaction) {
    if (!facilityId) return;
    const facility = await Facilities.findOne({
      where: { facility_id: facilityId },
      transaction,
    });
    if (!facility) {
      throw new ConflictError(
        "facilityId does not reference an existing facility",
        [{ field: "facilityId", message: "not found" }],
      );
    }
  }

  async _assertNoDuplicate({ departmentName, facilityId, excludeId, transaction } = {}) {
    if (!departmentName) return;
    const where = { department_name: departmentName, facility_id: facilityId };
    if (excludeId) where.department_id = { [Op.ne]: excludeId };

    const existing = await Departments.findOne({
      where,
      attributes: ["department_id", "department_code", "department_name"],
      transaction,
    });
    if (existing) {
      throw new ConflictError(
        "Department with this departmentName already exists in this facility",
        [{ field: "departmentName", message: "must be unique within the facility" }],
      );
    }
  }

  async createDepartment(data, actorUserId) {
    await this._assertFacilityExists(data.facilityId);
    await this._assertNoDuplicate({
      departmentName: data.departmentName,
      facilityId: data.facilityId,
    });

    const now = new Date();
    const created = await Departments.create({
      department_uuid: UuidUtil.generate(),
      facility_id: data.facilityId,
      department_code: CodeUtil.generateCode("DE", data.departmentName),
      department_name: data.departmentName,
      department_type: data.departmentType ?? null,
      status: STATUS.ACTIVE,
      created_by: actorUserId,
      created_on: now,
      modified_by: actorUserId,
      modified_on: now,
    });

    return this.getDepartmentById(created.department_id);
  }

  async updateDepartment(departmentId, data, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const department = await this._findEntityOrThrow(departmentId, transaction);
      assertMutable(department, "Department");

      if (data.facilityId !== undefined) {
        await this._assertFacilityExists(data.facilityId, transaction);
      }
      if (data.departmentName !== undefined) {
        await this._assertNoDuplicate({
          departmentName: data.departmentName,
          facilityId: data.facilityId ?? department.facility_id,
          excludeId: departmentId,
          transaction,
        });
      }

      const values = { modified_by: actorUserId, modified_on: new Date() };
      if (data.facilityId !== undefined) values.facility_id = data.facilityId;
      if (data.departmentName !== undefined) values.department_name = data.departmentName;
      if (data.departmentType !== undefined) values.department_type = data.departmentType;

      await department.update(values, { transaction });
      return department;
    }).then((department) => this.getDepartmentById(department.department_id));
  }

  async deleteDepartment(departmentId, actorUserId) {
    const department = await this._findEntityOrThrow(departmentId);
    assertMutable(department, "Department");

    await department.update({
      status: STATUS.DELETED,
      modified_by: actorUserId,
      modified_on: new Date(),
    });

    return this.getDepartmentById(departmentId);
  }

  async updateStatus(departmentId, status, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const department = await this._findEntityOrThrow(departmentId, transaction);
      assertMutable(department, "Department");

      await department.update(
        { status, modified_by: actorUserId, modified_on: new Date() },
        { transaction },
      );
      return department;
    }).then((department) => this.getDepartmentById(department.department_id));
  }
}

module.exports = new DepartmentService();
