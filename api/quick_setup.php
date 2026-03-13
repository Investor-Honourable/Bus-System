<?php
/**
 * Quick Database Setup Script
 * Run this file ONCE to set up the database and sample data
 * Access: http://localhost/Bus_system/api/quick_setup.php
 */

$db_host = 'localhost';
$db_name = 'bus_system';
$db_user = 'root';
$db_pass = '';

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🚌 Quick Database Setup</h1>";

try {
    // Connect without database
    $conn = new mysqli($db_host, $db_user, $db_pass);
    
    if ($conn->connect_error) {
        die("<p style='color:red'>Connection failed: " . $conn->connect_error . "</p>");
    }
    
    echo "<p>✓ Connected to MySQL</p>";
    
    // Create database
    $conn->query("CREATE DATABASE IF NOT EXISTS $db_name");
    $conn->select_db($db_name);
    echo "<p>✓ Created database '$db_name'</p>";
    
    // Create users table
    $conn->query("DROP TABLE IF EXISTS tickets");
    $conn->query("DROP TABLE IF EXISTS bookings");
    $conn->query("DROP TABLE IF EXISTS trips");
    $conn->query("DROP TABLE IF EXISTS routes");
    $conn->query("DROP TABLE IF EXISTS buses");
    $conn->query("DROP TABLE IF EXISTS users");
    echo "<p>✓ Dropped existing tables</p>";
    
    $conn->query("CREATE TABLE users (
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
    ) ENGINE=InnoDB");
    echo "<p>✓ Created 'users' table</p>";
    
    $conn->query("CREATE TABLE buses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bus_number VARCHAR(20) UNIQUE,
        bus_name VARCHAR(100),
        bus_type ENUM('standard', 'luxury', 'vip') DEFAULT 'standard',
        total_seats INT DEFAULT 50,
        available_seats INT DEFAULT 50,
        amenities JSON,
        status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB");
    echo "<p>✓ Created 'buses' table</p>";
    
    $conn->query("CREATE TABLE routes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        route_code VARCHAR(20) UNIQUE,
        origin VARCHAR(100),
        destination VARCHAR(100),
        distance_km DECIMAL(10,2),
        duration_minutes INT,
        base_price DECIMAL(10,2),
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB");
    echo "<p>✓ Created 'routes' table</p>";
    
    $conn->query("CREATE TABLE trips (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bus_id INT,
        route_id INT,
        departure_date DATE,
        departure_time TIME,
        arrival_time TIME,
        price DECIMAL(10,2),
        available_seats INT DEFAULT 50,
        status ENUM('scheduled', 'confirmed', 'completed', 'cancelled') DEFAULT 'scheduled',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bus_id) REFERENCES buses(id),
        FOREIGN KEY (route_id) REFERENCES routes(id)
    ) ENGINE=InnoDB");
    echo "<p>✓ Created 'trips' table</p>";
    
    $conn->query("CREATE TABLE bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        trip_id INT,
        booking_reference VARCHAR(20) UNIQUE,
        number_of_seats INT DEFAULT 1,
        total_price DECIMAL(10,2),
        booking_status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        booking_date DATE,
        travel_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (trip_id) REFERENCES trips(id)
    ) ENGINE=InnoDB");
    echo "<p>✓ Created 'bookings' table</p>";
    
    $conn->query("CREATE TABLE tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_id INT,
        ticket_reference VARCHAR(20) UNIQUE,
        seat_number VARCHAR(10),
        passenger_name VARCHAR(255),
        ticket_status ENUM('active', 'used', 'cancelled') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (booking_id) REFERENCES bookings(id)
    ) ENGINE=InnoDB");
    echo "<p>✓ Created 'tickets' table</p>";
    
    // Insert sample users
    $admin_pass = password_hash('admin123', PASSWORD_DEFAULT);
    $driver_pass = password_hash('driver123', PASSWORD_DEFAULT);
    $conn->query("INSERT INTO users (name, username, email, phone, password, role)
        VALUES ('John Driver', 'jdriver', 'driver@camtransit.com', '237600000002', '$driver_pass', 'driver')");
    
    $passenger_pass = password_hash('passenger123', PASSWORD_DEFAULT);
    $conn->query("INSERT INTO users (name, username, email, phone, password, role) 
        VALUES ('Admin User', 'admin', 'admin@camtransit.com', '237600000000', '$admin_pass', 'admin')");
    $conn->query("INSERT INTO users (name, username, email, phone, password, role) 
        VALUES ('Alice Passenger', 'apassenger', 'passenger@camtransit.com', '237600000001', '$passenger_pass', 'passenger')");
    echo "<p>✓ Created sample users</p>";
    
    // Insert sample buses
    $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
        VALUES ('BUS-001', 'CamTransit Express', 'luxury', 50, 50, '[\"WiFi\", \"AC\", \"USB\", \"Refreshments\"]', 'active')");
    $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
        VALUES ('BUS-002', 'City Liner', 'standard', 40, 40, '[\"AC\", \"WiFi\"]', 'active')");
    $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
        VALUES ('BUS-003', 'VIP Coach', 'vip', 20, 20, '[\"WiFi\", \"AC\", \"USB\", \"Refreshments\", \"Reclining Seats\"]', 'active')");
    echo "<p>✓ Created sample buses</p>";
    
    // Insert routes
    $routes = [
        ['DLA-YDE', 'Douala', 'Yaoundé', 280, 180, 3500],
        ['DLA-KRI', 'Douala', 'Kribi', 150, 120, 2500],
        ['DLA-BAF', 'Douala', 'Bafoussam', 200, 150, 3000],
        ['YDE-BAF', 'Yaoundé', 'Bafoussam', 180, 140, 2800],
        ['YDE-DLA', 'Yaoundé', 'Douala', 280, 180, 3500],
        ['KRI-DLA', 'Kribi', 'Douala', 150, 120, 2500],
        ['BAF-DLA', 'Bafoussam', 'Douala', 200, 150, 3000],
        ['BAF-YDE', 'Bafoussam', 'Yaoundé', 180, 140, 2800],
    ];
    
    foreach ($routes as $r) {
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('$r[0]', '$r[1]', '$r[2]', $r[3], $r[4], $r[5], 'active')");
    }
    echo "<p>✓ Created " . count($routes) . " routes</p>";
    
    // Create trips for next 14 days
    $tripCount = 0;
    for ($i = 0; $i <= 14; $i++) {
        $trip_date = date('Y-m-d', strtotime("+$i days"));
        
        // Douala to Yaoundé
        $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
            VALUES (1, 1, '$trip_date', '06:00:00', '09:00:00', 3500, 50, 'scheduled')");
        $tripCount++;
        
        // Douala to Kribi
        $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
            VALUES (2, 2, '$trip_date', '08:00:00', '10:00:00', 2500, 40, 'scheduled')");
        $tripCount++;
        
        // Yaoundé to Bafoussam
        $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
            VALUES (3, 4, '$trip_date', '14:00:00', '16:20:00', 2800, 20, 'scheduled')");
        $tripCount++;
        
        // Douala to Bafoussam
        $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
            VALUES (1, 3, '$trip_date', '16:00:00', '18:30:00', 3000, 50, 'scheduled')");
        $tripCount++;
        
        // Return trips
        $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
            VALUES (2, 5, '$trip_date', '05:30:00', '08:30:00', 3500, 40, 'scheduled')");
        $tripCount++;
        
        $conn->query("INSERT INTO trips (bus_id, route_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
            VALUES (1, 7, '$trip_date', '19:00:00', '21:30:00', 3000, 50, 'scheduled')");
        $tripCount++;
    }
    echo "<p>✓ Created $tripCount trips</p>";
    
    echo "<h2 style='color:green'>✓ Setup Complete!</h2>";
    echo "<p>Total: 2 users, 3 buses, " . count($routes) . " routes, $tripCount trips</p>";
    echo "<p><a href='http://localhost:5173/'>Go to App</a> (or refresh the page)</p>";
    
} catch (Exception $e) {
    echo "<p style='color:red'>Error: " . $e->getMessage() . "</p>";
}
