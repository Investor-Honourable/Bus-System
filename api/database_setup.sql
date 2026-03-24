-- Bus Management Database Setup
-- Run this SQL to create the necessary tables for authentication

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS bus_system;
USE bus_system;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    gender ENUM('male', 'female', 'other') NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'driver', 'passenger') DEFAULT 'passenger',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Passengers table
CREATE TABLE IF NOT EXISTS passengers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    phone VARCHAR(20),
    gender ENUM('male', 'female', 'other') NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sample admin user (password: admin123)
INSERT INTO users (name, username, email, phone, gender, password, role) 
VALUES ('Admin', 'admin', 'admin@camtransit.com', '237600000000', 'male', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE email = email;

-- Sample driver user (password: driver123)
INSERT INTO users (name, username, email, phone, gender, password, role) 
VALUES ('John Driver', 'jdriver', 'driver@camtransit.com', '237600000001', 'male', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver')
ON DUPLICATE KEY UPDATE email = email;

-- Sample passenger user (password: passenger123)
INSERT INTO users (name, username, email, phone, gender, password, role) 
VALUES ('Alice Passenger', 'apassenger', 'passenger@camtransit.com', '237600000002', 'female', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'passenger')
ON DUPLICATE KEY UPDATE email = email;

-- User Settings Table
CREATE TABLE IF NOT EXISTS user_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    email_notifications TINYINT(1) DEFAULT 1,
    sms_notifications TINYINT(1) DEFAULT 1,
    booking_confirmations TINYINT(1) DEFAULT 1,
    trip_reminders TINYINT(1) DEFAULT 1,
    promotions TINYINT(1) DEFAULT 0,
    two_factor_enabled TINYINT(1) DEFAULT 0,
    language VARCHAR(10) DEFAULT 'en',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('mobile_money', 'card') NOT NULL,
    provider VARCHAR(50),
    account_number VARCHAR(50),
    is_default TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password Reset Tokens Table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id)
);

-- Login Activity Table
CREATE TABLE IF NOT EXISTS login_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device VARCHAR(255),
    location VARCHAR(255),
    ip_address VARCHAR(45),
    is_current TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default settings for existing users
INSERT INTO user_settings (user_id)
SELECT id FROM users WHERE role = 'passenger' AND id NOT IN (SELECT user_id FROM user_settings)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Drivers table (additional driver-specific information)
CREATE TABLE IF NOT EXISTS drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    license_number VARCHAR(50) UNIQUE,
    license_expiry DATE,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    assigned_bus_id INT,
    assigned_route_id INT,
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_trips INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert driver records for existing driver users
INSERT INTO drivers (user_id, license_number, license_expiry, status)
SELECT id, CONCAT('DL', LPAD(id, 8, '0')), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active'
FROM users WHERE role = 'driver' AND id NOT IN (SELECT user_id FROM drivers)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;
