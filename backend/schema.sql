CREATE DATABASE IF NOT EXISTS bus_tracking;
USE bus_tracking;

CREATE TABLE IF NOT EXISTS Driver (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  busId INT NOT NULL,
  FOREIGN KEY (busId) REFERENCES Bus(id) ON DELETE CASCADE,
  INDEX (busId)
);

-- sample drivers (phone -> busId matches auto-incremented Bus IDs)
-- Bus 11 = id 1, Bus 33 = id 2, Bus 33B = id 3
INSERT INTO Driver (phone, busId, isActive) VALUES
('9994875901', 1, 1),
('9840948132', 2, 1),
('7358536800', 3, 1)
ON DUPLICATE KEY UPDATE busId=VALUES(busId), isActive=VALUES(isActive);