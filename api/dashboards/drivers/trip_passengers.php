<?php
// Get passengers for a specific trip - with driver verification
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
$trip_id = isset($input["trip_id"]) ? intval($input["trip_id"]) : 0;
$driver_id = isset($input["driver_id"]) ? intval($input["driver_id"]) : 0;

if ($method === "GET") {
  $trip_id = isset($_GET["trip_id"]) ? intval($_GET["trip_id"]) : 0;
  $driver_id = isset($_GET["driver_id"]) ? intval($_GET["driver_id"]) : 0;
}

if ($method === "GET" || $method === "POST") {
  if ($trip_id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "trip_id is required"]);
    exit;
  }
  
  if ($driver_id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "driver_id is required"]);
    exit;
  }
  
  // Verify the user is actually a driver
  $verify_sql = "SELECT id, role FROM users WHERE id = ?";
  $verify_stmt = $conn->prepare($verify_sql);
  $verify_stmt->bind_param("i", $driver_id);
  $verify_stmt->execute();
  $verify_result = $verify_stmt->get_result();
  
  if ($verify_result->num_rows === 0) {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "User not found"]);
    exit;
  }
  
  $user = $verify_result->fetch_assoc();
  if ($user['role'] !== 'driver') {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "Access denied. Driver role required."]);
    exit;
  }
  
  // Get driver record ID
  $driver_record_id = null;
  $driver_sql = "SELECT id FROM drivers WHERE user_id = ?";
  $driver_stmt = $conn->prepare($driver_sql);
  $driver_stmt->bind_param("i", $driver_id);
  $driver_stmt->execute();
  $driver_result = $driver_stmt->get_result();
  if ($driver_row = $driver_result->fetch_assoc()) {
    $driver_record_id = $driver_row['id'];
  }
  
  // SECURITY: Verify driver is assigned to this trip
  $is_assigned = false;
  
  // Check driver_trip_assignments table
  $check_table = $conn->query("SHOW TABLES LIKE 'driver_trip_assignments'");
  if ($check_table && $check_table->num_rows > 0 && $driver_record_id) {
    $assign_sql = "SELECT id FROM driver_trip_assignments WHERE driver_id = ? AND trip_id = ?";
    $assign_stmt = $conn->prepare($assign_sql);
    $assign_stmt->bind_param("ii", $driver_record_id, $trip_id);
    $assign_stmt->execute();
    $assign_result = $assign_stmt->get_result();
    if ($assign_result->num_rows > 0) {
      $is_assigned = true;
    }
  }
  
  // If not assigned via assignments table, check drivers table for assigned_bus_id or assigned_route_id
  if (!$is_assigned && $driver_id) {
    $driver_info_sql = "SELECT assigned_bus_id, assigned_route_id FROM drivers WHERE user_id = ?";
    $driver_info_stmt = $conn->prepare($driver_info_sql);
    $driver_info_stmt->bind_param("i", $driver_id);
    $driver_info_stmt->execute();
    $driver_info_result = $driver_info_stmt->get_result();
    
    if ($driver_info_row = $driver_info_result->fetch_assoc()) {
      // Check if trip uses the assigned bus
      if (!empty($driver_info_row['assigned_bus_id'])) {
        $trip_check = $conn->query("SELECT id FROM trips WHERE id = " . intval($trip_id) . " AND bus_id = " . intval($driver_info_row['assigned_bus_id']));
        if ($trip_check && $trip_check->num_rows > 0) {
          $is_assigned = true;
        }
      }
      // Check if trip uses the assigned route
      elseif (!empty($driver_info_row['assigned_route_id'])) {
        $trip_check = $conn->query("SELECT id FROM trips WHERE id = " . intval($trip_id) . " AND route_id = " . intval($driver_info_row['assigned_route_id']));
        if ($trip_check && $trip_check->num_rows > 0) {
          $is_assigned = true;
        }
      }
    }
  }
  
  // SECURITY: If driver is not assigned to this trip, deny access
  if (!$is_assigned) {
    http_response_code(403);
    echo json_encode(["status" => "error", "message" => "You are not assigned to this trip"]);
    exit;
  }
  
  // Get passengers for this trip from bookings and tickets tables
  $sql = "
  SELECT
    b.id AS booking_id,
    b.number_of_seats,
    b.total_price,
    b.booking_status,
    b.booking_date,
    b.booking_reference,
    u.name,
    u.email,
    u.phone,
    t.id AS ticket_id,
    t.seat_number,
    t.ticket_status
  FROM bookings b
  JOIN users u ON u.id = b.user_id
  LEFT JOIN tickets t ON t.booking_id = b.id
  WHERE b.trip_id = ?
  ORDER BY t.seat_number ASC, b.booking_date ASC
  ";

  $stmt = $conn->prepare($sql);
  if (!$stmt) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Prepare failed", "details" => $conn->error]);
    exit;
  }
  
  $stmt->bind_param("i", $trip_id);
  $stmt->execute();
  $result = $stmt->get_result();
  
  $passengers = [];
  $booking_seats = [];
  
  while ($row = $result->fetch_assoc()) {
    // If tickets exist, use ticket data
    if ($row['ticket_id']) {
      $passengers[] = [
        'id' => $row['ticket_id'],
        'booking_id' => $row['booking_id'],
        'name' => $row['name'],
        'email' => $row['email'],
        'phone' => $row['phone'],
        'seat_number' => $row['seat_number'],
        'booking_ref' => $row['booking_reference'] ?? ('BK' . str_pad($row['booking_id'], 6, '0', STR_PAD_LEFT)),
        'booking_status' => $row['booking_status'],
        'ticket_status' => $row['ticket_status']
      ];
    } else {
      // No tickets yet - use booking-level data with generated seat numbers
      $booking_key = $row['booking_id'];
      if (!isset($booking_seats[$booking_key])) {
        $booking_seats[$booking_key] = [
          'name' => $row['name'],
          'email' => $row['email'],
          'phone' => $row['phone'],
          'booking_id' => $row['booking_id'],
          'booking_ref' => $row['booking_reference'] ?? ('BK' . str_pad($row['booking_id'], 6, '0', STR_PAD_LEFT)),
          'booking_status' => $row['booking_status'],
          'seats' => []
        ];
        // Generate seat numbers
        for ($i = 1; $i <= $row['number_of_seats']; $i++) {
          $booking_seats[$booking_key]['seats'][] = $i;
        }
      }
    }
  }
  
  // If no tickets, expand bookings to individual passengers
  if (empty($passengers) && !empty($booking_seats)) {
    foreach ($booking_seats as $booking) {
      foreach ($booking['seats'] as $seat) {
        $passengers[] = [
          'id' => $booking['booking_id'],
          'booking_id' => $booking['booking_id'],
          'name' => $booking['name'],
          'email' => $booking['email'],
          'phone' => $booking['phone'],
          'seat_number' => $seat,
          'booking_ref' => $booking['booking_ref'],
          'booking_status' => $booking['booking_status'],
          'ticket_status' => 'valid'
        ];
      }
    }
  }
  
  echo json_encode(["status" => "success", "data" => $passengers]);
  exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
