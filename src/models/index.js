const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Organization = require('./organization.model')(sequelize, DataTypes);
const Facility = require('./facility.model')(sequelize, DataTypes);
const Department = require('./department.model')(sequelize, DataTypes);
const FacilityService = require('./facilityService.model')(sequelize, DataTypes);
const ServiceCategory = require('./serviceCategory.model')(sequelize, DataTypes);
const Service = require('./service.model')(sequelize, DataTypes);

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

ServiceCategory.hasMany(FacilityService, { foreignKey: 'serviceCategoryId' });
FacilityService.belongsTo(ServiceCategory, { foreignKey: "serviceCategoryId"});

// Every Service belongs to exactly one ServiceCategory (was missing
// entirely — serviceCategoryId didn't even exist as a column on Service
// until now, see service.model.js).
ServiceCategory.hasMany(Service, { foreignKey: 'serviceCategoryId' });
Service.belongsTo(ServiceCategory, { foreignKey: 'serviceCategoryId' });

// Fixed: was `{ foreignKey: 'departmentId' }`, a copy-paste bug — a
// FacilityService is linked to a Service via serviceId, not departmentId.
Service.hasMany(FacilityService, { foreignKey: 'serviceId' })
FacilityService.belongsTo(Service, { foreignKey: 'serviceId' });

module.exports = {
  sequelize,
  Organization,
  Facility,
  Department,
  FacilityService,
  ServiceCategory,
  Service
};
