require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = require('./config/swagger');
const db = require('./models');
const { authenticate } = require('./middleware/authentication');

const organizationRoutes = require('./routes/organizationRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const facilityServiceCatalogRoutes = require('./routes/facilityServiceCatalogRoutes');
const serviceCategoryRoutes = require('./routes/serviceCategoryRoutes');
const internalRoutes = require('./routes/internalRoutes');

const app = express();

// Swagger UI serves its own inline <script>/<style> tags, which the
// strict default CSP set by `app.use(helmet())` below would block.
// Registering this BEFORE the global helmet() means, for requests under
// /docs, this relaxed config runs (and responds) first — the stricter
// global one below never gets a chance to add its CSP header for these
// two routes. Every other route is unaffected and still gets full helmet
// defaults.
app.use('/docs', helmet({ contentSecurityPolicy: false }), swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'SP3 Digital — Organization Admin Service API Docs',
}));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

// ALLOWED_ORIGINS: comma-separated list, e.g.
//   ALLOWED_ORIGINS=http://localhost:4200,https://org-admin.sp3digital.com
// Falls back to allowing all origins ONLY when unset, so local dev keeps
// working without extra setup — every real environment must set this.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet());
app.use(
  cors(
    allowedOrigins.length
      ? { origin: allowedOrigins, credentials: true }
      : undefined, // no ALLOWED_ORIGINS set -> permissive default, dev-only
  ),
);
app.use(express.json());

// General API rate limiting. Separate from identity-admin-service's
// per-login limiter — there's no login endpoint here, but an
// authenticated caller (or a leaked/compromised token) hammering list
// endpoints is still worth capping.
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

const basePath = '/api/v1/organization-admin';

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Liveness check
 *     security: []
 *     responses:
 *       200:
 *         description: Service is up.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: string, example: ok }
 */
app.get(`${basePath}/health`, (req, res) => res.status(200).json({ status: 'ok' }));

// Every route past this point requires a valid bearer token — either a
// real identity-admin-service-issued user JWT, or the shared
// INTERNAL_SERVICE_TOKEN (see authentication.js). No public/unauthenticated
// route exists in this service the way identity-admin-service has
// /auth/login and /public/register-organization — there's nothing here
// that needs to work before a user or the identity service is authenticated.
app.use(basePath, apiRateLimiter, authenticate);

app.use(`${basePath}/organizations`, organizationRoutes);
app.use(`${basePath}/facilities`, facilityRoutes);
app.use(`${basePath}/departments`, departmentRoutes);
app.use(`${basePath}/facility-services`, facilityServiceCatalogRoutes);
app.use(`${basePath}/service-categories`, serviceCategoryRoutes);
app.use(`${basePath}/internal`, internalRoutes);

// Same error envelope shape as identity-admin-service, so
// organization-admin-ui's error.message handling (see notificationModal
// usage across its feature components) behaves identically either way.
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error.isJoi) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.details.map((detail) => detail.message),
      },
    });
  }

  // Only log unexpected (5xx) failures — expected 4xx rejections (bad
  // input, missing auth, not-found, tenant mismatch) are normal traffic,
  // not incidents, and logging every one of them buries real errors.
  if (!error.statusCode || error.statusCode >= 500) {
    console.error(error);
  }
  return res.status(error.statusCode || 500).json({
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.expose ? error.message : 'An unexpected error occurred',
    },
  });
});

const PORT = process.env.PORT || 3100;

async function startServer() {
  try {
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');

    await db.sequelize.sync({ alter: false });
    console.log('Sequelize models synchronized with database.');

    app.listen(PORT, () => {
      console.log(`sp3digital-organization-admin-service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start organization-admin-service:', error);
  }
}

// Only auto-start when run directly (`node src/app.js` / `npm start`).
// When required from a test (`require('../src/app')`), the caller gets
// the configured `app` instance without a live server or DB connection
// being started as a side effect of `require` — same pattern as the
// identity-admin-service app.js fix from Phase 0.
if (require.main === module) {
  startServer();
}

module.exports = app;
