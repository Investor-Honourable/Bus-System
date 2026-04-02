<?php
/**
 * Bulk Trip Creation API
 * Creates multiple trips at once with optional driver auto-assignment
 * 
 * Usage: 
 * POST /api/dashboards/admin/create_bulk_trips.php
 * Body: {
 *   "route_id": 1,
 *   "bus_id": 1,
 *   "driver_id": 2,
 *   "start_date": "2026-04-01",
 *   "end_date": "2026-04-07",
 *   "times": ["06:00:00", "14:00:00"],
 *   "price": 3000,
 *   "auto_assign_driver": true
 * }
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$route_id = $data['route_id'] ?? 0;
$bus_id = $data['bus_id'] ?? 0;
$driver_id = $data['driver_id'] ?? null;
$start_date = $data['start_date'] ?? '';
$end_date = $data['end_date'] ?? '';
$times = $data['times'] ?? ['06:00:00', '14:00:00'];
$price = $data['price'] ?? 0;
$auto_assign_driver = $data['auto_assign_driver'] ?? false;

if (!$route_id || !$bus_id || !$start_date || !$end_date || !$price) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
    exit;
}

try {
    $trips_created = 0;
    $current_date = strtotime($start_date);
    $end_timestamp = strtotime($end_date);
    
    // Get route duration for arrival time calculation
    $stmt = $conn->prepare("SELECT duration_minutes FROM routes WHERE id = ?");
    $stmt->bind_param("i", $route_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $route = $result->fetch_assoc();
    $duration = $route['duration_minutes'] ?? 120;
    
    // Get bus capacity
    $stmt = $conn->prepare("SELECT total_seats FROM buses WHERE id = ?");
    $stmt->bind_param("i", $bus_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $bus = $result->fetch_assoc();
    $seats = $bus['total_seats'] ?? 50;
    
    // If auto_assign_driver is true, get driver's route/bus assignment
    if ($auto_assign_driver && $driver_id) {
        $stmt = $conn->prepare("UPDATE drivers SET assigned_route_id = ?, assigned_bus_id = ? WHERE id = ?");
        $stmt->bind_param("iii", $route_id, $bus_id, $driver_id);
        $stmt->execute();
    }
    
    // Create trips for each date
    while ($current_date <= $end_timestamp) {
        $date_str = date('Y-m-d', $current_date);
        
        foreach ($times as $departure_time) {
            // Calculate arrival time
            $departure_ts = strtotime($date_str . ' ' . $departure_time);
            $arrival_ts = strtotime("+{$duration} minutes", $departure_ts);
            $arrival_time = date('H:i:s', $arrival_ts);
            
            $stmt = $conn->prepare("INSERT INTO trips 
                (bus_id, route_id, driver_id, departure_date, departure_time, arrival_time, price, available_seats, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled')");
            $stmt->bind_param("iiisssdi", $bus_id, $route_id, $driver_id, $date_str, $departure_time, $arrival_time, $price, $seats);
            $stmt->execute();
            $trips_created++;
        }
        
        $current_date = strtotime("+1 day", $current_date);
    }
    
    // Create notification for driver if assigned
    if ($driver_id) {
        $stmt = $conn->prepare("SELECT user_id FROM drivers WHERE id = ?");
        $stmt->bind_param("i", $driver_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $driver_user = $result->fetch_assoc();
        
        if ($driver_user) {
            $message = "You have been assigned to $trips_created new trips from $start_date to $end_date.";
            $stmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, type, reference_type) VALUES (?, 'New Trip Assignments', ?, 'system', 'trip')");
            $stmt->bind_param("is", $driver_user['user_id'], $message);
            $stmt->execute();
        }
    }
    
    echo json_encode([
        'status' => 'success',
        'message' => "Created $trips_created trips",
        'details' => [
            'trips_created' => $trips_created,
            'route_id' => $route_id,
            'bus_id' => $bus_id,
            'driver_id' => $driver_id,
            'date_range' => "$start_date to $end_date",
            'times' => $times
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
