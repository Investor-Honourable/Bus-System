<?php
/**
 * Login Controller
 * Handles user login
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

$email = $data['email'] ?? '';
$password = $data['password'] ?? '';

// Validate required fields
if (!$email || !$password) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Email and password are required'
    ]);
    exit;
}

try {
    // Check if user exists
    $stmt = $conn->prepare("SELECT id, name, email, password, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid email or password'
        ]);
        exit;
    }
    
    $user = $result->fetch_assoc();
    
    // Verify password
    if (password_verify($password, $user['password'])) {
        // Create session
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['user_role'] = $user['role'];
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Login successful',
            'user' => [
                'id' => $user['id'],
                'name' => $user['name'],
                'email' => $user['email'],
                'role' => $user['role']
            ]
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid email or password'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
