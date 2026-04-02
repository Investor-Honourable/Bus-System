<?php
/**
 * Admin Assign Passenger API
 * Handles passenger assignment to trips/drivers
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

// GET - Fetch passengers for a trip or all passengers
if ($method === 'GET') {
    try {
        $trip_id = $_GET['trip_id'] ?? null;
        
        if ($trip_id) {
            // Get passengers for a specific trip
            $sql = "SELECT b.id, b.passenger_name, b.passenger_email, b.passenger_phone, 
                    b.seat_numbers, b.booking_status, b.total_price,
                    u.name as user_name, u.email as user_email
                    FROM bookings b
                    LEFT JOIN users u ON b.user_id = u.id
                    WHERE b.trip_id = ? AND b.booking_status IN ('confirmed', 'pending')
                    ORDER BY b.created_at DESC";
            
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $trip_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $passengers = [];
            while ($row = $result->fetch_assoc()) {
                $passengers[] = $row;
            }
            
            echo json_encode(['status' => 'success', 'passengers' => $passengers]);
        } else {
            // Get all passengers (users with role 'passenger')
            $sql = "SELECT u.id, u.name, u.email, u.phone, u.gender, u.is_active,
                    COUNT(b.id) as total_bookings
                    FROM users u
                    LEFT JOIN bookings b ON u.id = b.user_id AND b.booking_status IN ('confirmed', 'pending')
                    WHERE u.role = 'passenger'
                    GROUP BY u.id
                    ORDER BY u.name";
            
            $result = $conn->query($sql);
            $passengers = [];
            
            while ($row = $result->fetch_assoc()) {
                $passengers[] = $row;
            }
            
            echo json_encode(['status' => 'success', 'passengers' => $passengers]);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Failed to fetch passengers: ' . $e->getMessage()]);
    }
    exit;
}

// POST - Assign passenger to trip/driver
if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $passenger_id = $data['passenger_id'] ?? 0;
    $trip_id = $data['trip_id'] ?? 0;
    $driver_id = $data['driver_id'] ?? null;
    $seat_number = $data['seat_number'] ?? null;
    
    if (!$passenger_id || !$trip_id) {
        echo json_encode(['status' => 'error', 'message' => 'Passenger ID and Trip ID are required']);
        exit;
    }
    
    try {
        // Check if trip exists and has available seats
        $stmt = $conn->prepare("SELECT available_seats, price FROM trips WHERE id = ? AND status = 'scheduled'");
        $stmt->bind_param("i", $trip_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $trip = $result->fetch_assoc();
        
        if (!$trip) {
            echo json_encode(['status' => 'error', 'message' => 'Trip not found or not available']);
            exit;
        }
        
        if ($trip['available_seats'] < 1) {
            echo json_encode(['status' => 'error', 'message' => 'No available seats on this trip']);
            exit;
        }
        
        // Check if passenger exists
        $stmt = $conn->prepare("SELECT name, email, phone FROM users WHERE id = ? AND role = 'passenger'");
        $stmt->bind_param("i", $passenger_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $passenger = $result->fetch_assoc();
        
        if (!$passenger) {
            echo json_encode(['status' => 'error', 'message' => 'Passenger not found']);
            exit;
        }
        
        // Check if already booked
        $stmt = $conn->prepare("SELECT id FROM bookings WHERE user_id = ? AND trip_id = ? AND booking_status IN ('confirmed', 'pending')");
        $stmt->bind_param("ii", $passenger_id, $trip_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            echo json_encode(['status' => 'error', 'message' => 'Passenger already booked on this trip']);
            exit;
        }
        
        // Generate booking reference
        $booking_reference = 'BK' . date('Ymd') . str_pad(mt_rand(0, 9999), 4, '0', STR_PAD_LEFT);
        
        // Create booking
        $seat_numbers_json = $seat_number ? json_encode([$seat_number]) : json_encode([]);
        $payment_method = 'admin_assigned';
        $payment_status = 'paid';
        $booking_status = 'confirmed';
        
        $stmt = $conn->prepare("INSERT INTO bookings (booking_reference, user_id, trip_id, passenger_name, passenger_email, passenger_phone, seat_numbers, number_of_seats, total_price, payment_method, payment_status, booking_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("siissssisss", $booking_reference, $passenger_id, $trip_id, $passenger['name'], $passenger['email'], $passenger['phone'], $seat_numbers_json, 1, $trip['price'], $payment_method, $payment_status, $booking_status);
        
        if ($stmt->execute()) {
            $booking_id = $conn->insert_id;
            
            // Update available seats
            $stmt = $conn->prepare("UPDATE trips SET available_seats = available_seats - 1, booked_seats = booked_seats + 1 WHERE id = ?");
            $stmt->bind_param("i", $trip_id);
            $stmt->execute();
            
            // Create ticket
            $ticket_code = 'TKT' . date('Ymd') . str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
            $seat = $seat_number ?: 'S1';
            $stmt = $conn->prepare("INSERT INTO tickets (ticket_code, booking_id, trip_id, user_id, seat_number, status) VALUES (?, ?, ?, ?, ?, 'valid')");
            $stmt->bind_param("siiis", $ticket_code, $booking_id, $trip_id, $passenger_id, $seat);
            $stmt->execute();
            
            // Create notification for passenger
            $stmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES (?, 'Trip Assignment', 'You have been assigned to a trip by admin.', 'booking', 'booking', ?)");
            $stmt->bind_param("ii", $passenger_id, $booking_id);
            $stmt->execute();
            
            // If driver is assigned, create notification for driver too
            if ($driver_id) {
                $stmt = $conn->prepare("SELECT user_id FROM drivers WHERE id = ?");
                $stmt->bind_param("i", $driver_id);
                $stmt->execute();
                $result = $stmt->get_result();
                $driver_user = $result->fetch_assoc();
                
                if ($driver_user) {
                    $stmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES (?, 'New Passenger Assigned', 'A new passenger has been assigned to your trip.', 'system', 'trip', ?)");
                    $stmt->bind_param("ii", $driver_user['user_id'], $trip_id);
                    $stmt->execute();
                }
            }
            
            echo json_encode([
                'status' => 'success', 
                'message' => 'Passenger assigned successfully',
                'booking_id' => $booking_id,
                'booking_reference' => $booking_reference,
                'ticket_code' => $ticket_code
            ]);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to assign passenger']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// PUT - Update passenger assignment
if ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $booking_id = $data['booking_id'] ?? 0;
    $trip_id = $data['trip_id'] ?? 0;
    $driver_id = $data['driver_id'] ?? null;
    $seat_number = $data['seat_number'] ?? null;
    $status = $data['status'] ?? 'confirmed';
    
    if (!$booking_id) {
        echo json_encode(['status' => 'error', 'message' => 'Booking ID is required']);
        exit;
    }
    
    try {
        // Get current booking
        $stmt = $conn->prepare("SELECT trip_id, seat_numbers FROM bookings WHERE id = ?");
        $stmt->bind_param("i", $booking_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $booking = $result->fetch_assoc();
        
        if (!$booking) {
            echo json_encode(['status' => 'error', 'message' => 'Booking not found']);
            exit;
        }
        
        // Update booking
        $seat_numbers_json = $seat_number ? json_encode([$seat_number]) : $booking['seat_numbers'];
        $stmt = $conn->prepare("UPDATE bookings SET seat_numbers = ?, booking_status = ? WHERE id = ?");
        $stmt->bind_param("ssi", $seat_numbers_json, $status, $booking_id);
        
        if ($stmt->execute()) {
            // Update ticket if seat changed
            if ($seat_number) {
                $stmt = $conn->prepare("UPDATE tickets SET seat_number = ? WHERE booking_id = ?");
                $stmt->bind_param("si", $seat_number, $booking_id);
                $stmt->execute();
            }
            
            echo json_encode(['status' => 'success', 'message' => 'Passenger assignment updated']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to update assignment']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// DELETE - Remove passenger from trip
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $booking_id = $data['booking_id'] ?? 0;
    
    if (!$booking_id) {
        echo json_encode(['status' => 'error', 'message' => 'Booking ID is required']);
        exit;
    }
    
    try {
        // Get booking details
        $stmt = $conn->prepare("SELECT trip_id, number_of_seats, booking_status FROM bookings WHERE id = ?");
        $stmt->bind_param("i", $booking_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $booking = $result->fetch_assoc();
        
        if (!$booking) {
            echo json_encode(['status' => 'error', 'message' => 'Booking not found']);
            exit;
        }
        
        // Update booking status to cancelled
        $stmt = $conn->prepare("UPDATE bookings SET booking_status = 'cancelled', cancelled_at = NOW() WHERE id = ?");
        $stmt->bind_param("i", $booking_id);
        
        if ($stmt->execute()) {
            // Restore available seats
            $stmt = $conn->prepare("UPDATE trips SET available_seats = available_seats + ?, booked_seats = booked_seats - ? WHERE id = ?");
            $stmt->bind_param("iii", $booking['number_of_seats'], $booking['number_of_seats'], $booking['trip_id']);
            $stmt->execute();
            
            // Update tickets status
            $stmt = $conn->prepare("UPDATE tickets SET status = 'cancelled' WHERE booking_id = ?");
            $stmt->bind_param("i", $booking_id);
            $stmt->execute();
            
            echo json_encode(['status' => 'success', 'message' => 'Passenger removed from trip']);
        } else {
            echo json_encode(['status' => 'error', 'message' => 'Failed to remove passenger']);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Invalid method']);
$conn->close();
