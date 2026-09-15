// Single consolidated service for all geography dropdown/lookup data —
// Country, State, District, SubDistrict, City, PostalCode. Unlike every
// other resource in this codebase, these are read-only lookups against
// global (non-tenant-scoped) reference data, not a full CRUD resource, so
// one file covering all six makes more sense here than the usual
// one-file-per-entity split.
const { Op } = require('sequelize');
const { Country, State, District, SubDistrict, City, PostalCode } = require('../models');

function searchWhere(search) {
  return search ? { name: { [Op.like]: `%${search}%` } } : {};
}

function toCountry(row) {
  const p = row.get ? row.get({ plain: true }) : row;
  return { countryId: p.countryId, name: p.name, isoAlpha2: p.isoAlpha2, isoAlpha3: p.isoAlpha3, status: p.status };
}

function toState(row) {
  const p = row.get ? row.get({ plain: true }) : row;
  return { stateId: p.stateId, countryId: p.countryId, name: p.name, status: p.status };
}

function toDistrict(row) {
  const p = row.get ? row.get({ plain: true }) : row;
  return { districtId: p.districtId, stateId: p.stateId, name: p.name, status: p.status };
}

function toSubDistrict(row) {
  const p = row.get ? row.get({ plain: true }) : row;
  return { subDistrictId: p.subDistrictId, districtId: p.districtId, name: p.name, status: p.status };
}

function toCity(row) {
  const p = row.get ? row.get({ plain: true }) : row;
  return { cityId: p.cityId, subDistrictId: p.subDistrictId, name: p.name, status: p.status };
}

function toPostalCode(row) {
  const p = row.get ? row.get({ plain: true }) : row;
  return { postalCodeId: p.postalCodeId, cityId: p.cityId, code: p.code, status: p.status };
}

class GeographyService {
  async listCountries({ search } = {}) {
    const rows = await Country.findAll({
      where: { status: 'ACTIVE', ...searchWhere(search) },
      order: [['name', 'ASC']],
    });
    return { success: true, count: rows.length, data: rows.map(toCountry) };
  }

  async listStates({ countryId, search } = {}) {
    const where = { status: 'ACTIVE', ...searchWhere(search) };
    if (countryId) where.countryId = countryId;
    const rows = await State.findAll({ where, order: [['name', 'ASC']] });
    return { success: true, count: rows.length, data: rows.map(toState) };
  }

  // Required countryId is enforced by validation before this runs — see
  // geography.validation.js's comment on why the parent id isn't optional
  // below the country level.
  async listDistricts({ stateId, search }) {
    const where = { status: 'ACTIVE', stateId, ...searchWhere(search) };
    const rows = await District.findAll({ where, order: [['name', 'ASC']] });
    return { success: true, count: rows.length, data: rows.map(toDistrict) };
  }

  async listSubDistricts({ districtId, search }) {
    const where = { status: 'ACTIVE', districtId, ...searchWhere(search) };
    const rows = await SubDistrict.findAll({ where, order: [['name', 'ASC']] });
    return { success: true, count: rows.length, data: rows.map(toSubDistrict) };
  }

  async listCities({ subDistrictId, search }) {
    const where = { status: 'ACTIVE', subDistrictId, ...searchWhere(search) };
    const rows = await City.findAll({ where, order: [['name', 'ASC']] });
    return { success: true, count: rows.length, data: rows.map(toCity) };
  }

  async listPostalCodesByCity({ cityId }) {
    const rows = await PostalCode.findAll({
      where: { status: 'ACTIVE', cityId },
      order: [['code', 'ASC']],
    });
    return { success: true, count: rows.length, data: rows.map(toPostalCode) };
  }

  // Reverse lookup: given a (partial) pincode, return matches with the
  // full resolved hierarchy attached — this is what powers "type a
  // pincode, auto-fill city/district/state" address entry, the opposite
  // direction from the cascading dropdowns above.
  async searchPostalCodes({ query, limit = 20 }) {
    const rows = await PostalCode.findAll({
      where: { status: 'ACTIVE', code: { [Op.like]: `${query}%` } },
      order: [['code', 'ASC']],
      limit,
      include: [
        {
          model: City,
          attributes: ['cityId', 'name'],
          include: [
            {
              model: SubDistrict,
              attributes: ['subDistrictId', 'name'],
              include: [
                {
                  model: District,
                  attributes: ['districtId', 'name'],
                  include: [
                    {
                      model: State,
                      attributes: ['stateId', 'name'],
                      include: [{ model: Country, attributes: ['countryId', 'name'] }],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });

    const data = rows.map((row) => {
      const p = row.get({ plain: true });
      const city = p.City || {};
      const subDistrict = city.SubDistrict || {};
      const district = subDistrict.District || {};
      const state = district.State || {};
      const country = state.Country || {};
      return {
        postalCodeId: p.postalCodeId,
        code: p.code,
        cityId: city.cityId,
        cityName: city.name,
        subDistrictId: subDistrict.subDistrictId,
        subDistrictName: subDistrict.name,
        districtId: district.districtId,
        districtName: district.name,
        stateId: state.stateId,
        stateName: state.name,
        countryId: country.countryId,
        countryName: country.name,
      };
    });

    return { success: true, count: data.length, data };
  }
}

module.exports = new GeographyService();
