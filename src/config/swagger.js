const swaggerJsdoc = require("swagger-jsdoc");

// Shared enum lists, kept in sync with the *.validation.js files so the
// docs never drift from what the API actually accepts.
const {
  ORGANIZATION_TYPES,
  STATUSES,
} = require("../validations/organization.validation");
const { FACILITY_TYPES } = require("../validations/facility.validation");
const { DEPARTMENT_TYPES } = require("../validations/department.validation");

const basePath = "/api/v1/organization-admin";

const paginationSchema = {
  type: "object",
  properties: {
    page: { type: "integer", example: 1 },
    limit: { type: "integer", example: 20 },
    totalItems: { type: "integer", example: 42 },
    totalPages: { type: "integer", example: 3 },
  },
};

const errorSchema = {
  type: "object",
  properties: {
    error: {
      type: "object",
      properties: {
        code: { type: "string", example: "VALIDATION_ERROR" },
        message: { type: "string", example: "Request validation failed" },
        details: {
          type: "array",
          items: { type: "string" },
          example: ['"organizationName" is required'],
        },
      },
    },
  },
};

const auditFields = {
  createdOn: { type: "string", format: "date-time" },
  modifiedOn: { type: "string", format: "date-time" },
};
const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "SP3 Digital — Organization Admin Service API",
      version: "1.0.0",
      description:
        "Organization & Facility Master Data service for the SP3 Digital healthcare " +
        "platform. Manages organizations, facilities, departments, service categories " +
        "and facility services.\n\n" +
        "Every route below `" +
        basePath +
        "` (other than `/health`) requires a bearer " +
        "token: either an end-user JWT issued by sp3digital-identity-admin-service, or " +
        "the shared internal-service token for service-to-service calls.",
    },
    servers: [
      { url: basePath, description: "Base path for all resource routes" },
    ],
    tags: [
      {
        name: "Health",
        description: "Service liveness check (no auth required)",
      },
      {
        name: "Organizations",
        description: "Health networks / authorities — top of the org hierarchy",
      },
      {
        name: "Facilities",
        description:
          "CHC / PHC / District Hospital / Clinic, belonging to an organization",
      },
      {
        name: "Departments",
        description: "OPD / IPD / Lab / Pharmacy / etc., within a facility",
      },
      {
        name: "Facility Services",
        description:
          "Services offered at a facility, optionally scoped to a department",
      },
      {
        name: "Service Categories",
        description:
          "Categories used to classify facility services, scoped to an organization",
      },
      {
        name: "Services",
        description:
          "Catalog of services an organization can offer, each under one service category",
      },
      {
        name: "Geography",
        description:
          "Read-only country/state/district/sub-district/city/postal-code lookups for address dropdowns",
      },
      {
        name: "Internal",
        description:
          "Service-to-service routes callable only with the internal service token",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Either a JWT issued by identity-admin-service, or the shared " +
            "INTERNAL_SERVICE_TOKEN. Internal-service calls must also send " +
            "an `X-Tenant-Uuid` header.",
        },
      },
      parameters: {
        XTenantUuid: {
          name: "X-Tenant-Uuid",
          in: "header",
          required: false,
          description:
            "Required only when authenticating with the shared internal-service token.",
          schema: { type: "string", format: "uuid" },
        },
        PageParam: {
          name: "page",
          in: "query",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        LimitParam: {
          name: "limit",
          in: "query",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
        },
        SortByParam: {
          name: "sortBy",
          in: "query",
          schema: { type: "string", maxLength: 100 },
        },
        SortDirParam: {
          name: "sortDir",
          in: "query",
          schema: { type: "string", enum: ["ASC", "DESC"], default: "DESC" },
        },
        SearchParam: {
          name: "search",
          in: "query",
          description:
            "Free-text search, matched against the resource name (and code, where one exists).",
          schema: { type: "string", maxLength: 200 },
        },
        StatusFilterParam: {
          name: "status",
          in: "query",
          schema: { type: "string", enum: [...STATUSES] },
        },
      },
      schemas: {
        Error: errorSchema,
        Pagination: paginationSchema,
        StatusUpdateRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: [...STATUSES] },
          },
        },
        Organization: {
          type: "object",
          properties: {
            organizationId: { type: "integer", example: 101 },
            organizationUuid: { type: "string", format: "uuid" },
            tenantUuid: { type: "string", format: "uuid" },
            organizationName: {
              type: "string",
              example: "State Health Department",
            },
            organizationCode: {
              type: "string",
              example: "STATE-HEALTH-DEPARTMENT-9F3A1B2C",
            },
            organizationType: {
              type: "string",
              nullable: true,
              enum: [...ORGANIZATION_TYPES, null],
            },
            parentOrganizationId: { type: "integer", nullable: true },
            status: { type: "string", enum: [...STATUSES] },
            ...auditFields,
          },
        },
        OrganizationCreateRequest: {
          type: "object",
          required: ["organizationName"],
          properties: {
            organizationName: { type: "string", minLength: 2, maxLength: 200 },
            organizationType: {
              type: "string",
              nullable: true,
              enum: [...ORGANIZATION_TYPES, null],
            },
            parentOrganizationId: { type: "integer", nullable: true },
          },
        },
        OrganizationUpdateRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            organizationName: { type: "string", minLength: 2, maxLength: 200 },
            organizationType: {
              type: "string",
              nullable: true,
              enum: [...ORGANIZATION_TYPES, null],
            },
            parentOrganizationId: { type: "integer", nullable: true },
          },
        },
        InternalOrganizationCreateRequest: {
          type: "object",
          required: ["tenantUuid", "organizationName"],
          properties: {
            tenantUuid: { type: "string", format: "uuid" },
            organizationName: { type: "string", minLength: 2, maxLength: 200 },
            organizationType: {
              type: "string",
              nullable: true,
              enum: [...ORGANIZATION_TYPES, null],
            },
            parentOrganizationId: { type: "integer", nullable: true },
            userId: { type: "integer", nullable: true },
          },
        },
        Facility: {
          type: "object",
          properties: {
            facilityId: { type: "integer" },
            facilityUuid: { type: "string", format: "uuid" },
            tenantUuid: { type: "string", format: "uuid" },
            organizationId: { type: "integer" },
            facilityName: { type: "string" },
            facilityType: {
              type: "string",
              nullable: true,
              enum: [...FACILITY_TYPES, null],
            },
            addressLine1: { type: "string", nullable: true },
            addressLine2: { type: "string", nullable: true },
            city: { type: "string", nullable: true },
            stateName: { type: "string", nullable: true },
            districtName: { type: "string", nullable: true },
            postalCode: { type: "string", nullable: true },
            country: { type: "string", nullable: true, example: "India" },
            latitude: { type: "number", nullable: true, format: "float" },
            longitude: { type: "number", nullable: true, format: "float" },
            phoneNumber: { type: "string", nullable: true },
            email: { type: "string", nullable: true, format: "email" },
            status: { type: "string", enum: [...STATUSES] },
            ...auditFields,
          },
        },
        FacilityCreateRequest: {
          type: "object",
          required: ["organizationId", "facilityName"],
          properties: {
            organizationId: { type: "integer" },
            facilityName: { type: "string", minLength: 2, maxLength: 200 },
            facilityType: {
              type: "string",
              nullable: true,
              enum: [...FACILITY_TYPES, null],
            },
            addressLine1: { type: "string", nullable: true, maxLength: 250 },
            addressLine2: { type: "string", nullable: true, maxLength: 250 },
            city: { type: "string", nullable: true, maxLength: 100 },
            stateName: { type: "string", nullable: true, maxLength: 100 },
            districtName: { type: "string", nullable: true, maxLength: 100 },
            postalCode: { type: "string", nullable: true, maxLength: 20 },
            country: { type: "string", nullable: true, maxLength: 100 },
            latitude: {
              type: "number",
              nullable: true,
              minimum: -90,
              maximum: 90,
            },
            longitude: {
              type: "number",
              nullable: true,
              minimum: -180,
              maximum: 180,
            },
            phoneNumber: { type: "string", nullable: true, maxLength: 30 },
            email: {
              type: "string",
              nullable: true,
              format: "email",
              maxLength: 320,
            },
          },
        },
        FacilityUpdateRequest: {
          allOf: [{ $ref: "#/components/schemas/FacilityCreateRequest" }],
          minProperties: 1,
          required: [],
        },
        Department: {
          type: "object",
          properties: {
            departmentId: { type: "integer" },
            departmentUuid: { type: "string", format: "uuid" },
            tenantUuid: { type: "string", format: "uuid" },
            facilityId: { type: "integer" },
            departmentName: { type: "string" },
            departmentType: {
              type: "string",
              nullable: true,
              enum: [...DEPARTMENT_TYPES, null],
            },
            status: { type: "string", enum: [...STATUSES] },
            ...auditFields,
          },
        },
        DepartmentCreateRequest: {
          type: "object",
          required: ["facilityId", "departmentName"],
          properties: {
            facilityId: { type: "integer" },
            departmentName: { type: "string", minLength: 2, maxLength: 200 },
            departmentType: {
              type: "string",
              nullable: true,
              enum: [...DEPARTMENT_TYPES, null],
            },
          },
        },
        DepartmentUpdateRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            facilityId: { type: "integer" },
            departmentName: { type: "string", minLength: 2, maxLength: 200 },
            departmentType: {
              type: "string",
              nullable: true,
              enum: [...DEPARTMENT_TYPES, null],
            },
          },
        },
        FacilityServiceCatalog: {
          type: "object",
          properties: {
            facilityServiceId: { type: "integer" },
            facilityServiceUuid: { type: "string", format: "uuid" },
            tenantUuid: { type: "string", format: "uuid" },
            facilityId: { type: "integer" },
            facilityName: { type: "string", nullable: true },
            departmentId: { type: "integer", nullable: true },
            departmentName: { type: "string", nullable: true },
            serviceId: { type: "integer", nullable: true },
            serviceName: { type: "string", nullable: true },
            serviceCode: { type: "string", nullable: true },
            serviceCategoryId: { type: "integer" },
            serviceCategoryName: { type: "string", nullable: true },
            status: { type: "string", enum: [...STATUSES] },
            ...auditFields,
          },
        },
        FacilityServiceCreateRequest: {
          type: "object",
          required: ["facilityId", "serviceCategoryId"],
          properties: {
            facilityId: { type: "integer" },
            departmentId: { type: "integer", nullable: true },
            serviceId: { type: "integer", nullable: true },
            serviceCategoryId: { type: "integer" },
          },
        },
        FacilityServiceUpdateRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            facilityId: { type: "integer" },
            departmentId: { type: "integer", nullable: true },
            serviceId: { type: "integer", nullable: true },
            serviceCategoryId: { type: "integer" },
          },
        },
        ServiceCategory: {
          type: "object",
          properties: {
            serviceCategoryId: { type: "integer" },
            serviceCategoryUuid: { type: "string", format: "uuid" },
            tenantUuid: { type: "string", format: "uuid" },
            organizationId: { type: "integer" },
            serviceCategoryCode: { type: "string" },
            serviceCategoryName: { type: "string" },
            description: { type: "string", nullable: true },
            status: { type: "string", enum: [...STATUSES] },
            ...auditFields,
          },
        },
        ServiceCategoryCreateRequest: {
          type: "object",
          required: ["organizationId", "serviceCategoryName"],
          properties: {
            organizationId: { type: "integer" },
            serviceCategoryName: {
              type: "string",
              minLength: 2,
              maxLength: 200,
            },
            description: { type: "string", nullable: true, maxLength: 500 },
          },
        },
        ServiceCategoryUpdateRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            organizationId: { type: "integer" },
            serviceCategoryName: {
              type: "string",
              minLength: 2,
              maxLength: 200,
            },
            description: { type: "string", nullable: true, maxLength: 500 },
          },
        },
        Service: {
          type: "object",
          properties: {
            serviceId: { type: "integer" },
            serviceUuid: { type: "string", format: "uuid" },
            tenantUuid: { type: "string", format: "uuid" },
            organizationId: { type: "integer" },
            serviceCategoryId: { type: "integer" },
            serviceCode: { type: "string" },
            serviceName: { type: "string" },
            description: { type: "string", nullable: true },
            status: { type: "string", enum: [...STATUSES] },
            ...auditFields,
          },
        },
        ServiceCreateRequest: {
          type: "object",
          required: ["organizationId", "serviceCategoryId", "serviceName"],
          properties: {
            organizationId: { type: "integer" },
            serviceCategoryId: { type: "integer" },
            serviceName: {
              type: "string",
              minLength: 2,
              maxLength: 200,
            },
            description: { type: "string", nullable: true, maxLength: 500 },
          },
        },
        ServiceUpdateRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            organizationId: { type: "integer" },
            serviceCategoryId: { type: "integer" },
            serviceName: {
              type: "string",
              minLength: 2,
              maxLength: 200,
            },
            description: { type: "string", nullable: true, maxLength: 500 },
          },
        },
        Country: {
          type: "object",
          properties: {
            countryId: { type: "integer" },
            name: { type: "string" },
            isoAlpha2: { type: "string" },
            isoAlpha3: { type: "string" },
            status: { type: "string" },
          },
        },
        State: {
          type: "object",
          properties: {
            stateId: { type: "integer" },
            countryId: { type: "integer" },
            name: { type: "string" },
            status: { type: "string" },
          },
        },
        District: {
          type: "object",
          properties: {
            districtId: { type: "integer" },
            stateId: { type: "integer" },
            name: { type: "string" },
            status: { type: "string" },
          },
        },
        SubDistrict: {
          type: "object",
          properties: {
            subDistrictId: { type: "integer" },
            districtId: { type: "integer" },
            name: { type: "string" },
            status: { type: "string" },
          },
        },
        City: {
          type: "object",
          properties: {
            cityId: { type: "integer" },
            subDistrictId: { type: "integer" },
            name: { type: "string" },
            status: { type: "string" },
          },
        },
        PostalCode: {
          type: "object",
          properties: {
            postalCodeId: { type: "integer" },
            cityId: { type: "integer" },
            code: { type: "string" },
            status: { type: "string" },
          },
        },
        PostalCodeSearchResult: {
          type: "object",
          properties: {
            postalCodeId: { type: "integer" },
            code: { type: "string" },
            cityId: { type: "integer" },
            cityName: { type: "string" },
            subDistrictId: { type: "integer" },
            subDistrictName: { type: "string" },
            districtId: { type: "integer" },
            districtName: { type: "string" },
            stateId: { type: "integer" },
            stateName: { type: "string" },
            countryId: { type: "integer" },
            countryName: { type: "string" },
          },
        },
      },
      responses: {
        ValidationError: {
          description: "Request body or query failed Joi validation.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        Unauthenticated: {
          description: "Missing, malformed, or expired bearer token.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        Forbidden: {
          description:
            "Caller is authenticated but not allowed to perform this action.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
        NotFound: {
          description:
            "No resource with that id exists for the caller\u2019s tenant.",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Error" },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./src/routes/*.js"], // Path to route files containing JSDoc annotations
};

module.exports = swaggerJsdoc(options);
