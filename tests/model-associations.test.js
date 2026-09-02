const test = require('node:test');
const assert = require('node:assert/strict');

const db = require('../src/models');

test('organization domain models expose the associations used by services', () => {
  // Sequelize singularizes the default belongsTo() alias (Organization,
  // Facility, Department) while hasMany() keeps the plural model name.
  assert.ok(db.Organizations.associations.parentOrganization);
  assert.ok(db.Organizations.associations.childOrganizations);
  assert.ok(db.Facilities.associations.Organization);
  assert.ok(db.Organizations.associations.Facilities);
  assert.ok(db.Departments.associations.Facility);
  assert.ok(db.Facilities.associations.Departments);
  assert.ok(db.FacilityServices.associations.Facility);
  assert.ok(db.FacilityServices.associations.Department);
  assert.ok(db.Departments.associations.FacilityServices);
  assert.ok(db.Facilities.associations.FacilityServices);
});

test('every model uses unmanaged timestamps (status/created_on/modified_on columns instead)', () => {
  for (const modelName of ['Organizations', 'Facilities', 'Departments', 'FacilityServices']) {
    const model = db[modelName];
    assert.equal(model.options.timestamps, false, `${modelName} should not use Sequelize-managed timestamps`);
    assert.ok(model.rawAttributes.status, `${modelName} should have a status column`);
    assert.ok(model.rawAttributes.created_on, `${modelName} should have a created_on column`);
    assert.ok(model.rawAttributes.modified_on, `${modelName} should have a modified_on column`);
  }
});
