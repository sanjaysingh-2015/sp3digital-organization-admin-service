const { Op } = require("sequelize");
const { Organizations, sequelize } = require("../models");
const { toSequelizePage, buildEnvelope } = require("../utils/pagination");
const UuidUtil = require("../utils/uuid.util");
const CodeUtil = require("../utils/code.util");
const {
  STATUS,
  notFound,
  assertMutable,
} = require("../utils/lifecycle");
const { ConflictError } = require("../validations/organization.validation");

const ORGANIZATION_ATTRIBUTES = [
  "organization_id",
  "organization_uuid",
  "tenant_uuid",
  "organization_code",
  "organization_name",
  "organization_type",
  "parent_organization_id",
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
    organizationId: plain.organization_id,
    organizationUuid: plain.organization_uuid,
    tenantUuid: plain.tenant_uuid,
    organizationCode: plain.organization_code,
    organizationName: plain.organization_name,
    organizationType: plain.organization_type,
    parentOrganizationId: plain.parent_organization_id,
    status: plain.status,
    createdBy: plain.created_by,
    createdOn: plain.created_on,
    modifiedBy: plain.modified_by,
    modifiedOn: plain.modified_on,
  };
}

class OrganizationService {
  /** GET /organizations — paginated + filterable (status, type, search by name). */
  async getOrganizationList({ page, limit, status, organizationType, search, tenantUuid } = {}) {
    const {
      limit: safeLimit,
      offset,
      page: safePage,
    } = toSequelizePage({ page, limit });

    const where = {};
    if (tenantUuid) where.tenant_uuid = tenantUuid;
    if (status) where.status = status;
    if (organizationType) where.organization_type = organizationType;
    if (search) where.organization_name = { [Op.like]: `%${search}%` };

    const result = await Organizations.findAndCountAll({
      where,
      attributes: ORGANIZATION_ATTRIBUTES,
      order: [["created_on", "DESC"]],
      limit: safeLimit,
      offset,
    });

    return buildEnvelope(
      { rows: result.rows.map(toResponseShape), count: result.count },
      { page: safePage, limit: safeLimit },
    );
  }

  /** For dropdowns: all ACTIVE organizations, unpaginated. */
  async getOrganizations({ tenantUuid } = {}) {
    const where = { status: STATUS.ACTIVE };
    if (tenantUuid) where.tenant_uuid = tenantUuid;

    const organizations = await Organizations.findAll({
      where,
      attributes: ORGANIZATION_ATTRIBUTES,
      order: [["organization_name", "ASC"]],
    });

    return organizations.map(toResponseShape);
  }

  async getOrganizationById(organizationId) {
    const organization = await Organizations.findOne({
      where: { organization_id: organizationId },
      attributes: ORGANIZATION_ATTRIBUTES,
    });

    if (!organization) throw notFound("Organization");
    return toResponseShape(organization);
  }

  /** Internal: fetch raw model row for update/delete/status flows. */
  async _findEntityOrThrow(organizationId, transaction) {
    const organization = await Organizations.findOne({
      where: { organization_id: organizationId },
      transaction,
    });

    if (!organization) throw notFound("Organization");
    return organization;
  }

  async _assertNoDuplicate({ organizationName, excludeId, transaction } = {}) {
    if (!organizationName) return;

    const where = { organization_name: organizationName };
    if (excludeId) where.organization_id = { [Op.ne]: excludeId };

    const existing = await Organizations.findOne({
      where,
      attributes: ["organization_id", "organization_code", "organization_name"],
      transaction,
    });

    if (existing) {
      throw new ConflictError(
        "Organization with this organizationName already exists",
        [{ field: "organizationName", message: "must be unique" }],
      );
    }
  }

  async _assertParentExists(parentOrganizationId, transaction) {
    if (!parentOrganizationId) return;
    const parent = await Organizations.findOne({
      where: { organization_id: parentOrganizationId },
      transaction,
    });
    if (!parent) {
      throw new ConflictError(
        "parentOrganizationId does not reference an existing organization",
        [{ field: "parentOrganizationId", message: "not found" }],
      );
    }
  }

  async createOrganization(data, actorUserId, tenantUuid) {
    await this._assertNoDuplicate({ organizationName: data.organizationName });
    await this._assertParentExists(data.parentOrganizationId);

    const now = new Date();
    const created = await Organizations.create({
      organization_uuid: UuidUtil.generate(),
      tenant_uuid: tenantUuid,
      organization_code: CodeUtil.generateCode("ORG", data.organizationName),
      organization_name: data.organizationName,
      organization_type: data.organizationType ?? null,
      parent_organization_id: data.parentOrganizationId ?? null,
      status: STATUS.ACTIVE,
      created_by: actorUserId,
      created_on: now,
      modified_by: actorUserId,
      modified_on: now,
    });

    return this.getOrganizationById(created.organization_id);
  }

  async updateOrganization(organizationId, data, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const organization = await this._findEntityOrThrow(organizationId, transaction);
      assertMutable(organization, "Organization");

      if (data.organizationName !== undefined) {
        await this._assertNoDuplicate({
          organizationName: data.organizationName,
          excludeId: organizationId,
          transaction,
        });
      }
      if (data.parentOrganizationId !== undefined) {
        if (data.parentOrganizationId === Number(organizationId)) {
          throw new ConflictError(
            "An organization cannot be its own parent",
            [{ field: "parentOrganizationId", message: "must differ from organizationId" }],
          );
        }
        await this._assertParentExists(data.parentOrganizationId, transaction);
      }

      const values = { modified_by: actorUserId, modified_on: new Date() };
      if (data.organizationName !== undefined) values.organization_name = data.organizationName;
      if (data.organizationType !== undefined) values.organization_type = data.organizationType;
      if (data.parentOrganizationId !== undefined) values.parent_organization_id = data.parentOrganizationId;

      await organization.update(values, { transaction });
      return organization;
    }).then((organization) => this.getOrganizationById(organization.organization_id));
  }

  /** Soft delete: sets status to DELETED, never removes the row. */
  async deleteOrganization(organizationId, actorUserId) {
    const organization = await this._findEntityOrThrow(organizationId);
    assertMutable(organization, "Organization");

    await organization.update({
      status: STATUS.DELETED,
      modified_by: actorUserId,
      modified_on: new Date(),
    });

    return this.getOrganizationById(organizationId);
  }

  /** PATCH .../:id/status — dedicated lifecycle transition endpoint. */
  async updateStatus(organizationId, status, actorUserId) {
    return sequelize.transaction(async (transaction) => {
      const organization = await this._findEntityOrThrow(organizationId, transaction);
      assertMutable(organization, "Organization");

      await organization.update(
        { status, modified_by: actorUserId, modified_on: new Date() },
        { transaction },
      );
      return organization;
    }).then((organization) => this.getOrganizationById(organization.organization_id));
  }
}

module.exports = new OrganizationService();
