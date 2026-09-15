module.exports = (sequelize, DataTypes) => {
  const PostalCode = sequelize.define(
    'PostalCode',
    {
      postalCodeId: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, field: 'postal_code_id' },
      cityId: { type: DataTypes.BIGINT, allowNull: false, field: 'city_id' },
      // Modeled as one-to-many from City (a city/locality can have more
      // than one postal code covering different parts of it in dense
      // areas), rather than forcing a 1:1 that doesn't hold everywhere.
      code: { type: DataTypes.STRING(10), allowNull: false, field: 'code' },
      status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'ACTIVE', field: 'status' },
    },
    {
      tableName: 'postal_codes',
      freezeTableName: true,
      timestamps: false,
      indexes: [{ fields: ['city_id'] }, { fields: ['code'] }],
    },
  );

  return PostalCode;
};
