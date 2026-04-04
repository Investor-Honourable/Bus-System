<?php
/**
 * Create Proper Driver with Real Credentials
 */

session_start();
require 'config/db.php';

header('Content-Type: application/json');

echo "=== Creating Proper Driver ===\n\n";

try {
    // 1. Check if driver user already exists, if not create one
    $email = "driver@camtransit.com";
    $stmt = $conn->prepare("SELECT id, name, email, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        echo "Driver user already exists: ID {$row['id']} - {$row['name']}\n";
        $driverUserId = $row['id'];
        
        // Update role to driver if not already
        if ($row['role'] != 'driver') {
            $conn->query("UPDATE users SET role = 'driver' WHERE id = $driverUserId");
            echo "Updated role to driver\n";
        }
    } else {
        // Create new driver user
        $name = "Marie Driver";
        $phone = "237600000001";
        $username = "marie.driver";
        $password = password_hash("driver123", PASSWORD_DEFAULT);
        $role = "driver";
        
        $stmt = $conn->prepare("INSERT INTO users (name, username, email, phone, password, role) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssss", $name, $username, $email, $phone, $password, $role);
        $stmt->execute();
        
        $driverUserId = $conn->insert_id;
        echo "Created new driver user: ID $driverUserId\n";
    }
    
    // 2. Check if driver record exists in drivers table
    $stmt = $conn->prepare("SELECT id, user_id, license_number FROM drivers WHERE user_id = ?");
    $stmt->bind_param("i", $driverUserId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        echo "Driver record exists: Driver ID {$row['id']}\n";
        $driverId = $row['id'];
        
        // Update license if empty
        if (empty($row['license_number'])) {
            $conn->query("UPDATE drivers SET license_number = 'DL00000001' WHERE id = $driverId");
            echo "Updated license number\n";
        }
        
        // Set as active
        $conn->query("UPDATE drivers SET status = 'active' WHERE id = $driverId");
        echo "Set driver as active\n";
    } else {
        // Create driver record
        $license = "DL00000001";
        $stmt = $conn->prepare("INSERT INTO drivers (user_id, license_number, status) VALUES (?, ?, 'active')");
        $stmt->bind_param("is", $driverUserId, $license);
        $stmt->execute();
        
        $driverId = $conn->insert_id;
        echo "Created driver record: ID $driverId\n";
    }
    
    echo "\n=== DRIVER LOGIN CREDENTIALS ===\n";
    echo "Email: driver@camtransit.com\n";
    echo "Password: driver123\n";
    echo "================================\n\n";
    
    // 3. Also fix the other driver (Alice Passenger) - change her to passenger
    $conn->query("UPDATE users SET role = 'passenger', name = 'Alice Passenger', email = 'passenger@camtransit.com' WHERE id = 3");
    echo "Fixed Alice Passenger - now properly a passenger\n";
    
    // 4. Clean up orphan driver (user ID 4)
    $conn->query("DELETE FROM drivers WHERE user_id = 4");
    $conn->query("DELETE FROM users WHERE id = 4");
    echo "Removed orphan driver record\n";
    
    echo "\n=== DONE ===\n";
    echo "You can now login to driver dashboard with:\n";
    echo "Email: driver@camtransit.com\n";
    echo "Password: driver123\n";

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

$conn->close();
?>