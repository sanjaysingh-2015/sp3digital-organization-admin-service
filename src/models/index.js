const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Organization = require('./organization.model')(sequelize, DataTypes);
const Facility = require('./facility.model')(sequelize, DataTypes);
const Department = require('./department.model')(sequelize, DataTypes);
const FacilityService = require('./facilityService.model')(sequelize, DataTypes);
const ServiceCategory = require('./serviceCategory.model')(sequelize, DataTypes);
const Service = require('./service.model')(sequelize, DataTypes);
const Country = require('./country.model')(sequelize, DataTypes);
const State = require('./state.model')(sequelize, DataTypes);
const District = require('./district.model')(sequelize, DataTypes);
const SubDistrict = require('./subDistrict.model')(sequelize, DataTypes);
const City = require('./city.model')(sequelize, DataTypes);
const PostalCode = require('./postalCode.model')(sequelize, DataTypes);

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

// Geography master data — global reference chain, not tenant-scoped.
// Country -> State -> District -> SubDistrict -> City -> PostalCode.
Country.hasMany(State, { foreignKey: 'countryId' });
State.belongsTo(Country, { foreignKey: 'countryId' });

State.hasMany(District, { foreignKey: 'stateId' });
District.belongsTo(State, { foreignKey: 'stateId' });

District.hasMany(SubDistrict, { foreignKey: 'districtId' });
SubDistrict.belongsTo(District, { foreignKey: 'districtId' });

SubDistrict.hasMany(City, { foreignKey: 'subDistrictId' });
City.belongsTo(SubDistrict, { foreignKey: 'subDistrictId' });

City.hasMany(PostalCode, { foreignKey: 'cityId' });
PostalCode.belongsTo(City, { foreignKey: 'cityId' });

// Organization/Facility -> geography lookups, used only to resolve the
// human-readable name alongside each *_id in API responses (see
// GEO_INCLUDE in organizationService.js/facilityService.js). Aliased so
// both models can carry all six without name collisions.
//
// constraints: false is deliberate: these ids are stored loosely (nullable,
// no enforced FK) because the geography tables are optional reference data
// seeded separately (scripts/seed-india-geo.js) and aren't guaranteed to be
// populated — organizations.model.js/facility.model.js even default
// countryId to 104 without knowing whether a country with that id exists.
// A real FK constraint here would make every create/update depend on
// geography data being seeded first, which is exactly what this app was
// built to not require.
for (const Model of [Organization, Facility]) {
  Model.belongsTo(Country, { as: 'country', foreignKey: 'countryId', constraints: false });
  Model.belongsTo(State, { as: 'state', foreignKey: 'stateId', constraints: false });
  Model.belongsTo(District, { as: 'district', foreignKey: 'districtId', constraints: false });
  Model.belongsTo(SubDistrict, { as: 'subDistrict', foreignKey: 'subDistrictId', constraints: false });
  Model.belongsTo(City, { as: 'city', foreignKey: 'cityId', constraints: false });
  Model.belongsTo(PostalCode, { as: 'postalCode', foreignKey: 'postalCodeId', constraints: false });
}

module.exports = {
  sequelize,
  Organization,
  Facility,
  Department,
  FacilityService,
  ServiceCategory,
  Service,
  Country,
  State,
  District,
  SubDistrict,
  City,
  PostalCode,
};
