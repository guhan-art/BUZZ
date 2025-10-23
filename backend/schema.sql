CREATE DATABASE IF NOT EXISTS bus_tracking;
USE bus_tracking;

CREATE TABLE IF NOT EXISTS drivers (
  phone VARCHAR(20) PRIMARY KEY,
  bus_id VARCHAR(10) NOT NULL,
  is_active TINYINT(1) DEFAULT 1
);

-- sample drivers (phone -> bus id from your busData below)
INSERT INTO drivers (phone, bus_id, is_active) VALUES
('9994875901', '11', 1),
('9840948132', '12', 1),
('7358536800', '13', 1)
ON DUPLICATE KEY UPDATE bus_id=VALUES(bus_id), is_active=VALUES(is_active);