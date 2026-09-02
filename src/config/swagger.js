const swaggerJSDoc = require('swagger-jsdoc');

const BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:3100';
const NODE_ENV = process.env.NODE_ENV || 'development';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SP3 Digital Organization & Facility Master Data API',
      version: '1.0.0',
      description:
        'Manages the SP3 healthcare platform organization hierarchy: organizations (health networks/authorities), facilities (CHC/PHC/hospitals), departments and facility services. Identity and access for these resources is owned by identity-service; this service is authorization-only via JWT claims.',
      contact: {
        name: 'SP3 Digital Support',
        email: 'contact@sp3digital.com',
      },
    },
    servers: [
      {
        url: BASE_URL,
        description: NODE_ENV,
      },
    ],
    components: {
      responses: {
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'VALIDATION_ERROR' },
                      message: { type: 'string' },
                      details: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  error: {
                    type: 'object',
                    properties: {
                      code: { type: 'string', example: 'NOT_FOUND' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      schemas: {
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            totalItems: { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 3 },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
