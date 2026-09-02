# sp3digital-organization-admin-service

Organization & Facility Master Data service for the SP3 Digital healthcare
platform. Owns the **ORGANIZATION** bounded context from the platform's
data architecture:

- `organizations` — health networks/authorities (State Health Dept,
  District Health Authority, NHM-style networks, NGOs, private chains),
  self-referencing to model the Country → State → District → Health
  Network hierarchy.
- `facilities` — CHC / PHC / District Hospital / Clinic belonging to an
  organization.
- `departments` — OPD / IPD / Lab / Pharmacy / Radiology etc. within a
  facility.
- `facility_services` — services offered at a facility (Teleconsultation,
  Immunization, Diagnostic, Maternal Health, ...), optionally scoped to a
  department.

This is the **Minimum V1 Target** scope for the Organization domain, as
defined in the Healthcare Vendor RFPs architecture notes. Deferred for
later: full Country/State/District geo-hierarchy tables, operating hours,
holiday calendars, healthcare programs.

## Relationship to identity-service

Identity, authentication and authorization are **not** owned here — they
live in [`sp3digital-identity-admin-service`](https://github.com/sanjaysingh-2015/sp3digital-identity-admin-service).
This service:

- Verifies bearer tokens issued by identity-service (JWKS or shared
  secret — same verification logic as identity-service's own
  `middleware/authentication.js`).
- Authorizes using the `permissions` / `scope` claims embedded in that
  token (`organization-admin:read` / `organization-admin:write`), **not**
  by querying identity's Users/Roles/Permissions tables. Organization and
  identity are separate bounded contexts / separate databases with no
  cross-DB foreign keys, per the platform's architecture decision to keep
  each domain independently deployable and scalable.
- Uses `organization_id` / `facility_id` as plain `bigint unsigned`
  columns — the same type identity-service's `organizations_users` /
  `facilities_users` tables already use for their (FK-less)
  `organization_id` / `facility_id` columns, so the two services can be
  joined at the application layer without a type mismatch.

## Stack

Node.js + Express 5 + Sequelize + MySQL — same stack and layering as
identity-service (`controller → service → model`, hand-rolled Joi-free
validation classes, Swagger via `swagger-jsdoc`, soft-delete via a
`status` column rather than row deletion).

## Getting started

```bash
cp .env.example .env
# edit .env: DB credentials + ADMIN_JWKS_URL pointing at identity-service

npm install
mysql -u root -p sp3digital_organization < database/complete_db_script/script-sp3digital_organization-20260830.sql

npm run dev
# Swagger UI: http://localhost:3100/docs
```

## API surface

All routes are mounted under `/api/v1/organization-admin` and require a
bearer token:

| Resource | Base path |
|---|---|
| Organizations | `/api/v1/organization-admin/organizations` |
| Facilities | `/api/v1/organization-admin/facilities` |
| Departments | `/api/v1/organization-admin/departments` |
| Facility Services | `/api/v1/organization-admin/facility-services` |

Each resource exposes the same CRUD + lifecycle shape:

- `GET /` — paginated list (filterable)
- `GET /list` — unpaginated ACTIVE list, for dropdowns
- `GET /:id` — get by id
- `POST /` — create
- `PUT /:id` — update
- `DELETE /:id` — soft delete (sets `status = DELETED`)
- `PATCH /:id/status` — dedicated status transition endpoint

## Tests

```bash
npm test
```
