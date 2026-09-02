module.exports = (db) => {
  const {
    Organizations,
    Facilities,
    Departments,
    FacilityServices,
  } = db;

  // ==========================================
  // 1. ORGANIZATION HIERARCHY (self-referencing)
  // ==========================================
  if (Organizations) {
    Organizations.hasMany(Organizations, {
      foreignKey: 'parent_organization_id',
      as: 'childOrganizations',
    });
    Organizations.belongsTo(Organizations, {
      foreignKey: 'parent_organization_id',
      as: 'parentOrganization',
    });
  }

  // ==========================================
  // 2. ORGANIZATION -> FACILITIES
  // ==========================================
  if (Organizations && Facilities) {
    Organizations.hasMany(Facilities, { foreignKey: 'organization_id' });
    Facilities.belongsTo(Organizations, { foreignKey: 'organization_id' });
  }

  // ==========================================
  // 3. FACILITY -> DEPARTMENTS
  // ==========================================
  if (Facilities && Departments) {
    Facilities.hasMany(Departments, { foreignKey: 'facility_id' });
    Departments.belongsTo(Facilities, { foreignKey: 'facility_id' });
  }

  // ==========================================
  // 4. FACILITY / DEPARTMENT -> FACILITY SERVICES
  // ==========================================
  if (Facilities && FacilityServices) {
    Facilities.hasMany(FacilityServices, { foreignKey: 'facility_id' });
    FacilityServices.belongsTo(Facilities, { foreignKey: 'facility_id' });
  }
  if (Departments && FacilityServices) {
    Departments.hasMany(FacilityServices, { foreignKey: 'department_id' });
    FacilityServices.belongsTo(Departments, { foreignKey: 'department_id' });
  }

  // NOTE: There is intentionally NO association/FK from Facilities or
  // Organizations back to identity-service's users/organizations_users/
  // facilities_users tables — those live in a separate database
  // (sp3digital_identity). Per the platform's bounded-context design,
  // cross-database relationships are resolved at the application layer
  // (or via events), not via Sequelize associations or SQL foreign keys.
};
