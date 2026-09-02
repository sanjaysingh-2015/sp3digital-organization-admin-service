module.exports = (sequelize, DataTypes) => {
  const Facilities = sequelize.define(
    "Facilities",
    {
      facility_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      facility_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      organization_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      facility_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      facility_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      // e.g. CHC, PHC, DISTRICT_HOSPITAL, CLINIC, SUB_CENTER
      facility_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      address_line1: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      address_line2: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      state_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      district_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      postal_code: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: "India",
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      phone_number: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: "ACTIVE",
      },
      created_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      created_on: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      modified_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      modified_on: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "facilities",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return Facilities;
};
