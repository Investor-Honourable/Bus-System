<?php
/**
 * Passenger Dashboard Stats API
 * Handles dashboard statistics for passengers
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

if (!$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'User ID required']);
    exit;
}

try {
    // Get total bookings
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM bookings WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $total_bookings = $result->fetch_assoc()['total'];
    
    // Get confirmed bookings
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM bookings WHERE user_id = ? AND booking_status = 'confirmed'");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $confirmed_bookings = $result->fetch_assoc()['total'];
    
    // Get completed trips
    $stmt = $conn->prepare("SELECT COUNT(*) as total FROM bookings b JOIN trips t ON b.trip_id = t.id WHERE b.user_id = ? AND t.status = 'completed'");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $completed_trips = $result->fetch_assoc()['total'];
    
    // Get total spent
    $stmt = $conn->prepare("SELECT COALESCE(SUM(total_price), 0) as total FROM bookings WHERE user_id = ? AND payment_status = 'paid'");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $total_spent = $result->fetch_assoc()['total'];
    
    echo json_encode([
        'status' => 'success',
        'stats' => [
            'total_bookings' => $total_bookings,
            'confirmed_bookings' => $confirmed_bookings,
            'completed_trips' => $completed_trips,
            'total_spent' => $total_spent
        ]
    ]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to fetch stats: ' . $e->getMessage()]);
}

$conn->close();
