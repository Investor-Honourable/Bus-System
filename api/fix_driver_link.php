<?php
/**
 * Fix Driver Table - Connect the new driver user to drivers table
 */

session_start();
require 'config/db.php';

header('Content-Type: application/json');

echo "=== Fixing Driver Table ===\n\n";

// Get the driver user ID
$result = $conn->query("SELECT id, name, email FROM users WHERE email = 'driver@camtransit.com'");
$user = $result->fetch_assoc();

if (!$user) {
    echo "Driver user not found!\n";
    exit;
}

echo "Found driver user: ID {$user['id']} - {$user['name']}\n";

// Check if driver record exists for this user
$stmt = $conn->prepare("SELECT * FROM drivers WHERE user_id = ?");
$stmt->bind_param("i", $user['id']);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo "Driver record exists: ID {$row['id']}\n";
    $driverId = $row['id'];
} else {
    // Create driver record with proper license and bus/route assignment
    $license = "DL00000001";
    $busId = 1;  // First bus
    $routeId = 3; // Bafoussam route
    
    $stmt = $conn->prepare("INSERT INTO drivers (user_id, license_number, assigned_bus_id, assigned_route_id, status) VALUES (?, ?, ?, ?, 'active')");
    $stmt->bind_param("isii", $user['id'], $license, $busId, $routeId);
    $stmt->execute();
    
    $driverId = $conn->insert_id;
    echo "Created driver record: ID $driverId\n";
}

// Update the driver record with proper details
$conn->query("UPDATE drivers SET status = 'active' WHERE id = $driverId");

// Assign a bus and route to this driver
$conn->query("UPDATE drivers SET assigned_bus_id = 1, assigned_route_id = 3 WHERE id = $driverId");
echo "Assigned Bus ID 1 and Route ID 3 to driver\n";

echo "\n=== DRIVER SETUP COMPLETE ===\n";
echo "Driver User ID: {$user['id']}\n";
echo "Driver Record ID: $driverId\n";
echo "\nLOGIN CREDENTIALS:\n";
echo "Email: driver@camtransit.com\n";
echo "Password: driver123\n";

$conn->close();
?>