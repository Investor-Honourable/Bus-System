<?php
/**
 * Fix Driver Credentials - Connect real users to drivers table
 */

session_start();
require 'config/db.php';

header('Content-Type: application/json');

echo "=== Fixing Driver Credentials ===\n\n";

// Get all users with role 'driver'
$result = $conn->query("SELECT id, name, email, phone, role FROM users WHERE role = 'driver'");
echo "Users with driver role:\n";
while ($row = $result->fetch_assoc()) {
    echo "- ID: {$row['id']}, Name: {$row['name']}, Email: {$row['email']}, Phone: {$row['phone']}\n";
}

echo "\n";

// Get all drivers
$result = $conn->query("SELECT d.id, d.user_id, d.license_number, d.assigned_route_id, d.assigned_bus_id, d.status, u.name, u.email 
FROM drivers d 
LEFT JOIN users u ON d.user_id = u.id");
echo "Drivers table:\n";
while ($row = $result->fetch_assoc()) {
    echo "- Driver ID: {$row['id']}, User ID: {$row['user_id']}, License: {$row['license_number']}, Status: {$row['status']}, User: {$row['name']} ({$row['email']})\n";
}

echo "\n=== Checking Login Credentials ===\n";

// Test if we can find a driver by email
$testEmail = "marie.driver@camtransit.com";
$stmt = $conn->prepare("SELECT id, name, email, password, role FROM users WHERE email = ?");
$stmt->bind_param("s", $testEmail);
$stmt->execute();
$result = $stmt->get_result();
if ($row = $result->fetch_assoc()) {
    echo "Found user: {$row['name']} ({$row['email']})\n";
    echo "Role: {$row['role']}\n";
    echo "Password hash exists: " . (strlen($row['password']) > 0 ? "Yes" : "No") . "\n";
} else {
    echo "User not found: $testEmail\n";
}

$conn->close();
?>