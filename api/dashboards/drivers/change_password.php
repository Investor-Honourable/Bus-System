<?php
/**
 * Driver Change Password API
 * Handles password changes for drivers
 */

session_start();
require_once '../../config/db.php';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, User-ID");
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

$user_id = $data['user_id'] ?? 0;
$current_password = $data['current_password'] ?? '';
$new_password = $data['new_password'] ?? '';

if (!$user_id || !$current_password || !$new_password) {
    echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
    exit;
}

if (strlen($new_password) < 6) {
    echo json_encode(['status' => 'error', 'message' => 'New password must be at least 6 characters']);
    exit;
}

try {
    // Get current password
    $stmt = $conn->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if (!$user) {
        echo json_encode(['status' => 'error', 'message' => 'User not found']);
        exit;
    }
    
    // Verify current password
    if (!password_verify($current_password, $user['password'])) {
        echo json_encode(['status' => 'error', 'message' => 'Current password is incorrect']);
        exit;
    }
    
    // Hash new password
    $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
    
    // Update password
    $stmt = $conn->prepare("UPDATE users SET password = ? WHERE id = ?");
    $stmt->bind_param("si", $hashed_password, $user_id);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Password changed successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to change password']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
