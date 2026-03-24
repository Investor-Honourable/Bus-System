<?php
// Verify ticket API - accepts booking_reference, ticket_reference, or numeric ID
// Disable error display in production
$is_localhost = in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1', 'localhost']) || 
                strpos($_SERVER['HTTP_HOST'] ?? '', 'localhost') !== false;
if (!$is_localhost) {
    error_reporting(0);
    ini_set('display_errors', 0);
} else {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
}

require_once("../../config/db.php");

// CORS Configuration
$allowed_origins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed_origin = in_array($origin, $allowed_origins) ? $origin : $allowed_origins[0];

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: $allowed_origin");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

$method = $_SERVER["REQUEST_METHOD"];

// Get input data
$input = json_decode(file_get_contents("php://input"), true);
$booking_ref = isset($input["booking_ref"]) ? trim($input["booking_ref"]) : "";
$driver_id = isset($input["driver_id"]) ? intval($input["driver_id"]) : 0;

if ($method === "GET") {
  $booking_ref = isset($_GET["booking_ref"]) ? trim($_GET["booking_ref"]) : "";
  $driver_id = isset($_GET["driver_id"]) ? intval($_GET["driver_id"]) : 0;
}

// Optional driver verification (for role check)
if ($driver_id > 0) {
  $verify_sql = "SELECT id, role FROM users WHERE id = ?";
  $verify_stmt = $conn->prepare($verify_sql);
  $verify_stmt->bind_param("i", $driver_id);
  $verify_stmt->execute();
  $verify_result = $verify_stmt->get_result();
  
  if ($verify_result->num_rows > 0) {
    $user = $verify_result->fetch_assoc();
    // Only drivers or admins can verify tickets
    if ($user['role'] !== 'driver' && $user['role'] !== 'admin' && $user['role'] !== 'super_admin') {
      http_response_code(403);
      echo json_encode(["status" => "error", "message" => "Access denied. Driver or Admin role required."]);
      exit;
    }
  }
}

if ($method === "GET" || $method === "POST") {
  if (empty($booking_ref)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Booking reference is required"]);
    exit;
  }

  // Try to find booking by different methods using prepared statements
  $booking = null;
  $search_terms = [];
  
  // Add all possible search terms
  $search_terms[] = $booking_ref;
  
  // If it's numeric, add as ID
  if (is_numeric($booking_ref)) {
    $search_terms[] = intval($booking_ref);
  }
  
  // Try each search term using prepared statements
  foreach ($search_terms as $term) {
    // Try ticket_reference first
    $stmt = $conn->prepare("SELECT b.*, t.ticket_reference, t.seat_number, t.ticket_status 
            FROM bookings b 
            LEFT JOIN tickets t ON t.booking_id = b.id 
            WHERE t.ticket_reference = ?");
    $stmt->bind_param("s", $term);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if (!$result || $result->num_rows === 0) {
      $stmt->close();
      // Try booking_reference
      $stmt2 = $conn->prepare("SELECT b.*, t.ticket_reference, t.seat_number, t.ticket_status 
               FROM bookings b 
               LEFT JOIN tickets t ON t.booking_id = b.id 
               WHERE b.booking_reference = ?");
      $stmt2->bind_param("s", $term);
      $stmt2->execute();
      $result2 = $stmt2->get_result();
      
      if ($result2 && $result2->num_rows > 0) {
        $booking = $result2->fetch_assoc();
        $stmt2->close();
        break;
      }
      $stmt2->close();
    } else {
      $booking = $result->fetch_assoc();
      $stmt->close();
      break;
    }
  }
  
  // If not found, try by numeric ID
  if (!$booking && is_numeric($booking_ref)) {
    $numeric_id = intval($booking_ref);
    $stmt3 = $conn->prepare("SELECT b.*, t.ticket_reference, t.seat_number, t.ticket_status 
             FROM bookings b 
             LEFT JOIN tickets t ON t.booking_id = b.id 
             WHERE b.id = ?");
    $stmt3->bind_param("i", $numeric_id);
    $stmt3->execute();
    $result3 = $stmt3->get_result();
    if ($result3 && $result3->num_rows > 0) {
      $booking = $result3->fetch_assoc();
    }
    $stmt3->close();
  }
  
  if (!$booking) {
    echo json_encode(["status" => "error", "message" => "Booking not found with reference: " . htmlspecialchars($booking_ref)]);
    exit;
  }
  
  // Get trip details using prepared statement
  $trip_id = intval($booking['trip_id']);
  $trip_stmt = $conn->prepare("SELECT tr.*, r.origin, r.destination, b.bus_number 
               FROM trips tr 
               JOIN routes r ON r.id = tr.route_id 
               JOIN buses b ON b.id = tr.bus_id 
               WHERE tr.id = ?");
  $trip_stmt->bind_param("i", $trip_id);
  $trip_stmt->execute();
  $trip_result = $trip_stmt->get_result();
  $trip = $trip_result->fetch_assoc();
  $trip_stmt->close();
  
  // Check if driver is assigned to this trip using prepared statement
  $is_driver_assigned = false;
  if ($driver_id > 0) {
    $driver_id_val = intval($driver_id);
    $trip_id_val = intval($booking['trip_id']);
    $assign_stmt = $conn->prepare("SELECT id FROM driver_trip_assignments WHERE driver_id = ? AND trip_id = ? AND status = 'active'");
    $assign_stmt->bind_param("ii", $driver_id_val, $trip_id_val);
    $assign_stmt->execute();
    $assign_result = $assign_stmt->get_result();
    $is_driver_assigned = ($assign_result && $assign_result->num_rows > 0);
    $assign_stmt->close();
  }
  
  // Get user details using prepared statement
  $user_id_val = intval($booking['user_id']);
  $user_stmt = $conn->prepare("SELECT name, email, phone FROM users WHERE id = ?");
  $user_stmt->bind_param("i", $user_id_val);
  $user_stmt->execute();
  $user_result = $user_stmt->get_result();
  $user = $user_result->fetch_assoc();
  $user_stmt->close();
  
  // Determine if ticket is valid
  $is_valid = false;
  $validation_message = "";
  
  if ($booking['booking_status'] === 'cancelled') {
    $validation_message = "Booking has been cancelled";
  } elseif ($trip['status'] === 'cancelled') {
    $validation_message = "Trip has been cancelled";
  } elseif (!in_array($trip['status'], ['scheduled', 'in-progress', 'ongoing', 'active'])) {
    $validation_message = "Trip is not available for boarding";
  } elseif ($booking['booking_status'] !== 'confirmed') {
    $validation_message = "Booking is not confirmed";
  } else {
    $is_valid = true;
    $validation_message = "Valid ticket for this trip";
  }
  
  // Build response
  $response = [
    "status" => "success",
    "data" => [
      "booking_id" => intval($booking['id']),
      "booking_ref" => $booking['booking_reference'],
      "ticket_ref" => $booking['ticket_reference'] ?? $booking['booking_reference'],
      "user_name" => $user['name'],
      "user_email" => $user['email'],
      "user_phone" => $user['phone'],
      "trip_id" => intval($booking['trip_id']),
      "origin" => $trip['origin'],
      "destination" => $trip['destination'],
      "departure_date" => $trip['departure_date'],
      "departure_time" => $trip['departure_time'],
      "arrival_time" => $trip['arrival_time'],
      "bus_number" => $trip['bus_number'],
      "trip_status" => $trip['status'],
      "number_of_seats" => intval($booking['number_of_seats']),
      "seat_number" => $booking['seat_number'] ?? "1",
      "total_price" => floatval($booking['total_price']),
      "booking_status" => $booking['booking_status'],
      "ticket_status" => $booking['ticket_status'] ?? 'active',
      "booking_date" => $booking['booking_date'],
      "is_valid" => $is_valid,
      "validation_message" => $validation_message,
      "driver_assigned" => $is_driver_assigned
    ]
  ];
  
  echo json_encode($response);
  exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
