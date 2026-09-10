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

  const facilityService = await call('POST', '/api/v1/organization-admin/facility-services', {
    token,
    body: { facilityId, departmentId, serviceName: 'General Consultation', serviceCategory: 'OUTPATIENT' },
  });
  assert.equal(facilityService.status, 201);
  assert.equal(facilityService.json.departmentId, departmentId);
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
