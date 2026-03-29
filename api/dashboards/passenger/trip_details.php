<?php
/**
 * Passenger Trip Details API
 * Handles trip details for passengers
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
$trip_id = $data['trip_id'] ?? 0;
$user_id = $data['user_id'] ?? 0;

if (!$trip_id || !$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'Trip ID and User ID required']);
    exit;
}

try {
    // Verify user has booking for this trip
    $stmt = $conn->prepare("SELECT id FROM bookings WHERE trip_id = ? AND user_id = ? AND booking_status = 'confirmed'");
    $stmt->bind_param("ii", $trip_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['status' => 'error', 'message' => 'No booking found for this trip']);
        exit;
    }
    
    // Get trip details
    $sql = "SELECT t.*, r.origin, r.destination, r.route_code, r.distance_km, r.duration_minutes, r.description,
            b.bus_number, b.bus_name, b.bus_type, b.amenities, b.license_plate,
            d.license_number, u.name as driver_name, u.phone as driver_phone, d.rating as driver_rating
            FROM trips t
            JOIN routes r ON t.route_id = r.id
            JOIN buses b ON t.bus_id = b.id
            LEFT JOIN drivers d ON t.driver_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
            WHERE t.id = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $trip_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $trip = $result->fetch_assoc();
    
    if ($trip) {
        $trip['amenities'] = json_decode($trip['amenities'] ?? '[]');
        echo json_encode(['status' => 'success', 'trip' => $trip]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Trip not found']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to fetch trip details: ' . $e->getMessage()]);
}

$conn->close();
