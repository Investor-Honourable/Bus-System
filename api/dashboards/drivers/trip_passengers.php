<?php
/**
 * Driver Trip Passengers API
 * Handles passenger list for driver's trips
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

// POST - Get passengers for a trip
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $trip_id = $data['trip_id'] ?? 0;
    $user_id = $data['user_id'] ?? 0;
    
    if (!$trip_id || !$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'Trip ID and User ID required']);
        exit;
    }
    
    try {
        // Verify driver owns this trip
        $stmt = $conn->prepare("SELECT d.id FROM drivers d JOIN trips t ON d.id = t.driver_id WHERE t.id = ? AND d.user_id = ?");
        $stmt->bind_param("ii", $trip_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized access to trip']);
            exit;
        }
        
        // Get passengers for this trip
        $sql = "SELECT b.id as booking_id, b.booking_reference, b.passenger_name, b.passenger_email, b.passenger_phone,
                b.seat_numbers, b.number_of_seats, b.booking_status, b.payment_status,
                tk.ticket_code, tk.seat_number, tk.status as ticket_status
                FROM bookings b
                LEFT JOIN tickets tk ON b.id = tk.booking_id
                WHERE b.trip_id = ? AND b.booking_status = 'confirmed'
                ORDER BY b.passenger_name";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $trip_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $passengers = [];
        while ($row = $result->fetch_assoc()) {
            $passengers[] = $row;
        }
        
        echo json_encode(['status' => 'success', 'passengers' => $passengers]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch passengers: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
