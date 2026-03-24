CREATE DATABASE IF NOT EXISTS projet_synthese;
USE projet_synthese;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_blocked BOOLEAN DEFAULT FALSE
);

-- Test user: email='test@example.com', password='123' (bcrypt $2b$10$...)
INSERT INTO users (name, email, password, role) VALUES 
('Test User', 'test@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE name=name;
