<?php
session_start();
require_once __DIR__ . '/../config/db.php';

// Enable CORS for React
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Enable errors for debugging
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Read JSON input from React
$data = json_decode(file_get_contents("php://input"), true);

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

// Validate input
if (empty($email) || empty($password)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Email and password are required'
    ]);
    exit;
}

// Prepare SQL
$stmt = $conn->prepare("
    SELECT id, name, username, email, phone, gender, password, role
    FROM users
    WHERE email = ?
");
$stmt->bind_param("s", $email);
$stmt->execute();

$result = $stmt->get_result();

// Check user
if ($result->num_rows === 0) {
    echo json_encode([
        'status' => 'error',
        'message' => 'User not found'
    ]);
    exit;
}

$user = $result->fetch_assoc();

// Verify password
if (!password_verify($password, $user['password'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Incorrect password'
    ]);
    exit;
}

// Save session
$_SESSION['user_id'] = $user['id'];
$_SESSION['role']    = $user['role'];
$_SESSION['name']    = $user['name'];

// Return JSON to React instead of redirect
echo json_encode([
    'status' => 'success',
    'message' => 'Login successful',
    'user' => [
        'id' => $user['id'],
        'name' => $user['name'],
        'role' => $user['role']
    ]
]);

$stmt->close();
$conn->close();
