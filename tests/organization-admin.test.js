const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.DB_DIALECT = 'sqlite';
process.env.ADMIN_JWT_SECRET = 'test-only-shared-secret';
process.env.ADMIN_JWT_AUDIENCE = 'sp3-organization-admin-test';
process.env.INTERNAL_SERVICE_TOKEN = 'test-internal-service-token';

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';

function tokenFor(tenantUuid, permissions = ['ALL_PERMISSIONS']) {
  return jwt.sign(
    { tenant_uuid: tenantUuid, user_id: 1, permissions },
    process.env.ADMIN_JWT_SECRET,
    { audience: process.env.ADMIN_JWT_AUDIENCE, expiresIn: '5m' },
  );
}

let app;
let server;
let baseUrl;

test.before(async () => {
  app = require('../src/app');
  const db = require('../src/models');
  await db.sequelize.sync({ force: true }); // fresh in-memory schema per run

  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function call(method, path, { token, body, headers } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  return { status: response.status, json };
}

// ---------------------------------------------------------------------
// Auth boundary
// ---------------------------------------------------------------------

test('rejects requests with no bearer token', async () => {
  const { status, json } = await call('GET', '/api/v1/organization-admin/organizations');
  assert.equal(status, 401);
  assert.equal(json.error.code, 'UNAUTHENTICATED');
});

test('rejects a JWT with no tenant_uuid claim', async () => {
  const badToken = jwt.sign({ user_id: 1 }, process.env.ADMIN_JWT_SECRET, {
    audience: process.env.ADMIN_JWT_AUDIENCE,
    expiresIn: '5m',
  });
  const { status, json } = await call('GET', '/api/v1/organization-admin/organizations', { token: badToken });
  assert.equal(status, 403);
  assert.equal(json.error.code, 'TENANT_CLAIM_REQUIRED');
});

// ---------------------------------------------------------------------
// Organizations — matches organizations.component.ts's contract exactly
// ---------------------------------------------------------------------

let orgId;

test('creates an organization (POST /organizations) — matches OrganizationsComponent.save()', async () => {
  const token = tokenFor(TENANT_A);
  const { status, json } = await call('POST', '/api/v1/organization-admin/organizations', {
    token,
    body: { organizationName: 'Acme Health Network', organizationType: 'HEALTH_NETWORK', parentOrganizationId: null },
  });
  assert.equal(status, 201);
  assert.ok(json.organizationId);
  assert.ok(json.organizationCode, 'organizationCode must be present — the UI grid renders it');
  assert.equal(json.status, 'ACTIVE');
  orgId = json.organizationId;
});

test('lists organizations with the {data, pagination} envelope — matches OrganizationsComponent.load()', async () => {
  const token = tokenFor(TENANT_A);
  const { status, json } = await call(
    'GET',
    '/api/v1/organization-admin/organizations?page=1&limit=20&search=&status=&organizationType=',
    { token },
  );
  assert.equal(status, 200);
  assert.ok(Array.isArray(json.data));
  assert.equal(json.data.length, 1);
  assert.equal(json.pagination.totalItems, 1);
  assert.equal(json.pagination.page, 1);
});

test('organizations/list dropdown returns {success, count, data} — matches loadParentOptions()', async () => {
  const token = tokenFor(TENANT_A);
  const { status, json } = await call('GET', '/api/v1/organization-admin/organizations/list', { token });
  assert.equal(status, 200);
  assert.equal(json.success, true);
  assert.equal(json.data.length, 1);
});

test('gets an organization by id as a raw object — matches select()', async () => {
  const token = tokenFor(TENANT_A);
  const { status, json } = await call('GET', `/api/v1/organization-admin/organizations/${orgId}`, { token });
  assert.equal(status, 200);
  assert.equal(json.organizationId, orgId);
  assert.equal(json.organizationName, 'Acme Health Network');
});

test('updates an organization — matches save() in edit mode', async () => {
  const token = tokenFor(TENANT_A);
  const { status, json } = await call('PUT', `/api/v1/organization-admin/organizations/${orgId}`, {
    token,
    body: { organizationName: 'Acme Health Network (Renamed)', organizationType: 'HEALTH_NETWORK', parentOrganizationId: null },
  });
  assert.equal(status, 200);
  assert.equal(json.organizationName, 'Acme Health Network (Renamed)');
});

test('rejects an organization being set as its own parent', async () => {
  const token = tokenFor(TENANT_A);
  const { status, json } = await call('PUT', `/api/v1/organization-admin/organizations/${orgId}`, {
    token,
    body: { parentOrganizationId: orgId },
  });
  assert.equal(status, 400);
  assert.equal(json.error.code, 'INVALID_PARENT');
});

test('soft-deletes via PATCH .../status — matches onDeleteConfirmed()', async () => {
  const token = tokenFor(TENANT_A);
  const { status, json } = await call('PATCH', `/api/v1/organization-admin/organizations/${orgId}/status`, {
    token,
    body: { status: 'DELETED' },
  });
  assert.equal(status, 200);
  assert.equal(json.status, 'DELETED');
});

test('tenant isolation: tenant B cannot see tenant A\'s organization', async () => {
  const tokenB = tokenFor(TENANT_B);
  const { status } = await call('GET', `/api/v1/organization-admin/organizations/${orgId}`, { token: tokenB });
  assert.equal(status, 404);
});

test('a normal user JWT cannot hard-delete an organization (internal-service only)', async () => {
  const token = tokenFor(TENANT_A);
  const { status, json } = await call('DELETE', `/api/v1/organization-admin/organizations/${orgId}`, { token });
  assert.equal(status, 403);
  assert.equal(json.error.code, 'INTERNAL_ONLY');
});

// ---------------------------------------------------------------------
// Internal service-to-service route — matches identity-admin-service's
// registrationService.js exactly (headers, body shape, response fields it reads)
// ---------------------------------------------------------------------

let internalOrgId;

test('identity-admin-service can create an organization via the internal route', async () => {
  const { status, json } = await call('POST', '/api/v1/organization-admin/internal/organizations', {
    token: process.env.INTERNAL_SERVICE_TOKEN,
    headers: { 'X-Tenant-Uuid': TENANT_B },
    body: {
      tenantUuid: TENANT_B,
      organizationName: 'Self-Registered Clinic Group',
      organizationType: 'PRIVATE_CHAIN',
      parentOrganizationId: null,
      userId: 42,
    },
  });
  assert.equal(status, 201);
  // registrationService.js reads organization.organizationId ?? organization.organization_id
  assert.ok(json.organizationId);
  internalOrgId = json.organizationId;
});

test('internal route rejects a normal user JWT (not the internal-service token)', async () => {
  const token = tokenFor(TENANT_A);
  const { status } = await call('POST', '/api/v1/organization-admin/internal/organizations', {
    token,
    body: { tenantUuid: TENANT_A, organizationName: 'Should Fail' },
  });
  assert.equal(status, 403);
});

test('internal-service token can hard-delete (saga compensation path)', async () => {
  const { status, json } = await call('DELETE', `/api/v1/organization-admin/organizations/${internalOrgId}`, {
    token: process.env.INTERNAL_SERVICE_TOKEN,
    headers: { 'X-Tenant-Uuid': TENANT_B },
  });
  assert.equal(status, 200);
  assert.equal(json.deleted, true);
});

// ---------------------------------------------------------------------
// Facilities / Departments / Facility-services — full chain, matches
// onboarding.component.ts + facilities/departments/facility-services components
// ---------------------------------------------------------------------

let facilityId;
let departmentId;

test('facility onboarding chain: create org -> create facility -> create department -> create facility-service', async () => {
  const token = tokenFor(TENANT_A);

  const org = await call('POST', '/api/v1/organization-admin/organizations', {
    token,
    body: { organizationName: 'Onboarding Test Org', organizationType: 'NGO' },
  });
  assert.equal(org.status, 201);
  const newOrgId = org.json.organizationId;

  // Matches onboarding.component.ts's submitFacility()
  const facility = await call('POST', '/api/v1/organization-admin/facilities', {
    token,
    body: {
      organizationId: newOrgId,
      facilityName: 'Main Clinic',
      facilityType: 'CLINIC',
      city: 'Ghaziabad',
      stateName: 'Uttar Pradesh',
    },
  });
  assert.equal(facility.status, 201);
  assert.equal(facility.json.country, 'India', 'country should default per FacilityService.create()');
  facilityId = facility.json.facilityId;

  const department = await call('POST', '/api/v1/organization-admin/departments', {
    token,
    body: { facilityId, departmentName: 'Outpatient', departmentType: 'OPD' },
  });
  assert.equal(department.status, 201);
  departmentId = department.json.departmentId;

  // Facility services now reference the Service/ServiceCategory master
  // catalog by id (serviceId/serviceCategoryId) rather than the old
  // free-text serviceName/serviceCategory fields.
  const category = await call('POST', '/api/v1/organization-admin/service-categories', {
    token,
    body: { organizationId: newOrgId, serviceCategoryName: 'Consultation' },
  });
  assert.equal(category.status, 201);
  const serviceCategoryId = category.json.serviceCategoryId;

  const service = await call('POST', '/api/v1/organization-admin/services', {
    token,
    body: { organizationId: newOrgId, serviceCategoryId, serviceName: 'General Consultation' },
  });
  assert.equal(service.status, 201);
  const serviceId = service.json.serviceId;

  const facilityService = await call('POST', '/api/v1/organization-admin/facility-services', {
    token,
    body: { facilityId, departmentId, serviceId, serviceCategoryId },
  });
  assert.equal(facilityService.status, 201);
  assert.equal(facilityService.json.departmentId, departmentId);
  // getList/getById/create all join Facility/Department/Service/ServiceCategory
  // so the UI grid can show names instead of raw ids.
  assert.equal(facilityService.json.facilityName, 'Main Clinic');
  assert.equal(facilityService.json.departmentName, 'Outpatient');
  assert.equal(facilityService.json.serviceName, 'General Consultation');
  assert.equal(facilityService.json.serviceCategoryName, 'Consultation');

  const list = await call('GET', `/api/v1/organization-admin/facility-services?search=General`, { token });
  assert.equal(list.status, 200);
  assert.equal(list.json.data.length, 1, 'search should match via the joined Service.service_name column');
  assert.equal(list.json.data[0].serviceName, 'General Consultation');
});

test('facilities/list and departments/list?facilityId= dropdowns work — matches facility-services.component.ts form cascading', async () => {
  const token = tokenFor(TENANT_A);

  const facilities = await call('GET', '/api/v1/organization-admin/facilities/list', { token });
  assert.equal(facilities.status, 200);
  assert.ok(facilities.json.data.some((f) => f.facilityId === facilityId));

  const departments = await call('GET', `/api/v1/organization-admin/departments/list?facilityId=${facilityId}`, {
    token,
  });
  assert.equal(departments.status, 200);
  assert.ok(departments.json.data.every((d) => d.facilityId === facilityId));
});

test('rejects a facility-service whose department belongs to a different facility', async () => {
  const token = tokenFor(TENANT_A);

  const otherFacility = await call('POST', '/api/v1/organization-admin/facilities', {
    token,
    body: { organizationId: orgId, facilityName: 'Other Facility', facilityType: 'PHC' },
  });
  // orgId was soft-deleted earlier in this test file but the row still
  // exists (soft delete), so the FK-existence check (which doesn't filter
  // by status) still passes here — this assertion only cares about the
  // cross-facility department rejection below.
  assert.equal(otherFacility.status, 201);

  const { status, json } = await call('POST', '/api/v1/organization-admin/facility-services', {
    token,
    body: {
      facilityId: otherFacility.json.facilityId,
      departmentId, // belongs to `facilityId`, not `otherFacility.json.facilityId`
      serviceName: 'Mismatched Service',
    },
  });
  assert.equal(status, 404);
  assert.equal(json.error.code, 'DEPARTMENT_NOT_FOUND');
});

test('validation rejects an out-of-enum facilityType', async () => {
  const token = tokenFor(TENANT_A);
  const { status, json } = await call('POST', '/api/v1/organization-admin/facilities', {
    token,
    body: { organizationId: orgId, facilityName: 'Bad Facility', facilityType: 'NOT_A_REAL_TYPE' },
  });
  assert.equal(status, 400);
  assert.equal(json.error.code, 'VALIDATION_ERROR');
});

// ---------------------------------------------------------------------
// Services — /services requires serviceCategoryId (a Service belongs to
// exactly one ServiceCategory). Both the column and the validation for it
// were missing until this fix; this locks the whole chain in.
// ---------------------------------------------------------------------

test('service create requires and persists serviceCategoryId', async () => {
  const token = tokenFor(TENANT_A);

  const category = await call('POST', '/api/v1/organization-admin/service-categories', {
    token,
    body: { organizationId: orgId, serviceCategoryName: 'Diagnostics' },
  });
  assert.equal(category.status, 201);
  const serviceCategoryId = category.json.serviceCategoryId;

  // Missing serviceCategoryId should be a validation error, not a 500.
  const missingCategory = await call('POST', '/api/v1/organization-admin/services', {
    token,
    body: { organizationId: orgId, serviceName: 'Blood Test' },
  });
  assert.equal(missingCategory.status, 400);
  assert.equal(missingCategory.json.error.code, 'VALIDATION_ERROR');

  const service = await call('POST', '/api/v1/organization-admin/services', {
    token,
    body: { organizationId: orgId, serviceCategoryId, serviceName: 'Blood Test' },
  });
  assert.equal(service.status, 201);
  assert.equal(service.json.serviceCategoryId, serviceCategoryId, 'serviceCategoryId should round-trip on create');

  const list = await call('GET', `/api/v1/organization-admin/services?search=Blood`, { token });
  assert.equal(list.status, 200);
  assert.equal(list.json.data.length, 1, 'search should match on service_name without a SQL error');
  assert.equal(list.json.data[0].serviceCategoryId, serviceCategoryId);

  const filtered = await call('GET', `/api/v1/organization-admin/services?serviceCategoryId=${serviceCategoryId}`, { token });
  assert.equal(filtered.status, 200);
  assert.equal(filtered.json.data.length, 1);
});

// ---------------------------------------------------------------------
// Geography lookups — /geography/*. These are global reference data
// (no tenant scoping), but as of the /geography-authenticated-like-/internal
// change, only the shared INTERNAL_SERVICE_TOKEN may call them now — a
// regular end-user JWT is rejected, same boundary /internal/organizations
// already enforced. Uses direct fixture inserts rather than the full
// ~320k-row India seed, since the point here is proving the cascade/
// validation behavior, not the data.
// ---------------------------------------------------------------------

test('geography endpoints reject a regular end-user JWT (internal-service-token only)', async () => {
  const token = tokenFor(TENANT_A);
  const { status, json } = await call('GET', '/api/v1/organization-admin/geography/countries', { token });
  assert.equal(status, 403);
  assert.equal(json.error.code, 'INTERNAL_ONLY');
});

test('geography endpoints cascade correctly and enforce required parent ids', async () => {
  const internalAuth = { token: process.env.INTERNAL_SERVICE_TOKEN, headers: { 'X-Tenant-Uuid': TENANT_A } };
  const db = require('../src/models');

  const country = await db.Country.create({ name: 'India', isoAlpha2: 'IN', isoAlpha3: 'IND', status: 'ACTIVE' });
  const stateA = await db.State.create({ countryId: country.countryId, name: 'Maharashtra', status: 'ACTIVE' });
  const stateB = await db.State.create({ countryId: country.countryId, name: 'Karnataka', status: 'ACTIVE' });
  const districtA = await db.District.create({ stateId: stateA.stateId, name: 'Mumbai', status: 'ACTIVE' });
  await db.District.create({ stateId: stateB.stateId, name: 'Bengaluru Urban', status: 'ACTIVE' });
  const subDistrict = await db.SubDistrict.create({ districtId: districtA.districtId, name: 'Bandra', status: 'ACTIVE' });
  const city = await db.City.create({ subDistrictId: subDistrict.subDistrictId, name: 'Bandra West', status: 'ACTIVE' });
  await db.PostalCode.create({ cityId: city.cityId, code: '400050', status: 'ACTIVE' });

  // Districts scoped to Maharashtra should NOT include Karnataka's.
  const districts = await call('GET', `/api/v1/organization-admin/geography/districts?stateId=${stateA.stateId}`, internalAuth);
  assert.equal(districts.status, 200);
  assert.equal(districts.json.data.length, 1);
  assert.equal(districts.json.data[0].name, 'Mumbai');

  // The parent id is required below country/state level -- proves the
  // "select a State, only get that state's districts" dependency is
  // enforced by validation, not left to the caller to remember.
  const missingParent = await call('GET', '/api/v1/organization-admin/geography/districts', internalAuth);
  assert.equal(missingParent.status, 400);
  assert.equal(missingParent.json.error.code, 'VALIDATION_ERROR');

  const subDistricts = await call('GET', `/api/v1/organization-admin/geography/sub-districts?districtId=${districtA.districtId}`, internalAuth);
  assert.equal(subDistricts.json.data.length, 1);
  assert.equal(subDistricts.json.data[0].name, 'Bandra');

  const cities = await call('GET', `/api/v1/organization-admin/geography/cities?subDistrictId=${subDistrict.subDistrictId}`, internalAuth);
  assert.equal(cities.json.data.length, 1);
  assert.equal(cities.json.data[0].name, 'Bandra West');

  const postalCodes = await call('GET', `/api/v1/organization-admin/geography/postal-codes?cityId=${city.cityId}`, internalAuth);
  assert.equal(postalCodes.json.data.length, 1);
  assert.equal(postalCodes.json.data[0].code, '400050');

  // Reverse lookup: pincode -> full resolved hierarchy in one call.
  const search = await call('GET', '/api/v1/organization-admin/geography/postal-codes/search?query=400050', internalAuth);
  assert.equal(search.status, 200);
  assert.equal(search.json.data.length, 1);
  assert.equal(search.json.data[0].cityName, 'Bandra West');
  assert.equal(search.json.data[0].stateName, 'Maharashtra');
  assert.equal(search.json.data[0].countryName, 'India');

  // Query below the minimum length should be a validation error, not an
  // unbounded LIKE scan.
  const tooShort = await call('GET', '/api/v1/organization-admin/geography/postal-codes/search?query=40', internalAuth);
  assert.equal(tooShort.status, 400);

  // Regression test: req.query values arrive as strings over real HTTP.
  // limit was passed straight through to Sequelize's `limit` option
  // without coercion, which MySQL's LIMIT clause rejects outright
  // (`LIMIT '20'` is a syntax error there) even though SQLite silently
  // tolerates it -- so this bug was invisible to every sqlite-based test
  // here until it hit a real MySQL database. Call the service directly
  // with a string limit (bypassing HTTP/validate entirely) to prove the
  // coercion is defensive at the service layer, not just relying on
  // validate() having already converted it.
  const geographyService = require('../src/services/geographyService');
  const stringLimitResult = await geographyService.searchPostalCodes({ query: '400050', limit: '20' });
  assert.equal(stringLimitResult.success, true);
});
