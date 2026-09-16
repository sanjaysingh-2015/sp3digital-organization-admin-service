-- =====================================================================
-- Incremental migration: 2026-09-16
--
-- Adds:
--   1. `sub_district_name` to `facilities` (the pincode-search API in
--      geographyService.js already resolves sub-district, but the
--      facilities table had nowhere to store it).
--   2. Full address columns to `organizations` (previously had none at
--      all) -- same shape as `facilities`, so the same address-picker
--      component can be reused for both.
--
-- Run this against an existing database instead of re-running the full
-- script-sp3digital_organization-*.sql (which drops and recreates every
-- table, losing data). The full script has also been updated to include
-- these columns for fresh installs.
--
-- MySQL 8.0.29+ required for `ADD COLUMN IF NOT EXISTS`.
-- =====================================================================

USE `sp3digital_organization`;

ALTER TABLE `facilities`
  ADD COLUMN IF NOT EXISTS `sub_district_name` varchar(100) DEFAULT NULL AFTER `city`;

ALTER TABLE `organizations`
  ADD COLUMN IF NOT EXISTS `address_line1` varchar(255) DEFAULT NULL AFTER `parent_organization_id`,
  ADD COLUMN IF NOT EXISTS `address_line2` varchar(255) DEFAULT NULL AFTER `address_line1`,
  ADD COLUMN IF NOT EXISTS `city` varchar(100) DEFAULT NULL AFTER `address_line2`,
  ADD COLUMN IF NOT EXISTS `sub_district_name` varchar(100) DEFAULT NULL AFTER `city`,
  ADD COLUMN IF NOT EXISTS `district_name` varchar(100) DEFAULT NULL AFTER `sub_district_name`,
  ADD COLUMN IF NOT EXISTS `state_name` varchar(100) DEFAULT NULL AFTER `district_name`,
  ADD COLUMN IF NOT EXISTS `postal_code` varchar(20) DEFAULT NULL AFTER `state_name`,
  ADD COLUMN IF NOT EXISTS `country` varchar(100) DEFAULT 'India' AFTER `postal_code`,
  ADD COLUMN IF NOT EXISTS `latitude` decimal(10,7) DEFAULT NULL AFTER `country`,
  ADD COLUMN IF NOT EXISTS `longitude` decimal(10,7) DEFAULT NULL AFTER `latitude`;
