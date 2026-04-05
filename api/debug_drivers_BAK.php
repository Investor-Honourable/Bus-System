<?php
/**
 * Debug Drivers Table
 */

session_start();
require 'config/db.php';

header('Content-Type: application/json');

echo "=== Drivers Table Full Dump ===\n\n";

$result = $conn->query("SELECT d.id, d.user_id, d.license_number, d.assigned_bus_id, d.assigned_route_id, d.status, u.name, u.email, u.role 
FROM drivers d 
LEFT JOIN users u ON d.user_id = u.id
ORDER BY d.id");

while ($row = $result->fetch_assoc()) {
    echo "Driver ID: {$row['id']}\n";
    echo "  User ID: {$row['user_id']}\n";
    echo "  License: {$row['license_number']}\n";
    echo "  Bus ID: {$row['assigned_bus_id']}\n";
    echo "  Route ID: {$row['assigned_route_id']}\n";
    echo "  Status: {$row['status']}\n";
    echo "  User Name: {$row['name']}\n";
    echo "  User Email: {$row['email']}\n";
    echo "  User Role: {$row['role']}\n";
    echo "---\n";
}

echo "\n=== Now let's check user_id = 25 ===\n";

$stmt = $conn->prepare("SELECT * FROM drivers WHERE user_id = 25");
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo "FOUND: Driver ID {$row['id']} for user_id 25\n";
    echo "License: {$row['license_number']}\n";
    echo "Status: {$row['status']}\n";
    echo "Bus: {$row['assigned_bus_id']}\n";
    echo "Route: {$row['assigned_route_id']}\n";
} else {
    echo "No driver record found for user_id 25\n";
    echo "Creating one now...\n";
    
    $license = "DL00000001";
    $user_id = 25;
    $bus_id = 1;
    $route_id = 3;
    $status = "active";
    
    $stmt = $conn->prepare("INSERT INTO drivers (user_id, license_number, assigned_bus_id, assigned_route_id, status) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("isiis", $user_id, $license, $bus_id, $route_id, $status);
    $stmt->execute();
    
    echo "Created driver record with ID: " . $conn->insert_id . "\n";
}

$conn->close();
?>