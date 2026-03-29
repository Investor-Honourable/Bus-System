<?php
/**
 * Update Role Controller
 * Handles user role updates
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

$user_id = $data['user_id'] ?? 0;
$role = $data['role'] ?? '';

// Validate required fields
if (!$user_id || !$role) {
    echo json_encode([
        'status' => 'error',
        'message' => 'User ID and role are required'
    ]);
    exit;
}

// Validate role
$valid_roles = ['admin', 'driver', 'passenger'];
if (!in_array($role, $valid_roles)) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Invalid role'
    ]);
    exit;
}

try {
    // Update user role
    $stmt = $conn->prepare("UPDATE users SET role = ? WHERE id = ?");
    $stmt->bind_param("si", $role, $user_id);
    
    if ($stmt->execute()) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Role updated successfully'
        ]);
    } else {
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to update role'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Error: ' . $e->getMessage()
    ]);
}

$conn->close();
