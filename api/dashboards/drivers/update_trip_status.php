<?php
/**
 * Driver Update Trip Status API
 * Handles trip status updates by drivers
 */

session_start();
require_once '../../config/db.php';

// CORS headers
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, User-ID");
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
$user_id = $data['user_id'] ?? 0;
$status = $data['status'] ?? '';

if (!$trip_id || !$user_id || !$status) {
    echo json_encode(['status' => 'error', 'message' => 'Trip ID, User ID, and status are required']);
    exit;
}

$valid_statuses = ['scheduled', 'boarding', 'in_transit', 'completed', 'cancelled'];
if (!in_array($status, $valid_statuses)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid status']);
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
    
    // Update trip status
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
        
            // Notify passengers on this trip
            $passengers_stmt = $conn->prepare("SELECT DISTINCT u.id as user_id FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.trip_id = ? AND b.booking_status != 'cancelled'");
            $passengers_stmt->bind_param("i", $trip_id);
            $passengers_stmt->execute();
            $passengers_result = $passengers_stmt->get_result();
            
            while ($passenger = $passengers_result->fetch_assoc()) {
                $notif_stmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES (?, ?, ?, 'trip', 'trip_status', ?)");
                $title = "Trip Status Update";
                $message = "Your trip status has been updated to '$status'.";
                $notif_stmt->bind_param("issi", $passenger['user_id'], $title, $message, $trip_id);
                $notif_stmt->execute();
            }
            
            echo json_encode(['status' => 'success', 'message' => 'Trip status updated successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update trip status']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
