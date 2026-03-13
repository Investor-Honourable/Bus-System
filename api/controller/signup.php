<?php
session_start();
require '../config/db.php';

// Enable CORS for React
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

// Turn off error display
error_reporting(0);
ini_set('display_errors', 0);

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

$name = $data['name'] ?? '';
$username = $data['username'] ?? null;
$email = $data['email'] ?? '';
$phone = $data['phone'] ?? null;
$gender = $data['gender'] ?? null;
$password = $data['password'] ?? '';
$role = $data['role'] ?? 'passenger'; // Get role from request, default to passenger

// Validate required fields
if (!$name || !$email || !$password) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Name, email, and password are required'
    ]);
    exit;
}

// Validate role
if (!in_array($role, ['passenger', 'driver', 'admin'])) {
    $role = 'passenger'; // Default to passenger if invalid role
}

// Check if email already exists
$stmtCheck = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmtCheck->bind_param("s", $email);
$stmtCheck->execute();
$stmtCheck->store_result();
if ($stmtCheck->num_rows > 0) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Email already registered'
    ]);
    exit;
}
$stmtCheck->close();

// Hash password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Insert into users with the specified role
$stmt = $conn->prepare("
    INSERT INTO users (name, username, email, phone, gender, password, role)
    VALUES (?, ?, ?, ?, ?, ?, ?)
");
$stmt->bind_param("sssssss", $name, $username, $email, $phone, $gender, $hashedPassword, $role);

if($stmt->execute()){
    $user_id = $stmt->insert_id;

    // Insert into passengers table
    $stmt2 = $conn->prepare("
        INSERT INTO passengers (user_id, name, username, phone, gender)
        VALUES (?, ?, ?, ?, ?)
    ");
    $stmt2->bind_param("issss", $user_id, $name, $username, $phone, $gender);
    $stmt2->execute();
    $stmt2->close();

    // Return JSON including user info
    echo json_encode([
        'status' => 'success',
        'message' => 'User registered successfully',
        'user' => [
            'id' => $user_id,
            'name' => $name,
            'email' => $email,
            'role' => 'passenger'
        ]
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'Registration failed: '.$stmt->error
    ]);
}

$stmt->close();
$conn->close();
