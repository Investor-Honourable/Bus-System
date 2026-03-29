<?php
/**
 * Passenger Profile API
 * Handles passenger profile management
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
$action = $data['action'] ?? 'get';
$user_id = $data['user_id'] ?? 0;

if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID required']);
    exit;
}

// Get profile
if ($action === 'get') {
    try {
        $stmt = $conn->prepare("SELECT id, name, username, email, phone, gender, avatar, created_at FROM users WHERE id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        if ($user) {
            echo json_encode(['status' => 'success', 'user' => $user]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'User not found']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch profile: ' . $e->getMessage()]);
    }
    exit;
}

// Update profile
if ($action === 'update') {
    $name = $data['name'] ?? '';
    $phone = $data['phone'] ?? '';
    $gender = $data['gender'] ?? '';
    
    if (!$name) {
        echo json_encode(['status' => 'error', 'message' => 'Name is required']);
        exit;
    }
    
    try {
        $stmt = $conn->prepare("UPDATE users SET name = ?, phone = ?, gender = ? WHERE id = ?");
        $stmt->bind_param("sssi", $name, $phone, $gender, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Profile updated successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update profile']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid action']);
$conn->close();
