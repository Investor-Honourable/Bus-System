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
$trip_id = isset($input["trip_id"]) ? intval($input["trip_id"]) : 0;

if ($method === "GET") {
  $trip_id = isset($_GET["trip_id"]) ? intval($_GET["trip_id"]) : 0;
}

if ($method === "GET" || $method === "POST") {
  if ($trip_id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "trip_id is required"]);
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
    AND b.booking_status IN ('confirmed', 'pending')
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
        'booking_ref' => 'BK' . str_pad($row['booking_id'], 6, '0', STR_PAD_LEFT),
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
          'booking_ref' => 'BK' . str_pad($booking['booking_id'], 6, '0', STR_PAD_LEFT),
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
