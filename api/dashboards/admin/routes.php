<?php
/**
 * Admin Routes API
 * Handles route management for administrators
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

// GET - Fetch all routes
if ($method === 'GET') {
    try {
        $result = $conn->query("SELECT * FROM routes ORDER BY origin, destination");
        $routes = [];
        
        while ($row = $result->fetch_assoc()) {
            $routes[] = $row;
        }
        
        echo json_encode(['status' => 'success', 'routes' => $routes]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch routes: ' . $e->getMessage()]);
    }
    exit;
}

// POST - Add new route
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $route_code = $data['route_code'] ?? '';
    $origin = $data['origin'] ?? '';
    $destination = $data['destination'] ?? '';
    $distance_km = $data['distance_km'] ?? 0;
    $duration_minutes = $data['duration_minutes'] ?? 0;
    $base_price = $data['base_price'] ?? 0;
    $description = $data['description'] ?? '';
    
    if (!$route_code || !$origin || !$destination || !$distance_km || !$duration_minutes || !$base_price) {
        echo json_encode(['status' => 'error', 'message' => 'All fields are required']);
        exit;
    }
    
    try {
        $stmt = $conn->prepare("INSERT INTO routes (route_code, origin, destination, distance_km, duration_minutes, base_price, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'active')");
        $stmt->bind_param("sssdiis", $route_code, $origin, $destination, $distance_km, $duration_minutes, $base_price, $description);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Route added successfully', 'id' => $conn->insert_id]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add route: ' . $stmt->error]);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// PUT - Update route
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $id = $data['id'] ?? 0;
    $route_code = $data['route_code'] ?? '';
    $origin = $data['origin'] ?? '';
    $destination = $data['destination'] ?? '';
    $distance_km = $data['distance_km'] ?? 0;
    $duration_minutes = $data['duration_minutes'] ?? 0;
    $base_price = $data['base_price'] ?? 0;
    $description = $data['description'] ?? '';
    $status = $data['status'] ?? 'active';
    
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'Route ID required']);
        exit;
    }
    
    try {
        $stmt = $conn->prepare("UPDATE routes SET route_code = ?, origin = ?, destination = ?, distance_km = ?, duration_minutes = ?, base_price = ?, description = ?, status = ? WHERE id = ?");
        $stmt->bind_param("sssdiissi", $route_code, $origin, $destination, $distance_km, $duration_minutes, $base_price, $description, $status, $id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Route updated successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update route: ' . $stmt->error]);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// DELETE - Delete route
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'Route ID required']);
        exit;
    }
    
    try {
        // Check if route has active trips
        $stmt = $conn->prepare("SELECT COUNT(*) as trip_count FROM trips WHERE route_id = ? AND status IN ('scheduled', 'boarding', 'in_transit')");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['trip_count'] > 0) {
            echo json_encode(['status' => 'error', 'message' => 'Cannot delete route with active trips']);
            exit;
        }
        
        $stmt = $conn->prepare("DELETE FROM routes WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Route deleted successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to delete route']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
