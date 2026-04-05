<?php
/**
 * Admin Bookings API
 * Handles booking management for administrators
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

// GET - Fetch all bookings
if ($method === 'GET') {
    try {
        $sql = "SELECT b.*, t.departure_date, t.departure_time, t.arrival_time, 
                r.origin, r.destination, r.route_code, 
                bus.bus_number, bus.bus_name,
                u.name as user_name, u.email as user_email
                FROM bookings b
                JOIN trips t ON b.trip_id = t.id
                JOIN routes r ON t.route_id = r.id
                JOIN buses bus ON t.bus_id = bus.id
                JOIN users u ON b.user_id = u.id
                ORDER BY b.created_at DESC";
        
        $result = $conn->query($sql);
        $bookings = [];
        
        while ($row = $result->fetch_assoc()) {
            $bookings[] = $row;
        }
        
        echo json_encode(['status' => 'success', 'bookings' => $bookings]);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch bookings: ' . $e->getMessage()]);
    }
    exit;
}

// POST - Update booking status
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';
    
    if ($action === 'update_status') {
        $booking_id = $data['booking_id'] ?? 0;
        $status = $data['status'] ?? '';
        
        if (!$booking_id || !$status) {
            echo json_encode(['status' => 'error', 'message' => 'Booking ID and status required']);
            exit;
        }
        
        try {
            $stmt = $conn->prepare("UPDATE bookings SET booking_status = ? WHERE id = ?");
            $stmt->bind_param("si", $status, $booking_id);
            
            if ($stmt->execute()) {
                // Notify passenger
                $notif_stmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES (?, 'Booking Status Update', CONCAT('Your booking status has been updated to \"', ?, '\".'), 'booking', 'booking', ?)");
                $user_stmt = $conn->prepare("SELECT user_id FROM bookings WHERE id = ?");
                $user_stmt->bind_param("i", $booking_id);
                $user_stmt->execute();
                $user_result = $user_stmt->get_result();
                $booking_user = $user_result->fetch_assoc();
                
                if ($booking_user) {
                    $notif_stmt->bind_param("isi", $booking_user['user_id'], $status, $booking_id);
                    $notif_stmt->execute();
                }
                
                echo json_encode(['status' => 'success', 'message' => 'Booking status updated']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update booking status']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
    
    if ($action === 'update_payment') {
        $booking_id = $data['booking_id'] ?? 0;
        $payment_status = $data['payment_status'] ?? '';
        
        if (!$booking_id || !$payment_status) {
            echo json_encode(['status' => 'error', 'message' => 'Booking ID and payment status required']);
            exit;
        }
        
        try {
            $stmt = $conn->prepare("UPDATE bookings SET payment_status = ? WHERE id = ?");
            $stmt->bind_param("si", $payment_status, $booking_id);
            
            if ($stmt->execute()) {
                echo json_encode(['status' => 'success', 'message' => 'Payment status updated']);
            } else {
                echo json_encode(['status' => 'error', 'message' => 'Failed to update payment status']);
            }
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
        }
        exit;
    }
}

// DELETE - Cancel booking
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $booking_id = $data['booking_id'] ?? 0;
    
    if (!$booking_id) {
        echo json_encode(['status' => 'error', 'message' => 'Booking ID required']);
        exit;
    }
    
    try {
        // Get booking details
        $stmt = $conn->prepare("SELECT trip_id, number_of_seats FROM bookings WHERE id = ?");
        $stmt->bind_param("i", $booking_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $booking = $result->fetch_assoc();
        
        if ($booking) {
            // Update booking status
            $stmt = $conn->prepare("UPDATE bookings SET booking_status = 'cancelled', cancelled_at = NOW() WHERE id = ?");
            $stmt->bind_param("i", $booking_id);
            $stmt->execute();
            
            // Restore seats
            $stmt = $conn->prepare("UPDATE trips SET available_seats = available_seats + ?, booked_seats = booked_seats - ? WHERE id = ?");
            $stmt->bind_param("iii", $booking['number_of_seats'], $booking['number_of_seats'], $booking['trip_id']);
            $stmt->execute();
            
            echo json_encode(['status' => 'success', 'message' => 'Booking cancelled successfully']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Booking not found']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
