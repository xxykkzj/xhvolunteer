-- Phase 9.1: Add hierarchical structure to departments table
ALTER TABLE departments 
  ADD COLUMN parentId BIGINT DEFAULT NULL AFTER name,
  ADD COLUMN level INT NOT NULL DEFAULT 1 AFTER parentId,
  ADD COLUMN fullPath VARCHAR(255) DEFAULT NULL AFTER level,
  ADD COLUMN displayOrder INT DEFAULT 0 AFTER fullPath,
  ADD COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt;

-- Phase 9.2: Create badges table
CREATE TABLE IF NOT EXISTS badges (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  iconUrl VARCHAR(255),
  category ENUM('service_hours', 'engagement_duration', 'special') NOT NULL,
  autoGrantRule JSON,
  displayOrder INT DEFAULT 0,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Phase 9.2: Create user_badges table
CREATE TABLE IF NOT EXISTS user_badges (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  userId BIGINT NOT NULL,
  badgeId BIGINT NOT NULL,
  grantedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  grantedBy BIGINT DEFAULT NULL,
  expiresAt DATETIME DEFAULT NULL,
  metadata JSON,
  revokedAt DATETIME DEFAULT NULL,
  revokedBy BIGINT DEFAULT NULL,
  revokeReason VARCHAR(255),
  UNIQUE KEY uniqueUserBadge (userId, badgeId),
  INDEX idx_user_badges (userId, revokedAt)
);

-- Phase 9.3: Add historical tracking fields to engagements table
ALTER TABLE engagements
  ADD COLUMN effectiveFrom DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER endDate,
  ADD COLUMN effectiveUntil DATETIME DEFAULT NULL AFTER effectiveFrom,
  ADD COLUMN replacedBy BIGINT DEFAULT NULL AFTER effectiveUntil,
  ADD COLUMN changeReason VARCHAR(255) AFTER replacedBy,
  ADD INDEX idx_engagement_effective (userId, effectiveUntil);

-- Update allowPointsOnPaidHours default to true (both volunteers and temple workers earn points)
ALTER TABLE engagements
  MODIFY COLUMN allowPointsOnPaidHours BOOLEAN NOT NULL DEFAULT TRUE;

-- Phase 9.4: Add requiredBadges field to rewards table
ALTER TABLE rewards
  ADD COLUMN requiredBadges JSON DEFAULT NULL AFTER requireJoyBadge;
