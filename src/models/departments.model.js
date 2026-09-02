module.exports = (sequelize, DataTypes) => {
  const Departments = sequelize.define(
    "Departments",
    {
      department_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      department_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      facility_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      department_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      department_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      // e.g. OPD, IPD, LAB, PHARMACY, RADIOLOGY, EMERGENCY
      department_type: {
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
      tableName: "departments",
      timestamps: false,
      freezeTableName: true,
      indexes: [
        { unique: true, fields: ["facility_id", "department_code"] },
      ],
    },
  );

  return Departments;
};
