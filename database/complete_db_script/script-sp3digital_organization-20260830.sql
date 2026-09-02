-- =====================================================================
-- SP3 Digital — Organization & Facility Master Data
-- Database: sp3digital_organization
--
-- Scope: "Minimum V1 Target" ORGANIZATION domain from Healthcare Vendor
-- RFPs.pdf — organizations, facilities, departments, facility_services.
--
-- IMPORTANT ARCHITECTURAL NOTE (mirrors identity-service's DDL notes):
-- This database intentionally has NO foreign keys pointing at
-- sp3digital_identity (e.g. no FK from any table here to `users`), and
-- identity's own `organizations_users` / `facilities_users` tables
-- likewise carry organization_id / facility_id as plain bigint unsigned
-- columns with NO FK back into this database. Each bounded context stays
-- independently deployable/scalable; cross-database relationships are
-- resolved at the application layer, not via SQL foreign keys.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- organizations
-- Health networks / authorities (State Health Dept, District Health
-- Authority, NHM-style networks, NGOs, private chains). Self-referencing
-- to model the Country -> State -> District -> Health Network hierarchy
-- described in the RFP.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `organizations`;
CREATE TABLE `organizations` (
  `organization_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `organization_uuid` char(36) NOT NULL,
  `tenant_uuid` char(36) NOT NULL,
  `organization_code` varchar(100) NOT NULL,
  `organization_name` varchar(200) NOT NULL,
  `organization_type` varchar(50) DEFAULT NULL,
  `parent_organization_id` bigint unsigned DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`organization_id`),
  UNIQUE KEY `uk_organizations_uuid` (`organization_uuid`),
  UNIQUE KEY `uk_organizations_code` (`organization_code`),
  KEY `idx_organizations_tenant` (`tenant_uuid`,`status`),
  KEY `idx_organizations_parent` (`parent_organization_id`),
  KEY `idx_organizations_name` (`organization_name`),
  CONSTRAINT `fk_organizations_parent` FOREIGN KEY (`parent_organization_id`) REFERENCES `organizations` (`organization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- facilities
-- CHC / PHC / district hospitals / clinics belonging to an organization.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `facilities`;
CREATE TABLE `facilities` (
  `facility_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `facility_uuid` char(36) NOT NULL,
  `organization_id` bigint unsigned NOT NULL,
  `facility_code` varchar(100) NOT NULL,
  `facility_name` varchar(200) NOT NULL,
  `facility_type` varchar(50) DEFAULT NULL,
  `address_line1` varchar(255) DEFAULT NULL,
  `address_line2` varchar(255) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state_name` varchar(100) DEFAULT NULL,
  `district_name` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'India',
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `phone_number` varchar(30) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`facility_id`),
  UNIQUE KEY `uk_facilities_uuid` (`facility_uuid`),
  UNIQUE KEY `uk_facilities_code` (`facility_code`),
  KEY `idx_facilities_organization` (`organization_id`,`status`),
  KEY `idx_facilities_name` (`facility_name`),
  KEY `idx_facilities_type` (`facility_type`),
  CONSTRAINT `fk_facilities_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`organization_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- departments
-- OPD / IPD / Lab / Pharmacy / Radiology etc. within a facility.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
  `department_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `department_uuid` char(36) NOT NULL,
  `facility_id` bigint unsigned NOT NULL,
  `department_code` varchar(100) NOT NULL,
  `department_name` varchar(150) NOT NULL,
  `department_type` varchar(50) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`department_id`),
  UNIQUE KEY `uk_departments_uuid` (`department_uuid`),
  UNIQUE KEY `uk_facility_department_code` (`facility_id`,`department_code`),
  KEY `idx_departments_facility` (`facility_id`,`status`),
  KEY `idx_departments_type` (`department_type`),
  CONSTRAINT `fk_departments_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ---------------------------------------------------------------------
-- facility_services
-- Services offered at a facility (optionally scoped to a department) —
-- e.g. Teleconsultation, Immunization, Diagnostic Lab, Maternal Health.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `facility_services`;
CREATE TABLE `facility_services` (
  `facility_service_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `facility_id` bigint unsigned NOT NULL,
  `department_id` bigint unsigned DEFAULT NULL,
  `service_code` varchar(100) NOT NULL,
  `service_name` varchar(200) NOT NULL,
  `service_category` varchar(50) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'ACTIVE',
  `created_by` bigint unsigned DEFAULT NULL,
  `created_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `modified_by` bigint unsigned DEFAULT NULL,
  `modified_on` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`facility_service_id`),
  UNIQUE KEY `uk_facility_service_code` (`facility_id`,`service_code`),
  KEY `idx_facility_services_facility` (`facility_id`,`status`),
  KEY `idx_facility_services_department` (`department_id`),
  KEY `idx_facility_services_category` (`service_category`),
  CONSTRAINT `fk_facility_services_facility` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`facility_id`),
  CONSTRAINT `fk_facility_services_department` FOREIGN KEY (`department_id`) REFERENCES `departments` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;
