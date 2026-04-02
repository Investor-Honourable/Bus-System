-- =====================================================
-- CamTransit Bus Management System - Complete Database Schema
-- Version: 2.0
-- Description: Clean, normalized database schema for bus booking system
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS bus_system;
USE bus_system;

-- =====================================================
-- 1. USERS TABLE (Core user authentication)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    gender ENUM('male', 'female', 'other') NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'driver', 'passenger') DEFAULT 'passenger',
    avatar VARCHAR(500) NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. PASSENGERS TABLE (Passenger-specific information)
-- =====================================================
CREATE TABLE IF NOT EXISTS passengers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100),
    phone VARCHAR(20),
    gender ENUM('male', 'female', 'other') NULL,
    date_of_birth DATE NULL,
    address TEXT NULL,
    emergency_contact VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. DRIVERS TABLE (Driver-specific information)
-- =====================================================
CREATE TABLE IF NOT EXISTS drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    license_number VARCHAR(50) UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    license_type VARCHAR(50) DEFAULT 'Class B',
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    assigned_bus_id INT NULL,
    assigned_route_id INT NULL,
    rating DECIMAL(3,2) DEFAULT 5.00,
    total_trips INT DEFAULT 0,
    total_distance_km DECIMAL(10,2) DEFAULT 0.00,
    hire_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_license (license_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. BUSES TABLE (Bus fleet management)
-- =====================================================
CREATE TABLE IF NOT EXISTS buses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_number VARCHAR(20) UNIQUE NOT NULL,
    bus_name VARCHAR(100) NOT NULL,
    bus_type ENUM('standard', 'luxury', 'vip', 'minibus') DEFAULT 'standard',
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    amenities JSON NULL,
    license_plate VARCHAR(20) UNIQUE,
    model VARCHAR(100),
    year INT,
    color VARCHAR(50),
    status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
    last_maintenance DATE NULL,
    next_maintenance DATE NULL,
    mileage DECIMAL(10,2) DEFAULT 0.00,
    fuel_type ENUM('diesel', 'petrol', 'electric', 'hybrid') DEFAULT 'diesel',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bus_number (bus_number),
    INDEX idx_status (status),
    INDEX idx_type (bus_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. ROUTES TABLE (Route definitions)
-- =====================================================
CREATE TABLE IF NOT EXISTS routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_code VARCHAR(20) UNIQUE NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance_km DECIMAL(10,2) NOT NULL,
    duration_minutes INT NOT NULL,
    base_price DECIMAL(10,2) NOT NULL,
    description TEXT NULL,
    stops JSON NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_route_code (route_code),
    INDEX idx_origin (origin),
    INDEX idx_destination (destination),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. TRIPS TABLE (Scheduled trips)
-- =====================================================
CREATE TABLE IF NOT EXISTS trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bus_id INT NOT NULL,
    route_id INT NOT NULL,
    driver_id INT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    available_seats INT NOT NULL,
    booked_seats INT DEFAULT 0,
    status ENUM('scheduled', 'boarding', 'in_transit', 'completed', 'cancelled') DEFAULT 'scheduled',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
    INDEX idx_bus_id (bus_id),
    INDEX idx_route_id (route_id),
    INDEX idx_driver_id (driver_id),
    INDEX idx_departure_date (departure_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. BOOKINGS TABLE (Passenger bookings)
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    user_id INT NOT NULL,
    trip_id INT NOT NULL,
    passenger_name VARCHAR(255) NOT NULL,
    passenger_email VARCHAR(255),
    passenger_phone VARCHAR(20),
    seat_numbers JSON NULL,
    number_of_seats INT DEFAULT 1,
    total_price DECIMAL(10,2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'refunded', 'failed') DEFAULT 'pending',
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    booking_status ENUM('confirmed', 'cancelled', 'completed', 'no_show') DEFAULT 'confirmed',
    cancellation_reason TEXT NULL,
    cancelled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    INDEX idx_booking_reference (booking_reference),
    INDEX idx_user_id (user_id),
    INDEX idx_trip_id (trip_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_booking_status (booking_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. TICKETS TABLE (Digital tickets)
-- =====================================================
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_code VARCHAR(50) UNIQUE NOT NULL,
    booking_id INT NOT NULL,
    trip_id INT NOT NULL,
    user_id INT NOT NULL,
    seat_number VARCHAR(10),
    status ENUM('valid', 'used', 'cancelled', 'expired') DEFAULT 'valid',
    verified_at TIMESTAMP NULL,
    verified_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_ticket_code (ticket_code),
    INDEX idx_booking_id (booking_id),
    INDEX idx_trip_id (trip_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. NOTIFICATIONS TABLE (User notifications)
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('booking', 'cancellation', 'reminder', 'system', 'promotion', 'admin') DEFAULT 'system',
    reference_type VARCHAR(50),
    reference_id INT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. USER SETTINGS TABLE (User preferences)
-- =====================================================
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
    timezone VARCHAR(50) DEFAULT 'Africa/Douala',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_settings (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. PAYMENT METHODS TABLE (Saved payment methods)
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_methods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('mobile_money', 'card', 'bank_transfer') NOT NULL,
    provider VARCHAR(50),
    account_number VARCHAR(50),
    account_name VARCHAR(100),
    is_default TINYINT(1) DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. PASSWORD RESET TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. LOGIN ACTIVITY TABLE (Security audit)
-- =====================================================
CREATE TABLE IF NOT EXISTS login_activity (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device VARCHAR(255),
    browser VARCHAR(100),
    location VARCHAR(255),
    ip_address VARCHAR(45),
    is_current TINYINT(1) DEFAULT 0,
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_login_at (login_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 14. PAYMENTS TABLE (Payment transactions)
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_provider VARCHAR(50),
    transaction_id VARCHAR(100),
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_booking_id (booking_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_transaction_id (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 15. REVIEWS TABLE (Trip reviews)
-- =====================================================
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    user_id INT NOT NULL,
    trip_id INT NOT NULL,
    driver_id INT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
    INDEX idx_booking_id (booking_id),
    INDEX idx_user_id (user_id),
    INDEX idx_trip_id (trip_id),
    INDEX idx_driver_id (driver_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample users (passwords: admin123, driver123, passenger123)
INSERT INTO users (name, username, email, phone, gender, password, role) VALUES
('Admin User', 'admin', 'admin@camtransit.com', '237600000000', 'male', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('John Driver', 'johndriver', 'john.driver@camtransit.com', '237600000001', 'male', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver'),
('Alice Passenger', 'apassenger', 'passenger@camtransit.com', '237600000002', 'female', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'passenger'),
('Marie Driver', 'mariedriver', 'marie.driver@camtransit.com', '237600000003', 'female', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver'),
('Bob Passenger', 'bpassenger', 'bob.passenger@camtransit.com', '237600000004', 'male', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'passenger')
ON DUPLICATE KEY UPDATE email = email;

-- Insert passenger records
INSERT INTO passengers (user_id, name, username, phone, gender) VALUES
(3, 'Alice Passenger', 'apassenger', '237600000002', 'female'),
(5, 'Bob Passenger', 'bpassenger', '237600000004', 'male')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert driver records
INSERT INTO drivers (user_id, license_number, license_expiry, license_type, status, hire_date) VALUES
(2, 'DL00000001', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'Class B', 'active', DATE_SUB(CURDATE(), INTERVAL 2 YEAR)),
(4, 'DL00000002', DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'Class B', 'active', DATE_SUB(CURDATE(), INTERVAL 1 YEAR))
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert buses
INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, license_plate, model, year, color, status) VALUES
('BUS-001', 'CamTransit Express', 'luxury', 50, 50, '["WiFi", "AC", "USB", "Refreshments"]', 'CE-001-AA', 'Mercedes-Benz Tourismo', 2022, 'White', 'active'),
('BUS-002', 'City Liner', 'standard', 40, 40, '["AC", "WiFi"]', 'CE-002-BB', 'Toyota Coaster', 2021, 'Blue', 'active'),
('BUS-003', 'VIP Coach', 'vip', 20, 20, '["WiFi", "AC", "USB", "Refreshments", "Reclining Seats"]', 'CE-003-CC', 'Scania Touring', 2023, 'Black', 'active'),
('BUS-004', 'Economy Bus', 'standard', 45, 45, '["AC"]', 'CE-004-DD', 'Hyundai County', 2020, 'Green', 'active'),
('BUS-005', 'Mini Transit', 'minibus', 15, 15, '["AC", "WiFi"]', 'CE-005-EE', 'Toyota Hiace', 2022, 'Silver', 'active')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert routes
INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, description, status) VALUES
('DLA-YDE', 'Douala', 'Yaoundé', 280, 180, 3500, 'Main route between economic and political capitals', 'active'),
('DLA-KRI', 'Douala', 'Kribi', 150, 120, 2500, 'Coastal route to beautiful beaches', 'active'),
('DLA-BAF', 'Douala', 'Bafoussam', 200, 150, 3000, 'Route to the West Region', 'active'),
('YDE-BAF', 'Yaoundé', 'Bafoussam', 180, 140, 2800, 'Connecting capital to West Region', 'active'),
('YDE-DLA', 'Yaoundé', 'Douala', 280, 180, 3500, 'Return route to economic capital', 'active'),
('KRI-DLA', 'Kribi', 'Douala', 150, 120, 2500, 'Return coastal route', 'active'),
('BAF-DLA', 'Bafoussam', 'Douala', 200, 150, 3000, 'Return route from West Region', 'active'),
('BAF-YDE', 'Bafoussam', 'Yaoundé', 180, 140, 2800, 'Return route to capital', 'active'),
('DLA-LIM', 'Douala', 'Limbe', 120, 90, 2000, 'Route to Limbe beaches', 'active'),
('DLA-KUM', 'Douala', 'Kumba', 180, 135, 2800, 'Route to South West Region', 'active')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert trips for the next 30 days
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS generate_trips()
BEGIN
    DECLARE i INT DEFAULT 0;
    DECLARE trip_date DATE;
    
    WHILE i <= 30 DO
        SET trip_date = DATE_ADD(CURDATE(), INTERVAL i DAY);
        
        -- Douala to Yaoundé (multiple trips)
        INSERT INTO trips (bus_id, route_id, driver_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES
        (1, 1, 2, trip_date, '06:00:00', '09:00:00', 3500, 50, 'scheduled'),
        (2, 1, 4, trip_date, '08:00:00', '11:00:00', 3500, 40, 'scheduled'),
        (3, 1, 2, trip_date, '14:00:00', '17:00:00', 3500, 20, 'scheduled');
        
        -- Yaoundé to Douala (multiple trips)
        INSERT INTO trips (bus_id, route_id, driver_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES
        (1, 5, 4, trip_date, '06:00:00', '09:00:00', 3500, 50, 'scheduled'),
        (2, 5, 2, trip_date, '10:00:00', '13:00:00', 3500, 40, 'scheduled'),
        (3, 5, 4, trip_date, '16:00:00', '19:00:00', 3500, 20, 'scheduled');
        
        -- Douala to Kribi
        INSERT INTO trips (bus_id, route_id, driver_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES
        (2, 2, 2, trip_date, '07:00:00', '09:00:00', 2500, 40, 'scheduled'),
        (4, 2, 4, trip_date, '13:00:00', '15:00:00', 2500, 45, 'scheduled');
        
        -- Kribi to Douala
        INSERT INTO trips (bus_id, route_id, driver_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES
        (2, 6, 4, trip_date, '10:00:00', '12:00:00', 2500, 40, 'scheduled'),
        (4, 6, 2, trip_date, '16:00:00', '18:00:00', 2500, 45, 'scheduled');
        
        -- Douala to Bafoussam
        INSERT INTO trips (bus_id, route_id, driver_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES
        (1, 3, 2, trip_date, '08:00:00', '10:30:00', 3000, 50, 'scheduled'),
        (4, 3, 4, trip_date, '14:00:00', '16:30:00', 3000, 45, 'scheduled');
        
        -- Bafoussam to Douala
        INSERT INTO trips (bus_id, route_id, driver_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES
        (1, 7, 4, trip_date, '11:00:00', '13:30:00', 3000, 50, 'scheduled'),
        (4, 7, 2, trip_date, '17:00:00', '19:30:00', 3000, 45, 'scheduled');
        
        -- Douala to Limbe
        INSERT INTO trips (bus_id, route_id, driver_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES
        (5, 9, 2, trip_date, '09:00:00', '10:30:00', 2000, 15, 'scheduled'),
        (5, 9, 4, trip_date, '15:00:00', '16:30:00', 2000, 15, 'scheduled');
        
        SET i = i + 1;
    END WHILE;
END //
DELIMITER ;

-- Execute the procedure to generate trips
CALL generate_trips();

-- Insert user settings for existing users
INSERT INTO user_settings (user_id, email_notifications, sms_notifications, booking_confirmations, trip_reminders, promotions, language)
SELECT id, 1, 1, 1, 1, 0, 'en' FROM users WHERE id NOT IN (SELECT user_id FROM user_settings)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, is_read, created_at) VALUES
(3, 'Welcome to CamTransit!', 'Your account has been created successfully. Start booking your first trip today!', 'system', FALSE, NOW() - INTERVAL 2 MINUTE),
(3, 'Booking Confirmed', 'Your trip from Douala to Yaoundé on March 15th is confirmed!', 'booking', FALSE, NOW() - INTERVAL 30 MINUTE),
(3, 'Trip Reminder', 'Your trip departs tomorrow at 8:00 AM. Please arrive 30 minutes early.', 'reminder', TRUE, NOW() - INTERVAL 1 DAY),
(1, 'New Booking', 'John Doe booked Douala to Yaoundé for March 15th', 'booking', FALSE, NOW() - INTERVAL 5 MINUTE),
(1, 'New User Registration', 'Alice Passenger registered as a new user', 'system', FALSE, NOW() - INTERVAL 30 MINUTE),
(1, 'Trip Completed', 'Bus BK-001 completed trip from Douala to Bafoussam', 'system', TRUE, NOW() - INTERVAL 1 HOUR),
(1, 'Low Seat Alert', 'Bus to Bamenda has only 3 seats remaining', 'system', TRUE, NOW() - INTERVAL 2 HOUR);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for available trips with full details
CREATE OR REPLACE VIEW available_trips AS
SELECT 
    t.id AS trip_id,
    t.departure_date,
    t.departure_time,
    t.arrival_time,
    t.price,
    t.available_seats,
    t.booked_seats,
    t.status AS trip_status,
    r.route_code,
    r.origin,
    r.destination,
    r.distance_km,
    r.duration_minutes,
    b.bus_number,
    b.bus_name,
    b.bus_type,
    b.amenities,
    b.license_plate,
    d.license_number AS driver_license,
    u.name AS driver_name,
    u.phone AS driver_phone,
    d.rating AS driver_rating
FROM trips t
JOIN routes r ON t.route_id = r.id
JOIN buses b ON t.bus_id = b.id
LEFT JOIN drivers d ON t.driver_id = d.id
LEFT JOIN users u ON d.user_id = u.id
WHERE t.status = 'scheduled' 
AND t.available_seats > 0
AND t.departure_date >= CURDATE();

-- View for booking details
CREATE OR REPLACE VIEW booking_details AS
SELECT 
    b.id AS booking_id,
    b.booking_reference,
    b.passenger_name,
    b.passenger_email,
    b.passenger_phone,
    b.seat_numbers,
    b.number_of_seats,
    b.total_price,
    b.payment_status,
    b.booking_status,
    b.created_at AS booking_date,
    t.departure_date,
    t.departure_time,
    t.arrival_time,
    r.origin,
    r.destination,
    r.route_code,
    bus.bus_number,
    bus.bus_name,
    u.name AS user_name,
    u.email AS user_email
FROM bookings b
JOIN trips t ON b.trip_id = t.id
JOIN routes r ON t.route_id = r.id
JOIN buses bus ON t.bus_id = bus.id
JOIN users u ON b.user_id = u.id;

-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Procedure to create a booking
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS create_booking(
    IN p_user_id INT,
    IN p_trip_id INT,
    IN p_passenger_name VARCHAR(255),
    IN p_passenger_email VARCHAR(255),
    IN p_passenger_phone VARCHAR(20),
    IN p_number_of_seats INT,
    IN p_payment_method VARCHAR(50),
    OUT p_booking_id INT,
    OUT p_booking_reference VARCHAR(20)
)
BEGIN
    DECLARE v_available_seats INT;
    DECLARE v_price DECIMAL(10,2);
    DECLARE v_total_price DECIMAL(10,2);
    DECLARE v_booking_ref VARCHAR(20);
    
    -- Check available seats
    SELECT available_seats, price INTO v_available_seats, v_price
    FROM trips WHERE id = p_trip_id;
    
    IF v_available_seats >= p_number_of_seats THEN
        -- Generate booking reference
        SET v_booking_ref = CONCAT('BK', DATE_FORMAT(NOW(), '%Y%m%d'), LPAD(FLOOR(RAND() * 10000), 4, '0'));
        
        -- Calculate total price
        SET v_total_price = v_price * p_number_of_seats;
        
        -- Create booking
        INSERT INTO bookings (
            booking_reference, user_id, trip_id, passenger_name, 
            passenger_email, passenger_phone, number_of_seats, 
            total_price, payment_method, booking_status
        ) VALUES (
            v_booking_ref, p_user_id, p_trip_id, p_passenger_name,
            p_passenger_email, p_passenger_phone, p_number_of_seats,
            v_total_price, p_payment_method, 'confirmed'
        );
        
        SET p_booking_id = LAST_INSERT_ID();
        SET p_booking_reference = v_booking_ref;
        
        -- Update available seats
        UPDATE trips 
        SET available_seats = available_seats - p_number_of_seats,
            booked_seats = booked_seats + p_number_of_seats
        WHERE id = p_trip_id;
        
        -- Create notification
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (p_user_id, 'Booking Confirmed', 
                CONCAT('Your booking ', v_booking_ref, ' has been confirmed.'),
                'booking', 'booking', p_booking_id);
    ELSE
        SET p_booking_id = -1;
        SET p_booking_reference = NULL;
    END IF;
END //
DELIMITER ;

-- Procedure to cancel a booking
DELIMITER //
CREATE PROCEDURE IF NOT EXISTS cancel_booking(
    IN p_booking_id INT,
    IN p_user_id INT,
    IN p_reason TEXT,
    OUT p_success INT
)
BEGIN
    DECLARE v_trip_id INT;
    DECLARE v_number_of_seats INT;
    DECLARE v_booking_status VARCHAR(20);
    
    -- Get booking details
    SELECT trip_id, number_of_seats, booking_status 
    INTO v_trip_id, v_number_of_seats, v_booking_status
    FROM bookings 
    WHERE id = p_booking_id AND user_id = p_user_id;
    
    IF v_booking_status = 'confirmed' THEN
        -- Update booking status
        UPDATE bookings 
        SET booking_status = 'cancelled',
            cancellation_reason = p_reason,
            cancelled_at = NOW()
        WHERE id = p_booking_id;
        
        -- Restore available seats
        UPDATE trips 
        SET available_seats = available_seats + v_number_of_seats,
            booked_seats = booked_seats - v_number_of_seats
        WHERE id = v_trip_id;
        
        -- Create notification
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (p_user_id, 'Booking Cancelled', 
                CONCAT('Your booking has been cancelled. Reason: ', p_reason),
                'cancellation', 'booking', p_booking_id);
        
        SET p_success = 1;
    ELSE
        SET p_success = 0;
    END IF;
END //
DELIMITER ;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update driver rating after review
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_review_insert
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE drivers 
    SET rating = (
        SELECT AVG(rating) 
        FROM reviews 
        WHERE driver_id = NEW.driver_id
    )
    WHERE id = NEW.driver_id;
END //
DELIMITER ;

-- Trigger to update driver total trips
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_trip_complete
AFTER UPDATE ON trips
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.driver_id IS NOT NULL THEN
        UPDATE drivers 
        SET total_trips = total_trips + 1
        WHERE id = NEW.driver_id;
    END IF;
END //
DELIMITER ;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_trips_date_status ON trips(departure_date, status);
CREATE INDEX idx_bookings_user_status ON bookings(user_id, booking_status);
CREATE INDEX idx_bookings_trip_status ON bookings(trip_id, booking_status);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);

-- =====================================================
-- DATABASE SETUP COMPLETE
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;
