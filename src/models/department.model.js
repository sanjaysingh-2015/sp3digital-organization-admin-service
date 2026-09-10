module.exports = (sequelize, DataTypes) => {
  const Department = sequelize.define(
    'Department',
    {
      departmentId: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, field: 'department_id' },
      departmentUuid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'department_uuid',
      },
      tenantUuid: { type: DataTypes.UUID, allowNull: false, field: 'tenant_uuid' },
      facilityId: { type: DataTypes.BIGINT, allowNull: false, field: 'facility_id' },
      departmentName: { type: DataTypes.STRING(200), allowNull: false, field: 'department_name' },
      departmentType: { type: DataTypes.STRING(50), allowNull: true, field: 'department_type' },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'ACTIVE', field: 'status' },
      createdBy: { type: DataTypes.BIGINT, allowNull: true, field: 'created_by' },
      createdOn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_on' },
      modifiedBy: { type: DataTypes.BIGINT, allowNull: true, field: 'modified_by' },
      modifiedOn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'modified_on' },
    },
    {
      tableName: 'departments',
      freezeTableName: true,
      timestamps: false,
      indexes: [{ fields: ['tenant_uuid'] }, { fields: ['facility_id'] }],
    },
  );

  return Department;
};
