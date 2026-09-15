const express = require('express');
const router = express.Router();

const controller = require('../controllers/geographyController');
const { validate } = require('../middleware/validate');
const {
  listCountriesQuerySchema,
  listStatesQuerySchema,
  listDistrictsQuerySchema,
  listSubDistrictsQuerySchema,
  listCitiesQuerySchema,
  listPostalCodesQuerySchema,
  searchPostalCodesQuerySchema,
} = require('../validations/geography.validation');

// Route paths are relative to /api/v1/organization-admin/geography.
// Read-only lookup/dropdown endpoints against global reference data —
// no tenant scoping, no create/update/delete. See geographyService.js
// for why these six entities are consolidated into one service/
// controller/routes file instead of the usual one-file-per-entity split.

/**
 * @swagger
 * /geography/countries:
 *   get:
 *     tags: [Geography]
 *     summary: List countries (dropdown)
 *     parameters:
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Countries.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/Country' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/countries', validate(listCountriesQuerySchema, 'query'), controller.listCountries);

/**
 * @swagger
 * /geography/states:
 *   get:
 *     tags: [Geography]
 *     summary: List states, optionally filtered by country (dropdown)
 *     parameters:
 *       - name: countryId
 *         in: query
 *         schema: { type: integer }
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: States.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/State' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/states', validate(listStatesQuerySchema, 'query'), controller.listStates);

/**
 * @swagger
 * /geography/districts:
 *   get:
 *     tags: [Geography]
 *     summary: List districts of a state (dropdown) — stateId is required, this is a cascading lookup
 *     parameters:
 *       - name: stateId
 *         in: query
 *         required: true
 *         schema: { type: integer }
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Districts in the given state.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/District' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/districts', validate(listDistrictsQuerySchema, 'query'), controller.listDistricts);

/**
 * @swagger
 * /geography/sub-districts:
 *   get:
 *     tags: [Geography]
 *     summary: List sub-districts (taluk/tehsil) of a district (dropdown) — districtId is required
 *     parameters:
 *       - name: districtId
 *         in: query
 *         required: true
 *         schema: { type: integer }
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Sub-districts in the given district.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/SubDistrict' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/sub-districts', validate(listSubDistrictsQuerySchema, 'query'), controller.listSubDistricts);

/**
 * @swagger
 * /geography/cities:
 *   get:
 *     tags: [Geography]
 *     summary: List cities/villages of a sub-district (dropdown) — subDistrictId is required
 *     parameters:
 *       - name: subDistrictId
 *         in: query
 *         required: true
 *         schema: { type: integer }
 *       - name: search
 *         in: query
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Cities/villages in the given sub-district.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/City' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/cities', validate(listCitiesQuerySchema, 'query'), controller.listCities);

/**
 * @swagger
 * /geography/postal-codes:
 *   get:
 *     tags: [Geography]
 *     summary: List postal codes of a city (dropdown) — cityId is required
 *     parameters:
 *       - name: cityId
 *         in: query
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Postal codes for the given city.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/PostalCode' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/postal-codes', validate(listPostalCodesQuerySchema, 'query'), controller.listPostalCodesByCity);

/**
 * @swagger
 * /geography/postal-codes/search:
 *   get:
 *     tags: [Geography]
 *     summary: Reverse lookup by (partial) pincode — the opposite direction from the cascading dropdowns above
 *     description: >
 *       Powers "type a pincode, auto-fill city/district/state" address
 *       entry. Prefix-matches `query` against postal codes and returns
 *       each match with its full resolved hierarchy already joined in,
 *       so the UI doesn't need four follow-up lookups per result.
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         description: At least 3 digits.
 *         schema: { type: string, minLength: 3, maxLength: 10 }
 *       - name: limit
 *         in: query
 *         schema: { type: integer, minimum: 1, maximum: 50, default: 20 }
 *     responses:
 *       200:
 *         description: Matching postal codes with resolved city/sub-district/district/state/country names.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 count: { type: integer }
 *                 data:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/PostalCodeSearchResult' }
 *       400: { $ref: '#/components/responses/ValidationError' }
 *       401: { $ref: '#/components/responses/Unauthenticated' }
 */
router.get('/postal-codes/search', validate(searchPostalCodesQuerySchema, 'query'), controller.searchPostalCodes);

module.exports = router;
