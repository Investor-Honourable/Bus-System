<?php
/**
 * Admin Buses API
 * Handles bus management for administrators
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

// GET - Fetch all buses
if ($method === 'GET') {
    try {
        $result = $conn->query("SELECT id, bus_number, bus_name, bus_type, total_seats as capacity, available_seats, amenities, license_plate, model, year, color, status FROM buses ORDER BY bus_name");
        $buses = [];
        
        while ($row = $result->fetch_assoc()) {
            $row['amenities'] = json_decode($row['amenities'] ?? '[]');
            $buses[] = $row;
        }
        
        echo json_encode(['status' => 'success', 'buses' => $buses]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch buses: ' . $e->getMessage()]);
    }
    exit;
}

// POST - Add new bus
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $bus_number = $data['bus_number'] ?? '';
    $bus_name = $data['bus_name'] ?? $data['bus_number'] ?? '';
    $bus_type = $data['bus_type'] ?? 'standard';
    $total_seats = intval($data['total_seats'] ?? $data['capacity'] ?? 0);
    $amenities = json_encode($data['amenities'] ?? []);
    $license_plate = $data['license_plate'] ?? 'CE-' . strtoupper(substr($bus_number, -3)) . '-AA';
    $model = $data['model'] ?? '';
    $year = $data['year'] ?? null;
    $color = $data['color'] ?? '';
    
    if (!$bus_number || !$total_seats) {
        echo json_encode(['status' => 'error', 'message' => 'Bus number and capacity are required']);
        exit;
    }
    
    try {
        $stmt = $conn->prepare("INSERT INTO buses (bus_number, bus_name, bus_type, total_seats, available_seats, amenities, license_plate, model, year, color, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')");
        $stmt->bind_param("sssissssis", $bus_number, $bus_name, $bus_type, $total_seats, $total_seats, $amenities, $license_plate, $model, $year, $color);
        
        if ($stmt->execute()) {
            $busId = $conn->insert_id;
            // Notify admins about new bus
            $notifStmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) SELECT id, 'New Bus Added', CONCAT('New bus ', ?, ' has been added to the fleet'), 'admin', 'bus', ? FROM users WHERE role = 'admin'");
            $notifStmt->bind_param("si", $bus_number, $busId);
            $notifStmt->execute();
            $notifStmt->close();
            echo json_encode(['status' => 'success', 'message' => 'Bus added successfully', 'id' => $busId]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to add bus: ' . $stmt->error]);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// PUT - Update bus
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $id = $data['id'] ?? 0;
    $bus_number = $data['bus_number'] ?? '';
    $bus_name = $data['bus_name'] ?? $data['bus_number'] ?? '';
    $bus_type = $data['bus_type'] ?? 'standard';
    $total_seats = intval($data['total_seats'] ?? $data['capacity'] ?? 0);
    $amenities = json_encode($data['amenities'] ?? []);
    $license_plate = $data['license_plate'] ?? 'CE-' . strtoupper(substr($bus_number, -3)) . '-AA';
    $model = $data['model'] ?? '';
    $year = $data['year'] ?? null;
    $color = $data['color'] ?? '';
    $status = $data['status'] ?? 'active';
    
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'Bus ID required']);
        exit;
    }
    
    try {
        $stmt = $conn->prepare("UPDATE buses SET bus_number = ?, bus_name = ?, bus_type = ?, total_seats = ?, amenities = ?, license_plate = ?, model = ?, year = ?, color = ?, status = ? WHERE id = ?");
        $stmt->bind_param("sssissssisi", $bus_number, $bus_name, $bus_type, $total_seats, $amenities, $license_plate, $model, $year, $color, $status, $id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Bus updated successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update bus: ' . $stmt->error]);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// DELETE - Delete bus
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $id = $data['id'] ?? 0;
    
    if (!$id) {
        echo json_encode(['status' => 'error', 'message' => 'Bus ID required']);
        exit;
    }
    
    try {
        // Check if bus has active trips
        $stmt = $conn->prepare("SELECT COUNT(*) as trip_count FROM trips WHERE bus_id = ? AND status IN ('scheduled', 'boarding', 'in_transit')");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        
        if ($row['trip_count'] > 0) {
            echo json_encode(['status' => 'error', 'message' => 'Cannot delete bus with active trips']);
            exit;
        }
        
        $stmt = $conn->prepare("DELETE FROM buses WHERE id = ?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            echo json_encode(['status' => 'success', 'message' => 'Bus deleted successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to delete bus']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
