const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Organization = sequelize.define(
    'Organization',
    {
      organizationId: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        field: 'organization_id',
      },
      organizationUuid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'organization_uuid',
      },
      // Cross-service tenant scoping. Every row belongs to exactly one
      // identity-admin-service tenant; every query in organizationService.js
      // filters on this unless the caller is internal-service or holds
      // ALL_PERMISSIONS. No FK to identity-service's DB — different
      // database entirely (see README "Data ownership").
      tenantUuid: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'tenant_uuid',
      },
      organizationName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'organization_name',
      },
      // Short human-readable code shown under the name in
      // organizations.component.ts's grid cell (`org?.organizationCode`).
      // Auto-generated at create time — see organizationService.js.
      organizationCode: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true,
        field: 'organization_code',
      },
      organizationType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        field: 'organization_type',
      },
      parentOrganizationId: {
        type: DataTypes.BIGINT,
        allowNull: true,
        field: 'parent_organization_id',
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'ACTIVE',
        field: 'status',
      },
      createdBy: { type: DataTypes.BIGINT, allowNull: true, field: 'created_by' },
      createdOn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_on' },
      modifiedBy: { type: DataTypes.BIGINT, allowNull: true, field: 'modified_by' },
      modifiedOn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'modified_on' },
    },
    {
      tableName: 'organizations',
      freezeTableName: true,
      timestamps: false,
      indexes: [{ fields: ['tenant_uuid'] }, { fields: ['parent_organization_id'] }],
    },
  );

  Organization.generateCode = function generateCode(organizationName) {
    const slug = (organizationName || 'ORG')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 20) || 'ORG';
    return `${slug}-${uuidv4().slice(0, 8).toUpperCase()}`;
  };

  return Organization;
};
