module.exports = (sequelize, DataTypes) => {
  const Facility = sequelize.define(
    'Facility',
    {
      facilityId: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, field: 'facility_id' },
      facilityCode: {
        type: DataTypes.STRING(40),
        allowNull: false,
        unique: true,
        field: 'facility_code',
      },
      facilityUuid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        defaultValue: DataTypes.UUIDV4,
        field: 'facility_uuid',
      },
      tenantUuid: { type: DataTypes.UUID, allowNull: false, field: 'tenant_uuid' },
      organizationId: { type: DataTypes.BIGINT, allowNull: false, field: 'organization_id' },
      facilityName: { type: DataTypes.STRING(200), allowNull: false, field: 'facility_name' },
      facilityType: { type: DataTypes.STRING(50), allowNull: true, field: 'facility_type' },
      addressLine1: { type: DataTypes.STRING(250), allowNull: true, field: 'address_line1' },
      addressLine2: { type: DataTypes.STRING(250), allowNull: true, field: 'address_line2' },
      cityId: { type: DataTypes.BIGINT, allowNull: true, field: 'city_id' },
      subDistrictId: { type: DataTypes.BIGINT, allowNull: true, field: 'sub_district_id' },
      districtId: { type: DataTypes.BIGINT, allowNull: true, field: 'district_id' },
      stateId: { type: DataTypes.BIGINT, allowNull: true, field: 'state_id' },
      postalCodeId: { type: DataTypes.BIGINT, allowNull: true, field: 'postal_code_id' },
      countryId: { type: DataTypes.BIGINT, allowNull: true, defaultValue: 'India', field: 'country_id' },
      latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true, field: 'latitude' },
      longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true, field: 'longitude' },
      phoneNumber: { type: DataTypes.STRING(30), allowNull: true, field: 'phone_number' },
      email: { type: DataTypes.STRING(320), allowNull: true, field: 'email' },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'ACTIVE', field: 'status' },
      createdBy: { type: DataTypes.BIGINT, allowNull: true, field: 'created_by' },
      createdOn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_on' },
      modifiedBy: { type: DataTypes.BIGINT, allowNull: true, field: 'modified_by' },
      modifiedOn: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'modified_on' },
    },
    {
      tableName: 'facilities',
      freezeTableName: true,
      timestamps: false,
      indexes: [{ fields: ['tenant_uuid'] }, { fields: ['organization_id'] }],
    },
  );

  return Facility;
};
