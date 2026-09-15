const geographyService = require('../services/geographyService');

// One controller for all six geography dropdown/lookup endpoints — see
// geographyService.js for why this is consolidated rather than split
// per-entity like the rest of the codebase's resources.
class GeographyController {
  listCountries = async (req, res, next) => {
    try {
      const result = await geographyService.listCountries({ search: req.query.search });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  listStates = async (req, res, next) => {
    try {
      const result = await geographyService.listStates({
        countryId: req.query.countryId,
        search: req.query.search,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  listDistricts = async (req, res, next) => {
    try {
      const result = await geographyService.listDistricts({
        stateId: req.query.stateId,
        search: req.query.search,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  listSubDistricts = async (req, res, next) => {
    try {
      const result = await geographyService.listSubDistricts({
        districtId: req.query.districtId,
        search: req.query.search,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  listCities = async (req, res, next) => {
    try {
      const result = await geographyService.listCities({
        subDistrictId: req.query.subDistrictId,
        search: req.query.search,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  listPostalCodesByCity = async (req, res, next) => {
    try {
      const result = await geographyService.listPostalCodesByCity({ cityId: req.query.cityId });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  searchPostalCodes = async (req, res, next) => {
    try {
      const result = await geographyService.searchPostalCodes({
        query: req.query.query,
        limit: req.query.limit,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new GeographyController();
