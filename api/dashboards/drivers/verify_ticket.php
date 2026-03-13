<?php
// Turn off error display to return JSON instead of HTML
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
$trip_id = isset($input["trip_id"]) ? intval($input["trip_id"]) : 0;

if ($method === "GET") {
  $booking_ref = isset($_GET["booking_ref"]) ? trim($_GET["booking_ref"]) : "";
  $trip_id = isset($_GET["trip_id"]) ? intval($_GET["trip_id"]) : 0;
}

if ($method === "GET" || $method === "POST") {
  if (empty($booking_ref)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Booking reference is required"]);
    exit;
  }

  // First, find the booking by reference
  $sql = "SELECT 
    b.id AS booking_id,
    b.user_id,
    b.trip_id,
    b.booking_reference,
    b.number_of_seats,
    b.total_price,
    b.booking_status,
    b.booking_date,
    u.name AS user_name,
    u.email AS user_email,
    u.phone AS user_phone,
    t.departure_date,
    t.departure_time,
    t.arrival_time,
    t.origin,
    t.destination,
    t.bus_number,
    t.status AS trip_status
  FROM bookings b
  JOIN users u ON u.id = b.user_id
  JOIN (
    SELECT tr.id, tr.departure_date, tr.departure_time, tr.arrival_time, 
           r.origin, r.destination, b.bus_number, tr.status
    FROM trips tr
    JOIN routes r ON r.id = tr.route_id
    JOIN buses b ON b.id = tr.bus_id
  ) t ON t.id = b.trip_id
  WHERE b.booking_reference = ?";

  $stmt = $conn->prepare($sql);
  if (!$stmt) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Prepare failed", "details" => $conn->error]);
    exit;
  }
  
  $stmt->bind_param("s", $booking_ref);
  $stmt->execute();
  $result = $stmt->get_result();
  
  if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["status" => "error", "message" => "Booking not found"]);
    exit;
  }
  
  $booking = $result->fetch_assoc();
  
  // If trip_id is provided, verify it matches
  if ($trip_id > 0 && $booking['trip_id'] != $trip_id) {
    http_response_code(400);
    echo json_encode([
      "status" => "error", 
      "message" => "This booking is for a different trip",
      "details" => [
        "booking_trip" => $booking['trip_id'],
        "current_trip" => $trip_id
      ]
    ]);
    exit;
  }
  
  // Get seat numbers from tickets table
  $ticket_sql = "SELECT seat_number, ticket_status FROM tickets WHERE booking_id = ?";
  $ticket_stmt = $conn->prepare($ticket_sql);
  $ticket_stmt->bind_param("i", $booking['booking_id']);
  $ticket_stmt->execute();
  $ticket_result = $ticket_stmt->get_result();
  
  $seats = [];
  while ($ticket_row = $ticket_result->fetch_assoc()) {
    $seats[] = [
      'seat_number' => $ticket_row['seat_number'],
      'status' => $ticket_row['ticket_status']
    ];
  }
  
  // Build response
  $response = [
    "status" => "success",
    "data" => [
      "booking_id" => $booking['booking_id'],
      "booking_ref" => $booking['booking_reference'],
      "user_name" => $booking['user_name'],
      "user_email" => $booking['user_email'],
      "user_phone" => $booking['user_phone'],
      "trip_id" => $booking['trip_id'],
      "origin" => $booking['origin'],
      "destination" => $booking['destination'],
      "departure_date" => $booking['departure_date'],
      "departure_time" => $booking['departure_time'],
      "arrival_time" => $booking['arrival_time'],
      "bus_number" => $booking['bus_number'],
      "trip_status" => $booking['trip_status'],
      "number_of_seats" => $booking['number_of_seats'],
      "total_price" => $booking['total_price'],
      "booking_status" => $booking['booking_status'],
      "booking_date" => $booking['booking_date'],
      "seats" => $seats,
      "is_valid" => ($booking['booking_status'] === 'confirmed' && in_array($booking['trip_status'], ['scheduled', 'in-progress', 'ongoing']))
    ]
  ];
  
  echo json_encode($response);
  exit;
}

http_response_code(405);
echo json_encode(["status" => "error", "message" => "Method not allowed"]);
