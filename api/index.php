<?php
/**
 * CamTransit Bus Management System - Main API Entry Point
 * Version: 2.0
 * Handles: routes, buses, trips, bookings, tickets
 */

session_start();
require 'config/db.php';

// CORS Configuration
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origin = in_array($origin, $allowed_origins) ? $origin : $allowed_origins[0];

header("Access-Control-Allow-Origin: $allowed_origin");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, User-ID, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// Log CORS origin for debugging
error_log("Request origin: $origin");

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Disable error display in production
$is_localhost = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1', 'localhost']) || 
                strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false;
if (!$is_localhost) {
    ini_set('display_errors', 0);
    error_reporting(0);
}

// ============ HELPER FUNCTIONS ============

function createNotification($conn, $userId, $title, $message, $type, $referenceType = null, $referenceId = null) {
    try {
        $stmt = $conn->prepare("INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, ?)");
        $refType = $referenceType ?? '';
        $refId = $referenceId ?? 0;
        $stmt->bind_param("isssii", $userId, $title, $message, $type, $refType, $refId);
        $stmt->execute();
        return $conn->insert_id;
    } catch (Exception $e) {
        error_log("Notification error: " . $e->getMessage());
        return null;
    }
}

function sendNotificationToAll($conn, $title, $message, $type, $role = null) {
    try {
        if ($role) {
            $stmt = $conn->prepare("SELECT id FROM users WHERE role = ?");
            $stmt->bind_param("s", $role);
            $stmt->execute();
            $result = $stmt->get_result();
        } else {
            $result = $conn->query("SELECT id FROM users");
        }
        
        $count = 0;
        while ($row = $result->fetch_assoc()) {
            createNotification($conn, $row['id'], $title, $message, $type);
            $count++;
        }
        return $count;
    } catch (Exception $e) {
        error_log("Send to all error: " . $e->getMessage());
        return 0;
    }
}

function generateBookingReference() {
    return 'BK' . date('Ymd') . str_pad(mt_rand(0, 9999), 4, '0', STR_PAD_LEFT);
}

function generateTicketCode() {
    return 'TKT' . date('Ymd') . str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
}

// Get request method and data
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);
$action = $data['action'] ?? '';

// ============= AUTHENTICATION =============
if ($action === 'login' || $action === 'register') {
    require 'auth.php';
    exit;
}

// ============= GET ROUTES =============
if ($action === 'get_routes' || ($method === 'GET' && strpos($_SERVER['REQUEST_URI'], 'routes') !== false)) {
    $result = $conn->query("SELECT * FROM routes WHERE status = 'active' ORDER BY origin, destination");
    $routes = [];
    while ($row = $result->fetch_assoc()) {
        $routes[] = $row;
    }
    echo json_encode(['status' => 'success', 'routes' => $routes]);
    exit;
}

// ============= GET BUSES =============
if ($action === 'get_buses' || ($method === 'GET' && strpos($_SERVER['REQUEST_URI'], 'buses') !== false)) {
    $result = $conn->query("SELECT * FROM buses WHERE status = 'active' ORDER BY bus_name");
    $buses = [];
    while ($row = $result->fetch_assoc()) {
        $row['amenities'] = json_decode($row['amenities'] ?? '[]');
        $buses[] = $row;
    }
    echo json_encode(['status' => 'success', 'buses' => $buses]);
    exit;
}

// ============= GET TRIPS =============
if ($action === 'get_trips') {
    $origin = $data['origin'] ?? '';
    $destination = $data['destination'] ?? '';
    $date = $data['date'] ?? '';
    
    $sql = "SELECT t.*, r.origin, r.destination, r.distance_km, r.duration_minutes, r.route_code,
            b.bus_number, b.bus_name, b.bus_type, b.amenities, b.license_plate,
            d.license_number AS driver_license, u.name AS driver_name, u.phone AS driver_phone, d.rating AS driver_rating
            FROM trips t 
            JOIN routes r ON t.route_id = r.id 
            JOIN buses b ON t.bus_id = b.id 
            LEFT JOIN drivers d ON t.driver_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
            WHERE t.status = 'scheduled' AND t.available_seats > 0";
    
    $params = [];
    $types = "";
    
    if ($origin) {
        $sql .= " AND r.origin LIKE ?";
        $params[] = "%$origin%";
        $types .= "s";
    }
    if ($destination) {
        $sql .= " AND r.destination LIKE ?";
        $params[] = "%$destination%";
        $types .= "s";
    }
    if ($date) {
        $sql .= " AND t.departure_date = ?";
        $params[] = $date;
        $types .= "s";
    }
    
    $sql .= " ORDER BY t.departure_date, t.departure_time";
    
    $stmt = $conn->prepare($sql);
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $stmt->execute();
    $result = $stmt->get_result();
    
    $trips = [];
    while ($row = $result->fetch_assoc()) {
        $row['amenities'] = json_decode($row['amenities'] ?? '[]');
        $trips[] = $row;
    }
    echo json_encode(['status' => 'success', 'trips' => $trips]);
    exit;
}

// ============= CREATE BOOKING =============
if ($action === 'create_booking') {
    try {
        $user_id = $data['user_id'] ?? 0;
        $trip_id = $data['trip_id'] ?? 0;
        $passenger_name = $data['passenger_name'] ?? '';
        $passenger_email = $data['passenger_email'] ?? '';
        $passenger_phone = $data['passenger_phone'] ?? '';
        $number_of_seats = $data['number_of_seats'] ?? 1;
        $payment_method = $data['payment_method'] ?? 'mobile_money';
        
        // Log booking attempt for debugging
        error_log("Booking attempt - user_id: $user_id, trip_id: $trip_id, seats: $number_of_seats, payment: $payment_method");
        error_log("Booking data: " . json_encode($data));
        
        if (!$user_id || !$trip_id || !$passenger_name) {
            error_log("Booking failed: Missing required fields - user_id: $user_id, trip_id: $trip_id, passenger_name: $passenger_name");
            echo json_encode(['status' => 'error', 'message' => 'Missing required fields: user_id, trip_id, and passenger_name are required']);
            exit;
        }
        
        // Check available seats
        $stmt = $conn->prepare("SELECT available_seats, price FROM trips WHERE id = ?");
        if (!$stmt) {
            error_log("Booking failed: Prepare statement failed - " . $conn->error);
            echo json_encode(['status' => 'error', 'message' => 'Database error. Please try again.']);
            exit;
        }
        
        $stmt->bind_param("i", $trip_id);
        if (!$stmt->execute()) {
            error_log("Booking failed: Execute failed - " . $stmt->error);
            echo json_encode(['status' => 'error', 'message' => 'Database error. Please try again.']);
            exit;
        }
        
        $result = $stmt->get_result();
        $trip = $result->fetch_assoc();
        
        if (!$trip) {
            error_log("Booking failed: Trip not found - trip_id: $trip_id");
            echo json_encode(['status' => 'error', 'message' => 'Trip not found']);
            exit;
        }
        
        if ($trip['available_seats'] < $number_of_seats) {
            error_log("Booking failed: Not enough seats - requested: $number_of_seats, available: {$trip['available_seats']}");
            echo json_encode(['status' => 'error', 'message' => 'Not enough seats available', 'available_seats' => $trip['available_seats']]);
            exit;
        }
        
        $booking_reference = generateBookingReference();
        $total_price = $trip['price'] * $number_of_seats;
        $seat_numbers_json = json_encode($data['seat_numbers'] ?? []);
        
        // Create booking
        $stmt = $conn->prepare("INSERT INTO bookings (booking_reference, user_id, trip_id, passenger_name, passenger_email, passenger_phone, seat_numbers, number_of_seats, total_price, payment_method, booking_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')");
        if (!$stmt) {
            error_log("Booking failed: Prepare insert failed - " . $conn->error);
            echo json_encode(['status' => 'error', 'message' => 'Database error. Please try again.']);
            exit;
        }
        
        $stmt->bind_param("siisssisds", $booking_reference, $user_id, $trip_id, $passenger_name, $passenger_email, $passenger_phone, $seat_numbers_json, $number_of_seats, $total_price, $payment_method);
        
        if ($stmt->execute()) {
            $booking_id = $conn->insert_id;
            
            error_log("Booking created successfully - booking_id: $booking_id, reference: $booking_reference, user_id: $user_id, trip_id: $trip_id, total_price: $total_price");
            
            // Update available seats
            $stmt = $conn->prepare("UPDATE trips SET available_seats = available_seats - ?, booked_seats = booked_seats + ? WHERE id = ?");
            if ($stmt) {
                $stmt->bind_param("iii", $number_of_seats, $number_of_seats, $trip_id);
                $stmt->execute();
                error_log("Updated available seats for trip_id: $trip_id");
            }
            
            // Create tickets
            $tickets = [];
            $seat_numbers_array = $data['seat_numbers'] ?? [];
            for ($i = 0; $i < $number_of_seats; $i++) {
                $ticket_code = generateTicketCode();
                $seat_number = isset($seat_numbers_array[$i]) ? $seat_numbers_array[$i] : 'S' . ($i + 1);
                $stmt = $conn->prepare("INSERT INTO tickets (ticket_code, booking_id, trip_id, user_id, seat_number, status) VALUES (?, ?, ?, ?, ?, 'valid')");
                if ($stmt) {
                    $stmt->bind_param("siiis", $ticket_code, $booking_id, $trip_id, $user_id, $seat_number);
                    $stmt->execute();
                    $tickets[] = ['ticket_code' => $ticket_code, 'seat_number' => $seat_number];
                    error_log("Created ticket: $ticket_code for seat: $seat_number");
                }
            }
            
            // Create notification
            createNotification($conn, $user_id, 'Booking Confirmed', "Your booking $booking_reference has been confirmed.", 'booking', 'booking', $booking_id);
            
            error_log("Booking successful - booking_id: $booking_id, reference: $booking_reference, tickets: " . count($tickets));
            
            echo json_encode([
                'status' => 'success',
                'message' => 'Booking created successfully',
                'booking' => [
                    'id' => $booking_id,
                    'reference' => $booking_reference,
                    'total_price' => $total_price,
                    'tickets' => $tickets
                ]
            ]);
        } else {
            error_log("Booking failed: Database error - " . $conn->error);
            echo json_encode(['status' => 'error', 'message' => 'Failed to create booking. Please try again.']);
        }
    } catch (Exception $e) {
        error_log("Booking exception: " . $e->getMessage());
        echo json_encode(['status' => 'error', 'message' => 'An error occurred. Please try again.']);
    }
    exit;
}

// ============= GET USER BOOKINGS =============
if ($action === 'get_user_bookings') {
    $user_id = $data['user_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT b.*, t.departure_date, t.departure_time, t.arrival_time, r.origin, r.destination, r.route_code, bus.bus_number, bus.bus_name FROM bookings b JOIN trips t ON b.trip_id = t.id JOIN routes r ON t.route_id = r.id JOIN buses bus ON t.bus_id = bus.id WHERE b.user_id = ? ORDER BY b.created_at DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $bookings = [];
    while ($row = $result->fetch_assoc()) {
        $bookings[] = $row;
    }
    echo json_encode(['status' => 'success', 'bookings' => $bookings]);
    exit;
}

// ============= CANCEL BOOKING =============
if ($action === 'cancel_booking') {
    $booking_id = $data['booking_id'] ?? 0;
    $user_id = $data['user_id'] ?? 0;
    $reason = $data['reason'] ?? '';
    
    if (!$booking_id || !$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'Booking ID and User ID required']);
        exit;
    }
    
    // Get booking details
    $stmt = $conn->prepare("SELECT trip_id, number_of_seats, booking_status FROM bookings WHERE id = ? AND user_id = ?");
    $stmt->bind_param("ii", $booking_id, $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $booking = $result->fetch_assoc();
    
    if (!$booking || $booking['booking_status'] !== 'confirmed') {
        echo json_encode(['status' => 'error', 'message' => 'Booking not found or already cancelled']);
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
        createNotification($conn, $user_id, 'Booking Cancelled', "Your booking has been cancelled. Reason: $reason", 'cancellation', 'booking', $booking_id);
        
        echo json_encode(['status' => 'success', 'message' => 'Booking cancelled successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to cancel booking']);
    }
    exit;
}

// ============= GET USER TICKETS =============
if ($action === 'get_user_tickets') {
    $user_id = $data['user_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT tk.*, b.booking_reference, t.departure_date, t.departure_time, t.arrival_time, r.origin, r.destination, r.route_code, bus.bus_number, bus.bus_name FROM tickets tk JOIN bookings b ON tk.booking_id = b.id JOIN trips t ON tk.trip_id = t.id JOIN routes r ON t.route_id = r.id JOIN buses bus ON t.bus_id = bus.id WHERE tk.user_id = ? ORDER BY tk.created_at DESC");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $tickets = [];
    while ($row = $result->fetch_assoc()) {
        $tickets[] = $row;
    }
    echo json_encode(['status' => 'success', 'tickets' => $tickets]);
    exit;
}

// ============= GET TRIP DETAILS =============
if ($action === 'get_trip_details') {
    $trip_id = $data['trip_id'] ?? 0;
    
    if (!$trip_id) {
        echo json_encode(['status' => 'error', 'message' => 'Trip ID required']);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT t.*, r.origin, r.destination, r.distance_km, r.duration_minutes, r.route_code, b.bus_number, b.bus_name, b.bus_type, b.amenities, b.license_plate, d.license_number AS driver_license, u.name AS driver_name, u.phone AS driver_phone, d.rating AS driver_rating FROM trips t JOIN routes r ON t.route_id = r.id JOIN buses b ON t.bus_id = b.id LEFT JOIN drivers d ON t.driver_id = d.id LEFT JOIN users u ON d.user_id = u.id WHERE t.id = ?");
    $stmt->bind_param("i", $trip_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $trip = $result->fetch_assoc();
    
    if ($trip) {
        $trip['amenities'] = json_decode($trip['amenities'] ?? '[]');
        echo json_encode(['status' => 'success', 'trip' => $trip]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Trip not found']);
    }
    exit;
}

// ============= GET USER NOTIFICATIONS =============
if ($action === 'get_notifications') {
    $user_id = $data['user_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $notifications = [];
    while ($row = $result->fetch_assoc()) {
        $notifications[] = $row;
    }
    echo json_encode(['status' => 'success', 'notifications' => $notifications]);
    exit;
}

// ============= MARK NOTIFICATION AS READ =============
if ($action === 'mark_notification_read') {
    $notification_id = $data['notification_id'] ?? 0;
    
    if (!$notification_id) {
        echo json_encode(['status' => 'error', 'message' => 'Notification ID required']);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE notifications SET is_read = TRUE WHERE id = ?");
    $stmt->bind_param("i", $notification_id);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Notification marked as read']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update notification']);
    }
    exit;
}

// ============= MARK ALL NOTIFICATIONS AS READ =============
if ($action === 'mark_all_notifications_read') {
    $user_id = $data['user_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE notifications SET is_read = TRUE WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'All notifications marked as read']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update notifications']);
    }
    exit;
}

// ============= GET USER PROFILE =============
if ($action === 'get_user_profile') {
    $user_id = $data['user_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT id, name, username, email, phone, gender, role, avatar, created_at FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    
    if ($user) {
        echo json_encode(['status' => 'success', 'user' => $user]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'User not found']);
    }
    exit;
}

// ============= UPDATE USER PROFILE =============
if ($action === 'update_user_profile') {
    $user_id = $data['user_id'] ?? 0;
    $name = $data['name'] ?? '';
    $phone = $data['phone'] ?? '';
    $gender = $data['gender'] ?? '';
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE users SET name = ?, phone = ?, gender = ? WHERE id = ?");
    $stmt->bind_param("sssi", $name, $phone, $gender, $user_id);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Profile updated successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update profile']);
    }
    exit;
}

// ============= GET USER SETTINGS =============
if ($action === 'get_user_settings') {
    $user_id = $data['user_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT * FROM user_settings WHERE user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $settings = $result->fetch_assoc();
    
    if ($settings) {
        echo json_encode(['status' => 'success', 'settings' => $settings]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Settings not found']);
    }
    exit;
}

// ============= UPDATE USER SETTINGS =============
if ($action === 'update_user_settings') {
    $user_id = $data['user_id'] ?? 0;
    $email_notifications = $data['email_notifications'] ?? 1;
    $sms_notifications = $data['sms_notifications'] ?? 1;
    $booking_confirmations = $data['booking_confirmations'] ?? 1;
    $trip_reminders = $data['trip_reminders'] ?? 1;
    $promotions = $data['promotions'] ?? 0;
    $language = $data['language'] ?? 'en';
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    $stmt = $conn->prepare("UPDATE user_settings SET email_notifications = ?, sms_notifications = ?, booking_confirmations = ?, trip_reminders = ?, promotions = ?, language = ? WHERE user_id = ?");
    $stmt->bind_param("iiiissi", $email_notifications, $sms_notifications, $booking_confirmations, $trip_reminders, $promotions, $language, $user_id);
    
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success', 'message' => 'Settings updated successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to update settings']);
    }
    exit;
}

// ============= AUTO SETUP =============
if ($action === 'auto_setup') {
    // Check if data already exists
    $result = $conn->query("SELECT COUNT(*) as count FROM routes WHERE status = 'active'");
    $row = $result->fetch_assoc();
    
    if ($row['count'] > 0) {
        echo json_encode(['status' => 'success', 'setup' => false, 'message' => 'Data already exists']);
        exit;
    }
    
    // Create sample routes
    $routes = [
        ['Douala', 'Yaoundé', 3500, 180, 250],
        ['Douala', 'Kribi', 2500, 120, 150],
        ['Douala', 'Bafoussam', 3000, 150, 200],
        ['Yaoundé', 'Bafoussam', 2800, 140, 180],
        ['Douala', 'Limbe', 2000, 90, 100],
        ['Yaoundé', 'Douala', 3500, 180, 250],
        ['Kribi', 'Douala', 2500, 120, 150],
        ['Bafoussam', 'Douala', 3000, 150, 200],
        ['Bafoussam', 'Yaoundé', 2800, 140, 180],
        ['Limbe', 'Douala', 2000, 90, 100]
    ];
    
    $stmt = $conn->prepare("INSERT INTO routes (origin, destination, base_price, duration_minutes, distance_km, status) VALUES (?, ?, ?, ?, ?, 'active')");
    
    foreach ($routes as $route) {
        $stmt->bind_param("ssdii", $route[0], $route[1], $route[2], $route[3], $route[4]);
        $stmt->execute();
    }
    
    // Create sample buses
    $buses = [
        ['CamTransit Express', 'CT-001', 'VIP', 50, 'DLA-YDE'],
        ['CamTransit Standard', 'CT-002', 'Standard', 50, 'DLA-KRI'],
        ['CamTransit Premium', 'CT-003', 'VIP', 45, 'DLA-BFM'],
        ['CamTransit Economy', 'CT-004', 'Standard', 55, 'YDE-BFM'],
        ['CamTransit Luxury', 'CT-005', 'VIP', 40, 'DLA-LIM']
    ];
    
    $stmt = $conn->prepare("INSERT INTO buses (bus_name, bus_number, bus_type, total_seats, license_plate, status) VALUES (?, ?, ?, ?, ?, 'active')");
    
    foreach ($buses as $bus) {
        $stmt->bind_param("sssds", $bus[0], $bus[1], $bus[2], $bus[3], $bus[4]);
        $stmt->execute();
    }
    
    // Create sample trips
    $today = date('Y-m-d');
    $tomorrow = date('Y-m-d', strtotime('+1 day'));
    $dayAfter = date('Y-m-d', strtotime('+2 days'));
    
    $trips = [
        [1, 1, $today, '08:00:00', '11:00:00', 3500, 50],
        [1, 1, $today, '14:00:00', '17:00:00', 3500, 50],
        [2, 2, $today, '09:00:00', '11:00:00', 2500, 50],
        [3, 3, $tomorrow, '07:00:00', '09:30:00', 3000, 45],
        [4, 4, $tomorrow, '10:00:00', '12:20:00', 2800, 55],
        [5, 5, $dayAfter, '08:30:00', '10:00:00', 2000, 40]
    ];
    
    $stmt = $conn->prepare("INSERT INTO trips (route_id, bus_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')");
    
    foreach ($trips as $trip) {
        $stmt->bind_param("iisssdi", $trip[0], $trip[1], $trip[2], $trip[3], $trip[4], $trip[5], $trip[6]);
        $stmt->execute();
    }
    
    echo json_encode(['status' => 'success', 'setup' => true, 'message' => 'Sample data created successfully']);
    exit;
}

// ============= GET STATS =============
if ($action === 'get_stats') {
    $user_id = $data['user_id'] ?? 0;
    
    if (!$user_id) {
        echo json_encode(['status' => 'error', 'message' => 'User ID required']);
        exit;
    }
    
    error_log("Getting stats for user_id: $user_id");
    
    // Get completed trips (confirmed bookings are considered completed for stats)
    $stmt = $conn->prepare("SELECT COUNT(*) as completed_trips FROM bookings WHERE user_id = ? AND booking_status IN ('completed', 'confirmed')");
    if (!$stmt) {
        error_log("Stats query 1 failed: " . $conn->error);
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
        exit;
    }
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $completed = $result->fetch_assoc();
    error_log("Completed trips: " . json_encode($completed));
    
    // Get upcoming trips
    $stmt = $conn->prepare("SELECT COUNT(*) as upcoming_trips FROM bookings WHERE user_id = ? AND booking_status IN ('confirmed', 'pending') AND departure_date >= CURDATE()");
    if (!$stmt) {
        error_log("Stats query 2 failed: " . $conn->error);
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
        exit;
    }
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $upcoming = $result->fetch_assoc();
    error_log("Upcoming trips: " . json_encode($upcoming));
    
    // Get total spent (confirmed bookings are considered spent)
    $stmt = $conn->prepare("SELECT COALESCE(SUM(total_price), 0) as total_spent FROM bookings WHERE user_id = ? AND booking_status IN ('completed', 'confirmed')");
    if (!$stmt) {
        error_log("Stats query 3 failed: " . $conn->error);
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
        exit;
    }
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $spent = $result->fetch_assoc();
    error_log("Total spent: " . json_encode($spent));
    
    // Get favorite route (confirmed bookings are considered for favorite route)
    $stmt = $conn->prepare("SELECT r.origin, r.destination, COUNT(*) as trip_count FROM bookings b JOIN trips t ON b.trip_id = t.id JOIN routes r ON t.route_id = r.id WHERE b.user_id = ? AND b.booking_status IN ('completed', 'confirmed') GROUP BY r.id ORDER BY trip_count DESC LIMIT 1");
    if (!$stmt) {
        error_log("Stats query 4 failed: " . $conn->error);
        echo json_encode(['status' => 'error', 'message' => 'Database error']);
        exit;
    }
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $favorite = $result->fetch_assoc();
    error_log("Favorite route: " . json_encode($favorite));
    
    $stats = [
        'completed_trips' => $completed['completed_trips'] ?? 0,
        'upcoming_trips' => $upcoming['upcoming_trips'] ?? 0,
        'total_spent' => $spent['total_spent'] ?? 0,
        'favorite_route' => $favorite ? "{$favorite['origin']} - {$favorite['destination']}" : 'N/A'
    ];
    
    error_log("Stats: " . json_encode($stats));
    
    echo json_encode(['status' => 'success', 'stats' => $stats]);
    exit;
}

// ============= GET BOOKED SEATS =============
if ($action === 'get_booked_seats') {
    $trip_id = $data['trip_id'] ?? 0;
    
    if (!$trip_id) {
        echo json_encode(['status' => 'error', 'message' => 'Trip ID required']);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT seat_numbers FROM bookings WHERE trip_id = ? AND booking_status IN ('confirmed', 'pending')");
    $stmt->bind_param("i", $trip_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $booked_seats = [];
    while ($row = $result->fetch_assoc()) {
        $seat_numbers = $row['seat_numbers'];
        // Handle both JSON array and comma-separated string formats
        if (strpos($seat_numbers, '[') === 0) {
            // JSON array format
            $seats = json_decode($seat_numbers, true) ?? [];
            foreach ($seats as $seat) {
                if ($seat !== '') {
                    $booked_seats[] = (int)$seat;
                }
            }
        } else {
            // Comma-separated string format (legacy)
            $seats = explode(',', $seat_numbers);
            foreach ($seats as $seat) {
                $seat = trim($seat);
                if ($seat !== '') {
                    $booked_seats[] = (int)$seat;
                }
            }
        }
    }
    
    echo json_encode(['status' => 'success', 'booked_seats' => $booked_seats]);
    exit;
}

// ============= VALIDATE SEATS =============
if ($action === 'validate_seats') {
    $trip_id = $data['trip_id'] ?? 0;
    $seat_numbers = $data['seat_numbers'] ?? [];
    
    if (!$trip_id || empty($seat_numbers)) {
        echo json_encode(['status' => 'error', 'message' => 'Trip ID and seat numbers required']);
        exit;
    }
    
    // Get booked seats for this trip
    $stmt = $conn->prepare("SELECT seat_numbers FROM bookings WHERE trip_id = ? AND booking_status IN ('confirmed', 'pending')");
    $stmt->bind_param("i", $trip_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $booked_seats = [];
    while ($row = $result->fetch_assoc()) {
        $seat_numbers_data = $row['seat_numbers'];
        // Handle both JSON array and comma-separated string formats
        if (strpos($seat_numbers_data, '[') === 0) {
            // JSON array format
            $seats = json_decode($seat_numbers_data, true) ?? [];
            foreach ($seats as $seat) {
                if ($seat !== '') {
                    $booked_seats[] = (int)$seat;
                }
            }
        } else {
            // Comma-separated string format (legacy)
            $seats = explode(',', $seat_numbers_data);
            foreach ($seats as $seat) {
                $seat = trim($seat);
                if ($seat !== '') {
                    $booked_seats[] = (int)$seat;
                }
            }
        }
    }
    
    // Check if any of the requested seats are already booked
    $conflicts = array_intersect($seat_numbers, $booked_seats);
    
    if (!empty($conflicts)) {
        echo json_encode(['status' => 'error', 'message' => 'Some seats are already booked', 'taken_seats' => $conflicts]);
        exit;
    }
    
    echo json_encode(['status' => 'success', 'message' => 'Seats are available']);
    exit;
}

// ============= CREATE TRIP FOR ROUTE =============
if ($action === 'create_trip_for_route') {
    $route_id = $data['route_id'] ?? 0;
    $date = $data['date'] ?? '';
    
    if (!$route_id) {
        echo json_encode(['status' => 'error', 'message' => 'Route ID required']);
        exit;
    }
    
    // Get route details
    $stmt = $conn->prepare("SELECT * FROM routes WHERE id = ? AND status = 'active'");
    $stmt->bind_param("i", $route_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $route = $result->fetch_assoc();
    
    if (!$route) {
        echo json_encode(['status' => 'error', 'message' => 'Route not found']);
        exit;
    }
    
    // Get an available bus
    $stmt = $conn->prepare("SELECT id FROM buses WHERE status = 'active' ORDER BY RAND() LIMIT 1");
    $stmt->execute();
    $result = $stmt->get_result();
    $bus = $result->fetch_assoc();
    
    if (!$bus) {
        echo json_encode(['status' => 'error', 'message' => 'No buses available']);
        exit;
    }
    
    // Create a trip for this route
    $departure_date = $date ?: date('Y-m-d');
    $departure_time = '09:00:00';
    $arrival_time = date('H:i:s', strtotime($departure_time . ' + ' . ($route['duration_minutes'] ?: 180) . ' minutes'));
    $price = $route['base_price'] ?: 3000;
    $available_seats = 50;
    
    $stmt = $conn->prepare("INSERT INTO trips (route_id, bus_id, departure_date, departure_time, arrival_time, price, available_seats, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled')");
    $stmt->bind_param("iisssdi", $route_id, $bus['id'], $departure_date, $departure_time, $arrival_time, $price, $available_seats);
    
    if ($stmt->execute()) {
        $trip_id = $conn->insert_id;
        echo json_encode(['status' => 'success', 'trip_id' => $trip_id, 'message' => 'Trip created successfully']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to create trip']);
    }
    exit;
}

// ============= INVALID ACTION =============
echo json_encode(['status' => 'error', 'message' => 'Invalid action']);

$conn->close();
