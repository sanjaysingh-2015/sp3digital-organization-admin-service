module.exports = (sequelize, DataTypes) => {
  const Organizations = sequelize.define(
    "Organizations",
    {
      organization_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      organization_uuid: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      tenant_uuid: {
        type: DataTypes.STRING(36),
        allowNull: false,
      },
      organization_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      organization_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      // e.g. STATE_HEALTH_DEPT, DISTRICT_HEALTH_AUTHORITY, HEALTH_NETWORK, NGO, PRIVATE_CHAIN
      organization_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      // Self-referencing hierarchy (State -> District -> Health Network / Authority),
      // per the RFP's Country/State/District/Health-Network hierarchy.
      parent_organization_id: {
        type: DataTypes.BIGINT,
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
      tableName: "organizations",
      timestamps: false,
      freezeTableName: true,
    },
  );

  return Organizations;
};
