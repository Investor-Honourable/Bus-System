<?php
/**
 * Driver Settings API
 * Handles driver settings management
 */

session_start();
require_once '../../config/db.php';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, User-ID");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - Get driver settings
if ($method === 'GET') {
    $user_id = $_GET['user_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    try {
        $stmt = $conn->prepare("SELECT * FROM user_settings WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $settings = $result->fetch_assoc();
        
        if ($settings) {
            echo json_encode(['status' => 'success', 'settings' => $settings]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Settings not found']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch settings: ' . $e->getMessage()]);
    }
    exit;
}

// POST - Update driver settings
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = $data['user_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    $email_notifications = $data['email_notifications'] ?? 1;
    $sms_notifications = $data['sms_notifications'] ?? 1;
    $booking_confirmations = $data['booking_confirmations'] ?? 1;
    $trip_reminders = $data['trip_reminders'] ?? 1;
    $promotions = $data['promotions'] ?? 0;
    $language = $data['language'] ?? 'en';
    
    try {
        $stmt = $conn->prepare("UPDATE user_settings SET email_notifications = ?, sms_notifications = ?, booking_confirmations = ?, trip_reminders = ?, promotions = ?, language = ? WHERE user_id = ?");
        $stmt->bind_param("iiiissi", $email_notifications, $sms_notifications, $booking_confirmations, $trip_reminders, $promotions, $language, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Settings updated successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update settings']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
