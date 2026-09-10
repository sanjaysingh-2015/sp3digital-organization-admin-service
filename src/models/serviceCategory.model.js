module.exports = (sequelize, DataTypes) => {
  const ServiceCategory = sequelize.define(
    'ServiceCategory',
    {
      serviceCategoryId: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        field: 'service_category_id',
      },
      serviceCategoryUuid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'service_category_uuid',
      },
      tenantUuid: { type: DataTypes.UUID, allowNull: false, field: 'tenant_uuid' },
      organizationId: { type: DataTypes.BIGINT, allowNull: false, field: 'organization_id' },
      serviceCategoryCode: { type: DataTypes.STRING(20), allowNull: false, field: 'service_category_code' },
      serviceCategoryName: { type: DataTypes.STRING(100), allowNull: false, field: 'service_category_name' },
      description: { type: DataTypes.STRING(500), allowNull: false, field: 'description' },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'ACTIVE', field: 'status' },
      createdBy: { type: DataTypes.BIGINT, allowNull: true, field: 'created_by' },
      createdOn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_on' },
      modifiedBy: { type: DataTypes.BIGINT, allowNull: true, field: 'modified_by' },
      modifiedOn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'modified_on' },
    },
    {
      tableName: 'service_categories',
      freezeTableName: true,
      timestamps: false,
      indexes: [{ fields: ['tenant_uuid'] }, { fields: ['organization_id'] }],
    },
  );

  return ServiceCategory;
};
