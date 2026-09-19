const { Organization, Country, State, District, SubDistrict, City, PostalCode } = require('../models');
const { toSequelizePage, buildEnvelope } = require('../utils/pagination');
const UuidUtil = require("../utils/uuid.util");
const CodeUtil = require("../utils/code.util");
const { Op } = require('sequelize');

function notFound(message = 'Organization not found') {
  const error = new Error(message);
  error.statusCode = 404;
  error.code = 'ORGANIZATION_NOT_FOUND';
  error.expose = true;
  return error;
}

// Resolves each geo id to its display name, for the response only — never
// persisted, never accepted on input. Attribute lists are kept narrow
// (id + the one display field) since this is purely for rendering, not
// for exposing the full geography rows.
const GEO_INCLUDE = [
  { model: Country, as: 'country', attributes: ['countryId', 'name'] },
  { model: State, as: 'state', attributes: ['stateId', 'name'] },
  { model: District, as: 'district', attributes: ['districtId', 'name'] },
  { model: SubDistrict, as: 'subDistrict', attributes: ['subDistrictId', 'name'] },
  { model: City, as: 'city', attributes: ['cityId', 'name'] },
  { model: PostalCode, as: 'postalCode', attributes: ['postalCodeId', 'code'] },
];

function toResponse(organization) {
  if (!organization) return null;
  const plain = organization.get ? organization.get({ plain: true }) : organization;
  return {
    organizationId: plain.organizationId,
    organizationUuid: plain.organizationUuid,
    tenantUuid: plain.tenantUuid,
    organizationName: plain.organizationName,
    organizationCode: plain.organizationCode,
    organizationType: plain.organizationType,
    parentOrganizationId: plain.parentOrganizationId,
    addressLine1: plain.addressLine1,
    addressLine2: plain.addressLine2,
    cityId: plain.cityId,
    cityName: plain.city?.name ?? null,
    subDistrictId: plain.subDistrictId,
    subDistrictName: plain.subDistrict?.name ?? null,
    districtId: plain.districtId,
    districtName: plain.district?.name ?? null,
    stateId: plain.stateId,
    stateName: plain.state?.name ?? null,
    postalCodeId: plain.postalCodeId,
    postalCode: plain.postalCode?.code ?? null,
    countryId: plain.countryId,
    countryName: plain.country?.name ?? null,
    latitude: plain.latitude !== null && plain.latitude !== undefined ? Number(plain.latitude) : null,
    longitude: plain.longitude !== null && plain.longitude !== undefined ? Number(plain.longitude) : null,
    status: plain.status,
    createdOn: plain.createdOn,
    modifiedOn: plain.modifiedOn,
  };
}

class OrganizationService {
  async getList({ page, limit, search, status, organizationType, tenantUuid }) {
    const { limit: safeLimit, offset, page: safePage } = toSequelizePage({ page, limit });

    let where = {};
    if(tenantUuid) where.tenantUuid = tenantUuid;
    if (status) where.status = status;
    if (organizationType) where.organization_type = organizationType;
    if (search) {
      where[Op.or] = [
        { organization_name: { [Op.like]: `%${search}%` } },
        { organization_code: { [Op.like]: `%${search}%` } },
      ];
    }

    const result = await Organization.findAndCountAll({
      where,
      limit: safeLimit,
      offset,
      order: [['createdOn', 'DESC']],
      include: GEO_INCLUDE,
    });

    return buildEnvelope(
      { rows: result.rows.map(toResponse), count: result.count },
      { page: safePage, limit: safeLimit },
    );
  }

  /** Unpaginated, ACTIVE-only — feeds dropdowns (parent-org picker, facilities' org picker). */
  async getDropdownList({ tenantUuid }) {
    const rows = await Organization.findAll({
      where: { tenant_uuid: tenantUuid, status: 'ACTIVE' },
      order: [['organizationName', 'ASC']],
    });
    return { success: true, count: rows.length, data: rows.map(toResponse) };
  }

  async getById(organizationId, { tenantUuid }) {
    const organization = await Organization.findOne({
      where: { organization_id: organizationId, tenant_uuid: tenantUuid },
      include: GEO_INCLUDE,
    });
    if (!organization) throw notFound();
    return toResponse(organization);
  }

  async create({
    organizationName,
    organizationType,
    parentOrganizationId,
    addressLine1,
    addressLine2,
    cityId,
    subDistrictId,
    districtId,
    stateId,
    postalCodeId,
    countryId,
    latitude,
    longitude,
    tenantUuid,
    userId,
  }) {
    if (parentOrganizationId) {
      const parent = await Organization.findOne({
        where: { organization_id: parentOrganizationId, tenant_uuid: tenantUuid },
      });
      if (!parent) throw notFound('Parent organization not found in this tenant');
    }

    const organization = await Organization.create({
      tenantUuid,
      organizationName,
      organizationCode: CodeUtil.generateCode("ORG",organizationName),
      organizationUuid: UuidUtil.generate(),
      organizationType: organizationType || null,
      parentOrganizationId: parentOrganizationId || null,
      addressLine1: addressLine1 || null,
      addressLine2: addressLine2 || null,
      cityId: cityId || null,
      subDistrictId: subDistrictId || null,
      districtId: districtId || null,
      stateId: stateId || null,
      postalCodeId: postalCodeId || null,
      countryId: countryId || 104,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      status: 'ACTIVE',
      createdBy: userId || null,
      modifiedBy: userId || null,
    });

    // Reload with the geo associations so the response carries
    // cityName/stateName/etc. alongside the ids the client just sent —
    // Organization.create()'s returned instance has no associations loaded.
    await organization.reload({ include: GEO_INCLUDE });
    return toResponse(organization);
  }

  async update(organizationId, patch, { tenantUuid, userId }) {
    const organization = await Organization.findOne({
      where: { organization_id: organizationId, tenant_uuid: tenantUuid },
    });
    if (!organization) throw notFound();

    if (patch.parentOrganizationId !== undefined && patch.parentOrganizationId !== null) {
      if (Number(patch.parentOrganizationId) === Number(organizationId)) {
        const error = new Error('An organization cannot be its own parent');
        error.statusCode = 400;
        error.code = 'INVALID_PARENT';
        error.expose = true;
        throw error;
      }
      const parent = await Organization.findOne({
        where: { organization_id: patch.parentOrganizationId, tenant_uuid: tenantUuid },
      });
      if (!parent) throw notFound('Parent organization not found in this tenant');
    }

    await organization.update({
      ...(patch.organizationName !== undefined && { organizationName: patch.organizationName }),
      ...(patch.organizationType !== undefined && { organizationType: patch.organizationType }),
      ...(patch.parentOrganizationId !== undefined && { parentOrganizationId: patch.parentOrganizationId }),
      ...(patch.addressLine1 !== undefined && { addressLine1: patch.addressLine1 }),
      ...(patch.addressLine2 !== undefined && { addressLine2: patch.addressLine2 }),
      ...(patch.cityId !== undefined && { cityId: patch.cityId }),
      ...(patch.subDistrictId !== undefined && { subDistrictId: patch.subDistrictId }),
      ...(patch.districtId !== undefined && { districtId: patch.districtId }),
      ...(patch.stateId !== undefined && { stateId: patch.stateId }),
      ...(patch.postalCodeId !== undefined && { postalCodeId: patch.postalCodeId }),
      ...(patch.countryId !== undefined && { countryId: patch.countryId }),
      ...(patch.latitude !== undefined && { latitude: patch.latitude }),
      ...(patch.longitude !== undefined && { longitude: patch.longitude }),
      modifiedBy: userId || null,
      modifiedOn: new Date(),
    });

    await organization.reload({ include: GEO_INCLUDE });
    return toResponse(organization);
  }

  async updateStatus(organizationId, status, { tenantUuid, userId }) {
    const organization = await Organization.findOne({
      where: { organization_id: organizationId, tenant_uuid: tenantUuid },
    });
    if (!organization) throw notFound();

    await organization.update({ status, modifiedBy: userId || null, modifiedOn: new Date() });
    await organization.reload({ include: GEO_INCLUDE });
    return toResponse(organization);
  }

  /**
   * Hard delete — used only for identity-admin-service's registrationService.js
   * saga-compensation path (DELETE /organizations/:id right after a failed
   * self-registration), never by organization-admin-ui, which always uses
   * updateStatus('DELETED') for its own delete button (soft delete, see
   * organizations.component.ts). A row created seconds ago as part of a
   * registration attempt that then failed has no meaningful audit value to
   * preserve, unlike an established organization a real admin deleted.
   */
  async hardDelete(organizationId, { tenantUuid }) {
    const organization = await Organization.findOne({
      where: { organization_id: organizationId, tenant_uuid: tenantUuid },
    });
    if (!organization) throw notFound();
    await organization.destroy();
    return { organizationId: Number(organizationId), deleted: true };
  }
}

module.exports = new OrganizationService();
