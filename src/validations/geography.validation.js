const { Joi } = require('../middleware/validate');

// All of these are dropdown/lookup queries against global reference data —
// no tenant scoping, no create/update/delete, just filtered reads. The
// parent id is REQUIRED below the country level: without it you'd be
// asking for all 631 districts, or all ~154k cities, in one response,
// which defeats the point of a cascading dropdown and is a real
// performance hazard. Countries/states are small enough (249 / 36 rows)
// to allow browsing without a parent filter.

const listCountriesQuerySchema = Joi.object({
  search: Joi.string().trim().max(100).allow('').optional(),
});

const listStatesQuerySchema = Joi.object({
  countryId: Joi.number().integer().positive().optional(),
  search: Joi.string().trim().max(100).allow('').optional(),
});

const listDistrictsQuerySchema = Joi.object({
  stateId: Joi.number().integer().positive().optional(),
  search: Joi.string().trim().max(100).allow('').optional(),
});

const listSubDistrictsQuerySchema = Joi.object({
  districtId: Joi.number().integer().positive().required(),
  search: Joi.string().trim().max(100).allow('').optional(),
});

const listCitiesQuerySchema = Joi.object({
  subDistrictId: Joi.number().integer().positive().required(),
  search: Joi.string().trim().max(100).allow('').optional(),
});

const listPostalCodesQuerySchema = Joi.object({
  cityId: Joi.number().integer().positive().required(),
});

const searchPostalCodesQuerySchema = Joi.object({
  // Prefix search, e.g. typing a pincode as the user enters it. Minimum
  // 3 digits so a 1-2 character query can't trigger a huge partial-index
  // scan across ~155k postal codes.
  query: Joi.string().trim().min(3).max(10).required(),
  limit: Joi.number().integer().positive().max(50).default(20).optional(),
});

module.exports = {
  listCountriesQuerySchema,
  listStatesQuerySchema,
  listDistrictsQuerySchema,
  listSubDistrictsQuerySchema,
  listCitiesQuerySchema,
  listPostalCodesQuerySchema,
  searchPostalCodesQuerySchema,
};
