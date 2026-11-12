-- Apply once after 001_mysql.sql; test installation only until Owner/Chief GO.
ALTER TABLE telegram_sessions DROP INDEX chat_id;
ALTER TABLE telegram_sessions ADD cancelled TINYINT NOT NULL DEFAULT 0;
ALTER TABLE leads ADD revision INT NOT NULL DEFAULT 0;
CREATE TABLE telegram_callbacks (callback_id VARCHAR(128) PRIMARY KEY, received_at DATETIME NOT NULL) ENGINE=InnoDB;
ALTER TABLE outbox ADD dedupe_key VARCHAR(160) NULL UNIQUE, ADD method VARCHAR(40) NOT NULL DEFAULT 'sendMessage', ADD lease_id CHAR(32) NULL, ADD lease_until DATETIME NULL;
CREATE INDEX outbox_due ON outbox(status,available_at);
CREATE INDEX telegram_chat ON telegram_sessions(chat_id);
CREATE TABLE request_limits (bucket CHAR(64) PRIMARY KEY, hits INT NOT NULL, expires_at DATETIME NOT NULL) ENGINE=InnoDB;
