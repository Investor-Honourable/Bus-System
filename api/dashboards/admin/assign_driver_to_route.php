<?php
/**
 * Assign Driver to Route API
 * Assigns a driver to a route - automatically assigns them to all trips on that route
 * 
 * Usage:
 * POST /api/dashboards/admin/assign_driver_to_route.php
 * Body: {
 *   "driver_id": 2,
 *   "route_id": 3,
 *   "bus_id": 1,
 *   "assign_existing_trips": true
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

$driver_id = $data['driver_id'] ?? 0;
$route_id = $data['route_id'] ?? 0;
$bus_id = $data['bus_id'] ?? null;
$assign_existing_trips = $data['assign_existing_trips'] ?? true;

if (!$driver_id || !$route_id) {
    echo json_encode(['status' => 'error', 'message' => 'Driver ID and Route ID are required']);
    exit;
}

try {
    // Verify driver exists and is active
    $stmt = $conn->prepare("SELECT d.id, d.status, u.name, u.email FROM drivers d JOIN users u ON d.user_id = u.id WHERE d.id = ?");
    $stmt->bind_param("i", $driver_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $driver = $result->fetch_assoc();
    
    if (!$driver) {
        echo json_encode(['status' => 'error', 'message' => 'Driver not found']);
        exit;
    }
    
    if ($driver['status'] !== 'active') {
        echo json_encode(['status' => 'error', 'message' => 'Driver is not active']);
        exit;
    }
    
    // Update driver's assigned route and bus
    if ($bus_id) {
        $stmt = $conn->prepare("UPDATE drivers SET assigned_route_id = ?, assigned_bus_id = ? WHERE id = ?");
        $stmt->bind_param("iii", $route_id, $bus_id, $driver_id);
    } else {
        $stmt = $conn->prepare("UPDATE drivers SET assigned_route_id = ? WHERE id = ?");
        $stmt->bind_param("ii", $route_id, $driver_id);
    }
    $stmt->execute();
    
    // Assign driver to existing unassigned trips on this route (future trips only)
    $trips_assigned = 0;
    if ($assign_existing_trips) {
        $stmt = $conn->prepare("UPDATE trips SET driver_id = ? WHERE route_id = ? AND driver_id IS NULL AND departure_date >= CURDATE()");
        $stmt->bind_param("ii", $driver_id, $route_id);
        $stmt->execute();
        $trips_assigned = $stmt->affected_rows;
    }
    
    // Get route info
    $stmt = $conn->prepare("SELECT route_code, origin, destination FROM routes WHERE id = ?");
    $stmt->bind_param("i", $route_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $route = $result->fetch_assoc();
    
    // Create notification for driver
    $message = "You have been assigned to route {$route['origin']} → {$route['destination']}. $trips_assigned trips have been assigned to you.";
    $stmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, type, reference_type) VALUES (?, 'Route Assignment', ?, 'system', 'route')");
    $stmt->bind_param("is", $driver['user_id'], $message);
    $stmt->execute();
    
    echo json_encode([
        'status' => 'success',
        'message' => "Driver assigned to route successfully",
        'details' => [
            'driver_name' => $driver['name'],
            'driver_email' => $driver['email'],
            'route' => $route['origin'] . ' → ' . $route['destination'],
            'trips_assigned' => $trips_assigned,
            'assigned_bus_id' => $bus_id
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

$conn->close();
