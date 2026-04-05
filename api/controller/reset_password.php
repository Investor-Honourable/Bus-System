<?php
/**
 * Reset Password Controller
 * Handles password reset
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

$token = $data['token'] ?? '';
$new_password = $data['new_password'] ?? '';

// Validate required fields
if (!$token || !$new_password) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Token and new password are required'
    ]);
    exit;
}

// Strong password validation
$password_errors = [];
if (strlen($new_password) < 8) {
    $password_errors[] = "Password must be at least 8 characters";
}
if (!preg_match('/[A-Z]/', $new_password)) {
    $password_errors[] = "Password must contain at least one uppercase letter";
}
if (!preg_match('/[a-z]/', $new_password)) {
    $password_errors[] = "Password must contain at least one lowercase letter";
}
if (!preg_match('/[0-9]/', $new_password)) {
    $password_errors[] = "Password must contain at least one number";
}
if (!preg_match('/[!@#$%^&*(),.?":{}|<>]/', $new_password)) {
    $password_errors[] = "Password must contain at least one special character";
}

if (!empty($password_errors)) {
    echo json_encode([
        'status' => 'error',
        'message' => implode(". ", $password_errors)
    ]);
    exit;
}

try {
    // Check if token exists and is valid
    $stmt = $conn->prepare("SELECT user_id, expires_at FROM password_reset_tokens WHERE token = ? AND used = 0");
    $stmt->bind_param("s", $token);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Invalid or expired token'
        ]);
        exit;
    }
    
    $token_data = $result->fetch_assoc();
    
    // Check if token is expired
    if (strtotime($token_data['expires_at']) < time()) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Token has expired'
        ]);
        exit;
    }
    
    // Hash new password
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    
    // Update password
    $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt->bind_param("si", $hashed_password, $token_data['user_id']);
    
    if ($stmt->execute()) {
        // Mark token as used
        $stmt = $conn->prepare("UPDATE password_reset_tokens SET used = 1 WHERE token = ?");
        $stmt->bind_param("s", $token);
        $stmt->execute();
        
        echo json_encode([
            'status' => 'success',
            'message' => 'Password reset successfully'
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to reset password'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
