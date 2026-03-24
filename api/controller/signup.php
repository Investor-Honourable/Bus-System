<?php
session_start();
require '../config/db.php';

// CORS Configuration
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origin = in_array($origin, $allowed_origins) ? $origin : $allowed_origins[0];

header("Access-Control-Allow-Origin: $allowed_origin");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

// Disable error display in production
$is_localhost = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1', 'localhost']) || 
                strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false;
if (!$is_localhost) {
    ini_set('display_errors', 0);
    error_reporting(0);
}

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

$name = $data['name'] ?? '';
$username = $data['username'] ?? null;
$email = $data['email'] ?? '';
$phone = $data['phone'] ?? null;
$gender = $data['gender'] ?? null;
$password = $data['password'] ?? '';

// SECURITY FIX: Role is always set to 'passenger' - never accept role from user input
// Only admin users can assign roles through the admin panel
$role = 'passenger';

// Validate required fields
if (!$name || !$email || !$password) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Name, email, and password are required'
    ]);
    exit;
}

// SECURITY FIX: Removed role validation based on user input - role is hardcoded to 'passenger'

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
