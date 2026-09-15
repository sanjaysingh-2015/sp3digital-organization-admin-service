module.exports = (sequelize, DataTypes) => {
  const SubDistrict = sequelize.define(
    'SubDistrict',
    {
      subDistrictId: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, field: 'sub_district_id' },
      districtId: { type: DataTypes.BIGINT, allowNull: false, field: 'district_id' },
      // Called "Taluk"/"Tehsil"/"Mandal"/"Block" depending on the state —
      // stored generically as sub-district, matching the requested schema.
      name: { type: DataTypes.STRING(150), allowNull: false, field: 'name' },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'ACTIVE', field: 'status' },
    },
    {
      tableName: 'sub_districts',
      freezeTableName: true,
      timestamps: false,
      indexes: [{ fields: ['district_id'] }],
    },
  );

  return SubDistrict;
};
