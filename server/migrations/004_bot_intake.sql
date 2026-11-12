CREATE TABLE lead_numbers (number BIGINT AUTO_INCREMENT PRIMARY KEY, lead_id CHAR(32) NOT NULL UNIQUE, FOREIGN KEY (lead_id) REFERENCES leads(id)) ENGINE=InnoDB;
INSERT INTO lead_numbers (lead_id) SELECT id FROM leads ORDER BY created_at,id;
CREATE TABLE bot_drafts (actor_id BIGINT PRIMARY KEY, nonce CHAR(16) NOT NULL, stage VARCHAR(20) NOT NULL, service VARCHAR(24) NULL, consent_at DATETIME NULL, lead_id CHAR(32) NULL, updated_at DATETIME NOT NULL) ENGINE=InnoDB;
