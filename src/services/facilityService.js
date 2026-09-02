const { Op } = require("sequelize");
const { Facilities, Organizations, sequelize } = require("../models");
const { toSequelizePage, buildEnvelope } = require("../utils/pagination");
const UuidUtil = require("../utils/uuid.util");
const CodeUtil = require("../utils/code.util");
const { STATUS, notFound, assertMutable } = require("../utils/lifecycle");
const { ConflictError } = require("../validations/facility.validation");

const FACILITY_ATTRIBUTES = [
  "facility_id",
  "facility_uuid",
  "organization_id",
  "facility_code",
  "facility_name",
  "facility_type",
  "address_line1",
  "address_line2",
  "city",
  "state_name",
  "district_name",
  "postal_code",
  "country",
  "latitude",
  "longitude",
  "phone_number",
  "email",
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
    facilityId: plain.facility_id,
    facilityUuid: plain.facility_uuid,
    organizationId: plain.organization_id,
    facilityCode: plain.facility_code,
    facilityName: plain.facility_name,
    facilityType: plain.facility_type,
    addressLine1: plain.address_line1,
    addressLine2: plain.address_line2,
    city: plain.city,
    stateName: plain.state_name,
    districtName: plain.district_name,
    postalCode: plain.postal_code,
    country: plain.country,
    latitude: plain.latitude !== undefined && plain.latitude !== null ? Number(plain.latitude) : null,
    longitude: plain.longitude !== undefined && plain.longitude !== null ? Number(plain.longitude) : null,
    phoneNumber: plain.phone_number,
    email: plain.email,
    status: plain.status,
    createdBy: plain.created_by,
    createdOn: plain.created_on,
    modifiedBy: plain.modified_by,
    modifiedOn: plain.modified_on,
  };
}

class FacilityService {
  async getFacilityList({ page, limit, status, facilityType, organizationId, search } = {}) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });

    const where = {};
    if (status) where.status = status;
    if (facilityType) where.facility_type = facilityType;
    if (organizationId) where.organization_id = organizationId;
    if (search) where.facility_name = { [Op.like]: `%${search}%` };

    const result = await Facilities.findAndCountAll({
      where,
      attributes: FACILITY_ATTRIBUTES,
      order: [["created_on", "DESC"]],
      limit: safeLimit,
      offset,
    });

    return buildEnvelope(
      { rows: result.rows.map(toResponseShape), count: result.count },
      { page: safePage, limit: safeLimit },
    );
  }

  /** For dropdowns: all ACTIVE facilities, optionally scoped to one organization. */
  async getFacilities({ organizationId } = {}) {
    const where = { status: STATUS.ACTIVE };
    if (organizationId) where.organization_id = organizationId;

    const facilities = await Facilities.findAll({
      where,
      attributes: FACILITY_ATTRIBUTES,
      order: [["facility_name", "ASC"]],
    });

    return facilities.map(toResponseShape);
  }

  async getFacilityById(facilityId) {
    const facility = await Facilities.findOne({
      where: { facility_id: facilityId },
      attributes: FACILITY_ATTRIBUTES,
    });

    if (!facility) throw notFound("Facility");
    return toResponseShape(facility);
  }

  async _findEntityOrThrow(facilityId, transaction) {
    const facility = await Facilities.findOne({
      where: { facility_id: facilityId },
      transaction,
    });
    if (!facility) throw notFound("Facility");
    return facility;
  }

  async _assertOrganizationExists(organizationId, transaction) {
    if (!organizationId) return;
    const organization = await Organizations.findOne({
      where: { organization_id: organizationId },
      transaction,
    });
    if (!organization) {
      throw new ConflictError(
        "organizationId does not reference an existing organization",
        [{ field: "organizationId", message: "not found" }],
      );
    }
  }

  async _assertNoDuplicate({ facilityName, organizationId, excludeId, transaction } = {}) {
    if (!facilityName) return;
    const where = { facility_name: facilityName, organization_id: organizationId };
    if (excludeId) where.facility_id = { [Op.ne]: excludeId };

    const existing = await Facilities.findOne({
      where,
      attributes: ["facility_id", "facility_code", "facility_name"],
      transaction,
    });
    if (existing) {
      throw new ConflictError(
        "Facility with this facilityName already exists in this organization",
        [{ field: "facilityName", message: "must be unique within the organization" }],
      );
    }
  }

  async createFacility(data, actorUserId) {
    await this._assertOrganizationExists(data.organizationId);
    await this._assertNoDuplicate({
      facilityName: data.facilityName,
      organizationId: data.organizationId,
    });

    const now = new Date();
    const created = await Facilities.create({
      facility_uuid: UuidUtil.generate(),
      organization_id: data.organizationId,
      facility_code: CodeUtil.generateCode("FA", data.facilityName),
      facility_name: data.facilityName,
      facility_type: data.facilityType ?? null,
      address_line1: data.addressLine1 ?? null,
      address_line2: data.addressLine2 ?? null,
      city: data.city ?? null,
      state_name: data.stateName ?? null,
      district_name: data.districtName ?? null,
      postal_code: data.postalCode ?? null,
      country: data.country ?? "India",
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      phone_number: data.phoneNumber ?? null,
      email: data.email ?? null,
      status: STATUS.ACTIVE,
      created_by: actorUserId,
      created_on: now,
      modified_by: actorUserId,
      modified_on: now,
    });

    return this.getFacilityById(created.facility_id);
  }

  async updateFacility(facilityId, data, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const facility = await this._findEntityOrThrow(facilityId, transaction);
      assertMutable(facility, "Facility");

      if (data.organizationId !== undefined) {
        await this._assertOrganizationExists(data.organizationId, transaction);
      }
      if (data.facilityName !== undefined) {
        await this._assertNoDuplicate({
          facilityName: data.facilityName,
          organizationId: data.organizationId ?? facility.organization_id,
          excludeId: facilityId,
          transaction,
        });
      }

      const values = { modified_by: actorUserId, modified_on: new Date() };
      const fieldMap = {
        organizationId: "organization_id",
        facilityName: "facility_name",
        facilityType: "facility_type",
        addressLine1: "address_line1",
        addressLine2: "address_line2",
        city: "city",
        stateName: "state_name",
        districtName: "district_name",
        postalCode: "postal_code",
        country: "country",
        latitude: "latitude",
        longitude: "longitude",
        phoneNumber: "phone_number",
        email: "email",
      };
      for (const [apiField, column] of Object.entries(fieldMap)) {
        if (data[apiField] !== undefined) values[column] = data[apiField];
      }

      await facility.update(values, { transaction });
      return facility;
    }).then((facility) => this.getFacilityById(facility.facility_id));
  }

  async deleteFacility(facilityId, actorUserId) {
    const facility = await this._findEntityOrThrow(facilityId);
    assertMutable(facility, "Facility");

    await facility.update({
      status: STATUS.DELETED,
      modified_by: actorUserId,
      modified_on: new Date(),
    });

    return this.getFacilityById(facilityId);
  }

  async updateStatus(facilityId, status, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const facility = await this._findEntityOrThrow(facilityId, transaction);
      assertMutable(facility, "Facility");

      await facility.update(
        { status, modified_by: actorUserId, modified_on: new Date() },
        { transaction },
      );
      return facility;
    }).then((facility) => this.getFacilityById(facility.facility_id));
  }
}

module.exports = new FacilityService();
