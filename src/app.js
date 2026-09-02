// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const swaggerUi = require('swagger-ui-express');
// const swaggerSpec = require('./config/swagger');
// const db = require('./models'); // Imports index.js which loads all models & sequelize
// const { authenticate, authorize } = require('./middleware/authentication');
// const organizationController = require('./controllers/organizationController');

// const app = express();

// // ALLOWED_ORIGINS: comma-separated list, e.g.
// //   ALLOWED_ORIGINS=https://admin.sp3digital.com,https://staging-admin.sp3digital.com
// // Falls back to allowing all origins ONLY when unset, so local dev keeps working
// // without extra setup — but every real environment must set this explicitly.
// const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
//   .split(',')
//   .map((origin) => origin.trim())
//   .filter(Boolean);

// app.use(helmet());
// app.use(cors(
//   allowedOrigins.length
//     ? {
//         origin: allowedOrigins,
//         credentials: true,
//       }
//     : undefined // no ALLOWED_ORIGINS set -> permissive default, dev-only
// ));
// app.use(express.json());

// app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// // Lightweight liveness probe, unauthenticated (useful for load balancers / k8s).
// app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
// app.post('/api/v1/organization-admin/organizations', organizationController.createOrganization)
// const authorizeOrgAdminRequest = (req, res, next) => {
//   const permission = req.method === 'GET' || req.method === 'HEAD'
//     ? 'organization-admin:read'
//     : 'organization-admin:write';
//   return authorize(permission)(req, res, next);
// };

// // Every route below requires a bearer token issued by identity-service, plus
// // the appropriate organization-admin:read / organization-admin:write claim.
// app.use('/api/v1/organization-admin', authenticate, authorizeOrgAdminRequest);

// app.use('/api/v1/organization-admin/organizations', require('./routes/organizationRoutes'));
// app.use('/api/v1/organization-admin/facilities', require('./routes/facilityRoutes'));
// app.use('/api/v1/organization-admin/departments', require('./routes/departmentRoutes'));
// app.use('/api/v1/organization-admin/facility-services', require('./routes/facilityServiceRoutes'));

// app.use((req, res) => {
//   res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
// });

// app.use((error, req, res, next) => {
//   if (res.headersSent) return next(error);

//   if (error.isJoi) {
//     return res.status(400).json({
//       error: {
//         code: 'VALIDATION_ERROR',
//         message: 'Request validation failed',
//         details: error.details.map((detail) => detail.message)
//       }
//     });
//   }

//   if (error.name === 'ValidationError' || error.name === 'ConflictError') {
//     return res.status(error.statusCode || 400).json({
//       error: {
//         code: error.name === 'ConflictError' ? 'CONFLICT' : 'VALIDATION_ERROR',
//         message: error.message,
//         details: error.details || []
//       }
//     });
//   }

//   console.error(error);
//   return res.status(error.statusCode || 500).json({
//     error: {
//       code: error.code || 'INTERNAL_ERROR',
//       message: error.expose ? error.message : 'An unexpected error occurred'
//     }
//   });
// });

// const PORT = process.env.PORT || 3100;

// // Initialize Database and Start App
// async function startServer() {
//   try {
//     await db.sequelize.authenticate();
//     console.log('MySQL Connection established successfully via Sequelize.');

//     // Sync database models
//     await db.sequelize.sync({ alter: false });
//     console.log('Sequelize Models synchronized with Database.');

//     app.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//       console.log(`Swagger documentation available at http://localhost:${PORT}/docs`);
//     });
//   } catch (error) {
//     console.error(error);
//     console.error('Unable to connect to MySQL database:', error.message);
//   }
// }

// startServer();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const db = require('./models'); // Imports index.js which loads all models & sequelize
const { authenticate, authorizeOrgAdminRequest, authenticateInternalService } = require('./middleware/authentication');
const organizationController = require('./controllers/organizationController');

const app = express();

// ALLOWED_ORIGINS: comma-separated list, e.g.
//   ALLOWED_ORIGINS=https://admin.sp3digital.com,https://staging-admin.sp3digital.com
// Falls back to allowing all origins ONLY when unset, so local dev keeps working
// without extra setup — but every real environment must set this explicitly.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(cors(
  allowedOrigins.length
    ? {
        origin: allowedOrigins,
        credentials: true,
      }
    : undefined // no ALLOWED_ORIGINS set -> permissive default, dev-only
));
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Lightweight liveness probe, unauthenticated (useful for load balancers / k8s).
app.get('/healthz', (req, res) => res.status(200).json({ status: 'ok' }));
// Server-to-server only (e.g. identity-admin-service's self-registration
// flow, creating the first organization for a brand-new tenant before any
// user/JWT exists yet). Gated by a shared secret, NOT a user token — see
// authenticateInternalService. Deliberately a different path from
// POST /api/v1/organization-admin/organizations so it never shadows the
// normal authenticated create-organization route below.
app.post(
  '/api/v1/organization-admin/internal/organizations',
  authenticateInternalService,
  organizationController.createOrganization,
);

// Every route below requires a bearer token issued by identity-service, plus
// the appropriate resource-scoped ORGANIZATION-ADMIN:<RESOURCE>:<ACTION> claim.
app.use('/api/v1/organization-admin', authenticate, authorizeOrgAdminRequest);

app.use('/api/v1/organization-admin/organizations', require('./routes/organizationRoutes'));
app.use('/api/v1/organization-admin/facilities', require('./routes/facilityRoutes'));
app.use('/api/v1/organization-admin/departments', require('./routes/departmentRoutes'));
app.use('/api/v1/organization-admin/facility-services', require('./routes/facilityServiceRoutes'));

app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.isJoi) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.details.map((detail) => detail.message)
      }
    });
  }

  if (error.name === 'ValidationError' || error.name === 'ConflictError') {
    return res.status(error.statusCode || 400).json({
      error: {
        code: error.name === 'ConflictError' ? 'CONFLICT' : 'VALIDATION_ERROR',
        message: error.message,
        details: error.details || []
      }
    });
  }

  console.error(error);
  return res.status(error.statusCode || 500).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.expose ? error.message : 'An unexpected error occurred'
    }
  });
});

const PORT = process.env.PORT || 3100;

// Initialize Database and Start App
async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('MySQL Connection established successfully via Sequelize.');

    // Sync database models
    await db.sequelize.sync({ alter: false });
    console.log('Sequelize Models synchronized with Database.');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger documentation available at http://localhost:${PORT}/docs`);
    });
  } catch (error) {
    console.error(error);
    console.error('Unable to connect to MySQL database:', error.message);
  }
}

startServer();
