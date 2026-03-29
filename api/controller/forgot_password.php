<?php
/**
 * Forgot Password Controller
 * Handles password reset requests
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

// Validate required fields
if (!$email) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Email is required'
    ]);
    exit;
}

try {
    // Check if user exists
    $stmt = $conn->prepare("SELECT id, name, email FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        // Don't reveal if email exists or not
        echo json_encode([
            'status' => 'success',
            'message' => 'If your email is registered, you will receive a password reset link'
        ]);
        exit;
    }
    
    $user = $result->fetch_assoc();
    
    // Generate reset token
    $token = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));
    
    // Delete any existing tokens for this user
    $stmt = $conn->prepare("DELETE FROM password_reset_tokens WHERE user_id = ?");
    $stmt->bind_param("i", $user['id']);
    $stmt->execute();
    
    // Insert new token
    $stmt = $conn->prepare("INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $user['id'], $token, $expires_at);
    
    if ($stmt->execute()) {
        // In a real application, you would send an email here
        // For now, we'll just return success
        echo json_encode([
            'status' => 'success',
            'message' => 'If your email is registered, you will receive a password reset link',
            'token' => $token // Remove this in production
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to generate reset token'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
