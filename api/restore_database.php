<?php
/**
 * Non-Destructive Database Restore Script
 * This script creates missing tables WITHOUT dropping existing data
 * Run: http://localhost/Bus_system/api/restore_database.php
 */

$db_host = 'localhost';
$db_name = 'bus_system';
$db_user = 'root';
$db_pass = '';

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🚌 Restoring Database Tables...</h1>";

try {
    $conn = new mysqli($db_host, $db_user, $db_pass);
    
    if ($conn->connect_error) {
        die("<p style='color:red'>Connection failed: " . $conn->connect_error . "</p>");
    }
    
    echo "<p>✓ Connected to MySQL</p>";
    
    // Create database if not exists
    $conn->query("CREATE DATABASE IF NOT EXISTS $db_name");
    $conn->select_db($db_name);
    echo "<p>✓ Using database '$db_name'</p>";
    
    // Create users table (IF NOT EXISTS - won't affect existing data)
    $conn->query("
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
        ) ENGINE=InnoDB
    ");
    echo "<p>✓ 'users' table ready</p>";
    
    // Create buses table
    $conn->query("
        CREATE TABLE IF NOT EXISTS buses (
            id INT AUTO_INCREMENT PRIMARY KEY,
            bus_number VARCHAR(20) UNIQUE,
            bus_name VARCHAR(100),
            bus_type ENUM('standard', 'luxury', 'vip', 'sleeper') DEFAULT 'standard',
            total_seats INT DEFAULT 50,
            available_seats INT DEFAULT 50,
            amenities JSON,
            status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");
    echo "<p>✓ 'buses' table ready</p>";
    
    // Create routes table
    $conn->query("
        CREATE TABLE IF NOT EXISTS routes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            route_code VARCHAR(20) UNIQUE,
            origin VARCHAR(100),
            destination VARCHAR(100),
            distance_km DECIMAL(10,2),
            duration_minutes INT,
            base_price DECIMAL(10,2),
            status ENUM('active', 'inactive') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
    ");
    echo "<p>✓ 'routes' table ready</p>";
    
    // Create trips table
    $conn->query("
        CREATE TABLE IF NOT EXISTS trips (
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
        ) ENGINE=InnoDB
    ");
    echo "<p>✓ 'trips' table ready</p>";
    
    // Create bookings table
    $conn->query("
        CREATE TABLE IF NOT EXISTS bookings (
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
        ) ENGINE=InnoDB
    ");
    echo "<p>✓ 'bookings' table ready</p>";
    
    // Create tickets table
    $conn->query("
        CREATE TABLE IF NOT EXISTS tickets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            seat_number VARCHAR(10) NOT NULL,
            passenger_name VARCHAR(255) NOT NULL,
            passenger_phone VARCHAR(20),
            ticket_status ENUM('valid', 'used', 'cancelled') DEFAULT 'valid',
            issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id)
        ) ENGINE=InnoDB
    ");
    echo "<p>✓ 'tickets' table ready</p>";
    
    // Create passengers table
    $conn->query("
        CREATE TABLE IF NOT EXISTS passengers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            emergency_contact VARCHAR(255),
            emergency_phone VARCHAR(20),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB
    ");
    echo "<p>✓ 'passengers' table ready</p>";
    
    // Check if we need to add sample data
    $result = $conn->query("SELECT COUNT(*) as cnt FROM users");
    $row = $result->fetch_assoc();
    if ($row['cnt'] == 0) {
        echo "<p><strong>No users found. Adding sample data...</strong></p>";
        
        // Add admin user
        $admin_pass = password_hash('admin123', PASSWORD_DEFAULT);
        $conn->query("INSERT INTO users (name, username, email, phone, gender, password, role) 
            VALUES ('Admin', 'admin', 'admin@camtransit.com', '237600000000', 'male', '$admin_pass', 'admin')");
        echo "<p>✓ Created admin user</p>";
        
        // Add driver
        $driver_pass = password_hash('driver123', PASSWORD_DEFAULT);
        $conn->query("INSERT INTO users (name, username, email, phone, gender, password, role) 
            VALUES ('John Driver', 'jdriver', 'driver@camtransit.com', '237600000001', 'male', '$driver_pass', 'driver')");
        echo "<p>✓ Created driver user</p>";
        
        // Add sample passenger
        $passenger_pass = password_hash('passenger123', PASSWORD_DEFAULT);
        $conn->query("INSERT INTO users (name, username, email, phone, gender, password, role) 
            VALUES ('Alice Passenger', 'apassenger', 'passenger@camtransit.com', '237600000002', 'female', '$passenger_pass', 'passenger')");
        echo "<p>✓ Created passenger user</p>";
    } else {
        echo "<p><em>Users already exist - skipping sample data</em></p>";
    }
    
    // Check if we need to add sample buses
    $result = $conn->query("SELECT COUNT(*) as cnt FROM buses");
    $row = $result->fetch_assoc();
    if ($row['cnt'] == 0) {
        echo "<p><strong>No buses found. Adding sample buses...</strong></p>";
        $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
            VALUES ('BUS-001', 'CamTransit Express', 'luxury', 50, 50, '[\"WiFi\", \"AC\", \"USB\"]', 'active')");
        $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
            VALUES ('BUS-002', 'City Liner', 'standard', 40, 40, '[\"AC\", \"WiFi\"]', 'active')");
        $conn->query("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, status) 
            VALUES ('BUS-003', 'VIP Coach', 'vip', 20, 20, '[\"WiFi\", \"AC\", \"USB\", \"Reclining Seats\"]', 'active')");
        echo "<p>✓ Created sample buses</p>";
    } else {
        echo "<p><em>Buses already exist - skipping sample data</em></p>";
    }
    
    // Check if we need to add sample routes
    $result = $conn->query("SELECT COUNT(*) as cnt FROM routes");
    $row = $result->fetch_assoc();
    if ($row['cnt'] == 0) {
        echo "<p><strong>No routes found. Adding sample routes...</strong></p>";
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-YDE', 'Douala', 'Yaoundé', 280, 180, 3500, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-KRI', 'Douala', 'Kribi', 150, 120, 2500, 'active')");
        $conn->query("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, status) 
            VALUES ('DLA-BAF', 'Douala', 'Bafoussam', 200, 150, 3000, 'active')");
        echo "<p>✓ Created sample routes</p>";
    } else {
        echo "<p><em>Routes already exist - skipping sample data</em></p>";
    }
    
    echo "<h2 style='color:green'>✓ Database restore complete!</h2>";
    echo "<p>All tables are now ready. Your existing data was preserved.</p>";
    echo "<p><a href='http://localhost:5173/'>Go to App</a></p>";
    
} catch (Exception $e) {
    echo "<p style='color:red'>Error: " . $e->getMessage() . "</p>";
}
