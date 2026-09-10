module.exports = (sequelize, DataTypes) => {
  const FacilityService = sequelize.define(
    'FacilityService',
    {
      facilityServiceId: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        field: 'facility_service_id',
      },
      facilityServiceUuid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'facility_service_uuid',
      },
      tenantUuid: { type: DataTypes.UUID, allowNull: false, field: 'tenant_uuid' },
      facilityId: { type: DataTypes.BIGINT, allowNull: false, field: 'facility_id' },
      // Optional: a service can be offered facility-wide without a specific
      // owning department (see facility-services.component.ts's `|| null`).
      departmentId: { type: DataTypes.BIGINT, allowNull: true, field: 'department_id' },
      serviceName: { type: DataTypes.STRING(200), allowNull: false, field: 'service_name' },
      serviceCategory: { type: DataTypes.STRING(50), allowNull: true, field: 'service_category' },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'ACTIVE', field: 'status' },
      createdBy: { type: DataTypes.BIGINT, allowNull: true, field: 'created_by' },
      createdOn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_on' },
      modifiedBy: { type: DataTypes.BIGINT, allowNull: true, field: 'modified_by' },
      modifiedOn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'modified_on' },
    },
    {
      tableName: 'facility_services',
      freezeTableName: true,
      timestamps: false,
      indexes: [{ fields: ['tenant_uuid'] }, { fields: ['facility_id'] }, { fields: ['department_id'] }],
    },
  );

  return FacilityService;
};
