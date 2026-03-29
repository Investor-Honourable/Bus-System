<?php
/**
 * Admin Update Schedule API
 * Handles trip status updates
 */

session_start();
require_once '../../config/db.php';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
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
$status = $data['status'] ?? '';

if (!$trip_id || !$status) {
    echo json_encode(['status' => 'error', 'message' => 'Trip ID and status are required']);
    exit;
}

$valid_statuses = ['scheduled', 'boarding', 'in_transit', 'completed', 'cancelled'];
if (!in_array($status, $valid_statuses)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid status']);
    exit;
}

try {
    $stmt = $conn->prepare("UPDATE trips SET status = ? WHERE id = ?");
    $stmt->bind_param("si", $status, $trip_id);
    
    if ($stmt->execute()) {
        // If trip is completed, update driver stats
        if ($status === 'completed') {
            $stmt = $conn->prepare("SELECT driver_id FROM trips WHERE id = ?");
            $stmt->bind_param("i", $trip_id);
            $stmt->execute();
            $result = $stmt->get_result();
            $trip = $result->fetch_assoc();
            
            if ($trip && $trip['driver_id']) {
                $stmt = $conn->prepare("UPDATE drivers SET total_trips = total_trips + 1 WHERE id = ?");
                $stmt->bind_param("i", $trip['driver_id']);
                $stmt->execute();
            }
        }
        
        echo json_encode(['status' => 'success', 'message' => 'Trip status updated successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update trip status']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
