<?php
/**
 * Signup Controller
 * Handles user registration
 */

session_start();
require_once '../config/db.php';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$name = $data['name'] ?? '';
$username = $data['username'] ?? null;
$email = $data['email'] ?? '';
$phone = $data['phone'] ?? null;
$gender = $data['gender'] ?? null;
$password = $data['password'] ?? '';
$role = $data['role'] ?? 'passenger';

// Validate required fields
if (!$name || !$email || !$password) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Name, email, and password are required'
    ]);
    exit;
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid email format'
    ]);
    exit;
}

// Validate password length
if (strlen($password) < 6) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Password must be at least 6 characters'
    ]);
    exit;
}

try {
    // Check if email already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Email already registered'
        ]);
        exit;
    }
    
    // Hash password
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert user
    $stmt = $conn->prepare("INSERT INTO users (name, username, email, phone, gender, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssss", $name, $username, $email, $phone, $gender, $hashed_password, $role);
    
    if ($stmt->execute()) {
        $user_id = $conn->insert_id;
        
        // Create role-specific records
        if ($role === 'passenger') {
            $stmt = $conn->prepare("INSERT INTO passengers (user_id, name, username, phone, gender) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("issss", $user_id, $name, $username, $phone, $gender);
            $stmt->execute();
        } elseif ($role === 'driver') {
            $license_number = 'DL' . str_pad($user_id, 8, '0', STR_PAD_LEFT);
            $stmt = $conn->prepare("INSERT INTO drivers (user_id, license_number, license_expiry, status) VALUES (?, ?, DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active')");
            $stmt->bind_param("is", $user_id, $license_number);
            $stmt->execute();
        }
        
        // Create user settings
        $stmt = $conn->prepare("INSERT INTO user_settings (user_id) VALUES (?)");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        
        // Create session
        $_SESSION['user_id'] = $user_id;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;
        $_SESSION['user_role'] = $role;
        
        echo json_encode([
            'status' => 'success',
            'message' => 'User registered successfully',
            'user' => [
                'id' => $user_id,
                'name' => $name,
                'email' => $email,
                'role' => $role
            ]
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Registration failed: ' . $stmt->error
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
