module.exports = (sequelize, DataTypes) => {
  const City = sequelize.define(
    'City',
    {
      cityId: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, field: 'city_id' },
      subDistrictId: { type: DataTypes.BIGINT, allowNull: false, field: 'sub_district_id' },
      // Covers both cities and villages — the source data (India Post's
      // office directory) doesn't distinguish the two; a locality is
      // whatever a post office serves, city or village alike.
      name: { type: DataTypes.STRING(150), allowNull: false, field: 'name' },
      // Provenance from the source import, kept for traceability/debugging
      // rather than being load-bearing for the app itself.
      rawOfficeName: { type: DataTypes.STRING(150), allowNull: true, field: 'raw_office_name' },
      officeType: { type: DataTypes.STRING(10), allowNull: true, field: 'office_type' }, // S.O / H.O / B.O
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'ACTIVE', field: 'status' },
    },
    {
      tableName: 'cities',
      freezeTableName: true,
      timestamps: false,
      indexes: [{ fields: ['sub_district_id'] }, { fields: ['name'] }],
    },
  );

  return City;
};
