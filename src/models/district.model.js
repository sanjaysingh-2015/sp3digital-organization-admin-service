module.exports = (sequelize, DataTypes) => {
  const District = sequelize.define(
    'District',
    {
      districtId: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, field: 'district_id' },
      stateId: { type: DataTypes.BIGINT, allowNull: false, field: 'state_id' },
      name: { type: DataTypes.STRING(150), allowNull: false, field: 'name' },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'ACTIVE', field: 'status' },
    },
    {
      tableName: 'districts',
      freezeTableName: true,
      timestamps: false,
      indexes: [{ fields: ['state_id'] }],
    },
  );

  return District;
};
