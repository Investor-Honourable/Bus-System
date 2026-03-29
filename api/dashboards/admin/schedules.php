<?php
/**
 * Admin Schedules/Trips API
 * Handles trip/schedule management for administrators
 */

session_start();
require_once '../../config/db.php';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

// GET - Fetch all trips
if ($method === 'GET') {
    try {
        $sql = "SELECT t.*, r.origin, r.destination, r.route_code, r.distance_km, r.duration_minutes,
                b.bus_number, b.bus_name, b.bus_type,
                d.license_number, u.name as driver_name, u.phone as driver_phone
                FROM trips t
                JOIN routes r ON t.route_id = r.id
                JOIN buses b ON t.bus_id = b.id
                LEFT JOIN drivers d ON t.driver_id = d.id
                LEFT JOIN users u ON d.user_id = u.id
                ORDER BY t.departure_date DESC, t.departure_time ASC";
        
        $result = $conn->query($sql);
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

// POST - Add new trip
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $bus_id = $data['bus_id'] ?? 0;
    $route_id = $data['route_id'] ?? 0;
    $driver_id = $data['driver_id'] ?? null;
    $departure_date = $data['departure_date'] ?? '';
    $departure_time = $data['departure_time'] ?? '';
    $arrival_time = $data['arrival_time'] ?? '';
    $price = $data['price'] ?? 0;
    
    if (!$bus_id || !$route_id || !$departure_date || !$departure_time || !$arrival_time || !$price) {
        echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
        exit;
    }
    
    try {
        // Get bus available seats
        $stmt = $conn->prepare("SELECT total_seats FROM buses WHERE id = ?");
        $stmt->bind_param("i", $bus_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $bus = $result->fetch_assoc();
        
        if (!$bus) {
            echo json_encode(['status' => 'error', 'message' => 'Bus not found']);
            exit;
        }
        
        $stmt = $conn->prepare("INSERT INTO trips (bus_id, route_id, driver_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')");
        $stmt->bind_param("iiisssdi", $bus_id, $route_id, $driver_id, $departure_date, $departure_time, $arrival_time, $price, $bus['total_seats']);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Trip added successfully', 'id' => $conn->insert_id]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add trip: ' . $stmt->error]);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// PUT - Update trip
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $id = $data['id'] ?? 0;
    $bus_id = $data['bus_id'] ?? 0;
    $route_id = $data['route_id'] ?? 0;
    $driver_id = $data['driver_id'] ?? null;
    $departure_date = $data['departure_date'] ?? '';
    $departure_time = $data['departure_time'] ?? '';
    $arrival_time = $data['arrival_time'] ?? '';
    $price = $data['price'] ?? 0;
    $status = $data['status'] ?? 'scheduled';
    
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'Trip ID required']);
        exit;
    }
    
    try {
        $stmt = $conn->prepare("UPDATE trips SET bus_id = ?, route_id = ?, driver_id = ?, departure_date = ?, departure_time = ?, arrival_time = ?, price = ?, status = ? WHERE id = ?");
        $stmt->bind_param("iiisssdsi", $bus_id, $route_id, $driver_id, $departure_date, $departure_time, $arrival_time, $price, $status, $id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Trip updated successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update trip: ' . $stmt->error]);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// DELETE - Delete trip
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'Trip ID required']);
        exit;
    }
    
    try {
        // Check if trip has bookings
        $stmt = $conn->prepare("SELECT COUNT(*) as booking_count FROM bookings WHERE trip_id = ? AND booking_status = 'confirmed'");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['booking_count'] > 0) {
            echo json_encode(['status' => 'error', 'message' => 'Cannot delete trip with active bookings']);
            exit;
        }
        
        $stmt = $conn->prepare("DELETE FROM trips WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Trip deleted successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to delete trip']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
