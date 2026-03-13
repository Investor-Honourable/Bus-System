<?php
require_once("../../config/db.php");

header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(200); exit; }

// Accept user_id or passenger_id, or return all for admin
$user_id = isset($_GET["user_id"]) ? intval($_GET["user_id"]) : 
           (isset($_GET["passenger_id"]) ? intval($_GET["passenger_id"]) : 0);

// For admin reports (no user_id), return all bookings
$isAdminReport = ($user_id <= 0);

if (!$isAdminReport && $user_id <= 0) {
  http_response_code(400);
  echo json_encode(["error" => "user_id is required"]);
  exit;
}

if ($isAdminReport) {
  // Return all bookings for admin reports
  $sql = "
  SELECT
    b.id AS booking_id,
    b.booking_reference,
    b.number_of_seats,
    b.total_price,
    b.booking_status,
    b.booking_date,
    b.travel_date,

    t.id AS trip_id,
    t.departure_date,
    t.departure_time,
    t.arrival_time,

    r.origin,
    r.destination,
    r.route_code,

    bs.bus_number,
    bs.bus_name,
    bs.bus_type,

    u.id AS user_id,
    u.name AS passenger_name,
    u.email AS passenger_email,
    u.phone AS passenger_phone
  FROM bookings b
  JOIN trips t ON t.id = b.trip_id
  JOIN routes r ON r.id = t.route_id
  JOIN buses bs ON bs.id = t.bus_id
  JOIN users u ON u.id = b.user_id
  ORDER BY b.booking_date DESC
  ";
  
  $res = $conn->query($sql);
  $bookings = [];
  while ($row = $res->fetch_assoc()) {
    $bookings[] = $row;
  }
  echo json_encode(["success" => true, "data" => $bookings, "bookings" => $bookings]);
  exit;
}

$sql = "
SELECT
  b.id AS booking_id,
  b.booking_reference,
  b.number_of_seats,
  b.total_price,
  b.booking_status,
  b.booking_date,
  b.travel_date,

  t.id AS trip_id,
  t.departure_date,
  t.departure_time,
  t.arrival_time,

  r.origin,
  r.destination,
  r.route_code,

  bs.bus_number,
  bs.bus_name,
  bs.bus_type
FROM bookings b
JOIN trips t ON t.id = b.trip_id
JOIN routes r ON r.id = t.route_id
JOIN buses bs ON bs.id = t.bus_id
WHERE b.user_id = ?
ORDER BY b.booking_date DESC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$res = $stmt->get_result();

$bookings = [];
while ($row = $res->fetch_assoc()) {
  // Get tickets for this booking
  $ticket_sql = "SELECT seat_number, passenger_name, passenger_phone, ticket_status FROM tickets WHERE booking_id = ?";
  $ticket_stmt = $conn->prepare($ticket_sql);
  $ticket_stmt->bind_param("i", $row['booking_id']);
  $ticket_stmt->execute();
  $ticket_res = $ticket_stmt->get_result();
  
  $tickets = [];
  while ($ticket_row = $ticket_res->fetch_assoc()) {
    $tickets[] = $ticket_row;
  }
  $row['tickets'] = $tickets;
  $ticket_stmt->close();
  
  $bookings[] = $row;
}

echo json_encode(["success" => true, "bookings" => $bookings]);
