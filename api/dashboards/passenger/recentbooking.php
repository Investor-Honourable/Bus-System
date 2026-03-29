<?php
/**
 * Passenger Recent Booking API
 * Handles recent booking data for passengers
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
    $sql = "SELECT b.*, t.departure_date, t.departure_time, r.origin, r.destination, r.route_code, bus.bus_number, bus.bus_name
            FROM bookings b
            JOIN trips t ON b.trip_id = t.id
            JOIN routes r ON t.route_id = r.id
            JOIN buses bus ON t.bus_id = bus.id
            WHERE b.user_id = ?
            ORDER BY b.created_at DESC
            LIMIT 5";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        $bookings[] = $row;
    }
    
    echo json_encode(['status' => 'success', 'bookings' => $bookings]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to fetch recent bookings: ' . $e->getMessage()]);
}

$conn->close();
