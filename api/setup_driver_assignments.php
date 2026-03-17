<?php
/**
 * Driver Trip Assignments Setup
 * Creates the driver_trip_assignments table for linking drivers to trips
 * Run: http://localhost/Bus_system/api/setup_driver_assignments.php
 */

$db_host = 'localhost';
$db_name = 'bus_system';
$db_user = 'root';
$db_pass = '';

header('Content-Type: text/html; charset=utf-8');

echo "<h1>🚗 Setting Up Driver Trip Assignments...</h1>";

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
    
    // Create driver_trip_assignments table
    $conn->query("
        CREATE TABLE IF NOT EXISTS driver_trip_assignments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            driver_id INT NOT NULL,
            trip_id INT NOT NULL,
            assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            assigned_by INT NULL,
            notes TEXT,
            status ENUM('assigned', 'active', 'completed', 'cancelled') DEFAULT 'assigned',
            FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_assignment (driver_id, trip_id)
        ) ENGINE=InnoDB
    ");
    echo "<p>✓ 'driver_trip_assignments' table ready</p>";
    
    // Create index for faster lookups
    $conn->query("
        CREATE INDEX IF NOT EXISTS idx_driver_trip ON driver_trip_assignments(driver_id, trip_id)
    ");
    echo "<p>✓ Indexes created</p>";
    
    // Add driver_id column to trips table if it doesn't exist (optional enhancement)
    $result = $conn->query("SHOW COLUMNS FROM trips LIKE 'driver_id'");
    if ($result->num_rows === 0) {
        $conn->query("ALTER TABLE trips ADD COLUMN driver_id INT NULL");
        $conn->query("ALTER TABLE trips ADD FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL");
        echo "<p>✓ Added driver_id column to trips table (optional)</p>";
    } else {
        echo "<p>✓ trips.driver_id already exists</p>";
    }
    
    echo "<h2 style='color:green'>✅ Driver Trip Assignments setup complete!</h2>";
    echo "<p>The system now supports assigning drivers to trips.</p>";
    
} catch (Exception $e) {
    echo "<p style='color:red'>Error: " . $e->getMessage() . "</p>";
}
