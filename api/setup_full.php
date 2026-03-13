<?php
/**
 * Complete Database Setup for Bus Management System
 * Run: http://localhost/BUS%20MANAGEMENT/api/setup_full.php
 */

$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🚌 Setting up Complete Bus Management System...</h1>";

try {
    $conn = new mysqli($db_host, $db_user, $db_pass);
    
    if ($conn->connect_error) {
        die("<p style='color:red'>Connection failed: " . $conn->connect_error . "</p>");
    }
    
    // Drop and recreate database
    $conn->query("DROP DATABASE IF EXISTS bus_system");
    $conn->query("CREATE DATABASE bus_system");
    $conn->select_db("bus_system");
    echo "<p>✓ Created database 'bus_system'</p>";
    
    // 1. USERS TABLE
    $conn->query("
        CREATE TABLE users (
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
        )
    ");
    echo "<p>✓ Created 'users' table</p>";
    
    // 2. BUSES TABLE
    $conn->query("
        CREATE TABLE buses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bus_number VARCHAR(20) UNIQUE NOT NULL,
            bus_name VARCHAR(100),
            bus_type ENUM('standard', 'luxury', 'vip', ' sleeper') DEFAULT 'standard',
            total_seats INT NOT NULL,
            available_seats INT NOT NULL,
            amenities JSON,
            image_url VARCHAR(500),
            status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");
    echo "<p>✓ Created 'buses' table</p>";
    
    // 3. ROUTES TABLE
    $conn->query("
        CREATE TABLE routes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            route_code VARCHAR(20) UNIQUE NOT NULL,
            origin VARCHAR(100) NOT NULL,
            destination VARCHAR(100) NOT NULL,
            distance_km INT,
            duration_minutes INT,
            base_price DECIMAL(10,2) NOT NULL,
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");
    echo "<p>✓ Created 'routes' table</p>";
    
    // 4. TRIPS/SCHEDULES TABLE
    $conn->query("
        CREATE TABLE trips (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bus_id INT NOT NULL,
            route_id INT NOT NULL,
            departure_date DATE NOT NULL,
            departure_time TIME NOT NULL,
            arrival_time TIME NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            available_seats INT NOT NULL,
            status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (bus_id) REFERENCES buses(id),
            FOREIGN KEY (route_id) REFERENCES routes(id)
        )
    ");
    echo "<p>✓ Created 'trips' table</p>";
    
    // 5. BOOKINGS TABLE
    $conn->query("
        CREATE TABLE bookings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            trip_id INT NOT NULL,
            booking_reference VARCHAR(20) UNIQUE NOT NULL,
            number_of_seats INT NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            booking_status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'pending',
            booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            travel_date DATE,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (trip_id) REFERENCES trips(id)
        )
    ");
    echo "<p>✓ Created 'bookings' table</p>";
    
    // 6. TICKETS TABLE
    $conn->query("
        CREATE TABLE tickets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            seat_number VARCHAR(10) NOT NULL,
            passenger_name VARCHAR(255) NOT NULL,
            passenger_phone VARCHAR(20),
            ticket_status ENUM('valid', 'used', 'cancelled') DEFAULT 'valid',
            issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id)
        )
    ");
    echo "<p>✓ Created 'tickets' table</p>";
    
    // 7. PASSENGERS TABLE (extended profile)
    $conn->query("
        CREATE TABLE passengers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            emergency_contact VARCHAR(255),
            emergency_phone VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
    echo "<p>✓ Created 'passengers' table</p>";
    
    // ============= INSERT SAMPLE DATA =============
    
    // Insert admin user
    $admin_pass = password_hash('admin123', PASSWORD_DEFAULT);
    $conn->query("INSERT INTO users (name, username, email, phone, gender, password, role) 
        VALUES ('System Admin', 'admin', 'admin@camtransit.com', '237600000000', 'male', '$admin_pass', 'admin')");
    echo "<p>✓ Created admin user</p>";
    
    // Insert driver
    $driver_pass = password_hash('driver123', PASSWORD_DEFAULT);
    $conn->query("INSERT INTO users (name, username, email, phone, gender, password, role) 
        VALUES ('John Driver', 'jdriver', 'driver@camtransit.com', '237600000001', 'male', '$driver_pass', 'driver')");
    echo "<p>✓ Created driver user</p>";
    
    // Insert sample passenger
    $passenger_pass = password_hash('passenger123', PASSWORD_DEFAULT);
    $conn->query("INSERT INTO users (name, username, email, phone, gender, password, role) 
        VALUES ('Alice Passenger', 'apassenger', 'passenger@camtransit.com', '237600000002', 'female', '$passenger_pass', 'passenger')");
    $passenger_user_id = $conn->insert_id;
    $conn->query("INSERT INTO passengers (user_id) VALUES ($passenger_user_id)");
    echo "<p>✓ Created passenger user</p>";
    
    // Insert sample buses
    $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
        VALUES ('BUS-001', 'CamTransit Express', 'luxury', 50, 50, '[\"WiFi\", \"AC\", \"USB\", \"Refreshments\"]', 'active')");
    $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
        VALUES ('BUS-002', 'City Liner', 'standard', 40, 40, '[\"AC\", \"WiFi\"]', 'active')");
    $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
        VALUES ('BUS-003', 'VIP Coach', 'vip', 20, 20, '[\"WiFi\", \"AC\", \"USB\", \"Refreshments\", \"Reclining Seats\"]', 'active')");
    $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
        VALUES ('BUS-004', 'Night Sleeper', 'sleeper', 30, 30, '[\"WiFi\", \"AC\", \"Blankets\"]', 'active')");
    echo "<p>✓ Created 4 sample buses</p>";
    
    // Insert sample routes
    $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
        VALUES ('DLA-YDE', 'Douala', 'Yaoundé', 280, 180, 3500, 'active')");
    $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
        VALUES ('DLA-KRI', 'Douala', 'Kribi', 150, 120, 2500, 'active')");
    $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
        VALUES ('DLA-BAF', 'Douala', 'Bafoussam', 200, 150, 3000, 'active')");
    $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
        VALUES ('YDE-BAF', 'Yaoundé', 'Bafoussam', 180, 140, 2800, 'active')");
    $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
        VALUES ('YDE-DLA', 'Yaoundé', 'Douala', 280, 180, 3500, 'active')");
    echo "<p>✓ Created 5 sample routes</p>";
    
    // Insert sample trips
    $tomorrow = date('Y-m-d', strtotime('+1 day'));
    $nextweek = date('Y-m-d', strtotime('+7 days'));
    
    $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
        VALUES (1, 1, '$tomorrow', '06:00:00', '09:00:00', 3500, 50, 'scheduled')");
    $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
        VALUES (1, 1, '$nextweek', '06:00:00', '09:00:00', 3500, 50, 'scheduled')");
    $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
        VALUES (2, 2, '$tomorrow', '08:00:00', '10:00:00', 2500, 40, 'scheduled')");
    $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
        VALUES (3, 1, '$tomorrow', '14:00:00', '17:00:00', 5000, 20, 'scheduled')");
    $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
        VALUES (4, 5, '$nextweek', '22:00:00', '01:00:00', 4000, 30, 'scheduled')");
    echo "<p>✓ Created 5 sample trips</p>";
    
    // Insert sample bookings for the passenger
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    $today = date('Y-m-d');
    
    // Past completed booking
    $conn->query("INSERT INTO bookings (user_id, trip_id, number_of_seats, total_price, booking_status, booking_date) 
        VALUES ($passenger_user_id, 1, 1, 3500, 'completed', '$yesterday')");
    
    // Upcoming booking (for tomorrow)
    $conn->query("INSERT INTO bookings (user_id, trip_id, number_of_seats, total_price, booking_status, booking_date) 
        VALUES ($passenger_user_id, 1, 2, 7000, 'confirmed', '$today')");
    
    // Another upcoming booking
    $conn->query("INSERT INTO bookings (user_id, trip_id, number_of_seats, total_price, booking_status, booking_date) 
        VALUES ($passenger_user_id, 3, 1, 5000, 'confirmed', '$today')");
    
    // Insert tickets for the bookings
    $conn->query("INSERT INTO tickets (booking_id, seat_number) VALUES (1, 'A1')");
    $conn->query("INSERT INTO tickets (booking_id, seat_number) VALUES (2, 'A2')");
    $conn->query("INSERT INTO tickets (booking_id, seat_number) VALUES (2, 'A3')");
    $conn->query("INSERT INTO tickets (booking_id, seat_number) VALUES (3, 'B1')");
    
    echo "<p>✓ Created sample bookings and tickets</p>";
    
    echo "<h2 style='color:green'>🎉 Complete Database Setup Done!</h2>";
    echo "<h3>Login Credentials:</h3>";
    echo "<ul>";
    echo "<li><strong>Admin:</strong> admin@camtransit.com / admin123</li>";
    echo "<li><strong>Driver:</strong> driver@camtransit.com / driver123</li>";
    echo "<li><strong>Passenger:</strong> passenger@camtransit.com / passenger123</li>";
    echo "</ul>";
    echo "<p><a href='http://localhost:5175/'>🚀 Go to Bus Management App</a></p>";
    
} catch (Exception $e) {
    echo "<p style='color:red'>Error: " . $e->getMessage() . "</p>";
}
