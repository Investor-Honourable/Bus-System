<?php
// Verify ticket API - accepts booking_reference, ticket_reference, or numeric ID
error_reporting(0);
ini_set('display_errors', 0);

require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

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

  // Try to find booking by different methods
  $booking = null;
  $search_terms = [];
  
  // Add all possible search terms
  $search_terms[] = $booking_ref;
  
  // If it's numeric, add as ID
  if (is_numeric($booking_ref)) {
    $search_terms[] = intval($booking_ref);
  }
  
  // Try each search term
  foreach ($search_terms as $term) {
    // Try ticket_reference first
    $sql = "SELECT b.*, t.ticket_reference, t.seat_number, t.ticket_status 
            FROM bookings b 
            LEFT JOIN tickets t ON t.booking_id = b.id 
            WHERE t.ticket_reference = '" . $conn->real_escape_string($term) . "'";
    $result = $conn->query($sql);
    
    if (!$result || $result->num_rows === 0) {
      // Try booking_reference
      $sql2 = "SELECT b.*, t.ticket_reference, t.seat_number, t.ticket_status 
               FROM bookings b 
               LEFT JOIN tickets t ON t.booking_id = b.id 
               WHERE b.booking_reference = '" . $conn->real_escape_string($term) . "'";
      $result2 = $conn->query($sql2);
      
      if ($result2 && $result2->num_rows > 0) {
        $booking = $result2->fetch_assoc();
        break;
      }
    } else {
      $booking = $result->fetch_assoc();
      break;
    }
  }
  
  // If not found, try by numeric ID
  if (!$booking && is_numeric($booking_ref)) {
    $sql3 = "SELECT b.*, t.ticket_reference, t.seat_number, t.ticket_status 
             FROM bookings b 
             LEFT JOIN tickets t ON t.booking_id = b.id 
             WHERE b.id = " . intval($booking_ref);
    $result3 = $conn->query($sql3);
    if ($result3 && $result3->num_rows > 0) {
      $booking = $result3->fetch_assoc();
    }
  }
  
  if (!$booking) {
    echo json_encode(["status" => "error", "message" => "Booking not found with reference: " . $booking_ref]);
    exit;
  }
  
  // Get trip details
  $trip_sql = "SELECT tr.*, r.origin, r.destination, b.bus_number 
               FROM trips tr 
               JOIN routes r ON r.id = tr.route_id 
               JOIN buses b ON b.id = tr.bus_id 
               WHERE tr.id = " . intval($booking['trip_id']);
  $trip_result = $conn->query($trip_sql);
  $trip = $trip_result->fetch_assoc();
  
  // Check if driver is assigned to this trip
  $is_driver_assigned = false;
  if ($driver_id > 0) {
    $assign_sql = "SELECT id FROM driver_trip_assignments WHERE driver_id = " . intval($driver_id) . " AND trip_id = " . intval($booking['trip_id']) . " AND status = 'active'";
    $assign_result = $conn->query($assign_sql);
    $is_driver_assigned = ($assign_result && $assign_result->num_rows > 0);
  }
  
  // Get user details
  $user_sql = "SELECT name, email, phone FROM users WHERE id = " . intval($booking['user_id']);
  $user_result = $conn->query($user_sql);
  $user = $user_result->fetch_assoc();
  
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
