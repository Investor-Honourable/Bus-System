<?php
/**
 * Driver My Trips API
 * Handles trip management for drivers
 * Returns only trips where driver_id is explicitly set in the trips table
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
    $user_id = $data['user_id'] ?? $data['driver_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    try {
        // Get driver ID and assigned route/bus from user ID
        $stmt = $conn->prepare("SELECT d.id, d.assigned_bus_id, d.assigned_route_id FROM drivers d WHERE d.user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $driver = $result->fetch_assoc();
        
        if (!$driver) {
            echo json_encode(['status' => 'error', 'message' => 'Driver not found']);
            exit;
        }
        
        $driver_id = $driver['id'];
        $assigned_bus_id = $driver['assigned_bus_id'];
        $assigned_route_id = $driver['assigned_route_id'];
        
        // Build query to get trips where driver is explicitly assigned
        // Supports pagination and date filtering
        $page = isset($data['page']) ? max(1, intval($data['page'])) : 1;
        $limit = isset($data['limit']) ? max(1, min(50, intval($data['limit']))) : 10;
        $offset = ($page - 1) * $limit;
        
        $date_from = $data['date_from'] ?? null;
        $date_to = $data['date_to'] ?? null;
        
        $sql = "SELECT t.*, r.origin, r.destination, r.route_code, r.distance_km, r.duration_minutes,
                b.bus_number, b.bus_name, b.bus_type, b.license_plate, b.total_seats, b.available_seats as bus_available_seats
                FROM trips t
                JOIN routes r ON t.route_id = r.id
                JOIN buses b ON t.bus_id = b.id
                WHERE t.driver_id = ?";
        
        $params = [$driver_id];
        $types = "i";
        
        if ($date_from) {
            $sql .= " AND t.departure_date >= ?";
            $params[] = $date_from;
            $types .= "s";
        }
        
        if ($date_to) {
            $sql .= " AND t.departure_date <= ?";
            $params[] = $date_to;
            $types .= "s";
        }
        
        $sql .= " ORDER BY t.departure_date ASC, t.departure_time ASC LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= "ii";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $trips = [];
        while ($row = $result->fetch_assoc()) {
            $trips[] = $row;
        }
        
        // Get total count for pagination
        $count_sql = "SELECT COUNT(*) as total FROM trips t WHERE t.driver_id = ?";
        $params_count = [$driver_id];
        $types_count = "i";
        if ($date_from) {
            $count_sql .= " AND t.departure_date >= ?";
            $params_count[] = $date_from;
            $types_count .= "s";
        }
        if ($date_to) {
            $count_sql .= " AND t.departure_date <= ?";
            $params_count[] = $date_to;
            $types_count .= "s";
        }
        $stmt_count = $conn->prepare($count_sql);
        $stmt_count->bind_param($types_count, ...$params_count);
        $stmt_count->execute();
        $result_count = $stmt_count->get_result();
        $total_count = $result_count->fetch_assoc()['total'];
        
        // Also return driver assignment info for the dashboard
        $assignment_info = [
            'driver_id' => $driver_id,
            'assigned_route_id' => $assigned_route_id,
            'assigned_bus_id' => $assigned_bus_id
        ];
        
        echo json_encode([
            'status' => 'success', 
            'trips' => $trips, 
            'assignment' => $assignment_info,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total_count,
                'pages' => ceil($total_count / $limit)
            ]
        ]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch trips: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
