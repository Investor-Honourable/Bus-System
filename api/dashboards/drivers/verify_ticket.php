<?php
/**
 * Driver Verify Ticket API
 * Handles ticket verification for drivers
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

$ticket_code = $data['ticket_code'] ?? '';
$booking_ref = $data['booking_ref'] ?? ''; // Also accept booking reference
$user_id = $data['user_id'] ?? 0;

// Allow either ticket_code or booking_ref
if ((!$ticket_code && !$booking_ref) || !$user_id) {
    echo json_encode(['status' => 'error', 'message' => 'Ticket code and User ID required']);
    exit;
}

// Use booking_ref as fallback if ticket_code is empty
if (!$ticket_code && $booking_ref) {
    $ticket_code = $booking_ref;
}

try {
    // Get ticket details
    $sql = "SELECT tk.*, b.booking_reference, b.passenger_name, b.passenger_phone,
            t.departure_date, t.departure_time, t.arrival_time,
            r.origin, r.destination, r.route_code,
            bus.bus_number, bus.bus_name,
            d.user_id as driver_user_id
            FROM tickets tk
            JOIN bookings b ON tk.booking_id = b.id
            JOIN trips t ON tk.trip_id = t.id
            JOIN routes r ON t.route_id = r.id
            JOIN buses bus ON t.bus_id = bus.id
            LEFT JOIN drivers d ON t.driver_id = d.id
            WHERE tk.ticket_code = ?";
    
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $ticket_code);
    $stmt->execute();
    $result = $stmt->get_result();
    $ticket = $result->fetch_assoc();
    
    if (!$ticket) {
        echo json_encode(['status' => 'error', 'message' => 'Ticket not found']);
        exit;
    }
    
    // Verify driver owns this trip
    if ($ticket['driver_user_id'] != $user_id) {
        echo json_encode(['status' => 'error', 'message' => 'Unauthorized access to ticket']);
        exit;
    }
    
    // Check if ticket is already used
    if ($ticket['status'] === 'used') {
        echo json_encode([
            'status' => 'error',
            'message' => 'Ticket already used',
            'ticket' => $ticket
        ]);
        exit;
    }
    
    // Check if ticket is cancelled
    if ($ticket['status'] === 'cancelled') {
        echo json_encode([
            'status' => 'error',
            'message' => 'Ticket has been cancelled',
            'ticket' => $ticket
        ]);
        exit;
    }
    
    // Mark ticket as used
    $stmt = $conn->prepare("UPDATE tickets SET status = 'used', verified_at = NOW(), verified_by = ? WHERE ticket_code = ?");
    $stmt->bind_param("is", $user_id, $ticket_code);
    
    if ($stmt->execute()) {
        echo json_encode([
            'status' => 'success',
            'message' => 'Ticket verified successfully',
            'ticket' => $ticket
        ]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to verify ticket']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
}

$conn->close();
