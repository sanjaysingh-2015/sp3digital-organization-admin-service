// Global reference data — NOT tenant-scoped, unlike every other model in
// this codebase. A country, state, district, etc. is the same row
// regardless of which tenant/organization is looking it up.
module.exports = (sequelize, DataTypes) => {
  const Country = sequelize.define(
    'Country',
    {
      countryId: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, field: 'country_id' },
      name: { type: DataTypes.STRING(100), allowNull: false, field: 'name' },
      isoAlpha2: { type: DataTypes.STRING(2), allowNull: false, unique: true, field: 'iso_alpha2' },
      isoAlpha3: { type: DataTypes.STRING(3), allowNull: false, unique: true, field: 'iso_alpha3' },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'ACTIVE', field: 'status' },
    },
    {
      tableName: 'countries',
      freezeTableName: true,
      timestamps: false,
      indexes: [{ fields: ['iso_alpha2'] }, { fields: ['iso_alpha3'] }],
    },
  );

  return Country;
};
