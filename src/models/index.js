const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Organization = require('./organization.model')(sequelize, DataTypes);
const Facility = require('./facility.model')(sequelize, DataTypes);
const Department = require('./department.model')(sequelize, DataTypes);
const FacilityService = require('./facilityService.model')(sequelize, DataTypes);

// --- Associations ---
Organization.hasMany(Organization, { as: 'children', foreignKey: 'parentOrganizationId' });
Organization.belongsTo(Organization, { as: 'parent', foreignKey: 'parentOrganizationId' });

Organization.hasMany(Facility, { foreignKey: 'organizationId' });
Facility.belongsTo(Organization, { foreignKey: 'organizationId' });

Facility.hasMany(Department, { foreignKey: 'facilityId' });
Department.belongsTo(Facility, { foreignKey: 'facilityId' });

Facility.hasMany(FacilityService, { foreignKey: 'facilityId' });
FacilityService.belongsTo(Facility, { foreignKey: 'facilityId' });

Department.hasMany(FacilityService, { foreignKey: 'departmentId' });
FacilityService.belongsTo(Department, { foreignKey: 'departmentId' });

module.exports = {
  sequelize,
  Organization,
  Facility,
  Department,
  FacilityService,
};
