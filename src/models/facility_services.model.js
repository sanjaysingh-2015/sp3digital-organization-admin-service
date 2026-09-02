module.exports = (sequelize, DataTypes) => {
  const FacilityServices = sequelize.define(
    "FacilityServices",
    {
      facility_service_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      facility_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      department_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      service_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      service_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      // e.g. OUTPATIENT, DIAGNOSTIC, IMMUNIZATION, MATERNAL_HEALTH, TELECONSULTATION
      service_category: {
        type: DataTypes.STRING(50),
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
      tableName: "facility_services",
      timestamps: false,
      freezeTableName: true,
      indexes: [
        { unique: true, fields: ["facility_id", "service_code"] },
      ],
    },
  );

  return FacilityServices;
};
