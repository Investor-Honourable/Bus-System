<?php
/**
 * Database Setup Script
 * Run this file to create a fresh database and tables
 * Access: http://localhost/BUS%20MANAGEMENT/api/setup.php
 */

// Database config - change these if needed
$db_host = 'localhost';
$db_user = 'root';
$db_pass = '';  // Default XAMPP has no password

header('Content-Type: text/html; charset=utf-8');

echo "<h1>Setting up Bus Management Database...</h1>";

try {
    // Connect without database first
    $conn = new mysqli($db_host, $db_user, $db_pass);
    
    if ($conn->connect_error) {
        die("<p style='color:red'>Connection failed: " . $conn->connect_error . "</p>");
    }
    
    // Drop existing database if exists
    $conn->query("DROP DATABASE IF EXISTS bus_system");
    echo "<p>✓ Dropped existing database (if any)</p>";
    
    // Create new database
    $conn->query("CREATE DATABASE bus_system");
    echo "<p>✓ Created database 'bus_system'</p>";
    
    // Select database
    $conn->select_db("bus_system");
    
    // Create users table
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
    
    // Create passengers table
    $conn->query("
        CREATE TABLE passengers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            username VARCHAR(100),
            phone VARCHAR(20),
            gender ENUM('male', 'female', 'other') NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ");
    echo "<p>✓ Created 'passengers' table</p>";
    
    // Insert sample admin user (password: admin123)
    $admin_pass = password_hash('admin123', PASSWORD_DEFAULT);
    $conn->query("
        INSERT INTO users (name, username, email, phone, gender, password, role) 
        VALUES ('Admin', 'admin', 'admin@camtransit.com', '237600000000', 'male', '$admin_pass', 'admin')
    ");
    echo "<p>✓ Created admin user (admin@camtransit.com / admin123)</p>";
    
    // Insert sample passenger (password: passenger123)
    $passenger_pass = password_hash('passenger123', PASSWORD_DEFAULT);
    $conn->query("
        INSERT INTO users (name, username, email, phone, gender, password, role) 
        VALUES ('Alice Passenger', 'apassenger', 'passenger@camtransit.com', '237600000002', 'female', '$passenger_pass', 'passenger')
    ");
    echo "<p>✓ Created passenger user (passenger@camtransit.com / passenger123)</p>";
    
    echo "<h2 style='color:green'>✓ Database setup complete!</h2>";
    echo "<h3>Test Credentials:</h3>";
    echo "<ul>";
    echo "<li><strong>Admin:</strong> admin@camtransit.com / admin123</li>";
    echo "<li><strong>Passenger:</strong> passenger@camtransit.com / passenger123</li>";
    echo "</ul>";
    echo "<p><a href='http://localhost:5175/'>Go to App</a></p>";
    
} catch (Exception $e) {
    echo "<p style='color:red'>Error: " . $e->getMessage() . "</p>";
}
