#!/usr/bin/env node
/**
 * Seeds the global geography reference tables (countries, states,
 * districts, sub_districts, cities, postal_codes) from the CSVs in
 * seed-data/india-geo/.
 *
 * These tables are NOT tenant-scoped — they're shared reference data
 * across every tenant, seeded once per environment, not per-tenant
 * onboarding data.
 *
 * Source data & provenance (see seed-data/india-geo/README.md for the
 * full writeup):
 *   - countries.csv: ISO 3166-1, all 249 current entries.
 *   - states/districts/sub_districts/cities/postal_codes.csv: derived
 *     from India Post's "All India Pincode Directory" (via data.gov.in,
 *     Government Open Data License – India), as mirrored at
 *     https://github.com/saravanakumargn/All-India-Pincode-Directory.
 *     That source is dated Jan 2017; two known post-2017 administrative
 *     reorganizations were manually corrected during import (see the
 *     README) but subtler district-level boundary changes since 2017
 *     were NOT reconciled — treat district/sub-district names as a
 *     good starting point, not a guaranteed-current source of truth.
 *
 * Usage:
 *   node scripts/seed-india-geo.js
 *
 * Idempotent: safe to re-run. Existing rows for a given natural key
 * (ISO code for countries, name+parent for everything else) are left
 * alone rather than duplicated; this does not currently update rows
 * that already exist (delete-and-reseed manually if you need that).
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const db = require('../src/models');

const DATA_DIR = path.join(__dirname, '..', 'seed-data', 'india-geo');
const BATCH_SIZE = 2000;

function readCsv(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, { columns: true, skip_empty_lines: true });
}

async function bulkInsertInBatches(model, rows, label) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await model.bulkCreate(batch, { ignoreDuplicates: true });
    inserted += batch.length;
    process.stdout.write(`\r  ${label}: ${inserted}/${rows.length}`);
  }
  process.stdout.write('\n');
}

async function seedCountries() {
  const rows = readCsv('countries.csv');
  const existing = await db.Country.count();
  if (existing > 0) {
    console.log(`countries: ${existing} rows already present, skipping (delete them first to reseed)`);
    return;
  }
  const payload = rows.map((r) => ({
    countryId: Number(r.country_id),
    name: r.name,
    isoAlpha2: r.iso_alpha2,
    isoAlpha3: r.iso_alpha3,
    status: 'ACTIVE',
  }));
  await bulkInsertInBatches(db.Country, payload, 'countries');
}

async function seedStates() {
  const rows = readCsv('states.csv');
  const existing = await db.State.count();
  if (existing > 0) {
    console.log(`states: ${existing} rows already present, skipping`);
    return;
  }
  const payload = rows.map((r) => ({
    stateId: Number(r.state_id),
    countryId: Number(r.country_id),
    name: r.name,
    status: 'ACTIVE',
  }));
  await bulkInsertInBatches(db.State, payload, 'states');
}

async function seedDistricts() {
  const rows = readCsv('districts.csv');
  const existing = await db.District.count();
  if (existing > 0) {
    console.log(`districts: ${existing} rows already present, skipping`);
    return;
  }
  const payload = rows.map((r) => ({
    districtId: Number(r.district_id),
    stateId: Number(r.state_id),
    name: r.name,
    status: 'ACTIVE',
  }));
  await bulkInsertInBatches(db.District, payload, 'districts');
}

async function seedSubDistricts() {
  const rows = readCsv('sub_districts.csv');
  const existing = await db.SubDistrict.count();
  if (existing > 0) {
    console.log(`sub_districts: ${existing} rows already present, skipping`);
    return;
  }
  const payload = rows.map((r) => ({
    subDistrictId: Number(r.sub_district_id),
    districtId: Number(r.district_id),
    name: r.name,
    status: 'ACTIVE',
  }));
  await bulkInsertInBatches(db.SubDistrict, payload, 'sub_districts');
}

async function seedCities() {
  const rows = readCsv('cities.csv');
  const existing = await db.City.count();
  if (existing > 0) {
    console.log(`cities: ${existing} rows already present, skipping`);
    return;
  }
  const payload = rows.map((r) => ({
    cityId: Number(r.city_id),
    subDistrictId: Number(r.sub_district_id),
    name: r.name,
    rawOfficeName: r.raw_office_name,
    officeType: r.office_type,
    status: 'ACTIVE',
  }));
  await bulkInsertInBatches(db.City, payload, 'cities');
}

async function seedPostalCodes() {
  const rows = readCsv('postal_codes.csv');
  const existing = await db.PostalCode.count();
  if (existing > 0) {
    console.log(`postal_codes: ${existing} rows already present, skipping`);
    return;
  }
  const payload = rows.map((r) => ({
    postalCodeId: Number(r.postal_code_id),
    cityId: Number(r.city_id),
    code: r.code,
    status: 'ACTIVE',
  }));
  await bulkInsertInBatches(db.PostalCode, payload, 'postal_codes');
}

async function main() {
  console.log('Connecting and syncing geography tables (creates them if missing, leaves existing tables alone)...');
  // Only touch the new tables here -- do not risk altering unrelated
  // tables that may have out-of-band changes in a real environment.
  await db.Country.sync();
  await db.State.sync();
  await db.District.sync();
  await db.SubDistrict.sync();
  await db.City.sync();
  await db.PostalCode.sync();

  console.log('Seeding countries...');
  await seedCountries();
  console.log('Seeding states...');
  await seedStates();
  console.log('Seeding districts...');
  await seedDistricts();
  console.log('Seeding sub_districts...');
  await seedSubDistricts();
  console.log('Seeding cities (this is the large one, ~154k rows)...');
  await seedCities();
  console.log('Seeding postal_codes (~155k rows)...');
  await seedPostalCodes();

  console.log('Done.');
  await db.sequelize.close();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
