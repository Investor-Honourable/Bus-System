<?php
/**
 * Driver My Trips API
 * Handles trip management for drivers
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

// POST - Get driver's trips
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = $data['user_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    try {
        // Get driver ID from user ID
        $stmt = $conn->prepare("SELECT id FROM drivers WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $driver = $result->fetch_assoc();
        
        if (!$driver) {
            echo json_encode(['status' => 'error', 'message' => 'Driver not found']);
            exit;
        }
        
        // Get driver's trips
        $sql = "SELECT t.*, r.origin, r.destination, r.route_code, r.distance_km, r.duration_minutes,
                b.bus_number, b.bus_name, b.bus_type, b.license_plate
                FROM trips t
                JOIN routes r ON t.route_id = r.id
                JOIN buses b ON t.bus_id = b.id
                WHERE t.driver_id = ?
                ORDER BY t.departure_date DESC, t.departure_time ASC";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $driver['id']);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $trips = [];
        while ($row = $result->fetch_assoc()) {
            $trips[] = $row;
        }
        
        echo json_encode(['status' => 'success', 'trips' => $trips]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch trips: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
