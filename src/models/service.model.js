module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define(
    'Service',
    {
      serviceId: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        field: 'service_id',
      },
      serviceUuid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'service_uuid',
      },
      tenantUuid: { type: DataTypes.UUID, allowNull: false, field: 'tenant_uuid' },
      organizationId: { type: DataTypes.BIGINT, allowNull: false, field: 'organization_id' },
      // Every service belongs to exactly one category (e.g. "Blood Test"
      // under "Diagnostics"). This column was missing from the model
      // entirely even though serviceService.js/service.validation.js and
      // the associations both already assumed it existed — every create
      // silently inserted a service with no category at all.
      serviceCategoryId: { type: DataTypes.BIGINT, allowNull: false, field: 'service_category_id' },
      // Optional: a service can be offered facility-wide without a specific
      // owning department (see facility-services.component.ts's `|| null`).
      serviceCode: { type: DataTypes.STRING(20), allowNull: false, field: 'service_code' },
      serviceName: { type: DataTypes.STRING(100), allowNull: false, field: 'service_name' },
      description: { type: DataTypes.STRING(500), allowNull: true, field: 'description' },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'ACTIVE', field: 'status' },
      createdBy: { type: DataTypes.BIGINT, allowNull: true, field: 'created_by' },
      createdOn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_on' },
      modifiedBy: { type: DataTypes.BIGINT, allowNull: true, field: 'modified_by' },
      modifiedOn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'modified_on' },
    },
    {
      tableName: 'services',
      freezeTableName: true,
      timestamps: false,
      indexes: [{ fields: ['tenant_uuid'] }, { fields: ['organization_id'] }, { fields: ['service_category_id'] }],
    },
  );

  return Service;
};
