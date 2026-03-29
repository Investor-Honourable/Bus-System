<?php
/**
 * Passenger Cancel Booking API
 * Handles booking cancellation for passengers
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

$booking_id = $data['booking_id'] ?? 0;
$user_id = $data['user_id'] ?? 0;
$reason = $data['reason'] ?? '';

if (!$booking_id || !$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'Booking ID and User ID required']);
    exit;
}

try {
    // Get booking details
    $stmt = $conn->prepare("SELECT trip_id, number_of_seats, booking_status FROM bookings WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $booking_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $booking = $result->fetch_assoc();
    
    if (!$booking) {
        echo json_encode(['status' => 'error', 'message' => 'Booking not found']);
        exit;
    }
    
    if ($booking['booking_status'] !== 'confirmed') {
        echo json_encode(['status' => 'error', 'message' => 'Booking cannot be cancelled']);
        exit;
    }
    
    // Update booking status
    $stmt = $conn->prepare("UPDATE bookings SET booking_status = 'cancelled', cancellation_reason = ?, cancelled_at = NOW() WHERE id = ?");
    $stmt->bind_param("si", $reason, $booking_id);
    
    if ($stmt->execute()) {
        // Restore available seats
        $stmt = $conn->prepare("UPDATE trips SET available_seats = available_seats + ?, booked_seats = booked_seats - ? WHERE id = ?");
        $stmt->bind_param("iii", $booking['number_of_seats'], $booking['number_of_seats'], $booking['trip_id']);
        $stmt->execute();
        
        // Update tickets status
        $stmt = $conn->prepare("UPDATE tickets SET status = 'cancelled' WHERE booking_id = ?");
        $stmt->bind_param("i", $booking_id);
        $stmt->execute();
        
        // Create notification
        $stmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES (?, 'Booking Cancelled', ?, 'cancellation', 'booking', ?)");
        $message = "Your booking has been cancelled. Reason: $reason";
        $stmt->bind_param("ssi", $user_id, $message, $booking_id);
        $stmt->execute();
        
        echo json_encode(['status' => 'success', 'message' => 'Booking cancelled successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to cancel booking']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
