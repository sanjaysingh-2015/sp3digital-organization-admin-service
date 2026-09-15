module.exports = (sequelize, DataTypes) => {
  const State = sequelize.define(
    'State',
    {
      stateId: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, field: 'state_id' },
      countryId: { type: DataTypes.BIGINT, allowNull: false, field: 'country_id' },
      name: { type: DataTypes.STRING(100), allowNull: false, field: 'name' },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'ACTIVE', field: 'status' },
    },
    {
      tableName: 'states',
      freezeTableName: true,
      timestamps: false,
      indexes: [{ fields: ['country_id'] }],
    },
  );

  return State;
};
