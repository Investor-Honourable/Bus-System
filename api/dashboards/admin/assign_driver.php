<?php
/**
 * Admin Assign Driver API
 * Handles driver assignment to trips
 */

session_start();
require_once '../../config/db.php';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch available drivers
if ($method === 'GET') {
    try {
        $sql = "SELECT d.id, d.user_id, d.license_number, d.status, u.name, u.phone
                FROM drivers d
                JOIN users u ON d.user_id = u.id
                WHERE d.status = 'active'
                ORDER BY u.name";
        
        $result = $conn->query($sql);
        $drivers = [];
        
        while ($row = $result->fetch_assoc()) {
            $drivers[] = $row;
        }
        
        echo json_encode(['status' => 'success', 'drivers' => $drivers]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch drivers: ' . $e->getMessage()]);
    }
    exit;
}

// POST - Assign driver to trip
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $trip_id = $data['trip_id'] ?? 0;
    $driver_id = $data['driver_id'] ?? 0;
    
    if (!$trip_id || !$driver_id) {
        echo json_encode(['status' => 'error', 'message' => 'Trip ID and Driver ID are required']);
        exit;
    }
    
    try {
        // Check if driver is available
        $stmt = $conn->prepare("SELECT status FROM drivers WHERE id = ?");
        $stmt->bind_param("i", $driver_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $driver = $result->fetch_assoc();
        
        if (!$driver || $driver['status'] !== 'active') {
            echo json_encode(['status' => 'error', 'message' => 'Driver is not available']);
            exit;
        }
        
        // Assign driver to trip
        $stmt = $conn->prepare("UPDATE trips SET driver_id = ? WHERE id = ?");
        $stmt->bind_param("ii", $driver_id, $trip_id);
        
        if ($stmt->execute()) {
            // Get the trip info to update driver's route/bus assignment
            $stmt = $conn->prepare("SELECT route_id, bus_id FROM trips WHERE id = ?");
            $stmt->bind_param("i", $trip_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $trip_info = $result->fetch_assoc();
            
            // Update driver's assigned route and bus
            if ($trip_info) {
                $stmt = $conn->prepare("UPDATE drivers SET assigned_route_id = ?, assigned_bus_id = ? WHERE id = ?");
                $stmt->bind_param("iii", $trip_info['route_id'], $trip_info['bus_id'], $driver_id);
                $stmt->execute();
            }
            
            // Create notification for driver
            $stmt = $conn->prepare("SELECT user_id FROM drivers WHERE id = ?");
            $stmt->bind_param("i", $driver_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $driver_user = $result->fetch_assoc();
            
            if ($driver_user) {
                $stmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES (?, 'New Trip Assignment', 'You have been assigned to a new trip.', 'system', 'trip', ?)");
                $stmt->bind_param("ii", $driver_user['user_id'], $trip_id);
                $stmt->execute();
            }
            
            echo json_encode(['status' => 'success', 'message' => 'Driver assigned successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to assign driver']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
