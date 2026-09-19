// Business logic for the Facility entity (routes: /facilities). Not to be
// confused with facilityServiceCatalogService.js, which handles the
// separate "FacilityService" entity behind /facility-services.
const { Organization, Facility } = require('../models');
const CodeUtil = require('../utils/code.util');
const { toSequelizePage, buildEnvelope } = require('../utils/pagination');
const { Op } = require('sequelize');
const UuidUtils = require('../utils/uuid.util');

function notFound(message = 'Facility not found') {
  const error = new Error(message);
  error.statusCode = 404;
  error.code = 'FACILITY_NOT_FOUND';
  error.expose = true;
  return error;
}

async function assertOrganizationExists(organizationId, tenantUuid) {
  const organization = await Organization.findOne({
    where: { organization_id: organizationId, tenant_uuid: tenantUuid },
  });
  if (!organization) {
    const error = new Error('Organization not found in this tenant');
    error.statusCode = 404;
    error.code = 'ORGANIZATION_NOT_FOUND';
    error.expose = true;
    throw error;
  }
}

function toResponse(facility) {
  if (!facility) return null;
  const plain = facility.get ? facility.get({ plain: true }) : facility;
  return {
    facilityId: plain.facilityId,
    facilityUuid: plain.facilityUuid,
    tenantUuid: plain.tenantUuid,
    organizationId: plain.organizationId,
    facilityName: plain.facilityName,
    facilityType: plain.facilityType,
    addressLine1: plain.addressLine1,
    addressLine2: plain.addressLine2,
    cityId: plain.cityId,
    subDistrictId: plain.subDistrictId,
    districtId: plain.districtId,
    stateId: plain.stateId,
    postalCodeId: plain.postalCodeId,
    countryId: plain.countryId,
    latitude: plain.latitude !== null && plain.latitude !== undefined ? Number(plain.latitude) : null,
    longitude: plain.longitude !== null && plain.longitude !== undefined ? Number(plain.longitude) : null,
    phoneNumber: plain.phoneNumber,
    email: plain.email,
    status: plain.status,
    createdOn: plain.createdOn,
    modifiedOn: plain.modifiedOn,
  };
}

class FacilityService {
  async getList({ page, limit, search, status, facilityType, organizationId, tenantUuid }) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });

    const where = { tenant_uuid: tenantUuid };
    if (status) where.status = status;
    if (facilityType) where.facility_type = facilityType;
    if (organizationId) where.organization_id = organizationId;
    if (search) {
      // `city` used to be a free-text column and was searchable via LIKE.
      // It is now a FK id (city_id) into the geography tables, so it can
      // no longer be matched against a free-text search term.
      where.facility_name = { [Op.like]: `%${search}%` };
    }

    const result = await Facility.findAndCountAll({
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

  async getDropdownList({ tenantUuid }) {
    const rows = await Facility.findAll({
      where: { tenant_uuid: tenantUuid, status: 'ACTIVE' },
      order: [['facilityName', 'ASC']],
    });
    return { success: true, count: rows.length, data: rows.map(toResponse) };
  }

  async getById(facilityId, { tenantUuid }) {
    const facility = await Facility.findOne({ where: { facility_id: facilityId, tenant_uuid: tenantUuid } });
    if (!facility) throw notFound();
    return toResponse(facility);
  }

  async create(payload, { tenantUuid, userId }) {
    await assertOrganizationExists(payload.organizationId, tenantUuid);
    const facility = await Facility.create({
      tenantUuid,
      organizationId: payload.organizationId,
      facilityCode: CodeUtil.generateCode("FACILITIES", payload.facilityName),
      facilityUuid: UuidUtils.generate(),
      facilityName: payload.facilityName,
      facilityType: payload.facilityType || null,
      addressLine1: payload.addressLine1 || null,
      addressLine2: payload.addressLine2 || null,
      cityId: payload.cityId || null,
      subDistrictId: payload.subDistrictId || null,
      districtId: payload.districtId || null,
      stateId: payload.stateId || null,
      postalCodeId: payload.postalCodeId || null,
      countryId: payload.countryId || 104,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      phoneNumber: payload.phoneNumber || null,
      email: payload.email || null,
      status: 'ACTIVE',
      createdBy: userId || null,
      modifiedBy: userId || null,
    });

    return toResponse(facility);
  }

  async update(facilityId, patch, { tenantUuid, userId }) {
    const facility = await Facility.findOne({ where: { facility_id: facilityId, tenant_uuid: tenantUuid } });
    if (!facility) throw notFound();

    if (patch.organizationId !== undefined) {
      await assertOrganizationExists(patch.organizationId, tenantUuid);
    }

    await facility.update({ ...patch, modifiedBy: userId || null, modifiedOn: new Date() });
    return toResponse(facility);
  }

  async updateStatus(facilityId, status, { tenantUuid, userId }) {
    const facility = await Facility.findOne({ where: { facility_id: facilityId, tenant_uuid: tenantUuid } });
    if (!facility) throw notFound();

    await facility.update({ status, modifiedBy: userId || null, modifiedOn: new Date() });
    return toResponse(facility);
  }
}

module.exports = new FacilityService();
