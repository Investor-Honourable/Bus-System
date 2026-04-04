<?php
/**
 * Check All Users - Find valid login credentials
 */

session_start();
require 'config/db.php';

header('Content-Type: application/json');

echo "=== All Users (Login Credentials) ===\n\n";

$result = $conn->query("SELECT id, name, username, email, phone, role, created_at FROM users ORDER BY id");

echo "ID | Name | Username | Email | Phone | Role\n";
echo str_repeat("-", 80) . "\n";

while ($row = $result->fetch_assoc()) {
    echo "{$row['id']} | {$row['name']} | {$row['username']} | {$row['email']} | {$row['phone']} | {$row['role']}\n";
}

echo "\n=== Test Login with Each User ===\n";

// Test credentials for all users
$users = [
    ['email' => 'admin@camtransit.com', 'expected' => 'Admin'],
    ['email' => 'passenger@camtransit.com', 'expected' => 'Passenger (but role says driver!)'],
    ['email' => 'victory@camtransit.com', 'expected' => 'Victory Ngaibe'],
    ['email' => 'metugejamila@gmail.com', 'expected' => 'Investor Honourable'],
    ['email' => 'wisdom@camtransit.com', 'expected' => 'wisdom'],
];

foreach ($users as $user) {
    $stmt = $conn->prepare("SELECT id, name, role, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $user['email']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($row = $result->fetch_assoc()) {
        $hasPassword = !empty($row['password']) && strlen($row['password']) > 10;
        echo "✓ {$user['email']} -> {$row['name']} (role: {$row['role']}) - Password: " . ($hasPassword ? "SET" : "EMPTY") . "\n";
    } else {
        echo "✗ {$user['email']} -> NOT FOUND\n";
    }
}

$conn->close();
?>